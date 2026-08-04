# Contributing

Contributions must preserve the bounded-agent, synthetic-data, human-stop, and
evidence requirements described in [AGENTS.md](./AGENTS.md) and its linked
governance files.

## Before You Change Code

1. Read the active item in the [ordered workshop path](./docs/todo/README_todo.md).
2. Inspect the relevant source, schemas, tests, permissions, persistence, and
   current [security posture](./.spec_system/SECURITY-COMPLIANCE.md).
3. Define one coherent objective, explicit constraints, failure behavior, and
   measurable completion checks.

## Branch And Commit Conventions

- Use a short `type/description` branch name, such as `feature/durable-approval`
  or `fix/event-projection`.
- Keep commits focused, imperative, and small enough to review and revert.
- Do not mix unrelated cleanup into a behavioral change.
- Follow the [versioning policy](./docs/VERSIONING.md) for compatibility changes.

## Development Workflow

Install the committed dependency graph:

```bash
npm ci
```

Format files when needed:

```bash
npm run format
```

Run the complete local gate before review:

```bash
npm run verify
npm audit --audit-level=low
```

`npm run verify` checks formatting, strict TypeScript, all deterministic tests,
and all deterministic evals. Add a regression test or eval for every material
failure behavior or bug.

## Pull Request Expectations

A pull request should:

- explain what changed and why;
- identify changed tool, permission, event, persistence, API, or side-effect boundaries;
- include deterministic success and failure evidence;
- keep credentials, real customer data, and private infrastructure details out
  of code, fixtures, logs, screenshots, and documentation;
- update `docs/CHANGELOG.md`, `docs/TODO.md`, and the
  [active weekly Build Log](docs/todo/README_todo.md#build-logs) when applicable;
- pass Code Quality CI and all repository-specific verification gates;
- call out any external decision rather than inventing a legal, ownership,
  deployment, or data-lifecycle answer.

## Safety Review

Before requesting review, confirm that the diff:

- does not add Pi shell or filesystem tools;
- does not treat model prose or prompt order as authorization;
- does not add an external write without exact application-owned approval,
  target validation, and idempotency;
- does not expose `/runs` publicly without matching access and rate controls;
- preserves minimized event evidence and visible failures.

See the [development guide](./docs/development.md) for commands and the
[architecture guide](./docs/ARCHITECTURE.md) for component ownership.
