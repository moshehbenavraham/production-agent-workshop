import { performance } from "node:perf_hooks";
import { Type } from "typebox";
import Schema from "typebox/schema";
import { APPLICATION_VERSION } from "./event-store.js";
import { RunEventRunIdSchema } from "./run-event.js";

export const OBSERVATION_SCHEMA_VERSION = 1 as const;

const IsoTimestampSchema = Type.String({
  minLength: 24,
  maxLength: 24,
  pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{3}Z$",
});

const VersionSchema = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: "^[a-zA-Z0-9][a-zA-Z0-9._-]*$",
});

const EnvironmentSchema = Type.Union([
  Type.Literal("development"),
  Type.Literal("test"),
  Type.Literal("staging"),
  Type.Literal("production"),
]);

const MeasurementUnitSchema = Type.Union([
  Type.Literal("milliseconds"),
  Type.Literal("microseconds"),
  Type.Literal("bytes"),
  Type.Literal("count"),
  Type.Literal("usd"),
]);

const UnavailableReasonSchema = Type.Union([
  Type.Literal("not_reported"),
  Type.Literal("collection_failed"),
  Type.Literal("invalid_measurement"),
  Type.Literal("unsupported"),
  Type.Literal("dependency_unavailable"),
]);

const NotApplicableReasonSchema = Type.Union([
  Type.Literal("not_configured"),
  Type.Literal("not_supported"),
]);

export const AvailableMeasurementSchema = Type.Object(
  {
    status: Type.Literal("available"),
    value: Type.Number({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
    unit: MeasurementUnitSchema,
  },
  { additionalProperties: false },
);

export const UnavailableMeasurementSchema = Type.Object(
  {
    status: Type.Literal("unavailable"),
    reason: UnavailableReasonSchema,
  },
  { additionalProperties: false },
);

export const NotApplicableMeasurementSchema = Type.Object(
  {
    status: Type.Literal("not_applicable"),
    reason: NotApplicableReasonSchema,
  },
  { additionalProperties: false },
);

export const MeasurementSchema = Type.Union([
  AvailableMeasurementSchema,
  UnavailableMeasurementSchema,
  NotApplicableMeasurementSchema,
]);

const AvailableTokenUsageSchema = Type.Object(
  {
    status: Type.Literal("available"),
    input: Type.Integer({ minimum: 0, maximum: 1_000_000_000 }),
    output: Type.Integer({ minimum: 0, maximum: 1_000_000_000 }),
    total: Type.Integer({ minimum: 0, maximum: 2_000_000_000 }),
  },
  { additionalProperties: false },
);

export const TokenUsageSchema = Type.Union([
  AvailableTokenUsageSchema,
  UnavailableMeasurementSchema,
  NotApplicableMeasurementSchema,
]);

const ErrorCategorySchema = Type.Union([
  Type.Literal("timeout"),
  Type.Literal("invalid_input"),
  Type.Literal("invalid_response"),
  Type.Literal("permission_denied"),
  Type.Literal("dependency_failed"),
  Type.Literal("storage_failure"),
  Type.Literal("rate_limited"),
  Type.Literal("configuration_error"),
  Type.Literal("unknown"),
]);

const NullableErrorCategorySchema = Type.Union([ErrorCategorySchema, Type.Null()]);

const DependencyIdSchema = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: "^[a-z][a-z0-9_.-]*$",
});

const ToolNameSchema = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: "^[a-z][a-z0-9_]*$",
});

const CallIdSchema = Type.String({
  minLength: 1,
  maxLength: 120,
  pattern: "^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$",
});

const commonProperties = {
  schemaVersion: Type.Literal(OBSERVATION_SCHEMA_VERSION),
  at: IsoTimestampSchema,
  environment: EnvironmentSchema,
  applicationVersion: VersionSchema,
};

