import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import {
  createPendingApproval,
  hashApprovalDraft,
  type ApprovalFailureCode,
  type PendingApproval,
} from "./approval.js";
import type { ApprovalService } from "./approval-service.js";
import type { AgentEvent } from "./event-store.js";
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
import {
  isMatchingRunEventAppendOutcome,
  isRunEventReadOutcome,
  type RunEventStore,
} from "./run-event.js";

export { findLead, type Lead } from "./leads.js";

export const QUALIFICATION_TIMEOUT_MS = 1_000;

export type QualificationExecutor = (input: unknown) => unknown | Promise<unknown>;

export type QualificationExecutionOptions = {
  qualificationExecutor?: QualificationExecutor;
  timeoutMs?: number;
};

export type ToolEventStore = Pick<RunEventStore, "append" | "readRun">;

function appendToolEvent(store: ToolEventStore, input: unknown): boolean {
  try {
    const outcome: unknown = store.append(input);
    return isMatchingRunEventAppendOutcome(outcome, input);
  } catch {
    return false;
  }
}

type DraftToolDetails = {
  created: boolean;
  draft: string | null;
  draftId: string | null;
  sha256: string | null;
  code: "qualification_required" | "lead_not_found" | "storage_failure" | null;
};

type DraftEvidence = {
  leadId: string;
  draftId: string;
  sha256: string;
  content: string;
};

type ApprovalToolDetails = {
  created: boolean;
  approval: PendingApproval | null;
  code: "qualification_required" | "draft_mismatch" | ApprovalFailureCode | null;
};

async function boundedQualification(
  input: unknown,
  qualificationExecutor: QualificationExecutor,
  timeoutMs: number,
): Promise<QualificationOutcome> {
  let timer: NodeJS.Timeout | undefined;
  const execution = Promise.resolve()
    .then(() => qualificationExecutor(input))
    .then((candidate) => {
      if (!isQualificationOutcome(candidate)) {
        return makeQualificationFailure("lead_lookup_failed");
      }
      return candidate.ok ? candidate : makeQualificationFailure(candidate.error.code);
    })
    .catch(() => makeQualificationFailure("lead_lookup_failed"));
  const timeout = new Promise<QualificationOutcome>((resolve) => {
    timer = setTimeout(() => resolve(makeQualificationFailure("qualification_timeout")), timeoutMs);
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
  store: ToolEventStore,
  input: unknown,
  options: QualificationExecutionOptions = {},
): Promise<QualificationOutcome> {
  const timeoutMs = options.timeoutMs ?? QUALIFICATION_TIMEOUT_MS;
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("Qualification timeout must be a positive finite number.");
  }

  const validatedInput = isQualificationInput(input) ? input : undefined;
  const attempted = {
    runId,
    type: "qualification.attempted",
    data: {
      eventType: "qualification.attempted",
      ...(validatedInput ? { leadId: validatedInput.leadId } : {}),
    },
    metadata: {
      action: "qualify_lead",
      tool: { name: "qualify_lead", callId: null },
      validatedArguments: validatedInput ? { leadId: validatedInput.leadId } : null,
      result: "attempted",
    },
  };
  if (!appendToolEvent(store, attempted)) {
    return makeQualificationFailure("lead_lookup_failed");
  }

  let outcome: QualificationOutcome;
  if (validatedInput && validatedInput.leadId !== requestedLeadId) {
    outcome = makeQualificationFailure("invalid_input");
  } else {
    const candidate = await boundedQualification(
      input,
      options.qualificationExecutor ?? qualifyLead,
      timeoutMs,
    );
    outcome =
      candidate.ok && candidate.value.leadId !== requestedLeadId
        ? makeQualificationFailure("lead_lookup_failed")
        : candidate;
  }

  const terminal = {
    runId,
    type: outcome.ok ? "qualification.completed" : "qualification.failed",
    data: outcome.ok
      ? { eventType: "qualification.completed", result: outcome.value }
      : { eventType: "qualification.failed", error: outcome.error },
    metadata: {
      action: "qualify_lead",
      tool: { name: "qualify_lead", callId: null },
      validatedArguments: validatedInput ? { leadId: validatedInput.leadId } : null,
      result: outcome.ok ? "succeeded" : "failed",
      errorCode: outcome.ok ? null : outcome.error.code,
    },
  };
  return appendToolEvent(store, terminal)
    ? outcome
    : makeQualificationFailure("lead_lookup_failed");
}

export function createQualificationTool(
  runId: string,
  requestedLeadId: string,
  store: ToolEventStore,
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
      const outcome = await executeQualification(runId, requestedLeadId, store, params, options);
      return {
        content: [{ type: "text", text: JSON.stringify(outcome) }],
        details: outcome,
      };
    },
  });
}

