# KODAC KDO H4-R4B Phase-B AG1-A — App Source Repository + Implementation/Test Authorization

Date: 2026-08-22
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — NO SOURCE REPOSITORY CREATION YET — NO APP REGISTRATION — NO APP INSTALLATION — NO SECRETS — NO DEPLOYMENT — NO POSTGRESQL PROVISIONING — NO PROTECTED-MAIN MUTATION — NO TRUST-ROOT ESTABLISHMENT**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Authorize one later, separately executed AG1-A implementation slice that may create a dedicated candidate-independent source repository for the Phase-B GitHub App and implement its bounded source + offline test surface.

This document is a predecessor only. It does **not** itself create the source repository, register/install a GitHub App, generate/access secrets, deploy the App, provision PostgreSQL, mutate Kodac rulesets/branch protection/workflows, qualify a reviewer provider, establish a trust root, execute Kodac artifacts, or start B1-v2/B2A-v2/B2B.

Canonical predecessor:

```text
REPOSITORY=TheHalfMoon/Kodac
CANONICAL_MAIN=eed0b8dd91497956f291f92a6c674fd54e38d0d4
CANONICAL_MAIN_TREE=dbd334c1150fe7ffaee2214b7f97f178d657ba47
PR_149=MERGED_CANONICAL
PR_149_REVIEWED_HEAD=a2f19b507dee90548bb7082475352b22e2a1f251
PHASE_B_AG1_APP_DISCOVERY_PROOF_PLAN=CANONICAL
APP_LOGICAL_ID=kodac-phase-b-gate-v1
```

Canonical AG-1 ordering already requires:

```text
AG1-A = separate authorization for App source repository + implementation + tests
AG1-B = separate authorization for App registration / external deployment / receipt-store provisioning / installation
AG1-C = qualify at least one reviewer provider and freeze reviewer allowlist
AG2   = protected-main configuration proof binding kodac/phase-b-gate to exact app_id
AG4   = sacrificial qualification PR proving complete server-side behavior
```

No step implicitly authorizes the next.

---

## 2. Maximum result if this authorization becomes canonical

Only the following may become true:

```text
PHASE_B_AG1A_APP_SOURCE_IMPLEMENTATION_AUTHORIZATION=CANONICAL
AG1A_FUTURE_SOURCE_REPOSITORY_CREATION=AUTHORIZED_TO_START_SEPARATELY
AG1A_FUTURE_SOURCE_IMPLEMENTATION=AUTHORIZED_TO_START_SEPARATELY
AG1A_FUTURE_OFFLINE_TESTS=AUTHORIZED_TO_START_SEPARATELY
```

Still false after merge of this predecessor:

```text
APP_SOURCE_REPOSITORY_CREATED=NO
APP_SOURCE_IMPLEMENTATION_CREATED=NO
GITHUB_APP_CREATED=NO
GITHUB_APP_REGISTERED=NO
GITHUB_APP_INSTALLED=NO
APP_PRIVATE_KEY_EXISTS_BY_THIS_SLICE=NO
WEBHOOK_SECRET_EXISTS_BY_THIS_SLICE=NO
APP_DEPLOYED=NO
RECEIPT_STORE_PROVISIONED=NO
REVIEWER_ALLOWLIST=[]
QUALIFIED_REVIEWER_PROVIDERS=0
PHASE_B_SERVER_SIDE_ATOMIC_GATE=NOT_PROVEN
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT=BLOCKED
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
CURRENT_SESSION_PROCESS_AUTHORITY=NOT_GRANTED
B1_V2/B2A_V2/B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
```

---

## 3. Exact future source repository identity

AG1-A authorizes exactly this source-repository candidate, but does not create it:

```text
APP_SOURCE_REPOSITORY_CANDIDATE=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_OWNER_REQUIRED=TheHalfMoon
APP_SOURCE_OWNER_TYPE_REQUIRED=User
APP_SOURCE_VISIBILITY_REQUIRED=public
APP_SOURCE_DEFAULT_BRANCH_REQUIRED=main
APP_SOURCE_REPOSITORY_IS_KODAC=NO
APP_SOURCE_REPOSITORY_CREATION_IN_THIS_PR=NO
```

The future repository must be newly created from an empty initial state or from an independently verified empty/main baseline. It must not be forked from `TheHalfMoon/Kodac` and must not inherit Kodac workflows, secrets, rulesets, branch protection, Actions variables, or deployment configuration.

If the exact repository name is unavailable, collides with an existing repository, or would require reuse of a repository with unrelated history, implementation must stop and obtain a replacement repository-identity authorization before creation.

The future source repository is an implementation authority boundary, not the Phase-B merge authority by itself.

---

## 4. Candidate-independence theorem

Required future properties:

```text
APP_SOURCE_REPOSITORY_ID != 1297407563
APP_SOURCE_REPOSITORY_FULL_NAME != TheHalfMoon/Kodac
KODAC_PR_CANDIDATE_CAN_MUTATE_APP_SOURCE=NO
KODAC_PR_CANDIDATE_CAN_MUTATE_APP_DEPLOYMENT=NO
KODAC_PR_CANDIDATE_CAN_MUTATE_RECEIPT_STORE=NO
KODAC_ACTIONS_SECRETS_CONTAIN_APP_CREDENTIALS=NO
KODAC_SOURCE_CONTAINS_APP_CREDENTIALS=NO
KODAC_PR_COMMENTS_CONTAIN_APP_CREDENTIALS=NO
AGENT_CONTEXT_CONTAINS_REAL_APP_CREDENTIALS=NO
```

The source repository may remain under the same personal account owner because the required separation is from the establishment candidate and protected repository history, not from the founder account itself. Later deployment and protected-main proof must still bind immutable source/deployment identities and the GitHub-assigned `app_id`.

---

## 5. Exact implementation language and dependency budget

AG1-A selects:

```text
IMPLEMENTATION_LANGUAGE=Go
GO_TOOLCHAIN_EXACT=go1.26.6
CGO_PRODUCTION_BUILD=DISABLED
GO_MODULE=github.com/TheHalfMoon/kodac-phase-b-gate
```

Current primary source for the selected toolchain:

- https://go.dev/dl/

The implementation should use the Go standard library for:

```text
HTTP server/client
HMAC-SHA256
SHA-256
constant-time MAC comparison
RSA/PKCS#1 signing
PEM/X.509 parsing
base64url
JSON tokenization/decoding
TLS
URL handling
structured time handling
```

Exactly one direct third-party runtime dependency family is authorized:

```text
github.com/jackc/pgx/v5 = v5.10.0
```

Primary reference:

- https://pkg.go.dev/github.com/jackc/pgx/v5

No other direct runtime dependency may be introduced without a new authorization.

Explicitly not authorized in AG1-A:

```text
web framework = NONE
GitHub SDK = NONE
JWT library = NONE
JCS/canonical-JSON library = NONE
ORM = NONE
migration framework = NONE
logging framework = NONE
metrics SDK = NONE
cloud provider SDK = NONE
secret manager SDK = NONE
container SDK = NONE
queue/broker client = NONE
Redis = NONE
vector database = NONE
LLM/model SDK = NONE
```

Transitive modules required by the pinned `pgx/v5` release are allowed only as resolved by the exact `go.mod` + `go.sum` generated in the future source repository and must be captured in source provenance.

---

## 6. Why Go is selected for this gate

This gate is small, security-critical, network-facing infrastructure. The selected implementation keeps the trusted source surface narrow:

```text
one statically buildable service
one external database driver family
stdlib cryptography
stdlib HTTP
stdlib JSON token stream
no framework plugin model
no runtime code generation
no dynamic package loading
no shell execution
```

The implementation must not call external commands, spawn shells, run repository code, execute Kodac artifacts, or interpret candidate-provided scripts.

---

## 7. Exact future repository path surface

The initial AG1-A implementation commit may contain exactly the following paths and no others:

```text
.gitignore
LICENSE
README.md
SECURITY.md
go.mod
go.sum
build/recipe.json
cmd/phase-b-gate/main.go
internal/config/config.go
internal/config/config_test.go
internal/clock/clock.go
internal/clock/clock_test.go
internal/strictjson/duplicates.go
internal/strictjson/duplicates_test.go
internal/webhook/headers.go
internal/webhook/headers_test.go
internal/webhook/signature.go
internal/webhook/signature_test.go
internal/webhook/payload.go
internal/webhook/payload_test.go
internal/githubauth/jwt.go
internal/githubauth/jwt_test.go
internal/githubapi/client.go
internal/githubapi/client_test.go
internal/receipt/types.go
internal/receipt/canonical.go
internal/receipt/canonical_test.go
internal/receipt/founder.go
internal/receipt/founder_test.go
internal/receipt/review.go
internal/receipt/review_test.go
internal/store/store.go
internal/store/postgres.go
internal/store/sql.go
internal/store/sql_test.go
internal/gate/evaluate.go
internal/gate/evaluate_test.go
internal/checkrun/checkrun.go
internal/checkrun/checkrun_test.go
internal/server/server.go
internal/server/server_test.go
migrations/0001_phase_b.sql
migrations/0001_phase_b_test.go
testdata/webhooks/github_signature_vector.txt
testdata/webhooks/issue_comment_created.json
testdata/webhooks/pull_request_opened.json
testdata/webhooks/pull_request_synchronize.json
testdata/webhooks/pull_request_review_submitted.json
testdata/webhooks/reject_duplicate_member.json
testdata/receipts/founder_receipt_vector.json
testdata/receipts/review_receipt_vector.json
```

`LICENSE` must be Apache-2.0, matching Kodac.

No `.github/workflows/**` path is authorized by AG1-A. Source-repository CI/workflow creation is a separate mutation and is not implied by this authorization.

No Dockerfile/Containerfile is authorized by AG1-A. Immutable OCI build/deployment recipe selection remains AG1-B or a separately authorized predecessor.

