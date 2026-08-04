# Build Log - Week 2

[Week 1](build-log-week1.md) |
[Week 2](build-log-week2.md) |
[Week 3](build-log-week3.md) |
[Week 4](build-log-week4.md)

> This log contains only observed evidence from Tasks 02 and 03. Sections that
> remain outside the current implementation say so explicitly; planned behavior
> is never presented as an implemented control.

## Task 02 - Make Approvals Durable

Task contract: [02 - Make Approvals Durable](todo/02-durable-approvals.md)

### Goal and Boundary

`src/approval.ts` owns the closed, Pi-independent approval record and pure
decision transition boundary. One pending record binds a stable `approvalId` to
the original `runId`, exact `send_follow_up` action, exact lead target, immutable
synthetic draft ID/content/SHA-256, request time, and null decision. Approved and
declined are mutually exclusive terminal variants with minimized actor ID and
decision time.

`src/approval-service.ts` now integrates this domain with the replaceable file
store and minimized operational events. Pi can request the exact current draft
but has no approve/decline operation; decisions remain internal application
calls. There is still no public decision endpoint or external effect.

### Approval State Diagram

```mermaid
stateDiagram-v2
    [*] --> Pending: createPendingApproval(valid exact input)
    [*] --> Refused: invalid request
    Pending --> Approved: authorized approved decision
    Pending --> Declined: authorized declined decision
    Pending --> Refused: malformed / missing / identity mismatch / unknown actor
    Approved --> Approved: duplicate returns original state
    Declined --> Declined: duplicate returns original state
    Approved --> Refused: conflicting decline returns original approved state
    Declined --> Refused: conflicting approval returns original declined state
    Pending --> StorageFailure: approval or event storage failure
    StorageFailure --> [*]: visible typed failure, no inferred state
    Approved --> [*]
    Declined --> [*]
    Refused --> [*]
```

Source: `ApprovalRecordSchema`, `createPendingApproval`, and
`transitionApproval` in `src/approval.ts`; `FileApprovalStore`; and
`ApprovalService`, exercised by approval domain/store/service and tool tests.

### Storage Contract

The schema separates three closed variants: pending, approved, and declined.
Each record retains only synthetic approval/run/action/target/draft linkage,
request time, status, and minimized decision metadata. Draft identity is linked
to content with an application-owned SHA-256 and revalidated at every untrusted
record crossing.

The replaceable `ApprovalStore` contract exposes `appendRequest`,
`appendDecision`, `get`, and `listRun`, each returning a discriminated typed
outcome. `ApprovalStorageRecordSchema` permits only one pending request record
or one matching approved/declined decision record.

`FileApprovalStore` in `src/approval-store.ts` stores one closed record per LF-
terminated JSONL line at its injected path. A request line retains the exact
pending record; a decision line retains only record identity, recording time,
approval/run identity, and minimized decision metadata. The adapter opens in
append mode, writes one complete line, calls `fsync`, closes in `finally`, and
rebuilds from disk before returning success. It holds no authoritative current-
state cache. Runtime composition selects `APPROVAL_LOG_PATH`, defaulting to
`./data/approvals.jsonl` locally and `/app/data/approvals.jsonl` in the image.

### Transition Event Examples

The closed `ApprovalEventDataSchema` permits minimized synthetic data such as:

```json
{"eventType":"approval.requested","approvalId":"approval_test_001","action":"send_follow_up","targetKind":"lead","leadId":"lead_ada","draftId":"draft_test_001","status":"pending"}
{"eventType":"approval.approved","approvalId":"approval_test_001","actorId":"actor_reviewer","status":"approved"}
{"eventType":"approval.decision_duplicate","approvalId":"approval_test_001","actorId":"actor_reviewer","requestedDecision":"approved","status":"approved"}
{"eventType":"approval.invalid","approvalId":"approval_test_001","operation":"decision","code":"unknown_actor"}
{"eventType":"approval.storage_failed","approvalId":"approval_test_001","operation":"decision","code":"storage_failure"}
```

The surrounding `AgentEvent` supplies the original `runId`; full draft content,
credentials, raw exceptions, and unrelated lead data are rejected as extra
event properties. `ApprovalService` emits these events after authoritative state
mutation and recovers a missing request/terminal event from durable state on a
retry without appending another transition.

### Restart Proof

Command:

