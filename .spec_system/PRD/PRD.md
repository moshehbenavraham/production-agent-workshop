# production-agent-workshop - Product Requirements Document

## Overview

Production Agent Workshop is a runnable reference and guided implementation path for a bounded agency lead-operations agent. Given an exact `leadId`, the current Pi session reads a synthetic lead, drafts a relevant first follow-up, creates a pending human approval request, and stops. Codex owns repository changes, Pi owns the model loop, the application owns validation, permissions, state, and evidence, and Coolify owns the deployment boundary.

The product prioritizes clarity, observability, and safe recovery over autonomy. The current reference uses synthetic leads and never sends a message. Its production-hardening path adds explicit qualification, durable approvals, a fake idempotent external-write boundary, event-based recovery, deployment-blocking evals, operator observability, and a controlled Coolify release before any real provider integration is considered.

## Current Baseline and Scope Status

The baseline verified by [`docs/todo/README_todo.md`](../../docs/todo/README_todo.md) is deliberately smaller than the planned production-hardening scope:

- `GET /health` and a body-limited, validated `POST /runs` are implemented.
- One in-memory Pi session allowlists exactly `inspect_lead`, `draft_follow_up`, and `request_send_approval`.
- Lead inspection, draft creation, and a pending approval record are implemented; typed qualification, approval decisions, and sending are not.
- Append-only JSONL events are keyed by `runId`; approval state and resumable session state are not yet durable.
- Four deterministic tests and five deterministic eval cases pass through `npm run verify`.
- The Node 24 container exposes port 3000, provides `/health`, and declares `/app/data` for persistent event storage.
- `/runs` has no authentication, authorization, tenant isolation, or rate limiting and must remain private or controlled; runs also have no explicit deadline or maximum step count, and no external-write adapter exists.

The todo index and tasks `00` through `08` are the authoritative ordered delivery plan. Tasks `00` through `07` form the required core path. Task `08` is an optional extension that may start only after the core path is complete and the single-agent baseline has measured success, failure, latency, and cost data. Every behavior in a task's `Work` section remains planned until its acceptance evidence exists; this PRD must not imply otherwise.

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

### Core Requirements (Tasks 00-07)

#### Task 00 - Map and Verify the Bounded System

- Workshop participant can run the provider-independent baseline and record type-check, deterministic test, and deterministic eval counts.
- Workshop participant can map the interface, harness, tools, state, infrastructure, observability, human approval, and eval boundaries, naming each owner, persistence point, external dependency, and place data leaves the process.
- Workshop participant can trace `POST /runs` through validation, `runId` creation, the Pi session, allowlisted tools, lifecycle events, stop-reason derivation, and response mapping for success, unknown-lead, and thrown-error paths.
- Workshop participant can locate and explain `createAgentSession()`, `customTools`, the `tools` allowlist, `SessionManager`, `DefaultResourceLoader`, `session.subscribe()`, `session.prompt()`, and final runtime state access.
- Workshop participant can classify every current and proposed action as `automatic`, `approval-required`, or `forbidden` and prove that no shell, filesystem, approval-decision, or send capability is currently exposed to Pi.
- Workshop participant can explain how `AGENTS.md` delegates mission, workflow, and security guidance, identify the guardrail that prevents the highest-cost mistake, and record any material ambiguity.
- Workshop participant can distinguish model decisions from harness enforcement and application permissions, then record the current gaps, the smallest useful product boundary and its validated output, a Harness Decision Record, at least three production risks, and the later task that owns each risk.

#### Task 01 - Make Qualification Explicit

