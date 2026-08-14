# KDO-H5-R2A — Consecutive Repeat-Call Signal Primitive Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R2A

NAME:
CONSECUTIVE REPEAT-CALL SIGNAL PRIMITIVE

CANONICAL AUTHORIZATION BASE:
7614854f2ca5e3cb05130c9da2ed322cacf7fd07

CANONICAL AUTHORIZATION BASE TREE:
17072704790a94ca797ea9d7a15ae52c632d13b4

IMPLEMENTATION AUTHORITY IF THIS DOCUMENT BECOMES CANONICAL:
ONE PURE TYPESCRIPT REPEAT-CHAIN STATE-TRANSITION PRIMITIVE + TESTS + ATTRIBUTION

AGENT LOOP INTEGRATION:
NOT AUTHORIZED

H2 HISTORY / EVENT SOURCE CHANGE:
NOT AUTHORIZED

MODEL-VISIBLE REMINDER TEXT:
NOT AUTHORIZED

HARD DUPLICATE-GUARD CHANGE:
NOT AUTHORIZED
```

H5-R2A ports only the useful state-machine concept behind DeepCode's advisory repeat-call tracker. It intentionally does not import the donor's runner integration or prompt text.

The target invariant is:

```text
SAME TOOL + SAME CANONICAL INPUT, CONSECUTIVELY
  -> DETERMINISTIC CHAIN COUNT / SIGNAL

DIFFERENT CALL
  -> CHAIN RESET

SIGNAL
  != EXECUTION BLOCK
  != POLICY DECISION
  != H2 HISTORY
  != MODEL MESSAGE
```

---

## 2. Why this is not redundant with current Kodac

Canonical Kodac already has two hard loop protections in `BoundedAgentLoop`:

```text
maxIdenticalToolCalls
  -> global fingerprint count across a run
  -> hard stop reason: duplicate_tool_call

maxRepeatedTurnSignatures
  -> repeated turn signature detection
  -> hard stop reason: cycle_detected
```

Current canonical sources:

```text
packages/kodac-runtime/src/agent/loop.ts
blob a5b7c2bbb2a5f7658f683e7baf45655b41b775f8

packages/kodac-runtime/test/agent-loop.test.ts
blob f65da5b50d7a4589a1f88401528ffdd96417d388
```

These protections remain canonical and unchanged.

DeepCode contributes a different behavior: a **soft consecutive-chain signal** that can tell a future model-visible recovery layer that the same call is being repeated, while leaving execution authority to the existing hard guard/K2 stack.

H5-R2A therefore does **not** replace, relax, or re-interpret the existing hard guards.

---

## 3. DeepCode donor pin

```text
Repository:
HKUDS/DeepCode

Pinned commit:
287510fbf6820147a48adf79f7fd86b0ed1afe92

Pinned tree:
7f44b320f86d04d4315242fabc74f1b325829be8

Primary source path:
core/agent_runtime/repeat_guard.py

Primary source blob:
37c24894cdbe7e647bdcbe45d055a1fd48b30777

Runner integration reference:
core/agent_runtime/runner.py

Runner blob:
645ab82f768214cce0794984c4bc9b92b099ce5a

Root license:
MIT

Root LICENSE blob:
b3ba37ce442298d5bdec96e2e52a8a812a25f123

Intake mode:
PORT
```

Observed donor behavior:

- tracks runs of consecutive same-tool/same-canonical-arguments calls;
- resets the chain when name or canonical arguments change;
- can emit escalating reminders at configured thresholds;
- counts denied/failed calls when observed at the result boundary;
- reminder is advisory, not a circuit breaker;
- full canonical arguments form the chain key while a bounded preview may be shown to the model.

Kodac will not port the donor's raw prompt text, Python mutable tracker class, permissive `default=str` canonicalization, or raw argument preview.

---

## 4. H2 boundary discovered during audit

DeepCode's runner appends the reminder as a model-visible `role=user` message after tool results.

Current Kodac H2-R2 history source vocabulary is closed to:

```text
assistant_response
tool_result
recovery_system
```

Canonical H2 source:

```text
packages/kodac-runtime/src/session/model-visible-history.ts
blob 6b348a7ce9bfcc7b49463bad5fddae8a445f8135
```

Therefore directly injecting a repeat reminder in `BoundedAgentLoop` would either:

1. create model-visible context not reconstructable from canonical H2 evidence; or
2. require an explicit H2 contract/source change.

Neither is authorized in R2A.

A future H5-R2B may define the canonical model-visible advisory record/message semantics. R2B requires separate authorization.

---

## 5. Authorized implementation paths

If this authorization becomes canonical, exactly these later implementation paths are authorized for H5-R2A:

```text
1. packages/kodac-runtime/src/agent/repeat-call-signal.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/THIRD_PARTY_NOTICES.md
4. packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
5. docs/planning/KODAC_KDO_H5_R2A_CONSECUTIVE_REPEAT_CALL_SIGNAL_EVIDENCE_2026-08-15.md
```

Path #5 is the evidence ledger and must remain absent until the pre-ledger implementation gate passes.

No other path is authorized.

---

## 6. Protected surfaces

The following must remain byte-identical through H5-R2A implementation:

```text
packages/kodac-runtime/src/agent/loop.ts
a5b7c2bbb2a5f7658f683e7baf45655b41b775f8

