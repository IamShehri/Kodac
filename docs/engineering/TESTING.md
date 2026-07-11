# Testing

## Testing Strategy

Testing should protect the ingestion pipeline, data correctness, billing/cost calculations, authorization, and core UI workflows.

## Test Pyramid

| Layer | Purpose | MVP target |
| --- | --- | --- |
| Unit tests | Business rules, validation, cost calculations | High coverage for critical logic |
| Integration tests | Database queries, ingestion, auth | Cover core APIs |
| UI tests | Smoke key workflows | Cover onboarding, trace list, trace detail |
| Load tests | Ingestion behavior | Basic pre-beta checks |

## Critical Test Areas

- API key authentication.
- Trace payload validation.
- Idempotency.
- Cost calculation.
- Authorization between projects.
- Dashboard aggregation queries.
- Alert threshold evaluation.
- Retention cleanup.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Test ingestion more heavily than UI polish | Ingestion correctness is the product foundation | Prevents silent data corruption | UI bugs may slip | Equal coverage everywhere | Protects critical path first | 2-4 days |
| Use real PostgreSQL in integration tests | SQL behavior differs from mocks | Higher confidence | Slower tests | Mock database | More reliable, slower CI | 1-2 days |
| Add fixture traces for repeatable scenarios | AI telemetry has nested structures | Easier regression tests | Fixtures can become stale | Hand-build payloads in tests | Better readability, maintain fixtures | 1 day |
| Smoke test the first-trace journey | Activation is the MVP moment | Catches broken onboarding | Requires browser test setup | Manual QA only | More confidence, more tooling | 1-2 days |

## Minimum MVP Test Gate

- Unit tests pass.
- Integration tests pass against local PostgreSQL.
- UI smoke test passes for project creation to trace display.
- Migration test applies cleanly to empty database.
- Seed/demo data loads successfully.