- Operations operator can receive a typed qualification containing `fit`, confidence bounded from 0 through 1, `reasons`, and `missingInformation` for an exact known lead.
- Application can distinguish model-proposed fields from application-validated fields and produce the same deterministic baseline result from the same lead data.
- Pi agent can use one focused read-only qualification tool whose schema, responsibility, authentication boundary, timeout, error codes, idempotency behavior, permission level, and event evidence are defined before implementation.
- Operations operator can receive structured failures for missing, malformed, unknown, or failed lead lookup without fabricated fields or friendly success prose.
- Operator can correlate qualification attempts and outcomes with the existing `runId` without persisting credentials or unnecessary lead data.
- Maintainer can deterministically test valid input, confidence bounds, missing input, malformed input, unknown leads, and simulated tool failure without changing the final pending-approval stop.

#### Task 02 - Make Approvals Durable

- Human approver can review an approval record containing `approvalId`, `runId`, exact action, exact target, status, timestamps, and minimized decision metadata.
- Application can keep temporary working context, durable approval state, append-only events, and rebuilt projections as separate concerns behind a replaceable approval-store contract with a file-backed workshop implementation.
- Human approver can make only `pending -> approved` or `pending -> declined` decisions, and a repeated or conflicting decision returns the original terminal state without another transition or effect.
- Operator can identify the decision actor and inspect request, approval, decline, duplicate, invalid, and storage-failure events without exposing credentials or unnecessary personal data.
- Operator can rebuild the same approval projection from durable records and prove pending, approved, and declined state survives process restart.
- Application can fail visibly for a missing approval, malformed decision, unknown actor, already-decided approval, duplicate request, interrupted write, or corrupted record without implying success.
- Maintainer can deterministically test pending, approved, declined, invalid, duplicate, restart, and storage-failure paths.
- Product owner can define the retained approval and draft fields plus retention, redaction, export, and deletion behavior before synthetic data is replaced; public decision endpoints remain part of task `07` hardening.

#### Task 03 - Add an Idempotent Send Boundary (Fake Only)

- Maintainer can define the fake adapter's one responsibility, typed input and output, timeout, error codes, approval rule, idempotency behavior, and structured evidence before implementation.
- Authorized operator can invoke a deterministic fake adapter only for an existing approved `approvalId`; pending, declined, missing, malformed, or target-mismatched requests are forbidden before any effect.
- Application can resolve the action, recipient, and draft from immutable approved state rather than model-provided free text.
- Application can derive a stable idempotency key, persist the first result, and return that original result for a repeated approved request without a second effect.
- Operator can distinguish accepted, duplicate, rejected, timed-out, permission-denied, and downstream-failure outcomes through typed results and redacted attempt and outcome events containing `runId`, `approvalId`, idempotency key, duration, and outcome.
- Operator can see whether the fake action is reversible or compensatable and what evidence requires human escalation when it is not.
- Maintainer can deterministically test valid approval, missing input, target mismatch, pending or declined approval, timeout, duplicate request, permission denial, and downstream failure.
- Human reviewer can inspect the permission contract and diff before any network-writing Pi tool is allowlisted; task `03` adds no provider credential and performs no real network write.

#### Task 04 - Recover and Replay

- Operator can rebuild run and approval state from append-only durable events instead of raw conversation transcripts.
- Operator can inspect an event envelope containing event identity, `runId`, timestamp, actor, action, tool, minimized validated arguments, result or error, approval state, and stop reason, with explicit fields for application, model, prompt, duration, retry, token, and cost metadata when available.
- Application can record every tool attempt and outcome, including failures, and stop at a configured deadline or maximum step count with an explicit terminal event and stop reason.
- Operator can resume interruptions after lead inspection, draft creation, and approval request without duplicating an approval or fake external effect.
- Application can treat context compaction as a replaceable projection while retaining the durable evidence needed for replay, audit, and recovery.
- Operator can receive a visible, actionable failure for truncated, malformed, missing, or out-of-order records rather than inferred state.
- Operator can follow explicit retry, resume, compensate, escalate, or stop rules and exercise recovery without manually editing durable records.
- Product owner can define event-payload retention, redaction, and deletion rules before real customer data is introduced.

#### Task 05 - Add Production Eval Gates

