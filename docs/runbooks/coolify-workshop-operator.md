# Coolify Workshop Operator Guide

You are responsible for this workshop service. The agent can qualify the
synthetic lead `lead_ada`, draft a follow-up, create a pending approval, and
stop. It cannot send, approve, deploy, restore, or roll back anything. Keep
`/runs` behind the existing access gate and never use customer data.

## Normal Check

1. Open the application in Coolify. It must say `running:healthy`.
2. Open `/health` through the controlled HTTPS address. With the workshop
   login it must return `{"status":"ok"}`; without the login it must return
   401.
3. If either check fails, stop. Do not start a run.

For a local release check, run:

```bash
npm run verify
npm audit --audit-level=low
npm run preflight:release < docs/fixtures/release-preflight-current-target.json
```

All three commands must exit 0. The preflight output must say `ready` and
`targetMutationAllowed: false`.

## Deploy, Pause, And Restart

- **Deploy:** Keep automatic deploy off. In Coolify, select the saved full Git
  commit, then start one manual deployment. Do not use a branch head or force a
  rebuild. Accept it only when the deployment finishes, the package matches the
  saved commit, and health is green.
- **Pause:** Click **Stop** in Coolify. Confirm the application is stopped before
  backup, storage work, or incident inspection.
- **Restart:** Use **Restart** only for a healthy known revision. Afterward,
  repeat the normal check and confirm one saved run still reports the same
  state. A restart is not a fix for corrupt data or an unknown revision.

## Find One Run

Keep the `runId` and file path private. On an authorized machine with a copy of
the event file, replace the quoted examples with the private values and run:

```bash
npm run report:run -- --run-id "PASTE_PRIVATE_RUN_ID_HERE" --event-log "/absolute/private/events.jsonl" --format text
```

The report is read-only. It must show a complete timeline and one clear stop
reason. Never paste a private run ID, full draft, event file, or approval file
into an issue, chat, screenshot, or repository.

## Choose The Next Action

| What you see | What you do |
|--------------|-------------|
| Temporary provider or tool failure; no effect started | One bounded retry |
| Saved checkpoint with exact valid evidence | Use the documented internal resume path |
| Pending approval | Wait for a human; do not retry or claim a send |
| Corrupt, incomplete, conflicting, or unknown evidence | Stop and preserve files for review |
| Any effect may have started | Stop and get a human; do not replay |
| Repeated failure or unclear authority | Pause the service and get a human |

The current HTTP service has no public approval decision and no send route.
Compensation is not available because this workshop never performs an effect.

## Backup, Restore, And Roll Back

- **Backup:** Stop the application first. Use the proved stopped-writer snapshot
  procedure in [Deployment](../deployment.md#persistence-and-backup), copy the
  finished snapshot to the private local workstation, then remove the temporary
  server copy. Keep it for 30 days or until workshop teardown.
- **Restore:** Restore only into a new absent directory, validate the manifest
  and checksums, and start a local service against that directory first. Never
  overwrite the active volume or edit JSONL records.
- **Roll back:** In Coolify, select the saved full verified commit and deploy it
  without forcing a rebuild. Confirm package, health, prior state, and one
  synthetic pending-approval smoke. If any check fails, keep the service paused.

## Secrets And Human Takeover

Change provider keys and the workshop login only in Coolify's secret settings,
then manually redeploy and revoke the old values. Never print or commit them.

A human must take over for every approval, secret change, deploy, pause,
backup, restore, rollback, uncertain effect, damaged evidence, access change,
or request to use real data. When unsure: stop, preserve the evidence, and ask.
