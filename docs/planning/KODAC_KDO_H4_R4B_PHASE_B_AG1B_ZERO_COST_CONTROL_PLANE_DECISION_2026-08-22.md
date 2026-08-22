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

These observations prove local feasibility only. They do not satisfy provider-specific, production, secret-binding, public-ingress, uptime, or H4 closure requirements.

---

## 4. Hard external requirements

Any zero-cost candidate must preserve all of the following unless a separately reviewed amendment explicitly changes one:

```text
EXISTING_GO_APP_REWRITE=NO
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

A named Cloudflare Tunnel is technically stronger, but a stable public hostname requires a zone/domain controlled by the founder and still depends on the availability of the founder-hosted origin. Free-plan support does not provide an SLA. It is therefore not selected as a production-equivalent control plane here.

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

The Free plan is development-oriented, has request/data limits and an HTTP/S interstitial, and production support/SLA is not part of the free offering. It is not selected for the load-bearing Phase-B webhook.

### 5.6 Tailscale Funnel

```text
CANDIDATE=Tailscale_Funnel
PLAN_ELIGIBILITY=ALL_PLANS
PERSONAL_PLAN_COST=0_USD
STABLE_TS_NET_DNS=YES
AUTOMATIC_HTTPS=YES
LOCAL_REVERSE_PROXY=YES
BACKGROUND_PERSISTENCE=YES
BETA=YES
NONCONFIGURABLE_BANDWIDTH_LIMITS=YES
PRODUCTION_SLA=NOT_PROVEN
```

Tailscale Funnel can expose a local HTTP service to the public Internet through a stable `*.ts.net` hostname, automatically provisions HTTPS, is available on all plans, and can persist with `--bg` across device/Tailscale restarts.

Because Funnel remains Beta and the origin remains founder-hosted, it is selected only for a bounded zero-cost pilot, not as production-equivalent infrastructure.

---

## 6. Decision

```text
AG1B_ZERO_COST_DECISION=FOUNDER_HOSTED_PILOT_ONLY
AG1B_ZERO_COST_INGRESS=Tailscale_Funnel
AG1B_ZERO_COST_ORIGIN=Founder_Windows_11_Docker_Desktop_WSL2
AG1B_ZERO_COST_DATABASE=PostgreSQL_16_Docker
AG1B_ZERO_COST_APP=Existing_Go_App_Unchanged
AG1B_ZERO_COST_PUBLIC_IP_REQUIRED=NO
AG1B_ZERO_COST_DOMAIN_PURCHASE_REQUIRED=NO
AG1B_ZERO_COST_PROVIDER_BILLING_REQUIRED=NO
AG1B_ZERO_COST_PRODUCTION_EQUIVALENCE=NO
AG1B_ZERO_COST_H4_CLOSURE_AUTHORITY=NO
```

Target topology after all blockers are separately repaired:

```text
GitHub App webhook
        |
        | HTTPS :443
        v
stable <node>.<tailnet>.ts.net
        |
        v
Tailscale Funnel on founder host
        |
        | localhost only
        v
127.0.0.1:<APP_HOST_PORT>
        |
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

The PostgreSQL container must not publish port 5432 to the LAN or public Internet.

---

## 7. Blocking control ZC0-S01 — secret delivery

The selected pilot MUST NOT use real GitHub App, webhook, or database secrets while the application only accepts direct secret values through container/process environment configuration.

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

## 8. Blocking control ZC0-P01 — canonical packaging

The zero-cost pilot may not use an ad hoc unreviewed container recipe as authoritative deployment evidence.

The existing AG1-B packaging contract remains applicable: a separately reviewed App-source packaging amendment must define the exact `linux/amd64` image recipe and provenance without rewriting runtime logic.

```text
ZC0_P01_CANONICAL_PACKAGING=BLOCKING
AD_HOC_DOCKERFILE_AS_AUTHORITY=FORBIDDEN
APP_SOURCE_LOGIC_CHANGE_BY_PACKAGING=FORBIDDEN
```

