import { createHash, randomUUID } from "node:crypto";
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, parse, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SNAPSHOT_SCHEMA = "jsonl-snapshot-v1" as const;
const MANIFEST_FILE = "manifest.json";
const MAX_FILE_BYTES = 64 * 1024 * 1024;
const MAX_TOTAL_BYTES = 256 * 1024 * 1024;
const SAFE_JSONL_NAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}\.jsonl$/u;
const SAFE_SNAPSHOT_ID = /^snapshot-\d{8}T\d{6}Z-[a-f0-9]{12}$/u;
const SHA256 = /^[a-f0-9]{64}$/u;

type ManifestFile = Readonly<{
  name: string;
  bytes: number;
  sha256: string;
}>;

type SnapshotManifest = Readonly<{
  schema: typeof SNAPSHOT_SCHEMA;
  snapshotId: string;
  createdAt: string;
  files: readonly ManifestFile[];
}>;

export type SnapshotResult = Readonly<{
  path: string;
  fileCount: number;
  totalBytes: number;
}>;

export type SnapshotOptions = Readonly<{
  confirmedWritersStopped: boolean;
  now?: Date;
}>;

function fail(message: string): never {
  throw new Error(message);
}

function ownKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safePath(value: string, label: string): string {
  if (value.length === 0 || value.length > 4096 || value.includes("\0")) {
    fail(`${label} path is invalid.`);
  }
  const resolved = resolve(value);
  if (resolved === parse(resolved).root) fail(`${label} path cannot be a filesystem root.`);
  return resolved;
}

function isWithin(parent: string, child: string): boolean {
  const candidate = relative(parent, child);
  return candidate !== "" && !candidate.startsWith("..") && !isAbsolute(candidate);
}

function requireDirectory(path: string, label: string): void {
  let entry: ReturnType<typeof lstatSync>;
  try {
    entry = lstatSync(path);
  } catch {
    fail(`${label} directory is unavailable.`);
  }
  if (entry.isSymbolicLink() || !entry.isDirectory()) fail(`${label} must be a real directory.`);
  if (realpathSync(path) !== path) fail(`${label} must not traverse symbolic links.`);
}

function requireStopped(options: SnapshotOptions): void {
  if (options.confirmedWritersStopped !== true) {
    fail("All JSONL writers must be stopped and explicitly confirmed.");
  }
}

function sha256(value: Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function readValidatedJsonl(path: string, expectedName: string): Buffer {
  if (!SAFE_JSONL_NAME.test(expectedName)) fail("Snapshot JSONL filename is invalid.");
  const entry = lstatSync(path);
  if (entry.isSymbolicLink() || !entry.isFile()) fail("Snapshot input must be a regular file.");
  if (entry.size < 2 || entry.size > MAX_FILE_BYTES) fail("Snapshot JSONL size is invalid.");

  const value = readFileSync(path);
  if (value.length !== entry.size || value.at(-1) !== 0x0a) {
    fail("Snapshot JSONL must be complete and LF-terminated.");
  }

  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(value);
  } catch {
    fail("Snapshot JSONL must be valid UTF-8.");
  }
  const lines = text.slice(0, -1).split("\n");
  if (lines.some((line) => line.length === 0)) fail("Snapshot JSONL contains a blank record.");
  for (const line of lines) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(line) as unknown;
    } catch {
      fail("Snapshot JSONL contains invalid JSON.");
    }
    if (!isRecord(parsed)) fail("Snapshot JSONL records must be objects.");
  }
  return value;
}

