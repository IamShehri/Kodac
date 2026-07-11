# Observability

## Product Observability

Kernux observes customer AI applications through traces, spans, metrics, scores, and feedback.

## Internal Observability

Kernux must also observe itself. A company selling observability cannot run blind.

## Signals

| Signal | Product use | Internal use |
| --- | --- | --- |
| Traces | Customer AI workflows | Kernux API request flows |
| Metrics | Cost, latency, quality, errors | API latency, ingest rate, DB performance |
| Logs | Debug ingestion and jobs | Operational debugging |
| Events | Alerts and feedback | Deploys, migrations, incidents |

## Customer Metrics

- Request volume.
- Error rate.
- Latency p50/p95/p99.
- Input/output tokens.
- Estimated cost.
- Cost by provider/model/prompt/customer.
- Score averages and distributions.
- Feedback count and rating.

## Internal Metrics

- Ingest requests per second.
- Ingest validation failures.
- Queue depth.
- Worker job success/failure.
- Database query latency.
- Dashboard query latency.
- Storage growth by tenant.
- API key auth failures.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Dogfood Kernux for Kernux AI features when available | Product credibility and feedback loop | Better product intuition | Early product may lack needed depth | Use only external APM | Strong learning, but cannot replace infra monitoring | Post-MVP |
| Use structured logs from day one | Ingestion issues need fast diagnosis | Lower debugging time | Logging discipline required | Plain text logs | Easier operations, slightly more setup | 1 day |
| Track product activation metrics | MVP success depends on first trace and repeat use | Better prioritization | Requires event instrumentation | Wait for analytics later | More insight, small implementation cost | 1-2 days |
| Align trace concepts with OpenTelemetry GenAI where practical | Standards improve interoperability | Easier exports/integrations | Semantic conventions evolve | Custom-only taxonomy | Future-proofing, some churn | 2-4 days |

## Alerting MVP

Customer-facing alert types:

- Error rate above threshold.
- Latency p95 above threshold.
- Cost in time window above threshold.
- Evaluation score below threshold.

Internal alert types:

- Ingest error spike.
- Queue backlog.
- Database latency spike.
- Worker failures.
