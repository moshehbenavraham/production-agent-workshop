# Implementation Notes

**Session ID**: `phase03-session02-run-timeline-query-and-redaction`
**Started**: 2026-08-12 02:22 IDT
**Last Updated**: 2026-08-12 02:35 IDT

---

## Session Progress

| Metric | Value |
|--------|-------|
| Tasks Completed | 18 / 18 |
| Estimated Remaining | 0 hours |
| Blockers | 0 |

## Objective And Constraints

Build one deterministic exact-`runId` report over complete durable events while
preserving the existing semantic projection, synthetic-data restriction,
observed-only authority label, exact Pi allowlist, lightweight health response,
and prohibition on report-side mutation.

Measurable completion checks are 23 focused report tests, strict types,
formatter/lint, the complete repository suite, 18 production evals, coverage
thresholds, dependency audit, byte-identical CLI input, and protected-content
absence from both formats.

## Task Evidence

### T001-T002 - Baseline And Evidence Inventory

- Confirmed clean pushed base `8053a43`, version `0.1.32`, 293 tests, 18 evals,
  the exact `qualify_lead`, `draft_follow_up`, `request_send_approval` Pi
  allowlist, and unchanged `GET /health` source.
- Read Task `06`, all run-event variants, file-store validation and failures,
  semantic projection prerequisites, terminal compatibility, and observed-only
  approval/effect behavior.
- Chose the existing `projectRunEvents` fold as the mandatory success gate so
  reporting cannot create a second interpretation of ordering or prerequisites.

### T003-T007 - Contracts And Fail-Closed Boundary

- Added closed request, report, entry, terminal, metrics, token, and failure
  schemas with no additional properties.
- Added exact own-data request inspection so inherited, accessor, extra, symbol,
  and invalid `runId` inputs fail before a store read.
- Located `readRun` as a data method without invoking an accessor, caught throws,
  and accepted only runtime-valid closed read outcomes.
- Mapped file and projection failures into finite operator categories without
  paths, raw messages, event content, or indices.
- Required non-empty evidence, at most 1,000 matching events, a complete semantic
  projection, bounded aggregates, closed schema validation, and deep freezing
  before returning success.

### T008-T010 - Timeline, Metrics, And Rendering

- Mapped every event field through an explicit allowlist into run, model, tool,
  approval, domain, effect, or terminal layers.
- Omitted event IDs, run lead, actors, arguments, draft identity/hash, approval
  identity, receipts, idempotency keys, payloads, raw errors, paths, URLs, and
  infrastructure identifiers.
- Added finite permission and side-effect classifications while labeling the
  complete report `authority=observed_only`.
- Preserved measured-zero duration, token, and cost values; used explicit
  `unavailable:not_reported` when no provider value exists.
- Derived elapsed run time from the first and last durable timestamp, retained
  the maximum observed retry count without double-counting repeated event
  metadata, and aggregated token and cost facts with safe-number checks.
- Added semantic validation for sequence, time, aggregates, token totals, event
  counts, and terminal kind/reason before either renderer accepts a report.
- Text output is deterministic, LF-terminated, and bounded to 512 KiB; JSON uses
  the same validated machine report.

### T011-T013 - Read-Only CLI And Preserved Fixture

- Added `npm run report:run -- --run-id ... --event-log ... --format text|json`.
- CLI validates the exact run ID before path access, then accepts only a resolved
  non-root regular file of 2 bytes through 64 MiB, rejecting symlinks and missing
  or private path detail.
- The command constructs only the existing event reader path, never calls append,
  and imports no approval, fake-send service, recovery application, HTTP, network,
  or write primitive.
- Added four complete runtime-valid synthetic records for
  `run_report_fixture`: start, attempted qualification, timeout failure, and
  `qualification_failed` terminal.
- Text and JSON fixture commands return exit 0 with the same ordered facts; fresh
  subprocesses return byte-identical JSON.

### T014-T016 - Redaction, Permission Cutoff, And Documentation

- Injected a synthetic private URL, provider payload marker, actor ID, and lead ID
  into valid durable evidence and proved none appear in the report object or text.
- Hashed the preserved fixture before and after both CLI formats and proved exact
  byte equality.
- Proved invalid arguments, unsafe/missing/symlink paths, missing runs, malformed
  JSON, truncation, duplicates, and out-of-order files have empty stdout and
  finite non-zero refusals.
- Source assertions exclude file-write, approval-service, fake-send-service,
  recovery, server, and network primitives from the CLI.
- Added the command contract, Mermaid flow, exact failed-run output, progress,
  and changelog entry while retaining Task `06` as incomplete.

### T017-T018 - Verification And Final Diff Review

- Focused command: `npx tsx --test tests/run-report.test.ts`.
  - Result: PASS - 23/23 cases after code-review regressions.
- Type command: `npx tsc --noEmit`.
  - Result: PASS.
- Source check: `npx biome check src/run-report.ts scripts/run-report.ts tests/run-report.test.ts package.json`.
  - Result: PASS.
- Preserved fixture commands in text and JSON modes.
  - Result: PASS - deterministic output and unchanged SHA-256.
- Final full verification, coverage, audit, encoding, and complete diff results
  are recorded below.
- Full command: `npm run verify`.
  - Result: PASS - formatting, lint, strict types, 316/316 tests, and 18/18
    production eval cases.
- Coverage command: `npm run test:coverage`.
  - Result: PASS - 97.65% lines, 85.74% branches, and 98.17% functions; the new
    report module has 96.36% lines, 85.65% branches, and 100% functions.
- Dependency command: `npm audit`.
  - Result: PASS - zero known vulnerabilities and no dependency change.

## Failure-Path Matrix

| Path | Expected result | Evidence |
|------|-----------------|----------|
| Missing exact run | `missing_run`, exit 1, empty stdout | Focused subprocess test |
| Malformed JSON | `corrupt_history`, exit 1 | Complete-file test |
| Missing LF | `interrupted_history`, exit 1 | Truncated-file test |
| Duplicate event | `duplicate_history`, exit 1 | Duplicate-file test |
| Decreasing time | `out_of_order_history`, exit 1 | Reordered-file test |
| Cross-run/illegal sequence | `conflicting_history`, no report | Builder tests |
| 1,001 events | `report_too_large` | Boundary test |
| Invalid/symlink path | `invalid_evidence_path`, exit 2 | CLI preflight tests |
| Throwing/malformed store | `storage_failure` | Hostile boundary tests |
| Invalid report to renderer | `render_failure` | Closed/semantic renderer tests |

## Permissions And Side Effects

- Pi allowlist: unchanged exact three tools.
- HTTP: no route or response change.
- Approval/effect authority: unchanged; report says `observed_only`.
- Filesystem: CLI reads one preflighted event file and never opens a writer.
- Network/provider/subprocess in production command: none.
- Tests: subprocesses and temporary files only, with cleanup.

## Remaining Boundaries

- The report is local operator tooling, not an authenticated remote interface.
- It reports observed approval and effect events but does not read or verify the
  separate authority stores.
- It does not infer a restart or recovery action that durable evidence does not
  explicitly identify.
- Alert policy, incident commands, and drills remain Sessions 03 and 04.

## Next Step

Run `creview` for Session 02.
