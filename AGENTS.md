# AGENTS.md

## Mission

Build a small production agent that qualifies a known lead, drafts a follow-up, and stops at a human approval gate. Clarity, observability, and safe recovery matter more than autonomy.

## Architecture rules

1. The HTTP layer validates input but contains no agent logic.
2. The Pi session may call only explicitly allowlisted custom tools.
3. Tool schemas are defined before implementation.
4. Domain logic remains deterministic and independently testable.
5. Every run and tool lifecycle creates an append-only event.
6. External writes require an approval record. This starter never sends a message.
7. Do not hide a failure behind a friendly final response.
8. A run must have a stable `runId` and a visible stop reason.

## Security constraints

- Never read or print `.env`, provider keys, Pi auth files, browser state, or unrelated user files.
- Never add credentials to source code, fixtures, tests, logs, or documentation.
- Never add a network-writing tool without an explicit approval gate and idempotency key.
- Treat `leadId` as untrusted input.
- Keep event payloads free of secrets and unnecessary personal data.
- Do not enable Pi filesystem or shell tools in the production session.

## Change workflow

For a non-trivial change:

1. Read the active file in `docs/issues/`.
2. Inspect the relevant code and tests.
3. State the goal, constraints, and completion checks.
4. Make the smallest coherent change.
5. Run `npm run verify`.
6. Review the diff for accidental permissions, logging, or data-retention changes.

## Done means

A change is complete only when:

- Type-checking passes.
- Deterministic tests pass.
- The eval suite passes.
- New failure behavior is covered by a test or eval.
- Logs still identify the run and stop reason.
- Documentation matches the actual commands.
- No secret or external side effect was introduced.

## Do not

- Do not add multiple agents to repair an unclear single-agent prompt.
- Do not give the model broad `bash`, filesystem, CRM, or deployment access.
- Do not replace typed handoffs with raw conversation transcripts.
- Do not add Redis, a queue, or a database until the exercise requires durable concurrency.
- Do not publish or deploy from Codex without the user explicitly requesting it.
