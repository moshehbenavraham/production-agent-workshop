import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { createPendingApproval, transitionApproval, type ApprovalRecord } from "../src/approval.js";
import { JsonlEventStore } from "../src/event-store.js";
import { deriveFakeSendIdempotencyKey } from "../src/fake-send.js";
import type { FakeSendStoreProjection } from "../src/fake-send-result.js";
import { makeQualificationFailure } from "../src/qualification.js";
import {
  isRunProjection,
  isRunProjectionFailure,
  isRunProjectionOutcome,
  makeRunProjectionFailure,
  projectRunEvents,
  projectStoredRun,
} from "../src/run-projection.js";
import { makeRunEventFailure } from "../src/run-event.js";
import type { AgentEvent, RunEventData, RunEventInput } from "../src/run-event.js";
import { makeRunEvent } from "./run-event-test-helpers.js";

const RUN_ID = "run_projection_001";
const OTHER_RUN_ID = "run_projection_002";
const LEAD_ID = "lead_ada";
const DRAFT = "A sufficiently long synthetic follow-up draft for projection tests.";
const APPROVAL_ID = "approval_projection_001";
const DRAFT_ID = "draft_projection_001";
const ACTOR_ID = "actor_reviewer";
const BASE_TIME = Date.parse("2026-08-11T16:00:00.000Z");
const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function at(index: number): string {
  return new Date(BASE_TIME + index * 1_000).toISOString();
}

function event(
  data: RunEventData,
  index: number,
  options: {
    runId?: string;
    metadata?: RunEventInput["metadata"];
    eventId?: string;
    timestamp?: string;
  } = {},
): AgentEvent {
  return makeRunEvent(
    {
      runId: options.runId ?? RUN_ID,
      type: data.eventType,
      data,
      metadata: options.metadata,
    },
    {
      eventId: options.eventId ?? `event_projection_${String(index).padStart(3, "0")}`,
      at: options.timestamp ?? at(index),
      applicationVersion: "0.1.23",
    },
  );
}

