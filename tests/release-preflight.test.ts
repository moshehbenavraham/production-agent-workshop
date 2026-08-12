import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";
import {
  evaluateReleasePreflight,
  isReleasePreflightFailure,
  isReleasePreflightRequest,
  isReleasePreflightResult,
  RELEASE_DECISION_DEFINITIONS,
  RELEASE_OWNER_ROLES,
  RELEASE_PREFLIGHT_CHECK_IDS,
  RELEASE_SECURITY_GATE_IDS,
  type ReleasePreflightRequest,
} from "../src/release-preflight.js";

const ROOT = resolve(import.meta.dirname, "..");
const COMMAND = resolve(ROOT, "scripts/release-preflight.ts");
const INCOMPLETE_FIXTURE = resolve(ROOT, "docs/fixtures/release-preflight-incomplete.json");
const REVISION = "a".repeat(40);
const DIGEST = `sha256:${"b".repeat(64)}`;

function controlledGateStatus(
  id: (typeof RELEASE_SECURITY_GATE_IDS)[number],
  runsRoute: "private" | "edge_restricted" = "private",
): ReleasePreflightRequest["securityGates"][number]["status"] {
  if (id === "body_size_controls") return "application_enforced";
  if (id === "data_lifecycle") return "synthetic_only";
  if (id === "alert_delivery") return "runbook_only";
  if (id === "edge_waf" && runsRoute === "edge_restricted") return "confirmed";
  return "route_not_exposed";
}

function readyControlledRequest(
  runsRoute: "private" | "edge_restricted" = "private",
): ReleasePreflightRequest {
  return {
    schemaVersion: 1,
    source: {
      revision: REVISION,
      workingTreeClean: true,
      repositoryVerification: "passed",
      evalPassed: 18,
      evalTotal: 18,
      drillPassed: 5,
      drillTotal: 5,
    },
    image: { status: "recorded", digest: DIGEST },
    exposure: { mode: "controlled", healthRoute: "external_https", runsRoute },
    runtime: {
      port: 3000,
      replicas: 1,
      dataMount: "/app/data",
      eventLogPath: "/app/data/events.jsonl",
      approvalLogPath: "/app/data/approvals.jsonl",
      requestBodyLimitBytes: 16_384,
      runDeadlineConfigured: true,
      runStepLimitConfigured: true,
      processRateLimitConfigured: true,
    },
    secrets: {
      store: "coolify_secret_store",
      valuesIncluded: false,
      providerCredentialConfigured: true,
      rotationProcedureConfirmed: true,
      revocationProcedureConfirmed: true,
    },
    decisions: RELEASE_DECISION_DEFINITIONS.map((item) => ({ ...item, confirmed: true })),
    securityGates: RELEASE_SECURITY_GATE_IDS.map((id) => ({
      id,
      status: controlledGateStatus(id, runsRoute),
    })),
    target: {
      authorized: true,
      isolatedEnvironment: true,
      persistentStorageConfigured: true,
      externalHealthCheckOwned: true,
      monitoringConfigured: true,
      backupDestinationOwned: true,
      pauseOwnerConfirmed: true,
      recoveryOwnerConfirmed: true,
      rollbackImageReserved: true,
    },
  };
}

function readyPublicRequest(): ReleasePreflightRequest {
  const request = readyControlledRequest();
  request.exposure = { mode: "public", healthRoute: "external_https", runsRoute: "public" };
  request.securityGates = RELEASE_SECURITY_GATE_IDS.map((id) => ({ id, status: "confirmed" }));
  return request;
}

function cloneRequest(request: ReleasePreflightRequest): ReleasePreflightRequest {
  return structuredClone(request);
}

function requireResult(request: unknown) {
  const outcome = evaluateReleasePreflight(request);
  assert.equal(outcome.ok, true);
  if (!outcome.ok) throw new Error("expected preflight result");
  return outcome.value;
}

function assertBlocked(request: unknown, checkId: string): void {
  const result = requireResult(request);
  assert.equal(result.status, "blocked");
  assert.ok(result.blockedCheckIds.includes(checkId as never));
  assert.equal(result.targetMutationAllowed, false);
}

function runCommand(input: string, args: readonly string[] = []) {
  return spawnSync(process.execPath, ["--import", "tsx", COMMAND, ...args], {
    cwd: ROOT,
    input,
    encoding: "utf8",
    timeout: 10_000,
  });
}

