import { Type } from "typebox";
import Schema from "typebox/schema";
import {
  MeasurementSchema,
  type Measurement,
  makeAvailableMeasurement,
  makeUnavailableMeasurement,
} from "./observability.js";
import {
  RunProjectionStatusSchema,
  projectRunEvents,
  type RunProjection,
} from "./run-projection.js";
import {
  RunEventRunIdSchema,
  isRunEventReadOutcome,
  isRunId,
  type AgentEvent,
  type RunEventReadOutcome,
} from "./run-event.js";

export const RUN_REPORT_SCHEMA_VERSION = 1 as const;
export const MAX_RUN_REPORT_EVENTS = 1_000;
export const MAX_RUN_REPORT_TEXT_BYTES = 512 * 1024;

const IsoTimestampSchema = Type.String({
  minLength: 24,
  maxLength: 24,
  pattern: "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\\.[0-9]{3}Z$",
});

const BoundedCodeSchema = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: "^[a-z][a-z0-9_.-]*$",
});

const VersionSchema = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: "^[a-zA-Z0-9][a-zA-Z0-9._-]*$",
});

const ToolNameSchema = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: "^[a-z][a-z0-9_]*$",
});

const NullableCodeSchema = Type.Union([BoundedCodeSchema, Type.Null()]);
const NullableVersionSchema = Type.Union([VersionSchema, Type.Null()]);
const NullableToolNameSchema = Type.Union([ToolNameSchema, Type.Null()]);

export const RunReportRequestSchema = Type.Object(
  { runId: RunEventRunIdSchema },
  { additionalProperties: false },
);

const ReportTokenUsageSchema = Type.Union([
  Type.Object(
    {
      status: Type.Literal("available"),
      input: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
      output: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
      total: Type.Integer({ minimum: 0, maximum: Number.MAX_SAFE_INTEGER }),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      status: Type.Literal("unavailable"),
      reason: Type.Literal("not_reported"),
    },
    { additionalProperties: false },
  ),
]);

export const RunReportTimelineEntrySchema = Type.Object(
  {
    sequence: Type.Integer({ minimum: 1, maximum: MAX_RUN_REPORT_EVENTS }),
    at: IsoTimestampSchema,
    layer: Type.Union([
      Type.Literal("run"),
      Type.Literal("model"),
      Type.Literal("tool"),
      Type.Literal("approval"),
      Type.Literal("domain"),
      Type.Literal("effect"),
      Type.Literal("terminal"),
    ]),
    eventType: BoundedCodeSchema,
    applicationVersion: VersionSchema,
    stepNumber: Type.Union([Type.Integer({ minimum: 1, maximum: 1_000_000 }), Type.Null()]),
    retryCount: Type.Integer({ minimum: 0, maximum: 100 }),
    duration: MeasurementSchema,
    modelVersion: NullableVersionSchema,
    promptVersion: NullableVersionSchema,
    toolName: NullableToolNameSchema,
    outcome: Type.Union([
      Type.Literal("attempted"),
      Type.Literal("succeeded"),
      Type.Literal("failed"),
      Type.Literal("pending"),
      Type.Literal("duplicate"),
      Type.Literal("stopped"),
      Type.Null(),
    ]),
    permissionDecision: Type.Union([
      Type.Literal("automatic"),
      Type.Literal("approval_required"),
      Type.Literal("denied"),
      Type.Literal("not_applicable"),
    ]),
    sideEffect: Type.Union([
      Type.Literal("none"),
      Type.Literal("attempted"),
      Type.Literal("succeeded"),
      Type.Literal("rejected"),
      Type.Literal("indeterminate"),
    ]),
    tokens: ReportTokenUsageSchema,
    cost: MeasurementSchema,
    errorCategory: NullableCodeSchema,
    stopReason: NullableCodeSchema,
  },
  { additionalProperties: false },
);

const RunReportTerminalSchema = Type.Union([
  Type.Object(
    {
      kind: Type.Union([
        Type.Literal("completed"),
        Type.Literal("failed"),
        Type.Literal("stopped"),
      ]),
      stopReason: BoundedCodeSchema,
    },
    { additionalProperties: false },
  ),
  Type.Null(),
]);

const RunReportCheckpointSchema = Type.Union([
  Type.Literal("run_started"),
  Type.Literal("qualification_completed"),
  Type.Literal("draft_created"),
  Type.Literal("approval_requested"),
]);

