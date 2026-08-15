# KDO-H5-R3A — Monotonic Guarded Tool Pipeline Primitive Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R3A

NAME:
MONOTONIC GUARDED TOOL PIPELINE PRIMITIVE

CANONICAL AUTHORIZATION BASE:
f99c8e3e96ebf0e4b3892088faef9502375d4931

CANONICAL AUTHORIZATION BASE TREE:
495477a2cd2af9c7eaa8f596bcf6365a58d907f8

CANONICAL PREDECESSOR CLAIM:
KODAC_H2_BOUND_REPEAT_CALL_ADVISORY_PROVEN

IMPLEMENTATION AUTHORITY IF THIS DOCUMENT BECOMES CANONICAL:
ONE PURE DETERMINISTIC DECLARATIVE MONOTONIC TOOL-PIPELINE REDUCER + TESTS + ATTRIBUTION

ARBITRARY CALLBACK / COMMAND HOOK EXECUTION:
NOT AUTHORIZED

AGENT TURN INTEGRATION:
NOT AUTHORIZED

TOOL EXECUTION:
NOT AUTHORIZED

K2 POLICY / APPROVAL / CONFINEMENT CHANGE:
NOT AUTHORIZED
```

H5-R3A establishes the authority-safe algebra for later guarded tool-pipeline integration.

Target invariant:

```text
BASE TOOL/CALL AUTHORITY
  -> ORDERED DECLARATIVE GUARD DECISIONS
  -> SAME OR NARROWER EFFECTIVE TOOL/CALL SURFACE
  -> OPTIONAL INPUT REWRITE WITH NEW IDENTITY + REQUIRED K2 RE-EVALUATION

NO GUARD DECISION MAY:
  ADD A TOOL
  CHANGE CAPABILITY
  TURN BLOCK INTO ALLOW
  BYPASS K2
  REWRITE EVIDENCE
  EXECUTE SIDE EFFECTS
```

---

## 2. Why R3 is split into R3A then R3B

Canonical second-wave planning names:

```text
KDO-H5-R3 — MONOTONIC GUARDED TOOL PIPELINE
```

and requires:

```text
HOOKS MAY OBSERVE OR NARROW.
HOOKS MAY NOT WIDEN K2 AUTHORITY.

TOOL REGISTRATION != EXECUTION GRANT
PRE-HOOK != POLICY OVERRIDE
POST-HOOK != EVIDENCE REWRITE
STOP-HOOK != DONE-GATE AUTHORITY
```

DeepCode exposes a broad executable hook framework. Copying that framework directly would create a new command/callback authority plane before Kodac has proven the monotonic semantics.

R3A therefore proves the pure reducer first.

A later R3B may integrate only built-in/explicitly trusted adapters into `AgentTurnRunner` and model-visible tool exposure after R3A becomes canonical. R3B must separately prove K2 re-evaluation, H2 feedback semantics, adapter failure behavior, and no ambient hook execution.

---

## 3. Canonical predecessor state

H5-R2B is canonical at:

```text
main:
f99c8e3e96ebf0e4b3892088faef9502375d4931

tree:
495477a2cd2af9c7eaa8f596bcf6365a58d907f8

bounded claim:
KODAC_H2_BOUND_REPEAT_CALL_ADVISORY_PROVEN
```

R3A does not reinterpret or modify R2B.

Current relevant canonical surfaces include:

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

packages/kodac-runtime/src/session/model-visible-history.ts
06909401c6ddf2880154eb3d5fb1fe646d12d7fb

packages/kodac-runtime/src/protocol/event.ts
c48b0c4ca3ef900f71ac4f15e9db94d9da5f0096
```

---

## 4. DeepCode donor pin

Primary architectural donor:

```text
Repository:
HKUDS/DeepCode

Pinned commit:
287510fbf6820147a48adf79f7fd86b0ed1afe92

Pinned tree:
7f44b320f86d04d4315242fabc74f1b325829be8

Runner integration reference:
core/agent_runtime/runner.py
blob 645ab82f768214cce0794984c4bc9b92b099ce5a

Lifecycle hook primitive:
core/agent_runtime/hook.py
blob b0bbe5ea880f8688306a348ca72f2a29d4ffc9cc

Hook event/matcher semantics:
core/harness/hooks/events.py
blob ed393156d9e53d543220387fa4421785a0ce0b83

Hook engine/fold reference:
core/harness/hooks/engine.py
blob 26f66a1199057077372e26d831f58e7d54bf5d89

License:
MIT

Intake mode:
PORT SELECTED CONTRACT IDEAS / REWRITE AUTHORITY MODEL
```

