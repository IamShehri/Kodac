# KDO-H4-R1 Apply-Patch Abort Propagation Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Purpose

This document authorizes one narrowly bounded supplemental H4-R1 correction discovered by exact-head review after the initial pre-ledger CI matrix passed.

The correction exists because the canonical `repo.apply_patch` RuntimeTool currently performs an early abort check but does not forward the same runtime `AbortSignal` into `ExecutionGateway.applyPatch`. H4-R1 made approval waits cancellable inside `ExecutionGateway`, but the tool adapter currently drops that cancellation channel.

Without correction, cancellation that occurs while `ApprovalService.decide` is pending can be lost: the service may later return `allowed-once`, and the gateway can proceed to workspace mutation even though the originating tool context was cancelled.

This supplemental authorization does not broaden H4-R1 beyond one-shot approval cancellation continuity. It does not authorize sandbox work, H5 pipeline work, or any new execution authority.

## 2. Canonical repository base

Repository:

`TheHalfMoon/Kodac`

Exact canonical `main` at authorization creation:

`0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7`

This base includes:

- original H4-R1 authorization PR #51 / merge `fbac06934eaf55c173a70ddf24a42ecb2323c2b8`;
- H4-R1 legacy-test reconciliation authorization PR #53 / merge `0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7`.

## 3. Related implementation PR

Implementation PR:

`#52 — feat(kdo): implement H4-R1 one-shot approval contracts`

The former pre-ledger candidate reviewed by CodeRabbit was:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

That candidate passed the full required CI matrix but is NOT accepted for evidence capture because exact-head review found the abort-propagation defect described here.

A prematurely created evidence ledger was subsequently withdrawn. PR #52 is again:

`OPEN / DRAFT / NOT MERGED`

The H4-R1 evidence ledger MUST remain absent until a corrected exact head passes the complete pre-ledger gate and fresh review.

## 4. Review finding

Exact-head CodeRabbit review of:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

reported the following valid defect:

- `packages/kodac-runtime/src/tools/apply-patch.ts` invokes `gateway.applyPatch` without forwarding `{ signal: context.signal }`;
- the tool checks `context.signal` only before the approval wait begins;
- cancellation during `ApprovalService.decide` therefore does not reach `ExecutionGateway.authorize`;
- a later `allowed-once` decision can proceed after caller cancellation;
- workspace mutation can therefore occur after the originating RuntimeTool execution was cancelled.

The current canonical tool source confirms this shape:

- early `context.signal?.aborted` check exists;
- `gateway.applyPatch(input.patchText, observer)` is invoked without the gateway options signal.

This is a real continuity defect between the H4-R1 approval gate and the existing runtime tool context.

## 5. Why a supplemental authorization is required

The original H4-R1 implementation allowlist permits changes to:

- `packages/kodac-runtime/src/trust/approval.ts`
- `packages/kodac-runtime/src/execution/gateway.ts`
- `packages/kodac-runtime/src/evidence/receipt.ts`
- `packages/kodac-runtime/src/index.ts`
- `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`
- `packages/kodac-runtime/test/gateway.test.ts`
- final evidence ledger only after a green pre-ledger candidate.

The PR #53 supplemental authorization additionally permits exactly three historical H1/H2 test reconciliation paths.

Neither authorization permits modification of:

`packages/kodac-runtime/src/tools/apply-patch.ts`

Therefore the valid review finding cannot be corrected without an explicit supplemental grant.

## 6. Supplemental production allowlist

This authorization adds exactly one new production path to the effective H4-R1 implementation allowlist:

`packages/kodac-runtime/src/tools/apply-patch.ts`

No other new production path is authorized.

No new test path is required because the existing focused H4-R1 test path is already authorized:

`packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`

The effective H4-R1 allowlist after this authorization becomes canonical is therefore:

### Original production/export paths

- `packages/kodac-runtime/src/trust/approval.ts`
- `packages/kodac-runtime/src/execution/gateway.ts`
- `packages/kodac-runtime/src/evidence/receipt.ts`
- `packages/kodac-runtime/src/index.ts`

### This supplemental production path

- `packages/kodac-runtime/src/tools/apply-patch.ts`

### Original H4-R1 tests

- `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`
- `packages/kodac-runtime/test/gateway.test.ts`

### PR #53 supplemental historical tests

- `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
- `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
- `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`

### Final evidence path, still gated

- `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md`

The evidence path remains unauthorized for actual addition until the corrected pre-ledger gate passes.

## 7. Required apply-patch correction

Within:

`packages/kodac-runtime/src/tools/apply-patch.ts`

the correction MUST be narrowly limited to preserving the originating RuntimeTool cancellation channel through the H4-R1 approval wait.

The canonical execution call MUST pass the tool context signal to the gateway call, semantically equivalent to:

```ts
return gateway.applyPatch(input.patchText, observer, { signal: context.signal })
```

The existing early pre-abort check may remain as defense in depth.

The correction MUST NOT:

- create a separate approval service in the tool;
- evaluate or override K2 policy in the tool;
- manufacture an `allowed-once` decision;
- persist approval evidence independently of the H4-R1 gateway path;
- bypass `ExecutionGateway`;
- add retry semantics;
- add sandbox or confinement behavior;
- add H5 hooks or generic interception stages;
- change the tool capability or model-visible schema;
- change the ReceiptLedger authority model;
- change ToolRegistry authority.

