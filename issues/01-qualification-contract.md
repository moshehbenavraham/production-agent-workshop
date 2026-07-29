# 01 — Make qualification explicit

Mode: AFK

## Goal

Replace implicit model judgment with a typed qualification result.

## Work

- Define a qualification schema with `fit`, `confidence`, `reasons`, and `missingInformation`.
- Add a deterministic domain function that produces the baseline result.
- Expose it through one typed Pi tool.
- Add lifecycle events without storing unnecessary personal data.

## Acceptance criteria

- Unknown leads cannot receive a qualification.
- Confidence is bounded from 0 to 1.
- The result is independently unit-tested.
- `npm run verify` passes.
