# Kodac KDO-C11 — Augment Context Connector Contract Port Authorization

## Record identity

```text
Gate: KDO-C11
Name: Augment Context Connector Contract Port
Date: 2026-08-13
Canonical base: 5065e5796fbe0245041597409249c3b26f6cbbca
Donor program authority: 184e29af503e70bba3fac90c8165d3facd698819
First-wave audit: CANONICAL
Authority class: COMPONENT PORT AUTHORIZATION
```

## Donor source pin

```text
Repository: augmentcode/context-connectors
Pinned commit: f7d6472ae626c98fd768f64cdfd6160145eefa77
Repository license observed: MIT

Studied source contract:
src/sources/types.ts
blob: d21d61c178607eb28438652eb93911c90aa05aa1

Studied core types:
src/core/types.ts
blob: c65f4757f0e7492e87fdbb08cbd584e03ed8efde

Studied store contract:
src/stores/types.ts
blob: bcd9cf7c70d2d2ae9e9540889c33fbe13e128838
```

The donor source demonstrates three useful separations:

1. a Source abstraction for full/incremental acquisition plus metadata/list/read;
2. source metadata/change-set types distinct from hosted index-state representation;
3. read-only store access separated from full read/write store capability.

KDO-C11 authorizes a Kodac-native **contract port** of these architectural ideas. It does not authorize donor implementation code, hosted Augment context operations, concrete network connectors, persistence, or credentials.

## Purpose

Create the pure data/descriptor layer required before Kodac can safely add external context sources and incremental indexing.

The desired future flow is:

```text
Concrete source adapter (later gate)
        ↓
KDO-C11 source descriptor + bounded content/change records
        ↓
KDO-C12 incremental orchestration (later gate)
        ↓
Kodac-local Context Fabric / K3
        ↓
read/search/client surfaces
```

C11 defines what a connector/source/store/client **claims it can do** and how its evidence/data is structurally identified. It does not execute those capabilities.

## Core authority invariant

```text
ADVERTISED CONNECTOR CAPABILITY != EXECUTION AUTHORITY
SOURCE DESCRIPTOR != NETWORK AUTHORITY
STORE DESCRIPTOR != FILESYSTEM / OBJECT-STORE WRITE AUTHORITY
CLIENT DESCRIPTOR != MCP / HTTP SERVER AUTHORITY
```

K2 remains the only trusted side-effect execution authority.

## Authorized C11 contract concepts

### Source profile

A pure immutable source profile may bind:

- connector/source type;
- source identifier;
- optional resolved revision identity;
- advertised source capabilities;
- source configuration structural identity;
- provenance identity;
- deterministic source-profile identity.

First version source capability vocabulary should include at minimum:

```text
full_snapshot
incremental_changes
list_entries
read_item
revision_resolution
```

These are descriptive flags only.

### Content item

A bounded immutable content item may represent:

- normalized repository-relative/logical path;
- UTF-8 content;
- content byte count;
- SHA-256 content identity;
- source-profile identity;
- optional source revision identity.

C11 must reject unsafe paths including absolute paths, traversal segments, NUL bytes, backslash-based alternate separators, and empty path segments where ambiguity would result.

C11 must not read a filesystem/network to create the item; callers supply the data.

### Change set

A pure change-set contract must distinguish exactly:

```text
FULL_REQUIRED
UNCHANGED
INCREMENTAL
```

An incremental set may contain:

```text
added content items
modified content items
removed normalized logical paths
```

Rules must reject:

- duplicate paths;
- a path appearing in more than one added/modified/removed class;
- content item bound to a different source profile;
- malformed previous/current source revision identities;
- impossible `UNCHANGED` records carrying changes;
- impossible `FULL_REQUIRED` records pretending to carry incremental items.

### Store profile

A pure descriptor may advertise at minimum:

```text
load_full_state
load_search_state
list_keys
save_state
delete_state
```

No store method or persistence implementation is authorized in C11.

The descriptor must make read-only vs write-capable distinctions explicit rather than treating all stores as ambiently writable.

### Client profile

A pure descriptor may advertise at minimum:

```text
search
list
read
mcp_exposure
cli_exposure
```

No MCP server, HTTP server, CLI runner, search engine, or network/process implementation is authorized in C11.

## Deterministic identity

C11 may use SHA-256 canonical structural identities for profiles/change records/content records.

Identity preimages must include all semantics that would make two records materially different.

Hashes are integrity fingerprints only.

```text
HASH != AUTHENTICATION
HASH != SOURCE TRUTH
HASH != CREDENTIAL
HASH != EXECUTION CAPABILITY
```

## Boundedness

The implementation must define explicit bounds at minimum for:

- identifier lengths;
- logical path bytes;
- content item bytes;
- number of capabilities;
- added/modified/removed entries per change set;
- total aggregate content bytes per change set.

Oversized input must fail closed rather than silently truncate.

## Relationship to Augment source semantics

The donor `Source.fetchChanges()` may return `null` to signal that incremental update is not possible and a full rebuild is required.

