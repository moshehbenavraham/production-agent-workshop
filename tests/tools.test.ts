import assert from "node:assert/strict";
import test from "node:test";
import { findLead, makeApproval, makeDraft } from "../src/tools.js";

test("lead lookup never fabricates an unknown record", () => {
  assert.equal(findLead("lead_unknown"), undefined);
});

test("draft uses deterministic lead data", () => {
  const lead = findLead("lead_ada");
  assert.ok(lead);
  const draft = makeDraft(lead, "An auditable support triage agent");
  assert.match(draft, /^Hi Ada,/);
  assert.match(draft, /support triage is slow/i);
});

test("send request is an approval record, not a send", () => {
  const approval = makeApproval("run_123", "lead_ada", "This is a long enough draft.");
  assert.equal(approval.action, "send_follow_up");
  assert.equal(approval.status, "pending");
  assert.ok(approval.approvalId);
});
