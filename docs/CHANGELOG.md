# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and releases follow the repository's [versioning policy](./VERSIONING.md), based on
[Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Renamed the ordered workshop task directory from `docs/issues/` to `docs/todo/` and updated live references.

## [0.1.2] - 2026-08-04

### Added

- Initialized the Apex Spec System with project state, starter PRD scaffolding, conventions, security and compliance records, archives, and local workflow scripts.
- Added `GEMINI.md` and `CLAUDE.md` symlinks to `AGENTS.md` so supported assistants share the repository instructions.

### Changed

- Moved project mission, architecture, workflow, completion, and security guidance from `AGENTS.md` into the corresponding `.spec_system` governance files; `AGENTS.md` now serves only as their shared entry point.

## [0.1.1] - 2026-08-04

### Added

- Added a repository-wide Semantic Versioning policy defining the compatibility surface, pre-1.0 rules, pre-release conventions, and release checklist.
- Added project TODO and changelog documentation.

### Changed

- Moved workshop issues from `issues/` to `docs/issues/` and workshop guidance from `workshop/` to `docs/workshop/`, updating affected repository links and instructions.
- Expanded `.gitignore` with categorized rules for Node.js dependencies, TypeScript build output, test artifacts, runtime data, local secrets, Pi state, caches, editors, and operating-system files while keeping safe examples and reproducibility files trackable.
- Upgraded the production baseline from Node.js 22 to Node.js 24 LTS, requiring Node.js 24.15 or newer.
- Standardized local and container installs on npm 12.0.2 and updated the Docker image to `node:24-alpine`.
- Updated `@earendil-works/pi-coding-agent` from 0.82.1 to 0.83.0 and TypeBox from 1.3.8 to 1.3.10.
- Updated development tooling to TypeScript 7.0.2, tsx 4.23.5, and Node.js 24.13.3 type definitions.
- Regenerated the npm 12 lockfile and refreshed transitive dependencies to the newest versions allowed by their upstream compatibility ranges.
- Verified the updated dependency tree with a clean `npm ci`, a production Docker build, type-checking, four deterministic tests, and five eval cases.

### Security

- Enabled all GitHub repository security and analysis settings available from the repository's Security configuration page.
- Replaced the placeholder security policy with project-specific supported-version, private-reporting, response, research, and incident-handling guidance.
- Configured weekly Dependabot updates for npm, the Docker base image, and GitHub Actions, with bounded pull-request counts, reviewable minor/patch groups, isolated Pi updates, and Node LTS major-version guards.
- Overrode Pi's vulnerable transitive dependencies with `brace-expansion` 5.0.9, `minimatch` 10.2.6, and `undici` 8.10.0.
- Added version-pinned install-script approvals for the reviewed `@google/genai` 1.52.0, `protobufjs` 7.6.5, and `esbuild` 0.28.1 packages.
- Confirmed the resulting dependency tree reports zero vulnerabilities with `npm audit`.
