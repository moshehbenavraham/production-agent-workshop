# Task Checklist

**Session ID**: `phase02-session03-bounded-run-lifecycle`
**Total Tasks**: 19
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-11

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

---

## Setup (2 tasks)

- [x] T001 [S0203] Verify authoritative Phase 02 state, Session 02 and Phase 01 prerequisites, base commit, required toolchain, Pi session API, and green 198-test/5-eval baseline (`.spec_system/scripts/analyze-project.sh`, `.spec_system/scripts/check-prereqs.sh`, `package.json`, Pi SDK declarations)
- [x] T002 [S0203] Map Task `04`, current Pi composition/events/abort behavior, event and projection terminal contracts, tool attempt/outcome evidence, and the proven fake-send race pattern (`docs/todo/04-recovery-and-replay.md`, `src/pi-agent.ts`, `src/run-event.ts`, `src/run-projection.ts`, `src/tools.ts`, `src/fake-send-service.ts`)

---

## Foundation (5 tasks)

- [x] T003 [S0203] [P] Write contract-first RED tests for bounded configuration, step classification, stopped terminal variants, step metadata, lifecycle outcomes, freeze, and hostile replaceable values (`tests/run-lifecycle.test.ts`, `tests/run-event.test.ts`)
- [x] T004 [S0203] [P] Write deterministic RED race tests for normal completion, exact deadline, late resolve/reject, maximum steps, abort once, tool pairing, duplicate terminal, and event-storage failure (`tests/run-lifecycle.test.ts`)
- [x] T005 [S0203] Define closed run-bound configuration, consuming-event set, stop reasons, lifecycle result/failure, injected session/clock/timer/event contracts, and canonical guards (`src/run-lifecycle.ts`)
- [x] T006 [S0203] Extend the event envelope with bounded `run.stopped` terminals and nullable step metadata while preserving canonical defaults and exact discriminant matching (`src/run-event.ts`)
- [x] T007 [S0203] Extend deterministic projection rules for bounded stop terminals, compatible metadata, one-terminal invariants, and refusal of late or duplicate core evidence (`src/run-projection.ts`)

---

## Implementation (7 tasks)

- [x] T008 [S0203] Implement fail-fast bounded environment/application configuration before path resolution, store construction, resource/session creation, timers, or listeners (`src/run-lifecycle.ts`, `src/pi-agent.ts`)
- [x] T009 [S0203] Implement exact `turn_start` and `tool_execution_start` step charging, documented exclusions, per-event step metadata, and exact-limit decision behavior (`src/run-lifecycle.ts`)
- [x] T010 [S0203] Implement minimized Pi lifecycle normalization and universal tool call tracking with one correlated normal or synthetic stopped outcome per observed attempt (`src/run-lifecycle.ts`, `src/pi-agent.ts`)
- [x] T011 [S0203] Implement deadline/prompt/step/dependency coordination with one winner, one non-blocking abort request, timer/listener cleanup, and late-settlement suppression (`src/run-lifecycle.ts`)
- [x] T012 [S0203] Implement terminal-once append and structured completed/stopped result mapping that cannot trust provider prose or convert missing evidence, limits, timeout, or dependency failure to success (`src/run-lifecycle.ts`, `src/pi-agent.ts`)
- [x] T013 [S0203] Compose the existing exact three-tool Pi agent through injected lifecycle boundaries while keeping approval/fake-result authority and all same-run identities unchanged (`src/pi-agent.ts`)
- [x] T014 [S0203] Record step semantics, minimized attempt/outcome evidence, deadline and step timelines, terminal race proof, failure mapping, and provider-independent evidence (`docs/build-log-week3.md`)

---

## Testing And Completion (5 tasks)

- [x] T015 [S0203] Complete bound/guard, completion, deadline, same-tick race, late settlement, abort rejection, exact-limit, excluded-event, cleanup, duplicate-terminal, and malformed-bound tests (`tests/run-lifecycle.test.ts`)
- [x] T016 [S0203] Complete tool success/error/open-call synthesis, runId/callId/step/duration correlation, projection compatibility, terminal append/read/post-processing failure, and file-backed integration coverage (`tests/run-lifecycle.test.ts`, `tests/run-event.test.ts`, `tests/run-projection.test.ts`)
- [x] T017 [S0203] Preserve qualification timeout, fake-adapter timeout, approval, idempotency, event projection, exact three-tool permission, zero real-effect, and HTTP admission regressions (`tests/qualification-tool.test.ts`, `tests/fake-send-service.test.ts`, `tests/pi-agent.test.ts`, `tests/rate-limit.test.ts`, `tests/safe-write-application.test.ts`)
- [x] T018 [S0203] Update active tracking and Unreleased notes for bounded lifecycle completion without claiming replay, resume, retries, production eval gates, provider execution, or deployed behavior (`docs/TODO.md`, `docs/CHANGELOG.md`)
- [x] T019 [S0203] Run focused tests, strict types, formatting, full verification, coverage, dependency audit, production-agent verification, permission/data scans, ASCII/LF checks, and final session diff review (`src/run-lifecycle.ts`, `src/pi-agent.ts`, `package.json`)

---

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview` (next step in the implement -> creview -> validate sequence).

---

## Next Steps

Run the `implement` workflow step.