Kodac C11 should make that semantic explicit as:

```text
FULL_REQUIRED
```

rather than overloading null.

The donor `FileChanges` has added, modified, and removed classes. Kodac should retain this useful distinction while adding deterministic identities, path safety, source binding, and bounded aggregate accounting.

## Relationship to Augment store semantics

The donor distinguishes `IndexStoreReader` from write-capable `IndexStore`.

Kodac should preserve that architectural lesson at descriptor level. A later persistence implementation gate must route writes through authorized capabilities/K2 rather than merely implementing an interface named `save` or `delete`.

## Deliberately excluded donor coupling

C11 must not import or depend on:

```text
@augmentcode/auggie-sdk
DirectContext
FullContextState
SearchOnlyContextState
Augment API tokens
Augment API URL
GitHub/GitLab/Bitbucket HTTP clients
website crawling
S3 clients
filesystem stores
MCP servers
HTTP servers
webhook handlers
```

These belong to later component gates, if qualified.

## Exact implementation allowlist

After this authorization becomes canonical, KDO-C11 implementation is limited to exactly:

```text
packages/kodac-runtime/src/context-connectors/contracts.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/context-connector-contracts.test.ts
docs/planning/KODAC_KDO_C11_AUGMENT_CONTEXT_CONNECTOR_CONTRACT_PORT_EVIDENCE_2026-08-13.md
```

No other repository path is authorized.

## Required tests

The implementation must prove at least:

1. donor provenance constants pin exact repository/commit/source paths/blobs;
2. source/store/client capability vocabularies are fixed and deterministic;
3. duplicate/unknown capabilities fail closed;
4. deterministic canonical capability ordering;
5. deterministic profile identities independent of input capability ordering;
6. source identifier/revision/provenance mutation changes identity;
7. content identity recomputation detects mutation;
8. byte count is recomputed, not trusted from input;
9. unsafe/absolute/traversal/backslash/NUL logical paths fail closed;
10. content byte bounds fail closed;
11. change-set path overlap across added/modified/removed fails closed;
12. duplicate paths within any class fail closed;
13. source-profile mismatch in added/modified items fails closed;
14. `FULL_REQUIRED` and `UNCHANGED` cannot carry incremental entries;
15. incremental change-set ordering canonicalizes deterministically;
16. aggregate item count/byte bounds fail closed;
17. malformed revision identities fail closed;
18. unknown fields fail closed;
19. store read/write capability distinction is representable;
20. client exposure modes remain descriptive only;
21. production C11 source imports only `node:crypto` if hashing is used;
22. no network/process/filesystem-write/ExecutionGateway/Augment SDK surface appears in production C11 code;
23. existing K3/context-engine source remains unchanged;
24. full runtime typecheck/tests remain green on supported CI platforms.

## Explicit non-grants

```text
AUGMENT INDEXER IMPORT: NOT AUTHORIZED
AUGMENT SDK DEPENDENCY: NOT AUTHORIZED
CONCRETE SOURCE ADAPTER: NOT AUTHORIZED
GITHUB/GITLAB/BITBUCKET NETWORK: NOT AUTHORIZED
WEBSITE CRAWLER: NOT AUTHORIZED
FILESYSTEM STORE: NOT AUTHORIZED
S3 STORE: NOT AUTHORIZED
STORE WRITE EXECUTION: NOT AUTHORIZED
MCP SERVER: NOT AUTHORIZED
HTTP SERVER: NOT AUTHORIZED
WEBHOOK EXECUTION: NOT AUTHORIZED
API KEY / SECRET USE: NOT AUTHORIZED
NEW DEPENDENCIES: NOT AUTHORIZED
PACKAGE / LOCKFILE CHANGE: NOT AUTHORIZED
K2 AUTHORITY CHANGE: NOT AUTHORIZED
K3 AUTHORITY CHANGE: NOT AUTHORIZED
KRI AUTHORITY CHANGE: NOT AUTHORIZED
DONE GATE CHANGE: NOT AUTHORIZED
PROVEN_READY AUTHORITY: NOT AUTHORIZED
AUTO-MERGE: NOT AUTHORIZED
```

## Follow-on gate

After C11 is canonical, the intended next donor-derived slice is:

```text
KDO-C12 — Augment Incremental Indexer State-Machine Port
```

C12 may port the full/incremental/unchanged orchestration logic from the pinned `src/core/indexer.ts`, but must replace `@augmentcode/auggie-sdk` / DirectContext hosted operations with Kodac-local injected contracts and must separately define any state mutation authority.

## Merge gate

This authorization record may merge only after exact-head verification confirms:

- exactly one documentation path changed;
- donor pins and source blobs are exact;
- the four-path implementation allowlist is exact;
- C11 remains pure contract/data only;
- no concrete network/store/client execution is granted;
- no new dependency is granted;
- required CI is green;
- main protection active/no bypass;
- unresolved valid review threads zero;
- auto-merge disabled/null.

Canonical adoption authorizes only the bounded four-path C11 implementation above.
