import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { resolve } from "node:path";
import { JsonlEventStore, type AgentEvent } from "./event-store.js";
import type { QualificationOutcome } from "./qualification.js";
import { buildTools, qualificationOutcomeFromEvents } from "./tools.js";

export const PRODUCTION_TOOL_NAMES = Object.freeze([
  "qualify_lead",
  "draft_follow_up",
  "request_send_approval",
] as const);

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

function eventData(event: Record<string, unknown>): Record<string, unknown> {
  const allowed = ["type", "toolName", "toolCallId", "isError", "messageId", "stopReason"];
  return Object.fromEntries(allowed.filter((key) => key in event).map((key) => [key, event[key]]));
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

export type RunStopReason = "approval_pending" | "not_found" | "qualification_failed" | "completed";

export function deriveRunStopReason(
  events: readonly AgentEvent[],
  requestedLeadId: string,
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
  const approvalPending = events
    .slice(qualificationTerminalIndex + 1)
    .some(
      (event) =>
        event.type === "approval.requested" &&
        event.data.status === "pending" &&
        event.data.leadId === qualification.value.leadId,
    );
  return approvalPending ? "approval_pending" : "completed";
}

export function qualificationRunOutput(
  qualification: QualificationOutcome,
  assistantOutput: string,
): string {
  return qualification.ok ? assistantOutput : qualification.error.message;
}

export async function runLeadAgent(leadId: string): Promise<RunResult> {
  const runId = crypto.randomUUID();
  const cwd = process.cwd();
  const eventPath = resolve(process.env.EVENT_LOG_PATH ?? "./data/events.jsonl");
  const store = new JsonlEventStore(eventPath);

  store.append({
    runId,
    type: "run.started",
    data: { leadId },
  });

  const resourceLoader = new DefaultResourceLoader({
    cwd,
    agentDir: getAgentDir(),
    systemPromptOverride: () => SYSTEM_PROMPT,
  });
  await resourceLoader.reload();

  const modelRuntime = await ModelRuntime.create();
  const tools = buildTools(runId, leadId, store);
  const { session } = await createAgentSession({
    cwd,
    modelRuntime,
    resourceLoader,
    customTools: [...tools],
    tools: [...PRODUCTION_TOOL_NAMES],
    sessionManager: SessionManager.inMemory(cwd),
  });

  const unsubscribe = session.subscribe((event) => {
    const raw = event as unknown as Record<string, unknown>;
    store.append({
      runId,
      type: `pi.${String(raw.type ?? "unknown")}`,
      data: eventData(raw),
    });
  });

  try {
    await session.prompt(
      `Qualify lead "${leadId}", draft the best first follow-up, request human approval, and stop.`,
    );
    const events = store.readRun(runId);
    const qualification = qualificationOutcomeFromEvents(events, leadId);
    if (!qualification) {
      throw new Error("Qualification tool produced no valid terminal evidence.");
    }
    const stopReason = deriveRunStopReason(events, leadId);
    const output = qualificationRunOutput(
      qualification,
      finalAssistantText(session.agent.state.messages),
    );
    store.append({
      runId,
      type: "run.completed",
      data: { stopReason },
    });
    return { runId, output, stopReason, qualification };
  } catch (error) {
    store.append({
      runId,
      type: "run.failed",
      data: { error: error instanceof Error ? error.message : String(error) },
    });
    throw error;
  } finally {
    unsubscribe();
    session.dispose();
  }
}
