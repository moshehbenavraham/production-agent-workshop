import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { ApprovalService } from "../src/approval-service.js";
import { FileApprovalStore } from "../src/approval-store.js";
import { createPendingApproval, hashApprovalDraft, type ApprovalRecord } from "../src/approval.js";
import { JsonlEventStore } from "../src/event-store.js";
import { deriveFakeSendIdempotencyKey } from "../src/fake-send.js";
import type { FakeSendReservation, FakeSendResult } from "../src/fake-send-result.js";
import { FileFakeSendResultStore } from "../src/fake-send-store.js";
import {
  RECOVERY_ACTION_POLICY,
  RecoveryApplication,
  type RecoveryApplicationPaths,
  deriveRecoveryDraftId,
  isRecoveryOutcome,
} from "../src/recovery-application.js";
import { makeRunEventFailure, type RunEventStore } from "../src/run-event.js";
import { executeQualification, findLead, makeDraft } from "../src/tools.js";
import { appendRunEvent, readRunEvents } from "./run-event-test-helpers.js";

const temporaryDirectories: string[] = [];
const RUN_ID = "run_recovery_integration_001";
const LEAD_ID = "lead_ada";
const ANGLE = "Start with one auditable support-triage workflow.";
const DRAFT_ID = "draft_recovery_checkpoint_001";
const APPROVAL_ID = "approval_recovery_checkpoint_001";
const APPROVAL_ACTOR_ID = "actor_recovery_reviewer";

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function paths(): RecoveryApplicationPaths {
  const directory = mkdtempSync(join(tmpdir(), "recovery-application-"));
  temporaryDirectories.push(directory);
  return {
    approvalPath: join(directory, "approvals.jsonl"),
    eventPath: join(directory, "events.jsonl"),
    resultPath: join(directory, "fake-send-results.jsonl"),
  };
}

function lineCount(path: string): number {
  return existsSync(path) ? readFileSync(path, "utf8").split("\n").filter(Boolean).length : 0;
}

async function qualificationCheckpoint(files: RecoveryApplicationPaths, runId = RUN_ID) {
  const store = new JsonlEventStore(files.eventPath);
  appendRunEvent(store, {
    runId,
    type: "run.started",
    data: { eventType: "run.started", leadId: LEAD_ID },
    metadata: { action: "run_start", result: "attempted" },
  });
  const qualification = await executeQualification(runId, LEAD_ID, store, { leadId: LEAD_ID });
  assert.equal(qualification.ok, true);
  return store;
}

function generatedDraft(): string {
  const lead = findLead(LEAD_ID);
  assert.ok(lead);
  return makeDraft(lead, ANGLE);
}

async function draftCheckpoint(
  files: RecoveryApplicationPaths,
  runId = RUN_ID,
  draftId = DRAFT_ID,
) {
  const store = await qualificationCheckpoint(files, runId);
  const content = generatedDraft();
  appendRunEvent(store, {
    runId,
    type: "domain.follow_up_drafted",
    data: {
      eventType: "domain.follow_up_drafted",
      leadId: LEAD_ID,
      draftId,
      sha256: hashApprovalDraft(content),
    },
    metadata: {
      action: "draft_follow_up",
      tool: { name: "draft_follow_up", callId: null },
      validatedArguments: { leadId: LEAD_ID },
      result: "succeeded",
    },
  });
  return { store, content, draftId };
}

