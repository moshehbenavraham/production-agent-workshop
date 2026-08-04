# Session Specification

**Session ID**: `phase00-session03-qualification-tool-integration`
**Phase**: 00 - Foundation
**Status**: Not Started
**Created**: 2026-08-04
**Base Commit**: 0071b0fffac70d8d62685eaf9875454f8903fabe

---

## 1. Session Overview

This session completes Task `01` and Phase 00 by integrating the validated
Session 02 qualification domain through one focused Pi custom tool. The tool
replaces raw lead inspection in the exact three-tool production allowlist,
records minimized attempt and terminal evidence under the existing `runId`,
and enforces a 1,000 ms application deadline without adding an external effect.

The runtime must expose application-owned qualification truth to both Pi and
the typed run result, prevent downstream draft or approval work from bypassing
the latest exact-lead qualification, and derive failure stop reasons from
durable application evidence rather than assistant prose. Deterministic tests
exercise the actual Pi `ToolDefinition` and a provider-independent vertical
slice; no credential or model request is needed for the completion gate.

---

## 2. Objectives

1. Replace `inspect_lead` with a closed-schema `qualify_lead` tool while
   keeping exactly three bounded custom tools and zero shell or filesystem
   capability.
2. Enforce a cleanup-safe 1,000 ms qualification deadline and persist one
   minimized attempt plus exactly one completed or failed event for every
   executed wrapper call.
3. Require the latest validated qualification for the exact requested lead
   before draft or approval work and expose the structured outcome in the run
   result.
4. Prove known, invalid, unknown, dependency-failure, invalid-result, timeout,
   bypass, and pending-approval paths with deterministic event and stop-reason
   evidence.

---

## 3. Prerequisites

### Required Sessions

- [x] `phase00-session01-bounded-system-map` - provides the verified runtime,
  permission, persistence, and stop-boundary map.
- [x] `phase00-session02-qualification-contract-and-domain` - provides the
  closed schemas, deterministic domain result, structured failure union, and
  focused tool contract.

### Required Tools Or Knowledge

- Node.js, npm, Git, TypeScript, TypeBox, `node:test`, TSX, Pi custom-tool
  definitions, append-only JSONL events, and Apex analysis/prerequisite tools.
- Pi 0.83.0 `defineTool` parameter inference and five-argument asynchronous
  execution contract, verified from the pinned package declarations and SDK
  documentation.

### Environment Requirements

- Use Node.js 24.15.0 and npm 12.0.2 through the installed NVM toolchain.
- Keep dependencies installed from the committed lockfile; no dependency
  addition is planned.
- No Pi provider credential, model session, network request, or real lead data
  is required for deterministic verification.

---

## 4. Scope

### In Scope (MVP)

- Pi can call one focused `qualify_lead` tool with the exact closed
  `QualificationInputSchema` - return JSON text plus typed details containing
  only a validated `QualificationOutcome`.
- Application can bound every executed qualification call - race the
  application-owned executor against a 1,000 ms default timer, clear the timer
  on every exit, redact thrown or invalid executor results, and ignore late
  completion after one timeout outcome.
- Operator can correlate qualification evidence - append
  `qualification.attempted` followed by exactly one
  `qualification.completed` or `qualification.failed` event with the existing
  envelope-provided `runId` and only schema-owned fields.
- Application can bind all three tools to the run's exact requested lead - a
  mismatched qualification input is `invalid_input`, and draft or approval is
  denied unless the latest terminal qualification evidence is a matching
  success.
- Operator can receive typed qualification and an application-derived stop
  reason - add the outcome to `RunResult`; map `lead_not_found` to `not_found`,
  other qualification failures to `qualification_failed`, success plus a
  pending approval to `approval_pending`, and success without approval to
  `completed`.
- Maintainer can run provider-independent tool and vertical-slice tests - call
  the actual Pi tool definition with a temporary JSONL store, inject controlled
  failure/deadline behavior, and verify exact event data, run correlation,
  bypass denial, and no external effect.
