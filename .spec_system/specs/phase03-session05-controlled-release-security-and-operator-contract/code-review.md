# Code Review And Repair Report

**Session ID**: `phase03-session05-controlled-release-security-and-operator-contract`
**Reviewed**: 2026-08-12
**Base Commit**: 9cbd418f0aaa01af935ec5b3b3cbbefaaf1737c5
**Scope**: Every tracked diff and untracked file since the Session 04 base
**Result**: RESOLVED

## Review Surface

- `src/release-preflight.ts`: inventories, TypeBox contracts, own-data
  preflight, mode semantics, readiness checks, result guards, cloning, and freeze.
- `scripts/release-preflight.ts`: argument refusal, 64-KiB stdin ownership,
  parsing, stdout/stderr separation, canonical failures, and exit codes.
- `tests/release-preflight.test.ts`: controlled/public policy, every target and
  runtime fact, hostile trees, semantic damage, output minimization, CLI, and purity.
- Controlled-release contract, fixture, Week 4 evidence, deployment,
  environments, architecture, README, TODO, changelog, state, and Apex records.
- Relevant unchanged Pi, HTTP, approval/effect, recovery, Docker, workflow,
  dependency, cumulative security, and known-infrastructure boundaries.

The exact-base surface contains 17 changed/new files. Pi tools, HTTP routes,
approval/effect/recovery contracts, Docker, workflows, dependencies, and the
lockfile have no diff.

## Findings By Severity

### Critical

None.

### High

None.

### Medium

1. The initial request schema accepted arbitrary bounded runtime path strings.
   They were never emitted, but accepting them contradicted the finite-evidence
   contract and could ingest a protected value into process memory. **Fix:**
   each path now accepts only its exact required literal or the finite
   `mismatch` sentinel, which returns `runtime_bounded: blocked`. Tests cover all
   three mismatches. **Status: FIXED.**
2. The initial own-data preflight bounded depth and keys per object but did not
   bound total nodes across a wide nested tree. A library caller could require
   excessive traversal before TypeBox rejected an extra field. **Fix:** add a
   shared 2,000-node budget before semantic reads and a wide-tree refusal
   regression. The 64-KiB command bound remains an independent outer limit.
   **Status: FIXED.**
3. The initial public result guard validated shape, check order, blocked IDs,
   and aggregate status, but not every check's exact status/reason mapping or
   the `image_recorded` check's relationship to `imageDigest`. A crafted result
   could therefore attach another finite reason or remove the digest while
   passing the guard. **Fix:** validate the exact reason for every check and
   exposure mode, and require image-pass if and only if the digest is present.
   Semantic-damage regressions now fail. **Status: FIXED.**

### Low

None.

## Behavior Changes From Review Repairs

- Runtime path inputs cannot contain arbitrary text, including secret-like values.
- In-memory library requests have a complete global node bound in addition to
  depth, key, schema-array, and command-byte bounds.
- Public result guards reject reason substitution and image identity removal.
- Ready/blocked evaluation and the deliberately blocked fixture are otherwise unchanged.

## Security, Privacy, And Authority Review

- Source and command import no filesystem, network, HTTP, TLS, subprocess,
  provider, credential, deployment, notification, persistence, or target client.
- The command reads stdin only. It accepts no path or argument and echoes no
  request or caught error.
- The only non-literal input strings are a lowercase 40-character source
  revision and lowercase 64-hex `sha256:` image identity.
- Generic roles identify responsibilities without personal names. Fixed evidence
  slots are categories, not arbitrary paths, URLs, screenshots, or notes.
- Controlled mode never accepts public `/runs`. Public mode requires all ten
  gates to be confirmed and still grants no target mutation.
- `targetMutationAllowed` is a literal false in every result. A ready result is
  only a workflow gate for separately authorized Session 06 operations.
- Checked-in evidence marks the image and all target facts pending/false. No
  Coolify, domain, address, registry, project, volume, backup, operator, or secret
  identity is stored.
- Pi retains exactly three tools; the HTTP service, fake-effect boundary,
  recovery behavior, container, and workflows are unchanged.

## Deliberate Boundaries

- The 788-line domain module is cohesive: declarative closed inventories and
  schemas occupy most of the file, while one pure evaluator owns their linked
  semantics. A deployment adapter would be a separate module and is absent.
- A hypothetical fully confirmed public request proves the policy algorithm,
  not the existence of public controls. Documentation states that public
  `/runs` remains unsupported by current application and target evidence.
- Operator confirmations are explicit attestations. Direct target checks remain
  Session 06 prerequisites and cannot be manufactured by this evaluator.
- The incomplete fixture uses the Session 04 base revision only as safe input
  shape; its failed repository status and dirty-tree flag prevent a release claim.

## Evidence Ledger

| Check | Result | Evidence |
|-------|--------|----------|
| Review RED/GREEN | PASS | Arbitrary paths, wide tree, reason substitution, and missing image identity regressions fail after the corresponding guard and pass the focused suite |
| Focused tests | PASS | 20/20 release-preflight policy, readiness, hostile-input, command, and purity cases |
| Full verification | PASS | Format, lint, strict types, 374/374 tests, and 18/18 production eval cases |
| Coverage | PASS | 97.88% lines, 86.31% branches, 98.43% functions; preflight 99.11/90.71/100 |
| Dependency audit | PASS | Zero vulnerabilities; dependency and lockfile diff empty |
| Blocked command | PASS | Valid closed result, 13 exact blocked checks, exit 1, no stderr |
| Ready command | PASS | Constructed exact result, 15 pass checks, exit 0, no stderr, mutation literal false |
| Input bounds | PASS | Args, empty, malformed, multiple JSON, oversized, accessor, symbol, prototype, cycle, depth/key/node violations refuse canonically |
| Permission cutoff | PASS | Pi/HTTP/approval/effect/recovery/Docker/workflow diffs empty |
| Privacy/security | PASS | Closed literals/patterns, protected-extra omission, no arbitrary evidence fields, no secret/target capability |
| Diff/encoding | PASS | `git diff --check`, ASCII/LF, JSON parsing, task counts, and documentation links pass |
| Target cutoff | PASS | No Coolify connection, image build, secret read, external check, storage, backup, restore, rollback, or target mutation |

## Summary

The complete Session 05 diff was reviewed against fail-closed exposure,
finite evidence, resource bounds, target authorization, source/image identity,
single-replica persistence, secret minimization, operator ownership, output
semantics, and claim accuracy. Three Medium findings were repaired and
regression-tested. No unresolved finding remains.

## Next Step

Session complete. Session 06 requires an authorized target preflight.
