# Kodac Developer OS — First-Wave Donor Capability Matrix

## Scope

```text
Program authority:
184e29af503e70bba3fac90c8165d3facd698819

Donors:
JetBrains/intellij-community@bfca8a6815c70221a574383fc23542afb0af5bf7
continuedev/continue@5522c6f44ca0ac3528b37244818fbfa39b5af470
augmentcode/context-connectors@f7d6472ae626c98fd768f64cdfd6160145eefa77
```

This is a source-study matrix, not an assertion that every capability of the upstream commercial products is present in the pinned public repositories.

Legend:

```text
KODAC PRESENT     = capability already exists materially in Kodac
KODAC PARTIAL     = useful Kodac primitive exists but not product-complete
KODAC MISSING     = no meaningful implementation yet
DONOR STRONG      = first-wave donor has a strong source/design primitive
DONOR PARTIAL     = useful pattern exists but is coupled/incomplete for Kodac
OUTPERFORM TARGET = Kodac should exceed the donor behavior, not merely match it
```

| Domain | Capability | Kodac | IntelliJ | Continue | Augment connectors | Target / disposition |
|---|---|---:|---:|---:|---:|---|
| Semantic engine | Rich language-neutral program element model | PARTIAL | STRONG | PARTIAL | — | **OUTPERFORM TARGET** — port PSI concepts into provenance-aware Kodac Semantic Graph |
| Semantic engine | AST/tree navigation | PARTIAL | STRONG | PARTIAL via tree-sitter ecosystem | — | Port semantic contracts; retain language adapters |
| Semantic engine | Reference resolution | PARTIAL | STRONG | PARTIAL | — | K3 semantic reference graph |
| Semantic engine | Symbol declarations/usages | PARTIAL | STRONG | PARTIAL | — | Semantic graph + exact revision identities |
| Semantic engine | Source range/navigation targets | PARTIAL | STRONG | PARTIAL | — | Adopt PSI-style distinction between source/original/navigation identity |
| Indexing | File/project indexing lifecycle | PARTIAL | STRONG | STRONG | STRONG | **OUTPERFORM TARGET** — one local incremental index plane |
| Indexing | Incremental invalidation | PARTIAL | STRONG | STRONG | STRONG | Combine mature invalidation patterns with K3 freshness/provenance |
| Indexing | Keyed symbol/content queries | PARTIAL | STRONG | PARTIAL | PARTIAL | Port index-query contracts |
| Indexing | Rebuild/reindex semantics | PARTIAL | STRONG | PARTIAL | full fallback present | Add deterministic rebuild receipts |
| Indexing | Full vs incremental source refresh | PARTIAL | PARTIAL | PARTIAL | STRONG | Port Augment orchestration, replace hosted engine |
| Indexing | Deleted-file correctness | PARTIAL | STRONG | PARTIAL | STRONG | Explicit removal semantics + regression corpus |
| Context | Context provider abstraction | PARTIAL | extension-driven | STRONG | STRONG source/client split | **OUTPERFORM TARGET** — scoped capability providers with provenance |
| Context | Selected-code/context inputs | PARTIAL | STRONG IDE integration | STRONG | — | Bridge current IDE selection into K3 evidence |
| Context | Repository filtering | PARTIAL | STRONG indexing filters | PARTIAL | STRONG | Candidate direct import/port from Augment filter |
| Context | Generated/binary/ignored-file filtering | PARTIAL | STRONG | PARTIAL | STRONG | Dedicated K3 intake-security filter gate |
| Context | Connector sources (GitHub/GitLab/Bitbucket/web) | MISSING | — | PARTIAL | STRONG | Port source interfaces; authorize concrete network connectors separately |
| Context | Connector stores | MISSING | internal IDE indexes | PARTIAL | STRONG | Kodac-owned local store contracts first |
| Context | MCP context exposure | PARTIAL | — | STRONG ecosystem | STRONG | Integrate behind capability-scoped MCP runtime |
| Model plane | Unified LLM interface | PARTIAL | AI layer outside this donor wave | STRONG | — | Continue contract is high-priority port candidate |
| Model plane | Chat | PRESENT/PARTIAL | — | STRONG | — | Normalize under Kodac model plane |
| Model plane | Streaming chat/completion | PARTIAL | — | STRONG | — | Port tests/patterns, not ambient transport authority |
| Model plane | Fill-in-the-middle | MISSING/PARTIAL | — | STRONG | — | Add model-capability negotiation |
| Model plane | Embeddings | PARTIAL | — | STRONG contract | hosted engine underneath | Keep optional, not core authority |
| Model plane | Reranking | PARTIAL | — | STRONG contract | hosted engine underneath | Provider-neutral optional capability |
| Model plane | Token counting/budgeting | PARTIAL | — | STRONG | — | Small direct-import candidate after tokenizer audit |
| Model plane | Model discovery/autodetect | PARTIAL | — | STRONG | — | Separate network-qualified discovery gate |
| Model plane | Provider capability predicates | PARTIAL | — | STRONG | — | Model registry should expose supported modes explicitly |
| IDE | VS Code bridge | PARTIAL/MISSING | — | STRONG | — | Fork-and-evolve candidate |
| IDE | JetBrains bridge | MISSING | native platform | STRONG extension | — | Bridge path before full native Kodac IDE |
| IDE | CLI/TUI coding surface | PARTIAL | terminal integration | STRONG | CLI client | Consolidate into Kodac CLI |
| IDE | Project semantic awareness | PARTIAL | STRONG | PARTIAL | context-only | **OUTPERFORM TARGET** with Semantic Graph + K3 |
| Refactoring | Rename/move/extract/change signature framework | MISSING/PARTIAL | STRONG | edit/diff only | — | IntelliJ design port, K2-mediated writes |
| Refactoring | Transactional semantic preconditions | MISSING | STRONG pattern | PARTIAL | — | **OUTPERFORM TARGET** with proof-backed refactor receipts |
| Diagnostics | Language inspections | PARTIAL | STRONG | PARTIAL | — | Port inspection architecture into Verification plane |
| Diagnostics | Quick-fix separation from finding | PARTIAL | STRONG | edit agent patterns | — | Preserve KRI claim/adjudication/write separation |
| Plugins | Typed extension points | PARTIAL | STRONG | config/extensions | clients/plugins | Build capability-scoped plugin system, not ambient plugin authority |
| Plugins | Skills/rules/config | PARTIAL | settings/plugins | STRONG | — | Unify skill/rule formats under Kodac capability registry |
| Editing | Inline/edit primitives | PRESENT/PARTIAL | STRONG editor | STRONG | — | Keep Kodac edit path but adopt semantic refactor layer |
| Editing | Diff application | PRESENT | STRONG | STRONG | — | Kodac K2 trust boundary is the differentiator |
| Autocomplete | Inline completion | MISSING/PARTIAL | STRONG IDE | STRONG | — | Continue donor candidate + future native IDE semantic context |
| Agent | Plan/chat/edit/agent workflow | PARTIAL | Junie outside source wave | STRONG | agent client only | Continue behavioral/source donor; Kodac adds proof chain |
| Agent | Multi-provider model selection | PARTIAL | — | STRONG | — | Universal model plane |
| Agent | Tool invocation | PRESENT/PARTIAL | IDE actions | STRONG | clients | Preserve K2 capability mediation |
| Sessions | Persistent conversation/session model | PARTIAL | IDE workspace state | STRONG session types | state stores | Kodac memory graph should subsume simple session history |
| Trust | Exact revision provenance | **STRONG** | not central donor primitive | PARTIAL | source metadata | **KODAC ADVANTAGE** |
| Trust | Side-effect gateway | **STRONG** | IDE platform permissions, not same model | PARTIAL | direct API/store operations | **KODAC ADVANTAGE** — never weaken |
| Trust | Reviewer adjudication | **STRONG** | inspections only | — | — | **KODAC ADVANTAGE** |
| Trust | Qualification benchmark | **STRONG** | — | tests but not same authority model | — | **KODAC ADVANTAGE** |
| Trust | `PROVEN_READY` separation | **STRONG** | — | — | — | **KODAC ADVANTAGE** |

