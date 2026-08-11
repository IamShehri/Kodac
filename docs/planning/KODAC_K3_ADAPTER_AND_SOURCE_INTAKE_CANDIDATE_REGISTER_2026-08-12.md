# Kodac K3 Adapter and Source-Intake Candidate Register — 2026-08-12

## Purpose

This register records external implementation candidates for future K3 benchmarking and source-intake review.

It is not an import authorization.

Canonical readiness baseline:

```text
1d469a1062f34bb66c6bff8fc330472d74e71317
```

Current authority:

```text
K3 IMPLEMENTATION: NOT AUTHORIZED
K3-A IMPLEMENTATION: NOT AUTHORIZED
EXTERNAL SOURCE INTAKE: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
```

## Candidate-evaluation rule

Candidates are evaluated for narrow adapter roles behind Kodac-owned query semantics.

No candidate becomes the canonical repository-intelligence truth merely by being listed here.

No candidate may be described as `best`, `winner`, or `superior` without accepted benchmark evidence.

Every future source-intake request must be exact and scoped.

## Candidate 1 — Tree-sitter

```text
ROLE:
Syntax / CST / parser-derived evidence

CURRENT ASSESSMENT:
TIER-A BENCHMARK CANDIDATE

LICENSE FAMILY:
MIT

IMPORT AUTHORITY:
NOT AUTHORIZED
```

### Intended evaluation role

Tree-sitter should be evaluated as a replaceable syntax-evidence adapter for capabilities such as:

- syntax tree construction;
- symbol-candidate discovery where syntax is sufficient;
- language-aware structural boundaries;
- incremental parser-derived facts;
- malformed/syntax-error tolerance;
- candidate generation for stronger semantic evidence.

### Evidence boundary

Tree-sitter-derived syntax relationships must remain classified as parser-derived evidence unless independently strengthened by semantic/compiler/LSP evidence.

Parser structure alone must not be presented as verified cross-file semantic reference truth.

### Future intake requirements

Before any intake, a future authorization must identify exact repository, exact commit, exact source or dependency boundary, license review, security review, benchmark evidence, and destination adapter boundary.

## Candidate 2 — SCIP

```text
ROLE:
Language-agnostic semantic index interchange for definitions,
references, implementations, and related code-intelligence facts

CURRENT ASSESSMENT:
TIER-A BENCHMARK CANDIDATE

LICENSE FAMILY:
APACHE-2.0

IMPORT AUTHORITY:
NOT AUTHORIZED
```

### Intended evaluation role

SCIP should be evaluated as a semantic-evidence interchange candidate behind Kodac-owned definitions/references/implementation queries.

Potential evaluation areas include:

- definition identity;
- reference identity;
- implementation relationships;
- symbol identity portability;
- precomputed semantic index consumption;
- language/indexer coverage;
- index freshness and snapshot association.

### Evidence boundary

SCIP data must remain associated with the exact repository/index snapshot that produced it.

A stale or partial semantic index must not silently appear current or complete.

SCIP is an interchange format/protocol surface; individual indexers and generators require their own capability, security, execution, and license assessment.

## Candidate 3 — Language Server Protocol / language servers

```text
ROLE:
Live language-semantic adapter

CURRENT ASSESSMENT:
TIER-A PROTOCOL / ADAPTER CANDIDATE

LANGUAGE SERVER INTAKE:
NOT AUTHORIZED
```

### Intended evaluation role

LSP-compatible language servers may later be evaluated for live semantic capabilities such as:

- definitions;
- references;
- implementations;
- symbol discovery;
- diagnostics as supporting evidence;
- workspace/document semantic queries.

### Critical distinction

LSP itself is a protocol boundary.

Each concrete language server or server distribution requires its own review for:

- license;
- installation model;
- subprocess behavior;
- repository-controlled configuration;
- plugin loading;
- compiler/toolchain invocation;
- workspace trust assumptions;
- network behavior where applicable;
- resource limits;
- platform support;
- capability variability.

No language server is authorized by this register.

### Security boundary

Starting a language server can be an executable side effect and may cause further subprocesses, project loading, package resolution, plugins, compilers, or build tools to run.

Future use must not bypass K2 trusted execution boundaries.

## Candidate 4 — ast-grep

```text
ROLE:
Structural code search / pattern-query adapter

CURRENT ASSESSMENT:
TIER-B BENCHMARK CANDIDATE

LICENSE FAMILY:
MIT

IMPORT AUTHORITY:
NOT AUTHORIZED
```

