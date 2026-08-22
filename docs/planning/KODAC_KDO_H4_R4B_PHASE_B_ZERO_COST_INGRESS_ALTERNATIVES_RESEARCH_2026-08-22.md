# KODAC KDO H4-R4B Phase-B — Zero-Cost Ingress Alternatives Research

Date: 2026-08-22  
Status: **RESEARCH CANDIDATE — DOCS ONLY — NO INSTALLATION — NO ACCOUNT CREATION — NO NETWORK EXPOSURE**  
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Research a zero-provider-spend ingress path after canonical ZC0-E01 rejected Tailscale Funnel under the current eligibility topology.

This document is research and authorization framing only. It does not create, configure, install, expose, register, deploy, authenticate, forward, or activate anything.

```text
NEW_PROVIDER_SPEND_USD=0.00
FREE_TRIAL_AS_ZERO_COST=FORBIDDEN
CREDIT_AS_ZERO_COST=FORBIDDEN
PAYMENT_METHOD_REQUIRED=NO
BILLING_ENABLED_RESOURCE_AS_ZERO_COST=FORBIDDEN
PUBLIC_NETWORK_MUTATION_BY_THIS_SLICE=NO
ACCOUNT_CREATION_BY_THIS_SLICE=NO
SOFTWARE_INSTALLATION_BY_THIS_SLICE=NO
REAL_SECRET_ACCESS_BY_THIS_SLICE=NO
WEBHOOK_ACTIVATION_BY_THIS_SLICE=NO
```

## 2. Canonical baseline

```text
KODAC_CANONICAL_MAIN=a5c2e0132350ea0182ec59f4a0ab3bc1269294c0
KODAC_CANONICAL_TREE=18e45df4ad6f926e56b475d75008649df858489b
PR_156=MERGED_CANONICAL
ZC0_E01=RESOLVED_FAIL_CLOSED
TAILSCALE_FUNNEL=REJECTED_UNDER_CURRENT_ELIGIBILITY_TOPOLOGY
AG1B_ZERO_COST_INGRESS=UNSELECTED

APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_CANONICAL_MAIN=79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40
APP_SOURCE_CANONICAL_TREE=56350e47a524d5d1a798559259f4f2f4800a513f

APP_BUILD_GO_VERSION=go1.26.6
APP_BUILD_GOOS=linux
APP_BUILD_GOARCH=amd64
APP_BUILD_CGO_ENABLED=0
```

Existing local PostgreSQL 16, append-only, Go build, and real `store.Postgres` rehearsal evidence remains non-authoritative feasibility evidence only.

## 3. Required properties

Any direct ingress finalist must satisfy all of the following before a later execution authorization can exist:

```text
NEW_PROVIDER_SPEND_USD=0.00
NO_FREE_TRIAL_DEPENDENCY=YES
NO_CREDIT_DEPENDENCY=YES
NO_PAYMENT_METHOD_REQUIRED=YES
STABLE_PUBLIC_HTTPS_ENDPOINT_REQUIRED=YES
GITHUB_WEBHOOK_COMPATIBLE=YES
GITHUB_WEBHOOK_2XX_WITHIN_SECONDS=10
WINDOWS_11_FOUNDER_HOST_COMPATIBLE=YES
APP_HOST_REMAINS_LOOPBACK_ONLY=YES
POSTGRES_REMAINS_NONPUBLIC=YES
WEBHOOK_RAW_BODY_HMAC_PRESERVED=YES
REAL_SECRET_ACTIVATION_SEPARATELY_GATED=YES
NO_PRODUCTION_EQUIVALENCE_CLAIM_FROM_FREE_PILOT=YES
```

GitHub records a webhook delivery as failed if the endpoint does not respond within 10 seconds, and GitHub does not automatically redeliver failed webhook deliveries. Availability therefore remains load-bearing even for a bounded pilot.

## 4. Candidate matrix

