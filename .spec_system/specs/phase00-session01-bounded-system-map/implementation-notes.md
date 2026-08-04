# Implementation Notes

**Session ID**: `phase00-session01-bounded-system-map`
**Started**: 2026-08-04 08:53 IDT
**Last Updated**: 2026-08-04 09:20 IDT

---

## Session Progress

| Metric | Value |
|--------|-------|
| Tasks Completed | 18 / 18 |
| Estimated Remaining | 0 hours |
| Blockers | 0 |

---

## Task Log

### 2026-08-04 - Session Start

**Environment verified**:
- [x] Prerequisites confirmed
- [x] Tools available
- [x] Directory structure ready

---

### Task T001 - Verify deterministic project state and environment prerequisites

**Started**: 2026-08-04 08:53 IDT
**Completed**: 2026-08-04 08:53 IDT
**Duration**: 1 minute

**Notes**:
- Confirmed Phase 00, the planned Session 01 identifier, three candidate stubs, single-repo mode, and no completed sessions.
- Confirmed the spec system, `jq`, and Git prerequisites pass without credentials.

**Files Changed**:
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - initialized task evidence.

**Verification**:
- Command/check: `bash .spec_system/scripts/analyze-project.sh --json && bash .spec_system/scripts/check-prereqs.sh --json --env`
  - Result: PASS - analyzer resolved the active session and prerequisite checker returned `overall: pass`.
  - Evidence: Phase 00 has 3 candidates; current session is Session 01; no environment issues were reported.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

## Checkpoints

### Task T002 - Read the client brief, repository entry point, and linked governance

**Started**: 2026-08-04 08:53 IDT
**Completed**: 2026-08-04 08:54 IDT
**Duration**: 1 minute

**Notes**:
- Read the product job and non-negotiable stop boundary, then reconciled it with architecture, engineering, and security governance.
- Confirmed diagrams must use Mermaid and workshop evidence, TODO, and changelog must stay current.

**Files Changed**:
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded source-of-truth inspection.

**Verification**:
- Command/check: `sed -n` targeted inspection of `docs/todo/client-brief.md`, `AGENTS.md`, `.spec_system/CONSIDERATIONS.md`, `.spec_system/CONVENTIONS.md`, and `.spec_system/SECURITY-COMPLIANCE.md`
  - Result: PASS - all required governance inputs were readable and mutually consistent on the bounded job.
  - Evidence: the client job ends at approval; governance forbids unapproved writes, production shell/filesystem tools, and real customer data.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

### Task T003 - Inspect runtime, tests, evals, and deployment boundaries

**Started**: 2026-08-04 08:54 IDT
**Completed**: 2026-08-04 08:55 IDT
**Duration**: 1 minute

**Notes**:
- Read every TypeScript source and deterministic test, plus the manifest, compiler, container, and example environment contracts.
- Confirmed one HTTP server, one Pi session, three custom tools, one JSONL store, four tests, five evals, and a Docker/Coolify boundary.

**Files Changed**:
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded runtime inventory evidence.

**Verification**:
- Command/check: `sed -n` targeted inspection of `src/*.ts`, `tests/*.ts`, `package.json`, `tsconfig.json`, `Dockerfile`, and `.env.example`
  - Result: PASS - all runtime and deployment owners needed for the evidence map were identified.
  - Evidence: `src/server.ts` owns HTTP, `src/pi-agent.ts` owns orchestration, `src/tools.ts` owns domain tools, and `src/event-store.ts` owns JSONL evidence.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

### Checkpoint 1 - Tasks T001-T003

- Command: `npm run verify`
- Result: PASS - TypeScript check passed, 4/4 tests passed, and 5/5 evals passed.
- Scope check: Session remains evidence-only; no runtime or permission file has changed.
- Next task: T004 - create the Build Log structure.

---

### Task T004 - Create the Task 00 Build Log structure and evidence conventions

**Started**: 2026-08-04 08:55 IDT
**Completed**: 2026-08-04 08:56 IDT
**Duration**: 1 minute

**Notes**:
- Created one appendable workshop evidence source with explicit current-versus-planned and redaction rules.
- Opened the Task `00` entry with a bounded goal that does not imply runtime implementation work.

**Files Changed**:
- `docs/build-log.md` - created the evidence ledger and Task `00` entry structure.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: targeted inspection of `docs/build-log.md`
  - Result: PASS - the file names every evidence category required by `docs/todo/README_todo.md` and contains no unresolved placeholders.
  - Evidence: goal, commands, artifacts, refusal, diff, and remaining-risk requirements are explicit in the opening paragraph.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T005 - document the repository-guidance map and highest-cost guardrail.