### Intended evaluation role

ast-grep should be evaluated for structural discovery where syntax-aware pattern matching is useful, including:

- structural search;
- syntax-pattern queries;
- candidate file/symbol discovery;
- benchmarked structural relations.

### Evidence boundary

Structural matches must not be treated as verified cross-file semantic definitions, references, implementations, dependencies, or call relationships unless independently supported by stronger evidence.

## Candidate 5 — Vector / embedding retrieval

```text
ROLE:
Candidate nomination / ranking only

CURRENT ASSESSMENT:
DEFERRED FROM INITIAL K3 SLICE

INFRASTRUCTURE AUTHORITY:
NOT AUTHORIZED
```

### Intended future role

Embeddings may eventually help nominate or rank potentially relevant evidence for broad semantic search or context selection.

They must remain a weak retrieval/ranking signal rather than canonical repository truth.

Canonical principle:

```text
vector similarity != canonical repository fact
```

### Deferred decisions

This register does not authorize:

- embedding model selection;
- embedding generation;
- vector database selection;
- vector-store dependency;
- remote embedding service;
- persistent vector index;
- semantic ranking product claims.

## Candidate layering model

The register anticipates a layered model rather than one universal winner:

```text
Exact filesystem / Git facts
        ↓
Parser-derived syntax evidence
        ↓
Semantic / compiler / LSP / index evidence
        ↓
Structural or heuristic candidate evidence
        ↓
Optional retrieval / ranking signals
        ↓
Kodac-owned evidence graph and query semantics
```

Actual precedence must be defined by evidence class and query semantics, not by vendor or adapter identity alone.

## Source-intake rule

This readiness package authorizes research and documentation of candidates only.

It does not authorize:

- git clone for source incorporation;
- copying donor code;
- adapting donor code;
- vendoring donor code;
- adding donor dependencies;
- adding external binaries;
- adding language servers;
- adding parsers;
- adding indexers;
- adding vector databases;
- adding storage engines.

Any future source-intake authorization must identify at least:

- exact donor repository;
- exact commit;
- exact source path(s) or exact dependency package/version;
- intended destination / adapter boundary;
- license;
- security considerations;
- benchmark evidence;
- reason internal implementation is insufficient;
- exact authorization scope;
- whether merge to canonical main is separately authorized;
- whether public distribution is separately authorized.

## Security screening before benchmark or intake

A candidate should not proceed to source intake merely because its functionality is useful.

Future readiness should assess, where relevant:

- path access behavior;
- symlink behavior;
- binary execution;
- subprocess creation;
- project/build script execution;
- plugin loading;
- configuration-file execution semantics;
- network access;
- secrets exposure;
- workspace trust assumptions;
- denial-of-service/resource exhaustion;
- malformed input handling;
- cross-platform installation and behavior;
- deterministic/reproducible output;
- snapshot freshness guarantees.

## Current candidate disposition

| Candidate | Proposed role | Tier | Intake status |
| --- | --- | --- | --- |
| Tree-sitter | syntax / CST evidence | Tier A | Not authorized |
| SCIP | semantic index interchange | Tier A | Not authorized |
| LSP / language servers | live semantic adapter | Tier A protocol/adapter | No server authorized |
| ast-grep | structural search | Tier B | Not authorized |
| Vector / embedding retrieval | candidate nomination / ranking | Deferred | Not authorized |

These tiers represent benchmark priority only. They are not superiority rankings.

## Authority boundaries

```text
TREE-SITTER INTAKE: NOT AUTHORIZED
SCIP INTAKE: NOT AUTHORIZED
ast-grep INTAKE: NOT AUTHORIZED
LSP SERVER INTAKE: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
PERSISTENT STORAGE: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED
MCP IMPLEMENTATION: NOT AUTHORIZED
ACP IMPLEMENTATION: NOT AUTHORIZED
AGENT SKILLS IMPLEMENTATION: NOT AUTHORIZED
K3 IMPLEMENTATION: NOT AUTHORIZED
K3-A IMPLEMENTATION: NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
KODAC NAME / TRADEMARK CLEARANCE: NOT ESTABLISHED
```

## Next source-intake gate

No source-intake gate is automatically opened by this register.

External candidate benchmarking should occur only after an authorized benchmark-fixture / adapter-evaluation gate establishes how the candidate will be tested without broadening repository authority.
