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

After the exact candidate head is frozen, the following facts are retained in immutable GitHub PR/review/workflow/merge records rather than written back into the candidate tree:

```text
trust-root candidate exact head SHA/tree
founder bootstrap approval comment author/login/ID/URL/timestamp
founder bootstrap exact-head binding
exact-head CI workflow run IDs/conclusions
fresh independent exact-head review identity/verdict
unresolved actionable thread count
final canonical-main versus exact-head compare fence
expected-head SHA merge request/result
canonical merge commit and ordered parents
```

These are `POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE`.

Any mutation to an allowlisted candidate file after Phase B begins invalidates all Phase-B head-bound evidence and requires a fresh Phase-B cycle.

---

## 4. Exact-head evidence rule

The final establishment verdict may consume a conjunction of:

```text
PHASE_A_IN_REPOSITORY_EVIDENCE=PASS
PHASE_B_EXTERNAL_GITHUB_EVIDENCE=PASS
```

The absence of final-head/CI/review/merge values from the Phase-A evidence file is not a missing-proof bypass when those values are proven from exact-head GitHub records during Phase B.

The verifier/test suite itself remains part of Phase A and may not query GitHub, network services, filesystem discovery, Docker, or subprocesses to obtain Phase-B state.

The merger/reconciler must verify Phase-B evidence directly against live GitHub truth immediately before merge.

---

## 5. Four-path establishment allowlist remains unchanged

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

## 6. Cryptographic ceremony preservation

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

## 7. Bootstrap approval remains post-freeze and external

The one-time founder bootstrap theorem from canonical PR #145 is unchanged.

After the establishment candidate head is frozen, a top-level PR comment authored by GitHub login `TheHalfMoon` must still contain exactly the authorized binding lines, including:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<exact frozen establishment head SHA>
TRUST_ROOT_ID_SHA256=<exact trust-root ID>
PUBLIC_KEY_SPKI_DER_SHA256=<exact SPKI SHA-256>
ESTABLISHMENT_PREIMAGE_SHA256=<exact establishment preimage SHA-256>
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=<exact sequence-1 disposition preimage SHA-256>
```

The comment is Phase-B evidence. It must not be copied into the candidate evidence file after head freeze.

---

## 8. Establishment evidence requirements after this repair

The future allowlisted evidence document must retain all pre-freeze facts required by canonical PR #145, except that the following originally listed fields are phase-separated and must be recorded as labels pointing to external proof rather than literal final values:

```text
TRUST_ROOT_CANDIDATE_EXACT_HEAD=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
TRUST_ROOT_CANDIDATE_EXACT_TREE=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
FOUNDER_BOOTSTRAP_APPROVAL_COMMENT_METADATA=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
EXACT_HEAD_CI_RESULT=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW_RESULT=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
UNRESOLVED_ACTIONABLE_THREAD_COUNT=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
FINAL_MAIN_HEAD_DIFF_FENCE=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
EXPECTED_HEAD_SHA_MERGE_FENCE=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
CANONICAL_MERGE_COMMIT_AND_PARENTS=POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE
```

No placeholder SHA, fabricated run ID, anticipated review result, or predicted merge commit may appear in Phase A.

---

## 9. Final establishment verdict after this repair

`FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=CANONICAL_PROVEN` remains available only if every original cryptographic/schema/test/private-material predicate passes and the phase-separated governance predicates also pass:

```text
PHASE_A_IN_REPOSITORY_EVIDENCE=PASS
EXACT_CANDIDATE_HEAD_FROZEN=PASS
FOUNDER_BOOTSTRAP_APPROVAL_PROOF=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
PHASE_B_EXTERNAL_GITHUB_EVIDENCE=PASS
```

If any Phase-B evidence is stale, refers to another head, or becomes invalid due to a candidate mutation:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

---

## 10. Explicit non-grants

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

## 11. Repair merge gate

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

If `main` moves before merge, stop and reconcile before proceeding.

---

## 12. Final repair statement

This repair resolves only the Git self-reference problem by separating evidence according to when it can exist.

It preserves the already-consumed sequence-1 establishment nonce and both existing public signatures because their exact signed preimages are unchanged.

After this repair becomes canonical, the establishment branch may be fast-forwarded to the repair merge commit and the exact four-path trust-root candidate may proceed without regenerating, retiring, or re-signing the current establishment attempt.
