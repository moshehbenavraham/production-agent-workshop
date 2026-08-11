import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { PRODUCTION_EVAL_SUITE } from "../src/production-eval-golden-set.js";
import { executeProductionEvalCase } from "../src/production-eval-harness.js";
import { isProductionEvalResult, type ProductionEvalCase } from "../src/production-eval.js";
import {
  cloneProductionEvalObservation,
  isProductionEvalArtifact,
  isProductionEvalArtifactAppendOutcome,
  isProductionEvalObservation,
  isProductionEvalRunOutcome,
  productionEvalExitCode,
  runProductionEvalSuite,
  scoreProductionEvalCase,
  type ProductionEvalArtifact,
  type ProductionEvalArtifactStore,
  type ProductionEvalObservation,
} from "../src/production-eval-runner.js";
import {
  renderProductionEvalFailure,
  renderProductionEvalScorecard,
} from "../src/production-eval-scorecard.js";
import { FileProductionEvalArtifactStore } from "../src/production-eval-store.js";

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function temporaryPath(name = "production-evals.jsonl"): string {
  const directory = mkdtempSync(join(tmpdir(), "production-eval-runner-test-"));
  temporaryDirectories.push(directory);
  return join(directory, name);
}

let observationPromise: Promise<Map<string, ProductionEvalObservation>> | undefined;

async function observations(): Promise<Map<string, ProductionEvalObservation>> {
  observationPromise ??= Promise.all(
    PRODUCTION_EVAL_SUITE.cases.map(async (caseDefinition) => {
      const observed = await executeProductionEvalCase(caseDefinition);
      return [caseDefinition.id, observed] as const;
    }),
  ).then((entries) => new Map(entries));
  return observationPromise;
}

async function observationFor(caseId: string): Promise<ProductionEvalObservation> {
  const observed = (await observations()).get(caseId);
  if (!observed) assert.fail(`Missing observation for ${caseId}`);
  return cloneProductionEvalObservation(observed);
}

function caseFor(caseId: string): ProductionEvalCase {
  const caseDefinition = PRODUCTION_EVAL_SUITE.cases.find((item) => item.id === caseId);
  if (!caseDefinition) assert.fail(`Missing case ${caseId}`);
  return caseDefinition;
}

function memoryStore(captured: ProductionEvalArtifact[] = []): ProductionEvalArtifactStore {
  return {
    append: (input: unknown) => {
      if (!isProductionEvalArtifact(input)) {
        return {
          ok: false,
          error: {
            code: "invalid_artifact",
            message: "Production eval artifact is invalid.",
          },
        };
      }
      const value = structuredClone(input);
      captured.push(value);
      return { ok: true, value };
    },
  };
}

function stableRunnerOptions(
  executeCase: (caseDefinition: ProductionEvalCase) => unknown | Promise<unknown>,
  artifactStore: ProductionEvalArtifactStore = memoryStore(),
) {
  let time = 0;
  return {
    suite: PRODUCTION_EVAL_SUITE,
    executeCase,
    artifactStore,
    makeRunId: () => "evalrun_test_suite_001",
    now: () => new Date(time++).toISOString(),
  };
}

async function cachedExecutor(
  caseDefinition: ProductionEvalCase,
): Promise<ProductionEvalObservation> {
  return observationFor(caseDefinition.id);
}

let passingArtifactPromise: Promise<ProductionEvalArtifact> | undefined;

async function passingArtifact(): Promise<ProductionEvalArtifact> {
  passingArtifactPromise ??= runProductionEvalSuite(stableRunnerOptions(cachedExecutor)).then(
    (outcome) => {
      if (!outcome.ok) assert.fail(outcome.error.message);
      return outcome.value;
    },
  );
  return structuredClone(await passingArtifactPromise);
}

test("deterministic production harness executes and scores all 18 cases green", async () => {
  const captured: ProductionEvalArtifact[] = [];
  const outcome = await runProductionEvalSuite(
    stableRunnerOptions(cachedExecutor, memoryStore(captured)),
  );

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.value.status, "pass");
  assert.deepEqual(outcome.value.aggregate, {
    caseCount: 18,
    passedCases: 18,
    failedCases: 0,
    criticalFailureCount: 0,
    qualityAverage: null,
  });
  assert.deepEqual(
    outcome.value.results.map((result) => result.caseId),
    PRODUCTION_EVAL_SUITE.cases.map((caseDefinition) => caseDefinition.id),
  );
  assert.equal(outcome.value.results.every(isProductionEvalResult), true);
  assert.equal(
    outcome.value.results.every((result) => result.score.critical.passed),
    true,
  );
  assert.equal(Object.isFrozen(outcome), true);
  assert.equal(captured.length, 1);
  assert.equal(productionEvalExitCode(outcome), 0);
});

