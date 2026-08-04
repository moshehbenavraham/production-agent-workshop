# Deployment

## Current Status

The Node.js 24 Docker image and its health probe pass local validation. No
production Coolify URL, persistent restart, backup restore, rollback, or
operator-access path has been validated. The repository is not ready for public
exposure or real customer data.

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

The repository Code Quality workflow runs on pushes to `main` and pull
requests. It installs with `npm ci`, checks Biome formatting, and runs strict
TypeScript. GitHub-managed CodeQL and Dependabot are enabled.

Build & Test, full Security, Integration, Operations, release tagging, deploy,
and post-deploy smoke workflows are not configured. Run this full gate locally
before treating a revision as verified:

```bash
npm run verify
npm audit --audit-level=low
```

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
7. Keep `/runs` controlled until authentication, authorization, tenant,
   rate-limit, and data-lifecycle gates match the intended exposure.

Region, sizing, DNS, HTTPS ownership, access policy, secret rotation, backup
destination, retention, recovery ownership, and monitoring require operator
decisions and are not stored in this repository.

## Persistence And Backup

The container declares `/app/data`, but a volume declaration is not backup or
restore evidence. The only current retention/deletion control is the manual
synthetic 30-day-or-teardown whole-file rule. There is no configured backup
schedule, external storage, restore drill, or per-record real-data erasure path.
Keep data synthetic until those controls are implemented and validated.

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
