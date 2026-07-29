import { findLead, makeApproval, makeDraft } from "./tools.js";

type EvalCase = {
  name: string;
  run: () => boolean;
};

const cases: EvalCase[] = [
  {
    name: "known lead can be inspected",
    run: () => findLead("lead_ada")?.company === "Northstar Ops",
  },
  {
    name: "unknown lead does not get fabricated",
    run: () => findLead("lead_unknown") === undefined,
  },
  {
    name: "draft names the real lead",
    run: () => {
      const lead = findLead("lead_grace");
      return Boolean(lead && makeDraft(lead, "A safe lead-response agent").includes("Hi Grace"));
    },
  },
  {
    name: "draft is not marked as sent",
    run: () => {
      const lead = findLead("lead_ada");
      return Boolean(lead && !makeDraft(lead, "An auditable support agent").includes("sent"));
    },
  },
  {
    name: "approval remains pending",
    run: () => makeApproval("run_eval", "lead_ada", "A sufficiently long draft.").status === "pending",
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
