# Session 07: Boundary Regression Exercises and Evidence

**Session ID**: `phase02-session07-boundary-regression-exercises-and-evidence`
**Status**: Not Started
**Source Task**: `05`
**Estimated Tasks**: ~16
**Estimated Duration**: 2-4 hours

---

## Objective

Prove that the production eval gate catches lead fabrication, false-send completion, and approval bypass, revert every deliberate break, and close Task `05` and Phase 02 evidence.

---

## Scope

### In Scope (MVP)

- Establish a clean baseline and record the exact bounded procedure for each controlled red/fix/green exercise.
- Introduce one isolated lead-fabrication violation, run the targeted critical case to red, restore the boundary, and prove green.
- Introduce one isolated false-send completion claim, run the targeted critical case to red, restore the boundary, and prove green.
- Introduce one isolated approval-bypass violation, run the targeted critical case to red, restore the boundary, and prove green.
- Add or confirm permanent regression cases for each critical boundary without retaining any deliberate vulnerability.
- Confirm every client-brief boundary maps to a passing critical eval and the final inventory remains between 10 and 20 cases.
- Run the full scorecard and verify every critical case, dimension, expected event sequence, recovery result, and stop reason.
- Confirm model, token, latency, and cost fields are measured or explicitly unavailable and pending thresholds remain visible.
- Review final source and persisted fixtures for deliberate-break residue, credentials, private data, broader permissions, false completion wording, or unapproved effects.
- Complete the golden-set inventory, rubric, final scorecard, three red/fix/green traces, failure refusal, verification output, and remaining-risk record in the Week 3 Build Log.
- Update `docs/TODO.md`, `docs/CHANGELOG.md`, the master PRD, and phase tracking only after all required verification passes.
- Run the production-agent verification workflow and final repository checks before claiming Task `05` or Phase 02 complete.

### Out of Scope

- Provider-dependent model grading, deployed eval execution, Coolify release, or post-deployment monitoring.
- Real credentials, real customer data, a real send provider, or any Pi/HTTP write capability.
- Phase 03 observability, incident drills, authentication, restore, rollback, and deployment work.

---

## Prerequisites

- [ ] Session 06 produces a green critical gate, validated scorecard, and proven non-zero failure path.
- [ ] Each deliberate break can be isolated, reversed, and verified without destructive Git operations or unrelated working-tree changes.

---

## Deliverables

1. Three recorded critical red/fix/green exercises with all deliberate violations removed.
2. Permanent lead-fabrication, false-completion, and approval-bypass regression coverage plus a final green 10-20 case scorecard.
3. Completed Task `05` Week 3 evidence pack, Phase 02 verification, documentation synchronization, and final security and side-effect diff review.

---

## Success Criteria

- [ ] Each deliberate violation produces the expected critical red result and non-zero exit before its exact fix restores green.
- [ ] The final tree contains no deliberate vulnerability, broadened allowlist, real network effect, credential, or protected data.
- [ ] Every required critical boundary is covered and every final golden-set case passes with actionable scorecard evidence.
- [ ] Optional quality or unavailable provider metrics cannot weaken the deployment-blocking gate.
- [ ] Week 3 evidence is complete and final repository plus production-agent verification pass before Phase 02 is marked complete.
