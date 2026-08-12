import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import Schema from "typebox/schema";
import {
  ALERT_SCHEMA_VERSION,
  AlertEvaluationRequestSchema,
  AlertFailureSchema,
  AlertResultSchema,
  DEFAULT_ALERT_RULES,
  MAX_ALERT_OBSERVATIONS,
  MAX_ALERT_WINDOW_MS,
  evaluateAlerts,
  isAlertEvaluation,
  type AlertRule,
} from "../src/alerts.js";
import {
  OBSERVATION_SCHEMA_VERSION,
  makeAvailableMeasurement,
  makeNotApplicableMeasurement,
  makeUnavailableMeasurement,
  type ModelObservation,
  type Observation,
  type RunObservation,
  type ServiceObservation,
  type ToolObservation,
} from "../src/observability.js";

const START = "2026-08-12T00:00:00.000Z";
const AT = "2026-08-12T00:30:00.000Z";
const END = "2026-08-12T01:00:00.000Z";

const none = () => ({ kind: "none" as const });

function rules(): AlertRule[] {
  return [
    {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: "repeated_task_failure",
      severity: "warning",
      evidenceSource: "run_outcome",
      operatorAction: "inspect_run_reports",
      threshold: { count: 2 },
      suppression: none(),
    },
    {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: "stuck_run",
      severity: "critical",
      evidenceSource: "run_duration",
      operatorAction: "stop_new_requests_and_inspect_run",
      threshold: { durationMs: 5_000 },
      suppression: none(),
    },
    {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: "dangerous_permission_attempt",
      severity: "critical",
      evidenceSource: "tool_permission_decision",
      operatorAction: "preserve_evidence_and_escalate",
      threshold: { count: 1 },
      suppression: none(),
    },
    {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: "cost_spike",
      severity: "warning",
      evidenceSource: "model_cost",
      operatorAction: "stop_new_requests_and_inspect_usage",
      threshold: { usd: 1 },
      suppression: none(),
    },
    {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: "unavailable_dependency",
      severity: "critical",
      evidenceSource: "dependency_state",
      operatorAction: "inspect_dependency",
      threshold: { count: 1 },
      suppression: none(),
    },
    {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: "storage_pressure",
      severity: "critical",
      evidenceSource: "storage_utilization",
      operatorAction: "stop_new_requests_and_inspect_storage",
      threshold: { percent: 80 },
      suppression: none(),
    },
    {
      schemaVersion: ALERT_SCHEMA_VERSION,
      id: "queue_pressure",
      severity: "warning",
      evidenceSource: "queue_depth",
      operatorAction: "inspect_queue",
      threshold: { count: 10 },
      suppression: none(),
    },
  ];
}

function common(at = AT) {
  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    at,
    environment: "test" as const,
    applicationVersion: "0.1.33",
  };
}

function runObservation(
  outcome: RunObservation["outcome"],
  options: {
    at?: string;
    duration?: RunObservation["duration"];
    retryCount?: number;
    runId?: string;
  } = {},
): RunObservation {
  const stopped = outcome === "stopped";
  const failed = outcome === "failed";
  return {
    ...common(options.at),
    layer: "run",
    kind: "run.lifecycle",
    runId: options.runId ?? `run_alert_${outcome}_001`,
    outcome,
    stopReason:
      outcome === "running"
        ? null
        : outcome === "pending"
          ? "approval_pending"
          : outcome === "completed"
            ? "completed"
            : failed
              ? "agent_run_failed"
              : "dependency_failed",
    duration: options.duration ?? makeAvailableMeasurement(100, "milliseconds"),
    stepCount: makeAvailableMeasurement(1, "count"),
    retryCount: options.retryCount ?? 0,
    errorCategory: stopped || failed ? "dependency_failed" : null,
  };
}

function modelObservation(cost: ModelObservation["cost"], at = AT): ModelObservation {
  return {
    ...common(at),
    layer: "model",
    kind: "model.call",
    runId: "run_alert_model_001",
    stepNumber: 1,
    modelVersion: "synthetic-model-v1",
    promptVersion: "synthetic-prompt-v1",
    outcome: "succeeded",
    duration: makeAvailableMeasurement(10, "milliseconds"),
    retryCount: 0,
    tokens: { status: "available", input: 1, output: 2, total: 3 },
    cost,
    errorCategory: null,
  };
}

