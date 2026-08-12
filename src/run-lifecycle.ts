import { Type } from "typebox";
import Schema from "typebox/schema";
import { isMatchingRunEventAppendOutcome, isRunId, type RunEventStore } from "./run-event.js";

export const DEFAULT_RUN_DEADLINE_MS = 30_000;
export const DEFAULT_RUN_MAX_STEPS = 24;
export const MAX_RUN_DEADLINE_MS = 300_000;
export const MAX_RUN_STEPS = 100;

const RunBoundsSchema = Type.Object(
  {
    deadlineMs: Type.Integer({ minimum: 1, maximum: MAX_RUN_DEADLINE_MS }),
    maxSteps: Type.Integer({ minimum: 1, maximum: MAX_RUN_STEPS }),
  },
  { additionalProperties: false },
);

const CompletedStopReasonSchema = Type.Union([
  Type.Literal("approval_pending"),
  Type.Literal("approval_failed"),
  Type.Literal("not_found"),
  Type.Literal("qualification_failed"),
  Type.Literal("completed"),
]);

const BoundedStopReasonSchema = Type.Union([
  Type.Literal("deadline_exceeded"),
  Type.Literal("step_limit_exceeded"),
  Type.Literal("dependency_failed"),
]);

const RunLifecycleOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      value: Type.Unknown(),
      stopReason: CompletedStopReasonSchema,
      stepCount: Type.Integer({ minimum: 0, maximum: MAX_RUN_STEPS }),
      durationMs: Type.Integer({ minimum: 0, maximum: 86_400_000 }),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      stopReason: BoundedStopReasonSchema,
      storageFailure: Type.Boolean(),
      stepCount: Type.Integer({ minimum: 0, maximum: MAX_RUN_STEPS }),
      durationMs: Type.Integer({ minimum: 0, maximum: 86_400_000 }),
    },
    { additionalProperties: false },
  ),
]);

const boundsValidator = Schema.Compile(RunBoundsSchema);
const completedStopValidator = Schema.Compile(CompletedStopReasonSchema);
const lifecycleOutcomeValidator = Schema.Compile(RunLifecycleOutcomeSchema);

export type RunBounds = Type.Static<typeof RunBoundsSchema>;
export type CompletedRunStopReason = Type.Static<typeof CompletedStopReasonSchema>;
export type BoundedRunStopReason = Type.Static<typeof BoundedStopReasonSchema>;
export type RunLifecycleOutcome<T = unknown> =
  | {
      ok: true;
      value: T;
      stopReason: CompletedRunStopReason;
      stepCount: number;
      durationMs: number;
    }
  | {
      ok: false;
      stopReason: BoundedRunStopReason;
      storageFailure: boolean;
      stepCount: number;
      durationMs: number;
    };

export type BoundedRunSession = {
  prompt(text: string): Promise<void>;
  abort(): Promise<void> | void;
  subscribe(listener: (event: unknown) => void): () => void;
  dispose(): void;
};

export type RunTimerBoundary = {
  now(): number;
  schedule(callback: () => void, delayMs: number): unknown;
  cancel(handle: unknown): void;
};

export type RunCompletion<T> = {
  value: T;
  stopReason: CompletedRunStopReason;
};

export type ExecuteBoundedRunOptions<S extends BoundedRunSession, T> = {
  runId: string;
  prompt: string;
  bounds: RunBounds;
  createSession(): Promise<S>;
  complete(session: S): Promise<RunCompletion<T>>;
  eventStore: Pick<RunEventStore, "append">;
  timer?: RunTimerBoundary;
};

type NormalizedPiEvent = {
  data: {
    eventType: "pi.lifecycle";
    sourceType: string;
    toolName: string | null;
    toolCallId: string | null;
    isError: boolean | null;
    messageId: string | null;
    stopReason: string | null;
  };
  modelVersion: string | null;
  errorCode: string | null;
  retryCount: number;
  tokens: { input: number; output: number; total: number } | null;
  costUsd: number | null;
};

type OpenToolCall = {
  toolName: string;
  toolCallId: string;
  stepNumber: number;
  startedAt: number;
};

const consumingSourceTypes = new Set(["turn_start", "tool_execution_start"]);
const persistedPiSourceTypes = new Set([
  "agent_start",
  "agent_end",
  "agent_settled",
  "turn_start",
  "turn_end",
  "message_start",
  "message_end",
  "tool_execution_start",
  "tool_execution_end",
  "auto_retry_start",
  "auto_retry_end",
  "compaction_start",
  "compaction_end",
  "model_select",
  "thinking_level_select",
]);