```bash
node --import tsx --test tests/approval-store.test.ts
```

Observed result: 13/13 adapter tests pass. A first store appends pending then
terminal records; separately constructed instances read the same file and rebuild exact
pending, approved, and declined objects. The tests also inspect durable line
counts: one request plus one terminal decision remains exactly two lines after
an identical retry. The 11-test service suite and cross-layer tool test construct
new service/store instances for pending and terminal views and preserve the same
two-line result. No raw conversation or in-memory cache grants state.

### Data-Lifecycle Decision

Current scope is synthetic only. A request line retains storage record ID/time,
approval/run/action, target kind/lead ID, draft ID/SHA-256/full content, pending
status, request time, and null decision. A terminal line retains storage record
ID/time, approval/run identity, actor ID, decision, and decision time.
Operational qualification/draft/approval events contain only the identifiers,
hashes, finite states, and canonical error codes defined by their schemas.

- **Retention**: keep synthetic approval/event files for at most 30 days or
  until environment teardown, whichever occurs first. This is a manual rule;
  no expiry scheduler exists.
- **Redaction**: never edit append-only lines in place. Share minimized event
  evidence by default; the approval file remains restricted because it contains
  the exact synthetic draft.
- **Export**: only an authorized operator may make a controlled offline copy of
  the exact configured files while the service is stopped. There is no public
  export API.
- **Deletion**: stop the service and delete the whole exact synthetic data file
  during reset/expiry, then verify it is absent. Individual-record erasure is
  unsupported because it would break append-only evidence.

There is no backup/restore drill, per-record erasure, consent, tenant, or real-
data governance. Real personal/customer data remains prohibited until those
controls are designed and validated.

### Exercised Failure and Recovery

| Case | Deterministic Outcome | State Effect |
|------|-----------------------|--------------|
| Missing approval | `approval_not_found` | None |
| Malformed decision | `invalid_decision` | None |
| Unknown actor | `unknown_actor` | None |
| Duplicate request | `duplicate_request` | No second request line |
| Run or approval mismatch | `approval_identity_mismatch` | None |
| Same terminal decision | `duplicate` + original terminal record | None |
| Opposite terminal decision | `conflict` + original terminal record | None |
| Invalid current record | `invalid_approval_record` | None |
| Storage failure | `storage_failure` plus minimized correlated event when writable | No success may be inferred |
| Event outage after state append | `storage_failure`; retry repairs missing minimized event | No second state line |

The pure transition tests exercise domain refusals without editing state. The
file-store suite additionally writes invalid JSON, malformed schema data, and a
truncated non-LF record. Reads return `corrupt_record` or `interrupted_write`
with no projection. Injected writer failure returns redacted `storage_failure`;
a new store lookup proves no in-memory approval was created. Recovery is to
repair the storage source through a later operator workflow, never to skip or
silently truncate damaged evidence.

The application-service suite additionally injects approval/event read/write,
ID, and clock failures. A durable state append followed by an event outage
returns visible failure; retry restores the missing minimized event from the
record and preserves the one-request/one-decision line count. Unknown actors,
malformed inputs, missing approvals, duplicates, and conflicts append no state.

### Verification Output

Session 01 contract and Session 02 storage verification under Node.js 24.15.0
and npm 12.0.2:

- `node --import tsx --test tests/approval.test.ts` - 17/17 focused tests pass.
- `npm run verify` - formatting and strict types pass, 57/57 deterministic
  tests pass, and 5/5 deterministic evals pass.
- `npm audit --audit-level=low` - 0 vulnerabilities.
- Targeted permission, credential, ASCII/LF, and `git diff --check` scans pass.
- `npx tsx --test tests/approval-store.test.ts` - 13/13 focused adapter and
  restart tests pass.
- Session 02 `npm run verify` - formatting and strict types pass, 70/70
  deterministic tests pass, and 5/5 deterministic evals pass.
- `npx tsx --test tests/approval-service.test.ts` - 11/11 service tests pass.
- Selected service/tool/Pi integration gate - 39/39 tests and strict types pass.
- Session 03 `npm run verify` - formatting and strict types pass, 86/86
  deterministic tests pass, and 5/5 deterministic evals pass.
- Session 03 `npm audit --audit-level=low` - 0 vulnerabilities; targeted
  credential, network/process, data, Pi/HTTP permission, and whitespace scans pass.
