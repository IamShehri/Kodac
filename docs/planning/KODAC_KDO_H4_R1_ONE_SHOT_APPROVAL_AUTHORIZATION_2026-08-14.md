# KDO-H4-R1 One-Shot Approval Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Canonical identity

Repository: `TheHalfMoon/Kodac`

Canonical main / authorization base:

`902b31d2c7eb2ae918541711b19435fa6b778c48`

Canonical tree at authorization creation:

`70fca2cb85b95931e9c0f6a056303a2b7d872e43`

This base contains the completed H2-R1 and H2-R2 model-visible reconstructability program.

H2-R1 completion claim:

`KODAC_PROVIDER_BOUNDARY_REQUEST_RECONSTRUCTABLE`

H2-R2 completion claim:

`KODAC_MODEL_VISIBLE_SESSION_HISTORY_EVENT_DERIVED`

H4-R1 does not modify either H2 invariant.

## 2. Source decision

Canonical H3 differential audit:

`docs/planning/KODAC_KDO_H3_DEEPSEEK_HARNESS_RUNTIME_DIFFERENTIAL_AUDIT_2026-08-14.md`

H3 sequencing decision:

`H2 -> H4 approval + sandbox contract plane -> H5 guarded tool pipeline -> H6 -> H7`

H4 is split deliberately:

- **H4-R1 — one-shot approval contract and K2 integration**;
- **H4-R2 — provider-neutral sandbox/confinement contract and evidence plane**.

H4-R1 MUST NOT implement sandbox policy or confinement backends. H4-R2 requires separate authorization after H4-R1 is canonical.

## 3. Donor reference

Donor:

`deepseek-ai/deepseek-harness`

Pinned donor commit:

`47f943859bef60e4160492346772ded9b24f765a`

Primary approval reference admitted by H3:

`packages/interaction/user-approval/README.md`

Pinned blob:

`0cf5d458863194e29f8c84168a6f089baabbf3d2`

Donor use is design/reference only. No donor runtime closure, plugin authority, or same-process replacement model is authorized.

## 4. Current Kodac truth

Canonical K2 policy vocabulary is:

`allow | ask | deny`

At this base, `ExecutionGateway` evaluates one `ExecutionIntent` and executes only when policy returns `allow`.

Current `ask` behavior is fail-closed:

- a blocked execution receipt is created;
- no mutation/command execution occurs;
- `ExecutionBlockedError` is raised with an approval-required message.

This current behavior is correct and MUST remain the fallback whenever no H4-R1 approval service is explicitly configured or approval cannot be proven.

K2 remains the sole trusted side-effect execution authority.

## 5. H4-R1 target

