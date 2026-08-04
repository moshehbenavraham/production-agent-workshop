import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, writeFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  isApprovalRecord,
  isApprovalStorageRecord,
  makeApprovalFailure,
  transitionApproval,
  type ApprovalFailure,
  type ApprovalRecord,
  type ApprovalStore,
  type ApprovalStoreListOutcome,
  type ApprovalStoreReadOutcome,
  type ApprovalStoreWriteOutcome,
  type ApprovalStorageRecord,
  type PendingApproval,
  type TerminalApproval,
} from "./approval.js";

export type ApprovalRecordsLoadOutcome =
  | { ok: true; value: ApprovalStorageRecord[] }
  | { ok: false; error: ApprovalFailure };

export type ApprovalStoreReadText = (path: string) => string;
export type ApprovalStoreWriteRecord = (path: string, serializedRecord: string) => void;

export type ApprovalRecordWriteOutcome = { ok: true } | { ok: false; error: ApprovalFailure };

function defaultReadText(path: string): string {
  return readFileSync(path, "utf8");
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "ENOENT"
  );
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

export function loadApprovalRecords(
  path: string,
  readText: ApprovalStoreReadText = defaultReadText,
): ApprovalRecordsLoadOutcome {
  let text: unknown;
  try {
    text = readText(path);
  } catch (error) {
    if (isMissingFileError(error)) {
      return { ok: true, value: [] };
    }
    return { ok: false, error: makeApprovalFailure("storage_failure") };
  }

  if (typeof text !== "string") {
    return { ok: false, error: makeApprovalFailure("storage_failure") };
  }

  if (text.length === 0) return { ok: true, value: [] };
  if (!text.endsWith("\n")) {
    return { ok: false, error: makeApprovalFailure("interrupted_write") };
  }

  const records: ApprovalStorageRecord[] = [];
  for (const line of text.slice(0, -1).split("\n")) {
    if (line.length === 0) {
      return { ok: false, error: makeApprovalFailure("corrupt_record") };
    }
    let candidate: unknown;
    try {
      candidate = JSON.parse(line);
    } catch {
      return { ok: false, error: makeApprovalFailure("corrupt_record") };
    }
    if (!isApprovalStorageRecord(candidate)) {
      return { ok: false, error: makeApprovalFailure("corrupt_record") };
    }
    records.push(candidate);
  }
  return { ok: true, value: records };
}

function requestFingerprint(approval: ApprovalRecord): string {
  return [
    approval.runId,
    approval.action,
    approval.target.kind,
    approval.target.leadId,
    approval.draft.draftId,
    approval.draft.sha256,
  ].join(":");
}

export function projectApprovalRecords(input: unknown): ApprovalStoreListOutcome {
  if (!Array.isArray(input)) {
    return { ok: false, error: makeApprovalFailure("corrupt_record") };
  }

  const approvals = new Map<string, ApprovalRecord>();
  const requestFingerprints = new Set<string>();
  const recordIds = new Set<string>();
  let lastRecordedAt = Number.NEGATIVE_INFINITY;

  for (const candidate of input) {
    if (!isApprovalStorageRecord(candidate)) {
      return { ok: false, error: makeApprovalFailure("corrupt_record") };
    }
    if (recordIds.has(candidate.recordId)) {
      return { ok: false, error: makeApprovalFailure("corrupt_record") };
    }
    recordIds.add(candidate.recordId);

    const recordedAt = Date.parse(candidate.recordedAt);
    if (recordedAt < lastRecordedAt) {
      return { ok: false, error: makeApprovalFailure("out_of_order_record") };
    }
    lastRecordedAt = recordedAt;

    if (candidate.type === "approval.requested") {
      const fingerprint = requestFingerprint(candidate.approval);
      if (approvals.has(candidate.approval.approvalId) || requestFingerprints.has(fingerprint)) {
        return { ok: false, error: makeApprovalFailure("duplicate_request") };
      }
      approvals.set(candidate.approval.approvalId, candidate.approval);
      requestFingerprints.add(fingerprint);
      continue;
    }

    const current = approvals.get(candidate.approvalId);
    if (!current || current.status !== "pending" || current.runId !== candidate.runId) {
      return { ok: false, error: makeApprovalFailure("out_of_order_record") };
    }
    const transition = transitionApproval(
      current,
      {
        approvalId: candidate.approvalId,
        runId: candidate.runId,
        actorId: candidate.decision.actorId,
        decision: candidate.decision.decision,
      },
      new Set([candidate.decision.actorId]),
      candidate.decision.decidedAt,
    );
    if (!transition.ok) {
      return { ok: false, error: makeApprovalFailure("out_of_order_record") };
    }
    approvals.set(candidate.approvalId, transition.value);
  }

  return { ok: true, value: [...approvals.values()] };
}

export function writeApprovalRecord(
  path: string,
  record: unknown,
  writeRecord: ApprovalStoreWriteRecord = defaultWriteRecord,
): ApprovalRecordWriteOutcome {
  if (!isApprovalStorageRecord(record)) {
    return { ok: false, error: makeApprovalFailure("corrupt_record") };
  }
  try {
    writeRecord(path, `${JSON.stringify(record)}\n`);
    return { ok: true };
  } catch {
    return { ok: false, error: makeApprovalFailure("storage_failure") };
  }
}

