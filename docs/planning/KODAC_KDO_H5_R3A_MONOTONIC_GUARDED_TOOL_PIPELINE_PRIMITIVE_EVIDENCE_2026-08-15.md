# KDO-H5-R3A — Monotonic Guarded Tool Pipeline Primitive Evidence

Date: 2026-08-15
Status: POST-LEDGER CERTIFICATION CANDIDATE

## 1. Evidence decision

```text
GATE:
KDO-H5-R3A

PRE-LEDGER DECISION:
PASS

ACCEPTED PRE-LEDGER HEAD:
22e27727248b58cca35bdd933074cf9dddce5989

ACCEPTED PRE-LEDGER TREE:
4eb193a658f76283da829755cbd0d3ea4debdcc4

CANONICAL IMPLEMENTATION BASE:
67e8345ba46b8fa6016bcde95e247ab5deafd7ab

ACTIVE TOOL/AGENT INTEGRATION:
NOT CLAIMED

K2 AUTHORITY:
UNCHANGED
```

This ledger records the accepted pre-ledger proof for the pure H5-R3A monotonic guarded tool-pipeline reducer.

It does not itself complete H5-R3A. The ledger-bearing exact head requires a fresh post-ledger certification before merge or completion claim.

---

## 2. Canonical authorization and predecessor

```text
Authorization path:
docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_AUTHORIZATION_2026-08-15.md

Authorization blob:
39d4786f37a5a7dd71ab872314364bf15726d423

Authorization merge / implementation base:
67e8345ba46b8fa6016bcde95e247ab5deafd7ab

Authorization base tree:
2cc256bf65794bd5ca66bf0bc314c5b729881e0a

Canonical predecessor main:
f99c8e3e96ebf0e4b3892088faef9502375d4931

Canonical predecessor claim:
KODAC_H2_BOUND_REPEAT_CALL_ADVISORY_PROVEN
```

R3A intentionally remains inert with respect to the active agent loop, `AgentTurnRunner`, runtime orchestrator, tool registry, H2 history, K2, and Done Gate.

---

## 3. DeepCode donor provenance

```text
Repository:
HKUDS/DeepCode

Pinned commit:
287510fbf6820147a48adf79f7fd86b0ed1afe92

Pinned tree:
7f44b320f86d04d4315242fabc74f1b325829be8

Runner reference:
core/agent_runtime/runner.py
blob 645ab82f768214cce0794984c4bc9b92b099ce5a

Lifecycle reference:
core/agent_runtime/hook.py
blob b0bbe5ea880f8688306a348ca72f2a29d4ffc9cc

Matcher reference:
core/harness/hooks/events.py
blob ed393156d9e53d543220387fa4421785a0ce0b83

Fold reference:
core/harness/hooks/engine.py
blob 26f66a1199057077372e26d831f58e7d54bf5d89

Root LICENSE blob:
b3ba37ce442298d5bdec96e2e52a8a812a25f123

License:
MIT
```

Kodac ports selected lifecycle/fold contract ideas only. R3A does not port shell-command hooks, workspace-discovered executable callbacks, permission-hook allow authority, completion-order rewrite authority, post-hook evidence mutation, or stop-hook continuation authority.

---

## 4. Agentica secondary study provenance

```text
Repository:
wrtnlabs/agentica

Pinned commit:
dc91f4307a3f2ee25e1ee07cf48777fcd13b6b0d

Function-calling design reference:
website/content/docs/concepts/function-calling.mdx
blob 9e5577511d65369e8439a958683b81e541dc87ee

LICENSE blob:
886b7e88682164a5a22e609120c9f96c9ea57216

License:
MIT

Copyright:
Copyright (c) 2025 Wrtn Technologies

Intake mode:
STUDY_ONLY
```

No Agentica runtime source or dependency is copied/imported by R3A. The only adopted design lesson is that validation failure may produce narrowing/recovery feedback later; validation success never grants permission.

---

## 5. Accepted pre-ledger path and blob set

Exactly four paths changed before ledger creation:

```text
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
876656bf65a67df56c4cd5f078629cde06112af1

packages/kodac-runtime/src/index.ts
1c3eaf206b62d03751bcb646972f380d6a751be0

packages/kodac-runtime/THIRD_PARTY_NOTICES.md
aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76

packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
93b9cd16abc1a576f5c5bf6e0aab97dbce7e490d
```

Evidence ledger before acceptance:

```text
ABSENT
```

---

## 6. Protected active authority/runtime surfaces

The focused proof pins all R3A-protected active surfaces exactly:

```text
packages/kodac-runtime/src/agent/loop.ts
47b160683475068305945c5af8fe2322e20c9cb0

packages/kodac-runtime/src/agent/repeat-call-signal.ts
1fd23cbc4dffd6be5ee77446d84bdea2ca27471f

packages/kodac-runtime/src/model/turn.ts
401d796b929d350046128371fee4ba719d0d56c9

packages/kodac-runtime/src/runtime/orchestrator.ts
b069da69909b282fdbdc2c62279e0297cbd430e9

packages/kodac-runtime/src/tools/registry.ts
0bdf5cfd02efda7cab0c81976c7735bc7b46081b

packages/kodac-runtime/src/session/session.ts
d5f2334b18e89f7bac2bac7422ed8a33669b8afd

packages/kodac-runtime/src/session/model-visible-history.ts
06909401c6ddf2880154eb3d5fb1fe646d12d7fb

packages/kodac-runtime/src/session/model-visible-request.ts
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

packages/kodac-runtime/src/protocol/event.ts
c48b0c4ca3ef900f71ac4f15e9db94d9da5f0096

packages/kodac-runtime/src/agent/tool-result-pruning.ts
66cfee69032c4c24331e8cb9098a86a1d7b9135e

packages/kodac-runtime/src/trust/policy.ts
b4134e430204123bebe053ffc9105f05fca611c9

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

packages/kodac-runtime/package.json
af4c20a3dae387c15cc5fb2eb28d415c8f115b95

packages/kodac-runtime/scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7
```

Therefore R3A does not activate provider tool filtering, pre/post hooks, tool execution, H2 feedback, K2 policy, approval, confinement, or Done Gate behavior.

---

## 7. Version and bound contract

```text
Pipeline version:
kodac-guarded-tool-pipeline-v1

Decision version:
kodac-guarded-tool-decision-v1

Result version:
kodac-guarded-tool-pipeline-result-v1

Pipeline JSON:
<= 262144 UTF-8 bytes

Base tools:
<= 256

Tool name:
1..160 UTF-8 bytes

Capability:
1..160 UTF-8 bytes

Decisions:
<= 128

Decision id:
1..160 UTF-8 bytes

Stage id:
1..160 UTF-8 bytes

Code:
1..160 UTF-8 bytes

Canonical input:
<= 131072 UTF-8 bytes

Maximum input JSON depth:
64

Maximum aggregate input array elements + object members:
8192
```

Limit+1 cases are covered by the focused test and fail closed.

---

## 8. Serialized hostile-input boundary

The public primitive is:

```text
reduceGuardedToolPipeline(guardedToolPipelineJson)
  -> immutable deterministic structural result
```

The implementation requires a primitive string before any parsing/reflection. Focused tests prove that Proxy, accessor-bearing, and `toJSON` objects are rejected without executing their hooks.

The strict parser rejects malformed JSON, duplicate keys, unsupported versions/kinds, unknown fields, duplicate decision IDs, duplicate tool names, and unpaired Unicode surrogates.

No caller-owned JavaScript object graph crosses directly into the reducer.

---

## 9. Monotonic tool-set proof

The only tool-set mutation kind is:

```text
remove_tool
```

It requires an existing exact effective `name/capability` pair and removes that pair.

Proven invariant:

```text
EFFECTIVE_TOOLS ⊆ BASE_TOOLS
```

Focused tests prove:

- nonexistent removal fails;
- capability-mismatched removal fails;
- repeated removal fails;
- duplicate base names fail;
- unknown/add-tool decision kind fails;
- tool name/capability substitution is not expressible in an accepted decision schema.

