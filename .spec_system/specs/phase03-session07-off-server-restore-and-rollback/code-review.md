# Code Review And Repair Report

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Reviewed**: 2026-08-12
**Base Commit**: `aa5d54d35720ea2eb3fdb3a0d58ab832db35ca93`
**Scope**: Every tracked diff and untracked file since the Session 07 base
**Result**: RESOLVED

## Review Surface

- Session specification, checklist, implementation notes, and all recovery evidence.
- Placeholder-only operator environment changes.
- Week 4, deployment, environment, controlled-release, TODO, changelog, state,
  and known-issue changes.
- Direct Coolify deployment sequence, local backup/restore artifacts, temporary
  local service, and final private operator state.
- Relevant unchanged backup CLI, safe reporter, event/approval stores, Docker,
  HTTP, provider, approval/effect, security, dependency, and workflow boundaries.

No application source, test, dependency, Dockerfile, workflow, Pi tool, HTTP
route, approval authority, or effect adapter changed in this session.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. Coolify automatic deployment was enabled, so pushing the Session 06 closeout
   created a branch-head deployment outside the explicit release sequence. Its
   deployment record also reported branch head even when application configuration
   pinned the older verified revision. **Fix:** disable automatic deploy, explicitly
   deploy the selected revision, and verify the running package version inside
   the container. Package `0.1.36` binds the running source to revision
   `52df37a96a76afc1d82656ef04e0922aa42e9b16`. **Status: FIXED.**
2. The planned historical pre-fix revision no longer failed because current
   provider-generated identifiers changed. Treating that as a rollback trigger
   would manufacture a failure. **Fix:** record the unexpected pass and use a
   well-formed nonexistent revision as the deterministic fallback. Coolify
   failed before container replacement and volume mutation. **Status: FIXED.**
3. The first temporary-hook cleanup included an empty optional container field,
   and Coolify returned 422 after the recovery deployment had already finished.
   That left the hook configured. **Fix:** immediately issue a minimal cleanup
   patch, then verify the hook is absent, the exact configured revision is
   restored, and the app is `running:healthy`. **Status: FIXED.**

### Low

1. Initial prose described the exercise as an image-tag rollback even though
   this Coolify version exposes no rollback API to the token and the actual
   recovery was a source-pinned non-force deployment. **Fix:** use the precise
   description and explicitly mark immutable-digest reinspection unavailable.
   **Status: FIXED.**

## Security, Privacy, And Authority Review

- The snapshot and restore use only synthetic JSONL data and repository-owned
  commands with explicit stopped-writer confirmation.
- Backup root and restored directory are `0700`; data files are `0600`. They are
  outside the repository and server boundary.
- No secret, token, private URL, Coolify object ID, operator name, raw log, run
  ID, snapshot name, local path, or provider payload enters tracked evidence.
- Temporary post-deployment commands contain no credential. They run inside the
  selected application, perform only read-only prior-state checks and one normal
  synthetic `/runs` call, and were removed after the drill.
- The deterministic failure uses an unresolvable source revision and therefore
  fails before container replacement or data writes.
- Storage, secret, replica, controlled-access, approval, and effect boundaries
  remained unchanged. Pi gained no deployment or recovery capability.
- Automatic deployment is disabled; future target mutation remains a direct
  workshop-owner action.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Off-server boundary | PASS | Private snapshot copied outside server and repository; temporary server copy removed |
| Restore integrity | PASS | 2 files, 64 records, 44,018 bytes, exact manifest/checksums, private modes |
| Restore activation | PASS | Local health 200; saved run and one pending approval queryable; checksums unchanged |
| Restore timing | PASS | 227 ms restore; 1,259 ms start-to-health; 1,486 ms measured total; recovery point recorded |
| Controlled failure | PASS | Nonexistent well-formed revision failed in 3,422 ms before replacement |
| Recovery | PASS | Verified revision/package restored in 67,550 ms; Coolify `running:healthy` |
| Durable state | PASS | Temporary hook proved saved run and pending approval before and after recovery |
| Provider behavior | PASS | Post-recovery grounded synthetic run stopped at `approval_pending`; canonical no-send output |
| Source identity | PASS | Container-side package probe returned exact version `0.1.36` for the verified revision |
| Digest boundary | EXPLICITLY UNAVAILABLE | Cached commit tag and prior inspected digest remain reserved; Coolify beta.463 has no read-only rollback-image API |
| Repository gate | PASS | Format, lint, strict types, 374 tests, 18 evals |
| Coverage | PASS | 97.88% lines, 86.31% branches, 98.43% functions |
| Dependencies and drills | PASS | Zero vulnerabilities; five of five incident drills |
| Release preflight | PASS | 15 of 15 checks; target mutation literal false |
| Privacy and encoding | PASS | Secret, ASCII/LF, JSON, whitespace, and protected-value inspections pass |

## Deliberate Limits

- This is a local-workstation backup appropriate for a synthetic workshop, not
  paid remote object storage, automation, encryption attestation, or geographic redundancy.
- The restored copy became active in a local service. Active Coolify volume
  replacement was deliberately not performed.
- The current platform API cannot re-inspect the immutable digest after recovery.
  The report preserves that limitation and does not invent a second observation.
- Workstation TLS access remains unstable; Session 06 external controlled-access
  evidence remains valid, while post-recovery health is reported by Coolify and
  the internal container checks.
- Public access, real data, multi-replica failover, external alert delivery, and
  real external effects remain unsupported.

## Summary

The complete Session 07 surface was reviewed for destructive boundaries,
stopped-writer truth, checksum and permission integrity, failure isolation,
rollback accuracy, source/image claims, cleanup, private evidence, and least
privilege. Four operational/documentation findings were repaired. No unresolved
finding remains within the controlled workshop scope.

## Next Step

Run the Session 07 validation workflow.
