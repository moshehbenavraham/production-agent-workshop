# Task Checklist

**Session ID**: `phase02-session06-critical-eval-gate-and-scorecard`
**Total Tasks**: 23
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-11

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup and Contract RED (5 tasks)

- [x] T001 [S0206] Verify clean pushed Session 05 base `8052ff6`, authoritative Phase 02 state, prerequisites, 255-test/18-definition baseline, and Session 06/07 boundary (`.spec_system/state.json`, `docs/todo/05-production-evals.md`)
- [x] T002 [S0206] Map production qualification, tools, approval, fake-write, recovery, lifecycle, event, output, and persistence entrypoints to all 18 selectors (`src/*.ts`, `src/production-eval-golden-set.ts`)
- [x] T003 [S0206] Register the 23-task session plan and active tracking while retaining the bounded 20-entry workflow history (`.spec_system/state.json`, `docs/TODO.md`)
- [x] T004 [S0206] [P] Write RED runtime observation and scorer tests for all critical dimensions, exact identity/order, hostile extras, and unavailable metrics (`tests/production-eval-runner.test.ts`)
- [x] T005 [S0206] [P] Write RED runner/gate tests for all-pass, one/many critical failures, quality-only miss, executor failure, persistence refusal, and actionable scorecard output (`tests/production-eval-runner.test.ts`)

## Runtime Contracts and Deterministic Scoring (6 tasks)

- [x] T006 [S0206] Define closed observation, tool-call, grounding, output-claim, artifact, aggregate, runner/store outcome, and canonical failure contracts (`src/production-eval-runner.ts`)
- [x] T007 [S0206] Validate and defensively clone/freeze observations, artifacts, and public outcomes with exact suite/case/version/result semantics (`src/production-eval-runner.ts`)
- [x] T008 [S0206] Implement deterministic task, tools, argument-matcher, event-order, grounding, permission, approval, recovery, stop, and output-safety scoring (`src/production-eval-runner.ts`)
- [x] T009 [S0206] Keep draft quality, latency, tokens, cost, pending thresholds, and optional model grade separate from critical authority (`src/production-eval-runner.ts`)
- [x] T010 [S0206] Derive aggregate case/dimension counts and status solely from validated case results; preserve every passing/failing result (`src/production-eval-runner.ts`)
- [x] T011 [S0206] Add application-owned safe final-output normalization so deterministic stop state defeats false completion prose (`src/pi-agent.ts`, `tests/pi-agent.test.ts`)

## Deterministic Harness and Full Golden Set (5 tasks)

- [x] T012 [S0206] Implement isolated synthetic paths, stable case identities/clocks, minimized event normalization, and exact cleanup (`src/production-eval-harness.ts`)
- [x] T013 [S0206] Execute input, qualification, ambiguous, unknown, timeout, invalid/prose/adversarial/credential, and bounded-stop cases through production domain/lifecycle boundaries (`src/production-eval-harness.ts`)
- [x] T014 [S0206] Execute grounded draft, approval, bypass, and false-completion cases through production tools and application-owned output state (`src/production-eval-harness.ts`)
- [x] T015 [S0206] Execute permission, downstream, duplicate, restart, and indeterminate cases through durable approval/fake/recovery boundaries with zero real effects (`src/production-eval-harness.ts`)
- [x] T016 [S0206] Prove default execution returns all 18 validated results with complete critical-boundary coverage and explicit provider-independent token/cost values (`tests/production-eval-runner.test.ts`)

## Persistence, Scorecard, and CLI Gate (4 tasks)

- [x] T017 [S0206] Implement private append-only artifact persistence with complete-file validation, flush, exact re-read, conflict/corruption refusal, and replaceable I/O (`src/production-eval-store.ts`)
- [x] T018 [S0206] Render a stable compact all-case scorecard plus bounded expected-versus-observed lines for every critical failure (`src/production-eval-scorecard.ts`)
- [x] T019 [S0206] Orchestrate execute-score-validate-persist-render with canonical operational failure handling and exit-code derivation (`src/production-eval-runner.ts`)
- [x] T020 [S0206] Migrate `npm run eval` and `npm run verify` to the durable 18-case critical gate with a controlled result path and no legacy boolean runner (`src/evals.ts`, `package.json`, `.gitignore`)

## Documentation, Review, and Completion (3 tasks)

- [x] T021 [S0206] Record implemented rubric, result/artifact contract, scorecard, pending thresholds, all-pass run, and one injected non-zero critical refusal in the Week 3 Build Log (`docs/build-log-week3.md`)
- [x] T022 [S0206] Synchronize architecture, development, deployment, TODO, changelog, considerations, and cumulative security without claiming Session 07 break/revert evidence or Phase 02 completion (`docs/`, `.spec_system/*.md`)
- [x] T023 [S0206] Run focused/full tests, types, format/lint, coverage, build, audit, production-agent commands, artifact/permission/data/link/ASCII/LF scans, exact-base review, security review, validation, and PRD reconciliation (`src/production-eval-*.ts`, `tests/production-eval-runner.test.ts`)

---

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview`.

---

## Next Steps

Run `plansession` for
`phase02-session07-boundary-regression-exercises-and-evidence`.
