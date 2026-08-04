# Task Checklist

**Session ID**: `phase01-session05-idempotent-fake-send-execution`
**Total Tasks**: 19
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

## Setup And RED Contracts (3 tasks)

- [x] T001 [S0105] Verify clean pushed Session 04 base, Apex state, Node/npm toolchain, 108-test baseline, and exact unchanged production allowlist
- [x] T002 [S0105] Read Task `03`, Session 05 PRD, fake-send/approval/store/event contracts, and Session 04 handoff; map state/event/effect ordering and crash windows
- [x] T003 [S0105] Add RED execution-outcome, result-store adapter, and service tests before implementation (`src/fake-send-result.ts`, `tests/fake-send-store.test.ts`, `tests/fake-send-service.test.ts`)

## Durable Result Store (5 tasks)

- [x] T004 [S0105] Implement complete-file JSONL load and ordered projection with closed record validation and typed corruption/interruption refusal (`src/fake-send-store.ts`)
- [x] T005 [S0105] Implement mode-0600 append, flush/close, exception containment, and post-write durable re-read (`src/fake-send-store.ts`)
- [x] T006 [S0105] Implement exact durable reservation claim, completed duplicate return, in-progress refusal, and same-key identity conflict behavior (`src/fake-send-store.ts`)
- [x] T007 [S0105] Implement exact terminal completion, idempotent retry, conflicting-result refusal, and restart projection (`src/fake-send-store.ts`)
- [x] T008 [S0105] Complete restart, line-count, corruption, truncation, ordering, duplicate/conflict, and injected reader/writer/metadata regressions (`tests/fake-send-store.test.ts`)

## Idempotent Execution Service (7 tasks)

- [x] T009 [S0105] Define and validate closed executed/duplicate/in-progress/failure application outcomes (`src/fake-send-execution.ts`, `tests/fake-send.test.ts`)
- [x] T010 [S0105] Implement safe authorization, reservation metadata, replaceable store/event narrowing, and canonical exception boundaries (`src/fake-send-service.ts`)
- [x] T011 [S0105] Enforce claim-before-attempt-before-effect and stop on attempt-event failure without adapter invocation (`src/fake-send-service.ts`, `tests/fake-send-service.test.ts`)
- [x] T012 [S0105] Implement one abort-aware fake adapter invocation with accepted, rejected, thrown/rejected/malformed downstream, timeout, and late-settlement handling (`src/fake-send-adapter.ts`, `src/fake-send-service.ts`, `tests/fake-send-service.test.ts`)
- [x] T013 [S0105] Persist one exact terminal result before terminal event and fail visibly on post-effect completion-store outage (`src/fake-send-service.ts`, `tests/fake-send-service.test.ts`)
- [x] T014 [S0105] Return exact durable originals for completed duplicates/restarts, refuse reservations, and recover missing terminal event evidence (`src/fake-send-service.ts`, `tests/fake-send-service.test.ts`)
- [x] T015 [S0105] Prove concurrent same-process calls produce one claim and adapter effect plus deterministic minimized events (`tests/fake-send-service.test.ts`)

## Documentation And Completion (4 tasks)

- [x] T016 [S0105] Replace contract-only Task `03` placeholders with durable idempotency proof, event order, test matrix, sample evidence, timeout/late/crash guidance, and remaining limitations (`docs/build-log-week2.md`)
- [x] T017 [S0105] Update active TODO and Unreleased changelog without claiming Pi/HTTP integration, real sending, distributed safety, or human review (`docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T018 [S0105] Run focused tests, formatter, strict types, full verification, dependency audit, persistence/permission/credential/network/content scans, and ASCII/LF checks
- [x] T019 [S0105] Inspect every base diff and untracked file, record implementation evidence/remaining risks, and confirm next command `creview`

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All text files ASCII with LF endings.
- [x] `implementation-notes.md` records RED/GREEN, durability, crash, event, and cutoff evidence.
- [x] Ready for `creview` in the required workflow sequence.

## Next Steps

Run `creview` for Session 05.
