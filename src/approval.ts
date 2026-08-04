import { createHash, randomUUID } from "node:crypto";
import { Type } from "typebox";
import Schema from "typebox/schema";

const RunIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern:
    "^(?:run_[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$",
});

const LeadIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern: "^lead_[a-z0-9_]+$",
});

const ApprovalIdSchema = Type.String({
  minLength: 12,
  maxLength: 100,
  pattern: "^approval_[a-z0-9_-]+$",
});

const DraftIdSchema = Type.String({
  minLength: 10,
  maxLength: 100,
  pattern: "^draft_[a-z0-9_-]+$",
});

const ActorIdSchema = Type.String({
  minLength: 7,
  maxLength: 100,
  pattern: "^actor_[a-z0-9_-]+$",
});

const IsoTimestampSchema = Type.String({
  minLength: 24,
  maxLength: 30,
  pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]{3})?Z$",
});

const Sha256Schema = Type.String({
  minLength: 64,
  maxLength: 64,
  pattern: "^[0-9a-f]{64}$",
});

export const ApprovalActionSchema = Type.Literal("send_follow_up");

export const ApprovalTargetSchema = Type.Object(
  {
    kind: Type.Literal("lead"),
    leadId: LeadIdSchema,
  },
  { additionalProperties: false },
);

export const ApprovalDraftSchema = Type.Object(
  {
    draftId: DraftIdSchema,
    sha256: Sha256Schema,
    content: Type.String({ minLength: 20, maxLength: 10_000 }),
  },
  { additionalProperties: false },
);

const ApprovedDecisionSchema = Type.Object(
  {
    actorId: ActorIdSchema,
    decision: Type.Literal("approved"),
    decidedAt: IsoTimestampSchema,
  },
  { additionalProperties: false },
);

const DeclinedDecisionSchema = Type.Object(
  {
    actorId: ActorIdSchema,
    decision: Type.Literal("declined"),
    decidedAt: IsoTimestampSchema,
  },
  { additionalProperties: false },
);

const commonApprovalProperties = {
  approvalId: ApprovalIdSchema,
  runId: RunIdSchema,
  action: ApprovalActionSchema,
  target: ApprovalTargetSchema,
  draft: ApprovalDraftSchema,
  requestedAt: IsoTimestampSchema,
};

export const PendingApprovalSchema = Type.Object(
  {
    ...commonApprovalProperties,
    status: Type.Literal("pending"),
    decision: Type.Null(),
  },
  { additionalProperties: false },
);

export const ApprovedApprovalSchema = Type.Object(
  {
    ...commonApprovalProperties,
    status: Type.Literal("approved"),
    decision: ApprovedDecisionSchema,
  },
  { additionalProperties: false },
);

export const DeclinedApprovalSchema = Type.Object(
  {
    ...commonApprovalProperties,
    status: Type.Literal("declined"),
    decision: DeclinedDecisionSchema,
  },
  { additionalProperties: false },
);

export const ApprovalRecordSchema = Type.Union([
  PendingApprovalSchema,
  ApprovedApprovalSchema,
  DeclinedApprovalSchema,
]);

export type ApprovalAction = Type.Static<typeof ApprovalActionSchema>;
export type ApprovalTarget = Type.Static<typeof ApprovalTargetSchema>;
export type ApprovalDraft = Type.Static<typeof ApprovalDraftSchema>;
export type PendingApproval = Type.Static<typeof PendingApprovalSchema>;
export type ApprovedApproval = Type.Static<typeof ApprovedApprovalSchema>;
export type DeclinedApproval = Type.Static<typeof DeclinedApprovalSchema>;
export type TerminalApproval = ApprovedApproval | DeclinedApproval;
export type ApprovalRecord = Type.Static<typeof ApprovalRecordSchema>;

const approvalRecordValidator = Schema.Compile(ApprovalRecordSchema);

