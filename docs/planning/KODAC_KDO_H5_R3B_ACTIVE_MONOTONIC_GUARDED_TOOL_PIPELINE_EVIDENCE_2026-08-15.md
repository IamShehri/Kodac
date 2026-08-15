# KDO-H5-R3B — Active Monotonic Guarded Tool Pipeline — Evidence

Date: 2026-08-15

Status: POST-IMPLEMENTATION EVIDENCE LEDGER CREATED ONLY AFTER EXACT-HEAD PRE-LEDGER PASS

This document records the accepted pre-ledger evidence for the narrowly authorized KDO-H5-R3B slice. It is not itself proof of post-ledger acceptance. After this file is committed, all pre-ledger CI and review results below become historical evidence and the resulting head must pass a fresh post-ledger certification before merge.

## 1. Authority and predecessor chain

Canonical R3B authorization:

- path: `docs/planning/KODAC_KDO_H5_R3B_ACTIVE_MONOTONIC_GUARDED_TOOL_PIPELINE_AUTHORIZATION_2026-08-15.md`
- blob: `305b517f6ceec32e172e043d43fb54088cd14016`

Canonical R3A predecessor authorization:

- path: `docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_AUTHORIZATION_2026-08-15.md`
- blob: `39d4786f37a5a7dd71ab872314364bf15726d423`

Canonical R3A predecessor evidence:

- path: `docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_EVIDENCE_2026-08-15.md`
- blob: `1ef5fbcf31853727de1b0ef0eb738664d18ff066`

Canonical predecessor authorization base:

- commit: `f6b1a1686466c6e72dde0255c0daac5a5e902194`
- tree: `5e569b39cd043d767790f5ec90ffaf4f2578020d`
- predecessor claim: `KODAC_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_PROVEN`

The R3A reducer remains byte-identical at:

- `packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts`
- blob: `876656bf65a67df56c4cd5f078629cde06112af1`

## 2. Accepted pre-ledger identity

Accepted R3B pre-ledger candidate:

- commit: `647b4f1a3aa1b5d2ba6596ed697b1461e103fb5f`
- tree: `37bc688d170f8acadec0da396cf4b8e0c08701a2`
- canonical base: `b76da457eab307904841d1097ff5a1cbcab6eaa7`
- ahead: 17
- behind: 0

The evidence ledger path did not exist on the accepted pre-ledger candidate.

Exactly ten paths differed from canonical base, and every path was inside the R3B authorization allowlist.

## 3. Final accepted implementation and test blobs

Production:

| Path | Git blob |
|---|---|
| `packages/kodac-runtime/src/agent/guarded-tool-plan.ts` | `1ab6217e88c54cd8868e2bcf8d13fbb39e93d994` |
| `packages/kodac-runtime/src/agent/loop.ts` | `34caf203007b1eba6be83759a3b4e4c9886323b5` |
| `packages/kodac-runtime/src/model/turn.ts` | `9ae1298b3a4f917417efbe2228e0708bc813147d` |
| `packages/kodac-runtime/src/protocol/event.ts` | `d3446f6bc582b507170aec13de8fef5eb6587445` |

Tests and historical regression reconciliations:

| Path | Git blob |
|---|---|
| `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts` | `02e033a097cdea85d4bd1c7a14c5269495fde01f` |
| `packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts` | `c062fa671675462d1f7307af9664cdc25694bd55` |
| `packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts` | `242b526b7b181b93663ddb9059142d8e02b5f9a4` |
| `packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts` | `4b54571a65f0ceeb51a368d86d67e9649fcf8d1b` |
| `packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts` | `72d1acbcde889e8a130efcad4490185a57754e38` |
| `packages/kodac-runtime/test/model-turn.test.ts` | `3f49ed266661137bb0c68c3e99a2169ed2578e72` |

Historical tests were not deleted, skipped, bypassed, or weakened to simple new hashes. Obsolete byte pins were reconciled only where R3B necessarily evolved the corresponding active surface, while preserving the prior semantic property being protected.

## 4. R3B architecture proven by the accepted candidate

The active path is:

`ToolRegistry` → serialized static guard plan → monotonic provider-visible tool narrowing → H2 request snapshot → provider request → strict provider response normalization → whole-response guard preflight → canonical R3A reduction → optional block/rewrite/observe result → immutable trusted-host veto seam → existing loop protections → `RuntimeOrchestrator` → existing K2/policy/gateway authority → tool execution → structural guard observation → effective call returned to history/loop.

