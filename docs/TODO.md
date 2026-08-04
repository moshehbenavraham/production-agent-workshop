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

## Phase 00 Transition (Complete)

- [x] Audit and validate the first local-tooling bundle (Biome formatting).
- [x] Validate the Code Quality pipeline and all active GitHub-managed workflows.
- [x] Add and validate the Docker/Coolify Health infrastructure bundle locally.
- [x] Record Phase 00 carryforward risks, lessons, controls, and release gates.
- [x] Complete the Phase 00 documentation transition gate.

## Phase 01 Closeout Transition

- [ ] Run the repository audit and add exactly one missing local-tooling bundle.
- [ ] Validate active CI and add exactly one missing pipeline bundle.
- [ ] Audit deployment readiness and add exactly one missing infrastructure bundle.
- [ ] Carry Phase 01 lessons, risks, and controls into the cumulative records.
- [ ] Reconcile all current documentation and record the documentation audit.

Phase 02 remains untouched. After these five closeout workflows pass, the next
command is `phasebuild`; it is deliberately outside the Phase 01 cutoff.

## Documentation Maintenance

- [x] Document local Pi authentication through a ChatGPT Plus or Pro Codex subscription.
- [x] Split Build Log evidence into linked Week 1-4 files with scoped future-week templates.