export const DependencyObservationSchema = Type.Object(
  {
    id: DependencyIdSchema,
    state: Type.Union([
      Type.Literal("healthy"),
      Type.Literal("degraded"),
      Type.Literal("unavailable"),
    ]),
    duration: MeasurementSchema,
    errorCategory: NullableErrorCategorySchema,
  },
  { additionalProperties: false },
);

export const ServiceObservationSchema = Type.Object(
  {
    ...commonProperties,
    layer: Type.Literal("service"),
    kind: Type.Literal("service.snapshot"),
    uptime: MeasurementSchema,
    memoryRss: MeasurementSchema,
    memoryHeapUsed: MeasurementSchema,
    cpuUser: MeasurementSchema,
    cpuSystem: MeasurementSchema,
    storageUsed: MeasurementSchema,
    storageCapacity: MeasurementSchema,
    queueDepth: MeasurementSchema,
    dependencies: Type.Array(DependencyObservationSchema, { maxItems: 20 }),
  },
  { additionalProperties: false },
);

const RunStopReasonSchema = Type.Union([
  Type.Literal("approval_pending"),
  Type.Literal("approval_failed"),
  Type.Literal("not_found"),
  Type.Literal("qualification_failed"),
  Type.Literal("completed"),
  Type.Literal("deadline_exceeded"),
  Type.Literal("step_limit_exceeded"),
  Type.Literal("dependency_failed"),
  Type.Literal("agent_run_failed"),
  Type.Null(),
]);

export const RunObservationSchema = Type.Object(
  {
    ...commonProperties,
    layer: Type.Literal("run"),
    kind: Type.Literal("run.lifecycle"),
    runId: RunEventRunIdSchema,
    outcome: Type.Union([
      Type.Literal("running"),
      Type.Literal("pending"),
      Type.Literal("completed"),
      Type.Literal("failed"),
      Type.Literal("stopped"),
    ]),
    stopReason: RunStopReasonSchema,
    duration: MeasurementSchema,
    stepCount: MeasurementSchema,
    retryCount: Type.Integer({ minimum: 0, maximum: 100 }),
    errorCategory: NullableErrorCategorySchema,
  },
  { additionalProperties: false },
);

export const ModelObservationSchema = Type.Object(
  {
    ...commonProperties,
    layer: Type.Literal("model"),
    kind: Type.Literal("model.call"),
    runId: RunEventRunIdSchema,
    stepNumber: Type.Integer({ minimum: 1, maximum: 1_000_000 }),
    modelVersion: Type.Union([VersionSchema, Type.Null()]),
    promptVersion: Type.Union([VersionSchema, Type.Null()]),
    outcome: Type.Union([
      Type.Literal("attempted"),
      Type.Literal("succeeded"),
      Type.Literal("failed"),
      Type.Literal("stopped"),
    ]),
    duration: MeasurementSchema,
    retryCount: Type.Integer({ minimum: 0, maximum: 100 }),
    tokens: TokenUsageSchema,
    cost: MeasurementSchema,
    errorCategory: NullableErrorCategorySchema,
  },
  { additionalProperties: false },
);

export const ToolObservationSchema = Type.Object(
  {
    ...commonProperties,
    layer: Type.Literal("tool"),
    kind: Type.Literal("tool.call"),
    runId: RunEventRunIdSchema,
    stepNumber: Type.Integer({ minimum: 1, maximum: 1_000_000 }),
    toolName: ToolNameSchema,
    callId: Type.Union([CallIdSchema, Type.Null()]),
    outcome: Type.Union([
      Type.Literal("attempted"),
      Type.Literal("succeeded"),
      Type.Literal("failed"),
      Type.Literal("denied"),
      Type.Literal("pending"),
      Type.Literal("duplicate"),
      Type.Literal("stopped"),
    ]),
    permissionDecision: Type.Union([
      Type.Literal("automatic"),
      Type.Literal("approval_required"),
      Type.Literal("forbidden"),
      Type.Literal("denied"),
    ]),
    sideEffect: Type.Union([
      Type.Literal("none"),
      Type.Literal("reserved"),
      Type.Literal("attempted"),
      Type.Literal("succeeded"),
      Type.Literal("rejected"),
      Type.Literal("indeterminate"),
    ]),
    duration: MeasurementSchema,
    retryCount: Type.Integer({ minimum: 0, maximum: 100 }),
    errorCategory: NullableErrorCategorySchema,
  },
  { additionalProperties: false },
);