- Maintainer can run a golden set of 10 to 20 synthetic happy, ambiguous, malformed, unknown, timeout, permission, credential, downstream, duplicate, restart, invalid-model, adversarial, approval-bypass, false-completion, escalation, and stop cases.
- Maintainer can score task success, tool selection, validated arguments, event order, grounding, permission safety, recovery, stop reason, latency, and cost, with unavailable provider values represented explicitly.
- Maintainer can use deterministic assertions for schemas, state, events, permissions, idempotency, and exit conditions while keeping optional model grading separate from critical safety gates.
- Release operator can block deployment when any critical case fails, regardless of aggregate quality, and see the failing case, dimension, expected evidence, and observed evidence.
- Workshop participant can define expected outcomes and event sequences before each case; persist each result, trace, score, application or prompt version, latency, and cost field; run and revert red/fix/green exercises for lead fabrication, false-send wording, and approval bypass; add regressions for important failures; and compare one variable at a time.

#### Task 06 - Observe Failures and Practice Recovery

- Operator can observe service uptime, memory, CPU, storage, and dependency health; agent-run state; model calls; and tool calls as four distinct layers joined by the same `runId`.
- Operator can inspect structured environment, application version, step, event, duration, retry, error, permission, result, side-effect, token, cost, and minimized actor or tenant fields without credentials, full secrets, or unnecessary lead and draft content.
- Operator can reconstruct one run chronologically from a safe query or report and distinguish every terminal stop reason and actionable failure category.
- Operator can act on thresholded alerts for repeated failures, stuck runs, dangerous permission attempts, cost spikes, unavailable dependencies, and storage or queue pressure when those resources exist, without alerting on harmless retries below threshold.
- Operator can follow `docs/runbooks/agent-incident-response.md` for pause, inspect, retry, resume, compensate, escalate, and stop actions grounded in implemented behavior.
- Maintainer can drill tool timeout, invalid model response, mid-run restart, revoked credential, and duplicate request under one `runId`, recover without manual durable-state edits, and add each missing metric, event, alert, or runbook step revealed by the drill.

#### Task 07 - Release Through Coolify

- Release operator can record VPS sizing and region, data location, non-root administration, SSH and firewall policy, DNS and HTTPS, Coolify access, environment separation, secret rotation, off-server backup, retention and restore testing, updates, monitoring, pause, disaster recovery, recovery ownership, and rollback decisions without committing private infrastructure details.
- Authorized users can access run and durable decision interfaces only after authentication, authorization, exposure-appropriate tenant isolation, rate controls, body-size controls, and data-lifecycle rules match the deployment exposure.
- Release operator can connect the intended repository and isolated environment, build a reproducible image from a verified commit, configure provider credentials only as Coolify secrets, persist `EVENT_LOG_PATH=/app/data/events.jsonl`, expose port 3000, and verify `/health` over HTTPS outside the dashboard.
- Release operator can run a controlled known-lead smoke case and observe `runId`, `approval_pending`, and a complete redacted timeline without a send claim.
- Release operator can restart the container, prove prior events and durable approvals remain available, restore an off-server backup, diagnose one reversible failure, and roll back to the last verified image.
- Release operator can confirm equivalent local and deployed behavior for the same smoke case and preserve the verified image identifier and release evidence.
- Another operator can use a one-page guide to understand scope, pause, deploy, restart, roll back, rotate secrets, inspect health and one failed run, choose a recovery action, and know when a human must take over.
- Workshop participant can demonstrate the problem, bounded architecture, happy path, one failure and recovery, eval gate, cost or latency evidence, and next improvement in five minutes using redacted evidence.

#### Delivery Governance

