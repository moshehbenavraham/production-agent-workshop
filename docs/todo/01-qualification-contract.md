# 01 - Make Qualification Explicit

Mode: AFK
Sprint week: 1
Support tag: `[W1][#01]`

## Goal

Replace implicit model judgment with a typed, deterministic qualification result inside one complete request-to-event vertical slice.

## Work

- Define a qualification result with `fit`, bounded `confidence`, `reasons`, and `missingInformation`.
- Define the input and output schemas before implementation and decide which fields are model-proposed versus application-validated.
- Document the tool contract: responsibility, authentication boundary, timeout, expected error codes, idempotency behavior, event evidence, and permission level.
- Implement a deterministic domain function that produces the baseline result from an exact known lead.
- Expose the function through one focused, read-only Pi tool without broadening the existing tool permissions.
- Validate required input before lookup and reject malformed, missing, or unknown `leadId` values clearly.
- Record the attempt and outcome with the existing `runId` while excluding unnecessary lead details from events.
- Return structured failure data; do not turn a tool error into a friendly success response.
- Integrate the result into the bounded run without changing the final pending-approval stop.
- Add deterministic tests for valid input, confidence bounds, missing input, malformed input, unknown leads, and a simulated tool failure.

## Acceptance Criteria

- Unknown leads cannot receive a qualification.
- `confidence` is always between 0 and 1 and the result satisfies the declared schema.
- The same lead data produces the same baseline result.
- The model cannot invent qualification fields or bypass application validation.
- Failure output is actionable and the run remains associated with one `runId` and visible stop reason.
- No provider credential or unnecessary personal data is added to events.
- The focused tool is independently unit-tested and `npm run verify` passes.

## Evidence

Add the schema, tool contract, event sequence, test matrix, verification output, one red/green failure example, and a 60-second vertical-slice demo to the Build Log.
