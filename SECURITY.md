# Security Policy

## Supported versions

This project is in pre-1.0 development. Security fixes are made on the default
branch and released from the latest supported line according to the
[versioning policy](./docs/VERSIONING.md).

| Target | Security support |
| --- | --- |
| Latest tagged release | Supported |
| Default branch | Receives fixes for the next release |
| Older tags and release lines | Not supported |

Upgrade to the latest release before reporting a vulnerability that may already
have been fixed.

## What to report

Please report vulnerabilities that could compromise this repository or a
deployment built from it, especially:

- bypasses of the human approval boundary or any path that can send or claim to
  send without approval;
- escapes from the production tool allowlist, including shell or filesystem
  access;
- input-validation, path-handling, replay, or idempotency flaws;
- disclosure of provider credentials, customer data, approval records, or
  sensitive event-log content;
- cross-run or cross-tenant data exposure;
- dependency, container, CI, or release-process weaknesses with a concrete
  impact on this project.

The starter intentionally leaves `/runs` without authentication or rate
limiting and must not be exposed publicly in that state. A report that only
restates this documented limitation is out of scope, but an unexpected exposure
or bypass of an implemented protection is in scope.

## Report privately

Do not open a public issue, discussion, or pull request for a suspected
vulnerability. Use GitHub's private vulnerability reporting form:

[Report a vulnerability privately](https://github.com/moshehbenavraham/production-agent-workshop/security/advisories/new)

Include:

- the affected version, tag, or commit;
- the security boundary and realistic impact;
- minimal, repeatable steps using synthetic data;
- expected behavior versus observed behavior;
- any suggested mitigation, if known.

Never include live credentials, provider keys, Pi authentication files,
customer data, or complete production logs. If a credential may be exposed,
revoke or rotate it first and report only the minimum redacted evidence needed
to explain the impact.

## Response process

Maintainers aim to:

- acknowledge a report within three business days;
- provide an initial assessment within seven business days;
- provide a status update at least every fourteen days until resolution.

Accepted reports will be prioritized by impact and exploitability. A fix should
include a deterministic regression test or eval when behavior changes, pass
`npm run verify`, and preserve the approval and tool-permission boundaries.
Public disclosure should be coordinated until a fix or mitigation is available.
If a report is declined, the maintainer will explain why. This project does not
currently offer a paid bug-bounty program.

## Research boundaries

Use a local copy or a deployment you own, and use synthetic leads and accounts.
Do not access other people's data, send messages to real recipients, disrupt a
live service, use social engineering, retain sensitive data, or test GitHub,
npm, Coolify, model providers, or other third-party infrastructure through this
project. Report vulnerabilities in third-party services to their maintainers.

If testing reveals secrets or personal data, stop immediately, do not copy or
share the data, and report the exposure privately.

## Deployment incidents

For an active compromise of a deployed copy, take the service private, revoke
and rotate affected credentials, preserve only the evidence needed for
investigation, and avoid posting event logs or incident details publicly.
