# KDO-H2-R1 Legacy Test Reconciliation Supplemental Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE

## 1. Canonical identity

Repository: `TheHalfMoon/Kodac`

Canonical main / supplemental-authorization base:

`04cea3fef169411d267100fc510e7d5695bceb23`

Related implementation PR: `#45`

Related implementation head observed and audited:

`9b62f0c8bcb4e6027545ef69cbfabb5f5e48eed7`

Canonical H2-R1 authorization:

`docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_RECONSTRUCTION_AUTHORIZATION_2026-08-14.md`

This document supplements that authorization only for legacy-test reconciliation. It does not replace or broaden any production authority granted by the canonical H2-R1 authorization.

## 2. Purpose

Authorize the minimum test-only reconciliation needed for PR #45 after exact-head CI showed that three pre-H2 legacy test files encode assumptions that directly conflict with the already-authorized H2-R1 semantics.

The canonical H2-R1 invariant remains:

`logged canonical request snapshot == model/messages/tools passed to ModelProvider.generate()`

The model-visible request snapshot must be durable, lossless for the authorized model-visible boundary, appended before provider execution, and usable to reconstruct the exact provider-boundary `model/messages/tools` request.

## 3. Exact-head CI evidence

Exact implementation head reviewed:

`9b62f0c8bcb4e6027545ef69cbfabb5f5e48eed7`

GitHub Actions K2 runtime run:

`31756523782`

Ubuntu runtime job:

`94633350466`

The exact-head runtime suite reported:

- tests: `354`
- pass: `347`
- fail: `6`
- skipped: `1`

The six observed failures were:

1. `packages/kodac-runtime/test/ask-cli.test.ts`
   - `kodac ask runs through the fixture provider and persists model events`
2. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
   - `serialized validation rejects unknown fields tampering and explicit undefined`
3. `packages/kodac-runtime/test/model-capabilities.test.ts`
   - `existing canonical model provider and transports remain byte-identical`
4. `packages/kodac-runtime/test/model-turn.test.ts`
   - `runs a deterministic model turn and records model evidence without raw content`
5. `packages/kodac-runtime/test/model-turn.test.ts`
   - `routes provider tool calls through the canonical RuntimeOrchestrator`
6. `packages/kodac-runtime/test/model-turn.test.ts`
   - `provider failures are recorded and propagated`

The H2-R1 focused `explicit undefined` failure remains within the original H2-R1 allowlist and does not require this supplemental authorization. This document exists only because the other five failures require edits to three legacy test files outside the original seven-path implementation allowlist.

## 4. Contradiction analysis

### 4.1 `ask-cli.test.ts`

The pre-H2 success-path test asserts that the model-visible user prompt is absent from durable model events.

That expectation is no longer valid for a successfully dispatched H2-R1 request. H2-R1 explicitly requires the exact model-visible request boundary to be durably reconstructable before provider execution. The successful request's model-visible user content therefore belongs inside the required `model.request.snapshot` evidence.

The failure-path privacy invariant remains unchanged: if provider selection fails before an H2-R1 request snapshot is constructed and appended, the undispatched private prompt must not appear in durable model-request evidence.

### 4.2 `model-capabilities.test.ts`

The pre-H2 test pins `packages/kodac-runtime/src/model/turn.ts` to the old blob:

`628334fb4edb7b3e4bcfcb090b8e709835096b3b`

That assertion directly conflicts with the canonical H2-R1 authorization, which explicitly includes `packages/kodac-runtime/src/model/turn.ts` in its production implementation allowlist and requires it to construct, append, materialize, and dispatch from the canonical H2-R1 request snapshot.

The provider abstraction and provider transports remain protected and must continue to be byte-identical to their authorized baseline unless separately authorized.

### 4.3 `model-turn.test.ts`

The pre-H2 tests expect event sequences that omit `model.request.snapshot` and assert that the model-visible prompt is absent from event evidence.

Those assumptions are obsolete under H2-R1. The tests must instead distinguish:

- the lossless, bounded, durable model-visible request snapshot;
- coarse/digest-only response and lifecycle evidence;
- host-only signals, callbacks, credentials, transport headers, and other excluded state that must remain outside the snapshot.

## 5. Supplemental implementation allowlist

After this supplemental authorization becomes canonical, PR #45 may additionally modify exactly these three paths:

1. `packages/kodac-runtime/test/ask-cli.test.ts`
2. `packages/kodac-runtime/test/model-capabilities.test.ts`
3. `packages/kodac-runtime/test/model-turn.test.ts`

No other additional implementation path is authorized.

The original seven-path H2-R1 allowlist remains otherwise unchanged:

1. `schema/kdo-model-visible-request.schema.json`
2. `packages/kodac-runtime/src/session/model-visible-request.ts`
3. `packages/kodac-runtime/src/protocol/event.ts`
4. `packages/kodac-runtime/src/model/turn.ts`
5. `packages/kodac-runtime/src/index.ts`
6. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
7. `docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_EVIDENCE_2026-08-14.md`

