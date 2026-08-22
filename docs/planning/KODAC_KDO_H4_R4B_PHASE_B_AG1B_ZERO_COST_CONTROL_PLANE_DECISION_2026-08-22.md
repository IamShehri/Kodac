# KODAC KDO H4-R4B Phase-B AG1-B — Zero-Cost Control-Plane Decision

Date: 2026-08-22
Status: **DECISION CANDIDATE — DOCS ONLY — NO EXTERNAL RESOURCE CREATION — NO PRODUCTION EXECUTION**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Define a fail-closed response to the founder constraint that Phase-B infrastructure must incur no new provider or cloud spend.

This decision does not silently replace the canonical AG1-B Google Cloud authorization. It separates a zero-cost founder-hosted pilot from production-grade execution and prevents any provider, GitHub App, secret, or deployment mutation until the remaining blockers are repaired and reviewed.

```text
NEW_PROVIDER_SPEND_USD=0.00
NEW_PAID_SUBSCRIPTION=NO
NEW_DOMAIN_PURCHASE=NO
CREDIT_BASED_HOSTING_AS_ZERO_COST=FORBIDDEN
BILLING_ENABLED_RESOURCE_AS_ZERO_COST=FORBIDDEN
PRODUCTION_EQUIVALENCE_OF_FREE_PILOT=NO
```

Existing founder-owned hardware, electricity, and Internet access are outside the provider-spend accounting boundary; this document makes no claim that those physical resources have zero economic cost.

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
APP_BUILD_GO_VERSION=go1.26.6
APP_BUILD_GOOS=linux
APP_BUILD_GOARCH=amd64
APP_BUILD_CGO_ENABLED=0

KODAC_GITHUB_OWNER=TheHalfMoon
KODAC_GITHUB_OWNER_TYPE=User
KODAC_LICENSE_PATH=LICENSE
KODAC_LICENSE=Apache-2.0
KODAC_LICENSE_BLOB_SHA=261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64
```

The canonical App source still consumes `DATABASE_DSN`, `WEBHOOK_SECRET`, and `APP_PRIVATE_KEY_PEM` as secret values in process configuration. No file-based secret source is currently implemented.

---

## 3. Non-production evidence already observed

Founder-local rehearsal has produced the following non-authoritative evidence against the pinned App source:

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

These observations prove local feasibility only. They do not satisfy provider-specific, production, secret-binding, public-ingress, uptime, plan-eligibility, end-to-end webhook, or H4 closure requirements.

---

## 4. Hard external requirements

Any zero-cost candidate must preserve all of the following unless a separately reviewed amendment explicitly changes one:

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
PAID_FALLBACK_IF_FREE_ELIGIBILITY_FAILS=FORBIDDEN
```

GitHub does not automatically redeliver failed webhook deliveries. Therefore a sleeping or routinely unavailable endpoint cannot be treated as production-equivalent.

---

## 5. Candidate assessment

### 5.1 Supabase Free

```text
CANDIDATE=Supabase_Free
COST=0_USD
MANAGED_POSTGRES=YES
PRODUCTION_RECEIPT_STORE=REJECT
```

Reasons:

1. Free projects may be paused after a low-activity period of approximately seven days.
2. Supabase explicitly recommends upgrading for a guarantee against inactivity pausing.
3. Free projects do not include downloadable database backups in the production checklist.
4. The previously inspected founder project used PostgreSQL 17.6, while the KODAC contract currently pins PostgreSQL major 16.

Supabase remains useful for unrelated web work, but it is not selected as the canonical Phase-B receipt store under this decision.

### 5.2 Oracle Cloud Always Free Compute

```text
CANDIDATE=OCI_Always_Free_Compute
COST=0_USD_WITHIN_ALWAYS_FREE_LIMITS
PRODUCTION_HOST=REJECT
```

Reasons:

1. Oracle documents that idle Always Free compute instances may be reclaimed.
2. Low-traffic webhook infrastructure is structurally likely to look idle.
3. Always Free capacity can be unavailable in a selected availability domain.
4. Ampere A1 is ARM while the canonical App build is currently `linux/amd64`; the free AMD micro shape is substantially smaller.

No artificial load may be generated merely to evade idle-reclamation policy.

### 5.3 Cloudflare Quick Tunnel

```text
CANDIDATE=Cloudflare_Quick_Tunnel
COST=0_USD
STABLE_PRODUCTION_ENDPOINT=NO
PRODUCTION_HOST=REJECT
```

