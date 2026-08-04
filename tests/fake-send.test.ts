import assert from "node:assert/strict";
import test from "node:test";
import {
  createPendingApproval,
  makeApprovalFailure,
  transitionApproval,
  type ApprovalRecord,
  type ApprovalStore,
} from "../src/approval.js";
import {
  FAKE_SEND_TIMEOUT_MS,
  FakeSendAuthorizer,
  deriveFakeSendIdempotencyKey,
  isFakeSendAdapterOutcome,
  isFakeSendAuthorizationOutcome,
  isFakeSendCommand,
  isFakeSendFailure,
  isFakeSendRequest,
  makeFakeSendFailure,
  type FakeSendAdapter,
  type FakeSendCommand,
  type FakeSendRequest,
} from "../src/fake-send.js";
import {
  isFakeSendEventData,
  isFakeSendResult,
  isFakeSendResultStoreClaimOutcome,
  isFakeSendResultStoreCompleteOutcome,
  isFakeSendResultStoreReadOutcome,
  isFakeSendStorageRecord,
  isFakeSendStoreProjection,
  type FakeSendReservation,
  type FakeSendResult,
  type FakeSendResultStore,
} from "../src/fake-send-result.js";

const RUN_ID = "run_fake_send_001";
const APPROVAL_ID = "approval_fake_send_001";
const DRAFT_ID = "draft_fake_send_001";
const ACTOR_ID = "actor_fake_send_operator";
const APPROVAL_ACTOR_ID = "actor_workshop_reviewer";
const REQUESTED_AT = "2026-08-04T10:00:00.000Z";
const DECIDED_AT = "2026-08-04T10:01:00.000Z";
const RESERVED_AT = "2026-08-04T10:02:00.000Z";
const COMPLETED_AT = "2026-08-04T10:02:00.025Z";
const DRAFT = "A sufficiently long synthetic follow-up draft for Ada.";

function approval(status: "pending" | "approved" | "declined" = "approved"): ApprovalRecord {
  const created = createPendingApproval(
    {
      runId: RUN_ID,
      leadId: "lead_ada",
      action: "send_follow_up",
      draft: DRAFT,
    },
    { approvalId: APPROVAL_ID, draftId: DRAFT_ID, now: REQUESTED_AT },
  );
  if (!created.ok) assert.fail(created.error.message);
  if (status === "pending") return created.value;

  const transitioned = transitionApproval(
    created.value,
    {
      approvalId: APPROVAL_ID,
      runId: RUN_ID,
      actorId: APPROVAL_ACTOR_ID,
      decision: status,
    },
    new Set([APPROVAL_ACTOR_ID]),
    DECIDED_AT,
  );
  if (!transitioned.ok) assert.fail(transitioned.error.message);
  return transitioned.value;
}

function request(overrides: Partial<FakeSendRequest> = {}): FakeSendRequest {
  return {
    approvalId: APPROVAL_ID,
    runId: RUN_ID,
    actorId: ACTOR_ID,
    action: "send_follow_up",
    target: { kind: "lead", leadId: "lead_ada" },
    draftId: DRAFT_ID,
    ...overrides,
  };
}

function storeReturning(value: ApprovalRecord | null): ApprovalStore {
  return {
    appendRequest: (record) => ({ ok: true, value: record }),
    appendDecision: (record) => ({ ok: true, value: record }),
    get: () => ({ ok: true, value }),
    listRun: () => ({ ok: true, value: value ? [value] : [] }),
  };
}

function authorize(
  store: ApprovalStore = storeReturning(approval()),
  actors: ReadonlySet<string> = new Set([ACTOR_ID]),
) {
  return new FakeSendAuthorizer(store, { authorizedActorIds: actors });
}

