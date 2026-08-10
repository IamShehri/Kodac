# ADR-0007: Native MCP, ACP, and Agent Skills Compatibility

Status: Proposed
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Kodac must interoperate with the broader agent ecosystem instead of forcing users into a Kodac-only world.

Three standards are strategically important:

- MCP for agent/tool/resource interoperability;
- ACP for editor/client to agent interoperability;
- Agent Skills for portable capability/workflow packaging.

As of the K0/K1 review, all three ecosystems are active and changing. Kodac therefore needs native compatibility without making any one external protocol its internal canonical model.

## Decision

Kodac will support MCP, ACP, and Agent Skills as **first-class compatibility boundaries** behind Kodac-owned adapters.

They are not aliases for the Kodac Canonical Protocol defined in ADR-0005.

The dependency direction is:

```text
External standard
      ↓
Kodac adapter
      ↓
Kodac Canonical Protocol / Capability Registry
      ↓
ExecutionGateway / Trust Kernel when effects occur
```

## MCP boundary

Kodac will support MCP client capabilities for discovering and invoking compatible external tools/resources/prompts where useful.

Kodac may also expose selected Kodac capabilities through an MCP server adapter.

Rules:

- MCP tool discovery does not grant execution permission.
- Every effectful MCP call maps to a registered Kodac capability.
- Side-effect classification and Trust Kernel policy are applied after protocol translation and before execution.
- MCP server metadata is untrusted descriptive input until validated.
- Secrets required by MCP servers are scoped and handled through Kodac secret-access policy.
- External MCP failures remain distinguishable from Kodac protocol/policy failures.

## ACP boundary

Kodac will implement ACP compatibility so compatible editors and clients can communicate with Kodac without requiring a Kodac-specific editor protocol.

Rules:

- ACP is a surface/client protocol, not the canonical event store.
- ACP clients cannot bypass Kodac policy, sandbox, or receipt generation.
- Kodac-specific capabilities not representable in ACP may use namespaced extensions, but base interoperability must remain usable without those extensions.
- VS Code and JetBrains native clients may expose richer UX while still mapping to the same Kodac runtime truth.

## Agent Skills boundary

Kodac will support Agent Skills-compatible skill packages as a native capability source.

A skill may contain instructions, references, scripts, templates, or other assets permitted by the standard and Kodac packaging policy.

Kodac adds governance metadata outside or alongside the portable skill representation when required, including:

- source/provenance;
- version/digest;
- license;
- requested capabilities;
- network/secret requirements;
- compatibility requirements;
- benchmark/evaluation results;
- trust status.

Installing a skill never implicitly approves the capabilities it requests.

## Capability normalization

External protocol objects map into semantic Kodac capability identifiers.

Examples:

```text
MCP tool shell.run          → process.exec
MCP tool github.comment     → pr.comment
skill script               → process.exec + declared filesystem/network scope
ACP filesystem mutation    → repo.write / code.apply_patch
```

The external name is preserved as evidence, while authorization uses the Kodac semantic capability.

## Versioning and pins

Kodac records the protocol/specification baseline used for compatibility tests.

A default branch moving upstream does not automatically change Kodac behavior.

Compatibility upgrades require:

- protocol diff review;
- adapter test updates;
- security/trust impact review;
- backward-compatibility decision;
- updated pinned reference.

## Registry implications

A future Kodac Registry may distribute:

- Skills;
- MCP server manifests;
- ACP agent/client compatibility metadata;
- policy packs;
- evaluators;
- workflows.

Registry distribution must include version, digest, license, provenance, and trust metadata.

## Rejected alternatives

### Invent Kodac-only equivalents

Rejected because ecosystem lock-in would reduce adoption and duplicate active standards.

### Make MCP or ACP the internal Kodac protocol

Rejected because those protocols solve narrower interoperability problems and do not define Kodac's evidence, routing, policy, receipt, review, or outcome semantics.

### Trust installed skills automatically

Rejected because portable instructions/scripts are capability requests, not authorization.

## Gate

K2 may implement only the minimum compatibility needed for the first vertical slice, but all protocol-facing code must preserve the adapter boundary and mandatory Trust Kernel path.
