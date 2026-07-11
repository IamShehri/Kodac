# Milestones

## Milestone 1: Planning Complete

Acceptance:

- Documentation package exists.
- MVP scope is clear.
- ADRs are recorded.
- Sprint plan is ready.

## Milestone 2: First Trace

Acceptance:

- Project and API key exist.
- Trace ingestion works.
- Trace is visible in storage.
- Validation errors are clear.

## Milestone 3: First Debugging Session

Acceptance:

- Trace list and detail UI exist.
- User can inspect spans, payloads, metadata, errors, tokens, cost, and latency.
- Filters work for core dimensions.

## Milestone 4: First Monitoring View

Acceptance:

- Dashboard shows volume, cost, latency, tokens, errors, and scores.
- Basic alerts create alert events.
- Metrics match source traces.

## Milestone 5: Private Beta

Acceptance:

- App deploys repeatably.
- CI passes.
- Quickstart docs exist.
- Demo data exists.
- At least 3 design partners can integrate.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Define milestones as user-visible outcomes | Prevents infrastructure-only progress | Better focus | Some infra work feels invisible | Task-based milestones only | Product proof over activity | Ongoing |
| Use design partner integration as beta gate | Real telemetry reveals gaps | Better validation | Slower launch | Self-demo only | More truth, less control | 1-2 weeks beta |
| Measure time-to-first-trace | Activation is decisive | Clear onboarding metric | Needs instrumentation | Qualitative feedback only | Better product learning | 1 day |
