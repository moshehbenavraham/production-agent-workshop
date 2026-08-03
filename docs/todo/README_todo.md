# Workshop Todo

This directory is the ordered implementation path for turning the bounded reference agent into an operable production system. Complete the numbered tasks in order. Task `08` is an optional extension and must not begin until the single-agent baseline is reliable.

## Current Baseline

The repository currently provides:

- `GET /health` and a validated `POST /runs` boundary in `src/server.ts`
- one Pi session with exactly three allowlisted custom tools in `src/pi-agent.ts`
- read, draft, and pending-approval tools in `src/tools.ts`; no send tool exists
- an append-only JSONL event store keyed by `runId` in `src/event-store.ts`
- an in-memory Pi session and file-backed events; approvals are not yet durable
- four deterministic tests and five deterministic eval cases
- a Node 24 container, `/health`, and a persistent `/app/data` volume contract
- no authentication, tenant isolation, or rate limiting on `/runs`

Treat every behavior described under a task's `Work` section as planned until its acceptance evidence proves otherwise.

## Working Method

1. Read `AGENTS.md` and all three governance documents it links.
2. Read `client-brief.md`, this index, and one active task file.
3. Inspect the relevant source and tests before planning.
4. State the goal, context, constraints, and measurable completion checks.
5. Use Plan mode for non-trivial changes and keep one coherent objective per change.
6. Define schemas, permission boundaries, failure behavior, and event evidence before implementation.
7. Run `npm run verify` and invoke `$verify-production-agent` before declaring a task complete.
8. Review the diff for accidental side effects, broader permissions, secrets, personal data, and stale documentation.
9. Record the evidence in the Build Log and update `docs/CHANGELOG.md`.

The repository-wide verification command is:

```bash
npm run verify
```

It runs type-checking, deterministic tests, and the eval suite.

## Permission Vocabulary

Every action must be classified before it becomes a tool:

- `automatic`: read-only or reversible work with bounded impact
- `approval-required`: external writes, messages, spending, production changes, or access expansion
- `forbidden`: actions outside the agent's job or safety boundary

Approval is application state, not prompt wording. Validation must happen before a side effect, and retries must not duplicate damage.

## Ordered Tasks

| Order | Week | Mode | Outcome |
|-------|------|------|---------|
| [00](00-map-the-system.md) | 1 | HITL | Map the runtime, permissions, persistence, and current gaps |
| [01](01-qualification-contract.md) | 1 | AFK | Add a typed and independently testable qualification result |
| [02](02-durable-approvals.md) | 2 | AFK | Persist the human decision boundary across restarts |
| [03](03-idempotent-send.md) | 2 | HITL | Add a fake, approved, idempotent external-write boundary |
| [04](04-recovery-and-replay.md) | 3 | AFK | Rebuild and resume runs safely from durable events |
| [05](05-production-evals.md) | 3 | AFK | Gate deployment on representative safety and quality evals |
| [06](06-observability-and-incidents.md) | 4 | AFK | Make failures, cost, latency, alerts, and recovery observable |
| [07](07-coolify-release.md) | 4 | HITL | Harden, deploy, smoke-test, restart, and roll back through Coolify |
| [08](08-typed-handoff-experiment.md) | Extension | HITL | Add one typed boundary only if measured evidence justifies it |

## Evidence Standard

Each Build Log entry must include:

1. the task goal and boundary;
2. the exact commands run and their results;
3. the relevant diagram, contract, event timeline, scorecard, or runbook;
4. one failure exercised and the observed recovery or refusal;
5. the final diff review and any remaining risk.

Use synthetic data. Redact credentials, private URLs, customer data, and complete production logs. Screenshots must hide domains, IP addresses, and secrets unless they are intentionally public.

## Final Portfolio

The completed core path should leave one reviewable portfolio containing:

- the architecture, request-flow, and permission diagram from task `00`;
- qualification and write-tool contracts from tasks `01` and `03`;
- durable approval, event, projection, and recovery evidence from tasks `02` and `04`;
- the critical-gate eval scorecard from task `05`;
- a redacted observability view and incident timeline from task `06`;
- live or controlled deployment, restart, restore, rollback, operator-guide, and five-minute-demo evidence from task `07`;
- a final Build Log summary of lessons, open risks, and the next justified improvement.

Task `08` adds its comparative orchestration evidence only when the optional extension passes its entry gate.

## Retired Scratch Coverage

The source notes formerly kept in `docs/scratch.md` are consolidated as follows:

| Source topic | Authoritative destination |
|--------------|---------------------------|
| 1.1 Production architecture map | Task 00 architecture and permission map |
| 1.2 Coolify server security | Task 07 infrastructure and recovery prerequisites |
| 1.3 Agent-ready deployment baseline | Task 07 reproducible deployment and rollback |
| 2.1 Agent-ready repository | This working method and Task 00 repository audit |
| 2.2 Vertical slice with Codex | Task 00 baseline trace and Task 01 typed extension |
| 2.3 Pi harness boundary | Task 00 harness decision record and Task 04 run controls |
| 3.1 Focused tools and permissions | Tasks 01 and 03 tool contracts and failure tests |
| 3.2 State, memory, and events | Tasks 02, 04, and 06 |
| 3.3 Bounded orchestration | Task 08 measured handoff experiment |
| 4.1 Production evals | Task 05 golden set and deployment gates |
| 4.2 Failure, cost, and recovery | Task 06 observability and incident exercise |
| 4.3 Deploy, demo, and operate | Task 07 release evidence and operator handoff |
| R1 Fork, verify, and trace | Task 00 and `docs/workshop/README_workshop.md` |
| R2 Repository guidance | `AGENTS.md`, its linked governance files, and Task 00 |
| R3 Official Pi harness | Root README references and Task 00 source trace |
| R4 Break and extend evals | Task 05 red/green exercises |
| R5 Coolify deployment | Task 07 deployment, persistence, and rollback proof |

## Completion Rule

A task is complete only when its acceptance criteria are demonstrated, `npm run verify` passes, the Build Log contains observable evidence, and the diff preserves the tool allowlist and human approval boundary.
