# Kernux Vision

Kernux is the engineering platform for production AI systems.

The long-term vision is to become the operating system for AI products: the layer teams use to observe, evaluate, route, govern, and improve every AI request that moves through their products.

## Positioning

| Reference | What Kernux borrows | What Kernux avoids |
| --- | --- | --- |
| Stripe for AI Operations | Clear APIs, trustworthy primitives, billing-aware usage records | Becoming a payments-style compliance labyrinth before product-market fit |
| Vercel for AI Applications | Fast onboarding, developer-first workflows, deployment-adjacent ergonomics | Over-indexing on frontend polish before backend data correctness |
| Datadog for AI Systems | Traces, dashboards, alerting, operational confidence | Broad infrastructure observability in the MVP |

## North Star

Make it dramatically easier for engineering teams to answer:

1. What happened in this AI request?
2. Why did quality, cost, or latency change?
3. Which prompt, model, provider, customer, or workflow caused it?
4. What should we change safely?

## Strategic Bet

AI applications will not be managed like static software. They are probabilistic, provider-dependent, prompt-sensitive, and cost-variable. The winning platform will combine observability, evaluation, prompt/version intelligence, and routing into one operational control plane.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Start with AI observability as the wedge | Tracing and cost visibility are immediate pains for teams shipping LLM features | Fast time to value, clear demo, low integration barrier | Crowded category | Prompt management, evals, or routing first | Observability alone can look like a feature; it must lead toward control | 1 month for MVP |
| Use AI operations platform as the initial category | It captures production ownership better than LLM analytics | Appeals to engineering managers and platform teams | May need education | LLM observability, AI gateway, prompt ops | Broader story, but MVP messaging must stay concrete | 2-3 days |
| Design for multi-provider AI from day one | Teams do not want lock-in to one model vendor | Strong strategic foundation, better cost and fallback story | Adds abstraction complexity | OpenAI-only MVP | Multi-provider data model now prevents painful migration later | 3-5 days design; 5-8 days MVP support |

## Success Criteria

Kernux is on the right path when a small team can integrate it in under 30 minutes and immediately see request traces, token usage, cost, latency, errors, prompt version, model, provider, and user/customer context.
