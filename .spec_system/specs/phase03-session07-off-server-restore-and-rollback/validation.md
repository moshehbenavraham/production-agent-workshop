# Validation Report

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Validated**: 2026-08-12
**Result**: PASS

## Validation Summary

| Check | Status | Notes |
|-------|--------|-------|
| Code Review | PASS | Exact-base review is `RESOLVED`; four operational/documentation findings repaired |
| Tasks Complete | PASS | 18/18 tasks |
| Deliverables | PASS | Off-server snapshot, exact restore, activation, failure, recovery, docs, and Apex records exist |
| Repository Gate | PASS | Format, lint, strict types, 374 tests, 18 evals |
| Coverage | PASS | 97.88% lines, 86.31% branches, 98.43% functions |
| Dependencies | PASS | Zero vulnerabilities; no dependency or lockfile diff |
| Incident Drills | PASS | Five of five deterministic drills |
| Security And GDPR | PASS | Security PASS; GDPR N/A because all data is synthetic |
| Privacy And Encoding | PASS | Secret, ASCII/LF, JSON, and whitespace checks pass |
| UI Product Surface | N/A | No rendered UI changed |

**Overall**: PASS

## Recovery Evidence

| Requirement | Result | Evidence |
|-------------|--------|----------|
| Writers stopped | PASS | Sole writer stopped before the retained snapshot; zero volume writers confirmed |
| Off-server copy | PASS | Snapshot copied to private owner workstation; temporary server copy removed |
| Manifest and checksums | PASS | 2 files, 44,018 bytes, every size and SHA-256 exact |
| Record validation | PASS | 64 LF-terminated JSON object records |
| Permissions | PASS | Backup/restore directories `0700`; data files `0600` |
| Absent restore | PASS | New destination only; source snapshot retained |
| Restored activation | PASS | Local service health 200; saved run and one pending approval queryable |
| No mutation | PASS | Restored event and approval checksums unchanged after activation |
| Recovery point | PASS | Snapshot creation time recorded; age at restore 1,962 seconds |
| Recovery time | PASS | Restore 227 ms; start-to-health 1,259 ms; measured total 1,486 ms |

## Failure And Recovery Evidence

| Requirement | Result | Evidence |
|-------------|--------|----------|
| Baseline | PASS | Exact verified revision; saved state and fresh provider smoke passed in 51,531 ms |
| Historical regression | CHANGED EXTERNAL BEHAVIOR | Pre-fix revision passed; no false failure was claimed |
| Deterministic failure | PASS | Unresolvable 40-character revision failed in 3,422 ms before replacement |
| Recovery | PASS | Exact verified revision/package restored in 67,550 ms |
| Source identity | PASS | Container package version `0.1.36` binds exact revision `52df37a96a76afc1d82656ef04e0922aa42e9b16` |
| State and provider | PASS | Saved run/approval and new grounded `approval_pending` smoke passed |
| Health and configuration | PASS | Coolify `running:healthy`; storage, secrets, replica, and controlled access unchanged |
| Cleanup | PASS | Temporary hook absent; automatic deploy disabled |
| Immutable digest | EXPLICITLY UNAVAILABLE | Prior digest reserved; beta.463 API cannot perform post-recovery reinspection |

## Success Criteria

### Functional Requirements

- [x] Writers stopped before snapshot and the source remained unchanged.
- [x] Off-server snapshot and absent-directory restore passed exact validation.
- [x] A local service started against restored state and the prior run remained queryable.
- [x] A reversible failure was detected through direct Coolify deployment status.
- [x] Coolify restored the exact verified revision/package, reserved cached tag,
  health, access configuration, and durable state; digest reinspection is explicit.

### Testing And Non-Functional Requirements

- [x] Complete verification, coverage, audit, incident drills, and preflight pass.
- [x] Snapshot/restore command and safe reporter pass on exercised artifacts.
- [x] Post-recovery provider smoke stops safely at durable approval.
- [x] Backup and restored files retain private modes.
- [x] No protected private value or customer data enters tracked evidence.
- [x] Recovery point/time are measured; destructive activation and digest
  reinspection are explicitly unavailable rather than invented.

## Database And Schema Alignment

### Status: N/A

No database, migration, seed, or persistent schema changed. Existing event and
approval records were copied, restored, projected, and checked without editing.

## Remaining Risk

- Local workstation backup is sufficient for this workshop but lacks production
  automation, geographic redundancy, and verified encryption controls.
- Active Coolify-volume replacement was intentionally not exercised.
- Immutable digest reinspection requires Coolify upgrade, UI access, or server
  inspection outside the current token boundary.
- Public access, real data, external alerts, multiple replicas, and real effects
  remain unsupported.

## Conclusion

Session 07 is validated for the controlled synthetic workshop boundary and is
ready for PRD closeout and Session 08 planning.