export const ObservationSchema = Type.Union([
  ServiceObservationSchema,
  RunObservationSchema,
  ModelObservationSchema,
  ToolObservationSchema,
]);

export type Measurement = Type.Static<typeof MeasurementSchema>;
export type MeasurementUnit = Type.Static<typeof MeasurementUnitSchema>;
export type UnavailableReason = Type.Static<typeof UnavailableReasonSchema>;
export type NotApplicableReason = Type.Static<typeof NotApplicableReasonSchema>;
export type TokenUsage = Type.Static<typeof TokenUsageSchema>;
export type DependencyObservation = Type.Static<typeof DependencyObservationSchema>;
export type ServiceObservation = Type.Static<typeof ServiceObservationSchema>;
export type RunObservation = Type.Static<typeof RunObservationSchema>;
export type ModelObservation = Type.Static<typeof ModelObservationSchema>;
export type ToolObservation = Type.Static<typeof ToolObservationSchema>;
export type Observation = Type.Static<typeof ObservationSchema>;

export type ObservationFailure = Readonly<{
  code: "invalid_observation";
  message: "Observation is invalid.";
}>;

export type ObservationCreationOutcome =
  | Readonly<{ ok: true; value: Observation }>
  | Readonly<{ ok: false; error: ObservationFailure }>;

export type ProcessMetricBoundary = Readonly<{
  uptimeMs(): unknown;
  memoryBytes(): unknown;
  cpuMicroseconds(): unknown;
}>;

export type StorageMetricBoundary = Readonly<{
  id: string;
  read(): unknown;
}>;

export type QueueMetricBoundary = Readonly<{
  id: string;
  read(): unknown;
}>;

export type DependencyMetricBoundary = Readonly<{
  id: string;
  timeoutMs: number;
  check(signal: AbortSignal): unknown | Promise<unknown>;
}>;

export type ServiceCollectorOptions = Readonly<{
  environment: Type.Static<typeof EnvironmentSchema>;
  applicationVersion?: string;
  now?: () => unknown;
  processMetrics?: ProcessMetricBoundary;
  storage?: StorageMetricBoundary;
  queue?: QueueMetricBoundary;
  dependencies?: readonly DependencyMetricBoundary[];
}>;

export type ServiceCollectionFailure = Readonly<{
  code: "invalid_configuration" | "collection_failed";
  message: "Service collector configuration is invalid." | "Service observation collection failed.";
}>;

export type ServiceCollectionOutcome =
  | Readonly<{ ok: true; value: ServiceObservation }>
  | Readonly<{ ok: false; error: ServiceCollectionFailure }>;

const measurementValidator = Schema.Compile(MeasurementSchema);
const tokenUsageValidator = Schema.Compile(TokenUsageSchema);
const observationValidator = Schema.Compile(ObservationSchema);

const environmentValidator = Schema.Compile(EnvironmentSchema);
const versionValidator = Schema.Compile(VersionSchema);
const dependencyIdValidator = Schema.Compile(DependencyIdSchema);
const dependencyCheckResultValidator = Schema.Compile(
  Type.Object(
    {
      state: Type.Union([
        Type.Literal("healthy"),
        Type.Literal("degraded"),
        Type.Literal("unavailable"),
      ]),
      errorCategory: NullableErrorCategorySchema,
    },
    { additionalProperties: false },
  ),
);

