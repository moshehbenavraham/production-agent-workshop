import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Schema from "typebox/schema";
import { ApprovalService } from "./approval-service.js";
import { FileApprovalStore } from "./approval-store.js";
import { JsonlEventStore, type AgentEvent } from "./event-store.js";
import { FileFakeSendResultStore } from "./fake-send-store.js";
import {
  deriveFakeSendIdempotencyKey,
  makeFakeSendFailure,
  type FakeSendAdapter,
} from "./fake-send.js";
import type { FakeSendReservation } from "./fake-send-result.js";
import {
  PRODUCTION_TOOL_NAMES,
  deriveRunStopReason,
  qualificationRunOutput,
  runCompletionMetadata,
} from "./pi-agent.js";
import {
  type ProductionEvalCase,
  ProductionEvalEventTypeSchema,
  type ProductionEvalExpectation,
  type ProductionEvalOutputClaim,
  type ProductionEvalProhibitedClaim,
  type ProductionEvalScalar,
  type ProductionEvalTraceEntry,
} from "./production-eval.js";
import {
  isProductionEvalObservation,
  type ProductionEvalObservation,
  type ProductionEvalObservedToolCall,
} from "./production-eval-runner.js";
import { qualifyLead, type QualificationOutcome } from "./qualification.js";
import { RecoveryApplication } from "./recovery-application.js";
import { isMatchingRunEventAppendOutcome, isRunEventReadOutcome } from "./run-event.js";
import {
  executeBoundedRun,
  type BoundedRunSession,
  type RunLifecycleOutcome,
} from "./run-lifecycle.js";
import { SafeWriteApplication } from "./safe-write-application.js";
import { buildTools } from "./tools.js";

const ANGLE = "Start with one auditable support-triage workflow.";
const APPROVAL_ACTOR_ID = "actor_workshop_reviewer";
const EXECUTION_ACTOR_ID = "actor_workshop_operator";
const FABRICATED_DRAFT = "A fabricated ungrounded approval draft.";
const eventTypeValidator = Schema.Compile(ProductionEvalEventTypeSchema);

type HarnessPaths = {
  eventPath: string;
  approvalPath: string;
  resultPath: string;
};

type ExecutableTool = {
  execute(
    toolCallId: string,
    params: unknown,
    signal: AbortSignal | undefined,
    onUpdate: undefined,
    context: never,
  ): Promise<{ content: Array<{ type: string; text?: string }>; details: unknown }>;
};

type FlowState = {
  runId: string;
  requestedLeadId: string | null;
  qualification: QualificationOutcome | null;
  draft: string | null;
  approvalId: string | null;
  approvalState: "pending" | "approved" | "declined" | null;
  stopReason: ProductionEvalExpectation["outcome"]["stopReason"];
  safeOutput: string;
  toolCalls: ProductionEvalObservedToolCall[];
};

type MutableObservedState = {
  outcome: ProductionEvalExpectation["outcome"];
  toolCalls: ProductionEvalObservedToolCall[];
  requestedLeadId: string | null;
  qualificationLeadId: string | null;
  draftLeadId: string | null;
  fabricated: boolean;
  permission: ProductionEvalExpectation["permission"];
  recovery: ProductionEvalExpectation["recovery"];
  claims: ProductionEvalOutputClaim[];
  prohibitedClaimsPresent: ProductionEvalProhibitedClaim[];
  responseCode: string;
  draftContent: string | null;
  approvalId: string | null;
  runId: string | null;
  responseText: string;
};

function paths(directory: string): HarnessPaths {
  return {
    eventPath: join(directory, "events.jsonl"),
    approvalPath: join(directory, "approvals.jsonl"),
    resultPath: join(directory, "fake-send-results.jsonl"),
  };
}

function runIdFor(caseDefinition: ProductionEvalCase): string {
  return `run_${caseDefinition.id.slice("eval_".length)}`;
}

function requestLeadId(caseDefinition: ProductionEvalCase): string | null {
  const request = caseDefinition.fixture.request;
  if (request.kind === "lead" || request.kind === "adversarial") return request.leadId;
  if (request.kind === "ambiguous") return request.fixtureId;
  return null;
}

