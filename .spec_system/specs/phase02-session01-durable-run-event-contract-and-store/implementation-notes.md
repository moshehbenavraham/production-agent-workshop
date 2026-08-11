# Implementation Notes

**Session ID**: `phase02-session01-durable-run-event-contract-and-store`
**Started**: 2026-08-11 19:08
**Last Updated**: 2026-08-11 20:15

---

## Session Progress

| Metric | Value |
|--------|-------|
| Tasks Completed | 18 / 18 |
| Estimated Remaining | 0 hours |
| Blockers | 0 |

---

## Task Log

### 2026-08-11 - Session Start

**Environment verified**:
- [x] Prerequisites confirmed
- [x] Tools available
- [x] Directory structure ready

---

### Task T001 - Verify state, prerequisites, toolchain, and baseline

**Started**: 2026-08-11 19:08
**Completed**: 2026-08-11 19:09
**Duration**: 1 minute

**Notes**:
- Confirmed Phase 02 Session 01 is active after completed Phases 00 and 01.
- Confirmed the single-package Node/npm environment and recorded base commit.

**Files Changed**:
- `.spec_system/specs/phase02-session01-durable-run-event-contract-and-store/implementation-notes.md` - Initialized evidence log.

**Verification**:
- Command/check: `bash .spec_system/scripts/analyze-project.sh --json`
  - Result: PASS - Active session and both planning files detected.
  - Evidence: Phase 2, 9 completed prior sessions, Session 01 current.
- Command/check: `bash .spec_system/scripts/check-prereqs.sh --json --env`
  - Result: PASS - Spec system, jq, and Git available; single-repo mode.
  - Evidence: Overall prerequisite status `pass` with no issues.
- Command/check: `npm run verify`
  - Result: PASS - Baseline formatting, lint, types, tests, and evals are green.
  - Evidence: 156/156 tests and 5/5 evals passed.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T002 - Map event and persistence boundaries

**Started**: 2026-08-11 19:09
**Completed**: 2026-08-11 19:11
**Duration**: 2 minutes

**Notes**:
- Mapped raw JSONL parsing, run/Pi/qualification/draft producers, and approval
  and fake-send shared-log consumers.
- Confirmed approval and fake-result records remain authoritative while events
  are minimized repair and recovery evidence.
- Reused Phase 01 validation-before-construction, private mode, flush/re-read,
  namespace, and canonical error patterns for the planned boundary.

**Files Changed**:
- `.spec_system/specs/phase02-session01-durable-run-event-contract-and-store/implementation-notes.md` - Recorded source and security discovery.

**Verification**:
- Command/check: `sed` inspection of `src/event-store.ts`, `src/pi-agent.ts`, `src/tools.ts`, `src/approval-service.ts`, and `src/fake-send-service.ts`
  - Result: PASS - All current producers, readers, and permissive envelope checks mapped.
  - Evidence: Six owned namespaces and dynamic normalized `pi.*` events identified.
- Command/check: `sed` inspection of `src/approval-store.ts`, `src/fake-send-store.ts`, `src/approval.ts`, and `src/fake-send.ts`
  - Result: PASS - Durability, semantic validation, authorization, and idempotency patterns identified.
  - Evidence: Dedicated approval/result records remain required for protected decisions.
- Command/check: `rg -n 'type: "[^"]+"|eventType: "[^"]+"' src tests`
  - Result: PASS - Existing event discriminants and affected tests enumerated.
  - Evidence: Run, qualification, draft, approval, fake-send, and test-only legacy variants located.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T003 - Write contract-first RED event tests

**Started**: 2026-08-11 19:11
**Completed**: 2026-08-11 19:14
**Duration**: 3 minutes

**Notes**:
- Added closed-envelope, payload-variant, discriminant, metadata, creation,
  canonical-failure, and replaceable-outcome expectations before exports exist.
- Kept fixtures synthetic and asserted frozen minimized evidence and explicit
  unavailable-versus-zero metrics.

**Files Changed**:
- `tests/run-event.test.ts` - Added contract-first RED suite for the new boundary.

**Verification**:
- Command/check: `npx tsx --test tests/run-event.test.ts tests/event-store.test.ts`
  - Result: PASS - Expected RED state confirmed.
  - Evidence: Runner exits non-zero because `src/run-event.ts` does not yet exist; no false green.
