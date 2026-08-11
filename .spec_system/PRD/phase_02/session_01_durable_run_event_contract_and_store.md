# Session 01: Durable Run Event Contract and Store

**Session ID**: `phase02-session01-durable-run-event-contract-and-store`
**Status**: Complete
**Source Task**: `04`
**Tasks**: 18
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-11

---

## Objective

Define and implement the closed durable run-event contract and hardened append-only store independently from run projection, lifecycle bounds, and resume orchestration.

---

## Scope

### In Scope (MVP)

- Define a versioned closed event envelope for event identity, `runId`, timestamp, event type, and minimized domain payload.
- Define closed payload variants for run, model or Pi, tool, approval-observation, recovery, and terminal evidence required by Task `04`.
- Reserve validated fields for actor, action, tool, arguments, result or error, approval state, stop reason, application version, model or prompt version, duration, retry count, tokens, and cost when applicable.
- Distinguish unavailable optional metadata from numeric zero and reject undocumented extra fields.
- Define a replaceable event-store interface and structured storage and record failure categories before file behavior.
- Harden the JSONL adapter with private-file creation, complete LF-terminated records, synchronous durable flush, close, and exact re-read before success.
- Runtime-validate every appended and loaded envelope, including identity, timestamp, type and payload agreement, and minimized-field constraints.
- Reject malformed, truncated, duplicate-identity, and invalid owned-namespace records without returning a partial successful read.
- Preserve valid unrelated domain events in the shared log without weakening owned-namespace validation.
- Add deterministic contract, append, restart, corruption, truncation, duplicate, ordering-input, and injected I/O failure tests.
- Document the event schema, storage boundary, compatibility decision, and minimized examples in the Week 3 Build Log.

### Out of Scope

- Run-state projection, context reconstruction, application deadline, maximum step count, or resume execution.
- Changing approval records or fake-result records into operational-event authority.
- Pi tool allowlist changes, public endpoints, provider credentials, or real data.

---

## Prerequisites

- [x] Phase 01 is complete and its approval and fake-result stores provide proven durability patterns to reuse deliberately.
- [x] Existing event producers and consumers are inventoried so the closed contract preserves required evidence without retaining unnecessary content.

---

## Deliverables

1. Closed versioned event envelope, domain payload unions, validators, and replaceable store contract.
2. Hardened file-backed JSONL event adapter with visible damaged-record and storage failures.
3. Deterministic durability, restart, namespace, corruption, and minimization tests plus Week 3 event-schema evidence.

---

## Success Criteria

- [x] Every persisted event is runtime-valid, minimized, LF-terminated, privately stored, flushed, and re-read before append success is reported.
- [x] Malformed, truncated, duplicate, invalid-namespace, or structurally out-of-order input fails visibly and cannot yield a partial trusted run history.
- [x] Optional version, model, duration, retry, token, and cost values distinguish unavailable from zero.
- [x] Existing approval and fake-result authority remains unchanged and no capability boundary is broadened.
- [x] Event contract and store tests pass without Pi, HTTP, provider credentials, or real customer data.
