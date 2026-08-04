# Session 05: Idempotent Fake Send Execution

**Session ID**: `phase01-session05-idempotent-fake-send-execution`
**Status**: Complete
**Source Task**: `03`
**Estimated Tasks**: 19
**Estimated Duration**: 2-4 hours

---

## Objective

Implement durable idempotent fake-send execution so one exact approved action produces at most one fake effect and one replayable original result.

---

## Scope

### In Scope (MVP)

- Derive a stable idempotency key from immutable approved action identity rather than caller-generated content.
- Implement the replaceable file-backed idempotency result store under the workshop persistent data boundary.
- Persist the first accepted or terminal fake result and return that original result for duplicates.
- Invoke a deterministic fake adapter only after Session 04 validation, authorization, exact-target, and idempotency checks pass.
- Bound adapter execution with an explicit timeout and canonical typed outcomes for accepted, rejected, timed-out, permission-denied, and downstream failure.
- Record minimized attempt and outcome events with `runId`, `approvalId`, idempotency key, duration, and outcome, excluding credentials, full drafts, and unnecessary personal data.
- Define safe retry, stop, compensate, or human-escalation guidance for each fake outcome.
- Add deterministic tests for first execution, duplicate execution, timeout and late completion, permission denial, target mismatch, store failure, and downstream failure.
- Prove duplicate calls across a new service instance return the original durable result with no second fake effect.

### Out of Scope

- Real network sending, provider selection, credentials, production compensation, or customer data.
- Pi tool registration or production allowlist changes.
- Public HTTP invocation, distributed locking, multi-process execution, or whole-run replay.

---

## Prerequisites

- [x] Session 04 contracts, approved-action resolver, and denial-before-effect tests are complete.
- [x] Durable approval projections can supply the exact immutable approved action after restart.

---

## Deliverables

1. File-backed idempotency result store and deterministic fake adapter orchestration.
2. Stable-key and duplicate-result proof across service restart with zero duplicate fake effects.
3. Minimized attempt/outcome events, timeout behavior, failure tests, and recovery or escalation rules.

---

## Success Criteria

- [x] One approved action produces no more than one fake adapter effect.
- [x] A duplicate request returns the exact first persisted result, including after a new service instance is created.
- [x] Pending, declined, missing, malformed, mismatched, or unauthorized approvals never invoke the adapter.
- [x] Timeout, storage, permission, and downstream failures remain typed, visible, and free of false completion claims.
- [x] Event evidence correlates the original `runId` and `approvalId` without a provider secret, full draft, or unnecessary personal data.
