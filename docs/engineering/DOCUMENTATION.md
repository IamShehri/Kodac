# Documentation

## Documentation Philosophy

Documentation is part of the product. Kernux should explain not only how to use the system, but why key decisions were made.

## Documentation Types

| Type | Location | Audience |
| --- | --- | --- |
| Product docs | docs/product/ | Founder, product, GTM |
| Architecture docs | docs/architecture/ | Engineers |
| Engineering docs | docs/engineering/ | Engineers and future contributors |
| ADRs | docs/decisions/ | Decision makers |
| Planning docs | docs/planning/ | Execution |
| Research docs | docs/research/ | Strategy and market |
| Roadmap docs | docs/roadmap/ | Product and company planning |

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Keep docs in the repository | The repo is the source of truth | Versioned, reviewable docs | Docs may lag without discipline | External wiki | Better traceability, less rich editing | Ongoing |
| Update docs with code changes | Architecture and product drift quickly | Better future implementation context | PRs take longer | Periodic doc cleanup | Less drift, more upkeep | Ongoing |
| Use ADRs for consequential choices | Decisions need rationale | Easier revisiting | Can become bureaucratic | Informal notes | Better memory, modest ceremony | 20-30 minutes per ADR |
| Keep public docs separate later | User docs and internal docs have different audiences | Clearer communication | Extra structure | One docs set forever | Better polish, more maintenance | Post-MVP |

## Documentation Standards

Every major planning document should include:

- Purpose.
- Recommendation.
- Why.
- Benefits.
- Risks.
- Alternatives.
- Trade-offs.
- Estimated effort.

## Review Cadence

- Review planning docs at the start of each sprint.
- Review ADRs before major architecture changes.
- Review roadmap monthly.
- Review competitor research quarterly.
