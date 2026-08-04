# Task Checklist

**Session ID**: `phase00-session01-bounded-system-map`
**Total Tasks**: 18
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0001] Verify deterministic project state and environment prerequisites (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`)
- [x] T002 [S0001] Read the client brief, repository entry point, and all linked governance (`docs/todo/client-brief.md`, `AGENTS.md`, `.spec_system/CONSIDERATIONS.md`, `.spec_system/CONVENTIONS.md`, `.spec_system/SECURITY-COMPLIANCE.md`)
- [x] T003 [S0001] Inspect runtime, tests, evals, and deployment boundaries (`src/`, `tests/`, `package.json`, `Dockerfile`, `.env.example`)

---

## Foundation (6 tasks)

- [x] T004 [S0001] Create the Task `00` Build Log structure and evidence conventions (`docs/build-log.md`)
- [x] T005 [S0001] Document the repository-guidance map and highest-cost guardrail (`docs/build-log.md`)
- [x] T006 [S0001] Create the eight-boundary Mermaid architecture map with source ownership (`docs/build-log.md`)
- [x] T007 [S0001] Create the three-path Mermaid request trace for success, unknown lead, and thrown error (`docs/build-log.md`)
- [x] T008 [S0001] Record ownership, persistence, external dependency, and data-egress evidence (`docs/build-log.md`)
- [x] T009 [S0001] Map Pi SDK integration points and harness enforcement to exact source (`docs/build-log.md`)

---

## Evidence Pack (5 tasks)

- [x] T010 [S0001] Define the smallest useful product boundary and validated output contract (`docs/build-log.md`)
- [x] T011 [S0001] Write the Harness Decision Record with roles, stop conditions, state, and success evidence (`docs/build-log.md`)
- [x] T012 [S0001] Classify current and proposed actions as automatic, approval-required, or forbidden (`docs/build-log.md`)
- [x] T013 [S0001] Add a production risk register with later task ownership and least-complexity rationale (`docs/build-log.md`)
- [x] T014 [S0001] Add the five-sentence stop-boundary explanation (`docs/build-log.md`)

---

## Verification (4 tasks)

- [x] T015 [S0001] Run and record the complete provider-independent baseline (`npm run verify`, `docs/build-log.md`)
- [x] T016 [S0001] Exercise and record exact unknown-lead refusal evidence (`src/tools.ts`, `docs/build-log.md`)
- [x] T017 [S0001] Verify tool allowlist, absence of send implementation, links, ASCII, and LF requirements (`src/pi-agent.ts`, `src/tools.ts`, `docs/build-log.md`)
- [x] T018 [S0001] Update active tracking and release notes, then review the final session diff (`docs/TODO.md`, `docs/CHANGELOG.md`)

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
