# KODAC KDO H4-R4B Phase-B AG1-B — App Registration / Deployment / Receipt-Store Authorization

Date: 2026-08-22
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — NO APP CREATION — NO GCP RESOURCE CREATION — NO SECRETS — NO DEPLOYMENT — NO INSTALLATION**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Authorize one later, separately executed AG1-B slice for the candidate-independent Phase-B GitHub App to:

1. add an exact OCI packaging recipe to the already-qualified App source repository;
2. register the GitHub App with the frozen least-privilege permission/event contract;
3. provision one dedicated external deployment control plane and append-only receipt store;
4. build and publish one immutable container image from the exact reviewed source;
5. deploy the App on an immutable Cloud Run revision;
6. install the App on exactly `TheHalfMoon/Kodac`;
7. record non-secret registration/deployment/store identities and privilege probes for a later proof slice.

This predecessor performs none of those mutations.

Canonical predecessor:

```text
KODAC_CANONICAL_MAIN=4cfbaa5b0e2c15f2861136dc3d81403c19dfbe1d
KODAC_CANONICAL_TREE=2ff2873ece9b9c430fc0335b26d4aea37b3421bd
PR_152=MERGED_CANONICAL
PHASE_B_AG1A_SOURCE_PROVENANCE_PROOF=CANONICAL

APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_REPOSITORY_ID=1342309131
APP_SOURCE_REVIEWED_EXACT_HEAD=c6fd6a5c4a8b31041da40739b64edc2f2f2a641e
APP_SOURCE_REVIEWED_EXACT_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
APP_SOURCE_CANONICAL_MERGE=79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40
APP_SOURCE_CANONICAL_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
```

AG1-C, AG2, trust-root establishment, B1-v2, B2A-v2, B2B, and H4 completion remain outside this authorization.

---

## 2. Maximum result if this predecessor becomes canonical

Only the following may become true:

```text
PHASE_B_AG1B_APP_REGISTRATION_DEPLOYMENT_AUTHORIZATION=CANONICAL
AG1B_FUTURE_PACKAGING_AMENDMENT=AUTHORIZED_TO_START_SEPARATELY
AG1B_FUTURE_GITHUB_APP_REGISTRATION=AUTHORIZED_TO_START_SEPARATELY
AG1B_FUTURE_EXTERNAL_CONTROL_PLANE_PROVISIONING=AUTHORIZED_TO_START_SEPARATELY
AG1B_FUTURE_RECEIPT_STORE_PROVISIONING=AUTHORIZED_TO_START_SEPARATELY
AG1B_FUTURE_IMMUTABLE_BUILD=AUTHORIZED_TO_START_SEPARATELY
AG1B_FUTURE_CLOUD_RUN_DEPLOYMENT=AUTHORIZED_TO_START_SEPARATELY
AG1B_FUTURE_KODAC_ONLY_INSTALLATION=AUTHORIZED_TO_START_SEPARATELY
AG1B_FUTURE_NONSECRET_DEPLOYMENT_PROOF_CAPTURE=AUTHORIZED_TO_START_SEPARATELY
```

Still false after merge of this predecessor:

```text
GITHUB_APP_CREATED=NO
GITHUB_APP_REGISTERED=NO
GITHUB_APP_INSTALLED=NO
APP_PRIVATE_KEY_EXISTS_BY_THIS_SLICE=NO
WEBHOOK_SECRET_EXISTS_BY_THIS_SLICE=NO
GCP_PROJECT_CREATED_BY_THIS_SLICE=NO
ARTIFACT_REGISTRY_CREATED_BY_THIS_SLICE=NO
CLOUD_RUN_SERVICE_CREATED_BY_THIS_SLICE=NO
CLOUD_SQL_INSTANCE_CREATED_BY_THIS_SLICE=NO
APP_DEPLOYED=NO
RECEIPT_STORE_PROVISIONED=NO
APP_WEBHOOK_ACTIVE=NO
REVIEWER_ALLOWLIST=[]
QUALIFIED_REVIEWER_PROVIDERS=0
AG1C=BLOCKED
AG2=BLOCKED
TRUST_ROOT_ESTABLISHMENT=BLOCKED
B1_V2/B2A_V2/B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
```

