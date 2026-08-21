# KODAC KDO H4-R4B Phase-B AG-1 App Discovery / Proof Plan

Date: 2026-08-22
Status: AG1_DISCOVERY_PROOF_PLAN_CANDIDATE / DOCS_ONLY / NO_APP_CREATION / NO_APP_INSTALLATION / NO_APP_SECRET / NO_RECEIPT_STORE_PROVISIONING / NO_BRANCH_PROTECTION_MUTATION / NO_RULESET_MUTATION / NO_WORKFLOW_MUTATION / NO_TRUST_ROOT_ESTABLISHMENT

## 1. Purpose

Define the exact discovery/proof contract for the candidate-independent GitHub App and append-only receipt store required by the repaired personal-repository Phase-B architecture before any GitHub App is created, installed, deployed, or made merge-authoritative.

Canonical predecessor:

```text
CANONICAL_MAIN=10804a4d5a96f5d5fde43f7e9270478bf0b8c351
CANONICAL_MAIN_TREE=2a05ffedcba1072571b6ffb460a88ae2b493c51c
PR_148=MERGED_CANONICAL
PHASE_B_PERSONAL_REPOSITORY_CAPABILITY_REPAIR=CANONICAL
PHASE_B_SERVER_SIDE_ATOMIC_GATE_ARCHITECTURE=REPAIRED_FOR_CURRENT_REPOSITORY
AG1_DISCOVERY_PROOF_PLANNING=AUTHORIZED_TO_START
```

Maximum result of this planning slice if merged:

```text
PHASE_B_AG1_APP_DISCOVERY_PROOF_PLAN=CANONICAL
AG1_APP_REGISTRATION_DEPLOYMENT_AUTHORIZATION=ELIGIBLE_FOR_SEPARATE_PREDECESSOR
```

It does **not** create or prove a GitHub App, installation, deployment, receipt store, protected-main configuration, or Phase-B gate.

---

## 2. Live repository facts

Current repository identity:

```text
REPOSITORY=TheHalfMoon/Kodac
REPOSITORY_ID=1297407563
OWNER_LOGIN=TheHalfMoon
OWNER_TYPE=User
VISIBILITY=public
DEFAULT_BRANCH=main
```

The current Phase-B architecture therefore remains the PR #148 personal-public-repository design:

```text
LAYER_A=GITHUB_SERVER_SIDE_PROTECTED_MAIN_BRANCH
LAYER_B=CANDIDATE_INDEPENDENT_GITHUB_APP_REQUIRED_CHECK
LAYER_C=CANDIDATE_INDEPENDENT_APPEND_ONLY_EVENT_RECEIPTS
MERGE_QUEUE_REQUIRED=NO
```

---

## 3. Primary-source discovery findings

Current GitHub primary documentation establishes the following load-bearing facts.

### 3.1 Check runs

GitHub's Checks API can create check runs for a specific commit SHA. Write access to check runs requires repository permission:

```text
Checks=write
```

The required Phase-B check remains:

```text
CHECK_NAME=kodac/phase-b-gate
CHECK_TARGET=EXACT_PR_HEAD_SHA
```

The future protected-main configuration must require this check with the exact GitHub App ID as the expected source, not `any source`.

### 3.2 Webhook permissions

GitHub documents:

```text
issue_comment -> Issues repository permission: read
pull_request -> Pull requests repository permission: read
pull_request_review -> Pull requests repository permission: read
```

No merge-group event is required by the current architecture.

### 3.3 Webhook authenticity

GitHub documents `X-Hub-Signature-256` as HMAC-SHA256 over the webhook payload using the configured webhook secret.

The App must validate the signature over the **raw request body before JSON parsing or semantic trust** and must use constant-time comparison.

### 3.4 Protected-main exact source binding

GitHub branch protection allows a required status check to bind both:

```text
context=<required check name>
app_id=<exact GitHub App ID>
```

