import assert from "node:assert/strict";
import test from "node:test";
import {
  OBSERVATION_SCHEMA_VERSION,
  collectServiceObservation,
  createObservation,
  isMeasurement,
  isObservation,
  isServiceCollectorOptions,
  isTokenUsage,
  makeAvailableMeasurement,
  makeNotApplicableMeasurement,
  makeUnavailableMeasurement,
} from "../src/observability.js";

const common = {
  schemaVersion: OBSERVATION_SCHEMA_VERSION,
  at: "2026-08-12T01:00:00.000Z",
  environment: "test" as const,
  applicationVersion: "0.1.31",
};

const unavailable = makeUnavailableMeasurement("not_reported");
const notApplicable = makeNotApplicableMeasurement("not_configured");

function serviceObservation() {
  return {
    ...common,
    layer: "service" as const,
    kind: "service.snapshot" as const,
    uptime: makeAvailableMeasurement(1_000, "milliseconds"),
    memoryRss: makeAvailableMeasurement(100, "bytes"),
    memoryHeapUsed: makeAvailableMeasurement(50, "bytes"),
    cpuUser: makeAvailableMeasurement(25, "microseconds"),
    cpuSystem: makeAvailableMeasurement(10, "microseconds"),
    storageUsed: unavailable,
    storageCapacity: unavailable,
    queueDepth: notApplicable,
    dependencies: [
      {
        id: "provider",
        state: "healthy" as const,
        duration: makeAvailableMeasurement(2, "milliseconds"),
        errorCategory: null,
      },
    ],
  };
}

function runObservation() {
  return {
    ...common,
    layer: "run" as const,
    kind: "run.lifecycle" as const,
    runId: "run_observation_001",
    outcome: "stopped" as const,
    stopReason: "deadline_exceeded" as const,
    duration: makeAvailableMeasurement(100, "milliseconds"),
    stepCount: makeAvailableMeasurement(2, "count"),
    retryCount: 0,
    errorCategory: "timeout" as const,
  };
}

function modelObservation() {
  return {
    ...common,
    layer: "model" as const,
    kind: "model.call" as const,
    runId: "run_observation_001",
    stepNumber: 1,
    modelVersion: "model-test-1",
    promptVersion: "prompt-v1",
    outcome: "failed" as const,
    duration: makeAvailableMeasurement(100, "milliseconds"),
    retryCount: 1,
    tokens: {
      status: "available" as const,
      input: 3,
      output: 2,
      total: 5,
    },
    cost: makeAvailableMeasurement(0.01, "usd"),
    errorCategory: "invalid_response" as const,
  };
}

function toolObservation() {
  return {
    ...common,
    layer: "tool" as const,
    kind: "tool.call" as const,
    runId: "run_observation_001",
    stepNumber: 2,
    toolName: "request_send_approval",
    callId: "tool_call_observation_001",
    outcome: "denied" as const,
    permissionDecision: "approval_required" as const,
    sideEffect: "none" as const,
    duration: makeAvailableMeasurement(1, "milliseconds"),
    retryCount: 0,
    errorCategory: "permission_denied" as const,
  };
}

test("four observation layers are closed, correlated, and immutable", () => {
  const variants = [serviceObservation(), runObservation(), modelObservation(), toolObservation()];

  for (const variant of variants) {
    assert.equal(isObservation(variant), true);
    const outcome = createObservation(variant);
    assert.equal(outcome.ok, true);
    if (!outcome.ok) continue;
    assert.equal(Object.isFrozen(outcome.value), true);
    const nested =
      outcome.value.layer === "service" ? outcome.value.dependencies : outcome.value.duration;
    assert.equal(Object.isFrozen(nested), true);
  }
});

