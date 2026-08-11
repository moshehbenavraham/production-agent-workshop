# CONVENTIONS.md

## Guiding Principles

- Optimize for readability, explicit boundaries, and deterministic behavior over cleverness.
- Keep the bounded lead-operations job, approval gate, and observable stop reasons intact.
- Match repository evidence precisely; record material assumptions instead of inventing behavior.
- Prefer the smallest coherent change and automate repeatable verification.

## TypeScript and Runtime

- Target Node.js 24.15 or newer with ECMAScript modules and NodeNext resolution.
- Keep `strict` and `noUncheckedIndexedAccess` enabled; do not weaken compiler checks to land a change.
- Use `.js` extensions in local TypeScript import specifiers so emitted ESM resolves correctly.
- Match the current style: double quotes, semicolons, two-space indentation, and trailing commas in multiline structures.
- Treat incoming JSON, model output, tool parameters, persisted records, and caught errors as untrusted until narrowed.

## Naming

- Use `camelCase` for values and functions, `PascalCase` for types and classes, and `UPPER_SNAKE_CASE` for true constants.
- Use kebab-case file names and descriptive domain terms such as `runId`, `leadId`, `approvalId`, and `stopReason` consistently.
- Name booleans as questions, such as `isApproved`, `hasPermission`, and `shouldRetry`.
- Name functions as actions, such as `findLead`, `makeDraft`, `append`, and `readRun`.
- Avoid abbreviations except established terms such as `id`, `url`, `http`, and `jsonl`.

## Files and Structure

- Keep HTTP validation in `src/server.ts`, agent orchestration in `src/pi-agent.ts`, domain tools in `src/tools.ts`, and persistence behind focused modules.
- Group new code by domain responsibility and keep one primary concept per file where practical.
- Keep nesting shallow and keep tests under `tests/` with names that mirror the behavior under test.
- Store operator and workshop guidance under `docs/`; store runtime data only under the configured data path.
- Do not commit generated runtime events, provider state, local secrets, or build output.

## Types and Schemas

- Define tool, HTTP, event, approval, projection, and adapter contracts before implementing behavior.
- Prefer type aliases for closed data shapes; use interfaces only when extension or declaration merging is intentional.
- Use discriminated unions for finite statuses, stop reasons, error categories, and transition outcomes.
- Keep confidence and other bounded numeric values validated at both schema and application boundaries.
- Avoid `any`; use `unknown` and explicit narrowing when a library boundary cannot provide a precise type.
- Keep observable contract changes compatible with `docs/VERSIONING.md` or classify the required version change.

## Functions and Modules

- Keep deterministic domain logic independent from Pi sessions, HTTP requests, and provider credentials.
- Give each function and module one responsibility and make side effects explicit in its name and contract.
- Use `async` and `await` at asynchronous boundaries; propagate errors with actionable context.
- Keep model-proposed values separate from application-validated values.
- Do not derive durable truth from assistant prose or raw conversation history.

## Agent and Tool Boundaries

- Define each custom tool schema, responsibility, permission level, timeout, errors, evidence, and idempotency behavior before implementation.
- Keep tools narrow and allowlist them explicitly in `createAgentSession()`; never enable Pi shell or filesystem tools in production.
- Classify actions as `automatic`, `approval-required`, or `forbidden` before exposing them as tools.
- Keep reads bounded to an exact validated identifier and return structured, actionable failures.
- Require an application-owned approval for every external write; prompt wording is never authorization.
- Resolve write targets and content from immutable approved state, validate before the effect, and persist a stable idempotency result.
- Use one bounded Pi agent until measured evidence justifies a typed handoff.

## HTTP Endpoints

- Keep the HTTP layer limited to input parsing, validation, status mapping, and response serialization.
- Validate `leadId` and body size before starting an agent run; preserve the 16,384-byte request limit unless an evidenced requirement changes it.
- Return JSON with stable machine-readable error codes and appropriate HTTP status codes.
- Apply the process-wide `/runs` rate gate before body parsing or Pi work; keep
  its bounded integer environment settings fail-fast and treat it as capacity
  protection, not caller identity or authorization.
