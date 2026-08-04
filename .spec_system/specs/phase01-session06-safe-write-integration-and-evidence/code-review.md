# Code Review and Repair Report

**Session ID**: `phase01-session06-safe-write-integration-and-evidence`
**Reviewed**: 2026-08-04
**Base Commit**: ae4af5aff10894095eb5043249be4e352e16ac84
**Scope**: All changed and untracked files since the pushed base
**Result**: RESOLVED

## Review Surface

- `.spec_system/state.json` and all Session 06 planning, permission, task, and
  implementation artifacts.
- `src/safe-write-application.ts` - paths/options, permission decision, actor
  snapshots, store/service construction, and delegated methods.
- `src/fake-send-service.ts` - shared-event envelope validation, fake namespace
  selection, evidence recovery, and existing effect ordering.
- `tests/safe-write-application.test.ts` plus all existing approval/fake-send/
  Pi tests - complete required paths, restart, evidence, permissions, adapter
  failures, and production exclusion.
- README and `docs/` - architecture, Task `03` proof, environment/development
  boundary, permission language, tracking, and changelog.
- `src/pi-agent.ts`, `src/server.ts`, package/dependency state, and changed-path
  inventory were inspected for production or Phase 02 capability drift.

There are no Session 06 commits after the base. Every tracked diff and untracked
source, test, documentation, and workflow artifact was included.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. Initial `src/fake-send-service.ts:164` - Duplicate terminal-event recovery
   required every event in a run to satisfy the fake-send event schema. The
   real composed log already contains valid approval events, so a new
   application instance returned `storage_failure` instead of the durable
   original. **Fix:** validate every generic event envelope, ignore valid
   non-fake domains, and independently require exact schema/type agreement for
   any event whose outer or inner discriminant claims `fake_send.*`. The
   file-backed restart regression both succeeds with approval events and fails
   closed on a malformed fake namespace claim. **Status: FIXED.**
2. Initial `src/safe-write-application.ts` constructor - Actor snapshot and
   fake-send timeout validation occurred only after constructing
   `JsonlEventStore`, whose constructor creates a directory. Invalid application
   configuration could therefore mutate the filesystem before failing. **Fix:**
   validate exact paths, snapshot and validate both actor sets, and validate the
   optional timeout before any store construction (`src/safe-write-application.ts:91`).
   RED/GREEN assertions prove neither invalid actors nor invalid timeout creates
   its target directory. **Status: FIXED.**

### Low

1. Initial composed timeout test - It proved timeout and abort but left the
   adapter promise unresolved, so the Session 06 layer did not independently
   prove late acceptance suppression. **Fix:** settle the adapter after the
   terminal timeout and assert the result file remains two lines, one timeout
   event remains, and no accepted event appears. **Status: FIXED.**
2. Initial downstream integration matrix - It covered a synchronous throw and
   malformed fulfilled output but omitted explicit rejected-Promise behavior,
   despite the task checklist naming it. **Fix:** add a rejected dependency
   case and require the same durable canonical `downstream_failure` without raw
   rejection detail. **Status: FIXED.**

## Behavior Changes From Review Repairs

- Fake-send recovery now coexists safely with approval and other valid event
  domains in one run log without weakening fake namespace validation.
- Invalid actor or timeout configuration fails before local directory/file
  capability is exercised.
- The application-level matrix now proves both late settlement suppression and
  thrown, rejected, and malformed dependency containment.
- Approval read/list delegation is exercised alongside request, decision, and
  execution, closing the complete public class surface used by the harness.

## Permission And Documentation Review

- The frozen production decision says registration and allowlisting are false,
  human review was not performed, the required reviewer is the repository
  maintainer, and review is mandatory before any future change.
- The exact production Pi allowlist remains the same three request/read tools.
  Neither Pi nor the HTTP server imports the internal application or fake-send
  service.
- No text calls the synthetic actor ID authentication, claims a human approved
  this diff, or presents the fake effect as a real/network message.
- Task `03` evidence distinguishes implemented one-process guarantees from
  multi-process, transactional, compensation, real-data, and public-exposure
  gaps.

## Deliberate Non-Fixes And Boundaries

- `SafeWriteApplication` remains an internal library/test harness. Adding a
  local or remote transport would be a new permission decision and is not
  inferred from this session.
- Actor IDs are deterministic application policy inputs, not authenticated
  principals. Public actor authentication and tenant isolation remain absent.
- At-most-once reservation safety is one-process only. The three JSONL files are
  not one transaction, and reservation-only state remains indeterminate.
- There is no provider, network write, real message, automatic compensation,
  repair endpoint, real data, or human allowlist approval.
- Whole-run recovery/eval-gate work remains outside Phase 01; no Phase 02 file
  or planning artifact was created or modified.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Composition RED | PASS | Missing module failed before implementation; initial 8/9 run reproduced shared-log recovery defect |
| Review RED/GREEN | PASS | Configuration-before-filesystem assertion failed before repair; late settlement and rejected-Promise cases now pass |
| Focused GREEN | PASS | 9/9 application tests and 56/56 Task `03` tests |
| Full verification | PASS | Formatting/types pass, 149/149 tests, 5/5 evals |
| Dependency audit | PASS | 0 vulnerabilities; no dependency changed |
| Production-agent skill | PASS | Required check/test/eval and side-effect/permission/secret/evidence diff review complete |
| Persistence/effects | PASS | Exact two-line approval/result proof, restart original replay, zero denied effects, terminal failure evidence |
| Permission cutoff | PASS | Frozen false/false decision, exact three-tool allowlist, no Pi/server import or route |
| Diff/encoding | PASS | `git diff --check`, ASCII/LF and CR scans pass |
| Module cohesion | PASS | Application 134 lines; fake-send service 493 lines; all fake-send source modules below 500 |
| Capability/security | PASS | No package, provider, credential, subprocess, network, real-data, public-route, or allowlist addition |
| Phase cutoff | PASS | No modified or untracked Phase 02 path or artifact |

## Summary

The complete Session 06 diff was reviewed against application-owned
authorization, configuration-before-effects, shared-log domain separation,
idempotency, minimized evidence, least privilege, privacy, and documentation
truth. Two Medium and two Low findings were reproduced or directly covered and
repaired. No unresolved finding remains, and the session is ready for
independent validation.

## Next Step

Run `validate` for Session 06. Do not run `phasebuild` or create Phase 02
artifacts.
