# Kodac K3 Benchmark and Evidence Protocol — 2026-08-12

## Purpose

This protocol defines benchmark-first evidence requirements for future K3 implementation and adapter decisions.

It is a planning and evaluation protocol only.

```text
K3 IMPLEMENTATION: NOT AUTHORIZED
BENCHMARK-BASED SUPERIORITY CLAIMS: NOT ESTABLISHED
```

Repository baseline for this readiness package:

```text
1d469a1062f34bb66c6bff8fc330472d74e71317
```

## Benchmark principle

No adapter, donor, indexer, parser, retrieval method, storage strategy, language server, or context-selection strategy may be called `best`, `winner`, or `superior` without benchmark evidence produced under an accepted comparison protocol.

Benchmarks must distinguish:

- correctness from speed;
- retrieval from verified repository truth;
- parser-derived facts from semantic/compiler facts;
- model hypotheses from verified evidence;
- complete results from partial or truncated results;
- cold indexing from incremental update behavior;
- benchmark evidence from product claims.

## Hard invariants

The following are blocking invariants for future K3 benchmark acceptance.

### Snapshot staleness detection

```text
TARGET: 100%
```

If an index, graph, cache, or query result does not correspond to the requested repository snapshot or known working-tree state, the system must make that state observable rather than silently presenting stale evidence as current.

### Evidence source / provenance completeness

```text
TARGET: 100%
```

Every benchmarked evidence item that contributes to a canonical result must identify its evidence source/class sufficiently to distinguish observed facts, derived facts, heuristics, and model hypotheses.

### Unauthorized workspace mutations

```text
TARGET: 0
```

Repository-intelligence benchmarking must not mutate the workspace unless a separate trusted-execution authorization explicitly permits it.

### Path escapes

```text
TARGET: 0
```

No indexed, queried, or context-selected path may escape the authorized workspace through traversal, symlink behavior, path normalization defects, or equivalent mechanisms.

### Unlabeled model hypotheses presented as verified facts

```text
TARGET: 0
```

Model-generated interpretations must never be silently promoted to verified repository evidence.

### Deterministic query result identity

For deterministic queries:

```text
same snapshot
+ same canonical query
+ same deterministic adapter/configuration state
→ same canonical result identity
```

Where a result is intentionally nondeterministic, the nondeterministic dimension must be explicit and must not masquerade as deterministic evidence.

### Truncation

```text
MUST BE EXPLICIT
```

A truncated result must identify that it is truncated and, where feasible, why the bound was reached.

### Omitted context

```text
MUST NOT SILENTLY APPEAR COMPLETE
```

A `ContextBundle` must make important omission/completeness state observable when the bundle is bounded below the available evidence set.

## Planned benchmark dimensions

Future benchmark suites should measure relevant subsets of the following.

### Discovery quality

- file-discovery precision;
- file-discovery recall;
- symbol-discovery precision;
- symbol-discovery recall;
- definition precision;
- definition recall;
- reference precision;
- reference recall;
- related-test recall;
- blast-radius recall.

### Freshness and incremental behavior

- stale-index detection;
- working-tree change detection;
- incremental update correctness;
- incremental update latency;
- index invalidation behavior;
- partial-index behavior.

### Performance and resource bounds

- cold indexing latency;
- warm/incremental indexing latency;
- query latency;
- memory footprint;
- disk footprint where applicable;
- subprocess count where applicable;
- CPU/resource ceilings for adversarial inputs;
- cancellation behavior.

### Context efficiency

- evidence retained per token;
- relevant-evidence recall within a fixed context budget;
- duplicate-evidence rate;
- explicit omission rate;
- context-token efficiency;
- evidence-source retention through Context Bundle construction.

### Reproducibility

- deterministic/reproducible query behavior;
- canonical result identity stability;
- cross-platform result consistency where applicable;
- fixture portability;
- adapter-version identity;
- configuration identity.

### Robustness

- malformed-repository behavior;
- malformed-source behavior;
- syntax-error behavior;
- binary-file behavior;
- generated/vendor directory handling;
- very-large-file behavior;
- very-large-repository behavior;
- malicious filename handling;
- symlink handling;
- path-normalization behavior;
- parser/indexer resource exhaustion;
- language-server crash/restart behavior where applicable.

### Security and trust

- unauthorized workspace mutations;
- subprocess execution attempts;
- compiler/build/plugin execution attempts;
- prompt injection in repository content;
- secret-bearing file exclusion/handling;
- cross-workspace leakage;
- stale or partial evidence incorrectly labeled current/complete.

## Gold evidence fixture requirements

K3-R1 should establish small, deterministic repository fixtures with explicit gold truth before evaluating external adapters.

Fixtures should cover representative cases such as:

- single-file definitions and references;
- cross-file imports/references;
- renamed/moved files;
- working-tree modifications relative to Git HEAD;
- added/deleted/untracked files;
- related tests;
- architecture/ADR references;
- generated or vendor trees;
- syntax errors;
- malformed files;
- binary files;
- symlinks;
- deliberate path-escape attempts;
- duplicated symbol names;
- ambiguous heuristic matches;
- stale index state;
- partial index state;
- adversarial repository text containing prompt-injection-like instructions.

Gold truth must identify which facts are exact repository/Git facts, which are parser/semantic facts, and which outcomes are intentionally unknown or ambiguous.

## Adapter comparison rules

External candidates must be compared behind Kodac-owned semantics rather than by exposing their native APIs directly to agents.

A fair comparison must record at least:

- candidate identity;
- exact version or commit where applicable;
- license identity;
- adapter configuration;
- language/runtime requirements;
- fixture set identity;
- benchmark protocol version;
- platform/environment identity;
- measured correctness;
- measured resource behavior;
- known unsupported cases;
- security-relevant subprocess/build behavior;
- evidence class produced.

A candidate may excel at one evidence layer without being treated as the system-wide winner.

For example:

```text
syntax-tree quality
!= semantic reference quality

structural match quality
!= compiler-resolved definition quality

vector similarity
!= canonical repository truth
```

## Benchmark result classification

Future candidate assessments should use evidence-oriented classifications such as:

```text
QUALIFIED FOR SPECIFIC ADAPTER ROLE
PARTIALLY QUALIFIED
NOT QUALIFIED
INSUFFICIENT EVIDENCE
SECURITY REVIEW REQUIRED
LICENSE REVIEW REQUIRED
SOURCE INTAKE AUTHORIZATION REQUIRED
```

Avoid product-level superiority language unless separately authorized and evidence-supported.

## Cross-platform direction

Where K3 functionality is intended to be supported on multiple operating systems, benchmark evidence should establish the required platform matrix rather than assume equivalent behavior.

Path semantics, symlinks, executable discovery, subprocess behavior, filesystem case behavior, and language-server/indexer installation can differ across platforms and must be treated as evidence questions.

## Benchmark authority boundaries

This protocol authorizes no benchmark run as public product evidence and no source intake.

```text
K3 IMPLEMENTATION: NOT AUTHORIZED
K3-A IMPLEMENTATION: NOT AUTHORIZED
EXTERNAL ADAPTER INTAKE: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
SUPERIORITY CLAIM: NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
```

## Future gate

A future founder authorization may separately permit K3-R1 benchmark fixture implementation or K3-R2 built-in snapshot/evidence implementation.

This protocol does not grant that authorization.