function pendingApproval(): ApprovalRecord {
  const outcome = createPendingApproval(
    { runId: RUN_ID, leadId: LEAD_ID, action: "send_follow_up", draft: DRAFT },
    { approvalId: APPROVAL_ID, draftId: DRAFT_ID, now: at(4) },
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function approvedApproval(): ApprovalRecord {
  const outcome = transitionApproval(
    pendingApproval(),
    {
      approvalId: APPROVAL_ID,
      runId: RUN_ID,
      actorId: ACTOR_ID,
      decision: "approved",
    },
    new Set([ACTOR_ID]),
    at(6),
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function fakeProjection(): Extract<FakeSendStoreProjection, { state: "completed" }> {
  const approval = approvedApproval();
  const identity = {
    approvalId: APPROVAL_ID,
    runId: RUN_ID,
    action: "send_follow_up" as const,
    target: { kind: "lead" as const, leadId: LEAD_ID },
    draftId: DRAFT_ID,
    draftSha256: approval.draft.sha256,
  };
  const idempotencyKey = deriveFakeSendIdempotencyKey(identity);
  const reservation = {
    reservationId: "reservation_projection_001",
    ...identity,
    idempotencyKey,
    reservedAt: at(7),
  };
  return {
    state: "completed",
    reservation,
    result: {
      resultId: "result_projection_001",
      ...identity,
      idempotencyKey,
      status: "accepted",
      startedAt: at(7),
      completedAt: at(8),
      durationMs: 1_000,
      receiptId: "fake_receipt_projection_001",
      compensation: { supported: false, code: "manual_review_required" },
    },
  };
}

function happyHistory(): AgentEvent[] {
  const approval = pendingApproval();
  const idempotencyKey = fakeProjection().reservation.idempotencyKey;
  return [
    event({ eventType: "run.started", leadId: LEAD_ID }, 0),
    event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 1),
    event(
      {
        eventType: "qualification.completed",
        result: {
          leadId: LEAD_ID,
          fit: "strong",
          confidence: 0.85,
          reasons: ["team_size_in_scope", "operational_problem_present"],
          missingInformation: ["budget"],
        },
      },
      2,
    ),
    event(
      {
        eventType: "domain.follow_up_drafted",
        leadId: LEAD_ID,
        draftId: DRAFT_ID,
        sha256: approval.draft.sha256,
      },
      3,
    ),
    event(
      {
        eventType: "approval.requested",
        approvalId: APPROVAL_ID,
        action: "send_follow_up",
        targetKind: "lead",
        leadId: LEAD_ID,
        draftId: DRAFT_ID,
        status: "pending",
      },
      4,
    ),
    event({ eventType: "run.completed", stopReason: "approval_pending" }, 5, {
      metadata: { result: "pending", stopReason: "approval_pending", approvalState: "pending" },
    }),
    event(
      {
        eventType: "approval.approved",
        approvalId: APPROVAL_ID,
        actorId: ACTOR_ID,
        status: "approved",
      },
      6,
    ),
    event({ eventType: "fake_send.attempted", approvalId: APPROVAL_ID, idempotencyKey }, 7),
    event(
      {
        eventType: "fake_send.accepted",
        approvalId: APPROVAL_ID,
        idempotencyKey,
        durationMs: 1_000,
        outcome: "accepted",
      },
      8,
    ),
  ];
}

function requireProjection(input: unknown) {
  const outcome = projectRunEvents(input);
  if (!outcome.ok) assert.fail(`${outcome.error.code}: ${outcome.error.message}`);
  return outcome.value;
}

test("closed projection derives minimized frozen state and verified authorities", () => {
  const projection = requireProjection({
    runId: RUN_ID,
    events: happyHistory(),
    authority: {
      approvalRecords: [approvedApproval()],
      fakeSendProjections: [fakeProjection()],
    },
  });

  assert.equal(projection.status, "completed");
  assert.equal(projection.latestSafeCheckpoint.kind, "approval_requested");
  assert.deepEqual(projection.terminalOutcome, {
    kind: "completed",
    eventId: "event_projection_005",
    stopReason: "approval_pending",
  });
  assert.equal(projection.workingContext.qualification?.state, "completed");
  assert.deepEqual(projection.workingContext.draft, {
    draftId: DRAFT_ID,
    sha256: pendingApproval().draft.sha256,
    eventId: "event_projection_003",
  });
  assert.equal(projection.workingContext.approval?.observedStatus, "approved");
  assert.equal(projection.workingContext.fakeSend?.observedStatus, "accepted");
  assert.deepEqual(projection.authority, {
    approval: { verification: "verified", status: "approved" },
    fakeSend: { verification: "verified", state: "completed", resultStatus: "accepted" },
  });
  assert.equal(projection.eventCount, 9);
  assert.equal(projection.lastEventId, "event_projection_008");
  assert.equal(Object.isFrozen(projection), true);
  assert.equal(Object.isFrozen(projection.workingContext), true);
  assert.equal(Object.isFrozen(projection.workingContext.qualification?.result), true);
  assert.equal(isRunProjection(projection), true);
});

test("each complete milestone advances an explicit safe checkpoint", () => {
  const history = happyHistory();
  const cases = [
    { length: 1, checkpoint: "run_started", qualification: null },
    { length: 2, checkpoint: "run_started", qualification: "attempted" },
    { length: 3, checkpoint: "qualification_completed", qualification: "completed" },
    { length: 4, checkpoint: "draft_created", qualification: "completed" },
    { length: 5, checkpoint: "approval_requested", qualification: "completed" },
  ] as const;

  for (const sample of cases) {
    const projection = requireProjection({
      runId: RUN_ID,
      events: history.slice(0, sample.length),
    });
    assert.equal(projection.latestSafeCheckpoint.kind, sample.checkpoint);
    assert.equal(projection.workingContext.qualification?.state ?? null, sample.qualification);
    assert.equal(projection.status, "running");
  }
});

test("an interrupted attempt remains visible without inventing a checkpoint", () => {
  const projection = requireProjection({ runId: RUN_ID, events: happyHistory().slice(0, 2) });

  assert.equal(projection.latestSafeCheckpoint.kind, "run_started");
  assert.deepEqual(projection.workingContext.qualification, {
    state: "attempted",
    attemptEventId: "event_projection_001",
  });
  assert.equal(projection.terminalOutcome, null);
});

test("run failure closes an interrupted prefix without inventing successful work", () => {
  const history = happyHistory().slice(0, 2);
  history.push(
    event({ eventType: "run.failed", code: "agent_run_failed" }, 2, {
      metadata: { result: "failed", errorCode: "agent_run_failed" },
    }),
  );
  const projection = requireProjection({ runId: RUN_ID, events: history });

  assert.equal(projection.status, "failed");
  assert.equal(projection.latestSafeCheckpoint.kind, "run_started");
  assert.deepEqual(projection.terminalOutcome, {
    kind: "failed",
    eventId: "event_projection_002",
    stopReason: "agent_run_failed",
  });
});

test("qualification refusal maps only compatible not-found and failure terminals", () => {
  const cases = [
    { code: "lead_not_found" as const, stopReason: "not_found" as const },
    { code: "qualification_timeout" as const, stopReason: "qualification_failed" as const },
  ];
  for (const sample of cases) {
    const failure = makeQualificationFailure(sample.code);
    if (failure.ok) assert.fail("Expected deterministic qualification failure");
    const history = [
      event({ eventType: "run.started", leadId: LEAD_ID }, 0),
      event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 1),
      event({ eventType: "qualification.failed", error: failure.error }, 2),
      event({ eventType: "run.completed", stopReason: sample.stopReason }, 3, {
        metadata: { result: "stopped", stopReason: sample.stopReason },
      }),
    ];
    const projection = requireProjection({ runId: RUN_ID, events: history });
    assert.equal(projection.status, "stopped");
    assert.equal(projection.latestSafeCheckpoint.kind, "run_started");
    assert.equal(projection.workingContext.qualification?.state, "failed");
  }
});

test("not-found terminal refuses an attempt that was never bound to the run lead", () => {
  const failure = makeQualificationFailure("lead_not_found");
  if (failure.ok) assert.fail("Expected deterministic qualification failure");
  const outcome = projectRunEvents({
    runId: RUN_ID,
    events: [
      event({ eventType: "run.started", leadId: LEAD_ID }, 0),
      event({ eventType: "qualification.attempted" }, 1),
      event({ eventType: "qualification.failed", error: failure.error }, 2),
      event({ eventType: "run.completed", stopReason: "not_found" }, 3, {
        metadata: { result: "stopped", stopReason: "not_found" },
      }),
    ],
  });
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected unbound not-found refusal");
  assert.equal(outcome.error.code, "incompatible_terminal");
});

test("approval observation never becomes authority when records are not supplied", () => {
  const projection = requireProjection({ runId: RUN_ID, events: happyHistory().slice(0, 7) });

  assert.equal(projection.workingContext.approval?.observedStatus, "approved");
  assert.deepEqual(projection.authority.approval, {
    verification: "not_supplied",
    status: null,
  });
  assert.deepEqual(projection.authority.fakeSend, {
    verification: "not_required",
    state: null,
    resultStatus: null,
  });
  assert.equal(projection.status, "waiting_for_approval");
});

test("dedicated approval truth may be ahead of an observed pending event", () => {
  const projection = requireProjection({
    runId: RUN_ID,
    events: happyHistory().slice(0, 6),
    authority: { approvalRecords: [approvedApproval()], fakeSendProjections: [] },
  });

  assert.equal(projection.workingContext.approval?.observedStatus, "pending");
  assert.deepEqual(projection.authority.approval, {
    verification: "verified",
    status: "approved",
  });
  assert.equal(projection.status, "approved");

  const active = requireProjection({
    runId: RUN_ID,
    events: happyHistory().slice(0, 5),
    authority: { approvalRecords: [approvedApproval()], fakeSendProjections: [] },
  });
  assert.equal(active.status, "running");
});

test("approval decisions require the run terminal and declined evidence stops the workflow", () => {
  const base = happyHistory();
  const beforeTerminal = projectRunEvents({
    runId: RUN_ID,
    events: [...base.slice(0, 5), base[6]],
  });
  assert.equal(beforeTerminal.ok, false);
  if (beforeTerminal.ok) assert.fail("Expected pre-terminal decision refusal");
  assert.equal(beforeTerminal.error.code, "missing_prerequisite");

  const declined = event(
    {
      eventType: "approval.declined",
      approvalId: APPROVAL_ID,
      actorId: ACTOR_ID,
      status: "declined",
    },
    6,
  );
  const projection = requireProjection({
    runId: RUN_ID,
    events: [...base.slice(0, 6), declined],
  });
  assert.equal(projection.status, "stopped");
  assert.equal(projection.workingContext.approval?.observedStatus, "declined");
});

test("fake attempts remain indeterminate and exact duplicate observations do not invent effects", () => {
  const history = happyHistory();
  const attempted = requireProjection({ runId: RUN_ID, events: history.slice(0, 8) });
  assert.equal(attempted.status, "effect_indeterminate");
  assert.equal(attempted.workingContext.fakeSend?.observedStatus, "attempted");
  assert.equal(attempted.latestSafeCheckpoint.kind, "approval_requested");

  const duplicate = event(
    {
      eventType: "fake_send.duplicate",
      approvalId: APPROVAL_ID,
      idempotencyKey: fakeProjection().reservation.idempotencyKey,
      durationMs: 4,
      outcome: "duplicate",
      originalStatus: "accepted",
    },
    9,
  );
  const replayed = requireProjection({
    runId: RUN_ID,
    events: [...history, duplicate],
    authority: {
      approvalRecords: [approvedApproval()],
      fakeSendProjections: [fakeProjection()],
    },
  });
  assert.equal(replayed.status, "completed");
  assert.equal(replayed.workingContext.fakeSend?.duplicateObserved, true);
  assert.equal(replayed.workingContext.fakeSend?.durationMs, 1_000);
});

test("fake refusal outcomes and storage observations remain visible without effect claims", () => {
  const prefix = happyHistory().slice(0, 8);
  const key = fakeProjection().reservation.idempotencyKey;
  const outcomes = [
    {
      data: {
        eventType: "fake_send.rejected",
        approvalId: APPROVAL_ID,
        idempotencyKey: key,
        durationMs: 1_000,
        outcome: "rejected",
        code: "rejected",
      } satisfies RunEventData,
      observedStatus: "rejected",
    },
    {
      data: {
        eventType: "fake_send.timed_out",
        approvalId: APPROVAL_ID,
        idempotencyKey: key,
        durationMs: 1_000,
        outcome: "timed_out",
        code: "timed_out",
      } satisfies RunEventData,
      observedStatus: "timed_out",
    },
    {
      data: {
        eventType: "fake_send.downstream_failed",
        approvalId: APPROVAL_ID,
        idempotencyKey: key,
        durationMs: 1_000,
        outcome: "downstream_failure",
        code: "downstream_failure",
      } satisfies RunEventData,
      observedStatus: "downstream_failure",
    },
  ];
  for (const sample of outcomes) {
    const projection = requireProjection({
      runId: RUN_ID,
      events: [...prefix, event(sample.data, 8)],
    });
    assert.equal(projection.status, "stopped");
    assert.equal(projection.workingContext.fakeSend?.observedStatus, sample.observedStatus);
  }

  const storageFailure = requireProjection({
    runId: RUN_ID,
    events: [
      ...prefix,
      event(
        {
          eventType: "fake_send.storage_failed",
          approvalId: APPROVAL_ID,
          idempotencyKey: key,
          code: "storage_failure",
        },
        8,
      ),
    ],
  });
  assert.equal(storageFailure.status, "stopped");
  assert.equal(storageFailure.workingContext.fakeSend?.observedStatus, "storage_failure");
});

test("normalized Pi and refused fake requests are observable but never advance checkpoints", () => {
  const qualification = happyHistory().slice(0, 3);
  const piEvent = event(
    {
      eventType: "pi.lifecycle",
      sourceType: "message_update",
      toolName: null,
      toolCallId: null,
      isError: false,
      messageId: "message_projection_001",
      stopReason: null,
    },
    3,
  );
  const completed = event({ eventType: "run.completed", stopReason: "approval_failed" }, 4, {
    metadata: { result: "stopped", stopReason: "approval_failed" },
  });
  const denied = event(
    {
      eventType: "fake_send.permission_denied",
      approvalId: "approval_projection_denied",
      code: "permission_denied",
    },
    5,
  );
  const projection = requireProjection({
    runId: RUN_ID,
    events: [...qualification, piEvent, completed, denied],
  });

  assert.equal(projection.latestSafeCheckpoint.kind, "qualification_completed");
  assert.equal(projection.status, "stopped");
  assert.equal(projection.workingContext.fakeSend?.observedStatus, "permission_denied");
  assert.deepEqual(projection.authority.fakeSend, {
    verification: "not_required",
    state: null,
    resultStatus: null,
  });
});

test("supplying incomplete authority evidence fails instead of authorizing from events", () => {
  const outcome = projectRunEvents({
    runId: RUN_ID,
    events: happyHistory().slice(0, 6),
    authority: { approvalRecords: [], fakeSendProjections: [] },
  });
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected unavailable authority refusal");
  assert.equal(outcome.error.code, "authority_mismatch");
});

test("missing and illegally ordered prerequisites fail with actionable locations", () => {
  const base = happyHistory();
  const cases = [
    { events: [], code: "missing_start" },
    { events: [base[1]], code: "missing_start" },
    { events: [base[0], base[0]], code: "duplicate_evidence" },
    { events: [base[0], base[2]], code: "missing_prerequisite" },
    { events: [base[0], base[3]], code: "missing_prerequisite" },
    { events: [base[0], base[4]], code: "missing_prerequisite" },
    { events: [base[0], base[8]], code: "missing_prerequisite" },
  ] as const;

  for (const sample of cases) {
    const outcome = projectRunEvents({ runId: RUN_ID, events: sample.events });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected projection refusal");
    assert.equal(outcome.error.code, sample.code);
    assert.equal(isRunProjectionFailure(outcome.error), true);
  }
});

test("repeated milestones are classified while failed approval operations do not advance state", () => {
  const base = happyHistory();
  const repeated = [
    [base[0], event({ eventType: "run.started", leadId: LEAD_ID }, 1)],
    [...base.slice(0, 3), event(base[2]?.data as RunEventData, 3)],
    [...base.slice(0, 4), event(base[3]?.data as RunEventData, 4)],
    [...base.slice(0, 5), event(base[4]?.data as RunEventData, 5)],
  ];
  for (const events of repeated) {
    const outcome = projectRunEvents({ runId: RUN_ID, events });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected duplicate milestone refusal");
    assert.equal(outcome.error.code, "duplicate_evidence");
  }

  const wrongLead = projectRunEvents({
    runId: RUN_ID,
    events: [base[0], event({ eventType: "qualification.attempted", leadId: "lead_grace" }, 1)],
  });
  assert.equal(wrongLead.ok, false);
  if (wrongLead.ok) assert.fail("Expected cross-lead milestone refusal");
  assert.equal(wrongLead.error.code, "conflicting_evidence");

  const operationalFailure = requireProjection({
    runId: RUN_ID,
    events: [
      base[0],
      event(
        {
          eventType: "approval.invalid",
          operation: "request",
          code: "invalid_request",
        },
        1,
      ),
      event(
        {
          eventType: "approval.storage_failed",
          operation: "read",
          code: "storage_failure",
        },
        2,
      ),
    ],
  });
  assert.equal(operationalFailure.latestSafeCheckpoint.kind, "run_started");
  assert.equal(operationalFailure.workingContext.approval, null);
});

test("cross-run, decreasing-time, conflicting milestone, and duplicate terminal evidence fail", () => {
  const base = happyHistory();
  const crossRun = event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 1, {
    runId: OTHER_RUN_ID,
  });
  const decreasing = event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 1, {
    timestamp: new Date(BASE_TIME - 1_000).toISOString(),
  });
  const secondDraft = event(
    {
      eventType: "domain.follow_up_drafted",
      leadId: LEAD_ID,
      draftId: "draft_projection_002",
      sha256: "b".repeat(64),
    },
    4,
  );
  const duplicateTerminal = event(
    { eventType: "run.completed", stopReason: "approval_pending" },
    9,
    { metadata: { result: "pending", stopReason: "approval_pending", approvalState: "pending" } },
  );
  const cases = [
    { events: [base[0], crossRun], code: "cross_run_identity" },
    { events: [base[0], decreasing], code: "out_of_order_event" },
    { events: [...base.slice(0, 4), secondDraft], code: "conflicting_evidence" },
    { events: [...base.slice(0, 6), duplicateTerminal], code: "duplicate_evidence" },
  ] as const;

  for (const sample of cases) {
    const outcome = projectRunEvents({ runId: RUN_ID, events: sample.events });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected projection refusal");
    assert.equal(outcome.error.code, sample.code);
  }
});

