# KODAC KDO H4-R4B Phase-B Personal-Repository Capability Repair

Date: 2026-08-22
Status: REPAIR_CANDIDATE / DOCS_ONLY / NO_APP_CREATION / NO_APP_INSTALLATION / NO_RULESET_MUTATION / NO_BRANCH_PROTECTION_MUTATION / NO_WORKFLOW_MUTATION / NO_TRUST_ROOT_ESTABLISHMENT

## 1. Purpose

Repair one live-platform capability error discovered immediately after canonical PR #147, before AG-1 implementation or GitHub App creation begins.

Canonical PR #147 selected a Phase-B server-side architecture that required GitHub merge queue. Live repository metadata and current GitHub primary documentation show that `TheHalfMoon/Kodac` is a **public repository owned by a personal `User` account**, while GitHub merge queue is currently documented as available for public repositories owned by an **organization** (and private organization repositories on GitHub Enterprise Cloud).

Therefore the merge-queue requirement in PR #147 is not executable on the current canonical repository ownership model and must not be carried forward as if it were available.

This repair replaces the unavailable merge-queue dependency with a server-enforced protected-branch / strict-required-check design that is available to a public personal repository.

Maximum result of this repair if merged:

```text
PHASE_B_PERSONAL_REPOSITORY_CAPABILITY_REPAIR=CANONICAL
PHASE_B_SERVER_SIDE_ATOMIC_GATE_ARCHITECTURE=REPAIRED_FOR_CURRENT_REPOSITORY
AG1_DISCOVERY_PROOF_PLANNING=UNBLOCKED
```

It does **not** establish or prove the Phase-B gate.

---

## 2. Canonical predecessor and live repository fact

Canonical predecessor:

```text
CANONICAL_MAIN=5163e46d8662c22de884075c6c1bee8b4f3f1ca7
CANONICAL_MAIN_TREE=405a067251e0707e62afe5e095646bd07202864f
PR_147=MERGED_CANONICAL
PR_147_REVIEWED_HEAD=58a9a197a5966a76510763e78d10d21f41afb16c
PHASE_B_SERVER_SIDE_ATOMIC_GATE_AUTHORIZATION=CANONICAL
```

Live repository metadata observed after PR #147:

```text
REPOSITORY=TheHalfMoon/Kodac
REPOSITORY_ID=1297407563
OWNER_LOGIN=TheHalfMoon
OWNER_TYPE=User
VISIBILITY=public
DEFAULT_BRANCH=main
```

This ownership fact is load-bearing because GitHub feature availability differs between personal-account and organization-owned repositories.

---

## 3. Primary-source capability correction

Current GitHub documentation states:

```text
MERGE_QUEUE_PUBLIC_REPOSITORY_AVAILABILITY=
  public repository owned by an organization

MERGE_QUEUE_PRIVATE_REPOSITORY_AVAILABILITY=
  organization repository using GitHub Enterprise Cloud
```

The current Kodac repository is not organization-owned.

Therefore:

```text
CURRENT_REPOSITORY_MERGE_QUEUE_ELIGIBILITY=NOT_PROVEN_AVAILABLE
MERGE_QUEUE_MUST_NOT_BE_REQUIRED_BY_KODAC_PHASE_B=YES
AG1_MUST_NOT_REQUEST_MERGE_QUEUE_PERMISSION_OR_WEBHOOK=YES
```

Primary GitHub references used for this repair:

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/choosing-permissions-for-a-github-app
- https://docs.github.com/en/webhooks/webhook-events-and-payloads
- https://docs.github.com/en/rest/checks/runs
- https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries

If GitHub changes feature availability later, that does not retroactively invalidate this repair. Any future migration to merge queue requires a new capability re-evaluation and separate authorization.

---

## 4. Protected-branch capabilities that are available

GitHub documents protected branches as available for public repositories on GitHub Free, including personal repositories.

The required server-side primitives for the repaired architecture are documented as protected-branch features:

