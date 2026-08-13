# KDO-C12 — Augment Incremental Indexer State-Machine Port Authorization

Date: 2026-08-13
Status: AUTHORIZATION CANDIDATE
Canonical base: `fd41489b9713cd78a3cf939c3d7f2a2c086419a8`

## Purpose

Authorize one bounded Kodac-native port of the incremental-index orchestration semantics studied from Augment Context Connectors, building strictly on canonical KDO-C11 contracts.

This gate does not authorize any donor runtime, hosted indexing engine, connector transport, storage backend, credentials, network call, process execution, filesystem write, or new dependency.

## Donor pin

Repository: `augmentcode/context-connectors`
Commit: `f7d6472ae626c98fd768f64cdfd6160145eefa77`
Studied source: `src/core/indexer.ts`
Git blob: `61b260621b418f8a03dbef66f1cff5ef8ed4d3ef`
Intake mode: `PORT`

The studied donor source orchestrates full indexing, incremental changes, unchanged detection, removal of deleted files, addition of new/modified files, metadata refresh, state export, and persistence. It also imports `@augmentcode/auggie-sdk`, reads API credentials/environment variables, creates/imports `DirectContext`, logs progress, and writes state through a store. Those authority-bearing pieces are explicitly excluded from KDO-C12.

## Authorized implementation surface after this authorization merges

Exactly four paths:

1. `packages/kodac-runtime/src/context-connectors/indexer-state-machine.ts`
2. `packages/kodac-runtime/src/index.ts`
3. `packages/kodac-runtime/test/context-connector-indexer-state-machine.test.ts`
4. `docs/planning/KODAC_KDO_C12_AUGMENT_INCREMENTAL_INDEXER_STATE_MACHINE_PORT_EVIDENCE_2026-08-13.md`

No additional path is authorized by this gate.

## Required Kodac-native behavior

KDO-C12 must implement a pure deterministic state-transition planner over already-validated C11 records. It may decide what should happen; it may not perform the side effects itself.

The planner must distinguish at least these transition classes:

- `FULL_BUILD_REQUIRED`
- `UNCHANGED`
- `INCREMENTAL_UPDATE`

A transition plan must bind deterministically to:

- exact source-profile identity;
- previous indexed-state identity when present;
- current change-set identity;
- previous/current source revision identities when available;
- deterministic ordered remove/add-or-replace operations;
- explicit reason for full rebuild;
- deterministic transition identity.

## Full-build semantics

A full build must be required when any of the following is true:

- no prior indexed state exists;
- C11 change set kind is `FULL_REQUIRED`;
- prior state belongs to a different source profile;
- revision/provenance continuity required by the contract is not provable;
- prior state is malformed or exceeds bounds;
- incremental invariants cannot be satisfied safely.

The state machine must not silently reuse prior indexed membership after a full-build decision.

## Incremental semantics

For an `INCREMENTAL` C11 change set, the transition plan must:

- remove every declared removed path;
- treat modified paths as replacement operations, never blind append;
- add every newly added content item;
- retain unaffected prior members deterministically;
- reject duplicate/overlapping/conflicting operations;
- reject source-profile mismatches;
- preserve exact content/item identities from validated C11 records;
- compute next membership deterministically independent of input ordering.

A path that is both removed and added/modified in the same accepted plan must fail closed unless the contract explicitly models that combination as a replacement. C12 must not invent ambiguous semantics.

## Unchanged semantics

For a valid `UNCHANGED` change set with a valid compatible prior state, the next state identity must remain logically tied to the same indexed membership while binding to the current source/change evidence. `UNCHANGED` is not permission to skip validation.

## State contract

The implementation may define a bounded Kodac-owned index membership state containing only deterministic metadata such as:

- version;
- source profile identity;
- source revision identity when present;
- ordered logical paths;
- per-path content/item identities;
- membership count and aggregate content bytes;
- state identity.

No embedding vectors, model outputs, hosted checkpoint IDs, API responses, raw secrets, or donor `DirectContext` state may appear in this contract.

## Pure planner boundary

`indexer-state-machine.ts` must remain pure with respect to external authority.

Allowed imports:

- Node cryptographic hashing primitives required for deterministic identities;
- C11 context-connector contract types/functions.

Not allowed:

- `@augmentcode/auggie-sdk`;
- `fetch`, HTTP clients, WebSocket clients;
- environment-variable reads;
- API keys/tokens/base URLs;
- filesystem or S3 reads/writes;
- child processes;
- MCP/HTTP servers;
- timers/clock-derived identities;
- random values;
- model calls;
- `ExecutionGateway` invocation;
- new dependencies.

## Authority invariants

KDO-C12 does not grant side-effect authority.

- K2 remains the sole trusted side-effect execution authority.
- C11 source/store/client capabilities remain descriptions, not permission tokens.
- A C12 transition plan is a claim about the deterministic next indexing action, not proof that the action was executed.
- No C12 record may confer `PROVEN_READY`.
- Done Gate retains completion authority.
- Reviewer output remains a claim, not completion truth.

## Required tests

The implementation test path must cover at least:

- first-run => full build;
- explicit C11 `FULL_REQUIRED` => full build;
- valid unchanged transition;
- valid deterministic incremental add/modify/remove transition;
- modified item replaces prior membership identity;
- removed item disappears from next membership;
- unaffected items are retained;
- source-profile mismatch fails closed or forces explicit full build as specified;
- malformed/tampered previous state rejection;
- malformed/tampered transition-plan rejection;
- input ordering does not change resulting transition/state identities;
- duplicate/conflicting operations fail closed;
- path/content aggregate bounds are enforced;
- donor provenance pin is exact;
- source contains no ambient network/process/filesystem-write/credential authority;
- existing C11 contracts remain byte-identical unless this authorization is separately amended.

## CI and review requirements

Before merge of the future implementation:

- exact authorized path scope only;
- required governance checks green;
- K2 runtime classifier and Ubuntu/macOS/Windows runtime matrix green on the exact final head;
- all review findings adjudicated against the exact current head;
- no unresolved review threads;
- evidence ledger added only after a proven implementation candidate exists;
- final ledger-bearing head re-certified from scratch;
- merge by expected-head merge commit only;
- post-merge canonical `main`, merge tree/parents/signature, governance and K2 push checks verified.

## Explicit non-grants

This authorization does not authorize:

- concrete GitHub/GitLab/Bitbucket/website connectors;
- filesystem/S3/memory store implementations;
- Augment `DirectContext` or `auggie-sdk`;
- embedding/index search engine implementation;
- persistence or network access;
- MCP exposure;
- webhook handling;
- provider/model execution;
- package or lockfile changes;
- K3-R6+ expansion;
- KRI authority expansion;
- Done Gate changes;
- public release.

## Founder decision encoded by this gate

Port the useful incremental-index state-machine semantics, but separate planning from execution and hosted engine authority. Kodac should be able to prove exactly why a full rebuild, no-op, or incremental update is required before any side effect occurs.