A same-named result from another user, workflow, App, or integration does not satisfy the expected-source requirement.

### 3.5 Protected-main availability

Protected branches, strict required checks, conversation resolution, administrator enforcement, force-push prevention, and deletion prevention are available for the current public repository ownership model.

Primary references:

- https://docs.github.com/en/rest/checks/runs
- https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-checks
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- https://docs.github.com/en/webhooks/webhook-events-and-payloads
- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/rest/branches/branch-protection

---

## 4. Candidate-independent App logical identity

The future App is a dedicated Phase-B authority component, not a Kodac runtime feature.

Logical identity:

```text
APP_LOGICAL_NAME=Kodac Phase-B Gate
APP_LOGICAL_ID=kodac-phase-b-gate-v1
APP_OWNER_REQUIRED=TheHalfMoon
APP_INSTALLATION_SCOPE=TheHalfMoon/Kodac_ONLY
APP_PUBLIC_INSTALLABILITY=FORBIDDEN_FOR_V1
APP_USER_AUTHORIZATION_FLOW=NOT_REQUIRED
APP_OAUTH_USER_TOKEN_USE=FORBIDDEN
```

The actual GitHub-assigned identity does not exist yet and must not be fabricated.

A later registration/deployment proof must bind:

```text
APP_GITHUB_ID=<assigned integer>
APP_CLIENT_ID=<assigned public client id, if present>
APP_SLUG=<actual assigned slug>
APP_OWNER_LOGIN=TheHalfMoon
APP_INSTALLATION_ID=<exact installation id>
APP_INSTALLATION_REPOSITORY_ID=1297407563
APP_INSTALLATION_REPOSITORY=TheHalfMoon/Kodac
```

The App must be installed on exactly the Kodac repository for Phase-B v1. Any broader installation is a qualification failure unless separately authorized.

---

## 5. Candidate-independence boundary

The App implementation, deployment, secrets, and receipt storage must remain outside the establishment candidate and outside the Kodac repository.

Required:

```text
APP_SOURCE_REPOSITORY_IS_KODAC=NO
APP_SOURCE_CONTROLLED_BY_ESTABLISHMENT_CANDIDATE=NO
APP_DEPLOYMENT_CONTROLLED_BY_ESTABLISHMENT_CANDIDATE=NO
APP_RECEIPT_STORE_CONTROLLED_BY_ESTABLISHMENT_CANDIDATE=NO
APP_CREDENTIALS_IN_KODAC_REPOSITORY=0
APP_CREDENTIALS_IN_KODAC_ACTIONS=0
APP_CREDENTIALS_IN_PR_COMMENTS=0
APP_CREDENTIALS_IN_CHAT_OR_AGENT_CONTEXT=0
```

A future App source repository may be created only by a separately authorized slice. This document does not create or name an existing repository as though it already existed.

---

## 6. Exact least-privilege permission candidate

The exact AG-1 permission candidate is:

```json
{"checks":"write","issues":"read","metadata":"read","pull_requests":"read"}
```

Canonical UTF-8 bytes of that sorted object have:

```text
APP_PERMISSION_SET_SHA256=867da13ffc15393d88f01623995bbf15fd66dd797be4c25861ad571f619c9576
```

Required permission theorem:

```text
Checks=write
Issues=read
Metadata=read
Pull requests=read
```

Explicitly forbidden in v1 unless a later primary-source proof and separate authorization justify them:

```text
Actions=NONE
Administration=NONE
Commit statuses=NONE
Contents=NONE
Deployments=NONE
Environments=NONE
Members=NONE
Merge queues=NONE
Packages=NONE
Repository hooks=NONE
Secrets=NONE
Workflows=NONE
```

`Contents` permission is intentionally absent. The App may use Pull Request metadata / changed-file APIs under `Pull requests: read` for path and head binding; it must not gain repository-content write authority.

If implementation discovery later proves a listed forbidden permission is technically required, AG-1 must stop and obtain a new authorization before App creation or permission expansion.

