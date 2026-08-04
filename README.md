# Production Agent Workshop

Build an Agency Lead Operations Agent with Codex, Pi, and Coolify.

![Production Agent Sprint cover](./docs/production-agent-sprint-cover.png)

This public repository contains:

- a completed, runnable reference agent;
- a believable [client brief](./docs/todo/client-brief.md);
- an explicit [AGENTS.md](./AGENTS.md) for Codex and Pi;
- ordered [workshop tasks](./docs/todo/README_todo.md);
- a reusable `$verify-production-agent` skill;
- tests, evals, events, approval boundaries, Docker, and release guidance.

The completed reference performs one bounded job:

```text
HTTP request
  -> Pi agent session
    -> inspect_lead
    -> draft_follow_up
    -> request_send_approval
  -> JSONL event log
  -> response with a visible stop reason
```

The project deliberately stops before sending anything. That boundary illustrates the difference between a useful agent and an unsafe automation.

## Why this architecture

- **Codex** is the repository-level builder: inspect, plan, edit, test, and review.
- **Pi** owns the runtime loop: model messages, typed tools, sessions, and lifecycle events.
- **Coolify** owns deployment, environment variables, health, persistence, and rollback.
- **The application** owns permissions, domain state, audit events, and evals.

The implementation follows the official Pi SDK patterns for `createAgentSession()`, custom tools, context files, session management, and event subscriptions.

## Quick start

Requirements:

- Node.js 24.15+ (Node 24 LTS)
- npm 12+
- A provider configured for Pi in `~/.pi/agent/auth.json`, or a supported provider key in the environment

To use a ChatGPT Plus or Pro Codex subscription instead of an API key, follow
the [Pi OpenAI Codex subscription authentication guide](./docs/openai-codex-subscription-auth.md).

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

- `lead_ada` - strong technical fit
- `lead_grace` - strong business fit
- `lead_unknown` - intentional not-found eval

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

Do not expose the `/runs` endpoint publicly without authentication and rate limiting. Those controls are required release gates in Week 4 task `07`.

## Required workshop path

Complete the [ordered workshop tasks](./docs/todo/README_todo.md) across five phases, with exactly one phase per week. Week 5 task `08` is required: the comparison must be completed even when its evidence says to remove the added handoff.

## Deferred integrations

After the required workshop path, consider these separately authorized extensions:

1. Replace the sample lead lookup with a read-only CRM adapter.
2. Add company research as a separate approved read-only source.
3. Add a real send provider with the established approval and idempotency guarantees.
4. Replace file-backed persistence with Postgres without changing its contracts.
5. Add model-based grading only for qualities that deterministic evals cannot measure.

## Versioning

Releases follow [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) and the repository's
[versioning policy](./docs/VERSIONING.md). User-visible changes are recorded in the
[changelog](./docs/CHANGELOG.md).

## Official references

- Pi repository: https://github.com/earendil-works/pi
- Pi SDK guide: https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md
- Pi SDK examples: https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk

Pi does not provide a general permission sandbox by default. The production boundary must come from tool allowlists, application-level approvals, and container or sandbox controls.

### Dependency note

At the time this classroom reference was verified, `@earendil-works/pi-coding-agent@0.83.0` pinned vulnerable versions of `brace-expansion` and `undici` in its published shrinkwrap. This project requires npm 12, which honors the root overrides to install `brace-expansion@5.0.9`, `minimatch@10.2.6`, and `undici@8.10.0`; `npm audit` then reports zero vulnerabilities. Keep npm on the declared version, re-run `npm audit` before deployment, and remove the overrides once Pi publishes the patched dependency tree directly.
