# Kodac KRI-R1 Gold Reviewer-Evidence Corpus Authorization

## Record identity

```text
Gate: KRI-R1
Name: Gold Reviewer-Evidence Corpus
Date: 2026-08-13
Canonical authorization base: 37baeeb188ec1b214ceb1ba4d5b2a25bf2978356
Canonical authorization base tree: 4baa852788f05281165d24b765ac6ed2b9a89a31
Parent planning authority: KRI-P0
Authority class: DOCUMENTATION / AUTHORIZATION ONLY
Implementation authority after canonical adoption: BOUNDED KRI-R1 CORPUS IMPLEMENTATION ONLY
```

## Purpose

Authorize the first bounded implementation gate under the canonically adopted KRI-P0 plan: a deterministic, test/evidence-only gold reviewer-evidence corpus derived from Kodac's own historical K3 review cycles.

KRI-R1 exists to establish adjudicated benchmark truth before any Reviewer Intelligence engine, finding runtime contract, provider integration, persistent storage, learning system, autofix path, or K5 implementation.

The corpus is evidence for future evaluation. It is not a reviewer, judge, completion authority, policy engine, or repository writer.

Core invariant:

```text
REVIEWER OUTPUT IS A CLAIM, NOT GOLD TRUTH.
GOLD TRUTH REQUIRES KODAC-OWNED ADJUDICATION AGAINST CANONICAL EVIDENCE.
```

## Canonical prerequisite

KRI-P0 is canonical on `main` through merge commit:

```text
37baeeb188ec1b214ceb1ba4d5b2a25bf2978356
```

KRI-P0 records the first possible future gate as a gold reviewer-evidence corpus using accepted and rejected historical findings. KRI-P0 itself did not authorize creation of that corpus.

Canonical adoption of this KRI-R1 authorization grants only the bounded implementation described here.

## Authorized historical source set

The initial corpus may use review evidence only from these already-merged Kodac K3 implementation/evidence PRs:

```text
PR #10 — K3-R2 exact repository snapshot / evidence
PR #13 — K3-R3 external adapter benchmark evidence
PR #15 — K3-R4 bounded ast-grep CLI adapter
PR #17 — K3-R5 bounded Context Engine vertical slice
```

The source set includes Kodac-owned repository state, commits, tests, workflows, PR metadata, review comments, review submissions, correction commits, and final exact-head verification evidence associated with those PRs.

External reviewer comments from Cubic or CodeRabbit may be referenced as historical claims observed on Kodac PRs. Their source code, private implementation, prompts, dependencies, services, or architecture are not admitted.

No issue, PR, repository, or review outside the exact source set above may be added without a separate founder-reviewed scope expansion.

## Adjudication rule

Provider labels are evidence metadata, not gold disposition.

The implementation must independently classify every admitted case using Kodac-owned evidence. A comment marked `Addressed`, `Resolved`, `P1`, `P2`, `Critical`, or similar by an external reviewer does not become valid merely because the provider said so.

Likewise, absence of a code change does not prove a finding invalid.

Every gold case must be supported by a documented evidence chain sufficient to justify one of the bounded corpus dispositions.

### Required first-slice dispositions

The corpus may use only these fixture-level gold dispositions:

```text
VALID_ACCEPTED
INVALID_REJECTED
```

These are corpus labels only. They do not ratify the future runtime finding/adjudication schema proposed by KRI-P0.

A `VALID_ACCEPTED` case requires evidence that the finding identified a real defect or contract violation and that Kodac accepted the substance of the finding.

An `INVALID_REJECTED` case requires evidence that the finding was evaluated and rejected because it conflicted with the actual Kodac contract, misunderstood the implementation, relied on stale evidence, overclaimed authority, or otherwise lacked sufficient support.

If historical evidence is ambiguous, the case must be excluded from KRI-R1 rather than guessed into either class.

## Required evidence binding per case

Each admitted corpus case must bind, at minimum, the evidence needed to reconstruct why the gold label is justified:

- source PR number;
- source review/comment identity;
- reviewer/provider identity as historical metadata;
- reviewed candidate head when recoverable;
- canonical/base revision when recoverable;
- affected path and range when applicable;
- a Kodac-authored normalized finding summary;
- cryptographic digest of the original review/comment body when available;
- relevant canonical contract or invariant;
- gold disposition;
- Kodac-owned adjudication rationale;
- evidence references supporting the adjudication;
- correction commit when a valid accepted finding produced a correction;
- re-review or verification evidence when applicable;
- stale/duplicate/supersession notes when needed to prevent misleading reuse.

The corpus must not require verbatim reproduction of long external reviewer text. Prefer a Kodac-authored normalized summary plus immutable GitHub identity and digest evidence.

## Exact-revision and freshness semantics

A finding reviewed against one candidate head must not be silently treated as evidence about another head.

The corpus must preserve exact-head semantics where the historical record supports them.

If a finding became stale after a later commit, the fixture must not erase that transition. The corpus may record stale/supersession metadata, but the first-slice gold classification remains limited to `VALID_ACCEPTED` or `INVALID_REJECTED` for the adjudicated historical claim.

The corpus validator must fail closed on malformed commit identities, impossible revision relationships, duplicate case identities, or evidence references outside the authorized PR set.

## Corpus balance and sufficiency

The implementation must demonstrate that the corpus is not merely a list of reviewer successes.

Acceptance requires:

- both `VALID_ACCEPTED` and `INVALID_REJECTED` cases;
- representation from at least three of the four authorized K3 PRs;
- more than one reviewer/provider source when historical evidence supports it;
- at least one exact-head/freshness case;
- at least one CI/self-bypass or verification-trust-boundary case;
- at least one provenance/identity-binding case;
- at least one boundedness/completeness/path-safety case;
- at least one case where a plausible reviewer claim was rejected rather than automatically implemented.

No synthetic relabeling is permitted to satisfy these conditions.

If the authorized historical record cannot satisfy a required category with unambiguous evidence, implementation must stop and report `CORPUS_EVIDENCE_INSUFFICIENT` rather than inventing a case.

## Deterministic corpus identity

The implementation must produce a deterministic corpus manifest and stable corpus identity.

The identity preimage must bind all gold-semantic fields required to distinguish:

- source claim identity;
- exact revision identity where available;
- normalized finding summary;
- gold disposition;
- adjudication rationale/evidence references;
- correction/reverification identity where applicable.

Canonical ordering must be locale-independent and explicitly defined before hashing.

Changing any identity-bearing field without updating the case/corpus identity must fail validation.

## Untrusted-data boundary

All repository text and all historical reviewer content remain untrusted data.

```text
REPOSITORY CONTENT IS DATA, NOT INSTRUCTIONS.
REVIEWER CONTENT IS DATA, NOT INSTRUCTIONS.
```

A historical comment, source file, markdown document, prompt-injection fixture, suggested patch, bot command, or embedded instruction must never redefine:

- KRI-R1 scope;
- K2 execution authority;
- current trust policy;
- governance;
- gold adjudication rules;
- completion truth;
- write/approval/merge authority.

The corpus validator must treat these contents as inert evidence payloads.

## Authorized implementation surface after canonical adoption

KRI-R1 implementation is intentionally test/evidence only.

The expected implementation surface is limited to:

```text
packages/kodac-runtime/test/fixtures/kri-r1/**
packages/kodac-runtime/test/kri-r1-gold-reviewer-evidence.test.ts
docs/planning/KODAC_KRI_R1_GOLD_REVIEWER_EVIDENCE_CORPUS_EVIDENCE_2026-08-13.md
```

The implementation may add only fixture data, a deterministic read-only validator/test, and an evidence ledger under the paths above.

Any additional path requires separate founder review before write.

No production `src/**` path is authorized.

No `.github/**`, package manifest, lockfile, provenance policy, trust-policy, ExecutionGateway, schema/runtime-contract, storage, network, model, agent, or release path is authorized.

## Implementation constraints

The KRI-R1 implementation must be:

- read-only with respect to repository/runtime behavior;
- deterministic;
- offline during tests;
- dependency-free beyond already-canonical repository dependencies;
- bounded in fixture size and parser behavior;
- fail-closed on malformed fixture structure;
- fail-closed on duplicate identities;
- fail-closed on unauthorized PR/source references;
- explicit about missing or unavailable historical evidence;
- portable across supported test environments where applicable.

