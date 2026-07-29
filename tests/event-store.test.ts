import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { JsonlEventStore } from "../src/event-store.js";

test("event store appends and filters by run", () => {
  const directory = mkdtempSync(join(tmpdir(), "agent-events-"));
  const store = new JsonlEventStore(join(directory, "events.jsonl"));

  store.append({ runId: "run_a", type: "started", data: {} });
  store.append({ runId: "run_b", type: "started", data: {} });
  store.append({ runId: "run_a", type: "completed", data: { safe: true } });

  const events = store.readRun("run_a");
  assert.equal(events.length, 2);
  assert.deepEqual(
    events.map((event) => event.type),
    ["started", "completed"],
  );
  assert.equal(events[1]?.data.safe, true);
});