test("only compatible approval and fake-send evidence may follow the run terminal", () => {
  const base = happyHistory();
  const legal = requireProjection({ runId: RUN_ID, events: base });
  assert.equal(legal.status, "effect_indeterminate");

  const illegal = projectRunEvents({
    runId: RUN_ID,
    events: [
      ...base.slice(0, 6),
      event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 6),
    ],
  });
  assert.equal(illegal.ok, false);
  if (illegal.ok) assert.fail("Expected illegal post-terminal core refusal");
  assert.equal(illegal.error.code, "conflicting_evidence");
});

test("terminal stop reason must agree with durable qualification and approval milestones", () => {
  const base = happyHistory();
  const incompatible = event({ eventType: "run.completed", stopReason: "not_found" }, 5, {
    metadata: { result: "stopped", stopReason: "not_found" },
  });
  const badMetadata = event({ eventType: "run.completed", stopReason: "approval_pending" }, 5, {
    metadata: { result: "pending", stopReason: "completed", approvalState: "pending" },
  });

  for (const terminal of [incompatible, badMetadata]) {
    const outcome = projectRunEvents({ runId: RUN_ID, events: [...base.slice(0, 5), terminal] });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected incompatible terminal refusal");
    assert.equal(outcome.error.code, "incompatible_terminal");
  }
});

