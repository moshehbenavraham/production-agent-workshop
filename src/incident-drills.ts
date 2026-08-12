import { isDeepStrictEqual } from "node:util";
import { Type } from "typebox";
import Schema from "typebox/schema";
import {
  ALERT_SCHEMA_VERSION,
  AlertResultSchema,
  DEFAULT_ALERT_RULES,
  evaluateAlerts,
  type AlertResult,
  type AlertRule,
} from "./alerts.js";
import {
  OBSERVATION_SCHEMA_VERSION,
  createObservation,
  makeAvailableMeasurement,
  makeNotApplicableMeasurement,
  makeUnavailableMeasurement,
  type Observation,
  type RunObservation,
  type ServiceObservation,
} from "./observability.js";
import { PRODUCTION_EVAL_SUITE } from "./production-eval-golden-set.js";
import {
  executeProductionEvalCaseWithReport,
  type ProductionEvalCaseReportEvidence,
} from "./production-eval-harness.js";
import {
  ProductionEvalCostMetricSchema,
  ProductionEvalEventTypeSchema,
  ProductionEvalLatencyMetricSchema,
  ProductionEvalOutcomeExpectationSchema,
  ProductionEvalPermissionExpectationSchema,
  ProductionEvalRecoveryExpectationSchema,
  ProductionEvalTokenMetricSchema,
  type ProductionEvalCase,
  type ProductionEvalEventType,
} from "./production-eval.js";
import { scoreProductionEvalCase } from "./production-eval-runner.js";
import { isRunReport, RunReportSchema, type RunReport } from "./run-report.js";

export const INCIDENT_DRILL_SCHEMA_VERSION = 1 as const;
export const INCIDENT_DRILL_SUITE_ID = "incident_drills_v1" as const;

export const IncidentDrillIdSchema = Type.Union([
  Type.Literal("tool_timeout"),
  Type.Literal("invalid_model_response"),
  Type.Literal("mid_run_restart"),
  Type.Literal("revoked_credential"),
  Type.Literal("duplicate_request"),
]);

const IncidentRunbookActionSchema = Type.Union([Type.Literal("resume"), Type.Literal("stop")]);

const IncidentAlertExpectationSchema = Type.Object(
  {
    ruleId: Type.Union([
      Type.Literal("repeated_task_failure"),
      Type.Literal("unavailable_dependency"),
    ]),
    status: Type.Union([Type.Literal("clear"), Type.Literal("triggered")]),
  },
  { additionalProperties: false },
);

const IncidentReportExpectationSchema = Type.Object(
  {
    status: Type.Union([
      Type.Literal("waiting_for_approval"),
      Type.Literal("effect_indeterminate"),
      Type.Literal("stopped"),
    ]),
    latestSafeCheckpoint: Type.Union([
      Type.Literal("run_started"),
      Type.Literal("approval_requested"),
    ]),
    terminalKind: Type.Union([Type.Literal("completed"), Type.Literal("stopped")]),
    terminalStopReason: Type.Union([
      Type.Literal("approval_pending"),
      Type.Literal("qualification_failed"),
      Type.Literal("dependency_failed"),
    ]),
  },
  { additionalProperties: false },
);

export const IncidentDrillDefinitionSchema = Type.Object(
  {
    schemaVersion: Type.Literal(INCIDENT_DRILL_SCHEMA_VERSION),
    id: IncidentDrillIdSchema,
    caseId: Type.Union([
      Type.Literal("eval_qualification_timeout"),
      Type.Literal("eval_invalid_model_output"),
      Type.Literal("eval_restart_after_approval"),
      Type.Literal("eval_revoked_provider_credential"),
      Type.Literal("eval_duplicate_fake_request"),
    ]),
    expectedEvents: Type.Array(ProductionEvalEventTypeSchema, {
      minItems: 2,
      maxItems: 20,
    }),
    expectedOutcome: ProductionEvalOutcomeExpectationSchema,
    expectedPermission: ProductionEvalPermissionExpectationSchema,
    expectedRecovery: ProductionEvalRecoveryExpectationSchema,
    expectedReport: IncidentReportExpectationSchema,
    expectedAlert: IncidentAlertExpectationSchema,
    runbookAction: IncidentRunbookActionSchema,
    operatorSteps: Type.Integer({ minimum: 1, maximum: 10 }),
  },
  { additionalProperties: false },
);

