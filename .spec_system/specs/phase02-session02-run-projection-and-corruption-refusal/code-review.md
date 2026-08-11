# Code Review and Repair Report

**Session ID**: `phase02-session02-run-projection-and-corruption-refusal`
**Reviewed**: 2026-08-11
**Base Commit**: `918bc4c2970711751296f3c015ce185ae87acfd4`
**Scope**: All tracked and untracked Session 02 changes since the exact base
commit, including workflow state, planning, implementation, tests,
documentation, and this review artifact
**Result**: RESOLVED

## Review Surface

The final surface contains 11 path states: five tracked base-diff paths and six
untracked paths including this report. There are no staged changes and no
commit after the base.

**Logical inventory**:

- Apex workflow and session evidence (5): state, specification, task
  checklist, implementation notes, and this report.
- Workshop documentation (3): changelog, TODO, and Week 3 Build Log.
- Production source (1): the new pure run-projection boundary.
- Deterministic tests (2): the projection suite and shared event-test helper.

Every tracked hunk and every untracked text file was read. No binary, generated
artifact, dependency, route, deployment file, or database change entered the
surface.

**Inventory commands**: `git status --short`, `git log --oneline BASE..HEAD`,
`git diff --name-status BASE`, `git diff --numstat BASE`, `git diff --cached
--stat BASE`, and `git ls-files --others --exclude-standard`.

## Findings by Severity

### Critical

No findings.

### High

- `src/run-projection.ts:422` - Top-level lifecycle status trusted operational
  `approval.approved` and `fake_send.accepted` observations even when dedicated
  approval/fake-result evidence was omitted. The projection exposed the
  separate `not_supplied` marker, but a consumer reading only `status` could see
  `approved` or `completed`, weakening the core rule that events never grant
  permission or prove an effect. Fix: derive trusted post-run status from exact
  dedicated authority when supplied; unverified approval remains waiting and
  an unverified accepted result remains `effect_indeterminate`. Active runs
  remain `running` even if authority is ahead, and public projection guards now
  reject impossible context/authority combinations. Regression coverage proves
  unverified, verified-ahead, active, and verified-effect cases. Status: FIXED.

### Medium

- `src/run-projection.ts:1133` - The store-backed boundary converted every
  valid event-store failure into retryable `storage_failure`. Structural
  corruption, interruption, duplicate identity, and stored ordering damage
  therefore lost their operator-actionable category. Fix: add canonical
  `corrupt_history` and `interrupted_history` failures and preserve duplicate,
  ordering, invalid-input, and storage mappings from validated store outcomes.
  Malformed or throwing adapters still become redacted `storage_failure`.
  Status: FIXED.
- `src/run-projection.ts:604` - A `lead_not_found` outcome and matching
  `run.completed/not_found` terminal could be accepted after a qualification
  attempt whose optional `leadId` was absent. This attributed a refusal to the
  started lead without durable attempt identity. Fix: retain the attempted lead
  internally and require exact started-lead binding before accepting a
  not-found terminal. Malformed/missing-input qualification failures may still
  stop safely without advancing a checkpoint. Status: FIXED.
- `src/run-projection.ts:949` - Exact fake-result identity and duration checks
  did not reject a valid dedicated reservation/result dated after the matching
  attempted/terminal operational events. A future durable record could
  therefore be attached to earlier event evidence. Fix: retain attempt and
  terminal event times internally and require reservation time not later than
  the attempt and completed-result time not later than an observed terminal
  result. Dedicated truth may still legitimately advance beyond an open
  attempt when no terminal observation exists. Status: FIXED.

### Low

No findings.

## Assumptions and Deliberate Non-Fixes

- Event-only projection remains useful for lifecycle inspection, but authority
  is explicitly `not_supplied`; it cannot produce trusted approval or
  effect-complete status from post-run operational observations.
- A `run.completed` event with stop reason `completed` remains authoritative
  for agent-run lifecycle only. It does not prove a fake effect; effect truth
  remains a separate dedicated result projection.
- An open qualification attempt is a valid interrupted prefix and keeps the
  start checkpoint. An open fake attempt is visibly indeterminate and cannot
  be retried automatically by this session.
- The projector intentionally models one qualification, draft, and approval
  path. Session 03 must add explicit attempt/outcome and bound semantics before
  broader retry interpretation is safe.