Observed useful donor ideas:

- ordered lifecycle seams;
- tool-name matching/filtering;
- pre-tool block decision;
- optional pre-tool input rewrite;
- post-tool observation/context;
- deterministic declaration-order reporting;
- deny/block precedence over permissive outcomes.

Rejected donor authority choices for R3A/R3B:

- shell/command hook execution;
- arbitrary workspace-discovered executable callbacks;
- permission-hook `allow` as execution authority;
- best-effort swallowing of authority/evidence-critical hook failure;
- completion-order "last rewrite wins" without a deterministic identity contract;
- post-hook evidence/result rewriting;
- stop-hook power to override Done Gate.

---

## 5. Agentica secondary donor classification

Secondary design donor:

```text
Repository:
wrtnlabs/agentica

Pinned commit:
dc91f4307a3f2ee25e1ee07cf48777fcd13b6b0d

Function-calling design reference:
website/content/docs/concepts/function-calling.mdx
blob 9e5577511d65369e8439a958683b81e541dc87ee

License:
MIT

LICENSE blob:
886b7e88682164a5a22e609120c9f96c9ea57216

Copyright:
Copyright (c) 2025 Wrtn Technologies

Intake mode:
STUDY_ONLY IN R3A
```

Useful idea:

```text
FUNCTION SELECTION / ARGUMENT VALIDATION FAILURE
  -> STRUCTURED FEEDBACK / RETRY SIGNAL
```

Kodac authority interpretation:

```text
SCHEMA VALIDATION SUCCESS != PERMISSION
VALIDATION FAILURE MAY NARROW/BLOCK
VALIDATION FEEDBACK MAY BE MODEL-VISIBLE ONLY THROUGH A LATER CANONICAL H2 RECORD
K2 STILL EVALUATES ANY EXECUTED ACTION
```

R3A does not import Agentica runtime code or `typia`.

---

## 6. Authorized implementation paths

If this authorization becomes canonical, exactly these later R3A implementation paths are authorized:

```text
1. packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/THIRD_PARTY_NOTICES.md
4. packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
5. docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_EVIDENCE_2026-08-15.md
```

Path #5 is the evidence ledger and must remain absent until pre-ledger PASS.

No other path is authorized.

---

## 7. Protected surfaces

The following remain byte-identical throughout R3A implementation:

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

Only `src/index.ts` and `THIRD_PARTY_NOTICES.md` may change outside the new R3A module/test.

---

## 8. Public boundary: serialized declarative data only

R3A must not execute callback functions supplied by a caller.

Authority-relevant public inputs must cross the reducer boundary as primitive JSON text.

Equivalent public shape:

```text
reduceGuardedToolPipeline(pipelineJson)
  -> immutable deterministic result
```

The primitive must check `typeof value === "string"` before any property access, enumeration, coercion, prototype inspection, `toString`, `toJSON`, or serialization attempt.

Non-string objects including Proxy/accessor/function/boxed-string inputs must fail without invoking caller hooks.

Parsed JSON is inert data only.

---

## 9. Exact R3A versioned schemas

The reducer input has one exact versioned schema equivalent to:

```text
version
tools
call
decisions
```

Suggested version:

```text
kodac-guarded-tool-pipeline-v1
```

### Tool entries

Each base tool entry must contain exactly:

```text
name
capability
```

Both are non-empty bounded strings.

Tool names must be unique.

The base tool set is the maximum surface R3A may consider. A decision can remove from it but cannot add to it or substitute a new capability.

### Call

The call must contain exactly:

```text
toolName
capability
input
```

The call's toolName/capability pair must exist exactly in the base tool set before decisions are applied.

### Decisions

Each decision has one exact common envelope:

```text
version
decisionId
stageId
kind
```

plus exact kind-specific fields.

No unknown fields are permitted.

---

## 10. Authorized decision kinds

R3A recognizes only these declarative kinds:

```text
observe
remove_tool
block_call
replace_input
```

No other decision kind is valid.

### 10.1 `observe`

May record only bounded evidence-safe metadata such as a fixed code/category.

