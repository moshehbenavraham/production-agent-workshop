import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import type { AgentEvent } from "./event-store.js";
import {
  FAKE_SEND_TIMEOUT_MS,
  isFakeSendAdapterOutcome,
  isFakeSendAuthorizationOutcome,
  isFakeSendRequest,
  makeFakeSendFailure,
  type FakeSendAdapter,
  type FakeSendAdapterOutcome,
  type FakeSendAuthorizationOutcome,
  type FakeSendCommand,
  type FakeSendFailure,
} from "./fake-send.js";
import {
  hasSameFakeSendIdentity,
  isFakeSendEventData,
  isFakeSendReservation,
  isFakeSendResult,
  isFakeSendResultStoreClaimOutcome,
  isFakeSendResultStoreCompleteOutcome,
  type FakeSendEventData,
  type FakeSendReservation,
  type FakeSendResult,
  type FakeSendResultStore,
  type FakeSendResultStoreClaimOutcome,
  type FakeSendResultStoreCompleteOutcome,
} from "./fake-send-result.js";
import {
  fakeSendTerminalEventData,
  freezeFakeSendReservation,
  freezeFakeSendResult,
  makeFakeSendExecutionResultOutcome,
  type FakeSendExecutionOutcome,
} from "./fake-send-execution.js";

export type FakeSendAuthorizationBoundary = {
  authorize(input: unknown): unknown;
};

export type FakeSendEventStore = {
  append(input: Omit<AgentEvent, "eventId" | "at">): unknown;
  readRun(runId: string): unknown;
};

export type FakeSendServiceOptions = {
  timeoutMs?: number;
  makeReservationId?: () => string;
  makeResultId?: () => string;
  nowMs?: () => number;
};

type ValueOutcome<T> = { ok: true; value: T } | { ok: false; error: FakeSendFailure };
type AdapterRace = { kind: "outcome"; value: FakeSendAdapterOutcome } | { kind: "timeout" };

function storageFailureOutcome(): FakeSendExecutionOutcome {
  return { ok: false, kind: "failure", error: makeFakeSendFailure("storage_failure") };
}

function isAgentEvent(value: unknown, runId: string): value is AgentEvent {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
    const candidate = value as Record<string, unknown>;
    if (
      Object.keys(candidate).length !== 5 ||
      typeof candidate.eventId !== "string" ||
      candidate.eventId.length === 0 ||
      candidate.runId !== runId ||
      typeof candidate.at !== "string" ||
      !Number.isFinite(Date.parse(candidate.at)) ||
      new Date(Date.parse(candidate.at)).toISOString() !== candidate.at ||
      typeof candidate.type !== "string" ||
      !isFakeSendEventData(candidate.data)
    ) {
      return false;
    }
    return candidate.type === candidate.data.eventType;
  } catch {
    return false;
  }
}

export class FakeSendService {
  private readonly timeoutMs: number;
  private readonly makeReservationId: () => string;
  private readonly makeResultId: () => string;
  private readonly nowMs: () => number;

  constructor(
    private readonly authorization: FakeSendAuthorizationBoundary,
    private readonly results: FakeSendResultStore,
    private readonly events: FakeSendEventStore,
    private readonly adapter: FakeSendAdapter,
    options: FakeSendServiceOptions = {},
  ) {
    this.timeoutMs = options.timeoutMs ?? FAKE_SEND_TIMEOUT_MS;
    if (
      !Number.isFinite(this.timeoutMs) ||
      !Number.isInteger(this.timeoutMs) ||
      this.timeoutMs <= 0 ||
      this.timeoutMs > 60_000
    ) {
      throw new Error("Fake-send timeout must be a positive finite integer up to 60000 ms.");
    }
    this.makeReservationId = options.makeReservationId ?? (() => `reservation_${randomUUID()}`);
    this.makeResultId = options.makeResultId ?? (() => `result_${randomUUID()}`);
    this.nowMs = options.nowMs ?? Date.now;
  }

  private time(): ValueOutcome<number> {
    try {
      const value = this.nowMs();
      if (!Number.isSafeInteger(value) || value < 0) {
        return { ok: false, error: makeFakeSendFailure("storage_failure") };
      }
      new Date(value).toISOString();
      return { ok: true, value };
    } catch {
      return { ok: false, error: makeFakeSendFailure("storage_failure") };
    }
  }

  private identifier(factory: () => string, pattern: RegExp): ValueOutcome<string> {
    try {
      const value = factory();
      return pattern.test(value)
        ? { ok: true, value }
        : { ok: false, error: makeFakeSendFailure("storage_failure") };
    } catch {
      return { ok: false, error: makeFakeSendFailure("storage_failure") };
    }
  }

