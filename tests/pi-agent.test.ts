import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createPendingApproval, transitionApproval } from "../src/approval.js";
import type { AgentEvent } from "../src/event-store.js";
import {
  PRODUCTION_TOOL_NAMES,
  WORKSHOP_APPROVAL_ACTOR_IDS,
  deriveRunStopReason,
  qualificationRunOutput,
  runLeadAgent,
  runCompletionMetadata,
} from "../src/pi-agent.js";
import { qualifyLead } from "../src/qualification.js";
import { createAgentEvent } from "../src/run-event.js";

let eventIndex = 0;

function event(
  type: "qualification.completed" | "qualification.failed" | "approval.requested",
  data: Record<string, unknown>,
): AgentEvent {
  const closedData =
    type === "qualification.completed"
      ? { eventType: type, result: data }
      : type === "qualification.failed"
        ? { eventType: type, error: data }
        : {
            eventType: type,
            approvalId: "approval_projection_event_001",
            action: "send_follow_up",
            targetKind: "lead",
            leadId: typeof data.leadId === "string" ? data.leadId : "lead_ada",
            draftId: "draft_projection_event_001",
            status: "pending",
          };
  eventIndex += 1;
  const outcome = createAgentEvent(
    { runId: "run_projection_test", type, data: closedData },
    {
      eventId: `event_projection_${eventIndex}`,
      at: "2026-08-04T00:00:00.000Z",
      applicationVersion: "0.1.22",
    },
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

function corruptQualificationEvent(data: Record<string, unknown>): AgentEvent {
  return {
    schemaVersion: 1,
    eventId: "event_projection_corrupt",
    runId: "run_projection_test",
    at: "2026-08-04T00:00:00.000Z",
    type: "qualification.completed",
    data: { eventType: "qualification.completed", result: data },
    metadata: {},
  } as unknown as AgentEvent;
}

const known = qualifyLead({ leadId: "lead_ada" });
if (!known.ok) throw new Error("Synthetic known lead must qualify for tests.");

function pending(
  runId = "run_projection_test",
  leadId = "lead_ada",
  requestedAt = "2026-08-04T00:01:00.000Z",
) {
  const outcome = createPendingApproval(
    {
      runId,
      leadId,
      action: "send_follow_up",
      draft: "A sufficiently long projection-test approval draft.",
    },
    {
      approvalId: "approval_projection_001",
      draftId: "draft_projection_001",
      now: requestedAt,
    },
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

test("production allowlist contains exactly three bounded custom tools", () => {
  assert.deepEqual(PRODUCTION_TOOL_NAMES, [
    "qualify_lead",
    "draft_follow_up",
    "request_send_approval",
  ]);
  assert.equal(Object.isFrozen(PRODUCTION_TOOL_NAMES), true);
  assert.deepEqual(WORKSHOP_APPROVAL_ACTOR_IDS, ["actor_workshop_reviewer"]);
  assert.equal(Object.isFrozen(WORKSHOP_APPROVAL_ACTOR_IDS), true);
});

test("known success with pending approval derives approval_pending", () => {
  assert.equal(
    deriveRunStopReason(
      [
        event("qualification.completed", known.value),
        event("approval.requested", { leadId: "lead_ada", status: "pending" }),
      ],
      "lead_ada",
      [pending()],
    ),
    "approval_pending",
  );
});

test("known success without durable approval fails closed", () => {
  assert.equal(
    deriveRunStopReason([event("qualification.completed", known.value)], "lead_ada", []),
    "approval_failed",
  );
});

test("not-found qualification failure wins over attempted approval", () => {
  const notFound = qualifyLead({ leadId: "lead_unknown" });
  if (notFound.ok) assert.fail("Expected not found");

  assert.equal(
    deriveRunStopReason(
      [
        event("qualification.failed", notFound.error),
        event("approval.requested", { status: "pending" }),
      ],
      "lead_unknown",
      [],
    ),
    "not_found",
  );
});

test("other qualification failure wins over assistant or approval state", () => {
  assert.equal(
    deriveRunStopReason(
      [
        event("qualification.failed", {
          code: "qualification_timeout",
          message: "Qualification timed out.",
          retryable: true,
        }),
        event("approval.requested", { status: "pending" }),
      ],
      "lead_ada",
      [],
    ),
    "qualification_failed",
  );
});

test("missing or corrupt qualification evidence fails closed", () => {
  assert.equal(deriveRunStopReason([], "lead_ada", []), "qualification_failed");
  assert.equal(
    deriveRunStopReason(
      [
        corruptQualificationEvent({
          leadId: "lead_ada",
          fit: "invented",
          confidence: 2,
        }),
      ],
      "lead_ada",
      [],
    ),
    "qualification_failed",
  );
});

test("schema-valid cross-lead completion fails closed for the requested run", () => {
  assert.equal(
    deriveRunStopReason([event("qualification.completed", known.value)], "lead_grace", []),
    "qualification_failed",
  );
});

test("approval before the latest qualification cannot derive approval_pending", () => {
  assert.equal(
    deriveRunStopReason([event("qualification.completed", known.value)], "lead_ada", [
      pending("run_projection_test", "lead_ada", "2026-08-03T23:59:00.000Z"),
    ]),
    "approval_failed",
  );
});

test("event-only, malformed, and cross-run approval evidence cannot grant pending", () => {
  const events = [
    event("qualification.completed", known.value),
    event("approval.requested", { leadId: "lead_ada", status: "pending" }),
  ];
  assert.equal(deriveRunStopReason(events, "lead_ada", []), "approval_failed");
  assert.equal(deriveRunStopReason(events, "lead_ada", [{ status: "pending" }]), "approval_failed");
  assert.equal(deriveRunStopReason(events, "lead_ada", [pending("run_other")]), "approval_failed");
});

test("exact durable terminal approval derives completed", () => {
  const request = pending();
  const outcome = transitionApproval(
    request,
    {
      approvalId: request.approvalId,
      runId: request.runId,
      actorId: "actor_workshop_reviewer",
      decision: "approved",
    },
    new Set(["actor_workshop_reviewer"]),
    "2026-08-04T00:02:00.000Z",
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(
    deriveRunStopReason([event("qualification.completed", known.value)], "lead_ada", [
      outcome.value,
    ]),
    "completed",
  );
});

test("durable view uses request time instead of adapter order and rejects ambiguous ties", () => {
  const earlierRequest = {
    ...pending("run_projection_test", "lead_ada", "2026-08-04T00:01:00.000Z"),
    approvalId: "approval_projection_earlier",
    draft: {
      ...pending().draft,
      draftId: "draft_projection_earlier",
    },
  };
  const earlierTerminal = transitionApproval(
    earlierRequest,
    {
      approvalId: earlierRequest.approvalId,
      runId: earlierRequest.runId,
      actorId: "actor_workshop_reviewer",
      decision: "approved",
    },
    new Set(["actor_workshop_reviewer"]),
    "2026-08-04T00:02:00.000Z",
  );
  if (!earlierTerminal.ok) assert.fail(earlierTerminal.error.message);
  const laterPending = {
    ...pending("run_projection_test", "lead_ada", "2026-08-04T00:03:00.000Z"),
    approvalId: "approval_projection_later",
    draft: {
      ...pending().draft,
      draftId: "draft_projection_later",
    },
  };
  const events = [event("qualification.completed", known.value)];

  assert.equal(
    deriveRunStopReason(events, "lead_ada", [laterPending, earlierTerminal.value]),
    "approval_pending",
  );
  assert.equal(
    deriveRunStopReason(events, "lead_ada", [
      earlierTerminal.value,
      { ...laterPending, requestedAt: earlierTerminal.value.requestedAt },
    ]),
    "approval_failed",
  );
});

test("structured failure output overrides friendly assistant prose", () => {
  const failure = qualifyLead({ leadId: "lead_unknown" });
  if (failure.ok) assert.fail("Expected failure");

  assert.equal(
    qualificationRunOutput(failure, "Everything succeeded and was sent."),
    "No lead exists for the requested leadId.",
  );
  assert.equal(qualificationRunOutput(known, "Approval is pending."), "Approval is pending.");
  assert.equal(
    qualificationRunOutput(known, "Message sent successfully.", "approval_pending"),
    "Approval is pending. No message was sent.",
  );
  assert.equal(
    qualificationRunOutput(known, "Approval granted and sent.", "completed"),
    "The approval decision is complete. No message was sent.",
  );
  assert.equal(
    qualificationRunOutput(known, "Everything succeeded.", "approval_failed"),
    "Approval was not created. No message was sent.",
  );
  assert.equal(
    qualificationRunOutput(known, "Everything succeeded.", "qualification_failed"),
    "Qualification failed. No message was sent.",
  );
});

test("run completion metadata never invents approval or success state", () => {
  assert.deepEqual(runCompletionMetadata("approval_pending"), {
    action: "run_complete",
    result: "pending",
    stopReason: "approval_pending",
    approvalState: "pending",
  });
  assert.deepEqual(runCompletionMetadata("completed"), {
    action: "run_complete",
    result: "succeeded",
    stopReason: "completed",
    approvalState: null,
  });
  for (const stopReason of ["approval_failed", "not_found", "qualification_failed"] as const) {
    assert.deepEqual(runCompletionMetadata(stopReason), {
      action: "run_complete",
      result: "stopped",
      stopReason,
      approvalState: null,
    });
  }
});

test("invalid whole-run bounds fail before runtime files are created", async () => {
  const directory = mkdtempSync(join(tmpdir(), "production-agent-bounds-"));
  const eventPath = join(directory, "events.jsonl");
  const approvalPath = join(directory, "approvals.jsonl");
  const previous = {
    deadline: process.env.RUN_DEADLINE_MS,
    eventPath: process.env.EVENT_LOG_PATH,
    approvalPath: process.env.APPROVAL_LOG_PATH,
  };
  process.env.RUN_DEADLINE_MS = "0";
  process.env.EVENT_LOG_PATH = eventPath;
  process.env.APPROVAL_LOG_PATH = approvalPath;

  try {
    await assert.rejects(runLeadAgent("lead_ada"), /Run bounds are invalid\./);
    assert.equal(existsSync(eventPath), false);
    assert.equal(existsSync(approvalPath), false);
  } finally {
    if (previous.deadline === undefined) delete process.env.RUN_DEADLINE_MS;
    else process.env.RUN_DEADLINE_MS = previous.deadline;
    if (previous.eventPath === undefined) delete process.env.EVENT_LOG_PATH;
    else process.env.EVENT_LOG_PATH = previous.eventPath;
    if (previous.approvalPath === undefined) delete process.env.APPROVAL_LOG_PATH;
    else process.env.APPROVAL_LOG_PATH = previous.approvalPath;
    rmSync(directory, { recursive: true, force: true });
  }
});
