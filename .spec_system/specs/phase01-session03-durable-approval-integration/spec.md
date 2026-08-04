# Session Specification

**Session ID**: `phase01-session03-durable-approval-integration`
**Phase**: 01 - Durable Approval and Safe Write
**Status**: Not Started
**Created**: 2026-08-04
**Base Commit**: aa491c4aada27c50d4fbf622befe7c00529f1e6d

---

## 1. Session Overview

This session connects the validated approval domain and file adapter to the
application. It replaces event-only approval creation with one application-
owned service, makes the configured approval projection authoritative for run
status, keeps approve/decline internal and outside Pi/HTTP, and closes Task `02`
with minimized operational evidence and an explicit synthetic-data lifecycle.

The service must handle the non-transactional boundary between approval storage
and operational events deliberately. A durable record is never rolled back or
ignored because an event append failed; retries recover missing minimized event
evidence from the authoritative record before reporting duplicate/conflict
state.

---

## 2. Objectives

1. Provide durable request, approve, decline, lookup, and run-list operations
   behind an application service with exact actor/run/approval checks.
2. Bind the approval tool to the latest exact application-produced draft while
   removing full draft content from operational events.
3. Derive `approval_pending` only from validated durable projection state and
   return an explicit approval failure when required state is absent or invalid.