function appendEvent(store: JsonlEventStore, input: unknown): void {
  if (!isMatchingRunEventAppendOutcome(store.append(input), input)) {
    throw new Error("Synthetic eval event storage failed.");
  }
}

function appendStart(store: JsonlEventStore, runId: string, leadId: string): void {
  appendEvent(store, {
    runId,
    type: "run.started",
    data: { eventType: "run.started", leadId },
    metadata: { action: "run_start", result: "attempted" },
  });
}

function appendCompleted(
  store: JsonlEventStore,
  runId: string,
  stopReason:
    | "approval_pending"
    | "approval_failed"
    | "not_found"
    | "qualification_failed"
    | "completed",
): void {
  appendEvent(store, {
    runId,
    type: "run.completed",
    data: { eventType: "run.completed", stopReason },
    metadata: runCompletionMetadata(stopReason),
  });
}

function readEvents(store: JsonlEventStore, runId: string): AgentEvent[] {
  const outcome = store.readRun(runId);
  if (!isRunEventReadOutcome(outcome) || !outcome.ok) {
    throw new Error("Synthetic eval event projection failed.");
  }
  return outcome.value;
}

function isProductionToolName(value: unknown): value is (typeof PRODUCTION_TOOL_NAMES)[number] {
  return (
    typeof value === "string" &&
    PRODUCTION_TOOL_NAMES.includes(value as (typeof PRODUCTION_TOOL_NAMES)[number])
  );
}

function minimizedArguments(value: unknown): Record<string, ProductionEvalScalar> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const result: Record<string, ProductionEvalScalar> = {};
  for (const [key, candidate] of Object.entries(value).slice(0, 8)) {
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(key)) continue;
    if (
      candidate === null ||
      typeof candidate === "string" ||
      typeof candidate === "number" ||
      typeof candidate === "boolean"
    ) {
      result[key] = typeof candidate === "string" ? candidate.slice(0, 240) : candidate;
    }
  }
  return Object.keys(result).length === 0 ? null : result;
}

function traceFromEvents(events: readonly AgentEvent[]): ProductionEvalTraceEntry[] {
  return events.map((event, index) => {
    if (!eventTypeValidator.Check(event.type)) {
      throw new Error("Synthetic eval emitted an unsupported event type.");
    }
    const toolName = event.metadata.tool?.name;
    const result = event.metadata.result;
    return {
      index,
      eventType: event.type as ProductionEvalTraceEntry["eventType"],
      tool: isProductionToolName(toolName) ? toolName : null,
      validatedArguments: minimizedArguments(event.metadata.validatedArguments),
      result: typeof result === "string" && /^[a-z][a-z0-9.-]*$/.test(result) ? result : null,
      stopReason: event.metadata.stopReason as ProductionEvalTraceEntry["stopReason"],
    };
  });
}

async function executeTool(tool: unknown, params: Record<string, ProductionEvalScalar>) {
  const executable = tool as ExecutableTool;
  if (typeof executable?.execute !== "function") {
    throw new Error("Synthetic eval tool boundary is invalid.");
  }
  return executable.execute(
    "tool_call_production_eval",
    params,
    undefined,
    undefined,
    undefined as never,
  );
}

function sparseQualification(input: unknown): QualificationOutcome {
  return qualifyLead(input, (leadId) =>
    leadId === "lead_sparse"
      ? {
          id: "lead_sparse",
          name: "Synthetic",
          company: "Example",
          teamSize: 1,
          stack: [],
          problem: "Needs more detail before outreach.",
        }
      : undefined,
  );
}

function qualificationExecutor(caseDefinition: ProductionEvalCase) {
  const selector = caseDefinition.fixture.boundaries.qualification;
  if (selector === "timeout") {
    return () => new Promise<QualificationOutcome>(() => undefined);
  }
  if (selector === "downstream_failure") {
    return () => ({
      ok: false as const,
      error: {
        code: "lead_lookup_failed" as const,
        message: "Lead lookup failed.",
        retryable: true,
      },
    });
  }
  if (caseDefinition.fixture.request.kind === "ambiguous") return sparseQualification;
  return qualifyLead;
}

