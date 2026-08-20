# Kodac K3 Code-Graph Donor Differential Audit — 2026-08-20

Status: AUDIT CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
K3-CODE-GRAPH-DONOR-DIFFERENTIAL-AUDIT

CANONICAL KODAC BASE:
ef83818812b76a90d843e8309073cbe320bda80e

CANONICAL KODAC BASE TREE:
cc4c308911b2f0c1a6f47f549dafe76756230e05

K3-R1 THROUGH K3-R5:
CANONICAL FOR THEIR AUTHORIZED SCOPES

K3-R6+:
NOT AUTHORIZED

CODE-GRAPH-RAG:
HIGH-VALUE DEEP CODE-EVIDENCE DONOR / STUDY + TARGETED PORT CANDIDATE

GRAPHIFY:
HIGH-VALUE LOCAL GRAPH / IMPACT / AGENT-CONTEXT DONOR / STUDY + TARGETED PORT CANDIDATE

WHOLESALE DONOR RUNTIME IMPORT:
REJECTED

DONOR AS PERMANENT KODAC BACKEND:
NOT SELECTED

NEW KODAC DEPENDENCIES BY THIS AUDIT:
NONE

CODE IMPORT AUTHORIZED BY THIS AUDIT:
NO

PERSISTENT GRAPH STORAGE AUTHORIZED BY THIS AUDIT:
NO

VECTOR / EMBEDDING INFRASTRUCTURE AUTHORIZED BY THIS AUDIT:
NO

MODEL-BASED GRAPH EDGE CREATION AUTHORIZED BY THIS AUDIT:
NO

