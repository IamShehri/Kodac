# KODAC KDO H4-R4B Phase-B — Zero-Cost Ingress zrok Research Repair

Date: 2026-08-22  
Status: **RESEARCH REPAIR CANDIDATE — DOCS ONLY — NO INSTALLATION — NO ACCOUNT/SHARE CREATION — NO PUBLIC ENDPOINT**  
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Repair the canonical zero-cost ingress research after discovering a material candidate omitted from the previous survey: **zrok**.

GitHub's current official webhook documentation explicitly identifies zrok as a free, open-source ingress-management option for delivering webhooks to private systems. Therefore the canonical research statement that DuckDNS + Caddy was the only direct-ingress finalist must not be used as execution-selection authority until this repair is qualified and canonical.

This slice performs research/governance repair only.

```text
NEW_PROVIDER_SPEND_USD=0.00
SOFTWARE_INSTALLATION_BY_THIS_SLICE=NO
ZROK_ACCOUNT_CREATION_BY_THIS_SLICE=NO
ZROK_ENVIRONMENT_ENABLE_BY_THIS_SLICE=NO
ZROK_NAME_CREATION_BY_THIS_SLICE=NO
ZROK_SHARE_CREATION_BY_THIS_SLICE=NO
PUBLIC_ENDPOINT_CREATION_BY_THIS_SLICE=NO
PAYMENT_METHOD_ADDITION_BY_THIS_SLICE=NO
REAL_SECRET_ACCESS_BY_THIS_SLICE=NO
GITHUB_APP_MUTATION_BY_THIS_SLICE=NO
WEBHOOK_ACTIVATION_BY_THIS_SLICE=NO
NETWORK_MUTATION_BY_THIS_SLICE=NO
```

## 2. Canonical baseline

```text
KODAC_CANONICAL_MAIN=4c1918917c76fa628e4c091218930468c57a2eac
KODAC_CANONICAL_TREE=39e1d52c7e9613029e898afd76c56f68dd902ca9
PR_157=MERGED_CANONICAL

APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_CANONICAL_MAIN=79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40
APP_SOURCE_CANONICAL_TREE=56350e47a524d5d1a798559259f4f2f4800a513f

COST_REQUIREMENT=ZERO_PROVIDER_SPEND_HARD
PAID_FALLBACK=FORBIDDEN
INGRESS_EXECUTION_SELECTION=NONE
H4_COMPLETE=NO
```

Canonical PR #157 remains valid as research history, including its rejections of Smee, Cloudflare Quick Tunnel, Render Free, Koyeb, and public-repository self-hosted GitHub Actions. This repair changes only the incomplete finalist set and the ordering of the next proof target.

## 3. Why a repair is required

GitHub currently documents reverse-proxy delivery for private webhook systems and names, among other options:

- free open-source overlay networks such as OpenZiti;
- commercial ingress tools such as ngrok; and
- **free open-source ingress management tools such as zrok**.

That directly contradicts the practical completeness of the previous candidate survey.

```text
PR_157_ZERO_COST_DIRECT_INGRESS_FINALIST_COUNT=1
PR_157_FINALIST=DUCKDNS_PLUS_CADDY_DIRECT_FOUNDER_HOST
PR_157_RESEARCH_COMPLETENESS_AFTER_ZROK_DISCOVERY=SUPERSEDED_BY_REPAIR
```

No finding here invalidates the fail-closed controls or authorizes zrok execution.

## 4. Current zrok service facts

The current zrok hosted-service pricing page states:

```text
ZROKNET_HOSTED_BY=NetFoundry
ZROK_FREE_PRICE_USD_PER_MONTH=0
ZROK_FREE_CREDIT_CARD_REQUIRED=NO
ZROK_FREE_DAILY_DATA_LIMIT_GB=5
ZROK_FREE_ENVIRONMENT_LIMIT=25
ZROK_FREE_SHARE_BACKEND_LIMIT=50
ZROK_FREE_PRIVATE_ACCESS_FRONTEND_LIMIT=50
ZROK_FREE_SUPPORT=COMMUNITY
ZROK_PRODUCTION_SLA_INCLUDED_FREE=NO
```

