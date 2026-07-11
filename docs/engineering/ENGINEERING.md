# Engineering

## Engineering Strategy

Build a small, reliable, well-tested platform that can support fast iteration without collapsing under complexity.

## Technical Defaults

| Area | Default |
| --- | --- |
| Backend | Go modular monolith |
| Frontend | Next.js |
| Database | PostgreSQL |
| Cache/queue | Redis |
| Local development | Docker Compose |
| CI | GitHub Actions |
| Deployment | Simple container deployment |
| Documentation | Markdown in docs/ |

## Engineering Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Optimize for one-person maintainability | The founder is the bottleneck | Faster delivery, lower cognitive load | Less specialization | Adopt larger-team patterns | Simpler now, refactor later when needed | Ongoing |
| Use vertical implementation slices | Validates product value quickly | Demoable progress | May duplicate early code | Build layers horizontally | Faster learning, some cleanup later | Ongoing |
| Keep dependencies sparse | Every dependency becomes maintenance | Security and upgrade simplicity | May write small utilities | Add libraries freely | Less magic, more explicit code | Ongoing |
| Treat AI-generated code as draft code | AI can produce plausible bugs | Higher correctness | Slower review | Trust generated output | Better quality, more human review | Ongoing |

## Definition Of Ready

Before implementation:

- User job is clear.
- Acceptance criteria are written.
- Data model impact is known.
- Failure behavior is defined.
- Test approach is known.
- Documentation impact is identified.

## Definition Of Done

Before release:

- Feature works end to end.
- Tests cover core behavior and edge cases.
- Logs/metrics exist for failures.
- UI states include empty, loading, success, and error.
- Docs are updated.
- Rollback or disable path is known.
