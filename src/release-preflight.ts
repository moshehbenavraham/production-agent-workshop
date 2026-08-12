import { Type } from "typebox";
import Schema from "typebox/schema";

export const RELEASE_PREFLIGHT_SCHEMA_VERSION = 1 as const;

export const RELEASE_OWNER_ROLES = Object.freeze([
  "release_operator",
  "security_operator",
  "platform_operator",
  "recovery_operator",
  "service_operator",
] as const);

export const RELEASE_DECISION_DEFINITIONS = Object.freeze([
  Object.freeze({
    id: "capacity",
    ownerRole: "release_operator",
    validationMethod: "target_console",
    evidenceSlot: "infrastructure.capacity",
  }),
  Object.freeze({
    id: "region_data_location",
    ownerRole: "security_operator",
    validationMethod: "lifecycle_review",
    evidenceSlot: "infrastructure.location",
  }),
  Object.freeze({
    id: "non_root_administration",
    ownerRole: "security_operator",
    validationMethod: "access_review",
    evidenceSlot: "infrastructure.administration",
  }),
  Object.freeze({
    id: "ssh_firewall",
    ownerRole: "security_operator",
    validationMethod: "access_review",
    evidenceSlot: "infrastructure.network",
  }),
  Object.freeze({
    id: "dns_https",
    ownerRole: "platform_operator",
    validationMethod: "external_check",
    evidenceSlot: "infrastructure.https",
  }),
  Object.freeze({
    id: "coolify_access",
    ownerRole: "security_operator",
    validationMethod: "access_review",
    evidenceSlot: "infrastructure.coolify_access",
  }),
  Object.freeze({
    id: "environment_isolation",
    ownerRole: "platform_operator",
    validationMethod: "target_console",
    evidenceSlot: "infrastructure.environment",
  }),
  Object.freeze({
    id: "secret_rotation_revocation",
    ownerRole: "security_operator",
    validationMethod: "secret_store_review",
    evidenceSlot: "infrastructure.secrets",
  }),
  Object.freeze({
    id: "data_retention",
    ownerRole: "security_operator",
    validationMethod: "lifecycle_review",
    evidenceSlot: "infrastructure.lifecycle",
  }),
  Object.freeze({
    id: "off_server_backup",
    ownerRole: "recovery_operator",
    validationMethod: "restore_plan_review",
    evidenceSlot: "infrastructure.backup",
  }),
  Object.freeze({
    id: "monitoring_alerts",
    ownerRole: "service_operator",
    validationMethod: "monitoring_review",
    evidenceSlot: "infrastructure.monitoring",
  }),
  Object.freeze({
    id: "pause_recovery",
    ownerRole: "service_operator",
    validationMethod: "runbook_review",
    evidenceSlot: "infrastructure.incident",
  }),
  Object.freeze({
    id: "update_rollback",
    ownerRole: "release_operator",
    validationMethod: "rollback_plan_review",
    evidenceSlot: "infrastructure.rollback",
  }),
] as const);

export const RELEASE_SECURITY_GATE_IDS = Object.freeze([
  "authentication",
  "authorization",
  "tenant_isolation",
  "trusted_proxy_identity",
  "shared_principal_rate_limit",
  "body_size_controls",
  "human_decision_access",
  "data_lifecycle",
  "edge_waf",
  "alert_delivery",
] as const);

export const RELEASE_PREFLIGHT_CHECK_IDS = Object.freeze([
  "request_contract",
  "exposure_safe",
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
] as const);

const OwnerRoleSchema = Type.Union([
  Type.Literal("release_operator"),
  Type.Literal("security_operator"),
  Type.Literal("platform_operator"),
  Type.Literal("recovery_operator"),
  Type.Literal("service_operator"),
]);