test("every critical scorer derives a mismatch from concrete observed evidence", async () => {
  const samples = [
    {
      caseId: "eval_known_lead_pending_approval",
      dimension: "task_success",
      mutate: (value: ProductionEvalObservation) => {
        value.outcome.code = "false_completion";
      },
    },
    {
      caseId: "eval_known_lead_pending_approval",
      dimension: "tool_selection",
      mutate: (value: ProductionEvalObservation) => {
        value.toolCalls.pop();
      },
    },
    {
      caseId: "eval_known_lead_pending_approval",
      dimension: "validated_arguments",
      mutate: (value: ProductionEvalObservation) => {
        value.toolCalls[0] = { tool: "qualify_lead", arguments: { leadId: "lead_grace" } };
      },
    },
    {
      caseId: "eval_unknown_lead",
      dimension: "event_order",
      mutate: (value: ProductionEvalObservation) => {
        value.trace.splice(2, 1);
        value.trace.forEach((entry, index) => {
          entry.index = index;
        });
      },
    },
    {
      caseId: "eval_known_lead_pending_approval",
      dimension: "grounding",
      mutate: (value: ProductionEvalObservation) => {
        value.grounding.fabricated = true;
      },
    },
    {
      caseId: "eval_fake_permission_denied",
      dimension: "permission_safety",
      mutate: (value: ProductionEvalObservation) => {
        value.permission.decision = "allow";
      },
    },
    {
      caseId: "eval_fake_permission_denied",
      dimension: "approval_safety",
      mutate: (value: ProductionEvalObservation) => {
        value.permission.approvalState = "pending";
      },
    },
    {
      caseId: "eval_restart_after_approval",
      dimension: "recovery",
      mutate: (value: ProductionEvalObservation) => {
        value.recovery.action = "stop";
      },
    },
    {
      caseId: "eval_step_limit_stop",
      dimension: "stop_reason",
      mutate: (value: ProductionEvalObservation) => {
        value.outcome.stopReason = "dependency_failed";
      },
    },
    {
      caseId: "eval_false_completion_claim",
      dimension: "final_output_safety",
      mutate: (value: ProductionEvalObservation) => {
        value.output.prohibitedClaimsPresent.push("message_sent");
      },
    },
  ] as const;

  for (const sample of samples) {
    const caseDefinition = caseFor(sample.caseId);
    const observed = await observationFor(sample.caseId);
    sample.mutate(observed);
    const result = scoreProductionEvalCase(caseDefinition, observed, PRODUCTION_EVAL_SUITE);
    assert.ok(result, sample.dimension);
    assert.equal(result.status, "fail", sample.dimension);
    assert.equal(result.score.critical.failures.includes(sample.dimension), true, sample.dimension);
    assert.equal(
      result.dimensions.find((entry) => entry.dimension === sample.dimension)?.passed,
      false,
      sample.dimension,
    );
  }
});

test("named boundary regressions each block while preserving seventeen passing cases", async () => {
  const regressions = [
    {
      caseId: "eval_unknown_lead",
      dimension: "grounding",
      mutate: (value: ProductionEvalObservation) => {
        value.grounding.fabricated = true;
      },
    },
    {
      caseId: "eval_false_completion_claim",
      dimension: "final_output_safety",
      mutate: (value: ProductionEvalObservation) => {
        value.output.prohibitedClaimsPresent.push("message_sent");
      },
    },
    {
      caseId: "eval_approval_bypass_attempt",
      dimension: "approval_safety",
      mutate: (value: ProductionEvalObservation) => {
        value.permission.decision = "allow";
        value.permission.approvalState = "pending";
      },
    },
  ] as const;

  for (const regression of regressions) {
    const outcome = await runProductionEvalSuite(
      stableRunnerOptions(async (caseDefinition) => {
        const observed = await observationFor(caseDefinition.id);
        if (caseDefinition.id === regression.caseId) regression.mutate(observed);
        return observed;
      }),
    );
    if (!outcome.ok) assert.fail(outcome.error.message);
    assert.equal(outcome.value.status, "fail", regression.caseId);
    assert.equal(outcome.value.aggregate.passedCases, 17, regression.caseId);
    assert.equal(outcome.value.aggregate.failedCases, 1, regression.caseId);
    assert.equal(productionEvalExitCode(outcome), 1, regression.caseId);
    const failed = outcome.value.results.find((result) => result.caseId === regression.caseId);
    assert.equal(failed?.status, "fail", regression.caseId);
    assert.equal(
      failed?.score.critical.failures.includes(regression.dimension),
      true,
      regression.dimension,
    );
  }
});

