# Session Specification

**Session ID**: `phase00-session02-qualification-contract-and-domain`
**Phase**: 00 - Foundation
**Status**: Not Started
**Created**: 2026-08-04
**Base Commit**: 675d76b4e8960b035edcdd3e21deb1ab86f576e7

---

## 1. Session Overview

This session implements the typed, deterministic qualification contract and
domain behavior for Task `01` without exposing it to Pi or HTTP yet. It follows
the verified bounded-system map so schema ownership, trust boundaries, error
categories, permissions, and evidence are defined before runtime integration.

The work extracts synthetic lead lookup from the Pi tool module, adds closed
TypeBox schemas and application-owned runtime validators, and proves that exact
known data produces repeatable results while invalid, unknown, model-supplied,
or failed lookup inputs cannot become qualification truth. Session 03 will use
this contract through one focused read-only Pi tool.

---

## 2. Objectives

1. Define closed input, success, failure, and outcome schemas with a bounded
   confidence value and explicit application-validation ownership.
2. Implement deterministic qualification for exact synthetic lead data in a
   module that has no Pi, HTTP, provider, or persistence dependency.
3. Return structured actionable failures for missing, malformed, unknown,
   invalid-proposal, and injected lookup-failure paths without fabricated result
   fields.
4. Record the future read-only tool contract, minimized event sequence, failure
   matrix, and red/fix/green evidence before Session 03 integration.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-bounded-system-map` - provides the verified runtime,
  permission, persistence, and trust-boundary evidence.

### Required Tools Or Knowledge

- Node.js, npm, Git, TypeScript, TypeBox schema compilation, `node:test`, TSX,
  and the local Apex analysis and prerequisite scripts.
- Current synthetic fixture, custom tool, eval, and Build Log boundaries.

### Environment Requirements

- Select Node.js 24.15.0 or newer and npm 12.0.2 before verification; the
  required NVM toolchain is installed locally.
- Dependencies remain installed from the committed npm 12 lockfile.
- No provider credential, Pi session, network request, or real lead data is
  required.

---

## 4. Scope

### In Scope (MVP)

- Application can validate one exact `leadId` input before lookup - use a
  closed TypeBox object schema and explicit error mapping from `unknown`.
- Application can return a deterministic qualification containing `leadId`,
  `fit`, confidence from 0 through 1, `reasons`, and `missingInformation` -
  compute every field from application-owned synthetic data and fixed rules.
- Maintainer can distinguish success from structured failure - use a closed
  discriminated outcome with exhaustive codes and no partial result on failure.
- Maintainer can inject a lookup dependency for deterministic failure testing -
  catch and redact thrown lookup errors without converting them to success.
- Application can keep lead fixtures and lookup independent from Pi - move the
  fixture boundary to `src/leads.ts` while preserving current exports and
  behavior for existing callers.
- Workshop participant can inspect the future tool contract and event evidence
  before exposure - append the schema, permission, timeout, idempotency, errors,
  event sequence, test matrix, and red/green proof to `docs/build-log.md`.

### Out Of Scope (Deferred)

- Pi tool registration, custom-tool allowlist, prompt, session, run-event, and
  stop-reason changes - Reason: Session 03 owns the complete integration slice.
- HTTP request or response changes - Reason: the current endpoint remains the
  bounded orchestration entry point and Task `01` does not require a new route.
- Qualification persistence or durable projection - Reason: Session 03 adds
  minimized correlated evidence, while later phases own durable approval and
  replay state.
- Authentication, tenant isolation, rate limiting, provider credentials, real
  customer data, approval decisions, or external writes - Reason: later tasks
  own those controls and Phase 00 must not broaden permissions.

---

## 5. Technical Approach

### Architecture

Create `src/leads.ts` as the synthetic fixture and exact lookup boundary, then
keep `src/tools.ts` focused on Pi tool definitions while re-exporting the
existing lead API for compatibility. Create `src/qualification.ts` with closed
TypeBox schemas, compiled runtime validators, a deterministic result builder,
and `qualifyLead(input, lookup)` as the only raw-input entry point. The default
lookup uses `findLead`; tests may inject an equivalent function that returns no
lead or throws.

The result fit is a finite application enum, confidence is JSON-Schema-bounded
from 0 through 1, reasons and missing-information values are deterministic
application codes, and every object rejects additional properties. A model may
propose prose later, but no proposed field is accepted as validated input;
supplying result-shaped extras to the input contract returns structured
`invalid_input` failure.

### Design Patterns

- Schema-first contract: infer static TypeScript types from the same TypeBox
  schemas compiled for runtime checking.
- Discriminated outcome: return either `{ ok: true, value }` or
  `{ ok: false, error }` so failure cannot carry partial qualification fields.
- Dependency injection at the read boundary: inject only exact lead lookup to
  simulate unavailable storage without coupling domain rules to Pi or HTTP.
- Compatibility re-export: preserve `findLead` and `Lead` from `src/tools.ts`
  while moving ownership to `src/leads.ts`.
- Red/fix/green evidence: write contract tests first, capture the expected
  missing-module failure, implement the smallest domain slice, then capture the
  targeted and full green runs.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/leads.ts` | Synthetic lead type, fixtures, and exact lookup boundary | ~55 |
