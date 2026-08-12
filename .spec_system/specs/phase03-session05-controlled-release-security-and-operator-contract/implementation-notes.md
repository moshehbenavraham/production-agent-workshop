# Implementation Notes

**Session ID**: `phase03-session05-controlled-release-security-and-operator-contract`
**Implemented**: 2026-08-12
**Base Commit**: 9cbd418f0aaa01af935ec5b3b3cbbefaaf1737c5

## Outcome

Implemented a closed controlled-release preflight that validates finite source,
image, exposure, runtime, operator-decision, secret, persistence, health,
monitoring, backup, incident, and rollback facts before any separately
authorized target workflow. The evaluator is pure, the command reads only one
bounded stdin JSON object, and both expose no deployment capability.

The checked-in example validates the policy shape while returning `blocked` for
13 exact readiness checks. It contains no target value and cannot be mistaken
for image, secret, storage, monitoring, backup, or rollback proof.

## Implementation

- Added five finite owner roles, 13 exact decision mappings, 10 pre-public gate
  IDs, 15 readiness checks, and closed finite reason codes.
- Added mode-specific semantics: controlled mode requires external HTTPS health
  plus private or edge-restricted `/runs`; public mode requires all ten gates
  to be `confirmed`.
- Preserved the 16,384-byte application body bound, one replica, port 3000,
  `/app/data`, exact event/approval paths, and configured deadline/step/rate facts.
- Added exact source gate counts and immutable `sha256:` image identity; a
  pending image is explicit and always blocks readiness.
- Added complete own-data preflight with accessor/symbol/prototype/cycle,
  depth, per-object key, and global 2,000-node refusal before semantic reads.
- Restricted runtime path alternatives to the exact value or finite `mismatch`
  sentinel so arbitrary input strings cannot carry protected values.
- Added deep clone/freeze and semantic result validation for stable check order,
  exact reason/status relationships, blocked IDs, and ready/blocked state.
- Added a no-argument command with a 64-KiB stdin bound, closed stdout results,
  canonical stderr failure, and exits 0/1/2 for ready/blocked/invalid.
- Added the controlled-release record, Mermaid trust map, security matrix,
  exact ownership contract, operator workflow, and unsupported-claim boundary.

## Files

| File | Change |
|------|--------|
| `src/release-preflight.ts` | Closed contracts, inventories, semantics, evaluator, and guards |
| `scripts/release-preflight.ts` | Bounded stdin command and exit contract |
| `tests/release-preflight.test.ts` | 20 policy, readiness, hostile-input, command, and purity tests |
| `docs/release/controlled-release-contract.md` | Decision record, Mermaid map, security matrix, and workflow |
| `docs/fixtures/release-preflight-incomplete.json` | Safe deliberately blocked input shape |
| `package.json` | Added `preflight:release` |
| Week 4, deployment, environment, architecture, README, TODO, changelog | Synchronized release policy and target block |

## Verification

- Focused tests: 20/20 pass.
- Full repository: 374/374 tests and 18/18 production eval cases pass.
- Coverage: 97.88% lines, 86.31% branches, 98.43% functions.
- Release preflight coverage: 99.11% lines, 90.71% branches, 100% functions.
- Audit: zero known vulnerabilities.
- Blocked fixture command: one closed blocked result, exit 1, no stderr.
- Ready constructed command: one closed ready result, exit 0, no stderr.
- Permission boundary: no Pi, HTTP, approval/effect, recovery, Docker, workflow,
  dependency, target call, process execution, secret read, or filesystem read.

## Deliberate Boundaries

- Public-mode tests prove only contract logic. The current application remains
  unsuitable for public `/runs` exposure.
- Operator booleans are attestations, not target proof. Sessions 06-08 must
  obtain direct redacted evidence through authorized platform operations.
- A ready result retains `targetMutationAllowed: false`; it is a workflow gate,
  not execution permission.
- Source revision and image digest are the only accepted caller strings not
  drawn from finite literals, and both use closed lowercase identity patterns.
- No release image, Coolify connection, secret, external health, persistent
  restart, backup, restore, or rollback claim was created.

## Next Step

Session complete. Session 06 requires an authorized target preflight.
