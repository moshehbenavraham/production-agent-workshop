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
| Production Health validation | No reachable production deployment exists; the current Docker image, container probe, and local endpoint passed again on 2026-08-12. Re-verify against the Coolify URL when Task `07` deploys it. | 2026-08-04 |
| Production Security validation | No reachable production edge, domain, or trusted caller identity exists; the process-wide `/runs` limiter passed direct HTTP and container validation again on 2026-08-12. Configure and verify the deployment WAF plus shared per-principal policy before public exposure. | 2026-08-04 |
| Production Backup validation | The stopped-writer snapshot and absent-destination restore passed locally and in the current container on 2026-08-12, but no private off-server destination, schedule, retention automation, Coolify data restore, or activation drill exists. Configure and verify those controls during Task `07`; an in-container copy is not a backup. | 2026-08-12 |
