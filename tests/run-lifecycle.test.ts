import assert from "node:assert/strict";
import test from "node:test";
import type { AgentEvent } from "../src/run-event.js";
import {
  DEFAULT_RUN_DEADLINE_MS,
  DEFAULT_RUN_MAX_STEPS,
  executeBoundedRun,
  isRunLifecycleOutcome,
  normalizePiLifecycleEvent,
  resolveRunBounds,
  runStepForEvent,
  shouldPersistPiLifecycleEvent,
  type BoundedRunSession,
  type RunTimerBoundary,
} from "../src/run-lifecycle.js";
import {
  createAgentEvent,
  makeRunEventFailure,
  type RunEventAppendOutcome,
  type RunEventReadOutcome,
} from "../src/run-event.js";

const runId = "run_lifecycle_001";
const leadId = "lead_ada";

class MemoryEventStore {
  readonly events: AgentEvent[] = [];
  failTypes = new Set<string>();
  #index = 0;
  #now = 0;

  append(input: unknown): RunEventAppendOutcome {
    const type = (input as { type?: unknown })?.type;
    if (typeof type === "string" && this.failTypes.has(type)) {
      return { ok: false, error: makeRunEventFailure("storage_failure") };
    }
    this.#index += 1;
    this.#now += 1;
    const outcome = createAgentEvent(input, {
      eventId: `event_lifecycle_${String(this.#index).padStart(3, "0")}`,
      at: new Date(this.#now).toISOString(),
      applicationVersion: "0.1.25",
    });
    if (outcome.ok) this.events.push(outcome.value);
    return outcome;
  }

  readRun(requestedRunId: unknown): RunEventReadOutcome {
    if (requestedRunId !== runId) {
      return { ok: false, error: makeRunEventFailure("invalid_input") };
    }
    return { ok: true, value: this.events.filter((event) => event.runId === requestedRunId) };
  }
}

class FakeTimers implements RunTimerBoundary {
  nowMs = 0;
  #index = 0;
  readonly scheduled = new Map<number, { at: number; callback: () => void }>();

  now = () => this.nowMs;

  schedule = (callback: () => void, delayMs: number): number => {
    this.#index += 1;
    this.scheduled.set(this.#index, { at: this.nowMs + delayMs, callback });
    return this.#index;
  };

  cancel = (handle: unknown): void => {
    if (typeof handle === "number") this.scheduled.delete(handle);
  };

  advance(milliseconds: number): void {
    this.nowMs += milliseconds;
    const due = [...this.scheduled.entries()]
      .filter(([, timer]) => timer.at <= this.nowMs)
      .sort((left, right) => left[1].at - right[1].at);
    for (const [id, timer] of due) {
      this.scheduled.delete(id);
      timer.callback();
    }
  }
}

class FakeSession implements BoundedRunSession {
  abortCount = 0;
  abortRejects = false;
  disposeCount = 0;
  unsubscribeCount = 0;
  listener: ((event: unknown) => void) | undefined;
  promptPromise: Promise<void>;
  resolvePrompt!: () => void;
  rejectPrompt!: (error: unknown) => void;

  constructor() {
    this.promptPromise = new Promise<void>((resolve, reject) => {
      this.resolvePrompt = resolve;
      this.rejectPrompt = reject;
    });
  }

  prompt(): Promise<void> {
    return this.promptPromise;
  }

  abort(): Promise<void> {
    this.abortCount += 1;
    return this.abortRejects ? Promise.reject(new Error("abort failed")) : Promise.resolve();
  }

  subscribe(listener: (event: unknown) => void): () => void {
    this.listener = listener;
    return () => {
      this.unsubscribeCount += 1;
      this.listener = undefined;
    };
  }

  dispose(): void {
    this.disposeCount += 1;
  }

