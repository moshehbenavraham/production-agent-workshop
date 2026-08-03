# production-agent-workshop - Product Requirements Document

## Overview

Production Agent Workshop is a runnable reference and guided implementation path for a bounded agency lead-operations agent. Given an exact `leadId`, one Pi agent session reads an approved lead source, determines whether the available information is sufficient, drafts a relevant first follow-up, creates a human approval request, and stops. Codex owns repository changes, Pi owns the model loop, the application owns permissions and durable evidence, and Coolify owns the deployment boundary.

The product prioritizes clarity, observability, and safe recovery over autonomy. The current reference uses synthetic leads and never sends a message. Its production-hardening path adds explicit qualification, durable approvals, a fake idempotent external-write boundary, event-based recovery, deployment-blocking evals, operator observability, and a controlled Coolify release before any real provider integration is considered.

## Goals

1. Produce a grounded qualification and useful first follow-up for a known lead while stopping clearly for invalid, unknown, or insufficient lead data.
2. Preserve a human approval boundary so no external write occurs, or is reported as complete, without an authorized decision.
3. Keep permissions, validation, state transitions, and side-effect controls deterministic and independently testable outside the model.
4. Make every run explainable and safely recoverable through a stable `runId`, append-only events, explicit stop reasons, and replay-safe state.
5. Block unsafe releases with reproducible tests and evals that score tool use, permissions, events, recovery, and final output.
6. Give operators a secure, observable, restart-safe Coolify deployment with documented incident response, restore, and rollback procedures.

## Non-Goals

- Provide a general-purpose autonomous agent or broad CRM automation platform.
- Let the runtime use general shell, filesystem, deployment, or unrestricted CRM tools.
- Treat prompt wording or model claims as authorization for an external write.
- Invent leads, research facts, qualification evidence, approval decisions, or completed actions.
- Send a real message through a network provider during Phase 00.
- Add multi-agent orchestration before the bounded single-agent baseline is reliable and measured.
- Use raw conversation transcripts as the durable source of truth for run or approval state.
- Process real customer data before retention, redaction, export, deletion, access, and backup rules are defined.

## Users and Use Cases

### Primary Users

- **Agency operations operator**: Submits known leads, reviews qualifications and drafts, and investigates run outcomes.
- **Human approver**: Reviews the exact proposed action and target, then approves or declines it through an application-controlled boundary.
- **Workshop participant**: Extends the reference agent through ordered, evidence-backed engineering tasks without weakening its safety constraints.
- **Maintainer and release operator**: Verifies, deploys, observes, recovers, restores, and rolls back the service.

### Key Use Cases

1. An operations operator submits an exact known `leadId` and receives a grounded qualification, relevant draft, pending approval, `runId`, and visible stop reason.
2. An operations operator submits malformed or unknown lead input and receives a clear refusal or not-found result without fabricated data.
3. A human approver makes one durable approve or decline decision that survives restart and cannot be contradicted by a repeated request.
4. An authorized operator exercises a fake external-write boundary and observes an accepted, duplicate, rejected, timed-out, or failed result without duplicate effects.
5. A maintainer replays or resumes an interrupted run from durable events without duplicating an approval or external effect.
6. A maintainer runs deterministic verification and deployment gates against happy, ambiguous, failure, adversarial, and escalation cases.
7. A release operator traces one `runId`, practices incident recovery, deploys through Coolify, verifies persistence, restores a backup, and rolls back a reversible failure.

## Requirements

### MVP Requirements

#### Lead Intake and Qualification

- Operations operator can submit one exact `leadId` through a validated run interface.
- Agent can inspect only the requested lead from an approved source without inventing a replacement.
- Operations operator can receive a typed qualification containing fit, bounded confidence, reasons, and missing information for a known lead.
- Operations operator can receive an actionable validation, not-found, or insufficient-information outcome without a false success response.

#### Drafting, Approval, and External-Write Safety

- Agent can create one relevant first-follow-up draft grounded in validated lead data.
- Agent can create a pending human approval request for the exact draft, action, and target, then stop without sending.
- Human approver can approve or decline a pending request through a durable application-owned transition with identifiable actor evidence.
- Human approver can repeat or conflict with a prior decision only to receive the original terminal state without a duplicate transition.
- Authorized operator can invoke a fake external-write action only from immutable approved application state and receive the original result on retry.
- Operations operator can distinguish accepted, duplicate, rejected, timed-out, permission-denied, and downstream-failure outcomes without a false completion claim.

#### Evidence and Recovery

- Operator can correlate every request, model lifecycle event, tool attempt, tool outcome, approval transition, and terminal outcome with one `runId`.
- Operator can rebuild current run and approval state from append-only durable records rather than conversation history.
- Operator can resume an interruption after lead inspection, draft creation, or approval request without duplicating an approval or external effect.
- Application can stop a run at its configured deadline or maximum step count and record an explicit terminal event and stop reason.
- Operator can detect truncated, malformed, missing, or out-of-order durable records as visible failures rather than inferred state.

