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
| `npm run format` | Apply Biome formatting to scoped TypeScript and root JSON |
| `npm run format:check` | Verify formatting without writing |
| `npm run check` | Run strict TypeScript with no emit |
| `npm test` | Run all deterministic `node:test` cases through TSX |
| `npx tsx --test tests/safe-write-application.test.ts` | Run the internal file-backed Task `03` vertical-slice matrix |
| `npm run eval` | Run the five deterministic eval cases |
| `npm run verify` | Run formatting, types, tests, and evals in one gate |
| `npm audit --audit-level=low` | Check the effective npm 12 dependency tree |

`npm run verify` is the required one-command local gate. Provider credentials
are not needed for it.

## Source Boundaries

- Keep HTTP parsing and response mapping in `src/server.ts`.
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
- Keep deterministic qualification independent of Pi and HTTP in
  `src/qualification.ts`.
- Keep operational append-only evidence behind `src/event-store.ts`.

Local imports use `.js` specifiers for NodeNext ESM. Treat all external input,
model output, tool arguments, dependency records, and persisted events as
`unknown` until validated.

## Formatting And Types

Biome 2.5.6 formats `src/**/*.ts`, `tests/**/*.ts`, and root JSON according to
`biome.json`. It does not configure the repository linting bundle. TypeScript
remains strict with `noUncheckedIndexedAccess`.

Run `npm run format` after a formatting failure, then rerun `npm run verify`.

## Tests And Evals

- Tests live in `tests/` and name the scenario plus expected behavior.
- Contract changes should start with a failing boundary test.
- Important bugs require regression coverage.
- Critical permission, state, event, identity, and stop assertions must remain
  deterministic; model grading is not a safety gate.
- Temporary event stores must be cleaned after tests.

## Runtime Data

`EVENT_LOG_PATH` defaults to `./data/events.jsonl`; `APPROVAL_LOG_PATH` defaults
to `./data/approvals.jsonl`. Runtime event/approval files, provider state,
secrets, and build output are ignored and must not be committed. Approval
records contain exact full synthetic drafts, while operational events do not.
Internal safe-write tests inject temporary approval, event, and fake-result
JSONL paths; the server does not import the composition or configure/open a
fake-result file.
Use only synthetic fixtures and follow the manual 30-day-or-teardown whole-file
retention/deletion rule in [Environments](./environments.md).

## CI

`.github/workflows/quality.yml` runs `npm ci`, `npm run format:check`, and
`npm run check` on pushes to `main` and pull requests. GitHub-managed CodeQL and
Dependabot are enabled. The full Build & Test pipeline bundle is not configured,
so local `npm run verify` remains mandatory.

## Change Handoff

Before completion, update relevant tests, the
[active weekly Build Log](todo/README_todo.md#build-logs), `docs/TODO.md`, and
`docs/CHANGELOG.md`; inspect the final diff for secrets, personal data,
permission expansion, unapproved effects, and stale documentation.
