# Session Specification

**Session ID**: `phase01-session02-approval-store-and-projection`
**Phase**: 01 - Durable Approval and Safe Write
**Status**: Validated
**Created**: 2026-08-04
**Base Commit**: 068dd044f52deb419142c85fad230f1aca2f5ea1

---

## 1. Session Overview

This session implements the Session 01 `ApprovalStore` contract as an
append-only JSONL adapter and rebuilds current approval state exclusively from
validated ordered storage records. It is next because durable application
integration cannot safely exist until pending and terminal state survives a
new store instance and damaged evidence fails closed.

The adapter remains a single-process workshop implementation under the existing
configured data boundary. It is separate from operational `AgentEvent` evidence,
Pi working context, HTTP routes, and fake-send idempotency state.

---

## 2. Objectives

1. Persist request and decision records with flush-before-success semantics.
2. Rebuild exact pending, approved, and declined projections deterministically.
3. Reject duplicate, missing, malformed, truncated, corrupt, and out-of-order
   evidence without granting state.
4. Prove restart parity and storage-failure visibility through independent
   store instances and injected failure tests.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session01-approval-contract-and-transitions` - Provides closed
  records, storage evidence, pure transitions, store outcomes, and validators.

### Required Tools Or Knowledge

- Node.js filesystem APIs, append-only JSONL, `fsync`, strict TypeScript, and
  deterministic temporary-directory tests.

### Environment Requirements

- Node.js 24.15.0 and npm 12.0.2.
- `npm run verify` passes at base commit `068dd04`.
- Runtime data remains gitignored and production paths remain under `/app/data`.

---

## 4. Scope

### In Scope (MVP)

- Application can append one validated pending request or terminal decision
  through the replaceable store contract.
- Operator can rebuild exact approval state from durable records after creating
  a new store instance.
- Application receives typed failures for damaged, unordered, duplicate, or
  unavailable storage and never keeps unproved in-memory success.

### Out Of Scope (Deferred)

- Pi/tool, application-service, and operational event integration - Session 03.
- Multi-process locking, database transactions, distributed coordination, and
  public approval endpoints - outside the workshop adapter boundary.
- Fake-send execution or idempotency result storage - Sessions 04-06.

---

## 5. Technical Approach

### Architecture

Create `src/approval-store.ts` with a pure projection function and a
`FileApprovalStore` implementation. Reads require complete newline-terminated
JSONL, parse every line as unknown, validate every record, enforce monotonically
ordered record times and one legal request/decision sequence, then return a
fresh approval array.

Writes read and validate the current projection, construct one closed storage
record, append it through a file descriptor, flush with `fsync`, close the
descriptor, and re-read durable state before returning success. A writer
injection point permits deterministic failure proof without permission tricks.

### Design Patterns

- Append-only event sourcing: projection owns current state; no mutable cache.
- Read-before-write and read-after-write: durable evidence gates every success.
- Dependency injection: deterministic storage-failure tests without global I/O.
- Fail-closed parser: incomplete or invalid bytes never become permission.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/approval-store.ts` | Pure projection and file-backed store adapter | ~360 |
| `tests/approval-store.test.ts` | Persistence, restart, corruption, and failure tests | ~380 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `docs/build-log-week2.md` | File layout, restart proof, failure evidence, and assumptions | ~70 |
| `docs/TODO.md` | Record Session 02 workflow state | ~2 |
| `docs/CHANGELOG.md` | Record durable adapter and restart proof | ~4 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Independent store instances rebuild the same exact pending and terminal state.
- [ ] Request and decision appends return success only after durable re-read.
- [ ] Duplicate requests and second/conflicting decision records append no new line.
- [ ] Missing, malformed, truncated, corrupt, identity-mismatched, and
  out-of-order records return typed failures and no projection.
- [ ] Injected read/write failures return actionable storage failure and no
  unproved in-memory success.

### Testing Requirements

- [ ] Contract-first tests cover the adapter and pure projection before implementation.
- [ ] Restart, duplicate, corruption, interruption, ordering, and I/O failures pass.
- [ ] `npm run verify` passes with the complete repository suite.

### Non-Functional Requirements

- [ ] The adapter uses only Node.js standard library and adds no dependency.
- [ ] File-backed persistence stays replaceable and separate from operational events.
- [ ] No Pi, HTTP, credential, provider, or external-write capability is added.

### Quality Gates

- [ ] All files are ASCII-encoded with Unix LF line endings.
- [ ] Strict TypeScript, formatting, tests, security, and BQC checks pass.

---

## 8. Implementation Notes

### Working Assumptions

- One process owns a workshop approval file. The master PRD explicitly defers
  database/queue/Redis and measured concurrency work, so multi-process locking
  is not invented in this session.
- A missing file is an empty valid store; a non-empty file without a final LF
  is an interrupted write and fails closed.

### Conflict Resolutions

- Node append operations cannot guarantee recovery from a process/power loss
  between every byte. The adapter flushes before success and treats a partial
  trailing record as `interrupted_write`; it never truncates or auto-repairs
  evidence because recovery must remain visible.
- Repeated terminal decisions belong to the application transition service in
  Session 03. The lower-level store idempotently returns an already-identical
  terminal state without appending, and refuses conflicting terminal evidence.

### Key Considerations

- Record order, exact identity, and terminal exclusivity are projection invariants.
- No instance-level current-state cache is authoritative.

### Potential Challenges

- Partial writes: require final LF, parse every line, and re-read after append.
- I/O exceptions: canonicalize them without exposing file-system detail.

### Relevant Considerations

- [P00] **Durable approval state**: Add restart-safe exact state before integration.
- [P00] **Event truth over prose**: Projection derives only from validated ordered records.
- [P00] **Shape-only projection**: Ordering and cross-record identity are part of validation.
- [P00] **Failure precedence**: Damaged storage overrides any plausible state.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Returning success before bytes are flushed and revalidated.
- Treating partial/corrupt evidence as an empty or last-known-good store.
- Appending duplicate or conflicting records during retries or restart.

---

## 9. Testing Strategy

### Unit Tests

- Project validated request/decision arrays and reject sequence/identity faults.

### Integration Tests

- Use temporary JSONL paths and independent `FileApprovalStore` instances for
  pending, approved, declined, repeated, and failure scenarios.

### Runtime Verification

- Inspect line counts and exact state after each append and restart.

### Edge Cases

- Missing file, empty file, invalid JSON, missing LF, malformed schema, duplicate
  IDs, decreasing time, decision before request, cross-run decision, injected
  read/write exception, and already-terminal append.

---

## 10. Dependencies

### Other Sessions

- Depends on: Phase 01 Session 01.
- Depended by: Phase 01 Sessions 03-06.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
