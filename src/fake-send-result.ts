import { isDeepStrictEqual } from "node:util";
import { Type } from "typebox";
import Schema from "typebox/schema";
import { ApprovalActionSchema, ApprovalTargetSchema } from "./approval.js";
import {
  FakeSendApprovalIdSchema as ApprovalIdSchema,
  FakeSendDraftIdSchema as DraftIdSchema,
  FakeSendDurationMsSchema as DurationMsSchema,
  FakeSendFailureSchema,
  FakeSendIdempotencyKeySchema as IdempotencyKeySchema,
  FakeSendIsoTimestampSchema as IsoTimestampSchema,
  FakeSendReceiptIdSchema as ReceiptIdSchema,
  FakeSendRecordIdSchema as RecordIdSchema,
  FakeSendReservationIdSchema as ReservationIdSchema,
  FakeSendResultIdSchema as ResultIdSchema,
  FakeSendRunIdSchema as RunIdSchema,
  FakeSendSha256Schema as Sha256Schema,
  deriveFakeSendIdempotencyKey,
  isFakeSendFailure,
  isFakeSendIsoTimestamp as isValidIsoTimestamp,
} from "./fake-send.js";

const FakeSendOutcomeEventSchema = Type.Union([
  Type.Object(
    {
      eventType: Type.Literal("fake_send.accepted"),
      approvalId: ApprovalIdSchema,
      idempotencyKey: IdempotencyKeySchema,
      durationMs: DurationMsSchema,
      outcome: Type.Literal("accepted"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("fake_send.duplicate"),
      approvalId: ApprovalIdSchema,
      idempotencyKey: IdempotencyKeySchema,
      durationMs: DurationMsSchema,
      outcome: Type.Literal("duplicate"),
      originalStatus: Type.Union([
        Type.Literal("accepted"),
        Type.Literal("rejected"),
        Type.Literal("timed_out"),
        Type.Literal("downstream_failure"),
        Type.Literal("execution_in_progress"),
      ]),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("fake_send.rejected"),
      approvalId: ApprovalIdSchema,
      idempotencyKey: IdempotencyKeySchema,
      durationMs: DurationMsSchema,
      outcome: Type.Literal("rejected"),
      code: Type.Literal("rejected"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("fake_send.timed_out"),
      approvalId: ApprovalIdSchema,
      idempotencyKey: IdempotencyKeySchema,
      durationMs: DurationMsSchema,
      outcome: Type.Literal("timed_out"),
      code: Type.Literal("timed_out"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("fake_send.downstream_failed"),
      approvalId: ApprovalIdSchema,
      idempotencyKey: IdempotencyKeySchema,
      durationMs: DurationMsSchema,
      outcome: Type.Literal("downstream_failure"),
      code: Type.Literal("downstream_failure"),
    },
    { additionalProperties: false },
  ),
]);

export const FakeSendEventDataSchema = Type.Union([
  Type.Object(
    {
      eventType: Type.Literal("fake_send.attempted"),
      approvalId: ApprovalIdSchema,
      idempotencyKey: IdempotencyKeySchema,
    },
    { additionalProperties: false },
  ),
  FakeSendOutcomeEventSchema,
  Type.Object(
    {
      eventType: Type.Literal("fake_send.permission_denied"),
      approvalId: ApprovalIdSchema,
      code: Type.Literal("permission_denied"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("fake_send.storage_failed"),
      approvalId: ApprovalIdSchema,
      idempotencyKey: Type.Optional(IdempotencyKeySchema),
      code: Type.Literal("storage_failure"),
    },
    { additionalProperties: false },
  ),
]);

export type FakeSendEventData = Type.Static<typeof FakeSendEventDataSchema>;

const fakeSendEventDataValidator = Schema.Compile(FakeSendEventDataSchema);

export function isFakeSendEventData(value: unknown): value is FakeSendEventData {
  return fakeSendEventDataValidator.Check(value);
}

const fakeSendIdentityProperties = {
  idempotencyKey: IdempotencyKeySchema,
  approvalId: ApprovalIdSchema,
  runId: RunIdSchema,
  action: ApprovalActionSchema,
  target: ApprovalTargetSchema,
  draftId: DraftIdSchema,
  draftSha256: Sha256Schema,
};

export const FakeSendReservationSchema = Type.Object(
  {
    reservationId: ReservationIdSchema,
    ...fakeSendIdentityProperties,
    reservedAt: IsoTimestampSchema,
  },
  { additionalProperties: false },
);

export type FakeSendReservation = Type.Static<typeof FakeSendReservationSchema>;

const CompensationSchema = Type.Object(
  {
    supported: Type.Literal(false),
    code: Type.Literal("manual_review_required"),
  },
  { additionalProperties: false },
);

const fakeSendResultCommon = {
  resultId: ResultIdSchema,
  ...fakeSendIdentityProperties,
  startedAt: IsoTimestampSchema,
  completedAt: IsoTimestampSchema,
  durationMs: DurationMsSchema,
  compensation: CompensationSchema,
};

const AcceptedFakeSendResultSchema = Type.Object(
  {
    ...fakeSendResultCommon,
    status: Type.Literal("accepted"),
    receiptId: ReceiptIdSchema,
  },
  { additionalProperties: false },
);

const RejectedFakeSendResultSchema = Type.Object(
  {
    ...fakeSendResultCommon,
    status: Type.Literal("rejected"),
    error: FakeSendFailureSchema,
  },
  { additionalProperties: false },
);

const TimedOutFakeSendResultSchema = Type.Object(
  {
    ...fakeSendResultCommon,
    status: Type.Literal("timed_out"),
    error: FakeSendFailureSchema,
  },
  { additionalProperties: false },
);

const DownstreamFailedFakeSendResultSchema = Type.Object(
  {
    ...fakeSendResultCommon,
    status: Type.Literal("downstream_failure"),
    error: FakeSendFailureSchema,
  },
  { additionalProperties: false },
);

export const FakeSendResultSchema = Type.Union([
  AcceptedFakeSendResultSchema,
  RejectedFakeSendResultSchema,
  TimedOutFakeSendResultSchema,
  DownstreamFailedFakeSendResultSchema,
]);

export type FakeSendResult = Type.Static<typeof FakeSendResultSchema>;

const fakeSendReservationValidator = Schema.Compile(FakeSendReservationSchema);
const fakeSendResultValidator = Schema.Compile(FakeSendResultSchema);

export type FakeSendIdentity = Pick<
  FakeSendReservation,
  "idempotencyKey" | "approvalId" | "runId" | "action" | "target" | "draftId" | "draftSha256"
>;

function hasValidFakeSendIdentity(value: FakeSendIdentity): boolean {
  return (
    value.idempotencyKey ===
    deriveFakeSendIdempotencyKey({
      approvalId: value.approvalId,
      runId: value.runId,
      action: value.action,
      target: value.target,
      draftId: value.draftId,
      draftSha256: value.draftSha256,
    })
  );
}

export function hasSameFakeSendIdentity(left: FakeSendIdentity, right: FakeSendIdentity): boolean {
  return (
    left.idempotencyKey === right.idempotencyKey &&
    left.approvalId === right.approvalId &&
    left.runId === right.runId &&
    left.action === right.action &&
    isDeepStrictEqual(left.target, right.target) &&
    left.draftId === right.draftId &&
    left.draftSha256 === right.draftSha256
  );
}

export function isFakeSendReservation(value: unknown): value is FakeSendReservation {
  if (!fakeSendReservationValidator.Check(value)) return false;
  const reservation = value as FakeSendReservation;
  return isValidIsoTimestamp(reservation.reservedAt) && hasValidFakeSendIdentity(reservation);
}

export function isFakeSendResult(value: unknown): value is FakeSendResult {
  if (!fakeSendResultValidator.Check(value)) return false;
  const result = value as FakeSendResult;
  if (!isValidIsoTimestamp(result.startedAt) || !isValidIsoTimestamp(result.completedAt)) {
    return false;
  }
  const elapsed = Date.parse(result.completedAt) - Date.parse(result.startedAt);
  if (elapsed < 0 || result.durationMs !== elapsed) return false;
  if (!hasValidFakeSendIdentity(result)) return false;
  return result.status === "accepted"
    ? true
    : isFakeSendFailure(result.error) && result.error.code === result.status;
}

export const FakeSendStoreProjectionSchema = Type.Union([
  Type.Object(
    {
      state: Type.Literal("reserved"),
      reservation: FakeSendReservationSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      state: Type.Literal("completed"),
      reservation: FakeSendReservationSchema,
      result: FakeSendResultSchema,
    },
    { additionalProperties: false },
  ),
]);

export type FakeSendStoreProjection = Type.Static<typeof FakeSendStoreProjectionSchema>;

const fakeSendStoreProjectionValidator = Schema.Compile(FakeSendStoreProjectionSchema);

export function isFakeSendStoreProjection(value: unknown): value is FakeSendStoreProjection {
  if (!fakeSendStoreProjectionValidator.Check(value)) return false;
  if (!isFakeSendReservation(value.reservation)) return false;
  if (value.state === "reserved") return true;
  return (
    isFakeSendResult(value.result) &&
    hasSameFakeSendIdentity(value.reservation, value.result) &&
    value.result.startedAt === value.reservation.reservedAt
  );
}

export const FakeSendStorageRecordSchema = Type.Union([
  Type.Object(
    {
      recordId: RecordIdSchema,
      recordedAt: IsoTimestampSchema,
      type: Type.Literal("fake_send.reserved"),
      reservation: FakeSendReservationSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      recordId: RecordIdSchema,
      recordedAt: IsoTimestampSchema,
      type: Type.Literal("fake_send.completed"),
      result: FakeSendResultSchema,
    },
    { additionalProperties: false },
  ),
]);

export type FakeSendStorageRecord = Type.Static<typeof FakeSendStorageRecordSchema>;

const fakeSendStorageRecordValidator = Schema.Compile(FakeSendStorageRecordSchema);

export function isFakeSendStorageRecord(value: unknown): value is FakeSendStorageRecord {
  if (!fakeSendStorageRecordValidator.Check(value)) return false;
  const record = value as FakeSendStorageRecord;
  if (!isValidIsoTimestamp(record.recordedAt)) return false;
  if (record.type === "fake_send.reserved") {
    return (
      isFakeSendReservation(record.reservation) &&
      Date.parse(record.recordedAt) >= Date.parse(record.reservation.reservedAt)
    );
  }
  return (
    isFakeSendResult(record.result) &&
    Date.parse(record.recordedAt) >= Date.parse(record.result.completedAt)
  );
}

export const FakeSendResultStoreClaimOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      kind: Type.Literal("claimed"),
      value: FakeSendReservationSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      kind: Type.Literal("duplicate"),
      value: FakeSendStoreProjectionSchema,
      error: FakeSendFailureSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      kind: Type.Literal("failure"),
      error: FakeSendFailureSchema,
    },
    { additionalProperties: false },
  ),
]);

export const FakeSendResultStoreCompleteOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      value: Type.Object(
        {
          state: Type.Literal("completed"),
          reservation: FakeSendReservationSchema,
          result: FakeSendResultSchema,
        },
        { additionalProperties: false },
      ),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: FakeSendFailureSchema },
    { additionalProperties: false },
  ),
]);

export const FakeSendResultStoreReadOutcomeSchema = Type.Union([
  Type.Object(
    { ok: Type.Literal(true), value: Type.Union([FakeSendStoreProjectionSchema, Type.Null()]) },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: FakeSendFailureSchema },
    { additionalProperties: false },
  ),
]);

export type FakeSendResultStoreClaimOutcome = Type.Static<
  typeof FakeSendResultStoreClaimOutcomeSchema
>;
export type FakeSendResultStoreCompleteOutcome = Type.Static<
  typeof FakeSendResultStoreCompleteOutcomeSchema
>;
export type FakeSendResultStoreReadOutcome = Type.Static<
  typeof FakeSendResultStoreReadOutcomeSchema
>;

export type FakeSendResultStore = {
  claim(reservation: FakeSendReservation): FakeSendResultStoreClaimOutcome;
  complete(result: FakeSendResult): FakeSendResultStoreCompleteOutcome;
  get(idempotencyKey: string): FakeSendResultStoreReadOutcome;
};

