import { isDeepStrictEqual } from "node:util";
import { Type } from "typebox";
import Schema from "typebox/schema";
import { ApprovalEventDataSchema, isApprovalEventData } from "./approval.js";
import { FakeSendEventDataSchema, isFakeSendEventData } from "./fake-send-result.js";
import {
  QualificationFailureSchema,
  QualificationResultSchema,
  isQualificationFailure,
  isQualificationResult,
} from "./qualification.js";

export const RUN_EVENT_SCHEMA_VERSION = 1 as const;

const RunEventIdSchema = Type.String({
  minLength: 8,
  maxLength: 120,
  pattern: "^event_[a-z0-9_-]+$",
});

export const RunEventRunIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern:
    "^(?:run_[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$",
});

const LeadIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern: "^lead_[a-z0-9_]+$",
});

const DraftIdSchema = Type.String({
  minLength: 10,
  maxLength: 100,
  pattern: "^draft_[a-z0-9_-]+$",
});

const Sha256Schema = Type.String({
  minLength: 64,
  maxLength: 64,
  pattern: "^[0-9a-f]{64}$",
});

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

const BoundedIdentifierSchema = Type.String({
  minLength: 1,
  maxLength: 120,
  pattern: "^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$",
});

const VersionSchema = Type.String({
  minLength: 1,
  maxLength: 80,
  pattern: "^[a-zA-Z0-9][a-zA-Z0-9._-]*$",
});

const NullableCodeSchema = Type.Union([BoundedCodeSchema, Type.Null()]);
const NullableIdentifierSchema = Type.Union([BoundedIdentifierSchema, Type.Null()]);
const NullableVersionSchema = Type.Union([VersionSchema, Type.Null()]);

const ActorSchema = Type.Object(
  {
    kind: Type.Union([
      Type.Literal("application"),
      Type.Literal("model"),
      Type.Literal("tool"),
      Type.Literal("human"),
      Type.Literal("system"),
    ]),
    id: Type.Union([
      Type.String({
        minLength: 3,
        maxLength: 100,
        pattern: "^[a-z][a-z0-9_-]+$",
      }),
      Type.Null(),
    ]),
  },
  { additionalProperties: false },
);

const ToolMetadataSchema = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 80,
      pattern: "^[a-z][a-z0-9_]+$",
    }),
    callId: NullableIdentifierSchema,
  },
  { additionalProperties: false },
);

const EventArgumentValueSchema = Type.Union([
  Type.String({ maxLength: 240 }),
  Type.Number(),
  Type.Boolean(),
  Type.Null(),
]);

const ValidatedArgumentsSchema = Type.Record(
  Type.String({ minLength: 1, maxLength: 80, pattern: "^[a-zA-Z][a-zA-Z0-9_]*$" }),
  EventArgumentValueSchema,
  { maxProperties: 20 },
);

const ResultKindSchema = Type.Union([
  Type.Literal("attempted"),
  Type.Literal("succeeded"),
  Type.Literal("failed"),
  Type.Literal("pending"),
  Type.Literal("duplicate"),
  Type.Literal("stopped"),
]);

const ApprovalStateSchema = Type.Union([
  Type.Literal("pending"),
  Type.Literal("approved"),
  Type.Literal("declined"),
  Type.Null(),
]);

const TokenUsageSchema = Type.Object(
  {
    input: Type.Integer({ minimum: 0, maximum: 1_000_000_000 }),
    output: Type.Integer({ minimum: 0, maximum: 1_000_000_000 }),
    total: Type.Integer({ minimum: 0, maximum: 2_000_000_000 }),
  },
  { additionalProperties: false },
);

export const RunEventMetadataSchema = Type.Object(
  {
    actor: ActorSchema,
    action: NullableCodeSchema,
    tool: Type.Union([ToolMetadataSchema, Type.Null()]),
    validatedArguments: Type.Union([ValidatedArgumentsSchema, Type.Null()]),
    result: Type.Union([ResultKindSchema, Type.Null()]),
    errorCode: NullableCodeSchema,
    approvalState: ApprovalStateSchema,
    stopReason: NullableCodeSchema,
    applicationVersion: VersionSchema,
    modelVersion: NullableVersionSchema,
    promptVersion: NullableVersionSchema,
    durationMs: Type.Union([Type.Integer({ minimum: 0, maximum: 86_400_000 }), Type.Null()]),
    retryCount: Type.Integer({ minimum: 0, maximum: 100 }),
    tokens: Type.Union([TokenUsageSchema, Type.Null()]),
    costUsd: Type.Union([Type.Number({ minimum: 0, maximum: 1_000_000 }), Type.Null()]),
  },
  { additionalProperties: false },
);

