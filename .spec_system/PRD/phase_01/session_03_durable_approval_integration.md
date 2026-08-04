# Session 03: Durable Approval Integration

**Session ID**: `phase01-session03-durable-approval-integration`
**Status**: Complete
**Source Task**: `02`
**Estimated Tasks**: 16
**Estimated Duration**: 2-4 hours

---

## Objective

Integrate durable approval requests and application-owned decisions with minimized event evidence, then close the complete Task `02` acceptance pack.

---

## Scope

### In Scope (MVP)

- Replace inline event-only approval creation with the validated approval service and file-backed store.
- Link every request and decision to the originating `runId`, exact qualified lead, exact action, target, and immutable approved draft state.
- Provide internal application operations for approve and decline without exposing a public endpoint or giving Pi decision authority.
- Emit minimized request, approval, decline, duplicate, invalid, and storage-failure attempt and outcome evidence.
- Return the original terminal state for repeated or conflicting decisions without another transition or downstream effect.
- Preserve the current known-lead `approval_pending` stop and fail closed when approval evidence is missing, stale, cross-run, or malformed.
- Define exact retained approval and draft fields plus synthetic-scope retention, redaction, export, and deletion behavior.
- Add deterministic tool, service, projection, event-order, restart, and storage-failure integration tests.
- Complete the Task `02` state diagram, event examples, restart proof, data-lifecycle decision, failure exercise, verification output, and diff review in the Week 2 Build Log.

### Out of Scope

- Public approval endpoints, production actor authentication, authorization, tenant isolation, or rate limiting.
- Fake or real send execution, send tool allowlisting, whole-run resume, or event replay beyond approval projection.
- Real personal data or provider credentials.

---

## Prerequisites

- [x] Session 02 store, projection, restart, and damaged-record tests are complete.
- [x] Phase 00 qualification and exact-lead downstream gates remain green.

---

## Deliverables

1. Durable approval request and internal decision integration with exact-state authorization boundaries.
2. Minimized correlated transition and refusal events plus deterministic restart and failure-path coverage.
3. Completed Task `02` Week 2 evidence pack and data-lifecycle decision.

---

## Success Criteria

- [x] Pending, approved, and declined application views come from the durable projection and survive restart.
- [x] Pi can request approval but cannot approve, decline, or convert assistant prose into authorization.
- [x] Duplicate or conflicting decisions preserve the original terminal state and append no second transition or effect.
- [x] Every request, decision, refusal, and storage failure remains correlated to the original `runId` without credentials or unnecessary personal data.
- [x] Task `02` acceptance evidence is complete and `npm run verify` passes without broadening the production tool allowlist.
