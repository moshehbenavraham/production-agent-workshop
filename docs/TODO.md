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

## Latest Completed Phase

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
verification. Tasks `04` and `05` and the Phase 02 implementation are complete.

## Next Phase

Phase 03 - Operations and Coolify Release (Week 4) remains planned. No Phase 03
sessions have been created; its `phasebuild` workflow has not started.

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
- [ ] Reassess infrastructure readiness without claiming a deployment.
- [ ] Carry Phase 02 lessons, risks, and controls into cumulative records.
- [ ] Reconcile all current documentation and record the documentation audit.

## Documentation Maintenance

- [x] Document local Pi authentication through a ChatGPT Plus or Pro Codex subscription.
- [x] Split Build Log evidence into linked Week 1-4 files with scoped future-week templates.
- [x] Reconcile the Week 2 Build Log with Tasks `02` and `03` and current
  approval/fake-send source and test evidence.
