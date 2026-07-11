# Sprint 1: Ingestion Foundation

## Duration

1 week.

## Objectives

- Implement project and API key foundation.
- Implement trace/span ingestion.
- Persist normalized telemetry.
- Add validation, idempotency, and core tests.

## Tasks

| Task | Effort | Dependencies | Acceptance |
| --- | --- | --- | --- |
| Project model and API keys | 1 day | Auth decision | Project can create/revoke hashed API keys |
| Trace ingestion endpoint | 1-2 days | API contract | Valid trace persists with normalized fields |
| Span ingestion support | 1 day | Trace model | Spans attach to trace and preserve order |
| Validation and errors | 1 day | API contract | Invalid payloads return stable errors |
| Cost calculation MVP | 1 day | Provider catalog | Cost estimated for supported models |
| Ingestion tests | 1 day | Endpoints | Auth, validation, idempotency, persistence covered |

## Deliverables

- Ingest API.
- Database migrations.
- Provider/model catalog seed.
- Ingestion test suite.
- Minimal internal query path for trace retrieval.

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Support batch trace creation only if simple | SDKs may send trace with spans together | Fewer round trips | Payload complexity | Span-only streaming first | Better onboarding, more validation | 1 day |
| Start with a small supported model catalog | Cost accuracy matters more than breadth | Easier maintenance | Unsupported model gaps | Huge catalog now | Accuracy over coverage | 0.5-1 day |
| Make ingestion failure messages excellent | Failed first integration kills activation | Better developer experience | More implementation detail | Generic errors | More polish, better adoption | 0.5 day |

## Acceptance Criteria

- A trace payload can be submitted with an API key.
- Duplicate submission does not create duplicate trace records when idempotency id matches.
- Invalid payloads produce field-level errors.
- Trace/span data can be queried for UI work.
- Tests pass locally and in CI.