- Command/check: BQC trust and contract review of `tests/run-event.test.ts`
  - Result: PASS - Tests require closed schemas, canonical errors, frozen results, and semantic alignment.
  - Evidence: Invalid extras, identifiers, timestamps, metadata totals, and discriminants are covered.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T004 - Expand RED event-store tests

**Started**: 2026-08-11 19:14
**Completed**: 2026-08-11 19:15
**Duration**: 1 minute

**Notes**:
- Replaced the permissive three-append test with durability, restart, complete-
  file validation, ordering, preflight, private-mode, and injected-I/O cases.
- Required no-op and indeterminate writes to fail instead of manufacturing
  durable success.

**Files Changed**:
- `tests/event-store.test.ts` - Added the planned RED persistence matrix.

**Verification**:
- Command/check: `npx tsx --test tests/run-event.test.ts tests/event-store.test.ts`
  - Result: PASS - Expected RED state confirmed for the missing contract and adapter API.
  - Evidence: Both focused files fail to load `src/run-event.js`, proving the new boundary is required.
- Command/check: BQC persistence and failure-path inspection of `tests/event-store.test.ts`
  - Result: PASS - Tests cover trust, duplicate writes, restart freshness, I/O failures, mode tightening, and re-read proof.
  - Evidence: Missing, blank, truncated, malformed, duplicate, decreasing-time, no-op, write, sync, close, and read paths are explicit.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T005 - Define envelope, metadata, and failure schemas

**Started**: 2026-08-11 19:15
**Completed**: 2026-08-11 19:21
**Duration**: 6 minutes

**Notes**:
- Added versioned event/run identity, canonical timestamp, actor, tool,
  redacted argument, result, usage, version, duration, retry, and cost schemas.
- Added semantic token-total, human-actor, timestamp, and argument-bound guards
  plus frozen canonical failure values.

**Files Changed**:
- `src/run-event.ts` - Added envelope metadata, identity, failure, and semantic validation foundations.
- `tests/run-event.test.ts` - Corrected qualification fixture to repository-owned reason codes.

**Verification**:
- Command/check: `npx tsc --noEmit --ignoreConfig --target es2024 --module nodenext --moduleResolution nodenext --strict --noUncheckedIndexedAccess --types node src/run-event.ts`
  - Result: PASS - New contract compiles under strict file-specific checks.
  - Evidence: Zero TypeScript diagnostics.
- Command/check: `npx tsx --test tests/run-event.test.ts`
  - Result: PASS - Envelope, metadata, and canonical failure behavior pass.
  - Evidence: 9/9 focused contract tests pass.
- BQC trust/error boundary check: PASS - External values are schema checked and failures contain only canonical text.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T006 - Define minimized owned event variants

**Started**: 2026-08-11 19:18
**Completed**: 2026-08-11 19:21
**Duration**: 3 minutes

**Notes**:
- Added closed run, qualification, draft, and normalized Pi variants and
  composed existing closed approval and fake-send evidence schemas.
- Bound every outer type to the payload `eventType` and retained only bounded
  normalized Pi fields rather than arbitrary SDK data.

**Files Changed**:
- `src/run-event.ts` - Added owned payload union and discriminant semantics.
- `tests/run-event.test.ts` - Added valid and mismatched variant coverage.

**Verification**:
- Command/check: `npx tsx --test tests/run-event.test.ts`
  - Result: PASS - All owned variants validate and mismatches fail closed.
  - Evidence: 9/9 tests pass, including approval/fake-send discriminant cases.
- BQC contract/minimization check: PASS - Raw SDK objects and undocumented extras are rejected.
  - Evidence: Normalized `pi.lifecycle` schema contains only six bounded nullable fields.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T007 - Define replaceable store outcomes

**Started**: 2026-08-11 19:20
**Completed**: 2026-08-11 19:21
**Duration**: 1 minute

**Notes**:
- Added closed append/read outcome unions and the replaceable event-store
  interface over untrusted inputs.
- Added runtime outcome guards that independently validate returned event arrays
  and canonical failures.

**Files Changed**:
- `src/run-event.ts` - Added creation, append, read, and store contracts.
- `tests/run-event.test.ts` - Added malicious replaceable-outcome coverage.

