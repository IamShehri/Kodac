# Database

## Database Role

PostgreSQL is the MVP system of record for identity, projects, traces, spans, metrics, scores, feedback, alerts, and billing usage.

## Core Entities

| Entity | Purpose |
| --- | --- |
| organizations | Tenant boundary |
| users | Human users |
| memberships | User access to organization/project |
| projects | Product/environment boundary |
| api_keys | Ingestion credentials |
| traces | Top-level AI request/workflow |
| spans | Steps inside a trace |
| events | Optional events on spans |
| scores | Evaluation or feedback scores |
| feedback | User/human comments and ratings |
| provider_models | Provider/model metadata and pricing |
| alert_rules | Threshold configuration |
| alert_events | Triggered alerts |
| usage_rollups | Billing and dashboard aggregates |

## Storage Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Store normalized trace/span rows plus JSON metadata | AI telemetry has stable fields and flexible provider extras | Queryable core with flexible extension | JSON can become messy | Fully schemaless | Balanced structure and flexibility | 2-3 days |
| Partition high-volume trace/span tables by time after MVP | Time-series retention and queries will dominate scale | Better cleanup and query performance | Premature partitioning can slow MVP | Partition immediately | Simpler MVP, clear scaling path | Post-MVP 3-5 days |
| Store payload redaction state explicitly | Teams must know whether sensitive content is stored | Trust and compliance foundation | More ingestion logic | Ignore until enterprise | More safety, more schema fields | 1-2 days |
| Add rollup tables for dashboards | Raw trace scans will get expensive | Fast dashboards | Rollup consistency complexity | Query raw data only | Better performance, eventual consistency | 2-4 days |

## Indexing Strategy

MVP indexes should support:

- project id plus timestamp.
- trace id lookup.
- project plus status/time.
- project plus provider/model/time.
- project plus prompt version/time.
- project plus customer/user id/time.

Avoid speculative indexes until query patterns are observed.

## Retention

| Plan | Raw traces | Rollups |
| --- | --- | --- |
| Free | 7 days | 30 days |
| Startup | 30 days | 6 months |
| Growth | 90 days | 12 months |
| Enterprise | Custom | Custom |

## Data Safety

- Hash API keys before storage.
- Encrypt secrets where applicable.
- Make payload capture configurable.
- Support deletion by project.
- Audit retention jobs.