No billable Google Cloud resource may be created merely because this authorization merges. A later AG1-B execution must receive an explicit founder go-ahead after its exact preflight reports the intended project, region, resource classes, and expected cost-bearing resources.

---

## 3. Selected external control plane

AG1-B selects this provider/runtime family:

```text
CLOUD_PROVIDER=Google Cloud
DEPLOYMENT_RUNTIME=Cloud Run service
CONTAINER_REGISTRY=Artifact Registry Docker repository
SECRET_STORE=Secret Manager
RECEIPT_STORE=Cloud SQL for PostgreSQL
POSTGRESQL_MAJOR_VERSION=16
DEPLOYMENT_REGION=me-central2
```

The App runtime, registry, and database must be colocated in `me-central2` unless a later explicit authorization changes region.

Current primary-source discovery confirms that Cloud Run accepts image references by exact digest and creates immutable revisions; Cloud SQL supports PostgreSQL 16; `me-central2` is currently available for both Cloud Run and Cloud SQL.

Primary references:

- https://cloud.google.com/run/docs/deploying
- https://cloud.google.com/artifact-registry/docs/integrate-cloud-run
- https://cloud.google.com/sql/docs/db-versions
- https://cloud.google.com/sql/docs/postgres/region-availability-overview
- https://cloud.google.com/run/docs/setup

---

## 4. Dedicated-project boundary

AG1-B requires one dedicated Google Cloud project for this gate.

```text
GCP_PROJECT_PURPOSE=kodac-phase-b-gate-v1-only
GCP_PROJECT_ID=<assigned during separately authorized execution>
GCP_PROJECT_NUMBER=<assigned by Google Cloud>
GCP_REGION=me-central2
UNRELATED_WORKLOADS_IN_PROJECT=FORBIDDEN
KODAC_ACTIONS_CREDENTIAL_ACCESS=NO
KODAC_REPOSITORY_SECRET_ACCESS=NO
AGENT_CONTEXT_CLOUD_CREDENTIAL_ACCESS=NO
```

If no dedicated project with billing capability is available, execution must stop before any billable resource creation.

The project ID and project number are non-secret identities and must be captured in proof. OAuth tokens, refresh tokens, service-account private keys, billing identifiers, and user credentials must never enter Kodac, PR comments, logs, ChatGPT, or agent context.

---

## 5. Exact logical GCP resource names

Future AG1-B execution must use these logical names unless provider collision forces a stop and replacement authorization:

```text
ARTIFACT_REGISTRY_REPOSITORY=kodac-phase-b-gate
CLOUD_RUN_SERVICE=kodac-phase-b-gate
CLOUD_SQL_INSTANCE=kodac-phase-b-gate-pg16
CLOUD_SQL_DATABASE=kodac_phase_b_gate
CLOUD_SQL_SCHEMA=phase_b
CLOUD_RUN_SERVICE_ACCOUNT=kodac-phase-b-gate-runtime
DB_RUNTIME_ROLE=kodac_phase_b_gate_runtime_role
DB_RUNTIME_USER=kodac_phase_b_gate_runtime
DB_MIGRATION_ROLE=kodac_phase_b_gate_migrator
```

No GCP resource may be named or configured so that an establishment PR in `TheHalfMoon/Kodac` can mutate it through repository-controlled CI.

---

## 6. AG1-B source-repository packaging amendment

The AG1-A application logic is frozen. AG1-B may add exactly two packaging-source paths to `TheHalfMoon/kodac-phase-b-gate`:

```text
build/Containerfile
build/container-recipe.json
```

No existing Go source, test, migration, module, lockfile, receipt vector, or AG1-A build recipe may change in this packaging amendment.

The amendment must prove:

```text
APP_LOGIC_BLOB_SET_CHANGED=NO
GO_MOD_CHANGED=NO
GO_SUM_CHANGED=NO
MIGRATION_CHANGED=NO
AG1A_TEST_VECTOR_CHANGED=NO
NEW_SOURCE_PATHS=2
```

`build/Containerfile` must be purpose-equivalent to:

```Dockerfile
FROM gcr.io/distroless/static-debian12:nonroot@sha256:<EXACT_PINNED_DIGEST>
COPY --chown=nonroot:nonroot phase-b-gate /phase-b-gate
USER nonroot:nonroot
ENTRYPOINT ["/phase-b-gate"]
```

The distroless base digest must be resolved and frozen before the packaging commit is created. Mutable tags without an exact digest are forbidden.

`build/container-recipe.json` must bind at least:

```text
schemaVersion
baseImageReference
baseImageDigest
applicationBinaryPath
containerBinaryPath
containerUser
entrypoint
expectedPort=8080
sourceBuildRecipeSha256
```

No shell, package manager, curl, apt, apk, runtime compiler, generated-code download, or package installation step is allowed in the container recipe.

The packaging amendment must receive its own exact-head review before any artifact is built.

---

## 7. Exact build boundary

The production binary must be built from the exact packaging-reviewed source revision using the already canonical source build contract:

```text
GOOS=linux
GOARCH=amd64
CGO_ENABLED=0
go build -trimpath -buildvcs=true -mod=readonly -o phase-b-gate ./cmd/phase-b-gate
```

Required execution evidence:

```text
APP_PACKAGING_EXACT_COMMIT
APP_PACKAGING_EXACT_TREE
APP_BUILD_GO_VERSION=go1.26.6
APP_BUILD_BINARY_SHA256
APP_BUILD_BINARY_SIZE_BYTES
APP_CONTAINERFILE_SHA256
APP_CONTAINER_RECIPE_SHA256
BASE_IMAGE_EXACT_REFERENCE
BASE_IMAGE_DIGEST
APP_BUILD_IMAGE_DIGEST
```

The OCI image must be pushed to the dedicated Artifact Registry repository and later deployed to Cloud Run by exact digest, not by mutable tag.

No GitHub Actions workflow is authorized to build or deploy this image in AG1-B.

---

## 8. Cloud Run deployment contract

The deployment must be a Cloud Run service in `me-central2` and must bind the exact image digest.

Required properties:

```text
CLOUD_RUN_INGRESS=all
CLOUD_RUN_PUBLIC_INVOKE=YES
PUBLIC_ACCESS_REASON=GitHub webhook delivery cannot use Google IAM authentication
APPLICATION_AUTHORITY=HMAC_SHA256_WEBHOOK_AUTHENTICATION
CLOUD_RUN_PORT=8080
CLOUD_RUN_MIN_INSTANCES=0
CLOUD_RUN_MAX_INSTANCES=3
CLOUD_RUN_CONCURRENCY=20
CLOUD_RUN_REQUEST_TIMEOUT_SECONDS=30
```

Public invocation does not grant Phase-B authority. Only a request that passes the source-defined exact raw-body HMAC, repository identity, installation identity, event/action, receipt, and gate predicates can influence a check result.

Every deployment must record:

```text
APP_DEPLOYMENT_PLATFORM=Google Cloud Run
APP_DEPLOYMENT_PROJECT_ID
APP_DEPLOYMENT_PROJECT_NUMBER
APP_DEPLOYMENT_REGION=me-central2
APP_DEPLOYMENT_SERVICE_NAME=kodac-phase-b-gate
APP_DEPLOYMENT_REVISION_ID
APP_DEPLOYMENT_URL
APP_DEPLOYMENT_IMAGE_DIGEST
APP_DEPLOYMENT_ARTIFACT_DIGEST_MATCH=PASS
APP_DEPLOYMENT_ENVIRONMENT_CONTRACT_SHA256
```

A mutable `latest` tag is not evidence.

---

## 9. Runtime service-account boundary

