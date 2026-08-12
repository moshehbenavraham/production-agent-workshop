# Validation Report

**Session ID**: `phase03-session06-coolify-deployment-health-and-persistence`
**Validated**: 2026-08-12
**Result**: PASS

## Validation Summary

| Check | Status | Notes |
|-------|--------|-------|
| Code Review | PASS | Exact-base review is `RESOLVED`; four documentation findings repaired |
| Tasks Complete | PASS | 14/14 tasks |
| Deliverables | PASS | Deployment, health, smoke, persistence, redacted preflight, and complete Apex records exist |
| Repository Gate | PASS | Format, lint, strict types, 374 tests, and 18 production evals |
| Coverage | PASS | 97.88% lines, 86.29% branches, 98.43% functions |
| Dependencies | PASS | Zero vulnerabilities; dependency and lockfile diff empty |
| Incident Drills | PASS | Five of five deterministic drills |
| Security And GDPR | PASS | Security PASS; GDPR N/A because all live data is synthetic |
| Privacy | PASS | No credential, private target value, operator name, run ID, or raw provider output is tracked |
| ASCII And Whitespace | PASS | ASCII scan and `git diff --check` pass |
| Public Production | OUT OF SCOPE | Controlled synthetic workshop release only |
| UI Product Surface | N/A | No rendered UI changed |

**Overall**: PASS

## Direct Runtime Evidence

| Requirement | Result | Evidence |
|-------------|--------|----------|
| Authorized Coolify boundary | PASS | API read, write, deploy, stop, and start permissions accepted for the selected application |
| Exact source | PASS | Running source matches reviewed revision `52df37a96a76afc1d82656ef04e0922aa42e9b16` |
| Immutable image | PASS | Redacted fixture records `sha256:f97d51eb0f7dfdc832f74b3700af1003a7fd6bd33fbfdd0a39d1aed111e599d1` |
| Runtime contract | PASS | One replica, port 3000, `/app/data`, exact JSONL paths, 30-second deadline, 24 steps, request and rate bounds |
| Controlled access | PASS | Authenticated HTTPS health 200; anonymous health and run requests 401 |
| Health and monitoring | PASS | Docker health and Sentinel are healthy |
| Provider secret | PASS | Runtime-only, build-time false; provider models and response checks returned 200 without value disclosure |
| Synthetic smoke | PASS | Known lead was grounded and stopped at `approval_pending` with canonical no-send output |
| Approval authority | PASS | Exactly one pending durable approval agrees with the run projection |
| Replacement persistence | PASS | Container changed; exact event and approval checksums and projected state did not |
| Redacted preflight | PASS | All 15 checks pass and target mutation remains impossible from the command |

## Success Criteria

### Functional Requirements

- [x] Coolify runs the exact verified source revision and recorded image.
- [x] Health, controlled access, provider credential presence, and monitoring pass direct checks.
- [x] One synthetic run ends at `approval_pending` with grounded qualification and no send claim.
- [x] Exact run events and pending approval survive full container replacement unchanged.

### Testing And Quality Gates

- [x] Complete verification, coverage, dependency audit, and incident drills pass.
- [x] Current-target release preflight passes all 15 closed checks.
- [x] No protected private value enters the repository evidence.
- [x] ASCII/LF and whitespace checks pass.

## Database And Schema Alignment

### Status: N/A

The session adds no database, migration, seed, or persisted record schema.
Existing direct JSONL event and approval data is read through current validated
stores and remains byte-identical across replacement.

## Remaining Risk

- The operator workstation TLS path remains unstable; target-side health and
  access behavior are verified from the VPS path.
- Restored-state activation and actual rollback are not yet proved.
- Local/deployed parity and final operator usability are not yet proved.
- Public access, multi-replica safety, real customer data, external alert
  delivery, and real effects remain unsupported.

## Conclusion

Session 06 is validated for the controlled, synthetic, single-replica workshop
boundary. It is ready for PRD closeout and Session 07 planning.
