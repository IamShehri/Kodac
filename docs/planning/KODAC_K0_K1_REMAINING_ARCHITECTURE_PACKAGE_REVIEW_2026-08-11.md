# Kodac K0/K1 Remaining Architecture Package Review — 2026-08-11

## Decision

```text
PASS — REMAINING ARCHITECTURE PACKAGE READY FOR FOUNDER ACCEPTANCE
```

Review baseline:

```text
branch: docs/kodac-k0-k1-oss-intake
accepted-core baseline: bd9ce8adac4b4dae1f5cdc197ebafc048e902eb1
reviewed package head before this report: 682c3c1e1cb062ff39a356f4abc2dc533e84e7fd
canonical main: c425dca6e9d5474aca50d288064fa56eb21a1b9e
```

## Reviewed ADRs

The following remain `Proposed` pending founder acceptance:

- ADR-0001 — Kodac Product Constitution: Done Means Proven
- ADR-0003 — Upstream Synchronization Policy
- ADR-0007 — Native MCP, ACP, and Agent Skills Compatibility
- ADR-0008 — TypeScript Runtime with Optional Rust Trusted Workers
- ADR-0009 — Kodac Repo Graph Architecture
- ADR-0010 — Benchmark-First Donor Selection and Superiority Claims

## Scope verification

Relative to the accepted-core baseline, the reviewed package adds exactly:

- six ADR documents;
- one machine-readable standards/benchmark baseline manifest.

No runtime or third-party source code is introduced by this package.

The branch comparison at the reviewed package head was:

```text
ahead: 7 commits
behind: 0 commits
files added: 7
```

## Coherence review

### ADR-0001 with accepted core

PASS.

`Done means proven`, evidence-before-claims, model agnosticism, local-first operation, trust-by-architecture, benchmark discipline, and provenance-aware OSS reuse are consistent with accepted ADR-0002/0004/0005/0006.

### ADR-0003 with ADR-0002/0004

PASS.

Selective OpenCode/OSS intake remains pin-first and path-scoped. Upstream updates do not become implicit architecture changes and cannot bypass provenance/license gates.

### ADR-0007 with ADR-0005/0006

PASS.

MCP, ACP, and Agent Skills remain interoperability boundaries rather than canonical Kodac truth. External tools, clients, and skills cannot bypass capability registration, policy, sandbox, evidence, or receipts.

### ADR-0008 with ADR-0002/0005/0006

PASS.

TypeScript remains the primary orchestration/runtime language and aligns with the OpenCode selective substrate. Optional Rust workers are bounded behind Kodac-owned protocol/execution interfaces and do not create a second canonical runtime.

### ADR-0009 with donor tournament

PASS.

The Repo Graph composes complementary evidence from LSP, Tree-sitter, SCIP, structural search, Git, build/test metadata, and semantic retrieval while retaining Kodac-owned graph/query semantics. Aider RepoMap remains a derived-view/reference pattern rather than canonical truth.

### ADR-0010 with product constitution

PASS.

Benchmark-first donor selection prevents GitHub popularity or anecdotal quality from becoming architecture evidence and prevents unscoped superiority claims. External suites are treated as reproducible inputs rather than the only quality definition.

## Current reference baselines

The package records current architecture/reference pins for:

- MCP specification repository;
- ACP;
- Agent Skills;
- Tree-sitter;
- SCIP;
- ast-grep;
- SWE-bench Live;
- Multi-SWE-bench;
- Terminal-Bench-1.

These are compatibility/evaluation references only. They do not authorize copying source code.

The MCP specification repository reports `NOASSERTION` through GitHub repository license metadata at this review point; therefore no MCP repository source-copy authorization is inferred from the pin. Kodac only records it as a specification reference unless a separate exact license review occurs.

## No contradiction found

No blocking contradiction was found among ADR-0001/0003/0007/0008/0009/0010 or between them and accepted ADR-0002/0004/0005/0006.

## Non-authorization boundary

This review does **not** authorize K2 or donor source import.

The following remain true:

```text
code_import_authorized: false
K0/K1 exit gate: not complete
K2 runtime build: not authorized
main mutation: not authorized
```

## Remaining work after founder acceptance

After founder acceptance of the six ADRs, K0/K1 still requires closure of non-ADR governance/evidence conditions before the first runtime import, including:

- Kodac naming/trademark review;
- main protection strategy ratification and implementation plan;
- path-level donor license/mixed-license subtree records for the first import slice;
- provenance schema validation/enforcement plan;
- explicit preservation/migration decision for the existing Kernux evidence-index implementation;
- repository scan confirming no unrecorded third-party code in the proposed K2 intake paths.

## Recommended next action

Founder-accept ADR-0001, ADR-0003, ADR-0007, ADR-0008, ADR-0009, and ADR-0010 together if their product and architecture direction is approved.

Do not begin K2 source intake in the same action.
