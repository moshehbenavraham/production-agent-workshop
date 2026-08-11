import { isDeepStrictEqual } from "node:util";
import { Type } from "typebox";
import Schema from "typebox/schema";
import { ApprovalRecordSchema, isApprovalRecord } from "./approval.js";
import {
  FakeSendStoreProjectionSchema,
  hasSameFakeSendIdentity,
  isFakeSendStoreProjection,
} from "./fake-send-result.js";
import {
  QualificationFailureSchema,
  QualificationResultSchema,
  isQualificationFailure,
  isQualificationResult,
} from "./qualification.js";
import {
  AgentEventSchema,
  RunEventRunIdSchema,
  isAgentEvent,
  isRunEventReadOutcome,
  isRunId,
  type AgentEvent,
  type RunEventStore,
} from "./run-event.js";

const EventIdSchema = Type.String({
  minLength: 8,
  maxLength: 120,
  pattern: "^event_[a-z0-9_-]+$",
});

const LeadIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern: "^lead_[a-z0-9_]+$",
});

const DraftIdSchema = Type.String({
  minLength: 10,
  maxLength: 100,
  pattern: "^draft_[a-z0-9_-]+$",
});

const ApprovalIdSchema = Type.String({
  minLength: 12,
  maxLength: 100,
  pattern: "^approval_[a-z0-9_-]+$",
});

const Sha256Schema = Type.String({
  minLength: 64,
  maxLength: 64,
  pattern: "^[0-9a-f]{64}$",
});

const IdempotencyKeySchema = Sha256Schema;

export const RunProjectionStatusSchema = Type.Union([
  Type.Literal("running"),
  Type.Literal("waiting_for_approval"),
  Type.Literal("approved"),
  Type.Literal("effect_indeterminate"),
  Type.Literal("completed"),
  Type.Literal("stopped"),
  Type.Literal("failed"),
]);

