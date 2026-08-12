# Kodac K3-R3 External Adapter Benchmark Evidence — 2026-08-12

## Status

```text
K3-R3 BENCHMARK EXECUTION: COMPLETE FOR THE AUTHORIZED SLICE
BENCHMARK EVIDENCE: READY FOR FOUNDER REVIEW
CANONICAL ADOPTION: NOT ESTABLISHED BY THIS DOCUMENT ALONE
K3-R4 SOURCE INTAKE: NOT AUTHORIZED
```

This document records the bounded K3-R3 benchmark evidence produced under the canonical authorization on `main` at:

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

The benchmark preserves the protocol distinction that syntax/structural evidence is not compiler-resolved semantic truth.

## 2. Exact benchmark identity

Primary successful execution:

| Field | Value |
| --- | --- |
| Branch | `bench/k3-r3-external-adapter-evidence` |
| Benchmarked head | `115ea7c656febc37447b8fd6f6fcedd798cdf975` |
| GitHub Actions run | `31621937248` |
| Workflow | `k3-r3-benchmark` |
| Workflow result | `SUCCESS` |
| Governance on same head | `SUCCESS` |
| K2 runtime gate on same head | `SUCCESS` |
| Runner OS | Linux |
| Runner kernel | `6.17.0-1022-azure` |
| Architecture | `x64` |
| Node | `v24.19.0` |

Artifact:

| Field | Value |
| --- | --- |
| Artifact id | `9151571036` |
| Artifact name | `k3-r3-benchmark-evidence-115ea7c656febc37447b8fd6f6fcedd798cdf975` |
| Artifact ZIP digest | `sha256:e8e28ae0df2167ce648fb01c0e271523c3e99b93e77f805a28935ba52b62d594` |
| Raw `k3-r3-results.json` SHA-256 | `a8876a2de721e9242cb49c8a82b360c7e9f03b10f433bf20f8a48f72ae3161a7` |
| Raw result size | `10006` bytes |
| Canonical result identity scheme | `sha256-canonical-k3-r3-benchmark-v1` |
| Canonical result identity | `dba709f3d7831103c1b47bf2b1d359f8e5a4789974a381b6281e0755161862cc` |

## 3. Fixture and gold identity

The successful run used only the canonical K3-R1 benchmark fixture:

| Field | Value |
| --- | --- |
| Fixture id | `k3-r1-core-repository-v1` |
| Gold schema | `k3-r1-gold-evidence-v1` |
| Manifest Git blob | `6f812003a4b33e62ad1be672a39c7f42509fc500` |
| Verified files | `11` |
| Canonical fixture content identity | `fb147c78b55b82958b5fef4362b160d5b78b44c5b56754673e982d3aaf2d13e3` |

Every declared fixture file was re-hashed before and after candidate execution according to the manifest digest policy.

## 4. Candidate identities

### 4.1 ast-grep

| Field | Value |
| --- | --- |
| Candidate | ast-grep |
| Version | `0.45.1` |
| Linux x86_64 release SHA-256 | `76fb6555be6734fb5057dba8d2fb756430f374bb9e1af694cf1ce00e13238d63` |
| Runtime identity output | `ast-grep 0.45.1` |
| License | MIT |
| Evidence class | `parser-derived` |
| Adapter config | `k3-r3-ast-grep-structural-v1` |

### 4.2 Tree-sitter

| Field | Value |
| --- | --- |
| Candidate | Tree-sitter |
| Version | `0.26.12` |
| Linux x64 CLI SHA-256 | `c33ace12fa7a94d09c97054da621bf7a6a3159f765b1839a898232de283d641d` |
| Runtime identity output | `tree-sitter 0.26.12` |
| TypeScript grammar identity | `75b3874edb2dc714fb1fd77a32013d0f8699989f` |
| License | MIT |

### 4.3 SCIP

| Field | Value |
| --- | --- |
| Candidate | SCIP |
| Version | `0.9.0` |
| Linux amd64 archive SHA-256 | `fc2e7273e110be9f35924da1066000183791e8bfdb0391355de6eaaa070fec75` |
| Runtime identity output | `scip version v0.9.0` |
| License | Apache-2.0 |

### 4.4 LSP

| Field | Value |
| --- | --- |
| Candidate | Language Server Protocol |
| Specification identity | `3.18` |
| Concrete server | none executed |
| Mode | protocol capability assessment only |

## 5. ast-grep measured structural evidence

The benchmark deliberately measures only claims appropriate to a structural AST matcher.

### 5.1 Exact queries

```text
symbol-add:
add

symbol-meaning:
meaning

symbol-widget:
class Widget { readonly source = $VALUE }
```

The same three queries were executed twice. Canonical normalized outputs were byte-equivalent between the two suites.

### 5.2 Structural occurrence correctness

`add` gold structural occurrences include its canonical declaration plus the four canonical reference locations. The benchmark does not assert that ast-grep semantically distinguishes those classes.

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

### 5.3 Ambiguous candidate preservation

For canonical symbol `Widget`, the structural query returned exactly:

- `src/ambiguous-a.ts`
- `src/ambiguous-b.ts`

The benchmark therefore records:

```text
ambiguityPreserved = true
```