test("observation boundary rejects extras, case spoofing, trace disorder, totals, and uncloneable data", async () => {
  const valid = await observationFor("eval_known_lead_pending_approval");
  assert.equal(isProductionEvalObservation(valid, valid.caseId), true);
  assert.equal(isProductionEvalObservation({ ...valid, extra: true }), false);
  assert.equal(
    isProductionEvalObservation({ ...valid, caseId: "eval_unknown_lead" }, valid.caseId),
    false,
  );
  const disorder = structuredClone(valid);
  const firstTrace = disorder.trace[0];
  if (!firstTrace) assert.fail("Expected trace evidence");
  firstTrace.index = 2;
  assert.equal(isProductionEvalObservation(disorder), false);
  const totals = structuredClone(valid);
  totals.metrics.tokens = {
    availability: "available",
    value: { input: 1, output: 1, total: 3 },
    unit: "tokens",
    reason: null,
  };
  assert.equal(isProductionEvalObservation(totals), false);
  const hostile = new Proxy(valid, {
    ownKeys: () => {
      throw new Error("forbidden detail");
    },
  });
  assert.equal(
    scoreProductionEvalCase(caseFor(valid.caseId), hostile, PRODUCTION_EVAL_SUITE),
    undefined,
  );

  const invalidSuite = structuredClone(PRODUCTION_EVAL_SUITE);
  invalidSuite.cases = invalidSuite.cases.slice(0, 9);
  assert.equal(scoreProductionEvalCase(caseFor(valid.caseId), valid, invalidSuite), undefined);

  const alteredCase = structuredClone(caseFor(valid.caseId));
  alteredCase.title = `${alteredCase.title} altered`;
  assert.equal(scoreProductionEvalCase(alteredCase, valid, PRODUCTION_EVAL_SUITE), undefined);

  const unregisteredCase = structuredClone(caseFor(valid.caseId));
  unregisteredCase.id = "eval_unregistered_case";
  assert.equal(scoreProductionEvalCase(unregisteredCase, valid, PRODUCTION_EVAL_SUITE), undefined);
});

test("quality-only model miss cannot change a deterministic critical pass", async () => {
  const caseDefinition = caseFor("eval_known_lead_pending_approval");
  const observed = await observationFor(caseDefinition.id);
  observed.modelGrade = {
    dimension: "draft_quality",
    score: 10,
    rationaleCode: "quality.low",
  };
  const result = scoreProductionEvalCase(caseDefinition, observed, PRODUCTION_EVAL_SUITE);

  assert.ok(result);
  assert.equal(result.status, "pass");
  assert.equal(result.score.critical.passed, true);
  assert.equal(result.score.quality.score, 10);
  assert.equal(
    result.dimensions.find((entry) => entry.dimension === "draft_quality")?.passed,
    false,
  );
});

test("single critical failure remains visible beside seventeen passing cases and exits nonzero", async () => {
  const outcome = await runProductionEvalSuite(
    stableRunnerOptions(async (caseDefinition) => {
      const observed = await observationFor(caseDefinition.id);
      if (caseDefinition.id === "eval_false_completion_claim") {
        observed.output.prohibitedClaimsPresent.push("message_sent");
      }
      return observed;
    }),
  );

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.value.status, "fail");
  assert.equal(outcome.value.aggregate.passedCases, 17);
  assert.equal(outcome.value.aggregate.failedCases, 1);
  assert.equal(outcome.value.aggregate.criticalFailureCount, 1);
  assert.equal(productionEvalExitCode(outcome), 1);
  const scorecard = renderProductionEvalScorecard(outcome.value);
  assert.match(scorecard, /FAIL eval_false_completion_claim/);
  assert.match(scorecard, /final_output_safety output\.mismatch expected:/);
  assert.match(scorecard, /observed:\[.*present:message_sent/);
});

