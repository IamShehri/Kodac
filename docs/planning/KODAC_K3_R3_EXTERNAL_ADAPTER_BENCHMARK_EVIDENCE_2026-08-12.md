# Kodac K3-R3 External Adapter Benchmark Evidence — 2026-08-12

## Status

```text
K3-R3 BENCHMARK EXECUTION: COMPLETE FOR THE AUTHORIZED SLICE
BENCHMARK EVIDENCE: READY FOR FOUNDER REVIEW
PRIMARY CERTIFICATION RUN: SUCCESS
CANONICAL ADOPTION: NOT ESTABLISHED BY THIS DOCUMENT ALONE
K3-R4 SOURCE INTAKE: NOT AUTHORIZED
```

This record captures bounded K3-R3 benchmark evidence under the canonical authorization on `main` at:

```text
9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

It does not admit any external implementation, dependency, binary, storage engine, protocol server, or donor source into Kodac.

## 1. Authority and protocol

Canonical authorization:

- `docs/planning/KODAC_K3_R3_EXTERNAL_ADAPTER_BENCHMARK_AUTHORIZATION_2026-08-12.md`

Benchmark protocol:

- `docs/planning/KODAC_K3_BENCHMARK_AND_EVIDENCE_PROTOCOL_2026-08-12.md`
- protocol id: `KODAC_K3_BENCHMARK_AND_EVIDENCE_PROTOCOL_2026-08-12`

Candidate register:

- `docs/planning/KODAC_K3_ADAPTER_AND_SOURCE_INTAKE_CANDIDATE_REGISTER_2026-08-12.md`

The benchmark preserves the protocol distinction that parser/structural evidence is not compiler-resolved semantic truth.

## 2. Primary certification identity

Primary certification execution:

| Field | Value |
| --- | --- |
| Branch | `bench/k3-r3-external-adapter-evidence` |
| Canonical base | `9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc` |
| Benchmarked exact PR head | `33e8646f428eb2f0f476c09591980a46c172aa1f` |
| Checked-out commit verified by harness | `33e8646f428eb2f0f476c09591980a46c172aa1f` |
| GitHub Actions run | `31622902265` |
| Workflow | `k3-r3-benchmark` |
| Workflow result | `SUCCESS` |
| Result status | `BENCHMARK_EVIDENCE_READY_FOR_REVIEW` |
| Governance on same head | `SUCCESS` |
| Runner OS | Linux |
| Runner kernel | `6.17.0-1022-azure` |
| Architecture | `x64` |
| Node | `v24.19.0` |

Artifact identity:

| Field | Value |
| --- | --- |
| Artifact id | `9151951947` |
| Artifact name | `k3-r3-benchmark-evidence-33e8646f428eb2f0f476c09591980a46c172aa1f` |
| Artifact ZIP digest | `sha256:9b580c5133dd2a559464f3d0c6e2ad2e090cca221f14f33a14b4e55c5e7c36d6` |
| Raw `k3-r3-results.json` SHA-256 | `aab8144d5ddf0a484f95a873869b9aef85787c7272cf633cef4cff39f7e0c85e` |
| Canonical result identity scheme | `sha256-canonical-k3-r3-benchmark-v1` |
| Canonical result identity | `045b85abd0565cd494fde35f0172759c82a16e1f4739f2c882089920746bff65` |

## 3. Provenance identity guards

The certification harness fails closed unless all three identities are exact.

### 3.1 Canonical base identity

The workflow and harness independently require:

```text
pull_request.base.sha == 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

Certification result:

```text
canonicalBaseVerified = true
```

If canonical `main` moves, the benchmark must not silently reuse this certification as though the baseline were unchanged.

### 3.2 Exact PR head checkout

The benchmark workflow checks out the exact `pull_request.head.sha`, not GitHub's synthetic PR merge ref.

The harness independently compares:

```text
git rev-parse HEAD
```

to the declared benchmark head.

Certification result:

```text
headSha = 33e8646f428eb2f0f476c09591980a46c172aa1f
checkedOutHead = 33e8646f428eb2f0f476c09591980a46c172aa1f
exactHeadCheckoutVerified = true
```

### 3.3 Fixture manifest Git blob identity

Canonical K3-R1 fixture manifest:

```text
packages/kodac-runtime/test/fixtures/k3-r1/manifest.json
```

Required Git blob:

```text
6f812003a4b33e62ad1be672a39c7f42509fc500
```

The harness computes the actual Git blob SHA-1 from the raw manifest bytes and requires exact equality before using the gold oracle.

Certification result:

```text
manifestGitBlobVerified = true
```

## 4. Fixture and gold identity

| Field | Value |
| --- | --- |
| Fixture id | `k3-r1-core-repository-v1` |
| Gold schema | `k3-r1-gold-evidence-v1` |
| Manifest Git blob | `6f812003a4b33e62ad1be672a39c7f42509fc500` |
| Manifest Git blob verified | `true` |
| Verified fixture files | `11` |
| Fixture content identity | `fb147c78b55b82958b5fef4362b160d5b78b44c5b56754673e982d3aaf2d13e3` |

