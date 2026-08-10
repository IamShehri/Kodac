# ADR-0002: OpenCode as Selective Runtime Substrate

Status: Proposed
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Kodac needs a mature agent runtime without inheriting an entire upstream product, hosted control plane, or public protocol. Rebuilding provider abstraction, sessions, tools, MCP/ACP integration, LSP plumbing, Git/worktree support, storage, and orchestration from zero would spend engineering effort on commodity infrastructure rather than Kodac's differentiators.

OpenCode at pinned baseline `3a90639cb57619a21e59f544b3e8d23ffed56f48` contains mature TypeScript boundaries for many of these concerns.

Kilo also contains an OpenCode-derived runtime plus additional product packages. Using both as runtime roots would create duplicate ownership and upstream-sync complexity.

## Decision

Kodac will use **selected OpenCode runtime modules as its preferred initial substrate**, subject to ADR-0004 and path-level review.

This is not a deep fork of the OpenCode product and does not make OpenCode's internal protocol the Kodac protocol.

Candidate intake areas are:

- `packages/opencode/src/acp`
- `packages/opencode/src/agent`
- `packages/opencode/src/bus`
- `packages/opencode/src/config`
- `packages/opencode/src/git`
- `packages/opencode/src/lsp`
- `packages/opencode/src/mcp`
- `packages/opencode/src/patch`
- `packages/opencode/src/permission`
- `packages/opencode/src/plugin`
- `packages/opencode/src/project`
- `packages/opencode/src/provider`
- `packages/opencode/src/server`
- `packages/opencode/src/session`
- `packages/opencode/src/skill`
- `packages/opencode/src/snapshot`
- `packages/opencode/src/storage`
- `packages/opencode/src/tool`
- `packages/opencode/src/worktree`

Every intake path still requires dependency closure and license/provenance review. The list is a review scope, not an import authorization.

## Explicit exclusions by default

Do not import merely because it exists upstream:

- account/product identity;
- upstream hosted control plane;
- mandatory cloud sync/sharing;
- upstream business/enterprise services;
- telemetry that is not required for local function;
- branding or product-specific UI identity.

An excluded area may only be reconsidered by a separate explicit decision.

## Kodac ownership boundary

Kodac owns:

- canonical Session/Event/Tool protocol;
- capability model;
- Evidence Router;
- Repo Graph;
- Context Engine;
- ExecutionGateway;
- Trust Kernel and policy result;
- Execution Receipts;
- Proof Review and Judge;
- Done Gate;
- Outcome Learning and Bench.

OpenCode modules must adapt inward to these contracts.

## Integration rule

The dependency direction is:

```text
Kodac public contracts
        ^
        |
Kodac adapters
        ^
        |
selected OpenCode substrate
```

Never:

```text
Kodac public API -> raw OpenCode internal type
```

## Upstream sync rule

Any imported/adapted OpenCode path must record:

- pinned upstream SHA;
- exact source path(s);
- imported blob/tree identity where practical;
- Kodac destination;
- modifications;
- compatibility/parity tests;
- whether updates are cherry-picked, manually reconciled, vendored, or reimplemented;
- last upstream reconciliation SHA/date.

Kodac must be able to answer: “which upstream code produced this file, and what changed?”

## Consequences

Positive:

- accelerates runtime maturity;
- keeps TypeScript as the default orchestration language;
- preserves access to a large provider/tool/MCP/ACP/LSP ecosystem;
- directs Kodac engineering to differentiating layers.

Costs:

- adapter maintenance;
- upstream change monitoring;
- dependency-closure review before import;
- selective divergence must be explicitly managed.

## Rejected alternatives

### Build all runtime plumbing from scratch

Rejected because it duplicates mature commodity work without creating Kodac differentiation.

### Fork the complete OpenCode product

Rejected because Kodac would inherit product identity, cloud/control-plane concerns, and upstream internal contracts as architectural constraints.

### Use Kilo as the runtime root

Rejected for the initial foundation because Kilo already contains an OpenCode-derived runtime and broader surface area. Kilo remains a high-value comparator/selective donor.

## Gate

This ADR becoming Accepted is necessary but not sufficient for source import. ADR-0004 must also be Accepted and a path-level intake record must exist before any third-party code enters the Kodac runtime tree.
