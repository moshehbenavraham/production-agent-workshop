# 04 - Recover and Replay

Mode: AFK
Sprint week: 3
Support tag: `[W3][#04]`

## Goal

Make every interrupted run explainable and safely resumable from durable events without replaying a completed side effect.

## Work

- Define the minimum durable facts needed to resume and keep them out of raw conversation transcripts.
- Treat the append-only event log as the source of truth and build current run state as a deterministic projection.
- Define an event envelope for identity, `runId`, timestamp, actor, action, tool, redacted validated arguments, result or error, approval state, and stop reason.
- Reserve explicit fields for application version, model or prompt version, duration, retry count, tokens, and cost when those values are available.
- Record every tool attempt and outcome, including failures, instead of only successful domain events.
- Add a maximum step count and run deadline with explicit terminal events and stop reasons.
- Define structured context compaction as a projection; never delete the durable events needed for audit or recovery.
- Build replay and resume behavior for interruption after lead inspection, draft creation, and approval request.
- Prevent duplicate approvals and external effects when the same event or request is replayed.
- Handle truncated, malformed, missing, or out-of-order records with visible failure instead of silently inventing state.
- Classify recovery actions as retry, resume, compensate, escalate, or stop and document when each is safe.
- Define retention, redaction, and deletion rules for event payloads before real customer data is introduced.

## Acceptance Criteria

- A projection rebuilds run and approval state from durable events only.
- Restart tests cover at least three interruption points.
- Replaying an event or request does not duplicate approval or send effects.
- Timeout and maximum-step exits produce terminal events with a visible stop reason.
- Corrupt or incomplete state fails loudly with enough evidence for an operator.
- Working context remains replaceable and is not the durable source of truth.
- Sensitive data has a documented lifecycle and events remain minimized.
- Recovery tests require no manual event-file or database edits.
- `npm run verify` passes.

## Evidence

Add the event schema, projection rules, recovery decision table, three restart timelines, replay-idempotency proof, retention decision, and verification output to the Build Log.
