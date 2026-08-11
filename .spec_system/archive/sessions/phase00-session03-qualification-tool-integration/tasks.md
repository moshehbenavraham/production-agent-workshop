# Task Checklist

**Session ID**: `phase00-session03-qualification-tool-integration`
**Total Tasks**: 23
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0003] Verify Apex state, completed prerequisites, exact base commit, Node.js 24.15.0, npm 12.0.2, and the green pre-session baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`)
- [x] T002 [S0003] Read Task `01`, Session 03, governance, Session 01/02 handoffs, current Pi/tool/event/test/eval code, and pinned Pi `defineTool` execution declarations (`docs/todo/01-qualification-contract.md`, `.spec_system/PRD/phase_00/session_03_qualification_tool_integration.md`, `.spec_system/specs/phase00-session02-qualification-contract-and-domain/`, `src/`, `tests/`, `node_modules/@earendil-works/pi-coding-agent/dist/core/extensions/types.d.ts`)
- [x] T003 [S0003] Record exact-run binding, production/test deadline behavior, invalid pre-run versus started-run failure ownership, downstream evidence gates, and measurable completion checks (`.spec_system/specs/phase00-session03-qualification-tool-integration/spec.md`, `.spec_system/specs/phase00-session03-qualification-tool-integration/implementation-notes.md`)

---

## Foundation (5 tasks)

- [x] T004 [S0003] Write contract-first qualification-tool and run-projection tests and capture the expected RED result before integration symbols exist (`tests/qualification-tool.test.ts`, `tests/pi-agent.test.ts`)
- [x] T005 [S0003] Export centralized qualification failure construction for wrapper-owned timeout and redacted dependency failures without duplicating schema semantics (`src/qualification.ts`)
- [x] T006 [S0003] Implement the raw application qualification wrapper with exact requested-lead binding, a 1,000 ms default deadline, timer cleanup, rejected/invalid executor redaction, late-result suppression, and one attempted plus one terminal event (`src/tools.ts`)
- [x] T007 [S0003] Define the focused `qualify_lead` Pi tool with `QualificationInputSchema`, structured JSON content, typed outcome details, and the application wrapper execution path (`src/tools.ts`)
- [x] T008 [S0003] Implement validated latest-terminal event projection and exact-lead qualification gating for downstream consumers, failing closed on missing or corrupt evidence (`src/tools.ts`, `tests/qualification-tool.test.ts`)

---

## Implementation (9 tasks)

- [x] T009 [S0003] Replace `inspect_lead` with `qualify_lead` in the exact three-tool tuple without adding any runtime capability (`src/tools.ts`)
- [x] T010 [S0003] Require latest matching qualification success before deterministic draft creation and emit no draft event on missing, failed, or cross-lead evidence (`src/tools.ts`, `tests/qualification-tool.test.ts`)
- [x] T011 [S0003] Require latest matching qualification success before pending approval creation while leaving durable decision and exact draft linkage deferred (`src/tools.ts`, `tests/qualification-tool.test.ts`)
- [x] T012 [S0003] Update the bounded system prompt and export/use the immutable exact production allowlist containing only `qualify_lead`, `draft_follow_up`, and `request_send_approval` (`src/pi-agent.ts`, `tests/pi-agent.test.ts`)
- [x] T013 [S0003] Add typed qualification to `RunResult` and derive `not_found`, `qualification_failed`, `completed`, or `approval_pending` from validated terminal evidence with failure precedence (`src/pi-agent.ts`, `tests/pi-agent.test.ts`)
- [x] T014 [S0003] Fail visibly when no valid qualification terminal evidence exists and replace failure-path assistant prose with the application-owned structured failure message (`src/pi-agent.ts`, `tests/pi-agent.test.ts`)
- [x] T015 [S0003] Replace inspection evals with deterministic qualification success, refusal, schema, draft, and pending-approval assertions (`src/evals.ts`)
- [x] T016 [S0003] Complete Task `01` runtime contract, minimized event sequence, failure matrix, test matrix, and sub-60-second vertical-slice evidence (`docs/build-log.md`)
- [x] T017 [S0003] Update implemented security posture, active tracking, and Unreleased notes without claiming later approval, recovery, exposure, or Phase 01 work (`.spec_system/SECURITY-COMPLIANCE.md`, `docs/TODO.md`, `docs/CHANGELOG.md`)

---

## Testing (6 tasks)

- [x] T018 [S0003] Run the targeted tool and Pi-projection suites to GREEN and record the same RED/GREEN commands and exact counts (`tests/qualification-tool.test.ts`, `tests/pi-agent.test.ts`, `docs/build-log.md`)
- [x] T019 [S0003] Exercise success, missing, malformed, cross-lead, unknown, thrown, rejected, invalid-result, timeout, late-result, repeated-call, and corrupted-event cases with no dangling timer or duplicate terminal evidence (`src/tools.ts`, `tests/qualification-tool.test.ts`)
- [x] T020 [S0003] Execute the deterministic known-lead vertical slice plus pre-qualification, post-failure, and cross-lead bypass attempts; prove one `runId`, minimized order, `approval_pending`, and no send (`tests/qualification-tool.test.ts`, `tests/pi-agent.test.ts`, `docs/build-log.md`)
- [x] T021 [S0003] Run strict TypeScript, all deterministic tests, and all evals under the required Node and npm toolchain (`package.json`, `tests/`, `src/evals.ts`)
- [x] T022 [S0003] Run the production-agent verification workflow, dependency audit, exact allowlist and capability scans, credential/data minimization review, ASCII/LF and link checks, and Behavioral Quality checklist (`.agents/skills/verify-production-agent/SKILL.md`, `.spec_system/SECURITY-COMPLIANCE.md`, `src/`, `tests/`, `docs/`)
- [x] T023 [S0003] Re-read the complete base-commit diff, update final evidence and handoff, and confirm Task `01` is complete while Phase 01 planning remains absent (`.spec_system/specs/phase00-session03-qualification-tool-integration/implementation-notes.md`, `docs/build-log.md`, `docs/TODO.md`, `docs/CHANGELOG.md`)

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
