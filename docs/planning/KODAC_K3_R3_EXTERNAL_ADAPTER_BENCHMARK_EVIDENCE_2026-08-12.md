# Kodac K3-R3 External Adapter Benchmark Evidence — 2026-08-12

## Status

```text
K3-R3 BENCHMARK EXECUTION: COMPLETE FOR THE AUTHORIZED SLICE
COMMITTED EVIDENCE LEDGER: READY FOR EXACT-HEAD CONFIRMATION
CANONICAL ADOPTION: NOT ESTABLISHED BY THIS DOCUMENT ALONE
K3-R4 SOURCE INTAKE: NOT AUTHORIZED
```

Canonical authorization baseline:

```text
9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

This record does not admit any external implementation, dependency, binary, storage engine, protocol server, or donor source into Kodac.

## 1. Certification identity model

This committed ledger is deliberately not self-attesting. A GitHub Actions artifact for the commit containing this file exists only after that commit is created. Embedding that artifact identity would create another commit and therefore another head.

Accordingly:

- this file records the latest fully inspected **predecessor** benchmark evidence;
- the exact-current-head certification anchor is the PR metadata plus immutable GitHub Actions run/artifact identity for the same head;
- founder merge review must verify PR head, CI, artifact, Cubic review, scope, and canonical base all refer to the same exact state.

## 2. Authorized boundary

K3-R3 remains a bounded external-adapter benchmark against the canonical K3-R1 fixture and K3-R2 truth anchor.

Permitted evaluation roles:

- `ast-grep`: structural search / parser-derived candidate discovery;
- Tree-sitter CLI: identity and capability assessment only;
- SCIP CLI: identity and protocol-capability assessment only;
- LSP `3.18`: protocol-capability assessment only;
- K3-R2 exact snapshot: canonical freshness/provenance/workspace-state baseline.

Not authorized:

- donor/source intake or code copying/adaptation/vendoring;
- candidate packages in Kodac dependencies or lockfiles;
- permanent external binaries;
- concrete language-server execution;
- Tree-sitter TypeScript parser execution under a new security envelope;
- a TypeScript SCIP indexer;
- persistent storage;
- vector/embedding infrastructure;
- K3-R4+;
- public `best`, `winner`, or `superior` claims;
- release/package/brand launch;
- ruleset changes.

`code_import_authorized=false` remains unchanged.

## 3. Latest inspected predecessor certification

| Field | Value |
| --- | --- |
| Branch | `bench/k3-r3-external-adapter-evidence` |
| Canonical base | `9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc` |
| Benchmarked predecessor head | `cf4715b8cb54f412b400c3a41d1696b496cf31e3` |
| Governance run | `31628826551` — `SUCCESS` |
| K2 runtime run | `31628826506` — `SUCCESS` |
| Benchmark run | `31628826428` — `SUCCESS` |
| Benchmark run number | `15` |
| Artifact id | `9154212840` |
| Artifact name | `k3-r3-benchmark-evidence-cf4715b8cb54f412b400c3a41d1696b496cf31e3` |
| Artifact ZIP digest | `sha256:0248be1e4ffd545cd217a3d32f1861b744ba484035e3e30ec7905a42f9e15a5d` |
| Raw `k3-r3-results.json` SHA-256 | `8a1c13dbd68fcda3d559fe4468746a7c8abe2385d8fd1f2aee1ff85d0d6941a6` |
| Canonical result identity | `0f6b6ed86722149987f94d41d23196444e8ae7231b0de2b7edf52e38ade13d5a` |
| Overall result | `BENCHMARK_EVIDENCE_READY_FOR_REVIEW` |

The artifact records:

```text
benchmarkHead = cf4715b8cb54f412b400c3a41d1696b496cf31e3
canonicalBaseline = 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

## 4. Fail-closed identity, path, and freshness evidence

The predecessor artifact records the following guards as true:

```text
canonicalBaseIdentityGuard = true
exactHeadCheckoutGuard = true
realpathWorkspaceContainmentGuard = true
perEntryRealpathContainmentGuard = true
symlinkTargetContainmentGuard = true
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

Measured tree state:

```text
fixture full-tree entries = 19
fixture full-tree mutation count = 0
fixture full-tree unchanged = true
workspace entries = 310
workspace mutation count = 0
workspace unchanged = true
unauthorizedWorkspaceMutationsObservedByHarness = 0
```

The mutation value is a real changed-entry count derived from the union of before/after snapshot paths. It is not a boolean disguised as a count.

Per-entry path truth is fail-closed:

- manifest-listed files are resolved with `realpathSync` and must remain contained by the real fixture root before reading;
- candidate result paths are resolved with `realpathSync` and must remain contained before normalization;
- symlink entries in full-tree snapshots have their resolved targets containment-checked before evidence is recorded;
- contained symlink file targets include a content digest in the snapshot evidence;
- fixture and workspace roots themselves are resolved before containment checks.

The previous literal `pathEscapesObserved: 0` field was removed because successful fail-closed execution cannot honestly present that constant as an independently measured counter. Path safety is represented by explicit containment guards and rejection cases instead.

The outer GitHub Actions workflow separately attests tracked, untracked, and ignored checkout state before and after execution.

## 5. ast-grep result

Disposition:

```text
QUALIFIED FOR SPECIFIC ADAPTER ROLE
ROLE: structural symbol occurrence and ambiguous-candidate discovery
```

Measured on canonical K3-R1 gold evidence:

| Query | True positive | Observed | Expected | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| `add` structural occurrences | 5 | 5 | 5 | 1.0 | 1.0 |
| `meaning` structural occurrence | 1 | 1 | 1 | 1.0 | 1.0 |

Both canonical ambiguous `Widget` candidates were preserved. Repeated normalized output was deterministic and evidence provenance was complete.

The qualification remains narrow:

```text
semanticDefinitionReferenceDifferentiation = NOT CLAIMED / NOT MEASURED
semanticStrength = structural-only-not-compiler-resolved
```

This does not establish compiler-resolved symbol identity, semantic references, type flow, call-graph correctness, or product-wide superiority.

## 6. Other candidate dispositions

### Tree-sitter

```text
SECURITY REVIEW REQUIRED
```

CLI identity/artifact evidence is verified, but TypeScript parser execution remains outside the authorized execution-security envelope.

### SCIP

```text
INSUFFICIENT EVIDENCE
```

The CLI consumes semantic indexes but does not itself create the TypeScript semantic index required for definition/reference evaluation. No concrete TypeScript indexer is authorized.

### LSP

```text
SECURITY REVIEW REQUIRED
```

Only LSP `3.18` protocol capability is assessed. No concrete language server is installed or started.

### K3-R2

K3-R2 remains the canonical exact snapshot / Git-derived truth anchor for freshness, provenance, and repository/workspace state.

## 7. Review-hardening history

Accepted Cubic findings were incorporated in successive fail-closed hardening steps, including:

- exact PR-head checkout rather than synthetic merge-ref execution;
- exact canonical-base binding;
- manifest Git-blob verification and post-run byte/blob checks;
- fixture workflow trigger coverage;
- ignored-path checkout mutation attestation;
- Windows cross-drive containment;
- committed-ledger vs exact-current-head artifact separation;
- full fixture-tree inventory/digest;
- root-level realpath containment;
- full worktree hashing with measured mutation count;
- manifest-file per-entry realpath containment;
- candidate-result per-entry realpath containment;
- symlink-target realpath containment in full-tree snapshots;
- removal of the non-measured `pathEscapesObserved` literal.

The latest five findings were raised against head:

```text
91422c0a1b787ba2348e9b9166da08aa7bcf1cdf
```

and addressed by predecessor evidence commit:

```text
cf4715b8cb54f412b400c3a41d1696b496cf31e3
```

## 8. Claim limits

The benchmark does not claim:

- cross-platform external-candidate performance equivalence;
- peak-memory characterization;
- compiler-resolved semantics;
- LSP server safety;
- Tree-sitter parser safety for a broader execution envelope;
- SCIP TypeScript indexing quality;
- external candidate adoption.

Any future claim must be traceable to an exact benchmark dimension and evidence identity.

## 9. Founder review boundary

A final exact-current-head certification must verify, on one identical PR head:

1. `governance = SUCCESS`;
2. `k2-runtime = SUCCESS`, including `k2-runtime-gate`;
3. `k3-r3-benchmark = SUCCESS`;
4. the uploaded artifact records that exact head and canonical base;
5. per-entry realpath, symlink containment, full-tree freshness, and measured workspace-mutation guards pass;
6. fresh Cubic exact-head review completes without valid unresolved findings;
7. all review threads are resolved;
8. scope remains limited to the authorized K3-R3 harness/workflow/evidence files;
9. canonical `main` remains compatible with the authorized baseline.

Only then may the PR be marked **Ready for Founder Review**.

Merge remains a separate founder decision.

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
