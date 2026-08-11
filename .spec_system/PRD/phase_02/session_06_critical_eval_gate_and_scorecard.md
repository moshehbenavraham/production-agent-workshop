# Session 06: Critical Eval Gate and Scorecard

**Session ID**: `phase02-session06-critical-eval-gate-and-scorecard`
**Status**: Not Started
**Source Task**: `05`
**Estimated Tasks**: ~20
**Estimated Duration**: 2-4 hours

---

## Objective

Implement the reproducible eval runner, deterministic critical deployment gate, result persistence, and compact expected-versus-observed scorecard for the approved golden set.

---

## Scope

### In Scope (MVP)

- Execute every approved golden-set case against deterministic application, tool, store, recovery, clock, and model substitutes.
- Assert schemas, selected tools, validated arguments, event order, grounding, permissions, durable state, idempotency, recovery, terminal status, and stop reason.
- Score critical dimensions as exact pass or fail and keep non-blocking quality measures and aggregates separate.
- Make one critical case or dimension failure set a non-zero process exit regardless of aggregate quality.
- Persist bounded redacted case results, traces, scores, version metadata, duration, and available or unavailable token and cost values.
- Render a compact scorecard naming each failing case, dimension, expected evidence, and observed evidence.
- Validate persisted result and trace data before reporting a case as complete.
- Define provisional latency and cost thresholds from available evidence or mark them explicitly pending without weakening critical gates.
- Integrate the expanded runner with `npm run eval`, `npm run verify`, and the documented pre-deployment verification path.
- Add deterministic runner tests for all-pass, single-critical-failure, multiple failures, quality-only misses, malformed observed evidence, persistence failure, and unavailable usage fields.
- Exercise one injected critical failure and prove it blocks with non-zero status while passing cases remain visible.
- Record the implemented rubric, scorecard format, and critical-failure refusal in the Week 3 Build Log.

### Out of Scope

- Deliberately modifying the three critical production boundaries for final red/fix/green traces.
- Deployed Coolify, provider-quality, or post-deployment monitoring gates.
- Treating averages or model grades as authorization to ignore a critical failure.

---

## Prerequisites

- [ ] Session 05 validates every golden-set case, expected event sequence, critical dimension, and result contract.
- [ ] Task `04` recovery and Phase 01 permission and idempotency tests remain green.

---

## Deliverables

1. Deterministic golden-set runner with critical and non-blocking dimension scoring.
2. Validated redacted result persistence and compact expected-versus-observed scorecard.
3. Non-zero critical failure integration for eval, full verification, and the documented deployment gate, with focused tests.

---

## Success Criteria

- [ ] Every golden-set case reports deterministic evidence for its declared critical dimensions.
- [ ] Any critical failure exits non-zero, identifies the exact mismatch, and blocks the documented deployment path.
- [ ] Non-blocking quality averages cannot mask or override a critical failure.
- [ ] Results retain enough version, trace, duration, token, and cost metadata for one-variable comparisons without leaking protected content.
- [ ] The expanded eval suite remains reproducible without provider credentials or real customer data.
