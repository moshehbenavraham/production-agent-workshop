import assert from "node:assert/strict";
import test from "node:test";
import { makeQualificationFailure } from "../src/qualification.js";
import {
  RUN_EVENT_SCHEMA_VERSION,
  createAgentEvent,
  isAgentEvent,
  isMatchingRunEventAppendOutcome,
  isRunEventAppendOutcome,
  isRunEventFailure,
  isRunEventId,
  isRunEventMetadata,
  isRunEventReadOutcome,
  makeRunEventFailure,
} from "../src/run-event.js";

const generated = {
  eventId: "event_contract_001",
  at: "2026-08-11T16:00:00.000Z",
  applicationVersion: "0.1.22",
};

function startedEvent() {
  const outcome = createAgentEvent(
    {
      runId: "run_contract_001",
      type: "run.started",
      data: { eventType: "run.started", leadId: "lead_ada" },
      metadata: { action: "start_run", result: "attempted" },
    },
    generated,
  );
  if (!outcome.ok) assert.fail(outcome.error.message);
  return outcome.value;
}

test("closed event factory adds versioned identity and explicit unavailable metadata", () => {
  const event = startedEvent();

  assert.equal(event.schemaVersion, RUN_EVENT_SCHEMA_VERSION);
  assert.equal(event.eventId, generated.eventId);
  assert.equal(event.runId, "run_contract_001");
  assert.equal(event.at, generated.at);
  assert.deepEqual(event.data, { eventType: "run.started", leadId: "lead_ada" });
  assert.deepEqual(event.metadata.actor, { kind: "application", id: null });
  assert.equal(event.metadata.action, "start_run");
  assert.equal(event.metadata.tool, null);
  assert.equal(event.metadata.validatedArguments, null);
  assert.equal(event.metadata.result, "attempted");
  assert.equal(event.metadata.errorCode, null);
  assert.equal(event.metadata.approvalState, null);
  assert.equal(event.metadata.stopReason, null);
  assert.equal(event.metadata.applicationVersion, "0.1.22");
  assert.equal(event.metadata.modelVersion, null);
  assert.equal(event.metadata.promptVersion, null);
  assert.equal(event.metadata.durationMs, null);
  assert.equal(event.metadata.stepNumber, null);
  assert.equal(event.metadata.retryCount, 0);
  assert.equal(event.metadata.tokens, null);
  assert.equal(event.metadata.costUsd, null);
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.data), true);
  assert.equal(Object.isFrozen(event.metadata), true);
  assert.equal(isAgentEvent(event), true);
});

test("event envelope rejects extras, invalid identities, and noncanonical timestamps", () => {
  const event = startedEvent();

  assert.equal(isAgentEvent({ ...event, secret: "no" }), false);
  assert.equal(isAgentEvent({ ...event, schemaVersion: 3 }), false);
  assert.equal(isAgentEvent({ ...event, eventId: "bad" }), false);
  assert.equal(isRunEventId("event_a"), false);
  assert.equal(isRunEventId("event_ab"), true);
  assert.equal(isAgentEvent({ ...event, runId: "bad" }), false);
  assert.equal(isAgentEvent({ ...event, at: "2026-08-11" }), false);
  assert.equal(isAgentEvent({ ...event, at: "2026-08-11T16:00:00.000+00:00" }), false);
});

test("run, qualification, draft, approval, fake-send, and normalized Pi variants are closed", () => {
  const variants = [
    {
      ...startedEvent(),
      type: "qualification.attempted",
      data: { eventType: "qualification.attempted", leadId: "lead_ada" },
    },
    {
      ...startedEvent(),
      type: "qualification.completed",
      data: {
        eventType: "qualification.completed",
        result: {
          leadId: "lead_ada",
          fit: "strong",
          confidence: 0.85,
          reasons: ["team_size_in_scope", "operational_problem_present"],
          missingInformation: [],
        },
      },
    },
    {
      ...startedEvent(),
      type: "domain.follow_up_drafted",
      data: {
        eventType: "domain.follow_up_drafted",
        leadId: "lead_ada",
        draftId: "draft_contract_001",
        sha256: "a".repeat(64),
      },
    },
    {
      ...startedEvent(),
      type: "approval.requested",
      data: {
        eventType: "approval.requested",
        approvalId: "approval_contract_001",
        action: "send_follow_up",
        targetKind: "lead",
        leadId: "lead_ada",
        draftId: "draft_contract_001",
        status: "pending",
      },
    },
    {
      ...startedEvent(),
      type: "fake_send.attempted",
      data: {
        eventType: "fake_send.attempted",
        approvalId: "approval_contract_001",
        idempotencyKey: "b".repeat(64),
      },
    },
    {
      ...startedEvent(),
      type: "pi.lifecycle",
      data: {
        eventType: "pi.lifecycle",
        sourceType: "tool_execution_start",
        toolName: "qualify_lead",
        toolCallId: "tool_call_001",
        isError: false,
        messageId: null,
        stopReason: null,
      },
    },
  ];

  variants.forEach((variant, index) => {
    assert.equal(isAgentEvent(variant), true, `variant ${index} must be valid`);
  });
  assert.equal(
    isAgentEvent({
      ...variants[5],
      data: { ...variants[5]?.data, rawSdkEvent: { secret: "no" } },
    }),
    false,
  );
});

