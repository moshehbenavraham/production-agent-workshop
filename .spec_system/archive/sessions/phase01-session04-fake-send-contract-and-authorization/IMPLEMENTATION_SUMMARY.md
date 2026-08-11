# Implementation Summary

**Session ID**: `phase01-session04-fake-send-contract-and-authorization`
**Completed**: 2026-08-04
**Duration**: 2 hours

---

## Overview

Defined the complete fake-send authorization and future execution contract,
then implemented only the deterministic pre-effect authorizer. One exact
authorized request now resolves an immutable command from durable approved
state and derives a stable idempotency key. Every invalid, unauthorized,
missing, non-approved, mismatched, malformed, or unavailable path fails before
any adapter boundary.

## Deliverables

| File | Purpose |
|------|---------|
| `src/fake-send.ts` | Closed request/error/command/adapter contracts, stable key, and authorizer |
| `src/fake-send-result.ts` | Closed events, reservation/result records, projections, and result-store contracts |
| `tests/fake-send.test.ts` | 15 contract, semantic, permission-order, dependency, and zero-effect tests |
| `docs/build-log-week2.md` | Mermaid flow, write contract, permission table, key/crash/compensation evidence, and honest cutoff |
| Session reports | Complete planning, implementation, review, security, and validation evidence |

## Technical Decisions

1. **Identity claims, not content**: caller input contains bounded IDs and typed
   target identity; the application copies executable content only from the
   durable approved record.
2. **Actor before lookup**: unauthorized callers cannot enumerate approval
   state and always produce zero future-adapter effects.
3. **Immutable command**: the command and nested target/draft values are frozen
   after semantic hash/key validation.
4. **Stable action key**: versioned length-delimited SHA-256 inputs include the
   exact approved action and exclude retrying actor identity.
5. **Reservation-first future contract**: an incomplete reservation is visible
   and never authorizes an automatic second effect.
6. **No compensation claim**: terminal results require manual review rather
   than inventing rollback behavior.
7. **Focused modules**: authorization/adapter policy and result/persistence
   contracts have a one-way dependency and remain below 500 lines each.

## Verification

| Metric | Result |
|--------|--------|
| Tasks | 17/17 complete |
| Focused tests | 15/15 pass |
| Repository tests | 108/108 pass |
| Evals | 5/5 pass |
| Dependency vulnerabilities | 0 |
| Review findings | 2 Medium and 2 Low, all resolved |

## Preserved Cutoff

Session 04 added no adapter implementation or invocation, result persistence,
send event append, Pi/HTTP capability, provider credential, subprocess, network
access, real data, or human-review claim. The exact three-tool production
allowlist remains frozen.

## Next Step

Run `plansession` for Session 05: Idempotent Fake Send Execution.
