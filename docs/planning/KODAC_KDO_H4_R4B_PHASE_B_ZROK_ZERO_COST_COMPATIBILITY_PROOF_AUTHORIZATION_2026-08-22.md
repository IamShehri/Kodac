# KODAC KDO H4-R4B Phase-B — zrok Zero-Cost Compatibility Proof Authorization

Date: 2026-08-22  
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — STAGED — FAIL CLOSED**  
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Authorize only the staged proof design needed to determine whether the free hosted zrokNET public-share path can satisfy KODAC's zero-cost Phase-B ingress requirements.

This document does **not** itself authorize downloading or executing zrok, creating or logging into a zrok account, enabling a zrok environment, creating namespaces/names/shares, creating a public endpoint, adding a payment method, using real GitHub App/webhook secrets, or sending a real GitHub webhook.

```text
PROVIDER_SPEND_USD=0.00
PAID_FALLBACK=FORBIDDEN
PAYMENT_METHOD_ADDITION=FORBIDDEN
EXTERNAL_MUTATION_BY_THIS_SLICE=NO
NETWORK_MUTATION_BY_THIS_SLICE=NO
REAL_SECRET_ACCESS_BY_THIS_SLICE=NO
PUBLIC_ENDPOINT_BY_THIS_SLICE=NO
```

## 2. Canonical baseline

```text
KODAC_CANONICAL_MAIN=f54af60fcf9bb746a3e382616a8ddc36c3f73f61
KODAC_CANONICAL_TREE=05a67d997d3a66cefc1b080dac7b99892d595c2a
PR_158=MERGED_CANONICAL

APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_CANONICAL_MAIN=79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40
APP_SOURCE_CANONICAL_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
APP_SOURCE_MUTATION_AUTHORIZED=NO

ZERO_COST_DIRECT_INGRESS_FINALIST_COUNT=2
FINALIST_A=ZROKNET_FREE_PUBLIC_SHARE
FINALIST_A_STATUS=COMPATIBILITY_PROOF_REQUIRED
FINALIST_B=DUCKDNS_PLUS_CADDY_DIRECT_FOUNDER_HOST
FINALIST_B_STATUS=NETWORK_PROOF_REQUIRED
FIRST_PROOF_TARGET=ZROKNET_FREE_PUBLIC_SHARE
INGRESS_SELECTED_FOR_EXECUTION=NO
H4_COMPLETE=NO
```

## 3. Current public-source zrok baseline

Fresh public-source verification on 2026-08-22 establishes:

```text
ZROK_CURRENT_RELEASE=v2.0.4
ZROK_CURRENT_RELEASE_SHORT_COMMIT=6ff9203
ZROK_CURRENT_RELEASE_GITHUB_VERIFIED=YES
ZROK_V2_BINARY_NAME=zrok2
ZROK_V2_ENVIRONMENT_DIRECTORY=~/.zrok2
ZROK_V2_ENV_PREFIX=ZROK2_
ZROK_RELEASE_ASSET_COUNT=11
ZROK_RELEASE_CHECKSUM_ARTIFACT_NAME=checksums.sha256.txt
ZROK_PROVISIONAL_WINDOWS_AMD64_ASSET_NAME=zrok_2.0.4_windows_amd64.tar.gz
```

`ZROK_PROVISIONAL_WINDOWS_AMD64_ASSET_NAME` is observed consistently in the release mirror and release-build conventions, but is not yet elevated to execution authority. The exact upstream GitHub release asset identity and SHA-256 must be captured directly from upstream release evidence before any binary acquisition.

The release project documents that release checksum artifacts use SHA-256.

Current free hosted-service constraints include:

```text
ZROK_FREE_MONTHLY_PRICE_USD=0
ZROK_FREE_CREDIT_CARD_REQUIRED=NO
ZROK_FREE_DAILY_DATA_LIMIT_GB=5
ZROK_FREE_SUPPORT=COMMUNITY
ZROK_FREE_PRODUCTION_SLA=NO
PAID_INTERSTITIAL_BYPASS_ALLOWED=NO
PRODUCTION_EQUIVALENCE=NO
```

## 4. Current security and reliability cautions

The proof must not treat upstream latest-release status as compatibility proof.

Current upstream evidence includes recent v2 security fixes and operational reports. In particular:

