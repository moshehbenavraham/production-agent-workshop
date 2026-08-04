# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow the repository's [versioning policy](./VERSIONING.md), based on
[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Enabled the Biome 2.5.6 recommended-rule linting bundle with fix/check
  commands and enforcement in the complete local verification gate.
- Added a least-privilege Build & Test workflow with a TypeScript build, all
  deterministic tests, built-in coverage gates, and all five evals.
- Added a fail-fast process-wide `/runs` fixed-window rate gate, bounded
  environment configuration, standard capacity headers, deterministic tests,
  and local process/container `429` evidence.
- Added one internal safe-write application that composes shared durable
  approval/event truth, exact fake authorization, result persistence, and the
  deterministic adapter while snapshotting synthetic actor permissions.
- Added a nine-test file-backed Task `03` vertical-slice matrix covering the
  required valid/refusal/timeout/duplicate/permission/downstream paths plus
  rejected evidence and shared-log namespace validation.
- Added a flush-before-success file-backed fake-send reservation/result store
  with restart projection, exact duplicate replay, visible indeterminate state,
  corruption refusal, and injected I/O failure coverage.
- Added a reservation-first fake-send application service and deterministic in-
  process adapter with one-effect same-process concurrency, bounded timeout/
  abort, late-result suppression, minimized events, and terminal-event recovery.
- Added closed fake-send request, command, adapter, result, event, reservation,
  and replaceable store contracts plus deterministic pre-effect authorization
  from exact durable approved state.
- Added a versioned stable idempotency key, explicit no-compensation and crash-
  window semantics, and focused permission/identity/zero-effect coverage.
- Added an application-owned durable approval service with authorized internal
  decisions, exact restart projection, minimized lifecycle events, event-outage
  recovery, and deterministic request/decision failure coverage.
- Added configured `APPROVAL_LOG_PATH` persistence plus explicit synthetic
  retention, redaction, export, deletion, and real-data prohibition rules.
- Added a replaceable append-only approval store with flush-before-success
  writes, deterministic restart projection, duplicate protection, and visible
  corruption, truncation, ordering, and injected I/O failure behavior.
- Added closed, Pi-independent approval record, decision, transition, storage,
  and minimized event contracts with deterministic valid, duplicate, conflict,
  malformed, missing, unknown-actor, identity, and corruption refusal tests.
- Added the six-session Phase 01 Apex plan for durable approvals and the fake idempotent write boundary sourced from Tasks `02` and `03`.
- Added linked Week 2-4 Build Log templates aligned with the required evidence for Tasks `02` through `07`.
- Added Biome 2.5.6 as the Phase Transition formatting bundle with repository-scoped TypeScript and JSON configuration.
- Added a least-privilege GitHub Actions code-quality workflow with immutable action pins, locked dependency installation, formatting enforcement, and strict type checking.
- Added a Docker health probe that verifies the `/health` response body and status under bounded interval, timeout, start-period, and retry settings.
- Added current architecture, onboarding, development, environment, deployment, HTTP API, incident-response, contribution, and ADR-template documentation.

### Changed

- Reconciled the master PRD, Phase 01 plans/specifications, onboarding,
  incident guidance, workshop index, and documentation audit with the verified
  six-session Phase 01 state while leaving Phase 02 unbuilt and unplanned.
- Re-synthesized cumulative considerations and security/compliance posture from
  all six Phase 01 sessions, closing durable-approval risk while preserving
  controlled-exposure, real-data, recovery, and single-process effect gates.
- Added lint enforcement to Code Quality CI and documented the two-workflow
  local/CI verification contract.
- Allowed fake-send duplicate recovery to coexist with valid approval and other
  domain events in the shared run log while failing closed on malformed events
  that claim the `fake_send.*` namespace.
- Recorded the fake/write production decision as unregistered and unallowlisted,
  with human review by the repository maintainer required before any change.
- Classified accepted, duplicate, in-progress, rejected, timed-out, downstream,
  permission, identity, and storage outcomes without exposing fake execution to
  Pi or HTTP or adding real network capability.
- Froze service-generated reservations, results, nested metadata, and minimized
  events before replaceable adapters; repeated terminal evidence and terminal-
  only generic failure shapes now fail closed.
- Preserved the no-effect cutoff while classifying every Task `03` permission
  and future execution outcome; Pi and HTTP remain unchanged.
- Bound Pi approval requests to the latest exact application-produced draft,
  removed full draft content from operational events, and derived run approval
  status exclusively from validated durable projection state.
- Preserved the exact three-tool production allowlist with no Pi/HTTP decision
  or send capability while adding explicit `approval_failed` run status.
- Advanced spec workflow tracking to Phase 01 and synchronized the master PRD and project TODO with the bounded Week 2 session split.
- Renamed the completed log to `docs/build-log-week1.md` and focused it exclusively on evidence required by Task `00` system mapping and Task `01` qualification, removing repeated workflow handoffs, review bookkeeping, and unrelated phase-transition checks.
- Added formatting commands and made the full verification command enforce a clean formatting check before strict types, tests, and evals.
- Validated the new Code Quality workflow and GitHub-managed CodeQL against the exact pushed transition commit with no open PR or review blocker.
- Re-synthesized the living considerations and security/compliance records from every Phase 00 summary, archived plan, implementation discovery log, session security report, and known transition exception.
- Updated the root README and master PRD from the pre-qualification four-test baseline to the completed Phase 00 tool, event, test, CI, container-health, and no-send boundary.
- Closed all six Phase 01 sessions at version `0.1.20` with the internal safe-
  write composition, complete Task `03` evidence, 149 deterministic tests,
  five evals, and an unchanged production capability boundary.

## [0.1.11] - 2026-08-04

### Added

- Added resolved code-review, targeted security/GDPR, and full validation reports for Session 03.

### Changed

- Closed Session 03 and Phase 00 after 40/40 deterministic tests, 5/5 evals, zero dependency vulnerabilities, and complete production-agent verification.
- Froze the exact production tool allowlist at runtime and required approval evidence to follow the latest matching qualification terminal event.

### Security

- Canonicalized executor failures and cross-lead results, rejected out-of-order approval evidence, and confirmed that the synthetic-only, pending-approval, no-send boundary remains intact.

## [0.1.10] - 2026-08-04

### Added

- Checkpointed a focused, closed-schema `qualify_lead` tool with a 1,000 ms application deadline, minimized correlated attempt/outcome events, typed run-result qualification, and deterministic integration coverage.
- Added provider-independent tests for exact-run binding, structured dependency failures, timeout and late-result behavior, corrupt-event rejection, downstream bypass denial, and the qualification-to-pending-approval vertical slice.

### Changed

- Replaced raw `inspect_lead` access with the application-validated qualification boundary while preserving exactly three production tools and no shell, filesystem, send, or approval-decision capability.
- Required the latest matching qualification success before drafting or pending approval creation, and derived visible run outcomes from validated event evidence instead of assistant prose.

### Security

- Redacted thrown, rejected, invalid, and cross-lead qualification executor results, minimized qualification event data, and preserved the synthetic-only, pending-approval, no-send boundary.

## [0.1.9] - 2026-08-04

### Changed

- Tightened Session 02 qualification review boundaries so result schemas accept only application-owned reason and missing-information codes, inherited `leadId` properties remain missing input, and malformed lookup records become redacted structured failures.
- Added deterministic regression coverage for lookup-record validation and exact requested-versus-returned lead identity.

## [0.1.8] - 2026-08-04

### Added

- Checkpointed the implemented, review-pending Session 02 qualification slice with closed TypeBox input, result, failure, and outcome schemas; deterministic application-owned fit and confidence; structured refusal and lookup-failure behavior; and 11 focused contract tests.

### Changed

- Extracted synthetic lead fixtures into a Pi-independent domain module while preserving the existing tool API, tests, evals, and production allowlist.

## [0.1.7] - 2026-08-04

### Added

- Added the Task `00` Build Log evidence pack with Mermaid architecture and request traces, a Harness Decision Record, explicit permission and risk tables, deterministic verification, and unknown-lead refusal proof.
- Added a local operator guide for authenticating Pi through a ChatGPT Plus or Pro Codex subscription without an OpenAI Platform API key; recorded a local operator's successful no-session smoke-test report for `openai-codex/gpt-5.4-mini`.

## [0.1.6] - 2026-08-04

### Added

- Created the Phase 00 Week 1 Apex plan with three bounded sessions covering the system evidence map, qualification contract and domain behavior, and focused tool integration.

### Changed

- Moved the client brief into `docs/todo/` and updated all repository path references.
- Remapped the required workshop path into five one-week phases: tasks `00` through `07` fill Weeks 1-4, task `08` is required Week 5 work after its evidence gate, and only the handoff implementation itself may be removed by the final comparison.

## [0.1.5] - 2026-08-04

### Changed

- Separated the internal security and compliance posture record from the public vulnerability disclosure policy, aligned current gaps with the ordered workshop tasks, and added reciprocal cross-references.
- Realigned the master PRD with the complete `docs/todo` path, including verified-versus-planned scope, tasks `00` through `08`, required evidence, delivery gates, and the corrected core-to-optional phase sequence.

## [0.1.4] - 2026-08-04

### Added

- Replaced the Apex Spec placeholder with an evidence-backed master PRD covering the bounded baseline, production-hardening path, deferred integrations, measurable safety requirements, risks, and open decisions.
- Added an indexed workshop task path, dedicated observability and incident-response work, a hardened Coolify release task, and an optional evidence-gated typed-handoff experiment.
- Added a documentation audit recording complete scratch-topic coverage, repository evidence, link and encoding checks, security review, and exact source recovery details.

### Changed

- Customized the spec-system engineering conventions for the repository's strict TypeScript, Pi agent, HTTP, JSONL event, deterministic verification, and Coolify boundaries.
- Consolidated all 17 scratch curriculum sections into the ordered tasks covering architecture, tools, state, recovery, evals, observability, deployment, and measured orchestration.
- Expanded tasks `00` through `05`, split observability from the Coolify release task, and updated workshop navigation, support tags, and task terminology.
- Renamed and refreshed the workshop guide as `docs/workshop/README_workshop.md`, linked the todo index from the root README, and synchronized the support-thread navigation.

### Removed

- Removed `docs/scratch.md` after verifying comprehensive coverage and recoverability from commit `3d84e25`.

## [0.1.3] - 2026-08-04

### Changed

- Renamed the ordered workshop task directory from `docs/issues/` to `docs/todo/` and updated live references.

## [0.1.2] - 2026-08-04

### Added

- Initialized the Apex Spec System with project state, starter PRD scaffolding, conventions, security and compliance records, archives, and local workflow scripts.
- Added `GEMINI.md` and `CLAUDE.md` symlinks to `AGENTS.md` so supported assistants share the repository instructions.

### Changed

- Moved project mission, architecture, workflow, completion, and security guidance from `AGENTS.md` into the corresponding `.spec_system` governance files; `AGENTS.md` now serves only as their shared entry point.

## [0.1.1] - 2026-08-04

### Added

- Added a repository-wide Semantic Versioning policy defining the compatibility surface, pre-1.0 rules, pre-release conventions, and release checklist.
- Added project TODO and changelog documentation.

### Changed

- Moved workshop issues from `issues/` to `docs/issues/` and workshop guidance from `workshop/` to `docs/workshop/`, updating affected repository links and instructions.
- Expanded `.gitignore` with categorized rules for Node.js dependencies, TypeScript build output, test artifacts, runtime data, local secrets, Pi state, caches, editors, and operating-system files while keeping safe examples and reproducibility files trackable.
- Upgraded the production baseline from Node.js 22 to Node.js 24 LTS, requiring Node.js 24.15 or newer.
- Standardized local and container installs on npm 12.0.2 and updated the Docker image to `node:24-alpine`.
- Updated `@earendil-works/pi-coding-agent` from 0.82.1 to 0.83.0 and TypeBox from 1.3.8 to 1.3.10.
- Updated development tooling to TypeScript 7.0.2, tsx 4.23.5, and Node.js 24.13.3 type definitions.
- Regenerated the npm 12 lockfile and refreshed transitive dependencies to the newest versions allowed by their upstream compatibility ranges.
- Verified the updated dependency tree with a clean `npm ci`, a production Docker build, type-checking, four deterministic tests, and five eval cases.

### Security

- Enabled all GitHub repository security and analysis settings available from the repository's Security configuration page.
- Replaced the placeholder security policy with project-specific supported-version, private-reporting, response, research, and incident-handling guidance.
- Configured weekly Dependabot updates for npm, the Docker base image, and GitHub Actions, with bounded pull-request counts, reviewable minor/patch groups, isolated Pi updates, and Node LTS major-version guards.
- Overrode Pi's vulnerable transitive dependencies with `brace-expansion` 5.0.9, `minimatch` 10.2.6, and `undici` 8.10.0.
- Added version-pinned install-script approvals for the reviewed `@google/genai` 1.52.0, `protobufjs` 7.6.5, and `esbuild` 0.28.1 packages.
- Confirmed the resulting dependency tree reports zero vulnerabilities with `npm audit`.
