# KODAC KDO H4-R4B Phase-B AG1-B — Zero-Cost Control-Plane Decision

Date: 2026-08-22  
Status: **DECISION CANDIDATE — DOCS ONLY — NO EXTERNAL RESOURCE CREATION — NO PRODUCTION EXECUTION**  
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Define a fail-closed response to the founder constraint that Phase-B infrastructure must incur no new provider or cloud spend.

This decision does not silently replace the canonical AG1-B Google Cloud authorization. It separates a bounded zero-cost founder-hosted pilot from production-grade execution and prevents provider, GitHub App, secret, webhook, or deployment mutation until the relevant predecessor controls are separately proven and authorized.

```text
NEW_PROVIDER_SPEND_USD=0.00
NEW_PAID_SUBSCRIPTION=NO
NEW_DOMAIN_PURCHASE=NO
CREDIT_BASED_HOSTING_AS_ZERO_COST=FORBIDDEN
BILLING_ENABLED_RESOURCE_AS_ZERO_COST=FORBIDDEN
PAID_FALLBACK_IF_FREE_ELIGIBILITY_FAILS=FORBIDDEN
PRODUCTION_EQUIVALENCE_OF_FREE_PILOT=NO
H4_CLOSURE_AUTHORITY=NO
```

Existing founder-owned hardware, electricity, and Internet access are outside the provider-spend accounting boundary. This document makes no claim that those physical resources have zero economic cost.

---

## 2. Canonical baseline

```text
KODAC_CANONICAL_MAIN=88645db10b759ba632d3094f6346f56138c64a82
KODAC_CANONICAL_TREE=e2bb20c1c89ffe50e8459dd2d9b8f329a7657c3c
PHASE_B_AG1B_APP_REGISTRATION_DEPLOYMENT_AUTHORIZATION=CANONICAL
AG1B_R12_HEALTH_PROOF_CONTRACT_REPAIR=CANONICAL

APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_CANONICAL_MAIN=79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40
APP_SOURCE_CANONICAL_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
APP_SERVER_BLOB=352b342f859d22ad982f3e38736469198af41e1d
APP_STORE_BLOB=e8100ef06d67d5e82c5a0e4c90a0af7682579aba
APP_GITHUBAPI_BLOB=0fafdb97aa200b2dd896a2d6284e96f0fd1044d7
APP_CONFIG_BLOB=fab8515ff8e9897f68b923443021275a6ed23b87
APP_WEBHOOK_BLOB=77da1b32520ea265df627f4b97a7e5db514ced76

APP_BUILD_GO_VERSION=go1.26.6
APP_BUILD_GOOS=linux
APP_BUILD_GOARCH=amd64
APP_BUILD_CGO_ENABLED=0

KODAC_GITHUB_OWNER=TheHalfMoon
KODAC_GITHUB_OWNER_TYPE=User
KODAC_LICENSE=Apache-2.0
```

The canonical App source still consumes `DATABASE_DSN`, `WEBHOOK_SECRET`, and `APP_PRIVATE_KEY_PEM` as direct process configuration values. No file-backed secret input is canonical yet.

---

## 3. Non-authoritative local evidence already observed

Earlier founder-local rehearsal established local feasibility only:

```text
LOCAL_POSTGRESQL_MAJOR=16
LOCAL_CANONICAL_MIGRATION=PASS
LOCAL_DB_PRIVILEGE_THEOREM=PASS
LOCAL_APPEND_ONLY_REHEARSAL=PASS
LOCAL_GO_TEST_SUITE=PASS
LOCAL_EXACT_GO_1_26_6_BUILD=PASS
LOCAL_LINUX_AMD64_BUILD=PASS
LOCAL_REAL_PGX_CONNECTIVITY=PASS
LOCAL_REAL_STORE_POSTGRES_ADAPTER=PASS
LOCAL_REAL_STORE_PROCESS_PROCESSED=PASS
LOCAL_REAL_STORE_PROCESS_DUPLICATE=PASS
LOCAL_REAL_STORE_DELIVERY_COLLISION_FATAL=PASS
LOCAL_REAL_STORE_RECEIPT_INSERT_READBACK=PASS
LOCAL_REAL_STORE_RECEIPT_COLLISION_FATAL=PASS
LOCAL_REAL_STORE_COLLISION_ROLLBACK=PASS
```

These observations do not prove plan eligibility, public ingress, real secret handling, durable recovery, supported-event response time, production availability, or H4 completion.

---

## 4. Hard requirements preserved by this decision

