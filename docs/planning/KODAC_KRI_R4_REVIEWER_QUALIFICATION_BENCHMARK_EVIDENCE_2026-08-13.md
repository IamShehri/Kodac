# Kodac KRI-R4 Reviewer Qualification & Benchmark Evidence

## Record identity

```text
Gate: KRI-R4
Capability scope: historical-claim-disposition-v1
Authorization merge: b29a99d7c6743aa0f3ea271b16e59be362fec9a9
Authorization tree: 95141d6dadf48ac7af58fc71c8955441bd917584
Implementation PR: #26
Evidence date: 2026-08-13
```

KRI-R4 is a bounded, deterministic, pure/in-memory reviewer-qualification layer. Its output is engineering evidence only.

```text
QUALIFIED != FINDING TRUE
QUALIFIED != GENERAL REVIEWER TRUST
QUALIFIED != DEFAULT ROUTING AUTHORIZATION
QUALIFIED != PR APPROVAL
QUALIFIED != MERGE AUTHORITY
QUALIFIED != PROVEN_READY
```

K2 remains the sole trusted side-effect execution authority. The Done Gate remains the sole current `PROVEN_READY` authority.

## Exact authorized implementation surface

The implementation is confined to exactly six paths:

```text
schema/kri-reviewer-qualification.schema.json
packages/kodac-runtime/src/reviewer-intelligence/qualification-contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/qualification.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r4-reviewer-qualification.test.ts
docs/planning/KODAC_KRI_R4_REVIEWER_QUALIFICATION_BENCHMARK_EVIDENCE_2026-08-13.md
```

No KRI-R1 fixture, KRI-R2 source, KRI-R3 source, package manifest, lockfile, workflow, provider adapter, network client, persistent store, ExecutionGateway, Done Gate, or protection-rule path is modified by this slice.

## Implemented contract

KRI-R4 implements:

- report version `kri-r4-reviewer-qualification-v1`;
- capability scope `historical-claim-disposition-v1`;
- candidate identity fields for adapter/reviewer/model/policy identity;
- an admitted gold projection of `caseIdentity + goldDisposition`;
- a separately bound caller-supplied `sourceCorpusIdentity`;
- observation outcomes:
  - `VALID_ACCEPTED`
  - `INVALID_REJECTED`
  - `ABSTAIN`
  - `PROVIDER_FAILED`
  - `TIMED_OUT`
  - `INVALID_OUTPUT`;
- deterministic candidate, benchmark-set, qualification-policy, and report identities;
- integer/basis-point metrics;
- nearest-rank supplied-latency p50/p95;
- explicitly supplied token and reported-cost counters;
- decisions:
  - `QUALIFIED`
  - `NOT_QUALIFIED`
  - `INSUFFICIENT_EVIDENCE`;
- strict validation that reconstructs benchmark projection, observations, policy, metrics, decision, reasons, and the full canonical report.

SHA-256 identities in this slice are structural integrity fingerprints. They are not authentication, signatures, credentials, provider trust, execution authority, or completion proof.

## Canonical default qualification floor

```text
minimum total gold cases:              20
minimum VALID_ACCEPTED cases:           5
minimum INVALID_REJECTED cases:         5
minimum exact-disposition accuracy:  9000 bps
minimum accepted precision:          9000 bps
minimum accepted recall:             8000 bps
minimum rejected recall:             9000 bps
minimum decision coverage:           9500 bps
maximum execution failure:            500 bps
```

A caller-supplied policy weaker than this floor is rejected.

## KRI-R1 corpus truth

Canonical KRI-R1 v1 remains unchanged:

```text
fixture:
packages/kodac-runtime/test/fixtures/kri-r1/corpus.json

Git blob:
a308729f00f6c96894d66555127c3dd3ab592d32

corpus identity:
e3f87d5e008918043da4f10617aa479d0d5e4b9fcde42143bc691763f503c4d4

case count:
4
```

A perfect classification of these four cases is deliberately:

```text
INSUFFICIENT_EVIDENCE
```

KRI-R1 v1 contains historical claim/adjudication examples. It is not an exhaustive whole-review finding-generation corpus. KRI-R4 therefore does **not** infer whole-review bug-finding precision/recall, undiscovered-finding false-negative rate, or general production reviewer quality from those four cases.

Synthetic balanced evidence of sufficient size is used only to prove qualification-contract reachability. Synthetic evidence is not production reviewer qualification evidence.

## Regression and invariant coverage

The KRI-R4 test surface proves, at minimum:

1. the canonical policy floor;
2. current four-case KRI-R1 evidence remains insufficient even when classified perfectly;
3. exactly one observation is required for every admitted benchmark case;
4. duplicate, missing, and foreign observations fail closed;
5. ordering does not alter deterministic structural identity;
6. candidate and source-corpus changes alter bound identities;
7. policy identity is deterministic and stronger threshold changes alter it;
8. correct/false accepted/rejected counts remain distinct;
9. abstention lowers coverage and cannot become an implicit correct decision;
10. provider failure, timeout, and invalid output remain distinct;
11. zero-denominator class metrics are explicit unavailable/null values;
12. sufficiently large balanced perfect synthetic evidence can satisfy the policy contract;
13. sufficient but sub-threshold evidence resolves to `NOT_QUALIFIED` with machine reasons;
14. basis-point threshold boundaries are exact;
15. latency and supplied-usage accounting is deterministic;
16. semantic mutation of a serialized report is rejected by recomputation;
17. unsupported scope and injected authority fields fail closed;
18. weaker policies fail closed;
19. NaN, infinity, negative, and non-integer measurements fail closed;
20. functional and class APIs share the same deterministic contract;
21. a produced report is validated against the **published** `schema/kri-reviewer-qualification.schema.json` file itself;
22. the published schema rejects an injected unknown authority field;
23. production qualification code imports only `node:crypto` plus the local qualification contract;
24. canonical KRI-R1 bytes/identity remain unchanged;
25. canonical KRI-R2/KRI-R3 source blob identities remain unchanged.

The schema-validation regression deliberately uses a bounded test-only validator for the exact JSON Schema keyword subset used by the published KRI-R4 schema. This avoids adding a Node dependency or introducing a Python/subprocess dependency into the K2 runtime test. The canonical runtime validator remains the authority for KRI-R4 cross-field invariants and deterministic recomputation.

## CI and review chronology

### Candidate `9e0696b8c694b12331baee6daacd8c16774e3836`

```text
governance: SUCCESS
Ubuntu typecheck/test/patch hook: SUCCESS
macOS typecheck/test/patch hook: SUCCESS
Windows typecheck: SUCCESS
Windows test: FAILURE
k2-runtime-gate: FAILURE
```

The failure was preserved as evidence rather than represented as passing.

Cause: the immutable-source test calculated Git text-blob identities from checked-out working-tree bytes. Windows checkout could materialize CRLF while canonical Git text blobs used LF.

### Portability correction `9f642a4f32707ed7f70deadd70c18ad83b4b5efe`

The test helper was changed to canonicalize CRLF to LF before calculating the expected Git text-blob identity. Production qualification semantics did not change.

Exact-head result:

```text
governance: SUCCESS
Ubuntu typecheck/test/patch hook: SUCCESS
macOS typecheck/test/patch hook: SUCCESS
Windows typecheck/test/patch hook: SUCCESS
k2-runtime-gate: SUCCESS
```

### Evidence-ledger candidate `213bdd73981ac2befad849a16e72428638408a8b`

Exact-head GitHub Actions:

```text
governance: SUCCESS
k3-r4-adapter: SUCCESS
k3-r5-context-engine: SUCCESS
k2-runtime: SUCCESS

Ubuntu:
  typecheck: SUCCESS
  test: SUCCESS
  patch benchmark hook: SUCCESS

macOS:
  typecheck: SUCCESS
  test: SUCCESS
  patch benchmark hook: SUCCESS

Windows:
  typecheck: SUCCESS
  test: SUCCESS
  patch benchmark hook: SUCCESS

k2-runtime-gate: SUCCESS
```

External review then produced two claims:

1. Windows text-blob portability defect — valid and already fixed by `9f642a4...`; thread resolved.
2. Published JSON Schema had no direct produced-report schema regression — valid in substance.

The second finding was corrected at:

```text
1ecb898765a7c56a2ec1f85906ec03a52a53c1f8
```

The correction stayed inside the authorized KRI-R4 test path. It added no dependency and no production authority. It loads the actual published schema and validates a produced report plus an unknown-field rejection case.

Exact-head GitHub Actions on `1ecb898765a7c56a2ec1f85906ec03a52a53c1f8`:

```text
governance: SUCCESS
k3-r4-adapter: SUCCESS
k3-r5-context-engine: SUCCESS
k2-runtime: SUCCESS

Ubuntu typecheck/test/patch hook: SUCCESS
macOS typecheck/test/patch hook: SUCCESS
Windows typecheck/test/patch hook: SUCCESS
k2-runtime-gate: SUCCESS
```

Both known review threads were resolved after adjudication.

This evidence-ledger update moves the implementation head again. Therefore `1ecb898...` is historical evidence only. **Final merge certification must be rerun on the final ledger-bearing exact head.**

## Explicit limitations

KRI-R4 does not independently authenticate:

- the adapter/reviewer/model identity supplied to the pure engine;
- the caller-supplied `sourceCorpusIdentity`;
- latency observations;
- token counts;
- reported cost.

Those values are structurally validated and bound into the report, but external attestation belongs to a later adapter/transport evidence gate.

KRI-R4 does not execute a reviewer and does not select or route one. It does not persist benchmark history or reviewer learning.

## Final merge gate

The final exact implementation head may merge only after proving:

- cumulative diff = exactly the six authorized paths;
- base remains the canonical KRI-R4 authorization merge with no hidden scope expansion;
- required governance checks green;
- Ubuntu/macOS/Windows typecheck, tests, and patch benchmark hook green;
- `k2-runtime-gate` green;
- no unresolved valid review threads;
- protection active with no bypass;
- auto-merge null/disabled;
- no KRI-R1/R2/R3 authority mutation;
- merge performed with expected-head protection.

Only the final exact head may be certified or merged.
