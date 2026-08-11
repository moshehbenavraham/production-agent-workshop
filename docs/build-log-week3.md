# Build Log - Week 3

[Week 1](build-log-week1.md) |
[Week 2](build-log-week2.md) |
[Week 3](build-log-week3.md) |
[Week 4](build-log-week4.md)

> Template only. This log is reserved for observable evidence from Tasks 04
> and 05. Replace each italic instruction after running the named work; never
> present planned behavior as an implemented control.

## Task 04 - Recover and Replay

Task contract: [04 - Recover and Replay](todo/04-recovery-and-replay.md)

### Goal and Boundary

Session 01 establishes trusted durable run history only. Closed versioned
events and the hardened JSONL adapter are implemented; run projection,
checkpoint selection, whole-run bounds, replay, and resume remain assigned to
Sessions 02-04 and are not claimed here.

Operational events own recorded run history. They do not authorize an approval
or prove a fake effect: the dedicated approval and fake-result stores remain
the exact permission and idempotency authorities.

### Event Schema

`src/run-event.ts` owns the version 1 envelope:

| Field | Contract |
|-------|----------|
| `schemaVersion` | Exact literal `1` |
| `eventId` | Prefixed bounded `event_*` identity |
| `runId` | Existing bounded `run_*` or UUID identity |
| `at` | Canonical millisecond UTC ISO timestamp |
| `type` | Bounded code exactly matching `data.eventType` |
| `data` | One closed minimized owned payload variant |
| `metadata` | Closed actor, action, tool, argument, result, error, approval, stop, version, duration, retry, token, and cost fields |

Metadata uses `null` for unavailable values, so measured zero duration, retry,
tokens, or cost is not confused with missing provider evidence. Token totals
must equal input plus output. Validated arguments permit at most 20 bounded
scalar fields and reject nested arbitrary content.

Current payload variants cover `run.started`, `run.completed`, `run.failed`,
qualification attempt/completion/failure, `domain.follow_up_drafted`, normalized
`pi.lifecycle`, all closed approval events, and all closed fake-send events.
Pi SDK objects are reduced to bounded source type, tool name and call identity,
error flag, message identity, and stop reason; raw SDK payloads are rejected.

Example minimized record:

```json
{"schemaVersion":1,"eventId":"event_example_001","runId":"run_example_001","at":"2026-08-11T16:00:00.000Z","type":"run.started","data":{"eventType":"run.started","leadId":"lead_ada"},"metadata":{"actor":{"kind":"application","id":null},"action":"run_start","tool":null,"validatedArguments":null,"result":"attempted","errorCode":null,"approvalState":null,"stopReason":null,"applicationVersion":"0.1.22","modelVersion":null,"promptVersion":null,"durationMs":null,"retryCount":0,"tokens":null,"costUsd":null}}
```

#### Storage Contract

`JsonlEventStore` validates configuration and generated metadata before
filesystem construction. Append then validates the complete existing log,
denies duplicate identity or decreasing per-run time, opens with private mode,
writes one LF-terminated record, calls `fsync`, closes, re-reads the entire
file, and compares exact before/after state before reporting success.

Reads validate every line, event, namespace, identity, and timestamp before
filtering by `runId`. A missing file is an exact empty history; blank,
truncated, malformed, duplicate, or out-of-order evidence returns canonical
`corrupt_record`, `interrupted_write`, `duplicate_event`, or
`out_of_order_record` failure. Pre-write I/O and replaceable-boundary failures
use canonical `storage_failure`; indeterminate write, flush, close, or re-read
failures use canonical `interrupted_write`.

Compatibility decision: the existing `at` field remains the timestamp name and
file order remains the structural order for the current single-process store.
Session 02 owns domain-semantic event order and recovery checkpoints. Existing
legacy unversioned event files fail closed rather than being silently upgraded;
the workshop uses synthetic data and must reset or explicitly migrate such a
file before startup.

Focused evidence: strict file checks pass and 19/19 event contract/store tests
cover closed variants, restart, private mode, corruption, truncation, duplicate
identity, decreasing time, no-op writes, and injected write/sync/close/read
failures.

### Projection Rules

`src/run-projection.ts` is a pure, read-only projector over one complete
validated run history. It clones external input before validation, folds legal
transitions in file order, and returns either one deeply frozen projection or a
canonical redacted failure. It performs no store write, tool call, approval
transition, fake effect, model invocation, or network operation.

```mermaid
flowchart LR
    E[Complete validated events] --> F[Deterministic transition fold]
    A[Approval records] --> C[Exact authority cross-check]
    R[Fake-result projections] --> C
    F --> C
    C -->|identities agree| P[Frozen run projection]
    F -->|missing or conflicting evidence| X[Canonical refusal]
    C -->|authority absent or mismatched| X
```

