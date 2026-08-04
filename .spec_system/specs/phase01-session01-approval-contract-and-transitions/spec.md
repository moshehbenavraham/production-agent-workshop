# Session Specification

**Session ID**: `phase01-session01-approval-contract-and-transitions`
**Phase**: 01 - Durable Approval and Safe Write
**Status**: Validated
**Created**: 2026-08-04
**Base Commit**: 4abe1055434bf5bf7265f78fdce6096117f3e62e

---

## 1. Session Overview

This session replaces the legacy inline pending-approval shape with closed,
application-owned approval contracts and a deterministic transition policy.
It is the first executable Phase 01 session because every persistence,
integration, and fake-write session depends on one exact approval identity and
terminal decision vocabulary.

The work stays independent from file I/O, Pi sessions, HTTP routes, provider
credentials, and external effects. It defines what later adapters may persist
or execute while preserving the frozen three-tool production boundary.

---

## 2. Objectives

1. Define schema-validated pending, approved, and declined approval records.
2. Bind every record to one `approvalId`, original `runId`, exact action,
   target, and immutable draft identity.
3. Permit only `pending -> approved` and `pending -> declined` transitions.
4. Return typed original-state outcomes for duplicates and conflicts, and
   typed failures for malformed, missing, unknown-actor, or invalid evidence.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session03-qualification-tool-integration` - Provides exact-lead
  qualification gates, correlated events, and the frozen production allowlist.

### Required Tools Or Knowledge

- Node.js 24.15.0, npm 12.0.2, strict TypeScript, TypeBox, and `node:test`.
- Task `02`, the Phase 01 PRD, repository governance, and the legacy
  `approval.requested` shape in `src/tools.ts`.

### Environment Requirements

- `npm run verify` passes at the recorded base commit.
- Only synthetic lead, actor, target, and draft data is used.

---

## 4. Scope

### In Scope (MVP)

- Human approver can inspect one closed approval record carrying exact immutable
  linkage and minimized decision metadata.
- Application can evaluate approve and decline requests through deterministic,
  schema-validated transition code.
- Store adapters can implement one replaceable interface using closed request
  and decision record contracts.
- Operator evidence can use minimized request, transition, duplicate,
  conflict, invalid, and storage-failure event data schemas.

### Out Of Scope (Deferred)

- File-backed persistence and restart projection - Session 02 owns adapters.
- Pi/tool and application-service integration - Session 03 owns integration.
- Fake execution and idempotency - Sessions 04-06 own the write boundary.
- Public approval endpoints or real actor authentication - Task `07` owns
  exposure hardening.

---

## 5. Technical Approach

### Architecture

Create `src/approval.ts` as a Pi-independent domain module. Closed TypeBox
schemas own static and runtime shapes. A compiled validator additionally
checks timestamp and hash semantics that schema shape alone cannot prove.
The transition function consumes untrusted input, an optional current record,
and an authorized actor set, then returns a discriminated result without side
effects.

The module also defines the replaceable store contract and append-only storage
record shapes without selecting a file format implementation. Terminal records
remain immutable; duplicates and conflicts return the original record and
never manufacture a second decision.

### Design Patterns

- Schema-first boundary: one source for closed TypeScript and runtime shapes.
- Discriminated union: exhaustive statuses, transition outcomes, and failures.
- Pure transition function: persistence and event emission cannot affect policy.
- Exact identity validation: requested and stored IDs are checked independently.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/approval.ts` | Closed approval, transition, store, and event contracts | ~320 |
| `tests/approval.test.ts` | Provider-independent contract and transition tests | ~280 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `docs/build-log-week2.md` | Source-backed state diagram, contract, and failure matrix | ~90 |
| `docs/TODO.md` | Record Session 01 completion state | ~2 |
| `docs/CHANGELOG.md` | Record the new approval domain boundary | ~4 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Pending approval carries the original run, exact action, exact target,
  immutable draft identity, request timestamp, and stable approval identity.