It changes no tool set, call, block state, or authority state.

### 10.2 `remove_tool`

Must identify an existing exact tool name/capability pair from the base set.

Effect:

```text
effectiveTools := effectiveTools - tool
```

It cannot remove one name while claiming another capability.

It cannot add or rename any tool.

### 10.3 `block_call`

Effect:

```text
blocked := true
```

Once blocked, no later decision may turn the call back into executable/proceed state.

A bounded machine code/reason category may be included; no arbitrary unbounded prompt text is required in R3A.

### 10.4 `replace_input`

May replace only the JSON `input` value of the current call.

It may **not** change:

```text
toolName
capability
```

Any accepted replacement must produce a new canonical input identity and a new effective call identity.

If the canonical replacement input is byte-identical to the current canonical input, the reducer treats it as a no-op observation, not a new authority event.

If the input identity changes:

```text
requiresK2Reevaluation = true
```

and no later decision may clear that flag.

R3A never claims that the rewritten call is allowed to execute.

---

## 11. Phase/order constraints

R3A uses deterministic declaration order from the serialized `decisions` array.

Decision IDs and stage IDs must be non-empty bounded strings. Decision IDs must be unique.

Allowed phase ordering:

```text
TOOL-SET NARROWING PHASE:
observe / remove_tool

CALL-GUARD PHASE:
observe / block_call / replace_input
```

A `remove_tool` decision after call-guard mutation begins is rejected.

A `replace_input` decision for a call whose tool has already been removed causes the final call to remain non-executable/blocked; it cannot re-add the removed tool.

A block is monotonic:

```text
false -> true allowed
true -> false impossible
```

A K2-re-evaluation requirement is monotonic:

```text
false -> true allowed
true -> false impossible
```

---

## 12. Tool-set monotonicity invariant

For every successful reduction:

```text
EFFECTIVE_TOOLS ⊆ BASE_TOOLS
```

where membership binds both:

```text
name
capability
```

The output must include deterministic identities for the base tool set and effective tool set.

The reducer must fail closed if a decision attempts to:

- add a new name;
- add a new capability;
- mutate the capability associated with a name;
- create duplicate names;
- re-add a removed tool.

---

## 13. Call monotonicity invariant

The effective call may be:

```text
unchanged
input-rewritten for the same tool/capability
blocked
```

It may never become a different tool or capability.

The reducer must bind:

```text
originalInputIdentity
originalCallIdentity
finalInputIdentity
finalCallIdentity
inputChanged
blocked
requiresK2Reevaluation
```

Required implications:

```text
inputChanged == false
  -> originalInputIdentity == finalInputIdentity

inputChanged == true
  -> originalInputIdentity != finalInputIdentity
  -> originalCallIdentity != finalCallIdentity
  -> requiresK2Reevaluation == true

blocked == true
  -> R3A result makes no execution permission claim
```

---

## 14. Canonical JSON profile

R3A must use a strict bounded JSON parser and RFC-8785/JCS-compatible UTF-8 canonicalization profile equivalent to the already-proven R2A profile:

- duplicate keys rejected;
- object keys deterministically ordered;
- array order preserved;
- strings use deterministic JSON escaping;
- lone surrogates rejected;
- Unicode not normalization-folded;
- finite IEEE-754 binary64 number semantics;
- `-0` canonicalizes as `0`;
- runtime-only values cannot enter through serialized input.

R3A does not modify or import hidden mutable state from R2A.

---

## 15. Deterministic structural identities

Every identity is lowercase SHA-256 hex.

R3A must domain-separate at least:

```text
TOOL_SET
INPUT
CALL
DECISION
PIPELINE_RESULT
```

Suggested exact prefix family:

```text
KODAC-H5-R3A\0<KIND>\0V1\0
```

Tool/capability strings must be length-bound in call/tool-set identities or be embedded in a canonical versioned object whose unambiguous JCS structure provides equivalent framing.

A decision identity must bind its exact canonical versioned decision object.

The pipeline result identity must bind at least:

```text
baseToolSetIdentity
effectiveToolSetIdentity
originalCallIdentity
finalCallIdentity
orderedDecisionIdentities
blocked
inputChanged
requiresK2Reevaluation
```

No clock, randomness, UUID, environment, filesystem, process state, session object, object identity, locale, or platform newline may participate.

