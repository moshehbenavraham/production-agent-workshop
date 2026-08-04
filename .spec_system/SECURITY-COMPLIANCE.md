# Security & Compliance

> Cumulative security posture and GDPR compliance record. Updated between phases via carryforward.
> **Line budget**: 1000 max | **Last updated**: Phase 00 (2026-08-04)

This internal record describes implemented repository controls and release
gates. Public vulnerability reporting belongs in the
[Security Policy](../SECURITY.md); ordered future acceptance work belongs in
the [workshop task index](../docs/todo/README_todo.md).

---

## Current Security Posture

### Overall: AT RISK

The Phase 00 implementation is clean for synthetic data in a local or otherwise
controlled environment. It is not public-production-ready because durable
approval, data lifecycle, whole-run bounds, recovery, and exposure controls
remain open release gates.

| Metric | Value |
|--------|-------|
| Open Findings | 5 |
| Critical/High | 2 |
| Medium/Low | 3 |
| Phases Audited | 1 |
| Last Clean Phase | P00 |

---

## Open Findings

These are known release blockers, not evidence of an exploited vulnerability.
They remain open until the linked acceptance work passes.

### Critical / High

- **[P00][SC-001] Public run operations lack access controls**
  - Severity: High
  - File: `src/server.ts`
  - Description: `/runs` has no caller authentication, authorization, tenant
    isolation, or rate limiting.
  - Remediation: Keep the endpoint controlled; add and validate exposure-
    appropriate controls through Task `07` before public access.
  - Status: Open
  - Opened: P00 (2026-08-04)

- **[P00][SC-003] Approval decisions are not durable**
  - Severity: High
  - File: `src/tools.ts`, `src/event-store.ts`
  - Description: A pending request is recorded, but terminal decisions,
    transition rules, exact draft linkage, and restart projection do not exist.
  - Remediation: Complete Task `02` before introducing any write-capable boundary.
  - Status: Open
  - Opened: P00 (2026-08-04)

### Medium / Low

- **[P00][SC-002] Persisted evidence has no approved lifecycle**
  - Severity: Medium
  - File: `src/tools.ts`, `src/event-store.ts`
  - Description: Synthetic draft and approval events persist without approved
    retention, redaction, export, erasure, backup, or restore rules.
  - Remediation: Keep all data synthetic and close the lifecycle through Tasks
    `02`, `04`, and `07` before real data.
  - Status: Open
  - Opened: P00 (2026-08-04)

- **[P00][SC-004] Whole runs lack deterministic bounds**
  - Severity: Medium
  - File: `src/pi-agent.ts`
  - Description: Qualification has a 1,000 ms deadline, but the complete Pi run
    has no explicit deadline or maximum step count.
  - Remediation: Add tested terminal bounds through Tasks `04` and `06` before release.
  - Status: Open
  - Opened: P00 (2026-08-04)

- **[P00][SC-005] Recovery and release operations are unproved**
  - Severity: Medium
  - File: `Dockerfile`, `docs/todo/06-observability-and-incidents.md`,
    `docs/todo/07-coolify-release.md`
  - Description: Production health, restore, rollback, incident response, and
    operator-access evidence do not exist yet.
  - Remediation: Complete Tasks `06` and `07`; re-run the locally passing health
    probe against the production Coolify URL.
  - Status: Open
  - Opened: P00 (2026-08-04)

---

## Implemented Controls

- [P00] `POST /runs` validates `leadId` and rejects bodies above 16,384 bytes
  before starting an agent run.
- [P00] The frozen production allowlist contains exactly `qualify_lead`,
  `draft_follow_up`, and `request_send_approval`; Pi has no shell or filesystem tool.
- [P00] Qualification uses a closed schema, exact run-lead binding,
  application-owned outcomes, a 1,000 ms deadline, and canonical redacted failures.
- [P00] Draft and pending approval require the latest matching schema-valid
  qualification success; prompt order and prose cannot bypass the gate.
- [P00] No send adapter, write endpoint, approval-decision endpoint, or other
  network-writing application tool exists.
- [P00] Known-lead runs stop at `approval_pending`; failures and visible stop
  reasons derive from validated ordered event evidence.
- [P00] Append-only JSONL events carry stable `eventId` and `runId` values;
  qualification events contain only schema-owned synthetic fields.
- [P00] Docker declares `/app/data`, port 3000, and a bounded health probe that
  passed a real local container check.