function hasOnlyDataProperties(value: object, allowed: readonly string[]): boolean {
  const keys = Reflect.ownKeys(value);
  return keys.every((key) => {
    if (typeof key !== "string" || !allowed.includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return descriptor !== undefined && "value" in descriptor;
  });
}

function hasOwnDataProperty(value: object, key: string): boolean {
  const descriptor = Object.getOwnPropertyDescriptor(value, key);
  return descriptor !== undefined && "value" in descriptor;
}

function hasExactDataProperties(value: object, required: readonly string[]): boolean {
  return (
    Reflect.ownKeys(value).length === required.length && hasOnlyDataProperties(value, required)
  );
}

function isFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === "function";
}

function isProcessMetricBoundary(value: unknown): value is ProcessMetricBoundary {
  try {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
      hasExactDataProperties(candidate, ["uptimeMs", "memoryBytes", "cpuMicroseconds"]) &&
      isFunction(candidate.uptimeMs) &&
      isFunction(candidate.memoryBytes) &&
      isFunction(candidate.cpuMicroseconds)
    );
  } catch {
    return false;
  }
}

function isNamedReadBoundary(value: unknown): value is StorageMetricBoundary | QueueMetricBoundary {
  try {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
      hasExactDataProperties(candidate, ["id", "read"]) &&
      dependencyIdValidator.Check(candidate.id) &&
      isFunction(candidate.read)
    );
  } catch {
    return false;
  }
}

function isDependencyMetricBoundary(value: unknown): value is DependencyMetricBoundary {
  try {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    return (
      hasExactDataProperties(candidate, ["id", "timeoutMs", "check"]) &&
      dependencyIdValidator.Check(candidate.id) &&
      Number.isInteger(candidate.timeoutMs) &&
      typeof candidate.timeoutMs === "number" &&
      candidate.timeoutMs >= 1 &&
      candidate.timeoutMs <= 30_000 &&
      isFunction(candidate.check)
    );
  } catch {
    return false;
  }
}

export function isServiceCollectorOptions(value: unknown): value is ServiceCollectorOptions {
  try {
    if (typeof value !== "object" || value === null) return false;
    const candidate = value as Record<string, unknown>;
    if (
      !hasOwnDataProperty(candidate, "environment") ||
      !hasOnlyDataProperties(candidate, [
        "environment",
        "applicationVersion",
        "now",
        "processMetrics",
        "storage",
        "queue",
        "dependencies",
      ]) ||
      !environmentValidator.Check(candidate.environment) ||
      (candidate.applicationVersion !== undefined &&
        !versionValidator.Check(candidate.applicationVersion)) ||
      (candidate.now !== undefined && !isFunction(candidate.now)) ||
      (candidate.processMetrics !== undefined &&
        !isProcessMetricBoundary(candidate.processMetrics)) ||
      (candidate.storage !== undefined && !isNamedReadBoundary(candidate.storage)) ||
      (candidate.queue !== undefined && !isNamedReadBoundary(candidate.queue)) ||
      (candidate.dependencies !== undefined && !Array.isArray(candidate.dependencies))
    ) {
      return false;
    }
    const dependencies: unknown[] = Array.isArray(candidate.dependencies)
      ? candidate.dependencies
      : [];
    if (dependencies.length > 20 || !dependencies.every(isDependencyMetricBoundary)) return false;
    const identifiers = [
      ...(isNamedReadBoundary(candidate.storage) ? [candidate.storage.id] : []),
      ...(isNamedReadBoundary(candidate.queue) ? [candidate.queue.id] : []),
      ...dependencies.map((dependency) => dependency.id),
    ];
    return new Set(identifiers).size === identifiers.length;
  } catch {
    return false;
  }
}

export const DEFAULT_PROCESS_METRICS: ProcessMetricBoundary = Object.freeze({
  uptimeMs: () => Math.floor(process.uptime() * 1_000),
  memoryBytes: () => {
    const memory = process.memoryUsage();
    return { rss: memory.rss, heapUsed: memory.heapUsed };
  },
  cpuMicroseconds: () => process.cpuUsage(),
});

