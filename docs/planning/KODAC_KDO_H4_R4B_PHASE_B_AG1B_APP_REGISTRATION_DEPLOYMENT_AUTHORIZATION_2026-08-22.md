# KODAC KDO H4-R4B Phase-B AG1-B — App Registration / Deployment / Receipt-Store Authorization

Date: 2026-08-22
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — NO APP CREATION — NO GCP RESOURCE CREATION — NO SECRETS — NO DEPLOYMENT — NO INSTALLATION**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Authorize one later, separately executed AG1-B slice for the candidate-independent Phase-B GitHub App to:

1. add an exact OCI packaging recipe to the already-qualified App source repository;
2. register the GitHub App with the frozen least-privilege permission/event contract;
3. provision one dedicated external deployment control plane and append-only receipt store;
4. build and publish one immutable `linux/amd64` container image from the exact reviewed source;
5. deploy the App on an immutable Cloud Run revision bound to the exact image, runtime identity, Cloud SQL instance, and numeric Secret Manager versions;
6. install the App on exactly `TheHalfMoon/Kodac` while the webhook remains inactive;
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

No billable Google Cloud resource may be created merely because this authorization merges. A later AG1-B execution must first report the intended Google Cloud project, region, machine/storage classes, availability choice, and other cost-bearing resources, then obtain a separate explicit founder go-ahead before any cost-bearing creation.

---

## 3. Selected external control plane

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

Primary references:

- https://cloud.google.com/run/docs/deploying
- https://cloud.google.com/run/docs/container-contract
- https://cloud.google.com/artifact-registry/docs/integrate-cloud-run
- https://cloud.google.com/sql/docs/db-versions
- https://cloud.google.com/sql/docs/postgres/region-availability-overview
- https://cloud.google.com/run/docs/configuring/services/secrets

---

## 4. Dedicated-project boundary

AG1-B requires one dedicated Google Cloud project:

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

The project ID and project number are non-secret identities. OAuth tokens, refresh tokens, service-account private keys, billing identifiers, and user credentials must never enter Kodac, PR comments, logs, ChatGPT, or agent/model context.

---

## 5. Exact logical resource identities

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

No GCP resource may be configured so that an establishment PR in `TheHalfMoon/Kodac` can mutate it through repository-controlled CI.

---

## 6. AG1-B source-repository packaging amendment

The AG1-A application logic is frozen. AG1-B may add exactly:

```text
build/Containerfile
build/container-recipe.json
```

No existing Go source, test, migration, module, lockfile, receipt vector, or `build/recipe.json` may change.

Required proof:

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
FROM --platform=linux/amd64 gcr.io/distroless/static-debian12:nonroot@sha256:<EXACT_PINNED_DIGEST>
COPY --chown=65532:65532 phase-b-gate /phase-b-gate
USER 65532:65532
ENTRYPOINT ["/phase-b-gate"]
```

The distroless digest must be independently resolved and frozen before the packaging commit. Mutable base-image tags without the exact digest are forbidden.

`build/container-recipe.json` must bind at least:

```text
schemaVersion
baseImageReference
baseImageDigest
imagePlatform=linux/amd64
applicationBinaryPath
containerBinaryPath
containerUser=65532:65532
entrypoint
expectedPort=8080
sourceBuildRecipeSha256
```

No shell, package manager, curl, apt, apk, runtime compiler, generated-source download, or package-installation step is allowed.

The packaging amendment must receive its own exact-head independent review before any artifact is built.

---

## 7. Exact build and OCI platform boundary

The production binary must be built from the exact packaging-reviewed source revision:

```text
GOOS=linux
GOARCH=amd64
CGO_ENABLED=0
go build -trimpath -buildvcs=true -mod=readonly -o phase-b-gate ./cmd/phase-b-gate
```

The OCI build must explicitly target:

```text
APP_BUILD_IMAGE_PLATFORM=linux/amd64
```

Purpose-equivalent image builders must set `--platform=linux/amd64` or an exact equivalent. Before push/deploy, inspect the resulting image manifest/config and require:

```text
APP_BUILD_IMAGE_PLATFORM_VERIFIED=linux/amd64
APP_BUILD_IMAGE_PLATFORM_MATCH=PASS
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
APP_BUILD_IMAGE_PLATFORM=linux/amd64
APP_BUILD_IMAGE_PLATFORM_MATCH=PASS
```

Push to the dedicated Artifact Registry repository and deploy by exact digest, never by mutable tag. No GitHub Actions workflow is authorized to build or deploy the image in AG1-B.

---

## 8. Cloud Run deployment contract

The authoritative deployment is one Cloud Run service in `me-central2`.

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
CLOUD_RUN_CLOUD_SQL_INSTANCE_CONNECTION_NAME=<PROJECT_ID>:me-central2:kodac-phase-b-gate-pg16
```

