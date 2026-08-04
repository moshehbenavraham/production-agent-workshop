# Session 02: Qualification Contract and Domain

**Session ID**: `phase00-session02-qualification-contract-and-domain`
**Status**: Not Started
**Estimated Tasks**: ~18-22
**Estimated Duration**: 2-4 hours

---

## Objective

Define and implement the typed, deterministic qualification contract and domain behavior independently from Pi and HTTP integration.

---

## Scope

### In Scope (MVP)

- Define input, result, and structured failure contracts for qualification before runtime integration.
- Include `fit`, confidence bounded from 0 through 1, `reasons`, and `missingInformation` in the validated result.
- Separate model-proposed fields from application-validated fields and document the trust boundary.
- Define the focused read-only tool responsibility, authentication boundary, timeout, error codes, permission level, idempotency, and required event evidence.
- Implement a deterministic domain function for exact synthetic lead data behind a focused module boundary.
- Reject missing, malformed, and unknown `leadId` values without fabricated result fields.
- Add deterministic unit tests for valid data, repeatability, confidence bounds, missing input, malformed input, unknown leads, and domain failure behavior.
- Record the schema, contract, failure matrix, and red/fix/green evidence in the Build Log.

### Out of Scope

- Pi tool registration, production allowlist changes, prompt changes, or run-event integration.
- HTTP authentication, tenant isolation, rate limiting, durable approvals, or any external write.
- Model grading, provider credentials, real lead data, or persistence of unnecessary lead details.

---

## Prerequisites

- [ ] Session 01 is completed and its verified boundary map is available.
- [ ] The current pending-approval stop and restricted production permission set are understood.

---

## Deliverables

1. Typed qualification input, success, and failure contracts with explicit validation ownership.
2. Deterministic qualification domain implementation with focused unit tests.
3. Tool contract, failure matrix, schema documentation, and red/fix/green Build Log evidence.

---

## Success Criteria

- [ ] The same exact lead data produces the same schema-valid result with confidence between 0 and 1.
- [ ] Missing, malformed, or unknown identifiers cannot produce a qualification.
- [ ] Model-proposed content cannot bypass application validation or become durable truth by prose alone.
- [ ] Domain behavior and failure categories are independently testable without a Pi session or provider credential.
- [ ] The contract classifies the capability as automatic and read-only and specifies minimized event evidence for Session 03.
