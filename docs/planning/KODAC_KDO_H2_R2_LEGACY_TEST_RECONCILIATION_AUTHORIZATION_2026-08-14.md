# KDO-H2-R2 Legacy Test Reconciliation Supplemental Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE

## 1. Canonical identity

Repository: `TheHalfMoon/Kodac`

Canonical main / supplemental-authorization base:

`cc2044d15b03f0ca772afe228851bb887e66559f`

Canonical H2-R2 authorization:

`docs/planning/KODAC_KDO_H2_R2_EVENT_DERIVED_MODEL_HISTORY_AUTHORIZATION_2026-08-14.md`

Related implementation PR: `#49`

Exact corrected pre-ledger implementation head observed and audited:

`576a098026efa0f11ef3d2694e08b0d4dea81799`

PR #49 remains Draft and its H2-R2 evidence ledger remains absent.

This document supplements H2-R2 only for two legacy-test contracts that cannot remain valid after the canonically authorized agent-loop authority transition. It does not broaden production authority.

## 2. Exact-head runtime evidence

Exact-head K3-R4 runtime integration job:

- workflow run: `31763269089`
- job: `94653870945`
- head: `576a098026efa0f11ef3d2694e08b0d4dea81799`

Full runtime suite result:

- tests: `374`
- pass: `372`
- fail: `2`
- skipped: `0`

All H2-R2 focused tests passed.

The earlier provider-qualification integration failures were corrected inside the original H2-R2 production allowlist by scoping each `BoundedAgentLoop.run()` to its own contiguous projection window within the same canonical `RuntimeSession` journal. Both provider-qualification tests now pass, including the non-read-only-tool fail-closed case.

The only remaining exact-head failures are:

1. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
   - `H2-R1 contract has no execution transport or secret authority and protected surfaces stay unchanged`
   - actual `packages/kodac-runtime/src/agent/loop.ts` blob at the candidate: `1a876dc0a1b87fa22c4af7a13ff3f281560ed6fc`
   - obsolete expected pre-H2-R2 blob: `fe92ffdc9cc057d620a8f2de2296e14eec43a1e0`

2. `packages/kodac-runtime/test/openai-compatible-provider.test.ts`
   - `bounded agent loop preserves assistant tool calls before tool results for provider continuity`
   - failure: `TypeError: this.session.eventsSnapshot is not a function`
   - the legacy test supplies a fake session exposing only `emit()` and a fake turn runner that does not emit the canonical H2-R1 request snapshot / H2-R2 history evidence.

## 3. Why these failures are legacy-contract conflicts

### 3.1 H2-R1 protected-surface pin

H2-R1 intentionally protected `packages/kodac-runtime/src/agent/loop.ts` because H2-R1 did not authorize moving the loop's working model history onto the canonical event spine.

H2-R2 now explicitly and canonically authorizes `packages/kodac-runtime/src/agent/loop.ts` modification to establish:

`next-turn model-visible messages == projection(canonical H2 session evidence)`

Therefore the H2-R1 test's old byte pin on `agent/loop.ts` is no longer a valid cross-phase protection rule.

The remainder of the H2-R1 protected-surface test remains valid and MUST remain intact, including its assertions for:

- `packages/kodac-runtime/src/tools/registry.ts`;
- `packages/kodac-runtime/src/model/openai.ts`;
- `packages/kodac-runtime/src/model/openai-compatible.ts`;
- `packages/kodac-runtime/src/execution/gateway.ts`;
- `packages/kodac-runtime/src/verification/done-gate.ts`;
- the H2-R1 model-visible-request contract's lack of ambient execution, transport, credential, or secret authority.

The H2-R2 focused suite owns the permitted `agent/loop.ts` drift boundary and separately pins all H2-R2 protected authority surfaces.

### 3.2 Fake-session agent-loop continuity test

The OpenAI-compatible provider test predates H2-R2 and proves loop continuity by constructing:

- a fake `AgentTurnRunner` that directly returns scripted results; and
- a fake `RuntimeSession` that implements only `emit()`.

That harness deliberately bypasses the two canonical evidence mechanisms H2-R2 is required to make authoritative:

- H2-R1 `model.request.snapshot` anchors;
- H2-R2 `model.history.message.appended` records projected from a successfully appended RuntimeSession journal.

Production code MUST NOT add a fallback that silently reconstructs history in private memory merely to preserve this obsolete test harness. Such a fallback would recreate the exact parallel-authority defect H2-R2 exists to remove.

The test should instead exercise the same assistant-tool-call-before-tool-result continuity through a canonical R2-capable runtime harness.

## 4. Supplemental implementation allowlist

After this supplemental authorization becomes canonical, PR #49 may additionally modify exactly these two test paths:

1. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
2. `packages/kodac-runtime/test/openai-compatible-provider.test.ts`

No other additional path is authorized.

The original nine-path H2-R2 allowlist remains otherwise unchanged.

