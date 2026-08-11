import { randomUUID } from "node:crypto";
import {
  closeSync,
  fchmodSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  createAgentEvent,
  freezeAgentEvent,
  isAgentEvent,
  isRunId,
  makeRunEventFailure,
  type AgentEvent,
  type RunEventAppendOutcome,
  type RunEventFailure,
  type RunEventInput,
  type RunEventReadOutcome,
  type RunEventStore,
} from "./run-event.js";

export type { AgentEvent, RunEventAppendOutcome, RunEventReadOutcome } from "./run-event.js";

export type RunEventFileOperations = {
  readText(path: string): unknown;
  ensureDirectory(path: string): void;
  openFile(path: string): number;
  setPrivateMode(descriptor: number): void;
  writeRecord(descriptor: number, serializedRecord: string): void;
  syncFile(descriptor: number): void;
  closeFile(descriptor: number): void;
};

export type JsonlEventStoreOptions = {
  makeEventId?: () => string;
  now?: () => string;
  applicationVersion?: string;
  operations?: Partial<RunEventFileOperations>;
};

type LoadEventsOutcome = { ok: true; value: AgentEvent[] } | { ok: false; error: RunEventFailure };

function readApplicationVersion(): string {
  try {
    const metadata: unknown = createRequire(import.meta.url)("../package.json");
    if (
      typeof metadata === "object" &&
      metadata !== null &&
      "version" in metadata &&
      typeof metadata.version === "string" &&
      /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(metadata.version)
    ) {
      return metadata.version;
    }
  } catch {
    // The stable error below deliberately excludes module paths and loader detail.
  }
  throw new Error("Package version metadata is unavailable.");
}

export const APPLICATION_VERSION = readApplicationVersion();

const defaultOperations: RunEventFileOperations = {
  readText: (path) => readFileSync(path, "utf8"),
  ensureDirectory: (path) => mkdirSync(path, { recursive: true, mode: 0o700 }),
  openFile: (path) => openSync(path, "a", 0o600),
  setPrivateMode: (descriptor) => fchmodSync(descriptor, 0o600),
  writeRecord: (descriptor, serializedRecord) =>
    writeFileSync(descriptor, serializedRecord, "utf8"),
  syncFile: (descriptor) => fsyncSync(descriptor),
  closeFile: (descriptor) => closeSync(descriptor),
};

function isMissingFileError(error: unknown): boolean {
  try {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: unknown }).code === "ENOENT"
    );
  } catch {
    return false;
  }
}

function isValidPath(path: unknown): path is string {
  return (
    typeof path === "string" &&
    path.length > 0 &&
    path.length <= 4_096 &&
    !path.includes("\0") &&
    dirname(path).length > 0
  );
}

function isValidFunction(value: unknown): value is (...args: never[]) => unknown {
  return typeof value === "function";
}

function freezeSuccess<T>(value: T): { ok: true; value: T } {
  if (Array.isArray(value)) Object.freeze(value);
  return Object.freeze({ ok: true as const, value });
}

function freezeFailure(error: RunEventFailure): { ok: false; error: RunEventFailure } {
  return Object.freeze({ ok: false as const, error });
}

function parseEventLines(text: string): LoadEventsOutcome {
  if (text.length === 0) return freezeSuccess([]);
  if (!text.endsWith("\n")) {
    return freezeFailure(makeRunEventFailure("interrupted_write"));
  }

  const events: AgentEvent[] = [];
  const eventIds = new Set<string>();
  const lastRunTime = new Map<string, number>();
  for (const line of text.slice(0, -1).split("\n")) {
    if (line.length === 0) {
      return freezeFailure(makeRunEventFailure("corrupt_record"));
    }
    let candidate: unknown;
    try {
      candidate = JSON.parse(line);
    } catch {
      return freezeFailure(makeRunEventFailure("corrupt_record"));
    }
    if (!isAgentEvent(candidate)) {
      return freezeFailure(makeRunEventFailure("corrupt_record"));
    }
    if (eventIds.has(candidate.eventId)) {
      return freezeFailure(makeRunEventFailure("duplicate_event"));
    }
    eventIds.add(candidate.eventId);

    const timestamp = Date.parse(candidate.at);
    const previous = lastRunTime.get(candidate.runId);
    if (previous !== undefined && timestamp < previous) {
      return freezeFailure(makeRunEventFailure("out_of_order_record"));
    }
    lastRunTime.set(candidate.runId, timestamp);
    events.push(freezeAgentEvent(candidate));
  }
  return freezeSuccess(events);
}

export class JsonlEventStore implements RunEventStore {
  private readonly pathIsValid: boolean;
  private readonly makeEventId: () => string;
  private readonly now: () => string;
  private readonly applicationVersion: string;
  private readonly operations: RunEventFileOperations;
  private isAppending = false;