## 8. Required end-to-end regression proof

The already-authorized focused test:

`packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`

MUST add an end-to-end regression through the real `repo.apply_patch` RuntimeTool adapter rather than testing only `ExecutionGateway.applyPatch` directly.

The proof MUST establish:

1. the RuntimeTool is invoked with a live `AbortSignal` in its tool context;
2. K2 policy produces `ask`;
3. the H4-R1 approval service begins waiting;
4. the caller aborts while the approval decision is pending;
5. the same signal reaches the gateway approval path;
6. the resulting approval decision is durably represented as `cancelled` rather than becoming usable `allowed-once` authority;
7. the workspace is not mutated;
8. no success K2 execution receipt is produced;
9. the approval service cannot cause a later `allowed-once` return to resurrect the cancelled invocation.

The test may use deterministic synchronization rather than time-based races.

The proof MUST NOT weaken the existing direct-gateway abort tests; those remain required.

## 9. One-shot semantics after correction

The corrected path MUST preserve the existing H4-R1 semantics:

- `allow` does not consult approval;
- `deny` cannot be overridden;
- only `ask` can request approval;
- approval is one-shot;
- exact request identity and request-instance identity remain required;
- `asked` evidence precedes decision use;
- `decided` evidence precedes side effects;
- malformed/mismatched/unavailable/rejected/cancelled outcomes fail closed;
- K2 execution receipts remain execution-outcome authority;
- receipt evidence failure remains `ExecutionUnprovenError`;
- no persistent grant exists.

## 10. No false cancellation claim

This correction proves cancellation continuity specifically across the RuntimeTool-to-H4 approval wait before mutation begins.

It does NOT claim that arbitrary filesystem mutation can be interrupted transactionally after `applyHunks` has already begun.

Therefore H4-R1 may claim:

`cancelled while approval is pending -> no authorization -> no side effect`

It MUST NOT claim:

`all side effects are transactionally cancellable at every instruction boundary`.

## 11. Evidence-ledger correction rule

The previous evidence ledger candidate was withdrawn because its pre-ledger acceptance claim was invalidated by the later review finding.

A new H4-R1 evidence ledger may be created only after:

- this supplemental authorization is canonical;
- PR #52 includes it in ancestry;
- `apply-patch.ts` is corrected within this exact scope;
- the end-to-end tool cancellation regression is added;
- a new exact pre-ledger head passes all required checks;
- fresh exact-head review has no unresolved actionable finding;
- unresolved review threads = 0.

The future ledger MUST record this abort-propagation finding, withdrawal, supplemental authorization, correction, and re-certification sequence. It MUST NOT reuse `212e76df...` as the accepted pre-ledger head.

## 12. Required pre-ledger gate after correction

The corrected exact head of PR #52 MUST independently satisfy:

- changed paths remain within the combined effective H4-R1 allowlist;
- H4-R1 evidence ledger absent;
- TypeScript typecheck PASS;
- complete runtime suite PASS;
- focused H4-R1 tests PASS;
- end-to-end apply-patch cancellation regression PASS;
- Ubuntu PASS;
- macOS PASS;
- Windows PASS;
- patch benchmark PASS;
- governance PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- K2 runtime final gate PASS;
- fresh exact-head review/adjudication complete;
- unresolved review threads = 0.

Only after that exact head passes may the H4-R1 evidence ledger be recreated.

## 13. Protected non-authority surfaces

This supplemental authorization grants no changes to:

- `packages/kodac-runtime/src/trust/policy.ts`
- `packages/kodac-runtime/src/model/turn.ts`
- `packages/kodac-runtime/src/model/provider.ts`
- provider transports
- H2 request/history/session production files
- `packages/kodac-runtime/src/tools/registry.ts`
- `packages/kodac-runtime/src/runtime/orchestrator.ts`
- `packages/kodac-runtime/src/verification/done-gate.ts`
- agent loop
- any sandbox/confinement provider
- any H5 guarded tool-pipeline implementation.

## 14. Explicit non-grants

This supplemental authorization does NOT authorize:

- persistent approvals;
- `allow-always`;
- approval caching;
- wildcard approval scopes;
- approval bypass of K2 `deny`;
- plugin authority;
- sandbox/confinement implementation;
- H5 pipeline hooks;
- provider or ToolRegistry mutation;
- Done Gate mutation;
- adding the H4-R1 evidence ledger before corrected pre-ledger certification;
- marking PR #52 Ready before the new pre-ledger and post-ledger gates pass;
- auto-merge;
- implementation merge before final expected-head governance.

## 15. PR state requirement

PR #52 MUST remain:

`OPEN / DRAFT / NOT MERGED`

through this supplemental authorization and subsequent correction until its complete certification sequence is satisfied again.

## 16. Decision

`H4_R1_APPLY_PATCH_ABORT_PROPAGATION_AUTHORIZED_FOR_FOUNDER_REVIEW`

Bounded meaning:

**The existing `repo.apply_patch` RuntimeTool may forward its existing cancellation signal into the already-authorized H4-R1 gateway approval wait, with an end-to-end regression proving cancellation during approval cannot later become a workspace mutation. No broader tool, policy, sandbox, or pipeline authority is granted.**