The Cloud Run service must use a dedicated service account:

```text
kodac-phase-b-gate-runtime@<PROJECT_ID>.iam.gserviceaccount.com
```

The runtime service account may receive only the minimum Google Cloud permissions needed for:

```text
Cloud SQL Client
Secret Manager Secret Accessor on the exact AG1-B secrets
Artifact Registry read as required by Cloud Run platform/service-agent mechanics
```

It must not receive Project Owner, Editor, IAM Admin, Secret Manager Admin, Cloud SQL Admin, Artifact Registry Admin, Cloud Run Admin, Service Account Token Creator, or billing roles.

Deployment/admin principals remain outside runtime identity and must not be stored in the service.

---

## 10. Secret Manager boundary

Real deployment secret values become permissible only inside the later AG1-B execution and only in the external secret control plane.

Required secrets:

```text
APP_PRIVATE_KEY_PEM
WEBHOOK_SECRET
DATABASE_DSN
```

Secret values are forbidden from:

```text
TheHalfMoon/Kodac
TheHalfMoon/kodac-phase-b-gate
GitHub Actions secrets for Kodac
GitHub PR comments/reviews/issues
terminal transcript copied into chat
agent/model context
proof documents
application logs
Cloud Run ordinary environment-variable listings outside Secret Manager references
```

Cloud Run must reference exact Secret Manager secret **versions**, not `latest`, for the authoritative deployment revision.

Proof may record only:

```text
SECRET_RESOURCE_NAME
SECRET_VERSION_NUMBER
SECRET_VERSION_RESOURCE_ID
SECRET_VERSION_CREATED_AT
```

Never record secret payloads or secret hashes derived from low-entropy credentials.

Primary reference:

- https://cloud.google.com/run/docs/configuring/services/secrets

---

## 11. GitHub App registration contract

The future GitHub App must be registered under the personal account owner `TheHalfMoon`.

```text
APP_LOGICAL_NAME=Kodac Phase-B Gate
APP_LOGICAL_ID=kodac-phase-b-gate-v1
APP_OWNER_LOGIN=TheHalfMoon
APP_INSTALLABILITY=Only on this account
USER_AUTHORIZATION_FLOW=DISABLED
OAUTH_USER_TOKENS=FORBIDDEN
DEVICE_FLOW=DISABLED
```

Exact repository permissions:

```json
{"checks":"write","issues":"read","metadata":"read","pull_requests":"read"}
```

```text
APP_PERMISSION_SET_SHA256=867da13ffc15393d88f01623995bbf15fd66dd797be4c25861ad571f619c9576
```

No other repository, organization, or account permission is authorized.

Exact subscribed event set:

```json
["issue_comment","pull_request","pull_request_review"]
```

```text
APP_WEBHOOK_EVENT_SET_SHA256=7a2be823e0b4ab120e21fe47308e86c969b06f6937d95bdccde04c3aa5a5fc00
```

No additional event is authorized.

Registration may be performed with the webhook inactive. GitHub documents that an App can be registered for `Only on this account`, and its webhook can be deactivated/activated independently.

Primary references:

- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
- https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app
- https://docs.github.com/en/apps/maintaining-github-apps/modifying-a-github-app-registration

---

## 12. GitHub App private-key handling

A real GitHub App private key may be generated only during AG1-B execution after the assigned `APP_GITHUB_ID` exists.

The private key must:

1. be generated/downloaded through GitHub's App settings by the founder;
2. be transferred directly into the dedicated Secret Manager secret;
3. never be pasted into chat, a PR, a repository file, or a command transcript returned for review;
4. be removed from any temporary local plaintext file after successful Secret Manager import and verification;
5. never be included in proof, even hashed.

If secure direct import cannot be completed without exposing the key to agent/model context, execution must stop.

---

## 13. Webhook-secret lifecycle

The webhook secret must be independently generated with cryptographic randomness during AG1-B execution and stored directly in Secret Manager.

