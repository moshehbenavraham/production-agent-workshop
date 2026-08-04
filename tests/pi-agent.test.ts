import assert from "node:assert/strict";
import test from "node:test";
import { createPendingApproval, transitionApproval } from "../src/approval.js";
import type { AgentEvent } from "../src/event-store.js";
import {
  PRODUCTION_TOOL_NAMES,
  WORKSHOP_APPROVAL_ACTOR_IDS,
  deriveRunStopReason,
  qualificationRunOutput,
} from "../src/pi-agent.js";
import { qualifyLead } from "../src/qualification.js";

function event(type: string, data: Record<string, unknown> = {}): AgentEvent {
  return {
    eventId: crypto.randomUUID(),
    runId: "run_projection_test",
    at: "2026-08-04T00:00:00.000Z",
    type,
    data,
  };
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
        event("qualification.completed", {
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
});
