import { Type } from "typebox";
import Schema from "typebox/schema";
import { ObservationSchema, isObservation, type Observation } from "./observability.js";

export const ALERT_SCHEMA_VERSION = 1 as const;
export const MAX_ALERT_RULES = 20;
export const MAX_ALERT_OBSERVATIONS = 1_000;
export const MAX_ALERT_WINDOW_MS = 86_400_000;

const IsoTimestampSchema = Type.String({
  minLength: 24,
  maxLength: 24,
  pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{3}Z$",
});

export const AlertSeveritySchema = Type.Union([Type.Literal("warning"), Type.Literal("critical")]);

export const AlertRuleIdSchema = Type.Union([
  Type.Literal("repeated_task_failure"),
  Type.Literal("stuck_run"),
  Type.Literal("dangerous_permission_attempt"),
  Type.Literal("cost_spike"),
  Type.Literal("unavailable_dependency"),
  Type.Literal("storage_pressure"),
  Type.Literal("queue_pressure"),
]);

export const AlertEvidenceSourceSchema = Type.Union([
  Type.Literal("run_outcome"),
  Type.Literal("run_duration"),
  Type.Literal("tool_permission_decision"),
  Type.Literal("model_cost"),
  Type.Literal("dependency_state"),
  Type.Literal("storage_utilization"),
  Type.Literal("queue_depth"),
]);

export const AlertOperatorActionSchema = Type.Union([
  Type.Literal("inspect_run_reports"),
  Type.Literal("stop_new_requests_and_inspect_run"),
  Type.Literal("preserve_evidence_and_escalate"),
  Type.Literal("stop_new_requests_and_inspect_usage"),
  Type.Literal("inspect_dependency"),
  Type.Literal("stop_new_requests_and_inspect_storage"),
  Type.Literal("inspect_queue"),
]);

export const AlertSuppressionSchema = Type.Union([
  Type.Object({ kind: Type.Literal("none") }, { additionalProperties: false }),
  Type.Object(
    {
      kind: Type.Literal("cooldown"),
      durationMs: Type.Integer({ minimum: 1_000, maximum: MAX_ALERT_WINDOW_MS }),
      lastTriggeredAt: Type.Union([IsoTimestampSchema, Type.Null()]),
    },
    { additionalProperties: false },
  ),
]);

const commonRule = {
  schemaVersion: Type.Literal(ALERT_SCHEMA_VERSION),
  severity: AlertSeveritySchema,
  suppression: AlertSuppressionSchema,
};

