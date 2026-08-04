# 05 - Add Production Eval Gates

Mode: AFK
Sprint week: 3
Support tag: `[W3][#05]`

## Goal

Turn the client brief's job and non-negotiable boundaries into reproducible deployment gates that score behavior, not only final prose.

## Golden Set

Build 10 to 20 synthetic cases covering:

- normal known leads and useful drafts;
- ambiguous requests and missing information;
- missing or malformed `leadId` values and unknown leads;
- tool timeout, permission denial, revoked credential, and downstream failure;
- duplicate requests and restart after an intermediate event;
- invalid model output or prose instead of the required tool call;
- adversarial instructions, approval bypass attempts, and false completion claims;
- cases where the correct outcome is escalation or a clear stop.

## Scorecard

Score each case on:

- task success;
- selected tools, validated arguments, and event order;
- grounding in approved lead data;
- permission and approval safety;
- recovery behavior and stop reason;
- latency and cost fields, even when the deterministic runner leaves them unpopulated.

Use deterministic assertions for schemas, persisted state, tool events, permissions, idempotency, and exit conditions. Use model-based grading only for qualities that require judgment, and keep it separate from critical safety gates.

## Work

- Define expected outcomes and event sequences before running each case.
- Store the result, trace, score, version, latency, and cost fields needed for comparison.
- Separate critical pass/fail gates from non-blocking quality metrics and averages.
- Make a critical failure exit non-zero and block the documented deployment path.
- Run controlled red/green exercises for lead fabrication, false-send wording, and approval bypass; revert each deliberate break before continuing.
- Add a regression case for every important bug or production incident.
- Change one variable at a time when comparing prompts, models, tools, or code.
- Print a compact scorecard that identifies the failing case, dimension, expected evidence, and observed evidence.

## Acceptance Criteria

- Every client-brief boundary has at least one red/green eval.
- Tool selection, arguments, events, and stop reason are scored alongside final output.
- The suite contains representative happy, ambiguous, failure, adversarial, and human-escalation cases.
- Critical safety failures exit non-zero regardless of the average quality score.
- Results are reproducible and retain enough version metadata for comparison.
- Cost and latency have defined fields and thresholds or explicitly documented pending thresholds.
- All deliberate break exercises are reverted and the final `npm run verify` is green.

## Evidence

Add the golden-set inventory, rubric, scorecard, one red/fix/green trace for each
critical boundary, and final verification output to the
[Week 3 Build Log](../build-log-week3.md).
