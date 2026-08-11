import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCTION_EVAL_SUITE } from "../src/production-eval-golden-set.js";
import {
  LEGACY_EVAL_NAMES,
  REQUIRED_CRITICAL_BOUNDARIES,
  REQUIRED_EVAL_CATEGORIES,
  REQUIRED_RUBRIC_DIMENSIONS,
  type ProductionEvalResult,
  type ProductionEvalSuite,
  isProductionEvalCase,
  isProductionEvalResult,
  isProductionEvalSuite,
  isProductionEvalSuiteValidationOutcome,
  validateProductionEvalSuite,
} from "../src/production-eval.js";
import { PRODUCTION_TOOL_NAMES } from "../src/pi-agent.js";

function cloneSuite(): ProductionEvalSuite {
  return structuredClone(PRODUCTION_EVAL_SUITE);
}

function expectFailure(input: unknown, code: string) {
  const outcome = validateProductionEvalSuite(input);
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected suite validation failure");
  assert.equal(outcome.error.code, code);
  assert.equal(Object.isFrozen(outcome), true);
  assert.equal(isProductionEvalSuiteValidationOutcome(outcome), true);
  return outcome;
}

function passingResult(): ProductionEvalResult {
  return {
    caseId: "eval_known_lead_pending_approval",
    status: "pass",
    versions: structuredClone(PRODUCTION_EVAL_SUITE.versions),
    trace: [
      {
        index: 0,
        eventType: "run.started",
        tool: null,
        validatedArguments: { leadId: "lead_ada" },
        result: "attempted",
        stopReason: null,
      },
    ],
    dimensions: [
      {
        dimension: "task_success",
        passed: true,
        expected: ["typed outcome"],
        observed: ["typed outcome"],
        code: "matched",
      },
    ],
    score: {
      critical: { passed: true, failures: [] },
      quality: { score: null, modelGrade: null },
    },
    metrics: {
      latency: { availability: "unavailable", value: null, reason: "not_observed" },
      tokens: { availability: "unavailable", value: null, reason: "provider_independent" },
      cost: { availability: "unavailable", value: null, reason: "provider_independent" },
    },
  };
}

test("golden set is a frozen validated 18-case inventory", () => {
  assert.equal(PRODUCTION_EVAL_SUITE.cases.length, 18);
  assert.deepEqual(
    [...new Set(PRODUCTION_EVAL_SUITE.cases.map((entry) => entry.category))].sort(),
    [...REQUIRED_EVAL_CATEGORIES].sort(),
  );
  assert.deepEqual(
    [...PRODUCTION_EVAL_SUITE.criticalBoundaries].sort(),
    [...REQUIRED_CRITICAL_BOUNDARIES].sort(),
  );
  assert.equal(new Set(PRODUCTION_EVAL_SUITE.cases.map((entry) => entry.id)).size, 18);
  const validation = validateProductionEvalSuite(PRODUCTION_EVAL_SUITE);
  assert.equal(validation.ok, true);
  assert.deepEqual(validation.value, PRODUCTION_EVAL_SUITE);
  assert.equal(isProductionEvalSuite(PRODUCTION_EVAL_SUITE), true);
  assert.equal(Object.isFrozen(PRODUCTION_EVAL_SUITE), true);
  assert.equal(Object.isFrozen(PRODUCTION_EVAL_SUITE.cases), true);
  assert.equal(Object.isFrozen(PRODUCTION_EVAL_SUITE.cases[0]?.fixture.boundaries), true);
});

test("rubric makes every safety dimension deterministic and model grade non-blocking", () => {
  assert.deepEqual(
    PRODUCTION_EVAL_SUITE.rubric.map((entry) => entry.dimension).sort(),
    [...REQUIRED_RUBRIC_DIMENSIONS].sort(),
  );
  const critical = PRODUCTION_EVAL_SUITE.rubric.filter((entry) => entry.level === "critical");
  assert.equal(critical.length, 10);
  assert.equal(
    critical.every(
      (entry) => entry.grader === "deterministic" && entry.threshold.kind === "boolean",
    ),
    true,
  );
  const model = PRODUCTION_EVAL_SUITE.rubric.filter((entry) => entry.grader === "model");
  assert.deepEqual(
    model.map((entry) => entry.dimension),
    ["draft_quality"],
  );
  assert.equal(model[0]?.level, "quality");
  assert.equal(
    PRODUCTION_EVAL_SUITE.rubric
      .filter((entry) => entry.dimension === "latency" || entry.dimension === "cost")
      .every((entry) => entry.level === "quality" && entry.threshold.kind === "pending"),
    true,
  );
  assert.deepEqual(PRODUCTION_EVAL_SUITE.thresholds, {
    latencyMs: {
      status: "pending",
      maximum: null,
      reason: "representative_baseline_required",
    },
    tokens: {
      status: "pending",
      maximum: null,
      reason: "representative_baseline_required",
    },
    costUsd: {
      status: "pending",
      maximum: null,
      reason: "representative_baseline_required",
    },
  });
});