---

## 16. Bounds

R3A must impose explicit bounds at least equivalent to:

```text
pipeline JSON UTF-8 bytes: <= 262144
base tools: <= 256
name UTF-8 bytes: 1..160
capability UTF-8 bytes: 1..160
decisions: <= 128
decisionId UTF-8 bytes: 1..160
stageId UTF-8 bytes: 1..160
input canonical UTF-8 bytes: <= 131072
maximum JSON nesting depth: 64
maximum aggregate input array elements + object members: 8192
bounded reason/category code UTF-8 bytes: <= 160
```

Limit+1 must fail closed.

---

## 17. No permission/authority vocabulary

R3A public result must not contain fields semantically equivalent to:

```text
allowed
approved
policyAllowed
permissionGranted
sandboxed
safeToExecute
provenReady
```

The result may say only structural facts such as:

```text
blocked
inputChanged
requiresK2Reevaluation
effectiveTools
identities
```

A non-blocked R3A result means only:

```text
THE DECLARATIVE GUARD REDUCER DID NOT NARROW THIS CALL TO BLOCKED.
```

It does **not** mean K2 will allow execution.

---

## 18. No arbitrary hook execution

Production R3A source must have no authority to:

```text
execute callbacks
import/execute user modules
spawn commands/processes
read hook configuration files
scan workspace/home directories
call network
read environment/credentials
write files
access Git
emit session events
call models
execute tools
invoke RuntimeOrchestrator
invoke ExecutionGateway
approve actions
change policy
change confinement
change Done Gate
```

Expected production import surface should be limited to deterministic standard-library primitives such as `node:crypto` unless a separately justified pure dependency is authorized.

---

## 19. Validation is narrowing, not authority

A future R3B adapter may convert tool-schema validation failures into declarative `block_call` or structured feedback evidence.

R3A establishes this invariant now:

```text
INVALID INPUT
  -> MAY NARROW/BLOCK

VALID INPUT
  -> DOES NOT CREATE ALLOW/PERMISSION
```

Agentica's validation-feedback pattern is therefore useful for quality/recovery but cannot bypass K2.

R3A itself does not execute JSON Schema validators from the registry and does not produce model-visible feedback.

---

## 20. Required focused tests

R3A focused tests must prove at minimum:

1. canonical base and predecessor claim identities;
2. DeepCode donor commit/tree/source blobs and MIT attribution;
3. Agentica secondary donor commit/reference/license pin;
4. exact version string(s);
5. primitive-string boundary rejects Proxy/accessor/toJSON without executing hooks;
6. malformed JSON fails closed;
7. duplicate JSON keys fail closed;
8. unknown top-level fields fail closed;
9. unknown decision fields fail closed;
10. unknown decision kind fails closed;
11. duplicate decision IDs fail closed;
12. duplicate base tool names fail closed;
13. call toolName/capability must exist in base set;
14. empty decision list returns identical base/effective tool set and call identities;
15. `observe` changes no structural authority state;
16. `remove_tool` produces a strict/equal subset and deterministic identity;
17. attempt to remove a nonexistent/mismatched capability fails closed;
18. no decision can add a tool;
19. no decision can change a capability;
20. no decision can change toolName;
21. `block_call` is monotonic and cannot be reversed;
22. input replacement keeps toolName/capability exact;
23. byte-identical canonical input replacement is a no-op;
24. semantic input change creates different input/call identities;
25. semantic input change sets `requiresK2Reevaluation=true`;
26. later decisions cannot clear `requiresK2Reevaluation`;
27. a removed call tool remains blocked/non-executable even if later input replacement is proposed;
28. phase-order violations fail closed;
29. deterministic declaration order reproduces identical result identities;
30. reordered non-commutative decisions produce a different result or fail consistently;
31. decision identity mutation/tampering fails closed if externally validated state is supported;
32. JCS vectors cover object-key order, `-0`, exponent/decimal spelling, escapes, Unicode, lone-surrogate rejection;
33. tool/capability delimiter-like and non-ASCII names cannot collide;
34. all byte/count/depth bounds fail at limit+1;
35. result contains no permission/approval/safe-to-execute field;
36. production module imports no fs/process/network/session/model/tool/K2 authority;
37. `model/turn.ts` remains byte-identical;
38. `runtime/orchestrator.ts` remains byte-identical;
39. `tools/registry.ts` remains byte-identical;
40. H2/R2B, K2, Done Gate, H5-R1A, and active loop surfaces remain byte-identical;
41. full runtime regression suite remains green.