```text
CURRENT_APP_SOURCE_CHANGED_BY_THIS_DECISION=NO
EXISTING_GO_BUSINESS_LOGIC_REWRITE=NO
ADDITIVE_SECRET_INPUT_SURFACE_REQUIRES_SEPARATE_REVIEW=YES
POSTGRESQL_MAJOR=16
RUNTIME_DB_USER_SEPARATE_FROM_MIGRATOR=YES
RUNTIME_DB_SELECT=YES
RUNTIME_DB_INSERT=YES
RUNTIME_DB_UPDATE=NO
RUNTIME_DB_DELETE=NO
RUNTIME_DB_TRUNCATE=NO
RUNTIME_DB_CREATE=NO
RUNTIME_DB_ALTER=NO
RUNTIME_DB_DROP=NO
RUNTIME_DB_GRANT=NO
PUBLIC_DATABASE_PORT=NO
HTTPS_PUBLIC_WEBHOOK_ENDPOINT=REQUIRED
GITHUB_WEBHOOK_RESPONSE_DEADLINE_SECONDS=10
WEBHOOK_HMAC_VERIFICATION=REQUIRED
APP_PRIVATE_KEY_SECRET_BOUNDARY=REQUIRED
WEBHOOK_SECRET_BOUNDARY=REQUIRED
DATABASE_CREDENTIAL_SECRET_BOUNDARY=REQUIRED
ZERO_COST_PLAN_ELIGIBILITY_MUST_BE_PROVEN=YES
```

GitHub does not automatically redeliver failed webhook deliveries. A sleeping or routinely unavailable endpoint therefore cannot be treated as production-equivalent.

---

## 5. Candidate assessment

### 5.1 Supabase Free — rejected as canonical receipt store

```text
CANDIDATE=Supabase_Free
COST=0_USD
MANAGED_POSTGRES=YES
PRODUCTION_RECEIPT_STORE=REJECT
```

Reasons: Free projects may pause after low activity; the free tier does not supply the desired production backup guarantees; and the previously observed founder project used PostgreSQL 17.6 while this contract pins PostgreSQL major 16.

### 5.2 Oracle Cloud Always Free Compute — rejected

```text
CANDIDATE=OCI_Always_Free_Compute
COST=0_USD_WITHIN_ALWAYS_FREE_LIMITS
PRODUCTION_HOST=REJECT
```

Reasons: documented idle-instance reclamation risk, possible free-capacity unavailability, and architecture mismatch between the canonical `linux/amd64` build and the more capable free Ampere A1 shape. Artificial traffic to evade reclamation policy is forbidden.

### 5.3 Cloudflare Quick Tunnel — rejected

```text
CANDIDATE=Cloudflare_Quick_Tunnel
COST=0_USD
STABLE_PRODUCTION_ENDPOINT=NO
PRODUCTION_HOST=REJECT
```

Quick Tunnels are development/testing surfaces with random hostnames and no production uptime guarantee. A named tunnel would still require a controlled domain/zone and a founder-hosted origin.

### 5.4 Cloudflare Containers — rejected by cost

```text
CANDIDATE=Cloudflare_Containers
HARD_ZERO_COST=FAIL
PRODUCTION_HOST=REJECT_FOR_THIS_CONSTRAINT
```

The product requires a paid Workers plan and therefore violates the hard `$0` provider-spend constraint.

### 5.5 ngrok Free — rejected

```text
CANDIDATE=ngrok_Free
LOCAL_INGRESS=YES
PRODUCTION_HOST=REJECT
```

The free plan's request/data constraints and interstitial behavior are unsuitable for this load-bearing webhook boundary.

### 5.6 Tailscale Funnel — conditional pilot candidate only

```text
CANDIDATE=Tailscale_Funnel
FUNNEL_AVAILABLE_ON_ALL_PLANS=YES
STABLE_TS_NET_DNS=YES
AUTOMATIC_HTTPS=YES
LOCAL_REVERSE_PROXY=YES
BACKGROUND_PERSISTENCE=YES
BETA=YES
NONCONFIGURABLE_BANDWIDTH_LIMITS=YES
PRODUCTION_SLA=NOT_PROVEN
```

Funnel availability does not prove zero-cost-plan eligibility.

#### Personal eligibility

```text
TAILSCALE_PERSONAL_PLAN_COST_USD=0
TAILSCALE_PERSONAL_NONCOMMERCIAL_ONLY=YES
TAILSCALE_PERSONAL_ELIGIBILITY_FOR_KODAC=UNPROVEN
TAILSCALE_PERSONAL_SELECTION_AUTHORIZED=NO
```

No commercial/non-commercial status is inferred from the repository being public or open source.

#### Community on GitHub eligibility

Tailscale documents a `Community on GitHub` free plan for a GitHub organization using Tailscale for an open-source project with an OSI-approved license. KODAC is Apache-2.0, but the current canonical repository owner is a GitHub User. Public documentation does not establish a qualifying organization binding for this repository, and no Support confirmation or enrollment is in evidence.

```text
TAILSCALE_COMMUNITY_ON_GITHUB_DOCUMENTED=YES
TAILSCALE_COMMUNITY_REQUIRES_GITHUB_ORGANIZATION=YES
TAILSCALE_COMMUNITY_CURRENT_REPOSITORY_OWNER=TheHalfMoon
TAILSCALE_COMMUNITY_CURRENT_REPOSITORY_OWNER_TYPE=User
TAILSCALE_COMMUNITY_LICENSE=Apache-2.0
TAILSCALE_COMMUNITY_OSI_LICENSE_PREREQUISITE=PASS
TAILSCALE_COMMUNITY_QUALIFYING_GITHUB_ORG_BINDING=UNPROVEN
TAILSCALE_COMMUNITY_SUPPORT_CONFIRMATION=ABSENT
TAILSCALE_COMMUNITY_ENROLLMENT=ABSENT
TAILSCALE_COMMUNITY_ELIGIBILITY=UNPROVEN
TAILSCALE_COMMUNITY_SELECTION_AUTHORIZED=NO
```

