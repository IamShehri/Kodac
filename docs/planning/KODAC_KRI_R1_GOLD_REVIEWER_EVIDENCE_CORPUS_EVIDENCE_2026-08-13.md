# Kodac KRI-R1 Gold Reviewer-Evidence Corpus Evidence

## Record identity

```text
Gate: KRI-R1
Implementation base: a6649626fd0c91f8326311ce532ca3ed16dba068
Authorization: docs/planning/KODAC_KRI_R1_GOLD_REVIEWER_EVIDENCE_CORPUS_AUTHORIZATION_2026-08-13.md
Implementation class: TEST / FIXTURE / EVIDENCE ONLY
Corpus version: kri-r1-gold-corpus-v1
Corpus identity: 5b7f551b2641bd020d354078ce5dda62940e6ea439c929e6f627bea4fc5333bf
```

## Decision

```text
KRI-R1 CORPUS EVIDENCE: READY FOR EXACT-HEAD REVIEW
REVIEWER RUNTIME: NOT IMPLEMENTED
KRI-R2+: NOT AUTHORIZED
K5: NOT AUTHORIZED
```

## Authorized source confinement

The corpus contains four adjudicated historical claims and uses reviewer claims only from the canonically authorized K3 source set.

| Case | PR | Provider | Gold disposition | Primary property |
|---|---:|---|---|---|
| `pr10-cubic-depth-empty-boundary-omission` | #10 | Cubic | `VALID_ACCEPTED` | boundedness / completeness truth |
| `pr13-cubic-checkout-head-provenance-mismatch` | #13 | Cubic | `VALID_ACCEPTED` | exact-head provenance / CI trust boundary |
| `pr17-coderabbit-recursive-import-allowlist-bypass` | #17 | CodeRabbit | `VALID_ACCEPTED` | CI self-bypass resistance |
| `pr17-coderabbit-overlapping-omission-sum-rejected` | #17 | CodeRabbit | `INVALID_REJECTED` | reviewer adjudication against contract truth |

PR #15 is authorized as a possible claim source but is not needed in this first corpus because the admitted evidence already satisfies the minimum three-PR representation requirement without inventing an ambiguous case.

## Gold adjudication evidence

### PR #10 — accepted completeness finding

Historical claim identity:

```text
review comment: 3762788154
review: 4912010020
reviewed/anchor commit: 4e20e65451f45366d4cce3dc654387ebcd1662c6
canonical PR base: 971f830ce092c1c7bd0d77c9e0b7cf66a34c28f0
correction commit: 9f0ab6740f0ab6de4664498ca4bd87661fb251f3
final PR head: 4f0861a5b748e223f7e41ba02f13cde018eb1e2b
```

Adjudication: the depth-boundary implementation could infer a positive omitted lower bound without proving any omitted descendant. Kodac accepted the defect and corrected the depth probe semantics.

### PR #13 — accepted exact-head provenance finding

Historical claim identity:

```text
review comment: 3768772220
review: 4919330029
explicit review-request head: f1d79e7467c6ab06b3867d86be249f7695c431b2
comment anchor commit: 33e8646f428eb2f0f476c09591980a46c172aa1f
canonical PR base: 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
correction commit: d7c62c21636f882e393085540213cfcfb4e24450
final PR head: 8050ff13dc983d1baa2e4553d78dc3741f48a256
```

Adjudication: a `pull_request` checkout could execute a synthetic merge commit while benchmark evidence named the PR head SHA. Kodac accepted the provenance mismatch and pinned checkout to the exact PR head.

### PR #17 — accepted recursive import-gate finding

Historical claim identity:

```text
review comment: 3771191889
review: 4922077616
reviewed/anchor head: e44c4adfe659fb2f5d51715956a63d8ff98d200d
canonical PR base: ebd74619d2038b87886fd8152aae282b7b132372
correction commit: 9d3d1917bb3743b6caaa042b14ca065a0d26685a
final PR head: f16b237c650f721378da2a2d3fe212127e7ec9bf
```

Adjudication: the allowlist inspected direct TypeScript entries only, leaving a nested-module route around the intended CI authority boundary. The correction recursively enumerated the subtree and also replaced the candidate-controlled package test indirection with a direct trusted Node test command.

### PR #17 — rejected omission-summing finding

Historical claim identity:

```text
review comment: 3771191920
review: 4922077616
reviewed/anchor head: e44c4adfe659fb2f5d51715956a63d8ff98d200d
canonical PR base: ebd74619d2038b87886fd8152aae282b7b132372
Kodac adjudication checkpoint review: 4922134991
Kodac adjudication review: 4922136656
CodeRabbit withdrawal reply: 3771264461
final PR head: f16b237c650f721378da2a2d3fe212127e7ec9bf
```

Gold disposition: `INVALID_REJECTED`.

