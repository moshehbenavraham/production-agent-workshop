import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";

export type AgentEvent = {
  eventId: string;
  runId: string;
  at: string;
  type: string;
  data: Record<string, unknown>;
};

export class JsonlEventStore {
  constructor(private readonly path: string) {
    mkdirSync(dirname(path), { recursive: true });
  }

  append(input: Omit<AgentEvent, "eventId" | "at">): AgentEvent {
    const event: AgentEvent = {
      eventId: crypto.randomUUID(),
      at: new Date().toISOString(),
      ...input,
    };
    appendFileSync(this.path, `${JSON.stringify(event)}\n`, "utf8");
    return event;
  }

  readRun(runId: string): AgentEvent[] {
    try {
      return readFileSync(this.path, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as AgentEvent)
        .filter((event) => event.runId === runId);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }
}
