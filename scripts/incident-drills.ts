import { runIncidentDrills } from "../src/incident-drills.js";

function writeLine(stream: NodeJS.WriteStream, value: unknown): void {
  stream.write(`${JSON.stringify(value)}\n`);
}

async function main(): Promise<void> {
  if (process.argv.length !== 2) {
    writeLine(process.stderr, {
      code: "invalid_drill_command",
      message: "Incident drill command accepts no arguments.",
    });
    process.exitCode = 1;
    return;
  }
  const outcome = await runIncidentDrills();
  if (!outcome.ok) {
    writeLine(process.stderr, outcome.error);
    process.exitCode = 1;
    return;
  }
  writeLine(process.stdout, outcome.value);
}

void main().catch(() => {
  writeLine(process.stderr, {
    code: "drill_command_failed",
    message: "Incident drill command failed.",
  });
  process.exitCode = 1;
});
