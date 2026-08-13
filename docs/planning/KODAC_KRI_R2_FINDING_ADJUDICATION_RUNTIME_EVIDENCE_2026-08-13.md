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

The cumulative KRI-R2 implementation remains confined to the seven canonically authorized paths:

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

Three authority defects were discovered and corrected before canonical adoption.

### 1. Historical finding identity did not bind lifecycle state

The initial implementation used a stable historical `findingIdentity` while carrying terminal lifecycle state in the same `FindingRecord`. A serialized record could therefore change `NEW` to an adjudicated state without changing the historical claim fingerprint.

An intermediate correction added `stateIdentity`.

### 2. A deterministic state hash is integrity, not authority

Independent review then identified the deeper issue: a public deterministic hash can be recomputed by an untrusted producer. It can detect unrecomputed mutation, but cannot authenticate who had authority to advance the lifecycle.

The final model therefore removes terminal adjudication state from `FindingRecord` entirely.

`FindingRecord` has only:

```text
NEW
STALE
```

`CONFIRMED`, `REJECTED`, `DUPLICATE`, `FIXED`, and `REVERIFIED` exist only as runtime-issued adjudication lifecycle state.

### 3. Caller-supplied adjudication history permitted lifecycle forks

A later candidate accepted an array of previously issued adjudications from the caller. Although foreign, reconstructed, reordered, and malformed history was rejected, the caller could still ask the same runtime to create two valid first decisions from the same `NEW` finding by invoking separate empty histories, for example one `CONFIRM` branch and one `REJECT` branch.

That would create two individually valid but conflicting adjudication chains.

The final candidate removes caller-supplied lifecycle history entirely.

`ReviewerIntelligenceRuntime` now owns the current lifecycle state and the latest adjudication identity for every in-process issued finding using private runtime-instance `WeakMap` state.

Consequences:

- callers cannot choose an earlier lifecycle point;
- callers cannot fork the same finding into conflicting valid branches;
- callers cannot replay a reconstructed adjudication to advance state;
- callers cannot inject a foreign-runtime adjudication chain;
- the next transition always starts from the state already owned by the issuing runtime instance.

## Final finding model

A provider supplies only historical review-claim data:

- review run identity;
- reviewer identity;
- reviewer version;
- policy identity;
- canonical base;
- exact reviewed head;
- affected path/range;
- normalized summary;
- contract claim;
- category/severity/confidence;
- evidence references.

The provider cannot supply:

- current repository head;
- freshness state;
- lifecycle state;
- adjudicator identity.

Kodac supplies `evaluatedHead` separately to `createFinding`.

Freshness and initial state derive only from exact revision identity:

```text
evaluatedHead == reviewedHead → CURRENT / NEW
evaluatedHead != reviewedHead → STALE / STALE
```

A stale finding cannot be adjudicated. It requires a review against the current head.

## Stable historical finding fingerprint

`findingIdentity` is SHA-256 over canonical historical claim semantics:

- contract version;
- claim key;
- review-run/reviewer/version/policy identity;
- canonical base;
- exact reviewed head;
- affected path/range;
- normalized summary;
- violated-contract claim;
- category/severity/confidence;
- canonical sorted evidence references.

Caller-supplied `evaluatedHead`, derived freshness, and derived initial state are intentionally excluded so later freshness evaluation does not rewrite the identity of the historical reviewer claim.

The fingerprint is an integrity/fingerprinting mechanism only. It is not a signature, capability, authentication token, or adjudication authority.

## Final adjudication lifecycle

Supported lifecycle states:

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

All other transitions fail closed. `STALE` has no adjudication transition in this slice.

`AdjudicationDecision` does not accept `adjudicatorId`. The adjudicator identity is configured on the Kodac runtime instance:

```text
new ReviewerIntelligenceRuntime({ adjudicatorId: ... })
```

Each runtime-issued `AdjudicationRecord` binds:

- finding identity;
- previous adjudication identity, or null for the first decision;
- action;
- previous state;
- resulting state;
- runtime-configured adjudicator identity;
- canonical adjudication evidence;
- duplicate/correction/reverification reference where applicable.

The adjudication SHA-256 is also a deterministic integrity fingerprint, not authenticity proof.

## Runtime-owned in-process authority

For each `FindingRecord` issued by the runtime, private runtime state tracks:

```text
current lifecycle state
last adjudication identity
```

