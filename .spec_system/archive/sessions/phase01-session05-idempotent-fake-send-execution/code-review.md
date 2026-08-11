# Code Review and Repair Report

**Session ID**: `phase01-session05-idempotent-fake-send-execution`
**Reviewed**: 2026-08-04
**Base Commit**: 7b1d43af66ac28c38b3ff3a482edf5e0835354f3
**Scope**: All changed and untracked files since the pushed base
**Result**: RESOLVED

## Review Surface

- `.spec_system/state.json` and the complete Session 05 planning and
  implementation artifacts.
- `src/fake-send-store.ts` and `src/fake-send-result.ts` - JSONL loading,
  projection, reservation/completion persistence, exact identity, and
  replaceable-store contracts.
- `src/fake-send-service.ts`, `src/fake-send-execution.ts`, and
  `src/fake-send-adapter.ts` - authorization, claim/event/effect/result order,
  deadlines, immutable execution values, duplicate recovery, and outcomes.
- `src/fake-send.ts` plus all three fake-send test suites - authorization and
  failure-contract compatibility, crash windows, mutations, concurrency,
  restart, corruption, and zero-second-effect coverage.
- README and `docs/` - architecture, Task `03` proof, explicit single-process
  boundary, unchanged permissions, and current verification state.
- Existing Pi, HTTP, approval, event, Docker, dependency, and production-tool
  boundaries were inspected for capability or truth drift.

There are no Session 05 commits after the base. Every untracked source, test,
and workflow file and every tracked diff was included.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. Initial `src/fake-send-service.ts` reservation/result construction - The
   service passed mutable generated reservations and results by reference to a
   replaceable result store. An adapter could mutate the value it received and
   return the same reference, undermining the later equality proof and changing
   the service's authoritative result after validation. **Fix:** clone and
   freeze the reservation outer/target values and result outer/target/
   compensation/error values before either store operation. The regression at
   `tests/fake-send-service.test.ts:407` attempts each mutation and requires a
   successful unchanged execution. **Status: FIXED.**
2. Initial `src/fake-send-service.ts` event append - Minimized event data also
   crossed a replaceable adapter by mutable reference. The adapter could alter
   the data and return the same event, causing the service to compare a mutated
   object to itself. **Fix:** copy and freeze every event payload before append,
   then validate and compare the returned event to that immutable value
   (`src/fake-send-service.ts:135`). The same boundary regression proves the
   attempted and accepted evidence cannot be mutated. **Status: FIXED.**

### Low

1. Initial `src/fake-send-service.ts` terminal recovery - Duplicate replay
   accepted two or more identical terminal events because it rejected only
   conflicting payloads. Repeated evidence is still invalid cardinality and
   can obscure an append/recovery fault. **Fix:** require zero or exactly one
   matching terminal event; fail closed on more than one
   (`src/fake-send-service.ts:171`). The regression at
   `tests/fake-send-service.test.ts:549` proves zero additional adapter calls
   and typed storage failure. **Status: FIXED.**
2. Initial `src/fake-send-execution.ts` generic failure guard - The `failure`
   variant accepted every canonical fake-send code, including `duplicate`,
   `execution_in_progress`, `timed_out`, `rejected`, and
   `downstream_failure`, even though those codes require a distinct kind and/or
   durable result. **Fix:** allow only authorization, storage, corruption, and
   result-conflict codes in the generic variant
   (`src/fake-send-execution.ts:53`). Direct semantic regressions reject
   terminal-only and duplicate codes. **Status: FIXED.**

## Behavior Changes From Review Repairs

- Service-generated reservation, result, and minimized event evidence is
  immutable before any replaceable persistence/event adapter observes it.
- Returned adapter values are still schema- and semantic-validated, but
  by-reference mutation can no longer make the expected value move with them.
- Duplicate recovery requires exactly one matching terminal event and treats
  repeated or conflicting terminal evidence as a visible storage failure.
- Application outcomes cannot disguise terminal result, duplicate, or
  in-progress semantics as a projection-free generic failure.
- Execution value helpers reside in the focused execution module, leaving all
  fake-send source modules below 500 lines.

## Deliberate Non-Fixes And Boundaries

- The durable claim is atomic only inside one Node process. Multi-process or
  distributed locking, leases, expiry, and automated indeterminate retry remain
  unsupported and must not be inferred.
- Result and event logs are separate append-only files. A terminal event can be
  repaired from a durable result; a reservation-only state remains indeterminate
  and requires manual inspection.
- The fake adapter is deterministic and in process. No provider, network write,
  real message, credential, public actor, Pi send tool, or HTTP write route was
  added.
- No human permission review is claimed because the exact production
  three-tool allowlist remains unchanged. Session 06 must record the final
  explicit allowlist decision without exposing a write tool.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Review RED | PASS | Three targeted tests failed before repairs: immutable boundaries, duplicate terminal cardinality, and generic terminal failure semantics |
| Review GREEN | PASS | 47/47 focused fake-send tests pass, including 15 service tests |
| Full verification | PASS | Formatting/types pass, 140/140 tests, 5/5 evals |
| Dependency audit | PASS | 0 vulnerabilities; no dependency changed |
| Persistence and restart | PASS | Flush/re-read, two-line first result, independent-store duplicate replay, corruption/interruption refusal |
| Effect safety | PASS | Claim before effect, one same-process concurrent effect, timeout abort, late suppression, reservation-only indeterminate refusal |
| Diff/encoding | PASS | `git diff --check`; ASCII/LF and CR scans pass |
| Module cohesion | PASS | All six fake-send source modules are below 500 lines |
| Capability/security | PASS | Local result-file capability only; no package, provider, credential, subprocess, route, network, allowlist, real-data, or compensation expansion |
| Documentation truth | PASS | Internal fake-only and single-process limits, crash windows, untriggered human review, and future Session 06 work are explicit |

## Summary

The complete Session 05 diff was reviewed against exact durable identity,
authorization-before-effect, fail-closed adapter handling, idempotency,
evidence cardinality, privacy minimization, and least-privilege rules. Two
Medium and two Low findings were reproduced and repaired with direct
regressions. No unresolved finding remains, and the session is ready for
independent validation.

## Next Step

Run `validate` for Session 05.