export const RunCheckpointSchema = Type.Union([
  Type.Object(
    { kind: Type.Literal("run_started"), eventId: EventIdSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { kind: Type.Literal("qualification_completed"), eventId: EventIdSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { kind: Type.Literal("draft_created"), eventId: EventIdSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { kind: Type.Literal("approval_requested"), eventId: EventIdSchema },
    { additionalProperties: false },
  ),
]);

const RunCompletedStopReasonSchema = Type.Union([
  Type.Literal("approval_pending"),
  Type.Literal("approval_failed"),
  Type.Literal("not_found"),
  Type.Literal("qualification_failed"),
  Type.Literal("completed"),
]);

export const RunTerminalOutcomeSchema = Type.Union([
  Type.Object(
    {
      kind: Type.Literal("completed"),
      eventId: EventIdSchema,
      stopReason: RunCompletedStopReasonSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("failed"),
      eventId: EventIdSchema,
      stopReason: Type.Literal("agent_run_failed"),
    },
    { additionalProperties: false },
  ),
]);

const QualificationContextSchema = Type.Union([
  Type.Object(
    {
      state: Type.Literal("attempted"),
      attemptEventId: EventIdSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      state: Type.Literal("completed"),
      attemptEventId: EventIdSchema,
      outcomeEventId: EventIdSchema,
      result: QualificationResultSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      state: Type.Literal("failed"),
      attemptEventId: EventIdSchema,
      outcomeEventId: EventIdSchema,
      error: QualificationFailureSchema,
    },
    { additionalProperties: false },
  ),
  Type.Null(),
]);

const DraftContextSchema = Type.Union([
  Type.Object(
    {
      draftId: DraftIdSchema,
      sha256: Sha256Schema,
      eventId: EventIdSchema,
    },
    { additionalProperties: false },
  ),
  Type.Null(),
]);

const ApprovalContextSchema = Type.Union([
  Type.Object(
    {
      approvalId: ApprovalIdSchema,
      observedStatus: Type.Union([
        Type.Literal("pending"),
        Type.Literal("approved"),
        Type.Literal("declined"),
      ]),
      requestEventId: EventIdSchema,
      lastEventId: EventIdSchema,
    },
    { additionalProperties: false },
  ),
  Type.Null(),
]);

const FakeSendObservedStatusSchema = Type.Union([
  Type.Literal("attempted"),
  Type.Literal("accepted"),
  Type.Literal("rejected"),
  Type.Literal("timed_out"),
  Type.Literal("downstream_failure"),
  Type.Literal("permission_denied"),
  Type.Literal("storage_failure"),
]);

const FakeSendContextSchema = Type.Union([
  Type.Object(
    {
      approvalId: ApprovalIdSchema,
      idempotencyKey: Type.Union([IdempotencyKeySchema, Type.Null()]),
      observedStatus: FakeSendObservedStatusSchema,
      attemptEventId: Type.Union([EventIdSchema, Type.Null()]),
      lastEventId: EventIdSchema,
      duplicateObserved: Type.Boolean(),
      durationMs: Type.Union([Type.Integer({ minimum: 0, maximum: 60_000 }), Type.Null()]),
    },
    { additionalProperties: false },
  ),
  Type.Null(),
]);

const WorkingContextSchema = Type.Object(
  {
    qualification: QualificationContextSchema,
    draft: DraftContextSchema,
    approval: ApprovalContextSchema,
    fakeSend: FakeSendContextSchema,
  },
  { additionalProperties: false },
);

const ApprovalAuthoritySchema = Type.Object(
  {
    verification: Type.Union([
      Type.Literal("not_required"),
      Type.Literal("not_supplied"),
      Type.Literal("verified"),
    ]),
    status: Type.Union([
      Type.Literal("pending"),
      Type.Literal("approved"),
      Type.Literal("declined"),
      Type.Null(),
    ]),
  },
  { additionalProperties: false },
);

const FakeSendAuthoritySchema = Type.Object(
  {
    verification: Type.Union([
      Type.Literal("not_required"),
      Type.Literal("not_supplied"),
      Type.Literal("verified"),
    ]),
    state: Type.Union([Type.Literal("reserved"), Type.Literal("completed"), Type.Null()]),
    resultStatus: Type.Union([
      Type.Literal("accepted"),
      Type.Literal("rejected"),
      Type.Literal("timed_out"),
      Type.Literal("downstream_failure"),
      Type.Null(),
    ]),
  },
  { additionalProperties: false },
);

const RunProjectionAuthoritySchema = Type.Object(
  {
    approval: ApprovalAuthoritySchema,
    fakeSend: FakeSendAuthoritySchema,
  },
  { additionalProperties: false },
);

export const RunProjectionSchema = Type.Object(
  {
    runId: RunEventRunIdSchema,
    leadId: LeadIdSchema,
    status: RunProjectionStatusSchema,
    latestSafeCheckpoint: RunCheckpointSchema,
    terminalOutcome: Type.Union([RunTerminalOutcomeSchema, Type.Null()]),
    workingContext: WorkingContextSchema,
    authority: RunProjectionAuthoritySchema,
    eventCount: Type.Integer({ minimum: 1, maximum: 1_000_000 }),
    lastEventId: EventIdSchema,
  },
  { additionalProperties: false },
);

const RunProjectionAuthorityInputSchema = Type.Object(
  {
    approvalRecords: Type.Array(ApprovalRecordSchema, { maxItems: 100 }),
    fakeSendProjections: Type.Array(FakeSendStoreProjectionSchema, { maxItems: 100 }),
  },
  { additionalProperties: false },
);

export const RunProjectionInputSchema = Type.Object(
  {
    runId: RunEventRunIdSchema,
    events: Type.Array(AgentEventSchema, { maxItems: 1_000_000 }),
    authority: Type.Optional(RunProjectionAuthorityInputSchema),
  },
  { additionalProperties: false },
);

export const RunProjectionFailureCodeSchema = Type.Union([
  Type.Literal("invalid_input"),
  Type.Literal("missing_start"),
  Type.Literal("cross_run_identity"),
  Type.Literal("out_of_order_event"),
  Type.Literal("missing_prerequisite"),
  Type.Literal("duplicate_evidence"),
  Type.Literal("conflicting_evidence"),
  Type.Literal("incompatible_terminal"),
  Type.Literal("authority_mismatch"),
  Type.Literal("corrupt_history"),
  Type.Literal("interrupted_history"),
  Type.Literal("storage_failure"),
]);

export const RunProjectionFailureSchema = Type.Object(
  {
    code: RunProjectionFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 160 }),
    retryable: Type.Boolean(),
    eventIndex: Type.Union([Type.Integer({ minimum: 0, maximum: 999_999 }), Type.Null()]),
    eventId: Type.Union([EventIdSchema, Type.Null()]),
  },
  { additionalProperties: false },
);

export type RunProjectionStatus = Type.Static<typeof RunProjectionStatusSchema>;
export type RunCheckpoint = Type.Static<typeof RunCheckpointSchema>;
export type RunTerminalOutcome = Type.Static<typeof RunTerminalOutcomeSchema>;
export type RunProjection = Type.Static<typeof RunProjectionSchema>;
export type RunProjectionInput = Type.Static<typeof RunProjectionInputSchema>;
export type RunProjectionFailureCode = Type.Static<typeof RunProjectionFailureCodeSchema>;
export type RunProjectionFailure = Type.Static<typeof RunProjectionFailureSchema>;
export type RunProjectionAuthorityInput = Type.Static<typeof RunProjectionAuthorityInputSchema>;
export type RunProjectionOutcome =
  | { ok: true; value: RunProjection }
  | { ok: false; error: RunProjectionFailure };

type QualificationContext = RunProjection["workingContext"]["qualification"];
type DraftContext = RunProjection["workingContext"]["draft"];
type ApprovalContext = RunProjection["workingContext"]["approval"];
type FakeSendContext = RunProjection["workingContext"]["fakeSend"];
type ProjectionAuthority = RunProjection["authority"];

type FoldState = {
  runId: string;
  leadId: string;
  checkpoint: RunCheckpoint;
  qualification: QualificationContext;
  draft: DraftContext;
  approval: ApprovalContext;
  fakeSend: FakeSendContext;
  terminal: RunTerminalOutcome | null;
  draftAt: number | null;
  approvalRequestedAt: number | null;
  qualificationAttemptLeadId: string | null;
  fakeAttemptAt: number | null;
  fakeTerminalAt: number | null;
};

const inputValidator = Schema.Compile(RunProjectionInputSchema);
const projectionValidator = Schema.Compile(RunProjectionSchema);
const failureValidator = Schema.Compile(RunProjectionFailureSchema);

const failureMessages: Record<RunProjectionFailureCode, string> = {
  invalid_input: "Run projection input is invalid.",
  missing_start: "Run history does not begin with one run start.",
  cross_run_identity: "Run history contains a mismatched run identity.",
  out_of_order_event: "Run history contains an out-of-order event.",
  missing_prerequisite: "Run history is missing required predecessor evidence.",
  duplicate_evidence: "Run history contains duplicate lifecycle evidence.",
  conflicting_evidence: "Run history contains incompatible lifecycle evidence.",
  incompatible_terminal: "Run terminal evidence conflicts with prior durable facts.",
  authority_mismatch: "Dedicated authority evidence does not match the run projection.",
  corrupt_history: "Run history contains a structurally corrupt record.",
  interrupted_history: "Run history contains an interrupted durable record.",
  storage_failure: "Run projection storage is unavailable.",
};

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function canonicalLocation(location?: {
  eventIndex?: unknown;
  eventId?: unknown;
}): Pick<RunProjectionFailure, "eventIndex" | "eventId"> {
  return {
    eventIndex:
      Number.isInteger(location?.eventIndex) &&
      Number(location?.eventIndex) >= 0 &&
      Number(location?.eventIndex) <= 999_999
        ? Number(location?.eventIndex)
        : null,
    eventId:
      typeof location?.eventId === "string" && /^event_[a-z0-9_-]{2,114}$/.test(location.eventId)
        ? location.eventId
        : null,
  };
}

export function makeRunProjectionFailure(
  code: RunProjectionFailureCode,
  location?: { eventIndex?: unknown; eventId?: unknown },
): RunProjectionFailure {
  return Object.freeze({
    code,
    message: failureMessages[code],
    retryable: code === "storage_failure" || code === "interrupted_history",
    ...canonicalLocation(location),
  });
}

export function isRunProjectionFailure(value: unknown): value is RunProjectionFailure {
  try {
    if (!failureValidator.Check(value)) return false;
    const failure = value as RunProjectionFailure;
    return isDeepStrictEqual(
      failure,
      makeRunProjectionFailure(failure.code, {
        eventIndex: failure.eventIndex,
        eventId: failure.eventId,
      }),
    );
  } catch {
    return false;
  }
}

function qualificationContextIsValid(value: QualificationContext): boolean {
  if (value === null || value.state === "attempted") return true;
  return value.state === "completed"
    ? isQualificationResult(value.result)
    : isQualificationFailure(value.error);
}

function statusFrom(
  terminal: RunTerminalOutcome | null,
  approval: ApprovalContext,
  fakeSend: FakeSendContext,
  authority: ProjectionAuthority,
): RunProjectionStatus {
  if (terminal?.kind === "failed") return "failed";
  if (terminal === null) return "running";
  if (fakeSend) {
    if (authority.fakeSend.verification === "verified") {
      if (authority.fakeSend.state === "reserved") return "effect_indeterminate";
      return authority.fakeSend.resultStatus === "accepted" ? "completed" : "stopped";
    }
    if (fakeSend.observedStatus === "accepted" || fakeSend.observedStatus === "attempted") {
      return "effect_indeterminate";
    }
    return "stopped";
  }
  if (authority.approval.verification === "verified") {
    if (authority.approval.status === "approved") return "approved";
    if (authority.approval.status === "declined") return "stopped";
  }
  if (approval?.observedStatus === "declined") return "stopped";
  if (terminal?.kind === "completed") {
    if (terminal.stopReason === "completed") return "completed";
    if (terminal.stopReason === "approval_pending") return "waiting_for_approval";
    return "stopped";
  }
  return "running";
}

function checkpointIsConsistent(projection: RunProjection): boolean {
  const { latestSafeCheckpoint: checkpoint, workingContext } = projection;
  const expected = workingContext.approval
    ? { kind: "approval_requested", eventId: workingContext.approval.requestEventId }
    : workingContext.draft
      ? { kind: "draft_created", eventId: workingContext.draft.eventId }
      : workingContext.qualification?.state === "completed"
        ? {
            kind: "qualification_completed",
            eventId: workingContext.qualification.outcomeEventId,
          }
        : null;
  return expected === null
    ? checkpoint.kind === "run_started"
    : checkpoint.kind === expected.kind && checkpoint.eventId === expected.eventId;
}

function contextIsConsistent(projection: RunProjection): boolean {
  const context = projection.workingContext;
  if (context.draft && context.qualification?.state !== "completed") return false;
  if (context.approval && !context.draft) return false;
  if (
    context.approval?.observedStatus !== "pending" &&
    context.approval &&
    !projection.terminalOutcome
  ) {
    return false;
  }
  if (context.fakeSend && !projection.terminalOutcome) return false;
  if (!context.fakeSend) return true;
  if (
    context.fakeSend.observedStatus === "permission_denied" ||
    context.fakeSend.observedStatus === "storage_failure"
  ) {
    return true;
  }
  return (
    context.approval !== null &&
    context.fakeSend.approvalId === context.approval.approvalId &&
    context.fakeSend.idempotencyKey !== null
  );
}

function authorityIsConsistent(
  authority: ProjectionAuthority,
  context: RunProjection["workingContext"],
): boolean {
  const approvalValid =
    authority.approval.verification === "verified"
      ? authority.approval.status !== null
      : authority.approval.status === null;
  const fakeValid =
    authority.fakeSend.verification === "verified"
      ? authority.fakeSend.state !== null &&
        (authority.fakeSend.state === "completed"
          ? authority.fakeSend.resultStatus !== null
          : authority.fakeSend.resultStatus === null)
      : authority.fakeSend.state === null && authority.fakeSend.resultStatus === null;
  const approvalRequired = context.approval !== null;
  const fakeRequired = context.fakeSend?.idempotencyKey !== null && context.fakeSend !== null;
  const approvalRelation = approvalRequired
    ? authority.approval.verification !== "not_required"
    : authority.approval.verification === "not_required";
  const fakeRelation = fakeRequired
    ? authority.fakeSend.verification !== "not_required"
    : authority.fakeSend.verification === "not_required";
  return approvalValid && fakeValid && approvalRelation && fakeRelation;
}

export function isRunProjection(value: unknown): value is RunProjection {
  try {
    if (!projectionValidator.Check(value)) return false;
    const projection = value as RunProjection;
    return (
      qualificationContextIsValid(projection.workingContext.qualification) &&
      contextIsConsistent(projection) &&
      checkpointIsConsistent(projection) &&
      authorityIsConsistent(projection.authority, projection.workingContext) &&
      projection.status ===
        statusFrom(
          projection.terminalOutcome,
          projection.workingContext.approval,
          projection.workingContext.fakeSend,
          projection.authority,
        )
    );
  } catch {
    return false;
  }
}

export function isRunProjectionOutcome(value: unknown): value is RunProjectionOutcome {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    if (Object.keys(candidate).length !== 2 || typeof candidate.ok !== "boolean") return false;
    return candidate.ok === true
      ? "value" in candidate && isRunProjection(candidate.value)
      : "error" in candidate && isRunProjectionFailure(candidate.error);
  } catch {
    return false;
  }
}

