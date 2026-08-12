# Kodac K3-R5 Context Engine Vertical Slice Authorization — 2026-08-13

## Decision

```text
K3-R5 — Bounded Context Engine Vertical Slice
STATUS: AUTHORIZED FOR IMPLEMENTATION ONCE THIS RECORD IS CANONICALLY ADOPTED
IMPLEMENTATION AUTHORITY: BOUNDED BY THIS RECORD
K3-R6+: NOT AUTHORIZED
```

Repository:

```text
IamShehri/Kodac
```

Canonical authorization base:

```text
85d07157b577a57abb5df2a45bece7ea5b6a3bcd
```

Canonical base subject:

```text
Merge pull request #15 from IamShehri/feat/k3-r4-ast-grep-cli-adapter
feat(k3): implement bounded R4 ast-grep CLI adapter
```

This record authorizes only a bounded K3-R5 Context Engine vertical slice after canonical adoption of this document. It does not itself implement R5.

## Preconditions established by canonical K3 state

The authorization relies on the following already-canonical K3 state:

```text
K3-R1 — Benchmark Fixtures and Gold Evidence
CANONICAL / COMPLETE FOR AUTHORIZED SCOPE

K3-R2 — Built-In Exact Snapshot / Evidence Slice
CANONICAL / COMPLETE FOR AUTHORIZED SCOPE

K3-R3 — External Adapter Benchmark
CANONICAL / COMPLETE FOR AUTHORIZED SCOPE

K3-R4 — Bounded ast-grep CLI Adapter
CANONICAL / IMPLEMENTED FOR AUTHORIZED SCOPE
```

K3-R5 must consume existing Kodac-owned contracts. It must not create a competing repository truth or a second execution authority.

## Purpose

The K3-R5 vertical slice proves that Kodac can transform already-normalized, freshness-bound repository evidence into a deterministic, bounded, provenance-preserving `ContextBundle` suitable for later model reasoning.

The first slice is deliberately narrow.

It must prove the Context Engine contract and trust boundary before K3-R6 attempts any integrated K3 → K2 controlled proof.

The first slice is not authorized to become a general repository crawler, retrieval system, graph database, vector RAG layer, model router, or execution engine.

## Canonical architecture relationship

The K3-R5 slice must preserve the canonical direction:

```text
Task / Query Intent
→ Kodac-owned Context Engine
→ already-normalized K3 evidence
→ bounded ContextBundle
→ future model reasoning
→ existing K2 trusted runtime
```

K3-R5 stops at the `ContextBundle` boundary.

It must not execute repository mutations, shell commands, model actions, package scripts, compilers, build hooks, language servers, plugins, or other side effects.

## Authorized implementation character

The first K3-R5 implementation must be:

```text
PURE OR EFFECTIVELY PURE
IN-MEMORY
DETERMINISTIC FOR IDENTICAL INPUTS
NO NETWORK
NO PROCESS EXECUTION
NO FILE WRITES
NO PERSISTENT CACHE
NO NEW DEPENDENCIES
NO DONOR SOURCE COPY
NO MODEL CALL
NO EMBEDDING CALL
NO VECTOR STORE
```

The implementation may use ordinary TypeScript standard-library/runtime functionality already present in the repository.

## Authorized input boundary

The first slice may consume only Kodac-owned normalized inputs already available from canonical K3 contracts.

### 1. Repository snapshot

A `RepositorySnapshot` from K3-R2 may be supplied only when:

```text
version == k3-r2-snapshot-v1
freshness == current
completeness.state == complete
```

The Context Engine must fail closed for stale, partial, truncated, unsupported, or malformed snapshot inputs in this first slice.

### 2. Built-in repository evidence

The slice may consume the existing `RepositoryEvidence[]` carried by the bound snapshot.

Current evidence classes remain canonical:

```text
precise-static
parser-derived
git-derived
heuristic-inference
model-hypothesis
```

No new evidence class may be invented silently.

### 3. K3-R4 structural query results

The slice may optionally consume one or more canonical K3-R4 structural query results only when all repository/snapshot/content identities exactly match the bound K3-R2 snapshot.

Accepted structural results must remain explicitly labeled:

```text
parser-derived
structural-only-not-compiler-resolved
```

K3-R5 must not reinterpret an ast-grep structural occurrence as a compiler-resolved definition, reference, call edge, type fact, or dependency fact.

### 4. Task / context request

The first slice may accept a bounded Kodac-owned context request containing only deterministic selection inputs such as:

- a request/version identity;
- a stable task identity supplied by the caller;
- a short task objective or query text;
- optional exact workspace-relative target paths;
- optional exact symbol hints;
- explicit item and size budgets.