- Workshop participant can complete tasks `00` through `07` in order and can treat every unproven `Work` item as planned rather than implemented.
- Workshop participant can read `AGENTS.md`, its three linked governance files, the client brief, the todo index, the active task, and relevant source and tests, then use Plan mode for a non-trivial change with one coherent goal, context, constraints, and measurable completion checks.
- Workshop participant can define schemas, permission boundaries, failure behavior, and event evidence before implementation, then run `npm run verify` and `$verify-production-agent` before declaring a task complete.
- Workshop participant can record the task goal, commands and results, required artifact, one exercised failure, recovery or refusal evidence, final diff review, and remaining risk in the Build Log.
- Workshop participant can update `docs/CHANGELOG.md` and confirm the final diff introduces no secret, unnecessary personal data, broader permission, unapproved side effect, or stale documentation.

### Optional Extension Requirements (Task 08)

- Product team can start a handoff experiment only after tasks `00` through `07` are complete and measured single-agent success, failure, latency, and cost baselines exist.
- Product team can identify one observed bottleneck, state a hypothesis and success metric, and choose the smallest deterministic stage, router, pipeline, supervisor, parallel worker, or human checkpoint that could address it.
- Maintainer can assign each stage one bounded responsibility and least-privilege tools, prefer deterministic code or n8n for non-reasoning edges, and route routine model work to the smallest capable model.
- Maintainer can pass typed structured state with input, output, owner, timeout, retry policy, failure destination, correlation identifier, and completion evidence instead of a raw transcript.
- Maintainer can keep any parallel work independent and safe to retry, then deterministically test invalid handoff data, timeout, retry, partial failure, unavailable worker, context loss, and duplicate delivery while preserving the same `runId` or typed correlation identifier.
- Product team can compare task success, safety, latency, cost, explainability, and operational complexity against the unchanged single-agent baseline and remove the added component unless the evidence shows a material improvement.

### Deferred Requirements

- The following requirements are outside the ordered `docs/todo` core and optional extension; they have no scheduled phase or session in this PRD.
- Operations operator can inspect lead data through a read-only production CRM adapter.
- Agent can gather company research through a separate approved read-only source.
- Authorized operator can send an approved follow-up through a real provider with the same approval, target-validation, evidence, and idempotency guarantees.
- Maintainer can replace file-backed persistence with Postgres without changing the event and approval contracts.

## Non-Functional Requirements

- **Performance**: `POST /runs` must reject request bodies larger than 16,384 bytes before agent execution; 100% of production-bound runs must record duration and step count; token and cost fields must be recorded when available and explicitly marked unavailable otherwise.
- **Security**: Zero external writes may occur without a valid approval for the exact action and target; 100% of write attempts must validate permission and idempotency before the effect; the production Pi session must expose zero shell or filesystem tools.
- **Privacy**: Events, logs, screenshots, and committed evidence must contain zero provider secrets, credentials, private infrastructure identifiers, unnecessary personal data, or undocumented full drafts; real customer data remains prohibited until its lifecycle is documented.
- **Reliability**: 100% of tool attempts and outcomes must carry the originating `runId`; 100% of terminal paths must record a stop reason; 100% of failures must expose an actionable category; replay or retry must produce zero duplicate approvals or external effects.
- **Recovery**: Restart coverage must prove recovery at all three required interruption points, corrupted or incomplete records must fail visibly, and recovery exercises must require zero manual durable-state edits.
- **Verification**: The golden set must contain 10 to 20 cases, 100% of critical deterministic tests and evals must pass before deployment, and any critical failure must produce a non-zero verification result regardless of aggregate quality.
- **Operations**: Every configured alert must state a numeric or categorical trigger and an operator action; the release must prove HTTPS health, persistent restart, backup restore, and rollback from one verified image.
- **Accessibility**: 100% of required workshop and operator procedures must be available as text and must not depend only on screenshots, color, or visual diagrams.

## Constraints and Dependencies

