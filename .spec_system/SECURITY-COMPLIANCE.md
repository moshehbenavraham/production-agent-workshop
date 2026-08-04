# Security and Compliance Record

> Internal maintainer record for implemented controls, current gaps, privacy
> status, and security-review evidence.
> **Line budget**: 1000 max | **Last reviewed**: 2026-08-04

Update this record after security-relevant changes and during phase
carryforward.

This file answers "what is true in the repository now?" It does not define the
public vulnerability-reporting channel, supported versions, response targets,
or research rules; those belong in the public [Security Policy](../SECURITY.md).
Future work belongs in the [ordered workshop tasks](../docs/todo/README_todo.md),
and a todo item is not a current control until its acceptance evidence exists.

## Current Posture

### Overall: RESTRICTED BASELINE

The repository is a bounded workshop starter, not a public-production-ready
service. It may be run with synthetic data in a local or otherwise controlled
environment. Public exposure and real customer data remain blocked by the open
items below.

| Area | Current status |
|------|----------------|
| Phase 00 task evidence | Not started; tasks `00` through `07` remain planned |
| Public release readiness | Blocked |
| Real customer data | Prohibited until its lifecycle and access controls are approved |
| External send capability | Not implemented |
| Security findings | No confirmed vulnerability; known release blockers remain open |
| GDPR applicability | Not assessed for real data; current fixtures are synthetic |

## Implemented Security Boundaries

The following controls exist in the current source and are also described as
the verified baseline in `docs/todo/README_todo.md`:

- `POST /runs` validates the `leadId` shape and rejects request bodies larger
  than 16,384 bytes before starting an agent run.
- One in-memory Pi session receives exactly three allowlisted custom tools:
  `inspect_lead`, `draft_follow_up`, and `request_send_approval`.
- The production session exposes no Pi shell or filesystem tool.
- No send adapter, send endpoint, approval-decision endpoint, or other
  network-writing application tool exists.
- A successful known-lead run creates a pending approval record, emits a visible
  `approval_pending` stop reason, and stops without sending.
- The application appends JSONL events with stable `eventId` and `runId` values;
  selected Pi lifecycle metadata is minimized before persistence.
- Lead fixtures are synthetic and committed in source. Pi working context is
  in memory, while event evidence is file-backed through `EVENT_LOG_PATH`.

These are repository controls, not claims about the authentication, network,
host, or secret-management configuration of an arbitrary deployment.

## Known Gaps and Planned Owners

Every row below is a limitation or release gate, not an implemented feature.
The linked task owns the implementation and acceptance evidence.

| Area | Current gap | Planned owner |
|------|-------------|---------------|
| Qualification | Qualification is model-led rather than a typed, application-validated result | [Task 01](../docs/todo/01-qualification-contract.md) |
| Approvals | Approval facts exist only as event data; decisions and durable transition rules do not exist | [Task 02](../docs/todo/02-durable-approvals.md) |
| External writes | No adapter exists; approval validation, exact-target resolution, and idempotency are not implemented | [Task 03](../docs/todo/03-idempotent-send.md) |
| Recovery | There is no event projection, safe resume path, maximum step count, or explicit run deadline | [Task 04](../docs/todo/04-recovery-and-replay.md) |
| Deployment gates | The five-case baseline is not the planned production golden set or critical safety gate | [Task 05](../docs/todo/05-production-evals.md) |
| Operations | Per-run cost, latency, alerting, operator query, and incident runbook are not implemented | [Task 06](../docs/todo/06-observability-and-incidents.md) |
| Public exposure | `/runs` has no authentication, authorization, tenant isolation, or rate limiting | [Task 07](../docs/todo/07-coolify-release.md) |
| Data lifecycle | Retention, redaction, export, deletion, backup, and restore rules are undecided | [Tasks 02, 04, and 07](../docs/todo/README_todo.md) |

## Non-Negotiable Change Constraints

### Secrets and Data

- Never read, print, log, or commit `.env`, provider keys, Pi auth files,
  browser state, production logs, or unrelated user files.
- Keep credentials out of source, fixtures, tests, events, images, and
  documentation.
- Treat HTTP input, model output, tool arguments, provider responses, and
  persisted records as untrusted.