---

## 7. Exact webhook event candidate

The exact mandatory event set is:

```json
["issue_comment","pull_request","pull_request_review"]
```

Its canonical UTF-8 bytes have:

```text
APP_WEBHOOK_EVENT_SET_SHA256=7a2be823e0b4ab120e21fe47308e86c969b06f6937d95bdccde04c3aa5a5fc00
```

No other webhook event is authorized by this plan.

Specifically:

```text
merge_group=NOT_SUBSCRIBED
check_suite=NOT_SUBSCRIBED
check_run=NOT_SUBSCRIBED
pull_request_review_comment=NOT_SUBSCRIBED
pull_request_review_thread=NOT_SUBSCRIBED
push=NOT_SUBSCRIBED
workflow_run=NOT_SUBSCRIBED
```

The App can create/recompute `kodac/phase-b-gate` from the three mandatory events:

- `pull_request`: establish/recompute state for opened, reopened, synchronize, and ready-for-review transitions; reject stale head bindings.
- `issue_comment`: consume an exact founder bootstrap event on a pull request and emit an immutable founder receipt if and only if the strict bootstrap parser passes.
- `pull_request_review`: consume a future qualified provider's clean exact-head review event and emit an immutable independent-review receipt if and only if the strict provider adapter passes.

GitHub's protected-branch conversation-resolution control, not the App, remains authoritative for unresolved review conversations after a check succeeds.

---

## 8. Webhook ingress authentication and replay contract

Every webhook must fail closed unless all ingress checks pass.

Required headers/state:

```text
X_GITHUB_EVENT=REQUIRED
X_GITHUB_DELIVERY=REQUIRED
X_HUB_SIGNATURE_256=REQUIRED
INSTALLATION_ID_IN_PAYLOAD=REQUIRED
REPOSITORY_ID_IN_PAYLOAD=REQUIRED
```

Required verification order:

```text
1. capture exact raw HTTP request body bytes
2. require X-Hub-Signature-256 syntax = sha256=<64 lowercase hex>
3. compute HMAC-SHA256(webhook_secret, raw_body_bytes)
4. constant-time compare expected signature to supplied signature
5. reject on mismatch before JSON parsing
6. compute RAW_PAYLOAD_SHA256 over exact raw bytes
7. parse JSON only after signature verification
8. require repository.id = 1297407563
9. require repository.full_name = TheHalfMoon/Kodac
10. require installation.id = exact configured App installation id
11. require X-GitHub-Delivery to be a valid unseen delivery identifier
12. process delivery + any generated receipt in one database transaction
```

Replay theorem:

```text
DELIVERY_GUID_DEDUPLICATION=REQUIRED
DUPLICATE_IDENTICAL_DELIVERY=IDEMPOTENT_NO_NEW_RECEIPT
DUPLICATE_GUID_DIFFERENT_PAYLOAD_SHA256=FATAL_SECURITY_ERROR
```

The webhook secret is deployment secret material. It must never be written to Kodac, CI logs, PR comments, test fixtures, ChatGPT, or agent context.

---

## 9. GitHub authentication boundary

The future deployment must authenticate as the GitHub App / installation, not as a founder PAT or OAuth user.

Required:

```text
APP_PRIVATE_KEY=EXTERNAL_DEPLOYMENT_SECRET_ONLY
APP_JWT=SHORT_LIVED_RUNTIME_VALUE
INSTALLATION_ACCESS_TOKEN=SHORT_LIVED_RUNTIME_VALUE
FOUNDER_PAT_USED_BY_APP=NO
OAUTH_USER_TOKEN_USED_BY_APP=NO
```

Any GitHub App private key, webhook secret, database password/certificate private key, or deployment credential is prohibited from this repository and from conversational/agent context.

---

## 10. Exact-head pull-request identity contract

The Phase-B v1 gate supports only same-repository candidate branches.

Required candidate identity:

```text
BASE_REPOSITORY_ID=1297407563
HEAD_REPOSITORY_ID=1297407563
BASE_REF=main
PR_STATE=open
PR_DRAFT=false
HEAD_SHA=<exact 40 lowercase hex commit>
```

Fork-origin establishment candidates are forbidden in v1:

```text
FORK_HEAD_REPOSITORY=FAIL_CLOSED
```

This avoids ambiguous fork check-suite behavior and ensures the required check is created in the canonical repository for an exact locally reachable head SHA.

Any candidate head mutation invalidates prior receipt/head bindings:

```text
H -> H2
OLD_FOUNDER_RECEIPT_VALID_FOR_H2=NO
OLD_REVIEW_RECEIPT_VALID_FOR_H2=NO
OLD_PHASE_B_CHECK_VALID_FOR_H2=NO
```

---

## 11. Founder bootstrap receipt contract

The App must accept only a top-level pull-request `issue_comment` **created** event authored by the canonical founder identity.

Required founder identity:

```text
FOUNDER_LOGIN=TheHalfMoon
FOUNDER_USER_ID=285091250
```

The source comment body must match the separately canonical trust-root bootstrap grammar exactly and bind:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<candidate head SHA>
TRUST_ROOT_ID_SHA256=<64 lowercase hex>
PUBLIC_KEY_SPKI_DER_SHA256=<64 lowercase hex>
ESTABLISHMENT_PREIMAGE_SHA256=<64 lowercase hex>
```

The receipt schema version is:

```text
kodac-phase-b-founder-bootstrap-receipt-v1
```

The canonical receipt object must contain only string fields:

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

Unknown fields and duplicate JSON member names are forbidden. Canonicalization is RFC 8785 JCS over the strict object.

Receipt digest:

```text
RECEIPT_DOMAIN=kodac-phase-b-founder-bootstrap-receipt-v1
RECEIPT_PREIMAGE=UTF8(RECEIPT_DOMAIN) || 0x00 || UTF8(RFC8785_JCS(RECEIPT_OBJECT))
RECEIPT_SHA256=sha256(RECEIPT_PREIMAGE)
```

The exact `RECEIPT_PREIMAGE` bytes, not only a parsed JSON object, are stored.

After receipt issuance, later edit/deletion of the source comment is not retroactive revocation. Founder stop semantics remain PR close or candidate-head mutation, per canonical PR #148.

---

## 12. Independent review receipt contract

No reviewer provider is admitted by this planning slice.

```text
REVIEWER_ALLOWLIST_STATUS=EMPTY
QUALIFIED_REVIEWER_PROVIDERS=0
```

A future provider may be added only after evidence proves all of:

```text
STABLE_GITHUB_ACTOR_IDENTITY=PASS
CLEAN_VERDICT_IS_DETERMINISTICALLY_PARSEABLE=PASS
CLEAN_EVENT_IS_PULL_REQUEST_REVIEW_SUBMITTED=PASS
REVIEW_EVENT_BINDS_EXACT_HEAD_COMMIT=PASS
MATERIAL_ACTIONABLE_FINDINGS_ALWAYS_CREATE_REVIEW_CONVERSATIONS=PASS
TOP_LEVEL_ONLY_MATERIAL_FINDINGS=0
ADVERSARIAL_FALSE_CLEAN_CASES=PASS
```

A provider whose clean verdict exists only as an `issue_comment`, or whose material findings may exist only in an editable top-level summary, is **not qualified** for Phase-B v1.

This deliberately prevents current ad-hoc review bots from becoming merge authority merely because they have been useful in earlier non-atomic review cycles.

Future independent-review receipt schema version:

```text
kodac-phase-b-independent-review-receipt-v1
```

Required strict string fields:

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

Receipt domain:

```text
kodac-phase-b-independent-review-receipt-v1
```

The same strict JCS + domain + NUL + bytes + SHA-256 construction is required.

---

## 13. Concrete append-only receipt store selection

AG-1 selects the following storage architecture for future implementation proof:

```text
STORE_ENGINE_FAMILY=PostgreSQL
STORE_MINIMUM_MAJOR_VERSION=16
STORE_LOCATION=EXTERNAL_TO_TheHalfMoon/Kodac
STORE_DATABASE_LOGICAL_NAME=kodac_phase_b_gate
STORE_SCHEMA_LOGICAL_NAME=phase_b
```

No database is provisioned by this PR.

The future runtime database principal must have exactly the application-level capabilities required for append-only operation:

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

DDL ownership belongs to a separate administrative migration principal that is never available to the running App process.

The App runtime principal must not own the database, schema, tables, or triggers.

### 13.1 Delivery table

Logical table:

```text
phase_b.webhook_deliveries
```

Required immutable fields include:

```text
delivery_guid PRIMARY KEY
received_at_utc
x_github_event
action
raw_payload_sha256
repository_id
installation_id
```

### 13.2 Receipt table

Logical table:

```text
phase_b.receipts
```

Required immutable fields include:

```text
receipt_sha256 PRIMARY KEY
receipt_type
repository_id
pull_request_number
candidate_head_sha
source_event_key UNIQUE
receipt_preimage_bytes
receipt_created_at_utc
```

`receipt_sha256` must equal SHA-256 of `receipt_preimage_bytes`.

### 13.3 Atomic transaction requirement

Webhook deduplication and receipt creation must occur in one PostgreSQL transaction.

For a receipt-producing event:

```text
BEGIN
  assert delivery_guid absent
  insert webhook delivery marker
  validate semantic event
  construct exact canonical receipt preimage bytes
  compute receipt_sha256
  insert receipt using create-if-absent semantics
  read receipt back in same transaction
  verify stored bytes and digest
