# Task Checklist

**Session ID**: `phase00-session02-qualification-contract-and-domain`
**Total Tasks**: 20
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0002] Verify Apex state, prerequisites, Node.js 24.15.0, npm 12.0.2, and the green pre-session baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`)
- [x] T002 [S0002] Read Task `01`, Session 02, governance, current lead/tool code, tests, evals, and TypeBox schema compiler behavior (`docs/todo/01-qualification-contract.md`, `.spec_system/PRD/phase_00/session_02_qualification_contract_and_domain.md`, `.spec_system/CONVENTIONS.md`, `.spec_system/SECURITY-COMPLIANCE.md`, `src/`, `tests/`, `node_modules/typebox/readme.md`)
- [x] T003 [S0002] Record the canonical session-ID resolution, Pi-independent module boundary, qualification field ownership, and measurable checks (`.spec_system/specs/phase00-session02-qualification-contract-and-domain/spec.md`, `.spec_system/specs/phase00-session02-qualification-contract-and-domain/implementation-notes.md`)

---

## Foundation (5 tasks)

- [x] T004 [S0002] Write the qualification contract tests first and capture the expected missing-module RED result (`tests/qualification.test.ts`)
- [x] T005 [S0002] Extract synthetic lead type, fixtures, and exact lookup while preserving the existing compatibility export (`src/leads.ts`, `src/tools.ts`)
- [x] T006 [S0002] Define closed TypeBox input, fit, result, failure-code, failure, and outcome schemas with inferred static types (`src/qualification.ts`)
- [x] T007 [S0002] Compile and export runtime result and outcome validators with confidence-bound and additional-property enforcement (`src/qualification.ts`)
- [x] T008 [S0002] Define the exact lead-lookup dependency and structured failure construction without Pi, HTTP, provider, or persistence imports (`src/qualification.ts`)

---

## Implementation (7 tasks)

- [x] T009 [S0002] Implement raw input classification with schema-validated input and explicit missing, malformed, and invalid-input error mapping (`src/qualification.ts`)
- [x] T010 [S0002] Implement deterministic reason codes, missing-information codes, finite fit selection, and bounded confidence computation (`src/qualification.ts`)
- [x] T011 [S0002] Implement exact known and unknown lead outcomes with no partial qualification value on failure (`src/qualification.ts`, `src/leads.ts`)
- [x] T012 [S0002] Convert an injected thrown lookup into redacted `lead_lookup_failed` failure without friendly success prose (`src/qualification.ts`)
- [x] T013 [S0002] Reject result-shaped model-proposed extra fields before lookup and prove lookup is not called for invalid input (`src/qualification.ts`, `tests/qualification.test.ts`)
- [x] T014 [S0002] Document schema ownership, proposed-versus-validated fields, deterministic rules, and the qualification contract (`docs/build-log.md`)
- [x] T015 [S0002] Add the read-only `qualify_lead` permission, authentication, 1,000 ms timeout, error, idempotency, minimized event sequence, and failure matrix (`docs/build-log.md`)

---

## Testing (5 tasks)

- [x] T016 [S0002] Run the targeted qualification suite to GREEN and record the red/fix/green command and counts (`tests/qualification.test.ts`, `docs/build-log.md`)
- [x] T017 [S0002] Exercise a direct schema-validated known result plus missing, malformed, unknown, proposal-bypass, and thrown-lookup failures (`src/qualification.ts`, `docs/build-log.md`)
- [x] T018 [S0002] Run the complete TypeScript, deterministic test, and eval baseline under the required Node and npm toolchain (`package.json`, `tests/`, `src/evals.ts`)
- [x] T019 [S0002] Verify behavior scope, exact imports, no permission expansion, secret safety, ASCII/LF, relative links, and final diff (`src/`, `tests/`, `docs/`, `.spec_system/specs/phase00-session02-qualification-contract-and-domain/`)
- [x] T020 [S0002] Update active tracking, Unreleased notes, final Build Log evidence, and implementation handoff (`docs/TODO.md`, `docs/CHANGELOG.md`, `docs/build-log.md`, `.spec_system/specs/phase00-session02-qualification-contract-and-domain/implementation-notes.md`)

---

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview` (next step in the implement -> creview -> validate sequence).

---

## Next Steps

Run the `creview` workflow step.