function writeDurably(path: string, value: string | Buffer): void {
  const descriptor = openSync(path, "wx", 0o600);
  try {
    writeFileSync(descriptor, value);
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function fsyncDirectory(path: string): void {
  const descriptor = openSync(path, "r");
  try {
    fsyncSync(descriptor);
  } finally {
    closeSync(descriptor);
  }
}

function privateBackupRoot(path: string): void {
  if (!existsSync(path)) mkdirSync(path, { recursive: true, mode: 0o700 });
  requireDirectory(path, "Backup root");
  if ((statSync(path).mode & 0o077) !== 0)
    fail("Backup root permissions must exclude group and other access.");
}

function snapshotTimestamp(date: Date): string {
  if (Number.isNaN(date.getTime())) fail("Snapshot time is invalid.");
  const iso = date.toISOString();
  return iso.replace(/\.\d{3}Z$/u, "Z").replace(/[-:]/gu, "");
}

function isCanonicalTimestamp(value: string): boolean {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function manifestText(manifest: SnapshotManifest): string {
  return `${JSON.stringify(manifest, null, 2)}\n`;
}

function parseManifest(
  snapshotPath: string,
  expectedSnapshotId = basename(snapshotPath),
): SnapshotManifest {
  const manifestPath = resolve(snapshotPath, MANIFEST_FILE);
  const entry = lstatSync(manifestPath);
  if (entry.isSymbolicLink() || !entry.isFile() || entry.size < 2 || entry.size > 1024 * 1024) {
    fail("Snapshot manifest is invalid.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(manifestPath, "utf8")) as unknown;
  } catch {
    fail("Snapshot manifest is invalid JSON.");
  }
  if (
    !isRecord(parsed) ||
    !ownKeys(parsed, ["schema", "snapshotId", "createdAt", "files"]) ||
    parsed.schema !== SNAPSHOT_SCHEMA ||
    parsed.snapshotId !== expectedSnapshotId ||
    typeof parsed.snapshotId !== "string" ||
    !SAFE_SNAPSHOT_ID.test(parsed.snapshotId) ||
    typeof parsed.createdAt !== "string" ||
    !isCanonicalTimestamp(parsed.createdAt) ||
    !Array.isArray(parsed.files) ||
    parsed.files.length === 0 ||
    parsed.files.length > 100
  ) {
    fail("Snapshot manifest contract is invalid.");
  }

  const names = new Set<string>();
  const files: ManifestFile[] = [];
  let manifestBytes = 0;
  for (const candidate of parsed.files) {
    if (
      !isRecord(candidate) ||
      !ownKeys(candidate, ["name", "bytes", "sha256"]) ||
      typeof candidate.name !== "string" ||
      !SAFE_JSONL_NAME.test(candidate.name) ||
      names.has(candidate.name) ||
      !Number.isSafeInteger(candidate.bytes) ||
      (candidate.bytes as number) < 2 ||
      (candidate.bytes as number) > MAX_FILE_BYTES ||
      typeof candidate.sha256 !== "string" ||
      !SHA256.test(candidate.sha256)
    ) {
      fail("Snapshot manifest file entry is invalid.");
    }
    names.add(candidate.name);
    manifestBytes += candidate.bytes as number;
    if (manifestBytes > MAX_TOTAL_BYTES) fail("Snapshot manifest exceeds the total size bound.");
    files.push({
      name: candidate.name,
      bytes: candidate.bytes as number,
      sha256: candidate.sha256,
    });
  }

  const expectedEntries = [MANIFEST_FILE, ...files.map((file) => file.name)].sort();
  const actualEntries = readdirSync(snapshotPath).sort();
  if (
    expectedEntries.length !== actualEntries.length ||
    expectedEntries.some((name, index) => name !== actualEntries[index])
  ) {
    fail("Snapshot directory contents do not match the manifest.");
  }

  return Object.freeze({
    schema: SNAPSHOT_SCHEMA,
    snapshotId: parsed.snapshotId,
    createdAt: parsed.createdAt,
    files: Object.freeze(files.map((file) => Object.freeze(file))),
  });
}

function cleanupOwned(path: string, parent: string, prefix: string): void {
  if (dirname(path) === parent && basename(path).startsWith(prefix) && existsSync(path)) {
    rmSync(path, { recursive: true, force: false });
  }
}

export function createJsonlSnapshot(
  sourceInput: string,
  backupRootInput: string,
  options: SnapshotOptions,
): SnapshotResult {
  requireStopped(options);
  const sourcePath = safePath(sourceInput, "Source");
  const backupRoot = safePath(backupRootInput, "Backup root");
  if (isWithin(sourcePath, backupRoot) || isWithin(backupRoot, sourcePath)) {
    fail("Source and backup root must not contain one another.");
  }
  requireDirectory(sourcePath, "Source");
  privateBackupRoot(backupRoot);

  const names = readdirSync(sourcePath)
    .filter((name) => name.endsWith(".jsonl"))
    .sort();
  if (names.length === 0 || names.length > 100)
    fail("Source must contain 1 through 100 JSONL files.");

  const values: Array<{ name: string; value: Buffer; bytes: number; sha256: string }> = [];
  let totalBytes = 0;
  for (const name of names) {
    const value = readValidatedJsonl(resolve(sourcePath, name), name);
    totalBytes += value.length;
    if (totalBytes > MAX_TOTAL_BYTES) fail("Snapshot total size exceeds the configured bound.");
    values.push({ name, value, bytes: value.length, sha256: sha256(value) });
  }

  const now = options.now ?? new Date();
  const createdAt = Number.isNaN(now.getTime())
    ? fail("Snapshot time is invalid.")
    : now.toISOString();
  const snapshotId = `snapshot-${snapshotTimestamp(now)}-${randomUUID().replaceAll("-", "").slice(0, 12)}`;
  const finalPath = resolve(backupRoot, snapshotId);
  const stagingPath = resolve(backupRoot, `.snapshot-staging-${snapshotId}`);
  if (existsSync(finalPath) || existsSync(stagingPath))
    fail("Snapshot destination already exists.");

  try {
    mkdirSync(stagingPath, { mode: 0o700 });
    for (const file of values) writeDurably(resolve(stagingPath, file.name), file.value);
    const manifest: SnapshotManifest = Object.freeze({
      schema: SNAPSHOT_SCHEMA,
      snapshotId,
      createdAt,
      files: Object.freeze(
        values.map((file) =>
          Object.freeze({ name: file.name, bytes: file.bytes, sha256: file.sha256 }),
        ),
      ),
    });
    writeDurably(resolve(stagingPath, MANIFEST_FILE), manifestText(manifest));
    fsyncDirectory(stagingPath);

    const verified = parseManifest(stagingPath, snapshotId);
    for (const file of verified.files) {
      const value = readValidatedJsonl(resolve(stagingPath, file.name), file.name);
      if (value.length !== file.bytes || sha256(value) !== file.sha256) {
        fail("Snapshot verification failed before activation.");
      }
    }
  } catch (error) {
    cleanupOwned(stagingPath, backupRoot, ".snapshot-staging-");
    throw error;
  }

  let activated = false;
  try {
    renameSync(stagingPath, finalPath);
    activated = true;
    fsyncDirectory(backupRoot);
    const manifest = parseManifest(finalPath);
    for (const file of manifest.files) {
      const value = readValidatedJsonl(resolve(finalPath, file.name), file.name);
      if (value.length !== file.bytes || sha256(value) !== file.sha256) {
        fail("Snapshot verification failed after persistence.");
      }
    }
  } catch (error) {
    cleanupOwned(stagingPath, backupRoot, ".snapshot-staging-");
    if (activated) cleanupOwned(finalPath, backupRoot, "snapshot-");
    throw error;
  }

  return Object.freeze({ path: finalPath, fileCount: values.length, totalBytes });
}

export function restoreJsonlSnapshot(
  snapshotInput: string,
  destinationInput: string,
  options: SnapshotOptions,
): SnapshotResult {
  requireStopped(options);
  const snapshotPath = safePath(snapshotInput, "Snapshot");
  const destinationPath = safePath(destinationInput, "Restore destination");
  requireDirectory(snapshotPath, "Snapshot");
  if (existsSync(destinationPath)) fail("Restore destination must not already exist.");
  if (isWithin(snapshotPath, destinationPath) || isWithin(destinationPath, snapshotPath)) {
    fail("Snapshot and restore destination must not contain one another.");
  }

  const manifest = parseManifest(snapshotPath);
  const totalBytes = manifest.files.reduce((total, file) => total + file.bytes, 0);
  const values = manifest.files.map((file) => {
    const value = readValidatedJsonl(resolve(snapshotPath, file.name), file.name);
    if (value.length !== file.bytes || sha256(value) !== file.sha256) {
      fail("Snapshot file does not match its manifest.");
    }
    return { ...file, value };
  });

  const destinationParent = dirname(destinationPath);
  requireDirectory(destinationParent, "Restore parent");
  const stagingPath = resolve(
    destinationParent,
    `.${basename(destinationPath)}.restore-staging-${randomUUID().slice(0, 12)}`,
  );
  try {
    mkdirSync(stagingPath, { mode: 0o700 });
    for (const file of values) writeDurably(resolve(stagingPath, file.name), file.value);
    for (const file of values) {
      const restored = readValidatedJsonl(resolve(stagingPath, file.name), file.name);
      if (restored.length !== file.bytes || sha256(restored) !== file.sha256) {
        fail("Restored file verification failed before activation.");
      }
    }
    fsyncDirectory(stagingPath);
    renameSync(stagingPath, destinationPath);
    chmodSync(destinationPath, 0o700);
    fsyncDirectory(destinationParent);
  } catch (error) {
    cleanupOwned(stagingPath, destinationParent, `.${basename(destinationPath)}.restore-staging-`);
    throw error;
  }

  return Object.freeze({ path: destinationPath, fileCount: values.length, totalBytes });
}

function runCli(): void {
  const [operation, firstPath, secondPath, ...extras] = process.argv.slice(2);
  if (
    (operation !== "backup" && operation !== "restore") ||
    typeof firstPath !== "string" ||
    typeof secondPath !== "string" ||
    extras.length > 0
  ) {
    fail("Usage: data-snapshot <backup|restore> <source> <destination>.");
  }
  const options = { confirmedWritersStopped: process.env.CONFIRM_WRITERS_STOPPED === "true" };
  const result =
    operation === "backup"
      ? createJsonlSnapshot(firstPath, secondPath, options)
      : restoreJsonlSnapshot(firstPath, secondPath, options);
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runCli();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Snapshot operation failed.";
    process.stderr.write(`Snapshot operation failed: ${message}\n`);
    process.exitCode = 1;
  }
}
