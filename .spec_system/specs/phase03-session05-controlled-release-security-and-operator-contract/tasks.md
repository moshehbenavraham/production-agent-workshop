# Task Checklist

**Session ID**: `phase03-session05-controlled-release-security-and-operator-contract`
**Total Tasks**: 20
**Estimated Duration**: 2-4 hours
**Created**: 2026-08-12

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0305] Verify the clean Session 04 base, Task `07`, Docker/environment/deployment contracts, cumulative security findings, and skipped production infrastructure checks.
- [x] T002 [S0305] Inventory exact source/image/runtime/exposure/secret/persistence/monitoring/backup/recovery/rollback facts and current Pi/HTTP/effect/deployment boundaries.
- [x] T003 [S0305] Predeclare finite owner roles, decision IDs, validation methods, evidence slots, pre-public gates, check order, result states, and canonical failures.

## Foundation (5 tasks)

- [x] T004 [S0305] Add failing closed schema, whole-tree preflight, semantic guard, immutability, and minimized-output tests (`tests/release-preflight.test.ts`).
- [x] T005 [S0305] Add failing controlled/public exposure, source/image, runtime, ownership, target-readiness, and public-gate tests (`tests/release-preflight.test.ts`).
- [x] T006 [S0305] Define exact finite inventories and closed TypeBox request/result/failure contracts (`src/release-preflight.ts`).
- [x] T007 [S0305] Implement own-data preflight, semantic request/result validation, canonical failures, cloning, and deep freeze (`src/release-preflight.ts`).
- [x] T008 [S0305] Add the deliberately incomplete redacted example with explicit image/target pending state (`docs/fixtures/release-preflight-incomplete.json`).

## Implementation (7 tasks)

- [x] T009 [S0305] Evaluate controlled mode so external HTTPS health and private/edge-restricted `/runs` cannot imply public readiness (`src/release-preflight.ts`).
- [x] T010 [S0305] Evaluate public mode only when every identity, authorization, tenant, proxy, shared-rate, body, human-decision, lifecycle, WAF, and alert gate is confirmed (`src/release-preflight.ts`).
- [x] T011 [S0305] Evaluate exact source revision, clean tree, 18/18 eval, five/five drill, immutable image, port/path/body-limit, one-replica, and bounded runtime facts (`src/release-preflight.ts`).
- [x] T012 [S0305] Evaluate fixed decision ownership and target confirmation for secrets, isolation, storage, monitoring, backup, pause, recovery, update, and rollback (`src/release-preflight.ts`).
- [x] T013 [S0305] Return stable finite policy/readiness checks, blocked reasons, safe image/source identity, and no echoed request (`src/release-preflight.ts`).
- [x] T014 [S0305] Implement the no-argument 64-KiB stdin JSON command with closed stdout, canonical stderr, and stable exits (`scripts/release-preflight.ts`, `package.json`).
- [x] T015 [S0305] Write the controlled-release decision record, Mermaid service map, security matrix, owner/validation table, and Session 06 evidence boundary (`docs/release/controlled-release-contract.md`).

## Testing And Documentation (5 tasks)

- [x] T016 [S0305] Prove controlled/public semantics, hostile input, field drift, stable order, immutability, command bounds, and protected-value omission (`tests/release-preflight.test.ts`).
- [x] T017 [S0305] Record policy-validation PASS and target-readiness BLOCKED without target mutation (`docs/build-log-week4.md`, `docs/deployment.md`, `docs/environments.md`).
- [x] T018 [S0305] Update README navigation, TODO, and changelog while keeping Task `07` and deployment claims open.
- [x] T019 [S0305] Run focused tests, `npm run verify`, `npm run test:coverage`, command ready/blocked smoke, and `npm audit`.
- [x] T020 [S0305] Validate ASCII/LF and inspect the complete diff for secrets, private values, arbitrary evidence strings, target calls, permissions, routes, effects, deployment mutation, unsupported claims, and Phase 04 work; update implementation notes.

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview`.

## Next Step

Session complete. Session 06 requires an authorized target preflight.