Pre-ledger, the combined authorized changed-path ceiling becomes exactly ten implementation/test paths:

- the first eight original H2-R2 implementation/test paths; plus
- these two legacy test paths.

The H2-R2 evidence ledger remains the eleventh and final combined authorized path and MUST remain absent until the corrected pre-ledger candidate is exact-head green and review-adjudicated.

## 5. Required reconciliation semantics

### 5.1 `kdo-h2-r1-model-visible-request.test.ts`

The reconciliation must:

- remove only the obsolete pre-H2-R2 byte pin for `packages/kodac-runtime/src/agent/loop.ts` from the H2-R1 protected-surface assertion;
- preserve all other H2-R1 protected-surface byte pins;
- preserve the assertion that the H2-R1 request contract itself has no ambient execution, network, process, credential, or secret authority;
- leave every H2-R1 request reconstruction, validation, byte-bound, ordering, immutability, `__proto__`, depth, and provider-boundary equivalence test semantically unchanged;
- rely on the H2-R2 focused suite for the newly authorized `agent/loop.ts` authority boundary.

### 5.2 `openai-compatible-provider.test.ts`

Only the bounded-agent-loop provider-continuity test may be reconciled for H2-R2.

The reconciled test must:

- stop using a fake session that lacks the canonical event journal;
- stop using a fake turn runner that bypasses H2-R1/H2-R2 evidence production;
- use a canonical `RuntimeSession` with an appropriate in-memory sink;
- route model turns through a canonical `AgentTurnRunner` or an equivalently faithful harness that actually emits H2-R1 request snapshots and H2-R2 history records;
- keep the OpenAI-compatible provider adapter itself unchanged;
- prove that the second provider request preserves the assistant message and its ordered tool calls before the corresponding role=`tool` result;
- prove that provider continuity is compatible with the H2-R2 projected history rather than with a private mutable message array;
- preserve all unrelated OpenAI-compatible provider tests and expectations.

No production compatibility fallback for fake sessions or fake evidence-free runners is authorized.

## 6. Non-grants

This supplemental authorization does NOT authorize:

- any production path beyond the original H2-R2 production allowlist;
- `packages/kodac-runtime/src/model/turn.ts` changes;
- `packages/kodac-runtime/src/provider-qualification.ts` changes;
- provider transport changes;
- weakening or bypassing `RuntimeSession.eventsSnapshot()` as the live R2 journal surface;
- reconstructing anchored history from a private fallback array when evidence is missing;
- making H2-R1 request snapshots optional;
- making H2-R2 history append events optional;
- provider network replay;
- tool side-effect replay;
- raw unbounded tool-output persistence;
- ToolRegistry, RuntimeOrchestrator, K2, policy, ExecutionGateway, approval, sandbox, receipt, or Done Gate changes;
- JSONL/process-restart resume;
- issue #47 storage-policy work;
- adding the H2-R2 evidence ledger before the corrected pre-ledger candidate is green;
- marking PR #49 Ready before the ledger-bearing head is re-certified;
- merge authority for PR #49.

## 7. Required post-reconciliation proofs

After these two legacy tests are reconciled, PR #49 must re-run on one exact pre-ledger head and prove:

1. cumulative changed paths are exactly the ten combined authorized pre-ledger paths;
2. the H2-R2 evidence ledger is absent;
3. TypeScript typecheck PASS;
4. full runtime tests PASS;
5. H2-R1 focused tests PASS without semantic weakening;
6. H2-R2 focused tests PASS;
7. provider qualification tests PASS;
8. OpenAI-compatible provider tests PASS;
9. agent-loop regressions PASS;
10. governance `provenance` PASS;
11. governance `legacy-tests` PASS;
12. K3-R4 PASS;
13. K3-R5 PASS;
14. Ubuntu/macOS/Windows K2 runtime PASS;
15. patch benchmark PASS where applicable;
16. `k2-runtime-gate` PASS;
17. all H2-R2 protected production blobs remain byte-identical;
18. exact-head review findings are adjudicated;
19. unresolved review threads are zero.

Only then may the H2-R2 evidence ledger be added as the eleventh combined authorized path. The ledger-bearing head must then be fully re-certified before Ready/merge.

## 8. Authorization PR gate

This supplemental authorization PR must:

- branch exactly from canonical main `cc2044d15b03f0ca772afe228851bb887e66559f`;
- change exactly one documentation path:
  `docs/planning/KODAC_KDO_H2_R2_LEGACY_TEST_RECONCILIATION_AUTHORIZATION_2026-08-14.md`;
- remain Draft until governance and review gates pass;
- pass required `provenance`, `legacy-tests`, and `k2-runtime-gate` requirements;
- have zero unresolved review threads;
- never auto-merge;
- merge only with an expected-head guard after the founder continuation decision.

## 9. Decision

`AUTHORIZED_SCOPE_CANDIDATE — KDO-H2-R2 TWO-TEST LEGACY RECONCILIATION ONLY`