async function approvalCheckpoint(files: RecoveryApplicationPaths, runId = RUN_ID) {
  const { store, content, draftId } = await draftCheckpoint(files, runId);
  const service = new ApprovalService(new FileApprovalStore(files.approvalPath), store, {
    makeApprovalId: () => APPROVAL_ID,
  });
  const outcome = service.requestApproval(
    { runId, leadId: LEAD_ID, action: "send_follow_up", draft: content },
    { draftId },
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return { store, service, approval: outcome.value, content, draftId };
}

function approve(
  files: RecoveryApplicationPaths,
  approval: ApprovalRecord,
  store = new JsonlEventStore(files.eventPath),
) {
  const service = new ApprovalService(new FileApprovalStore(files.approvalPath), store, {
    authorizedActorIds: new Set([APPROVAL_ACTOR_ID]),
  });
  const outcome = service.decideApproval({
    approvalId: approval.approvalId,
    runId: approval.runId,
    actorId: APPROVAL_ACTOR_ID,
    decision: "approved",
  });
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function claimFakeReservation(
  files: RecoveryApplicationPaths,
  approval: ApprovalRecord,
  reservedAt: string,
) {
  const idempotencyKey = deriveFakeSendIdempotencyKey({
    approvalId: approval.approvalId,
    runId: approval.runId,
    action: approval.action,
    target: approval.target,
    draftId: approval.draft.draftId,
    draftSha256: approval.draft.sha256,
  });
  const reservation: FakeSendReservation = {
    reservationId: "reservation_recovery_checkpoint_001",
    idempotencyKey,
    approvalId: approval.approvalId,
    runId: approval.runId,
    action: approval.action,
    target: approval.target,
    draftId: approval.draft.draftId,
    draftSha256: approval.draft.sha256,
    reservedAt,
  };
  const results = new FileFakeSendResultStore(files.resultPath);
  const claimed = results.claim(reservation);
  if (!claimed.ok) assert.fail(claimed.error.message);
  return { results, reservation };
}

function appendFakeAttempt(store: JsonlEventStore, reservation: FakeSendReservation) {
  appendRunEvent(store, {
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

test("recovery contracts expose closed policy and stable draft identity", () => {
  assert.equal(Object.isFrozen(RECOVERY_ACTION_POLICY), true);
  assert.equal(
    deriveRecoveryDraftId("run_recovery_contract_001", "lead_ada", "a".repeat(64)),
    deriveRecoveryDraftId("run_recovery_contract_001", "lead_ada", "a".repeat(64)),
  );
  assert.equal(isRecoveryOutcome({}), false);
});

test("fresh application resumes qualification checkpoint and exact replay is stable", async () => {
  const files = paths();
  await qualificationCheckpoint(files);
  const request = {
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate" as const, angle: ANGLE },
  };

  const first = new RecoveryApplication(files).recover(request);
  if (!first.ok) assert.fail(first.error.message);
  assert.equal(first.approval.status, "pending");
  assert.equal(first.stopReason, "approval_pending");
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.approval), true);
  const events = readRunEvents(new JsonlEventStore(files.eventPath), RUN_ID);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      "run.started",
      "qualification.attempted",
      "qualification.completed",
      "domain.follow_up_drafted",
      "approval.requested",
      "run.completed",
    ],
  );
  const counts = {
    events: lineCount(files.eventPath),
    approvals: lineCount(files.approvalPath),
    results: lineCount(files.resultPath),
  };

  const replayed = new RecoveryApplication(files).recover(request);
  assert.deepEqual(replayed, first);
  assert.deepEqual(
    {
      events: lineCount(files.eventPath),
      approvals: lineCount(files.approvalPath),
      results: lineCount(files.resultPath),
    },
    counts,
  );
});

test("draft checkpoint requires exact content and preserves durable draft identity", async () => {
  const files = paths();
  const checkpoint = await draftCheckpoint(files);
  const before = {
    events: lineCount(files.eventPath),
    approvals: lineCount(files.approvalPath),
  };

  const mismatch = new RecoveryApplication(files).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: {
      kind: "existing",
      content: `${checkpoint.content} substituted`,
    },
  });
  assert.equal(mismatch.ok, false);
  if (mismatch.ok) assert.fail("Expected draft mismatch");
  assert.equal(mismatch.action, "escalate");
  assert.equal(mismatch.error.code, "draft_mismatch");
  assert.deepEqual(
    { events: lineCount(files.eventPath), approvals: lineCount(files.approvalPath) },
    before,
  );

  const recovered = new RecoveryApplication(files).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "existing", content: checkpoint.content },
  });
  if (!recovered.ok) assert.fail(recovered.error.message);
  assert.equal(recovered.approval.draft.draftId, checkpoint.draftId);
  assert.equal(recovered.approval.draft.sha256, hashApprovalDraft(checkpoint.content));
  assert.equal(recovered.approval.draft.content, checkpoint.content);
  assert.equal(
    readRunEvents(new JsonlEventStore(files.eventPath), RUN_ID).filter(
      (event) => event.type === "domain.follow_up_drafted",
    ).length,
    1,
  );
});

