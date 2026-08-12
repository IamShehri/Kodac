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
| Benchmarked predecessor head | `f89cf2f0c0702accd064b8fa9638c9f0cc4a3623` |
| Governance run | `31635771174` — `SUCCESS` |
| K2 runtime run | `31635771183` — `SUCCESS` |
| Benchmark run | `31635771190` — rerun attempt — `SUCCESS` |
| Benchmark run number | `22` |
| Artifact id | `9156910349` |
| Artifact name | `k3-r3-benchmark-evidence-f89cf2f0c0702accd064b8fa9638c9f0cc4a3623` |
| Artifact ZIP digest | `sha256:0230a6709c67d6e64a2fc8e486ba435381c8d33ea07e612bf945aeb5409bdb2f` |
| Raw `k3-r3-results.json` SHA-256 | `cef5bbe2cb25b6cfe5610db5a99999fb9fd0fb3c74d00616c1780fa1b7a960e1` |
| Canonical result identity | `3a3b025261a44cd97bd76201be1d68f043d7d1b70cebaf5bd301c928e51ba066` |
| Overall result | `BENCHMARK_EVIDENCE_READY_FOR_REVIEW` |

The artifact records:

```text
benchmarkHead = f89cf2f0c0702accd064b8fa9638c9f0cc4a3623
canonicalBaseline = 9e092a9d93fef07a8410b2e9efbb1da9c6f4fadc
checkedOutHead = f89cf2f0c0702accd064b8fa9638c9f0cc4a3623
```

The first attempt of benchmark run `31635771190` failed before candidate execution because the ast-grep GitHub Release endpoint returned repeated HTTP `503` responses. The failed attempt preserved a clean workspace and produced no benchmark result. The bounded failed-job rerun on the identical Git head succeeded; no code change was made to convert that transient network failure into evidence.

## 4. Fail-closed identity, provenance, path, and freshness evidence

The inspected predecessor artifact records the following guards as true:

```text
canonicalBaseIdentityGuard = true
exactHeadCheckoutGuard = true
candidateExecutableDigestGuard = true
candidateExecutableDistinctnessGuard = true
candidateVersionIdentityGuard = true
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
canonicalSymlinkTargetPathStringRejected = true
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

Path and output truth is fail-closed:

- manifest-listed files are resolved with `realpathSync` and must remain contained by the real fixture root before reading;
- candidate result paths are resolved with `realpathSync` and must remain contained before normalization;
- symlink entries in full-tree snapshots have their resolved targets containment-checked before evidence is recorded;
- contained symlink file targets include a content digest in the snapshot evidence;
- fixture and workspace roots themselves are resolved before containment checks;
- `K3_R3_RESULT_PATH` must resolve through a parent outside the checked-out workspace before any result write can occur;
- the virtual `symlink-escape` manifest literal is recorded only as a **symlink target path-string rejection**; it is not presented as a real-symlink execution test;
- real symlink containment is enforced independently by full-tree/per-entry `realpathSync` containment guards.

The previous literal `pathEscapesObserved: 0` field remains removed because successful fail-closed execution cannot honestly present that constant as an independently measured counter.

The outer GitHub Actions workflow separately attests tracked, untracked, and ignored checkout state before and after execution.

## 5. Candidate executable and version identity evidence

Candidate archives remain pinned by immutable release URL/version plus archive SHA-256. The workflow additionally requires **exactly one** executable match for each candidate and checks that executable against an independently committed expected SHA-256 before the harness runs.

The harness then independently requires the three candidate executables to have distinct real paths **and** distinct executable SHA-256 values, preventing one binary or byte-identical copies from satisfying multiple candidate identities.

Validated executable identities for the inspected predecessor are:

| Candidate | Declared version | Measured identity output | Executable SHA-256 |
| --- | --- | --- | --- |
| ast-grep | `0.45.1` | `ast-grep 0.45.1` | `6a66162e0a2447af4b7524ee04195239eb1911d07f4868f918909e7d4f453eea` |
| Tree-sitter CLI | `0.26.12` | `tree-sitter 0.26.12` | `bb749301651689aeeec0bdbc7fa390a7f9ee21f249249de8cf0afa760b143e44` |
| SCIP CLI | `0.9.0` | `scip version v0.9.0` | `c1f2e049b5b33b8de73e90212aeec4ad10d49be858d01f11c86386b5bfc53994` |

The harness fails closed unless those measured identity strings exactly match the declared versions. The executable-digest guard therefore does not derive the “expected” hash from the same binary being checked, and the version claim is not accepted merely because an environment variable says so.

## 6. ast-grep result

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

Occurrence comparison is keyed by exact `path:line:column`, not only `path:line`. Gold columns are deterministically derived from the canonical fixture source at the declared gold line and require exactly one identifier-boundary match on that line.

The inspected exact occurrences are:

```text
src/consumer.ts:1:10      add
src/consumer.ts:4:10      add
src/math.ts:1:17          add
tests/math.test.ts:3:10   add
tests/math.test.ts:6:16   add
src/math.ts:5:14          meaning
```

Both canonical ambiguous `Widget` candidates were preserved. Repeated normalized output was deterministic and evidence provenance was complete.

The qualification remains narrow:

```text
semanticDefinitionReferenceDifferentiation = NOT CLAIMED / NOT MEASURED
semanticStrength = structural-only-not-compiler-resolved
```

This does not establish compiler-resolved symbol identity, semantic references, type flow, call-graph correctness, or product-wide superiority.

## 7. Fixture digest policy hardening

The harness validates the canonical manifest digest policy and fails closed on unsupported `expected.kind` values.

Authorized fixture kinds in this benchmark implementation are:

```text
binary
architecture-document
untrusted-document
generated
malformed-source
source
test-source
vendor
```

`binary` uses raw bytes. The listed non-binary kinds use the canonical UTF-8/LF-normalized text policy. Unknown kinds are rejected rather than silently treated as text.

## 8. Other candidate dispositions

### Tree-sitter

```text
SECURITY REVIEW REQUIRED
```

CLI archive, executable digest, distinct executable identity, and measured version identity are verified, but TypeScript parser execution remains outside the authorized execution-security envelope.

### SCIP

```text
INSUFFICIENT EVIDENCE
```

The CLI archive, executable digest, distinct executable identity, and measured version identity are verified. The CLI consumes semantic indexes but does not itself create the TypeScript semantic index required for definition/reference evaluation. No concrete TypeScript indexer is authorized.

### LSP

```text
SECURITY REVIEW REQUIRED
```

Only LSP `3.18` protocol capability is assessed. No concrete language server is installed or started.

### K3-R2

K3-R2 remains the canonical exact snapshot / Git-derived truth anchor for freshness, provenance, and repository/workspace state.

## 9. Review-hardening history

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
- removal of the non-measured `pathEscapesObserved` literal;
- fail-closed fixture digest-kind validation;
- result-output containment outside the checked-out workspace;
- exactly-one candidate binary selection;
- independently pinned executable SHA-256 verification;
- column-aware structural occurrence metrics;
- accurate relabeling of the virtual symlink target path-string rejection evidence;
- distinct candidate executable realpath/digest enforcement;
- measured candidate version identity binding.

The six findings raised against:

```text
3808df90e810a9c97b770c6efe573cb10a893aa5
```

were implemented by:

```text
66dbb8a7a20ba7ebe6b73d147fb999038eb3dd2d
bb28b9890ce7b228763461986145001e44d7550a
```

The two subsequent findings raised against:

```text
db74ac5908b4e8092ea386e49e050f70d53d72ed
```

were implemented by:

```text
f89cf2f0c0702accd064b8fa9638c9f0cc4a3623
```

## 10. Claim limits

The benchmark does not claim:

- cross-platform external-candidate performance equivalence;
- peak-memory characterization;
- compiler-resolved semantics;
- LSP server safety;
- Tree-sitter parser safety for a broader execution envelope;
- SCIP TypeScript indexing quality;
- a real synthetic symlink-escape test from the manifest virtual case;
- external candidate adoption.

Any future claim must be traceable to an exact benchmark dimension and evidence identity.

## 11. Founder review boundary

A final exact-current-head certification must verify, on one identical PR head:

1. `governance = SUCCESS`;
2. `k2-runtime = SUCCESS`, including `k2-runtime-gate`;
3. `k3-r3-benchmark = SUCCESS`;
4. the uploaded artifact records that exact head and canonical base;
5. executable pins, executable distinctness, measured version identity, per-entry realpath containment, symlink containment, full-tree freshness, output-path containment, and measured workspace-mutation guards pass;
6. occurrence metrics use exact path/line/column identity;
7. fresh Cubic exact-head review completes without valid unresolved findings;
8. all review threads are resolved;
9. scope remains limited to the authorized K3-R3 harness/workflow/evidence files;
10. canonical `main` remains compatible with the authorized baseline.

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
