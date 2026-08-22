# KODAC KDO H4-R4B Phase-B — ZC0-E01 Zero-Cost Eligibility Resolution

Date: 2026-08-22  
Status: **DECISION CANDIDATE — DOCS ONLY — NO EXTERNAL MUTATION — NO EXECUTION**  
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Resolve the first blocking control created by the canonical zero-cost control-plane decision without creating an account, installing software, enabling ingress, loading secrets, changing repository ownership, or spending money.

This slice is intentionally fail-closed. It does not attempt to make an unproven free-plan path look eligible. It applies the canonical rule:

```text
IF_ZERO_COST_ELIGIBILITY_NOT_PROVEN=REJECT_TAILSCALE
PAID_TAILSCALE_FALLBACK=FORBIDDEN
```

## 2. Canonical baseline

```text
KODAC_CANONICAL_MAIN=cbb18cd8b36b49e2611f36aa8e2e24cb31cf0c73
KODAC_CANONICAL_TREE=4c2f11d32a5d31c88329fdae60a3317cdf3cc2e1
PR_155=MERGED_CANONICAL
PR_155_REVIEWED_HEAD=04136ff9acd171e3868cec299d25f45a567dce46

ZERO_COST_DECISION=CANONICAL
NEW_PROVIDER_SPEND_USD=0.00
PAID_FALLBACK_IF_FREE_ELIGIBILITY_FAILS=FORBIDDEN
PRODUCTION_EQUIVALENCE_OF_FREE_PILOT=NO
H4_CLOSURE_AUTHORITY=NO

KODAC_GITHUB_OWNER=TheHalfMoon
KODAC_GITHUB_OWNER_TYPE=User
KODAC_LICENSE=Apache-2.0
LICENSE_BLOB=261eeb9e9f8b2b4b0d119366dda99c6fd7d35c64
```

The previous decision left Tailscale Funnel conditionally selected only if a zero-cost eligibility path became proven.

## 3. Current official Tailscale facts

Current Tailscale documentation and pricing establish the following:

1. The Personal plan is `$0` and supports up to six users.
2. The Personal plan is not intended for commercial use.
3. A GitHub personal account can be used to create a personal tailnet.
4. Community on GitHub is a free plan for an open-source project with an OSI-approved license using a GitHub organization.
5. Community on GitHub currently requires GitHub authentication and Tailscale Support involvement; it is not selected through the normal Billing page.
6. Tailscale Funnel is available on all plans, but Funnel availability alone does not prove that a particular plan is eligible for this use.

Primary sources reviewed on 2026-08-22:

- `https://tailscale.com/pricing`
- `https://tailscale.com/docs/account/manage-plans/free-plans-discounts`
- `https://tailscale.com/docs/account/manage-plans/downgrade-plan`
- `https://tailscale.com/docs/integrations/identity/github`
- `https://tailscale.com/docs/features/tailscale-funnel`
- `https://tailscale.com/terms`

## 4. Personal-plan path

The canonical repository does not contain an explicit founder classification that this Phase-B pilot use is personal/non-commercial for Tailscale plan purposes.

This candidate must not infer eligibility merely because:

- the repository is public;
- the repository is open source;
- the repository is owned by a personal GitHub account;
- the pilot is founder-hosted;
- no provider spend is desired.

Therefore:

```text
TAILSCALE_PERSONAL_PLAN_COST_USD=0
TAILSCALE_PERSONAL_PLAN_NOT_INTENDED_FOR_COMMERCIAL_USE=YES
TAILSCALE_PERSONAL_NONCOMMERCIAL_USE_CLASSIFICATION=UNPROVEN
TAILSCALE_PERSONAL_FOUNDER_ATTESTATION=ABSENT
TAILSCALE_PERSONAL_ELIGIBILITY=UNPROVEN
TAILSCALE_PERSONAL_SELECTION_AUTHORIZED=NO
```

This resolution does not authorize creating a Tailscale account or tailnet merely to discover whether the Personal plan could be used.

## 5. Community on GitHub path

The repository's Apache-2.0 license satisfies the OSI-license prerequisite, but the current repository owner is a GitHub `User`, not a GitHub organization.

