# TODO

Track planned documentation and implementation work here.

## Completed Phases

- [x] Phase 00 - Foundation (Week 1)
  - [x] Session 01 - Bounded System Map
  - [x] Session 02 - Qualification Contract and Domain
  - [x] Session 03 - Qualification Tool Integration
- [x] Phase 01 - Durable Approval and Safe Write (Week 2)
  - [x] Session 01 - Approval Contract and Transitions
  - [x] Session 02 - Approval Store and Projection
  - [x] Session 03 - Durable Approval Integration
  - [x] Session 04 - Fake Send Contract and Authorization
  - [x] Session 05 - Idempotent Fake Send Execution
  - [x] Session 06 - Safe Write Integration and Evidence

The ordered scope and acceptance evidence remain authoritative in
[`docs/todo/README_todo.md`](todo/README_todo.md) and its linked task contracts.

Phase 01 is sourced only from Tasks [`02`](todo/02-durable-approvals.md) and
[`03`](todo/03-idempotent-send.md). Its completed implementation preserves the
fake-only, synthetic-data, no-real-network boundary.

## Completed Phase 02

- [x] Phase 02 - Recovery and Evaluation Gates (Week 3)
  - [x] Session 01 - Durable Run Event Contract and Store
  - [x] Session 02 - Run Projection and Corruption Refusal
  - [x] Session 03 - Bounded Run Lifecycle
  - [x] Session 04 - Replay and Resume Integration
  - [x] Session 05 - Production Eval Contract and Golden Set
  - [x] Session 06 - Critical Eval Gate and Scorecard
  - [x] Session 07 - Boundary Regression Exercises and Evidence

Phase 02 is sourced only from Tasks [`04`](todo/04-recovery-and-replay.md) and
[`05`](todo/05-production-evals.md). Its implementation preserves dedicated approval and
fake-result authorization truth while making durable events authoritative for
run lifecycle recovery. Session 01 now has a validated closed, versioned event
contract and private durable JSONL adapter with corruption refusal; it does not
add execution bounds, replay, or resume. Session 02 is validated with a
deterministic read-only run projection, explicit safe checkpoints, structured
replaceable context, legal post-run operational evidence, restart equivalence,
actionable damaged-history failures, and exact approval/fake-result authority
cross-checks. Session 03 now implements schema-v2 step metadata, validated
whole-run deadline and maximum-step configuration, complete minimized Pi tool
attempt/outcome evidence, abort-once and terminal-once coordination, bounded
stop projection, and deterministic late-settlement suppression. Session 03 is
validated. Session 04 now implements internal provider-independent recovery at
qualification, draft, and approval checkpoints with exact cross-store
authority, stable replay, hash-anchored draft content, and mandatory escalation
for indeterminate effects. Session 04 is validated, Task `04` is complete, and
the boundary cannot invoke an effect. Session 05 is validated with closed
production-eval contracts and an immutable 18-case synthetic golden set.
Session 06 is completed and validated with deterministic production-boundary execution,
exact critical scoring, private validated artifacts, compact scorecards, and a
non-zero repository deployment gate. Session 07 is completed and validated
with three isolated red/fix/green boundary traces, exact safe-source hash
restoration, permanent regression coverage, and final 270-test plus 18-case
session-close verification. The Phase 02 transition backup regressions brought
that phase's repository gate to 273 tests while preserving the same 18-case
critical suite. The current Phase 03 gate is 374 tests and the same 18-case
critical suite.
Tasks `04` and `05` and the Phase 02 implementation are complete.

## Latest Completed Phase

- [x] Phase 03 - Operations and Coolify Release (Week 4)
  - [x] Session 01 - Observability Contract and Service Health
    - [x] Implement closed four-layer observation contracts and bounded service collection.
    - [x] Add deterministic availability, correlation, timeout, failure, and redaction tests.
    - [x] Complete Apex review, validation, and PRD closeout.
  - [x] Session 02 - Run Timeline Query and Redaction
    - [x] Implement a closed exact-`runId` report with projection-before-rendering validation.
    - [x] Add bounded read-only JSON/text CLI output and a preserved synthetic fixture.
    - [x] Complete Apex review, validation, and PRD closeout.
  - [x] Session 03 - Alerts and Incident Runbook
    - [x] Implement seven closed deterministic alert variants and a finite default policy.
    - [x] Keep required missing metrics visible and queue pressure explicitly not applicable.
    - [x] Add the canonical grounded agent incident guide and alert/runbook regressions.
    - [x] Complete Apex review, validation, and PRD closeout.
  - [x] Session 04 - Incident Drills and Operational Baseline
    - [x] Execute timeout, invalid-model, restart, credential-unavailable, and duplicate drills.
    - [x] Validate exact safe reports, default alerts, recovery/effect evidence, and cleanup.
    - [x] Record the Task `06` operational baseline and remaining blind spots.
    - [x] Complete Apex review, validation, and PRD closeout.
  - [x] Session 05 - Controlled Release Security and Operator Contract
    - [x] Implement the closed controlled/public exposure and target-readiness preflight.
    - [x] Add the redacted decision record, Mermaid map, security matrix, and blocked fixture.
    - [x] Prove bounded command, hostile input, exact ownership, and no-target-mutation behavior.
    - [x] Complete Apex review, validation, and PRD closeout.
  - [x] Session 06 - Coolify Deployment Health and Persistence
  - [x] Session 07 - Off-Server Restore and Rollback
    - [x] Copy and validate a stopped-writer snapshot outside the server boundary.
    - [x] Restore into an absent private directory and start the service against it.
    - [x] Exercise a reversible failed deployment and restore the verified revision.
    - [x] Complete Apex review, validation, and PRD closeout.
  - [x] Session 08 - Operator Handoff, Parity, and Release Evidence