  emit(event: unknown): void {
    this.listener?.(event);
  }
}

function appendStart(store: MemoryEventStore): void {
  const outcome = store.append({
    runId,
    type: "run.started",
    data: { eventType: "run.started", leadId },
    metadata: { action: "run_start", result: "attempted" },
  });
  if (!outcome.ok) assert.fail(outcome.error.message);
}

function flush(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve));
}

function startRun(store: MemoryEventStore, session: FakeSession, timers: FakeTimers, maxSteps = 4) {
  appendStart(store);
  return executeBoundedRun({
    runId,
    prompt: "bounded synthetic prompt",
    bounds: { deadlineMs: 100, maxSteps },
    createSession: async () => session,
    complete: async () => ({
      value: { answer: "application-owned" },
      stopReason: "approval_pending" as const,
    }),
    eventStore: store,
    timer: timers,
  });
}

test("run bounds resolve closed defaults and explicit bounded integers", () => {
  assert.deepEqual(resolveRunBounds({}), {
    deadlineMs: DEFAULT_RUN_DEADLINE_MS,
    maxSteps: DEFAULT_RUN_MAX_STEPS,
  });
  assert.deepEqual(resolveRunBounds({ RUN_DEADLINE_MS: "2500", RUN_MAX_STEPS: "9" }), {
    deadlineMs: 2500,
    maxSteps: 9,
  });
  assert.equal(Object.isFrozen(resolveRunBounds({})), true);

  for (const environment of [
    { RUN_DEADLINE_MS: "" },
    { RUN_DEADLINE_MS: "0" },
    { RUN_DEADLINE_MS: "1.5" },
    { RUN_DEADLINE_MS: "300001" },
    { RUN_MAX_STEPS: "0" },
    { RUN_MAX_STEPS: "101" },
    { RUN_MAX_STEPS: "no" },
  ]) {
    assert.throws(() => resolveRunBounds(environment), /Run bounds are invalid\./);
  }
});

test("only model-turn and tool-start events consume one run step", () => {
  assert.equal(runStepForEvent({ type: "turn_start" }), true);
  assert.equal(runStepForEvent({ type: "tool_execution_start" }), true);
  for (const type of [
    "agent_start",
    "message_start",
    "message_update",
    "message_end",
    "tool_execution_update",
    "tool_execution_end",
    "turn_end",
    "auto_retry_start",
    "agent_end",
    "agent_settled",
  ]) {
    assert.equal(runStepForEvent({ type }), false, type);
  }
  assert.equal(runStepForEvent(null), false);
  assert.equal(runStepForEvent({ type: "TURN_START" }), false);
  assert.equal(shouldPersistPiLifecycleEvent({ type: "turn_start" }), true);
  assert.equal(shouldPersistPiLifecycleEvent({ type: "tool_execution_end" }), true);
  assert.equal(shouldPersistPiLifecycleEvent({ type: "message_update" }), false);
  assert.equal(shouldPersistPiLifecycleEvent({ type: "tool_execution_update" }), false);
  assert.equal(shouldPersistPiLifecycleEvent({ type: "queue_update" }), false);
  assert.equal(shouldPersistPiLifecycleEvent(null), false);
});

test("Pi normalization records application tool refusals and available usage without payloads", () => {
  const normalized = normalizePiLifecycleEvent({
    type: "tool_execution_end",
    toolName: "request_send_approval",
    toolCallId: "tool_call_refused_001",
    isError: false,
    result: {
      content: [{ type: "text", text: "raw refusal text" }],
      details: { created: false, code: "permission_denied" },
    },
    message: {
      id: "message_refused_001",
      model: { id: "model-test-1" },
      usage: { input: 3, output: 2, total: 5, cost: { total: 0.01 } },
    },
    attempt: 2,
  });

  assert.deepEqual(normalized, {
    data: {
      eventType: "pi.lifecycle",
      sourceType: "tool_execution_end",
      toolName: "request_send_approval",
      toolCallId: "tool_call_refused_001",
      isError: true,
      messageId: "message_refused_001",
      stopReason: null,
    },
    modelVersion: "model-test-1",
    errorCode: "permission_denied",
    retryCount: 2,
    tokens: { input: 3, output: 2, total: 5 },
    costUsd: 0.01,
  });
  assert.equal(JSON.stringify(normalized).includes("raw refusal text"), false);
});

