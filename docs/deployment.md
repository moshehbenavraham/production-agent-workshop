# Deployment

## Current Status

The Node.js 24 Docker image, health probe, process-wide `/runs` rate gate, and
offline JSONL snapshot/restore commands pass local and container validation.
No production Coolify URL, WAF, caller-access boundary, persistent restart,
off-server backup schedule, platform restore, rollback, or operator-access
path has been validated. The repository is not ready for public exposure or
real customer data.

The repository now provides a closed controlled-release preflight and decision
record. Policy validation does not prove target readiness; see the
[Controlled Release Contract](./release/controlled-release-contract.md).

## Local Service Check

Start the application:

```bash
npm start
```

From another terminal:

```bash
curl --fail http://127.0.0.1:3000/health
```

Stop the process with `Ctrl-C`.

## Local Container Check

The following bounded sequence builds the current image, verifies the endpoint
and Docker health status, and removes only its named validation artifacts:

```bash
docker build --tag production-agent-workshop:local .
docker run --detach \
  --name production-agent-workshop-local \
  --publish 127.0.0.1:3010:3000 \
  production-agent-workshop:local
curl --fail http://127.0.0.1:3010/health
docker inspect production-agent-workshop-local \
  --format '{{.State.Status}} {{.State.Health.Status}}'
docker rm --force --volumes production-agent-workshop-local
docker image rm production-agent-workshop:local
```

The expected endpoint body is `{"status":"ok"}` and the final running state
is `running healthy`. The Dockerfile probe checks the HTTP result and exact
status body every 30 seconds with a 5-second timeout, 10-second start period,
and three retries.

## CI/CD Pipeline

The Code Quality workflow enforces locked installation, formatting, linting,
and strict TypeScript. Build & Test compiles the repository, runs all tests
with coverage thresholds, and executes the durable 18-case critical eval gate.
Both run on pushes to `main` and pull requests. GitHub-managed CodeQL and
Dependabot are enabled.

Integration, Operations, release tagging, deploy, and post-deploy smoke
workflow bundles are not configured. A least-privilege Security workflow runs
full-history secret detection, pull-request dependency review, and locked-tree
audit alongside managed CodeQL. Run this full gate locally before treating a
revision as verified:

```bash
npm run verify
npm audit --audit-level=low
```

`npm run verify` exits non-zero for any deterministic critical mismatch,
invalid/failed case execution, or artifact persistence failure. The eval
artifact defaults to `./data/production-evals.jsonl`; set
`PRODUCTION_EVAL_LOG_PATH` to a controlled private path when release evidence
must be retained. The scorecard lists all 18 case statuses and bounded
expected-versus-observed evidence for failures. Pending quality, latency,
token, and cost thresholds do not waive a critical failure.

## Coolify Target Contract

When deployment is separately authorized, the repository evidence requires:

1. Build from the included `Dockerfile` and a verified revision.
2. Inject provider credentials only as Coolify secrets.
3. Set `EVENT_LOG_PATH=/app/data/events.jsonl` and
   `APPROVAL_LOG_PATH=/app/data/approvals.jsonl`.
4. Mount persistent storage at `/app/data` and verify both configured files
   survive a controlled container replacement before claiming persistence.
5. Expose container port 3000.
6. Confirm the Docker health probe and verify `/health` over the assigned HTTPS URL.
7. Configure bounded `RUN_DEADLINE_MS` and `RUN_MAX_STEPS` values for the
   measured provider/session envelope.
8. Configure bounded `RUN_RATE_LIMIT_MAX` and `RUN_RATE_LIMIT_WINDOW_MS` values
   for measured single-replica capacity.
9. Keep `/runs` controlled until authentication, authorization, tenant,
   shared rate-limit, edge-WAF, and data-lifecycle gates match the intended
   exposure.
10. Mount a private off-server backup destination outside `/app/data`, define
    stopped-writer ownership and a schedule, then validate a snapshot and
    restore into an absent staging destination before activation.

Region, sizing, DNS, HTTPS ownership, access policy, secret rotation, backup
destination, retention, recovery ownership, and monitoring require operator
decisions and are not stored in this repository.

Before any target mutation, submit only redacted finite facts to:

```bash
npm run preflight:release < redacted-release-evidence.json
```

The checked-in incomplete example exits 1 by design. Session 06 may begin only
when the selected authorized target returns `ready`; the command itself has no
deployment capability and never authorizes target mutation.

## Security Boundary

The application admits 10 `/runs` requests per 60-second process window by
default, returns `429` plus `Retry-After` after exhaustion, and leaves
`/health` outside the quota. The policy is deliberately global: it avoids
trusting spoofable forwarding headers before a trusted proxy and caller-
identity contract exist. It resets on restart and applies separately to each
replica, so it is not a distributed abuse-control or fairness boundary. Add
the deployment-owned WAF and shared per-principal policy before public access.

## Persistence And Backup

The container declares `/app/data`, and the repository now provides a bounded
offline snapshot/restore command for its direct JSONL files:

```bash
CONFIRM_WRITERS_STOPPED=true npm run backup:data -- /app/data /mounted/private-backups
CONFIRM_WRITERS_STOPPED=true npm run restore:data -- \
  /mounted/private-backups/snapshot-<timestamp>-<id> /app/restore-staging
```

Both operations require every writer to be stopped. Backup validates complete
LF-terminated object records, creates private copies plus a SHA-256 manifest,
and verifies the staged directory before activation. Restore revalidates the
closed manifest and every file, writes `0600` files under a new `0700`
directory, and refuses an existing destination. It deliberately does not swap
the restored directory into service.

A volume declaration and an in-container copy are not off-server backup
evidence. No destination, schedule, retention automation, production restore
drill, activation procedure, or per-record real-data erasure path is
configured. Keep data synthetic until those controls are implemented and
validated.

## Release And Rollback

- The version source is `package.json`; see the [versioning policy](./VERSIONING.md).
- No automated deployment or rollback workflow exists.
- A production release must preserve the verified image identifier and health,
  persistence, restore, and rollback evidence.
- Do not claim rollback readiness until a previous verified image is restored
  on the actual platform and its health and data state pass.

The current production-validation exception is recorded in
[Known Issues](../.spec_system/audit/known-issues.md). Security gates are in
[Security and Compliance](../.spec_system/SECURITY-COMPLIANCE.md).