export function qualificationOutcomeFromEvents(
  events: readonly AgentEvent[],
  requestedLeadId: string,
): QualificationOutcome | undefined {
  for (const event of [...events].reverse()) {
    if (
      event.type === "qualification.completed" &&
      event.data.eventType === "qualification.completed"
    ) {
      return isQualificationResult(event.data.result) &&
        event.data.result.leadId === requestedLeadId
        ? { ok: true, value: event.data.result }
        : undefined;
    }
    if (event.type === "qualification.failed" && event.data.eventType === "qualification.failed") {
      return isQualificationFailure(event.data.error)
        ? makeQualificationFailure(event.data.error.code)
        : undefined;
    }
  }
  return undefined;
}

type ToolEventReadOutcome = { ok: true; value: AgentEvent[] } | { ok: false };

function readToolEvents(store: ToolEventStore, runId: string): ToolEventReadOutcome {
  try {
    const outcome: unknown = store.readRun(runId);
    return isRunEventReadOutcome(outcome) &&
      outcome.ok &&
      outcome.value.every((event) => event.runId === runId)
      ? { ok: true, value: outcome.value }
      : { ok: false };
  } catch {
    return { ok: false };
  }
}

function validatedQualificationEvidence(
  runId: string,
  requestedLeadId: string,
  leadId: string,
  store: ToolEventStore,
): { ok: true; value: boolean } | { ok: false } {
  if (leadId !== requestedLeadId) return { ok: true, value: false };
  const events = readToolEvents(store, runId);
  if (!events.ok) return events;
  try {
    const outcome = qualificationOutcomeFromEvents(events.value, requestedLeadId);
    return {
      ok: true,
      value: Boolean(outcome?.ok && outcome.value.leadId === requestedLeadId),
    };
  } catch {
    return { ok: false };
  }
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
  const outcome = createPendingApproval({ runId, leadId, action: "send_follow_up", draft });
  if (!outcome.ok) throw new Error(outcome.error.message);
  return outcome.value;
}

function hasCurrentDraftEvidence(
  events: readonly AgentEvent[],
  requestedLeadId: string,
  evidence: DraftEvidence,
): boolean {
  let qualificationIndex = -1;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    if (
      events[index]?.type === "qualification.completed" ||
      events[index]?.type === "qualification.failed"
    ) {
      qualificationIndex = index;
      break;
    }
  }
  if (qualificationIndex < 0) return false;

  for (let index = events.length - 1; index > qualificationIndex; index -= 1) {
    const event = events[index];
    if (
      event?.type !== "domain.follow_up_drafted" ||
      event.data.eventType !== "domain.follow_up_drafted"
    ) {
      continue;
    }
    return (
      evidence.leadId === requestedLeadId &&
      event.data.leadId === evidence.leadId &&
      event.data.draftId === evidence.draftId &&
      event.data.sha256 === evidence.sha256
    );
  }
  return false;
}

