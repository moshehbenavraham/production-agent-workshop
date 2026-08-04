import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import type { ApprovalRecord } from "../src/approval.js";
import { JsonlEventStore } from "../src/event-store.js";
import { makeFakeSendFailure, type FakeSendAdapter } from "../src/fake-send.js";
import { PRODUCTION_TOOL_NAMES } from "../src/pi-agent.js";
import {
  SAFE_WRITE_PERMISSION_DECISION,
  SafeWriteApplication,
  type SafeWriteApplicationPaths,
} from "../src/safe-write-application.js";

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function paths(): SafeWriteApplicationPaths {
  const directory = mkdtempSync(join(tmpdir(), "safe-write-application-"));
  temporaryDirectories.push(directory);
  return {
    approvalPath: join(directory, "approvals.jsonl"),
    eventPath: join(directory, "events.jsonl"),
    resultPath: join(directory, "fake-send-results.jsonl"),
  };
}

const RUN_ID = "run_safe_write_001";
const LEAD_ID = "lead_ada";
const APPROVAL_ACTOR_ID = "actor_workshop_reviewer";
const EXECUTION_ACTOR_ID = "actor_workshop_operator";
const DRAFT_ID = "draft_safe_write_001";
const DRAFT = "A sufficiently long synthetic safe-write integration draft.";

function acceptedAdapter(receiptId = "fake_receipt_safe_write_001") {
  let calls = 0;
  const adapter: FakeSendAdapter = {
    execute: async (_command, signal) => {
      calls += 1;
      assert.equal(signal.aborted, false);
      return {
        ok: true,
        status: "accepted",
        receiptId,
        acceptedAt: new Date().toISOString(),
      };
    },
  };
  return { adapter, calls: () => calls };
}

function application(
  files: SafeWriteApplicationPaths,
  adapter: FakeSendAdapter,
  options: {
    approvalActorIds?: ReadonlySet<string>;
    fakeSendActorIds?: ReadonlySet<string>;
    timeoutMs?: number;
  } = {},
): SafeWriteApplication {
  return new SafeWriteApplication(files, {
    approvalActorIds: options.approvalActorIds ?? new Set([APPROVAL_ACTOR_ID]),
    fakeSendActorIds: options.fakeSendActorIds ?? new Set([EXECUTION_ACTOR_ID]),
    adapter,
    fakeSendService: { timeoutMs: options.timeoutMs },
  });
}

