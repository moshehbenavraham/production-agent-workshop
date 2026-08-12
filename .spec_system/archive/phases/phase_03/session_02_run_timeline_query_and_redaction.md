# Session 02: Run Timeline Query and Redaction

**Session ID**: `phase03-session02-run-timeline-query-and-redaction`
**Status**: Complete
**Source Task**: `06`
**Estimated Tasks**: ~18
**Estimated Duration**: 2-4 hours
**Validated**: 2026-08-12

---

## Objective

Implement a safe bounded operator query that reconstructs one exact run chronologically across validated run, model, tool, approval, recovery, and terminal evidence.

---

## Scope

### In Scope (MVP)

- Define the operator query input, output, failure, ordering, redaction, and maximum-output contracts before implementation.
- Validate the exact `runId` and configured evidence paths before reading files or producing output.
- Load only complete runtime-valid durable records and fail closed on malformed, truncated, duplicated, cross-run, or illegally ordered evidence.
- Join run lifecycle, model, tool, approval observation, recovery, and terminal facts without treating operational events as approval or effect authority.
- Render a stable chronological timeline with event type, step, duration, retry, permission, result, error category, and terminal stop reason when applicable.
- Include model, token, and cost measurements only when available and show finite unavailable reasons otherwise.
- Redact or omit credentials, provider payloads, stack traces, full drafts, unnecessary lead data, private URLs, and infrastructure identifiers.
- Bound record count, rendered field lengths, and failure details so hostile or very large logs cannot create unbounded output.
- Provide machine-readable and concise human-readable forms with the same semantic facts.
- Add an operator command that is read-only, deterministic, and safe to run against a preserved synthetic evidence set.
- Test known, missing, invalid, failed, stopped, duplicate, recovery, unavailable-metric, corrupt-file, and protected-content cases.
- Record one redacted failed-run query and the command contract in the Week 4 Build Log.

### Out of Scope

- Mutating, repairing, deleting, replaying, or resuming durable records from the query command.
- Alert dispatch, monitoring-provider integration, incident drills, or deployment actions.
- Public run-history endpoints or new caller permissions.

---

## Prerequisites

- [x] Session 01 defines the four observation layers, availability semantics, and minimized field boundary.
- [x] Phase 02 projections continue to reject damaged or ambiguous evidence before it reaches operator output.

---

## Deliverables

1. Closed run-report contracts and a deterministic read-only timeline builder for one exact `runId`.
2. Safe operator command with bounded machine-readable and concise human-readable output.
3. Complete success, corruption, ordering, unavailable-value, and redaction coverage plus one Week 4 query example.

---

## Success Criteria

- [x] One command reconstructs the implemented run-scoped layers in stable chronological order without manual JSONL inspection.
- [x] Every terminal result exposes the exact durable stop reason and every failure exposes a finite actionable category.
- [x] Missing or damaged evidence fails visibly and never produces a partial trusted success timeline.
- [x] Output remains bounded and contains no credential, full draft, unnecessary lead data, raw provider payload, or private target identifier.
- [x] The query is read-only and cannot approve, execute, retry, resume, or change runtime state.