function command(): FakeSendCommand {
  const outcome = authorize().authorize(request());
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function reservation(value = command()): FakeSendReservation {
  return {
    reservationId: "reservation_fake_send_001",
    idempotencyKey: value.idempotencyKey,
    approvalId: value.approvalId,
    runId: value.runId,
    action: value.action,
    target: value.target,
    draftId: value.draft.draftId,
    draftSha256: value.draft.sha256,
    reservedAt: RESERVED_AT,
  };
}

function acceptedResult(value = command()): FakeSendResult {
  return {
    resultId: "result_fake_send_001",
    idempotencyKey: value.idempotencyKey,
    approvalId: value.approvalId,
    runId: value.runId,
    action: value.action,
    target: value.target,
    draftId: value.draft.draftId,
    draftSha256: value.draft.sha256,
    status: "accepted",
    startedAt: RESERVED_AT,
    completedAt: COMPLETED_AT,
    durationMs: 25,
    receiptId: "fake_receipt_001",
    compensation: { supported: false, code: "manual_review_required" },
  };
}

test("request is closed, identity-only, and excludes caller content", () => {
  assert.equal(isFakeSendRequest(request()), true);
  assert.equal(isFakeSendRequest({ ...request(), extra: true }), false);
  assert.equal(isFakeSendRequest({ ...request(), actorId: "operator" }), false);
  assert.equal(isFakeSendRequest({ ...request(), action: "send_anything" }), false);
  assert.equal(isFakeSendRequest({ ...request(), draft: DRAFT }), false);
  assert.equal(
    isFakeSendRequest({ ...request(), target: { kind: "email", email: "a@b.test" } }),
    false,
  );
});

test("authorized command is closed and semantically binds hash and idempotency key", () => {
  const value = command();
  assert.equal(isFakeSendCommand(value), true);
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.target), true);
  assert.equal(Object.isFrozen(value.draft), true);
  assert.equal(isFakeSendCommand({ ...value, extra: true }), false);
  assert.equal(isFakeSendCommand({ ...value, idempotencyKey: "0".repeat(64) }), false);
  assert.equal(
    isFakeSendCommand({
      ...value,
      draft: { ...value.draft, content: `${value.draft.content} altered` },
    }),
    false,
  );
});

test("failure and authorization outcomes require canonical actionable errors", () => {
  const denied = makeFakeSendFailure("permission_denied");
  assert.deepEqual(denied, {
    code: "permission_denied",
    message: "Actor is not authorized to request fake-send execution.",
    retryable: false,
  });
  assert.equal(isFakeSendFailure(denied), true);
  assert.equal(isFakeSendFailure({ ...denied, message: "dependency secret" }), false);
  assert.equal(isFakeSendAuthorizationOutcome({ ok: false, error: denied }), true);
  assert.equal(
    isFakeSendAuthorizationOutcome({ ok: false, error: { ...denied, retryable: true } }),
    false,
  );
  assert.equal(isFakeSendAuthorizationOutcome({ ok: true, value: command() }), true);
});

test("adapter contract is abort-aware, bounded, and has closed outcomes", async () => {
  assert.equal(FAKE_SEND_TIMEOUT_MS, 1_000);
  const adapter: FakeSendAdapter = {
    execute: async (_value, signal) => {
      assert.equal(signal.aborted, false);
      return {
        ok: true,
        status: "accepted",
        receiptId: "fake_receipt_001",
        acceptedAt: COMPLETED_AT,
      };
    },
  };
  const outcome = await adapter.execute(command(), new AbortController().signal);
  assert.equal(isFakeSendAdapterOutcome(outcome), true);
  assert.equal(
    isFakeSendAdapterOutcome({
      ok: false,
      status: "rejected",
      error: makeFakeSendFailure("rejected"),
    }),
    true,
  );
  assert.equal(
    isFakeSendAdapterOutcome({
      ok: false,
      status: "timed_out",
      error: makeFakeSendFailure("timed_out"),
    }),
    false,
  );
  assert.equal(isFakeSendAdapterOutcome({ ...outcome, providerResponse: DRAFT }), false);
});

test("operational evidence is closed, redacted, and outcome-specific", () => {
  const value = command();
  assert.equal(
    isFakeSendEventData({
      eventType: "fake_send.attempted",
      approvalId: value.approvalId,
      idempotencyKey: value.idempotencyKey,
    }),
    true,
  );
  assert.equal(
    isFakeSendEventData({
      eventType: "fake_send.accepted",
      approvalId: value.approvalId,
      idempotencyKey: value.idempotencyKey,
      durationMs: 25,
      outcome: "accepted",
    }),
    true,
  );
  assert.equal(
    isFakeSendEventData({
      eventType: "fake_send.permission_denied",
      approvalId: value.approvalId,
      code: "permission_denied",
    }),
    true,
  );
  assert.equal(
    isFakeSendEventData({
      eventType: "fake_send.accepted",
      approvalId: value.approvalId,
      idempotencyKey: value.idempotencyKey,
      durationMs: 25,
      outcome: "accepted",
      draft: DRAFT,
    }),
    false,
  );
  assert.equal(
    isFakeSendEventData({
      eventType: "fake_send.rejected",
      approvalId: value.approvalId,
      idempotencyKey: value.idempotencyKey,
      durationMs: 25,
      outcome: "downstream_failure",
      code: "downstream_failure",
    }),
    false,
  );
});