test("deterministic generation may rehydrate only the exact durable draft hash", async () => {
  const files = paths();
  await draftCheckpoint(files);
  const recovered = new RecoveryApplication(files).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate", angle: ANGLE },
  });
  if (!recovered.ok) assert.fail(recovered.error.message);
  assert.equal(recovered.approval.draft.draftId, DRAFT_ID);

  const mismatchFiles = paths();
  await draftCheckpoint(mismatchFiles);
  const mismatch = new RecoveryApplication(mismatchFiles).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate", angle: "Use a different and still bounded recovery angle." },
  });
  assert.equal(mismatch.ok, false);
  if (mismatch.ok) assert.fail("Expected generated draft mismatch");
  assert.equal(mismatch.error.code, "draft_mismatch");
});

test("approval checkpoint returns exact record and appends only the missing terminal", async () => {
  const files = paths();
  const checkpoint = await approvalCheckpoint(files);
  const approvalLines = lineCount(files.approvalPath);
  const eventLines = lineCount(files.eventPath);
  const request = {
    runId: RUN_ID,
    leadId: LEAD_ID,
  };

  const recovered = new RecoveryApplication(files).recover(request);
  if (!recovered.ok) assert.fail(recovered.error.message);
  assert.deepEqual(recovered.approval, checkpoint.approval);
  assert.equal(lineCount(files.approvalPath), approvalLines);
  assert.equal(lineCount(files.eventPath), eventLines + 1);

  const replayed = new RecoveryApplication(files).recover(request);
  assert.deepEqual(replayed, recovered);
  assert.equal(lineCount(files.approvalPath), approvalLines);
  assert.equal(lineCount(files.eventPath), eventLines + 1);
});

test("same generate request survives terminal append retry without duplicating approval", async () => {
  const files = paths();
  const base = await qualificationCheckpoint(files);
  let failedTerminal = false;
  const boundary: RunEventStore = {
    readRun: (runId) => base.readRun(runId),
    append: (input) => {
      if (
        !failedTerminal &&
        typeof input === "object" &&
        input !== null &&
        "type" in input &&
        input.type === "run.completed"
      ) {
        failedTerminal = true;
        return { ok: false, error: makeRunEventFailure("storage_failure") };
      }
      return base.append(input);
    },
  };
  const request = {
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate" as const, angle: ANGLE },
  };
  const first = new RecoveryApplication(files, { eventStore: boundary }).recover(request);
  assert.equal(first.ok, false);
  if (first.ok) assert.fail("Expected terminal storage retry");
  assert.equal(first.action, "retry");
  assert.equal(first.error.code, "event_storage_failure");
  assert.equal(lineCount(files.approvalPath), 1);

  const repaired = new RecoveryApplication(files).recover(request);
  assert.equal(repaired.ok, true);
  assert.equal(lineCount(files.approvalPath), 1);
  const events = readRunEvents(new JsonlEventStore(files.eventPath), RUN_ID);
  assert.equal(events.filter((event) => event.type === "qualification.completed").length, 1);
  assert.equal(events.filter((event) => event.type === "domain.follow_up_drafted").length, 1);
  assert.equal(events.filter((event) => event.type === "approval.requested").length, 1);
  assert.equal(events.filter((event) => event.type === "run.completed").length, 1);
});

test("missing, substituted, and cross-lead recovery input fails before mutation", async () => {
  const files = paths();
  await qualificationCheckpoint(files);
  const before = lineCount(files.eventPath);
  const missing = new RecoveryApplication(files).recover({ runId: RUN_ID, leadId: LEAD_ID });
  const existing = new RecoveryApplication(files).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "existing", content: generatedDraft() },
  });
  const crossLead = new RecoveryApplication(files).recover({
    runId: RUN_ID,
    leadId: "lead_grace",
    draft: { kind: "generate", angle: ANGLE },
  });
  for (const outcome of [missing, existing, crossLead]) assert.equal(outcome.ok, false);
  if (missing.ok || existing.ok || crossLead.ok) assert.fail("Expected closed failures");
  assert.equal(missing.error.code, "draft_required");
  assert.equal(existing.error.code, "draft_mismatch");
  assert.equal(crossLead.error.code, "lead_mismatch");
  assert.equal(lineCount(files.eventPath), before);
  assert.equal(lineCount(files.approvalPath), 0);
});