const RunStopReasonSchema = Type.Union([
  Type.Literal("approval_pending"),
  Type.Literal("approval_failed"),
  Type.Literal("not_found"),
  Type.Literal("qualification_failed"),
  Type.Literal("completed"),
]);

const RunEventDataSchema = Type.Union([
  Type.Object(
    {
      eventType: Type.Literal("run.started"),
      leadId: LeadIdSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("run.completed"),
      stopReason: RunStopReasonSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("run.failed"),
      code: Type.Literal("agent_run_failed"),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("qualification.attempted"),
      leadId: Type.Optional(LeadIdSchema),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("qualification.completed"),
      result: QualificationResultSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("qualification.failed"),
      error: QualificationFailureSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("domain.follow_up_drafted"),
      leadId: LeadIdSchema,
      draftId: DraftIdSchema,
      sha256: Sha256Schema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      eventType: Type.Literal("pi.lifecycle"),
      sourceType: BoundedCodeSchema,
      toolName: Type.Union([
        Type.String({ minLength: 1, maxLength: 80, pattern: "^[a-z][a-z0-9_]+$" }),
        Type.Null(),
      ]),
      toolCallId: NullableIdentifierSchema,
      isError: Type.Union([Type.Boolean(), Type.Null()]),
      messageId: NullableIdentifierSchema,
      stopReason: NullableCodeSchema,
    },
    { additionalProperties: false },
  ),
  ApprovalEventDataSchema,
  FakeSendEventDataSchema,
]);

export const AgentEventSchema = Type.Object(
  {
    schemaVersion: Type.Literal(RUN_EVENT_SCHEMA_VERSION),
    eventId: RunEventIdSchema,
    runId: RunEventRunIdSchema,
    at: IsoTimestampSchema,
    type: BoundedCodeSchema,
    data: RunEventDataSchema,
    metadata: RunEventMetadataSchema,
  },
  { additionalProperties: false },
);

const RunEventInputMetadataSchema = Type.Partial(
  Type.Object(
    {
      actor: ActorSchema,
      action: NullableCodeSchema,
      tool: Type.Union([ToolMetadataSchema, Type.Null()]),
      validatedArguments: Type.Union([ValidatedArgumentsSchema, Type.Null()]),
      result: Type.Union([ResultKindSchema, Type.Null()]),
      errorCode: NullableCodeSchema,
      approvalState: ApprovalStateSchema,
      stopReason: NullableCodeSchema,
      modelVersion: NullableVersionSchema,
      promptVersion: NullableVersionSchema,
      durationMs: Type.Union([Type.Integer({ minimum: 0, maximum: 86_400_000 }), Type.Null()]),
      retryCount: Type.Integer({ minimum: 0, maximum: 100 }),
      tokens: Type.Union([TokenUsageSchema, Type.Null()]),
      costUsd: Type.Union([Type.Number({ minimum: 0, maximum: 1_000_000 }), Type.Null()]),
    },
    { additionalProperties: false },
  ),
);

export const RunEventInputSchema = Type.Object(
  {
    runId: RunEventRunIdSchema,
    type: BoundedCodeSchema,
    data: RunEventDataSchema,
    metadata: Type.Optional(RunEventInputMetadataSchema),
  },
  { additionalProperties: false },
);

const GeneratedEventFieldsSchema = Type.Object(
  {
    eventId: RunEventIdSchema,
    at: IsoTimestampSchema,
    applicationVersion: VersionSchema,
  },
  { additionalProperties: false },
);

export const RunEventFailureCodeSchema = Type.Union([
  Type.Literal("invalid_input"),
  Type.Literal("corrupt_record"),
  Type.Literal("interrupted_write"),
  Type.Literal("out_of_order_record"),
  Type.Literal("duplicate_event"),
  Type.Literal("storage_failure"),
]);

export const RunEventFailureSchema = Type.Object(
  {
    code: RunEventFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 160 }),
    retryable: Type.Boolean(),
  },
  { additionalProperties: false },
);

export type AgentEvent = Type.Static<typeof AgentEventSchema>;
export type RunEventData = Type.Static<typeof RunEventDataSchema>;
export type RunEventInput = Type.Static<typeof RunEventInputSchema>;
export type RunEventMetadata = Type.Static<typeof RunEventMetadataSchema>;
export type RunEventFailureCode = Type.Static<typeof RunEventFailureCodeSchema>;
export type RunEventFailure = Type.Static<typeof RunEventFailureSchema>;

