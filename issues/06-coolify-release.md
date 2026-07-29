# 06 — Release through Coolify

Mode: HITL
Sprint week: 4
Support tag: `[W4][#06]`

## Goal

Deploy the verified agent and prove health, persistence, observability, and rollback.

## Work

- Add authentication and rate limiting before exposing `/runs`.
- Configure provider credentials as Coolify secrets.
- Mount persistent state at `/app/data`.
- Add health and smoke checks.
- Trigger one run and trace it by `runId`.
- Restart and verify persistence.
- deploy one reversible failure and roll back.

## Acceptance criteria

- Local verification is green before deployment.
- The live health check returns 200.
- An approval-pending run is observable end to end.
- State survives restart.
- Rollback is demonstrated.
- The operator runbook reflects the real environment.
