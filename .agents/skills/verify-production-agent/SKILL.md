---
name: verify-production-agent
description: Verify a change to this production-agent workshop repository. Use after editing agent behavior, tools, permissions, events, HTTP boundaries, deployment files, or evals, and before claiming an issue is complete.
---

# Verify Production Agent

Run the checks from the repository root.

1. Read `AGENTS.md` and the active file in `docs/todo/`.
2. Run `npm run check`.
3. Run `npm test`.
4. Run `npm run eval`.
5. Inspect the diff for:
   - new external side effects;
   - broader tool or process permissions;
   - secrets or personal data in code, fixtures, or events;
   - missing run IDs, stop reasons, or error events;
   - claims of completion without observable evidence.
6. If behavior changed, add or update a deterministic test or eval.
7. Report each command, its result, and any remaining risk.

Do not weaken a test, eval, approval boundary, or tool allowlist merely to make verification pass.
