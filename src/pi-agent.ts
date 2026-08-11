import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { resolve } from "node:path";
import { isApprovalRecord, type ApprovalRecord } from "./approval.js";
import { ApprovalService } from "./approval-service.js";
import { FileApprovalStore } from "./approval-store.js";
import { JsonlEventStore, type AgentEvent } from "./event-store.js";
import { isMatchingRunEventAppendOutcome, isRunEventReadOutcome } from "./run-event.js";
import {
  executeBoundedRun,
  resolveRunBounds,
  type BoundedRunStopReason,
  type CompletedRunStopReason,
} from "./run-lifecycle.js";
import type { QualificationOutcome } from "./qualification.js";
import { buildTools, qualificationOutcomeFromEvents } from "./tools.js";

export const PRODUCTION_TOOL_NAMES = Object.freeze([
  "qualify_lead",
  "draft_follow_up",
  "request_send_approval",
] as const);

export const WORKSHOP_APPROVAL_ACTOR_IDS = Object.freeze(["actor_workshop_reviewer"] as const);

const SYSTEM_PROMPT = `You are a bounded lead-operations agent.

Your job:
1. Call qualify_lead for the exact lead requested.
2. If qualification returns ok false, stop and report its code and message.
3. If qualification returns ok true, use only its validated fields and draft one relevant follow-up.
4. Create a pending human approval record for that exact lead.
5. Stop and report the approval ID.

Rules:
- Never invent lead data.
- Never invent or alter qualification fields.
- Never draft or request approval without a successful qualification.
- Never send a message.
- Never imply that a pending action was completed.
- Use only the provided tools.
- If the lead does not exist, stop clearly.
- Keep the final response short and factual.`;

function appendRunEvent(store: JsonlEventStore, input: unknown): boolean {
  try {
    const outcome: unknown = store.append(input);
    return isMatchingRunEventAppendOutcome(outcome, input);
  } catch {
    return false;
  }
}

function readRunEvents(store: JsonlEventStore, runId: string): AgentEvent[] | undefined {
  try {
    const outcome: unknown = store.readRun(runId);
    return isRunEventReadOutcome(outcome) && outcome.ok ? outcome.value : undefined;
  } catch {
    return undefined;
  }
}

function finalAssistantText(messages: unknown[]): string {
  for (const message of [...messages].reverse()) {
    const candidate = message as {
      role?: string;
      content?: Array<{ type?: string; text?: string }>;
    };
    if (candidate.role !== "assistant" || !Array.isArray(candidate.content)) continue;
    const text = candidate.content
      .filter((part) => part.type === "text")
      .map((part) => part.text ?? "")
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "Agent completed without a text response.";
}

export type RunResult = {
  runId: string;
  output: string;
  stopReason: RunStopReason;
  qualification: QualificationOutcome | null;
};

export type RunStopReason = CompletedRunStopReason | BoundedRunStopReason;

export function deriveRunStopReason(
  events: readonly AgentEvent[],
  requestedLeadId: string,
  approvalInput: unknown,
): CompletedRunStopReason {
  const qualification = qualificationOutcomeFromEvents(events, requestedLeadId);
  if (!qualification) return "qualification_failed";
  if (!qualification.ok) {
    return qualification.error.code === "lead_not_found" ? "not_found" : "qualification_failed";
  }

  let qualificationTerminalIndex = -1;
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const type = events[index]?.type;
    if (type === "qualification.completed" || type === "qualification.failed") {
      qualificationTerminalIndex = index;
      break;
    }
  }
  const qualificationTerminal = events[qualificationTerminalIndex];
  if (!qualificationTerminal || !Array.isArray(approvalInput)) return "approval_failed";
  if (!approvalInput.every(isApprovalRecord)) return "approval_failed";

  const qualificationAt = Date.parse(qualificationTerminal.at);
  if (!Number.isFinite(qualificationAt)) return "approval_failed";
  const approvals = approvalInput as ApprovalRecord[];
  const exact = approvals.filter(
    (approval) =>
      approval.runId === qualificationTerminal.runId &&
      approval.target.leadId === qualification.value.leadId &&
      Date.parse(approval.requestedAt) >= qualificationAt,
  );
  if (exact.length === 0) return "approval_failed";
  const latestAt = Math.max(...exact.map((approval) => Date.parse(approval.requestedAt)));
  const latest = exact.filter((approval) => Date.parse(approval.requestedAt) === latestAt);
  if (latest.length !== 1) return "approval_failed";
  const current = latest[0];
  if (!current) return "approval_failed";
  return current.status === "pending" ? "approval_pending" : "completed";
}

