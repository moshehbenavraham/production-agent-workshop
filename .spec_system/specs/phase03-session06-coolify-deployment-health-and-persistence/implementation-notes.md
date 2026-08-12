# Implementation Notes

**Session ID**: `phase03-session06-coolify-deployment-health-and-persistence`
**Started**: 2026-08-12 10:03
**Last Updated**: 2026-08-12 10:12

---

## Session Progress

| Metric | Value |
|--------|-------|
| Tasks Completed | 14 / 14 |
| Estimated Remaining | 0 hours |
| Blockers | 0 |

---

## Task Log

### 2026-08-12 - Session Start

**Environment verified**:

- [x] Apex project state and current session confirmed.
- [x] `jq`, Git, Node.js, npm, Docker, Coolify API, and SSH available.
- [x] Private operator environment present without copying values into evidence.

### Task T001 - Verify state and prerequisites

**Verification**:
- `bash .spec_system/scripts/analyze-project.sh --json`
  - Result: PASS - Phase 03 selected Session 06 as the next incomplete session.
- `bash .spec_system/scripts/check-prereqs.sh --json --env`
  - Result: PASS - spec system, jq, and Git passed.

**Files Changed**:
- `.env.example` - Added placeholder-only Coolify operator fields.

### Task T002 - Verify the release revision

**Verification**:
- `npm run verify`
  - Result: PASS - 374 tests and 18 of 18 production eval cases passed.
- `git rev-parse HEAD`
  - Result: PASS - release revision fixed before deployment.

**Files Changed**:
- None - verification task.

### Task T003 - Verify Coolify authorization

**Verification**:
- Coolify application API read and write probes
  - Result: PASS - authorized application returned healthy and accepted the reviewed revision without exposing identifiers.
- Direct deployment request
  - Result: PASS - API deploy permission accepted.

**Files Changed**:
- `docs/fixtures/release-preflight-current-target.json` - Recorded redacted authorization and isolation facts.

### Task T004 - Verify provider secret boundary

**Verification**:
- Runtime presence-only comparison
  - Result: PASS - Coolify injected the OpenAI key as runtime-only and build-time false.
- Authenticated `GET /v1/models` from the container
  - Result: PASS - provider returned HTTP 200; no credential value or response payload entered evidence.

**Files Changed**:
- `.env.example` - Documented blank provider placeholders and secret-store use.

### Task T005 - Verify runtime configuration

**Verification**:
- Coolify application and Docker inspections
  - Result: PASS - one replica, port 3000, Dockerfile health, named `/app/data` mount, 30-second deadline, 24-step limit, and configured rate gate matched the contract.

**Files Changed**:
- `docs/environments.md` - Synchronized controlled environment facts.

### Task T006 - Deploy exact reviewed source

**Verification**:
- Coolify application source and container image inspections
  - Result: PASS - running source equals the reviewed 40-character revision and the immutable image identifier is recorded only in redacted evidence.

**Files Changed**:
- `docs/build-log-week4.md` - Recorded source and image evidence.

### Task T007 - Verify access and health

**Verification**:
- External HTTPS, Docker health, and Sentinel checks
  - Result: PASS - authenticated health returned 200, anonymous health and runs returned 401, container health was healthy, and Sentinel was healthy.
- Workstation access check
  - Result: PASS with known issue - one workstation TLS path reset before reaching the VPS and remains explicitly documented.

**Files Changed**:
- `docs/deployment.md` - Updated controlled release posture.
- `.spec_system/audit/known-issues.md` - Narrowed the remaining path-specific health issue.

### Task T008 - Execute synthetic smoke

**Verification**:
- Controlled `POST /runs` for a committed synthetic lead
  - Result: PASS - HTTP 200, grounded qualification, `approval_pending`, and canonical no-send output.

**Files Changed**:
- `docs/build-log-week4.md` - Added minimized smoke evidence.

### Task T009 - Validate smoke authority

**Verification**:
- `JsonlEventStore.readRun` and `FileApprovalStore.listRun` against the live paths
  - Result: PASS - terminal run evidence and exactly one pending approval agreed on the run identity.
- Response inspection
  - Result: PASS - no send or effect claim was present.

**Files Changed**:
- `docs/build-log-week4.md` - Recorded authority and no-send evidence.

### Task T010 - Replace the container

**Verification**:
- Coolify redeploy of the same reviewed revision
  - Result: PASS - replacement container reached `running:healthy` on the same named data volume.

**Files Changed**:
- `docs/build-log-week4.md` - Recorded replacement evidence.

### Task T011 - Verify persistence after replacement

**Verification**:
- Before/after SHA-256 comparison and store projection
  - Result: PASS - event and approval files were byte-identical, the container identity changed, and the same pending approval remained queryable.

**Files Changed**:
- `docs/build-log-week4.md` - Replaced marker-only proof with exact run and approval proof.

### Task T012 - Update redacted preflight

**Verification**:
- `npm run preflight:release < docs/fixtures/release-preflight-current-target.json`
  - Result: PASS - all 15 checks passed and `targetMutationAllowed` remained false.
- Protected-field inspection
  - Result: PASS - no URL, target identifier, credential, or operator name is present.

**Files Changed**:
- `docs/fixtures/release-preflight-current-target.json` - Updated direct finite facts.
- `.spec_system/audit/known-issues.md` - Removed resolved provider and ownership gaps.

### Task T013 - Synchronize operational documentation

**Verification**:
- Targeted inspection of deployment, environment, release contract, and Week 4 evidence
  - Result: PASS - documents distinguish the controlled workshop release from unsupported public production claims.

**Files Changed**:
- `docs/deployment.md` - Current controlled deployment posture.
- `docs/environments.md` - Current environment and secret guidance.
- `docs/release/controlled-release-contract.md` - Current ready preflight status.

### Task T014 - Run the complete session gate

**Verification**:
- `npm run verify`
  - Result: PASS - formatting, lint, strict types, 374 tests, and 18 of 18 production eval cases passed.
- `npm run test:coverage`
  - Result: PASS - all configured line, branch, and function thresholds passed.
- `npm audit --audit-level=low`
  - Result: PASS - zero vulnerabilities at every severity.
- `npm run drill:incidents`
  - Result: PASS - all five incident drills passed.
- `npm run preflight:release < docs/fixtures/release-preflight-current-target.json`
  - Result: PASS - all 15 controlled-release checks passed and the command retained no target mutation capability.
- `git diff --check`, protected-pattern scan, and ASCII scan
  - Result: PASS - no whitespace error, submitted credential pattern, or non-ASCII repository content found.

**Files Changed**:
- `tasks.md` - Closed the implementation checklist.
- `implementation-notes.md` - Recorded the final direct evidence.

## Session Summary

- Deployed the exact reviewed revision to the authorized controlled Coolify target.
- Proved provider-backed synthetic execution stops at durable human approval.
- Proved exact event and approval evidence survives full container replacement.
- Kept private target identifiers and credentials outside tracked evidence.
- Preserved explicit limits: workshop-only, synthetic-only, controlled exposure, one replica, and no real external effect.