type ProcessMeasurements = Readonly<{
  uptime: Measurement;
  memoryRss: Measurement;
  memoryHeapUsed: Measurement;
  cpuUser: Measurement;
  cpuSystem: Measurement;
}>;

function unavailablePair(reason: UnavailableReason): readonly [Measurement, Measurement] {
  return Object.freeze([makeUnavailableMeasurement(reason), makeUnavailableMeasurement(reason)]);
}

function integerMeasurement(value: unknown, unit: MeasurementUnit): Measurement {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? makeAvailableMeasurement(value, unit)
    : makeUnavailableMeasurement("invalid_measurement");
}

function readPair(
  read: () => unknown,
  firstKey: string,
  secondKey: string,
  unit: MeasurementUnit,
): readonly [Measurement, Measurement] {
  let value: unknown;
  try {
    value = read();
  } catch {
    return unavailablePair("collection_failed");
  }
  if (
    typeof value !== "object" ||
    value === null ||
    !hasExactDataProperties(value, [firstKey, secondKey])
  ) {
    return unavailablePair("invalid_measurement");
  }
  const candidate = value as Record<string, unknown>;
  return Object.freeze([
    integerMeasurement(candidate[firstKey], unit),
    integerMeasurement(candidate[secondKey], unit),
  ]);
}

function collectProcessMeasurements(boundary: ProcessMetricBoundary): ProcessMeasurements {
  let uptime: Measurement;
  try {
    uptime = integerMeasurement(boundary.uptimeMs(), "milliseconds");
  } catch {
    uptime = makeUnavailableMeasurement("collection_failed");
  }
  const [memoryRss, memoryHeapUsed] = readPair(boundary.memoryBytes, "rss", "heapUsed", "bytes");
  const [cpuUser, cpuSystem] = readPair(boundary.cpuMicroseconds, "user", "system", "microseconds");
  return Object.freeze({ uptime, memoryRss, memoryHeapUsed, cpuUser, cpuSystem });
}

type StorageMeasurements = Readonly<{
  storageUsed: Measurement;
  storageCapacity: Measurement;
}>;

function collectStorageMeasurements(
  boundary: StorageMetricBoundary | undefined,
): StorageMeasurements {
  if (boundary === undefined) {
    return Object.freeze({
      storageUsed: makeNotApplicableMeasurement("not_configured"),
      storageCapacity: makeNotApplicableMeasurement("not_configured"),
    });
  }
  let value: unknown;
  try {
    value = boundary.read();
  } catch {
    const [storageUsed, storageCapacity] = unavailablePair("collection_failed");
    return Object.freeze({ storageUsed, storageCapacity });
  }
  if (
    typeof value !== "object" ||
    value === null ||
    !hasExactDataProperties(value, ["usedBytes", "capacityBytes"])
  ) {
    const [storageUsed, storageCapacity] = unavailablePair("invalid_measurement");
    return Object.freeze({ storageUsed, storageCapacity });
  }
  const candidate = value as Record<string, unknown>;
  const storageUsed = integerMeasurement(candidate.usedBytes, "bytes");
  const storageCapacity = integerMeasurement(candidate.capacityBytes, "bytes");
  if (
    storageUsed.status !== "available" ||
    storageCapacity.status !== "available" ||
    storageUsed.value > storageCapacity.value
  ) {
    const [invalidUsed, invalidCapacity] = unavailablePair("invalid_measurement");
    return Object.freeze({ storageUsed: invalidUsed, storageCapacity: invalidCapacity });
  }
  return Object.freeze({ storageUsed, storageCapacity });
}

function collectQueueMeasurement(boundary: QueueMetricBoundary | undefined): Measurement {
  if (boundary === undefined) return makeNotApplicableMeasurement("not_configured");
  let value: unknown;
  try {
    value = boundary.read();
  } catch {
    return makeUnavailableMeasurement("collection_failed");
  }
  if (typeof value !== "object" || value === null || !hasExactDataProperties(value, ["depth"])) {
    return makeUnavailableMeasurement("invalid_measurement");
  }
  return integerMeasurement((value as Record<string, unknown>).depth, "count");
}

