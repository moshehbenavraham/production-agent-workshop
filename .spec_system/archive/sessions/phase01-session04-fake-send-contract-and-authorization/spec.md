# Session Specification

**Session ID**: `phase01-session04-fake-send-contract-and-authorization`
**Phase**: 01 - Durable Approval and Safe Write
**Status**: Validated
**Created**: 2026-08-04
**Base Commit**: 0889ce240130ce7542c109d055e235dabb25e3d5

---

## 1. Session Overview

This session defines the complete fake-send boundary contract and implements
only deterministic pre-effect authorization. A caller may present exact
identity claims, but the application resolves the executable action, target,
draft content, and hash from the authoritative durable approved record. No
adapter is invoked, no result is persisted, and no Pi or HTTP capability is
added in this session.

## 2. Objectives

1. Define closed request, authorized-command, adapter outcome, execution result,
   event evidence, reservation/result, and replaceable result-store contracts.
2. Derive one stable versioned idempotency key from immutable approved state.
3. Implement explicit validation and authorization precedence that rejects all
   invalid, unauthorized, missing, non-approved, or mismatched requests before
   any future effect boundary.
4. Record the permission contract, no-compensation rule, crash-window semantics,
   and focused zero-effect proof for later human review.

## 3. Prerequisites

- [x] Session 03 provides durable pending/approved/declined lookup with exact
  action, run, target, draft ID, content, and SHA-256 linkage.
- [x] Production Pi exposes exactly `qualify_lead`, `draft_follow_up`, and
  `request_send_approval` and contains no send or decision tool.
- [x] Pushed base `0889ce2` passes 93/93 tests, 5/5 evals, and dependency audit.

## 4. Scope

### In Scope

- A closed identity-only fake-send request containing approval, run, actor,
  action, target lead, and draft identifiers; callers never supply content.
- A derived authorized command containing exact immutable approval content,
  hash, target, action, approval/run linkage, actor, and stable idempotency key.
- Canonical errors for invalid request, permission denial, missing/pending/
  declined approval, identity mismatch, invalid record, storage failure,
  duplicate, timeout, rejection, and downstream failure.
- Future fake-adapter contract with one action, bounded abort-aware timeout, and
  accepted/rejected/downstream-failure responses.
- Reservation-first result-store contracts that preserve at-most-once behavior
  and expose incomplete crash state without retrying an uncertain effect.
- Minimized attempt/result evidence contracts carrying `runId`, `approvalId`,
  idempotency key, duration, and redacted outcome but no draft content.
- Pure application authorization backed by the replaceable `ApprovalStore`.
- Permission-order, exact-identity, idempotency, runtime-dependency, and adapter-
  spy tests proving denied paths have zero effects.

### Out Of Scope

- Calling even the fake adapter, writing reservations/results, timing an
  execution, or emitting send events - Session 05.
- Pi registration/allowlisting, HTTP write endpoints, provider credentials,
  real network traffic, public actor authentication, or real data.
- Retry orchestration, compensation execution, whole-run resume, multi-process
  locking, or damaged-record repair.

## 5. Technical Approach

### Contract Model

Create `src/fake-send.ts` as a Pi-independent authorization contract and policy
module, with execution evidence and persistence contracts isolated in
`src/fake-send-result.ts`. The request contains only bounded identity claims.
The returned command is built from a schema-valid approved record and includes
exact draft content because it is the future adapter input; events and errors
never contain that content.

The idempotency key is SHA-256 over a domain/version prefix and length-delimited
canonical fields: approval ID, run ID, action, target kind/lead ID, draft ID,
and draft SHA-256. Actor identity is intentionally excluded: repeated execution
of one approved action must converge even if a different authorized operator
initiates the retry.

### Authorization Precedence

1. Validate the closed request schema.
2. Reject an actor outside the injected application allowlist without reading
   approval state, preventing unauthorized approval enumeration.
3. Read through the replaceable store and validate its runtime outcome.
4. Require an existing schema-valid record.
5. Match run ID, then require `approved`, then match action, target, and draft ID.
6. Derive the command exclusively from the approval and compute the stable key.

Every failure returns a canonical typed result. Dependency text and malformed
records are never echoed. The authorizer owns no adapter reference, which makes
pre-effect denial structural; focused tests additionally route successful
commands to a spy and prove all denial cases leave its call count at zero.

### Result And Compensation Semantics

The future result store uses a durable reservation before the fake effect and a
terminal result afterward. A duplicate completed request returns the original
result; a duplicate reservation without a terminal result is an explicit
indeterminate/in-flight refusal and never repeats the effect. Results declare
compensation unsupported and direct a human to inspect evidence; automatic
rollback is not implied.

## 6. Deliverables

| File | Purpose |
|------|---------|
| `src/fake-send.ts` | Closed request/adapter contracts, stable key, and pre-effect authorizer |
| `src/fake-send-result.ts` | Closed event, reservation, result, storage-record, and result-store contracts |
| `tests/fake-send.test.ts` | Contract, permission order, exact identity, stable key, and zero-effect regressions |
| `docs/build-log-week2.md` | Draft write contract, permission table, compensation/crash semantics, and focused evidence |
| `docs/TODO.md`, `docs/CHANGELOG.md` | Active session and Unreleased tracking |

## 7. Success Criteria

### Functional

- [ ] Only an exact existing approved action yields an authorized command.
- [ ] Action, target, draft content, and hash are taken only from immutable
  durable approval state.
- [ ] Missing, pending, declined, cross-run, cross-target, wrong-draft,
  unauthorized, malformed, corrupt, and unavailable paths fail before effect.
- [ ] Stable keys are deterministic, field-sensitive, versioned, and exclude
  caller-controlled content and retrying actor identity.
- [ ] Adapter, evidence, result, reservation, timeout, error, and compensation
  contracts are closed and runtime-validatable.

### Testing And Quality

- [ ] Contract-first RED evidence precedes implementation.
- [ ] Tests prove authorization precedence and zero spy calls for every denial.
- [ ] No adapter invocation, result persistence, send event, Pi/HTTP permission,
  provider credential, dependency, full-content event, or network effect exists.
- [ ] Formatting, strict types, full tests/evals, audit, ASCII/LF, security,
  privacy, and Behavioral Quality checks pass.

## 8. Assumptions And Conflict Resolutions

- The synthetic internal actor remains an application policy placeholder, not
  public authentication. Public identity and authorization stay deferred.
- The task calls this an external-write boundary while the master PRD prohibits
  real sending; all contracts name a fake adapter and no network implementation
  or credential may appear.
- Session 04 defines execution/result contracts so Session 05 can implement
  them, but deliberately performs no reservation, effect, event, or result write.
- The HITL review gate is not triggered because the production allowlist does
  not change. Session 06 records the explicit allowlist decision and future
  review requirement.

## 9. Behavioral Quality Focus

- Never authorize from assistant prose, events, caller content, or TypeScript
  signatures alone.
- Preserve failure precedence: invalid input, unauthorized actor, untrusted
  storage, approval identity/status, then exact action/target/draft checks.
- Treat an untrusted store's valid-but-wrong record/outcome as storage failure.
- Make incomplete durable reservations visible and non-retriable by default.

## 10. Next Step

Run `implement` for this session. Do not begin Session 05 while Session 04 is
active.
