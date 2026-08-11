import { createHash } from "node:crypto";
import { resolve } from "node:path";
import { Type } from "typebox";
import Schema from "typebox/schema";
import {
  ApprovalRecordSchema,
  hashApprovalDraft,
  isApprovalRecord,
  type ApprovalRecord,
  type ApprovalStore,
} from "./approval.js";
import { ApprovalService, type ApprovalServiceOptions } from "./approval-service.js";
import { FileApprovalStore, type FileApprovalStoreOptions } from "./approval-store.js";
import { JsonlEventStore, type JsonlEventStoreOptions } from "./event-store.js";
import { isFakeSendFailure } from "./fake-send.js";
import { isFakeSendStoreProjection, type FakeSendStoreProjection } from "./fake-send-result.js";
import {
  loadFakeSendRecords,
  projectFakeSendRecords,
  type FakeSendStoreReadText,
} from "./fake-send-store.js";
import {
  projectStoredRun,
  type RunProjection,
  type RunProjectionFailure,
} from "./run-projection.js";
import { isMatchingRunEventAppendOutcome, isRunId, type RunEventStore } from "./run-event.js";
import { findLead, makeDraft } from "./tools.js";

const LeadIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern: "^lead_[a-z0-9_]+$",
});

const Sha256Schema = Type.String({
  minLength: 64,
  maxLength: 64,
  pattern: "^[0-9a-f]{64}$",
});

const EventIdSchema = Type.String({
  minLength: 8,
  maxLength: 120,
  pattern: "^event_[a-z0-9_-]+$",
});

export const RecoveryActionSchema = Type.Union([
  Type.Literal("retry"),
  Type.Literal("resume"),
  Type.Literal("compensate"),
  Type.Literal("escalate"),
  Type.Literal("stop"),
]);

const RecoveryDraftInputSchema = Type.Union([
  Type.Object(
    {
      kind: Type.Literal("generate"),
      angle: Type.String({ minLength: 10, maxLength: 240 }),
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      kind: Type.Literal("existing"),
      content: Type.String({ minLength: 20, maxLength: 10_000 }),
    },
    { additionalProperties: false },
  ),
]);

export const RecoveryRequestSchema = Type.Object(
  {
    runId: Type.String({ minLength: 8, maxLength: 120 }),
    leadId: LeadIdSchema,
    draft: Type.Optional(RecoveryDraftInputSchema),
  },
  { additionalProperties: false },
);

export const RecoveryFailureCodeSchema = Type.Union([
  Type.Literal("invalid_request"),
  Type.Literal("storage_failure"),
  Type.Literal("corrupt_history"),
  Type.Literal("interrupted_history"),
  Type.Literal("invalid_history"),
  Type.Literal("missing_start"),
  Type.Literal("cross_run_identity"),
  Type.Literal("out_of_order_event"),
  Type.Literal("missing_prerequisite"),
  Type.Literal("duplicate_evidence"),
  Type.Literal("conflicting_evidence"),
  Type.Literal("incompatible_terminal"),
  Type.Literal("authority_mismatch"),
  Type.Literal("lead_mismatch"),
  Type.Literal("qualification_incomplete"),
  Type.Literal("qualification_indeterminate"),
  Type.Literal("qualification_failed"),
  Type.Literal("draft_required"),
  Type.Literal("draft_mismatch"),
  Type.Literal("lead_not_found"),
  Type.Literal("approval_failure"),
  Type.Literal("event_storage_failure"),
  Type.Literal("effect_indeterminate"),
  Type.Literal("effect_completed"),
  Type.Literal("terminal_run"),
]);

const RecoveryFailureSchema = Type.Object(
  {
    code: RecoveryFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 160 }),
    retryable: Type.Boolean(),
  },
  { additionalProperties: false },
);

const RecoverySuccessOutcomeSchema = Type.Object(
  {
    ok: Type.Literal(true),
    action: Type.Literal("resume"),
    runId: Type.String({ minLength: 8, maxLength: 120 }),
    leadId: LeadIdSchema,
    checkpoint: Type.Literal("approval_requested"),
    approval: ApprovalRecordSchema,
    stopReason: Type.Union([Type.Literal("approval_pending"), Type.Literal("completed")]),
    terminalEventId: EventIdSchema,
  },
  { additionalProperties: false },
);