Cloudflare explicitly defines Quick Tunnels as testing/development only, assigns a random hostname, and provides no uptime guarantee.

A named Cloudflare Tunnel is technically stronger, but a stable public hostname requires a zone/domain controlled by the founder and still depends on the availability of the founder-hosted origin. It is therefore not selected as the zero-new-domain path here.

### 5.4 Cloudflare Containers

```text
CANDIDATE=Cloudflare_Containers
RUN_EXISTING_CONTAINER=YES
HARD_ZERO_COST=FAIL
PRODUCTION_HOST=REJECT_FOR_THIS_CONSTRAINT
```

Cloudflare Containers require the Workers Paid plan, whose current minimum is USD 5/month. This directly violates the hard zero-provider-spend constraint.

### 5.5 ngrok Free

```text
CANDIDATE=ngrok_Free
LOCAL_INGRESS=YES
PRODUCTION_HOST=REJECT
```

The Free plan has strict request/data limits and an HTTP/S interstitial. It is not selected for the load-bearing Phase-B webhook.

### 5.6 Tailscale Funnel

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

Tailscale Funnel can expose a local HTTP service to the public Internet through a predictable `*.ts.net` hostname, automatically provisions HTTPS, is available on all plans, and can persist with `--bg` across service restarts when the underlying Windows Tailscale node itself is available.

Funnel availability on all plans does **not** prove that this project is eligible for a zero-cost plan. Plan eligibility is a separate blocking theorem.

#### Personal plan restriction

Current Tailscale documentation states that the free Personal plan is intended for personal/non-commercial use and is not intended for commercial use.

```text
TAILSCALE_PERSONAL_PLAN_COST_USD=0
TAILSCALE_PERSONAL_NONCOMMERCIAL_ONLY=YES
TAILSCALE_PERSONAL_ELIGIBILITY_FOR_KODAC=UNPROVEN
TAILSCALE_PERSONAL_SELECTION_AUTHORIZED=NO
```

No inference about KODAC's commercial or non-commercial status may be made merely from the repository being public or open source.

#### Community on GitHub evidence status

Tailscale separately documents a `Community on GitHub` free plan for a **GitHub organization** using Tailscale for an open-source project with an OSI-approved license. It requires GitHub authentication and Tailscale Support involvement.

KODAC carries Apache License 2.0, satisfying the OSI-license prerequisite. Live GitHub metadata reports the canonical repository owner `TheHalfMoon` as a GitHub **User**, not an Organization. That fact does not, by itself, prove Tailscale would reject every possible Community-plan arrangement, because the public Tailscale documentation does not explicitly state that the open-source repository itself must be owned by the qualifying GitHub organization.

No qualifying GitHub-organization binding, Tailscale Support confirmation, or Community-plan enrollment exists in the evidence set. Therefore eligibility is **unproven**, not inferred either way.

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

Creating a GitHub organization, transferring the repository, or changing repository ownership merely to obtain a free service plan is outside this decision and is not authorized.

Because both Personal and Community zero-cost eligibility are unproven, Tailscale remains a **conditional ingress candidate**, not an executable zero-cost selection.

```text
TAILSCALE_ZERO_COST_PLAN_ELIGIBILITY=UNPROVEN_BLOCKING
TAILSCALE_ZERO_COST_ELIGIBLE_PATH_COUNT=0
TAILSCALE_FUNNEL_ZERO_COST_SELECTION=CONDITIONAL
IF_ZERO_COST_ELIGIBILITY_NOT_PROVEN=REJECT_TAILSCALE
PAID_TAILSCALE_FALLBACK=FORBIDDEN
```

Because Funnel remains Beta and the origin remains founder-hosted, even a successfully proven zero-cost plan path authorizes only a bounded pilot, never production-equivalent infrastructure.

---

## 6. Decision

