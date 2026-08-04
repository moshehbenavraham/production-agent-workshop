# Session 02: Approval Store and Projection

**Session ID**: `phase01-session02-approval-store-and-projection`
**Status**: Complete
**Source Task**: `02`
**Estimated Tasks**: 14
**Estimated Duration**: 2-4 hours

---

## Objective

Implement replaceable file-backed approval persistence and deterministic projection rebuilds that survive restart and fail closed on damaged evidence.

---

## Scope

### In Scope (MVP)

- Implement the Session 01 approval-store contract with a file-backed workshop adapter under the configured persistent data boundary.
- Persist approval requests and terminal transitions without deriving truth from Pi messages or raw conversation history.
- Preserve exact `approvalId`, `runId`, action, target, draft linkage, status, timestamps, and minimized actor evidence.
- Rebuild pending, approved, and declined projections deterministically from validated ordered records.
- Detect missing, malformed, duplicate-request, out-of-order, truncated, corrupt, and interrupted-write evidence and return visible structured failures.
- Keep approval persistence separate from operational event evidence and temporary working context.
- Prove independent store instances rebuild the same projection after simulated process restart.
- Add deterministic store tests for pending, approved, declined, duplicate, restart, storage-failure, and corrupt-record paths.
- Document the file layout, durability assumptions, and replaceability boundary in the Week 2 Build Log.

### Out of Scope

- Pi tool and application decision integration.
- Public approve or decline endpoints, authentication, tenant isolation, and rate limiting.
- Fake send execution, idempotency result persistence, database migration, or multi-process concurrency.

---

## Prerequisites

- [x] Session 01 contracts and transition tests are complete and green.
- [x] The persistent path strategy keeps runtime data out of Git and maps to `/app/data` in the deployment contract.

---

## Deliverables

1. Replaceable file-backed approval store with validated append and lookup behavior.
2. Deterministic projection rebuild and restart proof for pending, approved, and declined approvals.
3. Corruption, interruption, duplicate-request, and storage-failure tests plus documented durability assumptions.

---

## Success Criteria

- [x] A new store instance rebuilds the same approval projection from durable records.
- [x] Pending and terminal approval state survives restart with exact identity and ordering preserved.
- [x] Missing, malformed, truncated, corrupt, duplicate, or out-of-order records never grant permission or imply success.
- [x] Storage failures are actionable and do not create an in-memory success that durable state cannot prove.
- [x] The file adapter can be replaced without changing the approval domain or application-facing contract.