- v2.0.4 preserves reserved share/name state across graceful shutdown and abnormal subordinate-process exit unless explicitly released;
- v2.0.3 fixed an absolute-URL forwarding issue in the Python `ProxyShare` SDK;
- current upstream security history includes 2026 advisories affecting other zrok surfaces;
- current issue history includes public/interstitial and hosted-account/share failure reports.

Therefore:

```text
LATEST_RELEASE_EQUALS_COMPATIBLE=NO
UPSTREAM_RELEASE_VERIFIED_EQUALS_BINARY_PROVEN=NO
HOSTED_ZROKNET_BEHAVIOR_EQUALS_SELF_HOSTED_BEHAVIOR=NO
NO_SLA_PILOT_EQUALS_PRODUCTION=NO
```

No unresolved upstream issue is automatically treated as a KODAC failure unless it applies to the exact proof surface, but each load-bearing behavior must be demonstrated directly.

## 5. Proof-stage architecture

The compatibility proof is divided into strictly ordered stages. A later stage cannot inherit authority merely because an earlier stage passes.

```text
Z0P=PUBLIC_PROVENANCE_CAPTURE
Z0L=LOCAL_ARTIFACT_VALIDATION
Z0A=ZERO_COST_ACCOUNT_ENVIRONMENT_PROOF
Z0S=SYNTHETIC_PUBLIC_SHARE_COMPATIBILITY_PROOF
Z0R=RESERVED_NAME_RESTART_AND_TEARDOWN_PROOF
Z0D=DECISION_RECONCILIATION
```

Current authorization after this document, if merged, is limited to:

```text
Z0P=AUTHORIZED_TO_EXECUTE_READ_ONLY
Z0L=NOT_AUTHORIZED
Z0A=NOT_AUTHORIZED
Z0S=NOT_AUTHORIZED
Z0R=NOT_AUTHORIZED
Z0D=NOT_AUTHORIZED
```

`Z0P` is public metadata/source retrieval only. It creates no account, downloads no executable/archive payload, and creates no hosted resource.

## 6. Z0P — public provenance capture

### 6.1 Required upstream identity

Before any zrok archive can be acquired, a provenance report must bind one exact upstream release:

```text
Z0P_RELEASE_TAG=v2.0.4
Z0P_RELEASE_COMMIT=FULL_40_HEX_REQUIRED
Z0P_RELEASE_VERIFICATION=VERIFIED_REQUIRED
Z0P_RELEASE_ASSET_NAME=EXACT_REQUIRED
Z0P_RELEASE_ASSET_ID=EXACT_IF_EXPOSED_BY_UPSTREAM_API
Z0P_RELEASE_ASSET_SIZE_BYTES=EXACT_REQUIRED
Z0P_RELEASE_CHECKSUM_FILE=checksums.sha256.txt
Z0P_RELEASE_ASSET_SHA256=EXACT_64_HEX_REQUIRED
Z0P_RELEASE_SBOM_ASSET=sbom-v2.0.4.spdx.json
Z0P_PLATFORM=windows
Z0P_ARCH=amd64
```

The current short commit `6ff9203` is research evidence only. The full commit SHA must be bound before acquisition.

### 6.2 Source hierarchy

Provenance evidence must prefer, in this order:

1. GitHub upstream release metadata for `openziti/zrok`;
2. upstream GitHub release checksum asset `checksums.sha256.txt`;
3. upstream release SBOM;
4. upstream source/release workflow configuration.

A third-party mirror may be used only for **non-authoritative discovery** of a likely release-asset filename or the apparent presence/filename of a checksum artifact. It may not supply the canonical execution SHA-256, prove that the checksum artifact is authoritative, or replace upstream release evidence. Any asset or checksum-artifact identity used as execution authority must be confirmed directly from upstream evidence.

```text
THIRD_PARTY_MIRROR_AS_CHECKSUM_AUTHORITY=FORBIDDEN
THIRD_PARTY_MIRROR_AS_CHECKSUM_VALUE_SOURCE=FORBIDDEN
THIRD_PARTY_MIRROR_NAME_ONLY_DISCOVERY=PERMITTED_NON_AUTHORITATIVELY
SEARCH_SNIPPET_AS_CHECKSUM_AUTHORITY=FORBIDDEN
FLOATING_LATEST_URL_AS_EXECUTION_AUTHORITY=FORBIDDEN
UNPINNED_ASSET_DOWNLOAD=FORBIDDEN
```

### 6.3 Z0P terminal requirements

