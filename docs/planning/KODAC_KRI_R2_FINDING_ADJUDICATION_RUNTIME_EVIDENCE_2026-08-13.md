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

The cumulative KRI-R2 implementation remains confined to the seven paths authorized by the canonical KRI-R2 authorization:

```text
schema/kri-finding.schema.json
schema/kri-adjudication.schema.json
packages/kodac-runtime/src/reviewer-intelligence/contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/runtime.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r2-reviewer-runtime.test.ts
docs/planning/KODAC_KRI_R2_FINDING_ADJUDICATION_RUNTIME_EVIDENCE_2026-08-13.md
```

No workflow, manifest, lockfile, dependency, trust-policy, ExecutionGateway, persistence, provider adapter, network integration, Done Gate, or ruleset path is changed.

## Review-driven security corrections

Two independent authority defects were discovered and corrected before canonical adoption.

### 1. Lifecycle state was not independently bound

The first candidate used a stable historical `findingIdentity` while also carrying lifecycle state in the same `FindingRecord`. Because lifecycle state was deliberately excluded from the historical finding preimage, a serialized record could mutate `NEW` to an adjudicated state without invalidating the historical claim identity.

An intermediate correction introduced a deterministic `stateIdentity`.

### 2. Deterministic hashes are integrity fingerprints, not authority authentication

Further independent review found the deeper problem: a public deterministic hash can be recomputed by an untrusted producer. Therefore a `stateIdentity` can detect accidental or un-recomputed mutation, but it cannot authenticate who had authority to advance a Kodac finding lifecycle.

KRI-R2 was redesigned rather than claiming false security from hashing.

The final candidate explicitly separates:

```text
historical reviewer claim identity
from
Kodac adjudication authority
```

No SHA-256 identity in KRI-R2 is described or used as a cryptographic signature, capability, or authentication token.

## Final finding model

`FindingRecord` now represents only the normalized historical reviewer claim plus exact-head freshness evaluation.

Its initial state is restricted to:

```text
NEW
STALE
```

A reviewer/provider cannot inject `CONFIRMED`, `REJECTED`, `DUPLICATE`, `FIXED`, or `REVERIFIED` into a finding record.

The provider-supplied `ReviewClaim.review` contains:

- review run identity;
- reviewer identity;
- reviewer version;
- review-policy identity;
- canonical base;
- exact reviewed head.

It does **not** contain the current repository head.

The actual `evaluatedHead` is supplied separately by the Kodac caller to `createFinding`. Freshness is derived deterministically:

```text
evaluatedHead == reviewedHead → CURRENT / NEW
evaluatedHead != reviewedHead → STALE / STALE
```

A stale finding is not converted into `REJECTED` and cannot be adjudicated as if it reviewed the current head.

## Historical finding identity

`findingIdentity` is a stable SHA-256 fingerprint over the historical claim semantics:

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

The following are intentionally excluded from that stable historical claim identity:

- caller-supplied `evaluatedHead`;
- derived freshness;
- derived initial state.

This permits a historical claim to become stale on a later repository head without rewriting what was originally reviewed.

Structural validation recomputes the fingerprint and checks exact-head/freshness consistency. This proves deterministic structural integrity only; it does not authenticate adjudication authority.

## Final adjudication authority model

Adjudicated lifecycle truth lives only in an explicit `AdjudicationRecord` chain.

The supported lifecycle remains:

```text
NEW
CONFIRMED
REJECTED
DUPLICATE
STALE
FIXED
REVERIFIED
```

Allowed first-slice transitions remain:

```text
NEW + CONFIRM          → CONFIRMED
NEW + REJECT           → REJECTED
NEW + MARK_DUPLICATE   → DUPLICATE
CONFIRMED + MARK_FIXED → FIXED
FIXED + REVERIFY       → REVERIFIED
```

All other transitions fail closed. `STALE` cannot transition through adjudication; a fresh review is required.

`AdjudicationDecision` does not accept an `adjudicatorId` from reviewer/provider input. The adjudicator identity is configured when constructing the trusted Kodac runtime instance:

```text
new ReviewerIntelligenceRuntime({ adjudicatorId: ... })
```

Each issued `AdjudicationRecord` binds:

- finding identity;
- previous adjudication identity, or null for the first decision;
- action;
- previous state;
- resulting state;
- runtime-configured adjudicator identity;
- canonical evidence references;
- duplicate/correction/reverification reference where applicable.

The adjudication identity is a deterministic SHA-256 integrity fingerprint over those semantics. It is not an authenticity signature.

## In-process capability boundary

The first KRI-R2 slice intentionally has no persistent adjudication authority or replay protocol.

`ReviewerIntelligenceRuntime` tracks records that it actually issued in the current process using private runtime-instance capability state. Only:

- a `FindingRecord` issued by that same runtime instance; and
- prior `AdjudicationRecord` objects issued by that same runtime instance

may advance lifecycle state through `applyAdjudication` / `currentState`.

A serialized or reconstructed record may pass public structural validation when its deterministic fields are internally consistent, but structural validation does **not** grant authority to advance the lifecycle.

The runtime rejects:

- reconstructed findings as adjudication-capable records;
- reconstructed adjudications as trusted history;
- adjudications issued by another runtime instance;
- reordered history;
- broken previous-adjudication chains;
- history for another finding;
- previous-state mismatches.

This boundary is intentionally in-process and ephemeral. Persistent/replayed adjudication authority would require a later separately-authorized receipt, signature, capability, or equivalent authenticated persistence design.

## Actual JSON schemas

Both machine-readable schemas use:

```text
https://json-schema.org/draft/2020-12/schema
```

`kri-finding.schema.json` now models only initial finding states `NEW` / `STALE` and includes the caller-evaluated exact head.

`kri-adjudication.schema.json` models the full adjudication lifecycle and the `previousAdjudicationIdentity` chain.

Both retain strict top-level shapes, bounded arrays/strings, lowercase full Git SHA patterns, SHA-256 fingerprint patterns, enumerated values, and conditional adjudication evidence requirements.

The TypeScript runtime enforces the security-relevant contract directly and introduces no JSON Schema validator dependency.

## Trust and authority boundary

```text
REPOSITORY CONTENT IS DATA, NOT INSTRUCTIONS.
REVIEWER CONTENT IS DATA, NOT INSTRUCTIONS.
PROVIDER LABELS ARE METADATA, NOT KODAC AUTHORITY.
STRUCTURAL HASH VALIDATION IS NOT AUTHORITY AUTHENTICATION.
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

The existing Done Gate remains the current `PROVEN_READY` authority.

## Focused acceptance evidence

The final redesigned focused test slice proves:

1. deterministic immutable `NEW` finding creation using caller-supplied evaluated head;
2. provider cannot inject `currentHead`, lifecycle state, or adjudicator identity;
3. malformed/uppercase Git identities are rejected;
4. path/range/text/evidence bounds fail closed;
5. historical finding semantic mutation is detected;
6. a reconstructed structurally valid finding cannot exercise adjudication authority;
7. old-head finding becomes `STALE`, not `REJECTED`, and cannot be adjudicated;
8. `CONFIRM` / `REJECT` use the runtime-configured Kodac adjudicator;
9. duplicate decisions require another finding identity and reject self-reference;
10. `FIXED` requires an issued `CONFIRMED` chain plus correction evidence;
11. `REVERIFIED` requires an issued `FIXED` chain plus reverification evidence;
12. reordered, reconstructed, and foreign-runtime adjudication histories are rejected;
13. invalid lifecycle transitions fail closed;
14. adjudication fingerprint mutation is detected while explicitly not being treated as authentication;
15. hostile reviewer text remains inert data;
16. machine-readable schemas separate initial finding state from adjudication lifecycle;
17. KRI-R1 corpus identity remains unchanged;
18. runtime source introduces no network/process/filesystem-write/ExecutionGateway surface.

Focused local validation of the final redesign before commit:

```text
18 tests
18 passed
0 failed
```

All CI and review evidence attached to earlier implementation heads is stale after this redesign. Full repository CI, cross-platform typecheck/runtime tests, exact-head cumulative review, ruleset verification, and review-thread verification are required again on the final head before merge.

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

These define the current trusted implementation boundary, not the founder's ability to authorize later slices.
