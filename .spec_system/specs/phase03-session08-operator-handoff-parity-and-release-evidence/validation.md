# Validation Report

**Session ID**: `phase03-session08-operator-handoff-parity-and-release-evidence`
**Validated**: 2026-08-12
**Result**: PASS
**Validated Version**: `0.1.38` before closeout bump

---

## Functional Validation

| Check | Result | Evidence |
|-------|--------|----------|
| Local provider smoke | PASS | HTTP 200; grounded; one draft; one pending approval; no send |
| Deployed parity | PASS | Exact safe fields and six business events matched; internal check exited zero |
| Report semantics | PASS | `waiting_for_approval`, `observed_only`, completed at `approval_pending` |
| Final Coolify state | PASS | Exact revision; `running:healthy`; auto deploy off; temporary hook empty |
| Guide commands | PASS | Current-target preflight and closed fixture report exited zero |
| Platform actions | PASS | Deploy, stop/start, replacement, recovery, secret, and health paths directly exercised |
| Handoff privacy | PASS | No target value, private ID, full draft, credential, raw log, or customer data |

Functional draft parity means one application-validated exact-lead draft bound
to one pending approval on both sides. Provider-selected prose and hashes were
not retained or compared.

## Repository Verification

| Gate | Result |
|------|--------|
| Biome format | 67 files, no fixes required |
| Biome lint | 67 files, no findings |
| Strict TypeScript | PASS |
| Deterministic tests | 374/374 pass |
| Production evals | 18/18 pass; 0 critical failures |
| Coverage | 97.88% lines; 86.29% branches; 98.43% functions |
| Dependency audit | 0 vulnerabilities |
| Incident drills | 5/5 pass |
| Release preflight | 15/15 ready; `targetMutationAllowed: false` |
| Markdown links | 248 files; 0 broken relative links |
| Secret/private value scan | 0 matches |
| ASCII/final LF | 336 files; 0 violations |
| Git whitespace | `git diff --check` pass |

`npm run verify` includes the production-agent skill's required explicit type,
test, and eval commands. The exact-base diff review is recorded in
`code-review.md`; the privacy and authority review is recorded in
`security-compliance.md`.

## Direct Release Evidence

- Local request: 24,831 ms, 6,038 input tokens, 486 output tokens, USD 0.04477.
- Deployed request: 10,768 ms; token and cost fields available but numeric
  values intentionally not extracted.
- Coolify deployment-plus-smoke: 63,364 ms.
- Recovery drill: failed deployment detected in 3,422 ms; source-pinned
  recovery completed in 67,550 ms.
- Restore: 227 ms; restore plus start-to-health 1,486 ms.

## Remaining Limits

The controlled synthetic workshop does not prove public caller identity,
tenancy, real-data governance, public human decisions, real effects,
multi-replica persistence, automated/geographic backup, destructive live
restore, external on-call delivery, stable access from every operator network,
or post-recovery digest reinspection on the current Coolify version.

## Verdict

Session 08 and Task `07` meet the controlled workshop acceptance boundary and
are ready for version/PRD closeout. Phase 04 remains unbuilt.
