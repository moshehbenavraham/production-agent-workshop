# Session Specification

**Session ID**: `phase02-session01-durable-run-event-contract-and-store`
**Phase**: 02 - Recovery and Evaluation Gates
**Status**: Not Started
**Created**: 2026-08-11
**Base Commit**: 5c5de157c86fc8267d0b3db60f9039a47bcf53ac

---

## 1. Session Overview

This session replaces the permissive `AgentEvent` record and raw JSONL reader
with closed, versioned, runtime-validated run-event contracts and a hardened
append-only store. It is the first executable Phase 02 session because every
projection, lifecycle bound, resume decision, and production eval depends on
durable evidence whose identity, shape, order, and failure behavior are trusted.

The work migrates current run, Pi, qualification, draft, approval, and internal
fake-send event producers without changing their permissions or making fake
execution reachable. It reuses the private-file, flush, close, and re-read
patterns proven by Phase 01 while leaving semantic run projection, whole-run
bounds, and recovery orchestration to Sessions 02-04.

---

## 2. Objectives

1. Define closed versioned event envelopes and minimized payload variants for
   every currently owned event namespace.
2. Define actionable event storage and record failures behind a replaceable
   event-store interface.
3. Persist complete private JSONL records durably and validate the entire file
   before returning trusted run history.
4. Migrate all current event producers and consumers without broadening Pi,
   HTTP, approval, fake-send, data, or network capabilities.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase01-session06-safe-write-integration-and-evidence` - Provides
  durable approval and fake-result truth, exact identity checks, minimized
  operational evidence, and proven file-store durability patterns.

### Required Tools Or Knowledge

- Node.js 24.15 or newer, npm 12.0.2, strict TypeScript, TypeBox, and
  `node:test` through TSX.
- Task `04`, the Phase 02 PRD, repository governance, current event producers,
  and the Phase 01 store contracts and failure semantics.

### Environment Requirements

- `npm run verify` passes before implementation begins.
- `.spec_system/scripts/check-prereqs.sh --json --env` reports pass.
- Only synthetic fixtures are used; no provider credential or production log
  is read, printed, or committed.

---

## 4. Scope

### In Scope (MVP)

- Operator can trust one closed event envelope carrying stable identity,
  `runId`, timestamp, type, minimized payload, schema version, and explicit
  optional operational metadata.
- Application can validate exact run, Pi, qualification, draft, approval, and
  fake-send payload variants before append and after restart.
- Application can distinguish unavailable model, prompt, duration, retry,
  token, and cost metadata from measured zero values.
- Store consumers receive either one complete validated ordered run history or
  a typed actionable failure; partial trusted history is never returned.
- File persistence uses private creation, complete LF-terminated records,
  flush, close, and full-file re-read before append success.
- Shared event logs accept valid unrelated domains while malformed records that
  claim an owned namespace fail closed.

### Out Of Scope (Deferred)

- Run-state projection and checkpoint derivation - Session 02 owns semantics.
- Whole-run deadline, step count, and complete attempt/outcome instrumentation -
  Session 03 owns bounded lifecycle integration.
- Replay, resume, recovery actions, and retention policy completion - Session 04
  owns the Task `04` vertical slice.
- Golden-set eval contracts and deployment gates - Sessions 05-07 own Task `05`.
- Public endpoints, distributed locking, real data, provider credentials, and
  real network effects - Later phases own exposure and deployment controls.

---

## 5. Technical Approach

### Architecture

Create `src/run-event.ts` as the Pi-independent owner of event envelope,
metadata, payload, validation, and failure contracts. Closed TypeBox shapes
cover fixed application domains; semantic guards bind type and payload
discriminants, validate identifiers and timestamps, and constrain optional
usage metadata. Pi lifecycle events use a bounded normalized payload rather
than retaining arbitrary SDK objects.

Refactor `src/event-store.ts` behind a replaceable `RunEventStore` contract.
The file adapter validates the path before creating directories, opens the
event file privately, validates the complete existing LF-terminated log,
appends one validated record, flushes and closes it, then re-reads and verifies
the exact appended event. Reads validate every record before filtering by
`runId`, so unrelated corrupt evidence cannot be silently skipped.

Migrate existing event producers to construct the closed variants at their
application boundaries. Approval records and fake-result records remain the
only authorization and idempotency truth; operational events remain minimized
evidence and cannot grant permission.

### Design Patterns

- Schema-first contract: static and runtime event shapes share one definition.
- Closed variants plus semantic guards: discriminants, identity, time, and
  metadata consistency are checked beyond shape validation.
- Replaceable persistence boundary: services depend on append/read outcomes,
  not file operations.
- Flush, re-read, then succeed: durable evidence is confirmed before callers
  observe success.
- Domain-aware shared log: unrelated valid domains coexist, while malformed
  owned namespaces fail visibly.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/run-event.ts` | Closed event, payload, metadata, failure, and store contracts | ~480 |
| `tests/run-event.test.ts` | Contract, semantic, namespace, minimization, and failure tests | ~300 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `src/event-store.ts` | Hardened private durable JSONL adapter and validated reads | ~280 |
| `src/pi-agent.ts` | Closed run and normalized Pi lifecycle event production | ~35 |
| `src/tools.ts` | Closed qualification and draft event production and reads | ~30 |
| `src/approval-service.ts` | Closed approval operational event boundary | ~25 |
| `src/fake-send-service.ts` | Closed fake-send operational event boundary | ~25 |
| `tests/event-store.test.ts` | Durability, restart, corruption, and injected I/O coverage | ~300 |
| `tests/pi-agent.test.ts` | Run-event contract and permission regression coverage | ~25 |
| `tests/qualification-tool.test.ts` | Qualification/draft event regression coverage | ~25 |
| `tests/approval-service.test.ts` | Approval shared-log contract regressions | ~20 |
| `tests/fake-send-service.test.ts` | Fake-send shared-log contract regressions | ~20 |
| `docs/build-log-week3.md` | Event schema, storage contract, and minimized examples | ~80 |
| `docs/TODO.md` | Record Session 01 implementation progress | ~3 |
| `docs/CHANGELOG.md` | Record the closed durable event boundary | ~6 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Every appended event has a closed versioned envelope, valid identity,
  valid timestamp, matching type/payload discriminants, and minimized data.
