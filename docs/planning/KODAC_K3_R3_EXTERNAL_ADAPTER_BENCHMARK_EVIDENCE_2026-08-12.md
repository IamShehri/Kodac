# Kodac K3-R3 External Adapter Benchmark Evidence — 2026-08-12

## Status

```text
K3-R3 BENCHMARK EXECUTION: COMPLETE FOR THE AUTHORIZED SLICE
COMMITTED EVIDENCE LEDGER: READY FOR EXACT-HEAD CONFIRMATION
CANONICAL ADOPTION: NOT ESTABLISHED BY THIS DOCUMENT ALONE
K3-R4 SOURCE INTAKE: NOT AUTHORIZED
```

This document records the bounded K3-R3 benchmark method, already observed candidate results, hardening history, and founder-review boundary under canonical `main`:

```text
9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

It does not admit any external implementation, dependency, binary, storage engine, protocol server, or donor source into Kodac.

## 1. Certification identity model

### 1.1 This committed document is not self-attesting

A committed file cannot contain the GitHub Actions artifact generated for the commit that contains that same file without creating an infinite self-reference cycle:

1. editing this document creates a new PR head;
2. the benchmark for that new head runs only after the commit exists;
3. recording that new run/artifact inside this document would create another new head.

Therefore this document intentionally **does not claim that an artifact identity written inside it certifies the commit containing the document itself**.

The exact-current-head certification anchor is external to the Git object and consists of all of the following on the same immutable PR head:

- the PR `head_sha`;
- the PR `base_sha`;
- the successful `k3-r3-benchmark` workflow run for that exact head;
- the uploaded `k3-r3-benchmark-evidence-<head-sha>` artifact;
- the raw `k3-r3-results.json` digest;
- the canonical result identity inside that JSON;
- exact-head `governance` and `k2-runtime` results;
- the PR body, which may be updated without moving the Git head and therefore can record the final run/artifact identities without recursion.

**Founder review must use the exact-current-head identities in the PR/checks, not treat an older artifact number embedded in this committed document as current-head certification.**

### 1.2 Recorded predecessor certification

The last certification run that can be recorded inside this ledger without pretending to certify this document's own commit is the predecessor run below:

```text
HEAD: 33e8646f428eb2f0f476c09591980a46c172aa1f
RUN: 31622902265
ARTIFACT ID: 9151951947
RESULT: BENCHMARK_EVIDENCE_READY_FOR_REVIEW
CANONICAL RESULT IDENTITY:
045b85abd0565cd494fde35f0172759c82a16e1f4739f2c882089920746bff65
```

That run verified:

```text
baseSha = 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
headSha = 33e8646f428eb2f0f476c09591980a46c172aa1f
checkedOutHead = 33e8646f428eb2f0f476c09591980a46c172aa1f
canonicalBaseVerified = true
exactHeadCheckoutVerified = true
manifestGitBlobVerified = true
```

This predecessor run is historical evidence for the harness behavior and candidate results. It is **not** represented as certification of the later PR head that contains this document.

## 2. Authority and protocol

Canonical authorization:

- `docs/planning/KODAC_K3_R3_EXTERNAL_ADAPTER_BENCHMARK_AUTHORIZATION_2026-08-12.md`

Benchmark protocol:

- `docs/planning/KODAC_K3_BENCHMARK_AND_EVIDENCE_PROTOCOL_2026-08-12.md`
- protocol id: `KODAC_K3_BENCHMARK_AND_EVIDENCE_PROTOCOL_2026-08-12`

Candidate register:

- `docs/planning/KODAC_K3_ADAPTER_AND_SOURCE_INTAKE_CANDIDATE_REGISTER_2026-08-12.md`

The benchmark preserves the distinction:

```text
syntax / structural evidence != compiler-resolved semantic truth
```

## 3. Fixture and gold identity

Canonical fixture:

```text
fixture id: k3-r1-core-repository-v1
gold schema: k3-r1-gold-evidence-v1
manifest Git blob: 6f812003a4b33e62ad1be672a39c7f42509fc500
verified files: 11
fixture content identity:
fb147c78b55b82958b5fef4362b160d5b78b44c5b56754673e982d3aaf2d13e3
```

The final-gate harness fails closed unless:

- PR base equals the canonical K3-R3 baseline;
- checked-out `HEAD` equals the declared PR head;
- the manifest's actual Git blob equals the canonical manifest blob;
- every declared fixture file matches its manifest digest before candidate execution;
- every declared fixture file still matches afterward;
- the raw manifest bytes and Git blob still match afterward;
- the fixture root remains inside the workspace, including Windows cross-drive cases;
- the canonical traversal and symlink-target escape cases are rejected.

The workflow also triggers when `packages/kodac-runtime/test/fixtures/k3-r1/**` changes.

## 4. Workspace mutation attestation

The final-gate workflow records a clean Git workspace before and after candidate execution using:

```text
git status --porcelain=v1 -z --untracked-files=all --ignored=matching
```

and a binary diff against `HEAD`.

This includes ignored paths as well as ordinary tracked/untracked state. The before/after snapshots must be identical and empty.

Candidate binaries are downloaded only to GitHub runner temporary storage, outside the checked-out repository.

## 5. Exact candidate identities

### ast-grep

```text
version: 0.45.1
Linux x86_64 artifact SHA-256:
76fb6555be6734fb5057dba8d2fb756430f374bb9e1af694cf1ce00e13238d63
license: MIT
evidence class: parser-derived
adapter config: k3-r3-ast-grep-structural-v1
```

### Tree-sitter

```text
CLI version: 0.26.12
Linux x64 artifact SHA-256:
c33ace12fa7a94d09c97054da621bf7a6a3159f765b1839a898232de283d641d
TypeScript grammar identity:
75b3874edb2dc714fb1fd77a32013d0f8699989f
license: MIT
```

### SCIP

```text
version: 0.9.0
Linux amd64 archive SHA-256:
fc2e7273e110be9f35924da1066000183791e8bfdb0391355de6eaaa070fec75
license: Apache-2.0
```

### LSP

```text
specification identity: 3.18
concrete server executed: none
mode: protocol capability assessment only
```

## 6. Measured ast-grep claim surface

The benchmark deliberately measures only structural AST claims appropriate to ast-grep.

Exact structural queries:

```text
symbol-add:
add

symbol-meaning:
meaning

symbol-widget:
class Widget { readonly source = $VALUE }
```

Each query suite is executed twice; normalized outputs must be identical.

Already observed predecessor certification results:

| Symbol/case | Observed | Expected | Precision | Recall |
| --- | ---: | ---: | ---: | ---: |
| `add` structural occurrences | 5 | 5 | `1.0` | `1.0` |
| `meaning` structural occurrence | 1 | 1 | `1.0` | `1.0` |
| `Widget` ambiguous candidate paths | 2 | 2 | exact set | exact set |

Observed `add` locations:

- `src/consumer.ts:1`
- `src/consumer.ts:4`
- `src/math.ts:1`
- `tests/math.test.ts:3`
- `tests/math.test.ts:6`

Observed `meaning` location:

- `src/math.ts:5`

Observed `Widget` candidates:

- `src/ambiguous-a.ts`
- `src/ambiguous-b.ts`

The benchmark explicitly records:

```text
semanticDefinitionReferenceDifferentiation = NOT CLAIMED / NOT MEASURED
```

No semantic disambiguation, call graph, or compiler-resolved reference claim is inferred from these measurements.

## 7. Candidate dispositions

### ast-grep

```text
DISPOSITION: QUALIFIED FOR SPECIFIC ADAPTER ROLE
ROLE: structural symbol occurrence and ambiguous-candidate discovery
```

This does **not** establish ast-grep as:

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

The exact CLI identity can be verified, but TypeScript parser execution is not performed. The identified grammar build/load route can invoke a compiler and is outside the current K3-R3 execution-security envelope.

No negative quality conclusion about Tree-sitter is implied.

### SCIP

```text
DISPOSITION: INSUFFICIENT EVIDENCE
```

The exact SCIP CLI identity can be verified. SCIP consumes semantic indexes but does not itself generate the TypeScript semantic index needed to score compiler-resolved definition/reference accuracy. No concrete TypeScript indexer is authorized.

No negative quality conclusion about SCIP as a protocol is implied.

### LSP

```text
DISPOSITION: SECURITY REVIEW REQUIRED
```

No concrete language server is executed. A server may load project configuration, package resolution, plugins, compiler/tool chains, or network behavior; any concrete server requires a separately reviewed security envelope.

### K3-R2 built-in baseline

```text
STATUS: CANONICAL BASELINE
ROLE: freshness, provenance, exact repository/workspace-state truth anchor
```

The external benchmark does not replace K3-R2.

## 8. Required final-gate invariants

The exact-current-head artifact is acceptable only if it records all of the following:

```text
canonicalBaseIdentityGuard = true
exactHeadCheckoutGuard = true
fixtureManifestGitBlobGuard = true
fixtureManifestPostRunBlobGuard = true
fixtureManifestPostRunBytesGuard = true
snapshotFreshnessGuard = true
evidenceSourceProvenanceCompleteness = true
unauthorizedWorkspaceMutationsObservedByHarness = 0
pathEscapesObserved = 0
canonicalTraversalCaseRejected = true
canonicalSymlinkTargetEscapeRejected = true
unlabeledModelHypothesesAsVerifiedFacts = 0
```

If any invariant fails, the exact-head benchmark is not certification evidence.

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

No `best`, `winner`, or `superior` claim is authorized by this evidence.

## 10. Hardening history

Earlier heads are engineering history, not current-head certification:

1. `241f9d033c747f81d1f7c814095b9fdd3b8129df` — deprecated `sg` shim selected; fixed to prefer `ast-grep`.
2. `2ec65cd50fd64a9b5feb451dc0e1cc5fd1bc157e` — semantic overreach in query design; narrowed to honest structural claims.
3. `e3c3fe64a52c4b5912c07b01a58cae8e6953fc88` — transient release HTTP `503`; bounded retries added while retaining SHA-256 verification.
4. `6f76e89f452e025b67b42f5d9d3147dd5f1894ea` — bare `Widget` query unsuitable; replaced by bounded class-structure query.
5. `115ea7c656febc37447b8fd6f6fcedd798cdf975` — successful functional evidence, later superseded because default PR checkout provenance was a synthetic merge ref.
6. `f1d79e7467c6ab06b3867d86be249f7695c431b2` — successful confirmatory evidence with the same provenance limitation.
7. `d7c62c21636f882e393085540213cfcfb4e24450` — exact PR-head checkout and base binding added.
8. `33e8646f428eb2f0f476c09591980a46c172aa1f` — independent harness identity checks added; predecessor certification run succeeded.
9. `a3337339a63f4d5145dc8578734a8fc3c1c1257d` — predecessor exact-head run reproduced the same measured results; later review identified additional freshness/workspace/input-trigger/traceability hardening requirements.

The final founder-review gate must use the later exact-current-head run produced after all review findings are addressed.

## 11. Governance truth

```text
K3-R3 BENCHMARK: EXECUTED FOR AUTHORIZED SLICE
AST-GREP: NARROW STRUCTURAL QUALIFICATION ONLY, SUBJECT TO FINAL EXACT-HEAD CONFIRMATION
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

A protected merge of this PR, if separately founder-authorized after exact-current-head CI, benchmark evidence, and review are clean, may canonically adopt only:

- the K3-R3 benchmark harness/evidence method;
- the benchmark evidence for the exact reviewed head;
- the narrow candidate dispositions documented above.

It must not be interpreted as authorization to:

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