function toolObservation(
  permissionDecision: ToolObservation["permissionDecision"],
  at = AT,
): ToolObservation {
  const denied = permissionDecision === "denied" || permissionDecision === "forbidden";
  return {
    ...common(at),
    layer: "tool",
    kind: "tool.call",
    runId: "run_alert_tool_001",
    stepNumber: 1,
    toolName: "find_lead",
    callId: "call_alert_001",
    outcome: denied ? "denied" : "succeeded",
    permissionDecision,
    sideEffect: "none",
    duration: makeAvailableMeasurement(10, "milliseconds"),
    retryCount: 0,
    errorCategory: denied ? "permission_denied" : null,
  };
}

function serviceObservation(
  options: {
    storageUsed?: ServiceObservation["storageUsed"];
    storageCapacity?: ServiceObservation["storageCapacity"];
    queueDepth?: ServiceObservation["queueDepth"];
    dependencyState?: "healthy" | "degraded" | "unavailable" | null;
    at?: string;
  } = {},
): ServiceObservation {
  const dependencyState =
    options.dependencyState === undefined ? "unavailable" : options.dependencyState;
  return {
    ...common(options.at),
    layer: "service",
    kind: "service.snapshot",
    uptime: makeAvailableMeasurement(10_000, "milliseconds"),
    memoryRss: makeAvailableMeasurement(1_000, "bytes"),
    memoryHeapUsed: makeAvailableMeasurement(500, "bytes"),
    cpuUser: makeAvailableMeasurement(10, "microseconds"),
    cpuSystem: makeAvailableMeasurement(5, "microseconds"),
    storageUsed: options.storageUsed ?? makeAvailableMeasurement(80, "bytes"),
    storageCapacity: options.storageCapacity ?? makeAvailableMeasurement(100, "bytes"),
    queueDepth: options.queueDepth ?? makeNotApplicableMeasurement("not_configured"),
    dependencies:
      dependencyState === null
        ? []
        : [
            {
              id: "synthetic_provider",
              state: dependencyState,
              duration: makeAvailableMeasurement(5, "milliseconds"),
              errorCategory: dependencyState === "unavailable" ? "dependency_failed" : null,
            },
          ],
  };
}

function request(observations: Observation[], configuredRules = rules()) {
  return {
    schemaVersion: ALERT_SCHEMA_VERSION,
    evaluationAt: END,
    window: { startedAt: START, endedAt: END },
    rules: configuredRules,
    observations,
  };
}

function evaluationOf(input: unknown) {
  const outcome = evaluateAlerts(input);
  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.ok, true);
  return outcome.value;
}

test("all seven rules trigger at their exact threshold while an absent queue is explicit", () => {
  const evaluation = evaluationOf(
    request([
      runObservation("stopped", { runId: "run_alert_stopped_001" }),
      runObservation("failed", { runId: "run_alert_failed_001" }),
      runObservation("running", {
        duration: makeAvailableMeasurement(5_000, "milliseconds"),
      }),
      toolObservation("denied"),
      modelObservation(makeAvailableMeasurement(0.4, "usd")),
      modelObservation(makeAvailableMeasurement(0.6, "usd")),
      serviceObservation(),
    ]),
  );
  assert.deepEqual(
    evaluation.results.map(({ ruleId, status }) => [ruleId, status]),
    [
      ["repeated_task_failure", "triggered"],
      ["stuck_run", "triggered"],
      ["dangerous_permission_attempt", "triggered"],
      ["cost_spike", "triggered"],
      ["unavailable_dependency", "triggered"],
      ["storage_pressure", "triggered"],
      ["queue_pressure", "not_applicable"],
    ],
  );
  assert.equal(evaluation.results[6]?.evidence.reason, "queue_not_configured");
});

test("default policy is complete, finite, and deeply frozen", () => {
  assert.deepEqual(
    DEFAULT_ALERT_RULES.map(({ id }) => id),
    rules().map(({ id }) => id),
  );
  assert.equal(Object.isFrozen(DEFAULT_ALERT_RULES), true);
  for (const rule of DEFAULT_ALERT_RULES) {
    assert.equal(Object.isFrozen(rule), true);
    assert.equal(Object.isFrozen(rule.threshold), true);
    assert.equal(Object.isFrozen(rule.suppression), true);
  }
});

test("below-threshold failures and harmless successful retries remain clear", () => {
  const configured = rules();
  const evaluation = evaluationOf(
    request(
      [
        runObservation("stopped"),
        runObservation("completed", { retryCount: 100 }),
        runObservation("running", {
          duration: makeAvailableMeasurement(4_999, "milliseconds"),
        }),
        toolObservation("automatic"),
        modelObservation(makeAvailableMeasurement(0.999, "usd")),
        serviceObservation({
          storageUsed: makeAvailableMeasurement(79, "bytes"),
          queueDepth: makeAvailableMeasurement(9, "count"),
          dependencyState: "healthy",
        }),
      ],
      configured,
    ),
  );
  assert.deepEqual(
    evaluation.results.map(({ status }) => status),
    ["clear", "clear", "clear", "clear", "clear", "clear", "clear"],
  );
  assert.equal(evaluation.results[0]?.evidence.observedValue, 1);
});

