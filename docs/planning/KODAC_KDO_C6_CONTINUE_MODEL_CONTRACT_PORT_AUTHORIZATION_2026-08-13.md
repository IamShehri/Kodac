# Kodac KDO-C6 — Continue Model Contract Port Authorization

## Record identity

```text
Gate: KDO-C6
Name: Continue Model Capability Contract Port
Date: 2026-08-13
Canonical base: d050768d8f5045b40f032ed0fa964eeedbebf385
Donor program authority: 184e29af503e70bba3fac90c8165d3facd698819
First-wave audit: CANONICAL
Authority class: COMPONENT PORT AUTHORIZATION
```

## Donor source pin

```text
Repository: continuedev/continue
Pinned commit: 5522c6f44ca0ac3528b37244818fbfa39b5af470
Repository license observed: Apache-2.0
Primary studied source: core/config/types.ts
Primary studied blob: 2500042e88706adfc09fdfc40cec33248ab7dae5
Supporting studied source: core/llm/countTokens.ts
Supporting studied blob: b742d70b0f0493dca855ab3967e6f40a651a645e
```

Continue's pinned `ILLM` surface informed this component because it explicitly represents completion, streaming completion, fill-in-the-middle, chat, embeddings, reranking, token counting, model listing, and capability predicates.

KDO-C6 authorizes a **Kodac-native port of those capability ideas**, not a verbatim wholesale copy of Continue's model/provider implementation.

## Purpose

Kodac's existing `ModelProvider` contract is intentionally narrow and transport-oriented around `generate()`. KDO-C6 adds a separate pure capability-description layer so callers can answer questions such as:

```text
Does this configured model support chat?
Does it support completion?
Does it support fill-in-the-middle?
Can it accept image input?
Can it issue tool calls?
Can it embed?
Can it rerank?
Can it count tokens locally/through its provider contract?
Can it list models?
Does it support streaming or prefill?
What context/output limits are advertised?
```

Capability description must not itself execute a provider.

## Critical authority boundary

Continue's broad source types include provider-adjacent values such as API keys, API bases and fetch-capable extras. Those authority-bearing patterns are **not** admitted into KDO-C6.

```text
MODEL CAPABILITY DESCRIPTION != NETWORK AUTHORITY
MODEL CAPABILITY DESCRIPTION != CREDENTIAL AUTHORITY
MODEL CAPABILITY DESCRIPTION != PROVIDER DISCOVERY AUTHORITY
MODEL CAPABILITY DESCRIPTION != EXECUTION AUTHORITY
```

KDO-C6 does not authorize:

- HTTP/fetch clients;
- API keys/secrets;
- endpoint configuration;
- provider autodetection execution;
- model-list network calls;
- embeddings/reranking execution;
- FIM execution;
- changes to OpenAI/OpenAI-compatible transport implementations;
- changes to `ModelProvider.generate()` semantics;
- package/lockfile dependency changes.

Future transport/execution slices must be separately authorized.

## Authorized implementation

KDO-C6 may implement:

- a canonical capability-name union/registry;
- an immutable `ModelCapabilityProfile`;
- bounded context/output limit metadata;
- deterministic structural capability-profile identity;
- canonical capability ordering;
- strict validation and unknown-field rejection;
- pure required-capability checks;
- deterministic capability negotiation helpers;
- provenance constants binding the design donor to the pinned Continue source;
- public export from the runtime index;
- regression tests;
- an evidence ledger.

## Required capabilities represented by the first version

At minimum:

```text
chat
completion
streaming
fill_in_middle
prefill
image_input
tool_calling
embedding
reranking
token_counting
model_listing
```

The contract may represent additional carefully justified pure capability flags but may not silently add execution authority.

## Required profile semantics

A profile must bind at least:

```text
contractVersion
providerId
modelId
capabilities
contextWindowTokens
maxOutputTokens
source / provenance identity
```

Optional limits must be explicit; unknown/unavailable values must not be invented.

Identity-bearing fields must be canonicalized and hashed deterministically. Hashes are structural integrity fingerprints only, not authentication or proof of provider truth.

## Compatibility with existing Kodac model plane

The slice must preserve current canonical behavior in:

```text
packages/kodac-runtime/src/model/provider.ts
packages/kodac-runtime/src/model/openai.ts
packages/kodac-runtime/src/model/openai-compatible.ts
packages/kodac-runtime/src/model/turn.ts
```

KDO-C6 should be additive. The existing provider/transport classes do not have to implement the new profile interface in this slice.

## Exact implementation allowlist

After this authorization becomes canonical, KDO-C6 production implementation is limited to exactly:

```text
packages/kodac-runtime/src/model/capabilities.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/model-capabilities.test.ts
docs/planning/KODAC_KDO_C6_CONTINUE_MODEL_CONTRACT_PORT_EVIDENCE_2026-08-13.md
```

No other path is authorized.

## Required tests

The component must prove at least:

1. deterministic canonical capability ordering;
2. deterministic profile identity for semantically identical input orderings;
3. identity changes on provider/model/capability/limit/provenance mutation;
4. duplicate capabilities fail closed rather than silently hiding malformed input;
5. unknown capabilities fail closed;
6. unknown fields fail closed;
7. empty provider/model identifiers fail closed;
8. malformed provenance identity fails closed;
9. non-integer/negative/unsafe numeric limits fail closed;
10. `maxOutputTokens` cannot exceed `contextWindowTokens` when both exist;
11. required-capability success is deterministic;
12. missing required capabilities are reported deterministically;
13. capability negotiation never invokes provider/network/process/filesystem code;
14. donor provenance constants match the pinned Continue repository/commit/path/blob;
15. production `capabilities.ts` import surface remains pure (`node:crypto` only, if hashing is implemented);
16. current model provider source blobs remain unchanged;
17. full runtime typecheck/tests remain green on supported CI platforms.

## Attribution/provenance posture

This slice is a **port/adaptation** informed by Continue's capability abstraction. It must retain a clear provenance comment/constant to the pinned donor source and must not imply that Kodac's implementation is an official Continue component or current Continue product implementation.

## Explicit non-grants

```text
CONTINUE WHOLE-REPOSITORY IMPORT: NOT AUTHORIZED
CONTINUE PROVIDER HTTP CLIENT IMPORT: NOT AUTHORIZED
CONTINUE API KEY / SECRET HANDLING: NOT AUTHORIZED
CONTINUE FETCH AUTHORITY: NOT AUTHORIZED
CONTINUE MODEL AUTODETECTION EXECUTION: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
PACKAGE / LOCKFILE CHANGE: NOT AUTHORIZED
K2 AUTHORITY CHANGE: NOT AUTHORIZED
KRI AUTHORITY CHANGE: NOT AUTHORIZED
DONE GATE CHANGE: NOT AUTHORIZED
PROVEN_READY AUTHORITY: NOT AUTHORIZED
AUTO-MERGE: NOT AUTHORIZED
```

## Merge gate

This authorization record may merge only after exact-head verification confirms:

- exactly one documentation path changed;
- live main remains the expected canonical base or no hidden scope expansion occurred;
- donor source pin/path/blob are exact;
- implementation allowlist is exact;
- provider/network/secrets execution remains excluded;
- required CI is green;
- main protection is active/no bypass;
- unresolved valid review threads are zero.

Canonical adoption authorizes only the four-path bounded KDO-C6 implementation above.
