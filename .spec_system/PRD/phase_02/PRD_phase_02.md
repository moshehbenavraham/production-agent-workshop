# PRD Phase 02: Recovery and Evaluation Gates

**Status**: In Progress
**Sessions**: 7 (initial estimate)
**Estimated Duration**: 5-7 workshop days

**Progress**: 1/7 sessions (14%)

---

## Overview

Week 3 turns the current lightweight event stream into validated durable run evidence, deterministic recovery projections, bounded run execution, and safe replay and resume behavior. It then replaces the five-case boolean eval runner with a representative synthetic golden set whose critical safety failures block the documented deployment path. The phase preserves the single-agent design, exact three-tool Pi allowlist, synthetic-only data boundary, application-owned approval and idempotency authority, and prohibition on real network writes.

---

## Progress Tracker

| Session | Name | Status | Est. Tasks | Validated |
|---------|------|--------|------------|-----------|
| 01 | Durable Run Event Contract and Store | Complete | 18 | 2026-08-11 |
| 02 | Run Projection and Corruption Refusal | Not Started | ~18 | - |
| 03 | Bounded Run Lifecycle | Not Started | ~19 | - |
| 04 | Replay and Resume Integration | Not Started | ~22 | - |
| 05 | Production Eval Contract and Golden Set | Not Started | ~18 | - |
| 06 | Critical Eval Gate and Scorecard | Not Started | ~20 | - |
| 07 | Boundary Regression Exercises and Evidence | Not Started | ~16 | - |

---

## Completed Sessions

- `phase02-session01-durable-run-event-contract-and-store` - completed and validated 2026-08-11.

---

## Upcoming Sessions

- Session 02: Run Projection and Corruption Refusal

---

## Objectives

1. Define and persist closed, versioned, minimized run events that retain the exact durable facts required for recovery while rejecting damaged evidence.
2. Rebuild deterministic run projections, enforce whole-run deadline and step bounds, and safely resume three required interruption points without duplicate approvals or fake effects.
3. Gate the documented deployment path with a reproducible 10-20 case synthetic eval suite, deterministic critical assertions, compact scorecards, and reverted red/fix/green exercises.

---

## Prerequisites

- Phase 01 is complete and its qualification, approval, fake-result, permission, and idempotency controls remain green.
- Approval records and fake-result records remain available as the authoritative sources for authorization and effect identity.
- The production Pi allowlist remains exactly `qualify_lead`, `draft_follow_up`, and `request_send_approval`.
- Only synthetic lead, draft, approval, result, actor, and event data is used.

---

## Planning Assumptions And Resolutions

### Working Assumptions

- Phase 02 requires seven sessions: the current event store accepts arbitrary JSON and the current eval runner contains only five boolean cases, while Tasks `04` and `05` require new closed contracts, durable validation, projections, terminal bounds, three resume points, a 10-20 case inventory, deployment-blocking scoring, and three critical red/fix/green traces. Four recovery sessions and three eval sessions keep each objective within 12-25 tasks and 2-4 hours.
- The critical golden set remains provider-independent by default: the repository has no committed provider credential and its critical safety gates must be deterministic, so model, token, and cost values are recorded as unavailable when the injected case cannot supply them. Optional model grading remains separate and cannot override a deterministic critical failure.
- Recovery remains a controlled single-process workshop capability: current JSONL approval, event, and result stores have no transaction or distributed lock, so this phase may prove restart and replay behavior without exposing new HTTP, Pi, network-write, or distributed execution capability.

### Conflict Resolutions

- Task `04` calls the append-only event log the source of truth for run and approval recovery, while Phase 01 established approval records and fake-result records as the only authorization and idempotency truth. Phase 02 uses events as the authoritative source for run lifecycle and observable recovery checkpoints, but never grants approval or infers an effect from an operational event; resume cross-checks exact durable approval and result records before continuing.
- Task `05` names production eval gates, while the master PRD defers deployed provider and Coolify evidence to Tasks `06` and `07`. Phase 02 creates a repository-level deployment gate against deterministic injected boundaries and explicitly unavailable provider metrics; it does not claim deployed production behavior, real credentials, or external provider coverage.

---

## Technical Considerations

### Architecture

- Replace the open `AgentEvent` shape with closed versioned envelopes and domain payload variants while keeping payloads minimized and runtime validated.
- Harden event persistence behind a replaceable interface using the established private-file, complete-line, flush, re-read, and fail-closed patterns.
- Derive run lifecycle, latest safe checkpoint, terminal status, stop reason, step count, and replaceable working context from ordered durable evidence.
- Keep run projection facts separate from approval authorization and fake-result idempotency; cross-check the three stores before any resume decision.
- Add application-owned whole-run deadline and maximum-step enforcement with one terminal outcome and late-settlement suppression.
- Resume the same `runId` from the latest safe checkpoint and never automatically retry a reservation-only or otherwise indeterminate fake effect.
- Define eval cases, expected event sequences, results, traces, scores, versions, latency, token, and cost fields as closed data before expanding the runner.
- Keep deterministic critical gates separate from optional quality scoring, and make any critical failure exit non-zero regardless of aggregate quality.

