import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import Schema from "typebox/schema";
import { ApprovalService } from "../src/approval-service.js";
import { FileApprovalStore } from "../src/approval-store.js";
import { JsonlEventStore } from "../src/event-store.js";
import type { AgentEvent } from "../src/run-event.js";
import {
  isQualificationOutcome,
  qualifyLead,
  type QualificationOutcome,
} from "../src/qualification.js";
import {
  QUALIFICATION_TIMEOUT_MS,
  buildTools,
  executeQualification,
  qualificationOutcomeFromEvents,
} from "../src/tools.js";
import { readRunEvents } from "./run-event-test-helpers.js";

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createStore(): {
  runId: string;
  store: JsonlEventStore;
  approvalService: ApprovalService;
  approvalPath: string;
  eventPath: string;
} {
  const directory = mkdtempSync(join(tmpdir(), "qualification-tool-"));
  temporaryDirectories.push(directory);
  const approvalPath = join(directory, "approvals.jsonl");
  const eventPath = join(directory, "events.jsonl");
  const store = new JsonlEventStore(eventPath);
  return {
    runId: "run_qualification_test",
    store,
    approvalPath,
    eventPath,
    approvalService: new ApprovalService(new FileApprovalStore(approvalPath), store, {
      authorizedActorIds: new Set(["actor_workshop_reviewer"]),
      makeApprovalId: () => "approval_tool_test_001",
      now: () => "2026-08-04T10:00:00.000Z",
    }),
  };
}

async function executeTool<TParams>(
  tool: {
    execute: (
      toolCallId: string,
      params: TParams,
      signal: AbortSignal | undefined,
      onUpdate: undefined,
      context: never,
    ) => Promise<{ content: Array<{ type: string; text?: string }>; details: unknown }>;
  },
  params: TParams,
) {
  return tool.execute("tool_call_test", params, undefined, undefined, undefined as never);
}

test("production qualification tool has the exact closed schema and deadline", () => {
  const { runId, store, approvalService } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(
    runId,
    "lead_ada",
    store,
    approvalService,
  );
  const inputValidator = Schema.Compile(qualificationTool.parameters);

  assert.equal(QUALIFICATION_TIMEOUT_MS, 1_000);
  assert.deepEqual(
    [qualificationTool.name, draftTool.name, approvalTool.name],
    ["qualify_lead", "draft_follow_up", "request_send_approval"],
  );
  assert.equal(inputValidator.Check({ leadId: "lead_ada" }), true);
  assert.equal(inputValidator.Check({}), false);
  assert.equal(inputValidator.Check({ leadId: "Ada" }), false);
  assert.equal(inputValidator.Check({ leadId: "lead_ada", fit: "strong" }), false);
});

test("known qualification records one minimized attempt and completion", async () => {
  const { runId, store } = createStore();
  const outcome = await executeQualification(runId, "lead_ada", store, {
    leadId: "lead_ada",
  });

  assert.equal(outcome.ok, true);
  assert.equal(isQualificationOutcome(outcome), true);
  assert.deepEqual(outcome, qualifyLead({ leadId: "lead_ada" }));

  const events = readRunEvents(store, runId);
  assert.deepEqual(
    events.map((event) => event.type),
    ["qualification.attempted", "qualification.completed"],
  );
  assert.deepEqual(events[0]?.data, {
    eventType: "qualification.attempted",
    leadId: "lead_ada",
  });
  assert.deepEqual(events[1]?.data, {
    eventType: "qualification.completed",
    result: outcome.ok ? outcome.value : undefined,
  });
  assert.equal(
    JSON.stringify(events).includes("Northstar Ops") ||
      JSON.stringify(events).includes("Support triage"),
    false,
  );
  assert.deepEqual(qualificationOutcomeFromEvents(events, "lead_ada"), outcome);
});

test("raw wrapper records missing and malformed failures without raw input", async () => {
  for (const [input, code] of [
    [{}, "missing_lead_id"],
    [{ leadId: "Ada" }, "malformed_lead_id"],
  ] as const) {
    const { runId, store } = createStore();
    const outcome = await executeQualification(runId, "lead_ada", store, input);

    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail(`Expected ${code}`);
    assert.equal(outcome.error.code, code);
    const events = readRunEvents(store, runId);
    assert.deepEqual(
      events.map((event) => event.type),
      ["qualification.attempted", "qualification.failed"],
    );
    assert.deepEqual(events[0]?.data, { eventType: "qualification.attempted" });
    assert.deepEqual(events[1]?.data, {
      eventType: "qualification.failed",
      error: outcome.error,
    });
  }
});

