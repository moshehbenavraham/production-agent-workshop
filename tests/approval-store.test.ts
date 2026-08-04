import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import {
  createPendingApproval,
  transitionApproval,
  type PendingApproval,
  type TerminalApproval,
} from "../src/approval.js";
import {
  FileApprovalStore,
  loadApprovalRecords,
  projectApprovalRecords,
  type ApprovalStoreReadText,
} from "../src/approval-store.js";

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function makePath(name = "approvals.jsonl"): string {
  const directory = mkdtempSync(join(tmpdir(), "approval-store-"));
  temporaryDirectories.push(directory);
  return join(directory, name);
}

function pending(
  approvalId = "approval_store_001",
  runId = "run_store_001",
  now = "2026-08-04T10:00:00.000Z",
): PendingApproval {
  const outcome = createPendingApproval(
    {
      runId,
      leadId: "lead_ada",
      action: "send_follow_up",
      draft: "A sufficiently long synthetic approval-store draft.",
    },
    { approvalId, draftId: `draft_${approvalId.slice(9)}`, now },
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function terminal(
  approval: PendingApproval,
  decision: "approved" | "declined",
  now = "2026-08-04T10:01:00.000Z",
): TerminalApproval {
  const outcome = transitionApproval(
    approval,
    {
      approvalId: approval.approvalId,
      runId: approval.runId,
      actorId: "actor_reviewer",
      decision,
    },
    new Set(["actor_reviewer"]),
    now,
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function recordsFor(
  approval: PendingApproval,
  decided?: TerminalApproval,
): Array<Record<string, unknown>> {
  const records: Array<Record<string, unknown>> = [
    {
      recordId: "record_request_001",
      recordedAt: approval.requestedAt,
      type: "approval.requested",
      approval,
    },
  ];
  if (decided?.decision) {
    records.push({
      recordId: "record_decision_001",
      recordedAt: decided.decision.decidedAt,
      type: decided.status === "approved" ? "approval.approved" : "approval.declined",
      approvalId: decided.approvalId,
      runId: decided.runId,
      decision: decided.decision,
    });
  }
  return records;
}

function deterministicStore(path: string): FileApprovalStore {
  let recordNumber = 0;
  let second = 0;
  return new FileApprovalStore(path, {
    makeRecordId: () => `record_generated_${++recordNumber}`,
    now: () => `2026-08-04T10:02:${String(second++).padStart(2, "0")}.000Z`,
  });
}

test("pure projection rebuilds exact pending then approved state", () => {
  const request = pending();
  const approved = terminal(request, "approved");

  const pendingProjection = projectApprovalRecords(recordsFor(request));
  assert.deepEqual(pendingProjection, { ok: true, value: [request] });

  const terminalProjection = projectApprovalRecords(recordsFor(request, approved));
  assert.deepEqual(terminalProjection, { ok: true, value: [approved] });
});

test("pure projection rejects decisions before requests and cross-run decisions", () => {
  const request = pending();
  const approved = terminal(request, "approved");
  const records = recordsFor(request, approved);

  for (const input of [[records[1]], [records[0], { ...records[1], runId: "run_other" }]]) {
    const outcome = projectApprovalRecords(input);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected out-of-order projection failure");
    assert.equal(outcome.error.code, "out_of_order_record");
  }
});

test("pure projection rejects duplicate requests, record IDs, and decreasing time", () => {
  const first = pending();
  const second = pending("approval_store_002", "run_store_002", "2026-08-04T10:02:00.000Z");
  const firstRecord = recordsFor(first)[0];
  const secondRecord = {
    ...recordsFor(second)[0],
    recordId: "record_request_002",
  };

  const duplicateRequest = projectApprovalRecords([
    firstRecord,
    { ...firstRecord, recordId: "record_other" },
  ]);
  assert.equal(duplicateRequest.ok, false);
  if (duplicateRequest.ok) assert.fail("Expected duplicate request");
  assert.equal(duplicateRequest.error.code, "duplicate_request");

  const duplicateRecord = projectApprovalRecords([
    firstRecord,
    { ...secondRecord, recordId: "record_request_001" },
  ]);
  assert.equal(duplicateRecord.ok, false);
  if (duplicateRecord.ok) assert.fail("Expected corrupt duplicate record ID");
  assert.equal(duplicateRecord.error.code, "corrupt_record");

  const decreasing = projectApprovalRecords([
    { ...firstRecord, recordedAt: "2026-08-04T10:03:00.000Z" },
    secondRecord,
  ]);
  assert.equal(decreasing.ok, false);
  if (decreasing.ok) assert.fail("Expected decreasing-time failure");
  assert.equal(decreasing.error.code, "out_of_order_record");
});

test("missing file is an empty valid store", () => {
  const store = deterministicStore(makePath("missing.jsonl"));

  assert.deepEqual(store.get("approval_store_001"), { ok: true, value: null });
  assert.deepEqual(store.listRun("run_store_001"), { ok: true, value: [] });
});

test("pending approval survives a new store instance", () => {
  const path = makePath();
  const request = pending();
  const first = deterministicStore(path);

  assert.deepEqual(first.appendRequest(request), { ok: true, value: request });
  const second = deterministicStore(path);
  assert.deepEqual(second.get(request.approvalId), { ok: true, value: request });
  assert.deepEqual(second.listRun(request.runId), { ok: true, value: [request] });
  assert.equal(readFileSync(path, "utf8").split("\n").filter(Boolean).length, 1);
});

test("approved and declined state survive independent store instances", () => {
  for (const decision of ["approved", "declined"] as const) {
    const path = makePath(`${decision}.jsonl`);
    const request = pending(`approval_${decision}_001`, `run_${decision}_001`);
    const decided = terminal(request, decision);
    const first = deterministicStore(path);

    assert.equal(first.appendRequest(request).ok, true);
    assert.deepEqual(first.appendDecision(decided), { ok: true, value: decided });
    assert.deepEqual(deterministicStore(path).get(request.approvalId), {
      ok: true,
      value: decided,
    });
  }
});

test("duplicate request and identical terminal retry append no extra record", () => {
  const path = makePath();
  const request = pending();
  const approved = terminal(request, "approved");
  const store = deterministicStore(path);

  assert.equal(store.appendRequest(request).ok, true);
  const duplicate = store.appendRequest(request);
  assert.equal(duplicate.ok, false);
  if (duplicate.ok) assert.fail("Expected duplicate request failure");
  assert.equal(duplicate.error.code, "duplicate_request");

  assert.equal(store.appendDecision(approved).ok, true);
  assert.deepEqual(store.appendDecision(approved), { ok: true, value: approved });
  assert.equal(readFileSync(path, "utf8").split("\n").filter(Boolean).length, 2);
});

test("conflicting terminal append is refused without another record", () => {
  const path = makePath();
  const request = pending();
  const approved = terminal(request, "approved");
  const declined = terminal(request, "declined");
  const store = deterministicStore(path);

  assert.equal(store.appendRequest(request).ok, true);
  assert.equal(store.appendDecision(approved).ok, true);
  const conflict = store.appendDecision(declined);
  assert.equal(conflict.ok, false);
  if (conflict.ok) assert.fail("Expected conflict refusal");
  assert.equal(conflict.error.code, "approval_conflict");
  assert.equal(readFileSync(path, "utf8").split("\n").filter(Boolean).length, 2);
});

test("corrupt, malformed, and truncated files fail closed", () => {
  const request = pending();
  const cases = [
    { name: "invalid-json", content: "{not json}\n", code: "corrupt_record" },
    {
      name: "malformed",
      content: `${JSON.stringify({ type: "approval.requested" })}\n`,
      code: "corrupt_record",
    },
    {
      name: "truncated",
      content: JSON.stringify(recordsFor(request)[0]).slice(0, -3),
      code: "interrupted_write",
    },
  ] as const;

  for (const fixture of cases) {
    const path = makePath(`${fixture.name}.jsonl`);
    writeFileSync(path, fixture.content, "utf8");
    const outcome = deterministicStore(path).get(request.approvalId);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail(`Expected ${fixture.code}`);
    assert.equal(outcome.error.code, fixture.code);
  }
});

test("injected write failure returns storage failure and no state", () => {
  const path = makePath();
  const request = pending();
  const store = new FileApprovalStore(path, {
    writeRecord: () => {
      throw new Error("sensitive write detail");
    },
  });

  const outcome = store.appendRequest(request);
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected storage failure");
  assert.equal(outcome.error.code, "storage_failure");
  assert.doesNotMatch(outcome.error.message, /sensitive/);
  assert.deepEqual(deterministicStore(path).get(request.approvalId), { ok: true, value: null });
});

test("injected read failure returns storage failure without stale cache", () => {
  const request = pending();
  const store = new FileApprovalStore(makePath(), {
    readText: () => {
      throw new Error("sensitive read detail");
    },
  });

  for (const outcome of [
    store.get(request.approvalId),
    store.listRun(request.runId),
    store.appendRequest(request),
  ]) {
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected read storage failure");
    assert.equal(outcome.error.code, "storage_failure");
    assert.doesNotMatch(outcome.error.message, /sensitive/);
  }
});

test("reader contract violations and non-Error throws stay typed", () => {
  const path = makePath();
  const throwing = loadApprovalRecords(path, () => {
    throw null;
  });
  assert.equal(throwing.ok, false);
  if (throwing.ok) assert.fail("Expected storage failure for thrown null");
  assert.equal(throwing.error.code, "storage_failure");

  const invalidReader = (() => 42) as unknown as ApprovalStoreReadText;
  const invalid = loadApprovalRecords(path, invalidReader);
  assert.equal(invalid.ok, false);
  if (invalid.ok) assert.fail("Expected storage failure for non-string read result");
  assert.equal(invalid.error.code, "storage_failure");
});

test("throwing record metadata providers append nothing and stay typed", () => {
  for (const options of [
    {
      makeRecordId: () => {
        throw new Error("sensitive identifier detail");
      },
    },
    {
      now: () => {
        throw "sensitive clock detail";
      },
    },
  ]) {
    const path = makePath();
    let writeCalls = 0;
    const store = new FileApprovalStore(path, {
      ...options,
      writeRecord: () => {
        writeCalls += 1;
      },
    });
    const outcome = store.appendRequest(pending());

    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected metadata storage failure");
    assert.equal(outcome.error.code, "storage_failure");
    assert.doesNotMatch(outcome.error.message, /sensitive/);
    assert.equal(writeCalls, 0);
    assert.deepEqual(deterministicStore(path).get("approval_store_001"), {
      ok: true,
      value: null,
    });
  }
});
