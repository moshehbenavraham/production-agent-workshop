# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow the repository's [versioning policy](./VERSIONING.md), based on
[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Added a repository-wide Semantic Versioning policy defining the compatibility surface, pre-1.0 rules, pre-release conventions, and release checklist.
- Added project TODO and changelog documentation.

### Changed

- Moved workshop issues from `issues/` to `docs/issues/` and workshop guidance from `workshop/` to `docs/workshop/`, updating affected repository links and instructions.
- Upgraded the production baseline from Node.js 22 to Node.js 24 LTS, requiring Node.js 24.15 or newer.
- Standardized local and container installs on npm 12.0.2 and updated the Docker image to `node:24-alpine`.
- Updated `@earendil-works/pi-coding-agent` from 0.82.1 to 0.83.0 and TypeBox from 1.3.8 to 1.3.10.
- Updated development tooling to TypeScript 7.0.2, tsx 4.23.5, and Node.js 24.13.3 type definitions.
- Regenerated the npm 12 lockfile and refreshed transitive dependencies to the newest versions allowed by their upstream compatibility ranges.
- Verified the updated dependency tree with a clean `npm ci`, a production Docker build, type-checking, four deterministic tests, and five eval cases.

### Security

- Overrode Pi's vulnerable transitive dependencies with `brace-expansion` 5.0.9, `minimatch` 10.2.6, and `undici` 8.10.0.
- Added version-pinned install-script approvals for the reviewed `@google/genai` 1.52.0, `protobufjs` 7.6.5, and `esbuild` 0.28.1 packages.
- Confirmed the resulting dependency tree reports zero vulnerabilities with `npm audit`.