Public invocation does not grant Phase-B authority. The application still requires its source-defined HMAC, repository, installation, event/action, receipt, and gate predicates.

The deployed revision must attach exactly the Cloud SQL instance identified by `CLOUD_RUN_CLOUD_SQL_INSTANCE_CONNECTION_NAME`, creating the `/cloudsql/<INSTANCE_CONNECTION_NAME>` socket used by `DATABASE_DSN`.

Required deployment proof:

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
APP_DEPLOYMENT_IMAGE_PLATFORM=linux/amd64
APP_DEPLOYMENT_IMAGE_PLATFORM_MATCH=PASS
CLOUD_RUN_CLOUD_SQL_INSTANCE_CONNECTION_NAME
CLOUD_RUN_CLOUD_SQL_ATTACHMENT_MATCH=PASS
APP_DEPLOYMENT_ENVIRONMENT_CONTRACT_SHA256
```

A mutable `latest` image tag is not evidence.

Primary references:

- https://cloud.google.com/run/docs/container-contract
- https://cloud.google.com/sql/docs/postgres/connect-instance-cloud-run

---

## 9. Runtime service-account and IAM boundary

The Cloud Run revision must execute as exactly:

```text
CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT=kodac-phase-b-gate-runtime@<PROJECT_ID>.iam.gserviceaccount.com
```

The application runtime identity may receive only:

```text
roles/cloudsql.client
roles/secretmanager.secretAccessor on exactly:
  APP_PRIVATE_KEY_PEM secret resource
  WEBHOOK_SECRET secret resource
  DATABASE_DSN secret resource
