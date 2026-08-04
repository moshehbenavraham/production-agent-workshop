import { findLead, makeApproval, makeDraft } from "./tools.js";
import { isQualificationResult, qualifyLead } from "./qualification.js";

type EvalCase = {
  name: string;
  run: () => boolean;
};

const cases: EvalCase[] = [
  {
    name: "known lead has deterministic validated qualification",
    run: () => {
      const outcome = qualifyLead({ leadId: "lead_ada" });
      return Boolean(
        outcome.ok &&
          outcome.value.fit === "strong" &&
          outcome.value.confidence === 0.85 &&
          isQualificationResult(outcome.value),
      );
    },
  },
  {
    name: "unknown lead receives structured refusal",
    run: () => {
      const outcome = qualifyLead({ leadId: "lead_unknown" });
      return !outcome.ok && outcome.error.code === "lead_not_found";
    },
  },
  {
    name: "invented qualification codes fail schema validation",
    run: () =>
      !isQualificationResult({
        leadId: "lead_ada",
        fit: "strong",
        confidence: 1,
        reasons: ["model_claim"],
        missingInformation: [],
      }),
  },
  {
    name: "grounded draft remains unsent",
    run: () => {
      const lead = findLead("lead_ada");
      const draft = lead ? makeDraft(lead, "An auditable support agent") : "";
      return draft.includes("Hi Ada") && !draft.includes("sent");
    },
  },
  {
    name: "approval remains pending",
    run: () =>
      makeApproval("run_eval", "lead_ada", "A sufficiently long draft.").status === "pending",
  },
];

let failures = 0;
for (const testCase of cases) {
  const passed = testCase.run();
  console.log(`${passed ? "PASS" : "FAIL"} ${testCase.name}`);
  if (!passed) failures += 1;
}

console.log(`\n${cases.length - failures}/${cases.length} evals passed`);
if (failures > 0) process.exitCode = 1;