- [P00] Biome formatting, strict TypeScript, 40 deterministic tests, five
  evals, npm audit, Code Quality CI, and CodeQL all pass.

---

## GDPR Compliance Status

### Overall: N/A

No real personal data is collected or processed in the validated Phase 00
scope. Committed lead records are explicit synthetic fixtures. GDPR compliance
for real lead, actor, recipient, draft, approval, or event data is not claimed.

### Personal Data Inventory

No real personal data collected or processed.

### Controlled Data Boundary

| Data Element | Source | Storage | Purpose | Current Constraint | Since |
|--------------|--------|---------|---------|--------------------|-------|
| Synthetic lead fixtures | `src/leads.ts` | Git repository | Deterministic exercises | Must not be replaced with real leads | P00 |
| Synthetic run/tool evidence | Application events | JSONL at `EVENT_LOG_PATH` | Correlation and audit evidence | Minimized; lifecycle remains open | P00 |
| Synthetic draft and pending approval | Deterministic tools | JSONL events | Demonstrate human stop | Full draft acceptable only for synthetic scope | P00 |
| Provider working context | Pi/provider session | In memory for one run | Model drafting | Handling depends on operator configuration | P00 |
| Provider credentials | External environment or Pi auth state | Outside repository | Provider authentication | Never store in source, events, images, or docs | P00 |

### Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data collection has documented purpose | N/A | No real personal data processing established |
| Consent obtained before data storage | N/A | Real data is prohibited |
| Data minimization verified | PASS | Qualification evidence is schema-owned and synthetic |
| Deletion/erasure path exists | N/A | Required before real data; tracked by SC-002 |
| No PII in application logs | PASS | Tests and evidence use synthetic values only |
| Third-party transfers documented | N/A | Provider behavior must be assessed before real data |

Before real data, document purpose and lawful basis, access, minimization,
retention, redaction, export, erasure, backup behavior, subprocessors, data
locations, and incident ownership.

---

## Dependency Security

### Current Vulnerabilities

No known vulnerable dependencies. The current npm 12 audit reports 0
vulnerabilities after adding Biome 2.5.6. Production dependencies remain pinned;
the lockfile retains the reviewed overrides and install-script approvals in
`package.json`.

---

## Resolved Findings

| ID | Finding | Severity | Resolved | Phase | Resolution |
|----|---------|----------|----------|-------|------------|
| P00-R01 | Qualification depended on model judgment and prompt order | Medium | 2026-08-04 | P00 | Closed schemas, deterministic computation, exact-lead validation, and event-derived gates now fail closed. |
| P00-R02 | Raw inspection and mutable compile-time-only permission evidence | Medium | 2026-08-04 | P00 | Focused qualification replaced inspection; the exact three-tool allowlist is frozen and tested at runtime. |

---

## Phase History

| Phase | Sessions | Security | GDPR | Findings Opened | Findings Closed |
|-------|----------|----------|------|-----------------|-----------------|
| P00 | 3 | PASS for controlled synthetic scope | N/A | 0 | 2 baseline control gaps |

---

## Change Constraints

- Never read, print, log, or commit `.env`, provider keys, Pi auth files,
  browser state, production logs, or unrelated user files.
- Keep credentials out of source, fixtures, tests, events, images, and docs;
  treat all HTTP, model, tool, provider, and persisted input as untrusted.
- Use only synthetic data until SC-002 and exposure controls are closed.
- Do not expose shell, filesystem, credential, deployment, or general business-
  system access to the production Pi session.
- Require application-owned authorization for the exact action and target,
  validation before every external effect, and a stable idempotency result.
- Record attempts, outcomes, `runId`, and terminal stop reasons without
  unnecessary content; add deterministic evidence for every changed failure path.
- Run `npm run verify`, `npm audit`, permission/data scans, and final diff
  review before completion.

---

## Recommendations

1. [P00] Close durable approval state and exact transition rules before adding
   any write-capable adapter.
2. [P00] Preserve the frozen three-tool no-send boundary until exact approval,
   target authorization, and idempotency have deterministic evidence.
3. [P00] Keep all inputs synthetic until data lifecycle and exposure controls pass.
4. [P00] Add whole-run bounds and replay/recovery without weakening current
   exact-identity or event-order validation.
5. [P00] Re-verify Docker health, persistence, restore, and rollback against the
   production Coolify target when deployment work is explicitly authorized.

---

*Auto-generated by carryforward. Direct edits allowed but may be overwritten.*
