# Principles

These principles should guide product, architecture, and engineering decisions.

## Product Principles

1. Make the first trace magical.
2. Prefer operational clarity over dashboard abundance.
3. Design for production teams, not demos.
4. Make cost visible wherever model behavior is visible.
5. Let users bring their providers, frameworks, and workflows.

## Engineering Principles

1. Build a modular monolith until scale proves otherwise.
2. Keep the data model boring and durable.
3. Use open standards where they reduce lock-in.
4. Ship small vertical slices.
5. Automate correctness before optimizing polish.
6. Treat observability for Kernux itself as a product requirement.

## Company Principles

1. Founder speed with enterprise taste.
2. Defaults should be simple; escape hatches should exist.
3. Trust is earned through correctness, uptime, and honest limits.
4. Documentation is part of the product.
5. Avoid complexity debt disguised as ambition.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use boring core, sharp product as the operating rule | A one-founder company cannot afford exotic infrastructure | Lower maintenance burden, faster debugging | Less architectural novelty | Adopt event streaming, microservices, specialized stores immediately | Sacrifices theoretical scale for real delivery speed | Ongoing |
| Keep MVP workflows vertical | Users judge the product by complete outcomes, not isolated components | Easier demos, stronger validation | Some internals may be less generalized | Build reusable platform primitives first | Vertical slices may need refactoring later | Ongoing |
| Make docs decision-oriented | Future AI-assisted implementation will depend on clear reasoning | Better consistency, faster onboarding | Takes more upfront writing | Lightweight notes only | More planning time now, less rework later | Ongoing |

## Non-Negotiables

- No production feature without auditability.
- No sensitive payload handling without explicit retention and redaction choices.
- No provider abstraction that hides cost, latency, or model identity.
- No MVP scope item without a user-visible job to be done.