const RunReportMetricsSchema = Type.Object(
  {
    elapsedDuration: MeasurementSchema,
    tokens: ReportTokenUsageSchema,
    cost: MeasurementSchema,
    maxRetryCount: Type.Integer({ minimum: 0, maximum: 100 }),
  },
  { additionalProperties: false },
);

export const RunReportSchema = Type.Object(
  {
    schemaVersion: Type.Literal(RUN_REPORT_SCHEMA_VERSION),
    runId: RunEventRunIdSchema,
    status: RunProjectionStatusSchema,
    authority: Type.Literal("observed_only"),
    latestSafeCheckpoint: RunReportCheckpointSchema,
    terminal: RunReportTerminalSchema,
    eventCount: Type.Integer({ minimum: 1, maximum: MAX_RUN_REPORT_EVENTS }),
    metrics: RunReportMetricsSchema,
    timeline: Type.Array(RunReportTimelineEntrySchema, {
      minItems: 1,
      maxItems: MAX_RUN_REPORT_EVENTS,
    }),
  },
  { additionalProperties: false },
);

export const RunReportFailureCodeSchema = Type.Union([
  Type.Literal("invalid_input"),
  Type.Literal("invalid_evidence_path"),
  Type.Literal("missing_run"),
  Type.Literal("corrupt_history"),
  Type.Literal("interrupted_history"),
  Type.Literal("out_of_order_history"),
  Type.Literal("duplicate_history"),
  Type.Literal("conflicting_history"),
  Type.Literal("incompatible_terminal"),
  Type.Literal("authority_mismatch"),
  Type.Literal("storage_failure"),
  Type.Literal("report_too_large"),
  Type.Literal("render_failure"),
]);

export const RunReportFailureSchema = Type.Object(
  {
    code: RunReportFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 160 }),
    retryable: Type.Boolean(),
  },
  { additionalProperties: false },
);

export type RunReportRequest = Type.Static<typeof RunReportRequestSchema>;
export type RunReportTimelineEntry = Type.Static<typeof RunReportTimelineEntrySchema>;
export type RunReport = Type.Static<typeof RunReportSchema>;
export type RunReportFailureCode = Type.Static<typeof RunReportFailureCodeSchema>;
export type RunReportFailure = Type.Static<typeof RunReportFailureSchema>;
export type RunReportOutcome =
  | Readonly<{ ok: true; value: RunReport }>
  | Readonly<{ ok: false; error: RunReportFailure }>;
export type RunReportRenderOutcome =
  | Readonly<{ ok: true; value: string }>
  | Readonly<{ ok: false; error: RunReportFailure }>;

const requestValidator = Schema.Compile(RunReportRequestSchema);
const reportValidator = Schema.Compile(RunReportSchema);
const failureValidator = Schema.Compile(RunReportFailureSchema);

const failureMessages: Readonly<Record<RunReportFailureCode, string>> = Object.freeze({
  invalid_input: "Run report input is invalid.",
  invalid_evidence_path: "Run evidence path is invalid.",
  missing_run: "No durable evidence exists for the requested run.",
  corrupt_history: "Run evidence is corrupt.",
  interrupted_history: "Run evidence contains an interrupted write.",
  out_of_order_history: "Run evidence is out of chronological order.",
  duplicate_history: "Run evidence contains duplicate facts.",
  conflicting_history: "Run evidence contains conflicting facts.",
  incompatible_terminal: "Run terminal evidence is incompatible with its history.",
  authority_mismatch: "Observed evidence conflicts with supplied authority.",
  storage_failure: "Run evidence could not be read.",
  report_too_large: "Run evidence exceeds the report bound.",
  render_failure: "Run report could not be rendered.",
});

export function makeRunReportFailure(code: RunReportFailureCode): RunReportFailure {
  return Object.freeze({
    code,
    message: failureMessages[code],
    retryable: code === "storage_failure" || code === "interrupted_history",
  });
}

function failureOutcome(code: RunReportFailureCode): RunReportOutcome {
  return Object.freeze({ ok: false, error: makeRunReportFailure(code) });
}

function renderFailure(): RunReportRenderOutcome {
  return Object.freeze({ ok: false, error: makeRunReportFailure("render_failure") });
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const item of Object.values(value as Record<string, unknown>)) deepFreeze(item);
  return Object.freeze(value);
}

