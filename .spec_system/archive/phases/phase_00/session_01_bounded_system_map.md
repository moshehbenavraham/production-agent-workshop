# Session 01: Bounded System Map

**Session ID**: `phase00-session01-bounded-system-map`
**Status**: Not Started
**Estimated Tasks**: ~18-22
**Estimated Duration**: 2-4 hours

---

## Objective

Produce the complete Task `00` evidence pack for the current bounded system without changing production behavior.

---

## Scope

### In Scope (MVP)

- Read the client brief, governance, root guidance, source, tests, and current deployment configuration.
- Run and record the provider-independent type-check, deterministic test, and deterministic eval baseline.
- Create Mermaid architecture and request-flow diagrams covering the interface, harness, tools, state, infrastructure, observability, human approval, and eval boundaries.
- Trace success, unknown-lead, and thrown-error paths from `POST /runs` through the Pi session, events, stop-reason derivation, and response mapping.
- Document ownership, persistence points, external dependencies, the exact custom-tool allowlist, and current deployment exposure.
- Write the Harness Decision Record, permission table, risk register, repository-guidance map, smallest useful product boundary, and five-sentence stop explanation.
- Record exact commands, results, one exercised failure, diff review, and remaining risks in the Build Log.

### Out of Scope

- Runtime behavior, schema, prompt, tool, event, endpoint, or deployment changes.
- Durable approval decisions, an external-write adapter, recovery, production eval expansion, or public deployment.
- Redis, a queue, a database, another agent, or real customer data.

---

## Prerequisites

- [ ] Dependencies required by `npm run verify` are available.
- [ ] Only synthetic fixtures and redacted evidence are used.

---

## Deliverables

1. Mermaid architecture and request-flow diagrams with all eight named boundaries and source owners.
2. Harness Decision Record, permission table, risk register, repository-guidance map, and stop-boundary explanation.
3. Build Log evidence containing exact baseline verification output, failure evidence, diff review, and remaining risks.

---

## Success Criteria

- [ ] Every runtime boundary, persistence point, external dependency, and exposure is mapped to current repository evidence.
- [ ] The trace covers success, unknown-lead, and thrown-error behavior and distinguishes model decisions, harness enforcement, and application permissions.
- [ ] Source evidence proves Pi has no shell, filesystem, approval-decision, or send capability and explains why prompt wording is not authorization.
- [ ] The provider-independent baseline passes with the recorded type-check, four deterministic tests, and five eval cases.
- [ ] At least three production risks are assigned to their later owning tasks.