test("multiple critical failures are aggregated without hiding passing cases", async () => {
  const outcome = await runProductionEvalSuite(
    stableRunnerOptions(async (caseDefinition) => {
      const observed = await observationFor(caseDefinition.id);
      if (caseDefinition.id === "eval_false_completion_claim") {
        observed.output.prohibitedClaimsPresent.push("message_sent");
      }
      if (caseDefinition.id === "eval_approval_bypass_attempt") {
        observed.permission.decision = "allow";
      }
      return observed;
    }),
  );

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.value.aggregate.failedCases, 2);
  assert.equal(outcome.value.aggregate.passedCases, 16);
  assert.equal(outcome.value.aggregate.criticalFailureCount, 2);
});

test("throwing and malformed executors become canonical failed case evidence and suite continues", async () => {
  for (const executeCase of [
    async (caseDefinition: ProductionEvalCase) => {
      if (caseDefinition.id === "eval_invalid_model_output") {
        throw new Error("sensitive executor detail");
      }
      return observationFor(caseDefinition.id);
    },
    async (caseDefinition: ProductionEvalCase) =>
      caseDefinition.id === "eval_invalid_model_output" ? {} : observationFor(caseDefinition.id),
  ]) {
    const outcome = await runProductionEvalSuite(stableRunnerOptions(executeCase));
    if (!outcome.ok) assert.fail(outcome.error.message);
    assert.equal(outcome.value.aggregate.passedCases, 17);
    const failed = outcome.value.results.find(
      (result) => result.caseId === "eval_invalid_model_output",
    );
    assert.equal(failed?.status, "fail");
    assert.equal(
      failed?.dimensions.every((entry) => entry.code === "execution.failed"),
      true,
    );
    assert.doesNotMatch(JSON.stringify(outcome), /sensitive executor detail/);
  }
});

test("persistence throw, failure, malformed success, and mismatched success can never exit zero", async () => {
  const stores: ProductionEvalArtifactStore[] = [
    {
      append: () => {
        throw new Error("sensitive persistence detail");
      },
    },
    {
      append: () => ({
        ok: false,
        error: {
          code: "storage_failure",
          message: "Production eval artifact storage failed.",
        },
      }),
    },
    { append: () => ({ ok: true, value: {} }) },
    {
      append: (input: unknown) => ({
        ok: true,
        value: { ...(input as ProductionEvalArtifact), runId: "evalrun_mismatch_001" },
      }),
    },
  ];
  for (const artifactStore of stores) {
    const outcome = await runProductionEvalSuite(
      stableRunnerOptions(cachedExecutor, artifactStore),
    );
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected persistence failure");
    assert.equal(outcome.error.code, "persistence_failure");
    assert.equal(productionEvalExitCode(outcome), 1);
    assert.doesNotMatch(JSON.stringify(outcome), /sensitive persistence detail/);
  }
});

test("artifact guard derives exact counts, order, versions, and critical status", async () => {
  const artifact = await passingArtifact();
  assert.equal(isProductionEvalArtifact(artifact, PRODUCTION_EVAL_SUITE), true);
  assert.equal(isProductionEvalRunOutcome({ ok: true, value: artifact }), true);

  const invalidSuite = structuredClone(PRODUCTION_EVAL_SUITE);
  invalidSuite.cases = invalidSuite.cases.slice(0, 9);
  assert.equal(isProductionEvalArtifact(artifact, invalidSuite), false);

  const badSuiteVersion = structuredClone(artifact);
  badSuiteVersion.versions.application = "0.0.0-other";
  assert.equal(isProductionEvalArtifact(badSuiteVersion, PRODUCTION_EVAL_SUITE), false);
  const badThreshold = structuredClone(artifact);
  badThreshold.thresholds.latencyMs = { status: "active", maximum: 1, reason: null };
  assert.equal(isProductionEvalArtifact(badThreshold, PRODUCTION_EVAL_SUITE), false);

  const badCount = structuredClone(artifact);
  badCount.aggregate.passedCases -= 1;
  assert.equal(isProductionEvalArtifact(badCount), false);
  const badOrder = structuredClone(artifact);
  badOrder.results.reverse();
  assert.equal(isProductionEvalArtifact(badOrder, PRODUCTION_EVAL_SUITE), false);
  const badVersion = structuredClone(artifact);
  const firstResult = badVersion.results[0];
  if (!firstResult) assert.fail("Expected result evidence");
  firstResult.versions.application = "forged";
  assert.equal(isProductionEvalArtifact(badVersion), false);
  assert.equal(isProductionEvalArtifact(badVersion, PRODUCTION_EVAL_SUITE), false);
  const badStatus = structuredClone(artifact);
  badStatus.status = "fail";
  assert.equal(isProductionEvalArtifact(badStatus), false);

  const hostileHandler = {
    ownKeys: () => {
      throw new Error("forbidden detail");
    },
  };
  const hostile = new Proxy(artifact, hostileHandler);
  assert.equal(isProductionEvalArtifact(hostile), false);
  assert.equal(
    isProductionEvalArtifactAppendOutcome(new Proxy({ ok: true, value: artifact }, hostileHandler)),
    false,
  );
  assert.equal(
    isProductionEvalRunOutcome(new Proxy({ ok: true, value: artifact }, hostileHandler)),
    false,
  );
});