- Workshop participant can inspect final Task `01` evidence - complete the
  event sequence, test matrix, red/fix/green record, sub-60-second deterministic
  demo, safety review, and current security posture.

### Out Of Scope (Deferred)

- Durable approval decisions, exact draft-to-approval state transitions, and
  restart projection - Reason: Task `02` and Phase 01 own those behaviors; this
  session only requires validated qualification before the existing pending
  record.
- Fake or real sending, network-writing tools, target authorization, and write
  idempotency - Reason: Task `03` owns the fake boundary and real sending is
  outside the required path.
- HTTP authentication, tenant isolation, rate limiting, public exposure, or a
  new route - Reason: Task `07` owns exposure controls; current pre-run HTTP
  validation remains unchanged.
- Recovery, replay, database/queue/Redis adoption, provider credentials, real
  customer data, another agent, or Phase 01 planning - Reason: later ordered
  work owns those scopes and Phase 00 is the strict cutoff for this objective.

---

## 5. Technical Approach

### Architecture

Export the centralized qualification failure constructor from
`src/qualification.ts`. In `src/tools.ts`, add an application wrapper that
accepts raw input, the requested run lead, an injectable sync-or-async
qualification executor, and a configurable test-only deadline whose production
default is the exported 1,000 ms constant. The wrapper validates executor
output, writes one attempted and one terminal event, and returns the same closed
outcome used in event projection.

Build `qualify_lead` directly from `QualificationInputSchema`, return the
outcome as JSON content and typed details, and replace `inspect_lead` in the
three-tool tuple. Read the latest terminal qualification event to gate exact
lead drafting and approval. In `src/pi-agent.ts`, use an exported immutable
allowlist constant, update the system prompt, reconstruct the typed outcome
from events, derive stop reason with qualification failure taking precedence
over model prose or an invalid approval sequence, and include the outcome in
`RunResult`.

### Design Patterns

- Application deadline race: one executor promise and one timer outcome with
  `finally` cleanup and exactly one persisted terminal event.
- Event projection: reconstruct closed qualification truth from validated
  terminal event data rather than conversation history.
- Exact-run binding: close each tool over the HTTP-validated requested lead ID
  and reject cross-lead model arguments before domain work.
- Evidence gate: downstream tools require the latest projected qualification
  to be a matching success; prompt order is guidance, not authorization.
- Dependency injection: production uses deterministic `qualifyLead`; tests use
  controlled throws, invalid results, and delayed promises without provider or
  network access.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `tests/qualification-tool.test.ts` | Tool schema, event, timeout, failure, gate, and vertical-slice tests | ~300 |
| `tests/pi-agent.test.ts` | Exact allowlist, outcome projection, and stop-reason tests | ~140 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `src/qualification.ts` | Export centralized structured-failure construction | ~4 |
| `src/tools.ts` | Add deadline wrapper, event projection, focused tool, exact-run gates, and replace inspection | ~190 |
| `src/pi-agent.ts` | Update prompt/allowlist, typed run outcome, and evidence-derived stop behavior | ~70 |
| `src/evals.ts` | Replace inspection evals with deterministic typed qualification assertions | ~20 |
| `docs/build-log.md` | Complete Task `01` runtime, event, test, demo, and safety evidence | ~220 |
| `.spec_system/SECURITY-COMPLIANCE.md` | Record the implemented qualification boundary and remove its open gap | ~20 |
| `docs/TODO.md` | Track Session 03 implementation, review, validation, and completion | ~2 |
| `docs/CHANGELOG.md` | Record the qualification tool and event integration | ~4 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] `qualify_lead` uses the exact closed input schema, returns only a
  schema-valid outcome, and is the sole lead-read tool in the exact three-tool
  production allowlist.
- [ ] Every executed wrapper call appends one attempted and exactly one
  completed or failed event under one `runId`; terminal data validates as a
  qualification result or failure and excludes name, company, stack, problem,
  draft, credential, and raw exception detail.