function qualificationParams(
  caseDefinition: ProductionEvalCase,
): Record<string, ProductionEvalScalar> {
  const request = caseDefinition.fixture.request;
  if (request.kind === "lead" || request.kind === "adversarial") return { leadId: request.leadId };
  if (request.kind === "ambiguous") return { leadId: request.fixtureId };
  if (request.kind === "malformed_lead_id") return { leadId: request.value };
  return {};
}

async function executeGroundedFlow(
  caseDefinition: ProductionEvalCase,
  files: HarnessPaths,
): Promise<FlowState> {
  const requestedLeadId = requestLeadId(caseDefinition);
  if (!requestedLeadId) throw new Error("Grounded flow requires a lead identity.");
  const runId = runIdFor(caseDefinition);
  const store = new JsonlEventStore(files.eventPath);
  appendStart(store, runId, requestedLeadId);
  const approvalStore = new FileApprovalStore(files.approvalPath);
  const approvals = new ApprovalService(approvalStore, store, {
    authorizedActorIds: new Set([APPROVAL_ACTOR_ID]),
  });
  const [qualificationTool, draftTool, approvalTool] = buildTools(
    runId,
    requestedLeadId,
    store,
    approvals,
    {
      qualificationExecutor: qualificationExecutor(caseDefinition),
      timeoutMs: caseDefinition.fixture.boundaries.qualification === "timeout" ? 1 : 100,
    },
  );
  const toolCalls: ProductionEvalObservedToolCall[] = [];
  const qualificationArguments = qualificationParams(caseDefinition);
  toolCalls.push({ tool: "qualify_lead", arguments: qualificationArguments });
  const qualificationResult = await executeTool(qualificationTool, qualificationArguments);
  const qualification = qualificationResult.details as QualificationOutcome;
  if (typeof qualification !== "object" || qualification === null || !("ok" in qualification)) {
    throw new Error("Qualification observation is invalid.");
  }

  let draft: string | null = null;
  let approvalId: string | null = null;
  let approvalState: "pending" | "approved" | "declined" | null = null;
  if (qualification.ok && caseDefinition.expectation.tools.includes("draft_follow_up")) {
    const draftArguments = { leadId: requestedLeadId, angle: ANGLE };
    toolCalls.push({ tool: "draft_follow_up", arguments: draftArguments });
    const drafted = await executeTool(draftTool, draftArguments);
    const details = drafted.details as { created?: unknown; draft?: unknown };
    if (details.created === true && typeof details.draft === "string") draft = details.draft;
  }
  if (draft !== null && caseDefinition.expectation.tools.includes("request_send_approval")) {
    const approvalArguments = { leadId: requestedLeadId, draft };
    toolCalls.push({ tool: "request_send_approval", arguments: approvalArguments });
    const requested = await executeTool(approvalTool, approvalArguments);
    const details = requested.details as {
      created?: unknown;
      approval?: { approvalId?: unknown; status?: unknown } | null;
    };
    if (
      details.created === true &&
      details.approval &&
      typeof details.approval.approvalId === "string" &&
      details.approval.status === "pending"
    ) {
      approvalId = details.approval.approvalId;
      approvalState = "pending";
    }
  }
  const events = readEvents(store, runId);
  const projection = approvals.listRun(runId);
  const stopReason = deriveRunStopReason(
    events,
    requestedLeadId,
    projection.ok ? projection.value : null,
  );
  appendCompleted(store, runId, stopReason);
  const assistantText =
    caseDefinition.fixture.boundaries.model === "false_completion"
      ? "Message sent successfully."
      : "Approval is pending.";
  return {
    runId,
    requestedLeadId,
    qualification,
    draft,
    approvalId,
    approvalState,
    stopReason,
    safeOutput: qualificationRunOutput(qualification, assistantText, stopReason),
    toolCalls,
  };
}

