# Session Specification

**Session ID**: `phase00-session01-bounded-system-map`
**Phase**: 00 - Foundation
**Status**: Not Started
**Created**: 2026-08-04
**Base Commit**: 5d9d66432ee0782db8863951266f3670453f7819

---

## 1. Session Overview

This session produces the Task `00` evidence pack for the bounded lead-operations agent without changing production behavior. It is first because the verified architecture, permission boundary, persistence map, and failure traces are prerequisites for the qualification work in Sessions 02 and 03.

The work converts source inspection and provider-independent checks into one durable Build Log entry. The result must distinguish what the model proposes from what the Pi harness coordinates and what the application enforces.

---

## 2. Objectives

1. Map all eight required runtime boundaries to their owning source files and external dependencies.
2. Trace success, unknown-lead, and thrown-error paths from `POST /runs` to terminal evidence and the HTTP response.
3. Record the harness decision, action permissions, current production risks, and the smallest useful product boundary.
4. Prove the baseline with exact deterministic verification and refusal evidence while preserving the existing runtime.

---

## 3. Prerequisites

### Required Sessions

- None - this is the first Phase 00 session.

### Required Tools Or Knowledge

- Node.js 24.15 or newer, npm 12, Git, and the local Apex analysis scripts.
- Current TypeScript source, tests, Docker configuration, client brief, and governance files.

### Environment Requirements

- Dependencies installed from the committed lockfile.
- Synthetic fixtures only; no provider credential is needed for deterministic verification.

---

## 4. Scope

### In Scope (MVP)

- Workshop participant can inspect and explain the complete bounded runtime and permission model - record source-backed diagrams and tables in `docs/build-log.md`.
- Workshop participant can prove the provider-independent baseline and one refusal path - record exact commands and results in `docs/build-log.md`.
- Maintainer can see the active work and release note - update `docs/TODO.md` and `docs/CHANGELOG.md`.

### Out Of Scope (Deferred)

- Runtime, schema, prompt, tool, endpoint, event, or deployment behavior changes - Reason: Session 01 is evidence-only.
- Qualification contract or Pi tool integration - Reason: Sessions 02 and 03 own those changes.
- Durable approvals, external writes, recovery, public deployment, databases, queues, or additional agents - Reason: later phases own those capabilities.

---

## 5. Technical Approach

### Architecture

Inspect the TypeScript entry point, Pi orchestration, custom tools, event store, tests, evals, and Docker boundary directly. Use Mermaid for architecture and request-flow diagrams, and keep evidence in a single appendable `docs/build-log.md` source so later tasks can add their own entries without duplicating repository guidance.

### Design Patterns

- Evidence ledger: pair every claim with a source path, command, or inspected artifact.
- Permission classification: label actions `automatic`, `approval-required`, or `forbidden` before any later tool exposure.
- Bounded harness decision: keep model judgment inside deterministic application constraints and a visible human stop.

---

## 6. Deliverables

### Files To Create

| File | Purpose | Est. Lines |
|------|---------|------------|
| `docs/build-log.md` | Task `00` architecture, harness, permission, risk, verification, and stop-boundary evidence | ~220 |

### Files To Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `docs/TODO.md` | Reflect Session 01 completion state | ~3 |
| `docs/CHANGELOG.md` | Record the bounded-system evidence pack | ~2 |

---

## 7. Success Criteria

### Functional Requirements

- [ ] Eight labeled boundaries name their source owners, persistence points, external dependencies, and data egress.
- [ ] The request trace covers known-lead success, unknown-lead refusal, and thrown-error mapping.
- [ ] The harness record distinguishes Codex, Pi, application, and Coolify ownership and explains the model-loop need and stop conditions.
- [ ] Automatic, approval-required, and forbidden actions are explicit, with source proof that no shell, filesystem, approval-decision, or send capability is exposed.
- [ ] The smallest useful version, validated output, five-sentence stop explanation, and at least three risk owners are recorded.

### Testing Requirements

- [ ] `npm run verify` passes with one type-check, four deterministic tests, and five evals.
- [ ] Unknown-lead refusal is exercised independently and recorded.

### Non-Functional Requirements

- [ ] No production behavior, permissions, persistence, or dependency surface changes.
- [ ] Evidence contains only synthetic identifiers and no credential values or unnecessary personal data.

### Quality Gates

- [ ] All files ASCII-encoded.
- [ ] Unix LF line endings.
- [ ] Code and documentation follow project conventions.
- [ ] Mermaid is used for project diagrams and system maps.

---

## 8. Implementation Notes

### Working Assumptions

- The durable Build Log belongs at `docs/build-log.md`: repository guidance requires one Build Log but defines no existing path, and `docs/` is the required location for operator and workshop evidence, so one appendable file is the smallest coherent source of truth.

### Key Considerations

- Treat current source and deterministic commands as authoritative; planned PRD behavior is not an implemented control.
- Preserve the bounded single-agent design, application-owned approval gate, stable `runId`, and visible terminal stop reason.

### Potential Challenges

- Provider-dependent runtime paths cannot be exercised without credentials: mitigate by proving the provider-independent baseline and tracing the thrown-error path directly from source.
- Full draft content currently appears in synthetic event evidence: identify it as a later data-lifecycle gap rather than claiming minimization is complete.

### Relevant Considerations

- [P00] **Bounded architecture**: Keep HTTP validation, agent orchestration, domain tools, and persistence responsibilities distinct in the map.
- [P00] **Typed handoffs**: Record structured state and evidence as the durable boundary, not raw conversation history.

---

## 9. Testing Strategy

### Unit Tests

- Run the repository's four deterministic Node.js tests through `npm test` as part of `npm run verify`.

### Integration Tests

- Run all five provider-independent eval cases through `npm run eval` as part of `npm run verify`.

### Runtime Verification

- Exercise exact unknown-lead lookup through the deterministic domain function and confirm no record is fabricated.

### Edge Cases

- Trace malformed HTTP input, unknown lead data, provider/session failure, and pending approval without treating any as completed send behavior.

---

## 10. Dependencies

### Other Sessions

- Depends on: none.
- Depended by: `phase00-session02-qualification-contract-and-domain` and `phase00-session03-qualification-tool-integration`.

---

## Next Steps

Run the `implement` workflow step to begin implementation.
