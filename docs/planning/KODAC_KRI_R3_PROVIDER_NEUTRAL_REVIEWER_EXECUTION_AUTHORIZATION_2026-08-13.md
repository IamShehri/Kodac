# Kodac KRI-R3 Provider-Neutral Reviewer Execution Authorization

## Record identity

```text
Gate: KRI-R3
Name: Provider-Neutral Reviewer Execution Boundary
Date: 2026-08-13
Canonical authorization base: 6c1bf238e151f396191336f3a9902f21770bddf7
Canonical authorization base tree: 75b9bfde6749306419f0483d91d6cac68ce50008
Parent authorities: KRI-P0 + KRI-R1 + KRI-R2
Authority class: DOCUMENTATION / AUTHORIZATION
Implementation authority after canonical adoption: BOUNDED KRI-R3 REVIEWER EXECUTION SLICE ONLY
```

## Purpose

Authorize the first runtime that actually executes a reviewer provider through a Kodac-owned, provider-neutral interface and converts the provider's untrusted output into KRI-R2 `ReviewClaim` / `FindingRecord` evidence.

KRI-R3 is the bridge between the canonical K3 context engine and canonical KRI-R2 finding/adjudication runtime.

Core invariants:

```text
REVIEWER OUTPUT IS A CLAIM, NOT COMPLETION TRUTH.
THE PROVIDER DOES NOT DEFINE REVIEW IDENTITY OR REVISION TRUTH.
KODAC BINDS POLICY, BASE, HEAD, CONTEXT, AND REVIEW-RUN IDENTITY.
HEAD MOVEMENT DURING REVIEW INVALIDATES CURRENT-HEAD AUTHORITY.
KRI-R3 DOES NOT GAIN REPOSITORY-WRITE, MERGE, OR PROVEN_READY AUTHORITY.
```

## Canonical prerequisites

```text
KRI-P0: CANONICAL
KRI-R1 GOLD REVIEWER-EVIDENCE CORPUS: CANONICAL
KRI-R2 FINDING/ADJUDICATION CONTRACTS: CANONICAL
KRI-R2 BOUNDED REVIEWER RUNTIME: CANONICAL
K3-R5 CONTEXT ENGINE: CANONICAL
```

KRI-R3 must consume these contracts without silently changing their authority model.

## Authorized runtime shape

KRI-R3 may define and implement:

- a provider-neutral `ReviewerProvider` interface;
- a bounded immutable request sent to that provider;
- a strict untrusted provider-output contract;
- a `ReviewerExecutionRuntime` that orchestrates one review run;
- deterministic review-run structural identities;
- exact-head checks before and after the provider call through a trusted caller-supplied read-only head supplier;
- a machine-readable review-run schema;
- conversion of accepted provider claims into canonical KRI-R2 `ReviewClaim` values;
- creation of KRI-R2 `FindingRecord` objects through an injected canonical `ReviewerIntelligenceRuntime`;
- explicit completed, stale, provider-failed, timeout, and invalid-output outcomes;
- bounded tests and an evidence ledger.

## Provider authority boundary

The provider may return only claim content such as:

- claim key;
- affected path/range;
- summary;
- contract/invariant claim;
- category;
- severity;
- confidence;
- references to K3 context item identities.

The provider must not be allowed to supply or override:

```text
reviewRunId
reviewerId
reviewerVersion
policyIdentity
canonicalBase
reviewedHead
evaluated/current head
findingIdentity
finding freshness
finding lifecycle state
adjudicatorId
adjudication decision
PROVEN_READY
```

Those fields are Kodac-owned or belong to later authority layers.

## Context boundary

KRI-R3 may consume a canonical K3-R5 `ContextBundle` as untrusted evidence data.

The runtime must validate the security-relevant bundle shape and bounds before provider execution. It must recompute deterministic structural identity where the K3 contract exposes enough information to do so and must verify canonical provenance aggregation.

A deterministic context hash is structural integrity evidence, not authentication or execution authority.

Provider evidence references must resolve to context item identities actually present in the supplied bundle. At least one referenced context item must support the claim's affected path.

## Exact-revision execution

The runtime must use a trusted read-only current-head supplier injected by Kodac.

Required sequence:

1. validate the requested canonical base and reviewed head;
2. read current head immediately before provider execution;
3. fail closed if the pre-execution current head does not equal the requested reviewed head;
4. execute the provider with a bounded immutable request;
5. read current head again after provider execution;
6. bind normalized claims to the originally reviewed head;
7. evaluate findings through KRI-R2 using the post-execution head;
8. if the head moved, resulting findings must be `STALE`, never silently treated as current.

A provider cannot report that a head remained current; Kodac derives that fact.

## Review-run identity

KRI-R3 may define a deterministic SHA-256 structural fingerprint for each review run.

The identity must bind at least:

- KRI-R3 contract version;
- provider identity and version configured by Kodac;
- policy identity;
- canonical base;
- reviewed head;
- K3 context-bundle identity;
- task identity;
- bounded review instructions identity/content;
- normalized provider outcome;
- normalized accepted claims or failure code.