test("every case predeclares behavioral evidence and uses only production tools", () => {
  const covered = new Set<string>();
  for (const caseDefinition of PRODUCTION_EVAL_SUITE.cases) {
    assert.equal(isProductionEvalCase(caseDefinition), true);
    assert.equal(caseDefinition.expectation.dimensions.includes("task_success"), true);
    assert.deepEqual(
      caseDefinition.expectation.validatedArguments.map((entry) => entry.tool),
      caseDefinition.expectation.tools,
    );
    assert.equal(
      caseDefinition.expectation.tools.every((tool) => PRODUCTION_TOOL_NAMES.includes(tool)),
      true,
    );
    assert.ok(caseDefinition.expectation.output.prohibitedClaims.length > 0);
    assert.ok(
      caseDefinition.category === "missing_input" ||
        caseDefinition.category === "malformed_input" ||
        caseDefinition.expectation.eventOrder.events.length > 0,
    );
    for (const boundary of caseDefinition.criticalBoundaries) covered.add(boundary);
  }
  assert.deepEqual([...covered].sort(), [...REQUIRED_CRITICAL_BOUNDARIES].sort());
  assert.deepEqual(
    [...PRODUCTION_TOOL_NAMES],
    ["qualify_lead", "draft_follow_up", "request_send_approval"],
  );
});

test("legacy eval intentions map to named golden cases without replacing execution yet", () => {
  assert.deepEqual(
    PRODUCTION_EVAL_SUITE.legacyMappings.map((mapping) => mapping.legacyName),
    [...LEGACY_EVAL_NAMES],
  );
  const ids = new Set(PRODUCTION_EVAL_SUITE.cases.map((entry) => entry.id));
  assert.equal(
    PRODUCTION_EVAL_SUITE.legacyMappings.every((mapping) => ids.has(mapping.caseId)),
    true,
  );
});

test("case and validation contracts are closed against extras and hostile values", () => {
  const first = PRODUCTION_EVAL_SUITE.cases[0];
  assert.ok(first);
  assert.equal(isProductionEvalCase(first), true);
  assert.equal(isProductionEvalCase({ ...first, unexpected: true }), false);
  assert.equal(
    isProductionEvalCase(
      new Proxy(
        {},
        {
          get() {
            throw new Error("forbidden proxy detail");
          },
        },
      ),
    ),
    false,
  );
  const hostile = new Proxy(
    {},
    {
      ownKeys() {
        throw new Error("forbidden proxy detail");
      },
    },
  );
  const failure = expectFailure(hostile, "uncloneable_value");
  assert.equal(JSON.stringify(failure).includes("forbidden proxy detail"), false);
  expectFailure({ ...cloneSuite(), callback: () => true }, "uncloneable_value");
  expectFailure({ ...cloneSuite(), unexpected: true }, "invalid_suite");
});

test("result contract represents unavailable provider metrics explicitly", () => {
  const result = passingResult();
  assert.equal(isProductionEvalResult(result), true);
  assert.equal(result.metrics.latency.availability, "unavailable");
  assert.equal(result.metrics.tokens.availability, "unavailable");
  assert.equal(result.metrics.cost.availability, "unavailable");
  assert.equal(isProductionEvalResult({ ...result, unexpected: true }), false);
  assert.equal(
    isProductionEvalResult({
      ...result,
      metrics: {
        ...result.metrics,
        latency: { availability: "unavailable", value: 0, reason: "not_observed" },
      },
    }),
    false,
  );
});

test("available zero metrics are measured values and token totals remain exact", () => {
  const result = passingResult();
  const measured: ProductionEvalResult = {
    ...result,
    metrics: {
      latency: { availability: "available", value: 0, unit: "ms", reason: null },
      tokens: {
        availability: "available",
        value: { input: 0, output: 0, total: 0 },
        unit: "tokens",
        reason: null,
      },
      cost: { availability: "available", value: 0, unit: "usd", reason: null },
    },
  };
  assert.equal(isProductionEvalResult(measured), true);
  const invalid = structuredClone(measured);
  if (invalid.metrics.tokens.availability !== "available") assert.fail("Expected tokens");
  invalid.metrics.tokens.value = { input: 2, output: 3, total: 4 };
  assert.equal(isProductionEvalResult(invalid), false);
});

