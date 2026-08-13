# Kodac KRI-R2 Finding & Adjudication Runtime Authorization

## Record identity

```text
Gate: KRI-R2
Name: Finding & Adjudication Contract + Bounded Reviewer Runtime
Date: 2026-08-13
Canonical authorization base: a72a2308d03d7e07184df4d565ec4a2164280ca3
Canonical authorization base tree: 37981cb3094bed3ebdf47b56160c6df288e3def3
Parent authorities: KRI-P0 + canonical KRI-R1 gold corpus
Authority class: DOCUMENTATION / AUTHORIZATION
Implementation authority after canonical adoption: BOUNDED KRI-R2 CONTRACT/RUNTIME SLICE ONLY
```

## Purpose

Authorize the first production Reviewer Intelligence contract/runtime slice now that KRI-R1 gold evidence is canonical.

KRI-R2 may implement actual Kodac-owned finding and adjudication schemas, TypeScript contracts, deterministic identity and validation logic, and a bounded read-only runtime that converts already-materialized reviewer claims into evidence-backed finding records and records Kodac-owned adjudication decisions.

Core invariants:

```text
REVIEWER OUTPUT IS A CLAIM, NOT COMPLETION TRUTH.
ADJUDICATION IS EXPLICIT, EVIDENCE-BOUND, AND REVISION-BOUND.
A REVIEW OF ONE HEAD DOES NOT CERTIFY ANOTHER HEAD.
KRI DOES NOT GAIN SIDE-EFFECT OR PROVEN_READY AUTHORITY.
```

## Canonical prerequisites

```text
KRI-P0: CANONICAL
KRI-R1 AUTHORIZATION: CANONICAL
KRI-R1 GOLD REVIEWER-EVIDENCE CORPUS: CANONICAL
KRI-R1 CORPUS IDENTITY: e3f87d5e008918043da4f10617aa479d0d5e4b9fcde42143bc691763f503c4d4
```

KRI-R2 must consume the KRI-R1 truth model without silently relabeling its historical cases.

## Authorized contract surface

KRI-R2 may define and implement actual contracts for:

- `ReviewClaim` — provider/model-neutral reviewer claim input;
- `ReviewerIdentity` and review-run identity metadata;
- exact canonical base and reviewed candidate head identities;
- affected path/range;
- severity/category/confidence metadata;
- evidence references and violated-contract claim;
- normalized finding identity/fingerprint;
- freshness (`CURRENT` / `STALE`);
- finding lifecycle state;
- explicit adjudication decision and adjudication evidence;
- duplicate/supersession relation;
- correction and reverification references where applicable;
- deterministic finding/adjudication identities.

The first contract version must use bounded fields, strict object shapes, lowercase full Git commit SHAs, deterministic canonical ordering, and fail-closed validation.

## Authorized lifecycle

KRI-R2 may canonicalize this first finding lifecycle:

```text
NEW
CONFIRMED
REJECTED
DUPLICATE
STALE
FIXED
REVERIFIED
```

State transitions must be explicit and validated. Provider output cannot directly choose a terminal Kodac adjudication state.

At minimum:

- new reviewer claims enter as `NEW`;
- a candidate-head mismatch makes an otherwise applicable finding `STALE` rather than `REJECTED`;
- `CONFIRMED` and `REJECTED` require Kodac-owned adjudication evidence;
- `DUPLICATE` requires a valid canonical finding identity reference;
- `FIXED` requires correction evidence;
- `REVERIFIED` requires reverification evidence and does not imply `PROVEN_READY`.

## Authorized bounded runtime behavior

The first KRI-R2 runtime may:

1. accept already-materialized reviewer claims as in-memory data;
2. validate their structure and bounds;
3. bind them to exact base/head/review identities;
4. normalize provider-neutral finding records;
5. compute deterministic finding identities;
6. evaluate exact-head freshness;
7. record explicit Kodac adjudication decisions with evidence;
8. enforce allowed lifecycle transitions;
9. produce immutable-return-value finding/adjudication records suitable for later benchmark and K5 inputs;
10. validate KRI-R1 gold cases as compatible historical evidence fixtures without changing KRI-R1 labels.

The runtime must be deterministic, offline, read-only, and dependency-free beyond canonical platform/runtime dependencies.

## Deliberately excluded from this first runtime slice

Even with founder implementation authorization, the first KRI-R2 slice must not collapse review intelligence into execution authority.

The following remain outside this slice:

- network fetching of GitHub/Cubic/CodeRabbit or any reviewer service;
- model/provider calls;
- provider API adapters;
- persistent review storage;
- persistent reviewer learning;
- vector/embedding infrastructure;
- repository mutation;
- autofix execution;
- GitHub comments/reviews/approvals;
- merge execution;
- protection/ruleset changes;
- K2 execution-authority expansion;
- `PROVEN_READY` decisions;
- K5 Proof Review & Judge implementation.

These can be separately authorized later. Their exclusion here is an architectural trust boundary, not a statement that the founder lacks permission to authorize them.