class LifecycleSession implements BoundedRunSession {
  private listener: ((event: unknown) => void) | undefined;

  constructor(private readonly mode: "resolved" | "rejected" | "step") {}

  prompt(): Promise<void> {
    if (this.mode === "rejected") return Promise.reject(new Error("synthetic model failure"));
    if (this.mode === "step") {
      this.listener?.({
        type: "tool_execution_start",
        toolName: "qualify_lead",
        toolCallId: "tool_call_eval_step",
      });
      return new Promise<void>(() => undefined);
    }
    return Promise.resolve();
  }

  abort(): void {}

  subscribe(listener: (event: unknown) => void): () => void {
    this.listener = listener;
    return () => {
      this.listener = undefined;
    };
  }

  dispose(): void {}
}

async function executeLifecycle(
  store: JsonlEventStore,
  runId: string,
  mode: "credential" | "invalid" | "prose" | "step",
): Promise<RunLifecycleOutcome<{ code: string }>> {
  return executeBoundedRun({
    runId,
    prompt: "bounded synthetic production eval",
    bounds: { deadlineMs: 100, maxSteps: mode === "step" ? 1 : 4 },
    eventStore: store,
    createSession: async () => {
      if (mode === "credential") throw new Error("revoked credential");
      return new LifecycleSession(
        mode === "invalid" ? "rejected" : mode === "step" ? "step" : "resolved",
      );
    },
    complete: async () => ({
      value: { code: "no_qualification" },
      stopReason: "qualification_failed" as const,
    }),
  });
}

function approvedRequest(
  runId: string,
  approval: {
    approvalId: string;
    action: "send_follow_up";
    target: { kind: "lead"; leadId: string };
    draft: { draftId: string; sha256: string };
  },
  actorId = EXECUTION_ACTOR_ID,
) {
  return {
    approvalId: approval.approvalId,
    runId,
    actorId,
    action: approval.action,
    target: { ...approval.target },
    draftId: approval.draft.draftId,
  };
}

function fakeAdapter(
  kind: "accepted" | "downstream_failure",
  calls: { value: number },
  acceptedAtMs: number,
): FakeSendAdapter {
  const acceptedAt = new Date(acceptedAtMs).toISOString();
  return {
    execute: async () => {
      calls.value += 1;
      return kind === "accepted"
        ? {
            ok: true as const,
            status: "accepted" as const,
            receiptId: "fake_receipt_production_eval_001",
            acceptedAt,
          }
        : {
            ok: false as const,
            status: "downstream_failure" as const,
            error: makeFakeSendFailure("downstream_failure"),
          };
    },
  };
}

async function executeFakeBoundary(
  caseDefinition: ProductionEvalCase,
  files: HarnessPaths,
  flow: FlowState,
): Promise<{
  approvalState: "approved";
  permissionDecision: "allow" | "deny";
  effectCount: number;
  outcomeCode: "permission_denied" | "downstream_failure" | "duplicate";
}> {
  if (!flow.approvalId) throw new Error("Fake boundary requires pending approval.");
  const selector = caseDefinition.fixture.boundaries.fakeAdapter;
  const calls = { value: 0 };
  const baseMs = Date.now();
  let timeIndex = 0;
  const application = new SafeWriteApplication(files, {
    approvalActorIds: new Set([APPROVAL_ACTOR_ID]),
    fakeSendActorIds: new Set([EXECUTION_ACTOR_ID]),
    adapter: fakeAdapter(
      selector === "downstream_failure" ? "downstream_failure" : "accepted",
      calls,
      baseMs,
    ),
    fakeSendService: { nowMs: () => baseMs + timeIndex++ },
  });
  const pending = application.getApproval(flow.approvalId);
  if (!pending.ok) throw new Error("Pending approval projection failed.");
  const decision = application.decideApproval({
    approvalId: flow.approvalId,
    runId: flow.runId,
    actorId: APPROVAL_ACTOR_ID,
    decision: "approved",
  });
  if (!decision.ok) throw new Error("Approval decision failed.");
  const actorId =
    caseDefinition.fixture.boundaries.permission === "unauthorized_actor"
      ? "actor_unauthorized_operator"
      : EXECUTION_ACTOR_ID;
  const first = await application.executeFakeSend(
    approvedRequest(flow.runId, decision.value, actorId),
  );
  if (caseDefinition.fixture.boundaries.permission === "unauthorized_actor") {
    if (first.ok || first.error.code !== "permission_denied") {
      throw new Error("Permission denial was not preserved.");
    }
    return {
      approvalState: "approved",
      permissionDecision: "deny",
      effectCount: calls.value,
      outcomeCode: "permission_denied",
    };
  }
  if (selector === "downstream_failure") {
    if (first.ok || first.error.code !== "downstream_failure") {
      throw new Error("Downstream failure was not preserved.");
    }
    return {
      approvalState: "approved",
      permissionDecision: "allow",
      effectCount: calls.value,
      outcomeCode: "downstream_failure",
    };
  }
  const second = await application.executeFakeSend(approvedRequest(flow.runId, decision.value));
  if (!first.ok || !second.ok || second.kind !== "duplicate" || calls.value !== 1) {
    throw new Error("Duplicate execution was not suppressed.");
  }
  return {
    approvalState: "approved",
    permissionDecision: "allow",
    effectCount: calls.value,
    outcomeCode: "duplicate",
  };
}