const DEPENDENCY_TIMEOUT = Symbol("dependency_timeout");

function dependencyFailure(
  id: string,
  durationMs: number,
  errorCategory: DependencyObservation["errorCategory"],
): DependencyObservation {
  return Object.freeze({
    id,
    state: "unavailable" as const,
    duration: makeAvailableMeasurement(durationMs, "milliseconds"),
    errorCategory,
  });
}

async function collectDependency(
  boundary: DependencyMetricBoundary,
): Promise<DependencyObservation> {
  const controller = new AbortController();
  const startedAt = performance.now();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<typeof DEPENDENCY_TIMEOUT>((resolve) => {
    timer = setTimeout(() => {
      controller.abort();
      resolve(DEPENDENCY_TIMEOUT);
    }, boundary.timeoutMs);
  });
  let value: unknown;
  try {
    value = await Promise.race([
      Promise.resolve().then(() => boundary.check(controller.signal)),
      timeout,
    ]);
  } catch {
    const durationMs = Math.max(0, Math.floor(performance.now() - startedAt));
    return dependencyFailure(boundary.id, durationMs, "dependency_failed");
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
  const durationMs = Math.max(0, Math.floor(performance.now() - startedAt));
  if (value === DEPENDENCY_TIMEOUT) {
    return dependencyFailure(boundary.id, durationMs, "timeout");
  }
  try {
    if (
      typeof value !== "object" ||
      value === null ||
      !hasExactDataProperties(value, ["state", "errorCategory"]) ||
      !dependencyCheckResultValidator.Check(value)
    ) {
      return dependencyFailure(boundary.id, durationMs, "invalid_response");
    }
    if (
      (value.state === "healthy" && value.errorCategory !== null) ||
      (value.state !== "healthy" && value.errorCategory === null)
    ) {
      return dependencyFailure(boundary.id, durationMs, "invalid_response");
    }
    return Object.freeze({
      id: boundary.id,
      state: value.state,
      duration: makeAvailableMeasurement(durationMs, "milliseconds"),
      errorCategory: value.errorCategory,
    });
  } catch {
    return dependencyFailure(boundary.id, durationMs, "invalid_response");
  }
}

async function collectDependencies(
  boundaries: readonly DependencyMetricBoundary[],
): Promise<readonly DependencyObservation[]> {
  const ordered = [...boundaries].sort((left, right) =>
    left.id < right.id ? -1 : left.id > right.id ? 1 : 0,
  );
  return Object.freeze(await Promise.all(ordered.map(collectDependency)));
}

function copyProcessBoundary(boundary: ProcessMetricBoundary): ProcessMetricBoundary {
  return Object.freeze({
    uptimeMs: boundary.uptimeMs,
    memoryBytes: boundary.memoryBytes,
    cpuMicroseconds: boundary.cpuMicroseconds,
  });
}

function copyReadBoundary<T extends StorageMetricBoundary | QueueMetricBoundary>(boundary: T): T {
  return Object.freeze({ id: boundary.id, read: boundary.read }) as T;
}

function normalizeCollectorOptions(input: unknown): ServiceCollectorOptions | null {
  if (!isServiceCollectorOptions(input)) return null;
  try {
    const normalized: ServiceCollectorOptions = Object.freeze({
      environment: input.environment,
      ...(input.applicationVersion === undefined
        ? {}
        : { applicationVersion: input.applicationVersion }),
      ...(input.now === undefined ? {} : { now: input.now }),
      ...(input.processMetrics === undefined
        ? {}
        : { processMetrics: copyProcessBoundary(input.processMetrics) }),
      ...(input.storage === undefined ? {} : { storage: copyReadBoundary(input.storage) }),
      ...(input.queue === undefined ? {} : { queue: copyReadBoundary(input.queue) }),
      dependencies: Object.freeze(
        (input.dependencies ?? []).map((dependency) =>
          Object.freeze({
            id: dependency.id,
            timeoutMs: dependency.timeoutMs,
            check: dependency.check,
          }),
        ),
      ),
    });
    return isServiceCollectorOptions(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

function collectionFailure(
  code: ServiceCollectionFailure["code"],
): Readonly<{ ok: false; error: ServiceCollectionFailure }> {
  const message =
    code === "invalid_configuration"
      ? "Service collector configuration is invalid."
      : "Service observation collection failed.";
  return Object.freeze({ ok: false as const, error: Object.freeze({ code, message }) });
}

export async function collectServiceObservation(input: unknown): Promise<ServiceCollectionOutcome> {
  const options = normalizeCollectorOptions(input);
  if (options === null) return collectionFailure("invalid_configuration");

  let at: unknown;
  try {
    at = (options.now ?? (() => new Date().toISOString()))();
  } catch {
    return collectionFailure("collection_failed");
  }
  if (typeof at !== "string" || !isCanonicalIsoTimestamp(at)) {
    return collectionFailure("collection_failed");
  }

  const processMeasurements = collectProcessMeasurements(
    options.processMetrics ?? DEFAULT_PROCESS_METRICS,
  );
  const storageMeasurements = collectStorageMeasurements(options.storage);
  const queueDepth = collectQueueMeasurement(options.queue);
  const dependencies = await collectDependencies(options.dependencies ?? []);
  const observation = createObservation({
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    at,
    environment: options.environment,
    applicationVersion: options.applicationVersion ?? APPLICATION_VERSION,
    layer: "service",
    kind: "service.snapshot",
    ...processMeasurements,
    ...storageMeasurements,
    queueDepth,
    dependencies,
  });
  return observation.ok
    ? Object.freeze({ ok: true as const, value: observation.value as ServiceObservation })
    : collectionFailure("collection_failed");
}

export function isMeasurement(value: unknown): value is Measurement {
  try {
    if (!measurementValidator.Check(value)) return false;
    return (
      value.status !== "available" || value.unit === "usd" || Number.isSafeInteger(value.value)
    );
  } catch {
    return false;
  }
}

export function isTokenUsage(value: unknown): value is TokenUsage {
  try {
    return (
      tokenUsageValidator.Check(value) &&
      (value.status !== "available" || value.input + value.output === value.total)
    );
  } catch {
    return false;
  }
}

function isCanonicalIsoTimestamp(value: string): boolean {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function hasUnit(measurement: Measurement, unit: MeasurementUnit): boolean {
  return measurement.status !== "available" || measurement.unit === unit;
}

function hasValidDependencies(value: ServiceObservation): boolean {
  const identifiers = new Set<string>();
  for (const dependency of value.dependencies) {
    if (identifiers.has(dependency.id) || !hasUnit(dependency.duration, "milliseconds")) {
      return false;
    }
    identifiers.add(dependency.id);
    if (dependency.state === "healthy" && dependency.errorCategory !== null) return false;
    if (dependency.state === "unavailable" && dependency.errorCategory === null) return false;
  }
  return true;
}

function hasValidServiceSemantics(value: ServiceObservation): boolean {
  const unitsAreValid =
    hasUnit(value.uptime, "milliseconds") &&
    hasUnit(value.memoryRss, "bytes") &&
    hasUnit(value.memoryHeapUsed, "bytes") &&
    hasUnit(value.cpuUser, "microseconds") &&
    hasUnit(value.cpuSystem, "microseconds") &&
    hasUnit(value.storageUsed, "bytes") &&
    hasUnit(value.storageCapacity, "bytes") &&
    hasUnit(value.queueDepth, "count");
  if (!unitsAreValid || !hasValidDependencies(value)) return false;
  return !(
    value.storageUsed.status === "available" &&
    value.storageCapacity.status === "available" &&
    value.storageUsed.value > value.storageCapacity.value
  );
}

function hasValidRunSemantics(value: RunObservation): boolean {
  if (!hasUnit(value.duration, "milliseconds") || !hasUnit(value.stepCount, "count")) {
    return false;
  }
  switch (value.outcome) {
    case "running":
      return value.stopReason === null && value.errorCategory === null;
    case "pending":
      return value.stopReason === "approval_pending" && value.errorCategory === null;
    case "completed":
      return value.stopReason === "completed" && value.errorCategory === null;
    case "failed":
      return value.stopReason === "agent_run_failed" && value.errorCategory !== null;
    case "stopped":
      return (
        value.stopReason !== null &&
        value.stopReason !== "approval_pending" &&
        value.stopReason !== "completed" &&
        value.stopReason !== "agent_run_failed" &&
        value.errorCategory !== null
      );
  }
}

function hasValidModelSemantics(value: ModelObservation): boolean {
  if (
    !hasUnit(value.duration, "milliseconds") ||
    !hasUnit(value.cost, "usd") ||
    !isTokenUsage(value.tokens)
  ) {
    return false;
  }
  return value.outcome === "failed" || value.outcome === "stopped"
    ? value.errorCategory !== null
    : value.errorCategory === null;
}

function hasValidToolSemantics(value: ToolObservation): boolean {
  if (!hasUnit(value.duration, "milliseconds")) return false;
  if (value.permissionDecision === "forbidden" || value.permissionDecision === "denied") {
    return (
      value.outcome === "denied" && value.sideEffect === "none" && value.errorCategory !== null
    );
  }
  if (value.outcome === "denied" && value.sideEffect !== "none") return false;
  if (
    value.sideEffect === "succeeded" &&
    value.outcome !== "succeeded" &&
    value.outcome !== "duplicate"
  ) {
    return false;
  }
  if (value.sideEffect === "rejected" && value.outcome !== "failed") return false;
  if (
    value.sideEffect === "indeterminate" &&
    value.outcome !== "failed" &&
    value.outcome !== "stopped"
  ) {
    return false;
  }
  if (value.outcome === "failed" || value.outcome === "denied" || value.outcome === "stopped") {
    return value.errorCategory !== null;
  }
  return value.errorCategory === null;
}

export function isObservation(value: unknown): value is Observation {
  try {
    if (!observationValidator.Check(value) || !isCanonicalIsoTimestamp(value.at)) return false;
    switch (value.layer) {
      case "service":
        return hasValidServiceSemantics(value);
      case "run":
        return hasValidRunSemantics(value);
      case "model":
        return hasValidModelSemantics(value);
      case "tool":
        return hasValidToolSemantics(value);
    }
  } catch {
    return false;
  }
}

export function makeAvailableMeasurement(value: number, unit: MeasurementUnit): Measurement {
  const measurement: unknown = { status: "available", value, unit };
  if (!isMeasurement(measurement)) throw new Error("Measurement is invalid.");
  return Object.freeze(measurement);
}

export function makeUnavailableMeasurement(reason: UnavailableReason): Measurement {
  const measurement: unknown = { status: "unavailable", reason };
  if (!isMeasurement(measurement)) throw new Error("Measurement is invalid.");
  return Object.freeze(measurement);
}

export function makeNotApplicableMeasurement(reason: NotApplicableReason): Measurement {
  const measurement: unknown = { status: "not_applicable", reason };
  if (!isMeasurement(measurement)) throw new Error("Measurement is invalid.");
  return Object.freeze(measurement);
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

export function createObservation(input: unknown): ObservationCreationOutcome {
  let candidate: unknown;
  try {
    candidate = structuredClone(input);
  } catch {
    candidate = null;
  }
  if (!isObservation(candidate)) {
    return Object.freeze({
      ok: false as const,
      error: Object.freeze({
        code: "invalid_observation" as const,
        message: "Observation is invalid." as const,
      }),
    });
  }
  return Object.freeze({ ok: true as const, value: deepFreeze(candidate) });
}

export { APPLICATION_VERSION };