```text
REQUIRE_PULL_REQUEST_BEFORE_MERGE=AVAILABLE
REQUIRE_STATUS_CHECKS_BEFORE_MERGE=AVAILABLE
REQUIRE_BRANCH_UP_TO_DATE_BEFORE_MERGE=AVAILABLE
REQUIRE_CONVERSATION_RESOLUTION_BEFORE_MERGE=AVAILABLE
DO_NOT_ALLOW_BYPASS_ABOVE_SETTINGS=AVAILABLE
FORCE_PUSH_DISABLED_BY_DEFAULT=AVAILABLE
BRANCH_DELETION_DISABLED_BY_DEFAULT=AVAILABLE
EXPECTED_GITHUB_APP_SOURCE_FOR_REQUIRED_CHECK=AVAILABLE
```

GitHub also documents that a required status check can be bound to an expected GitHub App source. A same-named status from another actor or integration does not satisfy that requirement.

These primitives are sufficient to remove the merge-queue dependency from the Phase-B theorem, provided the candidate-independent App converts the founder bootstrap and independent-review events into immutable receipts as already required by PR #147.

---

## 5. Repaired Phase-B architecture

The repaired architecture is exactly:

```text
PHASE_B_GATE_ARCHITECTURE_VERSION=kodac-phase-b-personal-repo-v1

LAYER_A=
  GITHUB_SERVER_SIDE_PROTECTED_MAIN_BRANCH

LAYER_B=
  CANDIDATE_INDEPENDENT_GITHUB_APP_REQUIRED_CHECK

LAYER_C=
  CANDIDATE_INDEPENDENT_APPEND_ONLY_EVENT_RECEIPTS
```

Merge queue is removed from the mandatory theorem.

### Layer A — protected `main`

The later AG-2 configuration proof must establish one unambiguous effective protection for exact branch `main` with at least:

```text
REQUIRE_PULL_REQUEST_BEFORE_MERGE=YES
REQUIRE_STATUS_CHECKS_BEFORE_MERGE=YES
REQUIRE_BRANCH_UP_TO_DATE_BEFORE_MERGE=YES
REQUIRE_CONVERSATION_RESOLUTION_BEFORE_MERGE=YES
DO_NOT_ALLOW_BYPASS_ABOVE_SETTINGS=YES
ALLOW_FORCE_PUSHES=NO
ALLOW_DELETIONS=NO
```

The Phase-B App check must be required as:

```text
PHASE_B_CHECK_NAME=kodac/phase-b-gate
PHASE_B_CHECK_EXPECTED_SOURCE=<exact installed GitHub App identity>
```

The protection must apply to administrators as well. GitHub documents `Do not allow bypassing the above settings` as the control that applies branch-protection requirements to repository administrators and roles that otherwise have branch-protection bypass permission.

For a personal repository, organization-only push restriction features are not part of this theorem and must not be represented as available.

### Layer B — exact-head App check

The App's merge-authoritative check is attached to the **exact pull-request head SHA**, not to a merge-group SHA.

Required semantics:

```text
CHECK_TARGET=EXACT_PR_HEAD_SHA
CHECK_NAME=kodac/phase-b-gate
CHECK_EXPECTED_SOURCE=EXACT_GITHUB_APP
CHECK_SUCCESS_REQUIRES_VALID_EXACT_HEAD_RECEIPTS=YES
CHECK_FAILS_CLOSED_ON_MISSING_RECEIPT=YES
CHECK_FAILS_CLOSED_ON_HEAD_MISMATCH=YES
CHECK_FAILS_CLOSED_ON_FORBIDDEN_ESTABLISHMENT_DELTA=YES
```

The candidate cannot satisfy the gate by producing a same-named workflow job or commit status from another source.

### Layer C — immutable historical receipts

The founder bootstrap approval and the qualifying independent exact-head review remain historical events converted into append-only, content-addressed receipts.

After a valid receipt is issued:

```text
SOURCE_COMMENT_EDIT_IS_NOT_REVOCATION=YES
SOURCE_COMMENT_DELETE_IS_NOT_REVOCATION=YES
TOP_LEVEL_REVIEW_SUMMARY_EDIT_IS_NOT_REVOCATION=YES
```

This is deliberate. Treating those mutable GitHub objects as continuously live merge predicates would recreate the PR #146 TOCTOU defect.

Revocation / new negative review information must instead use server-blocking mechanisms defined by the reviewer/founder contract.

---

## 6. Revised atomicity theorem without merge queue

For an establishment candidate with exact head `H` and current protected-base head `B`, merge eligibility is server-enforced as follows.

### 6.1 Exact-head gate

`kodac/phase-b-gate` must be successful on exactly `H` and must come from the expected GitHub App source.