```text
Z0P_UPSTREAM_RELEASE_IDENTITY=PASS_REQUIRED
Z0P_FULL_RELEASE_COMMIT=PASS_REQUIRED
Z0P_WINDOWS_AMD64_ASSET_IDENTITY=PASS_REQUIRED
Z0P_UPSTREAM_SHA256=PASS_REQUIRED
Z0P_SBOM_PRESENCE=PASS_REQUIRED
Z0P_NO_BINARY_DOWNLOADED=PASS_REQUIRED
Z0P_NO_EXECUTION=PASS_REQUIRED
Z0P_NO_ACCOUNT_MUTATION=PASS_REQUIRED
```

If an upstream SHA-256 cannot be obtained, fail closed:

```text
IF_UPSTREAM_SHA256_UNAVAILABLE=Z0L_BLOCKED
```

## 7. Z0L — local artifact validation — separately gated

`Z0L` is **not authorized by this document**. It requires a separate exact-head authorization after Z0P is canonicalized.

A future Z0L authorization may permit acquisition of exactly the Z0P-bound archive into a disposable local evidence directory, without installation and without adding it to `PATH`.

Required future behavior:

```text
DOWNLOAD_EXACT_BOUND_ASSET_ONLY=YES
VERIFY_SHA256_BEFORE_EXTRACTION=YES
VERIFY_ARCHIVE_MEMBER_PATHS_BEFORE_EXTRACTION=YES
EXTRACT_TO_DISPOSABLE_NON_PATH_DIRECTORY_ONLY=YES
SYSTEM_INSTALL=NO
USER_PATH_MUTATION=NO
REGISTRY_MUTATION=NO
WINDOWS_SERVICE_INSTALL=NO
AUTO_START=NO
ACCOUNT_LOGIN=NO
NETWORK_SHARE=NO
```

The archive and extracted binary must remain quarantined from execution until their provenance checks pass.

A future validation report must bind at least:

```text
DOWNLOADED_ARCHIVE_SHA256
UPSTREAM_EXPECTED_SHA256
SHA256_MATCH
ARCHIVE_FILE_LIST
ARCHIVE_PATH_TRAVERSAL_CHECK
EXTRACTED_BINARY_SHA256
AUTHENTICODE_STATE_IF_PRESENT
ZROK2_VERSION_OUTPUT_ONLY_IF_EXECUTION_SEPARATELY_AUTHORIZED
```

## 8. Z0A — account/environment proof — separately gated

`Z0A` is not authorized by this document or by a future Z0L pass.

A future Z0A authorization must prove immediately before mutation:

```text
ZROK_FREE_PRICE_USD=0
CREDIT_CARD_REQUIRED=NO
PAYMENT_METHOD_ON_ACCOUNT_REQUIRED=NO
TRIAL_OR_CREDIT_DEPENDENCY=NO
COMMERCIAL_UPGRADE=NO
```

No payment method may be added for interstitial bypass or any other reason.

### 8.1 Credential boundary

All environment/account authority is secret material:

```text
ZROK_ACCOUNT_TOKEN=SECRET
ZROK_ENABLE_TOKEN=SECRET
ZROK_API_TOKEN_OR_EQUIVALENT=SECRET
SECRET_IN_CHAT=FORBIDDEN
SECRET_IN_GIT=FORBIDDEN
SECRET_IN_COMMAND_HISTORY=FORBIDDEN
SECRET_IN_PROCESS_LIST=FORBIDDEN_WHERE_AVOIDABLE
SECRET_IN_LOGS=FORBIDDEN
SECRET_IN_SCREENSHOT=FORBIDDEN
```

Only redacted, non-sensitive metadata may enter evidence reports.

### 8.2 Environment scope

Any future environment must be dedicated to this bounded pilot and must not reuse an unrelated personal or project environment.

```text
DEDICATED_PILOT_ENVIRONMENT=REQUIRED
EXISTING_UNRELATED_ENVIRONMENT_REUSE=FORBIDDEN
V1_V2_HYBRID_ENVIRONMENT=FORBIDDEN
ZROK_V1_CLIENT_USAGE=FORBIDDEN
```

The clean v2-only requirement is especially important because current hosted issue history includes failure reports involving hybrid v1/v2 state.

## 9. Z0S — synthetic public-share compatibility theorem — separately gated

`Z0S` is not authorized until Z0P, Z0L, and Z0A are each independently qualified and canonical.

No real GitHub webhook or GitHub App secret may be used.

### 9.1 Synthetic receiver