- [ ] The production deadline is exactly 1,000 ms, the timer is cleared on
  success/failure/timeout, rejected or invalid executor results are redacted,
  and a late completion cannot append another terminal event.
- [ ] Tool input must match the exact requested run lead, and the latest
  terminal qualification must be a matching success before draft or approval
  work can occur.
- [ ] Known leads expose deterministic typed qualification in `RunResult` and a
  known vertical slice still ends at `approval_pending` without sending.
- [ ] Unknown leads return `lead_not_found` and `not_found`; missing,
  malformed, mismatched, thrown, invalid-result, and timeout paths remain
  structured failures without qualification or friendly success.
- [ ] Qualification failure takes precedence over assistant prose and any
  invalid downstream sequence when deriving the visible run stop reason.
- [ ] The prompt, custom tool definitions, and allowlist expose no shell,
  filesystem, approval-decision, external-send, credential, or network-writing
  capability.

### Testing Requirements

- [ ] Contract-first RED evidence precedes implementation and the same targeted
  tool/integration commands pass afterward.
- [ ] Deterministic tests cover schema closure, success, missing, malformed,
  cross-lead mismatch, unknown, thrown executor, invalid executor result,
  timeout, late result, minimized events, downstream bypass, exact allowlist,
  outcome projection, stop precedence, and pending approval.
- [ ] A provider-independent vertical-slice command completes in under 60
  seconds and proves qualification, draft, pending approval, correlated events,
  typed result projection, and `approval_pending`.
- [ ] `npm run verify` and the repository production-agent verification skill
  pass under Node.js 24.15.0 and npm 12.0.2.

### Non-Functional Requirements

- [ ] No new dependency, HTTP route, database, queue, Redis, provider call,
  real data, external write, deployment behavior, or fourth runtime tool is
  introduced.
- [ ] All new async work releases its timer and produces no dangling task,
  duplicate terminal event, silent failure, or raw caught detail.
- [ ] Event and response contracts are JSON-serializable, deterministic for a
  fixed fixture snapshot, and independently testable without model access.
- [ ] The current pending-approval record remains a no-send boundary; exact
  durable approval and write authorization remain explicitly deferred.

### Quality Gates

- [ ] All files ASCII-encoded with Unix LF line endings.
- [ ] Strict TypeScript and repository ESM/style conventions pass.
- [ ] Every source behavior change has deterministic success and failure
  coverage.
- [ ] Behavioral quality has no high-severity resource-cleanup, trust-boundary,
  mutation, failure-path, or contract-alignment violation.
- [ ] Security review confirms minimized synthetic evidence, exact permission
  preservation, and zero new secret or external-effect surface.
- [ ] Documentation claims distinguish deterministic application evidence from
  an optional provider-backed smoke test that is not required or claimed.

---

## 8. Implementation Notes

### Working Assumptions

- The 1,000 ms value is a production wrapper deadline, not a required test
  duration. Tests inject a shorter positive deadline into the same code path;
  the exported production constant and default are asserted directly.
- The required 60-second demo is provider-independent. It executes the actual
  Pi tool definition and the deterministic application pipeline with synthetic
  data; no unrequested provider usage, credential access, or network call is
  needed to prove the contract.
- One lead is requested per run. `buildTools` therefore receives the already
  HTTP-validated run lead ID and binds every tool to it; this closes model
  cross-lead substitution without changing the HTTP contract.

### Conflict Resolutions

- Task `01` requires missing and malformed failure coverage associated with a
  `runId`, while `src/server.ts` correctly rejects invalid HTTP input before a
  run exists and Pi validates tool parameters before `execute`. Preserve both
  trust boundaries: test the raw application wrapper with a synthetic `runId`,
  keep the closed Pi schema, and do not invent a run for rejected HTTP input.
