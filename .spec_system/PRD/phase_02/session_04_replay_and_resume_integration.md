# Session 04: Replay and Resume Integration

**Session ID**: `phase02-session04-replay-and-resume-integration`
**Status**: Complete
**Source Task**: `04`
**Tasks**: 22
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-11

---

## Objective

Complete the recovery vertical slice by replaying and resuming the three required interruption checkpoints without duplicate approval or fake effects, then close Task `04` evidence.

---

## Scope

### In Scope (MVP)

- Define explicit retry, resume, compensate, escalate, and stop decisions with the durable evidence required for each action.
- Add an application-owned recovery entrypoint that selects only a validated safe checkpoint and preserves the original `runId`.
- Resume after qualification without repeating the completed qualification outcome or accepting stale cross-lead evidence.
- Resume after draft creation from exact `draftId` and hash evidence without inventing or substituting draft content.
- Resume after approval request by returning the exact durable pending or terminal approval without creating another request.
- Cross-check event projection, approval projection, and fake-result projection before continuing from any checkpoint.
- Reuse stable approval and idempotency identities so replayed events or requests cannot duplicate a fake effect.
- Stop and escalate reservation-only or otherwise indeterminate fake state; never automatically retry an unknown effect.
- Return actionable failures for missing, malformed, truncated, duplicated, cross-run, out-of-order, or inconsistent records.
- Provide deterministic recovery harness operations that require no manual editing of durable JSONL records.
- Prove restart behavior with fresh store and service instances at all three required checkpoints.
- Prove duplicate replay and resume attempts return stable existing outcomes without duplicate approval or adapter calls.
- Document event-payload retention, redaction, deletion, compaction, and synthetic-data limits before any real-data use.
- Complete the recovery decision table, three Mermaid restart timelines, replay-idempotency proof, failure exercise, verification output, and diff review in the Week 3 Build Log.
- Synchronize Task `04` progress documentation only after focused and repository verification pass.

### Out of Scope

- Public recovery endpoints, operator authentication, distributed locks, or production deployment.
- Automatic compensation or retry of a real or indeterminate external write.
- Task `05` golden-set and deployment-gate implementation.

---

## Prerequisites

- [x] Session 03 bounds every run and produces trusted lifecycle, checkpoint, attempt, outcome, and terminal evidence.
- [x] Phase 01 approval and fake-result duplicate protections remain green across fresh service instances.

---

## Deliverables

1. Application-owned replay and resume boundary for the three required checkpoints under one stable `runId`.
2. Cross-store identity, duplicate, indeterminate-effect, and damaged-evidence recovery tests using fresh instances and no manual record edits.
3. Completed Task `04` Week 3 evidence pack, retention decision, verification result, and security and side-effect diff review.

---

## Success Criteria

- [x] Qualification, draft, and approval-request interruptions resume from durable evidence and produce the same safe outcome after restart.
- [x] Replaying the same event or request creates no duplicate approval and invokes no duplicate fake effect.
- [x] Indeterminate effect state always stops for explicit inspection or escalation and is never retried automatically.
- [x] Corrupt, incomplete, missing, cross-run, or out-of-order evidence fails visibly with a defined operator action.
- [x] Task `04` evidence is complete and repository verification passes without expanding Pi, HTTP, data, or network permissions.
