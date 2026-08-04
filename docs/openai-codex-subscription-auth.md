# Authenticate Pi with an OpenAI Codex Subscription

This guide configures the workshop's Pi runtime to use a ChatGPT Plus or Pro
Codex subscription through OAuth. It does not use an OpenAI Platform API key.

The procedure is intended for local or otherwise controlled workshop use. It
does not make the service ready for public exposure or define a production
credential strategy for Coolify.

## Important distinction

Codex and Pi use separate login state:

- Codex stores its own login state under `~/.codex/` or an operating-system
  credential store.
- Pi stores its own provider login state under `~/.pi/agent/` by default.

Being signed into Codex does not automatically authenticate Pi. Do not copy,
open, print, manually edit, or commit either product's authentication file.

## Prerequisites

- Node.js and npm versions that satisfy `package.json`.
- Project dependencies installed with `npm install` or `npm ci`.
- A ChatGPT Plus or Pro account with Codex access.
- Access to a browser, or permission to use device-code login in a headless
  environment.

This guide is verified against the repository's pinned
`@earendil-works/pi-coding-agent` version. Recheck the Pi provider documentation
after upgrading that dependency.

## 1. Check the active Pi profile

From the repository root, run:

```bash
./node_modules/.bin/pi --list-models openai-codex
```

If Pi prints `openai-codex` model rows, it can see a configured credential and
model catalog in the active Pi profile. Continue to model selection if the
application still uses another provider.

If Pi prints `No models matching "openai-codex"` or `No models available`, the
active profile does not currently expose an available OpenAI Codex model.
Complete the login steps below.

This check does not make a model inference request, although Pi startup may
refresh a provider catalog over the network. The optional smoke test later in
this guide validates an actual model request.

## 2. Start an ephemeral Pi session

Use a separate terminal so the login flow does not interrupt another agent:

```bash
cd /path/to/agent-workshop
./node_modules/.bin/pi --no-session
```

`--no-session` prevents Pi from saving a conversation session. The login itself
still updates Pi's user-level credential store outside the repository.

## 3. Sign in through the subscription provider

At the Pi prompt, enter:

```text
/login openai-codex
```

Choose the OpenAI ChatGPT Plus/Pro subscription option. Pi then offers two login
methods:

- `Browser login (default)` - use this when the terminal can complete a local
  browser callback.
- `Device code login (headless)` - use this for SSH, containers, or other
  headless environments.

For browser login, sign into the intended ChatGPT account and workspace, approve
the request, and return to Pi.

For device-code login, open the displayed URL in a browser, sign in, and enter
the one-time code. Device-code authentication may first need to be enabled in
personal ChatGPT security settings or by a managed-workspace administrator.

Treat the device code, callback URL, and OAuth errors as sensitive. Do not paste
them into chat, issues, logs, or support threads without redaction.

## 4. Select an OpenAI Codex model

Authentication alone does not guarantee that the application will choose this
provider when another Pi provider is already configured.

At the Pi prompt, enter:

```text
/model
```

Search for `openai-codex` and select one of the models Pi reports as available.
Do not hardcode a model from an old guide; availability can vary by Pi version,
account, workspace policy, and rollout.

The current application creates `ModelRuntime` without an explicit model. Pi's
selected default therefore determines which available provider and model a new
application session uses.

Exit Pi when selection is complete:

```text
/quit
```

## 5. Verify configuration

Repeat the zero-inference model check:

```bash
./node_modules/.bin/pi --list-models openai-codex
```

Successful configuration prints a table containing one or more
`openai-codex` rows.

To validate a real subscription-backed model request, copy one model ID from
that table and run this optional smoke test:

```bash
PI_TEST_MODEL="replace-with-a-listed-model-id"
./node_modules/.bin/pi --no-session -p \
  --provider openai-codex \
  --model "$PI_TEST_MODEL" \
  "Reply exactly: authenticated"
```

This consumes subscription allowance. It does not exercise the workshop's
domain tools or event store.

After any concurrently running code changes reach a stable checkpoint, test the
application itself with synthetic data:

```bash
npm run demo -- lead_ada
```

The application test executes the current worktree and appends runtime evidence
to the configured event log, so do not run it while another agent is partway
through an overlapping source edit.

## Concurrent-agent safety

The standard login flow does not change tracked repository files. It changes
Pi's user-level credentials and, after `/model`, Pi's default model settings.

If another running process is also Pi and shares the same profile:

- login only from a separate terminal;
- do not expect an already-running session to switch models automatically;
- use `/model` explicitly in the session that should switch; and
- use a separate `PI_CODING_AGENT_DIR` outside the repository when the two Pi
  processes must have isolated credentials and defaults.

When using `PI_CODING_AGENT_DIR`, apply the same value to both the login command
and every application command that should consume that profile. Never point it
inside the repository.

## Troubleshooting

### Login succeeds but no Codex models appear

- Confirm that the verification command and login command use the same
  `PI_CODING_AGENT_DIR` value.
- Restart Pi and repeat `/login openai-codex`.
- Use `/logout`, select the OpenAI Codex provider, and authenticate again if a
  stored token can no longer refresh.
- Confirm that the selected ChatGPT account has Codex access and that managed
  workspace policy permits the login method.

### Browser callback fails

Repeat `/login openai-codex` and select device-code login. If device-code login
is unavailable, enable it in ChatGPT security settings or contact the workspace
administrator.

### Pi works but the workshop uses another provider

Run Pi, enter `/model`, and select an available `openai-codex` model. The
workshop currently relies on Pi's default model because `src/pi-agent.ts` does
not pin a model explicitly.

### A deployed service cannot retain login

Do not bake Pi authentication files into a container image or commit them to
the repository. OAuth refresh state needs protected, writable, persistent
storage. Production credential design, rotation, revocation, and deployment
policy must be handled as separate release work before public exposure.

## Security rules

- Never store OAuth tokens, API keys, device codes, callback URLs, or auth-file
  contents in the repository, `.env`, events, screenshots, or support threads.
- Never expose `/runs` publicly merely because provider authentication works.
  Provider login does not authenticate callers of the workshop HTTP service.
- Keep workshop inputs synthetic until the repository's data-lifecycle and
  deployment gates are complete.
- Use `/logout` to remove Pi's stored provider credential when the profile
  should no longer have access.

## References

- [OpenAI authentication and headless login](https://learn.chatgpt.com/docs/auth)
- [Pi provider and subscription authentication](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/providers.md)
- [Pi quickstart](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/quickstart.md)
- [Pi SDK authentication example](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/09-api-keys-and-oauth.ts)
