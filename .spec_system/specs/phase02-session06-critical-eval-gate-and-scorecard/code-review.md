# Code Review and Repair Report

**Session ID**: `phase02-session06-critical-eval-gate-and-scorecard`
**Reviewed**: 2026-08-11
**Base Commit**: `8052ff6a6e8f05ccd188c081e5c6a6a72dfeaf87`
**Scope**: All tracked and untracked Session 06 source, test, documentation,
governance, environment-example, and workflow changes since the exact base
**Result**: RESOLVED

## Review Surface

The review covered the closed observation/scoring/runner contracts, deterministic
18-case harness, append-only artifact store, compact renderer, CLI migration,
application-owned safe output, all focused tests, and every changed operational
or governance claim. Untracked new files were inspected directly because they
do not appear in a normal unstaged Git diff.

No dependency, HTTP route, Pi tool, prompt allowlist, provider client, real
adapter, credential, database, deployment workflow, or public recovery/effect
entrypoint entered the Session 06 surface.

## Findings by Severity

### Critical

No findings.

### High

- `src/production-eval-runner.ts` scorer authority - the public scorer initially
  accepted a structurally valid case object by ID without proving that its full
  definition exactly matched the validated suite. A caller could therefore
  alter expectations before direct scoring. Fix: revalidate the complete suite,
  locate the registered case, require deep equality, and score only that frozen
  registered value. Direct invalid-suite, altered-case, and unregistered-case
  regressions now return no result. Status: FIXED.

### Medium

- `src/production-eval-runner.ts`, `src/production-eval-store.ts` artifact
  integrity - generic artifact validation compared result versions to the suite
  only when a suite argument was supplied. A structurally valid persisted
  artifact could otherwise contain result versions that disagreed with its own
  artifact version. Fix: require every result version to equal the artifact
  version in the generic guard, before any optional suite checks. Status: FIXED.
- `src/production-eval-store.ts` durability - the default writer swallowed a
  `closeSync` failure even though the session contract requires write, sync,
  close, and exact re-read failures to block success. Fix: propagate close
  failures into the canonical storage refusal; retain exact post-write re-read
  validation. Status: FIXED.
- `src/production-eval-harness.ts` deterministic adapter time - adapter
  acceptance and fake-service validation initially sampled independent wall
  clocks, allowing a millisecond boundary to turn an intended acceptance into
  an out-of-window failure. Fix: derive both values from one captured base time
  and injected monotonic sequence. Status: FIXED.
- `src/production-eval-runner.ts`, `src/production-eval-store.ts` hostile
  configuration - property getters at replaceable runner/store option
  boundaries could throw before canonical refusal, and artifact paths had no
  finite length bound. Fix: snapshot options inside guarded reads, bind the
  selected append function, map hostile getters to canonical configuration
  failure, and cap paths at 4,096 characters. Status: FIXED.

### Low

- `src/production-eval-store.ts` public results - successful append/list values
  were cloned but not recursively frozen. Fix: deep-freeze public store results
  and add nested immutability assertions. Status: FIXED.
- `src/production-eval-scorecard.ts` output compactness - raw duration floats
  produced noisy unstable-width lines. Fix: round displayed available metrics
  to three decimals while retaining exact artifact values and units. Status:
  FIXED.

## Assumptions and Deliberate Non-Fixes

- The artifact file is a controlled single-process JSONL boundary. It has no
  cross-process lock or transaction; concurrent runners against one path remain
  unsupported and must not be treated as distributed release evidence.
- Provider-backed token, cost, model-grade, and service-level latency evidence
  remains unavailable or pending. Deterministic harness duration does not set a
  provider threshold and has no critical authority.
- Session 07 exclusively owns temporary source breaks for lead grounding,
  false completion, and approval bypass. No deliberate vulnerability or claimed
  red/fix/green source trace is included here.
- The default eval artifact is ignored local synthetic evidence. Real customer
  data and public/deployed release evidence remain prohibited or unproved.

## Behavior Changes from Review Repairs

- Direct scoring cannot redefine a registered case or rubric.
- Generic persisted artifacts cannot carry internally inconsistent result
  versions.
- Close failures and hostile configuration getters cannot escape or manufacture
  a successful durable gate.
- Fake acceptance uses one deterministic time source, store results are
  immutable, and scorecard metric labels remain compact.

The repairs add no authority, effect, route, dependency, credential, real-data
field, provider call, deployment permission, or production runtime edge.

## Security and Privacy Review

- Injection: PASS - no shell, SQL, template, URL, subprocess, provider, or
  network interpreter was added.
- Authorization: PASS - approval and fake-result stores remain the only
  permission/effect truth; events and eval observations do not grant authority.
- Secrets: PASS - exact changed-value scans found no credential or private-key
  value.
- Sensitive data: PASS for synthetic scope - artifacts exclude drafts, lead
  profiles, transcripts, provider payloads, stacks, raw errors, and full
  approval records.
- Dependencies: PASS - no package dependency changed and npm audit reports zero
  vulnerabilities.
- Permission and side effects: PASS - production retains exactly three tools;
  fake effects are deterministic, in-process, isolated, and unreachable from
  Pi/HTTP.
- GDPR: N/A for real-data processing - all fixtures and retained evidence are
  synthetic.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Exact-base review | PASS | All Session 06 source, test, docs, governance, environment, and workflow hunks/new files inspected |
| Focused runner/output gate | PASS | 28/28 scoring, harness, persistence, scorecard, safe-output, and hostility cases |
| Full verification | PASS | Format, lint, strict TypeScript, 269/269 tests, and 18/18 durable eval cases |
| Injected critical refusal | PASS | One critical mismatch retains 17 passes and derives inner gate exit 1 |
| Coverage | PASS | 97.64% lines, 85.35% branches, and 97.88% functions |
| Build and audit | PASS | TypeScript build succeeds; zero dependency vulnerabilities |
| Production-agent gate | PASS | Required `npm run check`, `npm test`, and `npm run eval` behavior passes through `npm run verify` |
| Permission/capability | PASS | Exact three tool names; no HTTP/Pi registration, provider, real adapter, fetch, subprocess, or network client |
| Artifact/data | PASS | Private minimized JSONL, exact re-read, no protected fixture/provider/dependency content |
| Encoding/links/whitespace | PASS | Changed text is ASCII/LF/newline-terminated, relative links resolve, and base diff check is clean |
| UI/database | N/A | No rendered UI, SQL, ORM, migration, or database surface |

## Summary

One high, four medium, and two low findings were repaired with direct regression
coverage. No unresolved correctness, security, privacy, permission, evidence,
availability, durability, or documentation issue remains in the bounded
Session 06 gate.

Next command: `validate`