const RepeatedTaskFailureRuleSchema = Type.Object(
  {
    ...commonRule,
    id: Type.Literal("repeated_task_failure"),
    evidenceSource: Type.Literal("run_outcome"),
    operatorAction: Type.Literal("inspect_run_reports"),
    threshold: Type.Object(
      { count: Type.Integer({ minimum: 2, maximum: 100 }) },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const StuckRunRuleSchema = Type.Object(
  {
    ...commonRule,
    id: Type.Literal("stuck_run"),
    evidenceSource: Type.Literal("run_duration"),
    operatorAction: Type.Literal("stop_new_requests_and_inspect_run"),
    threshold: Type.Object(
      { durationMs: Type.Integer({ minimum: 1_000, maximum: MAX_ALERT_WINDOW_MS }) },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const DangerousPermissionRuleSchema = Type.Object(
  {
    ...commonRule,
    id: Type.Literal("dangerous_permission_attempt"),
    evidenceSource: Type.Literal("tool_permission_decision"),
    operatorAction: Type.Literal("preserve_evidence_and_escalate"),
    threshold: Type.Object(
      { count: Type.Integer({ minimum: 1, maximum: 100 }) },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const CostSpikeRuleSchema = Type.Object(
  {
    ...commonRule,
    id: Type.Literal("cost_spike"),
    evidenceSource: Type.Literal("model_cost"),
    operatorAction: Type.Literal("stop_new_requests_and_inspect_usage"),
    threshold: Type.Object(
      { usd: Type.Number({ minimum: 0.000001, maximum: 1_000_000 }) },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const UnavailableDependencyRuleSchema = Type.Object(
  {
    ...commonRule,
    id: Type.Literal("unavailable_dependency"),
    evidenceSource: Type.Literal("dependency_state"),
    operatorAction: Type.Literal("inspect_dependency"),
    threshold: Type.Object(
      { count: Type.Integer({ minimum: 1, maximum: 100 }) },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const StoragePressureRuleSchema = Type.Object(
  {
    ...commonRule,
    id: Type.Literal("storage_pressure"),
    evidenceSource: Type.Literal("storage_utilization"),
    operatorAction: Type.Literal("stop_new_requests_and_inspect_storage"),
    threshold: Type.Object(
      { percent: Type.Integer({ minimum: 1, maximum: 100 }) },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const QueuePressureRuleSchema = Type.Object(
  {
    ...commonRule,
    id: Type.Literal("queue_pressure"),
    evidenceSource: Type.Literal("queue_depth"),
    operatorAction: Type.Literal("inspect_queue"),
    threshold: Type.Object(
      { count: Type.Integer({ minimum: 1, maximum: 1_000_000 }) },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const AlertRuleSchema = Type.Union([
  RepeatedTaskFailureRuleSchema,
  StuckRunRuleSchema,
  DangerousPermissionRuleSchema,
  CostSpikeRuleSchema,
  UnavailableDependencyRuleSchema,
  StoragePressureRuleSchema,
  QueuePressureRuleSchema,
]);

export const AlertWindowSchema = Type.Object(
  { startedAt: IsoTimestampSchema, endedAt: IsoTimestampSchema },
  { additionalProperties: false },
);

export const AlertEvaluationRequestSchema = Type.Object(
  {
    schemaVersion: Type.Literal(ALERT_SCHEMA_VERSION),
    evaluationAt: IsoTimestampSchema,
    window: AlertWindowSchema,
    rules: Type.Array(AlertRuleSchema, { minItems: 1, maxItems: MAX_ALERT_RULES }),
    observations: Type.Array(ObservationSchema, { maxItems: MAX_ALERT_OBSERVATIONS }),
  },
  { additionalProperties: false },
);

export const AlertResultStatusSchema = Type.Union([
  Type.Literal("clear"),
  Type.Literal("triggered"),
  Type.Literal("suppressed"),
  Type.Literal("unavailable"),
  Type.Literal("not_applicable"),
]);

const AlertEvidenceUnitSchema = Type.Union([
  Type.Literal("count"),
  Type.Literal("milliseconds"),
  Type.Literal("usd"),
  Type.Literal("percent"),
]);

const AlertEvidenceReasonSchema = Type.Union([
  Type.Literal("required_observation_missing"),
  Type.Literal("required_measurement_unavailable"),
  Type.Literal("queue_not_configured"),
]);

export const AlertEvidenceSchema = Type.Object(
  {
    source: AlertEvidenceSourceSchema,
    observedCount: Type.Integer({ minimum: 0, maximum: MAX_ALERT_OBSERVATIONS * 20 }),
    observedValue: Type.Union([
      Type.Number({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
      Type.Null(),
    ]),
    threshold: Type.Number({ minimum: 0.000001, maximum: Number.MAX_SAFE_INTEGER }),
    unit: AlertEvidenceUnitSchema,
    reason: Type.Union([AlertEvidenceReasonSchema, Type.Null()]),
  },
  { additionalProperties: false },
);

export const AlertResultSchema = Type.Object(
  {
    ruleId: AlertRuleIdSchema,
    severity: AlertSeveritySchema,
    status: AlertResultStatusSchema,
    evidenceSource: AlertEvidenceSourceSchema,
    operatorAction: AlertOperatorActionSchema,
    suppression: AlertSuppressionSchema,
    evidence: AlertEvidenceSchema,
  },
  { additionalProperties: false },
);

export const AlertEvaluationSchema = Type.Object(
  {
    schemaVersion: Type.Literal(ALERT_SCHEMA_VERSION),
    evaluatedAt: IsoTimestampSchema,
    window: AlertWindowSchema,
    results: Type.Array(AlertResultSchema, { minItems: 1, maxItems: MAX_ALERT_RULES }),
  },
  { additionalProperties: false },
);

export const AlertFailureSchema = Type.Object(
  {
    code: Type.Literal("invalid_alert_request"),
    message: Type.Literal("Alert evaluation request is invalid."),
  },
  { additionalProperties: false },
);

export type AlertRule = Type.Static<typeof AlertRuleSchema>;
export type AlertEvaluationRequest = Type.Static<typeof AlertEvaluationRequestSchema>;
export type AlertResult = Type.Static<typeof AlertResultSchema>;
export type AlertEvaluation = Type.Static<typeof AlertEvaluationSchema>;
export type AlertFailure = Type.Static<typeof AlertFailureSchema>;
export type AlertEvaluationOutcome =
  | Readonly<{ ok: true; value: AlertEvaluation }>
  | Readonly<{ ok: false; error: AlertFailure }>;

const requestValidator = Schema.Compile(AlertEvaluationRequestSchema);
const evaluationValidator = Schema.Compile(AlertEvaluationSchema);
const ruleValidator = Schema.Compile(AlertRuleSchema);

function isCanonicalTimestamp(value: string): boolean {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function isPlainDataTree(value: unknown, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null && !Array.isArray(value)) return false;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor)) return false;
      if (!isPlainDataTree(descriptor.value, seen)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function cloneDataTree(input: unknown): unknown {
  if (!isPlainDataTree(input)) return null;
  try {
    return structuredClone(input);
  } catch {
    return null;
  }
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

export const DEFAULT_ALERT_RULES: readonly AlertRule[] = deepFreeze([
  {
    schemaVersion: ALERT_SCHEMA_VERSION,
    id: "repeated_task_failure",
    severity: "warning",
    evidenceSource: "run_outcome",
    operatorAction: "inspect_run_reports",
    threshold: { count: 3 },
    suppression: { kind: "cooldown", durationMs: 300_000, lastTriggeredAt: null },
  },
  {
    schemaVersion: ALERT_SCHEMA_VERSION,
    id: "stuck_run",
    severity: "critical",
    evidenceSource: "run_duration",
    operatorAction: "stop_new_requests_and_inspect_run",
    threshold: { durationMs: 300_000 },
    suppression: { kind: "cooldown", durationMs: 300_000, lastTriggeredAt: null },
  },
  {
    schemaVersion: ALERT_SCHEMA_VERSION,
    id: "dangerous_permission_attempt",
    severity: "critical",
    evidenceSource: "tool_permission_decision",
    operatorAction: "preserve_evidence_and_escalate",
    threshold: { count: 1 },
    suppression: { kind: "cooldown", durationMs: 900_000, lastTriggeredAt: null },
  },
  {
    schemaVersion: ALERT_SCHEMA_VERSION,
    id: "cost_spike",
    severity: "warning",
    evidenceSource: "model_cost",
    operatorAction: "stop_new_requests_and_inspect_usage",
    threshold: { usd: 5 },
    suppression: { kind: "cooldown", durationMs: 900_000, lastTriggeredAt: null },
  },
  {
    schemaVersion: ALERT_SCHEMA_VERSION,
    id: "unavailable_dependency",
    severity: "critical",
    evidenceSource: "dependency_state",
    operatorAction: "inspect_dependency",
    threshold: { count: 2 },
    suppression: { kind: "cooldown", durationMs: 300_000, lastTriggeredAt: null },
  },
  {
    schemaVersion: ALERT_SCHEMA_VERSION,
    id: "storage_pressure",
    severity: "critical",
    evidenceSource: "storage_utilization",
    operatorAction: "stop_new_requests_and_inspect_storage",
    threshold: { percent: 85 },
    suppression: { kind: "cooldown", durationMs: 900_000, lastTriggeredAt: null },
  },
  {
    schemaVersion: ALERT_SCHEMA_VERSION,
    id: "queue_pressure",
    severity: "warning",
    evidenceSource: "queue_depth",
    operatorAction: "inspect_queue",
    threshold: { count: 100 },
    suppression: { kind: "cooldown", durationMs: 300_000, lastTriggeredAt: null },
  },
]);

if (!DEFAULT_ALERT_RULES.every((rule) => ruleValidator.Check(rule))) {
  throw new Error("Default alert policy is invalid.");
}

function invalidOutcome(): AlertEvaluationOutcome {
  return Object.freeze({
    ok: false as const,
    error: Object.freeze({
      code: "invalid_alert_request" as const,
      message: "Alert evaluation request is invalid." as const,
    }),
  });
}

function hasValidRequestSemantics(request: AlertEvaluationRequest): boolean {
  if (
    !isCanonicalTimestamp(request.evaluationAt) ||
    !isCanonicalTimestamp(request.window.startedAt) ||
    !isCanonicalTimestamp(request.window.endedAt) ||
    request.window.endedAt !== request.evaluationAt
  ) {
    return false;
  }
  const start = Date.parse(request.window.startedAt);
  const end = Date.parse(request.window.endedAt);
  if (start > end || end - start > MAX_ALERT_WINDOW_MS) return false;
  const identifiers = new Set<string>();
  for (const rule of request.rules) {
    if (identifiers.has(rule.id)) return false;
    identifiers.add(rule.id);
    if (
      rule.suppression.kind === "cooldown" &&
      rule.suppression.lastTriggeredAt !== null &&
      (!isCanonicalTimestamp(rule.suppression.lastTriggeredAt) ||
        Date.parse(rule.suppression.lastTriggeredAt) > end)
    ) {
      return false;
    }
  }
  return request.observations.every(isObservation);
}

function inWindow(observation: Observation, start: number, end: number): boolean {
  const at = Date.parse(observation.at);
  return at >= start && at <= end;
}

type EvaluationFacts = Readonly<{
  observedCount: number;
  observedValue: number | null;
  threshold: number;
  unit: "count" | "milliseconds" | "usd" | "percent";
  status: "clear" | "triggered" | "unavailable" | "not_applicable";
  reason:
    | "required_observation_missing"
    | "required_measurement_unavailable"
    | "queue_not_configured"
    | null;
}>;

function repeatedFailureFacts(
  rule: AlertRule,
  observations: readonly Observation[],
): EvaluationFacts {
  if (rule.id !== "repeated_task_failure") throw new Error("Unexpected rule.");
  const count = new Set(
    observations
      .filter(
        (observation) =>
          observation.layer === "run" &&
          (observation.outcome === "failed" || observation.outcome === "stopped"),
      )
      .map((observation) => (observation.layer === "run" ? observation.runId : "")),
  ).size;
  return {
    observedCount: count,
    observedValue: count,
    threshold: rule.threshold.count,
    unit: "count",
    status: count >= rule.threshold.count ? "triggered" : "clear",
    reason: null,
  };
}

function stuckRunFacts(rule: AlertRule, observations: readonly Observation[]): EvaluationFacts {
  if (rule.id !== "stuck_run") throw new Error("Unexpected rule.");
  const relevant = observations.filter(
    (observation) =>
      observation.layer === "run" &&
      (observation.outcome === "running" || observation.outcome === "pending"),
  );
  if (relevant.length === 0) {
    return {
      observedCount: 0,
      observedValue: null,
      threshold: rule.threshold.durationMs,
      unit: "milliseconds",
      status: "clear",
      reason: null,
    };
  }
  const values = relevant
    .map((observation) => observation.layer === "run" && observation.duration)
    .filter((measurement) => measurement && measurement.status === "available")
    .map((measurement) => (measurement.status === "available" ? measurement.value : 0));
  if (values.length !== relevant.length) {
    return {
      observedCount: relevant.length,
      observedValue: null,
      threshold: rule.threshold.durationMs,
      unit: "milliseconds",
      status: "unavailable",
      reason: "required_measurement_unavailable",
    };
  }
  const maximum = Math.max(...values);
  return {
    observedCount: relevant.length,
    observedValue: maximum,
    threshold: rule.threshold.durationMs,
    unit: "milliseconds",
    status: maximum >= rule.threshold.durationMs ? "triggered" : "clear",
    reason: null,
  };
}

function permissionFacts(rule: AlertRule, observations: readonly Observation[]): EvaluationFacts {
  if (rule.id !== "dangerous_permission_attempt") throw new Error("Unexpected rule.");
  const count = observations.filter(
    (observation) =>
      observation.layer === "tool" &&
      (observation.permissionDecision === "forbidden" ||
        observation.permissionDecision === "denied"),
  ).length;
  return {
    observedCount: count,
    observedValue: count,
    threshold: rule.threshold.count,
    unit: "count",
    status: count >= rule.threshold.count ? "triggered" : "clear",
    reason: null,
  };
}

function costFacts(rule: AlertRule, observations: readonly Observation[]): EvaluationFacts {
  if (rule.id !== "cost_spike") throw new Error("Unexpected rule.");
  const relevant = observations.filter((observation) => observation.layer === "model");
  if (relevant.length === 0) {
    return {
      observedCount: 0,
      observedValue: null,
      threshold: rule.threshold.usd,
      unit: "usd",
      status: "unavailable",
      reason: "required_observation_missing",
    };
  }
  if (
    relevant.some(
      (observation) => observation.layer === "model" && observation.cost.status !== "available",
    )
  ) {
    return {
      observedCount: relevant.length,
      observedValue: null,
      threshold: rule.threshold.usd,
      unit: "usd",
      status: "unavailable",
      reason: "required_measurement_unavailable",
    };
  }
  const total = relevant.reduce(
    (sum, observation) =>
      sum +
      (observation.layer === "model" && observation.cost.status === "available"
        ? observation.cost.value
        : 0),
    0,
  );
  return {
    observedCount: relevant.length,
    observedValue: total,
    threshold: rule.threshold.usd,
    unit: "usd",
    status: total >= rule.threshold.usd ? "triggered" : "clear",
    reason: null,
  };
}

function dependencyFacts(rule: AlertRule, observations: readonly Observation[]): EvaluationFacts {
  if (rule.id !== "unavailable_dependency") throw new Error("Unexpected rule.");
  const service = observations.filter((observation) => observation.layer === "service");
  const dependencyCount = service.reduce(
    (count, observation) =>
      count + (observation.layer === "service" ? observation.dependencies.length : 0),
    0,
  );
  if (service.length === 0 || dependencyCount === 0) {
    return {
      observedCount: 0,
      observedValue: null,
      threshold: rule.threshold.count,
      unit: "count",
      status: "unavailable",
      reason: "required_observation_missing",
    };
  }
  const count = service.reduce(
    (total, observation) =>
      total +
      (observation.layer === "service"
        ? observation.dependencies.filter((dependency) => dependency.state === "unavailable").length
        : 0),
    0,
  );
  return {
    observedCount: dependencyCount,
    observedValue: count,
    threshold: rule.threshold.count,
    unit: "count",
    status: count >= rule.threshold.count ? "triggered" : "clear",
    reason: null,
  };
}

function storageFacts(rule: AlertRule, observations: readonly Observation[]): EvaluationFacts {
  if (rule.id !== "storage_pressure") throw new Error("Unexpected rule.");
  const service = observations.filter((observation) => observation.layer === "service");
  if (service.length === 0) {
    return {
      observedCount: 0,
      observedValue: null,
      threshold: rule.threshold.percent,
      unit: "percent",
      status: "unavailable",
      reason: "required_observation_missing",
    };
  }
  const ratios: number[] = [];
  for (const observation of service) {
    if (
      observation.layer !== "service" ||
      observation.storageUsed.status !== "available" ||
      observation.storageCapacity.status !== "available" ||
      observation.storageCapacity.value === 0
    ) {
      return {
        observedCount: service.length,
        observedValue: null,
        threshold: rule.threshold.percent,
        unit: "percent",
        status: "unavailable",
        reason: "required_measurement_unavailable",
      };
    }
    ratios.push((observation.storageUsed.value / observation.storageCapacity.value) * 100);
  }
  const maximum = Math.max(...ratios);
  return {
    observedCount: service.length,
    observedValue: maximum,
    threshold: rule.threshold.percent,
    unit: "percent",
    status: maximum >= rule.threshold.percent ? "triggered" : "clear",
    reason: null,
  };
}

function queueFacts(rule: AlertRule, observations: readonly Observation[]): EvaluationFacts {
  if (rule.id !== "queue_pressure") throw new Error("Unexpected rule.");
  const service = observations.filter((observation) => observation.layer === "service");
  if (service.length === 0) {
    return {
      observedCount: 0,
      observedValue: null,
      threshold: rule.threshold.count,
      unit: "count",
      status: "unavailable",
      reason: "required_observation_missing",
    };
  }
  if (
    service.every(
      (observation) =>
        observation.layer === "service" && observation.queueDepth.status === "not_applicable",
    )
  ) {
    return {
      observedCount: service.length,
      observedValue: null,
      threshold: rule.threshold.count,
      unit: "count",
      status: "not_applicable",
      reason: "queue_not_configured",
    };
  }
  if (
    service.some(
      (observation) =>
        observation.layer !== "service" || observation.queueDepth.status !== "available",
    )
  ) {
    return {
      observedCount: service.length,
      observedValue: null,
      threshold: rule.threshold.count,
      unit: "count",
      status: "unavailable",
      reason: "required_measurement_unavailable",
    };
  }
  const maximum = Math.max(
    ...service.map((observation) =>
      observation.layer === "service" && observation.queueDepth.status === "available"
        ? observation.queueDepth.value
        : 0,
    ),
  );
  return {
    observedCount: service.length,
    observedValue: maximum,
    threshold: rule.threshold.count,
    unit: "count",
    status: maximum >= rule.threshold.count ? "triggered" : "clear",
    reason: null,
  };
}

function factsFor(rule: AlertRule, observations: readonly Observation[]): EvaluationFacts {
  switch (rule.id) {
    case "repeated_task_failure":
      return repeatedFailureFacts(rule, observations);
    case "stuck_run":
      return stuckRunFacts(rule, observations);
    case "dangerous_permission_attempt":
      return permissionFacts(rule, observations);
    case "cost_spike":
      return costFacts(rule, observations);
    case "unavailable_dependency":
      return dependencyFacts(rule, observations);
    case "storage_pressure":
      return storageFacts(rule, observations);
    case "queue_pressure":
      return queueFacts(rule, observations);
  }
}

function isSuppressed(rule: AlertRule, evaluationAt: string): boolean {
  if (rule.suppression.kind !== "cooldown" || rule.suppression.lastTriggeredAt === null) {
    return false;
  }
  return (
    Date.parse(evaluationAt) - Date.parse(rule.suppression.lastTriggeredAt) <
    rule.suppression.durationMs
  );
}

function resultFor(
  rule: AlertRule,
  observations: readonly Observation[],
  evaluationAt: string,
): AlertResult {
  const facts = factsFor(rule, observations);
  const status =
    facts.status === "triggered" && isSuppressed(rule, evaluationAt)
      ? ("suppressed" as const)
      : facts.status;
  return {
    ruleId: rule.id,
    severity: rule.severity,
    status,
    evidenceSource: rule.evidenceSource,
    operatorAction: rule.operatorAction,
    suppression: rule.suppression,
    evidence: {
      source: rule.evidenceSource,
      observedCount: facts.observedCount,
      observedValue: facts.observedValue,
      threshold: facts.threshold,
      unit: facts.unit,
      reason: facts.reason,
    },
  };
}

const resultPolicy: Readonly<
  Record<
    AlertResult["ruleId"],
    Readonly<{
      source: AlertResult["evidenceSource"];
      action: AlertResult["operatorAction"];
      unit: AlertResult["evidence"]["unit"];
      unavailableReasons: readonly AlertResult["evidence"]["reason"][];
      notApplicable: boolean;
    }>
  >
> = Object.freeze({
  repeated_task_failure: {
    source: "run_outcome",
    action: "inspect_run_reports",
    unit: "count",
    unavailableReasons: [],
    notApplicable: false,
  },
  stuck_run: {
    source: "run_duration",
    action: "stop_new_requests_and_inspect_run",
    unit: "milliseconds",
    unavailableReasons: ["required_measurement_unavailable"],
    notApplicable: false,
  },
  dangerous_permission_attempt: {
    source: "tool_permission_decision",
    action: "preserve_evidence_and_escalate",
    unit: "count",
    unavailableReasons: [],
    notApplicable: false,
  },
  cost_spike: {
    source: "model_cost",
    action: "stop_new_requests_and_inspect_usage",
    unit: "usd",
    unavailableReasons: ["required_observation_missing", "required_measurement_unavailable"],
    notApplicable: false,
  },
  unavailable_dependency: {
    source: "dependency_state",
    action: "inspect_dependency",
    unit: "count",
    unavailableReasons: ["required_observation_missing"],
    notApplicable: false,
  },
  storage_pressure: {
    source: "storage_utilization",
    action: "stop_new_requests_and_inspect_storage",
    unit: "percent",
    unavailableReasons: ["required_observation_missing", "required_measurement_unavailable"],
    notApplicable: false,
  },
  queue_pressure: {
    source: "queue_depth",
    action: "inspect_queue",
    unit: "count",
    unavailableReasons: ["required_observation_missing", "required_measurement_unavailable"],
    notApplicable: true,
  },
});

function hasActiveSuppression(result: AlertResult, evaluatedAt: string): boolean {
  if (result.suppression.kind !== "cooldown" || result.suppression.lastTriggeredAt === null) {
    return false;
  }
  if (!isCanonicalTimestamp(result.suppression.lastTriggeredAt)) return false;
  const elapsed = Date.parse(evaluatedAt) - Date.parse(result.suppression.lastTriggeredAt);
  return elapsed >= 0 && elapsed < result.suppression.durationMs;
}

function hasValidEvidenceRange(result: AlertResult): boolean {
  const value = result.evidence.observedValue;
  const threshold = result.evidence.threshold;
  switch (result.ruleId) {
    case "repeated_task_failure":
      return (
        Number.isSafeInteger(threshold) &&
        threshold >= 2 &&
        threshold <= 100 &&
        (value === null || (Number.isSafeInteger(value) && value === result.evidence.observedCount))
      );
    case "stuck_run":
      return (
        Number.isSafeInteger(threshold) &&
        threshold >= 1_000 &&
        threshold <= MAX_ALERT_WINDOW_MS &&
        (value === null || Number.isSafeInteger(value))
      );
    case "dangerous_permission_attempt":
      return (
        Number.isSafeInteger(threshold) &&
        threshold >= 1 &&
        threshold <= 100 &&
        (value === null || (Number.isSafeInteger(value) && value === result.evidence.observedCount))
      );
    case "cost_spike":
      return threshold >= 0.000001 && threshold <= 1_000_000;
    case "unavailable_dependency":
      return (
        Number.isSafeInteger(threshold) &&
        threshold >= 1 &&
        threshold <= 100 &&
        (value === null || (Number.isSafeInteger(value) && value <= result.evidence.observedCount))
      );
    case "storage_pressure":
      return (
        Number.isSafeInteger(threshold) &&
        threshold >= 1 &&
        threshold <= 100 &&
        (value === null || value <= 100)
      );
    case "queue_pressure":
      return (
        Number.isSafeInteger(threshold) &&
        threshold >= 1 &&
        threshold <= 1_000_000 &&
        (value === null || Number.isSafeInteger(value))
      );
  }
}

function hasValidResultSemantics(result: AlertResult, evaluatedAt: string): boolean {
  const policy = resultPolicy[result.ruleId];
  if (
    result.evidenceSource !== policy.source ||
    result.evidence.source !== policy.source ||
    result.operatorAction !== policy.action ||
    result.evidence.unit !== policy.unit ||
    !hasValidEvidenceRange(result)
  ) {
    return false;
  }
  if (
    result.suppression.kind === "cooldown" &&
    result.suppression.lastTriggeredAt !== null &&
    (!isCanonicalTimestamp(result.suppression.lastTriggeredAt) ||
      Date.parse(result.suppression.lastTriggeredAt) > Date.parse(evaluatedAt))
  ) {
    return false;
  }
  const activeSuppression = hasActiveSuppression(result, evaluatedAt);
  if (result.status === "unavailable") {
    return (
      result.evidence.observedValue === null &&
      policy.unavailableReasons.includes(result.evidence.reason)
    );
  }
  if (result.status === "not_applicable") {
    return (
      policy.notApplicable &&
      result.evidence.observedValue === null &&
      result.evidence.reason === "queue_not_configured"
    );
  }
  if (result.evidence.reason !== null) return false;
  if (result.status === "clear") {
    if (result.evidence.observedValue === null) {
      return result.ruleId === "stuck_run" && result.evidence.observedCount === 0;
    }
    return result.evidence.observedValue < result.evidence.threshold;
  }
  if (result.evidence.observedValue === null) return false;
  if (result.evidence.observedValue < result.evidence.threshold) return false;
  return result.status === "suppressed" ? activeSuppression : !activeSuppression;
}

function hasValidEvaluationSemantics(evaluation: AlertEvaluation): boolean {
  if (
    !isCanonicalTimestamp(evaluation.evaluatedAt) ||
    !isCanonicalTimestamp(evaluation.window.startedAt) ||
    !isCanonicalTimestamp(evaluation.window.endedAt) ||
    evaluation.window.endedAt !== evaluation.evaluatedAt
  ) {
    return false;
  }
  const start = Date.parse(evaluation.window.startedAt);
  const end = Date.parse(evaluation.window.endedAt);
  if (start > end || end - start > MAX_ALERT_WINDOW_MS) return false;
  const identifiers = new Set(evaluation.results.map((result) => result.ruleId));
  return (
    identifiers.size === evaluation.results.length &&
    evaluation.results.every((result) => hasValidResultSemantics(result, evaluation.evaluatedAt))
  );
}

export function isAlertEvaluation(value: unknown): value is AlertEvaluation {
  const candidate = cloneDataTree(value);
  try {
    return (
      evaluationValidator.Check(candidate) &&
      hasValidEvaluationSemantics(candidate as AlertEvaluation)
    );
  } catch {
    return false;
  }
}

export function evaluateAlerts(input: unknown): AlertEvaluationOutcome {
  const candidate = cloneDataTree(input);
  try {
    if (!requestValidator.Check(candidate)) return invalidOutcome();
    const request = candidate as AlertEvaluationRequest;
    if (!hasValidRequestSemantics(request)) return invalidOutcome();
    const start = Date.parse(request.window.startedAt);
    const end = Date.parse(request.window.endedAt);
    const observations = request.observations.filter((observation) =>
      inWindow(observation, start, end),
    );
    const evaluation: AlertEvaluation = {
      schemaVersion: ALERT_SCHEMA_VERSION,
      evaluatedAt: request.evaluationAt,
      window: request.window,
      results: request.rules.map((rule) => resultFor(rule, observations, request.evaluationAt)),
    };
    if (!isAlertEvaluation(evaluation)) return invalidOutcome();
    return Object.freeze({ ok: true as const, value: deepFreeze(evaluation) });
  } catch {
    return invalidOutcome();
  }
}