test("Pi normalization canonicalizes malformed and alternate provider metadata", () => {
  assert.deepEqual(normalizePiLifecycleEvent(null), {
    data: {
      eventType: "pi.lifecycle",
      sourceType: "unknown",
      toolName: null,
      toolCallId: null,
      isError: null,
      messageId: null,
      stopReason: null,
    },
    modelVersion: null,
    errorCode: null,
    retryCount: 0,
    tokens: null,
    costUsd: null,
  });
  const alternate = normalizePiLifecycleEvent({
    type: "message_end",
    modelVersion: "model-alt-2",
    isError: true,
    usage: { inputTokens: 4, outputTokens: 6, totalTokens: 10, costUsd: 0 },
    stopReason: "finished",
  });
  assert.equal(alternate.modelVersion, "model-alt-2");
  assert.equal(alternate.errorCode, "pi_event_error");
  assert.deepEqual(alternate.tokens, { input: 4, output: 6, total: 10 });
  assert.equal(alternate.costUsd, 0);

  const providerToolCall = normalizePiLifecycleEvent({
    type: "tool_execution_start",
    toolName: "qualify_lead",
    toolCallId: "fc_workshop|call_workshop",
  });
  assert.equal(providerToolCall.data.toolCallId, "fc_workshop|call_workshop");

  const invalid = normalizePiLifecycleEvent({
    type: "NOT_VALID",
    toolName: "Invalid Tool",
    toolCallId: "bad id",
    attempt: -1,
    usage: { input: 2, output: 3, total: 4, costUsd: -1 },
  });
  assert.equal(invalid.data.sourceType, "unknown");
  assert.equal(invalid.data.toolName, null);
  assert.equal(invalid.data.toolCallId, null);
  assert.equal(invalid.retryCount, 0);
  assert.equal(invalid.tokens, null);
  assert.equal(invalid.costUsd, null);

  const hostile = new Proxy(
    {},
    {
      get() {
        throw new Error("hostile getter");
      },
    },
  );
  assert.equal(normalizePiLifecycleEvent(hostile).data.sourceType, "unknown");
});

test("normal completion records correlated tool evidence and one completed terminal", async () => {
  const store = new MemoryEventStore();
  const session = new FakeSession();
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers);
  await flush();

  session.emit({
    type: "message_update",
    message: { id: "message_streaming_001", content: "raw token" },
  });
  session.emit({
    type: "tool_execution_update",
    toolName: "qualify_lead",
    toolCallId: "tool_call_streaming_001",
    partialResult: { raw: "partial" },
  });
  session.emit({ type: "turn_start", turnIndex: 0, timestamp: 0 });
  session.emit({
    type: "tool_execution_start",
    toolName: "qualify_lead",
    toolCallId: "tool_call_lifecycle_001",
    args: { raw: "must-not-persist" },
  });
  timers.advance(7);
  session.emit({
    type: "tool_execution_end",
    toolName: "qualify_lead",
    toolCallId: "tool_call_lifecycle_001",
    result: { secret: "must-not-persist" },
    isError: false,
  });
  session.resolvePrompt();

  const outcome = await execution;
  assert.equal(outcome.ok, true);
  assert.equal(isRunLifecycleOutcome(outcome), true);
  if (!outcome.ok) assert.fail("Expected completed lifecycle");
  assert.deepEqual(outcome.value, { answer: "application-owned" });
  assert.equal(outcome.stopReason, "approval_pending");
  assert.equal(outcome.stepCount, 2);
  assert.equal(Object.isFrozen(outcome), true);
  assert.equal(session.abortCount, 0);
  assert.equal(session.unsubscribeCount, 1);
  assert.equal(session.disposeCount, 1);
  assert.equal(timers.scheduled.size, 0);

  const pi = store.events.filter((event) => event.type === "pi.lifecycle");
  assert.deepEqual(
    pi.map((event) => {
      if (event.data.eventType !== "pi.lifecycle") assert.fail("Expected Pi lifecycle event");
      return [event.data.sourceType, event.metadata.stepNumber];
    }),
    [
      ["turn_start", 1],
      ["tool_execution_start", 2],
      ["tool_execution_end", 2],
    ],
  );
  assert.equal(pi[2]?.metadata.durationMs, 7);
  assert.equal(JSON.stringify(pi).includes("must-not-persist"), false);
  assert.equal(store.events.filter((event) => event.type === "run.completed").length, 1);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 0);
});

