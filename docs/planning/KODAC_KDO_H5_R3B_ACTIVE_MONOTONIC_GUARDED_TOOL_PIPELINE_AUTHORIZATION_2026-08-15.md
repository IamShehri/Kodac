# KDO-H5-R3B — Active Monotonic Guarded Tool Pipeline Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R3B

NAME:
ACTIVE MONOTONIC GUARDED TOOL PIPELINE

CANONICAL AUTHORIZATION BASE:
f6b1a1686466c6e72dde0255c0daac5a5e902194

CANONICAL AUTHORIZATION BASE TREE:
5e569b39cd043d767790f5ec90ffaf4f2578020d

CANONICAL PREDECESSOR CLAIM:
KODAC_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_PROVEN

AUTHORIZED ACTIVE CHANGE IF THIS DOCUMENT BECOMES CANONICAL:
WIRE THE PROVEN R3A MONOTONIC REDUCER INTO MODEL-VISIBLE TOOL EXPOSURE AND PRE-EXECUTION TOOL-CALL FLOW USING A STATIC SERIALIZED DECLARATIVE PLAN

ARBITRARY WORKSPACE/PLUGIN CALLBACK DISCOVERY:
NOT AUTHORIZED

SHELL/COMMAND HOOKS:
NOT AUTHORIZED

K2 POLICY / APPROVAL / CONFINEMENT OVERRIDE:
NOT AUTHORIZED

POST-TOOL OUTPUT / RECEIPT REWRITE:
NOT AUTHORIZED
```

R3B turns the proven R3A algebra into an active but bounded trusted-host pipeline.

The target invariant is:

```text
REGISTERED TOOL SURFACE
  -> STATIC SERIALIZED NARROWING PLAN
  -> MODEL-VISIBLE EFFECTIVE TOOL SUBSET
  -> H2 SNAPSHOT OF EXACT PROVIDER TOOL SURFACE

PROVIDER TOOL CALL
  -> STRICT DEFENSIVE CALL NORMALIZATION
  -> R3A MONOTONIC REDUCTION
  -> OPTIONAL SAME-TOOL INPUT REWRITE
  -> NEW EFFECTIVE CALL IDENTITY
  -> IMMUTABLE TRUSTED-HOST VETO/OBSERVATION SEAM
  -> EXISTING RUNTIME ORCHESTRATOR / TOOL / K2 PATH

NO PRE-REWRITE AUTHORITY DECISION MAY AUTHORIZE POST-REWRITE BYTES.
```

---

## 2. Canonical predecessor

H5-R3A is canonical at:

```text
main:
f6b1a1686466c6e72dde0255c0daac5a5e902194

tree:
5e569b39cd043d767790f5ec90ffaf4f2578020d

claim:
KODAC_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_PROVEN

R3A authorization:
docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_AUTHORIZATION_2026-08-15.md
blob 39d4786f37a5a7dd71ab872314364bf15726d423

R3A evidence:
docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_EVIDENCE_2026-08-15.md
blob 1ef5fbcf31853727de1b0ef0eb738664d18ff066

R3A production primitive:
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
blob 876656bf65a67df56c4cd5f078629cde06112af1
```

R3B may add plan-validation semantics to the R3A module, but must not change any already-proven R3A version, reducer semantics, bounds, domain separators, or fixed identity vectors.

---

## 3. Existing mutation-authority defect to close

Current canonical `AgentTurnRunner` exposes:

```text
AgentTurnHooks.beforeToolCall(call: ModelToolCall)
```

and then executes:

```text
hooks.beforeToolCall(call)
orchestrator.invoke(call.name, call.input)
```

using the same mutable provider-origin object.

Canonical source:

```text
packages/kodac-runtime/src/model/turn.ts
blob 401d796b929d350046128371fee4ba719d0d56c9
```

Therefore an in-process callback could currently mutate `call.name` or `call.input` before execution.

R3B must close this path even when no R3B plan is configured.

Required rule:

```text
PROVIDER-ORIGIN CALL OBJECT
  -> NEVER PASSED AS THE EXECUTION OBJECT TO A CALLBACK

