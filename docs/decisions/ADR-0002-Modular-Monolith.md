# ADR-0002: Use A Modular Monolith

## Status

Accepted.

## Context

Kernux has one founder and a one-month MVP target. The product needs identity, projects, ingestion, tracing, metrics, costs, eval scores, alerts, and billing foundations.

## Decision

Build the backend as a modular monolith with clear package boundaries and one deployable service, plus a worker process from the same codebase.

## Why

The complexity of distributed services is not justified before product-market fit or high-scale telemetry volume.

## Benefits

- Faster development.
- Easier local setup.
- Easier debugging.
- Fewer deployment concerns.
- Simple transactions across related data.

## Risks

- Boundaries can blur without discipline.
- Scaling is less granular.
- A large monolith can become hard to navigate if modules are not maintained.

## Alternatives

| Alternative | Notes |
| --- | --- |
| Microservices | Better independent scaling but too much operational overhead |
| Serverless functions | Fast for simple APIs but harder for ingestion consistency and workers |
| Separate ingest service immediately | Plausible later, unnecessary for MVP |

## Consequences

- Internal boundaries must be enforced by code organization and review.
- Worker can be extracted later if queue volume requires it.
- Database remains shared in MVP.

## Trade-offs

Kernux accepts future extraction work in exchange for speed, simplicity, and founder maintainability.

## Estimated Implementation Effort

Saves approximately 2-4 weeks compared with microservices.