function failureOutcome(
  code: RunProjectionFailureCode,
  index?: number,
  event?: AgentEvent,
): Extract<RunProjectionOutcome, { ok: false }> {
  return Object.freeze({
    ok: false as const,
    error: makeRunProjectionFailure(code, { eventIndex: index, eventId: event?.eventId }),
  });
}

function successOutcome(value: RunProjection): Extract<RunProjectionOutcome, { ok: true }> {
  return Object.freeze({ ok: true as const, value: deepFreeze(structuredClone(value)) });
}

function isCoreEventAfterTerminal(event: AgentEvent): boolean {
  return (
    event.data.eventType === "run.started" ||
    event.data.eventType === "run.completed" ||
    event.data.eventType === "run.failed" ||
    event.data.eventType === "qualification.attempted" ||
    event.data.eventType === "qualification.completed" ||
    event.data.eventType === "qualification.failed" ||
    event.data.eventType === "domain.follow_up_drafted" ||
    event.data.eventType === "approval.requested" ||
    event.data.eventType === "pi.lifecycle"
  );
}

function completedMetadataIsCompatible(event: AgentEvent): boolean {
  if (event.data.eventType !== "run.completed") return false;
  if (event.metadata.stopReason !== event.data.stopReason) return false;
  if (event.data.stopReason === "approval_pending") {
    return event.metadata.result === "pending" && event.metadata.approvalState === "pending";
  }
  if (event.data.stopReason === "completed") return event.metadata.result === "succeeded";
  return event.metadata.result === "stopped";
}

