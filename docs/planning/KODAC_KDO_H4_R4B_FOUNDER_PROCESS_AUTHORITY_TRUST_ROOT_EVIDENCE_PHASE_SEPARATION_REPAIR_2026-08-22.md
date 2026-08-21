# KODAC KDO H4-R4B Founder Process-Authority Trust-Root Evidence Phase-Separation Repair

Date: 2026-08-22
Status: REPAIR_CANDIDATE / DOCS_ONLY / NO_KEY_MATERIAL / NO_SIGNING / NO_PROCESS_EXECUTION

## 1. Purpose

Repair the self-referential evidence requirement discovered after canonical PR #145, and fail closed on a second discovered defect: an external pre-merge reconciliation plus `expected_head_sha` does not atomically protect Phase-B review/comment/thread state that can change without changing the candidate commit.

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
PHASE_B_SERVER_SIDE_ATOMIC_GATE_PREREQUISITE=CANONICAL_REQUIRED
```

This repair does **not** establish the trust root and does **not** authorize the four-path establishment candidate to merge.

---

## 2. Defect A — in-repository final-head evidence is self-referential

Canonical PR #145 requires the future in-repository establishment evidence document to retain, among other facts:

```text
trust-root candidate exact head SHA/tree
exact-head CI result
fresh independent exact-head review result
unresolved actionable thread count
final main/head diff fence
expected-head SHA merge fence
```

The evidence document itself is one of the four files that form the candidate Git tree. Embedding the final candidate commit/tree in that file changes the file blob, tree, and commit again. Exact-head CI/review results also exist only after the head exists; writing them back creates a new head and makes those results stale.

Literal same-head inclusion would therefore force one of:

```text
stale-head evidence
placeholder values
post-review mutation
or an unprovable Git fixed point
```

All four are forbidden.

---

## 3. Phase-separation theorem

Trust-root establishment evidence is split by when the evidence can exist.

### Phase A — in-repository pre-freeze evidence

The allowlisted establishment evidence document may retain only facts determined before the candidate head freezes, including:

```text
canonical predecessor main SHA/tree
AUTHORIZATION_COMMIT
four allowlisted establishment paths and mode/object requirements
public SPKI DER hex and SHA-256
trustRootIdSha256
challenge nonce
issuedAtUtc
establishment object/JCS/preimage SHA-256
establishment detached Ed25519 signature
current sequence-1 nonce-disposition object/JCS/preimage SHA-256
current nonce-disposition detached Ed25519 signature
atomic nonce-state key
public durable-state evidence identity supplied by the founder ceremony
historical retirement envelopes, if any
Node verification version
focused pre-freeze test results
private-material absence assertions
explicit non-grants
```

The Phase-A evidence document must not contain guessed final-head values, anticipated workflow IDs, predicted review results, or predicted merge metadata.

### Phase B — post-freeze GitHub evidence

After the exact head is frozen, these facts exist outside the candidate tree:

```text
candidate exact head SHA/tree
founder bootstrap approval comment metadata and exact body
exact-head CI run IDs/conclusions
fresh independent exact-head review record and verdict
review-thread state
canonical-main versus exact-head compare fence
expected-head merge request/result
canonical merge commit/tree/ordered parents
```

They are `POST_FREEZE_EXTERNAL_GITHUB_EVIDENCE` and must never be copied back into the candidate after head freeze.

Any candidate-file mutation after Phase B begins invalidates all Phase-B evidence and requires a fresh Phase-B cycle.

---

## 4. Defect B — `expected_head_sha` is not a composite Phase-B atomic gate

A founder-session merger can read live GitHub state, validate Phase-B evidence, and then call the merge API with:

```text
expected_head_sha=<frozen candidate head>
```

That protects against candidate-head movement. It does **not** atomically protect GitHub metadata that can change while the candidate SHA stays constant, including:

```text
founder bootstrap comment creation/edit/deletion
independent review state or review record updates
new unresolved review threads
thread resolution/unresolution
other required Phase-B governance state
```

Therefore:

```text
EXTERNAL_DOUBLE_READ_PLUS_EXPECTED_HEAD_SHA=NECESSARY_BUT_NOT_SUFFICIENT
PHASE_B_COMPOSITE_ATOMICITY_PROOF=NOT_ESTABLISHED
```

This repair must not claim otherwise.

---

## 5. Required server-side atomic-gate predecessor

Before the four-path trust-root establishment PR may merge, a **separate canonical predecessor** must establish and prove a server-side Phase-B gate that GitHub evaluates at merge time for the exact candidate head.

Required high-level properties are:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE=REQUIRED
GATE_DEFINED_IN_CANONICAL_PREDECESSOR=YES
CANDIDATE_CANNOT_MODIFY_GATE=YES
GATE_BINDS_EXACT_HEAD=YES
GATE_FAILS_CLOSED=YES
GATE_BYPASS_FORBIDDEN=YES
MAIN_MOVEMENT_PROTECTION=REQUIRED
REQUIRED_CI_SERVER_SIDE_ENFORCEMENT=REQUIRED
REVIEW_CONVERSATION_RESOLUTION_SERVER_SIDE_ENFORCEMENT=REQUIRED
FOUNDER_BOOTSTRAP_BINDING_SERVER_SIDE_ENFORCEMENT=REQUIRED
FRESH_INDEPENDENT_REVIEW_SERVER_SIDE_ENFORCEMENT=REQUIRED
```