const systemTimer: RunTimerBoundary = {
  now: () => Date.now(),
  schedule: (callback, delayMs) => setTimeout(callback, delayMs),
  cancel: (handle) => clearTimeout(handle as NodeJS.Timeout),
};

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

function cloneAndFreeze<T>(value: T): T | undefined {
  try {
    return deepFreeze(structuredClone(value));
  } catch {
    return undefined;
  }
}

function boundedCode(value: unknown): string | null {
  return typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 80 &&
    /^[a-z][a-z0-9_.-]*$/.test(value)
    ? value
    : null;
}

function boundedIdentifier(value: unknown): string | null {
  return typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 120 &&
    /^[a-zA-Z0-9][a-zA-Z0-9_.:|-]*$/.test(value)
    ? value
    : null;
}

function boundedVersion(value: unknown): string | null {
  return typeof value === "string" &&
    value.length >= 1 &&
    value.length <= 80 &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)
    ? value
    : null;
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

function boundedNonnegativeInteger(value: unknown, maximum: number): number | null {
  return Number.isInteger(value) && Number(value) >= 0 && Number(value) <= maximum
    ? Number(value)
    : null;
}

function normalizedUsage(candidate: Record<string, unknown>): NormalizedPiEvent["tokens"] {
  const message = record(candidate.message);
  const usage = record(candidate.usage) ?? record(message?.usage);
  if (!usage) return null;
  const input = boundedNonnegativeInteger(usage.input ?? usage.inputTokens, 1_000_000_000);
  const output = boundedNonnegativeInteger(usage.output ?? usage.outputTokens, 1_000_000_000);
  if (input === null || output === null) return null;
  const total = boundedNonnegativeInteger(usage.total ?? usage.totalTokens, 2_000_000_000);
  return total === input + output ? { input, output, total } : null;
}

function normalizedCost(candidate: Record<string, unknown>): number | null {
  const message = record(candidate.message);
  const usage = record(candidate.usage) ?? record(message?.usage);
  const cost = record(usage?.cost);
  const value = candidate.costUsd ?? usage?.costUsd ?? cost?.total;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1_000_000
    ? value
    : null;
}

export function normalizePiLifecycleEvent(event: unknown): NormalizedPiEvent {
  try {
    const candidate = record(event) ?? {};
    const message = record(candidate.message);
    const model = record(candidate.model);
    const messageModel = record(message?.model);
    const toolResult = record(candidate.result);
    const details = record(toolResult?.details);
    const detailError = record(details?.error);
    const sourceType = boundedCode(candidate.type) ?? "unknown";
    const rawToolName = candidate.toolName;
    const toolName =
      typeof rawToolName === "string" &&
      rawToolName.length <= 80 &&
      /^[a-z][a-z0-9_]+$/.test(rawToolName)
        ? rawToolName
        : null;
    const retryCount = boundedNonnegativeInteger(candidate.attempt, 100) ?? 0;
    const applicationErrorCode =
      boundedCode(details?.code) ?? boundedCode(detailError?.code) ?? null;
    const applicationFailure =
      applicationErrorCode !== null || details?.ok === false || details?.created === false;
    const isError =
      typeof candidate.isError === "boolean"
        ? candidate.isError || applicationFailure
        : applicationFailure
          ? true
          : null;
    return {
      data: {
        eventType: "pi.lifecycle",
        sourceType,
        toolName,
        toolCallId: boundedIdentifier(candidate.toolCallId),
        isError,
        messageId: boundedIdentifier(candidate.messageId ?? message?.id),
        stopReason: boundedCode(candidate.stopReason ?? message?.stopReason),
      },
      modelVersion:
        boundedVersion(candidate.modelVersion) ??
        boundedVersion(model?.id) ??
        boundedVersion(messageModel?.id) ??
        boundedVersion(message?.model),
      errorCode: applicationErrorCode ?? (isError ? "pi_event_error" : null),
      retryCount,
      tokens: normalizedUsage(candidate),
      costUsd: normalizedCost(candidate),
    };
  } catch {
    return {
      data: {
        eventType: "pi.lifecycle",
        sourceType: "unknown",
        toolName: null,
        toolCallId: null,
        isError: null,
        messageId: null,
        stopReason: null,
      },
      modelVersion: null,
      errorCode: null,
      retryCount: 0,
      tokens: null,
      costUsd: null,
    };
  }
}