No semantic disambiguation was claimed or inferred.

### 5.4 Determinism and provenance

```text
deterministic = true
provenanceComplete = true
fixtureUnchanged = true
semanticDefinitionReferenceDifferentiation = NOT CLAIMED / NOT MEASURED
```

Every normalized ast-grep result carries:

- candidate identity;
- exact version;
- exact artifact SHA-256;
- adapter configuration identity;
- `parser-derived` evidence classification;
- bounded fixture-relative path and position.

### 5.5 Observed query timings

First suite:

| Query | Duration |
| --- | ---: |
| `symbol-add` | `8.446 ms` |
| `symbol-meaning` | `6.526 ms` |
| `symbol-widget` | `6.816 ms` |

Repeated suite:

| Query | Duration |
| --- | ---: |
| `symbol-add` | `7.482 ms` |
| `symbol-meaning` | `7.325 ms` |
| `symbol-widget` | `6.820 ms` |

These timings are observations from one Linux x64 runner only. They are not a cross-platform or product-level performance claim.

## 6. Security and integrity invariants

The successful run recorded:

```text
snapshotFreshnessGuard = true
evidenceSourceProvenanceCompleteness = true
unauthorizedWorkspaceMutationsObservedByHarness = 0
pathEscapesObserved = 0
canonicalTraversalCaseRejected = true
canonicalSymlinkTargetEscapeRejected = true
unlabeledModelHypothesesAsVerifiedFacts = 0
```

The workflow separately attested a clean Git checkout before candidate execution and the same clean Git state after candidate execution.

Candidate binaries were downloaded only into GitHub runner temporary storage and verified against exact SHA-256 values before use. No candidate dependency or binary was added to Kodac manifests, lockfiles, source distribution, or repository state.

## 7. Candidate dispositions

### ast-grep

```text
DISPOSITION: QUALIFIED FOR SPECIFIC ADAPTER ROLE
ROLE: structural symbol occurrence and ambiguous-candidate discovery
```

This qualification is intentionally narrow.

It does **not** establish ast-grep as:

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

The exact CLI identity was verified, but TypeScript parser execution was not performed. The currently identified grammar build/load route can invoke a compiler, which is outside the authorized K3-R3 execution-security boundary without separate approval.

No negative quality conclusion about Tree-sitter is implied by this non-execution.

### SCIP

```text
DISPOSITION: INSUFFICIENT EVIDENCE
```

The exact SCIP CLI identity was verified. The CLI consumes semantic indexes but does not itself generate the TypeScript semantic index required to score compiler-resolved definition/reference accuracy against the K3-R1 gold set. No concrete TypeScript indexer was authorized for execution.

No negative quality conclusion about SCIP as a protocol is implied.

### LSP

```text
DISPOSITION: SECURITY REVIEW REQUIRED
```

No concrete language server was executed. Server startup may load project configuration, package resolution, plugins, compiler/tool chains, or network behavior; those execution modes require a separately reviewed concrete server/security envelope.

### K3-R2 baseline

```text
STATUS: CANONICAL BASELINE
ROLE: freshness, provenance, exact repository/workspace-state truth anchor
```

The external benchmark does not replace the K3-R2 baseline.

## 8. Resource and coverage limitations

The benchmark explicitly does not claim evidence for:

- peak memory behavior;
- cross-platform external candidate execution;
- Tree-sitter TypeScript parser quality;
- SCIP TypeScript semantic-index generation quality;
- any concrete LSP server;
- external-tool symlink-following behavior beyond the harness path-boundary checks;
- persistent-index lifecycle behavior;
- vector or embedding retrieval;
- large-repository scaling;
- whole-product superiority.

The fixture did not trigger truncation, and no partial results occurred for the narrow ast-grep capability actually claimed.

## 9. Failure history retained as evidence

Earlier PR-head attempts are not accepted as benchmark certification, but their failure modes informed harness hardening:

1. `241f9d033c747f81d1f7c814095b9fdd3b8129df` — archive executable selection chose deprecated `sg` compatibility shim; corrected to prefer `ast-grep`.
2. `2ec65cd50fd64a9b5feb451dc0e1cc5fd1bc157e` — initial query design overreached toward semantic definition/reference classification; benchmark scope was corrected to honest structural claims.
3. `e3c3fe64a52c4b5912c07b01a58cae8e6953fc88` — transient GitHub release HTTP `503`; download handling hardened with bounded retries while retaining mandatory SHA-256 verification.
4. `6f76e89f452e025b67b42f5d9d3147dd5f1894ea` — bare `Widget` pattern was not a valid structural match for the intended class-name case; corrected to a class-structure query matching the two canonical ambiguous fixtures.

No failed run is used as certification evidence. The primary certification candidate is run `31621937248` at `115ea7c656febc37447b8fd6f6fcedd798cdf975`.

## 10. Governance truth after this benchmark

The benchmark result does not broaden authority.

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

## 11. Founder-review decision boundary

This evidence package is ready for founder review only.

A protected merge of this PR, if separately founder-authorized after exact-head CI/review, may canonically adopt the **benchmark evidence and narrow candidate dispositions**. It must not be interpreted as authorization to:

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