The proof must use a purpose-built synthetic receiver or a separately reviewed synthetic mode whose only role is to attest the exact request received through the zrok public frontend.

The receiver must bind only to loopback on the founder host.

```text
SYNTHETIC_RECEIVER_BIND=127.0.0.1
PUBLIC_APP_BIND=FORBIDDEN
POSTGRES_PUBLIC_BIND=FORBIDDEN
REAL_PHASE_B_AUTHORITY_ACTIONS=FORBIDDEN
```

### 9.2 Payload and header transparency

A deterministic synthetic payload must be generated locally. A synthetic HMAC secret may be generated for this proof and destroyed afterward.

Required observations:

```text
RAW_BODY_BYTE_FOR_BYTE_MATCH=PASS_REQUIRED
CONTENT_TYPE_PRESERVED=PASS_REQUIRED
X_HUB_SIGNATURE_256_PRESERVED=PASS_REQUIRED
X_GITHUB_DELIVERY_PRESERVED=PASS_REQUIRED
X_GITHUB_EVENT_PRESERVED=PASS_REQUIRED
USER_AGENT_PRESERVED_OR_EXPECTED_TRANSFORMATION_BOUND=PASS_REQUIRED
```

Any transformation that changes the HMAC-authenticated body rejects zrok.

### 9.3 Interstitial theorem

The proof must exercise at least:

```text
USER_AGENT_A=GitHub-Hookshot/KODAC-SYNTHETIC
USER_AGENT_B=Mozilla/5.0 KODAC-SYNTHETIC
```

Required result:

```text
GITHUB_HOOKSHOT_PATH_REACHES_RECEIVER_WITHOUT_INTERSTITIAL=PASS_REQUIRED
NO_PAYMENT_CARD_USED=PASS_REQUIRED
```

Browser/interstitial behavior is recorded separately and must not be bypassed by adding a card.

### 9.4 Response budget

For a bounded sample set:

```text
HTTP_STATUS_FOR_VALID_SYNTHETIC_REQUEST=2XX_REQUIRED
END_TO_END_ELAPSED_LT_10_SECONDS=PASS_REQUIRED_EACH_SAMPLE
TIMEOUT_OR_INTERSTITIAL_AS_SUCCESS=FORBIDDEN
```

The sample count and timing method must be defined before execution. A passing warm request cannot hide a failing first request/reconnect/restart request.

### 9.5 Invalid-authentication behavior

Synthetic invalid signatures must reach the receiver unchanged and be rejected by the receiver/application authentication boundary.

```text
INVALID_SIGNATURE_REJECTION=PASS_REQUIRED
AUTHENTICATION_BYPASS=FORBIDDEN
```

## 10. GitHub source/request-surface hardening theorem

GitHub recommends that a reverse proxy for private webhook systems forward only HTTPS POST requests originating from the GitHub `hooks` ranges returned by `GET /meta`.

The **request-surface requirements are common prerequisites** and cannot be waived by choosing a source-IP compensating control:

```text
COMMON_REQUIRED_PUBLIC_TRANSPORT=HTTPS_ONLY
COMMON_REQUIRED_METHOD=POST_ONLY
COMMON_REQUIRED_PATH=EXACT_WEBHOOK_PATH_ONLY
COMMON_REQUIRED_ENFORCEMENT_BOUNDARY=IDENTIFIED_AND_PROVEN_REQUIRED
```

Before zrok can become the selected ingress, all common requirements above must pass and one source-provenance outcome below must be proven:

```text
OPTION_A=ZROK_FRONTDOOR_ENFORCES_GITHUB_HOOKS_SOURCE_IP
OPTION_B=TRUSTWORTHY_COMPENSATING_FILTER_WITH_NON_SPOOFABLE_SOURCE_PROVENANCE
OPTION_C=ZROK_REJECTED
```

`OPTION_B` compensates **only** for source-IP provenance. It does not compensate for HTTPS, POST-only, or exact-path enforcement.

The authoritative enforcement boundary must be identified before Z0S executes:

- HTTPS must be proven at the public frontdoor. If HTTP is exposed, it must not be accepted as an equivalent webhook ingress path; redirect or rejection behavior must be explicitly characterized.
- POST-only and exact-path controls may be enforced by the public frontdoor or by a separately reviewed filter immediately before the synthetic receiver, but the chosen boundary must be explicit and its behavior must be directly tested.
- If method/path enforcement occurs behind the hosted frontdoor, the proof must first establish that the original method and path reach that filter without an attacker-controlled rewrite that defeats the restriction.
- Source-IP compensation behind the hosted frontdoor is valid only if client-source provenance is non-spoofable and the trust boundary that produces it is identified.