**Verification**:
- Command/check: `npx tsx --test tests/run-event.test.ts`
  - Result: PASS - Closed outcome contracts accept exact values and reject malformed returns.
  - Evidence: 9/9 focused tests pass.
- BQC replaceable-boundary check: PASS - Invalid adapter values cannot become success.
  - Evidence: Success values re-run full event validation; failures require canonical equality.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T008 - Refactor event-store construction and operations

**Started**: 2026-08-11 19:21
**Completed**: 2026-08-11 19:27
**Duration**: 6 minutes

**Notes**:
- Replaced constructor side effects with validated path, provider, version, and
  snapshotted file-operation boundaries.
- Delayed directory and file creation until a valid event has been built and
  existing storage has been validated.

**Files Changed**:
- `src/event-store.ts` - Added validated construction and injectable file operations.
- `tests/event-store.test.ts` - Added pre-construction and operation-boundary coverage.

**Verification**:
- Command/check: strict file-specific TypeScript check for `src/event-store.ts` and `tests/event-store.test.ts`
  - Result: PASS - Adapter and tests compile with strict unchecked-index rules.
  - Evidence: Zero diagnostics.
- Command/check: `npx tsx --test tests/run-event.test.ts tests/event-store.test.ts`
  - Result: PASS - Configuration and preflight paths are green.
  - Evidence: 16/16 focused tests pass.
- BQC trust/resource check: PASS - Invalid providers fail before construction and opened descriptors enter an explicit close path.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T009 - Implement durable validated append

**Started**: 2026-08-11 19:23
**Completed**: 2026-08-11 19:27
**Duration**: 4 minutes

**Notes**:
- Added a synchronous in-flight guard, private file mode, complete LF record,
  flush, close, and exact before/after re-read confirmation.
- Classified failures before a write as storage failures and failures after a
  possible write as interrupted evidence; no-op writes fail confirmation.

**Files Changed**:
- `src/event-store.ts` - Implemented guarded flush/re-read append semantics.
- `tests/event-store.test.ts` - Covered private mode, no-op, write, sync, close, and re-read failures.

**Verification**:
- Command/check: `npx tsx --test tests/run-event.test.ts tests/event-store.test.ts`
  - Result: PASS - Durable append and all injected failure paths are green.
  - Evidence: 16/16 focused tests pass.
- BQC mutation/resource/failure check: PASS - Reentrant append is denied, descriptors close in `finally`, and indeterminate writes are visible.
  - Evidence: No success is returned without exact persisted equality.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T010 - Implement complete-file validated reads

**Started**: 2026-08-11 19:24
**Completed**: 2026-08-11 19:27
**Duration**: 3 minutes

**Notes**:
- Added whole-file LF, JSON, closed-schema, duplicate-ID, and per-run timestamp
  validation before filtering by the requested `runId`.
- Frozen every returned event and result array so restart reads cannot be
  mutated into different in-memory evidence.

**Files Changed**:
- `src/event-store.ts` - Added complete-file parsing, ordering, and typed read outcomes.
- `tests/event-store.test.ts` - Added restart, damaged-file, duplicate, and order cases.

**Verification**:
- Command/check: strict file-specific TypeScript plus focused event tests
  - Result: PASS - Adapter compiles and all read scenarios pass.
  - Evidence: Zero diagnostics and 16/16 focused tests green.
- BQC state-freshness/contract check: PASS - Every call re-reads full storage and rejects partial or invalid histories.
  - Evidence: Missing file is exact empty success; blank/truncated/corrupt files are distinct failures.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T011 - Migrate run, Pi, qualification, and draft events

**Started**: 2026-08-11 19:27
**Completed**: 2026-08-11 19:34
**Duration**: 7 minutes

**Notes**:
- Normalized Pi SDK events into one bounded `pi.lifecycle` payload and removed
  raw event-object persistence.
- Migrated run, qualification, and draft producers to nested closed payloads,
  explicit metadata, checked append/read outcomes, and canonical storage errors.
- Moved draft in-memory publication after durable event confirmation.

**Files Changed**:
- `src/pi-agent.ts` - Added normalized lifecycle and checked run event handling.
- `src/tools.ts` - Added closed qualification/draft events and validated store outcomes.