- Do not expose `/runs` or approval endpoints publicly without authentication, authorization, exposure-appropriate tenant isolation, and rate limiting.
- Keep `/health` lightweight and free of secrets or internal data.

## Events and Persistence

- Emit append-only events for every run, tool, approval, recovery, and terminal attempt and outcome, including failures.
- Include `eventId`, `runId`, timestamp, type, and minimized structured data in each event envelope.
- Preserve a visible `stopReason` for every terminal path and a stable `runId` across all layers.
- Build run and approval projections deterministically from durable records; working context remains replaceable.
- Treat malformed, truncated, missing, or out-of-order records as visible errors, never as permission to invent state.
- Keep file-backed stores behind replaceable interfaces and persist Coolify runtime state under `/app/data`.
- Snapshot coordinated JSONL only while every writer is stopped. Require an
  explicit operator confirmation, validate every complete record and manifest
  checksum, restore only to an absent destination, and never treat an in-image
  copy as an off-server backup.

## Error Handling

- Fail fast during validation and fail visibly when a model, tool, store, or dependency cannot complete its contract.
- Return structured error categories and enough redacted context for an operator to act.
- Never swallow an error or turn a failure, pending action, timeout, or permission denial into friendly success prose.
- Record failed attempts with the originating `runId` before propagating or mapping the error.
- Define retry, resume, compensate, escalate, and stop behavior explicitly for recoverable boundaries.

## Security and Data Handling

- Never read, print, log, or commit `.env`, provider keys, Pi auth files, browser state, or unrelated user files.
- Treat `leadId`, HTTP input, model output, tool arguments, and persisted records as untrusted.
- Keep events and evidence free of secrets, credentials, unnecessary personal data, and undocumented full drafts.
- Use synthetic data until retention, redaction, export, deletion, backup, and restore rules are approved.
- Do not add a network-writing tool without an explicit approval gate, exact-target validation, and an idempotency key.
- Review every permissions, logging, persistence, retention, and external-side-effect change against `SECURITY-COMPLIANCE.md`.

## Testing and Evals

- Use `node:test` and `node:assert/strict` for deterministic behavior tests executed through TSX.
- Name tests by scenario and expected behavior; test contracts and outcomes rather than private implementation details.
- Cover valid, malformed, missing, unknown, duplicate, timeout, permission, storage, restart, replay, and downstream-failure paths as applicable.
- Keep critical safety assertions deterministic; reserve model grading for qualities that genuinely require judgment.
- Make every critical eval failure exit non-zero regardless of aggregate quality.
- Add a regression test or eval for every important failure behavior, bug, or production incident.
- Run `npm run verify` before declaring a non-trivial change complete.

## Dependencies and Builds

- Use npm 12 and commit `package-lock.json`; use `npm ci` for clean and container installs.
- Pin production dependencies and security overrides intentionally; justify additions and remove overrides after verified upstream fixes.
- Run `npm audit` before deployment and investigate every finding in the effective npm 12 dependency tree.
- Keep the Docker build reproducible from a verified commit and preserve Node 24, port 3000, `/health`, and `/app/data` contracts unless requirements change.
- Keep provider credentials outside source, images, fixtures, and documentation.

## Repository Change Workflow

For a non-trivial change:

1. Read the active file in `docs/todo/` and the governance files linked from `AGENTS.md`.
2. Inspect relevant source, tests, schemas, permissions, and persistence boundaries.
3. State one objective, constraints, and measurable completion checks.
4. Make the smallest coherent change and add failure-path evidence.
5. Run `npm run verify` and any task-specific checks.
6. Review the diff for accidental permissions, secrets, side effects, logging, or retention changes.
7. Update the active weekly Build Log, `docs/TODO.md` when applicable, and `docs/CHANGELOG.md`.

## Definition of Done

