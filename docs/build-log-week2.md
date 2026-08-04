# Build Log - Week 2

[Week 1](build-log-week1.md) |
[Week 2](build-log-week2.md) |
[Week 3](build-log-week3.md) |
[Week 4](build-log-week4.md)

> Template only. This log is reserved for observable evidence from Tasks 02
> and 03. Replace each italic instruction after running the named work; never
> present planned behavior as an implemented control.

## Task 02 - Make Approvals Durable

Task contract: [02 - Make Approvals Durable](todo/02-durable-approvals.md)

### Goal and Boundary

_State the implemented durable-approval boundary and what remains outside it._

### Approval State Diagram

_Add a source-backed Mermaid diagram for pending, approved, and declined states,
plus invalid, duplicate, and storage-failure refusal paths._

### Storage Contract

_Record the approval schema, store interface, file-backed implementation,
projection ownership, exact persisted fields, and failure behavior._

### Transition Event Examples

_Add minimized synthetic examples for request, approval, decline, duplicate,
invalid, and storage-failure events under the original `runId`._

### Restart Proof

_Record the exact command and observed evidence proving pending and decided
approvals survive restart and rebuild to the same projection._

### Data-Lifecycle Decision

_Record retention, redaction, export, deletion, actor-data, and draft-data
decisions without adding real personal data._

### Exercised Failure and Recovery

_Record at least one required failure, its visible outcome, and the safe
recovery or refusal without manually editing durable state._

### Verification Output

_Record the exact verification commands and results, including
`npm run verify`._

### Final Diff Review and Remaining Risk

_Record the permissions, privacy, side-effect, persistence, and documentation
diff review plus unresolved approval risks._

## Task 03 - Add an Idempotent Send Boundary

Task contract: [03 - Add an Idempotent Send Boundary](todo/03-idempotent-send.md)

### Goal and Boundary

_State the implemented fake-write boundary and confirm that no real provider
credential or network send was added._

### Write Contract

_Record the typed input/output, timeout, error codes, approval rule, immutable
target/content resolution, structured evidence, and compensation decision._

### Permission Table

_Classify approved, pending, declined, missing, malformed, mismatched,
duplicate, timed-out, permission-denied, and downstream-failure actions._

### Idempotency Proof

_Record the stable key derivation, first persisted result, duplicate command,
and evidence that a repeat produces no second effect._

### Test Matrix

_Map every required success and failure case to deterministic tests and source._

### Redacted Event Examples

_Add minimized attempt and result examples containing `runId`, `approvalId`,
idempotency key, duration, and outcome without a full draft or personal data._

### Human Review Result

_Record the reviewer role, reviewed boundary, decision, follow-up findings, and
proof that allowlisting happened only after review._

### Exercised Failure and Recovery

_Record at least one denied or failed write, its actionable output, and the safe
retry, compensation, escalation, or stop behavior._

### Verification Output

_Record the exact verification commands and results, including
`npm run verify`._

### Final Diff Review and Remaining Risk

_Record the permissions, credentials, personal-data, side-effect, idempotency,
and documentation diff review plus unresolved write risks._
