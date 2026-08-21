# KODAC KDO H4-R4B Founder Process-Authority Trust-Root Evidence Phase-Separation Repair

Date: 2026-08-22
Status: REPAIR_CANDIDATE / DOCS_ONLY / NO_KEY_MATERIAL / NO_SIGNING / NO_PROCESS_EXECUTION

## 1. Purpose

Repair one self-referential evidence requirement in the canonical founder process-authority trust-root establishment authorization without changing its cryptographic establishment object, public-key identity, nonce, signed preimages, four-path establishment allowlist, or authority boundaries.

Canonical predecessor:

```text
CANONICAL_MAIN=ecd0e6687e91e627a73281dcc71678d8bf8152d0
CANONICAL_MAIN_TREE=ab1f809d31d19af2d8d2e7b0bca846f116d0ec12
PR_145=MERGED_CANONICAL
AUTHORIZATION_COMMIT=ecd0e6687e91e627a73281dcc71678d8bf8152d0
```

Maximum result of this repair if merged:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_PHASE_SEPARATION_REPAIR=CANONICAL
```

It is not equivalent to trust-root establishment, process authority, artifact execution, B1-v2 authorization, or H4 completion.

---

## 2. Defect being repaired

The canonical authorization requires the future in-repository establishment evidence document to retain, among other facts:

```text
trust-root candidate exact head SHA/tree
exact-head CI result
fresh independent exact-head review result
unresolved actionable thread count
final main/head diff fence
expected-head SHA merge fence
```

The evidence document itself is one of the four files that form the candidate Git tree. Therefore embedding the final candidate commit SHA/tree in that file changes the Git blob, which changes the tree and commit SHA. Likewise, exact-head CI and independent review can exist only after the candidate head has already been created; writing those results back into the candidate evidence file creates a new head and invalidates the evidence just collected.

Interpreting those clauses as requiring literal final values inside the same final candidate bytes is therefore self-referential and cannot be satisfied by an ordinary Git commit workflow.

Failing to repair this would force either:

```text
stale-head evidence
placeholder values
post-review mutation
or an unprovable self-referential fixed point
```

All four are forbidden.

---

## 3. Phase-separation theorem

The establishment proof is divided into two evidence phases.

### Phase A — in-repository pre-freeze evidence

The allowlisted establishment evidence document is part of the candidate head and may retain only facts that are fully determined before that head is frozen, including:

```text
canonical predecessor main SHA/tree
AUTHORIZATION_COMMIT
all four allowlisted path names and object-mode requirements
public SPKI DER hex and SHA-256
trustRootIdSha256
establishment challenge nonce
issuedAtUtc
establishment canonical object/JCS/preimage SHA-256
establishment detached Ed25519 signature
current sequence-1 nonce-disposition object/JCS/preimage SHA-256
current nonce-disposition detached Ed25519 signature
atomic nonce-state key
public durable-state evidence identity supplied by the founder ceremony
historical retirement envelopes, if any
Node verification version
focused local test results that precede head freeze
private-material absence assertions
explicit non-grants
```

The Phase-A document must not contain guessed or placeholder final-head values.

### Phase B — external post-freeze GitHub evidence

After the exact candidate head is frozen, the following facts are obtained from live GitHub records and retained outside the candidate tree:

```text
trust-root candidate exact head SHA/tree
founder bootstrap approval comment author/login/ID/URL/timestamp/body
founder bootstrap exact-head binding
exact-head CI workflow run IDs/names/conclusions
fresh independent exact-head review provider/record ID/timestamp/body/head binding
review-thread snapshot and unresolved actionable thread count
final canonical-main versus exact-head compare fence
Phase-B reconciliation record and SHA-256
Phase-B reconciliation PR comment ID/URL/timestamp
expected-head SHA merge request/result
canonical merge commit, message, tree, and ordered parents
```

These are `POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE`.

Any mutation to an allowlisted candidate file after Phase B begins invalidates every Phase-B head-bound record and requires a fresh Phase-B cycle.

---

## 4. Authoritative Phase-B finalizer

Phase B is not satisfied by labels or prose. The only authorized merger path for the trust-root establishment PR is the fail-closed external protocol:

```text
PHASE_B_FINALIZER_PROTOCOL=kodac-founder-trust-root-phase-b-finalizer-v1
PHASE_B_FINALIZER_SOURCE_OF_TRUTH=LIVE_GITHUB_API
PHASE_B_FINALIZER_CANDIDATE_MUTATION=FORBIDDEN
PHASE_B_FINALIZER_NETWORK_SCOPE=GITHUB_ONLY
PHASE_B_FINALIZER_DOCKER_ACCESS=FORBIDDEN
PHASE_B_FINALIZER_PRIVATE_KEY_ACCESS=FORBIDDEN
PHASE_B_FINALIZER_SIGNING=FORBIDDEN
```

The finalizer may be implemented by an authenticated founder-session GitHub API client. It is external governance tooling, not part of the Phase-A verifier. A normal merge-button action that does not first execute and retain this protocol is not an authorized establishment merge.

### 4.1 Mandatory live GitHub reads

Immediately before merge, the finalizer must fetch and validate all of these live records for `TheHalfMoon/Kodac`:

```text
1. canonical main branch ref and commit/tree
2. establishment PR metadata
3. exact PR head commit/tree
4. canonical-main...exact-head compare result and changed paths
5. pull-request-triggered workflow runs for the exact head
6. PR review submissions and review-provider records
7. PR inline review threads including resolved/outdated state
8. PR top-level comments including the founder bootstrap approval
```

Equivalent GitHub REST/GraphQL reads are allowed, but every predicate below must be checked from live responses rather than copied from the Phase-A evidence file.

Required PR/head predicates:

```text
REPOSITORY=TheHalfMoon/Kodac
PR_STATE=OPEN
PR_DRAFT=NO
PR_BASE=main
PR_HEAD=<one frozen 40-hex commit SHA>
PR_HEAD_TREE=<tree resolved from that exact commit>
MAIN_HEAD=<one observed canonical predecessor SHA>
MAIN_TREE=<tree resolved from MAIN_HEAD>
COMPARE_MERGE_BASE=MAIN_HEAD
COMPARE_BEHIND_BY=0
CHANGED_PATHS=EXACTLY_4_ALLOWLISTED_ESTABLISHMENT_PATHS
NO_UNEXPECTED_PATHS=PASS
```

Required exact-head CI predicates:

```text
GOVERNANCE_WORKFLOW_HEAD_SHA=PR_HEAD
GOVERNANCE_WORKFLOW_EVENT=pull_request
GOVERNANCE_WORKFLOW_CONCLUSION=success
K2_RUNTIME_WORKFLOW_HEAD_SHA=PR_HEAD
K2_RUNTIME_WORKFLOW_EVENT=pull_request
K2_RUNTIME_WORKFLOW_CONCLUSION=success
```

The actual workflow run IDs are mandatory Phase-B evidence.

Required independent-review predicates:

```text
INDEPENDENT_REVIEW_PROVIDER!=TheHalfMoon
INDEPENDENT_REVIEW_RECORD_ID=<GitHub review/comment record ID>
INDEPENDENT_REVIEW_RECORD_UPDATED_AT=<observed GitHub timestamp>
INDEPENDENT_REVIEW_EXACT_HEAD_BINDING=PR_HEAD
INDEPENDENT_REVIEW_ACTIONABLE_FINDINGS=0
```

A generic success status without an exact-head-bound review record is insufficient. A stale review of an earlier candidate head is insufficient.

Required thread predicates:

```text
REVIEW_THREADS_SNAPSHOT=COMPLETE_FOR_PR
UNRESOLVED_ACTIONABLE_THREADS=0
```

The finalizer must canonicalize the sorted thread snapshot as one LF-terminated line per thread:

```text
<thread-id>|resolved=<true|false>|outdated=<true|false>|path=<path-or-empty>|line=<line-or-empty>\n
```

sorted lexicographically by `thread-id`, and record:

```text
REVIEW_THREADS_SNAPSHOT_SHA256=sha256(UTF8(exact sorted snapshot bytes))
```

A new or changed thread after the snapshot invalidates reconciliation.

### 4.2 Founder bootstrap comment verification

The finalizer must locate exactly one qualifying top-level PR comment authored by GitHub login `TheHalfMoon` whose body contains exactly the bootstrap binding lines authorized by PR #145:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<PR_HEAD>
TRUST_ROOT_ID_SHA256=<Phase-A trust-root ID>
PUBLIC_KEY_SPKI_DER_SHA256=<Phase-A SPKI digest>
ESTABLISHMENT_PREIMAGE_SHA256=<Phase-A establishment preimage digest>
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=<Phase-A sequence-1 disposition digest>
```

