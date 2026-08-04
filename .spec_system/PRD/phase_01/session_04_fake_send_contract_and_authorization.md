# Session 04: Fake Send Contract and Authorization

**Session ID**: `phase01-session04-fake-send-contract-and-authorization`
**Status**: Complete
**Source Task**: `03`
**Estimated Tasks**: 17
**Estimated Duration**: 2-4 hours

---

## Objective

Define and implement the fake-send contract and pre-effect authorization resolver for one exact approved action without invoking a real or fake external effect.

---

## Scope

### In Scope (MVP)

- Define the fake adapter's single responsibility, closed input and output unions, timeout, error codes, evidence, and compensation semantics.
- Classify approved, pending, declined, missing, malformed, mismatched, duplicate, timed-out, permission-denied, and dependency-failure paths using the repository permission vocabulary.
- Resolve action, recipient target, and draft linkage from immutable durable approval state rather than caller or model free text.
- Require an existing approved `approvalId` and independently validate `runId`, action, target, and draft identity.
- Define stable idempotency-key inputs and the replaceable result-store contract before implementing execution.
- Implement the authorization and approved-action resolver as deterministic application code.
- Reject missing, malformed, pending, declined, cross-run, cross-target, and unauthorized requests before adapter invocation.
- Add contract, resolver, exact-identity, and permission-order tests with an adapter spy proving denied paths produce zero effects.
- Record the draft write contract and permission table in the Week 2 Build Log for later human review.

### Out of Scope

- Persisting idempotency results or invoking the fake adapter through the application service.
- Pi tool registration or allowlisting, public write endpoints, provider credentials, or real network traffic.
- Whole-run resume, retry orchestration, compensation execution, or real customer data.

---

## Prerequisites

- [x] Session 03 completes Task `02` and provides durable approved-state lookup with exact immutable linkage.
- [x] The production Pi allowlist still contains only the three Phase 00 bounded tools.

---

## Deliverables

1. Closed fake-send adapter, service, error, evidence, and idempotency-store contracts.
2. Deterministic approved-action resolver and pre-effect authorization checks.
3. Permission table and focused tests proving all unapproved or mismatched requests invoke no adapter effect.

---

## Success Criteria

- [x] Only an exact existing approved action can reach the future execution boundary.
- [x] Action, target, and draft content are resolved from immutable application state rather than model-provided free text.
- [x] Validation and authorization order is explicit and tested before any effect.
- [x] Error results are actionable, typed, and cannot be mistaken for completion.
- [x] No provider credential, network write, Pi permission, or full draft event is introduced.