The same official source states that zrok public reverse proxying can expose an application without opening inbound ports, and zrokNET public shares present trusted HTTPS certificates automatically.

Production workloads, SLAs, dedicated infrastructure, and custom limits are commercial offerings. Therefore free zrok may be considered only as a bounded pilot surface and must never be labeled production-equivalent.

## 5. zrok v2 authority surface

The current upstream release line is zrok v2. The latest upstream release observed for this research is:

```text
ZROK_CURRENT_RESEARCH_RELEASE=v2.0.4
ZROK_V2_BINARY_NAME=zrok2
```

zrok v2 removed the old v1 `reserve`, `release`, and `share reserved` commands. Namespaces and reserved names replace the old reserved-share model.

The v2 changelog records that:

- an ephemeral name can be upgraded to a reserved name;
- the Agent can restart shares containing reserved names; and
- v2.0.4 repaired reservation destruction on graceful shutdown/abnormal subordinate-process exit, allowing reattachment after restart unless explicitly released.

Therefore:

```text
ZROK_V1_RESERVE_COMMANDS_AS_EXECUTION_AUTHORITY=FORBIDDEN
ZROK_V2_NAMESPACE_MODEL_REQUIRED=YES
ZROK_V2_RESERVED_NAME_MODEL_REQUIRED=YES
ZROK_STABLE_PUBLIC_NAME_CAPABILITY=SUPPORTED_BY_UPSTREAM_V2
ZROK_STABLE_PUBLIC_NAME_ON_HOSTED_ZROKNET=UNPROVEN_BLOCKING
```

No command in this research document is execution authorization. Any later installation/setup slice must pin exact release, asset, SHA-256, platform, configuration model, and hosted-service compatibility from fresh evidence.

## 6. Interstitial boundary

The free hosted plan states that an anti-phishing interstitial can be shown to first-time visitors of public shares, and that adding a verified credit card removes interstitial pages.

A zrok/OpenZiti official article explains the intended interstitial behavior: it is designed for interactive browser clients whose `User-Agent` starts with `Mozilla/5.0`; non-browser HTTP clients bypass it.

GitHub's current webhook documentation states that webhook deliveries always use a `User-Agent` with prefix:

```text
GitHub-Hookshot/
```

This combination is promising, but it is not sufficient to claim hosted zrokNET currently bypasses the interstitial for GitHub webhook requests. Hosted frontend configuration can differ or change.

```text
ZROK_FREE_INTERSTITIAL_EXISTS=YES
ZROK_INTERSTITIAL_DOCUMENTED_INTERACTIVE_PREFIX=Mozilla/5.0
GITHUB_WEBHOOK_USER_AGENT_PREFIX=GitHub-Hookshot/
ZROK_GITHUB_HOOKSHOT_INTERSTITIAL_BYPASS=UNPROVEN_BLOCKING
PAYMENT_CARD_TO_REMOVE_INTERSTITIAL=FORBIDDEN
```

The later proof must demonstrate the behavior on the current hosted zrokNET public frontend without adding a payment method and without sending a real GitHub webhook.

## 7. Webhook transparency theorem required before selection

GitHub warns that a proxy or load balancer must not modify the webhook payload or headers before signature verification. The existing KODAC handler authenticates raw webhook bytes with `X-Hub-Signature-256` before processing.

The following values are **required future proof results**, not current PASS evidence:

