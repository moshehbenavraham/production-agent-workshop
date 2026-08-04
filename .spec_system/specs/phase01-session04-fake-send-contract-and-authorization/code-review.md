# Code Review and Repair Report

**Session ID**: `phase01-session04-fake-send-contract-and-authorization`
**Reviewed**: 2026-08-04
**Base Commit**: 0889ce240130ce7542c109d055e235dabb25e3d5
**Scope**: All changed and untracked files since the pushed base
**Result**: RESOLVED

## Review Surface

- `.spec_system/state.json` and the complete Session 04 spec/task/
  implementation artifacts.
- `src/fake-send.ts` - request, error, adapter, command, key, and authorization
  policy.
- `src/fake-send-result.ts` - minimized events, reservations, results, storage
  records, projections, and replaceable result-store outcomes.
- `tests/fake-send.test.ts` - all contract, semantic, authorization, dependency,
  idempotency, and zero-effect regressions.
- `docs/build-log-week2.md`, `docs/TODO.md`, and `docs/CHANGELOG.md` - Task `03`
  contract evidence, honest execution cutoff, and workflow tracking.
- Existing approval, store, Pi allowlist, server, package, and event boundaries
  were inspected for compatibility and capability drift.

There are no Session 04 commits after the base. Every untracked source, test,
and workflow file and every tracked diff was included.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. `src/fake-send.ts:414` - The semantic authorized command and its nested
   target/draft objects were returned mutable. Application code could alter the
   target or content after authorization but before a future effect, creating a
   time-of-check/time-of-use gap even though the original durable record was
   exact. **Fix:** clone and freeze both nested values and the outer command;
   regressions require all three objects to be frozen while retaining semantic
   validation. **Status: FIXED.**
2. `src/fake-send.ts:373` - The store call itself was caught, but runtime
   validation and property reads of its returned unknown value were outside an
   exception boundary. A hostile Proxy/getter could throw through authorization
   instead of returning a redacted typed refusal. **Fix:** wrap all outcome
   narrowing, failure mapping, identity checks, and command creation; add a
   throwing-getter regression that returns canonical `storage_failure`.
   **Status: FIXED.**

### Low

1. `src/fake-send-result.ts:420` - Generic result-store failure variants
   accepted any canonical fake-send code, so a malformed adapter could return
   `duplicate`, `permission_denied`, or `rejected` without the corresponding
   projection/operation semantics. **Fix:** restrict claim failures to storage/
   conflict, duplicate kinds to projection-specific codes, completion failures
   to storage/conflict, and read failures to storage only; add regressions.
   **Status: FIXED.**
2. Initial `src/fake-send.ts` - The 841-line module combined authorization/
   adapter policy with execution evidence and persistence contracts, weakening
   the repository's focused-module convention and making Session 05 changes
   harder to review. **Fix:** isolate events, reservations, results, records,
   projections, and store outcomes in `src/fake-send-result.ts`; the resulting
   modules are 441 and 452 lines with a one-way dependency. **Status: FIXED.**

## Behavior Changes From Review Repairs

- Authorized commands are immutable runtime values, not merely readonly by
  convention.
- Arbitrary store outcome access cannot escape the authorizer's typed/redacted
  failure boundary.
- Result-store operations cannot masquerade as unrelated permission or adapter
  outcomes.
- Persistence contracts are isolated from the authorizer; no execution
  behavior, side effect, dependency, or capability was added by the split.

## Deliberate Non-Fixes And Boundaries

- Session 04 defines but does not implement the fake adapter, result store,
  execution service, deadline, event append, or duplicate return path. Those
  remain Session 05 and are not simulated here.
- Public actor authentication, Pi send permission, HTTP writes, real provider
  integration, multi-process storage, and real data remain prohibited.
- Automatic compensation remains explicitly unsupported. An incomplete future
  reservation is visible and must not trigger an automatic second effect.
- The human permission review is not claimed or triggered because the exact
  production three-tool allowlist is unchanged.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Focused RED regressions | PASS | New freeze, hostile-outcome, and misleading-store-code cases failed before repairs |
| Focused GREEN | PASS | 15/15 fake-send tests pass after repairs |
| Full verification | PASS | Formatting/types pass, 108/108 tests, 5/5 evals |
| Dependency audit | PASS | 0 vulnerabilities |
| Module cohesion | PASS | Source modules split to 441/452 lines with one-way dependency |
| Diff/encoding | PASS | `git diff --check`, ASCII/LF, and CR scans pass |
| Capability/security | PASS | No secret, dependency, route, subprocess, provider, network, event emission, persistence, or allowlist addition |
| Documentation truth | PASS | Contract-only versus implemented behavior and future human review are labeled explicitly |

## Summary

The complete Session 04 diff was reviewed against repository architecture,
security, privacy, exact-identity, least-privilege, failure-precedence, and
side-effect rules. Two Medium and two Low findings were repaired with direct
regressions. No unresolved finding remains, and the session is ready for
independent validation.
