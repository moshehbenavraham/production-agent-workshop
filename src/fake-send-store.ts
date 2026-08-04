import { randomUUID } from "node:crypto";
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { makeFakeSendFailure, type FakeSendFailure } from "./fake-send.js";
import {
  hasSameFakeSendIdentity,
  isFakeSendReservation,
  isFakeSendResult,
  isFakeSendStorageRecord,
  isFakeSendStoreProjection,
  type FakeSendReservation,
  type FakeSendResult,
  type FakeSendResultStore,
  type FakeSendResultStoreClaimOutcome,
  type FakeSendResultStoreCompleteOutcome,
  type FakeSendResultStoreReadOutcome,
  type FakeSendStorageRecord,
  type FakeSendStoreProjection,
} from "./fake-send-result.js";

export type FakeSendRecordsLoadOutcome =
  | { ok: true; value: FakeSendStorageRecord[] }
  | { ok: false; error: FakeSendFailure };

export type FakeSendProjectionOutcome =
  | { ok: true; value: FakeSendStoreProjection[] }
  | { ok: false; error: FakeSendFailure };

export type FakeSendStoreReadText = (path: string) => string;
export type FakeSendStoreWriteRecord = (path: string, serializedRecord: string) => void;

type FakeSendRecordWriteOutcome = { ok: true } | { ok: false; error: FakeSendFailure };

function defaultReadText(path: string): string {
  return readFileSync(path, "utf8");
}

function isMissingFileError(error: unknown): boolean {
  try {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "ENOENT"
    );
  } catch {
    return false;
  }
}