test("finite inventories are complete and frozen", () => {
  assert.deepEqual(RELEASE_OWNER_ROLES, [
    "release_operator",
    "security_operator",
    "platform_operator",
    "recovery_operator",
    "service_operator",
  ]);
  assert.equal(RELEASE_DECISION_DEFINITIONS.length, 13);
  assert.equal(RELEASE_SECURITY_GATE_IDS.length, 10);
  assert.equal(RELEASE_PREFLIGHT_CHECK_IDS.length, 15);
  assert.equal(Object.isFrozen(RELEASE_OWNER_ROLES), true);
  assert.equal(Object.isFrozen(RELEASE_DECISION_DEFINITIONS), true);
  assert.equal(RELEASE_DECISION_DEFINITIONS.every(Object.isFrozen), true);
});

test("exact controlled private request is ready with stable minimized checks", () => {
  const result = requireResult(readyControlledRequest());
  assert.equal(result.status, "ready");
  assert.equal(result.exposureMode, "controlled");
  assert.equal(result.sourceRevision, REVISION);
  assert.equal(result.imageDigest, DIGEST);
  assert.deepEqual(
    result.checks.map((item) => item.id),
    RELEASE_PREFLIGHT_CHECK_IDS,
  );
  assert.deepEqual(result.blockedCheckIds, []);
  assert.equal(
    result.checks.every((item) => item.status === "pass"),
    true,
  );
  assert.equal(result.targetMutationAllowed, false);
  assert.equal(isReleasePreflightResult(result), true);
});

test("controlled edge-restricted request requires its edge gate", () => {
  const request = readyControlledRequest("edge_restricted");
  assert.equal(requireResult(request).status, "ready");
  const unsafe = cloneRequest(request);
  const edge = unsafe.securityGates.find((item) => item.id === "edge_waf");
  assert.ok(edge);
  edge.status = "route_not_exposed";
  assertBlocked(unsafe, "exposure_safe");
});

test("hypothetical public request is ready only when all public gates are confirmed", () => {
  const request = readyPublicRequest();
  const result = requireResult(request);
  assert.equal(result.status, "ready");
  assert.equal(result.exposureMode, "public");
  assert.equal(result.checks[1]?.reason, "public_exposure_gates_confirmed");

  for (const id of RELEASE_SECURITY_GATE_IDS) {
    const unsafe = cloneRequest(request);
    const gate = unsafe.securityGates.find((item) => item.id === id);
    assert.ok(gate);
    gate.status = "route_not_exposed";
    assertBlocked(unsafe, "exposure_safe");
  }
});

test("route and health drift cannot become controlled or public ready", () => {
  const controlledPublicRoute = readyControlledRequest();
  controlledPublicRoute.exposure.runsRoute = "public";
  assertBlocked(controlledPublicRoute, "exposure_safe");

  const publicPrivateRoute = readyPublicRequest();
  publicPrivateRoute.exposure.runsRoute = "private";
  assertBlocked(publicPrivateRoute, "exposure_safe");

  const noHttps = readyControlledRequest();
  noHttps.exposure.healthRoute = "unverified";
  assertBlocked(noHttps, "exposure_safe");
});

test("every source and image prerequisite blocks its exact readiness checks", () => {
  const sourceCases: Array<(request: ReleasePreflightRequest) => void> = [
    (request) => {
      request.source.workingTreeClean = false;
    },
    (request) => {
      request.source.repositoryVerification = "failed";
    },
    (request) => {
      request.source.evalPassed = 17;
    },
    (request) => {
      request.source.drillPassed = 4;
    },
  ];
  for (const mutate of sourceCases) {
    const request = readyControlledRequest();
    mutate(request);
    assertBlocked(request, "source_verified");
  }

  const pending = readyControlledRequest();
  pending.image = { status: "pending", digest: null };
  assertBlocked(pending, "image_recorded");
  const missingDigest = readyControlledRequest();
  missingDigest.image.digest = null;
  assertBlocked(missingDigest, "image_recorded");
});

test("runtime drift blocks port, replica, paths, body bound, and configured limits", () => {
  const cases: Array<(request: ReleasePreflightRequest) => void> = [
    (request) => {
      request.runtime.port = 3001;
    },
    (request) => {
      request.runtime.replicas = 2;
    },
    (request) => {
      request.runtime.dataMount = "mismatch";
    },
    (request) => {
      request.runtime.eventLogPath = "mismatch";
    },
    (request) => {
      request.runtime.approvalLogPath = "mismatch";
    },
    (request) => {
      request.runtime.requestBodyLimitBytes = 16_385;
    },
    (request) => {
      request.runtime.runDeadlineConfigured = false;
    },
    (request) => {
      request.runtime.runStepLimitConfigured = false;
    },
    (request) => {
      request.runtime.processRateLimitConfigured = false;
    },
  ];
  for (const mutate of cases) {
    const request = readyControlledRequest();
    mutate(request);
    assertBlocked(request, "runtime_bounded");
  }
});

