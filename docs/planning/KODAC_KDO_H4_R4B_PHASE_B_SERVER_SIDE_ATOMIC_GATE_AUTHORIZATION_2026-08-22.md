# KODAC KDO H4-R4B Phase-B Server-Side Atomic Gate Authorization

Date: 2026-08-22
Status: AUTHORIZATION_CANDIDATE / DOCS_ONLY / NO_RULESET_MUTATION / NO_APP_INSTALLATION / NO_WORKFLOW_MUTATION / NO_TRUST_ROOT_ESTABLISHMENT

## 1. Purpose

Authorize the smallest safe design predecessor required by canonical PR #146 before the founder process-authority trust root may be established.

Canonical PR #146 proved that a client-side finalizer plus `expected_head_sha` cannot by itself make review/comment/thread metadata atomic with the merge operation. This document therefore selects a server-enforced architecture that moves merge-critical mutable predicates into GitHub's protected-branch / ruleset / merge-queue control plane and moves Kodac-specific founder/reviewer bindings into a candidate-independent GitHub App check.

This document authorizes design and a later separately qualified implementation/configuration slice only. It does **not** mutate repository rules, install or create a GitHub App, modify workflows, enqueue or merge a trust-root candidate, access a founder private key, sign anything, establish the trust root, or execute artifact/runtime work.

Maximum result of this docs-only PR if merged:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE_AUTHORIZATION=CANONICAL
```

It is not equivalent to:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE=PROVEN
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=CANONICAL_PROVEN
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=PASS
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN
B1_V2_IMPLEMENTATION=AUTHORIZED
H4_COMPLETE=YES
```

---

## 2. Canonical predecessor

```text
CANONICAL_MAIN=349ba9ddf8d6dda8bdc274cd6898cece578c4fe7
CANONICAL_MAIN_TREE=95220c8870172dbbc08eb2654a25fcac529ec714
PR_146=MERGED_CANONICAL
PR_146_REVIEWED_HEAD=f20b377ed0f7d64e7c96a01671a99ed981845223
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_PHASE_SEPARATION_REPAIR=CANONICAL
PHASE_B_SERVER_SIDE_ATOMIC_GATE_PREREQUISITE=CANONICAL_REQUIRED
PHASE_B_SERVER_SIDE_ATOMIC_GATE=NOT_PROVEN
```

The founder ceremony remains cryptographically unchanged:

```text
AUTHORIZATION_COMMIT=ecd0e6687e91e627a73281dcc71678d8bf8152d0
TRUST_ROOT_ID_SHA256=d8a87fb2f17ecaeefd345f2d323b0776c0e51429f7a2dd7c78df6a6068535d98
ESTABLISHMENT_PREIMAGE_SHA256=e57222d6198eb00e2d795fc0c4a82fec3922ba8f22a49edb3fd0a5f0020b2d4f
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=074d1034172792aca9e071caf124c487adff2fb7f78fefd2c43ea6af8711cf71
NONCE_RETIREMENT_REQUIRED=NO
FRESH_NONCE_REQUIRED=NO
RESIGNING_REQUIRED=NO
```

---

## 3. Primary-source capability basis

The selected design relies only on documented GitHub server-side primitives:

1. repository branch rulesets / branch protection can require pull requests, required status checks, conversation resolution, and block force pushes;
2. a required status check can require a specific GitHub App as the expected source;
3. required status checks can be strict with respect to the current base branch;
4. a repository-level rule can require merge queue;
5. merge queue evaluates required checks on a `merge_group` built against the latest target-branch state;
6. GitHub Apps can receive `merge_group.checks_requested` and report check results for the merge-group head SHA;
7. merge queue can be configured to require all queue entries to pass required checks and to limit the maximum number of PRs merged together.

Primary references:

- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets-for-a-repository
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
- https://docs.github.com/en/webhooks/webhook-events-and-payloads#merge_group

If any required GitHub capability is unavailable for this repository at implementation time, the implementation must fail closed and return for a new authorization. No weaker client-only substitute is permitted.

---

## 4. Selected architecture

The authorized architecture is exactly two server-side enforcement layers plus immutable event receipts.

### Layer A — GitHub repository ruleset / protected-branch enforcement

