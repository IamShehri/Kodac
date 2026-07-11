# Sprint 3: Metrics, Alerts, And Beta Hardening

## Duration

1 week.

## Objectives

- Build metrics dashboard.
- Add score/feedback visibility.
- Add basic threshold alerts.
- Harden tests, docs, and deployment.

## Tasks

| Task | Effort | Dependencies | Acceptance |
| --- | --- | --- | --- |
| Dashboard summary APIs | 1 day | Trace data | Volume, cost, latency, tokens, errors query correctly |
| Dashboard UI | 1-2 days | Summary APIs | Charts/tables show key trends |
| Score ingestion UI | 1 day | Score API | Scores visible on trace and dashboard |
| Basic alerts | 1-2 days | Metrics | Threshold rules create alert events |
| CI and smoke tests | 1 day | Core app | Tests run reliably |
| Deployment and docs | 1 day | App complete | Beta deploy and quickstart ready |

## Deliverables

- Metrics dashboard.
- Score visibility.
- Alert rules and event history.
- Quickstart docs.
- Beta deployment checklist.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard should answer five questions only | MVP dashboards must stay focused | Clearer product | Less customization | Build dashboard builder | Focus over flexibility | 1-2 days |
| Implement alert history before external notifications | Users can validate alert logic without deliverability issues | Simpler MVP | Less proactive | Email/Slack first | Less reach, more correctness | 1 day |
| Do a hardening pass before adding features | Telemetry product trust depends on correctness | Better beta experience | Feature count smaller | Keep adding features | Reliability over breadth | 1-2 days |

## Acceptance Criteria

- Dashboard metrics match underlying trace data.
- Scores can be ingested and viewed.
- Alert rules can be created and evaluated.
- Core test suite passes.
- Quickstart is sufficient for a new developer.
- Beta deployment is repeatable.
