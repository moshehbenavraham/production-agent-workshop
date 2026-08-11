# Session 05: Production Eval Contract and Golden Set

**Session ID**: `phase02-session05-production-eval-contract-and-golden-set`
**Status**: Not Started
**Source Task**: `05`
**Estimated Tasks**: ~18
**Estimated Duration**: 2-4 hours

---

## Objective

Define the closed production-eval contracts and a 10-20 case synthetic golden set with expected outcomes and event sequences declared before execution.

---

## Scope

### In Scope (MVP)

- Define closed case, fixture, expectation, trace, dimension, score, result, version, latency, token, and cost contracts.
- Distinguish critical deterministic gates from non-blocking quality metrics and optional model grading.
- Represent unavailable provider, token, latency, and cost values explicitly rather than as successful zero values.
- Inventory 10-20 synthetic cases covering happy, ambiguous, missing, malformed, unknown, timeout, permission, credential, downstream, duplicate, restart, invalid-model, adversarial, approval-bypass, false-completion, escalation, and stop behavior.
- Map every client-brief non-negotiable boundary to at least one critical case.
- Declare each case's expected result, tool selection, validated arguments, event order, permission decision, recovery behavior, and stop reason before running it.
- Define deterministic injected model, tool, store, clock, and adapter boundaries for provider-independent execution.
- Preserve existing useful eval coverage while migrating it from ad hoc booleans into the case contract.
- Define result persistence and comparison metadata for application, prompt, model, fixture, and eval-suite versions.
- Validate case completeness, unique identity, supported dimensions, expected evidence, and critical-boundary coverage.
- Add contract and inventory tests for malformed cases, missing expectations, duplicate IDs, unavailable metadata, and uncovered critical boundaries.
- Record the golden-set inventory and rubric draft in the Week 3 Build Log.

### Out of Scope

- Final score computation, deployment-blocking exit behavior, or compact scorecard rendering.
- Controlled source breaks and red/fix/green evidence.
- Required provider credentials, real customer data, or model-grader authority over critical gates.

---

## Prerequisites

- [ ] Session 04 completes Task `04` recovery behavior and exposes deterministic injected boundaries for restart and replay cases.
- [ ] The current five eval cases and all client-brief safety boundaries are mapped before replacement.

---

## Deliverables

1. Closed production-eval case, expectation, evidence, score, trace, result, and version contracts.
2. Validated 10-20 case synthetic golden-set inventory with predeclared outcomes and event sequences.
3. Provider-independent fixture boundaries, inventory validation tests, and Week 3 rubric and case evidence.

---

## Success Criteria

- [ ] The inventory contains 10-20 unique reproducible synthetic cases spanning every required behavior category.
- [ ] Every client-brief boundary maps to at least one critical deterministic expectation.
- [ ] Expected tools, arguments, events, permissions, recovery behavior, and stop reason exist before case execution.
- [ ] Version, trace, latency, token, and cost fields have explicit validated meanings, including unavailable values.
- [ ] Optional model grading is separate and cannot change a deterministic critical pass or failure.