export function buildTools(
  runId: string,
  requestedLeadId: string,
  store: ToolEventStore,
  approvalService: ApprovalService,
  options: QualificationExecutionOptions = {},
) {
  const qualificationTool = createQualificationTool(runId, requestedLeadId, store, options);
  let latestDraft: DraftEvidence | undefined;

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
      const qualificationEvidence = validatedQualificationEvidence(
        runId,
        requestedLeadId,
        params.leadId,
        store,
      );
      if (!qualificationEvidence.ok) {
        return {
          content: [{ type: "text", text: "Cannot draft: event storage is unavailable." }],
          details: {
            created: false,
            draft: null,
            draftId: null,
            sha256: null,
            code: "storage_failure" as const,
          },
        };
      }
      if (!qualificationEvidence.value) {
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
            draftId: null as string | null,
            sha256: null as string | null,
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
            draftId: null,
            sha256: null,
            code: "lead_not_found",
          },
        };
      }
      const draft = makeDraft(lead, params.angle);
      const draftId = `draft_${crypto.randomUUID()}`;
      const sha256 = hashApprovalDraft(draft);
      const evidence = { leadId: params.leadId, draftId, sha256, content: draft };
      const draftedEvent = {
        runId,
        type: "domain.follow_up_drafted",
        data: {
          eventType: "domain.follow_up_drafted",
          leadId: params.leadId,
          draftId,
          sha256,
        },
        metadata: {
          action: "draft_follow_up",
          tool: { name: "draft_follow_up", callId: null },
          validatedArguments: { leadId: params.leadId },
          result: "succeeded",
        },
      };
      if (!appendToolEvent(store, draftedEvent)) {
        return {
          content: [{ type: "text", text: "Cannot draft: event storage is unavailable." }],
          details: {
            created: false,
            draft: null,
            draftId: null,
            sha256: null,
            code: "storage_failure" as const,
          },
        };
      }
      latestDraft = evidence;
      return {
        content: [{ type: "text", text: draft }],
        details: { created: true, draft, draftId, sha256, code: null },
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
  const requestSendApproval = defineTool<typeof approvalParameters, ApprovalToolDetails>({
    name: "request_send_approval",
    label: "Request send approval",
    description: "Create a pending human approval record. This tool never sends the message.",
    parameters: approvalParameters,
    executionMode: "sequential",
    execute: async (_toolCallId, params) => {
      const qualificationEvidence = validatedQualificationEvidence(
        runId,
        requestedLeadId,
        params.leadId,
        store,
      );
      if (!qualificationEvidence.ok) {
        return {
          content: [{ type: "text", text: "Approval not created: event storage is unavailable." }],
          details: {
            created: false,
            approval: null,
            code: "storage_failure" as const,
          },
        };
      }
      if (!qualificationEvidence.value) {
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
      const events = readToolEvents(store, runId);
      if (!events.ok) {
        return {
          content: [{ type: "text", text: "Approval not created: event storage is unavailable." }],
          details: {
            created: false,
            approval: null,
            code: "storage_failure" as const,
          },
        };
      }
      if (
        !latestDraft ||
        latestDraft.leadId !== params.leadId ||
        latestDraft.content !== params.draft ||
        latestDraft.sha256 !== hashApprovalDraft(params.draft) ||
        !hasCurrentDraftEvidence(events.value, requestedLeadId, latestDraft)
      ) {
        return {
          content: [
            {
              type: "text",
              text: "Approval not created: the latest exact application-produced draft is required.",
            },
          ],
          details: {
            created: false,
            approval: null,
            code: "draft_mismatch" as const,
          },
        };
      }
      const outcome = approvalService.requestApproval(
        {
          runId,
          leadId: params.leadId,
          action: "send_follow_up",
          draft: latestDraft.content,
        },
        { draftId: latestDraft.draftId },
      );
      if (!outcome.ok) {
        return {
          content: [{ type: "text", text: outcome.error.message }],
          details: { created: false, approval: null, code: outcome.error.code },
        };
      }
      const approval = outcome.value;
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