function terminalIsCompatible(state: FoldState, event: AgentEvent): boolean {
  if (event.data.eventType !== "run.completed") return false;
  const qualification = state.qualification;
  switch (event.data.stopReason) {
    case "not_found":
      return (
        qualification?.state === "failed" &&
        qualification.error.code === "lead_not_found" &&
        state.qualificationAttemptLeadId === state.leadId
      );
    case "qualification_failed":
      return qualification?.state === "failed" && qualification.error.code !== "lead_not_found";
    case "approval_pending":
      return qualification?.state === "completed" && state.approval?.observedStatus === "pending";
    case "completed":
      return qualification?.state === "completed" && state.approval !== null;
    case "approval_failed":
      return qualification?.state === "completed";
  }
}

function matchingApproval(state: FoldState, approvalId: string): boolean {
  return state.approval !== null && state.approval.approvalId === approvalId;
}

function applyApprovalDecision(
  state: FoldState,
  event: AgentEvent,
  status: "approved" | "declined",
): RunProjectionFailureCode | null {
  const data = event.data;
  if (data.eventType !== "approval.approved" && data.eventType !== "approval.declined") {
    return "invalid_input";
  }
  if (!matchingApproval(state, data.approvalId)) {
    return "missing_prerequisite";
  }
  if (!state.terminal) return "missing_prerequisite";
  if (!state.approval) return "missing_prerequisite";
  if (state.approval.observedStatus === "pending") {
    state.approval = {
      ...state.approval,
      observedStatus: status,
      lastEventId: event.eventId,
    };
    return null;
  }
  return state.approval.observedStatus === status ? "duplicate_evidence" : "conflicting_evidence";
}