test("deadline aborts and persists once while late prompt settlement is ignored", async () => {
  const store = new MemoryEventStore();
  const session = new FakeSession();
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers);
  await flush();

  session.emit({ type: "turn_start", turnIndex: 0, timestamp: 0 });
  timers.advance(100);
  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected bounded stop");
  assert.equal(outcome.stopReason, "deadline_exceeded");
  assert.equal(outcome.storageFailure, false);
  assert.equal(session.abortCount, 1);
  assert.equal(session.disposeCount, 1);
  const countAtReturn = store.events.length;

  session.resolvePrompt();
  session.emit({ type: "agent_end", messages: [] });
  await flush();
  assert.equal(store.events.length, countAtReturn);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
  assert.equal(store.events.filter((event) => event.type === "run.completed").length, 0);
});

test("reaching the step limit closes an open tool with one synthetic stopped outcome", async () => {
  const store = new MemoryEventStore();
  const session = new FakeSession();
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers, 2);
  await flush();

  session.emit({ type: "turn_start", turnIndex: 0, timestamp: 0 });
  session.emit({
    type: "tool_execution_start",
    toolName: "draft_follow_up",
    toolCallId: "tool_call_lifecycle_open",
    args: {},
  });
  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected step stop");
  assert.equal(outcome.stopReason, "step_limit_exceeded");
  assert.equal(outcome.stepCount, 2);
  assert.equal(session.abortCount, 1);

  const toolEvents = store.events.filter((event) => {
    return (
      event.data.eventType === "pi.lifecycle" &&
      event.data.toolCallId === "tool_call_lifecycle_open"
    );
  });
  assert.deepEqual(
    toolEvents.map((event) => {
      if (event.data.eventType !== "pi.lifecycle") assert.fail("Expected Pi lifecycle event");
      return [event.data.sourceType, event.data.stopReason];
    }),
    [
      ["tool_execution_start", null],
      ["tool_execution_end", "step_limit_exceeded"],
    ],
  );
  assert.equal(toolEvents[1]?.metadata.errorCode, "step_limit_exceeded");
});

test("prompt dependency failure is structured and cannot become completion", async () => {
  const store = new MemoryEventStore();
  const session = new FakeSession();
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers);
  await flush();
  session.rejectPrompt(new Error("credential secret must not escape"));

  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected dependency stop");
  assert.equal(outcome.stopReason, "dependency_failed");
  assert.equal(outcome.storageFailure, false);
  assert.equal(JSON.stringify(store.events).includes("credential secret"), false);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
});

test("terminal storage failure aborts and returns no manufactured stopped success", async () => {
  const store = new MemoryEventStore();
  store.failTypes.add("run.stopped");
  const session = new FakeSession();
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers);
  await flush();
  timers.advance(100);

  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected storage failure");
  assert.equal(outcome.stopReason, "dependency_failed");
  assert.equal(outcome.storageFailure, true);
  assert.equal(isRunLifecycleOutcome(outcome), true);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 0);
  assert.equal(session.abortCount, 1);
});