**Verification**:
- Command/check: `npm run check 2>&1 | rg '^src/' || true`
  - Result: PASS - No application-source TypeScript errors remain after migration.
  - Evidence: Current diagnostics are confined to not-yet-migrated test callers.
- Command/check: `npx tsx --test tests/run-event.test.ts tests/event-store.test.ts`
  - Result: PASS - Underlying closed contract and adapter remain green.
  - Evidence: 16/16 focused tests pass.
- BQC trust/failure/state check: PASS - SDK payloads are normalized, store outcomes are checked, and draft state follows durable evidence.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T012 - Migrate approval and fake-send event boundaries

**Started**: 2026-08-11 19:30
**Completed**: 2026-08-11 19:34
**Duration**: 4 minutes

**Notes**:
- Replaced local permissive envelope checks with the shared closed append/read
  outcomes and exact domain payload validators.
- Added minimized approval/fake-send metadata without moving authorization or
  idempotency authority out of their dedicated stores.
- Preserved domain-aware filtering of valid unrelated shared-log events.

**Files Changed**:
- `src/approval-service.ts` - Migrated approval event writes, reads, and metadata.
- `src/fake-send-service.ts` - Migrated fake-send event writes, reads, and metadata.

**Verification**:
- Command/check: `npm run check 2>&1 | rg '^src/' || true`
  - Result: PASS - All application source compiles after both service migrations.
  - Evidence: No `src/` diagnostics.
- Command/check: source inspection of approval and fake-send authorization paths
  - Result: PASS - Dedicated approval/result stores still precede event evidence.
  - Evidence: No Pi/HTTP registration or allowlist change; events remain repair/observability records.
- BQC authorization/contract check: PASS - Event success requires closed outcome equality and cannot grant protected state.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T013 - Record event and storage evidence

**Started**: 2026-08-11 19:34
**Completed**: 2026-08-11 19:38
**Duration**: 4 minutes

**Notes**:
- Replaced Task `04` template text only for the implemented Session 01
  boundary, explicitly leaving projection, bounds, replay, and resume unclaimed.
- Documented the envelope, metadata availability, payload variants, durability,
  corruption outcomes, authority split, and legacy-file compatibility decision.

**Files Changed**:
- `docs/build-log-week3.md` - Added source-backed event schema and storage evidence.

**Verification**:
- Command/check: targeted heading/content scan of `docs/build-log-week3.md`
  - Result: PASS - Goal, Event Schema, Storage Contract, and Session 02 boundary are present.
  - Evidence: Implemented versus remaining behavior is explicit.
- Command/check: ASCII scan of `docs/build-log-week3.md`
  - Result: PASS - No non-ASCII content found.
  - Evidence: `grep -P` returned no matches.
- UI product-surface check: N/A - Documentation evidence only.
- UI craft check: N/A - Documentation evidence only.

---

### Task T014 - Complete event contract edge coverage

**Started**: 2026-08-11 19:38
**Completed**: 2026-08-11 19:43
**Duration**: 5 minutes

**Notes**:
- Added exact wrapper coverage for every current run terminal, approval, and
  fake-send payload variant.
- Added arbitrary thrown proxy values across every public validator and event
  creation boundary; public guards now return false or canonical failure.
- Corrected the nested qualification failure fixture to use the canonical
  failure value rather than the outcome wrapper.

**Files Changed**:
- `tests/run-event.test.ts` - Expanded all-variant and thrown-boundary coverage.
- `src/run-event.ts` - Canonicalized thrown validators and froze created outcomes.

**Verification**:
- Command/check: `npx tsx --test tests/run-event.test.ts tests/event-store.test.ts`
  - Result: PASS - Complete contract and store matrix is green.
  - Evidence: 18/18 focused tests pass.
- BQC trust/error fix: Public TypeBox and object-shape guards could throw on hostile proxies; wrapped them in fail-closed boundaries.
  - Evidence: Arbitrary non-Error throws now produce only false or `invalid_input`.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T015 - Complete event-store durability coverage

**Started**: 2026-08-11 19:43
**Completed**: 2026-08-11 19:45
**Duration**: 2 minutes

**Notes**:
- Confirmed append/read/restart and the complete damaged-evidence and injected-
  operation matrix against the final outcome API.