The R3B plan companion is deliberately non-authoritative:

- pure serialized-input boundary;
- no caller object callbacks;
- no filesystem authority;
- no subprocess authority;
- no network authority;
- no dynamic module discovery;
- no K2, policy, approval, confinement, receipt, session, Done Gate, plugin, or execution authority;
- all actual narrowing/block/rewrite reduction delegates to the unchanged canonical R3A reducer.

## 5. Provider-visible tool exposure

The accepted candidate proves:

- provider-visible tools are a subset of the registered tool set;
- filtering preserves the exact registry-derived provider descriptor including description and input schema;
- the H2 snapshot tool vector equals the exact provider request tool vector;
- stale `remove_tool` references fail before H2 snapshot and provider invocation;
- stale call-rule references fail before H2 snapshot and provider invocation;
- an empty effective provider tool surface is valid;
- no-plan behavior exposes the full registry-derived provider tool surface and emits no R3B guard events.

## 6. Plan parsing, bounds, and monotonicity

The accepted candidate proves strict serialized plan handling:

- primitive string boundary only;
- duplicate JSON keys rejected;
- exact plan/rule/decision schemas;
- duplicate `ruleId` rejected;
- duplicate `(toolName, capability)` rule pair rejected;
- limit+1 failures for plan bytes, tool decisions, call rules, rule decisions, and rule id bytes;
- total decision count bounded;
- each applicable call rule is preflighted through canonical R3A using the exact combined `toolDecisions + rule.decisions` vector;
- inherited R3A depth/item/input-byte/decision bounds therefore fail before provider use;
- plan failures emit only the canonical coarse `model.failed` plan-rejection evidence and do not durably leak raw plan content or validation reason.

## 7. Provider response and hostile-input boundary

Provider tool calls are normalized through the canonical H2 model-visible message validator before R3B reads them as executable calls.

The accepted proof matrix covers fail-before-authority handling for:

- accessor-bearing tool calls;
- cyclic tool-call input;
- a hostile Proxy shape;
- unsupported non-JSON input including bigint;
- unknown tool names.

These cases do not reach `beforeToolCall`, `RuntimeOrchestrator.invoke`, `tool.started`, K2, policy evaluation, or tool execution.

Unknown tools do not receive a fabricated `tool.guard.evaluated` record because no trusted registry-derived capability exists from which a valid R3A evaluation could be built.

## 8. Whole-response preflight and block semantics

The accepted candidate preflights every tool call in a provider response before executing the first tool in that response.

Therefore a later blocked call cannot hide or strand execution of an earlier call. The focused multi-call proof supplies an allowed first call and a blocked second call and verifies:

- both guard evaluations are available structurally;
- neither tool starts;
- neither trusted callback nor orchestrator execution occurs;
- the turn fails with the typed R3B guard-blocked error.

`blocked=false` is not permission. It only means R3B did not block the call. Existing K2/policy/gateway authority remains independently required downstream.

## 9. Rewrite identity and immutable trusted-host seam

For a provider-origin call that is rewritten:

- tool name remains unchanged;
- capability remains registry-derived and unchanged;
- input identity changes when canonical input changes;
- call identity changes when canonical input changes;
- R3A reports `requiresK2Reevaluation=true` as required;
- only the effective rewritten call is handed to the trusted-host `beforeToolCall` seam;
- the seam receives an immutable call;
- mutation attempts cannot alter execution;
- callback return values are ignored;
- throwing from the callback remains a monotonic veto.

Provider-original mutable call objects are never the execution object.

## 10. Fixed plan and R3A identity vectors

Fixed R3B plan identity:

`92670315e0f708da56c6ae8891b97b0722c87818a3456166345147cca9c2c7de`

The fixed plan removes `shell / process.exec` and contains `read-rule` for `repo.read / workspace.read`, rewriting `{a:1,b:2}` to `{a:1,b:3}`.

Canonical R3A fixed reduction vector retained under R3B:

- baseToolSetIdentity: `1c32e41e2b831e41178154430382dd762b14632e04dc82a3632448675d2fc387`
- effectiveToolSetIdentity: `10e9c56ba5e660174810439be5e84baa9ca3ccb02643156a5e06464f8b8161b9`
- originalInputIdentity: `cbd18981586dafc5646b3e572361980a7fe4d365a5d376e74f487cb195cac25d`
- originalCallIdentity: `ba75e0d2679be68a730d7cbff8e34adca0c009de867840045e3fa41696006362`
- finalInputIdentity: `0cf52fe22d060d50c1f68cf6ea1ea3d1d09783ef1b3af61a46aaba02f28f3ed6`
- finalCallIdentity: `bba2ad9517c0618091a1e239a141efbfcb9fa745442382b1c344778b6fc9011f`
- resultIdentity: `ac5f1b538ef8de99558d7ca1d0b31228d6b78e293978ad4a87e5a46bed90b09b`

