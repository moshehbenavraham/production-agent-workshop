# Session Specification

**Session ID**: `phase03-session01-observability-contract-and-service-health`
**Phase**: 03 - Operations and Coolify Release
**Status**: Complete
**Created**: 2026-08-12
**Base Commit**: 9338985be31675c245bd20cf4361ba894173b92c
**Completed**: 2026-08-12
**Validated**: 2026-08-12
**Version**: `0.1.32`

---

## 1. Session Overview

This session defines the minimized service, run, model, and tool observation
contracts required by Task `06`, then implements a bounded service snapshot for
uptime, memory, CPU, storage, and configured dependencies. It is next because
safe reporting, alerting, and incident drills need a closed field vocabulary
before they can interpret operational evidence.

The implementation extends the existing TypeBox and semantic-validation style
without changing durable approval or effect authority. Detailed snapshots stay
behind an application boundary; the public `GET /health` response remains the
lightweight `{"status":"ok"}` contract.

## 2. Objectives

1. Define closed, immutable observation variants for the four Task `06` layers.
2. Require exact validated correlation and bounded finite metadata for every run-scoped observation.
3. Collect service and dependency health with explicit available, unavailable, and not-applicable states.
4. Prove collection failures and untrusted input cannot leak protected content or broaden permissions.

## 3. Prerequisites

### Required Sessions

- [x] `phase02-session07-boundary-regression-exercises-and-evidence` - closes the Phase 02 recovery and eval baseline.

### Required Tools Or Knowledge

- Node.js 24 process and filesystem metric APIs.
- TypeBox runtime schemas and the repository's closed-union validation patterns.
- Existing schema-v2 run events, bounded lifecycle metadata, and application version source.

### Environment Requirements

- No provider credential or live Coolify target is required.
- Tests use synthetic inputs and injected metric boundaries only.

## 4. Scope

### In Scope (MVP)

- Operators can distinguish service, run, model, and tool observation layers through closed discriminants in `src/observability.ts`.
- Operators receive exact `runId`, environment, application version, step, retry, duration, error, permission, result, and side-effect fields when applicable.
- Operators receive tagged token, cost, process, storage, queue, and dependency measurements without invented defaults.
- Application code can collect one bounded service snapshot with injected process, storage, clock, and dependency boundaries.
- Maintainers receive deterministic contract, correlation, bounds, minimization, redaction, and collection-failure tests.
- Week 4 evidence records the field map and non-authority decision.

### Out Of Scope (Deferred)

- Chronological run query rendering - Session 02 consumes these contracts.
- Alert evaluation and incident response procedures - Session 03 owns policy and runbook behavior.
- Incident drills - Session 04 exercises the finished operational surface.
- Public detailed health or metrics routes - controlled operator access is not yet implemented.
- Coolify deployment or private target evidence - Sessions 05 through 08 own release work.
- Any Pi allowlist, approval-decision, fake-effect, network-write, or public `/runs` permission change - prohibited by the phase boundary.

## 5. Technical Approach

### Architecture

Create `src/observability.ts` as a closed non-authoritative contract and
collection boundary. A discriminated observation union owns four layers:
`service`, `run`, `model`, and `tool`. Run, model, and tool variants require the
existing run identifier contract; model and tool variants carry bounded step
and retry identity. Tagged measurements distinguish `available`,
`unavailable`, and `not_applicable`, with finite reasons and bounded numeric
values.

The service collector validates its entire configuration before invoking any
dependency. It obtains process uptime, memory, CPU, storage, queue, and
configured dependency state through injectable boundaries, converts thrown or
malformed results to minimized unavailable categories, rejects inconsistent
or oversized results, freezes successful output, and never includes paths,
URLs, raw errors, credentials, lead data, or draft content.

### Design Patterns

- Closed discriminated unions: prevent unknown layers, states, labels, and failure categories.
- Runtime validation plus semantic guards: reject shape-valid correlation, totals, range, or identity mismatches.
- Tagged availability: distinguish measured zero from unavailable and not applicable.
- Dependency injection: exercise collection success and failure without host or network assumptions.
- Deep immutable output: prevent operational evidence from being mutated into apparent authority.

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `src/observability.ts` | Four-layer contracts, validators, factories, and bounded service snapshot collection | ~500 |
| `tests/observability.test.ts` | Contract, semantic, correlation, bounds, availability, redaction, and collector tests | ~650 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `docs/build-log-week4.md` | Record the implemented field map, controlled boundary, and focused evidence | ~70 |
| `docs/TODO.md` | Reflect Session 01 Task `06` progress without claiming Task `06` completion | ~8 |
| `docs/CHANGELOG.md` | Record the new observability contract and service snapshot behavior | ~8 |

## 7. Success Criteria

### Functional Requirements

