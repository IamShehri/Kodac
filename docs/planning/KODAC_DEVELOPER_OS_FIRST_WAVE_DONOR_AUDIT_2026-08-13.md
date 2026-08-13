# Kodac Developer OS — First-Wave Donor Audit

## Decision

```text
DECISION:
FIRST_WAVE_AUDIT_COMPLETE_FOR_DOCUMENTED SCOPE

PROGRAM AUTHORITY:
184e29af503e70bba3fac90c8165d3facd698819

PRODUCTION DONOR IMPORT:
NOT AUTHORIZED BY THIS AUDIT

DONOR EXECUTION:
NOT PERFORMED / NOT AUTHORIZED
```

This audit converts the first three source donors into component-level engineering decisions. It does not install dependencies, run donor code, execute donor build systems, or modify Kodac production/runtime paths.

## First-wave source pins

### JetBrains IntelliJ Community

```text
Repository: JetBrains/intellij-community
Pinned commit: bfca8a6815c70221a574383fc23542afb0af5bf7
```

Observed root terms file:

```text
LICENSE.txt
JETBRAINS OPEN-SOURCE BUILD TERMS
Version 1.3, effective June 15, 2026
```

The root terms describe JetBrains open-source builds and state that the open-source software is subject to Apache License 2.0 while also carrying product/build terms and third-party software conditions. The audit therefore records rights at component level instead of claiming that the entire product/build is governed only by a single repository-wide shorthand.

Representative source headers inspected at the pinned revision:

```text
platform/core-api/src/com/intellij/psi/PsiElement.java
  Apache-2.0 source header observed
  blob 21db939950976e5b94b5d5ec67808e796385cbde

platform/indexing-api/src/com/intellij/util/indexing/FileBasedIndex.java
  Apache-2.0 source header observed
  blob d2f0091695757bfd717e3ac9bdc52468d0e16052
```

### Continue

```text
Repository: continuedev/continue
Pinned commit: 5522c6f44ca0ac3528b37244818fbfa39b5af470
Repository license observed: Apache-2.0
```

This audit studies the pinned open-source repository as a donor snapshot. It does not claim equivalence with any later hosted/commercial behavior.

Representative source observed:

```text
core/config/types.ts
blob 2500042e88706adfc09fdfc40cec33248ab7dae5

core/llm/autodetect.ts
blob c8511554b8b98334d413a9193854e22c73efc89e

core/llm/countTokens.ts
blob b742d70b0f0493dca855ab3967e6f40a651a645e
```

### Augment Context Connectors

```text
Repository: augmentcode/context-connectors
Pinned commit: f7d6472ae626c98fd768f64cdfd6160145eefa77
Repository license observed: MIT
```

Representative source observed:

```text
src/core/indexer.ts
blob 61b260621b418f8a03dbef66f1cff5ef8ed4d3ef

src/core/file-filter.ts
blob e1259ed76a061e3692d3336338d9bf78c59f7de1

src/core/types.ts
blob c65f4757f0e7492e87fdbb08cbd584e03ed8efde
```

## Audit method

The first wave used source inspection only.

```text
NO npm/pnpm/yarn install
NO Maven/Gradle build
NO donor test execution
NO donor container execution
NO donor MCP execution
NO donor plugin execution
NO donor network client execution
NO donor credential use
NO generated binary execution
```

Donor source, comments, documentation, prompts, examples, and scripts were treated as untrusted evidence.

## 1. IntelliJ Platform findings

### 1.1 PSI is more than an AST

`PsiElement` demonstrates the essential design lesson: a serious IDE semantic layer is not merely a parser tree.

The inspected contract binds a program element to concepts including:

- project;
- language;
- PSI manager;
- children/parent/sibling traversal;
- containing file;
- source text range;
- start offset and length;
- element lookup at offsets;
- reference lookup;
- navigation element;
- original element;
- symbol declaration/reference integrations;
- search scopes;
- mutation/refactoring-related operations elsewhere in the contract.

