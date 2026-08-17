# ADR: Boot the House v0.1 Uses Repo-Owned Local Process Adapters

**Status:** proposed — normative companion to `2026-08-16-boot-the-house-world-runtime-design.md`

## Context

Boot the House must compose real TranchNode, Project0, Corpus OS, and Full Measure implementations without copying donor logic into Full Measure or creating a new central service.

The current repository surfaces are materially different:

- Full Measure is a private Node/Express application with a server entrypoint.
- TranchNode is a private TypeScript repository whose Intent Stroke capability is exposed as repo-local source functions, not a published package contract.
- Project0 is a repository-local TypeScript conformance/runtime surface; the World Encounter Envelope implementation is currently being developed as repo-owned modules.
- Corpus OS is a private Node application with an existing `corpus:session` executable path and explicit host/session semantics.

A direct cross-repo source import would couple Full Measure to donor checkout layouts and build systems. Publishing all donor packages merely to prove v0.1 would create unrelated packaging scope. A network service would introduce transport, authentication, deployment, and credential authority that the first proof does not need.

## Decision

The first live federation uses **repo-owned local process adapters with versioned JSON request/response envelopes**.

```text
Full Measure Node server
        |
        +-- spawn declared TranchNode adapter command
        |      JSON request -> JSON result
        |
        +-- spawn declared Project0 adapter command
        |      JSON request -> JSON result
        |
        +-- spawn declared Corpus OS adapter/session command
               JSON request -> JSON result
```

Each donor repository owns its executable adapter entrypoint and its validation rules. Full Measure owns only the process invocation configuration and local application translation.

The exact CLI names are implementation-plan details, but their architectural obligations are fixed here.

## Adapter process contract

Every repo-owned adapter must:

1. read one bounded versioned request from stdin or an explicitly declared local input file;
2. validate its own request schema before acting;
3. emit one machine-readable result to stdout;
4. send human diagnostics to stderr so they cannot corrupt the result channel;
5. exit non-zero on transport/validation/runtime failure;
6. return constitutional disposition only when the donor actually evaluated the request under its own law;
7. include donor contract/version identity and evidence refs in successful machine output;
8. never accept arbitrary source code or shell text from Full Measure as executable authority;
9. never require reusable donor credentials merely to run the local v0.1 proof;
10. remain runnable and testable independently inside the donor repository.

## Full Measure process-host obligations

Full Measure must:

- invoke only configured allowlisted adapter commands;
- pass structured data, never concatenate user input into shell commands;
- use `spawn`/argument arrays or equivalent safe process APIs rather than shell interpolation;
- impose bounded execution time and output size;
- preserve stdout, stderr, exit code, adapter identity, and invoked contract version as host evidence where appropriate;
- distinguish process failure from a donor's `refused` or `indeterminate` disposition;
- refuse unknown adapter versions before translating results into Garden state;
- avoid treating process IDs, local paths, or host timestamps as semantic identity;
- never silently fall back from a live adapter to a fixture during a claimed live crossing.

## CI composition

CI may compose checked-out donor repositories at pinned commits and invoke their repo-owned adapter commands locally.

A cross-repository acceptance run must record at least:

- donor repository;
- exact commit SHA;
- adapter contract/version;
- command identity;
- request/result evidence hashes where donor law supports them;
- Full Measure commit SHA;
- disposition class;
- whether each door or adapter was live or fixture-backed.

No network deployment is required for v0.1.

## Fixture boundary

Fixtures remain valid for unit/conformance proof, but fixture transport and live process transport are distinct truth states.

```text
fixture-backed adapter != live donor adapter
```

The UI and receipts must make the difference visible.

## Why this is reversible

The application-level ports remain transport-neutral. A later room may use HTTP, MCP, WebSocket, local IPC, or an in-process package without changing Full Measure's constitutional meaning, provided the destination still owns its admission and the transport does not manufacture authority.

Local process transport is therefore the first **mechanism**, not a new universal protocol.

## Rejected alternatives

### Direct source imports across repositories

Rejected for v0.1 because they couple build layouts and let Full Measure depend on donor internals rather than donor-owned executable boundaries.

### Publish all donor packages first

Rejected as prerequisite scope. Packaging may be useful later but is not needed to prove the world heartbeat.

### New local/world daemon

Rejected because a daemon would quickly become another registry/router/authority surface before one crossing has been proven.

### Network microservices

Rejected because remote transport, auth, deployment, retries, discovery, and secret handling add complexity unrelated to the first constitutional proof.

## Security stop conditions

Return to design if local process integration requires:

- `shell: true` with user-derived command text;
- ambient PATH discovery of arbitrary executables;
- a donor adapter accepting unvalidated free-form execution requests;
- reusable external credentials stored by Full Measure;
- one adapter proxying another donor's authority;
- host/process metadata becoming canonical semantic identity;
- automatic fallback to fixtures after a live adapter fails.

## Consequence

Boot the House becomes a true multi-repository runtime proof without first becoming a distributed-systems project.

> **The first federation crosses process boundaries before it crosses network boundaries. Transport stays mechanical; authority stays local.**
