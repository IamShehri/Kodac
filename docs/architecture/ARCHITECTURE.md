# Architecture

## Summary

Kernux should begin as a modular monolith with a Go backend, Next.js frontend, PostgreSQL database, Redis for cache/queues, and Docker for local development. The system should be designed around trace ingestion, durable storage, fast querying, and a clear path toward a future AI gateway.

## High-Level Components

| Component | Responsibility |
| --- | --- |
| Web app | Product UI, onboarding, dashboards, trace explorer |
| API server | Auth, project management, ingestion, query APIs |
| Worker | Async enrichment, cost calculation, alert evaluation, retention jobs |
| PostgreSQL | System of record for accounts, projects, traces, spans, scores, feedback |
| Redis | Queue, rate limiting, short-lived cache |
| Provider catalog | Model metadata, token pricing, provider capabilities |

## Architecture Style

Use a modular monolith:

- One deployable backend service.
- Clear internal packages by domain.
- Background worker can run from the same codebase as a separate process.
- Shared PostgreSQL database.
- Redis-backed async jobs where needed.

## Domain Boundaries

| Domain | Owns |
| --- | --- |
| Identity | users, organizations, memberships |
| Projects | projects, environments, API keys |
| Ingestion | trace payload validation, idempotency, rate limits |
| Tracing | traces, spans, events, metadata |
| Metrics | aggregations, dashboard queries |
| Cost | provider catalog, token cost calculation |
| Evaluation | scores, feedback, annotations |
| Alerts | alert rules, alert events, notifications |
| Billing | plans, usage counters, limits |

## Data Flow

1. Client sends trace/span payload with project API key.
2. API authenticates key, validates payload, applies rate limit.
3. API writes normalized records to PostgreSQL.
4. API enqueues async work for cost enrichment and alert checks when needed.
5. Worker updates derived fields and alert events.
6. Frontend queries dashboard and trace APIs.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use modular monolith | One founder needs simple deployment and debugging | Fast delivery, fewer moving parts | Future scaling requires extraction | Microservices | Less independent scaling, much easier MVP | Saves 2-4 weeks |
| Use PostgreSQL as primary store | Trace metadata is relational and Postgres is operationally mature | Durable, queryable, familiar | High-volume traces may need partitioning | ClickHouse from day one | Simpler stack now, possible analytics migration later | 2-3 days schema |
| Use Redis for queues and rate limits | Already in founder stack and enough for MVP | Simple async processing | Not durable like Kafka | Kafka/NATS/SQS | Lower complexity, weaker replay guarantees | 1-2 days |
| Align schema with OpenTelemetry GenAI concepts | Reduces vendor lock-in and supports future imports/exports | Better interoperability | Standard is evolving | Fully proprietary model | More schema discipline, better long-term fit | 2-4 days |

## Scalability Path

| Stage | Trigger | Change |
| --- | --- | --- |
| MVP | Under 1M traces/month | Single API, worker, Postgres |
| Beta | 1M-50M traces/month | Partition trace tables, add read replicas, optimize indexes |
| v1 | 50M+ traces/month | Dedicated ingest workers, columnar analytics store evaluation |
| Enterprise | Large tenants | Tenant isolation, custom retention, export pipelines |
