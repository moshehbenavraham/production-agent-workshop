# scratch.md
1.1 — The Production Agent Architecture Map

Before touching Coolify or Codex, map the system you are about to build.

A production agent is not only a model. It is a controlled system with clear responsibilities:

1. Interface — where the request enters: API, app, chat, webhook, or n8n.

2. Harness — the control plane around the model.

3. Tools — the actions the agent is allowed to take.

4. State — what must survive between steps and runs.

5. Infrastructure — where services, databases, queues, and workers run.

6. Observability — how you see decisions, cost, latency, and failure.

7. Human boundary — where approval is mandatory.

8. Evals — how you know the system still performs the job.

Your first exercise:

Draw one box for each component your project needs. Add arrows showing data and control flow. Label every external service and every place data is persisted.

Then answer:

• What can the model propose?

• What can the model never execute directly?

• Which actions need human approval?

• What happens when a tool times out?

• What must be logged?

• What makes a run complete?

• What is the smallest useful version?

Do not add multi-agent complexity yet. If one focused agent can complete the job, start there.

Deliverable:

Post your architecture diagram and a five-sentence explanation in your Build Log.

The goal is not a beautiful diagram. The goal is to make every responsibility visible before code and infrastructure hide the decisions.


---
---
---

1.2 — Coolify: Server to Secured Platform

In this lesson, you will turn a clean server into the control plane for your agent stack.

The goal is not to memorize every Coolify setting. The goal is to understand the production responsibilities it takes over for you.

Build sequence:

1. Choose a VPS with enough CPU, memory, disk, and a region appropriate for your data.

2. Create a non-root administrative path and secure SSH access.

3. Install Coolify using the current supported installation method.

4. Connect your domain and confirm DNS resolution.

5. Configure HTTPS.

6. Create the project and environment that will contain your sprint.

7. Define how secrets will be stored and rotated.

8. Decide what must be backed up before deploying data.

Production baseline:

✅ SSH keys instead of passwords

✅ Firewall rules that expose only required ports

✅ A real domain with HTTPS

✅ Secrets outside the repository

✅ A backup destination separate from the server

✅ A written update and rollback procedure

✅ Basic resource monitoring

Architecture decision:

Use one project for the sprint and separate environments when you need development and production boundaries. Do not place unrelated client systems into one undifferentiated environment.

Questions to answer:

• What data would be painful or impossible to recreate?

• Which services can be restarted safely?

• Which ports must never be public?

• Who can access Coolify?

• How will you recover if the server disappears?

Deliverable:

Post a screenshot of the secured Coolify dashboard, your service map, and a short recovery note. Hide domains, IP addresses, and secrets before sharing.

A working dashboard is not the finish line. A recoverable environment is.



---
---
---

1.3 — Deploy the Agent-Ready Baseline

Now deploy the smallest stack your agent needs before agent logic is added.

Recommended baseline:

• Agent API or worker service

• Postgres for durable application state

• Optional Redis or queue only when the workflow needs background jobs

• A health endpoint

• Structured application logs

• Environment-specific secrets

• A deployment path connected to the repository

The rule: every service needs a reason to exist.

Deployment checklist:

1. Create a minimal application with a health endpoint.

2. Commit a reproducible container configuration.

3. Connect the repository to Coolify.

4. Configure build and runtime variables.

5. Deploy and verify HTTPS.

6. Restart the service and confirm state behaves as expected.

7. Trigger one intentional failure and locate it in the logs.

8. Test a rollback or previous deployment.

9. Document the deploy workflow.

Do not add an agent framework yet. The objective is to prove that your production path works before model behavior makes debugging harder.

Your baseline is complete when:

✅ A fresh commit can be deployed

✅ Health can be checked without opening the dashboard

✅ Logs explain startup and failure

✅ Secrets are not in Git

✅ Persistent data survives application restarts

✅ You know how to roll back

✅ Another builder could reproduce the stack from your notes

Week 1 checkpoint:

Add the live health result, repository structure, and recovery procedure to your Build Log.

You now have the environment where the rest of the sprint will live.



---
---
---

2.1 — Set Up an Agent-Ready Repository

Codex becomes dramatically better when the repository explains how work should be done.