```

```text
RUNTIME_SERVICE_ACCOUNT_ARTIFACT_REGISTRY_ACCESS=NO
```

Artifact Registry image-pull authority belongs to the Google-managed Cloud Run service agent/platform identity, not to the application runtime service account. Cross-project registry/runtime wiring is forbidden in v1.

Forbidden runtime roles include Project Owner, Editor, IAM Admin, Secret Manager Admin, Cloud SQL Admin, Artifact Registry Reader/Admin, Cloud Run Admin, Service Account Token Creator, and billing roles.

Required proof:

```text
CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT
CLOUD_RUN_REVISION_SERVICE_ACCOUNT
CLOUD_RUN_REVISION_SERVICE_ACCOUNT_MATCH=PASS
GCP_PROJECT_PARENT_RESOURCE
GCP_RESOURCE_ANCESTRY_CANONICAL_SHA256
RUNTIME_PROJECT_IAM_POLICY_CANONICAL_SHA256
RUNTIME_PROJECT_IAM_REQUIRED_ROLE_SET=["roles/cloudsql.client"]
RUNTIME_PROJECT_IAM_EXCESS_ROLE_COUNT=0
RUNTIME_INHERITED_IAM_BINDINGS_CANONICAL_SHA256
RUNTIME_INHERITED_UNAUTHORIZED_BINDING_COUNT=0
RUNTIME_EFFECTIVE_PROJECT_ROLE_SET_SHA256
RUNTIME_EFFECTIVE_PROJECT_ROLE_SET_MATCH=PASS
SECRET_APP_PRIVATE_KEY_IAM_POLICY_SHA256
SECRET_WEBHOOK_SECRET_IAM_POLICY_SHA256
SECRET_DATABASE_DSN_IAM_POLICY_SHA256
RUNTIME_SECRET_ACCESS_BINDINGS_MATCH=PASS
RUNTIME_EFFECTIVE_IAM_VERIFICATION=PASS
RUNTIME_SERVICE_ACCOUNT_ARTIFACT_REGISTRY_ACCESS=NO
```

Proof must inspect the project policy, every organization/folder ancestor allow policy that can be inherited by the project, and each exact secret-resource policy. The effective role set for the runtime service account at project scope must contain no role beyond the authorized Cloud SQL role, and inherited ancestry must not grant additional access. The exact secret resources may additionally grant only the intended Secret Manager accessor binding. If ancestry cannot be enumerated with sufficient authority, or effective access cannot be proven, AG1-B fails closed. Deployment/admin principals and Google-managed service agents remain distinct from the runtime identity.

---

## 10. Secret Manager boundary and injection mode

Real deployment secrets become permissible only during the later AG1-B execution and only in Secret Manager:

```text
APP_PRIVATE_KEY_PEM
WEBHOOK_SECRET
DATABASE_DSN
```

Secret values are forbidden from both repositories, Kodac Actions secrets, PR comments/reviews/issues, transcripts copied into chat, model/agent context, proof documents, and application logs.

The source contract reads these values as environment variables. Therefore the authoritative Cloud Run revision must use:

```text
SECRET_INJECTION_MODE=environment_variables
SECRET_VOLUME_MOUNTS=FORBIDDEN_FOR_V1
SECRET_VERSION_ALIAS_LATEST=FORBIDDEN
```

Every environment-variable reference must bind a specific numeric Secret Manager version:

```text
APP_PRIVATE_KEY_PEM=<secret-resource>:<numeric-version>
WEBHOOK_SECRET=<secret-resource>:<numeric-version>
DATABASE_DSN=<secret-resource>:<numeric-version>
```

Proof may record only:

```text
SECRET_ENV_NAME
SECRET_RESOURCE_NAME
SECRET_VERSION_NUMBER
SECRET_VERSION_RESOURCE_ID
SECRET_VERSION_CREATED_AT
SECRET_INJECTION_MODE=environment_variables
SECRET_NUMERIC_VERSION_PINNED=PASS
```

Never record secret payloads or hashes derived from secret values.

Primary reference:

- https://cloud.google.com/run/docs/configuring/services/secrets

---

## 11. GitHub App registration contract

Register under the personal account owner `TheHalfMoon`:

```text
APP_LOGICAL_NAME=Kodac Phase-B Gate
APP_LOGICAL_ID=kodac-phase-b-gate-v1
APP_OWNER_LOGIN=TheHalfMoon
APP_VISIBILITY=private
APP_INSTALLABILITY=Only on this account
USER_AUTHORIZATION_FLOW=DISABLED
OAUTH_USER_TOKENS=FORBIDDEN
DEVICE_FLOW=DISABLED
APP_WEBHOOK_ACTIVE=NO
```

`APP_VISIBILITY=private` here means GitHub's owner-only installation mode; public/`Any account` installability is forbidden.

Exact repository permissions:

```json
{"checks":"write","issues":"read","metadata":"read","pull_requests":"read"}
```

```text
APP_PERMISSION_SET_SHA256=867da13ffc15393d88f01623995bbf15fd66dd797be4c25861ad571f619c9576
```

Exact subscribed event set:

```json
["issue_comment","pull_request","pull_request_review"]
```

```text
APP_WEBHOOK_EVENT_SET_SHA256=7a2be823e0b4ab120e21fe47308e86c969b06f6937d95bdccde04c3aa5a5fc00
```

No additional repository, organization, account permission, or subscribed event is authorized.

Required registration-setting proof:

```text
APP_OWNER_LOGIN=TheHalfMoon
APP_VISIBILITY=private
APP_INSTALLABILITY=Only on this account
USER_AUTHORIZATION_FLOW=DISABLED
OAUTH_USER_TOKENS=FORBIDDEN
DEVICE_FLOW=DISABLED
APP_PERMISSION_SET_SHA256
APP_WEBHOOK_EVENT_SET_SHA256
APP_REGISTRATION_SETTINGS_MATCH=PASS
```

Any mismatch fails closed.

Primary references:

- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app
- https://docs.github.com/en/apps/sharing-github-apps/registering-a-github-app-using-url-parameters
- https://docs.github.com/en/apps/maintaining-github-apps/modifying-a-github-app-registration

---

## 12. GitHub App private-key handling

A real private key may be generated only after `APP_GITHUB_ID` exists.

It must:

1. be generated/downloaded through GitHub App settings by the founder;
2. be transferred directly into the dedicated Secret Manager resource/version;
3. never be pasted into chat, a PR, repository content, or a transcript returned for review;
4. be removed from any temporary local plaintext file after Secret Manager import is verified;
5. never be included in proof, even hashed.

If secure transfer cannot be completed without exposing the key to agent/model context, execution stops.

---

## 13. Webhook secret, URL, and binding boundary

Generate the webhook secret with cryptographic randomness during AG1-B and store it directly in Secret Manager. It must not be deterministically derived from public identities.

The value may be entered into GitHub App settings by the founder but must never be sent to this assistant.

AG1-B must keep the App webhook inactive at registration, throughout installation, and at completion. There is **no temporary activation exception** in AG1-B.

After the authoritative Cloud Run revision exists, configure the GitHub App webhook URL while it remains inactive:

```text
APP_WEBHOOK_URL=<APP_DEPLOYMENT_URL>/github/webhook
APP_WEBHOOK_URL_MATCH=PASS
```

The Cloud Run revision and GitHub App must be configured from the same founder-controlled webhook-secret value, but GitHub does not expose that value for independent readback. Therefore AG1-B must not claim a live equality proof:

```text
WEBHOOK_SECRET_BINDING_CONFIGURATION=FOUNDER_SINGLE_VALUE_DUAL_CONFIGURATION
WEBHOOK_SECRET_BINDING_PROBE=DEFERRED_BLOCKING_ACTIVATION
```

Any later authorization that would activate the webhook must first define and pass a controlled, non-secret proof of the GitHub-to-deployment HMAC binding. Until then:

```text
LATER_WEBHOOK_ACTIVATION_ALLOWED=NO
```

This preserves a fail-closed boundary without exposing or hashing the secret.

---

## 14. Installation boundary

Install only:

```text
INSTALLATION_ACCOUNT=TheHalfMoon
REPOSITORY_SELECTION=Only select repositories
SELECTED_REPOSITORIES=[TheHalfMoon/Kodac]
APP_WEBHOOK_ACTIVE_DURING_INSTALLATION=NO
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
APP_WEBHOOK_ACTIVE_DURING_INSTALLATION=NO
```

Do not install the App on `TheHalfMoon/kodac-phase-b-gate`.

---

## 15. Webhook activation terminal theorem

Throughout AG1-B:

```text
APP_WEBHOOK_ACTIVE=NO
```

Reason: `REVIEWER_ALLOWLIST=[]` and `QUALIFIED_REVIEWER_PROVIDERS=0` remain canonical until AG1-C, while AG2 and end-to-end qualification are also incomplete.

AG1-B may configure the exact event subscriptions, secret, and final deployment URL while the webhook is inactive. It must not activate the webhook for testing, saving settings, installation, or proof.

Persistent or temporary activation requires a later explicit authorization and remains blocked by the deferred secret-binding proof.

---

## 16. Cloud SQL PostgreSQL contract

AG1-B selects Cloud SQL PostgreSQL major version 16 in `me-central2`.

```text
STORE_ENGINE_FAMILY=PostgreSQL
STORE_ENGINE_MAJOR=16
STORE_ENGINE_EXACT_VERSION=<provider-assigned exact version>
STORE_CLUSTER_OR_SERVICE_IDENTITY=<PROJECT_ID>:me-central2:kodac-phase-b-gate-pg16
STORE_DATABASE_NAME=kodac_phase_b_gate
STORE_SCHEMA_NAME=phase_b
```

The App runtime connects through the Cloud Run / Cloud SQL integration using the Unix socket:

```text
/cloudsql/<STORE_CLUSTER_OR_SERVICE_IDENTITY>
```

Required proof:

```text
STORE_TRANSPORT=Cloud SQL Auth Proxy via Cloud Run Unix socket
STORE_TRANSPORT_ENCRYPTION=PASS
STORE_TLS_REQUIRED=YES
STORE_PUBLIC_AUTHORIZED_NETWORKS=0
CLOUD_RUN_CLOUD_SQL_INSTANCE_CONNECTION_NAME=<STORE_CLUSTER_OR_SERVICE_IDENTITY>
CLOUD_RUN_CLOUD_SQL_ATTACHMENT_MATCH=PASS
```

Primary references:

- https://cloud.google.com/sql/docs/postgres/connect-instance-cloud-run
- https://cloud.google.com/sql/docs/postgres/connect-auth-proxy

---

## 17. Database ownership, ACL, and role-membership theorem

Migration/administrative identity, runtime login user, and runtime privilege role must be explicitly bound:

```text
STORE_MIGRATION_ROLE_IDENTITY=kodac_phase_b_gate_migrator
STORE_RUNTIME_USER_IDENTITY=kodac_phase_b_gate_runtime
STORE_RUNTIME_ROLE_IDENTITY=kodac_phase_b_gate_runtime_role
STORE_MIGRATION_RUNTIME_IDENTITY_DIFFERENT=PASS
STORE_RUNTIME_USER_ROLE_BINDING=kodac_phase_b_gate_runtime_role
STORE_RUNTIME_USER_ROLE_BINDING_MATCH=PASS
STORE_RUNTIME_USER_CLOUDSQLSUPERUSER_MEMBERSHIP=NO
```

The running App identity must have exactly:

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

When creating a built-in Cloud SQL PostgreSQL runtime user, assign the pre-created custom runtime role during user creation so the user is not granted `cloudsqlsuperuser`.

Required privilege proof must cover the login user, direct ACLs, and inherited/transitive role membership, not behavior probes alone:

```text
STORE_MIGRATION_ROLE_IDENTITY
STORE_RUNTIME_USER_IDENTITY
STORE_RUNTIME_ROLE_IDENTITY
STORE_MIGRATION_RUNTIME_IDENTITY_DIFFERENT=PASS
STORE_RUNTIME_USER_ROLE_BINDING_MATCH=PASS
STORE_RUNTIME_USER_CLOUDSQLSUPERUSER_MEMBERSHIP=NO
STORE_RUNTIME_USER_MEMBERSHIP_CLOSURE_SHA256
STORE_RUNTIME_USER_UNAUTHORIZED_MEMBERSHIP_COUNT=0
STORE_RUNTIME_DIRECT_ACL_SHA256
STORE_RUNTIME_ROLE_MEMBERSHIP_CLOSURE_SHA256
STORE_RUNTIME_UNAUTHORIZED_MEMBERSHIP_COUNT=0
STORE_RUNTIME_ROLE_GRANTS_SHA256
STORE_RUNTIME_ROLE_OWNS_DATABASE=NO
STORE_RUNTIME_ROLE_OWNS_SCHEMA=NO
STORE_RUNTIME_ROLE_OWNS_TABLES=NO
STORE_RUNTIME_ROLE_OWNS_TRIGGERS=NO
STORE_RUNTIME_ROLE_OWNS_FUNCTIONS=NO
```

Primary references:

- https://cloud.google.com/sql/docs/postgres/create-manage-users
- https://cloud.google.com/sql/docs/postgres/users
- https://www.postgresql.org/docs/16/ddl-priv.html
- https://www.postgresql.org/docs/16/role-membership.html

---

## 18. Exact migration boundary

Only:

```text
migrations/0001_phase_b.sql
```

may be executed from the App source repository.

Bind:

```text
STORE_MIGRATION_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
STORE_MIGRATION_SOURCE_REVISION=<exact AG1-B packaging-reviewed revision>
STORE_MIGRATION_FILE_SHA256=<exact hash>
STORE_SCHEMA_SHA256=<normalized schema proof hash>
```

No ad-hoc DDL outside the canonical migration and the minimum database/role bootstrap statements is authorized. Sanitized bootstrap evidence must preserve the runtime privilege theorem.

---

## 19. DATABASE_DSN identity-binding proof and live store probes

Before any live store probe, parse `DATABASE_DSN` inside the trusted deployment/preflight process without printing or persisting the raw DSN. Record only redacted identity fields and boolean match results:

```text
STORE_DSN_SOCKET_PATH_REDACTED=/cloudsql/<STORE_CLUSTER_OR_SERVICE_IDENTITY>
STORE_DSN_SOCKET_MATCH=PASS
STORE_DSN_DATABASE_REDACTED=kodac_phase_b_gate
STORE_DSN_DATABASE_MATCH=PASS
STORE_DSN_USER_REDACTED=kodac_phase_b_gate_runtime
STORE_DSN_USER_MATCH=PASS
STORE_DSN_CREDENTIALS_REDACTED=YES
```

The parsed socket must equal the exact Cloud SQL attachment identity already proven for the Cloud Run revision, the parsed database must equal `STORE_DATABASE_NAME`, and the parsed user must equal `STORE_RUNTIME_USER_IDENTITY`. Raw DSN text, password material, and credential-derived hashes are forbidden from evidence. Any mismatch fails closed before probes.

Before AG1-B can be proven complete:

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
STORE_RUNTIME_ROLE_OWNS_TRIGGERS=NO
STORE_RUNTIME_ROLE_OWNS_FUNCTIONS=NO
STORE_RUNTIME_UNAUTHORIZED_MEMBERSHIP_COUNT=0
```

