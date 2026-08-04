# 02 - Make Approvals Durable

Mode: AFK
Sprint week: 2
Support tag: `[W2][#02]`

## Goal

Persist approval requests and decisions so a restart cannot erase, repeat, or fabricate the human boundary.

## State Model

Keep these concerns separate:

- working context: temporary information the model needs for the current step
- durable state: approval facts the application must preserve
- event log: the append-only sequence of attempts and transitions
- projection: the current approval view rebuilt from durable records

## Work

- Define an approval record and transition contract with `approvalId`, `runId`, exact action and target, status, timestamps, and decision metadata.
- Define an approval-store interface before selecting storage details.
- Add a file-backed implementation suitable for the workshop and keep the interface replaceable.
- Implement `pending -> approved` and `pending -> declined` as the only valid decisions.
- Reject conflicting or repeated decisions without creating a second transition.
- Record the actor and decision evidence without storing credentials or unnecessary personal data.
- Emit append-only events for request, approval, decline, duplicate, invalid, and storage-failure outcomes.
- Build the current approval projection from durable data rather than conversation history.
- Restart the process and prove pending and decided approvals remain intact.
- Define retention, redaction, export, and deletion behavior before replacing synthetic leads with customer data.
- Keep approve and decline operations inside the application boundary; public authenticated endpoints belong to the release hardening task.

## Failure Matrix

Cover missing approval, malformed decision, unknown actor, already-decided approval, duplicate request, interrupted write, and corrupted record behavior. Failures must be visible and must never imply that a decision succeeded.

## Acceptance Criteria

- Pending approvals survive a process restart.
- Approved and declined are mutually exclusive terminal states.
- Duplicate decisions return the original state without duplicate events or effects.
- A projection rebuilds the same approval state from durable records.
- Every transition is associated with the original `runId` and an identifiable actor.
- Retention and redaction rules identify exactly which approval and draft fields persist.
- Tests cover pending, approved, declined, invalid, duplicate, restart, and storage-failure paths.
- `npm run verify` passes.

## Evidence

Add the state diagram, storage contract, transition event examples, restart
proof, data-lifecycle decision, and verification output to the
[Week 2 Build Log](../build-log-week2.md).
