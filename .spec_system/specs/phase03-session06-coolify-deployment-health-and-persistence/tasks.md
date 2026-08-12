# Task Checklist

**Session ID**: `phase03-session06-coolify-deployment-health-and-persistence`
**Total Tasks**: 14
**Estimated Duration**: 2-4 hours
**Created**: 2026-08-12

---

Legend: `[x]` completed; `[ ]` pending; `[P]` parallelizable; `[S0306]` session ref; `TNNN` task ID.

---

## Setup (3 tasks)

- [x] T001 [S0306] Verify Apex state, repository prerequisites, and private operator environment (`.spec_system/scripts/analyze-project.sh`, `.env.example`)
- [x] T002 [S0306] Verify the exact release revision with repository gates (`package.json`, `Dockerfile`)
- [x] T003 [S0306] Verify authorized Coolify API, application, and isolated environment access without exposing identifiers (`docs/fixtures/release-preflight-current-target.json`)

## Foundation (3 tasks)

- [x] T004 [S0306] Confirm provider secret presence and provider API access without reading or logging the credential (`.env.example`)
- [x] T005 [S0306] Confirm bounded runtime paths, one replica, named persistence, port, and health mode (`docs/environments.md`)
- [x] T006 [S0306] Deploy the exact reviewed revision and record only redacted revision and image evidence (`docs/build-log-week4.md`)

## Implementation (5 tasks)

- [x] T007 [S0306] Verify controlled HTTPS access, anonymous denial, Docker health, and Sentinel monitoring (`docs/deployment.md`)
- [x] T008 [S0306] Execute one provider-backed synthetic known-lead smoke run ending at `approval_pending` (`docs/build-log-week4.md`)
- [x] T009 [S0306] Validate the smoke run event order, grounded qualification, pending approval, and no-send output (`docs/build-log-week4.md`)
- [x] T010 [S0306] Replace the application container while preserving the named data volume (`docs/build-log-week4.md`)
- [x] T011 [S0306] Compare exact run events and durable approval state before and after replacement (`docs/build-log-week4.md`)

## Testing And Evidence (3 tasks)

- [x] T012 [S0306] Update redacted target preflight and remove resolved deployment exceptions (`docs/fixtures/release-preflight-current-target.json`, `.spec_system/audit/known-issues.md`)
- [x] T013 [S0306] Synchronize deployment and environment documentation with the verified controlled target (`docs/deployment.md`, `docs/environments.md`)
- [x] T014 [S0306] Run full verification, preflight, secret scan, ASCII/LF checks, and final diff review (`package.json`, `.spec_system/SECURITY-COMPLIANCE.md`)

---

## Completion Checklist

- [x] All tasks marked `[x]`.
- [x] All tests and checks passing.
- [x] All files ASCII-encoded with LF line endings.
- [x] `implementation-notes.md` updated.
- [x] Ready for `creview` (next step in the `implement -> creview -> validate` sequence).

---

## Next Steps

Run the `creview` workflow step.