These vectors continue to prove that R3B did not fork or silently redefine the R3A reduction contract.

## 11. Structural evidence contract

R3B adds only two structural event types:

- `tool.guard.evaluated`
- `tool.guard.execution_observed`

`tool.guard.evaluated` is deterministic, bounded, identity-oriented evidence. It does not persist raw provider input, rewritten input, tool output, receipt payload, approval payload, or policy payload.

Blocked evaluations likewise contain no raw call input/output/receipt.

`tool.guard.execution_observed` is emitted only after successful tool execution and carries only the authorized structural fields. The proof matrix verifies the exact allowed field set and verifies absence of raw input, raw output, receipt, and policy payload.

If tool execution fails, no successful post-execution guard observation is emitted.

## 12. Effective call propagation into loop and H2 history

The accepted candidate proves that the effective rewritten call, not stale provider-original arguments, feeds the surrounding active runtime:

- hard duplicate-call fingerprinting sees the effective rewritten input;
- H5-R2B repeat-call advisory detection sees the effective rewritten input;
- successful assistant/tool history carries the effective call that was actually executed;
- existing R2B advisory identity/semantics remain intact;
- no H5-R1 pruning integration is introduced by R3B.

## 13. Real ExecutionGateway / K2-adjacent authority proof

A cross-platform test uses the real `ExecutionGateway` with the canonical policy engine instead of a fake permission callback.

Provider-origin marker:

`ORIGINAL_K2_MARKER`

R3B rewritten marker:

`EFFECTIVE_K2_MARKER`

The runtime tool passes the effective marker into `ExecutionGateway.runCommand`, which creates a real intent and independently evaluates policy. The actual subprocess emits only the effective marker.

Observed trusted ordering:

1. trusted host hook sees `EFFECTIVE_K2_MARKER`;
2. runtime tool sees `EFFECTIVE_K2_MARKER`;
3. ExecutionGateway creates the execution intent;
4. ExecutionGateway policy evaluates independently;
5. subprocess output is `EFFECTIVE_K2_MARKER`.

The provider-original marker is absent from downstream observed execution state. This proves rewrite occurs before execution authority and that R3B `blocked=false` does not replace K2/policy authorization.

This proof is deliberately limited: it does not claim new confinement, approval, or K2 capabilities beyond those already proven by their own canonical slices.

## 14. Protected authority surfaces

The base-to-pre-ledger diff does not modify the following protected surfaces, whose canonical blobs remain pinned:

