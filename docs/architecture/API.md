# API

## API Principles

Kernux APIs should be predictable, documented, versioned, and easy to call from any language.

## API Classes

| Class | Audience | Auth |
| --- | --- | --- |
| Ingest API | Customer applications | Project API key |
| App API | Kernux web frontend | User session |
| Admin API | Future enterprise/admin automation | User/session or scoped token |

## MVP Endpoints

| Endpoint | Purpose | MVP |
| --- | --- | --- |
| POST /v1/traces | Create trace with optional spans | Yes |
| POST /v1/spans | Append span to existing trace | Yes |
| POST /v1/scores | Add eval/feedback score | Yes |
| GET /api/projects | List UI projects | Yes |
| GET /api/traces | Trace list query | Yes |
| GET /api/traces/{id} | Trace detail | Yes |
| GET /api/metrics/summary | Dashboard summary | Yes |
| POST /api/api-keys | Create project API key | Yes |

## Payload Design

Core trace fields:

- external trace id
- name
- timestamp
- environment
- provider
- model
- prompt name
- prompt version
- user id
- customer id
- latency
- token usage
- estimated cost
- status
- metadata

Core span fields:

- span id
- parent span id
- trace id
- type
- name
- start/end time
- provider/model when applicable
- input/output when configured
- token usage
- error
- metadata

## Recommendations

| Recommendation | Why | Benefits | Risks | Alternatives | Trade-offs | Effort |
| --- | --- | --- | --- | --- | --- | --- |
| Version public APIs from day one | Integrations are hard to migrate silently | Stable developer contract | Slight URL ceremony | Unversioned MVP | More discipline now, less breakage later | 0.5 day |
| Support client-provided ids | Customers need idempotency and correlation | Easier retries and debugging | Collision handling required | Server ids only | More reliable ingestion, more validation | 1 day |
| Use explicit redaction flags | Payload storage is sensitive | Trust and compliance clarity | More client decisions | Always store everything | Safer defaults, less debugging detail if disabled | 1 day |
| Document errors as product surface | Ingestion failures block activation | Better developer experience | Documentation upkeep | Generic errors | More clarity, more maintenance | 1 day |

## Error Model

Every API error should include:

- stable error code.
- human-readable message.
- request id.
- field validation details when applicable.
- retryability hint.
