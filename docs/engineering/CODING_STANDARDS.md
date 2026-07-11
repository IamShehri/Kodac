# Coding Standards

## Purpose

These standards keep the codebase readable, reviewable, and maintainable for a small team using AI-assisted development.

## General Standards

- Prefer simple code over clever code.
- Name things by domain meaning.
- Keep functions small enough to test directly.
- Avoid hidden global state.
- Keep side effects at system boundaries.
- Validate inputs at API boundaries.
- Return explicit errors with context.

## Go Standards

- Use standard library first.
- Keep packages domain-oriented.
- Avoid circular dependencies.
- Use context for request-scoped work.
- Prefer table-driven tests for business rules.
- Keep database access behind repository/query interfaces only when it reduces duplication.
- Do not introduce generic abstractions until there are at least two real use cases.

## Frontend Standards

- Use typed API clients.
- Keep server data loading separate from presentational components.
- Prefer URL-addressable filters.
- Avoid oversized component files.
- Handle loading, empty, and error states.
- Use accessible controls and semantic HTML.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Establish standards before app code | AI-assisted work needs guardrails | More consistent output | May evolve quickly | Let conventions emerge | Better initial consistency, minor upfront work | 1 day |
| Keep comments sparse and explanatory | Noise makes code harder to review | Clearer code | Some intent may be implicit | Comment everything | Less clutter, requires good naming | Ongoing |
| Prefer explicit domain names over abbreviations | Future contributors need fast comprehension | Easier onboarding | Longer identifiers | Short technical names | More readable, slightly verbose | Ongoing |
| Use linters and formatters as non-negotiable | Style debate wastes time | Cleaner reviews | Setup work | Manual style review | Automation over opinion | 0.5-1 day |

## Prohibited Early Patterns

- Microservice abstractions inside a monolith.
- Generic event bus for simple method calls.
- Repository interfaces for every table by default.
- Untyped JSON passed through many layers.
- UI components that silently own business rules.