This fingerprint is an integrity identity only. It is not a signature, capability, or proof that the provider is trustworthy.

## Boundedness requirements

The first implementation must be explicitly bounded, including at minimum:

- provider id/version and policy strings;
- review instructions;
- context item count and bytes;
- provider claim count;
- claim strings/ranges;
- evidence item references;
- provider execution timeout;
- normalized output retained in memory.

The first slice may choose stricter limits than K3-R5.

## Provider failure behavior

Provider exceptions, timeouts, invalid output, excess claims, fabricated context references, or authority-field injection must fail closed.

They must not generate confirmed findings and must not be translated into `REJECTED`, `FIXED`, `REVERIFIED`, merge approval, or `PROVEN_READY`.

A failed provider call is reviewer-execution evidence, not repository truth.

## Deliberately excluded from KRI-R3

Even with founder authorization, this slice does not authorize a concrete external service adapter.

Outside this slice:

- OpenAI/Anthropic/Cubic/CodeRabbit/Qodo or other concrete provider HTTP adapters;
- API-key or secret handling;
- direct network clients in the KRI-R3 core runtime;
- subprocess/provider CLI execution;
- persistent review storage;
- persistent reviewer learning;
- embeddings/vector infrastructure;
- repository mutation;
- autofix execution;
- GitHub comments/reviews/approvals;
- merge execution by KRI;
- ruleset/protection changes;
- K2 execution-authority expansion;
- K5 Proof Review & Judge implementation;
- `PROVEN_READY` decisions.

A concrete provider adapter requires a later separately-scoped gate because adapter side effects, credentials, transport, retries, privacy, and provider-specific trust require their own evidence.

## Authorized implementation paths

After canonical adoption, KRI-R3 implementation is limited to exactly:

```text
schema/kri-review-run.schema.json
packages/kodac-runtime/src/reviewer-intelligence/provider-contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/executor.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r3-reviewer-executor.test.ts
docs/planning/KODAC_KRI_R3_PROVIDER_NEUTRAL_REVIEWER_EXECUTION_EVIDENCE_2026-08-13.md
```

No KRI-R2 contract/runtime path may be modified by KRI-R3 without a separate scope extension.

No manifest, lockfile, dependency, workflow, ExecutionGateway, Done Gate, governance protection, or provider-specific adapter path is authorized.

## Required tests

The implementation candidate must prove at least:

1. provider cannot inject review identity, revision identity, adjudicator identity, lifecycle state, or completion truth;
2. exact pre-provider head mismatch fails before provider execution;
3. head movement during provider execution yields stale KRI-R2 findings;
4. a stable exact head yields current `NEW` KRI-R2 findings;
5. provider output is strict and unknown properties fail closed;
6. provider claim/string/range/count bounds fail closed;
7. fabricated or missing context-item evidence references fail closed;
8. at least one referenced context item supports the affected path;
9. context-bundle structural substitution is rejected where detectable by canonical identity recomputation;
10. context provenance aggregation mismatch fails closed;
11. provider exception returns a provider-failed run with zero findings;
12. provider timeout returns a timeout run with zero findings;
13. invalid provider output returns an invalid-output run with zero findings;
14. zero-finding valid reviews are representable;
15. claim order and evidence-item order canonicalize deterministically;
16. review-run identity recomputation detects semantic mutation;
17. repeated identical input/output produces identical structural run identity;
18. hostile repository/provider text remains inert data;
19. KRI-R3 core imports no network, child-process, filesystem-write, ExecutionGateway, or provider SDK surface;
20. KRI-R2 lifecycle/adjudication authority remains unchanged;
21. full runtime typecheck/tests remain green across supported CI platforms.

## Authority boundary after KRI-R3

```text
KRI-R3 PROVIDER-NEUTRAL REVIEW EXECUTION: AUTHORIZED
CONCRETE PROVIDER NETWORK/CLI ADAPTER: NOT AUTHORIZED IN THIS SLICE
KRI PERSISTENCE / LEARNING: NOT AUTHORIZED IN THIS SLICE
KRI AUTOFIX / REPOSITORY WRITE: NOT AUTHORIZED IN THIS SLICE
KRI GITHUB REVIEW / APPROVAL / MERGE: NOT AUTHORIZED IN THIS SLICE
K5 IMPLEMENTATION: NOT AUTHORIZED IN THIS SLICE
PROVEN_READY AUTHORITY FROM KRI: NOT AUTHORIZED
```

K2 remains the sole trusted side-effect execution authority. The existing Done Gate remains the sole current `PROVEN_READY` authority.

## Merge gate

This authorization record may be merged only after exact-head verification confirms:

- live canonical main remains the expected base or the PR remains a clean descendant with no hidden scope expansion;
- this PR changes only this authorization document;
- KRI-R2 remains canonical;
- the six-path implementation allowlist above is exact;
- concrete provider adapters and network/secret handling remain excluded;
- no write/approval/merge/K5/`PROVEN_READY` authority is granted;
- required checks are green;
- protection remains active;
- unresolved review threads are zero.

Canonical adoption authorizes only the bounded implementation slice above.