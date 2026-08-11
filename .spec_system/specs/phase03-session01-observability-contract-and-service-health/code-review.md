# Code Review and Repair Report

**Session ID**: `phase03-session01-observability-contract-and-service-health`
**Reviewed**: 2026-08-12
**Base Commit**: 9338985be31675c245bd20cf4361ba894173b92c
**Scope**: Every tracked diff and untracked file since the Phase 02 base
**Result**: RESOLVED

## Review Surface

- `.spec_system/state.json` and the Session 01 specification, checklist,
  implementation notes, and this review report.
- `src/observability.ts` and `tests/observability.test.ts`: all schemas,
  factories, semantic guards, collector boundaries, collection behavior, and
  positive, negative, hostile-input, and permission regressions.
- `docs/CHANGELOG.md`, `docs/TODO.md`, and `docs/build-log-week4.md`: current
  behavior, Task `06` status, redaction boundaries, field map, and verification
  evidence.
- The byte-identical Phase 01 archive move. Sessions 01 through 05 each contain
  `IMPLEMENTATION_SUMMARY.md`, `code-review.md`, `implementation-notes.md`,
  `security-compliance.md`, `spec.md`, `tasks.md`, and `validation.md`; Session
  06 also contains `permission-decision.md`. Every destination was compared
  with the corresponding file at the base commit.
- `src/server.ts`, `src/pi-agent.ts`, `src/tools.ts`, and
  `src/safe-write-application.ts` were inspected for health-route, tool,
  permission, and side-effect drift. Package and dependency state were also
  reviewed.

There are no commits or staged changes after the base. The final inventory is
96 changed paths representing 53 current logical files: 43 paired archive
moves, four tracked metadata/documentation updates, four active session
artifacts, and the source and test modules. All changes were reviewed.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. Initial collector boundary validation accepted inherited properties,
   getter-backed values, and symbol-keyed hidden properties. A hostile object
   could therefore pass preflight or execute an accessor while being
   inspected. **Fix:** `src/observability.ts:355` now uses own data-property
   descriptors and `Reflect.ownKeys` for every collector boundary and result;
   `tests/observability.test.ts:604` proves inherited, accessor, and symbol
   variants fail without invoking a getter. **Status: FIXED.**
2. Initial run and tool semantic guards accepted impossible combinations, and
   the run stop-reason vocabulary omitted the existing `agent_run_failed`
   terminal. A completed run could claim a failure stop reason, or a forbidden
   tool could claim a successful effect. **Fix:** `src/observability.ts:176`
   adds the terminal reason, while the guards at `src/observability.ts:819`
   enforce the exact run outcome matrix and fail-closed permission/effect
   combinations. `tests/observability.test.ts:654` covers the repaired cases.
   **Status: FIXED.**

### Low

1. Initial dependency ordering used locale-sensitive comparison. Punctuation
   order varied from the contract's stable identifier order across runtimes
   and locales. **Fix:** `src/observability.ts:662` compares bounded ASCII IDs
   by code point; `tests/observability.test.ts:629` locks the `a-`, `a.`, `a_`
   order. **Status: FIXED.**

## Behavior Changes From Review Repairs

- Collector preflight reads only explicit own data properties and rejects
  prototype, accessor, and symbol smuggling before acquiring a boundary.
- Run observations now represent every current terminal with one exact
  outcome, stop-reason, and error combination.
- Tool observations cannot turn forbidden or denied permission into an
  attempted or successful effect.
- Dependency reports use stable ASCII ordering independent of host locale.

## Permission, Privacy, And Documentation Review

- `GET /health` remains exactly `{"status":"ok"}`; the detailed collector is
  a library boundary and is not remotely exposed.
- The production Pi allowlist remains exactly `qualify_lead`,
  `draft_follow_up`, and `request_send_approval`. No tool, route, adapter,
  effect, or approval
  authority was added.
- Observation schemas exclude credentials, payloads, raw errors, paths,
  private targets, lead attributes, draft content, approval records, and
  effect receipts. Error and dependency labels use finite or bounded values.
- Documentation says Task `06` is in progress and does not claim incident or
  deployment controls that later Phase 03 sessions must still prove.

## Deliberate Non-Fixes And Boundaries

- The detailed service snapshot remains library-only. An authenticated
  operator query belongs to Session 02; changing the public health route here
  would expand the permission surface beyond this specification.
- `src/observability.ts` is longer than the preferred module-size guideline
  because it owns one cohesive closed contract: four schemas, their semantic
  guards, and the service collector. Session 02 reporting will use a separate
  module rather than extending this file; split the contract only if a new
  responsibility is added.
- Observation data remains explanatory, never authoritative. Approval records
  and fake-result records retain all approval and effect authority.
- No persistence, alert delivery, public endpoint, provider call, credential,
  network effect, or deployment behavior was added.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Review RED/GREEN | PASS | All three added regressions failed for their original causes, then passed after repair |
| Focused tests | PASS | 20/20 observability tests |
| Full verification | PASS | Format, lint, strict types, 293/293 tests, and 18/18 production eval cases |
| Coverage | PASS | 97.72% lines, 85.60% branches, 98.04% functions; observability module 98.73% lines and 100% functions |
| Dependency audit | PASS | `npm audit` reports 0 vulnerabilities; no dependency changed |
| Archive integrity | PASS | All 43 Phase 01 destination files are byte-identical to their base-commit sources |
| Diff/encoding | PASS | `git diff --check` plus ASCII/LF and CR scans pass |
| Permission cutoff | PASS | Exact three-tool allowlist and minimal health response unchanged; no new route or effect import |
| Privacy/security | PASS | No credential, protected value, path, private target, raw error, payload, provider, or authority field is emitted |
| Phase cutoff | PASS | No Phase 04 artifact was created or modified |

## Summary

The complete Session 01 diff was reviewed against the specification,
repository security constraints, closed-schema semantics, hostile boundary
inputs, redaction, deterministic behavior, least privilege, archive integrity,
and documentation truth. Two Medium and one Low findings were reproduced and
repaired. No unresolved finding remains, and the session is ready for
independent validation.

## Next Step

Run `validate` for Session 01.
