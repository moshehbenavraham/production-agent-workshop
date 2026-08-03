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








---
---
---








---
---
---









---
---
---








---
---
---








---
---
---








---
---
---






---
---
---
