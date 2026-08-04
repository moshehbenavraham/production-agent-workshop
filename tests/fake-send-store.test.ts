import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { deriveFakeSendIdempotencyKey, makeFakeSendFailure } from "../src/fake-send.js";
import type {
  FakeSendReservation,
  FakeSendResult,
  FakeSendStorageRecord,
} from "../src/fake-send-result.js";
import {
  FileFakeSendResultStore,
  loadFakeSendRecords,
  projectFakeSendRecords,
  type FakeSendStoreReadText,
} from "../src/fake-send-store.js";

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function makePath(name = "fake-send-results.jsonl"): string {
  const directory = mkdtempSync(join(tmpdir(), "fake-send-store-"));
  temporaryDirectories.push(directory);
  return join(directory, name);
}

const identity = {
  approvalId: "approval_fake_store_001",
  runId: "run_fake_store_001",
  action: "send_follow_up" as const,
  target: { kind: "lead" as const, leadId: "lead_ada" },
  draftId: "draft_fake_store_001",
  draftSha256: "a".repeat(64),
};

function reservation(
  reservationId = "reservation_fake_store_001",
  reservedAt = "2026-08-04T10:00:00.000Z",
): FakeSendReservation {
  return {
    reservationId,
    ...identity,
    idempotencyKey: deriveFakeSendIdempotencyKey(identity),
    reservedAt,
  };
}

function acceptedResult(
  receiptId = "fake_receipt_store_001",
  resultId = "result_fake_store_001",
): FakeSendResult {
  return {
    resultId,
    ...identity,
    idempotencyKey: deriveFakeSendIdempotencyKey(identity),
    status: "accepted",
    startedAt: "2026-08-04T10:00:00.000Z",
    completedAt: "2026-08-04T10:00:00.025Z",
    durationMs: 25,
    receiptId,
    compensation: { supported: false, code: "manual_review_required" },
  };
}

function records(
  held: FakeSendReservation = reservation(),
  result?: FakeSendResult,
): FakeSendStorageRecord[] {
  const value: FakeSendStorageRecord[] = [
    {
      recordId: "record_fake_reservation_001",
      recordedAt: held.reservedAt,
      type: "fake_send.reserved",
      reservation: held,
    },
  ];
  if (result) {
    value.push({
      recordId: "record_fake_result_001",
      recordedAt: result.completedAt,
      type: "fake_send.completed",
      result,
    });
  }
  return value;
}

function deterministicStore(path: string): FileFakeSendResultStore {
  const firstTime = "2026-08-04T10:00:00.000Z";
  const times = [firstTime, "2026-08-04T10:00:00.025Z"];
  let timeIndex = 0;
  let recordIndex = 0;
  return new FileFakeSendResultStore(path, {
    makeRecordId: () => `record_generated_fake_${++recordIndex}`,
    now: () => times[Math.min(timeIndex++, times.length - 1)] ?? firstTime,
  });
}

function lineCount(path: string): number {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).length;
}

test("pure projection rebuilds exact reserved then completed state", () => {
  const held = reservation();
  const result = acceptedResult();

  assert.deepEqual(projectFakeSendRecords(records(held)), {
    ok: true,
    value: [{ state: "reserved", reservation: held }],
  });
  assert.deepEqual(projectFakeSendRecords(records(held, result)), {
    ok: true,
    value: [{ state: "completed", reservation: held, result }],
  });
});

test("projection rejects result-before-reservation, duplicate IDs, and decreasing time", () => {
  const held = reservation();
  const result = acceptedResult();
  const valid = records(held, result);
  const cases: unknown[] = [
    [valid[1]],
    [valid[0], { ...valid[1], recordId: valid[0]?.recordId }],
    [{ ...valid[0], recordedAt: "2026-08-04T10:00:01.000Z" }, valid[1]],
  ];

  for (const input of cases) {
    const outcome = projectFakeSendRecords(input);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected invalid ordered projection");
    assert.equal(outcome.error.code, "out_of_order_record");
  }
});

