# Task Checklist

**Session ID**: `phase02-session01-durable-run-event-contract-and-store`
**Total Tasks**: 18
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-11

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0201] Verify authoritative Phase 02 state, Phase 01 prerequisites, base commit, required toolchain, and green pre-session baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`)
- [x] T002 [S0201] Map Task `04`, governance, current event producers and consumers, Phase 01 persistence patterns, permission boundaries, and minimized data constraints (`docs/todo/04-recovery-and-replay.md`, `src/event-store.ts`, `src/pi-agent.ts`, `src/tools.ts`, `src/approval-service.ts`, `src/fake-send-service.ts`)

---

## Foundation (5 tasks)

- [x] T003 [S0201] [P] Write contract-first RED tests for closed event envelopes, metadata availability, owned payload variants, semantic validation, namespace agreement, and canonical failures (`tests/run-event.test.ts`)
- [x] T004 [S0201] [P] Expand RED store tests for private durable append, full-file validation, restart, truncation, corruption, duplicate identity, no-op writes, and injected I/O failures (`tests/event-store.test.ts`)
- [x] T005 [S0201] Define versioned event identity, `runId`, ISO timestamp, bounded operational metadata, and canonical failure schemas with exhaustive runtime guards (`src/run-event.ts`)
- [x] T006 [S0201] Define minimized closed run, normalized Pi, qualification, draft, approval, and fake-send payload variants with exact type/data discriminant binding (`src/run-event.ts`)
- [x] T007 [S0201] Define the replaceable append/read event-store contract and frozen success/failure outcomes that reject invalid adapter results (`src/run-event.ts`)

---

## Implementation (6 tasks)

- [x] T008 [S0201] Refactor event-store construction to validate exact paths and injected identity, clock, reader, writer, open, sync, and close boundaries before filesystem creation (`src/event-store.ts`)
- [x] T009 [S0201] Implement schema-validated private JSONL append with duplicate-trigger prevention while in-flight, complete LF records, durable flush/close, and exact re-read confirmation (`src/event-store.ts`)
- [x] T010 [S0201] Implement complete-file read validation with deterministic ordering, duplicate-ID, truncation, malformed-record, invalid-namespace, and storage error mapping before `runId` filtering (`src/event-store.ts`)
- [x] T011 [S0201] Migrate run, normalized Pi, qualification, and draft producers and consumers to the closed contract with schema-validated inputs and explicit failure mapping (`src/pi-agent.ts`, `src/tools.ts`)
- [x] T012 [S0201] Migrate approval and fake-send operational event boundaries and shared-log checks while preserving dedicated authorization and result truth (`src/approval-service.ts`, `src/fake-send-service.ts`)
- [x] T013 [S0201] Record the closed event schema, storage contract, minimized examples, compatibility decision, and corruption refusal without claiming projection or resume exists (`docs/build-log-week3.md`)

---

## Testing And Completion (5 tasks)

- [x] T014 [S0201] Complete event contract tests for every variant, semantic guard, unavailable metric, minimization rule, invalid extra, and arbitrary thrown dependency (`tests/run-event.test.ts`)
- [x] T015 [S0201] Complete event-store append/read/restart/private-mode/corruption/truncation/duplicate/order/no-op/injected-I/O coverage (`tests/event-store.test.ts`)
- [x] T016 [S0201] Add affected run, qualification, approval, fake-send, and exact three-tool permission regressions over the shared closed event boundary (`tests/pi-agent.test.ts`, `tests/qualification-tool.test.ts`, `tests/approval-service.test.ts`, `tests/fake-send-service.test.ts`)
- [x] T017 [S0201] Update active tracking and Unreleased notes for the durable event contract and store without claiming run projection, bounds, replay, or resume (`docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T018 [S0201] Run focused tests, strict types, formatting, full verification, coverage, dependency audit, production-agent verification, permission/data scans, ASCII/LF checks, and final session diff review (`src/run-event.ts`, `src/event-store.ts`, `tests/run-event.test.ts`, `tests/event-store.test.ts`, `package.json`)

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
