# Security & Compliance

> Cumulative security posture and GDPR compliance record. Updated between phases via carryforward.
> **Line budget**: 1000 max | **Last updated**: Phase 02 (2026-08-11)

This internal record describes implemented repository controls and release
gates. Public vulnerability reporting belongs in the
[Security Policy](../SECURITY.md); ordered acceptance work belongs in the
[workshop task index](../docs/todo/README_todo.md).

---

## Current Security Posture

### Overall: AT RISK

Phase 02 Session 06 is clean for synthetic data in a local or otherwise
controlled environment. It is not public-production-ready because caller
access, public/distributed recovery, real-data lifecycle, distributed effect
safety, backup, restore, and deployment controls remain open release gates.

| Metric | Value |
|--------|-------|
| Open Findings | 4 |
| Critical/High | 1 |
| Medium/Low | 3 |
| Phases Audited | 3 |
| Last Clean Phase | P01 |

---

## Open Findings

These are known release blockers, not evidence of an exploited vulnerability.
They remain open until the stated controls have direct acceptance evidence.

### Critical / High

- **[P00][SC-001] Public run operations lack caller access controls**
  - Severity: High
  - File: `src/server.ts`, `src/rate-limit.ts`
  - Description: `/runs` has a process-wide capacity gate but no caller
    authentication, authorization, tenant isolation, trusted proxy identity,
    distributed quota, or deployed edge WAF.
  - Remediation: Keep the endpoint controlled; add and validate exposure-
    appropriate identity, tenant, shared-rate, and edge controls before public access.
  - Status: Open
  - Opened: P00 (2026-08-04)

### Medium / Low

- **[P00][SC-002] Persisted evidence is not ready for real-data lifecycle duties**
  - Severity: Medium
  - File: `src/approval-store.ts`, `src/fake-send-store.ts`, `docs/environments.md`
  - Description: Synthetic files have a documented manual 30-day-or-teardown
    whole-file rule, but no automated retention, scoped export/erasure,
    backup/restore, lawful basis, subprocessor, or data-location control.
  - Remediation: Keep data synthetic until the complete lifecycle and access
    controls are implemented, approved, and exercised.
  - Status: Open
  - Opened: P00 (2026-08-04)

- **[P00][SC-005] Recovery and release operations are unproved**
  - Severity: Medium
  - File: `Dockerfile`, `.spec_system/audit/known-issues.md`, `docs/deployment.md`
  - Description: Local health and rate checks pass, but production health,
    persistent restart, backup restore, rollback, incident ownership, and
    operator-access evidence do not exist.
  - Remediation: Validate these controls against the authorized Coolify target;
    remove the explicit Skipped Infra entries only after real checks pass.
  - Status: Open
  - Opened: P00 (2026-08-04)

- **[P01][SC-006] Fake-effect safety is single-process and internal-only**
  - Severity: Medium
  - File: `src/fake-send-service.ts`, `src/fake-send-store.ts`
  - Description: Synchronous reservation prevents duplicates in one process,
    but separate logs are not transactional, no cross-process lock exists, and
    reservation-only state requires manual inspection.
  - Remediation: Keep fake execution unreachable from Pi/HTTP. Before any write
    exposure, add transactional or locked ownership, explicit indeterminate
    recovery, and recorded repository-maintainer contract/diff approval.
  - Status: Open
  - Opened: P01 (2026-08-04)

---

## Implemented Controls

- [P00] `POST /runs` validates `leadId` and rejects bodies above 16,384 bytes
  before starting Pi.
- [P01] A fail-fast process-wide fixed-window gate rejects excess `/runs`
  requests before body parsing or Pi work and exposes bounded retry headers.
- [P00] The frozen Pi allowlist contains exactly `qualify_lead`,
  `draft_follow_up`, and `request_send_approval`; Pi has no shell or filesystem tool.
- [P00] Qualification uses closed schemas, exact run-lead binding,
  application-owned outcomes, a 1,000 ms deadline, and canonical redacted failures.
- [P01] Approval uses closed pending/approved/declined records, exact action,
  target and draft linkage, one terminal transition, authorized internal actors,
  and projection-derived runtime state.
- [P01] Approval/result stores create files with mode `0600`, validate complete
  LF-terminated ordered JSONL, call `fsync`, close, and re-read before success.