TRUSTED-HOST BEFORE-TOOL SEAM
  -> RECEIVES A DEEPLY IMMUTABLE DEFENSIVE EFFECTIVE-CALL SNAPSHOT
  -> RETURN VALUE IGNORED
  -> MAY VETO ONLY BY THROWING

ORCHESTRATOR
  -> RECEIVES THE SAME EFFECTIVE NAME/INPUT SNAPSHOT SEMANTICS THAT THE HARD LOOP GUARD OBSERVED
```

Mutation attempts must not alter execution.

This is a hardening of an existing trusted-host seam, not authorization for dynamic plugin hooks.

---

## 4. Donor scope

R3B continues the already-attributed DeepCode architectural study:

```text
HKUDS/DeepCode
commit 287510fbf6820147a48adf79f7fd86b0ed1afe92
tree 7f44b320f86d04d4315242fabc74f1b325829be8
```

Relevant references remain:

```text
core/agent_runtime/runner.py
645ab82f768214cce0794984c4bc9b92b099ce5a

core/agent_runtime/hook.py
b0bbe5ea880f8688306a348ca72f2a29d4ffc9cc

core/harness/hooks/events.py
ed393156d9e53d543220387fa4421785a0ce0b83

core/harness/hooks/engine.py
26f66a1199057077372e26d831f58e7d54bf5d89
```

R3B still rejects:

- shell/command hook execution;
- workspace/home hook discovery;
- arbitrary plugin module loading;
- permission-hook `allow` as authority;
- post-tool evidence mutation;
- stop-hook Done Gate authority;
- completion-order racing rewrites.

Agentica remains study-only for future schema-validation/recovery feedback. R3B does not import Agentica runtime code or `typia`, and does not claim full JSON-Schema validation integration.

---

## 5. Authorized implementation paths

If this authorization becomes canonical, exactly these pre-ledger implementation/test paths are authorized:

```text
1.  packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
2.  packages/kodac-runtime/src/model/turn.ts
3.  packages/kodac-runtime/src/agent/loop.ts
4.  packages/kodac-runtime/src/protocol/event.ts
5.  packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
6.  packages/kodac-runtime/test/model-turn.test.ts
7.  packages/kodac-runtime/test/agent-loop.test.ts
8.  packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
9.  packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
10. packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
11. packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
12. docs/planning/KODAC_KDO_H5_R3B_ACTIVE_MONOTONIC_GUARDED_TOOL_PIPELINE_EVIDENCE_2026-08-15.md
```

Path #12 is the evidence ledger and remains absent until the pre-ledger gate passes.

A candidate does not need to modify every authorized test path.

No other production path is authorized.

`src/index.ts`, `THIRD_PARTY_NOTICES.md`, tool registry, runtime orchestrator, H2 request/history/session modules, K2 policy/gateway, approval, confinement, and Done Gate are not authorized to change in R3B.

---

## 6. Protected production surfaces

The following must remain byte-identical:

```text
packages/kodac-runtime/src/index.ts
1c3eaf206b62d03751bcb646972f380d6a751be0

packages/kodac-runtime/THIRD_PARTY_NOTICES.md
aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76

packages/kodac-runtime/src/model/provider.ts
a15f1d86ceab88ab6fa1be787719d222e354e0c4

packages/kodac-runtime/src/tools/registry.ts
0bdf5cfd02efda7cab0c81976c7735bc7b46081b

packages/kodac-runtime/src/runtime/orchestrator.ts
b069da69909b282fdbdc2c62279e0297cbd430e9

packages/kodac-runtime/src/session/session.ts
d5f2334b18e89f7bac2bac7422ed8a33669b8afd