- [ ] Optional operational metadata distinguishes unavailable values from zero
  and rejects invalid, negative, or undocumented values.
- [ ] The file adapter returns success only after one complete private record is
  flushed, closed, re-read, and matched exactly.
- [ ] Missing files produce an empty valid history, while malformed, truncated,
  duplicate-ID, invalid-namespace, or invalid-order evidence fails visibly.
- [ ] Existing run, qualification, draft, approval, and fake-send producers and
  consumers use the closed contract without changing runtime permissions.

### Testing Requirements

- [ ] Contract-first tests cover every public variant and semantic guard.
- [ ] Store tests cover append, restart, private mode, corruption, truncation,
  duplicate identity, unrelated domains, no-op writes, and injected I/O failure.
- [ ] Existing focused integration suites and `npm run verify` pass.

### Non-Functional Requirements

- [ ] Persisted operational evidence excludes credentials, full drafts,
  unnecessary lead content, raw dependency details, and arbitrary SDK objects.
- [ ] The production Pi allowlist remains exactly three tools and internal fake
  execution remains unreachable from Pi and HTTP.
- [ ] The adapter is synchronous and deterministic within the current
  single-process boundary; no distributed-safety claim is introduced.

### Quality Gates

- [ ] All files are ASCII-encoded with Unix LF line endings.
- [ ] Code follows strict TypeScript, ESM, naming, and testing conventions.
- [ ] Behavioral quality trust, persistence, failure, and contract checks pass.

---

## 8. Implementation Notes

### Working Assumptions

- The current `at` timestamp field remains the public timestamp name: persisted
  events and multiple consumers already use it, while Task `04` requires the
  semantic value rather than a rename. A schema version can make new strictness
  explicit without gratuitous compatibility churn.
- Complete file order is the structural event order for this single-process
  JSONL adapter. Session 02 owns domain-semantic ordering and checkpoint rules,
  so this session validates record integrity and non-decreasing run timestamps
  without inventing recovery state.
- Existing Phase 01 approval and fake-send payload validators remain reusable
  inside the event union. Their dedicated records retain authority, so event
  validation can become stricter without changing permission semantics.

### Conflict Resolutions

- Task `04` describes events as recovery truth, while Phase 01 prohibits audit
  events from granting approval or proving an effect. This session makes events
  authoritative for recorded run history only; approval and fake-result stores
  remain mandatory for authorization and idempotency.

### Key Considerations

- Validate paths, metadata providers, records, and append input before creating
  files or directories.
- A shared log cannot ignore an invalid record merely because a later filter
  requests another `runId`.
- Caught dependency errors and raw SDK events are untrusted and must be
  canonicalized before persistence.

### Potential Challenges

- Existing test doubles return permissive event objects: migrate them to the
  exact contract and preserve malicious-boundary tests separately.
- Approval and fake-send event discriminants live in other domain modules:
  compose validators without introducing circular runtime imports.
- Failure after append but before re-read is indeterminate: return an actionable
  storage failure and never manufacture an in-memory success.

### Relevant Considerations

- [P01] **Whole-run recovery**: Establish trusted evidence before projection or
  resume behavior exists.
- [P01] **Single-process persistence**: Preserve visible non-transactional and
  indeterminate semantics without claiming distributed safety.
- [P01] **Durable truth over prose or audit events**: Events own run history but
  cannot authorize an approval or fake effect.
- [P01] **Closed variants plus semantic guards**: Validate identity, time,
  namespace, and discriminant agreement after TypeBox shape checks.
- [P01] **Flush, re-read, then succeed**: Apply the proven Phase 01 durability
  pattern to operational events.
- [P01] **Domain-aware shared logs**: Preserve unrelated valid evidence while
  failing closed on malformed owned domains.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- Permissive or mismatched event records becoming trusted recovery evidence.
- A partial, corrupt, or failed append being reported as durable success.
- Added event fields retaining secrets, full drafts, or arbitrary dependency
  content that later projections or eval artifacts expose.

---

## 9. Testing Strategy

### Unit Tests

- Compile every schema and reject extra properties, invalid identifiers,
  timestamps, namespaces, discriminants, negative metrics, and impossible usage.
- Exercise store append/read outcomes with deterministic IDs, clocks, readers,
  writers, and metadata providers.

### Integration Tests

- Run qualification, draft, approval, and fake-send service paths against the
  shared hardened event store and verify exact minimized persisted variants.
- Confirm new store instances rebuild identical complete run histories.

### Runtime Verification

- Run focused event and affected service tests, `npm run verify`, coverage,
  dependency audit, permission/data scans, and the production-agent verifier.

### Edge Cases

- Missing file, empty file, blank line, missing final LF, malformed JSON,
  schema-valid wrong discriminant, duplicate `eventId`, decreasing run time,
  cross-run data, no-op writer, close failure, re-read mismatch, arbitrary thrown
  values, unavailable metrics, and valid unrelated domains.

---

## 10. Dependencies

### Other Sessions

- Depends on: `phase01-session06-safe-write-integration-and-evidence`.
- Depended by: `phase02-session02-run-projection-and-corruption-refusal` and all
  later Phase 02 sessions.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