const RecoveryFailureOutcomeSchema = Type.Object(
  {
    ok: Type.Literal(false),
    action: Type.Union([
      Type.Literal("retry"),
      Type.Literal("compensate"),
      Type.Literal("escalate"),
      Type.Literal("stop"),
    ]),
    runId: Type.Union([Type.String({ minLength: 8, maxLength: 120 }), Type.Null()]),
    error: RecoveryFailureSchema,
  },
  { additionalProperties: false },
);

export const RecoveryOutcomeSchema = Type.Union([
  RecoverySuccessOutcomeSchema,
  RecoveryFailureOutcomeSchema,
]);

const RecoveryPolicyEntrySchema = Type.Object(
  {
    automatic: Type.Boolean(),
    supported: Type.Boolean(),
    requiredEvidence: Type.Array(Type.String({ minLength: 3, maxLength: 80 }), {
      minItems: 1,
      maxItems: 5,
    }),
  },
  { additionalProperties: false },
);

export const RecoveryActionPolicySchema = Type.Object(
  {
    retry: RecoveryPolicyEntrySchema,
    resume: RecoveryPolicyEntrySchema,
    compensate: RecoveryPolicyEntrySchema,
    escalate: RecoveryPolicyEntrySchema,
    stop: RecoveryPolicyEntrySchema,
  },
  { additionalProperties: false },
);

export type RecoveryAction = Type.Static<typeof RecoveryActionSchema>;
export type RecoveryRequest = Type.Static<typeof RecoveryRequestSchema>;
export type RecoveryFailureCode = Type.Static<typeof RecoveryFailureCodeSchema>;
export type RecoveryOutcome = Type.Static<typeof RecoveryOutcomeSchema>;

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) return value;
  for (const nested of Object.values(value)) deepFreeze(nested);
  return Object.freeze(value);
}

export const RECOVERY_ACTION_POLICY = deepFreeze({
  retry: {
    automatic: false,
    supported: true,
    requiredEvidence: ["transient failure", "no known effect", "safe idempotent operation"],
  },
  resume: {
    automatic: true,
    supported: true,
    requiredEvidence: ["trusted checkpoint", "exact cross-store identity", "no effect ambiguity"],
  },
  compensate: {
    automatic: false,
    supported: false,
    requiredEvidence: ["verified completed effect", "explicit operator plan"],
  },
  escalate: {
    automatic: true,
    supported: true,
    requiredEvidence: ["ambiguous or indeterminate state", "preserved durable evidence"],
  },
  stop: {
    automatic: true,
    supported: true,
    requiredEvidence: ["terminal or unsafe state", "no further mutation"],
  },
} as const);

const requestValidator = Schema.Compile(RecoveryRequestSchema);
const outcomeValidator = Schema.Compile(RecoveryOutcomeSchema);
const policyValidator = Schema.Compile(RecoveryActionPolicySchema);

if (!policyValidator.Check(RECOVERY_ACTION_POLICY)) {
  throw new Error("Recovery action policy is invalid.");
}

export function isRecoveryRequest(value: unknown): value is RecoveryRequest {
  try {
    return requestValidator.Check(value) && isRunId((value as RecoveryRequest).runId);
  } catch {
    return false;
  }
}

export function isRecoveryOutcome(value: unknown): value is RecoveryOutcome {
  try {
    if (!outcomeValidator.Check(value)) return false;
    const outcome = value as RecoveryOutcome;
    if (!outcome.ok) {
      return (
        (outcome.runId === null || isRunId(outcome.runId)) &&
        outcome.action === actionForFailure(outcome.error.code) &&
        outcome.error.retryable === (outcome.action === "retry")
      );
    }
    return (
      isRunId(outcome.runId) &&
      isApprovalRecord(outcome.approval) &&
      outcome.approval.runId === outcome.runId &&
      outcome.approval.target.leadId === outcome.leadId
    );
  } catch {
    return false;
  }
}

export function deriveRecoveryDraftId(runId: string, leadId: string, sha256: string): string {
  if (!isRunId(runId) || !/^lead_[a-z0-9_]{1,75}$/.test(leadId) || !/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error("Recovery draft identity input is invalid.");
  }
  const digest = createHash("sha256")
    .update(`${runId}\0${leadId}\0${sha256}`, "utf8")
    .digest("hex");
  return `draft_recovery_${digest.slice(0, 48)}`;
}

