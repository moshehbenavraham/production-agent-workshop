# Session 05: Controlled Release Security and Operator Contract

**Session ID**: `phase03-session05-controlled-release-security-and-operator-contract`
**Status**: Complete
**Source Task**: `07`
**Estimated Tasks**: ~18
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-12

---

## Objective

Define and verify the controlled Coolify release contract, pre-public security gates, and operator-owned infrastructure decisions before any target mutation.

---

## Scope

### In Scope (MVP)

- Revalidate the clean revision, repository verification gate, container contract, open security findings, and known infrastructure exceptions.
- Define the authorized deployment exposure and fail closed when `/runs` would be reachable beyond its verified caller controls.
- Record redacted decision categories for sizing, region, data location, non-root administration, SSH, firewall, DNS, HTTPS, and Coolify access.
- Record environment separation, secret storage, rotation, revocation, backup, retention, monitoring, pause, recovery ownership, update, and rollback decisions without private values.
- Build a pre-public security matrix for authentication, authorization, tenant isolation, trusted proxy identity, shared principal-aware rate control, body-size controls, human decision access, data lifecycle, WAF, and alerts.
- Treat the existing process-wide fixed-window rate gate only as single-process capacity protection.
- Default to a controlled release in which `/health` may be externally checked and `/runs` remains private or edge-restricted unless every broader-exposure gate passes.
- Define exact environment-variable, persistent-path, port, health, image-identity, and one-replica requirements for the target.
- Keep provider and deployment credentials in authorized secret stores and add no secret-reading or deployment capability to Pi.
- Define a reproducible release preflight and evidence checklist that fails on an unverified revision, unsafe exposure, missing persistence, or incomplete operator ownership.
- Add deterministic tests for repository-owned preflight logic and safe redacted examples where code is introduced.
- Add the infrastructure decision record, Mermaid service map, and initial security-gate checklist to the Week 4 Build Log.

### Out of Scope

- Connecting to or mutating the Coolify target, injecting real secrets, changing DNS, or exposing a live route.
- Implementing a public approval-decision endpoint, real send provider, distributed quota, database, queue, or multi-replica execution.
- Claiming production security, health, backup, restore, or rollback before target evidence exists.

---

## Prerequisites

- [x] Session 04 closes Task `06` with a green repository gate and an actionable incident boundary.
- [x] Current security findings, known infrastructure exceptions, Docker behavior, and Coolify target contract are reconciled before release preflight is defined.

---

## Deliverables

1. Redacted infrastructure decision record and Mermaid service map with explicit ownership and trust boundaries.
2. Exposure-specific security-gate matrix and fail-closed release preflight contract.
3. Verified repository-owned preflight behavior and Week 4 release-readiness evidence without target mutation.

---

## Success Criteria

- [x] Every operator-owned infrastructure decision has a responsible role, validation method, and redacted evidence location.
- [x] `/runs` cannot be treated as public-ready from the local rate limiter, HTTPS health, or dashboard reachability alone.
- [x] Image, secret, persistence, health, replica, backup, monitoring, pause, recovery, and rollback requirements are explicit before deployment.
- [x] Preflight fails visibly for unsafe exposure, unverified source, missing ownership, or incomplete mandatory configuration.
- [x] Repository artifacts contain no credential, private URL, address, customer data, or new Pi/deployment permission.