The request contract must impose bounded lengths and counts.

It must reject malformed, unbounded, or path-traversing request data.

## Explicitly unauthorized inputs

The first K3-R5 slice must not directly consume or query:

- raw Tree-sitter APIs;
- raw SCIP APIs or semantic indexes;
- raw LSP APIs or language servers;
- raw ast-grep pattern DSL;
- database APIs;
- vector-store APIs;
- embeddings;
- arbitrary repository filesystem scans;
- uncontrolled Git history walks;
- issue trackers or remote web content;
- model-generated repository facts presented as verified facts.

Future adapters may normalize additional evidence behind Kodac-owned contracts, but this authorization does not grant them.

## ContextBundle contract requirements

The first canonical `ContextBundle` contract must carry enough identity and limitation metadata to prevent context from appearing stronger, fresher, or more complete than its source evidence.

At minimum it must carry:

```text
contract version
bundle identity
repository identity
snapshot identity
content identity
freshness state
task/request identity
selection strategy identity
budget
selected items
selected item source/evidence identities
selected item evidence classes
selected item trust marking
completeness / truncation state
omitted-at-least count
omission reasons
source provenance references
```

A deterministic result identity is required for deterministic inputs.

Wall-clock timestamps, random identifiers, machine-specific paths, or execution-order noise must not be required to reproduce the deterministic bundle identity.

## Context item requirements

Each selected ContextBundle item must preserve at least:

- stable item identity;
- source kind;
- subject path when applicable;
- evidence class;
- bounded display/context text or normalized claim;
- source evidence/result identity;
- provenance references;
- trust classification;
- relevance/selection explanation sufficient to understand why the item was selected.

The first slice may normalize snapshot evidence claims and K3-R4 structural-match metadata/text into ContextBundle items.

It is not authorized to read arbitrary additional source-file bodies merely to enrich the bundle.

## Untrusted repository content boundary

Repository-derived text is data, not instruction authority.

All repository-derived text included in the bundle must be marked as untrusted repository data.

This includes text derived from:

- source matches;
- paths and filenames;
- architecture/specification evidence;
- Git-derived evidence values;
- comments or documentation if a future authorized normalized evidence source includes them.

K3-R5 must not convert repository text into:

- system instructions;
- tool instructions;
- policy overrides;
- capability grants;
- execution requests.

The implementation and tests must demonstrate that prompt-injection-shaped repository text remains inert data in the ContextBundle contract.

## Evidence ordering boundary

The Context Engine may rank or select evidence, but it must not silently promote weaker evidence into stronger truth.

The first implementation must preserve evidence class on every item and use a documented deterministic selection strategy.

At minimum, the strategy must obey these principles:

```text
precise verified fact > parser-derived fact > Git-derived fact
verified fact > heuristic inference
verified fact > model hypothesis
similarity/relevance score != evidence truth strength
selection rank != factual confidence
```

If heuristic or model-hypothesis inputs are ever accepted by the contract, they must remain visibly labeled and must not override contradictory verified evidence.

The first implementation is permitted to exclude model hypotheses entirely.

## Task-aware selection boundary

The Context Engine must be task-aware but bounded.

The first slice may use deterministic signals such as:

- exact target-path match;
- exact symbol-hint match;
- bounded lexical token overlap with task objective;
- working-tree relevance;
- architecture/specification evidence relevance;
- evidence strength;
- stable path/order tie breaking.

It must not claim semantic understanding beyond those measured rules.

It must not call a model to rank context in this slice.

It must not use embeddings or vector similarity.

The exact deterministic ranking formula must be test-covered and stable enough that identical canonical inputs yield identical selected items and bundle identity.

## Budget and truncation boundary

The first slice must implement explicit, deterministic bounds.

At minimum the request must support bounded limits for:

- maximum selected items;
- maximum UTF-8 context bytes or equivalent exact size unit.

The implementation may additionally expose a deterministic estimated-token metric, but it must not claim tokenizer-exact budgeting unless a tokenizer is separately authorized and proven.

When the Context Engine cannot include all eligible evidence, the bundle must state:

```text
completeness = truncated
omittedAtLeast > 0
omission reasons = explicit
```

Permitted first-slice omission reasons may include:

```text
item-budget
byte-budget
source-input-limit
unsupported-evidence
```

The implementation must not silently drop eligible items while returning `complete`.

## Provenance requirements

Every selected item must remain traceable to canonical source evidence or a canonical K3-R4 result.

The bundle must preserve enough provenance references to trace:

```text
ContextBundle item
→ normalized evidence/result
→ source adapter / built-in source
→ bound repository snapshot
```

