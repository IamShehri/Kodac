# Kodac KDO-C11 — Augment Context Connector Contract Port Evidence

## Record identity

```text
Gate: KDO-C11
Authorization merge: e4588d796c56a33000f71fdc24b5e4e309bc249f
Implementation PR: #32
Donor: augmentcode/context-connectors
Donor commit: f7d6472ae626c98fd768f64cdfd6160145eefa77
Intake mode: PORT
```

Studied donor contracts:

```text
src/sources/types.ts
d21d61c178607eb28438652eb93911c90aa05aa1

src/core/types.ts
c65f4757f0e7492e87fdbb08cbd584e03ed8efde

src/stores/types.ts
bcd9cf7c70d2d2ae9e9540889c33fbe13e128838
```

## Exact implementation surface

```text
packages/kodac-runtime/src/context-connectors/contracts.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/context-connector-contracts.test.ts
docs/planning/KODAC_KDO_C11_AUGMENT_CONTEXT_CONNECTOR_CONTRACT_PORT_EVIDENCE_2026-08-13.md
```

No other path is authorized or used by this slice.

## Ported donor ideas

The pinned Augment source separates:

- source acquisition contracts;
- source metadata/change records;
- read-only store access from write-capable stores.

Kodac ports these ideas into a pure descriptor/data layer and adds stricter trust/bounds semantics.

### Source capabilities

```text
full_snapshot
incremental_changes
list_entries
read_item
revision_resolution
```

### Store capabilities

```text
load_full_state
load_search_state
list_keys
save_state
delete_state
```

### Client capabilities

```text
search
list
read
mcp_exposure
cli_exposure
```

These capability strings are descriptive evidence only. They are not capability tokens, credentials, process/network/filesystem authority, or proof that a connector/store/client actually implements the behavior.

## Explicit change-set semantics

Instead of overloading donor `null` to mean “incremental update unavailable; rebuild fully”, Kodac defines:

```text
FULL_REQUIRED
UNCHANGED
INCREMENTAL
```

`INCREMENTAL` retains donor-style distinctions between:

```text
added
modified
removed
```

and adds:

- source-profile binding;
- source-revision identities where supplied;
- canonical ordering;
- duplicate/overlap rejection;
- item-count bounds;
- aggregate-content byte bounds;
- deterministic change-set identity;
- serialized change-set reconstruction validation.

## Content safety and integrity

`ContextContentItem` binds:

```text
logical path
UTF-8 content
recomputed byte count
SHA-256 content identity
source profile identity
optional source revision identity
item structural identity
```

Logical path validation rejects:

- absolute POSIX paths;
- Windows drive-absolute paths;
- backslash alternate separators;
- traversal (`..`);
- current-directory (`.`) ambiguity;
- empty path segments;
- NUL bytes.

Content is bounded to 1 MiB per item in C11. Change sets are bounded to 2048 entries and 16 MiB aggregate added/modified content.

No truncation is silently performed.

## Store read/write distinction

The donor source distinguishes read-only `IndexStoreReader` from write-capable `IndexStore`.

Kodac preserves that architectural lesson at descriptor level:

```text
mode = read_only | read_write
```

A `read_only` store profile is rejected if it advertises `save_state` or `delete_state`.

No actual store implementation is included in C11.

## Client/exposure boundary

`mcp_exposure` and `cli_exposure` are descriptive profile values only.

C11 includes no:

```text
MCP server
HTTP server
CLI runner
search engine
network client
webhook
```

## Production source purity

The canonical C11 production module imports only:

```text
node:crypto
```

Regression tests reject executable/import surfaces associated with:

- `@augmentcode/auggie-sdk`;
- `DirectContext` construction;
- `fetch(`;
- Node fs/network/child-process imports;
- ExecutionGateway references;
- API credential assignment patterns;
- filesystem-write calls.

This is a bounded source regression, not a replacement for repository review/security analysis.

## K3 preservation