test("reservation, result, projection, and storage records preserve exact identity", () => {
  const held = reservation();
  const result = acceptedResult();
  const reservedProjection = { state: "reserved" as const, reservation: held };
  const completedProjection = {
    state: "completed" as const,
    reservation: held,
    result,
  };

  assert.equal(isFakeSendStoreProjection(reservedProjection), true);
  assert.equal(isFakeSendResult(result), true);
  assert.equal(isFakeSendStoreProjection(completedProjection), true);
  assert.equal(
    isFakeSendStoreProjection({
      ...completedProjection,
      result: { ...result, approvalId: "approval_fake_send_other" },
    }),
    false,
  );
  assert.equal(
    isFakeSendStorageRecord({
      recordId: "record_fake_send_reservation_001",
      recordedAt: RESERVED_AT,
      type: "fake_send.reserved",
      reservation: held,
    }),
    true,
  );
  assert.equal(
    isFakeSendStorageRecord({
      recordId: "record_fake_send_result_001",
      recordedAt: COMPLETED_AT,
      type: "fake_send.completed",
      result,
    }),
    true,
  );
});

test("result validators reject impossible time, receipt, and compensation semantics", () => {
  const result = acceptedResult();
  assert.equal(isFakeSendResult({ ...result, durationMs: 24 }), false);
  assert.equal(isFakeSendResult({ ...result, receiptId: undefined }), false);
  assert.equal(
    isFakeSendResult({
      ...result,
      compensation: { supported: true, code: "automatic_rollback" },
    }),
    false,
  );
  assert.equal(
    isFakeSendResult({
      ...result,
      status: "rejected",
      error: makeFakeSendFailure("rejected"),
    }),
    false,
  );
});

test("replaceable result store outcomes are closed and semantically validated", () => {
  const held = reservation();
  const result = acceptedResult();
  const completed = { state: "completed" as const, reservation: held, result };
  assert.equal(isFakeSendResultStoreClaimOutcome({ ok: true, kind: "claimed", value: held }), true);
  assert.equal(
    isFakeSendResultStoreClaimOutcome({
      ok: false,
      kind: "duplicate",
      value: completed,
      error: makeFakeSendFailure("duplicate"),
    }),
    true,
  );
  assert.equal(isFakeSendResultStoreCompleteOutcome({ ok: true, value: completed }), true);
  assert.equal(isFakeSendResultStoreReadOutcome({ ok: true, value: completed }), true);
  assert.equal(
    isFakeSendResultStoreReadOutcome({
      ok: false,
      error: { ...makeFakeSendFailure("storage_failure"), message: "raw I/O" },
    }),
    false,
  );
  assert.equal(
    isFakeSendResultStoreClaimOutcome({
      ok: false,
      kind: "failure",
      error: makeFakeSendFailure("duplicate"),
    }),
    false,
  );
  assert.equal(
    isFakeSendResultStoreCompleteOutcome({
      ok: false,
      error: makeFakeSendFailure("permission_denied"),
    }),
    false,
  );
  assert.equal(
    isFakeSendResultStoreReadOutcome({
      ok: false,
      error: makeFakeSendFailure("rejected"),
    }),
    false,
  );

  const contract: FakeSendResultStore = {
    claim: () => ({ ok: true, kind: "claimed", value: held }),
    complete: () => ({ ok: true, value: completed }),
    get: () => ({ ok: true, value: completed }),
  };
  assert.equal(contract.get(result.idempotencyKey).ok, true);
});

test("idempotency key is stable, versioned, field-sensitive, and actor-independent", () => {
  const first = command();
  const second = authorize(
    storeReturning(approval()),
    new Set([ACTOR_ID, "actor_second_operator"]),
  ).authorize(request({ actorId: "actor_second_operator" }));
  if (!second.ok) assert.fail(second.error.message);

  assert.equal(
    first.idempotencyKey,
    "7f9fd848a017555d3aec333d08ac074718d7e2c0ac0a2f3a03c77dd6d77618c0",
  );
  assert.equal(second.value.idempotencyKey, first.idempotencyKey);
  assert.equal(
    deriveFakeSendIdempotencyKey({
      approvalId: first.approvalId,
      runId: first.runId,
      action: first.action,
      target: first.target,
      draftId: first.draft.draftId,
      draftSha256: first.draft.sha256,
    }),
    first.idempotencyKey,
  );
  assert.notEqual(
    deriveFakeSendIdempotencyKey({
      approvalId: first.approvalId,
      runId: first.runId,
      action: first.action,
      target: { kind: "lead", leadId: "lead_grace" },
      draftId: first.draft.draftId,
      draftSha256: first.draft.sha256,
    }),
    first.idempotencyKey,
  );
});

test("approved exact request resolves executable fields only from durable state", () => {
  const durable = approval();
  let reads = 0;
  const backing = storeReturning(durable);
  backing.get = (approvalId) => {
    reads += 1;
    assert.equal(approvalId, APPROVAL_ID);
    return { ok: true, value: durable };
  };

  const outcome = authorize(backing).authorize(request());
  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(reads, 1);
  assert.deepEqual(outcome.value, {
    approvalId: APPROVAL_ID,
    runId: RUN_ID,
    actorId: ACTOR_ID,
    action: "send_follow_up",
    target: { kind: "lead", leadId: "lead_ada" },
    draft: durable.draft,
    approvedAt: DECIDED_AT,
    idempotencyKey: "7f9fd848a017555d3aec333d08ac074718d7e2c0ac0a2f3a03c77dd6d77618c0",
  });
  assert.notEqual(outcome.value.draft, request());
});

