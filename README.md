# Production Agent Workshop

Build an actual Agency Lead Operations Agent with Codex, Pi, and Coolify.

This public workshop repository contains:

- a completed, runnable reference agent;
- a believable [client brief](./client-brief.md);
- an explicit [AGENTS.md](./AGENTS.md) for Codex and Pi;
- ordered [workshop issues](./issues);
- a reusable `$verify-production-agent` skill;
- tests, evals, events, approval boundaries, Docker, and CI.

The completed reference performs one bounded job:

```text
HTTP request
  → Pi agent session
    → inspect_lead
    → draft_follow_up
    → request_send_approval
  → JSONL event log
  → response with a visible stop reason
```

The project deliberately stops before sending anything. That boundary lets students see the difference between a useful agent and an unsafe automation.

Start with [the workshop path](./workshop/README.md).

## Why this architecture

- **Codex** is the repository-level builder: inspect, plan, edit, test, and review.
- **Pi** owns the runtime loop: model messages, typed tools, sessions, and lifecycle events.
- **Coolify** owns deployment, environment variables, health, persistence, and rollback.
- **The application** owns permissions, domain state, audit events, and evals.

The implementation follows the official Pi SDK patterns for `createAgentSession()`, custom tools, context files, session management, and event subscriptions.

## Quick start

Requirements:

- Node.js 22+
- A provider configured for Pi in `~/.pi/agent/auth.json`, or a supported provider key in the environment

```bash
cp .env.example .env
npm install
npm run verify
npm run demo -- lead_ada
npm start
```

Test the service:

```bash
curl http://localhost:3000/health

curl -X POST http://localhost:3000/runs \
  -H 'content-type: application/json' \
  -d '{"leadId":"lead_ada"}'
```

Available classroom leads:

- `lead_ada` — strong technical fit
- `lead_grace` — strong business fit
- `lead_unknown` — intentional not-found eval

## Coolify deployment

1. Push this folder to a Git repository.
2. Create a Coolify application from the repository.
3. Use the included `Dockerfile`.
4. Add a persistent volume mounted at `/app/data`.
5. Configure one provider credential as a secret.
6. Set `EVENT_LOG_PATH=/app/data/events.jsonl`.
7. Expose port `3000`.
8. Configure the health check as `/health`.
9. Deploy.
10. Trigger a run, inspect logs, restart, and confirm the event file remains.

Do not expose the `/runs` endpoint publicly without authentication and rate limiting. Those controls are intentionally left as a classroom extension.

## Student extensions

Complete these in order:

1. Replace the sample lead lookup with a read-only CRM adapter.
2. Store approvals durably and add approve/decline endpoints.
3. Add authentication and tenant boundaries.
4. Add a Postgres event store without changing the event interface.
5. Add one model-based eval after the deterministic suite.
6. Add a real send tool with idempotency—but keep it behind approval.
7. Compare the single-agent flow with one typed specialist handoff.

## Official references

- Pi repository: https://github.com/earendil-works/pi
- Pi SDK guide: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md
- Pi SDK examples: https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk

Pi does not provide a general permission sandbox by default. The production boundary must come from tool allowlists, application-level approvals, and container or sandbox controls.

### Dependency note

At the time this classroom reference was verified, `@earendil-works/pi-coding-agent@0.82.1` pulled `brace-expansion@5.0.7` through its internal `minimatch` dependency. npm reports the published denial-of-service advisory for that transitive package. Re-run `npm audit` before deployment and upgrade Pi as soon as its dependency tree includes the patched release. The vulnerable glob expansion is not exposed to request input in this starter.