If implementation needs a path outside this list, stop and amend authorization before creating it.

---

## 8. Exact build-recipe source contract

`build/recipe.json` is source provenance only; AG1-A does not execute or publish an artifact.

It must encode a single deterministic production build recipe purpose-equivalent to:

```text
GOOS=linux
GOARCH=amd64
CGO_ENABLED=0
go build -trimpath -buildvcs=true -mod=readonly -o phase-b-gate ./cmd/phase-b-gate
```

The recipe must also bind:

```text
goToolchain=go1.26.6
moduleMode=readonly
cgo=false
entrypoint=./cmd/phase-b-gate
```

No mutable container base, package-manager install step, curl-to-shell step, generated source download, or network-fetched executable may appear in the AG1-A build recipe.

Actual artifact production is not authorized by this predecessor.

---

## 9. Configuration and real-secret boundary

The service source may define configuration field names and validation logic only.

Required non-secret configuration identifiers:

```text
KODAC_REPOSITORY_ID
KODAC_REPOSITORY_FULL_NAME
KODAC_BASE_REF
GITHUB_APP_ID
GITHUB_INSTALLATION_ID
GITHUB_API_BASE_URL
GITHUB_API_VERSION
DATABASE_DSN
WEBHOOK_SECRET
APP_PRIVATE_KEY_PEM
```

Normative values where already canonical:

```text
KODAC_REPOSITORY_ID=1297407563
KODAC_REPOSITORY_FULL_NAME=TheHalfMoon/Kodac
KODAC_BASE_REF=main
GITHUB_API_BASE_URL=https://api.github.com
GITHUB_API_VERSION=2026-03-10
```

Real values for these remain unavailable in AG1-A:

```text
GITHUB_APP_ID=<NOT_ASSIGNED>
GITHUB_INSTALLATION_ID=<NOT_ASSIGNED>
DATABASE_DSN=<NO_STORE_PROVISIONED>
WEBHOOK_SECRET=<NO_REAL_SECRET>
APP_PRIVATE_KEY_PEM=<NO_REAL_PRIVATE_KEY>
```

The implementation must never log, serialize, persist, hash-for-evidence, return in HTTP responses, or include in panic/error text the value of:

```text
WEBHOOK_SECRET
APP_PRIVATE_KEY_PEM
DATABASE_DSN credential material
App JWT
installation access token
```

Only non-secret identifier names may appear in docs/evidence.

Synthetic test-only cryptographic values are permitted in the later AG1-A implementation tests only if they are impossible to confuse with deployment credentials and never leave test process memory except committed non-secret public test vectors explicitly identified as synthetic.

---

## 10. HTTP server surface

The future service may expose exactly:

```text
POST /github/webhook
GET  /healthz
```

`/healthz` may prove only process liveness and must not prove Phase-B authority, database readiness, GitHub authentication, reviewer qualification, or protected-main readiness.

No admin endpoint, debug endpoint, metrics endpoint, generic proxy endpoint, user OAuth callback, browser session, login endpoint, mutable configuration endpoint, or arbitrary webhook endpoint is authorized.

Webhook body handling:

```text
MAX_BODY_BYTES=26214400
BODY_BUFFERING=EXACT_RAW_BYTES
CONTENT_DECODING_BEFORE_SIGNATURE=FORBIDDEN
JSON_PARSE_BEFORE_SIGNATURE=FORBIDDEN
```

The 25 MiB bound matches GitHub's documented webhook payload cap.

Primary reference:

- https://docs.github.com/en/webhooks/webhook-events-and-payloads

---

## 11. Webhook authentication contract

The implementation must preserve the canonical order:

```text
1. bound-read exact raw request bytes
2. require X-GitHub-Event
3. require X-GitHub-Delivery
4. require X-Hub-Signature-256
5. require signature syntax sha256=<64 lowercase hex>
6. compute HMAC-SHA256(secret, exact raw bytes)
7. constant-time compare using hmac.Equal or purpose-equivalent stdlib primitive
8. reject mismatch before JSON decoding
9. compute raw_payload_sha256
10. reject duplicate JSON member names before semantic trust
11. decode only the event-specific fields required by the canonical contract
12. require repository.id/full_name binding
13. require installation.id binding
14. enter one delivery/receipt transaction
```

Primary reference:

- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries

The committed test suite must include GitHub's published HMAC test vector.

---

## 12. Strict JSON boundary

Go's ordinary struct/map decoding alone is insufficient as the security parser because duplicate JSON object member names can otherwise collapse before semantic validation.

`internal/strictjson/duplicates.go` must walk the JSON token stream recursively and reject any duplicate object member name at any nesting level before trusted semantic decoding.

Required behavior:

```text
VALID_JSON_NO_DUPLICATES=ACCEPT_FOR_LATER_SEMANTIC_VALIDATION
DUPLICATE_TOP_LEVEL_MEMBER=REJECT
DUPLICATE_NESTED_MEMBER=REJECT
MALFORMED_JSON=REJECT
TRAILING_NON_WHITESPACE=REJECT
JSON_BEFORE_VALID_SIGNATURE=FORBIDDEN
```