The comment author login, numeric comment ID, URL, creation timestamp, update timestamp, and SHA-256 of the exact UTF-8 comment body are Phase-B inputs. A comment for another head or any mismatching Phase-A digest fails closed.

### 4.3 Canonical Phase-B reconciliation record

After all live checks pass, the finalizer constructs one exact LF-terminated UTF-8 record with lines in this fixed order:

```text
schemaVersion=kodac-founder-trust-root-phase-b-reconciliation-v1
repository=TheHalfMoon/Kodac
prNumber=<decimal PR number>
baseBranch=main
predecessorMainSha=<MAIN_HEAD>
predecessorMainTree=<MAIN_TREE>
exactHead=<PR_HEAD>
exactHeadTree=<PR_HEAD_TREE>
changedPathsSha256=<sha256 of sorted LF-terminated changed-path list>
bootstrapCommentId=<decimal GitHub comment ID>
bootstrapCommentBodySha256=<sha256 of exact UTF-8 comment body>
governanceRunId=<decimal workflow run ID>
k2RuntimeRunId=<decimal workflow run ID>
independentReviewProvider=<exact GitHub login/app identity>
independentReviewRecordId=<exact GitHub review/comment record ID>
independentReviewRecordUpdatedAt=<GitHub timestamp>
independentReviewRecordBodySha256=<sha256 of exact reviewed record body>
reviewThreadsSnapshotSha256=<REVIEW_THREADS_SNAPSHOT_SHA256>
unresolvedActionableThreads=0
compareMergeBase=<MAIN_HEAD>
compareBehindBy=0
```

