# Code Review and Repair Report

**Session ID**: `phase02-session04-replay-and-resume-integration`
**Reviewed**: 2026-08-11
**Base Commit**: `ec7824ddca245af1d5b972888dc642bfba6fb5e7`
**Scope**: All tracked and untracked Session 04 implementation, test,
documentation, governance, and workflow changes since the exact base
**Result**: RESOLVED

## Review Surface

The reviewed pre-validation surface contains 18 logical path states: ten
tracked base-diff paths and eight untracked implementation, test, specification,
summary, and review artifacts. There are no staged or post-base commits.

- Recovery implementation and deterministic tests (2).
- Session specification, checklist, notes, summary, and review reports (6).
- Architecture, development, environment, incident, Build Log, TODO, changelog,
  considerations, cumulative security, and state evidence (10).

Every source/test hunk and every changed documentation claim was inspected.
No dependency, route, Pi tool, approval-decision permission, effect adapter,
network client, credential, deployment file, database, or UI entered the
surface.

## Findings by Severity

### Critical

No findings.

### High

No findings.

### Medium

- `src/recovery-application.ts` constructor - approval-service options were
  spread after the constructor's canonical configuration `try` boundary. A
  hostile proxy could therefore throw caller-controlled detail instead of the
  stable configuration failure. Fix: snapshot the options and construct the
  approval service inside the guarded boundary. A hostile `ownKeys` regression
  now proves the raw detail cannot escape. Status: FIXED.
- `src/recovery-application.ts` outcome guard - the closed failure schema
  allowed any eight-character non-null string and the semantic guard did not
  apply `isRunId`. A forged failure value could pass the public guard despite
  an invalid durable identity. Fix: require a valid run ID for every non-null
  failure and every success outcome. Regression coverage exercises a
  schema-valid but semantically invalid value. Status: FIXED.

### Low

- `src/recovery-application.ts` path validation - three exact keys were
  required, but event and approval paths could still name the same lexical
  target. That would fail closed after mixed-record parsing but create an
  avoidable availability and evidence-isolation hazard. Fix: resolve and
  require three distinct targets before constructing any store. Status: FIXED.

## Assumptions and Deliberate Non-Fixes

- Recovery is invoked explicitly by an internal application caller. There is
  no public scheduler, background retry, route, or operator UI in this session.
- A record/event split around a new approval is ambiguous and escalates. The
  application does not infer permission or manufacture a missing approval event
  merely because an approval record exists.
- A failed draft or terminal append may have succeeded. Returning retry is safe
  because the next invocation reloads and reprojects before mutation and exact
  append identities suppress incompatible success.
- Stable replay describes unchanged durable authority. A later human approval
  or decline legitimately changes the returned approval record while retaining
  the original agent terminal reason.
- Full synthetic draft content remains in the dedicated approval record, not
  run events. Real data remains prohibited and coordinated whole-environment
  lifecycle controls remain an explicit release gate.
- Lexical path aliasing is rejected. Symlink/hard-link identity and distributed
  writer ownership are deployment concerns outside this local internal scope.

## Behavior Changes from Review Repairs

- Hostile configuration failures are canonical before store/service escape.
- Public outcome guards cannot bless malformed run identity.
- Three durable evidence domains cannot be pointed at one lexical file target.

The repairs add no permission, effect, route, dependency, retained customer
field, or deployed behavior.

## Security and Privacy Review

- Injection: PASS - no shell, SQL, template, process, URL, or network
  interpreter is introduced; replaceable inputs cross closed runtime checks.
- Authorization: PASS - exact approval records remain human authority and fake
  result records remain effect truth; recovery cannot decide or execute either.
- Secrets: PASS - changed-value scans found no credential or private-key value.
- Sensitive data: PASS for synthetic scope - run events retain bounded IDs,
  hashes, codes, checkpoints, and terminal evidence; no transcript, provider
  payload, raw result, stack, or credential is added.
- Dependencies: PASS - no dependency changed and `npm audit --omit=dev` reports
  zero vulnerabilities.
- Permission and side effects: PASS - production retains exactly
  `qualify_lead`, `draft_follow_up`, and `request_send_approval`; recovery has
  no fake service/adapter, Pi, HTTP, or real-write capability.
- GDPR: N/A for real-data processing - all fixtures and documented stores are
  synthetic and real customer data remains prohibited.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Base-diff inventory | PASS | 18 pre-validation logical paths; no staged or post-base commit |
| Focused recovery suite | PASS | 17/17 cases cover checkpoints, replay, authority, damaged state, and review repairs |
| Full verification | PASS | Format, lint, strict TypeScript, 238/238 tests, and 5/5 evals |
| Coverage | PASS | 97.17% lines, 85.87% branches, and 97.41% functions |
| Build and audit | PASS | TypeScript build succeeds; zero production dependency vulnerabilities |
| Production-agent gate | PASS | `npm run check`, `npm test`, and `npm run eval` all pass |
| Permission/capability | PASS | Exact three Pi tools; no recovery effect, route, process, shell, or network client |
| Encoding/whitespace | PASS | Changed text is ASCII/LF with terminal newline; `git diff --check` is clean |
| Security/data | PASS | No credential, customer record, transcript, provider payload, or effect permission added |
| UI/database | N/A | No rendered UI, SQL, ORM, migration, or database exists in the change |

## Summary

The exact Session 04 surface was reviewed and two medium plus one low finding
were repaired with direct regression coverage. No unresolved correctness,
security, privacy, availability, permission, evidence, or documentation issue
remains.

Next command: `validate`
