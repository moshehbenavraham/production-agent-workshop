# HTTP API

## Scope And Exposure

The service exposes two routes from `src/server.ts`. There is no caller
authentication, authorization, tenant isolation, rate limiting, CORS policy,
approval-decision endpoint, or send endpoint. Keep `/runs` private or otherwise
controlled and use only synthetic lead identifiers.

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
|-- stopReason: approval_pending | not_found | qualification_failed | completed
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
on success it is the final assistant text. Permission and stop truth come from
validated event evidence, not from `output`.

`approval_pending` means a pending human record exists after the latest exact-
lead qualification. It never means approved or sent.

## Error Responses

| Status | Body | Condition |
|--------|------|-----------|
| `400` | `{"error":"invalid_lead_id"}` | Parsed body has a missing, non-string, or pattern-invalid `leadId` |
| `404` | `{"error":"not_found"}` | Method/path pair is not `GET /health` or `POST /runs` |
| `413` | `{"error":"body_too_large"}` | Request body exceeds 16,384 bytes while streaming |
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