The goal of this lesson is not to install another tool. It is to create an environment where Codex can plan, build, test, and review without guessing your rules.

Start with the real repository:

1. Open the project in Codex.

2. Run /init to scaffold an AGENTS.md file.

3. Replace generic guidance with the actual rules of this project.

4. Confirm the real build, test, lint, and deployment commands.

5. Define what Codex may change and what requires approval.

6. Commit the guidance with the repository.

Your AGENTS.md should explain:

• What the application does

• Where the important code lives

• How to run it locally

• The exact verification commands

• Coding and naming conventions

• Architectural boundaries

• Security and data-handling constraints

• What “done” means for a change

Treat AGENTS.md like the operating manual for a new technical teammate. Keep it short enough to follow and specific enough to prevent expensive guesses.

Use this prompt shape for important work:

Goal — the outcome you want

Context — the files, behavior, and background that matter

Constraints — what must not change

Done when — the checks that prove completion

Example:

Goal: Add a health endpoint for the agent worker.

Context: The API lives in src/api and deploys through Coolify.

Constraints: Do not expose secrets or change the existing authentication flow.

Done when: The endpoint returns service and database health, tests pass, and the README includes the check command.

For complex changes, enter Plan mode first. Review the plan before Codex edits files.

Your repository is agent-ready when:

✅ A new Codex session can find the right commands

✅ /status shows the intended environment and permissions

✅ The build and test commands actually pass

✅ Sensitive actions require deliberate approval

✅ “Done” is measurable

Build Log:

Share your AGENTS.md outline, your verification commands, and one rule that prevents Codex from making a bad assumption.

Happy freaking building!

Quentin 🚀

---
---
---

2.2 — Build the Vertical Slice with Codex

The fastest way to learn agent building is to ship one complete vertical slice.

Not ten tools. Not a giant autonomous system. One real request that travels through the entire stack and produces a useful result.

Your vertical slice should include:

• A clear user request

• A structured input

• One model decision

• One focused tool call

• Durable state or an event record

• A useful response

• A failure path

• A test that proves the behavior

Use Codex as the implementation partner.

The build loop:

1. Start in Plan mode and ask Codex to inspect the repository.

2. Agree on the smallest end-to-end slice.

3. Ask for the tool contract before the implementation.

4. Implement one layer at a time.

5. Run the real tests and the application.

6. Use /diff to inspect what changed.

7. Use /review to look for defects, regressions, and missing tests.

8. Deploy the slice through the Coolify path from Week 1.

Keep the work in one coherent task while the goal is stable. Give Codex the logs and test failures instead of describing them from memory.

Useful Codex commands:

/plan — reason through a complex change before editing

/status — confirm model, permissions, and environment

/diff — inspect the working tree changes

/review — review the implementation like a code reviewer

A good tool contract defines:

• Input schema

• Output schema

• Authentication boundary

• Timeout

• Expected errors

• Idempotency behavior

• What must be logged

The slice is complete when:

✅ A real request reaches a real tool

✅ The result is returned and recorded

✅ Invalid input fails clearly

✅ A tool failure does not crash the entire service

✅ At least one regression test protects the happy path

✅ The deployed version behaves like the local version

Build Log:

Post a 60-second demo, the test command, and the one failure you had to fix. The messy part is where the useful learning lives.

Happy freaking shipping!

Quentin 🚀

---
---
---

2.3 — Pi and the Harness Boundary

A model is not an agent.

The model generates decisions. The harness controls what the model can see, what it can do, how the loop continues, and what happens when something breaks.

This distinction matters because the harness is where production behavior lives.

Codex and Pi play different roles in this sprint:

• Use Codex to understand and change the repository, implement features, run tests, and review code.

• Use Pi when you want to own or deeply customize the agent loop itself.

• Use both only when the boundary is clear.

A minimal harness controls:

1. Context — which instructions, files, and state reach the model

2. Tools — which actions are available and under what permissions

3. Loop — when the model may continue, stop, retry, or ask for help

4. Events — what is recorded for debugging and replay

5. Compaction — how long histories become usable working context

6. Output — how results are validated before another system trusts them

Do not confuse “more autonomous” with “more useful.” Every extra loop increases cost, latency, and the number of ways the system can fail.

