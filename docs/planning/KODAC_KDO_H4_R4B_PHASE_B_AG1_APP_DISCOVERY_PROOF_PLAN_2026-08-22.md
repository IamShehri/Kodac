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

Maximum result if merged:

```text
PHASE_B_AG1_APP_DISCOVERY_PROOF_PLAN=CANONICAL
AG1_APP_REGISTRATION_DEPLOYMENT_AUTHORIZATION=ELIGIBLE_FOR_SEPARATE_PREDECESSOR
```

This document does **not** create or prove a GitHub App, installation, deployment, receipt store, protected-main configuration, or Phase-B gate.

---

## 2. Live repository facts and architecture

```text
REPOSITORY=TheHalfMoon/Kodac
REPOSITORY_ID=1297407563
OWNER_LOGIN=TheHalfMoon
OWNER_TYPE=User
VISIBILITY=public
DEFAULT_BRANCH=main

LAYER_A=GITHUB_SERVER_SIDE_PROTECTED_MAIN_BRANCH
LAYER_B=CANDIDATE_INDEPENDENT_GITHUB_APP_REQUIRED_CHECK
LAYER_C=CANDIDATE_INDEPENDENT_APPEND_ONLY_EVENT_RECEIPTS
MERGE_QUEUE_REQUIRED=NO
```

---

## 3. Primary-source discovery findings

Current GitHub primary documentation establishes:

```text
CREATE_CHECK_RUN -> Checks: write
issue_comment webhook -> Issues: read
pull_request webhook -> Pull requests: read
pull_request_review webhook -> Pull requests: read
List Pull Request Files -> Pull requests: read
```

GitHub's Checks API creates a check run for a specific commit SHA. The future protected-main configuration can require a status check by exact `context` and exact GitHub `app_id`; a same-named result from another source does not satisfy that binding.

Webhook ingress must validate `X-Hub-Signature-256` as HMAC-SHA256 over the exact raw payload bytes using constant-time comparison before JSON parsing or semantic trust.

Protected branches, strict required checks, conversation resolution, administrator enforcement, force-push prevention, and deletion prevention are available for the current public repository ownership model.

Primary references:

- https://docs.github.com/en/rest/checks/runs
- https://docs.github.com/en/rest/guides/using-the-rest-api-to-interact-with-checks
- https://docs.github.com/en/rest/pulls/pulls
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- https://docs.github.com/en/webhooks/webhook-events-and-payloads
- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/rest/branches/branch-protection

---

## 4. Candidate-independent App logical identity

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

A future App source repository may be created only by a separately authorized slice. This document does not create or claim an existing App source repository.

---

## 6. Exact least-privilege permission candidate

Canonical permission object:

```json
{"checks":"write","issues":"read","metadata":"read","pull_requests":"read"}
```

```text
APP_PERMISSION_SET_SHA256=867da13ffc15393d88f01623995bbf15fd66dd797be4c25861ad571f619c9576
```

Required:

```text
Checks=write
Issues=read
Metadata=read
Pull requests=read
```

Explicitly absent unless a later primary-source proof plus separate authorization requires expansion:

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

`Contents` permission is intentionally absent. GitHub documents List Pull Request Files as available with `Pull requests: read`; that API is sufficient for the v1 changed-path theorem.

If later implementation discovery proves a forbidden permission technically required, implementation must stop before App creation/permission expansion and obtain a new authorization.

---

## 7. Exact webhook event candidate

Canonical mandatory event set:

```json
["issue_comment","pull_request","pull_request_review"]
```

```text
APP_WEBHOOK_EVENT_SET_SHA256=7a2be823e0b4ab120e21fe47308e86c969b06f6937d95bdccde04c3aa5a5fc00
```

No other webhook event is authorized by this plan.

```text
merge_group=NOT_SUBSCRIBED
check_suite=NOT_SUBSCRIBED
check_run=NOT_SUBSCRIBED
pull_request_review_comment=NOT_SUBSCRIBED
pull_request_review_thread=NOT_SUBSCRIBED
push=NOT_SUBSCRIBED
workflow_run=NOT_SUBSCRIBED
```

Use:

- `pull_request`: create/recompute gate state for opened, reopened, synchronize, and ready-for-review transitions and reject stale head bindings.
- `issue_comment`: consume a strict founder-bootstrap `created` event and emit a receipt only when every founder predicate passes.
- `pull_request_review`: consume a future qualified review provider's submitted clean exact-head event and emit a receipt only when its strict provider adapter passes.

Protected-branch conversation resolution, not the App, remains authoritative for unresolved review conversations after a check succeeds.

---

## 8. Webhook ingress authentication and replay contract

Required ingress:

```text
X_GITHUB_EVENT=REQUIRED
X_GITHUB_DELIVERY=REQUIRED
X_HUB_SIGNATURE_256=REQUIRED
INSTALLATION_ID_IN_PAYLOAD=REQUIRED
REPOSITORY_ID_IN_PAYLOAD=REQUIRED
```

Verification order:

```text
1. capture exact raw HTTP body bytes
2. require X-Hub-Signature-256 syntax = sha256=<64 lowercase hex>
3. compute HMAC-SHA256(webhook_secret, raw_body_bytes)
4. constant-time compare expected vs supplied signature
5. reject mismatch before JSON parsing
6. compute RAW_PAYLOAD_SHA256 over exact raw bytes
7. parse JSON only after signature proof
8. require repository.id = 1297407563
9. require repository.full_name = TheHalfMoon/Kodac
10. require installation.id = exact configured installation id
11. process delivery deduplication and any receipt in one PostgreSQL transaction
```

Replay theorem:

```text
DELIVERY_GUID_DEDUPLICATION=REQUIRED
DUPLICATE_IDENTICAL_DELIVERY=IDEMPOTENT_NO_NEW_RECEIPT
DUPLICATE_GUID_DIFFERENT_PAYLOAD_SHA256=FATAL_SECURITY_ERROR
```

The transaction must implement **lookup/compare-or-insert**, not a blind `assert absent`:

```text
BEGIN
  lookup delivery_guid
  if present:
    require stored raw_payload_sha256 == current raw_payload_sha256
    otherwise FATAL_SECURITY_ERROR
    return idempotent outcome without inserting a second delivery or receipt
  if absent:
    validate event semantics
    construct receipt preimage when event is receipt-producing
    insert delivery marker
    insert receipt create-if-absent when applicable
    read back inserted bytes/digests
    verify exact equality
COMMIT
```

Any semantic, collision, or readback failure rolls back the whole transaction. Therefore a failed first attempt does not consume the delivery GUID without its corresponding receipt.

The webhook secret is deployment secret material and is forbidden from Kodac, CI logs, PR comments, fixtures, ChatGPT, and agent context.

---

## 9. GitHub authentication boundary

```text
APP_PRIVATE_KEY=EXTERNAL_DEPLOYMENT_SECRET_ONLY
APP_JWT=SHORT_LIVED_RUNTIME_VALUE
INSTALLATION_ACCESS_TOKEN=SHORT_LIVED_RUNTIME_VALUE
FOUNDER_PAT_USED_BY_APP=NO
OAUTH_USER_TOKEN_USED_BY_APP=NO
```

Any App private key, webhook secret, database credential/private key, or deployment credential is prohibited from this repository and from conversational/agent context.

---

## 10. Exact-head pull-request identity contract

Phase-B v1 supports only same-repository candidates:

```text
BASE_REPOSITORY_ID=1297407563
HEAD_REPOSITORY_ID=1297407563
BASE_REF=main
PR_STATE=open
PR_DRAFT=false
HEAD_SHA=<exact 40 lowercase hex commit>
FORK_HEAD_REPOSITORY=FAIL_CLOSED
```

Any head mutation invalidates old bindings:

```text
H -> H2
OLD_FOUNDER_RECEIPT_VALID_FOR_H2=NO
OLD_REVIEW_RECEIPT_VALID_FOR_H2=NO
OLD_PHASE_B_CHECK_VALID_FOR_H2=NO
```

---

## 11. Founder bootstrap receipt contract

Only a top-level pull-request `issue_comment` `created` event may produce the founder receipt.

Canonical founder identity:

```text
FOUNDER_LOGIN=TheHalfMoon
FOUNDER_USER_ID=285091250
```

