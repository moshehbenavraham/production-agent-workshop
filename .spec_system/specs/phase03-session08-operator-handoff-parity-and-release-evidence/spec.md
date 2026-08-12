# Session Specification

**Session ID**: `phase03-session08-operator-handoff-parity-and-release-evidence`
**Phase**: 03 - Operations and Coolify Release
**Source Task**: `07`
**Status**: Complete
**Created**: 2026-08-12
**Validated**: 2026-08-12
**Completed**: 2026-08-12
**Version**: `0.1.39`
**Base Commit**: `2d458897c362663b1d2c1ac969c73d19bc9992c0`

---

## 1. Session Overview

This session compares one exact synthetic lead run locally and on the selected
Coolify target, then closes the workshop release with a plain-English operator
guide, a five-minute demo, and a redacted evidence portfolio. The comparison
must prove the same qualification, draft, approval-pending stop, event order,
and reporting semantics without exposing private target values or run IDs.

The workshop owner is the sole human operator. Their direct feedback already
established that unclear ownership jargon is unusable, that they own the
operator actions, and that a private local-workstation backup is appropriate
for this workshop. Final handoff evidence must distinguish this real feedback
from repository command checks and must not invent a second human dry-run.

## 2. Objectives

1. Prove equivalent local and deployed behavior for one exact synthetic smoke.
2. Preserve final release evidence for health, access, persistence, restore,
   recovery, rollback, monitoring, verification, and remaining limits.
3. Produce a concise plain-English operator guide and five-minute demo.
4. Close source Task `07` and Phase 03 only after every final gate passes.

## 3. Prerequisites

- [x] Session 07 proved off-server restore activation and source-pinned recovery.
- [x] Coolify credentials support the required read, write, and deploy actions.
- [x] The selected target is healthy at the verified revision with automatic
  deploy disabled.
- [x] The workshop owner accepts the private local workstation as the temporary
  backup destination and owns workshop operations.

## 4. Scope

### In Scope

- Start an isolated local service with the runtime-only provider credential.
- Run the same exact synthetic fixture locally and in the Coolify container.
- Compare safe result fields, approval-pending stop, canonical event sequence,
  redacted report semantics, and absence of send completion.
- Record local request latency and explicitly distinguish available or
  unavailable provider token/cost data from deployment-plus-smoke elapsed time.
- Verify final target revision, package, health, access, persistence evidence,
  backup, restore, recovery, rollback, monitoring, and automatic-deploy posture.
- Write and command-audit a plain-English operator handoff and five-minute demo.
- Record the workshop owner's direct usability corrections without claiming a
  second human executed actions they did not execute.
- Run complete repository, dependency, eval, privacy, and diff verification.
- Synchronize Task `07`, Week 4, TODO, changelog, PRD, security, and known risks.

### Out Of Scope

- Real sends, customer data, a public decision interface, paid remote storage,
  multi-replica operation, automated disaster recovery, or broader exposure.
- Adding authentication or tenant isolation and then making `/runs` public.
- Starting Phase 04 or implementing its typed-handoff experiment.

## 5. Technical Approach

### Exact Parity Check

Use `lead_ada` with the same runtime model configuration on both sides. Capture
only the validated response fields and ordered event types locally. Temporarily
install an internal Coolify post-deployment check that runs the same case and
fails deployment if those safe fields or event types differ. Deploy the exact
verified source revision without broadening exposure, clear the temporary hook,
and confirm the target remains healthy.

### Handoff And Closeout

Keep the guide short and literal: say who does each action, what buttons or
bounded repository commands to use, and when to stop. Reuse direct evidence
from Sessions 05-07 and the final parity check. Treat the owner's complaint
about unclear wording as usability evidence and remove that jargon. Run every
available deterministic gate before marking the session and phase complete.

## 6. Deliverables

### Files To Create

| File | Purpose |
|------|---------|
| `implementation-notes.md` | Task-level parity and handoff evidence |
| `code-review.md` | Exact-base review and repair report |
| `security-compliance.md` | Final privacy, access, and authority review |
| `validation.md` | Complete session validation evidence |
| `IMPLEMENTATION_SUMMARY.md` | Session closeout summary |
| `docs/runbooks/coolify-workshop-operator.md` | Plain-English operator handoff |
| `docs/demos/week4-controlled-release.md` | Five-minute redacted demo |

### Files To Modify

| File | Changes |
|------|---------|
| `docs/build-log-week4.md` | Parity, handoff, demo, and final release evidence |
| `docs/todo/07-coolify-release.md` | Complete directly proved work and acceptance |
| `docs/deployment.md`, `docs/environments.md` | Final workshop operating posture |
| `.spec_system/audit/known-issues.md` | Keep only genuinely open release limits |
| `docs/TODO.md`, `docs/CHANGELOG.md` | Synchronize Phase 03 completion |
| `.spec_system/PRD/PRD.md` | Mark Phase 03 and Task `07` complete |
| `package.json`, `package-lock.json` | Bump the session completion version |

## 7. Success Criteria

- [x] Local and deployed results match on safety, authority, stop reason,
  validated output, approval state, event order, and report semantics.
- [x] Final Coolify state is healthy, source-pinned, manually deployed, and has
  no temporary parity hook.
- [x] The operator guide is plain English, bounded, current, and independently
  checked against implemented actions.
- [x] Direct owner feedback and command validation are recorded accurately;
  unavailable second-human evidence is not invented.
- [x] The five-minute demo contains a bounded Mermaid map, happy path, actual
  safe failure/recovery, green eval gate, measured or unavailable baseline, and
  one next improvement.
- [x] Complete verification, coverage, audit, incident drills, release preflight,
  privacy scans, documentation checks, and final diff review pass.
- [x] Task `07` and Phase 03 are complete; Phase 04 remains unbuilt.

## 8. Relevant Considerations

- [P01] **Controlled exposure only**: parity runs inside the target boundary.
- [P01] **Frozen least privilege**: deployment remains an operator action.
- [P01] **No-send contract**: approval-pending is the only successful smoke stop.
- [P02] **Durable truth over logs**: compare validated results and event types.
- [P02] **Evidence honesty**: label unavailable human, cost, token, or digest data.

## Next Steps

Run the Phase 03 transition audit. Do not run Phase 04 `phasebuild` yet.
