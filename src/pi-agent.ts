import {
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  ModelRuntime,
  SessionManager,
} from "@earendil-works/pi-coding-agent";
import { resolve } from "node:path";
import { JsonlEventStore } from "./event-store.js";
import { buildTools } from "./tools.js";

const SYSTEM_PROMPT = `You are a bounded lead-operations agent.

Your job:
1. Inspect the exact lead requested.
2. If the lead exists, draft one relevant follow-up.
3. Create a pending human approval record.
4. Stop and report the approval ID.

Rules:
- Never invent lead data.
- Never send a message.
- Never imply that a pending action was completed.
- Use only the provided tools.
- If the lead does not exist, stop clearly.
- Keep the final response short and factual.`;

function eventData(event: Record<string, unknown>): Record<string, unknown> {
  const allowed = [
    "type",
    "toolName",
    "toolCallId",
    "isError",
    "messageId",
    "stopReason",
  ];
  return Object.fromEntries(
    allowed.filter((key) => key in event).map((key) => [key, event[key]]),
  );
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
  stopReason: "approval_pending" | "not_found" | "completed";
};

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
  const tools = buildTools(runId, store);
  const { session } = await createAgentSession({
    cwd,
    modelRuntime,
    resourceLoader,
    customTools: tools,
    tools: ["inspect_lead", "draft_follow_up", "request_send_approval"],
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
    const approvalPending = events.some((event) => event.type === "approval.requested");
    const found = events.some(
      (event) => event.type === "domain.lead_inspected" && event.data.found === true,
    );
    const stopReason = approvalPending
      ? "approval_pending"
      : found
        ? "completed"
        : "not_found";
    const output = finalAssistantText(session.agent.state.messages);
    store.append({
      runId,
      type: "run.completed",
      data: { stopReason },
    });
    return { runId, output, stopReason };
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
