# Code Review and Repair Report

**Session ID**: `phase00-session02-qualification-contract-and-domain`
**Reviewed**: 2026-08-04
**Base Commit**: `675d76b4e8960b035edcdd3e21deb1ab86f576e7`
**Scope**: All changes since the base commit, including the mid-session
checkpoint commit and the review repairs
**Result**: RESOLVED

## Review Surface

**Files reviewed** (all changes since the base commit):

- `.spec_system/PRD/phase_00/session_02_qualification_contract_and_domain.md` - tracked modification in the mid-session commit
- `.spec_system/specs/phase00-session02-qualification-contract-and-domain/implementation-notes.md` - added in the mid-session commit
- `.spec_system/specs/phase00-session02-qualification-contract-and-domain/spec.md` - added in the mid-session commit
- `.spec_system/specs/phase00-session02-qualification-contract-and-domain/tasks.md` - added in the mid-session commit
- `.spec_system/specs/phase00-session02-qualification-contract-and-domain/code-review.md` - review artifact added by this workflow
- `.spec_system/state.json` - tracked modification in the mid-session commit
- `docs/CHANGELOG.md` - tracked modification plus review repair notes
- `docs/TODO.md` - tracked modification plus review-state update
- `docs/build-log.md` - tracked modification plus repaired contract evidence
- `package-lock.json` - version metadata changed by the requested checkpoint publish
- `package.json` - version metadata changed by the requested checkpoint publish
- `src/leads.ts` - added in the mid-session commit
- `src/qualification.ts` - added in the mid-session commit and repaired in review
- `src/tools.ts` - tracked fixture-extraction modification in the mid-session commit
- `tests/qualification.test.ts` - added in the mid-session commit and expanded in review

All files are text. The initial inventory contained no untracked files; this
report is the only file added after that inventory.

**Inventory commands**: `git status`,
`git log --oneline 675d76b4e8960b035edcdd3e21deb1ab86f576e7..HEAD`,
`git diff 675d76b4e8960b035edcdd3e21deb1ab86f576e7`,
`git diff --cached 675d76b4e8960b035edcdd3e21deb1ab86f576e7`,
and `git ls-files --others --exclude-standard`

## Findings by Severity

### Critical

No findings.

### High

No findings.

### Medium

- `src/qualification.ts:41` - The result schema accepted arbitrary non-empty
  strings for `reasons` and `missingInformation`. A model-authored value such
  as `model_claim` therefore passed the exported result validator despite the
  specification defining stable application-owned codes. Fix: added finite
  TypeBox unions for both code sets, inferred their TypeScript types, and used
  the unions in `QualificationResultSchema`. The bounds test now rejects
  invented codes as well as non-finite and out-of-range confidence. Status:
  FIXED.
- `src/qualification.ts:232` - The injectable lookup returned a statically
  trusted `Lead`, but no runtime check protected qualification computation from
  a malformed dependency record. This contradicted the session's explicit
  untrusted-lookup boundary and could throw outside the structured failure
  path. Fix: changed the lookup boundary to `unknown`, compiled a closed lead
  record schema, validated the returned record before computation, and mapped
  malformed records to redacted `lead_lookup_failed`. Status: FIXED.

### Low

- `src/qualification.ts:208` - The missing-input classifier used the `in`
  operator, so a prototype-only `leadId` was classified as unsupported input
  rather than missing input. It still could not reach lookup, but it did not
  match the own-property trust-boundary contract. Fix: require
  `Object.hasOwn(candidate, "leadId")` and cover the inherited-property case in
  the pre-lookup missing-input test. Status: FIXED.
- `src/qualification.ts:242` - Exact requested-versus-returned identity was
  enforced in source but had no dedicated regression test. Fix: added a valid
  mismatched lookup record and proved it returns `lead_not_found` without a
  qualification value. Status: FIXED.

## Assumptions and Deliberate Non-Fixes

- `isQualificationResult` validates the closed result shape; it is necessary
  evidence but is not an authorization or provenance proof. Only the
  `qualifyLead` success path computes application-owned qualification truth.
  The Build Log now states this distinction explicitly.
