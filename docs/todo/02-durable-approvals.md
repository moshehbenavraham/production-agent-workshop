# 02 — Make approvals durable

Mode: AFK
Sprint week: 2
Support tag: `[W2][#02]`

## Goal

Persist approval requests and decisions so a restart does not erase the human boundary.

## Work

- Define an approval-store interface.
- Add a file-backed implementation for the workshop.
- Add approve and decline operations.
- Reject an already-decided approval.
- Record every transition as an event.

## Acceptance criteria

- Pending approvals survive process restart.
- Approve and decline are mutually exclusive.
- Duplicate decisions are safe.
- Tests cover pending, approved, declined, and duplicate transitions.
- `npm run verify` passes.