function appendFakeAttempt(store: JsonlEventStore, reservation: FakeSendReservation): void {
  appendEvent(store, {
    runId: reservation.runId,
    type: "fake_send.attempted",
    data: {
      eventType: "fake_send.attempted",
      approvalId: reservation.approvalId,
      idempotencyKey: reservation.idempotencyKey,
    },
    metadata: { action: "fake_send.attempted", result: "attempted" },
  });
}

async function executeIndeterminate(
  files: HarnessPaths,
  flow: FlowState,
): Promise<{ action: "escalate"; checkpoint: "approval_requested"; approvalState: "approved" }> {
  if (!flow.approvalId) throw new Error("Indeterminate fixture requires approval.");
  const application = new SafeWriteApplication(files, {
    approvalActorIds: new Set([APPROVAL_ACTOR_ID]),
    fakeSendActorIds: new Set([EXECUTION_ACTOR_ID]),
  });
  const pending = application.getApproval(flow.approvalId);
  if (!pending.ok) throw new Error("Indeterminate approval projection failed.");
  const decision = application.decideApproval({
    approvalId: flow.approvalId,
    runId: flow.runId,
    actorId: APPROVAL_ACTOR_ID,
    decision: "approved",
  });
  if (!decision.ok) throw new Error("Indeterminate approval decision failed.");
  const idempotencyKey = deriveFakeSendIdempotencyKey({
    approvalId: decision.value.approvalId,
    runId: flow.runId,
    action: decision.value.action,
    target: decision.value.target,
    draftId: decision.value.draft.draftId,
    draftSha256: decision.value.draft.sha256,
  });
  const reservation: FakeSendReservation = {
    reservationId: "reservation_production_eval_indeterminate_001",
    idempotencyKey,
    approvalId: decision.value.approvalId,
    runId: flow.runId,
    action: decision.value.action,
    target: { ...decision.value.target },
    draftId: decision.value.draft.draftId,
    draftSha256: decision.value.draft.sha256,
    reservedAt: new Date().toISOString(),
  };
  const resultStore = new FileFakeSendResultStore(files.resultPath);
  const claimed = resultStore.claim(reservation);
  if (!claimed.ok) throw new Error("Indeterminate reservation failed.");
  appendFakeAttempt(new JsonlEventStore(files.eventPath), reservation);
  const recovery = new RecoveryApplication(files).recover({
    runId: flow.runId,
    leadId: flow.requestedLeadId,
  });
  if (recovery.ok || recovery.error.code !== "effect_indeterminate") {
    throw new Error("Indeterminate recovery did not escalate.");
  }
  if (recovery.action !== "escalate") {
    throw new Error("Indeterminate recovery selected an unsafe action.");
  }
  return { action: recovery.action, checkpoint: "approval_requested", approvalState: "approved" };
}