test("event type and payload discriminants must match for every owned namespace", () => {
  const event = startedEvent();
  assert.equal(isAgentEvent({ ...event, type: "run.completed" }), false);
  assert.equal(
    isAgentEvent({
      ...event,
      type: "approval.requested",
      data: {
        eventType: "approval.approved",
        approvalId: "approval_contract_001",
        actorId: "actor_contract_reviewer",
        status: "approved",
      },
    }),
    false,
  );
  assert.equal(
    isAgentEvent({
      ...event,
      type: "fake_send.accepted",
      data: {
        eventType: "fake_send.rejected",
        approvalId: "approval_contract_001",
        idempotencyKey: "c".repeat(64),
        durationMs: 1,
        outcome: "rejected",
        code: "rejected",
      },
    }),
    false,
  );
});

test("every current terminal, approval, and fake-send payload variant is accepted exactly", () => {
  const event = startedEvent();
  const approvalId = "approval_contract_001";
  const actorId = "actor_contract_reviewer";
  const idempotencyKey = "d".repeat(64);
  const qualificationFailure = makeQualificationFailure("lead_not_found");
  if (qualificationFailure.ok) assert.fail("Expected qualification failure fixture");
  const payloads = [
    { eventType: "run.completed", stopReason: "approval_pending" },
    { eventType: "run.stopped", stopReason: "deadline_exceeded" },
    { eventType: "run.stopped", stopReason: "step_limit_exceeded" },
    { eventType: "run.stopped", stopReason: "dependency_failed" },
    { eventType: "run.failed", code: "agent_run_failed" },
    {
      eventType: "qualification.failed",
      error: qualificationFailure.error,
    },
    { eventType: "approval.approved", approvalId, actorId, status: "approved" },
    { eventType: "approval.declined", approvalId, actorId, status: "declined" },
    {
      eventType: "approval.decision_duplicate",
      approvalId,
      actorId,
      requestedDecision: "approved",
      status: "approved",
    },
    {
      eventType: "approval.decision_conflict",
      approvalId,
      actorId,
      requestedDecision: "declined",
      status: "approved",
    },
    {
      eventType: "approval.invalid",
      approvalId,
      operation: "decision",
      code: "invalid_decision",
    },
    {
      eventType: "approval.storage_failed",
      approvalId,
      operation: "read",
      code: "storage_failure",
    },
    {
      eventType: "fake_send.accepted",
      approvalId,
      idempotencyKey,
      durationMs: 1,
      outcome: "accepted",
    },
    {
      eventType: "fake_send.duplicate",
      approvalId,
      idempotencyKey,
      durationMs: 1,
      outcome: "duplicate",
      originalStatus: "accepted",
    },
    {
      eventType: "fake_send.rejected",
      approvalId,
      idempotencyKey,
      durationMs: 1,
      outcome: "rejected",
      code: "rejected",
    },
    {
      eventType: "fake_send.timed_out",
      approvalId,
      idempotencyKey,
      durationMs: 1,
      outcome: "timed_out",
      code: "timed_out",
    },
    {
      eventType: "fake_send.downstream_failed",
      approvalId,
      idempotencyKey,
      durationMs: 1,
      outcome: "downstream_failure",
      code: "downstream_failure",
    },
    {
      eventType: "fake_send.permission_denied",
      approvalId,
      code: "permission_denied",
    },
    {
      eventType: "fake_send.storage_failed",
      approvalId,
      idempotencyKey,
      code: "storage_failure",
    },
  ] as const;

  for (const data of payloads) {
    assert.equal(
      isAgentEvent({ ...event, type: data.eventType, data }),
      true,
      `${data.eventType} must remain a valid closed event`,
    );
  }
});

test("metadata preserves measured zero and rejects impossible or undocumented values", () => {
  const event = startedEvent();
  const measuredZero = {
    ...event.metadata,
    durationMs: 0,
    stepNumber: 1,
    retryCount: 0,
    tokens: { input: 0, output: 0, total: 0 },
    costUsd: 0,
  };

  assert.equal(isRunEventMetadata(measuredZero), true);
  assert.equal(isRunEventMetadata({ ...measuredZero, durationMs: -1 }), false);
  assert.equal(isRunEventMetadata({ ...measuredZero, stepNumber: 0 }), false);
  assert.equal(isRunEventMetadata({ ...measuredZero, stepNumber: 1.5 }), false);
  assert.equal(isRunEventMetadata({ ...measuredZero, retryCount: -1 }), false);
  assert.equal(
    isRunEventMetadata({ ...measuredZero, tokens: { input: 1, output: 1, total: 1 } }),
    false,
  );
  assert.equal(isRunEventMetadata({ ...measuredZero, costUsd: -0.01 }), false);
  assert.equal(isRunEventMetadata({ ...measuredZero, raw: "no" }), false);
});