4. Configure the runtime approval path under the existing persistent data
   boundary and complete retention, redaction, export, and deletion evidence.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session01-approval-contract-and-transitions` - closed approval,
  decision, event, and store contracts plus pure transition behavior.
- [x] `phase01-session02-approval-store-and-projection` - durable JSONL adapter,
  ordered projection, restart proof, and damaged-record refusal.

### Required Tools Or Knowledge

- Existing qualification/draft/approval Pi tool flow, `JsonlEventStore`,
  `FileApprovalStore`, closed TypeBox validation, and dependency injection.

### Environment Requirements

- Clean pushed base `aa491c4`.
- Node.js 24.15.0 and npm 12.0.2.
- `npm run verify` passes at 70/70 tests and 5/5 evals.
- `data/*` remains gitignored and `/app/data` remains the container volume.

---

## 4. Scope

### In Scope (MVP)

- Application-owned durable approval request and internal decision service.
- Authorized synthetic actor policy injected at service composition.
- Exact request linkage to run, lead, action, application-produced draft ID,
  content, and SHA-256 hash.
- Minimized request, terminal, duplicate, conflict, invalid, and storage-failure
  operational events correlated to the original run.
- Best-effort event recovery after the authoritative durable append succeeded.
- Configured `APPROVAL_LOG_PATH`, default/local/container path documentation,
  and runtime composition with `FileApprovalStore`.
- Durable projection input to run-stop derivation and restart integration tests.
- Exact synthetic-only retention, redaction, export, and deletion rules.

### Out Of Scope (Deferred)

- Public approval endpoints, production actor authentication, tenant isolation,
  rate limiting, or public decision authorization - Task `07`.
- Fake or real send contracts, idempotency storage, adapter effects, or any send
  tool/allowlist change - Sessions 04-06.
- Multi-process transactions, database migration, automatic damaged-file repair,
  whole-run resume, or event replay beyond the approval projection.
- Real personal data, provider credentials, or external network writes.

---

## 5. Technical Approach

### Architecture

Create `src/approval-service.ts` around the replaceable `ApprovalStore` and a
minimal event-store interface. Request creation validates application input,
generates application-owned metadata behind exception boundaries, checks exact
durable duplicates, appends through the store, then emits closed minimized
evidence. Decisions load durable state, run `transitionApproval` with the
injected actor set, append only a valid first terminal transition, and record
duplicate/conflict/refusal evidence without another state mutation.

`buildTools` retains the latest produced draft only as temporary closure state.
The draft event stores lead/draft identifiers and a hash, not content. The
approval tool accepts Pi parameters but verifies exact equality against that
application state, then delegates to `ApprovalService`. Pi receives no decision
operation and the production allowlist remains exactly three tools.

`runLeadAgent` selects `APPROVAL_LOG_PATH`, creates `FileApprovalStore` and the
service, and obtains current approvals through the durable run projection.
`deriveRunStopReason` validates records and treats missing/stale/cross-run state
as `approval_failed`, never as friendly completion.

### Consistency And Recovery

- Approval JSONL is authoritative permission state; operational events are audit
  evidence and cannot grant approval.
- Store append precedes the corresponding success event.
- If the event append fails after durable state exists, the call returns visible
  `storage_failure`; a retry detects the durable record, reconstructs a missing
  minimized terminal/request event, and returns original state semantics.
- Event-read or event-write failures are redacted and never cause another
  approval transition.

### Design Patterns

- Service layer: application policy separates Pi, storage, and domain behavior.
- Dependency injection: approval/event stores, actor set, IDs, and time are
  deterministic and fault-injectable.
- Temporary working context: exact draft content is held only for the current Pi
  step until it becomes an authoritative approval record.
- Fail-closed view: durable validated projection, not prose or event shape,
  determines approval state.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/approval-service.ts` | Request/decision application policy and minimized event integration | ~420 |
| `tests/approval-service.test.ts` | Request, decision, recovery, restart, and failure integration tests | ~500 |

### Files To Modify

| File Set | Changes |
|----------|---------|
| `src/approval.ts`, `src/tools.ts`, `src/pi-agent.ts` | Export request validation, integrate exact draft/service/runtime projection |
| Tool/Pi/eval tests | Prove durable exact-state flow, fail-closed status, and frozen allowlist |
| `.env.example`, `Dockerfile`, environment/deployment docs | Configure and document `APPROVAL_LOG_PATH` |
| Week 2 Build Log, TODO, CHANGELOG | Complete Task `02` evidence and active tracking |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Pending, approved, and declined application views come only from durable projection and survive restart.
- [ ] The approval tool accepts only the latest exact application-produced draft for the exact qualified run lead.
- [ ] Only an authorized internal actor can produce one terminal transition; Pi and HTTP expose no decision operation.
- [ ] Duplicate/conflicting decisions return original state and append no second durable transition.
- [ ] Missing, malformed, stale, cross-run, corrupt, interrupted, or unavailable evidence fails visibly without implied completion.
- [ ] Every recordable request, decision, refusal, and storage failure uses minimized correlated operational evidence.

### Testing Requirements

- [ ] Contract-first tests cover request, approve, decline, duplicate, conflict, unknown actor, malformed input, restart, and both-store failures.
- [ ] Integration tests prove exact draft binding, minimized events, durable stop reason, path composition, and unchanged tool allowlist.
- [ ] `npm run verify` passes with the complete repository suite.

### Non-Functional Requirements

- [ ] No new dependency, public route, Pi decision/send tool, credential, provider, or network effect is added.
- [ ] Approval/event consistency and retry recovery are explicit and deterministic.
- [ ] Retention, redaction, export, and deletion rules prohibit real data until missing controls exist.

### Quality Gates

- [ ] ASCII/LF, strict TypeScript, formatting, security, privacy, and Behavioral Quality checks pass.

---

## 8. Implementation Notes

### Working Assumptions

- `actor_workshop_reviewer` is a synthetic internal actor ID used only for
  deterministic application tests/composition; it is not public authentication.
- The workshop has one process owner for approval and event files.
- An operational-event outage can reduce audit availability but cannot alter or
  revoke authoritative durable state.

### Conflict Resolutions

- Task `02` asks for duplicate refusal events without duplicate transitions.
  The service may append a minimized duplicate/conflict audit event, but the
  approval store remains at exactly one terminal decision line.
- The prior draft event contains full content. Session 03 replaces it with
  identifiers/hash and uses temporary application state for exact tool binding;
  the full draft persists only in the approval record required by Task `02`.
- There is no atomic transaction across two JSONL files. State-first ordering
  and retry recovery preserve permission truth without inventing rollback.

### Relevant Considerations

- [P00] **Durable approval state**: Application integration must use the store projection.
- [P00] **Event truth over prose**: Events record outcomes but cannot grant state.
- [P00] **Frozen least privilege**: Pi remains request-only with three tools.
- [P00] **Synthetic-data restriction**: Full content is confined and lifecycle-bounded.
- [P00] **Exact identity checks**: Run, lead, draft, approval, actor, and time all bind.
- [P00] **Failure precedence**: Storage or corrupt truth cannot become completion.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Treating a minimized event or assistant statement as approval truth.
- Creating an approval for a Pi-invented or stale draft.
- Repeating a terminal transition while recovering missing audit evidence.
- Returning `completed` after a required approval operation failed.

---

## 9. Testing Strategy

### Unit Tests

- Service request/decision outcomes, actor policy, event payload validation, and
  recovery helpers with injected deterministic stores.

### Integration Tests

- Real temporary approval/event files, new store/service instances, tool
  execution, terminal decision restart, and line/event counts.

### Runtime Verification

- Confirm default/container approval paths, frozen tool names, no HTTP decision
  route, no network/send capability, and exact projection-based stop reasons.

### Edge Cases

- Invalid request/decision, missing approval, unknown actor, duplicate request,
  same/opposite terminal retry, event append/read failure, approval read/write
  failure, durable state with missing event, stale/cross-run approval, damaged
  JSONL, and mismatched draft content.

---

## 10. Dependencies

### Other Sessions

- Depends on: Phase 01 Sessions 01-02 and Phase 00 qualification integration.
- Depended by: Phase 01 Sessions 04-06.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