  constructor(
    private readonly path: string,
    options: JsonlEventStoreOptions = {},
  ) {
    const operationOverrides = options.operations ?? {};
    this.pathIsValid =
      isValidPath(path) &&
      (options.makeEventId === undefined || isValidFunction(options.makeEventId)) &&
      (options.now === undefined || isValidFunction(options.now)) &&
      (options.applicationVersion === undefined ||
        (typeof options.applicationVersion === "string" &&
          /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/.test(options.applicationVersion))) &&
      Object.entries(operationOverrides).every(([, operation]) => isValidFunction(operation));
    this.makeEventId = options.makeEventId ?? (() => `event_${randomUUID()}`);
    this.now = options.now ?? (() => new Date().toISOString());
    this.applicationVersion = options.applicationVersion ?? APPLICATION_VERSION;
    this.operations = Object.freeze({ ...defaultOperations, ...operationOverrides });
  }

  private loadEvents(): LoadEventsOutcome {
    if (!this.pathIsValid) {
      return freezeFailure(makeRunEventFailure("storage_failure"));
    }
    let text: unknown;
    try {
      text = this.operations.readText(this.path);
    } catch (error) {
      return isMissingFileError(error)
        ? freezeSuccess([])
        : freezeFailure(makeRunEventFailure("storage_failure"));
    }
    return typeof text === "string"
      ? parseEventLines(text)
      : freezeFailure(makeRunEventFailure("storage_failure"));
  }

  private generatedFields(): unknown {
    try {
      return {
        eventId: this.makeEventId(),
        at: this.now(),
        applicationVersion: this.applicationVersion,
      };
    } catch {
      return null;
    }
  }

  private write(serializedRecord: string): RunEventFailure | undefined {
    let descriptor: number | undefined;
    let writeAttempted = false;
    let failure: RunEventFailure | undefined;
    try {
      this.operations.ensureDirectory(dirname(this.path));
      descriptor = this.operations.openFile(this.path);
      this.operations.setPrivateMode(descriptor);
      writeAttempted = true;
      this.operations.writeRecord(descriptor, serializedRecord);
      this.operations.syncFile(descriptor);
    } catch {
      failure = makeRunEventFailure(writeAttempted ? "interrupted_write" : "storage_failure");
    } finally {
      if (descriptor !== undefined) {
        try {
          this.operations.closeFile(descriptor);
        } catch {
          failure ??= makeRunEventFailure(writeAttempted ? "interrupted_write" : "storage_failure");
        }
      }
    }
    return failure;
  }

  append(input: unknown): RunEventAppendOutcome {
    if (this.isAppending) {
      return freezeFailure(makeRunEventFailure("storage_failure"));
    }
    const created = createAgentEvent(input, this.generatedFields());
    if (!created.ok) return freezeFailure(created.error);

    this.isAppending = true;
    try {
      const before = this.loadEvents();
      if (!before.ok) return before;
      if (before.value.some((event) => event.eventId === created.value.eventId)) {
        return freezeFailure(makeRunEventFailure("duplicate_event"));
      }
      const lastForRun = [...before.value]
        .reverse()
        .find((event) => event.runId === created.value.runId);
      if (lastForRun && Date.parse(created.value.at) < Date.parse(lastForRun.at)) {
        return freezeFailure(makeRunEventFailure("out_of_order_record"));
      }

      const writeFailure = this.write(`${JSON.stringify(created.value)}\n`);
      if (writeFailure) return freezeFailure(writeFailure);

      const after = this.loadEvents();
      if (!after.ok) {
        return freezeFailure(makeRunEventFailure("interrupted_write"));
      }
      const exactAppend =
        after.value.length === before.value.length + 1 &&
        before.value.every((event, index) => isDeepStrictEqual(event, after.value[index])) &&
        isDeepStrictEqual(after.value.at(-1), created.value);
      return exactAppend
        ? freezeSuccess(created.value)
        : freezeFailure(makeRunEventFailure("interrupted_write"));
    } finally {
      this.isAppending = false;
    }
  }

  readRun(runId: unknown): RunEventReadOutcome {
    if (!isRunId(runId)) {
      return freezeFailure(makeRunEventFailure("invalid_input"));
    }
    const loaded = this.loadEvents();
    return loaded.ok
      ? freezeSuccess(loaded.value.filter((event) => event.runId === runId))
      : loaded;
  }
}

export function isRunEventStore(
  value: unknown,
): value is Pick<RunEventStore, "append" | "readRun"> {
  try {
    return (
      typeof value === "object" &&
      value !== null &&
      "append" in value &&
      typeof value.append === "function" &&
      "readRun" in value &&
      typeof value.readRun === "function"
    );
  } catch {
    return false;
  }
}

export type EventStoreInput = RunEventInput;
