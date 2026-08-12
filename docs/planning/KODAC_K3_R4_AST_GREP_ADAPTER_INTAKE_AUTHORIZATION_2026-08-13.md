# Kodac K3-R4 ast-grep Adapter Intake Authorization — 2026-08-13

## Founder authorization

```text
K3-R4 — Scoped ast-grep Adapter Intake Decision
STATUS: AUTHORIZED FOR BOUNDED ADAPTER IMPLEMENTATION AFTER CANONICAL ADOPTION
GENERAL SOURCE INTAKE: NOT AUTHORIZED
DONOR SOURCE COPYING / ADAPTATION / VENDORING: NOT AUTHORIZED
NEW PACKAGE / CRATE DEPENDENCIES: NOT AUTHORIZED
PERMANENT THIRD-PARTY BINARY VENDORING: NOT AUTHORIZED
```

Repository:

```text
IamShehri/Kodac
```

Canonical authorization baseline:

```text
0fb1449a1020a08259ae622eb30302aa50d00b18
```

This record is the bounded K3-R4 decision enabled by the canonically adopted K3-R3 benchmark evidence. It does not itself implement the adapter and does not open a general donor-intake gate.

## Decision summary

K3-R3 produced sufficient evidence for exactly one external candidate to proceed to a narrow integration gate:

```text
ast-grep
DISPOSITION: QUALIFIED FOR SPECIFIC ADAPTER ROLE
ROLE: structural symbol occurrence and ambiguous-candidate discovery
```

The other K3-R3 candidates do not proceed to intake under this authorization:

```text
Tree-sitter: SECURITY REVIEW REQUIRED
SCIP: INSUFFICIENT EVIDENCE
LSP / concrete language servers: SECURITY REVIEW REQUIRED
Vector / embedding retrieval: DEFERRED / NOT AUTHORIZED
```

Accordingly, K3-R4 authorizes only a replaceable ast-grep CLI adapter implementation behind Kodac-owned repository-intelligence semantics.

## Evidence basis

The authorization is grounded in canonical K3-R3 evidence adopted through PR #13.

Reviewed K3-R3 candidate head:

```text
8050ff13dc983d1baa2e4553d78dc3741f48a256
```

Canonical K3-R3 merge:

```text
0fb1449a1020a08259ae622eb30302aa50d00b18
```

K3-R3 established, for the authorized canonical fixture slice:

- exact candidate archive and executable identity;
- exact version identity;
- deterministic repeated structural-query output;
- evidence-source / provenance completeness;
- path and symlink containment;
- snapshot freshness and full-tree mutation guards;
- unprivileged, read-only candidate execution;
- zero observed fixture/workspace mutations;
- exact `path:line:column` structural occurrence metrics;
- explicit limitation that compiler-resolved definition/reference semantics were not measured.

The measured ast-grep qualification remains narrow. This authorization must not expand it by implication.

## Exact upstream identity

The only upstream identity admitted by this authorization is:

```text
UPSTREAM REPOSITORY:
ast-grep/ast-grep

TAG:
0.45.1

EXACT TAG COMMIT:
dc3d655b9edf3b2bc266d9bc46eb60f18e66b818

UPSTREAM TREE AT TAG COMMIT:
17629b45df14770ad0a4168c1dedf33d7066c350

LICENSE:
MIT

LICENSE BLOB:
f15282f90a7158c2d9f1fedef55438bf9f5c37b0
```

The exact tag commit is signed/verified upstream.

The K3-R3 benchmark also recorded the evaluated Linux candidate identities:

```text
ARCHIVE SHA-256:
76fb6555be6734fb5057dba8d2fb756430f374bb9e1af694cf1ce00e13238d63

EXECUTABLE SHA-256:
6a66162e0a2447af4b7524ee04195239eb1911d07f4868f918909e7d4f453eea

MEASURED VERSION OUTPUT:
ast-grep 0.45.1
```

These Linux identities are evidence pins, not an authorization to assume the same binary digest or behavior on Windows or macOS.

## Authorized integration form

The authorized implementation form is deliberately narrower than source or dependency intake.

Kodac may implement a replaceable **external ast-grep CLI adapter** that:

1. remains behind Kodac-owned repository-intelligence query semantics;
2. treats ast-grep output as `parser-derived` / structural evidence only;
3. accepts only an explicitly configured external ast-grep executable;
4. requires exact supported version identity before use;
5. requires an authorized executable digest identity for the active platform before use;
6. fails closed when version, digest, platform authorization, provenance, path containment, freshness, output schema, or deterministic-result requirements are not satisfied;
7. never silently falls back from stronger semantic evidence to ast-grep structural matches while preserving a stronger evidence label;
8. never exposes the native ast-grep API as the agent-facing contract;
9. does not grant ast-grep any execution or mutation authority;
10. preserves K2 as the only trusted side-effect execution authority.

The intended implementation boundary is a Kodac-owned repository-intelligence adapter namespace under:

```text
packages/kodac-runtime/src/repository-intelligence/
```

The exact implementation paths require their own reviewed implementation PR. This authorization does not create those files.

## Binary handling boundary

This authorization does **not** permit committing ast-grep binaries into the Kodac repository.

It does **not** permit automatic network download by production runtime code.

For the first authorized implementation slice, an ast-grep executable may be used only when supplied through a founder/developer-controlled local or CI environment and when the adapter can prove the executable identity before execution.

A later distribution decision may separately consider:

- bundled binaries;
- managed downloads;
- package-manager acquisition;
- platform-specific executable manifests;
- signature/attestation mechanisms.

None of those distribution mechanisms are authorized here.

## Platform authority

K3-R3 functionally benchmarked the admitted ast-grep structural role only in its bounded Linux benchmark environment.

Therefore:

```text
LINUX ADAPTER IMPLEMENTATION / FIXTURE VALIDATION:
AUTHORIZED WITH EXACT VERSION + DIGEST GUARDS

WINDOWS AST-GREP EXECUTION:
REQUIRES PLATFORM-SPECIFIC IDENTITY + BENCHMARK EVIDENCE BEFORE CANONICAL CLAIM

MACOS AST-GREP EXECUTION:
REQUIRES PLATFORM-SPECIFIC IDENTITY + BENCHMARK EVIDENCE BEFORE CANONICAL CLAIM
```

Kodac may implement cross-platform code paths, but it must not claim Windows/macOS candidate qualification until platform-specific evidence is produced and reviewed.

## Authorized query role

The first adapter implementation may support only structural candidate-discovery capabilities that can be truthfully mapped to the K3-R3 evidence, such as:

```text
find_symbol_candidates
structural_occurrences
ambiguous_symbol_candidates
```

If existing Kodac-owned query names are reused, their result metadata must explicitly preserve the structural evidence class and completeness limitations.

This authorization does not establish ast-grep as a compiler-semantic implementation of:

```text
find_definitions
find_references
find_implementations
call_graph
type_flow
dependency_truth
```

Those stronger meanings require separate semantic evidence.

## Required implementation invariants

Any K3-R4 adapter implementation candidate must preserve at least:

```text
SNAPSHOT STALENESS DETECTION: 100%
EVIDENCE SOURCE / PROVENANCE COMPLETENESS: 100%
UNAUTHORIZED WORKSPACE MUTATIONS: 0
PATH ESCAPES: 0
UNLABELED MODEL HYPOTHESES AS VERIFIED FACTS: 0
TRUNCATION / PARTIAL STATE: EXPLICIT
DETERMINISTIC RESULT IDENTITY: REQUIRED WHERE QUERY IS DETERMINISTIC
```

In addition, the implementation must fail closed for:

- missing executable;
- unsupported platform identity;
- wrong version;
- wrong executable digest;
- executable identity changes between validation and use where applicable;
- malformed candidate output;
- unexpected output schema;
- path traversal;
- symlink escape;
- output paths outside the authorized workspace;
- stale snapshot identity;
- timeout / cancellation failure;
- resource-bound violation;
- repository-controlled configuration that would broaden execution behavior.

## Repository-controlled configuration

The first K3-R4 adapter slice must not automatically load or trust repository-controlled ast-grep configuration in a way that broadens the benchmarked execution envelope.

In particular, repository content must not be allowed to silently select arbitrary rules, plugins, commands, dynamic language loaders, or execution behavior that was not part of the authorized adapter contract.

The adapter configuration used for canonical queries must be Kodac-owned, deterministic, bounded, and reviewable.

## Dependency and source boundary

This authorization does **not** authorize adding:

- `@ast-grep/*` npm packages;
- ast-grep Rust crates;
- a git dependency on `ast-grep/ast-grep`;
- copied ast-grep source;
- adapted donor source;
- vendored upstream source;
- generated upstream source snapshots;
- permanent third-party executables.

`code_import_authorized=false` remains unchanged globally.

A later request to use ast-grep as a library or copy/adapt its source must return to a new exact source/dependency intake gate with a separate benchmark and provenance argument for that integration form.

## License / attribution boundary

The admitted upstream identity is MIT-licensed.

Any future distribution of upstream source or binary material would require preservation of the applicable copyright and permission notice and a separately reviewed distribution/provenance record.

Because this authorization does not permit bundling or source copying, no new third-party payload is added to Kodac by this record itself.

## K2 authority boundary

K3 repository intelligence remains informational.

The ast-grep adapter must not become a second trusted execution authority.

If adapter execution itself is routed through a Kodac execution capability, the K2 trust path and its policy/workspace/receipt controls remain authoritative. No repository-intelligence result may directly mutate the workspace or bypass `ExecutionGateway`.

## Acceptance evidence for a future K3-R4 implementation PR

A future implementation PR is eligible for founder review only when it includes, at minimum:

- exact canonical base and PR head;
- exact changed-path inventory;
- no package/lockfile/dependency additions unless separately authorized;
- Kodac-owned adapter contract and evidence-class mapping;
- exact executable discovery and identity logic;
- exact version and digest fail-closed tests;
- path/symlink/workspace confinement tests;
- malformed-output tests;
- stale-snapshot tests;
- deterministic-result tests;
- timeout/cancellation/resource-bound tests appropriate to the adapter;
- zero workspace-mutation evidence;
- provenance completeness evidence;
- canonical K3-R1 fixture validation;
- Linux exact-identity qualification evidence;
- explicit Windows/macOS unqualified state unless separately benchmarked;
- required governance / legacy / K2 checks green;
- fresh independent exact-head review with all valid findings resolved.

## Explicit non-grants

This authorization does **not** authorize:

- general K3 source intake;
- Tree-sitter intake or parser execution;
- SCIP intake or TypeScript semantic indexer execution;
- any concrete language server;
- LSP server execution;
- vector / embedding infrastructure;
- persistent storage;
- SQLite, DuckDB, Neo4j, embedded KV, hosted graph, or vector-store adoption;
- MCP implementation;
- ACP implementation;
- Agent Skills implementation;
- donor source copying/adaptation/vendoring;
- ast-grep library dependency intake;
- permanent ast-grep binary vendoring;
- automatic production download of ast-grep;
- K3-R5 Context Engine implementation;
- K3-R6 integrated K3 → K2 controlled proof;
- public superiority claims;
- public release;
- package publication;
- brand launch;
- Kodac name/trademark clearance;
- ruleset changes;
- direct mutation of canonical `main` outside the protected PR path.

## State after canonical adoption of this authorization

```text
K0/K1: CLOSED
K2: CLOSED
K3: IN PROGRESS
K3-R1: CANONICAL / COMPLETE FOR AUTHORIZED SCOPE
K3-R2: CANONICAL / COMPLETE FOR AUTHORIZED SCOPE
K3-R3: CANONICAL / COMPLETE FOR AUTHORIZED BENCHMARK SCOPE
K3-R4 DECISION: AST-GREP EXTERNAL CLI ADAPTER IMPLEMENTATION AUTHORIZED WITHIN THIS BOUNDARY
AST-GREP SOURCE COPY: NOT AUTHORIZED
AST-GREP PACKAGE / CRATE DEPENDENCY: NOT AUTHORIZED
AST-GREP BINARY VENDORING: NOT AUTHORIZED
TREE-SITTER / SCIP / LSP INTAKE: NOT AUTHORIZED
K3-R5+: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED
PERSISTENT STORAGE: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
KODAC NAME / TRADEMARK CLEARANCE: NOT ESTABLISHED
```

## Next gate

After this authorization is reviewed and canonically adopted, the next permissible K3 action is a separate implementation PR for the bounded external ast-grep CLI adapter described here.

That implementation PR must not add an ast-grep dependency or binary payload unless a later founder authorization explicitly expands this boundary.

K3-R5 remains closed until the authorized K3-R4 adapter implementation/evidence slice is founder-reviewed and canonically adopted or the founder explicitly decides to skip the adapter implementation and advance with built-in evidence only.
