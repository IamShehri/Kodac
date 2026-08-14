# KDO-H4-R1 Legacy Test Reconciliation Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Purpose

This document authorizes one narrowly bounded supplemental test-only reconciliation for the already-authorized KDO-H4-R1 one-shot approval implementation.

It exists because H4-R1 canonically authorizes `packages/kodac-runtime/src/execution/gateway.ts` to change, while three older cross-slice regression tests still pin that file to its pre-H4 blob identity. Those pins now contradict the current H4-R1 authority and prevent the required full runtime suite from becoming green even though the H4-R1 focused tests pass.

This supplemental authorization does not enlarge H4-R1 production authority.

## 2. Canonical base

Repository:

`TheHalfMoon/Kodac`

Exact canonical `main` at authorization creation:

`fbac06934eaf55c173a70ddf24a42ecb2323c2b8`

That commit is the merge of PR #51, the canonical H4-R1 one-shot approval authorization.

## 3. Related implementation PR

Implementation PR:

`#52 — feat(kdo): implement H4-R1 one-shot approval contracts`

Observed corrected pre-ledger head that exposed the legacy contradiction:

`49f6326953c64d4e73e0ec8aa33d74b60b59ab07`

PR #52 MUST remain Draft while this supplemental authorization is reviewed and merged.

The H4-R1 evidence ledger MUST remain absent until the implementation candidate passes the complete pre-ledger gate after reconciliation.

## 4. Existing H4-R1 authority remains unchanged

The canonical H4-R1 authorization already permits changes to:

- `packages/kodac-runtime/src/trust/approval.ts`
- `packages/kodac-runtime/src/execution/gateway.ts`
- `packages/kodac-runtime/src/evidence/receipt.ts`
- `packages/kodac-runtime/src/index.ts`
- `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`
- `packages/kodac-runtime/test/gateway.test.ts`
- the final H4-R1 evidence ledger only after the pre-ledger gate passes.

All production semantics, protected paths, non-grants, focused tests, pre-ledger gate, post-ledger gate, and bounded completion claim from the canonical H4-R1 authorization remain in force.

## 5. Observed exact-head failure evidence

At implementation head:

`49f6326953c64d4e73e0ec8aa33d74b60b59ab07`

H4-R1 focused tests passed, including:

- allow bypasses approval;
- deny never consults approval;
- ask without service remains fail-closed;
- rejected/cancelled/unavailable remain blocked;
- malformed/mismatched decisions fail closed;
- allowed-once evidence precedes mutation;
- prior decisions cannot authorize later invocations;
- concurrent identical asks use distinct request instances;
- evidence failure prevents execution;
- abort remains fail-closed;
- K2 `ExecutionUnprovenError` semantics remain intact;
- execution environment is captured before approval and reused for execution.

The complete runtime suite reported:

`tests=398, pass=395, fail=3`

All three failures were stale blob assertions for the same canonically authorized H4-R1 production path:

`packages/kodac-runtime/src/execution/gateway.ts`

Observed H4-R1 gateway blob at that exact head:

`664f70dab6e7f7f4f3d66e905519bbf938d4d044`

Legacy expected pre-H4 gateway blob:

`be5926e9a8dc5c4c29d441dac11661d71e797015`

The failing legacy tests were exactly:

1. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
   - test: `H1 production surface is descriptive only and canonical authority surfaces remain unchanged`
2. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
   - test: `H2-R1 contract has no execution transport or secret authority and protected surfaces stay unchanged`
3. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
   - test: `H2-R2 protected authority surfaces remain byte-identical`

No H1 descriptor behavior, H2 request/history behavior, K3 behavior, provider transport behavior, ToolRegistry behavior, Done Gate behavior, or H4-R1 focused behavior was shown failing by this evidence.

## 6. Contradiction analysis

The three old assertions were valid when their slices were certified because `ExecutionGateway` was outside those slices and had to remain byte-identical.

They are no longer valid as permanent global authority because the later canonical H4-R1 authorization explicitly grants a bounded change to `ExecutionGateway` for one-shot approval integration.

Therefore:

`historical cross-slice gateway blob pin != permanent prohibition on later canonically authorized gateway evolution`

The old assertions must not be satisfied by reverting H4-R1, weakening one-shot approval, moving H4 behavior around `ExecutionGateway`, or hiding gateway changes in another production path.

The correct reconciliation is to remove only the obsolete cross-slice `ExecutionGateway` byte pin from those three historical tests while preserving every still-valid protection they enforce.

## 7. Supplemental test-only allowlist

This authorization adds exactly these three implementation-PR paths to the H4-R1 allowlist:

1. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
2. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
3. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`

No other new path is authorized.

After this document is canonical, the effective H4-R1 implementation allowlist is the original H4-R1 allowlist plus exactly these three legacy test paths.

## 8. Required reconciliation semantics — H1 test

Within:

`packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`

The correction MUST:

- remove only the obsolete pre-H4 `ExecutionGateway` blob assertion from the H1 protected-surface test;
- preserve the proof that H1 contracts/registry remain descriptive-only;
- preserve H1 checks excluding execution primitives from H1 extension implementation;
- preserve the existing Done Gate blob pin;
- preserve the existing ToolRegistry blob pin;
- preserve the existing model-provider blob pin.

The test MUST NOT be rewritten to bless H4 approval as H1 plugin/extension authority.

## 9. Required reconciliation semantics — H2-R1 test

Within:

`packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`

The correction MUST:

- remove only the obsolete pre-H4 `ExecutionGateway` blob assertion from the H2-R1 protected-surface test;
- preserve the proof that the H2-R1 request contract has no execution, transport, credential, or secret authority;
- preserve the ToolRegistry blob pin;
- preserve the OpenAI provider transport blob pins;
- preserve the Done Gate blob pin.

The H2-R1 request snapshot remains reconstruction authority for the exact model-visible provider boundary. H4 approval MUST NOT modify or reinterpret it.

## 10. Required reconciliation semantics — H2-R2 test

Within:

`packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`

The correction MUST:

- remove only the obsolete `ExecutionGateway` entry from the protected-authority expected-blob map;
- preserve every other protected blob entry in that map, including:
  - model turn;
  - model provider;
  - OpenAI transport;
  - OpenAI-compatible transport;
  - RuntimeOrchestrator;
  - ToolRegistry;
  - Done Gate;
- preserve all H2-R2 event-derived history, projection, continuity, journal, and authority-boundary tests.

H4 approval MUST NOT become an H2 history authority or modify H2 session semantics.

## 11. Do not replace the stale hash with a new H4 hash

The reconciliation MUST NOT simply replace:

`be5926e9a8dc5c4c29d441dac11661d71e797015`

with the current H4 candidate gateway blob.

Reason:

H4-R1 is still pre-ledger and may require further authorized corrections. A new cross-slice pin would recreate the same procedural defect and make historical H1/H2 tests a parallel authority over an actively authorized H4 production path.

Gateway drift for H4-R1 is governed instead by:

- the exact H4-R1 authorization allowlist;
- H4-R1 focused behavioral tests;
- exact-head review;
- the complete runtime matrix;
- the H4-R1 evidence ledger only after pre-ledger certification;
- expected-head merge governance.

## 12. Explicit non-grants

This supplemental authorization does NOT authorize:

- any additional production path;
- any change to H1 extension contracts or registry;
- any change to H2-R1 request contracts;
- any change to H2-R2 history/session contracts;
- any change to K2 policy semantics;
- any change to provider transports;
- any change to ToolRegistry;
- any change to RuntimeOrchestrator;
- any change to Done Gate;
- any sandbox or confinement feature;
- any H5 tool pipeline feature;
- persistent approvals or `allow-always`;
- weakening or removing H4-R1 one-shot evidence requirements;
- bypassing K2 `deny`;
- adding the H4-R1 evidence ledger before a green pre-ledger candidate;
- marking PR #52 Ready before all pre-ledger and post-ledger gates are satisfied;
- auto-merge.

## 13. Required post-reconciliation verification

After these three test-only corrections are applied to PR #52, a new exact head MUST independently satisfy the canonical H4-R1 pre-ledger gate:

- effective changed paths remain within the combined authorized allowlist;
- TypeScript typecheck PASS;
- complete runtime suite PASS;
- focused H4-R1 tests PASS;
- Ubuntu PASS;
- macOS PASS;
- Windows PASS;
- patch benchmark PASS where applicable;
- governance PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- K2 runtime gate PASS;
- exact-head review adjudication complete;
- unresolved review threads = 0.

Only after that exact head passes may the H4-R1 evidence ledger be added.

## 14. PR state requirement

PR #52 remains:

`OPEN / DRAFT / NOT MERGED`

through this supplemental authorization and subsequent pre-ledger reconciliation.

No implementation merge is authorized by this document alone.

## 15. Decision

`H4_R1_LEGACY_TEST_RECONCILIATION_AUTHORIZED_FOR_FOUNDER_REVIEW`

Bounded meaning:

**Three historical tests may stop pinning `ExecutionGateway` to the pre-H4 blob because H4-R1 now canonically owns a bounded gateway change. Every other historical H1/H2 authority protection remains intact.**
