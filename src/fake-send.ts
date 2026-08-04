import { createHash } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import { Type } from "typebox";
import Schema from "typebox/schema";
import {
  ApprovalActionSchema,
  ApprovalDraftSchema,
  ApprovalTargetSchema,
  hashApprovalDraft,
  isApprovalRecord,
  isApprovalStoreReadOutcome,
  type ApprovalStore,
} from "./approval.js";

const RunIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern:
    "^(?:run_[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$",
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

const IdempotencyKeySchema = Sha256Schema;
const DurationMsSchema = Type.Integer({ minimum: 0, maximum: 60_000 });
const ReservationIdSchema = Type.String({
  minLength: 16,
  maxLength: 100,
  pattern: "^reservation_[a-z0-9_-]+$",
});
const ResultIdSchema = Type.String({
  minLength: 12,
  maxLength: 100,
  pattern: "^result_[a-z0-9_-]+$",
});
const RecordIdSchema = Type.String({
  minLength: 10,
  maxLength: 120,
  pattern: "^record_[a-z0-9_-]+$",
});
const ReceiptIdSchema = Type.String({
  minLength: 12,
  maxLength: 100,
  pattern: "^fake_receipt_[a-z0-9_-]+$",
});

export {
  ApprovalIdSchema as FakeSendApprovalIdSchema,
  DraftIdSchema as FakeSendDraftIdSchema,
  DurationMsSchema as FakeSendDurationMsSchema,
  IdempotencyKeySchema as FakeSendIdempotencyKeySchema,
  IsoTimestampSchema as FakeSendIsoTimestampSchema,
  ReceiptIdSchema as FakeSendReceiptIdSchema,
  RecordIdSchema as FakeSendRecordIdSchema,
  ReservationIdSchema as FakeSendReservationIdSchema,
  ResultIdSchema as FakeSendResultIdSchema,
  RunIdSchema as FakeSendRunIdSchema,
  Sha256Schema as FakeSendSha256Schema,
};

const actorIdValidator = Schema.Compile(ActorIdSchema);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidIsoTimestamp(value: string): boolean {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

export { isValidIsoTimestamp as isFakeSendIsoTimestamp };

export const FAKE_SEND_TIMEOUT_MS = 1_000;
export const FAKE_SEND_IDEMPOTENCY_VERSION = "v1" as const;

export const FakeSendRequestSchema = Type.Object(
  {
    approvalId: ApprovalIdSchema,
    runId: RunIdSchema,
    actorId: ActorIdSchema,
    action: ApprovalActionSchema,
    target: ApprovalTargetSchema,
    draftId: DraftIdSchema,
  },
  { additionalProperties: false },
);

export type FakeSendRequest = Type.Static<typeof FakeSendRequestSchema>;

const fakeSendRequestValidator = Schema.Compile(FakeSendRequestSchema);

export function isFakeSendRequest(value: unknown): value is FakeSendRequest {
  return fakeSendRequestValidator.Check(value);
}

export const FakeSendFailureCodeSchema = Type.Union([
  Type.Literal("invalid_request"),
  Type.Literal("permission_denied"),
  Type.Literal("approval_not_found"),
  Type.Literal("approval_pending"),
  Type.Literal("approval_declined"),
  Type.Literal("approval_identity_mismatch"),
  Type.Literal("invalid_approval_record"),
  Type.Literal("storage_failure"),
  Type.Literal("duplicate"),
  Type.Literal("execution_in_progress"),
  Type.Literal("timed_out"),
  Type.Literal("rejected"),
  Type.Literal("downstream_failure"),
  Type.Literal("result_conflict"),
]);

export const FakeSendFailureSchema = Type.Object(
  {
    code: FakeSendFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 240 }),
    retryable: Type.Boolean(),
  },
  { additionalProperties: false },
);

export type FakeSendFailureCode = Type.Static<typeof FakeSendFailureCodeSchema>;
export type FakeSendFailure = Type.Static<typeof FakeSendFailureSchema>;

const failureMessages: Record<FakeSendFailureCode, string> = {
  invalid_request: "Fake-send request input is invalid.",
  permission_denied: "Actor is not authorized to request fake-send execution.",
  approval_not_found: "Approval does not exist.",
  approval_pending: "Approval is still pending and cannot authorize fake-send execution.",
  approval_declined: "Approval was declined and cannot authorize fake-send execution.",
  approval_identity_mismatch: "Request identity does not match the approved action.",
  invalid_approval_record: "Approval evidence is invalid and cannot authorize execution.",
  storage_failure: "Fake-send storage operation failed.",
  duplicate: "The approved action already has a persisted fake-send result.",
  execution_in_progress: "The approved action has a durable reservation without a result.",
  timed_out: "Fake-send execution exceeded its application deadline.",
  rejected: "The fake adapter rejected the approved action.",
  downstream_failure: "The fake adapter failed without accepting the action.",
  result_conflict: "Fake-send result conflicts with the durable reservation.",
};