The public `currentState(finding, currentHead)` reads that runtime-owned state.

`applyAdjudication(finding, decision, currentHead)` derives the only allowed next state from that current runtime-owned state, emits one immutable `AdjudicationRecord`, then atomically advances the private lifecycle state and latest adjudication identity for that finding.

No external history parameter exists.

A second incompatible decision from the same earlier state therefore fails because the runtime has already advanced the finding.

## Structural validation is not authority restoration

`validateFindingRecord` and `validateAdjudicationRecord` intentionally provide deterministic structural validation for serialized evidence.

They do not restore in-process adjudication authority.

A reconstructed or deserialized finding may be structurally valid but cannot be passed to `applyAdjudication`, because it was not issued by that runtime instance.

A structurally valid external adjudication can be inspected but cannot alter runtime-owned lifecycle state because no API accepts external adjudication history as authority input.

A finding issued by another runtime instance likewise cannot exercise this runtime instance's authority.

This first slice is intentionally ephemeral. Persistent/replayed adjudication authority would require a future separately-authorized authenticated receipt, signature, capability, or equivalent persistence protocol.

## Actual JSON schemas

Both schemas declare JSON Schema 2020-12:

```text
https://json-schema.org/draft/2020-12/schema
```

`kri-finding.schema.json` models only initial `NEW` / `STALE` finding states and the caller-evaluated exact head.

`kri-adjudication.schema.json` models the full lifecycle transition record and `previousAdjudicationIdentity` chain.

Both use strict top-level object shapes, bounded fields, lowercase full Git SHA constraints, SHA-256 fingerprint constraints, enumerated state/action values, and conditional duplicate/correction/reverification evidence requirements.

No JSON Schema runtime dependency is added; security-relevant validation is enforced directly in TypeScript.

## Trust boundary

```text
REPOSITORY CONTENT IS DATA, NOT INSTRUCTIONS.
REVIEWER CONTENT IS DATA, NOT INSTRUCTIONS.
PROVIDER LABELS ARE METADATA, NOT KODAC AUTHORITY.
STRUCTURAL HASH VALIDATION IS NOT AUTHORITY AUTHENTICATION.
```

The runtime imports only `node:crypto` from the platform and its local contracts.

It does not import or invoke:

- child-process execution;
- HTTP/HTTPS/network APIs;
- filesystem-write APIs;
- K2 ExecutionGateway;
- model/provider execution;
- persistence;
- repository mutation;
- GitHub writes.

K2 remains the sole trusted side-effect execution authority.

The existing Done Gate remains the current `PROVEN_READY` authority.

## Focused acceptance evidence

The final local focused suite proves:

1. deterministic immutable `NEW` finding creation from caller-supplied evaluated head;
2. provider cannot inject current-head, lifecycle, or adjudicator authority;
3. malformed/uppercase Git identities fail closed;
4. path/range/text/evidence bounds fail closed;
5. historical finding semantic substitution is detected;
6. reconstructed findings cannot exercise adjudication authority;
7. old-head findings are `STALE`, not `REJECTED`, and cannot be adjudicated;
8. `CONFIRM` / `REJECT` use the runtime-configured Kodac adjudicator;
9. runtime-owned state prevents adjudication forks from one finding;
10. duplicate decisions require another finding identity and reject self-reference;
11. `FIXED` requires runtime-owned `CONFIRMED` state plus correction evidence;
12. `REVERIFIED` requires runtime-owned `FIXED` state plus reverification evidence;
13. structurally valid external adjudications cannot alter runtime-owned lifecycle state;
14. foreign-runtime findings cannot exercise this runtime's authority;
15. invalid transitions fail after runtime state advances;
16. adjudication fingerprint mutation is detected while explicitly not being treated as authentication;
17. hostile reviewer content remains inert;
18. schemas separate initial finding state from adjudication lifecycle;
19. KRI-R1 canonical corpus identity remains unchanged;
20. runtime source introduces no network/process/filesystem-write/ExecutionGateway surface.

Focused validation before this correction commit:

```text
20 tests
20 passed
0 failed
```

All CI/review results on earlier KRI-R2 heads are stale after this correction. Full exact-head repository CI, cross-platform runtime/typecheck/tests, cumulative review, ruleset verification, and unresolved-thread verification are required again before merge.

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

These describe the present implementation boundary, not the founder's ability to authorize later slices.