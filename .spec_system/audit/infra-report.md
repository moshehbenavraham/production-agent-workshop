# Infrastructure Report

**Date**: 2026-08-12
**Result**: PASS for the controlled synthetic workshop target
**Phase**: P03 - Operations and Coolify Release
**Repository scope**: Single deployable root package
**Selected bundle**: Deploy
**Platform**: Docker and Coolify

## Summary

Phase 03 completed the remaining applicable infrastructure bundle: manual
Coolify deployment from one exact verified revision. Direct target exercises
proved controlled HTTPS access, Dockerfile health, provider-backed synthetic
behavior, named-volume persistence across container replacement, off-server
workstation backup, exact local restore activation, one safe deployment failure,
source-pinned recovery, and local/deployed safety parity.

Automatic deploy is disabled. The Phase 03 documentation and CI pushes did not
create a deployment: the count remains 17, exactly one higher than Session 07
because Session 08 intentionally ran one parity deployment. The service remains
`running:healthy` at the recorded runtime revision with no temporary hook.

## Detection

| Item | Result |
|------|--------|
| Apex state | Phase 03 complete; 24 sessions; no active session |
| Existing bundles | Health, Security, Backup |
| Selected missing bundle | Deploy - highest-priority applicable gap from P02 |
| Provider | Coolify API over the authorized private operator configuration |
| Exposure | Controlled synthetic workshop; public production remains blocked |
| Missing applicable bundle after this run | None for the workshop target |

## Current Infrastructure Contract

| Component | Proved boundary |
|-----------|-----------------|
| Source | Exact saved 40-character runtime revision; manual source-pinned deployment |
| Image | Previously inspected immutable SHA-256 identifier retained in redacted/private evidence |
| Runtime | One Node.js 24 replica on port 3000 |
| Health | Dockerfile health check detected; container and Coolify `running:healthy` |
| Access | Controlled HTTPS Basic Auth gate; anonymous requests denied |
| Provider | Runtime-only OpenAI secret; grounded pending-approval smoke |
| Persistence | Named `/app/data`; exact event/approval files survive replacement |
| Backup | Private owner workstation outside VPS; one retained private snapshot |
| Restore | Exact absent-directory restore and local restored-service activation |
| Recovery | Safe failed deployment plus non-force exact-source recovery |
| Monitoring | Sentinel healthy; deterministic local alert policy and runbook |
| Deployment trigger | Manual only; automatic deploy off; no CI deploy credential |

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Coolify credential read | PASS | Authorized API read returned current application/deployment state |
| Release preflight | PASS | 15/15 ready; `targetMutationAllowed: false` |
| Application state | PASS | `running:healthy`; exact configured revision |
| Docker health mode | PASS | Custom Dockerfile health check found; `/health` path and port 3000 match |
| Persistence | PASS | `/app/data` contract plus Session 06 byte-identical replacement proof |
| Provider smoke | PASS | Grounded; one draft; pending approval; canonical no-send output |
| Parity | PASS | Local/deployed safe fields, business-event order, stop, and report match |
| Automatic deployment | PASS | Off in target and private configuration |
| Unintended deployment | PASS | Count 17 after all Phase 03 pushes; no branch-head deployment |
| Temporary deploy hook | PASS | Empty after parity exercise |
| Local backup | PASS | Configured directory exists, private mode, one snapshot retained |
| Restore drill | PASS | Private configuration says verified; direct Session 07 evidence retained |
| Rollback/recovery | PASS | Failed source request detected before replacement; exact source restored |
| Current API limit | EXPLICIT | Coolify 4.0.0-beta.463 cannot re-read post-recovery digest |

## Limits That Remain Open

- This proves a controlled synthetic workshop target, not public production.
- Public identity/authorization, tenant isolation, shared quota, WAF, real-data
  lifecycle, public decisions, real effects, and multi-replica persistence are
  not configured.
- Backup is manual local-workstation storage. Automated/geographic backup,
  destructive live-volume restore, and production disaster recovery are not
  claimed or required for the workshop.
- Sentinel health and owner response exist; external paging/on-call delivery is
  not configured.
- The current Coolify API cannot directly re-inspect the immutable image digest
  after source-pinned recovery. The earlier direct digest remains the reserved
  image evidence.

## Infrastructure Result

Health, Security, Backup, and Deploy all pass for the authorized controlled
workshop boundary. No infrastructure mutation was needed in this transition.

Next command: `carryforward`

Reason: `infra -> carryforward` is the required Phase 03 transition order.
Phase 04 `phasebuild` remains outside this step.