The bundle must fail closed if a selected item has no source identity or provenance when the originating contract requires provenance.

## Identity and freshness requirements

The Context Engine must verify that every supplied evidence/result input belongs to the same bound repository state.

For K3-R4 inputs, at minimum these identities must exactly match the bound snapshot:

```text
repositoryIdentity
snapshotIdentity
contentIdentity
freshness == current
```

Mixed-snapshot context is forbidden.

Stale context must not silently appear current.

The first slice must fail closed rather than downgrade to an ambiguous mixed-state bundle.

## Resource bounds

The implementation must establish hard upper bounds for at least:

- request objective length;
- target-path count and length;
- symbol-hint count and length;
- input evidence/result count;
- selected item count;
- per-item normalized text size;
- total bundle text size.

Resource-bound violations must fail closed or produce explicitly truncated output only where the contract makes truncation safe and observable.

No unbounded recursive traversal is authorized.

## Path handling

Any workspace-relative path supplied by a request or normalized source must be canonical and bounded.

The first slice must reject at least:

- absolute paths where a workspace-relative path is required;
- `..` parent traversal;
- empty path segments where canonical form forbids them;
- Windows drive-qualified paths in workspace-relative fields;
- backslash-based ambiguity in canonical slash-separated path fields;
- NUL-bearing paths.

K3-R5 itself must not resolve symlinks or walk outside the snapshot; it consumes normalized identities rather than expanding filesystem authority.

## First-slice implementation surface

After canonical adoption of this authorization, the implementation PR may modify only the bounded Context Engine surface and the minimum export/test/CI wiring required for it.

Expected implementation paths are limited to:

```text
packages/kodac-runtime/src/context-engine/contracts.ts
packages/kodac-runtime/src/context-engine/context-engine.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/k3-r5-context-engine.test.ts
.github/workflows/k3-r5-context-engine.yml
```

If implementation requires any additional production path, dependency manifest, lockfile, trust-policy capability, execution-gateway capability, repository snapshot implementation change, or external adapter change, implementation must stop and return to founder review before adding that path.

The implementation PR must not modify K3-R4 ast-grep execution semantics.

## K2 authority boundary

K3-R5 does not authorize a new K2 capability.

The first Context Engine slice must not call `ExecutionGateway` for process execution or workspace mutation.

It must not add or widen any trust-policy capability.

K2 remains the sole future side-effect authority.

K3-R5 output may inform later reasoning, but a ContextBundle grants no execution permission.

## Dependency / donor boundary

This authorization does **not** authorize:

- new npm dependencies;
- new crates;
- package-manifest changes;
- lockfile changes;
- copying donor source;
- vendoring external binaries;
- automatic production downloads;
- new provenance pins for donor code intake.

Existing repository code may be reused normally within Kodac.

`code_import_authorized=false` remains unchanged.

## Persistent storage boundary

K3-R5 remains in-memory.

This authorization does not authorize:

- SQLite;
- DuckDB;
- Neo4j;
- embedded KV storage;
- vector databases;
- disk-backed context caches;
- hosted persistence;
- cross-session repository-intelligence persistence.

Any persistent cache or storage engine requires a separate trust/mutation/storage authorization.

## Model / vector boundary

The first K3-R5 implementation must not call a language model.

It must not introduce:

- embeddings;
- rerankers;
- semantic vector search;
- model-based relevance scoring;
- model-generated context summaries;
- model-generated graph edges.

Those may be evaluated later only under a separately authorized evidence protocol.

## Security invariants

The implementation candidate must preserve at least:

```text
SNAPSHOT STALENESS DETECTION: 100%
MIXED-SNAPSHOT ACCEPTANCE: 0
EVIDENCE SOURCE / PROVENANCE COMPLETENESS: 100%
UNAUTHORIZED WORKSPACE MUTATIONS: 0
PROCESS EXECUTION BY CONTEXT ENGINE: 0
NETWORK ACCESS BY CONTEXT ENGINE: 0
PATH ESCAPES: 0
UNLABELED MODEL HYPOTHESES AS VERIFIED FACTS: 0
UNTRUSTED REPOSITORY TEXT TREATED AS INSTRUCTION AUTHORITY: 0
SILENT TRUNCATION: 0
DETERMINISTIC BUNDLE IDENTITY: REQUIRED FOR DETERMINISTIC INPUTS
```

## Required negative tests

The implementation PR must include tests that fail closed for at least:

- stale snapshot;
- partial snapshot;
- truncated snapshot;
- unsupported snapshot contract version;
- K3-R4 result repository identity mismatch;
- K3-R4 result snapshot identity mismatch;
- K3-R4 result content identity mismatch;
- stale K3-R4 result;
- malformed request version/kind;
- oversized objective;
- too many target paths;
- target path traversal;
- absolute target path;
- malformed symbol hint;
- evidence item without required provenance;
- oversized input set;
- oversized normalized item text;
- item-budget truncation;
- byte-budget truncation;
- prompt-injection-shaped repository content remaining untrusted data;
- deterministic replay mismatch.

## Required positive tests

The implementation must prove at least:

- deterministic bundle identity for identical inputs;
- stable selection ordering;
- exact snapshot identity propagation;
- exact evidence-class preservation;
- exact provenance preservation;
- task/path/symbol relevance can affect selection without changing evidence truth class;
- explicit complete state when all eligible evidence fits;
- explicit truncated state when budget omits evidence;
- K3-R4 parser-derived matches remain parser-derived and structural-only;
- no execution/trust capability is needed to build the bundle.

## Dedicated CI gate

The implementation PR must add a dedicated reusable K3-R5 check named:

```text
k3-r5-context-engine
```

The gate must run the relevant Context Engine tests and type/runtime checks required to prove the bounded slice.

For the implementation PR, the workflow must additionally attest the implementation scope against the canonical authorization base and fail closed if unauthorized paths such as manifests, lockfiles, donor code, binaries, storage configuration, trust-policy expansion, or K3-R4 adapter changes appear.

After canonical adoption of R5, the workflow must remain usable as a regression gate and must not permanently pin future unrelated development to the historical R5 authorization base.

## Required repository checks

The implementation PR must also keep the canonical required checks green:

```text
provenance
legacy-tests
k2-runtime-gate
```

Cross-platform K2 regression tests must remain green.

The Context Engine itself is platform-neutral TypeScript in this slice; no new Windows/macOS external-tool qualification claim is created.

## Review gate

Before R5 implementation merge, require:

- exact-head PR identity verification;
- canonical main/base unchanged or explicitly reconciled;
- exact implementation-path scope verification;
- all canonical required checks green;
- `k3-r5-context-engine` green on exact head;
- complete cumulative diff review;
- all valid findings corrected;
- all review threads resolved;
- deterministic bundle contract reviewed for overclaim and hidden authority expansion;
- explicit founder merge authorization.

No auto-merge is authorized by this record.

No ruleset bypass is authorized.

## Acceptance meaning

Canonical merge of a conforming K3-R5 implementation PR will establish only:

```text
A BOUNDED, IN-MEMORY, DETERMINISTIC CONTEXTBUNDLE VERTICAL SLICE
OVER EXISTING K3-R2 / K3-R4 NORMALIZED EVIDENCE
```

It will not establish:

- a complete Repo Graph;
- complete semantic repository intelligence;
- compiler-precise definitions/references;
- model reasoning quality;
- autonomous coding correctness;
- vector retrieval quality;
- persistent indexing;
- cross-repository context;
- Windows/macOS ast-grep candidate qualification;
- public product readiness;
- K3 closeout.

## Non-grants preserved

This authorization does **not** authorize:

- K3-R6 or later work;
- K3 closeout;
- Tree-sitter intake;
- SCIP intake;
- concrete LSP server intake;
- additional ast-grep capabilities beyond canonical R4;
- ast-grep rewrite;
- arbitrary repository source-file ingestion;
- new dependencies;
- persistent storage;
- vector/embedding infrastructure;
- model calls;
- MCP implementation;
- ACP implementation;
- Agent Skills implementation;
- public release;
- package publication;
- brand launch;
- trademark/name-clearance claims;
- ruleset changes.

## Current authority state after canonical adoption of this record

```text
K3-R1: CANONICAL / COMPLETE FOR AUTHORIZED SCOPE
K3-R2: CANONICAL / COMPLETE FOR AUTHORIZED SCOPE
K3-R3: CANONICAL / COMPLETE FOR AUTHORIZED SCOPE
K3-R4: CANONICAL / IMPLEMENTED FOR AUTHORIZED SCOPE
K3-R5 IMPLEMENTATION: AUTHORIZED WITHIN THIS RECORD
K3-R6+: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
PERSISTENT STORAGE: NOT AUTHORIZED
VECTOR / EMBEDDINGS: NOT AUTHORIZED
MODEL-BASED CONTEXT RANKING: NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
KODAC NAME / TRADEMARK CLEARANCE: NOT ESTABLISHED
```

## Next gate

After a conforming K3-R5 implementation is independently reviewed and canonically adopted, the next permissible engineering step is a separate K3-R6 authorization decision for an integrated K3 → model/reasoning boundary → K2 controlled proof.

K3-R6 is not authorized by this record.