export function qualificationRunOutput(
  qualification: QualificationOutcome,
  assistantOutput: string,
): string {
  return qualification.ok ? assistantOutput : qualification.error.message;
}

export function runCompletionMetadata(stopReason: CompletedRunStopReason) {
  return {
    action: "run_complete" as const,
    result:
      stopReason === "approval_pending"
        ? ("pending" as const)
        : stopReason === "completed"
          ? ("succeeded" as const)
          : ("stopped" as const),
    stopReason,
    approvalState: stopReason === "approval_pending" ? ("pending" as const) : null,
  };
}

export async function runLeadAgent(leadId: string): Promise<RunResult> {
  const bounds = resolveRunBounds(process.env);
  const runId = crypto.randomUUID();
  const cwd = process.cwd();
  const eventPath = resolve(process.env.EVENT_LOG_PATH ?? "./data/events.jsonl");
  const approvalPath = resolve(process.env.APPROVAL_LOG_PATH ?? "./data/approvals.jsonl");
  const store = new JsonlEventStore(eventPath);
  const approvalStore = new FileApprovalStore(approvalPath);
  const approvalService = new ApprovalService(approvalStore, store, {
    authorizedActorIds: new Set(WORKSHOP_APPROVAL_ACTOR_IDS),
  });

  if (
    !appendRunEvent(store, {
      runId,
      type: "run.started",
      data: { eventType: "run.started", leadId },
      metadata: { action: "run_start", result: "attempted" },
    })
  ) {
    throw new Error("Run event storage is unavailable.");
  }

  const lifecycle = await executeBoundedRun({
    runId,
    prompt: `Qualify lead "${leadId}", draft the best first follow-up, request human approval, and stop.`,
    bounds,
    eventStore: store,
    createSession: async () => {
      const resourceLoader = new DefaultResourceLoader({
        cwd,
        agentDir: getAgentDir(),
        systemPromptOverride: () => SYSTEM_PROMPT,
      });
      await resourceLoader.reload();

      const modelRuntime = await ModelRuntime.create();
      const tools = buildTools(runId, leadId, store, approvalService);
      const { session } = await createAgentSession({
        cwd,
        modelRuntime,
        resourceLoader,
        customTools: [...tools],
        tools: [...PRODUCTION_TOOL_NAMES],
        sessionManager: SessionManager.inMemory(cwd),
      });
      return session;
    },
    complete: async (session) => {
      const events = readRunEvents(store, runId);
      if (!events) throw new Error("Run event storage is unavailable.");
      const qualification = qualificationOutcomeFromEvents(events, leadId);
      if (!qualification) {
        throw new Error("Qualification tool produced no valid terminal evidence.");
      }
      const approvalProjection = approvalService.listRun(runId);
      if (!approvalProjection.ok) throw new Error("Approval projection is unavailable.");
      const stopReason = deriveRunStopReason(events, leadId, approvalProjection.value);
      const output = qualificationRunOutput(
        qualification,
        finalAssistantText(session.agent.state.messages),
      );
      return {
        value: { runId, output, qualification },
        stopReason,
      };
    },
  });

  if (lifecycle.ok) {
    return Object.freeze({ ...lifecycle.value, stopReason: lifecycle.stopReason });
  }
  if (lifecycle.storageFailure) throw new Error("Run event storage is unavailable.");
  const output =
    lifecycle.stopReason === "deadline_exceeded"
      ? "Run deadline exceeded."
      : lifecycle.stopReason === "step_limit_exceeded"
        ? "Run step limit exceeded."
        : "Run dependency failed.";
  return {
    runId,
    output,
    stopReason: lifecycle.stopReason,
    qualification: null,
  };
}