export type FileApprovalStoreOptions = {
  readText?: ApprovalStoreReadText;
  writeRecord?: ApprovalStoreWriteRecord;
  makeRecordId?: () => string;
  now?: () => string;
};

type ApprovalStorageMetadataOutcome =
  | { ok: true; recordId: string; recordedAt: string }
  | { ok: false; error: ApprovalFailure };

export class FileApprovalStore implements ApprovalStore {
  private readonly readText: ApprovalStoreReadText;
  private readonly writeRecord: ApprovalStoreWriteRecord;
  private readonly makeRecordId: () => string;
  private readonly now: () => string;

  constructor(
    private readonly path: string,
    options: FileApprovalStoreOptions = {},
  ) {
    this.readText = options.readText ?? defaultReadText;
    this.writeRecord = options.writeRecord ?? defaultWriteRecord;
    this.makeRecordId = options.makeRecordId ?? (() => `record_${randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  private readProjection(): ApprovalStoreListOutcome {
    const loaded = loadApprovalRecords(this.path, this.readText);
    return loaded.ok ? projectApprovalRecords(loaded.value) : loaded;
  }

  private makeStorageMetadata(): ApprovalStorageMetadataOutcome {
    try {
      return { ok: true, recordId: this.makeRecordId(), recordedAt: this.now() };
    } catch {
      return { ok: false, error: makeApprovalFailure("storage_failure") };
    }
  }

  get(approvalId: string): ApprovalStoreReadOutcome {
    const projection = this.readProjection();
    if (!projection.ok) return projection;
    return {
      ok: true,
      value: projection.value.find((approval) => approval.approvalId === approvalId) ?? null,
    };
  }

  listRun(runId: string): ApprovalStoreListOutcome {
    const projection = this.readProjection();
    if (!projection.ok) return projection;
    return {
      ok: true,
      value: projection.value.filter((approval) => approval.runId === runId),
    };
  }

  appendRequest(approval: PendingApproval): ApprovalStoreWriteOutcome {
    if (!isApprovalRecord(approval) || approval.status !== "pending") {
      return { ok: false, error: makeApprovalFailure("invalid_approval_record") };
    }

    const before = this.readProjection();
    if (!before.ok) return before;
    const duplicate = before.value.some(
      (current) =>
        current.approvalId === approval.approvalId ||
        requestFingerprint(current) === requestFingerprint(approval),
    );
    if (duplicate) {
      return { ok: false, error: makeApprovalFailure("duplicate_request") };
    }

    const metadata = this.makeStorageMetadata();
    if (!metadata.ok) return metadata;

    const write = writeApprovalRecord(
      this.path,
      {
        recordId: metadata.recordId,
        recordedAt: metadata.recordedAt,
        type: "approval.requested",
        approval,
      },
      this.writeRecord,
    );
    if (!write.ok) return write;

    const after = this.readProjection();
    if (!after.ok) return after;
    const persisted = after.value.find((candidate) => candidate.approvalId === approval.approvalId);
    return persisted && isDeepStrictEqual(persisted, approval)
      ? { ok: true, value: persisted }
      : { ok: false, error: makeApprovalFailure("storage_failure") };
  }

  appendDecision(approval: TerminalApproval): ApprovalStoreWriteOutcome {
    if (!isApprovalRecord(approval) || (approval as ApprovalRecord).status === "pending") {
      return { ok: false, error: makeApprovalFailure("invalid_approval_record") };
    }

    const before = this.readProjection();
    if (!before.ok) return before;
    const current = before.value.find((candidate) => candidate.approvalId === approval.approvalId);
    if (!current) {
      return { ok: false, error: makeApprovalFailure("approval_not_found") };
    }
    if (current.status !== "pending") {
      return isDeepStrictEqual(current, approval)
        ? { ok: true, value: current }
        : { ok: false, error: makeApprovalFailure("approval_conflict") };
    }

    const expected = transitionApproval(
      current,
      {
        approvalId: approval.approvalId,
        runId: approval.runId,
        actorId: approval.decision.actorId,
        decision: approval.decision.decision,
      },
      new Set([approval.decision.actorId]),
      approval.decision.decidedAt,
    );
    if (!expected.ok || !isDeepStrictEqual(expected.value, approval)) {
      return { ok: false, error: makeApprovalFailure("approval_identity_mismatch") };
    }

    const metadata = this.makeStorageMetadata();
    if (!metadata.ok) return metadata;

    const write = writeApprovalRecord(
      this.path,
      {
        recordId: metadata.recordId,
        recordedAt: metadata.recordedAt,
        type: approval.status === "approved" ? "approval.approved" : "approval.declined",
        approvalId: approval.approvalId,
        runId: approval.runId,
        decision: approval.decision,
      },
      this.writeRecord,
    );
    if (!write.ok) return write;

    const after = this.readProjection();
    if (!after.ok) return after;
    const persisted = after.value.find((candidate) => candidate.approvalId === approval.approvalId);
    return persisted && isDeepStrictEqual(persisted, approval)
      ? { ok: true, value: persisted }
      : { ok: false, error: makeApprovalFailure("storage_failure") };
  }
}