COMMIT
```

Any validation failure or storage collision rolls back the whole transaction.

This avoids the crash window where a delivery GUID becomes consumed without its corresponding receipt.

### 13.4 Storage collision theorem

```text
SAME_RECEIPT_SHA256_SAME_BYTES=IDEMPOTENT
SAME_RECEIPT_SHA256_DIFFERENT_BYTES=FATAL_SECURITY_ERROR
SAME_SOURCE_EVENT_KEY_DIFFERENT_RECEIPT=FATAL_SECURITY_ERROR
```

### 13.5 Defense in depth

The future database schema should include owner-controlled triggers that reject UPDATE/DELETE operations on receipt/delivery tables even if runtime grants are accidentally widened.

The authoritative runtime boundary remains privilege separation: the App runtime role itself must not possess mutation privileges beyond INSERT.

Database superuser / infrastructure-administrator compromise remains inside the separately trusted external administrative control plane, consistent with the canonical Phase-B threat model.

---

## 14. Receipt-store deployment proof fields

Before the store can become authoritative, evidence must bind at least:

```text
STORE_ENGINE_EXACT_VERSION
STORE_CLUSTER_OR_SERVICE_IDENTITY
STORE_ENDPOINT_IDENTITY
STORE_DATABASE_NAME
STORE_SCHEMA_NAME
STORE_MIGRATION_SOURCE_PROVENANCE
STORE_MIGRATION_EXACT_REVISION
STORE_SCHEMA_SHA256
STORE_RUNTIME_ROLE_IDENTITY
STORE_RUNTIME_ROLE_GRANTS_SHA256
STORE_RUNTIME_ROLE_OWNS_DATABASE=NO
STORE_RUNTIME_ROLE_OWNS_SCHEMA=NO
STORE_RUNTIME_ROLE_OWNS_TABLES=NO
STORE_TLS_REQUIRED=YES
STORE_UPDATE_PROBE=DENIED
STORE_DELETE_PROBE=DENIED
STORE_TRUNCATE_PROBE=DENIED
STORE_DDL_PROBE=DENIED
STORE_INSERT_READBACK_PROBE=PASS
STORE_TRANSACTION_ROLLBACK_PROBE=PASS
STORE_DUPLICATE_DELIVERY_PROBE=PASS
STORE_CONFLICTING_BYTES_PROBE=PASS
```

No secret values appear in evidence.

---

## 15. App source provenance model

Before App registration/deployment is accepted, the implementation must be pinned to candidate-independent source.

Required source proof fields:

```text
APP_SOURCE_REPOSITORY=<separate repository, not TheHalfMoon/Kodac>
APP_SOURCE_REPOSITORY_ID=<stable GitHub id>
APP_SOURCE_EXACT_COMMIT=<40 lowercase hex>
APP_SOURCE_EXACT_TREE=<40 lowercase hex>
APP_SOURCE_CHANGED_PATHS=<bounded implementation set>
APP_RUNTIME_MANIFEST_SHA256
APP_LOCKFILE_SHA256
APP_BUILD_RECIPE_SHA256
APP_TEST_EVIDENCE_SHA256
```

Source repository creation and source implementation are not authorized by this planning PR.

---

## 16. Deployment provenance model

The future deployment must be immutable-addressed rather than merely named `latest`.

Required deployment proof fields:

```text
APP_BUILD_ARTIFACT_TYPE=OCI_IMAGE_OR_EQUIVALENT_IMMUTABLE_ARTIFACT
APP_BUILD_ARTIFACT_DIGEST=<immutable digest>
APP_DEPLOYMENT_PLATFORM=<exact provider/runtime>
APP_DEPLOYMENT_PROJECT_ID=<stable identity>
APP_DEPLOYMENT_REVISION_ID=<immutable revision>
APP_DEPLOYMENT_ARTIFACT_DIGEST_MATCH=PASS
APP_DEPLOYMENT_ENVIRONMENT_CONTRACT_SHA256=<non-secret config contract digest>
APP_SECRET_IDENTIFIERS_SHA256=<names/identities only, never values>
```

A mutable tag without immutable digest proof is insufficient.

---

## 17. Fail-closed check state machine

For every relevant pull-request head `H`, the App must ensure a check run named exactly:

```text
kodac/phase-b-gate
```

exists from the exact App source.

Allowed conclusions for merge authority are intentionally narrow:

```text
SUCCESS=success
FAILURE=failure
```

The App must not use `neutral` or `skipped` as a successful gate result because GitHub can treat those conclusions as satisfying required checks.

Evaluation inputs must include:

```text
repository_id
installation_id
pull_request_number
base_ref
head_repository_id
head_sha
changed_path_set
founder_receipt_sha256
independent_review_receipt_sha256
reviewer_allowlist_sha256
app_source_revision
app_deployment_identity
permission_set_sha256
event_set_sha256
```

Success requires all of:

```text
REPOSITORY_BINDING=PASS
INSTALLATION_BINDING=PASS
SAME_REPOSITORY_HEAD=PASS
BASE_REF_MAIN=PASS
HEAD_SHA_CURRENT=PASS
ESTABLISHMENT_CHANGED_PATH_ALLOWLIST=PASS
FOUNDER_RECEIPT_PRESENT=PASS
FOUNDER_RECEIPT_BYTES_DIGEST=PASS
FOUNDER_RECEIPT_HEAD_BINDING=PASS
INDEPENDENT_REVIEW_RECEIPT_PRESENT=PASS
INDEPENDENT_REVIEW_RECEIPT_BYTES_DIGEST=PASS
INDEPENDENT_REVIEW_RECEIPT_HEAD_BINDING=PASS
REVIEWER_PROVIDER_CURRENTLY_ALLOWLISTED=PASS
APP_IDENTITY_SELF_BINDING=PASS
```

Missing, malformed, stale, conflicting, or unverifiable input produces `failure`, never success by default.

---

## 18. Establishment changed-path theorem

The future real trust-root establishment candidate remains constrained to the canonical four-path allowlist already authorized:

```text
provenance/kdo-h4-r4b-founder-process-authority-trust-root-v1.json
packages/kodac-runtime/test/helpers/kdo-h4-r4b-founder-process-authority-verifier.ts
packages/kodac-runtime/test/kdo-h4-r4b-founder-process-authority-trust-root.test.ts
docs/planning/KODAC_KDO_H4_R4B_FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_2026-08-21.md
```

The Phase-B App must reject establishment qualification if the candidate changes any other path.

The App itself is not allowed to interpret an unauthorized candidate-side configuration file to widen this allowlist.

---

## 19. Reviewer allowlist object

The future reviewer allowlist must be candidate-independent, strict, and content-addressed.

Initial planning state:

```text
REVIEWER_ALLOWLIST=[]
REVIEWER_ALLOWLIST_SHA256=<digest established by later implementation evidence>
```

Each future admitted provider entry must bind at least:

```text
providerId
reviewerLogin
reviewerUserId
cleanEventType
cleanEventState
adapterVersion
materialFindingConversationContractVersion
qualificationEvidenceIdentity
```

No provider is admitted merely because it reviewed previous Kodac PRs successfully.

---

## 20. Required AG-1 implementation test matrix

A later separately authorized App implementation must prove, without using the real trust-root establishment PR as the first test, at least:

```text
valid GitHub webhook signature -> ACCEPT
missing signature -> REJECT
wrong signature -> REJECT
same delivery GUID same body -> IDEMPOTENT
same delivery GUID different body -> FATAL
wrong repository id -> REJECT
wrong repository name -> REJECT
wrong installation id -> REJECT
fork head -> REJECT
head changed -> old receipts invalid
founder wrong login -> no receipt
founder wrong user id -> no receipt
founder malformed body -> no receipt
founder wrong head -> no receipt
founder valid exact body -> immutable receipt
source comment edited after receipt -> receipt unchanged
source comment deleted after receipt -> receipt unchanged
unqualified review provider -> no receipt
review bound to old head -> no receipt
provider top-level-only clean signal -> not qualified
provider top-level-only material finding behavior -> not qualified
missing founder receipt -> check failure
missing review receipt -> check failure
wrong receipt digest -> check failure
wrong changed path -> check failure
same-name check from wrong App -> protected-main rejection in AG-4
runtime DB UPDATE -> denied
runtime DB DELETE -> denied
runtime DB TRUNCATE -> denied
runtime DB DDL -> denied
transaction failure -> no delivery marker and no receipt
neutral conclusion -> forbidden by implementation tests
skipped conclusion -> forbidden by implementation tests
```

---

## 21. Required future App-registration proof

A future registration/deployment authorization must not claim success until it can prove:

```text
APP_GITHUB_ID=KNOWN
APP_SLUG=KNOWN
APP_OWNER_LOGIN=TheHalfMoon
APP_PERMISSION_SET_SHA256=867da13ffc15393d88f01623995bbf15fd66dd797be4c25861ad571f619c9576
APP_WEBHOOK_EVENT_SET_SHA256=7a2be823e0b4ab120e21fe47308e86c969b06f6937d95bdccde04c3aa5a5fc00
APP_INSTALLATION_ID=KNOWN
APP_INSTALLATION_REPOSITORY_COUNT=1
APP_INSTALLATION_REPOSITORY_ID=1297407563
APP_SOURCE_PROVENANCE=PROVEN
APP_DEPLOYMENT_PROVENANCE=PROVEN
APP_WEBHOOK_SIGNATURE_PROOF=PASS
APP_DELIVERY_DEDUP_PROOF=PASS
APP_CHECK_CREATION_EXACT_HEAD_PROOF=PASS
RECEIPT_STORE_APPEND_ONLY_RUNTIME_PROOF=PASS
REVIEWER_ALLOWLIST=NONEMPTY_AND_QUALIFIED
```

If reviewer qualification remains empty, the Phase-B App may exist for testing but cannot become the required merge-authoritative source for real establishment.

---

## 22. Ordering after this planning slice

If this document becomes canonical, the safe ordering is:

```text
AG1-A = separate authorization for App source repository + implementation + tests
AG1-B = separate authorization for App registration / external deployment / receipt-store provisioning / installation
AG1-C = qualification of at least one reviewer provider and freeze reviewer allowlist
AG2   = protected-main configuration proof binding kodac/phase-b-gate to exact app_id
AG4   = sacrificial qualification PR proving complete server-side behavior
REAL TRUST-ROOT ESTABLISHMENT = only after AG1/AG2/AG4 canonical proof
```

No step is implicitly authorized by completion of the prior step.

---

## 23. Founder ceremony preservation

This planning work changes none of the already signed founder preimages.

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

---

## 24. Explicit non-grants

```text
GITHUB_APP_CREATION=NO
GITHUB_APP_REGISTRATION=NO
GITHUB_APP_INSTALLATION=NO
GITHUB_APP_PRIVATE_KEY_GENERATION=NO
GITHUB_APP_PRIVATE_KEY_ACCESS=NO
WEBHOOK_SECRET_GENERATION=NO
WEBHOOK_SECRET_ACCESS=NO
APP_SOURCE_REPOSITORY_CREATION=NO
APP_SOURCE_IMPLEMENTATION=NO
APP_DEPLOYMENT=NO
RECEIPT_STORE_PROVISIONING=NO
RECEIPT_STORE_CREDENTIAL_CREATION=NO
RECEIPT_STORE_CREDENTIAL_ACCESS=NO
RULESET_MUTATION=NO
BRANCH_PROTECTION_MUTATION=NO
WORKFLOW_MUTATION=NO
TRUST_ROOT_ESTABLISHMENT_IMPLEMENTATION=NO
TRUST_ROOT_BOOTSTRAP_COMMENT=NOT_YET
TRUST_ROOT_KEY_GENERATION=NO
TRUST_ROOT_PRIVATE_KEY_ACCESS=NO
TRUST_ROOT_SIGNING=NO
CURRENT_SESSION_PROCESS_AUTHORITY=NOT_GRANTED
OFFLINE_ARTIFACT_BUILD_EXECUTION=NO
OFFLINE_ARTIFACT_TEST_EXECUTION=NO
OFFLINE_ARTIFACT_PACKAGE_EXECUTION=NO
DOCKER_EXECUTION=NO
RUNSC_EXECUTION=NO
GVISOR_EXECUTION=NO
WORKLOAD_EXECUTION=NO
B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED
R3G_F_E4=NO
H4_COMPLETE=NO
```

---

## 25. AG-1 planning PR merge gate

This docs-only plan may merge only if:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
NATIVE_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
APP_MUTATIONS=0
APP_SECRET_ACCESS=0
RECEIPT_STORE_MUTATIONS=0
RULESET_MUTATIONS=0
BRANCH_PROTECTION_MUTATIONS=0
TRUST_ROOT_PREIMAGE_CHANGED=NO
NONCE_DISPOSITION_PREIMAGE_CHANGED=NO
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If `main` moves, this candidate must be reconciled before merge.

---

## 26. Post-canonical maximum claim

If this document becomes canonical, the maximum claim is:

```text
PHASE_B_AG1_APP_DISCOVERY_PROOF_PLAN=CANONICAL
```

The state remains:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE=NOT_PROVEN
GITHUB_APP=NOT_CREATED
GITHUB_APP_INSTALLATION=NOT_CREATED
RECEIPT_STORE=NOT_PROVISIONED
REVIEWER_ALLOWLIST=EMPTY
PROTECTED_MAIN_PHASE_B_CONFIGURATION=NOT_APPLIED
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT=BLOCKED
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

The next safe slice is AG1-A authorization for the separate App source repository / implementation / tests. It is not App registration, deployment, protected-main mutation, or trust-root establishment.