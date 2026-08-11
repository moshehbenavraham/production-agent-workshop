# Session 02: Run Projection and Corruption Refusal

**Session ID**: `phase02-session02-run-projection-and-corruption-refusal`
**Status**: Complete
**Source Task**: `04`
**Tasks**: 18
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-11

---

## Objective

Implement a deterministic run projection that derives lifecycle state and the latest safe recovery checkpoint from validated ordered events while failing closed on ambiguous evidence.

---

## Scope

### In Scope (MVP)

- Define closed run status, checkpoint, terminal outcome, stop reason, and projection failure contracts.
- Define legal event ordering for run start, qualification, draft, approval request, recovery, and terminal states.
- Build the same run projection from the same complete ordered event history across fresh store and service instances.
- Derive the latest safe checkpoint after lead qualification, draft creation, and approval request without using raw conversation transcripts.
- Represent replaceable working context as structured projection data derived from durable facts without deleting source events.
- Reject missing prerequisites, duplicate terminal evidence, multiple incompatible checkpoints, cross-run identities, invalid timestamps, and out-of-order records.
- Distinguish observable approval or fake-result status in the run projection from authorization and idempotency truth in their dedicated stores.
- Cross-check exact `runId`, lead, draft, approval, and result identities when those durable records are supplied to recovery policy.
- Provide a read-only projection boundary that returns actionable redacted failures instead of invented state.
- Add deterministic happy, restart, missing, malformed, duplicate, cross-run, corrupt, and out-of-order projection tests.
- Record projection rules, failure examples, and context-compaction boundaries in the Week 3 Build Log.

### Out of Scope

- Continuing Pi execution from a checkpoint or invoking any approval or fake effect.
- Whole-run deadline and maximum-step enforcement.
- Eval golden-set expansion or deployment gating.

---

## Prerequisites

- [x] Session 01 event contracts, validators, and hardened store pass all restart and damaged-record tests.
- [x] Phase 01 approval and fake-result schemas remain the exact authority for permission and effect identity.

---

## Deliverables

1. Closed run projection, checkpoint, stop-reason, and failure contracts.
2. Deterministic ordered-event projector with structured replaceable context and exact cross-store validation hooks.
3. Restart-equivalence, legal-order, damaged-evidence, ambiguity, and identity-refusal tests plus documented projection rules.

---

## Success Criteria

- [x] Rebuilding from the same durable events returns the same lifecycle state, checkpoint, and terminal outcome after restart.
- [x] Projection requires no raw assistant transcript and compaction removes no durable evidence.
- [x] Missing, duplicated, cross-run, malformed, corrupt, or out-of-order records produce an actionable failure and no inferred success.
- [x] Observable approval and result facts cannot grant authorization without exact dedicated-store truth.
- [x] Qualification, draft, and approval-request checkpoints are explicit and independently tested.