- The service targets Node.js 24.15 or newer, npm 12, strict TypeScript, and ECMAScript modules.
- The ordered scope, modes, evidence, and entry gates in `docs/todo/README_todo.md` and tasks `00` through `08` take precedence over older extension summaries elsewhere in the repository.
- Pi provider authentication is supplied outside the repository through supported environment configuration or Pi auth state and must never enter logs, fixtures, docs, or events.
- The Pi runtime may call only explicitly allowlisted custom tools; application code owns validation, permissions, approvals, idempotency, and durable state.
- The HTTP layer is limited to request validation and response mapping; agent and domain behavior remains independently testable outside it.
- Phase 00 uses one bounded agent and one repository package; a queue, Redis, database, or second agent is added only when measured evidence justifies it.
- Task `03` uses a deterministic fake adapter, performs no real network write, and keeps any network-writing Pi tool outside the allowlist until explicit human review.
- Task `08` cannot begin until tasks `00` through `07` and their success, failure, latency, and cost baselines are complete.
- Current durable evidence uses append-only JSONL storage and the Coolify deployment must persist `/app/data` across restarts.
- The `/runs` endpoint must remain private or controlled until authentication, authorization, tenant, rate, retention, and redaction controls match its exposure.
- Runtime and transitive dependency versions remain intentionally pinned or overridden until upstream security fixes are verified through `npm audit` and the repository verification suite.
- Sessions derived from this PRD must keep one objective, 12-25 tasks, and a 2-4 hour implementation window.

## Phases

This system delivers the product via phases. Each phase is implemented via multiple 2-4 hour sessions (12-25 tasks each).

| Phase | Name | Sessions | Status |
|-------|------|----------|--------|
| 00 | Foundation | Derived from tasks 00-07 by `phasebuild` | Not Started |
| 01 | Measured Handoff Experiment | Derived from optional task 08 only after its entry gate | Deferred |

## Phase 00: Foundation

### Objectives

1. Map and verify the bounded runtime, then make qualification typed, deterministic, and independently testable.
2. Make approvals durable and establish an approved, idempotent fake external-write boundary.
3. Make interrupted runs recoverable from durable events and gate releases on representative production evals.
4. Make health, failures, model usage, tool effects, cost, latency, and recovery observable to an operator.
5. Harden and deploy the verified service through Coolify with persistence, security gates, restore, rollback, and operator handoff evidence.

### Ordered Workstream Map

This table maps the authoritative todo order into Phase 00 requirements. A workstream is not automatically one Apex session; `phasebuild` owns the 2-4 hour session split.

| Task | Week | Mode | Support | Required outcome | Required completion evidence |
|------|------|------|---------|------------------|------------------------------|
| [`00`](../../docs/todo/00-map-the-system.md) | 1 | HITL | `[W1][#00]` | Map the runtime, permissions, persistence, evidence, ownership, and current gaps | Architecture and request-flow diagram, Harness Decision Record, permission table, risk register, guidance map, baseline verification, and stop-boundary explanation |
| [`01`](../../docs/todo/01-qualification-contract.md) | 1 | AFK | `[W1][#01]` | Add typed, validated, independently testable qualification without broadening permissions | Schema, tool contract, event sequence, failure matrix, red/fix/green example, verification output, and vertical-slice demo |
| [`02`](../../docs/todo/02-durable-approvals.md) | 2 | AFK | `[W2][#02]` | Persist approval requests and terminal decisions across restart | State diagram, store contract, transition events, failure matrix, restart proof, data-lifecycle decision, and verification output |
| [`03`](../../docs/todo/03-idempotent-send.md) | 2 | HITL | `[W2][#03]` | Add an approved, exact-target, idempotent fake write boundary | Typed contract, permission table, idempotency proof, eight-path test matrix, redacted events, human review, and verification output |
| [`04`](../../docs/todo/04-recovery-and-replay.md) | 3 | AFK | `[W3][#04]` | Rebuild, replay, and resume runs safely from durable events | Event schema, projection rules, recovery table, three restart timelines, replay proof, retention decision, and verification output |
| [`05`](../../docs/todo/05-production-evals.md) | 3 | AFK | `[W3][#05]` | Gate deployment on representative behavior and safety evals | Golden-set inventory, rubric, scorecard, critical red/fix/green traces, and final verification output |
| [`06`](../../docs/todo/06-observability-and-incidents.md) | 4 | AFK | `[W4][#06]` | Make failure, cost, latency, alerts, and recovery observable and operable | Incident timeline, `runId` query, alert table, redacted observability view, runbook, recovery proof, and verification output |
| [`07`](../../docs/todo/07-coolify-release.md) | 4 | HITL | `[W4][#07]` | Harden, deploy, smoke-test, restart, restore, roll back, and hand off through Coolify | Infrastructure decision record, service map, security checklist, image and health evidence, run timeline, restart and restore proof, rollback timeline, operator guide, and five-minute demo |

