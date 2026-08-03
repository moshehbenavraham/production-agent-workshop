# Versioning policy

This repository follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).
The version in `package.json` is the source of truth. Release tags use the matching
`vMAJOR.MINOR.PATCH` form, such as `v1.2.3`; the leading `v` belongs to the Git tag,
not to the semantic version itself.

## Compatibility surface

Semantic Versioning requires a declared public API. For this service, that compatibility
surface consists of:

- documented HTTP methods, paths, status codes, validation behavior, and JSON request and response shapes;
- typed custom-tool names, parameters, results, and side-effect guarantees;
- persisted event and approval record shapes and field meanings, including `runId` and `stopReason` values;
- documented commands, environment variables, and deployment configuration required to operate the service;
- safety guarantees, especially the tool allowlist, human approval boundary, and prohibition on sending from this starter.

Source layout, prompt wording, tests, and dependency choices are implementation details unless
changing them alters an observable part of this compatibility surface.

## Choosing the next version

For stable releases beginning with `1.0.0`:

| Change | Version increment |
| --- | --- |
| Incompatible change to the compatibility surface | MAJOR |
| Backward-compatible functionality or deprecation | MINOR |
| Backward-compatible bug, security, documentation, test, or dependency fix | PATCH |

The highest-impact change in a release determines its version increment. A version increment
does not authorize weakening an approval boundary, tool allowlist, or other safety requirement.

The current `0.y.z` line is initial development. Until `1.0.0`, use this repository convention:

- increment MINOR and reset PATCH to zero for an incompatible change or significant new functionality;
- increment PATCH for backward-compatible fixes, documentation, tests, or dependency maintenance;
- publish `1.0.0` when the compatibility surface is stable enough for consumers to rely on it.

## Pre-releases and build metadata

Use SemVer pre-release identifiers for release candidates, for example `1.2.0-rc.1`.
Build metadata may be appended when needed, for example `1.2.0+build.42`, but does not affect
version precedence.

## Release checklist

1. Classify every Unreleased change and choose the next version from the highest required increment.
2. Update `package.json` and `package-lock.json` to the same semantic version.
3. Move the entries in `docs/CHANGELOG.md` from `[Unreleased]` into a dated `## [X.Y.Z] - YYYY-MM-DD` section.
4. Run `npm run verify` and resolve every type-check, test, or eval failure.
5. Commit the release changes and create an immutable annotated tag named `vX.Y.Z`.
6. Publish or deploy only from that verified tag through the repository's approved release process.

Released artifacts and tags are immutable. Any correction requires a new version.
