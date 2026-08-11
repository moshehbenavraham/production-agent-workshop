# Task Checklist

**Session ID**: `phase03-session02-run-timeline-query-and-redaction`
**Total Tasks**: 18
**Estimated Duration**: 2-4 hours
**Created**: 2026-08-12

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0302] Verify the clean Session 01 baseline, active Task `06`, exact Pi allowlist, and read-only reporting boundary (`package.json`, `src/pi-agent.ts`, `docs/todo/06-observability-and-incidents.md`).
- [x] T002 [S0302] Inventory all runtime event variants, projection ordering rules, unavailable metrics, protected fields, and existing file-store failure codes (`src/run-event.ts`, `src/run-projection.ts`, `src/event-store.ts`).

## Foundation (5 tasks)

- [x] T003 [S0302] Add failing closed request, report, timeline-entry, summary, and failure-contract tests (`tests/run-report.test.ts`).
- [x] T004 [S0302] Add failing missing, corrupt, duplicate, out-of-order, cross-run, illegal-sequence, oversized, and hostile-boundary tests (`tests/run-report.test.ts`).
- [x] T005 [S0302] Define closed bounded report schemas and immutable TypeScript types (`src/run-report.ts`).
- [x] T006 [S0302] Implement exact request, read-outcome, event-count, and semantic projection gates before any report mapping (`src/run-report.ts`).
- [x] T007 [S0302] Define finite redacted event, terminal, error, permission, availability, and summary mapping rules (`src/run-report.ts`).

## Implementation (6 tasks)

- [x] T008 [S0302] Build a stable chronological allowlist-only timeline across run, model, tool, approval, domain, effect, and terminal events (`src/run-report.ts`).
- [x] T009 [S0302] Aggregate bounded retries, duration, tokens, cost, checkpoint, status, and terminal facts without inventing provider data (`src/run-report.ts`).
- [x] T010 [S0302] Implement deterministic concise text rendering from the validated machine report (`src/run-report.ts`).
- [x] T011 [S0302] Implement exact CLI argument parsing, safe regular-file preflight, finite failures, exit codes, and JSON/text output (`scripts/run-report.ts`).
- [x] T012 [S0302] Add the `report:run` package command and a bounded preserved synthetic failed-run fixture (`package.json`, `tests/fixtures/run-report-failed.jsonl`).
- [x] T013 [S0302] Add positive builder and subprocess tests for known, failed, stopped, approval/effect, unavailable metric, restart, format parity, and immutable output paths (`tests/run-report.test.ts`).

## Testing And Documentation (5 tasks)

- [x] T014 [S0302] Prove protected content, private paths, raw errors, actor/lead/draft identities, hashes, receipts, arguments, and payloads never enter either output format (`tests/run-report.test.ts`).
- [x] T015 [S0302] Prove CLI input bytes remain unchanged and no Pi, HTTP, approval, execution, retry, or recovery capability is added (`tests/run-report.test.ts`, `src/pi-agent.ts`, `src/server.ts`).
- [x] T016 [S0302] Record the command contract and one exact redacted failed-run report while keeping Task `06` open (`docs/build-log-week4.md`, `docs/TODO.md`, `docs/CHANGELOG.md`).
- [x] T017 [S0302] Run focused tests, `npm run verify`, `npm run test:coverage`, `npm audit`, and the preserved fixture command (`package.json`).
- [x] T018 [S0302] Validate ASCII/LF and inspect the full diff for paths, secrets, personal data, raw evidence, authority drift, permissions, effects, and unsupported claims; update implementation notes.

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview`.

## Next Steps

Run the `creview` workflow step.