```text
AG1B_ZERO_COST_DECISION=FOUNDER_HOSTED_PILOT_ARCHITECTURE_CONDITIONAL
AG1B_ZERO_COST_PREFERRED_INGRESS=Tailscale_Funnel
AG1B_ZERO_COST_INGRESS_ELIGIBILITY=UNPROVEN_BLOCKING
AG1B_ZERO_COST_ORIGIN=Founder_Windows_11_Docker_Desktop_WSL2
AG1B_ZERO_COST_DATABASE=PostgreSQL_16_Docker
AG1B_ZERO_COST_APP=Existing_Go_Business_Logic_Preserved
AG1B_ZERO_COST_SECRET_INPUT_EXTENSION=SEPARATELY_REVIEWED_ADDITIVE_CHANGE_ALLOWED
AG1B_ZERO_COST_PUBLIC_IP_REQUIRED=NO
AG1B_ZERO_COST_DOMAIN_PURCHASE_REQUIRED=NO
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

Tailscale's Windows/WSL2 guidance recommends running Tailscale on the Windows host rather than simultaneously inside WSL2. This decision therefore fixes the Windows 11 host as the single Tailscale/Funnel node. WSL2 remains the development/container shell and Docker Desktop remains the container runtime, but neither becomes a second Tailscale node.

Target topology applies only after a zero-cost Tailscale plan path is proven eligible and all other blockers are separately repaired:

```text
GitHub App webhook
        |
        | HTTPS :443
        v
stable <windows-node>.<tailnet>.ts.net
        |
        v
Tailscale Funnel on Windows 11 host only
        |
        | proxy to Windows loopback
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

The App host port must bind to `127.0.0.1` only. The PostgreSQL container must not publish port 5432 to the LAN or public Internet.

---

## 7. Blocking control ZC0-E01 — zero-cost plan eligibility

No Tailscale account, installation, Funnel, or external endpoint may be created under this decision until a later execution authorization and non-secret evidence establish at least one eligible zero-cost plan path.

Current eligibility theorem:

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

A future eligibility proof must contain no billing credentials or sensitive account tokens. If no zero-cost plan path can be proven, the Tailscale candidate is rejected and the architecture returns to `ZERO_COST_INGRESS=UNSELECTED`; the hard `$0` constraint is not relaxed automatically.

---

## 8. Blocking control ZC0-S01 — secret delivery

The candidate pilot MUST NOT use real GitHub App, webhook, or database secrets while the application only accepts direct secret values through container/process environment configuration.

```text
ZC0_S01_SECRET_DELIVERY=BLOCKING
REAL_APP_PRIVATE_KEY_ALLOWED=NO
REAL_WEBHOOK_SECRET_ALLOWED=NO
REAL_DATABASE_CREDENTIAL_ALLOWED=NO
```

A future separately reviewed App-source amendment may add file-backed secret inputs such as:

```text
APP_PRIVATE_KEY_PEM_FILE
WEBHOOK_SECRET_FILE
DATABASE_DSN_FILE
```

If implemented, that amendment must satisfy at least:

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

The exact implementation and file-permission theorem must be reviewed in the App source repository before any real secret is loaded.

---

## 9. Blocking control ZC0-P01 — canonical packaging

The zero-cost pilot may not use an ad hoc unreviewed container recipe as authoritative deployment evidence.

The existing AG1-B packaging contract remains applicable: a separately reviewed App-source packaging amendment must define the exact `linux/amd64` image recipe and provenance without rewriting runtime logic.

```text
ZC0_P01_CANONICAL_PACKAGING=BLOCKING
AD_HOC_DOCKERFILE_AS_AUTHORITY=FORBIDDEN
APP_SOURCE_LOGIC_CHANGE_BY_PACKAGING=FORBIDDEN
```

---

## 10. Blocking control ZC0-D01 — persistence and recovery

The ephemeral `tmpfs` database used for local theorem rehearsal is not acceptable for the pilot receipt store.

Before any webhook activation, a separate non-secret proof must establish:

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

## 11. Blocking control ZC0-U01 — founder-host availability and single-node ingress boundary

```text
FOUNDER_HOST_POWER_DEPENDENCY=YES
FOUNDER_HOST_INTERNET_DEPENDENCY=YES
DOCKER_DESKTOP_DEPENDENCY=YES
TAILSCALE_DAEMON_DEPENDENCY=YES
NO_PROVIDER_SLA=YES

TAILSCALE_NODE=WINDOWS_HOST_ONLY
TAILSCALE_WSL2_NODE=FORBIDDEN
TAILSCALE_DOCKER_NODE=FORBIDDEN
TAILSCALE_WINDOWS_RUN_UNATTENDED_REQUIRED=YES
```

The pilot endpoint may be used only while host availability is explicitly observed. A failed or unavailable endpoint is fail-closed and must not be reclassified as successful authority.

On Windows, future pilot execution must enable and prove Tailscale's Run Unattended mode before claiming restart continuity. `tailscale funnel --bg` persists the Funnel configuration, but restart continuity is not proven unless the Windows Tailscale service/node itself returns without an interactive user login.

