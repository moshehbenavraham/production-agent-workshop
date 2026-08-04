import assert from "node:assert/strict";
import test from "node:test";
import {
  isQualificationOutcome,
  isQualificationResult,
  qualifyLead,
  type QualificationFailureCode,
  type QualificationOutcome,
} from "../src/qualification.js";
import type { Lead } from "../src/leads.js";

function assertFailure(
  outcome: QualificationOutcome,
  code: QualificationFailureCode,
): void {
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail(`Expected ${code} failure`);
  assert.equal(outcome.error.code, code);
  assert.equal("value" in outcome, false);
  assert.equal(isQualificationOutcome(outcome), true);
}

test("known lead produces an application-validated qualification", () => {
  const outcome = qualifyLead({ leadId: "lead_ada" });

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.ok, true);
  assert.deepEqual(outcome.value, {
    leadId: "lead_ada",
    fit: "strong",
    confidence: 0.85,
    reasons: [
      "team_size_in_scope",
      "auditable_stack_present",
      "operational_problem_present",
    ],
    missingInformation: ["budget", "decision_timeline"],
  });
  assert.equal(isQualificationResult(outcome.value), true);
  assert.equal(isQualificationOutcome(outcome), true);
});

test("same exact lead produces the same result", () => {
  assert.deepEqual(
    qualifyLead({ leadId: "lead_grace" }),
    qualifyLead({ leadId: "lead_grace" }),
  );
});

test("result schema rejects confidence outside zero through one", () => {
  const valid = {
    leadId: "lead_ada",
    fit: "strong",
    confidence: 0.85,
    reasons: ["team_size_in_scope"],
    missingInformation: ["budget"],
  };

  assert.equal(isQualificationResult({ ...valid, confidence: -0.01 }), false);
  assert.equal(isQualificationResult({ ...valid, confidence: 1.01 }), false);
  assert.equal(isQualificationResult({ ...valid, extra: true }), false);
});

test("weak synthetic lead still produces a bounded schema-valid result", () => {
  const weakLead: Lead = {
    id: "lead_weak",
    name: "Synthetic",
    company: "Example",
    teamSize: 1,
    stack: [],
    problem: "Short",
  };
  const outcome = qualifyLead(
    { leadId: weakLead.id },
    (leadId) => (leadId === weakLead.id ? weakLead : undefined),
  );

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.value.fit, "insufficient");
  assert.equal(outcome.value.confidence, 0);
  assert.deepEqual(outcome.value.reasons, ["limited_qualification_signals"]);
  assert.equal(isQualificationResult(outcome.value), true);
});

test("missing leadId returns structured failure before lookup", () => {
  for (const input of [undefined, {}, { leadId: "" }, { leadId: "   " }]) {
    let lookupCalled = false;
    const outcome = qualifyLead(input, () => {
      lookupCalled = true;
      return undefined;
    });

    assertFailure(outcome, "missing_lead_id");
    assert.equal(lookupCalled, false);
  }
});

test("malformed leadId returns structured failure before lookup", () => {
  for (const input of [{ leadId: 42 }, { leadId: "Ada" }, { leadId: "lead_Ada" }]) {
    let lookupCalled = false;
    const outcome = qualifyLead(input, () => {
      lookupCalled = true;
      return undefined;
    });

    assertFailure(outcome, "malformed_lead_id");
    assert.equal(lookupCalled, false);
  }
});

test("unknown lead cannot receive qualification fields", () => {
  const outcome = qualifyLead({ leadId: "lead_unknown" });

  assertFailure(outcome, "lead_not_found");
});

test("result-shaped model proposal is rejected before lookup", () => {
  let lookupCalled = false;
  const outcome = qualifyLead(
    {
      leadId: "lead_ada",
      fit: "strong",
      confidence: 1,
      reasons: ["model_claim"],
      missingInformation: [],
    },
    () => {
      lookupCalled = true;
      return undefined;
    },
  );

  assertFailure(outcome, "invalid_input");
  assert.equal(lookupCalled, false);
});

test("lookup failure is redacted and cannot become friendly success", () => {
  const outcome = qualifyLead({ leadId: "lead_ada" }, () => {
    throw new Error("sensitive downstream detail");
  });

  assertFailure(outcome, "lead_lookup_failed");
  if (outcome.ok) assert.fail("Expected lookup failure");
  assert.equal(outcome.error.retryable, true);
  assert.equal(outcome.error.message, "Lead lookup failed.");
  assert.doesNotMatch(outcome.error.message, /sensitive downstream detail/);
});

test("future tool timeout has a structured retryable failure contract", () => {
  assert.equal(
    isQualificationOutcome({
      ok: false,
      error: {
        code: "qualification_timeout",
        message: "Qualification timed out.",
        retryable: true,
      },
    }),
    true,
  );
});

test("outcome validator rejects partial or mixed success and failure", () => {
  assert.equal(
    isQualificationOutcome({
      ok: false,
      error: {
        code: "lead_not_found",
        message: "No lead exists for the requested leadId.",
        retryable: false,
      },
      value: {
        leadId: "lead_unknown",
        fit: "strong",
        confidence: 1,
        reasons: ["invented"],
        missingInformation: [],
      },
    }),
    false,
  );
});
