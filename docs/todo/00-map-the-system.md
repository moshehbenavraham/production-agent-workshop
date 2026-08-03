# 00 — Map the system

Mode: HITL
Sprint week: 1
Support tag: `[W1][#00]`

## Goal

Explain the complete request path and identify every permission boundary before changing code.

## Work

- Read `client-brief.md`, `AGENTS.md`, `README.md`, `src/`, and `tests/`.
- Draw the request, tool, state, approval, and response path.
- Classify every action as automatic, approval-required, or forbidden.
- Record three production risks.

## Acceptance criteria

- The diagram names each source file that owns a boundary.
- The explanation identifies why the service cannot send.
- The verification commands are copied from the repository and run successfully.

## Evidence

Add the diagram and verification output to your Build Log.