function isValidIsoTimestamp(value: string): boolean {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

export function hashApprovalDraft(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function isApprovalRecord(value: unknown): value is ApprovalRecord {
  if (!approvalRecordValidator.Check(value)) return false;
  const candidate = value as ApprovalRecord;
  if (!isValidIsoTimestamp(candidate.requestedAt)) return false;
  if (hashApprovalDraft(candidate.draft.content) !== candidate.draft.sha256) return false;
  if (candidate.status === "pending") return true;
  if (!isValidIsoTimestamp(candidate.decision.decidedAt)) return false;
  return Date.parse(candidate.decision.decidedAt) >= Date.parse(candidate.requestedAt);
}

export const ApprovalDecisionInputSchema = Type.Object(
  {
    approvalId: ApprovalIdSchema,
    runId: RunIdSchema,
    actorId: ActorIdSchema,
    decision: Type.Union([Type.Literal("approved"), Type.Literal("declined")]),
  },
  { additionalProperties: false },
);

export const ApprovalFailureCodeSchema = Type.Union([
  Type.Literal("invalid_request"),
  Type.Literal("invalid_decision"),
  Type.Literal("approval_not_found"),
  Type.Literal("unknown_actor"),
  Type.Literal("approval_identity_mismatch"),
  Type.Literal("invalid_approval_record"),
  Type.Literal("approval_already_decided"),
  Type.Literal("approval_conflict"),
  Type.Literal("duplicate_request"),
  Type.Literal("corrupt_record"),
  Type.Literal("out_of_order_record"),
  Type.Literal("interrupted_write"),
  Type.Literal("storage_failure"),
]);

export const ApprovalFailureSchema = Type.Object(
  {
    code: ApprovalFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 240 }),
    retryable: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const ApprovalCreationOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      value: PendingApprovalSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      error: ApprovalFailureSchema,
    },
    { additionalProperties: false },
  ),
]);

export const ApprovalTransitionOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      kind: Type.Literal("transitioned"),
      value: Type.Union([ApprovedApprovalSchema, DeclinedApprovalSchema]),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      kind: Type.Literal("duplicate"),
      value: Type.Union([ApprovedApprovalSchema, DeclinedApprovalSchema]),
      error: ApprovalFailureSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      kind: Type.Literal("conflict"),
      value: Type.Union([ApprovedApprovalSchema, DeclinedApprovalSchema]),
      error: ApprovalFailureSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      kind: Type.Literal("failure"),
      error: ApprovalFailureSchema,
    },
    { additionalProperties: false },
  ),
]);

export type ApprovalDecisionInput = Type.Static<typeof ApprovalDecisionInputSchema>;
export type ApprovalFailureCode = Type.Static<typeof ApprovalFailureCodeSchema>;
export type ApprovalFailure = Type.Static<typeof ApprovalFailureSchema>;
export type ApprovalCreationOutcome = Type.Static<typeof ApprovalCreationOutcomeSchema>;
export type ApprovalTransitionOutcome = Type.Static<typeof ApprovalTransitionOutcomeSchema>;

const approvalDecisionInputValidator = Schema.Compile(ApprovalDecisionInputSchema);
const approvalCreationOutcomeValidator = Schema.Compile(ApprovalCreationOutcomeSchema);
const approvalTransitionOutcomeValidator = Schema.Compile(ApprovalTransitionOutcomeSchema);

const failureMessages: Record<ApprovalFailureCode, string> = {
  invalid_request: "Approval request input is invalid.",
  invalid_decision: "Approval decision input is invalid.",
  approval_not_found: "Approval does not exist.",
  unknown_actor: "Approval actor is not authorized.",
  approval_identity_mismatch: "Approval identity does not match the requested run.",
  invalid_approval_record: "Approval record is invalid.",
  approval_already_decided: "Approval already has the requested terminal decision.",
  approval_conflict: "Approval already has the opposite terminal decision.",
  duplicate_request: "Approval request already exists.",
  corrupt_record: "Approval storage contains a corrupt record.",
  out_of_order_record: "Approval storage records are out of order.",
  interrupted_write: "Approval storage contains an interrupted write.",
  storage_failure: "Approval storage operation failed.",
};

export function makeApprovalFailure(code: ApprovalFailureCode): ApprovalFailure {
  return {
    code,
    message: failureMessages[code],
    retryable: code === "interrupted_write" || code === "storage_failure",
  };
}

export function isApprovalDecisionInput(value: unknown): value is ApprovalDecisionInput {
  return approvalDecisionInputValidator.Check(value);
}

export function isApprovalCreationOutcome(value: unknown): value is ApprovalCreationOutcome {
  if (!approvalCreationOutcomeValidator.Check(value)) return false;
  return !value.ok || isApprovalRecord(value.value);
}

export function isApprovalTransitionOutcome(value: unknown): value is ApprovalTransitionOutcome {
  if (!approvalTransitionOutcomeValidator.Check(value)) return false;
  if (value.kind === "failure") return true;
  if (!isApprovalRecord(value.value)) return false;
  if (value.kind === "duplicate") return value.error.code === "approval_already_decided";
  if (value.kind === "conflict") return value.error.code === "approval_conflict";
  return true;
}

const RecordIdSchema = Type.String({
  minLength: 10,
  maxLength: 100,
  pattern: "^record_[a-z0-9_-]+$",
});

export const ApprovalRequestStorageRecordSchema = Type.Object(
  {
    recordId: RecordIdSchema,
    recordedAt: IsoTimestampSchema,
    type: Type.Literal("approval.requested"),
    approval: PendingApprovalSchema,
  },
  { additionalProperties: false },
);

