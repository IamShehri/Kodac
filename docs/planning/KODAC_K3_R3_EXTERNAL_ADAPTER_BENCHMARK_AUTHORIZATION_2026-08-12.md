# Kodac K3-R3 External Adapter Benchmark Authorization — 2026-08-12

## Founder authorization

```text
K3-R3 — External Adapter Benchmark
STATUS: AUTHORIZED FOR BOUNDED BENCHMARK EXECUTION
CANONICAL ADOPTION: NOT ESTABLISHED BY THIS RECORD ALONE
SOURCE INTAKE: NOT AUTHORIZED
```

Repository:

```text
IamShehri/Kodac
```

Authorization baseline:

```text
8287d2e7ea93832bdd9b6f13ed9bde246546a6e0
```

This record captures the founder authorization to proceed from canonical K3-R2 into the next planned K3 slice, K3-R3, while preserving the existing K2 execution authority and all source-intake, dependency, storage, release, and provenance gates.

## Canonical prerequisites

K3-R3 proceeds only because the following are already canonical at the authorization baseline:

- K3-R1 benchmark fixtures and gold-evidence direction;
- K3-R2 built-in exact snapshot / evidence slice;
- K3 benchmark and evidence protocol;
- K3 adapter and source-intake candidate register;
- K2 trusted runtime and execution authority;
- provenance validation and fail-closed donor admission lifecycle.

K3 remains open. K3-R3 completion will not itself close K3.

## Authorized objective

K3-R3 may benchmark external repository-intelligence candidates behind Kodac-owned semantics to determine whether any candidate is qualified for a narrow adapter role.

The benchmark must answer evidence questions, not product-marketing questions.

Authorized comparison targets are limited to the candidate roles already recorded in the canonical K3 candidate register:

- Tree-sitter — parser-derived syntax/CST evidence;
- SCIP — semantic-index interchange evidence;
- LSP — protocol/adapter capability assessment only unless a concrete language server receives a separate execution-security authorization;
- ast-grep — structural-search evidence;
- the canonical K3-R2 built-in exact snapshot/evidence slice as the baseline where applicable.

Vector / embedding retrieval remains deferred and is outside this authorization.

## Authorized benchmark boundary

K3-R3 may:

1. define or refine benchmark adapters that normalize candidate results into Kodac-owned query/evidence semantics;
2. run candidate measurements against the already-authorized deterministic K3 fixture set in an isolated benchmark environment;
3. record exact candidate version or commit, license identity, configuration, environment, fixture identity, and benchmark protocol identity;
4. measure correctness, freshness, reproducibility, resource behavior, unsupported cases, and evidence-class output;
5. produce benchmark evidence and a candidate disposition such as:
   - `QUALIFIED FOR SPECIFIC ADAPTER ROLE`;
   - `PARTIALLY QUALIFIED`;
   - `NOT QUALIFIED`;
   - `INSUFFICIENT EVIDENCE`;
   - `SECURITY REVIEW REQUIRED`;
   - `LICENSE REVIEW REQUIRED`;
   - `SOURCE INTAKE AUTHORIZATION REQUIRED`;
6. propose a later K3-R4 source-intake decision only when benchmark evidence justifies it.

## Hard benchmark invariants

K3-R3 must preserve the accepted K3 benchmark protocol, including:

```text
SNAPSHOT STALENESS DETECTION: 100%
EVIDENCE SOURCE / PROVENANCE COMPLETENESS: 100%
UNAUTHORIZED WORKSPACE MUTATIONS: 0
PATH ESCAPES: 0
UNLABELED MODEL HYPOTHESES AS VERIFIED FACTS: 0
TRUNCATION: EXPLICIT
OMITTED CONTEXT / PARTIAL RESULTS: MUST NOT SILENTLY APPEAR COMPLETE
```

Deterministic queries must preserve deterministic canonical result identity for the same snapshot, canonical query, and deterministic adapter/configuration state.

## Execution-safety boundary

Benchmark execution must not become a second trusted execution authority.