If the active call's own tool is removed, the result becomes structurally blocked and no later rewrite can re-add it.

---

## 10. Monotonic call proof

The only call mutations are:

```text
block_call
replace_input
```

`block_call` is monotonic:

```text
false -> true only
```

`replace_input` preserves the exact original tool name/capability pair.

If canonical input bytes change:

```text
originalInputIdentity != finalInputIdentity
originalCallIdentity != finalCallIdentity
requiresK2Reevaluation = true
```

The `requiresK2Reevaluation` flag is monotonic and never clears, including when later rewrites restore the original final input bytes.

A byte-identical canonical replacement is a no-op.

No result field means `allowed`, `approved`, `permissionGranted`, `safeToExecute`, `sandboxed`, or `provenReady`.

---

## 11. Phase/order proof

Declaration order is deterministic.

Tool-set narrowing may occur before call-guard mutation. After `block_call` or `replace_input` starts the call-guard phase, a later `remove_tool` is rejected.

Focused tests prove non-commutative ordered replacements produce deterministic distinct final identities/results and phase violations fail closed.

No completion-order race or asynchronous last-writer rewrite semantics exist in R3A.

---

## 12. Canonical identity profile and fixed vector

Every published identity is lowercase SHA-256 with domain separation:

```text
KODAC-H5-R3A\0TOOL_SET\0V1\0
KODAC-H5-R3A\0INPUT\0V1\0
KODAC-H5-R3A\0CALL\0V1\0
KODAC-H5-R3A\0DECISION\0V1\0
KODAC-H5-R3A\0PIPELINE_RESULT\0V1\0
```

The fixed focused fixture uses:

```text
base tools:
repo.read / workspace.read
shell / process.exec

original call:
repo.read / workspace.read
input {"a":1,"b":2}

decision d1:
remove shell/process.exec

decision d2:
replace input with {"a":1,"b":3}
```

Exact identities:

```text
baseToolSetIdentity:
1c32e41e2b831e41178154430382dd762b14632e04dc82a3632448675d2fc387

effectiveToolSetIdentity:
10e9c56ba5e660174810439be5e84baa9ca3ccb02643156a5e06464f8b8161b9

originalInputIdentity:
cbd18981586dafc5646b3e572361980a7fe4d365a5d376e74f487cb195cac25d

originalCallIdentity:
ba75e0d2679be68a730d7cbff8e34adca0c009de867840045e3fa41696006362

finalInputIdentity:
0cf52fe22d060d50c1f68cf6ea1ea3d1d09783ef1b3af61a46aaba02f28f3ed6

finalCallIdentity:
bba2ad9517c0618091a1e239a141efbfcb9fa745442382b1c344778b6fc9011f

decision d1 identity:
99a2451b85825aecea0a9f7123006704571cf0bc75fe15701e1bee815de9edf1

decision d2 identity:
6955a1abce427d1891abfbaa566604b0526ee388ae6a5fe1f9fb12887cb81e27

pipeline result identity:
ac5f1b538ef8de99558d7ca1d0b31228d6b78e293978ad4a87e5a46bed90b09b
```

JCS-compatible vectors additionally prove object-key-order stability, `-0 == 0`, alternate exponent/decimal spellings, equivalent JSON escapes, Unicode non-normalization, and lone-surrogate rejection.

---

## 13. Immutability and no-authority proof

The result, effective tool array/entries, effective call, nested effective input, and decision identity list are frozen defensive structures.

Production R3A source imports exactly:

```text
node:crypto
```

It has no filesystem, child-process, HTTP/HTTPS/socket/TLS, environment, session-event, model, tool-execution, `RuntimeOrchestrator`, `ExecutionGateway`, K2 policy, approval, confinement, or Done Gate authority.

R3A consumes inert serialized decisions only. It executes no caller callback, user module, hook command, or workspace-discovered executable.

---

## 14. Pre-ledger CI evidence

Exact accepted head:

```text
22e27727248b58cca35bdd933074cf9dddce5989
```

### Governance

```text
workflow run:
31853094317

legacy-tests:
94932547990 — PASS

provenance:
94932548054 — PASS
```

