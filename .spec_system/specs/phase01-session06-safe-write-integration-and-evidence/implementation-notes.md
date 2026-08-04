# Implementation Notes

**Session ID**: `phase01-session06-safe-write-integration-and-evidence`
**Implemented**: 2026-08-04
**Base Commit**: ae4af5aff10894095eb5043249be4e352e16ac84
**Result**: READY FOR CODE REVIEW

## Scope Delivered

Added one Pi/HTTP-independent `SafeWriteApplication` that composes the actual
file-backed approval, event, and fake-result adapters with the existing
approval service, exact-action authorizer, reservation-first fake-send service,
and deterministic in-process adapter. It delegates application operations
without duplicating domain policy and snapshots approval/execution actor sets at
construction.

The production decision is frozen and explicit: fake-send is not registered as
a Pi tool and is not production-allowlisted. No human review is claimed. A
repository maintainer must review a future exact contract and diff before
either value can change.

## RED / GREEN Evidence

1. Added the nine-test complete Task `03` matrix in
   `tests/safe-write-application.test.ts` before the composition module.
2. RED failed with `ERR_MODULE_NOT_FOUND` for
   `src/safe-write-application.js`.
3. Implemented closed paths/options, actor snapshots, frozen permission
   decision, shared stores, and delegated approval/execution methods.
4. Initial GREEN passed 8/9 cases and exposed an integration defect: duplicate
   recovery rejected valid approval events sharing the same run event log.
5. Repaired the fake-send reader to validate all generic event envelopes,
   select only the fake-send namespace, and fail closed if either discriminant
   makes a malformed fake-send claim.
6. Added the direct malformed-namespace assertion; 9/9 application tests and
   the combined 24/24 service/application gate pass.
7. The complete Task `03` contract/store/service/application gate passes 56/56.
8. Repository verification passes 149/149 tests and 5/5 evals; dependency audit
   reports zero vulnerabilities.

## Internal Composition

`SafeWriteApplication` requires exact non-empty approval, event, and result
paths plus explicit approval and execution actor sets. It constructs:

1. one shared `JsonlEventStore`;
2. one `FileApprovalStore` shared by `ApprovalService` and
   `FakeSendAuthorizer`;
3. one `FileFakeSendResultStore`;
4. one `FakeSendService` using the shared events, exact authorizer, result
   store, and injected or deterministic fake adapter.

The application exposes only internal TypeScript methods for request, decision,
approval read/list, and fake execution. `src/pi-agent.ts` and `src/server.ts`
have no import or route/tool edge to it.

## Required Path Evidence

| Task `03` path | Observed result | Adapter effects |
|----------------|-----------------|-----------------|
| Valid approved action | Two approval lines, two result lines, accepted event/result | 1 |
| Missing required input | `invalid_request`; no result file | 0 |
| Target mismatch | `approval_identity_mismatch`; no result file | 0 |
| Pending approval | `approval_pending`; no result file | 0 |
| Declined approval | `approval_declined`; no result file | 0 |
| Timeout | Abort plus durable `timed_out` result/event | 1 |
| Duplicate/restart | Deep-equal original, unchanged two result lines | 0 additional |
| Permission denied | Minimized denial event; no result file | 0 |
| Downstream failure | Durable canonical result/event without raw detail | 1 |
| Rejected adapter | Durable exact `rejected` result/event | 1 |

Actor-set mutation after construction cannot grant approval or execution.
Shared logs accept valid approval-domain events; malformed events claiming the
fake-send namespace make duplicate recovery fail with canonical storage error
and zero additional effects.

## Permission And Human Gate

`SAFE_WRITE_PERMISSION_DECISION` is frozen with:

- `piToolRegistered: false`;
- `productionAllowlisted: false`;
- `humanReviewStatus: "not_performed"`;
- `requiredReviewer: "repository_maintainer"`;
- `humanReviewRequiredBeforeChange: true`.

The exact production allowlist remains `qualify_lead`, `draft_follow_up`, and
`request_send_approval`. The separate permission decision report records the
contract, source/runtime proof, and future human-review checklist. AI workflow
review is never labeled as human approval.

## Files

| File | Change |
|------|--------|
| `src/safe-write-application.ts` | Added internal composition and frozen production exclusion decision |
| `src/fake-send-service.ts` | Made fake-event recovery domain-aware on the shared run event log |
| `tests/safe-write-application.test.ts` | Added nine file-backed required-path, evidence, restart, permission, and namespace tests |
| `permission-decision.md` | Recorded no-registration/no-allowlist decision and conditional human gate |
| `docs/build-log-week2.md` | Completed Task `03` composition, matrix, proof, review status, and final evidence |
| README and supporting docs | Updated current architecture, safe development/environment use, counts, tracking, and changelog |

## Verify Production Agent Skill Ledger

| Required action | Result |
|-----------------|--------|
| Read `AGENTS.md` and active Task `03` | PASS - exact scope and conditional HITL rule retained |
| `npm run check` | PASS - strict TypeScript |
| `npm test` | PASS - 149/149 |
| `npm run eval` | PASS - 5/5 |
| Behavior regression | PASS - nine new deterministic integration tests plus shared-log repair assertion |
| External-side-effect review | PASS - deterministic in-process fake only; no network/process/provider primitive |
| Tool/process permission review | PASS - exact frozen three-tool allowlist unchanged; composition absent from Pi/server |
| Secret/personal-data review | PASS - no credential marker; synthetic fixtures only; fake events omit draft and lead target |
| Evidence/completion review | PASS - run/approval/key/status correlation and false-completion denials directly asserted |

## Verification Ledger

| Check | Result |
|-------|--------|
| Focused application suite | PASS - 9/9 |
| Complete Task `03` gate | PASS - 56/56 |
| `npm run verify` | PASS - format/types, 149/149 tests, 5/5 evals |
| `npm audit --audit-level=low` | PASS - 0 vulnerabilities |
| Source module size | PASS - application 134 lines; fake-send service 493 lines |
| `git diff --check` | PASS |
| ASCII/LF and CR scans | PASS |
| Credential/private-key scan | PASS - no value found |
| Route/network/process/import scan | PASS - no capability or production edge added |
| Pi production allowlist | PASS - exact frozen three-tool list unchanged |
| Phase cutoff | PASS - no modified/untracked Phase 02 path or artifact |

## Remaining Risks And Review Focus

- Recheck constructor option mutation/aliasing and any unintended way to expose
  shared store/service instances.
- Recheck generic shared-event filtering so valid other domains are ignored but
  fake namespace corruption never disappears.
- Recheck all docs for any implication that the synthetic operator actor ID is
  authentication or that human review occurred.
- At-most-once remains one-process only; approval/event/result logs are not a
  transaction; reservation-only state requires manual inspection.
- Real data, public exposure, providers, network effects, automatic
  compensation, and Phase 02 work remain prohibited.

## Next Step

Run `creview`. Do not run `phasebuild` or create Phase 02 artifacts.
