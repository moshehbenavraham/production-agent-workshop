import { evaluateReleasePreflight } from "../src/release-preflight.js";

export const MAX_RELEASE_PREFLIGHT_INPUT_BYTES = 64 * 1024;

type CommandFailure = Readonly<{
  code: "invalid_release_preflight_command" | "release_preflight_command_failed";
  message:
    | "Release preflight command requires one bounded JSON object on stdin and no arguments."
    | "Release preflight command failed.";
}>;

function writeJson(stream: NodeJS.WriteStream, value: unknown): void {
  stream.write(`${JSON.stringify(value)}\n`);
}

function invalidCommand(): CommandFailure {
  return Object.freeze({
    code: "invalid_release_preflight_command",
    message:
      "Release preflight command requires one bounded JSON object on stdin and no arguments.",
  });
}

function commandFailed(): CommandFailure {
  return Object.freeze({
    code: "release_preflight_command_failed",
    message: "Release preflight command failed.",
  });
}

async function readBoundedStdin(): Promise<string | null> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of process.stdin) {
    if (typeof chunk !== "string" && !Buffer.isBuffer(chunk)) return null;
    const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
    total += buffer.byteLength;
    if (total > MAX_RELEASE_PREFLIGHT_INPUT_BYTES) return null;
    chunks.push(buffer);
  }
  if (total === 0) return null;
  return Buffer.concat(chunks, total).toString("utf8");
}

export async function main(args: readonly string[]): Promise<number> {
  if (args.length !== 0) {
    writeJson(process.stderr, invalidCommand());
    return 2;
  }
  const text = await readBoundedStdin();
  if (text === null) {
    writeJson(process.stderr, invalidCommand());
    return 2;
  }
  let input: unknown;
  try {
    input = JSON.parse(text) as unknown;
  } catch {
    writeJson(process.stderr, invalidCommand());
    return 2;
  }
  const outcome = evaluateReleasePreflight(input);
  if (!outcome.ok) {
    writeJson(process.stderr, outcome.error);
    return 2;
  }
  writeJson(process.stdout, outcome.value);
  return outcome.value.status === "ready" ? 0 : 1;
}

void main(process.argv.slice(2))
  .then((exitCode) => {
    process.exitCode = exitCode;
  })
  .catch(() => {
    writeJson(process.stderr, commandFailed());
    process.exitCode = 2;
  });