#### Verification and Operations

- Maintainer can run one provider-independent command that type-checks the project, executes deterministic tests, and executes deterministic evals.
- Maintainer can block deployment when any critical safety eval fails, regardless of aggregate quality scores.
- Operator can reconstruct one run chronologically by `runId` across service, agent, model, tool, approval, and terminal events.
- Operator can follow documented retry, resume, compensate, escalate, stop, restore, and rollback procedures grounded in implemented behavior.
- Release operator can deploy a reproducible container through Coolify with external secrets, a health check, persistent state, and redacted evidence.
- Authorized operator can access production run and approval interfaces only after authentication, authorization, exposure-appropriate tenant isolation, rate limits, and body-size controls are active.
- Workshop participant can complete each ordered task with acceptance evidence, a green `npm run verify`, and a diff review that preserves permissions and approval boundaries.

### Deferred Requirements

- Operations operator can inspect lead data through a read-only production CRM adapter.
- Agent can gather company research through a separate approved read-only source.
- Authorized operator can send an approved follow-up through a real provider with the same approval, target-validation, evidence, and idempotency guarantees.
- Maintainer can replace file-backed persistence with Postgres without changing the event and approval contracts.
- Product team can compare one typed specialist handoff with the single-agent baseline and keep it only when measured safety, quality, latency, cost, and explainability improve materially.

## Non-Functional Requirements

- **Performance**: `POST /runs` must reject request bodies larger than 16,384 bytes before agent execution, and 100% of production-bound runs must record duration and step count before public release.
- **Security**: Zero external writes may occur without a valid approval for the exact action and target; 100% of write attempts must validate permission and idempotency before the effect; the production Pi session must expose zero shell or filesystem tools.
- **Privacy**: Events and committed evidence must contain zero provider secrets, credentials, unnecessary personal data, or undocumented full drafts; real customer data remains prohibited until its lifecycle is documented.
- **Reliability**: 100% of tool attempts and outcomes must carry the originating `runId`, 100% of terminal paths must record a stop reason, and replay of an accepted request must produce zero duplicate approvals or external effects.
- **Verification**: 100% of critical deterministic tests and evals must pass before deployment, and any critical failure must produce a non-zero verification result.
- **Accessibility**: 100% of required workshop and operator procedures must be available as text and must not depend only on screenshots, color, or visual diagrams.

## Constraints and Dependencies

- The service targets Node.js 24.15 or newer, npm 12, strict TypeScript, and ECMAScript modules.
- Pi provider authentication is supplied outside the repository through supported environment configuration or Pi auth state and must never enter logs, fixtures, docs, or events.
- The Pi runtime may call only explicitly allowlisted custom tools; application code owns validation, permissions, approvals, idempotency, and durable state.
- The HTTP layer is limited to request validation and response mapping; agent and domain behavior remains independently testable outside it.
- Phase 00 uses one bounded agent and one repository package; a queue, Redis, or database is added only when durable concurrency or scale requires it.
- Current durable evidence uses append-only JSONL storage and the Coolify deployment must persist `/app/data` across restarts.
- The `/runs` endpoint must remain private or controlled until authentication, authorization, tenant, rate, retention, and redaction controls match its exposure.
- Runtime and transitive dependency versions remain intentionally pinned or overridden until upstream security fixes are verified through `npm audit` and the repository verification suite.
- Sessions derived from this PRD must keep one objective, 12-25 tasks, and a 2-4 hour implementation window.

## Phases

This system delivers the product via phases. Each phase is implemented via multiple 2-4 hour sessions (12-25 tasks each).

| Phase | Name | Sessions | Status |
|-------|------|----------|--------|
| 00 | Foundation | TBD | Not Started |
| 01 | Production Integrations | TBD | Deferred |
| 02 | Measured Handoff Experiment | TBD | Deferred |

## Phase 00: Foundation

### Objectives

1. Map and verify the bounded runtime, then make qualification typed, deterministic, and independently testable.
2. Make approvals durable and establish an approved, idempotent fake external-write boundary.
3. Make interrupted runs recoverable from durable events and gate releases on representative production evals.
4. Make health, failures, model usage, tool effects, cost, latency, and recovery observable to an operator.
5. Harden and deploy the verified service through Coolify with persistence, security gates, restore, rollback, and operator handoff evidence.

### Sessions (To Be Defined)

Sessions are defined via `phasebuild` as `session_NN_name.md` stubs under `.spec_system/PRD/phase_00/`.

**Note**: This command does not create phase directories or session stubs. Run `phasebuild` after creating the PRD.

## Technical Stack

