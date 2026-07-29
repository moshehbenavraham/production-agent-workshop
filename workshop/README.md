# Workshop path

This repository is both a completed reference and a set of progressive agent-engineering challenges.

## How to use it

1. Fork the repository.
2. Run `npm install` and `npm run verify`.
3. Read `client-brief.md`.
4. Complete the files in `issues/` in numeric order.
5. Work on one issue at a time.
6. Use Codex Plan mode for non-trivial changes.
7. Invoke `$verify-production-agent` before declaring an issue complete.
8. Commit the evidence with the change.

## Suggested prompt

```text
Goal: Complete issues/01-qualification-contract.md.
Context: Read AGENTS.md, client-brief.md, the active issue, and relevant source and test files.
Constraints: Work on this issue only. Preserve the tool allowlist and approval boundary. Do not read secrets.
Done when: The acceptance criteria are demonstrated and $verify-production-agent passes.
```

## Learning loop

```text
brief
  → issue
  → plan
  → smallest vertical slice
  → tests and evals
  → diff review
  → evidence
  → commit
```

The challenges intentionally move from understanding to typed behavior, durable approval, controlled external writes, recovery, evals, and deployment.