A candidate mutation produces a different head `H2`; the success on `H` cannot qualify `H2`.

### 6.2 Base movement

`Require branches to be up to date before merging` is mandatory.

If `main` moves from `B` to `B2` before the candidate lands, GitHub must refuse merge until the pull request is brought up to date with `B2`.

Bringing the branch up to date changes the candidate commit graph/head and therefore requires a fresh exact-head Phase-B cycle:

```text
BASE_MOVEMENT -> MERGE_BLOCKED
UPDATE_TO_NEW_BASE -> NEW_HEAD
NEW_HEAD -> OLD_PHASE_B_RECEIPTS_INVALID
NEW_HEAD -> OLD_PHASE_B_CHECK_INVALID
NEW_HEAD -> FRESH_BOOTSTRAP_AND_REVIEW_BINDING_REQUIRED
```

The Phase-B App must fail closed if presented with receipts bound to an earlier candidate head.

### 6.3 Review-conversation movement

A new unresolved review conversation after the App check succeeds does not require the App to win a race with the merge operation.

GitHub's protected-branch `Require conversation resolution before merging` control independently blocks merge while the conversation remains unresolved.

Therefore qualified independent reviewers must obey:

```text
MATERIAL_ACTIONABLE_FINDING_REQUIRES_REVIEW_CONVERSATION=YES
TOP_LEVEL_ONLY_ACTIONABLE_FINDING=NOT_QUALIFIED
```

### 6.4 Founder event semantics

The founder bootstrap receipt proves that a valid founder approval event occurred for exact head `H`.

The founder comment is not a continuously mutable lock and is not used as a revocation channel after receipt issuance.

If the founder intends to stop the candidate after approving it, the supported control is to close the PR or mutate the candidate head. Both prevent the old exact-head gate from authorizing a different candidate.

### 6.5 Merge request defense in depth

The operational merger should still provide:

```text
expected_head_sha=H
```

when using an API/connector merge request.

That fence remains defense in depth against head movement. It is **not** the sole Phase-B atomicity mechanism; server-side branch protection remains authoritative.

---

## 7. Revised GitHub App event surface

The mandatory App event surface no longer contains `merge_group`.

AG-1 discovery/proof planning must justify the smallest event set needed to establish receipts and exact-head checks.

Expected minimum candidates are:

```text
pull_request
issue_comment
pull_request_review
```

Additional review events may be authorized only if the reviewer behavioral contract requires them:

```text
pull_request_review_comment
pull_request_review_thread
```

The following is removed from the mandatory set:

```text
merge_group=NOT_REQUIRED_FOR_CURRENT_ARCHITECTURE
```

GitHub currently documents:

```text
issue_comment -> Issues repository permission: read
pull_request_review -> Pull requests repository permission: read
pull_request_review_comment -> Pull requests repository permission: read
pull_request_review_thread -> Pull requests repository permission: read
```

Webhook payloads must be authenticated before use.

Required ingress controls:

```text
X_HUB_SIGNATURE_256_VERIFICATION=REQUIRED
WEBHOOK_HMAC_ALGORITHM=HMAC_SHA256
CONSTANT_TIME_SIGNATURE_COMPARISON=REQUIRED
X_GITHUB_DELIVERY_CAPTURE=REQUIRED
DELIVERY_GUID_DEDUPLICATION=REQUIRED
RAW_BODY_VERIFIED_BEFORE_JSON_TRUST=REQUIRED
```

GitHub documents `X-GitHub-Delivery` as a globally unique delivery GUID and `X-Hub-Signature-256` as the HMAC-SHA256 signature over the webhook body when a webhook secret is configured.

---

## 8. Revised least-privilege permission candidate

AG-1 must prove the exact permission set before App creation/installation.

The current minimum candidate is:

```text
Checks=write
Issues=read
Pull requests=read
Metadata=read
```

Explicitly absent unless AG-1 produces new primary-source necessity:

```text
Merge queues=NONE
Administration=NONE
Actions=NONE
Commit statuses=NONE
Contents=NONE
Deployments=NONE
Environments=NONE
Workflows=NONE
Members=NONE
Secrets=NONE
```

Why:

- `Checks=write` is required to create/update `kodac/phase-b-gate` check runs.
- `Issues=read` is required to receive/read the founder top-level PR `issue_comment` event.
- `Pull requests=read` is required for pull-request identity/head/delta data and review events.
- `Metadata=read` supplies repository identity metadata used in binding and is read-only.

GitHub documents the Create Check Run endpoint as requiring Checks repository permission at write level and documents List Pull Request Files as available with Pull requests read permission.

No App write permission to repository contents is justified by this architecture.

---

## 9. Receipt-store boundary remains candidate-independent

This repair does not select or instantiate a storage provider.

AG-1 must define a concrete append-only store whose runtime principal cannot update or delete existing receipt objects.

Minimum storage theorem remains:

```text
STORE_OUTSIDE_KODAC_REPOSITORY=YES
STORE_OUTSIDE_PR_COMMENT_STATE=YES
STORE_CREATE_IF_ABSENT_ONLY=YES
STORE_OVERWRITE=FORBIDDEN
STORE_DELETE_BY_RUNTIME_PRINCIPAL=FORBIDDEN
STORE_OBJECT_KEY_BINDS_RECEIPT_SHA256=YES
STORE_READ_AFTER_WRITE_VERIFICATION=REQUIRED
STORE_COLLISION_WITH_DIFFERENT_BYTES=FATAL
STORE_CREDENTIALS_IN_KODAC_REPOSITORY=0
STORE_CREDENTIALS_IN_CHAT_OR_AGENT_CONTEXT=0
```

A provider-specific WORM/object-lock/versioning theorem is deferred to AG-1 concrete deployment selection.

---

## 10. Reviewer contract correction

The independent-review receipt remains historical exact-head proof.

A reviewer/provider is qualified only if the later sacrificial qualification proves:

```text
CLEAN_VERDICT_CAN_BE_IDENTIFIED_DETERMINISTICALLY=YES
CLEAN_VERDICT_BINDS_EXACT_HEAD=YES
MATERIAL_ACTIONABLE_FINDINGS_ARE_REVIEW_CONVERSATIONS=YES
TOP_LEVEL_ONLY_MATERIAL_FINDING=NO
PROVIDER_IDENTITY_IS_STABLE_AND_ALLOWLISTABLE=YES
```

A provider that later publishes a material finding only by editing a top-level summary, without a server-blocking review conversation, is not qualified for the Phase-B reviewer allowlist.

This requirement is what allows GitHub's server-side conversation-resolution protection to close the post-check review race.

---

## 11. Sections of PR #147 repaired by this document

If this repair becomes canonical, the following PR #147 requirements are superseded for the current personal-repository deployment:

```text
PR147_LAYER_A_REQUIRE_MERGE_QUEUE=SUPERSEDED
PR147_MERGE_AUTHORITATIVE_CHECK_ON_MERGE_GROUP=SUPERSEDED
PR147_MERGE_QUEUE_CONFIGURATION_THEOREM=SUPERSEDED
PR147_MERGE_GROUP_PHASE_B_CHECK_REQUIREMENT=SUPERSEDED
PR147_MERGE_QUEUE_CONFIGURATION_DIGEST_PROOF=SUPERSEDED
PR147_DIRECT_MERGE_OUTSIDE_QUEUE_PROHIBITION=SUPERSEDED
PR147_AG3_MERGE_GROUP_WORKFLOW_COMPATIBILITY_AS_PHASE_B_PREREQUISITE=SUPERSEDED
```

They are replaced by:

```text
PROTECTED_MAIN_BRANCH=REQUIRED
STRICT_REQUIRED_STATUS_CHECKS=REQUIRED
EXACT_APP_SOURCE=REQUIRED
CONVERSATION_RESOLUTION=REQUIRED
ADMIN_BYPASS_DISABLED=REQUIRED
FORCE_PUSH_DISABLED=REQUIRED
DELETION_DISABLED=REQUIRED
EXACT_HEAD_APP_CHECK=REQUIRED
EXPECTED_HEAD_SHA_MERGE_FENCE=REQUIRED_AS_DEFENSE_IN_DEPTH
```

All PR #147 receipt, candidate-independence, reviewer, credential, source-provenance, deployment-provenance, and four-path establishment boundaries remain in force except where they explicitly depended on merge queue.

---

## 12. Revised future slice ordering

After this repair becomes canonical:

### AG-1 — App discovery/proof planning

May define and later prove:

```text
exact App logical identity
future App registration identity requirements
installation scope = TheHalfMoon/Kodac only
exact source provenance model
exact deployment provenance model
permission set
webhook event set
webhook authentication/deduplication contract
receipt schemas
append-only store implementation choice
reviewer allowlist qualification criteria
fail-closed exact-head check semantics
```

AG-1 in its next docs-only planning slice must **not** create or install the App unless a later explicit authorization grants those mutations.

### AG-2 — protected-main configuration proof

After App identity/check source can be observed, AG-2 may separately configure the authorized protected-main controls and bind `kodac/phase-b-gate` to the exact App source.

### AG-3 — removed as merge-group prerequisite

No `.github/**` merge-group compatibility mutation is required merely to implement the repaired Phase-B architecture.

Existing workflows remain unchanged unless a separate future need is independently authorized.

### AG-4 — sacrificial qualification PR

Still mandatory before the real trust-root establishment candidate.

The sacrificial test must now exercise the protected-branch architecture rather than merge queue.

---

## 13. Revised adversarial qualification matrix

The later sacrificial qualification must prove at least:

```text
valid exact-head founder bootstrap event -> receipt PASS
wrong founder login -> receipt FAIL
wrong repository -> receipt FAIL
wrong PR number -> receipt FAIL
wrong candidate head -> receipt FAIL
malformed bootstrap body -> receipt FAIL
bootstrap body hash mutation -> receipt FAIL
receipt missing -> gate FAIL
receipt digest mismatch -> gate FAIL
receipt overwrite attempt -> FAIL / NO MUTATION
valid independent exact-head clean review -> receipt PASS
wrong reviewer identity -> receipt FAIL
unqualified reviewer provider -> receipt FAIL
review bound to old head -> receipt FAIL
review with actionable finding -> receipt FAIL
provider with top-level-only material finding -> NOT QUALIFIED
missing Phase-B App check -> MERGE BLOCKED
Phase-B App check pending -> MERGE BLOCKED
Phase-B App check failure -> MERGE BLOCKED
same-name check from wrong source -> MERGE BLOCKED
new unresolved review conversation -> MERGE BLOCKED
resolved conversation -> eligibility may recover only if all other gates pass
candidate behind current main -> MERGE BLOCKED
main movement -> candidate must become up to date before merge
candidate update after main movement -> old receipts INVALID
candidate head change -> old App check INVALID
raw/direct push to main -> BLOCKED
administrator attempts branch-protection bypass -> BLOCKED
force push to main -> BLOCKED
main deletion -> BLOCKED
candidate attempts .github gate mutation -> establishment allowlist FAIL
candidate attempts protection/config mutation -> establishment qualification FAIL
expected-head mismatch at merge request -> MERGE REJECTED
```

The test fixture must not be the real trust-root establishment PR.

---

## 14. Revised future gate evidence fields

The future proof package must bind at least:

```text
GATE_AUTHORIZATION_COMMIT=<PR #147 canonical merge>
CAPABILITY_REPAIR_COMMIT=<canonical merge commit of this repair>
REPOSITORY_OWNER_TYPE=User
REPOSITORY_VISIBILITY=public
MERGE_QUEUE_USED=NO
GITHUB_APP_IDENTITY=<exact App identity>
GITHUB_APP_INSTALLATION_ID=<exact installation identity>
GITHUB_APP_SOURCE_EXACT_REVISION=<exact source identity>
GITHUB_APP_DEPLOYMENT_IDENTITY=<exact deployment identity>
GITHUB_APP_PERMISSION_SET_SHA256=<digest>
GITHUB_APP_EVENT_SET_SHA256=<digest>
GITHUB_APP_REVIEWER_ALLOWLIST_SHA256=<digest>
RECEIPT_STORE_IDENTITY=<candidate-independent identity>
RECEIPT_STORE_APPEND_ONLY_PROOF=PASS
PHASE_B_CHECK_NAME=kodac/phase-b-gate
PHASE_B_CHECK_EXPECTED_SOURCE=<exact App identity>
MAIN_PROTECTION_IDENTITY=<live GitHub identity or normalized configuration identity>
MAIN_PROTECTION_CONFIGURATION_SHA256=<digest>
REQUIRE_BRANCH_UP_TO_DATE_PROOF=PASS
REQUIRE_CONVERSATION_RESOLUTION_PROOF=PASS
ADMIN_BYPASS_DISABLED_PROOF=PASS
FORCE_PUSH_BLOCK_PROOF=PASS
DELETION_BLOCK_PROOF=PASS
SACRIFICIAL_QUALIFICATION_PR=<PR number>
SACRIFICIAL_QUALIFICATION_HEAD=<head SHA>
NEGATIVE_TEST_MATRIX=PASS
WRONG_SOURCE_BLOCK_PROOF=PASS
UNRESOLVED_CONVERSATION_BLOCK_PROOF=PASS
BASE_MOVEMENT_BLOCK_PROOF=PASS
EXPECTED_HEAD_MISMATCH_BLOCK_PROOF=PASS
```