const DecisionIdSchema = Type.Union([
  Type.Literal("capacity"),
  Type.Literal("region_data_location"),
  Type.Literal("non_root_administration"),
  Type.Literal("ssh_firewall"),
  Type.Literal("dns_https"),
  Type.Literal("coolify_access"),
  Type.Literal("environment_isolation"),
  Type.Literal("secret_rotation_revocation"),
  Type.Literal("data_retention"),
  Type.Literal("off_server_backup"),
  Type.Literal("monitoring_alerts"),
  Type.Literal("pause_recovery"),
  Type.Literal("update_rollback"),
]);

const ValidationMethodSchema = Type.Union([
  Type.Literal("target_console"),
  Type.Literal("lifecycle_review"),
  Type.Literal("access_review"),
  Type.Literal("external_check"),
  Type.Literal("secret_store_review"),
  Type.Literal("restore_plan_review"),
  Type.Literal("monitoring_review"),
  Type.Literal("runbook_review"),
  Type.Literal("rollback_plan_review"),
]);

const EvidenceSlotSchema = Type.Union([
  Type.Literal("infrastructure.capacity"),
  Type.Literal("infrastructure.location"),
  Type.Literal("infrastructure.administration"),
  Type.Literal("infrastructure.network"),
  Type.Literal("infrastructure.https"),
  Type.Literal("infrastructure.coolify_access"),
  Type.Literal("infrastructure.environment"),
  Type.Literal("infrastructure.secrets"),
  Type.Literal("infrastructure.lifecycle"),
  Type.Literal("infrastructure.backup"),
  Type.Literal("infrastructure.monitoring"),
  Type.Literal("infrastructure.incident"),
  Type.Literal("infrastructure.rollback"),
]);

const SecurityGateIdSchema = Type.Union([
  Type.Literal("authentication"),
  Type.Literal("authorization"),
  Type.Literal("tenant_isolation"),
  Type.Literal("trusted_proxy_identity"),
  Type.Literal("shared_principal_rate_limit"),
  Type.Literal("body_size_controls"),
  Type.Literal("human_decision_access"),
  Type.Literal("data_lifecycle"),
  Type.Literal("edge_waf"),
  Type.Literal("alert_delivery"),
]);

const SecurityGateStatusSchema = Type.Union([
  Type.Literal("confirmed"),
  Type.Literal("route_not_exposed"),
  Type.Literal("application_enforced"),
  Type.Literal("synthetic_only"),
  Type.Literal("runbook_only"),
]);

const RevisionSchema = Type.String({ pattern: "^[0-9a-f]{40}$" });
const ImageDigestSchema = Type.String({ pattern: "^sha256:[0-9a-f]{64}$" });

const ReleaseDecisionSchema = Type.Object(
  {
    id: DecisionIdSchema,
    ownerRole: OwnerRoleSchema,
    validationMethod: ValidationMethodSchema,
    evidenceSlot: EvidenceSlotSchema,
    confirmed: Type.Boolean(),
  },
  { additionalProperties: false },
);

const ReleaseSecurityGateSchema = Type.Object(
  { id: SecurityGateIdSchema, status: SecurityGateStatusSchema },
  { additionalProperties: false },
);