test("reservation-only fake state always escalates and recovery mutates nothing", async () => {
  const files = paths();
  const checkpoint = await approvalCheckpoint(files);
  const request = {
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "existing" as const, content: checkpoint.content },
  };
  const terminal = new RecoveryApplication(files).recover(request);
  assert.equal(terminal.ok, true);
  const approved = approve(files, checkpoint.approval);
  assert.equal(approved.status, "approved");
  assert.ok(approved.decision);
  const fake = claimFakeReservation(files, approved, approved.decision.decidedAt);
  appendFakeAttempt(new JsonlEventStore(files.eventPath), fake.reservation);
  const counts = {
    events: lineCount(files.eventPath),
    approvals: lineCount(files.approvalPath),
    results: lineCount(files.resultPath),
  };

  const outcome = new RecoveryApplication(files).recover(request);
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected indeterminate effect escalation");
  assert.equal(outcome.action, "escalate");
  assert.equal(outcome.error.code, "effect_indeterminate");
  assert.deepEqual(new RecoveryApplication(files).recover(request), outcome);
  assert.deepEqual(
    {
      events: lineCount(files.eventPath),
      approvals: lineCount(files.approvalPath),
      results: lineCount(files.resultPath),
    },
    counts,
  );
});

test("same-run hidden reservation escalates while unrelated valid reservations are ignored", async () => {
  const files = paths();
  const checkpoint = await approvalCheckpoint(files);
  const request = {
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "existing" as const, content: checkpoint.content },
  };
  const hidden = claimFakeReservation(files, checkpoint.approval, checkpoint.approval.requestedAt);
  assert.equal(hidden.reservation.runId, RUN_ID);
  const escalated = new RecoveryApplication(files).recover(request);
  assert.equal(escalated.ok, false);
  if (escalated.ok) assert.fail("Expected hidden reservation escalation");
  assert.equal(escalated.error.code, "effect_indeterminate");

  const unrelatedFiles = paths();
  const unrelatedCheckpoint = await approvalCheckpoint(unrelatedFiles);
  const unrelatedApproval: ApprovalRecord = {
    ...unrelatedCheckpoint.approval,
    approvalId: "approval_recovery_unrelated_001",
    runId: "run_recovery_unrelated_001",
  };
  claimFakeReservation(unrelatedFiles, unrelatedApproval, unrelatedApproval.requestedAt);
  const recovered = new RecoveryApplication(unrelatedFiles).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "existing", content: unrelatedCheckpoint.content },
  });
  assert.equal(recovered.ok, true);
});

test("completed fake result stops recovery and is never re-executed", async () => {
  const files = paths();
  const checkpoint = await approvalCheckpoint(files);
  const request = {
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "existing" as const, content: checkpoint.content },
  };
  assert.equal(new RecoveryApplication(files).recover(request).ok, true);
  const approved = approve(files, checkpoint.approval);
  assert.ok(approved.decision);
  const { results, reservation } = claimFakeReservation(
    files,
    approved,
    approved.decision.decidedAt,
  );
  const eventStore = new JsonlEventStore(files.eventPath);
  appendFakeAttempt(eventStore, reservation);
  const result: FakeSendResult = {
    resultId: "result_recovery_checkpoint_001",
    idempotencyKey: reservation.idempotencyKey,
    approvalId: reservation.approvalId,
    runId: reservation.runId,
    action: reservation.action,
    target: reservation.target,
    draftId: reservation.draftId,
    draftSha256: reservation.draftSha256,
    startedAt: reservation.reservedAt,
    completedAt: reservation.reservedAt,
    durationMs: 0,
    compensation: { supported: false, code: "manual_review_required" },
    status: "accepted",
    receiptId: "fake_receipt_recovery_checkpoint_001",
  };
  const completed = results.complete(result);
  assert.equal(completed.ok, true);
  appendRunEvent(eventStore, {
    runId: RUN_ID,
    type: "fake_send.accepted",
    data: {
      eventType: "fake_send.accepted",
      approvalId: reservation.approvalId,
      idempotencyKey: reservation.idempotencyKey,
      durationMs: 0,
      outcome: "accepted",
    },
    metadata: {
      action: "fake_send.accepted",
      result: "succeeded",
      durationMs: 0,
    },
  });
  const before = lineCount(files.resultPath);

  const stopped = new RecoveryApplication(files).recover(request);
  assert.equal(stopped.ok, false);
  if (stopped.ok) assert.fail("Expected completed-effect stop");
  assert.equal(stopped.action, "stop");
  assert.equal(stopped.error.code, "effect_completed");
  assert.equal(lineCount(files.resultPath), before);
});