test("repeated failures count distinct runs instead of duplicate observations", () => {
  const failure = runObservation("failed", { runId: "run_alert_same_failure" });
  const evaluation = evaluationOf(
    request([failure, structuredClone(failure)], [rules()[0] as AlertRule]),
  );
  assert.equal(evaluation.results[0]?.status, "clear");
  assert.equal(evaluation.results[0]?.evidence.observedCount, 1);
});

test("observations outside the closed window do not affect thresholds", () => {
  const evaluation = evaluationOf(
    request([
      runObservation("failed", { at: "2026-08-11T23:59:59.999Z" }),
      runObservation("failed", { at: "2026-08-12T01:00:00.001Z" }),
      runObservation("failed", { at: START, runId: "run_alert_boundary_start" }),
      runObservation("failed", { at: END, runId: "run_alert_boundary_end" }),
      serviceObservation({ dependencyState: "healthy" }),
      modelObservation(makeAvailableMeasurement(0, "usd")),
    ]),
  );
  assert.equal(evaluation.results[0]?.status, "triggered");
  assert.equal(evaluation.results[0]?.evidence.observedCount, 2);
});

test("stuck-run unavailable duration is visible rather than clear", () => {
  const evaluation = evaluationOf(
    request(
      [runObservation("running", { duration: makeUnavailableMeasurement("not_reported") })],
      [rules()[1] as AlertRule],
    ),
  );
  assert.equal(evaluation.results[0]?.status, "unavailable");
  assert.equal(evaluation.results[0]?.evidence.reason, "required_measurement_unavailable");
});

test("missing and unavailable model costs cannot silently pass a cost rule", () => {
  const costRule = rules()[3] as AlertRule;
  const missing = evaluationOf(request([], [costRule]));
  assert.equal(missing.results[0]?.status, "unavailable");
  assert.equal(missing.results[0]?.evidence.reason, "required_observation_missing");

  const unavailable = evaluationOf(
    request([modelObservation(makeUnavailableMeasurement("not_reported"))], [costRule]),
  );
  assert.equal(unavailable.results[0]?.status, "unavailable");
  assert.equal(unavailable.results[0]?.evidence.observedValue, null);
});

test("dependency rule requires an observed configured dependency", () => {
  const dependencyRule = rules()[4] as AlertRule;
  for (const observations of [[], [serviceObservation({ dependencyState: null })]]) {
    const evaluation = evaluationOf(request(observations, [dependencyRule]));
    assert.equal(evaluation.results[0]?.status, "unavailable");
    assert.equal(evaluation.results[0]?.evidence.reason, "required_observation_missing");
  }
});

test("storage rule refuses unavailable pairs and zero capacity", () => {
  const storageRule = rules()[5] as AlertRule;
  const cases = [
    serviceObservation({ storageUsed: makeUnavailableMeasurement("collection_failed") }),
    serviceObservation({
      storageUsed: makeAvailableMeasurement(0, "bytes"),
      storageCapacity: makeAvailableMeasurement(0, "bytes"),
    }),
  ];
  for (const observation of cases) {
    const evaluation = evaluationOf(request([observation], [storageRule]));
    assert.equal(evaluation.results[0]?.status, "unavailable");
    assert.equal(evaluation.results[0]?.evidence.reason, "required_measurement_unavailable");
  }
});

test("queue rule distinguishes absent service, unconfigured queue, and available depth", () => {
  const queueRule = rules()[6] as AlertRule;
  assert.equal(evaluationOf(request([], [queueRule])).results[0]?.status, "unavailable");
  assert.equal(
    evaluationOf(request([serviceObservation()], [queueRule])).results[0]?.status,
    "not_applicable",
  );
  const available = evaluationOf(
    request(
      [serviceObservation({ queueDepth: makeAvailableMeasurement(10, "count") })],
      [queueRule],
    ),
  );
  assert.equal(available.results[0]?.status, "triggered");
});

test("active cooldown suppresses but preserves dangerous-permission evidence", () => {
  const permission = rules()[2] as Extract<AlertRule, { id: "dangerous_permission_attempt" }>;
  permission.suppression = {
    kind: "cooldown",
    durationMs: 60_000,
    lastTriggeredAt: "2026-08-12T00:59:30.000Z",
  };
  const result = evaluationOf(request([toolObservation("forbidden")], [permission])).results[0];
  assert.equal(result?.status, "suppressed");
  assert.equal(result?.evidence.observedValue, 1);
  assert.equal(result?.operatorAction, "preserve_evidence_and_escalate");
});

