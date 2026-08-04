# 00 - Map and Verify the Bounded System

Mode: HITL
Sprint week: 1
Support tag: `[W1][#00]`

## Goal

Explain the complete request path, runtime ownership, persistence, evidence, and permission boundaries before changing production behavior.

## Verified Starting Point

The reference has one HTTP entry point, one bounded Pi session, three custom tools, a JSONL event log, and a response containing `runId` and `stopReason`. It can inspect a sample lead, draft a follow-up, create a pending approval, and stop. It cannot approve or send.

## Work

- Read `docs/todo/client-brief.md`, `AGENTS.md` and its linked governance files, the root README, `src/`, and `tests/`.
- Explain how the minimal `AGENTS.md` entry point delegates mission, workflow, and security rules; identify the guardrail that prevents the most expensive production mistake and record any ambiguity.
- Run the provider-independent baseline with `npm run verify`; record the type-check, test, and eval counts.
- Draw eight labeled boundaries: interface, harness, tools, state, infrastructure, observability, human approval, and evals.
- Name the source file that owns each boundary and every place data is persisted or leaves the process.
- Trace `POST /runs` through input validation, `runId` creation, the Pi session, each allowlisted tool, lifecycle events, stop-reason derivation, and the HTTP response.
- Identify the smallest useful version, validate its final output before another system trusts it, and explain which proposed behaviors remain outside that boundary.
- Locate and explain `createAgentSession()`, `customTools`, the `tools` allowlist, `SessionManager`, `DefaultResourceLoader`, `session.subscribe()`, `session.prompt()`, and final runtime state access.
- Classify every current and proposed action as automatic, approval-required, or forbidden.
- Prove from source that Pi shell and filesystem tools are not enabled and that no send implementation exists.
- Record current production gaps: unauthenticated `/runs`, no tenant boundary or rate limit, in-memory Pi sessions, file-backed events, non-durable approvals, no explicit run timeout or maximum step count, and no external-write adapter.
- Record why Redis, a queue, a database, or another agent is unjustified until a measured requirement needs it.
- Write a Harness Decision Record covering the job, why a model loop is needed, the stop conditions, human checkpoints, durable state, success evidence, and the distinct roles of Codex, Pi, the application, and Coolify.
- Record at least three production risks and the task number that will address each one.

## Acceptance Criteria

- The diagram names every runtime boundary and the source file that owns it.
- The request trace includes success, unknown-lead, and thrown-error paths.
- The explanation distinguishes model decisions from harness enforcement and application permissions.
- Automatic, approval-required, and forbidden actions are explicit.
- The evidence explains why the service cannot send and why prompt wording alone is not an approval boundary.
- Every persistence point, external dependency, and current deployment exposure is visible.
- Baseline type-checking, four deterministic tests, and five evals pass.

## Evidence

Add the following to the [Week 1 Build Log](../build-log-week1.md):

1. the architecture and request-flow diagram;
2. a concise Harness Decision Record;
3. the permission table and risk register;
4. the repository-guidance map and most important guardrail;
5. exact `npm run verify` output;
6. a five-sentence explanation of where the system stops and why.
