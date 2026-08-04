# Session 01: Approval Contract and Transitions

**Session ID**: `phase01-session01-approval-contract-and-transitions`
**Status**: Complete
**Source Task**: `02`
**Estimated Tasks**: 14
**Estimated Duration**: 2-4 hours

---

## Objective

Define and implement the closed approval contracts and deterministic transition policy independently from persistence, Pi, and HTTP integration.

---

## Scope

### In Scope (MVP)

- Define closed schemas and types for approval identity, original `runId`, exact action, exact target, immutable draft linkage, status, timestamps, and minimized actor decision metadata.
- Define decision input, transition result, and structured failure unions for approve and decline operations.
- Permit only `pending -> approved` and `pending -> declined`; make approved and declined mutually exclusive terminal states.
- Define duplicate, conflicting, missing, malformed, unknown-actor, and storage failure categories without friendly success fallbacks.
- Define the replaceable approval-store interface before choosing file details.
- Define minimized request, approval, decline, duplicate, invalid, and storage-failure event contracts.
- Implement deterministic transition logic with explicit exact-identity and ordering checks.
- Add provider-independent contract and transition tests for valid, repeated, conflicting, malformed, and unknown-actor decisions.
- Add the source-backed Mermaid approval state diagram and contract evidence to the Week 2 Build Log.

### Out of Scope

- File-backed store implementation, process-restart proof, and corrupt-file handling.
- Pi tool, HTTP endpoint, provider credential, fake send adapter, or external effect.
- Real customer, actor, recipient, or draft data.

---

## Prerequisites

- [x] Phase 00 is complete and `npm run verify` is green at the session base.
- [x] The current `approval.requested` shape and exact-lead qualification gate are mapped as untrusted legacy input to be replaced or adapted deliberately.

---

## Deliverables

1. Closed approval, decision, transition, failure, and event contracts with a replaceable store interface.
2. Deterministic terminal transition policy with focused valid and refusal-path tests.
3. Mermaid state diagram, storage contract outline, and failure matrix recorded in the Week 2 Build Log.

---

## Success Criteria

- [x] Approval state carries the original `runId` and exact action, target, and draft linkage under one stable `approvalId`.
- [x] Only the two allowed pending transitions can produce terminal state.
- [x] Duplicate and conflicting decisions return the original terminal state without another transition or effect.
- [x] Unknown actors, malformed decisions, missing approvals, and invalid records produce typed actionable failures.
- [x] Domain contracts and behavior are independently testable without file I/O, Pi, HTTP, or credentials.