```text
REQUIRED_ZROK_PUBLIC_HTTPS=PASS
REQUIRED_ZROK_PUBLIC_FRONTEND_TLS_TRUST=PASS
REQUIRED_ZROK_TARGET_LOOPBACK_ONLY=PASS
REQUIRED_ZROK_NO_INBOUND_ROUTER_PORT=PASS

REQUIRED_ZROK_RAW_BODY_BYTE_FOR_BYTE_PRESERVATION=PASS
REQUIRED_ZROK_CONTENT_TYPE_PRESERVATION=PASS
REQUIRED_ZROK_X_HUB_SIGNATURE_256_PRESERVATION=PASS
REQUIRED_ZROK_X_GITHUB_DELIVERY_PRESERVATION=PASS
REQUIRED_ZROK_X_GITHUB_EVENT_PRESERVATION=PASS
REQUIRED_ZROK_USER_AGENT_GITHUB_HOOKSHOT_PATH_NO_INTERSTITIAL=PASS

REQUIRED_ZROK_SYNTHETIC_SIGNED_WEBHOOK_HTTP_STATUS=2XX
REQUIRED_ZROK_SYNTHETIC_SIGNED_WEBHOOK_ELAPSED_LT_10S=PASS
REQUIRED_ZROK_INVALID_SIGNATURE_REJECTED=PASS
```

Current state remains:

```text
ZROK_PUBLIC_HTTPS_RUNTIME_PROOF=UNPROVEN_BLOCKING
ZROK_RAW_BODY_BYTE_FOR_BYTE_PRESERVATION=UNPROVEN_BLOCKING
ZROK_CRITICAL_GITHUB_HEADER_PRESERVATION=UNPROVEN_BLOCKING
ZROK_GITHUB_HOOKSHOT_INTERSTITIAL_BYPASS=UNPROVEN_BLOCKING
ZROK_SYNTHETIC_SIGNED_WEBHOOK_ELAPSED_LT_10S=UNPROVEN_BLOCKING
```

No real GitHub delivery may be used for the initial synthetic theorem.

### 7.1 GitHub-source and request-surface restriction

GitHub's current private-system webhook guidance recommends configuring the reverse proxy so that it forwards only HTTPS `POST` requests from the GitHub `hooks` IP ranges returned by `GET /meta`.

No current evidence proves that a user of the hosted zrokNET free public frontend can enforce that source-IP restriction at the public frontdoor. No current evidence also proves that original client IP information is preserved in a trustworthy, non-spoofable form that could safely support equivalent filtering behind the zrok frontdoor.

Therefore:

```text
ZROK_GITHUB_HOOKS_SOURCE_IP_RESTRICTION_CAPABILITY=UNPROVEN_BLOCKING
ZROK_ORIGINAL_CLIENT_IP_TRUSTWORTHY_PRESERVATION=UNPROVEN_BLOCKING
ZROK_HTTPS_POST_ONLY_FRONTDOOR_RESTRICTION=UNPROVEN_BLOCKING
ZROK_WEBHOOK_PATH_ONLY_FRONTDOOR_RESTRICTION=UNPROVEN_BLOCKING
```

A public share that forwards arbitrary Internet methods/paths to the application cannot silently be treated as satisfying GitHub's recommended reverse-proxy hardening merely because application-level HMAC validation exists.

A later proof must establish one of these outcomes:

```text
A=HOSTED_ZROK_FRONTDOOR_ENFORCES_GITHUB_HOOKS_IP_PLUS_POST_PLUS_PATH
B=SEPARATELY_REVIEWED_COMPENSATING_FILTER_WITH_TRUSTWORTHY_SOURCE_PROVENANCE
C=ZROK_REJECTED_FOR_THIS_HIGH_ASSURANCE_PILOT
```

If source provenance is supplied through a forwarded header, the proof must establish that the hosted frontdoor overwrites/sanitizes the header and that an arbitrary Internet client cannot spoof the trusted source value. HMAC remains mandatory in every case and is never replaced by IP filtering.

## 8. Secret boundary

A hosted zrok environment requires account/environment authority. Any account token, enable token, API credential, or equivalent capability must be treated as infrastructure secret material.