test("observation contract rejects extras and mismatched discriminants", () => {
  assert.equal(isObservation({ ...serviceObservation(), secret: "no" }), false);
  assert.equal(isObservation({ ...serviceObservation(), layer: "run" }), false);
  assert.equal(isObservation({ ...runObservation(), kind: "model.call" }), false);
  assert.equal(isObservation({ ...modelObservation(), layer: "tool" }), false);
  assert.equal(isObservation({ ...toolObservation(), kind: "service.snapshot" }), false);
});

test("every run-scoped layer requires the exact validated run identity", () => {
  for (const observation of [runObservation(), modelObservation(), toolObservation()]) {
    assert.equal(isObservation({ ...observation, runId: undefined }), false);
    assert.equal(isObservation({ ...observation, runId: "bad" }), false);
    assert.equal(isObservation({ ...observation, runId: "run_OBSERVATION" }), false);
  }
  assert.equal(isObservation({ ...serviceObservation(), runId: "run_observation_001" }), false);
});

test("tagged measurements preserve measured zero and explicit absence", () => {
  const measuredZero = makeAvailableMeasurement(0, "bytes");
  const missing = makeUnavailableMeasurement("collection_failed");
  const omitted = makeNotApplicableMeasurement("not_configured");

  assert.deepEqual(measuredZero, { status: "available", value: 0, unit: "bytes" });
  assert.deepEqual(missing, { status: "unavailable", reason: "collection_failed" });
  assert.deepEqual(omitted, { status: "not_applicable", reason: "not_configured" });
  assert.equal(isMeasurement(measuredZero), true);
  assert.equal(isMeasurement(missing), true);
  assert.equal(isMeasurement(omitted), true);
  assert.equal(Object.isFrozen(measuredZero), true);
  assert.equal(Object.isFrozen(missing), true);
  assert.equal(Object.isFrozen(omitted), true);
});

test("measurements reject impossible numbers, extras, units, and reasons", () => {
  for (const candidate of [
    { status: "available", value: -1, unit: "bytes" },
    { status: "available", value: Number.POSITIVE_INFINITY, unit: "bytes" },
    { status: "available", value: 1, unit: "seconds" },
    { status: "available", value: 1, unit: "bytes", path: "/private" },
    { status: "unavailable", reason: "raw provider failure" },
    { status: "unavailable", reason: "collection_failed", detail: "secret" },
    { status: "not_applicable", reason: "disabled" },
  ]) {
    assert.equal(isMeasurement(candidate), false);
  }
  assert.throws(() => makeAvailableMeasurement(-1, "bytes"), /Measurement is invalid\./);
});

test("token availability requires exact nonnegative totals", () => {
  assert.equal(isTokenUsage({ status: "available", input: 0, output: 0, total: 0 }), true);
  assert.equal(isTokenUsage({ status: "available", input: 3, output: 2, total: 4 }), false);
  assert.equal(isTokenUsage({ status: "available", input: -1, output: 1, total: 0 }), false);
  assert.equal(isTokenUsage({ status: "unavailable", reason: "not_reported" }), true);
  assert.equal(isTokenUsage({ status: "not_applicable", reason: "not_configured" }), true);
  assert.equal(isTokenUsage({ status: "unavailable", reason: "secret detail" }), false);
});

test("operational vocabularies reject unknown environment, result, permission, and effects", () => {
  assert.equal(isObservation({ ...serviceObservation(), environment: "customer-a" }), false);
  assert.equal(isObservation({ ...runObservation(), outcome: "maybe" }), false);
  assert.equal(
    isObservation({ ...modelObservation(), errorCategory: "provider said secret" }),
    false,
  );
  assert.equal(isObservation({ ...toolObservation(), permissionDecision: "admin" }), false);
  assert.equal(isObservation({ ...toolObservation(), sideEffect: "sent_email" }), false);
});

