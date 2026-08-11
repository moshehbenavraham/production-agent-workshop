# Session Specification

**Session ID**: `phase01-session05-idempotent-fake-send-execution`
**Phase**: 01 - Durable Approval and Safe Write
**Status**: Validated
**Created**: 2026-08-04
**Base Commit**: 7b1d43af66ac28c38b3ff3a482edf5e0835354f3

---

## 1. Session Overview

This session implements the reservation-first file store and application
service behind Session 04's approved-action boundary. A schema-valid exact
approved action may invoke one injected deterministic fake adapter at most once.
The first terminal result is durable and replayable across service instances;
an interrupted reservation remains visibly indeterminate and never triggers an
automatic second effect.

The fake adapter is in-process and performs no network write. Pi, HTTP, public
permissions, provider credentials, and real data remain unchanged.

## 2. Objectives

1. Implement closed JSONL reservation/result projection and durable claim/
   completion behavior with restart, corruption, and injected-I/O proof.
2. Orchestrate authorization, claim, minimized attempt evidence, one bounded
   fake adapter invocation, durable terminal result, and minimized terminal
   evidence in an application service.
3. Return exact original terminal results for duplicates across new service
   instances and refuse incomplete reservations without another effect.
4. Make timeout, rejection, downstream, storage, permission, identity, and
   late-completion behavior deterministic, typed, redacted, and documented.

## 3. Prerequisites

- [x] Session 04 provides exact durable authorization, immutable commands,
  stable keys, adapter/result/event contracts, and zero-effect denial tests.
- [x] Durable approvals survive restart and expose exact immutable action,
  target, content, hash, and decision linkage.
- [x] Pushed base `7b1d43a` passes 108/108 tests, 5/5 evals, and dependency audit.

## 4. Scope

### In Scope

- `FileFakeSendResultStore` using one LF-terminated JSON record per reservation
  or terminal result, mode `0600`, flush-before-success, and re-read proof.
- Ordered pure projection that rejects corrupt, truncated, duplicate,
  result-before-reservation, identity-mismatched, or conflicting evidence.
- Atomic-within-one-process synchronous durable claim before any async adapter
  invocation; multi-process locking remains explicitly unsupported.
- Application-owned reservation/result IDs and millisecond clock dependencies
  with runtime and exception validation.
- `FakeSendService.execute` with authorization, exact store-outcome narrowing,
  state/event ordering, 1,000 ms deadline, abort signal, late-result suppression,
  terminal persistence, and missing-terminal-event recovery.
- Deterministic fake adapter implementation plus injected spies/failures.
- Closed execution outcome contract distinguishing executed, duplicate,
  in-progress/indeterminate, authorization, storage, accepted, rejected, timed-
  out, and downstream-failure behavior.
- Minimized attempted, terminal, duplicate, permission-denied, and storage-
  failure evidence correlated through the outer `runId` and inner approval/key.
- Restart, concurrent same-process duplicate, event outage, store outage, timeout,
  late completion, malformed dependency, and no-second-effect tests.
- Week 2 Build Log idempotency proof, test matrix, event samples, failure/
  escalation guidance, and explicit no-human-review/no-allowlist status.

### Out Of Scope

- Pi tool registration, production allowlist changes, public HTTP execution,
  actor authentication, tenant isolation, or real customer data.
- Provider selection, credentials, DNS/socket/network writes, real messaging,
  automatic compensation, or production rollback.
- Distributed/multi-process locking, reservation lease expiry, automatic retry
  of indeterminate reservations, whole-run replay, or operator repair tooling.
- Final internal integration harness and consolidated Phase 01 evidence -
  Session 06.

## 5. Technical Approach

### Durable Store

Create `src/fake-send-store.ts`. Every operation reloads and validates complete
storage records, projects reservations/results in recorded order, and uses no
authoritative in-memory cache. `claim` writes one reservation only when the key
is absent; an existing exact completed projection returns `duplicate`, and an
existing exact reservation returns `execution_in_progress`. Same-key identity
conflicts fail closed. `complete` requires one exact reservation, appends one
terminal result, then re-reads the exact completed projection. Repeated exact
completion is idempotent; different completion is a conflict.