test("authority records must match exact run, lead, draft, hash, approval, and status evidence", () => {
  const wrongApproval = {
    ...approvedApproval(),
    runId: OTHER_RUN_ID,
  };
  const approvalOutcome = projectRunEvents({
    runId: RUN_ID,
    events: happyHistory().slice(0, 7),
    authority: { approvalRecords: [wrongApproval], fakeSendProjections: [] },
  });
  assert.equal(approvalOutcome.ok, false);
  if (approvalOutcome.ok) assert.fail("Expected approval authority refusal");
  assert.equal(approvalOutcome.error.code, "authority_mismatch");

  const fake = fakeProjection();
  const mismatchedHistory = happyHistory();
  mismatchedHistory[8] = event(
    {
      eventType: "fake_send.accepted",
      approvalId: APPROVAL_ID,
      idempotencyKey: fake.reservation.idempotencyKey,
      durationMs: 999,
      outcome: "accepted",
    },
    8,
  );
  const fakeOutcome = projectRunEvents({
    runId: RUN_ID,
    events: mismatchedHistory,
    authority: {
      approvalRecords: [approvedApproval()],
      fakeSendProjections: [fake],
    },
  });
  assert.equal(fakeOutcome.ok, false);
  if (fakeOutcome.ok) assert.fail("Expected fake-result authority refusal");
  assert.equal(fakeOutcome.error.code, "authority_mismatch");

  const future = fakeProjection();
  const futureEvidence: Extract<FakeSendStoreProjection, { state: "completed" }> = {
    ...future,
    reservation: { ...future.reservation, reservedAt: at(9) },
    result: {
      ...future.result,
      startedAt: at(9),
      completedAt: at(10),
    },
  };
  const futureOutcome = projectRunEvents({
    runId: RUN_ID,
    events: happyHistory(),
    authority: {
      approvalRecords: [approvedApproval()],
      fakeSendProjections: [futureEvidence],
    },
  });
  assert.equal(futureOutcome.ok, false);
  if (futureOutcome.ok) assert.fail("Expected future-dated authority refusal");
  assert.equal(futureOutcome.error.code, "authority_mismatch");
});

