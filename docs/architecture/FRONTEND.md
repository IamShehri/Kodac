# Frontend

## Frontend Role

The Next.js frontend should deliver a focused engineering workspace for onboarding, trace inspection, dashboards, and project administration.

## Primary Screens

| Screen | Purpose |
| --- | --- |
| Project onboarding | Create project, create API key, show integration steps |
| Trace list | Search and filter recent AI requests |
| Trace detail | Inspect spans, messages, metadata, errors, scores |
| Metrics dashboard | Monitor cost, latency, token usage, volume, errors |
| Settings | API keys, project metadata, retention, team basics |
| Alerts | Define basic thresholds and review alert history |

## UX Priorities

- Dense, scannable, engineer-oriented layout.
- Trace detail must be easy to read under pressure.
- Filters must be persistent and obvious.
- Empty states should guide the user to first trace ingestion.
- Avoid marketing-style hero pages inside the product.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use Next.js App Router | Current Next.js default and good for dashboard apps | Server rendering, routing, colocated data loading | Framework churn | Pages Router or separate SPA | Modern stack, some complexity | Baseline |
| Build trace detail before fancy dashboards | Debugging is the core job | Stronger MVP usefulness | Dashboard demo may be less flashy early | Dashboard-first | Utility over spectacle | 3-5 days |
| Use a restrained component system | Engineering tools need consistency | Faster UI development | Can look generic | Custom visual language from scratch | Speed and clarity over brand novelty | 2-3 days |
| Make filters shareable in URLs | Debugging often involves collaboration | Easier support and team workflows | Slight routing complexity | Local-only filter state | Better product workflow | 1 day |

## Frontend Data Needs

Trace list:

- trace id
- timestamp
- status
- provider
- model
- prompt name/version
- latency
- cost
- token count
- user/customer metadata

Trace detail:

- ordered spans
- input/output payloads with redaction states
- span timing waterfall
- errors
- scores and feedback
- metadata

Dashboard:

- request volume
- cost over time
- latency percentiles
- error rate
- token usage
- top models/providers/customers/prompts