It must not be derived from a repository value, App ID, installation ID, password, founder identity, timestamp, UUID alone, or any deterministic/public value.

The value may be entered into GitHub App settings by the founder but must never be sent to this assistant.

The authoritative deployment and GitHub App settings must reference/use the same secret value, but proof records only secret resource/version identities, never the value or digest.

---

## 14. Installation boundary

The App may be installed only on the account that owns it and only with repository selection:

```text
INSTALLATION_ACCOUNT=TheHalfMoon
REPOSITORY_SELECTION=Only select repositories
SELECTED_REPOSITORIES=[TheHalfMoon/Kodac]
```

Required proof:

```text
APP_GITHUB_ID=<assigned positive integer>
APP_CLIENT_ID=<assigned public identifier if present>
APP_SLUG=<actual assigned slug>
APP_INSTALLATION_ID=<assigned positive integer>
APP_INSTALLATION_ACCOUNT=TheHalfMoon
APP_INSTALLATION_REPOSITORY_ID=1297407563
APP_INSTALLATION_REPOSITORY=TheHalfMoon/Kodac
APP_INSTALLATION_REPOSITORY_COUNT=1
```

Installation on `TheHalfMoon/kodac-phase-b-gate` is not required and must not be added merely because it is the App source repository.

---

## 15. Webhook activation boundary

AG1-B must finish with:

```text
APP_WEBHOOK_ACTIVE=NO
```

Reason: `REVIEWER_ALLOWLIST=[]` and `QUALIFIED_REVIEWER_PROVIDERS=0` remain canonical until AG1-C. The App must not begin unsolicited production event processing merely because it has been registered/deployed/installed.

AG1-B may preconfigure the exact event subscriptions, deployment URL, and secret binding if GitHub permits those values while inactive. If a brief activation is technically required to save webhook configuration, no repository event may be intentionally triggered and the webhook must be returned to inactive state before AG1-B proof is accepted.

Persistent activation requires a later explicit authorization after the required downstream prerequisites are satisfied.

---

## 16. Cloud SQL PostgreSQL contract

AG1-B selects Cloud SQL PostgreSQL major version 16 in `me-central2`.

The exact managed minor version must be captured from the created instance:

```text
STORE_ENGINE_FAMILY=PostgreSQL
STORE_ENGINE_MAJOR=16
STORE_ENGINE_EXACT_VERSION=<provider-assigned exact version>
STORE_CLUSTER_OR_SERVICE_IDENTITY=<Cloud SQL instance connection name>
STORE_DATABASE_NAME=kodac_phase_b_gate
STORE_SCHEMA_NAME=phase_b
```

The App runtime connects through the Cloud Run / Cloud SQL Auth Proxy integration using the instance Unix socket. Google documents that this path is automatically encrypted; the local PostgreSQL socket may use `sslmode=disable` because TLS is supplied by the Auth Proxy transport layer.

Required proof:

```text
STORE_TRANSPORT=Cloud SQL Auth Proxy via Cloud Run Unix socket
STORE_TRANSPORT_ENCRYPTION=PASS
STORE_TLS_REQUIRED=YES
STORE_PUBLIC_AUTHORIZED_NETWORKS=0
```

Primary references:

- https://cloud.google.com/sql/docs/postgres/connect-instance-cloud-run
- https://cloud.google.com/sql/docs/postgres/connect-auth-proxy

---

## 17. Database ownership and privilege separation

The migration/administrative identity and runtime identity must be different.

The migration identity may create the database/schema/tables/triggers required by the canonical migration.

The running App identity must satisfy exactly:

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

The runtime role/user must not own:

```text
DATABASE
SCHEMA
TABLES
TRIGGERS
FUNCTIONS
```

When creating a Cloud SQL built-in PostgreSQL runtime user, the execution must avoid the default `cloudsqlsuperuser` grant by assigning the pre-created custom runtime role during user creation or by proving equivalent least-privilege state before runtime use.

Primary references:

- https://cloud.google.com/sql/docs/postgres/create-manage-users
- https://cloud.google.com/sql/docs/postgres/users

---

## 18. Exact migration boundary

Only the migration source already canonical in the App repository may be executed:

```text
migrations/0001_phase_b.sql
```

The execution must bind:

```text
STORE_MIGRATION_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
STORE_MIGRATION_SOURCE_REVISION=<exact AG1-B packaging-reviewed revision>
STORE_MIGRATION_FILE_SHA256=<exact hash>
STORE_SCHEMA_SHA256=<normalized schema proof hash>
```

No ad-hoc DDL outside this migration and the minimum role/database bootstrap statements is authorized.

Role/database bootstrap statements must be captured as sanitized, non-secret evidence and must not weaken the runtime privilege theorem.

---

## 19. Required live store probes

Before AG1-B can be proven complete, run non-production synthetic probes against the provisioned store and record non-secret outcomes:

```text
STORE_UPDATE_PROBE=DENIED
STORE_DELETE_PROBE=DENIED
STORE_TRUNCATE_PROBE=DENIED
STORE_DDL_PROBE=DENIED
STORE_INSERT_READBACK_PROBE=PASS
STORE_TRANSACTION_ROLLBACK_PROBE=PASS
STORE_DUPLICATE_DELIVERY_PROBE=PASS
STORE_CONFLICTING_BYTES_PROBE=PASS
STORE_RUNTIME_ROLE_OWNS_DATABASE=NO
STORE_RUNTIME_ROLE_OWNS_SCHEMA=NO
STORE_RUNTIME_ROLE_OWNS_TABLES=NO
```

Probe rows must use obviously synthetic delivery/receipt identities and may be retained only if needed to prove append-only behavior; otherwise use a dedicated transaction and rollback where compatible with the theorem.

No Kodac trust-root candidate artifact or real founder receipt is used in AG1-B store probes.

---

## 20. Deployment health proof

AG1-B may call only the service liveness endpoint for public deployment proof:

```text
GET /healthz
```

Expected result:

```text
HTTP 200
BODY=ok
```

`/healthz` proves only process liveness. It does not prove GitHub authentication, reviewer qualification, gate success, trust-root establishment, or protected-main readiness.

AG1-B must not intentionally trigger a real `kodac/phase-b-gate` Check Run on a Kodac PR. End-to-end webhook/check qualification remains a later controlled proof stage.

---

## 21. Registration/deployment proof fields

A later AG1-B proof slice must bind at least:

```text
APP_GITHUB_ID
APP_CLIENT_ID_IF_PRESENT
APP_SLUG
APP_OWNER_LOGIN
APP_PERMISSION_SET_SHA256
APP_WEBHOOK_EVENT_SET_SHA256
APP_WEBHOOK_ACTIVE
APP_INSTALLATION_ID
APP_INSTALLATION_ACCOUNT
APP_INSTALLATION_REPOSITORY_ID
APP_INSTALLATION_REPOSITORY
APP_INSTALLATION_REPOSITORY_COUNT

APP_PACKAGING_EXACT_COMMIT
APP_PACKAGING_EXACT_TREE
APP_BUILD_BINARY_SHA256
APP_BUILD_IMAGE_DIGEST
BASE_IMAGE_EXACT_REFERENCE
BASE_IMAGE_DIGEST

GCP_PROJECT_ID
GCP_PROJECT_NUMBER
APP_DEPLOYMENT_PLATFORM
APP_DEPLOYMENT_REGION
APP_DEPLOYMENT_SERVICE_NAME
APP_DEPLOYMENT_REVISION_ID
APP_DEPLOYMENT_URL
APP_DEPLOYMENT_IMAGE_DIGEST
APP_DEPLOYMENT_ARTIFACT_DIGEST_MATCH
APP_DEPLOYMENT_ENVIRONMENT_CONTRACT_SHA256

STORE_ENGINE_EXACT_VERSION
STORE_CLUSTER_OR_SERVICE_IDENTITY
STORE_DATABASE_NAME
STORE_SCHEMA_NAME
STORE_MIGRATION_SOURCE_PROVENANCE
STORE_MIGRATION_EXACT_REVISION
STORE_SCHEMA_SHA256
STORE_RUNTIME_ROLE_IDENTITY
STORE_RUNTIME_ROLE_GRANTS_SHA256
STORE_RUNTIME_ROLE_OWNS_DATABASE
STORE_RUNTIME_ROLE_OWNS_SCHEMA
STORE_RUNTIME_ROLE_OWNS_TABLES
STORE_TLS_REQUIRED
STORE_UPDATE_PROBE
STORE_DELETE_PROBE
STORE_TRUNCATE_PROBE
STORE_DDL_PROBE
STORE_INSERT_READBACK_PROBE
STORE_TRANSACTION_ROLLBACK_PROBE
STORE_DUPLICATE_DELIVERY_PROBE
STORE_CONFLICTING_BYTES_PROBE
```

