# Risk Register

## Product Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| MVP feels like a thin trace viewer | Medium | High | Connect traces to cost, latency, prompt, model, and scores |
| Market too crowded | High | High | Focus on simple AI operations wedge and gateway path |
| Users want SDKs before raw API | Medium | Medium | Document API well, add SDKs in beta |
| Quality metrics are too hard | Medium | High | Start with score ingestion, not managed judges |

## Technical Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| PostgreSQL query performance degrades | Medium | High | Indexes, rollups, retention, partitioning later |
| Payloads include sensitive data | High | High | Redaction flags, retention, configurable capture |
| Cost estimates become inaccurate | Medium | Medium | Version provider pricing and show estimate status |
| Ingestion duplicates data | Medium | Medium | Idempotency keys and unique constraints |
| Alerts produce noise | Medium | Medium | Simple thresholds, alert history, clear defaults |

## Business Risks

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| Free tier storage cost grows | Medium | Medium | Limits, retention, usage monitoring |
| Enterprise asks overwhelm roadmap | Medium | High | Keep enterprise foundations, defer enterprise workflows |
| Provider API changes break assumptions | Medium | Medium | Preserve raw metadata and update catalog |
| Design partners need framework integrations | High | Medium | Prioritize TypeScript/Python SDKs after MVP |

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Maintain risk register monthly | Risks change quickly in AI tooling | Better planning | Process overhead | Ignore until incidents | Small recurring discipline | 30 minutes/month |
| Add payload retention controls in MVP | Sensitive data risk is immediate | Trust and safety | More settings | Store all payloads | Safer product, less default visibility | 1-2 days |
| Track cost to serve per tenant | Pricing depends on telemetry volume economics | Avoids margin surprises | Requires internal metrics | Wait for billing issues | Better business health | 1 day |
| Keep escape hatch for analytics store | Trace volume can outgrow Postgres | Scalability path | Premature abstraction risk | Commit to Postgres forever | Balanced optionality | Design only |

## Top Five Watch Items

1. Time to first trace.
2. Trace detail usefulness.
3. Storage growth per trace.
4. Dashboard query latency.
5. Design partner willingness to replace existing tools.
