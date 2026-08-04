# Implementation Summary

**Session ID**: `phase01-session03-durable-approval-integration`
**Completed**: 2026-08-04
**Duration**: 3 hours

---

## Overview

Integrated the durable approval contract and JSONL store into the application.
Approval requests now bind to the exact latest application-produced draft,
internal decisions transition durable state once, and run status derives from
validated approval projection rather than assistant prose or operational event
shape. State-first ordering plus retry recovery keeps permission truth intact
when minimized event evidence is temporarily unavailable.

## Deliverables

### Files Created

| File | Purpose |
|------|---------|
| `src/approval-service.ts` | Application-owned durable request, decision, projection, and event-recovery policy |
| `tests/approval-service.test.ts` | Restart, duplicate/conflict, malformed dependency, and outage regressions |
| Session workflow reports | Specification, tasks, implementation, review, security, and validation evidence |

### Files Modified

| File Set | Changes |
|----------|---------|
| `src/approval.ts`, `src/tools.ts`, `src/pi-agent.ts` | Runtime validation, exact draft/service integration, configured projection, and fail-closed stop reasons |
| Tool and Pi tests | Exact binding, restart, minimized event, failure, and frozen-allowlist coverage |
| `.env.example`, `Dockerfile` | Added `APPROVAL_LOG_PATH` under the persistent data boundary |
| README and `docs/` | Documented architecture, API cutoff, lifecycle, operational evidence, and current behavior |
| Apex state, phase PRD, TODO, changelog, package files | Closed Session 03 and advanced Phase 01 to 3/6 at version 0.1.17 |

## Technical Decisions

1. **Durable state is authoritative**: operational events support audit and
   recovery but can never grant approval.
2. **State precedes evidence**: a successful durable append happens before its
   event; retry repairs a missing event without another transition.
3. **All replaceable boundaries are untrusted at runtime**: store outcomes,
   event arrays, append echoes, identities, and failure text are narrowed and
   canonicalized before use.
4. **Least privilege remains frozen**: Pi retains exactly three tools and no
   decision, send, public route, credential, or network capability was added.
5. **Synthetic lifecycle is explicit**: exact draft content exists only in the
   approval record and is governed by the documented 30-day-or-teardown limit.

## Verification

| Metric | Result |
|--------|--------|
| Tasks | 16/16 complete |
| Tests | 93/93 pass |
| Evals | 5/5 pass |
| Dependency vulnerabilities | 0 |
| Review findings | 3 Medium and 2 Low, all resolved |

## Remaining Boundaries

- Multi-process locking, automated repair, backup/restore, real-data lifecycle
  controls, public decisions, and tenant authentication remain deferred.
- Fake-send authorization and execution do not exist yet; Session 04 begins
  only with Pi-independent contracts and pre-effect authorization.

## Next Step

Run `plansession` for Session 04: Fake Send Contract and Authorization.