---

### Task T005 - Document the repository-guidance map and highest-cost guardrail

**Started**: 2026-08-04 08:56 IDT
**Completed**: 2026-08-04 08:57 IDT
**Duration**: 1 minute

**Notes**:
- Mapped the entry-point, architecture, workflow, security, ordered-path, and active-task authorities without duplicating their full content.
- Identified application-owned exact-action approval as the guardrail that prevents the most expensive mistake: an unauthorized external write.

**Files Changed**:
- `docs/build-log.md` - added the guidance map and guardrail evidence.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: targeted cross-check of the guidance table against `AGENTS.md` and its five referenced workflow sources
  - Result: PASS - every authority and guardrail statement matches current repository text.
  - Evidence: security guidance explicitly says prompt wording is never authorization and source exposes no send boundary.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T006 - create the eight-boundary Mermaid architecture map.

---

### Task T006 - Create the eight-boundary Mermaid architecture map

**Started**: 2026-08-04 08:57 IDT
**Completed**: 2026-08-04 08:59 IDT
**Duration**: 2 minutes

**Notes**:
- Added a Mermaid flowchart naming all eight requested boundaries, source owners, persistence, provider exchange, and HTTP response flow.
- Made the absent business-system write path explicit instead of implying approval can send.

**Files Changed**:
- `docs/build-log.md` - added the architecture map and data-egress statement.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: `npm run check && rg -n '^```mermaid$|1\\. Interface|2\\. Harness|3\\. Tools|4\\. State|5\\. Infrastructure|6\\. Observability|7\\. Human approval|8\\. Evals' docs/build-log.md`
  - Result: PASS - TypeScript remained valid and all eight numbered Mermaid nodes were found.
  - Evidence: map lines 44-51 identify interface, harness, tools, state, infrastructure, observability, approval, and evals.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

### Checkpoint 2 - Tasks T004-T006

- Command: `npm run check`
- Result: PASS - documentation work did not disturb the TypeScript baseline.
- Scope check: only Build Log and session artifacts changed; production source is untouched.
- Next task: T007 - create the three-path request trace.

---

### Task T007 - Create the three-path request trace

**Started**: 2026-08-04 08:59 IDT
**Completed**: 2026-08-04 09:01 IDT
**Duration**: 2 minutes

**Notes**:
- Added a Mermaid sequence diagram for known-lead success, unknown-lead refusal, and thrown error.
- Recorded the current error-path limitation: durable `run.failed` evidence has a `runId`, but the 503 response omits `runId` and `stopReason`.

**Files Changed**:
- `docs/build-log.md` - added the three-path source-backed request trace.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: `rg -n 'run\\.started|domain\\.lead_inspected|approval\\.requested|run\\.completed|run\\.failed|agent_run_failed|invalid_lead_id|body_too_large' src/server.ts src/pi-agent.ts src/tools.ts docs/build-log.md`
  - Result: PASS - every documented event and HTTP outcome maps to current source.
  - Evidence: source contains run start/completion/failure, lead inspection, approval request, and 400/413/503 mappings.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T008 - record ownership, persistence, dependencies, and data egress.

---

### Task T008 - Record ownership, persistence, dependencies, and data egress

**Started**: 2026-08-04 09:01 IDT
**Completed**: 2026-08-04 09:03 IDT
**Duration**: 2 minutes

**Notes**:
- Added a boundary-by-boundary table covering current state, persistence, and every evidenced process egress.
- Explicitly separated committed synthetic fixtures, in-memory Pi context, durable JSONL evidence, and external provider handling.

**Files Changed**:
- `docs/build-log.md` - added ownership, persistence, dependency, and egress evidence.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: targeted inspection of `src/server.ts`, `src/pi-agent.ts`, `src/tools.ts`, `src/event-store.ts`, `Dockerfile`, and `.env.example`
  - Result: PASS - every documented boundary and persistence claim has a current repository owner.
  - Evidence: no database, queue, cache, send provider, or approval-decision integration appears in manifests or source.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T009 - map Pi SDK integration points and harness enforcement.

---

### Task T009 - Map Pi SDK integration points and harness enforcement

**Started**: 2026-08-04 09:03 IDT
**Completed**: 2026-08-04 09:05 IDT
**Duration**: 2 minutes

**Notes**:
- Mapped every Pi SDK element required by Task `00` and separated model choice, harness restriction, application enforcement, and platform ownership.
- Recorded the non-blocking but material ambiguity that approval parameters are not independently tied to a successful lookup or immutable draft.

