# PRD Phase 03: Operations and Coolify Release

**Status**: In Progress
**Sessions**: 8 (initial estimate)
**Estimated Duration**: 6-8 workshop days

**Progress**: 5/8 sessions (62.5%)

---

## Overview

Week 4 turns the validated recovery and eval baseline into an operator-facing system that can explain one run, classify actionable failures, evaluate bounded alerts, and support deterministic incident drills. It then establishes a controlled Coolify release with redacted infrastructure decisions, reproducible image identity, HTTPS health, persistent restart, off-server restore, rollback, local/deployed parity, and a usable operator handoff. The phase preserves synthetic-only data, the single-agent architecture, the exact three-tool Pi allowlist, and the prohibition on real network sends.

---

## Progress Tracker

| Session | Name | Status | Est. Tasks | Validated |
|---------|------|--------|------------|-----------|
| 01 | Observability Contract and Service Health | Complete | 18 | 2026-08-12 |
| 02 | Run Timeline Query and Redaction | Complete | 18 | 2026-08-12 |
| 03 | Alerts and Incident Runbook | Complete | 18 | 2026-08-12 |
| 04 | Incident Drills and Operational Baseline | Complete | 20 | 2026-08-12 |
| 05 | Controlled Release Security and Operator Contract | Complete | 20 | 2026-08-12 |
| 06 | Coolify Deployment Health and Persistence | Not Started | ~20 | - |
| 07 | Off-Server Restore and Rollback | Not Started | ~18 | - |
| 08 | Operator Handoff, Parity, and Release Evidence | Not Started | ~19 | - |

---

## Completed Sessions

- Session 01: Observability Contract and Service Health - completed 2026-08-12
- Session 02: Run Timeline Query and Redaction - completed 2026-08-12
- Session 03: Alerts and Incident Runbook - completed 2026-08-12
- Session 04: Incident Drills and Operational Baseline - completed 2026-08-12
- Session 05: Controlled Release Security and Operator Contract - completed 2026-08-12

---

## Upcoming Sessions

- Session 06: Coolify Deployment Health and Persistence

---

## Objectives

1. Define minimized four-layer operational evidence for service health, agent runs, model calls, and tool calls while preserving one stable `runId`.
2. Give operators a safe chronological run report, thresholded alerts, and an incident runbook whose actions match implemented recovery boundaries.
3. Prove timeout, invalid-model, restart, revoked-credential, and duplicate-request recovery without manual durable-state edits or duplicate effects.
4. Release a verified image through a controlled Coolify boundary and prove HTTPS health, persistence, off-server restore, rollback, parity, and operator handoff.

---

## Prerequisites

- Phase 02 is complete and its recovery, whole-run bounds, 18-case critical eval gate, and snapshot/restore controls remain green.
- The production Pi allowlist remains exactly `qualify_lead`, `draft_follow_up`, and `request_send_approval`; no send, approval-decision, shell, filesystem, or deployment capability is exposed to Pi.
- Only synthetic lead, draft, approval, event, result, actor, and eval data is used.
- Coolify credentials, private URLs, addresses, infrastructure identifiers, and provider secrets remain outside the repository and committed evidence.

---

## Planning Assumptions And Resolutions

### Working Assumptions

- Phase 03 requires eight sessions: Tasks `06` and `07` span new operational contracts, safe reporting, alert policy, five incident drills, release security decisions, live deployment, persistence, off-server restore, rollback, parity, and handoff evidence. Four ordered sessions per source task keep every objective within 12-25 tasks and 2-4 hours.
- The safest release baseline is controlled exposure: HTTPS `/health` may be externally reachable, but `/runs` remains private or edge-restricted unless authentication, authorization, tenant isolation, shared principal-aware rate control, and data-lifecycle gates are implemented and verified for broader exposure. The existing process-wide rate gate remains capacity protection only.
- Target-specific values are supplied through authorized Coolify and infrastructure controls during release execution: the repository can define decision categories, validation commands, and redacted evidence requirements without storing or inventing private target details.
- The operational measurements established in Sessions 04 and 08 remain reusable as a future comparison baseline, but no later-phase orchestration work enters Phase 03.

### Conflict Resolutions

- Task `07` described `/runs` as not rate-limited, while repository source, tests, deployment guidance, state evidence, and Phase 02 records show an implemented process-wide fixed-window gate. The Task `07` baseline is corrected to retain that gate as local capacity protection while leaving authentication, tenant isolation, trusted proxy identity, shared quota, and deployed edge protection open.

---

## Technical Considerations

### Architecture

- Keep service, run, model, and tool observations as distinct closed layers joined by validated correlation fields; operational evidence never becomes approval or effect authority.
- Represent duration, retry, token, cost, dependency, storage, and queue values as measured, explicitly unavailable, or not applicable rather than inventing zeros.
- Build the operator report from validated durable records and projections, with stable chronological ordering, bounded output, and default redaction of drafts, lead details, credentials, provider payloads, and private infrastructure.
- Define alert conditions as bounded numeric or categorical rules with severity, evidence, suppression behavior, and one safe operator action; harmless retries below threshold do not page.
- Keep incident recovery application-owned: supported checkpoints may resume under the same `runId`, while corrupt evidence and indeterminate effects stop for inspection or escalation.
- Treat deployment, secret rotation, restore activation, rollback, and access expansion as approval-required operator actions outside Pi.
- Keep `/runs` controlled until its caller identity, authorization, tenant, shared-rate, edge, and data-lifecycle controls match the selected exposure; do not mistake process health or a local rate limiter for those controls.
- Stop all writers before snapshot or restore, verify private off-server artifacts and checksums, activate only a validated staging restore, and preserve the last verified image for rollback.

