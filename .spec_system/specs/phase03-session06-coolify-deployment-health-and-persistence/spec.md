# Session Specification

**Session ID**: `phase03-session06-coolify-deployment-health-and-persistence`
**Phase**: 03 - Operations and Coolify Release
**Status**: Complete
**Created**: 2026-08-12
**Validated**: 2026-08-12
**Completed**: 2026-08-12
**Version**: `0.1.37`
**Base Commit**: 52df37a96a76afc1d82656ef04e0922aa42e9b16

---

## 1. Session Overview

This session records and verifies the authorized controlled Coolify release of
one reviewed revision. It proves provider credential presence without exposing
the value, external and container health, a synthetic pending-approval run,
monitoring, and exact durable state across container replacement.

The release remains synthetic-only, single-replica, and protected by the
existing controlled edge. Public exposure, real data, backup activation, and
final operator handoff remain outside this session.

---

## 2. Objectives

1. Tie the running Coolify image to the exact green source revision.
2. Verify runtime, provider, access, health, and monitoring boundaries.
3. Complete one synthetic run that stops at `approval_pending` with no send.
4. Prove the exact run and pending approval survive container replacement.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase03-session05-controlled-release-security-and-operator-contract` - Provides the closed release preflight and controlled-exposure policy.

### Required Tools Or Knowledge

- Coolify API access, SSH access to the authorized VPS, Docker, Node.js, npm, and Git.

### Environment Requirements

- Private ignored `.env` values match the placeholder contract and at least one provider credential is present.
- Only synthetic committed lead identifiers may be used.

---

## 4. Scope

### In Scope (MVP)

- Verify and deploy one exact source revision and record a redacted immutable image identity.
- Validate Coolify runtime settings, controlled HTTPS access, Docker health, and Sentinel monitoring.
- Execute one provider-backed synthetic lead run and validate its durable pending approval.
- Replace the container and compare exact event and approval state before and after.
- Update redacted release evidence and operational documentation.

### Out Of Scope (Deferred)

- Off-server restore activation and rollback - Reason: owned by Session 07.
- Local/deployed parity and final operator guide - Reason: owned by Session 08.
- Public caller identity, tenant isolation, or real data - Reason: outside the controlled workshop release.

---

## 5. Technical Approach

### Architecture

Use Coolify as the control plane, its secret store for provider credentials,
one Docker container, and one named `/app/data` volume. Validate authoritative
state through the application stores and closed run-report contracts rather
than raw log inference.

### Design Patterns

- Presence-only secret checks: prove configuration without reading or copying values.
- Exact identity comparison: bind source SHA, image ID, run ID, and state checksums.
- Controlled replacement: replace the container while retaining the named volume.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `.spec_system/specs/phase03-session06-coolify-deployment-health-and-persistence/implementation-notes.md` | Task-level deployment evidence | ~180 |
| `.spec_system/specs/phase03-session06-coolify-deployment-health-and-persistence/code-review.md` | Review and repair report | ~90 |
| `.spec_system/specs/phase03-session06-coolify-deployment-health-and-persistence/security-compliance.md` | Scoped release security review | ~90 |
| `.spec_system/specs/phase03-session06-coolify-deployment-health-and-persistence/validation.md` | Session validation evidence | ~140 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `.env.example` | Placeholder-only Coolify and operator configuration contract | ~80 |
| `docs/fixtures/release-preflight-current-target.json` | Redacted current-target facts | ~150 |
| `docs/build-log-week4.md` | Health, smoke, monitoring, and persistence evidence | ~40 |
| `docs/deployment.md` | Current controlled deployment posture | ~20 |
| `docs/environments.md` | Current environment and secret injection guidance | ~20 |
| `.spec_system/audit/known-issues.md` | Remove directly resolved infrastructure exceptions | ~10 |

---

## 7. Success Criteria

### Functional Requirements

- [x] Coolify runs the exact verified source revision and recorded image.
- [x] Health, controlled access, provider credential presence, and monitoring pass direct checks.
- [x] One synthetic run ends at `approval_pending` with grounded qualification and no send claim.
- [x] The exact run events and pending approval survive a full container replacement unchanged.

### Testing Requirements

- [x] `npm run verify` passes.
- [x] The current-target release preflight passes all closed checks.
- [x] Direct deployed health, smoke, and persistence scenarios pass.

### Non-Functional Requirements

- [x] No credential, private target identifier, URL, or raw provider output enters repository evidence.
- [x] One replica and synthetic-only data remain enforced by the documented boundary.

### Quality Gates

- [x] All files ASCII-encoded.
- [x] Unix LF line endings.
- [x] Documentation matches direct observed behavior.

---

## 8. Implementation Notes

### Working Assumptions

- The workshop owner fills all generic operator roles: the user explicitly accepted responsibility for deployment, health, incidents, backup, recovery, rotation, and rollback.
- The operator workstation is outside the VPS host boundary: it may satisfy the workshop off-server destination requirement while remaining insufficient for a real production service.

### Conflict Resolutions

- The planned preflight preceded direct target evidence, while the authorized deployment work occurred during setup. Current direct evidence is recorded without claiming that the earlier blocked snapshot authorized mutation.

### Key Considerations

- Preserve private infrastructure details only in `.env` and Coolify.
- Treat operational events as evidence, not approval authority.

### Potential Challenges

- Provider tool-call identifiers can include opaque separator characters: retain bounded validation while accepting the directly observed provider form.
- External workstation TLS may be unstable: record the route issue without weakening the controlled-access result.

### Relevant Considerations

- [P02] **Single-process persistence**: Keep exactly one application replica.
- [P01] **Controlled exposure only**: HTTP Basic Authentication is a workshop control, not a public authorization design.
- [P02] **Offline snapshots are closed recovery evidence**: Session 07 must copy them off the VPS and restore to an absent destination.

---

## 9. Testing Strategy

### Unit Tests

- Run all repository tests, including the provider tool-call identifier regression.

### Integration Tests

- Run the release preflight and the 18-case deterministic production eval.

### Runtime Verification

- Verify Coolify API access, health, controlled request behavior, provider access, one synthetic run, Sentinel status, and state across replacement.

### Edge Cases

- Fail closed on missing provider auth, source drift, image drift, anonymous access, missing approval, or changed state checksum.

---

## 10. Dependencies

### Other Sessions

- Depends on: `phase03-session05-controlled-release-security-and-operator-contract`.
- Depended by: `phase03-session07-off-server-restore-and-rollback`.

---

## Next Steps

Plan Phase 03 Session 07 off-server restore and rollback.