```text
ZROK_ACCOUNT_TOKEN_SECRET=YES
ZROK_ENABLE_TOKEN_SECRET=YES
ZROK_TOKEN_IN_CHAT=FORBIDDEN
ZROK_TOKEN_IN_REPOSITORY=FORBIDDEN
ZROK_TOKEN_IN_IMAGE=FORBIDDEN
ZROK_TOKEN_IN_LOGS=FORBIDDEN
ZROK_TOKEN_PROOF_OUTPUT=REDACTED_NON_SECRET_METADATA_ONLY
```

No zrok credential exists or is requested by this slice.

## 9. Availability boundary

The free hosted service does not include a production SLA. Current status history also demonstrates real service incidents, including public-share/service disruption in July 2026 and a public-share creation HTTP 500 incident in February 2026.

```text
ZROK_FREE_SLA=NO
ZROK_FREE_PRODUCTION_EQUIVALENCE=NO
ZROK_EXTERNAL_SERVICE_DEPENDENCY=YES
ZROK_RECENT_INCIDENT_HISTORY=YES
```

GitHub records webhook deliveries as failures if the endpoint takes longer than 10 seconds, and GitHub does not automatically redeliver failed deliveries.

A later bounded pilot therefore still requires health/availability monitoring and a separately authorized failed-delivery recovery design. The absence of an SLA does not by itself disqualify a non-production pilot, but it prevents any production-equivalence claim.

## 10. Network/privacy comparison

### Candidate A — zrokNET free public share

```text
PUBLIC_INBOUND_ROUTER_PORT_REQUIRED=NO
CGNAT_BLOCKING=NO_EXPECTED
FOUNDER_PUBLIC_IP_DIRECTLY_PUBLISHED_BY_DNS=NO_EXPECTED
APP_PUBLIC_BIND_REQUIRED=NO
APP_LOOPBACK_TARGET_PRESERVABLE=YES
POSTGRES_PUBLIC_BIND_REQUIRED=NO
THIRD_PARTY_INGRESS_DEPENDENCY=YES
EXTERNAL_FRONTDOOR_TERMINATION=YES
FREE_SLA=NO
GITHUB_HOOKS_SOURCE_IP_FRONTDOOR_FILTER=UNPROVEN_BLOCKING
```

### Candidate B — DuckDNS + Caddy direct founder-host

```text
PUBLIC_INBOUND_ROUTER_PATH_REQUIRED=YES
CGNAT_BLOCKING=POSSIBLE
FOUNDER_PUBLIC_IP_PUBLISHED_BY_DNS=YES
APP_PUBLIC_BIND_REQUIRED=NO
APP_LOOPBACK_TARGET_PRESERVABLE=YES
POSTGRES_PUBLIC_BIND_REQUIRED=NO
THIRD_PARTY_DNS_CA_DEPENDENCY=YES
TLS_TERMINATION_ON_FOUNDER_HOST=YES
FREE_SLA=NO
GITHUB_HOOKS_SOURCE_IP_FILTER=CONFIGURABLE_IN_PRINCIPLE_PROOF_REQUIRED
```

Both preserve the existing Go app and local PostgreSQL architecture in principle. zrok has the smaller founder-network exposure and avoids the CGNAT/router-port dependency, while direct Caddy reduces reliance on a hosted ingress frontdoor and keeps TLS termination and request filtering under founder control.

## 11. Repaired finalist set

The previous finalist count of one is superseded.

```text
ZERO_COST_DIRECT_INGRESS_FINALIST_COUNT=2

FINALIST_A=ZROKNET_FREE_PUBLIC_SHARE
FINALIST_A_STATUS=COMPATIBILITY_PROOF_REQUIRED

FINALIST_B=DUCKDNS_PLUS_CADDY_DIRECT_FOUNDER_HOST
FINALIST_B_STATUS=NETWORK_PROOF_REQUIRED

INGRESS_SELECTED_FOR_EXECUTION=NO
```

The preferred **first proof target** is zrok because a successful result could preserve loopback-only app hosting without opening router/firewall ingress or exposing the founder public IP through project DNS. This proof-order preference remains conditional on satisfying the GitHub-source/request-surface hardening gate above.

