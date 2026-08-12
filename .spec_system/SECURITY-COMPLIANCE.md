# Security & Compliance

> Cumulative security posture and GDPR compliance record. Updated between phases via carryforward.
> **Line budget**: 1000 max | **Last updated**: Phase 03 (2026-08-12)

This internal record describes implemented repository controls and release
gates. Public vulnerability reporting belongs in the
[Security Policy](../SECURITY.md); ordered acceptance work belongs in the
[workshop task index](../docs/todo/README_todo.md).

---

## Current Security Posture

### Overall: PASS FOR CONTROLLED SYNTHETIC WORKSHOP; AT RISK FOR PUBLIC OR REAL DATA

Phase 03 directly proved the private workshop deployment, provider-backed
pending-approval path, durable replacement, off-server restore, recovery,
parity, and operator handoff. It remains intentionally unsuitable for public
or real-data use because caller identity, tenancy, distributed ownership, and
complete real-data lifecycle controls do not exist.

| Metric | Value |
|--------|-------|
| Open Findings | 3 |
| Critical/High | 1 |
| Medium/Low | 2 |
| Phases Audited | 4 |
| Last Clean Phase | P03 |
| Controlled target | PASS |
| Public production | BLOCKED |

---

## Open Findings

These are release blockers for broader use, not evidence of exploitation.

### Critical / High

- **[P00][SC-001] Public run operations lack caller access controls**
  - Severity: High
  - File: `src/server.ts`, `src/rate-limit.ts`, `docs/deployment.md`
  - Description: The workshop edge uses HTTP Basic Auth and `/runs` stays
    controlled, but the application has no caller authentication,
    authorization, tenant isolation, trusted proxy identity, distributed
    principal quota, or production WAF. The process-wide gate is capacity only.
  - Remediation: Keep `/runs` controlled. Before public access, implement and
    directly validate identity, authorization, tenant, trusted-proxy,
    shared-rate, WAF, audit, and revocation controls.
  - Status: Open
  - Opened: P00 (2026-08-04)

### Medium / Low

- **[P00][SC-002] Persisted evidence is not ready for real-data lifecycle duties**
  - Severity: Medium
  - File: `src/approval-store.ts`, `src/fake-send-store.ts`,
    `src/production-eval-store.ts`, `scripts/data-snapshot.ts`
  - Description: Synthetic files now have a private off-server workstation
    backup, exact restore, and manual 30-day-or-teardown rule. There is still no
    approved lawful basis, scoped access/export/erasure, encryption attestation,
    automated retention, data-location/transfer control, subprocessor record,
    or production backup governance.
  - Remediation: Keep data synthetic until the complete lifecycle and access
    controls are implemented, approved, and exercised.
  - Status: Open
  - Opened: P00 (2026-08-04)

- **[P01][SC-006] Fake-effect safety is single-process and internal-only**
  - Severity: Medium
  - File: `src/fake-send-service.ts`, `src/fake-send-store.ts`
  - Description: Synchronous reservation prevents duplicates in one process,
    but separate files are not transactional, no cross-process lock exists,
    and reservation-only state needs manual inspection.
  - Remediation: Keep fake execution unreachable from Pi/HTTP. Before any write
    exposure, add transactional or locked ownership, explicit indeterminate
    recovery, and recorded maintainer review of the exact permission diff.
  - Status: Open
  - Opened: P01 (2026-08-04)

---

## Implemented Controls

### Runtime, Permission, And Durable State

- [P00] `POST /runs` validates `leadId`, rejects bodies above 16,384 bytes, and
  applies a fail-fast process-wide fixed-window capacity gate before Pi work.
- [P03] The controlled target denies anonymous access through HTTP Basic Auth.
  This is a workshop edge gate and is never described as public identity.
- [P00] The frozen production Pi allowlist contains exactly `qualify_lead`,
  `draft_follow_up`, and `request_send_approval`; Pi has no shell, filesystem,
  credential, deploy, decision, or send tool.
- [P00] Qualification uses closed schemas, exact run-lead binding,
  application-owned outcomes, a one-second tool deadline, and canonical errors.
- [P01] Approval uses closed pending/approved/declined records, exact action,
  target and draft linkage, one terminal transition, internal actors, and
  projection-derived state.
- [P01] Approval/result stores use `0600`, complete LF-terminated JSONL,
  `fsync`, close, and exact re-read before success.
- [P01] Fake authorization accepts identity claims only and resolves exact
  executable values from durable approved state before a deterministic,
  network-free in-process adapter.
- [P01] Fake execution reserves before effect, returns the durable original to
  duplicates, bounds timeouts, and never retries reservation-only state.
- [P01] Fake execution remains internal, unregistered, unallowlisted, absent
  from Pi/HTTP, and excluded from the deployed service path.

### Recovery, Evidence, And Evaluation

- [P02] Whole-run bounds validate before runtime construction, count model/tool
  starts, abort once, persist one terminal, close open attempts, and ignore late
  settlement.
- [P02] Closed schema-v2 events and deterministic projections reject damaged or
  illegally ordered evidence and keep approval/result records as authority.
