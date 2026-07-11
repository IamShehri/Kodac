# MVP Scope

The MVP must be buildable in approximately one month by one founder using AI-assisted development.

## MVP Goal

A developer can integrate Kernux into a production-like AI workflow, send traces, inspect requests, monitor basic metrics, and understand cost/latency/errors by model, provider, prompt, and customer metadata.

## In Scope

| Area | Scope |
| --- | --- |
| Auth | Email/password or managed auth, project membership, API keys |
| Ingestion | HTTP API for traces and spans, API key authentication |
| Data | PostgreSQL schema for projects, traces, spans, scores, feedback, API keys |
| UI | Project setup, trace list, trace detail, metrics dashboard |
| Metrics | Token usage, estimated cost, latency, status, error rate |
| Metadata | Provider, model, prompt name/version, environment, user/customer ids |
| Alerts | Basic threshold alert definitions, in-app alert history; email optional |
| Docs | Quickstart, concepts, API reference, operational notes |

## Out Of Scope

- Full prompt CMS.
- Managed LLM-as-judge evaluator platform.
- Production model gateway with routing/fallbacks.
- Distributed microservices.
- Enterprise SSO.
- On-prem deployment.
- Multi-region architecture.
- Advanced anomaly detection.
- Full OpenTelemetry collector distribution.

## MVP Acceptance Criteria

- A new user can create a project and API key.
- A valid trace payload is accepted and visible in the UI.
- Trace detail shows ordered spans, model calls, cost, latency, errors, and metadata.
- Dashboard shows request volume, cost, latency, token usage, and error rate over time.
- Filters work for time range, provider, model, prompt version, status, and customer id.
- API key secrets are stored securely.
- Tests cover ingestion, authentication, cost calculation, and core dashboard queries.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Build ingestion API before gateway | Observability requires less traffic-path risk | Faster adoption, easier reliability | Less control over routing | Gateway-first | Safer MVP, delayed routing story | 5-7 days |
| Use managed auth if possible | Auth is not the differentiator | Saves time, improves security | Vendor dependency | Build auth manually | Faster MVP, less control | 1-2 days |
| Implement simple alerts only | Alerting proves monitoring value | Useful without complex rule engine | Limited sophistication | No alerts until beta | Slight scope increase, better operations story | 2-3 days |
| Keep evals to score ingestion | Quality visibility matters, managed evals are expensive to build well | Enables quality dashboards | Users need their own evaluators | Build evaluator workers now | Practical quality foundation | 2-4 days |

## One-Month Allocation

| Week | Theme | Outcome |
| --- | --- | --- |
| 0 | Foundation | Decisions, schema, local environment, auth choice |
| 1 | Ingestion | API keys, trace/span ingestion, validation |
| 2 | UI | Project setup, trace list, trace detail |
| 3 | Metrics | Dashboards, filters, costs, scores, alerts |
| 4 | Hardening | Tests, docs, seed demos, deployment, beta readiness |