test("pending, approved, and declined authority replays the exact durable approval", async () => {
  for (const decision of [null, "approved", "declined"] as const) {
    const files = paths();
    const checkpoint = await approvalCheckpoint(files);
    const request = {
      runId: RUN_ID,
      leadId: LEAD_ID,
      draft: { kind: "existing" as const, content: checkpoint.content },
    };
    const first = new RecoveryApplication(files).recover(request);
    assert.equal(first.ok, true);
    let expected: ApprovalRecord = checkpoint.approval;
    if (decision) {
      const service = new ApprovalService(
        new FileApprovalStore(files.approvalPath),
        new JsonlEventStore(files.eventPath),
        { authorizedActorIds: new Set([APPROVAL_ACTOR_ID]) },
      );
      const outcome = service.decideApproval({
        approvalId: checkpoint.approval.approvalId,
        runId: RUN_ID,
        actorId: APPROVAL_ACTOR_ID,
        decision,
      });
      if (!outcome.ok) assert.fail(outcome.error.message);
      expected = outcome.value;
    }
    const replayed = new RecoveryApplication(files).recover(request);
    if (!replayed.ok) assert.fail(replayed.error.message);
    assert.deepEqual(replayed.approval, expected);
    assert.equal(replayed.stopReason, "approval_pending");
  }
});

test("run-start, open qualification, failed qualification, and stopped terminal classify safely", async () => {
  const runStartedFiles = paths();
  const runStartedStore = new JsonlEventStore(runStartedFiles.eventPath);
  appendRunEvent(runStartedStore, {
    runId: RUN_ID,
    type: "run.started",
    data: { eventType: "run.started", leadId: LEAD_ID },
    metadata: { action: "run_start", result: "attempted" },
  });
  const retry = new RecoveryApplication(runStartedFiles).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate", angle: ANGLE },
  });
  assert.equal(retry.ok, false);
  if (retry.ok) assert.fail("Expected qualification retry");
  assert.equal(retry.action, "retry");
  assert.equal(retry.error.code, "qualification_incomplete");

  const openFiles = paths();
  const openStore = new JsonlEventStore(openFiles.eventPath);
  appendRunEvent(openStore, {
    runId: RUN_ID,
    type: "run.started",
    data: { eventType: "run.started", leadId: LEAD_ID },
    metadata: { action: "run_start", result: "attempted" },
  });
  appendRunEvent(openStore, {
    runId: RUN_ID,
    type: "qualification.attempted",
    data: { eventType: "qualification.attempted", leadId: LEAD_ID },
    metadata: {
      action: "qualify_lead",
      tool: { name: "qualify_lead", callId: null },
      validatedArguments: { leadId: LEAD_ID },
      result: "attempted",
    },
  });
  const indeterminate = new RecoveryApplication(openFiles).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
  });
  assert.equal(indeterminate.ok, false);
  if (indeterminate.ok) assert.fail("Expected open-attempt escalation");
  assert.equal(indeterminate.action, "escalate");
  assert.equal(indeterminate.error.code, "qualification_indeterminate");

  const failedFiles = paths();
  const failedStore = new JsonlEventStore(failedFiles.eventPath);
  appendRunEvent(failedStore, {
    runId: RUN_ID,
    type: "run.started",
    data: { eventType: "run.started", leadId: LEAD_ID },
    metadata: { action: "run_start", result: "attempted" },
  });
  const failed = await executeQualification(
    RUN_ID,
    LEAD_ID,
    failedStore,
    { leadId: LEAD_ID },
    {
      qualificationExecutor: () => ({
        ok: false,
        error: { code: "lead_lookup_failed", message: "Lead lookup failed.", retryable: true },
      }),
    },
  );
  assert.equal(failed.ok, false);
  const stoppedFailure = new RecoveryApplication(failedFiles).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
  });
  assert.equal(stoppedFailure.ok, false);
  if (stoppedFailure.ok) assert.fail("Expected failed qualification stop");
  assert.equal(stoppedFailure.action, "stop");
  assert.equal(stoppedFailure.error.code, "qualification_failed");

  const stoppedFiles = paths();
  const stoppedStore = await qualificationCheckpoint(stoppedFiles);
  appendRunEvent(stoppedStore, {
    runId: RUN_ID,
    type: "run.stopped",
    data: { eventType: "run.stopped", stopReason: "deadline_exceeded" },
    metadata: {
      action: "run_stop",
      result: "stopped",
      errorCode: "deadline_exceeded",
      stopReason: "deadline_exceeded",
      approvalState: null,
      durationMs: 10,
    },
  });
  const terminal = new RecoveryApplication(stoppedFiles).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate", angle: ANGLE },
  });
  assert.equal(terminal.ok, false);
  if (terminal.ok) assert.fail("Expected terminal stop");
  assert.equal(terminal.action, "stop");
  assert.equal(terminal.error.code, "terminal_run");
});

