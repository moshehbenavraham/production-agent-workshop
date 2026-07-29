import { runLeadAgent } from "./pi-agent.js";

const leadId = process.argv[2] ?? "lead_ada";
const result = await runLeadAgent(leadId);

console.log(JSON.stringify(result, null, 2));