### K3-R4

```text
workflow run:
31853094237

job:
94932547591 — PASS
```

### K3-R5

```text
workflow run:
31853094243

job:
94932547515 — PASS
```

### K2 runtime matrix

```text
workflow run:
31853094297

runtime-change-classifier:
94932547849 — PASS

Ubuntu runtime:
94932567271 — PASS
Typecheck PASS
Test PASS

macOS runtime:
94932567291 — PASS
Typecheck PASS
Test PASS

Windows runtime:
94932567328 — PASS
Typecheck PASS
Test PASS

k2-runtime-gate:
94932682744 — PASS
```

Because `packages/kodac-runtime/src/index.ts` changed, both K3 workflows were applicable, scheduled on the exact head, and passed.

---

## 15. Review and manual exact-head status

At accepted pre-ledger head:

```text
CodeRabbit:
SUCCESS

Unresolved review threads:
0

Changed paths:
exactly 4 authorized pre-ledger paths

Manual exact-head monotonicity/security/authority review:
PASS
```

Manual review confirmed:

- no arbitrary callback or command execution surface;
- no `allow`/permission-grant decision kind;
- no tool addition/name/capability rewrite path;
- block and K2-reevaluation flags are monotonic;
- input rewrite always preserves tool/capability and changes structural identity when semantic bytes change;
- active loop/turn/orchestrator/registry/H2/K2/Done Gate surfaces remain protected;
- no evidence ledger existed before acceptance.

---

## 16. Pre-ledger gate result

```text
changed paths ⊆ authorized paths 1-4:
PASS

ledger absent:
PASS

protected blobs exact:
PASS

TypeScript typecheck:
PASS

focused R3A tests:
PASS

full runtime tests:
PASS

runtime-change-classifier:
PASS

K2 runtime gate:
PASS

governance/provenance/legacy:
PASS

K3-R4:
PASS

K3-R5:
PASS

review findings adjudicated:
PASS

unresolved review threads = 0:
PASS

manual exact-head review:
PASS

PRE-LEDGER DECISION:
PASS
```

This PASS is historical evidence bound only to head `22e27727248b58cca35bdd933074cf9dddce5989` and tree `4eb193a658f76283da829755cbd0d3ea4debdcc4`.

---

## 17. Post-ledger certification requirement

After this ledger is added, the resulting exact head must independently prove:

```text
changed paths = authorized paths 1-5 only
ledger present at exact path
implementation/test/export/notice blobs unchanged from accepted pre-ledger evidence
protected blobs exact
fixed identity vectors exact
TypeScript typecheck PASS
focused R3A tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy PASS
K3-R4 PASS
K3-R5 PASS
review findings adjudicated
unresolved review threads = 0
manual exact-head monotonicity/security/authority review PASS
```

Historical pre-ledger PASS does not substitute for post-ledger certification.

---

## 18. Explicit non-claims

H5-R3A does **not** claim or authorize:

- active provider tool filtering;
- active pre-tool/post-tool executable hooks;
- shell/command hooks;
- workspace-discovered executable callbacks;
- plugin/user-code callback execution;
- `AgentTurnRunner` integration;
- tool execution or blocking authority outside a structural reducer result;
- permission grants;
- K2 bypass;
- approval override;
- confinement changes;
- execution receipt/evidence rewriting;
- H2 feedback injection;
- Done Gate override;
- model-based compaction;
- subagents;
- delegation fleets;
- background jobs;
- worktree workers;
- writable memory;
- Git/workspace mutation authority;
- H5-R3B completion;
- H5 completion;
- H6 readiness;
- `PROVEN_READY`.

DeerFlow, LLM Space, and delegate-skills remain later orchestration/evaluation/delegation donors and are not imported by R3A.

---

## 19. Completion claim gate

Only after this ledger-bearing head passes fresh post-ledger certification and is merged by exact expected head into canonical `main` may Kodac make the bounded claim:

```text
KODAC_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_PROVEN
```

Until then:

```text
KODAC_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_PROVEN:
UNAVAILABLE
```