function applyFakeTerminal(
  state: FoldState,
  event: AgentEvent,
  observedStatus: "accepted" | "rejected" | "timed_out" | "downstream_failure",
): RunProjectionFailureCode | null {
  const data = event.data;
  if (!("approvalId" in data) || !("idempotencyKey" in data)) {
    return "invalid_input";
  }
  if (!matchingApproval(state, data.approvalId)) return "missing_prerequisite";
  if (!state.terminal) return "missing_prerequisite";
  if (
    state.fakeSend?.observedStatus !== "attempted" ||
    state.fakeSend.approvalId !== data.approvalId ||
    state.fakeSend.idempotencyKey !== data.idempotencyKey
  ) {
    return state.fakeSend ? "conflicting_evidence" : "missing_prerequisite";
  }
  state.fakeSend = {
    ...state.fakeSend,
    observedStatus,
    lastEventId: event.eventId,
    durationMs: "durationMs" in data ? data.durationMs : null,
  };
  state.fakeTerminalAt = Date.parse(event.at);
  return null;
}

function applyFakeFailureObservation(
  state: FoldState,
  event: AgentEvent,
): RunProjectionFailureCode | null {
  const data = event.data;
  if (
    data.eventType !== "fake_send.permission_denied" &&
    data.eventType !== "fake_send.storage_failed"
  ) {
    return "invalid_input";
  }
  const idempotencyKey =
    data.eventType === "fake_send.storage_failed" ? (data.idempotencyKey ?? null) : null;
  const observedStatus =
    data.eventType === "fake_send.permission_denied" ? "permission_denied" : "storage_failure";
  if (!state.terminal) return "missing_prerequisite";
  if (state.fakeSend) {
    if (
      state.fakeSend.approvalId !== data.approvalId ||
      (idempotencyKey !== null && state.fakeSend.idempotencyKey !== idempotencyKey)
    ) {
      return "conflicting_evidence";
    }
    state.fakeSend = {
      ...state.fakeSend,
      observedStatus,
      lastEventId: event.eventId,
      durationMs: state.fakeSend.durationMs,
    };
    return null;
  }
  state.fakeSend = {
    approvalId: data.approvalId,
    idempotencyKey,
    observedStatus,
    attemptEventId: null,
    lastEventId: event.eventId,
    duplicateObserved: false,
    durationMs: null,
  };
  return null;
}