function hasExactDataProperties(value: object, keys: readonly string[]): boolean {
  const actual = Reflect.ownKeys(value);
  return (
    actual.length === keys.length &&
    actual.every((key) => {
      if (typeof key !== "string" || !keys.includes(key)) return false;
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return descriptor !== undefined && "value" in descriptor;
    })
  );
}

function normalizeRequest(value: unknown): RunReportRequest | null {
  try {
    if (typeof value !== "object" || value === null || !hasExactDataProperties(value, ["runId"])) {
      return null;
    }
    const descriptor = Object.getOwnPropertyDescriptor(value, "runId");
    if (descriptor === undefined || !("value" in descriptor)) return null;
    const candidate: unknown = { runId: descriptor.value };
    return requestValidator.Check(candidate) ? Object.freeze(candidate as RunReportRequest) : null;
  } catch {
    return null;
  }
}

function getReadRun(value: unknown): ((runId: unknown) => unknown) | null {
  try {
    if ((typeof value !== "object" && typeof value !== "function") || value === null) return null;
    let owner: object | null = value as object;
    while (owner !== null) {
      const descriptor = Object.getOwnPropertyDescriptor(owner, "readRun");
      if (descriptor !== undefined) {
        return "value" in descriptor && typeof descriptor.value === "function"
          ? descriptor.value.bind(value)
          : null;
      }
      owner = Object.getPrototypeOf(owner) as object | null;
    }
    return null;
  } catch {
    return null;
  }
}

function mapStoreFailure(
  outcome: Extract<RunEventReadOutcome, { ok: false }>,
): RunReportFailureCode {
  switch (outcome.error.code) {
    case "corrupt_record":
      return "corrupt_history";
    case "interrupted_write":
      return "interrupted_history";
    case "out_of_order_record":
      return "out_of_order_history";
    case "duplicate_event":
      return "duplicate_history";
    case "invalid_input":
      return "invalid_input";
    case "storage_failure":
      return "storage_failure";
  }
}

function mapProjectionFailure(code: string): RunReportFailureCode {
  switch (code) {
    case "invalid_input":
      return "invalid_input";
    case "missing_start":
      return "corrupt_history";
    case "out_of_order_event":
      return "out_of_order_history";
    case "duplicate_evidence":
      return "duplicate_history";
    case "conflicting_evidence":
    case "cross_run_identity":
    case "missing_prerequisite":
      return "conflicting_history";
    case "incompatible_terminal":
      return "incompatible_terminal";
    case "authority_mismatch":
      return "authority_mismatch";
    case "corrupt_history":
      return "corrupt_history";
    case "interrupted_history":
      return "interrupted_history";
    default:
      return "storage_failure";
  }
}

function unavailableTokens(): RunReportTimelineEntry["tokens"] {
  return Object.freeze({ status: "unavailable", reason: "not_reported" });
}

function eventTokens(event: AgentEvent): RunReportTimelineEntry["tokens"] {
  const value = event.metadata.tokens;
  return value === null
    ? unavailableTokens()
    : Object.freeze({
        status: "available",
        input: value.input,
        output: value.output,
        total: value.total,
      });
}

function eventCost(event: AgentEvent): Measurement {
  return event.metadata.costUsd === null
    ? makeUnavailableMeasurement("not_reported")
    : makeAvailableMeasurement(event.metadata.costUsd, "usd");
}

function eventDuration(event: AgentEvent): Measurement {
  return event.metadata.durationMs === null
    ? makeUnavailableMeasurement("not_reported")
    : makeAvailableMeasurement(event.metadata.durationMs, "milliseconds");
}

function eventLayer(event: AgentEvent): RunReportTimelineEntry["layer"] {
  const kind = event.data.eventType;
  if (kind === "run.completed" || kind === "run.failed" || kind === "run.stopped") {
    return "terminal";
  }
  if (kind.startsWith("approval.")) return "approval";
  if (kind.startsWith("fake_send.")) return "effect";
  if (kind.startsWith("domain.") || kind.startsWith("qualification.")) return "domain";
  if (event.metadata.tool !== null || (kind === "pi.lifecycle" && event.data.toolName !== null)) {
    return "tool";
  }
  if (event.metadata.modelVersion !== null || event.metadata.promptVersion !== null) return "model";
  return "run";
}

function toolName(event: AgentEvent): string | null {
  if (event.metadata.tool !== null) return event.metadata.tool.name;
  return event.data.eventType === "pi.lifecycle" ? event.data.toolName : null;
}

