# Kodac KRI-R3 Provider-Neutral Reviewer Execution Evidence

## Record identity

```text
Gate: KRI-R3
Name: Provider-Neutral Reviewer Execution Boundary
Date: 2026-08-13
Repository: TheHalfMoon/Kodac
Canonical implementation base: 63b39e32266eb85ee05d73ea0ebe1ba6a2ab39a2
Authorization source: docs/planning/KODAC_KRI_R3_PROVIDER_NEUTRAL_REVIEWER_EXECUTION_AUTHORIZATION_2026-08-13.md
Implementation class: BOUNDED PROVIDER-NEUTRAL REVIEWER EXECUTION CORE
```

## Candidate decision

```text
KRI-R3 PROVIDER CONTRACT: IMPLEMENTED IN CANDIDATE
KRI-R3 REVIEW-RUN SCHEMA: IMPLEMENTED IN CANDIDATE
KRI-R3 REVIEWER EXECUTOR: IMPLEMENTED IN CANDIDATE
KRI-R2 HANDOFF: IMPLEMENTED IN CANDIDATE
CONCRETE EXTERNAL PROVIDER ADAPTER: NOT IMPLEMENTED BY THIS SLICE
CANONICAL STATUS: NOT CANONICAL UNTIL MERGE
```

## Exact authorized cumulative scope

The implementation is confined to the six paths authorized by canonical KRI-R3:

```text
schema/kri-review-run.schema.json
packages/kodac-runtime/src/reviewer-intelligence/provider-contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/executor.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r3-reviewer-executor.test.ts
docs/planning/KODAC_KRI_R3_PROVIDER_NEUTRAL_REVIEWER_EXECUTION_EVIDENCE_2026-08-13.md
```

Before this evidence record was added, the implementation candidate was exactly 11 commits ahead, 0 behind the canonical authorization merge and changed only the first five paths above.

No KRI-R2 runtime or contract path, package manifest, lockfile, dependency, workflow, ExecutionGateway, Done Gate, provider SDK, concrete network adapter, persistence layer, governance protection, or ruleset path is changed.

## Core authority invariant

```text
REVIEWER OUTPUT IS A CLAIM, NOT COMPLETION TRUTH.
THE PROVIDER DOES NOT DEFINE REVIEW IDENTITY OR REVISION TRUTH.
KODAC BINDS PROVIDER ATTRIBUTION, POLICY, BASE, HEAD, CONTEXT, AND RUN IDENTITY.
HEAD MOVEMENT DURING REVIEW INVALIDATES CURRENT-HEAD AUTHORITY.
KRI-R3 CANNOT ADJUDICATE, WRITE, MERGE, OR PRODUCE PROVEN_READY.
```

K2 remains the sole trusted side-effect execution authority.
The canonical Done Gate remains the sole current `PROVEN_READY` authority.
KRI-R2 remains the explicit finding/adjudication authority boundary.

## Provider-neutral contract

KRI-R3 defines a provider interface rather than a concrete transport:

```text
ReviewerProvider
  providerId
  providerVersion
  review(request, AbortSignal) -> Promise<unknown>
```

The provider receives a deep-frozen bounded request containing only:

- KRI-R3 provider-request contract version;
- task identity;
- policy identity;
- canonical base;
- exact reviewed head;
- review instructions;
- K3 context-bundle identity;
- selected K3 context item identities, paths, evidence classes, text, and untrusted-data marker;
- maximum claim count.

The provider request intentionally omits:

```text
reviewRunId
reviewRunIdentity
reviewerId/reviewerVersion authority overrides
evaluated/current head
findingIdentity
finding freshness
finding lifecycle state
adjudicatorId
adjudication decision
merge approval
PROVEN_READY
```

Provider identity/version are captured by Kodac when the runtime is constructed. A provider whose live identity values mutate during a call cannot rewrite the attribution of the active run.

## Untrusted provider output

The only accepted provider-output top-level shape is:

```text
{ claims: [...] }
```

Each claim is strict and bounded and may contain only:

- claim key;
- repository-relative POSIX path;
- optional line range;
- summary;
- contract claim;
- category;
- severity;
- confidence basis points;
- K3 context item identities used as evidence.

Unknown fields fail closed. This prevents a provider from injecting current-head state, run identity, finding identity, adjudication state, adjudicator identity, or completion authority through the output object.

