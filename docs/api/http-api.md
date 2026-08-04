# HTTP API

## Scope And Exposure

The service exposes two routes from `src/server.ts`. A process-wide fixed-
window gate limits `/runs`, but there is no caller authentication,
authorization, tenant isolation, distributed rate state, deployed WAF, CORS
policy, approval-decision endpoint, or send endpoint. Keep `/runs` private or
otherwise controlled and use only synthetic lead identifiers.

## `GET /health`

Returns process-level health without reading credentials, provider state, or
event data.

### Response

```json
{
  "status": "ok"
}
```

Status: `200`.

## `POST /runs`

Starts one Pi-backed lead run. Provider authentication must already be
available to the process.

Each admitted request consumes one process-wide slot before its body is read or
Pi can start. Defaults are 10 requests per 60 seconds. Configure bounded
positive integers with `RUN_RATE_LIMIT_MAX` and
`RUN_RATE_LIMIT_WINDOW_MS`; malformed values stop startup. The limiter does not
trust `X-Forwarded-For`, does not identify a caller, resets on process restart,
and is independent per replica.

### Request

- Body must be valid JSON and remain at or below 16,384 bytes.
- `leadId` must be a string matching `^lead_[a-z0-9_]+$`.
- Current known fixtures are synthetic `lead_ada` and `lead_grace`.

```json
{
  "leadId": "lead_ada"
}
```

### Successful Response

Status: `200`.

```text
RunResult
|-- runId: string
|-- output: string
|-- stopReason: approval_pending | approval_failed | not_found | qualification_failed | completed
`-- qualification:
    |-- { ok: true, value: QualificationResult }
    `-- { ok: false, error: QualificationFailure }
```

`QualificationResult` contains only:

- `leadId`;
- `fit`: `strong`, `possible`, or `insufficient`;
- `confidence`: number from 0 through 1;
- `reasons`: finite application-owned reason codes;
- `missingInformation`: finite application-owned missing-information codes.

`QualificationFailure` contains `code`, `message`, and `retryable`. Current
codes are:

- `missing_lead_id`;
- `malformed_lead_id`;
- `invalid_input`;
- `lead_not_found`;
- `lead_lookup_failed`;
- `qualification_timeout`.

The `output` field is application-owned failure text when qualification fails;
on success it is the final assistant text. Qualification truth comes from
validated event evidence; approval truth comes from the validated durable
projection. Neither comes from `output`.

`approval_pending` means a pending human record exists after the latest exact-
lead qualification. It never means approved or sent.

`approval_failed` means qualification succeeded but no valid current durable
approval state exists for that exact run/lead after the latest qualification.
Missing, malformed, stale, cross-run, and unavailable approval evidence cannot
be reported as completion.

Every admitted `/runs` response includes `RateLimit-Limit`,
`RateLimit-Remaining`, and `RateLimit-Reset`, where reset is the remaining
window duration in seconds. A denied response also includes `Retry-After`.

## Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `400` | `{"error":"invalid_lead_id"}` | Parsed body has a missing, non-string, or pattern-invalid `leadId` |
| `404` | `{"error":"not_found"}` | Method/path pair is not `GET /health` or `POST /runs` |
| `413` | `{"error":"body_too_large"}` | Request body exceeds 16,384 bytes while streaming |
| `429` | `{"error":"rate_limited","retryAfterSeconds":N}` | The process-wide fixed-window quota is exhausted |
| `503` | `{"error":"agent_run_failed","message":"..."}` | JSON parsing or the Pi-backed run throws |

The current 503 response does not include a `runId` or structured terminal stop
reason. Treat it as failure evidence and inspect the controlled event/log
boundary; do not infer success.

## Example

```bash
curl -X POST http://127.0.0.1:3000/runs \
  -H 'content-type: application/json' \
  -d '{"leadId":"lead_ada"}'
```

The response text can vary with the configured provider, but the structured
qualification and finite stop reason are application-validated.