export type RecoveryApplicationPaths = {
  approvalPath: string;
  eventPath: string;
  resultPath: string;
};

export type RecoveryFakeProjectionReader = () => unknown;

export type RecoveryApplicationOptions = {
  eventStore?: RunEventStore;
  approvalStore?: ApprovalStore;
  fakeSendProjectionReader?: RecoveryFakeProjectionReader;
  eventStoreOptions?: JsonlEventStoreOptions;
  approvalStoreOptions?: FileApprovalStoreOptions;
  approvalService?: Omit<ApprovalServiceOptions, "authorizedActorIds">;
  fakeSendReadText?: FakeSendStoreReadText;
};

type LoadedRecovery = {
  projection: RunProjection;
  approvals: ApprovalRecord[];
  fakeSendProjections: FakeSendStoreProjection[];
};

type LoadRecoveryOutcome =
  | { ok: true; value: LoadedRecovery }
  | { ok: false; value: RecoveryOutcome };

const failureMessages: Readonly<Record<RecoveryFailureCode, string>> = Object.freeze({
  invalid_request: "Recovery request is invalid.",
  storage_failure: "Recovery storage is unavailable.",
  corrupt_history: "Recovery history is corrupt; preserve it for inspection.",
  interrupted_history:
    "Recovery history contains an interrupted write; preserve it for inspection.",
  invalid_history: "Recovery history is invalid.",
  missing_start: "Recovery history has no valid run start.",
  cross_run_identity: "Recovery history contains a cross-run identity.",
  out_of_order_event: "Recovery history is out of order.",
  missing_prerequisite: "Recovery history is missing a required predecessor.",
  duplicate_evidence: "Recovery history contains duplicate evidence.",
  conflicting_evidence: "Recovery history contains conflicting evidence.",
  incompatible_terminal: "Recovery history contains an incompatible terminal.",
  authority_mismatch: "Recovery authority does not match run evidence.",
  lead_mismatch: "Recovery lead does not match the durable run lead.",
  qualification_incomplete:
    "Qualification has not started; retry only through the bounded qualification path.",
  qualification_indeterminate:
    "Qualification attempt is open; preserve evidence and inspect before retry.",
  qualification_failed: "Qualification failed and cannot be resumed as success.",
  draft_required: "Exact recoverable draft input is required.",
  draft_mismatch: "Recoverable draft content does not match durable evidence.",
  lead_not_found: "The exact synthetic lead is unavailable.",
  approval_failure: "Approval recovery is indeterminate; preserve all stores for inspection.",
  event_storage_failure: "Recovery event persistence is unavailable.",
  effect_indeterminate: "A fake effect reservation is indeterminate and requires escalation.",
  effect_completed: "A fake effect already has a durable result and must not be retried.",
  terminal_run: "The run is terminal and cannot be reopened by recovery.",
});

function actionForFailure(code: RecoveryFailureCode): Exclude<RecoveryAction, "resume"> {
  if (
    code === "storage_failure" ||
    code === "event_storage_failure" ||
    code === "qualification_incomplete"
  ) {
    return "retry";
  }
  if (
    code === "invalid_request" ||
    code === "lead_mismatch" ||
    code === "qualification_failed" ||
    code === "lead_not_found" ||
    code === "effect_completed" ||
    code === "terminal_run"
  ) {
    return "stop";
  }
  return "escalate";
}

function failure(code: RecoveryFailureCode, runId: string | null): RecoveryOutcome {
  const action = actionForFailure(code);
  return deepFreeze({
    ok: false,
    action,
    runId,
    error: {
      code,
      message: failureMessages[code],
      retryable: action === "retry",
    },
  });
}

function projectionFailureCode(error: RunProjectionFailure): RecoveryFailureCode {
  switch (error.code) {
    case "invalid_input":
      return "invalid_history";
    case "missing_start":
    case "cross_run_identity":
    case "out_of_order_event":
    case "missing_prerequisite":
    case "duplicate_evidence":
    case "conflicting_evidence":
    case "incompatible_terminal":
    case "authority_mismatch":
    case "corrupt_history":
    case "interrupted_history":
    case "storage_failure":
      return error.code;
  }
}

function authorityFailureCode(code: string): RecoveryFailureCode {
  return code === "corrupt_record"
    ? "corrupt_history"
    : code === "interrupted_write"
      ? "interrupted_history"
      : code === "out_of_order_record"
        ? "out_of_order_event"
        : code === "result_conflict"
          ? "conflicting_evidence"
          : "storage_failure";
}

