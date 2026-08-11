import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";
import {
  createPendingApproval,
  isApprovalDecisionInput,
  isApprovalEventData,
  isApprovalRequestInput,
  isApprovalStoreListOutcome,
  isApprovalStoreReadOutcome,
  isApprovalStoreWriteOutcome,
  makeApprovalFailure,
  transitionApproval,
  type ApprovalCreationOutcome,
  type ApprovalEventData,
  type ApprovalFailure,
  type ApprovalRecord,
  type ApprovalRequestInput,
  type ApprovalStore,
  type ApprovalStoreListOutcome,
  type ApprovalStoreReadOutcome,
  type ApprovalTransitionOutcome,
  type PendingApproval,
  type TerminalApproval,
} from "./approval.js";
import type { AgentEvent } from "./event-store.js";
import {
  isMatchingRunEventAppendOutcome,
  isRunEventReadOutcome,
  type RunEventStore,
} from "./run-event.js";

export type ApprovalEventStore = Pick<RunEventStore, "append" | "readRun">;

export type ApprovalServiceOptions = {
  authorizedActorIds?: ReadonlySet<string>;
  makeApprovalId?: () => string;
  now?: () => string;
};

export type ApprovalRequestServiceOptions = {
  draftId: string;
};

type EventReadOutcome = { ok: true; value: AgentEvent[] } | { ok: false; error: ApprovalFailure };

type EventPresenceOutcome = { ok: true; value: boolean } | { ok: false; error: ApprovalFailure };

type ValueOutcome<T> = { ok: true; value: T } | { ok: false; error: ApprovalFailure };

