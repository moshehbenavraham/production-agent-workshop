# Task Checklist

**Session ID**: `phase02-session05-production-eval-contract-and-golden-set`
**Total Tasks**: 20
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-11

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0205] Verify authoritative Phase 02 state, Session 04/Task `04` completion, exact pushed base, environment prerequisites, and green 238-test/5-eval baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`)
- [x] T002 [S0205] Map Task `05`, the Session 05 stub, five legacy eval intentions, production tools/events/stops, approval/fake/recovery authority, and Session 06/07 boundaries (`docs/todo/05-production-evals.md`, `src/evals.ts`, `src/run-event.ts`, `src/pi-agent.ts`)
- [x] T003 [S0205] Remove two inherited non-blocking recovery lint warnings and record Session 05 as active from base `90e39ff` without changing recovery behavior (`src/recovery-application.ts`, `docs/TODO.md`, `.spec_system/state.json`)

---

## Contract Foundation (5 tasks)

- [x] T004 [S0205] [P] Write contract-first RED tests for closed case, fixture, expectation, rubric, trace, metric, score, version, result, and suite shapes (`tests/production-eval.test.ts`)
- [x] T005 [S0205] [P] Write RED suite-integrity tests for count, unique IDs, behavior categories, critical-boundary coverage, legacy mappings, freeze, and hostile values (`tests/production-eval.test.ts`)
- [x] T006 [S0205] Define finite eval identity, category, boundary, fixture, injected-boundary, tool, event, permission, recovery, stop, and output contracts with defensive guards (`src/production-eval.ts`)
- [x] T007 [S0205] Define explicit available/unavailable latency, token, and cost contracts plus bounded application/prompt/model/fixture/suite/commit version metadata (`src/production-eval.ts`)
- [x] T008 [S0205] Define minimized trace, dimension observation, deterministic critical status, non-blocking quality/model grade, aggregate result, and canonical validation outcomes (`src/production-eval.ts`)

---

## Golden Set and Semantics (6 tasks)

- [x] T009 [S0205] Implement schema-plus-semantic suite validation for inventory bounds, cloning, uniqueness, version consistency, supported selections, and canonical error categories (`src/production-eval.ts`)
- [x] T010 [S0205] Implement the critical/non-blocking rubric and prohibit model grading from critical dimensions (`src/production-eval-golden-set.ts`, `src/production-eval.ts`)
- [x] T011 [S0205] Define deterministic request, synthetic fixture, model, qualification, approval, event-store, recovery, fake-adapter, and clock selectors for later execution (`src/production-eval-golden-set.ts`)
- [x] T012 [S0205] Declare exactly 18 pre-execution cases spanning happy, ambiguous, malformed, unknown, timeout, permission, credential, downstream, duplicate, restart, invalid-model, adversarial, bypass, false-completion, escalation, and bounded-stop behavior (`src/production-eval-golden-set.ts`)
- [x] T013 [S0205] Map every critical client boundary and all five legacy eval intentions to deterministic case expectations (`src/production-eval-golden-set.ts`)
- [x] T014 [S0205] Export only a deeply frozen validated suite and canonical validation result; reject invalid inventory at module initialization (`src/production-eval-golden-set.ts`)

---

## Testing, Documentation, and Completion (6 tasks)

- [x] T015 [S0205] Complete positive contract/result/metric/version/trace tests including explicit unavailable provider values and separate optional quality grading (`tests/production-eval.test.ts`)
- [x] T016 [S0205] Complete negative semantic tests for duplicate IDs, count bounds, uncovered categories/boundaries, missing critical expectations, illegal model graders, unsupported selections, and argument/event contradictions (`tests/production-eval.test.ts`)
- [x] T017 [S0205] Prove exact 18-case inventory coverage, immutable nested exports, deterministic clone validation, bounded synthetic content, and zero execution/effect behavior (`tests/production-eval.test.ts`)
- [x] T018 [S0205] Document the golden-set inventory, critical/non-blocking rubric, explicit metric/version policy, five legacy mappings, and Session 06/07 handoff (`docs/build-log-week3.md`)
- [x] T019 [S0205] Synchronize architecture, development, TODO, changelog, considerations, and cumulative security posture without claiming execution, deployment blocking, scorecard, provider, or red/fix/green completion (`docs/ARCHITECTURE.md`, `docs/development.md`, `docs/TODO.md`, `docs/CHANGELOG.md`, `.spec_system/CONSIDERATIONS.md`, `.spec_system/SECURITY-COMPLIANCE.md`)
- [x] T020 [S0205] Run focused tests, strict types, format/lint, full verification, coverage, build, dependency audit, production-agent checks, permission/data/link/ASCII/LF scans, and final base-diff review (`src/production-eval.ts`, `src/production-eval-golden-set.ts`, `tests/production-eval.test.ts`)

---

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview`.

---

## Next Steps

Run the `implement` workflow step.
