# Technology Choices

## Sources Reviewed

- OpenTelemetry GenAI semantic conventions: https://opentelemetry.io/docs/specs/semconv/gen-ai/
- Datadog LLM Observability: https://docs.datadoghq.com/llm_observability/
- Langfuse docs: https://langfuse.com/docs
- Helicone docs: https://docs.helicone.ai/
- OpenRouter docs: https://openrouter.ai/docs/quickstart

## Recommended Stack

| Layer | Choice | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Backend | Go | Founder stack, API performance | Simple binary, good concurrency | Boilerplate | Node.js, Python, Rust | Less full-stack sharing, stronger backend | Baseline |
| Frontend | Next.js | Founder stack, dashboard suitable | Fast UI development | Framework complexity | Vite SPA | Product velocity | Baseline |
| Database | PostgreSQL | Durable relational core | Simpler operations | Analytics scale | ClickHouse | Faster MVP, later migration | 2-3 days |
| Cache/queue | Redis | Founder stack, simple async | Fast setup | Limited durability | Kafka, SQS, NATS | Simpler now | 1-2 days |
| Containers | Docker | Reproducible local/dev deploy | Standard workflow | Config overhead | Native installs | Better consistency | 1 day |
| CI | GitHub Actions | Native to GitHub | Simple setup | YAML maintenance | Buildkite/CircleCI | Low cost and familiar | 1 day |
| Telemetry standard | OpenTelemetry alignment | Interoperability | Moving GenAI conventions | Custom only | Future-proofing with churn | 2-4 days |

## Future Technology Evaluation

| Trigger | Evaluate |
| --- | --- |
| Dashboard queries slow on raw traces | Rollups, partitioning, ClickHouse |
| Ingestion queue requires durable replay | SQS, NATS JetStream, Kafka |
| Gateway latency becomes critical | Separate ingest/gateway service |
| Enterprise export demand grows | S3 exports, warehouse integrations |

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Avoid ClickHouse until trace volume proves need | Extra database increases ops burden | Faster MVP | Later migration | Add now | Simpler now, scale work later | Saves 1-2 weeks |
| Keep OpenTelemetry compatibility at schema level first | Full collector support is more work | Future integration path | Partial compatibility | Build collector support now | Practical standard alignment | 2-4 days |
| Use Docker Compose for local development | Repeatability matters with AI-assisted coding | Fewer setup issues | Config maintenance | Manual local services | More predictable development | 1 day |