test("structural store failures retain retry or escalation categories", () => {
  const cases = [
    { source: "storage_failure" as const, code: "storage_failure", action: "retry" },
    { source: "corrupt_record" as const, code: "corrupt_history", action: "escalate" },
    { source: "interrupted_write" as const, code: "interrupted_history", action: "escalate" },
    { source: "out_of_order_record" as const, code: "out_of_order_event", action: "escalate" },
    { source: "duplicate_event" as const, code: "duplicate_evidence", action: "escalate" },
  ];
  for (const sample of cases) {
    const files = paths();
    const eventStore: RunEventStore = {
      append: () => ({ ok: false, error: makeRunEventFailure("storage_failure") }),
      readRun: () => ({ ok: false, error: makeRunEventFailure(sample.source) }),
    };
    const outcome = new RecoveryApplication(files, { eventStore }).recover({
      runId: RUN_ID,
      leadId: LEAD_ID,
    });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected structural failure");
    assert.equal(outcome.error.code, sample.code);
    assert.equal(outcome.action, sample.action);
  }
});

test("missing and cross-run event histories fail visibly without writes", async () => {
  const missingFiles = paths();
  const missing = new RecoveryApplication(missingFiles).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
  });
  assert.equal(missing.ok, false);
  if (missing.ok) assert.fail("Expected missing start");
  assert.equal(missing.error.code, "missing_start");
  assert.equal(missing.action, "escalate");
  assert.equal(existsSync(missingFiles.eventPath), false);

  const files = paths();
  const store = await qualificationCheckpoint(files);
  const otherFiles = paths();
  const otherStore = await qualificationCheckpoint(otherFiles, "run_recovery_cross_001");
  const mixed = [
    ...readRunEvents(store, RUN_ID),
    ...readRunEvents(otherStore, "run_recovery_cross_001"),
  ];
  const crossRunStore: RunEventStore = {
    append: () => ({ ok: false, error: makeRunEventFailure("storage_failure") }),
    readRun: () => ({ ok: true, value: mixed }),
  };
  const crossRun = new RecoveryApplication(files, { eventStore: crossRunStore }).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate", angle: ANGLE },
  });
  assert.equal(crossRun.ok, false);
  if (crossRun.ok) assert.fail("Expected cross-run refusal");
  assert.equal(crossRun.error.code, "cross_run_identity");
  assert.equal(crossRun.action, "escalate");
});

test("malformed or throwing authority boundaries fail closed with no partial value", async () => {
  const files = paths();
  await qualificationCheckpoint(files);
  for (const fakeSendProjectionReader of [
    () => ({ ok: true, value: [{}] }),
    () => ({ value: [] }),
    () => {
      throw new Error("forbidden detail");
    },
  ]) {
    const outcome = new RecoveryApplication(files, { fakeSendProjectionReader }).recover({
      runId: RUN_ID,
      leadId: LEAD_ID,
      draft: { kind: "generate", angle: ANGLE },
    });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected authority storage failure");
    assert.equal(outcome.action, "retry");
    assert.equal(outcome.error.code, "storage_failure");
    assert.equal(JSON.stringify(outcome).includes("forbidden detail"), false);
  }

  const hostileApprovalStore = {
    appendRequest: () => {
      throw new Error("forbidden approval detail");
    },
    appendDecision: () => {
      throw new Error("forbidden approval detail");
    },
    get: () => {
      throw new Error("forbidden approval detail");
    },
    listRun: () => {
      throw new Error("forbidden approval detail");
    },
  };
  const outcome = new RecoveryApplication(files, {
    approvalStore: hostileApprovalStore,
  }).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "generate", angle: ANGLE },
  });
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected approval storage failure");
  assert.equal(outcome.error.code, "storage_failure");
});