| `src/qualification.ts` | TypeBox schemas, validators, failure union, and deterministic qualification | ~180 |
| `tests/qualification.test.ts` | Contract, repeatability, bounds, refusal, bypass, and failure tests | ~170 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `src/tools.ts` | Import and compatibility re-export the extracted lead boundary | ~15 |
| `docs/build-log.md` | Append Task `01` schema, trust, tool, event, failure, red/green, and verification evidence | ~190 |
| `docs/TODO.md` | Track Session 02 implementation, review, validation, and completion state | ~2 |
| `docs/CHANGELOG.md` | Record the qualification contract and deterministic domain slice | ~2 |
| `.spec_system/PRD/phase_00/session_02_qualification_contract_and_domain.md` | Normalize the canonical session ID | ~1 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Closed TypeBox schemas define exact input, finite fit, bounded confidence,
  non-empty reasons, missing information, structured failures, and a
  discriminated outcome.
- [ ] The same exact known lead produces the same schema-valid result on every
  call with confidence between 0 and 1.
- [ ] Missing, malformed, unknown, additional-property, and thrown-lookup inputs
  return the documented failure code and contain no qualification value.
- [ ] Result-shaped model-proposed fields cannot pass the qualification input
  validator or bypass deterministic application computation.
- [ ] Existing lead inspection, drafting, approval, tests, evals, tool names,
  and runtime behavior remain compatible after fixture extraction.
- [ ] The future `qualify_lead` contract defines responsibility,
  authentication boundary, 1,000 ms timeout, error codes, permission,
  idempotency, and minimized attempt/outcome evidence.

### Testing Requirements

- [ ] At least nine deterministic qualification tests cover success,
  repeatability, schema bounds, missing input, malformed input, unknown lead,
  additional-property proposal bypass, lookup failure, and pre-lookup refusal.
- [ ] A red run fails for the missing qualification module before
  implementation and the same targeted command passes after implementation.
- [ ] `npm run verify` passes under Node.js 24.15.0 and npm 12.0.2 with all
  existing tests and evals plus the new qualification tests.

### Non-Functional Requirements

- [ ] No Pi registration, HTTP contract, event store, production allowlist,
  provider, persistence, dependency, or deployment behavior changes.
- [ ] Qualification output and documentation contain only synthetic identifiers
  and deterministic codes, with no credential or unnecessary personal data.
- [ ] Domain results and failures are deterministic, JSON-serializable, and
  independently executable without provider access.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows strict TypeScript and repository conventions.
- [ ] Behavioral quality spot-check has no high-severity trust-boundary,
  mutation, failure-path, or contract-alignment violation.
- [ ] Mermaid is used for the planned qualification event sequence.

---

## 8. Implementation Notes

### Working Assumptions

- `fit` is the closed application enum `strong`, `possible`, or `insufficient`:
  the task requires a typed fit field but does not prescribe labels, and these
  values express deterministic degrees without implying authorization.
- Reasons and missing-information entries are stable application codes rather
  than model prose so identical source data remains byte-for-byte repeatable
  and safe to validate.

### Conflict Resolutions

- The phase stub file name and analyzer candidate include `and`, while the
  stub's internal Session ID omitted it. The canonical session ID is normalized
  to `phase00-session02-qualification-contract-and-domain` so analyzer,
  directory, state, and prior dependency references agree.
- Task `01` requires one complete vertical slice, while Phase 00 intentionally
  splits schema/domain work from Pi integration. This session completes the
  independently testable contract; Session 03 is required to complete the
  runtime and event slice before the phase can finish.
- Lead fixtures currently live beside Pi tool definitions. Moving them to
  `src/leads.ts` is required for a Pi-independent domain boundary; a re-export
  preserves existing local imports and avoids unrelated behavior change.

### Key Considerations

- Treat all raw input, lookup results, and future model content as untrusted
  until the application validator accepts the exact contract.
- A structured failure remains failure even when its message is operator
  friendly; only `ok: true` may contain qualification fields.
- Do not persist qualification in this session or claim the planned tool/event
  contract is already active.

### Potential Challenges

- TypeBox static and runtime definitions can drift if hand-written types are
  added: infer types from schemas and test both valid and out-of-bounds values.
- Fixture extraction can create circular Pi dependencies: keep `src/leads.ts`
  free of imports and have `src/tools.ts` depend inward on it.
- A thrown lookup could leak implementation details: return a stable redacted
  `lead_lookup_failed` failure and test that the thrown message is absent.

### Relevant Considerations

- [P00] **Bounded architecture**: qualification stays outside HTTP and Pi, and
  no new runtime permission is exposed in this session.
- [P00] **Typed handoffs**: the discriminated outcome is durable application
  truth; raw model prose is never used as the contract.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- Untrusted or result-shaped input bypasses the closed input validator.
- Failure paths accidentally return partial success fields or leak a thrown
  lookup message.
- Moving lead fixtures changes current tool, draft, approval, test, or eval
  behavior through an import or compatibility regression.

---

## 9. Testing Strategy

### Unit Tests

- Use `node:test` and `node:assert/strict` to verify known-lead schema validity,
  deterministic equality, confidence bounds, every failure code, absent partial
  values, redacted thrown errors, and proposal-shaped extra-field rejection.

### Integration Tests

- Run all existing tool and event-store tests plus deterministic evals to prove
  fixture extraction preserves the bounded baseline. Pi/provider integration
  remains intentionally absent until Session 03.

### Runtime Verification

- Execute `qualifyLead({ leadId: "lead_ada" })` directly under TSX, print the
  JSON outcome, validate it with the compiled outcome schema, and record the
  exact provider-independent output in the Build Log.

### Edge Cases

- `undefined`, empty object, empty or whitespace identifier, invalid pattern,
  extra result-shaped properties, unknown exact identifier, throwing lookup,
  confidence below 0, confidence above 1, and repeated identical input.

---

## 10. Dependencies

### Other Sessions

- Depends on: `phase00-session01-bounded-system-map`.
- Depended by: `phase00-session03-qualification-tool-integration`.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