The changed-path digest input is the four exact authorized path strings sorted lexicographically, each followed by one LF, with no other bytes.

The reconciliation digest is:

```text
PHASE_B_RECONCILIATION_DOMAIN=kodac-founder-trust-root-phase-b-reconciliation-v1
PHASE_B_RECONCILIATION_PREIMAGE=
  UTF8(PHASE_B_RECONCILIATION_DOMAIN)
  || 0x00
  || UTF8(EXACT_PHASE_B_RECONCILIATION_RECORD)
PHASE_B_RECONCILIATION_SHA256=sha256(PHASE_B_RECONCILIATION_PREIMAGE)
```

### 4.4 Reconciliation comment and second live read

Before merge, the finalizer must post a top-level PR comment authored under the authenticated founder repository identity containing:

```text
PHASE_B_RECONCILIATION=PASS
PHASE_B_RECONCILIATION_SHA256=<64 lowercase hex>

<exact Phase-B reconciliation record>
```

The finalizer must re-fetch that comment and record its numeric ID, URL, author login, creation/update timestamp, and exact body SHA-256.

Then it must repeat every live read in Section 4.1 and recompute the reconciliation record from the new responses. The second record and digest must be byte-for-byte identical to the posted record/digest except that the existence of the reconciliation comment itself is ignored when computing the predeclared PR-comment set. If main, head, tree, changed paths, workflow evidence, review evidence, bootstrap comment, or review-thread snapshot changed, merge is forbidden and a fresh Phase-B cycle is required.

### 4.5 Only authorized merge write

Only after the second live read matches may the finalizer call GitHub's pull-request merge API with all of:

```text
merge_method=merge
expected_head_sha=<PR_HEAD>
commit_title=<normal PR merge title>
commit_message includes exactly these binding lines:
PHASE_B_RECONCILIATION_SHA256=<digest>
PHASE_B_RECONCILIATION_COMMENT_ID=<numeric comment ID>
REVIEWED_EXACT_HEAD=<PR_HEAD>
```

A merge API that cannot enforce `expected_head_sha` is forbidden for this establishment slice.