| Candidate | `$0` / no card | Stable public HTTPS | Existing Go app preserved | Local PostgreSQL preserved | Security / availability result | Research verdict |
|---|---|---|---|---|---|---|
| Founder-hosted direct HTTPS + DuckDNS + Caddy | Conditional yes | Conditional yes | Yes | Yes | Requires public routability, firewall/NAT proof, DDNS token boundary, no SLA | **FINALIST — PROOF REQUIRED** |
| Smee.io relay | Free development service | Channel URL persists | Mostly | Yes | Development-only; channels unauthenticated; payload relay/inspection surface | **REJECT** |
| Cloudflare Quick Tunnel | Free | No: generated random hostname | Yes | Yes | Testing/development only; no SLA/uptime guarantee | **REJECT** |
| Render Free web service | Free tier; no card can suspend instead of billing | Yes | Deployable | No local DB attachment | Sleeps after 15 min; wake can take about one minute; docs say not for production | **REJECT** |
| Koyeb free instance | Free instance exists | Yes | Deployable | No local DB attachment | Credit card required; signup can place hold and charge plan | **REJECT** |
| GitHub-hosted Actions event processing | Free standard runners in public repo | **No public endpoint needed** | No, requires adapter/redesign | No direct local DB | Strong `$0` compute option but changes trust/event/persistence architecture | **ARCHITECTURAL FALLBACK ONLY** |
| Self-hosted GitHub Actions runner on founder host | GitHub runner usage free | No public endpoint needed | Requires adapter/redesign | Could reach local DB | GitHub explicitly warns self-hosted runners should almost never be used for public repos | **REJECT FOR CURRENT PUBLIC REPO** |

The finalist designation is not execution selection. It means only that the candidate is worth a separate non-mutating feasibility proof.

## 5. Finalist A — founder-hosted direct HTTPS with DuckDNS and Caddy

### 5.1 Proposed bounded topology

If later proven and separately authorized, the intended topology would be:

```text
GitHub webhook
    |
    | HTTPS :443
    v
<dedicated-name>.duckdns.org
    |
    | public IPv4/IPv6 resolution
    v
founder router / network edge
    |
    | narrowly authorized inbound HTTPS path
    v
Caddy on Windows 11 host
    |
    | reverse proxy over Windows loopback
    v
127.0.0.1:<APP_HOST_PORT>
    |
    | Docker Desktop host-port bridge
    v
KODAC Phase-B Go container
    |
    | private Docker network
    v
PostgreSQL 16 container + durable volume
```

The application itself remains loopback-only. PostgreSQL remains non-public. Only the dedicated reverse-proxy ingress process would be eligible to bind publicly in a later, separately authorized slice.

### 5.2 Why this path survives research

DuckDNS currently describes itself as free dynamic DNS and provides free `duckdns.org` subdomains that can track IPv4 and IPv6 addresses. Its update API supports HTTPS.

Caddy currently supports automatic HTTPS and can act as a TLS-terminating reverse proxy to a localhost backend. For public DNS names, its standard automatic-HTTPS path expects correct public DNS and external reachability on the relevant ACME/HTTPS ports.

Let's Encrypt remains a free automated public certificate authority.

This architecture has one important security advantage over webhook-relay services: the webhook payload does not need to transit a development relay that exposes payloads to channel viewers. DNS and certificate services do not terminate the application payload after TLS reaches the founder host.

### 5.3 Load-bearing unresolved blockers

The path is not selectable until all of these become proven:

```text
DIRECT_INGRESS_PUBLIC_ROUTABILITY=UNPROVEN_BLOCKING
DIRECT_INGRESS_CGNAT_STATUS=UNPROVEN_BLOCKING
DIRECT_INGRESS_ISP_INBOUND_POLICY=UNPROVEN_BLOCKING
DIRECT_INGRESS_ROUTER_CAPABILITY=UNPROVEN_BLOCKING
DIRECT_INGRESS_WINDOWS_FIREWALL_BOUNDARY=UNPROVEN_BLOCKING
DIRECT_INGRESS_ACME_CHALLENGE_METHOD=UNSELECTED_BLOCKING
DIRECT_INGRESS_DDNS_ACCOUNT_ELIGIBILITY=UNPROVEN_BLOCKING
DIRECT_INGRESS_DDNS_HOSTNAME_RETENTION=UNPROVEN_BLOCKING
DIRECT_INGRESS_DDNS_TOKEN_SECRET_BOUNDARY=UNPROVEN_BLOCKING
DIRECT_INGRESS_HOST_POWER_AVAILABILITY=FOUNDER_DEPENDENT
DIRECT_INGRESS_HOST_INTERNET_AVAILABILITY=FOUNDER_DEPENDENT
DIRECT_INGRESS_PROVIDER_SLA=NO
DIRECT_INGRESS_PRODUCTION_EQUIVALENCE=NO
```