function assertClosedPaths(paths: RecoveryApplicationPaths): void {
  try {
    const keys = Object.keys(paths).sort();
    const values = Object.values(paths);
    if (
      keys.length === 3 &&
      keys[0] === "approvalPath" &&
      keys[1] === "eventPath" &&
      keys[2] === "resultPath" &&
      values.every((path) => typeof path === "string" && path.length > 0 && !path.includes("\0")) &&
      new Set(values.map((path) => resolve(path))).size === 3
    ) {
      return;
    }
  } catch {
    // The stable configuration error below excludes hostile getter details.
  }
  throw new Error(
    "Recovery paths must contain exact, distinct, non-empty approval, event, and result paths.",
  );
}

function defaultFakeReader(
  path: string,
  readText: FakeSendStoreReadText | undefined,
): RecoveryFakeProjectionReader {
  return () => {
    const loaded = loadFakeSendRecords(path, readText);
    return loaded.ok ? projectFakeSendRecords(loaded.value) : loaded;
  };
}

function cloneFakeReaderOutcome(value: unknown): unknown {
  try {
    return structuredClone(value);
  } catch {
    return undefined;
  }
}

function draftContent(
  request: RecoveryRequest,
  durableDraft: RunProjection["workingContext"]["draft"],
):
  | { ok: true; content: string; sha256: string; draftId: string }
  | { ok: false; code: RecoveryFailureCode } {
  if (!request.draft) return { ok: false, code: "draft_required" };

  let content: string;
  if (request.draft.kind === "generate") {
    const lead = findLead(request.leadId);
    if (!lead || lead.id !== request.leadId) return { ok: false, code: "lead_not_found" };
    content = makeDraft(lead, request.draft.angle);
  } else {
    if (!durableDraft) return { ok: false, code: "draft_mismatch" };
    content = request.draft.content;
  }

  const sha256 = hashApprovalDraft(content);
  if (durableDraft) {
    return durableDraft.sha256 === sha256
      ? { ok: true, content, sha256, draftId: durableDraft.draftId }
      : { ok: false, code: "draft_mismatch" };
  }
  return {
    ok: true,
    content,
    sha256,
    draftId: deriveRecoveryDraftId(request.runId, request.leadId, sha256),
  };
}

function successfulRecovery(projection: RunProjection, approval: ApprovalRecord): RecoveryOutcome {
  const terminal = projection.terminalOutcome;
  if (
    !terminal ||
    terminal.kind !== "completed" ||
    (terminal.stopReason !== "approval_pending" && terminal.stopReason !== "completed")
  ) {
    return failure("terminal_run", projection.runId);
  }
  let outcome: RecoveryOutcome;
  try {
    outcome = {
      ok: true,
      action: "resume",
      runId: projection.runId,
      leadId: projection.leadId,
      checkpoint: "approval_requested",
      approval: structuredClone(approval),
      stopReason: terminal.stopReason,
      terminalEventId: terminal.eventId,
    };
  } catch {
    return failure("invalid_history", projection.runId);
  }
  return isRecoveryOutcome(outcome)
    ? deepFreeze(outcome)
    : failure("invalid_history", projection.runId);
}

export class RecoveryApplication {
  private readonly events: RunEventStore;
  private readonly approvals: ApprovalService;
  private readonly readFakeSendProjections: RecoveryFakeProjectionReader;

  constructor(paths: RecoveryApplicationPaths, options: RecoveryApplicationOptions = {}) {
    assertClosedPaths(paths);
    let events: RunEventStore;
    let approvals: ApprovalService;
    let fakeReader: RecoveryFakeProjectionReader;
    try {
      events =
        options.eventStore ?? new JsonlEventStore(paths.eventPath, options.eventStoreOptions);
      const approvalStore =
        options.approvalStore ??
        new FileApprovalStore(paths.approvalPath, options.approvalStoreOptions);
      fakeReader =
        options.fakeSendProjectionReader ??
        defaultFakeReader(paths.resultPath, options.fakeSendReadText);
      if (typeof fakeReader !== "function") throw new Error("invalid reader");
      const approvalOptions =
        options.approvalService === undefined ? undefined : { ...options.approvalService };
      approvals = new ApprovalService(approvalStore, events, {
        ...approvalOptions,
        authorizedActorIds: new Set<string>(),
      });
    } catch {
      throw new Error("Recovery application configuration is invalid.");
    }
    this.events = events;
    this.approvals = approvals;
    this.readFakeSendProjections = fakeReader;
  }