test("invalid input and unauthorized actor fail before approval lookup", () => {
  let reads = 0;
  const backing = storeReturning(approval());
  backing.get = () => {
    reads += 1;
    return { ok: true, value: approval() };
  };
  const application = authorize(backing);

  assert.deepEqual(application.authorize({ ...request(), draft: DRAFT }), {
    ok: false,
    error: makeFakeSendFailure("invalid_request"),
  });
  assert.deepEqual(application.authorize(request({ actorId: "actor_unknown" })), {
    ok: false,
    error: makeFakeSendFailure("permission_denied"),
  });
  assert.equal(reads, 0);
});

test("missing, malformed, throwing, and sensitive store outcomes fail canonically", () => {
  assert.deepEqual(authorize(storeReturning(null)).authorize(request()), {
    ok: false,
    error: makeFakeSendFailure("approval_not_found"),
  });

  const cases: Array<{
    get: ApprovalStore["get"];
    code: "invalid_approval_record" | "storage_failure";
  }> = [
    {
      get: () => ({ ok: true, value: { status: "approved" } }) as never,
      code: "invalid_approval_record",
    },
    { get: () => ({ ok: true, value: approval(), extra: true }) as never, code: "storage_failure" },
    {
      get: () => ({ ok: false, error: makeApprovalFailure("corrupt_record") }),
      code: "invalid_approval_record",
    },
    {
      get: () => ({
        ok: false,
        error: { ...makeApprovalFailure("storage_failure"), message: "path and secret" },
      }),
      code: "storage_failure",
    },
    {
      get: () => {
        throw "raw dependency";
      },
      code: "storage_failure",
    },
  ];

  for (const value of cases) {
    const backing = storeReturning(approval());
    backing.get = value.get;
    assert.deepEqual(authorize(backing).authorize(request()), {
      ok: false,
      error: makeFakeSendFailure(value.code),
    });
  }

  const hostile = storeReturning(approval());
  hostile.get = () =>
    new Proxy(
      {},
      {
        get: () => {
          throw new Error("hostile outcome getter");
        },
      },
    ) as never;
  assert.deepEqual(authorize(hostile).authorize(request()), {
    ok: false,
    error: makeFakeSendFailure("storage_failure"),
  });
});

test("pending and declined approval are distinct pre-effect refusals", () => {
  assert.deepEqual(authorize(storeReturning(approval("pending"))).authorize(request()), {
    ok: false,
    error: makeFakeSendFailure("approval_pending"),
  });
  assert.deepEqual(authorize(storeReturning(approval("declined"))).authorize(request()), {
    ok: false,
    error: makeFakeSendFailure("approval_declined"),
  });
});

test("run, action, target, draft, and returned approval identity mismatches fail closed", () => {
  for (const mismatch of [
    request({ runId: "run_fake_send_other" }),
    {
      ...request(),
      action: "send_follow_up",
      target: { kind: "lead" as const, leadId: "lead_grace" },
    },
    request({ draftId: "draft_fake_send_other" }),
  ]) {
    assert.deepEqual(authorize().authorize(mismatch), {
      ok: false,
      error: makeFakeSendFailure("approval_identity_mismatch"),
    });
  }

  const wrong = { ...approval(), approvalId: "approval_fake_send_other" } as ApprovalRecord;
  assert.deepEqual(authorize(storeReturning(wrong)).authorize(request()), {
    ok: false,
    error: makeFakeSendFailure("storage_failure"),
  });
});

test("all denied paths produce zero future-adapter effects", async () => {
  let effects = 0;
  const adapter: FakeSendAdapter = {
    execute: async () => {
      effects += 1;
      return {
        ok: true,
        status: "accepted",
        receiptId: "fake_receipt_001",
        acceptedAt: COMPLETED_AT,
      };
    },
  };
  const denied = [
    authorize(storeReturning(null)).authorize(request()),
    authorize(storeReturning(approval("pending"))).authorize(request()),
    authorize(storeReturning(approval("declined"))).authorize(request()),
    authorize().authorize(request({ runId: "run_fake_send_other" })),
    authorize().authorize(request({ draftId: "draft_fake_send_other" })),
    authorize().authorize(request({ actorId: "actor_unknown" })),
  ];

  for (const outcome of denied) {
    if (outcome.ok) {
      await adapter.execute(outcome.value, new AbortController().signal);
    }
  }
  assert.equal(effects, 0);
});
