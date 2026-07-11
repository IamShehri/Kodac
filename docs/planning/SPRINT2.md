# Sprint 2: Trace Explorer

## Duration

1 week.

## Objectives

- Build onboarding flow.
- Build trace list and filters.
- Build trace detail view.
- Make the first-trace experience usable.

## Tasks

| Task | Effort | Dependencies | Acceptance |
| --- | --- | --- | --- |
| Project onboarding UI | 1 day | Project/API key APIs | User can create project and API key |
| Empty state and quickstart | 0.5 day | Ingestion docs | User knows how to send first trace |
| Trace list | 1-2 days | Query API | Recent traces show status, model, provider, latency, cost |
| Trace filters | 1 day | Query API | Filters work for time, model, provider, status, prompt |
| Trace detail | 2 days | Trace API | Ordered spans, payloads, metadata, errors, scores visible |
| UI smoke test | 0.5-1 day | UI ready | First-trace path tested |

## Deliverables

- Onboarding.
- Trace list.
- Trace detail.
- Core filters.
- UI smoke test.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Spend extra care on trace detail readability | This is the product's aha moment | Better activation | Dashboard delayed | Build broad UI first | Depth over breadth | 2 days |
| Include realistic demo traces | Empty products are hard to evaluate | Better demos and QA | Demo data can hide real integration friction | No demo mode | More polish, extra setup | 0.5 day |
| Keep UI copy concise and operational | Users are engineers | Faster comprehension | Less hand-holding | Long explanatory UI | Cleaner product, relies on docs | Ongoing |

## Acceptance Criteria

- A new user can reach the ingest instructions.
- A trace submitted through the API appears in the UI.
- Trace detail explains timing, model/provider, prompt version, tokens, cost, status, and errors.
- Filters are URL-addressable or otherwise persistent enough for debugging.