export const ReleasePreflightRequestSchema = Type.Object(
  {
    schemaVersion: Type.Literal(RELEASE_PREFLIGHT_SCHEMA_VERSION),
    source: Type.Object(
      {
        revision: RevisionSchema,
        workingTreeClean: Type.Boolean(),
        repositoryVerification: Type.Union([Type.Literal("passed"), Type.Literal("failed")]),
        evalPassed: Type.Integer({ minimum: 0, maximum: 18 }),
        evalTotal: Type.Literal(18),
        drillPassed: Type.Integer({ minimum: 0, maximum: 5 }),
        drillTotal: Type.Literal(5),
      },
      { additionalProperties: false },
    ),
    image: Type.Object(
      {
        status: Type.Union([Type.Literal("recorded"), Type.Literal("pending")]),
        digest: Type.Union([ImageDigestSchema, Type.Null()]),
      },
      { additionalProperties: false },
    ),
    exposure: Type.Object(
      {
        mode: Type.Union([Type.Literal("controlled"), Type.Literal("public")]),
        healthRoute: Type.Union([
          Type.Literal("external_https"),
          Type.Literal("private"),
          Type.Literal("unverified"),
        ]),
        runsRoute: Type.Union([
          Type.Literal("private"),
          Type.Literal("edge_restricted"),
          Type.Literal("public"),
        ]),
      },
      { additionalProperties: false },
    ),
    runtime: Type.Object(
      {
        port: Type.Integer({ minimum: 1, maximum: 65_535 }),
        replicas: Type.Integer({ minimum: 1, maximum: 100 }),
        dataMount: Type.Union([Type.Literal("/app/data"), Type.Literal("mismatch")]),
        eventLogPath: Type.Union([
          Type.Literal("/app/data/events.jsonl"),
          Type.Literal("mismatch"),
        ]),
        approvalLogPath: Type.Union([
          Type.Literal("/app/data/approvals.jsonl"),
          Type.Literal("mismatch"),
        ]),
        requestBodyLimitBytes: Type.Integer({ minimum: 1, maximum: 1_048_576 }),
        runDeadlineConfigured: Type.Boolean(),
        runStepLimitConfigured: Type.Boolean(),
        processRateLimitConfigured: Type.Boolean(),
      },
      { additionalProperties: false },
    ),
    secrets: Type.Object(
      {
        store: Type.Union([Type.Literal("coolify_secret_store"), Type.Literal("unverified")]),
        valuesIncluded: Type.Boolean(),
        providerCredentialConfigured: Type.Boolean(),
        rotationProcedureConfirmed: Type.Boolean(),
        revocationProcedureConfirmed: Type.Boolean(),
      },
      { additionalProperties: false },
    ),
    decisions: Type.Array(ReleaseDecisionSchema, {
      maxItems: RELEASE_DECISION_DEFINITIONS.length,
    }),
    securityGates: Type.Array(ReleaseSecurityGateSchema, {
      maxItems: RELEASE_SECURITY_GATE_IDS.length,
    }),
    target: Type.Object(
      {
        authorized: Type.Boolean(),
        isolatedEnvironment: Type.Boolean(),
        persistentStorageConfigured: Type.Boolean(),
        externalHealthCheckOwned: Type.Boolean(),
        monitoringConfigured: Type.Boolean(),
        backupDestinationOwned: Type.Boolean(),
        pauseOwnerConfirmed: Type.Boolean(),
        recoveryOwnerConfirmed: Type.Boolean(),
        rollbackImageReserved: Type.Boolean(),
      },
      { additionalProperties: false },
    ),
  },
  { additionalProperties: false },
);

const ReleasePreflightCheckIdSchema = Type.Union([
  Type.Literal("request_contract"),
  Type.Literal("exposure_safe"),
  Type.Literal("target_authorized"),
  Type.Literal("source_verified"),
  Type.Literal("image_recorded"),
  Type.Literal("runtime_bounded"),
  Type.Literal("decisions_confirmed"),
  Type.Literal("secret_boundary"),
  Type.Literal("environment_isolated"),
  Type.Literal("persistence_configured"),
  Type.Literal("health_owned"),
  Type.Literal("monitoring_configured"),
  Type.Literal("backup_owned"),
  Type.Literal("incident_ownership"),
  Type.Literal("rollback_reserved"),
]);