test("a deadline before session creation returns first and aborts a late session once", async () => {
  const store = new MemoryEventStore();
  appendStart(store);
  const timers = new FakeTimers();
  const session = new FakeSession();
  let resolveSession!: (value: FakeSession) => void;
  const sessionPromise = new Promise<FakeSession>((resolve) => {
    resolveSession = resolve;
  });
  const execution = executeBoundedRun({
    runId,
    prompt: "bounded synthetic prompt",
    bounds: { deadlineMs: 100, maxSteps: 4 },
    createSession: () => sessionPromise,
    complete: async () => ({ value: true, stopReason: "completed" }),
    eventStore: store,
    timer: timers,
  });

  timers.advance(100);
  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected deadline stop");
  assert.equal(outcome.stopReason, "deadline_exceeded");
  assert.equal(session.abortCount, 0);

  resolveSession(session);
  await flush();
  assert.equal(session.abortCount, 1);
  assert.equal(session.disposeCount, 1);
  assert.equal(session.listener, undefined);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
});

test("invalid lifecycle input fails before creating a session or scheduling a timer", () => {
  let created = 0;
  let scheduled = 0;
  const store = new MemoryEventStore();
  const timer: RunTimerBoundary = {
    now: () => 0,
    schedule: () => {
      scheduled += 1;
      return 1;
    },
    cancel: () => undefined,
  };
  assert.throws(
    () =>
      executeBoundedRun({
        runId,
        prompt: "bounded synthetic prompt",
        bounds: { deadlineMs: 0, maxSteps: 4 },
        createSession: async () => {
          created += 1;
          return new FakeSession();
        },
        complete: async () => ({ value: true, stopReason: "completed" }),
        eventStore: store,
        timer,
      } as never),
    /Run lifecycle input is invalid\./,
  );
  assert.equal(created, 0);
  assert.equal(scheduled, 0);
  assert.equal(store.events.length, 0);
  assert.equal(
    isRunLifecycleOutcome({
      ok: false,
      stopReason: "deadline_exceeded",
      storageFailure: true,
      stepCount: 0,
      durationMs: 0,
    }),
    false,
  );
});

test("hostile bounds, outcomes, and step inputs fail closed", () => {
  assert.throws(() => resolveRunBounds(null), /Run bounds are invalid\./);
  assert.throws(
    () =>
      resolveRunBounds(
        new Proxy(
          {},
          {
            get() {
              throw new Error("hostile environment");
            },
          },
        ),
      ),
    /Run bounds are invalid\./,
  );
  assert.equal(
    runStepForEvent(
      new Proxy(
        {},
        {
          get() {
            throw new Error("hostile event");
          },
        },
      ),
    ),
    false,
  );
  assert.equal(isRunLifecycleOutcome(null), false);
  assert.equal(
    isRunLifecycleOutcome({
      ok: false,
      stopReason: "deadline_exceeded",
      storageFailure: false,
      stepCount: 0,
      durationMs: 0,
    }),
    true,
  );
  assert.equal(
    isRunLifecycleOutcome(
      new Proxy(
        {},
        {
          ownKeys() {
            throw new Error("hostile outcome");
          },
        },
      ),
    ),
    false,
  );
});