test("cooldown expires at the exact duration boundary", () => {
  const permission = rules()[2] as Extract<AlertRule, { id: "dangerous_permission_attempt" }>;
  permission.suppression = {
    kind: "cooldown",
    durationMs: 60_000,
    lastTriggeredAt: "2026-08-12T00:59:00.000Z",
  };
  assert.equal(
    evaluationOf(request([toolObservation("denied")], [permission])).results[0]?.status,
    "triggered",
  );
});

test("stable input rule order is preserved in output", () => {
  const configured = [rules()[6], rules()[0], rules()[2]] as AlertRule[];
  const evaluation = evaluationOf(
    request([serviceObservation(), toolObservation("denied")], configured),
  );
  assert.deepEqual(
    evaluation.results.map(({ ruleId }) => ruleId),
    ["queue_pressure", "repeated_task_failure", "dangerous_permission_attempt"],
  );
});

test("requests reject duplicate rules, mismatched fixed fields, and invalid thresholds", () => {
  const base = request([]);
  const cases: unknown[] = [
    { ...base, rules: [rules()[0], rules()[0]] },
    {
      ...base,
      rules: [{ ...rules()[0], operatorAction: "preserve_evidence_and_escalate" }],
    },
    { ...base, rules: [{ ...rules()[0], threshold: { count: 1 } }] },
    { ...base, unexpected: true },
  ];
  for (const input of cases) {
    assert.deepEqual(evaluateAlerts(input), {
      ok: false,
      error: {
        code: "invalid_alert_request",
        message: "Alert evaluation request is invalid.",
      },
    });
  }
});

test("request time semantics reject noncanonical, mismatched, reversed, long, and future suppression", () => {
  const permission = rules()[2] as Extract<AlertRule, { id: "dangerous_permission_attempt" }>;
  permission.suppression = {
    kind: "cooldown",
    durationMs: 60_000,
    lastTriggeredAt: "2026-08-12T01:00:00.001Z",
  };
  const cases = [
    { ...request([]), evaluationAt: "2026-08-12T01:00:00Z" },
    { ...request([]), evaluationAt: "2026-08-12T02:00:00.000Z" },
    { ...request([]), window: { startedAt: END, endedAt: START }, evaluationAt: START },
    {
      ...request([]),
      window: { startedAt: START, endedAt: "2026-08-13T00:00:00.001Z" },
      evaluationAt: "2026-08-13T00:00:00.001Z",
    },
    request([], [permission]),
  ];
  for (const input of cases) assert.equal(evaluateAlerts(input).ok, false);
  assert.equal(MAX_ALERT_WINDOW_MS, 86_400_000);
});

test("observation count is bounded and malformed observations fail the whole request", () => {
  const observation = runObservation("completed");
  const tooMany = Array.from({ length: MAX_ALERT_OBSERVATIONS + 1 }, () => observation);
  assert.equal(evaluateAlerts(request(tooMany)).ok, false);
  assert.equal(
    evaluateAlerts(request([{ ...observation, secret: "provider-secret" } as Observation])).ok,
    false,
  );
});

test("accessors, symbols, functions, dates, and cyclic input fail without executing accessors", () => {
  let getterCalls = 0;
  const accessor = Object.defineProperty({}, "schemaVersion", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return ALERT_SCHEMA_VERSION;
    },
  });
  const cyclic: { self?: unknown } = {};
  cyclic.self = cyclic;
  for (const input of [
    accessor,
    { ...request([]), unexpected: Symbol("forbidden") },
    { ...request([]), unexpected: () => undefined },
    { ...request([]), unexpected: new Date() },
    cyclic,
  ]) {
    assert.equal(evaluateAlerts(input).ok, false);
  }
  assert.equal(getterCalls, 0);
});

test("outputs are deeply frozen and detached from caller mutation", () => {
  const configured = rules();
  const observations = [serviceObservation(), toolObservation("denied")];
  const evaluation = evaluationOf(request(observations, configured));
  const firstRule = configured[0];
  const firstObservation = observations[0];
  if (firstRule === undefined || firstObservation === undefined) {
    assert.fail("Expected caller-owned fixtures.");
  }
  firstRule.severity = "critical";
  firstObservation.at = START;
  assert.equal(evaluation.results[0]?.severity, "warning");
  assert.equal(evaluation.evaluatedAt, END);
  assert.equal(Object.isFrozen(evaluation), true);
  assert.equal(Object.isFrozen(evaluation.results), true);
  assert.equal(Object.isFrozen(evaluation.results[0]?.evidence), true);
});

