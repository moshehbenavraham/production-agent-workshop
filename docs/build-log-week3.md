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

_State the implemented recovery boundary, durable source of truth, and
replaceable working context._

### Event Schema

_Record the closed event envelope, minimized payload contracts, version and
usage fields, terminal events, deadline, and maximum-step evidence._

### Projection Rules

_Record deterministic run and approval projections, ordering rules, corruption
handling, and the facts required to resume._

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