function parseBoundedInteger(raw: unknown, fallback: number, maximum: number): number | undefined {
  if (raw === undefined) return fallback;
  if (typeof raw !== "string" || !/^[1-9][0-9]*$/.test(raw)) return undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value <= maximum ? value : undefined;
}

export function resolveRunBounds(environment: unknown): RunBounds {
  let deadlineRaw: unknown;
  let stepsRaw: unknown;
  try {
    const candidate = record(environment);
    if (!candidate) throw new Error("invalid");
    deadlineRaw = candidate.RUN_DEADLINE_MS;
    stepsRaw = candidate.RUN_MAX_STEPS;
  } catch {
    throw new Error("Run bounds are invalid.");
  }
  const deadlineMs = parseBoundedInteger(deadlineRaw, DEFAULT_RUN_DEADLINE_MS, MAX_RUN_DEADLINE_MS);
  const maxSteps = parseBoundedInteger(stepsRaw, DEFAULT_RUN_MAX_STEPS, MAX_RUN_STEPS);
  const bounds = { deadlineMs, maxSteps };
  if (!boundsValidator.Check(bounds)) throw new Error("Run bounds are invalid.");
  return Object.freeze(bounds as RunBounds);
}

export function runStepForEvent(event: unknown): boolean {
  try {
    const candidate = record(event);
    return typeof candidate?.type === "string" && consumingSourceTypes.has(candidate.type);
  } catch {
    return false;
  }
}

export function shouldPersistPiLifecycleEvent(event: unknown): boolean {
  try {
    const candidate = record(event);
    return typeof candidate?.type === "string" && persistedPiSourceTypes.has(candidate.type);
  } catch {
    return false;
  }
}

export function isRunLifecycleOutcome(value: unknown): value is RunLifecycleOutcome {
  try {
    if (!lifecycleOutcomeValidator.Check(value)) return false;
    const outcome = value as RunLifecycleOutcome;
    return outcome.ok || !outcome.storageFailure || outcome.stopReason === "dependency_failed";
  } catch {
    return false;
  }
}

function safeDuration(now: () => number, startedAt: number): number {
  try {
    const current = now();
    if (!Number.isFinite(current)) return 0;
    return Math.max(0, Math.min(86_400_000, Math.trunc(current - startedAt)));
  } catch {
    return 0;
  }
}

function completedMetadata(
  stopReason: CompletedRunStopReason,
  stepCount: number,
  durationMs: number,
) {
  return {
    action: "run_complete" as const,
    result:
      stopReason === "approval_pending"
        ? ("pending" as const)
        : stopReason === "completed"
          ? ("succeeded" as const)
          : ("stopped" as const),
    stopReason,
    approvalState: stopReason === "approval_pending" ? ("pending" as const) : null,
    durationMs,
    stepNumber: stepCount > 0 ? stepCount : null,
  };
}

function stoppedMetadata(stopReason: BoundedRunStopReason, stepCount: number, durationMs: number) {
  return {
    action: "run_stop" as const,
    result: "stopped" as const,
    errorCode: stopReason,
    stopReason,
    durationMs,
    stepNumber: stepCount > 0 ? stepCount : null,
  };
}

function outcomeEqualsInput(outcome: unknown, input: unknown): boolean {
  return isMatchingRunEventAppendOutcome(outcome, input);
}