- Kept each injected I/O case in an isolated file so a possible prior append
  cannot contaminate another failure assertion.

**Files Changed**:
- `tests/event-store.test.ts` - Finalized strict typing and isolated I/O cases.

**Verification**:
- Command/check: strict file-specific TypeScript check for event store and tests
  - Result: PASS - Zero diagnostics.
  - Evidence: Strict and unchecked-index checks pass.
- Command/check: `npx tsx --test tests/run-event.test.ts tests/event-store.test.ts`
  - Result: PASS - Contract and durability suites are fully green.
  - Evidence: 18/18 focused tests pass.
- BQC persistence check: PASS - Restart freshness, cleanup, mutation guard, canonical failures, and exact re-read are covered.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T016 - Migrate affected shared-boundary regressions

**Started**: 2026-08-11 19:45
**Completed**: 2026-08-11 19:55
**Duration**: 10 minutes

**Notes**:
- Migrated qualification, approval, fake-send, safe-write, and run projection
  fixtures to validated append/read outcomes and nested closed payloads.
- Replaced legacy in-memory event adapters with the shared factory and canonical
  outcomes while preserving injected failure and immutability assertions.
- Added explicit corrupt-record regressions for mismatched outer/data
  discriminants and prevented invalid fixtures from bypassing the store API.

**Files Changed**:
- `tests/run-event-test-helpers.ts` - Added strict append/read outcome helpers.
- `tests/pi-agent.test.ts` - Built valid closed events and isolated corrupt evidence.
- `tests/qualification-tool.test.ts` - Migrated nested qualification/draft assertions.
- `tests/approval-service.test.ts` - Migrated recovery and boundary outcomes.
- `tests/fake-send-service.test.ts` - Rebuilt the in-memory adapter on the shared contract.
- `tests/safe-write-application.test.ts` - Migrated integration reads and raw-corruption fixture.

**Verification**:
- Command/check: `npm run check`
  - Result: PASS - Application and affected tests compile against the closed API.
  - Evidence: TypeScript completed with zero diagnostics.
- Command/check: focused seven-suite event/application regression command
  - Result: PASS - Contract, store, run, qualification, approval, fake-send, and safe-write behavior is green.
  - Evidence: 88/88 tests pass with no skips.
- BQC regression check: PASS - Invalid adapters and corrupt discriminants fail closed; exact three-tool allowlist remains unchanged.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.

---

### Task T017 - Update active tracking and Unreleased notes

**Started**: 2026-08-11 19:55
**Completed**: 2026-08-11 19:58
**Duration**: 3 minutes

**Notes**:
- Recorded the implemented closed event contract and durable adapter in active
  Phase 02 tracking and the Unreleased changelog.
- Kept Session 01 review/validation open and explicitly left projection,
  execution bounds, replay, and resume for later sessions.

**Files Changed**:
- `docs/TODO.md` - Recorded Session 01 implementation status and remaining boundary.
- `docs/CHANGELOG.md` - Added contract/store and producer-migration notes.

**Verification**:
- Command/check: targeted Phase 02 and Unreleased documentation review
  - Result: PASS - Current capability and remaining work are stated without overclaiming.
  - Evidence: Session 01 remains unchecked pending review and validation.
- BQC truthfulness check: PASS - Dedicated authorization/result truth and exact deferred recovery work remain explicit.
- UI product-surface check: N/A - Documentation tracking only.
- UI craft check: N/A - Documentation tracking only.

---

### Task T018 - Complete verification and final diff review

**Started**: 2026-08-11 19:58
**Completed**: 2026-08-11 20:15
**Duration**: 17 minutes

**Notes**:
- Applied the `verify-production-agent` workflow to the event, persistence,
  agent, permission, data, and documentation diff.
- Hardened frozen factory failures, exact append-outcome matching, semantic
  read sequences, hostile dependency handling, and indeterminate write mapping.
- Added deterministic regressions for short IDs, duplicate/decreasing adapter
  histories, thrown/mismatched appends, hostile store values, and test cleanup.
- Confirmed no external effect, Pi/HTTP exposure, dependency, credential, or
  real-data capability was added. The exact three-tool allowlist is unchanged.