Create a Harness Decision Record:

• What job is the agent responsible for?

• Why is a loop required?

• What ends the loop?

• What actions require a human?

• What state must survive a restart?

• What evidence proves the result is correct?

• Why use Codex, Pi, or both?

Then build the smallest loop:

Request → model decision → one tool → event record → validated response

Add a maximum step count and a timeout on day one. If the loop cannot explain why it stopped, it is not production-ready.

Your harness boundary is clear when:

✅ The model cannot call undeclared tools

✅ Every tool action creates an event

✅ The loop has an explicit stopping condition

✅ A restart does not erase critical state

✅ Human approval is designed, not improvised

✅ You can swap one component without rewriting everything

Build Log:

Share your Harness Decision Record and a simple diagram of the loop. Tell the crew why you chose Codex, Pi, or the combination.

Happy freaking orchestrating!

Quentin 🚀

---
---
---

3.1 — Design Focused Tools and Permissions

Tools turn an agent from a chatbot into a system that can affect the real world.

That is powerful—and exactly why the tool layer needs more engineering than the prompt.

A production tool should be narrow, predictable, and difficult to misuse.

Every tool needs:

• A single clear responsibility

• A typed input schema

• A typed output schema

• Input validation

• Least-privilege credentials

• A timeout

• Useful error codes

• Idempotency rules

• Structured logs

• An approval rule

Avoid tools like “manage_customer” or “operate_server.” They hide too many actions behind one permission.

Prefer focused contracts:

get_customer

draft_customer_reply

send_customer_reply

restart_agent_worker

read_deployment_logs

Separating read, draft, and execute actions makes permissions visible.

Use three permission levels:

1. Automatic — reversible, low-risk actions

2. Confirm — external writes, spending, messages, or production changes

3. Forbidden — actions the agent should never perform

For every write tool, answer:

• What happens if it runs twice?

• Can it be rolled back?

• How is the exact target resolved?

• What evidence is returned?

• When must a human approve?

Exercise:

Design two tools for your vertical slice. Write the schemas before the implementation. Then test:

1. Valid input

2. Missing required input

3. Invalid target

4. Timeout

5. Duplicate request

6. Permission denied

7. Downstream service failure

The tool layer is production-ready when:

✅ The agent cannot invent parameters

✅ Validation happens before side effects

✅ Duplicate calls do not create duplicate damage

✅ Errors are actionable

✅ Sensitive actions pause for approval

✅ Every action can be traced to a request

Build Log:

Share one tool contract and the failure case that changed your design.

Happy freaking tooling!

Quentin 🚀

---
---
---

3.2 — Add State, Memory, and an Event Log

Memory is not “put the whole conversation back into the prompt.”

Production agents need different kinds of state for different jobs.

Use this simple model:

Working context — what the model needs for the current step

Durable state — facts the application must preserve

Event log — what happened, in order

Memory projection — a useful summary derived from durable events

The event log is the source of truth.

Each event should capture:

• Request or task ID

• Timestamp

• Actor

• Action

• Tool name and validated arguments

• Result or error

• Model and prompt version

• Cost and latency where available

• Approval decision

• Correlation ID for the full run

Keep secrets and unnecessary personal data out of the log.

Why events matter:

• You can debug the exact sequence

• You can replay or reconstruct state

• You can create better summaries later

• You can measure failures and cost

• You have an audit trail for real actions

Compaction is a projection, not deletion. When the working context becomes too large, produce a structured summary and keep the underlying durable events.

Build the state layer:

1. Define the entities and their durable fields.

2. Create an append-only event record.

3. Record every tool attempt and result.

4. Build a summary projection for the agent.

5. Restart the service mid-task.

6. Reconstruct the task from stored state.

7. Verify that duplicate events do not duplicate side effects.

Avoid saving everything forever “just in case.” Define retention, redaction, and deletion rules before real customer data enters the system.

Your state system is useful when:

✅ A restart does not lose the task

✅ You can explain what the agent did

✅ Context stays small enough to remain focused

✅ Durable facts are not hidden inside chat history

✅ Sensitive data has a clear lifecycle

✅ A failed run can be inspected step by step

Build Log:

Share your event schema and show one task reconstructed after a restart.

