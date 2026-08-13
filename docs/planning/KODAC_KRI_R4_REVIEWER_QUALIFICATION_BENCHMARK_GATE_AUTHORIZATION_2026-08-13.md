# Kodac KRI-R4 Reviewer Qualification & Benchmark Gate Authorization

## Record identity

```text
Gate: KRI-R4
Name: Reviewer Qualification & Benchmark Gate
Date: 2026-08-13
Canonical authorization base: 43a8f6f1b4497ac52bdb1c6f9a4e77e93ba5bc12
Canonical authorization base tree: d176d56ded0ec0e32b668e54bab289bd5e0a6c37
Parent authorities: KRI-P0 + KRI-R1 + KRI-R2 + KRI-R3
Authority class: DOCUMENTATION / AUTHORIZATION
Implementation authority after canonical adoption: BOUNDED PURE QUALIFICATION / BENCHMARK SLICE ONLY
```

## Purpose

Authorize a provider-neutral, deterministic qualification engine that scores observed reviewer outcomes against admitted gold truth without granting any reviewer, adapter, model, or benchmark result repository authority.

KRI-R4 answers a narrow engineering question:

```text
HOW WELL DID THIS IDENTIFIED REVIEWER CANDIDATE PERFORM
ON THIS IDENTIFIED BENCHMARK SCOPE
UNDER THIS IDENTIFIED QUALIFICATION POLICY?
```

It does **not** answer:

```text
IS THIS REVIEWER GENERALLY TRUSTWORTHY?
IS THIS FINDING TRUE?
SHOULD THIS PR MERGE?
IS THE REPOSITORY PROVEN_READY?
```

Core invariant:

```text
BENCHMARK PERFORMANCE IS MEASURED EVIDENCE, NOT EXECUTION OR COMPLETION AUTHORITY.
```

## Canonical prerequisites

```text
KRI-P0: CANONICAL
KRI-R1 GOLD REVIEWER-EVIDENCE CORPUS: CANONICAL
KRI-R2 FINDING / ADJUDICATION RUNTIME: CANONICAL
KRI-R3 PROVIDER-NEUTRAL REVIEWER EXECUTION: CANONICAL
K3-R5 CONTEXT ENGINE: CANONICAL
```

KRI-R4 must consume those boundaries without changing them.

## Critical benchmark-semantics boundary

The canonical KRI-R1 v1 corpus currently contains four admitted historical reviewer-finding cases. Those cases include both `VALID_ACCEPTED` and `INVALID_REJECTED` dispositions and represent multiple reviewers and source PRs.

That corpus is suitable for a bounded **historical claim-disposition benchmark**.

It is **not** a complete code-review task corpus with exhaustive expected findings and exhaustive expected non-findings. Therefore KRI-R4 MUST NOT derive or advertise whole-review finding-generation precision, whole-review finding-generation recall, false-negative rate for undiscovered findings, or general production reviewer quality from KRI-R1 v1 alone.

The first KRI-R4 slice is consequently scoped to:

```text
benchmarkCapabilityScope = historical-claim-disposition-v1
```

Future finding-generation qualification requires a separately admitted gold review-task corpus that contains complete repository/task context and an explicit expected finding set or equivalent oracle.

## Authorized qualification engine shape

KRI-R4 may define and implement:

- versioned qualification contracts;
- a deterministic `ReviewerQualificationEngine`;
- a strict machine-readable qualification-report schema;
- candidate reviewer identity fields configured by Kodac;
- qualification-policy identity and explicit threshold fields;
- bounded observed case outcomes;
- exact binding to an admitted gold-corpus identity;
- deterministic observation canonicalization;
- per-class and aggregate benchmark metrics;
- latency statistics derived from supplied observed timings;
- optional reported token/cost counters clearly labeled as supplied observations, not authoritative billing truth;
- bounded qualification decisions;
- structural report identity recomputation;
- tests and an evidence ledger.

The first slice MUST remain pure and in-memory.

## Candidate identity boundary

A benchmark candidate may be identified by bounded strings such as:

- adapter id;
- adapter version;
- reviewer/provider id;
- reviewer/provider version;
- model id or deployment id when supplied by the caller;
- policy identity used to produce the observed runs.

KRI-R4 does not authenticate those external identities. It structurally binds the caller-supplied candidate identity into the qualification report.

A later concrete-adapter gate must establish how an external adapter identity, transport, credentials, model/deployment identity, and run evidence are actually attested.

