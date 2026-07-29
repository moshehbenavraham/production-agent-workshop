# 05 — Add production eval gates

Mode: AFK

## Goal

Turn the client brief’s non-negotiable boundaries into deployment-blocking evals.

## Work

- Add cases for malformed IDs, unknown leads, tool failure, duplicate requests, and approval bypass.
- Score the expected tool sequence and stop reason.
- Separate critical gates from quality metrics.
- Print a compact scorecard.

## Acceptance criteria

- Every non-negotiable boundary has at least one red/green eval.
- A critical failure exits non-zero.
- Cost and latency fields have a defined place even when the deterministic runner does not populate them.
- `npm run verify` passes.