All claims are validated before conversion to KRI-R2 claims.

## K3 ContextBundle validation

KRI-R3 does not accept a `ContextBundle` merely because TypeScript says it has that type. Before provider execution, it validates the security-relevant K3-R5 contract directly.

The validation covers:

- exact K3-R5 version and selection strategy;
- `freshness == current`;
- lower-case full structural identities;
- task identity;
- declared and used item/byte budgets;
- KRI-R3 execution bounds for both declared maxima and actual usage;
- completeness state/reasons/omission-count consistency;
- exact item object shapes;
- unique item identities;
- source kind and evidence class;
- repository-relative subject paths;
- exact UTF-8 byte accounting;
- canonical item ordering;
- canonical provenance ordering;
- top-level provenance equal to the union of selected item provenance;
- untrusted repository-data marker;
- canonical relevance metadata;
- recomputation of the K3-R5 `bundleIdentity` from the canonical identity-bearing payload.

The first R3 slice accepts only evidence classes that canonical K3-R5 can actually emit from admitted R2/R4 evidence:

```text
precise-static
parser-derived
git-derived
heuristic-inference
```

`model-hypothesis` is rejected even if a caller recomputes a self-consistent bundle identity.

A deterministic K3 bundle hash is structural integrity evidence, not proof of provenance authority by itself. R3 assumes its input is supplied through the Kodac/K3 trust boundary; this slice does not introduce a cryptographic signature or cross-process provenance-attestation protocol.

## Claim-to-context binding

Every provider evidence item identity must resolve to an item present in the validated supplied context bundle.

At least one cited context item must have a `subjectPath` exactly equal to the provider claim's affected path.

Therefore a provider cannot support a finding with a fabricated context hash or only with evidence for an unrelated path.

Accepted context item references are converted to KRI-R2 evidence references using the explicit form:

```text
k3-context-item:<sha256-item-identity>
```

## Exact-revision execution

KRI-R3 uses a caller-injected read-only `readCurrentHead` function.

Execution order:

1. validate request and K3 context;
2. read current head immediately before provider execution;
3. fail before calling the provider if the current head is not the requested reviewed head;
4. execute the provider with a bounded frozen request and AbortSignal;
5. read current head after provider completion/failure/timeout;
6. normalize provider output;
7. bind accepted claims to the original reviewed head;
8. create KRI-R2 findings using the post-provider evaluated head.

Outcome truth:

```text
post head == reviewed head -> run COMPLETED; findings CURRENT / NEW
post head != reviewed head -> run STALE; findings STALE / STALE
```

A stale run is not translated into `REJECTED` and cannot silently claim review freshness.

Serialized `ReviewRunRecord` validation independently enforces the runtime-only sibling-field invariant:

```text
COMPLETED -> evaluatedHead == reviewedHead
STALE     -> evaluatedHead != reviewedHead
```

JSON Schema 2020-12 documents this invariant because it cannot compare sibling string values directly.

## Provider failure and timeout behavior

Provider failures do not become findings.

```text
provider exception      -> PROVIDER_FAILED / provider-error / zero findings
provider timeout        -> TIMED_OUT / timeout / zero findings
invalid provider output -> INVALID_PROVIDER_OUTPUT / invalid-output / zero findings
```

Timeout uses an `AbortController` and a bounded `Promise.race`.

A regression provider intentionally ignored abort and rejected after the timeout result had already been produced. The late rejection remained handled by the raced promise and could not revise the returned `TIMED_OUT` result or create findings.

This closes the review concern that a cancellation-ignoring provider might create an unhandled late rejection through this runtime path.

## KRI-R2 handoff

KRI-R3 does not create terminal lifecycle truth.

For every accepted normalized provider claim, Kodac constructs the KRI-R2 `ReviewClaim` identity fields itself:

- deterministic review-run identity;
- captured provider id/version;
- bounded policy identity;
- canonical base;
- original reviewed head.

The resulting `ReviewClaim` is passed into the canonical KRI-R2 `ReviewerIntelligenceRuntime.createFinding` with the post-provider evaluated head.

KRI-R3 therefore produces only KRI-R2 `NEW` or `STALE` findings.

`CONFIRMED`, `REJECTED`, `DUPLICATE`, `FIXED`, and `REVERIFIED` remain explicit KRI-R2 adjudication states and cannot be produced by R3 provider output.

## Review-run structural identity