- **Node.js 24 and npm 12** - Supported runtime and reproducible package-management baseline.
- **TypeScript 7 with strict checking** - Typed application, tool, event, and persistence contracts.
- **Pi Coding Agent SDK 0.83** - Bounded model session, custom tools, resource loading, lifecycle events, and in-memory working context.
- **TypeBox 1.3** - Runtime schemas for custom-tool boundaries.
- **Node.js HTTP server** - Small HTTP boundary for health and validated run requests.
- **Append-only JSONL files** - Current durable event evidence and replaceable persistence boundary.
- **Node.js test runner, TSX, and deterministic eval runner** - Provider-independent verification and safety gates.
- **Docker and Coolify** - Reproducible container build, secrets, health checks, persistent storage, deployment, and rollback.

## Success Criteria

- [ ] A known lead produces a valid qualification, relevant draft, pending approval, stable `runId`, and `approval_pending` stop reason without a send.
- [ ] Malformed, missing, and unknown lead identifiers stop clearly and never produce fabricated lead or qualification data.
- [ ] Pending, approved, and declined approval state survives restart, and repeated or conflicting decisions produce no duplicate transition.
- [ ] The fake external-write boundary rejects unapproved or mismatched actions and returns the original accepted result on retry without a second effect.
- [ ] Three documented interruption points can be resumed from durable events without duplicate approvals or external effects.
- [ ] Every tool attempt, outcome, failure, and terminal path is correlated by `runId`, with a visible error category or stop reason.
- [ ] A 10-20 case golden set covers every client-brief safety boundary, and every critical gate passes before deployment.
- [ ] An operator can reconstruct one failed run, execute the incident runbook, and recover without manually editing durable state.
- [ ] The production runtime exposes only allowlisted custom tools and contains no send-capable network adapter in Phase 00.
- [ ] Public exposure is blocked until authentication, authorization, tenant, rate, retention, and redaction controls match the deployment.
- [ ] A Coolify release proves HTTPS health, persistent restart, controlled backup restore, reversible failure diagnosis, rollback, and operator handoff.
- [ ] Type-checking, deterministic tests, deterministic evals, and the documented dependency security check pass on the release commit.

## Risks

- **Model fabrication or approval bypass**: Keep lead lookup, schemas, permissions, stop conditions, and critical evals in deterministic application code.
- **Lost or contradictory approval state**: Persist append-only transitions, rebuild a projection, reject invalid transitions, and exercise restart tests.
- **Duplicate external effects during retry or replay**: Resolve the exact approved action from immutable state and persist a stable idempotency result before exposing a write tool.
- **Sensitive data or credential leakage**: Use synthetic data, minimize and redact event payloads, keep secrets external, and review every logging or retention change.
- **Unauthenticated production exposure**: Keep `/runs` controlled until authentication, authorization, tenant, rate, and body-size gates are verified.
- **Unexplainable failures or unsafe recovery**: Record every lifecycle attempt and outcome, enforce terminal limits, provide `runId` queries, and drill the incident runbook.
- **Dependency or deployment drift**: Pin the declared toolchain, use reproducible container builds, run audit and verification gates, and deploy only a verified revision.
- **Premature orchestration complexity**: Preserve the single-agent design until a measured bottleneck and comparative scorecard justify one typed handoff.

## Assumptions

- Phase 00 may use synthetic leads and a fake external-write adapter: the root README, client brief, and ordered tasks define these as the safe workshop baseline, so production-hardening work can proceed without real customer data or network effects.
- File-backed append-only storage is sufficient for the current single-process workshop: repository architecture guidance explicitly defers a database, Redis, or queue until durable concurrency requires it, and the storage interfaces remain replaceable.
- The repository is a single package rather than a monorepo: deterministic analysis found no workspace indicators or packages, and the root contains one `package.json`, so package-scoped planning is unnecessary.
- Phase 00 follows ordered tasks 00 through 07 and Phase 02 holds optional task 08: `docs/todo/README_todo.md` declares that order and its entry gate, so phase planning can proceed without reinterpreting the retired scratch notes.

### Conflict Resolutions

- The root README calls the repository a completed reference while the task index labels hardening behavior as planned: treat the current code as the completed bounded baseline and tasks 00 through 07 as unfinished production-readiness scope because the task index explicitly defines that distinction.
- The root README describes release guidance rather than implemented CI because `.github` contains no workflow; CI quality and deployment gates remain planned until a workflow exists and passes.

## Open Decisions

1. Set run-duration, token, and cost warning and deployment thresholds after representative instrumentation establishes a baseline.
2. Set retention, redaction, export, deletion, backup, and restore windows before processing real leads, drafts, approvals, or event data.
3. Select production CRM, company-research, and send providers only after their read, write, timeout, credential, and data-transfer contracts are approved.
4. Select the production authentication, authorization, tenant-isolation, and operator-identity model before exposing run or decision endpoints.
5. Record operator-owned Coolify infrastructure choices for region, sizing, DNS, backup destination, monitoring, recovery ownership, and access control before release.
