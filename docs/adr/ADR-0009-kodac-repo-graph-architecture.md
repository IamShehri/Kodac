# ADR-0009: Kodac Repo Graph Architecture

Status: Proposed
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Coding agents often rely on grep, embeddings, or prompt-time repository summaries. Those techniques are useful but insufficient for reliable impact analysis, architectural reasoning, cross-file editing, review, and verification.

The K0/K1 donor tournament found complementary strengths:

- OpenCode provides LSP integration and runtime repository tooling;
- Aider demonstrates the value of Tree-sitter-derived definitions/references, graph ranking, and token-budgeted repository maps;
- Kilo provides indexed file/search infrastructure;
- Tree-sitter is a mature incremental parsing foundation;
- SCIP provides a language-neutral code-intelligence representation for precise symbols/occurrences;
- ast-grep provides structural search and rewrite capabilities.

No single source should become Kodac's canonical repository truth.

## Decision

Kodac will build a **native, evidence-backed Repo Graph** as the canonical repository-intelligence layer.

Text search, embeddings, LSP, Tree-sitter, SCIP, Git history, package metadata, tests, and structural search are inputs/views—not the canonical model by themselves.

## Graph model

Initial node classes should support at least:

- Workspace
- Repository
- File
- Directory
- Package/Module
- Symbol
- API/Endpoint
- Schema/Data contract
- Test
- Build/CI target
- Dependency
- ADR
- Specification/Requirement
- Commit/Change
- Risk/Finding

Initial edge classes should support at least:

- contains
- defines
- references
- calls
- imports
- implements
- depends_on
- tests
- exposes
- consumes
- changes
- governed_by
- satisfies
- violates_or_conflicts_with
- related_to

The exact storage engine is deferred; the logical schema is canonical.

## Evidence on graph facts

Graph facts must preserve provenance.

Where practical, every non-trivial edge records:

```text
source adapter
source file/artifact
digest or source revision
confidence/precision class
observed_at
derivation method
```

Precise compiler/LSP/SCIP facts should be distinguishable from heuristic or model-inferred relationships.

## Input layers

### Syntax

Tree-sitter or equivalent incremental parsers provide syntax trees, symbol candidates, scopes, and structural boundaries.

### Precise semantic intelligence

LSP and/or SCIP-derived data provide definitions, references, implementations, and language-specific semantic relationships when available.

### Structural search

ast-grep or equivalent structural engines provide query/rewrite and policy-oriented pattern matching.

### Repository history

Git provides change history, blame/ownership signals, co-change relationships, and diff history.

### Build/package system

Package manifests, lockfiles, build graphs, workspace manifests, and CI definitions provide dependency and verification relationships.

### Tests

Kodac records explicit and inferred test-to-code relationships so change impact can propose the smallest credible verification set before broad regression gates.

### Specifications and architecture

ADRs, specs, acceptance criteria, policy documents, and architecture manifests may be indexed as governed engineering artifacts, with explicit source identity rather than silently treated as free text.

### Semantic retrieval

Embeddings may provide semantic candidates and ranking signals, but vector similarity does not override precise graph facts.

## Cross-repository readiness

The graph identity model must include workspace/repository namespaces from the start.

Kodac must not assume `workspace == one repository`.

This permits later representation of:

- service-to-service API dependencies;
- schema consumers;
- SDK users;
- shared packages;
- mobile/web/backend relationships;
- multi-repository blast radius.

K2 does not need full cross-repo execution, but the data model must not make it impossible.

## Query surface

The first stable query vocabulary should converge toward semantic operations such as:

```text
find_symbol
find_definitions
find_references
find_callers
find_callees
related_files
related_tests
impact
architecture_context
change_history
semantic_search
```

Agents should call these semantic queries instead of binding directly to a specific parser/index database.

## Incrementality and freshness

Repo Graph updates must be incremental where practical.

Every graph snapshot/partition should have enough revision metadata to answer whether it represents the current working tree, a Git commit, or a stale index.

Stale semantic data must be marked; it cannot silently masquerade as current truth.

## Context Engine relationship

The Repo Graph does not dump itself into prompts.

The Context Engine chooses a bounded view based on task, risk, model, token budget, recent changes, and evidence quality.

A compact Aider-style repository map is one possible view produced from the graph, not the graph itself.

## Review and verification relationship

Proof Review, Security, and Done Gate may use the graph to determine:

- affected callers/consumers;
- relevant tests;
- architecture/spec conflicts;
- cross-repository impact;
- whether a claimed fix addresses the observed path.

Model-generated graph hypotheses must be distinguishable from verified static/dynamic facts.

## Storage deferral

K0/K1 does not choose Neo4j, SQLite, DuckDB, embedded KV, graph DB, or vector database as the permanent backend.

K2 should choose the simplest local representation that satisfies canonical query and freshness tests. Storage replacement must not change public Repo Graph semantics.

## Rejected alternatives

### Vector RAG as canonical repository intelligence

Rejected because similarity retrieval cannot reliably represent precise definitions, references, dependency direction, or architecture constraints.

### Aider RepoMap as the canonical structure

Rejected because a prompt-oriented compact map is a useful derived view, not sufficient durable repository truth.

### LSP-only intelligence

Rejected because language-server support and semantic completeness vary and do not cover Git/spec/test/history relationships.

## Gate

K2 may begin with a minimal graph for files, symbols, definitions/references, Git revision, and related tests. Every added indexer must map into the Kodac graph/query boundary rather than creating a competing repository truth.