RECOMMENDED NEXT SEPARATE FOUNDER-REVIEWED SLICE:
SNAPSHOT-BOUND RELATION GRAPH CONTRACT + IMPACT / RELATED-TESTS BENCHMARK
IN-MEMORY, DETERMINISTIC, PROVENANCE-PRESERVING, NO NEW DEPENDENCIES
```

The central conclusion is that the two donors are complementary rather than substitutes.

Graphify is the stronger donor for a lightweight local graph, graph navigation, provenance labels, incremental rebuild ideas, graph-diff ergonomics, and reverse dependency / blast-radius traversal suitable for agent context.

Code-Graph-RAG is the stronger donor for a rich language-agnostic code graph, explicit resource and data-flow relationships, dead-code reachability, and static-plus-runtime call evidence that can expose dynamic dispatch missed by static analysis.

Kodac should not become a wrapper around either project. It should preserve Kodac-owned query, evidence, freshness, context, and K2 authority contracts, then selectively port or independently reimplement only those donor ideas that survive Kodac benchmark and trust review.

This audit does not redefine K3-R6. An older K3 architecture-readiness document proposed R6 as an integrated K3 -> K2 controlled proof, while the current roadmap deliberately states that K3-R6+ scope is not authorized and must not be invented by implication. The recommendations below are therefore candidate pre-authorization slices only. Founder review must decide whether any future accepted slice becomes R6, R6A/R6B, a K3 closeout precursor, or another explicitly named gate.

---

## 2. Why this review exists

Canonical K3 already proves:

```text
K3-R1 — benchmark fixtures and gold evidence
K3-R2 — exact repository snapshot / freshness / evidence slice
K3-R3 — bounded external-adapter benchmark
K3-R4 — bounded ast-grep structural adapter
K3-R5 — deterministic provenance-preserving ContextBundle
```

K3-R5 intentionally did not become a crawler, graph database, semantic index, persistent cache, vector RAG layer, or execution engine. That boundary was correct for establishing the Context Engine contract.

The current roadmap nevertheless identifies possible future K3 closeout evidence including:

- repository-intelligence/query contracts;
- relevant-file evidence;
- structural-symbol evidence;
- related-test or blast-radius evidence;
- provenance and evidence-class distinctions;
- freshness identity proof;
- bounded ContextBundle evidence;
- preservation of the K2 execution boundary.

The two donors reviewed here are unusually relevant to those open directions.

This audit therefore answers:

1. which donor capabilities materially exceed current K3-R5;
2. which capabilities overlap existing Kodac functionality and should not be duplicated;
3. which donor semantics can map safely into Kodac evidence classes;
4. where new evidence classes or contracts would be required rather than silently invented;
5. whether either donor should become a production dependency or permanent backend;
6. what the smallest useful future K3 graph slice should prove;
7. which capabilities should remain deferred even if they are attractive.

It does not implement code-graph functionality.

---

## 3. Exact donor pins inspected

### 3.1 Code-Graph-RAG

Repository:

```text
https://github.com/vitali87/code-graph-rag
```

Pinned branch and commit inspected:

```text
branch: main
commit: 963faa05ced113d841dedd81856e95c334c72201
version: 0.0.694
```

License at the pinned revision:

```text
MIT
```

Primary evidence inspected includes:

```text
README.md
docs/architecture/overview.md
docs/architecture/graph-schema.md
docs/guide/realtime-updates.md
docs/guide/dynamic-tracing.md
docs/guide/dead-code.md
docs/sdk/semantic-search.md
pyproject.toml
LICENSE
```

### 3.2 Graphify

Repository:

```text
https://github.com/Graphify-Labs/graphify
```

Pinned default branch and commit inspected:

```text
branch: v8
commit: b2cd36267456c166788c95be6e68574064a92a42
version: 0.9.48
```

License metadata at the pinned revision:

```text
project license: Apache-2.0
NOTICE: portions contributed under MIT before relicensing remain available under those terms
```

Primary evidence inspected includes:

```text
README.md
ARCHITECTURE.md
docs/how-it-works.md
BENCHMARKS.md
graphify/affected.py
graphify/analyze.py
graphify/watch.py
pyproject.toml
NOTICE
LICENSE
LICENSE-MIT
```

Any future source-level intake from Graphify must resolve file-level provenance and the applicable license for the exact source revision rather than assuming every historical line has one uniform license history.

---

## 4. Canonical Kodac boundary that must not move silently

Kodac K3 architecture establishes the authority direction:

```text
Task / Query
-> Kodac-owned Repository Intelligence
-> evidence-backed result
-> bounded ContextBundle
-> model reasoning
-> existing K2 trusted runtime
-> execution evidence / verification / Done Gate
```

A repository graph is evidence infrastructure. It is not execution authority.

A graph edge must never grant:

- repository mutation;
- process execution;
- tool execution;
- policy bypass;
- approval bypass;
- K2 capability;
- Done Gate success.

Current K3-R5 is deliberately snapshot-bound, deterministic, bounded, in-memory, no-network, no-process, no-model, no-embedding, and no-persistent-cache. Any future graph slice must preserve those guarantees unless a separate authorization explicitly changes them.

Kodac-owned semantics must remain replaceable. Agents must not become coupled directly to Memgraph Cypher, NetworkX, Tree-sitter internals, a vector-store API, or donor-specific node identifiers.

---

## 5. Donor differential — high-value capabilities

| Capability | Graphify | Code-Graph-RAG | Kodac relevance |
| --- | --- | --- | --- |
| Deterministic AST graph | Strong | Strong | High |
| Local graph without graph DB | Strong (`graph.json` / NetworkX) | No; Memgraph is core | High as design donor |
| Rich unified symbol schema | Moderate | Strong | Very high |
| Explicit edge provenance/confidence | Strong (`EXTRACTED`, `INFERRED`, `AMBIGUOUS`) | Stronger for dynamic/static call provenance; not identical taxonomy | Very high |
| Reverse impact / blast radius | Strong (`affected`) | Graph enables reachability, but Graphify exposes the clearer donor UX | Very high |
| Related tests | Indirectly derivable | Runtime tracing can attach test workload provenance to calls | Very high |
| Runtime-observed call edges | No comparable core feature | Strong; multiple runtimes + eBPF/pprof ingestion | Extremely high, separately gated |
| I/O resource graph | Limited | Strong (`READS_FROM`, `WRITES_TO`) | High for security/review |
| Data-flow / provenance graph | Limited | Strong (`FLOWS_TO`) | High, requires evidence calibration |
| Dead-code reachability | Some graph analyses | Strong dedicated command | Medium/high |
| Import-cycle analysis | Strong | Graph-query derivable | Medium/high |
| Communities / subsystem clustering | Strong, Leiden | Not central | Medium for context navigation |
| Incremental content-hash cache | Strong | Real-time updater/watch path | High, but persistence mutation separately gated |
| Graph diff / temporal analysis | Strong | Possible via graph state | High for PR review / change impact |
| Natural-language graph query | Agent-assisted scoped query | Natural language -> Cypher | Useful later, not trust source |
| MCP | Optional | Built-in | Not needed for core K3 contracts |
| Semantic vectors | Not required for code graph; no-vector positioning in normal code path | Optional UniXcoder + Qdrant/Milvus | Defer |
| Structural rewrite / editing | Not core graph contract | Strong agent editing features | Reject as K3 authority; K2 remains mutation authority |

The most valuable combined insight is not "use a graph database." It is:

```text
repository evidence should form an explicit, freshness-bound relation graph
whose edges preserve producer, provenance, evidence class, uncertainty, and snapshot identity;
then impact / related-tests / context selection become bounded graph queries over evidence,
not model guesses and not unstructured grep heuristics.
```

---

## 6. Graphify — what Kodac should learn from it

### 6.1 Lightweight graph as a replaceable product boundary

Graphify's architecture passes plain extraction dictionaries into NetworkX and exports a portable `graph.json`. Its documented stages are separated:

```text
detect -> extract -> build -> cluster -> analyze -> report -> export
```

The important donor lesson is stage isolation and portable graph semantics, not NetworkX itself.

Kodac should similarly define a backend-neutral relation graph contract before selecting storage.

### 6.2 `affected` is directly relevant to K3 closeout

Graphify's `affected` implementation performs a reverse traversal through relations including:

```text
calls
indirect_call
references
imports
imports_from
dynamic_import
re_exports
inherits
extends
implements
uses
mixes_in
embeds
requires
```

It preserves the traversed edge's source file and source location, so an impact result can point to the actual dependency site rather than only the impacted definition.

That shape is a strong donor for a future Kodac-owned query such as:

```text
impact(seed, maxDepth, relationClasses)
```

A Kodac result should additionally bind every edge and hit to exact snapshot/content identities and evidence provenance.

### 6.3 Confidence labels are useful, but must not be copied semantically

Graphify uses:

```text
EXTRACTED
INFERRED
AMBIGUOUS
```

and may assign confidence scores to inferred relationships.

Kodac must not directly map `INFERRED` to one truth class. The producer matters:

- deterministic Tree-sitter extraction -> `parser-derived`;
- deterministic name/call resolution heuristic -> `heuristic-inference` unless separately compiler-proven;
- LLM-produced relationship -> `model-hypothesis`;
- ambiguous resolver output -> must remain explicitly ambiguous/incomplete and must not be promoted by a numeric score.

A similarity or confidence score is not evidence truth strength.

### 6.4 Content-hash incremental rebuild is a valuable future persistence donor

Graphify fingerprints extracted files by content hash and skips unchanged inputs. Its watcher also handles queued changes and rebuild locking.

Kodac should study this for a future persistent graph/cache gate, but not import it into the first graph slice. K3-R2 already gives Kodac stronger repository content/snapshot identity semantics than a standalone file cache. Any future incremental graph must derive from the canonical Kodac snapshot/content identity rather than create a competing freshness truth.

### 6.5 Graph analysis helpers are useful context signals

Graphify exposes concepts such as:

- graph diff;
- import cycles;
- god nodes / high-degree concepts;
- communities;
- paths between entities;
- surprising connections.

These are useful selection/navigation signals but must not silently become factual confidence or execution authority.

### 6.6 Benchmarks are informative but not canonical evidence for Kodac

Graphify publishes memory and code-intelligence benchmark results, including an ERPNext agent comparison and temporal AST checkpoints. These are useful to design a Kodac benchmark family, but they are self-reported donor benchmarks and do not replace Kodac-owned gold evidence and independently reproducible acceptance thresholds.

---

## 7. Code-Graph-RAG — what Kodac should learn from it

### 7.1 Rich relation schema is the stronger deep-evidence donor

Code-Graph-RAG's unified graph models entities including:

```text
Project
Package
Folder
File
Module
Class
Function
Method
Interface
Enum
Type
Union
ExternalPackage
ExternalModule
Resource
Pattern
CodeSmell
SecurityIssue
```

and relationships including:

```text
DEFINES
IMPORTS
EXPORTS
INHERITS
IMPLEMENTS
OVERRIDES
CALLS
REFERENCES
INSTANTIATES
READS_FROM
WRITES_TO
FLOWS_TO
HAS_SMELL
HAS_VULNERABILITY
```

This is substantially richer than current K3-R4 structural matches and should influence future Kodac relation-contract design.

### 7.2 Resource nodes and data-flow edges are especially important for security review

Code-Graph-RAG can model resources such as:

```text
FILE
NETWORK
DATABASE
STDIN
STDOUT
STDERR
ENV
SOCKET
```

and connects code to those resources with `READS_FROM`, `WRITES_TO`, and `FLOWS_TO`.

This could become highly valuable to future Kodac Reviewer Intelligence and security analysis because it allows questions such as:

```text
Which changed function can reach a network resource?
Which environment-derived value can flow toward stdout or a socket?
Which impacted callers cross a trust boundary?
```

However, the donor itself documents a conservative static taint model. Kodac must preserve the precision/coverage limits in evidence metadata and must not present a partial parser flow as compiler-grade whole-program proof.

### 7.3 Runtime call tracing is a major differentiator

Code-Graph-RAG overlays observed runtime calls onto the static graph and records when runtime tracing discovered an edge missed by static analysis.

It supports several instrumentation/sampling sources across Python, JVM, Node.js, .NET, PHP, Lua, Dart, Go, C/C++, Rust, and eBPF/pprof-style production profiles.

This is strategically important because static graphs systematically miss:

- dynamic dispatch;
- reflection;
- registries;
- framework routing;
- callbacks;
- function pointers;
- monkey-patching;
- runtime dependency injection.

For Kodac, runtime call evidence should **not** be mislabeled as `precise-static` or `parser-derived`.

A future authorization should either introduce a new explicit evidence class such as:

```text
runtime-observed
```

or define a separate runtime-observation evidence contract that carries at least:

```text
source runtime / tracer
workload identity
test identity when applicable
sampling vs exact instrumentation
coverage / resolution limits
snapshot identity
artifact identity
edge identity
observation count semantics
static corroboration state
```

Sample counts must not be described as exact invocation counts when the source is a sampling profiler.

### 7.4 Test-attributed runtime edges could materially improve `related_tests`

Code-Graph-RAG's Python tracing can attach test identities to observed edges. Equivalent runtime workload attribution exists in other tracer paths with different precision limitations.

A future Kodac `related_tests` query could combine:

```text
static relation evidence
+
runtime-observed workload/test evidence
```

while keeping the two evidence sources visibly distinct.

This is stronger than simply asking a model which tests "look relevant."

### 7.5 Dead-code analysis demonstrates bounded graph reachability, not deletion authority

Code-Graph-RAG treats dead-code results as review candidates, not guaranteed deletion lists, because dynamic behavior can evade static analysis.

Kodac should preserve the same epistemic boundary. A graph reachability result can be evidence for review prioritization; it cannot by itself authorize deletion.

### 7.6 Real-time graph updates are useful but not suitable as a first Kodac implementation

Code-Graph-RAG provides filesystem watching and graph updates, including recalculation of call relationships. This is a useful operational donor but introduces persistent mutable state and freshness synchronization risk.

Kodac's first graph slice should instead derive from an exact K3-R2 snapshot and remain immutable for that snapshot.

---

## 8. Why Kodac should not embed either donor wholesale

### 8.1 Code-Graph-RAG operational footprint

The pinned package has a substantial default runtime surface including:

```text
Python >= 3.12
Memgraph client
MCP
Pydantic-AI
Tree-sitter
watchdog
CLI / interactive UI packages
protobuf
Hugging Face support
```

and optional surfaces including:

```text
Qdrant
Milvus
Torch
Transformers
libclang
ast-grep Python bindings
Jedi
multiple Tree-sitter grammars
```

This is valuable as a product, but too much authority and dependency coupling for a first Kodac graph contract.

### 8.2 Graphify operational footprint

Graphify is lighter in graph storage architecture but still ships a large default set of Tree-sitter language packages plus NetworkX/Numpy/RapidFuzz and many optional integrations for graph databases, MCP, document/media extraction, models, watchers, office files, and more.

Again, the donor value is in algorithms and architecture, not in making Kodac depend on the full product.

### 8.3 Backend coupling would violate existing K3 direction

Canonical Kodac explicitly avoids selecting a permanent graph/index/storage backend by implication.

Therefore this audit rejects, for the current gate:

```text
Memgraph as canonical repository truth
NetworkX as canonical repository truth
Neo4j/FalkorDB as canonical repository truth
Qdrant/Milvus as required K3 infrastructure
donor MCP APIs as Kodac query contracts
donor graph node IDs as Kodac entity identity
natural-language -> Cypher as trusted fact generation
```

---

## 9. Recommended Kodac-owned graph contract direction

A future relation-graph contract should be immutable and bound to one canonical K3-R2 repository state.

A candidate envelope should carry at least:

```text
contractVersion
graphIdentity
repositoryIdentity
snapshotIdentity
contentIdentity
freshness
completeness
producerSet
nodeCount
edgeCount
nodes[]
edges[]
```

Each node should carry, where applicable:

```text
stable entity identity
entity kind
workspace-relative path
symbol / qualified name
source span
source evidence identity
producer identity
provenance refs
```

Each edge should carry at least:

```text
stable edge identity
source entity identity
target entity identity
relation kind
evidence class
producer identity
source evidence/result identity
provenance refs
source span / relation site when available
resolution status
uncertainty / completeness marking
```

The graph identity must be deterministic for deterministic canonical inputs.

No timestamps, random IDs, machine-specific absolute paths, database row IDs, or traversal order should be required for identity.

---

## 10. Candidate relation vocabulary

The first bounded vocabulary should be small enough to benchmark exactly.

A candidate initial set is:

```text
contains
imports
exports
defines
references
calls
inherits
implements
instantiates
```

A later separately authorized security/data-flow expansion may add:

```text
reads_from
writes_to
flows_to
```

A later runtime-observation expansion may overlay:

```text
calls (runtime-observed provenance)
```

Relation names alone must not encode confidence. Evidence class and producer identity remain separate fields.

---

## 11. Candidate query facade

Kodac should expose backend-neutral queries rather than generic graph traversal to agents.

Highest-value candidates are:

```text
related_files(seed, budget)
impact(seed, maxDepth, relationClasses, budget)
related_tests(seed, budget)
path_between(source, target, budget)
explain_relation(source, target)
```

Possible later queries:

```text
import_cycles
entrypoint_reachability
dead_code_candidates
resource_access
flow_reachability
architecture_communities
```

The query result must preserve the evidence chain used for every returned relation and must expose truncation/incompleteness explicitly.

A graph path is not automatically a causal proof. The result should describe the relation sequence and evidence classes rather than compress it into an unsupported causal statement.

---

## 12. Recommended first separately authorized implementation slice

The smallest high-value slice is **not** persistent GraphRAG and not semantic search.

Recommended candidate:

```text
SNAPSHOT-BOUND RELATION GRAPH + IMPACT / RELATED-FILES BENCHMARK
```

Character:

```text
IN-MEMORY
IMMUTABLE FOR ONE EXACT K3-R2 SNAPSHOT
DETERMINISTIC
NO NETWORK
NO PROCESS EXECUTION
NO FILE WRITES
NO PERSISTENT CACHE
NO DATABASE
NO MODEL CALL
NO EMBEDDINGS
NO VECTOR STORE
NO NEW DEPENDENCIES IF FEASIBLE
NO DONOR SOURCE COPY UNLESS SEPARATELY AUTHORIZED
NO K2 AUTHORITY CHANGE
```

Input should be only already-canonical normalized evidence or separately authorized parser-derived relation evidence bound to the same snapshot.

The slice should prove only:

1. deterministic relation-graph identity;
2. exact snapshot/freshness binding;
3. explicit evidence class and producer on every edge;
4. reverse impact traversal with bounded depth and result budget;
5. relation-site provenance where available;
6. related-file ranking derived from graph evidence rather than model guessing;
7. explicit truncation and unsupported relation handling;
8. no second repository truth and no execution authority.

`related_tests` should enter the first slice only if test relations can be proven from already-authorized normalized evidence. Runtime tracing must not be smuggled into the same authorization.

---

## 13. Separate future runtime-observation gate

Runtime tracing is valuable enough to deserve its own gate, not an implementation detail inside the static graph.

A future gate should answer:

```text
What runtime may execute?
Who authorizes execution?
What exact workload/test identity is traced?
How is the trace artifact bound to repository snapshot identity?
Is the tracer exact or sampled?
What coverage gaps exist?
How is malicious repository-controlled runtime behavior confined?
Can instrumentation execute plugins/build hooks or arbitrary test code?
How is K2 the sole execution authority?
```

Any tracing that executes repository code must pass through a separately authorized K2 path. The Context Engine or graph adapter must never spawn tests, profilers, compilers, or language runtimes directly.

This separation is essential.

---

## 14. Persistent incremental graph remains a later storage/mutation decision

Both donors demonstrate useful update machinery. Kodac should eventually consider incremental graph persistence, but only after the immutable snapshot-bound graph semantics are proven.

A future persistence gate must prove at least:

```text
cache key derives from canonical repository/content identity
no mixed-snapshot edge survival
atomic graph version publication
crash-safe rebuild / reconciliation
stale graph rejection
cross-workspace isolation
bounded storage growth
corrupt-cache fail closed
complete deletion handling
rename handling
producer-version invalidation
schema-version migration semantics
```

The persistent graph must remain a cache/materialization of canonical repository evidence, not a new canonical repository state.

---

## 15. Vector / semantic search decision

Code-Graph-RAG offers optional semantic embeddings and vector stores. Graphify intentionally demonstrates useful graph retrieval without requiring a vector database for its code graph.

Current recommendation:

```text
VECTOR / EMBEDDING INFRASTRUCTURE:
DEFER
```

Reasons:

1. K3-R5 already proves deterministic lexical/path/symbol selection without embeddings.
2. Graph relations can add a large amount of useful structure before semantic vectors are necessary.
3. Embedding model/version/dimension/provider becomes another freshness and provenance axis.
4. Vector similarity must not become factual confidence.
5. A vector store adds persistence and cross-workspace isolation concerns.
6. The graph benchmark should first prove whether structure closes the relevant-file / impact gap sufficiently.

If later authorized, semantic search should be one replaceable retrieval signal feeding Kodac-owned result contracts, not repository truth.

---

## 16. Threat model additions for a future graph layer

A graph implementation must explicitly defend against:

- stale graph accepted for a newer snapshot;
- edges from different snapshots mixed together;
- path or symbol collision causing false identity joins;
- duplicate definitions overwritten rather than represented distinctly;
- ambiguous resolution silently promoted to verified fact;
- inferred edge confidence mistaken for evidence class;
- repository prompt injection embedded in labels/comments/docs;
- graph query resource exhaustion;
- unbounded transitive traversal;
- combinatorial cycle/path enumeration;
- generated/vendor code overwhelming selection;
- malicious filenames or control characters;
- language-specific parser inconsistency hidden behind a unified relation name;
- runtime trace from the wrong workload or wrong snapshot;
- sampled runtime edges presented as exhaustive;
- cache corruption or partial rebuild presented as current/complete;
- deletion/rename leaving ghost edges;
- cross-workspace persistent graph leakage;
- graph result becoming an implicit K2 capability grant.

---

## 17. Benchmark family recommended before implementation promotion

A Kodac-owned graph benchmark should contain fixed repositories/fixtures with exact expected relation and impact sets.

Minimum families:

### 17.1 Exact relation fixtures

- direct import;
- re-export;
- direct call;
- function-as-value reference;
- inheritance / implementation;
- duplicate qualified names / overload-like alternatives;
- dynamic import marked separately;
- unresolved/ambiguous target.

### 17.2 Impact / blast-radius fixtures

- one-hop caller impact;
- multi-hop bounded impact;
- class member -> class consumers;
- import/re-export chain;
- cycles;
- max-depth truncation;
- max-result truncation;
- unrelated sibling exclusion.

### 17.3 Related-test fixtures

- static test reference;
- test importing module through an intermediate helper;
- test only related by name — must not become verified relation;
- future runtime-observed test relation kept distinct from static relation.

### 17.4 Freshness / identity fixtures

- same snapshot deterministic replay;
- modified file changes graph identity;
- deletion removes exact nodes/edges;
- rename semantics;
- mixed-snapshot rejection;
- stale graph rejection;
- producer-version change invalidates affected materialization.

### 17.5 Adversarial fixtures

- prompt-injection-shaped code/comments remain inert data;
- malicious paths;
- graph cycle explosion bounded;
- huge fan-in/fan-out bounded;
- ambiguous relation never promoted;
- generated/vendor exclusion policy explicit;
- malformed source evidence fails closed.

### 17.6 Cross-tool differential benchmark

Where licensing and environment permit, evaluate equivalent questions against:

```text
Kodac built-in / current K3
Graphify pinned donor
Code-Graph-RAG pinned donor
```

Candidate metrics:

```text
relation precision
relation recall
impact precision / recall
related-test precision / recall
stale-state detection
provenance completeness
query determinism
latency
peak memory
index/build cost
incremental update cost
false evidence-class promotion count
```

Donor benchmark results are input evidence; Kodac acceptance must use Kodac-owned gold truth.

---

## 18. Donor-specific adoption recommendation

### Graphify

```text
ADOPT IDEAS / CONTRACT SHAPES:
YES

