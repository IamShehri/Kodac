# Features

## Feature Map

| Feature | MVP | Beta | v1 | Notes |
| --- | --- | --- | --- | --- |
| Trace ingestion | Yes | Improve SDKs | Scale and sampling | Core wedge |
| Trace explorer | Yes | Saved views | Advanced search | Primary workflow |
| Cost monitoring | Yes | Budgets | Forecasts | High buyer pain |
| Latency monitoring | Yes | Percentiles | SLOs | Needed for production |
| Error tracking | Yes | Alert routing | Incident workflows | Keep simple early |
| Prompt metadata | Yes | Prompt registry | Prompt deployment | Metadata first |
| Evaluation scores | Yes | Managed evaluators | Eval suites | Bring-your-own first |
| Provider routing | No | Basic gateway | Policy routing | Strategic expansion |
| Caching | No | Gateway cache | Semantic cache | Needs routing layer |
| RBAC | Minimal | Team roles | Enterprise roles | Avoid overbuilding |
| Audit logs | No | Basic | Enterprise-grade | Enterprise expansion |
| OpenTelemetry support | Basic schema alignment | Export/import | Collector integration | Standard alignment |

## MVP Feature Detail

| Feature | User value | Acceptance |
| --- | --- | --- |
| Project setup | Separates environments and products | User can create/select project |
| API keys | Secure ingestion | Key can be created, copied once, revoked |
| Trace list | Finds problematic requests | Sort/filter by time, status, model, provider |
| Trace detail | Explains request behavior | Shows ordered spans, inputs/outputs, timings, errors |
| Metrics dashboard | Monitors production health | Shows volume, cost, latency, errors, tokens |
| Score ingestion | Tracks quality | Scores attach to trace/span and chart over time |

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Separate features into observe, evaluate, and control lanes | This maps to product maturity | Clear roadmap and marketing narrative | May hide cross-feature dependencies | One flat backlog | Better sequencing, slightly more planning | 1 day |
| Put gateway features in beta, not MVP | Gateway reliability is high responsibility | Avoids breaking customer traffic early | Competitors may look broader | Build gateway now | Trust first, control later | 3-6 weeks later |
| Keep OpenTelemetry compatibility as a design constraint | Market is moving toward standard GenAI telemetry | Reduces lock-in concern | Standards are evolving | Proprietary schema only | More schema care, better interoperability | 2-4 days |

## Feature Priority Rubric

Score features by:

- User pain intensity.
- Time to prove value.
- Implementation effort.
- Impact on future architecture.
- Demo clarity.
- Operational risk.