### Execution Service

Create `src/fake-send-service.ts`. Ordering is:

1. authorize exact durable approved state;
2. create and durably claim a reservation;
3. append minimized `fake_send.attempted` evidence;
4. invoke the injected fake adapter once under the application deadline;
5. durably complete accepted/rejected/timed-out/downstream result;
6. append the matching minimized terminal event.

If an attempt event cannot be recorded, stop with the reservation and invoke no
adapter. If terminal persistence fails after an adapter invocation, retain the
reservation, report storage failure, and never retry automatically. If terminal
event emission fails after result persistence, a duplicate retry reconstructs
the missing event from the authoritative result before returning the original.

### Timing And Late Completion

The application owns the timer and abort controller. Timeout creates one durable
`timed_out` result, aborts the adapter signal, and ignores later settlement. A
late adapter cannot append another result/event. Started/completed timestamps
and integer duration come from an injected millisecond clock and must satisfy
the Session 04 semantic result guard.

### Concurrency Boundary

Claims are synchronous file operations, so concurrent async calls in one Node
process serialize before either adapter invocation. Multiple OS processes are
not safe and remain prohibited/documented; no false distributed-lock guarantee
is made.

## 6. Deliverables

| File | Purpose |
|------|---------|
| `src/fake-send-store.ts` | JSONL load/projection and durable claim/complete/read adapter |
| `src/fake-send-service.ts` | Authorized reservation-first execution, timeout, events, and recovery |
| `tests/fake-send-store.test.ts` | Restart, duplicate, corruption, ordering, interruption, and I/O tests |
| `tests/fake-send-service.test.ts` | First/duplicate/concurrent execution, failures, timeout, late result, and recovery tests |
| `src/fake-send-result.ts`, `tests/fake-send.test.ts` | Execution outcome and contract extensions |
| `docs/build-log-week2.md`, `docs/TODO.md`, `docs/CHANGELOG.md` | Task `03` implementation evidence and workflow tracking |

## 7. Success Criteria

### Functional

- [ ] One exact approved action invokes the fake adapter no more than once.
- [ ] Exact first terminal results survive restart and are returned for
  duplicates with no second adapter invocation.
- [ ] Concurrent same-process calls yield one claim/effect and one safe
  in-progress or duplicate response.
- [ ] Pending, declined, missing, malformed, mismatched, unauthorized, corrupt,
  or unavailable state invokes no adapter.
- [ ] Timeout, rejection, downstream, attempt-event, completion-store, terminal-
  event, and late-settlement paths remain visible without false success.
- [ ] Attempt and outcome evidence is minimized, correlated, and recoverable
  from authoritative terminal state where safe.

### Testing And Quality

- [ ] Contract-first RED tests precede each adapter/service implementation.
- [ ] File restart, line count, final-LF, ordering, duplicate/conflict,
  interruption, arbitrary dependency, and same-process concurrency pass.
- [ ] No dependency, Pi/HTTP capability, provider credential, subprocess,
  network effect, full-content event, real data, or human-review claim is added.
- [ ] Formatting, strict types, full tests/evals, audit, ASCII/LF, security,
  privacy, persistence, and Behavioral Quality checks pass.

## 8. Assumptions And Conflict Resolutions

- "At most once" is guaranteed for the documented single Node process through
  synchronous durable claim. It is not a distributed guarantee.
- A completed result can satisfy duplicate replay. A reservation without a
  result is indeterminate: the effect may or may not have happened, so automatic
  retry would violate safety and remains forbidden.
- A timeout is terminal for the idempotency key even if a dependency ignores
  abort and settles later. This favors no duplicate effect over eventual success.
- Operational events are not transactional with result storage. State-first
  terminal ordering plus retry recovery preserves truth; event evidence never
  authorizes execution.
- The HITL review gate remains untriggered because Session 05 adds no Pi tool or
  allowlist entry. Session 06 records the explicit final decision.

## 9. Next Step

Run `implement` for Session 05. Do not start Session 06 while this session is
active.