## Observation contract

Each benchmark observation must bind to exactly one admitted gold case identity and may report only bounded observed outcome data.

The first slice may use the following normalized outcomes:

```text
VALID_ACCEPTED
INVALID_REJECTED
ABSTAIN
PROVIDER_FAILED
TIMED_OUT
INVALID_OUTPUT
```

Every admitted gold case must appear exactly once in a complete observation set. Duplicate, missing, foreign, or fabricated case identities fail closed.

Observation order must not affect report identity.

Optional latency/token/cost fields are measurements supplied by the caller. They are not independently verified by the pure R4 engine.

## Metrics authorized for historical claim-disposition scope

KRI-R4 may compute, using integer counts and basis points where appropriate:

- total cases;
- gold accepted count;
- gold rejected count;
- correctly accepted count;
- correctly rejected count;
- false accepted count;
- false rejected count;
- abstain count;
- provider-failed count;
- timed-out count;
- invalid-output count;
- decision coverage;
- overall exact-disposition accuracy;
- accepted-class precision;
- accepted-class recall;
- rejected-class recall;
- execution-failure rate;
- latency p50 / p95 over supplied successful/attempted observations as explicitly defined by the implementation contract;
- total and average supplied token/cost counters when present.

Metrics with a zero mathematical denominator must be represented explicitly as unavailable rather than silently coerced to a perfect or zero score.

KRI-R4 MUST NOT rename these metrics in a way that implies exhaustive finding-generation precision or recall.

## Qualification decision states

The first slice may emit only:

```text
QUALIFIED
NOT_QUALIFIED
INSUFFICIENT_EVIDENCE
```

Every decision MUST also carry:

```text
capabilityScope = historical-claim-disposition-v1
```

`QUALIFIED` therefore means only:

```text
THE CANDIDATE MET THE IDENTIFIED POLICY THRESHOLDS
ON THE IDENTIFIED HISTORICAL CLAIM-DISPOSITION CORPUS.
```

It does not mean general reviewer admission, default routing, repository authority, approval authority, or production readiness.

## Conservative default qualification policy

The first implementation may publish a default qualification policy no weaker than:

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

Because canonical KRI-R1 v1 currently contains only four gold cases, a benchmark using only that corpus MUST resolve to `INSUFFICIENT_EVIDENCE` under this default policy even if all four observations are correct.

This is intentional. Four historical examples are useful regression evidence but are not sufficient evidence for broad candidate qualification.

A weaker qualification policy or different capability scope requires separate authorization or an explicit future policy gate.

## Qualification identity

KRI-R4 may compute deterministic SHA-256 structural identities for qualification policy and report records.

The report identity must bind at least:

- KRI-R4 contract version;
- capability scope;
- candidate identity;
- gold corpus identity;
- qualification-policy identity;
- canonicalized complete observation set;
- computed metric record;
- final qualification decision and machine-readable reasons.

These hashes are integrity fingerprints only. They are not signatures, credentials, authentication, reviewer trust, or completion proof.

## Fail-closed requirements

KRI-R4 must fail closed on at least:

- unsupported contract or capability scope;
- malformed/lowercase-identity violations;
- unbounded candidate or policy strings;
- duplicate observations;
- foreign case identities;
- missing admitted gold cases in a purported complete run;
- impossible counters;
- negative/non-integer latency/token/cost observations;
- NaN/infinite numeric input;
- threshold values outside their valid domains;
- structurally mutated reports whose identity no longer recomputes;
- attempts to inject merge, approval, finding lifecycle, adjudication, or `PROVEN_READY` fields.

## Deliberately excluded from KRI-R4

This slice does not authorize:

- a concrete OpenAI, Anthropic, Cubic, CodeRabbit, Qodo, or other external reviewer adapter;
- HTTP/network transport;
- provider SDKs;
- API secrets or credential handling;
- provider subprocess or CLI execution;
- invoking an external reviewer from the qualification engine;
- persistent benchmark storage;
- reviewer routing/default-selection changes;
- reviewer learning or weight updates;
- autofix;
- repository mutation;
- GitHub comments/reviews/approvals;
- merge execution;
- K2 authority changes;
- K5 implementation;
- Done Gate changes;
- `PROVEN_READY` decisions;
- whole-review generation precision/recall claims from KRI-R1 v1.