This supplemental authorization does not itself modify any implementation or test file.

## 6. Required reconciliation semantics

### 6.1 `ask-cli.test.ts`

The reconciled tests must prove:

- successful `kodac ask` persists `model.request.snapshot`;
- the exact model-visible user request is durable and reconstructable from that snapshot;
- `model.requested`, `model.responded`, and `assistant.message` remain present as applicable;
- the snapshot boundary does not imply that response/assistant coarse evidence becomes lossless;
- provider-selection failure before request-snapshot construction does not persist the undispatched private prompt as model-request evidence.

### 6.2 `model-capabilities.test.ts`

The reconciled test must prove:

- `packages/kodac-runtime/src/model/provider.ts` remains byte-identical to its authorized baseline;
- `packages/kodac-runtime/src/model/openai.ts` remains byte-identical to its authorized baseline;
- `packages/kodac-runtime/src/model/openai-compatible.ts` remains byte-identical to its authorized baseline;
- the obsolete pre-H2 `model/turn.ts` blob pin is removed;
- permitted `model/turn.ts` drift remains bounded by the original H2-R1 focused tests and authorization.

### 6.3 `model-turn.test.ts`

The reconciled tests must prove:

- `model.request.snapshot` is appended before `model.requested` and before provider execution;
- successful request evidence contains the exact authorized model-visible request content;
- response and assistant coarse evidence do not gain raw assistant content unless separately authorized;
- tool-call execution ordering remains canonical;
- provider-failure ordering includes `model.request.snapshot` before `model.requested` / `model.failed` when provider execution was reached;
- existing `RuntimeOrchestrator` behavior remains unchanged.

## 7. Non-grants

This supplemental authorization does NOT authorize:

- production behavior changes outside the original H2-R1 implementation allowlist;
- weakening, making optional, omitting, digesting, or truncating the required `model.request.snapshot` instead of preserving the authorized lossless model-visible boundary;
- changing `packages/kodac-runtime/src/agent/loop.ts`;
- provider transport changes;
- `ModelProvider` transport/client authority changes;
- credential, API-key, authorization-header, environment-variable, or secret persistence;
- raw HTTP/wire-request reconstruction;
- replaying provider network calls;
- replaying tool side effects;
- `ToolRegistry` or `ProviderRegistry` authority changes;
- K2, policy, `ExecutionGateway`, receipt, approval, sandbox, or plugin-execution changes;
- verification or Done Gate changes;
- subagent, job, LSP, terminal, or workflow implementation;
- evidence-ledger creation before the corrected pre-ledger candidate is exact-head green;
- marking PR #45 Ready for review before its required pre-ledger CI and review gates pass;
- merge authority for PR #45 or this authorization PR;
- `FULL_SESSION_EVENT_SOURCED`;
- `RAW_PROVIDER_WIRE_RECONSTRUCTABLE`;
- `H2_COMPLETE` while H2-R2 remains outstanding;
- unrelated `PROVEN_READY` authority.

## 8. PR #45 state requirement

PR #45 must remain Draft while reconciliation is in progress.

The evidence ledger path:

`docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_EVIDENCE_2026-08-14.md`

must remain absent until a corrected pre-ledger exact head passes the required runtime matrix, focused H2-R1 tests, governance/K3/K2 gates, and exact-head review adjudication.

## 9. Required certification after reconciliation

After this supplemental authorization is canonical and the three legacy tests are reconciled in PR #45:

1. re-run the full runtime suite on the exact new PR #45 head;
2. require TypeScript typecheck PASS;
3. require the complete K2 runtime matrix PASS on Ubuntu, macOS, and Windows;
4. require the patch benchmark hook PASS where applicable;
5. require governance PASS;
6. require K3-R4 and K3-R5 exact-head integration gates PASS;
7. require all H2-R1 focused tests PASS;
8. require changed paths to remain within the combined original plus supplemental allowlist;
9. require unresolved review threads zero after exact-head re-review;
10. only then may the H2-R1 evidence ledger be added as the final authorized implementation path;
11. adding the evidence ledger creates a new exact head that must itself be re-certified before PR #45 can be marked Ready for review.

No merge is authorized by this document.

## 10. Authorization-PR gate

This supplemental authorization PR must:

- contain exactly one changed documentation path:
  `docs/planning/KODAC_KDO_H2_R1_LEGACY_TEST_RECONCILIATION_AUTHORIZATION_2026-08-14.md`;
- remain Draft for founder review;
- pass required governance checks;
- have zero unresolved review threads before any founder merge decision;
- remain based on canonical main `04cea3fef169411d267100fc510e7d5695bceb23` unless a new founder authorization explicitly rebases the decision;
- never merge automatically.

## 11. Decision

`AUTHORIZED_SCOPE_CANDIDATE — KDO-H2-R1 LEGACY TEST RECONCILIATION ONLY`
