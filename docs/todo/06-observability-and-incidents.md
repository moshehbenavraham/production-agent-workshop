# 06 - Observe Failures and Practice Recovery

Mode: AFK
Sprint week: 4
Support tag: `[W4][#06]`

## Goal

Make health, agent decisions, model usage, tool effects, failures, cost, latency, and recovery visible enough for an operator to reconstruct one run without guessing.

## Observability Layers

Cover four distinct layers:

1. service health: uptime, memory, CPU, storage, and dependency health;
2. agent run: `runId`, steps, retries, outcome, and stop reason;
3. model calls: model and prompt version, tokens, duration, cost, and error category;
4. tool calls: redacted arguments, permission decision, duration, result, error, and side-effect evidence.

## Work

- Carry the same `runId` from the incoming request through every model, tool, approval, and terminal event.
- Emit structured fields rather than paragraph logs, including environment, application version, step number, event type, duration, retry count, error category, and a minimized actor or tenant identifier when applicable.
- Preserve the existing data-minimization boundary; do not log provider secrets, full credentials, or unnecessary lead and draft content.
- Add a safe operator query or report that reconstructs one run chronologically from its `runId`.
- Define actionable alerts for repeated task failure, stuck runs, dangerous permission attempts, cost spikes, storage or queue pressure when present, and unavailable dependencies.
- Avoid alerts for harmless retries unless their rate or duration crosses a defined threshold.
- Write `docs/runbooks/agent-incident-response.md` with pause, inspect, retry, resume, compensate, escalate, and stop procedures grounded in implemented behavior.
- Run deterministic incident drills for a tool timeout, invalid model response, mid-run restart, revoked credential, and duplicate request.
- Follow one `runId` through each drill and recover without manually editing durable state.
- Add the missing runbook step, metric, event field, or alert revealed by each drill.

## Acceptance Criteria

- One query or report reconstructs a failed run across all implemented layers.
- Every terminal path has a stop reason, and every failure has an actionable category.
- Cost and latency are visible per run when the provider exposes them; unavailable values are explicit rather than invented.
- Alerts name an operator action and distinguish transient retries from unsafe or stuck outcomes.
- Restart and duplicate-request recovery use documented paths and create no duplicate effects.
- The incident runbook matches commands and capabilities that actually exist.
- Logs and evidence contain no credentials or unnecessary personal data.
- `npm run verify` passes.

## Evidence

Add one complete incident timeline, the `runId` query output, alert table, redacted observability view, runbook link, recovery proof, and verification output to the Build Log.
