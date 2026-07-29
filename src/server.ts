import { createServer } from "node:http";
import { runLeadAgent } from "./pi-agent.js";

const port = Number(process.env.PORT ?? 3000);
const maxBodyBytes = 16_384;

function send(
  response: import("node:http").ServerResponse,
  status: number,
  body: Record<string, unknown>,
) {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method === "GET" && request.url === "/health") {
    send(response, 200, { status: "ok" });
    return;
  }

  if (request.method !== "POST" || request.url !== "/runs") {
    send(response, 404, { error: "not_found" });
    return;
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) {
      send(response, 413, { error: "body_too_large" });
      return;
    }
  }

  try {
    const parsed = JSON.parse(body) as { leadId?: unknown };
    if (typeof parsed.leadId !== "string" || !/^lead_[a-z0-9_]+$/.test(parsed.leadId)) {
      send(response, 400, { error: "invalid_lead_id" });
      return;
    }
    const result = await runLeadAgent(parsed.leadId);
    send(response, 200, result);
  } catch (error) {
    send(response, 503, {
      error: "agent_run_failed",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Production Agent Starter listening on :${port}`);
});