packages/kodac-runtime/src/session/model-visible-request.ts
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

packages/kodac-runtime/src/session/model-visible-history.ts
06909401c6ddf2880154eb3d5fb1fe646d12d7fb

packages/kodac-runtime/src/agent/repeat-call-signal.ts
1fd23cbc4dffd6be5ee77446d84bdea2ca27471f

packages/kodac-runtime/src/agent/tool-result-pruning.ts
66cfee69032c4c24331e8cb9098a86a1d7b9135e

packages/kodac-runtime/src/trust/policy.ts
b4134e430204123bebe053ffc9105f05fca611c9

packages/kodac-runtime/src/trust/approval.ts
d36a604cb1957bc65dac3978c626ba48a9b299fb

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

packages/kodac-runtime/package.json
af4c20a3dae387c15cc5fb2eb28d415c8f115b95

packages/kodac-runtime/scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7
```

---

## 7. Static serialized guard plan

R3B authorizes one optional static serialized plan per `AgentTurnRunner.run(...)` / agent-loop run.

Suggested input field:

```text
guardPlanJson?: string
```

Omitting the plan preserves the pre-R3B tool surface and execution semantics except for the mandatory immutable-call hardening in section 3.

The plan is not a K2 policy. It can only add additional narrowing.

Exact top-level plan schema:

```text
version
toolDecisions
callRules
```

Suggested version:

```text
kodac-guarded-tool-plan-v1
```

Plan input must use the same primitive-string-before-reflection boundary and strict duplicate-key-rejecting JSON/JCS profile as R3A.

The validated plan is immutable and receives a deterministic plan identity under a new domain-separated R3B preimage.

Recommended plan bound:

```text
<= 131072 UTF-8 bytes
```

---

## 8. Tool-exposure decisions

`toolDecisions` may contain only R3A decisions of kinds:

```text
observe
remove_tool
```

`block_call` and `replace_input` are forbidden in `toolDecisions`.

Each `remove_tool` must refer to an exact currently registered base tool name/capability pair.

Application result must satisfy:

```text
PROVIDER_VISIBLE_TOOLS ⊆ REGISTERED_BASE_TOOLS
```

Surviving tool descriptors retain their exact registry:

```text
name
capability
description
inputSchema
```

R3B may filter descriptors but may not rewrite descriptions, schemas, names, or capabilities.

A stale plan that references an unknown/mismatched tool fails before provider invocation.

---

## 9. Call rules

`callRules` is a bounded array of exact rule records:

```text
version
ruleId
toolName
capability
decisions
```

Suggested rule version:

```text
kodac-guarded-tool-call-rule-v1
```

Rules are unique by `ruleId` and by exact tool name/capability pair.

A rule must reference an exact currently registered base tool pair before provider invocation; stale rules fail closed.

Rule `decisions` may contain only:

```text
observe
block_call
replace_input
```

`remove_tool` is forbidden inside a call rule because tool-set narrowing belongs to the exposure phase.

For a provider call, effective R3A decisions are exactly:

```text
all toolDecisions in declaration order
+
matching call-rule decisions in declaration order, if any
```

This preserves R3A's tool-set phase before call-guard phase.

---

## 10. Plan bounds

R3B plan validation must impose explicit bounds at least equivalent to:

```text
plan JSON UTF-8 bytes: <= 131072
toolDecisions: <= 128
callRules: <= 256
decisions per call rule: <= 128
total decisions across plan: <= 1024
ruleId UTF-8 bytes: 1..160
all inherited R3A decision/name/capability/stage/code/input bounds remain in force
```

Unknown fields/kinds/versions, duplicate rule IDs, duplicate rule tool pairs, duplicate decision IDs within an evaluated combined pipeline, or limit+1 cases fail closed.

---

## 11. Plan validation timing and evidence

If `guardPlanJson` is supplied, validation against the current registered tool surface occurs **before** model-visible request snapshot creation and before provider invocation.

On plan/registry incompatibility:

```text
provider call count = 0
model.request.snapshot = absent
model.failed emitted with coarse fixed stage = tool_guard_plan
raw plan content/reasons are not emitted
```

The failure does not create K2 permission or execute a tool.

---

## 12. Model-visible tool exposure

When a plan is valid:

1. take the exact current `ToolRegistry.list()` descriptors;
2. derive the effective name/capability subset using the proven R3A monotonic reducer semantics;
3. map only that subset back to the original full registry descriptors;
4. build `model.request.snapshot` with the effective descriptors;
5. materialize the provider request from that snapshot;
6. pass exactly `request.tools` to the provider.

Required invariant:

```text
PROVIDER REQUEST TOOLS
== MATERIALIZED H2 SNAPSHOT TOOLS
== EXACT SURVIVING REGISTRY DESCRIPTORS
```

No hidden provider-visible tool descriptor may exist outside H2 request evidence.

An empty effective tool set is valid.

---

## 13. Provider tool-call normalization

Every provider tool call must be defensively normalized before any trusted-host callback or execution.

R3B should reuse canonical H2 strict model-visible tool-call/message validation rather than introduce a looser reflective traversal.

Required effects:

- reject Proxy/accessor/symbol/non-enumerable/unsupported/cyclic provider call input before execution;
- produce a detached immutable JSON-compatible call representation;
- preserve own `__proto__` JSON members as data;
- preserve exact provider call id/name and JSON semantics;
- reject duplicate provider call IDs under the existing response validation.

The provider-origin mutable object must never be the execution object.

---

## 14. Unknown/hallucinated tool calls

A provider call name absent from the registered base tool set must fail before:

```text
beforeToolCall trusted-host seam
RuntimeOrchestrator.invoke
tool.started
K2/tool execution
```

If a tool was registered but removed from provider exposure, a later hallucinated call to that tool is still evaluated against the full registered base set plus the global `remove_tool` decision and therefore becomes structurally blocked by R3A.

A removed tool can never be re-added by a call rule.

---

## 15. Pre-execution R3A evaluation

For each normalized provider call:

```text
base tools = exact registered name/capability pairs
call capability = derived from registry, never supplied by provider
call input = normalized provider input
combined decisions = toolDecisions + matching rule decisions
```

R3A reduction occurs before the legacy trusted-host `beforeToolCall` seam and before `RuntimeOrchestrator.invoke`.

If result is blocked:

- emit canonical structural guard evidence;
- do not call `beforeToolCall`;
- do not invoke orchestrator/tool/K2 path;
- throw a typed/fixed-message guard-block error;
- BoundedAgentLoop may use its existing canonical recovery path;
- no free-form guard reason is injected model-visibly.

---

## 16. Input rewrite identity and execution ordering

If R3A changes canonical input:

```text
inputChanged = true
originalInputIdentity != finalInputIdentity
originalCallIdentity != finalCallIdentity
requiresK2Reevaluation = true
```

R3B then creates a **new deeply immutable effective call snapshot** with:

```text
same provider call id
same tool name
same registry capability
R3A final input
```

The exact ordering must be:

```text
provider-origin call normalization
R3A reduction / finalCallIdentity
structural guard evidence
trusted-host beforeToolCall on immutable EFFECTIVE call
RuntimeOrchestrator.invoke(EFFECTIVE name, EFFECTIVE input)
```

No K2/policy/approval/tool execution call may occur before the effective input is finalized.

For tools whose implementation enters K2/ExecutionGateway, K2 therefore receives only post-rewrite effective bytes. A policy/approval decision over pre-rewrite bytes cannot authorize the rewritten action because no pre-rewrite K2 invocation exists in this path.

R3B does not claim every arbitrary registered `RuntimeTool` internally uses K2; it claims only that the runner cannot use R3B to bypass the K2 authority of tools that require it.

---

## 17. Hardened trusted-host `beforeToolCall` seam

R3B retains the existing trusted-host seam only because `BoundedAgentLoop` uses it for budgets and hard duplicate/cycle protection.

It is **not** a dynamic plugin/hook system.

Requirements:

- callback receives a deeply frozen detached effective call;
- nested input is deeply frozen;
- callback return value is ignored;
- mutation attempts cannot affect later execution;
- the exact effective name/input observed by the callback is the name/input sent to `RuntimeOrchestrator.invoke`;
- callback may narrow/veto only by throwing;
- a thrown callback prevents execution;
- no workspace hook discovery or user module loading is added.

The TypeScript hook type should communicate readonly semantics, but runtime immutability is mandatory even if caller code bypasses types.

---

## 18. Agent-loop compatibility

`AgentLoopInput` may add the same optional `guardPlanJson` field and must pass it unchanged to every `AgentTurnRunner.run(...)` invocation in that loop run.

The existing BoundedAgentLoop `beforeToolCall` callback must run against the effective post-R3A call.

Therefore:

```text
maxToolCalls budget
maxIdenticalToolCalls hard guard
R2B serializedInputs map
R2B repeat-call signal
turn signature call fingerprints
```

all observe executed effective tool input, not pre-rewrite provider input.

R3B must not weaken or reorder the existing hard duplicate/cycle limits around execution.

---

## 19. H2 assistant history after rewrite

For a successful tool call, `AgentTurnResult.toolCalls` must represent the **effective executed call** that produced the returned tool result.

Reason:

- H2 assistant/tool-result history should pair the tool result with the actual effective call bytes;
- R2B repeat-call source binding must re-derive the same effective input identity;
- the next model request must not receive a tool result paired with stale pre-rewrite arguments.

The original provider-origin call is not claimed as raw wire replay. Its structural relationship to the effective call is bound by guard evidence identities.

R3B continues to make no raw-provider-wire replay claim.

---

## 20. Structural guard evidence event

R3B authorizes one required non-model-visible event type:

```text
tool.guard.evaluated
```

For every successfully evaluated plan-backed provider tool call, its bounded payload binds at least:

```text
version
planIdentity
callId
tool
capability
pipelineResultIdentity
baseToolSetIdentity
effectiveToolSetIdentity
originalCallIdentity
finalCallIdentity
blocked
blockCode
inputChanged
requiresK2Reevaluation
```

Suggested evidence version:

```text
kodac-tool-guard-evidence-v1
```

The event must contain no raw tool input, no rewritten input, no tool output, no prompt content, no approval secret, and no free-form unbounded text.

`blocked=false` is not permission evidence; it means only the R3A reducer did not block the call.

---

## 21. Post-execution observation without rewrite authority

R3B may add one non-model-visible event after successful orchestrator return:

```text
tool.guard.execution_observed
```

Its payload may bind only structural fields such as:

```text
version
planIdentity
callId
tool
capability
pipelineResultIdentity
finalCallIdentity
status = completed
```

It must not contain or replace raw output/receipt/policy evidence.

No post-tool callback capable of returning a modified output or receipt is authorized.

If this post-execution evidence sink fails after the tool completed, the failure is propagated; the runner must not fabricate a successful `AgentTurnResult` whose guard evidence was rejected.

---

## 22. Block/failure model-visible behavior

R3B does not create free-form model-visible guard text.

When the active agent loop receives a typed R3B block/failure before a successful tool-result batch, it continues to use the existing bounded H2 recovery-system message path.

R3B does not add a new generic H2 source and does not modify H2 history/request modules.

Any future specific guard feedback message requires separate H2 authorization.

---

## 23. Plan absence compatibility

When no `guardPlanJson` is supplied:

- provider-visible tool set remains the full registry list;
- no `tool.guard.evaluated` or post-execution guard event is emitted;
- no R3A plan reduction is required;
- existing provider/tool event ordering remains compatible;
- the mandatory immutable defensive call hardening still applies before `beforeToolCall` and execution.

Therefore plan absence does not silently add a new policy layer.

---

## 24. Existing H5-R1A/R2A/R2B preservation

R3B must preserve:

```text
H5-R1A pruning remains non-integrated unless separately authorized
H5-R2A fixed identity vectors and primitive no-authority contract
H5-R2B fixed active policy identity and advisory semantics
H5-R2B H2 source binding
hard duplicate/cycle semantics
```

Because R3B returns effective successful calls, R2B repeat observation and H2 source binding must be proven against post-rewrite effective input.

---

## 25. Historical regression reconciliation — H2-R2

Authorized test path:

```text
packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
```

The historical test currently pins `model/turn.ts` because H2-R2 itself did not authorize turn-runner changes.

R3B explicitly does.

Authorized reconciliation:

- remove only the obsolete `model/turn.ts` byte pin;
- keep H2 projector/request/session production blobs exact;
- preserve all H2 fail-closed projection/history tests;
- add/rely on R3B focused proof that provider-visible tool exposure is created through canonical `model.request.snapshot` and exactly materialized to the provider;
- do not weaken H2 projector ambient-authority bans.

---

## 26. Historical regression reconciliation — H5-R1A

Authorized test path:

```text
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
```

Authorized reconciliation:

- remove only the obsolete `model/turn.ts` byte pin if present;
- preserve exact H5-R1A pruning-module blob and identities;
- preserve assertions that loop/turn/H2 do not import or call the pruning primitive unless a later explicit pruning-integration authorization exists;
- keep all non-superseded K2/Done Gate/package/script pins.

R3B cannot activate H5-R1A pruning.

---

## 27. Historical regression reconciliation — H5-R2A

Authorized test path:

```text
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
```

Authorized reconciliation:

- remove only the obsolete `model/turn.ts` byte pin if present;
- preserve all R2A fixed policy/input/call/state/signal identity vectors;
- preserve strict serialized boundary/canonicalization/bounds/saturation tests;
- preserve R2A production no-authority import contract;
- preserve all non-superseded protected blobs.

---

## 28. Historical regression reconciliation — H5-R3A

Authorized test path:

```text
packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
```

R3A historically pinned active integration surfaces because R3A was intentionally inert.

R3B explicitly supersedes that non-integration boundary.

Authorized reconciliation:

- preserve all R3A reducer fixed identity vectors exactly;
- preserve all decision/schema/JCS/bounds/monotonicity/immutability/no-permission tests;
- preserve production R3A module no-fs/process/network/session/model/tool/K2 authority;
- permit only additive R3B plan validation helpers in the same pure module;
- remove only obsolete byte pins for R3B-authorized `model/turn.ts`, `agent/loop.ts`, and `protocol/event.ts`;
- replace those pins with property assertions that active integration calls the pure R3A reducer and that the R3A module itself still cannot execute tools/K2 or load callbacks;
- keep every non-superseded protected blob exact.

No R3A fixed identity vector may change to make R3B tests pass.

---

## 29. Forbidden reconciliation techniques

R3B forbids:

- deleting/skipping/todo-ing historical tests;
- CI/platform bypasses;
- weakening non-superseded K2/H2/Done Gate assertions;
- changing R3A fixed identity vectors;
- touching unrelated production paths to satisfy old byte pins;
- changing historical evidence documents;
- using a mutable callback return as the new execution call;
- dynamically loading workspace/user hook code.

---

## 30. Required focused tests

R3B focused/authorized tests must prove at minimum:

1. canonical base/R3A authorization/evidence/proven claim identities exact;
2. all R3A fixed identity vectors remain exact;
3. plan version and plan identity are deterministic;
4. plan primitive-string boundary rejects Proxy/accessor/toJSON without hooks;
5. malformed/duplicate-key/unknown-field plan fails closed;
6. toolDecisions reject block/replace kinds;
7. call-rule decisions reject remove_tool;
8. duplicate rule IDs and duplicate rule tool pairs fail closed;
9. plan count/byte/string bounds fail at limit+1;
10. stale remove-tool reference fails before model snapshot/provider call;
11. stale/mismatched call rule fails before model snapshot/provider call;
12. invalid plan emits only coarse fixed `model.failed` stage and leaks no raw plan;
13. no-plan provider request exposes all registry tools exactly;
14. remove-tool plan exposes a strict subset only;
15. surviving provider descriptors retain exact description/schema/name/capability;
16. empty effective tool exposure is supported;
17. provider request tools equal materialized H2 snapshot tools exactly;
18. provider-origin Proxy/accessor/cyclic/unsupported tool input is rejected before callback/tool execution;
19. provider mutable call object cannot be mutated by `beforeToolCall` to alter execution;
20. nested effective input is deeply frozen at trusted-host seam;
21. `beforeToolCall` return value cannot rewrite execution;
22. `beforeToolCall` throw vetoes execution;
23. unknown provider tool name cannot reach callback/orchestrator;
24. globally removed but hallucinated registered tool is blocked before callback/orchestrator;
25. call rule block emits structural guard evidence and does not execute;
26. block event contains no raw input/output/prompt;
27. replace-input keeps same id/name/capability;
28. replace-input changes structural input/call identities;
29. replace-input sets `requiresK2Reevaluation=true`;
30. effective rewritten input reaches `beforeToolCall`;
31. same effective rewritten input reaches `RuntimeOrchestrator.invoke`/tool execution;
32. original provider input does not reach tool execution after rewrite;
33. successful `AgentTurnResult.toolCalls` contains the effective executed call;
34. BoundedAgentLoop hard duplicate fingerprint uses effective rewritten input;
35. BoundedAgentLoop `serializedInputs` / R2B repeat signal uses effective rewritten input;
36. next H2 assistant/tool-result history pairs the result with effective call input;
37. R2B source-binding validation remains green after rewrite;
38. tool guard evaluated event identity/fields are deterministic and bounded;
39. `blocked=false` event is not treated as K2 permission;
40. post-execution guard observation occurs only after successful orchestrator return;
41. post-execution guard observation contains no raw output/receipt mutation field;
42. post-execution evidence sink failure prevents successful AgentTurnResult completion;
43. downstream gateway/K2-backed tool fixture observes only effective rewritten bytes, never original bytes;
44. no K2/policy/approval call occurs before effective call finalization in source/test ordering;
45. hard duplicate/cycle defaults and reasons remain unchanged;
46. H5-R1A remains non-integrated;
47. R2A fixed identities remain exact;
48. R2B threshold/policy/advisory behavior remains exact;
49. R3A module remains pure/no execution authority;
50. no dynamic import/fs hook discovery/child-process hook execution added;
51. C1-style historical test reconciliations match sections 25-28 only;
52. all protected production blobs in section 6 remain exact;
53. TypeScript/full runtime regression suite PASS across supported matrix.

---

## 31. K3 trigger-aware certification

R3B uses the canonical trigger-aware rule:

```text
if exact candidate changes any K3-R4 trigger path:
  exact-head K3-R4 PASS required
