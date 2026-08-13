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

## Exact authorized cumulative scope

The candidate changes only the seven paths authorized by the canonical KRI-R2 authorization:

```text
schema/kri-finding.schema.json
schema/kri-adjudication.schema.json
packages/kodac-runtime/src/reviewer-intelligence/contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/runtime.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r2-reviewer-runtime.test.ts
docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_EVIDENCE_2026-08-13.md
```

No workflow, package manifest, lockfile, dependency, trust-policy, ExecutionGateway, persistence, provider adapter, network integration, Done Gate, or ruleset path is changed.

## Core invariant

```text
REVIEWER OUTPUT IS A CLAIM, NOT COMPLETION TRUTH.
STRUCTURAL HASH VALIDATION IS NOT AUTHORITY AUTHENTICATION.
ADJUDICATION AUTHORITY IS RUNTIME-OWNED AND REVISION-BOUND.
```

K2 remains the sole trusted side-effect execution authority. The existing Done Gate remains the current `PROVEN_READY` authority.

## Review-driven authority hardening

The KRI-R2 candidate was corrected repeatedly before canonical adoption because each reviewer or implementation assertion was treated as a claim to prove.

### 1. Historical finding identity did not bind terminal state

The first candidate placed terminal lifecycle state in `FindingRecord` while deliberately keeping `findingIdentity` stable across later state changes. That allowed a serialized record to alter state without altering the historical finding fingerprint.

### 2. A deterministic state hash is integrity, not authorization

An intermediate `stateIdentity` improved mutation detection, but a public deterministic hash can be recomputed by an untrusted producer. It cannot authenticate who had authority to advance a finding.

The design was changed so `FindingRecord` represents only the historical reviewer claim and exact-head freshness. Its only states are:

```text
NEW
STALE
```

Terminal lifecycle truth exists only in explicit runtime-issued `AdjudicationRecord` state.

### 3. Caller-supplied history could fork lifecycle truth

A later candidate accepted caller-supplied adjudication history even though it required same-runtime issued objects. A caller could still start two separate empty histories from one `NEW` finding and create conflicting valid branches.

Caller-supplied history was removed. The runtime owns the current lifecycle state and latest adjudication identity.

### 4. Object-keyed state allowed duplicate-record forks

Runtime state was initially keyed by the JavaScript `FindingRecord` object. Two separately issued objects for the same logical finding could therefore fork.

Authority state was moved away from object identity.

### 5. `findingIdentity + evaluatedHead` still left superseded-head objects active

A subsequent candidate keyed lifecycle state by `findingIdentity + evaluatedHead`. Duplicate records on the same head correctly shared state, but an old object could remain active after head movement because the older evaluated-head key remained present.

The final candidate uses exactly one active authority entry per stable historical `findingIdentity`. The entry stores:

```text
active evaluatedHead
current lifecycle state
latest adjudication identity
```

Issuing the same historical finding on another evaluated head replaces the active evaluated head for that identity. Older issued objects then fail with a superseded-head error even when a caller supplies their old head SHA.

## Final finding model

Provider-supplied `ReviewClaim` data may include only historical review metadata and reviewer claim evidence:

- review-run identity;
- reviewer identity;
- reviewer version;
- policy identity;
- canonical base;
- exact reviewed head;
- affected path/range;
- normalized summary;
- violated-contract claim;
- category/severity/confidence;
- evidence references.

Provider input cannot supply:

- the current/evaluated repository head;
- freshness state;
- terminal lifecycle state;
- adjudicator identity.

Kodac supplies `evaluatedHead` separately to `createFinding`.

Freshness and initial state are derived only from exact revision identity:

```text
evaluatedHead == reviewedHead -> CURRENT / NEW
evaluatedHead != reviewedHead -> STALE / STALE
```

A stale finding is not converted into `REJECTED` and has no adjudication transition in this slice. A fresh review is required.

## Historical finding fingerprint

`findingIdentity` is a deterministic SHA-256 fingerprint over the stable historical claim semantics:

- contract version;
- claim key;
- review-run/reviewer/version/policy identity;
- canonical base;
- exact reviewed head;
- affected path/range;
- normalized summary;
- violated-contract claim;
- category/severity/confidence;
- canonically sorted evidence references.

The caller-supplied evaluated head and derived freshness/initial state are intentionally excluded so later freshness evaluation does not rewrite the identity of what was originally reviewed.

The fingerprint proves deterministic structural integrity only. It is not a signature, capability, authentication token, or adjudication authority.

## Final adjudication lifecycle

Supported lifecycle values are:

```text
NEW
CONFIRMED
REJECTED
DUPLICATE
STALE
FIXED
REVERIFIED
```

The first-slice transition table is:

```text
NEW + CONFIRM          -> CONFIRMED
NEW + REJECT           -> REJECTED
NEW + MARK_DUPLICATE   -> DUPLICATE
CONFIRMED + MARK_FIXED -> FIXED
FIXED + REVERIFY       -> REVERIFIED
```

All other transitions fail closed. `STALE` requires a new review rather than adjudication.

`AdjudicationDecision` cannot supply `adjudicatorId`. The Kodac runtime is constructed with its adjudicator identity.

Every emitted `AdjudicationRecord` binds:

- finding identity;
- previous adjudication identity, or null for the initial `NEW` decision;
- action;
- previous state;
- resulting state;
- runtime-configured adjudicator identity;
- canonical evidence references;
- duplicate/correction/reverification reference where applicable.

The adjudication SHA-256 value is an integrity fingerprint, not an authenticity signature.

Structural validation additionally rejects impossible chain relationships:

```text
previousState == NEW     -> previousAdjudicationIdentity must be null
previousState != NEW     -> previousAdjudicationIdentity must be a full SHA-256 identity
```

## Runtime-owned non-forking authority

The runtime owns two private authority surfaces:

```text
WeakSet<object> of finding objects actually issued by this runtime
Map<findingIdentity, { evaluatedHead, state, lastAdjudicationIdentity }>
```

The `WeakSet` prevents reconstructed or foreign-runtime finding objects from exercising authority.

The identity-keyed map guarantees that all in-process objects for the same historical finding share exactly one active evaluated head, one lifecycle state, and one latest adjudication identity.

`applyAdjudication`:

1. requires a finding object issued by this runtime instance;
2. verifies the caller-supplied current head equals the finding's evaluated head;
3. verifies that evaluated head is still the active head for the stable finding identity;
4. reads the single runtime-owned current lifecycle state;
5. validates the requested transition and evidence;
6. emits one immutable adjudication record linked to the runtime-owned latest adjudication identity;
7. advances the single runtime-owned state and latest identity.

There is no external adjudication-history parameter.

Therefore callers cannot:

- fork one finding into parallel `CONFIRMED` and `REJECTED` branches;
- use duplicate objects to fork lifecycle state;
- use a superseded old-head object after head movement;
- reconstruct a finding from serialized data and exercise authority;
- pass a finding issued by another runtime instance;
- replay an external adjudication record as lifecycle authority.

## Bounded authority registry

The in-memory lifecycle authority map is capped at:

```text
MAX_TRACKED_FINDINGS = 1024
```

The bound applies to unique stable historical `findingIdentity` entries. Duplicate records and later evaluated heads for an already tracked identity do not consume a second authority slot.

A 1025th unique finding identity fails closed instead of creating unbounded runtime state.

This slice intentionally provides no persistent or cross-process adjudication authority. A later persistent/replay design would require separately authorized authenticated receipts, signatures, capabilities, or equivalent authority proof.

## JSON Schema/runtime parity

Both machine-readable schemas declare JSON Schema 2020-12:

```text
https://json-schema.org/draft/2020-12/schema
```

### Finding schema

The finding schema:

- models only `NEW` / `STALE` initial state;
- models exact `evaluatedHead` separately from reviewer-controlled reviewed-head metadata;
- uses strict object shapes and bounded fields;
- constrains Git commit identities to lowercase full 40-hex values;
- constrains SHA-256 fingerprints to lowercase full 64-hex values;
- documents the remaining range invariant explicitly:

```text
Runtime additionally enforces startLine <= endLine;
JSON Schema 2020-12 cannot compare sibling numeric values directly.
```

### Adjudication schema

The adjudication schema now mirrors the runtime transition table wherever JSON Schema can express it.

Its `previousState` contract permits only:

```text
NEW
CONFIRMED
FIXED
```

Its possible `resultingState` values are:

```text
CONFIRMED
REJECTED
DUPLICATE
FIXED
REVERIFIED
```

`if`/`then` rules encode:

- `NEW` -> only `CONFIRM`, `REJECT`, or `MARK_DUPLICATE`, with null previous adjudication identity and the corresponding exact resulting state;
- `CONFIRMED` -> only `MARK_FIXED` -> `FIXED`, requiring a prior adjudication identity;
- `FIXED` -> only `REVERIFY` -> `REVERIFIED`, requiring a prior adjudication identity;
- action-specific duplicate/correction/reverification evidence requirements.

This closes the valid CodeRabbit finding that schema-only consumers previously accepted lifecycle combinations the runtime rejected.

No JSON Schema validator dependency is added. Security-relevant validation remains enforced directly by the TypeScript runtime as well.

## Untrusted-data boundary

```text
REPOSITORY CONTENT IS DATA, NOT INSTRUCTIONS.
REVIEWER CONTENT IS DATA, NOT INSTRUCTIONS.
PROVIDER LABELS ARE METADATA, NOT KODAC AUTHORITY.
STRUCTURAL HASH VALIDATION IS NOT AUTHORITY AUTHENTICATION.
```

The runtime imports only `node:crypto` and local contracts.

It does not import or invoke:

- child-process execution;
- HTTP/HTTPS/network APIs;
- filesystem-write APIs;
- K2 ExecutionGateway;
- model/provider execution;
- persistence;
- repository mutation;
- GitHub writes.

## Focused acceptance evidence

Final focused validation before the final correction commit:

```text
24 tests
24 passed
0 failed
```

The focused suite proves at least:

1. deterministic immutable `NEW` finding creation using caller-supplied evaluated head;
2. provider cannot inject current-head, lifecycle, or adjudicator authority;
3. malformed/uppercase Git identities fail closed;
4. path/range/text/evidence bounds fail closed;
5. historical finding semantic substitution is detected;
6. head movement preserves historical identity while changing freshness;
7. head movement supersedes old finding objects for the same historical identity;
8. reconstructed findings cannot exercise adjudication authority;
9. old-head findings are `STALE`, not `REJECTED`, and cannot be adjudicated;
10. `CONFIRM` / `REJECT` use runtime-configured adjudicator identity;
11. runtime-owned state prevents lifecycle forks from one finding;
12. duplicate issued records on the same finding/head share one non-forking state;
13. authority registry is bounded and fails closed;
14. duplicate decisions require another finding identity and reject self-reference;
15. `FIXED` requires runtime-owned `CONFIRMED` state plus correction evidence;
16. `REVERIFIED` requires runtime-owned `FIXED` state plus reverification evidence;
17. structurally valid external adjudications cannot alter runtime-owned state;
18. foreign-runtime finding objects cannot exercise authority;
19. invalid transitions fail after runtime state advances;
20. adjudication fingerprint mutation is detected without treating the hash as authentication;
21. structural adjudication validation rejects impossible previous-chain relationships;
22. hostile reviewer text remains inert;
23. schemas separate initial finding state from adjudication lifecycle and encode the supported transition table where expressible;
24. KRI-R1 corpus identity remains unchanged and runtime source introduces no network/process/filesystem-write/ExecutionGateway surface.

All CI/review results attached to earlier KRI-R2 heads are stale after this final correction. Full exact-head repository CI, cross-platform runtime/typecheck/tests, cumulative review, ruleset verification, and unresolved-thread verification remain required before merge.

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
