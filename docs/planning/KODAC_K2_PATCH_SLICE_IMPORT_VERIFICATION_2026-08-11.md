# Kodac K2 Patch Slice Import Verification — 2026-08-11

## Decision

```text
PASS — OPENCODE PATCH V1 ADAPTATION VERIFIED FOR ISOLATED K2 BRANCH
```

Repository:

```text
IamShehri/Kodac
```

Branch:

```text
feat/kodac-k2-runtime-spine
```

Verified implementation HEAD:

```text
63dfefaa483469b82d9125bff423756ea630863e
```

## Provenance identity

```text
record_id: opencode-patch-v1
upstream: https://github.com/anomalyco/opencode
upstream commit: 3a90639cb57619a21e59f544b3e8d23ffed56f48
upstream source: packages/opencode/src/patch/index.ts
Kodac destination: packages/kodac-runtime/src/edit/patch.ts
classification: ADAPT
license: MIT
```

The OpenCode MIT notice is preserved in:

```text
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
```

The explicitly excluded OpenCode source dependencies were not imported:

```text
packages/core/src/fs-util.ts
packages/opencode/src/util/bom.ts
```

## K2 native boundaries established

The slice adds native Kodac-owned components around the adapted patch logic:

```text
WorkspaceFileSystem
NodeWorkspaceFileSystem
PolicyEngine
ExecutionGateway
ExecutionReceipt
```

The effectful path is:

```text
patch input
   ↓
parse
   ↓
intent + affected paths + SHA-256 digest
   ↓
PolicyEngine
   ↓
allow / ask / deny
   ↓
ExecutionGateway
   ↓
workspace-confined filesystem
   ↓
mutation
   ↓
ExecutionReceipt
```

`ask` and `deny` produce blocked receipts without filesystem mutation. Allowed execution emits a success receipt; allowed execution failures emit failure receipts.

## Security boundary tests

The K2 tests include explicit rejection of:

- lexical `../` traversal;
- absolute/non-relative workspace paths through the filesystem boundary;
- writes through a symlink whose resolved target escapes the workspace;
- malformed patch directives;
- update chunks whose expected lines cannot be found;
- duplicate path mutation within one patch;
- add-overwrite and move-destination collision behavior in the implementation contract.

## Functional tests

Behavioral coverage includes:

- add;
- update;
- delete;
- move + update;
- Unicode punctuation matching fallback;
- policy allow/ask/deny behavior;
- success and blocked execution receipts.

## Benchmark hook

The package includes:

```text
packages/kodac-runtime/bench/patch-bench.ts
```

which emits machine-readable JSON for `patch-parse-v1` and is executed by the K2 runtime workflow after tests.

## Failure history preserved

The first implementation commit was:

```text
83ac10b7cafea86d0b1e961565ee6f37bea990b1
```

Its TypeScript compile/typecheck step passed, but runtime tests failed because Node 24 strip-types does not transform TypeScript parameter-property syntax used in the first `ExecutionGateway` implementation.

The record was intentionally **not** promoted to `imported` after that run.

Correction commit:

```text
63dfefaa483469b82d9125bff423756ea630863e
```

removed the unsupported parameter-property syntax without changing the architecture.

## GitHub Actions evidence

For correction commit `63dfefaa483469b82d9125bff423756ea630863e`:

```text
k2-runtime run: 31441646149 — SUCCESS
governance run: 31441646185 — SUCCESS
```

Governance jobs:

```text
legacy-tests — SUCCESS
provenance   — SUCCESS
```

K2 runtime verified:

```text
Typecheck            — SUCCESS
Node runtime tests   — SUCCESS
Patch benchmark hook — SUCCESS
```

## Import-state decision

All requirements of the scoped G8 authorization needed to advance the record from `authorized` to `imported` are satisfied for this isolated branch.

Therefore:

```text
opencode-patch-v1: IMPORTED
additional donor source: NOT AUTHORIZED
merge to canonical main: NOT AUTHORIZED
public release: NOT AUTHORIZED
```

## Remaining boundary

This verification certifies only the first trusted patch-execution slice. It does not certify the wider OpenCode runtime, provider layer, session layer, MCP/ACP adapters, Repo Graph, sandbox backends, or any other donor path.
