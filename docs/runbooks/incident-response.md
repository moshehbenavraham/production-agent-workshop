# Incident Response

## Current Scope

This runbook covers the implemented local or otherwise controlled synthetic-
data service, its internal fake-write and recovery test boundaries, and its
offline JSONL snapshot/restore command. It does not claim a production on-call
rotation, response-time SLA, automated pause, public or distributed recovery,
off-server backup schedule, platform restore, or rollback capability.

## First Response

1. Stop new `/runs` requests by restricting access or stopping the process or
   container. There is no application pause endpoint.
2. Do not retry a failed run automatically. The internal recovery library may
   be invoked only after preserving all files and confirming a supported exact
   checkpoint; there is no HTTP/Pi/operator transport or background worker.
3. Preserve the configured event and approval files, any injected fake-result
   file, and the reported `runId` before changing runtime state. Do not manually
   edit durable records.
4. Keep credentials, provider auth state, and full event contents out of chat,
   tickets, screenshots, and public logs.
5. If a controlled snapshot is required, stop every service and harness writer
   first and use the repository command with explicit stopped-writer
   confirmation. Never snapshot a live append-only file.

## Triage

### Check Service Health

```bash
curl --fail http://127.0.0.1:3000/health
```

An HTTP 200 body of `{"status":"ok"}` proves only process-level health. It
does not prove provider access, persistence, approval durability, or recovery.

### Check The Repository Gate

```bash
npm run verify
npm audit --audit-level=low
```

This separates deterministic code or dependency failures from provider and
environment failures.

### Trace One Run

Events are newline-delimited JSON at `EVENT_LOG_PATH`, defaulting to
`./data/events.jsonl`. Filter a preserved copy for the exact `runId` and read
records in file order. Expected evidence can include:

- `run.started`;
- `qualification.attempted` and one qualification terminal;
- `domain.follow_up_drafted` only after qualification success;
- `approval.requested` with `status: pending` only after matching success;
- `run.completed` with a finite domain stop reason, `run.stopped` with
  `deadline_exceeded`, `step_limit_exceeded`, or `dependency_failed`, or legacy
  `run.failed` evidence.

Missing, malformed, cross-lead, duplicated, or out-of-order evidence must be
treated as a visible failure, never repaired by inference.

## Failure Guide

| Symptom | Current interpretation | Safe action |
|---------|------------------------|-------------|
| `/health` fails | Process or container is unavailable | Inspect process/container logs; restart only after preserving evidence |
| Qualification returns `lead_not_found` | Exact synthetic lead is absent | Stop; do not draft or request approval |
| Qualification returns lookup failure or timeout | Bounded read did not complete | Preserve `runId`; investigate dependency or deadline; do not infer success |
| Run returns `deadline_exceeded` | Whole-run application deadline won the terminal race | Preserve the run events; inspect the last step/open tool; do not trust late provider output |
| Run returns `step_limit_exceeded` | The configured model/tool start budget was reached | Preserve the run events; inspect step sequence; do not raise the bound without measured review |
| Run returns `dependency_failed` | Session, prompt, lifecycle evidence, or application post-processing failed | Preserve exact durable evidence; inspect the canonical boundary; do not infer qualification or approval success |
| HTTP returns `agent_run_failed` | Pi run threw; response may omit `runId` | Inspect controlled server/event evidence; do not report completion |
| HTTP returns `rate_limited` | The current process window exhausted before body parsing or Pi work | Honor `Retry-After`; investigate traffic/capacity; do not bypass the gate or infer a run started |
| Approval remains pending | Human decision is required | Do not send; no decision endpoint exists |
| Internal fake execution returns `execution_in_progress` | A durable reservation exists and the effect state may be indeterminate | Preserve approval, event, and result files; do not retry automatically; escalate for human inspection |
| Internal fake completion storage fails | The in-process adapter may have run but no durable terminal result proves its outcome | Stop; preserve all three files; do not delete the reservation or claim completion |
| Recovery returns `draft_required` or `draft_mismatch` | Replaceable content is absent or does not match the durable draft SHA-256 | Preserve evidence; supply only the exact known synthetic draft or escalate; never substitute content |
| Recovery returns `effect_indeterminate` | Same-run reservation-only or ambiguous effect evidence exists | Escalate; do not request another approval, execute, retry, compensate, or edit records |
| Recovery returns `effect_completed` | Dedicated result truth proves the fake action already completed | Stop; return to the exact result/approval evidence and never execute again |
| Recovery returns structural/authority mismatch | Complete stores do not agree on identity, order, or state | Preserve the coordinated files and escalate; do not repair by inference |
| Event file is malformed or truncated | Durable truth is unreliable | Preserve the file and escalate; do not edit or replay manually |
| Snapshot or restore reports a manifest/checksum mismatch | Backup evidence is untrusted or damaged | Preserve source and snapshot separately; do not activate, overwrite, or repair either by inference |
| Credential may be exposed | Potential security incident | Stop use, preserve minimal evidence, rotate through the provider, report privately |

## Recovery Limits

The HTTP/Pi service cannot accept approval decisions or invoke recovery. The
internal recovery library can resume only a trusted qualification, draft, or
approval-request prefix to the pending human gate; it never decides approval or
calls an effect adapter. There is no authenticated operator transport,
distributed lock, automatic retry for an indeterminate reservation, or
compensation path. The offline restore command verifies bytes into an absent
directory only; it is not a production restore or activation workflow. The
fake adapter performs no network effect and no effect tool is registered or
allowlisted. Escalate rather than inventing recovery state or manually editing
JSONL.

## Escalation And Reporting

- Use [SECURITY.md](../../SECURITY.md) for a suspected vulnerability or secret exposure.
- Use the [weekly Build Logs](../todo/README_todo.md#build-logs) for reproducible
  workshop evidence that contains no credential or unnecessary personal data.
- Record the exact revision, environment category, `runId` when available,
  observed stop reason, failed command, and redacted error category.
- Production response ownership and timing remain external decisions until the
  operations phase establishes them.
