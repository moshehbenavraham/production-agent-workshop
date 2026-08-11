import assert from "node:assert/strict";
import {
  appendFileSync,
  chmodSync,
  closeSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { APPLICATION_VERSION, JsonlEventStore, isRunEventStore } from "../src/event-store.js";
import { makeRunEventFailure } from "../src/run-event.js";

const at = "2026-08-11T16:00:00.000Z";
const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryDirectory(prefix: string): string {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  temporaryDirectories.push(directory);
  return directory;
}

function started(runId: string, leadId = "lead_ada") {
  return {
    runId,
    type: "run.started" as const,
    data: { eventType: "run.started" as const, leadId },
  };
}

test("event store appends and filters by run", () => {
  const directory = temporaryDirectory("agent-events-");
  let eventId = 0;
  const store = new JsonlEventStore(join(directory, "events.jsonl"), {
    makeEventId: () => `event_store_${String(++eventId).padStart(3, "0")}`,
    now: () => at,
  });

  assert.equal(store.append(started("run_alpha")).ok, true);
  assert.equal(store.append(started("run_beta", "lead_grace")).ok, true);
  assert.equal(
    store.append({
      runId: "run_alpha",
      type: "run.completed",
      data: { eventType: "run.completed", stopReason: "approval_pending" },
    }).ok,
    true,
  );

  const outcome = store.readRun("run_alpha");
  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.value.length, 2);
  assert.deepEqual(
    outcome.value.map((event) => event.type),
    ["run.started", "run.completed"],
  );
  assert.equal(outcome.value[1]?.data.eventType, "run.completed");
  assert.equal(outcome.value[0]?.metadata.applicationVersion, APPLICATION_VERSION);
  const packageMetadata: unknown = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(typeof packageMetadata === "object" && packageMetadata !== null, true);
  if (typeof packageMetadata !== "object" || packageMetadata === null) {
    assert.fail("Expected package metadata");
  }
  assert.equal("version" in packageMetadata && packageMetadata.version, APPLICATION_VERSION);
  assert.equal(statSync(join(directory, "events.jsonl")).mode & 0o777, 0o600);
  assert.equal(readFileSync(join(directory, "events.jsonl"), "utf8").endsWith("\n"), true);
});

test("new store instance rebuilds exact durable events", () => {
  const directory = temporaryDirectory("agent-events-restart-");
  const path = join(directory, "events.jsonl");
  const first = new JsonlEventStore(path, {
    makeEventId: () => "event_restart_001",
    now: () => at,
    applicationVersion: "0.1.22",
  });
  const appended = first.append(started("run_restart"));
  if (!appended.ok) assert.fail(appended.error.message);

  const second = new JsonlEventStore(path, { applicationVersion: "0.1.22" });
  assert.deepEqual(second.readRun("run_restart"), { ok: true, value: [appended.value] });
});

test("missing file is empty while blank, truncated, malformed, and corrupt files fail closed", () => {
  const directory = temporaryDirectory("agent-events-damaged-");
  const path = join(directory, "events.jsonl");
  const store = new JsonlEventStore(path, { applicationVersion: "0.1.22" });
  assert.deepEqual(store.readRun("run_damage"), { ok: true, value: [] });

  const cases = [
    { content: "\n", code: "corrupt_record" },
    { content: '{"schemaVersion":1}', code: "interrupted_write" },
    { content: "not-json\n", code: "corrupt_record" },
    { content: '{"schemaVersion":1}\n', code: "corrupt_record" },
  ] as const;
  for (const damage of cases) {
    writeFileSync(path, damage.content, "utf8");
    assert.deepEqual(store.readRun("run_damage"), {
      ok: false,
      error: makeRunEventFailure(damage.code),
    });
  }
});