Creating an organization, transferring the repository, or changing ownership merely to obtain a free plan is outside this decision and is not authorized.

```text
TAILSCALE_ZERO_COST_PLAN_ELIGIBILITY=UNPROVEN_BLOCKING
TAILSCALE_ZERO_COST_ELIGIBLE_PATH_COUNT=0
TAILSCALE_FUNNEL_ZERO_COST_SELECTION=CONDITIONAL
IF_ZERO_COST_ELIGIBILITY_NOT_PROVEN=REJECT_TAILSCALE
PAID_TAILSCALE_FALLBACK=FORBIDDEN
```

Even if a zero-cost path is later proven, Funnel remains a bounded pilot surface, not production-equivalent infrastructure.

---

## 6. Conditional zero-cost pilot architecture

```text
AG1B_ZERO_COST_DECISION=FOUNDER_HOSTED_PILOT_ARCHITECTURE_CONDITIONAL
AG1B_ZERO_COST_PREFERRED_INGRESS=Tailscale_Funnel
AG1B_ZERO_COST_INGRESS_ELIGIBILITY=UNPROVEN_BLOCKING
AG1B_ZERO_COST_ORIGIN=Founder_Windows_11_Docker_Desktop_WSL2
AG1B_ZERO_COST_DATABASE=PostgreSQL_16_Docker
AG1B_ZERO_COST_APP=Existing_Go_Business_Logic_Preserved
AG1B_ZERO_COST_SECRET_INPUT_EXTENSION=SEPARATELY_REVIEWED_ADDITIVE_CHANGE_ALLOWED
AG1B_ZERO_COST_PROVIDER_BILLING_REQUIRED=NO
AG1B_ZERO_COST_PRODUCTION_EQUIVALENCE=NO
AG1B_ZERO_COST_H4_CLOSURE_AUTHORITY=NO

TAILSCALE_PILOT_NODE_OS=Windows_11
TAILSCALE_INSTALLATION_BOUNDARY=WINDOWS_HOST_ONLY
TAILSCALE_FUNNEL_OWNER=WINDOWS_HOST_TAILSCALE_NODE
TAILSCALE_IN_WSL2=FORBIDDEN
TAILSCALE_IN_DOCKER_CONTAINER=FORBIDDEN
APP_CONTAINER_HOST_BIND=127.0.0.1_ONLY
```

Target topology, only after all blockers and a later execution authorization:

```text
GitHub webhook
    |
    | HTTPS :443
    v
<windows-node>.<tailnet>.ts.net
    |
    v
Tailscale Funnel on Windows 11 host only
    |
    | Windows loopback only
    v
127.0.0.1:<APP_HOST_PORT>
    |
    | Docker Desktop host-port bridge
    v
KODAC Phase-B Go container
    |
    | private Docker network only
    v
PostgreSQL 16 container
    |
    v
persistent Docker volume
```

The App host port must bind to Windows loopback only. PostgreSQL port 5432 must not be published to the LAN or public Internet.

---

## 7. Blocking control ZC0-E01 — zero-cost plan eligibility

```text
ZC0_E01_ZERO_COST_PLAN_ELIGIBILITY=BLOCKING
TAILSCALE_PERSONAL_ELIGIBILITY_PROOF=ABSENT
TAILSCALE_COMMUNITY_QUALIFYING_GITHUB_ORG_BINDING_PROOF=ABSENT
TAILSCALE_COMMUNITY_SUPPORT_CONFIRMATION=ABSENT
TAILSCALE_COMMUNITY_ENROLLMENT_PROOF=ABSENT
ZERO_COST_ELIGIBLE_PATH_COUNT=0
TAILSCALE_INSTALLATION_ALLOWED=NO
TAILSCALE_FUNNEL_ALLOWED=NO
PAID_PLAN_ALLOWED=NO
```

A future proof may contain no billing credential or sensitive account token. If no eligible zero-cost path is proven, Tailscale is rejected and ingress returns to `UNSELECTED`.

---

## 8. Blocking control ZC0-S01 — secret delivery

Real secrets remain forbidden while the App accepts direct values only.

```text
ZC0_S01_SECRET_DELIVERY=BLOCKING
REAL_APP_PRIVATE_KEY_ALLOWED=NO
REAL_WEBHOOK_SECRET_ALLOWED=NO
REAL_DATABASE_CREDENTIAL_ALLOWED=NO
```

A future separately reviewed App-source amendment may add:

```text
APP_PRIVATE_KEY_PEM_FILE
WEBHOOK_SECRET_FILE
DATABASE_DSN_FILE
```

Minimum theorem:

```text
DIRECT_VALUE_AND_FILE_SOURCE_MUTUALLY_EXCLUSIVE=YES
MISSING_SECRET_FAIL_CLOSED=YES
SECRET_FILE_MUST_BE_REGULAR_FILE=YES
SECRET_FILE_SYMLINK_ACCEPTED=NO
SECRET_FILE_PATH_LOGGED=NO
SECRET_VALUE_LOGGED=NO
SECRET_FILE_SIZE_BOUNDED=YES
APP_PRIVATE_KEY_PEM_EXACT_BYTES_PRESERVED=YES
TESTS_FOR_ENV_MODE_PRESERVED=YES
TESTS_FOR_FILE_MODE_REQUIRED=YES
TESTS_FOR_DUAL_SOURCE_REJECTION=YES
TESTS_FOR_SYMLINK_REJECTION=YES
```

No real secret may be loaded before that App-source amendment is canonical.

---

## 9. Blocking control ZC0-P01 — canonical packaging

```text
ZC0_P01_CANONICAL_PACKAGING=BLOCKING
AD_HOC_DOCKERFILE_AS_AUTHORITY=FORBIDDEN
APP_SOURCE_LOGIC_CHANGE_BY_PACKAGING=FORBIDDEN
```

A separately reviewed App-source packaging amendment must define the exact `linux/amd64` image recipe and provenance while preserving runtime logic and the canonical `go1.26.6` build contract.

---

## 10. Blocking control ZC0-D01 — persistence and recovery

The earlier tmpfs rehearsal store is not acceptable for a pilot receipt store.

Before webhook activation, later evidence must establish:

```text
POSTGRES_DATA_STORAGE=DURABLE_LOCAL_DOCKER_VOLUME
POSTGRES_5432_PUBLIC_BIND=NO
DATABASE_MAJOR=16
MIGRATION_EXACT_SOURCE_MATCH=PASS
RUNTIME_ROLE_THEOREM=PASS
BACKUP_COMMAND_DEFINED=YES
RESTORE_REHEARSAL=PASS
BACKUP_CONTAINS_REAL_SECRET=NO
```

No production durability or SLA claim may be made from a single founder workstation.

---

## 11. Blocking control ZC0-U01 — Windows-only Tailscale and loopback boundary

```text
ZC0_U01_SINGLE_NODE_INGRESS_BOUNDARY=BLOCKING
FOUNDER_HOST_POWER_DEPENDENCY=YES
FOUNDER_HOST_INTERNET_DEPENDENCY=YES
DOCKER_DESKTOP_DEPENDENCY=YES
TAILSCALE_DAEMON_DEPENDENCY=YES
NO_PROVIDER_SLA=YES

TAILSCALE_NODE=WINDOWS_HOST_ONLY
TAILSCALE_WSL2_NODE=FORBIDDEN
TAILSCALE_DOCKER_NODE=FORBIDDEN
```

Before Funnel creation, later non-secret evidence must prove:

```text
ZC0_U01_WINDOWS_TAILSCALE_NODE_ONLY=PASS
ZC0_U01_WSL2_TAILSCALE_RUNNING=NO
ZC0_U01_DOCKER_TAILSCALE_RUNNING=NO
ZC0_U01_MAGICDNS_ENABLED=PASS
ZC0_U01_HTTPS_CERTIFICATES_ENABLED=PASS
ZC0_U01_FUNNEL_NODE_ATTRIBUTE=PASS
ZC0_U01_WINDOWS_RUN_UNATTENDED=PASS
ZC0_U01_APP_HOST_BIND=127.0.0.1_ONLY
ZC0_U01_POSTGRES_PUBLIC_BIND=NO
ZC0_U01_LOCAL_HEALTH_URL=http://127.0.0.1:<APP_HOST_PORT>/healthz
ZC0_U01_LOCAL_HEALTH_HTTP_STATUS=200
ZC0_U01_LOCAL_HEALTH_CONTENT_TYPE=application/json
ZC0_U01_LOCAL_HEALTH_BODY_EXACT={"status":"live"}
ZC0_U01_WINDOWS_LOOPBACK_TO_CONTAINER=PASS
```

`/healthz` proves liveness only; it does not prove webhook authentication, transaction behavior, or response-budget compliance.

---

## 12. Blocking control ZC0-W01 — complete pre-activation webhook proof

```text
ZC0_W01_PRE_ACTIVATION_WEBHOOK_PROOF=BLOCKING
REAL_GITHUB_WEBHOOK_ACTIVE_DURING_PROBE=NO
REAL_GITHUB_WEBHOOK_DELIVERY_DURING_PROBE=NO
REAL_GITHUB_API_NETWORK_DURING_SYNTHETIC_FIXTURE=NO
AUTHORITATIVE_RECEIPT_STORE_USED_BY_PROBE=NO
```

The proof is deliberately split into three complementary parts. No individual part substitutes for the others.

### 12.1 W01A — exact production-binary ingress, HMAC, and basic response budget

Run the exact qualified production binary/container behind the selected Funnel endpoint. Send a locally generated synthetic HMAC-signed `POST /github/webhook` over the public Funnel URL with an intentionally unsupported event/action pair.