test("service collector preserves measured zero and deterministic dependency order", async () => {
  const outcome = await collectServiceObservation({
    environment: "test",
    applicationVersion: "0.1.31-test",
    now: () => common.at,
    processMetrics: {
      uptimeMs: () => 0,
      memoryBytes: () => ({ rss: 0, heapUsed: 0 }),
      cpuMicroseconds: () => ({ user: 0, system: 0 }),
    },
    storage: { id: "data", read: () => ({ usedBytes: 0, capacityBytes: 100 }) },
    queue: { id: "jobs", read: () => ({ depth: 0 }) },
    dependencies: [
      {
        id: "provider",
        timeoutMs: 100,
        check: async () => ({ state: "healthy", errorCategory: null }),
      },
      {
        id: "approval_store",
        timeoutMs: 100,
        check: () => ({ state: "degraded", errorCategory: "storage_failure" }),
      },
    ],
  });

  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.equal(outcome.value.uptime.status, "available");
  assert.equal(outcome.value.uptime.status === "available" && outcome.value.uptime.value, 0);
  assert.equal(outcome.value.storageUsed.status, "available");
  assert.equal(
    outcome.value.storageUsed.status === "available" && outcome.value.storageUsed.value,
    0,
  );
  assert.equal(outcome.value.queueDepth.status, "available");
  assert.equal(
    outcome.value.queueDepth.status === "available" && outcome.value.queueDepth.value,
    0,
  );
  assert.deepEqual(
    outcome.value.dependencies.map((dependency) => dependency.id),
    ["approval_store", "provider"],
  );
  assert.equal(Object.isFrozen(outcome), true);
  assert.equal(Object.isFrozen(outcome.value), true);
  assert.equal(Object.isFrozen(outcome.value.dependencies), true);
  assert.equal(Object.isFrozen(outcome.value.dependencies[0]), true);
});

test("service collector supports empty optional boundaries explicitly", async () => {
  const outcome = await collectServiceObservation({
    environment: "development",
    now: () => common.at,
    processMetrics: {
      uptimeMs: () => 1,
      memoryBytes: () => ({ rss: 2, heapUsed: 1 }),
      cpuMicroseconds: () => ({ user: 3, system: 4 }),
    },
  });

  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.value.storageUsed, notApplicable);
  assert.deepEqual(outcome.value.storageCapacity, notApplicable);
  assert.deepEqual(outcome.value.queueDepth, notApplicable);
  assert.deepEqual(outcome.value.dependencies, []);
});

test("collector validates and collects the maximum dependency count", async () => {
  const dependencies = Array.from({ length: 20 }, (_, index) => ({
    id: `dep_${String(index).padStart(2, "0")}`,
    timeoutMs: 100,
    check: () => ({ state: "healthy" as const, errorCategory: null }),
  }));
  const options = {
    environment: "staging" as const,
    now: () => common.at,
    processMetrics: {
      uptimeMs: () => 1,
      memoryBytes: () => ({ rss: 2, heapUsed: 1 }),
      cpuMicroseconds: () => ({ user: 3, system: 4 }),
    },
    dependencies,
  };

  assert.equal(isServiceCollectorOptions(options), true);
  const outcome = await collectServiceObservation(options);
  assert.equal(outcome.ok, true);
  if (outcome.ok) assert.equal(outcome.value.dependencies.length, 20);
  assert.equal(
    isServiceCollectorOptions({ ...options, dependencies: [...dependencies, dependencies[0]] }),
    false,
  );
});

test("invalid collector configuration fails before invoking any boundary", async () => {
  let calls = 0;
  const processMetrics = {
    uptimeMs: () => {
      calls += 1;
      return 1;
    },
    memoryBytes: () => ({ rss: 1, heapUsed: 1 }),
    cpuMicroseconds: () => ({ user: 1, system: 1 }),
  };
  for (const options of [
    { environment: "customer-a", processMetrics },
    { environment: "test", processMetrics, extra: true },
    {
      environment: "test",
      processMetrics,
      dependencies: [{ id: "provider", timeoutMs: 0, check: () => ({}) }],
    },
    {
      environment: "test",
      processMetrics,
      storage: { id: "provider", read: () => ({ usedBytes: 0, capacityBytes: 1 }) },
      dependencies: [
        {
          id: "provider",
          timeoutMs: 10,
          check: () => ({ state: "healthy", errorCategory: null }),
        },
      ],
    },
  ]) {
    const outcome = await collectServiceObservation(options);
    assert.deepEqual(outcome, {
      ok: false,
      error: {
        code: "invalid_configuration",
        message: "Service collector configuration is invalid.",
      },
    });
  }
  assert.equal(calls, 0);
});

