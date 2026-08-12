# Kodac K3-R3 External Adapter Benchmark Evidence — 2026-08-12

## Status

```text
K3-R3 BENCHMARK EXECUTION: COMPLETE FOR THE AUTHORIZED SLICE
COMMITTED EVIDENCE LEDGER: READY FOR EXACT-HEAD CONFIRMATION
CANONICAL ADOPTION: NOT ESTABLISHED BY THIS DOCUMENT ALONE
K3-R4 SOURCE INTAKE: NOT AUTHORIZED
```

This record captures the bounded K3-R3 benchmark method, observed results, review hardening, and founder-review boundary under canonical `main`:

```text
9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

It does not admit any external implementation, dependency, binary, storage engine, protocol server, or donor source into Kodac.

## 1. Certification identity model

### 1.1 The committed ledger is not self-attesting

A committed document cannot contain the GitHub Actions artifact produced for the commit containing that same document without creating a self-reference cycle:

1. editing this document creates a new PR head;
2. the benchmark for that head runs only after the commit exists;
3. recording the resulting run or artifact inside this file would create another new head.

Therefore:

- this document may record a fully verified **predecessor** benchmark run;
- the exact-current-head certification anchor must live outside the commit, in PR metadata plus immutable GitHub Actions run/artifact identity;
- a merge decision must verify that the PR head, CI runs, Cubic review, and external artifact all refer to the same exact head.

The predecessor record below is evidence of benchmark behavior and hardening. It is not a substitute for the final exact-current-head run.

## 2. Authorized benchmark boundary

K3-R3 remains limited to external-adapter benchmarking against the canonical K3-R1 fixture and K3-R2 truth anchor.

Permitted candidate roles in this slice:

- `ast-grep`: structural search / parser-derived candidate discovery;
- Tree-sitter CLI: identity and capability assessment only;
- SCIP CLI: identity and protocol-capability assessment only;
- LSP `3.18`: protocol-capability assessment only;
- K3-R2 built-in exact snapshot: canonical freshness/provenance/workspace-state baseline.

Not authorized by K3-R3:

- donor/source intake;
- copying, adapting, vendoring, or importing candidate source;
- adding candidate packages to Kodac dependencies or lockfiles;
- persistent external binaries;
- concrete language-server execution;
- Tree-sitter TypeScript parser execution requiring a grammar build/load security envelope;
- a TypeScript SCIP indexer;
- persistent storage;
- vector or embedding infrastructure;
- K3-R4 source intake;
- public `best`, `winner`, or `superior` claims;
- release/package/brand launch;
- ruleset changes.

`code_import_authorized=false` remains unchanged.

## 3. Predecessor certification evidence

The latest fully inspected predecessor benchmark after the review-hardening fixes is:

| Field | Value |
| --- | --- |
| Branch | `bench/k3-r3-external-adapter-evidence` |
| Canonical base | `9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc` |
| Benchmarked exact predecessor head | `9cc0962e2f47482f127da28bbe998a74d5959b74` |
| GitHub Actions benchmark run | `31627108304` |
| Run number | `13` |
| Conclusion | `SUCCESS` |
| Artifact id | `9153535187` |
| Artifact name | `k3-r3-benchmark-evidence-9cc0962e2f47482f127da28bbe998a74d5959b74` |
| Artifact ZIP digest | `sha256:558404bde75833f1217db94ff3cb66e0ce9c605249f3445242feda28b3f535b4` |
| Raw `k3-r3-results.json` SHA-256 | `3fceb09684a441e3dc48fcf50efd62fdc71f41ebd2bddc836147b31c136deeff` |
| Canonical result identity | `f5af8ef7d4867749f89e860cd046c6c14f8bd51b66ce992af3289cadb1f674d8` |
| Overall result | `BENCHMARK_EVIDENCE_READY_FOR_REVIEW` |

The artifact itself records:

```text
benchmarkHead = 9cc0962e2f47482f127da28bbe998a74d5959b74
canonicalBaseline = 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

## 4. Fail-closed identity and freshness evidence

The predecessor artifact records all of the following as true:

```text
canonicalBaseIdentityGuard = true
exactHeadCheckoutGuard = true
realpathWorkspaceContainmentGuard = true
fixtureManifestGitBlobGuard = true
fixtureManifestPostRunBlobGuard = true
fixtureManifestPostRunBytesGuard = true
fixtureFullTreeInventoryGuard = true
snapshotFreshnessGuard = true
evidenceSourceProvenanceCompleteness = true
workspaceFullTreeMutationGuard = true
canonicalTraversalCaseRejected = true
canonicalSymlinkTargetEscapeRejected = true
```

The fixture full-tree snapshot contained `19` entries and remained byte-identity stable across execution.

The harness also measured the checked-out workspace tree directly, excluding only top-level `.git` metadata:

```text
workspace entry count = 310
workspace tree identity unchanged = true
unauthorizedWorkspaceMutationsObservedByHarness = 0
```

This value is derived from measured pre/post workspace-tree snapshots. It is not a hardcoded assertion.

The outer GitHub Actions workflow separately performs tracked, untracked, and ignored-path checkout attestation before and after the benchmark, providing an independent second mutation guard.

## 5. ast-grep result

Disposition:

```text
QUALIFIED FOR SPECIFIC ADAPTER ROLE
ROLE: structural symbol occurrence and ambiguous-candidate discovery
```