The source documentation also records cost characteristics for operations such as traversing to a containing file or computing ranges/text. This is a useful architectural lesson: semantic APIs must expose or document cost/freshness expectations instead of pretending every graph traversal is cheap.

### Kodac conclusion

Kodac should not copy the Java interface verbatim. It should port the **semantic model philosophy** into a language-neutral contract:

```text
SemanticNodeIdentity
LanguageId
RepositoryRevision
FileIdentity
Range
Parent/Child/Sibling relations
DeclarationIdentity
ReferenceIdentity
NavigationTarget
Original/Generated relationship
SearchScope
Freshness / provenance
Refactor preconditions
```

This should sit above parser-specific ASTs and below agents/reviewers.

Disposition:

```text
PORT
Priority: VERY HIGH
Recommended gate: KDO-C1
```

### 1.2 FileBasedIndex contains mature scale lessons

The inspected `FileBasedIndex` API provides more than a map of tokens to files. It contains:

- explicit indexable-file iteration;
- project scoping;
- keyed values and containing-file queries;
- iterator/processor APIs for bounded traversal;
- modification stamps;
- rebuild and reindex requests;
- project lifecycle hooks;
- query scopes;
- warnings about long read actions on large projects;
- cancellation/background-thread semantics;
- documented tradeoffs where query results may contain irrelevant/orphan keys but guarantee inclusion properties.

This is especially valuable to Kodac because K3 currently emphasizes deterministic evidence/freshness, while an IntelliJ-class IDE requires continuously updated semantic indexes under active edits.

### Kodac conclusion

Port the concepts, not the JVM service graph.

Kodac's version should add guarantees IntelliJ's generic index API is not designed around:

```text
exact repository revision identity
working-tree snapshot identity
source provenance
bounded completeness metadata
rebuild receipt
stale-state signal
K2-mediated persistent index mutation where needed
```

Disposition:

```text
PORT
Priority: VERY HIGH
Recommended gate: KDO-C2
```

### 1.3 Refactoring is a separate semantic subsystem

The source tree exposes dedicated refactoring factories/APIs rather than treating refactoring as arbitrary string replacement.

Kodac currently has safe patch/execution primitives but should evolve toward semantic refactor planning:

```text
resolve target
compute affected declarations/references
check preconditions
build deterministic change plan
preview blast radius
execute through K2
re-index/re-verify
record receipt
KRI review
Done Gate verification
```

Disposition:

```text
PORT / STUDY
Priority: HIGH after KDO-C1/C2
Recommended gate: KDO-C3
```

### 1.4 Inspection architecture maps well to KRI — with a critical difference

IntelliJ's inspection model is a mature way to register diagnostics and fixes. Kodac can borrow the architecture, but must preserve its stronger authority model:

```text
Inspection finding = claim
Quick fix = proposed action
KRI adjudication = separate truth process
K2 = write authority
Done Gate = completion authority
```

Disposition:

```text
PORT
Priority: HIGH
Recommended gate: KDO-C4
```

### 1.5 Extension points are a useful architecture but an unsafe authority default

A typed extension-point ecosystem is essential if Kodac is to replace multiple developer tools. IntelliJ's extension architecture is therefore a strong design donor.

Kodac, however, must not inherit the assumption that a loaded plugin can freely obtain ambient IDE capabilities.

Kodac extension registration should bind:

```text
extension identity
publisher/provenance
requested capabilities
allowed repository scope
network permission
process permission
filesystem permission
credential scope
UI contribution scope
version/compatibility
revocation state
```

Disposition:

```text
PORT
Priority: HIGH
Recommended gate: KDO-C5
```

### IntelliJ whole-repository decision

```text
WHOLE REPOSITORY FORK INTO KODAC:
REJECTED AS CURRENT ARCHITECTURAL STRATEGY

WHY:
- enormous JVM/IDE-platform coupling;
- Kodac has a different trust kernel;
- direct inheritance would make Kodac an IntelliJ derivative shell rather than a portable engineering OS;
- the highest-value pieces are architectural primitives that can be ported cleanly.
```

This is not a rejection of IntelliJ as a donor. It is a decision to treat it as a **subsystem design mine**, not Kodac's base repository.

