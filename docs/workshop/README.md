# Workshop path

This repository is both a completed reference and a set of progressive agent-engineering challenges.

## How to use it

1. Fork the repository.
2. Run `npm install` and `npm run verify`.
3. Read `client-brief.md`.
4. Complete the files in `docs/todo/` in numeric order.
5. Work on one issue at a time.
6. Use Codex Plan mode for non-trivial changes.
7. Invoke `$verify-production-agent` before declaring an issue complete.
8. Commit the evidence with the change.

## Suggested prompt

```text
Goal: Complete docs/todo/01-qualification-contract.md.
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

## Four-week schedule

| Week | Challenges | Outcome |
| --- | --- | --- |
| 1 | `#00` Map the system, `#01` Qualification contract | Understand the boundaries and add explicit qualification |
| 2 | `#02` Durable approvals, `#03` Idempotent send | Build a real human gate and a safe write boundary |
| 3 | `#04` Recovery and replay, `#05` Production evals | Make runs resumable and critical behavior measurable |
| 4 | `#06` Coolify release | Deploy, observe, restart, and roll back |

## Getting support

Use the weekly Skool support thread or open a dedicated topic.

Start every question with the support tag from the active issue:

```text
[W2][#03] Duplicate send test is returning a new result
```

Include:

1. Your goal
2. What you expected
3. What happened
4. The exact command or failing eval
5. The smallest relevant code or event excerpt
6. What you already tried

Never paste API keys, `.env` contents, Pi auth files, customer data, or complete production logs.
