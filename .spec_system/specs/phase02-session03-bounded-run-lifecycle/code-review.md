# Code Review and Repair Report

**Session ID**: `phase02-session03-bounded-run-lifecycle`
**Reviewed**: 2026-08-11
**Base Commit**: `c39f94b2ddb95b338bdfb4548235d85fb82bdb74`
**Scope**: All tracked and untracked Session 03 changes since the exact base
commit, including workflow state, implementation, tests, documentation, and
this review evidence
**Result**: RESOLVED

## Review Surface

The final review surface contains 28 logical path states: 20 tracked base-diff
paths and eight untracked source, test, and workflow artifacts including this
report and the security report. There are no staged changes and no commit after
the base.

**Logical inventory**:

- Apex workflow and governance evidence (9): state, considerations, cumulative
  security posture, specification, task checklist, implementation notes,
  implementation summary, this report, and the session security report.
- Production source (4): bounded lifecycle, Pi composition, event contract,
  and run projection.
- Deterministic tests (4): lifecycle, Pi composition, event, and projection.
- Runtime and operator documentation (11): environment example, architecture,
  changelog, TODO, HTTP API, Week 3 Build Log, deployment, development,
  environments, onboarding, and incident response.

Every tracked hunk and every untracked text file was inspected. No dependency,
database, UI, route, deployment manifest, real network effect, or write-capable
tool entered the surface.

**Inventory commands**: `git status --short`, `git log --oneline BASE..HEAD`,
`git diff --name-status BASE`, `git diff --numstat BASE`, `git diff --cached
--stat BASE`, and `git ls-files --others --exclude-standard`.

## Findings by Severity

### Critical

No findings.

### High

- `src/run-lifecycle.ts:615` - Every Pi event was normalized and synchronously
  appended, including token-level `message_update` and tool-progress events.
  The private JSONL store flushes and revalidates complete history per append,
  so provider verbosity could exhaust the run deadline, expand the log without
  bound, and make persistence work grow superlinearly. Fix: add an explicit
  fail-closed `shouldPersistPiLifecycleEvent` classifier. Persist bounded
  agent/turn/message boundaries, tool start/end, retry, compaction, and model or
  thinking selection; discard message/tool updates plus queue, entry, and bash
  updates. Regression coverage emits discarded raw updates and proves the
  required tool and lifecycle evidence remains. Status: FIXED.

### Medium

- `src/pi-agent.ts:218` - The replaceable application-completion value carried
  a `stopReason` while the lifecycle coordinator separately validated,
  persisted, and returned its terminal reason. A hostile or future completion
  adapter could therefore create two disagreeing terminal representations in
  the returned production object. Fix: remove `stopReason` from the generic
  value and build the frozen result using only `lifecycle.stopReason`, which is
  the same decision used for the durable terminal. Status: FIXED.

### Low

- `.spec_system/SECURITY-COMPLIANCE.md:18` - SC-004 moved to the resolved table,
  but the posture still counted five open findings and described whole-run
  bounds as absent. Fix: reconcile the open/severity counts, current posture,
  implemented P02 bound control, test total, and partial Phase 02 audit row.
  Status: FIXED.

## Assumptions and Deliberate Non-Fixes

- The deadline covers Pi resource, model, session, prompt, tool, and
  application-completion work after the already durable `run.started` append.
  The terminal append itself must complete before a trustworthy result and can
  finish just after the deadline decision.
- The maximum is inclusive. The consuming event that reaches the limit is
  recorded, then the run stops; no event with a larger step is accepted.
- Unknown future Pi event kinds are not persisted or charged until explicitly
  reviewed. This is fail-closed for evidence volume and permissions; required
  attempt/outcome types remain named and tested against SDK 0.83.0.
- Schema-v1 synthetic logs fail visibly under schema v2. Automatic migration is
  deferred; operators must use an explicit synthetic reset or reviewed
  migration rather than silent mixed-version interpretation.
