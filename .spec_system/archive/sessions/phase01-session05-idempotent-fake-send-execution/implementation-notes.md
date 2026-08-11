# Implementation Notes

**Session ID**: `phase01-session05-idempotent-fake-send-execution`
**Implemented**: 2026-08-04
**Base Commit**: 7b1d43af66ac28c38b3ff3a482edf5e0835354f3
**Result**: READY FOR CODE REVIEW

## Scope Delivered

Implemented durable single-process at-most-once fake execution behind the exact
Session 04 authorization boundary. One application service now claims a JSONL
reservation, records minimized attempt evidence, invokes one in-process fake
adapter under a deadline, persists one terminal result, and records minimized
terminal evidence. Completed duplicates return the exact durable original;
incomplete reservations remain visible and never retry automatically.

No runtime composition, Pi/HTTP entrypoint, provider, credential, subprocess,
network write, real message, or real data was added.

## RED / GREEN Evidence

1. Added `tests/fake-send-store.test.ts`; RED failed with
   `ERR_MODULE_NOT_FOUND` for `src/fake-send-store.js`.
2. Implemented JSONL load/projection and durable claim/complete behavior; all 16
   store tests passed.
3. Added execution-outcome tests; RED failed on the missing export, then passed
   after the closed execution contract was added.
4. Added `tests/fake-send-service.test.ts`; RED failed with
   `ERR_MODULE_NOT_FOUND` for `src/fake-send-service.js`.
5. Implemented service/adapter/evidence ordering and repaired the expected
   storage-failure event assertion; all 13 initial service tests passed.
6. Focused fake-send contract/store/service gate initially passed 45/45 tests.
7. Review RED regressions reproduced mutable values at replaceable store/event
   boundaries, acceptance of repeated exact terminal evidence, and terminal-
   only codes accepted as generic failures.
8. Review repairs freeze generated boundary values, require exactly one terminal
   event, and restrict generic failure semantics; all 15 service tests and the
   47/47 focused gate pass.
9. Complete verification passes 140/140 tests and 5/5 evals; dependency audit
   reports zero vulnerabilities.

## Durable Store

`FileFakeSendResultStore` reloads every operation, validates complete closed
records, and projects by stable key with no current-state cache. New files use
mode `0600`; each append writes one LF-terminated record, calls `fsync`, closes
in `finally`, and re-reads the exact projection before success.

Projection rejects invalid JSON/schema, missing final LF, blank lines,
duplicate/decreasing record metadata, duplicate reservations, results before
reservations, repeated terminal records, and identity conflicts. Claim and
completion are idempotent only for exact originals.

## Execution Order And Truth

1. Exact durable approved-state authorization.
2. Synchronous durable reservation claim.
3. Minimized attempted event.
4. One injected adapter call with `AbortSignal` and application timer.
5. One durable terminal accepted/rejected/timed-out/downstream result.
6. Matching minimized terminal event.

The result projection is authoritative for idempotency. Events are audit
evidence and cannot authorize execution. A duplicate retry repairs a missing
terminal event from a durable result before returning the original.

## Crash And Failure Semantics

- Attempt-event failure leaves a reservation and invokes no adapter.
- Adapter timeout aborts once, persists `timed_out`, and ignores late settlement.
- Throws, rejections, malformed outcomes, and impossible accepted times become
  canonical durable `downstream_failure` without raw detail.
- Completion-store failure after the effect leaves an indeterminate reservation
  and returns visible storage failure; retry invokes no second effect.
- Terminal-event failure leaves the result durable, records storage failure when
  possible, and is repaired on a duplicate retry.
- Concurrent calls in one process serialize at synchronous claim, producing one
  adapter invocation and one in-progress response.
- Multi-process/distributed safety, lease expiry, and automatic indeterminate
  retry remain explicitly unsupported.

## Files

| File | Change |
|------|--------|
| `src/fake-send-store.ts` | Added JSONL load/projection, private durable append, claim/complete/get adapter |
| `src/fake-send-service.ts` | Added authorization/claim/event/effect/result orchestration and recovery |
| `src/fake-send-adapter.ts` | Added deterministic in-process fake adapter |
| `src/fake-send-execution.ts` | Added closed application outcome schema/guard/construction |
| `src/fake-send.ts`, `src/fake-send-result.ts` | Added storage failures, shared identity comparison, and operation-specific contracts |
| `tests/fake-send-store.test.ts` | Added 16 durability and failure tests |
| `tests/fake-send-service.test.ts` | Added 15 execution, duplicate, timeout, crash, mutation, evidence-cardinality, and recovery tests |
| `tests/fake-send.test.ts` | Added execution-outcome semantic test |
| README and `docs/` | Updated architecture, boundaries, Task `03` proof, tracking, and current 140-test state |

All source modules remain below 500 lines after isolating the adapter and
execution outcome from orchestration/persistence contracts.

## Verification Ledger

| Check | Result |
|-------|--------|
| Focused fake-send gate | PASS - 47/47 |
| `npm run verify` | PASS - format/types, 140/140 tests, 5/5 evals |
| `npm audit --audit-level=low` | PASS - 0 vulnerabilities |
| Source module size | PASS - all fake-send modules below 500 lines |
| `git diff --check` | PASS |
| ASCII/LF and CR scans | PASS |
| Credential/private-key scan | PASS - no value found |
| Route/network/process scan | PASS - local filesystem capability only |
| Pi production allowlist | PASS - exact frozen three-tool list unchanged |
| Event minimization | PASS - no full draft or lead target in serialized fake-send events |

## Remaining Review Focus

- Recheck mutation and substitution risks at replaceable result/event/adapter
  boundaries, especially values passed by reference.
- Recheck duplicate terminal-event correlation and multiple-event behavior.
- Recheck file metadata/order behavior and all post-effect failure paths.
- The final internal composition harness, permission decision, and consolidated
  evidence remain Session 06; do not expose this service before that gate.

## Next Step

Run `creview`. Do not start Session 06 until review, validation, and PRD
closeout pass.