test("decision inventory requires exact order, mapping, ownership, and confirmation", () => {
  const missing = readyControlledRequest();
  missing.decisions.pop();
  assertBlocked(missing, "decisions_confirmed");

  const reordered = readyControlledRequest();
  const first = reordered.decisions.shift();
  assert.ok(first);
  reordered.decisions.push(first);
  assertBlocked(reordered, "decisions_confirmed");

  const unconfirmed = readyControlledRequest();
  const decision = unconfirmed.decisions[0];
  assert.ok(decision);
  decision.confirmed = false;
  assertBlocked(unconfirmed, "decisions_confirmed");

  const wrongOwner = readyControlledRequest();
  const capacity = wrongOwner.decisions[0];
  assert.ok(capacity);
  capacity.ownerRole = "service_operator";
  assertBlocked(wrongOwner, "decisions_confirmed");
});

test("secret storage never passes with values or missing rotation ownership", () => {
  const cases: Array<(request: ReleasePreflightRequest) => void> = [
    (request) => {
      request.secrets.store = "unverified";
    },
    (request) => {
      request.secrets.valuesIncluded = true;
    },
    (request) => {
      request.secrets.providerCredentialConfigured = false;
    },
    (request) => {
      request.secrets.rotationProcedureConfirmed = false;
    },
    (request) => {
      request.secrets.revocationProcedureConfirmed = false;
    },
  ];
  for (const mutate of cases) {
    const request = readyControlledRequest();
    mutate(request);
    assertBlocked(request, "secret_boundary");
  }
});

test("every target fact maps to a finite blocked check", () => {
  const cases: Array<[keyof ReleasePreflightRequest["target"], string]> = [
    ["authorized", "target_authorized"],
    ["isolatedEnvironment", "environment_isolated"],
    ["persistentStorageConfigured", "persistence_configured"],
    ["externalHealthCheckOwned", "health_owned"],
    ["monitoringConfigured", "monitoring_configured"],
    ["backupDestinationOwned", "backup_owned"],
    ["pauseOwnerConfirmed", "incident_ownership"],
    ["recoveryOwnerConfirmed", "incident_ownership"],
    ["rollbackImageReserved", "rollback_reserved"],
  ];
  for (const [field, checkId] of cases) {
    const request = readyControlledRequest();
    request.target[field] = false;
    assertBlocked(request, checkId);
  }
});

test("closed request schema rejects extras, malformed identities, and missing fields", () => {
  const extra = { ...readyControlledRequest(), privateUrl: "https://protected.invalid" };
  assert.equal(isReleasePreflightRequest(extra), false);
  const badRevision = readyControlledRequest();
  badRevision.source.revision = "not-a-revision";
  const outcome = evaluateReleasePreflight(badRevision);
  assert.equal(outcome.ok, false);
  if (outcome.ok) throw new Error("expected invalid request");
  assert.deepEqual(outcome.error, {
    code: "invalid_release_preflight",
    message: "Release preflight input is invalid.",
  });
  assert.equal(isReleasePreflightFailure(outcome.error), true);

  const missing = readyControlledRequest() as unknown as Record<string, unknown>;
  delete missing.target;
  assert.equal(evaluateReleasePreflight(missing).ok, false);
});

test("accessors, symbols, prototypes, and cycles fail without executing accessors", () => {
  let reads = 0;
  const accessor = readyControlledRequest() as unknown as Record<string, unknown>;
  Object.defineProperty(accessor, "source", {
    enumerable: true,
    get() {
      reads += 1;
      return {};
    },
  });
  assert.equal(evaluateReleasePreflight(accessor).ok, false);
  assert.equal(reads, 0);

  const symbol = readyControlledRequest() as unknown as Record<PropertyKey, unknown>;
  symbol[Symbol("private")] = "protected";
  assert.equal(evaluateReleasePreflight(symbol).ok, false);

  const inherited = Object.create(readyControlledRequest()) as unknown;
  assert.equal(evaluateReleasePreflight(inherited).ok, false);

  const cyclic = readyControlledRequest() as unknown as Record<string, unknown>;
  cyclic.cycle = cyclic;
  assert.equal(evaluateReleasePreflight(cyclic).ok, false);

  const oversizedTree = readyControlledRequest() as unknown as Record<string, unknown>;
  oversizedTree.tree = Array.from({ length: 100 }, () =>
    Array.from({ length: 20 }, () => ({ safe: true })),
  );
  assert.equal(evaluateReleasePreflight(oversizedTree).ok, false);
});

test("input is detached and ready output is deeply immutable", () => {
  const request = readyControlledRequest();
  const result = requireResult(request);
  request.target.authorized = false;
  const firstDecision = request.decisions[0];
  assert.ok(firstDecision);
  firstDecision.confirmed = false;
  assert.equal(result.status, "ready");
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.checks), true);
  assert.equal(Object.isFrozen(result.checks[0]), true);
  assert.throws(() => {
    (result.checks as Array<unknown>).push({});
  }, TypeError);
});

