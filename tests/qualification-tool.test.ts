import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import Schema from "typebox/schema";
import { JsonlEventStore } from "../src/event-store.js";
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

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function createStore(): { runId: string; store: JsonlEventStore } {
  const directory = mkdtempSync(join(tmpdir(), "qualification-tool-"));
  temporaryDirectories.push(directory);
  return {
    runId: "run_qualification_test",
    store: new JsonlEventStore(join(directory, "events.jsonl")),
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
  const { runId, store } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(runId, "lead_ada", store);
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

  const events = store.readRun(runId);
  assert.deepEqual(
    events.map((event) => event.type),
    ["qualification.attempted", "qualification.completed"],
  );
  assert.deepEqual(events[0]?.data, { leadId: "lead_ada" });
  assert.deepEqual(events[1]?.data, outcome.ok ? outcome.value : undefined);
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
    const events = store.readRun(runId);
    assert.deepEqual(
      events.map((event) => event.type),
      ["qualification.attempted", "qualification.failed"],
    );
    assert.deepEqual(events[0]?.data, {});
    assert.deepEqual(events[1]?.data, outcome.error);
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
  assert.deepEqual(store.readRun(runId)[0]?.data, { leadId: "lead_grace" });
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
    store.readRun(runId).map((event) => event.type),
    ["qualification.attempted", "qualification.failed"],
  );
  assert.deepEqual(qualificationOutcomeFromEvents(store.readRun(runId), "lead_unknown"), outcome);
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
    assert.doesNotMatch(JSON.stringify(store.readRun(runId)), /sensitive|invented/);
    assert.equal(store.readRun(runId).length, 2);
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
  assert.doesNotMatch(JSON.stringify(store.readRun(runId)), /Sensitive/);
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
  assert.equal(store.readRun(runId).length, 2);

  resolveExecutor?.(qualifyLead({ leadId: "lead_ada" }));
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(
    store.readRun(runId).map((event) => event.type),
    ["qualification.attempted", "qualification.failed"],
  );
});

test("invalid timeout configuration fails before an event lifecycle starts", async () => {
  const { runId, store } = createStore();

  await assert.rejects(
    executeQualification(runId, "lead_ada", store, { leadId: "lead_ada" }, { timeoutMs: 0 }),
    /positive finite number/,
  );
  assert.deepEqual(store.readRun(runId), []);
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
    store.readRun(runId).map((event) => event.type),
    [
      "qualification.attempted",
      "qualification.completed",
      "qualification.attempted",
      "qualification.completed",
    ],
  );
});

test("draft and approval deny missing, failed, and cross-lead qualification", async () => {
  const { runId, store } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(runId, "lead_ada", store);

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
    code: "qualification_required",
  });
  assert.deepEqual(approvalBefore.details, {
    created: false,
    approval: null,
    code: "qualification_required",
  });
  assert.equal(store.readRun(runId).length, 0);

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
    store.readRun(runId).some((event) => event.type === "domain.follow_up_drafted"),
    false,
  );
  assert.equal(
    store.readRun(runId).some((event) => event.type === "approval.requested"),
    false,
  );
});

test("draft and approval deny an exact-lead qualification failure", async () => {
  const { runId, store } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(runId, "lead_unknown", store);

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
    store.readRun(runId).map((event) => event.type),
    ["qualification.attempted", "qualification.failed"],
  );
});

test("known lead completes deterministic qualification-to-approval vertical slice", async () => {
  const { runId, store } = createStore();
  const [qualificationTool, draftTool, approvalTool] = buildTools(runId, "lead_ada", store);

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

  const events = store.readRun(runId);
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
});

test("corrupt terminal event data cannot become qualification truth", () => {
  assert.equal(
    qualificationOutcomeFromEvents(
      [
        {
          eventId: "event_corrupt",
          runId: "run_corrupt",
          at: "2026-08-04T00:00:00.000Z",
          type: "qualification.completed",
          data: { leadId: "lead_ada", fit: "invented", confidence: 2 },
        },
      ],
      "lead_ada",
    ),
    undefined,
  );
});