  private loadFake(
    runId: string,
  ): { ok: true; value: FakeSendStoreProjection[] } | { ok: false; code: RecoveryFailureCode } {
    let raw: unknown;
    try {
      raw = cloneFakeReaderOutcome(this.readFakeSendProjections());
    } catch {
      return { ok: false, code: "storage_failure" };
    }
    if (typeof raw !== "object" || raw === null || !("ok" in raw)) {
      return { ok: false, code: "storage_failure" };
    }
    const outcome = raw as { ok?: unknown; value?: unknown; error?: unknown };
    if (outcome.ok === false) {
      return isFakeSendFailure(outcome.error)
        ? { ok: false, code: authorityFailureCode(outcome.error.code) }
        : { ok: false, code: "storage_failure" };
    }
    if (
      outcome.ok !== true ||
      !Array.isArray(outcome.value) ||
      !outcome.value.every(isFakeSendStoreProjection)
    ) {
      return { ok: false, code: "storage_failure" };
    }
    return {
      ok: true,
      value: outcome.value.filter((candidate) => candidate.reservation.runId === runId),
    };
  }

  private load(runId: string): LoadRecoveryOutcome {
    const approvals = this.approvals.listRun(runId);
    if (!approvals.ok) {
      return { ok: false, value: failure(authorityFailureCode(approvals.error.code), runId) };
    }
    const fake = this.loadFake(runId);
    if (!fake.ok) return { ok: false, value: failure(fake.code, runId) };
    const projected = projectStoredRun(this.events, runId, {
      approvalRecords: approvals.value,
      fakeSendProjections: fake.value,
    });
    if (!projected.ok) {
      if (projected.error.code === "authority_mismatch") {
        if (fake.value.some((candidate) => candidate.state === "reserved")) {
          return { ok: false, value: failure("effect_indeterminate", runId) };
        }
        if (fake.value.some((candidate) => candidate.state === "completed")) {
          return { ok: false, value: failure("effect_completed", runId) };
        }
      }
      return {
        ok: false,
        value: failure(projectionFailureCode(projected.error), runId),
      };
    }
    return {
      ok: true,
      value: {
        projection: projected.value,
        approvals: approvals.value,
        fakeSendProjections: fake.value,
      },
    };
  }

  private append(input: unknown): boolean {
    try {
      return isMatchingRunEventAppendOutcome(this.events.append(input), input);
    } catch {
      return false;
    }
  }

  private appendDraft(
    request: RecoveryRequest,
    candidate: { content: string; sha256: string; draftId: string },
  ): boolean {
    return this.append({
      runId: request.runId,
      type: "domain.follow_up_drafted",
      data: {
        eventType: "domain.follow_up_drafted",
        leadId: request.leadId,
        draftId: candidate.draftId,
        sha256: candidate.sha256,
      },
      metadata: {
        action: "draft_follow_up",
        tool: { name: "recovery_application", callId: null },
        validatedArguments: { leadId: request.leadId },
        result: "succeeded",
      },
    });
  }

  private appendTerminal(runId: string, approval: ApprovalRecord): boolean {
    const stopReason = approval.status === "pending" ? "approval_pending" : "completed";
    return this.append({
      runId,
      type: "run.completed",
      data: { eventType: "run.completed", stopReason },
      metadata: {
        action: "run_complete",
        result: approval.status === "pending" ? "pending" : "succeeded",
        approvalState: approval.status === "pending" ? "pending" : null,
        stopReason,
      },
    });
  }

  private effectGate(loaded: LoadedRecovery): RecoveryOutcome | undefined {
    const fake = loaded.projection.workingContext.fakeSend;
    const authority = loaded.projection.authority.fakeSend;
    if (authority.state === "reserved") {
      return failure("effect_indeterminate", loaded.projection.runId);
    }
    if (authority.state === "completed") {
      return failure("effect_completed", loaded.projection.runId);
    }
    if (fake?.observedStatus === "attempted" || fake?.observedStatus === "accepted") {
      return failure("effect_indeterminate", loaded.projection.runId);
    }
    return undefined;
  }