TOP DONOR AREAS:
- affected / blast-radius traversal
- portable local graph semantics
- source-site-aware relation evidence
- graph diff
- community/path/explain ergonomics
- SHA-based incremental invalidation concepts
- explicit extracted/inferred/ambiguous user-facing distinction

WHOLESALE DEPENDENCY:
NO FOR CURRENT K3

MODEL-DERIVED DOC/MEDIA GRAPH:
NOT FOR FIRST K3 GRAPH SLICE
```

### Code-Graph-RAG

```text
ADOPT IDEAS / CONTRACT SHAPES:
YES

TOP DONOR AREAS:
- unified multi-language relation vocabulary
- explicit Resource nodes
- READS_FROM / WRITES_TO / FLOWS_TO
- runtime-observed CALLS overlay
- test/workload attribution
- dead-code reachability epistemic boundary
- static-missed runtime edge representation

WHOLESALE DEPENDENCY:
NO FOR CURRENT K3

MEMGRAPH AS CANONICAL BACKEND:
NO DECISION

VECTOR SEARCH:
DEFER

AGENT EDITING / NATURAL-LANGUAGE CYPHER AUTHORITY:
REJECT AS K3 TRUST SOURCE
```

---

## 19. Licensing / provenance decision

The current audit studies public source and documentation only.

No donor code is copied into Kodac by this record.

If future founder authorization permits targeted source porting:

- Code-Graph-RAG intake must preserve the MIT notice for copied/substantial portions;
- Graphify intake must preserve Apache-2.0 NOTICE obligations and determine whether the exact copied file/portion has relevant prior-MIT provenance;
- every copied or adapted source unit must have a pinned donor repository, exact commit, path, and license record in Kodac provenance;
- architectural inspiration or clean-room reimplementation should still cite the donor in planning/evidence where it materially informed design;
- donor code must never be copied merely because it is technically convenient when a Kodac-owned small implementation is safer and easier to prove.

Current repository governance remains authoritative even when an external license would legally permit copying.

---

## 20. Relationship to active H4 / PR #130

This audit is deliberately separate from active H4-R4B-B1 work.

It must not change:

```text
PR #130 implementation scope
R4B-B1 Docker admission semantics
R4B-B2 authorization state
H4 completion state
H6 authorization state
K2 execution authority
```

No code-graph donor source or dependency may enter #130.

---

## 21. Final verdict

```text
CODE_GRAPH_RAG_VALUE:
VERY HIGH

