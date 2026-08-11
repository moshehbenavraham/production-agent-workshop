# Onboarding

## Prerequisites

- [ ] Git is installed.
- [ ] Node.js 24.15 or newer is active.
- [ ] npm 12 or newer is active; the project pins npm 12.0.2.
- [ ] Only synthetic classroom data will be used.

Provider authentication is not required for deterministic verification. It is
required only when starting a Pi-backed run. Keep credentials in supported Pi
auth state or exported environment variables, never in repository files.

## Setup

1. Clone the repository and enter it.
2. Install exactly the locked dependency graph:

   ```bash
   npm ci
   ```

3. Run the complete provider-independent gate:

   ```bash
   npm run verify
   ```

4. Confirm the expected result: formatting, linting, and strict TypeScript pass,
   270/270 tests pass, and all 18 production-eval cases pass with a durable
   artifact.

## Optional Pi Authentication

Use one supported provider configuration. For ChatGPT Plus or Pro Codex auth,
follow [Pi subscription authentication](./openai-codex-subscription-auth.md).
Do not inspect, copy, print, log, or commit credential state.

The project does not automatically load `.env`. Export runtime variables to
the process or inject them through the platform. `.env.example` documents names
only and contains no credential value.

## Start And Smoke Check

Start the HTTP service:

```bash
npm start
```

In another terminal, verify the provider-independent endpoint:

```bash
curl --fail http://127.0.0.1:3000/health
```

The expected body is `{"status":"ok"}`. A `POST /runs` request also needs Pi
provider authentication and must use only the synthetic lead identifiers.

## First Files To Read

1. [AGENTS.md](../AGENTS.md)
2. [Architecture](./ARCHITECTURE.md)
3. [Development guide](./development.md)
4. [Ordered workshop path](./todo/README_todo.md)
5. [Security and Compliance](../.spec_system/SECURITY-COMPLIANCE.md)

## Setup Is Complete When

- [ ] `npm run verify` exits 0.
- [ ] `/health` returns HTTP 200 and `{"status":"ok"}`.
- [ ] No credential or real customer data was added to the repository.