test("metric failures remain isolated and expose only finite reasons", async () => {
  const outcome = await collectServiceObservation({
    environment: "test",
    now: () => common.at,
    processMetrics: {
      uptimeMs: () => {
        throw new Error("secret uptime detail");
      },
      memoryBytes: () => ({ rss: 1, heapUsed: "bad" }),
      cpuMicroseconds: () => ({ user: -1, system: 2 }),
    },
    storage: {
      id: "data",
      read: () => {
        throw new Error("/private/data");
      },
    },
    queue: { id: "jobs", read: () => ({ depth: "lead_ada" }) },
    dependencies: [
      {
        id: "healthy",
        timeoutMs: 100,
        check: () => ({ state: "healthy", errorCategory: null }),
      },
      {
        id: "throwing",
        timeoutMs: 100,
        check: () => {
          throw new Error("draft_private_body");
        },
      },
      {
        id: "malformed",
        timeoutMs: 100,
        check: () => ({ state: "healthy", errorCategory: null, url: "https://private" }),
      },
    ],
  });

  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.value.uptime, makeUnavailableMeasurement("collection_failed"));
  assert.deepEqual(outcome.value.memoryHeapUsed, makeUnavailableMeasurement("invalid_measurement"));
  assert.deepEqual(outcome.value.cpuUser, makeUnavailableMeasurement("invalid_measurement"));
  assert.deepEqual(outcome.value.storageUsed, makeUnavailableMeasurement("collection_failed"));
  assert.deepEqual(outcome.value.queueDepth, makeUnavailableMeasurement("invalid_measurement"));
  assert.deepEqual(
    outcome.value.dependencies.map(({ id, state, errorCategory }) => ({
      id,
      state,
      errorCategory,
    })),
    [
      { id: "healthy", state: "healthy", errorCategory: null },
      { id: "malformed", state: "unavailable", errorCategory: "invalid_response" },
      { id: "throwing", state: "unavailable", errorCategory: "dependency_failed" },
    ],
  );
  const serialized = JSON.stringify(outcome);
  for (const protectedValue of [
    "secret uptime detail",
    "/private/data",
    "lead_ada",
    "draft_private_body",
    "https://private",
  ]) {
    assert.equal(serialized.includes(protectedValue), false, protectedValue);
  }
});

test("dependency timeout aborts once and does not hide healthy peers", async () => {
  let aborts = 0;
  const outcome = await collectServiceObservation({
    environment: "test",
    now: () => common.at,
    processMetrics: {
      uptimeMs: () => 1,
      memoryBytes: () => ({ rss: 2, heapUsed: 1 }),
      cpuMicroseconds: () => ({ user: 3, system: 4 }),
    },
    dependencies: [
      {
        id: "slow",
        timeoutMs: 5,
        check: (signal: AbortSignal) =>
          new Promise(() => {
            signal.addEventListener("abort", () => {
              aborts += 1;
            });
          }),
      },
      {
        id: "stable",
        timeoutMs: 100,
        check: () => ({ state: "healthy", errorCategory: null }),
      },
    ],
  });

  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.equal(aborts, 1);
  assert.deepEqual(
    outcome.value.dependencies.map(({ id, state, errorCategory }) => ({
      id,
      state,
      errorCategory,
    })),
    [
      { id: "slow", state: "unavailable", errorCategory: "timeout" },
      { id: "stable", state: "healthy", errorCategory: null },
    ],
  );
});

