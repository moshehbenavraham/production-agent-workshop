# Considerations

> Institutional memory for AI assistants. Updated between phases via carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 00 (2026-08-04)

---

## Project Mission

Build a small production agent that qualifies a known lead, drafts a
follow-up, and stops at a human approval gate. Clarity, observability, and safe
recovery matter more than autonomy.

---

## Active Concerns

Items requiring attention in upcoming phases. Review before each session.

### Technical Debt

- [P00] **Durable approval state**: Pending approval is event evidence only;
  decisions, exact draft linkage, transition rules, and restart behavior do not exist.
- [P00] **Run recovery projection**: Qualification projection exists, but the
  complete run still lacks replay, resume, corruption handling, and bounded retry rules.

### External Dependencies

- [P00] **Provider execution**: Deterministic gates need no model credential;
  provider-backed behavior remains operator-configured and must stay separate evidence.
- [P00] **Production target**: Docker health passes locally, but no reachable
  Coolify deployment exists; production health, persistence, restore, and rollback are unproved.

### Performance / Security

- [P00] **Controlled exposure only**: `/runs` has no caller authentication,
  authorization, tenant isolation, or rate limiting and must not be public.
- [P00] **Synthetic-data restriction**: Retention, redaction, export, erasure,
  backup, restore, subprocessors, and data-location decisions are still open.
- [P00] **Whole-run bounds**: Qualification has a 1,000 ms deadline, but the
  Pi run has no explicit overall deadline or maximum step count.

### Architecture

- [P00] **Event truth over prose**: Derive permissions and visible outcomes
  from schema-validated, ordered, exact-identity events, never assistant text.
- [P00] **Frozen least privilege**: Production exposes exactly
  `qualify_lead`, `draft_follow_up`, and `request_send_approval`; any write
  requires exact approval, target validation, and idempotency before allowlisting.
- [P00] **Single-agent baseline**: Keep one bounded Pi session until measured
  success, safety, latency, or cost evidence justifies a typed handoff.

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

- [P00] **Schema-first boundaries**: Infer static types from closed TypeBox
  schemas and compile runtime validators for every untrusted crossing.
- [P00] **Contract-first RED/GREEN**: Missing exports and bypass cases made the
  intended boundary observable before implementation and prevented silent scope drift.
- [P00] **Exact identity checks**: Validate requested, returned, persisted, and
  projected `leadId` values independently even when an earlier layer checked them.
- [P00] **One bounded lifecycle**: Validate configuration before an attempt,
  append exactly one terminal, clear timers, and ignore late completion.
- [P00] **Failure precedence**: Canonical application failures must override
  friendly prose and invalid downstream evidence.
- [P00] **Runtime permission evidence**: Test both exact tool names and
  `Object.isFrozen` so readonly declarations are enforced at runtime.
- [P00] **Output-channel parity**: Assert Pi tool JSON content and typed details
  agree on both success and failure paths.
- [P00] **Provider-independent vertical slices**: Invoke actual Pi tool
  definitions directly to prove event order, one `runId`, pending approval, and no send.

### What to Avoid

- [P00] **Prompt order as authorization**: Model instructions guide behavior
  but cannot grant approval, validate identity, or prove prior state.
- [P00] **Type signatures as runtime trust**: Dependency records and model/tool
  results remain `unknown` until schema and identity validation pass.
- [P00] **Shape-only event projection**: A valid event shape can still be stale,
  cross-lead, or out of order; freshness and ordering are part of the contract.
- [P00] **Partial lifecycle evidence**: Do not append an attempt before config
  validation or allow timeout races to append multiple terminal events.
- [P00] **Checkpoint as completion**: A pushed mid-session version is not a
  validated session closeout; preserve explicit workflow state and evidence gates.

### Tool/Library Notes

- [P00] **TypeBox 1.3.10**: Closed objects, finite element vocabularies, and
  compiled guards provide one contract source for types and runtime validation.
- [P00] **Pi 0.83.0 tools**: The actual five-argument executor is directly
  testable; JSON content and typed details are separate contracts.
- [P00] **TypeScript 7 file checks**: Commands naming source files require
  `--ignoreConfig`; repository checks should prefer `npm run check`.
- [P00] **Biome 2.5.6**: `npm run format` fixes the scoped TypeScript/JSON set;
  `npm run format:check` is now part of `npm run verify` and CI.
- [P00] **Docker health**: Node.js `fetch` can validate HTTP and exact JSON from
  the image without adding curl or another runtime package.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item | Resolution |
|-------|------|------------|
| P00 | Model-owned qualification | Closed schemas, deterministic computation, and application validation now own the outcome. |
| P00 | Raw inspection and prompt-only sequencing | A frozen focused tool, exact-lead events, and downstream evidence gates now fail closed. |

---

*Auto-generated by carryforward. Direct edits allowed but may be overwritten.*
