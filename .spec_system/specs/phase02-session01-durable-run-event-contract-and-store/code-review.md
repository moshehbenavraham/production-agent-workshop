# Code Review and Repair Report

**Session ID**: `phase02-session01-durable-run-event-contract-and-store`
**Reviewed**: 2026-08-11
**Base Commit**: `5c5de157c86fc8267d0b3db60f9039a47bcf53ac`
**Scope**: All changes since the exact base commit, including tracked,
untracked, archived-session relocation, Phase 02 planning, implementation,
documentation, tests, and this review artifact
**Result**: RESOLVED

## Review Surface

The final surface contains 73 path states: 37 tracked base-diff paths and 36
untracked paths. The 21 deleted Phase 00 session artifacts and their 21
untracked archive destinations are exact byte-for-byte relocations, so the
surface represents 52 logical artifacts.

**Logical inventory**:

- Apex workflow and planning (14): master PRD, state, the Phase 02 PRD and
  seven session stubs, and four active Session 01 artifacts including this
  report.
- Exact archive relocations (21): all seven validated artifacts from each of
  the three completed Phase 00 sessions.
- Workshop documentation (3): changelog, TODO, and Week 3 Build Log.
- Production source (6): the new run-event contract plus the event store,
  approval service, fake-send service, Pi orchestration, and tool boundaries.
- Deterministic tests (8): the new run-event contract and helper files plus six
  migrated integration suites.

There are no staged changes and no commit after the base. Every tracked hunk,
every untracked text file, and the final report were read in full. No binary or
generated artifact entered the surface.

**Inventory commands**: `git status --short`, `git log --oneline BASE..HEAD`,
`git diff --name-status BASE`, `git diff --numstat BASE`, `git diff --cached
--stat BASE`, and `git ls-files --others --exclude-standard`.

## Findings by Severity

### Critical

No findings.

### High

No findings.

### Medium

- `src/event-store.ts:177` - The adapter defaulted event metadata to the
  literal application version `0.1.22`. The mandatory Apex closeout version
  increment would therefore make newly recorded events stale immediately
  after Session 01. Fix: load and validate the installed package version once
  through the Node module boundary, export `APPLICATION_VERSION`, and use it
  as the default while retaining explicit injection for tests and adapters.
  `tests/event-store.test.ts:68` proves the default event value equals the
  current package metadata. Status: FIXED.
- `src/pi-agent.ts:298` - Every `run.completed` event claimed metadata result
  `succeeded`, and a generic `completed` stop claimed approval state
  `approved`. The stop can also represent a declined terminal decision, while
  not-found, qualification-failure, and approval-failure stops are not
  successful outcomes. Fix: centralize completion metadata so pending maps to
  `pending`, exact completion maps to `succeeded`, refusal/failure stops map to
  `stopped`, and approval state is `null` unless pending is actually known.
  `tests/pi-agent.test.ts:273` covers all five stop reasons. Status: FIXED.

### Low

- `.spec_system/state.json:38` - Session planning appended its history entry
  without Apex's required 20-entry bound and removed a newer validation entry
  instead of trimming the oldest records. Fix: rebuild the field as the exact
  final 20 entries from the prior audit trail plus the new planned entry. The
  analyzer still selects Session 01 and `jq` confirms exactly 20 entries.
  Status: FIXED.

## Assumptions and Deliberate Non-Fixes

- The Phase 00 artifact changes are retention-driven archive moves, not
  deletions. Each destination compares byte-for-byte with its source at the
  base commit; their historical status wording remains untouched.
- The Session 01 specification remains a planning snapshot. Current execution
  state belongs in `tasks.md`, `implementation-notes.md`, this report, and the
  later validation artifact.
- Session 01 intentionally establishes trusted event history only. Run
  projection, semantic checkpoint ordering, whole-run bounds, replay, and
  resume remain assigned to Sessions 02-04 and are not missing Session 01
  behavior.
- Approval records and fake-result records remain authorization and effect
  truth. Operational events cannot grant approval or prove an effect, even
  when their envelope is valid.
- The JSONL adapter intentionally documents single-process, non-transactional
  semantics. An indeterminate write reports `interrupted_write`; distributed
  writer coordination is not claimed.
