import { isDeepStrictEqual } from "node:util";
import { Type } from "typebox";
import Schema from "typebox/schema";
import {
  CRITICAL_EVAL_DIMENSIONS,
  ProductionEvalBoundedCodeSchema,
  ProductionEvalCostMetricSchema,
  ProductionEvalIdSchema,
  ProductionEvalLatencyMetricSchema,
  ProductionEvalLeadIdSchema,
  ProductionEvalOutcomeExpectationSchema,
  ProductionEvalOutputClaimSchema,
  ProductionEvalPermissionExpectationSchema,
  ProductionEvalProhibitedClaimSchema,
  ProductionEvalRecoveryExpectationSchema,
  ProductionEvalResultSchema,
  ProductionEvalThresholdsSchema,
  ProductionEvalTokenMetricSchema,
  ProductionEvalToolNameSchema,
  ProductionEvalTraceEntrySchema,
  ProductionEvalVersionsSchema,
  isProductionEvalResult,
  validateProductionEvalSuite,
  type ProductionEvalCase,
  type ProductionEvalDimension,
  type ProductionEvalExpectation,
  type ProductionEvalResult,
  type ProductionEvalScalar,
  type ProductionEvalSuite,
} from "./production-eval.js";

const EvalRunIdSchema = Type.String({
  minLength: 16,
  maxLength: 100,
  pattern: "^evalrun_[a-z0-9_-]+$",
});

const IsoTimestampSchema = Type.String({
  minLength: 24,
  maxLength: 30,
  pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\\.[0-9]{3})?Z$",
});