export function executeBoundedRun<S extends BoundedRunSession, T>(
  options: ExecuteBoundedRunOptions<S, T>,
): Promise<RunLifecycleOutcome<T>> {
  if (
    !isRunId(options.runId) ||
    typeof options.prompt !== "string" ||
    options.prompt.length === 0 ||
    options.prompt.length > 20_000 ||
    !boundsValidator.Check(options.bounds) ||
    typeof options.createSession !== "function" ||
    typeof options.complete !== "function" ||
    typeof options.eventStore?.append !== "function"
  ) {
    throw new Error("Run lifecycle input is invalid.");
  }

  const timer = options.timer ?? systemTimer;
  const now = () => timer.now();
  if (
    typeof timer.now !== "function" ||
    typeof timer.schedule !== "function" ||
    typeof timer.cancel !== "function"
  ) {
    throw new Error("Run lifecycle input is invalid.");
  }

  let startedAt: number;
  try {
    startedAt = now();
    if (!Number.isFinite(startedAt)) throw new Error("invalid clock");
  } catch {
    throw new Error("Run lifecycle input is invalid.");
  }

  let resolveOutcome!: (outcome: RunLifecycleOutcome<T>) => void;
  const outcomePromise = new Promise<RunLifecycleOutcome<T>>((resolve) => {
    resolveOutcome = resolve;
  });
  let decided = false;
  let session: S | undefined;
  let unsubscribe: (() => void) | undefined;
  let timerHandle: unknown;
  let timerScheduled = false;
  let abortRequired = false;
  let abortInvoked = false;
  let disposed = false;
  let stepCount = 0;
  const openTools = new Map<string, OpenToolCall>();
  const seenToolCalls = new Set<string>();

  const append = (input: unknown): boolean => {
    try {
      return outcomeEqualsInput(options.eventStore.append(input), input);
    } catch {
      return false;
    }
  };

  const disposeSession = (): void => {
    if (!session || disposed) return;
    disposed = true;
    try {
      session.dispose();
    } catch {
      // Disposal is best effort after the application has closed evidence.
    }
  };

  const invokeAbort = (): void => {
    abortRequired = true;
    if (!session || abortInvoked) return;
    abortInvoked = true;
    try {
      void Promise.resolve(session.abort()).catch(() => undefined);
    } catch {
      // The first application terminal decision remains authoritative.
    }
  };

  const cleanup = (): void => {
    if (timerScheduled) {
      try {
        timer.cancel(timerHandle);
      } catch {
        // Cleanup failure cannot create a second terminal decision.
      }
      timerScheduled = false;
    }
    if (unsubscribe) {
      const release = unsubscribe;
      unsubscribe = undefined;
      try {
        release();
      } catch {
        // Listener removal is best effort after the winner is fixed.
      }
    }
  };

  const appendSyntheticToolOutcomes = (stopReason: BoundedRunStopReason): boolean => {
    let complete = true;
    for (const open of openTools.values()) {
      const durationMs = safeDuration(now, open.startedAt);
      complete =
        append({
          runId: options.runId,
          type: "pi.lifecycle",
          data: {
            eventType: "pi.lifecycle",
            sourceType: "tool_execution_end",
            toolName: open.toolName,
            toolCallId: open.toolCallId,
            isError: true,
            messageId: null,
            stopReason,
          },
          metadata: {
            actor: { kind: "tool", id: null },
            action: "pi_tool_stopped",
            tool: { name: open.toolName, callId: open.toolCallId },
            result: "failed",
            errorCode: stopReason,
            stopReason,
            durationMs,
            stepNumber: open.stepNumber,
          },
        }) && complete;
    }
    openTools.clear();
    return complete;
  };

  const finishStopped = (
    stopReason: BoundedRunStopReason,
    evidenceStorageFailure = false,
  ): boolean => {
    if (decided) return false;
    decided = true;
    cleanup();
    invokeAbort();
    let stored = appendSyntheticToolOutcomes(stopReason);
    const durationMs = safeDuration(now, startedAt);
    stored =
      append({
        runId: options.runId,
        type: "run.stopped",
        data: { eventType: "run.stopped", stopReason },
        metadata: stoppedMetadata(stopReason, stepCount, durationMs),
      }) && stored;
    disposeSession();
    const outcome: RunLifecycleOutcome<T> =
      stored && !evidenceStorageFailure
        ? {
            ok: false,
            stopReason,
            storageFailure: false,
            stepCount,
            durationMs,
          }
        : {
            ok: false,
            stopReason: "dependency_failed",
            storageFailure: true,
            stepCount,
            durationMs,
          };
    resolveOutcome(deepFreeze(outcome));
    return true;
  };

  const finishCompleted = (completion: RunCompletion<T>): void => {
    if (decided) return;
    if (!completedStopValidator.Check(completion.stopReason)) {
      finishStopped("dependency_failed");
      return;
    }
    const value = cloneAndFreeze(completion.value);
    if (value === undefined) {
      finishStopped("dependency_failed");
      return;
    }
    if (openTools.size > 0) {
      finishStopped("dependency_failed");
      return;
    }
    decided = true;
    cleanup();
    const durationMs = safeDuration(now, startedAt);
    const input = {
      runId: options.runId,
      type: "run.completed",
      data: { eventType: "run.completed", stopReason: completion.stopReason },
      metadata: completedMetadata(completion.stopReason, stepCount, durationMs),
    };
    if (!append(input)) {
      invokeAbort();
      disposeSession();
      resolveOutcome(
        deepFreeze({
          ok: false,
          stopReason: "dependency_failed",
          storageFailure: true,
          stepCount,
          durationMs,
        }),
      );
      return;
    }
    disposeSession();
    resolveOutcome(
      deepFreeze({
        ok: true,
        value,
        stopReason: completion.stopReason,
        stepCount,
        durationMs,
      }),
    );
  };

  const recordPiEvent = (event: unknown): void => {
    if (decided) return;
    if (!shouldPersistPiLifecycleEvent(event)) return;
    const normalized = normalizePiLifecycleEvent(event);
    const consumesStep = runStepForEvent(event);
    if (consumesStep) stepCount += 1;
    const data = normalized.data;
    let toolStep: number | null = null;
    let durationMs: number | null = null;

    if (data.sourceType === "tool_execution_start") {
      if (!data.toolName || !data.toolCallId || seenToolCalls.has(data.toolCallId)) {
        finishStopped("dependency_failed");
        return;
      }
      toolStep = stepCount;
      seenToolCalls.add(data.toolCallId);
      let toolStartedAt = startedAt;
      try {
        const current = now();
        if (Number.isFinite(current)) toolStartedAt = current;
      } catch {
        // Duration will conservatively clamp to zero if the clock later fails.
      }
      openTools.set(data.toolCallId, {
        toolName: data.toolName,
        toolCallId: data.toolCallId,
        stepNumber: stepCount,
        startedAt: toolStartedAt,
      });
    } else if (data.sourceType === "tool_execution_end") {
      const open = data.toolCallId ? openTools.get(data.toolCallId) : undefined;
      if (!open || open.toolName !== data.toolName || data.isError === null) {
        finishStopped("dependency_failed");
        return;
      }
      toolStep = open.stepNumber;
      durationMs = safeDuration(now, open.startedAt);
    }

    const result =
      data.sourceType === "tool_execution_start"
        ? ("attempted" as const)
        : data.isError === null
          ? null
          : data.isError
            ? ("failed" as const)
            : ("succeeded" as const);
    const appended = append({
      runId: options.runId,
      type: data.eventType,
      data,
      metadata: {
        actor: { kind: data.toolName ? "tool" : "model", id: null },
        action:
          data.sourceType === "tool_execution_start"
            ? "pi_tool_attempt"
            : data.sourceType === "tool_execution_end"
              ? "pi_tool_outcome"
              : "pi_lifecycle",
        tool: data.toolName ? { name: data.toolName, callId: data.toolCallId } : null,
        result,
        errorCode: normalized.errorCode,
        stopReason: data.stopReason,
        modelVersion: normalized.modelVersion,
        durationMs,
        stepNumber: toolStep ?? (stepCount > 0 ? stepCount : null),
        retryCount: normalized.retryCount,
        tokens: normalized.tokens,
        costUsd: normalized.costUsd,
      },
    });
    if (!appended) {
      finishStopped("dependency_failed", true);
      return;
    }
    if (data.sourceType === "tool_execution_end" && data.toolCallId) {
      openTools.delete(data.toolCallId);
    }
    if (stepCount >= options.bounds.maxSteps) finishStopped("step_limit_exceeded");
  };

  try {
    timerScheduled = true;
    const scheduledHandle = timer.schedule(() => {
      finishStopped("deadline_exceeded");
    }, options.bounds.deadlineMs);
    timerHandle = scheduledHandle;
    if (decided) {
      try {
        timer.cancel(scheduledHandle);
      } catch {
        // A synchronously firing timer already fixed and cleaned the outcome.
      }
      timerScheduled = false;
    }
  } catch {
    timerScheduled = false;
    finishStopped("dependency_failed");
  }

  if (!decided) {
    void Promise.resolve()
      .then(() => options.createSession())
      .then(
        (created) => {
          session = created;
          if (decided) {
            if (abortRequired) invokeAbort();
            disposeSession();
            return;
          }
          try {
            unsubscribe = session.subscribe(recordPiEvent);
          } catch {
            finishStopped("dependency_failed");
            return;
          }
          void Promise.resolve()
            .then(() => session?.prompt(options.prompt))
            .then(
              async () => {
                if (decided || !session) return;
                try {
                  const completion = await options.complete(session);
                  finishCompleted(completion);
                } catch {
                  finishStopped("dependency_failed");
                }
              },
              () => finishStopped("dependency_failed"),
            );
        },
        () => finishStopped("dependency_failed"),
      );
  }

  return outcomePromise;
}
