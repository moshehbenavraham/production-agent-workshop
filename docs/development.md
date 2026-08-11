# Development Guide

## Required Tools

| Tool | Required version | Evidence source |
|------|------------------|-----------------|
| Node.js | 24.15 or newer | `package.json` `engines` |
| npm | 12 or newer; 12.0.2 pinned | `packageManager` and lockfile |
| Git | Current supported client | Repository workflow |
| Docker | Optional for image checks | `Dockerfile` |

## Commands

| Command | Purpose |
|---------|---------|
| `npm ci` | Install the committed dependency graph |
| `npm run dev` | Watch and restart the HTTP server through TSX |
| `npm start` | Start the HTTP service once |
| `npm run demo -- lead_ada` | Run a Pi-backed synthetic lead through the agent |
| `npm run build` | Compile source and tests to ignored `dist/` output |
| `npm run format` | Apply Biome formatting to scoped TypeScript and root JSON |
| `npm run format:check` | Verify formatting without writing |
| `npm run lint` | Check scoped TypeScript and root JSON with Biome recommended rules |
| `npm run lint:fix` | Apply Biome safe lint fixes |
| `npm run check` | Run strict TypeScript with no emit |
| `npm test` | Run all deterministic `node:test` cases through TSX |
| `npm run test:coverage` | Run tests with 95% line, 85% branch, and 95% function minimums |
| `npx tsx --test tests/safe-write-application.test.ts` | Run the internal file-backed Task `03` vertical-slice matrix |
| `npx tsx --test tests/recovery-application.test.ts` | Run the internal Task `04` three-checkpoint restart and replay matrix |
| `npx tsx --test tests/production-eval.test.ts` | Validate the Task `05` closed eval contracts and 18-case golden-set inventory |
| `node --import tsx --test tests/production-eval-runner.test.ts` | Run focused harness, scoring, artifact, scorecard, and failure-gate tests |
| `npm run eval` | Execute, persist, and score all 18 deterministic production-eval cases |
| `npm run verify` | Run formatting, linting, types, tests, and evals in one gate |
| `npm audit --audit-level=low` | Check the effective npm 12 dependency tree |

`npm run verify` is the required one-command local gate. Provider credentials
are not needed for it.

## Source Boundaries

- Keep HTTP parsing and response mapping in `src/server.ts`.
- Keep deterministic `/runs` capacity policy and fail-fast environment parsing
  in `src/rate-limit.ts`; do not derive caller identity from forwarding headers.
- Keep Pi session orchestration and visible run projection in `src/pi-agent.ts`.
- Keep custom tool execution and event gates in `src/tools.ts`.
- Keep approval policy in `src/approval-service.ts`, approval domain rules in
  `src/approval.ts`, and file projection in `src/approval-store.ts`.
- Keep fake authorization in `src/fake-send.ts`, result/store contracts in
  `src/fake-send-result.ts`, file projection in `src/fake-send-store.ts`, and
  orchestration in `src/fake-send-service.ts`. Do not connect this internal
  boundary to Pi or HTTP without the separate permission-review gate.
- Keep approval-to-fake wiring in `src/safe-write-application.ts`. It is an
  internal synthetic-operator harness, not an authenticated transport or Pi
  tool; actor sets must be snapshotted when the application is constructed.
- Keep replay/resume policy and composition in `src/recovery-application.ts`.
  It is an internal synthetic harness with explicit paths, no Pi/HTTP route,
  no approval-decision authority, and no fake-effect adapter. Project all three
  stores before mutation and escalate reservation-only state.
- Keep deterministic qualification independent of Pi and HTTP in
  `src/qualification.ts`.
- Keep reusable eval contracts and semantic validation in
  `src/production-eval.ts`; keep only the frozen declarative inventory in
  `src/production-eval-golden-set.ts`. Keep execution/scoring, fixture
  composition, persistence, and rendering in their dedicated
  `src/production-eval-*.ts` modules. The harness may call production domain
  boundaries with injected synthetic substitutes, but it must not import HTTP,
  a provider session, a real adapter, or a network client.
- Keep operational append-only evidence behind `src/event-store.ts`.

Local imports use `.js` specifiers for NodeNext ESM. Treat all external input,
model output, tool arguments, dependency records, and persisted events as
`unknown` until validated.

## Formatting, Linting, And Types

Biome 2.5.6 formats `src/**/*.ts`, `tests/**/*.ts`, and root JSON according to
`biome.json` and checks the same scope with its recommended lint rules.
TypeScript remains strict with `noUncheckedIndexedAccess`.

Run `npm run format` after a formatting failure or `npm run lint:fix` after a
lint failure, then rerun `npm run verify`.

## Tests And Evals

- Tests live in `tests/` and name the scenario plus expected behavior.
- Contract changes should start with a failing boundary test.
- Important bugs require regression coverage.
- Critical permission, state, event, identity, and stop assertions must remain
  deterministic; model grading is not a safety gate.
- The 18-case `src/evals.ts` command is the repository deployment gate. It
  executes every declared case, continues after individual failures, persists
  minimized evidence, and exits non-zero for any critical mismatch, executor
  failure, invalid evidence, or unproved persistence. Optional quality and
  pending latency/token/cost thresholds never override critical status.
- Temporary event stores must be cleaned after tests.

## Runtime Data

`EVENT_LOG_PATH` defaults to `./data/events.jsonl`; `APPROVAL_LOG_PATH` defaults
to `./data/approvals.jsonl`; `PRODUCTION_EVAL_LOG_PATH` defaults to
`./data/production-evals.jsonl` for `npm run eval`. `RUN_DEADLINE_MS` defaults to `30000` and
`RUN_MAX_STEPS` defaults to `24`; both are bounded positive integers and fail
before runtime construction when invalid. Runtime event/approval files,
provider state, secrets, and build output are ignored and must not be
committed. Approval records contain exact full synthetic drafts, while
operational events do not.
Internal safe-write tests inject temporary approval, event, and fake-result
JSONL paths; the server does not import the composition or configure/open a
fake-result file.
Internal recovery tests construct checkpoints only through application/store
APIs, then use fresh instances; they never manually edit durable records.
Use only synthetic fixtures and follow the manual 30-day-or-teardown whole-file
retention/deletion rule in [Environments](./environments.md).

## CI

`.github/workflows/quality.yml` runs locked-install formatting, linting, and
strict-type checks. `.github/workflows/test.yml` compiles the repository, runs
all deterministic tests with built-in coverage thresholds, and runs the
18-case durable critical eval gate. Both workflows run on pushes to `main` and
pull requests. GitHub-managed CodeQL and Dependabot remain enabled; local
`npm run verify` is still mandatory before review.

## Change Handoff

Before completion, update relevant tests, the
[active weekly Build Log](todo/README_todo.md#build-logs), `docs/TODO.md`, and
`docs/CHANGELOG.md`; inspect the final diff for secrets, personal data,
permission expansion, unapproved effects, and stale documentation.
