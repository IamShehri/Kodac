# ADR-0003: Use PostgreSQL As The Primary Store

## Status

Accepted.

## Context

Kernux needs to store tenant data, projects, traces, spans, scores, feedback, alerts, and usage rollups. Trace volume can grow, but MVP scale is unknown.

## Decision

Use PostgreSQL as the primary data store for MVP.

## Why

PostgreSQL is durable, familiar, flexible, and strong enough for MVP telemetry volume with good schema and indexing.

## Benefits

- One primary database.
- Strong relational modeling.
- JSON support for flexible metadata.
- Mature indexing and partitioning options.
- Lower operational burden than adding columnar analytics immediately.

## Risks

- Very high-volume analytics may outgrow single Postgres setup.
- Large payload storage can become expensive.
- Dashboard queries may need rollups sooner than expected.

## Alternatives

| Alternative | Notes |
| --- | --- |
| ClickHouse | Excellent analytics store but extra operational complexity |
| TimescaleDB | Useful for time-series but not necessary initially |
| Elasticsearch/OpenSearch | Search-friendly but heavier and less ideal as source of truth |
| DynamoDB | Scales well but less ergonomic for relational product data |

## Consequences

- Trace/span tables need careful indexing.
- Retention and payload limits are required.
- Rollup tables should be introduced for dashboard speed.
- Future ClickHouse evaluation should occur when volume justifies it.

## Trade-offs

Kernux chooses delivery speed and operational simplicity over maximum analytical scale on day one.

## Estimated Implementation Effort

2-3 days for MVP schema and migrations; 3-5 days later for partitioning if needed.