**Files Changed**:
- `docs/build-log.md` - added the Pi harness and enforcement map.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: `rg -n 'createAgentSession|customTools|tools: \\[|SessionManager\\.inMemory|DefaultResourceLoader|session\\.subscribe|session\\.prompt|session\\.agent\\.state\\.messages|unsubscribe|session\\.dispose|request_send_approval' src/pi-agent.ts src/tools.ts && npm test`
  - Result: PASS - every named Pi integration exists and all 4 deterministic tests pass.
  - Evidence: the allowlist is exactly three custom tools; cleanup occurs in `finally`.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

### Checkpoint 3 - Tasks T007-T009

- Command: `npm test`
- Result: PASS - 4/4 tests passed after the request, ownership, and Pi maps were added.
- Scope check: production source and runtime permissions remain unchanged.
- Next task: T010 - define the smallest useful product boundary.

---

### Task T010 - Define the smallest useful product boundary and validated output contract

**Started**: 2026-08-04 09:05 IDT
**Completed**: 2026-08-04 09:07 IDT
**Duration**: 2 minutes

**Notes**:
- Defined the current useful vertical slice without promoting planned hardening work to implemented behavior.
- Specified how downstream consumers may interpret `runId`, stop reasons, assistant prose, and synthetic approval evidence.

**Files Changed**:
- `docs/build-log.md` - added the bounded product and output trust contract.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: targeted comparison of the boundary table with `RunResult` in `src/pi-agent.ts`, `send()` mapping in `src/server.ts`, and domain events in `src/tools.ts`
  - Result: PASS - documented outputs and limitations match current types and event derivation.
  - Evidence: assistant prose is separate from event-derived `stopReason`; no approval decision or send result exists.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T011 - write the Harness Decision Record.

---

### Task T011 - Write the Harness Decision Record

**Started**: 2026-08-04 09:07 IDT
**Completed**: 2026-08-04 09:09 IDT
**Duration**: 2 minutes

**Notes**:
- Recorded the bounded job, reason for model judgment, deterministic enforcement, stop conditions, human checkpoint, durable evidence, ownership, and rejected complexity.
- Preserved known gaps as consequences rather than inventing controls.

**Files Changed**:
- `docs/build-log.md` - added the complete Harness Decision Record.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: targeted acceptance inspection against the Harness Decision Record requirement in `docs/todo/00-map-the-system.md`
  - Result: PASS - job, model-loop rationale, stops, checkpoint, durable state, success evidence, and four ownership roles are present.
  - Evidence: the record explicitly rejects premature coordination infrastructure and preserves the no-send boundary.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T012 - classify current and proposed actions.

---

### Task T012 - Classify current and proposed actions

**Started**: 2026-08-04 09:09 IDT
**Completed**: 2026-08-04 09:11 IDT
**Duration**: 2 minutes

**Notes**:
- Classified current and planned reads, drafts, approvals, writes, retries, production changes, access, invention, and data handling.
- Kept real sending forbidden throughout the required path and distinguished pending approval creation from authorization.

**Files Changed**:
- `docs/build-log.md` - added the permission table and exact allowlist proof.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: `npm run eval && rg -n 'tools: \\[|name: "inspect_lead"|name: "draft_follow_up"|name: "request_send_approval"|status: "pending"' src/pi-agent.ts src/tools.ts`
  - Result: PASS - 5/5 evals passed and source proves the three-tool allowlist plus pending-only approval shape.
  - Evidence: evals reject fabricated leads and sent wording; no write-capable runtime tool appears.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

### Checkpoint 4 - Tasks T010-T012

- Command: `npm run eval`
- Result: PASS - 5/5 provider-independent evals passed.
- Scope check: permission evidence documents current and planned boundaries without changing them.
- Next task: T013 - add the production risk register.

---

### Task T013 - Add a production risk register with later task ownership

**Started**: 2026-08-04 09:11 IDT
**Completed**: 2026-08-04 09:13 IDT
**Duration**: 2 minutes

**Notes**:
- Mapped eight concrete baseline risks to tasks `01` through `08` and stated their current impact.
- Recorded why additional storage or orchestration is unjustified until a measured acceptance requirement needs it.

**Files Changed**:
- `docs/build-log.md` - added the risk register and least-complexity rationale.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: targeted comparison against Known Gaps and Open Release Blockers in `.spec_system/SECURITY-COMPLIANCE.md` and ordered task ownership in `docs/todo/README_todo.md`
  - Result: PASS - every current production gap has a later owner and none is presented as resolved.
  - Evidence: authentication, durability, limits, recovery, eval, observability, and restore gaps remain explicit.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T014 - add the five-sentence stop-boundary explanation.

---

### Task T014 - Add the five-sentence stop-boundary explanation