- [ ] Only pending approvals can become approved or declined.
- [ ] Repeating the same decision returns the original terminal record as a
  duplicate without another transition.
- [ ] Opposite decisions return the original terminal record as a conflict.
- [ ] Missing approvals, malformed decisions, unknown actors, identity
  mismatches, and invalid current records return typed actionable failures.
- [ ] Storage request/decision records and minimized operational event data have
  closed runtime validators.

### Testing Requirements

- [ ] Contract-first tests cover closed schemas and semantic validation.
- [ ] Transition tests cover both valid transitions, duplicate, conflict,
  missing, malformed, unknown-actor, and exact-identity paths.
- [ ] `npm run verify` passes with the new focused suite.

### Non-Functional Requirements

- [ ] The domain module has no Pi, HTTP, filesystem, provider, or credential
  dependency.
- [ ] Failure results expose canonical codes without raw caught details.
- [ ] No production tool or external-write capability is added.

### Quality Gates

- [ ] All files are ASCII-encoded with Unix LF line endings.
- [ ] Code follows strict TypeScript and repository conventions.
- [ ] Behavioral quality trust, failure, and contract checks pass.

---

## 8. Implementation Notes

### Working Assumptions

- Synthetic drafts may remain in the durable approval record during the
  workshop, while operational events carry only draft identity and hash. Task
  `02` requires exact retained-field decisions, and the repository explicitly
  prohibits real data until lifecycle rules exist.
- `runId` accepts current UUIDs plus explicit `run_*` deterministic test IDs;
  `approvalId`, `draftId`, and `actorId` use prefixed identifiers to keep
  boundary mistakes visible.

### Conflict Resolutions

- The legacy approval stores `leadId` and full draft directly in a generic
  event, while Phase 01 requires exact target and immutable linkage. The new
  contract models a closed target and draft object; Session 03 deliberately
  adapts the legacy tool after persistence exists.
- "Repeated or conflicting decision" is both a refusal and an original-state
  return. The outcome is successful observation with `kind: duplicate` or
  `kind: conflict`, not a second transition and not friendly completion prose.

### Key Considerations

- Terminal state is immutable and mutually exclusive.
- Schema-valid shape is insufficient when hashes, timestamps, or cross-field
  status/decision consistency are wrong.

### Potential Challenges

- Cross-field consistency: use closed pending and terminal schema variants.
- Caller-owned actor claims: require membership in an application-supplied
  authorized actor set at the pure enforcement boundary.

### Relevant Considerations

- [P00] **Durable approval state**: Establish exact linkage and transitions
  before persistence or execution.
- [P00] **Event truth over prose**: Only validated records may carry terminal
  state.
- [P00] **Schema-first boundaries**: Infer types from closed schemas and compile
  validators for every untrusted crossing.
- [P00] **Exact identity checks**: Validate requested and stored identities
  independently.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Unvalidated decision input or caller-owned actor claims granting permission.
- Duplicate or conflicting calls manufacturing a second terminal transition.
- Shape-valid but semantically inconsistent timestamps, hashes, or identities.

---

## 9. Testing Strategy

### Unit Tests

- Compile every public schema and reject extras, invalid IDs, hashes, statuses,
  decisions, and cross-field combinations.
- Exercise transition outcomes with deterministic timestamps and actors.

### Integration Tests

- N/A in this session; the store interface is intentionally adapter-free.

### Runtime Verification

- Import the module through TSX and run the focused `node:test` suite plus the
  repository verification command.

### Edge Cases

- Missing current record, invalid current record, wrong approval/run identity,
  unknown actor, same terminal request, opposite terminal request, malformed
  timestamp, and mismatched draft hash.

---

## 10. Dependencies

### Other Sessions

- Depends on: Phase 00 Sessions 02 and 03.
- Depended by: Phase 01 Sessions 02-06.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