Phase 03 is sourced only from Tasks
[`06`](todo/06-observability-and-incidents.md) and
[`07`](todo/07-coolify-release.md). Its eight bounded session stubs preserve
controlled exposure, synthetic-only data, the exact three-tool Pi allowlist,
and operator-owned deployment actions.
Session 01 is complete with closed service, run, model, and tool observation
contracts plus a controlled service snapshot collector. Session 02 is complete
with a bounded read-only exact-`runId` report, JSON/text parity, complete-history
validation, and default protected-field omission.
Session 03 is complete with a local deterministic seven-rule alert
policy, explicit suppression and unavailable/not-applicable outcomes, and the
canonical agent incident guide without a notification or recovery transport.
Session 04 is complete with five actual golden-boundary incident drills, exact
safe reports, unchanged default alert thresholds, restart and duplicate-effect
proof, bounded cleanup, and an explicit provider-independent operational
baseline. Task `06` is complete. Controlled-release Task `07` begins in Session 05.
Session 05 now implements the repository policy and operator contract. An
authorized controlled Coolify target has since proved the reviewed revision,
HTTPS health behind an access gate, bounded runtime configuration, a named
persistent mount across container replacement, and enabled Sentinel monitoring.
The redacted current-target preflight passes all 15 checks and keeps target
mutation disallowed. The runtime-only provider secret, synthetic pending-
approval smoke, and exact event/approval survival across container replacement
are directly proved. The workshop owner accepted the remaining deployment,
health, incident, secret-rotation, local-backup, recovery, and rollback duties.
Session 05 is reviewed, validated, and complete at version `0.1.36`. Session 06
is reviewed, validated, and complete at version `0.1.37`; the selected image,
provider-backed smoke, controlled health, monitoring, and exact event/approval
persistence passed.
Session 07 is reviewed, validated, and complete at version `0.1.38`. It proves
the private workstation backup, exact
restore, restored-service activation, safe deployment failure, and rollback.
Session 08 is reviewed and validated with exact local/deployed safety parity,
the plain-English single-owner guide, five-minute demo, 374 passing tests, 18
passing evals, and final release review. Task `07` and Phase 03 are complete at
version `0.1.39`. Automatic Coolify deploys remain disabled.

## Next Planned Phase

- [ ] Phase 04 - Typed Handoff Decision (Week 5)
  - [ ] Run `phasebuild 4` only when the Phase 04 experiment is intentionally started.
  - [ ] Complete Task [`08`](todo/08-typed-handoff-experiment.md) and make the
    evidence-based keep-or-remove decision.

Phase 04 is planned and required, but it is not built in the Phase 03 closeout.

## Phase 03 Closeout Transition

- [x] Re-run the repository audit and reconcile local tooling evidence.
- [x] Validate active CI and add the one missing Integration pipeline bundle.
- [x] Reassess infrastructure readiness and validate the manual Coolify Deploy bundle.
- [x] Carry Phase 03 lessons, risks, and controls into cumulative records.
- [x] Reconcile current documentation and record the documentation audit.

## Phase 00 Transition (Complete)

- [x] Audit and validate the first local-tooling bundle (Biome formatting).
- [x] Validate the Code Quality pipeline and all active GitHub-managed workflows.
- [x] Add and validate the Docker/Coolify Health infrastructure bundle locally.
- [x] Record Phase 00 carryforward risks, lessons, controls, and release gates.
- [x] Complete the Phase 00 documentation transition gate.

## Phase 01 Closeout Transition

- [x] Run the repository audit and add exactly one missing local-tooling bundle (Biome linting).
- [x] Validate active CI and add exactly one missing pipeline bundle (Build & Test).
- [x] Audit deployment readiness and add exactly one missing infrastructure bundle (Security rate gate).
- [x] Carry Phase 01 lessons, risks, and controls into the cumulative records.
- [x] Reconcile all current documentation and record the documentation audit.

Phase 02 planning is now complete. Its seven bounded session stubs were created
only after all five Phase 01 closeout workflows passed.

## Phase 02 Closeout Transition

- [x] Re-run the repository audit and reconcile local tooling evidence.
- [x] Revalidate active CI and the required production-eval pipeline gate.
- [x] Reassess infrastructure readiness and validate one offline backup/restore bundle without claiming a deployment.
- [x] Carry Phase 02 lessons, risks, and controls into cumulative records.
- [x] Reconcile all current documentation and record the documentation audit.

## Documentation Maintenance

- [x] Document local Pi authentication through a ChatGPT Plus or Pro Codex subscription.
- [x] Split Build Log evidence into linked Week 1-4 files with scoped future-week templates.
- [x] Reconcile the Week 2 Build Log with Tasks `02` and `03` and current
  approval/fake-send source and test evidence.
- [x] Reconcile the Week 3 Build Log with Tasks `04` and `05`, current recovery
  and production-eval contracts, and the Phase 02 273-test repository gate.
