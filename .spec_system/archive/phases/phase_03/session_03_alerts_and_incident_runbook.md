# Session 03: Alerts and Incident Runbook

**Session ID**: `phase03-session03-alerts-and-incident-runbook`
**Status**: Complete
**Source Task**: `06`
**Estimated Tasks**: ~17
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-12

---

## Objective

Define deterministic actionable alert policy and write the canonical agent incident runbook from implemented pause, inspect, recovery, escalation, and stop capabilities.

---

## Scope

### In Scope (MVP)

- Define closed alert-rule, observation-window, alert-result, severity, suppression, and operator-action contracts.
- Add bounded fail-fast configuration for repeated task failures, stuck runs, dangerous permission attempts, cost spikes, unavailable dependencies, and storage pressure.
- Represent queue pressure as not applicable until a queue exists rather than inventing a metric or alert.
- Distinguish harmless retries below threshold from repeated, delayed, or unsafe behavior that requires action.
- Ensure every alert names its evidence, trigger, severity, suppression behavior, and one safe operator action.
- Evaluate rules deterministically against minimized observations without sending notifications or accepting raw provider content.
- Fail visibly for invalid thresholds, unavailable required measurements, corrupt observations, or unsupported rule variants.
- Write `docs/runbooks/agent-incident-response.md` for pause, inspect, retry, resume, compensate, escalate, and stop behavior that exists in the repository.
- State exact no-retry rules for reservation-only or otherwise indeterminate effects and exact escalation rules for corrupt authority.
- Reconcile links and scope with the existing general incident-response guidance without claiming production on-call or unsupported automation.
- Add deterministic threshold, suppression, unavailable-value, dangerous-permission, storage, and malformed-policy tests.
- Add the alert table and runbook link to the Week 4 Build Log without presenting drills as complete.

### Out of Scope

- Live paging credentials, third-party alert delivery, an application pause endpoint, or a production on-call SLA.
- Executing the five incident drills or modifying durable state through the runbook.
- Coolify deployment, backup activation, rollback, or public endpoint exposure.

---

## Prerequisites

- [x] Session 02 provides the safe exact-`runId` query used by the runbook's inspect path.
- [x] Current recovery actions and limitations are revalidated against source and tests before documentation is changed.

---

## Deliverables

1. Closed deterministic alert-policy contracts and bounded evaluator with explicit suppression and unavailable-value behavior.
2. Canonical `docs/runbooks/agent-incident-response.md` grounded in implemented commands and authority boundaries.
3. Alert-policy and runbook tests plus the Week 4 alert table and navigation updates.

---

## Success Criteria

- [x] Every configured alert has a finite trigger, severity, evidence source, suppression rule, and actionable operator response.
- [x] Harmless retries below threshold do not alert, while dangerous permission attempts and stuck or repeated failures remain visible.
- [x] Missing metrics are explicit and cannot silently pass a rule that requires them.
- [x] The runbook never recommends manual durable-record edits, automatic retry of indeterminate effects, or capabilities that do not exist.
- [x] Alert evaluation and runbook changes add no notification credential, Pi permission, public endpoint, or external effect.