  private appendEvent(runId: string, data: FakeSendEventData): boolean {
    try {
      if (!isFakeSendEventData(data)) return false;
      const immutableData = Object.freeze({ ...data }) as FakeSendEventData;
      const event = this.events.append({
        runId,
        type: immutableData.eventType,
        data: immutableData,
      });
      return isAgentEvent(event, runId) && isDeepStrictEqual(event.data, immutableData);
    } catch {
      return false;
    }
  }

  private readEvents(runId: string): AgentEvent[] | undefined {
    try {
      const events = this.events.readRun(runId);
      return Array.isArray(events) && events.every((event) => isAgentEvent(event, runId))
        ? events
        : undefined;
    } catch {
      return undefined;
    }
  }

  private recordStorageFailure(command?: FakeSendCommand): void {
    if (!command) return;
    this.appendEvent(command.runId, {
      eventType: "fake_send.storage_failed",
      approvalId: command.approvalId,
      idempotencyKey: command.idempotencyKey,
      code: "storage_failure",
    });
  }

  private ensureTerminalEvent(result: FakeSendResult): boolean {
    const events = this.readEvents(result.runId);
    if (!events) return false;
    const expected = fakeSendTerminalEventData(result);
    const terminalTypes = new Set([
      "fake_send.accepted",
      "fake_send.rejected",
      "fake_send.timed_out",
      "fake_send.downstream_failed",
    ]);
    const correlated = events.filter(
      (event) =>
        terminalTypes.has(event.type) &&
        "approvalId" in event.data &&
        event.data.approvalId === result.approvalId &&
        "idempotencyKey" in event.data &&
        event.data.idempotencyKey === result.idempotencyKey,
    );
    if (
      correlated.length > 1 ||
      correlated.some((event) => !isDeepStrictEqual(event.data, expected))
    ) {
      return false;
    }
    return correlated.length === 1 || this.appendEvent(result.runId, expected);
  }

  private claim(reservation: FakeSendReservation): FakeSendResultStoreClaimOutcome | undefined {
    try {
      const outcome: unknown = this.results.claim(reservation);
      return isFakeSendResultStoreClaimOutcome(outcome) ? outcome : undefined;
    } catch {
      return undefined;
    }
  }

  private complete(result: FakeSendResult): FakeSendResultStoreCompleteOutcome | undefined {
    try {
      const outcome: unknown = this.results.complete(result);
      return isFakeSendResultStoreCompleteOutcome(outcome) ? outcome : undefined;
    } catch {
      return undefined;
    }
  }