- The existing prompt orders inspection before drafting, but the phase evidence
  says prompt order is not enforcement. Require latest matching qualification
  evidence in downstream application tools; do not rely on model sequencing.
- Full durable draft-to-approval linkage belongs to Task `02`. This session
  enforces qualification as the prerequisite but does not claim to solve the
  later approval-state contract.

### Key Considerations

- A terminal event is application truth only when its data passes the same
  result or failure validator used by the tool outcome.
- Failure stop reason must win over assistant text and a model-attempted
  downstream action; `approval_pending` is valid only after matching
  qualification success.
- Timer cleanup and late-result suppression are observable test obligations,
  even though the production domain executor is synchronous today.
- Phase 00 completion must not generate, plan, or start any Phase 01 artifact.

### Potential Challenges

- Pi tool definitions require a five-argument asynchronous executor: tests call
  the same definition with inert signal/update/context values and never mock a
  different tool shape.
- Promise races can leave timers or late work behind: clear the timer in
  `finally`, persist terminal evidence only after the race winner is known, and
  assert the event count after a delayed loser resolves.
- A model may skip or reorder tools: bind the requested lead in the closure and
  gate draft/approval using validated event projection.
- Event projection can accept corrupted records accidentally: validate every
  terminal `data` object and fail the run visibly when no valid outcome exists.

### Relevant Considerations

- [P00] **Bounded architecture**: preserve one Pi session, exact custom tools,
  HTTP-only input validation, and application-owned evidence.
- [P00] **Append-only lifecycle evidence**: every executed qualification call
  gets one correlated attempt and terminal event; later replay work remains
  deferred.
- [P00] **Typed handoffs**: structured qualification crosses tool, event, and
  run-result boundaries; raw model prose never becomes durable truth.

### Behavioral Quality Focus

Checklist active: Yes

Top behavioral risks for this session:

- A timer, delayed executor, or rejected promise leaks resources or appends a
  second terminal event after timeout.
- The model skips qualification, substitutes another lead, or continues to
  draft/approval after a structured qualification failure.
- Event projection or `RunResult` drifts from the TypeBox outcome contract and
  turns missing/corrupt evidence or assistant prose into apparent success.

---

## 9. Testing Strategy

### Unit Tests

- Compile the actual tool parameter schema and reject missing, malformed,
  cross-lead, and additional-property inputs at the appropriate boundary.
- Execute success, unknown, thrown, invalid-result, and timeout paths; validate
  typed details and exact minimized attempted/terminal event data.
- Resolve a delayed executor after timeout and prove no additional terminal
  event appears.
- Project terminal events into outcomes and exhaustively assert all run stop
  reasons, with failure taking precedence over approval evidence.

### Integration Tests

- Build the exact three-tool tuple for one run, call the actual
  `qualify_lead`, then draft and request approval for the same lead; assert
  event order, one `runId`, typed qualification, pending approval, and no send.
- Attempt draft and approval before qualification, after failure, and for a
  mismatched lead; assert no draft or approval event is created.
- Run all existing tool, event-store, domain tests, and evals to prove the
  focused replacement preserves the bounded baseline.

### Runtime Verification

- Execute the named deterministic vertical-slice test directly through TSX and
  record wall time, exact result, event types, minimized data keys, and
  `approval_pending` in the Build Log.
- Inspect production source to prove `customTools` and `tools` contain only
  `qualify_lead`, `draft_follow_up`, and `request_send_approval`.

### Edge Cases

- Missing or inherited-only `leadId`, malformed pattern, additional property,
  valid but wrong run lead, unknown lead, throwing executor, rejecting promise,
  invalid outcome, timeout, late resolution, repeated safe call, model bypass,
  corrupted event data, and failure plus attempted approval.

---

## 10. Dependencies

### Other Sessions

- Depends on: `phase00-session01-bounded-system-map` and
  `phase00-session02-qualification-contract-and-domain`.
- Depended by: Phase 00 audit and transition only. No Phase 01 session or plan
  is created by this work.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
