# Code Review and Repair Report

**Session ID**: `phase03-session02-run-timeline-query-and-redaction`
**Reviewed**: 2026-08-12
**Base Commit**: 8053a43e5e9723284b26a7a3205c190e04c12dd3
**Scope**: Every tracked diff and untracked file since the Session 01 base
**Result**: RESOLVED

## Review Surface

- `src/run-report.ts`: schemas, request/store gates, projection mapping,
  redaction, aggregate semantics, immutability, and text rendering.
- `scripts/run-report.ts`: CLI parsing, exact run validation, filesystem
  preflight, store construction, stdout/stderr separation, and exit codes.
- `tests/run-report.test.ts` and
  `tests/fixtures/run-report-failed.jsonl`: all builder, semantic, bound,
  redaction, file, subprocess, restart, and read-only evidence.
- `package.json`: the sole operator command addition; `package-lock.json` and
  dependency graph are unchanged.
- `docs/build-log-week4.md`, `docs/TODO.md`, and `docs/CHANGELOG.md`: command,
  output, progress, boundaries, counts, and claims.
- `.spec_system/state.json` and all active Session 02 planning and implementation
  artifacts.
- `src/run-event.ts`, `src/event-store.ts`, `src/run-projection.ts`,
  `src/observability.ts`, `src/pi-agent.ts`, `src/server.ts`, approval/effect
  services, and recovery application were inspected as unchanged trust,
  permission, authority, and ordering boundaries.

There are no commits or staged changes after the base. The final review surface
contains 13 logical changed or new files; every file and all 12 pre-report paths
were inspected before this report was created.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. Initial renderer validation called `structuredClone` before proving the
   input graph contained only data properties. A getter-backed hostile report
   executed while the supposedly read-only guard inspected it; malformed store
   outcomes could similarly invoke accessors inside the shared event validator.
   **Fix:** add recursive data-descriptor preflight to report/failure guards,
   rendering, and store outcomes; normalize the request from its own descriptor
   value. Regressions prove request, report, store, and outcome accessors remain
   uninvoked. **Status: FIXED.**
2. Initial summary added every event duration and retry count. Repeated metadata
   could double-count one attempt, and summed operation durations were not the
   run's elapsed latency. **Fix:** derive elapsed duration from first/last exact
   timestamps, retain the maximum observed retry count, rename both fields, and
   semantically revalidate them before rendering. The RED regression supplied
   two 100 ms event durations with the same retry count across a 10 ms timeline;
   the repaired summary reports 10 ms and retry 2. **Status: FIXED.**
3. Initial CLI path refusal used an open string code outside the closed report
   failure union. JSON failure consumers therefore could not validate every
   command outcome with one contract. **Fix:** add `invalid_evidence_path` to
   the finite schema, export one canonical failure factory, and require CLI
   invalid-input/path errors to pass `isRunReportFailure`. **Status: FIXED.**

### Low

1. Initial timeline mapping omitted the bounded durable application version,
   weakening the operator's ability to relate a run to a release. **Fix:** add
   `applicationVersion` to every closed entry and both renderers; the regression
   checks the exact version across the failed-run timeline. **Status: FIXED.**

## Behavior Changes From Review Repairs

- Accessor-backed report and store outcomes are refused without executing the
  accessor before cloning or schema validation.
- Summary latency is exact first-to-last event elapsed time; retry summary is
  the maximum observed count rather than a possibly duplicated sum.
- All CLI failures now share one closed, runtime-valid failure vocabulary.
- Timeline entries include the bounded application version used by the durable event.

## Permission, Privacy, And Documentation Review

- CLI validation checks `runId` before filesystem access, then accepts only a
  non-root regular file within 64 MiB and rejects symlinks. The path never enters
  stdout, stderr, the report, or documentation output.
- The command has no file-write, network, HTTP, approval, fake-send service,
  recovery application, replay, retry, resume, compensation, or deployment
  import. Fixture hashes remain exact across JSON and text runs.
- Output is allowlisted field-by-field. Actors, lead/draft/approval identities,
  hashes, validated arguments, payloads, receipts, idempotency keys, raw errors,
  credentials, URLs, paths, and infrastructure identifiers are absent.
- The exact three-tool Pi allowlist and lightweight health response have no diff.
- Documentation keeps Task `06` open and describes approval/effect events as
  observed-only rather than authority.

## Deliberate Non-Fixes And Boundaries

- The report does not read approval or fake-result stores and cannot verify
  authority; `authority=observed_only` is intentional.
- No restart marker is inferred. Fresh-process parity proves deterministic
  re-read only; Session 04 owns actual restart/recovery drills.
- `src/run-report.ts` is 741 lines because roughly 200 lines are declarative
  closed schemas and types and the remainder is one cohesive projection/report
  boundary. Session 03 alert policy will use a separate module. Split contracts
  only if another responsibility would otherwise enter this file.
- The command remains local operator tooling. Remote access and its identity,
  authorization, tenant, and shared-rate controls are not added.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Review RED/GREEN | PASS | Three new regressions reproduced accessor execution, aggregate overcount, and missing application version before repair |
| Focused tests | PASS | 23/23 report and CLI cases |
| Full verification | PASS | Format, lint, strict types, 316/316 tests, and 18/18 production eval cases |
| Coverage | PASS | 97.65% lines, 85.74% branches, 98.17% functions; report module 96.36% lines and 100% functions |
| Dependency audit | PASS | `npm audit` reports 0 vulnerabilities; dependency/lockfile diff is empty |
| Fixture read-only proof | PASS | SHA-256 identical before/after both formats and across fresh processes |
| File/history refusal | PASS | Missing, malformed, truncated, duplicate, out-of-order, symlink, cross-run, illegal, hostile, and oversized cases refuse visibly |
| Permission cutoff | PASS | Pi/server/tool/approval/effect/recovery diffs empty; source capability scan passes |
| Privacy/security | PASS | Protected-value injection absent from JSON/text; secret scan and path-error checks pass |
| Diff/encoding | PASS | `git diff --check`, ASCII/LF, and CR scans pass |
| Phase cutoff | PASS | No alert, incident drill, deployment, or Phase 04 artifact was created |

## Summary

The complete Session 02 diff was reviewed against exact-base behavior,
projection semantics, hostile boundaries, chronological determinism, output
bounds, redaction, read-only operation, permissions, authority separation, and
documentation truth. Three Medium and one Low findings were reproduced or
contract-checked and repaired. No unresolved finding remains.

## Next Step

Run `validate` for Session 02.