The suggestion assumed omissions from separate K3-R4 query results were disjoint. Kodac's contract is a lower bound for **unique** omitted evidence and the result sets may overlap. `Math.max` is conservative; summing can overstate. CodeRabbit subsequently acknowledged the contract clarification and withdrew the finding.

## Original reviewer body digest limitation

KRI-R1 does **not** claim a SHA-256 of the creation-time external reviewer bodies for these four cases.

All four selected GitHub review-comment records show `updatedAt != createdAt`. GitHub exposes the provider-edited current body but does not expose the original creation-time byte sequence through the evidence used for this slice. Hashing the edited body and calling it the original would be false provenance.

Therefore each fixture records:

```text
bodyDigestStatus = ORIGINAL_BYTES_UNAVAILABLE_PROVIDER_EDITED_COMMENT
```

The corpus binds immutable GitHub comment/review identities, revision identities, Kodac-authored normalized summaries, adjudication rationale, correction/withdrawal evidence, and deterministic case identities instead of inventing an unavailable original-body digest.

## Deterministic identities

```text
corpusIdentity = 5b7f551b2641bd020d354078ce5dda62940e6ea439c929e6f627bea4fc5333bf
```

Case identities:

```text
pr10-cubic-depth-empty-boundary-omission
  cca5aeb2c11f5bb1ead69817ebc4c91b97761e9366f8b7bf4055e21f791d32fe

pr13-cubic-checkout-head-provenance-mismatch
  48d322cd1daaa7cd3d0ba6ac29fa7ebf4d3de932a2adf4cb7ae0733f97785526

pr17-coderabbit-recursive-import-allowlist-bypass
  878952fa27906be0ba64324ace719d90694af3d01fdcc13c15a236a5f2a4ecef

pr17-coderabbit-overlapping-omission-sum-rejected
  52d65a2d4301cad2245db3192b0a0ba6452a1afb991015a6755fe88f862f1c07
```

The validator recomputes every case identity from all gold-semantic fields except the stored identity itself. Corpus identity binds the authorization base, exact authorized PR set, corpus version, and locale-independent sorted case identities.

## Acceptance coverage

```text
VALID_ACCEPTED present: YES
INVALID_REJECTED present: YES
PR representation >= 3: YES (#10, #13, #17)
provider representation >= 2: YES (Cubic, CodeRabbit)
exact-head / freshness case: YES (#13)
CI / self-bypass case: YES (#13, #17)
provenance / identity-binding case: YES (#13)
boundedness / completeness case: YES (#10, #17)
plausible reviewer claim rejected: YES (#17 omission aggregation)
synthetic relabeling: NO
```

## Validator behavior

`packages/kodac-runtime/test/kri-r1-gold-reviewer-evidence.test.ts` proves:

- source PR confinement to #10/#13/#15/#17;
- exact admitted claim tuples (comment/review/provider/base/reviewed-head/final-head/path/line) are pinned and mutation-rejected;
- the corpus authorization base is pinned to canonical KRI-R1 authorization merge `a6649626fd0c91f8326311ce532ca3ed16dba068`;
- exactly the two authorized fixture gold labels;
- deterministic case and corpus identity recomputation;
- case-order-independent corpus identity;
- duplicate claim and duplicate identity rejection;
- unauthorized PR rejection;
- invented claim rejection even inside an authorized PR;
- exact-head substitution rejection even after identity recomputation;
- authorization-base substitution rejection even after corpus-identity recomputation;
- mutation detection for identity-bearing gold fields;
- accepted findings require a full correction commit;
- rejected findings cannot invent a correction commit;
- required category/provider/PR coverage;
- hostile reviewer text remains inert data;
- no network or process execution surface in the validator source.

The implementation adds no production `src/**`, workflow, dependency, manifest, lockfile, persistence, model, network, ExecutionGateway, trust-policy, or release path.

## Authority after this candidate

```text
KRI-R1 CORPUS IMPLEMENTATION: IMPLEMENTED IN CANDIDATE / NOT CANONICAL UNTIL MERGE
KRI REVIEWER ENGINE: NOT AUTHORIZED
KRI FINDING RUNTIME SCHEMA: NOT AUTHORIZED
KRI ADJUDICATION RUNTIME: NOT AUTHORIZED
KRI-R2+: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED
K3-R6+: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
NETWORK FETCH AT TEST/RUNTIME: NOT AUTHORIZED
PERSISTENT REVIEW STORAGE / LEARNING: NOT AUTHORIZED
MODEL CALLS: NOT AUTHORIZED
AUTOFIX / REPOSITORY WRITE AUTHORITY: NOT AUTHORIZED
GITHUB REVIEW / APPROVAL / MERGE AUTHORITY FROM KRI: NOT AUTHORIZED
PROVEN_READY AUTHORITY FROM KRI: NOT AUTHORIZED
```

K2 remains the sole trusted side-effect execution authority. The existing Done Gate remains the `PROVEN_READY` authority.