### Sessions (To Be Defined)

Sessions are defined via `phasebuild` as `session_NN_name.md` stubs under `.spec_system/PRD/phase_00/`.

**Note**: This command does not create phase directories or session stubs. Run `phasebuild` after creating the PRD.

## Phase 01: Measured Handoff Experiment

### Entry Gate

Tasks `00` through `07` must be complete, and the single-agent baseline must have measured success, failure, latency, cost, and operational evidence. Phase 01 must not be created merely to repair an unclear prompt or oversized tool.

Source task: [`08 - Justify One Typed Handoff`](../../docs/todo/08-typed-handoff-experiment.md). Mode: HITL. Sprint stage: optional extension. Support tag: `[EXT][#08]`.

### Objective

Run optional task `08` as one bounded comparison. Keep a deterministic stage or typed specialist handoff only if its scorecard demonstrates a material improvement over the unchanged single-agent baseline; otherwise remove it.

### Sessions (Deferred)

No Phase 01 session is planned until the entry gate passes. Any later session split must preserve one objective, least-privilege tools, typed state, deterministic failure handling, and the 2-4 hour Apex session limits.

## Technical Stack

- **Node.js 24.15+ and npm 12.0.2** - Supported runtime and reproducible package-management baseline.
- **TypeScript 7.0.2 with strict checking** - Typed application, tool, event, and persistence contracts.
- **Pi Coding Agent SDK 0.83.0** - Bounded model session, custom tools, resource loading, lifecycle events, and in-memory working context.
- **TypeBox 1.3.10** - Runtime schemas for custom-tool boundaries.
- **Node.js HTTP server** - Small HTTP boundary for health and validated run requests.
- **Append-only JSONL files** - Current durable event evidence; task `02` approval storage and task `04` projections remain planned behind replaceable interfaces.
- **Node.js test runner, TSX, and deterministic eval runner** - Provider-independent verification and safety gates.
- **Docker and Coolify** - Reproducible container build, secrets, health checks, persistent storage, deployment, and rollback.

## Success Criteria

### Core Path (Tasks 00-07)

- [ ] Task `00`: The eight-boundary system map, three-path request trace, permission table, Harness Decision Record, and risk ownership are complete, and baseline type-checking, four tests, and five evals pass.
- [ ] Task `01`: A known lead produces a schema-valid deterministic qualification; missing, malformed, unknown, and simulated-failure cases stop visibly; no tool permission is broadened.
- [ ] Task `02`: Pending, approved, and declined approval state survives restart; projections rebuild identically; invalid, duplicate, conflicting, interrupted, and corrupted decisions never imply success.
- [ ] Task `03`: The fake adapter rejects every unapproved or mismatched action, returns the original result on duplicate approved requests, passes all eight required paths, and remains non-networked throughout Phase 00.
- [ ] Task `04`: Three documented interruption points resume from durable events with zero duplicate approvals or effects; deadline, step-limit, replay, and corrupt-record paths fail visibly without manual state edits.
- [ ] Task `05`: A 10-20 case golden set covers every client-brief boundary, critical assertions score behavior and evidence rather than prose alone, deliberate breaks are reverted, and every critical gate passes.
- [ ] Task `06`: One safe query reconstructs a failed run across all implemented layers; every terminal path and failure is actionable; five incident drills recover through the documented runbook without credential or personal-data leakage.
- [ ] Task `07`: The verified image passes pre-public security gates, HTTPS health, redacted smoke testing, persistent restart, backup restore, reversible-failure rollback, local/deployed parity, operator handoff, and the five-minute demo.
- [ ] Every task has its required Build Log evidence, one exercised failure, a green `npm run verify`, a `$verify-production-agent` result, an updated changelog, and a final permissions, privacy, side-effect, and documentation diff review.