test("cross-lead qualification is rejected before the executor", async () => {
  const { runId, store } = createStore();
  let executorCalled = false;
  const outcome = await executeQualification(
    runId,
    "lead_ada",
    store,
    { leadId: "lead_grace" },
    {
      qualificationExecutor: () => {
        executorCalled = true;
        return qualifyLead({ leadId: "lead_grace" });
      },
    },
  );

  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected cross-lead failure");
  assert.equal(outcome.error.code, "invalid_input");
  assert.equal(executorCalled, false);
  assert.deepEqual(readRunEvents(store, runId)[0]?.data, {
    eventType: "qualification.attempted",
    leadId: "lead_grace",
  });
});

test("unknown lead records structured not-found failure", async () => {
  const { runId, store } = createStore();
  const outcome = await executeQualification(runId, "lead_unknown", store, {
    leadId: "lead_unknown",
  });

  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected not found");
  assert.equal(outcome.error.code, "lead_not_found");
  assert.deepEqual(
    readRunEvents(store, runId).map((event) => event.type),
    ["qualification.attempted", "qualification.failed"],
  );
  assert.deepEqual(
    qualificationOutcomeFromEvents(readRunEvents(store, runId), "lead_unknown"),
    outcome,
  );
});

test("throwing, rejecting, invalid, and cross-lead executors become redacted failures", async () => {
  const executors = [
    () => {
      throw new Error("sensitive synchronous detail");
    },
    async () => {
      throw new Error("sensitive asynchronous detail");
    },
    () => ({ ok: true, value: { fit: "invented" } }) as unknown,
    () => qualifyLead({ leadId: "lead_grace" }),
  ];

  for (const qualificationExecutor of executors) {
    const { runId, store } = createStore();
    const outcome = await executeQualification(
      runId,
      "lead_ada",
      store,
      { leadId: "lead_ada" },
      { qualificationExecutor },
    );

    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected redacted executor failure");
    assert.equal(outcome.error.code, "lead_lookup_failed");
    assert.equal(outcome.error.message, "Lead lookup failed.");
    assert.doesNotMatch(JSON.stringify(readRunEvents(store, runId)), /sensitive|invented/);
    assert.equal(readRunEvents(store, runId).length, 2);
  }
});

test("executor failure fields are canonicalized by the application", async () => {
  const { runId, store } = createStore();
  const outcome = await executeQualification(
    runId,
    "lead_ada",
    store,
    { leadId: "lead_ada" },
    {
      qualificationExecutor: () => ({
        ok: false,
        error: {
          code: "lead_not_found",
          message: "Sensitive dependency claim.",
          retryable: true,
        },
      }),
    },
  );

  assert.deepEqual(outcome, {
    ok: false,
    error: {
      code: "lead_not_found",
      message: "No lead exists for the requested leadId.",
      retryable: false,
    },
  });
  assert.doesNotMatch(JSON.stringify(readRunEvents(store, runId)), /Sensitive/);
});