If GitHub rejects the expected-head fence, reports a changed base/head, or refuses mergeability:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
MERGE=FORBIDDEN
```

### 4.6 Post-merge canonicalization verification

After GitHub reports a successful merge, the finalizer must fetch live `main`, the merge commit, and the PR again and prove:

```text
PR_STATE=CLOSED
PR_MERGED=YES
PR_MERGE_COMMIT=<returned merge SHA>
MAIN_HEAD=PR_MERGE_COMMIT
MERGE_COMMIT_PARENT_1=<pre-merge predecessorMainSha>
MERGE_COMMIT_PARENT_2=<exactHead>
MERGE_COMMIT_MESSAGE_BINDS_PHASE_B_RECONCILIATION_SHA256=PASS
MERGE_COMMIT_MESSAGE_BINDS_PHASE_B_RECONCILIATION_COMMENT_ID=PASS
MERGE_COMMIT_MESSAGE_BINDS_REVIEWED_EXACT_HEAD=PASS
CANONICAL_DELTA_PATHS=EXACTLY_4_ALLOWLISTED_ESTABLISHMENT_PATHS
```

Only after this post-merge read may:

```text
PHASE_B_EXTERNAL_GITHUB_EVIDENCE=PASS
```

be emitted.

If post-merge verification fails, the merge is reported as anomalous and the trust root remains `NOT_PROVEN`; no artifact process authority may consume it.

---

## 5. Exact-head evidence rule

The final establishment verdict consumes a conjunction of:

```text
PHASE_A_IN_REPOSITORY_EVIDENCE=PASS
PHASE_B_EXTERNAL_GITHUB_EVIDENCE=PASS
```

The absence of final-head/CI/review/merge values from the Phase-A evidence file is not a missing-proof bypass only when the Section 4 finalizer produces and verifies the exact Phase-B record and merge binding.

The verifier/test suite itself remains part of Phase A and may not query GitHub, network services, filesystem discovery, Docker, or subprocesses to obtain Phase-B state.

No actor may upgrade a Phase-A label such as `POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE` to PASS without executing Section 4 against live GitHub truth.

---

## 6. Four-path establishment allowlist remains unchanged

This repair does not widen or rename the future establishment paths. The establishment candidate must still change exactly:

```text
1. provenance/kdo-h4-r4b-founder-process-authority-trust-root-v1.json
2. packages/kodac-runtime/test/helpers/kdo-h4-r4b-founder-process-authority-verifier.ts
3. packages/kodac-runtime/test/kdo-h4-r4b-founder-process-authority-trust-root.test.ts
4. docs/planning/KODAC_KDO_H4_R4B_FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_2026-08-21.md
```

A subset remains insufficient. A fifth establishment path remains forbidden.

This repair document is a separate predecessor repair and is not an establishment-candidate path.

---

## 7. Cryptographic ceremony preservation

This repair does not alter any field in the signed establishment object or current sequence-1 nonce-disposition object.

The canonical authorization commit remains exactly:

```text
AUTHORIZATION_COMMIT=ecd0e6687e91e627a73281dcc71678d8bf8152d0
```

The founder ceremony already produced public outputs bound to that commit:

```text
PUBLIC_KEY_SPKI_DER_SHA256=a6980210aed896b19fbf97f87dfca2a9c253ebb3cc4eda626be2d17b8761af53
TRUST_ROOT_ID_SHA256=d8a87fb2f17ecaeefd345f2d323b0776c0e51429f7a2dd7c78df6a6068535d98
CHALLENGE_NONCE_HEX=9e10a505f26638a407caa41e09e4df798c2b12ed4b2b0a45b2058b70d7f3b2e1
ISSUED_AT_UTC=2026-08-21T21:30:13Z
ESTABLISHMENT_PREIMAGE_SHA256=e57222d6198eb00e2d795fc0c4a82fec3922ba8f22a49edb3fd0a5f0020b2d4f
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=074d1034172792aca9e071caf124c487adff2fb7f78fefd2c43ea6af8711cf71
```

This repair changes none of those values and does not modify the establishment preimage. Therefore:

```text
ESTABLISHMENT_PREIMAGE_CHANGED=NO
CURRENT_NONCE_DISPOSITION_PREIMAGE_CHANGED=NO
CURRENT_SEQUENCE_1_CONSUMED_RECORD=REMAINS_VALID
NONCE_RETIREMENT_REQUIRED_BY_THIS_REPAIR=NO
FRESH_NONCE_REQUIRED_BY_THIS_REPAIR=NO
RESIGNING_REQUIRED_BY_THIS_REPAIR=NO
```

The private key remains exclusively out of band. This repair neither generates nor accesses a private key and performs no signing.

---

## 8. Bootstrap approval remains post-freeze and external

The one-time founder bootstrap theorem from canonical PR #145 is unchanged.

After the establishment candidate head is frozen, a top-level PR comment authored by GitHub login `TheHalfMoon` must still contain exactly the authorized binding lines:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<exact frozen establishment head SHA>
TRUST_ROOT_ID_SHA256=<exact trust-root ID>
PUBLIC_KEY_SPKI_DER_SHA256=<exact SPKI SHA-256>
ESTABLISHMENT_PREIMAGE_SHA256=<exact establishment preimage SHA-256>
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=<exact sequence-1 disposition preimage SHA-256>
```