## Highest-leverage gaps exposed by the first wave

### 1. Semantic graph is the largest missing foundation

Kodac already has bounded repository/context intelligence, but it does not yet have an IntelliJ-class semantic object model spanning program elements, references, navigation identity, refactorability, and index-backed symbol queries.

The target should not be a JVM PSI clone. It should be:

```text
Kodac Semantic Node
+ language adapter
+ stable source identity
+ exact revision identity
+ symbol/reference identity
+ provenance
+ mutation/refactor preconditions
+ incremental index hooks
```

### 2. Continue can accelerate the universal model plane

Continue's pinned source exposes a broad model interface covering completion, streaming completion, FIM, streaming chat, chat, embedding, reranking, token counting, model listing, prompt templates, capability predicates, configuration and provider metadata.

Kodac should reuse the useful abstraction lessons while removing ambient authority such as direct API-key/fetch access from core contracts.

### 3. Augment's connector architecture should inform Context Fabric, not replace it

The source/store/client separation and full/incremental orchestration are strong donor primitives. The pinned `Indexer` also demonstrates why wholesale import is wrong for Kodac: it reads Augment API configuration and delegates to hosted `DirectContext` operations.

Kodac should port:

```text
Source
Store
Client
ChangeSet
Full / Incremental / Unchanged state machine
```

while replacing hosted engine operations with local K3/Context Fabric behavior.

## First recommended component gates

Priority order:

1. **KDO-C6 — Continue Model Contract Port**
   - fast, high product leverage;
   - mostly contracts/pure logic first;
   - enables universal provider/model plane without granting network authority.

2. **KDO-C11 — Context Connector Contract Port**
   - source/store/client interfaces only;
   - no concrete network connector yet.

3. **KDO-C12 — Augment Incremental Indexer State-Machine Port**
   - port orchestration only;
   - use Kodac local context engine instead of Augment hosted `DirectContext`.

4. **KDO-C1 — IntelliJ Semantic Element Contract Port**
   - foundational semantic model;
   - language-neutral, Rust/TypeScript-friendly boundary;
   - no direct JVM dependency.

5. **KDO-C2 — Semantic Index Contract Port**
   - incrementality, modification stamps, keyed queries, cancellation/rebuild semantics.

6. **KDO-C13 — Context File Filter Qualification**
   - small selective-import candidate;
   - build secret/generated/binary/ignore adversarial corpus before intake.

7. **KDO-C10 — Continue IDE Bridge Deep Audit**
   - VS Code + JetBrains + CLI surfaces;
   - high side-effect/host-authority risk, so after core contracts.

8. **KDO-C3/KDO-C4/KDO-C5 — IntelliJ Refactor / Inspection / Extension ports**
   - later, once semantic model/index foundation exists.

## What the first wave does *not* justify

The evidence does not justify:

- forking all of IntelliJ into Kodac;
- importing Continue's whole `core/` without dependency/security separation;
- importing Augment's current `Indexer` unchanged;
- running donor code under Kodac privileges;
- adding donor dependencies to Kodac manifests;
- treating upstream provider credentials/network access as ordinary library functionality;
- changing K2/KRI/Done Gate authority.

The first-wave goal is to convert donor intelligence into **small, testable, replaceable Kodac-native primitives**.
