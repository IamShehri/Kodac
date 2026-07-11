# Sprint 0: Foundation

## Duration

2-3 days.

## Objectives

- Confirm product and architecture decisions.
- Define MVP data model.
- Choose auth approach.
- Establish local development and CI baseline.
- Create implementation briefs for Sprint 1.

## Tasks

| Task | Effort | Dependencies | Acceptance |
| --- | --- | --- | --- |
| Finalize MVP scope | 0.5 day | Planning docs | Scope is frozen and cut list is clear |
| Create initial ADRs | 0.5 day | Architecture review | ADRs for Go, monolith, Postgres, provider abstraction, auth |
| Draft database schema | 0.5-1 day | MVP scope | Core entities and indexes reviewed |
| Choose auth provider/approach | 0.5 day | Product needs | Auth path documented |
| Define ingestion payload contract | 0.5 day | Schema | API contract ready for implementation |
| Configure basic CI plan | 0.5 day | Repo setup | Required checks listed |

## Deliverables

- MVP implementation brief.
- Schema draft.
- API contract draft.
- ADR set.
- Sprint 1 backlog.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Do not write production code until decisions are locked | The first implementation choices shape the whole platform | Less rework | Slower start | Code immediately | Better direction, small delay | 2-3 days |
| Validate schema against product queries | Dashboard and trace views need query support | Avoids painful rewrites | Requires upfront thinking | Schema from write path only | Better read performance | 0.5 day |
| Define seed/demo data early | UI development needs realistic traces | Faster frontend iteration | Seed data may bias design | Wait for real data | Better demos, artificial edge cases | 0.5 day |

## Sprint 0 Exit Criteria

- MVP scope is signed off.
- ADRs exist.
- Schema and API payloads are ready.
- Sprint 1 tasks are implementation-ready.