**Files Changed**:
- `src/run-event.ts` - Finalized immutable, exact, sequence-aware boundary guards.
- `src/event-store.ts` - Canonicalized hostile and indeterminate I/O boundaries.
- `src/pi-agent.ts` - Hardened normalized SDK events and exact append confirmation.
- `src/tools.ts` - Added fail-closed exact append confirmation for tool evidence.
- `tests/run-event.test.ts` - Added final semantic and immutability regressions.
- `tests/event-store.test.ts` - Added hostile/I/O assertions and temporary cleanup.
- `tests/qualification-tool.test.ts` - Added thrown/mismatched append regressions.
- `docs/build-log-week3.md` - Reconciled failure semantics and focused test count.

**Verification**:
- Command/check: `npm run check`
  - Result: PASS - Strict TypeScript reports zero diagnostics.
  - Evidence: Standalone check and the full verifier both completed successfully.
- Command/check: `npm test`
  - Result: PASS - All deterministic repository tests pass.
  - Evidence: 175/175 tests, zero skips or failures.
- Command/check: `npm run eval`
  - Result: PASS - All current critical evals pass.
  - Evidence: 5/5 eval cases.
- Command/check: `npm run verify`
  - Result: PASS - Format, lint, types, tests, and evals are green.
  - Evidence: Biome checked 38 files with no fixes required.
- Command/check: `npm run test:coverage`
  - Result: PASS - Repository coverage gates exceed configured thresholds.
  - Evidence: 95.95% lines, 87.16% branches, and 96.84% functions.
- Command/check: `npm audit`
  - Result: PASS - Zero dependency vulnerabilities.
  - Evidence: npm reported `found 0 vulnerabilities`.
- Command/check: permission/data, credential-shape, ASCII/LF, diff, and archive-integrity scans
  - Result: PASS - No widened capability, sensitive fixture, encoding, whitespace, or archive mismatch found.
  - Evidence: Production allowlist remains exactly three tools; archived Phase 00 files match `HEAD` byte-for-byte.
- BQC fixes: exact replaceable-boundary outcomes, arbitrary thrown values, indeterminate persistence, and cleanup behavior were repaired and regression-tested.
- UI product-surface check: N/A - No UI surface changed.
- UI craft check: N/A - No UI surface changed.
- Remaining risk: the store is intentionally synchronous and single-process; run projection, whole-run bounds, replay, resume, and retention completion remain assigned to Sessions 02-04.

---

## Checkpoints

### Checkpoint 1 - Planning And Baseline Complete

- Spec objectives remain in scope; no permission, provider, UI, or database work
  was added.
- Next: T003 write contract-first RED tests for the closed event contract.

### Checkpoint 2 - Contract And Store RED

- Focused tests fail only because the planned `run-event` contract and hardened
  adapter do not exist.
- Spec objectives and capability constraints remain unchanged.
- Next: T005 define the versioned envelope, metadata, and canonical failures.

### Checkpoint 3 - Closed Contract Green

- `src/run-event.ts` compiles strictly and 9/9 contract tests pass.
- The exact three-tool, synthetic-only, and dedicated authorization/result
  boundaries remain unchanged.
- Next: T008 refactor the file adapter around validated injected operations.

### Checkpoint 4 - Hardened Store Green

- Strict adapter checks and 16/16 event contract/store tests pass.
- Re-read confirmation, resource cleanup, private mode, and damaged evidence
  behavior match the session specification.
- Next: T011 migrate run, Pi, qualification, and draft event boundaries.

### Checkpoint 5 - Application Producers Migrated

- All application source compiles against closed event outcomes; remaining
  TypeScript diagnostics are intentionally limited to legacy test callers.
- Permission and idempotency owners remain unchanged.
- Next: T013 document the implemented event and storage boundary.

### Checkpoint 6 - Session Implementation Complete

- Re-read the session objectives and success criteria: the closed durable event
  boundary is complete with no projection, bound, replay, or resume scope drift.
- Focused event/store tests pass 19/19; all affected suites pass 90/90; the
  repository gate passes 175/175 tests and 5/5 evals.
- Production permissions remain exactly three Pi tools with fake execution
  internal and unreachable from Pi or HTTP.
- Next: run `creview` over every change since base commit
  `5c5de157c86fc8267d0b3db60f9039a47bcf53ac`.
