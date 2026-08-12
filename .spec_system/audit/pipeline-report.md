# CI/CD Pipeline Report

**Date**: 2026-08-12
**Result**: PASS
**Phase**: P03 - Operations and Coolify Release
**Repository scope**: Single repository, root package
**Platform**: GitHub Actions
**Selected bundle**: Integration

## Summary

The one Phase 03 pipeline addition is a read-only Integration workflow. It runs
the five deterministic incident drills, validates the redacted controlled
release contract, builds the production Dockerfile, waits for exact service and
Docker health, then proves the two-request application capacity boundary returns
400, 400, and 429. It removes its named container, anonymous volume, and image
even after failure.

The workflow has no provider key, Coolify token, environment secret, write
permission, deploy action, or public `/runs` request. It verifies repository and
container integration only; production deployment remains a manual owner action.

## Workflow Contract

| Item | Value |
|------|-------|
| Trigger | Push to `main`; pull request |
| Permissions | `contents: read` only |
| Runtime | Ubuntu latest; Node 24.15.0; npm 12 from lock/package contract |
| Timeout | 20 minutes |
| Dependency install | `npm ci` |
| Domain exercise | `npm run drill:incidents` |
| Release contract | Current redacted fixture; target mutation false |
| Image | Real repository `Dockerfile` |
| HTTP exercise | Loopback-only health and three invalid synthetic requests |
| Secrets | None |
| Target mutation | None |

Third-party actions remain immutable-pinned to the reviewed checkout v7.0.1
and setup-node v7.0.0 revisions already used by the other workflows.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Apex state | PASS | Phase 03 complete; 24 sessions; no active session |
| Existing bundles | PASS | Quality, Build & Test, Security plus managed CodeQL |
| Workflow syntax | PASS | `actionlint .github/workflows/*.yml` |
| Incident drills | PASS | 5/5 deterministic cases |
| Release preflight | PASS | 15/15 ready; target mutation false |
| Docker build | PASS | Node 24 image; locked install; strict TypeScript check |
| Container startup | PASS | Running; Docker health healthy; exact health body |
| Rate boundary | PASS | Two invalid inputs returned 400; third returned 429 |
| Cleanup | PASS | Named container/volume and transition image removed |
| Local repository gate | PASS | 374 tests; 18 evals; zero vulnerabilities |
| GitHub Integration | PASS | Main run `31578544897`; container, incidents, and release contract green |
| GitHub Build & Test | PASS | Main run `31578544792` |
| GitHub Code Quality | PASS | Main run `31578544789` |
| GitHub Security | PASS | Main run `31578544729`; PR-only dependency review correctly skipped |
| Managed CodeQL | PASS | Main run `31578543367`; Actions and JavaScript/TypeScript green |

## Remaining Pipeline Scope

Operations, release tagging, automatic deployment, and external post-deploy
smoke remain unconfigured. That is deliberate: automatic Coolify deploy is off,
the controlled route remains private, and deployment needs the workshop owner's
explicit manual action. These future categories do not block this transition.

## Pipeline Result

The Integration bundle passes locally and on GitHub `main`. Every configured
workflow and both managed CodeQL analyses finished green; the PR-only dependency
review correctly skipped for the push event.

Next command: `infra`.

Reason: `pipeline -> infra` is the required transition order after the
published workflow passes. Phase 04 `phasebuild` remains outside this step.