function runIdHint(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("runId" in value)) return undefined;
  return typeof value.runId === "string" &&
    value.runId.length >= 6 &&
    value.runId.length <= 80 &&
    /^(?:run_[a-z0-9_-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/.test(
      value.runId,
    )
    ? value.runId
    : undefined;
}

function approvalIdHint(value: unknown): string | undefined {
  if (typeof value !== "object" || value === null || !("approvalId" in value)) return undefined;
  return typeof value.approvalId === "string" &&
    value.approvalId.length >= 12 &&
    value.approvalId.length <= 100 &&
    /^approval_[a-z0-9_-]+$/.test(value.approvalId)
    ? value.approvalId
    : undefined;
}

function approvalEventMetadata(data: ApprovalEventData) {
  const actorId = "actorId" in data ? data.actorId : null;
  const approvalState = "status" in data ? data.status : null;
  const errorCode = "code" in data ? data.code : null;
  const result =
    data.eventType === "approval.requested"
      ? "pending"
      : data.eventType === "approval.decision_duplicate"
        ? "duplicate"
        : data.eventType === "approval.approved"
          ? "succeeded"
          : "failed";
  return {
    actor: actorId
      ? ({ kind: "human", id: actorId } as const)
      : ({ kind: "application", id: null } as const),
    action: data.eventType,
    result,
    errorCode,
    approvalState,
  };
}

function requestMatches(current: ApprovalRecord, candidate: PendingApproval): boolean {
  return (
    current.runId === candidate.runId &&
    current.action === candidate.action &&
    current.target.kind === candidate.target.kind &&
    current.target.leadId === candidate.target.leadId &&
    current.draft.draftId === candidate.draft.draftId &&
    current.draft.sha256 === candidate.draft.sha256 &&
    current.draft.content === candidate.draft.content
  );
}

function requestEvent(approval: ApprovalRecord): ApprovalEventData {
  return {
    eventType: "approval.requested",
    approvalId: approval.approvalId,
    action: approval.action,
    targetKind: approval.target.kind,
    leadId: approval.target.leadId,
    draftId: approval.draft.draftId,
    status: "pending",
  };
}

function terminalEvent(approval: TerminalApproval): ApprovalEventData {
  return approval.status === "approved"
    ? {
        eventType: "approval.approved",
        approvalId: approval.approvalId,
        actorId: approval.decision.actorId,
        status: "approved",
      }
    : {
        eventType: "approval.declined",
        approvalId: approval.approvalId,
        actorId: approval.decision.actorId,
        status: "declined",
      };
}

export class ApprovalService {
  private readonly authorizedActorIds: ReadonlySet<string>;
  private readonly makeApprovalId: () => string;
  private readonly now: () => string;

  constructor(
    private readonly approvals: ApprovalStore,
    private readonly events: ApprovalEventStore,
    options: ApprovalServiceOptions = {},
  ) {
    this.authorizedActorIds = options.authorizedActorIds ?? new Set<string>();
    this.makeApprovalId = options.makeApprovalId ?? (() => `approval_${randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
  }

  get(approvalId: string): ApprovalStoreReadOutcome {
    try {
      const outcome: unknown = this.approvals.get(approvalId);
      if (!isApprovalStoreReadOutcome(outcome)) {
        return { ok: false, error: makeApprovalFailure("storage_failure") };
      }
      return outcome.ok ? outcome : { ok: false, error: makeApprovalFailure(outcome.error.code) };
    } catch {
      return { ok: false, error: makeApprovalFailure("storage_failure") };
    }
  }

  listRun(runId: string): ApprovalStoreListOutcome {
    try {
      const outcome: unknown = this.approvals.listRun(runId);
      if (!isApprovalStoreListOutcome(outcome)) {
        return { ok: false, error: makeApprovalFailure("storage_failure") };
      }
      return outcome.ok ? outcome : { ok: false, error: makeApprovalFailure(outcome.error.code) };
    } catch {
      return { ok: false, error: makeApprovalFailure("storage_failure") };
    }
  }

  private appendEvent(runId: string, data: ApprovalEventData): boolean {
    if (!isApprovalEventData(data)) return false;
    try {
      const input = {
        runId,
        type: data.eventType,
        data,
        metadata: approvalEventMetadata(data),
      };
      const outcome: unknown = this.events.append(input);
      return isMatchingRunEventAppendOutcome(outcome, input);
    } catch {
      return false;
    }
  }

  private readEvents(runId: string): EventReadOutcome {
    try {
      const outcome: unknown = this.events.readRun(runId);
      return isRunEventReadOutcome(outcome) &&
        outcome.ok &&
        outcome.value.every((event) => event.runId === runId)
        ? { ok: true, value: outcome.value }
        : { ok: false, error: makeApprovalFailure("storage_failure") };
    } catch {
      return { ok: false, error: makeApprovalFailure("storage_failure") };
    }
  }

  private hasEvent(
    runId: string,
    approvalId: string,
    eventType: ApprovalEventData["eventType"],
  ): EventPresenceOutcome {
    const events = this.readEvents(runId);
    if (!events.ok) return events;
    return {
      ok: true,
      value: events.value.some(
        (event) =>
          event.type === eventType &&
          isApprovalEventData(event.data) &&
          event.data.eventType === eventType &&
          "approvalId" in event.data &&
          event.data.approvalId === approvalId,
      ),
    };
  }

  private requestCandidate(
    input: ApprovalRequestInput,
    draftId: string,
  ): ValueOutcome<PendingApproval> {
    try {
      const outcome = createPendingApproval(input, {
        approvalId: this.makeApprovalId(),
        draftId,
        now: this.now(),
      });
      return outcome.ok ? outcome : { ok: false, error: outcome.error };
    } catch {
      return { ok: false, error: makeApprovalFailure("storage_failure") };
    }
  }

  private decisionTime(): ValueOutcome<string> {
    try {
      return { ok: true, value: this.now() };
    } catch {
      return { ok: false, error: makeApprovalFailure("storage_failure") };
    }
  }

  private recordStorageFailure(
    runId: string | undefined,
    operation: "request" | "decision" | "read",
    approvalId?: string,
  ): ApprovalFailure {
    const error = makeApprovalFailure("storage_failure");
    if (runId) {
      this.appendEvent(runId, {
        eventType: "approval.storage_failed",
        ...(approvalId ? { approvalId } : {}),
        operation,
        code: error.code,
      });
    }
    return error;
  }

  private recordRequestFailure(
    runId: string | undefined,
    error: ApprovalFailure,
    approvalId?: string,
  ): ApprovalFailure {
    if (!runId) return error;
    const storageCodes = new Set([
      "corrupt_record",
      "out_of_order_record",
      "interrupted_write",
      "storage_failure",
    ]);
    const data: ApprovalEventData = storageCodes.has(error.code)
      ? {
          eventType: "approval.storage_failed",
          ...(approvalId ? { approvalId } : {}),
          operation: "request",
          code: error.code,
        }
      : {
          eventType: "approval.invalid",
          ...(approvalId ? { approvalId } : {}),
          operation: "request",
          code: error.code,
        };
    return this.appendEvent(runId, data) ? error : makeApprovalFailure("storage_failure");
  }

  private recordDecisionFailure(
    runId: string | undefined,
    error: ApprovalFailure,
    approvalId?: string,
  ): ApprovalFailure {
    if (!runId) return error;
    const storageCodes = new Set([
      "corrupt_record",
      "out_of_order_record",
      "interrupted_write",
      "storage_failure",
    ]);
    const data: ApprovalEventData = storageCodes.has(error.code)
      ? {
          eventType: "approval.storage_failed",
          ...(approvalId ? { approvalId } : {}),
          operation: "decision",
          code: error.code,
        }
      : {
          eventType: "approval.invalid",
          ...(approvalId ? { approvalId } : {}),
          operation: "decision",
          code: error.code,
        };
    return this.appendEvent(runId, data) ? error : makeApprovalFailure("storage_failure");
  }

  private ensureTerminalEvent(approval: TerminalApproval): ValueOutcome<true> {
    const expectedType = approval.status === "approved" ? "approval.approved" : "approval.declined";
    const event = this.hasEvent(approval.runId, approval.approvalId, expectedType);
    if (!event.ok) return event;
    if (!event.value && !this.appendEvent(approval.runId, terminalEvent(approval))) {
      return { ok: false, error: makeApprovalFailure("storage_failure") };
    }
    return { ok: true, value: true };
  }

  requestApproval(input: unknown, options: ApprovalRequestServiceOptions): ApprovalCreationOutcome {
    const hintedRunId = runIdHint(input);
    if (
      !isApprovalRequestInput(input) ||
      typeof options !== "object" ||
      options === null ||
      typeof options.draftId !== "string"
    ) {
      const error = this.recordRequestFailure(hintedRunId, makeApprovalFailure("invalid_request"));
      return { ok: false, error };
    }

    const candidate = this.requestCandidate(input, options.draftId);
    if (!candidate.ok) {
      const error =
        candidate.error.code === "storage_failure"
          ? this.recordStorageFailure(input.runId, "request")
          : this.recordRequestFailure(input.runId, candidate.error);
      return { ok: false, error };
    }

    const current = this.listRun(input.runId);
    if (!current.ok) {
      return {
        ok: false,
        error: this.recordRequestFailure(input.runId, current.error),
      };
    }
    const duplicate = current.value.find((approval) => requestMatches(approval, candidate.value));
    if (duplicate) {
      const event = this.hasEvent(input.runId, duplicate.approvalId, "approval.requested");
      if (!event.ok) {
        return {
          ok: false,
          error: this.recordStorageFailure(input.runId, "read", duplicate.approvalId),
        };
      }
      if (!event.value && !this.appendEvent(input.runId, requestEvent(duplicate))) {
        return {
          ok: false,
          error: this.recordStorageFailure(input.runId, "request", duplicate.approvalId),
        };
      }
      if (!event.value && duplicate.status === "pending") {
        return { ok: true, value: duplicate };
      }
      const error = this.recordRequestFailure(
        input.runId,
        makeApprovalFailure("duplicate_request"),
        duplicate.approvalId,
      );
      return { ok: false, error };
    }

    let written: unknown;
    try {
      written = this.approvals.appendRequest(candidate.value);
    } catch {
      return {
        ok: false,
        error: this.recordStorageFailure(input.runId, "request", candidate.value.approvalId),
      };
    }
    if (!isApprovalStoreWriteOutcome(written)) {
      return {
        ok: false,
        error: this.recordStorageFailure(input.runId, "request", candidate.value.approvalId),
      };
    }
    if (!written.ok) {
      return {
        ok: false,
        error: this.recordRequestFailure(
          input.runId,
          makeApprovalFailure(written.error.code),
          candidate.value.approvalId,
        ),
      };
    }
    if (written.value.status !== "pending" || !isDeepStrictEqual(written.value, candidate.value)) {
      return {
        ok: false,
        error: this.recordStorageFailure(input.runId, "request", candidate.value.approvalId),
      };
    }
    if (!this.appendEvent(input.runId, requestEvent(written.value))) {
      return {
        ok: false,
        error: this.recordStorageFailure(input.runId, "request", written.value.approvalId),
      };
    }
    return { ok: true, value: written.value };
  }

  decideApproval(input: unknown): ApprovalTransitionOutcome {
    if (!isApprovalDecisionInput(input)) {
      const hintedApprovalId = approvalIdHint(input);
      let correlatedRunId = runIdHint(input);
      if (hintedApprovalId) {
        const current = this.get(hintedApprovalId);
        if (!current.ok) {
          return {
            ok: false,
            kind: "failure",
            error: this.recordStorageFailure(correlatedRunId, "read", hintedApprovalId),
          };
        }
        correlatedRunId = current.value?.runId ?? correlatedRunId;
      }
      const error = this.recordDecisionFailure(
        correlatedRunId,
        makeApprovalFailure("invalid_decision"),
        hintedApprovalId,
      );
      return { ok: false, kind: "failure", error };
    }

    const current = this.get(input.approvalId);
    if (!current.ok) {
      return {
        ok: false,
        kind: "failure",
        error: this.recordDecisionFailure(input.runId, current.error, input.approvalId),
      };
    }
    if (!current.value) {
      const error = this.recordDecisionFailure(
        input.runId,
        makeApprovalFailure("approval_not_found"),
        input.approvalId,
      );
      return { ok: false, kind: "failure", error };
    }

    const preflight = transitionApproval(
      current.value,
      input,
      this.authorizedActorIds,
      current.value.requestedAt,
    );
    if (!preflight.ok && preflight.kind === "failure") {
      const error = this.recordDecisionFailure(
        current.value.runId,
        preflight.error,
        current.value.approvalId,
      );
      return { ...preflight, error };
    }
    if (!preflight.ok) {
      const terminal = preflight.value;
      const repaired = this.ensureTerminalEvent(terminal);
      if (!repaired.ok) {
        return {
          ok: false,
          kind: "failure",
          error: this.recordStorageFailure(terminal.runId, "read", terminal.approvalId),
        };
      }
      const data: ApprovalEventData =
        preflight.kind === "duplicate"
          ? {
              eventType: "approval.decision_duplicate",
              approvalId: terminal.approvalId,
              actorId: input.actorId,
              requestedDecision: input.decision,
              status: terminal.status,
            }
          : {
              eventType: "approval.decision_conflict",
              approvalId: terminal.approvalId,
              actorId: input.actorId,
              requestedDecision: input.decision,
              status: terminal.status,
            };
      if (!this.appendEvent(terminal.runId, data)) {
        return {
          ok: false,
          kind: "failure",
          error: this.recordStorageFailure(terminal.runId, "decision", terminal.approvalId),
        };
      }
      return preflight;
    }

    const decisionTime = this.decisionTime();
    if (!decisionTime.ok) {
      return {
        ok: false,
        kind: "failure",
        error: this.recordStorageFailure(input.runId, "decision", input.approvalId),
      };
    }
    const transition = transitionApproval(
      current.value,
      input,
      this.authorizedActorIds,
      decisionTime.value,
    );
    if (!transition.ok) {
      const error = this.recordDecisionFailure(
        current.value.runId,
        transition.error,
        current.value.approvalId,
      );
      return { ok: false, kind: "failure", error };
    }

    let written: unknown;
    try {
      written = this.approvals.appendDecision(transition.value);
    } catch {
      return {
        ok: false,
        kind: "failure",
        error: this.recordStorageFailure(input.runId, "decision", input.approvalId),
      };
    }
    if (!isApprovalStoreWriteOutcome(written)) {
      return {
        ok: false,
        kind: "failure",
        error: this.recordStorageFailure(input.runId, "decision", input.approvalId),
      };
    }
    if (!written.ok) {
      return {
        ok: false,
        kind: "failure",
        error: this.recordDecisionFailure(
          input.runId,
          makeApprovalFailure(written.error.code),
          input.approvalId,
        ),
      };
    }
    if (written.value.status === "pending" || !isDeepStrictEqual(written.value, transition.value)) {
      return {
        ok: false,
        kind: "failure",
        error: this.recordStorageFailure(input.runId, "decision", input.approvalId),
      };
    }
    if (!this.appendEvent(input.runId, terminalEvent(written.value))) {
      return {
        ok: false,
        kind: "failure",
        error: this.recordStorageFailure(input.runId, "decision", input.approvalId),
      };
    }
    return { ok: true, kind: "transitioned", value: written.value };
  }
}