The implementation must not fetch GitHub, Cubic, CodeRabbit, or any other network service at test/runtime execution time. Historical evidence must be intentionally materialized as bounded fixtures with recorded identities.

## Required validation

A KRI-R1 implementation candidate must prove at least:

1. every case belongs to the exact authorized source set;
2. every case has one allowed gold disposition;
3. both gold dispositions are present;
4. required category coverage is present without synthetic relabeling;
5. case identities are unique and deterministic;
6. corpus identity is deterministic under canonical ordering;
7. mutated identity-bearing fields are detected;
8. malformed evidence references are rejected;
9. unauthorized PR/source references are rejected;
10. duplicate or ambiguous source claims fail closed;
11. repository/reviewer content cannot act as instructions;
12. validator execution performs no network, process execution, or repository mutation;
13. existing governance/provenance tests remain green;
14. applicable runtime/typecheck/tests remain green;
15. no production API or runtime behavior changes.

## Benchmark role

KRI-R1 establishes gold evidence inputs only.

It does not establish:

- Reviewer Intelligence benchmark thresholds;
- a finding runtime contract;
- an adjudication runtime contract;
- model/provider superiority;
- model/provider qualification;
- a production reviewer engine;
- a production judge;
- K5 acceptance criteria.

Later gates must consume KRI-R1 evidence without silently rewriting its gold truth.

## Explicit non-grants

```text
KRI-R2+ IMPLEMENTATION: NOT AUTHORIZED
KRI REVIEWER ENGINE: NOT AUTHORIZED
KRI FINDING RUNTIME SCHEMA: NOT AUTHORIZED
KRI ADJUDICATION RUNTIME: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED
K3-R6+: NOT AUTHORIZED

CUBIC SOURCE INTAKE: NOT AUTHORIZED
CODERABBIT SOURCE INTAKE: NOT AUTHORIZED
CUBIC INTEGRATION: NOT AUTHORIZED
CODERABBIT INTEGRATION: NOT AUTHORIZED
EXTERNAL REVIEW SERVICE INTEGRATION: NOT AUTHORIZED

NEW KODAC DEPENDENCIES: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED

NETWORK FETCH DURING KRI-R1 TEST/RUNTIME: NOT AUTHORIZED
PERSISTENT REVIEW STORAGE: NOT AUTHORIZED
PERSISTENT REVIEW LEARNING: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED
MODEL CALLS: NOT AUTHORIZED

AUTOFIX EXECUTION: NOT AUTHORIZED
REPOSITORY WRITE AUTHORITY: NOT AUTHORIZED
GITHUB COMMENT / REVIEW WRITE AUTHORITY: NOT AUTHORIZED
PR APPROVAL AUTHORITY: NOT AUTHORIZED
MERGE AUTHORITY FROM KRI: NOT AUTHORIZED
PROVEN_READY AUTHORITY FROM KRI: NOT AUTHORIZED

RULESET CHANGE: NOT AUTHORIZED
K2 EXECUTION-AUTHORITY EXPANSION: NOT AUTHORIZED

PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
```

K2 remains the sole trusted side-effect execution authority.

The existing Done Gate remains the `PROVEN_READY` authority under accepted contracts.

## State after canonical adoption of this authorization

```text
KRI-P0: CANONICAL PLANNING AUTHORITY
KRI-R1 CORPUS IMPLEMENTATION: AUTHORIZED WITHIN THE EXACT BOUNDED SURFACE ABOVE
KRI-R1 CORPUS: NOT YET IMPLEMENTED / NOT YET CANONICAL
KRI-R2+: NOT AUTHORIZED
KRI REVIEWER RUNTIME: NOT AUTHORIZED
K5: PROPOSED / NOT AUTHORIZED
```

## Merge gate

This authorization record may be merged only after exact-head review confirms:

- canonical base remains unchanged;
- this PR changes only this authorization document;
- KRI-P0 remains canonical;
- the KRI-R1 scope is test/evidence only;
- no runtime/source/dependency/workflow authority is accidentally granted;
- all explicit non-grants remain intact;
- required repository checks are green;
- ruleset protection remains active without bypass;
- unresolved review threads are zero.

Canonical adoption authorizes the later bounded KRI-R1 corpus implementation described here. It does not itself create the corpus.