function applyEvent(state: FoldState, event: AgentEvent): RunProjectionFailureCode | null {
  const data = event.data;
  switch (data.eventType) {
    case "run.started":
      return "duplicate_evidence";
    case "pi.lifecycle":
      return null;
    case "qualification.attempted":
      if (state.qualification !== null) return "duplicate_evidence";
      if (data.leadId !== undefined && data.leadId !== state.leadId) {
        return "conflicting_evidence";
      }
      state.qualification = { state: "attempted", attemptEventId: event.eventId };
      state.qualificationAttemptLeadId = data.leadId ?? null;
      return null;
    case "qualification.completed":
      if (state.qualification === null) return "missing_prerequisite";
      if (state.qualification.state === "completed") return "duplicate_evidence";
      if (state.qualification.state === "failed") return "conflicting_evidence";
      if (data.result.leadId !== state.leadId) return "conflicting_evidence";
      state.qualification = {
        state: "completed",
        attemptEventId: state.qualification.attemptEventId,
        outcomeEventId: event.eventId,
        result: data.result,
      };
      state.checkpoint = { kind: "qualification_completed", eventId: event.eventId };
      return null;
    case "qualification.failed":
      if (state.qualification === null) return "missing_prerequisite";
      if (state.qualification.state === "failed") return "duplicate_evidence";
      if (state.qualification.state === "completed") return "conflicting_evidence";
      state.qualification = {
        state: "failed",
        attemptEventId: state.qualification.attemptEventId,
        outcomeEventId: event.eventId,
        error: data.error,
      };
      return null;
    case "domain.follow_up_drafted":
      if (state.qualification?.state !== "completed") return "missing_prerequisite";
      if (state.draft !== null) {
        return state.draft.draftId === data.draftId && state.draft.sha256 === data.sha256
          ? "duplicate_evidence"
          : "conflicting_evidence";
      }
      if (data.leadId !== state.leadId) return "conflicting_evidence";
      state.draft = { draftId: data.draftId, sha256: data.sha256, eventId: event.eventId };
      state.draftAt = Date.parse(event.at);
      state.checkpoint = { kind: "draft_created", eventId: event.eventId };
      return null;
    case "approval.requested":
      if (!state.draft) return "missing_prerequisite";
      if (state.approval !== null) {
        return state.approval.approvalId === data.approvalId
          ? "duplicate_evidence"
          : "conflicting_evidence";
      }
      if (
        data.leadId !== state.leadId ||
        data.draftId !== state.draft.draftId ||
        data.targetKind !== "lead" ||
        data.action !== "send_follow_up"
      ) {
        return "conflicting_evidence";
      }
      state.approval = {
        approvalId: data.approvalId,
        observedStatus: "pending",
        requestEventId: event.eventId,
        lastEventId: event.eventId,
      };
      state.approvalRequestedAt = Date.parse(event.at);
      state.checkpoint = { kind: "approval_requested", eventId: event.eventId };
      return null;
    case "approval.approved":
      return applyApprovalDecision(state, event, "approved");
    case "approval.declined":
      return applyApprovalDecision(state, event, "declined");
    case "approval.decision_duplicate":
    case "approval.decision_conflict": {
      if (!matchingApproval(state, data.approvalId)) return "missing_prerequisite";
      if (!state.terminal) return "missing_prerequisite";
      if (!state.approval) return "missing_prerequisite";
      if (
        state.approval.observedStatus !== "pending" &&
        state.approval.observedStatus !== data.status
      ) {
        return "conflicting_evidence";
      }
      state.approval = {
        ...state.approval,
        observedStatus: data.status,
        lastEventId: event.eventId,
      };
      return null;
    }
    case "approval.invalid":
    case "approval.storage_failed":
      return null;
    case "fake_send.attempted":
      if (!matchingApproval(state, data.approvalId)) return "missing_prerequisite";
      if (!state.terminal) return "missing_prerequisite";
      if (state.fakeSend !== null) return "conflicting_evidence";
      state.fakeSend = {
        approvalId: data.approvalId,
        idempotencyKey: data.idempotencyKey,
        observedStatus: "attempted",
        attemptEventId: event.eventId,
        lastEventId: event.eventId,
        duplicateObserved: false,
        durationMs: null,
      };
      state.fakeAttemptAt = Date.parse(event.at);
      return null;
    case "fake_send.accepted":
      return applyFakeTerminal(state, event, "accepted");
    case "fake_send.rejected":
      return applyFakeTerminal(state, event, "rejected");
    case "fake_send.timed_out":
      return applyFakeTerminal(state, event, "timed_out");
    case "fake_send.downstream_failed":
      return applyFakeTerminal(state, event, "downstream_failure");
    case "fake_send.duplicate": {
      if (!matchingApproval(state, data.approvalId)) return "missing_prerequisite";
      if (!state.terminal) return "missing_prerequisite";
      if (
        !state.fakeSend ||
        state.fakeSend.approvalId !== data.approvalId ||
        state.fakeSend.idempotencyKey !== data.idempotencyKey
      ) {
        return state.fakeSend ? "conflicting_evidence" : "missing_prerequisite";
      }
      const expected =
        data.originalStatus === "execution_in_progress" ? "attempted" : data.originalStatus;
      if (state.fakeSend.observedStatus !== expected) return "conflicting_evidence";
      state.fakeSend = {
        ...state.fakeSend,
        lastEventId: event.eventId,
        duplicateObserved: true,
      };
      return null;
    }
    case "fake_send.permission_denied":
    case "fake_send.storage_failed":
      return applyFakeFailureObservation(state, event);
    case "run.completed":
    case "run.failed":
      return "duplicate_evidence";
  }
}

