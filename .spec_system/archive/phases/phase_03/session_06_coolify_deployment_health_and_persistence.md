# Session 06: Coolify Deployment Health and Persistence

**Session ID**: `phase03-session06-coolify-deployment-health-and-persistence`
**Status**: Complete
**Source Task**: `07`
**Estimated Tasks**: ~20
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-12

---

## Objective

Deploy one verified immutable image through the authorized controlled Coolify target and prove external health, synthetic smoke behavior, observability, and persistent restart.

---

## Scope

### In Scope (MVP)

- Run the complete local verification and critical eval gates against the exact revision selected for release.
- Build the production image reproducibly from the repository Dockerfile and record its immutable source and image identity.
- Connect the intended repository, project, and isolated environment through the authorized Coolify operator boundary.
- Configure provider credentials only as Coolify secrets and record presence or rotation evidence without reading or copying secret values.
- Configure bounded run deadline, step, and single-process rate settings from measured operational evidence.
- Mount persistent `/app/data` storage and configure event and approval paths without moving data outside the declared boundary.
- Preserve one replica unless an explicit cross-process persistence and shared-rate design has been implemented and verified.
- Expose container port 3000, configure the platform health probe, and verify `/health` over HTTPS outside the dashboard.
- Apply the controlled access and edge policy from Session 05 before invoking `/runs`.
- Execute one controlled synthetic known-lead smoke case and verify exact `runId`, grounded qualification, draft, `approval_pending`, and no send claim.
- Query the smoke run through the safe timeline command and verify alerts and redaction on the deployed evidence path.
- Restart or replace the container and prove prior events and durable approvals remain available without manual record edits.
- Record the redacted verification, image, health, smoke, timeline, monitoring, and persistent-restart evidence in the Week 4 Build Log.

### Out of Scope

- Public `/runs` exposure when the complete caller, tenant, shared-rate, edge, and data-lifecycle gates have not passed.
- Real customer data, a real send, public approval decisions, secret values, or private target identifiers in repository evidence.
- Off-server restore activation, intentional rollback exercise, local/deployed parity closeout, or final operator handoff.

---

## Prerequisites

- [x] Session 05 release preflight passes for the selected controlled exposure and authorized target.
- [x] The operator can use the target and secret store without disclosing credentials or private infrastructure values to repository artifacts.

---

## Deliverables

1. Reproducible verified image tied to one reviewed revision and one redacted immutable image identifier.
2. Controlled Coolify deployment with external HTTPS health, synthetic pending-approval smoke, monitoring, and exact run timeline evidence.
3. Persistent restart proof for event and approval state under the selected one-replica boundary.

---

## Success Criteria

- [x] The deployed image derives from the exact green revision and the external HTTPS health check returns the expected status without exposing internals.
- [x] One controlled synthetic run is reconstructable end to end and stops at `approval_pending` without any send claim or effect.
- [x] Event and approval evidence survives a controlled container restart or replacement and remains runtime-valid.
- [x] Target monitoring uses the actionable rules and minimized fields established by Task `06`.
- [x] The deployment evidence is redacted and the selected access boundary introduces no unverified public route or broadened Pi capability.
