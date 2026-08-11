# Session 08: Operator Handoff, Parity, and Release Evidence

**Session ID**: `phase03-session08-operator-handoff-parity-and-release-evidence`
**Status**: Not Started
**Source Task**: `07`
**Estimated Tasks**: ~19
**Estimated Duration**: 2-4 hours

---

## Objective

Prove local and deployed parity, validate the one-page operator handoff, complete the five-minute demo, and close Task `07` and Phase 03 with reviewable release evidence.

---

## Scope

### In Scope (MVP)

- Define one exact synthetic smoke fixture and compare local and deployed qualification, draft, pending approval, event order, stop reason, and redacted report semantics.
- Record expected environment-specific differences separately from behavior mismatches and fail visibly on any safety or authority drift.
- Confirm the verified revision, immutable image, external health, controlled access, monitoring, persistence, restart, off-server restore, and rollback evidence remain current.
- Write a one-page operator guide for scope, deliberate non-capabilities, deploy, pause, restart, rollback, secret rotation, health, run query, recovery selection, and human takeover.
- Ensure every guide command is bounded, current, redacted, and matched to an implemented repository or authorized platform action.
- Have another authorized operator follow the guide and record redacted usability evidence, corrections, and unresolved ownership gaps.
- Prepare the five-minute demonstration covering problem and user, bounded Mermaid architecture, happy path, one failure and recovery, eval gate, measured or unavailable cost or latency, and next improvement.
- Confirm screenshots, command output, diagrams, and timelines contain no credential, private URL, address, customer data, full draft, or unnecessary provider content.
- Re-run local verification, dependency audit, critical evals, and the production-agent repository verification workflow against the final tree.
- Review the final diff for access expansion, allowlist changes, secret handling, personal data, retention, side effects, rollback claims, stale docs, and unsupported production assertions.
- Complete all Task `07` Week 4 evidence, remaining-risk entries, and documentation synchronization only after direct checks pass.
- Update `docs/TODO.md`, `docs/CHANGELOG.md`, master and phase PRDs, considerations, security posture, and known issues to distinguish proved controls from open gates.
- Preserve measured success, failure, latency, cost, explainability, and operational-complexity baseline evidence for later work without adding orchestration.

### Out of Scope

- Real send, real customer data, public approval decisions, new Pi tools, a database, queue, multi-replica deployment, or unverified public `/runs` access.
- Starting any later-phase typed handoff, router, specialist, or keep-or-remove experiment.
- Closing a security or infrastructure finding without direct acceptance evidence.

---

## Prerequisites

- [ ] Session 07 proves off-server restore activation and rollback while preserving the verified image and durable state.
- [ ] All Task `06` and Task `07` acceptance evidence is available in redacted form for independent operator use.

---

## Deliverables

1. Exact local/deployed parity comparison and final redacted release evidence portfolio.
2. Tested one-page operator guide and five-minute demonstration with independent operator feedback.
3. Completed Task `07`, Phase 03 verification, documentation, security, and remaining-risk closeout.

---

## Success Criteria

- [ ] The same synthetic smoke case has equivalent safety, authority, stop, and reporting behavior locally and on the selected target.
- [ ] Another operator can use the guide to deploy or inspect, pause, restart, query, recover or escalate, roll back, and identify mandatory human takeover.
- [ ] The demonstration shows one real bounded failure and recovery plus the green critical gate without leaking protected information or claiming a send.
- [ ] Every completed production claim has direct redacted evidence and every unproved gate remains explicitly open.
- [ ] Final repository, dependency, critical-eval, production-agent, documentation, privacy, permission, and side-effect reviews pass before Phase 03 is marked complete.
