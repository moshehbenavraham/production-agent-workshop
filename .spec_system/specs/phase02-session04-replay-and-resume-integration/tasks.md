# Task Checklist

**Session ID**: `phase02-session04-replay-and-resume-integration`
**Total Tasks**: 22
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-11

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0204] Verify authoritative Phase 02 state, Sessions 01-03 and Phase 01 authority prerequisites, exact base commit, environment, and green 221-test/5-eval baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`)
- [x] T002 [S0204] Map Task `04` checkpoints, projector/authority shapes, approval duplicate recovery, fake reservation/result projection, draft creation/hash, and legal terminal suffixes (`docs/todo/04-recovery-and-replay.md`, `src/run-projection.ts`, `src/approval-service.ts`, `src/fake-send-store.ts`, `src/tools.ts`)
- [x] T003 [S0204] Fix Session 03 verification metrics in the active Week 3 evidence and record the exact recovery boundary/non-goals before implementation (`docs/build-log-week3.md`, `docs/TODO.md`)

---

## Foundation (5 tasks)

- [x] T004 [S0204] [P] Write contract-first RED tests for closed recovery request/result/failure/action schemas, policy requirements, stable identity, clone/freeze, and hostile values (`tests/recovery-application.test.ts`)
- [x] T005 [S0204] [P] Write RED file-backed restart tests for qualification, draft, approval, exact replay, terminal closure, and line/event counts without manual JSONL editing (`tests/recovery-application.test.ts`)
- [x] T006 [S0204] Define closed recovery actions, policy evidence, request/result/failure contracts, stable draft identity, exact path configuration, and injected boundary types (`src/recovery-application.ts`)
- [x] T007 [S0204] Implement runtime-validated same-run approval/fake authority loading and trusted projection before mutation with canonical structural/storage mapping (`src/recovery-application.ts`)
- [x] T008 [S0204] Implement exact draft candidate generation/verification and stable run/lead/hash-bound draft evidence append (`src/recovery-application.ts`)

---

## Implementation (7 tasks)

- [x] T009 [S0204] Implement policy selection for retry, resume, compensate, escalate, and stop while keeping compensation unsupported and all automatic effects forbidden (`src/recovery-application.ts`)
- [x] T010 [S0204] Implement qualification-checkpoint resume without another qualification attempt, using an application-owned synthetic draft and original run identity (`src/recovery-application.ts`)
- [x] T011 [S0204] Implement draft-checkpoint resume from exact durable draft identity/hash and reject missing or substituted content before approval (`src/recovery-application.ts`)
- [x] T012 [S0204] Implement approval-checkpoint resume and compatible terminal completion using the exact durable pending approval without another request (`src/recovery-application.ts`)
- [x] T013 [S0204] Implement stable same-request replay, exact duplicate reload, and post-write reprojection so partial or late authority cannot manufacture recovery (`src/recovery-application.ts`)
- [x] T014 [S0204] Implement reservation-only/unverified effect escalation, completed-effect stop, and damaged/inconsistent evidence mapping with zero effect adapter dependency (`src/recovery-application.ts`)
- [x] T015 [S0204] Document the recovery decision table, three Mermaid restart timelines, replay proof, retention/redaction/deletion/compaction decision, and exercised failure (`docs/build-log-week3.md`, `docs/environments.md`, `docs/runbooks/incident-response.md`)

---

## Testing And Completion (7 tasks)

- [x] T016 [S0204] Complete fresh-instance qualification, draft, and approval interruption tests with original run/lead/draft/approval identity and one terminal (`tests/recovery-application.test.ts`)
- [x] T017 [S0204] Complete exact replay/idempotency tests proving deeply equal outcomes, stable line counts, one approval, no repeated domain milestones, unchanged result file, and zero effect invocation (`tests/recovery-application.test.ts`)
- [x] T018 [S0204] Complete pending/approved/declined approval and reservation-only/completed/missing/cross-run fake authority tests with explicit escalate/stop behavior (`tests/recovery-application.test.ts`)
- [x] T019 [S0204] Complete malformed, throwing, unavailable, corrupt, truncated, duplicate, out-of-order, cross-run, draft mismatch, terminal mismatch, and partial-write failure tests (`tests/recovery-application.test.ts`)
- [x] T020 [S0204] Preserve bounded lifecycle, projection, approval, fake-send, permission, qualification, HTTP, and exact-three-tool regressions (`tests/run-lifecycle.test.ts`, `tests/run-projection.test.ts`, `tests/safe-write-application.test.ts`, `tests/pi-agent.test.ts`)
- [x] T021 [S0204] Synchronize architecture, development, active tracking, changelog, considerations, and security posture without claiming public/deployed/real-data recovery or Task `05` completion (`docs/ARCHITECTURE.md`, `docs/development.md`, `docs/TODO.md`, `docs/CHANGELOG.md`, `.spec_system/CONSIDERATIONS.md`, `.spec_system/SECURITY-COMPLIANCE.md`)
- [x] T022 [S0204] Run focused tests, strict types, formatting, full verification, coverage, build, dependency audit, production-agent verification, permission/data/link/ASCII/LF scans, and final base-diff review (`src/recovery-application.ts`, `tests/recovery-application.test.ts`, `package.json`)

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
