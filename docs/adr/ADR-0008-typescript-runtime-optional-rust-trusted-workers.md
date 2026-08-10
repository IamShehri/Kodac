# ADR-0008: TypeScript Runtime with Optional Rust Trusted Workers

Status: Accepted
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Kodac's preferred runtime substrate is OpenCode-derived TypeScript, while several strong trusted-execution and code-intelligence donors use Rust. Forcing the entire platform into one language would either discard mature TypeScript ecosystem leverage or make the project pay an unnecessary rewrite cost.

At the same time, low-level sandboxing, process hardening, parsing/indexing, hashing, and other security/performance-sensitive operations may benefit from Rust.

## Decision

Kodac's primary orchestration/runtime language is **TypeScript**.

Rust is permitted for **narrow trusted or performance-sensitive workers** behind versioned Kodac-owned boundaries.

The default architecture is:

```text
CLI / IDE / SDK
      ↓
TypeScript Kodac Runtime
      ↓
Canonical Protocol / ExecutionGateway
      ↓
optional Rust worker(s)
```

Rust workers are implementation backends, not an independent product runtime.

## TypeScript owns

Unless a separate ADR changes the boundary, TypeScript owns:

- session orchestration;
- provider/model abstraction;
- Router orchestration;
- workflow engine;
- capability registry;
- MCP/ACP/Skills adapters;
- public SDK/server surfaces;
- Repo Graph query/orchestration layer;
- Context Engine orchestration;
- review orchestration and Judge;
- Done Gate;
- configuration and extension/plugin integration.

## Rust candidates

Rust is appropriate to evaluate for:

- hardened process launch and sandbox helpers;
- OS-specific security boundaries;
- network/process mediation;
- high-throughput parsing/indexing;
- content hashing/digest pipelines;
- patch verification where measurable benefit exists;
- isolated handling of untrusted structured inputs;
- future cryptographic receipt/signature helpers.

Using Rust is not mandatory for any candidate until benchmarks or threat-model evidence justify it.

## Boundary rule

TypeScript must not call deep Rust implementation details directly throughout the codebase.

A Rust worker exposes a narrow contract through one of:

- local process protocol;
- stdio/JSON-RPC or equivalent language-neutral transport;
- generated stable bindings where isolation is unnecessary and the ABI risk is justified.

Subprocess/process-isolated boundaries are preferred for security-sensitive helpers because they reduce crash and memory-safety blast radius across language runtimes.

## Failure semantics

Rust worker failure must map into the canonical Kodac protocol with explicit status/diagnostics.

A worker crash cannot be interpreted as successful execution, and retry behavior must be explicit.

## Security semantics

A trusted worker does not bypass ADR-0006.

The order remains:

```text
Intent → Policy/Approval → ExecutionGateway → selected backend/worker → Evidence/Receipt
```

A Rust worker may enforce sandbox constraints but does not decide product authorization unless it is explicitly acting as a policy backend through the canonical interface.

## Build/distribution

K2 should minimize native-build burden.

Initial vertical slices should remain TypeScript-only unless the selected operation cannot meet safety/performance requirements without a native helper.

When Rust enters distribution, Kodac must provide reproducible builds and CI coverage for supported Windows, macOS, and Linux targets relevant to that worker.

## Rejected alternatives

### Rewrite OpenCode substrate in Rust

Rejected because it destroys the primary speed advantage of selective OSS reuse and duplicates mature TypeScript ecosystem work.

### Never use Rust

Rejected because trusted-execution and indexing boundaries may materially benefit from Rust implementations.

### Two equal canonical runtimes

Rejected because duplicate business logic and session truth would create divergence and testing complexity.

## Gate

The K2 vertical slice should be TypeScript-first. A Rust component requires a bounded contract plus an explicit reason based on security, performance, portability, or donor-integration evidence.
