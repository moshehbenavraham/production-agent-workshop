# Session Specification

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Phase**: 03 - Operations and Coolify Release
**Source Task**: `07`
**Status**: Complete
**Created**: 2026-08-12
**Validated**: 2026-08-12
**Completed**: 2026-08-12
**Version**: `0.1.38`
**Base Commit**: `aa5d54d35720ea2eb3fdb3a0d58ab832db35ca93`

---

## 1. Session Overview

This session proves that a private stopped-writer snapshot can leave the VPS,
restore exactly on the workshop owner's computer, and start the service against
the restored state. It then creates one safe known behavioral failure by
temporarily deploying the last pre-fix revision and restores the last verified
revision through the authorized Coolify boundary.

The exercise attempts the historical provider failure, then uses a guaranteed
unresolvable-revision failure if external provider behavior has changed. It
preserves the source volume and backup, uses only synthetic data, and never
performs a destructive in-place restore. It records finite redacted results
rather than target identifiers, credentials, raw logs, or run IDs.

## 2. Objectives

1. Prove a stopped-writer snapshot is copied outside the VPS host boundary.
2. Restore into an absent private directory and verify manifest, checksums,
   permissions, JSONL records, and durable projections.
3. Start a local service against the restored state and query the prior run.
4. Attempt the bounded historical provider regression, fall back to a guaranteed
   unresolvable-revision deployment failure if provider behavior has changed,
   and restore the last verified revision through Coolify.
5. Verify restored package, reserved cached image tag, health, controlled
   access, and durable state while explicitly recording unavailable digest
   reinspection.

## 3. Prerequisites

- [x] Session 06 is complete and proves the selected revision, image, health,
  provider smoke, monitoring, and state across container replacement.
- [x] The workshop owner accepted the local workstation as the private backup
  destination and owns stop, backup, restore, recovery, and rollback actions.
- [x] The current source revision and immutable image identity are preserved in
  redacted and private operator evidence.

## 4. Scope

### In Scope

- Stop the single application writer before a fresh snapshot.
- Copy the snapshot from the VPS to a private local destination.
- Restore into a new absent directory without changing the active Coolify volume.
- Start the service locally against restored files and issue safe read-only checks.
- Measure or explicitly mark unavailable the recovery point and elapsed times.
- Temporarily deploy the known pre-fix revision. If current provider behavior no
  longer reproduces the historical failure, use a 40-character nonexistent
  revision that fails before replacing the healthy container or touching data.
- Restore the exact last verified revision and verify target health, prior
  access configuration, reserved cached image tag, prior state, and one
  provider-backed synthetic smoke after rollback.
- Update Week 4, deployment, environment, release, changelog, TODO, and known-issue records.

### Out Of Scope

- Destructive in-place restore or deleting the original volume.
- Live-writer snapshots, manual JSONL repair, real customer data, or real effects.
- Public access, multi-replica failover, paid remote storage, automated backup,
  geographic redundancy, final parity, operator usability, or Phase 03 closeout.

## 5. Technical Approach

### Backup And Activation

Use the repository snapshot command only while Coolify writers are stopped.
Transfer the immutable snapshot to the private workstation, restore it with the
repository command into a new directory, and validate it before setting local
service log paths to that restored directory. Health and the safe run reporter
prove activation without mutating the restored records.

### Reversible Failure And Rollback

Use Coolify's authorized source-revision and deployment boundary. The known
pre-fix revision is tried first because it previously failed the selected
OpenAI tool-call smoke. Provider-generated identifiers are external behavior,
so a nonexistent source revision is the deterministic fallback: its build must
fail before replacement. Restoring the exact last verified revision is the
rollback. Verify the running package version, cached image reservation, health,
prior durable state, and provider behavior afterward. Coolify
4.0.0-beta.463 has no read-only rollback-image API, so post-rollback digest
reinspection is explicitly unavailable through the current token boundary.

## 6. Deliverables

### Files To Create

| File | Purpose |
|------|---------|
| `implementation-notes.md` | Task-level restore and rollback evidence |
| `code-review.md` | Exact-base review and repair report |
| `security-compliance.md` | Backup, secret, rollback, and privacy review |
| `validation.md` | Complete session validation evidence |
| `IMPLEMENTATION_SUMMARY.md` | Session closeout summary |

### Files To Modify

| File | Changes |
|------|---------|
| `.env.example` | Clarify local-backup and rollback status placeholders |
| `docs/build-log-week4.md` | Restore activation, failure, rollback, and elapsed-time evidence |
| `docs/deployment.md` | Current backup and rollback posture |
| `docs/environments.md` | Local private-backup boundary |
| `docs/release/controlled-release-contract.md` | Remove directly resolved restore and rollback exceptions |
| `.spec_system/audit/known-issues.md` | Narrow only directly resolved infrastructure exceptions |
| `docs/TODO.md`, `docs/CHANGELOG.md` | Synchronize current work |

## 7. Success Criteria

### Functional Requirements

- [x] Writers stop before snapshot and the source remains unchanged.
- [x] Off-server snapshot and absent-directory restore pass exact validation.
- [x] A local service starts against restored state and the prior run remains queryable.
- [x] The reversible failure is detected through deployment or run evidence.
- [x] Coolify restores the exact verified revision/package, reserved cached
  image tag, health, access, and durable state; any unavailable digest
  reinspection is explicit.

### Testing Requirements

- [x] `npm run verify`, coverage, audit, incident drills, and preflight pass.
- [x] Snapshot/restore commands and safe run reporter pass on the exercised artifacts.
- [x] Post-rollback provider-backed smoke stops safely at durable approval.

### Non-Functional Requirements

- [x] Backup and restored files retain private modes.
- [x] No secret, private target ID, raw log, run ID, snapshot name, or customer data enters tracked evidence.
- [x] Recovery point/time are measured or explicitly unavailable without invention.

## 8. Working Assumptions And Limits

- The workshop owner is the sole operator. There is no separate paid on-call or
  storage service for this exercise.
- The owner's computer is outside the VPS host boundary and is sufficient for
  this workshop backup. It is not production-grade geographic redundancy.
- Manual backups run before and after demonstrations and are retained for 30
  days or until workshop teardown, whichever comes first.
- HTTP health alone will not detect the selected historical provider behavior;
  the run timeline supplies the failure signal.
- If the current immutable image cannot be restored exactly, the exercise fails
  closed and the discrepancy remains open.

## 9. Relevant Considerations

- [P02] **Single-process persistence**: stop the one writer before snapshot.
- [P01] **Controlled exposure only**: do not expand public access during recovery.
- [P02] **Offline snapshots are closed recovery evidence**: validate before activation.
- [P01] **Durable truth over logs**: verify run and approval stores directly.
- [P01] **Frozen least privilege**: rollback remains operator-side, never a Pi tool.

## Next Steps

Plan Phase 03 Session 08 operator handoff, parity, and release evidence.