## 2. Continue findings

### 2.1 Continue has a broad model contract worth adapting

The inspected `ILLM` contract exposes a useful unified model surface:

```text
complete
streamComplete
streamFim
streamChat
chat
embed
rerank
countTokens
supportsImages
supportsCompletions
supportsPrefill
supportsFim
listModels
prompt-template rendering
```

It also carries model/provider metadata, context length, completion options and request settings.

This is close to the universal model plane Kodac needs.

### What Kodac should not copy blindly

The same broad types show why direct import into Kodac's trust core is undesirable: provider-related fields include values such as API keys, API bases and a fetch function can be supplied into context-provider extras.

Kodac must separate:

```text
Model capability contract
from
Credential capability
from
Network transport capability
from
Provider discovery capability
```

A model object should not acquire ambient network/secrets authority merely because it implements completion.

Disposition:

```text
PORT
Priority: #1 first production donor gate
Recommended gate: KDO-C6
```

### 2.2 Model autodetection is useful but operationally sensitive

Continue contains provider/model autodetection and model-fetching logic with dedicated tests.

Kodac should use this as a donor for provider discovery, but execution may imply:

- local service probing;
- network requests;
- credential usage;
- provider-specific parsing;
- rapidly changing model catalogs.

Therefore:

```text
SOURCE STUDY: YES
DIRECT EXECUTION: NO UNDER FIRST-WAVE AUDIT
NEXT: bounded discovery qualification gate
```

Disposition:

```text
SELECTIVE_DIRECT_IMPORT_CANDIDATE / PORT
Recommended gate: KDO-C7
```

### 2.3 Token budgeting is an attractive small donor

`countTokens.ts` plus associated tests represents the kind of donor that can create immediate leverage without importing a whole architecture.

Potential value:

- model-specific context accounting;
- prompt budget enforcement;
- safer context packing;
- predictable truncation behavior.

Disposition:

```text
SELECTIVE_DIRECT_IMPORT_CANDIDATE
Priority: HIGH
Recommended gate: KDO-C8
```

The component gate must inspect tokenizer dependencies and measure accuracy before source intake.

### 2.4 Continue's context provider model is useful but too ambient for Kodac

The pinned types include context provider modes and provider extras carrying configuration, selected code, embeddings/reranker/model references, an IDE object and a fetch function.

This is ergonomically powerful but violates the direction of Kodac's trust kernel if copied literally.

Kodac should port the provider ecosystem concept while replacing ambient objects with scoped interfaces:

```text
ContextRequest
ReadOnlyRepositoryCapability
SelectedRangeEvidence
OptionalModelCapability
OptionalNetworkCapability
bounded output
provenance requirements
```

Disposition:

```text
PORT
Recommended gate: KDO-C9
```

### 2.5 Continue is a strong bridge donor

The source layout includes separate surfaces for:

```text
extensions/vscode/**
extensions/intellij/**
extensions/cli/**
```

This is strategically important. Kodac does not need to wait for a complete native IDE before becoming the user's single AI engineering system. It can provide Kodac trust/context/agent behavior inside existing IDE hosts first.

Disposition:

```text
FORK_AND_EVOLVE BY HOST EXTENSION
Priority: HIGH after model/context contracts
Recommended gate: KDO-C10
```

Because host extensions can edit files, invoke terminals and interact with IDE APIs, this gate requires explicit capability mapping to K2.

### Continue whole-repository decision

```text
WHOLE REPOSITORY BLIND COPY:
REJECTED

SUBSYSTEM FORK/PORT:
STRONGLY RECOMMENDED
```

Continue is much closer to Kodac's TypeScript/model-agent domain than IntelliJ, so source reuse can be more direct, but the trust architecture still requires boundary rewriting.

## 3. Augment Context Connectors findings

### 3.1 Source → Indexer → Store separation is a strong donor pattern

The repository architecture distinguishes where content comes from, how indexing is orchestrated, and where state is persisted/exposed.

This maps cleanly to Kodac Context Fabric:

