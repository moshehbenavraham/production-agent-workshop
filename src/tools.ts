import { defineTool } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import type { JsonlEventStore } from "./event-store.js";
import { findLead, type Lead } from "./leads.js";

export { findLead, type Lead } from "./leads.js";

export function makeDraft(lead: Lead, angle: string): string {
  return [
    `Hi ${lead.name},`,
    "",
    `You mentioned that ${lead.problem.toLowerCase()}`,
    `${angle.trim()} looks like the most useful place to start.`,
    "",
    "If useful, I can map the smallest safe agent workflow with you.",
    "",
    "Quentin",
  ].join("\n");
}

export function makeApproval(runId: string, leadId: string, draft: string) {
  return {
    approvalId: crypto.randomUUID(),
    runId,
    leadId,
    action: "send_follow_up",
    status: "pending" as const,
    draft,
  };
}

export function buildTools(runId: string, store: JsonlEventStore) {
  const inspectLead = defineTool({
    name: "inspect_lead",
    label: "Inspect lead",
    description: "Read one lead by exact leadId. This tool has no side effects.",
    parameters: Type.Object({
      leadId: Type.String({ minLength: 1 }),
    }),
    execute: async (_toolCallId, params) => {
      const lead = findLead(params.leadId);
      store.append({
        runId,
        type: "domain.lead_inspected",
        data: { leadId: params.leadId, found: Boolean(lead) },
      });
      return {
        content: [
          {
            type: "text",
            text: lead ? JSON.stringify(lead) : `No lead found for ${params.leadId}`,
          },
        ],
        details: { found: Boolean(lead) },
      };
    },
  });

  const draftFollowUp = defineTool({
    name: "draft_follow_up",
    label: "Draft follow-up",
    description:
      "Create a deterministic follow-up draft for a lead. This does not send anything.",
    parameters: Type.Object({
      leadId: Type.String({ minLength: 1 }),
      angle: Type.String({ minLength: 10, maxLength: 240 }),
    }),
    execute: async (_toolCallId, params) => {
      const lead = findLead(params.leadId);
      if (!lead) {
        return {
          content: [{ type: "text", text: `Cannot draft: unknown lead ${params.leadId}` }],
          details: { created: false, draft: null as string | null },
        };
      }
      const draft = makeDraft(lead, params.angle);
      store.append({
        runId,
        type: "domain.follow_up_drafted",
        data: { leadId: params.leadId, draft },
      });
      return {
        content: [{ type: "text", text: draft }],
        details: { created: true, draft: draft as string | null },
      };
    },
  });

  const requestSendApproval = defineTool({
    name: "request_send_approval",
    label: "Request send approval",
    description:
      "Create a pending human approval record. This tool never sends the message.",
    parameters: Type.Object({
      leadId: Type.String({ minLength: 1 }),
      draft: Type.String({ minLength: 20 }),
    }),
    execute: async (_toolCallId, params) => {
      const approval = makeApproval(runId, params.leadId, params.draft);
      store.append({
        runId,
        type: "approval.requested",
        data: approval,
      });
      return {
        content: [
          {
            type: "text",
            text: `Approval ${approval.approvalId} is pending. Stop; do not send.`,
          },
        ],
        details: approval,
      };
    },
  });

  return [inspectLead, draftFollowUp, requestSendApproval];
}
