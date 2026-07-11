# Engineering Culture

Kernux engineering should combine founder urgency with infrastructure-grade discipline.

## Cultural Model

Kernux is being built by one founder with AI-assisted development. That means the engineering culture must be explicit, documented, and biased toward systems that are easy to inspect.

## Values

| Value | Meaning | Behavior |
| --- | --- | --- |
| Clarity | Decisions are written down | Use ADRs for consequential choices |
| Smallness | Work is sliced into shippable increments | Prefer one complete workflow over five partial systems |
| Ownership | The builder owns runtime behavior | Include logs, metrics, tests, and rollback thinking |
| Taste | Product quality matters | Build useful interfaces, not decorative dashboards |
| Skepticism | AI-generated code is reviewed like junior engineer output | Test, simplify, and delete aggressively |

## Operating Cadence

- Weekly planning: define one or two outcomes.
- Daily implementation checkpoint: verify the product still runs end to end.
- End-of-week review: demo, measure, cut scope, update docs.
- ADR review: every architectural commitment gets a recorded decision.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use written implementation briefs before coding | AI-assisted development works better with precise target behavior | Fewer wrong turns, better prompts, clearer review | Slows impulsive coding | Jump directly into implementation | Slight upfront cost, much lower rework | 30-60 minutes per feature |
| Maintain a strict definition of done | AI-generated changes can look complete while missing edge cases | Higher reliability and confidence | Can feel heavy in week one | Ad hoc acceptance | More discipline, fewer regressions | Ongoing |
| Build internal observability from the start | Kernux sells observability and must dogfood it | Faster debugging, product credibility | Consumes MVP time | Add later | Slight delivery overhead, strong trust signal | 1-2 days |

## Definition Of Done

A feature is done when:

- The workflow is usable end to end.
- Core tests pass.
- Failure states are visible.
- Relevant metrics or logs exist.
- Documentation or ADRs are updated.
- The feature can be demoed without developer explanation.