- [P02] Internal recovery validates all event, approval, and fake-result truth,
  hash-checks drafts, resumes three exact checkpoints, and escalates any
  indeterminate effect without invoking an adapter.
- [P02] The frozen 18-case eval set covers happy, ambiguous, malformed,
  unknown, timeout, permission, credential, downstream, duplicate, restart,
  invalid-model, adversarial, bypass, false-completion, escalation, and bounds.
- [P02] Eval execution derives critical status from closed observations,
  continues after bounded failures, writes private minimized artifacts, and
  exits non-zero for any critical, execution, evidence, or persistence failure.
- [P02] Three isolated source-break exercises proved lead fabrication,
  false-completion, and approval bypass fail the real gate before exact hashes
  were restored.
- [P03] Closed service, run, model, and tool observations use finite semantic
  guards, explicit metric availability, per-dependency timeout/abort, isolated
  failures, stable ordering, and no authority capability.
- [P03] The exact-run report validates complete history before bounded JSON or
  text rendering, is observed-only, and omits protected durable fields.
- [P03] Seven deterministic alert rules use finite evidence, thresholds,
  severity, suppression, and safe actions without notification or mutation.
- [P03] Five incident drills exercise timeout, invalid model, restart, revoked
  credential, and duplicate request through actual synthetic golden boundaries.

### Release, Backup, And Operations

- [P02] Offline snapshot/restore requires explicit stopped-writer confirmation,
  rejects roots/symlinks/nesting/damaged JSONL, writes private files and a
  closed SHA-256 manifest, and restores only to an absent directory.
- [P03] The pure 15-check release preflight validates controlled/public modes,
  exact source/image/runtime facts, operator decisions, secrets, persistence,
  health, monitoring, backup, incident, and rollback while always returning
  `targetMutationAllowed: false`.
- [P03] The selected image comes from one verified full revision. The runtime
  provider secret is Coolify runtime-only and excluded from build and evidence.
- [P03] The controlled HTTPS boundary, Dockerfile health, Sentinel, and one
  grounded `approval_pending` no-send smoke passed. One unstable workstation
  TLS path remains documented without weakening the target health claim.
- [P03] Exact event and approval files plus projections survived a full
  container replacement on the named `/app/data` volume.
- [P03] A stopped-writer snapshot was copied outside the VPS to a private
  `0700` owner directory, restored with `0600` files, and activated locally
  without changing source checksums.
- [P03] A nonexistent source revision produced a safe pre-replacement failure;
  Coolify restored the exact configured source without force and preserved
  health, prior state, and fresh provider behavior.
- [P03] Automatic branch-head deployment is disabled. Deploy, pause, backup,
  restore, recovery, rollback, and secret rotation remain owner actions.
- [P03] Local and deployed `lead_ada` runs matched validated qualification,
  one exact-lead draft, one pending approval, six business events, stop,
  no-send output, and observed-only report semantics.
- [P03] The plain-English guide and five-minute demo identify exact owner
  actions, deliberate non-capabilities, and mandatory human takeover.

### Tooling And Supply Chain

- [P03] Biome formatting/linting, strict TypeScript, 374 deterministic tests,
  18 evals, 97.88/86.29/98.43 coverage, npm audit, and staged hooks pass.
- [P03] Immutable-pinned Code Quality, Build & Test, Security, Integration, and
  managed CodeQL checks pass on `main`. Integration uses read-only permission,
  no secret, and no deploy capability.
- [P03] Integration CI runs all five drills, the controlled preflight, the real
  Dockerfile, exact health, and the 400/400/429 capacity boundary, then removes
  its named artifacts.

---

## GDPR Compliance Status

### Overall: N/A

No real personal data is collected or processed. Leads, drafts, actors,
approvals, results, receipts, and operational evidence are committed or
generated synthetic values. The live provider smoke used the same synthetic
fixture. GDPR or real-data readiness is not claimed.

### Personal Data Inventory

No real personal data collected or processed.

### Controlled Synthetic Data Boundary

| Data Element | Storage / Transfer | Purpose | Current Constraint | Since |
|--------------|--------------------|---------|--------------------|-------|
| Synthetic lead fixtures | Git repository | Deterministic qualification | Never replace with real leads | P00 |
| Run/tool evidence | Private JSONL | Correlation, audit, recovery | Minimized; manual lifecycle | P00 |
| Approval records | Private JSONL | Exact authorization truth | Contains full synthetic draft; manual lifecycle | P01 |
| Fake results | Injected private JSONL | Idempotency truth | Internal library/tests only | P01 |
| Eval artifacts | Private JSONL | Critical release evidence | Minimized; manual lifecycle | P02 |
| Offline snapshot | Private owner workstation | Recovery copy | Synthetic only; stopped writers; manual cadence | P03 |
| Synthetic actor IDs | Approval/effect records | Internal policy tests | Not real authentication | P01 |
| Provider working context | OpenAI memory for one smoke | Model drafting | Synthetic fixture; runtime-only credential | P03 |
| Provider credential | Coolify secret store / private env | Provider authentication | Never source, image, log, fixture, or evidence | P03 |
| Redacted release evidence | Git repository | Reviewable deployment proof | No private URL, UUID, run ID, raw log, or full draft | P03 |