### Technologies

- Node.js 24.15 or newer and npm 12
- Strict TypeScript with TypeBox runtime schemas and discriminated unions
- Validated append-only JSONL event, approval, fake-result, and eval stores
- Deterministic projections, recovery application, production-eval runner, and offline snapshot/restore CLI
- Docker, Coolify, HTTPS health checks, persistent `/app/data`, and deployment-owned monitoring
- `node:test`, TSX, Biome, and the repository `npm run verify` gate

### Risks

- Observability leaks protected content: use closed minimized fields, bounded rendering, synthetic fixtures, and explicit secret and personal-data scans.
- Metrics or alert labels create unbounded cardinality or noise: use finite categories, measured thresholds, suppression windows, and no raw lead, draft, URL, or error payload labels.
- Operational events are mistaken for permission: retain approval records and fake-result records as the only authorization and effect truth.
- A public route is exposed without caller controls: default to controlled access and make broader exposure fail its pre-public gate.
- External target access is unavailable or misconfigured: preserve all repository preflight and redacted evidence, and never claim live validation without direct target results.
- Snapshot, restore, or rollback causes data loss: stop writers, retain the source, restore to staging, verify exact state before activation, and preserve a known-good image and rollback path.
- Single-process files are treated as distributed-safe: keep one replica for the validated boundary or add explicit locking and shared state before horizontal execution.

### Relevant Considerations

- [P02] **Single-process persistence**: The release remains single-replica unless cross-process ownership is added and validated; reservation-only fake state never retries automatically.
- [P01] **Provider execution**: Deterministic observability and drills remain usable without a credential, while live provider measurements are recorded only when actually available.
- [P02] **Production target**: Sessions 05-08 own direct Coolify health, persistence, off-server backup, restore activation, rollback, monitoring, and operator evidence.
- [P01] **Controlled exposure only**: The release gate keeps `/runs` private or restricted until identity, authorization, tenant, shared-rate, and edge controls match exposure.
- [P02] **Synthetic-data restriction**: No Phase 03 artifact or deployment claim authorizes real customer data; lifecycle and off-server controls must pass before that boundary changes.
- [P01] **Human write gate**: Fake execution remains internal and unallowlisted, and no release work adds a real provider write.
- [P01] **Durable truth over prose or audit events**: Run reports and alerts explain state but cannot grant approval, manufacture a result, or repair damaged authority.
- [P01] **Frozen least privilege**: Observability and deployment capabilities remain operator-side and do not enter the Pi tool set.
- [P01] **Single-agent baseline**: Phase 03 measures the unchanged bounded system so Phase 04 can compare one typed handoff against real evidence.
- [P02] **Recovery scope boundary**: Drills preserve exact ordered records and stop on corrupt, ambiguous, or indeterminate evidence.
- [P02] **Tagged metric availability**: Unavailable token, cost, latency, dependency, storage, or queue measurements remain explicit and cannot masquerade as passing zero values.
- [P02] **Offline snapshots are closed recovery evidence**: Local snapshot success is only a prerequisite; Phase 03 must prove a private off-server path and controlled restore activation on the authorized target.

---

## Success Criteria

Phase complete when:

- [ ] All 8 sessions are completed and validated.
- [x] Service, run, model, and tool observations are distinct, minimized, and correlated without changing approval or effect authority.
- [x] One safe bounded command reconstructs a run chronologically by exact `runId`, exposes every terminal stop reason and actionable failure category, and redacts protected content.
- [x] Alert rules have finite triggers, severity, suppression behavior, and operator actions for repeated failures, stuck runs, dangerous permission attempts, cost spikes, unavailable dependencies, and storage or queue pressure when applicable.
- [x] The incident runbook's pause, inspect, retry, resume, compensate, escalate, and stop paths match implemented capabilities.
- [x] Five deterministic incident drills recover or refuse safely under one `runId` without manual record edits, duplicate approvals, duplicate effects, or invented provider metrics.
- [ ] The selected Coolify exposure passes its documented access, rate, body-size, secret, lifecycle, monitoring, and redaction gates without making `/runs` public by assumption.
- [ ] A verified immutable image passes external HTTPS health, controlled synthetic smoke, persistent restart, private off-server restore, reversible-failure rollback, and local/deployed parity checks.
- [ ] Another operator can follow the one-page guide and five-minute demo using redacted evidence, and measured success, failure, latency, cost, explainability, and operational baseline inputs remain available for later work.
- [ ] Week 4 Build Log evidence, `docs/TODO.md`, `docs/CHANGELOG.md`, security posture, and final repository verification match implemented reality.

---

## Dependencies

### Depends On

- Phase 02: Recovery and Evaluation Gates

### Enables

- Phase 04: Typed Handoff Decision