function defaultWriteRecord(path: string, serializedRecord: string): void {
  mkdirSync(dirname(path), { recursive: true });
  const descriptor = openSync(path, "a", 0o600);
  try {
    writeFileSync(descriptor, serializedRecord, "utf8");
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

export function loadFakeSendRecords(
  path: string,
  readText: FakeSendStoreReadText = defaultReadText,
): FakeSendRecordsLoadOutcome {
  let text: unknown;
  try {
    text = readText(path);
  } catch (error) {
    return isMissingFileError(error)
      ? { ok: true, value: [] }
      : { ok: false, error: makeFakeSendFailure("storage_failure") };
  }

  if (typeof text !== "string") {
    return { ok: false, error: makeFakeSendFailure("storage_failure") };
  }
  if (text.length === 0) return { ok: true, value: [] };
  if (!text.endsWith("\n")) {
    return { ok: false, error: makeFakeSendFailure("interrupted_write") };
  }

  const records: FakeSendStorageRecord[] = [];
  for (const line of text.slice(0, -1).split("\n")) {
    if (line.length === 0) {
      return { ok: false, error: makeFakeSendFailure("corrupt_record") };
    }
    let candidate: unknown;
    try {
      candidate = JSON.parse(line);
      if (!isFakeSendStorageRecord(candidate)) {
        return { ok: false, error: makeFakeSendFailure("corrupt_record") };
      }
    } catch {
      return { ok: false, error: makeFakeSendFailure("corrupt_record") };
    }
    records.push(candidate);
  }
  return { ok: true, value: records };
}

export function projectFakeSendRecords(input: unknown): FakeSendProjectionOutcome {
  if (!Array.isArray(input)) {
    return { ok: false, error: makeFakeSendFailure("corrupt_record") };
  }

  const projections = new Map<string, FakeSendStoreProjection>();
  const recordIds = new Set<string>();
  let lastRecordedAt = Number.NEGATIVE_INFINITY;

  for (const raw of input) {
    let record: FakeSendStorageRecord;
    try {
      if (!isFakeSendStorageRecord(raw)) {
        return { ok: false, error: makeFakeSendFailure("corrupt_record") };
      }
      record = raw;
    } catch {
      return { ok: false, error: makeFakeSendFailure("corrupt_record") };
    }

    const recordedAt = Date.parse(record.recordedAt);
    if (recordIds.has(record.recordId) || recordedAt < lastRecordedAt) {
      return { ok: false, error: makeFakeSendFailure("out_of_order_record") };
    }
    recordIds.add(record.recordId);
    lastRecordedAt = recordedAt;

    if (record.type === "fake_send.reserved") {
      if (projections.has(record.reservation.idempotencyKey)) {
        return { ok: false, error: makeFakeSendFailure("result_conflict") };
      }
      projections.set(record.reservation.idempotencyKey, {
        state: "reserved",
        reservation: record.reservation,
      });
      continue;
    }

    const current = projections.get(record.result.idempotencyKey);
    if (!current) {
      return { ok: false, error: makeFakeSendFailure("out_of_order_record") };
    }
    if (current.state === "completed") {
      return { ok: false, error: makeFakeSendFailure("result_conflict") };
    }
    const completed: FakeSendStoreProjection = {
      state: "completed",
      reservation: current.reservation,
      result: record.result,
    };
    if (!isFakeSendStoreProjection(completed)) {
      return { ok: false, error: makeFakeSendFailure("result_conflict") };
    }
    projections.set(record.result.idempotencyKey, completed);
  }

  return { ok: true, value: [...projections.values()] };
}

export function writeFakeSendRecord(
  path: string,
  record: unknown,
  writeRecord: FakeSendStoreWriteRecord = defaultWriteRecord,
): FakeSendRecordWriteOutcome {
  try {
    if (!isFakeSendStorageRecord(record)) {
      return { ok: false, error: makeFakeSendFailure("corrupt_record") };
    }
    writeRecord(path, `${JSON.stringify(record)}\n`);
    return { ok: true };
  } catch {
    return { ok: false, error: makeFakeSendFailure("storage_failure") };
  }
}

export type FileFakeSendResultStoreOptions = {
  readText?: FakeSendStoreReadText;
  writeRecord?: FakeSendStoreWriteRecord;
  makeRecordId?: () => string;
  now?: () => string;
};

type StorageMetadataOutcome =
  | { ok: true; recordId: string; recordedAt: string }
  | { ok: false; error: FakeSendFailure };

export class FileFakeSendResultStore implements FakeSendResultStore {
  private readonly readText: FakeSendStoreReadText;
  private readonly writeRecord: FakeSendStoreWriteRecord;
  private readonly makeRecordId: () => string;
  private readonly now: () => string;

  constructor(
    private readonly path: string,
    options: FileFakeSendResultStoreOptions = {},
  ) {
    this.readText = options.readText ?? defaultReadText;
    this.writeRecord = options.writeRecord ?? defaultWriteRecord;
    this.makeRecordId = options.makeRecordId ?? (() => `record_${randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  private readProjection(): FakeSendProjectionOutcome {
    const loaded = loadFakeSendRecords(this.path, this.readText);
    return loaded.ok ? projectFakeSendRecords(loaded.value) : loaded;
  }

  private metadata(): StorageMetadataOutcome {
    try {
      const recordId = this.makeRecordId();
      const recordedAt = this.now();
      if (
        !/^record_[a-z0-9_-]{3,113}$/.test(recordId) ||
        !Number.isFinite(Date.parse(recordedAt)) ||
        new Date(Date.parse(recordedAt)).toISOString() !== recordedAt
      ) {
        return { ok: false, error: makeFakeSendFailure("storage_failure") };
      }
      return { ok: true, recordId, recordedAt };
    } catch {
      return { ok: false, error: makeFakeSendFailure("storage_failure") };
    }
  }

  get(idempotencyKey: string): FakeSendResultStoreReadOutcome {
    if (!/^[0-9a-f]{64}$/.test(idempotencyKey)) {
      return { ok: false, error: makeFakeSendFailure("storage_failure") };
    }
    const projection = this.readProjection();
    if (!projection.ok) return projection;
    return {
      ok: true,
      value:
        projection.value.find(
          (candidate) => candidate.reservation.idempotencyKey === idempotencyKey,
        ) ?? null,
    };
  }

  claim(reservation: FakeSendReservation): FakeSendResultStoreClaimOutcome {
    if (!isFakeSendReservation(reservation)) {
      return { ok: false, kind: "failure", error: makeFakeSendFailure("result_conflict") };
    }
    const before = this.readProjection();
    if (!before.ok) return { ok: false, kind: "failure", error: before.error };
    const current = before.value.find(
      (candidate) => candidate.reservation.idempotencyKey === reservation.idempotencyKey,
    );
    if (current) {
      if (!hasSameFakeSendIdentity(current.reservation, reservation)) {
        return { ok: false, kind: "failure", error: makeFakeSendFailure("result_conflict") };
      }
      return current.state === "completed"
        ? {
            ok: false,
            kind: "duplicate",
            value: current,
            error: makeFakeSendFailure("duplicate"),
          }
        : {
            ok: false,
            kind: "duplicate",
            value: current,
            error: makeFakeSendFailure("execution_in_progress"),
          };
    }

    const metadata = this.metadata();
    if (!metadata.ok) return { ok: false, kind: "failure", error: metadata.error };
    const record = {
      recordId: metadata.recordId,
      recordedAt: metadata.recordedAt,
      type: "fake_send.reserved" as const,
      reservation,
    };
    if (!isFakeSendStorageRecord(record)) {
      return { ok: false, kind: "failure", error: makeFakeSendFailure("storage_failure") };
    }
    const write = writeFakeSendRecord(this.path, record, this.writeRecord);
    if (!write.ok) return { ok: false, kind: "failure", error: write.error };

    const after = this.readProjection();
    if (!after.ok) return { ok: false, kind: "failure", error: after.error };
    const persisted = after.value.find(
      (candidate) => candidate.reservation.idempotencyKey === reservation.idempotencyKey,
    );
    return persisted?.state === "reserved" && isDeepStrictEqual(persisted.reservation, reservation)
      ? { ok: true, kind: "claimed", value: persisted.reservation }
      : { ok: false, kind: "failure", error: makeFakeSendFailure("storage_failure") };
  }

  complete(result: FakeSendResult): FakeSendResultStoreCompleteOutcome {
    if (!isFakeSendResult(result)) {
      return { ok: false, error: makeFakeSendFailure("result_conflict") };
    }
    const before = this.readProjection();
    if (!before.ok) return before;
    const current = before.value.find(
      (candidate) => candidate.reservation.idempotencyKey === result.idempotencyKey,
    );
    if (!current || !hasSameFakeSendIdentity(current.reservation, result)) {
      return { ok: false, error: makeFakeSendFailure("result_conflict") };
    }
    if (current.state === "completed") {
      return isDeepStrictEqual(current.result, result)
        ? { ok: true, value: current }
        : { ok: false, error: makeFakeSendFailure("result_conflict") };
    }

    const completed = { state: "completed" as const, reservation: current.reservation, result };
    if (!isFakeSendStoreProjection(completed)) {
      return { ok: false, error: makeFakeSendFailure("result_conflict") };
    }
    const metadata = this.metadata();
    if (!metadata.ok) return metadata;
    const record = {
      recordId: metadata.recordId,
      recordedAt: metadata.recordedAt,
      type: "fake_send.completed" as const,
      result,
    };
    if (!isFakeSendStorageRecord(record)) {
      return { ok: false, error: makeFakeSendFailure("storage_failure") };
    }
    const write = writeFakeSendRecord(this.path, record, this.writeRecord);
    if (!write.ok) return write;

    const after = this.readProjection();
    if (!after.ok) return after;
    const persisted = after.value.find(
      (candidate) => candidate.reservation.idempotencyKey === result.idempotencyKey,
    );
    return persisted?.state === "completed" && isDeepStrictEqual(persisted, completed)
      ? { ok: true, value: persisted }
      : { ok: false, error: makeFakeSendFailure("storage_failure") };
  }
}