function projectAuthority(
  state: FoldState,
  authority: RunProjectionAuthorityInput | undefined,
): { ok: true; value: ProjectionAuthority } | { ok: false } {
  const requiresApproval = state.approval !== null;
  const requiresFake = state.fakeSend?.idempotencyKey !== null && state.fakeSend !== null;
  if (!authority) {
    return {
      ok: true,
      value: {
        approval: {
          verification: requiresApproval ? "not_supplied" : "not_required",
          status: null,
        },
        fakeSend: {
          verification: requiresFake ? "not_supplied" : "not_required",
          state: null,
          resultStatus: null,
        },
      },
    };
  }

  let approvalAuthority: ProjectionAuthority["approval"];
  if (!state.approval) {
    if (authority.approvalRecords.length !== 0) return { ok: false };
    approvalAuthority = { verification: "not_required", status: null };
  } else {
    if (authority.approvalRecords.length !== 1 || !state.draft) return { ok: false };
    const record = authority.approvalRecords[0];
    if (
      !record ||
      record.approvalId !== state.approval.approvalId ||
      record.runId !== state.runId ||
      record.target.kind !== "lead" ||
      record.target.leadId !== state.leadId ||
      record.draft.draftId !== state.draft.draftId ||
      record.draft.sha256 !== state.draft.sha256 ||
      state.draftAt === null ||
      state.approvalRequestedAt === null ||
      Date.parse(record.requestedAt) < state.draftAt ||
      Date.parse(record.requestedAt) > state.approvalRequestedAt ||
      (state.approval.observedStatus !== "pending" &&
        record.status !== state.approval.observedStatus)
    ) {
      return { ok: false };
    }
    approvalAuthority = { verification: "verified", status: record.status };
  }

  let fakeAuthority: ProjectionAuthority["fakeSend"];
  if (!requiresFake || !state.fakeSend || state.fakeSend.idempotencyKey === null) {
    if (authority.fakeSendProjections.length !== 0) return { ok: false };
    fakeAuthority = {
      verification: "not_required",
      state: null,
      resultStatus: null,
    };
  } else {
    if (authority.fakeSendProjections.length !== 1 || !state.draft || !state.approval) {
      return { ok: false };
    }
    const evidence = authority.fakeSendProjections[0];
    const identity = evidence?.reservation;
    if (
      !evidence ||
      !identity ||
      identity.idempotencyKey !== state.fakeSend.idempotencyKey ||
      identity.approvalId !== state.fakeSend.approvalId ||
      identity.approvalId !== state.approval.approvalId ||
      identity.runId !== state.runId ||
      identity.action !== "send_follow_up" ||
      identity.target.kind !== "lead" ||
      identity.target.leadId !== state.leadId ||
      identity.draftId !== state.draft.draftId ||
      identity.draftSha256 !== state.draft.sha256
    ) {
      return { ok: false };
    }
    if (
      (state.fakeAttemptAt !== null && Date.parse(identity.reservedAt) > state.fakeAttemptAt) ||
      (evidence.state === "completed" &&
        state.fakeTerminalAt !== null &&
        Date.parse(evidence.result.completedAt) > state.fakeTerminalAt)
    ) {
      return { ok: false };
    }
    if (evidence.state === "completed") {
      if (!hasSameFakeSendIdentity(evidence.reservation, evidence.result)) return { ok: false };
      const observed = state.fakeSend.observedStatus;
      if (
        (observed === "accepted" ||
          observed === "rejected" ||
          observed === "timed_out" ||
          observed === "downstream_failure") &&
        (evidence.result.status !== observed ||
          evidence.result.durationMs !== state.fakeSend.durationMs)
      ) {
        return { ok: false };
      }
    } else if (
      state.fakeSend.observedStatus === "accepted" ||
      state.fakeSend.observedStatus === "rejected" ||
      state.fakeSend.observedStatus === "timed_out" ||
      state.fakeSend.observedStatus === "downstream_failure"
    ) {
      return { ok: false };
    }
    fakeAuthority = {
      verification: "verified",
      state: evidence.state,
      resultStatus: evidence.state === "completed" ? evidence.result.status : null,
    };
  }

  return {
    ok: true,
    value: { approval: approvalAuthority, fakeSend: fakeAuthority },
  };
}

function validateSemanticInput(input: RunProjectionInput): boolean {
  return (
    input.events.every(isAgentEvent) &&
    (input.authority === undefined ||
      (input.authority.approvalRecords.every(isApprovalRecord) &&
        input.authority.fakeSendProjections.every(isFakeSendStoreProjection)))
  );
}