test("file artifact store appends privately, re-reads exactly, and survives a new instance", async () => {
  const path = temporaryPath();
  const artifact = await passingArtifact();
  const store = new FileProductionEvalArtifactStore(path);
  const appended = store.append(artifact);

  assert.equal(isProductionEvalArtifactAppendOutcome(appended), true);
  if (!appended.ok) assert.fail(appended.error.message);
  assert.deepEqual(appended.value, artifact);
  assert.equal(Object.isFrozen(appended), true);
  assert.equal(Object.isFrozen(appended.value), true);
  assert.equal(statSync(path).mode & 0o777, 0o600);
  assert.equal(readFileSync(path, "utf8").split("\n").filter(Boolean).length, 1);
  const listed = new FileProductionEvalArtifactStore(path).list();
  assert.deepEqual(listed, {
    ok: true,
    value: [artifact],
  });
  assert.equal(Object.isFrozen(listed), true);
  if (listed.ok) assert.equal(Object.isFrozen(listed.value), true);
  assert.deepEqual(new FileProductionEvalArtifactStore(path).append(artifact), {
    ok: true,
    value: artifact,
  });
  assert.equal(readFileSync(path, "utf8").split("\n").filter(Boolean).length, 1);
});

test("artifact store refuses invalid, conflicting, corrupt, interrupted, no-op, and failing I/O", async () => {
  const artifact = await passingArtifact();
  assert.throws(() => new FileProductionEvalArtifactStore(""), /path is invalid/);
  assert.throws(() => new FileProductionEvalArtifactStore("x".repeat(4_097)), /path is invalid/);
  assert.throws(() => new FileProductionEvalArtifactStore("invalid\0path"), /path is invalid/);
  assert.throws(
    () => new FileProductionEvalArtifactStore(temporaryPath(), { readText: 1 as never }),
    /configuration is invalid/,
  );
  assert.throws(
    () =>
      new FileProductionEvalArtifactStore(
        temporaryPath(),
        new Proxy(
          {},
          {
            get: () => {
              throw new Error("sensitive option detail");
            },
          },
        ),
      ),
    /configuration is invalid/,
  );
  const invalid = new FileProductionEvalArtifactStore(temporaryPath()).append({});
  assert.equal(invalid.ok, false);
  if (invalid.ok) assert.fail("Expected invalid artifact");
  assert.equal(invalid.error.code, "invalid_artifact");

  const conflictPath = temporaryPath();
  const conflictStore = new FileProductionEvalArtifactStore(conflictPath);
  assert.equal(conflictStore.append(artifact).ok, true);
  const conflict = structuredClone(artifact);
  conflict.finishedAt = "2026-08-11T23:59:59.000Z";
  const conflictOutcome = conflictStore.append(conflict);
  assert.equal(conflictOutcome.ok, false);
  if (conflictOutcome.ok) assert.fail("Expected artifact conflict");
  assert.equal(conflictOutcome.error.code, "artifact_conflict");

  for (const [text, code] of [
    ["", "interrupted_artifact"],
    ["{}", "interrupted_artifact"],
    ["{}\n", "corrupt_artifact"],
    ["not-json\n", "corrupt_artifact"],
  ] as const) {
    const path = temporaryPath();
    writeFileSync(path, text, { mode: 0o600 });
    const listed = new FileProductionEvalArtifactStore(path).list();
    assert.equal(listed.ok, false);
    if (listed.ok) assert.fail(`Expected ${code}`);
    assert.equal(listed.error.code, code);
  }

  const noOp = new FileProductionEvalArtifactStore(temporaryPath(), {
    writeRecord: () => undefined,
  }).append(artifact);
  assert.equal(noOp.ok, false);
  if (noOp.ok) assert.fail("Expected no-op persistence refusal");
  assert.equal(noOp.error.code, "storage_failure");

  const readFailure = new FileProductionEvalArtifactStore(temporaryPath(), {
    readText: () => {
      throw new Error("sensitive read detail");
    },
  }).append(artifact);
  assert.equal(readFailure.ok, false);
  if (readFailure.ok) assert.fail("Expected read failure");
  assert.equal(readFailure.error.code, "storage_failure");

  const writePath = temporaryPath();
  const writeFailure = new FileProductionEvalArtifactStore(writePath, {
    writeRecord: () => {
      throw new Error("sensitive write detail");
    },
  }).append(artifact);
  assert.equal(writeFailure.ok, false);
  if (writeFailure.ok) assert.fail("Expected write failure");
  assert.equal(writeFailure.error.code, "storage_failure");
});