Target:

```text
REPOSITORY=TheHalfMoon/Kodac
TARGET_BRANCH=main
CONTROL_PLANE=GitHub server-side repository rules
```

Required semantics:

```text
REQUIRE_PULL_REQUEST_BEFORE_MERGE=YES
REQUIRE_CONVERSATION_RESOLUTION_BEFORE_MERGE=YES
REQUIRE_STATUS_CHECKS_BEFORE_MERGE=YES
REQUIRE_MERGE_QUEUE=YES
BLOCK_FORCE_PUSHES=YES
BLOCK_BRANCH_DELETION=YES
CONFIGURED_BYPASS_ACTORS=0
```

The ruleset must also require the Kodac Phase-B check from one exact expected GitHub App source. A same-named status emitted by a user, workflow, token, or different App must not satisfy the requirement.

### Layer B — candidate-independent Kodac Phase-B GitHub App

Logical identity:

```text
GATE_LOGICAL_NAME=kodac-phase-b-gate
GATE_CHECK_NAME=kodac/phase-b-gate
EXECUTION_CLASS=GITHUB_APP_SERVER_SIDE_CHECK
CANDIDATE_REPOSITORY_CODE_AUTHORITY=NONE
```

The App implementation, credentials, installation configuration, and signing material must not live in the trust-root candidate branch or in any path the trust-root candidate may modify.

The App must be the expected source of `kodac/phase-b-gate` in the repository rule.

The App must evaluate both ordinary PR-head qualification and `merge_group.checks_requested`, but the merge-authoritative PASS is the check associated with the current merge-group head.

---

## 5. Why the architecture closes the PR #146 TOCTOU gap

The PR #146 defect came from treating mutable GitHub metadata as if a client-side read could be made atomic with a later merge request.

This authorization removes that assumption.

Merge-critical state is split into two categories.

### Category 1 — state GitHub itself enforces at merge time

```text
pull-request-only update path
required status checks
conversation resolution
merge-queue requirement
latest-base merge-group construction
force-push prohibition
branch-deletion prohibition
```

These predicates are not accepted from a client-side snapshot. They are repository rules evaluated by GitHub's merge control plane.

### Category 2 — Kodac-specific historical authorization events

```text
founder bootstrap approval event
fresh independent exact-head clean-review event
```

These are converted from mutable PR metadata into immutable, content-addressed receipts by the candidate-independent App. Once a valid receipt is issued for an exact head, the original comment/review object is no longer itself a continuously live merge predicate.

This distinction is required. Otherwise editing a comment after a check but before a merge would recreate the exact PR #146 race.

---

## 6. Founder bootstrap approval event receipt

Canonical PR #145 still requires the one-time top-level founder bootstrap approval comment on the frozen establishment head.

The future App must observe that event directly from GitHub and issue exactly one immutable receipt for the first valid approval event matching the exact frozen head.

Required observed comment lines remain:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<exact frozen establishment head SHA>
TRUST_ROOT_ID_SHA256=<64 lowercase hex chars>
PUBLIC_KEY_SPKI_DER_SHA256=<64 lowercase hex chars>
ESTABLISHMENT_PREIMAGE_SHA256=<64 lowercase hex chars>
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=<64 lowercase hex chars>
```

Required observed identity:

```text
COMMENT_AUTHOR_LOGIN=TheHalfMoon
COMMENT_TYPE=TOP_LEVEL_PR_COMMENT
COMMENT_PR=<exact establishment PR number>
COMMENT_REPOSITORY=TheHalfMoon/Kodac
```

Receipt schema:

```text
schemaVersion=kodac-phase-b-founder-bootstrap-receipt-v1
repository
pullRequestNumber
candidateHeadSha
commentId
commentCreatedAtUtc
commentAuthorLogin
commentBodySha256
trustRootIdSha256
publicKeySpkiDerSha256
establishmentPreimageSha256
establishmentNonceDispositionSha256
observedAtUtc
appInstallationId
appIdentity
```

Receipt identity:

```text
FOUNDER_BOOTSTRAP_RECEIPT_DOMAIN=kodac-phase-b-founder-bootstrap-receipt-v1
FOUNDER_BOOTSTRAP_RECEIPT_PREIMAGE=
  UTF8(FOUNDER_BOOTSTRAP_RECEIPT_DOMAIN)
  || 0x00
  || RFC8785_JCS_UTF8(<strict receipt object>)
