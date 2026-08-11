import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  writeSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { isDeepStrictEqual } from "node:util";
import {
  isProductionEvalArtifact,
  makeProductionEvalArtifactStoreFailure,
  type ProductionEvalArtifact,
  type ProductionEvalArtifactAppendOutcome,
  type ProductionEvalArtifactStore,
} from "./production-eval-runner.js";

export type ProductionEvalArtifactReadText = (path: string) => string;
export type ProductionEvalArtifactWriteRecord = (path: string, serialized: string) => void;

export type FileProductionEvalArtifactStoreOptions = {
  readText?: ProductionEvalArtifactReadText;
  writeRecord?: ProductionEvalArtifactWriteRecord;
};

export type ProductionEvalArtifactListOutcome =
  | { ok: true; value: ProductionEvalArtifact[] }
  | {
      ok: false;
      error: Extract<ProductionEvalArtifactAppendOutcome, { ok: false }>["error"];
    };

type ArtifactProjectionOutcome =
  | { ok: true; value: ProductionEvalArtifact[] }
  | {
      ok: false;
      value: Extract<ProductionEvalArtifactAppendOutcome, { ok: false }>;
    };

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function defaultReadText(path: string): string {
  return readFileSync(path, "utf8");
}

function defaultWriteRecord(path: string, serialized: string): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  let descriptor: number | undefined;
  try {
    descriptor = openSync(path, "a", 0o600);
    chmodSync(path, 0o600);
    writeSync(descriptor, serialized, undefined, "utf8");
    fsyncSync(descriptor);
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
  }
}

function validPath(path: unknown): path is string {
  return (
    typeof path === "string" && path.length > 0 && path.length <= 4_096 && !path.includes("\0")
  );
}

function projectText(text: string): ArtifactProjectionOutcome {
  if (text.length === 0 || !text.endsWith("\n")) {
    return { ok: false, value: makeProductionEvalArtifactStoreFailure("interrupted_artifact") };
  }
  const artifacts: ProductionEvalArtifact[] = [];
  const runIds = new Set<string>();
  let previousFinishedAt = Number.NEGATIVE_INFINITY;
  for (const line of text.slice(0, -1).split("\n")) {
    if (line.length === 0) {
      return { ok: false, value: makeProductionEvalArtifactStoreFailure("corrupt_artifact") };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch {
      return { ok: false, value: makeProductionEvalArtifactStoreFailure("corrupt_artifact") };
    }
    if (!isProductionEvalArtifact(parsed)) {
      return { ok: false, value: makeProductionEvalArtifactStoreFailure("corrupt_artifact") };
    }
    if (runIds.has(parsed.runId)) {
      return { ok: false, value: makeProductionEvalArtifactStoreFailure("artifact_conflict") };
    }
    const finishedAt = Date.parse(parsed.finishedAt);
    if (finishedAt < previousFinishedAt) {
      return { ok: false, value: makeProductionEvalArtifactStoreFailure("corrupt_artifact") };
    }
    runIds.add(parsed.runId);
    previousFinishedAt = finishedAt;
    artifacts.push(parsed);
  }
  return { ok: true, value: artifacts };
}

export class FileProductionEvalArtifactStore implements ProductionEvalArtifactStore {
  private readonly path: string;
  private readonly readText: ProductionEvalArtifactReadText;
  private readonly writeRecord: ProductionEvalArtifactWriteRecord;
  private readonly missingFileIsEmpty: boolean;

  constructor(path: string, options: FileProductionEvalArtifactStoreOptions = {}) {
    if (!validPath(path)) throw new Error("Production eval artifact path is invalid.");
    let readText: unknown;
    let writeRecord: unknown;
    try {
      if (typeof options !== "object" || options === null) {
        throw new Error("Invalid options.");
      }
      readText = options.readText;
      writeRecord = options.writeRecord;
    } catch {
      throw new Error("Production eval artifact store configuration is invalid.");
    }
    if (
      (readText !== undefined && typeof readText !== "function") ||
      (writeRecord !== undefined && typeof writeRecord !== "function")
    ) {
      throw new Error("Production eval artifact store configuration is invalid.");
    }
    this.path = resolve(path);
    this.missingFileIsEmpty = readText === undefined;
    this.readText = (readText ?? defaultReadText) as ProductionEvalArtifactReadText;
    this.writeRecord = (writeRecord ?? defaultWriteRecord) as ProductionEvalArtifactWriteRecord;
  }

  private readProjection(): ArtifactProjectionOutcome {
    let text: string;
    try {
      text = this.readText(this.path);
    } catch {
      if (this.missingFileIsEmpty && !existsSync(this.path)) return { ok: true, value: [] };
      return { ok: false, value: makeProductionEvalArtifactStoreFailure("storage_failure") };
    }
    return typeof text === "string"
      ? projectText(text)
      : { ok: false, value: makeProductionEvalArtifactStoreFailure("storage_failure") };
  }

  append(input: unknown): ProductionEvalArtifactAppendOutcome {
    let candidate: unknown;
    try {
      candidate = structuredClone(input);
    } catch {
      return makeProductionEvalArtifactStoreFailure("invalid_artifact");
    }
    if (!isProductionEvalArtifact(candidate)) {
      return makeProductionEvalArtifactStoreFailure("invalid_artifact");
    }
    const artifact = candidate;
    const before = this.readProjection();
    if (!before.ok) return before.value;
    const existing = before.value.find((candidate) => candidate.runId === artifact.runId);
    if (existing) {
      return isDeepStrictEqual(existing, artifact)
        ? deepFreeze({ ok: true, value: structuredClone(existing) })
        : makeProductionEvalArtifactStoreFailure("artifact_conflict");
    }
    const last = before.value.at(-1);
    if (last && Date.parse(artifact.finishedAt) < Date.parse(last.finishedAt)) {
      return makeProductionEvalArtifactStoreFailure("artifact_conflict");
    }
    try {
      this.writeRecord(this.path, `${JSON.stringify(artifact)}\n`);
    } catch {
      return makeProductionEvalArtifactStoreFailure("storage_failure");
    }
    const after = this.readProjection();
    if (!after.ok) return after.value;
    const persisted = after.value.find((candidate) => candidate.runId === artifact.runId);
    return after.value.length === before.value.length + 1 && isDeepStrictEqual(persisted, artifact)
      ? deepFreeze({ ok: true, value: structuredClone(artifact) })
      : makeProductionEvalArtifactStoreFailure("storage_failure");
  }

  list(): ProductionEvalArtifactListOutcome {
    const projection = this.readProjection();
    return projection.ok
      ? deepFreeze({ ok: true, value: structuredClone(projection.value) })
      : deepFreeze({ ok: false, error: projection.value.error });
  }
}
