import { createServer } from "node:http";
import { runLeadAgent } from "./pi-agent.js";
import {
  FixedWindowRateLimiter,
  type RateLimitDecision,
  resolveRunRateLimitOptions,
} from "./rate-limit.js";

const port = Number(process.env.PORT ?? 3000);
const maxBodyBytes = 16_384;
const runRateLimiter = new FixedWindowRateLimiter(resolveRunRateLimitOptions(process.env));

function send(
  response: import("node:http").ServerResponse,
  status: number,
  body: Record<string, unknown>,
  headers: Readonly<Record<string, string>> = {},
) {
  response.writeHead(status, { "content-type": "application/json", ...headers });
  response.end(JSON.stringify(body));
}

function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  return {
    "ratelimit-limit": String(decision.limit),
    "ratelimit-remaining": String(decision.remaining),
    "ratelimit-reset": String(decision.resetAfterSeconds),
  };
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

  const rateLimit = runRateLimiter.consume();
  const responseHeaders = rateLimitHeaders(rateLimit);
  if (!rateLimit.allowed) {
    send(
      response,
      429,
      { error: "rate_limited", retryAfterSeconds: rateLimit.resetAfterSeconds },
      { ...responseHeaders, "retry-after": String(rateLimit.resetAfterSeconds) },
    );
    return;
  }

  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) {
      send(response, 413, { error: "body_too_large" }, responseHeaders);
      return;
    }
  }

  try {
    const parsed = JSON.parse(body) as { leadId?: unknown };
    if (typeof parsed.leadId !== "string" || !/^lead_[a-z0-9_]+$/.test(parsed.leadId)) {
      send(response, 400, { error: "invalid_lead_id" }, responseHeaders);
      return;
    }
    const result = await runLeadAgent(parsed.leadId);
    send(response, 200, result, responseHeaders);
  } catch (error) {
    send(
      response,
      503,
      {
        error: "agent_run_failed",
        message: error instanceof Error ? error.message : String(error),
      },
      responseHeaders,
    );
  }
});

server.listen(port, "0.0.0.0", () => {
  console.log(`Production Agent Starter listening on :${port}`);
});