const retryableFailureCodes = new Set<FakeSendFailureCode>([
  "storage_failure",
  "execution_in_progress",
  "timed_out",
  "downstream_failure",
]);

export function makeFakeSendFailure(code: FakeSendFailureCode): FakeSendFailure {
  return {
    code,
    message: failureMessages[code],
    retryable: retryableFailureCodes.has(code),
  };
}

const fakeSendFailureValidator = Schema.Compile(FakeSendFailureSchema);

export function isFakeSendFailure(value: unknown): value is FakeSendFailure {
  if (!fakeSendFailureValidator.Check(value)) return false;
  const failure = value as FakeSendFailure;
  return isDeepStrictEqual(failure, makeFakeSendFailure(failure.code));
}

export type FakeSendIdempotencyInput = {
  approvalId: string;
  runId: string;
  action: "send_follow_up";
  target: { kind: "lead"; leadId: string };
  draftId: string;
  draftSha256: string;
};

function encodeIdempotencyField(value: string): string {
  return `${Buffer.byteLength(value, "utf8")}:${value}`;
}

export function deriveFakeSendIdempotencyKey(input: FakeSendIdempotencyInput): string {
  const material = [
    "fake-send",
    FAKE_SEND_IDEMPOTENCY_VERSION,
    input.approvalId,
    input.runId,
    input.action,
    input.target.kind,
    input.target.leadId,
    input.draftId,
    input.draftSha256,
  ]
    .map(encodeIdempotencyField)
    .join("|");
  return createHash("sha256").update(material, "utf8").digest("hex");
}

export const FakeSendCommandSchema = Type.Object(
  {
    approvalId: ApprovalIdSchema,
    runId: RunIdSchema,
    actorId: ActorIdSchema,
    action: ApprovalActionSchema,
    target: ApprovalTargetSchema,
    draft: ApprovalDraftSchema,
    approvedAt: IsoTimestampSchema,
    idempotencyKey: IdempotencyKeySchema,
  },
  { additionalProperties: false },
);

export type FakeSendCommand = Type.Static<typeof FakeSendCommandSchema>;

const fakeSendCommandValidator = Schema.Compile(FakeSendCommandSchema);

export function isFakeSendCommand(value: unknown): value is FakeSendCommand {
  if (!fakeSendCommandValidator.Check(value)) return false;
  const command = value as FakeSendCommand;
  if (!isValidIsoTimestamp(command.approvedAt)) return false;
  if (hashApprovalDraft(command.draft.content) !== command.draft.sha256) return false;
  return (
    command.idempotencyKey ===
    deriveFakeSendIdempotencyKey({
      approvalId: command.approvalId,
      runId: command.runId,
      action: command.action,
      target: command.target,
      draftId: command.draft.draftId,
      draftSha256: command.draft.sha256,
    })
  );
}

export const FakeSendAuthorizationOutcomeSchema = Type.Union([
  Type.Object(
    { ok: Type.Literal(true), value: FakeSendCommandSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: FakeSendFailureSchema },
    { additionalProperties: false },
  ),
]);

export type FakeSendAuthorizationOutcome = Type.Static<typeof FakeSendAuthorizationOutcomeSchema>;

const fakeSendAuthorizationOutcomeValidator = Schema.Compile(FakeSendAuthorizationOutcomeSchema);

export function isFakeSendAuthorizationOutcome(
  value: unknown,
): value is FakeSendAuthorizationOutcome {
  if (!fakeSendAuthorizationOutcomeValidator.Check(value)) return false;
  return value.ok ? isFakeSendCommand(value.value) : isFakeSendFailure(value.error);
}

export const FakeSendAdapterOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      status: Type.Literal("accepted"),
      receiptId: ReceiptIdSchema,
      acceptedAt: IsoTimestampSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      status: Type.Literal("rejected"),
      error: FakeSendFailureSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      status: Type.Literal("downstream_failure"),
      error: FakeSendFailureSchema,
    },
    { additionalProperties: false },
  ),
]);