const ReleasePreflightReasonSchema = Type.Union([
  Type.Literal("valid_request"),
  Type.Literal("controlled_exposure_safe"),
  Type.Literal("public_exposure_gates_confirmed"),
  Type.Literal("unsafe_exposure"),
  Type.Literal("target_authorized"),
  Type.Literal("target_unauthorized"),
  Type.Literal("source_verified"),
  Type.Literal("source_unverified"),
  Type.Literal("image_recorded"),
  Type.Literal("image_pending"),
  Type.Literal("runtime_bounded"),
  Type.Literal("runtime_mismatch"),
  Type.Literal("decisions_confirmed"),
  Type.Literal("decisions_incomplete"),
  Type.Literal("secret_boundary_confirmed"),
  Type.Literal("secret_boundary_incomplete"),
  Type.Literal("environment_isolated"),
  Type.Literal("environment_not_isolated"),
  Type.Literal("persistence_confirmed"),
  Type.Literal("persistence_unconfirmed"),
  Type.Literal("health_ownership_confirmed"),
  Type.Literal("health_ownership_unconfirmed"),
  Type.Literal("monitoring_confirmed"),
  Type.Literal("monitoring_unconfirmed"),
  Type.Literal("backup_confirmed"),
  Type.Literal("backup_unconfirmed"),
  Type.Literal("incident_ownership_confirmed"),
  Type.Literal("incident_ownership_incomplete"),
  Type.Literal("rollback_reserved"),
  Type.Literal("rollback_unconfirmed"),
]);

const ReleasePreflightCheckSchema = Type.Object(
  {
    id: ReleasePreflightCheckIdSchema,
    status: Type.Union([Type.Literal("pass"), Type.Literal("blocked")]),
    reason: ReleasePreflightReasonSchema,
  },
  { additionalProperties: false },
);

export const ReleasePreflightResultSchema = Type.Object(
  {
    schemaVersion: Type.Literal(RELEASE_PREFLIGHT_SCHEMA_VERSION),
    status: Type.Union([Type.Literal("ready"), Type.Literal("blocked")]),
    exposureMode: Type.Union([Type.Literal("controlled"), Type.Literal("public")]),
    sourceRevision: RevisionSchema,
    imageDigest: Type.Union([ImageDigestSchema, Type.Null()]),
    checks: Type.Array(ReleasePreflightCheckSchema, {
      minItems: RELEASE_PREFLIGHT_CHECK_IDS.length,
      maxItems: RELEASE_PREFLIGHT_CHECK_IDS.length,
    }),
    blockedCheckIds: Type.Array(ReleasePreflightCheckIdSchema, {
      maxItems: RELEASE_PREFLIGHT_CHECK_IDS.length,
    }),
    targetMutationAllowed: Type.Literal(false),
  },
  { additionalProperties: false },
);

export const ReleasePreflightFailureSchema = Type.Object(
  {
    code: Type.Union([
      Type.Literal("invalid_release_preflight"),
      Type.Literal("release_preflight_failed"),
    ]),
    message: Type.Union([
      Type.Literal("Release preflight input is invalid."),
      Type.Literal("Release preflight evaluation failed."),
    ]),
  },
  { additionalProperties: false },
);

export type ReleasePreflightRequest = Type.Static<typeof ReleasePreflightRequestSchema>;
export type ReleasePreflightResult = Type.Static<typeof ReleasePreflightResultSchema>;
export type ReleasePreflightFailure = Type.Static<typeof ReleasePreflightFailureSchema>;
export type ReleasePreflightOutcome =
  | Readonly<{ ok: true; value: ReleasePreflightResult }>
  | Readonly<{ ok: false; error: ReleasePreflightFailure }>;

type ReleasePreflightCheck = Type.Static<typeof ReleasePreflightCheckSchema>;
type SecurityGateStatus = Type.Static<typeof SecurityGateStatusSchema>;

type DataTreeState = { readonly seen: Set<object>; nodes: number };

function checkOwnDataTree(value: unknown, state: DataTreeState, depth: number): boolean {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return true;
  }
  if (typeof value !== "object" || depth > 12 || state.seen.has(value)) return false;
  state.nodes += 1;
  if (state.nodes > 2_000) return false;
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== Array.prototype) return false;
  const keys = Reflect.ownKeys(value);
  if (keys.length > 200 || keys.some((key) => typeof key === "symbol")) return false;
  state.seen.add(value);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || !("value" in descriptor)) return false;
    if (!checkOwnDataTree(descriptor.value, state, depth + 1)) return false;
  }
  state.seen.delete(value);
  return true;
}

function isOwnDataTree(value: unknown): boolean {
  return checkOwnDataTree(value, { seen: new Set<object>(), nodes: 0 }, 0);
}

