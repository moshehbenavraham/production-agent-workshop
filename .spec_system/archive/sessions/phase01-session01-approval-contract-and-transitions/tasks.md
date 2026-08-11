# Task Checklist

**Session ID**: `phase01-session01-approval-contract-and-transitions`
**Total Tasks**: 14
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0101] Verify authoritative Apex state, Phase 00 prerequisites, base commit, required Node/npm toolchain, and green pre-session baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`)
- [x] T002 [S0101] Map Task `02`, Phase 01 Session 01, governance, legacy approval/event shapes, tests, and exact domain boundary (`docs/todo/02-durable-approvals.md`, `.spec_system/PRD/phase_01/session_01_approval_contract_and_transitions.md`, `src/tools.ts`, `src/event-store.ts`, `tests/`)

---

## Foundation (4 tasks)

- [x] T003 [S0101] Write contract-first RED tests for closed approval variants, semantic validation, storage records, operational event data, and transition exports (`tests/approval.test.ts`)
- [x] T004 [S0101] Define prefixed identities, ISO timestamps, immutable target/draft linkage, and closed pending/terminal approval schemas with runtime semantic validation (`src/approval.ts`)
- [x] T005 [S0101] Define closed decision input, canonical failure, transitioned/duplicate/conflict result unions, and their validators (`src/approval.ts`)
- [x] T006 [S0101] Define the replaceable approval-store interface plus closed request/decision storage record and minimized operational event data contracts (`src/approval.ts`)

---

## Implementation (4 tasks)

- [x] T007 [S0101] Implement deterministic pending approval construction with application-owned IDs, timestamps, exact target, and SHA-256 draft linkage (`src/approval.ts`)
- [x] T008 [S0101] Implement pure decision transition enforcement with schema-validated input and authorization at the domain boundary closest to protected state (`src/approval.ts`)
- [x] T009 [S0101] Implement terminal duplicate/conflict handling that returns immutable original state and never creates another transition (`src/approval.ts`)
- [x] T010 [S0101] Add source-backed Mermaid state flow, storage contract, transition examples, and failure matrix without claiming persistence exists (`docs/build-log-week2.md`)

---

## Testing And Completion (4 tasks)

- [x] T011 [S0101] Complete valid pending-to-approved/declined and schema/semantic validator coverage (`tests/approval.test.ts`)
- [x] T012 [S0101] Complete missing, malformed, unknown-actor, identity-mismatch, duplicate, conflict, and invalid-current-record refusal coverage (`tests/approval.test.ts`)
- [x] T013 [S0101] Update active tracking and Unreleased notes for the approval domain boundary without claiming file persistence or integration (`docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T014 [S0101] Run focused tests, strict types, formatting, full deterministic verification, dependency audit, permission/data scans, ASCII/LF checks, and final session diff review (`src/approval.ts`, `tests/approval.test.ts`, `package.json`)

---

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview` (next step in the implement -> creview -> validate sequence).

---

## Next Steps

Run the `implement` workflow step.