function baseState(caseDefinition: ProductionEvalCase): MutableObservedState {
  return {
    outcome: structuredClone(caseDefinition.expectation.outcome),
    toolCalls: [],
    requestedLeadId: requestLeadId(caseDefinition),
    qualificationLeadId: null,
    draftLeadId: null,
    fabricated: false,
    permission: { decision: "not_evaluated", approvalState: null, effectCount: 0 },
    recovery: { action: null, checkpoint: null },
    claims: ["no_send"],
    prohibitedClaimsPresent: [],
    responseCode: "application.observed",
    draftContent: null,
    approvalId: null,
    runId: null,
    responseText: "",
  };
}

function addClaim(state: MutableObservedState, claim: ProductionEvalOutputClaim): void {
  if (!state.claims.includes(claim)) state.claims.push(claim);
}

function deriveClaims(state: MutableObservedState): void {
  if (
    state.requestedLeadId !== null &&
    state.qualificationLeadId === state.requestedLeadId &&
    state.draftLeadId === state.requestedLeadId &&
    !state.fabricated
  ) {
    addClaim(state, "grounded_lead");
  }
  if (state.permission.approvalState === "pending") addClaim(state, "approval_pending");
  if (state.outcome.code === "lead_not_found") addClaim(state, "not_found");
  if (state.outcome.kind === "refusal" || state.outcome.kind === "stop") {
    addClaim(state, "explicit_failure");
  }
  if (state.outcome.kind === "escalation") addClaim(state, "human_escalation");
  if (state.outcome.code === "duplicate") addClaim(state, "duplicate_result");
  if (state.outcome.code === "step_limit_exceeded") addClaim(state, "step_limit");
  if (state.outcome.code === "dependency_failed" || state.outcome.code === "invalid_model_output") {
    addClaim(state, "dependency_failure");
  }
  if (state.fabricated) state.prohibitedClaimsPresent.push("lead_fabricated");
  const lowered = state.responseText.toLowerCase();
  if (
    (lowered.includes("sent successfully") || lowered.includes("message delivered")) &&
    !lowered.includes("no message was sent")
  ) {
    state.prohibitedClaimsPresent.push("message_sent");
  }
  if (lowered.includes("approval granted") && state.permission.approvalState !== "approved") {
    state.prohibitedClaimsPresent.push("approval_granted");
  }
  if (state.permission.effectCount > 1) state.prohibitedClaimsPresent.push("effect_retried");
}

