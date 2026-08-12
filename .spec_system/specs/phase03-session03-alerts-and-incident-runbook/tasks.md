# Task Checklist

**Session ID**: `phase03-session03-alerts-and-incident-runbook`
**Total Tasks**: 18
**Estimated Duration**: 2-4 hours
**Created**: 2026-08-12

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0303] Verify the clean Session 02 baseline, Task `06` boundary, exact Pi allowlist, HTTP surface, and current incident guidance (`package.json`, `src/pi-agent.ts`, `src/server.ts`, `docs/runbooks/incident-response.md`).
- [x] T002 [S0303] Inventory observation variants, measurement availability, run report facts, recovery policy/actions, indeterminate-effect rules, and protected fields (`src/observability.ts`, `src/run-report.ts`, `src/recovery-application.ts`).

## Foundation (5 tasks)

- [x] T003 [S0303] Add failing closed policy, rule, window, suppression, evidence, result, severity, operator-action, and failure-contract tests (`tests/alerts.test.ts`).
- [x] T004 [S0303] Add failing threshold, unavailable, queue-not-applicable, suppression, bounds, hostile-input, and immutability tests (`tests/alerts.test.ts`).
- [x] T005 [S0303] Define seven closed discriminated alert variants and immutable TypeScript types (`src/alerts.ts`).
- [x] T006 [S0303] Define bounded whole-request validation, UTC window semantics, stable rule order, and finite canonical failures (`src/alerts.ts`).
- [x] T007 [S0303] Define allowlist-only evidence summaries and exact clear, triggered, suppressed, unavailable, and not-applicable result contracts (`src/alerts.ts`).

## Implementation (6 tasks)

- [x] T008 [S0303] Implement repeated-failure and dangerous-permission counts with deterministic threshold edges and below-threshold clear behavior (`src/alerts.ts`).
- [x] T009 [S0303] Implement stuck-run and cost-spike measurement evaluation with explicit unavailable propagation (`src/alerts.ts`).
- [x] T010 [S0303] Implement unavailable-dependency, storage-pressure, and queue-pressure evaluation with queue not-applicable semantics (`src/alerts.ts`).
- [x] T011 [S0303] Implement finite cooldown suppression without hiding trigger evidence or mutating caller inputs (`src/alerts.ts`).
- [x] T012 [S0303] Write the canonical pause, inspect, retry, resume, compensate, escalate, and stop guide grounded in current commands and internal boundaries (`docs/runbooks/agent-incident-response.md`).
- [x] T013 [S0303] Reconcile general incident guidance and add the implemented alert table and runbook navigation (`docs/runbooks/incident-response.md`, `docs/build-log-week4.md`).

## Testing And Documentation (5 tasks)

- [x] T014 [S0303] Prove all variants, thresholds, windows, suppression edges, stable ordering, explicit absence, and immutable outputs (`tests/alerts.test.ts`).
- [x] T015 [S0303] Prove paths, URLs, credentials, provider payloads, raw errors, lead/draft/approval/effect details, and unexpected rule data never enter outcomes (`tests/alerts.test.ts`).
- [x] T016 [S0303] Update Task `06` progress and the changelog without presenting alerts as delivered or incident drills as complete (`docs/TODO.md`, `docs/CHANGELOG.md`).
- [x] T017 [S0303] Run focused tests, `npm run verify`, `npm run test:coverage`, and `npm audit` (`package.json`).
- [x] T018 [S0303] Validate ASCII/LF and inspect the full diff for secrets, personal data, raw evidence, authority drift, permissions, effects, unsupported operations, and notification claims; update implementation notes.

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview`.

## Next Steps

Run the `updateprd` workflow step.
