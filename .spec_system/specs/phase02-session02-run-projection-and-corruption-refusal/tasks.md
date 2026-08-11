# Task Checklist

**Session ID**: `phase02-session02-run-projection-and-corruption-refusal`
**Total Tasks**: 18
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-11

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0202] Verify authoritative Phase 02 state, Session 01 and Phase 01 prerequisites, base commit, required toolchain, and green pre-session baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`)
- [x] T002 [S0202] Map Task `04`, closed run-event variants, event-store trust boundary, approval projection, fake-result projection, identity fields, permissions, and minimized context constraints (`docs/todo/04-recovery-and-replay.md`, `src/run-event.ts`, `src/event-store.ts`, `src/approval.ts`, `src/fake-send-result.ts`)

---

## Foundation (5 tasks)

- [x] T003 [S0202] [P] Write contract-first RED tests for closed status, checkpoint, terminal, structured-context, authority-evidence, success, and canonical failure outcomes including freeze and mutation behavior (`tests/run-projection.test.ts`)
- [x] T004 [S0202] [P] Write RED legal-order and refusal matrices for every valid complete or interrupted prefix plus missing prerequisites, duplicate, conflicting, cross-run, out-of-order, incompatible-terminal, and post-terminal evidence (`tests/run-projection.test.ts`)
- [x] T005 [S0202] Define TypeBox schemas and exhaustive runtime guards for projection input, lifecycle status, checkpoint, terminal outcome, minimized working context, authority observations, and canonical actionable failures (`src/run-projection.ts`)
- [x] T006 [S0202] Define explicit legal predecessor, identity, timestamp, milestone uniqueness, terminal compatibility, and legal post-run approval/fake-send suffix rules for every owned event variant (`src/run-projection.ts`)
- [x] T007 [S0202] Define a replaceable read-only projector boundary and closed approval/fake-result authority-evidence inputs that cannot confer permission from operational events (`src/run-projection.ts`)

---

## Implementation (6 tasks)

- [x] T008 [S0202] Implement clone-before-validation, exact single-run identity, canonical timestamp, adapter outcome, dependency throw, and frozen result handling without returning partial state (`src/run-projection.ts`)
- [x] T009 [S0202] Implement deterministic transition folding for start, qualification attempt/outcome, draft, approval observation, fake-send observation, Pi lifecycle evidence, and safe milestone advancement (`src/run-projection.ts`)
- [x] T010 [S0202] Implement compatible completion/failure projection and fail-closed handling for missing prerequisites, duplicate or incompatible milestones, ambiguous branches, terminal conflicts, illegal core evidence after terminal, and invalid post-run operational evidence (`src/run-projection.ts`)
- [x] T011 [S0202] Implement exact approval-record and fake-result-projection validation across run, lead, draft, hash, approval, idempotency, status, and result identities while keeping authority distinct from observation (`src/run-projection.ts`)
- [x] T012 [S0202] Implement store-backed projection and fresh-instance restart equivalence using only validated complete `RunEventStore` histories (`src/run-projection.ts`, `tests/run-projection.test.ts`, `tests/run-event-test-helpers.ts`)
- [x] T013 [S0202] Record the event transition rules, lifecycle projection, explicit checkpoints, context-compaction boundary, authority separation, restart equivalence, and representative refusal evidence without claiming resume exists (`docs/build-log-week3.md`)

---

## Testing And Completion (5 tasks)

- [x] T014 [S0202] Complete projection contract, legal-prefix, terminal, checkpoint, context minimization, deterministic replay, freeze, and arbitrary malformed or throwing input coverage (`tests/run-projection.test.ts`)
- [x] T015 [S0202] Complete missing, duplicate, cross-run, out-of-order, conflicting, illegal post-terminal core, approval mismatch, fake-result mismatch, unavailable-authority, and visibly indeterminate attempt coverage (`tests/run-projection.test.ts`)
- [x] T016 [S0202] Add fresh JSONL restart-equivalence and affected event, approval, fake-send, exact three-tool permission, and zero-effect regression coverage (`tests/run-projection.test.ts`, `tests/event-store.test.ts`, `tests/approval-service.test.ts`, `tests/fake-send-service.test.ts`, `tests/pi-agent.test.ts`)
- [x] T017 [S0202] Update active tracking and Unreleased notes for deterministic run projection and corruption refusal without claiming lifecycle bounds, replay execution, or resume (`docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T018 [S0202] Run focused tests, strict types, formatting, full verification, coverage, dependency audit, production-agent verification, permission/data scans, ASCII/LF checks, and final session diff review (`src/run-projection.ts`, `tests/run-projection.test.ts`, `package.json`)

---

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview` (next step in the implement -> creview -> validate sequence).

---

## Next Steps

Run the `creview` workflow step.
