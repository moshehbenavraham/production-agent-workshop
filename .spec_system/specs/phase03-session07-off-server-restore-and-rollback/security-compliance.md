# Security And Compliance Report

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Reviewed**: 2026-08-12
**Result**: PASS

## Scope

Reviewed the exact-base recovery and deployment operations, local backup and
restore artifacts, temporary post-deployment checks, placeholder environment
contract, operational documentation, and relevant unchanged persistence, HTTP,
provider, approval/effect, Docker, dependency, and workflow boundaries.

## Security Assessment

### Overall: PASS

| Category | Status | Details |
|----------|--------|---------|
| Injection | PASS | Repository CLI paths are pre-existing validated boundaries; no application input or shell construction was added to tracked code |
| Authentication And Secrets | PASS | Coolify token and provider key remained private; temporary hook contained no credential and was removed |
| Sensitive Data Exposure | PASS | Tracked evidence omits private URLs, target IDs, run IDs, snapshot names, local paths, raw logs, provider payloads, and operator identity |
| Backup Permissions | PASS | Backup and restored directories are `0700`; restored data files are `0600` |
| Destructive Operations | PASS | Source volume and snapshot were preserved; restore used an absent destination; failed deployment stopped before replacement |
| Deployment Authority | PASS | Automatic deploy disabled; direct owner/API boundary retained; no Pi deployment capability |
| Dependencies | PASS | No dependency or lockfile change; audit reports zero vulnerabilities |
| Permission Expansion | PASS | No Pi tool, HTTP route, approval/effect, workflow permission, or replica expansion |
| Evidence Integrity | PASS | Manifest, checksums, JSONL records, store projections, package version, deployment status, and health agree within explicit API limits |

No security finding remains within the controlled workshop boundary.

## Backup And Recovery Boundary

- The workshop owner explicitly selected the local workstation destination.
- The snapshot was created only after the single writer stopped and was copied
  outside the server boundary.
- The repository restore command refused in-place activation and created a new
  absent destination.
- Local activation pointed the service at restored paths; safe health/report
  reads left exact file checksums unchanged.
- The deterministic failed revision cannot clone or build, so it cannot replace
  the healthy container or write the mounted volume.
- Source-pinned recovery used the same configured revision without a forced
  rebuild. The restored package, prior durable state, provider behavior, and
  Coolify health passed.

## Secret And Temporary-Command Boundary

- `.env` remains ignored and mode `0600`; no value was copied to tracked output.
- Temporary post-deployment commands used a private synthetic run identifier
  only inside Coolify and emitted no content. They read prior state and called
  only the normal synthetic local `/runs` route.
- The first cleanup patch was rejected because of an empty optional field. A
  minimal follow-up removed the hook, and final API inspection proves it absent.
- OpenAI remains runtime-only and unavailable during image build.

## GDPR Assessment

### Overall: N/A

All exercised state belongs to committed synthetic workshop leads. No real
personal data, customer data, public collection, or new processing purpose was
introduced. The local backup is not approved for real data; existing real-data
lifecycle, encryption, erasure, transfer, and subprocessor requirements remain open.

## Evidence

- Repository gate: format, lint, strict types, 374 tests, 18 evals.
- Coverage: 97.88% lines, 86.31% branches, 98.43% functions.
- Dependency audit: zero vulnerabilities.
- Incident drills: five of five pass.
- Release preflight: all 15 checks pass; target mutation false.
- Restore: 2 files, 64 records, exact manifest/checksums, private modes.
- Activation: health 200, saved run, one pending approval, unchanged files.
- Failure/recovery: failed deployment detected; verified package and health restored.
- Secret, ASCII/LF, JSON, whitespace, and final Coolify inspections: PASS.

## Remaining Boundaries

- No paid or automated remote storage, geographic redundancy, destructive
  production activation, encryption attestation, or per-record real-data erasure.
- Coolify beta.463 cannot re-inspect the immutable image digest through this API.
- Public identity, tenant isolation, shared principal rate state, production WAF,
  external alert delivery, multi-replica failover, and real effects remain unsupported.
