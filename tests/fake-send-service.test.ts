import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import {
  createPendingApproval,
  transitionApproval,
  type ApprovalRecord,
  type ApprovalStore,
} from "../src/approval.js";
import type { AgentEvent } from "../src/event-store.js";
import { JsonlEventStore } from "../src/event-store.js";
import {
  FakeSendAuthorizer,
  makeFakeSendFailure,
  type FakeSendAdapter,
  type FakeSendRequest,
} from "../src/fake-send.js";
import type { FakeSendReservation, FakeSendResultStore } from "../src/fake-send-result.js";
import {
  FakeSendService,
  type FakeSendAuthorizationBoundary,
  type FakeSendEventStore,
} from "../src/fake-send-service.js";
import { DeterministicFakeSendAdapter } from "../src/fake-send-adapter.js";
import { FileFakeSendResultStore } from "../src/fake-send-store.js";

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function paths(): { resultPath: string; eventPath: string } {
  const directory = mkdtempSync(join(tmpdir(), "fake-send-service-"));
  temporaryDirectories.push(directory);
  return {
    resultPath: join(directory, "fake-send-results.jsonl"),
    eventPath: join(directory, "events.jsonl"),
  };
}

const RUN_ID = "run_fake_service_001";
const APPROVAL_ID = "approval_fake_service_001";
const DRAFT_ID = "draft_fake_service_001";
const ACTOR_ID = "actor_fake_service_operator";
const START_MS = Date.parse("2026-08-04T12:00:00.000Z");
const DRAFT = "A sufficiently long synthetic service fake-send draft.";

function approval(status: "pending" | "approved" | "declined" = "approved"): ApprovalRecord {
  const created = createPendingApproval(
    { runId: RUN_ID, leadId: "lead_ada", action: "send_follow_up", draft: DRAFT },
    {
      approvalId: APPROVAL_ID,
      draftId: DRAFT_ID,
      now: "2026-08-04T11:59:00.000Z",
    },
  );
  if (!created.ok) assert.fail(created.error.message);
  if (status === "pending") return created.value;
  const transitioned = transitionApproval(
    created.value,
    {
      approvalId: APPROVAL_ID,
      runId: RUN_ID,
      actorId: "actor_workshop_reviewer",
      decision: status,
    },
    new Set(["actor_workshop_reviewer"]),
    "2026-08-04T11:59:30.000Z",
  );
  if (!transitioned.ok) assert.fail(transitioned.error.message);
  return transitioned.value;
}

function approvalStore(value: ApprovalRecord | null): ApprovalStore {
  return {
    appendRequest: (record) => ({ ok: true, value: record }),
    appendDecision: (record) => ({ ok: true, value: record }),
    get: () => ({ ok: true, value }),
    listRun: () => ({ ok: true, value: value ? [value] : [] }),
  };
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

function authorizer(record: ApprovalRecord | null = approval()): FakeSendAuthorizer {
  return new FakeSendAuthorizer(approvalStore(record), {
    authorizedActorIds: new Set([ACTOR_ID]),
  });
}

function acceptedAdapter(options: { acceptedAt?: string } = {}) {
  let calls = 0;
  const adapter: FakeSendAdapter = {
    execute: async (_command, signal) => {
      calls += 1;
      assert.equal(signal.aborted, false);
      return {
        ok: true,
        status: "accepted",
        receiptId: "fake_receipt_service_001",
        acceptedAt: options.acceptedAt ?? "2026-08-04T12:00:00.020Z",
      };
    },
  };
  return { adapter, calls: () => calls };
}

function service(
  resultPath: string,
  events: FakeSendEventStore,
  adapter: FakeSendAdapter,
  options: {
    record?: ApprovalRecord | null;
    timeoutMs?: number;
    nowMs?: () => number;
    makeReservationId?: () => string;
    makeResultId?: () => string;
    results?: FakeSendResultStore;
    authorization?: FakeSendAuthorizationBoundary;
  } = {},
): FakeSendService {
  let tick = 0;
  let reservationIndex = 0;
  let resultIndex = 0;
  return new FakeSendService(
    options.authorization ?? authorizer(options.record === undefined ? approval() : options.record),
    options.results ?? new FileFakeSendResultStore(resultPath),
    events,
    adapter,
    {
      timeoutMs: options.timeoutMs,
      nowMs: options.nowMs ?? (() => START_MS + 25 * tick++),
      makeReservationId:
        options.makeReservationId ??
        (() => `reservation_fake_service_${String(++reservationIndex).padStart(3, "0")}`),
      makeResultId:
        options.makeResultId ??
        (() => `result_fake_service_${String(++resultIndex).padStart(3, "0")}`),
    },
  );
}

function lineCount(path: string): number {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).length;
}