The pinned handler authenticates the raw body before `webhook.Supported(...)`; an unsupported event therefore proves public HTTPS routing and raw-byte signature validation while returning before `Processor`, GitHub API, or database mutation.

Required evidence:

```text
ZC0_W01A_EXACT_BINARY_MATCH=PASS
ZC0_W01A_PUBLIC_PATH=POST /github/webhook
ZC0_W01A_REAL_GITHUB_DELIVERY=NO
ZC0_W01A_EVENT_SUPPORTED=NO
ZC0_W01A_SIGNATURE_HEADER=X-Hub-Signature-256
ZC0_W01A_RAW_BODY_HMAC_MATCH=PASS
ZC0_W01A_VALID_REQUEST_HTTP_STATUS=202
ZC0_W01A_VALID_REQUEST_ELAPSED_MS=<integer>
ZC0_W01A_VALID_REQUEST_UNDER_10000_MS=PASS
ZC0_W01A_PROCESSOR_CALLED=NO
ZC0_W01A_GITHUB_API_CALLED=NO
ZC0_W01A_DATABASE_MUTATION=NO

ZC0_W01A_BODY_MUTATED_AFTER_SIGNATURE=YES
ZC0_W01A_STALE_SIGNATURE_HTTP_STATUS=401
ZC0_W01A_STALE_SIGNATURE_PROCESSOR_CALLED=NO
```

W01A does **not** prove supported-event runtime latency.

### 12.2 W01B — exact handler + real PostgreSQL replay/collision theorem

Use an ephemeral synthetic-only harness built from the pinned App source. The harness must instantiate the exact `server.Server.Handler()` and a synthetic-only `Processor` backed by the real `store.Postgres` adapter and a dedicated probe PostgreSQL 16 database/schema derived from the canonical migration and restricted runtime role.

The synthetic Processor must call `store.Process` with a **non-nil ReceiptBuilder** that deterministically produces the same canonical synthetic receipt for cases intended to share receipt identity. The harness must validate both delivery-table persistence and receipt-table persistence; a delivery-only proof is insufficient.

It must not call GitHub API, create check runs, receive a real GitHub delivery, or write to the authoritative pilot receipt store.

Required replay/collision matrix:

```text
ZC0_W01B_RECEIPT_BUILDER_NON_NIL=PASS

FIRST_DELIVERY_GUID=probe-guid-a
FIRST_DELIVERY_BODY_SHA256=<sha256-a>
FIRST_DELIVERY_SIGNATURE_VALID=YES
FIRST_DELIVERY_HTTP_STATUS=202
FIRST_DELIVERY_STORE_OUTCOME=PROCESSED
FIRST_DELIVERY_DELIVERY_ROW_COUNT=1
FIRST_DELIVERY_RECEIPT_ROW_COUNT=1

SAME_GUID_SAME_BYTES_GUID=probe-guid-a
SAME_GUID_SAME_BYTES_BODY_SHA256=<sha256-a>
SAME_GUID_SAME_BYTES_SIGNATURE_VALID=YES
SAME_GUID_SAME_BYTES_HTTP_STATUS=202
SAME_GUID_SAME_BYTES_STORE_OUTCOME=DUPLICATE
SAME_GUID_SAME_BYTES_DELIVERY_ROW_COUNT=1
SAME_GUID_SAME_BYTES_RECEIPT_ROW_COUNT=1

DIFFERENT_GUID_SAME_BYTES_GUID=probe-guid-b
DIFFERENT_GUID_SAME_BYTES_BODY_SHA256=<sha256-a>
DIFFERENT_GUID_SAME_BYTES_SIGNATURE_VALID=YES
DIFFERENT_GUID_SAME_BYTES_HTTP_STATUS=202
DIFFERENT_GUID_SAME_BYTES_STORE_OUTCOME=PROCESSED
DIFFERENT_GUID_SAME_BYTES_DELIVERY_ROW_COUNT=2
DIFFERENT_GUID_SAME_BYTES_RECEIPT_ROW_COUNT=1

SAME_GUID_DIFFERENT_BYTES_GUID=probe-guid-a
SAME_GUID_DIFFERENT_BYTES_BODY_SHA256=<sha256-b>
SAME_GUID_DIFFERENT_BYTES_SIGNATURE_RECOMPUTED_FOR_CHANGED_BODY=YES
SAME_GUID_DIFFERENT_BYTES_SIGNATURE_VALID=YES
SAME_GUID_DIFFERENT_BYTES_HTTP_STATUS=500
SAME_GUID_DIFFERENT_BYTES_STORE_OUTCOME=ERR_FATAL_SECURITY
SAME_GUID_DIFFERENT_BYTES_TRANSACTION_ROLLBACK=PASS
SAME_GUID_DIFFERENT_BYTES_DELIVERY_ROW_COUNT=1
SAME_GUID_DIFFERENT_BYTES_RECEIPT_ROW_COUNT=1
SAME_GUID_DIFFERENT_BYTES_ORIGINAL_DELIVERY_PRESERVED=PASS
SAME_GUID_DIFFERENT_BYTES_ORIGINAL_RECEIPT_PRESERVED=PASS

INVALID_SIGNATURE_HTTP_STATUS=401
INVALID_SIGNATURE_PROCESSOR_CALLED=NO
INVALID_SIGNATURE_DATABASE_MUTATION=NO
```