export type RunEventCreationOutcome =
  | { ok: true; value: AgentEvent }
  | { ok: false; error: RunEventFailure };
export type RunEventAppendOutcome = RunEventCreationOutcome;
export type RunEventReadOutcome =
  | { ok: true; value: AgentEvent[] }
  | { ok: false; error: RunEventFailure };

export type RunEventStore = {
  append(input: unknown): RunEventAppendOutcome;
  readRun(runId: unknown): RunEventReadOutcome;
};

const eventValidator = Schema.Compile(AgentEventSchema);
const inputValidator = Schema.Compile(RunEventInputSchema);
const metadataValidator = Schema.Compile(RunEventMetadataSchema);
const generatedFieldsValidator = Schema.Compile(GeneratedEventFieldsSchema);
const failureValidator = Schema.Compile(RunEventFailureSchema);

const failureMessages: Record<RunEventFailureCode, string> = {
  invalid_input: "Run event input is invalid.",
  corrupt_record: "Run event storage contains a corrupt record.",
  interrupted_write: "Run event storage contains an interrupted write.",
  out_of_order_record: "Run event storage records are out of order.",
  duplicate_event: "Run event storage contains a duplicate event identity.",
  storage_failure: "Run event storage operation failed.",
};

const retryableFailures = new Set<RunEventFailureCode>(["interrupted_write", "storage_failure"]);

function isCanonicalIsoTimestamp(value: string): boolean {
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function hasValidTokenTotals(metadata: RunEventMetadata): boolean {
  return (
    metadata.tokens === null ||
    metadata.tokens.input + metadata.tokens.output === metadata.tokens.total
  );
}

function hasValidArguments(metadata: RunEventMetadata): boolean {
  if (metadata.validatedArguments === null) return true;
  const entries = Object.entries(metadata.validatedArguments);
  return (
    entries.length <= 20 &&
    entries.every(
      ([key, value]) =>
        /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key) &&
        key.length <= 80 &&
        (typeof value !== "string" || value.length <= 240),
    )
  );
}

function hasValidActor(metadata: RunEventMetadata): boolean {
  return metadata.actor.kind !== "human" || metadata.actor.id !== null;
}

function hasValidEventData(data: RunEventData): boolean {
  if (data.eventType === "qualification.completed") {
    return isQualificationResult(data.result);
  }
  if (data.eventType === "qualification.failed") {
    return isQualificationFailure(data.error);
  }
  if (data.eventType.startsWith("approval.")) {
    return isApprovalEventData(data);
  }
  if (data.eventType.startsWith("fake_send.")) {
    return isFakeSendEventData(data);
  }
  return true;
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

export function makeRunEventFailure(code: RunEventFailureCode): RunEventFailure {
  return Object.freeze({
    code,
    message: failureMessages[code],
    retryable: retryableFailures.has(code),
  });
}

export function isRunEventFailure(value: unknown): value is RunEventFailure {
  try {
    if (!failureValidator.Check(value)) return false;
    const failure = value as RunEventFailure;
    return isDeepStrictEqual(failure, makeRunEventFailure(failure.code));
  } catch {
    return false;
  }
}

export function isRunEventMetadata(value: unknown): value is RunEventMetadata {
  try {
    if (!metadataValidator.Check(value)) return false;
    const metadata = value as RunEventMetadata;
    return hasValidTokenTotals(metadata) && hasValidArguments(metadata) && hasValidActor(metadata);
  } catch {
    return false;
  }
}

export function isRunEventInput(value: unknown): value is RunEventInput {
  try {
    if (!inputValidator.Check(value)) return false;
    const input = value as RunEventInput;
    return input.type === input.data.eventType && hasValidEventData(input.data);
  } catch {
    return false;
  }
}

export function isRunEventId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 8 &&
    value.length <= 120 &&
    /^event_[a-z0-9_-]+$/.test(value)
  );
}

export function isRunId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 6 &&
    value.length <= 80 &&
    /^(?:run_[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/.test(
      value,
    )
  );
}

export function isAgentEvent(value: unknown): value is AgentEvent {
  try {
    if (!eventValidator.Check(value)) return false;
    const event = value as AgentEvent;
    return (
      isCanonicalIsoTimestamp(event.at) &&
      event.type === event.data.eventType &&
      hasValidEventData(event.data) &&
      isRunEventMetadata(event.metadata)
    );
  } catch {
    return false;
  }
}

