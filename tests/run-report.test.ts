import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { chmodSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import test, { afterEach } from "node:test";
import { fileURLToPath } from "node:url";
import { makeQualificationFailure } from "../src/qualification.js";
import {
  MAX_RUN_REPORT_EVENTS,
  buildRunReport,
  isRunReport,
  isRunReportFailure,
  renderRunReportText,
  type RunReport,
} from "../src/run-report.js";
import { makeRunEventFailure, type AgentEvent, type RunEventData } from "../src/run-event.js";
import { makeRunEvent } from "./run-event-test-helpers.js";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_SCRIPT = resolve(PROJECT_ROOT, "scripts/run-report.ts");
const FIXTURE = resolve(PROJECT_ROOT, "tests/fixtures/run-report-failed.jsonl");
const RUN_ID = "run_report_001";
const OTHER_RUN_ID = "run_report_002";
const LEAD_ID = "lead_report";
const BASE_TIME = Date.parse("2026-08-12T01:00:00.000Z");
const temporaryRoots = new Set<string>();

function at(index: number): string {
  return new Date(BASE_TIME + index).toISOString();
}

function event(
  data: RunEventData,
  index: number,
  options: {
    runId?: string;
    metadata?: Record<string, unknown>;
    eventId?: string;
    timestamp?: string;
  } = {},
): AgentEvent {
  return makeRunEvent(
    {
      runId: options.runId ?? RUN_ID,
      type: data.eventType,
      data,
      metadata: options.metadata,
    },
    {
      eventId: options.eventId ?? `event_report_${String(index).padStart(6, "0")}`,
      at: options.timestamp ?? at(index),
      applicationVersion: "0.1.32-test",
    },
  );
}

function started(index = 0, options: Parameters<typeof event>[2] = {}): AgentEvent {
  return event({ eventType: "run.started", leadId: LEAD_ID }, index, options);
}

function storeWith(events: readonly AgentEvent[]): Readonly<{ readRun(runId: unknown): unknown }> {
  return Object.freeze({
    readRun: (runId: unknown) =>
      Object.freeze({
        ok: true as const,
        value: events.filter((item) => item.runId === runId),
      }),
  });
}

function requireReport(events: readonly AgentEvent[]): RunReport {
  const outcome = buildRunReport(storeWith(events), { runId: RUN_ID });
  if (!outcome.ok) assert.fail(`${outcome.error.code}: ${outcome.error.message}`);
  return outcome.value;
}

function failureHistory(): AgentEvent[] {
  return [
    started(),
    event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 1),
    event({ eventType: "run.failed", code: "agent_run_failed" }, 2, {
      metadata: { result: "failed", errorCode: "agent_run_failed" },
    }),
  ];
}

function approvalAndEffectHistory(): AgentEvent[] {
  const approvalId = "approval_run_report_001";
  const draftId = "draft_run_report_001";
  const sha256 = "a".repeat(64);
  const idempotencyKey = "b".repeat(64);
  return [
    started(),
    event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 1),
    event(
      {
        eventType: "qualification.completed",
        result: {
          leadId: LEAD_ID,
          fit: "strong",
          confidence: 0.8,
          reasons: ["team_size_in_scope"],
          missingInformation: ["budget"],
        },
      },
      2,
    ),
    event({ eventType: "domain.follow_up_drafted", leadId: LEAD_ID, draftId, sha256 }, 3),
    event(
      {
        eventType: "approval.requested",
        approvalId,
        action: "send_follow_up",
        targetKind: "lead",
        leadId: LEAD_ID,
        draftId,
        status: "pending",
      },
      4,
    ),
    event({ eventType: "run.completed", stopReason: "approval_pending" }, 5, {
      metadata: { result: "pending", stopReason: "approval_pending", approvalState: "pending" },
    }),
    event(
      {
        eventType: "approval.approved",
        approvalId,
        actorId: "actor_report_reviewer",
        status: "approved",
      },
      6,
    ),
    event({ eventType: "fake_send.attempted", approvalId, idempotencyKey }, 7),
    event(
      {
        eventType: "fake_send.accepted",
        approvalId,
        idempotencyKey,
        durationMs: 10,
        outcome: "accepted",
      },
      8,
    ),
  ];
}

