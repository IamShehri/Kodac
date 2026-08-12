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

This record does not admit external source, dependencies, permanent binaries, storage, vector infrastructure, language servers, or donor code into Kodac. `code_import_authorized=false` remains unchanged.

## 1. Certification identity model

This committed ledger is deliberately not self-attesting. The artifact for the commit containing this file can exist only after the commit exists; embedding that artifact identity would create another commit and therefore another head.

Accordingly:

- this file records the latest fully inspected **predecessor** benchmark evidence;
- exact-current-head certification is anchored externally by PR metadata plus immutable GitHub Actions run/artifact identity for the same head;
- founder review must verify PR head, canonical base, scope, CI, artifact, review result, and review-thread state all refer to one exact state.

## 2. Authorized benchmark boundary

Permitted evaluation roles remain:

- `ast-grep`: structural search / parser-derived candidate discovery;
- Tree-sitter CLI: identity/capability assessment only;
- SCIP CLI: identity/protocol-capability assessment only;
- LSP `3.18`: protocol-capability assessment only;
- K3-R2 exact snapshot: canonical freshness/provenance/workspace-state anchor.

Not authorized:

- source/dependency intake, copying, adaptation, or vendoring;
- permanent candidate binaries;
- concrete language-server execution;
- Tree-sitter TypeScript parser execution under a broader security envelope;
- a TypeScript SCIP indexer;
- persistent storage;
- vector/embedding infrastructure;
- K3-R4+;
- product-level `best`, `winner`, or `superior` claims;
- public release/package/brand launch;
- ruleset changes.

## 3. Latest inspected predecessor certification

| Field | Value |
| --- | --- |
| Branch | `bench/k3-r3-external-adapter-evidence` |
| Canonical base | `9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc` |
| Benchmarked predecessor head | `c5c9276f1c54ad5af09516242a85f0d42e9f8f92` |
| Governance run | `31638957253` — `SUCCESS` |
| K2 runtime run | `31638957233` — `SUCCESS` |
| Benchmark run | `31638957215` — `SUCCESS` |
| Benchmark run number | `27` |
| Artifact id | `9158070696` |
| Artifact name | `k3-r3-benchmark-evidence-c5c9276f1c54ad5af09516242a85f0d42e9f8f92` |
| Artifact ZIP digest | `sha256:9c90d1b68fde8c549ec3c33c8b19fc2b95538ec3b161a1ee4a145dc1fcbb3696` |
| Raw `k3-r3-results.json` SHA-256 | `aec639fdbb4ec4c78a8ee9454596f3ab880e321295b041d1a255ec4a224b6c62` |
| Canonical result identity | `0c90c1a5479d59a2d562a73e6d9ce51e957592bde5fbff4f02dd8dc6ee9025a0` |
| Overall result | `BENCHMARK_EVIDENCE_READY_FOR_REVIEW` |

Artifact identity:

```text
benchmarkHead = c5c9276f1c54ad5af09516242a85f0d42e9f8f92
canonicalBaseline = 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

## 4. Execution isolation and mutation evidence

The predecessor benchmark runs the harness and candidate subprocesses as a dedicated non-root `kodacbench` identity that does not own the checkout or canonical fixture. The workflow makes the checkout readable/traversable to that identity but does not grant write permission, and both the workflow and harness require write probes against the workspace and fixture to fail before candidate execution.

Artifact evidence:

```text
expectedUid = 999
actualUid = 999
unprivilegedExecution = true
workspaceWriteDenied = true
fixtureWriteDenied = true

unprivilegedExecutionGuard = true
workspaceWriteDeniedGuard = true
fixtureWriteDeniedGuard = true
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

The non-owner execution boundary closes the earlier before/after-snapshot blind spot where a candidate could theoretically mutate and restore fixture/workspace bytes during execution. The candidate identity is not permitted to perform that write in the first place.

The outer workflow independently attests tracked, untracked, and ignored checkout state before and after execution.

## 5. Result-output TOCTOU evidence

The result path must be outside the checked-out workspace and must not pre-exist. After all candidate execution and before writing evidence, the harness resolves the output parent again, requires it to be the same real parent originally validated and still outside the workspace, then creates the result with exclusive-create semantics (`wx`).

Artifact guards:

```text
resultOutputFinalContainmentGuard = true
resultExclusiveCreateGuard = true
```

This prevents a late path/symlink substitution from silently redirecting benchmark evidence into the repository or another pre-existing target.

## 6. Identity, provenance, path, and freshness guards

The inspected artifact records all of the following as true:

```text
canonicalBaseIdentityGuard
exactHeadCheckoutGuard
candidateExecutableDigestGuard
candidateExecutableDistinctnessGuard
candidateVersionIdentityGuard
unprivilegedExecutionGuard
workspaceWriteDeniedGuard
fixtureWriteDeniedGuard
resultOutputFinalContainmentGuard
resultExclusiveCreateGuard
realpathWorkspaceContainmentGuard
perEntryRealpathContainmentGuard
symlinkTargetContainmentGuard
fixtureManifestGitBlobGuard
fixtureManifestPostRunBlobGuard
fixtureManifestPostRunBytesGuard
fixtureFullTreeInventoryGuard
snapshotFreshnessGuard
evidenceSourceProvenanceCompleteness
workspaceFullTreeMutationGuard
canonicalTraversalCaseRejected
canonicalSymlinkTargetPathStringRejected
```

The virtual manifest `symlink-escape` case remains truthfully described only as a **symlink-target path-string rejection**. Real symlink containment is enforced separately through `realpathSync` containment in per-entry and full-tree handling.

Unknown fixture `expected.kind` values fail closed. `binary` uses raw bytes; the canonical listed text kinds use UTF-8/LF-normalized bytes.

