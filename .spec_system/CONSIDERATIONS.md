# Considerations

> Institutional memory for AI assistants. Updated between phases via carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 02 (2026-08-11)

---

## Project Mission

Build a small production agent that qualifies a known lead, drafts a
follow-up, and stops at a human approval gate. Clarity, observability, and safe
recovery matter more than autonomy.

---

## Active Concerns

Items requiring attention in upcoming work. Review before each session.

### Technical Debt

- [P01] **Whole-run recovery**: Approval and fake-result projections survive
  restart, but the complete Pi run still lacks replay, resume, and bounded retry rules.
- [P01] **Single-process persistence**: Approval, event, and result JSONL files
  are separate logs with no OS/distributed lock or transaction; reservation-only
  fake state requires manual inspection and must never retry automatically.

### External Dependencies

- [P01] **Provider execution**: Deterministic gates need no model credential;
  provider-backed behavior remains operator-configured and needs separate evidence.
- [P01] **Production target**: Local image, health, and rate-gate checks pass,
  but no reachable Coolify URL, edge WAF, persistent restart, restore, or rollback exists.

### Performance / Security

- [P01] **Controlled exposure only**: `/runs` has a process-wide capacity gate
  but no authentication, authorization, tenant isolation, trusted proxy identity,
  distributed quota, or deployed WAF; it must not be public.
- [P01] **Synthetic-data restriction**: A manual 30-day-or-teardown whole-file
  rule exists, but automated retention, scoped erasure/export, backup/restore,
  subprocessors, lawful basis, and data-location controls do not.
- [P01] **Human write gate**: Fake execution is deliberately unregistered and
  unallowlisted. A repository maintainer must review the exact contract and diff
  before any future write-capable registration or allowlist change.

### Architecture

- [P01] **Durable truth over prose or audit events**: Approval records and fake
  results authorize state; operational events support evidence and repair only.
- [P01] **Frozen least privilege**: Production exposes exactly
  `qualify_lead`, `draft_follow_up`, and `request_send_approval`; internal fake
  execution has no Pi or HTTP edge and performs no network write.
- [P01] **Single-agent baseline**: Keep one bounded Pi session until measured
  success, safety, latency, or cost evidence justifies a typed handoff.
- [P01] **Recovery scope boundary**: Preserve exact ordered evidence for future
  recovery without inferring success, expiring indeterminate effects, or silently
  repairing corrupt logs.

---

## Lessons Learned

Proven patterns and anti-patterns. Reference during implementation.

### What Worked

- [P01] **Closed variants plus semantic guards**: Shape validation must be
  followed by time, identity, hash, ordering, and discriminant checks.
- [P01] **Contract-first RED/GREEN**: Missing exports and bypass cases expose
  intended boundaries before implementation and prevent silent scope drift.
- [P01] **Flush, re-read, then succeed**: File writes use private mode, final
  LF, `fsync`, close, and exact projection rebuild before reporting durable state.
- [P01] **State before evidence**: Persist authoritative approval/result truth
  first; a duplicate retry may repair missing minimized events without another
  transition or effect.
- [P01] **Exact identity at every layer**: Independently match requested,
  returned, persisted, projected, approved, and executed identifiers.
- [P01] **Identity-only write requests**: Caller/model input supplies bounded
  claims; executable target and content come only from immutable approved state.
- [P01] **Reservation before effect**: A synchronous durable claim precedes the
  fake adapter; an incomplete claim remains visibly indeterminate.
- [P01] **Application-owned deadlines**: Abort once, persist one terminal
  timeout, and suppress late settlement rather than accepting a second outcome.
- [P01] **Untrusted replaceable boundaries**: Runtime-validate adapter/store/
  event returns, canonicalize thrown values, and freeze service-owned inputs.
- [P01] **Domain-aware shared logs**: Ignore valid unrelated event domains but
  fail closed when either discriminant claims a malformed owned namespace.
- [P01] **Pre-construction validation**: Validate paths, actors, timeouts, and
  bounded environment values before creating files, directories, or listeners.
- [P01] **Provider-independent vertical slices**: Directly exercise actual
  tools and internal composition to prove event order, permission, restart,
  duplicate, timeout, and zero-network behavior.

### What to Avoid

- [P01] **Prompt order as authorization**: Model instructions cannot grant a
  decision, validate identity, or prove prior state.
- [P01] **Type signatures as runtime trust**: JavaScript dependencies can throw
  arbitrary values or return invalid shapes despite typed interfaces.
- [P01] **Shape-only projection**: Schema-valid evidence can still be stale,
  cross-run, duplicated, or out of order.
- [P01] **Automatic retry after an unknown effect**: A reservation without a
  result may already have caused an effect; stop for inspection.
- [P01] **Assuming separate logs are atomic**: Result, approval, and event files
  have explicit repair/indeterminate semantics, not transactional guarantees.
- [P01] **AI review as human permission**: Record autonomous review honestly;
  it never satisfies a maintainer-only write-capability gate.
- [P01] **Checkpoint as completion**: A pushed implementation is not complete
  until review, validation, PRD closeout, and transition evidence pass.

### Tool/Library Notes

- [P01] **TypeBox 1.3.10**: Closed objects, finite vocabularies, and compiled
  guards provide one source for static and runtime contracts.
- [P01] **Pi 0.83.0 tools**: The actual five-argument executor is directly
  testable; JSON content and typed details remain separate contracts.
- [P01] **TypeScript 7 checks**: File-specific commands need `--ignoreConfig`;
  repository checks should use `npm run check` or `npm run build`.
- [P01] **Biome 2.5.6**: Use the `recommended` linter preset plus separate
  fix/check scripts; formatting and linting are both in `npm run verify`.
- [P01] **Node.js 24 built-ins**: Native test coverage gates, `fetch` health
  probes, and the HTTP server avoid extra runtime dependencies.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item | Resolution |
|-------|------|------------|
| P02 | Unbounded whole Pi run | Validated deadline and model/tool step bounds now abort once, persist one bounded terminal, and ignore late settlement through injected provider-independent boundaries. |
| P01 | Event-only pending approval | Closed records, one-way transitions, private durable projection, exact draft linkage, internal decisions, and restart proof now own approval truth. |
| P00 | Model-owned qualification | Closed schemas, deterministic computation, and application validation now own the outcome. |
| P00 | Raw inspection and prompt-only sequencing | A frozen focused tool, exact-lead events, and downstream evidence gates now fail closed. |

---

*Auto-generated by carryforward. Direct edits allowed but may be overwritten.*
