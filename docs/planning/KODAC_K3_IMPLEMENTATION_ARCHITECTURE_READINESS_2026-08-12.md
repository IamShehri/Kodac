# Kodac K3 Implementation Architecture Readiness — 2026-08-12

## Decision

```text
K3-A — Snapshot & Evidence Contract Spine
STATUS: PROPOSED FOR FUTURE IMPLEMENTATION AUTHORIZATION
IMPLEMENTATION: NOT AUTHORIZED BY THIS DOCUMENT
```

Repository:

```text
IamShehri/Kodac
```

Canonical baseline:

```text
1d469a1062f34bb66c6bff8fc330472d74e71317
```

This record defines implementation-readiness architecture only. It does not authorize K3 implementation, K3-A implementation, source intake, dependencies, persistent storage, public release, package publication, or brand launch.

## Architecture boundary

The proposed K3 architecture preserves this authority flow:

```text
Task
→ Kodac Query Facade
→ Evidence-Backed Repository Intelligence
→ Bounded Context Bundle
→ Model Reasoning
→ Existing K2 Trusted Runtime
→ ExecutionGateway
→ Receipt / Evidence
→ Verification
→ Done Gate
```

K3 must not create a second execution authority.

Repository intelligence may inform an action. It must not authorize the action.

All side effects remain governed by the existing K2 trusted-runtime path and its policy, workspace-confinement, receipt, verification, and Done Gate controls.

## K3-A contract direction

Future K3-A implementation should establish Kodac-owned contracts for at least:

- `RepositorySnapshotIdentity`;
- freshness / staleness state;
- stable evidence identity;
- source identity and provenance;
- repository entity identity;
- repository relation identity;
- evidence class;
- semantic query request;
- semantic query result;
- completeness / truncation metadata;
- `ContextBundle`;
- context budget;
- omitted-context metadata;
- deterministic result identity where applicable.

The evidence model must preserve the canonical K3 evidence classes:

- precise static / compiler / LSP fact;
- parser-derived fact;
- Git-derived fact;
- heuristic inference;
- model hypothesis.

Weaker evidence must not silently override stronger evidence.

A model hypothesis must remain visibly distinct from parser-derived, Git-derived, LSP, compiler, build, test, or other verified evidence.

## First implementation slice — no external donor required

The proposed first implementation slice should require no new OSS source intake.

Initial evidence should use built-in or already-authorized repository capabilities to establish:

- repository identity;
- Git revision identity;
- working-tree state;
- freshness identity;
- deterministic file inventory;
- directory inventory;
- Git-derived change evidence;
- ADR / specification discovery;
- bounded query envelopes;
- evidence provenance;
- benchmark fixtures.

The first slice should be in-memory by default.

This readiness record does not ratify:

- Neo4j;
- SQLite;
- DuckDB;
- a vector database;
- embedded KV storage;
- hosted graph storage;
- persistent intelligence cache.

Any future persistent cache requires a separate trust / mutation-boundary decision before implementation.

## Kodac-owned query facade

K3 should expose Kodac-owned semantics rather than external-system APIs.

Future query direction may include:

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

Agents must not bind directly to:

- Tree-sitter APIs;
- SCIP APIs;
- LSP server-specific APIs;
- ast-grep APIs;
- database APIs;
- vector-store APIs.

All external systems must remain replaceable adapters behind Kodac-owned semantics.

Adapter replacement must not silently change the meaning of a Kodac query contract.

## Context Engine boundary

The future Context Engine consumes evidence-backed query results and produces a bounded `ContextBundle`.

A planned `ContextBundle` must carry at least:

- snapshot identity;
- selected evidence;
- evidence/source identities;
- freshness state;
- task/query identity;
- budget;
- truncation state;
- omitted-context information;
- untrusted-content marking where applicable.

Repository source, comments, documentation, filenames, commit messages, issue text, and other repository text are untrusted data.

Repository content must not silently become model or system instructions.

Context selection must make truncation and incompleteness observable. Omitted evidence must not silently appear complete.

## Security / threat readiness

Future K3 implementation must fail closed or remain bounded for at least:

- path traversal;
- symlink escape;
- malformed source files;
- extremely large files;
- extremely large repositories;
- binary files;
- generated/vendor directories;
- malicious filenames;
- parser/indexer resource exhaustion;
- language-server subprocess behavior;
- compiler/build/plugin execution;
- stale indexes;
- partial indexes;
- poisoned or adversarial repository content;
- prompt injection embedded in source or documentation;
- secret-bearing files entering Context Bundles;
- cross-workspace data leakage.

Indexing or analysis must not become an indirect way to bypass the K2 trusted execution boundary.

Any analysis path that can execute repository-controlled code, plugins, compilers, build hooks, package scripts, or subprocesses requires an explicit execution-security decision before use.

## Proposed implementation sequence

The following sequence is planning-only:

```text
K3-R0 — Architecture / Contract Readiness
K3-R1 — Benchmark Fixtures and Gold Evidence
K3-R2 — Built-In Exact Snapshot / Evidence Slice
K3-R3 — External Adapter Benchmark
K3-R4 — Scoped Source-Intake Decision(s), if evidence justifies them
K3-R5 — Context Engine Vertical Slice
K3-R6 — Integrated K3 → K2 Controlled Proof
K3 CLOSEOUT — Founder-reviewed acceptance gate
```

None of these implementation steps are authorized by this document.

## Current authority state

```text
K3 IMPLEMENTATION: NOT AUTHORIZED
K3-A IMPLEMENTATION: NOT AUTHORIZED
NEW OSS INTAKE: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
PERSISTENT STORAGE: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED
MCP IMPLEMENTATION: NOT AUTHORIZED
ACP IMPLEMENTATION: NOT AUTHORIZED
AGENT SKILLS IMPLEMENTATION: NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
KODAC NAME / TRADEMARK CLEARANCE: NOT ESTABLISHED
```

## Next gate

After this readiness package is reviewed and canonically adopted, the next permissible activity remains separately authorized implementation planning or a narrowly scoped K3-R1 / K3-R2 execution gate.

This document itself grants no implementation authority.