```text
FIRST_PROOF_TARGET=ZROKNET_FREE_PUBLIC_SHARE
FIRST_PROOF_TARGET_REASON=MINIMIZE_FOUNDER_NETWORK_EXPOSURE_AND_AVOID_CGNAT_ROUTER_MUTATION
FIRST_PROOF_TARGET_EXECUTION_AUTHORIZED=NO
```

This preference is a proof-order decision only, not a final ingress selection.

## 12. Current zrok compatibility-gate state

The following block records **current state**, not desired future results:

```text
ZROK_FREE_COST_USD=0
ZROK_PAYMENT_METHOD_REQUIRED=NO
ZROK_PAID_INTERSTITIAL_BYPASS_ALLOWED=NO

ZROK_WINDOWS_V2_ARTIFACT_PROVEN=UNPROVEN_BLOCKING
ZROK_EXECUTION_RELEASE_PIN=UNPROVEN_BLOCKING
ZROK_PINNED_BINARY_SHA256=UNPROVEN_BLOCKING
ZROK_STABLE_RESERVED_NAME_V2_UPSTREAM_CAPABILITY=DOCUMENTED
ZROK_HOSTED_RESERVED_NAME_PERSISTENCE=UNPROVEN_BLOCKING
ZROK_GITHUB_HOOKSHOT_INTERSTITIAL_BYPASS=UNPROVEN_BLOCKING
ZROK_RAW_BODY_PRESERVATION=UNPROVEN_BLOCKING
ZROK_CRITICAL_GITHUB_HEADER_PRESERVATION=UNPROVEN_BLOCKING
ZROK_GITHUB_HOOKS_SOURCE_IP_RESTRICTION_CAPABILITY=UNPROVEN_BLOCKING
ZROK_ORIGINAL_CLIENT_IP_TRUSTWORTHY_PRESERVATION=UNPROVEN_BLOCKING
ZROK_HTTPS_POST_ONLY_FRONTDOOR_RESTRICTION=UNPROVEN_BLOCKING
ZROK_WEBHOOK_PATH_ONLY_FRONTDOOR_RESTRICTION=UNPROVEN_BLOCKING
ZROK_RESPONSE_DEADLINE_LT_10S=UNPROVEN_BLOCKING
ZROK_APP_LOOPBACK_ONLY=REQUIRED_NOT_EXECUTED
ZROK_POSTGRES_NONPUBLIC=REQUIRED_NOT_EXECUTED
ZROK_TOKEN_SECRET_BOUNDARY=UNPROVEN_BLOCKING
ZROK_DAILY_DATA_BUDGET_WITHIN_5_GB=UNPROVEN_BLOCKING
ZROK_PRODUCTION_EQUIVALENCE=NO
```

Any failed load-bearing gate rejects zrok for this pilot and returns the decision to DuckDNS/Caddy proof or `INGRESS=UNSELECTED`.

## 13. Next bounded slice if this repair becomes canonical

Authorize only a separate **zrok zero-cost compatibility proof authorization**.

That next authorization must itself separate mutation levels. Before any account/public-share creation, it must define and independently review:

1. exact zrok v2 Windows artifact provenance and hash verification;
2. whether installation is necessary or a portable binary can be used without system-level mutation;
3. account/environment token secret handling;
4. free-plan/no-card evidence;
5. reserved-name lifecycle and teardown ownership;
6. synthetic-only public ingress test data;
7. exact raw-body/header preservation assertions;
8. interstitial-bypass assertion for a `GitHub-Hookshot/` User-Agent without payment-card verification;
9. GitHub `hooks` source-IP restriction capability or an explicitly reviewed trustworthy compensating filter;
10. HTTPS-POST-only and webhook-path-only request-surface restriction capability;
11. `<10s` response-budget measurement;
12. 5 GB/day bounded-data budget;
13. cleanup/revocation procedure that removes shares/names/environment authority.

This repair does **not** authorize those actions.