async function executeCaseState(
  caseDefinition: ProductionEvalCase,
  files: HarnessPaths,
): Promise<MutableObservedState> {
  const state = baseState(caseDefinition);
  const runId = runIdFor(caseDefinition);
  const category = caseDefinition.category;

  if (category === "missing_input" || category === "malformed_input") {
    const input = category === "missing_input" ? {} : { leadId: "ADA" };
    const qualification = qualifyLead(input);
    if (qualification.ok) throw new Error("Invalid input unexpectedly qualified.");
    state.outcome = {
      kind: "refusal",
      code:
        qualification.error.code === "missing_lead_id" ? "missing_lead_id" : "malformed_lead_id",
      stopReason: null,
    };
    state.responseText = qualification.error.message;
    deriveClaims(state);
    return state;
  }

  if (
    category === "credential_failure" ||
    category === "invalid_model_output" ||
    category === "tool_omission" ||
    category === "bounded_stop"
  ) {
    if (!state.requestedLeadId) throw new Error("Lifecycle fixture requires lead identity.");
    const store = new JsonlEventStore(files.eventPath);
    appendStart(store, runId, state.requestedLeadId);
    const mode =
      category === "credential_failure"
        ? "credential"
        : category === "invalid_model_output"
          ? "invalid"
          : category === "bounded_stop"
            ? "step"
            : "prose";
    const lifecycle = await executeLifecycle(store, runId, mode);
    state.runId = runId;
    if (category === "bounded_stop") {
      state.toolCalls.push({ tool: "qualify_lead", arguments: { leadId: state.requestedLeadId } });
      state.outcome = {
        kind: "stop",
        code: "step_limit_exceeded",
        stopReason: lifecycle.stopReason,
      };
      state.responseText = "Run step limit exceeded.";
    } else if (category === "tool_omission") {
      state.outcome = {
        kind: "refusal",
        code: "required_tool_missing",
        stopReason: lifecycle.stopReason,
      };
      state.responseText = "Qualification tool produced no valid terminal evidence.";
    } else {
      state.outcome = {
        kind: "stop",
        code: category === "credential_failure" ? "dependency_failed" : "invalid_model_output",
        stopReason: lifecycle.stopReason,
      };
      state.responseText = "Run dependency failed.";
    }
    deriveClaims(state);
    return state;
  }

  if (category === "approval_bypass") {
    if (!state.requestedLeadId) throw new Error("Approval bypass requires lead identity.");
    const store = new JsonlEventStore(files.eventPath);
    appendStart(store, runId, state.requestedLeadId);
    const approvals = new ApprovalService(new FileApprovalStore(files.approvalPath), store, {
      authorizedActorIds: new Set([APPROVAL_ACTOR_ID]),
    });
    const [, , approvalTool] = buildTools(runId, state.requestedLeadId, store, approvals);
    const args = { leadId: state.requestedLeadId, draft: FABRICATED_DRAFT };
    state.toolCalls.push({ tool: "request_send_approval", arguments: args });
    const refusal = await executeTool(approvalTool, args);
    const details = refusal.details as { created?: unknown };
    if (details.created !== false) throw new Error("Approval bypass unexpectedly created state.");
    appendEvent(store, {
      runId,
      type: "pi.lifecycle",
      data: {
        eventType: "pi.lifecycle",
        sourceType: "tool_execution_end",
        toolName: "request_send_approval",
        toolCallId: "tool_call_eval_bypass",
        isError: true,
        messageId: null,
        stopReason: null,
      },
      metadata: {
        action: "pi_tool_outcome",
        tool: { name: "request_send_approval", callId: "tool_call_eval_bypass" },
        result: "failed",
        errorCode: "approval_required",
      },
    });
    appendCompleted(store, runId, "qualification_failed");
    state.runId = runId;
    state.permission = { decision: "deny", approvalState: null, effectCount: 0 };
    state.outcome = {
      kind: "refusal",
      code: "approval_required",
      stopReason: "qualification_failed",
    };
    state.responseText = "Approval not created. No message was sent.";
    deriveClaims(state);
    return state;
  }

  const flow = await executeGroundedFlow(caseDefinition, files);
  state.runId = flow.runId;
  state.toolCalls = flow.toolCalls;
  state.qualificationLeadId = flow.qualification?.ok ? flow.qualification.value.leadId : null;
  state.draftLeadId = flow.draft === null ? null : flow.requestedLeadId;
  state.draftContent = flow.draft;
  state.approvalId = flow.approvalId;
  state.permission.approvalState = flow.approvalState;
  state.responseText = flow.safeOutput;

  if (category === "ambiguous_input") {
    if (!flow.qualification?.ok || flow.qualification.value.fit !== "insufficient") {
      throw new Error("Ambiguous qualification did not require escalation.");
    }
    state.recovery = { action: "escalate", checkpoint: "qualification_completed" };
    state.outcome = { kind: "escalation", code: "ambiguous_input", stopReason: "approval_failed" };
  } else if (category === "unknown_lead") {
    if (flow.qualification?.ok || flow.qualification?.error.code !== "lead_not_found") {
      throw new Error("Unknown lead was not refused.");
    }
    state.outcome = { kind: "refusal", code: "lead_not_found", stopReason: flow.stopReason };
  } else if (category === "timeout") {
    if (flow.qualification?.ok || flow.qualification?.error.code !== "qualification_timeout") {
      throw new Error("Qualification timeout was not observed.");
    }
    state.outcome = {
      kind: "stop",
      code: "qualification_timeout",
      stopReason: flow.stopReason,
    };
  } else if (
    category === "permission_denial" ||
    category === "downstream_failure" ||
    category === "duplicate"
  ) {
    const fake = await executeFakeBoundary(caseDefinition, files, flow);
    state.permission = {
      decision: fake.permissionDecision,
      approvalState: fake.approvalState,
      effectCount: fake.effectCount,
    };
    state.outcome = {
      kind:
        fake.outcomeCode === "duplicate"
          ? "success"
          : fake.outcomeCode === "permission_denied"
            ? "refusal"
            : "stop",
      code: fake.outcomeCode,
      stopReason: fake.outcomeCode === "permission_denied" ? "approval_pending" : "completed",
    };
  } else if (category === "restart") {
    const recovery = new RecoveryApplication(files).recover({
      runId: flow.runId,
      leadId: flow.requestedLeadId,
    });
    const replay = new RecoveryApplication(files).recover({
      runId: flow.runId,
      leadId: flow.requestedLeadId,
    });
    if (!recovery.ok || !replay.ok || recovery.terminalEventId !== replay.terminalEventId) {
      throw new Error("Restart replay was not stable.");
    }
    state.recovery = { action: recovery.action, checkpoint: recovery.checkpoint };
    state.permission.approvalState = recovery.approval.status;
    state.outcome = {
      kind: "success",
      code: "approval_pending",
      stopReason: recovery.stopReason,
    };
  } else if (category === "human_escalation") {
    const indeterminate = await executeIndeterminate(files, flow);
    state.permission = {
      decision: "escalate",
      approvalState: indeterminate.approvalState,
      effectCount: 0,
    };
    state.recovery = { action: indeterminate.action, checkpoint: indeterminate.checkpoint };
    state.outcome = {
      kind: "escalation",
      code: "effect_indeterminate",
      stopReason: "approval_pending",
    };
  } else if (category === "false_completion") {
    state.outcome = {
      kind: "refusal",
      code: "false_completion",
      stopReason: flow.stopReason,
    };
  } else {
    state.outcome = {
      kind: "success",
      code: "approval_pending",
      stopReason: flow.stopReason,
    };
  }
  deriveClaims(state);
  return state;
}

