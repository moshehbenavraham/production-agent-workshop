# Infrastructure Report

**Date**: 2026-08-12
**Result**: PASS (local and container targets)
**Repository scope**: Single deployable root package
**Selected bundle**: Backup
**Platform**: Docker image targeting Coolify

## Summary

The Phase 02 transition added exactly one infrastructure bundle: a bounded
offline snapshot and restore command for the append-only JSONL files persisted
under the deployment data directory. The operator must first stop every writer
and explicitly set `CONFIRM_WRITERS_STOPPED=true`. Backup then validates direct
JSONL files as complete LF-terminated UTF-8 object records, copies them with
private permissions, records exact byte counts and SHA-256 hashes in a closed
manifest, flushes the staged data, and atomically activates the verified
snapshot. Restore revalidates the closed manifest and every file, writes into a
new private directory, verifies the staged bytes, and refuses to replace an
existing destination.

Health and Security, the two previously configured bundles, were revalidated
against the current source and container. Direct and container checks returned
`400`, `400`, then `429` under a two-request process limit while `/health`
remained `200` with `{"status":"ok"}`. The current image was healthy, and a
two-file container snapshot restored byte-for-byte with directory mode `0700`
and file mode `0600`.

This is repository-side recovery tooling, not proof of a production backup.
No private off-server destination, schedule, retention automation, Coolify
volume restore, restored-directory activation, owner, or drill exists. Those
external controls remain Task `07` release gates, and real data remains
forbidden. The disposable container, anonymous volume, image, temporary eval
artifact, and HTTP response files used for this validation were removed.

## Detection

| Item | Result |
|------|--------|
| Apex state | Phase 02 complete; 16 completed sessions; no active session |
| Deployment topology | One root Node.js/TypeScript service; Docker target for Coolify |
| Existing bundles | Health endpoint/probe and process-wide Security rate gate configured |
| Selected missing bundle | Backup - highest-priority applicable missing bundle for durable `/app/data` JSONL |
| Remaining missing bundle | Deploy |
| Known skipped infra loaded | Production Health, Security, and Backup validation remain external-target exceptions |

## Configuration

| Component | Value |
|-----------|-------|
| Backup command | `CONFIRM_WRITERS_STOPPED=true npm run backup:data -- <source> <backup-root>` |
| Restore command | `CONFIRM_WRITERS_STOPPED=true npm run restore:data -- <snapshot> <absent-destination>` |
| Implementation | `scripts/data-snapshot.ts` |
| Included data | 1-100 direct files with safe `*.jsonl` names; other entries are not copied |
| Record boundary | Valid UTF-8, non-blank LF-terminated lines, one JSON object per line |
| Bounds | 64 MiB per file; 256 MiB per snapshot; 1 MiB manifest |
| Integrity | Closed `jsonl-snapshot-v1` manifest, exact byte counts, SHA-256 per file, staged and final re-read |
| Durability | Exclusive file creation, file and directory flushes, atomic snapshot-directory rename |
| Permissions | Backup/restore directories `0700`; copied/restored JSONL and manifest `0600` |
| Path safety | Filesystem roots, symlink traversal, nested source/destination paths, existing restore destinations, and unexpected snapshot entries are refused |
| Required secret | None |
| Operator precondition | Every service, harness, and other JSONL writer is stopped and explicitly confirmed |

## Evidence Ledger

| Bundle | Component | Command / Target | Result | Fixes Applied | Remaining / Blocker |
|--------|-----------|------------------|--------|---------------|---------------------|
| Project state | Analyzer | `bash .spec_system/scripts/analyze-project.sh --json` | PASS | None | Phase 02 complete; no active session |
| Backup | Operator command regressions | `node --import tsx --test tests/data-snapshot.test.ts` | PASS (3/3) | Added exact restore, writer/truncation refusal, and tamper refusal cases | None for repository command |
| Backup | Local repository gate | `npm run test:coverage` | PASS | Scoped metrics explicitly to application source while still executing CLI subprocess tests | 273/273; 97.64% lines, 85.55% branches, 97.86% functions |
| Health | Direct endpoint | `PORT=3022 ... npm start`; `GET /health` | PASS (local) | None | Exact `200 {"status":"ok"}` |
| Security | Direct HTTP gate | Three rapid invalid synthetic `POST /runs` requests with limit 2 | PASS (local) | None | `400`, `400`, `429`; standard quota and retry headers |
| Backup | Image build | `docker build --tag production-agent-workshop:phase02-transition-backup .` | PASS | None | Image `sha256:9d565a0246c1a7dff26264a0e24f3fe48a3dfab679b8d5544f0a710a109b48e1` |
| Health | Container probe | `production-agent-workshop-backup-phase02` | PASS (container) | None | `running healthy`; exact health body |
| Security | Container rate gate | Three rapid invalid synthetic requests on loopback port 3023 | PASS (container) | None | `400`, `400`, `429` |
| Backup | Container snapshot | Two synthetic `/app/data` JSONL files to `/tmp/backups` | PASS (container) | None | 2 files, 62 bytes, closed manifest |
| Backup | Container restore | Snapshot to absent `/tmp/restored`; `cmp` each source/restored file | PASS (container) | None | Byte-exact; directory `0700`, files `0600` |
| Backup | Production/off-server target | Coolify volume plus private backup destination | SKIPPED | None | No deployment, destination, schedule, owner, or activation drill; recorded in Known Issues |
| Verification | Full repository | `npm run verify`; `npm run build`; `npm audit --audit-level=low` | PASS | None | 273 tests, 18/18 eval cases, build clean, 0 vulnerabilities |
| Cleanup | Validation artifacts | Exact process, files, container, anonymous volume, image, and eval artifact removal | PASS | Removed disposable synthetic artifacts | Reproducible from repository commands |

## Safety And Recovery Contract

- The stopped-writer confirmation is a human assertion; the CLI cannot discover
  every process that may hold a file descriptor. Operators must stop the HTTP
  service and any library, eval, or test harness writing the selected directory.
- Snapshot success proves a coherent validated copy of the selected direct
  JSONL files. It does not prove that required files were co-located or that a
  copy persisted outside the host.
- Restore is deliberately non-destructive. It never overwrites or edits the
  source, snapshot, or an existing destination and does not activate restored
  data in a running service.
- A checksum or manifest mismatch is a visible stop. Preserve the source and
  snapshot separately and escalate; do not repair either by inference.
- The repository remains synthetic-only. Local backup mechanics do not satisfy
  real-data location, retention, erasure, subprocessor, or recovery obligations.

## Infrastructure Result

The selected Backup bundle and the previously configured Health and Security
bundles pass against the strongest reachable local and container targets.
Deploy remains unconfigured under the one-bundle-per-run rule.

Required external setup: when Task `07` authorizes a Coolify deployment, mount
a private off-server destination, assign stopped-writer and restore ownership,
define schedule and retention, validate a snapshot from the persistent volume,
restore it into an absent staging destination, and exercise the explicit
platform activation and rollback procedure. Re-run Health and Security over the
assigned HTTPS URL before exposure.

Next command: `carryforward`

Reason: `infra -> carryforward` is the required Phase Transition handoff after
the selected infrastructure bundle passes. `documents` follows only after
`carryforward`; Phase 03 `phasebuild` remains outside the user-authorized cutoff.