packages/kodac-runtime/test/agent-loop.test.ts
f65da5b50d7a4589a1f88401528ffdd96417d388

packages/kodac-runtime/src/session/model-visible-history.ts
6b348a7ce9bfcc7b49463bad5fddae8a445f8135

packages/kodac-runtime/src/session/model-visible-request.ts
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

packages/kodac-runtime/src/protocol/event.ts
ef402bb2cc0364122e6b79a3090b1cb8eed0ee85

packages/kodac-runtime/src/model/turn.ts
401d796b929d350046128371fee4ba719d0d56c9

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

`src/index.ts` and `THIRD_PARTY_NOTICES.md` may change only for export/attribution of the R2A primitive.

---

## 7. Required design: explicit pure state transition

Kodac must not port a hidden mutable tracker object as the authority-bearing representation.

The preferred contract is equivalent in purpose to:

```text
advanceRepeatCallSignal(previousState, currentCall, policy)
  -> immutable nextState + optional immutable advisorySignal
```

The transition must be deterministic and side-effect free.

State must be explicit input/output so:

- replay reproduces the same result;
- tests need no hidden instance state;
- a future R2B can bind state/signal identities into canonical evidence;
- concurrency/session ownership can remain outside this primitive.

Exact TypeScript names may vary if these semantics remain unambiguous.

---

## 8. Call equivalence

Two observed calls belong to the same consecutive chain only when both are equal:

```text
tool name
canonical tool input
```

Tool-call transport IDs must **not** affect equivalence because providers normally issue a new call ID for each attempt.

Canonicalization must be stricter than the donor's `json.dumps(..., default=str)` fallback.

Requirements:

- JSON-compatible input only;
- deterministic recursive object-key ordering;
- array order preserved;
- no `undefined`, NaN, Infinity, BigInt, functions, symbols, accessors, proxies, cyclic objects, sparse arrays, hidden structural fields, or `toJSON` execution;
- explicit bounds on nesting/items/bytes;
- canonical input SHA-256 identity;
- call fingerprint binds tool name + canonical input identity.

The primitive must fail closed rather than stringify unsupported runtime objects.

---

## 9. Consecutive-chain semantics

For state `S` and current call `C`:

```text
if C.fingerprint == S.lastCallFingerprint:
  consecutiveCount = S.consecutiveCount + 1
else:
  consecutiveCount = 1
  chain resets to C
```

Required properties:

- only **consecutive** repeats increment the same chain;
- A, A, B, A yields counts 1, 2, 1, 1;
- different arguments reset even when the tool name is unchanged;
- different tool name resets even when arguments are identical;
- provider call ID changes do not reset the chain;
- the primitive does not know whether a tool call was allowed, denied, failed, or succeeded; a future integration layer decides which observed result boundaries feed it.

---

## 10. Threshold policy

R2A may support a strict bounded ordered set of advisory thresholds.

The canonical implementation policy must enforce at least:

```text
threshold >= 2
thresholds unique
thresholds strictly ascending after canonicalization
threshold count bounded
maximum threshold bounded
```

R2A must not copy DeepCode's `(3, 5, 8)` as an unconditional Kodac default.

Reason: canonical Kodac's current default hard duplicate limit is lower; a reminder threshold that cannot be reached before the hard stop is useless.

The pure R2A primitive may expose generic thresholds, but **future R2B integration must prove that its first advisory threshold is reachable before the configured hard duplicate stop**.

R2A does not modify `DEFAULT_AGENT_LOOP_LIMITS`.

---

## 11. No reminder text and no raw argument preview

R2A must return structured signal data only.

It must not emit or embed donor prompt text.

It must not include a raw argument preview by default.

Reason:

- tool arguments may contain sensitive values;
- model-visible preview/redaction policy belongs to R2B;
- structural detection needs the canonical full argument identity, not human-readable arguments.

A signal may include only evidence-safe fields such as:

```text
version
policyIdentity
toolName
toolInputIdentity
callFingerprint
consecutiveCount
threshold
tier/index
priorStateIdentity
nextStateIdentity
signalIdentity
```

Exact fields may be narrower, but no field may grant authority.

---

## 12. Deterministic identities

At minimum R2A must provide deterministic structural identities for:

- canonical policy;
- canonical tool input;
- call fingerprint;
- repeat state;
- emitted signal.

Identities must use SHA-256 and canonical preimages.

No clock, UUID, randomness, process state, environment state, filesystem state, session object, or provider object identity may participate.

---

## 13. State validation and immutability

The primitive must validate externally supplied prior state rather than trusting it.

Requirements:

- exact version;
- exact keys;
- bounded count;
- valid SHA-256 identities;
- derived state identity recomputation;
- malformed/impossible state rejected;
- state and signal outputs immutable/defensive snapshots;
- caller inputs not mutated.

