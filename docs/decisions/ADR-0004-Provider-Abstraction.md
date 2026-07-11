# ADR-0004: Create A Provider And Model Abstraction

## Status

Accepted.

## Context

Kernux must support multiple AI providers and models. Customers may use OpenAI, Anthropic, Google, AWS Bedrock, Azure, OpenRouter, Helicone, LangChain, Vercel AI SDK, or custom wrappers.

## Decision

Create a provider/model abstraction in the data model and API payloads from the start.

## Why

Provider and model identity are necessary for cost calculation, latency monitoring, quality comparison, fallback analysis, and future routing.

## Benefits

- Enables model/provider dashboards.
- Supports future gateway routing.
- Avoids OpenAI-only schema lock-in.
- Makes cost and latency comparisons possible.

## Risks

- Provider-specific features may not fit the common schema.
- Pricing metadata must be maintained.
- Normalization can hide important raw details if not preserved.

## Alternatives

| Alternative | Notes |
| --- | --- |
| OpenAI-only MVP | Fastest path but creates migration debt |
| Fully raw provider payloads | Maximum fidelity but weak dashboards |
| Use OpenTelemetry schema only | Good standard base but product needs additional business fields |

## Consequences

- Store normalized provider/model fields plus raw metadata.
- Maintain a provider catalog.
- Keep unknown model handling graceful.
- Add fields for future routing and fallback even if unused in MVP.

## Trade-offs

Kernux accepts some abstraction design work now to avoid painful multi-provider retrofits later.

## Estimated Implementation Effort

3-5 days for MVP provider catalog, normalization, and cost support.
