# Architecture

## System Overview

The repository is one Node.js and TypeScript service. A small HTTP boundary
starts one bounded Pi session for a validated synthetic `leadId`. Pi can invoke
only three custom tools; application code validates qualification, downstream
evidence, event ordering, and visible stop reasons. The run stops at a pending
human approval and has no exposed external-write capability. A separate
Pi-independent `SafeWriteApplication` composes durable approval and an in-
process fake action with durable idempotency, but it is not composed into the
server or agent runtime.

```mermaid
flowchart LR
    Caller[Controlled caller] -->|GET /health or POST /runs| Server[src/server.ts]
    Server -->|POST /runs| RateGate[src/rate-limit.ts]
    RateGate -->|admitted validated leadId| Agent[src/pi-agent.ts]
    Agent <-->|model messages| Provider[Configured model provider]
    Agent -->|frozen allowlist| Tools[src/tools.ts]
    Tools --> Qualify[src/qualification.ts]
    Qualify --> Leads[src/leads.ts synthetic fixtures]
    Agent --> Events[src/event-store.ts]
    Tools --> Events
    Events --> EventLog[(JSONL at EVENT_LOG_PATH)]
    Tools --> ApprovalService[src/approval-service.ts]
    Internal[Internal synthetic operator] --> SafeWrite[src/safe-write-application.ts]
    SafeWrite --> ApprovalService
    ApprovalService --> ApprovalStore[src/approval-store.ts]
    ApprovalService --> Events
    ApprovalStore --> ApprovalLog[(JSONL at APPROVAL_LOG_PATH)]
    Events --> QualificationProjection[Qualification projection]
    ApprovalStore --> ApprovalProjection[Approval projection]
    QualificationProjection --> Agent
    ApprovalProjection --> Agent
    Agent --> Result[RunResult]
    Result --> Server
    Server --> Caller
    Tools -->|request only| Human[Human approval boundary]
    Human -. no public decision or send endpoint .-> Stop[Stop]
    SafeWrite --> FakeAuth[src/fake-send.ts]
    FakeAuth --> ApprovalStore
    FakeAuth --> FakeService[src/fake-send-service.ts]
    FakeService --> FakeStore[(Injected fake-result JSONL path)]
    FakeService --> FakeAdapter[Deterministic in-process fake adapter]
    FakeService --> Events
    Server -. no route .- FakeService
    Agent -. no tool .- FakeService
```

## Components

| Component | Location | Technology | Purpose |
|-----------|----------|------------|---------|
| HTTP boundary | `src/server.ts` | Node.js HTTP | Health, process-wide rate gate, body limit, `leadId` validation, response mapping |
| Rate gate | `src/rate-limit.ts` | Deterministic TypeScript | Fail-fast bounded configuration and process-wide fixed-window `/runs` admission |
| Pi orchestration | `src/pi-agent.ts` | Pi Coding Agent SDK | Session lifecycle, frozen tool allowlist, qualification events, durable approval projection |
| Qualification domain | `src/qualification.ts` | TypeBox + TypeScript | Closed schemas, runtime validation, deterministic result, canonical failures |
| Custom tools | `src/tools.ts` | Pi tool definitions | Bounded qualification, deterministic draft, exact durable approval request |
| Approval domain/service | `src/approval.ts`, `src/approval-service.ts` | TypeBox + TypeScript | Closed state, actor policy, durable request/decision operations, minimized events |
| Approval store | `src/approval-store.ts` | Append-only JSONL projection | Authoritative pending/terminal records at configured path |
| Safe-write composition | `src/safe-write-application.ts` | Internal TypeScript application boundary | Shares approval/event truth, snapshots actor permissions, and delegates fake execution without a transport |
| Fake authorization/execution | `src/fake-send.ts`, `src/fake-send-service.ts`, `src/fake-send-adapter.ts` | TypeBox + TypeScript | Internal exact-action authorization, reservation-first orchestration, timeout, and deterministic fake outcome |
| Fake result store | `src/fake-send-result.ts`, `src/fake-send-store.ts`, `src/fake-send-execution.ts` | Append-only JSONL projection | Internal reservation/result contracts, restart projection, and duplicate original-result replay |
| Synthetic lead source | `src/leads.ts` | In-memory TypeScript data | Exact lookup for classroom fixtures only |
| Event store | `src/event-store.ts` | Append-only JSONL | Correlated durable evidence by `runId` |
| Deterministic gates | `tests/`, `src/evals.ts` | `node:test` + TSX | Contract, failure, permission, event, and vertical-slice verification |
| Container boundary | `Dockerfile` | Node.js 24 Alpine | Port 3000, `/app/data`, process start, and container health probe |
| Code Quality CI | `.github/workflows/quality.yml` | GitHub Actions | Locked install, formatting, linting, and strict TypeScript |
| Build & Test CI | `.github/workflows/test.yml` | GitHub Actions | TypeScript build, 156 tests with coverage thresholds, and five evals |