- Post-review Session 03 gate - 93/93 deterministic tests and 5/5 evals pass
  after runtime adapter validation, failure canonicalization, and ordering repairs.

### Final Diff Review and Remaining Risk

Sessions 01-03 add no Pi allowlist entry, HTTP decision route, provider
credential, network access, or external effect. Session 03 selects the
configured approval path, delegates exact requests to application state, keeps
decisions internal, minimizes events, and derives stop truth from projection.
Synthetic full draft content is confined to the approval record.

Remaining Task `02` risks are explicit: the adapter is single-process; audit and
state files do not share an atomic transaction; damaged-file repair is manual;
the 30-day retention rule is manual; and no per-record erasure, backup/restore,
public actor authentication, or tenant boundary exists. These restrictions keep
real data and public decision operations prohibited.

## Task 03 - Add an Idempotent Send Boundary

Task contract: [03 - Add an Idempotent Send Boundary](todo/03-idempotent-send.md)

### Goal and Boundary

`src/fake-send.ts` defines authorization and the future fake-adapter boundary;
`src/fake-send-result.ts` owns execution evidence and persistence contracts.
Only the deterministic `FakeSendAuthorizer` has application behavior. It has an
approval-store reference and actor policy, but deliberately has no adapter,
result store, event store, Pi, or HTTP dependency. Session 04 therefore cannot
perform even a fake effect.

A request contains bounded identity claims only: `approvalId`, `runId`, actor
ID, the single `send_follow_up` action, exact lead target, and `draftId`. It
contains no draft content, address, provider field, or arbitrary instruction.
The authorizer resolves all executable content and target data from one exact
schema-valid durable approved record.

```mermaid
flowchart LR
    R[Closed identity request] --> V{Schema valid?}
    V -->|No| I[invalid_request]
    V -->|Yes| P{Actor allowed?}
    P -->|No| D[permission_denied]
    P -->|Yes| S[Read durable approval]
    S --> A{Exact approved state?}
    A -->|No| F[Typed refusal; zero effects]
    A -->|Yes| C[Derive immutable command and stable key]
    C --> X[Future execution boundary - not called in Session 04]
```

No dependency, provider credential, Pi permission, public route, result write,
send event, subprocess, or network access was added.

### Write Contract

The closed future adapter accepts only a semantic `FakeSendCommand` and an
`AbortSignal`. The command contains exact approval/run linkage, the initiating
authorized actor, the one action, application-resolved lead target, exact
approved draft ID/content/SHA-256, decision time, and stable idempotency key.
Its runtime guard recomputes both the draft hash and key. The application owns a
1,000 ms deadline; adapters may return only accepted, rejected, or downstream-
failure outcomes. Timeout is an application result, never a late adapter claim.

The future reservation/result contract is append-only and at-most-once:

1. claim a durable reservation for the stable key;
2. invoke the fake adapter only after the claim;
3. persist exactly one terminal accepted, rejected, timed-out, or downstream-
   failure result tied to the reservation;
4. return the terminal original for later duplicates, or refuse an incomplete
   reservation as `execution_in_progress` without a second effect.

Results explicitly declare `{ "supported": false,
"code": "manual_review_required" }` compensation. Automatic rollback is not
claimed; a human must inspect durable evidence before corrective action. The
reservation/result store and evidence schemas are contracts only in Session 04;
Session 05 implements persistence and execution.

### Permission Table

Authorization precedence is schema, actor permission, safe durable lookup,
exact approval identity, approved status, then action/target/draft equality.

| Case | Session 04 result | Effect allowed |
|------|-------------------|----------------|
| Exact approved action + authorized actor | Exact derived command and stable key | Future boundary only; no Session 04 effect |
| Invalid or extra request field | `invalid_request` | No |
| Unauthorized actor | `permission_denied`; approval store is not read | No |
| Missing approval | `approval_not_found` | No |
| Pending approval | `approval_pending` | No |
| Declined approval | `approval_declined` | No |
| Cross-run/action/target/draft | `approval_identity_mismatch` | No |
| Malformed/corrupt approval evidence | `invalid_approval_record` | No |
| Throwing, malformed, or sensitive store failure | canonical `storage_failure` | No |
| Completed duplicate | Contract: original result + `duplicate` | No second effect; implemented in Session 05 |
| Reservation without terminal result | Contract: `execution_in_progress` | No second effect; implemented in Session 05 |
| Adapter timeout | Contract: `timed_out` | Deadline behavior implemented in Session 05 |
| Adapter rejection | Contract: `rejected` | Implemented in Session 05 |
| Adapter dependency failure | Contract: `downstream_failure` | Implemented in Session 05 |