Concrete adapter execution remains a separate later gate. R4 only supplies the neutral qualification machinery that such adapters can later feed with separately authorized observed evidence.

## Authorized implementation paths

After canonical adoption, the KRI-R4 implementation is limited to exactly:

```text
schema/kri-reviewer-qualification.schema.json
packages/kodac-runtime/src/reviewer-intelligence/qualification-contracts.ts
packages/kodac-runtime/src/reviewer-intelligence/qualification.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kri-r4-reviewer-qualification.test.ts
docs/planning/KODAC_KRI_R4_REVIEWER_QUALIFICATION_BENCHMARK_EVIDENCE_2026-08-13.md
```

No KRI-R1, KRI-R2, or KRI-R3 canonical source/fixture path may be modified by this slice.

No manifest, lockfile, dependency, workflow, ExecutionGateway, Done Gate, provider adapter, network client, persistent storage, or governance-protection path is authorized.

## Required tests

The implementation candidate must prove at least:

1. all admitted gold case identities are required exactly once;
2. duplicate, missing, and foreign cases fail closed;
3. observation order does not change report identity;
4. candidate identity is bound into the report;
5. corpus identity is bound into the report;
6. policy identity is deterministic and threshold mutation changes it;
7. exact-disposition counts are correct;
8. false-accepted and false-rejected counts are not conflated;
9. abstention reduces decision coverage rather than being silently counted correct;
10. provider failure, timeout, and invalid output are measured separately;
11. zero-denominator metrics are explicitly unavailable;
12. perfect four-case KRI-R1 v1 performance is still `INSUFFICIENT_EVIDENCE` under the default policy;
13. a synthetic sufficiently large balanced corpus can produce `QUALIFIED` when all thresholds pass;
14. sufficient evidence below a threshold produces `NOT_QUALIFIED` with machine-readable reasons;
15. threshold boundary behavior is exact in basis points;
16. latency percentile calculation is deterministic;
17. supplied token/cost counters cannot become authority claims;
18. report identity recomputation detects semantic mutation;
19. unsupported capability scope fails closed;
20. unknown/injected authority fields fail closed through strict validation/schema;
21. runtime source has no network, child-process, filesystem, ExecutionGateway, provider SDK, or repository-write surface;
22. KRI-R1 corpus remains byte/identity unchanged;
23. KRI-R2/KRI-R3 authority boundaries remain unchanged;
24. full runtime typecheck/tests remain green across supported CI platforms.

## Authority boundary after KRI-R4

```text
KRI-R4 PURE REVIEWER QUALIFICATION ENGINE: AUTHORIZED AFTER CANONICAL ADOPTION
KRI-R4 HISTORICAL CLAIM-DISPOSITION BENCHMARK: AUTHORIZED
CONCRETE EXTERNAL REVIEWER ADAPTER: NOT AUTHORIZED BY THIS SLICE
PROVIDER NETWORK / SECRET HANDLING: NOT AUTHORIZED BY THIS SLICE
PRODUCTION REVIEWER ROUTING / DEFAULT SELECTION: NOT AUTHORIZED BY THIS SLICE
FINDING-GENERATION QUALIFICATION CLAIMS: NOT AUTHORIZED FROM KRI-R1 V1 ALONE
KRI PERSISTENCE / LEARNING: NOT AUTHORIZED
KRI AUTOFIX / REPOSITORY WRITE: NOT AUTHORIZED
KRI GITHUB APPROVAL / MERGE: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED
PROVEN_READY AUTHORITY FROM KRI: NOT AUTHORIZED
```

K2 remains the sole trusted side-effect execution authority. The Done Gate remains the sole current `PROVEN_READY` authority.

## Merge gate

This authorization record may be merged only after exact-head verification confirms:

- live canonical main remains the expected base or the PR remains a clean descendant with no hidden scope expansion;
- the PR changes only this authorization document;
- KRI-R1/R2/R3 remain canonical and unchanged;
- the six-path implementation allowlist above is exact;
- the four-case KRI-R1 v1 corpus is not misrepresented as sufficient production qualification evidence;
- no concrete adapter/network/secret/provider execution is authorized;
- no write/approval/merge/K5/`PROVEN_READY` authority is granted;
- required checks are green;
- protection remains active;
- unresolved review threads are zero;
- auto-merge remains disabled.

Canonical adoption authorizes only the bounded pure qualification/benchmark implementation slice above.