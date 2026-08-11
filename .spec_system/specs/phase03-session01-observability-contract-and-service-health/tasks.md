# Task Checklist

**Session ID**: `phase03-session01-observability-contract-and-service-health`
**Total Tasks**: 18
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-12

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0301] Verify the Phase 02 baseline, Node/npm prerequisites, and exact three-tool allowlist before changing observability (`package.json`, `src/pi-agent.ts`, `npm run verify`).
- [x] T002 [S0301] Inventory existing service, run, model, tool, approval, recovery, and terminal evidence against the Session 01 field contract (`src/server.ts`, `src/run-event.ts`, `src/run-lifecycle.ts`, `docs/build-log-week4.md`).

---

## Foundation (5 tasks)

- [x] T003 [S0301] Add failing closed-variant, extra-property, and correlation tests for service, run, model, and tool observations (`tests/observability.test.ts`).
- [x] T004 [S0301] Add failing tagged-availability, numeric-bound, token-total, and finite-vocabulary tests (`tests/observability.test.ts`).
- [x] T005 [S0301] Define closed four-layer TypeBox schemas and exported observation types with exact run correlation (`src/observability.ts`).
- [x] T006 [S0301] Implement semantic validators and immutable factories for discriminants, token totals, identities, timestamps, and bounds (`src/observability.ts`).
- [x] T007 [S0301] Define validated service collector options and injected process, storage, queue, clock, and dependency boundaries before invoking acquired resources (`src/observability.ts`).

---

## Implementation (6 tasks)

- [x] T008 [S0301] Implement uptime, memory, and CPU collection with explicit units, measured-zero preservation, and bounded unavailable categories (`src/observability.ts`).
- [x] T009 [S0301] Implement optional storage and queue collection with bounded identifiers and no emitted path or private target detail (`src/observability.ts`).
- [x] T010 [S0301] Implement bounded configured dependency collection with isolated failure handling and deterministic ordering (`src/observability.ts`).
- [x] T011 [S0301] Assemble and freeze one validated service snapshot with environment, application version, canonical timestamp, and no authority-bearing fields (`src/observability.ts`).
- [x] T012 [S0301] Add success, measured-zero, empty, maximum-bound, and immutable collector coverage (`tests/observability.test.ts`).
- [x] T013 [S0301] Add malformed-return, duplicate-identifier, thrown-boundary, redaction, and independent dependency-failure coverage (`tests/observability.test.ts`).

---

## Testing And Documentation (5 tasks)

- [x] T014 [S0301] Prove the public health response and production Pi allowlist remain unchanged (`tests/pi-agent.test.ts`, `src/server.ts`).
- [x] T015 [S0301] Record the four-layer field map, tagged availability semantics, controlled boundary, and focused evidence (`docs/build-log-week4.md`).
- [x] T016 [S0301] Record incremental Task `06` progress and the observability behavior change without claiming task completion (`docs/TODO.md`, `docs/CHANGELOG.md`).
- [x] T017 [S0301] Run focused tests, `npm run verify`, `npm run test:coverage`, and `npm audit` (`tests/observability.test.ts`, `package.json`).
- [x] T018 [S0301] Validate ASCII/LF, inspect the full session diff for permissions, secrets, protected data, side effects, and authority drift, and update implementation notes (`.spec_system/specs/phase03-session01-observability-contract-and-service-health/implementation-notes.md`).

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
