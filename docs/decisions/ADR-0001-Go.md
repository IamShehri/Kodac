# ADR-0001: Use Go For The Backend

## Status

Accepted.

## Context

Kernux needs a backend for ingestion, API serving, background work, and future gateway capabilities. The founder stack includes Go.

## Decision

Use Go for the backend.

## Why

Go is well suited for network services, has predictable performance, compiles to a simple deployable binary, and supports maintainable concurrency for ingestion and worker workloads.

## Benefits

- Strong fit for APIs and future gateway workloads.
- Simple deployment artifact.
- Good standard library.
- Operationally mature.
- Lower runtime overhead than many alternatives.

## Risks

- More boilerplate than TypeScript.
- Less code sharing with the Next.js frontend.
- AI-generated Go can still produce subtle error handling or concurrency bugs.

## Alternatives

| Alternative | Notes |
| --- | --- |
| Node.js/TypeScript | Faster full-stack sharing but weaker fit for future gateway performance |
| Python | Strong AI ecosystem but less ideal for high-throughput ingestion |
| Rust | Excellent performance but too slow for one-founder MVP velocity |

## Consequences

- Backend and frontend types must be shared through generated or documented API contracts.
- Strong testing and linting are required to avoid boilerplate drift.
- Future gateway can reuse backend language/runtime.

## Trade-offs

Kernux trades some full-stack development convenience for operational simplicity and backend performance.

## Estimated Implementation Effort

Baseline choice. No extra effort beyond normal backend setup.