The different-GUID/same-body case is load-bearing: delivery deduplication is by `delivery_guid`, while receipt identity is separately constrained. The collision case is also load-bearing: the changed body must receive its **own valid HMAC** while retaining the original GUID so the request passes authentication and actually reaches `store.Process`; reusing the stale signature would test only HMAC rejection and is insufficient.

Additional evidence:

```text
ZC0_W01B_FIRST_DELIVERY_UNDER_10000_MS=PASS
ZC0_W01B_DUPLICATE_DELIVERY_UNDER_10000_MS=PASS
ZC0_W01B_GITHUB_API_CALLED=NO
ZC0_W01B_REAL_CHECK_RUN_CREATED=NO
ZC0_W01B_AUTHORITATIVE_STORE_MUTATION=NO
ZC0_W01B_PROBE_DATABASE_DESTROYED=YES
```

### 12.3 W01C — supported-event exact Runtime response-budget theorem

W01A returns before the production processor, and W01B substitutes a synthetic processor. Neither measures the pinned supported-event production path, where `server.Runtime.Process` performs GitHub App JWT bootstrap, installation-token acquisition, `GetPull`, `ListFiles`, `store.Process`, gate evaluation, and `CreateCheckRun`.

Therefore webhook activation remains blocked until a third synthetic proof runs the **exact pinned `server.Runtime`** with the exact `server.Server.Handler()` and real `store.Postgres` while replacing only external GitHub network I/O with a deterministic, network-isolated HTTP transport fixture.

The fixture contract is:

```text
ZC0_W01C_EVENT=pull_request
ZC0_W01C_ACTION=synchronize
ZC0_W01C_EVENT_SUPPORTED=YES
ZC0_W01C_EXACT_SERVER_HANDLER=YES
ZC0_W01C_EXACT_RUNTIME_PROCESS=YES
ZC0_W01C_REAL_STORE_POSTGRES=YES
ZC0_W01C_GITHUB_API_BASE_URL=https://api.github.com
ZC0_W01C_GITHUB_API_BASE_URL_CHANGED=NO
ZC0_W01C_HTTP_CLIENT_INJECTED=YES
ZC0_W01C_CUSTOM_ROUND_TRIPPER=NETWORK_BLOCKING_DETERMINISTIC_FIXTURE
ZC0_W01C_DNS_OR_SOCKET_NETWORK_EGRESS=NO
ZC0_W01C_REAL_GITHUB_API_REQUEST=NO
ZC0_W01C_REAL_GITHUB_CREDENTIAL=NO
ZC0_W01C_REAL_GITHUB_APP_PRIVATE_KEY=NO
ZC0_W01C_SYNTHETIC_EPHEMERAL_RSA_KEY=YES
ZC0_W01C_SYNTHETIC_POSITIVE_APP_ID=YES
ZC0_W01C_SYNTHETIC_POSITIVE_INSTALLATION_ID=YES
ZC0_W01C_SYNTHETIC_WEBHOOK_SECRET=YES
ZC0_W01C_DEDICATED_PROBE_DATABASE=YES
```

The injected `http.Client`/`RoundTripper` must fail closed for any unexpected scheme, host, method, path, query, or call count and must return deterministic fixture responses only for the exact production calls:

```text
POST /app/installations/<synthetic-installation-id>/access_tokens
GET  /repos/TheHalfMoon/Kodac/pulls/<probe-pr-number>
GET  /repos/TheHalfMoon/Kodac/pulls/<probe-pr-number>/files?per_page=100&page=1
POST /repos/TheHalfMoon/Kodac/check-runs
```

The fixture must return a deterministic synthetic installation token, exact pull metadata, an exact finite file list, and a synthetic positive check-run ID. The check-run response is fixture data only; no real check run is created.

Send the signed supported synthetic event through the same selected Funnel/Windows-loopback topology to the harness and record the full handler elapsed time.

Required evidence:

```text
ZC0_W01C_RAW_BODY_HMAC_MATCH=PASS
ZC0_W01C_INSTALLATION_TOKEN_BOOTSTRAP_FIXTURE_CALL=PASS
ZC0_W01C_GET_PULL_FIXTURE_CALL=PASS
ZC0_W01C_LIST_FILES_FIXTURE_CALL=PASS
ZC0_W01C_STORE_PROCESS=PASS
ZC0_W01C_GATE_EVALUATION_REACHED=PASS
ZC0_W01C_CREATE_CHECK_RUN_FIXTURE_CALL=PASS
ZC0_W01C_UNEXPECTED_FIXTURE_CALL_COUNT=0
ZC0_W01C_NETWORK_EGRESS_ATTEMPT_COUNT=0
ZC0_W01C_HTTP_STATUS=202
ZC0_W01C_FULL_HANDLER_ELAPSED_MS=<integer>
ZC0_W01C_FULL_HANDLER_UNDER_10000_MS=PASS
ZC0_W01C_AUTHORITATIVE_STORE_MUTATION=NO
ZC0_W01C_PROBE_DATABASE_DESTROYED=YES
```

