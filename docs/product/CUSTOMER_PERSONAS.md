# Customer Personas

## Persona 1: Startup AI Founder

| Dimension | Details |
| --- | --- |
| Context | Building an AI-first product with a tiny team |
| Goals | Ship quickly, understand cost, debug bad outputs |
| Pain points | Provider dashboards are fragmented; logs are messy; evals are ad hoc |
| Buying trigger | First production customers report inconsistent AI behavior |
| Success | Integrates Kernux in one afternoon and uses it daily for debugging |

## Persona 2: Product Engineer

| Dimension | Details |
| --- | --- |
| Context | Owns one or more AI features inside a SaaS product |
| Goals | Improve answer quality, reduce latency, compare prompts |
| Pain points | Cannot connect user complaints to specific prompts/models |
| Buying trigger | AI feature is important enough to need monitoring |
| Success | Can trace a user issue from support ticket to model call |

## Persona 3: Platform Engineer

| Dimension | Details |
| --- | --- |
| Context | Standardizes AI usage across multiple product teams |
| Goals | Provider governance, shared observability, cost controls |
| Pain points | Every team integrates AI differently |
| Buying trigger | AI spend or risk becomes visible to leadership |
| Success | Teams use one approved layer for AI observability and routing |

## Persona 4: Engineering Leader

| Dimension | Details |
| --- | --- |
| Context | Accountable for reliability, delivery, and cost |
| Goals | Know whether AI features are reliable and profitable |
| Pain points | No operational reporting for AI systems |
| Buying trigger | AI cost spike, outage, or customer escalation |
| Success | Weekly visibility into quality, cost, latency, and risk |

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Sell first to AI founders and product engineers | They feel the pain early and can adopt without procurement | Faster feedback, shorter sales cycle | Lower contract values | Target platform teams first | Speed over enterprise ACV | Ongoing GTM |
| Design enterprise foundations quietly | Platform engineers will matter later | Avoids painful rewrites for RBAC/audit/data retention | Can distract from MVP | Ignore enterprise needs until late | Add minimal hooks, not full workflows | 3-5 days architecture |
| Use debugging and cost as initial hooks | These are concrete and measurable | Clear value in first session | Quality story may lag | Lead with evals | More immediate utility, less research-heavy | Included in MVP |

## Message By Persona

| Persona | Message |
| --- | --- |
| Founder | Know what your AI product is doing before customers do. |
| Product engineer | Debug every AI request from prompt to provider response. |
| Platform engineer | Create one operating layer for AI usage across teams. |
| Engineering leader | Control AI reliability, cost, and quality before they become incidents. |