No merge-queue configuration digest is required by the repaired theorem.

---

## 15. Founder ceremony preservation

This repair changes no signed founder preimage or nonce-disposition preimage.

```text
AUTHORIZATION_COMMIT=ecd0e6687e91e627a73281dcc71678d8bf8152d0
TRUST_ROOT_ID_SHA256=d8a87fb2f17ecaeefd345f2d323b0776c0e51429f7a2dd7c78df6a6068535d98
ESTABLISHMENT_PREIMAGE_SHA256=e57222d6198eb00e2d795fc0c4a82fec3922ba8f22a49edb3fd0a5f0020b2d4f
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=074d1034172792aca9e071caf124c487adff2fb7f78fefd2c43ea6af8711cf71
ESTABLISHMENT_SIGNATURE_STATUS=UNCHANGED
ESTABLISHMENT_NONCE_DISPOSITION_SIGNATURE_STATUS=UNCHANGED
NONCE_RETIREMENT_REQUIRED=NO
FRESH_NONCE_REQUIRED=NO
RESIGNING_REQUIRED=NO
PRIVATE_KEY_ACCESS=NO
SIGNING=NO
```

---

## 16. Explicit non-grants

```text
GITHUB_APP_CREATION=NO
GITHUB_APP_INSTALLATION=NO
GITHUB_APP_PRIVATE_KEY_GENERATION=NO
GITHUB_APP_PRIVATE_KEY_ACCESS=NO
GITHUB_APP_WEBHOOK_SECRET_GENERATION=NO
GITHUB_APP_CREDENTIAL_ACCESS=NO
RECEIPT_STORE_CREATION=NO
RECEIPT_STORE_CREDENTIAL_ACCESS=NO
RULESET_MUTATION=NO
BRANCH_PROTECTION_MUTATION=NO
MERGE_QUEUE_CONFIGURATION_MUTATION=NO
WORKFLOW_MUTATION=NO
TRUST_ROOT_ESTABLISHMENT_IMPLEMENTATION=NO
TRUST_ROOT_BOOTSTRAP_COMMENT=NOT_YET
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

## 17. Repair PR merge gate

This repair may merge only if:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
NATIVE_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
RULESET_MUTATIONS=0
BRANCH_PROTECTION_MUTATIONS=0
APP_MUTATIONS=0
RECEIPT_STORE_MUTATIONS=0
TRUST_ROOT_PREIMAGE_CHANGED=NO
NONCE_DISPOSITION_PREIMAGE_CHANGED=NO
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

Any material review finding is repaired in this document only and invalidates old exact-head qualification.

---

## 18. Post-repair state

If this document becomes canonical, the maximum state is:

```text
PHASE_B_PERSONAL_REPOSITORY_CAPABILITY_REPAIR=CANONICAL
PHASE_B_SERVER_SIDE_ATOMIC_GATE_ARCHITECTURE=REPAIRED_FOR_CURRENT_REPOSITORY
AG1_DISCOVERY_PROOF_PLANNING=AUTHORIZED_TO_START
```

Still not proven:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE=NOT_PROVEN
GITHUB_APP_IDENTITY=NOT_ESTABLISHED
GITHUB_APP_INSTALLATION=NOT_ESTABLISHED
RECEIPT_STORE=NOT_ESTABLISHED
MAIN_PROTECTION_CONFIGURATION=NOT_PROVEN
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT=BLOCKED
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

The next safe slice after this repair is AG-1 discovery/proof planning using the repaired personal-repository architecture. It is not GitHub App installation, branch-protection mutation, or trust-root establishment.