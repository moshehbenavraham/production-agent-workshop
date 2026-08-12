# Implementation Notes

**Session ID**: `phase03-session07-off-server-restore-and-rollback`
**Started**: 2026-08-12 10:18
**Last Updated**: 2026-08-12 10:44

---

## Session Progress

| Metric | Value |
|--------|-------|
| Tasks Completed | 18 / 18 |
| Estimated Remaining | 0 hours |
| Blockers | 0 |

## Task Log

### T001 - Verify state and prerequisites

- Apex analyzer selected Session 07 after completed Session 06.
- Prerequisite script passed for the spec system, jq, and Git.
- Private `.env` is mode `0600`, required values are present, and no value was printed.
- Session base is clean pushed commit `aa5d54d35720ea2eb3fdb3a0d58ab832db35ca93` before planning artifacts.

### T002 - Confirm the private local destination

- The workshop owner is recorded as the responsible person for all recovery duties.
- The backup directory is outside the repository and outside the VPS boundary.
- Its mode is `0700`; one earlier private snapshot is retained.
- Manual before/after-demo cadence and 30-day-or-teardown retention are configured.
- Paid remote object storage and geographic redundancy remain intentionally out of scope.

### T003 - Record the rollback boundaries

- Coolify API authentication returned 200 after honoring quoted dotenv values.
- The application is `running:healthy`, Dockerfile-built, on port 3000, and runs the exact Session 06 verified revision.
- The last verified revision is `52df37a96a76afc1d82656ef04e0922aa42e9b16`.
- The bounded failure revision is its direct parent, `6702306bf2241f49b9a3639bed7b84e4749016b9`, which predates the observed provider identifier compatibility fix.
- Storage, access, secrets, and replica settings will remain unchanged.

### T004-T006 - Reuse the direct stopped-writer off-server snapshot

- A direct exercise earlier on 2026-08-12 stopped the sole Coolify writer,
  confirmed zero remaining volume writers, and created a repository-CLI snapshot.
- The snapshot was copied from the server to the private owner workstation,
  validated there, and the temporary server copy was removed.
- The active source volume remained intact and the application returned healthy.
- A proposed repeat stopped before pausing the app because the Coolify server is
  registered as `host.docker.internal`, which is not a workstation SSH address.
  No target state changed during that refused repeat.

### T007-T008 - Restore and project the saved state

- Restore targeted a new absent directory under the private local backup root.
- Result: 2 files, 64 valid JSONL records, 44,018 bytes, exact manifest and
  checksums, `0700` directory, and `0600` files.
- Restore command elapsed time: 227 ms.
- The safe report rebuilt the exact saved run as `waiting_for_approval` and the
  approval store rebuilt exactly one pending approval.

### T009-T011 - Activate the restored copy locally

- A local service used only the restored event and approval paths.
- Health returned 200 after 1,259 ms; restore plus start-to-health measured
  1,486 ms, excluding operator selection time between commands.
- The safe report and approval projection passed, and post-activation checksums
  proved that the read-only exercise did not mutate either restored file.
- Recovery point is the snapshot creation time. Snapshot age at restore was
  1,962 seconds.
- Source snapshot and restored staging copy remain preserved. A destructive
  production-volume swap was not exercised and remains intentionally out of scope.

### T012 - Re-establish the verified Coolify baseline

- An automatic branch-head deployment was discovered after the Session 06 push.
  Automatic deploy was disabled through the Coolify API before the drill.
- The verified revision was deployed with a temporary internal check. It proved
  the saved run and pending approval still existed, then completed a fresh
  provider-backed run at `approval_pending` with the canonical no-send output.
- Baseline deployment completed in 51,531 ms.

### T013-T014 - Trigger and detect a reversible failure

- The historical pre-fix revision was tried first. It passed after 103,413 ms
  because current provider output no longer reproduced the old identifier form.
- The deterministic fallback used a well-formed but nonexistent 40-character
  revision. Coolify rejected that deployment in 3,422 ms before replacement;
  storage, secrets, access, replica count, and the healthy container were unchanged.
- Detection authority was the failed Coolify deployment status. No raw build log
  or target identifier entered repository evidence.

### T015-T016 - Restore and verify the release

- Coolify restored the exact verified revision with a non-force cached build in
  67,550 ms.
- The internal verification checked the saved run, saved pending approval, one
  new grounded provider run, `approval_pending`, and canonical no-send output.
- A separate container-side package probe proved version `0.1.36`, which binds
  the running source to the exact verified revision despite misleading branch-
  head values in the deployment list.
- Coolify reports `running:healthy`; the original controlled access, single
  replica, secret, volume, and health configuration remained unchanged.
- Coolify 4.0.0-beta.463 does not provide its later read-only rollback-image API.
  The directly recorded immutable digest remains reserved, and the same commit
  tag was deployed without force, but digest reinspection is unavailable through
  the current API token.
- The temporary post-deployment check was removed. Automatic deploy remains off.

### T017 - Synchronize recovery documentation

- Week 4 now records the backup boundary, restore and activation measurements,
  changed provider behavior, deterministic fallback, rollback time, source
  package probe, health, and API limitation.
- Deployment and environment guides now describe the local-workstation workshop
  backup and manual retention without suggesting paid storage is required.
- The release contract and known issue retain destructive activation,
  production redundancy, and digest reinspection as unsupported.
- TODO, changelog, `.env.example`, and the private owner environment now agree
  that automatic Coolify deployment is disabled.

### T018 - Run the complete session gate

- `npm run verify`: PASS - format, lint, strict types, 374 tests, 18 evals.
- `npm run test:coverage`: PASS - 97.88% lines, 86.31% branches,
  98.43% functions.
- `npm audit --audit-level=low`: PASS - zero vulnerabilities.
- `npm run drill:incidents`: PASS - five of five drills.
- Current-target preflight: PASS - all 15 checks, target mutation false.
- Final Coolify inspection: PASS - exact configured revision,
  `running:healthy`, temporary hook absent.
- Tracked/untracked text scan: PASS - no secret pattern, non-ASCII content,
  CRLF content, or diff whitespace error.
- Private `.env`: mode `0600`; final operator fields present.

## Session Summary

- Proved the workshop backup exists outside the server and activates locally.
- Measured exact restore and service-start times without inventing RTO/RPO claims.
- Detected a provider-dependent historical test that no longer reproduced and
  used a deterministic non-destructive deployment failure instead.
- Restored the exact verified package and confirmed prior state plus new safe
  provider behavior through Coolify.
- Disabled automatic branch-head deploys and retained the current platform's
  digest-reinspection limitation explicitly.
