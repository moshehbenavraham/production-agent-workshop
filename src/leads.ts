export type Lead = {
  id: string;
  name: string;
  company: string;
  teamSize: number;
  stack: string[];
  problem: string;
};

const leads: Record<string, Lead> = {
  lead_ada: {
    id: "lead_ada",
    name: "Ada",
    company: "Northstar Ops",
    teamSize: 18,
    stack: ["Coolify", "Postgres", "TypeScript"],
    problem: "Support triage is slow and difficult to audit.",
  },
  lead_grace: {
    id: "lead_grace",
    name: "Grace",
    company: "SignalWorks",
    teamSize: 42,
    stack: ["HubSpot", "Slack", "Postgres"],
    problem: "Qualified leads wait too long for a tailored follow-up.",
  },
};

export function findLead(leadId: string): Lead | undefined {
  return leads[leadId];
}
