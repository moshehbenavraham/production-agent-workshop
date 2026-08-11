# Session 01: Observability Contract and Service Health

**Session ID**: `phase03-session01-observability-contract-and-service-health`
**Status**: Not Started
**Source Task**: `06`
**Estimated Tasks**: ~18
**Estimated Duration**: 2-4 hours

---

## Objective

Define and implement minimized four-layer observability contracts and bounded service and dependency health evidence without changing durable authority or production permissions.

---

## Scope

### In Scope (MVP)

- Inventory existing service, run, model, tool, approval, recovery, and terminal evidence and identify exact Task `06` gaps.
- Define closed observation shapes for service health, agent-run state, model calls, and tool calls with explicit layer ownership.
- Preserve the originating `runId` across every run-scoped observation and reject missing or inconsistent correlation.
- Define finite application version, environment, step, retry, duration, error, permission, result, and side-effect fields.
- Represent token, cost, dependency, storage, and queue measurements as available, unavailable with a finite reason, or not applicable.
- Add a bounded service snapshot for uptime, memory, CPU, storage, and configured dependency health without exposing secrets or private infrastructure.
- Preserve the existing lightweight `/health` contract while keeping detailed operational evidence on a controlled operator boundary.
- Reuse validated run-event facts where appropriate without making observations an approval or effect authority.
- Bound field length, metric names, labels, numeric values, and collection failures before any persistence or rendering.
- Keep raw provider errors, credentials, lead attributes, full drafts, and private URLs out of observation payloads.
- Add deterministic contract, availability, correlation, bounds, redaction, and dependency-failure tests.
- Document the four-layer field map and data-minimization decision in the Week 4 Build Log.

### Out of Scope

- Chronological operator query rendering, alert evaluation, incident drills, or Coolify deployment.
- Public metrics endpoints, third-party monitoring credentials, or high-cardinality customer labels.
- Changes to approval authority, fake-result truth, Pi tools, HTTP run permissions, or network effects.

---

## Prerequisites

- [ ] Phase 02 event, projection, lifecycle, recovery, and production-eval contracts remain green.
- [ ] Current `/health`, event metadata, and environment boundaries are inventoried before defining new observation fields.

---

## Deliverables

1. Closed four-layer observability contracts with explicit availability, bounds, and correlation semantics.
2. Bounded service and dependency health collection behind a controlled application boundary.
3. Deterministic correlation, failure, redaction, and minimization tests plus the Week 4 observability field map.

---

## Success Criteria

- [ ] Service, run, model, and tool layers remain distinguishable and all run-scoped evidence carries the exact validated `runId`.
- [ ] Uptime, memory, CPU, storage, and configured dependency state are measured or explicitly unavailable without leaking target details.
- [ ] Token, cost, duration, retry, error, permission, result, and side-effect values never use invented defaults.
- [ ] Observability cannot grant approval, prove an effect, broaden Pi or HTTP permissions, or expose protected content.
- [ ] Focused tests pass without provider credentials, a live Coolify target, or real customer data.