A valid design may combine immutable predecessor workflow/check logic with GitHub branch-protection/ruleset requirements, but the exact mechanism must be separately authorized, implemented, independently reviewed, and proven before establishment proceeds.

The later atomic-gate design must explain how metadata changes that leave the commit SHA unchanged invalidate or fail the required gate before merge. Merely re-reading state in a client immediately before merge is insufficient.

The gate must not depend on trust-root candidate-controlled workflow code or mutable candidate configuration.

---

## 6. Current state after discovering Defect B

Live repository evidence has not proven a server-side composite Phase-B gate satisfying Section 5.

Therefore, even if this repair becomes canonical:

```text
PHASE_B_SERVER_SIDE_ATOMIC_GATE=NOT_PROVEN
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT_MERGE=BLOCKED
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

The next bounded slice after this repair is **not** the four-path trust-root establishment implementation. It is a separate docs-only authorization/design slice for the server-side atomic Phase-B gate, followed by separately authorized implementation/configuration proof.

---

## 7. Four-path establishment allowlist remains unchanged

This repair does not widen or rename the future establishment paths. Once the Section 5 predecessor is canonical and proven, the establishment candidate must still change exactly:

```text
1. provenance/kdo-h4-r4b-founder-process-authority-trust-root-v1.json
2. packages/kodac-runtime/test/helpers/kdo-h4-r4b-founder-process-authority-verifier.ts
3. packages/kodac-runtime/test/kdo-h4-r4b-founder-process-authority-trust-root.test.ts
4. docs/planning/KODAC_KDO_H4_R4B_FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_2026-08-21.md
```

A subset remains insufficient. A fifth establishment path remains forbidden.

This repair document and the future atomic-gate predecessor are separate predecessors, not establishment-candidate paths.

---

## 8. Cryptographic ceremony preservation

This repair changes no field in the already-signed establishment object or sequence-1 nonce-disposition object.

The authorization commit remains:

```text
AUTHORIZATION_COMMIT=ecd0e6687e91e627a73281dcc71678d8bf8152d0
```

Founder ceremony public outputs remain:

```text
PUBLIC_KEY_SPKI_DER_HEX=302a300506032b6570032100d16cd6a0199f9069193ba199376c2d90a65355aabe9c9e769af2d5826b7be945
PUBLIC_KEY_SPKI_DER_SHA256=a6980210aed896b19fbf97f87dfca2a9c253ebb3cc4eda626be2d17b8761af53
TRUST_ROOT_ID_SHA256=d8a87fb2f17ecaeefd345f2d323b0776c0e51429f7a2dd7c78df6a6068535d98
CHALLENGE_NONCE_HEX=9e10a505f26638a407caa41e09e4df798c2b12ed4b2b0a45b2058b70d7f3b2e1
ISSUED_AT_UTC=2026-08-21T21:30:13Z
ESTABLISHMENT_PREIMAGE_SHA256=e57222d6198eb00e2d795fc0c4a82fec3922ba8f22a49edb3fd0a5f0020b2d4f
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=074d1034172792aca9e071caf124c487adff2fb7f78fefd2c43ea6af8711cf71
ATOMIC_STATE_FILE_SHA256=7e4600271b17bb8afa93a60e4fd87a47360c15a09c856a7450485b914814b45b
```

The public Ed25519 signatures remain bound to those exact preimages. This repair does not regenerate or consume a new nonce.

Required preservation result:

```text
ESTABLISHMENT_PREIMAGE_CHANGED=NO
CURRENT_NONCE_DISPOSITION_PREIMAGE_CHANGED=NO
CURRENT_SEQUENCE_1_CONSUMED_RECORD=REMAINS_VALID
NONCE_RETIREMENT_REQUIRED_BY_THIS_REPAIR=NO
FRESH_NONCE_REQUIRED_BY_THIS_REPAIR=NO
RESIGNING_REQUIRED_BY_THIS_REPAIR=NO
```

Delay while proving the server-side atomic gate does not itself alter the signed preimages.

The private key remains exclusively out of band. This repair neither generates nor accesses a private key and performs no signing.

---

## 9. Bootstrap approval remains post-freeze

The one-time founder bootstrap theorem from canonical PR #145 is unchanged.

The bootstrap approval must not be posted until the later establishment candidate head is frozen, and it must bind exactly:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<exact frozen establishment head SHA>
TRUST_ROOT_ID_SHA256=<exact trust-root ID>
PUBLIC_KEY_SPKI_DER_SHA256=<exact SPKI SHA-256>
ESTABLISHMENT_PREIMAGE_SHA256=<exact establishment preimage SHA-256>
ESTABLISHMENT_NONCE_DISPOSITION_SHA256=<exact sequence-1 disposition preimage SHA-256>
```

