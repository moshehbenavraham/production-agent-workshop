# Considerations

> Institutional memory for AI assistants. Updated between phases via carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 02 (2026-08-12)

---

## Project Mission

Build a small production agent that qualifies a known lead, drafts a
follow-up, and stops at a human approval gate. Clarity, observability, and safe
recovery matter more than autonomy.

---

## Active Concerns

Items requiring attention in upcoming work. Review before each session.

### Technical Debt

- [P02] **Single-process persistence**: Approval, event, result, and eval JSONL
  files have no OS/distributed lock or transaction; reservation-only fake state
  requires manual inspection and must never retry automatically.

### External Dependencies

- [P01] **Provider execution**: Deterministic gates need no model credential;
  provider-backed behavior remains operator-configured and needs separate evidence.
- [P02] **Production target**: Local image, health, rate, and offline snapshot/
  restore checks pass, but no Coolify URL, edge WAF, persistent restart,
  off-server schedule, restore activation, or rollback evidence exists.

### Performance / Security

- [P01] **Controlled exposure only**: `/runs` has a process-wide capacity gate
  but no authentication, authorization, tenant isolation, trusted proxy identity,
  distributed quota, or deployed WAF; it must not be public.
- [P02] **Synthetic-data restriction**: A manual 30-day-or-teardown rule and
  stopped-writer snapshot CLI exist, but automated retention, scoped rights,
  off-server backup, subprocessors, lawful basis, and data-location controls do not.
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
- [P02] **Recovery scope boundary**: Preserve exact ordered evidence for future
  public/distributed recovery without inferring success, expiring indeterminate
  effects, or silently repairing corrupt logs.

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
- [P01] **Authoritative state and exact identity before evidence**: Persist
  approval/result truth first and independently match requested, returned,
  persisted, projected, approved, and executed identities before event repair.
- [P01] **Identity-only write requests**: Caller/model input supplies bounded
  claims; executable target and content come only from immutable approved state.
- [P01] **Reservation before effect**: A synchronous durable claim precedes the
  fake adapter; an incomplete claim remains visibly indeterminate.
- [P02] **One bounded terminal owner**: Filter provider noise before durable
  writes; charge only model/tool starts, abort once, persist one terminal, and
  suppress late settlement rather than accepting a second outcome.
- [P01] **Untrusted replaceable boundaries**: Runtime-validate adapter/store/
  event returns, canonicalize thrown values, and freeze service-owned inputs.
- [P01] **Domain-aware shared logs**: Ignore valid unrelated event domains but
  fail closed when either discriminant claims a malformed owned namespace.
- [P01] **Pre-construction validation**: Validate paths, actors, timeouts, and
  bounded environment values before creating files, directories, or listeners.
- [P01] **Provider-independent vertical slices**: Directly exercise actual
  tools and internal composition to prove event order, permission, restart,
  duplicate, timeout, and zero-network behavior.
- [P02] **Hash-anchored replaceable context**: Durable draft identity/hash can
  safely anchor post-restart content without placing the full draft in
  operational events; mismatched or missing content must escalate.
- [P02] **Project before and after recovery writes**: Load all authority before
  mutation, repair only a known-safe missing terminal, and reproject before
  returning a recovered outcome.
- [P02] **Predeclare eval evidence**: Case definitions name tools, arguments,
  event order, authority, effects, recovery, terminal, and output claims before
  execution, which prevents scorecards from redefining success after a run.
- [P02] **Tagged metric availability**: An unavailable latency, token, or cost
  value is a finite reason plus `null`, while measured zero remains an explicit
  available value; pending thresholds never masquerade as passing zeros.
- [P02] **Critical truth before persistence**: Revalidate exact suite/case
  membership, derive results and aggregates only from closed observations, and
  require an exact append/flush/re-read artifact before a gate may exit zero.
- [P02] **Continue after case failure**: A failed or malformed case becomes
  bounded failure evidence while all remaining cases execute, keeping passing
  cases and every mismatch visible in one scorecard.
- [P02] **Serial source-break exercises**: Record safe snippets and hashes,
  change one boundary in an uncommitted tree, require the actual gate to fail,
  restore with an explicit patch, prove hash equality, and return fully green
  before touching another boundary.
- [P02] **Offline snapshots are closed recovery evidence**: Stop every writer,
  validate complete JSONL, hash a closed private manifest, and restore only to
  an absent directory; local copies do not prove off-server backup readiness.

### What to Avoid

- [P01] **Prose or automated review as authority**: Prompt order, model text,
  and AI review cannot grant a decision, prove prior state, or satisfy a
  maintainer-only permission gate.
- [P01] **Type signatures as runtime trust**: JavaScript dependencies can throw
  arbitrary values or return invalid shapes despite typed interfaces.
- [P01] **Shape-only projection**: Schema-valid evidence can still be stale,
  cross-run, duplicated, or out of order.
- [P01] **Automatic retry after an unknown effect**: A reservation without a
  result may already have caused an effect; stop for inspection.
- [P01] **Assuming separate logs are atomic**: Result, approval, and event files
  have explicit repair/indeterminate semantics, not transactional guarantees.
- [P01] **Checkpoint as completion**: A pushed implementation is not complete
  until review, validation, PRD closeout, and transition evidence pass.
- [P02] **Averages as safety gates**: One critical boundary failure must remain
  visible regardless of quality averages or optional model grading.

### Tool/Library Notes

- [P02] **TypeBox 1.3.10 plus TypeScript 7**: Closed objects, finite
  vocabularies, semantic guards, and strict checks provide static and runtime
  contracts; file-specific TypeScript checks require `--ignoreConfig`.
- [P01] **Pi 0.83.0 tools**: The actual five-argument executor is directly
  testable; JSON content and typed details remain separate contracts.
- [P02] **Layer local and CI guards**: Biome `recommended`, exact Husky/lint-
  staged hooks, immutable workflow pins, full-history secret scanning, and
  dependency review complement but never replace `npm run verify`.
- [P02] **Node.js 24 built-ins**: Native coverage can scope metrics to `src/**`
  while still running subprocess CLI tests; crypto, durable filesystem calls,
  `fetch` health probes, and HTTP need no extra runtime package.

---

## Resolved

Recently closed items (buffer - rotates out after 2 phases).

| Phase | Item | Resolution |
|-------|------|------------|
| P02 | Named boundary regression evidence | Three isolated source breaks proved unknown-lead grounding, false-completion output, and approval-bypass controls fail the 18-case gate non-zero; every safe source hash was exactly restored and one permanent regression covers all three. |
| P02 | Eval execution gate | The frozen 18-case suite now executes through deterministic production boundaries, persists a minimized private artifact, renders bounded failures, and exits non-zero for every critical or operational evidence failure. |
| P02 | Internal whole-run replay and resume | A closed provider-independent recovery application resumes qualification, draft, and approval checkpoints under the same run identity, reuses exact approval authority, and escalates any indeterminate effect without an adapter. |
| P02 | Unbounded whole Pi run | Validated deadline and model/tool step bounds now abort once, persist one bounded terminal, and ignore late settlement through injected provider-independent boundaries. |
| P02 | No repository snapshot mechanism | A stopped-writer CLI now validates and durably snapshots private JSONL with a closed SHA-256 manifest, then verifies exact restore into an absent directory locally and in Docker. |
| P01 | Event-only pending approval | Closed records, one-way transitions, private durable projection, exact draft linkage, internal decisions, and restart proof now own approval truth. |

---

*Auto-generated by carryforward. Direct edits allowed but may be overwritten.*
