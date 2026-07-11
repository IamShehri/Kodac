# Version Plan

## Versioning Philosophy

Kernux should version around product maturity, not internal technical milestones.

## Versions

| Version | Audience | Promise |
| --- | --- | --- |
| 0.1 MVP | Founder/design partners | Basic AI observability works |
| 0.2 Beta | Early teams | Observability plus quality/cost monitoring is reliable |
| 1.0 | Production teams | Kernux can be trusted in daily operations |
| 2.0 | Platform teams | Kernux controls and governs AI operations across teams |

## Version 0.1

- Private deployment.
- Trace ingestion.
- Trace explorer.
- Basic dashboard.
- Basic alerts.

## Version 0.2

- SDKs.
- More integrations.
- Improved dashboards.
- Prompt comparison.
- Managed evaluator preview.

## Version 1.0

- Gateway GA.
- Routing/fallbacks.
- Budgets.
- Teams and audit logs.
- Strong docs and support workflows.

## Version 2.0

- Enterprise governance.
- Advanced analytics.
- Data export pipelines.
- Compliance reporting.
- Multi-region and custom retention options.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Keep 1.0 for production trust, not first release | Version numbers shape expectations | Better credibility | Marketing may want earlier 1.0 | Call MVP 1.0 | More honest maturity | Ongoing |
| Use breaking API changes only before 1.0 | Integrations need stability | Cleaner post-1.0 support | Slower iteration later | Break anytime | More discipline | Ongoing |
| Publish changelogs starting at beta | Users need operational awareness | Trust | Documentation overhead | No changelog | Better communication | 30 minutes/release |