The bootstrap comment is a distinct Phase-B input and must exist before the Section 4 reconciliation record is constructed. It must not be copied into the candidate evidence file after head freeze.

---

## 9. Establishment evidence requirements after this repair

The future allowlisted evidence document must retain all pre-freeze facts required by canonical PR #145, except that the following originally listed fields are phase-separated and must be recorded as contract labels rather than fabricated final values:

```text
TRUST_ROOT_CANDIDATE_EXACT_HEAD=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
TRUST_ROOT_CANDIDATE_EXACT_TREE=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
FOUNDER_BOOTSTRAP_APPROVAL_COMMENT_METADATA=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
EXACT_HEAD_CI_RESULT=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW_RESULT=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
UNRESOLVED_ACTIONABLE_THREAD_COUNT=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
FINAL_MAIN_HEAD_DIFF_FENCE=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
PHASE_B_RECONCILIATION_RECORD=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
PHASE_B_RECONCILIATION_SHA256=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
PHASE_B_RECONCILIATION_COMMENT_ID=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
EXPECTED_HEAD_SHA_MERGE_FENCE=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
CANONICAL_MERGE_COMMIT_AND_PARENTS=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
```

No placeholder SHA, fabricated run ID, anticipated review result, or predicted merge commit may appear in Phase A.

---

## 10. Final establishment verdict after this repair

`FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=CANONICAL_PROVEN` remains available only if every original cryptographic/schema/test/private-material predicate passes and all phase-separated governance predicates also pass:

```text
PHASE_A_IN_REPOSITORY_EVIDENCE=PASS
EXACT_CANDIDATE_HEAD_FROZEN=PASS
FOUNDER_BOOTSTRAP_APPROVAL_PROOF=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
PHASE_B_RECONCILIATION_RECORD_PROOF=PASS
PHASE_B_RECONCILIATION_SECOND_READ_PROOF=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
POST_MERGE_ORDERED_PARENT_PROOF=PASS
POST_MERGE_MESSAGE_BINDING_PROOF=PASS
PHASE_B_EXTERNAL_GITHUB_EVIDENCE=PASS
```

If any Phase-B evidence is missing, stale, refers to another head, differs between the first and second live read, or becomes invalid due to a candidate mutation:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

---

## 11. Explicit non-grants

```text
TRUST_ROOT_KEY_GENERATION=NO
TRUST_ROOT_PRIVATE_KEY_ACCESS=NO
TRUST_ROOT_SIGNING=NO
TRUST_ROOT_ESTABLISHMENT=NOT_IN_THIS_REPAIR
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

## 12. Repair merge gate

This repair may merge only if:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
NATIVE_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
AUTHORIZATION_COMMIT_REMAINS=ecd0e6687e91e627a73281dcc71678d8bf8152d0
SIGNED_ESTABLISHMENT_PREIMAGE_CHANGED=NO
SIGNED_NONCE_DISPOSITION_PREIMAGE_CHANGED=NO
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

This repair PR itself may use the existing exact-head governance merge procedure. The new Section 4 finalizer becomes mandatory only for the later trust-root establishment PR whose self-referential evidence requirements this repair fixes.

If `main` moves before merge, stop and reconcile before proceeding.

---

## 13. Final repair statement

This repair resolves the Git self-reference problem by separating evidence according to when it can exist and by defining a concrete fail-closed Phase-B GitHub finalizer rather than trusting labels.

It preserves the already-consumed sequence-1 establishment nonce and both existing public signatures because their exact signed preimages are unchanged.

After this repair becomes canonical, the establishment branch may be fast-forwarded to the repair merge commit and the exact four-path trust-root candidate may proceed without regenerating, retiring, or re-signing the current establishment attempt.