Happy freaking remembering!

Quentin 🚀

---
---
---

3.3 — Orchestrate Without Building a Monster

Multi-agent systems look impressive in a diagram. In production, every extra agent adds coordination, cost, latency, and another place for context to go missing.

Start with one agent.

Add orchestration only when the work has a real boundary that improves reliability or speed.

Good reasons to split work:

• Independent tasks can run in parallel

• Different workers need different tools or permissions

• A specialist needs a distinct context

• One step should verify another

• Long-running work needs a queue and recovery

Weak reasons:

• The architecture looks advanced

• A framework makes it easy

• The single-agent prompt became messy

• You hope more agents will fix unclear requirements

Common patterns:

Router — classifies work and sends it to one specialist

Pipeline — each stage produces a validated handoff

Supervisor — assigns work and checks completion

Parallel workers — perform independent bounded tasks

Human checkpoint — pauses before a sensitive action

For each handoff, define:

• Input contract

• Expected output

• Owner

• Timeout

• Retry policy

• Failure destination

• Evidence of completion

Use n8n only where it remains strong: deterministic integrations, schedules, webhooks, and business-system edges. Keep reasoning and agent control in code when state, testing, or recovery becomes complex.

Model routing belongs here too. Use the smallest capable model for classification and routine transformations. Reserve stronger reasoning for ambiguous planning, difficult implementation, and review.

Build the orchestration layer:

1. Draw the single-agent flow.

2. Identify one genuine bottleneck.

3. Add one specialist or deterministic stage.

4. Pass a typed handoff, not a chat transcript.

5. Test timeout, retry, and partial failure.

6. Compare success, latency, and cost with the simpler version.

7. Remove the extra component if it does not earn its place.

Your orchestration is justified when:

✅ Each worker has one bounded responsibility

✅ Handoffs are validated

✅ Failures have an owner and recovery path

✅ Parallel work is actually independent

✅ Cost and latency are measured

✅ The system can still explain what happened

Week 3 checkpoint:

Post both diagrams—the simple version and the orchestrated version—and explain exactly what improved.

Happy freaking orchestrating!

Quentin 🚀

---
---
---

4.1 — Build Evals Before You Scale

If you cannot measure the agent, you cannot improve it safely.

A demo proves the system worked once. An eval tells you whether it still works after the next prompt, model, tool, or code change.

Start with a small golden set: 10–20 representative tasks collected from the job your agent must perform.

Include:

• Normal happy-path requests

• Ambiguous requests

• Missing information

• Tool failures

• Permission boundaries

• Adversarial or unsafe instructions

• Cases where the agent should stop and ask a human

Measure more than the final answer.

Your scorecard should cover:

Task success — did the user’s job get completed?

Tool correctness — were the right tools and arguments used?

Grounding — are claims supported by available data?

Safety — did the agent respect permissions and boundaries?

Recovery — did it handle failure without hiding it?

Cost — what did the run consume?

Latency — how long did the user wait?

Use deterministic checks whenever possible: schema validation, database state, exact tool events, permissions, and exit conditions. Use model-based grading only where judgment is genuinely required.

Build the eval loop:

1. Define the task and expected outcome.

2. Capture the expected tool events.

3. Run the current system.

4. Store the result, trace, cost, and latency.

5. Score it against the rubric.

6. Change one thing.

7. Run the same set again.

8. Block deployment when a critical behavior regresses.

Do not optimize for one average score. A system that succeeds 95% of the time but occasionally sends the wrong customer message is not ready.

Your eval suite is useful when:

✅ It represents real work

✅ Critical failures have hard gates

✅ Tool behavior is scored, not only prose

✅ Results are reproducible

✅ Cost and latency are visible

✅ Every important bug becomes a regression case

Build Log:

Share your first five eval cases and the failure you are refusing to ship.

Happy freaking evaluating!

Quentin 🚀

---
---
---

4.2 — Observe Failure, Cost, and Recovery

When an agent fails in production, “the AI did something weird” is not a diagnosis.

You need enough evidence to reconstruct the run without guessing.

Observe four layers:

Service health — uptime, memory, CPU, queue depth, database health

Agent run — task ID, steps, stop reason, retries, and outcome

