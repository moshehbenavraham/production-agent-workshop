# Task Checklist

**Session ID**: `phase01-session06-safe-write-integration-and-evidence`
**Total Tasks**: 21
**Estimated Duration**: 3-4 hours
**Created**: 2026-08-04

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[SNNMM]` session ref; `TNNN` task ID.

## Setup And RED Matrix (4 tasks)

- [x] T001 [S0106] Verify clean pushed Session 05 base, Apex state, Node/npm toolchain, 140-test baseline, zero-vulnerability audit, and exact production allowlist
- [x] T002 [S0106] Read Task `03`, Session 06 PRD, approval/fake-send/store/event/runtime contracts, and Session 05 handoff; map full composition and permission cutoff
- [x] T003 [S0106] Add RED internal-composition contract tests before implementation (`tests/safe-write-application.test.ts`)
- [x] T004 [S0106] Add RED complete Task `03` path/evidence tests, including accepted, rejected, timeout, duplicate/restart, downstream, and every pre-effect refusal

## Internal Composition And Permission Contract (5 tasks)

- [x] T005 [S0106] Define closed application paths/options and a frozen explicit no-registration/no-allowlist permission decision (`src/safe-write-application.ts`)
- [x] T006 [S0106] Compose shared event/approval stores, approval service, exact fake authorizer, result store, and deterministic fake adapter once per application instance
- [x] T007 [S0106] Delegate approval request/decision/read/list and fake execution through one internal application boundary without duplicating domain policy
- [x] T008 [S0106] Snapshot approval/execution actor sets and contain mutable configuration so post-construction callers cannot expand authorization
- [x] T009 [S0106] Confirm source/runtime imports leave the internal application unreachable from Pi tools and HTTP routes and preserve the exact production allowlist

## End-To-End Task 03 Proof (7 tasks)

- [x] T010 [S0106] Prove valid approval and exact target create matching durable accepted result/evidence with one fake effect
- [x] T011 [S0106] Prove missing input and malformed or mismatched target fail before claim/effect
- [x] T012 [S0106] Prove pending and declined approvals produce distinct typed refusals and zero effects
- [x] T013 [S0106] Prove application timeout aborts, persists one terminal timeout, and suppresses late settlement
- [x] T014 [S0106] Prove duplicate execution through a new application instance returns the exact original with one total effect and unchanged result line count
- [x] T015 [S0106] Prove unauthorized operator is denied before approval read/effect and records only minimized permission evidence
- [x] T016 [S0106] Prove rejected and thrown/rejected/malformed downstream paths persist exact canonical terminal results and matching minimized events

## Evidence, Verification, And Completion (5 tasks)

- [x] T017 [S0106] Record the permission/tool/diff review as not human-reviewed, name the repository-maintainer gate, and decide to keep fake/write capability unregistered and unallowlisted
- [x] T018 [S0106] Complete Task `03` Week 2 contract, permission table, stable-key proof, test matrix, redacted event samples, failure exercise, verification output, and final diff review
- [x] T019 [S0106] Update architecture, development/environment guidance, README, TODO, and changelog to the validated internal-only Phase 01 behavior
- [x] T020 [S0106] Run focused/full tests and evals, formatter/types, dependency audit, production-agent verification, persistence/permission/capability/content/credential scans, and ASCII/LF checks
- [x] T021 [S0106] Inspect every base diff and untracked file, record implementation evidence/remaining risks, and confirm next command `creview` with no Phase 02 artifact

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All text files ASCII with LF endings.
- [x] `implementation-notes.md` records RED/GREEN, end-to-end evidence, permission decision, verification, and strict cutoff.
- [x] Ready for `creview` in the required workflow sequence.

## Next Steps

Session 06 is complete. Run only the Phase 01 closeout workflows: `audit`,
`pipeline`, `infra`, `carryforward`, and `documents`. Do not run `phasebuild` or
create Phase 02 artifacts.