Measured structural occurrences against the canonical K3-R1 gold evidence:

| Query | True positive | Observed | Expected | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| `add` structural occurrences | 5 | 5 | 5 | 1.0 | 1.0 |
| `meaning` structural occurrence | 1 | 1 | 1 | 1.0 | 1.0 |

Both canonical ambiguous `Widget` candidates were preserved.

Repeated normalized output was deterministic.

Evidence provenance was complete.

The qualification is deliberately narrow:

```text
semanticDefinitionReferenceDifferentiation = NOT CLAIMED / NOT MEASURED
semanticStrength = structural-only-not-compiler-resolved
```

This benchmark does not establish compiler-resolved symbol identity, semantic references, type flow, call-graph correctness, or product-wide superiority.

## 6. Tree-sitter result

Disposition:

```text
SECURITY REVIEW REQUIRED
```

The exact Tree-sitter CLI identity and artifact digest are verified in the benchmark environment, but TypeScript parser execution is not performed.

Reason: the required grammar build/load path can invoke compiler/build behavior outside the current K3-R3 execution-security envelope.

No Tree-sitter source or dependency intake is authorized.

## 7. SCIP result

Disposition:

```text
INSUFFICIENT EVIDENCE
```

The exact SCIP CLI identity and artifact digest are verified, but the CLI consumes semantic indexes and does not itself create the TypeScript semantic index required for gold definition/reference evaluation.

No concrete TypeScript SCIP indexer is authorized in this gate.

## 8. LSP result

Disposition:

```text
SECURITY REVIEW REQUIRED
```

Only the LSP `3.18` protocol capability is assessed.

No concrete language server is installed or started because a server may load project configuration, package resolution, plugins, compilers, tools, or network behavior.

## 9. K3-R2 baseline

The K3-R2 built-in exact snapshot remains canonical and remains the repository/workspace truth anchor for:

- freshness;
- exact Git snapshot identity;
- provenance;
- repository/workspace state.

K3-R3 candidate qualification does not replace K3-R2 and does not establish an external system as Kodac's canonical source of truth.

## 10. Review-hardening history

Accepted review findings were fixed before this ledger reconciliation.

### Earlier hardening

- checkout changed from synthetic PR merge ref to exact PR head;
- canonical base SHA bound fail-closed;
- fixture manifest Git blob verified;
- manifest raw bytes and blob rechecked after execution;
- Windows cross-drive containment guarded;
- ignored-path checkout mutation attestation added;
- fixture path added to workflow trigger scope;
- committed-ledger vs exact-current-head certification roles separated.

### Latest hardening

Three additional exact-head Cubic findings on predecessor head `8291522a1337e3774c8fd297bb2b73e3c47b10d6` were accepted:

1. manifest-listed digests alone did not detect added or removed fixture files;
2. lexical containment alone did not reject a symlinked fixture root escaping the workspace;
3. workspace-mutation evidence was represented as a hardcoded zero rather than a measured value.

Commit:

```text
9cc0962e2f47482f127da28bbe998a74d5959b74
```

resolved them by adding:

- full fixture-tree pre/post inventory and content hashing;
- `realpathSync` resolution of both workspace and fixture roots before containment evaluation;
- full worktree pre/post hashing inside the harness, excluding only `.git` metadata;
- a measured `unauthorizedWorkspaceMutationsObservedByHarness` value;
- explicit full-tree fixture and workspace invariant fields in the artifact.

Cubic marked all three corresponding review threads addressed on that commit.

## 11. Reproducibility and claim limits

The canonical result identity excludes observations that are expected to vary by run, such as timing and runner environment details, while preserving stable benchmark evidence and exact head/base identity.

The benchmark does not claim:

- cross-platform external-candidate performance equivalence;
- peak-memory characterization;
- compiler-resolved semantics;
- LSP server safety;
- Tree-sitter parser safety for this execution envelope;
- SCIP TypeScript indexing quality;
- external candidate adoption.

Any future claim must be traceable to a benchmark dimension and exact evidence identity.

## 12. Founder review boundary

A final exact-current-head certification must verify, on the same PR head:

1. `governance = SUCCESS`;
2. `k2-runtime = SUCCESS` including required `k2-runtime-gate`;
3. `k3-r3-benchmark = SUCCESS`;
4. the uploaded benchmark artifact names and records that exact head;
5. full-tree freshness and measured workspace-mutation guards pass;
6. fresh Cubic exact-head review completes without valid unresolved findings;
7. review-thread resolution is complete;
8. PR scope remains exactly the authorized K3-R3 evidence/harness scope;
9. canonical `main` has not moved incompatibly from the authorized baseline.

Only after those checks may the PR be marked ready for founder merge review.

Even then, merge is a separate founder decision.

## Final statement

```text
K3-R3 BENCHMARK SLICE: EXECUTED
AST-GREP: NARROW STRUCTURAL ROLE QUALIFIED
TREE-SITTER: SECURITY REVIEW REQUIRED
SCIP: INSUFFICIENT EVIDENCE
LSP: SECURITY REVIEW REQUIRED
K3-R2: REMAINS CANONICAL TRUTH ANCHOR
SOURCE INTAKE: NOT AUTHORIZED
NEW KODAC DEPENDENCIES: NOT AUTHORIZED
K3-R4+: NOT AUTHORIZED
CURRENT COMMIT: REQUIRES EXTERNAL EXACT-HEAD CERTIFICATION AFTER COMMIT
```