### Compliance Checklist

| Requirement | Status | Notes |
|-------------|--------|-------|
| Data collection has documented purpose | N/A | No real-data purpose established |
| Consent/lawful basis established | N/A | Real data prohibited |
| Data minimization | PASS | Operational evidence omits unnecessary protected content |
| Erasure/export rights | N/A | Manual whole-environment synthetic reset only |
| No PII in tracked logs/evidence | PASS | Synthetic values only; private-value scan clean |
| Third-party transfer governance | N/A | Must be approved before real provider data |
| Off-server recovery | PASS for synthetic workshop | Manual private local snapshot and restore only |

Before real data, document purpose/lawful basis, identity/access,
minimization, retention, redaction, export, erasure, encryption, backup,
subprocessors, transfers, data locations, operator trust, and incidents.

---

## Dependency Security

The current npm 12 audit reports zero vulnerabilities. Production dependencies
remain pinned; lockfile overrides and install-script approvals are explicit.
Security CI uses immutable action pins, full-history secret detection,
pull-request dependency review, locked-tree audit, and managed CodeQL.

---

## Resolved Findings

| ID | Finding | Severity | Resolved | Phase | Resolution |
|----|---------|----------|----------|-------|------------|
| SC-005 | Recovery and release operations were unproved | Medium | 2026-08-12 | P03 | Controlled health/access, provider smoke, persistent replacement, off-server backup, exact restore activation, safe failed deployment, source-pinned recovery, parity, and owner handoff directly passed. Public/real-data limits moved to SC-001/SC-002. |
| SC-004 | Whole runs lacked deterministic bounds | Medium | 2026-08-11 | P02 | Closed configuration, exact step accounting, application deadline, abort-once cancellation, one terminal, and late-settlement suppression. |
| SC-003 | Approval decisions were not durable | High | 2026-08-04 | P01 | Closed records, exact linkage, private append-only storage, one-way decisions, runtime integration, and restart projection. |
| P00-R01 | Qualification depended on model judgment | Medium | 2026-08-04 | P00 | Closed deterministic qualification and exact-lead application gates. |
| P00-R02 | Raw inspection and mutable permission evidence | Medium | 2026-08-04 | P00 | Focused tool and frozen runtime allowlist with deterministic tests. |

---

## Phase History

| Phase | Sessions | Security | GDPR | Findings Opened | Findings Closed |
|-------|----------|----------|------|-----------------|-----------------|
| P03 | 8 of 8 | PASS for controlled synthetic target | N/A | 0 | 1 |
| P02 | 7 of 7 | PASS for controlled synthetic scope | N/A | 0 | 1 |
| P01 | 6 of 6 | PASS for controlled synthetic scope | N/A | 1 | 1 |
| P00 | 3 of 3 | PASS for controlled synthetic scope | N/A | 0 | 2 baseline gaps |

---

## Change Constraints

- Never read, print, log, or commit `.env`, provider keys, auth state, private
  target values, production logs, browser state, or unrelated user files.
- Use only synthetic data until SC-001 and SC-002 controls match the intended
  exposure and processing purpose.
- Keep `/runs` controlled; Basic Auth and process rate limiting do not prove
  public authorization, tenancy, distributed fairness, or WAF protection.
- Do not expose shell, filesystem, credential, deployment, approval-decision,
  or write capability to Pi.
- Do not register fake/write execution without exact-action authorization,
  immutable target/content, stable idempotency, stronger ownership, incident
  policy, rollback, and recorded maintainer review.
- Never auto-retry reservation-only or effect-indeterminate state.
- Treat reports, alerts, health, and deployment logs as observations, not
  approval/effect authority.
- Keep one JSONL-owning replica until cross-process locking/transactions and
  shared rate ownership are implemented and verified.
- Stop all writers before backup/restore, validate manifest/checksums, restore
  only to an absent directory, preserve source and snapshot, and keep real data
  out of the manual workshop backup.
- Keep automatic Coolify deploy off. Deploy and recover from one reviewed full
  revision; never infer image identity from a branch head or mutable tag.
- Run `npm run verify`, coverage, audit, incident drills, preflight, CI,
  permission/data scans, and final diff review before release claims.

---

## Recommendations

1. [P03] Keep internal fake execution disconnected until cross-process
   ownership and a recorded human permission review exist.
2. [P03] Keep the controlled target synthetic-only; public identity and real
   data require SC-001 and SC-002 completion, not a broader Basic Auth claim.
3. [P03] Keep manual local backup for the workshop; add automated/geographic
   recovery only when a real production requirement justifies its cost.
4. [P03] Run the Phase 04 typed-handoff experiment against the unchanged
   single-agent baseline and remove added complexity unless evidence improves.

---

*Auto-generated by carryforward. Direct edits allowed but may be overwritten.*