```text
Source Adapter
    ↓
Intake Filter
    ↓
Change Detection
    ↓
Kodac Indexer
    ↓
Kodac Context Store
    ↓
K3 Evidence / Search / MCP Client
```

Disposition:

```text
PORT
Priority: VERY HIGH
Recommended gate: KDO-C11
```

### 3.2 Incremental indexing state machine is reusable; engine coupling is not

The inspected `src/core/indexer.ts` explicitly orchestrates:

1. load previous state;
2. full index when no state exists;
3. ask the source for incremental changes;
4. full fallback when incremental changes are unavailable;
5. unchanged fast path;
6. removal of deleted files;
7. add new/modified files;
8. refresh metadata;
9. persist updated full/search state.

This state machine is directly relevant to Kodac.

But the same file also:

- imports `@augmentcode/auggie-sdk`;
- creates/imports `DirectContext`;
- accepts/reads Augment API credentials and URL;
- performs network-backed indexing operations;
- stores hosted-context state.

Therefore direct import of the existing class is not the right design.

Disposition:

```text
PORT THE STATE MACHINE
REPLACE THE HOSTED ENGINE
Recommended gate: KDO-C12
```

Kodac's target should use its own local Context Fabric/K3 implementation.

### 3.3 File filtering is a promising selective import

`src/core/file-filter.ts` is small, bounded and accompanied by tests. It may be a high-value low-coupling component for generated/ignored/binary/context-safety filtering.

It still requires adversarial qualification against:

- secrets;
- generated artifacts;
- vendor directories;
- binary formats;
- symlinks/path normalization;
- unusual extensions;
- case-insensitive filesystems;
- nested ignore rules.

Disposition:

```text
SELECTIVE_DIRECT_IMPORT_CANDIDATE
Recommended gate: KDO-C13
```

## Cross-donor synthesis

The three donors converge on a useful architecture:

```text
INTELLIJ
semantic structure + indexing + refactoring + inspections + extension lifecycle

CONTINUE
models + agents + context providers + IDE bridges + token/model utilities

AUGMENT CONNECTORS
external sources + incremental indexing + state/store/client separation
```

Kodac should **not** stack those architectures side-by-side. It should normalize them into one system:

```text
                    ┌─────────────────────────┐
                    │      Kodac Surfaces     │
                    │ Native IDE / VS Code /  │
                    │ JetBrains / CLI / Web   │
                    └───────────┬─────────────┘
                                │
                    ┌───────────▼─────────────┐
                    │      Agent Mesh         │
                    │ Plan / Build / Debug /  │
                    │ Test / Review / Refactor│
                    └───────────┬─────────────┘
                                │
      ┌─────────────────────────▼────────────────────────┐
      │                 Context Fabric                   │
      │ Semantic Graph + Incremental Index + Connectors  │
      │ History + Docs + PRs + Runtime Evidence          │
      └─────────────────────────┬────────────────────────┘
                                │
      ┌─────────────────────────▼────────────────────────┐
      │             Universal Model Plane                │
      │ Chat / Completion / FIM / Embed / Rerank         │
      │ Provider-neutral capability contracts            │
      └─────────────────────────┬────────────────────────┘
                                │
      ┌─────────────────────────▼────────────────────────┐
      │             Trust & Evidence Kernel              │
      │ K2 + K3 + KRI + Verification + Done Gate         │
      └──────────────────────────────────────────────────┘
```

## Capability gap decision

The highest-value missing capabilities exposed by source audit are:

```text
GAP-1  language-neutral semantic object model
GAP-2  continuously updated semantic index
GAP-3  semantic refactoring engine
GAP-4  unified inspection/diagnostic extension contract
GAP-5  capability-scoped plugin/extension system
GAP-6  richer universal model/provider contract
GAP-7  robust token/model discovery infrastructure
GAP-8  pluggable context source/store/client contracts
GAP-9  full/incremental external-context indexing
GAP-10 production-grade VS Code/JetBrains bridge strategy
```

Kodac already has a relative advantage in:

