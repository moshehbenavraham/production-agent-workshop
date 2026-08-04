import assert from "node:assert/strict";
import test from "node:test";
import {
  createPendingApproval,
  isApprovalCreationOutcome,
  isApprovalDecisionInput,
  isApprovalEventData,
  isApprovalRecord,
  isApprovalStorageRecord,
  isApprovalTransitionOutcome,
  transitionApproval,
  type ApprovalRecord,
  type ApprovalStore,
} from "../src/approval.js";

const RUN_ID = "run_approval_test";
const APPROVAL_ID = "approval_test_001";
const DRAFT_ID = "draft_test_001";
const REQUESTED_AT = "2026-08-04T10:00:00.000Z";
const DECIDED_AT = "2026-08-04T10:01:00.000Z";
const DRAFT = "A sufficiently long synthetic follow-up draft for Ada.";
const AUTHORIZED_ACTORS = new Set(["actor_reviewer"]);

function pendingApproval(): ApprovalRecord {
  const outcome = createPendingApproval(
    {
      runId: RUN_ID,
      leadId: "lead_ada",
      action: "send_follow_up",
      draft: DRAFT,
    },
    {
      approvalId: APPROVAL_ID,
      draftId: DRAFT_ID,
      now: REQUESTED_AT,
    },
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function decision(decisionValue: "approved" | "declined" = "approved") {
  return {
    approvalId: APPROVAL_ID,
    runId: RUN_ID,
    actorId: "actor_reviewer",
    decision: decisionValue,
  };
}

test("pending approval carries exact immutable linkage and a content hash", () => {
  const approval = pendingApproval();

  assert.deepEqual(approval, {
    approvalId: APPROVAL_ID,
    runId: RUN_ID,
    action: "send_follow_up",
    target: { kind: "lead", leadId: "lead_ada" },
    draft: {
      draftId: DRAFT_ID,
      sha256: "f93f21b61ea82c3b8c751d82936ad2880f807fb41319ecd9bc10910f2580bd02",
      content: DRAFT,
    },
    status: "pending",
    requestedAt: REQUESTED_AT,
    decision: null,
  });
  assert.equal(isApprovalRecord(approval), true);
  assert.equal(isApprovalCreationOutcome({ ok: true, value: approval }), true);
});

test("approval validation rejects extras and semantic draft corruption", () => {
  const approval = pendingApproval();

  assert.equal(isApprovalRecord({ ...approval, extra: true }), false);
  assert.equal(
    isApprovalRecord({
      ...approval,
      draft: { ...approval.draft, sha256: "0".repeat(64) },
    }),
    false,
  );
  assert.equal(isApprovalRecord({ ...approval, requestedAt: "not-a-time" }), false);
  assert.equal(
    isApprovalRecord({
      ...approval,
      status: "approved",
      decision: null,
    }),
    false,
  );
});

test("decision input is closed and requires exact typed identities", () => {
  assert.equal(isApprovalDecisionInput(decision()), true);
  assert.equal(isApprovalDecisionInput({ ...decision(), extra: true }), false);
  assert.equal(isApprovalDecisionInput({ ...decision(), actorId: "reviewer" }), false);
  assert.equal(isApprovalDecisionInput({ ...decision(), decision: "maybe" }), false);
});

test("storage records are closed request or terminal transition evidence", () => {
  const pending = pendingApproval();
  const approved = transitionApproval(pending, decision(), AUTHORIZED_ACTORS, DECIDED_AT);
  if (!approved.ok) assert.fail(approved.error.message);

  assert.equal(
    isApprovalStorageRecord({
      recordId: "record_request_001",
      recordedAt: REQUESTED_AT,
      type: "approval.requested",
      approval: pending,
    }),
    true,
  );
  assert.equal(
    isApprovalStorageRecord({
      recordId: "record_decision_001",
      recordedAt: DECIDED_AT,
      type: "approval.approved",
      approvalId: APPROVAL_ID,
      runId: RUN_ID,
      decision: approved.value.decision,
    }),
    true,
  );
  assert.equal(
    isApprovalStorageRecord({
      recordId: "record_decision_002",
      recordedAt: DECIDED_AT,
      type: "approval.declined",
      approvalId: APPROVAL_ID,
      runId: RUN_ID,
      decision: approved.value.decision,
    }),
    false,
  );
  assert.equal(
    isApprovalStorageRecord({
      recordId: "record_request_002",
      recordedAt: "2026-08-04T09:59:59.999Z",
      type: "approval.requested",
      approval: pending,
    }),
    false,
  );
});

test("operational approval evidence is minimized and closed", () => {
  assert.equal(
    isApprovalEventData({
      eventType: "approval.requested",
      approvalId: APPROVAL_ID,
      action: "send_follow_up",
      targetKind: "lead",
      leadId: "lead_ada",
      draftId: DRAFT_ID,
      status: "pending",
    }),
    true,
  );
  assert.equal(
    isApprovalEventData({
      eventType: "approval.approved",
      approvalId: APPROVAL_ID,
      actorId: "actor_reviewer",
      status: "approved",
    }),
    true,
  );
  assert.equal(
    isApprovalEventData({
      eventType: "approval.storage_failed",
      approvalId: APPROVAL_ID,
      operation: "decision",
      code: "storage_failure",
    }),
    true,
  );
  assert.equal(
    isApprovalEventData({
      eventType: "approval.approved",
      approvalId: APPROVAL_ID,
      actorId: "actor_reviewer",
      status: "approved",
      draft: DRAFT,
    }),
    false,
  );
  assert.equal(
    isApprovalEventData({
      eventType: "approval.decision_duplicate",
      approvalId: APPROVAL_ID,
      actorId: "actor_reviewer",
      requestedDecision: "approved",
      status: "declined",
    }),
    false,
  );
  assert.equal(
    isApprovalEventData({
      eventType: "approval.decision_conflict",
      approvalId: APPROVAL_ID,
      actorId: "actor_reviewer",
      requestedDecision: "approved",
      status: "approved",
    }),
    false,
  );
});

test("approval store contract keeps adapters replaceable", () => {
  const contract: ApprovalStore = {
    appendRequest: () => ({ ok: true, value: pendingApproval() }),
    appendDecision: (approval) => ({ ok: true, value: approval }),
    get: () => ({ ok: true, value: pendingApproval() }),
    listRun: () => ({ ok: true, value: [pendingApproval()] }),
  };

  assert.equal(contract.get(APPROVAL_ID).ok, true);
});

test("pending approval can transition once to approved", () => {
  const outcome = transitionApproval(
    pendingApproval(),
    decision("approved"),
    AUTHORIZED_ACTORS,
    DECIDED_AT,
  );

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.kind, "transitioned");
  assert.equal(outcome.value.status, "approved");
  assert.deepEqual(outcome.value.decision, {
    actorId: "actor_reviewer",
    decision: "approved",
    decidedAt: DECIDED_AT,
  });
  assert.equal(isApprovalRecord(outcome.value), true);
  assert.equal(isApprovalTransitionOutcome(outcome), true);
});

test("pending approval can transition once to declined", () => {
  const outcome = transitionApproval(
    pendingApproval(),
    decision("declined"),
    AUTHORIZED_ACTORS,
    DECIDED_AT,
  );

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.value.status, "declined");
  assert.equal(outcome.value.decision?.decision, "declined");
  assert.equal(isApprovalTransitionOutcome(outcome), true);
});