  recover(input: unknown): RecoveryOutcome {
    if (!isRecoveryRequest(input)) return failure("invalid_request", null);
    let request: RecoveryRequest;
    try {
      request = structuredClone(input);
    } catch {
      return failure("invalid_request", null);
    }
    let loaded = this.load(request.runId);
    if (!loaded.ok) return loaded.value;
    if (loaded.value.projection.leadId !== request.leadId) {
      return failure("lead_mismatch", request.runId);
    }
    const effectFailure = this.effectGate(loaded.value);
    if (effectFailure) return effectFailure;

    let projection = loaded.value.projection;
    if (projection.terminalOutcome) {
      if (
        projection.latestSafeCheckpoint.kind === "approval_requested" &&
        loaded.value.approvals.length === 1 &&
        loaded.value.approvals[0]
      ) {
        return successfulRecovery(projection, loaded.value.approvals[0]);
      }
      return failure("terminal_run", request.runId);
    }

    const qualification = projection.workingContext.qualification;
    if (projection.latestSafeCheckpoint.kind === "run_started") {
      return qualification === null
        ? failure("qualification_incomplete", request.runId)
        : qualification.state === "attempted"
          ? failure("qualification_indeterminate", request.runId)
          : failure("qualification_failed", request.runId);
    }

    let candidate: Extract<ReturnType<typeof draftContent>, { ok: true }>;
    let approval: ApprovalRecord | undefined;
    if (projection.latestSafeCheckpoint.kind === "approval_requested") {
      approval = loaded.value.approvals.length === 1 ? loaded.value.approvals[0] : undefined;
      if (!approval || !projection.workingContext.draft) {
        return failure("authority_mismatch", request.runId);
      }
      candidate = {
        ok: true,
        content: approval.draft.content,
        sha256: approval.draft.sha256,
        draftId: approval.draft.draftId,
      };
    } else if (projection.latestSafeCheckpoint.kind === "qualification_completed") {
      const proposed = draftContent(request, null);
      if (!proposed.ok) return failure(proposed.code, request.runId);
      candidate = proposed;
      if (!this.appendDraft(request, candidate)) {
        return failure("event_storage_failure", request.runId);
      }
      loaded = this.load(request.runId);
      if (!loaded.ok) return loaded.value;
      projection = loaded.value.projection;
    } else {
      const proposed = draftContent(request, projection.workingContext.draft);
      if (!proposed.ok) return failure(proposed.code, request.runId);
      candidate = proposed;
    }

    if (
      projection.latestSafeCheckpoint.kind !== "draft_created" &&
      projection.latestSafeCheckpoint.kind !== "approval_requested"
    ) {
      return failure("invalid_history", request.runId);
    }

    if (projection.latestSafeCheckpoint.kind === "approval_requested") {
      approval ??= loaded.value.approvals.length === 1 ? loaded.value.approvals[0] : undefined;
    } else {
      const created = this.approvals.requestApproval(
        {
          runId: request.runId,
          leadId: request.leadId,
          action: "send_follow_up",
          draft: candidate.content,
        },
        { draftId: candidate.draftId },
      );
      if (created.ok) approval = created.value;
      loaded = this.load(request.runId);
      if (!loaded.ok) return created.ok ? loaded.value : failure("approval_failure", request.runId);
      projection = loaded.value.projection;
      approval = loaded.value.approvals.length === 1 ? loaded.value.approvals[0] : approval;
      if (!created.ok && !approval) return failure("approval_failure", request.runId);
    }

    if (
      !approval ||
      projection.latestSafeCheckpoint.kind !== "approval_requested" ||
      projection.workingContext.approval?.approvalId !== approval.approvalId ||
      approval.runId !== request.runId ||
      approval.target.leadId !== request.leadId ||
      approval.draft.draftId !== candidate.draftId ||
      approval.draft.sha256 !== candidate.sha256
    ) {
      return failure("authority_mismatch", request.runId);
    }

    if (!this.appendTerminal(request.runId, approval)) {
      return failure("event_storage_failure", request.runId);
    }
    loaded = this.load(request.runId);
    if (!loaded.ok) return loaded.value;
    if (loaded.value.approvals.length !== 1 || !loaded.value.approvals[0]) {
      return failure("authority_mismatch", request.runId);
    }
    return successfulRecovery(loaded.value.projection, loaded.value.approvals[0]);
  }
}
