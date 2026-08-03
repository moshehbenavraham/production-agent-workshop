# 08 - Justify One Typed Handoff

Mode: HITL
Sprint stage: optional extension
Support tag: `[EXT][#08]`

## Goal

Compare the reliable single-agent baseline with one bounded specialist or deterministic stage and keep the added orchestration only when measured evidence shows a benefit.

## Entry Gate

Do not begin this task until tasks `00` through `07` are complete and the single-agent system has measured success, failure, latency, and cost baselines. Do not add agents to repair an unclear prompt or an oversized tool.

## Work

- Draw the current single-agent flow and identify one observed bottleneck.
- State the hypothesis and the metric that would justify additional coordination.
- Choose the smallest appropriate pattern: deterministic stage, router, pipeline step, supervisor check, parallel worker, or human checkpoint.
- Prefer deterministic application code or n8n for schedules, webhooks, and business-system edges that do not require model reasoning.
- Give each worker or stage one bounded responsibility and the minimum tool permissions it needs.
- Define a typed handoff with input, output, owner, timeout, retry policy, failure destination, correlation identifier, and completion evidence.
- Pass structured state instead of a raw conversation transcript.
- Route routine classification or transformation to the smallest capable model and reserve stronger reasoning for genuinely ambiguous work.
- Test invalid handoff data, timeout, retry, partial failure, unavailable worker, context loss, and duplicate delivery.
- Compare task success, safety, latency, cost, and explainability against the unchanged single-agent baseline.
- Remove the extra component if it does not produce a material, documented improvement.

## Acceptance Criteria

- The split addresses a measured bottleneck rather than architectural fashion.
- Each stage has one owner, typed boundaries, least-privilege tools, and a visible failure destination.
- Parallel work, if any, is independent and safe to retry.
- The same `runId` or typed correlation identifier connects the full workflow.
- Timeout, retry, partial failure, and duplicate-delivery behavior are deterministic and tested.
- The comparison reports success, safety, latency, cost, and operational complexity.
- The final decision explicitly keeps or removes the orchestration based on evidence.
- `npm run verify` passes.

## Evidence

Add before-and-after diagrams, the handoff contract, permission table, failure matrix, comparative scorecard, keep-or-remove decision, and verification output to the Build Log.
