import { Type } from "typebox";
import Schema from "typebox/schema";
import { findLead, type Lead } from "./leads.js";

const LeadIdSchema = Type.String({
  minLength: 6,
  maxLength: 80,
  pattern: "^lead_[a-z0-9_]+$",
});

export const QualificationInputSchema = Type.Object(
  {
    leadId: LeadIdSchema,
  },
  { additionalProperties: false },
);

export const QualificationFitSchema = Type.Union([
  Type.Literal("strong"),
  Type.Literal("possible"),
  Type.Literal("insufficient"),
]);

export const QualificationResultSchema = Type.Object(
  {
    leadId: LeadIdSchema,
    fit: QualificationFitSchema,
    confidence: Type.Number({ minimum: 0, maximum: 1 }),
    reasons: Type.Array(Type.String({ minLength: 1, maxLength: 80 }), {
      minItems: 1,
      maxItems: 4,
      uniqueItems: true,
    }),
    missingInformation: Type.Array(Type.String({ minLength: 1, maxLength: 80 }), {
      maxItems: 4,
      uniqueItems: true,
    }),
  },
  { additionalProperties: false },
);

export const QualificationFailureCodeSchema = Type.Union([
  Type.Literal("missing_lead_id"),
  Type.Literal("malformed_lead_id"),
  Type.Literal("invalid_input"),
  Type.Literal("lead_not_found"),
  Type.Literal("lead_lookup_failed"),
  Type.Literal("qualification_timeout"),
]);

export const QualificationFailureSchema = Type.Object(
  {
    code: QualificationFailureCodeSchema,
    message: Type.String({ minLength: 1, maxLength: 240 }),
    retryable: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const QualificationOutcomeSchema = Type.Union([
  Type.Object(
    {
      ok: Type.Literal(true),
      value: QualificationResultSchema,
    },
    { additionalProperties: false },
  ),
  Type.Object(
    {
      ok: Type.Literal(false),
      error: QualificationFailureSchema,
    },
    { additionalProperties: false },
  ),
]);

export type QualificationInput = Type.Static<typeof QualificationInputSchema>;
export type QualificationFit = Type.Static<typeof QualificationFitSchema>;
export type QualificationResult = Type.Static<typeof QualificationResultSchema>;
export type QualificationFailureCode = Type.Static<
  typeof QualificationFailureCodeSchema
>;
export type QualificationFailure = Type.Static<typeof QualificationFailureSchema>;
export type QualificationOutcome = Type.Static<typeof QualificationOutcomeSchema>;

export type LeadLookup = (leadId: string) => Lead | undefined;

const failureMessages: Record<QualificationFailureCode, string> = {
  missing_lead_id: "A non-empty leadId is required.",
  malformed_lead_id: "leadId must use the lead_<lowercase identifier> format.",
  invalid_input: "Qualification input contains unsupported fields.",
  lead_not_found: "No lead exists for the requested leadId.",
  lead_lookup_failed: "Lead lookup failed.",
  qualification_timeout: "Qualification timed out.",
};

const auditableStack = new Set(["Coolify", "Postgres", "TypeScript"]);
const missingInformation = ["budget", "decision_timeline"] as const;

function qualificationFailure(code: QualificationFailureCode): QualificationOutcome {
  return {
    ok: false,
    error: {
      code,
      message: failureMessages[code],
      retryable: code === "lead_lookup_failed" || code === "qualification_timeout",
    },
  };
}

function buildQualification(lead: Lead): QualificationResult {
  const reasons: string[] = [];
  let confidence = 0;

  if (lead.teamSize >= 15) {
    reasons.push("team_size_in_scope");
    confidence += 0.35;
  }
  if (lead.stack.some((technology) => auditableStack.has(technology))) {
    reasons.push("auditable_stack_present");
    confidence += 0.25;
  }
  if (lead.problem.trim().length >= 20) {
    reasons.push("operational_problem_present");
    confidence += 0.25;
  }
  if (reasons.length === 0) reasons.push("limited_qualification_signals");

  const fit: QualificationFit =
    confidence >= 0.75 ? "strong" : confidence >= 0.4 ? "possible" : "insufficient";
  const result: QualificationResult = {
    leadId: lead.id,
    fit,
    confidence,
    reasons,
    missingInformation: [...missingInformation],
  };

  if (!isQualificationResult(result)) {
    throw new Error("Deterministic qualification violated its result schema.");
  }
  return result;
}

const qualificationInputValidator = Schema.Compile(QualificationInputSchema);
const qualificationResultValidator = Schema.Compile(QualificationResultSchema);
const qualificationFailureValidator = Schema.Compile(QualificationFailureSchema);
const qualificationOutcomeValidator = Schema.Compile(QualificationOutcomeSchema);

export function isQualificationInput(value: unknown): value is QualificationInput {
  return qualificationInputValidator.Check(value);
}

export function isQualificationResult(value: unknown): value is QualificationResult {
  return qualificationResultValidator.Check(value);
}

export function isQualificationFailure(value: unknown): value is QualificationFailure {
  return qualificationFailureValidator.Check(value);
}

export function isQualificationOutcome(value: unknown): value is QualificationOutcome {
  return qualificationOutcomeValidator.Check(value);
}

function qualificationInputFailure(input: unknown): QualificationOutcome | undefined {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return qualificationFailure("missing_lead_id");
  }

  const candidate = input as Record<string, unknown>;
  if (!("leadId" in candidate)) return qualificationFailure("missing_lead_id");
  if (typeof candidate.leadId !== "string") {
    return qualificationFailure("malformed_lead_id");
  }
  if (candidate.leadId.trim().length === 0) {
    return qualificationFailure("missing_lead_id");
  }
  if (!isQualificationInput({ leadId: candidate.leadId })) {
    return qualificationFailure("malformed_lead_id");
  }
  if (!isQualificationInput(input)) return qualificationFailure("invalid_input");
  return undefined;
}

export function qualifyLead(
  input: unknown,
  lookup: LeadLookup = findLead,
): QualificationOutcome {
  const inputFailure = qualificationInputFailure(input);
  if (inputFailure) return inputFailure;
  if (!isQualificationInput(input)) return qualificationFailure("invalid_input");

  let lead: Lead | undefined;
  try {
    lead = lookup(input.leadId);
  } catch {
    return qualificationFailure("lead_lookup_failed");
  }
  if (!lead || lead.id !== input.leadId) {
    return qualificationFailure("lead_not_found");
  }
  return { ok: true, value: buildQualification(lead) };
}