test("terminal semantic validation rejects decisions before the request", () => {
  const approval = pendingApproval();
  const invalid = {
    ...approval,
    status: "approved",
    decision: {
      actorId: "actor_reviewer",
      decision: "approved",
      decidedAt: "2026-08-04T09:59:59.999Z",
    },
  };

  assert.equal(isApprovalRecord(invalid), false);
  assert.equal(
    isApprovalTransitionOutcome({ ok: true, kind: "transitioned", value: invalid }),
    false,
  );
});

test("same terminal decision returns the original state as duplicate", () => {
  const first = transitionApproval(
    pendingApproval(),
    decision("approved"),
    AUTHORIZED_ACTORS,
    DECIDED_AT,
  );
  if (!first.ok) assert.fail(first.error.message);

  const duplicate = transitionApproval(
    first.value,
    decision("approved"),
    AUTHORIZED_ACTORS,
    "2026-08-04T10:02:00.000Z",
  );
  assert.equal(duplicate.ok, false);
  if (duplicate.ok || duplicate.kind === "failure") assert.fail("Expected duplicate");
  assert.equal(duplicate.kind, "duplicate");
  assert.equal(duplicate.error.code, "approval_already_decided");
  assert.deepEqual(duplicate.value, first.value);
  assert.equal(isApprovalTransitionOutcome(duplicate), true);
  assert.equal(
    isApprovalTransitionOutcome({
      ...duplicate,
      error: {
        code: "approval_conflict",
        message: "Approval already has the opposite terminal decision.",
        retryable: false,
      },
    }),
    false,
  );
});

