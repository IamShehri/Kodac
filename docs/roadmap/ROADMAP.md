# Roadmap

## Product Roadmap

| Stage | Theme | Core outcome |
| --- | --- | --- |
| MVP | Observe | Teams can inspect AI requests and monitor cost/latency/errors |
| Beta | Evaluate | Teams can compare quality by prompt/model/provider and alert on regressions |
| v1 | Control | Teams can route, fallback, cache, and govern AI requests |
| v2 | Operate | Teams can manage AI systems across departments, compliance, and scale |
| Enterprise | Govern | Security, audit, data controls, SSO, custom retention, procurement readiness |

## MVP

- Projects and API keys.
- Trace/span ingestion.
- Trace explorer.
- Cost, latency, token, error dashboards.
- Prompt/model/provider metadata.
- Score ingestion.
- Basic alerts.

## Beta

- SDKs for TypeScript and Python.
- Better framework integrations.
- Saved views and exports.
- Prompt comparison.
- Managed evaluator beta.
- Alert destinations.
- Basic gateway preview.

## v1

- OpenAI-compatible gateway.
- Provider routing and fallbacks.
- Caching.
- Budgets.
- Evaluation suites.
- Team roles.
- Audit logs.

## v2

- Advanced policy engine.
- Data residency options.
- Enterprise analytics exports.
- Multi-environment promotion workflows.
- Agent workflow graph analysis.
- Governance reports.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Roadmap from observe to evaluate to control | Mirrors trust progression | Easier adoption | Gateway revenue delayed | Control first | Safer expansion | Multi-quarter |
| Keep enterprise roadmap visible but not active | Enterprise needs should shape foundations | Avoids rewrites | Can distract | Ignore enterprise | Balanced future-proofing | Ongoing |
| Add SDKs after API stabilizes | SDK churn is expensive | Better developer experience | Later onboarding polish | SDKs first | Stable contracts first | Beta 1-2 weeks |
