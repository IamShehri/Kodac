# Git Workflow

## Branching Strategy

Use short-lived branches from main.

Branch naming:

- feature/short-name
- fix/short-name
- docs/short-name
- chore/short-name

## Commit Style

Use concise conventional commits:

- feat: add trace ingestion
- fix: handle duplicate span ids
- docs: add api reference
- test: cover cost calculation
- chore: update dependencies

## Pull Request Rules

Every PR should include:

- Problem.
- Solution.
- Test evidence.
- Screenshots for UI work.
- Migration notes if schema changes.
- Follow-up items.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use trunk-based short-lived branches | One-founder development benefits from low ceremony | Faster merges, fewer conflicts | Less isolation for large work | GitFlow | Speed and simplicity over release formalism | Ongoing |
| Require PR descriptions even when solo | Future self needs context | Better audit trail | Feels repetitive | Commit directly to main | Slight overhead, better memory | 5 minutes per PR |
| Keep commits meaningful | AI-assisted changes can sprawl | Easier review and rollback | Requires staging discipline | One giant commit | Better history, more effort | Ongoing |
| Tag releases from day one | Supports rollback and changelog | Operational clarity | Minor process overhead | Untagged deploys | More discipline, better recovery | 10 minutes per release |

## Release Flow

1. Merge PR to main.
2. CI passes.
3. Deploy to staging or preview.
4. Run smoke checks.
5. Deploy to production.
6. Tag release.
7. Update changelog when public.