test("store-backed projection is identical across fresh durable store instances", () => {
  const directory = mkdtempSync(join(tmpdir(), "run-projection-restart-"));
  temporaryDirectories.push(directory);
  const path = join(directory, "events.jsonl");
  const inputs = happyHistory()
    .slice(0, 6)
    .map((item) => ({
      runId: item.runId,
      type: item.type,
      data: item.data,
      metadata: {
        actor: item.metadata.actor,
        action: item.metadata.action,
        tool: item.metadata.tool,
        validatedArguments: item.metadata.validatedArguments,
        result: item.metadata.result,
        errorCode: item.metadata.errorCode,
        approvalState: item.metadata.approvalState,
        stopReason: item.metadata.stopReason,
        modelVersion: item.metadata.modelVersion,
        promptVersion: item.metadata.promptVersion,
        durationMs: item.metadata.durationMs,
        retryCount: item.metadata.retryCount,
        tokens: item.metadata.tokens,
        costUsd: item.metadata.costUsd,
      },
    }));
  let index = 0;
  const firstStore = new JsonlEventStore(path, {
    makeEventId: () => `event_restart_projection_${String(index).padStart(3, "0")}`,
    now: () => at(index++),
    applicationVersion: "0.1.23",
  });
  for (const input of inputs) {
    const outcome = firstStore.append(input);
    if (!outcome.ok) assert.fail(outcome.error.message);
  }
  const first = projectStoredRun(firstStore, RUN_ID);
  const second = projectStoredRun(
    new JsonlEventStore(path, { applicationVersion: "0.1.23" }),
    RUN_ID,
  );

  assert.equal(first.ok, true);
  assert.deepEqual(second, first);
});