export const ApprovalDecisionStorageRecordSchema = Type.Union([
  Type.Object(
    {
      recordId: RecordIdSchema,
      recordedAt: IsoTimestampSchema,
      type: Type.Literal("approval.approved"),
      approvalId: ApprovalIdSchema,
      runId: RunIdSchema,
      decision: ApprovedDecisionSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      recordId: RecordIdSchema,
      recordedAt: IsoTimestampSchema,
      type: Type.Literal("approval.declined"),
      approvalId: ApprovalIdSchema,
      runId: RunIdSchema,
      decision: DeclinedDecisionSchema,
    },
    { additionalProperties: false },
  ),
]);

export const ApprovalStorageRecordSchema = Type.Union([
  ApprovalRequestStorageRecordSchema,
  ApprovalDecisionStorageRecordSchema,
]);

export const ApprovalEventDataSchema = Type.Union([
  Type.Object(
    {
      eventType: Type.Literal("approval.requested"),
      approvalId: ApprovalIdSchema,
      action: ApprovalActionSchema,
      targetKind: Type.Literal("lead"),
      leadId: LeadIdSchema,
      draftId: DraftIdSchema,
      status: Type.Literal("pending"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("approval.approved"),
      approvalId: ApprovalIdSchema,
      actorId: ActorIdSchema,
      status: Type.Literal("approved"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("approval.declined"),
      approvalId: ApprovalIdSchema,
      actorId: ActorIdSchema,
      status: Type.Literal("declined"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("approval.decision_duplicate"),
      approvalId: ApprovalIdSchema,
      actorId: ActorIdSchema,
      requestedDecision: Type.Union([Type.Literal("approved"), Type.Literal("declined")]),
      status: Type.Union([Type.Literal("approved"), Type.Literal("declined")]),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("approval.decision_conflict"),
      approvalId: ApprovalIdSchema,
      actorId: ActorIdSchema,
      requestedDecision: Type.Union([Type.Literal("approved"), Type.Literal("declined")]),
      status: Type.Union([Type.Literal("approved"), Type.Literal("declined")]),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("approval.invalid"),
      approvalId: Type.Optional(ApprovalIdSchema),
      operation: Type.Union([Type.Literal("request"), Type.Literal("decision")]),
      code: ApprovalFailureCodeSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("approval.storage_failed"),
      approvalId: Type.Optional(ApprovalIdSchema),
      operation: Type.Union([
        Type.Literal("request"),
        Type.Literal("decision"),
        Type.Literal("read"),
      ]),
      code: ApprovalFailureCodeSchema,
    },
    { additionalProperties: false },
  ),
]);

const ApprovalStoreWriteOutcomeSchema = Type.Union([
  Type.Object(
    { ok: Type.Literal(true), value: ApprovalRecordSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: ApprovalFailureSchema },
    { additionalProperties: false },
  ),
]);

const ApprovalStoreReadOutcomeSchema = Type.Union([
  Type.Object(
    { ok: Type.Literal(true), value: Type.Union([ApprovalRecordSchema, Type.Null()]) },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: ApprovalFailureSchema },
    { additionalProperties: false },
  ),
]);

const ApprovalStoreListOutcomeSchema = Type.Union([
  Type.Object(
    { ok: Type.Literal(true), value: Type.Array(ApprovalRecordSchema) },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: ApprovalFailureSchema },
    { additionalProperties: false },
  ),
]);

export type ApprovalStorageRecord = Type.Static<typeof ApprovalStorageRecordSchema>;
export type ApprovalEventData = Type.Static<typeof ApprovalEventDataSchema>;
export type ApprovalStoreWriteOutcome = Type.Static<typeof ApprovalStoreWriteOutcomeSchema>;
export type ApprovalStoreReadOutcome = Type.Static<typeof ApprovalStoreReadOutcomeSchema>;
export type ApprovalStoreListOutcome = Type.Static<typeof ApprovalStoreListOutcomeSchema>;

export type ApprovalStore = {
  appendRequest(approval: PendingApproval): ApprovalStoreWriteOutcome;
  appendDecision(approval: TerminalApproval): ApprovalStoreWriteOutcome;
  get(approvalId: string): ApprovalStoreReadOutcome;
  listRun(runId: string): ApprovalStoreListOutcome;
};

const approvalStorageRecordValidator = Schema.Compile(ApprovalStorageRecordSchema);
const approvalEventDataValidator = Schema.Compile(ApprovalEventDataSchema);

export function isApprovalStorageRecord(value: unknown): value is ApprovalStorageRecord {
  if (!approvalStorageRecordValidator.Check(value)) return false;
  const candidate = value as ApprovalStorageRecord;
  if (!isValidIsoTimestamp(candidate.recordedAt)) return false;
  if (candidate.type === "approval.requested") {
    return (
      isApprovalRecord(candidate.approval) &&
      Date.parse(candidate.recordedAt) >= Date.parse(candidate.approval.requestedAt)
    );
  }
  if (!isValidIsoTimestamp(candidate.decision.decidedAt)) return false;
  return Date.parse(candidate.recordedAt) >= Date.parse(candidate.decision.decidedAt);
}

export function isApprovalEventData(value: unknown): value is ApprovalEventData {
  if (!approvalEventDataValidator.Check(value)) return false;
  const candidate = value as ApprovalEventData;
  if (candidate.eventType === "approval.decision_duplicate") {
    return candidate.status === candidate.requestedDecision;
  }
  if (candidate.eventType === "approval.decision_conflict") {
    return candidate.status !== candidate.requestedDecision;
  }
  return true;
}

export const ApprovalRequestInputSchema = Type.Object(
  {
    runId: RunIdSchema,
    leadId: LeadIdSchema,
    action: ApprovalActionSchema,
    draft: Type.String({ minLength: 20, maxLength: 10_000 }),
  },
  { additionalProperties: false },
);

export type ApprovalRequestInput = Type.Static<typeof ApprovalRequestInputSchema>;

export type ApprovalCreationOptions = {
  approvalId?: string;
  draftId?: string;
  now?: string;
};

const approvalRequestInputValidator = Schema.Compile(ApprovalRequestInputSchema);

export function createPendingApproval(
  input: unknown,
  options: ApprovalCreationOptions = {},
): ApprovalCreationOutcome {
  if (!approvalRequestInputValidator.Check(input)) {
    return { ok: false, error: makeApprovalFailure("invalid_request") };
  }

  const request = input as ApprovalRequestInput;
  const approval: PendingApproval = {
    approvalId: options.approvalId ?? `approval_${randomUUID()}`,
    runId: request.runId,
    action: request.action,
    target: { kind: "lead", leadId: request.leadId },
    draft: {
      draftId: options.draftId ?? `draft_${randomUUID()}`,
      sha256: hashApprovalDraft(request.draft),
      content: request.draft,
    },
    status: "pending",
    requestedAt: options.now ?? new Date().toISOString(),
    decision: null,
  };

  return isApprovalRecord(approval)
    ? { ok: true, value: approval }
    : { ok: false, error: makeApprovalFailure("invalid_request") };
}

export function transitionApproval(
  current: unknown,
  input: unknown,
  authorizedActorIds: ReadonlySet<string>,
  now: string = new Date().toISOString(),
): ApprovalTransitionOutcome {
  if (!isApprovalDecisionInput(input)) {
    return { ok: false, kind: "failure", error: makeApprovalFailure("invalid_decision") };
  }
  if (current === undefined || current === null) {
    return { ok: false, kind: "failure", error: makeApprovalFailure("approval_not_found") };
  }
  if (!isApprovalRecord(current)) {
    return {
      ok: false,
      kind: "failure",
      error: makeApprovalFailure("invalid_approval_record"),
    };
  }
  if (input.approvalId !== current.approvalId || input.runId !== current.runId) {
    return {
      ok: false,
      kind: "failure",
      error: makeApprovalFailure("approval_identity_mismatch"),
    };
  }
  if (!authorizedActorIds.has(input.actorId)) {
    return { ok: false, kind: "failure", error: makeApprovalFailure("unknown_actor") };
  }
  if (!isValidIsoTimestamp(now) || Date.parse(now) < Date.parse(current.requestedAt)) {
    return { ok: false, kind: "failure", error: makeApprovalFailure("invalid_decision") };
  }
  if (current.status !== "pending") {
    const isDuplicate = current.status === input.decision;
    return isDuplicate
      ? {
          ok: false,
          kind: "duplicate",
          value: current,
          error: makeApprovalFailure("approval_already_decided"),
        }
      : {
          ok: false,
          kind: "conflict",
          value: current,
          error: makeApprovalFailure("approval_conflict"),
        };
  }

  const transitioned: TerminalApproval =
    input.decision === "approved"
      ? {
          ...current,
          status: "approved",
          decision: { actorId: input.actorId, decision: "approved", decidedAt: now },
        }
      : {
          ...current,
          status: "declined",
          decision: { actorId: input.actorId, decision: "declined", decidedAt: now },
        };

  return isApprovalRecord(transitioned)
    ? { ok: true, kind: "transitioned", value: transitioned }
    : {
        ok: false,
        kind: "failure",
        error: makeApprovalFailure("invalid_approval_record"),
      };
}
