# Kodac KRI-R2 Finding & Adjudication Runtime Evidence

## Record identity

```text
Gate: KRI-R2
Implementation base: efb3944a5638096fe845d49c3b1edf4ff91ea0c9
Implementation base tree: 8274bbe72416de4086d1e537945bcf2e2053a584
Authorization: docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_AUTHORIZATION_2026-08-13.md
KRI-R1 corpus identity: e3f87d5e008918043da4f10617aa479d0d5e4b9fcde42143bc691763f503c4d4
Implementation class: PRODUCTION CONTRACTS + BOUNDED READ-ONLY RUNTIME
```

## Candidate decision

```text
KRI-R2 FINDING SCHEMA: IMPLEMENTED IN CANDIDATE
KRI-R2 ADJUDICATION SCHEMA: IMPLEMENTED IN CANDIDATE
KRI-R2 REVIEWER/ADJUDICATION RUNTIME: IMPLEMENTED IN CANDIDATE
CANONICAL STATUS: NOT CANONICAL UNTIL MERGE
```

## Exact authorized implementation scope

Exactly these seven paths are changed:

```text
schema/kri-finding.schema.json
schema/kri-adjudication.schema.json
packages/kodac-runtime/src/reviewer-intelligence/contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/runtime.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r2-reviewer-runtime.test.ts
docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_EVIDENCE_2026-08-13.md
```

No workflow, manifest, lockfile, dependency, trust-policy, ExecutionGateway, persistence, provider adapter, network integration, or Done Gate path changes.

## Runtime semantics

The first production KRI-R2 slice implements a provider-neutral pipeline:

```text
already-materialized ReviewClaim
→ strict fail-closed validation
→ deterministic FindingRecord
→ exact-head freshness evaluation
→ explicit Kodac adjudication decision
→ deterministic AdjudicationRecord
→ immutable returned records
```

A reviewer/provider cannot inject finding lifecycle state because `ReviewClaim` exact-key validation does not accept lifecycle/adjudication fields.

Exact-head mismatch creates `STALE`, never `REJECTED`. A stale claim cannot be adjudicated as if it reviewed the current head; it must be reviewed again.

The canonical lifecycle implemented by this slice is:

```text
NEW
CONFIRMED
REJECTED
DUPLICATE
STALE
FIXED
REVERIFIED
```

Allowed adjudication transitions are intentionally narrow:

```text
NEW + CONFIRM          → CONFIRMED
NEW + REJECT           → REJECTED
NEW + MARK_DUPLICATE   → DUPLICATE
CONFIRMED + MARK_FIXED → FIXED
FIXED + REVERIFY       → REVERIFIED
```

Other transitions fail closed.

## Identity model

Finding identity uses SHA-256 over a locale-independent canonical JSON preimage binding:

- contract version;
- claim key;
- reviewer/run/version/policy identity;
- canonical base;
- exact reviewed head;
- affected path/range;
- normalized summary;
- violated-contract claim;
- category/severity/confidence;
- canonical sorted evidence references.

`currentHead`, freshness, and lifecycle state are deliberately excluded from the finding identity because they are later evaluation/adjudication context; moving the repository head must make the finding stale without rewriting the historical claim identity.

Adjudication identity additionally binds:

- finding identity;
- action;
- previous and resulting states;
- adjudicator identity;
- canonical adjudication evidence references;
- duplicate/correction/reverification reference where applicable.

Semantic substitution without identity recomputation fails validation.

## Actual JSON schemas

Both machine-readable schemas declare:

```text
https://json-schema.org/draft/2020-12/schema
```

They use strict object shapes, bounded arrays/strings, lowercase full Git SHA patterns, SHA-256 identity patterns, enumerated lifecycle/actions, and conditional adjudication reference requirements.

The TypeScript runtime enforces security-relevant validation directly and does not introduce a JSON Schema validator dependency.

## Trust and authority boundary

```text
REPOSITORY CONTENT IS DATA, NOT INSTRUCTIONS.
REVIEWER CONTENT IS DATA, NOT INSTRUCTIONS.
PROVIDER LABELS ARE METADATA, NOT KODAC AUTHORITY.
```

The runtime imports only `node:crypto` from the platform and its local contracts.

It does not import or invoke:

- child process execution;
- HTTP/HTTPS/network APIs;
- filesystem write APIs;
- K2 ExecutionGateway;
- model/provider execution;
- persistence;
- repository mutation;
- GitHub writes.

K2 remains the sole trusted side-effect execution authority.

The existing Done Gate remains the only current `PROVEN_READY` authority.

## Required acceptance evidence

The candidate test slice covers:

- deterministic finding identities;
- strict unknown-property rejection;
- malformed/uppercase commit rejection;
- bounds/path/range validation;
- semantic substitution detection;
- identity continuity across later-head staleness;
- exact-head mismatch → `STALE`;
- explicit `CONFIRM` and `REJECT`;
- duplicate evidence requirements and self-reference rejection;
- correction evidence before `FIXED`;
- reverification evidence before `REVERIFIED`;
- invalid transition rejection;
- adjudication identity mutation detection;
- hostile reviewer text remaining inert data;
- actual schema dialect/strictness checks;
- unchanged KRI-R1 corpus identity;
- static absence of network/process/filesystem-write/ExecutionGateway surfaces.

Focused local validation before commit:

```text
16 tests
16 passed
0 failed
```

Full repository CI, typecheck, cross-platform runtime matrix, exact-head review, and external reviewer findings remain required before canonical merge.

## Non-grants after this candidate

```text
KRI PROVIDER/MODEL EXECUTION: NOT IMPLEMENTED
KRI NETWORK INTEGRATION: NOT IMPLEMENTED
KRI PERSISTENCE / LEARNING: NOT IMPLEMENTED
KRI AUTOFIX / REPOSITORY WRITE: NOT IMPLEMENTED
KRI GITHUB REVIEW / APPROVAL / MERGE AUTHORITY: NOT IMPLEMENTED
K5 IMPLEMENTATION: NOT AUTHORIZED BY THIS SLICE
PROVEN_READY AUTHORITY FROM KRI: NOT GRANTED
K3-R6+: NOT AUTHORIZED
```

The founder's broader ability to authorize later slices is not constrained by these implementation non-grants; they define only the current trusted runtime boundary.
