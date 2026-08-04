# Task Checklist

**Session ID**: `phase01-session03-durable-approval-integration`
**Total Tasks**: 16
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0103] Verify clean pushed base, Apex state, prerequisites, persistent paths, Node/npm toolchain, and 70-test baseline (`.spec_system/scripts/`, `Dockerfile`, `.env.example`, `package.json`)
- [x] T002 [S0103] Read Task `02`, Sessions 01-02 handoff evidence, tool/event/run composition, and map exact trust, consistency, lifecycle, and out-of-scope boundaries (`src/approval.ts`, `src/approval-store.ts`, `src/tools.ts`, `src/pi-agent.ts`, `src/event-store.ts`)

---

## Application Service Foundation (5 tasks)

- [x] T003 [S0103] Write contract-first RED tests for durable request/decision service, minimized events, restart, duplicate/conflict, recovery, and injected store failures (`tests/approval-service.test.ts`)
- [x] T004 [S0103] Export request validation and implement the service's safe metadata, event validation/append/read, failure canonicalization, and projection access boundaries (`src/approval.ts`, `src/approval-service.ts`)
- [x] T005 [S0103] Implement exact durable request creation, duplicate detection, state-first event emission, and missing-request-event recovery (`src/approval-service.ts`)
- [x] T006 [S0103] Implement authorized approve/decline, missing/malformed/unknown-actor refusal, terminal duplicate/conflict semantics, and missing-terminal-event recovery (`src/approval-service.ts`)
- [x] T007 [S0103] Complete service restart, line-count, event-shape, redaction, arbitrary-dependency, and no-second-transition coverage (`tests/approval-service.test.ts`)

---

## Runtime Integration (5 tasks)

- [x] T008 [S0103] Replace full-content draft events with temporary exact draft evidence plus minimized identifier/hash events (`src/tools.ts`, `tests/qualification-tool.test.ts`)
- [x] T009 [S0103] Delegate the Pi approval-request tool to the durable service, reject stale/mismatched drafts, and return only typed pending/refusal details (`src/tools.ts`, `tests/qualification-tool.test.ts`, `tests/tools.test.ts`, `src/evals.ts`)
- [x] T010 [S0103] Compose `FileApprovalStore` and `ApprovalService` at configured `APPROVAL_LOG_PATH` with one synthetic internal actor while preserving the exact three-tool allowlist (`src/pi-agent.ts`, `Dockerfile`, `.env.example`)
- [x] T011 [S0103] Derive run stop state from validated durable projection, add explicit `approval_failed`, and refuse missing/stale/cross-run/malformed approval evidence (`src/pi-agent.ts`, `tests/pi-agent.test.ts`)
- [x] T012 [S0103] Run focused service/tool/Pi integration tests proving pending and terminal restart parity, minimized event order, storage failures, and no Pi/HTTP/send expansion (`tests/approval-service.test.ts`, `tests/qualification-tool.test.ts`, `tests/pi-agent.test.ts`)

---

## Documentation And Completion (4 tasks)

- [x] T013 [S0103] Document approval path configuration plus exact synthetic retention, redaction, export, deletion, recovery, and no-real-data rules (`docs/environments.md`, `docs/deployment.md`, `docs/development.md`, `docs/build-log-week2.md`)
- [x] T014 [S0103] Complete Task `02` Week 2 evidence and update active tracking/Unreleased notes without claiming public approval or fake-send capability (`docs/build-log-week2.md`, `docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T015 [S0103] Run focused tests, formatting, strict types, full verification, dependency audit, and permission/credential/data/capability scans (`package.json`, session deliverables)
- [x] T016 [S0103] Validate ASCII/LF, inspect every base diff and untracked file, record final evidence/remaining risks, and confirm the next command is `creview` (session files and complete diff)

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