No proof field may contain a credential, private key, webhook secret, database password, App JWT, installation token, Google OAuth token, or service-account private key.

---

## 22. AG1-B execution ordering

The later execution must be fail-closed and ordered:

```text
B0  verify live Kodac + App-source canonical truth
B1  verify founder-controlled Google Cloud access and report cost-bearing resources
B2  obtain explicit founder approval for billable resource creation
B3  resolve/freeze distroless base image digest
B4  create + independently review the 2-path packaging amendment
B5  create/verify dedicated GCP project and required APIs
B6  provision Artifact Registry, service account, Secret Manager resources, Cloud SQL
B7  create database/schema/admin/runtime roles and run canonical migration
B8  register GitHub App with exact permissions/events, webhook inactive
B9  generate/import App private key + webhook secret directly into Secret Manager
B10 install App on exactly TheHalfMoon/Kodac while webhook remains inactive
B11 build exact linux/amd64 binary and immutable OCI image
B12 push image and capture registry digest
B13 deploy Cloud Run by exact digest + exact secret versions
B14 prove /healthz and exact deployment/image identity
B15 run database privilege/append-only probes
B16 capture sanitized registration/deployment/store evidence
B17 stop with webhook inactive and AG1-C/AG2 still blocked
```

If any step fails, do not compensate by widening permissions, adding repositories, enabling workflows, using PAT/OAuth user tokens, exposing secrets, changing source logic, bypassing exact digests, or granting database admin rights to the runtime.

---

## 23. Explicit non-grants

This authorization does not permit:

```text
AG1-C reviewer-provider qualification
reviewer allowlist population
protected-main required-check mutation
branch protection mutation
ruleset mutation
Kodac workflow mutation
GitHub Actions deployment
GitHub Actions secret storage for App credentials
App installation on additional repositories
public App installability
OAuth user authorization
founder PAT use by App
real founder bootstrap receipt creation
real independent-review receipt creation
real trust-root establishment
sacrificial AG4 qualification PR
B1-v2
B2A-v2
B2B
H4 completion
Chroma Foundation trust/runtime/build/test/secret/database/App-credential role
```

No later step is implicitly authorized by successful AG1-B execution.

---

## 24. Predecessor verdict

Current candidate result:

```text
AG1A=CANONICAL
AG1B_AUTHORIZATION_CANDIDATE=READY_FOR_EXACT_HEAD_REVIEW
AG1B_EXECUTION=NOT_STARTED
GITHUB_APP_CREATED=NO
GCP_RESOURCES_CREATED=NO
REAL_SECRETS_ACCESSED=NO
APP_DEPLOYED=NO
APP_INSTALLED=NO
AG1C=BLOCKED
AG2=BLOCKED
TRUST_ROOT_ESTABLISHMENT=BLOCKED
H4_COMPLETE=NO
```

If and only if this exact authorization is reviewed and merged canonically, a separate AG1-B execution may start from the canonical merge. It must still stop before any billable resource creation until the founder explicitly approves the reported resources/cost-bearing operations.