test("result and failure guards reject structural and relationship damage", () => {
  const result = requireResult(readyControlledRequest());
  const extra = { ...result, extra: true };
  assert.equal(isReleasePreflightResult(extra), false);
  const reordered = structuredClone(result);
  const first = reordered.checks.shift();
  assert.ok(first);
  reordered.checks.push(first);
  assert.equal(isReleasePreflightResult(reordered), false);
  const falseReady = structuredClone(result);
  falseReady.status = "blocked";
  assert.equal(isReleasePreflightResult(falseReady), false);
  const wrongReason = structuredClone(result);
  const sourceCheck = wrongReason.checks.find((item) => item.id === "source_verified");
  assert.ok(sourceCheck);
  sourceCheck.reason = "image_recorded";
  assert.equal(isReleasePreflightResult(wrongReason), false);
  const missingImageIdentity = structuredClone(result);
  missingImageIdentity.imageDigest = null;
  assert.equal(isReleasePreflightResult(missingImageIdentity), false);

  assert.equal(
    isReleasePreflightFailure({
      code: "invalid_release_preflight",
      message: "Release preflight evaluation failed.",
    }),
    false,
  );
});

test("checked-in example is valid, redacted, and deliberately blocked", () => {
  const text = readFileSync(INCOMPLETE_FIXTURE, "utf8");
  const request = JSON.parse(text) as unknown;
  assert.equal(isReleasePreflightRequest(request), true);
  const result = requireResult(request);
  assert.equal(result.status, "blocked");
  assert.deepEqual(result.blockedCheckIds, [
    "target_authorized",
    "source_verified",
    "image_recorded",
    "runtime_bounded",
    "decisions_confirmed",
    "secret_boundary",
    "environment_isolated",
    "persistence_configured",
    "health_owned",
    "monitoring_configured",
    "backup_owned",
    "incident_ownership",
    "rollback_reserved",
  ]);
  assert.equal(result.imageDigest, null);
  assert.equal(text.includes("OPENAI_API_KEY"), false);
  assert.equal(text.includes("ANTHROPIC_API_KEY"), false);
  assert.equal(text.includes("@"), false);
});

test("invalid protected context is never echoed", () => {
  const protectedValue = "credential_private_operator_target";
  const request = { ...readyControlledRequest(), note: protectedValue };
  const outcome = evaluateReleasePreflight(request);
  assert.equal(outcome.ok, false);
  assert.equal(JSON.stringify(outcome).includes(protectedValue), false);
});

test("command prints one closed ready result and exits zero", () => {
  const completed = runCommand(JSON.stringify(readyControlledRequest()));
  assert.equal(completed.status, 0);
  assert.equal(completed.stderr, "");
  assert.equal(completed.stdout.trim().split("\n").length, 1);
  const result = JSON.parse(completed.stdout) as unknown;
  assert.equal(isReleasePreflightResult(result), true);
  assert.equal((result as { status: string }).status, "ready");
});

test("command prints one closed blocked result and exits one", () => {
  const completed = runCommand(readFileSync(INCOMPLETE_FIXTURE, "utf8"));
  assert.equal(completed.status, 1);
  assert.equal(completed.stderr, "");
  const result = JSON.parse(completed.stdout) as unknown;
  assert.equal(isReleasePreflightResult(result), true);
  assert.equal((result as { status: string }).status, "blocked");
});

test("command rejects args, empty, malformed, multiple, and oversized input canonically", () => {
  const cases = [
    runCommand(JSON.stringify(readyControlledRequest()), ["--target", "private"]),
    runCommand(""),
    runCommand("{"),
    runCommand("{}\n{}"),
    runCommand(JSON.stringify({ value: "x".repeat(65_536) })),
  ];
  for (const completed of cases) {
    assert.equal(completed.status, 2);
    assert.equal(completed.stdout, "");
    assert.deepEqual(JSON.parse(completed.stderr), {
      code: "invalid_release_preflight_command",
      message:
        "Release preflight command requires one bounded JSON object on stdin and no arguments.",
    });
  }
});

test("preflight implementation adds no network, target, process, or secret-reading capability", () => {
  const source = readFileSync(resolve(ROOT, "src/release-preflight.ts"), "utf8");
  const command = readFileSync(COMMAND, "utf8");
  for (const forbidden of [
    "node:fs",
    "node:http",
    "node:https",
    "node:net",
    "node:tls",
    "child_process",
    "fetch(",
    "process.env",
    "auth.json",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
    assert.equal(command.includes(forbidden), false, forbidden);
  }
  assert.equal(command.includes("process.stdin"), true);
  assert.equal(source.includes("targetMutationAllowed: false"), true);
});
