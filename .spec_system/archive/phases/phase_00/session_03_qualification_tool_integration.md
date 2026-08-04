# Session 03: Qualification Tool Integration

**Session ID**: `phase00-session03-qualification-tool-integration`
**Status**: Not Started
**Estimated Tasks**: ~18-24
**Estimated Duration**: 2-4 hours

---

## Objective

Integrate the validated qualification domain through one focused read-only Pi tool and append-only event evidence while preserving the pending-approval stop and restricted permissions.

---

## Scope

### In Scope (MVP)

- Expose the Session 02 contract through one focused custom tool with validated parameters and structured results.
- Keep the production allowlist limited to bounded custom tools and prove shell, filesystem, approval-decision, and send capabilities remain absent.
- Associate qualification attempts, outcomes, and failures with the originating stable `runId`.
- Minimize event data so credentials, unnecessary lead details, and undocumented full content are not persisted.
- Integrate qualification into the existing bounded lead run without changing the final pending-approval stop.
- Preserve clear not-found and failed-run behavior instead of translating tool failure into friendly success prose.
- Add deterministic tool, integration, event, allowlist, and failure-path tests, including a simulated tool failure.
- Complete the event sequence, final test matrix, verification output, vertical-slice demo, security review, documentation, and Build Log evidence.

### Out of Scope

- Durable approval decisions, fake or real sending, network-writing tools, recovery, or replay.
- Public exposure of `/runs`, authentication, tenant isolation, rate limiting, or data-lifecycle policy completion.
- Provider secrets, real customer data, another agent, Redis, a queue, or a database.

---

## Prerequisites

- [ ] Session 02 is completed and its qualification contracts and deterministic domain tests pass.
- [ ] The Session 01 permission map and stop-boundary evidence remain current.

---

## Deliverables

1. Focused read-only qualification tool integrated into the bounded run with exact allowlist evidence.
2. Minimized qualification attempt, outcome, and failure events correlated by `runId`.
3. Deterministic integration and failure tests plus the completed Task `01` Build Log and vertical-slice evidence.

---

## Success Criteria

- [ ] Known leads receive a schema-valid deterministic qualification before draft and approval work.
- [ ] Unknown, malformed, missing, and simulated-failure paths return actionable structured failure evidence with one `runId` and a visible stop reason.
- [ ] The model cannot invent validated fields, bypass input validation, or claim a failed qualification succeeded.
- [ ] The run still ends at pending human approval and no external effect occurs.
- [ ] No Pi shell, filesystem, approval-decision, or send capability is exposed, and event evidence contains no secret or unnecessary personal data.
- [ ] `npm run verify` and the production-agent verification workflow pass, with exact results and final diff review recorded.