Model calls — model, tokens, latency, cost, and error

Tool calls — arguments, result, duration, permissions, and side effects

Use one correlation ID from the incoming request through every model and tool event. That ID is the thread you follow when a member or client reports a problem.

Log structured fields, not paragraphs.

Minimum run fields:

• Correlation ID

• Task and user or tenant ID

• Environment and version

• Step number

• Event type

• Duration

• Success or error category

• Retry count

• Token and tool cost

• Stop reason

Design recovery before alerts.

For each failure, decide:

Retry — safe transient failure

Resume — continue from durable state

Compensate — undo or counter a completed action

Escalate — send the task and evidence to a human

Stop — refuse to continue because the boundary is unsafe

Run an incident exercise:

1. Force a tool timeout.

2. Force an invalid model response.

3. Restart the worker mid-task.

4. Revoke a credential.

5. Create a duplicate request.

6. Follow the correlation ID through the logs.

7. Recover without editing the database manually.

8. Write the runbook step that was missing.

Alert on outcomes that matter: repeated task failure, stuck work, dangerous permission attempts, cost spikes, and unavailable dependencies. Do not wake yourself for every harmless retry.

Your observability is useful when:

✅ A failed run can be reconstructed

✅ Cost is visible per task

✅ Alerts point to an action

✅ Recovery uses documented paths

✅ A restart is routine, not an incident

✅ The operator knows when to stop automation

Build Log:

Post one incident timeline: what failed, what the system recorded, how you recovered, and what you changed.

Happy freaking debugging!

Quentin 🚀

---
---
---

4.3 — Deploy, Demo, and Operate

The final deliverable is not a clever prototype. It is an agent another person can deploy, inspect, and operate.

Ship the system through the production path you created in Week 1.

Release checklist:

1. Run the complete eval suite.

2. Review the final diff and open risks.

3. Build the production image.

4. Deploy through Coolify.

5. Verify health and dependencies.

6. Run a production smoke test.

7. Confirm logs, traces, cost, and alerts.

8. Test rollback.

9. Hand the runbook to another person.

10. Record the demo.

Your operator runbook should answer:

• What does this agent do?

• What does it deliberately not do?

• How is it deployed?

• Where are secrets managed?

• How do I check health?

• How do I find one failed run?

• How do I pause the system?

• How do I retry or resume safely?

• How do I roll back?

• When must a human take over?

Final submission:

✅ Live deployment or controlled production environment

✅ Repository with a useful AGENTS.md

✅ Architecture diagram

✅ Tool and permission contracts

✅ Durable state and event log

✅ Eval scorecard

✅ Observability view

✅ Recovery and rollback runbook

✅ Five-minute demo

✅ Final Build Log with lessons learned

Demo structure:

Minute 1 — the problem and the user

Minute 2 — the architecture and why it is this simple

Minute 3 — the happy path

Minute 4 — one failure and recovery

Minute 5 — eval result, cost, and next improvement

The standard is not perfection. The standard is evidence.

Can the agent complete a valuable job?

Can you see what it did?

Can you control what it may do?

Can you recover when it fails?

Can somebody else operate it?

If the answer is yes, you have built a production agent—not another AI demo.

Drop your final demo in the community and tell us what you are shipping next. Let’s build the new Guild around real systems, shared proof, and builders helping builders.

Happy freaking shipping!

Quentin 🚀

---
---
---

R1 — Fork, Verify, and Trace the Workshop

This is where the classroom becomes a real build.

Public workshop repository:

https://github.com/nexty5870/production-agent-workshop

Fork the repository into your own GitHub account, then clone your fork and open it in Codex.

The reference agent does one useful job:

HTTP request

→ Pi agent session

→ inspect_lead

→ draft_follow_up

→ request_send_approval

→ JSONL event log

→ visible stop reason

It deliberately stops before sending anything.

That is the lesson: production agents are defined as much by where they stop as by what they can do.

Run it:

1. Install Node.js 22 or newer.

2. Fork and clone the public repository.

3. Copy .env.example to .env.

4. Configure a supported provider for Pi.

5. Run npm install.

6. Run npm run verify.

7. Run npm run demo -- lead_ada.

8. Run npm start.

