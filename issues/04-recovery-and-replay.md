# 04 — Recover and replay

Mode: AFK

## Goal

Make an interrupted run explainable and resumable from durable events.

## Work

- Define the minimum state needed to resume.
- Build a projection from the append-only event log.
- Simulate restart after lead inspection and after draft creation.
- Prevent repeated side effects during replay.

## Acceptance criteria

- A projection rebuilds from events only.
- Restart tests cover two interruption points.
- Replay does not duplicate approvals.
- Every terminal run has a visible stop reason.
- `npm run verify` passes.