---

## 21. R3B future integration requirements

A later H5-R3B authorization may integrate the proven reducer into active agent tool flow.

R3B must separately prove at minimum:

```text
MODEL-VISIBLE TOOL EXPOSURE FILTER
  -> effective tools only
  -> H2 request snapshot records exactly what provider saw

PROVIDER TOOL CALL
  -> declarative guard decisions
  -> optional same-tool input rewrite
  -> new call/input identity
  -> K2 evaluates the effective rewritten action
  -> no pre-rewrite K2 approval can authorize post-rewrite bytes

BLOCK DECISION
  -> tool is not executed
  -> canonical event/evidence
  -> optional model-visible feedback only through H2

POST-TOOL OBSERVATION
  -> cannot rewrite execution receipt/evidence

ADAPTER FAILURE
  -> explicit fail-closed or bounded non-authority semantics per adapter class
```

R3B must **not** introduce shell-command hooks or arbitrary workspace-discovered executable callbacks merely because DeepCode supports them.

External/plugin hook execution would require a separate extension/sandbox authority design.

---

## 22. Pre-ledger gate

Before the R3A evidence ledger may be added:

```text
changed paths ⊆ authorized paths 1-4
ledger absent
protected blobs exact
TypeScript typecheck PASS
focused R3A tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy tests PASS
K3 trigger-aware certification under canonical workflow path filters
review findings adjudicated
unresolved review threads = 0
manual exact-head monotonicity/security/authority review PASS
```

---

## 23. Evidence ledger

Only after pre-ledger PASS may this path be added:

```text
docs/planning/KODAC_KDO_H5_R3A_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_EVIDENCE_2026-08-15.md
```

The ledger must bind:

- authorization/base identities;
- canonical H5-R2B predecessor identity;
- DeepCode donor identities;
- Agentica study-donor identities;
- accepted pre-ledger head/tree/blobs;
- protected blobs;
- fixed tool-set/call/decision/result identity vectors;
- subset/monotonic block proof;
- input rewrite/new identity/K2-reevaluation proof;
- hostile-input proof;
- no-authority import proof;
- exact CI runs/jobs;
- K3 applicability evidence;
- review/security status;
- all non-claims.

After ledger addition, all pre-ledger results become historical and the ledger-bearing exact head requires fresh post-ledger certification.

---

## 24. Completion claim

Only after implementation + ledger + post-ledger certification + expected-head canonical merge may Kodac make:

```text
KODAC_MONOTONIC_GUARDED_TOOL_PIPELINE_PRIMITIVE_PROVEN
```

This means only that the pure declarative reducer has been proven.

It does not mean guarded pipeline integration is active.

---

## 25. Explicit non-claims

H5-R3A does **not** claim or authorize:

- active tool filtering in provider requests;
- active pre-tool hooks;
- active post-tool hooks;
- shell/command hooks;
- workspace-discovered executable hooks;
- plugin execution;
- user code callback execution;
- permission grants;
- K2 bypass;
- approval override;
- confinement changes;
- result/receipt rewriting;
- H2 feedback injection;
- stop-hook continuation authority;
- Done Gate override;
- model-based compaction;
- subagents;
- background jobs;
- worktree workers;
- writable memory;
- Git/workspace mutation authority;
- H5-R3B completion;
- H5 completion;
- H6 readiness;
- `PROVEN_READY`.

DeerFlow, LLM Space, and delegate-skills remain later orchestration/evaluation/delegation donors and are not imported or authorized here.

---

## 26. Authorization truth

```text
IF CANONICAL:

AUTHORIZED NEXT ACTION:
IMPLEMENT ONLY H5-R3A WITHIN PATHS 1-4

LEDGER:
BLOCKED UNTIL PRE-LEDGER PASS

ARBITRARY CALLBACKS / COMMAND HOOKS:
BLOCKED

AGENT TURN / TOOL EXECUTION INTEGRATION:
BLOCKED UNTIL R3B

K2 / APPROVAL / CONFINEMENT / DONE-GATE CHANGE:
BLOCKED

H6:
NOT AUTHORIZED
```

Status:

```text
KDO_H5_R3A_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