- Use only synthetic data until retention, redaction, export, deletion, access,
  backup, and restore decisions are approved and implemented.
- Keep committed and runtime evidence to the minimum fields needed to explain
  an action or failure.

### Permissions and Effects

- Keep runtime tools narrow and explicitly allowlisted; do not enable Pi shell
  or filesystem tools in the production session.
- Do not give the model general `bash`, filesystem, CRM, deployment, or
  credential access.
- An external write requires application-owned authorization for the exact
  action and target, validation before the effect, and a stable idempotency
  result. Prompt wording and assistant prose are never authorization.
- Keep `/runs` and any future approval operation private until controls match
  the intended exposure.
- Do not publish or deploy from Codex unless the user explicitly requests it.

## Data and Privacy Inventory

| Data | Location and lifetime | Current assessment |
|------|-----------------------|--------------------|
| Synthetic lead fixtures | Committed in `src/tools.ts` | Test data only; must not be replaced with real leads yet |
| Lead and draft working context | Pi/provider session for one run | In memory locally; provider handling depends on operator configuration |
| Run and tool evidence | Append-only JSONL at `EVENT_LOG_PATH` | Persists `runId`, lead identifiers, outcomes, and selected lifecycle metadata |
| Draft and pending approval | Full synthetic draft is currently stored in domain and approval events | Acceptable only for synthetic exercises; minimization and lifecycle rules remain open |
| Provider credentials | External environment or supported Pi auth state | Must never enter repository files or event evidence |

### GDPR Status

The repository is not claiming GDPR compliance. Current committed fixtures are
synthetic, so no real data-subject processing has been established for the
workshop baseline. Before real lead, actor, recipient, draft, approval, or event
data is processed, the project must document purpose and lawful basis, access,
minimization, retention, redaction, export, erasure, backups, subprocessors,
data locations, and incident responsibilities. Those decisions are explicit
acceptance work in tasks `02`, `04`, and `07`.

## Dependency Security

- This is a dependency-bearing Node.js service; dependency security is not
  `N/A`.
- Production dependencies are pinned, and the lockfile contains intentional
  overrides and version-specific install-script approvals documented in
  `package.json` and `docs/CHANGELOG.md`.
- Release work must run `npm audit` against the effective npm 12 dependency
  tree and investigate every result. The last recorded audit in the changelog
  reported zero vulnerabilities for version `0.1.1`; that historical result is
  not a substitute for a current release audit.

## Open Release Blockers

| ID | Condition | Required disposition |
|----|-----------|----------------------|
| SC-001 | Publicly reachable run operations would lack authentication, authorization, tenant isolation, and rate limiting | Keep controlled; close through Task 07 evidence |
| SC-002 | Event records persist full synthetic drafts and have no approved lifecycle | Keep data synthetic; close through Tasks 02, 04, and 07 |
| SC-003 | Approval state and transitions are not durable | No send capability; close through Task 02 before adding a write boundary |
| SC-004 | Runs have no explicit deadline or maximum step count | Keep use controlled; close through Tasks 04 and 06 before public release |
| SC-005 | Restore, rollback, incident response, and operator access evidence do not yet exist | Close through Tasks 06 and 07 before release |

These blockers describe the known workshop baseline. A newly discovered defect
or an unexpected bypass should be handled through [SECURITY.md](../SECURITY.md),
not added here in place of private reporting.

## Change Security Checks

For every material change, verify that it:

- introduces no secret, real customer data, or unapproved external effect;
- preserves or intentionally tightens tool and process permissions;
- preserves application-owned approval for every external write;
- records attempts, outcomes, `runId`, and terminal stop reasons without
  unnecessary content;
- identifies changes to logging, persistence, retention, third-party transfer,
  network exposure, or deployment permissions;
- adds deterministic failure-path evidence when behavior changes;
- passes `npm run check`, `npm test`, and `npm run eval` before completion.

## Review History

| Date | Scope | Result |
|------|-------|--------|
| 2026-08-04 | Reconciled internal posture with source and ordered tasks; ran type-check, 4 tests, and 5 evals | All checks passed; restricted baseline and SC-001 through SC-005 remain open |

## Resolved Findings

*No findings have been resolved through Phase 00 task evidence yet.*
