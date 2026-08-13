# Kodac KDO-C6 — Continue Model Contract Port Evidence

## Record identity

```text
Gate: KDO-C6
Authorization merge: 0d4a44eedecac32dd05f083beb9ee016e8630229
Implementation PR: #30
Donor: continuedev/continue
Donor commit: 5522c6f44ca0ac3528b37244818fbfa39b5af470
Studied source: core/config/types.ts
Studied blob: 2500042e88706adfc09fdfc40cec33248ab7dae5
Intake mode: PORT
```

## Implemented scope

Exactly four authorized paths are used by the final slice:

```text
packages/kodac-runtime/src/model/capabilities.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/model-capabilities.test.ts
docs/planning/KODAC_KDO_C6_CONTINUE_MODEL_CONTRACT_PORT_EVIDENCE_2026-08-13.md
```

No existing model transport/provider source file is modified.

## Donor-derived capability model

The pinned Continue `ILLM` design exposed a useful broad capability surface including completion, streaming completion, fill-in-the-middle, chat, embeddings, reranking, token counting, model listing and capability predicates.

KDO-C6 ports that architectural idea into a Kodac-native pure capability contract.

Canonical capability vocabulary:

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

Kodac's implementation adds its own deterministic profile/provenance semantics and deliberately excludes Continue provider transports, ambient API-key/API-base fields, fetch authority and provider discovery execution.

## Capability profile semantics

A profile binds:

```text
contract version
provider identity
model identity
canonical capability set
optional context-window limit
optional max-output limit
profile-source class
profile-source structural identity
profile structural identity
```

The profile hash is a structural integrity fingerprint only. It is not provider authentication or evidence that advertised capabilities are truthful.

## Pure negotiation behavior

KDO-C6 implements:

- canonical capability ordering;
- duplicate/unknown capability rejection;
- strict unknown-field rejection;
- deterministic profile identities;
- deterministic required-capability checks;
- deterministic missing-capability reporting;
- deterministic profile selection ordered by provider/model/profile identity;
- bounded positive integer token-limit validation;
- `maxOutputTokens <= contextWindowTokens` when both are present.

No negotiation helper executes a model/provider.

## Existing model-plane preservation

Regression tests pin these pre-C6 canonical Git text blobs:

```text
packages/kodac-runtime/src/model/provider.ts
  a15f1d86ceab88ab6fa1be787719d222e354e0c4

packages/kodac-runtime/src/model/openai.ts
  564851b2dc8cd1aa610fbc7eaa4b5be5853f97f4

packages/kodac-runtime/src/model/openai-compatible.ts
  7ed56c7bac8e03d315b465e1f173ad934227051f

packages/kodac-runtime/src/model/turn.ts
  628334fb4edb7b3e4bcfcb090b8e709835096b3b
```

The immutable-source test canonicalizes CRLF working-tree representation to LF before calculating Git text-blob identity so the proof is portable across Windows/macOS/Linux checkout representations.

## Production source purity

`packages/kodac-runtime/src/model/capabilities.ts` imports only:

```text
node:crypto
```

The regression surface rejects executable use/import patterns for:

```text
fetch(...)
XMLHttpRequest / WebSocket construction
node:child_process imports
ExecutionGateway references
apiKey/apiBase configuration fields
filesystem write calls
```

This is a source-surface regression, not a claim that arbitrary future TypeScript syntax can be security-proven by regex alone. Full repository review and exact path controls remain required.

## CI chronology

### Initial candidate

```text
head:
14de361aac3457e35a31ee2ba910fb4f37d84d82
```

TypeScript typecheck succeeded, but Ubuntu runtime tests failed. The failure was preserved rather than treated as passing evidence.

The failing test attempted to prove that `capabilities.ts` contained no ambient network/credential authority by searching the entire source text for words such as `fetch`. The provenance comment intentionally documented that `fetch` authority was *not* imported, causing a false-positive test failure.

This was a test-guard defect, not a production capability-runtime failure.

### Guard correction

```text
correction head:
a6d96f78b7bb6cdabedcdc0cc49d3d3c6815d0d3
```

The test was tightened to detect executable/code-shaped authority surfaces instead of provenance words, including `fetch(`, network-object construction, `node:child_process` imports, API credential/base assignments, ExecutionGateway references and filesystem-write calls.

No production source changed in this correction.

Exact-head K2 evidence on `a6d96f78b7bb6cdabedcdc0cc49d3d3c6815d0d3`:

```text
runtime-change-classifier: SUCCESS

Ubuntu:
  typecheck: SUCCESS
  tests: SUCCESS
  patch benchmark hook: SUCCESS

macOS:
  typecheck: SUCCESS
  tests: SUCCESS
  patch benchmark hook: SUCCESS

Windows:
  typecheck: SUCCESS
  tests: SUCCESS
  patch benchmark hook: SUCCESS

k2-runtime-gate: SUCCESS
```

Governance/K3 workflows for the same candidate are separately required to remain green before merge.

Adding this evidence ledger moves the PR head. Therefore all checks on `a6d96f78...` become historical evidence and **final merge certification must be rerun on the ledger-bearing exact head**.

## Explicit limitations

KDO-C6 does not:

- authenticate `providerId` or `modelId`;
- discover model capabilities from a live provider;
- execute chat/completion/FIM/embed/rerank/token counting/model listing;
- call provider networks;
- use credentials;
- modify OpenAI/OpenAI-compatible provider transports;
- choose a model based on cost/quality benchmarks;
- persist capability profiles;
- grant any provider side-effect authority.

A future model discovery/transport gate must bind observed capabilities to trusted execution evidence before `profileSource = observed` can carry more than caller-supplied structural meaning.

## Authority truth

```text
MODEL CAPABILITY PROFILE != PROVIDER AUTHENTICATION
MODEL CAPABILITY PROFILE != NETWORK AUTHORITY
MODEL CAPABILITY PROFILE != EXECUTION AUTHORITY
MODEL CAPABILITY PROFILE != REVIEWER AUTHORITY
MODEL CAPABILITY PROFILE != PROVEN_READY
```

K2 remains the sole trusted side-effect execution authority.
KRI authority is unchanged.
The Done Gate remains the sole current `PROVEN_READY` authority.

## Final merge gate

The final exact head may merge only after proving:

- cumulative diff = exactly four authorized paths;
- donor provenance constants remain exact;
- existing model provider/transports remain unchanged;
- production capability source remains pure;
- no package/lockfile/dependency change;
- governance green;
- K3 gates green where triggered;
- Ubuntu/macOS/Windows typecheck/tests/patch hook green;
- `k2-runtime-gate` green;
- no unresolved valid review finding;
- main protection active/no bypass;
- expected-head merge protection.
