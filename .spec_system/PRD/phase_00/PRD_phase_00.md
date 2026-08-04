# PRD Phase 00: Foundation

**Status**: In Progress
**Sessions**: 3 (initial estimate)
**Estimated Duration**: 3-5 workshop days

**Progress**: 2/3 sessions (67%)

---

## Overview

Week 1 establishes an evidence-backed understanding of the bounded production-agent baseline, then replaces implicit qualification judgment with a typed, deterministic, application-validated result. The phase preserves the single-agent design, synthetic-data restriction, pending-approval stop, and explicit prohibition on shell, filesystem, and external-send capabilities.

---

## Progress Tracker

| Session | Name | Status | Est. Tasks | Validated |
|---------|------|--------|------------|-----------|
| 01 | Bounded System Map | Complete | 18 | 2026-08-04 |
| 02 | Qualification Contract and Domain | Complete | 20 | 2026-08-04 |
| 03 | Qualification Tool Integration | Not Started | ~18-24 | - |

---

## Completed Sessions

- Session 01: Bounded System Map - completed 2026-08-04.
- Session 02: Qualification Contract and Domain - completed 2026-08-04.

---

## Upcoming Sessions

- Session 03: Qualification Tool Integration

---

## Objectives

1. Map and verify the current runtime, ownership, persistence, evidence, deployment, and permission boundaries.
2. Define and implement a typed deterministic qualification contract outside the model loop.
3. Integrate qualification through a focused read-only Pi tool and minimized event evidence without changing the pending-approval stop.

---

## Prerequisites

- The initialized Apex Spec System and master PRD are present.
- The bounded Node.js and TypeScript baseline remains provider-independent under `npm run verify`.
- Only synthetic lead fixtures are used while data-lifecycle controls remain open.

---

## Planning Assumptions And Resolutions

### Working Assumptions

- Task `00` is one analysis-and-evidence session: its ordered work and acceptance criteria form one coherent objective with approximately 18-22 planning and documentation tasks, and its boundary map is required context before behavior changes in task `01`.
- Task `01` is split into contract/domain and runtime-integration sessions: the task and repository conventions require schemas, permission rules, failure behavior, and event evidence before Pi integration, so this ordering is independently verifiable and keeps both sessions within 2-4 hours.

---

## Technical Considerations

### Architecture

- Keep HTTP parsing and status mapping in `src/server.ts`; keep qualification domain logic independent of HTTP requests and Pi sessions.
- Preserve one bounded Pi session and an explicit custom-tool allowlist with no Pi shell, filesystem, approval-decision, or send capability.
- Associate each qualification attempt and outcome with the existing stable `runId` and append-only event evidence.
- Treat model output, tool parameters, HTTP input, and persisted records as untrusted until application validation succeeds.

### Technologies

- Node.js 24.15 or newer and npm 12
- Strict TypeScript with NodeNext ECMAScript modules
- Pi coding agent 0.83.0 with explicitly allowlisted custom tools
- TypeBox schemas, `node:test`, TSX, and append-only JSONL events

### Risks

- Permission expansion: assert the exact production tool allowlist and keep shell, filesystem, approval-decision, and send capabilities absent.
- Invented or invalid qualification fields: separate model-proposed values from application-validated deterministic results and cover bounds and malformed input.
- Sensitive event content: persist only the identifiers, outcomes, error categories, and evidence needed to explain the action.
- Documentation drift: ground diagrams, contracts, and Build Log evidence in current source and exact verification output.
- Existing release blockers: record SC-001 through SC-005 as later-phase risks without claiming Week 1 closes them.

---

## Success Criteria

Phase complete when:

- [ ] All 3 sessions are completed and validated.
- [ ] Task `00` evidence maps all eight required boundaries and traces success, unknown-lead, and thrown-error paths.
- [ ] The Harness Decision Record, permission table, risk register, guidance map, baseline verification, and stop-boundary explanation are in the Build Log.
- [ ] Qualification has a typed schema with bounded confidence, deterministic domain behavior, explicit failure categories, and independently testable validation.
- [ ] A focused read-only qualification tool records minimized attempt and outcome evidence under the existing `runId`.
- [ ] Unknown or malformed leads cannot receive a qualification, and simulated tool failure cannot become friendly success prose.
- [ ] The final run still stops at `approval_pending`, and no external-write, shell, or filesystem capability is introduced.
- [ ] `npm run verify` and the repository production-agent verification workflow pass with evidence recorded.

---

## Dependencies

### Depends On

- The verified bounded workshop baseline and Phase 00 governance artifacts.

### Enables

- Phase 01: Durable Approval and Safe Write
