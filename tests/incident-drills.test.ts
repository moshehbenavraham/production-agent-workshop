import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";
import Schema from "typebox/schema";
import {
  INCIDENT_DRILL_DEFINITIONS,
  INCIDENT_DRILL_SCHEMA_VERSION,
  INCIDENT_DRILL_SUITE_ID,
  IncidentDrillFailureSchema,
  IncidentDrillResultSchema,
  IncidentDrillSuiteSchema,
  isIncidentDrillResult,
  isIncidentDrillSuite,
  runIncidentDrill,
  runIncidentDrills,
  type IncidentDrillResult,
  type IncidentDrillSuite,
} from "../src/incident-drills.js";
import { PRODUCTION_EVAL_SUITE } from "../src/production-eval-golden-set.js";
import { executeProductionEvalCaseWithReport } from "../src/production-eval-harness.js";
import { isRunReport } from "../src/run-report.js";

const COMMAND = fileURLToPath(new URL("../scripts/incident-drills.ts", import.meta.url));
const SOURCE = fileURLToPath(new URL("../src/incident-drills.ts", import.meta.url));
const HARNESS_SOURCE = fileURLToPath(new URL("../src/production-eval-harness.ts", import.meta.url));

let suitePromise: Promise<IncidentDrillSuite> | undefined;

async function suite(): Promise<IncidentDrillSuite> {
  suitePromise ??= runIncidentDrills().then((outcome) => {
    if (!outcome.ok) assert.fail(outcome.error.message);
    return outcome.value;
  });
  return structuredClone(await suitePromise);
}

function resultFor(results: readonly IncidentDrillResult[], drillId: string): IncidentDrillResult {
  const result = results.find((candidate) => candidate.drillId === drillId);
  if (!result) assert.fail(`Missing drill result ${drillId}`);
  return result;
}

function caseFor(caseId: string) {
  const caseDefinition = PRODUCTION_EVAL_SUITE.cases.find((candidate) => candidate.id === caseId);
  if (!caseDefinition) assert.fail(`Missing production eval case ${caseId}`);
  return caseDefinition;
}

function runCommand(args: readonly string[] = []) {
  return spawnSync(process.execPath, ["--import", "tsx", COMMAND, ...args], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8",
    timeout: 30_000,
  });
}

function temporaryHarnessDirectories(): string[] {
  return readdirSync(tmpdir())
    .filter((name) => name.startsWith("production-eval-report-"))
    .sort();
}

test("manifest contains exactly the five required immutable golden cases", () => {
  assert.equal(INCIDENT_DRILL_SCHEMA_VERSION, 1);
  assert.equal(INCIDENT_DRILL_SUITE_ID, "incident_drills_v1");
  assert.deepEqual(
    INCIDENT_DRILL_DEFINITIONS.map(({ id, caseId }) => [id, caseId]),
    [
      ["tool_timeout", "eval_qualification_timeout"],
      ["invalid_model_response", "eval_invalid_model_output"],
      ["mid_run_restart", "eval_restart_after_approval"],
      ["revoked_credential", "eval_revoked_provider_credential"],
      ["duplicate_request", "eval_duplicate_fake_request"],
    ],
  );
  for (const definition of INCIDENT_DRILL_DEFINITIONS) {
    assert.equal(Object.isFrozen(definition), true);
    assert.equal(Object.isFrozen(definition.expectedEvents), true);
    assert.equal(Object.isFrozen(definition.expectedOutcome), true);
    assert.equal(
      PRODUCTION_EVAL_SUITE.cases.some(({ id }) => id === definition.caseId),
      true,
    );
  }
});

test("suite executes all five drills in stable order with closed passing results", async () => {
  const result = await suite();
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.suiteId, INCIDENT_DRILL_SUITE_ID);
  assert.equal(result.status, "pass");
  assert.deepEqual(
    result.results.map(({ drillId }) => drillId),
    INCIDENT_DRILL_DEFINITIONS.map(({ id }) => id),
  );
  assert.equal(result.results.every(isIncidentDrillResult), true);
  assert.equal(isIncidentDrillSuite(result), true);
});

test("tool timeout reports exact failure chronology and a below-threshold no-alert", async () => {
  const result = resultFor((await suite()).results, "tool_timeout");
  assert.deepEqual(result.outcome, {
    kind: "stop",
    code: "qualification_timeout",
    stopReason: "qualification_failed",
  });
  assert.deepEqual(
    result.report.timeline.map(({ eventType }) => eventType),
    ["run.started", "qualification.attempted", "qualification.failed", "run.completed"],
  );
  assert.equal(result.report.status, "stopped");
  assert.equal(result.alert.ruleId, "repeated_task_failure");
  assert.equal(result.alert.status, "clear");
  assert.equal(result.alert.evidence.observedValue, 1);
  assert.equal(result.alert.evidence.threshold, 3);
  assert.equal(result.runbookAction, "stop");
});

