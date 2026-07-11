# Product

Kernux is an AI-native engineering platform for observing, evaluating, and controlling production AI applications.

## Product Thesis

AI application reliability depends on more than uptime. Teams need visibility into prompts, models, providers, tokens, cost, latency, output quality, user feedback, and failure modes. Kernux should make these dimensions visible in one workflow.

## Core Jobs To Be Done

| Job | User question | MVP support |
| --- | --- | --- |
| Debug a bad answer | What happened in this request? | Trace detail with messages, metadata, timings, errors, scores |
| Control cost | Which users, models, or routes are expensive? | Token and cost dashboards by project/model/provider/customer |
| Improve quality | Did a prompt or model change improve outcomes? | Prompt version metadata and evaluation score comparisons |
| Monitor production | Are latency, errors, or quality drifting? | Dashboard and threshold alerts |
| Support multiple providers | Can we compare or switch models safely? | Provider/model abstraction and normalized request schema |

## Product Surface

1. Projects: isolate environments and teams.
2. API keys: authenticate ingestion.
3. Traces: inspect AI request workflows.
4. Observations/spans: represent model calls, tools, retrieval, and application steps.
5. Metrics: cost, latency, token usage, errors, quality scores.
6. Prompts: track prompt names and versions.
7. Feedback: capture user or human review signals.
8. Alerts: notify on cost, latency, error, and quality thresholds.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| MVP around ingestion plus trace explorer | It proves the hardest product promise: visibility | Strong demo, useful immediately | Does not yet route traffic | Gateway-first MVP | Less control initially, more trust first | 2 weeks |
| Support OpenAI-compatible ingestion first | Many providers and gateways expose OpenAI-compatible APIs | Broad compatibility, simpler SDK/gateway design | Provider-specific fields may be missed | Native SDK for every provider | Lower depth, higher reach | 3-5 days |
| Normalize cost and token metadata | Cost is one of the clearest buyer pains | Clear ROI story | Pricing changes require maintenance | Leave cost to providers | Higher maintenance, stronger product value | 3-5 days |
| Keep first UI operational and dense | Target users are engineers debugging systems | Faster scanning, less fluff | Less flashy for marketing | Landing-page style UI | Better for daily use, less brand theater | 1 week |

## MVP User Journey

1. User creates a project.
2. User creates an ingest API key.
3. User adds Kernux SDK or gateway endpoint.
4. First AI request appears in the trace list.
5. User opens the trace detail and sees messages, model, provider, latency, token usage, estimated cost, metadata, and errors.
6. User filters by model, customer, prompt version, status, or time window.
7. User views dashboard summaries and sets a basic alert.

## Product Metrics

- Time to first trace: target under 10 minutes.
- Ingestion success rate: target above 99 percent for valid requests.
- Trace detail load time: target under 500 ms for normal traces.
- Weekly active projects.
- Requests ingested per active project.
- Percentage of traces with prompt version metadata.
- Percentage of traces with user/customer metadata.