test("invalid clock and uncloneable observations fail canonically", async () => {
  let processCalls = 0;
  const outcome = await collectServiceObservation({
    environment: "test",
    now: () => "not-a-time",
    processMetrics: {
      uptimeMs: () => {
        processCalls += 1;
        return 1;
      },
      memoryBytes: () => ({ rss: 1, heapUsed: 1 }),
      cpuMicroseconds: () => ({ user: 1, system: 1 }),
    },
  });
  assert.deepEqual(outcome, {
    ok: false,
    error: { code: "collection_failed", message: "Service observation collection failed." },
  });
  assert.equal(processCalls, 0);
  assert.deepEqual(createObservation({ ...serviceObservation(), uncloneable: () => true }), {
    ok: false,
    error: { code: "invalid_observation", message: "Observation is invalid." },
  });
});

test("collector validation covers malformed boundaries and safe local defaults", async () => {
  for (const candidate of [
    null,
    { environment: "test", applicationVersion: "" },
    { environment: "test", now: "later" },
    { environment: "test", processMetrics: null },
    { environment: "test", storage: null },
    { environment: "test", queue: null },
    { environment: "test", dependencies: {} },
    { environment: "test", dependencies: [null] },
    {
      environment: "test",
      processMetrics: { uptimeMs: () => 1, memoryBytes: () => ({}), cpuMicroseconds: 2 },
    },
    { environment: "test", storage: { id: "bad id", read: () => ({}) } },
    {
      environment: "test",
      dependencies: [{ id: "provider", timeoutMs: 30_001, check: () => ({}) }],
    },
  ]) {
    assert.equal(isServiceCollectorOptions(candidate), false);
  }
  const hostile = new Proxy(
    {},
    {
      ownKeys: () => {
        throw new Error("secret proxy detail");
      },
    },
  );
  assert.equal(isServiceCollectorOptions(hostile), false);
  assert.equal(isMeasurement(hostile), false);
  assert.equal(isTokenUsage(hostile), false);
  assert.equal(isObservation(hostile), false);

  const local = await collectServiceObservation({ environment: "test" });
  assert.equal(local.ok, true);
  if (local.ok) {
    assert.equal(local.value.uptime.status, "available");
    assert.equal(local.value.memoryRss.status, "available");
    assert.equal(local.value.cpuUser.status, "available");
  }
});

test("remaining metric failure shapes stay explicit and paired", async () => {
  const outcome = await collectServiceObservation({
    environment: "test",
    now: () => common.at,
    processMetrics: {
      uptimeMs: () => 1.5,
      memoryBytes: () => null,
      cpuMicroseconds: () => {
        throw new Error("cpu secret");
      },
    },
    storage: { id: "data", read: () => ({ usedBytes: 2, capacityBytes: 1 }) },
    queue: {
      id: "jobs",
      read: () => {
        throw new Error("queue secret");
      },
    },
    dependencies: [
      {
        id: "degraded_without_error",
        timeoutMs: 100,
        check: () => ({ state: "degraded", errorCategory: null }),
      },
      {
        id: "unavailable",
        timeoutMs: 100,
        check: () => ({ state: "unavailable", errorCategory: "dependency_failed" }),
      },
    ],
  });

  assert.equal(outcome.ok, true);
  if (!outcome.ok) return;
  assert.deepEqual(outcome.value.uptime, makeUnavailableMeasurement("invalid_measurement"));
  assert.deepEqual(outcome.value.memoryRss, makeUnavailableMeasurement("invalid_measurement"));
  assert.deepEqual(outcome.value.memoryHeapUsed, makeUnavailableMeasurement("invalid_measurement"));
  assert.deepEqual(outcome.value.cpuUser, makeUnavailableMeasurement("collection_failed"));
  assert.deepEqual(outcome.value.cpuSystem, makeUnavailableMeasurement("collection_failed"));
  assert.deepEqual(outcome.value.storageUsed, makeUnavailableMeasurement("invalid_measurement"));
  assert.deepEqual(
    outcome.value.storageCapacity,
    makeUnavailableMeasurement("invalid_measurement"),
  );
  assert.deepEqual(outcome.value.queueDepth, makeUnavailableMeasurement("collection_failed"));
  assert.deepEqual(
    outcome.value.dependencies.map(({ state, errorCategory }) => ({ state, errorCategory })),
    [
      { state: "unavailable", errorCategory: "invalid_response" },
      { state: "unavailable", errorCategory: "dependency_failed" },
    ],
  );
});