Before creating a Funnel, a later separately authorized preflight must prove all of the following without real GitHub delivery:

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

The loopback health proof must be performed from the Windows host, not only from inside WSL2 or inside the container. This proves that the exact origin address supplied to Funnel reaches the intended Docker-published App port without exposing that port on a non-loopback interface.

GitHub's 10-second webhook response requirement remains load-bearing.

---

## 12. Blocking control ZC0-W01 — pre-activation webhook proof

`/healthz` proves liveness only. It is not sufficient to authorize webhook activation.

Before any real GitHub webhook delivery is enabled, a later execution authorization must require a two-part synthetic proof through the selected founder-hosted topology. The real GitHub webhook remains inactive for both parts.

### 12.1 Exact production-binary ingress and response-budget probe

Run the exact qualified production binary/container behind the selected Funnel endpoint. Send a locally generated synthetic HMAC-signed `POST /github/webhook` over the public Funnel URL using the configured webhook-secret boundary, but choose an intentionally unsupported synthetic event/action pair so the canonical handler authenticates the raw request and returns before invoking `Processor`.

This is load-bearing because the canonical handler performs HMAC authentication before the `webhook.Supported(...)` early return. It therefore proves public ingress, TLS termination, raw-byte HMAC validation, `X-Hub-Signature-256` handling, routing, and end-to-end response time without GitHub API calls or receipt-store mutation.

Required evidence:

```text
ZC0_W01A_EXACT_BINARY=PASS
ZC0_W01A_FUNNEL_HTTPS=PASS
ZC0_W01A_GITHUB_WEBHOOK_ACTIVE=NO
ZC0_W01A_REAL_GITHUB_DELIVERY=NO
ZC0_W01A_EVENT_SUPPORT=INTENTIONALLY_UNSUPPORTED
ZC0_W01A_PROCESSOR_CALLED=NO
ZC0_W01A_GITHUB_API_CALLS=0
ZC0_W01A_DATABASE_MUTATION=NO
ZC0_W01A_VALID_SIGNATURE_HTTP_STATUS=202
ZC0_W01A_VALID_SIGNATURE_ELAPSED_MS=<10000
ZC0_W01A_VALID_SIGNATURE_RESPONSE_BUDGET=PASS
ZC0_W01A_MUTATED_RAW_BODY_WITH_STALE_SIGNATURE_HTTP_STATUS=401
ZC0_W01A_INVALID_SIGNATURE_PROCESSOR_CALLED=NO
ZC0_W01A_INVALID_SIGNATURE_DATABASE_MUTATION=NO
```

The probe must sign the exact raw body bytes that are transmitted. A one-byte body mutation with the original signature must fail authentication. No secret value, full request signature, private key, DSN, or raw sensitive payload may be written to evidence; record only non-secret digests, status codes, elapsed time, and booleans.

### 12.2 Exact-handler + real-Postgres synthetic transaction/replay probe

A second probe must use an ephemeral, reviewable harness compiled from the exact pinned App source revision. The harness must instantiate the canonical `server.Server.Handler()` and the real `store.Postgres` adapter, but replace the production `Runtime` processor with a synthetic-only processor whose sole action is to map the authenticated delivery to `store.Process` against a dedicated synthetic probe database/schema in the same PostgreSQL 16 container.

The harness MUST NOT call GitHub APIs, create Check Runs, use real GitHub deliveries, or write synthetic rows into the authoritative receipt database. Its purpose is to connect the exact HMAC handler path to the exact transaction adapter without requiring GitHub App credentials.

The dedicated probe database/schema must be created from the exact canonical migration and equivalent restricted runtime-role theorem, contain synthetic data only, and be destroyed after evidence is captured.

Send requests through the Funnel endpoint to the harness and prove:

```text
ZC0_W01B_PINNED_APP_SOURCE_REVISION=PASS
ZC0_W01B_EXACT_SERVER_HANDLER=PASS
ZC0_W01B_REAL_STORE_POSTGRES=PASS
ZC0_W01B_SYNTHETIC_PROBE_DATABASE_ONLY=YES
ZC0_W01B_REAL_GITHUB_DELIVERY=NO
ZC0_W01B_GITHUB_API_CALLS=0

ZC0_W01B_FIRST_SIGNED_DELIVERY_HTTP_STATUS=202
ZC0_W01B_FIRST_SIGNED_DELIVERY_ELAPSED_MS=<10000
ZC0_W01B_FIRST_STORE_OUTCOME=PROCESSED
ZC0_W01B_FIRST_ROW_COUNT=1

ZC0_W01B_REPLAY_SAME_GUID_SAME_BYTES_HTTP_STATUS=202
ZC0_W01B_REPLAY_ELAPSED_MS=<10000
ZC0_W01B_REPLAY_STORE_OUTCOME=DUPLICATE
ZC0_W01B_REPLAY_ROW_COUNT=1

ZC0_W01B_SAME_GUID_DIFFERENT_BYTES_STORE_OUTCOME=ERR_FATAL_SECURITY
ZC0_W01B_COLLISION_ORIGINAL_ROW_PRESERVED=YES
ZC0_W01B_COLLISION_ROW_COUNT=1
ZC0_W01B_COLLISION_TRANSACTION_ROLLED_BACK=YES

ZC0_W01B_INVALID_SIGNATURE_HTTP_STATUS=401
ZC0_W01B_INVALID_SIGNATURE_DATABASE_MUTATION=NO
ZC0_W01B_PROBE_DATABASE_DESTROYED=YES
```

A collision is expected to fail closed rather than return 2XX. The 10-second 2XX response budget applies to valid first-delivery and valid duplicate/replay requests. Invalid signatures must return 401; conflicting-byte collisions must fail closed while preserving the original row.

The probe harness is evidence tooling only and must not be shipped in the production image. If creating that harness requires persistent App-source files rather than an ephemeral exact-source test harness, those files require their own reviewed source amendment first.

```text
ZC0_W01_PRE_ACTIVATION_WEBHOOK_PROOF=BLOCKING
HEALTHZ_AS_WEBHOOK_PROOF=FORBIDDEN
REAL_WEBHOOK_ACTIVATION_BEFORE_W01=FORBIDDEN
```

---

## 13. Pilot activation order

This decision does not execute the following steps. If all blockers become canonical and a later execution authorization explicitly permits the pilot, the order is:

```text
Z0  reverify exact Kodac and App source heads
Z1  prove at least one eligible zero-cost Tailscale plan path; otherwise reject Tailscale
Z2  prove canonical packaging
Z3  prove file-backed secret delivery
Z4  prove persistent PostgreSQL 16 volume and recovery
Z5  prove exact runtime DB role theorem on persistent store
Z6  install/configure Tailscale on the Windows 11 host only under the proven zero-cost plan; enable Run Unattended; do not install/run Tailscale in WSL2 or Docker; use no billing credentials
Z7  prove single-node ingress preflight: Windows-only Tailscale node, MagicDNS, HTTPS certificates, funnel node attribute, Run Unattended, Docker App port bound to 127.0.0.1 only, Windows-loopback /healthz exact match, and no public PostgreSQL bind
Z8  establish stable Funnel hostname to the proven Windows-loopback App origin with synthetic local service only
Z9  prove /healthz exact response through Funnel
Z10 prove host restart + Windows Run Unattended + Funnel --bg recovery with synthetic service
Z11 founder reviews non-secret pre-App evidence
Z12 separately authorize real GitHub App registration/secret loading
Z13 register private GitHub App with webhook still inactive
Z14 load real secrets through the approved secret-file boundary
Z15 install App only on TheHalfMoon/Kodac with webhook inactive
Z16 prove exact identities and configuration with real webhook still inactive
Z17 execute ZC0-W01A exact-binary signed ingress/response-budget proof with no real GitHub delivery
Z18 execute ZC0-W01B exact-handler/store synthetic transaction/replay proof with no GitHub API
Z19 founder reviews the complete non-secret pre-activation evidence
Z20 separately authorize real webhook activation
```

No step may be skipped or reordered merely because the underlying software is free.

---

## 14. Explicit non-grants

Merging this decision alone does NOT authorize:

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
ZC0_W01_EXECUTION=NO
AG1B_PRODUCTION_EXECUTION=NO
AG1C_START=NO
AG2_START=NO
TRUST_ROOT_ESTABLISHMENT=NO
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

For a docs-only candidate, the repository runtime workflow may legitimately skip its runtime-execution job only when all of the following are true on the same exact head:

```text
RUNTIME_CHANGE_CLASSIFIER=NON_RUNTIME
RUNTIME_EXECUTION_JOB=SKIPPED_BY_CLASSIFIER
K2_RUNTIME_GATE=PASS
GOVERNANCE_GATE=PASS
DOCS_ONLY_RUNTIME_SKIP_COUNTS_AS_GATE_PASS=YES
```