Every declared fixture file was re-hashed before and after candidate execution according to the canonical manifest digest policy.

## 5. Candidate identities

### ast-grep

| Field | Value |
| --- | --- |
| Version | `0.45.1` |
| Linux x86_64 artifact SHA-256 | `76fb6555be6734fb5057dba8d2fb756430f374bb9e1af694cf1ce00e13238d63` |
| Runtime identity | `ast-grep 0.45.1` |
| License | MIT |
| Evidence class | `parser-derived` |
| Adapter config | `k3-r3-ast-grep-structural-v1` |

### Tree-sitter

| Field | Value |
| --- | --- |
| CLI version | `0.26.12` |
| Linux x64 artifact SHA-256 | `c33ace12fa7a94d09c97054da621bf7a6a3159f765b1839a898232de283d641d` |
| Runtime identity | `tree-sitter 0.26.12` |
| TypeScript grammar identity | `75b3874edb2dc714fb1fd77a32013d0f8699989f` |
| License | MIT |

### SCIP

| Field | Value |
| --- | --- |
| Version | `0.9.0` |
| Linux amd64 archive SHA-256 | `fc2e7273e110be9f35924da1066000183791e8bfdb0391355de6eaaa070fec75` |
| Runtime identity | `scip version v0.9.0` |
| License | Apache-2.0 |

### LSP

| Field | Value |
| --- | --- |
| Specification identity | `3.18` |
| Concrete server | none executed |
| Mode | protocol capability assessment only |

## 6. ast-grep measured structural evidence

The benchmark measures only claims appropriate to structural AST matching.

### 6.1 Exact structural queries

```text
symbol-add:
add

symbol-meaning:
meaning

symbol-widget:
class Widget { readonly source = $VALUE }
```

Each query suite was executed twice. Canonical normalized outputs matched exactly.

### 6.2 Structural occurrence correctness

`add` gold structural occurrences are the union of its canonical declaration and four canonical reference locations. The benchmark does not claim that ast-grep semantically distinguishes declaration from reference.

| Symbol | True positive | Observed | Expected | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| `add` | 5 | 5 | 5 | `1.0` | `1.0` |
| `meaning` | 1 | 1 | 1 | `1.0` | `1.0` |

Observed `add` locations:

- `src/consumer.ts:1`
- `src/consumer.ts:4`
- `src/math.ts:1`
- `tests/math.test.ts:3`
- `tests/math.test.ts:6`

Observed `meaning` location:

- `src/math.ts:5`

### 6.3 Ambiguous candidate preservation

For canonical symbol `Widget`, the structural class-shape query returned exactly:

- `src/ambiguous-a.ts`
- `src/ambiguous-b.ts`

Certification result:

```text
ambiguityPreserved = true
```

No semantic disambiguation was claimed or inferred.

### 6.4 Determinism and evidence provenance

```text
deterministic = true
provenanceComplete = true
fixtureUnchanged = true
semanticDefinitionReferenceDifferentiation = NOT CLAIMED / NOT MEASURED
```

Every normalized ast-grep result carries candidate identity, exact version, exact artifact SHA-256, adapter configuration identity, `parser-derived` evidence classification, and bounded fixture-relative position.

### 6.5 Certification-run timings

First suite:

| Query | Duration |
| --- | ---: |
| `symbol-add` | `4.895 ms` |
| `symbol-meaning` | `4.319 ms` |
| `symbol-widget` | `5.031 ms` |

Repeated suite:

| Query | Duration |
| --- | ---: |
| `symbol-add` | `4.349 ms` |
| `symbol-meaning` | `5.051 ms` |
| `symbol-widget` | `5.230 ms` |

These are single-run Linux x64 observations only, not cross-platform or product-level performance claims.

## 7. Security and integrity invariants

Certification result:

```text
canonicalBaseIdentityGuard = true
exactHeadCheckoutGuard = true
fixtureManifestGitBlobGuard = true
snapshotFreshnessGuard = true
evidenceSourceProvenanceCompleteness = true
unauthorizedWorkspaceMutationsObservedByHarness = 0
pathEscapesObserved = 0
canonicalTraversalCaseRejected = true
canonicalSymlinkTargetEscapeRejected = true
unlabeledModelHypothesesAsVerifiedFacts = 0
```

The workflow separately attested a clean exact-head checkout before candidate execution and the same clean Git state afterward.

Candidate binaries were downloaded only into runner temporary storage and verified against exact SHA-256 values. No candidate dependency or binary was added to Kodac manifests, lockfiles, source distribution, or repository state.

## 8. Candidate dispositions

### ast-grep

```text
DISPOSITION: QUALIFIED FOR SPECIFIC ADAPTER ROLE
ROLE: structural symbol occurrence and ambiguous-candidate discovery
```

This narrow qualification does **not** establish ast-grep as:

- a compiler-resolved definition engine;
- a semantic reference engine;
- a call-graph authority;
- a dependency-graph authority;
- a replacement for Kodac snapshot/freshness truth;
- a selected Kodac dependency;
- admitted source.

### Tree-sitter

```text
DISPOSITION: SECURITY REVIEW REQUIRED
```

The exact CLI identity was verified, but TypeScript parser execution was not performed. The identified grammar build/load route can invoke a compiler, which is outside the current authorized K3-R3 execution-security boundary.

No negative quality conclusion about Tree-sitter is implied.

### SCIP

```text
DISPOSITION: INSUFFICIENT EVIDENCE
```

The exact SCIP CLI identity was verified. SCIP consumes semantic indexes but does not itself generate the TypeScript semantic index required to score compiler-resolved definition/reference accuracy. No concrete TypeScript indexer was authorized for execution.

No negative quality conclusion about SCIP as a protocol is implied.

### LSP

```text
DISPOSITION: SECURITY REVIEW REQUIRED
```

No concrete language server was executed. Server startup may load project configuration, package resolution, plugins, compiler/tool chains, or network behavior; those execution modes require a separately reviewed server/security envelope.

### K3-R2 baseline

```text
STATUS: CANONICAL BASELINE
ROLE: freshness, provenance, exact repository/workspace-state truth anchor
```

The external benchmark does not replace K3-R2.

## 9. Resource and coverage limitations

This benchmark does not establish evidence for:

- peak memory behavior;
- cross-platform external candidate execution;
- Tree-sitter TypeScript parser quality;
- SCIP TypeScript semantic-index generation quality;
- any concrete LSP server;
- external-tool symlink-following behavior beyond harness path-boundary checks;
- persistent-index lifecycle behavior;
- vector or embedding retrieval;
- large-repository scaling;
- whole-product superiority.

The fixture did not trigger truncation, and no partial results occurred for the narrow ast-grep capability actually claimed.

## 10. Failure and hardening history

Earlier PR-head executions are retained as engineering history but are **not** certification evidence.

1. `241f9d033c747f81d1f7c814095b9fdd3b8129df` — archive selection chose deprecated `sg`; corrected to prefer `ast-grep`.
2. `2ec65cd50fd64a9b5feb451dc0e1cc5fd1bc157e` — initial query design overreached toward semantic definition/reference classification; benchmark scope corrected to structural claims.
3. `e3c3fe64a52c4b5912c07b01a58cae8e6953fc88` — transient GitHub release HTTP `503`; bounded retries added while retaining mandatory SHA-256 verification.
4. `6f76e89f452e025b67b42f5d9d3147dd5f1894ea` — bare `Widget` pattern did not match the intended class case; replaced with a bounded class-structure query.
5. `115ea7c656febc37447b8fd6f6fcedd798cdf975` / run `31621937248` — successful functional evidence, later superseded as certification because the default PR checkout was GitHub's synthetic merge ref while the result labeled the PR head.
6. `f1d79e7467c6ab06b3867d86be249f7695c431b2` / run `31622144839` — successful confirmatory functional evidence, also superseded by exact-head provenance hardening.
7. `d7c62c21636f882e393085540213cfcfb4e24450` — workflow-side exact-head/base binding added; subsequently paired with harness-side identity checks.
8. `33e8646f428eb2f0f476c09591980a46c172aa1f` / run `31622902265` — **primary certification candidate** with canonical base, exact checkout head, and fixture manifest Git blob independently verified.

## 11. Governance truth

```text
K3-R3 BENCHMARK: EXECUTED FOR AUTHORIZED SLICE
AST-GREP: QUALIFIED FOR NARROW STRUCTURAL ADAPTER ROLE ONLY
TREE-SITTER: SECURITY REVIEW REQUIRED FOR TYPESCRIPT PARSER EXECUTION
SCIP: INSUFFICIENT EVIDENCE WITHOUT AUTHORIZED TYPESCRIPT INDEXER
LSP: SECURITY REVIEW REQUIRED FOR ANY CONCRETE SERVER
K3-R2 BUILT-IN BASELINE: REMAINS CANONICAL
K3-R4+: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED
NEW KODAC DEPENDENCIES: NOT AUTHORIZED
PERSISTENT STORAGE: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED
```

## 12. Founder-review boundary

This evidence package is ready for founder review only.

A protected merge of this PR, if separately founder-authorized after exact-head CI and review, may canonically adopt the **benchmark evidence and narrow dispositions**. It must not be interpreted as authorization to:

- import ast-grep source;
- add ast-grep as a Kodac dependency;
- execute Tree-sitter TypeScript parsers under a new security envelope;
- select or execute a SCIP TypeScript indexer;
- start an LSP server;
- begin K3-R4;
- select persistent storage;
- activate vectors/embeddings;
- make public `best`, `winner`, or `superior` claims.

K3-R4 and all source-intake decisions remain separately founder-controlled.