function runCli(args: readonly string[]) {
  const environment = { ...process.env };
  delete environment.NODE_V8_COVERAGE;
  const result = spawnSync(process.execPath, ["--import", "tsx", REPORT_SCRIPT, ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: environment,
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function temporaryRoot(): string {
  const root = mkdtempSync(resolve(tmpdir(), "agent-run-report-"));
  chmodSync(root, 0o700);
  temporaryRoots.add(root);
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
  temporaryRoots.clear();
});

test("failed run report is closed, chronological, minimized, and immutable", () => {
  const report = requireReport(failureHistory());
  assert.equal(isRunReport(report), true);
  assert.equal(report.schemaVersion, 1);
  assert.equal(report.runId, RUN_ID);
  assert.equal(report.status, "failed");
  assert.equal(report.authority, "observed_only");
  assert.deepEqual(report.terminal, { kind: "failed", stopReason: "agent_run_failed" });
  assert.deepEqual(
    report.timeline.map((entry) => [entry.sequence, entry.eventType, entry.layer]),
    [
      [1, "run.started", "run"],
      [2, "qualification.attempted", "domain"],
      [3, "run.failed", "terminal"],
    ],
  );
  assert.equal(report.timeline[2]?.errorCategory, "agent_run_failed");
  assert.equal(report.timeline[2]?.stopReason, "agent_run_failed");
  assert.equal(Object.isFrozen(report), true);
  assert.equal(Object.isFrozen(report.timeline), true);
  assert.equal(Object.isFrozen(report.timeline[0]), true);
});

test("text and JSON facts agree while unavailable measurements stay explicit", () => {
  const report = requireReport(failureHistory());
  const rendered = renderRunReportText(report);
  assert.equal(rendered.ok, true);
  assert.match(rendered.value, /status=failed/u);
  assert.match(rendered.value, /terminal=failed:agent_run_failed/u);
  for (const entry of report.timeline)
    assert.match(rendered.value, new RegExp(`event=${entry.eventType}`));
  assert.match(rendered.value, /duration=unavailable:not_reported/u);
  assert.match(rendered.value, /tokens=unavailable:not_reported/u);
});

test("measured zero model usage and cost remain available rather than absent", () => {
  const report = requireReport([
    started(),
    event(
      {
        eventType: "pi.lifecycle",
        sourceType: "turn_end",
        toolName: null,
        toolCallId: null,
        isError: false,
        messageId: "message_report_001",
        stopReason: null,
      },
      1,
      {
        metadata: {
          actor: { kind: "model", id: null },
          result: "succeeded",
          modelVersion: "synthetic-model-v1",
          promptVersion: "synthetic-prompt-v1",
          stepNumber: 1,
          durationMs: 0,
          tokens: { input: 0, output: 0, total: 0 },
          costUsd: 0,
        },
      },
    ),
  ]);
  const entry = report.timeline[1];
  assert.equal(entry?.layer, "model");
  assert.deepEqual(entry?.duration, { status: "available", value: 0, unit: "milliseconds" });
  assert.deepEqual(entry?.tokens, { status: "available", input: 0, output: 0, total: 0 });
  assert.deepEqual(entry?.cost, { status: "available", value: 0, unit: "usd" });
  assert.deepEqual(report.metrics.tokens, { status: "available", input: 0, output: 0, total: 0 });
});

test("tool permissions are finite and do not imply authority", () => {
  const report = requireReport([
    started(),
    event(
      {
        eventType: "pi.lifecycle",
        sourceType: "tool_execution_start",
        toolName: "qualify_lead",
        toolCallId: "call_report_001",
        isError: null,
        messageId: null,
        stopReason: null,
      },
      1,
      {
        metadata: {
          actor: { kind: "tool", id: null },
          tool: { name: "qualify_lead", callId: "call_report_001" },
          result: "attempted",
          stepNumber: 1,
        },
      },
    ),
    event(
      {
        eventType: "pi.lifecycle",
        sourceType: "tool_execution_start",
        toolName: "request_send_approval",
        toolCallId: "call_report_002",
        isError: null,
        messageId: null,
        stopReason: null,
      },
      2,
      {
        metadata: {
          actor: { kind: "tool", id: null },
          tool: { name: "request_send_approval", callId: "call_report_002" },
          result: "pending",
          stepNumber: 2,
        },
      },
    ),
  ]);
  assert.deepEqual(
    report.timeline.slice(1).map((entry) => [entry.layer, entry.permissionDecision]),
    [
      ["tool", "automatic"],
      ["tool", "approval_required"],
    ],
  );
  assert.equal(report.authority, "observed_only");
});

test("approval and effect events are visible but remain observed only", () => {
  const report = requireReport(approvalAndEffectHistory());
  assert.equal(report.status, "effect_indeterminate");
  assert.deepEqual(report.terminal, { kind: "completed", stopReason: "approval_pending" });
  assert.deepEqual(
    report.timeline.slice(4).map((entry) => entry.layer),
    ["approval", "terminal", "approval", "effect", "effect"],
  );
  assert.equal(report.timeline[7]?.sideEffect, "attempted");
  assert.equal(report.timeline[8]?.sideEffect, "succeeded");
  assert.equal(report.timeline[8]?.permissionDecision, "approval_required");
});

test("stopped terminal exposes its exact durable reason and category", () => {
  const report = requireReport([
    started(),
    event({ eventType: "run.stopped", stopReason: "deadline_exceeded" }, 1, {
      metadata: {
        action: "run_stop",
        result: "stopped",
        stopReason: "deadline_exceeded",
        errorCode: "deadline_exceeded",
      },
    }),
  ]);
  assert.equal(report.status, "stopped");
  assert.deepEqual(report.terminal, { kind: "stopped", stopReason: "deadline_exceeded" });
  assert.equal(report.timeline[1]?.errorCategory, "deadline_exceeded");
});

test("protected durable fields never enter report objects or text", () => {
  const protectedValues = [
    "lead_report_private",
    "actor_private",
    "https://private.internal/target",
    "secret-provider-payload",
  ];
  const history = [
    event({ eventType: "run.started", leadId: protectedValues[0] as string }, 0, {
      metadata: {
        actor: { kind: "human", id: protectedValues[1] },
        validatedArguments: {
          privateUrl: protectedValues[2],
          providerPayload: protectedValues[3],
        },
      },
    }),
  ];
  const report = requireReport(history);
  const rendered = renderRunReportText(report);
  assert.equal(rendered.ok, true);
  const machine = JSON.stringify(report);
  for (const value of protectedValues) {
    assert.equal(machine.includes(value), false);
    assert.equal(rendered.value.includes(value), false);
  }
});

test("invalid request shapes fail before reading a store or invoking accessors", () => {
  let reads = 0;
  const store = { readRun: () => (reads += 1) };
  for (const request of [null, {}, { runId: "bad" }, { runId: RUN_ID, extra: true }]) {
    assert.deepEqual(buildRunReport(store, request), {
      ok: false,
      error: {
        code: "invalid_input",
        message: "Run report input is invalid.",
        retryable: false,
      },
    });
  }
  let accessorReads = 0;
  const request = {};
  Object.defineProperty(request, "runId", {
    enumerable: true,
    get: () => {
      accessorReads += 1;
      return RUN_ID;
    },
  });
  assert.equal(buildRunReport(store, request).ok, false);
  assert.equal(accessorReads, 0);
  assert.equal(reads, 0);
});

test("missing, throwing, accessor, and malformed stores fail visibly", () => {
  assert.equal(buildRunReport({}, { runId: RUN_ID }).ok, false);
  assert.deepEqual(
    buildRunReport({ readRun: () => ({ ok: true, value: [] }) }, { runId: RUN_ID }),
    {
      ok: false,
      error: {
        code: "missing_run",
        message: "No durable evidence exists for the requested run.",
        retryable: false,
      },
    },
  );
  assert.equal(
    buildRunReport(
      {
        readRun: () => {
          throw new Error("private path");
        },
      },
      { runId: RUN_ID },
    ).ok,
    false,
  );
  let getterReads = 0;
  const hostile = {};
  Object.defineProperty(hostile, "readRun", {
    get: () => {
      getterReads += 1;
      return () => ({ ok: true, value: [started()] });
    },
  });
  assert.equal(buildRunReport(hostile, { runId: RUN_ID }).ok, false);
  assert.equal(getterReads, 0);
  assert.equal(
    buildRunReport({ readRun: () => ({ ok: true, value: "wrong" }) }, { runId: RUN_ID }).ok,
    false,
  );
  let outcomeAccessorReads = 0;
  const hostileOutcome = {};
  Object.defineProperty(hostileOutcome, "ok", {
    enumerable: true,
    get: () => {
      outcomeAccessorReads += 1;
      return true;
    },
  });
  assert.equal(buildRunReport({ readRun: () => hostileOutcome }, { runId: RUN_ID }).ok, false);
  assert.equal(outcomeAccessorReads, 0);
});

test("file-store failure categories remain finite and actionable", () => {
  const cases = [
    ["corrupt_record", "corrupt_history"],
    ["interrupted_write", "interrupted_history"],
    ["out_of_order_record", "out_of_order_history"],
    ["duplicate_event", "duplicate_history"],
    ["storage_failure", "storage_failure"],
  ] as const;
  for (const [storeCode, reportCode] of cases) {
    const outcome = buildRunReport(
      { readRun: () => ({ ok: false, error: makeRunEventFailure(storeCode) }) },
      { runId: RUN_ID },
    );
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected report refusal");
    assert.equal(outcome.error.code, reportCode);
    assert.equal(isRunReportFailure(outcome.error), true);
    assert.equal(JSON.stringify(outcome).includes("path"), false);
  }
});

test("cross-run and illegal semantic evidence cannot produce partial reports", () => {
  const crossRun = buildRunReport(
    { readRun: () => ({ ok: true, value: [started(), started(1, { runId: OTHER_RUN_ID })] }) },
    { runId: RUN_ID },
  );
  assert.equal(crossRun.ok, false);
  if (!crossRun.ok) assert.equal(crossRun.error.code, "conflicting_history");

  const illegal = buildRunReport(
    storeWith([
      started(),
      event(
        {
          eventType: "qualification.completed",
          result: {
            leadId: LEAD_ID,
            fit: "insufficient",
            confidence: 0.2,
            reasons: ["limited_qualification_signals"],
            missingInformation: ["budget"],
          },
        },
        1,
      ),
    ]),
    { runId: RUN_ID },
  );
  assert.equal(illegal.ok, false);
  if (!illegal.ok) assert.equal(illegal.error.code, "conflicting_history");
});

test("maximum event count succeeds and one additional event is refused", () => {
  const events = [started()];
  for (let index = 1; index < MAX_RUN_REPORT_EVENTS + 1; index += 1) {
    events.push(
      event(
        {
          eventType: "pi.lifecycle",
          sourceType: "turn_start",
          toolName: null,
          toolCallId: null,
          isError: null,
          messageId: null,
          stopReason: null,
        },
        index,
      ),
    );
  }
  assert.equal(requireReport(events.slice(0, MAX_RUN_REPORT_EVENTS)).eventCount, 1_000);
  const oversized = buildRunReport(storeWith(events), { runId: RUN_ID });
  assert.equal(oversized.ok, false);
  if (!oversized.ok) assert.equal(oversized.error.code, "report_too_large");
});

test("renderer rejects extra properties, malformed semantics, and uncloneable values", () => {
  const report = requireReport(failureHistory());
  assert.equal(renderRunReportText({ ...report, extra: true }).ok, false);
  assert.equal(renderRunReportText({ ...report, timeline: [] }).ok, false);
  assert.equal(
    renderRunReportText({
      ...report,
      metrics: { ...report.metrics, maxRetryCount: report.metrics.maxRetryCount + 1 },
    }).ok,
    false,
  );
  assert.equal(
    renderRunReportText({
      ...report,
      terminal: { kind: "completed", stopReason: "agent_run_failed" },
    }).ok,
    false,
  );
  assert.equal(renderRunReportText({ ...report, runId: () => RUN_ID }).ok, false);
});

test("renderer rejects accessor-backed reports without invoking accessors", () => {
  const report = requireReport(failureHistory());
  let accessorReads = 0;
  const hostile = { ...report } as Record<string, unknown>;
  Object.defineProperty(hostile, "runId", {
    enumerable: true,
    get: () => {
      accessorReads += 1;
      return RUN_ID;
    },
  });
  assert.equal(renderRunReportText(hostile).ok, false);
  assert.equal(isRunReport(hostile), false);
  assert.equal(accessorReads, 0);
});

test("summary uses elapsed time and maximum retry count without double counting", () => {
  const report = requireReport([
    started(0, { timestamp: at(0), metadata: { durationMs: 100, retryCount: 2 } }),
    event(
      {
        eventType: "pi.lifecycle",
        sourceType: "turn_start",
        toolName: null,
        toolCallId: null,
        isError: null,
        messageId: null,
        stopReason: null,
      },
      10,
      { timestamp: at(10), metadata: { durationMs: 100, retryCount: 2 } },
    ),
  ]);
  const metrics = report.metrics as unknown as Record<string, unknown>;
  assert.deepEqual(metrics.elapsedDuration, {
    status: "available",
    value: 10,
    unit: "milliseconds",
  });
  assert.equal(metrics.maxRetryCount, 2);
  assert.equal("duration" in metrics, false);
  assert.equal("totalRetries" in metrics, false);
});

test("timeline retains bounded application version evidence", () => {
  const report = requireReport(failureHistory());
  assert.deepEqual(
    report.timeline.map(
      (entry) => (entry as unknown as { applicationVersion?: string }).applicationVersion,
    ),
    ["0.1.32-test", "0.1.32-test", "0.1.32-test"],
  );
});

test("preserved fixture renders deterministic text and JSON without mutation", () => {
  const before = sha256(FIXTURE);
  const text = runCli([
    "--run-id",
    "run_report_fixture",
    "--event-log",
    FIXTURE,
    "--format",
    "text",
  ]);
  assert.equal(text.status, 0, text.stderr);
  assert.equal(text.stderr, "");
  assert.match(text.stdout, /status=stopped/u);
  assert.match(text.stdout, /terminal=completed:qualification_failed/u);
  assert.match(text.stdout, /error=qualification_timeout/u);

  const json = runCli([
    "--run-id",
    "run_report_fixture",
    "--event-log",
    FIXTURE,
    "--format",
    "json",
  ]);
  assert.equal(json.status, 0, json.stderr);
  const parsed = JSON.parse(json.stdout) as { ok: boolean; report: RunReport };
  assert.equal(parsed.ok, true);
  assert.equal(parsed.report.eventCount, 4);
  for (const entry of parsed.report.timeline) {
    assert.match(text.stdout, new RegExp(`event=${entry.eventType}`));
  }
  assert.equal(sha256(FIXTURE), before);
});

test("fresh CLI processes produce byte-identical reports from the same evidence", () => {
  const args = ["--run-id", "run_report_fixture", "--event-log", FIXTURE, "--format", "json"];
  const first = runCli(args);
  const second = runCli(args);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.equal(second.stdout, first.stdout);
});

test("CLI rejects invalid input and unsafe paths before report access", () => {
  const invalid = runCli(["--run-id", "bad", "--event-log", FIXTURE]);
  assert.equal(invalid.status, 2);
  assert.match(invalid.stderr, /invalid_input/u);
  assert.equal(isRunReportFailure((JSON.parse(invalid.stderr) as { error: unknown }).error), true);
  assert.equal(invalid.stdout, "");

  const missing = runCli(["--run-id", RUN_ID, "--event-log", "/private/missing/events.jsonl"]);
  assert.equal(missing.status, 2);
  assert.match(missing.stderr, /invalid_evidence_path/u);
  assert.equal(isRunReportFailure((JSON.parse(missing.stderr) as { error: unknown }).error), true);
  assert.equal(missing.stderr.includes("/private/missing"), false);

  const root = temporaryRoot();
  const link = resolve(root, "events.jsonl");
  symlinkSync(FIXTURE, link);
  const symlink = runCli(["--run-id", "run_report_fixture", "--event-log", link]);
  assert.equal(symlink.status, 2);
  assert.match(symlink.stderr, /invalid_evidence_path/u);
});

test("CLI rejects malformed, truncated, duplicate, and out-of-order complete files", () => {
  const root = temporaryRoot();
  const original = readFileSync(FIXTURE, "utf8");
  const firstLine = original.split("\n")[0] as string;
  const files = [
    ["malformed.jsonl", "not-json\n", "corrupt_history"],
    ["truncated.jsonl", original.slice(0, -1), "interrupted_history"],
    ["duplicate.jsonl", `${firstLine}\n${firstLine}\n`, "duplicate_history"],
    ["out-of-order.jsonl", `${original.split("\n")[1]}\n${firstLine}\n`, "out_of_order_history"],
  ] as const;
  for (const [name, content, code] of files) {
    const path = resolve(root, name);
    writeFileSync(path, content, { mode: 0o600 });
    const result = runCli(["--run-id", "run_report_fixture", "--event-log", path]);
    assert.equal(result.status, 1, `${name}: ${result.stderr}`);
    assert.match(result.stderr, new RegExp(code));
    assert.equal(result.stdout, "");
    assert.equal(result.stderr.includes(path), false);
  }
});

test("missing exact run fails without exposing other run evidence", () => {
  const result = runCli(["--run-id", "run_missing_report", "--event-log", FIXTURE]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing_run/u);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.includes("lead_fixture"), false);
});

test("read-only CLI source excludes write and authority capabilities", () => {
  const source = readFileSync(REPORT_SCRIPT, "utf8");
  for (const forbidden of [
    "writeFileSync",
    "appendFile",
    "openSync",
    "ApprovalService",
    "FakeSendService",
    "RecoveryApplication",
    "createServer",
    "fetch(",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
});

test("qualification failure keeps exact terminal, retry, duration, and unavailable facts", () => {
  const failure = makeQualificationFailure("qualification_timeout");
  if (failure.ok) assert.fail("Expected failure fixture");
  const report = requireReport([
    started(),
    event({ eventType: "qualification.attempted", leadId: LEAD_ID }, 1),
    event({ eventType: "qualification.failed", error: failure.error }, 2, {
      metadata: {
        result: "failed",
        errorCode: "qualification_timeout",
        retryCount: 1,
        durationMs: 10,
      },
    }),
    event({ eventType: "run.completed", stopReason: "qualification_failed" }, 3, {
      metadata: {
        result: "stopped",
        stopReason: "qualification_failed",
        errorCode: "qualification_timeout",
      },
    }),
  ]);
  assert.equal(report.status, "stopped");
  assert.deepEqual(report.terminal, { kind: "completed", stopReason: "qualification_failed" });
  assert.equal(report.metrics.maxRetryCount, 1);
  assert.deepEqual(report.metrics.elapsedDuration, {
    status: "available",
    value: 3,
    unit: "milliseconds",
  });
  assert.deepEqual(report.metrics.tokens, { status: "unavailable", reason: "not_reported" });
  assert.deepEqual(report.metrics.cost, { status: "unavailable", reason: "not_reported" });
});