test("complete-file validation rejects duplicate IDs and decreasing run timestamps", () => {
  const directory = temporaryDirectory("agent-events-order-");
  const path = join(directory, "events.jsonl");
  let nextId = 0;
  let now = "2026-08-11T16:00:01.000Z";
  const store = new JsonlEventStore(path, {
    makeEventId: () => `event_order_${++nextId}`,
    now: () => now,
    applicationVersion: "0.1.22",
  });
  const first = store.append(started("run_order"));
  if (!first.ok) assert.fail(first.error.message);
  appendFileSync(path, `${JSON.stringify(first.value)}\n`, "utf8");
  assert.deepEqual(store.readRun("run_order"), {
    ok: false,
    error: makeRunEventFailure("duplicate_event"),
  });

  writeFileSync(path, `${JSON.stringify(first.value)}\n`, "utf8");
  now = "2026-08-11T16:00:00.000Z";
  assert.deepEqual(store.append(started("run_order")), {
    ok: false,
    error: makeRunEventFailure("out_of_order_record"),
  });
});

test("invalid input and generated metadata fail before filesystem construction", () => {
  const directory = temporaryDirectory("agent-events-preflight-");
  const path = join(directory, "nested", "events.jsonl");
  const invalid = new JsonlEventStore(path, {
    makeEventId: () => "bad",
    now: () => at,
    applicationVersion: "0.1.22",
  });
  assert.deepEqual(invalid.append(started("run_preflight")), {
    ok: false,
    error: makeRunEventFailure("storage_failure"),
  });
  assert.throws(() => statSync(join(directory, "nested")), { code: "ENOENT" });
});

test("hostile dependency values remain canonical at public store boundaries", () => {
  const hostile = new Proxy(
    {},
    {
      has() {
        throw "sensitive hostile boundary";
      },
    },
  );
  assert.equal(isRunEventStore(hostile), false);

  const directory = temporaryDirectory("agent-events-hostile-");
  const store = new JsonlEventStore(join(directory, "events.jsonl"), {
    applicationVersion: "0.1.22",
    operations: {
      readText: () => {
        throw hostile;
      },
    },
  });
  assert.deepEqual(store.readRun("run_hostile"), {
    ok: false,
    error: makeRunEventFailure("storage_failure"),
  });
});

test("write, sync, close, and re-read failures remain typed and never expose raw detail", () => {
  const directory = temporaryDirectory("agent-events-io-");
  const operations = ["write", "sync", "close", "read"] as const;

  for (const operation of operations) {
    const path = join(directory, `${operation}.jsonl`);
    let reads = 0;
    const operationOverrides =
      operation === "write"
        ? {
            writeRecord: () => {
              throw new Error("sensitive write failure");
            },
          }
        : operation === "sync"
          ? {
              syncFile: () => {
                throw new Error("sensitive sync failure");
              },
            }
          : operation === "close"
            ? {
                closeFile: (descriptor: number) => {
                  closeSync(descriptor);
                  throw new Error("sensitive close failure");
                },
              }
            : {
                readText: (target: string) => {
                  reads += 1;
                  if (reads > 1) throw new Error("sensitive read failure");
                  return readFileSync(target, "utf8");
                },
              };
    const store = new JsonlEventStore(path, {
      makeEventId: () => `event_io_${operation}`,
      now: () => at,
      applicationVersion: "0.1.22",
      operations: operationOverrides,
    });
    const outcome = store.append(started(`run_io_${operation}`));
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected injected I/O failure");
    assert.equal(outcome.error.code, "interrupted_write");
    assert.equal(outcome.error.message.includes(path), false);
    assert.equal(outcome.error.message.includes("sensitive"), false);
  }
});

test("existing broad file mode is tightened and no-op writes cannot manufacture success", () => {
  const directory = temporaryDirectory("agent-events-mode-");
  const path = join(directory, "events.jsonl");
  writeFileSync(path, "", { encoding: "utf8", mode: 0o666 });
  chmodSync(path, 0o666);
  const store = new JsonlEventStore(path, {
    makeEventId: () => "event_mode_001",
    now: () => at,
    applicationVersion: "0.1.22",
  });
  assert.equal(store.append(started("run_mode")).ok, true);
  assert.equal(statSync(path).mode & 0o777, 0o600);

  const noOp = new JsonlEventStore(join(directory, "noop.jsonl"), {
    makeEventId: () => "event_noop_001",
    now: () => at,
    applicationVersion: "0.1.22",
    operations: { writeRecord: () => undefined },
  });
  assert.deepEqual(noOp.append(started("run_noop")), {
    ok: false,
    error: makeRunEventFailure("interrupted_write"),
  });
});