Unknown GitHub webhook fields are allowed because GitHub payloads evolve; only duplicate-member ambiguity is globally rejected. Receipt objects are separately strict and permit only their exact schema fields.

---

## 13. GitHub App JWT and installation-token source contract

The future source may implement GitHub App authentication without accessing any real key.

Required JWT contract:

```text
JWT_ALGORITHM=RS256
JWT_IAT=clock_now_minus_60_seconds
JWT_EXP<=clock_now_plus_9_minutes
JWT_ISS=exact_GITHUB_APP_ID
JWT_TYP=JWT
```

Primary references:

- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-a-json-web-token-jwt-for-a-github-app
- https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/authenticating-as-a-github-app

Installation token acquisition may target exactly:

```text
POST /app/installations/{installation_id}/access_tokens
```

Installation tokens must be treated as opaque strings. Source/tests must not assume token length or legacy token format.

The production implementation must keep JWTs and installation access tokens in memory only and must not persist them to PostgreSQL.

No user access token or founder PAT path is authorized.

---

## 14. GitHub REST surface

The future client may call exactly these GitHub REST operations:

```text
POST /app/installations/{installation_id}/access_tokens
GET  /repos/TheHalfMoon/Kodac/pulls/{pull_number}
GET  /repos/TheHalfMoon/Kodac/pulls/{pull_number}/files
POST /repos/TheHalfMoon/Kodac/check-runs
```

No Contents API, Actions API, Administration API, branch-protection mutation API, ruleset mutation API, workflow API, issue-write API, merge API, review-write API, repository mutation API, secret API, or key-management API is authorized.

The client must use:

```text
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2026-03-10
Authorization: Bearer <opaque token>
```

Retry behavior must be bounded and must never retry a non-idempotent semantic write blindly. Check-run creation/recomputation logic must use exact-head state and retain enough response identity for later evidence without storing credentials.

---

## 15. Supported webhook events/actions

The implementation may recognize exactly the canonical event set:

```text
issue_comment
pull_request
pull_request_review
```

Authorized actions:

```text
issue_comment.created
pull_request.opened
pull_request.reopened
pull_request.synchronize
pull_request.ready_for_review
pull_request_review.submitted
```

All other subscribed-event actions must produce a safe no-receipt/no-success outcome. An unknown event name is not an authority event.

The implementation must not subscribe, register, or alter actual webhook configuration in AG1-A.

---

## 16. Pull-request identity and changed-path theorem

For every candidate evaluation:

```text
repository.id=1297407563
repository.full_name=TheHalfMoon/Kodac
base.ref=main
head.repo.id=1297407563
pull_request.state=open
pull_request.draft=false
head.sha=<40 lowercase hex>
```

Fork heads fail closed.

Changed paths must be obtained from GitHub's Pull Request Files REST endpoint using the App installation token, with complete pagination and an explicit hard maximum.

For real trust-root establishment the only allowed path set remains:

```text
provenance/kdo-h4-r4b-founder-process-authority-trust-root-v1.json
packages/kodac-runtime/test/helpers/kdo-h4-r4b-founder-process-authority-verifier.ts
packages/kodac-runtime/test/kdo-h4-r4b-founder-process-authority-trust-root.test.ts
docs/planning/KODAC_KDO_H4_R4B_FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_2026-08-21.md
```

Any additional changed path causes gate failure.

No candidate-side file may modify this allowlist at runtime.

---

## 17. Receipt canonicalization implementation

Canonical receipt schemas contain strict string fields only.

AG1-A therefore authorizes a purpose-built canonical serializer instead of a general third-party JCS dependency.

The serializer must:

```text
require exact schema field set
reject unknown fields
reject missing fields
reject duplicate fields before struct construction
require UTF-8 strings
apply field-specific ASCII/value grammar where the canonical schema permits only ASCII identifiers/digests/timestamps
sort member names lexicographically by Unicode code point
emit JSON strings with RFC 8785-compatible escaping
emit no insignificant whitespace
emit UTF-8 bytes
```

The canonical preimage remains:

```text
UTF8(receipt_domain)
|| 0x00
|| UTF8(RFC8785_JCS(receipt_object))
```

Receipt SHA-256 is over the exact stored preimage bytes.

`internal/receipt/canonical_test.go` must contain fixed byte-for-byte vectors, not merely semantic JSON equality tests.

If the implementation cannot prove byte equivalence to RFC 8785 for every allowed field value, stop and obtain authorization to add a separately pinned canonicalization dependency rather than silently broadening behavior.

---

## 18. Founder receipt implementation

The future implementation may create a founder receipt only from:

```text
X-GitHub-Event=issue_comment
action=created
comment is top-level PR issue comment
founder login=TheHalfMoon
founder user id=285091250
comment body=exact canonical bootstrap grammar
candidate head=current exact head
repository/install binding=PASS
```

