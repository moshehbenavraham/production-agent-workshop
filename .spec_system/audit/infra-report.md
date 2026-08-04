# Infrastructure Report

**Date**: 2026-08-04
**Result**: PASS (local target)
**Repository scope**: Single deployable root package
**Selected bundle**: Security
**Platform**: Docker image targeting Coolify

## Summary

The Phase 01 transition added exactly one infrastructure bundle: a deterministic
process-wide fixed-window rate gate in front of `POST /runs`. It rejects excess
requests before body parsing or Pi/provider work, returns `429` with bounded
capacity and retry headers, and leaves `GET /health` available. Defaults are 10
requests per 60 seconds; two non-secret bounded integer environment variables
configure the policy and malformed values fail before the listener starts.

The policy is intentionally global to one process. It does not trust
`X-Forwarded-For` before a trusted-proxy contract exists, allocate attacker-
controlled identity buckets, or claim authentication, tenant fairness,
distributed coordination, or WAF coverage. It resets on restart and applies
independently to each replica. Public exposure remains forbidden until the
deployment-owned WAF, caller identity, authorization, tenant, and shared rate
policy are configured and verified.

The strongest reachable local validation passed both directly and in Docker.
With a limit of two, rapid requests returned `400`, `400`, then `429` with
`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`, and `Retry-After`;
`/health` remained `200`. Image
`sha256:17ce92b27841c280a17645a7beab75641614992cf57979f6189e9f8e66e52713`
was `running healthy` with probe exit 0. The exact temporary container, volume,
and test image were removed after validation.

No production deployment URL or edge exists, so production Health and Security
checks remain explicit external-target exceptions in `known-issues.md`.

## Detection

| Item | Result |
|------|--------|
| Apex state | Phase 01 complete; 9 completed sessions; no active session |
| Deployment topology | One root Node.js/TypeScript service; Docker target for Coolify |
| Existing bundle | Health - endpoint and Docker probe configured |
| Selected missing bundle | Security - highest-priority missing bundle |
| Persistent store signal | Event and approval JSONL under `/app/data`; Backup remains applicable but unconfigured |
| Other missing bundle | Deploy |
| Known skipped infra loaded | Production Health validation; Production Security validation added after local proof |

## Configuration

| Component | Value |
|-----------|-------|
| Application gate | `src/rate-limit.ts`, composed by `src/server.ts` |
| Protected route | `POST /runs` before request-body parsing and Pi work |
| Exempt route | `GET /health` |
| Default policy | 10 admitted requests per 60-second process window |
| Environment | `RUN_RATE_LIMIT_MAX=10`; `RUN_RATE_LIMIT_WINDOW_MS=60000` |
| Bounds | Limit 1-10,000; window 1-3,600,000 ms; startup fails outside bounds |
| Denial | HTTP `429`, `rate_limited`, remaining-window seconds, `Retry-After` |
| Identity policy | Process-global; forwarding headers ignored |
| Required secrets | None |

## Evidence Ledger

| Bundle | Component | Package | Command / Target | Result | Fixes Applied | Remaining / Blocker |
|--------|-----------|---------|------------------|--------|---------------|---------------------|
| Project state | Analyzer | root | `bash .spec_system/scripts/analyze-project.sh --json` | PASS | None | Phase 01 complete; no active session |
| Security | Contract tests | root | `npx tsx --test tests/rate-limit.test.ts` | PASS | Added 7 deterministic config/window/failure cases | None |
| Security | Direct HTTP gate | root | `RUN_RATE_LIMIT_MAX=2 RUN_RATE_LIMIT_WINDOW_MS=60000 npm start`; three invalid synthetic `POST /runs` requests | PASS (local) | New application gate | `400`, `400`, `429`; no Pi/provider invocation |
| Health | Direct endpoint | root | `curl --fail --silent --show-error http://127.0.0.1:3000/health` | PASS (local) | None | Exact `{"status":"ok"}` after quota exhaustion |
| Security | Image build | root | `docker build --tag production-agent-workshop:phase01-transition-security .` | PASS | None | Image `17ce92b...52713` |
| Security | Container rate gate | root | Three rapid invalid synthetic requests to `http://127.0.0.1:3011/runs` | PASS (local) | None | `400`, `400`, `429` with expected headers |
| Health | Container probe | root | `docker inspect production-agent-workshop-security-phase01` | PASS (local) | None | `running healthy`, probe exit 0 |
| Security | Production edge/WAF | root | Coolify HTTPS target | SKIPPED | None | No deployed URL/edge; recorded in Skipped Infra |
| Verification | Local repository | root | `npm run verify`; `npm run test:coverage`; `npm audit --audit-level=low` | PASS | None | 156 tests, 5 evals, coverage 96.44/86.51/98.27, 0 vulnerabilities |
| Cleanup | Validation artifacts | root | Exact container/volume/image removal | PASS | Removed disposable artifacts | Reproducible from Dockerfile |

## Infrastructure Result

The current Security bundle and previously configured Health bundle pass
against the strongest reachable local target. Backup is the next missing
infrastructure bundle in a future phase; Deploy also remains unconfigured under
the one-bundle-per-run rule.

Required external setup: when Task `07` authorizes a Coolify deployment,
configure the trusted proxy/domain, edge WAF, authenticated caller identity,
shared per-principal quota, and production values; then re-run Health and
Security checks over the assigned HTTPS URL.

Next command: `carryforward`

Reason: `infra -> carryforward` is the required Phase Transition handoff after
the selected infrastructure bundle passes locally. `documents` follows only
after `carryforward`; `phasebuild` is outside the Phase 01 cutoff.