DuckDNS terms reserve the ability to suspend or terminate an account/domain. Therefore the existence of a stable hostname mechanism is not an uptime or permanence guarantee.

### 5.4 Privacy and attack-surface consequence

Unlike an outbound tunnel, direct ingress can reveal the founder network's public IP and requires an Internet-reachable reverse-proxy boundary. That consequence must be explicit and separately accepted before any network mutation.

```text
FOUNDER_PUBLIC_IP_DISCLOSURE=REQUIRES_EXPLICIT_LATER_ACCEPTANCE
INBOUND_ROUTER_OR_FIREWALL_CHANGE=REQUIRES_EXPLICIT_LATER_AUTHORIZATION
PUBLIC_REVERSE_PROXY_ATTACK_SURFACE=REQUIRES_EXPLICIT_LATER_AUTHORIZATION
APP_DIRECT_PUBLIC_BIND=FORBIDDEN
DATABASE_PUBLIC_BIND=FORBIDDEN
```

### 5.5 DDNS token boundary

A DuckDNS update token would be a new infrastructure credential with authority to change the webhook hostname's address mapping. It must never be treated as an ordinary non-secret configuration value.

Any later setup design must bind at least:

```text
DDNS_UPDATE_TOKEN=SECRET
DDNS_UPDATE_TOKEN_IN_CHAT=FORBIDDEN
DDNS_UPDATE_TOKEN_IN_REPOSITORY=FORBIDDEN
DDNS_UPDATE_TOKEN_IN_IMAGE=FORBIDDEN
DDNS_UPDATE_TOKEN_IN_LOGS=FORBIDDEN
DDNS_UPDATE_TOKEN_SCOPE=DEDICATED_PILOT_HOSTNAME_ONLY_IF_PROVIDER_SUPPORTS
DDNS_UPDATE_FAILURE=OBSERVABLE
```

This candidate does not create a DuckDNS account, domain, or token.

## 6. Rejected relay candidate — Smee.io

GitHub documentation uses Smee as a development webhook proxy, but the upstream Smee project explicitly states that it is intended for development, not production. Its channels are not authenticated; anyone with the channel ID can see payloads sent to the channel.

That conflicts with a load-bearing authority webhook carrying authenticated event material.

```text
SMEE_ZERO_COST=YES
SMEE_LOCAL_FORWARDING=YES
SMEE_PRODUCTION_DESIGN=NO
SMEE_CHANNEL_AUTHENTICATION=NO
SMEE_LOAD_BEARING_INGRESS=REJECT
```

## 7. Rejected tunnel candidate — Cloudflare Quick Tunnel

Cloudflare currently states that Quick Tunnels are for testing and development only. They generate a random `trycloudflare.com` hostname, provide no SLA or uptime guarantee, and have request limitations.

```text
CLOUDFLARE_QUICK_TUNNEL_COST_USD=0
CLOUDFLARE_QUICK_TUNNEL_RANDOM_HOSTNAME=YES
CLOUDFLARE_QUICK_TUNNEL_PRODUCTION_INTENDED=NO
CLOUDFLARE_QUICK_TUNNEL_SLA=NO
CLOUDFLARE_QUICK_TUNNEL=REJECT
```

A remotely managed named Cloudflare Tunnel is not advanced here because the canonical zero-cost requirements prohibit a new domain purchase and current proof does not bind an already-controlled qualifying domain to this project.

## 8. Rejected hosted candidate — Render Free

Render's current documentation says free web services spin down after 15 minutes with no inbound traffic and can take about one minute to wake. Render explicitly says free instances should not be used for production applications.

That cannot satisfy a load-bearing GitHub webhook path whose response must arrive within 10 seconds after idle periods.

```text
RENDER_FREE_WEB_SERVICE=AVAILABLE
RENDER_FREE_IDLE_SLEEP_MINUTES=15
RENDER_FREE_COLD_START_APPROX_ONE_MINUTE=YES
RENDER_FREE_GITHUB_WEBHOOK_10S_RELIABILITY=FAIL
RENDER_FREE=REJECT
```

## 9. Rejected hosted candidate — Koyeb

Koyeb currently exposes a free instance, but its current pricing FAQ says account validation requires a credit card, includes a `$29` pre-authorization hold, and the signup flow can charge a prorated plan amount before downgrade.