test("projection rejects duplicate reservations and conflicting terminal results", () => {
  const held = reservation();
  const result = acceptedResult();

  const duplicateReservation = projectFakeSendRecords([
    ...records(held),
    {
      ...records(reservation("reservation_fake_store_002"))[0],
      recordId: "record_fake_reservation_002",
      recordedAt: "2026-08-04T10:00:00.001Z",
    },
  ]);
  assert.equal(duplicateReservation.ok, false);
  if (duplicateReservation.ok) assert.fail("Expected duplicate reservation refusal");
  assert.equal(duplicateReservation.error.code, "result_conflict");

  const conflictingResult = projectFakeSendRecords([
    ...records(held, result),
    {
      ...records(held, acceptedResult("fake_receipt_store_002", "result_fake_store_002"))[1],
      recordId: "record_fake_result_002",
      recordedAt: "2026-08-04T10:00:00.026Z",
    },
  ]);
  assert.equal(conflictingResult.ok, false);
  if (conflictingResult.ok) assert.fail("Expected conflicting result refusal");
  assert.equal(conflictingResult.error.code, "result_conflict");
});

test("missing file is an empty valid store", () => {
  const store = deterministicStore(makePath("missing.jsonl"));
  assert.deepEqual(store.get(deriveFakeSendIdempotencyKey(identity)), {
    ok: true,
    value: null,
  });
});

test("reservation survives a new store instance with private file mode", () => {
  const path = makePath();
  const held = reservation();

  assert.deepEqual(deterministicStore(path).claim(held), {
    ok: true,
    kind: "claimed",
    value: held,
  });
  assert.deepEqual(deterministicStore(path).get(held.idempotencyKey), {
    ok: true,
    value: { state: "reserved", reservation: held },
  });
  assert.equal(lineCount(path), 1);
  assert.equal(statSync(path).mode & 0o777, 0o600);
});

test("terminal result survives an independent store instance", () => {
  const path = makePath();
  const held = reservation();
  const result = acceptedResult();
  const first = deterministicStore(path);

  assert.equal(first.claim(held).ok, true);
  assert.deepEqual(first.complete(result), {
    ok: true,
    value: { state: "completed", reservation: held, result },
  });
  assert.deepEqual(deterministicStore(path).get(held.idempotencyKey), {
    ok: true,
    value: { state: "completed", reservation: held, result },
  });
  assert.equal(lineCount(path), 2);
});

test("completed duplicate claim returns exact original with no new line", () => {
  const path = makePath();
  const held = reservation();
  const result = acceptedResult();
  const store = deterministicStore(path);
  assert.equal(store.claim(held).ok, true);
  assert.equal(store.complete(result).ok, true);

  assert.deepEqual(store.claim(reservation("reservation_fake_store_retry")), {
    ok: false,
    kind: "duplicate",
    value: { state: "completed", reservation: held, result },
    error: makeFakeSendFailure("duplicate"),
  });
  assert.equal(lineCount(path), 2);
});

test("reserved duplicate claim is visibly in progress and has no new line", () => {
  const path = makePath();
  const held = reservation();
  const store = deterministicStore(path);
  assert.equal(store.claim(held).ok, true);

  assert.deepEqual(store.claim(reservation("reservation_fake_store_retry")), {
    ok: false,
    kind: "duplicate",
    value: { state: "reserved", reservation: held },
    error: makeFakeSendFailure("execution_in_progress"),
  });
  assert.equal(lineCount(path), 1);
});

test("identical completion retry is idempotent without another line", () => {
  const path = makePath();
  const held = reservation();
  const result = acceptedResult();
  const store = deterministicStore(path);
  assert.equal(store.claim(held).ok, true);
  assert.equal(store.complete(result).ok, true);

  assert.deepEqual(store.complete(result), {
    ok: true,
    value: { state: "completed", reservation: held, result },
  });
  assert.equal(lineCount(path), 2);
});

