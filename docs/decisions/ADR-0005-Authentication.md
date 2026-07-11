# ADR-0005: Use Managed Auth Or Minimal Auth For MVP

## Status

Accepted with implementation choice pending.

## Context

Kernux needs user login, organizations/projects, and API keys. Authentication is required but not a product differentiator.

## Decision

Use a managed auth provider if it fits deployment constraints and cost. If not, implement minimal email/password auth with strong password hashing, secure sessions, and a clear migration path.

## Why

The MVP should spend engineering time on AI observability, not custom auth complexity.

## Benefits

- Faster implementation if managed.
- Better security defaults.
- Clear path to SSO later.
- Less custom account recovery work.

## Risks

- Managed auth adds vendor dependency.
- Custom auth can create security burden.
- Auth migrations can be painful.

## Alternatives

| Alternative | Notes |
| --- | --- |
| Managed auth | Best speed/security trade-off if pricing and integration fit |
| Custom auth | More control but more risk |
| Magic-link only | Simple but deliverability-dependent |
| GitHub-only auth | Fast for developers but too narrow for teams |

## Consequences

- API keys remain Kernux-owned even if user auth is managed.
- Authorization must be enforced in the backend, not just frontend.
- Enterprise SSO is deferred.

## Trade-offs

Kernux prioritizes secure speed over auth ownership in MVP.

## Estimated Implementation Effort

Managed auth: 1-2 days. Minimal custom auth: 3-5 days plus ongoing security responsibility.
