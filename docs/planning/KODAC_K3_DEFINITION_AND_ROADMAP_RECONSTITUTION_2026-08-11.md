# Kodac K3 Definition and Canonical Roadmap Reconstitution — 2026-08-11

## Decision

```text
K3 — Evidence-Backed Repository Intelligence & Context Engine
STATUS: DEFINED BY THIS PACKAGE ONLY
IMPLEMENTATION: NOT AUTHORIZED
```

Repository:

```text
IamShehri/Kodac
```

Canonical definition baseline:

```text
11227cc8c58e00879e8b40e7ff7948bee396fef7
```

This package defines the next engineering milestone and reconstitutes current roadmap authority. It does not begin K3 implementation.

## Historical integrity

The pre-reconstitution roadmap artifacts remain recoverable from canonical base:

```text
11227cc8c58e00879e8b40e7ff7948bee396fef7
```

Prior roadmap blob identities:

```text
docs/roadmap/ROADMAP.md
f4a507bc312bc2d6e93b8fe9546e9a2c13b5ddea

docs/roadmap/MILESTONES.md
1aec7f7ad3bf342fad267c4c14fcf34cf843b0ca

docs/roadmap/VERSION_PLAN.md
4f2e4140dd73bfe90fe512cba27f15b2e42f1839
```

The prior roadmap remains historical evidence. It is superseded only as **CURRENT PRODUCT / ROADMAP AUTHORITY**. Its historical content is not invalidated or rewritten.

Pre-existing files under `docs/product/` are likewise preserved as Kernux-era historical planning inputs. This package adds only an authority notice at `docs/product/STATUS.md`; it does not rewrite those historical product files.

## K3 canonical definition

K3 is defined as:

```text
K3 — Evidence-Backed Repository Intelligence & Context Engine
```

### Purpose

K3 turns a repository and engineering task into a bounded, freshness-aware, evidence-backed representation of:

- relevant files;
- symbols;
- definitions;
- references;
- dependencies;
- related tests;
- architecture/specification context;
- likely blast radius.

K3 then produces a bounded **Context Bundle** for model reasoning.

K3 builds on:

- ADR-0001 — Kodac Product Constitution: Done Means Proven;
- ADR-0005 — Canonical Session/Event/Tool protocol;
- ADR-0006 — mandatory trust hook for all side effects;
- ADR-0009 — Kodac Repo Graph architecture;
- ADR-0010 — benchmark-first donor selection and superiority claims;
- the canonical K2 trusted runtime.

### Execution authority remains singular

K3 must not create a second execution authority.

All K3-derived actions still execute only through the existing Kodac trusted runtime path:

```text
model / agent reasoning
→ Kodac capability/tool boundary
→ ExecutionGateway
→ policy / trust decision
→ workspace / effect
→ receipt / evidence
→ verification
→ Done Gate
```

Repository intelligence may inform actions. It does not authorize them.

## Future canonical contract direction

The contracts below are planning-level requirements only. They are not implemented by this document.

### 1. Repository Snapshot Identity

A future K3 snapshot must identify at least:

- workspace identity;
- repository identity;
- Git revision when applicable;
- working-tree state or digest;
- index/snapshot revision;
- freshness state.

Stale intelligence must never silently appear current.

The contract must make it possible to determine whether an intelligence result represents:

- an exact Git commit;
- the current working tree;
- a known modified working tree;
- or a stale/unknown index state.

### 2. Evidence-Backed Repo Graph

The logical graph must align with ADR-0009.

The initial planned entity set includes at least:

- File;
- Directory;
- Package / Module;
- Symbol;
- Test;
- Dependency;
- ADR / Specification;
- Commit / Change.

Future graph facts must distinguish evidence classes such as:

- precise static/compiler/LSP fact;
- parser-derived fact;
- Git-derived fact;
- heuristic inference;
- model hypothesis.

Evidence identity, provenance, and freshness must remain observable enough that weaker evidence cannot silently masquerade as stronger evidence.

### 3. Semantic Query Boundary

K3 should converge on Kodac-owned semantic queries such as:

```text
find_symbol
find_definitions
find_references
related_files
related_tests
impact
architecture_context
change_history
semantic_search
```

Agents must not bind directly to a particular parser, database, LSP implementation, indexer, or donor API.

Adapters may change. Kodac-owned query semantics remain the boundary.

### 4. Context Engine

The future Context Engine must produce a bounded Context Bundle carrying relevant subsets of:

- selected repository evidence;
- source identities;
- freshness information;
- relevance/ranking explanation where applicable;
- token/size budget;
- omitted-context information where useful.

The Context Engine chooses a bounded view of the Repo Graph. It must not dump the entire graph into model context.

Context selection must remain task-aware and bounded, and must preserve enough evidence identity to distinguish observed repository facts from derived or inferred context.

### 5. Evidence Ordering

Precise evidence must not be silently overridden by weaker signals.

Canonical ordering principles include:

```text
vector similarity != canonical repository fact
model inference != verified dependency/reference fact
```

Semantic/vector retrieval may nominate or rank candidates. It does not become canonical truth merely because similarity is high.

Model-generated repository hypotheses must remain distinguishable from verified static, semantic, Git, build, test, or specification evidence.

## Storage and implementation non-decisions

This package does not ratify a permanent storage engine.

It does not canonically select:

- Neo4j;
- SQLite;
- DuckDB;
- a vector database;
- an embedded KV database;
- any hosted graph service.

The logical Kodac contracts are canonical. The physical backend remains replaceable.

Candidate technologies may later be evaluated as adapters or implementations consistent with accepted ADRs.

## OSS and dependency boundary

This package authorizes no donor import.

It does not import or authorize importing code from:

- Tree-sitter;
- SCIP;
- ast-grep;
- Aider;
- Kilo;
- OpenCode;
- any other donor implementation.

Any future OSS intake remains subject to existing provenance, license, exact-commit, path-scope, and founder authorization gates.

## Benchmark-first K3 direction

K3 is benchmark-first under ADR-0010.

Future K3 implementation and selection evidence should measure relevant subsets of:

- correct file discovery;
- correct symbol discovery;
- definition/reference precision;
- blast-radius recall;
- related-test recall;
- context token efficiency;
- freshness/staleness detection;
- evidence provenance completeness;
- deterministic/reproducible query behavior where applicable;
- no unauthorized repository mutation.

No K3 donor, indexer, parser, graph backend, retrieval method, or context strategy may be described as `best`, `winner`, or `superior` without supporting benchmark evidence under the accepted comparison rules.

This package makes no superiority claim about K3 or any competing system.

## Canonical engineering roadmap authority

The reconstituted roadmap records:

```text
K0/K1 — Architecture, governance, provenance, donor-selection foundation
STATUS: CLOSED

K2 — Trusted Runtime Spine
STATUS: CLOSED

K3 — Evidence-Backed Repository Intelligence & Context Engine
STATUS: DEFINED BY THIS PACKAGE ONLY
IMPLEMENTATION: NOT AUTHORIZED
```

The following are proposed future directions only:

```text
K4 — Ecosystem Compatibility & Capability Registry
K5 — Proof Review & Judge
K6 — Evidence Router & Outcome Learning
K7 — Kodac Bench & Distribution Hardening
```

K4 through K7 are not implementation authorizations and are not elevated to accepted architecture merely by appearing on the roadmap.

## Planned K3 exit direction

K3 implementation acceptance remains a future founder-reviewed gate.

Planned exit evidence should include at least:

- canonical Repo Graph/query contracts implemented;
- freshness identity proven;
- bounded Context Bundle implemented;
- repository-intelligence benchmark fixtures;
- relevant-file/symbol/test evidence;
- K2 trusted-execution boundary preserved;
- runtime/typecheck/tests green;
- cross-platform requirements determined and satisfied where applicable;
- dedicated founder-reviewed K3 closeout.

None of these implementation criteria are marked complete by this package.

## Engineering milestones vs public product versions

Kodac engineering milestones and public product versions are separate authority domains.

```text
ENGINEERING MILESTONES:
K0/K1, K2, K3, ...

PUBLIC PRODUCT VERSIONS:
0.x, 1.x, ...
```

No public release version is authorized by this document.

No package publication is authorized.

No `1.0` promise is established.

Version numbering and public-release gates remain separate founder decisions.

## Product-document authority notice

`docs/product/STATUS.md` is added as an authority notice.

The pre-existing files under `docs/product/` remain preserved Kernux-era historical planning inputs. They do not override:

- accepted Kodac ADRs;
- current Kodac planning/closeout records;
- the README current architecture summary;
- reconstituted `docs/roadmap/*`.

Future reconstitution of the historical product-document set requires a separate gate.

## Authorization boundaries

This package does **not** authorize:

- K3 implementation;
- runtime source changes;
- test implementation;
- new dependencies;
- new OSS intake;
- MCP implementation;
- ACP implementation;
- Agent Skills implementation;
- Repo Graph implementation;
- Context Engine implementation;
- benchmark execution claiming superiority;
- public release;
- package publication;
- brand launch;
- trademark/name clearance;
- ruleset changes.

Current authority state:

```text
PUBLIC RELEASE:
NOT AUTHORIZED

PACKAGE PUBLICATION:
NOT AUTHORIZED

BRAND LAUNCH:
NOT AUTHORIZED

KODAC NAME / TRADEMARK CLEARANCE:
NOT ESTABLISHED

K3 IMPLEMENTATION:
NOT AUTHORIZED
```

## Next gate

After this definition/reconstitution package is reviewed and canonically adopted, the next permissible activity is a separate **K3 implementation architecture/readiness review**.

That future review may evaluate candidate adapters, implementation slices, benchmark fixtures, and source-intake needs, but no implementation or donor intake is authorized by this document.