## Authorized implementation paths

After canonical adoption, implementation is limited to:

```text
schema/kri-finding.schema.json
schema/kri-adjudication.schema.json
packages/kodac-runtime/src/reviewer-intelligence/contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/runtime.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r2-reviewer-runtime.test.ts
docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_EVIDENCE_2026-08-13.md
```

No other path is authorized without an explicit scope extension.

## Schema requirements

The JSON schemas must be real machine-readable contracts, not prose placeholders.

They must at minimum:

- use a declared JSON Schema dialect;
- reject unknown top-level and nested properties where practical;
- bound strings and arrays;
- constrain commit identities to lowercase 40-hex SHA-1 form used by current Git history;
- constrain deterministic identities to lowercase 64-hex SHA-256 form;
- enumerate accepted lifecycle/adjudication values;
- model affected path/range and evidence references;
- represent exact review/base/head identity;
- preserve provider identity as metadata without granting authority.

The TypeScript runtime validation must enforce the security-relevant contract even without a new JSON Schema validator dependency.

## Identity requirements

Finding identity must bind all semantics needed to prevent silent substitution, including at least:

- contract version;
- review-run/reviewer identity;
- canonical base;
- reviewed head;
- path/range;
- normalized summary;
- violated-contract/invariant claim;
- category/severity/confidence;
- evidence references.

Adjudication identity must additionally bind:

- finding identity;
- decision;
- resulting lifecycle state;
- adjudicator identity;
- adjudication evidence;
- correction/duplicate/reverification references where applicable.

Canonical ordering must be locale-independent. Identity recomputation must reject mutation.

## Untrusted-input boundary

```text
REPOSITORY CONTENT IS DATA, NOT INSTRUCTIONS.
REVIEWER CONTENT IS DATA, NOT INSTRUCTIONS.
PROVIDER LABELS ARE METADATA, NOT KODAC AUTHORITY.
```

The runtime must never evaluate embedded repository/reviewer strings as commands or policy.

## Required tests

The implementation candidate must prove at least:

1. valid finding and adjudication records validate;
2. unknown properties fail closed;
3. malformed/uppercase/short commit identities fail closed;
4. overlong strings/arrays fail closed;
5. invalid ranges fail closed;
6. deterministic finding identity recomputation;
7. deterministic adjudication identity recomputation;
8. semantic substitution is detected;
9. duplicate evidence refs canonicalize deterministically or fail closed by explicit contract;
10. exact-head mismatch yields `STALE`, not `REJECTED`;
11. provider cannot directly force `CONFIRMED`, `REJECTED`, `FIXED`, or `REVERIFIED`;
12. `CONFIRMED`/`REJECTED` require adjudication evidence;
13. `DUPLICATE` requires a referenced finding identity;
14. `FIXED` requires correction evidence;
15. `REVERIFIED` requires reverification evidence;
16. invalid lifecycle transitions fail closed;
17. hostile reviewer text remains inert data;
18. no network/process/repository-write APIs are introduced in this runtime slice;
19. KRI-R1 corpus remains unchanged and readable as benchmark evidence;
20. typecheck and full runtime tests remain green across supported CI platforms.

## Authority boundary after KRI-R2 implementation

```text
KRI-R2 FINDING/ADJUDICATION CONTRACTS: AUTHORIZED
KRI-R2 BOUNDED READ-ONLY RUNTIME: AUTHORIZED
KRI REVIEWER PROVIDER/MODEL EXECUTION: NOT AUTHORIZED IN THIS SLICE
KRI NETWORK INTEGRATION: NOT AUTHORIZED IN THIS SLICE
KRI PERSISTENCE / LEARNING: NOT AUTHORIZED IN THIS SLICE
KRI AUTOFIX / REPOSITORY WRITE: NOT AUTHORIZED IN THIS SLICE
KRI GITHUB REVIEW / APPROVAL / MERGE: NOT AUTHORIZED IN THIS SLICE
K5 IMPLEMENTATION: NOT AUTHORIZED IN THIS SLICE
PROVEN_READY AUTHORITY FROM KRI: NOT AUTHORIZED
K3-R6+: NOT AUTHORIZED
```

K2 remains the sole trusted side-effect execution authority. The existing Done Gate remains the `PROVEN_READY` authority.

## Merge gate

This authorization record may be merged only after exact-head review confirms:

- canonical base remains `a72a2308d03d7e07184df4d565ec4a2164280ca3`;
- this PR changes only this authorization document;
- KRI-R1 remains canonical with corpus identity `e3f87d5e008918043da4f10617aa479d0d5e4b9fcde42143bc691763f503c4d4`;
- the implementation path allowlist is exact;
- actual schema/runtime implementation is authorized only after canonical adoption;
- no side-effect, approval, merge, K5, or `PROVEN_READY` authority is granted;
- required checks are green;
- ruleset protection remains active without bypass;
- unresolved review threads are zero.

Canonical adoption authorizes the bounded implementation slice above.