  private async boundedAdapter(command: FakeSendCommand): Promise<AdapterRace> {
    const controller = new AbortController();
    let timer: NodeJS.Timeout | undefined;
    const execution = Promise.resolve()
      .then(() => this.adapter.execute(command, controller.signal))
      .then(
        (outcome: unknown): AdapterRace =>
          isFakeSendAdapterOutcome(outcome)
            ? { kind: "outcome", value: outcome }
            : {
                kind: "outcome",
                value: {
                  ok: false,
                  status: "downstream_failure",
                  error: makeFakeSendFailure("downstream_failure"),
                },
              },
      )
      .catch(
        (): AdapterRace => ({
          kind: "outcome",
          value: {
            ok: false,
            status: "downstream_failure",
            error: makeFakeSendFailure("downstream_failure"),
          },
        }),
      );
    const timeout = new Promise<AdapterRace>((resolve) => {
      timer = setTimeout(() => {
        controller.abort();
        resolve({ kind: "timeout" });
      }, this.timeoutMs);
    });
    try {
      return await Promise.race([execution, timeout]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private result(
    command: FakeSendCommand,
    reservation: FakeSendReservation,
    resultId: string,
    completedMs: number,
    race: AdapterRace,
  ): FakeSendResult | undefined {
    const durationMs = completedMs - Date.parse(reservation.reservedAt);
    if (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > 60_000) return undefined;
    const common = {
      resultId,
      idempotencyKey: command.idempotencyKey,
      approvalId: command.approvalId,
      runId: command.runId,
      action: command.action,
      target: { ...command.target },
      draftId: command.draft.draftId,
      draftSha256: command.draft.sha256,
      startedAt: reservation.reservedAt,
      completedAt: new Date(completedMs).toISOString(),
      durationMs,
      compensation: { supported: false as const, code: "manual_review_required" as const },
    };

    let result: FakeSendResult;
    if (race.kind === "timeout") {
      result = {
        ...common,
        status: "timed_out",
        error: makeFakeSendFailure("timed_out"),
      };
    } else if (!race.value.ok) {
      result = {
        ...common,
        status: race.value.status,
        error: makeFakeSendFailure(race.value.status),
      };
    } else {
      const acceptedAt = Date.parse(race.value.acceptedAt);
      if (acceptedAt < Date.parse(reservation.reservedAt) || acceptedAt > completedMs) {
        result = {
          ...common,
          status: "downstream_failure",
          error: makeFakeSendFailure("downstream_failure"),
        };
      } else {
        result = {
          ...common,
          status: "accepted",
          receiptId: race.value.receiptId,
        };
      }
    }
    return isFakeSendResult(result) ? result : undefined;
  }

  async execute(input: unknown): Promise<FakeSendExecutionOutcome> {
    let authorization: FakeSendAuthorizationOutcome;
    try {
      const candidate = this.authorization.authorize(input);
      if (!isFakeSendAuthorizationOutcome(candidate)) return storageFailureOutcome();
      authorization = candidate;
    } catch {
      return storageFailureOutcome();
    }

    if (!authorization.ok) {
      if (authorization.error.code === "permission_denied") {
        try {
          if (
            !isFakeSendRequest(input) ||
            !this.appendEvent(input.runId, {
              eventType: "fake_send.permission_denied",
              approvalId: input.approvalId,
              code: "permission_denied",
            })
          ) {
            return storageFailureOutcome();
          }
        } catch {
          return storageFailureOutcome();
        }
      }
      return { ok: false, kind: "failure", error: authorization.error };
    }

    const command = authorization.value;
    const started = this.time();
    const reservationId = this.identifier(this.makeReservationId, /^reservation_[a-z0-9_-]{4,88}$/);
    if (!started.ok || !reservationId.ok) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }
    const reservationCandidate: FakeSendReservation = {
      reservationId: reservationId.value,
      idempotencyKey: command.idempotencyKey,
      approvalId: command.approvalId,
      runId: command.runId,
      action: command.action,
      target: { ...command.target },
      draftId: command.draft.draftId,
      draftSha256: command.draft.sha256,
      reservedAt: new Date(started.value).toISOString(),
    };
    if (!isFakeSendReservation(reservationCandidate)) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }
    const reservation = freezeFakeSendReservation(reservationCandidate);

    const claim = this.claim(reservation);
    if (!claim) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }
    if (!claim.ok) {
      if (claim.kind === "failure") {
        this.recordStorageFailure(command);
        return { ok: false, kind: "failure", error: claim.error };
      }
      if (!hasSameFakeSendIdentity(claim.value.reservation, reservation)) {
        this.recordStorageFailure(command);
        return storageFailureOutcome();
      }
      const finished = this.time();
      if (!finished.ok) {
        this.recordStorageFailure(command);
        return storageFailureOutcome();
      }
      const durationMs = finished.value - started.value;
      if (!Number.isInteger(durationMs) || durationMs < 0 || durationMs > 60_000) {
        this.recordStorageFailure(command);
        return storageFailureOutcome();
      }
      const originalStatus =
        claim.value.state === "completed" ? claim.value.result.status : "execution_in_progress";
      if (
        (claim.value.state === "completed" && !this.ensureTerminalEvent(claim.value.result)) ||
        !this.appendEvent(command.runId, {
          eventType: "fake_send.duplicate",
          approvalId: command.approvalId,
          idempotencyKey: command.idempotencyKey,
          durationMs,
          outcome: "duplicate",
          originalStatus,
        })
      ) {
        this.recordStorageFailure(command);
        return storageFailureOutcome();
      }
      return claim.value.state === "completed"
        ? makeFakeSendExecutionResultOutcome("duplicate", claim.value.result)
        : {
            ok: false,
            kind: "in_progress",
            error: makeFakeSendFailure("execution_in_progress"),
          };
    }

    if (!isDeepStrictEqual(claim.value, reservation)) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }
    if (
      !this.appendEvent(command.runId, {
        eventType: "fake_send.attempted",
        approvalId: command.approvalId,
        idempotencyKey: command.idempotencyKey,
      })
    ) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }

    const race = await this.boundedAdapter(command);
    const completed = this.time();
    const resultId = this.identifier(this.makeResultId, /^result_[a-z0-9_-]{5,93}$/);
    if (!completed.ok || !resultId.ok) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }
    const resultCandidate = this.result(
      command,
      reservation,
      resultId.value,
      completed.value,
      race,
    );
    if (!resultCandidate) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }
    const result = freezeFakeSendResult(resultCandidate);

    const completion = this.complete(result);
    if (
      !completion?.ok ||
      !isDeepStrictEqual(completion.value.reservation, reservation) ||
      !isDeepStrictEqual(completion.value.result, result)
    ) {
      this.recordStorageFailure(command);
      return completion && !completion.ok
        ? { ok: false, kind: "failure", error: completion.error }
        : storageFailureOutcome();
    }
    if (!this.appendEvent(command.runId, fakeSendTerminalEventData(result))) {
      this.recordStorageFailure(command);
      return storageFailureOutcome();
    }
    return makeFakeSendExecutionResultOutcome("executed", result);
  }
}
