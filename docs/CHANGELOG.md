# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow the repository's [versioning policy](./VERSIONING.md), based on
[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added a no-input five-case synthetic incident drill command that reuses the
  production-eval harness, builds safe exact-run reports before isolated cleanup,
  evaluates default alert decisions, verifies restart/duplicate effect safety,
  and emits a closed operational baseline with 16 focused tests.
- Added a safe report-bearing production-eval harness path that returns only the
  existing minimized observation and validated observed-only report, then removes
  its temporary directory in the existing `finally` boundary.
- Added a pure bounded alert evaluator with seven closed rule variants, finite
  default thresholds/actions, explicit suppression, unavailable and queue-not-
  applicable outcomes, distinct-run failure counting, semantic output guards,
  and 22 deterministic tests without notification or mutation capabilities.
- Added a canonical agent incident runbook covering external pause, read-only
  inspection, bounded retry, internal exact-checkpoint resume, unsupported
  compensation, evidence-preserving escalation, and no-retry stop rules.
- Added a closed read-only exact-`runId` report with semantic projection before
  rendering, stable chronological JSON/text forms, explicit unavailable model
  metrics, observed-only approval/effect labels, 1,000-event and 64 MiB bounds,
  safe path preflight, protected-field omission, and 23 focused tests.
- Added closed, immutable service, run, model, and tool observation contracts
  with exact run correlation, tagged metric availability, finite operational
  vocabularies, and canonical semantic validation.
- Added a controlled service snapshot collector for bounded process, storage,
  queue, and dependency health with preflight configuration validation,
  per-dependency abort timeouts, deterministic ordering, isolated failures,
  protected-value minimization, and 20 focused tests; HTTP and Pi permissions
  remain unchanged.
- Added the eight-session Phase 03 Apex plan for four-layer observability,
  exact-`runId` reporting, alerts, incident drills, controlled Coolify release,
  persistent restart, off-server restore, rollback, parity, and operator
  handoff sourced only from Tasks `06` and `07`.
- Added a fail-closed offline JSONL snapshot/restore CLI with explicit
  stopped-writer confirmation, strict path and record validation, private
  permissions, closed SHA-256 manifests, durable staged writes, atomic snapshot
  activation, and non-destructive absent-destination restore.
- Added three subprocess-level backup regressions covering exact byte restore,
  stopped-writer and truncation refusal, checksum-tamper refusal, and private
  destination modes; validated the commands against the current Docker image.
- Added a least-privilege Security workflow with immutable action pins,
  full-history Gitleaks, high-severity dependency review, and locked-tree npm
  audit alongside managed CodeQL and secret scanning.
- Added pinned Husky and lint-staged pre-commit tooling that applies Biome to
  staged TypeScript and root JSON while preserving the full verification gate.
- Added a permanent table-driven production-eval regression for unknown-lead
  fabrication, false completion, and approval bypass that requires the named
  critical failure, preserves 17 other passing cases, and returns exit 1.
- Added a deterministic 18-case production-eval harness that exercises input,
  qualification, tool, lifecycle, approval, fake-write, recovery, and bounded
  output paths through isolated synthetic production-domain boundaries.
- Added exact critical scoring, closed immutable observations/artifacts,
  private append-only JSONL evidence, a compact all-case scorecard, canonical
  operational failures, and non-zero critical/persistence exit behavior.
- Added 14 runner tests covering all-pass, one/many failures, quality-only
  misses, hostile evidence, executor and persistence failures, corruption,
  restart, minimized protected data, scorecard output, and gate immutability.
- Added closed production-eval case, fixture, expectation, rubric, trace,
  result, version, latency, token, cost, score, and suite-validation contracts
  with canonical semantic failures and deeply frozen validated output.
- Added a predeclared 18-case synthetic golden set spanning every Task `05`
  behavior category and 15 critical client boundaries while keeping model
  grading restricted to non-blocking draft quality.
- Added 17 deterministic eval-contract and inventory cases covering closed
  shapes, explicit unavailable metrics, result consistency, category/boundary
  completeness, hostile values, unsafe rubric authority, legacy mappings, and
  zero executable capability.

- Added an internal provider-independent recovery application with closed
  retry/resume/compensate/escalate/stop policy, exact cross-store authority,
  hash-anchored draft recovery, stable pending-approval replay, and no effect
  adapter.
- Added 17 deterministic recovery cases covering three fresh-instance
  interruption points, exact replays, pending/approved/declined authority,
  hidden and observed reservations, completed fake results, partial terminal
  repair, damaged histories, and hostile replaceable boundaries.
- Added application-owned whole-run deadline and maximum-step coordination with
  fail-fast bounded environment configuration, explicit step classification,
  abort-once cancellation, terminal-once persistence, and late-settlement
  suppression.
- Added provider-independent lifecycle tests for normal completion, deadline,
  late session/prompt settlement, step overflow, correlated normal and
  synthetic tool outcomes, dependency refusal, invalid configuration, and
  event-storage failure.
- Added `run.stopped` deadline, step-limit, and dependency terminal variants,
  nullable step metadata, application-level Pi tool refusal normalization, and
  bounded-stop projection with late-core and duplicate-terminal refusal.
- Added a deterministic read-only run projector with closed lifecycle,
  checkpoint, terminal, minimized context, authority-verification, and
  canonical corruption-refusal contracts.
- Added 22 focused projection cases covering legal complete and interrupted
  prefixes, fresh-store restart equivalence, post-run approval/fake evidence,
  exact cross-store identity checks, indeterminate attempts, malformed
  adapters, and duplicate, conflicting, cross-run, ordering, and terminal
  refusal.
- Added a closed, versioned run-event envelope with explicit operational
  metadata availability, minimized owned payload variants, canonical failures,
  and strict append/read outcomes.
- Added a private durable JSONL run-event adapter with complete-file validation,
  flush and exact re-read confirmation, restart-safe reads, and visible
  truncation, corruption, duplicate-identity, and ordering refusal.
- Added the seven-session Phase 02 Apex plan for durable recovery, bounded run
  lifecycle, replay-safe resume, and deterministic production eval gates sourced
  from Tasks `04` and `05`.
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

- Closed Phase 03 Session 04 and Task `06` at version `0.1.35` after 354/354
  repository tests, 18/18 production evals, five passing incident drills, and
  97.82/86.14/98.37 coverage without expanding production permissions.
- Corrected the Task `07` baseline to recognize the existing process-wide
  `/runs` capacity gate while keeping authentication, tenant isolation, shared
  principal-aware rate state, and deployed WAF controls explicitly open.
- Advanced spec workflow tracking to Phase 03 and synchronized the master PRD
  and project TODO with the bounded Week 4 session split.
- Reconciled the Week 3 Build Log directly with Tasks `04` and `05`: added
  acceptance-to-evidence maps, corrected focused test counts and application
  version metadata, normalized variable scorecard fields, and refreshed the
  final recovery/eval verification to the current 273-test and 18-case gate.
- Reconciled the master PRD, all seven Phase 02 session records, root README,
  onboarding, architecture, operator guidance, workshop index, and
  documentation audit with the verified Phase 02 implementation and transition
  controls; Phases 03-04 remain planned and unbuilt.
- Advanced the documentation-transition patch version to `0.1.30` and kept the
  production-eval application version synchronized with package metadata.
- Re-synthesized Phase 02 institutional memory and cumulative security posture
  from all seven session summaries, implementation trails, security reports,
  transition exceptions, and current controls while preserving four explicit
  public-production release findings.
- Revalidated the Phase 02 Health and Security infrastructure bundles locally
  and in Docker, selected Backup as the one missing infrastructure bundle, and
  retained off-server storage, scheduling, production restore activation, and
  deployment as explicit Task `07` gates.
- Scoped the existing 95% line, 85% branch, and 95% function coverage metrics
  explicitly to application source while continuing to execute the operator
  snapshot CLI end-to-end in the same 273-test suite.
- Closed Phase 02 Session 07, Task `05`, and the seven-session Phase 02
  implementation at version `0.1.29` after three isolated, uncommitted
  red/fix/green source-boundary exercises restored exact baseline hashes,
  270/270 deterministic tests and 18/18 eval cases passed, coverage reached
  97.64% lines/85.43% branches/97.88% functions, and dependency, artifact,
  residue, permission, secret, security, and final-diff reviews passed.
- Closed Phase 02 Session 06 at version `0.1.28` after 269/269 deterministic
  tests, an 18/18 durable production-eval pass, 97.64% line/85.35% branch/
  97.88% function coverage, zero dependency vulnerabilities, and complete
  critical-gate, security, permission, and documentation validation. Task `05`
  remains in progress until Session 07 records and reverts the three controlled
  boundary regressions.
- Replaced the five ad hoc boolean evals with the frozen 18-case gate in
  `npm run eval` and `npm run verify`; safe final output now derives from the
  application-owned stop reason rather than contradictory assistant prose.
- Closed Phase 02 Session 05 at version `0.1.27` after 255/255 deterministic
  tests, 5/5 legacy evals, 97.73% line/85.54% branch/97.70% function coverage,
  zero dependency vulnerabilities, and complete definition-boundary, security,
  permission, and documentation validation. Task `05` remains in progress until
  Sessions 06 and 07 add execution, deployment gating, and red/fix/green proof.
- Mapped the five legacy eval intentions into named golden cases while keeping
  the existing five-case command as the active runner until Session 06 adds
  execution, persistence, scorecards, and non-zero critical gating.
- Completed the Task `04` recovery evidence pack with the five-action decision
  table, three Mermaid restart timelines, replay-idempotency proof, coordinated
  synthetic retention/deletion rules, and exercised reservation escalation.
- Reconciled the internal recovery boundary across architecture, development,
  environment, incident, considerations, and security guidance while keeping
  HTTP/Pi, public, distributed, real-data, and effect permissions unchanged.
- Advanced the closed run-event envelope to schema version 2 so every new
  record carries explicit step availability and bounded terminals cannot be
  confused with successful completion; earlier event files fail visibly and
  require an explicit synthetic reset or migration.
- Routed production Pi setup and prompting through injected lifecycle, timer,
  session, and event boundaries while preserving the exact three-tool allowlist
  and dedicated approval/fake-result authority.
- Excluded token-level, tool-progress, queue, entry, and bash update events from
  durable lifecycle writes so provider verbosity cannot force synchronous
  file flush and full-history validation per update.
- Made the lifecycle coordinator's persisted terminal decision the only
  returned stop-reason authority, removing a redundant completion payload field
  that could disagree with durable evidence at a replaceable boundary.
- Closed Phase 02 Session 04 and Task `04` at version `0.1.26` after 238/238
  deterministic tests, 5/5 evals, 97.17% line/85.87% branch/97.41% function
  coverage, zero dependency vulnerabilities, and complete recovery, security,
  and production-boundary validation.
- Closed Phase 02 Session 03 at version `0.1.25` after 221/221 deterministic
  tests, 5/5 evals, 96.96% line/85.71% branch/97.47% function coverage, zero
  dependency vulnerabilities, and complete security and production-boundary
  validation.
- Closed Phase 02 Session 02 at version `0.1.24` after 198/198 deterministic
  tests, 5/5 evals, configured coverage gates, zero dependency
  vulnerabilities, and complete security and production-boundary validation.
- Hardened run projection review paths so unverified operational observations
  cannot elevate trusted approval/effect status, not-found requires lead-bound
  attempt evidence, structural store failures retain actionable categories, and
  future-dated fake-result authority is refused.
- Corrected Phase 02 workflow history trimming, sourced default event metadata
  from the installed package version, and made run-completion metadata
  distinguish pending, successful, and stopped outcomes without inventing an
  approval state.
- Closed Phase 02 Session 01 at version `0.1.23` after 176/176 deterministic
  tests, 5/5 evals, coverage above all configured thresholds, zero dependency
  vulnerabilities, and complete security and production-boundary validation.
- Migrated run, normalized Pi, qualification, draft, approval, and fake-send
  event producers and consumers to the shared closed boundary while retaining
  dedicated approval and fake-result stores as authorization truth. Run
  projection, execution bounds, replay, and resume remain unimplemented.
- Advanced spec workflow tracking to Phase 02 and synchronized the master PRD
  and project TODO with the bounded Week 3 session split.
- Reconciled the Week 2 Build Log directly with Tasks `02` and `03`, current
  contracts, and focused tests: corrected approval-state and duplicate-event
  semantics, clarified indeterminate fake-send reservations, added the typed
  fake-write contract and eight required test paths, and refreshed the 46/46,
  56/56, and repository-wide verification evidence.
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
