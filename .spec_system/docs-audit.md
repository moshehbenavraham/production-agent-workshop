# Documentation Audit

**Date:** 2026-08-04
**Project:** production-agent-workshop
**Version inspected:** 0.1.3
**Audit mode:** Full source-to-task consolidation within the workshop documentation scope

## Scope

This audit compared every section of the committed `docs/scratch.md` source against the ordered tasks in `docs/todo/`, verified all technical claims against the repository, consolidated missing requirements, repaired live navigation, and removed the scratch file only after coverage and recoverability checks passed.

This was not a claim that planned production features already exist. The todo files clearly separate the implemented baseline from future work and acceptance evidence.

## Summary

| Area | Required or Inspected | Found or Mapped | Status |
|------|-----------------------|-----------------|--------|
| Scratch source sections | 17 | 17 | Complete |
| Ordered implementation tasks | 9 | 9 | Complete |
| Standard task sections | 36 | 36 | Complete |
| Todo index files | 1 | 1 | Complete |
| Local Markdown links | 21 | 21 valid | Complete |
| Updated-file ASCII and LF checks | All scoped files | No violations | Complete |
| Type-check command | 1 | Passed | Complete |
| Deterministic tests | 4 | 4 passed | Complete |
| Eval cases | 5 | 5 passed | Complete |

## Source Disposition

- Source size: 1,599 lines and 34,480 bytes.
- Source SHA-256: `8d4d9be5c636d286aec6178c6b1344a936d931e63b687a668e0d37aa4d595a18`.
- Recoverability check: the working source hash matched `HEAD` before deletion.
- Recovery point: commit `3d84e25` contains the exact deleted source.
- Coverage proof: the 17-row matrix in [README_todo.md](../docs/todo/README_todo.md) maps every source section to an authoritative destination.

## Files Created

- `docs/todo/README_todo.md` - baseline, workflow, task order, evidence standard, and coverage map
- `docs/todo/06-observability-and-incidents.md` - service, run, model, and tool observability plus incident drills
- `docs/todo/07-coolify-release.md` - server hardening, pre-public gates, deployment, recovery, rollback, and handoff
- `docs/todo/08-typed-handoff-experiment.md` - optional measured orchestration experiment
- `.spec_system/docs-audit.md` - this evidence ledger

## Files Updated

- Tasks `00` through `05` now cover the architecture, repository, harness, focused-tool, durable-state, recovery, and eval requirements that fit their existing goals.
- `README.md` links to the todo index and uses current ASCII flow notation.
- `.agents/skills/verify-production-agent/SKILL.md` uses task terminology.
- `docs/workshop/README_workshop.md` describes the expanded four-week path and extension.
- `docs/workshop/support-thread-convention.md` covers tasks `00` through `08`.
- `docs/CHANGELOG.md` records the consolidation and aligns the completed rename with version 0.1.3.

## Files Renamed or Removed

- `docs/todo/06-coolify-release.md` was split into task `06` for observability and task `07` for release.
- `docs/workshop/README.md` became `docs/workshop/README_workshop.md` to keep the root README filename unique.
- `docs/scratch.md` was deleted after its exact committed source passed the coverage gate.

## Verified Current Behavior

- `package.json` defines Node 24.15+, npm 12+, and `npm run verify` as type-check plus tests plus evals.
- `src/server.ts` exposes `GET /health` and validated `POST /runs`; it does not implement authentication or rate limiting.
- `src/pi-agent.ts` creates one Pi session and allowlists only `inspect_lead`, `draft_follow_up`, and `request_send_approval`.
- `src/tools.ts` has read, draft, and pending-approval behavior; it contains no send adapter.
- `src/event-store.ts` appends JSONL events and reads them by `runId`.
- Pi session state is in memory, while event persistence uses `EVENT_LOG_PATH`.
- `Dockerfile` uses Node 24, exposes port 3000, and declares `/app/data` for persistent events.
- The current deterministic baseline is four tests and five eval cases.

## Evidence Ledger

| Area | Document | Codebase, Spec, or Command Evidence | Result |
|------|----------|-------------------------------------|--------|
| Workflow state | `.spec_system/state.json` | `bash .spec_system/scripts/analyze-project.sh --json` | Phase 00 not started; no sessions; monorepo false |
| Product context | `.spec_system/PRD/PRD.md` | Populated PRD inspected after concurrent `createprd` | Current phases and planned requirements reflected |
| Source coverage | `docs/todo/README_todo.md` | Scratch headings counted with `rg`; 17 source sections and 17 map rows | Complete |
| Source recovery | `docs/scratch.md` | Working and `HEAD` SHA-256 values compared before deletion | Exact match |
| Runtime boundary | Tasks 00-04 | `src/server.ts`, `src/pi-agent.ts`, `src/tools.ts`, `src/event-store.ts` inspected | Updated from verified behavior |
| Eval boundary | Task 05 | `src/evals.ts`, `tests/tools.test.ts`, `tests/event-store.test.ts` inspected | Updated from verified baseline and planned gaps |
| Deployment boundary | Task 07 | `Dockerfile`, `.env.example`, `README.md`, and `SECURITY.md` inspected | Current facts separated from operator decisions |
| Orchestration boundary | Task 08 | Client brief future phases and current single-session implementation inspected | Optional and evidence-gated |
| Navigation | Root README, todo index, workshop guide | Local Markdown link checker | 21 links checked; none missing |
| Encoding | All updated documentation | ASCII and CR scans | No scoped violations |
| Type safety | Repository | `npm run check` | Passed |
| Deterministic tests | Repository | `npm test` | 4 of 4 passed |
| Evals | Repository | `npm run eval` | 5 of 5 passed |
| Complete gate | Repository | `npm run verify` | Passed |

## Security and Privacy Review

- No production code, dependency, tool allowlist, process permission, or external side effect changed.
- No credentials, private URLs, or customer data were added.
- Deployment tasks require secret storage, redacted evidence, authentication, authorization, tenant isolation, rate limiting, and data-lifecycle decisions before public exposure.
- Event, approval, observability, and Build Log requirements explicitly minimize personal data and forbid complete production logs.

## External Decisions Preserved as Task Work

The documentation does not invent values for VPS sizing, region, domain, Coolify access, backup destination, alert thresholds, provider credentials, real send provider, tenant model, retention duration, or model-grading thresholds. Tasks `03` through `07` require those decisions and their evidence at the point where they become actionable.

## Remaining Coverage Gaps

No unique source-to-todo coverage gap remains. Architecture diagrams, incident and operator runbooks, deployment evidence, and comparative orchestration results remain future task deliverables rather than unsupported claims about the current repository.

## Concurrent Spec-System Update

A separate `createprd` run populated `PRD.md`, refreshed `CONVENTIONS.md`, set `monorepo` to `false`, and created an archive backup while this audit was running. Those changes were preserved. This audit corrected the root README's unsupported CI claim and resynchronized the workflow conclusion below; it does not claim authorship of the concurrent spec changes.

## Workflow State

The spec system remains in initialization: Phase 00 is not started, the PRD is populated, and no sessions exist. This targeted documentation audit does not advance that state. The staged workflow handoff is `phasebuild`, which owns the Phase 00 session structure.