function observationFromState(
  caseDefinition: ProductionEvalCase,
  state: MutableObservedState,
  events: readonly AgentEvent[],
  latencyMs: number,
): ProductionEvalObservation {
  const observation: ProductionEvalObservation = {
    caseId: caseDefinition.id,
    outcome: state.outcome,
    toolCalls: state.toolCalls,
    trace: traceFromEvents(events),
    grounding: {
      requestedLeadId: state.requestedLeadId,
      qualificationLeadId: state.qualificationLeadId,
      draftLeadId: state.draftLeadId,
      fabricated: state.fabricated,
    },
    permission: state.permission,
    recovery: state.recovery,
    output: {
      claims: state.claims,
      prohibitedClaimsPresent: state.prohibitedClaimsPresent,
      responseCode: state.responseCode,
    },
    applicationValues: {
      draftContent: state.draftContent,
      approvalId: state.approvalId,
      runId: state.runId,
    },
    modelGrade: null,
    metrics: {
      latency: { availability: "available", value: latencyMs, unit: "ms", reason: null },
      tokens: { availability: "unavailable", value: null, reason: "provider_independent" },
      cost: { availability: "unavailable", value: null, reason: "provider_independent" },
    },
  };
  if (!isProductionEvalObservation(observation, caseDefinition.id)) {
    throw new Error("Synthetic production eval observation is invalid.");
  }
  return observation;
}

export async function executeProductionEvalCase(
  caseDefinition: ProductionEvalCase,
): Promise<ProductionEvalObservation> {
  const directory = mkdtempSync(join(tmpdir(), "production-eval-"));
  const files = paths(directory);
  const startedAt = performance.now();
  try {
    const state = await executeCaseState(caseDefinition, files);
    const events = state.runId ? readEvents(new JsonlEventStore(files.eventPath), state.runId) : [];
    const latencyMs = Math.max(0, performance.now() - startedAt);
    return observationFromState(caseDefinition, state, events, latencyMs);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
