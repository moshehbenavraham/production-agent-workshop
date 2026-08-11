# Implementation Summary

**Session ID**: `phase02-session03-bounded-run-lifecycle`
**Completed**: 2026-08-11
**Duration**: 0.5 hours

---

## Overview

Completed application-owned bounded run execution for Task `04`. Production
now validates one whole-run deadline and maximum-step budget before runtime
construction, includes Pi resource/model/session setup inside the deadline,
charges an explicit model/tool start set, records minimized correlated
lifecycle evidence, requests abort once, persists one terminal, and ignores
late session, model, or tool settlement.

The run-event envelope advances to schema version 2 with explicit step
availability and closed `run.stopped` deadline, step-limit, and dependency
terminals. The deterministic projector accepts one compatible bounded terminal
from any trusted prefix and rejects late core evidence or duplicate terminals.
Existing approval and fake-result stores remain the only authorization and
effect truth, and the Pi/HTTP production boundary remains exactly three tools
with no real effect capability.

---

## Deliverables

### Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `src/run-lifecycle.ts` | Bounds, Pi normalization, step charging, tool correlation, injected orchestration, abort once, and terminal once | 753 |
| `tests/run-lifecycle.test.ts` | Deterministic config, normalization, completion, deadline, limit, race, cleanup, dependency, and storage tests | 878 |
| `.spec_system/specs/phase02-session03-bounded-run-lifecycle/spec.md` | Session requirements, architecture, step policy, and success criteria | 334 |
| `.spec_system/specs/phase02-session03-bounded-run-lifecycle/tasks.md` | Completed 19-task checklist | 65 |
| `.spec_system/specs/phase02-session03-bounded-run-lifecycle/implementation-notes.md` | Sequential planning, implementation, and verification evidence | 227 |
| `.spec_system/specs/phase02-session03-bounded-run-lifecycle/IMPLEMENTATION_SUMMARY.md` | Session implementation summary | ~125 |

### Files Modified

| File | Changes |
|------|---------|
| `src/run-event.ts` | Schema version 2, nullable step metadata, and closed bounded terminals |
| `src/run-projection.ts` | Stopped terminal projection, exact metadata compatibility, and late-core refusal |
| `src/pi-agent.ts` | Fail-fast bounds and lifecycle-owned Pi setup, prompt, completion, and stopped result mapping |
| `tests/run-event.test.ts`, `tests/run-projection.test.ts`, `tests/pi-agent.test.ts` | Version, step, terminal, projection, and pre-construction regression coverage |
| `.env.example`, `docs/environments.md`, `docs/development.md`, `docs/deployment.md` | Runtime bound defaults, ranges, and deployment guidance |
| `docs/ARCHITECTURE.md`, `docs/api/http-api.md`, `docs/runbooks/incident-response.md` | Lifecycle composition, response semantics, and operator actions |
| `docs/build-log-week3.md`, `docs/TODO.md`, `docs/CHANGELOG.md`, `docs/onboarding.md` | Evidence, active tracking, release notes, and current verification result |
| `.spec_system/CONSIDERATIONS.md`, `.spec_system/SECURITY-COMPLIANCE.md` | Closed whole-run-bounds concern and finding |
| `.spec_system/state.json` | Session 03 planned/current workflow state |

---

## Technical Decisions

1. **Inclusive exact limit**: `turn_start` and `tool_execution_start` are the
   only charged events. The event reaching the maximum is recorded and
   immediately stops the run; no event above the configured maximum is
   accepted.
2. **Whole setup is bounded**: the deadline begins before Pi resource, model,
   and session construction. A session arriving after the deadline is aborted
   and disposed without a listener.
3. **First terminal wins**: deadline, step, prompt, dependency, storage, and
   application completion contend for one synchronous decision token.
4. **Complete call evidence**: every valid Pi tool start tracks exact
   run/call/step identity. Normal outcomes carry validated application error
   codes when available; bounded stops synthesize one minimized outcome for
   each open call.
5. **Provider prose is never state**: production completion rereads durable
   qualification and approval evidence. Bounds and dependency failures return
   canonical application text and cannot become completion from assistant
   wording.
6. **Schema changes fail visibly**: version 1 synthetic histories are not
   silently interpreted as version 2; reset or explicit migration is required.
7. **Availability remains fail-closed**: failed lifecycle or terminal evidence
   returns storage failure even if a later terminal append succeeds; incomplete
   audit evidence cannot manufacture a trustworthy run result.

---

## Test Results

| Metric | Value |
|--------|-------|
| Strict type check | PASS |
| Deterministic tests | 221/221 passed |
| Focused lifecycle tests | 21/21 passed |
| Tests added | 23 net |
| Deterministic evals | 5/5 passed |
| Line coverage | 96.96% |
| Branch coverage | 85.71% |
| Function coverage | 97.47% |
| Dependency audit | 0 vulnerabilities |
| Production boundary | Exact three tools; no effect capability |

---

## Lessons Learned

1. Awaitable provider abort is a cleanup request, not a safe result boundary;
   the application must return from its own immutable terminal decision.
2. Counting streaming updates or outcomes would double charge work and make
   provider verbosity alter safety policy. Explicit work-start events keep the
   budget deterministic.
3. SDK `isError` alone misses application-level tool refusals. Closed validated
   tool details must contribute canonical error codes without retaining raw
   results.
4. A deadline can win before a session exists, so late construction needs the
   same abort/dispose rule as late prompt settlement.
5. New injected failure boundaries can lower aggregate branch coverage even
   when happy paths are green; hostile clock, timer, session, cleanup, and
   adapter tests are part of the contract, not test padding.
6. Persisting token-level SDK updates through a flush-and-reread store makes
   provider verbosity an availability input; a closed evidence classifier is
   required at the SDK boundary.
7. A replaceable completion boundary must not carry a second copy of terminal
   state when the lifecycle coordinator already owns durable terminal truth.

---

## Future Considerations

1. Session 04 must resume from trusted checkpoints under the original `runId`
   without replaying approval or fake-effect evidence.
2. Recovery policy must classify retry, resume, compensate, escalate, and stop;
   an indeterminate fake reservation must never retry automatically.
3. Sessions 05-07 must build provider-independent production eval contracts,
   critical deployment gates, and reverted red/fix/green boundary exercises.
4. Real data remains prohibited; automated retention, scoped erasure/export,
   backup/restore, tenant identity, and deployed access controls remain open.

---

## Session Statistics

- **Tasks**: 19 completed
- **Files Created**: 6, including this summary
- **Files Modified**: 20
- **Tests Added**: 23 net
- **Review Findings**: 1 high, 1 medium, and 1 low; all fixed
- **Blockers**: 0