- `packages/kodac-runtime/src/index.ts` — `1c3eaf206b62d03751bcb646972f380d6a751be0`
- `packages/kodac-runtime/THIRD_PARTY_NOTICES.md` — `aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76`
- `packages/kodac-runtime/src/model/provider.ts` — `a15f1d86ceab88ab6fa1be787719d222e354e0c4`
- `packages/kodac-runtime/src/tools/registry.ts` — `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `packages/kodac-runtime/src/runtime/orchestrator.ts` — `b069da69909b282fdbdc2c62279e0297cbd430e9`
- `packages/kodac-runtime/src/session/session.ts` — `d5f2334b18e89f7bac2bac7422ed8a33669b8afd`
- `packages/kodac-runtime/src/session/model-visible-request.ts` — `0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6`
- `packages/kodac-runtime/src/session/model-visible-history.ts` — `06909401c6ddf2880154eb3d5fb1fe646d12d7fb`
- `packages/kodac-runtime/src/agent/repeat-call-signal.ts` — `1fd23cbc4dffd6be5ee77446d84bdea2ca27471f`
- `packages/kodac-runtime/src/agent/tool-result-pruning.ts` — `66cfee69032c4c24331e8cb9098a86a1d7b9135e`
- `packages/kodac-runtime/src/trust/policy.ts` — `b4134e430204123bebe053ffc9105f05fca611c9`
- `packages/kodac-runtime/src/trust/approval.ts` — `d36a604cb1957bc65dac3978c626ba48a9b299fb`
- `packages/kodac-runtime/src/execution/gateway.ts` — `ecf9cc9d3eda6a2280a280ed2f9a2e472f397560`
- `packages/kodac-runtime/src/verification/done-gate.ts` — `067e147569fa52cc2b04c5df26fbe20a01e958e9`
- `packages/kodac-runtime/package.json` — `af4c20a3dae387c15cc5fb2eb28d415c8f115b95`
- `packages/kodac-runtime/scripts/run-tests.mjs` — `9a0bcde0e565168c78eb7fe4d3cf08236d24baa7`

## 15. Fresh pre-ledger CI evidence

All evidence below is bound only to pre-ledger commit `647b4f1a3aa1b5d2ba6596ed697b1461e103fb5f` and tree `37bc688d170f8acadec0da396cf4b8e0c08701a2`.

Governance run `31857301338`:

- context-engine-provenance — job `94944398468` — PASS
- legacy-regression-boundary — job `94944398524` — PASS

K2 runtime run `31857301335`:

- runtime-change-classifier — job `94944398586` — PASS
- runtime macOS — job `94944416722` — Typecheck PASS / full tests PASS
- runtime Windows — job `94944416728` — Typecheck PASS / full tests PASS
- runtime Ubuntu — job `94944416764` — Typecheck PASS / full tests PASS
- aggregate `k2-runtime-gate` — job `94944529340` — PASS

K3 applicability was recomputed from exact changed paths and canonical workflow filters:

- K3-R4: `NOT_APPLICABLE_PATH_FILTER_PROVEN`
- K3-R5: `NOT_APPLICABLE_PATH_FILTER_PROVEN`

No unrelated trigger path was touched merely to force a workflow run.

## 16. Reviewer evidence

At accepted pre-ledger head:

- CodeRabbit: SUCCESS
- unresolved review threads: 0

Three valid reviewer findings were corrected before acceptance:

1. combined global + rule decisions could exceed canonical R3A max decisions;
2. rule `replace_input` values did not inherit R3A pre-provider bounds;
3. a multi-call response could execute an earlier call before a later blocked call was discovered.

Two suggestions were not adopted because they conflicted with the canonical authorization:

- fabricating a `tool.guard.evaluated` event for an unknown tool without a registry-derived capability;
- leaking raw validation reason into the durable coarse plan-rejection event.

## 17. Pre-ledger verdict

The exact candidate:

`647b4f1a3aa1b5d2ba6596ed697b1461e103fb5f`

with tree:

`37bc688d170f8acadec0da396cf4b8e0c08701a2`

satisfied the R3B pre-ledger gate.

Verdict:

`KDO_H5_R3B_PRE_LEDGER_PASS`

This verdict authorizes only creation of this evidence ledger. It does not authorize merge by itself.

## 18. Mandatory post-ledger rule

The commit that first adds this file must be treated as a new head.

The following pre-ledger evidence becomes historical immediately after this ledger commit:

- all CI conclusions;
- all review state;
- exact tree identity;
- exact changed-path count.

Before merge, the new head must independently satisfy:

- ledger-only delta from accepted pre-ledger head;
- governance/provenance PASS;
- legacy regression boundary PASS;
- runtime classifier PASS;
- Windows Typecheck + full tests PASS;
- macOS Typecheck + full tests PASS;
- Ubuntu Typecheck + full tests PASS;
- aggregate K2 runtime gate PASS;
- K3-R4/K3-R5 applicability recomputed on the new exact diff;
- CodeRabbit SUCCESS;
- zero unresolved review threads;
- manual proof that every non-ledger code/test blob remains identical to the accepted pre-ledger blobs above.

## 19. Narrow completion claim and non-claims

Only after fresh post-ledger certification and canonical merge may the following limited claim be made:

`KODAC_ACTIVE_MONOTONIC_GUARDED_TOOL_PIPELINE_PROVEN`

This claim must not be interpreted as any of the following:

- H5 complete;
- H6 authorized or ready;
- dynamic/workspace hook discovery;
- arbitrary executable hook modules;
- shell/command hook execution;
- plugin/user module execution;
- subagents or delegation;
- worktrees or background jobs;
- writable agent memory;
- H5-R1 pruning integration;
- a new K2 permission source;
- a new approval mechanism;
- new confinement capabilities;
- policy override;
- receipt mutation;
- Done Gate override;
- result/output rewrite;
- free-form guard feedback injected into H2 history.

The proven surface is intentionally narrow: a static serialized, monotonic, fail-closed guarded tool plan actively integrated into the existing turn/loop pipeline while preserving K2/policy/gateway authority and prior H2/R2B semantics.