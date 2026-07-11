# CI/CD

## CI/CD Goals

The pipeline should keep the product deployable at all times without becoming a platform project of its own.

## CI Checks

| Check | Purpose |
| --- | --- |
| Formatting | Keep style consistent |
| Linting | Catch common mistakes |
| Backend unit tests | Protect business logic |
| Backend integration tests | Protect database/API behavior |
| Frontend type check | Catch UI/API type issues |
| Frontend tests | Protect key components/workflows |
| Migration check | Ensure schema applies cleanly |

## Deployment Strategy

MVP should use a simple container deployment:

- Build backend container.
- Build frontend container or deploy Next.js to managed platform.
- Run migrations before deploy with controlled rollback.
- Run worker as separate process from same backend image.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Use GitHub Actions | Repository already assumes GitHub | Simple integration | YAML maintenance | External CI | Fast setup, common tooling | 1 day |
| Keep staging environment small but real | Production issues often come from config/data differences | Safer releases | Extra cost | Production-only deploys | Better confidence, more ops | 1-2 days |
| Make migrations explicit deploy steps | Database changes are high risk | Better control | Deployment complexity | Auto-migrate at app boot | Safer schema evolution | 1 day |
| Use smoke tests after deploy | Catches broken critical paths | Faster rollback decisions | Needs test data | Manual clicking | More reliable releases | 1 day |

## MVP Pipeline

1. Install dependencies.
2. Format/lint.
3. Run backend tests.
4. Run frontend type checks/tests.
5. Build containers.
6. Run migration check.
7. Deploy on manual approval.
8. Run smoke tests.