function permissionDecision(event: AgentEvent): RunReportTimelineEntry["permissionDecision"] {
  if (event.data.eventType === "fake_send.permission_denied") return "denied";
  if (event.data.eventType.startsWith("fake_send.")) return "approval_required";
  const name = toolName(event);
  if (name === "request_send_approval") return "approval_required";
  if (name === "qualify_lead" || name === "draft_follow_up") return "automatic";
  return "not_applicable";
}

function sideEffect(event: AgentEvent): RunReportTimelineEntry["sideEffect"] {
  switch (event.data.eventType) {
    case "fake_send.attempted":
      return "attempted";
    case "fake_send.accepted":
    case "fake_send.duplicate":
      return "succeeded";
    case "fake_send.rejected":
      return "rejected";
    case "fake_send.timed_out":
    case "fake_send.downstream_failed":
    case "fake_send.storage_failed":
      return "indeterminate";
    default:
      return "none";
  }
}

function errorCategory(event: AgentEvent): string | null {
  if (event.metadata.errorCode !== null) return event.metadata.errorCode;
  switch (event.data.eventType) {
    case "qualification.failed":
      return event.data.error.code;
    case "run.failed":
      return event.data.code;
    case "run.stopped":
      return event.data.stopReason;
    case "fake_send.permission_denied":
      return "permission_denied";
    case "fake_send.timed_out":
      return "timeout";
    case "fake_send.downstream_failed":
      return "downstream_failure";
    case "fake_send.storage_failed":
      return "storage_failure";
    default:
      return null;
  }
}

function stopReason(event: AgentEvent): string | null {
  if (
    event.data.eventType === "run.completed" ||
    event.data.eventType === "run.stopped" ||
    event.data.eventType === "pi.lifecycle"
  ) {
    return event.data.stopReason;
  }
  if (event.data.eventType === "run.failed") return event.data.code;
  return event.metadata.stopReason;
}

function timelineEntry(event: AgentEvent, index: number): RunReportTimelineEntry {
  return deepFreeze({
    sequence: index + 1,
    at: event.at,
    layer: eventLayer(event),
    eventType: event.data.eventType,
    applicationVersion: event.metadata.applicationVersion,
    stepNumber: event.metadata.stepNumber,
    retryCount: event.metadata.retryCount,
    duration: eventDuration(event),
    modelVersion: event.metadata.modelVersion,
    promptVersion: event.metadata.promptVersion,
    toolName: toolName(event),
    outcome: event.metadata.result,
    permissionDecision: permissionDecision(event),
    sideEffect: sideEffect(event),
    tokens: eventTokens(event),
    cost: eventCost(event),
    errorCategory: errorCategory(event),
    stopReason: stopReason(event),
  });
}

function checkedSum(values: readonly number[]): number | null {
  let total = 0;
  for (const value of values) {
    total += value;
    if (!Number.isSafeInteger(total)) return null;
  }
  return total;
}

function reportMetrics(events: readonly AgentEvent[]): RunReport["metrics"] | null {
  const costs = events.flatMap((event) =>
    event.metadata.costUsd === null ? [] : [event.metadata.costUsd],
  );
  const usages = events.flatMap((event) =>
    event.metadata.tokens === null ? [] : [event.metadata.tokens],
  );
  const tokenInput = checkedSum(usages.map((usage) => usage.input));
  const tokenOutput = checkedSum(usages.map((usage) => usage.output));
  const tokenTotal = checkedSum(usages.map((usage) => usage.total));
  const costTotal = costs.reduce((total, value) => total + value, 0);
  if (
    tokenInput === null ||
    tokenOutput === null ||
    tokenTotal === null ||
    !Number.isFinite(costTotal) ||
    costTotal > Number.MAX_SAFE_INTEGER
  ) {
    return null;
  }
  const first = events[0];
  const last = events.at(-1);
  if (first === undefined || last === undefined) return null;
  const elapsedDuration = Date.parse(last.at) - Date.parse(first.at);
  const maxRetryCount = Math.max(...events.map((event) => event.metadata.retryCount));
  if (!Number.isSafeInteger(elapsedDuration) || elapsedDuration < 0) return null;
  return deepFreeze({
    elapsedDuration: makeAvailableMeasurement(elapsedDuration, "milliseconds"),
    tokens:
      usages.length === 0
        ? unavailableTokens()
        : Object.freeze({
            status: "available" as const,
            input: tokenInput,
            output: tokenOutput,
            total: tokenTotal,
          }),
    cost:
      costs.length === 0
        ? makeUnavailableMeasurement("not_reported")
        : makeAvailableMeasurement(costTotal, "usd"),
    maxRetryCount,
  });
}