test("opposite terminal decision returns the original state as conflict", () => {
  const first = transitionApproval(
    pendingApproval(),
    decision("declined"),
    AUTHORIZED_ACTORS,
    DECIDED_AT,
  );
  if (!first.ok) assert.fail(first.error.message);

  const conflict = transitionApproval(
    first.value,
    decision("approved"),
    AUTHORIZED_ACTORS,
    "2026-08-04T10:02:00.000Z",
  );
  assert.equal(conflict.ok, false);
  if (conflict.ok || conflict.kind === "failure") assert.fail("Expected conflict");
  assert.equal(conflict.kind, "conflict");
  assert.equal(conflict.error.code, "approval_conflict");
  assert.deepEqual(conflict.value, first.value);
  assert.equal(isApprovalTransitionOutcome(conflict), true);
  assert.equal(
    isApprovalTransitionOutcome({
      ...conflict,
      error: {
        code: "approval_already_decided",
        message: "Approval already has the requested terminal decision.",
        retryable: false,
      },
    }),
    false,
  );
});

test("missing approval fails without producing state", () => {
  const outcome = transitionApproval(undefined, decision(), AUTHORIZED_ACTORS, DECIDED_AT);

  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected missing approval failure");
  assert.equal(outcome.kind, "failure");
  assert.equal(outcome.error.code, "approval_not_found");
  assert.equal("value" in outcome, false);
});

test("malformed decisions fail before actor or state mutation", () => {
  for (const input of [
    {},
    { ...decision(), decision: "maybe" },
    { ...decision(), actorId: "reviewer" },
    { ...decision(), extra: true },
  ]) {
    const outcome = transitionApproval(pendingApproval(), input, AUTHORIZED_ACTORS, DECIDED_AT);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected malformed decision failure");
    assert.equal(outcome.kind, "failure");
    assert.equal(outcome.error.code, "invalid_decision");
  }
});

test("unknown actors are denied at the transition boundary", () => {
  const outcome = transitionApproval(
    pendingApproval(),
    { ...decision(), actorId: "actor_unknown" },
    AUTHORIZED_ACTORS,
    DECIDED_AT,
  );

  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected unknown actor failure");
  assert.equal(outcome.kind, "failure");
  assert.equal(outcome.error.code, "unknown_actor");
});

test("invalid or pre-request decision times fail without mutating pending state", () => {
  for (const now of ["not-a-time", "2026-08-04T09:59:59.999Z"]) {
    const pending = pendingApproval();
    const snapshot = structuredClone(pending);
    const outcome = transitionApproval(pending, decision(), AUTHORIZED_ACTORS, now);

    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected invalid decision time");
    assert.equal(outcome.kind, "failure");
    assert.equal(outcome.error.code, "invalid_decision");
    assert.deepEqual(pending, snapshot);
  }
});

test("approval and run identity mismatches fail closed", () => {
  for (const input of [
    { ...decision(), approvalId: "approval_other" },
    { ...decision(), runId: "run_other" },
  ]) {
    const outcome = transitionApproval(pendingApproval(), input, AUTHORIZED_ACTORS, DECIDED_AT);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected identity mismatch");
    assert.equal(outcome.kind, "failure");
    assert.equal(outcome.error.code, "approval_identity_mismatch");
  }
});

test("invalid current state cannot grant a transition", () => {
  const invalid = {
    ...pendingApproval(),
    draft: { ...pendingApproval().draft, sha256: "0".repeat(64) },
  };
  const outcome = transitionApproval(invalid, decision(), AUTHORIZED_ACTORS, DECIDED_AT);

  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected invalid current state failure");
  assert.equal(outcome.kind, "failure");
  assert.equal(outcome.error.code, "invalid_approval_record");
});