## 7. Candidate executable and measured version identity

The workflow verifies immutable archive SHA-256 pins, requires exactly one executable match per candidate, and verifies each selected executable against an independently committed executable SHA-256 before the harness runs.

The harness additionally requires all three executable realpaths and SHA-256 values to be distinct and requires measured version identity output to match the declared version exactly.

| Candidate | Declared version | Measured identity output | Executable SHA-256 |
| --- | --- | --- | --- |
| ast-grep | `0.45.1` | `ast-grep 0.45.1` | `6a66162e0a2447af4b7524ee04195239eb1911d07f4868f918909e7d4f453eea` |
| Tree-sitter CLI | `0.26.12` | `tree-sitter 0.26.12` | `bb749301651689aeeec0bdbc7fa390a7f9ee21f249249de8cf0afa760b143e44` |
| SCIP CLI | `0.9.0` | `scip version v0.9.0` | `c1f2e049b5b33b8de73e90212aeec4ad10d49be858d01f11c86386b5bfc53994` |

## 8. ast-grep result

Disposition:

```text
QUALIFIED FOR SPECIFIC ADAPTER ROLE
ROLE: structural symbol occurrence and ambiguous-candidate discovery
```

Column-aware exact occurrence metrics on canonical K3-R1 gold evidence:

| Query | True positive | Observed | Expected | Precision | Recall |
| --- | ---: | ---: | ---: | ---: | ---: |
| `add` | 5 | 5 | 5 | 1.0 | 1.0 |
| `meaning` | 1 | 1 | 1 | 1.0 | 1.0 |

Exact measured locations:

```text
src/consumer.ts:1:10      add
src/consumer.ts:4:10      add
src/math.ts:1:17          add
tests/math.test.ts:3:10   add
tests/math.test.ts:6:16   add
src/math.ts:5:14          meaning
```

Both canonical ambiguous `Widget` candidates were preserved. Repeated normalized output was deterministic and provenance complete.

The subprocess observation is now measured rather than derived:

```text
astGrepSubprocessCount = 7
```

That count includes the successful ast-grep identity invocation plus six structural-query invocations across the two deterministic suites.

Qualification remains narrow:

```text
semanticDefinitionReferenceDifferentiation = NOT CLAIMED / NOT MEASURED
semanticStrength = structural-only-not-compiler-resolved
```

No compiler-resolved semantics, semantic reference classification, type flow, call-graph correctness, or system-wide superiority is established.

## 9. Other candidate dispositions

### Tree-sitter

```text
SECURITY REVIEW REQUIRED
```

CLI archive/executable/version identity is verified. TypeScript parser execution remains outside the current execution-security authorization.

### SCIP

```text
INSUFFICIENT EVIDENCE
```

CLI archive/executable/version identity is verified. No authorized TypeScript semantic indexer exists in this gate.

### LSP

```text
SECURITY REVIEW REQUIRED
```

Only LSP `3.18` protocol capability is assessed; no concrete language server is installed or started.

### K3-R2

K3-R2 remains the canonical exact-snapshot / Git-derived freshness, provenance, and repository/workspace-state anchor.

## 10. Review-hardening history

Accepted Cubic findings have successively hardened:

- exact PR-head checkout and canonical-base binding;
- manifest blob and post-run byte/blob verification;
- fixture workflow trigger coverage;
- ignored-path mutation attestation;
- cross-drive and realpath containment;
- full fixture/workspace tree inventories and measured mutation counts;
- per-entry and symlink-target realpath containment;
- truthful removal/renaming of non-measured path-security claims;
- unsupported fixture-kind rejection;
- result-output containment outside the workspace;
- unique candidate-binary selection;
- independently pinned executable SHA-256 values;
- exact `path:line:column` structural metrics;
- distinct candidate executable realpath/digest enforcement;
- measured candidate-version binding;
- unprivileged non-owner candidate execution with fail-closed workspace/fixture write probes;
- final result-parent revalidation and exclusive result creation;
- measured ast-grep subprocess counting.

The three latest findings raised against:

```text
e847a47914210b20ea6b07c8cc8b39bf9b1d2209
```

were implemented through the isolation/output/count hardening sequence ending at:

```text
c5c9276f1c54ad5af09516242a85f0d42e9f8f92
```

Intermediate attempts that failed before candidate execution because GitHub Releases returned HTTP `503`, or because the first sandbox permission configuration prevented read traversal, were not treated as benchmark evidence. The final predecessor run succeeded with the hardened execution boundary and produced the artifact identified above.

## 11. Claim limits

The benchmark does not claim:

- cross-platform external-candidate performance equivalence;
- peak-memory characterization;
- compiler-resolved semantics;
- LSP server safety;
- Tree-sitter TypeScript parser safety under a broader execution envelope;
- SCIP TypeScript indexing quality;
- a real synthetic symlink-escape test from the virtual manifest case;
- external candidate adoption.

Any future claim must be traceable to an exact benchmark dimension and evidence identity.

## 12. Founder review boundary

A final exact-current-head certification must verify on one identical PR head:

1. `governance = SUCCESS`;
2. `k2-runtime = SUCCESS`, including `k2-runtime-gate`;
3. `k3-r3-benchmark = SUCCESS`;
4. artifact head/base match that exact PR state;
5. unprivileged/write-denied, executable identity, path/freshness, result-output TOCTOU, and mutation guards pass;
6. exact path/line/column metrics remain correct;
7. the measured ast-grep subprocess count is present and truthful;
8. fresh Cubic exact-head review has zero valid unresolved findings;
9. all review threads are resolved;
10. scope remains limited to the authorized three K3-R3 files and canonical main remains compatible with the authorized baseline.

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