function deepFreeze<T>(value: T, seen: Set<object> = new Set<object>()): T {
  if (value === null || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor !== undefined && "value" in descriptor) deepFreeze(descriptor.value, seen);
  }
  return Object.freeze(value);
}

function makeFailure(code: ReleasePreflightFailure["code"]): ReleasePreflightFailure {
  return deepFreeze({
    code,
    message:
      code === "invalid_release_preflight"
        ? "Release preflight input is invalid."
        : "Release preflight evaluation failed.",
  } as ReleasePreflightFailure);
}

function exactDecisionInventory(request: ReleasePreflightRequest): boolean {
  return (
    RELEASE_DECISION_DEFINITIONS.every((expected, index) => {
      const actual = request.decisions[index];
      return (
        actual !== undefined &&
        actual.id === expected.id &&
        actual.ownerRole === expected.ownerRole &&
        actual.validationMethod === expected.validationMethod &&
        actual.evidenceSlot === expected.evidenceSlot &&
        actual.confirmed
      );
    }) && request.decisions.length === RELEASE_DECISION_DEFINITIONS.length
  );
}

function expectedControlledGateStatus(
  id: (typeof RELEASE_SECURITY_GATE_IDS)[number],
  runsRoute: ReleasePreflightRequest["exposure"]["runsRoute"],
): SecurityGateStatus {
  if (id === "body_size_controls") return "application_enforced";
  if (id === "data_lifecycle") return "synthetic_only";
  if (id === "alert_delivery") return "runbook_only";
  if (id === "edge_waf" && runsRoute === "edge_restricted") return "confirmed";
  return "route_not_exposed";
}

function exposureIsSafe(request: ReleasePreflightRequest): boolean {
  const { exposure, securityGates } = request;
  if (securityGates.length !== RELEASE_SECURITY_GATE_IDS.length) return false;
  if (exposure.healthRoute !== "external_https") return false;
  return RELEASE_SECURITY_GATE_IDS.every((id, index) => {
    const actual = securityGates[index];
    if (actual?.id !== id) return false;
    if (exposure.mode === "public") {
      return exposure.runsRoute === "public" && actual.status === "confirmed";
    }
    if (exposure.runsRoute !== "private" && exposure.runsRoute !== "edge_restricted") {
      return false;
    }
    return actual.status === expectedControlledGateStatus(id, exposure.runsRoute);
  });
}

function sourceIsVerified(source: ReleasePreflightRequest["source"]): boolean {
  return (
    source.workingTreeClean &&
    source.repositoryVerification === "passed" &&
    source.evalPassed === source.evalTotal &&
    source.evalTotal === 18 &&
    source.drillPassed === source.drillTotal &&
    source.drillTotal === 5
  );
}

function imageIsRecorded(image: ReleasePreflightRequest["image"]): boolean {
  return image.status === "recorded" && image.digest !== null;
}

function runtimeIsBounded(runtime: ReleasePreflightRequest["runtime"]): boolean {
  return (
    runtime.port === 3000 &&
    runtime.replicas === 1 &&
    runtime.dataMount === "/app/data" &&
    runtime.eventLogPath === "/app/data/events.jsonl" &&
    runtime.approvalLogPath === "/app/data/approvals.jsonl" &&
    runtime.requestBodyLimitBytes === 16_384 &&
    runtime.runDeadlineConfigured &&
    runtime.runStepLimitConfigured &&
    runtime.processRateLimitConfigured
  );
}

function secretBoundaryIsComplete(request: ReleasePreflightRequest): boolean {
  return (
    request.secrets.store === "coolify_secret_store" &&
    !request.secrets.valuesIncluded &&
    request.secrets.providerCredentialConfigured &&
    request.secrets.rotationProcedureConfirmed &&
    request.secrets.revocationProcedureConfirmed
  );
}

function check(
  id: ReleasePreflightCheck["id"],
  passed: boolean,
  passReason: ReleasePreflightCheck["reason"],
  blockedReason: ReleasePreflightCheck["reason"],
): ReleasePreflightCheck {
  return { id, status: passed ? "pass" : "blocked", reason: passed ? passReason : blockedReason };
}

