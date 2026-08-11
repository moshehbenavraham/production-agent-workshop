import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test, { after } from "node:test";
import { ApprovalService, type ApprovalEventStore } from "../src/approval-service.js";
import { FileApprovalStore } from "../src/approval-store.js";
import { createPendingApproval, makeApprovalFailure, type ApprovalStore } from "../src/approval.js";
import { JsonlEventStore } from "../src/event-store.js";
import { readRunEvents } from "./run-event-test-helpers.js";

const temporaryDirectories: string[] = [];

after(() => {
  for (const directory of temporaryDirectories) {
    rmSync(directory, { recursive: true, force: true });
  }
});

function paths(): { approvalPath: string; eventPath: string } {
  const directory = mkdtempSync(join(tmpdir(), "approval-service-"));
  temporaryDirectories.push(directory);
  return {
    approvalPath: join(directory, "approvals.jsonl"),
    eventPath: join(directory, "events.jsonl"),
  };
}

function requestInput(runId = "run_service_001") {
  return {
    runId,
    leadId: "lead_ada",
    action: "send_follow_up" as const,
    draft: "A sufficiently long synthetic service approval draft.",
  };
}

function service(
  approvalPath: string,
  events: ApprovalEventStore,
  options: {
    approvalId?: string;
    times?: string[];
    actors?: ReadonlySet<string>;
    makeApprovalId?: () => string;
  } = {},
): ApprovalService {
  const times = options.times ?? [
    "2026-08-04T10:00:00.000Z",
    "2026-08-04T10:01:00.000Z",
    "2026-08-04T10:02:00.000Z",
  ];
  const firstTime = times[0] ?? "2026-08-04T10:00:00.000Z";
  let timeIndex = 0;
  return new ApprovalService(new FileApprovalStore(approvalPath), events, {
    authorizedActorIds: options.actors ?? new Set(["actor_workshop_reviewer"]),
    makeApprovalId: options.makeApprovalId ?? (() => options.approvalId ?? "approval_service_001"),
    now: () => times[Math.min(timeIndex++, times.length - 1)] ?? firstTime,
  });
}

function lineCount(path: string): number {
  return readFileSync(path, "utf8").split("\n").filter(Boolean).length;
}