KRI-R3 emits two deterministic SHA-256 structural identities:

- `reviewRunId`, derived from the normalized review semantics including provider, policy, base/head, context, task, instructions, status/failure, and normalized claims;
- `reviewRunIdentity`, derived from the serialized normalized `ReviewRunRecord` including finding identities.

Identical normalized input/output reproduces identical structural identities. Semantic mutation of an identity-bearing run field causes `validateReviewRunRecord` to reject the record.

These hashes are integrity fingerprints only. They are not signatures, credentials, capabilities, authentication, persistent replay authority, or completion authority.

The serialized `ReviewRunRecord` intentionally does not embed all provider claim bodies, so `validateReviewRunRecord` validates its own record identity rather than reconstructing `reviewRunId` from absent historical claim payload. Durable claim/run attestation is a later persistence/receipt problem and is not claimed by R3.

## Bounds

The core runtime is explicitly bounded:

```text
provider claim hard max: 64
provider claim default max: 32
context item hard max: 256
context item default max: 64
context UTF-8 hard max: 256 KiB
context UTF-8 default max: 64 KiB
provider timeout hard max: 60 seconds
provider timeout default: 30 seconds
policyIdentity: <= 128 UTF-8 bytes, aligned with KRI-R2
claim summary/contract text: <= 4096 UTF-8 bytes each
claim evidence item refs: <= 32
repository path: <= 1024 UTF-8 bytes
line coordinate ceiling: 10,000,000
```

KRI-R3 also rejects a context bundle whose declared maximum item/byte budgets exceed R3 execution bounds, even when its actual current usage is smaller.

## Runtime side-effect surface

The KRI-R3 core executor's static imports are confined to:

```text
node:crypto
../context-engine/contracts.ts
./contracts.ts
./provider-contracts.ts
```

Regression guards reject the introduction of direct:

- child process APIs;
- HTTP/HTTPS/network APIs;
- filesystem APIs;
- `ExecutionGateway`;
- `fetch`;
- CommonJS `require`;
- `eval`.

No concrete provider SDK or transport is imported by KRI-R3.

The injected provider implementation is outside this core's side-effect proof. A concrete provider adapter can perform transport only after a later separately authorized adapter gate establishes credentials, privacy, retry, transport, and provider-specific trust boundaries.

## Review-driven corrections before canonical adoption

The implementation was not treated as complete merely because it compiled or because an external reviewer produced a summary.

### 1. Test fixture typing

The initial test fixture used a readonly tuple where canonical K3 contracts require a mutable relevance-reason array and attempted direct mutation of readonly provider identity properties.

TypeScript CI failed. The fixture was corrected; production semantics were unchanged.

### 2. Context identity test isolation

A semantic-substitution test initially changed item text and item byte count but left bundle budget accounting stale. The validator correctly failed earlier on byte-accounting inconsistency, so the test did not prove the intended identity control.

The fixture was corrected to preserve accounting while retaining the old bundle identity. The test then reached and proved the intended identity mismatch.

### 3. KRI-R2 policy-bound parity

Independent review found R3 initially permitted a longer `policyIdentity` than canonical R2 accepts. The R3 runtime and review-run schema were tightened to the canonical R2 128-byte/character boundary as applicable, with runtime enforcing the stricter UTF-8 byte interpretation.

### 4. Serialized status/head truth

Independent review found that a structurally recomputed serialized run needed an explicit cross-field check preventing `COMPLETED` with a different evaluated head or `STALE` with the same head.

The runtime validator now enforces that invariant directly and the schema documents the non-expressible sibling-string relationship.

### 5. K3-R5 evidence-class parity

The TypeScript evidence-class union contains `model-hypothesis`, but canonical K3-R5 does not emit it from admitted R2/R4 sources. R3 now rejects it even when a caller recomputes a self-consistent structural bundle identity.

### 6. Late provider rejection after timeout

A stale external review raised a plausible concern that a cancellation-ignoring provider could reject after `Promise.race` had already returned a timeout and create an unhandled rejection.

Rather than dismissing the claim, a regression provider was added that rejects after the timeout. The test runner remained clean and the returned result remained `TIMED_OUT` with zero findings.

## Exact-head evidence before this evidence commit

The implementation head immediately before adding this evidence record was:

```text
d5b235bcc438412fd37fae0dd788d4b60b3b3d36
```

Cumulative relation to canonical authorization merge:

```text
ahead: 11
behind: 0
changed paths: exactly 5 implementation paths
```

Exact-head workflow results on that head:

```text
governance: SUCCESS
k3-r4-adapter: SUCCESS
k3-r5-context-engine: SUCCESS
k2-runtime: SUCCESS
```

K2 runtime matrix on the same head:

```text
runtime-change-classifier: SUCCESS
Ubuntu typecheck: SUCCESS
Ubuntu tests: SUCCESS
Ubuntu patch benchmark hook: SUCCESS
macOS typecheck: SUCCESS
macOS tests: SUCCESS
macOS patch benchmark hook: SUCCESS
Windows typecheck: SUCCESS
Windows tests: SUCCESS
Windows patch benchmark hook: SUCCESS
k2-runtime-gate: SUCCESS
```

Ubuntu full runtime test summary:

```text
tests: 220
passed: 219
failed: 0
skipped: 1
```

The KRI-R3 focused portion of that run contained:

```text
28 tests
28 passed
0 failed
```

This evidence record changes the PR head. Therefore every CI/review result listed above becomes historical evidence only and MUST NOT be used as final exact-head merge certification. Full required CI and exact-head review must run again after this evidence commit.

## Known bounded limitations / non-claims

### Injected provider transport

R3 core proves that it contains no provider transport or provider SDK. It does not prove that an arbitrary injected provider implementation is side-effect free. Concrete provider adapters require a later authorization/qualification gate.

### Structural identity is not authentication

A caller that fabricates a fully self-consistent ContextBundle and corresponding hashes has structural consistency, not authenticated canonical provenance. R3 validates the K3 contract it receives; authenticated cross-process source admission remains outside this slice.

### R2 batch creation is not a persistence transaction

R3 validates all provider claims before passing them to R2, reducing partial semantic ingestion. However, R2's in-memory `createFinding` calls are not defined as a transactional multi-finding persistence primitive. If an injected R2 runtime reaches its bounded authority-registry ceiling during sequential creation, an exception can occur after earlier in-memory findings were issued.

R3 does not claim atomic durable batch persistence, rollback, or cross-process replay authority. Solving that requires a separately authorized bulk receipt/persistence transaction boundary rather than silently changing canonical R2 in this slice.

### ReviewRunRecord does not persist full provider claim payload

The run record carries normalized structural identities and accepted finding identities, not a durable copy of every claim body. Durable replay/audit storage is intentionally excluded from KRI-R3.

## Current non-grants

```text
CONCRETE OPENAI / ANTHROPIC / CUBIC / CODERABBIT / QODO REVIEWER ADAPTER: NOT IMPLEMENTED
KRI NETWORK / SECRET HANDLING: NOT IMPLEMENTED
KRI SUBPROCESS REVIEWER EXECUTION: NOT IMPLEMENTED
KRI PERSISTENT REVIEW STORAGE: NOT IMPLEMENTED
KRI PERSISTENT REVIEW LEARNING: NOT IMPLEMENTED
KRI AUTHENTICATED CROSS-PROCESS REPLAY: NOT IMPLEMENTED
KRI AUTOFIX / REPOSITORY WRITE: NOT IMPLEMENTED
KRI GITHUB COMMENT / REVIEW / APPROVAL / MERGE AUTHORITY: NOT IMPLEMENTED
K5 IMPLEMENTATION: NOT AUTHORIZED BY THIS SLICE
PROVEN_READY AUTHORITY FROM KRI: NOT GRANTED
K2 EXECUTION-AUTHORITY EXPANSION: NOT GRANTED
```

## Final merge requirements

After this evidence commit, merge is permitted only if a fresh exact-head cycle proves:

- PR remains based on canonical KRI-R3 authorization main with no hidden divergence;
- cumulative diff is exactly the six authorized paths;
- typecheck/tests pass on Ubuntu, macOS, and Windows;
- governance, provenance/legacy requirements, K3-R4/K3-R5, and K2 runtime gates are green as applicable;
- review threads contain zero unresolved valid findings;
- external review is exact-head or explicitly treated as stale/non-certifying;
- branch protection remains active with no bypass;
- auto-merge remains disabled/null;
- PR head is unchanged at the moment of merge;
- merge uses the repository-authorized merge-commit method.

Until those conditions are freshly satisfied, this document records candidate evidence only and does not claim canonical adoption.