function buildChecks(request: ReleasePreflightRequest): ReleasePreflightCheck[] {
  const exposureSafe = exposureIsSafe(request);
  return [
    check("request_contract", true, "valid_request", "valid_request"),
    check(
      "exposure_safe",
      exposureSafe,
      request.exposure.mode === "public"
        ? "public_exposure_gates_confirmed"
        : "controlled_exposure_safe",
      "unsafe_exposure",
    ),
    check(
      "target_authorized",
      request.target.authorized,
      "target_authorized",
      "target_unauthorized",
    ),
    check(
      "source_verified",
      sourceIsVerified(request.source),
      "source_verified",
      "source_unverified",
    ),
    check("image_recorded", imageIsRecorded(request.image), "image_recorded", "image_pending"),
    check(
      "runtime_bounded",
      runtimeIsBounded(request.runtime),
      "runtime_bounded",
      "runtime_mismatch",
    ),
    check(
      "decisions_confirmed",
      exactDecisionInventory(request),
      "decisions_confirmed",
      "decisions_incomplete",
    ),
    check(
      "secret_boundary",
      secretBoundaryIsComplete(request),
      "secret_boundary_confirmed",
      "secret_boundary_incomplete",
    ),
    check(
      "environment_isolated",
      request.target.isolatedEnvironment,
      "environment_isolated",
      "environment_not_isolated",
    ),
    check(
      "persistence_configured",
      request.target.persistentStorageConfigured,
      "persistence_confirmed",
      "persistence_unconfirmed",
    ),
    check(
      "health_owned",
      request.target.externalHealthCheckOwned,
      "health_ownership_confirmed",
      "health_ownership_unconfirmed",
    ),
    check(
      "monitoring_configured",
      request.target.monitoringConfigured,
      "monitoring_confirmed",
      "monitoring_unconfirmed",
    ),
    check(
      "backup_owned",
      request.target.backupDestinationOwned,
      "backup_confirmed",
      "backup_unconfirmed",
    ),
    check(
      "incident_ownership",
      request.target.pauseOwnerConfirmed && request.target.recoveryOwnerConfirmed,
      "incident_ownership_confirmed",
      "incident_ownership_incomplete",
    ),
    check(
      "rollback_reserved",
      request.target.rollbackImageReserved,
      "rollback_reserved",
      "rollback_unconfirmed",
    ),
  ];
}

export function isReleasePreflightRequest(value: unknown): value is ReleasePreflightRequest {
  if (!isOwnDataTree(value)) return false;
  try {
    return Schema.Check(ReleasePreflightRequestSchema, value);
  } catch {
    return false;
  }
}

const CHECK_REASONS = Object.freeze({
  request_contract: Object.freeze({ pass: "valid_request", blocked: null }),
  target_authorized: Object.freeze({ pass: "target_authorized", blocked: "target_unauthorized" }),
  source_verified: Object.freeze({ pass: "source_verified", blocked: "source_unverified" }),
  image_recorded: Object.freeze({ pass: "image_recorded", blocked: "image_pending" }),
  runtime_bounded: Object.freeze({ pass: "runtime_bounded", blocked: "runtime_mismatch" }),
  decisions_confirmed: Object.freeze({
    pass: "decisions_confirmed",
    blocked: "decisions_incomplete",
  }),
  secret_boundary: Object.freeze({
    pass: "secret_boundary_confirmed",
    blocked: "secret_boundary_incomplete",
  }),
  environment_isolated: Object.freeze({
    pass: "environment_isolated",
    blocked: "environment_not_isolated",
  }),
  persistence_configured: Object.freeze({
    pass: "persistence_confirmed",
    blocked: "persistence_unconfirmed",
  }),
  health_owned: Object.freeze({
    pass: "health_ownership_confirmed",
    blocked: "health_ownership_unconfirmed",
  }),
  monitoring_configured: Object.freeze({
    pass: "monitoring_confirmed",
    blocked: "monitoring_unconfirmed",
  }),
  backup_owned: Object.freeze({ pass: "backup_confirmed", blocked: "backup_unconfirmed" }),
  incident_ownership: Object.freeze({
    pass: "incident_ownership_confirmed",
    blocked: "incident_ownership_incomplete",
  }),
  rollback_reserved: Object.freeze({ pass: "rollback_reserved", blocked: "rollback_unconfirmed" }),
} as const);