C11 does not modify the canonical K3 context engine.

The regression suite pins:

```text
packages/kodac-runtime/src/context-engine/context-engine.ts
Git text blob: 13f16c99f76c133793e5bbc50474197ee1d6e045
```

## CI chronology

### Initial implementation candidate

```text
head:
dc57ae67a4e84074021269b8e3b0b4dce913cba9
```

Result:

```text
runtime-change-classifier: SUCCESS
Ubuntu typecheck: FAILURE
macOS typecheck: FAILURE
```

The compiler findings were preserved rather than treated as passing evidence.

The defects were contract/type-shape issues:

1. exported `ContextSourceKind` collided with an existing canonical Kodac export;
2. TypeScript inferred the default `maxBytes` parameter as literal type `256` due the frozen `as const` limit object, rejecting valid calls with limits `64` and `4096`.

### Correction candidate

```text
head:
59274d352ea72256f053812984f75b3b3181f344
```

Corrections:

- renamed the new connector-specific source-kind type to `ContextConnectorSourceKind`;
- made numeric bound types explicit;
- simplified the contract implementation;
- added `validateContextSourceChangeSet` so serialized derived fields and change-set identities are reconstructed rather than trusted.

No network/store/process authority was added.

Exact-head GitHub evidence on `59274d352ea72256f053812984f75b3b3181f344`:

```text
governance: SUCCESS
k3-r4-adapter: SUCCESS
k3-r5-context-engine: SUCCESS
k2-runtime: SUCCESS

Ubuntu:
  typecheck: SUCCESS
  tests: SUCCESS
  patch benchmark hook: SUCCESS

macOS:
  typecheck: SUCCESS
  tests: SUCCESS
  patch benchmark hook: SUCCESS

Windows:
  typecheck: SUCCESS
  tests: SUCCESS
  patch benchmark hook: SUCCESS

k2-runtime-gate: SUCCESS
```

Adding this evidence ledger moves the implementation head. Therefore all evidence above is historical evidence only and final merge certification must be rerun on the ledger-bearing exact head.

## Explicit limitations

C11 does not:

- authenticate source/store/client identities;
- contact or resolve a source revision;
- read repository/filesystem/web content;
- persist index state;
- execute incremental indexing;
- run Augment `DirectContext`;
- use Augment API credentials;
- provide concrete GitHub/GitLab/Bitbucket/website connectors;
- expose MCP or HTTP servers;
- authorize a store write.

C11 is the pure contract layer required before those implementations can be individually qualified.

## Authority truth

```text
ADVERTISED SOURCE CAPABILITY != NETWORK AUTHORITY
ADVERTISED STORE WRITE CAPABILITY != WRITE AUTHORITY
MCP_EXPOSURE DESCRIPTOR != MCP SERVER AUTHORITY
STRUCTURAL IDENTITY != AUTHENTICATION
CHANGE SET != EXECUTION INSTRUCTION
```

K2 remains the sole trusted side-effect execution authority.
K3 authority is unchanged.
KRI authority is unchanged.
The Done Gate retains `PROVEN_READY` authority.

## Next component

After C11 canonical adoption, the planned donor-derived component is:

```text
KDO-C12 — Augment Incremental Indexer State-Machine Port
```

C12 should port the full/incremental/unchanged orchestration from pinned `src/core/indexer.ts` while replacing `@augmentcode/auggie-sdk`/DirectContext with Kodac-owned injected pure/state contracts and separately governing any persistence/execution authority.

## Final merge gate

The final exact head may merge only after proving:

- cumulative diff = exactly four authorized paths;
- donor provenance constants exact;
- K3 source unchanged;
- no Augment SDK/network/store implementation dependency;
- no package/lockfile changes;
- governance/K3 checks green;
- Ubuntu/macOS/Windows typecheck/tests/patch hook green;
- `k2-runtime-gate` green;
- zero unresolved valid review threads;
- main protection active/no bypass;
- expected-head merge protection.