No bootstrap approval is requested or accepted in this repair PR.

---

## 10. Evidence-document interpretation after this repair

Once the atomic-gate prerequisite is separately proven, the future allowlisted Phase-A evidence document must retain all pre-freeze facts required by PR #145. The self-referential fields are represented only as contract labels:

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

These labels are never PASS predicates by themselves. They can be upgraded only by the later proven server-side atomic gate plus post-merge canonical verification.

---

## 11. Future establishment verdict after all prerequisites

Only after both this phase-separation repair **and** the separate server-side atomic-gate predecessor are canonical/proven may the later establishment candidate seek:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=CANONICAL_PROVEN
```

The verdict still requires every original PR #145 cryptographic/schema/test/private-material predicate plus:

```text
PHASE_A_IN_REPOSITORY_EVIDENCE=PASS
PHASE_B_SERVER_SIDE_ATOMIC_GATE_PROOF=PASS
EXACT_CANDIDATE_HEAD_FROZEN=PASS
FOUNDER_BOOTSTRAP_APPROVAL_PROOF=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
POST_MERGE_ORDERED_PARENT_PROOF=PASS
PHASE_B_EXTERNAL_GITHUB_EVIDENCE=PASS
```

If the server-side gate is absent, bypassable, stale, candidate-controlled, or unable to fail on relevant metadata changes while the head is unchanged:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

---

## 12. Explicit non-grants

```text
TRUST_ROOT_KEY_GENERATION=NO
TRUST_ROOT_PRIVATE_KEY_ACCESS=NO
TRUST_ROOT_SIGNING=NO
TRUST_ROOT_ESTABLISHMENT_IMPLEMENTATION=NOT_IN_THIS_REPAIR
PHASE_B_SERVER_SIDE_ATOMIC_GATE_IMPLEMENTATION=NOT_IN_THIS_REPAIR
REPOSITORY_RULESET_MUTATION=NO
BRANCH_PROTECTION_MUTATION=NO
WORKFLOW_MUTATION=NO
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

## 13. Repair merge gate

This docs-only repair may merge only if:

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

This repair PR itself uses the existing exact-head governance merge procedure. It does not claim that procedure is sufficient for the later trust-root establishment merge.

If `main` moves before merge, stop and reconcile before proceeding.

---

## 14. Final repair statement

This repair does two things only:

1. makes final-head evidence non-self-referential by separating pre-freeze candidate evidence from post-freeze GitHub evidence; and
2. records that the later establishment merge remains blocked until a separately canonical, server-side atomic Phase-B gate can enforce metadata-sensitive predicates at merge time.

It preserves the already-consumed sequence-1 nonce and both public signatures because the exact signed preimages are unchanged.

After this repair becomes canonical, the next safe slice is the server-side atomic Phase-B gate authorization/design. The four-path trust-root establishment implementation remains blocked until that prerequisite is proven.