## 14. Explicit non-grants

```text
ZROK_DOWNLOAD=NO
ZROK_INSTALL=NO
ZROK_EXECUTE=NO
ZROK_INVITE_OR_SIGNUP=NO
ZROK_ACCOUNT_CREATE=NO
ZROK_LOGIN=NO
ZROK_ENABLE=NO
ZROK_ENVIRONMENT_CREATE=NO
ZROK_NAMESPACE_CREATE=NO
ZROK_RESERVED_NAME_CREATE=NO
ZROK_SHARE_CREATE=NO
ZROK_AGENT_START=NO
ZROK_PUBLIC_ENDPOINT_CREATE=NO
ZROK_PAYMENT_CARD_ADD=NO

DUCKDNS_ACCOUNT_CREATE=NO
DUCKDNS_DOMAIN_CREATE=NO
CADDY_INSTALL=NO
PUBLIC_PORT_OPEN=NO
ROUTER_PORT_FORWARD=NO
FIREWALL_CHANGE=NO
CERTIFICATE_REQUEST=NO

REAL_WEBHOOK=NO
REAL_GITHUB_APP_SECRET=NO
GITHUB_APP_MUTATION=NO
AG1C=BLOCKED
AG2=BLOCKED
TRUST_ROOT_ESTABLISHMENT=BLOCKED
B1_V2=NOT_AUTHORIZED
B2A_V2=NOT_AUTHORIZED
B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
```

## 15. Current primary sources reviewed

Public primary/upstream sources reviewed on 2026-08-22:

- GitHub private webhook systems: `https://docs.github.com/en/webhooks/using-webhooks/delivering-webhooks-to-private-systems`
- GitHub webhook headers/events: `https://docs.github.com/en/webhooks/webhook-events-and-payloads`
- GitHub failed deliveries: `https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries`
- GitHub webhook troubleshooting: `https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks`
- GitHub meta/IP ranges: `https://api.github.com/meta`
- zrok pricing: `https://zrok.io/pricing/`
- zrok homepage: `https://zrok.io/`
- zrok/OpenZiti interstitial explanation: `https://blog.openziti.io/zrok-is-growing-up`
- zrok upstream releases: `https://github.com/openziti/zrok/releases`
- zrok upstream changelog: `https://github.com/openziti/zrok/blob/main/CHANGELOG.md`
- zrok status: `https://status.zrok.io/`

## 16. Review and merge gate

This repair may merge only if one exact head proves:

```text
CHANGED_FILE_COUNT=1
CHANGED_FILE=this_document_only
DOCS_ONLY=YES
APP_SOURCE_REPOSITORY_MUTATED=NO
WORKFLOW_SEMANTICS_MUTATED=NO
BRANCH_PROTECTION_MUTATED=NO
EXTERNAL_RESOURCE_MUTATION=NO
NETWORK_MUTATION=NO
REQUIRED_REPOSITORY_GATES=PASS
INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_MATERIAL_FINDINGS=0
```

A docs-only runtime execution skip is permitted only when the canonical runtime-change classifier and stable runtime gate pass on the exact candidate head.

## 17. Terminal candidate state

```text
ZERO_COST_INGRESS_RESEARCH_REPAIR=COMPLETE_CANDIDATE
PR_157_SINGLE_FINALIST_CLAIM=SUPERSEDED_IF_THIS_REPAIR_MERGES
ZERO_COST_DIRECT_INGRESS_FINALIST_COUNT=2
FIRST_PROOF_TARGET=ZROKNET_FREE_PUBLIC_SHARE
FIRST_PROOF_TARGET_STATUS=NOT_AUTHORIZED_FOR_EXECUTION
NEXT_SLICE=ZROK_ZERO_COST_COMPATIBILITY_PROOF_AUTHORIZATION

EXTERNAL_MUTATION=NO
NETWORK_MUTATION=NO
PROVIDER_SPEND_USD=0.00
H4_COMPLETE=NO
```