class MemoryEventStore implements FakeSendEventStore {
  readonly events: AgentEvent[] = [];
  readonly failOnce = new Set<string>();

  append(input: Omit<AgentEvent, "eventId" | "at">): AgentEvent {
    if (this.failOnce.delete(input.type)) throw new Error("sensitive event failure");
    const event: AgentEvent = {
      ...input,
      eventId: `event_fake_service_${this.events.length + 1}`,
      at: "2026-08-04T12:00:01.000Z",
    };
    this.events.push(event);
    return event;
  }

  readRun(runId: string): AgentEvent[] {
    return this.events.filter((event) => event.runId === runId);
  }
}

test("exact approved action persists one accepted result and minimized events", async () => {
  const { resultPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const fake = acceptedAdapter();
  const outcome = await service(resultPath, events, fake.adapter).execute(request());

  if (!outcome.ok) assert.fail(`Expected accepted execution, got ${outcome.error.code}`);
  assert.equal(outcome.kind, "executed");
  assert.equal(outcome.value.status, "accepted");
  assert.equal(fake.calls(), 1);
  assert.equal(lineCount(resultPath), 2);
  assert.deepEqual(
    events.readRun(RUN_ID).map((event) => event.type),
    ["fake_send.attempted", "fake_send.accepted"],
  );
  assert.equal(JSON.stringify(events.readRun(RUN_ID)).includes(DRAFT), false);
  assert.equal(JSON.stringify(events.readRun(RUN_ID)).includes("lead_ada"), false);
});

test("new service returns exact durable original for duplicate with zero second effect", async () => {
  const { resultPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const firstFake = acceptedAdapter();
  const first = await service(resultPath, events, firstFake.adapter).execute(request());
  if (!first.ok) assert.fail(first.error.message);

  const duplicateFake = acceptedAdapter();
  const duplicate = await service(
    resultPath,
    new JsonlEventStore(eventPath),
    duplicateFake.adapter,
    {
      nowMs: (() => {
        let tick = 0;
        return () => START_MS + 1_000 + tick++;
      })(),
    },
  ).execute(request());

  if (!duplicate.ok) assert.fail(`Expected duplicate result, got ${duplicate.error.code}`);
  assert.equal(duplicate.kind, "duplicate");
  assert.deepEqual(duplicate.value, first.value);
  assert.equal(firstFake.calls(), 1);
  assert.equal(duplicateFake.calls(), 0);
  assert.equal(lineCount(resultPath), 2);
  assert.deepEqual(
    events.readRun(RUN_ID).map((event) => event.type),
    ["fake_send.attempted", "fake_send.accepted", "fake_send.duplicate"],
  );
});

test("missing, pending, declined, mismatched, and unauthorized requests have zero effects", async () => {
  const cases = [
    { record: null, input: request(), code: "approval_not_found" },
    { record: approval("pending"), input: request(), code: "approval_pending" },
    { record: approval("declined"), input: request(), code: "approval_declined" },
    {
      record: approval(),
      input: request({ target: { kind: "lead", leadId: "lead_grace" } }),
      code: "approval_identity_mismatch",
    },
    { record: approval(), input: request({ actorId: "actor_unknown" }), code: "permission_denied" },
  ] as const;

  for (const fixture of cases) {
    const { resultPath } = paths();
    const events = new MemoryEventStore();
    const fake = acceptedAdapter();
    const outcome = await service(resultPath, events, fake.adapter, {
      record: fixture.record,
    }).execute(fixture.input);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected authorization refusal");
    assert.equal(outcome.kind, "failure");
    assert.equal(outcome.error.code, fixture.code);
    assert.equal(fake.calls(), 0);
    assert.equal(
      events.events.some((event) => event.type === "fake_send.attempted"),
      false,
    );
    if (fixture.code === "permission_denied") {
      assert.deepEqual(
        events.events.map((event) => event.type),
        ["fake_send.permission_denied"],
      );
    }
  }
});

test("rejected, thrown, rejected-promise, malformed, and out-of-window adapter outcomes persist safely", async () => {
  const adapters: Array<{ adapter: FakeSendAdapter; status: "rejected" | "downstream_failure" }> = [
    {
      adapter: {
        execute: async () => ({
          ok: false,
          status: "rejected",
          error: makeFakeSendFailure("rejected"),
        }),
      },
      status: "rejected",
    },
    {
      adapter: {
        execute: async () => {
          throw new Error("sensitive throw");
        },
      },
      status: "downstream_failure",
    },
    {
      adapter: { execute: async () => Promise.reject("sensitive rejection") },
      status: "downstream_failure",
    },
    {
      adapter: { execute: async () => ({ ok: true, status: "accepted", raw: DRAFT }) as never },
      status: "downstream_failure",
    },
    {
      adapter: acceptedAdapter({ acceptedAt: "2026-08-04T12:00:02.000Z" }).adapter,
      status: "downstream_failure",
    },
  ];

  for (const fixture of adapters) {
    const { resultPath } = paths();
    const events = new MemoryEventStore();
    const outcome = await service(resultPath, events, fixture.adapter).execute(request());
    assert.equal(outcome.ok, false);
    if (outcome.ok || outcome.kind !== "executed") assert.fail("Expected terminal failure result");
    assert.equal(outcome.value.status, fixture.status);
    assert.equal(outcome.error.code, fixture.status);
    assert.doesNotMatch(JSON.stringify(outcome), /sensitive/);
    assert.equal(lineCount(resultPath), 2);
  }
});

test("timeout aborts once, persists terminal timeout, and ignores late acceptance", async () => {
  const { resultPath } = paths();
  const events = new MemoryEventStore();
  let resolveAdapter:
    | ((value: Awaited<ReturnType<FakeSendAdapter["execute"]>>) => void)
    | undefined;
  let observedSignal: AbortSignal | undefined;
  let calls = 0;
  const adapter: FakeSendAdapter = {
    execute: (_command, signal) => {
      calls += 1;
      observedSignal = signal;
      return new Promise((resolve) => {
        resolveAdapter = resolve;
      });
    },
  };

  const outcome = await service(resultPath, events, adapter, {
    timeoutMs: 5,
    nowMs: Date.now,
  }).execute(request());
  assert.equal(outcome.ok, false);
  if (outcome.ok || outcome.kind !== "executed") assert.fail("Expected timeout result");
  assert.equal(outcome.value.status, "timed_out");
  assert.equal(outcome.error.code, "timed_out");
  assert.equal(observedSignal?.aborted, true);
  assert.equal(calls, 1);
  assert.equal(lineCount(resultPath), 2);
  assert.deepEqual(
    events.events.map((event) => event.type),
    ["fake_send.attempted", "fake_send.timed_out"],
  );

  resolveAdapter?.({
    ok: true,
    status: "accepted",
    receiptId: "fake_receipt_service_late",
    acceptedAt: new Date().toISOString(),
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.equal(lineCount(resultPath), 2);
  assert.deepEqual(
    events.events.map((event) => event.type),
    ["fake_send.attempted", "fake_send.timed_out"],
  );
});

test("claim failure and malformed result store outcomes deny the adapter", async () => {
  const cases: FakeSendResultStore[] = [
    {
      claim: () => ({ ok: false, kind: "failure", error: makeFakeSendFailure("storage_failure") }),
      complete: () => ({ ok: false, error: makeFakeSendFailure("storage_failure") }),
      get: () => ({ ok: true, value: null }),
    },
    {
      claim: () => ({ ok: true, kind: "claimed", value: { wrong: true } }) as never,
      complete: () => ({ ok: false, error: makeFakeSendFailure("storage_failure") }),
      get: () => ({ ok: true, value: null }),
    },
    {
      claim: () => {
        throw "sensitive claim";
      },
      complete: () => ({ ok: false, error: makeFakeSendFailure("storage_failure") }),
      get: () => ({ ok: true, value: null }),
    },
  ];

  for (const results of cases) {
    const events = new MemoryEventStore();
    const fake = acceptedAdapter();
    const outcome = await service(makePathOnly(), events, fake.adapter, { results }).execute(
      request(),
    );
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected claim failure");
    assert.equal(outcome.kind, "failure");
    assert.equal(outcome.error.code, "storage_failure");
    assert.equal(fake.calls(), 0);
  }
});

test("generated reservations, results, and event evidence are immutable at replaceable boundaries", async () => {
  let held: FakeSendReservation | undefined;
  const results: FakeSendResultStore = {
    claim: (value) => {
      assert.equal(Object.isFrozen(value), true);
      assert.equal(Object.isFrozen(value.target), true);
      assert.throws(() => {
        (value as { reservationId: string }).reservationId = "reservation_mutated_boundary";
      }, TypeError);
      assert.throws(() => {
        (value.target as { leadId: string }).leadId = "lead_mutated_boundary";
      }, TypeError);
      held = value;
      return { ok: true, kind: "claimed", value };
    },
    complete: (value) => {
      assert.equal(Object.isFrozen(value), true);
      assert.equal(Object.isFrozen(value.target), true);
      assert.equal(Object.isFrozen(value.compensation), true);
      assert.throws(() => {
        (value as { resultId: string }).resultId = "result_mutated_boundary";
      }, TypeError);
      assert.throws(() => {
        (value.compensation as { code: string }).code = "mutated_boundary";
      }, TypeError);
      assert.ok(held);
      return {
        ok: true,
        value: { state: "completed", reservation: held, result: value },
      };
    },
    get: () => ({ ok: true, value: null }),
  };
  const memory = new MemoryEventStore();
  const events: FakeSendEventStore = {
    append: (input) => {
      assert.equal(Object.isFrozen(input.data), true);
      assert.throws(() => {
        (input.data as { eventType: string }).eventType = "fake_send.storage_failed";
      }, TypeError);
      return memory.append(input);
    },
    readRun: (runId) => memory.readRun(runId),
  };
  const fake = acceptedAdapter();

  const outcome = await service(makePathOnly(), events, fake.adapter, { results }).execute(
    request(),
  );

  if (!outcome.ok) assert.fail(`Expected accepted execution, got ${outcome.error.code}`);
  assert.equal(outcome.kind, "executed");
  assert.equal(fake.calls(), 1);
  assert.deepEqual(
    memory.events.map((event) => event.type),
    ["fake_send.attempted", "fake_send.accepted"],
  );
});

function makePathOnly(): string {
  return paths().resultPath;
}

test("attempt-event failure leaves one reservation and invokes no adapter", async () => {
  const { resultPath } = paths();
  const failingEvents = new MemoryEventStore();
  failingEvents.failOnce.add("fake_send.attempted");
  const fake = acceptedAdapter();
  const first = await service(resultPath, failingEvents, fake.adapter).execute(request());
  assert.equal(first.ok, false);
  if (first.ok) assert.fail("Expected event storage failure");
  assert.equal(first.error.code, "storage_failure");
  assert.equal(fake.calls(), 0);
  assert.equal(lineCount(resultPath), 1);

  const retryEvents = new MemoryEventStore();
  const retry = await service(resultPath, retryEvents, fake.adapter).execute(request());
  assert.equal(retry.ok, false);
  if (retry.ok) assert.fail("Expected in-progress refusal");
  assert.equal(retry.kind, "in_progress");
  assert.equal(retry.error.code, "execution_in_progress");
  assert.equal(fake.calls(), 0);
  assert.equal(lineCount(resultPath), 1);
});

test("completion-store failure after effect stays indeterminate and never retries effect", async () => {
  const { resultPath } = paths();
  const durable = new FileFakeSendResultStore(resultPath);
  const results: FakeSendResultStore = {
    claim: (value) => durable.claim(value),
    complete: () => ({ ok: false, error: makeFakeSendFailure("storage_failure") }),
    get: (key) => durable.get(key),
  };
  const fake = acceptedAdapter();
  const first = await service(resultPath, new MemoryEventStore(), fake.adapter, {
    results,
  }).execute(request());
  assert.equal(first.ok, false);
  if (first.ok) assert.fail("Expected completion storage failure");
  assert.equal(first.error.code, "storage_failure");
  assert.equal(fake.calls(), 1);
  assert.equal(lineCount(resultPath), 1);

  const retry = await service(resultPath, new MemoryEventStore(), fake.adapter).execute(request());
  assert.equal(retry.ok, false);
  if (retry.ok) assert.fail("Expected indeterminate retry");
  assert.equal(retry.kind, "in_progress");
  assert.equal(fake.calls(), 1);
});

test("duplicate retry repairs missing terminal event before returning original", async () => {
  const { resultPath } = paths();
  const events = new MemoryEventStore();
  events.failOnce.add("fake_send.accepted");
  const firstFake = acceptedAdapter();
  const first = await service(resultPath, events, firstFake.adapter).execute(request());
  assert.equal(first.ok, false);
  if (first.ok) assert.fail("Expected terminal event storage failure");
  assert.equal(first.error.code, "storage_failure");
  assert.equal(lineCount(resultPath), 2);
  assert.deepEqual(
    events.events.map((event) => event.type),
    ["fake_send.attempted", "fake_send.storage_failed"],
  );

  const duplicateFake = acceptedAdapter();
  const duplicate = await service(resultPath, events, duplicateFake.adapter).execute(request());
  if (!duplicate.ok) assert.fail(`Expected recovered duplicate, got ${duplicate.error.code}`);
  assert.equal(duplicate.kind, "duplicate");
  assert.equal(firstFake.calls(), 1);
  assert.equal(duplicateFake.calls(), 0);
  assert.deepEqual(
    events.events.map((event) => event.type),
    [
      "fake_send.attempted",
      "fake_send.storage_failed",
      "fake_send.accepted",
      "fake_send.duplicate",
    ],
  );
});

test("duplicate retry fails closed when terminal evidence is duplicated", async () => {
  const { resultPath } = paths();
  const events = new MemoryEventStore();
  const firstFake = acceptedAdapter();
  const first = await service(resultPath, events, firstFake.adapter).execute(request());
  if (!first.ok) assert.fail(first.error.message);
  const accepted = events.events.find((event) => event.type === "fake_send.accepted");
  assert.ok(accepted);
  events.append({ runId: accepted.runId, type: accepted.type, data: accepted.data });

  const duplicateFake = acceptedAdapter();
  const duplicate = await service(resultPath, events, duplicateFake.adapter).execute(request());

  assert.equal(duplicate.ok, false);
  if (duplicate.ok) assert.fail("Expected duplicate terminal evidence failure");
  assert.equal(duplicate.kind, "failure");
  assert.equal(duplicate.error.code, "storage_failure");
  assert.equal(firstFake.calls(), 1);
  assert.equal(duplicateFake.calls(), 0);
  assert.equal(events.events.filter((event) => event.type === "fake_send.accepted").length, 2);
});

test("concurrent same-process calls claim once and invoke one adapter effect", async () => {
  const { resultPath } = paths();
  const events = new MemoryEventStore();
  let resolveAdapter:
    | ((value: Awaited<ReturnType<FakeSendAdapter["execute"]>>) => void)
    | undefined;
  let calls = 0;
  const adapter: FakeSendAdapter = {
    execute: () => {
      calls += 1;
      return new Promise((resolve) => {
        resolveAdapter = resolve;
      });
    },
  };
  const application = service(resultPath, events, adapter, { nowMs: Date.now });
  const firstPromise = application.execute(request());
  const second = await application.execute(request());
  assert.equal(second.ok, false);
  if (second.ok) assert.fail("Expected in-progress duplicate");
  assert.equal(second.kind, "in_progress");
  assert.equal(calls, 1);

  resolveAdapter?.({
    ok: true,
    status: "accepted",
    receiptId: "fake_receipt_service_concurrent",
    acceptedAt: new Date().toISOString(),
  });
  const first = await firstPromise;
  assert.equal(first.ok, true);
  assert.equal(calls, 1);
  assert.equal(lineCount(resultPath), 2);
});

test("malformed or throwing authorization and event reads stay typed", async () => {
  const fake = acceptedAdapter();
  for (const authorization of [
    { authorize: () => ({ ok: true, value: { wrong: true } }) },
    {
      authorize: () => {
        throw "sensitive authorization";
      },
    },
  ] as FakeSendAuthorizationBoundary[]) {
    const outcome = await service(makePathOnly(), new MemoryEventStore(), fake.adapter, {
      authorization,
    }).execute(request());
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected authorization boundary failure");
    assert.equal(outcome.error.code, "storage_failure");
  }

  const { resultPath } = paths();
  const persistedEvents = new MemoryEventStore();
  const first = await service(resultPath, persistedEvents, fake.adapter).execute(request());
  assert.equal(first.ok, true);
  const hostileEvents: FakeSendEventStore = {
    append: (input) => persistedEvents.append(input),
    readRun: () =>
      new Proxy([], {
        get: () => {
          throw new Error("hostile events");
        },
      }),
  };
  const duplicate = await service(resultPath, hostileEvents, fake.adapter).execute(request());
  assert.equal(duplicate.ok, false);
  if (duplicate.ok) assert.fail("Expected event read storage failure");
  assert.equal(duplicate.error.code, "storage_failure");
});

test("invalid configuration and metadata fail before claim or effect", async () => {
  const { resultPath } = paths();
  const fake = acceptedAdapter();
  assert.throws(
    () => service(resultPath, new MemoryEventStore(), fake.adapter, { timeoutMs: 0 }),
    /positive finite integer/,
  );
  assert.equal(fake.calls(), 0);

  for (const options of [
    { nowMs: () => Number.NaN },
    { makeReservationId: () => "invalid" },
    {
      makeReservationId: () => {
        throw new Error("sensitive ID");
      },
    },
  ]) {
    const outcome = await service(
      makePathOnly(),
      new MemoryEventStore(),
      fake.adapter,
      options,
    ).execute(request());
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected metadata failure");
    assert.equal(outcome.error.code, "storage_failure");
  }
  assert.equal(fake.calls(), 0);
});

test("deterministic fake adapter has no network dependency and stable receipt", async () => {
  const adapter = new DeterministicFakeSendAdapter(() => "2026-08-04T12:00:00.020Z");
  const authorized = authorizer().authorize(request());
  if (!authorized.ok) assert.fail(authorized.error.message);
  const outcome = await adapter.execute(authorized.value, new AbortController().signal);
  if (!outcome.ok) assert.fail(`Expected deterministic acceptance, got ${outcome.error.code}`);
  assert.equal(outcome.receiptId, `fake_receipt_${authorized.value.idempotencyKey.slice(0, 24)}`);
});