Current state:

```text
ZROK_GITHUB_HOOKS_SOURCE_IP_RESTRICTION_CAPABILITY=UNPROVEN_BLOCKING
ZROK_ORIGINAL_CLIENT_IP_TRUSTWORTHY_PRESERVATION=UNPROVEN_BLOCKING
ZROK_ORIGINAL_METHOD_PRESERVATION=UNPROVEN_BLOCKING
ZROK_ORIGINAL_PATH_PRESERVATION=UNPROVEN_BLOCKING
ZROK_HTTPS_ONLY_PUBLIC_FRONTDOOR=UNPROVEN_BLOCKING
ZROK_POST_ONLY_ENFORCEMENT_BOUNDARY=UNPROVEN_BLOCKING
ZROK_EXACT_PATH_ENFORCEMENT_BOUNDARY=UNPROVEN_BLOCKING
```

Application HMAC validation remains mandatory and cannot be replaced by source-IP filtering or request-surface restrictions.

If a forwarded client-IP header is proposed as compensating evidence, the proof must establish that the hosted zrok frontdoor overwrites/sanitizes it and that arbitrary Internet clients cannot spoof the trusted source value.

If the common requirements cannot be proven, or neither source-provenance option A nor B is provable, zrok fails for this high-assurance pilot even if payload/HMAC transparency succeeds.

## 11. Z0R — reserved-name/restart and cleanup proof — separately gated

A stable webhook endpoint requires more than an ephemeral successful request.

Before zrok can be selected, a separately authorized proof must demonstrate the exact v2 hosted lifecycle for a dedicated reserved public name:

```text
RESERVED_NAME_CREATION=PASS_REQUIRED
PUBLIC_ENDPOINT_NAME_STABLE=PASS_REQUIRED
PROCESS_RESTART_REATTACH=PASS_REQUIRED
HOST_REBOOT_REATTACH=PASS_REQUIRED_IF_RELEVANT_TO_PILOT
UNEXPECTED_PROCESS_EXIT_RECOVERY=PASS_REQUIRED
EXPLICIT_RELEASE_REMOVES_AUTHORITY=PASS_REQUIRED
```

v2.0.4 upstream behavior is promising because it preserves reservations unless explicitly released, but hosted zrokNET behavior must be proven directly.

### 11.1 Cleanup theorem

The cleanup procedure must be defined before share creation and must be executed at proof end unless an explicitly authorized next phase needs the resource retained.

Required terminal cleanup:

```text
PUBLIC_SHARE_ACTIVE=NO
RESERVED_NAME_RETAINED=NO_UNLESS_SEPARATELY_AUTHORIZED
PILOT_ENVIRONMENT_ACTIVE=NO_UNLESS_SEPARATELY_AUTHORIZED
PUBLIC_ENDPOINT_REACHABLE=NO
LOCAL_SYNTHETIC_SECRET_DESTROYED=YES
LOCAL_TEMP_EVIDENCE_SECRETS=NO
PAYMENT_METHOD_ADDED=NO
PROVIDER_SPEND_USD=0.00
```

## 12. Data-budget theorem

The free plan currently specifies 5 GB/day. The compatibility proof must set a much smaller explicit cap before execution.

```text
ZROK_FREE_DAILY_LIMIT_GB=5
KODAC_PROOF_MAX_BYTES=UNDECIDED_BLOCKING
```

A future Z0S authorization must choose a bounded value that is orders of magnitude below the free limit and include a local byte counter. A test harness must abort before exceeding the authorized cap.

No proof may rely on overage billing, paid credits, or a payment method.

## 13. Evidence package requirements

Each executed stage must emit a redacted evidence report whose filename, digest, exact tool/release identity, and terminal status are bound in the next governance slice.

No report may contain:

```text
ACCOUNT_TOKEN
ENABLE_TOKEN
API_TOKEN
REAL_WEBHOOK_SECRET
REAL_GITHUB_APP_PRIVATE_KEY
SESSION_COOKIE
AUTHORIZATION_HEADER
UNREDACTED_ACCOUNT_IDENTIFIER_IF_NOT_REQUIRED
```

A stage is not complete merely because terminal output appeared successful.

## 14. Decision rule

zrok may become the selected zero-cost ingress only after every load-bearing gate is proven on current, bounded, synthetic evidence:

```text
Z0P=PASS
Z0L=PASS
Z0A=PASS
Z0S=PASS
Z0R=PASS
GITHUB_SOURCE_REQUEST_HARDENING=PASS
PROVIDER_SPEND_USD=0.00
PAYMENT_METHOD_ADDED=NO
UNRESOLVED_MATERIAL_FINDINGS=0
```

Otherwise:

```text
IF_ANY_LOAD_BEARING_GATE_FAILS=ZROK_NOT_SELECTED
NEXT_OPTION=DUCKDNS_PLUS_CADDY_NETWORK_PROOF_OR_INGRESS_UNSELECTED
PAID_FALLBACK=FORBIDDEN
```

A successful bounded free pilot still yields:

```text
PRODUCTION_EQUIVALENCE=NO
H4_COMPLETE=NO
```

## 15. Immediate authority after canonicalization

If this exact authorization becomes canonical, only Z0P public read-only provenance capture becomes executable.

```text
PUBLIC_WEB_RESEARCH=YES
UPSTREAM_GITHUB_METADATA_READ=YES
UPSTREAM_RELEASE_CHECKSUM_TEXT_READ=YES
UPSTREAM_SBOM_METADATA_READ=YES

ZROK_ARCHIVE_DOWNLOAD=NO
ZROK_BINARY_DOWNLOAD=NO
ZROK_BINARY_EXECUTION=NO
ZROK_INSTALLATION=NO
ZROK_ACCOUNT_SIGNUP=NO
ZROK_LOGIN=NO
ZROK_ENABLE=NO
ZROK_NAMESPACE_CREATE=NO
ZROK_NAME_CREATE=NO
ZROK_SHARE_CREATE=NO
ZROK_AGENT_START=NO
ZROK_PUBLIC_ENDPOINT_CREATE=NO
PAYMENT_METHOD_ADD=NO
REAL_SECRET_ACCESS=NO
REAL_WEBHOOK=NO
GITHUB_APP_MUTATION=NO
APP_SOURCE_MUTATION=NO
```

The next mutation-bearing action after a Z0P PASS must be separately authorized and reviewed.

## 16. Primary/upstream sources reviewed

Current primary/upstream sources reviewed for this authorization include:

- `https://github.com/openziti/zrok/releases`
- `https://github.com/openziti/zrok/blob/main/CHANGELOG.md`
- `https://github.com/openziti/zrok/blob/main/.github/workflows/ci-build.yml`
- `https://github.com/openziti/zrok/blob/main/BUILD.md`
- `https://github.com/openziti/zrok/security`
- `https://zrok.io/pricing/`
- `https://docs.github.com/en/webhooks/using-webhooks/delivering-webhooks-to-private-systems`
- `https://docs.github.com/en/webhooks/using-webhooks/handling-failed-webhook-deliveries`
- `https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks`

Secondary mirror evidence was used only for non-authoritative observation of the probable Windows AMD64 release-archive filename and the apparent presence/name of the checksum artifact. The mirror is explicitly not checksum authority and cannot establish the checksum value or authoritative artifact identity.

## 17. Review and merge gate

This candidate may merge only if one exact head proves:

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

## 18. Terminal candidate state

```text
ZROK_ZERO_COST_COMPATIBILITY_PROOF_AUTHORIZATION=COMPLETE_CANDIDATE
Z0P=AUTHORIZED_AFTER_CANONICAL_MERGE
Z0L=BLOCKED_SEPARATE_AUTHORIZATION_REQUIRED
Z0A=BLOCKED_SEPARATE_AUTHORIZATION_REQUIRED
Z0S=BLOCKED_SEPARATE_AUTHORIZATION_REQUIRED
Z0R=BLOCKED_SEPARATE_AUTHORIZATION_REQUIRED
Z0D=BLOCKED

INGRESS_SELECTED_FOR_EXECUTION=NO
EXTERNAL_MUTATION=NO
NETWORK_MUTATION=NO
PROVIDER_SPEND_USD=0.00
PAYMENT_METHOD_ADDED=NO
REAL_SECRET_USED=NO
GITHUB_APP_MUTATED=NO
APP_SOURCE_MUTATED=NO
AG1C=BLOCKED
AG2=BLOCKED
TRUST_ROOT_ESTABLISHMENT=BLOCKED
B1_V2=NOT_AUTHORIZED
B2A_V2=NOT_AUTHORIZED
B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
```