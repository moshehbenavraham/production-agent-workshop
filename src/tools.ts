import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { AgentEvent, JsonlEventStore } from "./event-store.js";
import { findLead, type Lead } from "./leads.js";
import {
  QualificationInputSchema,
  isQualificationFailure,
  isQualificationInput,
  isQualificationOutcome,
  isQualificationResult,
  makeQualificationFailure,
  qualifyLead,
  type QualificationOutcome,
} from "./qualification.js";

export { findLead, type Lead } from "./leads.js";

export const QUALIFICATION_TIMEOUT_MS = 1_000;

export type QualificationExecutor = (
  input: unknown,
) => unknown | Promise<unknown>;

export type QualificationExecutionOptions = {
  qualificationExecutor?: QualificationExecutor;
  timeoutMs?: number;
};

type DraftToolDetails = {
  created: boolean;
  draft: string | null;
  code: "qualification_required" | "lead_not_found" | null;
};

type Approval = ReturnType<typeof makeApproval>;

type ApprovalToolDetails = {
  created: boolean;
  approval: Approval | null;
  code: "qualification_required" | null;
};

async function boundedQualification(
  input: unknown,
  qualificationExecutor: QualificationExecutor,
  timeoutMs: number,
): Promise<QualificationOutcome> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Qualification timeout must be a positive finite number.");
  }

  let timer: NodeJS.Timeout | undefined;
  const execution = Promise.resolve()
    .then(() => qualificationExecutor(input))
    .then((candidate) =>
      isQualificationOutcome(candidate)
        ? candidate
        : makeQualificationFailure("lead_lookup_failed"),
    )
    .catch(() => makeQualificationFailure("lead_lookup_failed"));
  const timeout = new Promise<QualificationOutcome>((resolve) => {
    timer = setTimeout(
      () => resolve(makeQualificationFailure("qualification_timeout")),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([execution, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function executeQualification(
  runId: string,
  requestedLeadId: string,
  store: JsonlEventStore,
  input: unknown,
  options: QualificationExecutionOptions = {},
): Promise<QualificationOutcome> {
  const validatedInput = isQualificationInput(input) ? input : undefined;
  store.append({
    runId,
    type: "qualification.attempted",
    data: validatedInput ? { leadId: validatedInput.leadId } : {},
  });

  const outcome =
    validatedInput && validatedInput.leadId !== requestedLeadId
      ? makeQualificationFailure("invalid_input")
      : await boundedQualification(
          input,
          options.qualificationExecutor ?? qualifyLead,
          options.timeoutMs ?? QUALIFICATION_TIMEOUT_MS,
        );

  store.append({
    runId,
    type: outcome.ok ? "qualification.completed" : "qualification.failed",
    data: outcome.ok ? { ...outcome.value } : { ...outcome.error },
  });
  return outcome;
}

export function createQualificationTool(
  runId: string,
  requestedLeadId: string,
  store: JsonlEventStore,
  options: QualificationExecutionOptions = {},
) {
  return defineTool({
    name: "qualify_lead",
    label: "Qualify lead",
    description:
      "Return one application-validated qualification for the exact requested lead. Stop on structured failure.",
    parameters: QualificationInputSchema,
    executionMode: "sequential",
    execute: async (_toolCallId, params) => {
      const outcome = await executeQualification(
        runId,
        requestedLeadId,
        store,
        params,
        options,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(outcome) }],
        details: outcome,
      };
    },
  });
}

export function qualificationOutcomeFromEvents(
  events: readonly AgentEvent[],
): QualificationOutcome | undefined {
  for (const event of [...events].reverse()) {
    if (event.type === "qualification.completed") {
      return isQualificationResult(event.data)
        ? { ok: true, value: event.data }
        : undefined;
    }
    if (event.type === "qualification.failed") {
      return isQualificationFailure(event.data)
        ? { ok: false, error: event.data }
        : undefined;
    }
  }
  return undefined;
}

function hasValidatedQualification(
  runId: string,
  requestedLeadId: string,
  leadId: string,
  store: JsonlEventStore,
): boolean {
  if (leadId !== requestedLeadId) return false;
  const outcome = qualificationOutcomeFromEvents(store.readRun(runId));
  return Boolean(
    outcome?.ok && outcome.value.leadId === requestedLeadId,
  );
}

export function makeDraft(lead: Lead, angle: string): string {
  return [
    `Hi ${lead.name},`,
    "",
    `You mentioned that ${lead.problem.toLowerCase()}`,
    `${angle.trim()} looks like the most useful place to start.`,
    "",
    "If useful, I can map the smallest safe agent workflow with you.",
    "",
    "Quentin",
  ].join("\n");
}

export function makeApproval(runId: string, leadId: string, draft: string) {
  return {
    approvalId: crypto.randomUUID(),
    runId,
    leadId,
    action: "send_follow_up",
    status: "pending" as const,
    draft,
  };
}

export function buildTools(
  runId: string,
  requestedLeadId: string,
  store: JsonlEventStore,
  options: QualificationExecutionOptions = {},
) {
  const qualificationTool = createQualificationTool(
    runId,
    requestedLeadId,
    store,
    options,
  );

  const draftParameters = Type.Object(
    {
      leadId: QualificationInputSchema.properties.leadId,
      angle: Type.String({ minLength: 10, maxLength: 240 }),
    },
    { additionalProperties: false },
  );
  const draftFollowUp = defineTool<typeof draftParameters, DraftToolDetails>({
    name: "draft_follow_up",
    label: "Draft follow-up",
    description:
      "Create a deterministic follow-up only after application-validated qualification. This does not send anything.",
    parameters: draftParameters,
    executionMode: "sequential",
    execute: async (_toolCallId, params) => {
      if (!hasValidatedQualification(runId, requestedLeadId, params.leadId, store)) {
        return {
          content: [
            {
              type: "text",
              text: "Cannot draft: application-validated qualification is required for the exact run lead.",
            },
          ],
          details: {
            created: false,
            draft: null as string | null,
            code: "qualification_required" as const,
          },
        };
      }
      const lead = findLead(params.leadId);
      if (!lead) {
        return {
          content: [{ type: "text", text: `Cannot draft: unknown lead ${params.leadId}` }],
          details: {
            created: false,
            draft: null,
            code: "lead_not_found",
          },
        };
      }
      const draft = makeDraft(lead, params.angle);
      store.append({
        runId,
        type: "domain.follow_up_drafted",
        data: { leadId: params.leadId, draft },
      });
      return {
        content: [{ type: "text", text: draft }],
        details: { created: true, draft, code: null },
      };
    },
  });

  const approvalParameters = Type.Object(
    {
      leadId: QualificationInputSchema.properties.leadId,
      draft: Type.String({ minLength: 20 }),
    },
    { additionalProperties: false },
  );
  const requestSendApproval = defineTool<
    typeof approvalParameters,
    ApprovalToolDetails
  >({
    name: "request_send_approval",
    label: "Request send approval",
    description:
      "Create a pending human approval record. This tool never sends the message.",
    parameters: approvalParameters,
    executionMode: "sequential",
    execute: async (_toolCallId, params) => {
      if (!hasValidatedQualification(runId, requestedLeadId, params.leadId, store)) {
        return {
          content: [
            {
              type: "text",
              text: "Approval not created: application-validated qualification is required for the exact run lead.",
            },
          ],
          details: {
            created: false,
            approval: null,
            code: "qualification_required" as const,
          },
        };
      }
      const approval = makeApproval(runId, params.leadId, params.draft);
      store.append({
        runId,
        type: "approval.requested",
        data: approval,
      });
      return {
        content: [
          {
            type: "text",
            text: `Approval ${approval.approvalId} is pending. Stop; do not send.`,
          },
        ],
        details: { created: true, approval, code: null },
      };
    },
  });

  return [qualificationTool, draftFollowUp, requestSendApproval] as const;
}