### Idempotency Proof

`deriveFakeSendIdempotencyKey` hashes a length-delimited canonical sequence:
domain `fake-send`, version `v1`, approval ID, run ID, action, target kind/lead
ID, draft ID, and approved draft SHA-256. Caller content and initiating actor are
excluded. Tests lock the exact fixture key
`7f9fd848a017555d3aec333d08ac074718d7e2c0ac0a2f3a03c77dd6d77618c0`,
prove a second authorized actor derives the same key, and prove target changes
produce a different key.

Durable first-result and duplicate-effect proof is intentionally pending
Session 05. Session 04 defines and runtime-validates the reservation-first store
contract needed for that proof and does not claim persistence.

### Test Matrix

`tests/fake-send.test.ts` contains 15 deterministic contract/authorization
tests:

| Area | Covered behavior |
|------|------------------|
| Closed contracts | Request, command, canonical failures, adapter outcomes, events, reservation/result/store outcomes |
| Semantic integrity | Draft hash, stable key, timestamps/duration, receipt shape, compensation, reservation/result identity |
| Exact approved action | Application-derived command and one safe store lookup |
| Permission order | Invalid and unauthorized requests perform zero approval reads |
| Approval refusals | Missing, malformed, throwing, sensitive, pending, declined, cross-run, cross-target, and wrong-draft cases |
| Zero-effect proof | Denial matrix produces zero calls to a future-adapter spy |

Timeout, duplicate execution, and downstream-failure contracts are validated
here; their application execution paths remain Session 05 work.

### Redacted Event Examples

The closed future data schema accepts examples such as:

```json
{"eventType":"fake_send.attempted","approvalId":"approval_test_001","idempotencyKey":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}
{"eventType":"fake_send.accepted","approvalId":"approval_test_001","idempotencyKey":"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa","durationMs":25,"outcome":"accepted"}
{"eventType":"fake_send.permission_denied","approvalId":"approval_test_001","code":"permission_denied"}
```

The surrounding operational event supplies `runId`. Draft content, target
address, raw dependency response/error, and provider data are rejected. These
are contract examples, not emitted Session 04 events.

### Human Review Result

**Status: not triggered.** The production Pi allowlist remains exactly the three
Phase 00 tools and no write-capable tool exists. The required future reviewer
role is the repository maintainer responsible for production permissions. That
review must cover the final application service, tool contract, permission
diff, idempotency evidence, and failure behavior before any allowlist change.
Session 06 records the decision; this entry does not claim a human review.

### Exercised Failure and Recovery

Focused tests exercise every pre-effect denial. An unauthorized actor returns
canonical `permission_denied` before the approval store is read. Pending and
declined state return distinct actionable refusals. Malformed or throwing store
adapters return redacted typed failures. All denied cases leave the future-
adapter spy at zero calls.

No write recovery occurs yet. The defined safe behavior for a future incomplete
reservation is visible `execution_in_progress`, stop, and human inspection -
never an automatic second effect or claimed rollback.

### Verification Output

- Contract-first RED: focused test failed because `src/fake-send.ts` did not
  exist.
- GREEN: `npx tsx --test tests/fake-send.test.ts` - 15/15 tests pass.
- `npm run check` - strict TypeScript passes.
- `npm run verify` - formatting and strict types pass, 108/108 deterministic
  tests pass, and 5/5 evals pass.
- `npm audit --audit-level=low` - 0 vulnerabilities.
- Whitespace, ASCII/LF, credential, route, network/process, and exact production-
  allowlist scans pass.

### Final Diff Review and Remaining Risk

Current inspection confirms that Session 04 adds Pi-independent application
contracts and pure authorization only. There is no fake adapter implementation,
result file, event emission, Pi/HTTP integration, provider credential, real
network write, or real/personal data.

Remaining risk is deliberate and visible: reservation persistence, race/crash
behavior, timeout/late-result handling, duplicate original-result return, event
ordering, and adapter failure handling must be implemented and independently
reviewed in Session 05 before any integration claim.