## Run And Evidence Flow

1. `POST /runs` consumes one process-wide rate slot, then accepts JSON under
   16,384 bytes and validates the `leadId` string pattern before starting Pi.
2. The application creates a `runId`, appends `run.started`, and closes the
   three tools over the exact requested identifier and event store.
3. `qualify_lead` validates input, applies a 1,000 ms application deadline,
   and appends one attempt plus exactly one schema-owned terminal event.
4. `draft_follow_up` records only draft identity/hash; `request_send_approval`
   verifies exact temporary content after the latest qualification and delegates
   durable creation to the application service.
5. The application reconstructs qualification from events, reads exact approval
   state from the durable projection, derives one finite stop reason, appends
   `run.completed`, and returns `RunResult`.
6. Any uncaught run failure appends `run.failed`; the HTTP boundary maps it to
   a 503 response. Whole-run replay and resume are not implemented.

## Trust And Permission Boundaries

| Boundary | Application rule |
|----------|------------------|
| HTTP admission | Rate-limit globally before body parsing or Pi work; do not trust forwarding headers as caller identity |
| HTTP input | Validate body size and `leadId` before starting Pi |
| Model/tool input | Treat as untrusted; enforce closed schemas and exact identity |
| Lookup result | Runtime-validate the complete synthetic lead and identity |
| Qualification result | Accept only a schema-valid application-owned outcome |
| Persisted event | Validate type-specific data, identity, freshness, and ordering before qualification projection |
| Draft creation | Require latest matching qualification success |
| Approval request | Exact current draft delegates to durable application state; Pi never decides or sends |
| Approval decision | Internal application service validates exact identity and synthetic actor policy |
| Internal fake write | `SafeWriteApplication` snapshots synthetic actor sets, then delegates exact durable authorization and reservation-first execution |
| External write | Runtime-forbidden: permission decision keeps fake execution unregistered/unallowlisted; no Pi/HTTP entrypoint or real adapter exists |

The production tool names are frozen at runtime. Pi has no shell, filesystem,
credential, deployment, approval-decision, or network-writing tool.

## Data And Persistence

- Synthetic lead fixtures are committed in `src/leads.ts`.
- Pi conversation state is in memory for one run.
- Events append to `EVENT_LOG_PATH`, defaulting to `./data/events.jsonl` and
  set to `/app/data/events.jsonl` in the image.
- Authoritative approval records append to `APPROVAL_LOG_PATH`, defaulting to
  `./data/approvals.jsonl` and set under `/app/data` in the image.
- The internal safe-write application accepts explicitly injected approval,
  event, and fake-result JSONL paths. It is exercised only by tests/library
  callers and has no server runtime path or environment-variable composition.
- Qualification events exclude lead profile text and caught dependency detail.
- Draft and approval events exclude full content; approval records retain exact
  synthetic draft content/hash under the documented manual lifecycle rule.
- There is no database, queue, cache, backup, per-record erasure, distributed
  lock, or whole-run replay engine.

## Deployment Topology

The locally validated image contains one Node.js process, port 3000, a declared
`/app/data` volume, a Docker `HEALTHCHECK` for `/health`, and a process-wide
fixed-window `/runs` gate. Coolify is the intended hosting boundary, but no
production URL, WAF, caller identity, shared limiter, persistence proof,
restore, or rollback has been validated.

## Key Decisions

- Keep one bounded Pi session until measured evidence justifies another stage.
- Keep deterministic schemas, permissions, durable truth, and effect controls
  in application code rather than prompts.
- Keep the internal fake-write composition disconnected from Pi and HTTP until
  a repository maintainer performs the separately required human review; the
  current decision is to leave it unregistered and unallowlisted.
- Use append-only events as evidence and rebuild typed projections from them.
- Keep the required workshop path synthetic and no-send.

Detailed rationale and Mermaid traces are in the
[Week 1 Build Log](./build-log-week1.md).
Living risks and constraints are in
[Considerations](../.spec_system/CONSIDERATIONS.md) and
[Security and Compliance](../.spec_system/SECURITY-COMPLIANCE.md). New decisions
should use the [ADR template](./adr/0000-template.md).
