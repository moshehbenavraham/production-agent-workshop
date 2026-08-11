# Session 03: Bounded Run Lifecycle

**Session ID**: `phase02-session03-bounded-run-lifecycle`
**Status**: Not Started
**Source Task**: `04`
**Estimated Tasks**: ~19
**Estimated Duration**: 2-4 hours

---

## Objective

Enforce one application-owned whole-run deadline and maximum step count while recording complete attempt, outcome, and terminal evidence under the original `runId`.

---

## Scope

### In Scope (MVP)

- Define bounded positive configuration for run deadline and maximum steps with fail-fast environment or application validation.
- Define explicit deadline-exceeded, step-limit-exceeded, dependency-failed, and completed terminal event and stop-reason variants.
- Count the exact model and tool lifecycle events that consume the maximum-step budget and document exclusions.
- Record every required tool attempt and outcome, including validation, permission, storage, timeout, and dependency failures.
- Record minimized run, model or Pi, and tool metadata with step, duration, retry, version, token, and cost availability fields when known.
- Keep application-produced evidence independent from provider prose and runtime-validate replaceable event returns.
- Abort whole-run work once, persist exactly one terminal outcome, and suppress late model or tool settlement.
- Preserve structured failure response mapping without converting timeouts, limits, permission denial, or missing evidence into completion.
- Keep the same `runId` through start, every attempt and outcome, and the terminal event.
- Inject time, timer, session, and event boundaries needed for provider-independent deadline and step-limit tests.
- Add deterministic completion, deadline, late-settlement, maximum-step, invalid-config, tool-failure, terminal-duplication, and event-storage failure tests.
- Record the bounded lifecycle and terminal-event evidence in the Week 3 Build Log.

### Out of Scope

- Restarting or resuming an interrupted run from the projected checkpoint.
- Automatic retry of an approval decision, fake effect, or indeterminate reservation.
- Public cancellation endpoints, distributed workers, or provider-specific budget policy.

---

## Prerequisites

- [ ] Session 02 produces trusted lifecycle projections and closed terminal invariants.
- [ ] Existing qualification timeout and fake-adapter timeout behavior remains independently green.

---

## Deliverables

1. Validated whole-run deadline and maximum-step configuration with closed terminal contracts.
2. Bounded run orchestration that records every required attempt and outcome and persists one terminal result.
3. Provider-independent deadline, step-limit, late-settlement, failure, and event-order tests plus documented evidence.

---

## Success Criteria

- [ ] Every whole run ends within the configured deadline and step budget or records the exact bounded failure.
- [ ] Deadline and maximum-step paths append one visible terminal event and return one non-success stop reason.
- [ ] Every required tool attempt and outcome carries the originating `runId` and minimized structured evidence.
- [ ] Late completion cannot append a second terminal outcome or change the returned run result.
- [ ] Invalid bounds fail before creating runtime files, sessions, timers, or listeners.