- `session.abort()` is a best-effort cancellation request. The application
  result is governed by its immutable race winner and does not wait forever for
  provider cancellation or late settlement.
- Replay, resume, automatic retry, compensation, distributed execution, public
  cancellation, provider-backed evidence, and production eval gates remain
  later Phase 02 scope.

## Behavior Changes from Review Repairs

- High-volume SDK update noise no longer causes durable append/fsync/re-read
  work or changes the step budget.
- Required bounded lifecycle and tool attempt/outcome evidence remains durable
  under the same run, call, and step identities.
- One lifecycle-owned terminal reason now controls both persisted evidence and
  the returned production result.
- The cumulative security ledger accurately distinguishes the resolved bound
  control from the four remaining public-production release blockers.

No tool, route, approval decision, fake effect, provider, shell, filesystem
tool, process, network client, credential, or deployment permission was added
by the repairs.

## Security and Privacy Review

- Injection: PASS - no SQL, shell, template, process, or network interpreter is
  introduced; all replaceable values cross closed runtime checks.
- Secrets: PASS - scans found no credential value and caught dependency detail
  never enters canonical evidence or public bounded results.
- Sensitive data: PASS - lifecycle evidence excludes prompts, raw arguments,
  raw results, transcript text, full drafts, lead profiles, stack traces,
  credentials, and arbitrary provider messages. Fixtures are synthetic.
- Dependencies: PASS - no package dependency changed and `npm audit --omit=dev`
  reports zero vulnerabilities.
- Permission and side effects: PASS - the production allowlist remains exactly
  `qualify_lead`, `draft_follow_up`, and `request_send_approval`; fake/write
  execution remains unreachable from Pi and HTTP.
- GDPR: N/A for real-data processing - no collection, purpose, consent,
  retention, erasure, export, or third-party-transfer claim was added.

## Evidence Ledger

| Check | Command or inspection | Result | Evidence |
|-------|-----------------------|--------|----------|
| Analyzer | `.spec_system/scripts/analyze-project.sh --json` | PASS | Phase 02 Session 03 is current; eleven predecessor sessions are complete |
| Review inventory | Git base-diff and untracked-path commands | PASS | 28 final logical paths; no staged or post-base commit |
| Focused repairs | Focused lifecycle, Pi, event, and projection tests | PASS | 69/69 cases cover both code findings and surrounding contracts |
| Full verification | `npm run verify` | PASS | Format, lint, strict TypeScript, 221/221 tests, and 5/5 evals pass |
| Coverage | `npm run test:coverage` | PASS | 96.96% lines, 85.71% branches, and 97.47% functions exceed configured gates |
| Dependency audit | `npm audit --omit=dev` | PASS | Zero vulnerabilities and no dependency change |
| Production boundary | Exact static allowlist and permission regression | PASS | Exactly three bounded tools and no effect capability |
| Encoding and whitespace | Base-diff/untracked ASCII, CRLF, terminal-LF, and `git diff --check` scans | PASS | Text remains ASCII/LF with no whitespace error |
| Secrets and data | Sensitive-name/value and minimized-event inspection | PASS | No credential value, real customer data, or raw dependency payload |
| Behavioral quality | Deadline, trust, persistence, mutation, permission, and failure review | PASS | Three findings repaired; no unresolved violation |
| UI surface | Changed-path inspection | N/A | No route, page, component, style, or rendered UI changed |
| Database/schema | Changed-path and architecture inspection | N/A | No database layer or migration exists; TypeBox is an application contract |

## Summary

1. Reviewed every Session 03 path from the exact base commit.
2. Resolved zero critical, one high, one medium, and one low finding with direct
   regression or ledger evidence.
3. Preserved synthetic-only operation, exact three-tool permission, dedicated
   authorization/result truth, and the no-real-effect boundary.
4. Full verification, coverage, audit, encoding, whitespace, security, and
   behavioral-quality gates pass with no unresolved finding.

Next command: `validate`
