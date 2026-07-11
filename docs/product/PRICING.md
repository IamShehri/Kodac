# Pricing

Pricing should be usage-aligned, simple enough for startups, and expandable for enterprise.

## Pricing Principles

- Charge for value-bearing telemetry volume.
- Avoid per-seat pricing as the main lever in MVP.
- Make free onboarding generous enough to create traces.
- Keep enterprise packaging for security, retention, and governance.
- Do not mark up model provider costs in the observability-only MVP.

## Proposed Plans

| Plan | Target | Price | Included | Expansion lever |
| --- | --- | --- | --- | --- |
| Free | Individual developers and trials | USD 0 | 10k traces/month, 7-day retention, 1 project | More volume and retention |
| Startup | Early production teams | USD 49-99/month | 100k traces/month, 30-day retention, alerts, 3 projects | Additional traces |
| Growth | Scaling AI teams | USD 299-499/month | 1M traces/month, 90-day retention, eval score analytics, teams | Retention, volume, seats |
| Enterprise | Regulated and platform teams | Custom | SSO, audit logs, custom retention, data controls, support | Contracted volume and support |

## Metering

Primary billable unit: trace.

Secondary future units:

- Stored span volume.
- Retention duration.
- Managed evaluator runs.
- Gateway routed requests.
- Advanced alerting destinations.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use trace-based pricing initially | Users understand requests observed more easily than GB ingest | Simple, value-aligned | Very large traces can distort storage cost | GB-based telemetry pricing | Simpler pricing, needs guardrails on payload size | 2-3 days |
| Include a free plan | Developer tools need low-friction adoption | Faster activation and word of mouth | Free-tier abuse and storage cost | Trial only | Adoption over immediate revenue | 1-2 days |
| Avoid provider cost markup in MVP | Kernux is not yet a model gateway business | Builds trust and keeps billing simple | Leaves revenue on table if routing grows | Mark up routed tokens | Cleaner wedge, less margin early | 0 days |
| Reserve enterprise value for security controls | Larger teams pay for trust and governance | Clear upgrade path | Requires future security work | Enterprise by volume only | Better ACV story, more product work later | Post-MVP |

## Cost Controls

- Enforce payload size limits.
- Default retention by plan.
- Sample or reject oversized traces with clear errors.
- Track storage cost per account internally.
- Add volume alerts before billing surprises.