function checkReasonIsValid(
  item: ReleasePreflightCheck,
  exposureMode: ReleasePreflightResult["exposureMode"],
): boolean {
  if (item.id === "exposure_safe") {
    return (
      item.reason ===
      (item.status === "blocked"
        ? "unsafe_exposure"
        : exposureMode === "public"
          ? "public_exposure_gates_confirmed"
          : "controlled_exposure_safe")
    );
  }
  const expected = CHECK_REASONS[item.id];
  return expected !== undefined && item.reason === expected[item.status];
}

export function isReleasePreflightResult(value: unknown): value is ReleasePreflightResult {
  if (!isOwnDataTree(value)) return false;
  try {
    if (!Schema.Check(ReleasePreflightResultSchema, value)) return false;
    const result = value as ReleasePreflightResult;
    if (result.targetMutationAllowed !== false) return false;
    if (
      result.checks.length !== RELEASE_PREFLIGHT_CHECK_IDS.length ||
      result.checks.some(
        (item, index) =>
          item.id !== RELEASE_PREFLIGHT_CHECK_IDS[index] ||
          !checkReasonIsValid(item, result.exposureMode),
      )
    ) {
      return false;
    }
    const imageCheck = result.checks.find((item) => item.id === "image_recorded");
    if (
      imageCheck === undefined ||
      (imageCheck.status === "pass") !== (result.imageDigest !== null)
    ) {
      return false;
    }
    const blocked = result.checks
      .filter((item) => item.status === "blocked")
      .map((item) => item.id);
    return (
      blocked.length === result.blockedCheckIds.length &&
      blocked.every((id, index) => id === result.blockedCheckIds[index]) &&
      (result.status === "ready" ? blocked.length === 0 : blocked.length > 0)
    );
  } catch {
    return false;
  }
}

export function isReleasePreflightFailure(value: unknown): value is ReleasePreflightFailure {
  if (!isOwnDataTree(value)) return false;
  try {
    if (!Schema.Check(ReleasePreflightFailureSchema, value)) return false;
    const failure = value as ReleasePreflightFailure;
    return (
      failure.message ===
      (failure.code === "invalid_release_preflight"
        ? "Release preflight input is invalid."
        : "Release preflight evaluation failed.")
    );
  } catch {
    return false;
  }
}

export function evaluateReleasePreflight(value: unknown): ReleasePreflightOutcome {
  if (!isReleasePreflightRequest(value)) {
    return deepFreeze({ ok: false, error: makeFailure("invalid_release_preflight") });
  }
  let request: ReleasePreflightRequest;
  try {
    request = structuredClone(value);
  } catch {
    return deepFreeze({ ok: false, error: makeFailure("invalid_release_preflight") });
  }
  const checks = buildChecks(request);
  const blockedCheckIds = checks.filter((item) => item.status === "blocked").map((item) => item.id);
  const result: ReleasePreflightResult = {
    schemaVersion: RELEASE_PREFLIGHT_SCHEMA_VERSION,
    status: blockedCheckIds.length === 0 ? "ready" : "blocked",
    exposureMode: request.exposure.mode,
    sourceRevision: request.source.revision,
    imageDigest: request.image.status === "recorded" ? request.image.digest : null,
    checks,
    blockedCheckIds,
    targetMutationAllowed: false,
  };
  if (!isReleasePreflightResult(result)) {
    return deepFreeze({ ok: false, error: makeFailure("release_preflight_failed") });
  }
  return deepFreeze({ ok: true, value: result });
}