test("critical result status and failure evidence must agree", () => {
  const passing = passingResult();
  assert.equal(
    isProductionEvalResult({
      ...passing,
      status: "fail",
    }),
    false,
  );
  const omitted = passingResult();
  const omittedTask = omitted.dimensions[0];
  assert.ok(omittedTask);
  omittedTask.passed = false;
  omittedTask.observed = ["dependency stop"];
  assert.equal(isProductionEvalResult(omitted), false);
  const failing: ProductionEvalResult = {
    ...passing,
    status: "fail",
    dimensions: [
      {
        dimension: "task_success",
        passed: false,
        expected: ["typed outcome"],
        observed: ["dependency stop"],
        code: "mismatch",
      },
    ],
    score: {
      critical: { passed: false, failures: ["task_success"] },
      quality: { score: null, modelGrade: null },
    },
  };
  assert.equal(isProductionEvalResult(failing), true);
  failing.score.critical.failures = ["tool_selection"];
  assert.equal(isProductionEvalResult(failing), false);
});

test("optional low model grade cannot flip a passing deterministic critical result", () => {
  const result = passingResult();
  result.dimensions.push({
    dimension: "draft_quality",
    passed: false,
    expected: ["quality score 70"],
    observed: ["quality score 40"],
    code: "quality_below_target",
  });
  result.score.quality = {
    score: 40,
    modelGrade: {
      dimension: "draft_quality",
      score: 40,
      rationaleCode: "wording_weak",
    },
  };
  assert.equal(isProductionEvalResult(result), true);
  result.score.quality.score = null;
  assert.equal(isProductionEvalResult(result), false);
});

test("trace indices are ordered and dimension identities are unique", () => {
  const result = passingResult();
  result.trace.push({
    index: 2,
    eventType: "run.completed",
    tool: null,
    validatedArguments: null,
    result: "succeeded",
    stopReason: "approval_pending",
  });
  assert.equal(isProductionEvalResult(result), false);
  const secondTrace = result.trace[1];
  const firstDimension = result.dimensions[0];
  assert.ok(secondTrace && firstDimension);
  result.trace[1] = { ...secondTrace, index: 1 };
  result.dimensions.push({ ...firstDimension });
  assert.equal(isProductionEvalResult(result), false);
});

test("suite validation gives specific case-count and duplicate-identity failures", () => {
  const tooSmall = cloneSuite();
  tooSmall.cases = tooSmall.cases.slice(0, 9);
  expectFailure(tooSmall, "invalid_case_count");

  const tooLarge = cloneSuite();
  while (tooLarge.cases.length < 21) {
    const source = structuredClone(tooLarge.cases[0]);
    assert.ok(source);
    source.id = `eval_extra_${String(tooLarge.cases.length).padStart(2, "0")}`;
    source.title = `Additional structurally valid case ${tooLarge.cases.length}`;
    tooLarge.cases.push(source);
  }
  expectFailure(tooLarge, "invalid_case_count");

  const duplicate = cloneSuite();
  assert.ok(duplicate.cases[0] && duplicate.cases[1]);
  duplicate.cases[1].id = duplicate.cases[0].id;
  expectFailure(duplicate, "duplicate_case_id");

  const duplicateTitle = cloneSuite();
  assert.ok(duplicateTitle.cases[0] && duplicateTitle.cases[1]);
  duplicateTitle.cases[1].title = duplicateTitle.cases[0].title;
  expectFailure(duplicateTitle, "duplicate_case_id");
});

test("suite validation rejects missing category and boundary coverage", () => {
  const missingCategory = cloneSuite();
  missingCategory.cases = missingCategory.cases.filter(
    (entry) => entry.category !== "bounded_stop",
  );
  expectFailure(missingCategory, "missing_category");

  const missingRegistryBoundary = cloneSuite();
  missingRegistryBoundary.criticalBoundaries = missingRegistryBoundary.criticalBoundaries.filter(
    (boundary) => boundary !== "provider_failure",
  );
  expectFailure(missingRegistryBoundary, "missing_boundary");

  const missingCaseCoverage = cloneSuite();
  for (const caseDefinition of missingCaseCoverage.cases) {
    caseDefinition.criticalBoundaries = caseDefinition.criticalBoundaries.filter(
      (boundary) => boundary !== "input_validation",
    );
  }
  expectFailure(missingCaseCoverage, "missing_boundary");
});

test("suite validation rejects unsafe rubric authority", () => {
  const modelCritical = cloneSuite();
  const taskSuccess = modelCritical.rubric.find((entry) => entry.dimension === "task_success");
  assert.ok(taskSuccess);
  taskSuccess.grader = "model";
  expectFailure(modelCritical, "invalid_rubric");

  const blockingLatency = cloneSuite();
  const latency = blockingLatency.rubric.find((entry) => entry.dimension === "latency");
  assert.ok(latency);
  latency.level = "critical";
  latency.threshold = { kind: "boolean" };
  expectFailure(blockingLatency, "invalid_rubric");
});

