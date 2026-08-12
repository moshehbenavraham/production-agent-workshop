# Considerations

> Institutional memory for AI assistants. Updated between phases via carryforward.
> **Line budget**: 600 max | **Last updated**: Phase 03 (2026-08-12)

---

## Project Mission

Build a small production agent that qualifies one known lead, drafts a
follow-up, and stops at a human approval gate. Clarity, observability, and safe
recovery matter more than autonomy.

---

## Active Concerns

### Technical Debt

- [P03] **Single-process persistence**: Approval, event, result, and eval JSONL
  files have no cross-process lock or transaction. Keep one replica; a
  reservation without a result requires human inspection and no automatic retry.
- [P03] **Manual workshop operations**: Deploy, pause, backup, restore, secret
  rotation, recovery, and rollback belong to the workshop owner. Automatic
  deploy is off; there is no scheduler, paging service, or disaster-recovery
  automation.

### External Dependencies

- [P03] **Provider behavior can change**: OpenAI completed the bounded smoke,
  but a historical provider failure stopped reproducing. Compare validated
  safety fields and durable events, use deterministic failure fallbacks, and do
  not treat model prose or one latency/cost observation as stable behavior.
- [P03] **Coolify API limits**: The controlled target is healthy and
  source-pinned, but Coolify 4.0.0-beta.463 cannot re-read the immutable image
  digest after recovery. Retain the earlier direct digest and never invent a
  second observation.

### Performance / Security

- [P03] **Controlled exposure only**: HTTP Basic Auth is sufficient for this
  private synthetic workshop, not public caller identity. `/runs` still lacks
  application authorization, tenant isolation, trusted proxy identity, shared
  principal quota, and a production WAF.
- [P03] **Synthetic-data restriction**: Private workstation backup, manual
  30-day-or-teardown retention, and exact restore are proved for synthetic
  files. Real data still needs lawful basis, minimization, access, transfer,
  encryption, automated lifecycle, export, erasure, and backup governance.
- [P01] **Human write gate**: Fake execution remains internal, unregistered,
  unallowlisted, and network-free. A maintainer must review the exact contract
  and permission diff before any future write-capable registration.

### Architecture

- [P03] **Durable truth over observations**: Approval records and fake results
  own authority. Reports, service snapshots, model/tool events, alerts, and
  deployment logs explain state but cannot grant permission or repair it.
- [P03] **Frozen least privilege**: Production Pi exposes exactly
  `qualify_lead`, `draft_follow_up`, and `request_send_approval`; it has no
  shell, filesystem, deployment, secret, approval-decision, or send tool.
- [P03] **Measured single-agent baseline**: The bounded single agent now has
  success, failure, latency, token, cost, explainability, recovery, and operator
  evidence. Phase 04 must compare one typed handoff and remove it unless the
  evidence shows material improvement.
- [P03] **Recovery scope boundary**: Preserve exact ordered evidence and stop on
  corrupt, conflicting, incomplete, or effect-indeterminate state. Never edit
  JSONL manually or infer success from a healthy process.

---

## Lessons Learned

### What Worked

- [P01] **Closed variants plus semantic guards**: Validate shape, time,
  identity, hashes, ordering, discriminants, and cross-field relationships.
- [P01] **Flush, re-read, then succeed**: Private durable files require final
  LF, `fsync`, close, and exact projection rebuild before reporting success.
- [P02] **One bounded terminal owner**: Count model/tool starts, abort once,
  persist one terminal, and suppress late provider settlement.
- [P02] **Pre-construction validation**: Validate paths, actors, timeouts,
  environment bounds, and replaceable callbacks before any side effect.
- [P02] **Project before and after recovery**: Load all authority first, repair
  only a known-safe missing terminal, and reproject before returning.
- [P02] **Critical truth before aggregate scores**: One safety mismatch remains
  release-blocking regardless of averages or optional quality grading.
- [P02] **Continue after bounded eval failure**: Preserve each failed case while
  running the rest so the complete mismatch set stays visible.
- [P02] **Serial source-break exercises**: Break one boundary, require red,
  restore the exact hash, require green, then continue.
- [P03] **Observation is not authority**: Four correlated layers and exact-run
  reports explain the system while retaining separate approval/effect truth.