An empty/initial state must have one canonical representation.

---

## 14. No execution authority

Production R2A source must have no authority to:

```text
execute tools
block tools
change tool limits
modify BoundedAgentLoop
emit session events
append H2 history
create model-visible messages
call models
read/write files
spawn processes
call network
read environment/credentials
access Git
change K2 policy
approve actions
change confinement
change Done Gate
```

R2A is observation/classification data only.

---

## 15. Required focused tests

The R2A focused test must prove at minimum:

1. exact DeepCode donor provenance pin/license/source blob;
2. deterministic strict policy identity;
3. empty/initial state canonicality;
4. first observation count = 1, no signal unless threshold=1 is somehow attempted (which must be rejected);
5. same tool + same semantic input increments consecutive count;
6. object-key ordering does not change call fingerprint;
7. changed provider call ID does not change equivalence;
8. same tool + changed input resets chain;
9. changed tool + same input resets chain;
10. A,A,B,A => 1,2,1,1;
11. threshold crossing emits exactly one structural signal at each configured threshold;
12. non-threshold counts emit no signal;
13. signal contains no raw full argument payload/preview;
14. policy/state/signal outputs are immutable;
15. repeated identical transitions produce identical structural identities;
16. prior-state identity mutation fails closed;
17. impossible count/identity combinations fail closed;
18. unknown state/policy/call fields fail closed;
19. invalid JSON primitives fail closed;
20. cyclic/deep/proxy/accessor/hidden/symbol/sparse inputs fail closed without executing hooks;
21. item/byte/depth bounds fail closed;
22. production module has no filesystem/process/network/session/model/tool-execution authority;
23. `agent/loop.ts`, H2 surfaces, H5-R1A pruning module, K2, and Done Gate remain byte-identical.

---

## 16. Future R2B requirements

A later H5-R2B may integrate the signal into the active loop only after separately authorizing H2 semantics.

At minimum R2B must solve:

```text
observed repeated result boundary
  -> R2A signal
  -> canonical durable H2 history/evidence record
  -> bounded model-visible advisory message
  -> next model.request.snapshot reconstructs exactly
```

R2B must also define:

- whether denied/failed tool attempts count and which canonical event proves that outcome;
- user vs system role for advisory text;
- redaction policy for any optional argument description;
- interaction with `maxIdenticalToolCalls`;
- guarantee first advisory threshold occurs before the hard stop;
- sink failure semantics;
- no hidden prompt injection outside H2.

R2B is outside this authorization.

---

## 17. Pre-ledger gate

Before the evidence ledger may be added, the implementation candidate must satisfy:

```text
changed paths ⊆ authorized paths 1-4
ledger absent
protected blobs exact
TypeScript typecheck PASS
focused R2A tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy tests PASS
K3-R4 PASS
K3-R5 PASS
review findings adjudicated
unresolved review threads = 0
manual exact-head security/authority review PASS
```

---

## 18. Evidence ledger

Only after pre-ledger PASS may this path be added:

```text
docs/planning/KODAC_KDO_H5_R2A_CONSECUTIVE_REPEAT_CALL_SIGNAL_EVIDENCE_2026-08-15.md
```

The ledger must bind:

- authorization/base identities;
- DeepCode donor identities;
- accepted pre-ledger head/tree/blobs;
- protected blobs;
- policy/state/call/signal sample identities;
- A,A,B,A reset proof;
- hostile-input proof;
- exact CI runs/jobs;
- review/security status;
- all non-claims.

After ledger addition, all pre-ledger checks become historical and exact post-ledger certification is required.

---

## 19. Completion claim

Only after implementation + ledger + post-ledger certification + expected-head merge may Kodac make the bounded claim:

```text
KODAC_CONSECUTIVE_REPEAT_CALL_SIGNAL_PRIMITIVE_PROVEN
```

This claim means only that a pure deterministic consecutive-repeat state transition/signal primitive has been proven.

---

## 20. Explicit non-claims

H5-R2A does **not** claim or authorize:

- active repeat reminders;
- model-visible reminder text;
- H2 history source expansion;
- changes to the hard duplicate guard;
- changes to repeated-turn cycle detection;
- different loop stop semantics;
- tool execution changes;
- K2 changes;
- policy/approval/confinement changes;
- H5-R1A changes;
- context pruning integration;
- model summarization;
- subagents;
- background jobs;
- memory writes;
- filesystem/Git/worktree writes;
- KRI changes;
- Done Gate changes;
- `PROVEN_READY`;
- H5 completion;
- H6 readiness.

---

## 21. Authorization truth

```text
IF CANONICAL:

AUTHORIZED NEXT ACTION:
IMPLEMENT ONLY H5-R2A WITHIN PATHS 1-4

LEDGER:
BLOCKED UNTIL PRE-LEDGER PASS

LOOP INTEGRATION:
BLOCKED

H2 MODIFICATION:
BLOCKED

MODEL-VISIBLE REMINDER:
BLOCKED

HARD DUPLICATE-GUARD CHANGE:
BLOCKED
```

Status:

```text
KDO_H5_R2A_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