### Optional Extension (Task 08)

- [ ] Task `08` begins only after its entry gate passes and documents the measured bottleneck, hypothesis, typed handoff, least-privilege permissions, deterministic failure matrix, and unchanged single-agent comparison.
- [ ] The comparative scorecard reports success, safety, latency, cost, explainability, and operational complexity, and the final keep-or-remove decision follows the evidence.

## Required Evidence Portfolio

The completed core path must leave one reviewable portfolio containing:

- the architecture, request-flow, permission, Harness Decision Record, risk, and baseline evidence from task `00`;
- the qualification schema, contract, failure, event, and vertical-slice evidence from task `01`;
- the approval state, transition, projection, restart, and data-lifecycle evidence from task `02`;
- the fake-write contract, human permission review, idempotency proof, failure matrix, and redacted events from task `03`;
- the event, projection, replay, three-interruption, recovery, and retention evidence from task `04`;
- the golden set, rubric, critical-gate scorecard, red/fix/green traces, and final verification from task `05`;
- the redacted observability view, `runId` query, alerts, incident timeline, runbook, and recovery proof from task `06`;
- the infrastructure record, deployment map, security gates, image, health, restart, restore, rollback, operator guide, and demo evidence from task `07`;
- a final Build Log summary of lessons, open risks, and the next justified improvement.

Task `08` adds its before-and-after diagrams, typed handoff contract, permission table, failure matrix, comparative scorecard, and keep-or-remove decision only after its entry gate passes.

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
- Phase 00 follows ordered tasks `00` through `07`, while Phase 01 is reserved for optional task `08` only after its entry gate: `docs/todo/README_todo.md` defines that direct order, so no unrelated integration phase may be inserted between them.
- Project state currently registers only Phase 00: Phase 01 remains PRD-only deferred scope and must not gain session state until task `08` passes its entry gate.
- Production CRM, company research, real send, and Postgres work remain unscheduled deferred requirements: they appear in future-looking repository material but not in the ordered todo path, so aligning the PRD does not authorize or schedule them.

### Conflict Resolutions

- The root README calls the repository a completed reference while the task index labels hardening behavior as planned: treat the current code as the completed bounded baseline and tasks 00 through 07 as unfinished production-readiness scope because the task index explicitly defines that distinction.
- The root README lists future student integrations in a different order than `docs/todo`: use the todo index as the delivery authority, keep those integrations unscheduled, and place optional task `08` directly after the core path.
- Task `03` is named as a send boundary while the core path prohibits real sending: implement only the deterministic fake adapter and keep any real network provider and network-writing Pi tool deferred.
- The root README describes release guidance rather than implemented CI because `.github` contains no workflow; CI quality and deployment gates remain planned until a workflow exists and passes.

## Open Decisions

1. Set run-duration, token, and cost warning and deployment thresholds after representative instrumentation establishes a baseline.
2. Set retention, redaction, export, deletion, backup, and restore windows before processing real leads, drafts, approvals, or event data.
3. Select production CRM, company-research, and send providers only after their read, write, timeout, credential, and data-transfer contracts are approved.
4. Select the production authentication, authorization, tenant-isolation, and operator-identity model before exposing run or decision endpoints.
5. Record operator-owned Coolify infrastructure choices for region, sizing, DNS, backup destination, monitoring, recovery ownership, and access control before release.
