import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test, { afterEach } from "node:test";

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT_SCRIPT = resolve(PROJECT_ROOT, "scripts/data-snapshot.ts");
const temporaryRoots = new Set<string>();

type CommandResult = Readonly<{
  status: number | null;
  stdout: string;
  stderr: string;
}>;

function fixtureRoot(): string {
  const root = mkdtempSync(resolve(tmpdir(), "agent-workshop-snapshot-"));
  chmodSync(root, 0o700);
  temporaryRoots.add(root);
  return root;
}

function writeJsonl(path: string, records: readonly Record<string, unknown>[]): void {
  writeFileSync(path, `${records.map((record) => JSON.stringify(record)).join("\n")}\n`, {
    mode: 0o600,
  });
}

function runSnapshot(args: readonly string[], confirmedWritersStopped = true): CommandResult {
  const childEnvironment = { ...process.env };
  delete childEnvironment.NODE_V8_COVERAGE;
  const result = spawnSync(process.execPath, ["--import", "tsx", SNAPSHOT_SCRIPT, ...args], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env: {
      ...childEnvironment,
      CONFIRM_WRITERS_STOPPED: confirmedWritersStopped ? "true" : "false",
    },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

function parseResult(stdout: string): Readonly<{
  path: string;
  fileCount: number;
  totalBytes: number;
}> {
  const value = JSON.parse(stdout) as unknown;
  assert.ok(value && typeof value === "object" && !Array.isArray(value));
  assert.equal(typeof (value as Record<string, unknown>).path, "string");
  assert.equal(typeof (value as Record<string, unknown>).fileCount, "number");
  assert.equal(typeof (value as Record<string, unknown>).totalBytes, "number");
  return value as { path: string; fileCount: number; totalBytes: number };
}

afterEach(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
  temporaryRoots.clear();
});

test("offline command snapshots and restores exact verified JSONL files", () => {
  const root = fixtureRoot();
  const source = resolve(root, "source");
  const backups = resolve(root, "backups");
  const restored = resolve(root, "restored");
  mkdirSync(source, { mode: 0o700 });
  writeJsonl(resolve(source, "approvals.jsonl"), [
    { approvalId: "approval-1", status: "approved" },
  ]);
  writeJsonl(resolve(source, "events.jsonl"), [
    { eventId: "event-1", type: "run.started" },
    { eventId: "event-2", type: "run.completed" },
  ]);

  const backup = runSnapshot(["backup", source, backups]);
  assert.equal(backup.status, 0, backup.stderr);
  const backupResult = parseResult(backup.stdout);
  assert.equal(backupResult.fileCount, 2);
  assert.ok(backupResult.totalBytes > 0);
  assert.equal(dirname(backupResult.path), backups);
  assert.deepEqual(readdirSync(backupResult.path).sort(), [
    "approvals.jsonl",
    "events.jsonl",
    "manifest.json",
  ]);

  const restore = runSnapshot(["restore", backupResult.path, restored]);
  assert.equal(restore.status, 0, restore.stderr);
  const restoreResult = parseResult(restore.stdout);
  assert.equal(restoreResult.path, restored);
  assert.equal(restoreResult.fileCount, 2);
  for (const name of ["approvals.jsonl", "events.jsonl"]) {
    assert.equal(
      readFileSync(resolve(restored, name), "utf8"),
      readFileSync(resolve(source, name), "utf8"),
    );
    assert.equal(statSync(resolve(restored, name)).mode & 0o777, 0o600);
  }
  assert.equal(statSync(restored).mode & 0o777, 0o700);
});

test("backup command requires stopped-writer confirmation and complete JSONL", () => {
  const root = fixtureRoot();
  const source = resolve(root, "source");
  const backups = resolve(root, "backups");
  mkdirSync(source, { mode: 0o700 });
  writeJsonl(resolve(source, "events.jsonl"), [{ eventId: "event-1" }]);

  const unconfirmed = runSnapshot(["backup", source, backups], false);
  assert.equal(unconfirmed.status, 1);
  assert.match(unconfirmed.stderr, /writers must be stopped/iu);
  assert.equal(existsSync(backups), false);

  writeFileSync(resolve(source, "events.jsonl"), '{"eventId":"truncated"}', { mode: 0o600 });
  const truncated = runSnapshot(["backup", source, backups]);
  assert.equal(truncated.status, 1);
  assert.match(truncated.stderr, /LF-terminated/iu);
  assert.equal(readdirSync(backups).length, 0);
});

test("restore command fails closed on checksum mismatch without replacing data", () => {
  const root = fixtureRoot();
  const source = resolve(root, "source");
  const backups = resolve(root, "backups");
  const restored = resolve(root, "restored");
  mkdirSync(source, { mode: 0o700 });
  writeJsonl(resolve(source, "events.jsonl"), [{ eventId: "event-1", status: "started" }]);

  const backup = runSnapshot(["backup", source, backups]);
  assert.equal(backup.status, 0, backup.stderr);
  const backupResult = parseResult(backup.stdout);
  writeJsonl(resolve(backupResult.path, "events.jsonl"), [
    { eventId: "event-1", status: "falsified" },
  ]);

  const restore = runSnapshot(["restore", backupResult.path, restored]);
  assert.equal(restore.status, 1);
  assert.match(restore.stderr, /does not match its manifest/iu);
  assert.equal(existsSync(restored), false);
});