Required receipt domain:

```text
kodac-phase-b-founder-bootstrap-receipt-v1
```

Required strict fields remain exactly:

```text
schemaVersion
repository
repositoryId
pullRequestNumber
candidateHeadSha
founderLogin
founderUserId
sourceCommentId
sourceCommentNodeId
sourceCommentCreatedAtUtc
sourceCommentBodySha256
trustRootIdSha256
publicKeySpkiDerSha256
establishmentPreimageSha256
webhookDeliveryId
webhookRawPayloadSha256
appGithubId
appInstallationId
receiptCreatedAtUtc
```

Comment edit/delete events do not create, mutate, or revoke a stored receipt. Head mutation invalidates its applicability to the new head.

---

## 19. Independent review receipt implementation

The source may implement the generic receipt machinery and provider-adapter interface, but the live allowlist remains empty:

```text
REVIEWER_ALLOWLIST=[]
QUALIFIED_REVIEWER_PROVIDERS=0
```

No actual provider adapter entry may be populated by AG1-A.

Required review receipt domain:

```text
kodac-phase-b-independent-review-receipt-v1
```

Required strict fields remain exactly:

```text
schemaVersion
repository
repositoryId
pullRequestNumber
candidateHeadSha
providerId
reviewerLogin
reviewerUserId
sourceReviewId
sourceReviewNodeId
sourceReviewCommitSha
sourceReviewState
sourceReviewBodySha256
providerAdapterVersion
providerAllowlistSha256
webhookDeliveryId
webhookRawPayloadSha256
appGithubId
appInstallationId
receiptCreatedAtUtc
```

With an empty allowlist, no real `pull_request_review.submitted` event may produce an authoritative review receipt.

AG1-C remains required to add any concrete provider identity/adapter/allowlist entry.

---

## 20. Append-only store source contract

AG1-A may implement the PostgreSQL adapter and migration source but may not provision or connect to a real PostgreSQL instance.

Selected engine remains:

```text
PostgreSQL >=16
DATABASE_LOGICAL_NAME=kodac_phase_b_gate
SCHEMA_LOGICAL_NAME=phase_b
```

`migrations/0001_phase_b.sql` may define exactly:

```text
phase_b.webhook_deliveries
phase_b.receipts
append-only defense-in-depth triggers/functions required to reject UPDATE/DELETE
indexes/constraints required by the canonical collision theorem
```

It must not create runtime credentials or embed passwords/connection strings.

The runtime SQL path must use parameterized statements only.

The transaction theorem remains:

```text
BEGIN
  lookup delivery_guid
  if present:
    require stored raw_payload_sha256 == current raw_payload_sha256
    else FATAL_SECURITY_ERROR
    return idempotent outcome
  if absent:
    validate semantics
    create receipt preimage if applicable
    insert delivery
    insert receipt create-if-absent if applicable
    read back exact stored bytes/digests
    verify equality
COMMIT
```

Any semantic, collision, or readback failure rolls back the transaction.

---

## 21. Database runtime privilege theorem preserved

AG1-A source must assume and enforce compatibility with the later runtime role:

```text
SELECT=YES
INSERT=YES
UPDATE=NO
DELETE=NO
TRUNCATE=NO
CREATE=NO
ALTER=NO
DROP=NO
GRANT=NO
```

The running App must not require elevated privileges to function.

Any implementation discovery that requires runtime UPDATE/DELETE/DDL is a hard stop and invalidates AG1-A authorization.

Live privilege probes remain AG1-B/deployment proof work because AG1-A provisions no database.

---

## 22. Gate evaluation state machine

The service must produce one semantic gate result for an exact head:

```text
PASS
FAIL
```

The future GitHub Check Run mapping is exactly:

```text
PASS -> conclusion=success
FAIL -> conclusion=failure
```

Forbidden authority conclusions:

```text
neutral
skipped
```

Check name remains exactly:

```text
kodac/phase-b-gate
```

A missing, malformed, stale, conflicting, unqualified, or unverifiable input yields FAIL.

No timeout or internal error may be converted to success.

---

## 23. Required evaluation inputs

The pure evaluator must accept explicit data rather than reading hidden global state:

```text
repositoryId
repositoryFullName
installationId
pullRequestNumber
baseRef
headRepositoryId
headSha
pullRequestState
pullRequestDraft
changedPaths
founderReceipt
independentReviewReceipt
reviewerAllowlistSha256
appGithubId
appSourceRevision
permissionSetSha256
eventSetSha256
```

The evaluator must not read the local filesystem, shell environment, network, or database directly. Adapters gather inputs and pass an immutable value object to the evaluator.

This separation is required so the authority logic can be exhaustively tested offline.

---

## 24. Clock and nondeterminism boundary

All time-dependent code must receive a clock interface from `internal/clock`.

Production may use UTC system time only through that interface.

Tests must use a fixed clock.

No decision may depend on local timezone, locale, random numbers, map iteration order, wall-clock sleeps, filesystem timestamps, or process ID.