test("different completion is refused without another line", () => {
  const path = makePath();
  const held = reservation();
  const result = acceptedResult();
  const store = deterministicStore(path);
  assert.equal(store.claim(held).ok, true);
  assert.equal(store.complete(result).ok, true);

  const conflict = store.complete(
    acceptedResult("fake_receipt_store_002", "result_fake_store_002"),
  );
  assert.equal(conflict.ok, false);
  if (conflict.ok) assert.fail("Expected result conflict");
  assert.equal(conflict.error.code, "result_conflict");
  assert.equal(lineCount(path), 2);
});

test("corrupt, malformed, blank, and truncated files fail closed", () => {
  const fixtures = [
    { name: "invalid-json", content: "{not json}\n", code: "corrupt_record" },
    {
      name: "malformed",
      content: `${JSON.stringify({ type: "fake_send.reserved" })}\n`,
      code: "corrupt_record",
    },
    { name: "blank", content: `${JSON.stringify(records()[0])}\n\n`, code: "corrupt_record" },
    {
      name: "truncated",
      content: JSON.stringify(records()[0]).slice(0, -2),
      code: "interrupted_write",
    },
  ] as const;

  for (const fixture of fixtures) {
    const path = makePath(`${fixture.name}.jsonl`);
    writeFileSync(path, fixture.content, "utf8");
    const outcome = deterministicStore(path).get(deriveFakeSendIdempotencyKey(identity));
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail(`Expected ${fixture.code}`);
    assert.equal(outcome.error.code, fixture.code);
  }
});

test("injected write failure returns redacted storage failure and no state", () => {
  const path = makePath();
  const held = reservation();
  const store = new FileFakeSendResultStore(path, {
    writeRecord: () => {
      throw new Error("sensitive writer path");
    },
  });

  const outcome = store.claim(held);
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected storage failure");
  assert.equal(outcome.error.code, "storage_failure");
  assert.doesNotMatch(outcome.error.message, /sensitive/);
  assert.deepEqual(deterministicStore(path).get(held.idempotencyKey), { ok: true, value: null });
});

test("injected read failure and invalid reader result remain typed", () => {
  const held = reservation();
  for (const readText of [
    () => {
      throw null;
    },
    (() => 42) as unknown as FakeSendStoreReadText,
  ]) {
    const store = new FileFakeSendResultStore(makePath(), { readText });
    for (const outcome of [store.get(held.idempotencyKey), store.claim(held)]) {
      assert.equal(outcome.ok, false);
      if (outcome.ok) assert.fail("Expected read failure");
      assert.equal(outcome.error.code, "storage_failure");
    }
  }
});

test("throwing or invalid metadata appends nothing", () => {
  const held = reservation();
  for (const options of [
    {
      makeRecordId: () => {
        throw new Error("sensitive id");
      },
    },
    {
      now: () => {
        throw "sensitive clock";
      },
    },
    { makeRecordId: () => "invalid" },
    { now: () => "not-a-time" },
  ]) {
    const path = makePath();
    let writes = 0;
    const store = new FileFakeSendResultStore(path, {
      ...options,
      writeRecord: () => {
        writes += 1;
      },
    });
    const outcome = store.claim(held);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected metadata failure");
    assert.equal(outcome.error.code, "storage_failure");
    assert.equal(writes, 0);
  }
});

test("no-op writer cannot manufacture durable success", () => {
  const held = reservation();
  const store = new FileFakeSendResultStore(makePath(), { writeRecord: () => undefined });
  const outcome = store.claim(held);
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected post-write verification failure");
  assert.equal(outcome.error.code, "storage_failure");
});

test("loader returns exact records and rejects non-array projection input", () => {
  const path = makePath();
  const serialized = records();
  writeFileSync(path, `${serialized.map((record) => JSON.stringify(record)).join("\n")}\n`, "utf8");
  assert.deepEqual(loadFakeSendRecords(path), { ok: true, value: serialized });
  assert.deepEqual(projectFakeSendRecords({ records: serialized }), {
    ok: false,
    error: makeFakeSendFailure("corrupt_record"),
  });
});
