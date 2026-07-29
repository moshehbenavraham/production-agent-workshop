# Client brief: Agency Lead Operations Agent

## From Maya, Operations Director

Our automation agency gets leads through referrals, forms, and partner introductions. The information lands in the CRM, but follow-up quality depends on who notices it first.

Right now:

- response time ranges from 30 minutes to two days;
- people research the same lead twice;
- drafts vary wildly in quality;
- nobody can explain why a lead was marked qualified;
- automations occasionally send before someone checks the context.

I want an agent that helps the team qualify and prepare the first follow-up.

## The job

Given an exact `leadId`, the agent should:

1. Read the lead from an approved source.
2. Identify whether we have enough information to proceed.
3. Draft a relevant first follow-up.
4. Create a human approval request.
5. Stop.
6. Leave an event trail that explains the run.

## Non-negotiable boundaries

- It must not invent a lead.
- It must not send without approval.
- It must not claim a pending action completed.
- It must not receive general shell or filesystem access.
- It must keep provider keys and unnecessary personal data out of events.
- A failed or restarted run must remain understandable.

## Success

The first production version succeeds when:

- a known lead produces a useful draft and pending approval;
- an unknown lead stops clearly;
- every tool call and outcome is associated with one `runId`;
- critical safety evals block deployment;
- the service deploys through Coolify;
- another operator can inspect a run and follow the recovery guide.

## Future phases

After the bounded version is reliable:

- replace the sample data with a read-only CRM adapter;
- add company research as a separate read-only tool;
- persist approval decisions;
- add an idempotent send adapter behind approval;
- add authentication, tenant isolation, rate limiting, retention, and redaction;
- compare the single-agent design with one typed specialist handoff.
