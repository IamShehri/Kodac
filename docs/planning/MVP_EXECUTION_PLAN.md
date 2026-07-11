# MVP Execution Plan

## Objective

Ship a usable Kernux MVP in approximately one month.

## Timeline

| Sprint | Duration | Theme | Outcome |
| --- | --- | --- | --- |
| Sprint 0 | 2-3 days | Foundation | Decisions, local environment, schema plan |
| Sprint 1 | 1 week | Ingestion | Auth, API keys, trace/span ingestion |
| Sprint 2 | 1 week | Trace UI | Project onboarding, trace list, trace detail |
| Sprint 3 | 1 week | Metrics and hardening | Dashboards, scores, alerts, tests, docs |

## Workstreams

| Workstream | Deliverables |
| --- | --- |
| Product | MVP workflow, copy, demo data |
| Backend | APIs, validation, persistence, workers |
| Frontend | Onboarding, trace explorer, dashboards |
| Data | Schema, migrations, indexes, rollups |
| Quality | Tests, smoke checks, CI |
| Operations | Deploy, logs, metrics, runbook |

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Build one demo app/integration scenario | Demo clarity accelerates product feedback | Repeatable validation | Can distract from product | Abstract APIs only | Better demos, small extra work | 1 day |
| Freeze MVP scope after Sprint 0 | One-month schedule cannot absorb ambition | Higher chance of shipping | Some useful ideas delayed | Continuous scope expansion | Focus over breadth | Ongoing |
| Ship behind simple auth and private beta | Early telemetry products need trust | Controlled feedback | Slower public growth | Public launch immediately | Quality over attention | 1 day setup |
| Use weekly go/no-go checks | Prevents late surprise | Better scope cuts | Requires discipline | Wait until final week | Earlier course correction | 30 minutes/week |

## Milestone Acceptance

| Milestone | Acceptance |
| --- | --- |
| Foundation ready | Decisions recorded, schema reviewed, local stack runs |
| Ingestion ready | Valid trace appears in database, invalid payloads fail clearly |
| UI ready | User can inspect traces without database access |
| Metrics ready | Dashboard reflects ingested data accurately |
| Beta ready | Tests pass, docs complete, deploy works, demo story ready |

## Scope Cut Order

If time is tight, cut in this order:

1. Email notifications for alerts.
2. Advanced score charts.
3. Saved filters.
4. Team membership beyond owner role.
5. Rollup optimization.
6. Prompt comparison UI.

Do not cut:

- API key ingestion.
- Trace list/detail.
- Cost/latency/token visibility.
- Auth boundary.
- Core tests.
