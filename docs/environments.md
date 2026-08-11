# Environments

## Current Environment Matrix

| Environment | URL | Purpose | Status |
|-------------|-----|---------|--------|
| Local development | `http://127.0.0.1:3000` by default | Development, deterministic verification, controlled synthetic runs | Supported |
| Local Docker | Host-selected loopback port to container port 3000 | Image and health-probe validation | Supported and locally verified |
| Coolify production target | Not assigned | Intended hosted deployment | Not deployed or validated |
| Staging | Not assigned | No configured environment | N/A |

Do not invent or publish a production URL, region, tenant model, or operator
owner. Those are external deployment decisions.

## Runtime Environment Variables

| Variable | Required | Default | Purpose | Handling |
|----------|----------|---------|---------|----------|
| `PORT` | No | `3000` | HTTP listen port | Non-secret configuration |
| `EVENT_LOG_PATH` | No | `./data/events.jsonl` | Append-only event file | Mount persistent storage in a container |
| `APPROVAL_LOG_PATH` | No | `./data/approvals.jsonl` | Authoritative append-only approval records | Mount persistent storage; contains full synthetic drafts |
| `PRODUCTION_EVAL_LOG_PATH` | No | `./data/production-evals.jsonl` | Append-only minimized `npm run eval` artifacts | Non-secret operator-controlled path; keep private and retain only for synthetic evidence |
| `RUN_DEADLINE_MS` | No | `30000` | Application-owned whole-run deadline in milliseconds | Non-secret integer from 1 through 300,000; invalid values fail before runtime construction |
| `RUN_MAX_STEPS` | No | `24` | Maximum model-turn and tool-start budget | Non-secret integer from 1 through 100; invalid values fail before runtime construction |
| `RUN_RATE_LIMIT_MAX` | No | `10` | Maximum admitted `/runs` requests per process window | Non-secret integer from 1 through 10,000 |
| `RUN_RATE_LIMIT_WINDOW_MS` | No | `60000` | Process-wide `/runs` window in milliseconds | Non-secret integer from 1 through 3,600,000 |
| `OPENAI_API_KEY` | Provider-dependent | None | Optional supported provider auth | Secret; inject outside repository |
| `ANTHROPIC_API_KEY` | Provider-dependent | None | Optional supported provider auth | Secret; inject outside repository |

Pi can also use supported user-level auth state. The repository does not
automatically load `.env`; `.env.example` documents names only. Export values
to the process or inject them with the deployment platform.

Never put a credential in `.env.example`, source, fixtures, tests, events,
images, documentation, or screenshots.

## Data Rules By Environment

- Use only the committed synthetic lead identifiers in every current environment.
- Local event and approval evidence defaults to `./data/events.jsonl` and
  `./data/approvals.jsonl`.
- Local production-eval artifacts default to
  `./data/production-evals.jsonl`. They contain minimized synthetic result,
  trace, version, duration, and explicit metric-availability evidence; they do
  not contain lead profiles, draft bodies, transcripts, provider payloads,
  credentials, stacks, or raw dependency messages.
- The internal safe-write application takes explicit approval, event, and fake-
  result paths from a library caller. Tests inject temporary paths; no runtime
  environment variable, Pi tool, HTTP route, or server composition selects a
  fake-result path.
- The internal recovery application also takes those three explicit path kinds.
  It is a library/test boundary only; no environment variable, HTTP route, Pi
  tool, scheduled worker, or effect adapter invokes it.
- The image sets both paths under `/app/data` and declares that directory as a
  volume. Approval files are created with mode `0600`.
- Treat the synthetic event, approval, eval-artifact, and any injected fake-result files as
  one coordinated environment. Retain the set for at most 30 days or until
  teardown, whichever occurs first. This is a manual operator rule; no
  automated expiry exists. A preserved incident copy delays deletion until
  operator handoff is complete.
- Operational fake-send events exclude full drafts and target lead IDs.
  Approval request records retain the
  exact synthetic target, draft ID/hash/content, and request time; decision
  records retain actor, decision, and time.
- Export is a controlled offline copy of the exact coordinated files while all
  service and internal harness writers are stopped. For a directory containing
  only the coordinated direct JSONL files, use
  `CONFIRM_WRITERS_STOPPED=true npm run backup:data -- <source> <backup-root>`.
  The source and backup root must be separate real directories. There is no
  public export endpoint.
- The snapshot command rejects malformed, truncated, blank, non-object, or
  oversized JSONL, persists private copies plus a closed SHA-256 manifest, and
  verifies the staged snapshot before atomic activation. Restore uses
  `CONFIRM_WRITERS_STOPPED=true npm run restore:data -- <snapshot>
  <absent-destination>` and refuses an existing destination or checksum
  mismatch. It does not perform an in-place replacement.
- Deletion is a whole-environment synthetic reset after all writers stop;
  verify each selected file is absent. Append-only records are never edited or
  deleted individually because that invalidates ordering, authority, and
  recovery evidence. The locally validated snapshot/restore mechanism is not a
  configured off-server destination, schedule, production restore drill, or
  per-record erasure process; data location and subprocessors are not approved
  for real data.
- Context compaction applies only to replaceable in-memory projections. It
  never deletes durable event, approval, or result records needed for audit or
  recovery.
- `/runs` must remain private or otherwise controlled. Its process-wide rate
  gate protects bounded capacity but is not authentication, authorization,
  tenant isolation, distributed rate state, or an edge WAF.

## Verification

The provider-independent environment gate is:

```bash
npm run verify
```

The local service health check is:

```bash
curl --fail http://127.0.0.1:3000/health
```

See [Deployment](./deployment.md) for the container check and
[Security and Compliance](../.spec_system/SECURITY-COMPLIANCE.md) for release
gates.
