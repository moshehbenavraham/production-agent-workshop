import {
  ApprovalService,
  type ApprovalRequestServiceOptions,
  type ApprovalServiceOptions,
} from "./approval-service.js";
import { FileApprovalStore, type FileApprovalStoreOptions } from "./approval-store.js";
import type {
  ApprovalCreationOutcome,
  ApprovalStoreListOutcome,
  ApprovalStoreReadOutcome,
  ApprovalTransitionOutcome,
} from "./approval.js";
import { JsonlEventStore } from "./event-store.js";
import { DeterministicFakeSendAdapter } from "./fake-send-adapter.js";
import type { FakeSendExecutionOutcome } from "./fake-send-execution.js";
import { FakeSendService, type FakeSendServiceOptions } from "./fake-send-service.js";
import { FileFakeSendResultStore, type FileFakeSendResultStoreOptions } from "./fake-send-store.js";
import { FakeSendAuthorizer, type FakeSendAdapter } from "./fake-send.js";

export const SAFE_WRITE_PERMISSION_DECISION = Object.freeze({
  capability: "fake_send",
  piToolRegistered: false,
  productionAllowlisted: false,
  humanReviewStatus: "not_performed",
  requiredReviewer: "repository_maintainer",
  humanReviewRequiredBeforeChange: true,
} as const);

export type SafeWriteApplicationPaths = {
  approvalPath: string;
  eventPath: string;
  resultPath: string;
};

export type SafeWriteApplicationOptions = {
  approvalActorIds: ReadonlySet<string>;
  fakeSendActorIds: ReadonlySet<string>;
  adapter?: FakeSendAdapter;
  approvalStore?: FileApprovalStoreOptions;
  approvalService?: Omit<ApprovalServiceOptions, "authorizedActorIds">;
  fakeSendStore?: FileFakeSendResultStoreOptions;
  fakeSendService?: FakeSendServiceOptions;
};

function assertClosedPaths(paths: SafeWriteApplicationPaths): void {
  const keys = Object.keys(paths).sort();
  if (
    keys.length !== 3 ||
    keys[0] !== "approvalPath" ||
    keys[1] !== "eventPath" ||
    keys[2] !== "resultPath" ||
    Object.values(paths).some(
      (path) => typeof path !== "string" || path.length === 0 || path.includes("\0"),
    )
  ) {
    throw new Error(
      "Safe-write paths must contain exact non-empty approval, event, and result paths.",
    );
  }
}

function snapshotActors(actorIds: ReadonlySet<string>, label: string): ReadonlySet<string> {
  try {
    const snapshot = new Set(actorIds);
    if ([...snapshot].every((actorId) => /^actor_[a-z0-9_-]{1,94}$/.test(actorId))) {
      return snapshot;
    }
  } catch {
    // Configuration errors are reported below before any store is constructed.
  }
  throw new Error(`Safe-write ${label} actor IDs must be a set of valid actor identifiers.`);
}

function assertFakeSendServiceConfiguration(options: FakeSendServiceOptions | undefined): void {
  const timeoutMs = options?.timeoutMs;
  if (
    timeoutMs !== undefined &&
    (!Number.isFinite(timeoutMs) ||
      !Number.isInteger(timeoutMs) ||
      timeoutMs <= 0 ||
      timeoutMs > 60_000)
  ) {
    throw new Error("Fake-send timeout must be a positive finite integer up to 60000 ms.");
  }
}

export class SafeWriteApplication {
  private readonly approvals: ApprovalService;
  private readonly fakeSends: FakeSendService;

  constructor(paths: SafeWriteApplicationPaths, options: SafeWriteApplicationOptions) {
    assertClosedPaths(paths);
    const approvalActorIds = snapshotActors(options.approvalActorIds, "approval");
    const fakeSendActorIds = snapshotActors(options.fakeSendActorIds, "execution");
    assertFakeSendServiceConfiguration(options.fakeSendService);
    const events = new JsonlEventStore(paths.eventPath);
    const approvalStore = new FileApprovalStore(paths.approvalPath, options.approvalStore);
    this.approvals = new ApprovalService(approvalStore, events, {
      ...options.approvalService,
      authorizedActorIds: approvalActorIds,
    });
    const authorizer = new FakeSendAuthorizer(approvalStore, {
      authorizedActorIds: fakeSendActorIds,
    });
    const resultStore = new FileFakeSendResultStore(paths.resultPath, options.fakeSendStore);
    this.fakeSends = new FakeSendService(
      authorizer,
      resultStore,
      events,
      options.adapter ?? new DeterministicFakeSendAdapter(),
      options.fakeSendService,
    );
  }

  requestApproval(input: unknown, options: ApprovalRequestServiceOptions): ApprovalCreationOutcome {
    return this.approvals.requestApproval(input, options);
  }

  decideApproval(input: unknown): ApprovalTransitionOutcome {
    return this.approvals.decideApproval(input);
  }

  getApproval(approvalId: string): ApprovalStoreReadOutcome {
    return this.approvals.get(approvalId);
  }

  listApprovals(runId: string): ApprovalStoreListOutcome {
    return this.approvals.listRun(runId);
  }

  executeFakeSend(input: unknown): Promise<FakeSendExecutionOutcome> {
    return this.fakeSends.execute(input);
  }
}