test("durable request stores exact state and emits only minimized evidence", () => {
  const { approvalPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const application = service(approvalPath, events);
  const outcome = application.requestApproval(requestInput(), {
    draftId: "draft_service_001",
  });

  if (!outcome.ok) assert.fail(outcome.error.message);
  assert.equal(outcome.ok, true);
  assert.equal(outcome.value.status, "pending");
  assert.equal(outcome.value.draft.draftId, "draft_service_001");
  assert.equal(outcome.value.target.leadId, "lead_ada");
  assert.deepEqual(application.get(outcome.value.approvalId), {
    ok: true,
    value: outcome.value,
  });
  assert.equal(lineCount(approvalPath), 1);

  const recorded = readRunEvents(events, outcome.value.runId);
  assert.deepEqual(
    recorded.map((event) => event.type),
    ["approval.requested"],
  );
  assert.deepEqual(recorded[0]?.data, {
    eventType: "approval.requested",
    approvalId: outcome.value.approvalId,
    action: "send_follow_up",
    targetKind: "lead",
    leadId: "lead_ada",
    draftId: "draft_service_001",
    status: "pending",
  });
  assert.equal(JSON.stringify(recorded).includes(requestInput().draft), false);
});

test("pending, approved, and declined application views survive service restart", () => {
  for (const decision of ["approved", "declined"] as const) {
    const { approvalPath, eventPath } = paths();
    const events = new JsonlEventStore(eventPath);
    const first = service(approvalPath, events, {
      approvalId: `approval_service_${decision}`,
    });
    const created = first.requestApproval(requestInput(`run_service_${decision}`), {
      draftId: `draft_service_${decision}`,
    });
    if (!created.ok) assert.fail(created.error.message);

    const pendingRestart = service(approvalPath, events, {
      times: ["2026-08-04T10:01:00.000Z"],
    });
    assert.deepEqual(pendingRestart.get(created.value.approvalId), {
      ok: true,
      value: created.value,
    });

    const decided = pendingRestart.decideApproval({
      approvalId: created.value.approvalId,
      runId: created.value.runId,
      actorId: "actor_workshop_reviewer",
      decision,
    });
    if (!decided.ok) assert.fail(decided.error.message);
    assert.equal(decided.ok, true);
    assert.equal(decided.value.status, decision);

    const terminalRestart = service(approvalPath, events);
    assert.deepEqual(terminalRestart.get(created.value.approvalId), {
      ok: true,
      value: decided.value,
    });
    assert.equal(lineCount(approvalPath), 2);
  }
});

test("duplicate request appends no approval line and records a refusal", () => {
  const { approvalPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const application = service(approvalPath, events);
  const input = requestInput();

  assert.equal(application.requestApproval(input, { draftId: "draft_service_001" }).ok, true);
  const duplicate = application.requestApproval(input, { draftId: "draft_service_001" });
  assert.equal(duplicate.ok, false);
  if (duplicate.ok) assert.fail("Expected duplicate request refusal");
  assert.equal(duplicate.error.code, "duplicate_request");
  assert.equal(lineCount(approvalPath), 1);
  assert.deepEqual(
    readRunEvents(events, input.runId).map((event) => event.type),
    ["approval.requested", "approval.invalid"],
  );
});

test("malformed, missing, and unknown-actor decisions remain visible and immutable", () => {
  const { approvalPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const application = service(approvalPath, events);
  const created = application.requestApproval(requestInput(), { draftId: "draft_service_001" });
  if (!created.ok) assert.fail(created.error.message);

  const cases = [
    {
      input: {
        approvalId: created.value.approvalId,
        runId: created.value.runId,
        actorId: "not-an-actor",
        decision: "approved",
      },
      code: "invalid_decision",
    },
    {
      input: {
        approvalId: "approval_service_missing",
        runId: created.value.runId,
        actorId: "actor_workshop_reviewer",
        decision: "approved",
      },
      code: "approval_not_found",
    },
    {
      input: {
        approvalId: created.value.approvalId,
        runId: created.value.runId,
        actorId: "actor_untrusted_reviewer",
        decision: "approved",
      },
      code: "unknown_actor",
    },
  ] as const;

  for (const fixture of cases) {
    const outcome = application.decideApproval(fixture.input);
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail(`Expected ${fixture.code}`);
    assert.equal(outcome.kind, "failure");
    assert.equal(outcome.error.code, fixture.code);
  }
  assert.equal(lineCount(approvalPath), 1);
  assert.equal(
    readRunEvents(events, created.value.runId).filter((event) => event.type === "approval.invalid")
      .length,
    3,
  );
});

test("duplicate and conflicting decisions return original state without another transition", () => {
  const { approvalPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const application = service(approvalPath, events);
  const created = application.requestApproval(requestInput(), { draftId: "draft_service_001" });
  if (!created.ok) assert.fail(created.error.message);
  const baseDecision = {
    approvalId: created.value.approvalId,
    runId: created.value.runId,
    actorId: "actor_workshop_reviewer",
  };

  const approved = application.decideApproval({ ...baseDecision, decision: "approved" });
  if (!approved.ok) assert.fail(approved.error.message);
  const duplicate = application.decideApproval({ ...baseDecision, decision: "approved" });
  const conflict = application.decideApproval({ ...baseDecision, decision: "declined" });

  assert.equal(duplicate.ok, false);
  if (duplicate.ok || duplicate.kind === "failure") assert.fail("Expected duplicate outcome");
  assert.equal(duplicate.kind, "duplicate");
  assert.deepEqual(duplicate.value, approved.value);
  assert.equal(conflict.ok, false);
  if (conflict.ok || conflict.kind === "failure") assert.fail("Expected conflict outcome");
  assert.equal(conflict.kind, "conflict");
  assert.deepEqual(conflict.value, approved.value);
  assert.equal(lineCount(approvalPath), 2);
  assert.deepEqual(
    readRunEvents(events, created.value.runId).map((event) => event.type),
    [
      "approval.requested",
      "approval.approved",
      "approval.decision_duplicate",
      "approval.decision_conflict",
    ],
  );
});

test("request retry repairs missing event after durable state was written", () => {
  const { approvalPath, eventPath } = paths();
  const failingEvents: ApprovalEventStore = {
    append: () => {
      throw new Error("sensitive event write detail");
    },
    readRun: () => ({ ok: true, value: [] }),
  };
  const first = service(approvalPath, failingEvents);
  const input = requestInput();
  const initial = first.requestApproval(input, { draftId: "draft_service_001" });
  assert.equal(initial.ok, false);
  if (initial.ok) assert.fail("Expected event storage failure");
  assert.equal(initial.error.code, "storage_failure");
  assert.equal(lineCount(approvalPath), 1);

  const events = new JsonlEventStore(eventPath);
  const recovered = service(approvalPath, events).requestApproval(input, {
    draftId: "draft_service_001",
  });
  assert.equal(recovered.ok, true);
  assert.equal(lineCount(approvalPath), 1);
  assert.deepEqual(
    readRunEvents(events, input.runId).map((event) => event.type),
    ["approval.requested"],
  );
});

test("decision retry repairs missing terminal event without another transition", () => {
  const { approvalPath, eventPath } = paths();
  const realEvents = new JsonlEventStore(eventPath);
  let failWrites = false;
  const events: ApprovalEventStore = {
    append: (input) => {
      if (failWrites) throw new Error("sensitive event outage");
      return realEvents.append(input);
    },
    readRun: (runId) => realEvents.readRun(runId),
  };
  const application = service(approvalPath, events);
  const created = application.requestApproval(requestInput(), { draftId: "draft_service_001" });
  if (!created.ok) assert.fail(created.error.message);
  const decision = {
    approvalId: created.value.approvalId,
    runId: created.value.runId,
    actorId: "actor_workshop_reviewer",
    decision: "approved" as const,
  };

  failWrites = true;
  const initial = application.decideApproval(decision);
  assert.equal(initial.ok, false);
  if (initial.ok) assert.fail("Expected event failure");
  assert.equal(initial.error.code, "storage_failure");
  assert.equal(lineCount(approvalPath), 2);

  failWrites = false;
  const recovered = application.decideApproval(decision);
  assert.equal(recovered.ok, false);
  if (recovered.ok || recovered.kind === "failure") assert.fail("Expected duplicate recovery");
  assert.equal(recovered.kind, "duplicate");
  assert.equal(lineCount(approvalPath), 2);
  assert.deepEqual(
    readRunEvents(realEvents, created.value.runId).map((event) => event.type),
    ["approval.requested", "approval.approved", "approval.decision_duplicate"],
  );
});

test("approval-store and metadata failures emit redacted storage evidence", () => {
  for (const makeApplication of [
    (approvalPath: string, events: ApprovalEventStore) =>
      new ApprovalService(
        new FileApprovalStore(approvalPath, {
          writeRecord: () => {
            throw new Error("sensitive approval write detail");
          },
        }),
        events,
        {
          authorizedActorIds: new Set(["actor_workshop_reviewer"]),
          makeApprovalId: () => "approval_service_001",
          now: () => "2026-08-04T10:00:00.000Z",
        },
      ),
    (approvalPath: string, events: ApprovalEventStore) =>
      service(approvalPath, events, {
        makeApprovalId: () => {
          throw "sensitive metadata detail";
        },
      }),
  ]) {
    const { approvalPath, eventPath } = paths();
    const events = new JsonlEventStore(eventPath);
    const outcome = makeApplication(approvalPath, events).requestApproval(requestInput(), {
      draftId: "draft_service_001",
    });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected storage failure");
    assert.deepEqual(outcome.error, makeApprovalFailure("storage_failure"));
    assert.doesNotMatch(JSON.stringify(readRunEvents(events, "run_service_001")), /sensitive/);
    const data = readRunEvents(events, "run_service_001")[0]?.data;
    assert.equal(data?.eventType, "approval.storage_failed");
    assert.equal(data?.operation, "request");
    assert.equal(data?.code, "storage_failure");
    assert.equal("draft" in (data ?? {}), false);
  }
});

test("decision store and clock failures preserve pending state and emit no terminal event", () => {
  for (const dependency of ["store", "clock"] as const) {
    const { approvalPath, eventPath } = paths();
    const events = new JsonlEventStore(eventPath);
    const created = service(approvalPath, events).requestApproval(requestInput(), {
      draftId: "draft_service_001",
    });
    if (!created.ok) assert.fail(created.error.message);

    const failing =
      dependency === "store"
        ? new ApprovalService(
            new FileApprovalStore(approvalPath, {
              writeRecord: () => {
                throw new Error("sensitive decision write detail");
              },
            }),
            events,
            {
              authorizedActorIds: new Set(["actor_workshop_reviewer"]),
              now: () => "2026-08-04T10:01:00.000Z",
            },
          )
        : new ApprovalService(new FileApprovalStore(approvalPath), events, {
            authorizedActorIds: new Set(["actor_workshop_reviewer"]),
            now: () => {
              throw null;
            },
          });
    const outcome = failing.decideApproval({
      approvalId: created.value.approvalId,
      runId: created.value.runId,
      actorId: "actor_workshop_reviewer",
      decision: "approved",
    });

    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected decision storage failure");
    assert.equal(outcome.kind, "failure");
    assert.equal(outcome.error.code, "storage_failure");
    assert.equal(lineCount(approvalPath), 1);
    assert.deepEqual(failing.get(created.value.approvalId), {
      ok: true,
      value: created.value,
    });
    const recorded = readRunEvents(events, created.value.runId);
    assert.equal(
      recorded.some((event) => event.type === "approval.approved"),
      false,
    );
    assert.equal(recorded.at(-1)?.type, "approval.storage_failed");
    assert.doesNotMatch(JSON.stringify(recorded), /sensitive/);
  }
});

test("event read failure during retry appends no state and returns typed storage failure", () => {
  const { approvalPath, eventPath } = paths();
  const realEvents = new JsonlEventStore(eventPath);
  const created = service(approvalPath, realEvents).requestApproval(requestInput(), {
    draftId: "draft_service_001",
  });
  if (!created.ok) assert.fail(created.error.message);
  const failingEvents: ApprovalEventStore = {
    append: (input) => realEvents.append(input),
    readRun: () => {
      throw "sensitive event read detail";
    },
  };

  const outcome = service(approvalPath, failingEvents).requestApproval(requestInput(), {
    draftId: "draft_service_001",
  });
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected event read failure");
  assert.equal(outcome.error.code, "storage_failure");
  assert.equal(lineCount(approvalPath), 1);
  assert.equal(
    readRunEvents(realEvents, created.value.runId).at(-1)?.type,
    "approval.storage_failed",
  );
  assert.doesNotMatch(JSON.stringify(readRunEvents(realEvents, created.value.runId)), /sensitive/);
});

test("terminal operational evidence excludes draft content and decision time", () => {
  const { approvalPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const application = service(approvalPath, events);
  const created = application.requestApproval(requestInput(), { draftId: "draft_service_001" });
  if (!created.ok) assert.fail(created.error.message);
  const decided = application.decideApproval({
    approvalId: created.value.approvalId,
    runId: created.value.runId,
    actorId: "actor_workshop_reviewer",
    decision: "declined",
  });
  if (!decided.ok) assert.fail(decided.error.message);

  const terminal = readRunEvents(events, created.value.runId).at(-1);
  assert.deepEqual(terminal?.data, {
    eventType: "approval.declined",
    approvalId: created.value.approvalId,
    actorId: "actor_workshop_reviewer",
    status: "declined",
  });
  assert.equal(JSON.stringify(terminal).includes(created.value.draft.content), false);
  assert.equal(JSON.stringify(terminal).includes(decided.value.decision.decidedAt), false);
});

test("invalid or mismatched replaceable-store outcomes fail closed", () => {
  const { eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const wrong = createPendingApproval(requestInput(), {
    approvalId: "approval_service_wrong_001",
    draftId: "draft_service_wrong_001",
    now: "2026-08-04T10:00:00.000Z",
  });
  if (!wrong.ok) assert.fail(wrong.error.message);
  const mismatchedStore: ApprovalStore = {
    appendRequest: () => ({ ok: true, value: wrong.value }),
    appendDecision: () => ({ ok: false, error: makeApprovalFailure("storage_failure") }),
    get: () => ({ ok: true, value: null }),
    listRun: () => ({ ok: true, value: [] }),
  };
  const mismatched = new ApprovalService(mismatchedStore, events, {
    makeApprovalId: () => "approval_service_expected_001",
    now: () => "2026-08-04T10:00:00.000Z",
  }).requestApproval(requestInput(), { draftId: "draft_service_expected_001" });
  assert.equal(mismatched.ok, false);
  if (mismatched.ok) assert.fail("Expected mismatched store failure");
  assert.equal(mismatched.error.code, "storage_failure");
  assert.equal(readRunEvents(events, "run_service_001").at(-1)?.type, "approval.storage_failed");

  const invalidStore = {
    ...mismatchedStore,
    get: () => ({ ok: true, value: { status: "pending" } }) as never,
    listRun: () => null as never,
  } satisfies ApprovalStore;
  const invalid = new ApprovalService(invalidStore, events);
  assert.deepEqual(invalid.get("approval_service_expected_001"), {
    ok: false,
    error: makeApprovalFailure("storage_failure"),
  });
  assert.deepEqual(invalid.listRun("run_service_001"), {
    ok: false,
    error: makeApprovalFailure("storage_failure"),
  });
});

test("malformed and cross-run event arrays cannot spoof request recovery", () => {
  for (const eventsFromRead of [
    [null],
    [
      {
        eventId: "event_cross_run",
        runId: "run_other",
        at: "2026-08-04T10:01:00.000Z",
        type: "approval.requested",
        data: {
          eventType: "approval.requested",
          approvalId: "approval_service_001",
          action: "send_follow_up",
          targetKind: "lead",
          leadId: "lead_ada",
          draftId: "draft_service_001",
          status: "pending",
        },
      },
    ],
  ]) {
    const { approvalPath, eventPath } = paths();
    const initial = service(approvalPath, {
      append: () => {
        throw new Error("initial event outage");
      },
      readRun: () => ({ ok: true, value: [] }),
    }).requestApproval(requestInput(), { draftId: "draft_service_001" });
    assert.equal(initial.ok, false);
    assert.equal(lineCount(approvalPath), 1);

    const realEvents = new JsonlEventStore(eventPath);
    const untrustedEvents: ApprovalEventStore = {
      append: (input) => realEvents.append(input),
      readRun: () => eventsFromRead as never,
    };
    const outcome = service(approvalPath, untrustedEvents).requestApproval(requestInput(), {
      draftId: "draft_service_001",
    });
    assert.equal(outcome.ok, false);
    if (outcome.ok) assert.fail("Expected untrusted event read failure");
    assert.equal(outcome.error.code, "storage_failure");
    assert.equal(lineCount(approvalPath), 1);
  }
});

test("the closed event boundary rejects mismatched type and data discriminants", () => {
  const { approvalPath, eventPath } = paths();
  const initial = service(approvalPath, {
    append: () => {
      throw new Error("initial event outage");
    },
    readRun: () => ({ ok: true, value: [] }),
  }).requestApproval(requestInput(), { draftId: "draft_service_001" });
  assert.equal(initial.ok, false);

  const realEvents = new JsonlEventStore(eventPath);
  const spoofed: ApprovalEventStore = {
    append: (input) => realEvents.append(input),
    readRun: () =>
      ({
        ok: true,
        value: [
          {
            schemaVersion: 1,
            eventId: "event_spoofed_type",
            runId: "run_service_001",
            at: "2026-08-04T10:01:00.000Z",
            type: "approval.requested",
            data: {
              eventType: "approval.invalid",
              approvalId: "approval_service_001",
              operation: "request",
              code: "duplicate_request",
            },
            metadata: {},
          },
        ],
      }) as never,
  };
  const recovered = service(approvalPath, spoofed).requestApproval(requestInput(), {
    draftId: "draft_service_001",
  });
  assert.equal(recovered.ok, false);
  if (recovered.ok) assert.fail("Expected mismatched event boundary failure");
  assert.equal(recovered.error.code, "storage_failure");
  assert.equal(lineCount(approvalPath), 1);
  assert.deepEqual(
    readRunEvents(realEvents, "run_service_001").map((event) => event.type),
    ["approval.storage_failed"],
  );
});

test("malformed decision identity remains invalid rather than becoming a storage claim", () => {
  const { approvalPath, eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const outcome = service(approvalPath, events).decideApproval({
    approvalId: "bad",
    runId: "run_service_001",
    actorId: "actor_workshop_reviewer",
    decision: "approved",
  });
  assert.equal(outcome.ok, false);
  if (outcome.ok) assert.fail("Expected invalid decision");
  assert.equal(outcome.kind, "failure");
  assert.equal(outcome.error.code, "invalid_decision");
  assert.deepEqual(readRunEvents(events, "run_service_001")[0]?.data, {
    eventType: "approval.invalid",
    operation: "decision",
    code: "invalid_decision",
  });
});

test("schema-valid dependency failure text is canonicalized before output or events", () => {
  const { eventPath } = paths();
  const events = new JsonlEventStore(eventPath);
  const sensitiveFailure = {
    ok: false as const,
    error: {
      code: "storage_failure" as const,
      message: "Sensitive replaceable-store detail.",
      retryable: true,
    },
  };
  const readStore: ApprovalStore = {
    appendRequest: () => sensitiveFailure,
    appendDecision: () => sensitiveFailure,
    get: () => sensitiveFailure,
    listRun: () => sensitiveFailure,
  };
  const reads = new ApprovalService(readStore, events);
  assert.deepEqual(reads.get("approval_service_001"), {
    ok: false,
    error: makeApprovalFailure("storage_failure"),
  });
  assert.deepEqual(reads.listRun("run_service_001"), {
    ok: false,
    error: makeApprovalFailure("storage_failure"),
  });

  const writeStore: ApprovalStore = {
    ...readStore,
    get: () => ({ ok: true, value: null }),
    listRun: () => ({ ok: true, value: [] }),
  };
  const written = new ApprovalService(writeStore, events, {
    makeApprovalId: () => "approval_service_001",
    now: () => "2026-08-04T10:00:00.000Z",
  }).requestApproval(requestInput(), { draftId: "draft_service_001" });
  assert.deepEqual(written, {
    ok: false,
    error: makeApprovalFailure("storage_failure"),
  });
  assert.doesNotMatch(
    JSON.stringify([written, readRunEvents(events, "run_service_001")]),
    /Sensitive/,
  );
});
