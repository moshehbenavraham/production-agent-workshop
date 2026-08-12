# Session 07: Off-Server Restore and Rollback

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Status**: Complete
**Source Task**: `07`
**Estimated Tasks**: ~18
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-12

---

## Objective

Prove private off-server backup, controlled restore activation, and rollback from one reversible Coolify failure without losing or inventing durable state.

---

## Scope

### In Scope (MVP)

- Confirm the authorized off-server destination, schedule, retention, access, encryption, restore owner, and test cadence without committing private values.
- Stop every application and harness writer before snapshot or restore and record the exact pause boundary.
- Create a private snapshot through the repository CLI, validate the closed manifest and file checksums, and verify that the artifact is stored outside `/app/data` and the active host boundary.
- Restore only into an absent staging destination and revalidate every manifest field, file mode, checksum, JSONL record, and expected durable projection.
- Define and exercise a controlled activation procedure that preserves the original data and fails closed before replacing active state.
- Start the service against the validated restored state and verify prior event and approval evidence through the safe query.
- Record recovery time, recovery point, missing operational steps, and any unavailable measure without inventing values.
- Select one intentional reversible startup or health failure that cannot corrupt durable data or expose a secret.
- Detect the failure through health, alert, and runbook evidence and identify the exact last verified image.
- Roll back through the authorized Coolify boundary, then verify image identity, health, persistence, and controlled access.
- Preserve failure and rollback timelines without private target details, full logs, or customer data.
- Update known infrastructure exceptions only for controls directly proven on the target; keep all unproved findings open.
- Record snapshot, off-server, staging restore, activation, failure, rollback, and elapsed-time evidence in the Week 4 Build Log.

### Out of Scope

- Live-writer snapshots, destructive in-place restore, manual JSONL edits, unverified checksum repair, or deletion of the source data.
- A destructive production incident, real customer data, credential rotation exercise that exposes secret material, or multi-replica failover.
- Final parity comparison, operator usability proof, five-minute demo, or Phase 03 closeout.

---

## Prerequisites

- [x] Session 06 proves the verified image, controlled deployment, persistent paths, and restart behavior on the authorized target.
- [x] Snapshot, restore, activation, and rollback targets are explicitly scoped and every destructive boundary has a recoverable source and owner.

---

## Deliverables

1. Private off-server snapshot and exact staged restore evidence with a documented controlled activation path.
2. One safe reversible failure and rollback timeline tied to the last verified image and preserved durable state.
3. Updated recovery measurements, infrastructure exceptions, and Week 4 restore and rollback evidence.

---

## Success Criteria

- [x] Every writer is stopped, the source is preserved, and the off-server snapshot and staging restore pass exact manifest, checksum, permission, record, and projection checks.
- [x] Restored state becomes active only after validation and remains queryable without record edits, duplicate approval, or inferred effect success.
- [x] The reversible failure is detected through documented evidence and rollback restores the expected image, health, access, and persistent state.
- [x] Recovery time and missing steps are measured or explicitly unavailable, and unsupported disaster-recovery claims remain open.
- [x] No secret, private target identifier, raw production log, customer data, or destructive restore behavior enters repository evidence.
