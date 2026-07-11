# Build Vs Buy

## Principle

Build what differentiates Kernux. Buy or adopt what is commodity, security-sensitive, or too expensive for a one-founder MVP.

## Decisions

| Area | Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Authentication | Buy/manage if possible | Auth is not differentiating | Faster and safer | Vendor dependency | Build custom auth | Less control, more speed | 1-2 days |
| Trace ingestion | Build | Core product capability | Full control | Must ensure correctness | Use third-party telemetry backend | Differentiation requires ownership | 5-7 days |
| Database | Build on PostgreSQL | Product data model is custom | Simple stack | Scale limits | Buy analytics backend | More control, more maintenance | 2-3 days |
| Charts/UI | Use component/chart libraries | Visualization primitives are commodity | Faster UI | Library constraints | Custom charts | Speed over uniqueness | 1-2 days |
| Billing | Buy later with Stripe | Billing is complex and non-core | Faster monetization | Integration work | Build invoices | Standard vendor dependency | 2-4 days |
| Email | Buy | Deliverability is hard | Reliability | Cost/vendor | Self-host SMTP | Outsource complexity | 0.5 day |
| Eval judges | Build later | Quality workflows differentiate but need maturity | Controlled roadmap | Complex and costly | Buy/integrate evaluator providers | Defer until product need clear | Post-MVP |
| AI gateway | Build later | Strategic control layer | Differentiation | High reliability burden | Integrate OpenRouter/Helicone | Build when observability trusted | Beta/v1 |

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Buy security-sensitive commodity workflows | One founder cannot outbuild mature auth/email/billing quickly | Better reliability | Vendor dependencies | Custom everything | Faster and safer, less control | Saves weeks |
| Build telemetry data model in-house | The trace model is core IP | Product flexibility | More work | Outsource telemetry store | Ownership over speed | 1-2 weeks |
| Reassess build/buy quarterly | Vendor landscape changes quickly | Avoid stale assumptions | Decision churn | Decide once forever | Adaptability over certainty | 0.5 day/quarter |

## Buy Criteria

Buy when:

- It does not create product differentiation.
- It reduces security risk.
- It avoids weeks of infrastructure work.
- It has clear export/migration paths.

Build when:

- It controls user experience.
- It creates defensible product data.
- It is central to Kernux positioning.
- It needs tight integration with traces, cost, and quality.