The comment body must exactly match the separately canonical bootstrap grammar and bind:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<candidate head SHA>
TRUST_ROOT_ID_SHA256=<64 lowercase hex>
PUBLIC_KEY_SPKI_DER_SHA256=<64 lowercase hex>
ESTABLISHMENT_PREIMAGE_SHA256=<64 lowercase hex>
```

Receipt schema/domain:

```text
kodac-phase-b-founder-bootstrap-receipt-v1
```

Strict string fields only:

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

Unknown fields and duplicate JSON member names are forbidden.

```text
RECEIPT_PREIMAGE=
  UTF8("kodac-phase-b-founder-bootstrap-receipt-v1")
  || 0x00
  || UTF8(RFC8785_JCS(RECEIPT_OBJECT))
RECEIPT_SHA256=sha256(RECEIPT_PREIMAGE)
```

The exact preimage bytes are stored. Source-comment edits/deletion after receipt issuance do not retroactively revoke the event; founder stop semantics remain PR close or candidate-head mutation.

---

## 12. Independent review receipt contract

No review provider is admitted by this planning slice:

```text
REVIEWER_ALLOWLIST_STATUS=EMPTY
QUALIFIED_REVIEWER_PROVIDERS=0
```

Future admission requires proof of all:

```text
STABLE_GITHUB_ACTOR_IDENTITY=PASS
CLEAN_VERDICT_IS_DETERMINISTICALLY_PARSEABLE=PASS
CLEAN_EVENT_IS_PULL_REQUEST_REVIEW_SUBMITTED=PASS
REVIEW_EVENT_BINDS_EXACT_HEAD_COMMIT=PASS
MATERIAL_ACTIONABLE_FINDINGS_ALWAYS_CREATE_REVIEW_CONVERSATIONS=PASS
TOP_LEVEL_ONLY_MATERIAL_FINDINGS=0
ADVERSARIAL_FALSE_CLEAN_CASES=PASS
```

A provider whose clean verdict exists only as an `issue_comment`, or whose material findings may exist only in an editable top-level summary, is not qualified for Phase-B v1.

Future receipt schema/domain:

```text
kodac-phase-b-independent-review-receipt-v1
```

Strict string fields:

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

Use the same strict RFC8785 JCS + domain + NUL + bytes + SHA-256 construction.

---

## 13. Concrete append-only receipt store selection

AG-1 selects:

```text
STORE_ENGINE_FAMILY=PostgreSQL
STORE_MINIMUM_MAJOR_VERSION=16
STORE_LOCATION=EXTERNAL_TO_TheHalfMoon/Kodac
STORE_DATABASE_LOGICAL_NAME=kodac_phase_b_gate
STORE_SCHEMA_LOGICAL_NAME=phase_b
```

No database is provisioned by this PR.

Future App runtime database principal:

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

DDL ownership belongs to a separate administrative migration principal never available to the running App. The runtime principal must not own the database, schema, tables, or triggers.

Delivery table:

```text
phase_b.webhook_deliveries

delivery_guid PRIMARY KEY
received_at_utc
x_github_event
action
raw_payload_sha256
repository_id
installation_id
```

Receipt table:

```text
phase_b.receipts