FOUNDER_BOOTSTRAP_RECEIPT_SHA256=sha256(FOUNDER_BOOTSTRAP_RECEIPT_PREIMAGE)
```

Unknown fields and duplicate keys are forbidden.

The receipt proves a historical founder approval event for one exact candidate head. Editing or deleting the source comment after a valid receipt is issued does not retroactively erase that already-observed event and is not used as a merge-time revocation channel.

There is no comment-based revocation protocol. If the founder intends to stop the candidate after issuing approval, the supported actions are to close/remove the PR from the queue or change the candidate head, both of which invalidate merge eligibility through GitHub's own PR/head state.

This event-to-receipt conversion is the explicit semantic repair that prevents mutable founder-comment state from recreating a TOCTOU predicate.

---

## 7. Independent exact-head review receipt

A qualifying independent review remains mandatory.

The App may recognize only an explicitly configured allowlist of independent reviewer identities established in the later gate-implementation proof. The trust-root candidate cannot modify this allowlist.

The App must issue a clean-review receipt only after all of the following are true for the exact candidate head:

```text
REVIEWER_IDENTITY_ALLOWLIST_MATCH=PASS
REVIEW_BINDS_EXACT_HEAD=PASS
REVIEW_IS_FRESH_AFTER_LATEST_CANDIDATE_MUTATION=PASS
REVIEW_TERMINAL_VERDICT=CLEAN
ACTIONABLE_FINDINGS_AT_RECEIPT_TIME=0
```

Receipt schema:

```text
schemaVersion=kodac-phase-b-independent-review-receipt-v1
repository
pullRequestNumber
candidateHeadSha
reviewProviderIdentity
reviewRecordId
reviewRecordCreatedAtUtc
reviewRecordSha256
terminalVerdict
observedAtUtc
appInstallationId
appIdentity
```

Receipt identity uses the same domain-separated JCS + SHA-256 construction with domain:

```text
kodac-phase-b-independent-review-receipt-v1
```

The review receipt is historical proof that a clean independent exact-head review completed. Later actionable findings must be represented as unresolved PR review conversations to be merge-blocking. `REQUIRE_CONVERSATION_RESOLUTION_BEFORE_MERGE=YES` is therefore mandatory and is not replaceable by the review receipt.

A top-level summary update without an unresolved actionable review conversation does not retroactively invalidate an already-issued clean review receipt.

---

## 8. Required Phase-B App check contract

The App check name is fixed:

```text
kodac/phase-b-gate
```

The merge-authoritative check must run on `merge_group.checks_requested` and fail closed unless it proves at least:

```text
PHASE_B_GATE_SCHEMA_VERSION=kodac-phase-b-gate-v1
REPOSITORY_BINDING_PROOF=PASS
TARGET_BRANCH_BINDING_PROOF=PASS
ESTABLISHMENT_PR_BINDING_PROOF=PASS
CANDIDATE_HEAD_BINDING_PROOF=PASS
MERGE_GROUP_CONTAINS_EXPECTED_CANDIDATE_PROOF=PASS
FOUNDER_BOOTSTRAP_RECEIPT_PROOF=PASS
FOUNDER_BOOTSTRAP_EXACT_HEAD_PROOF=PASS
INDEPENDENT_REVIEW_RECEIPT_PROOF=PASS
INDEPENDENT_REVIEW_EXACT_HEAD_PROOF=PASS
TRUST_ROOT_ID_BINDING_PROOF=PASS
ESTABLISHMENT_PREIMAGE_BINDING_PROOF=PASS
NONCE_DISPOSITION_BINDING_PROOF=PASS
FOUR_PATH_ESTABLISHMENT_DELTA_PROOF=PASS
FORBIDDEN_PATH_DELTA_ZERO_PROOF=PASS
REQUIRED_RULESET_IDENTITY_PROOF=PASS
REQUIRED_RULESET_CONFIGURATION_PROOF=PASS
EXPECTED_APP_SOURCE_PROOF=PASS
```

The App check must not claim the state of built-in GitHub predicates that GitHub itself enforces at merge time as a substitute for those rules. Redundant observation is allowed, but the server-side rule remains authoritative for conversation resolution and required status-check enforcement.

---

## 9. Merge-queue configuration theorem

The later configuration proof must establish a repository-level merge queue for `main`.

Required configuration:

```text
MERGE_QUEUE_REQUIRED=YES
MERGE_METHOD=MERGE
REQUIRE_ALL_QUEUE_ENTRIES_TO_PASS_REQUIRED_CHECKS=YES
MAXIMUM_PULL_REQUESTS_TO_MERGE_TOGETHER=1
MINIMUM_PULL_REQUESTS_TO_MERGE_TOGETHER=1
```

`MAXIMUM_PULL_REQUESTS_TO_MERGE_TOGETHER=1` is required so the trust-root qualification theorem never has to infer which of multiple independently changing PRs produced a grouped landing decision.

Build concurrency may be greater than one because it limits concurrent merge-group builds rather than the number of PRs merged together. It is not itself a security boundary.

The later proof must demonstrate that the required `kodac/phase-b-gate` check is requested for the merge group and that no merge occurs when that check is absent, pending, or failing.

---

## 10. Existing CI and merge-group compatibility

The establishment merge must remain subject to the existing required governance/runtime checks appropriate to the candidate.

GitHub documents that GitHub Actions checks required by a merge queue must support the `merge_group` event. Therefore the implementation phase must discover the exact current required check contexts and whether they already report on merge-group heads.

This authorization does not assume exact check-context names and does not authorize workflow mutation now.

Required discovery result before configuration:

```text
CURRENT_REQUIRED_CHECK_CONTEXT_DISCOVERY=PASS
MERGE_GROUP_COMPATIBILITY_DISCOVERY=PASS
```

If an existing required check does not report for `merge_group`, a separate narrowly scoped workflow-compatibility authorization is required before changing `.github/**`.

No silent workflow widening is allowed.

---

## 11. Ruleset / protection configuration requirements

The later server-side configuration proof must record and independently verify at least:

```text
RULESET_OR_PROTECTION_ID
RULESET_TARGET=main
ENFORCEMENT_STATUS=ACTIVE
REQUIRE_PULL_REQUEST=YES
REQUIRE_CONVERSATION_RESOLUTION=YES
REQUIRE_STATUS_CHECKS=YES
REQUIRE_MERGE_QUEUE=YES
BLOCK_FORCE_PUSHES=YES
BLOCK_DELETIONS=YES
CONFIGURED_BYPASS_ACTORS=0
PHASE_B_CHECK_NAME=kodac/phase-b-gate
PHASE_B_CHECK_EXPECTED_SOURCE=<exact GitHub App identity>
```

The proof must use live GitHub configuration reads after mutation. Screenshots or prose declarations are insufficient by themselves.

If GitHub exposes both classic branch protection and repository rulesets that overlap, the implementation must prove the effective combined rule state and must not assume that one UI surface supersedes the other.

---

## 12. Candidate-independence boundary

The trust-root establishment candidate must not be able to weaken the gate.

Therefore the establishment four-path allowlist remains exactly:

```text
1. provenance/kdo-h4-r4b-founder-process-authority-trust-root-v1.json
2. packages/kodac-runtime/test/helpers/kdo-h4-r4b-founder-process-authority-verifier.ts
3. packages/kodac-runtime/test/kdo-h4-r4b-founder-process-authority-trust-root.test.ts
4. docs/planning/KODAC_KDO_H4_R4B_FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_2026-08-21.md
```

The establishment candidate is forbidden from changing:

```text
.github/**
repository rulesets / branch protection
GitHub App installation or permissions
GitHub App source/configuration
required status-check expected source
merge-queue configuration
reviewer allowlists used by the App
server-side receipt storage / receipt signing configuration
```

Any such mutation belongs to a separate predecessor and invalidates establishment qualification until independently reconciled.

---

## 13. Administrative control-plane trust boundary

No GitHub repository rule can make a malicious organization owner cryptographically unable to change repository settings.

Therefore the exact threat model is explicit:

```text
CANDIDATE_CONTROLLED_BYPASS=FORBIDDEN_AND_IN_SCOPE
ORDINARY_WRITE_ACTOR_BYPASS=FORBIDDEN_AND_IN_SCOPE
MISCONFIGURED_RULESET_BYPASS=FORBIDDEN_AND_IN_SCOPE
WRONG_STATUS_CHECK_SOURCE=FORBIDDEN_AND_IN_SCOPE
MALICIOUS_GITHUB_ORG_ADMIN_CONTROL_PLANE=OUT_OF_SCOPE_TRUST_ROOT
GITHUB_PLATFORM_COMPROMISE=OUT_OF_SCOPE_TRUST_ROOT
```

The canonical founder / organization-administration control plane is a trusted external authority for establishing the gate. Configuration proof and audit evidence remain mandatory.

This limitation must not be hidden behind an absolute claim that GitHub administrators are technically incapable of disabling repository rules.

---

## 14. Future implementation/configuration slices

This authorization intentionally separates future work.

### AG-1 — GitHub App identity and receipt-contract proof

May establish and prove:

```text
exact App identity
installation identity
minimum required permissions
webhook/event subscriptions
receipt schemas
receipt canonicalization
candidate-head binding
reviewer allowlist
fail-closed check semantics
```

It must not yet modify `main` merge rules unless separately included in the authorized configuration slice.

### AG-2 — repository ruleset / merge-queue configuration proof

May configure only the exact server-side controls authorized by this document after AG-1 is proven.

It must retain before/after configuration evidence and prove zero unexpected bypass actors.

### AG-3 — merge-group CI compatibility, only if required

If discovery proves current required checks do not report on `merge_group`, a new explicit authorization is required for exact workflow paths before any `.github/**` mutation.

### AG-4 — sacrificial qualification PR

A dedicated non-trust-root fixture PR must prove the complete server-side behavior before the real trust-root establishment PR proceeds.

The real trust-root establishment candidate is not the test fixture for the gate.

---

## 15. Required adversarial qualification matrix

AG-4 must prove at least:

```text
valid exact-head founder bootstrap event -> receipt PASS
wrong founder login -> receipt FAIL
wrong repository -> receipt FAIL
wrong PR number -> receipt FAIL
wrong candidate head -> receipt FAIL
malformed bootstrap body -> receipt FAIL
bootstrap body hash mutation -> receipt FAIL
valid independent exact-head clean review -> receipt PASS
wrong reviewer identity -> receipt FAIL
review bound to old head -> receipt FAIL
review with actionable finding -> receipt FAIL
missing Phase-B App check -> MERGE BLOCKED
Phase-B App check pending -> MERGE BLOCKED
Phase-B App check failure -> MERGE BLOCKED
same-name check from wrong source -> MERGE BLOCKED
new unresolved review conversation -> MERGE BLOCKED
conversation resolved -> eligibility may recover only after all other gates pass
required CI failure -> MERGE BLOCKED
required CI pending -> MERGE BLOCKED
main movement -> new merge-group evaluation REQUIRED
direct merge outside merge queue -> BLOCKED
force push to main -> BLOCKED
main deletion -> BLOCKED
multiple PR merge grouping -> FORBIDDEN_BY_MAX_GROUP_SIZE_1
candidate change after receipts -> old receipts INVALID
candidate attempts .github gate mutation -> establishment allowlist FAIL
candidate attempts ruleset/config mutation -> establishment qualification FAIL
```

The qualification must include negative tests; a successful happy-path merge alone is insufficient.

---

## 16. Gate proof artifact requirements

Before the real establishment candidate can start, a later canonical evidence package must bind at least:

```text
GATE_AUTHORIZATION_COMMIT=<canonical merge commit of this authorization>
GITHUB_APP_IDENTITY=<exact app identity>
GITHUB_APP_INSTALLATION_ID=<exact installation identity>
GITHUB_APP_PERMISSION_SET_SHA256=<canonical permission-set digest>
GITHUB_APP_EVENT_SET_SHA256=<canonical event-set digest>
FOUNDER_BOOTSTRAP_RECEIPT_SCHEMA_SHA256=<schema digest>
INDEPENDENT_REVIEW_RECEIPT_SCHEMA_SHA256=<schema digest>
PHASE_B_CHECK_NAME=kodac/phase-b-gate
PHASE_B_CHECK_EXPECTED_SOURCE=<exact App identity>
RULESET_OR_PROTECTION_ID=<live GitHub identifier>
RULESET_CONFIGURATION_SHA256=<canonical normalized configuration digest>
MERGE_QUEUE_CONFIGURATION_SHA256=<canonical normalized configuration digest>
SACRIFICIAL_QUALIFICATION_PR=<PR number>
SACRIFICIAL_QUALIFICATION_HEAD=<exact head SHA>
NEGATIVE_TEST_MATRIX=PASS
DIRECT_MERGE_BLOCK_PROOF=PASS
WRONG_SOURCE_BLOCK_PROOF=PASS
UNRESOLVED_CONVERSATION_BLOCK_PROOF=PASS
MAIN_MOVEMENT_REEVALUATION_PROOF=PASS
```

The evidence package must distinguish configuration that is stored in GitHub's control plane from ordinary repository Git blobs.

---

## 17. Prohibited shortcuts

The following do not satisfy this authorization:

```text
client-side double-read + expected_head_sha only
PR comment that merely says all gates passed
status check with expected source = any source
candidate-controlled GitHub Actions workflow as the sole Phase-B gate
checking founder comment live immediately before merge without receipt conversion
using editable founder comment state as a continuous revocation mechanism
ignoring unresolved conversations because a clean review receipt exists
merge without merge queue
merge queue without merge_group Phase-B check
merge-group check that does not bind the exact establishment PR/head
configured bypass actors
using the real trust-root establishment PR as the first gate test
```

---

## 18. Public ceremony preservation

This gate work changes no signed founder preimage.

```text
TRUST_ROOT_ID_SHA256=d8a87fb2f17ecaeefd345f2d323b0776c0e51429f7a2dd7c78df6a6068535d98
ESTABLISHMENT_PREIMAGE_SHA256=e57222d6198eb00e2d795fc0c4a82fec3922ba8f22a49edb3fd0a5f0020b2d4f
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=074d1034172792aca9e071caf124c487adff2fb7f78fefd2c43ea6af8711cf71
ESTABLISHMENT_NONCE_DISPOSITION_SIGNATURE_STATUS=UNCHANGED
ESTABLISHMENT_SIGNATURE_STATUS=UNCHANGED
PRIVATE_KEY_ACCESS=NO
SIGNING=NO
NONCE_RETIREMENT_REQUIRED=NO
FRESH_NONCE_REQUIRED=NO
RESIGNING_REQUIRED=NO
```

Delay caused by gate implementation/qualification does not itself invalidate the establishment signatures.

---

## 19. Explicit non-grants

```text
GITHUB_APP_CREATION=NOT_AUTHORIZED_BY_THIS_PR
GITHUB_APP_INSTALLATION=NOT_AUTHORIZED_BY_THIS_PR
GITHUB_APP_CREDENTIAL_ACCESS=NO
RULESET_MUTATION=NO
BRANCH_PROTECTION_MUTATION=NO
MERGE_QUEUE_CONFIGURATION_MUTATION=NO
WORKFLOW_MUTATION=NO
TRUST_ROOT_ESTABLISHMENT_IMPLEMENTATION=NO
TRUST_ROOT_BOOTSTRAP_COMMENT=NOT_YET
TRUST_ROOT_KEY_GENERATION=NO
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

## 20. Authorization PR merge gate

This docs-only authorization may merge only if:

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
APP_INSTALLATION_MUTATIONS=0
TRUST_ROOT_PREIMAGE_CHANGED=NO
NONCE_DISPOSITION_PREIMAGE_CHANGED=NO
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If `main` moves, this authorization candidate must be reconciled before merge.

---

## 21. Post-authorization state

If this document becomes canonical, the maximum claim is:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE_AUTHORIZATION=CANONICAL
```

The state remains:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE=NOT_PROVEN
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT=BLOCKED
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

The next safe action after canonicalization is AG-1 discovery/proof planning for the candidate-independent GitHub App identity, permissions, webhook surface, receipt contracts, and server-side check source. It is **not** trust-root establishment.
