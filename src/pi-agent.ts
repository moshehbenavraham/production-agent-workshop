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

function boundedCode(value: unknown): string | null {
  return typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 80 &&
    /^[a-z][a-z0-9_.-]*$/.test(value)
    ? value
    : null;
}

function boundedIdentifier(value: unknown): string | null {
  return typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 120 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/.test(value)
    ? value
    : null;
}

function unknownPiEvent() {
  return {
    eventType: "pi.lifecycle" as const,
    sourceType: "unknown",
    toolName: null,
    toolCallId: null,
    isError: null,
    messageId: null,
    stopReason: null,
  };
}

function normalizedPiEvent(event: unknown) {
  try {
    if (typeof event !== "object" || event === null) return unknownPiEvent();
    const candidate = event as Record<string, unknown>;
    const toolName =
      typeof candidate.toolName === "string" &&
      candidate.toolName.length <= 80 &&
      /^[a-z][a-z0-9_]+$/.test(candidate.toolName)
        ? candidate.toolName
        : null;
    const stopReason = boundedCode(candidate.stopReason);
    return {
      eventType: "pi.lifecycle" as const,
      sourceType: boundedCode(candidate.type) ?? "unknown",
      toolName,
      toolCallId: boundedIdentifier(candidate.toolCallId),
      isError: typeof candidate.isError === "boolean" ? candidate.isError : null,
      messageId: boundedIdentifier(candidate.messageId),
      stopReason,
    };
  } catch {
    return unknownPiEvent();
  }
}

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
  qualification: QualificationOutcome;
};

export type RunStopReason =
  | "approval_pending"
  | "approval_failed"
  | "not_found"
  | "qualification_failed"
  | "completed";

export function deriveRunStopReason(
  events: readonly AgentEvent[],
  requestedLeadId: string,
  approvalInput: unknown,
): RunStopReason {
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

export function runCompletionMetadata(stopReason: RunStopReason) {
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

  let lifecycleEventFailure = false;
  const unsubscribe = session.subscribe((event) => {
    const data = normalizedPiEvent(event);
    const appended = appendRunEvent(store, {
      runId,
      type: data.eventType,
      data,
      metadata: {
        actor: { kind: data.toolName ? "tool" : "model", id: null },
        action: "pi_lifecycle",
        tool: data.toolName ? { name: data.toolName, callId: data.toolCallId } : null,
        result: data.isError === null ? null : data.isError ? "failed" : "succeeded",
        errorCode: data.isError ? "pi_event_error" : null,
        stopReason: data.stopReason,
      },
    });
    if (!appended) lifecycleEventFailure = true;
  });

  try {
    await session.prompt(
      `Qualify lead "${leadId}", draft the best first follow-up, request human approval, and stop.`,
    );
    if (lifecycleEventFailure) {
      throw new Error("Run event storage is unavailable.");
    }
    const events = readRunEvents(store, runId);
    if (!events) {
      throw new Error("Run event storage is unavailable.");
    }
    const qualification = qualificationOutcomeFromEvents(events, leadId);
    if (!qualification) {
      throw new Error("Qualification tool produced no valid terminal evidence.");
    }
    const approvalProjection = approvalService.listRun(runId);
    if (!approvalProjection.ok) {
      throw new Error("Approval projection is unavailable.");
    }
    const stopReason = deriveRunStopReason(events, leadId, approvalProjection.value);
    const output = qualificationRunOutput(
      qualification,
      finalAssistantText(session.agent.state.messages),
    );
    if (
      !appendRunEvent(store, {
        runId,
        type: "run.completed",
        data: { eventType: "run.completed", stopReason },
        metadata: runCompletionMetadata(stopReason),
      })
    ) {
      throw new Error("Run event storage is unavailable.");
    }
    return { runId, output, stopReason, qualification };
  } catch {
    const appended = appendRunEvent(store, {
      runId,
      type: "run.failed",
      data: { eventType: "run.failed", code: "agent_run_failed" },
      metadata: {
        action: "run_fail",
        result: "failed",
        errorCode: "agent_run_failed",
      },
    });
    throw new Error(appended ? "Agent run failed." : "Run event storage is unavailable.");
  } finally {
    unsubscribe();
    session.dispose();
  }
}
