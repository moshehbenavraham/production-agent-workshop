# PRD Phase 01: Durable Approval and Safe Write

**Status**: In Progress
**Sessions**: 6 (initial estimate)
**Estimated Duration**: 4-6 workshop days

**Progress**: 1/6 sessions (17%)

---

## Overview

Week 2 turns the current event-only pending approval into an application-owned durable decision boundary, then builds a deterministic fake external-write service that can act only on the exact approved action and target. The phase preserves synthetic-only data, the single-agent baseline, visible failure behavior, and the prohibition on real provider credentials or network writes.

---

## Progress Tracker

| Session | Name | Status | Est. Tasks | Validated |
|---------|------|--------|------------|-----------|
| 01 | Approval Contract and Transitions | Complete | ~18-22 | 2026-08-04 |
| 02 | Approval Store and Projection | Not Started | ~20-24 | - |
| 03 | Durable Approval Integration | Not Started | ~20-24 | - |
| 04 | Fake Send Contract and Authorization | Not Started | ~18-22 | - |
| 05 | Idempotent Fake Send Execution | Not Started | ~20-24 | - |
| 06 | Safe Write Integration and Evidence | Not Started | ~18-24 | - |

---

## Completed Sessions

- 2026-08-04: Session 01 - Approval Contract and Transitions

---

## Upcoming Sessions

- Session 02: Approval Store and Projection

---

## Objectives

1. Define closed approval records, terminal decision rules, and structured failure contracts owned by deterministic application code.
2. Persist approval transitions behind a replaceable file-backed store and rebuild exact projections that survive restart and reject corrupt evidence.
3. Integrate application-owned request, approve, and decline operations with minimized append-only event evidence and an explicit synthetic-data lifecycle decision.
4. Resolve every fake action from immutable approved state, validate authorization and exact target identity before the effect, and persist one stable idempotency result.
5. Prove all required success and failure paths without a provider credential, real network write, public decision endpoint, or unreviewed Pi permission expansion.

---

## Prerequisites

- Phase 00 is complete and its qualification, exact-lead, event-order, and frozen-allowlist controls remain green.
- Only synthetic lead, draft, actor, approval, and fake-result data is used.
- The current `/runs` boundary remains private or controlled while public decision and write endpoints are deferred to Task `07`.

---

## Planning Assumptions And Resolutions

### Working Assumptions

- Phase 01 requires six sessions: the current approval is created inline in `src/tools.ts` and stored only as an event, while Tasks `02` and `03` require new domain contracts, replaceable persistence, restart projection, application integration, authorization, idempotency, failure evidence, and review. Three ordered sessions per source task keep each objective within 12-25 tasks and 2-4 hours.
- File-backed single-process persistence remains the workshop boundary: the master PRD and repository conventions explicitly defer a database, queue, or Redis until measured concurrency requires one, so approval and idempotency interfaces can remain replaceable without expanding this phase.
- The Task `03` human review is a final evidence gate: its HITL mode and acceptance criteria require the permission contract and diff to be reviewed before any write-capable tool is allowlisted, so Session 06 records the allowlist decision after the application service and deterministic failure evidence exist.

### Conflict Resolutions

- Task `03` is named as a send boundary while the master PRD prohibits real sending in the required path: Phase 01 implements only a deterministic fake adapter and application service, adds no provider credential or real network effect, and keeps any future network-writing Pi tool outside scope. This follows the task Work section, PRD constraints, and the Phase 00 least-privilege control.

---

## Technical Considerations

### Architecture

- Keep approval schemas and transition policy independent from Pi, HTTP, and file I/O; keep file-backed persistence behind focused store interfaces.
- Separate temporary Pi context, durable approval records, append-only operational events, and rebuilt approval projections.
- Link the exact action, target, and approved draft state immutably to `approvalId` and the originating `runId`; never authorize from prompt text or assistant prose.
- Validate approval state, actor permission, exact target identity, and the stable idempotency key before invoking the fake adapter.
- Persist the first fake result and return it for duplicates without another adapter effect; record minimized attempts and outcomes for denial, timeout, and dependency failure.
- Keep public approval and write endpoints, real provider integration, and whole-run replay outside this phase.

### Technologies

- Node.js 24.15 or newer and npm 12
- Strict TypeScript with closed TypeBox schemas and discriminated unions
- Replaceable file-backed approval and idempotency stores
- Append-only JSONL operational events with `runId` and `approvalId` correlation
- `node:test`, TSX, Biome, and deterministic provider-independent verification

### Risks

- Contradictory decisions or duplicate effects: enforce one-way terminal transitions, exact immutable linkage, and persisted idempotency before the fake effect.
- Malformed, truncated, or interrupted storage: validate every record, fail visibly, and never rebuild permission from partial evidence.
- Sensitive persisted content: use synthetic data, minimize actor and outcome evidence, and define retained draft fields plus retention, redaction, export, and deletion behavior.
- Permission expansion: keep application authorization independent from model behavior and require the recorded human review before any write-capable allowlist change.
- Cross-run or cross-lead authorization: validate `runId`, `approvalId`, action, target, and approved draft linkage at every boundary.
- Recovery scope creep: preserve evidence needed by Phase 02 without implementing whole-run replay or resume in Phase 01.

### Relevant Considerations

- [P00] **Durable approval state**: Sessions 01-03 close the missing record, transition, exact-draft linkage, projection, and restart behavior before fake execution exists.
- [P00] **Event truth over prose**: Approval and write permission derive only from validated ordered durable records and application projections.
- [P00] **Frozen least privilege**: Sessions 04-06 prove exact approval, target validation, and idempotency before recording any allowlist decision.
- [P00] **Synthetic-data restriction**: Phase evidence uses synthetic values and records the data-lifecycle decision without claiming real-data readiness.
- [P00] **Schema-first boundaries**: Approval, decision, adapter, event, projection, and idempotency contracts precede integration.
- [P00] **Exact identity checks**: Requested, approved, stored, projected, and executed identifiers are independently validated.
- [P00] **Run recovery projection**: Phase 01 preserves deterministic approval and fake-result evidence that Phase 02 can use without absorbing whole-run replay work.

---

## Success Criteria

Phase complete when:

- [ ] All 6 sessions are completed and validated.
- [ ] Pending, approved, and declined approval projections survive restart and cannot contradict one another.
- [ ] Missing, malformed, unknown-actor, duplicate, conflicting, interrupted-write, and corrupt-record paths fail visibly without a second transition or implied success.
- [ ] The fake adapter resolves immutable approved state, rejects every unapproved or mismatched request before the effect, and performs no real network write.
- [ ] A repeated approved request returns the first persisted result with no duplicate fake effect.
- [ ] Accepted, duplicate, rejected, timed-out, permission-denied, and downstream-failure outcomes have typed, minimized evidence under the original `runId` and `approvalId`.
- [ ] The Task `03` permission contract and diff receive recorded human review before any write-capable allowlist change.
- [ ] Week 2 Build Log evidence, `docs/TODO.md`, and `docs/CHANGELOG.md` match the implemented state.
- [ ] `npm run verify` and the production-agent verification workflow pass with final security, privacy, persistence, permission, and side-effect review evidence.

---

## Dependencies

### Depends On

- Phase 00: Foundation

### Enables

- Phase 02: Recovery and Evaluation Gates
