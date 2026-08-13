# KDO-C12 — Augment Incremental Indexer State-Machine Port Evidence

Date: 2026-08-13
Status: IMPLEMENTATION EVIDENCE CANDIDATE
Authorization merge base: `46af31f6fb0e487f9b1e43866e9b6a61f61fa118`
Implementation proof head before this ledger: `aa700a89d04489e645587e343194c91ccc00f6ed`

## Scope

The implementation candidate modified exactly three implementation/test/export paths before this ledger:

1. `packages/kodac-runtime/src/context-connectors/indexer-state-machine.ts`
2. `packages/kodac-runtime/src/index.ts`
3. `packages/kodac-runtime/test/context-connector-indexer-state-machine.test.ts`

This document is the fourth and final path authorized by KDO-C12.

No package manifest, lockfile, workflow, provider transport, connector implementation, persistence backend, K2/K3/KRI authority file, or Done Gate path changed.

## Donor provenance

Repository: `augmentcode/context-connectors`
Commit: `f7d6472ae626c98fd768f64cdfd6160145eefa77`
Studied source: `src/core/indexer.ts`
Git blob: `61b260621b418f8a03dbef66f1cff5ef8ed4d3ef`
Intake mode: `PORT`

The donor source supplied orchestration ideas for first/full indexing, incremental change application, unchanged detection, deletion before updates, add/modify processing, metadata refresh, and state persistence.

Kodac deliberately did not import the donor execution authority: `@augmentcode/auggie-sdk`, `DirectContext`, API token/URL handling, environment reads, network behavior, progress logging, concrete source/store implementations, or persistence calls.

## Implemented Kodac-native contracts

C12 introduces a pure deterministic planning layer with:

- `ContextIndexMembershipEntry`;
- `ContextIndexMembershipState`;
- `ContextIndexUpsertOperation`;
- `ContextIndexTransitionPlan`;
- transition classes `FULL_BUILD_REQUIRED`, `UNCHANGED`, and `INCREMENTAL_UPDATE`;
- explicit full-build reasons;
- bounded state entry count and aggregate content bytes;
- deterministic canonical ordering;
- deterministic SHA-256 structural identities;
- serialized state and plan validation;
- canonical replay verification through `verifyContextIndexTransitionPlan`.

## Incremental semantics proven by tests

The implementation candidate proves at least the following:

- first run requires a full build;
- explicit C11 `FULL_REQUIRED` produces a full-build plan;
- source-profile changes require a full build;
- unprovable revision continuity requires a full build;
- unchanged content retains membership while binding the current source revision;
- incremental removed paths disappear;
- modified paths replace prior membership instead of appending duplicates;
- added paths are inserted;
- unaffected membership is retained;
- transition and next-state identities are independent of input ordering;
- add-existing, modify-missing, and remove-missing operations fail closed;
- changed item revision must be bound to the change-set current revision;
- wrong-revision full-state construction fails closed;
- serialized state identity/count mutation is rejected;
- serialized transition identity mutation is rejected;
- a structurally valid plan from different evidence is rejected by canonical replay verification;
- the state entry-count bound is enforced;
- production source has no ambient network/process/filesystem-write authority;
- canonical C11 contracts remain byte-identical.

## Authority boundary

C12 plans; it does not execute.

A transition plan is not evidence that a connector was read, an index was built, a store was written, or a side effect occurred.

K2 remains the sole trusted side-effect execution authority. C11 advertised source/store/client capabilities remain descriptive metadata rather than authority tokens. C12 grants no `PROVEN_READY` authority and does not change Done Gate semantics.

## Exact-head CI evidence on implementation proof head

Implementation proof head: `aa700a89d04489e645587e343194c91ccc00f6ed`

Workflow results:

- governance run `31705655204`: SUCCESS;
- K3-R4 adapter run `31705655200`: SUCCESS;
- K3-R5 context-engine run `31705655349`: SUCCESS;
- K2 runtime run `31705655196`: SUCCESS.

K2 runtime details on that exact head:

- runtime-change-classifier: SUCCESS;
- Ubuntu Typecheck: SUCCESS;
- Ubuntu Test: SUCCESS;
- Ubuntu Patch benchmark hook: SUCCESS;
- macOS Typecheck: SUCCESS;
- macOS Test: SUCCESS;
- macOS Patch benchmark hook: SUCCESS;
- Windows Typecheck: SUCCESS;
- Windows Test: SUCCESS;
- Windows Patch benchmark hook: SUCCESS;
- `k2-runtime-gate`: SUCCESS.

## Review evidence before ledger

At the time this ledger was created, PR #34 had zero inline review threads on implementation proof head `aa700a89d04489e645587e343194c91ccc00f6ed`.

This is not a permanent certification. Adding this ledger changes the PR head; therefore all checks and reviews listed above become historical evidence only. The final ledger-bearing head must be re-certified from scratch before merge.

## Final merge requirements

Before merge of PR #34, verify on the exact ledger-bearing head:

- cumulative diff is exactly four authorized paths;
- branch is 0 behind canonical base unless canonical `main` moved, in which case fail closed and reconcile;
- governance and all required checks are SUCCESS;
- Ubuntu/macOS/Windows runtime matrix and `k2-runtime-gate` are SUCCESS;
- all reviewer claims are adjudicated against the exact current head;
- no unresolved review threads remain;
- canonical `main` still equals the expected authorization merge base;
- repository main protection remains active with no bypass;
- merge uses expected-head merge commit;
- post-merge main/tree/parents/signature and push workflows are verified.