H4-R1 establishes:

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of the exact bound intent`

It MUST NOT establish:

`approval -> bypass K2`

or:

`approval -> persistent capability grant`

or:

`approval -> sandbox proof`

The approval decision is subordinate to K2 policy and bound to exactly one proposed `ExecutionIntent`.

## 6. Exact intent binding

An approval request MUST bind the exact canonical proposed action using at least:

- capability;
- canonical ordered/deduplicated paths exactly as presented to K2;
- `inputDigest`;
- deterministic approval-request identity derived from the canonical intent fields;
- fixed approval contract version.

The approval service MUST NOT receive an unbound free-form grant request that can later authorize a different capability/path/input digest.

Any mismatch between the approved request identity and the execution intent MUST fail closed before side effects.

## 7. Closed one-shot outcomes

H4-R1 approval outcomes are exactly:

- `allowed-once`
- `rejected`
- `cancelled`
- `unavailable`

No `allow-always`, persistent grant, wildcard grant, directory-wide durable permission, capability family grant, or remembered approval is authorized.

`allowed-once` authorizes at most one execution attempt for the exact request identity within the current gateway invocation.

The approval result is consumed by that invocation. It cannot be replayed as authority for a later execution call.

## 8. Policy composition invariant

Policy composition MUST be:

1. construct exact `ExecutionIntent`;
2. persist/observe the intent through existing K2 evidence hooks;
3. evaluate K2 policy;
4. if `deny`: block immediately; approval service MUST NOT be asked;
5. if `allow`: execute through existing K2 path; approval service MUST NOT be required;
6. if `ask`: invoke H4-R1 approval flow;
7. only `allowed-once` for the exact bound request may convert this one invocation from blocked to executable;
8. all other approval outcomes fail closed;
9. execute only through existing `ExecutionGateway` execution body;
10. persist the normal K2 execution receipt as today.

Approval cannot convert `deny` to executable.

Approval cannot widen capability, paths, input digest, environment, executable, arguments, patch content, or any other action input beyond the already-evaluated exact intent.

## 9. Approval evidence rule

H4-R1 MUST provide explicit approval evidence with two phases:

- `asked`
- `decided`

The evidence model MUST bind:

- approval request identity;
- exact intent identity/fields;
- phase;
- outcome for decided evidence;
- fixed version;
- deterministic/canonical structural identity where appropriate.

The implementation MAY use a dedicated approval evidence sink/observer contract, but it MUST NOT make an in-memory callback invocation equivalent to durable proof.

The core fail-closed rule is:

`approval evidence persistence failure -> no execution`

Specifically:

- failure to persist `asked` evidence prevents asking/using approval and prevents execution;
- failure to obtain an answer produces `unavailable`/blocked semantics;
- failure to persist `decided` evidence prevents an `allowed-once` answer from enabling execution;
- execution MUST NOT start until the decided approval evidence for `allowed-once` is successfully persisted.

The approval evidence channel MUST NOT swallow persistence failures.

## 10. K2 receipt relationship

Existing `ExecutionReceipt` remains the execution outcome authority for K2.

H4-R1 MAY extend execution receipt evidence only as narrowly required to bind a successful/blocked execution to an approval request/decision identity.

It MUST NOT:

- replace receipts with approval records;
- mark an approval as execution success;
- weaken `ExecutionUnprovenError` semantics;
- allow side-effect success without persistable K2 execution evidence.

Approval evidence proves authorization decision history; K2 receipts prove execution outcome history. They are distinct.

## 11. Missing service behavior

No approval service configured:

`ask -> blocked`

Approval service throws/fails:

`ask -> unavailable -> blocked`

Approval service returns malformed/unknown outcome:

`ask -> blocked`

Approval service returns a decision for another request identity:

`ask -> blocked`

Approval evidence sink missing when approval would be required:

`ask -> blocked`

There is no permissive fallback.

## 12. Cancellation and abort behavior

H4-R1 must support cancellation/abort propagation for the one-shot approval request without turning cancellation into approval.

Aborted approval:

`cancelled -> blocked`

An already-aborted signal MUST prevent execution.

Approval wait MUST NOT silently detach into a background grant that can later be consumed by another execution.

## 13. Concurrency and replay rule

One `allowed-once` answer is bound to one gateway invocation and one request identity.

Concurrent executions with structurally identical intents MUST each require their own one-shot approval request/decision unless K2 policy independently returns `allow`.

A recorded prior `allowed-once` decision MUST NOT be accepted as authority merely because a later intent hashes to the same structural identity.

H4-R1 is not a durable permission cache.

## 14. Authorized implementation paths

After this authorization is canonical, H4-R1 implementation may modify exactly these paths:

1. `packages/kodac-runtime/src/trust/approval.ts`
2. `packages/kodac-runtime/src/execution/gateway.ts`
3. `packages/kodac-runtime/src/evidence/receipt.ts`
4. `packages/kodac-runtime/src/index.ts`
5. `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`
6. `packages/kodac-runtime/test/gateway.test.ts`
7. `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md`

The evidence ledger path is authorized but MUST remain absent until a pre-ledger implementation candidate passes the required exact-head gates and review adjudication.

Any path outside this list requires new founder authorization.

## 15. Protected paths / non-authority surfaces

H4-R1 MUST NOT modify:

- `packages/kodac-runtime/src/trust/policy.ts` — current K2 `allow|ask|deny` semantics remain canonical;
- `packages/kodac-runtime/src/model/turn.ts`;
- `packages/kodac-runtime/src/model/provider.ts`;
- `packages/kodac-runtime/src/model/openai.ts`;
- `packages/kodac-runtime/src/model/openai-compatible.ts`;
- `packages/kodac-runtime/src/agent/loop.ts`;
- `packages/kodac-runtime/src/session/session.ts`;
- `packages/kodac-runtime/src/session/model-visible-request.ts`;
- `packages/kodac-runtime/src/session/model-visible-history.ts`;
- `packages/kodac-runtime/src/tools/registry.ts`;
- `packages/kodac-runtime/src/runtime/orchestrator.ts`;
- `packages/kodac-runtime/src/verification/done-gate.ts`.

H4-R1 MUST preserve H2 request/history reconstructability byte/behavior boundaries unless a later separate authorization explicitly changes them.

## 16. Explicit non-grants

H4-R1 does NOT authorize:

- sandbox modes or confinement enforcement;
- operating-system sandbox backends;
- Docker/container/namespace/seccomp/AppContainer/Sandbox-exec integration;
- treating a sandbox label as proof of confinement;
- persistent approval grants;
- `allow-always`;
- approval caches;
- wildcard capability grants;
- policy bypass;
- converting K2 `deny` through approval;
- changing `workspaceAgentPolicy` or other policy engines;
- generic hook/interceptor pipelines;
- H5 pre/guard/around/post tool pipeline;
- tool registry/provider registry authority changes;
- provider network replay;
- tool side-effect replay;
- subagents/background jobs;
- PTY/LSP/workflow runtime;
- evidence-store retention/permissions/expiry from issue #47;
- Done Gate or `PROVEN_READY` authority changes;
- plugin execution authority.

## 17. Focused test requirements

H4-R1 focused tests MUST prove at least:

1. `allow` policy executes without consulting approval;
2. `deny` policy blocks without consulting approval;
3. `ask` without approval service remains blocked;
4. `ask` with `rejected` remains blocked;
5. `ask` with `cancelled` remains blocked;
6. `ask` with `unavailable` remains blocked;
7. approval service failure remains blocked;
8. malformed approval answer remains blocked;
9. mismatched request identity remains blocked;
10. `allowed-once` permits exactly one execution attempt of the exact bound intent;
11. prior `allowed-once` cannot authorize a later invocation;
12. concurrent identical asks are separate one-shot decisions;
13. `asked` evidence is persisted before decision use;
14. `decided(allowed-once)` evidence is persisted before side effect begins;
15. asked-evidence persistence failure prevents approval/execution;
16. decided-evidence persistence failure prevents execution;
17. existing K2 receipt persistence failure still yields `ExecutionUnprovenError` semantics;
18. execution success still produces normal K2 success receipt;
19. approval decision is not execution-success evidence;
20. protected policy/Done Gate/provider/H2 surfaces remain unchanged.

## 18. Legacy gateway test reconciliation

`packages/kodac-runtime/test/gateway.test.ts` is authorized because its current `ask policy requires approval and does not mutate` expectation describes the pre-H4 default behavior.

That test MUST continue proving that default/no-service `ask` is blocked.

Any additional assertions may only prove H4-R1 one-shot approval integration; they MUST NOT weaken the existing fail-closed default.

## 19. Pre-ledger certification gate

Before the H4-R1 evidence ledger may be added, the exact implementation head must satisfy:

- changed paths only from the authorized non-ledger list;
- TypeScript typecheck PASS;
- complete runtime test suite PASS;
- Ubuntu runtime PASS;
- macOS runtime PASS;
- Windows runtime PASS;
- patch benchmark PASS where applicable;
- governance PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- K2 runtime gate PASS;
- focused H4-R1 tests PASS;
- exact-head review adjudication complete;
- unresolved review threads = 0.

Only then may:

`docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md`

be added.

## 20. Post-ledger gate

Adding the evidence ledger creates a new exact head.

That ledger-bearing head MUST independently pass the required governance/runtime/K3/K2 status checks and unresolved review thread resolution before PR Ready/merge decision.

The ledger must not self-certify its containing commit.

## 21. H4-R1 completion claim

The only bounded completion claim authorized by this slice is:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

This claim means:

- K2 `ask` can be resolved by an explicit one-shot service;
- the answer is bound to one exact intent;
- evidence is fail-closed and persisted before execution proceeds;
- no durable grant is created;
- K2 remains the execution authority.

It does NOT mean:

- H4 complete;
- sandbox ready;
- confinement proven;
- H5 ready;
- autonomous execution globally approved;
- `PROVEN_READY`.

H4 is complete only after a separately authorized H4-R2 sandbox contract/evidence slice is canonical.

## 22. Authorization PR gate

This authorization PR must:

- contain exactly one changed documentation path:
  `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_AUTHORIZATION_2026-08-14.md`;
- be based on exact canonical main `902b31d2c7eb2ae918541711b19435fa6b778c48` at creation;
- remain docs-only;
- pass governance required checks;
- have zero unresolved review threads before merge decision;
- use expected-head merge;
- never auto-merge.

## 23. Decision

`AUTHORIZED_SCOPE_CANDIDATE — KDO-H4-R1 ONE-SHOT APPROVAL ONLY`