test("invalid model response stops without completion or application content", async () => {
  const result = resultFor((await suite()).results, "invalid_model_response");
  assert.deepEqual(result.outcome, {
    kind: "stop",
    code: "invalid_model_output",
    stopReason: "dependency_failed",
  });
  assert.deepEqual(
    result.report.timeline.map(({ eventType }) => eventType),
    ["run.started", "run.stopped"],
  );
  assert.deepEqual(result.report.terminal, {
    kind: "stopped",
    stopReason: "dependency_failed",
  });
  assert.equal(result.permission.effectCount, 0);
  assert.equal(JSON.stringify(result).includes("draftContent"), false);
});

test("mid-run restart resumes the same run and creates no duplicate approval or effect", async () => {
  const result = resultFor((await suite()).results, "mid_run_restart");
  assert.equal(result.report.runId, "run_restart_after_approval");
  assert.equal(result.report.status, "waiting_for_approval");
  assert.equal(result.report.latestSafeCheckpoint, "approval_requested");
  assert.deepEqual(result.recovery, { action: "resume", checkpoint: "approval_requested" });
  assert.deepEqual(result.permission, {
    decision: "not_evaluated",
    approvalState: "pending",
    effectCount: 0,
  });
  assert.equal(
    result.report.timeline.filter(({ eventType }) => eventType === "approval.requested").length,
    1,
  );
  assert.equal(
    result.report.timeline.some(({ layer }) => layer === "effect"),
    false,
  );
  assert.equal(result.runbookAction, "resume");
});

test("revoked credential uses injected unavailable dependency evidence without a credential", async () => {
  const result = resultFor((await suite()).results, "revoked_credential");
  assert.equal(result.outcome.code, "dependency_failed");
  assert.equal(result.alert.ruleId, "unavailable_dependency");
  assert.equal(result.alert.status, "triggered");
  assert.equal(result.alert.evidence.observedCount, 2);
  assert.equal(result.alert.evidence.observedValue, 2);
  assert.equal(result.alert.evidence.threshold, 2);
  assert.equal(result.alert.operatorAction, "inspect_dependency");
  assert.equal(JSON.stringify(result).includes("credential"), true);
  assert.equal(JSON.stringify(result).includes("revoked credential"), false);
});

test("duplicate request returns one effect while report remains observed-only", async () => {
  const result = resultFor((await suite()).results, "duplicate_request");
  assert.deepEqual(result.outcome, {
    kind: "success",
    code: "duplicate",
    stopReason: "completed",
  });
  assert.equal(result.permission.effectCount, 1);
  assert.equal(result.report.authority, "observed_only");
  assert.equal(result.report.status, "effect_indeterminate");
  assert.equal(
    result.report.timeline.filter(({ eventType }) => eventType === "fake_send.attempted").length,
    1,
  );
  assert.equal(
    result.report.timeline.filter(({ eventType }) => eventType === "fake_send.accepted").length,
    1,
  );
  assert.equal(
    result.report.timeline.filter(({ eventType }) => eventType === "fake_send.duplicate").length,
    1,
  );
  assert.equal(result.runbookAction, "stop");
});

test("every drill captures measured or explicit operational baseline fields", async () => {
  for (const result of (await suite()).results) {
    assert.deepEqual(result.baseline.success, { status: "available", value: true });
    assert.equal(result.baseline.latency.availability, "available");
    if (result.baseline.latency.availability === "available") {
      assert.equal(result.baseline.latency.value >= 0, true);
      assert.equal(result.baseline.latency.unit, "ms");
    }
    assert.deepEqual(result.baseline.tokens, {
      availability: "unavailable",
      value: null,
      reason: "provider_independent",
    });
    assert.deepEqual(result.baseline.cost, {
      availability: "unavailable",
      value: null,
      reason: "provider_independent",
    });
    assert.equal(result.baseline.explainability.timelineEvents, result.report.timeline.length);
    assert.equal(result.baseline.operationalComplexity.operatorSteps >= 1, true);
  }
});

test("single-drill API returns an immutable safe report and rejects unknown selection", async () => {
  const executed = await runIncidentDrill("tool_timeout");
  if (!executed.ok) assert.fail(executed.error.message);
  assert.equal(executed.ok, true);
  assert.equal(Object.isFrozen(executed), true);
  assert.equal(Object.isFrozen(executed.value), true);
  assert.equal(Object.isFrozen(executed.value.report.timeline), true);

  assert.deepEqual(await runIncidentDrill("unknown"), {
    ok: false,
    error: {
      code: "invalid_drill",
      drillId: null,
      message: "Incident drill selection is invalid.",
    },
  });
  assert.equal((await runIncidentDrill({ id: "tool_timeout" })).ok, false);
});

