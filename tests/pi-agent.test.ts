import assert from "node:assert/strict";
import test from "node:test";
import type { AgentEvent } from "../src/event-store.js";
import {
  PRODUCTION_TOOL_NAMES,
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

test("production allowlist contains exactly three bounded custom tools", () => {
  assert.deepEqual(PRODUCTION_TOOL_NAMES, [
    "qualify_lead",
    "draft_follow_up",
    "request_send_approval",
  ]);
  assert.equal(Object.isFrozen(PRODUCTION_TOOL_NAMES), true);
});

test("known success with pending approval derives approval_pending", () => {
  assert.equal(
    deriveRunStopReason(
      [
        event("qualification.completed", known.value),
        event("approval.requested", { leadId: "lead_ada", status: "pending" }),
      ],
      "lead_ada",
    ),
    "approval_pending",
  );
});

test("known success without approval derives completed", () => {
  assert.equal(
    deriveRunStopReason([event("qualification.completed", known.value)], "lead_ada"),
    "completed",
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
    ),
    "qualification_failed",
  );
});

test("missing or corrupt qualification evidence fails closed", () => {
  assert.equal(deriveRunStopReason([], "lead_ada"), "qualification_failed");
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
    ),
    "qualification_failed",
  );
});

test("schema-valid cross-lead completion fails closed for the requested run", () => {
  assert.equal(
    deriveRunStopReason([event("qualification.completed", known.value)], "lead_grace"),
    "qualification_failed",
  );
});

test("approval before the latest qualification cannot derive approval_pending", () => {
  assert.equal(
    deriveRunStopReason(
      [
        event("approval.requested", { leadId: "lead_ada", status: "pending" }),
        event("qualification.completed", known.value),
      ],
      "lead_ada",
    ),
    "completed",
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