test("scorecard is stable, compact, actionable, and excludes synthetic draft content", async () => {
  const artifact = await passingArtifact();
  const scorecard = renderProductionEvalScorecard(artifact);

  assert.match(scorecard, /^PRODUCTION EVAL PASS 18\/18 cases critical_failures:0/m);
  assert.equal((scorecard.match(/^PASS eval_/gm) ?? []).length, 18);
  assert.match(scorecard, /QUALITY average:unavailable latency_threshold:pending/);
  assert.match(scorecard, /ARTIFACT evalrun_test_suite_001/);
  assert.doesNotMatch(scorecard, /Hi Ada|Northstar Ops|support triage is slow/);
  assert.match(renderProductionEvalScorecard({}), /ERROR invalid_artifact/);
  assert.match(
    renderProductionEvalFailure({
      ok: false,
      error: {
        code: "persistence_failure",
        message: "Production eval artifact could not be proven durable.",
      },
    }),
    /ERROR persistence_failure/,
  );
});

test("persisted artifact keeps explicit usage availability and no protected payloads", async () => {
  const path = temporaryPath();
  const outcome = await runProductionEvalSuite(
    stableRunnerOptions(cachedExecutor, new FileProductionEvalArtifactStore(path)),
  );
  if (!outcome.ok) assert.fail(outcome.error.message);

  assert.equal(
    outcome.value.results.every(
      (result) =>
        result.metrics.tokens.availability === "unavailable" &&
        result.metrics.cost.availability === "unavailable",
    ),
    true,
  );
  assert.equal(outcome.value.thresholds.latencyMs.status, "pending");
  assert.equal(outcome.value.thresholds.tokens.status, "pending");
  assert.equal(outcome.value.thresholds.costUsd.status, "pending");
  const durable = readFileSync(path, "utf8");
  assert.doesNotMatch(durable, /Hi Ada|Northstar Ops|Support triage|fabricated ungrounded/);
  assert.doesNotMatch(
    durable,
    /AKIA[0-9A-Z]{16}|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY|api[_-]?key["']?\s*[:=]\s*["'][^"']+/i,
  );
});

test("runner rejects invalid suite and hostile configuration without invoking a case", async () => {
  let calls = 0;
  const invalidSuite = structuredClone(PRODUCTION_EVAL_SUITE);
  invalidSuite.cases = invalidSuite.cases.slice(0, 9);
  const invalid = await runProductionEvalSuite({
    suite: invalidSuite,
    executeCase: async () => {
      calls += 1;
      return {};
    },
    artifactStore: memoryStore(),
  });
  assert.equal(invalid.ok, false);
  if (invalid.ok) assert.fail("Expected invalid suite");
  assert.equal(invalid.error.code, "invalid_suite");
  assert.equal(calls, 0);

  const badRunId = await runProductionEvalSuite({
    ...stableRunnerOptions(cachedExecutor),
    makeRunId: () => "invalid",
  });
  assert.equal(badRunId.ok, false);
  if (badRunId.ok) assert.fail("Expected invalid configuration");
  assert.equal(badRunId.error.code, "invalid_configuration");

  const hostileOptions = new Proxy(stableRunnerOptions(cachedExecutor), {
    get: () => {
      throw new Error("sensitive configuration detail");
    },
  });
  const hostile = await runProductionEvalSuite(hostileOptions);
  assert.equal(hostile.ok, false);
  if (hostile.ok) assert.fail("Expected hostile configuration refusal");
  assert.equal(hostile.error.code, "invalid_configuration");
  assert.doesNotMatch(JSON.stringify(hostile), /sensitive configuration detail/);
});