test("invalid lifecycle boundary variants fail before any scheduled work", () => {
  const store = new MemoryEventStore();
  const valid = {
    runId,
    prompt: "bounded prompt",
    bounds: { deadlineMs: 100, maxSteps: 2 },
    createSession: async () => new FakeSession(),
    complete: async () => ({ value: true, stopReason: "completed" as const }),
    eventStore: store,
    timer: new FakeTimers(),
  };
  const invalid = [
    { ...valid, runId: "bad" },
    { ...valid, prompt: "" },
    { ...valid, prompt: "x".repeat(20_001) },
    { ...valid, createSession: null },
    { ...valid, complete: null },
    { ...valid, eventStore: null },
    { ...valid, timer: { now: null, schedule: () => 1, cancel: () => undefined } },
    { ...valid, timer: { now: () => 0, schedule: null, cancel: () => undefined } },
    { ...valid, timer: { now: () => 0, schedule: () => 1, cancel: null } },
    { ...valid, timer: { now: () => Number.NaN, schedule: () => 1, cancel: () => undefined } },
    {
      ...valid,
      timer: {
        now: () => {
          throw new Error("clock failed");
        },
        schedule: () => 1,
        cancel: () => undefined,
      },
    },
  ];
  for (const candidate of invalid) {
    assert.throws(() => executeBoundedRun(candidate as never), /Run lifecycle input is invalid\./);
  }
  assert.equal(store.events.length, 0);
});

test("lifecycle evidence failure aborts and cannot manufacture complete evidence", async () => {
  const store = new MemoryEventStore();
  store.failTypes.add("pi.lifecycle");
  const session = new FakeSession();
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers);
  await flush();

  session.emit({ type: "turn_start", turnIndex: 0, timestamp: 0 });
  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected evidence failure");
  assert.equal(outcome.storageFailure, true);
  assert.equal(outcome.stopReason, "dependency_failed");
  assert.equal(session.abortCount, 1);
  assert.equal(store.events.filter((event) => event.type === "run.completed").length, 0);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
});

test("an abort rejection cannot replace the first deadline result", async () => {
  const store = new MemoryEventStore();
  const session = new FakeSession();
  session.abortRejects = true;
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers);
  await flush();
  timers.advance(100);

  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected deadline stop");
  assert.equal(outcome.stopReason, "deadline_exceeded");
  assert.equal(outcome.storageFailure, false);
  assert.equal(session.abortCount, 1);
  assert.equal(session.disposeCount, 1);
  await flush();
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
});

test("prompt completion with an open tool becomes dependency failure and closes the call", async () => {
  const store = new MemoryEventStore();
  const session = new FakeSession();
  const timers = new FakeTimers();
  const execution = startRun(store, session, timers);
  await flush();
  session.emit({
    type: "tool_execution_start",
    toolName: "qualify_lead",
    toolCallId: "tool_call_unsettled_001",
    args: {},
  });
  session.resolvePrompt();

  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected dependency stop");
  assert.equal(outcome.stopReason, "dependency_failed");
  const correlated = store.events.filter(
    (event) =>
      event.data.eventType === "pi.lifecycle" &&
      event.data.toolCallId === "tool_call_unsettled_001",
  );
  assert.equal(correlated.length, 2);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
});

test("timer scheduling and session construction failures produce one dependency terminal", async () => {
  for (const mode of ["timer", "factory"] as const) {
    const store = new MemoryEventStore();
    appendStart(store);
    let created = 0;
    const timer: RunTimerBoundary = {
      now: () => 0,
      schedule: () => {
        if (mode === "timer") throw new Error("schedule failed");
        return 1;
      },
      cancel: () => undefined,
    };
    const outcome = await executeBoundedRun({
      runId,
      prompt: "bounded prompt",
      bounds: { deadlineMs: 100, maxSteps: 2 },
      createSession: async () => {
        created += 1;
        if (mode === "factory") throw new Error("factory failed");
        return new FakeSession();
      },
      complete: async () => ({ value: true, stopReason: "completed" }),
      eventStore: store,
      timer,
    });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected dependency stop");
    assert.equal(outcome.stopReason, "dependency_failed");
    assert.equal(created, mode === "timer" ? 0 : 1);
    assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
  }
});

