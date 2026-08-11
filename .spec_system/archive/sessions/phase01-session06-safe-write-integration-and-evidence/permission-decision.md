# Permission And Allowlist Decision

**Session ID**: `phase01-session06-safe-write-integration-and-evidence`
**Recorded**: 2026-08-04
**Capability**: Internal deterministic `fake_send`
**Decision**: KEEP EXCLUDED

## Decision

| Question | Decision |
|----------|----------|
| Is a fake-send Pi tool registered? | No |
| Is fake-send production-allowlisted? | No |
| Is there an HTTP fake/write route? | No |
| Is there a real/network adapter? | No |
| Was human review performed in this autonomous session? | No - not claimed |
| Who must review before any future change? | Repository maintainer |
| May registration/allowlisting change before that review is recorded? | No |

The machine-readable source decision is the frozen
`SAFE_WRITE_PERMISSION_DECISION` in `src/safe-write-application.ts`. Direct
tests require `piToolRegistered` and `productionAllowlisted` to remain false and
compare the production allowlist to its exact three existing tools.

## Internal Contract Reviewed By The AI Workflow

- Input is an identity-only fake-send request: approval, run, actor, action,
  exact lead target, and draft ID.
- Executable target and content resolve only from the exact approved durable
  record; caller/model free text cannot supply them.
- Execution actor permission, approval state/identity, and durable reservation
  precede the in-process fake effect.
- Terminal results are accepted, rejected, timed out, or downstream failure;
  completed duplicates return the exact original and incomplete reservations
  stop as indeterminate.
- Operational fake-send evidence excludes full draft, target lead ID, raw
  dependency detail, credentials, and provider response.
- Automatic compensation, multi-process safety, and automatic indeterminate
  retry are unsupported and explicitly visible.

This is AI implementation and workflow review evidence. It is not a human
approval and cannot satisfy a future request to expose the capability.

## Production Surface Proof

The production Pi tool list remains frozen at:

1. `qualify_lead`
2. `draft_follow_up`
3. `request_send_approval`

`src/pi-agent.ts` and `src/server.ts` do not import
`src/safe-write-application.ts`, `src/fake-send-service.ts`, or a fake-write tool.
The HTTP runtime still exposes only `GET /health` and `POST /runs`, and the Pi
prompt still requires stopping at pending approval.

## Required Future Human Gate

Before any fake or real write-capable tool is registered or allowlisted, the
repository maintainer must review and record:

1. the exact closed tool input/output and actor-authentication contract;
2. the complete diff and resulting Pi/HTTP/runtime capability graph;
3. exact target/content resolution and idempotency evidence;
4. provider/network, credential, tenant, retention, recovery, and incident
   controls appropriate to the proposed environment;
5. deterministic success/refusal/timeout/duplicate/downstream tests and the
   deployment rollback plan.

Until that separate review and authorization exists, `KEEP EXCLUDED` is final
for Phase 01.

## Workflow Status

- Implementation evidence: complete.
- AI `creview`: complete; 2 Medium and 2 Low findings resolved.
- Independent `validate`: complete; security/privacy and strict production
  exclusion pass.
- Apex `updateprd`: complete; Phase 01 closed with the capability excluded.
- Human permission review: not performed; required only before a future
  registration or allowlist change.