- [P01] Corrupt, truncated, duplicated, cross-run, out-of-order, or invalid
  replaceable-boundary evidence fails visibly and cannot manufacture permission.
- [P01] Fake authorization accepts identity claims only, resolves executable
  values from exact durable approved state, and denies unauthorized actors before lookup.
- [P01] Fake execution reserves before one deterministic in-process effect,
  returns the durable original to completed duplicates, bounds timeouts, and
  never automatically retries an indeterminate reservation.
- [P01] Fake events are minimized; they omit full drafts, target lead identity,
  raw dependency detail, credentials, and provider output.
- [P01] Fake execution remains unregistered, unallowlisted, absent from Pi/HTTP,
  and network-free. Human review was not performed or claimed and is mandatory
  before any future capability change.
- [P02] Whole-run bounds validate before runtime construction, count only model
  turns and tool starts, abort once, persist one terminal, close open tool
  attempts, and ignore late provider settlement.
- [P02] Internal recovery validates complete event, approval, and fake-result
  evidence before mutation; hash-verifies replaceable drafts; requests at most
  one pending approval; and escalates any reservation-only state without an
  effect adapter.
- [P02] Production-eval definitions validate and freeze 18 synthetic cases with
  deterministic critical dimensions, exact tool/event/authority expectations,
  explicit metric availability, and model grading restricted to non-blocking
  draft quality.
- [P02] The eval runner revalidates exact suite/case identity, executes every
  case through isolated deterministic production-domain boundaries, derives
  critical status from closed observations, and continues after failures.
- [P02] Eval artifacts use private append-only JSONL, complete-file validation,
  flush and exact re-read proof, canonical failures, bounded scorecard evidence,
  and non-zero exit for any critical, executor, evidence, or persistence failure.
- [P02] Persisted eval evidence excludes draft bodies, lead profiles,
  transcripts, provider payloads, credentials, stack traces, full approval
  records, and raw dependency messages.
- [P00] Known-lead runs stop at `approval_pending`; visible outcomes derive from
  validated qualification events and durable approval projection, never prose.
- [P02] Biome formatting/linting, strict TypeScript, 269 deterministic tests,
  18 eval cases, coverage gates, npm audit, Code Quality, Build & Test, and CodeQL pass.
- [P01] Docker health and process/container rate-gate validation pass locally;
  missing production checks remain explicit in `known-issues.md`.

---

## GDPR Compliance Status

### Overall: N/A

No real personal data is collected or processed in the validated Phase 02
scope. Leads, drafts, actor IDs, approvals, results, receipts, and evidence are
explicit synthetic fixtures or generated synthetic values. GDPR compliance for
real data is not claimed.

### Personal Data Inventory

No real personal data collected or processed.

### Controlled Data Boundary

| Data Element | Source | Storage | Purpose | Current Constraint | Since |
|--------------|--------|---------|---------|--------------------|-------|
| Synthetic lead fixtures | `src/leads.ts` | Git repository | Deterministic exercises | Never replace with real leads | P00 |
| Synthetic run/tool evidence | Application | JSONL at `EVENT_LOG_PATH` | Correlation, audit, and recovery checkpoint | Minimized; manual coordinated lifecycle only | P00 |
| Synthetic approval record | Approval service | JSONL at `APPROVAL_LOG_PATH` | Exact authorization truth | Contains full draft; private file; 30-day-or-teardown rule | P01 |
| Synthetic fake result | Internal fake service | Injected JSONL path | Idempotency truth | Internal tests/library only; no runtime route | P01 |
| Synthetic eval artifact | Eval runner | JSONL at `PRODUCTION_EVAL_LOG_PATH` | Critical gate and comparison evidence | Minimized, private, append-only; manual coordinated lifecycle only | P02 |
| Synthetic actor IDs | Internal policy | Approval records and minimized events | Decision/execution authorization tests | Not real authentication | P01 |
| Provider working context | Pi/provider session | Memory for one run | Model drafting | Depends on operator configuration | P00 |
| Provider credentials | External environment or Pi auth state | Outside repository | Provider authentication | Never store in source, events, images, or docs | P00 |

### Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data collection has documented purpose | N/A | No real personal data processing established |
| Consent obtained before data storage | N/A | Real data is prohibited |
| Data minimization verified | PASS | Operational events exclude full draft and target identity where not required |
| Deletion/erasure path exists | N/A | Manual whole-file synthetic reset only; SC-002 blocks real data |
| No PII in application logs | PASS | Tests and evidence use synthetic values only |
| Third-party transfers documented | N/A | Provider behavior must be assessed before real data |

Before real data, document purpose and lawful basis, access, minimization,
retention, redaction, export, erasure, backup behavior, subprocessors, data
locations, trusted operators, and incident ownership.

---

## Dependency Security

### Current Vulnerabilities

No known vulnerable dependencies. The current npm 12 audit reports 0
vulnerabilities. Production dependencies remain pinned; the lockfile retains
reviewed overrides and install-script approvals from `package.json`.

---

## Resolved Findings

| ID | Finding | Severity | Resolved | Phase | Resolution |
|----|---------|----------|----------|-------|------------|
| SC-004 | Whole runs lacked deterministic bounds | Medium | 2026-08-11 | P02 | Closed positive configuration, exact model/tool step accounting, application-owned deadline, abort-once cancellation, terminal-once durable evidence, and late-settlement suppression now bound the complete run. |
| SC-003 | Approval decisions were not durable | High | 2026-08-04 | P01 | Closed records, exact immutable linkage, private append-only storage, one-way decisions, runtime integration, and restart projection now own approval truth. |
| P00-R01 | Qualification depended on model judgment and prompt order | Medium | 2026-08-04 | P00 | Closed schemas, deterministic computation, exact-lead validation, and event-derived gates now fail closed. |
| P00-R02 | Raw inspection and mutable compile-time-only permission evidence | Medium | 2026-08-04 | P00 | Focused qualification replaced inspection; the exact three-tool allowlist is frozen and tested at runtime. |

---

## Phase History

| Phase | Sessions | Security | GDPR | Findings Opened | Findings Closed |
|-------|----------|----------|------|-----------------|-----------------|
| P02 | 6 of 7 | PASS for controlled synthetic scope through Session 06 | N/A | 0 | 1 |
| P01 | 6 | PASS for controlled synthetic scope | N/A | 1 | 1 |
| P00 | 3 | PASS for controlled synthetic scope | N/A | 0 | 2 baseline control gaps |

---

## Change Constraints

- Never read, print, log, or commit `.env`, provider keys, Pi auth files,
  browser state, production logs, or unrelated user files.
- Keep credentials out of source, fixtures, tests, events, images, and docs;
  treat HTTP, model, tool, provider, adapter, and persisted input as untrusted.
- Use only synthetic data until SC-002 and exposure controls are closed.
- Keep `/runs` controlled; process-wide rate limiting is capacity protection,
  not authentication, tenant isolation, or distributed abuse prevention.
- Do not expose shell, filesystem, credential, deployment, approval-decision,
  or write capability to the production Pi session.
- Do not register or allowlist fake/write execution until a repository
  maintainer records review of the exact contract, diff, identity, idempotency,
  provider, incident, and rollback controls.
- Require application-owned authorization for exact action and target,
  validation before effects, and a durable stable idempotency result.
- Never auto-retry reservation-only state; preserve it and require explicit
  recovery policy before any future effect exposure.
- Record attempts, outcomes, `runId`, and terminal stop reasons without
  unnecessary content; add deterministic evidence for every changed failure path.
- Run `npm run verify`, `npm run test:coverage`, `npm audit`, permission/data
  scans, and final diff review before completion.

---

## Recommendations

1. [P02] Capture and exactly revert the three controlled Session 07 boundary
   breaks while proving the durable gate turns red and green without weakening
   exact identity, authority, event ordering, or indeterminate-effect handling.
2. [P01] Keep internal fake execution disconnected until both stronger cross-
   process ownership and the recorded human permission gate exist.
3. [P01] Keep all inputs synthetic until automated lifecycle, access, backup,
   restore, and real-data governance controls pass.
4. [P01] Validate health, edge security, persistence, restore, rollback, and
   operator access against the real target only when deployment is authorized.
5. [P01] Preserve the single-agent baseline and exact three-tool allowlist until
   measured evidence justifies a reviewed change.

---

*Auto-generated by carryforward. Direct edits allowed but may be overwritten.*