JWT issuance time and receipt creation time are the only intended clock consumers in v1.

---

## 25. Logging and error boundary

The service may use the Go standard `log/slog` package only.

Allowed structured log fields are non-secret identifiers such as:

```text
event
action
delivery_guid
repository_id
installation_id
pull_request_number
head_sha
receipt_sha256
check_run_id
error_class
```

Forbidden log content:

```text
raw webhook body
comment body
review body
webhook secret
private key
JWT
installation token
DATABASE_DSN
receipt_preimage_bytes
HTTP Authorization header
```

Errors returned to webhook callers must be generic and must not echo untrusted payload fragments or secret material.

---

## 26. Exact AG1-A offline test commands

A later AG1-A implementation slice may run only source-level/offline checks purpose-equivalent to:

```text
go version
go env GOTOOLCHAIN
go mod verify
go vet ./...
go test -count=1 ./...
go test -shuffle=on -count=20 ./...
```

No test may require:

```text
real GitHub App
real GitHub API write
real webhook endpoint
real App private key
real webhook secret
real installation token
real PostgreSQL instance
Docker
runsc/gVisor
Kodac artifact execution
workload execution
model/provider call
```

Tests must use `httptest` or equivalent in-process synthetic HTTP servers for GitHub API behavior and pure fake/in-memory store interfaces for transaction-state-machine tests.

The real pgx adapter must compile and have its generated SQL/parameter contracts statically tested, but live PostgreSQL integration is deferred.

---

## 27. Mandatory implementation test matrix

The future source must prove at least all of the following before AG1-A can be called implemented:

```text
T001 valid GitHub published webhook HMAC vector -> ACCEPT
T002 missing X-Hub-Signature-256 -> REJECT
T003 malformed signature syntax -> REJECT
T004 wrong signature -> REJECT
T005 JSON parse attempted before valid signature -> IMPOSSIBLE_BY_API_STRUCTURE
T006 body > 25 MiB -> REJECT
T007 duplicate top-level JSON member -> REJECT
T008 duplicate nested JSON member -> REJECT
T009 malformed JSON/trailing bytes -> REJECT
T010 wrong repository id -> REJECT
T011 wrong repository full_name -> REJECT
T012 wrong installation id -> REJECT
T013 fork head -> FAIL
T014 base ref != main -> FAIL
T015 closed PR -> FAIL
T016 draft PR -> FAIL
T017 malformed head SHA -> FAIL
T018 head changed -> old founder receipt invalid
T019 head changed -> old review receipt invalid
T020 changed path outside exact allowlist -> FAIL
T021 exactly allowed establishment paths -> path gate PASS
T022 duplicate delivery same body hash -> IDEMPOTENT
T023 duplicate delivery different body hash -> FATAL_SECURITY_ERROR
T024 transaction insert failure -> delivery marker absent after rollback
T025 transaction receipt failure -> delivery marker absent after rollback
T026 readback mismatch -> rollback/fatal
T027 same receipt hash + same bytes -> IDEMPOTENT
T028 same receipt hash + different bytes -> FATAL_SECURITY_ERROR
T029 same source event key + different receipt -> FATAL_SECURITY_ERROR
T030 founder wrong login -> no receipt
T031 founder wrong user id -> no receipt
T032 founder wrong comment body -> no receipt
T033 founder wrong candidate head -> no receipt
T034 founder valid exact body/head -> immutable receipt
T035 edited/deleted source comment event -> no mutation
T036 review provider allowlist empty -> no review receipt
T037 unqualified reviewer -> no review receipt
T038 review old head -> no review receipt
T039 review receipt exact-field canonical vector -> exact bytes/digest
T040 founder receipt exact-field canonical vector -> exact bytes/digest
T041 unknown receipt field -> REJECT
T042 missing receipt field -> REJECT
T043 canonical serialization order independent of Go map order -> PASS
T044 evaluator missing founder receipt -> FAIL
T045 evaluator missing review receipt -> FAIL
T046 reviewer allowlist empty -> FAIL for real establishment
T047 permission-set digest mismatch -> FAIL
T048 webhook-event-set digest mismatch -> FAIL
T049 app identity mismatch -> FAIL
T050 PASS maps only to check conclusion success
T051 FAIL maps only to check conclusion failure
T052 neutral/skipped cannot be emitted by type/API
T053 installation token treated as opaque variable-length string
T054 user OAuth/PAT path absent from source
T055 GitHub client endpoint allowlist rejects non-authorized paths
T056 GitHub files pagination complete across multiple pages
T057 GitHub files pagination hard bound exhaustion -> FAIL_CLOSED
T058 network timeout -> FAIL/not success
T059 GitHub 401/403/404/409/422/5xx -> classified failure, never success
T060 clock fixed test produces deterministic JWT claims
T061 JWT alg != RS256 impossible by signer API
T062 JWT exp bounded <= 9 minutes
T063 JWT iat backdated 60 seconds
T064 logs contain no secret/raw-body material
T065 healthz never reports authority success
T066 SQL contains no UPDATE/DELETE/TRUNCATE in runtime path
T067 SQL parameters never interpolate untrusted strings
T068 migration defines runtime-independent append-only constraints
T069 real database connection is not required by AG1-A tests
T070 exact direct runtime dependency set = pgx/v5 only
```