### Technologies

- Node.js 24.15 or newer and npm 12
- Strict TypeScript with TypeBox runtime schemas and discriminated unions
- Replaceable append-only JSONL event, approval, and fake-result stores
- Pi Coding Agent SDK 0.83.0 with an in-memory working session
- `node:test`, TSX, Biome, and the deterministic `npm run eval` runner

### Risks

- Operational events accidentally grant permission: keep approval and result authorization in their existing durable stores and require exact cross-store identity checks before resume.
- Corrupt or reordered evidence yields a plausible projection: validate closed variants, identity, timestamps, ordering, uniqueness, and terminal invariants before returning state.
- A replay duplicates an approval or effect: reuse the original `runId`, approval identity, and idempotency result, and stop on indeterminate reservations.
- Deadline or step-limit races create two outcomes: application code owns cancellation and persists one terminal result while suppressing late settlement.
- Golden-set averages hide a safety failure: classify critical dimensions before execution and return non-zero for any critical miss.
- Deliberate break exercises leak into the final tree: constrain each red/fix/green exercise, verify the repair immediately, and review the final diff and full suite.
- Missing provider usage looks like zero cost: represent unavailable model, token, latency, and cost values explicitly rather than coercing them to zero.

### Relevant Considerations

- [P01] **Whole-run recovery**: Sessions 01-04 add durable run projection, bounds, replay, and resume without weakening existing approval or fake-result truth.
- [P01] **Single-process persistence**: Recovery tests remain single-process and reservation-only fake state always stops for inspection rather than retrying automatically.
- [P01] **Provider execution**: Sessions 05-07 make deterministic gates independent of credentials and preserve explicit unavailable provider fields.
- [P01] **Whole-run bounds**: Session 03 adds the missing application-owned run deadline and maximum step count.
- [P01] **Durable truth over prose or audit events**: Run events own lifecycle recovery, while exact approval and result records continue to own permission and effects.
- [P01] **Frozen least privilege**: No recovery or eval session expands the production Pi allowlist or adds a network-writing tool.
- [P01] **Single-agent baseline**: Recovery and eval evidence measures the existing bounded agent without adding orchestration.
- [P01] **Recovery scope boundary**: Corrupt, incomplete, and indeterminate evidence remains visible and cannot be silently repaired into success.
- [P01] **Application-owned deadlines**: Run bounds follow the proven abort-once, persist-once, and late-result suppression pattern.
- [P01] **Provider-independent vertical slices**: Required restart, replay, permission, event-order, and eval-gate proofs run without provider credentials.

---

## Success Criteria

Phase complete when:

- [ ] All 7 sessions are completed and validated.
- [ ] A closed versioned event envelope and hardened append-only store preserve minimized recovery facts and reject malformed, truncated, duplicated, cross-run, missing, or out-of-order evidence.
- [ ] A deterministic projection rebuilds the same run lifecycle and safe checkpoint from durable events while authorization still comes only from exact approval and fake-result records.
- [ ] Every required tool and run attempt and outcome is correlated, and whole-run deadline and maximum-step exits persist one visible terminal stop reason.
- [ ] Restart tests resume after qualification, draft creation, and approval request under the same `runId` with zero duplicate approvals or fake effects and no manual durable-record edits.
- [ ] The recovery decision table and event lifecycle rules define retry, resume, compensate, escalate, stop, retention, redaction, and deletion behavior for the synthetic scope.
- [ ] A 10-20 case golden set covers happy, ambiguous, malformed, unknown, timeout, permission, credential, downstream, duplicate, restart, invalid-model, adversarial, approval-bypass, false-completion, escalation, and stop behavior.
- [ ] Deterministic critical assertions score schemas, state, tool arguments, event order, permissions, idempotency, recovery, and stop reasons; any critical failure exits non-zero and identifies expected versus observed evidence.
- [ ] Lead-fabrication, false-send, and approval-bypass red/fix/green exercises are reverted and protected by regression cases.
- [ ] Week 3 Build Log evidence, `docs/TODO.md`, and `docs/CHANGELOG.md` match the implemented state, and final repository verification and security review pass.

---

## Dependencies

### Depends On

- Phase 01: Durable Approval and Safe Write

### Enables

- Phase 03: Operations and Coolify Release