const ObservedArgumentsSchema = Type.Record(
  Type.String({ minLength: 1, maxLength: 80, pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" }),
  Type.Union([Type.String({ maxLength: 10_000 }), Type.Number(), Type.Boolean(), Type.Null()]),
  { maxProperties: 8 },
);

export const ProductionEvalObservedToolCallSchema = Type.Object(
  {
    tool: ProductionEvalToolNameSchema,
    arguments: ObservedArgumentsSchema,
  },
  { additionalProperties: false },
);

const NullableLeadIdSchema = Type.Union([ProductionEvalLeadIdSchema, Type.Null()]);

export const ProductionEvalGroundingObservationSchema = Type.Object(
  {
    requestedLeadId: NullableLeadIdSchema,
    qualificationLeadId: NullableLeadIdSchema,
    draftLeadId: NullableLeadIdSchema,
    fabricated: Type.Boolean(),
  },
  { additionalProperties: false },
);

const ApplicationValuesSchema = Type.Object(
  {
    draftContent: Type.Union([Type.String({ minLength: 20, maxLength: 10_000 }), Type.Null()]),
    approvalId: Type.Union([
      Type.String({ minLength: 12, maxLength: 100, pattern: "^approval_[a-z0-9_-]+$" }),
      Type.Null(),
    ]),
    runId: Type.Union([
      Type.String({ minLength: 6, maxLength: 120, pattern: "^run_[a-z0-9_-]+$" }),
      Type.Null(),
    ]),
  },
  { additionalProperties: false },
);

const OutputObservationSchema = Type.Object(
  {
    claims: Type.Array(ProductionEvalOutputClaimSchema, {
      maxItems: 9,
      uniqueItems: true,
    }),
    prohibitedClaimsPresent: Type.Array(ProductionEvalProhibitedClaimSchema, {
      maxItems: 5,
      uniqueItems: true,
    }),
    responseCode: ProductionEvalBoundedCodeSchema,
  },
  { additionalProperties: false },
);

const OptionalModelGradeSchema = Type.Union([
  Type.Object(
    {
      dimension: Type.Literal("draft_quality"),
      score: Type.Number({ minimum: 0, maximum: 100 }),
      rationaleCode: ProductionEvalBoundedCodeSchema,
    },
    { additionalProperties: false },
  ),
  Type.Null(),
]);

export const ProductionEvalObservationSchema = Type.Object(
  {
    caseId: ProductionEvalIdSchema,
    outcome: ProductionEvalOutcomeExpectationSchema,
    toolCalls: Type.Array(ProductionEvalObservedToolCallSchema, { maxItems: 3 }),
    trace: Type.Array(ProductionEvalTraceEntrySchema, { maxItems: 200 }),
    grounding: ProductionEvalGroundingObservationSchema,
    permission: ProductionEvalPermissionExpectationSchema,
    recovery: ProductionEvalRecoveryExpectationSchema,
    output: OutputObservationSchema,
    applicationValues: ApplicationValuesSchema,
    modelGrade: OptionalModelGradeSchema,
    metrics: Type.Object(
      {
        latency: ProductionEvalLatencyMetricSchema,
        tokens: ProductionEvalTokenMetricSchema,
        cost: ProductionEvalCostMetricSchema,
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const AggregateSchema = Type.Object(
  {
    caseCount: Type.Integer({ minimum: 10, maximum: 20 }),
    passedCases: Type.Integer({ minimum: 0, maximum: 20 }),
    failedCases: Type.Integer({ minimum: 0, maximum: 20 }),
    criticalFailureCount: Type.Integer({ minimum: 0, maximum: 200 }),
    qualityAverage: Type.Union([Type.Number({ minimum: 0, maximum: 100 }), Type.Null()]),
  },
  { additionalProperties: false },
);

export const ProductionEvalArtifactSchema = Type.Object(
  {
    schemaVersion: Type.Literal(1),
    runId: EvalRunIdSchema,
    startedAt: IsoTimestampSchema,
    finishedAt: IsoTimestampSchema,
    suiteId: Type.Literal("production_eval_suite_v1"),
    versions: ProductionEvalVersionsSchema,
    thresholds: ProductionEvalThresholdsSchema,
    status: Type.Union([Type.Literal("pass"), Type.Literal("fail")]),
    aggregate: AggregateSchema,
    results: Type.Array(ProductionEvalResultSchema, { minItems: 10, maxItems: 20 }),
  },
  { additionalProperties: false },
);

export const ProductionEvalArtifactStoreFailureCodeSchema = Type.Union([
  Type.Literal("invalid_artifact"),
  Type.Literal("storage_failure"),
  Type.Literal("corrupt_artifact"),
  Type.Literal("interrupted_artifact"),
  Type.Literal("artifact_conflict"),
]);

const ProductionEvalArtifactStoreFailureSchema = Type.Object(
  {
    code: ProductionEvalArtifactStoreFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 160 }),
  },
  { additionalProperties: false },
);

export const ProductionEvalArtifactAppendOutcomeSchema = Type.Union([
  Type.Object(
    { ok: Type.Literal(true), value: ProductionEvalArtifactSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: ProductionEvalArtifactStoreFailureSchema },
    { additionalProperties: false },
  ),
]);

export const ProductionEvalRunnerFailureCodeSchema = Type.Union([
  Type.Literal("invalid_suite"),
  Type.Literal("invalid_configuration"),
  Type.Literal("invalid_artifact"),
  Type.Literal("persistence_failure"),
]);

const ProductionEvalRunnerFailureSchema = Type.Object(
  {
    code: ProductionEvalRunnerFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 160 }),
  },
  { additionalProperties: false },
);

export const ProductionEvalRunOutcomeSchema = Type.Union([
  Type.Object(
    { ok: Type.Literal(true), value: ProductionEvalArtifactSchema },
    { additionalProperties: false },
  ),
  Type.Object(
    { ok: Type.Literal(false), error: ProductionEvalRunnerFailureSchema },
    { additionalProperties: false },
  ),
]);

export type ProductionEvalObservedToolCall = Type.Static<
  typeof ProductionEvalObservedToolCallSchema
>;
export type ProductionEvalObservation = Type.Static<typeof ProductionEvalObservationSchema>;
export type ProductionEvalArtifact = Type.Static<typeof ProductionEvalArtifactSchema>;
export type ProductionEvalArtifactStoreFailureCode = Type.Static<
  typeof ProductionEvalArtifactStoreFailureCodeSchema
>;
export type ProductionEvalArtifactAppendOutcome = Type.Static<
  typeof ProductionEvalArtifactAppendOutcomeSchema
>;
export type ProductionEvalRunnerFailureCode = Type.Static<
  typeof ProductionEvalRunnerFailureCodeSchema
>;
export type ProductionEvalRunOutcome = Type.Static<typeof ProductionEvalRunOutcomeSchema>;

export type ProductionEvalArtifactStore = {
  append(input: unknown): unknown;
};

export type ProductionEvalCaseExecutor = (
  caseDefinition: ProductionEvalCase,
) => unknown | Promise<unknown>;

export type ProductionEvalRunnerOptions = {
  suite: ProductionEvalSuite;
  executeCase: ProductionEvalCaseExecutor;
  artifactStore: ProductionEvalArtifactStore;
  makeRunId?: () => string;
  now?: () => string;
};

type NormalizedRunnerOptions = {
  suite: ProductionEvalSuite;
  executeCase: ProductionEvalCaseExecutor;
  appendArtifact(input: unknown): unknown;
  makeRunId: () => string;
  now: () => string;
};

const observationValidator = Schema.Compile(ProductionEvalObservationSchema);
const artifactValidator = Schema.Compile(ProductionEvalArtifactSchema);
const appendOutcomeValidator = Schema.Compile(ProductionEvalArtifactAppendOutcomeSchema);
const runOutcomeValidator = Schema.Compile(ProductionEvalRunOutcomeSchema);

const storeFailureMessages: Readonly<Record<ProductionEvalArtifactStoreFailureCode, string>> =
  Object.freeze({
    invalid_artifact: "Production eval artifact is invalid.",
    storage_failure: "Production eval artifact storage failed.",
    corrupt_artifact: "Production eval artifact storage contains corrupt data.",
    interrupted_artifact: "Production eval artifact storage contains an interrupted write.",
    artifact_conflict: "Production eval artifact identity conflicts with durable data.",
  });

const runnerFailureMessages: Readonly<Record<ProductionEvalRunnerFailureCode, string>> =
  Object.freeze({
    invalid_suite: "Production eval runner requires a valid suite.",
    invalid_configuration: "Production eval runner configuration is invalid.",
    invalid_artifact: "Production eval runner produced an invalid artifact.",
    persistence_failure: "Production eval artifact could not be proven durable.",
  });

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function cloneUnknown(value: unknown): unknown {
  try {
    return structuredClone(value);
  } catch {
    return undefined;
  }
}

function isIsoTimestamp(value: string): boolean {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function evidence(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value.slice(0, 160);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "unavailable";
}

function expectedRequestLeadId(caseDefinition: ProductionEvalCase): string | null {
  const request = caseDefinition.fixture.request;
  if (request.kind === "lead" || request.kind === "adversarial") return request.leadId;
  if (request.kind === "ambiguous") return request.fixtureId;
  return null;
}

function metricTotalsAreValid(observation: ProductionEvalObservation): boolean {
  const tokens = observation.metrics.tokens;
  return (
    tokens.availability !== "available" ||
    tokens.value.total === tokens.value.input + tokens.value.output
  );
}

export function isProductionEvalObservation(
  value: unknown,
  expectedCaseId?: string,
): value is ProductionEvalObservation {
  try {
    if (!observationValidator.Check(value)) return false;
    const observation = value as ProductionEvalObservation;
    if (expectedCaseId !== undefined && observation.caseId !== expectedCaseId) return false;
    if (!unique(observation.output.claims) || !unique(observation.output.prohibitedClaimsPresent)) {
      return false;
    }
    if (observation.trace.some((entry, index) => entry.index !== index)) return false;
    if (!metricTotalsAreValid(observation)) return false;
    if (
      observation.applicationValues.runId !== null &&
      !observation.applicationValues.runId.startsWith("run_")
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function qualityAverage(results: readonly ProductionEvalResult[]): number | null {
  const values = results
    .map((result) => result.score.quality.score)
    .filter((value): value is number => value !== null);
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function isProductionEvalArtifact(
  value: unknown,
  suite?: ProductionEvalSuite,
): value is ProductionEvalArtifact {
  try {
    if (!artifactValidator.Check(value)) return false;
    const artifact = value as ProductionEvalArtifact;
    if (!isIsoTimestamp(artifact.startedAt) || !isIsoTimestamp(artifact.finishedAt)) return false;
    if (Date.parse(artifact.finishedAt) < Date.parse(artifact.startedAt)) return false;
    if (!artifact.results.every(isProductionEvalResult)) return false;
    const caseIds = artifact.results.map((result) => result.caseId);
    if (!unique(caseIds)) return false;
    if (artifact.results.some((result) => !isDeepStrictEqual(result.versions, artifact.versions))) {
      return false;
    }
    const failed = artifact.results.filter((result) => result.status === "fail");
    const criticalFailureCount = artifact.results.reduce(
      (total, result) => total + result.score.critical.failures.length,
      0,
    );
    if (
      artifact.aggregate.caseCount !== artifact.results.length ||
      artifact.aggregate.passedCases !== artifact.results.length - failed.length ||
      artifact.aggregate.failedCases !== failed.length ||
      artifact.aggregate.criticalFailureCount !== criticalFailureCount ||
      artifact.status !== (failed.length === 0 ? "pass" : "fail") ||
      artifact.aggregate.qualityAverage !== qualityAverage(artifact.results)
    ) {
      return false;
    }
    if (suite !== undefined) {
      const validatedSuite = validateProductionEvalSuite(suite);
      if (!validatedSuite.ok) return false;
      if (artifact.suiteId !== validatedSuite.value.id) return false;
      if (!isDeepStrictEqual(artifact.versions, validatedSuite.value.versions)) return false;
      if (!isDeepStrictEqual(artifact.thresholds, validatedSuite.value.thresholds)) return false;
      if (
        !isDeepStrictEqual(
          caseIds,
          validatedSuite.value.cases.map((item) => item.id),
        )
      ) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function makeProductionEvalArtifactStoreFailure(
  code: ProductionEvalArtifactStoreFailureCode,
): Extract<ProductionEvalArtifactAppendOutcome, { ok: false }> {
  return deepFreeze({ ok: false, error: { code, message: storeFailureMessages[code] } });
}

export function isProductionEvalArtifactAppendOutcome(
  value: unknown,
): value is ProductionEvalArtifactAppendOutcome {
  try {
    if (!appendOutcomeValidator.Check(value)) return false;
    const outcome = value as ProductionEvalArtifactAppendOutcome;
    return outcome.ok
      ? isProductionEvalArtifact(outcome.value)
      : outcome.error.message === storeFailureMessages[outcome.error.code];
  } catch {
    return false;
  }
}

function runnerFailure(code: ProductionEvalRunnerFailureCode): ProductionEvalRunOutcome {
  return deepFreeze({ ok: false, error: { code, message: runnerFailureMessages[code] } });
}

export function isProductionEvalRunOutcome(value: unknown): value is ProductionEvalRunOutcome {
  try {
    if (!runOutcomeValidator.Check(value)) return false;
    const outcome = value as ProductionEvalRunOutcome;
    return outcome.ok
      ? isProductionEvalArtifact(outcome.value)
      : outcome.error.message === runnerFailureMessages[outcome.error.code];
  } catch {
    return false;
  }
}

function observation(
  dimension: ProductionEvalDimension,
  passed: boolean,
  expected: readonly string[],
  observed: readonly string[],
  code: string,
): ProductionEvalResult["dimensions"][number] {
  return {
    dimension,
    passed,
    expected: expected.map((item) => item.slice(0, 160)),
    observed: observed.map((item) => item.slice(0, 160)),
    code,
  };
}

function outcomeEvidence(value: ProductionEvalExpectation["outcome"]): string[] {
  return [`kind:${value.kind}`, `code:${value.code}`, `stop:${value.stopReason ?? "null"}`];
}

function toolEvidence(toolCalls: readonly ProductionEvalObservedToolCall[]): string[] {
  return toolCalls.map((call) => call.tool);
}

function applicationValue(
  source: "draft_content" | "approval_id" | "run_id",
  observed: ProductionEvalObservation,
): string | null {
  if (source === "draft_content") return observed.applicationValues.draftContent;
  if (source === "approval_id") return observed.applicationValues.approvalId;
  return observed.applicationValues.runId;
}

function argumentsMatch(
  expected: ProductionEvalExpectation["validatedArguments"],
  observed: ProductionEvalObservation,
): { passed: boolean; expected: string[]; observed: string[] } {
  const expectedEvidence: string[] = [];
  const observedEvidence: string[] = [];
  if (expected.length !== observed.toolCalls.length) {
    return {
      passed: false,
      expected: expected.map((entry) => entry.tool),
      observed: observed.toolCalls.map((entry) => entry.tool),
    };
  }
  let passed = true;
  for (let index = 0; index < expected.length; index += 1) {
    const expectedCall = expected[index];
    const observedCall = observed.toolCalls[index];
    if (!expectedCall || !observedCall || expectedCall.tool !== observedCall.tool) {
      passed = false;
      continue;
    }
    const expectedPresentKeys = Object.entries(expectedCall.arguments)
      .filter(([, matcher]) => matcher.kind !== "absent")
      .map(([key]) => key)
      .sort();
    const observedKeys = Object.keys(observedCall.arguments).sort();
    if (!isDeepStrictEqual(expectedPresentKeys, observedKeys)) passed = false;
    for (const [key, matcher] of Object.entries(expectedCall.arguments)) {
      const actual = observedCall.arguments[key];
      const prefix = `${expectedCall.tool}.${key}`;
      if (matcher.kind === "absent") {
        expectedEvidence.push(`${prefix}:absent`);
        observedEvidence.push(`${prefix}:${key in observedCall.arguments ? "present" : "absent"}`);
        if (key in observedCall.arguments) passed = false;
        continue;
      }
      const target =
        matcher.kind === "exact" ? matcher.value : applicationValue(matcher.source, observed);
      const redactValue = key === "draft";
      expectedEvidence.push(
        matcher.kind === "exact"
          ? `${prefix}:${redactValue ? "exact_value" : evidence(target)}`
          : `${prefix}:application_value`,
      );
      const matches = target !== null && isDeepStrictEqual(actual, target);
      observedEvidence.push(
        matcher.kind === "application_value"
          ? `${prefix}:${matches ? "application_value" : "different_value"}`
          : `${prefix}:${redactValue ? (matches ? "exact_value" : "different_value") : evidence(actual)}`,
      );
      if (!matches) passed = false;
    }
  }
  return { passed, expected: expectedEvidence, observed: observedEvidence };
}

function eventOrderMatch(
  expected: ProductionEvalExpectation["eventOrder"],
  trace: ProductionEvalObservation["trace"],
): boolean {
  const actual = trace.map((entry) => entry.eventType);
  if (expected.mode === "exact") return isDeepStrictEqual(actual, expected.events);
  let cursor = 0;
  for (const eventType of actual) {
    if (eventType === expected.events[cursor]) cursor += 1;
  }
  return cursor === expected.events.length;
}

function groundingMatch(
  caseDefinition: ProductionEvalCase,
  grounding: ProductionEvalObservation["grounding"],
): boolean {
  const requested = expectedRequestLeadId(caseDefinition);
  if (grounding.fabricated || grounding.requestedLeadId !== requested) return false;
  if (
    caseDefinition.category === "missing_input" ||
    caseDefinition.category === "malformed_input"
  ) {
    return grounding.qualificationLeadId === null && grounding.draftLeadId === null;
  }
  if (caseDefinition.category === "unknown_lead") {
    return grounding.qualificationLeadId === null && grounding.draftLeadId === null;
  }
  if (caseDefinition.category === "ambiguous_input") {
    return grounding.qualificationLeadId === requested && grounding.draftLeadId === null;
  }
  if (caseDefinition.expectation.output.requiredClaims.includes("grounded_lead")) {
    return grounding.qualificationLeadId === requested && grounding.draftLeadId === requested;
  }
  return (
    (grounding.qualificationLeadId === null || grounding.qualificationLeadId === requested) &&
    (grounding.draftLeadId === null || grounding.draftLeadId === requested)
  );
}

function qualityDimension(
  dimension: ProductionEvalDimension,
  observed: ProductionEvalObservation,
  suite: ProductionEvalSuite,
): ProductionEvalResult["dimensions"][number] {
  if (dimension === "draft_quality") {
    const grade = observed.modelGrade;
    if (grade === null) {
      return observation(
        dimension,
        true,
        ["optional model grade"],
        ["unavailable"],
        "quality.unavailable",
      );
    }
    const rubric = suite.rubric.find((entry) => entry.dimension === dimension);
    const minimum = rubric?.threshold.kind === "minimum_score" ? rubric.threshold.value : 100;
    return observation(
      dimension,
      grade.score >= minimum,
      [`minimum:${minimum}`],
      [`score:${grade.score}`],
      grade.score >= minimum ? "quality.passed" : "quality.failed",
    );
  }
  const threshold = dimension === "latency" ? suite.thresholds.latencyMs : suite.thresholds.costUsd;
  const metric = dimension === "latency" ? observed.metrics.latency : observed.metrics.cost;
  if (threshold.status === "pending") {
    return observation(
      dimension,
      true,
      ["threshold pending"],
      [`availability:${metric.availability}`],
      "threshold.pending",
    );
  }
  const value = metric.availability === "available" ? metric.value : null;
  const passed = value !== null && value <= threshold.maximum;
  return observation(
    dimension,
    passed,
    [`maximum:${threshold.maximum}`],
    [value === null ? "unavailable" : `value:${value}`],
    passed ? "threshold.passed" : "threshold.failed",
  );
}

export function scoreProductionEvalCase(
  caseDefinition: ProductionEvalCase,
  rawObservation: unknown,
  suite: ProductionEvalSuite,
): ProductionEvalResult | undefined {
  const validated = validateProductionEvalSuite(suite);
  if (!validated.ok) return undefined;
  const registeredCase = validated.value.cases.find((item) => item.id === caseDefinition.id);
  if (!registeredCase || !isDeepStrictEqual(registeredCase, caseDefinition)) return undefined;
  suite = validated.value;
  caseDefinition = registeredCase;
  const cloned = cloneUnknown(rawObservation);
  if (!isProductionEvalObservation(cloned, caseDefinition.id)) return undefined;
  const observed = cloned;
  const dimensions = caseDefinition.expectation.dimensions.map((dimension) => {
    if (dimension === "draft_quality" || dimension === "latency" || dimension === "cost") {
      return qualityDimension(dimension, observed, suite);
    }
    if (dimension === "task_success") {
      const passed = isDeepStrictEqual(observed.outcome, caseDefinition.expectation.outcome);
      return observation(
        dimension,
        passed,
        outcomeEvidence(caseDefinition.expectation.outcome),
        outcomeEvidence(observed.outcome),
        passed ? "outcome.matched" : "outcome.mismatch",
      );
    }
    if (dimension === "tool_selection") {
      const expected = [...caseDefinition.expectation.tools];
      const actual = toolEvidence(observed.toolCalls);
      const passed = isDeepStrictEqual(actual, expected);
      return observation(
        dimension,
        passed,
        expected.length === 0 ? ["none"] : expected,
        actual.length === 0 ? ["none"] : actual,
        passed ? "tools.matched" : "tools.mismatch",
      );
    }
    if (dimension === "validated_arguments") {
      const match = argumentsMatch(caseDefinition.expectation.validatedArguments, observed);
      return observation(
        dimension,
        match.passed,
        match.expected.length === 0 ? ["none"] : match.expected,
        match.observed.length === 0 ? ["none"] : match.observed,
        match.passed ? "arguments.matched" : "arguments.mismatch",
      );
    }
    if (dimension === "event_order") {
      const actual = observed.trace.map((entry) => entry.eventType);
      const passed = eventOrderMatch(caseDefinition.expectation.eventOrder, observed.trace);
      return observation(
        dimension,
        passed,
        caseDefinition.expectation.eventOrder.events.length === 0
          ? ["none"]
          : caseDefinition.expectation.eventOrder.events,
        actual.length === 0 ? ["none"] : actual,
        passed ? "events.matched" : "events.mismatch",
      );
    }
    if (dimension === "grounding") {
      const passed = groundingMatch(caseDefinition, observed.grounding);
      return observation(
        dimension,
        passed,
        [`requested:${expectedRequestLeadId(caseDefinition) ?? "null"}`, "fabricated:false"],
        [
          `requested:${observed.grounding.requestedLeadId ?? "null"}`,
          `qualification:${observed.grounding.qualificationLeadId ?? "null"}`,
          `draft:${observed.grounding.draftLeadId ?? "null"}`,
          `fabricated:${observed.grounding.fabricated}`,
        ],
        passed ? "grounding.matched" : "grounding.mismatch",
      );
    }
    if (dimension === "permission_safety") {
      const expected = caseDefinition.expectation.permission;
      const passed =
        observed.permission.decision === expected.decision &&
        observed.permission.effectCount === expected.effectCount;
      return observation(
        dimension,
        passed,
        [`decision:${expected.decision}`, `effects:${expected.effectCount}`],
        [`decision:${observed.permission.decision}`, `effects:${observed.permission.effectCount}`],
        passed ? "permission.matched" : "permission.mismatch",
      );
    }
    if (dimension === "approval_safety") {
      const expected = caseDefinition.expectation.permission;
      const passed =
        observed.permission.approvalState === expected.approvalState &&
        observed.permission.effectCount === expected.effectCount;
      return observation(
        dimension,
        passed,
        [`approval:${expected.approvalState ?? "null"}`, `effects:${expected.effectCount}`],
        [
          `approval:${observed.permission.approvalState ?? "null"}`,
          `effects:${observed.permission.effectCount}`,
        ],
        passed ? "approval.matched" : "approval.mismatch",
      );
    }
    if (dimension === "recovery") {
      const passed = isDeepStrictEqual(observed.recovery, caseDefinition.expectation.recovery);
      return observation(
        dimension,
        passed,
        [
          `action:${caseDefinition.expectation.recovery.action ?? "null"}`,
          `checkpoint:${caseDefinition.expectation.recovery.checkpoint ?? "null"}`,
        ],
        [
          `action:${observed.recovery.action ?? "null"}`,
          `checkpoint:${observed.recovery.checkpoint ?? "null"}`,
        ],
        passed ? "recovery.matched" : "recovery.mismatch",
      );
    }
    if (dimension === "stop_reason") {
      const expected = caseDefinition.expectation.outcome.stopReason;
      const passed = observed.outcome.stopReason === expected;
      return observation(
        dimension,
        passed,
        [`stop:${expected ?? "null"}`],
        [`stop:${observed.outcome.stopReason ?? "null"}`],
        passed ? "stop.matched" : "stop.mismatch",
      );
    }
    const required = caseDefinition.expectation.output.requiredClaims;
    const missing = required.filter((claim) => !observed.output.claims.includes(claim));
    const prohibited = observed.output.prohibitedClaimsPresent.filter((claim) =>
      caseDefinition.expectation.output.prohibitedClaims.includes(claim),
    );
    const passed = missing.length === 0 && prohibited.length === 0;
    return observation(
      dimension,
      passed,
      [
        ...required,
        ...caseDefinition.expectation.output.prohibitedClaims.map((item) => `not:${item}`),
      ],
      [
        ...(observed.output.claims.length === 0 ? ["none"] : observed.output.claims),
        ...observed.output.prohibitedClaimsPresent.map((item) => `present:${item}`),
      ],
      passed ? "output.matched" : "output.mismatch",
    );
  });

  const critical = new Set<ProductionEvalDimension>(CRITICAL_EVAL_DIMENSIONS);
  const failures = dimensions
    .filter((entry) => critical.has(entry.dimension) && !entry.passed)
    .map((entry) => entry.dimension);
  const result: ProductionEvalResult = {
    caseId: caseDefinition.id,
    status: failures.length === 0 ? "pass" : "fail",
    versions: structuredClone(suite.versions),
    trace: structuredClone(observed.trace),
    dimensions,
    score: {
      critical: { passed: failures.length === 0, failures },
      quality: {
        score: observed.modelGrade?.score ?? null,
        modelGrade: observed.modelGrade === null ? null : structuredClone(observed.modelGrade),
      },
    },
    metrics: structuredClone(observed.metrics),
  };
  return isProductionEvalResult(result) ? deepFreeze(result) : undefined;
}

function failedExecutionResult(
  caseDefinition: ProductionEvalCase,
  suite: ProductionEvalSuite,
): ProductionEvalResult {
  const critical = new Set<ProductionEvalDimension>(CRITICAL_EVAL_DIMENSIONS);
  const dimensions = caseDefinition.expectation.dimensions.map((dimension) =>
    observation(
      dimension,
      false,
      ["valid observed evidence"],
      ["execution unavailable"],
      "execution.failed",
    ),
  );
  const failures = dimensions
    .filter((entry) => critical.has(entry.dimension))
    .map((entry) => entry.dimension);
  const result: ProductionEvalResult = {
    caseId: caseDefinition.id,
    status: "fail",
    versions: structuredClone(suite.versions),
    trace: [],
    dimensions,
    score: {
      critical: { passed: false, failures },
      quality: { score: null, modelGrade: null },
    },
    metrics: {
      latency: { availability: "unavailable", value: null, reason: "not_observed" },
      tokens: { availability: "unavailable", value: null, reason: "not_observed" },
      cost: { availability: "unavailable", value: null, reason: "not_observed" },
    },
  };
  if (!isProductionEvalResult(result)) {
    throw new Error("Canonical production eval execution failure is invalid.");
  }
  return deepFreeze(result);
}

function makeArtifact(
  suite: ProductionEvalSuite,
  runId: string,
  startedAt: string,
  finishedAt: string,
  results: readonly ProductionEvalResult[],
): ProductionEvalArtifact | undefined {
  const failedCases = results.filter((result) => result.status === "fail").length;
  const artifact = {
    schemaVersion: 1 as const,
    runId,
    startedAt,
    finishedAt,
    suiteId: suite.id,
    versions: structuredClone(suite.versions),
    thresholds: structuredClone(suite.thresholds),
    status: failedCases === 0 ? ("pass" as const) : ("fail" as const),
    aggregate: {
      caseCount: results.length,
      passedCases: results.length - failedCases,
      failedCases,
      criticalFailureCount: results.reduce(
        (total, result) => total + result.score.critical.failures.length,
        0,
      ),
      qualityAverage: qualityAverage(results),
    },
    results: structuredClone(results),
  };
  return isProductionEvalArtifact(artifact, suite) ? deepFreeze(artifact) : undefined;
}

function defaultRunId(): string {
  return `evalrun_${crypto.randomUUID().replaceAll("-", "")}`;
}

function defaultNow(): string {
  return new Date().toISOString();
}

function normalizeRunnerOptions(value: unknown): NormalizedRunnerOptions | undefined {
  try {
    if (typeof value !== "object" || value === null) return undefined;
    const candidate = value as Record<string, unknown>;
    const executeCase = candidate.executeCase;
    const artifactStore = candidate.artifactStore;
    const makeRunId = candidate.makeRunId;
    const now = candidate.now;
    if (
      typeof executeCase !== "function" ||
      typeof artifactStore !== "object" ||
      artifactStore === null ||
      (makeRunId !== undefined && typeof makeRunId !== "function") ||
      (now !== undefined && typeof now !== "function")
    ) {
      return undefined;
    }
    const append = (artifactStore as Record<string, unknown>).append;
    if (typeof append !== "function") return undefined;
    return {
      suite: candidate.suite as ProductionEvalSuite,
      executeCase: executeCase as ProductionEvalCaseExecutor,
      appendArtifact: (input) => Reflect.apply(append, artifactStore, [input]),
      makeRunId: (makeRunId ?? defaultRunId) as () => string,
      now: (now ?? defaultNow) as () => string,
    };
  } catch {
    return undefined;
  }
}

export async function runProductionEvalSuite(
  options: ProductionEvalRunnerOptions,
): Promise<ProductionEvalRunOutcome> {
  const normalized = normalizeRunnerOptions(options);
  if (!normalized) return runnerFailure("invalid_configuration");
  const validated = validateProductionEvalSuite(normalized.suite);
  if (!validated.ok) return runnerFailure("invalid_suite");
  const suite = validated.value;
  let runId: string;
  let startedAt: string;
  try {
    runId = normalized.makeRunId();
    startedAt = normalized.now();
  } catch {
    return runnerFailure("invalid_configuration");
  }
  if (!Schema.Compile(EvalRunIdSchema).Check(runId) || !isIsoTimestamp(startedAt)) {
    return runnerFailure("invalid_configuration");
  }

  const results: ProductionEvalResult[] = [];
  for (const caseDefinition of suite.cases) {
    let result: ProductionEvalResult | undefined;
    try {
      const candidate = await normalized.executeCase(caseDefinition);
      result = scoreProductionEvalCase(caseDefinition, candidate, suite);
    } catch {
      result = undefined;
    }
    results.push(result ?? failedExecutionResult(caseDefinition, suite));
  }

  let finishedAt: string;
  try {
    finishedAt = normalized.now();
  } catch {
    return runnerFailure("invalid_configuration");
  }
  if (!isIsoTimestamp(finishedAt) || Date.parse(finishedAt) < Date.parse(startedAt)) {
    return runnerFailure("invalid_configuration");
  }
  const artifact = makeArtifact(suite, runId, startedAt, finishedAt, results);
  if (!artifact) return runnerFailure("invalid_artifact");

  let persisted: unknown;
  try {
    persisted = normalized.appendArtifact(artifact);
  } catch {
    return runnerFailure("persistence_failure");
  }
  if (
    !isProductionEvalArtifactAppendOutcome(persisted) ||
    !persisted.ok ||
    !isDeepStrictEqual(persisted.value, artifact)
  ) {
    return runnerFailure("persistence_failure");
  }
  return deepFreeze({ ok: true, value: artifact });
}

export function productionEvalExitCode(outcome: ProductionEvalRunOutcome): 0 | 1 {
  return outcome.ok && outcome.value.status === "pass" ? 0 : 1;
}

export function cloneProductionEvalObservation(
  value: ProductionEvalObservation,
): ProductionEvalObservation {
  return structuredClone(value);
}

export function scalarRecord(
  value: Readonly<Record<string, ProductionEvalScalar>>,
): Record<string, ProductionEvalScalar> {
  return structuredClone(value);
}