test("store boundary maps throws, malformed outcomes, and missing histories to closed failures", () => {
  const stores = [
    { readRun: () => ({ ok: true, value: "not-events" }) },
    {
      readRun: () => {
        throw new Error("private dependency detail");
      },
    },
    null,
  ];

  for (const store of stores) {
    assert.deepEqual(projectStoredRun(store, RUN_ID), {
      ok: false,
      error: makeRunProjectionFailure("storage_failure"),
    });
  }
  assert.deepEqual(projectStoredRun({ readRun: () => ({ ok: true, value: [] }) }, RUN_ID), {
    ok: false,
    error: makeRunProjectionFailure("missing_start"),
  });

  const mappings = [
    { source: "corrupt_record" as const, expected: "corrupt_history" },
    { source: "interrupted_write" as const, expected: "interrupted_history" },
    { source: "out_of_order_record" as const, expected: "out_of_order_event" },
    { source: "duplicate_event" as const, expected: "duplicate_evidence" },
  ];
  for (const mapping of mappings) {
    const outcome = projectStoredRun(
      { readRun: () => ({ ok: false, error: makeRunEventFailure(mapping.source) }) },
      RUN_ID,
    );
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected structural history refusal");
    assert.equal(outcome.error.code as string, mapping.expected);
  }
});

