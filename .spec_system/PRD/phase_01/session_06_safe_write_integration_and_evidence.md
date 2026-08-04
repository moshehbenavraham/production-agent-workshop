# Session 06: Safe Write Integration and Evidence

**Session ID**: `phase01-session06-safe-write-integration-and-evidence`
**Status**: Not Started
**Source Task**: `03`
**Estimated Tasks**: ~18-24
**Estimated Duration**: 2-4 hours

---

## Objective

Complete and review the fake-write vertical slice, prove every Task `03` path end to end, and close Phase 01 without adding a real network capability.

---

## Scope

### In Scope (MVP)

- Assemble the durable approval projection, approved-action resolver, idempotency store, fake adapter, and minimized event evidence behind one application-owned service boundary.
- Provide a deterministic authorized-operator harness for the fake boundary without exposing a public production endpoint.
- Prove the eight required paths: valid approval, missing input, target mismatch, pending or declined approval, timeout, duplicate request, permission denial, and downstream failure.
- Assert validation, authorization, exact-target matching, and idempotency all precede the fake effect.
- Verify accepted, duplicate, rejected, timed-out, permission-denied, and downstream-failure results agree with persisted and event evidence.
- Record the required human review of the permission boundary, tool contract, and diff before any write-capable allowlist decision.
- Confirm the production Pi boundary still cannot perform a real network write and the phase adds no provider credential.
- Complete the Task `03` contract, permission table, idempotency proof, test matrix, redacted event examples, review result, failure exercise, verification output, and final diff review in the Week 2 Build Log.
- Synchronize Phase 01 completion documentation only after all deterministic and repository verification gates pass.

### Out of Scope

- Real send providers, network-writing Pi tools, public write endpoints, and production actor authentication.
- Whole-run replay or resume, distributed execution, deployment, and real customer data.
- Phase 02 recovery and production-eval work.

---

## Prerequisites

- [ ] Session 05 idempotency, timeout, restart, and downstream-failure tests are complete.
- [ ] A human reviewer is identified for the Task `03` permission and diff evidence.

---

## Deliverables

1. Application-owned fake-write vertical slice with the complete deterministic eight-path test matrix.
2. Recorded permission, tool-contract, and diff review plus an explicit production allowlist decision.
3. Completed Task `03` Week 2 evidence pack, Phase 01 verification, and final security and privacy diff review.

---

## Success Criteria

- [ ] Every required success and refusal path is deterministic, typed, correlated, and backed by persisted evidence.
- [ ] Duplicate approved requests return the original result and the fake adapter effect count remains one.
- [ ] No unapproved, mismatched, malformed, timed-out, or denied request is reported as completed.
- [ ] Human review is recorded before any write-capable allowlist change, and no real network tool or provider credential enters the phase.
- [ ] Week 2 evidence is complete and `npm run verify` plus the production-agent verification workflow pass.