A deterministic W01C PASS proves the exact supported code path under the bounded synthetic fixture; it does not make a production SLA claim. Until W01A, W01B, and W01C are all executed under a later authorization and pass, the real GitHub webhook activation property remains `UNPROVEN_BLOCKING`.

```text
ZC0_W01A_STATUS=DEFINED_NOT_EXECUTED
ZC0_W01B_STATUS=DEFINED_NOT_EXECUTED
ZC0_W01C_STATUS=DEFINED_NOT_EXECUTED
REAL_WEBHOOK_ACTIVATION_RESPONSE_DEADLINE=UNPROVEN_BLOCKING
```

---

## 13. Pilot activation order

Merging this decision does not execute any step. A later execution authorization must preserve this order:

```text
Z0  reverify exact Kodac and App source heads
Z1  prove at least one eligible zero-cost Tailscale plan path; otherwise reject Tailscale
Z2  prove canonical packaging
Z3  prove file-backed secret delivery
Z4  prove persistent PostgreSQL 16 volume and recovery
Z5  prove exact runtime DB role theorem on persistent store
Z6  install/configure Tailscale on Windows 11 host only under the proven zero-cost plan; Run Unattended; no WSL2/Docker Tailscale; no billing credentials
Z7  prove Windows-only node, MagicDNS, HTTPS certificates, funnel node attribute, loopback-only App bind, exact Windows-loopback /healthz response, and no public PostgreSQL bind
Z8  establish stable Funnel hostname to the Windows-loopback App origin with synthetic local service only
Z9  prove /healthz exact response through Funnel
Z10 prove host restart + Run Unattended + Funnel background recovery with synthetic service
Z11 founder reviews non-secret pre-App evidence
Z12 separately authorize real GitHub App registration and real-secret loading
Z13 register private GitHub App with webhook inactive
Z14 load real secrets only through the approved secret-file boundary
Z15 install App only on TheHalfMoon/Kodac with webhook inactive
Z16 prove exact identities and configuration with real webhook inactive
Z17 execute W01A exact-binary signed ingress/HMAC/basic response-budget proof with no real GitHub delivery
Z18 execute W01B exact-handler/PostgreSQL replay/collision theorem with no GitHub API
Z19 execute W01C exact supported Runtime response-budget theorem with network-blocking deterministic GitHub API fixture
Z20 founder reviews the complete non-secret pre-activation evidence
Z21 separately authorize real webhook activation
```

No step may be skipped or reordered merely because the underlying software is free.

---

## 14. Explicit non-grants

Merging this decision alone authorizes none of the following:

```text
GITHUB_ORGANIZATION_CREATION=NO
REPOSITORY_TRANSFER=NO
REPOSITORY_OWNERSHIP_CHANGE=NO
TAILSCALE_ACCOUNT_CREATION=NO
TAILSCALE_PLAN_ENROLLMENT=NO
TAILSCALE_SUPPORT_CONTACT=NO
TAILSCALE_INSTALLATION=NO
TAILSCALE_FUNNEL_CREATION=NO
SUPABASE_PROJECT_CREATION=NO
SUPABASE_PROJECT_RESTORE=NO
GCP_RESOURCE_CREATION=NO
OCI_RESOURCE_CREATION=NO
CLOUDFLARE_RESOURCE_CREATION=NO
NGROK_RESOURCE_CREATION=NO
GITHUB_APP_CREATION=NO
GITHUB_APP_REGISTRATION=NO
GITHUB_APP_INSTALLATION=NO
APP_WEBHOOK_ACTIVATION=NO
REAL_GITHUB_WEBHOOK_DELIVERY=NO
REAL_SECRET_ACCESS=NO
REAL_SECRET_LOADING=NO
ZC0_U01_EXECUTION=NO
ZC0_W01A_EXECUTION=NO
ZC0_W01B_EXECUTION=NO
ZC0_W01C_EXECUTION=NO
AG1B_PRODUCTION_EXECUTION=NO
AG1C_START=NO
AG2_START=NO
TRUST_ROOT_ESTABLISHMENT=NO
B1_V2_START=NO
B2A_V2_START=NO
B2B_START=NO
H4_COMPLETE=NO
```

---

## 15. Review and merge gate

This decision may become canonical only if the exact candidate head proves:

```text
DOCS_ONLY=YES
CHANGED_FILE_COUNT=1
APP_SOURCE_REPOSITORY_MUTATED=NO
REQUIRED_REPOSITORY_GATES=PASS
INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_MATERIAL_FINDINGS=0
```

For a docs-only head, the repository runtime workflow satisfies the gate only under this exact shape:

```text
RUNTIME_CHANGE_CLASSIFIER=NON_RUNTIME
RUNTIME_EXECUTION_JOB=SKIPPED_BY_CLASSIFIER
K2_RUNTIME_GATE=PASS
GOVERNANCE_GATE=PASS
DOCS_ONLY_RUNTIME_SKIP_COUNTS_AS_GATE_PASS=YES
```

