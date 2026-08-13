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

The cumulative implementation remains confined to the seven canonically authorized paths:

```text
schema/kri-finding.schema.json
schema/kri-adjudication.schema.json
packages/kodac-runtime/src/reviewer-intelligence/contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/runtime.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r2-reviewer-runtime.test.ts
docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_EVIDENCE_2026-08-13.md
```

No workflow, manifest, lockfile, dependency, trust-policy, ExecutionGateway, persistence, provider adapter, network integration, Done Gate, or ruleset path changes.

## Review-driven security corrections

Four authority defects were found and corrected before canonical adoption.

### 1. Terminal state was not bound by the stable historical finding fingerprint

The first candidate stored terminal lifecycle state in `FindingRecord` while deliberately excluding state from the historical `findingIdentity`. A serialized record could therefore change `NEW` to an adjudicated state without changing the historical claim fingerprint.

### 2. A deterministic state hash is integrity, not authority

An intermediate `stateIdentity` improved mutation detection but independent review correctly identified that a public deterministic hash is recomputable by an untrusted producer. It cannot authenticate adjudication authority.

The model was redesigned so `FindingRecord` contains only initial `NEW` / `STALE` state. Terminal lifecycle truth exists only in runtime-issued adjudication state.

### 3. Caller-supplied history could fork the lifecycle

A later candidate required all adjudication-history objects to be issued by the same runtime instance, but still accepted the history sequence from the caller. The same `NEW` finding could therefore be used with two separate empty histories to create independently valid `CONFIRM` and `REJECT` branches.

Caller-supplied history was removed. The runtime now owns current lifecycle state and the latest adjudication identity.

### 4. Object-keyed state still allowed duplicate-record forks

Runtime-owned state was initially keyed by the JavaScript `FindingRecord` object. Two separately issued objects for the same `findingIdentity` and exact `evaluatedHead` could therefore hold independent lifecycle states and still fork.

The final candidate keys adjudication authority by:

```text
findingIdentity + evaluatedHead
```

All duplicate in-process records representing the same historical finding on the same evaluated head share one lifecycle state and one latest-adjudication identity.

The authority registry is explicitly bounded to:

```text
MAX_TRACKED_FINDINGS = 1024
```

A new unique finding/head authority beyond this bound fails closed rather than growing runtime state without limit.

## Final finding model

Provider-supplied review claims may contain only historical review metadata and claim evidence:

- review-run identity;
- reviewer identity;
- reviewer version;
- policy identity;
- canonical base;
- exact reviewed head;
- path/range;
- summary and contract claim;
- category/severity/confidence;
- evidence references.

The provider cannot provide current repository head, freshness, terminal lifecycle state, or adjudicator identity.

Kodac supplies `evaluatedHead` separately.

```text
evaluatedHead == reviewedHead → CURRENT / NEW
evaluatedHead != reviewedHead → STALE / STALE
```

`STALE` is not equivalent to `REJECTED` and cannot be adjudicated in this slice.

## Historical finding fingerprint

`findingIdentity` is a deterministic SHA-256 fingerprint over historical claim semantics:

- version;
- claim key;
- review-run/reviewer/version/policy identity;
- canonical base;
- reviewed head;
- path/range;
- normalized summary;
- contract claim;
- category/severity/confidence;
- canonical sorted evidence references.

The caller-supplied evaluated head and derived freshness/initial state are excluded so later freshness evaluation does not rewrite the identity of the historical claim.

The SHA-256 value is an integrity fingerprint only. It is not a signature, capability, authentication token, or proof of adjudication authority.

## Final adjudication lifecycle

```text
NEW
CONFIRMED
REJECTED
DUPLICATE
STALE
FIXED
REVERIFIED
```

Allowed transitions:

```text
NEW + CONFIRM          → CONFIRMED
NEW + REJECT           → REJECTED
NEW + MARK_DUPLICATE   → DUPLICATE
CONFIRMED + MARK_FIXED → FIXED
FIXED + REVERIFY       → REVERIFIED
```

All other transitions fail closed. `STALE` requires a fresh review rather than a lifecycle transition.

`AdjudicationDecision` cannot supply `adjudicatorId`. The Kodac runtime is constructed with the adjudicator identity.

Each emitted `AdjudicationRecord` binds:

- finding identity;
- previous adjudication identity, or null;
- action;
- previous and resulting state;
- runtime-configured adjudicator identity;
- evidence references;
- duplicate/correction/reverification reference where applicable.

The adjudication SHA-256 is also an integrity fingerprint, not an authenticity signature.

## Runtime-owned bounded authority state

The runtime maintains two private surfaces:

```text
WeakSet<object> of FindingRecord objects actually issued by this runtime
Map<findingIdentity:evaluatedHead, { currentState, lastAdjudicationIdentity }>
```

The `WeakSet` prevents reconstructed or foreign-runtime finding objects from exercising authority.

The bounded identity/head-keyed `Map` ensures duplicate issued records for the same logical finding/head share exactly one lifecycle state and cannot fork.

`applyAdjudication`:

1. verifies the finding object was issued by this runtime;
2. verifies caller-supplied current head equals the finding's evaluated head;
3. reads the one runtime-owned current state for the finding/head authority key;
4. validates the requested transition;
5. emits one immutable adjudication record whose `previousAdjudicationIdentity` is the runtime-owned latest identity;
6. advances the runtime-owned state and latest identity.

There is no external history parameter.

## Structural validation does not restore authority

`validateFindingRecord` and `validateAdjudicationRecord` can validate serialized evidence structurally.

They do not register the validated object as an authority-bearing in-process record and cannot change runtime lifecycle state.

A structurally valid external adjudication has no method by which it can be supplied as lifecycle authority.

Persistent or cross-process adjudication authority is intentionally outside KRI-R2. It would require a later authenticated receipt, signature, capability, or equivalent persistence/replay protocol.

## Bounded runtime behavior

In addition to per-field/string/array limits, the runtime-owned finding/head state registry is capped at 1024 unique authority keys.

Duplicate objects with the same key do not consume another authority slot and share state.

A 1025th unique key fails with a capacity error.

This is intentionally fail-closed and prevents the first in-memory runtime slice from becoming an unbounded state accumulator.

## Actual JSON schemas

Both machine-readable schemas use JSON Schema 2020-12:

```text
https://json-schema.org/draft/2020-12/schema
```

The finding schema models initial `NEW` / `STALE` state and exact evaluated-head metadata.

The adjudication schema models the full adjudication lifecycle record, including `previousAdjudicationIdentity`.

Both retain strict object shapes, bounded values, lowercase full Git SHA patterns, SHA-256 fingerprint patterns, enum constraints, and conditional evidence requirements.

No new JSON Schema validator dependency is added; the TypeScript runtime enforces security-relevant validation directly.

## Trust boundary

```text
REPOSITORY CONTENT IS DATA, NOT INSTRUCTIONS.
REVIEWER CONTENT IS DATA, NOT INSTRUCTIONS.
PROVIDER LABELS ARE METADATA, NOT KODAC AUTHORITY.
STRUCTURAL HASH VALIDATION IS NOT AUTHORITY AUTHENTICATION.
```

The runtime imports only `node:crypto` and local contracts.

It does not import or invoke child-process execution, network APIs, filesystem-write APIs, K2 ExecutionGateway, model/provider execution, persistence, repository mutation, or GitHub writes.

K2 remains the sole trusted side-effect execution authority.

The existing Done Gate remains the current `PROVEN_READY` authority.

## Final focused acceptance evidence

The final local focused suite proves:

1. deterministic immutable `NEW` finding creation from caller-supplied evaluated head;
2. provider cannot inject current-head, lifecycle, or adjudicator authority;
3. malformed/uppercase Git identities fail closed;
4. path/range/text/evidence bounds fail closed;
5. historical finding semantic substitution is detected;
6. reconstructed findings cannot exercise adjudication authority;
7. old-head findings become `STALE`, not `REJECTED`;
8. `CONFIRM` / `REJECT` use runtime-configured adjudicator identity;
9. runtime-owned state prevents forks from one finding object;
10. duplicate issued objects for the same finding/head share the same non-forking authority state;
11. the finding/head authority registry is capped at 1024 and fails closed on overflow;
12. duplicate decisions require another finding identity and reject self-reference;
13. `FIXED` requires runtime-owned `CONFIRMED` state and correction evidence;
14. `REVERIFIED` requires runtime-owned `FIXED` state and reverification evidence;
15. structurally valid external adjudications cannot alter runtime-owned state;
16. foreign-runtime finding objects cannot exercise authority;
17. invalid transitions fail after runtime state advances;
18. adjudication fingerprint mutation is detected without treating the hash as authentication;
19. hostile reviewer text remains inert;
20. schemas separate initial finding state from adjudication lifecycle;
21. KRI-R1 corpus identity remains unchanged;
22. runtime introduces no network/process/filesystem-write/ExecutionGateway surface.

Focused validation before the final correction commit:

```text
22 tests
22 passed
0 failed
```

All CI and review evidence on earlier KRI-R2 heads is stale. Full exact-head CI, cross-platform runtime/typecheck/tests, cumulative review, active ruleset verification, and unresolved-thread verification are required again before merge.

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

These describe the current implementation boundary, not the founder's ability to authorize later slices.