function createApproval(application: SafeWriteApplication, runId = RUN_ID) {
  const outcome = application.requestApproval(
    {
      runId,
      leadId: LEAD_ID,
      action: "send_follow_up",
      draft: DRAFT,
    },
    { draftId: DRAFT_ID },
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function decideApproval(
  application: SafeWriteApplication,
  approval: ApprovalRecord,
  decision: "approved" | "declined",
) {
  const outcome = application.decideApproval({
    approvalId: approval.approvalId,
    runId: approval.runId,
    actorId: APPROVAL_ACTOR_ID,
    decision,
  });
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function request(approval: ApprovalRecord, actorId = EXECUTION_ACTOR_ID) {
  return {
    approvalId: approval.approvalId,
    runId: approval.runId,
    actorId,
    action: approval.action,
    target: { ...approval.target },
    draftId: approval.draft.draftId,
  };
}

function lineCount(path: string): number {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).length;
}

test("permission decision is frozen and production keeps fake execution unreachable", () => {
  assert.deepEqual(SAFE_WRITE_PERMISSION_DECISION, {
    capability: "fake_send",
    piToolRegistered: false,
    productionAllowlisted: false,
    humanReviewStatus: "not_performed",
    requiredReviewer: "repository_maintainer",
    humanReviewRequiredBeforeChange: true,
  });
  assert.equal(Object.isFrozen(SAFE_WRITE_PERMISSION_DECISION), true);
  assert.deepEqual(PRODUCTION_TOOL_NAMES, [
    "qualify_lead",
    "draft_follow_up",
    "request_send_approval",
  ]);
  assert.equal(PRODUCTION_TOOL_NAMES.includes("fake_send" as never), false);
  assert.equal(PRODUCTION_TOOL_NAMES.includes("execute_fake_send" as never), false);
  const files = paths();
  assert.throws(
    () =>
      new SafeWriteApplication(
        { ...files, resultPath: "" },
        {
          approvalActorIds: new Set([APPROVAL_ACTOR_ID]),
          fakeSendActorIds: new Set([EXECUTION_ACTOR_ID]),
        },
      ),
    /exact non-empty/,
  );
  const actorFailureRoot = files.approvalPath;
  assert.throws(
    () =>
      new SafeWriteApplication(
        {
          approvalPath: join(actorFailureRoot, "approvals.jsonl"),
          eventPath: join(actorFailureRoot, "events.jsonl"),
          resultPath: join(actorFailureRoot, "results.jsonl"),
        },
        {
          approvalActorIds: new Set(["invalid_actor"]),
          fakeSendActorIds: new Set([EXECUTION_ACTOR_ID]),
        },
      ),
    /valid actor identifiers/,
  );
  assert.equal(existsSync(actorFailureRoot), false);
  const timeoutFailureRoot = files.resultPath;
  assert.throws(
    () =>
      new SafeWriteApplication(
        {
          approvalPath: join(timeoutFailureRoot, "approvals.jsonl"),
          eventPath: join(timeoutFailureRoot, "events.jsonl"),
          resultPath: join(timeoutFailureRoot, "results.jsonl"),
        },
        {
          approvalActorIds: new Set([APPROVAL_ACTOR_ID]),
          fakeSendActorIds: new Set([EXECUTION_ACTOR_ID]),
          fakeSendService: { timeoutMs: 0 },
        },
      ),
    /positive finite integer/,
  );
  assert.equal(existsSync(timeoutFailureRoot), false);
  assert.throws(
    () =>
      new SafeWriteApplication(
        { ...files, unexpectedPath: "forbidden.jsonl" } as SafeWriteApplicationPaths,
        {
          approvalActorIds: new Set([APPROVAL_ACTOR_ID]),
          fakeSendActorIds: new Set([EXECUTION_ACTOR_ID]),
        },
      ),
    /exact non-empty/,
  );
});

test("approved exact action completes through file-backed composition with matching evidence", async () => {
  const files = paths();
  const fake = acceptedAdapter();
  const app = application(files, fake.adapter);
  const pending = createApproval(app);
  const approved = decideApproval(app, pending, "approved");

  const outcome = await app.executeFakeSend(request(approved));

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.kind, "executed");
  assert.equal(outcome.value.status, "accepted");
  assert.equal(fake.calls(), 1);
  assert.deepEqual(app.getApproval(approved.approvalId), { ok: true, value: approved });
  assert.deepEqual(app.listApprovals(RUN_ID), { ok: true, value: [approved] });
  assert.equal(lineCount(files.approvalPath), 2);
  assert.equal(lineCount(files.resultPath), 2);
  const events = new JsonlEventStore(files.eventPath).readRun(RUN_ID);
  assert.deepEqual(
    events.map((event) => event.type),
    ["approval.requested", "approval.approved", "fake_send.attempted", "fake_send.accepted"],
  );
  const fakeEvents = events.filter((event) => event.type.startsWith("fake_send."));
  assert.equal(JSON.stringify(fakeEvents).includes(DRAFT), false);
  assert.equal(JSON.stringify(fakeEvents).includes(LEAD_ID), false);
  assert.equal(
    fakeEvents.every(
      (event) =>
        event.data.approvalId === approved.approvalId &&
        event.data.idempotencyKey === outcome.value.idempotencyKey,
    ),
    true,
  );
});

test("missing input and exact-target mismatch fail before reservation or effect", async () => {
  const files = paths();
  const fake = acceptedAdapter();
  const app = application(files, fake.adapter);
  const approved = decideApproval(app, createApproval(app), "approved");

  const missing = await app.executeFakeSend({});
  const mismatch = await app.executeFakeSend({
    ...request(approved),
    target: { kind: "lead", leadId: "lead_grace" },
  });

  assert.equal(missing.ok, false);
  assert.equal(mismatch.ok, false);
  if (missing.ok || mismatch.ok) assert.fail("Expected pre-effect refusals");
  assert.equal(missing.error.code, "invalid_request");
  assert.equal(mismatch.error.code, "approval_identity_mismatch");
  assert.equal(fake.calls(), 0);
  assert.equal(existsSync(files.resultPath), false);
});

test("pending and declined approvals remain distinct zero-effect refusals", async () => {
  for (const state of ["pending", "declined"] as const) {
    const files = paths();
    const fake = acceptedAdapter();
    const app = application(files, fake.adapter);
    const pending = createApproval(app, `run_safe_write_${state}`);
    const approval = state === "declined" ? decideApproval(app, pending, "declined") : pending;

    const outcome = await app.executeFakeSend(request(approval));

    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected approval-state refusal");
    assert.equal(
      outcome.error.code,
      state === "pending" ? "approval_pending" : "approval_declined",
    );
    assert.equal(fake.calls(), 0);
    assert.equal(existsSync(files.resultPath), false);
  }
});

test("timeout aborts the composed adapter and persists one terminal result", async () => {
  const files = paths();
  let calls = 0;
  let signal: AbortSignal | undefined;
  let settle: ((value: Awaited<ReturnType<FakeSendAdapter["execute"]>>) => void) | undefined;
  const adapter: FakeSendAdapter = {
    execute: (_command, inputSignal) => {
      calls += 1;
      signal = inputSignal;
      return new Promise((resolve) => {
        settle = resolve;
      });
    },
  };
  const app = application(files, adapter, { timeoutMs: 5 });
  const approved = decideApproval(app, createApproval(app), "approved");

  const outcome = await app.executeFakeSend(request(approved));

  assert.equal(outcome.ok, false);
  if (outcome.ok || outcome.kind !== "executed") assert.fail("Expected terminal timeout");
  assert.equal(outcome.value.status, "timed_out");
  assert.equal(outcome.error.code, "timed_out");
  assert.equal(calls, 1);
  assert.equal(signal?.aborted, true);
  assert.equal(lineCount(files.resultPath), 2);
  const events = new JsonlEventStore(files.eventPath);
  assert.equal(
    events.readRun(RUN_ID).some((event) => event.type === "fake_send.timed_out"),
    true,
  );

  settle?.({
    ok: true,
    status: "accepted",
    receiptId: "fake_receipt_safe_write_late",
    acceptedAt: new Date().toISOString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(lineCount(files.resultPath), 2);
  assert.equal(
    events.readRun(RUN_ID).filter((event) => event.type === "fake_send.timed_out").length,
    1,
  );
  assert.equal(
    events.readRun(RUN_ID).filter((event) => event.type === "fake_send.accepted").length,
    0,
  );
});

test("new application returns exact original duplicate with one total effect", async () => {
  const files = paths();
  const firstFake = acceptedAdapter("fake_receipt_safe_write_original");
  const firstApp = application(files, firstFake.adapter);
  const approved = decideApproval(firstApp, createApproval(firstApp), "approved");
  const first = await firstApp.executeFakeSend(request(approved));
  if (!first.ok) assert.fail(first.error.message);

  const duplicateFake = acceptedAdapter("fake_receipt_safe_write_forbidden_second");
  const duplicateApp = application(files, duplicateFake.adapter);
  const duplicate = await duplicateApp.executeFakeSend(request(approved));

  if (!duplicate.ok) assert.fail(duplicate.error.message);
  assert.equal(duplicate.kind, "duplicate");
  assert.deepEqual(duplicate.value, first.value);
  assert.equal(firstFake.calls(), 1);
  assert.equal(duplicateFake.calls(), 0);
  assert.equal(lineCount(files.resultPath), 2);

  new JsonlEventStore(files.eventPath).append({
    runId: RUN_ID,
    type: "fake_send.accepted",
    data: { eventType: "approval.requested", approvalId: approved.approvalId },
  });
  const malformedNamespace = await duplicateApp.executeFakeSend(request(approved));
  assert.equal(malformedNamespace.ok, false);
  if (malformedNamespace.ok) assert.fail("Expected malformed fake namespace refusal");
  assert.equal(malformedNamespace.error.code, "storage_failure");
  assert.equal(duplicateFake.calls(), 0);
});

test("actor sets are snapshotted and unauthorized operator gets minimized denial", async () => {
  const files = paths();
  const approvalActors = new Set([APPROVAL_ACTOR_ID]);
  const executionActors = new Set([EXECUTION_ACTOR_ID]);
  const fake = acceptedAdapter();
  const app = application(files, fake.adapter, {
    approvalActorIds: approvalActors,
    fakeSendActorIds: executionActors,
  });
  approvalActors.add("actor_late_reviewer");
  executionActors.add("actor_late_operator");
  const pending = createApproval(app);
  const lateDecision = app.decideApproval({
    approvalId: pending.approvalId,
    runId: pending.runId,
    actorId: "actor_late_reviewer",
    decision: "approved",
  });
  assert.equal(lateDecision.ok, false);
  if (lateDecision.ok) assert.fail("Expected snapshotted approval permission");
  assert.equal(lateDecision.error.code, "unknown_actor");
  const approved = decideApproval(app, pending, "approved");

  const denied = await app.executeFakeSend(request(approved, "actor_late_operator"));

  assert.equal(denied.ok, false);
  if (denied.ok) assert.fail("Expected snapshotted execution permission");
  assert.equal(denied.error.code, "permission_denied");
  assert.equal(fake.calls(), 0);
  assert.equal(existsSync(files.resultPath), false);
  const deniedEvent = new JsonlEventStore(files.eventPath)
    .readRun(RUN_ID)
    .find((event) => event.type === "fake_send.permission_denied");
  assert.deepEqual(deniedEvent?.data, {
    eventType: "fake_send.permission_denied",
    approvalId: approved.approvalId,
    code: "permission_denied",
  });
});

test("adapter rejection persists exact rejected result and event", async () => {
  const files = paths();
  let calls = 0;
  const adapter: FakeSendAdapter = {
    execute: async () => {
      calls += 1;
      return { ok: false, status: "rejected", error: makeFakeSendFailure("rejected") };
    },
  };
  const app = application(files, adapter);
  const approved = decideApproval(app, createApproval(app), "approved");

  const outcome = await app.executeFakeSend(request(approved));

  assert.equal(outcome.ok, false);
  if (outcome.ok || outcome.kind !== "executed") assert.fail("Expected rejected result");
  assert.equal(outcome.value.status, "rejected");
  assert.equal(outcome.error.code, "rejected");
  assert.equal(calls, 1);
  assert.equal(lineCount(files.resultPath), 2);
  assert.equal(
    new JsonlEventStore(files.eventPath)
      .readRun(RUN_ID)
      .some((event) => event.type === "fake_send.rejected"),
    true,
  );
});

test("thrown, rejected, and malformed downstream outcomes become canonical durable failures", async () => {
  const adapters: FakeSendAdapter[] = [
    {
      execute: async () => {
        throw new Error("sensitive downstream detail");
      },
    },
    { execute: async () => Promise.reject("sensitive downstream rejection") },
    { execute: async () => ({ ok: true, status: "accepted", raw: DRAFT }) as never },
  ];

  for (const adapter of adapters) {
    const files = paths();
    const app = application(files, adapter);
    const approved = decideApproval(app, createApproval(app), "approved");

    const outcome = await app.executeFakeSend(request(approved));

    assert.equal(outcome.ok, false);
    if (outcome.ok || outcome.kind !== "executed") assert.fail("Expected downstream result");
    assert.equal(outcome.value.status, "downstream_failure");
    assert.equal(outcome.error.code, "downstream_failure");
    assert.doesNotMatch(JSON.stringify(outcome), /sensitive|raw/);
    assert.equal(lineCount(files.resultPath), 2);
    assert.equal(
      new JsonlEventStore(files.eventPath)
        .readRun(RUN_ID)
        .some((event) => event.type === "fake_send.downstream_failed"),
      true,
    );
  }
});