test("approval record without matching event escalates authority mismatch", async () => {
  const files = paths();
  await draftCheckpoint(files);
  const pending = createPendingApproval(
    { runId: RUN_ID, leadId: LEAD_ID, action: "send_follow_up", draft: generatedDraft() },
    { approvalId: APPROVAL_ID, draftId: DRAFT_ID },
  );
  if (!pending.ok) assert.fail(pending.error.message);
  const written = new FileApprovalStore(files.approvalPath).appendRequest(pending.value);
  assert.equal(written.ok, true);
  const outcome = new RecoveryApplication(files).recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    draft: { kind: "existing", content: generatedDraft() },
  });
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected authority mismatch");
  assert.equal(outcome.action, "escalate");
  assert.equal(outcome.error.code, "authority_mismatch");
});

test("configuration, request, outcome, and mutation guards are closed", () => {
  assert.deepEqual(Object.keys(RECOVERY_ACTION_POLICY).sort(), [
    "compensate",
    "escalate",
    "resume",
    "retry",
    "stop",
  ]);
  assert.equal(Object.isFrozen(RECOVERY_ACTION_POLICY.resume.requiredEvidence), true);
  assert.equal(RECOVERY_ACTION_POLICY.compensate.supported, false);
  assert.equal(RECOVERY_ACTION_POLICY.compensate.automatic, false);
  assert.throws(
    () => deriveRecoveryDraftId("invalid", LEAD_ID, "a".repeat(64)),
    /identity input is invalid/,
  );
  assert.throws(
    () =>
      new RecoveryApplication(
        { approvalPath: "", eventPath: "events.jsonl", resultPath: "results.jsonl" },
        {},
      ),
    /exact, distinct, non-empty/,
  );
  assert.throws(
    () =>
      new RecoveryApplication(
        {
          approvalPath: "approvals.jsonl",
          eventPath: "events.jsonl",
          resultPath: "results.jsonl",
          unexpected: "forbidden.jsonl",
        } as RecoveryApplicationPaths,
        {},
      ),
    /exact, distinct, non-empty/,
  );
  assert.throws(
    () =>
      new RecoveryApplication(
        {
          approvalPath: "shared.jsonl",
          eventPath: "shared.jsonl",
          resultPath: "results.jsonl",
        },
        {},
      ),
    /exact, distinct, non-empty/,
  );
  assert.throws(
    () =>
      new RecoveryApplication(
        {
          approvalPath: "approvals.jsonl",
          eventPath: "events.jsonl",
          resultPath: "results.jsonl",
        },
        {
          approvalService: new Proxy(
            {},
            {
              ownKeys() {
                throw new Error("forbidden proxy detail");
              },
            },
          ),
        },
      ),
    /configuration is invalid/,
  );
  const files = paths();
  const app = new RecoveryApplication(files);
  const invalid = app.recover({
    runId: RUN_ID,
    leadId: LEAD_ID,
    extra: true,
  });
  assert.equal(invalid.ok, false);
  assert.equal(Object.isFrozen(invalid), true);
  if (invalid.ok) assert.fail("Expected invalid request");
  assert.equal(invalid.runId, null);
  assert.equal(invalid.error.code, "invalid_request");
  assert.equal(isRecoveryOutcome(invalid), true);
  assert.equal(isRecoveryOutcome({ ...invalid, unexpected: true }), false);
  assert.equal(isRecoveryOutcome({ ...invalid, runId: "invalid!" }), false);
  assert.equal(
    isRecoveryOutcome(
      new Proxy(
        {},
        {
          get() {
            throw new Error("forbidden proxy detail");
          },
        },
      ),
    ),
    false,
  );
});