GRAPHIFY_VALUE:
VERY HIGH

THEY_SOLVE_THE_SAME_PROBLEM:
NO

BEST KODAC STRATEGY:
COMBINE THEIR STRONGEST IDEAS BEHIND KODAC-OWNED CONTRACTS

GRAPHIFY_PRIMARY DONOR ROLE:
LOCAL DETERMINISTIC GRAPH + IMPACT / NAVIGATION / INCREMENTAL ERGONOMICS

CODE_GRAPH_RAG_PRIMARY DONOR ROLE:
DEEP RELATION SCHEMA + RESOURCE/DATA-FLOW + RUNTIME-OBSERVED EVIDENCE

PERMANENT BACKEND SELECTION:
DEFER

WHOLESALE SOURCE IMPORT:
REJECT

FIRST FUTURE IMPLEMENTATION CANDIDATE:
IMMUTABLE SNAPSHOT-BOUND RELATION GRAPH
+
BOUNDED IMPACT / RELATED-FILES QUERY
+
KODAC-OWNED GOLD BENCHMARK

RUNTIME TRACING:
SEPARATE FUTURE K2-GOVERNED EVIDENCE GATE

PERSISTENCE / WATCHER:
SEPARATE FUTURE STORAGE/MUTATION GATE

VECTOR / EMBEDDINGS:
DEFER

K3-R6+ AUTHORIZED BY THIS AUDIT:
NO

CODE IMPORT AUTHORIZED BY THIS AUDIT:
NO
```

The strategic opportunity is larger than adding GraphRAG to Kodac.

Kodac can make repository intelligence **evidence-native**: static/parser/compiler/runtime relations remain distinguishable; every edge is snapshot-bound and provenance-bearing; graph traversal powers impact and related-test reasoning; ContextBundle selection consumes those bounded results; and K2 remains the sole side-effect authority.

That architecture would preserve the best ideas from both donors while adding the trust, freshness, evidence hierarchy, and execution-boundary properties that neither donor should be assumed to provide in Kodac's canonical form.