const IncidentBaselineSchema = Type.Object(
  {
    success: Type.Object(
      { status: Type.Literal("available"), value: Type.Boolean() },
      { additionalProperties: false },
    ),
    failureCategory: Type.Object(
      {
        status: Type.Literal("available"),
        value: Type.Union([
          Type.String({ minLength: 1, maxLength: 80, pattern: "^[a-z0-9_.-]+$" }),
          Type.Null(),
        ]),
      },
      { additionalProperties: false },
    ),
    latency: ProductionEvalLatencyMetricSchema,
    tokens: ProductionEvalTokenMetricSchema,
    cost: ProductionEvalCostMetricSchema,
    explainability: Type.Object(
      {
        status: Type.Literal("available"),
        timelineEvents: Type.Integer({ minimum: 1, maximum: 1_000 }),
      },
      { additionalProperties: false },
    ),
    operationalComplexity: Type.Object(
      {
        status: Type.Literal("available"),
        operatorSteps: Type.Integer({ minimum: 1, maximum: 10 }),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

export const IncidentDrillResultSchema = Type.Object(
  {
    schemaVersion: Type.Literal(INCIDENT_DRILL_SCHEMA_VERSION),
    drillId: IncidentDrillIdSchema,
    caseId: Type.String({ minLength: 8, maxLength: 120, pattern: "^eval_[a-z0-9_]+$" }),
    status: Type.Literal("pass"),
    score: Type.Object(
      {
        criticalPassed: Type.Literal(true),
        criticalFailures: Type.Array(Type.String({ minLength: 1, maxLength: 80 }), {
          maxItems: 0,
        }),
      },
      { additionalProperties: false },
    ),
    outcome: ProductionEvalOutcomeExpectationSchema,
    permission: ProductionEvalPermissionExpectationSchema,
    recovery: ProductionEvalRecoveryExpectationSchema,
    report: RunReportSchema,
    alert: AlertResultSchema,
    runbookAction: IncidentRunbookActionSchema,
    baseline: IncidentBaselineSchema,
  },
  { additionalProperties: false },
);

export const IncidentDrillSuiteSchema = Type.Object(
  {
    schemaVersion: Type.Literal(INCIDENT_DRILL_SCHEMA_VERSION),
    suiteId: Type.Literal(INCIDENT_DRILL_SUITE_ID),
    status: Type.Literal("pass"),
    results: Type.Array(IncidentDrillResultSchema, { minItems: 5, maxItems: 5 }),
  },
  { additionalProperties: false },
);

export const IncidentDrillFailureSchema = Type.Object(
  {
    code: Type.Union([
      Type.Literal("invalid_drill"),
      Type.Literal("drill_execution_failed"),
      Type.Literal("drill_evidence_mismatch"),
    ]),
    drillId: Type.Union([IncidentDrillIdSchema, Type.Null()]),
    message: Type.Union([
      Type.Literal("Incident drill selection is invalid."),
      Type.Literal("Incident drill execution failed."),
      Type.Literal("Incident drill evidence did not match its manifest."),
    ]),
  },
  { additionalProperties: false },
);

export type IncidentDrillId = Type.Static<typeof IncidentDrillIdSchema>;
export type IncidentDrillDefinition = Type.Static<typeof IncidentDrillDefinitionSchema>;
export type IncidentDrillResult = Type.Static<typeof IncidentDrillResultSchema>;
export type IncidentDrillSuite = Type.Static<typeof IncidentDrillSuiteSchema>;
export type IncidentDrillFailure = Type.Static<typeof IncidentDrillFailureSchema>;
type IncidentDrillFailureOutcome = Readonly<{ ok: false; error: IncidentDrillFailure }>;
export type IncidentDrillOutcome =
  | Readonly<{ ok: true; value: IncidentDrillResult }>
  | IncidentDrillFailureOutcome;
export type IncidentDrillSuiteOutcome =
  | Readonly<{ ok: true; value: IncidentDrillSuite }>
  | IncidentDrillFailureOutcome;

const approvalPendingEvents = [
  "run.started",
  "qualification.attempted",
  "qualification.completed",
  "domain.follow_up_drafted",
  "approval.requested",
  "run.completed",
] as const satisfies readonly ProductionEvalEventType[];

export const INCIDENT_DRILL_DEFINITIONS: readonly IncidentDrillDefinition[] = deepFreeze([
  {
    schemaVersion: INCIDENT_DRILL_SCHEMA_VERSION,
    id: "tool_timeout",
    caseId: "eval_qualification_timeout",
    expectedEvents: [
      "run.started",
      "qualification.attempted",
      "qualification.failed",
      "run.completed",
    ],
    expectedOutcome: {
      kind: "stop",
      code: "qualification_timeout",
      stopReason: "qualification_failed",
    },
    expectedPermission: { decision: "not_evaluated", approvalState: null, effectCount: 0 },
    expectedRecovery: { action: null, checkpoint: null },
    expectedReport: {
      status: "stopped",
      latestSafeCheckpoint: "run_started",
      terminalKind: "completed",
      terminalStopReason: "qualification_failed",
    },
    expectedAlert: { ruleId: "repeated_task_failure", status: "clear" },
    runbookAction: "stop",
    operatorSteps: 4,
  },
  {
    schemaVersion: INCIDENT_DRILL_SCHEMA_VERSION,
    id: "invalid_model_response",
    caseId: "eval_invalid_model_output",
    expectedEvents: ["run.started", "run.stopped"],
    expectedOutcome: {
      kind: "stop",
      code: "invalid_model_output",
      stopReason: "dependency_failed",
    },
    expectedPermission: { decision: "not_evaluated", approvalState: null, effectCount: 0 },
    expectedRecovery: { action: null, checkpoint: null },
    expectedReport: {
      status: "stopped",
      latestSafeCheckpoint: "run_started",
      terminalKind: "stopped",
      terminalStopReason: "dependency_failed",
    },
    expectedAlert: { ruleId: "repeated_task_failure", status: "clear" },
    runbookAction: "stop",
    operatorSteps: 4,
  },
  {
    schemaVersion: INCIDENT_DRILL_SCHEMA_VERSION,
    id: "mid_run_restart",
    caseId: "eval_restart_after_approval",
    expectedEvents: [...approvalPendingEvents],
    expectedOutcome: {
      kind: "success",
      code: "approval_pending",
      stopReason: "approval_pending",
    },
    expectedPermission: { decision: "not_evaluated", approvalState: "pending", effectCount: 0 },
    expectedRecovery: { action: "resume", checkpoint: "approval_requested" },
    expectedReport: {
      status: "waiting_for_approval",
      latestSafeCheckpoint: "approval_requested",
      terminalKind: "completed",
      terminalStopReason: "approval_pending",
    },
    expectedAlert: { ruleId: "repeated_task_failure", status: "clear" },
    runbookAction: "resume",
    operatorSteps: 5,
  },
  {
    schemaVersion: INCIDENT_DRILL_SCHEMA_VERSION,
    id: "revoked_credential",
    caseId: "eval_revoked_provider_credential",
    expectedEvents: ["run.started", "run.stopped"],
    expectedOutcome: {
      kind: "stop",
      code: "dependency_failed",
      stopReason: "dependency_failed",
    },
    expectedPermission: { decision: "not_evaluated", approvalState: null, effectCount: 0 },
    expectedRecovery: { action: null, checkpoint: null },
    expectedReport: {
      status: "stopped",
      latestSafeCheckpoint: "run_started",
      terminalKind: "stopped",
      terminalStopReason: "dependency_failed",
    },
    expectedAlert: { ruleId: "unavailable_dependency", status: "triggered" },
    runbookAction: "stop",
    operatorSteps: 5,
  },
  {
    schemaVersion: INCIDENT_DRILL_SCHEMA_VERSION,
    id: "duplicate_request",
    caseId: "eval_duplicate_fake_request",
    expectedEvents: [
      ...approvalPendingEvents,
      "approval.approved",
      "fake_send.attempted",
      "fake_send.accepted",
      "fake_send.duplicate",
    ],
    expectedOutcome: { kind: "success", code: "duplicate", stopReason: "completed" },
    expectedPermission: { decision: "allow", approvalState: "approved", effectCount: 1 },
    expectedRecovery: { action: null, checkpoint: null },
    expectedReport: {
      status: "effect_indeterminate",
      latestSafeCheckpoint: "approval_requested",
      terminalKind: "completed",
      terminalStopReason: "approval_pending",
    },
    expectedAlert: { ruleId: "repeated_task_failure", status: "clear" },
    runbookAction: "stop",
    operatorSteps: 4,
  },
]);

const definitionValidator = Schema.Compile(IncidentDrillDefinitionSchema);
const resultValidator = Schema.Compile(IncidentDrillResultSchema);
const suiteValidator = Schema.Compile(IncidentDrillSuiteSchema);

function definitionMatchesGolden(definition: IncidentDrillDefinition): boolean {
  const caseDefinition = caseFor(definition);
  return (
    caseDefinition !== undefined &&
    isDeepStrictEqual(caseDefinition.expectation.eventOrder.events, definition.expectedEvents) &&
    isDeepStrictEqual(caseDefinition.expectation.outcome, definition.expectedOutcome) &&
    isDeepStrictEqual(caseDefinition.expectation.permission, definition.expectedPermission) &&
    isDeepStrictEqual(caseDefinition.expectation.recovery, definition.expectedRecovery)
  );
}

if (
  !INCIDENT_DRILL_DEFINITIONS.every(
    (definition) => definitionValidator.Check(definition) && definitionMatchesGolden(definition),
  ) ||
  new Set(INCIDENT_DRILL_DEFINITIONS.map((definition) => definition.id)).size !== 5 ||
  new Set(INCIDENT_DRILL_DEFINITIONS.map((definition) => definition.caseId)).size !== 5
) {
  throw new Error("Incident drill manifest is invalid.");
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function hasDataOnlyGraph(value: unknown, seen = new WeakSet<object>()): boolean {
  if (value === null || typeof value !== "object") return true;
  if (seen.has(value)) return true;
  seen.add(value);
  try {
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor)) return false;
      if (!hasDataOnlyGraph(descriptor.value, seen)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

function cloneData<T>(value: T): T | null {
  if (!hasDataOnlyGraph(value)) return null;
  try {
    return structuredClone(value);
  } catch {
    return null;
  }
}

function failure(
  code: IncidentDrillFailure["code"],
  drillId: IncidentDrillId | null,
): IncidentDrillFailureOutcome {
  const message =
    code === "invalid_drill"
      ? "Incident drill selection is invalid."
      : code === "drill_execution_failed"
        ? "Incident drill execution failed."
        : "Incident drill evidence did not match its manifest.";
  return Object.freeze({
    ok: false as const,
    error: Object.freeze({ code, drillId, message }),
  });
}

function definitionFor(input: unknown): IncidentDrillDefinition | undefined {
  if (typeof input !== "string") return undefined;
  return INCIDENT_DRILL_DEFINITIONS.find((definition) => definition.id === input);
}

function caseFor(definition: IncidentDrillDefinition): ProductionEvalCase | undefined {
  return PRODUCTION_EVAL_SUITE.cases.find((candidate) => candidate.id === definition.caseId);
}

function errorCategory(definition: IncidentDrillDefinition): RunObservation["errorCategory"] {
  if (definition.id === "tool_timeout") return "timeout";
  if (definition.id === "invalid_model_response") return "invalid_response";
  if (definition.id === "revoked_credential") return "dependency_failed";
  return null;
}

function runObservation(
  definition: IncidentDrillDefinition,
  evidence: ProductionEvalCaseReportEvidence,
): Observation | null {
  const report = evidence.report;
  const finalEntry = report.timeline.at(-1);
  if (!finalEntry) return null;
  const outcome: RunObservation["outcome"] =
    definition.id === "mid_run_restart"
      ? "pending"
      : definition.expectedOutcome.kind === "success"
        ? "completed"
        : "stopped";
  const stepNumbers = new Set(
    report.timeline.flatMap((entry) => (entry.stepNumber === null ? [] : [entry.stepNumber])),
  );
  const created = createObservation({
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    at: finalEntry.at,
    environment: "test",
    applicationVersion: finalEntry.applicationVersion,
    layer: "run",
    kind: "run.lifecycle",
    runId: report.runId,
    outcome,
    stopReason: definition.expectedOutcome.stopReason,
    duration: report.metrics.elapsedDuration,
    stepCount: makeAvailableMeasurement(stepNumbers.size, "count"),
    retryCount: report.metrics.maxRetryCount,
    errorCategory: errorCategory(definition),
  });
  return created.ok ? created.value : null;
}

function dependencyObservation(report: RunReport, at: string): ServiceObservation | null {
  const applicationVersion = report.timeline[0]?.applicationVersion;
  if (!applicationVersion) return null;
  const created = createObservation({
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    at,
    environment: "test",
    applicationVersion,
    layer: "service",
    kind: "service.snapshot",
    uptime: makeUnavailableMeasurement("unsupported"),
    memoryRss: makeUnavailableMeasurement("unsupported"),
    memoryHeapUsed: makeUnavailableMeasurement("unsupported"),
    cpuUser: makeUnavailableMeasurement("unsupported"),
    cpuSystem: makeUnavailableMeasurement("unsupported"),
    storageUsed: makeNotApplicableMeasurement("not_configured"),
    storageCapacity: makeNotApplicableMeasurement("not_configured"),
    queueDepth: makeNotApplicableMeasurement("not_configured"),
    dependencies: [
      {
        id: "synthetic_provider",
        state: "unavailable",
        duration: makeUnavailableMeasurement("dependency_unavailable"),
        errorCategory: "dependency_failed",
      },
    ],
  });
  return created.ok && created.value.layer === "service" ? created.value : null;
}

function alertRule(
  ruleId: IncidentDrillDefinition["expectedAlert"]["ruleId"],
): AlertRule | undefined {
  return DEFAULT_ALERT_RULES.find((rule) => rule.id === ruleId);
}

function expectedAlertValue(definition: IncidentDrillDefinition): number {
  if (definition.id === "revoked_credential") return 2;
  if (definition.id === "mid_run_restart" || definition.id === "duplicate_request") return 0;
  return 1;
}

function hasExpectedAlert(definition: IncidentDrillDefinition, alert: AlertResult): boolean {
  const rule = alertRule(definition.expectedAlert.ruleId);
  if (!rule || !("count" in rule.threshold)) return false;
  const value = expectedAlertValue(definition);
  return (
    alert.ruleId === definition.expectedAlert.ruleId &&
    alert.status === definition.expectedAlert.status &&
    alert.severity === rule.severity &&
    alert.evidenceSource === rule.evidenceSource &&
    alert.operatorAction === rule.operatorAction &&
    isDeepStrictEqual(alert.suppression, rule.suppression) &&
    alert.evidence.source === rule.evidenceSource &&
    alert.evidence.observedCount === value &&
    alert.evidence.observedValue === value &&
    alert.evidence.threshold === rule.threshold.count &&
    alert.evidence.unit === "count" &&
    alert.evidence.reason === null
  );
}

function evaluateDrillAlert(
  definition: IncidentDrillDefinition,
  evidence: ProductionEvalCaseReportEvidence,
): AlertResult | undefined {
  const run = runObservation(definition, evidence);
  const rule = alertRule(definition.expectedAlert.ruleId);
  const first = evidence.report.timeline[0];
  const last = evidence.report.timeline.at(-1);
  if (!run || !rule || !first || !last) return undefined;
  const observations: Observation[] = [run];
  if (definition.id === "revoked_credential") {
    const firstDependency = dependencyObservation(evidence.report, first.at);
    const lastDependency = dependencyObservation(evidence.report, last.at);
    if (!firstDependency || !lastDependency) return undefined;
    observations.push(firstDependency, lastDependency);
  }
  const evaluated = evaluateAlerts({
    schemaVersion: ALERT_SCHEMA_VERSION,
    evaluationAt: last.at,
    window: { startedAt: first.at, endedAt: last.at },
    rules: [rule],
    observations,
  });
  return evaluated.ok ? evaluated.value.results[0] : undefined;
}

function matchesManifest(
  definition: IncidentDrillDefinition,
  evidence: ProductionEvalCaseReportEvidence,
  alert: AlertResult,
): boolean {
  const observation = evidence.observation;
  return (
    evidence.report.runId === `run_${definition.caseId.slice("eval_".length)}` &&
    observation.applicationValues.runId === evidence.report.runId &&
    isDeepStrictEqual(observation.outcome, definition.expectedOutcome) &&
    isDeepStrictEqual(observation.permission, definition.expectedPermission) &&
    isDeepStrictEqual(observation.recovery, definition.expectedRecovery) &&
    isDeepStrictEqual(
      evidence.report.timeline.map((entry) => entry.eventType),
      definition.expectedEvents,
    ) &&
    evidence.report.status === definition.expectedReport.status &&
    evidence.report.latestSafeCheckpoint === definition.expectedReport.latestSafeCheckpoint &&
    evidence.report.terminal?.kind === definition.expectedReport.terminalKind &&
    evidence.report.terminal.stopReason === definition.expectedReport.terminalStopReason &&
    hasExpectedAlert(definition, alert) &&
    observation.output.prohibitedClaimsPresent.length === 0 &&
    observation.output.claims.includes("no_send")
  );
}

function resultFrom(
  definition: IncidentDrillDefinition,
  caseDefinition: ProductionEvalCase,
  evidence: ProductionEvalCaseReportEvidence,
  alert: AlertResult,
): IncidentDrillResult {
  const score = scoreProductionEvalCase(
    caseDefinition,
    evidence.observation,
    PRODUCTION_EVAL_SUITE,
  );
  if (score?.status !== "pass" || !score.score.critical.passed) {
    throw new Error("Incident drill score did not pass.");
  }
  const outcome = evidence.observation.outcome;
  return {
    schemaVersion: INCIDENT_DRILL_SCHEMA_VERSION,
    drillId: definition.id,
    caseId: definition.caseId,
    status: "pass",
    score: { criticalPassed: true, criticalFailures: [] },
    outcome,
    permission: evidence.observation.permission,
    recovery: evidence.observation.recovery,
    report: evidence.report,
    alert,
    runbookAction: definition.runbookAction,
    baseline: {
      success: { status: "available", value: true },
      failureCategory: {
        status: "available",
        value: outcome.kind === "success" ? null : outcome.code,
      },
      latency: evidence.observation.metrics.latency,
      tokens: evidence.observation.metrics.tokens,
      cost: evidence.observation.metrics.cost,
      explainability: {
        status: "available",
        timelineEvents: evidence.report.eventCount,
      },
      operationalComplexity: {
        status: "available",
        operatorSteps: definition.operatorSteps,
      },
    },
  };
}

function hasValidResultSemantics(result: IncidentDrillResult): boolean {
  const definition = definitionFor(result.drillId);
  if (!definition) return false;
  return (
    result.caseId === definition.caseId &&
    isDeepStrictEqual(result.outcome, definition.expectedOutcome) &&
    isDeepStrictEqual(result.permission, definition.expectedPermission) &&
    isDeepStrictEqual(result.recovery, definition.expectedRecovery) &&
    hasExpectedAlert(definition, result.alert) &&
    result.runbookAction === definition.runbookAction &&
    isRunReport(result.report) &&
    result.report.runId === `run_${definition.caseId.slice("eval_".length)}` &&
    isDeepStrictEqual(
      result.report.timeline.map((entry) => entry.eventType),
      definition.expectedEvents,
    ) &&
    result.report.status === definition.expectedReport.status &&
    result.report.latestSafeCheckpoint === definition.expectedReport.latestSafeCheckpoint &&
    result.report.terminal?.kind === definition.expectedReport.terminalKind &&
    result.report.terminal.stopReason === definition.expectedReport.terminalStopReason &&
    result.baseline.explainability.timelineEvents === result.report.eventCount &&
    result.baseline.operationalComplexity.operatorSteps === definition.operatorSteps &&
    result.baseline.failureCategory.value ===
      (result.outcome.kind === "success" ? null : result.outcome.code)
  );
}

export function isIncidentDrillResult(value: unknown): value is IncidentDrillResult {
  const candidate = cloneData(value);
  try {
    return (
      resultValidator.Check(candidate) && hasValidResultSemantics(candidate as IncidentDrillResult)
    );
  } catch {
    return false;
  }
}

export function isIncidentDrillSuite(value: unknown): value is IncidentDrillSuite {
  const candidate = cloneData(value);
  try {
    if (!suiteValidator.Check(candidate)) return false;
    const suite = candidate as IncidentDrillSuite;
    return (
      isDeepStrictEqual(
        suite.results.map((result) => result.drillId),
        INCIDENT_DRILL_DEFINITIONS.map((definition) => definition.id),
      ) && suite.results.every(isIncidentDrillResult)
    );
  } catch {
    return false;
  }
}

export async function runIncidentDrill(input: unknown): Promise<IncidentDrillOutcome> {
  const definition = definitionFor(input);
  if (!definition) return failure("invalid_drill", null);
  const caseDefinition = caseFor(definition);
  if (!caseDefinition) return failure("drill_evidence_mismatch", definition.id);
  let evidence: ProductionEvalCaseReportEvidence;
  try {
    evidence = await executeProductionEvalCaseWithReport(caseDefinition);
  } catch {
    return failure("drill_execution_failed", definition.id);
  }
  const alert = evaluateDrillAlert(definition, evidence);
  if (!alert || !matchesManifest(definition, evidence, alert)) {
    return failure("drill_evidence_mismatch", definition.id);
  }
  try {
    const result = resultFrom(definition, caseDefinition, evidence, alert);
    return isIncidentDrillResult(result)
      ? Object.freeze({ ok: true as const, value: deepFreeze(result) })
      : failure("drill_evidence_mismatch", definition.id);
  } catch {
    return failure("drill_evidence_mismatch", definition.id);
  }
}

export async function runIncidentDrills(): Promise<IncidentDrillSuiteOutcome> {
  const results: IncidentDrillResult[] = [];
  for (const definition of INCIDENT_DRILL_DEFINITIONS) {
    const outcome = await runIncidentDrill(definition.id);
    if (!outcome.ok) return outcome;
    results.push(outcome.value);
  }
  const suite: IncidentDrillSuite = {
    schemaVersion: INCIDENT_DRILL_SCHEMA_VERSION,
    suiteId: INCIDENT_DRILL_SUITE_ID,
    status: "pass",
    results,
  };
  return isIncidentDrillSuite(suite)
    ? Object.freeze({ ok: true as const, value: deepFreeze(suite) })
    : failure("drill_evidence_mismatch", null);
}
