# AI Gateway

## Gateway Strategy

The AI gateway is strategically important but should not be the MVP's primary traffic path. Kernux should first earn trust as an observability layer, then introduce gateway capabilities for routing, fallback, caching, and policy enforcement.

## Future Gateway Capabilities

| Capability | Value | Timing |
| --- | --- | --- |
| OpenAI-compatible endpoint | Easy adoption and model switching | Beta |
| Provider routing | Cost, latency, and reliability optimization | Beta/v1 |
| Fallbacks | Higher availability | Beta/v1 |
| Rate limits | Cost and abuse control | Beta |
| Caching | Cost and latency reduction | v1 |
| Policy controls | Enterprise governance | v1/enterprise |
| Prompt injection checks | Safety monitoring | v1 |

## MVP Gateway Boundary

MVP should include:

- Data model compatible with gateway-routed requests.
- Provider/model catalog.
- Trace fields for route, provider, model, fallback, cache status.
- API design that can later accept gateway-generated traces.

MVP should not include:

- Production proxying of customer AI traffic.
- Provider key custody unless absolutely necessary.
- Routing policy engine.
- Semantic caching.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Defer traffic proxying until beta | Gateways sit in the critical path and require high reliability | Avoids early trust failures | Delays control-plane revenue | Gateway-first | Safer wedge, slower routing story | Saves 2-4 weeks |
| Design around OpenAI-compatible requests | Common interface across many tools and providers | Easy adoption | Some provider features do not fit | Provider-native APIs only | Broad reach, partial fidelity | 3-5 days later |
| Support bring-your-own-provider keys before managed credits | Teams already have provider accounts | Lower billing complexity | Harder onboarding for non-technical users | Managed provider billing | More trust and less financial risk | 3-5 days later |
| Record routing decisions as trace metadata | Future analysis depends on knowing why a model was used | Better debugging and optimization | More schema fields | Only record final provider | More insight, more data volume | 1-2 days |

## Gateway Readiness Checklist

- Kernux ingestion p95 latency is known and stable.
- Trace storage is reliable under load.
- Provider catalog is accurate enough for cost estimates.
- Alerting exists for gateway failures.
- Clear incident response and rollback plan exists.