export type FakeSendAdapterOutcome = Type.Static<typeof FakeSendAdapterOutcomeSchema>;
export type FakeSendAdapter = {
  execute(command: FakeSendCommand, signal: AbortSignal): Promise<FakeSendAdapterOutcome>;
};

const fakeSendAdapterOutcomeValidator = Schema.Compile(FakeSendAdapterOutcomeSchema);

export function isFakeSendAdapterOutcome(value: unknown): value is FakeSendAdapterOutcome {
  if (!fakeSendAdapterOutcomeValidator.Check(value)) return false;
  if (value.ok) return isValidIsoTimestamp(value.acceptedAt);
  return isFakeSendFailure(value.error) && value.error.code === value.status;
}

export type FakeSendAuthorizerOptions = {
  authorizedActorIds?: ReadonlySet<string>;
};

function approvalReadFailure(raw: unknown): FakeSendFailure {
  if (
    isObject(raw) &&
    raw.ok === true &&
    "value" in raw &&
    raw.value !== null &&
    !isApprovalRecord(raw.value)
  ) {
    return makeFakeSendFailure("invalid_approval_record");
  }
  return makeFakeSendFailure("storage_failure");
}

export class FakeSendAuthorizer {
  private readonly authorizedActorIds: ReadonlySet<string>;

  constructor(
    private readonly approvals: Pick<ApprovalStore, "get">,
    options: FakeSendAuthorizerOptions = {},
  ) {
    const actors = new Set<string>();
    try {
      for (const actorId of options.authorizedActorIds ?? []) {
        if (actorIdValidator.Check(actorId)) actors.add(actorId);
      }
    } catch {
      actors.clear();
    }
    this.authorizedActorIds = actors;
  }

  authorize(input: unknown): FakeSendAuthorizationOutcome {
    if (!isFakeSendRequest(input)) {
      return { ok: false, error: makeFakeSendFailure("invalid_request") };
    }
    if (!this.authorizedActorIds.has(input.actorId)) {
      return { ok: false, error: makeFakeSendFailure("permission_denied") };
    }

    let raw: unknown;
    try {
      raw = this.approvals.get(input.approvalId);
    } catch {
      return { ok: false, error: makeFakeSendFailure("storage_failure") };
    }

    try {
      if (!isApprovalStoreReadOutcome(raw)) {
        return { ok: false, error: approvalReadFailure(raw) };
      }
      if (!raw.ok) {
        const invalidCodes = new Set([
          "corrupt_record",
          "out_of_order_record",
          "interrupted_write",
        ]);
        return {
          ok: false,
          error: makeFakeSendFailure(
            invalidCodes.has(raw.error.code) ? "invalid_approval_record" : "storage_failure",
          ),
        };
      }
      if (raw.value === null) {
        return { ok: false, error: makeFakeSendFailure("approval_not_found") };
      }
      if (raw.value.approvalId !== input.approvalId) {
        return { ok: false, error: makeFakeSendFailure("storage_failure") };
      }
      if (raw.value.runId !== input.runId) {
        return { ok: false, error: makeFakeSendFailure("approval_identity_mismatch") };
      }
      if (raw.value.status === "pending") {
        return { ok: false, error: makeFakeSendFailure("approval_pending") };
      }
      if (raw.value.status === "declined") {
        return { ok: false, error: makeFakeSendFailure("approval_declined") };
      }
      if (
        raw.value.action !== input.action ||
        raw.value.target.kind !== input.target.kind ||
        raw.value.target.leadId !== input.target.leadId ||
        raw.value.draft.draftId !== input.draftId
      ) {
        return { ok: false, error: makeFakeSendFailure("approval_identity_mismatch") };
      }

      const target = Object.freeze({ ...raw.value.target });
      const draft = Object.freeze({ ...raw.value.draft });
      const command: FakeSendCommand = Object.freeze({
        approvalId: raw.value.approvalId,
        runId: raw.value.runId,
        actorId: input.actorId,
        action: raw.value.action,
        target,
        draft,
        approvedAt: raw.value.decision.decidedAt,
        idempotencyKey: deriveFakeSendIdempotencyKey({
          approvalId: raw.value.approvalId,
          runId: raw.value.runId,
          action: raw.value.action,
          target: raw.value.target,
          draftId: raw.value.draft.draftId,
          draftSha256: raw.value.draft.sha256,
        }),
      });

      return isFakeSendCommand(command)
        ? { ok: true, value: command }
        : { ok: false, error: makeFakeSendFailure("invalid_approval_record") };
    } catch {
      return { ok: false, error: makeFakeSendFailure("storage_failure") };
    }
  }
}