function terminalFrom(projection: RunProjection): RunReport["terminal"] {
  return projection.terminalOutcome === null
    ? null
    : Object.freeze({
        kind: projection.terminalOutcome.kind,
        stopReason: projection.terminalOutcome.stopReason,
      });
}

export function isRunReport(value: unknown): value is RunReport {
  try {
    return (
      hasDataOnlyGraph(value) &&
      reportValidator.Check(value) &&
      hasValidReportSemantics(value as RunReport)
    );
  } catch {
    return false;
  }
}

function hasDataOnlyGraph(value: unknown, seen = new Set<object>()): boolean {
  if (typeof value === "function" || typeof value === "symbol") return false;
  if (typeof value !== "object" || value === null) return true;
  if (seen.has(value)) return false;
  seen.add(value);
  try {
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== Array.prototype && prototype !== null) {
      return false;
    }
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

function availableValue(value: Measurement, unit: "milliseconds" | "usd"): number | null {
  return value.status === "available" && value.unit === unit ? value.value : null;
}

function hasValidReportSemantics(report: RunReport): boolean {
  if (report.eventCount !== report.timeline.length) return false;
  let lastTime = Number.NEGATIVE_INFINITY;
  let maxRetryCount = 0;
  let tokenInput = 0;
  let tokenOutput = 0;
  let tokenTotal = 0;
  let cost = 0;
  let tokenCount = 0;
  let costCount = 0;
  const terminals: RunReportTimelineEntry[] = [];
  for (let index = 0; index < report.timeline.length; index += 1) {
    const entry = report.timeline[index];
    if (entry === undefined || entry.sequence !== index + 1) return false;
    const time = Date.parse(entry.at);
    if (!Number.isFinite(time) || time < lastTime) return false;
    lastTime = time;
    maxRetryCount = Math.max(maxRetryCount, entry.retryCount);
    if (entry.tokens.status === "available") {
      if (entry.tokens.total !== entry.tokens.input + entry.tokens.output) return false;
      tokenInput += entry.tokens.input;
      tokenOutput += entry.tokens.output;
      tokenTotal += entry.tokens.total;
      tokenCount += 1;
    }
    const entryCost = availableValue(entry.cost, "usd");
    if (entryCost !== null) {
      cost += entryCost;
      costCount += 1;
    }
    if (entry.layer === "terminal") terminals.push(entry);
  }
  if (
    !Number.isSafeInteger(tokenInput) ||
    !Number.isSafeInteger(tokenOutput) ||
    !Number.isSafeInteger(tokenTotal) ||
    !Number.isFinite(cost) ||
    report.metrics.maxRetryCount !== maxRetryCount
  ) {
    return false;
  }
  const elapsedDuration = lastTime - Date.parse(report.timeline[0]?.at ?? "");
  const durationMatches =
    Number.isSafeInteger(elapsedDuration) &&
    elapsedDuration >= 0 &&
    availableValue(report.metrics.elapsedDuration, "milliseconds") === elapsedDuration;
  const costMatches =
    costCount === 0
      ? report.metrics.cost.status === "unavailable"
      : availableValue(report.metrics.cost, "usd") === cost;
  const tokensMatch =
    tokenCount === 0
      ? report.metrics.tokens.status === "unavailable"
      : report.metrics.tokens.status === "available" &&
        report.metrics.tokens.input === tokenInput &&
        report.metrics.tokens.output === tokenOutput &&
        report.metrics.tokens.total === tokenTotal;
  if (!durationMatches || !costMatches || !tokensMatch || terminals.length > 1) return false;
  const terminal = terminals[0];
  if (report.terminal === null) return terminal === undefined;
  if (terminal === undefined || terminal.stopReason !== report.terminal.stopReason) return false;
  return (
    (terminal.eventType === "run.completed" && report.terminal.kind === "completed") ||
    (terminal.eventType === "run.failed" && report.terminal.kind === "failed") ||
    (terminal.eventType === "run.stopped" && report.terminal.kind === "stopped")
  );
}

export function isRunReportFailure(value: unknown): value is RunReportFailure {
  try {
    return hasDataOnlyGraph(value) && failureValidator.Check(value);
  } catch {
    return false;
  }
}

export function buildRunReport(store: unknown, request: unknown): RunReportOutcome {
  const safeRequest = normalizeRequest(request);
  if (safeRequest === null || !isRunId(safeRequest.runId)) return failureOutcome("invalid_input");
  const readRun = getReadRun(store);
  if (readRun === null) return failureOutcome("storage_failure");

  let readOutcome: unknown;
  try {
    readOutcome = readRun(safeRequest.runId);
  } catch {
    return failureOutcome("storage_failure");
  }
  if (!hasDataOnlyGraph(readOutcome) || !isRunEventReadOutcome(readOutcome)) {
    return failureOutcome("storage_failure");
  }
  if (!readOutcome.ok) return failureOutcome(mapStoreFailure(readOutcome));
  if (readOutcome.value.length === 0) return failureOutcome("missing_run");
  if (readOutcome.value.length > MAX_RUN_REPORT_EVENTS) return failureOutcome("report_too_large");

  const projection = projectRunEvents({ runId: safeRequest.runId, events: readOutcome.value });
  if (!projection.ok) return failureOutcome(mapProjectionFailure(projection.error.code));
  const metrics = reportMetrics(readOutcome.value);
  if (metrics === null) return failureOutcome("report_too_large");

  const report: RunReport = {
    schemaVersion: RUN_REPORT_SCHEMA_VERSION,
    runId: safeRequest.runId,
    status: projection.value.status,
    authority: "observed_only",
    latestSafeCheckpoint: projection.value.latestSafeCheckpoint.kind,
    terminal: terminalFrom(projection.value),
    eventCount: readOutcome.value.length,
    metrics,
    timeline: readOutcome.value.map(timelineEntry),
  };
  return isRunReport(report)
    ? Object.freeze({ ok: true, value: deepFreeze(report) })
    : failureOutcome("corrupt_history");
}

function measurementText(value: Measurement): string {
  return value.status === "available"
    ? `${value.value}:${value.unit}`
    : `${value.status}:${value.reason}`;
}

function tokensText(value: RunReportTimelineEntry["tokens"]): string {
  return value.status === "available"
    ? `${value.input}/${value.output}/${value.total}`
    : `unavailable:${value.reason}`;
}

function nullable(value: string | number | null): string {
  return value === null ? "-" : String(value);
}

export function renderRunReportText(input: unknown): RunReportRenderOutcome {
  let report: RunReport;
  try {
    if (!hasDataOnlyGraph(input)) return renderFailure();
    const cloned: unknown = structuredClone(input);
    if (!isRunReport(cloned)) return renderFailure();
    report = cloned;
  } catch {
    return renderFailure();
  }

  const terminal =
    report.terminal === null
      ? "terminal=-"
      : `terminal=${report.terminal.kind}:${report.terminal.stopReason}`;
  const lines = [
    `run=${report.runId} status=${report.status} events=${report.eventCount} checkpoint=${report.latestSafeCheckpoint} authority=${report.authority} ${terminal}`,
    `metrics elapsed=${measurementText(report.metrics.elapsedDuration)} max_retry=${report.metrics.maxRetryCount} tokens=${tokensText(report.metrics.tokens)} cost=${measurementText(report.metrics.cost)}`,
    ...report.timeline.map(
      (entry) =>
        `${String(entry.sequence).padStart(3, "0")} at=${entry.at} layer=${entry.layer} event=${entry.eventType} app=${entry.applicationVersion} step=${nullable(entry.stepNumber)} retry=${entry.retryCount} duration=${measurementText(entry.duration)} outcome=${nullable(entry.outcome)} permission=${entry.permissionDecision} effect=${entry.sideEffect} error=${nullable(entry.errorCategory)} stop=${nullable(entry.stopReason)} model=${nullable(entry.modelVersion)} prompt=${nullable(entry.promptVersion)} tool=${nullable(entry.toolName)} tokens=${tokensText(entry.tokens)} cost=${measurementText(entry.cost)}`,
    ),
  ];
  const output = `${lines.join("\n")}\n`;
  return Buffer.byteLength(output, "utf8") <= MAX_RUN_REPORT_TEXT_BYTES
    ? Object.freeze({ ok: true, value: output })
    : renderFailure();
}