Use obviously synthetic delivery/receipt identities. No Kodac trust-root candidate artifact or real founder/review receipt is used.

---

## 20. Deployment health proof

AG1-B may call only:

```text
GET /healthz
```

Expected:

```text
HTTP 200
BODY=ok
```

`/healthz` proves liveness only. It does not prove database readiness, GitHub authentication, reviewer qualification, gate success, trust-root establishment, or protected-main readiness.

AG1-B must not intentionally trigger a real `kodac/phase-b-gate` Check Run or a GitHub webhook delivery.

---

## 21. Registration/deployment proof fields

A later AG1-B proof slice must bind at least:

```text
APP_GITHUB_ID
APP_CLIENT_ID_IF_PRESENT
APP_SLUG
APP_OWNER_LOGIN
APP_VISIBILITY
APP_INSTALLABILITY
USER_AUTHORIZATION_FLOW
OAUTH_USER_TOKENS
DEVICE_FLOW
APP_PERMISSION_SET_SHA256
APP_WEBHOOK_EVENT_SET_SHA256
APP_WEBHOOK_ACTIVE
APP_WEBHOOK_ACTIVE_DURING_INSTALLATION
APP_WEBHOOK_URL
APP_WEBHOOK_URL_MATCH
WEBHOOK_SECRET_BINDING_CONFIGURATION
WEBHOOK_SECRET_BINDING_PROBE
LATER_WEBHOOK_ACTIVATION_ALLOWED
APP_INSTALLATION_ID
APP_INSTALLATION_ACCOUNT
APP_INSTALLATION_REPOSITORY_ID
APP_INSTALLATION_REPOSITORY
APP_INSTALLATION_REPOSITORY_COUNT

APP_PACKAGING_EXACT_COMMIT
APP_PACKAGING_EXACT_TREE
APP_BUILD_BINARY_SHA256
APP_BUILD_IMAGE_DIGEST
APP_BUILD_IMAGE_PLATFORM
APP_BUILD_IMAGE_PLATFORM_MATCH
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
CLOUD_RUN_RUNTIME_SERVICE_ACCOUNT
CLOUD_RUN_REVISION_SERVICE_ACCOUNT
CLOUD_RUN_REVISION_SERVICE_ACCOUNT_MATCH
CLOUD_RUN_CLOUD_SQL_INSTANCE_CONNECTION_NAME
CLOUD_RUN_CLOUD_SQL_ATTACHMENT_MATCH
GCP_PROJECT_PARENT_RESOURCE
GCP_RESOURCE_ANCESTRY_CANONICAL_SHA256
RUNTIME_PROJECT_IAM_POLICY_CANONICAL_SHA256
RUNTIME_PROJECT_IAM_EXCESS_ROLE_COUNT
RUNTIME_INHERITED_IAM_BINDINGS_CANONICAL_SHA256
RUNTIME_INHERITED_UNAUTHORIZED_BINDING_COUNT
RUNTIME_EFFECTIVE_PROJECT_ROLE_SET_SHA256
RUNTIME_EFFECTIVE_PROJECT_ROLE_SET_MATCH
RUNTIME_SECRET_ACCESS_BINDINGS_MATCH
RUNTIME_EFFECTIVE_IAM_VERIFICATION

SECRET_INJECTION_MODE
SECRET_RESOURCE_NAME
SECRET_VERSION_NUMBER
SECRET_VERSION_RESOURCE_ID
SECRET_NUMERIC_VERSION_PINNED

STORE_ENGINE_EXACT_VERSION
STORE_CLUSTER_OR_SERVICE_IDENTITY
STORE_DATABASE_NAME
STORE_SCHEMA_NAME
STORE_MIGRATION_SOURCE_PROVENANCE
STORE_MIGRATION_EXACT_REVISION
STORE_SCHEMA_SHA256
STORE_MIGRATION_ROLE_IDENTITY
STORE_RUNTIME_USER_IDENTITY
STORE_RUNTIME_ROLE_IDENTITY
STORE_MIGRATION_RUNTIME_IDENTITY_DIFFERENT
STORE_RUNTIME_USER_ROLE_BINDING
STORE_RUNTIME_USER_ROLE_BINDING_MATCH
STORE_RUNTIME_USER_CLOUDSQLSUPERUSER_MEMBERSHIP
STORE_RUNTIME_USER_MEMBERSHIP_CLOSURE_SHA256
STORE_RUNTIME_USER_UNAUTHORIZED_MEMBERSHIP_COUNT
STORE_DSN_SOCKET_PATH_REDACTED
STORE_DSN_SOCKET_MATCH
STORE_DSN_DATABASE_REDACTED
STORE_DSN_DATABASE_MATCH
STORE_DSN_USER_REDACTED
STORE_DSN_USER_MATCH
STORE_DSN_CREDENTIALS_REDACTED
STORE_RUNTIME_DIRECT_ACL_SHA256
STORE_RUNTIME_ROLE_MEMBERSHIP_CLOSURE_SHA256
STORE_RUNTIME_UNAUTHORIZED_MEMBERSHIP_COUNT
STORE_RUNTIME_ROLE_GRANTS_SHA256
STORE_RUNTIME_ROLE_OWNS_DATABASE
STORE_RUNTIME_ROLE_OWNS_SCHEMA
STORE_RUNTIME_ROLE_OWNS_TABLES
STORE_RUNTIME_ROLE_OWNS_TRIGGERS
STORE_RUNTIME_ROLE_OWNS_FUNCTIONS
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

No proof field may contain a credential, private key, webhook secret, database password, App JWT, installation token, Google OAuth token, service-account private key, or hash of a secret payload.

---

## 22. AG1-B execution ordering

The later execution must be fail-closed and ordered:

```text
B0  verify live Kodac + App-source canonical truth
B1  verify founder-controlled Google Cloud access and report project/region/machine/storage/availability/cost-bearing resources
B2  obtain explicit founder approval for billable resource creation
B3  resolve/freeze distroless base digest and linux/amd64 platform contract
B4  create + independently review the exact 2-path packaging amendment
B5  create/verify dedicated GCP project and required APIs
B6  provision Artifact Registry, runtime service account, exact Secret Manager resources, and Cloud SQL
B7  create database/schema/migration/runtime roles and run the canonical migration
B8  register GitHub App with exact visibility/permissions/events and webhook inactive
B9  generate/import App private key + webhook secret directly into Secret Manager; keep webhook inactive
B10 install App on exactly TheHalfMoon/Kodac while webhook remains inactive
B11 build exact linux/amd64 binary and OCI image; verify image platform
B12 push image and capture Artifact Registry digest
B13 deploy Cloud Run by exact digest, exact runtime SA, exact Cloud SQL attachment, and numeric secret versions
B14 prove /healthz, revision/image/platform/runtime-SA/Cloud-SQL attachment, effective ancestry-aware IAM, and secret bindings
B15 configure exact GitHub webhook URL while webhook remains inactive; record URL match; leave secret-binding probe deferred
B16 parse DATABASE_DSN without disclosure; prove exact socket/database/runtime-user binding; prove runtime-user role/no-cloudsqlsuperuser state; then run database privilege/ACL/membership/ownership/append-only probes
B17 capture sanitized registration/deployment/store evidence
B18 stop with webhook inactive, secret-binding activation gate blocked, and AG1-C/AG2 still blocked
```

If any step fails, do not compensate by widening permissions, adding repositories, enabling workflows/webhooks, using PAT/OAuth user tokens, exposing secrets, changing App logic, bypassing exact digests/platforms, or granting database admin rights to the runtime.

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
device-flow authorization
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

## 24. Review-finding reconciliation requirements

The AG1-B authorization predecessor is not merge-eligible until independent exact-head review verifies all of the following:

```text
AG1B-R01_OCI_PLATFORM_PINNED=PASS
AG1B-R02_CLOUD_SQL_REVISION_ATTACHMENT_BOUND=PASS
AG1B-R03_RUNTIME_SA_AND_IAM_PROOF_BOUND=PASS
AG1B-R04_SECRET_INJECTION_NUMERIC_VERSION_BOUND=PASS
AG1B-R05_GITHUB_APP_VISIBILITY_AUTH_SETTINGS_BOUND=PASS
AG1B-R06_WEBHOOK_URL_BOUND_AND_SECRET_PROOF_FAIL_CLOSED=PASS
AG1B-R07_WEBHOOK_INACTIVE_DURING_INSTALLATION=PASS
AG1B-R08_DB_ACL_MEMBERSHIP_OWNERSHIP_PROOF_BOUND=PASS
AG1B-R09_EFFECTIVE_IAM_ANCESTRY_PROOF_BOUND=PASS
AG1B-R10_RUNTIME_DB_USER_ROLE_BINDING_PROOF_BOUND=PASS
AG1B-R11_DSN_SOCKET_DATABASE_USER_BINDING_PROOF_BOUND=PASS
```

---

## 25. Predecessor verdict

Current candidate result:

```text
AG1A=CANONICAL
AG1B_AUTHORIZATION_CANDIDATE=REQUIRES_FRESH_EXACT_HEAD_REVIEW
AG1B_EXECUTION=NOT_STARTED
GITHUB_APP_CREATED=NO
GCP_RESOURCES_CREATED=NO
REAL_SECRETS_ACCESSED=NO
APP_DEPLOYED=NO
APP_INSTALLED=NO
APP_WEBHOOK_ACTIVE=NO
AG1C=BLOCKED
AG2=BLOCKED
TRUST_ROOT_ESTABLISHMENT=BLOCKED
H4_COMPLETE=NO
```

If and only if this exact authorization is independently reviewed and merged canonically, a separate AG1-B execution may start from that canonical merge. It must still stop before any cost-bearing resource creation until the founder explicitly approves the exact preflight resource/cost report.