else:
  K3-R4 = NOT_APPLICABLE_PATH_FILTER_PROVEN

if exact candidate changes any K3-R5 trigger path:
  exact-head K3-R5 PASS required
else:
  K3-R5 = NOT_APPLICABLE_PATH_FILTER_PROVEN
```

Artificial changes to `src/index.ts` or other K3 trigger paths merely to schedule those workflows are forbidden.

---

## 32. Pre-ledger gate

Before the R3B evidence ledger may be added:

```text
changed paths ⊆ authorized paths 1-11
ledger absent
historical test reconciliations conform exactly to sections 25-29
protected production blobs exact
R3A fixed identity vectors exact
TypeScript typecheck PASS
focused R3B tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy PASS
K3 trigger-aware certification PASS/N-A as applicable
review findings adjudicated
unresolved review threads = 0
manual exact-head tool-exposure/mutation/K2-order/H2 review PASS
```

---

## 33. Evidence ledger

Only after pre-ledger PASS may this path be added:

```text
docs/planning/KODAC_KDO_H5_R3B_ACTIVE_MONOTONIC_GUARDED_TOOL_PIPELINE_EVIDENCE_2026-08-15.md
```

The ledger must bind at minimum:

- authorization/base/R3A predecessor identities;
- accepted pre-ledger head/tree/blobs;
- plan version/identity and fixed plan vector;
- filtered provider-tool snapshot/request proof;
- provider-origin/effective-call identity vector;
- immutable beforeToolCall mutation-resistance proof;
- block/no-execution proof;
- rewrite/effective-input/K2-order proof;
- loop hard-guard and R2B effective-input proof;
- structural guard event vector;
- post-execution no-rewrite evidence proof;
- historical test before/after blobs and exact reconciled assertions;
- protected blobs;
- exact CI runs/jobs;
- K3 applicability/run evidence;
- review/security status;
- all non-claims.

After ledger addition, every pre-ledger result is historical and the exact ledger-bearing head requires fresh post-ledger certification.

---

## 34. Completion claim

Only after implementation + ledger + post-ledger certification + exact expected-head canonical merge may Kodac make:

```text
KODAC_ACTIVE_MONOTONIC_GUARDED_TOOL_PIPELINE_PROVEN
```

This bounded claim means only:

- model-visible tool exposure can be monotonically filtered by the static R3B plan;
- provider calls are defensively normalized;
- R3A can block or same-tool rewrite before execution;
- rewritten calls receive new identities and are the only bytes observed by hard loop guards and downstream execution/K2 path;
- the legacy trusted-host before-tool seam cannot mutate execution;
- guard evidence is structural/non-model-visible and cannot rewrite tool output/receipt.

It does not mean H5 is complete.

---

## 35. Explicit non-claims

R3B does **not** claim or authorize:

- shell/command hooks;
- workspace/home hook discovery;
- arbitrary plugin/user module execution;
- remote hook execution;
- full JSON-Schema validator integration;
- Agentica runtime import;
- validation success as permission;
- permission-hook allow override;
- K2 bypass;
- approval override;
- confinement changes;
- post-tool output/receipt rewrite;
- free-form model-visible guard feedback;
- H5-R1 pruning integration;
- model-based compaction;
- subagents;
- delegation fleets;
- worktree workers;
- background jobs;
- writable memory;
- Git/workspace mutation authority beyond existing tools/K2;
- Done Gate override;
- H5 completion;
- H6 readiness;
- `PROVEN_READY`.

DeerFlow, LLM Space, and delegate-skills remain later H6/orchestration/evaluation/delegation donors.

---

## 36. Authorization truth

```text
IF CANONICAL:

AUTHORIZED NEXT ACTION:
IMPLEMENT ONLY H5-R3B WITHIN PATHS 1-11

LEDGER:
BLOCKED UNTIL PRE-LEDGER PASS

DYNAMIC / COMMAND HOOKS:
BLOCKED

TOOL EXPOSURE:
MAY ONLY NARROW

CALL REWRITE:
SAME TOOL/CAPABILITY ONLY + NEW IDENTITY + DOWNSTREAM RE-EVALUATION

TRUSTED-HOST BEFORE-TOOL SEAM:
IMMUTABLE OBSERVE/VETO ONLY

POST-TOOL REWRITE:
BLOCKED

K2 / APPROVAL / CONFINEMENT / DONE-GATE OVERRIDE:
BLOCKED

H6:
NOT AUTHORIZED
```

Status:

```text
KDO_H5_R3B_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
