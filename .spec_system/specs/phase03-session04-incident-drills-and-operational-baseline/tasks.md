# Task Checklist

**Session ID**: `phase03-session04-incident-drills-and-operational-baseline`
**Total Tasks**: 20
**Estimated Duration**: 2-4 hours
**Created**: 2026-08-12

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0304] Verify the clean Session 03 baseline, Task `06` acceptance criteria, exact Pi/HTTP/effect boundaries, and five golden case definitions.
- [x] T002 [S0304] Inventory harness lifecycle, temporary store cleanup, report construction, eval scoring, alert semantics, and recovery/permission observation fields.
- [x] T003 [S0304] Predeclare exact drill IDs, case IDs, event order, outcome/stop, alert decision, recovery/runbook action, effect count, and operator steps.

## Foundation (5 tasks)

- [x] T004 [S0304] Add failing closed manifest, result, baseline, suite, and failure-contract tests (`tests/incident-drills.test.ts`).
- [x] T005 [S0304] Add failing five-case chronology, score, alert, recovery, effect-count, cleanup, and redaction tests (`tests/incident-drills.test.ts`).
- [x] T006 [S0304] Add a safe harness execution returning only minimized observation plus validated `RunReport` before cleanup (`src/production-eval-harness.ts`).
- [x] T007 [S0304] Define exact five-drill manifest and immutable closed types (`src/incident-drills.ts`).
- [x] T008 [S0304] Define whole-result semantic validation and finite canonical drill failures (`src/incident-drills.ts`).

## Implementation (7 tasks)

- [x] T009 [S0304] Execute and score each manifest case against the existing golden suite (`src/incident-drills.ts`).
- [x] T010 [S0304] Compare exact report `runId`, event order, outcome, stop, and safe checkpoint with the manifest (`src/incident-drills.ts`).
- [x] T011 [S0304] Map actual results to valid minimized run/dependency observations and evaluate the relevant default alert (`src/incident-drills.ts`).
- [x] T012 [S0304] Verify same-run restart resume with zero effects and duplicate stable outcome with one effect (`src/incident-drills.ts`).
- [x] T013 [S0304] Capture measured latency, explicit provider-independent token/cost absence, event explainability, and operator-step baseline (`src/incident-drills.ts`).
- [x] T014 [S0304] Implement exact ordered suite execution, fail-fast canonical errors, immutability, and no raw evidence escape (`src/incident-drills.ts`).
- [x] T015 [S0304] Add a no-input JSON drill command with canonical stdout/stderr and exit status (`scripts/incident-drills.ts`, `package.json`).

## Testing And Documentation (5 tasks)

- [x] T016 [S0304] Prove end-to-end behavior, semantic guards, hostile/uncloneable input, stable order, command output, cleanup, and protected-value omission (`tests/incident-drills.test.ts`).
- [x] T017 [S0304] Complete Week 4 Task `06` timeline, alert, runbook, recovery, baseline, verification, and remaining-risk evidence (`docs/build-log-week4.md`).
- [x] T018 [S0304] Add drill navigation and close Task `06` progress only after the evidence passes (`docs/runbooks/agent-incident-response.md`, `docs/TODO.md`, `docs/CHANGELOG.md`).
- [x] T019 [S0304] Run focused tests, `npm run verify`, `npm run test:coverage`, command smoke, and `npm audit`.
- [x] T020 [S0304] Validate ASCII/LF and inspect the full diff for secrets, personal data, raw events, paths, permissions, effects, retained state, unsupported claims, and phase cutoff; update implementation notes.

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview`.

## Next Steps

Session complete. Plan Session 05 from the controlled-release stub.
