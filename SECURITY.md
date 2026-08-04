# Security Policy

This public policy explains how to report a suspected vulnerability, which
versions receive fixes, how maintainers respond, and the boundaries for security
research. It intentionally does not duplicate the repository's implemented
controls, current gaps, privacy inventory, or change-review checklist. Maintainers
track those facts in the internal [Security and Compliance Record](./.spec_system/SECURITY-COMPLIANCE.md),
while future hardening remains explicitly planned in the
[ordered workshop tasks](./docs/todo/README_todo.md).

## Supported Versions

This project is in pre-1.0 development and has not published a release tag. The
default branch is therefore the only currently supported line. Once releases
are tagged, support and fixes follow the [versioning policy](./docs/VERSIONING.md).

| Target | Security support |
|--------|------------------|
| Default branch | Supported |
| Tagged releases | None published yet |
| Older commits and future superseded release lines | Not supported |

## Reporting Scope

Report a reproducible defect that could compromise the confidentiality,
integrity, or availability of this repository or a deployment built from it.
Examples include unauthorized access or actions, a bypass of a documented
approval or permission boundary, cross-run or cross-tenant disclosure, secret
or sensitive-data exposure, unsafe input or path handling, replay or
idempotency failures, and dependency or deployment flaws with concrete impact.

The internal record identifies known limitations and the task plan identifies
features that do not exist yet. A report that only restates one of those planned
gaps is out of scope unless it demonstrates an unexpected impact or bypass of a
protection the project claims is active.

## Report Privately

Do not open a public issue, discussion, or pull request for a suspected
vulnerability. Use GitHub's private vulnerability reporting form:

[Report a vulnerability privately](https://github.com/moshehbenavraham/production-agent-workshop/security/advisories/new)

Include:

- the affected branch, version, tag, or commit;
- the security boundary and realistic impact;
- minimal, repeatable steps using synthetic data;
- expected behavior and observed behavior;
- a suggested mitigation, if known.

Do not submit live credentials, provider keys, Pi authentication files,
customer data, private infrastructure identifiers, or complete production
logs. If a credential may be exposed, revoke or rotate it first and include
only the minimum redacted evidence needed to explain the issue.

## Maintainer Response

Maintainers aim to:

- acknowledge a report within three business days;
- provide an initial assessment within seven business days;
- provide a status update at least every fourteen days until resolution.

Accepted reports are prioritized by impact and exploitability. A fix must
satisfy the internal record's [change constraints](./.spec_system/SECURITY-COMPLIANCE.md#change-constraints)
and be released according to the versioning policy. Public disclosure should
be coordinated until a fix or mitigation is available. If a report is
declined, the maintainer will explain why. This project does not currently
offer a paid bug-bounty program.

## Research Boundaries

Use a local copy or a deployment you own, with synthetic leads and accounts.
Do not access another person's data, target a service you do not own, send
messages to real recipients, disrupt a live system, use social engineering, or
test GitHub, npm, Coolify, model providers, or other third-party infrastructure
through this project. Report vulnerabilities in third-party services directly
to their maintainers.

If testing reveals a secret or personal data, stop, do not retain or distribute
it, and report the exposure privately.

## Active Deployment Incidents

A private vulnerability report is not a substitute for incident response on a
deployed service. Contain an active compromise using the deployment owner's
procedures, rotate affected credentials, preserve only necessary redacted
evidence, and then report any underlying repository defect privately. The
repository's incident runbook and operator handoff are planned deliverables in
[Task 06](./docs/todo/06-observability-and-incidents.md) and
[Task 07](./docs/todo/07-coolify-release.md); do not assume those controls exist
until their acceptance evidence is complete.
