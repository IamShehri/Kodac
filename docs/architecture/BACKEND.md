# Backend

## Backend Role

The Go backend owns ingestion, authentication, authorization, data normalization, query APIs, background processing, and integration with external services.

## Suggested Backend Modules

| Module | Responsibility |
| --- | --- |
| identity | Users, organizations, memberships |
| projects | Project records, environments, API keys |
| ingest | Trace ingestion endpoints, validation, idempotency |
| tracing | Trace/span persistence and read models |
| metrics | Dashboard query services |
| costs | Provider pricing and cost calculation |
| evals | Scores, feedback, annotation records |
| alerts | Rules, threshold checks, alert history |
| billing | Usage counters, plan limits |
| platform | Config, logging, database, Redis, errors |

## API Types

| API class | Purpose |
| --- | --- |
| Public ingest API | Receives telemetry from customer applications |
| App API | Powers authenticated web UI |
| Internal worker API | Shared services used by worker process |

## Backend Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use Go with explicit package boundaries | Go is in the founder stack and works well for APIs | Fast, simple, deployable binary | Boilerplate can grow | Node.js backend | Strong ops profile, less full-stack sharing | Baseline |
| Prefer boring HTTP/JSON for MVP | Easy for SDKs, gateway clients, and docs | Broad compatibility | Less type-rich than gRPC | gRPC/connect first | Simpler clients, less internal type safety | Saves 3-5 days |
| Add idempotency keys for ingestion | Retries can duplicate traces | Safer client behavior | More storage/indexing | Accept duplicates | More correctness, slight complexity | 1 day |
| Enforce request limits at ingestion | Protects storage and free tier | Cost control | Users may hit limits during debugging | Unlimited ingest | Safer platform, support burden from limits | 1-2 days |
| Separate command and query services internally | Ingestion writes and dashboard reads have different needs | Cleaner code and optimization path | Slight structure overhead | One service layer | More organization, more files | 1-2 days |

## Background Jobs

MVP jobs:

- Cost enrichment.
- Alert evaluation.
- Usage rollups.
- Retention cleanup.
- Provider catalog refresh if automated.

Do not add a complex workflow engine for MVP.

## Backend Quality Bar

- Structured logs with request id, project id, trace id when available.
- Consistent error envelope.
- Database migrations are reviewed and reversible where practical.
- Every public API has validation tests.
- Ingestion endpoints have load and payload-size tests before beta.