export function freezeAgentEvent(event: AgentEvent): AgentEvent {
  return deepFreeze(structuredClone(event));
}

function frozenCreationFailure(
  code: RunEventFailureCode,
): Extract<RunEventCreationOutcome, { ok: false }> {
  return Object.freeze({ ok: false as const, error: makeRunEventFailure(code) });
}

export function createAgentEvent(input: unknown, generated: unknown): RunEventCreationOutcome {
  let safeInput: unknown;
  try {
    safeInput = structuredClone(input);
  } catch {
    return frozenCreationFailure("invalid_input");
  }
  if (!isRunEventInput(safeInput)) return frozenCreationFailure("invalid_input");

  let safeGenerated: unknown;
  try {
    safeGenerated = structuredClone(generated);
  } catch {
    return frozenCreationFailure("storage_failure");
  }
  try {
    if (!generatedFieldsValidator.Check(safeGenerated)) {
      return frozenCreationFailure("storage_failure");
    }
  } catch {
    return frozenCreationFailure("storage_failure");
  }
  const fields = safeGenerated as Type.Static<typeof GeneratedEventFieldsSchema>;
  if (!isCanonicalIsoTimestamp(fields.at)) return frozenCreationFailure("storage_failure");

  const metadata: RunEventMetadata = {
    actor: { kind: "application", id: null },
    action: null,
    tool: null,
    validatedArguments: null,
    result: null,
    errorCode: null,
    approvalState: null,
    stopReason: null,
    applicationVersion: fields.applicationVersion,
    modelVersion: null,
    promptVersion: null,
    durationMs: null,
    retryCount: 0,
    tokens: null,
    costUsd: null,
    ...(safeInput.metadata ?? {}),
  };
  try {
    const event = {
      schemaVersion: RUN_EVENT_SCHEMA_VERSION,
      eventId: fields.eventId,
      runId: safeInput.runId,
      at: fields.at,
      type: safeInput.type,
      data: safeInput.data,
      metadata,
    };
    return isAgentEvent(event)
      ? Object.freeze({ ok: true as const, value: freezeAgentEvent(event) })
      : frozenCreationFailure("invalid_input");
  } catch {
    return frozenCreationFailure("invalid_input");
  }
}

export function isRunEventAppendOutcome(value: unknown): value is RunEventAppendOutcome {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    if (Object.keys(candidate).length !== 2 || typeof candidate.ok !== "boolean") return false;
    return candidate.ok === true
      ? "value" in candidate && isAgentEvent(candidate.value)
      : "error" in candidate && isRunEventFailure(candidate.error);
  } catch {
    return false;
  }
}

export function isMatchingRunEventAppendOutcome(
  value: unknown,
  input: unknown,
): value is Extract<RunEventAppendOutcome, { ok: true }> {
  try {
    const safeInput: unknown = structuredClone(input);
    if (!isRunEventAppendOutcome(value) || !value.ok || !isRunEventInput(safeInput)) return false;
    if (
      value.value.runId !== safeInput.runId ||
      value.value.type !== safeInput.type ||
      !isDeepStrictEqual(value.value.data, safeInput.data)
    ) {
      return false;
    }
    return Object.entries(safeInput.metadata ?? {}).every(([key, expected]) =>
      isDeepStrictEqual(value.value.metadata[key as keyof RunEventMetadata], expected),
    );
  } catch {
    return false;
  }
}

function hasValidEventSequence(events: readonly AgentEvent[]): boolean {
  const eventIds = new Set<string>();
  const lastRunTime = new Map<string, number>();
  for (const event of events) {
    if (eventIds.has(event.eventId)) return false;
    eventIds.add(event.eventId);
    const timestamp = Date.parse(event.at);
    const previous = lastRunTime.get(event.runId);
    if (previous !== undefined && timestamp < previous) return false;
    lastRunTime.set(event.runId, timestamp);
  }
  return true;
}

export function isRunEventReadOutcome(value: unknown): value is RunEventReadOutcome {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    if (Object.keys(candidate).length !== 2 || typeof candidate.ok !== "boolean") return false;
    return candidate.ok === true
      ? "value" in candidate &&
          Array.isArray(candidate.value) &&
          candidate.value.every(isAgentEvent) &&
          hasValidEventSequence(candidate.value)
      : "error" in candidate && isRunEventFailure(candidate.error);
  } catch {
    return false;
  }
}
