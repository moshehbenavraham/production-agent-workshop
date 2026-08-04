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
- The internal safe-write application takes explicit approval, event, and fake-
  result paths from a library caller. Tests inject temporary paths; no runtime
  environment variable, Pi tool, HTTP route, or server composition selects a
  fake-result path.
- The image sets both paths under `/app/data` and declares that directory as a
  volume. Approval files are created with mode `0600`.
- Synthetic approval files are retained for at most 30 days or until the
  environment is torn down, whichever occurs first. This is a manual operator
  rule; no automated expiry exists.
- Operational fake-send events exclude full drafts and target lead IDs.
  Approval request records retain the
  exact synthetic target, draft ID/hash/content, and request time; decision
  records retain actor, decision, and time.
- Export is a controlled offline copy of the exact configured files while the
  service is stopped. There is no public export endpoint.
- Deletion is a whole-file synthetic environment reset after the service stops;
  append-only records are never edited in place. Per-record erasure, backup,
  restore, data location, and subprocessors are not approved for real data.
- `/runs` must remain private or otherwise controlled because authentication,
  authorization, tenant isolation, and rate limiting are not implemented.

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
