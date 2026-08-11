# Task Checklist

**Session ID**: `phase01-session02-approval-store-and-projection`
**Total Tasks**: 14
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0102] Verify Apex state, Session 01 completion, exact base, required Node/npm toolchain, persistent path contract, and green baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `Dockerfile`, `.gitignore`, `package.json`)
- [x] T002 [S0102] Read Session 01 contracts/review handoff, Task `02`, file/event patterns, tests, and bounded storage assumptions (`src/approval.ts`, `src/event-store.ts`, `tests/event-store.test.ts`, `docs/build-log-week2.md`)

---

## Foundation (4 tasks)

- [x] T003 [S0102] Write contract-first RED tests for pure projection, file append/read, restart, corruption, ordering, duplicate, and injected I/O failure behavior (`tests/approval-store.test.ts`)
- [x] T004 [S0102] Implement raw JSONL loading with missing-file handling, final-LF interruption detection, unknown JSON parsing, and closed record validation (`src/approval-store.ts`)
- [x] T005 [S0102] Implement deterministic projection with record-ID uniqueness, monotonic ordering, exact request/decision identity, terminal exclusivity, and no mutable cache (`src/approval-store.ts`)
- [x] T006 [S0102] Implement flush-before-success append through an injected writer with safe descriptor cleanup and canonical storage errors (`src/approval-store.ts`)

---

## Implementation (4 tasks)

- [x] T007 [S0102] Implement `get` and `listRun` from a fresh validated projection on every call (`src/approval-store.ts`)
- [x] T008 [S0102] Implement pending request append with duplicate detection, durable re-read, and no in-memory success on write/read failure (`src/approval-store.ts`)
- [x] T009 [S0102] Implement terminal decision append with exact pending-state checks, identical-terminal idempotency, conflict refusal, and durable re-read (`src/approval-store.ts`)
- [x] T010 [S0102] Add pending/approved/declined restart, duplicate, ordering, corruption, truncation, and injected storage-failure coverage (`tests/approval-store.test.ts`)

---

## Documentation And Completion (4 tasks)

- [x] T011 [S0102] Record file layout, durability assumptions, restart command/evidence, and exercised damaged-record refusal (`docs/build-log-week2.md`)
- [x] T012 [S0102] Update active tracking and Unreleased notes without claiming Pi/application integration (`docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T013 [S0102] Run focused store tests, strict types, formatting, full verification, and dependency/security/data scans (`src/approval-store.ts`, `tests/approval-store.test.ts`, `package.json`)
- [x] T014 [S0102] Validate ASCII/LF, inspect every base-commit diff and untracked file, update final evidence, and confirm the next command is `creview` (`.spec_system/specs/phase01-session02-approval-store-and-projection/`, `docs/build-log-week2.md`)

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