test("synchronous deadline and hostile cleanup preserve the first terminal", async () => {
  const store = new MemoryEventStore();
  appendStart(store);
  let created = 0;
  let cancelled = 0;
  const timer: RunTimerBoundary = {
    now: () => 0,
    schedule: (callback) => {
      callback();
      return "sync_timer";
    },
    cancel: () => {
      cancelled += 1;
      throw new Error("cancel failed");
    },
  };
  const outcome = await executeBoundedRun({
    runId,
    prompt: "bounded prompt",
    bounds: { deadlineMs: 100, maxSteps: 2 },
    createSession: async () => {
      created += 1;
      return new FakeSession();
    },
    complete: async () => ({ value: true, stopReason: "completed" }),
    eventStore: store,
    timer,
  });
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected synchronous deadline stop");
  assert.equal(outcome.stopReason, "deadline_exceeded");
  assert.equal(created, 0);
  assert.equal(cancelled, 2);
  assert.equal(store.events.filter((event) => event.type === "run.stopped").length, 1);
});

test("throwing abort, unsubscribe, dispose, and timer cleanup stay best effort", async () => {
  const store = new MemoryEventStore();
  const timers = new FakeTimers();
  let listener: ((event: unknown) => void) | undefined;
  let aborts = 0;
  let disposals = 0;
  const session: BoundedRunSession = {
    prompt: () => new Promise<void>(() => undefined),
    abort: () => {
      aborts += 1;
      throw new Error("abort failed");
    },
    subscribe: (next) => {
      listener = next;
      return () => {
        listener = undefined;
        throw new Error("unsubscribe failed");
      };
    },
    dispose: () => {
      disposals += 1;
      throw new Error("dispose failed");
    },
  };
  appendStart(store);
  const execution = executeBoundedRun({
    runId,
    prompt: "bounded prompt",
    bounds: { deadlineMs: 100, maxSteps: 3 },
    createSession: async () => session,
    complete: async () => ({ value: true, stopReason: "completed" }),
    eventStore: store,
    timer: {
      now: timers.now,
      schedule: timers.schedule,
      cancel: (handle) => {
        timers.cancel(handle);
        throw new Error("cancel failed");
      },
    },
  });
  await flush();
  assert.equal(typeof listener, "function");
  timers.advance(100);
  const outcome = await execution;
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected deadline stop");
  assert.equal(outcome.stopReason, "deadline_exceeded");
  assert.equal(aborts, 1);
  assert.equal(disposals, 1);
  assert.equal(listener, undefined);
});

test("invalid completion contracts and uncloneable values become dependency stops", async () => {
  for (const completion of [
    { value: true, stopReason: "invented" },
    { value: () => undefined, stopReason: "completed" },
  ]) {
    const store = new MemoryEventStore();
    const session = new FakeSession();
    const timers = new FakeTimers();
    appendStart(store);
    const execution = executeBoundedRun({
      runId,
      prompt: "bounded prompt",
      bounds: { deadlineMs: 100, maxSteps: 3 },
      createSession: async () => session,
      complete: async () => completion as never,
      eventStore: store,
      timer: timers,
    });
    await flush();
    session.resolvePrompt();
    const outcome = await execution;
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected dependency stop");
    assert.equal(outcome.stopReason, "dependency_failed");
  }
});

test("completed and domain-stopped terminal metadata remain distinct", async () => {
  for (const stopReason of ["completed", "approval_failed"] as const) {
    const store = new MemoryEventStore();
    const session = new FakeSession();
    const timers = new FakeTimers();
    appendStart(store);
    const execution = executeBoundedRun({
      runId,
      prompt: "bounded prompt",
      bounds: { deadlineMs: 100, maxSteps: 3 },
      createSession: async () => session,
      complete: async () => ({ value: stopReason, stopReason }),
      eventStore: store,
      timer: timers,
    });
    await flush();
    session.resolvePrompt();
    const outcome = await execution;
    assert.equal(outcome.ok, true);
    const terminal = store.events.at(-1);
    assert.equal(terminal?.type, "run.completed");
    assert.equal(terminal?.metadata.result, stopReason === "completed" ? "succeeded" : "stopped");
    assert.equal(terminal?.metadata.stepNumber, null);
  }
});