const fakeSendResultStoreClaimOutcomeValidator = Schema.Compile(
  FakeSendResultStoreClaimOutcomeSchema,
);
const fakeSendResultStoreCompleteOutcomeValidator = Schema.Compile(
  FakeSendResultStoreCompleteOutcomeSchema,
);
const fakeSendResultStoreReadOutcomeValidator = Schema.Compile(
  FakeSendResultStoreReadOutcomeSchema,
);

export function isFakeSendResultStoreClaimOutcome(
  value: unknown,
): value is FakeSendResultStoreClaimOutcome {
  if (!fakeSendResultStoreClaimOutcomeValidator.Check(value)) return false;
  if (value.ok) return isFakeSendReservation(value.value);
  if (!isFakeSendFailure(value.error)) return false;
  if (value.kind === "failure") {
    return [
      "storage_failure",
      "corrupt_record",
      "interrupted_write",
      "out_of_order_record",
      "result_conflict",
    ].includes(value.error.code);
  }
  if (!isFakeSendStoreProjection(value.value)) return false;
  return value.value.state === "completed"
    ? value.error.code === "duplicate"
    : value.error.code === "execution_in_progress";
}

export function isFakeSendResultStoreCompleteOutcome(
  value: unknown,
): value is FakeSendResultStoreCompleteOutcome {
  if (!fakeSendResultStoreCompleteOutcomeValidator.Check(value)) return false;
  return value.ok
    ? isFakeSendStoreProjection(value.value)
    : isFakeSendFailure(value.error) &&
        [
          "storage_failure",
          "corrupt_record",
          "interrupted_write",
          "out_of_order_record",
          "result_conflict",
        ].includes(value.error.code);
}

export function isFakeSendResultStoreReadOutcome(
  value: unknown,
): value is FakeSendResultStoreReadOutcome {
  if (!fakeSendResultStoreReadOutcomeValidator.Check(value)) return false;
  return value.ok
    ? value.value === null || isFakeSendStoreProjection(value.value)
    : isFakeSendFailure(value.error) &&
        ["storage_failure", "corrupt_record", "interrupted_write", "out_of_order_record"].includes(
          value.error.code,
        );
}
