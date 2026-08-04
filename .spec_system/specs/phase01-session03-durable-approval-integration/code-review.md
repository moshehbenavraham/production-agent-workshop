# Code Review and Repair Report

**Session ID**: `phase01-session03-durable-approval-integration`
**Reviewed**: 2026-08-04
**Base Commit**: aa491c4aada27c50d4fbf622befe7c00529f1e6d
**Scope**: All changes since the base commit (uncommitted work plus mid-session commits)
**Result**: RESOLVED

## Review Surface

**Files reviewed** (all changes since the base commit):

- `.env.example`, `Dockerfile` - configured local/container approval paths.
- `.spec_system/state.json` and Session 03 specification/task/implementation
  files - active workflow and implementation evidence.
- `src/approval.ts`, `src/approval-service.ts`, `src/approval-store.ts` - domain,
  application service, replaceable contracts, and authoritative projection.
- `src/tools.ts`, `src/pi-agent.ts`, `src/event-store.ts`, `src/server.ts` - exact
  tool binding, runtime composition, operational evidence, and HTTP cutoff.
- `tests/approval-service.test.ts`, `tests/qualification-tool.test.ts`,
  `tests/pi-agent.test.ts`, `tests/tools.test.ts` plus prerequisite approval tests
  - focused and cross-layer regressions.
- `README.md`, `docs/ARCHITECTURE.md`, `docs/api/http-api.md`,
  `docs/build-log-week2.md`, `docs/deployment.md`, `docs/development.md`,
  `docs/environments.md`, `docs/todo/README_todo.md`, `docs/TODO.md`, and
  `docs/CHANGELOG.md` - current behavior, lifecycle, evidence, and tracking.

There are no staged files or mid-session commits. Every changed/new text file
was inspected; no binary, dependency, provider credential, network effect,
public decision route, fake-send implementation, or Pi allowlist expansion is
present.

**Inventory commands**: `git status`, `git log --oneline "$BASE"..HEAD`,
`git diff "$BASE"`, `git diff --cached "$BASE"`, and
`git ls-files --others --exclude-standard`.

## Findings by Severity

### Critical

No findings.

### High

No findings.

### Medium

- `src/approval-service.ts:130` - Event reads trusted the adapter's array
  members and `readRun` filtering. A malformed member could throw, while a
  cross-run event or mismatched outer/data discriminant could spoof missing-
  event recovery. Event append results were also unchecked. Fix: validate basic
  event structure, exact run, timestamp, append echo, and both discriminants;
  add malformed, cross-run, and spoofed-data regressions. Status: FIXED.
- `src/approval-service.ts:111` and mutation outcomes - The replaceable approval
  store's TypeScript signature was treated as runtime trust. It could return an
  invalid or different valid record, or a schema-valid failure containing
  dependency-supplied sensitive text. Fix: export semantic store-outcome
  validators, reject invalid results, require exact deep equality for successful
  appends, and canonicalize accepted failures by code. Status: FIXED.
- `src/tools.ts:166` - Qualification/draft event reads could throw or return
  malformed arrays outside a typed tool result. Fix: introduce a narrowed
  replaceable tool-event interface and safe read outcome, return canonical
  `storage_failure` details, and prove no approval is created. Status: FIXED.

### Low

- `src/pi-agent.ts:117` - Current approval selection depended on the adapter's
  array order. Fix: select the unique maximum `requestedAt` and fail closed on a
  tie; add reversed-order and ambiguous-timestamp regressions. Status: FIXED.
- `src/approval-service.ts:48` - Malformed run/approval strings were retained as
  event-correlation hints, so an invalid decision could become a misleading
  storage failure when its optional event field failed schema validation. Fix:
  narrow hints to the domain length/pattern before lookup/event construction and
  add a malformed-identity regression. Status: FIXED.

## Assumptions and Deliberate Non-Fixes

- Approval state and operational events remain separate JSONL files without a
  transaction. State-first ordering plus retry recovery preserves permission
  truth; event availability does not grant or revoke approval.
- Multi-process locking, automatic damaged-file repair, backup/restore,
  per-record erasure, public actor authentication, and tenant isolation remain
  explicitly outside Task `02` and keep the runtime synthetic/private.
- The synthetic internal actor policy is application-only. No human review gate
  for write-tool allowlisting is triggered because no write-capable Pi tool is
  added in Sessions 01-03.

## Behavior Changes

- Replaceable store and event adapters are now runtime-validated and cannot
  substitute state, spoof cross-run recovery, leak their failure text, or throw
  malformed event arrays through application/tool outcomes.
- Durable stop projection is adapter-order independent and fails closed when
  two records claim the same latest request time.

## Evidence Ledger

| Check | Command or Inspection | Result | Evidence / Blocker |
|-------|-----------------------|--------|--------------------|
| Focused tests | Four approval/service/tool/Pi files | PASS | 63/63 tests pass, including all review regressions |
| Full tests | `npm run verify` | PASS | Formatting/types pass, 93/93 tests pass, 5/5 evals pass |
| Dependency audit | `npm audit --audit-level=low` | PASS | 0 vulnerabilities |
| Linter | Package scripts and `biome.json` inspection | N/A | No linter is configured in the Session 03 base |
| Formatter | `npm run format` then full verification | PASS | 22 scoped files require no formatting fix |
| Type checker | `npm run check` and full verification | PASS | Strict TypeScript exits 0 |
| Security | Credential, network/process, data, path, route, and allowlist scans | PASS | Only historical documentation command patterns match; no capability/secret addition |
| Final diff re-read | Base diff plus every untracked file | PASS | No unresolved issue or Phase 01 scope expansion |

## Summary

1. Reviewed the complete Session 03 state, source, test, configuration, and
   documentation diff from pushed base `aa491c4`.
2. Repaired three Medium and two Low trust/ordering defects with seven new
   deterministic regressions.
3. Left no finding unresolved and preserved the internal-only, synthetic-only,
   request-only Pi, no-send boundary.
4. Strict types, 93 deterministic tests, five evals, dependency audit, security
   scans, and final diff inspection pass.