- [P03] **Tagged availability prevents fake metrics**: Measured zero,
  unavailable, and not applicable need different closed states.
- [P03] **Validate before collecting**: Reject accessors, symbols, hostile
  prototypes, cycles, and invalid options before calling a metric dependency.
- [P03] **Safe report before cleanup**: Build the validated minimized report
  while isolated stores exist, then remove the temporary paths and raw records.
- [P03] **Reuse actual deterministic boundaries for drills**: The five incident
  exercises call existing golden cases instead of a weaker simulator.
- [P03] **Finite alerts remain actionable**: Closed thresholds, severity,
  suppression, evidence, and one safe action avoid unbounded labels and noise.
- [P03] **Pure release preflight separates policy from permission**: A 15-check
  ready result still fixes `targetMutationAllowed` to false.
- [P03] **Direct state beats mount claims**: Byte-identical event/approval files
  and rebuilt projections proved persistence across container replacement.
- [P03] **Stopped-writer off-server restore is enough for this workshop**: A
  private local computer, closed manifest, exact checksums, absent destination,
  and restored-service health give honest low-cost recovery evidence.
- [P03] **External failures need deterministic fallbacks**: When the historical
  provider regression changed, a nonexistent source revision proved a safe
  pre-replacement deployment failure.
- [P03] **Private in-container parity preserves exposure**: A temporary hook can
  compare exact safe behavior without exposing `/runs`; remove it afterward.
- [P03] **Plain language is operational safety**: Say what the workshop owner
  does, what the agent cannot do, and when to stop; avoid abstract role jargon.

### What To Avoid

- [P01] **Prose or automated review as authority**: Model text and AI review do
  not grant approval, prove state, or satisfy a maintainer permission gate.
- [P01] **Type signatures as runtime trust**: JavaScript dependencies can throw
  arbitrary values or return invalid shapes despite typed interfaces.
- [P01] **Shape-only projection**: Schema-valid evidence can still be stale,
  cross-run, duplicated, conflicting, or out of order.
- [P01] **Automatic retry after an unknown effect**: Reservation-only or
  attempted-without-result state always stops for inspection.
- [P01] **Assuming separate logs are atomic**: Approval, event, and result files
  have explicit repair/indeterminate semantics, not a transaction.
- [P03] **Healthy means public-ready**: Container health, HTTPS, Basic Auth, or
  a local capacity gate does not prove public identity or tenant safety.
- [P03] **Branch heads and mutable tags as release identity**: Deploy and recover
  from one saved full revision; keep automatic branch-head deployment off.

### Tool And Library Notes

- [P03] **TypeBox 1.3.10 plus TypeScript 7**: Closed schemas still require
  semantic guards, hostile-object rejection, exact cloning, and deep freeze.
- [P03] **Pi 0.83.0 provider identifiers are opaque**: Normalize supported
  separators for durable tool-call IDs without weakening the tool allowlist.
- [P03] **Layer local, CI, container, and live checks**: Biome, strict types,
  hooks, 374 tests, 18 evals, Integration CI, Docker, and Coolify prove different
  boundaries; none substitutes for the others.

---

## Resolved

Recently closed items; retain only the last two phases.

| Phase | Item | Resolution |
|-------|------|------------|
| P03 | Missing operator observability | Closed four-layer observations, exact-run report, seven alert rules, runbook, and five incident drills provide minimized actionable evidence. |
| P03 | Controlled target unproved | Exact revision/image evidence, HTTPS access gate, Docker health, Sentinel, provider smoke, and persistent replacement passed. |
| P03 | Off-server recovery unproved | Private workstation snapshot, exact absent-directory restore, restored-service activation, safe failed deployment, and source-pinned recovery passed. |
| P03 | Local/deployed parity and handoff | Exact safe behavior matched; the plain-English owner guide and five-minute demo passed review. |
| P02 | Production eval execution gate | The frozen 18-case suite persists minimized evidence and exits non-zero for every critical or operational failure. |
| P02 | Internal whole-run replay and resume | The recovery application resumes three exact checkpoints and escalates indeterminate effects without an adapter. |

---

*Auto-generated by carryforward. Direct edits allowed but may be overwritten.*