test("run, model, and tool semantic states remain closed", () => {
  assert.equal(
    isObservation({
      ...runObservation(),
      outcome: "running",
      stopReason: null,
      errorCategory: null,
    }),
    true,
  );
  assert.equal(
    isObservation({
      ...runObservation(),
      outcome: "pending",
      stopReason: "approval_pending",
      errorCategory: null,
    }),
    true,
  );
  assert.equal(
    isObservation({
      ...runObservation(),
      outcome: "completed",
      stopReason: "completed",
      errorCategory: null,
    }),
    true,
  );
  assert.equal(
    isObservation({ ...modelObservation(), outcome: "succeeded", errorCategory: null }),
    true,
  );
  assert.equal(
    isObservation({ ...toolObservation(), outcome: "succeeded", errorCategory: null }),
    true,
  );
  assert.equal(isObservation({ ...runObservation(), at: "2026-08-12T01:00:00.999Z" }), true);
  assert.equal(isObservation({ ...runObservation(), at: "2026-02-30T01:00:00.000Z" }), false);
});

test("collector configuration requires own data properties without invoking accessors", () => {
  const inherited = Object.create({ environment: "test" }) as unknown;
  assert.equal(isServiceCollectorOptions(inherited), false);

  let accessorReads = 0;
  const processMetrics = {} as Record<string, unknown>;
  for (const key of ["uptimeMs", "memoryBytes", "cpuMicroseconds"]) {
    Object.defineProperty(processMetrics, key, {
      enumerable: true,
      get: () => {
        accessorReads += 1;
        return () => 0;
      },
    });
  }
  assert.equal(isServiceCollectorOptions({ environment: "test", processMetrics }), false);
  assert.equal(accessorReads, 0);
  assert.equal(
    isServiceCollectorOptions({ environment: "test", [Symbol("hidden")]: "secret" }),
    false,
  );
});

test("dependency ordering uses stable ASCII code-point order", async () => {
  const outcome = await collectServiceObservation({
    environment: "test",
    now: () => common.at,
    processMetrics: {
      uptimeMs: () => 1,
      memoryBytes: () => ({ rss: 2, heapUsed: 1 }),
      cpuMicroseconds: () => ({ user: 3, system: 4 }),
    },
    dependencies: ["a_", "a.", "a-"].map((id) => ({
      id,
      timeoutMs: 100,
      check: () => ({ state: "healthy" as const, errorCategory: null }),
    })),
  });
  assert.equal(outcome.ok, true);
  if (outcome.ok) {
    assert.deepEqual(
      outcome.value.dependencies.map((dependency) => dependency.id),
      ["a-", "a.", "a_"],
    );
  }
});

test("run terminal and tool permission semantics reject impossible combinations", () => {
  assert.equal(
    isObservation({
      ...runObservation(),
      outcome: "failed",
      stopReason: "agent_run_failed",
      errorCategory: "dependency_failed",
    }),
    true,
  );
  assert.equal(
    isObservation({
      ...runObservation(),
      outcome: "completed",
      stopReason: "approval_failed",
      errorCategory: null,
    }),
    false,
  );
  assert.equal(
    isObservation({
      ...toolObservation(),
      outcome: "succeeded",
      permissionDecision: "forbidden",
      sideEffect: "succeeded",
      errorCategory: null,
    }),
    false,
  );
  assert.equal(
    isObservation({
      ...toolObservation(),
      outcome: "denied",
      permissionDecision: "denied",
      sideEffect: "attempted",
    }),
    false,
  );
});
