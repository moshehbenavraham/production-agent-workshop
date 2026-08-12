# Code Review and Repair Report

**Session ID**: `phase03-session03-alerts-and-incident-runbook`
**Reviewed**: 2026-08-12
**Base Commit**: a843cb4eb1b009ed7d2408e9c67550312cf26a1d
**Scope**: Every tracked diff and untracked file since the Session 02 base
**Result**: RESOLVED

## Review Surface

- `src/alerts.ts`: schemas, default policy, request cloning/validation, window
  selection, all seven rule evaluators, suppression, evidence minimization,
  semantic result guards, immutability, and purity.
- `tests/alerts.test.ts`: threshold edges, bounds, unavailable and not-applicable
  behavior, suppression edges, hostile input, redaction, purity, and output semantics.
- `docs/runbooks/agent-incident-response.md` and
  `docs/runbooks/incident-response.md`: implemented commands, application-only
  recovery boundaries, no-retry rules, unsupported capabilities, and escalation.
- `docs/build-log-week4.md`, `docs/TODO.md`, `docs/CHANGELOG.md`, and `README.md`:
  alert thresholds, progress, evidence, navigation, and claim accuracy.
- `.spec_system/state.json` and all active Session 03 planning and implementation
  artifacts.
- `src/observability.ts`, `src/run-report.ts`, `src/recovery-application.ts`,
  `src/pi-agent.ts`, and `src/server.ts` were re-read as the unchanged metric,
  inspection, recovery, permission, and HTTP boundaries.

The complete review surface contains 12 changed or new files. No source route,
Pi tool, approval/effect operation, dependency, deployment file, or external
integration has a diff.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. The initial repeated-task evaluator counted observations, not distinct runs.
   Multiple snapshots of one failed `runId` could therefore reach the configured
   threshold without multiple failed tasks. **Fix:** deduplicate failed/stopped
   observations by exact `runId` before counting. A regression supplies the same
   failure twice and proves the evidence count remains one. **Status: FIXED.**
2. The initial exported `isAlertEvaluation` guard checked only the TypeBox shape.
   A structurally valid value could pair one rule with another evidence source,
   claim a trigger below threshold, use an impossible unavailable reason, or
   duplicate a result identity. **Fix:** add complete semantic validation for
   window identity, unique rule IDs, fixed source/action/unit mappings, evidence
   ranges, threshold relationships, availability reasons, and suppression state.
   A table of impossible outputs now fails closed. **Status: FIXED.**

### Low

1. A caller-crafted result could carry a future last-trigger timestamp or a
   threshold/value outside the rule-specific domain while remaining structurally
   valid. **Fix:** validate canonical non-future cooldown timestamps and exact
   integer/range semantics per rule, including distinct count evidence and the
   100% storage ceiling. **Status: FIXED.**

## Behavior Changes From Review Repairs

- Repeated failures represent distinct failed/stopped runs rather than sampling frequency.
- Public result validation now refuses impossible alert meaning, not just extra fields.
- Future cooldown timestamps and rule-incompatible evidence ranges fail closed.
- Accessor-backed output checks still refuse without invoking accessors.

## Permission, Privacy, And Documentation Review

- The evaluator accepts only closed minimized observation variants, validates
  complete input before use, selects a maximum 24-hour window, and emits only a
  finite evidence summary. It never spreads or serializes raw observations.
- Alert source contains no HTTP/HTTPS, fetch, webhook, pager, file-write,
  append, Pi registration, approval, effect, or recovery import.
- Tests inject protected strings and confirm results omit credentials, paths,
  URLs, raw errors, provider content, and lead/draft/approval/effect details.
- The exact production Pi allowlist and lightweight health response have no diff.
- The runbook says pause is external, report inspection is read-only, retry is
  caller-controlled, resume is internal-only, compensation is unsupported,
  corrupt/indeterminate authority escalates, and completed effects stop.
- Task `06` and incident drills remain open; no production on-call, alert delivery,
  operator recovery transport, or deployment capability is claimed.

## Deliberate Non-Fixes And Boundaries

- Alert evaluation remains a pure library. Scheduling, persistence of cooldown
  state, and notification delivery are intentionally absent.
- The caller supplies already-minimized observations and `lastTriggeredAt`; the
  evaluator does not read logs, providers, or infrastructure.
- No running/pending observation is a clear stuck-run candidate; the result uses
  a null measured maximum with zero observed candidates rather than inventing zero latency.
- `src/alerts.ts` is 981 lines because it holds roughly 300 lines of closed
  declarative schemas/default vocabulary plus one cohesive trust-boundary
  evaluator and semantic guard. Splitting would duplicate the fixed rule mapping;
  split only if scheduling, delivery, or another responsibility is later added.
- Session 04 owns incident execution. This session documents paths but does not
  present any of the five required drills as complete.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Review RED/GREEN | PASS | Regressions cover duplicate-run overcount and impossible output semantics |
| Focused tests | PASS | 22/22 alert cases |
| Full verification | PASS | Format, lint, strict types, 338/338 tests, and 18/18 production eval cases |
| Coverage | PASS | 97.73% lines, 85.80% branches, 98.29% functions; alerts module 98.78% lines, 87.56% branches, 100% functions |
| Dependency audit | PASS | `npm audit` reports 0 vulnerabilities; dependency and lockfile diff are empty |
| Permission cutoff | PASS | Pi/server/tool/approval/effect/recovery/deployment diffs empty; purity test passes |
| Privacy/security | PASS | Protected-value injection absent from output; capability and secret-pattern scans pass |
| Diff/encoding | PASS | `git diff --check`, ASCII/LF, and CR scans pass |
| Phase cutoff | PASS | No incident drill, alert delivery, deployment, or Phase 04 artifact was created |

## Summary

The complete Session 03 diff was reviewed against exact-base behavior, rule
semantics, hostile input, cardinality, unavailable measurements, suppression,
output minimization, permission boundaries, recovery truth, and documentation
accuracy. Two Medium and one Low findings were repaired and regression-tested.
No unresolved finding remains.

## Next Step

Run `validate` for Session 03.