9. Open http://localhost:3000/health.

Test the HTTP boundary:

curl -X POST http://localhost:3000/runs \

  -H 'content-type: application/json' \

  -d '{"leadId":"lead_ada"}'

Now trace one run through these files:

• client-brief.md — the real business problem

• todo/ — the ordered workshop challenges

• src/server.ts — request validation and health

• src/pi-agent.ts — bounded Pi session

• src/tools.ts — typed tool contracts

• src/event-store.ts — append-only audit events

• src/evals.ts — golden-set checks

• AGENTS.md — the repository operating manual

• .agents/skills/verify-production-agent — the reusable verification loop

Do not change anything yet.

First prove the baseline:

✅ TypeScript passes

✅ Four deterministic tests pass

✅ Five evals pass

✅ Unknown leads are not fabricated

✅ No message can be sent

✅ Approval remains pending

Then read workshop/README.md and complete todo/00-map-the-system.md.

Build Log:

Post your fork URL, verification output, and the request path in your own words. If you cannot explain the path, you are not ready to extend it.

Happy freaking building!

Quentin 🚀

---
---
---

R2 — Use the Real AGENTS.md

AGENTS.md is not a magic prompt.

It is the operating manual Codex and Pi can read before touching the repository.

The starter includes a real one. Open it now.

The structure:

1. Mission

What the system is responsible for and what matters most.

2. Repository map

Where the HTTP boundary, Pi session, tools, event store, evals, and tests live.

3. Commands

The exact install, development, type-check, test, eval, verification, and demo commands.

4. Architecture rules

The boundaries that must remain true after every change.

5. Security constraints

What the agent must never read, log, expose, or execute.

6. Change workflow

How Codex should inspect, plan, implement, verify, and review.

7. Done means

The evidence required before a task is complete.

8. Do not

The shortcuts that make the system less safe or harder to operate.

Open the starter in Codex and use this prompt:

Goal: Explain this repository to a new builder.

Context: Read AGENTS.md, README.md, src, and tests.

Constraints: Do not edit files. Do not read secrets or unrelated files.

Done when: Produce the request path, permission boundaries, verification commands, and three risks.

Then ask Codex:

“Which instruction in AGENTS.md prevents the most expensive production mistake?”

Your exercise:

1. Copy the starter AGENTS.md into your own project.

2. Replace the mission and repository map.

3. Verify every command instead of assuming it works.

4. Add one architectural boundary.

5. Add one security constraint based on your real data.

6. Define done with tests, evals, and observable evidence.

7. Ask Codex to find ambiguous or conflicting rules.

A good AGENTS.md is short enough to follow and specific enough to stop guessing.

Build Log:

Share the one rule you added after Codex challenged your assumptions.

Happy freaking guiding!

Quentin 🚀

---
---
---

R3 — Follow the Official Pi Harness

We are not inventing a fake “multi-agent architecture” for the diagram.

This reference follows Pi’s official SDK.

Start here:

Pi repository

https://github.com/earendil-works/pi

Official SDK guide

https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/sdk.md

Working SDK examples

https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk

The useful primitives:

• createAgentSession() — creates one bounded agent session

• customTools — supplies our typed domain tools

• tools — becomes the explicit allowlist

• SessionManager — owns session lifecycle

• DefaultResourceLoader — supplies system guidance and context

• session.subscribe() — exposes message, tool, and agent events

• session.prompt() — begins the controlled run

• session.agent.state — exposes the current runtime state

The starter’s orchestration:

REQUEST

  ↓

VALIDATE leadId

  ↓

CREATE runId + run.started event

  ↓

START one Pi session

  ↓

inspect_lead [automatic/read]

  ↓

draft_follow_up [automatic/no external write]

  ↓

request_send_approval [creates pending approval]

  ↓

STOP

  ↓

RETURN output + stopReason + runId

Why this works:

1. One agent owns one job.

2. Every tool has a typed contract.

3. The allowlist contains only three domain tools.

4. Pi filesystem and shell tools are not enabled.

5. Every lifecycle event gets a correlation runId.

6. The final external write does not exist yet.

7. A human approval is a real state, not a sentence in the prompt.

Important limitation:

Pi does not provide a general permission sandbox by default. It runs with the permissions of its process. Production boundaries come from narrow tools, application approvals, and container or sandbox isolation.

Follow the source:

1. Open src/pi-agent.ts.

2. Find the system prompt.

3. Find the tool allowlist.

4. Find session.subscribe().

5. Find how stopReason is derived from events.

6. Open src/tools.ts.

7. Prove that no tool can send a message.

Your extension:

Add a second read-only tool. Do not add a second agent.

Only split the system after you can show a typed handoff and a measurable benefit.

Build Log:

Share your updated orchestration diagram and mark automatic, approval, and forbidden actions.

Happy freaking orchestrating!

Quentin 🚀

---
---
---

R4 — Break It and Extend the Evals

An eval is a promise the next change must keep.

The starter includes five baseline evals:

1. A known lead can be inspected.

2. An unknown lead is not fabricated.

3. A draft uses the real lead’s name.

4. A draft is not reported as sent.

5. Approval remains pending.

Run them:

npm run eval

Then run the complete gate:

npm run verify

That command type-checks the project, runs four deterministic tests, and executes all five evals.

Now break the agent on purpose.

Exercise A — Fabrication

Change findLead() so an unknown ID returns a generic lead. Run the evals. The unknown-lead case must fail. Revert the change.

Exercise B — False completion

Change the draft so it says the message was sent. Run the evals. The no-false-send case must fail. Revert the change.

Exercise C — Approval bypass

Change makeApproval() to return approved. Run the evals. The approval-boundary case must fail. Revert the change.

Now add your own golden cases:

• Missing required input

• Malformed lead ID

• Tool timeout

• Duplicate request

• Revoked credential

• Model returns prose instead of calling the tool

• Model tries to claim a pending action completed

• Restart after the first tool event

Score more than the final answer:

✅ Correct tool selected

✅ Correct arguments

✅ Correct event sequence

✅ Correct stop reason

✅ No forbidden action

✅ Acceptable cost

✅ Acceptable latency

Every production incident should become a regression case.

Your deployment gate:

Do not deploy when a critical safety eval fails, even if the average score looks good.

Build Log:

Post one red eval, the fix, and the green rerun. Show evidence—not vibes.

Happy freaking breaking!

Quentin 🚀

---
---
---

R5 — Deploy the Starter Through Coolify

Now deploy the exact same starter you verified locally.

The repository already includes a Dockerfile, health endpoint, environment example, and persistent event path.

Coolify checklist:

1. Push the starter to a private Git repository.

2. Create a new Coolify application from that repository.

3. Use the included Dockerfile.

4. Expose port 3000.

5. Configure /health as the health check.

6. Add one supported provider credential as a secret.

7. Set EVENT_LOG_PATH=/app/data/events.jsonl.

8. Mount a persistent volume at /app/data.

9. Add your domain and HTTPS.

10. Deploy.

Smoke test:

curl https://YOUR-DOMAIN/health

Then trigger one controlled run:

curl -X POST https://YOUR-DOMAIN/runs \

  -H 'content-type: application/json' \

  -d '{"leadId":"lead_ada"}'

Expected result:

• A runId is returned.

• stopReason is approval_pending.

• The response does not claim anything was sent.

• The event log contains the complete lifecycle.

Recovery exercise:

1. Trigger a run.

2. Locate its runId in the event log.

3. Restart the container.

4. Confirm /health returns 200.

5. Confirm the previous run events still exist.

6. Deploy a deliberately broken health endpoint.

7. Observe the failure.

8. Roll back to the previous deployment.

9. Record the exact recovery steps.

Before public exposure, add:

• Authentication

• Tenant boundaries

• Rate limiting

• Durable approval endpoints

• Retention and redaction rules

• Alerting for repeated failures and cost spikes

Do not expose /runs publicly until those controls exist.

Final reference-build submission:

✅ Screenshot of npm run verify

✅ Live health response

✅ One approval_pending run

✅ Event timeline with one runId

✅ Restart persistence proof

✅ Rollback proof

✅ One-page operator runbook

This is the bridge from self-hosting to agent engineering: same server ownership, stronger runtime boundaries, and proof that the system can be operated.

Happy freaking deploying!

Quentin 🚀

---
---
---