test("timeout wins once and a late result cannot append another event", async () => {
  const { runId, store } = createStore();
  let resolveExecutor: ((outcome: QualificationOutcome) => void) | undefined;
  const pending = new Promise<QualificationOutcome>((resolve) => {
    resolveExecutor = resolve;
  });

  const outcome = await executeQualification(
    runId,
    "lead_ada",
    store,
    { leadId: "lead_ada" },
    { qualificationExecutor: () => pending, timeoutMs: 5 },
  );

  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected timeout");
  assert.equal(outcome.error.code, "qualification_timeout");
  assert.equal(readRunEvents(store, runId).length, 2);

  resolveExecutor?.(qualifyLead({ leadId: "lead_ada" }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(
    readRunEvents(store, runId).map((event) => event.type),
    ["qualification.attempted", "qualification.failed"],
  );
});

test("invalid timeout configuration fails before an event lifecycle starts", async () => {
  const { runId, store } = createStore();

  await assert.rejects(
    executeQualification(runId, "lead_ada", store, { leadId: "lead_ada" }, { timeoutMs: 0 }),
    /positive finite number/,
  );
  assert.deepEqual(readRunEvents(store, runId), []);
});

test("repeated qualification is deterministic and records one pair per call", async () => {
  const { runId, store } = createStore();
  const first = await executeQualification(runId, "lead_ada", store, {
    leadId: "lead_ada",
  });
  const second = await executeQualification(runId, "lead_ada", store, {
    leadId: "lead_ada",
  });

  assert.deepEqual(first, second);
  assert.deepEqual(
    readRunEvents(store, runId).map((event) => event.type),
    [
      "qualification.attempted",
      "qualification.completed",
      "qualification.attempted",
      "qualification.completed",
    ],
  );
});

test("draft and approval deny missing, failed, and cross-lead qualification", async () => {
  const { runId, store, approvalService } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(
    runId,
    "lead_ada",
    store,
    approvalService,
  );

  const draftBefore = await executeTool(draftTool, {
    leadId: "lead_ada",
    angle: "A deterministic support workflow",
  });
  const approvalBefore = await executeTool(approvalTool, {
    leadId: "lead_ada",
    draft: "This is a sufficiently long unqualified draft.",
  });
  assert.deepEqual(draftBefore.details, {
    created: false,
    draft: null,
    draftId: null,
    sha256: null,
    code: "qualification_required",
  });
  assert.deepEqual(approvalBefore.details, {
    created: false,
    approval: null,
    code: "qualification_required",
  });
  assert.equal(readRunEvents(store, runId).length, 0);

  await executeTool(qualificationTool, { leadId: "lead_grace" });
  const draftAfterMismatch = await executeTool(draftTool, {
    leadId: "lead_grace",
    angle: "A deterministic support workflow",
  });
  const approvalAfterMismatch = await executeTool(approvalTool, {
    leadId: "lead_grace",
    draft: "This is a sufficiently long cross-lead draft.",
  });
  assert.equal((draftAfterMismatch.details as { created: boolean }).created, false);
  assert.equal((approvalAfterMismatch.details as { created: boolean }).created, false);
  assert.equal(
    readRunEvents(store, runId).some((event) => event.type === "domain.follow_up_drafted"),
    false,
  );
  assert.equal(
    readRunEvents(store, runId).some((event) => event.type === "approval.requested"),
    false,
  );
});

test("draft and approval deny an exact-lead qualification failure", async () => {
  const { runId, store, approvalService } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(
    runId,
    "lead_unknown",
    store,
    approvalService,
  );

  const qualificationResult = await executeTool(qualificationTool, {
    leadId: "lead_unknown",
  });
  assert.equal((qualificationResult.details as QualificationOutcome).ok, false);
  assert.deepEqual(
    JSON.parse(qualificationResult.content[0]?.text ?? "null"),
    qualificationResult.details,
  );

  const draftResult = await executeTool(draftTool, {
    leadId: "lead_unknown",
    angle: "A deterministic support workflow",
  });
  const approvalResult = await executeTool(approvalTool, {
    leadId: "lead_unknown",
    draft: "This is a sufficiently long failed-lead draft.",
  });

  assert.equal((draftResult.details as { created: boolean }).created, false);
  assert.equal((approvalResult.details as { created: boolean }).created, false);
  assert.deepEqual(
    readRunEvents(store, runId).map((event) => event.type),
    ["qualification.attempted", "qualification.failed"],
  );
});

test("known lead completes deterministic qualification-to-approval vertical slice", async () => {
  const { runId, store, approvalService } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(
    runId,
    "lead_ada",
    store,
    approvalService,
  );

  const qualificationResult = await executeTool(qualificationTool, {
    leadId: "lead_ada",
  });
  const qualification = qualificationResult.details as QualificationOutcome;
  assert.equal(qualification.ok, true);
  assert.deepEqual(JSON.parse(qualificationResult.content[0]?.text ?? "null"), qualification);

  const draftResult = await executeTool(draftTool, {
    leadId: "lead_ada",
    angle: "An auditable support triage workflow",
  });
  const draft = (draftResult.details as { draft: string | null }).draft;
  assert.ok(draft);

  const approvalResult = await executeTool(approvalTool, {
    leadId: "lead_ada",
    draft,
  });
  assert.equal(
    (approvalResult.details as { approval?: { status?: string } }).approval?.status,
    "pending",
  );

  const events = readRunEvents(store, runId);
  assert.deepEqual(
    events.map((event) => event.type),
    [
      "qualification.attempted",
      "qualification.completed",
      "domain.follow_up_drafted",
      "approval.requested",
    ],
  );
  assert.equal(
    events.every((event) => event.runId === runId),
    true,
  );
  assert.deepEqual(qualificationOutcomeFromEvents(events, "lead_ada"), qualification);
  assert.equal(
    events.some((event) => /sent/i.test(event.type)),
    false,
  );
  const drafted = events.find((event) => event.data.eventType === "domain.follow_up_drafted");
  assert.ok(drafted);
  if (drafted.data.eventType !== "domain.follow_up_drafted") {
    assert.fail("Expected drafted event payload");
  }
  assert.equal(typeof drafted.data.draftId, "string");
  assert.match(drafted.data.sha256, /^[0-9a-f]{64}$/);
  assert.equal("draft" in (drafted?.data ?? {}), false);
  assert.equal(JSON.stringify(drafted).includes(draft), false);
});

test("approval rejects altered and stale drafts before durable creation", async () => {
  for (const mode of ["altered", "stale"] as const) {
    const { runId, store, approvalService } = createStore();
    const [qualificationTool, draftTool, approvalTool] = buildTools(
      runId,
      "lead_ada",
      store,
      approvalService,
    );
    await executeTool(qualificationTool, { leadId: "lead_ada" });
    const drafted = await executeTool(draftTool, {
      leadId: "lead_ada",
      angle: "An auditable support triage workflow",
    });
    const draft = (drafted.details as { draft: string | null }).draft;
    assert.ok(draft);
    if (mode === "stale") {
      await executeTool(qualificationTool, { leadId: "lead_ada" });
    }

    const approval = await executeTool(approvalTool, {
      leadId: "lead_ada",
      draft: mode === "altered" ? `${draft}\nAltered by model.` : draft,
    });
    assert.deepEqual(approval.details, {
      created: false,
      approval: null,
      code: "draft_mismatch",
    });
    assert.deepEqual(approvalService.listRun(runId), { ok: true, value: [] });
    assert.equal(
      readRunEvents(store, runId).some((event) => event.type.startsWith("approval.")),
      false,
    );
  }
});

test("tool-created pending and internal terminal state survive independent services", async () => {
  const { runId, store, approvalService, approvalPath, eventPath } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(
    runId,
    "lead_ada",
    store,
    approvalService,
  );
  await executeTool(qualificationTool, { leadId: "lead_ada" });
  const drafted = await executeTool(draftTool, {
    leadId: "lead_ada",
    angle: "An auditable support triage workflow",
  });
  const draft = (drafted.details as { draft: string | null }).draft;
  assert.ok(draft);
  const requested = await executeTool(approvalTool, { leadId: "lead_ada", draft });
  const approval = (requested.details as { approval: { approvalId: string } | null }).approval;
  assert.ok(approval);

  const decisionService = new ApprovalService(
    new FileApprovalStore(approvalPath),
    new JsonlEventStore(eventPath),
    {
      authorizedActorIds: new Set(["actor_workshop_reviewer"]),
      now: () => "2026-08-04T10:01:00.000Z",
    },
  );
  const decided = decisionService.decideApproval({
    approvalId: approval.approvalId,
    runId,
    actorId: "actor_workshop_reviewer",
    decision: "approved",
  });
  if (!decided.ok) assert.fail(decided.error.message);
  const restarted = new ApprovalService(
    new FileApprovalStore(approvalPath),
    new JsonlEventStore(eventPath),
  );
  assert.deepEqual(restarted.get(approval.approvalId), {
    ok: true,
    value: decided.value,
  });
  assert.equal(readFileSync(approvalPath, "utf8").split("\n").filter(Boolean).length, 2);
  assert.deepEqual(
    readRunEvents(store, runId).map((event) => event.type),
    [
      "qualification.attempted",
      "qualification.completed",
      "domain.follow_up_drafted",
      "approval.requested",
      "approval.approved",
    ],
  );
});

test("approval storage outage returns typed tool refusal and minimized evidence", async () => {
  const directory = mkdtempSync(join(tmpdir(), "qualification-tool-failure-"));
  temporaryDirectories.push(directory);
  const runId = "run_qualification_failure";
  const store = new JsonlEventStore(join(directory, "events.jsonl"));
  const approvalService = new ApprovalService(
    new FileApprovalStore(join(directory, "approvals.jsonl"), {
      writeRecord: () => {
        throw new Error("sensitive durable write detail");
      },
    }),
    store,
    {
      authorizedActorIds: new Set(["actor_workshop_reviewer"]),
      makeApprovalId: () => "approval_tool_failure_001",
      now: () => "2026-08-04T10:00:00.000Z",
    },
  );
  const [qualificationTool, draftTool, approvalTool] = buildTools(
    runId,
    "lead_ada",
    store,
    approvalService,
  );
  await executeTool(qualificationTool, { leadId: "lead_ada" });
  const drafted = await executeTool(draftTool, {
    leadId: "lead_ada",
    angle: "An auditable support triage workflow",
  });
  const draft = (drafted.details as { draft: string | null }).draft;
  assert.ok(draft);
  const requested = await executeTool(approvalTool, { leadId: "lead_ada", draft });

  assert.deepEqual(requested.details, {
    created: false,
    approval: null,
    code: "storage_failure",
  });
  assert.deepEqual(
    readRunEvents(store, runId).map((event) => event.type),
    [
      "qualification.attempted",
      "qualification.completed",
      "domain.follow_up_drafted",
      "approval.storage_failed",
    ],
  );
  assert.doesNotMatch(JSON.stringify(readRunEvents(store, runId)), /sensitive|Hi Ada/);
});

test("tool event-read failures return typed refusals without durable approval", async () => {
  for (const mode of ["draft", "approval"] as const) {
    const { runId, store, approvalService } = createStore();
    let readCalls = 0;
    const flakyStore = {
      append: (input: Parameters<JsonlEventStore["append"]>[0]) => store.append(input),
      readRun: (requestedRunId: string) => {
        readCalls += 1;
        const failureRead = mode === "draft" ? 1 : 3;
        if (readCalls === failureRead) throw null;
        return store.readRun(requestedRunId);
      },
    };
    const [qualificationTool, draftTool, approvalTool] = buildTools(
      runId,
      "lead_ada",
      flakyStore,
      approvalService,
    );
    await executeTool(qualificationTool, { leadId: "lead_ada" });
    const drafted = await executeTool(draftTool, {
      leadId: "lead_ada",
      angle: "An auditable support triage workflow",
    });

    if (mode === "draft") {
      assert.deepEqual(drafted.details, {
        created: false,
        draft: null,
        draftId: null,
        sha256: null,
        code: "storage_failure",
      });
    } else {
      const draft = (drafted.details as { draft: string | null }).draft;
      assert.ok(draft);
      const requested = await executeTool(approvalTool, { leadId: "lead_ada", draft });
      assert.deepEqual(requested.details, {
        created: false,
        approval: null,
        code: "storage_failure",
      });
    }
    assert.deepEqual(approvalService.listRun(runId), { ok: true, value: [] });
  }
});

test("thrown and schema-valid mismatched append outcomes fail closed", async () => {
  let executorCalled = false;
  const thrown = await executeQualification(
    "run_qualification_thrown_append",
    "lead_ada",
    {
      append: () => {
        throw null;
      },
      readRun: () => ({ ok: true, value: [] }),
    },
    { leadId: "lead_ada" },
    {
      qualificationExecutor: () => {
        executorCalled = true;
        return qualifyLead({ leadId: "lead_ada" });
      },
    },
  );
  assert.equal(thrown.ok, false);
  if (thrown.ok) assert.fail("Expected thrown append failure");
  assert.equal(thrown.error.code, "lead_lookup_failed");
  assert.equal(executorCalled, false);

  const { runId, store, approvalService } = createStore();
  let appendCalls = 0;
  const mismatchedStore = {
    append: (input: unknown) => {
      appendCalls += 1;
      if (appendCalls <= 2) return store.append(input);
      return store.append({
        runId,
        type: "run.started",
        data: { eventType: "run.started", leadId: "lead_ada" },
      });
    },
    readRun: (requestedRunId: unknown) => store.readRun(requestedRunId),
  };
  const [qualificationTool, draftTool] = buildTools(
    runId,
    "lead_ada",
    mismatchedStore,
    approvalService,
  );
  const qualification = await executeTool(qualificationTool, { leadId: "lead_ada" });
  assert.equal((qualification.details as QualificationOutcome).ok, true);
  const draft = await executeTool(draftTool, {
    leadId: "lead_ada",
    angle: "An auditable support triage workflow",
  });
  assert.equal((draft.details as { created: boolean }).created, false);
  assert.equal((draft.details as { code: string }).code, "storage_failure");
  assert.equal(
    readRunEvents(store, runId).some(
      (event) => event.data.eventType === "domain.follow_up_drafted",
    ),
    false,
  );
});

test("corrupt terminal event data cannot become qualification truth", () => {
  assert.equal(
    qualificationOutcomeFromEvents(
      [
        {
          schemaVersion: 1,
          eventId: "event_corrupt",
          runId: "run_corrupt",
          at: "2026-08-04T00:00:00.000Z",
          type: "qualification.completed",
          data: {
            eventType: "qualification.completed",
            result: { leadId: "lead_ada", fit: "invented", confidence: 2 },
          },
          metadata: {},
        } as unknown as AgentEvent,
      ],
      "lead_ada",
    ),
    undefined,
  );
});