- Type-checking, deterministic tests, and deterministic evals pass.
- New or changed failure behavior has a test or eval.
- Logs identify the `runId`, outcome, and stop reason without leaking protected data.
- Tool allowlists, approval boundaries, and external-side-effect controls remain correct.
- Documentation and operator commands match implemented behavior.
- Security checks in `SECURITY-COMPLIANCE.md` pass and the final diff has been reviewed.

## Git, Reviews, and Releases

- Use imperative, concise commit messages and keep one logical change per commit.
- Use `type/short-description` branch names and keep commits small enough to revert safely.
- Explain what and why in pull requests, link the task evidence, and review the diff before requesting review.
- Critique code and contracts rather than people; label non-blocking preferences as nits.
- Follow `docs/VERSIONING.md`; update `package.json`, lockfile, changelog, and tag only through the documented release workflow.

## Local Dev Tools

| Category | Tool | Command or Config |
|----------|------|-------------------|
| Runtime | Node.js 24 + TSX | `npm start`, `npm run dev` |
| Dev Server | TSX HTTP server | `npm start`, `http://127.0.0.1:3000/health` |
| Package Manager | npm 12.0.2 | `packageManager`, `package-lock.json` |
| Type Safety | TypeScript strict | `npm run check`, `tsconfig.json` |
| Testing | Node.js test runner | `npm test` |
| Build | TypeScript compiler | `npm run build`, `dist/` (generated and ignored) |
| Coverage | Node.js test coverage | `npm run test:coverage`; lines 95%, branches 85%, functions 95% |
| Evals | Deterministic TypeScript runner | `npm run eval` |
| Full Verification | npm scripts | `npm run verify` |
| Formatter | Biome 2.5.6 | `npm run format`, `npm run format:check`, `biome.json` |
| Linter | Biome 2.5.6 recommended rules | `npm run lint`, `npm run lint:fix`, `biome.json` |
| Git Hooks | Husky 9.1.7 + lint-staged 17.3.0 | `.husky/pre-commit`, `npm run precommit`, staged TypeScript/JSON Biome checks |
| Observability | Append-only JSONL events | `EVENT_LOG_PATH` |
| Deployment | Docker + Coolify | `Dockerfile`, `/health`, `/app/data` |
| Database | N/A - no database signal | File-backed interfaces only |

## CI/CD

| Bundle | Status | Workflow |
|--------|--------|----------|
| Code Quality | configured | `.github/workflows/quality.yml` |
| Build & Test | configured | `.github/workflows/test.yml` |
| Security | configured | `.github/workflows/security.yml` plus GitHub-managed CodeQL and secret scanning |
| Integration | not configured | - |
| Operations | not configured | - |

GitHub-managed CodeQL default setup, secret scanning with push protection, and
Dependabot Updates are enabled. The repository Security workflow adds
history-wide Gitleaks, pull-request dependency review, and locked-tree audit.
Managed features do not, by themselves, mark Operations configured.

## Infrastructure

| Component | Provider | Details |
|-----------|----------|---------|
| Health endpoint | Node.js HTTP server | `GET /health` returns `200` and `{"status":"ok"}` |
| Health probe | Docker / Coolify | Dockerfile `HEALTHCHECK`: 30s interval, 5s timeout, 10s start period, 3 retries |
| Hosting target | Coolify | Docker image, port 3000, and `/app/data`; production target not deployed yet |
| Persistence | Append-only JSONL | `EVENT_LOG_PATH=/app/data/events.jsonl` on the declared `/app/data` volume |
| Security | Node.js application gate | Process-wide `/runs` fixed-window limit; default 10 requests per 60 seconds; local HTTP/container validation only |
| Backup | Offline Node.js CLI | `npm run backup:data` and `npm run restore:data`; stopped-writer confirmation, private files, SHA-256 manifest, exact re-read, and absent-destination restore validated locally and in Docker |
| Deploy | not configured | Coolify Git integration or deploy trigger remains later-phase work |

## When In Doubt

- Decide from repository evidence, document material assumptions, and keep uncertainty out of safety claims.
- Preserve the bounded job, least privilege, human approval, deterministic evidence, and recoverable stop behavior.