The legal core order is one `run.started`, one qualification attempt and
optional outcome, one successful-qualification-dependent draft, one
draft-dependent approval request, and one compatible run terminal. Normalized
Pi events may occur before the run terminal but cannot create a checkpoint.
After the run terminal, only approval decision/failure observations and
fake-send observations may extend the history; a second terminal or new run,
qualification, draft, approval-request, or Pi event fails closed.

| Durable milestone | Latest safe checkpoint | Required exact facts |
|-------------------|------------------------|----------------------|
| Run start | `run_started` | Event, run, and lead identity |
| Qualification success | `qualification_completed` | Attempt plus result for the started lead |
| Draft creation | `draft_created` | Qualified lead, draft identity, and SHA-256 |
| Approval request | `approval_requested` | Run, lead, draft, action, and approval identity |

An open qualification attempt remains visible while the checkpoint stays at
run start. An attempted fake effect remains `effect_indeterminate`; the
projector does not infer whether a side effect occurred. Run status is closed
to `running`, `waiting_for_approval`, `approved`, `effect_indeterminate`,
`completed`, `stopped`, or `failed`, while the agent terminal outcome remains a
separate durable fact.

Operational approval and fake-send events expose only observed status. When
dedicated evidence is omitted, the projection reports `not_supplied`. When it
is supplied, the projector validates every record and checks exact run, lead,
draft, hash, approval, idempotency, result status, and result duration. Missing,
extra, invalid, or mismatched dedicated evidence returns `authority_mismatch`
or `invalid_input`; no event grants approval or proves an effect. An observed
approval or accepted fake result cannot elevate the trusted lifecycle to
`approved` or effect-complete without matching dedicated truth; it remains
waiting or indeterminate.

Replaceable working context contains only qualification result or failure,
draft identity and hash, approval identity and observed state, fake-send
identity and observed state, checkpoint, terminal, and event identities. It
contains no transcript, full draft, lead profile, credential, raw Pi payload,
or arbitrary dependency message. Rebuilding context never deletes or mutates
the source events.

Canonical refusal codes cover invalid input, missing start, cross-run identity,
out-of-order events, missing prerequisites, duplicate evidence, conflicting
evidence, incompatible terminals, authority mismatch, structurally corrupt or
interrupted durable history, and storage failure. Failures expose only a stable
message plus a safe event index and identity when available; partial
projections are never returned.

Focused evidence: 22/22 projection cases pass. They cover every checkpoint,
open attempts, qualification refusal, run failure, legal post-run approval and
fake evidence, replay duplicates, exact authority checks, missing and malformed
evidence, lead-bound not-found refusal, cross-run and ordering refusal, repeated
milestones, terminal compatibility, mutation resistance, malformed or throwing
adapters, structural store-failure mapping, and deep equality across fresh
`JsonlEventStore` instances. Projection exists; retry, replay execution, and
resume remain assigned to Session 04.

### Recovery Decision Table

_Map each interruption or failure to retry, resume, compensate, escalate, or
stop, including the evidence required before the action._

### Three Restart Timelines

_Add three Mermaid timelines for interruption after qualification, draft, and
approval request, with the observed resumed outcome._

### Replay-Idempotency Proof

_Record exact replay commands and evidence that repeated events or requests do
not duplicate approvals or external effects._

### Retention Decision

_Record event retention, redaction, deletion, compaction, and audit rules before
using real customer data._

### Exercised Failure and Recovery

_Record a corrupt, incomplete, timeout, or maximum-step case and its visible,
operator-actionable recovery or stop._

### Verification Output

_Record the exact verification commands and results, including
`npm run verify`._

### Final Diff Review and Remaining Risk

_Record the permissions, privacy, event, replay, side-effect, and documentation
diff review plus unresolved recovery risks._

## Task 05 - Add Production Eval Gates

Task contract: [05 - Add Production Eval Gates](todo/05-production-evals.md)

### Goal and Boundary

_State which client-brief behaviors now block deployment and which quality
measures remain non-blocking._

### Golden-Set Inventory

_List the synthetic happy, ambiguous, failure, adversarial, duplicate, restart,
and human-escalation cases with expected outcomes and event sequences._

### Rubric

_Record critical pass/fail dimensions, separate quality metrics, thresholds,
version fields, and explicit pending latency or cost thresholds._

### Scorecard

_Record the compact reproducible result by case, expected versus observed
evidence, tool sequence, stop reason, latency, cost, and version._

### Critical Red/Fix/Green Traces

_Record one controlled red/fix/green trace for every critical boundary,
including lead fabrication, false-send wording, and approval bypass, and prove
each deliberate break was reverted._

### Exercised Failure and Refusal

_Record a critical failure exiting non-zero and blocking the documented
deployment path regardless of aggregate quality._

### Verification Output

_Record the exact final verification commands and results, including
`npm run verify`._

### Final Diff Review and Remaining Risk

_Record the eval, permission, privacy, side-effect, deliberate-break, and
documentation diff review plus uncovered cases or pending thresholds._