test("result and request schemas remain closed and exported evaluation guard fails closed", () => {
  const requestValidator = Schema.Compile(AlertEvaluationRequestSchema);
  const resultValidator = Schema.Compile(AlertResultSchema);
  const failureValidator = Schema.Compile(AlertFailureSchema);
  assert.equal(requestValidator.Check(request([])), true);
  const result = evaluationOf(request([], [rules()[0] as AlertRule])).results[0];
  assert.equal(resultValidator.Check(result), true);
  assert.equal(resultValidator.Check({ ...result, rawError: "forbidden" }), false);
  assert.equal(
    failureValidator.Check({
      code: "invalid_alert_request",
      message: "Alert evaluation request is invalid.",
    }),
    true,
  );
  assert.equal(isAlertEvaluation({}), false);
  let getterCalls = 0;
  assert.equal(
    isAlertEvaluation(
      Object.defineProperty({}, "schemaVersion", {
        enumerable: true,
        get() {
          getterCalls += 1;
          return ALERT_SCHEMA_VERSION;
        },
      }),
    ),
    false,
  );
  assert.equal(getterCalls, 0);
});

test("evaluation guard rejects impossible source, status, reason, suppression, and identity semantics", () => {
  const valid = evaluationOf(request([], [rules()[0] as AlertRule]));
  const cases: unknown[] = [];
  const wrongSource = structuredClone(valid);
  const wrongSourceResult = wrongSource.results[0];
  if (wrongSourceResult === undefined) assert.fail("Expected alert result.");
  wrongSourceResult.evidence.source = "queue_depth";
  cases.push(wrongSource);
  const falseTrigger = structuredClone(valid);
  const falseTriggerResult = falseTrigger.results[0];
  if (falseTriggerResult === undefined) assert.fail("Expected alert result.");
  falseTriggerResult.status = "triggered";
  cases.push(falseTrigger);
  const falseUnavailable = structuredClone(valid);
  const falseUnavailableResult = falseUnavailable.results[0];
  if (falseUnavailableResult === undefined) assert.fail("Expected alert result.");
  falseUnavailableResult.status = "unavailable";
  falseUnavailableResult.evidence.observedValue = null;
  falseUnavailableResult.evidence.reason = "required_observation_missing";
  cases.push(falseUnavailable);
  const duplicate = structuredClone(valid);
  const duplicateResult = duplicate.results[0];
  if (duplicateResult === undefined) assert.fail("Expected alert result.");
  duplicate.results.push(structuredClone(duplicateResult));
  cases.push(duplicate);
  const wrongWindow = structuredClone(valid);
  wrongWindow.window.endedAt = "2026-08-12T00:59:59.999Z";
  cases.push(wrongWindow);
  const invalidThreshold = structuredClone(valid);
  const invalidThresholdResult = invalidThreshold.results[0];
  if (invalidThresholdResult === undefined) assert.fail("Expected alert result.");
  invalidThresholdResult.evidence.threshold = 1;
  cases.push(invalidThreshold);
  const futureSuppression = structuredClone(valid);
  const futureSuppressionResult = futureSuppression.results[0];
  if (futureSuppressionResult === undefined) assert.fail("Expected alert result.");
  futureSuppressionResult.suppression = {
    kind: "cooldown",
    durationMs: 60_000,
    lastTriggeredAt: "2026-08-12T01:00:00.001Z",
  };
  cases.push(futureSuppression);
  for (const candidate of cases) assert.equal(isAlertEvaluation(candidate), false);
});

test("serialized results contain only bounded evidence and no protected source fields", () => {
  const input = request([toolObservation("denied"), serviceObservation()]);
  const serialized = JSON.stringify(evaluationOf(input));
  for (const protectedValue of [
    "provider-secret",
    "lead_private",
    "draft body",
    "approval_private",
    "reservation_private",
    "/private/path",
    "https://private.example",
    "raw error",
  ]) {
    assert.equal(serialized.includes(protectedValue), false);
  }
  assert.deepEqual(Object.keys(JSON.parse(serialized)), [
    "schemaVersion",
    "evaluatedAt",
    "window",
    "results",
  ]);
});

test("alert module is pure and introduces no network, notification, HTTP, or durable-write boundary", () => {
  const source = readFileSync(new URL("../src/alerts.ts", import.meta.url), "utf8");
  for (const forbidden of [
    "fetch(",
    "node:http",
    "node:https",
    "webhook",
    "pager",
    "append(",
    "writeFile",
    "registerTool",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});