test("projection inputs are cloned and all public outcomes use closed guards", () => {
  const input = { runId: RUN_ID, events: happyHistory().slice(0, 4) };
  const outcome = projectRunEvents(input);
  assert.equal(isRunProjectionOutcome(outcome), true);
  if (!outcome.ok) assert.fail(outcome.error.message);
  const snapshot = structuredClone(outcome.value);

  input.events[0] = event({ eventType: "run.started", leadId: "lead_grace" }, 0);
  assert.deepEqual(outcome.value, snapshot);
  assert.equal(isRunProjection({ ...outcome.value, transcript: "forbidden" }), false);
  assert.equal(isRunProjectionFailure(makeRunProjectionFailure("missing_start")), true);
  assert.equal(
    isRunProjectionFailure({
      ...makeRunProjectionFailure("missing_start"),
      message: "raw dependency error",
    }),
    false,
  );
  assert.equal(
    isRunProjectionOutcome({ ok: true, value: { ...outcome.value, extra: true } }),
    false,
  );
  assert.deepEqual(projectRunEvents({ ...input, extra: true }), {
    ok: false,
    error: makeRunProjectionFailure("invalid_input"),
  });
  assert.deepEqual(
    projectRunEvents(
      new Proxy(
        {},
        {
          ownKeys: () => {
            throw new Error("secret");
          },
        },
      ),
    ),
    {
      ok: false,
      error: makeRunProjectionFailure("invalid_input"),
    },
  );
  assert.equal(
    isRunProjection({
      ...outcome.value,
      latestSafeCheckpoint: {
        kind: "run_started",
        eventId: outcome.value.latestSafeCheckpoint.eventId,
      },
    }),
    false,
  );
  assert.equal(
    isRunProjection({
      ...outcome.value,
      authority: {
        ...outcome.value.authority,
        approval: { verification: "verified", status: null },
      },
    }),
    false,
  );

  const pending = requireProjection({ runId: RUN_ID, events: happyHistory().slice(0, 6) });
  assert.equal(
    isRunProjection({
      ...pending,
      authority: {
        ...pending.authority,
        approval: { verification: "not_required", status: null },
      },
    }),
    false,
  );
  const effectObserved = requireProjection({ runId: RUN_ID, events: happyHistory() });
  assert.equal(
    isRunProjection({
      ...effectObserved,
      authority: {
        ...effectObserved.authority,
        fakeSend: {
          verification: "not_required",
          state: null,
          resultStatus: null,
        },
      },
    }),
    false,
  );
});
