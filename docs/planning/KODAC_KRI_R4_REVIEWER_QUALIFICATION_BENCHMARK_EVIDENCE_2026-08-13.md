# Kodac KRI-R4 Reviewer Qualification & Benchmark Evidence

## Decision scope

```text
Gate: KRI-R4
Capability scope: historical-claim-disposition-v1
Authorization merge: b29a99d7c6743aa0f3ea271b16e59be362fec9a9
Authorization merge tree: 95141d6dadf48ac7af58fc71c8955441bd917584
Implementation PR: #26
Evidence date: 2026-08-13
```

This ledger records implementation evidence for the bounded, pure/in-memory KRI-R4 reviewer qualification engine authorized by the canonical KRI-R4 gate.

It does not authorize a concrete reviewer adapter, provider execution, network or secret handling, persistent benchmark storage, reviewer routing, repository mutation, GitHub approval/merge authority, K5, Done Gate changes, or `PROVEN_READY` authority.

## Authorized implementation surface

The final implementation candidate is restricted to exactly these six paths:

```text
schema/kri-reviewer-qualification.schema.json
packages/kodac-runtime/src/reviewer-intelligence/qualification-contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/qualification.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r4-reviewer-qualification.test.ts
docs/planning/KODAC_KRI_R4_REVIEWER_QUALIFICATION_BENCHMARK_EVIDENCE_2026-08-13.md
```

No canonical KRI-R1 fixture, KRI-R2 source, KRI-R3 source, package manifest, lockfile, workflow, ExecutionGateway, Done Gate, provider adapter, network client, persistent store, or governance-protection path is modified by this slice.

## Implemented contract

KRI-R4 implements:

- `KRI_R4_QUALIFICATION_VERSION = kri-r4-reviewer-qualification-v1`;
- `capabilityScope = historical-claim-disposition-v1`;
- strict candidate identity fields;
- an admitted benchmark projection of `caseIdentity + goldDisposition`;
- a separately bound caller-supplied `sourceCorpusIdentity`;
- normalized observation outcomes:
  - `VALID_ACCEPTED`
  - `INVALID_REJECTED`
  - `ABSTAIN`
  - `PROVIDER_FAILED`
  - `TIMED_OUT`
  - `INVALID_OUTPUT`;
- deterministic qualification-policy, candidate, benchmark-set, and report structural identities;
- deterministic integer/basis-point metrics;
- deterministic nearest-rank latency p50/p95 over supplied latency observations;
- explicitly supplied token and reported-cost counters;
- decisions:
  - `QUALIFIED`
  - `NOT_QUALIFIED`
  - `INSUFFICIENT_EVIDENCE`;
- strict report validation that reconstructs benchmark projection, observations, policy, metrics, decision, reasons, and the complete canonical report rather than trusting supplied metric or decision fields.

The structural SHA-256 identities are integrity fingerprints only. They are not authentication, signatures, credentials, reviewer trust, execution authority, or completion proof.

## Conservative qualification policy

The canonical default policy is:

```text
minimum total gold cases: 20
minimum VALID_ACCEPTED gold cases: 5
minimum INVALID_REJECTED gold cases: 5
minimum exact-disposition accuracy: 9000 bps
minimum accepted-class precision: 9000 bps
minimum accepted-class recall: 8000 bps
minimum rejected-class recall: 9000 bps
minimum decision coverage: 9500 bps
maximum execution-failure rate: 500 bps
```

The runtime rejects a caller-supplied qualification policy that is weaker than this canonical floor.

## KRI-R1 corpus truth

Canonical KRI-R1 v1 remains unchanged.

```text
fixture path:
packages/kodac-runtime/test/fixtures/kri-r1/corpus.json

canonical Git blob:
a308729f00f6c96894d66555127c3dd3ab592d32

published corpus identity:
e3f87d5e008918043da4f10617aa479d0d5e4b9fcde42143bc691763f503c4d4

case count:
4
```

The KRI-R4 regression suite consumes only the case identity/disposition projection for qualification tests and verifies the canonical fixture identity remains unchanged.

A perfect result on these four canonical cases is deliberately:

```text
INSUFFICIENT_EVIDENCE
```

The four historical cases are useful regression evidence but are not an exhaustive code-review task corpus. KRI-R4 therefore does not claim whole-review finding-generation precision, whole-review finding-generation recall, undiscovered-finding false-negative rate, or general production reviewer quality from KRI-R1 v1.

A synthetic balanced corpus of sufficient size is used only to prove the contract can reach `QUALIFIED` when the authorized thresholds are actually satisfied. Synthetic evidence is not production reviewer qualification evidence.

## Regression coverage

The KRI-R4 test surface proves at least:

1. canonical default-policy thresholds;
2. perfect canonical four-case KRI-R1 v1 remains insufficient;
3. one observation is required for every admitted benchmark case;
4. duplicate observations fail closed;
5. missing observations fail closed;
6. foreign case identities fail closed;
7. benchmark/observation ordering does not change deterministic identity;
8. candidate mutation changes structural identities;
9. source-corpus identity is bound separately from the benchmark projection;
10. policy identity is deterministic and threshold mutation changes it;
11. false-accepted and false-rejected counts remain distinct;
12. abstention reduces coverage and cannot become an implicit correct decision;
13. provider failure, timeout, and invalid output remain separate outcomes;
14. zero-denominator class metrics are explicit `null`/unavailable;
15. sufficient balanced perfect synthetic evidence can satisfy the policy contract;
16. sufficient evidence below a threshold yields `NOT_QUALIFIED` with machine-readable reasons;
17. basis-point threshold boundaries are exact;
18. latency percentiles are deterministic;
19. supplied token/cost observations remain measurement fields only;
20. semantic mutation of a serialized report is rejected by recomputation;
21. unsupported capability scope fails closed;
22. injected authority fields such as `PROVEN_READY` or merge approval fail closed;
23. weaker-than-authorized policy input fails closed;
24. NaN, infinity, negative, and non-integer measurement input fails closed;
25. candidate identity helpers are deterministic;
26. the class and functional qualification APIs share the same contract;
27. production qualification source imports only `node:crypto` and the local qualification contract;
28. canonical KRI-R1 fixture bytes/identity remain unchanged;
29. canonical KRI-R2/KRI-R3 source blob identities remain unchanged.

Before GitHub CI, the logic-only test subset that does not depend on repository-file identity checks passed 27/27 under Node's TypeScript type-stripping execution path.

## CI history and Windows portability correction

### Initial implementation candidate

```text
head:
9e0696b8c694b12331baee6daacd8c16774e3836
```

Evidence at that head:

```text
governance: SUCCESS
Ubuntu runtime typecheck/test/patch hook: SUCCESS
macOS runtime typecheck/test/patch hook: SUCCESS
Windows typecheck: SUCCESS
Windows test: FAILURE
k2-runtime-gate: FAILURE
```

The failure was not ignored or represented as passing evidence.

The Windows-only failure came from the test-side immutable-source proof computing a Git blob identity directly from checked-out working-tree bytes. Windows checkout may materialize CRLF working-tree line endings while the canonical Git text blob is LF. The test therefore compared checkout representation rather than canonical committed text identity.

### Portability correction

Correction commit:

```text
9f642a4f32707ed7f70deadd70c18ad83b4b5efe
```

The correction changes only the KRI-R4 test helper. It canonicalizes CRLF to LF before calculating the expected Git text-blob identity. No production qualification contract, metric, decision, authority, or runtime behavior changed.

Exact-head GitHub evidence on `9f642a4f32707ed7f70deadd70c18ad83b4b5efe`:

```text
governance: SUCCESS

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

This evidence is historical evidence for the code candidate before this ledger was added. Adding this ledger changes the implementation head, so final merge certification must be rerun on the final exact head and must not treat `9f642a4...` checks as certification of the ledger-bearing head.

## Fail-closed and integrity boundaries

The pure engine rejects:

- unsupported KRI-R4 report version or capability scope;
- malformed candidate/corpus/policy identities;
- unknown fields;
- duplicate, missing, or foreign benchmark observations;
- observations outside bounded outcome/measurement domains;
- NaN/infinite/negative/non-integer measurements;
- policies weaker than the canonical R4 floor;
- structurally inconsistent serialized metrics, decisions, reasons, benchmark projections, or report identities.

The engine does **not** authenticate the external adapter/reviewer/model identity or the caller-supplied `sourceCorpusIdentity`. A future adapter/attestation gate must prove how those external identities and observations were produced.

Supplied latency, token counts, and reported cost are measurements supplied to the pure engine. They are structurally validated and bound into the report but are not independently attested billing or transport truth.

## Non-authority truth

KRI-R4 benchmark output is engineering evidence only.

```text
QUALIFIED != FINDING TRUE
QUALIFIED != REVIEWER GENERALLY TRUSTWORTHY
QUALIFIED != DEFAULT ROUTING AUTHORIZATION
QUALIFIED != PR APPROVAL
QUALIFIED != MERGE AUTHORITY
QUALIFIED != PROVEN_READY
```

K2 remains the sole trusted side-effect execution authority.

The Done Gate remains the sole current `PROVEN_READY` authority.

## Final merge requirements

After this ledger is committed, the final exact implementation head must independently prove:

- cumulative diff contains exactly the six authorized paths;
- no KRI-R1/R2/R3 canonical source or fixture mutation;
- required governance checks succeed;
- runtime typecheck/tests and patch hook succeed on Ubuntu, macOS, and Windows;
- `k2-runtime-gate` succeeds;
- no unresolved valid review thread remains;
- main protection remains active with no bypass;
- auto-merge remains disabled/null;
- live canonical main remains the authorization merge or the PR remains a clean descendant with no hidden scope expansion.

Only that final exact head may be merged.