- Session 02 is read-only. Recovery action selection, retry, continuation,
  approval reuse, fake-result stop/escalation, and resume remain Session 04.
- No provider-backed Pi request was required or run. All fixtures are
  deterministic and synthetic.

## Behavior Changes from Review Repairs

- Trusted lifecycle status now follows dedicated approval and fake-result truth
  rather than unverified operational observations.
- Not-found terminals require exact durable lead-attempt identity.
- Store-backed projection preserves corrupt, interrupted, duplicate, ordered,
  invalid, and unavailable failure categories.
- Fake-result authority must be temporally possible relative to observed
  attempt and result events.
- Public projection guards reject authority states that cannot correspond to
  the minimized working context.

No tool, HTTP, approval-decision, fake-effect, provider, network-write, shell,
filesystem-tool, or deployment permission was added by the repairs.

## Security and Privacy Review

- Injection: PASS - the projector invokes no SQL, shell, template, network, or
  process interpreter; all external values cross closed runtime validation.
- Secrets: PASS - sensitive-name scans found no credential value, and caught
  values never enter canonical failures.
- Sensitive data: PASS - projection context excludes full draft content, lead
  profile data, transcript text, credentials, raw Pi payloads, and arbitrary
  dependency messages. Fixtures remain synthetic.
- Dependencies: PASS - no package dependency changed and `npm audit --omit=dev`
  reports zero vulnerabilities.
- Permission and side effects: PASS - the production allowlist remains exactly
  `qualify_lead`, `draft_follow_up`, and `request_send_approval`; the projector
  is read-only and imports into no Pi or HTTP composition.
- GDPR: N/A for new real-data processing - no real personal-data path,
  retention promise, deletion behavior, or third-party transfer was added.

## Evidence Ledger

| Check | Command or inspection | Result | Evidence |
|-------|-----------------------|--------|----------|
| Analyzer | `bash .spec_system/scripts/analyze-project.sh --json` | PASS | Phase 02 Session 02 is current; ten predecessor sessions are complete |
| Review inventory | Git base-diff and untracked-path commands | PASS | 11 final logical path states; no staged or post-base commit |
| Focused repairs | `npx tsx --test tests/run-projection.test.ts` | PASS | 22/22 cases cover the four findings and complete projection matrix |
| Full verification | `npm run verify` | PASS | Format, lint, strict TypeScript, 198/198 tests, and 5/5 evals pass |
| Coverage | `npm run test:coverage` | PASS | 95.87% lines, 85.12% branches, and 97.14% functions exceed configured gates |
| Dependency audit | `npm audit --omit=dev` | PASS | Zero vulnerabilities |
| Production allowlist | Static exact-array assertion plus permission suite | PASS | Exactly three bounded tools; no fake execution exposure |
| Capability diff | Production composition diff and new-source scan | PASS | No HTTP, tool, process, provider, or network-write boundary changed |
| Encoding | ASCII and CRLF scans over every final changed file | PASS | ASCII only, LF only, and terminal newlines retained |
| Links | Repository Markdown relative-target scan | PASS | 138 Markdown files have zero missing relative targets |
| Secrets | Sensitive-name scan over source, tests, docs, and session evidence | PASS | Zero credential-value matches |
| Whitespace | `git diff --check BASE` | PASS | No whitespace errors |
| Behavioral quality | Trust, recovery, mutation, failure, and contract review | PASS | Four findings repaired; no unresolved violation |
| UI surface | Changed-path and deliverable inspection | N/A | No route, component, style, page, or rendered UI changed |
| Database/schema | Changed-path and architecture inspection | N/A | No database layer or migration exists; TypeBox schemas are application contracts |
| Final diff re-read | Full base diff plus every untracked text file | PASS | No unresolved defect, debug artifact, secret, permission drift, or deferred-scope claim remains |

## Summary

1. Reviewed all 11 logical Session 02 artifacts across workflow, source, tests,
   and documentation.
2. Resolved zero critical, one high, three medium, and zero low findings with
   direct deterministic regression coverage.
3. Preserved the single-agent, synthetic-only, exact-three-tool, dedicated
   authorization/result truth, and no-real-write boundaries.
4. Full verification, coverage, audit, state, encoding, links, whitespace,
   secret, security, and behavioral-quality gates pass.

Next command: `validate`