- [ ] Four closed observation variants remain distinguishable by layer and kind.
- [ ] Every run, model, and tool observation requires the exact validated `runId`.
- [ ] Environment, application version, step, retry, duration, error, permission, result, and side-effect fields are finite and bounded.
- [ ] Token, cost, uptime, memory, CPU, storage, queue, and dependency values are measured or explicitly unavailable/not applicable.
- [ ] Service collection exposes no path, URL, raw thrown value, secret, lead attribute, or draft body.
- [ ] Observations cannot authorize approval, prove an effect, or alter the Pi/HTTP permission surface.
- [ ] `GET /health` remains exactly the existing lightweight public response.

### Testing Requirements

- [ ] Contract and semantic unit tests pass for valid and malformed variants.
- [ ] Service collector tests cover measured zero, unavailable metrics, malformed dependencies, thrown boundaries, correlation, and immutable output.
- [ ] Existing allowlist, HTTP, recovery, eval, and persistence tests remain green.

### Non-Functional Requirements

- [ ] Collection is bounded to at most 20 configured dependencies and one storage target.
- [ ] Every string, label, identifier, number, array, and collection failure has a finite bound or vocabulary.
- [ ] Detailed evidence remains controlled and safe for synthetic fixtures only.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code follows project conventions.
- [ ] `npm run verify` passes.

## 8. Implementation Notes

### Working Assumptions

- Detailed service snapshots remain a library boundary in this session: the stub explicitly preserves lightweight `/health`, while later sessions own controlled operator reporting and deployment monitoring. No new HTTP route is needed to prove the contract.
- `src/observability.ts` may reuse `RunEventRunIdSchema` and `APPLICATION_VERSION`, but observations remain a separate read-only interpretation layer because the PRD says operational evidence cannot become approval or effect authority.
- Storage collection targets the configured data directory through an injected bounded identifier and callback; committed output must not contain the filesystem path or private target details.

### Conflict Resolutions

- Existing run-event metadata uses `null` for some unavailable provider values, while Phase 03 requires explicit availability reasons. New observation contracts use tagged availability and adapt existing evidence later; this session does not rewrite schema-v2 durable events or invalidate Phase 02 history.

### Key Considerations

- Keep the four layers distinct even when they originate from one durable run event.
- Validate all options before invoking process, filesystem, or dependency callbacks.
- Canonicalize failures to finite categories without retaining raw errors.
- Preserve existing public health, rate, body-size, approval, and allowlist contracts.

### Potential Challenges

- Node process metrics have different units: normalize duration to integer milliseconds, CPU to integer microseconds, and bytes to bounded integers.
- Storage and dependency calls can throw or return hostile values: catch at each boundary and emit only a finite unavailable reason.
- Existing event metadata may lack provider usage: preserve explicit unavailability rather than synthesizing zero.

### Relevant Considerations

- [P01] **Durable truth over prose or audit events**: observation output explains state but cannot authorize or repair it.
- [P01] **Frozen least privilege**: no observability function enters the Pi tool allowlist or creates a public route.
- [P02] **Tagged metric availability**: measured zero remains available; missing metrics carry a finite reason.
- [P01] **Untrusted replaceable boundaries**: every injected collector return is runtime-validated and every thrown value is minimized.
- [P01] **Pre-construction validation**: invalid configuration fails before any dependency callback runs.

### Behavioral Quality Focus

Checklist active: Yes
Top behavioral risks for this session:

- A collection failure could throw and hide all service evidence instead of becoming one bounded unavailable measurement.
- Missing provider metrics could be rendered as zero and create false operational confidence.
- Raw paths, URLs, errors, lead fields, or draft content could enter high-cardinality observation output.

## 9. Testing Strategy

### Unit Tests

- Validate each closed observation variant, tagged availability state, finite enum, numeric bound, and immutable factory result.
- Reject extra properties, missing or invalid `runId`, invalid token totals, negative/oversized values, duplicate dependencies, and inconsistent discriminants.

### Integration Tests

- Collect a full synthetic service snapshot through injected process, storage, queue, clock, and dependency boundaries.
- Prove each dependency can fail independently without leaking its thrown value or hiding the remaining observations.
- Re-run the unchanged server and Pi-agent tests to prove the public health response and exact three-tool allowlist remain intact.

### Runtime Verification

- Run the focused observation test, full repository verification, coverage, and security audit without provider credentials.

### Edge Cases

- Measured zero, unavailable with each finite reason, not-applicable queue/storage, empty dependency list, maximum dependency count, duplicate dependency identifiers, callback throws, malformed callback returns, noncanonical timestamps, and maximum numeric bounds.

## 10. Dependencies

### Other Sessions

- Depends on: `phase02-session07-boundary-regression-exercises-and-evidence`.
- Depended by: `phase03-session02-run-timeline-query-and-redaction`, `phase03-session03-alerts-and-incident-runbook`, `phase03-session04-incident-drills-and-operational-baseline`.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
