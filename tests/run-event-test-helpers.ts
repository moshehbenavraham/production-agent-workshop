import assert from "node:assert/strict";
import {
  isRunEventAppendOutcome,
  isRunEventReadOutcome,
  type AgentEvent,
  type RunEventAppendOutcome,
} from "../src/run-event.js";

export function readRunEvents(
  store: { readRun(runId: unknown): unknown },
  runId: string,
): AgentEvent[] {
  const outcome: unknown = store.readRun(runId);
  assert.equal(isRunEventReadOutcome(outcome), true, "Expected closed run-event read outcome");
  if (!isRunEventReadOutcome(outcome)) assert.fail("Invalid run-event read outcome");
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

export function appendRunEvent(
  store: { append(input: unknown): unknown },
  input: unknown,
): Extract<RunEventAppendOutcome, { ok: true }>["value"] {
  const outcome: unknown = store.append(input);
  assert.equal(isRunEventAppendOutcome(outcome), true, "Expected closed run-event append outcome");
  if (!isRunEventAppendOutcome(outcome)) assert.fail("Invalid run-event append outcome");
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}