**Started**: 2026-08-04 09:13 IDT
**Completed**: 2026-08-04 09:14 IDT
**Duration**: 1 minute

**Notes**:
- Summarized input, lookup, drafting, pending approval, absent capabilities, and the authorization boundary in exactly five sentences.

**Files Changed**:
- `docs/build-log.md` - added the required stop explanation.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: targeted inspection of the numbered `Five-Sentence Stop-Boundary Explanation` section
  - Result: PASS - five numbered sentences explain where the system stops and why.
  - Evidence: the final sentence ties external writes to future exact application-owned authorization.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T015 - run and record the provider-independent baseline.

---

### Task T015 - Run and record the complete provider-independent baseline

**Started**: 2026-08-04 09:14 IDT
**Completed**: 2026-08-04 09:15 IDT
**Duration**: 1 minute

**Notes**:
- Ran the complete repository verification command and recorded its exact commands, assertions, counts, and exit result.
- Normalized only non-ASCII runner glyphs in documentation to preserve the repository encoding contract.

**Files Changed**:
- `docs/build-log.md` - added the verification command and output ledger.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: `npm run verify`
  - Result: PASS - exit 0; TypeScript passed, 4/4 tests passed, and 5/5 evals passed.
  - Evidence: no failed, skipped, cancelled, or todo tests.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

### Checkpoint 5 - Tasks T013-T015

- Command: `npm run verify`
- Result: PASS - full deterministic baseline remains green.
- Scope check: the session has changed evidence and workflow artifacts only.
- Next task: T016 - exercise exact unknown-lead refusal.

---

### Task T016 - Exercise exact unknown-lead refusal evidence

**Started**: 2026-08-04 09:15 IDT
**Completed**: 2026-08-04 09:16 IDT
**Duration**: 1 minute

**Notes**:
- Exercised `findLead("lead_unknown")` without a provider and recorded structured found/fabricated results.
- Confirmed the refusal exits zero only when no lead object is returned.

**Files Changed**:
- `docs/build-log.md` - added the exact refusal command and output.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: `node --import tsx --input-type=module -e '<exact findLead refusal check>'`
  - Result: PASS - exit 0 with `found: false` and `fabricated: false`.
  - Evidence: exact output is recorded in the Build Log.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T017 - verify allowlist, absent send, links, ASCII, and LF.

---

### Task T017 - Verify allowlist, absent send, links, ASCII, and LF

**Started**: 2026-08-04 09:16 IDT
**Completed**: 2026-08-04 09:18 IDT
**Duration**: 2 minutes

**Notes**:
- Proved the exact allowlist and absence of shell, filesystem, send-provider, and CRM capabilities from runtime source and dependencies.
- Verified session scope, ASCII/LF encoding, and all repository-relative Markdown targets.

**Files Changed**:
- `docs/build-log.md` - added the safety-check evidence ledger.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - recorded task evidence.

**Verification**:
- Command/check: permission `rg`, byte-level encoding scan, repository Markdown link scan, and scoped `git diff --name-only`
  - Result: PASS - exact three-tool allowlist, no forbidden capability matches, 4 session files ASCII/LF, 36 Markdown files with valid relative links, and no runtime diff.
  - Evidence: all command outputs recorded in this task and summarized in the Build Log.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

Next task: T018 - update tracking and release notes, then review the final diff.

---

### Task T018 - Update tracking and release notes, then review the final diff

**Started**: 2026-08-04 09:18 IDT
**Completed**: 2026-08-04 09:20 IDT
**Duration**: 2 minutes

**Notes**:
- Updated the active TODO to show implementation complete with review and validation still pending, and added the evidence pack to Unreleased changelog notes.
- Reviewed all tracked and untracked session changes and recorded the remaining risk without claiming later controls exist.

**Files Changed**:
- `docs/TODO.md` - marked implementation complete while keeping review and validation pending.
- `docs/CHANGELOG.md` - recorded the Task `00` evidence pack.
- `docs/build-log.md` - added final diff and remaining-risk evidence.
- `.spec_system/specs/phase00-session01-bounded-system-map/implementation-notes.md` - completed the task ledger.

**Verification**:
- Command/check: `npm run verify && git diff --check` plus byte scan of all changed files
  - Result: PASS - TypeScript passed, 4/4 tests passed, 5/5 evals passed, diff check passed, and 7 changed files are ASCII/LF.
  - Evidence: scoped runtime diff is empty; only workflow and documentation artifacts changed.
- UI product-surface check: N/A - documentation-only session.
- UI craft check: N/A - no user-facing UI.

---

## Implementation Complete

- Tasks: 18/18
- BQC: N/A - no application code changed
- Blockers: none
- Next workflow command: `creview`
