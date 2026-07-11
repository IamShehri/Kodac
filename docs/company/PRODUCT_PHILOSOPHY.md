# Product Philosophy

Kernux should be an engineering control surface, not a generic analytics dashboard.

## Product Belief

AI engineering teams need fewer mysteries. Kernux should turn opaque model interactions into inspectable operational records.

## Experience Principles

- Onboarding should begin with one SDK key and one successful request.
- The trace view is the center of the product.
- Dashboards should answer operational questions, not showcase chart variety.
- Prompt and model comparisons should connect directly to production traces.
- Alerts should be tied to concrete ownership: cost, latency, errors, quality, and provider failures.

## MVP Product Shape

The first usable Kernux should include:

- Project and API key setup.
- Request ingestion.
- Trace list and trace detail.
- Cost, token, latency, and error aggregation.
- Prompt version metadata.
- Provider and model metadata.
- Basic feedback and evaluation score capture.
- Simple dashboard and filtering.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Make traces the primary navigation object | Traces map directly to debugging jobs | Immediate usefulness, clear mental model | Product can feel narrow early | Dashboard-first UX | Debugging first, executive reporting later | 3-5 days |
| Make prompt versions metadata in MVP, not a full prompt CMS | Prompt management is useful but can become its own product | Keeps MVP focused while preserving future path | Users may want editing/version deployment | Full prompt registry | Lower scope, less lock-in to early UX | 2-3 days |
| Add evaluation score ingestion before managed evaluators | Teams can bring their own evals and feedback now | Faster path to quality visibility | Less magical than built-in judges | Build LLM-as-judge system first | Less automation, much faster and safer | 2-4 days |

## Product Anti-Patterns

- Ten dashboards with no trace explanation.
- Provider routing before observability is trusted.
- Prompt playground before production data ingestion.
- Enterprise controls before the product has daily active developers.