A future implementation report must map every test ID to exact test function/path and result.

---

## 28. Fuzz/property-proof preparation

AG1-A may include deterministic seed cases in ordinary Go tests, but does not authorize an unbounded fuzz campaign in this predecessor.

The source must be shaped so a later security qualification can fuzz at least:

```text
strict JSON duplicate detection
webhook signature parser
founder comment grammar
receipt canonical serializer
GitHub response parser
changed-path evaluator
```

Any discovered panic must fail closed and must never be recoverable as gate success.

---

## 29. Chroma Foundation boundary — important external tool note

Founder-supplied reference:

- https://www.trychroma.com/foundation

Current public observations as of 2026-08-22:

```text
FOUNDATION_WEB_SURFACE=AUTHENTICATED/LOGIN_REQUIRED
PUBLIC_RELEASE_MIRROR=https://github.com/chroma-core/foundation-releases
PUBLIC_SOURCE_AVAILABLE=NO
DISTRIBUTION=PREBUILT_BINARIES
```

The official release mirror states that Foundation source is closed and the public repository contains compiled release artifacts only.

Therefore AG1-A explicitly assigns:

```text
CHROMA_FOUNDATION_TRUST_PATH_ROLE=NONE
CHROMA_FOUNDATION_RUNTIME_DEPENDENCY=NO
CHROMA_FOUNDATION_BUILD_DEPENDENCY=NO
CHROMA_FOUNDATION_TEST_ORACLE=NO
CHROMA_FOUNDATION_SECRET_ACCESS=NO
CHROMA_FOUNDATION_DATABASE_ACCESS=NO
CHROMA_FOUNDATION_GITHUB_APP_CREDENTIAL_ACCESS=NO
CHROMA_FOUNDATION_EXECUTION_IN_THIS_PREDECESSOR=NO
```

Foundation may be considered later as a **non-authoritative developer research/navigation aid** for public source only, subject to separate approval and its then-current privacy/security terms. Any finding or generated suggestion from it must be reproduced by source inspection and deterministic tests before it can influence a security claim.

Closed-source Foundation binaries must never become part of the Phase-B merge-authority runtime, build chain, receipt semantics, reviewer qualification, or proof oracle.

This preserves the user's requested importance of Foundation without importing an opaque executable into the trust boundary.

---

## 30. Source-provenance evidence required after future AG1-A implementation

A later implementation report must bind:

```text
APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_REPOSITORY_ID=<actual stable GitHub id>
APP_SOURCE_EXACT_COMMIT=<40 lowercase hex>
APP_SOURCE_EXACT_TREE=<40 lowercase hex>
APP_SOURCE_CHANGED_PATHS=<exact authorized path set>
GO_TOOLCHAIN_EXACT=go1.26.6
APP_RUNTIME_MANIFEST_SHA256=<sha256(go.mod bytes)>
APP_LOCKFILE_SHA256=<sha256(go.sum bytes)>
APP_BUILD_RECIPE_SHA256=<sha256(build/recipe.json bytes)>
APP_TEST_EVIDENCE_SHA256=<sha256(canonical test report bytes)>
DIRECT_RUNTIME_DEPENDENCY_SET_SHA256=<canonical dependency set digest>
```

No source provenance claim may use `main` or a mutable tag as a substitute for exact commit/tree identity.

---

## 31. Future implementation stop conditions

Stop immediately before broadening authority if any of the following occurs:

```text
source repo name unavailable or preexisting unrelated history
need to put App source in Kodac
need >1 direct runtime dependency family
need a web framework/GitHub SDK/JWT library/ORM
need runtime Contents/Admin/Actions/Workflows permission
need another webhook event
need user OAuth or founder PAT
need runtime database UPDATE/DELETE/DDL
need a real App key/secret during AG1-A tests
need a real PostgreSQL instance during AG1-A tests
need Docker/container execution
need a new source path outside the exact list
cannot prove RFC8785-compatible receipt bytes
cannot reject duplicate JSON members before semantic trust
cannot keep reviewer allowlist empty
cannot keep Foundation/other opaque tool outside trust path
```

A stop condition requires a new predecessor or repair PR; it does not authorize improvisation.

---

## 32. AG1-B remains separate

Nothing in AG1-A authorizes:

```text
GitHub App creation
GitHub App registration
GitHub App installation
GitHub App permission configuration
webhook subscription configuration
private-key generation/access
webhook-secret generation/access
external deployment
DNS/TLS endpoint deployment
PostgreSQL provisioning
migration execution
runtime-role creation
real GitHub API writes
real Check Run creation
real receipt insertion
```

Those remain AG1-B or later explicit predecessors.

