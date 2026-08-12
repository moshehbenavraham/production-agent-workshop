# Task Checklist

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Total Tasks**: 18
**Estimated Duration**: 2-4 hours
**Created**: 2026-08-12

---

Legend: `[x]` completed; `[ ]` pending; `[S0307]` session ref; `TNNN` task ID.

## Setup (3 tasks)

- [x] T001 [S0307] Verify Apex state, clean base revision, tools, private operator configuration, and Session 06 prerequisite
- [x] T002 [S0307] Confirm the local workstation destination, manual cadence, retention, ownership, and outside-VPS boundary without exposing its path
- [x] T003 [S0307] Record the exact active revision/image and the bounded pre-fix failure revision before target mutation

## Backup And Restore Foundation (5 tasks)

- [x] T004 [S0307] Stop every Coolify application writer and verify the pause boundary
- [x] T005 [S0307] Create and validate one private stopped-writer snapshot through the repository CLI
- [x] T006 [S0307] Copy the snapshot off the VPS into the private local destination and preserve private modes
- [x] T007 [S0307] Restore the local snapshot into a new absent staging directory and revalidate its manifest, files, modes, checksums, and records
- [x] T008 [S0307] Compare the restored run and pending approval projections with the pre-snapshot source evidence

## Restore Activation (3 tasks)

- [x] T009 [S0307] Start the service locally with event and approval paths pointing at the validated restored directory
- [x] T010 [S0307] Verify local health and query the preserved prior run through the safe report path without mutating records
- [x] T011 [S0307] Record recovery point, elapsed stages, retained source, and intentionally unavailable or manual production steps

## Reversible Failure And Rollback (5 tasks)

- [x] T012 [S0307] Restart the current Coolify service and verify baseline image, health, access, and durable state
- [x] T013 [S0307] Attempt the bounded pre-fix revision, then use the unresolvable-revision fallback when current provider behavior no longer reproduces the failure
- [x] T014 [S0307] Detect the safe deployment failure through Coolify status and preserve a redacted timeline
- [x] T015 [S0307] Restore the exact last verified revision through the authorized Coolify boundary
- [x] T016 [S0307] Verify restored source/package, reserved image tag, Docker health, prior access configuration, provider smoke, and prior durable state

## Documentation And Verification (2 tasks)

- [x] T017 [S0307] Synchronize Week 4, deployment, environment, release, TODO, changelog, and known-issue evidence
- [x] T018 [S0307] Run complete verification, coverage, audit, incident drills, preflight, privacy, ASCII/LF, and final diff checks

## Completion Checklist

- [x] All 18 tasks marked `[x]`.
- [x] Source volume and off-server snapshot remain preserved.
- [x] Restore activation and rollback evidence pass without private values.
- [x] All repository gates pass.
- [x] Ready for `creview`.

## Next Steps

Run the `creview` workflow step.
