# Kodac KRI-R2 Finding & Adjudication Runtime Evidence

## Record identity

```text
Gate: KRI-R2
Implementation base: efb3944a5638096fe845d49c3b1edf4ff91ea0c9
Implementation base tree: 8274bbe72416de4086d1e537945bcf2e2053a584
Authorization: docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_AUTHORIZATION_2026-08-13.md
Repository: TheHalfMoon/Kodac
Repository id: 1297407563
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

## Exact cumulative scope

Only the seven canonically authorized paths are changed:

```text
schema/kri-finding.schema.json
schema/kri-adjudication.schema.json
packages/kodac-runtime/src/reviewer-intelligence/contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/runtime.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r2-reviewer-runtime.test.ts
docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_EVIDENCE_2026-08-13.md
```

No workflow, dependency, manifest, lockfile, trust-policy, ExecutionGateway, persistence, provider adapter, network integration, Done Gate, or ruleset path is changed.

## Core trust invariant

```text
REVIEWER OUTPUT IS A CLAIM, NOT COMPLETION TRUTH.
STRUCTURAL HASH VALIDATION IS NOT AUTHORITY AUTHENTICATION.
ADJUDICATION AUTHORITY IS RUNTIME-OWNED AND REVISION-BOUND.
```

K2 remains the sole trusted side-effect execution authority. The existing Done Gate remains the current `PROVEN_READY` authority.

## Final finding model

Provider input contains historical review identity and claim evidence only. It cannot supply the current repository head, terminal lifecycle state, or adjudicator identity.

Kodac supplies `evaluatedHead` separately.

```text
evaluatedHead == reviewedHead -> CURRENT / NEW
evaluatedHead != reviewedHead -> STALE / STALE
```

`FindingRecord` therefore carries only initial `NEW` or `STALE`. Terminal lifecycle truth exists only in runtime-issued adjudication state. A stale finding is not reclassified as rejected and cannot be adjudicated in this slice.

`findingIdentity` is a deterministic SHA-256 fingerprint over stable historical claim semantics: version, claim key, reviewer/run/version/policy identity, canonical base, exact reviewed head, path/range, normalized summary, contract claim, category/severity/confidence, and canonically sorted evidence references.

The evaluated head, freshness, and initial state are excluded from that historical fingerprint so later freshness evaluation does not rewrite what was originally reviewed. The fingerprint is integrity evidence only, not a signature or authority token.

## Final adjudication lifecycle

```text
NEW + CONFIRM          -> CONFIRMED
NEW + REJECT           -> REJECTED
NEW + MARK_DUPLICATE   -> DUPLICATE
CONFIRMED + MARK_FIXED -> FIXED
FIXED + REVERIFY       -> REVERIFIED
```

All other transitions fail closed. `STALE` has no adjudication transition.

The adjudicator identity is configured on `ReviewerIntelligenceRuntime`; reviewer/provider decisions cannot inject it.

Every `AdjudicationRecord` binds the finding identity, previous adjudication identity, action, previous/resulting states, configured adjudicator identity, evidence references, and duplicate/correction/reverification reference when applicable. Its SHA-256 value is an integrity fingerprint, not authenticity proof.

Structural validation requires:

```text
previousState == NEW -> previousAdjudicationIdentity == null
previousState != NEW -> previousAdjudicationIdentity is a full SHA-256 identity
```

## Runtime-owned non-forking authority

Private runtime state consists of:

```text
WeakSet<object> of FindingRecord objects issued by this runtime
Map<findingIdentity, { evaluatedHead, state, lastAdjudicationIdentity }>
```

Consequences:

- reconstructed finding objects cannot exercise authority;
- foreign-runtime finding objects cannot exercise authority;
- duplicate issued objects for the same historical identity and head share one lifecycle state;
- only one evaluated head is active for a stable historical finding identity;
- head movement supersedes older finding objects even when a caller presents their old SHA;
- callers cannot supply adjudication history, so they cannot fork or replay lifecycle history;
- the next transition always begins from runtime-owned current state.

The authority registry is bounded at 1024 unique stable finding identities and fails closed on overflow.

Persistent or cross-process adjudication authority is intentionally not implemented. A later replay/persistence design would require separately authorized authenticated receipts, signatures, capabilities, or equivalent authority proof.

## Duplicate semantics

`MARK_DUPLICATE` now requires more than a syntactically valid 64-hex identity.

The target `duplicateOf` identity must refer to another finding identity already tracked by the same runtime. Self-reference is rejected, and an invented/untracked SHA-256 identity is rejected.

This satisfies the KRI-R2 authorization requirement that duplicate disposition reference a valid finding identity rather than arbitrary hash-shaped text.

## JSON Schema/runtime parity

Both schemas use JSON Schema 2020-12 and strict object shapes.

The adjudication schema mirrors the runtime transition table wherever JSON Schema can express it:

- `NEW` permits only `CONFIRM`, `REJECT`, or `MARK_DUPLICATE`, with null previous adjudication identity and exact corresponding resulting state;
- `CONFIRMED` permits only `MARK_FIXED -> FIXED`, requiring a previous adjudication identity;
- `FIXED` permits only `REVERIFY -> REVERIFIED`, requiring a previous adjudication identity;
- action-specific duplicate/correction/reverification evidence requirements are encoded.

The finding schema explicitly documents cross-field invariants JSON Schema 2020-12 cannot express directly:

```text
Runtime derives CURRENT iff evaluatedHead == review.reviewedHead; otherwise STALE.
Runtime additionally enforces startLine <= endLine.
```

No JSON Schema validator dependency is added; security-relevant validation is enforced directly in TypeScript as well.

## Runtime surface confinement

The final test guard requires the runtime's static import modules to be exactly:

```text
./contracts.ts
node:crypto
```

It also rejects dynamic-import/require/eval/function-construction markers and network, child-process, filesystem-write, worker/module-loading, and ExecutionGateway surfaces.

The runtime performs no provider/model calls, network access, persistence, repository writes, GitHub writes, process execution, or K2 authority expansion.

## Review-driven corrections

Before canonical adoption the candidate was corrected for:

1. terminal state not being protected by stable historical finding identity;
2. false assumption that a recomputable state hash could authenticate authority;
3. caller-supplied history permitting lifecycle forks;
4. object-keyed lifecycle state permitting duplicate-record forks;
5. evaluated-head keyed state leaving old-head objects independently active;
6. schema transition contracts being weaker than runtime;
7. duplicate disposition accepting arbitrary hash-shaped target identities;
8. security-surface regression test being weaker than the actual intended import boundary.

Each prior head became stale after correction and is not used as certification for the final head.

## Focused validation

Final focused local validation before the final correction commit:

```text
27 tests
27 passed
0 failed
```

The suite proves deterministic finding identity, exact-head freshness, superseded-head rejection, provider authority separation, runtime-configured adjudicator identity, non-forking runtime state, duplicate-object state sharing, bounded authority registry, tracked-target duplicate semantics, correction/reverification requirements, structural chain validation, hostile-text inertness, schema transition parity, unchanged KRI-R1 corpus identity, and exact runtime import/surface confinement.

Full repository CI, cross-platform runtime/typecheck/tests, exact-head cumulative review, active ruleset verification, and unresolved-thread verification are still required after this commit before merge.

## Current non-grants

```text
KRI PROVIDER/MODEL EXECUTION: NOT IMPLEMENTED
KRI NETWORK INTEGRATION: NOT IMPLEMENTED
KRI PERSISTENCE / PERSISTENT REPLAY AUTHORITY: NOT IMPLEMENTED
KRI PERSISTENT LEARNING: NOT IMPLEMENTED
KRI AUTOFIX / REPOSITORY WRITE: NOT IMPLEMENTED
KRI GITHUB REVIEW / APPROVAL / MERGE AUTHORITY: NOT IMPLEMENTED
K5 IMPLEMENTATION: NOT AUTHORIZED BY THIS SLICE
PROVEN_READY AUTHORITY FROM KRI: NOT GRANTED
K3-R6+: NOT AUTHORIZED
```