- A structurally valid record whose identity differs from the exact requested
  identifier remains `lead_not_found`. Repository evidence treats exact
  identity as the lookup invariant, so returning the wrong record does not make
  the requested lead exist.
- Version `0.1.8` and its changelog entry are preserved as the user-requested
  mid-session checkpoint. Session closeout owns the next release increment;
  review does not rewrite checkpoint history.

## Behavior Changes

- Invented reason and missing-information strings no longer satisfy the result
  schema.
- A malformed lookup record now produces a stable redacted
  `lead_lookup_failed` outcome instead of reaching computation or throwing.
- A prototype-only `leadId` is now classified as `missing_lead_id` before
  lookup.

All changes tighten the declared contract. Production Pi registration, HTTP,
events, persistence, provider access, and the three-tool allowlist remain
unchanged.

## Evidence Ledger

| Check | Command or Inspection | Result | Evidence / Blocker |
|-------|-----------------------|--------|--------------------|
| Analyzer | `bash .spec_system/scripts/analyze-project.sh --json` | PASS | Phase 00 current Session 02 resolved with one completed predecessor |
| Targeted tests | `node --import tsx --test tests/qualification.test.ts` under Node.js 24.15.0 | PASS | 13 tests passed; 0 failed, skipped, or cancelled |
| Full verification | `npm run verify` under Node.js 24.15.0 and npm 12.0.2 | PASS | TypeScript passed, 17/17 tests passed, and 5/5 evals passed |
| Dependency audit | `npm audit --audit-level=high` under npm 12.0.2 | PASS | 0 vulnerabilities |
| Linter | Inspection of `package.json` scripts and repository config | N/A | No linter is configured |
| Formatter | Inspection of `package.json` scripts and repository config | N/A | No formatter is configured |
| Type checker | `npm run check` under Node.js 24.15.0 and npm 12.0.2 | PASS | `tsc --noEmit` exited 0 |
| Permission surface | Exact `tools` array and tool-name inspection in `src/pi-agent.ts` and `src/tools.ts` | PASS | Production allowlist remains `inspect_lead`, `draft_follow_up`, and `request_send_approval` |
| Side-effect scan | Base diff scan for process, shell, filesystem, HTTP, credential, and send capability symbols | PASS | No new external effect or permission was found |
| Secret scan | Base diff credential-pattern scan | PASS | No credential value or private-key marker was found |
| Whitespace | `git diff --check 675d76b4e8960b035edcdd3e21deb1ab86f576e7` | PASS | No whitespace error |
| Encoding and links | Node byte and relative-Markdown-link scan over the base diff, untracked files, and repository Markdown | PASS | 15/15 review files are ASCII with LF endings; 21 Markdown files have no missing relative target |
| Behavioral quality | Trust, cleanup, mutation, failure, contract, and product-surface checklist inspection | PASS | Applicable trust and contract gaps were fixed; other runtime categories are unchanged or N/A |
| Security and privacy | Session diff inspected against `.spec_system/SECURITY-COMPLIANCE.md` and the security checklist | PASS | Synthetic data only; no secret, new PII, network effect, dependency, or exposure change |
| Final diff re-read | `git diff 675d76b4e8960b035edcdd3e21deb1ab86f576e7` plus `git ls-files --others --exclude-standard` | PASS | Every review-surface file was re-read; no unresolved finding or debug artifact remains |

## Summary

1. Reviewed all 15 files in the final base-commit surface, including the
   user-requested mid-session checkpoint and this report.
2. Resolved 0 critical, 0 high, 2 medium, and 2 low findings with deterministic
   regression coverage.
3. Preserved the intended Pi-independent domain scope, exact fixture behavior,
   and current runtime permission boundary.
4. Full verification passes strict TypeScript, 17/17 deterministic tests, 5/5
   evals, dependency audit, whitespace, permission, capability, secret,
   behavioral-quality, and targeted security checks.

## Next Step

Run `validate`.
