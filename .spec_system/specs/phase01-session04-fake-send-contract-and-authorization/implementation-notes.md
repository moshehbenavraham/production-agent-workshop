# Implementation Notes

**Session ID**: `phase01-session04-fake-send-contract-and-authorization`
**Implemented**: 2026-08-04
**Base Commit**: 0889ce240130ce7542c109d055e235dabb25e3d5
**Result**: READY FOR CODE REVIEW

## Scope Delivered

Implemented the Pi-independent fake-send contract and pre-effect authorization
slice. The application can now decide whether one exact durable approved action
is eligible to reach a future execution boundary, but this session creates no
adapter implementation and performs no reservation, effect, result write, event
append, Pi registration, or HTTP operation.

## RED / GREEN Evidence

1. Added `tests/fake-send.test.ts` importing the planned contract, validator,
   stable-key, result-store, adapter, and authorizer API.
2. Ran `npx tsx --test tests/fake-send.test.ts`; RED failed with
   `ERR_MODULE_NOT_FOUND` for `src/fake-send.js`.
3. Implemented the application module and formatted it.
4. Re-ran focused tests; all 15 passed.
5. Ran complete repository verification; all 108 tests and five evals passed.
6. Code review added freeze, hostile-outcome, and result-store-code regressions,
   repaired all findings, and re-ran the same complete gate successfully.

## Implementation Decisions

### Identity-Only Request

The closed request accepts only approval/run/actor IDs, the literal action,
exact typed lead target, and draft ID. Draft content, email/address strings,
provider fields, and arbitrary instructions are rejected as extra properties.

### Immutable Command Resolution

`FakeSendAuthorizer` validates input, denies unauthorized actors before lookup,
narrows the replaceable approval-store outcome at runtime, requires exact
approved state, and independently matches run/action/target/draft identity. It
then copies executable action, target, content, hash, and approval time only
from the durable record. A valid-but-wrong record returned by an adapter is a
canonical storage failure rather than caller-visible alternate state.

### Stable Idempotency

The key is SHA-256 over versioned, length-delimited immutable fields. It includes
approval, run, action, target, draft ID, and draft SHA-256; it excludes caller
content and initiating actor so another authorized operator retry converges on
the same approved action. Semantic command/reservation/result guards recompute
the key rather than accepting shape alone.

### Future Execution Contracts

- The fake adapter accepts an exact semantic command plus `AbortSignal`; the
  application owns the 1,000 ms deadline.
- Adapter outcomes are limited to accepted, rejected, and downstream failure;
  timeout belongs to the application service.
- A result store must claim a reservation before effect and complete one exact
  terminal result. A completed duplicate returns the original projection; an
  incomplete reservation yields `execution_in_progress`, never another effect.
- Terminal records declare automatic compensation unsupported and require
  human review.
- Operational evidence schemas contain only approval/key/duration/outcome data;
  the outer event supplies `runId`, and draft content is forbidden.

## Permission And Failure Precedence

1. Closed request validation.
2. Actor permission before state lookup.
3. Safe approval-store read and runtime outcome validation.
4. Exact returned approval identity and run linkage.
5. Approved terminal state.
6. Exact action, target, and draft ID.
7. Derived command/key semantic validation.

All failures are canonical, typed, and bounded. Arbitrary store messages and
non-Error throws do not escape.

## Files

| File | Change |
|------|--------|
| `src/fake-send.ts` | Added closed request/adapter contracts, guards, stable key, and authorizer |
| `src/fake-send-result.ts` | Added event, reservation, result, storage-record, and result-store contracts |
| `tests/fake-send.test.ts` | Added 15 contract, semantic, authorization, and zero-effect tests |
| `docs/build-log-week2.md` | Added Mermaid flow, write contract, permission table, evidence, cutoff, and future review status |
| `docs/TODO.md`, `docs/CHANGELOG.md` | Recorded implementation/review state and Unreleased behavior |
| Session spec/task/state files | Recorded plansession and implementation workflow state |

## Verification Ledger

| Check | Result |
|-------|--------|
| Focused fake-send tests | PASS - 15/15 |
| `npm run verify` | PASS - format/types, 108/108 tests, 5/5 evals |
| `npm audit --audit-level=low` | PASS - 0 vulnerabilities |
| `git diff --check` | PASS |
| ASCII/LF and CR scans | PASS |
| Credential marker scan | PASS - no match |
| Route/network/process scan | PASS - no new capability |
| Production tool allowlist | PASS - exact frozen three-tool list unchanged |

## Remaining Risks And Review Focus

- Code review separated authorization/adapter policy from execution-result and
  persistence contracts so each source module remains below 500 lines.
- Runtime storage, reservation races, interruption recovery, adapter deadline/
  late-result behavior, duplicate return, and event ordering remain Session 05.
- No human review gate was triggered because no write-capable production tool
  or allowlist change exists. Session 06 must record the explicit decision.
- Real data, public actors, multi-process ownership, real providers, and network
  effects remain prohibited.

## Next Step

Run `creview`. Do not start Session 05 until Session 04 passes review,
validation, and PRD closeout.