This violates the project's stricter rule that a zero-cost candidate must require no payment method and create no billing exposure.

```text
KOYEB_FREE_INSTANCE_EXISTS=YES
KOYEB_CREDIT_CARD_REQUIRED=YES
KOYEB_PAYMENT_PREAUTHORIZATION=YES
KOYEB_HARD_ZERO_COST_POLICY=FAIL
KOYEB=REJECT
```

## 10. Architectural fallback — GitHub-hosted Actions

GitHub currently states that standard GitHub-hosted Actions runners are free and unlimited for public repositories. GitHub Actions natively supports the relevant event families including `issue_comment`, `pull_request`, and `pull_request_review`.

The per-job `GITHUB_TOKEN` is a short-lived installation token scoped to the repository, and workflow permissions can be restricted.

However, this is not a drop-in ingress replacement for the canonical Phase-B app:

- the current app's authority boundary starts with raw webhook bytes and HMAC verification;
- the app currently bootstraps its own GitHub App installation token;
- the current receipt store is local PostgreSQL 16;
- standard hosted runners are ephemeral and cannot directly reach a non-public founder-host PostgreSQL database;
- changing from webhook delivery to Actions event contexts changes provenance, replay, trust, secret, and check-run semantics.

Therefore:

```text
GITHUB_ACTIONS_STANDARD_PUBLIC_RUNNER_COST=0
GITHUB_ACTIONS_RELEVANT_NATIVE_EVENTS=YES
GITHUB_ACTIONS_PUBLIC_HTTPS_INGRESS_REQUIRED=NO
CURRENT_APP_DROP_IN_COMPATIBILITY=NO
CURRENT_LOCAL_POSTGRES_DROP_IN_COMPATIBILITY=NO
TRUST_MODEL_CHANGE=YES
SOURCE_AND_WORKFLOW_REDESIGN_REQUIRED=YES
GITHUB_ACTIONS_NATIVE=NOT_SELECTED
```

It may be reconsidered only under a separate architecture-replacement authorization if direct ingress fails.

## 11. Rejected architectural variant — self-hosted GitHub Actions runner

Self-hosting an Actions runner on the founder machine could theoretically reach the local database without public ingress and GitHub does not charge for self-hosted runner usage.

However, GitHub's security guidance explicitly recommends self-hosted runners only for private repositories and states they should almost never be used for public repositories because untrusted pull-request code can persistently compromise the runner environment and steal secrets/tokens.

KODAC is public. Therefore:

```text
SELF_HOSTED_ACTIONS_COST_FROM_GITHUB=0
SELF_HOSTED_ACTIONS_LOCAL_DB_REACHABLE=POSSIBLE
KODAC_REPOSITORY_VISIBILITY=PUBLIC
GITHUB_PUBLIC_REPO_SELF_HOSTED_RUNNER_WARNING=APPLIES
SELF_HOSTED_ACTIONS_RUNNER=REJECT_SECURITY
```

No runner registration is authorized.

## 12. Research conclusion

The current zero-cost landscape produces exactly one direct-ingress finalist that preserves the canonical app and local PostgreSQL architecture:

```text
ZERO_COST_DIRECT_INGRESS_FINALIST_COUNT=1
ZERO_COST_DIRECT_INGRESS_FINALIST=DUCKDNS_PLUS_CADDY_DIRECT_FOUNDER_HOST
FINALIST_EXECUTION_AUTHORIZED=NO
FINALIST_NETWORK_MUTATION_AUTHORIZED=NO
```

The finalist is only conditionally viable. The decisive unknown is not software functionality; it is whether the founder Internet connection can accept safe inbound HTTPS without CGNAT/ISP blocking and without violating the intended network/privacy boundary.

If that feasibility proof fails, the direct-ingress finalist count becomes zero and the project must choose between:

1. keeping the zero-cost pilot blocked; or
2. separately authorizing an architectural redesign such as GitHub-hosted Actions-native event processing.

No paid fallback is allowed.

## 13. Next bounded slice

If this research becomes canonical, authorize only a separate **non-mutating direct-ingress network feasibility proof**.

That proof may establish, without opening any port or creating any service account:

```text
FOUNDER_EXTERNAL_ADDRESS_FAMILY=OBSERVED_NON_SECRET
FOUNDER_NETWORK_CGNAT_CLASSIFICATION=PASS_OR_FAIL
FOUNDER_PUBLIC_ROUTABILITY_PREREQUISITE=PASS_OR_FAIL
ISP_INBOUND_HTTPS_POLICY=PASS_OR_FAIL_OR_UNPROVEN
ROUTER_SUPPORTS_EXPLICIT_NARROW_PORT_FORWARDING=PASS_OR_FAIL_OR_UNPROVEN
WINDOWS_HOST_CAN_RETAIN_APP_LOOPBACK_BOUNDARY=PASS_OR_FAIL
PRIVACY_IMPACT_ACCEPTANCE=REQUIRED_BEFORE_ANY_EXPOSURE
```

Rules for that proof:

```text
ROUTER_CREDENTIAL_IN_CHAT=FORBIDDEN
ROUTER_CONFIGURATION_CHANGE=NO
PORT_FORWARD_CREATION=NO
FIREWALL_RULE_CHANGE=NO
DDNS_ACCOUNT_CREATION=NO
DDNS_DOMAIN_CREATION=NO
DDNS_TOKEN_CREATION=NO
CADDY_INSTALLATION=NO
ACME_ACCOUNT_OR_CERTIFICATE_REQUEST=NO
PUBLIC_LISTENER_START=NO
WEBHOOK_MUTATION=NO
REAL_SECRET_ACCESS=NO
```

If the network is behind CGNAT or inbound HTTPS cannot be supported under the hard constraints, the direct candidate fails closed.

## 14. Current primary sources reviewed

Public primary sources reviewed on 2026-08-22:

- DuckDNS home/about/spec/FAQ/terms: `https://www.duckdns.org/`, `https://www.duckdns.org/about.jsp`, `https://www.duckdns.org/spec.jsp`, `https://www.duckdns.org/faqs.jsp`, `https://www.duckdns.org/tac.jsp`
- Caddy automatic HTTPS and HTTPS quick start: `https://caddyserver.com/docs/automatic-https`, `https://caddyserver.com/docs/quick-starts/https`
- Let's Encrypt: `https://letsencrypt.org/`
- GitHub webhook handling/failures/troubleshooting: `https://docs.github.com/en/webhooks/using-webhooks/handling-webhook-deliveries`, `https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries`, `https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks`
- Smee upstream: `https://github.com/probot/smee.io`, `https://github.com/probot/smee-client`
- Cloudflare Quick Tunnels: `https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/do-more-with-tunnels/trycloudflare/`
- Render Free: `https://render.com/docs/free`
- Koyeb pricing FAQ: `https://www.koyeb.com/docs/faqs/pricing`
- GitHub Actions billing/events/token/self-hosted security: `https://docs.github.com/en/billing/concepts/product-billing/github-actions`, `https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows`, `https://docs.github.com/en/actions/concepts/security/github_token`, `https://docs.github.com/en/actions/reference/security/secure-use`

## 15. Review and merge gate

This research candidate may merge only if one exact head proves:

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

A docs-only runtime execution skip is permitted only when the canonical runtime-change classifier and stable runtime gate both pass on the exact candidate head.

## 16. Terminal candidate state

```text
ZERO_COST_INGRESS_RESEARCH=COMPLETE_CANDIDATE
DIRECT_FINALIST=DUCKDNS_PLUS_CADDY_DIRECT_FOUNDER_HOST
DIRECT_FINALIST_STATUS=CONDITIONAL_NETWORK_PROOF_REQUIRED
DIRECT_FINALIST_SELECTED_FOR_EXECUTION=NO
GITHUB_ACTIONS_NATIVE=ARCHITECTURAL_FALLBACK_ONLY
NEXT_SLICE=DIRECT_INGRESS_NONMUTATING_NETWORK_FEASIBILITY_PROOF_AUTHORIZATION

ACCOUNT_CREATED=NO
SOFTWARE_INSTALLED=NO
PORT_OPENED=NO
FIREWALL_CHANGED=NO
ROUTER_CHANGED=NO
DDNS_CREATED=NO
CERTIFICATE_REQUESTED=NO
PUBLIC_ENDPOINT_CREATED=NO
REAL_SECRET_USED=NO
GITHUB_APP_MUTATED=NO
WEBHOOK_ACTIVE=NO
PROVIDER_SPEND_USD=0.00
H4_COMPLETE=NO
```