Tailscale's current Community on GitHub documentation describes eligibility for a GitHub organization using Tailscale for an open-source project with an OSI license.

Therefore, under the current repository topology:

```text
TAILSCALE_COMMUNITY_ON_GITHUB_DOCUMENTED=YES
TAILSCALE_COMMUNITY_COST_USD=0
TAILSCALE_COMMUNITY_LICENSE_PREREQUISITE=PASS
TAILSCALE_COMMUNITY_REQUIRES_GITHUB_ORGANIZATION=YES
TAILSCALE_COMMUNITY_CURRENT_OWNER_TYPE=User
TAILSCALE_COMMUNITY_GITHUB_ORG_PREREQUISITE=UNMET
TAILSCALE_COMMUNITY_SUPPORT_CONFIRMATION=ABSENT
TAILSCALE_COMMUNITY_ENROLLMENT=ABSENT
TAILSCALE_COMMUNITY_ELIGIBILITY=CURRENT_TOPOLOGY_FAIL
TAILSCALE_COMMUNITY_SELECTION_AUTHORIZED=NO
```

Creating a GitHub organization, converting an account, transferring `TheHalfMoon/Kodac`, or changing canonical repository ownership only to satisfy this prerequisite is not authorized by this slice.

## 6. ZC0-E01 resolution

There is no presently proven zero-cost Tailscale path.

```text
ZC0_E01_ZERO_COST_PLAN_ELIGIBILITY=FAIL_CLOSED
TAILSCALE_ZERO_COST_ELIGIBLE_PATH_COUNT=0
TAILSCALE_PERSONAL_ELIGIBILITY=UNPROVEN
TAILSCALE_COMMUNITY_ELIGIBILITY=CURRENT_TOPOLOGY_FAIL
TAILSCALE_FUNNEL_ZERO_COST_SELECTION=REJECT_CURRENT_TOPOLOGY
AG1B_ZERO_COST_PREFERRED_INGRESS=UNSELECTED
```

`REJECT_CURRENT_TOPOLOGY` means that Tailscale Funnel is not an executable ingress choice under the current proof set. It is not a permanent product-wide ban. A future separately authorized decision may reconsider Tailscale only if a qualifying zero-cost path is proven without violating repository-governance constraints or the `$0` requirement.

## 7. Immediate consequences

Because ingress is unselected, all Tailscale/Funnel-dependent execution remains blocked:

```text
TAILSCALE_ACCOUNT_CREATION_BY_THIS_SLICE=NO
TAILSCALE_PLAN_CHANGE_BY_THIS_SLICE=NO
TAILSCALE_BILLING_CONFIGURATION_BY_THIS_SLICE=NO
TAILSCALE_INSTALLATION_BY_THIS_SLICE=NO
TAILSCALE_LOGIN_BY_THIS_SLICE=NO
TAILSCALE_NODE_CREATION_BY_THIS_SLICE=NO
TAILSCALE_FUNNEL_ENABLE_BY_THIS_SLICE=NO
TAILSCALE_POLICY_MUTATION_BY_THIS_SLICE=NO
TAILSCALE_CERTIFICATE_PROVISIONING_BY_THIS_SLICE=NO
PUBLIC_WEBHOOK_ENDPOINT_CREATED_BY_THIS_SLICE=NO
REAL_SECRET_ACCESS_BY_THIS_SLICE=NO
REAL_WEBHOOK_DELIVERY_BY_THIS_SLICE=NO
GITHUB_APP_MUTATION_BY_THIS_SLICE=NO
```

The following controls remain defined but cannot execute against Tailscale Funnel while ingress is unselected:

```text
ZC0_U01=BLOCKED_NO_SELECTED_INGRESS
ZC0_W01A=BLOCKED_NO_SELECTED_PUBLIC_INGRESS
ZC0_W01B=NOT_ADVANCED_BY_THIS_SLICE
ZC0_W01C=NOT_ADVANCED_BY_THIS_SLICE
```

The local PostgreSQL and Go rehearsal evidence remains useful but does not authorize production execution.

## 8. Prohibited shortcuts

The hard `$0` requirement must not be bypassed by any of the following:

```text
PAID_TAILSCALE_PLAN=FORBIDDEN
USAGE_BASED_BILLING_AS_ZERO_COST=FORBIDDEN
FREE_TRIAL_AS_ZERO_COST=FORBIDDEN
CREDIT_AS_ZERO_COST=FORBIDDEN
PAYMENT_METHOD_ADDITION=FORBIDDEN
BILLING_ACCOUNT_CREATION=FORBIDDEN
ARTIFICIAL_PERSONAL_USE_CLASSIFICATION=FORBIDDEN
UNSUPPORTED_COMMUNITY_PLAN_ASSUMPTION=FORBIDDEN
GITHUB_ORG_CREATION_BY_THIS_SLICE=FORBIDDEN
REPOSITORY_TRANSFER_BY_THIS_SLICE=FORBIDDEN
```

## 9. Permitted work after canonicalization

If this candidate becomes canonical, the only newly authorized follow-on activity is a separate **docs-only zero-cost ingress alternative research/authorization slice**.

That future slice may research public primary sources for an ingress option satisfying all of:

```text
NEW_PROVIDER_SPEND_USD=0.00
NO_FREE_TRIAL_DEPENDENCY=YES
NO_CREDIT_DEPENDENCY=YES
NO_PAYMENT_METHOD_REQUIRED=YES
STABLE_PUBLIC_HTTPS_ENDPOINT_REQUIRED=YES
GITHUB_WEBHOOK_COMPATIBLE=YES
WINDOWS_11_FOUNDER_HOST_COMPATIBLE=YES
APP_HOST_REMAINS_LOOPBACK_ONLY=YES
POSTGRES_REMAINS_NONPUBLIC=YES
REAL_SECRET_ACTIVATION_SEPARATELY_GATED=YES
NO_PRODUCTION_EQUIVALENCE_CLAIM_FROM_FREE_PILOT=YES
```

Research does not authorize installation, account creation, domain purchase, port exposure, tunneling, deployment, or webhook activation.

## 10. Review and merge gate

This candidate is mergeable only if all of the following hold on one exact head:

```text
CHANGED_FILE_COUNT=1
CHANGED_FILE=this_document_only
DOCS_ONLY=YES
APP_SOURCE_REPOSITORY_MUTATED=NO
WORKFLOW_SEMANTICS_MUTATED=NO
BRANCH_PROTECTION_MUTATED=NO
EXTERNAL_RESOURCE_MUTATION=NO
REQUIRED_REPOSITORY_GATES=PASS
INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_MATERIAL_FINDINGS=0
```

A docs-only runtime execution skip is permitted only when the repository's canonical runtime-change classifier and stable runtime gate both pass on the exact candidate head.

Ready-for-review status authorizes review only. It does not authorize execution.

## 11. Post-merge state if qualified

If this exact decision is independently reviewed, passes repository gates, and merges canonically:

```text
ZC0_E01=RESOLVED_FAIL_CLOSED
TAILSCALE_FUNNEL=REJECTED_UNDER_CURRENT_ELIGIBILITY_TOPOLOGY
AG1B_ZERO_COST_INGRESS=UNSELECTED
NEXT_SLICE=ZERO_COST_INGRESS_ALTERNATIVE_RESEARCH_AUTHORIZATION

TAILSCALE_INSTALLATION=NO
TAILSCALE_FUNNEL_ACTIVE=NO
PUBLIC_WEBHOOK_ACTIVE=NO
REAL_SECRETS_LOADED=NO
GITHUB_APP_ACTIVE=NO
AG1C=BLOCKED
AG2=BLOCKED
TRUST_ROOT_ESTABLISHMENT=BLOCKED
B1_V2=NOT_AUTHORIZED
B2A_V2=NOT_AUTHORIZED
B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
```

## 12. Terminal decision candidate

```text
ZC0_E01_DECISION_CANDIDATE=FAIL_CLOSED_NO_PROVEN_ZERO_COST_TAILSCALE_PATH
TAILSCALE_ZERO_COST_ELIGIBLE_PATH_COUNT=0
TAILSCALE_FUNNEL_SELECTION=REJECT_CURRENT_TOPOLOGY
INGRESS=UNSELECTED
EXTERNAL_MUTATION=NO
PROVIDER_SPEND_USD=0.00
```
