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
| Benchmarked predecessor head | `7fc1dba7f8728f1fa2d242f66388a2143a8e47ae` |
| Governance run | `31643051000` — `SUCCESS` |
| K2 runtime run | `31643051021` — `SUCCESS` |
| Benchmark run | `31643051035` — `SUCCESS` |
| Benchmark run number | `33` |
| Artifact id | `9159618914` |
| Artifact name | `k3-r3-benchmark-evidence-7fc1dba7f8728f1fa2d242f66388a2143a8e47ae` |
| Artifact ZIP digest | `sha256:82fcb7cd3df0beb4d15b0a0e2182f4d62f94ad540a4948d5cdb01cc0ae4902f0` |
| Raw `k3-r3-results.json` SHA-256 | `e7fc559fdd694b8afd8c429975fee7aea0d08e03fe4a4f2e6650b5a68ba28a35` |
| Canonical result identity | `76dd17260ae6a6826740f2fc02203df7f2dec5675674dca327d38d7cd6bff618` |
| Overall result | `BENCHMARK_EVIDENCE_READY_FOR_REVIEW` |

Artifact identity:

```text
benchmarkHead = 7fc1dba7f8728f1fa2d242f66388a2143a8e47ae
canonicalBaseline = 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
```

## 4. Execution isolation and write-denial evidence

The predecessor benchmark runs the harness and candidate subprocesses as a dedicated non-root `kodacbench` identity that does not own any checkout path.

Before candidate execution the workflow:

- makes the checkout readable/traversable to the benchmark identity;
- explicitly strips group/other write bits from every regular checkout directory and file;
- fails if any checkout path is owned by the benchmark UID;
- requires new-file `touch` probes against both workspace and fixture to fail.

The harness then independently requires both forms of write denial for each protected root:

1. exclusive creation of a new probe file must fail; and
2. a known existing file must fail to open with `r+` write access.

The existing-file probes are:

```text
workspace: .github/workflows/k3-r3-benchmark.yml
fixture:   manifest.json
```

The expected execution UID is parsed with exact JavaScript numeric conversion (`Number(...)`) and then required to be a positive integer. Inputs containing trailing or otherwise non-numeric characters therefore fail closed before candidate execution.

Artifact evidence remains:

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

The non-owner execution boundary plus explicit mode stripping and both creation/write-open probes close the earlier blind spot where a candidate might otherwise mutate an already-existing writable file and restore it before the post-run snapshot.

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

The subprocess observation is measured rather than derived:

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
- unprivileged non-owner candidate execution;
- explicit removal of group/other write bits from checkout files/directories;
- workflow-level new-file write probes;
- harness-level new-file creation denial plus existing-file `r+` write-open denial;
- final result-parent revalidation and exclusive result creation;
- measured ast-grep subprocess counting;
- exact fail-closed numeric parsing of the expected benchmark UID.

The latest valid finding was raised against:

```text
e584ee155fd3f34d55ddbcbfad54e4c36efabfaf
```

It identified that `Number.parseInt(...)` could accept an execution-UID string with trailing non-numeric characters. The functional correction was committed as:

```text
dead000a5382fce60ce8c7123576665b098dc5f9
```

A follow-up formatting-only commit restored the pre-existing terminal newline so that the cumulative source diff from the reviewed predecessor contains only the intended one-line parsing change:

```text
7fc1dba7f8728f1fa2d242f66388a2143a8e47ae
```

The predecessor run on `7fc1dba7...` passed governance, K2 runtime, and the bounded K3-R3 benchmark with unchanged measured qualification outcomes and produced the artifact identified above.

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
5. unprivileged execution, strict numeric execution-UID parsing, stripped checkout write bits, new-file and existing-file write-denial, executable identity, path/freshness, result-output TOCTOU, and mutation guards pass;
6. exact path/line/column metrics remain correct;
7. the measured ast-grep subprocess count is present and truthful;
8. fresh Cubic exact-head review has zero valid unresolved findings;
9. all review threads are resolved;
10. scope remains limited to the authorized three K3-R3 files and canonical main remains compatible with the authorized baseline.

Only then may the PR be marked **Ready for Founder Review**.

Merge remains subject to separate explicit founder authorization.

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