test("validated argument metadata is bounded to redacted scalar values", () => {
  const event = startedEvent();
  const valid = {
    ...event.metadata,
    validatedArguments: {
      leadId: "lead_ada",
      confidence: 0.85,
      retry: false,
      optional: null,
    },
  };

  assert.equal(isRunEventMetadata(valid), true);
  assert.equal(
    isRunEventMetadata({ ...valid, validatedArguments: { nested: { secret: "no" } } }),
    false,
  );
  assert.equal(
    isRunEventMetadata({ ...valid, validatedArguments: { content: "x".repeat(241) } }),
    false,
  );
});

test("event creation canonicalizes invalid input and generated metadata failures", () => {
  const invalid = createAgentEvent({ runId: "bad", type: "run.started", data: {} }, generated);
  assert.deepEqual(invalid, { ok: false, error: makeRunEventFailure("invalid_input") });
  assert.equal(Object.isFrozen(invalid), true);

  const badClock = createAgentEvent(
    {
      runId: "run_contract_001",
      type: "run.started",
      data: { eventType: "run.started", leadId: "lead_ada" },
    },
    { ...generated, at: "invalid" },
  );
  assert.deepEqual(badClock, { ok: false, error: makeRunEventFailure("storage_failure") });
  assert.equal(Object.isFrozen(badClock), true);
});

test("arbitrary thrown trust-boundary values become false or canonical failure", () => {
  const throwing = new Proxy(
    {},
    {
      ownKeys() {
        throw "sensitive arbitrary throw";
      },
    },
  );

  assert.equal(isAgentEvent(throwing), false);
  assert.equal(isRunEventMetadata(throwing), false);
  assert.equal(isRunEventFailure(throwing), false);
  assert.equal(isRunEventAppendOutcome(throwing), false);
  assert.equal(isRunEventReadOutcome(throwing), false);
  assert.deepEqual(createAgentEvent(throwing, generated), {
    ok: false,
    error: makeRunEventFailure("invalid_input"),
  });
  assert.deepEqual(
    createAgentEvent(
      {
        runId: "run_contract_001",
        type: "run.started",
        data: { eventType: "run.started", leadId: "lead_ada" },
      },
      throwing,
    ),
    {
      ok: false,
      error: makeRunEventFailure("storage_failure"),
    },
  );
});

test("run-event failures are canonical, frozen, and reject caller-controlled messages", () => {
  const failure = makeRunEventFailure("corrupt_record");
  assert.equal(isRunEventFailure(failure), true);
  assert.equal(Object.isFrozen(failure), true);
  assert.equal(
    isRunEventFailure({ ...failure, message: "raw /private/path and credential" }),
    false,
  );
  assert.equal(isRunEventFailure({ ...failure, retryable: true }), false);
});

test("replaceable store outcomes are closed and semantically validated", () => {
  const event = startedEvent();
  const input = {
    runId: event.runId,
    type: event.type,
    data: event.data,
    metadata: { action: "start_run", result: "attempted" },
  };
  assert.equal(isRunEventAppendOutcome({ ok: true, value: event }), true);
  assert.equal(isMatchingRunEventAppendOutcome({ ok: true, value: event }, input), true);
  assert.equal(
    isMatchingRunEventAppendOutcome(
      { ok: true, value: event },
      { ...input, data: { eventType: "run.started", leadId: "lead_grace" } },
    ),
    false,
  );
  assert.equal(
    isRunEventAppendOutcome({ ok: false, error: makeRunEventFailure("storage_failure") }),
    true,
  );
  assert.equal(isRunEventAppendOutcome({ ok: true, value: { ...event, extra: true } }), false);
  assert.equal(isRunEventReadOutcome({ ok: true, value: [event] }), true);
  assert.equal(isRunEventReadOutcome({ ok: true, value: [event, event] }), false);
  assert.equal(
    isRunEventReadOutcome({
      ok: true,
      value: [
        { ...event, eventId: "event_sequence_later", at: "2026-08-11T16:01:00.000Z" },
        { ...event, eventId: "event_sequence_earlier" },
      ],
    }),
    false,
  );
  assert.equal(
    isRunEventReadOutcome({ ok: false, error: makeRunEventFailure("corrupt_record") }),
    true,
  );
  assert.equal(isRunEventReadOutcome({ ok: true, value: "not-an-array" }), false);
});