---

## 33. AG1-C remains separate

Nothing in AG1-A qualifies a review provider.

```text
REVIEWER_ALLOWLIST=[]
QUALIFIED_REVIEWER_PROVIDERS=0
```

The provider adapter interface may exist, but no concrete provider identity is admitted until AG1-C proves all canonical requirements.

---

## 34. Protected-main configuration remains separate

AG1-A must not modify Kodac:

```text
branch protection
rulesets
required status checks
required app_id binding
conversation-resolution requirement
administrator enforcement
force-push/deletion settings
workflows
Actions secrets/variables
```

AG2 remains responsible for the protected-main server-side configuration proof.

---

## 35. Founder ceremony preservation

Existing founder ceremony bytes remain untouched:

```text
TRUST_ROOT_ID_SHA256=d8a87fb2f17ecaeefd345f2d323b0776c0e51429f7a2dd7c78df6a6068535d98
ESTABLISHMENT_PREIMAGE_SHA256=e57222d6198eb00e2d795fc0c4a82fec3922ba8f22a49edb3fd0a5f0020b2d4f
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=074d1034172792aca9e071caf124c487adff2fb7f78fefd2c43ea6af8711cf71
NONCE_RETIREMENT_REQUIRED=NO
FRESH_NONCE_REQUIRED=NO
RESIGNING_REQUIRED=NO
PRIVATE_KEY_ACCESS=NO
SIGNING=NO
```

AG1-A does not consume, reissue, mutate, or resign any founder ceremony material.

---

## 36. Explicit non-grants for this predecessor

```text
APP_SOURCE_REPOSITORY_CREATION=NO
APP_SOURCE_IMPLEMENTATION=NO
APP_SOURCE_TEST_EXECUTION=NO
APP_ARTIFACT_BUILD_EXECUTION=NO
APP_ARTIFACT_PUBLICATION=NO
GITHUB_APP_CREATION=NO
GITHUB_APP_REGISTRATION=NO
GITHUB_APP_INSTALLATION=NO
GITHUB_APP_PRIVATE_KEY_GENERATION=NO
GITHUB_APP_PRIVATE_KEY_ACCESS=NO
WEBHOOK_SECRET_GENERATION=NO
WEBHOOK_SECRET_ACCESS=NO
APP_DEPLOYMENT=NO
RECEIPT_STORE_PROVISIONING=NO
RECEIPT_STORE_MIGRATION_EXECUTION=NO
RECEIPT_STORE_CREDENTIAL_CREATION=NO
RECEIPT_STORE_CREDENTIAL_ACCESS=NO
REVIEWER_PROVIDER_QUALIFICATION=NO
RULESET_MUTATION=NO
BRANCH_PROTECTION_MUTATION=NO
WORKFLOW_MUTATION=NO
TRUST_ROOT_ESTABLISHMENT_IMPLEMENTATION=NO
TRUST_ROOT_BOOTSTRAP_COMMENT=NOT_YET
TRUST_ROOT_PRIVATE_KEY_ACCESS=NO
TRUST_ROOT_SIGNING=NO
CURRENT_SESSION_PROCESS_AUTHORITY=NOT_GRANTED
DOCKER_EXECUTION=NO
RUNSC_EXECUTION=NO
GVISOR_EXECUTION=NO
WORKLOAD_EXECUTION=NO
B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED
H4_COMPLETE=NO
```

---

## 37. Authorization PR scope fence

This AG1-A predecessor PR itself must remain exactly:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
NATIVE_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
APP_SOURCE_REPOSITORY_MUTATIONS=0
APP_MUTATIONS=0
APP_SECRET_ACCESS=0
RECEIPT_STORE_MUTATIONS=0
RULESET_MUTATIONS=0
BRANCH_PROTECTION_MUTATIONS=0
TRUST_ROOT_PREIMAGE_CHANGED=NO
NONCE_DISPOSITION_PREIMAGE_CHANGED=NO
```

Changed document only:

```text
docs/planning/KODAC_KDO_H4_R4B_PHASE_B_AG1A_APP_SOURCE_IMPLEMENTATION_AUTHORIZATION_2026-08-22.md
```

Before merge require:

```text
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If `main` moves, reconcile before merge.

---

## 38. Post-canonical next safe action

If and only if this predecessor becomes canonical, the next safe action is a **new, separately executed AG1-A source implementation slice** that:

```text
1. re-verifies Kodac canonical main and this authorization merge;
2. verifies TheHalfMoon/kodac-phase-b-gate does not already contain unrelated history;
3. creates exactly the authorized independent source repository;
4. implements exactly the authorized path/dependency surface;
5. runs only the authorized offline tests;
6. records exact source commit/tree/manifests/test evidence;
7. stops before GitHub App registration, secrets, deployment, PostgreSQL provisioning, reviewer qualification, or protected-main mutation.
```

AG1-B remains blocked until AG1-A source provenance and offline test evidence are independently reviewed and made canonical by a separate proof slice.