test("harness returns only minimized observation and report and cleans its directory", async () => {
  const before = temporaryHarnessDirectories();
  const evidence = await executeProductionEvalCaseWithReport(caseFor("eval_invalid_model_output"));
  const after = temporaryHarnessDirectories();
  assert.deepEqual(after, before);
  assert.equal(isRunReport(evidence.report), true);
  assert.deepEqual(Object.keys(evidence).sort(), ["observation", "report"]);
  assert.equal("events" in evidence, false);
  assert.equal("path" in evidence, false);
  assert.equal(Object.isFrozen(evidence), true);
  assert.equal(Object.isFrozen(evidence.observation), true);
  assert.equal(Object.isFrozen(evidence.observation.metrics), true);
});

test("result and suite guards reject accessor-backed and semantically impossible evidence", async () => {
  const valid = resultFor((await suite()).results, "tool_timeout");
  const wrongRun = structuredClone(valid);
  wrongRun.report.runId = "run_wrong_incident";
  assert.equal(isIncidentDrillResult(wrongRun), false);

  const wrongAlert = structuredClone(valid);
  wrongAlert.alert.status = "triggered";
  assert.equal(isIncidentDrillResult(wrongAlert), false);

  const wrongAlertThreshold = structuredClone(valid);
  wrongAlertThreshold.alert.evidence.threshold = 2;
  assert.equal(isIncidentDrillResult(wrongAlertThreshold), false);

  const wrongReportMetrics = structuredClone(valid);
  if (wrongReportMetrics.report.metrics.elapsedDuration.status !== "available") {
    assert.fail("Expected available elapsed duration.");
  }
  wrongReportMetrics.report.metrics.elapsedDuration.value += 1;
  assert.equal(isIncidentDrillResult(wrongReportMetrics), false);

  const wrongEvents = structuredClone(valid);
  wrongEvents.report.timeline.reverse();
  assert.equal(isIncidentDrillResult(wrongEvents), false);

  let getterCalls = 0;
  const accessor = Object.defineProperty({}, "schemaVersion", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return 1;
    },
  });
  assert.equal(isIncidentDrillResult(accessor), false);
  assert.equal(isIncidentDrillSuite(accessor), false);
  assert.equal(getterCalls, 0);
});

test("closed schemas reject extra fields and canonical failure remains bounded", async () => {
  const resultValidator = Schema.Compile(IncidentDrillResultSchema);
  const suiteValidator = Schema.Compile(IncidentDrillSuiteSchema);
  const failureValidator = Schema.Compile(IncidentDrillFailureSchema);
  const validSuite = await suite();
  const validResult = validSuite.results[0];
  if (!validResult) assert.fail("Missing incident result.");
  assert.equal(resultValidator.Check(validResult), true);
  assert.equal(resultValidator.Check({ ...validResult, rawEvents: [] }), false);
  assert.equal(suiteValidator.Check(validSuite), true);
  assert.equal(suiteValidator.Check({ ...validSuite, directory: "/tmp/private" }), false);
  assert.equal(
    failureValidator.Check({
      code: "drill_execution_failed",
      drillId: "tool_timeout",
      message: "Incident drill execution failed.",
    }),
    true,
  );
});

test("serialized suite omits protected identities, payloads, paths, errors, and send claims", async () => {
  const serialized = JSON.stringify(await suite());
  for (const protectedValue of [
    "lead_ada",
    "actor_workshop",
    "approvalId",
    "draftContent",
    "validatedArguments",
    "eventId",
    "reservationId",
    "idempotencyKey",
    "receipt",
    "provider-secret",
    "raw error",
    "/tmp/",
    "production-eval-report-",
    "message_sent",
  ]) {
    assert.equal(serialized.includes(protectedValue), false, protectedValue);
  }
});

test("command emits one closed JSON suite and no stderr", () => {
  const command = runCommand();
  assert.equal(command.status, 0, command.stderr);
  assert.equal(command.stderr, "");
  const parsed: unknown = JSON.parse(command.stdout);
  assert.equal(isIncidentDrillSuite(parsed), true);
});

test("command rejects arguments before drill execution with a canonical error", () => {
  const command = runCommand(["unexpected"]);
  assert.equal(command.status, 1);
  assert.equal(command.stdout, "");
  assert.deepEqual(JSON.parse(command.stderr), {
    code: "invalid_drill_command",
    message: "Incident drill command accepts no arguments.",
  });
});

test("drill modules add no provider, network, server, notification, or retained path boundary", () => {
  const source = readFileSync(SOURCE, "utf8");
  const command = readFileSync(COMMAND, "utf8");
  const harness = readFileSync(HARNESS_SOURCE, "utf8");
  for (const forbidden of [
    "fetch(",
    "node:http",
    "node:https",
    "webhook",
    "registerTool",
    "createServer",
    "writeFile",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
    assert.equal(command.includes(forbidden), false, forbidden);
  }
  assert.equal(harness.includes("executeProductionEvalCaseWithReport"), true);
  assert.equal(harness.includes("finally"), true);
  assert.equal(harness.includes("rmSync(directory"), true);
});
