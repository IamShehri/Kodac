# Ideal Customer Profile

## Initial ICP

The initial ICP is a B2B SaaS or AI-native startup with:

- 5-100 employees.
- 1-15 engineers.
- At least one production LLM feature.
- Monthly LLM spend above USD 500 or expected to grow quickly.
- Customer-facing AI workflows where bad outputs create support load or churn risk.
- Engineering-led purchasing.

## Best Fit Use Cases

| Use case | Fit | Reason |
| --- | --- | --- |
| AI support agent | Excellent | Needs traceability, feedback, cost, and quality monitoring |
| RAG assistant | Excellent | Needs retrieval, generation, latency, and evaluation visibility |
| AI workflow automation | Strong | Needs multi-step traces and failure diagnosis |
| Internal copilot | Medium | Cost and usage matter; quality risk may be lower |
| Model training platform | Weak | More experiment tracking than production operations |

## Exclusions

Kernux should not initially chase:

- Enterprises requiring on-prem deployment before beta.
- Research teams needing deep ML experiment lineage.
- Consumer apps with tiny LLM spend.
- Teams that only need a provider billing dashboard.
- Companies that already standardized deeply on Datadog/LangSmith and have no unmet need.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Define ICP by production AI pain, not company size alone | Small teams can have serious AI reliability issues | Better targeting | Harder to find via firmographics | Sell to all AI startups | Higher conversion, narrower funnel | 1-2 days for GTM list |
| Prioritize customer-facing AI workflows | Failures are more expensive and visible | Stronger urgency and willingness to pay | Higher expectations | Internal tools first | Better value proof, more pressure | Ongoing |
| Require meaningful request volume for paid plans | Low-volume users may not feel enough pain | Better monetization and feedback | Free users may churn | Sell seats only | Usage-aligned value, more billing complexity | 2-3 days pricing setup |

## Qualification Questions

1. How many LLM requests do you serve per week?
2. Which providers and models are in production?
3. Can you debug a bad answer today from customer report to prompt/model/provider?
4. Do you know AI cost by customer, feature, and model?
5. Do you evaluate output quality before or after prompt/model changes?
6. Who owns AI reliability?