- The Build Log's `0.1.22` JSON record is a concrete Session 01 evidence
  example. Runtime defaults now follow the installed package version after
  future increments.
- No provider-backed Pi request was required or run. The changed application
  contracts are covered by provider-independent deterministic tests.

## Behavior Changes from Review Repairs

- Default run-event metadata now follows the installed project version rather
  than a source literal.
- Run-completion metadata no longer invents approval state or report refusal
  stops as successful outcomes.
- Apex workflow history now satisfies its bounded audit-trail contract.

No tool, HTTP, approval-decision, fake-effect, provider, network-write, shell,
filesystem-tool, or deployment permission was added by the repairs.

## Security and Privacy Review

- Injection: PASS - the session adds no SQL, shell, LDAP, template, or network
  interpreter; event input and persisted records cross closed runtime guards.
- Secrets: PASS - credential/private-key scans found no value, and errors are
  canonicalized without dependency text or paths.
- Sensitive data: PASS - owned event variants exclude full drafts, lead profile
  content, credentials, raw SDK objects, and caught detail. Fixtures remain
  synthetic.
- Dependencies: PASS - no package dependency changed and `npm audit` reports
  zero vulnerabilities.
- Permission and side effects: PASS - the production allowlist remains exactly
  three bounded tools; dedicated approval/fake-result stores remain required
  before any internal fake effect.
- GDPR: N/A for new real-data processing - no real personal-data path,
  retention claim, deletion mechanism, or third-party transfer was added.

## Evidence Ledger

| Check | Command or inspection | Result | Evidence |
|-------|-----------------------|--------|----------|
| Analyzer | `bash .spec_system/scripts/analyze-project.sh --json` | PASS | Phase 02 Session 01 resolves; nine predecessor sessions remain complete; seven Phase 02 candidates exist |
| State contract | `jq '.next_session_history | length' .spec_system/state.json` | PASS | Exact bounded length is 20 after appending the planned entry |
| Targeted repairs | Event-store and Pi-agent focused Node tests | PASS | 21/21 focused tests pass, including package-version and five-stop metadata regressions |
| Full verification | `npm run verify` | PASS | Format, lint, strict TypeScript, 176/176 tests, and 5/5 evals pass with no skip, cancel, or todo |
| Coverage | `npm run test:coverage` | PASS | 95.72% lines, 87.20% branches, and 96.86% functions exceed configured thresholds |
| Dependency audit | `npm audit` | PASS | Zero vulnerabilities |
| Durable adapter | Contract/store and affected integration suites | PASS | Closed variants, restart, private mode, corruption, truncation, duplicates, order, no-op, hostile, and I/O paths pass |
| Archive integrity | `cmp` of 21 destinations against base-commit sources | PASS | Every Phase 00 archive relocation is byte-for-byte exact |
| Encoding | Byte scan over all final existing changed paths | PASS | All files are ASCII, use LF only, and end in LF |
| Links | Repository Markdown relative-target scan | PASS | 132 Markdown files have zero missing relative targets |
| Secrets | Credential/private-key pattern scan over source, tests, docs, PRD, specs, and state | PASS | Zero matches |
| Whitespace | `git diff --check BASE` | PASS | No whitespace errors |
| Behavioral quality | Trust, cleanup, mutation, failure, and contract-alignment review | PASS | Three findings repaired; no unresolved violation |
| UI surface | Changed-path and deliverable inspection | N/A | No route, component, style, page, or rendered UI changed |
| Database/schema | Changed-path and architecture inspection | N/A | No database layer or migration exists; TypeBox schemas are application contracts |
| Final diff re-read | Full base diff plus every untracked text file | PASS | No unresolved defect, debug artifact, secret, permission drift, or deferred-scope claim remains |

## Summary

1. Reviewed 52 logical artifacts across planning, archive retention,
   documentation, production source, and deterministic tests.
2. Resolved zero critical, zero high, two medium, and one low finding with
   direct regression or state-invariant evidence.
3. Preserved the single-agent, synthetic-only, exact-three-tool, dedicated
   authorization/result truth, and no-real-write boundaries.
4. Full verification, coverage, audit, archive, state, encoding, links,
   whitespace, secret, security, and behavioral-quality gates pass.

Next command: `validate`
