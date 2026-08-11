import { lstatSync, realpathSync } from "node:fs";
import { isAbsolute, parse, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { JsonlEventStore } from "../src/event-store.js";
import { buildRunReport, makeRunReportFailure, renderRunReportText } from "../src/run-report.js";
import { isRunId } from "../src/run-event.js";

const MAX_EVENT_FILE_BYTES = 64 * 1024 * 1024;

type CliInput = Readonly<{
  runId: string;
  eventLog: string;
  format: "json" | "text";
}>;

function parseArguments(args: readonly string[]): CliInput | null {
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index];
    const value = args[index + 1];
    if (
      key === undefined ||
      value === undefined ||
      !["--run-id", "--event-log", "--format"].includes(key) ||
      values.has(key) ||
      value.length === 0
    ) {
      return null;
    }
    values.set(key, value);
  }
  if (values.size < 2 || values.size > 3) return null;
  const runId = values.get("--run-id");
  const eventLog = values.get("--event-log");
  const format = values.get("--format") ?? "text";
  return runId !== undefined && eventLog !== undefined && (format === "json" || format === "text")
    ? Object.freeze({ runId, eventLog, format })
    : null;
}

function safeEvidencePath(value: string): string | null {
  if (value.length === 0 || value.length > 4_096 || value.includes("\0")) return null;
  const resolved = resolve(value);
  if (!isAbsolute(resolved) || resolved === parse(resolved).root) return null;
  try {
    const entry = lstatSync(resolved);
    if (
      entry.isSymbolicLink() ||
      !entry.isFile() ||
      entry.size < 2 ||
      entry.size > MAX_EVENT_FILE_BYTES ||
      realpathSync(resolved) !== resolved
    ) {
      return null;
    }
    return resolved;
  } catch {
    return null;
  }
}

function writeFailure(
  error: Readonly<{ code: string; message: string; retryable: boolean }>,
): void {
  process.stderr.write(`${JSON.stringify({ ok: false, error })}\n`);
}

export function main(args: readonly string[]): number {
  const parsed = parseArguments(args);
  if (parsed === null || !isRunId(parsed.runId)) {
    writeFailure(makeRunReportFailure("invalid_input"));
    return 2;
  }
  const eventPath = safeEvidencePath(parsed.eventLog);
  if (eventPath === null) {
    writeFailure(makeRunReportFailure("invalid_evidence_path"));
    return 2;
  }

  const outcome = buildRunReport(new JsonlEventStore(eventPath), { runId: parsed.runId });
  if (!outcome.ok) {
    writeFailure(outcome.error);
    return 1;
  }
  if (parsed.format === "json") {
    process.stdout.write(`${JSON.stringify({ ok: true, report: outcome.value })}\n`);
    return 0;
  }
  const rendered = renderRunReportText(outcome.value);
  if (!rendered.ok) {
    writeFailure(rendered.error);
    return 1;
  }
  process.stdout.write(rendered.value);
  return 0;
}

const isDirect =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirect) process.exitCode = main(process.argv.slice(2));
