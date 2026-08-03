# 03 — Add an idempotent send adapter

Mode: HITL
Sprint week: 2
Support tag: `[W2][#03]`

## Goal

Add the first external-write boundary without permitting unapproved or duplicate sends.

## Work

- Create a fake send adapter first.
- Require an approved `approvalId`.
- Require an idempotency key derived from the approved action.
- Return evidence of the side effect.
- Add a forbidden path for pending or declined approvals.

## Acceptance criteria

- Pending and declined approvals cannot send.
- Repeating the same request returns the original result.
- No provider credential appears in events.
- The fake adapter is fully tested before any real provider is considered.
- A human reviews the tool contract and diff.