---

## 9. Blocking control ZC0-D01 — persistence and recovery

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

## 10. Blocking control ZC0-U01 — founder-host availability

```text
FOUNDER_HOST_POWER_DEPENDENCY=YES
FOUNDER_HOST_INTERNET_DEPENDENCY=YES
DOCKER_DESKTOP_DEPENDENCY=YES
TAILSCALE_DAEMON_DEPENDENCY=YES
NO_PROVIDER_SLA=YES
```

The pilot endpoint may be used only while host availability is explicitly observed. A failed or unavailable endpoint is fail-closed and must not be reclassified as successful authority.

GitHub's 10-second webhook response requirement remains load-bearing.

---

## 11. Pilot activation order

This decision does not execute the following steps. If all blockers become canonical and a later execution authorization explicitly permits the pilot, the order is:

```text
Z0  reverify exact Kodac and App source heads
Z1  prove canonical packaging
Z2  prove file-backed secret delivery
Z3  prove persistent PostgreSQL 16 volume and recovery
Z4  prove exact runtime DB role theorem on persistent store
Z5  install/configure Tailscale without creating a paid subscription
Z6  establish stable Funnel hostname with synthetic local service only
Z7  prove /healthz exact response through Funnel
Z8  prove host restart / Funnel --bg recovery with synthetic service
Z9  founder reviews non-secret evidence
Z10 separately authorize real GitHub App registration/secret loading
Z11 register private GitHub App with webhook still inactive
Z12 load real secrets through the approved secret-file boundary
Z13 install App only on TheHalfMoon/Kodac with webhook inactive
Z14 prove exact identities and configuration without event delivery
Z15 separately authorize webhook activation
```

No step may be skipped or reordered merely because the underlying software is free.

---

## 12. Explicit non-grants

Merging this decision alone does NOT authorize:

```text
TAILSCALE_ACCOUNT_CREATION=NO
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
REAL_SECRET_ACCESS=NO
REAL_SECRET_LOADING=NO
AG1B_PRODUCTION_EXECUTION=NO
AG1C_START=NO
AG2_START=NO
TRUST_ROOT_ESTABLISHMENT=NO
H4_COMPLETE=NO
```

---

## 13. Merge gate

This decision may become canonical only if the exact candidate head proves:

```text
DOCS_ONLY=YES
CHANGED_FILE_COUNT=1
APP_SOURCE_REPOSITORY_MUTATED=NO
REQUIRED_REPOSITORY_GATES=PASS
INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_MATERIAL_FINDINGS=0
```

If merged, only the following becomes true:

```text
AG1B_ZERO_COST_CONTROL_PLANE_DECISION=CANONICAL
ZERO_COST_FOUNDER_HOSTED_PILOT=SELECTED_BUT_BLOCKED
```

The existing Google Cloud AG1-B authorization remains historical/canonical but is not executable while the founder's hard zero-provider-spend constraint remains in force.

---

## 14. Primary-source research record

Research verified on 2026-08-22 against current primary documentation:

- GitHub webhook timeout and failed-delivery behavior: https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks and https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries
- Tailscale Funnel behavior/limits: https://tailscale.com/docs/features/tailscale-funnel and https://tailscale.com/docs/reference/tailscale-cli/funnel
- Tailscale Personal pricing: https://tailscale.com/pricing
- Supabase Free pausing/billing/production checklist: https://supabase.com/docs/guides/platform/free-project-pausing , https://supabase.com/docs/guides/platform/billing-on-supabase , https://supabase.com/docs/guides/deployment/going-into-prod
- Oracle Always Free resources and idle reclamation: https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm
- Cloudflare Tunnel and Quick Tunnel limitations: https://developers.cloudflare.com/tunnel/ and https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/
- Cloudflare Containers pricing: https://developers.cloudflare.com/containers/pricing/
- ngrok current Free-plan limits: https://ngrok.com/pricing
