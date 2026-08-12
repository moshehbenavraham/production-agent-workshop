# Known Issues

Intentional exceptions to automated checks. Every entry records why it is
exempt and when it was added. Remove entries that no longer apply.

## Ignored Paths

| Pattern | Reason | Added |
|---------|--------|-------|

## Ignored Rules

| Tool | Rule | Scope | Reason | Added |
|------|------|-------|--------|-------|

## Known Failing Tests

| Test | Reason | Added |
|------|--------|-------|

## Skipped Workflows

| Workflow | Reason | Added |
|----------|--------|-------|

## Skipped Infra

| Item | Reason | Added |
|------|--------|-------|
| Production Health validation | The authorized controlled Coolify target, Dockerfile health check, Sentinel monitor, external HTTPS health, anonymous-denial boundary, provider API access, and provider-backed smoke passed on 2026-08-12. The workshop owner owns the health check. A workstation path was repeatedly reset during TLS before reaching the VPS while the public hostname still returned the expected controlled response from the VPS; stable access from that workstation path remains unverified. | 2026-08-04 |
| Production Security validation | The controlled edge now requires HTTP Basic Authentication and denies anonymous `/health` and `/runs`, but public authorization, tenant isolation, trusted identity, shared per-principal rate state, WAF policy, secret rotation, and revocation remain unverified. Keep exposure controlled. | 2026-08-04 |
| Production Backup and rollback validation | A stopped-writer snapshot was copied off the server to the private operator workstation, restored exactly into an absent private destination, and activated through a local service on 2026-08-12. A reversible failed deployment restored the exact verified package, healthy state, prior durable evidence, and provider smoke through Coolify. The workshop owner chose manual backups before and after demonstrations with 30-day-or-teardown retention. Automated remote storage, geographic redundancy, destructive in-place activation, and post-rollback digest reinspection remain unavailable or intentionally out of scope for this workshop. | 2026-08-12 |
