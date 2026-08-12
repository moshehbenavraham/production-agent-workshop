# Session 04: Incident Drills and Operational Baseline

**Session ID**: `phase03-session04-incident-drills-and-operational-baseline`
**Status**: Complete
**Source Task**: `06`
**Estimated Tasks**: ~20
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-12

---

## Objective

Exercise the five required synthetic incident paths through the actual observability and recovery boundaries, close every revealed gap, and establish the measured single-agent operational baseline.

---

## Scope

### In Scope (MVP)

- Define deterministic drill fixtures, expected evidence, safe recovery or refusal, and cleanup before running any incident scenario.
- Drill a tool timeout under one stable `runId` and verify the actionable category, terminal stop reason, alert behavior, and recovery action.
- Drill an invalid model response and verify no invalid content becomes application state or friendly success.
- Drill a mid-run restart at a supported checkpoint and resume under the same `runId` without duplicate approval or effect.
- Drill a revoked or unavailable provider credential through an injected boundary without reading or storing a real credential.
- Drill a duplicate request and verify stable existing outcomes without duplicate approval, adapter invocation, or claimed send.
- Query every drill with the safe report command and compare the observed chronology with predeclared evidence.
- Exercise the relevant runbook path without manually editing any event, approval, result, or eval record.
- Add the missing bounded field, category, alert rule, query behavior, or runbook step revealed by each drill.
- Capture available success, failure, latency, token, cost, explainability, and operational-complexity baseline fields for future comparison work.
- Represent provider-dependent values as unavailable with finite reasons when no authorized provider measurement exists.
- Complete the Task `06` incident timeline, query output, alert table, redacted view, recovery proof, verification result, and final diff review in the Week 4 Build Log.
- Synchronize Task `06` progress documentation only after focused and repository verification pass.

### Out of Scope

- A live production incident, real credential revocation, real customer data, or external network write.
- Coolify deployment, public exposure, off-server restore, rollback, or Task `07` release evidence.
- Introducing a typed handoff, second agent, router, or orchestration layer.

---

## Prerequisites

- [x] Session 03 provides tested observability, query, alert, and runbook boundaries for every drill.
- [x] Each drill is isolated, synthetic, reversible, and has predeclared expected evidence and a bounded cleanup path.

---

## Deliverables

1. Five deterministic incident exercises with exact `runId` timelines, alert outcomes, and safe recovery or refusal evidence.
2. Focused fixes and regressions for every observability or runbook gap revealed by the drills.
3. Completed Task `06` Week 4 evidence and measured single-agent operational baseline inputs for future comparison.

---

## Success Criteria

- [x] Timeout, invalid response, restart, credential-unavailable, and duplicate-request drills all produce their predeclared actionable outcomes.
- [x] Supported recovery preserves one `runId` and creates no duplicate approval or effect; ambiguous authority always stops or escalates.
- [x] Every drill is reconstructable with the safe query and maps to an alert or documented no-alert decision plus an exact runbook action.
- [x] Baseline measurements are real or explicitly unavailable and do not imply a later entry gate has passed without complete Task `07` evidence.
- [x] Task `06` evidence and repository verification pass with no protected-data leak or permission expansion.