```text
ADV-1 side-effect authority separation through K2
ADV-2 exact revision/provenance evidence
ADV-3 reviewer output as claim rather than truth
ADV-4 adjudication lifecycle
ADV-5 reviewer qualification benchmark
ADV-6 Done Gate / PROVEN_READY separation
```

The donor program must close the product-capability gaps **without sacrificing these advantages**.

## Recommended implementation sequence

### Wave C — foundation components

```text
C6  Continue Model Contract Port
C11 Context Connector Contract Port
C1  Semantic Element Contract Port
C2  Semantic Index Contract Port
```

Why this order:

- C6 unlocks model/provider breadth quickly;
- C11 makes external knowledge sources pluggable;
- C1/C2 are the core of IntelliJ-class IDE intelligence and should be designed carefully rather than rushed.

### Wave D — high-leverage utilities

```text
C8  Token Budgeting Qualification
C13 Context File Filter Qualification
C12 Incremental Indexer State-Machine Port
C9  Context Provider Contract Port
```

### Wave E — developer interface and semantics

```text
C10 IDE Bridge Deep Audit / Fork Plan
C3  Semantic Refactor Engine
C4  Inspection Contract
C5  Capability-Scoped Extension Runtime
```

## Later donor waves

The current first wave is not sufficient for the full Developer OS target.

The next discovery/audit waves should cover:

### Reviewer / code-quality systems

```text
Greptile
Cubic
CodeRabbit
Qodo / PR-Agent
```

Targets:

- repository graph review;
- review memory;
- incremental review;
- policy/rules;
- testing generation;
- security/compliance review;
- PR conversations;
- runtime validation;
- reviewer learning.

KRI already provides the authority model into which these capabilities should plug.

### Change / PR / shipping systems

```text
Graphite
GitButler
Jujutsu
```

Targets:

- stacked changes;
- branchless/change-oriented workflows;
- restacking;
- merge queues;
- PR inbox;
- CI optimization;
- change dependency graph;
- developer-flow analytics.

### Agent / IDE systems

```text
GitHub Copilot
JetBrains AI / Junie
Zed
other authorized/open agent systems
```

Targets:

- custom/subagents;
- skills;
- hooks;
- remote agents;
- debugger interaction;
- checkpoints/rollback;
- IDE-native orchestration;
- agent sandboxing.

## Import-policy conclusion

The first wave supports a clear rule:

> **Copy the smallest useful primitive, port the strongest architecture, fork only coherent subsystems, and never inherit donor authority.**

This is faster and safer than wholesale forks while still exploiting the user's broad donor rights and public open-source source bases.

## Recommended immediate next gate

The best first production donor gate is:

```text
KDO-C6 — Continue Model Contract Port
```

Proposed scope:

- study and adapt only model capability/type contracts first;
- no provider HTTP clients;
- no API-key handling;
- no ambient fetch;
- no new dependency initially;
- no package/lockfile mutation unless separately justified;
- preserve existing Kodac model interfaces where compatible;
- add explicit capabilities for chat/completion/FIM/embed/rerank/token counting/model listing;
- bind actual network execution later through a separate provider transport gate;
- tests must prove existing K2/KRI authority surfaces unchanged.

Second gate in parallel planning:

```text
KDO-C11 — Context Connector Contract Port
```

No concrete GitHub/GitLab/web connector execution should be authorized until the pure connector contracts exist and are reviewed.

## First-wave closure truth

```text
FIRST-WAVE SOURCE PINS:
COMPLETE

RIGHTS SIGNALS:
RECORDED AT REPOSITORY LEVEL
COMPONENT-LEVEL REVIEW REQUIRED WHERE NOT EXPLICITLY INSPECTED

ARCHITECTURE AUDIT:
COMPLETE FOR IDENTIFIED PRIORITY COMPONENTS

CAPABILITY MATRIX:
CREATED

COMPONENT DISPOSITIONS:
CREATED

DONOR EXECUTION:
NONE

KODAC PRODUCTION SOURCE IMPORT:
NONE

NEXT:
SEPARATE COMPONENT IMPORT / PORT AUTHORIZATION GATES
```