Immutable exact-head workflow IDs belong in the final PR qualification evidence, not inside this document. Embedding a run ID generated for head H into the document would create H+1 and invalidate H as exact-head evidence.

```text
EXACT_HEAD_WORKFLOW_RUN_IDS_LOCATION=PR_QUALIFICATION_EVIDENCE
OLD_HEAD_WORKFLOW_RUNS_QUALIFY_NEW_HEAD=NO
HEAD_CHANGE_REQUIRES_FRESH_WORKFLOWS=YES
HEAD_CHANGE_REQUIRES_FRESH_INDEPENDENT_REVIEW=YES
```

PR-state semantics:

```text
PR_DRAFT_DURING_CONSTRUCTION_AND_INTERNAL_GATES=YES
PR_MAY_TRANSITION_READY_SOLELY_TO_OBTAIN_EXACT_HEAD_INDEPENDENT_REVIEW=YES
READY_TRANSITION_AUTHORIZES_PILOT_EXECUTION=NO
READY_TRANSITION_AUTHORIZES_EXTERNAL_MUTATION=NO
MERGE_REMAINS_BLOCKED_UNTIL_REVIEW_AND_FINDING_RECONCILIATION=YES
```

If merged, only this decision state becomes canonical:

```text
AG1B_ZERO_COST_CONTROL_PLANE_DECISION=CANONICAL
ZERO_COST_FOUNDER_HOSTED_PILOT_ARCHITECTURE=CONDITIONALLY_SELECTED_BUT_BLOCKED
TAILSCALE_ZERO_COST_PLAN_ELIGIBILITY=UNPROVEN_BLOCKING
ZC0_U01_SINGLE_NODE_INGRESS_BOUNDARY=DEFINED_BUT_NOT_EXECUTED
ZC0_W01A_EXACT_BINARY_PROOF=DEFINED_BUT_NOT_EXECUTED
ZC0_W01B_REPLAY_COLLISION_PROOF=DEFINED_BUT_NOT_EXECUTED
ZC0_W01C_SUPPORTED_RUNTIME_PROOF=DEFINED_BUT_NOT_EXECUTED
REAL_WEBHOOK_ACTIVATION_RESPONSE_DEADLINE=UNPROVEN_BLOCKING
```

The existing Google Cloud AG1-B authorization remains historical/canonical but is not executable while the founder's hard zero-provider-spend constraint remains in force.

---

## 16. Primary-source and pinned-source research record

Research verified on 2026-08-22 against current primary documentation, live GitHub metadata, and the pinned canonical App source:

- GitHub webhook timeout and failed-delivery behavior: `https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks` and `https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries`
- Tailscale Funnel behavior and limits: `https://tailscale.com/docs/features/tailscale-funnel` and `https://tailscale.com/docs/reference/tailscale-cli/funnel`
- Tailscale Windows/WSL2 boundary: `https://tailscale.com/docs/install/windows/wsl2`
- Tailscale Windows restart continuity / Run Unattended: `https://tailscale.com/docs/how-to/run-unattended`
- Tailscale MagicDNS and HTTPS certificates: `https://tailscale.com/docs/features/magicdns` and `https://tailscale.com/docs/how-to/set-up-https-certificates`
- Tailscale pricing, Personal restrictions, and Community on GitHub: `https://tailscale.com/pricing`, `https://tailscale.com/docs/account/manage-plans/downgrade-plan`, and `https://tailscale.com/docs/account/manage-plans/free-plans-discounts`
- Supabase Free pausing/billing/production guidance: `https://supabase.com/docs/guides/platform/free-project-pausing`, `https://supabase.com/docs/guides/platform/billing-on-supabase`, and `https://supabase.com/docs/guides/deployment/going-into-prod`
- Oracle Always Free resources: `https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm`
- Cloudflare Tunnel/Quick Tunnel and Containers pricing: `https://developers.cloudflare.com/tunnel/`, `https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/`, and `https://developers.cloudflare.com/containers/pricing/`
- ngrok pricing: `https://ngrok.com/pricing`
- Canonical App handler/runtime: `internal/server/server.go` at App source `79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40`; HMAC authentication precedes unsupported-event early return, while supported-event `Runtime.Process` performs GitHub API bootstrap and repository reads before store processing.
- Canonical store contract: `internal/store/store.go` at the same App source; delivery duplicate/collision identity is keyed by `delivery_guid`, with raw-payload hash collision detection, while receipt identity is separately verified.
- Canonical GitHub API client: `internal/githubapi/client.go`; API base URL remains `https://api.github.com`, and `Runtime.HTTP` permits an injected HTTP client for a deterministic no-network fixture without rewriting production logic.
- Canonical config: `internal/config/config.go`; production validation requires `https://api.github.com`, therefore W01C must preserve that BaseURL and isolate external I/O at the injected transport layer rather than changing configuration semantics.
- Canonical supported-event set: `internal/webhook/payload.go`; supported events include `pull_request/synchronize`, which is selected for W01C because it exercises the production supported-event path without requiring an authority-receipt-producing founder comment.
