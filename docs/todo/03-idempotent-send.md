# 03 - Add an Idempotent Send Boundary

Mode: HITL
Sprint week: 2
Support tag: `[W2][#03]`

## Goal

Add the first external-write boundary without permitting unapproved, misdirected, or duplicate sends.

## Work

- Create a fake send adapter first; do not add provider credentials or a real network write in this task.
- Define a narrow typed contract with one responsibility, typed input and output, timeout, error codes, structured evidence, and an explicit approval rule.
- Require an existing approved `approvalId`; pending, declined, missing, or malformed approvals must be forbidden.
- Resolve the recipient, draft, and action from immutable approved application state rather than model-provided free text.
- Derive a stable idempotency key from the approved action and persist the first result.
- Validate the exact target and permission before invoking the adapter.
- Return evidence that distinguishes accepted, duplicate, rejected, timed-out, and downstream-failure outcomes.
- Define whether the action can be rolled back or compensated and what evidence a human receives when it cannot.
- Record attempt and result events with `runId`, `approvalId`, idempotency key, duration, and redacted outcome.
- Add a network-writing Pi tool only after the application service is safe, and keep it outside the allowlist until a human reviews the contract and diff.

## Required Tests

1. valid approved action;
2. missing required input;
3. invalid or mismatched target;
4. pending or declined approval;
5. timeout;
6. duplicate request;
7. permission denied;
8. downstream service failure.

## Acceptance Criteria

- Pending, declined, missing, and mismatched approvals cannot send.
- Repeating the same approved request returns the original result without a second effect.
- Validation and authorization happen before the fake side effect.
- Errors are actionable and do not claim completion.
- No provider credential, full draft, or unnecessary personal data appears in events.
- The fake adapter and every failure path are deterministic and fully tested.
- A human reviews the permission boundary, tool contract, and diff before the tool is allowlisted.
- `npm run verify` passes.

## Evidence

Add the contract, permission table, idempotency proof, test matrix, sample redacted events, human review result, and verification output to the Build Log.
