# Code Review and Repair Report

**Session ID**: `phase01-session02-approval-store-and-projection`
**Reviewed**: 2026-08-04
**Base Commit**: 068dd044f52deb419142c85fad230f1aca2f5ea1
**Scope**: All changes since the base commit (uncommitted work plus mid-session commits)
**Result**: RESOLVED

## Review Surface

**Files reviewed** (all changes since the base commit):

- `.spec_system/state.json` - tracked active-session state.
- `.spec_system/specs/phase01-session02-approval-store-and-projection/spec.md` - untracked specification.
- `.spec_system/specs/phase01-session02-approval-store-and-projection/tasks.md` - untracked completed checklist.
- `.spec_system/specs/phase01-session02-approval-store-and-projection/implementation-notes.md` - untracked task evidence.
- `src/approval-store.ts` - untracked projection and file adapter.
- `tests/approval-store.test.ts` - untracked persistence and failure regressions.
- `docs/build-log-week2.md` - tracked storage/restart evidence.
- `docs/TODO.md` - tracked active status.
- `docs/CHANGELOG.md` - tracked Unreleased entry.

There are no staged files or mid-session commits. Every untracked text file was
read in full; no binary, generated file, dependency, provider credential,
network call, HTTP route, Pi tool, or allowlist change is present.

**Inventory commands**: `git status`, `git log --oneline "$BASE"..HEAD`,
`git diff "$BASE"`, `git diff --cached "$BASE"`, and
`git ls-files --others --exclude-standard`.

## Findings by Severity

### Critical

No findings.

### High

No findings.

### Medium

- `src/approval-store.ts:61` - The read boundary inspected `.code` on an
  arbitrary caught value. An injected reader throwing `null` escaped with a
  `TypeError`, contradicting the typed storage-failure contract. Fix: safely
  narrow unknown errors before recognizing `ENOENT`, validate the runtime read
  result as a string, and add thrown-null/non-string regressions. Status: FIXED.
- `src/approval-store.ts:256` and `src/approval-store.ts:311` - Injected record-ID
  or clock providers executed before `writeApprovalRecord` entered its catch
  boundary, so their exceptions escaped instead of returning a redacted
  `storage_failure`. Fix: construct metadata inside a dedicated typed exception
  boundary before either append, prove the writer is never called, and prove a
  fresh store sees no state. Status: FIXED.

### Low

No findings.

## Assumptions and Deliberate Non-Fixes

- The adapter remains single-process. Multi-process locking, database
  transactions, and automated repair are explicitly deferred by the Phase 01
  PRD and Session 02 specification; partial or competing writes therefore fail
  visibly instead of being silently repaired.
- The store persists approved terminal records supplied by an application
  service but does not own actor policy. Session 03 is required to authorize an
  actor at the domain boundary before calling `appendDecision`; the projection
  only proves record shape, sequence, and identity.
- Full synthetic draft content is intentionally part of the durable approval
  record, while operational event data remains minimized. Runtime path selection
  and lifecycle enforcement remain Session 03 scope.

## Behavior Changes

- All reader failures, including arbitrary thrown JavaScript values and runtime
  contract violations, now return redacted typed storage failures.
- Record metadata dependency failures now append zero bytes and return redacted
  typed storage failures for both request and decision paths.

## Evidence Ledger

| Check | Command or Inspection | Result | Evidence / Blocker |
|-------|-----------------------|--------|--------------------|
| Focused tests | `npx tsx --test tests/approval-store.test.ts` | PASS | 13/13 tests pass, including four review regression cases |
| Full tests | `npm run verify` | PASS | Formatting/types pass, 70/70 tests pass, 5/5 evals pass |
| Dependency audit | `npm audit --audit-level=low` | PASS | 0 vulnerabilities |
| Linter | Package scripts and `biome.json` inspection | N/A | No linter is configured in the Session 02 base |
| Formatter | `npm run format` then `npm run format:check` via verify | PASS | 20 scoped files checked with no remaining fix |
| Type checker | `npm run check` and full verify | PASS | Strict TypeScript exits 0 |
| Security | Targeted credential, network, process, path, and permission scans | PASS | Only historical documentation command patterns matched; no credential or capability addition exists |
| Final diff re-read | Base diff plus all untracked files | PASS | All nine implementation files reviewed; no unresolved issue |

## Summary

1. Reviewed nine files across workflow state, session evidence, storage source,
   tests, and maintained documentation.
2. Found and repaired two Medium exception-boundary defects with regression
   tests proving typed failure and zero persisted state.
3. Left no finding unresolved and made no unrelated refactor.
4. Focused tests, strict types, 70 deterministic tests, five evals, dependency
   audit, security scans, and final diff inspection pass.