The Kodac repository and benchmark fixtures are treated as untrusted input. Benchmarking must not intentionally execute repository-controlled package scripts, build hooks, plugins, compilers, project configuration, or arbitrary subprocess chains.

A concrete language server or other candidate that can trigger project loading, package resolution, build tools, plugins, compilers, network behavior, or repository-controlled execution requires a separate execution-security authorization before that mode is benchmarked.

Benchmark fixtures must remain workspace-confined. Path traversal, symlink escape, cross-workspace reads, and secret-bearing context leakage are blocking failures.

## External-tool handling

This authorization allows candidate tools to be evaluated in a disposable, isolated benchmark environment when their exact identity and configuration are recorded.

It does **not** authorize incorporating those tools into Kodac.

The benchmark environment is evidence infrastructure only. Candidate installation or execution there does not create canonical dependency authority for the Kodac repository.

## Explicit non-grants

This authorization does **not** authorize:

- copying donor source into Kodac;
- adapting donor source into Kodac;
- vendoring donor source;
- adding donor packages to Kodac dependency manifests or lockfiles;
- permanent external binaries in Kodac distribution;
- any concrete language-server execution mode that has not passed a separate execution-security authorization;
- Tree-sitter intake;
- SCIP intake;
- ast-grep intake;
- LSP server intake;
- persistent storage;
- SQLite, DuckDB, Neo4j, embedded KV, or hosted graph adoption;
- vector or embedding infrastructure;
- MCP implementation;
- ACP implementation;
- Agent Skills implementation;
- K3-R4 source intake;
- K3-R5 Context Engine implementation;
- public superiority claims;
- public release;
- package publication;
- brand launch;
- Kodac name or trademark clearance;
- ruleset changes;
- direct mutation of canonical `main` outside the protected PR path.

`code_import_authorized` remains `false`.

## Required K3-R3 evidence package

A K3-R3 completion candidate must include at least:

- benchmark protocol/version identity;
- fixture-set identity;
- exact canonical baseline and benchmark branch/head identity;
- exact candidate identity/version/commit where applicable;
- license identity;
- adapter/configuration identity;
- platform/environment identity;
- correctness results for the capabilities actually claimed;
- staleness/freshness results;
- provenance completeness results;
- deterministic/reproducibility evidence;
- resource/performance observations;
- unsupported-case inventory;
- security-relevant behavior inventory;
- workspace-mutation evidence;
- path-escape evidence;
- candidate disposition per adapter role;
- explicit statement that benchmark qualification is not source-intake or canonical-adoption authority.

## Acceptance rule

K3-R3 is complete only after its evidence package is founder-reviewed and canonically adopted through the protected PR path.

A benchmark result may qualify a candidate for a specific adapter role. It does not authorize K3-R4 source intake by implication.

No candidate may be called `best`, `winner`, or `superior` unless the accepted evidence supports that exact claim under the canonical comparison protocol and a separate product-claim authorization permits the wording.

## State after this authorization

```text
K0/K1: CLOSED
K2: CLOSED
K3: IN PROGRESS
K3-R1: CANONICAL / COMPLETE FOR AUTHORIZED SCOPE
K3-R2: CANONICAL / COMPLETE FOR AUTHORIZED SCOPE
K3-R3: AUTHORIZED FOR BOUNDED EXTERNAL ADAPTER BENCHMARK / NOT YET CANONICAL
K3-R4+: NOT AUTHORIZED
K3: NOT CLOSED
CODE IMPORT: NOT AUTHORIZED
NEW KODAC DEPENDENCIES: NOT AUTHORIZED
PERSISTENT STORAGE: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
KODAC NAME / TRADEMARK CLEARANCE: NOT ESTABLISHED
```

## Next gate

After this authorization record is reviewed and canonically adopted, K3-R3 benchmark implementation/execution may begin within the exact boundary above.

K3-R4 remains a separate founder-reviewed source-intake decision and is not opened by K3-R3 benchmark results alone.