test("suite validation rejects inconsistent case expectations", () => {
  const unselectedArguments = cloneSuite();
  const missing = unselectedArguments.cases.find((entry) => entry.category === "missing_input");
  assert.ok(missing);
  missing.expectation.validatedArguments.push({
    tool: "qualify_lead",
    arguments: { leadId: { kind: "exact", value: "lead_ada" } },
  });
  expectFailure(unselectedArguments, "invalid_case_expectation");

  const pendingEffect = cloneSuite();
  const happy = pendingEffect.cases.find((entry) => entry.category === "happy_path");
  assert.ok(happy);
  happy.expectation.permission.effectCount = 1;
  expectFailure(pendingEffect, "invalid_case_expectation");

  const malformedBecomesValid = cloneSuite();
  const malformed = malformedBecomesValid.cases.find(
    (entry) => entry.category === "malformed_input",
  );
  assert.ok(malformed && malformed.fixture.request.kind === "malformed_lead_id");
  malformed.fixture.request.value = "lead_ada";
  expectFailure(malformedBecomesValid, "invalid_case_expectation");

  const noEvidence = cloneSuite();
  const unknown = noEvidence.cases.find((entry) => entry.category === "unknown_lead");
  assert.ok(unknown);
  unknown.expectation.eventOrder.events = [];
  expectFailure(noEvidence, "invalid_case_expectation");

  const mislabeledFixture = cloneSuite();
  const happyFixture = mislabeledFixture.cases.find((entry) => entry.category === "happy_path");
  assert.ok(happyFixture);
  happyFixture.fixture.boundaries.model = "invalid_output";
  expectFailure(mislabeledFixture, "invalid_case_expectation");

  const permissionInvokesAdapter = cloneSuite();
  const denied = permissionInvokesAdapter.cases.find(
    (entry) => entry.category === "permission_denial",
  );
  assert.ok(denied);
  denied.fixture.boundaries.fakeAdapter = "accepted";
  expectFailure(permissionInvokesAdapter, "invalid_case_expectation");

  const labelOnlyPermission = cloneSuite();
  const adversarial = labelOnlyPermission.cases.find(
    (entry) => entry.category === "adversarial_instruction",
  );
  assert.ok(adversarial);
  adversarial.criticalBoundaries.push("permission");
  expectFailure(labelOnlyPermission, "invalid_case_expectation");
});

test("legacy mapping must remain complete and target existing cases", () => {
  const missing = cloneSuite();
  missing.legacyMappings = missing.legacyMappings.slice(0, 4);
  expectFailure(missing, "invalid_legacy_mapping");

  const unknown = cloneSuite();
  assert.ok(unknown.legacyMappings[0]);
  unknown.legacyMappings[0].caseId = "eval_missing_target";
  expectFailure(unknown, "invalid_legacy_mapping");
});

test("golden set contains bounded synthetic selectors and no executable capability", () => {
  const serialized = JSON.stringify(PRODUCTION_EVAL_SUITE);
  assert.equal(serialized.includes("@"), false);
  assert.equal(serialized.includes("http://"), false);
  assert.equal(serialized.includes("https://"), false);
  assert.equal(serialized.includes("sk-"), false);
  assert.equal(serialized.includes("BEGIN PRIVATE KEY"), false);

  const visit = (value: unknown): void => {
    assert.notEqual(typeof value, "function");
    if (Array.isArray(value)) {
      for (const nested of value) visit(nested);
    } else if (typeof value === "object" && value !== null) {
      for (const nested of Object.values(value)) visit(nested);
    }
  };
  visit(PRODUCTION_EVAL_SUITE);
});

test("permission denial remains pre-adapter and validation failure messages are canonical", () => {
  const denied = PRODUCTION_EVAL_SUITE.cases.find(
    (entry) => entry.category === "permission_denial",
  );
  assert.ok(denied);
  assert.equal(denied.fixture.boundaries.fakeExecution, "permission_denied");
  assert.equal(denied.fixture.boundaries.fakeAdapter, "not_invoked");
  assert.equal(denied.expectation.permission.effectCount, 0);

  const failure = expectFailure({ ...cloneSuite(), unexpected: true }, "invalid_suite");
  assert.equal(
    isProductionEvalSuiteValidationOutcome({
      ...failure,
      error: { ...failure.error, message: "Caller-controlled detail." },
    }),
    false,
  );
});