export function projectRunEvents(input: unknown): RunProjectionOutcome {
  let safeInput: unknown;
  try {
    safeInput = structuredClone(input);
  } catch {
    return failureOutcome("invalid_input");
  }
  try {
    if (!inputValidator.Check(safeInput)) return failureOutcome("invalid_input");
  } catch {
    return failureOutcome("invalid_input");
  }
  const projectionInput = safeInput as RunProjectionInput;
  if (!validateSemanticInput(projectionInput)) return failureOutcome("invalid_input");
  if (projectionInput.events.length === 0) return failureOutcome("missing_start");

  const first = projectionInput.events[0];
  if (first?.data.eventType !== "run.started") {
    return failureOutcome("missing_start", 0, first);
  }
  if (first.runId !== projectionInput.runId) {
    return failureOutcome("cross_run_identity", 0, first);
  }

  const state: FoldState = {
    runId: projectionInput.runId,
    leadId: first.data.leadId,
    checkpoint: { kind: "run_started", eventId: first.eventId },
    qualification: null,
    draft: null,
    approval: null,
    fakeSend: null,
    terminal: null,
    draftAt: null,
    approvalRequestedAt: null,
    qualificationAttemptLeadId: null,
    fakeAttemptAt: null,
    fakeTerminalAt: null,
  };
  const eventIds = new Set<string>();
  let lastTime = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < projectionInput.events.length; index += 1) {
    const current = projectionInput.events[index];
    if (!current) return failureOutcome("invalid_input", index);
    if (current.runId !== projectionInput.runId) {
      return failureOutcome("cross_run_identity", index, current);
    }
    if (eventIds.has(current.eventId)) {
      return failureOutcome("duplicate_evidence", index, current);
    }
    eventIds.add(current.eventId);
    const currentTime = Date.parse(current.at);
    if (!Number.isFinite(currentTime) || currentTime < lastTime) {
      return failureOutcome("out_of_order_event", index, current);
    }
    lastTime = currentTime;
    if (index === 0) continue;

    if (state.terminal && isCoreEventAfterTerminal(current)) {
      const code =
        current.data.eventType === "run.completed" || current.data.eventType === "run.failed"
          ? "duplicate_evidence"
          : "conflicting_evidence";
      return failureOutcome(code, index, current);
    }

    if (current.data.eventType === "run.completed") {
      if (!completedMetadataIsCompatible(current) || !terminalIsCompatible(state, current)) {
        return failureOutcome("incompatible_terminal", index, current);
      }
      state.terminal = {
        kind: "completed",
        eventId: current.eventId,
        stopReason: current.data.stopReason,
      };
      continue;
    }
    if (current.data.eventType === "run.failed") {
      if (
        current.metadata.result !== "failed" ||
        current.metadata.errorCode !== "agent_run_failed"
      ) {
        return failureOutcome("incompatible_terminal", index, current);
      }
      state.terminal = {
        kind: "failed",
        eventId: current.eventId,
        stopReason: "agent_run_failed",
      };
      continue;
    }

    const failure = applyEvent(state, current);
    if (failure) return failureOutcome(failure, index, current);
  }

  const authority = projectAuthority(state, projectionInput.authority);
  if (!authority.ok) return failureOutcome("authority_mismatch");
  const last = projectionInput.events.at(-1);
  if (!last) return failureOutcome("missing_start");

  const projection: RunProjection = {
    runId: state.runId,
    leadId: state.leadId,
    status: statusFrom(state.terminal, state.approval, state.fakeSend, authority.value),
    latestSafeCheckpoint: state.checkpoint,
    terminalOutcome: state.terminal,
    workingContext: {
      qualification: state.qualification,
      draft: state.draft,
      approval: state.approval,
      fakeSend: state.fakeSend,
    },
    authority: authority.value,
    eventCount: projectionInput.events.length,
    lastEventId: last.eventId,
  };
  return isRunProjection(projection) ? successOutcome(projection) : failureOutcome("invalid_input");
}

function isReadOnlyRunEventStore(value: unknown): value is Pick<RunEventStore, "readRun"> {
  try {
    return (
      typeof value === "object" &&
      value !== null &&
      "readRun" in value &&
      typeof value.readRun === "function"
    );
  } catch {
    return false;
  }
}

export function projectStoredRun(
  store: unknown,
  runId: unknown,
  authority?: unknown,
): RunProjectionOutcome {
  if (!isRunId(runId)) return failureOutcome("invalid_input");
  if (!isReadOnlyRunEventStore(store)) return failureOutcome("storage_failure");
  let readOutcome: unknown;
  try {
    readOutcome = store.readRun(runId);
  } catch {
    return failureOutcome("storage_failure");
  }
  if (!isRunEventReadOutcome(readOutcome)) {
    return failureOutcome("storage_failure");
  }
  if (!readOutcome.ok) {
    const code: RunProjectionFailureCode =
      readOutcome.error.code === "corrupt_record"
        ? "corrupt_history"
        : readOutcome.error.code === "interrupted_write"
          ? "interrupted_history"
          : readOutcome.error.code === "out_of_order_record"
            ? "out_of_order_event"
            : readOutcome.error.code === "duplicate_event"
              ? "duplicate_evidence"
              : readOutcome.error.code === "invalid_input"
                ? "invalid_input"
                : "storage_failure";
    return failureOutcome(code);
  }
  const input =
    authority === undefined
      ? { runId, events: readOutcome.value }
      : { runId, events: readOutcome.value, authority };
  return projectRunEvents(input);
}