A skipped runtime job by itself is not a pass. The classifier result and the terminal `k2-runtime-gate=PASS` are required.

Exact-head workflow run IDs and check results are immutable **PR qualification evidence**, not self-referential content of this candidate document. They must be posted in the PR immediately before merge and reverified after every head change. Embedding a workflow run ID generated for commit `H` into a new commit would create `H+1` and invalidate the claim that the embedded run proves the new exact head.

```text
EXACT_HEAD_WORKFLOW_RUN_IDS_LOCATION=PR_QUALIFICATION_EVIDENCE
OLD_HEAD_WORKFLOW_RUNS_QUALIFY_NEW_HEAD=NO
HEAD_CHANGE_REQUIRES_FRESH_WORKFLOWS=YES
HEAD_CHANGE_REQUIRES_FRESH_INDEPENDENT_REVIEW=YES
```

PR-state semantics are:

```text
PR_DRAFT_DURING_CONSTRUCTION_AND_INTERNAL_GATES=YES
PR_MAY_TRANSITION_READY_SOLELY_TO_OBTAIN_EXACT_HEAD_INDEPENDENT_REVIEW=YES
READY_TRANSITION_AUTHORIZES_PILOT_EXECUTION=NO
READY_TRANSITION_AUTHORIZES_EXTERNAL_MUTATION=NO
MERGE_REMAINS_BLOCKED_UNTIL_REVIEW_AND_FINDING_RECONCILIATION=YES
```

If merged, only the following becomes true:

```text
AG1B_ZERO_COST_CONTROL_PLANE_DECISION=CANONICAL
ZERO_COST_FOUNDER_HOSTED_PILOT_ARCHITECTURE=CONDITIONALLY_SELECTED_BUT_BLOCKED
TAILSCALE_ZERO_COST_PLAN_ELIGIBILITY=UNPROVEN_BLOCKING
ZC0_U01_SINGLE_NODE_INGRESS_BOUNDARY=DEFINED_BUT_NOT_EXECUTED
ZC0_W01_PRE_ACTIVATION_WEBHOOK_PROOF=DEFINED_BUT_NOT_EXECUTED
```

The existing Google Cloud AG1-B authorization remains historical/canonical but is not executable while the founder's hard zero-provider-spend constraint remains in force.

---

## 16. Primary-source and source-code research record

Research verified on 2026-08-22 against current primary documentation, live GitHub repository metadata, and the pinned canonical App source:

- GitHub webhook timeout and failed-delivery behavior: https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks and https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries
- Tailscale Funnel behavior/limits: https://tailscale.com/docs/features/tailscale-funnel and https://tailscale.com/docs/reference/tailscale-cli/funnel
- Tailscale Windows/WSL2 boundary: https://tailscale.com/docs/install/windows/wsl2
- Tailscale Windows restart continuity / Run Unattended: https://tailscale.com/docs/how-to/run-unattended
- Tailscale MagicDNS: https://tailscale.com/docs/features/magicdns
- Tailscale HTTPS certificates: https://tailscale.com/docs/how-to/set-up-https-certificates
- Tailscale pricing and Personal non-commercial restriction: https://tailscale.com/pricing and https://tailscale.com/docs/account/manage-plans/downgrade-plan
- Tailscale free-plan alternatives including Community on GitHub: https://tailscale.com/docs/account/manage-plans/free-plans-discounts
- Supabase Free pausing/billing/production checklist: https://supabase.com/docs/guides/platform/free-project-pausing , https://supabase.com/docs/guides/platform/billing-on-supabase , https://supabase.com/docs/guides/deployment/going-into-prod
- Oracle Always Free resources and idle reclamation: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Cloudflare Tunnel and Quick Tunnel limitations: https://developers.cloudflare.com/tunnel/ and https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Cloudflare Containers pricing: https://developers.cloudflare.com/containers/pricing/
- ngrok current Free-plan limits: https://ngrok.com/pricing
- KODAC repository owner type: live GitHub metadata for `TheHalfMoon/Kodac` reports owner `TheHalfMoon` with `type=User`.
- KODAC repository license proof: canonical `LICENSE` blob `261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64` (Apache-2.0).
- Canonical App handler/runtime: `TheHalfMoon/kodac-phase-b-gate` commit `79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40`, `internal/server/server.go` blob `352b342f859d22ad982f3e38736469198af41e1d`; HMAC authentication occurs before unsupported-event early return, while supported-event `Runtime.Process` reaches GitHub API bootstrap before completing receipt/gate processing.
