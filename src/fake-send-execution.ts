import { isDeepStrictEqual } from "node:util";
import { Type } from "typebox";
import Schema from "typebox/schema";
import { FakeSendFailureSchema, isFakeSendFailure, type FakeSendFailure } from "./fake-send.js";
import {
  FakeSendResultSchema,
  isFakeSendResult,
  type FakeSendEventData,
  type FakeSendReservation,
  type FakeSendResult,
} from "./fake-send-result.js";

export const FakeSendExecutionOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      kind: Type.Union([Type.Literal("executed"), Type.Literal("duplicate")]),
      value: FakeSendResultSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      kind: Type.Union([Type.Literal("executed"), Type.Literal("duplicate")]),
      value: FakeSendResultSchema,
      error: FakeSendFailureSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      kind: Type.Literal("in_progress"),
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

export type FakeSendExecutionOutcome = Type.Static<typeof FakeSendExecutionOutcomeSchema>;
export type FakeSendExecutionResultKind = "executed" | "duplicate";

const fakeSendExecutionOutcomeValidator = Schema.Compile(FakeSendExecutionOutcomeSchema);
const genericFailureCodes = new Set<FakeSendFailure["code"]>([
  "invalid_request",
  "permission_denied",
  "approval_not_found",
  "approval_pending",
  "approval_declined",
  "approval_identity_mismatch",
  "invalid_approval_record",
  "storage_failure",
  "corrupt_record",
  "interrupted_write",
  "out_of_order_record",
  "result_conflict",
]);

export function freezeFakeSendReservation(value: FakeSendReservation): FakeSendReservation {
  return Object.freeze({
    ...value,
    target: Object.freeze({ ...value.target }),
  }) as FakeSendReservation;
}

export function freezeFakeSendResult(value: FakeSendResult): FakeSendResult {
  const frozen = {
    ...value,
    target: Object.freeze({ ...value.target }),
    compensation: Object.freeze({ ...value.compensation }),
    ...(value.status === "accepted" ? {} : { error: Object.freeze({ ...value.error }) }),
  };
  return Object.freeze(frozen) as FakeSendResult;
}

export function fakeSendTerminalEventData(result: FakeSendResult): FakeSendEventData {
  switch (result.status) {
    case "accepted":
      return {
        eventType: "fake_send.accepted",
        approvalId: result.approvalId,
        idempotencyKey: result.idempotencyKey,
        durationMs: result.durationMs,
        outcome: "accepted",
      };
    case "rejected":
      return {
        eventType: "fake_send.rejected",
        approvalId: result.approvalId,
        idempotencyKey: result.idempotencyKey,
        durationMs: result.durationMs,
        outcome: "rejected",
        code: "rejected",
      };
    case "timed_out":
      return {
        eventType: "fake_send.timed_out",
        approvalId: result.approvalId,
        idempotencyKey: result.idempotencyKey,
        durationMs: result.durationMs,
        outcome: "timed_out",
        code: "timed_out",
      };
    case "downstream_failure":
      return {
        eventType: "fake_send.downstream_failed",
        approvalId: result.approvalId,
        idempotencyKey: result.idempotencyKey,
        durationMs: result.durationMs,
        outcome: "downstream_failure",
        code: "downstream_failure",
      };
  }
}

export function makeFakeSendExecutionResultOutcome(
  kind: FakeSendExecutionResultKind,
  result: FakeSendResult,
): FakeSendExecutionOutcome {
  return result.status === "accepted"
    ? { ok: true, kind, value: result }
    : { ok: false, kind, value: result, error: result.error };
}

export function isFakeSendExecutionOutcome(value: unknown): value is FakeSendExecutionOutcome {
  if (!fakeSendExecutionOutcomeValidator.Check(value)) return false;
  if (!value.ok && value.kind === "in_progress") {
    return isFakeSendFailure(value.error) && value.error.code === "execution_in_progress";
  }
  if (!value.ok && value.kind === "failure") {
    return isFakeSendFailure(value.error) && genericFailureCodes.has(value.error.code);
  }
  if (!isFakeSendResult(value.value)) return false;
  if (value.ok) return value.value.status === "accepted";
  return (
    value.value.status !== "accepted" &&
    isFakeSendFailure(value.error) &&
    isDeepStrictEqual(value.error, value.value.error)
  );
}