receipt_sha256 PRIMARY KEY
receipt_type
repository_id
pull_request_number
candidate_head_sha
source_event_key UNIQUE
receipt_preimage_bytes
receipt_created_at_utc
```

`receipt_sha256` must equal SHA-256 of exact `receipt_preimage_bytes`.

Collision theorem:

```text
SAME_RECEIPT_SHA256_SAME_BYTES=IDEMPOTENT
SAME_RECEIPT_SHA256_DIFFERENT_BYTES=FATAL_SECURITY_ERROR
SAME_SOURCE_EVENT_KEY_DIFFERENT_RECEIPT=FATAL_SECURITY_ERROR
```

Defense in depth: owner-controlled schema triggers should reject UPDATE/DELETE even if grants are accidentally widened. The authoritative runtime boundary is still privilege separation. Database superuser/infrastructure-admin compromise remains in the separately trusted external administrative control plane.

---

## 14. Receipt-store deployment proof fields

Before becoming authoritative, evidence must bind:

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

Required future source proof:

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

Source repository creation and implementation are not authorized here.

---

## 16. Deployment provenance model

```text
APP_BUILD_ARTIFACT_TYPE=OCI_IMAGE_OR_EQUIVALENT_IMMUTABLE_ARTIFACT
APP_BUILD_ARTIFACT_DIGEST=<immutable digest>
APP_DEPLOYMENT_PLATFORM=<exact provider/runtime>
APP_DEPLOYMENT_PROJECT_ID=<stable identity>
APP_DEPLOYMENT_REVISION_ID=<immutable revision>
APP_DEPLOYMENT_ARTIFACT_DIGEST_MATCH=PASS
APP_DEPLOYMENT_ENVIRONMENT_CONTRACT_SHA256=<non-secret config digest>
APP_SECRET_IDENTIFIERS_SHA256=<names/identities only, never values>
```

A mutable `latest` tag without immutable digest proof is insufficient.

---

## 17. Fail-closed check state machine

For each relevant exact PR head `H`, the App must create/recompute a check named exactly:

```text
kodac/phase-b-gate
```

Only these terminal conclusions are permitted for authority semantics:

```text
SUCCESS=success
FAILURE=failure
NEUTRAL=FORBIDDEN
SKIPPED=FORBIDDEN
```

`neutral` and `skipped` are forbidden because GitHub can treat them as satisfying required status checks.

Evaluation inputs include:

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

Success requires:

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

Any missing, malformed, stale, conflicting, or unverifiable input produces failure.

---

## 18. Establishment changed-path theorem

The future trust-root establishment candidate remains exactly limited to:

```text
provenance/kdo-h4-r4b-founder-process-authority-trust-root-v1.json
packages/kodac-runtime/test/helpers/kdo-h4-r4b-founder-process-authority-verifier.ts
packages/kodac-runtime/test/kdo-h4-r4b-founder-process-authority-trust-root.test.ts
docs/planning/KODAC_KDO_H4_R4B_FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_2026-08-21.md
```

The App must reject qualification if any other path changes. No candidate-side config can widen this allowlist.

---

## 19. Reviewer allowlist object

Initial planning state:

```text
REVIEWER_ALLOWLIST=[]
REVIEWER_ALLOWLIST_SHA256=<established later from exact canonical bytes>
```

Each future provider entry binds at least:

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

No provider is admitted because it happened to review earlier Kodac PRs.

---

## 20. Required later implementation test matrix

```text
valid webhook signature -> ACCEPT
missing/wrong signature -> REJECT
duplicate delivery same body -> IDEMPOTENT
duplicate delivery different body -> FATAL
wrong repository/install id -> REJECT
fork head -> REJECT
head changed -> old receipts invalid
founder wrong login/user/body/head -> no receipt
founder valid exact body -> immutable receipt
source comment edited/deleted after receipt -> receipt unchanged
unqualified reviewer -> no review receipt
review bound old head -> no review receipt
top-level-only clean provider -> not qualified
top-level-only material finding provider -> not qualified
missing/wrong receipt -> check failure
wrong changed path -> check failure
same-name check wrong App -> protected-main rejection in AG-4
runtime DB UPDATE/DELETE/TRUNCATE/DDL -> denied
transaction failure -> no delivery marker and no receipt
neutral/skipped conclusion -> forbidden
```

---

## 21. Required future registration/deployment proof

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

An App with an empty reviewer allowlist may be used for isolated testing but cannot become the required merge-authoritative source for real establishment.

---

## 22. Ordering after this planning slice

```text
AG1-A = separate authorization for App source repository + implementation + tests
AG1-B = separate authorization for App registration / external deployment / receipt-store provisioning / installation
AG1-C = qualify at least one reviewer provider and freeze reviewer allowlist
AG2   = protected-main configuration proof binding kodac/phase-b-gate to exact app_id
AG4   = sacrificial qualification PR proving complete server-side behavior
REAL TRUST-ROOT ESTABLISHMENT = only after AG1/AG2/AG4 canonical proof
```

No step implicitly authorizes the next.

---

## 23. Founder ceremony preservation

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

If `main` moves, reconcile before merge.

---

## 26. Post-canonical maximum claim

If canonical:

```text
PHASE_B_AG1_APP_DISCOVERY_PROOF_PLAN=CANONICAL
```

Still:

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

The next safe slice is AG1-A authorization for separate App source repository / implementation / tests. It is not App registration, deployment, protected-main mutation, or trust-root establishment.