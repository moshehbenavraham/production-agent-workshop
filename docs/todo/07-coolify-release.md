# 07 - Release Through Coolify

Mode: HITL
Sprint week: 4
Support tag: `[W4][#07]`
Status: Complete (2026-08-12)

## Goal

Harden and deploy the verified agent through Coolify, then prove health, security boundaries, persistence, observability, recovery, rollback, and operator handoff.

## Verified Repository Contract

The current `Dockerfile` uses Node 24, installs npm 12.0.2, runs `npm ci` and `npm run check`, exposes port `3000`, stores events at `/app/data/events.jsonl`, and declares `/app/data` as a volume. The service exposes `/health` and `/runs`; `/runs` has a process-wide fixed-window capacity gate but is not authenticated, tenant-isolated, protected by shared principal-aware rate state, or validated behind a deployed WAF.

## Infrastructure Prerequisites

Document these operator-owned decisions before deployment:

- VPS CPU, memory, disk, region, and data-location rationale;
- non-root administration, SSH keys, firewall policy, and ports that must remain private;
- domain, DNS, HTTPS, and who can access Coolify;
- project and environment separation so unrelated client systems do not share one boundary;
- secret storage, access, rotation, and revocation procedure;
- off-server backup destination, restore owner, retention, and test schedule;
- update, monitoring, pause, disaster-recovery, and rollback procedures.

Never put real addresses, credentials, or private infrastructure identifiers in repository evidence.

## Pre-Public Security Gates

Before exposing `/runs` beyond a controlled environment:

- add authentication and authorization;
- enforce tenant isolation where more than one customer or workspace exists;
- add rate and body-size controls at the appropriate layers;
- expose durable approve and decline operations only to authorized humans;
- define retention, redaction, deletion, and backup handling for leads, drafts, approvals, and events;
- configure alerts for repeated failures, unsafe permission attempts, unavailable dependencies, and cost spikes.

## Work

1. Run `npm run verify` and review the final diff and open risks.
2. Build the production image from the repository `Dockerfile`.
3. Connect the intended repository and environment to Coolify.
4. Configure provider credentials only as Coolify secrets.
5. Set `EVENT_LOG_PATH=/app/data/events.jsonl` and mount persistent storage at `/app/data`.
6. Expose port `3000`, configure `/health`, attach the domain, and verify HTTPS.
7. Deploy and confirm service and dependency health outside the dashboard.
8. Trigger a controlled known-lead run and verify `runId`, `approval_pending`, and a complete redacted event timeline.
9. Restart the container and prove prior events and durable approvals remain available.
10. Trigger an intentional reversible health or startup failure, locate the evidence, and roll back to the last verified image.
11. Restore a backup in a controlled exercise and record recovery time and missing steps.
12. Confirm local and deployed behavior match for the same smoke case.

## Operator Handoff

Create a one-page operator guide that answers:

- What does the agent do and deliberately not do?
- How is it deployed, paused, restarted, and rolled back?
- Where are secrets managed and rotated?
- How are health and dependencies checked?
- How is one failed run found by `runId`?
- When is retry, resume, compensation, escalation, or stop appropriate?
- When must a human take over?

## Acceptance Criteria

- Local verification and critical eval gates are green before deployment.
- The production image is reproducible from a fresh commit.
- The live health check returns 200 over HTTPS.
- An approval-pending run is observable end to end and does not claim a send.
- Authentication, authorization, tenant, and rate boundaries match the exposure level.
- State survives restart and the backup restore is demonstrated.
- A reversible failure is diagnosed and rollback is demonstrated.
- Another operator can follow the guide without repository-author assistance.
- Screenshots and logs are redacted and contain no credentials or customer data.

## Evidence

Add the infrastructure decision record, redacted deployment and service map,
security-gate checklist, verification result, image identifier, live health
result, redacted run timeline, restart and restore proof, rollback timeline,
operator guide, and five-minute demo to the
[Week 4 Build Log](../build-log-week4.md).

Use this demo structure:

1. problem and user;
2. bounded architecture;
3. happy path;
4. one failure and recovery;
5. eval gate, cost or latency evidence, and next improvement.

## Completion Evidence

- Final repository verification passed with 374/374 tests, 18/18 critical
  evals, 5/5 incident drills, and zero dependency vulnerabilities.
- Coolify ran the exact verified revision behind controlled HTTPS access with a
  runtime-only provider secret, Docker health, Sentinel monitoring, one replica,
  and persistent event/approval storage.
- The synthetic smoke stopped at `approval_pending` with one grounded draft,
  one durable pending approval, a complete redacted timeline, and no send claim.
- Exact event and approval files survived container replacement. A private
  stopped-writer snapshot left the VPS, restored exactly on the local
  workstation, and started a healthy local service against the restored state.
- One safe failed deployment was diagnosed before replacement, then the exact
  saved revision/package was restored through a non-force manual deployment.
- The same exact fixture passed locally and inside the container with equivalent
  safety, authority, exact-lead draft evidence, business-event order, stop, and
  report behavior. Full model-selected draft text was not retained or compared.
- The [plain-English operator guide](../runbooks/coolify-workshop-operator.md)
  and [five-minute demo](../demos/week4-controlled-release.md) complete the
  single-owner workshop handoff without publishing private target evidence.
