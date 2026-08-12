# Implementation Summary

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Completed**: 2026-08-12
**Version**: `0.1.38`
**Duration**: 2.0 hours

---

## Overview

Completed the workshop off-server recovery and Coolify failure/recovery proof.
A stopped-writer snapshot retained on the owner's computer restored exactly
into a private absent directory, started a local service, and exposed the saved
run and pending approval without changing the restored files.

A deterministic unresolvable-revision deployment failed before container
replacement. The exact verified source/package then returned through a
non-force Coolify deployment and passed saved-state, provider, no-send, and
health checks. Automatic Coolify deployment is now disabled.

## Deliverables

| Deliverable | Result |
|-------------|--------|
| Private off-server snapshot | Preserved outside server and repository |
| Exact absent-directory restore | 2 files, 64 records, 44,018 bytes, all checksums and modes pass |
| Restored-service activation | Health 200, saved run, one pending approval, unchanged files |
| Reversible failure | Unresolvable revision failed before replacement |
| Source-pinned recovery | Exact package/version, saved state, provider smoke, and health pass |
| Operator environment contract | Automatic deploy and platform/digest status fields added |
| Session workflow reports | Specification, tasks, notes, review, security, validation, and summary |

## Measured Evidence

| Measurement | Value |
|-------------|-------|
| Restore | 227 ms |
| Local start to health | 1,259 ms |
| Restore plus start-to-health | 1,486 ms |
| Snapshot age at restore | 1,962 seconds |
| Verified baseline deployment | 51,531 ms |
| Deterministic failed deployment | 3,422 ms |
| Verified source recovery | 67,550 ms |

## Technical Decisions

1. **Local backup is enough for the workshop**: the owner workstation is outside
   the server boundary; paid remote storage is not required for synthetic data.
2. **Provider behavior is not a guaranteed failure fixture**: the historical
   revision passed current provider output, so a clone-time refusal supplied the
   deterministic non-destructive failure.
3. **Automatic deploy is unsafe for this release method**: it is disabled so a
   push cannot bypass the reviewed source selection.
4. **Package probe resolves record ambiguity**: Coolify deployment history
   reported branch head while the container proved the pinned `0.1.36` package.
5. **Do not invent a digest observation**: the prior immutable digest remains
   reserved, but Coolify beta.463 cannot re-read it through this API.

## Verification

| Metric | Result |
|--------|--------|
| Repository tests | 374/374 passed |
| Production evals | 18/18 passed |
| Coverage | 97.88% lines, 86.31% branches, 98.43% functions |
| Incident drills | 5/5 passed |
| Release preflight | 15/15 passed; target mutation false |
| Dependency audit | Zero vulnerabilities |
| Review | Four findings repaired; zero unresolved |
| Security and privacy | PASS; all exercised data synthetic |

## Remaining Boundaries

- Destructive Coolify-volume activation and post-recovery digest reinspection
  were not performed.
- Local backup is not automated, geographically redundant, or approved for real data.
- Public use, real customer data, real effects, external on-call alerting, and
  multi-replica execution remain unsupported.
- Local/deployed parity and the final operator/demo handoff remain Session 08.

## Next Step

Plan and execute Phase 03 Session 08 operator handoff, parity, and final release evidence.
