# Task Checklist

**Session ID**: `phase01-session04-fake-send-contract-and-authorization`
**Total Tasks**: 17
**Estimated Duration**: 2-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

## Setup And Contract Discovery (3 tasks)

- [x] T001 [S0104] Verify the clean pushed Session 03 base, Apex state, Node/npm toolchain, 93-test baseline, and unchanged production allowlist
- [x] T002 [S0104] Read Task `03`, Session 04 PRD, durable approval contracts/store/service, and Session 03 handoff/security evidence; map trust and cutoff boundaries
- [x] T003 [S0104] Write contract-first RED tests for closed request/command/error/adapter/event/result/store schemas and runtime guards (`tests/fake-send.test.ts`)

## Fake-Send Contracts (5 tasks)

- [x] T004 [S0104] Define closed request identity, authorized command, failure vocabulary, and canonical failure construction (`src/fake-send.ts`)
- [x] T005 [S0104] Define fake adapter input/outcome, abort-aware timeout ownership, redacted evidence, and no-compensation contracts (`src/fake-send.ts`, `src/fake-send-result.ts`)
- [x] T006 [S0104] Define reservation, terminal result, projection, and replaceable result-store claim/complete/read outcomes (`src/fake-send-result.ts`)
- [x] T007 [S0104] Implement semantic runtime validators for command, outcomes, evidence, storage records, and replaceable-store responses (`src/fake-send.ts`, `src/fake-send-result.ts`)
- [x] T008 [S0104] Implement the versioned length-delimited idempotency key and field-sensitivity tests (`src/fake-send.ts`, `tests/fake-send.test.ts`)

## Pre-Effect Authorization (5 tasks)

- [x] T009 [S0104] Implement the ApprovalStore-backed authorizer with safe dependency narrowing and canonical storage failures (`src/fake-send.ts`)
- [x] T010 [S0104] Enforce invalid-input and unauthorized-actor precedence before approval lookup (`src/fake-send.ts`, `tests/fake-send.test.ts`)
- [x] T011 [S0104] Reject missing, malformed, pending, declined, and cross-run approval state before command creation (`src/fake-send.ts`, `tests/fake-send.test.ts`)
- [x] T012 [S0104] Independently compare action, target lead, and draft ID, then derive all executable fields from the approved record (`src/fake-send.ts`, `tests/fake-send.test.ts`)
- [x] T013 [S0104] Prove every denial yields a typed actionable result and zero future-adapter spy calls; prove success yields one exact derived command only in the harness (`tests/fake-send.test.ts`)

## Documentation And Completion (4 tasks)

- [x] T014 [S0104] Add the draft write contract, authorization precedence/permission table, stable-key inputs, crash window, compensation, and no-effect evidence (`docs/build-log-week2.md`)
- [x] T015 [S0104] Update active TODO and Unreleased changelog without claiming execution, persistence, Pi send permission, or human review (`docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T016 [S0104] Run focused tests, formatter, strict types, full verification, dependency audit, and route/network/credential/allowlist/content scans
- [x] T017 [S0104] Inspect every base diff and untracked file, validate ASCII/LF, record implementation evidence and remaining risks, and confirm next command `creview`

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All text files ASCII with LF endings.
- [x] `implementation-notes.md` records RED/GREEN and complete evidence.
- [x] Ready for `creview` in the required workflow sequence.

## Next Steps

Run `creview` for Session 04.
