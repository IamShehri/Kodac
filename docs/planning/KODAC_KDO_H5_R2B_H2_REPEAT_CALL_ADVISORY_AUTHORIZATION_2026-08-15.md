# KDO-H5-R2B — H2-Bound Repeat-Call Advisory Integration Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R2B

NAME:
H2-BOUND REPEAT-CALL ADVISORY INTEGRATION

CANONICAL AUTHORIZATION BASE:
f1e901f164920b4e2c78b72596744513cd7cfc94

CANONICAL AUTHORIZATION BASE TREE:
735468aede25f9b7acb236349d521f61fc259852

H5-R2A CANONICAL CLAIM:
KODAC_CONSECUTIVE_REPEAT_CALL_SIGNAL_PRIMITIVE_PROVEN

IMPLEMENTATION AUTHORITY IF THIS DOCUMENT BECOMES CANONICAL:
ONE BOUNDED H2-RECONSTRUCTABLE SYSTEM ADVISORY INTEGRATION OF THE PROVEN R2A PRIMITIVE

TOOL EXECUTION AUTHORITY:
UNCHANGED / K2 ONLY

HARD DUPLICATE-GUARD AUTHORITY:
UNCHANGED

MODEL-VISIBLE HIDDEN PROMPTS:
FORBIDDEN

DENIED / FAILED ATTEMPT COUNTING:
NOT AUTHORIZED

USER-ROLE ADVISORY IMPERSONATION:
NOT AUTHORIZED
```

R2B completes only the active integration half of H5-R2. It connects the already-proven pure consecutive-repeat signal to canonical H2 model-visible history without changing K2 execution authority or the existing hard duplicate/cycle guards.

The target invariant is:

```text
SUCCESSFULLY COMPLETED CANONICAL TOOL CALL / RESULT
  -> R2A CONSECUTIVE STATE TRANSITION
  -> OPTIONAL R2A THRESHOLD SIGNAL
  -> SPECIALIZED CANONICAL H2 ADVISORY RECORD
  -> EXACT BOUNDED SYSTEM MESSAGE
  -> NEXT MODEL REQUEST RECONSTRUCTS THAT MESSAGE FROM H2 EVIDENCE

NO CANONICAL ADVISORY RECORD
  -> NO ADVISORY MAY REACH THE MODEL
```

---

## 2. Why R2B exists

Canonical H5-R2A deliberately stopped before loop integration because direct donor-style reminder injection would have violated Kodac's H2 model-visible reconstructability boundary.

R2A proved only:

```text
previous state + serialized current call + policy
  -> deterministic next state + optional structural signal
```

It did **not** authorize:

- `BoundedAgentLoop` integration;
- session event emission;
- H2 history vocabulary changes;
- model-visible reminder text;
- changes to the hard duplicate guard.

R2B exists to make one advisory model-visible only when the same advisory is durably represented in canonical H2 evidence.

---

## 3. Canonical predecessor identities

### 3.1 H5-R2A

```text
R2A authorization path:
docs/planning/KODAC_KDO_H5_R2A_CONSECUTIVE_REPEAT_CALL_SIGNAL_AUTHORIZATION_2026-08-15.md

R2A authorization blob:
6621413f10267d51f2ca689467a7a0ae7f9653d1

R2A evidence path:
docs/planning/KODAC_KDO_H5_R2A_CONSECUTIVE_REPEAT_CALL_SIGNAL_EVIDENCE_2026-08-15.md

R2A evidence blob:
88fb5de0e2f84c455219c4a3afb9c836d33e11bc

R2A canonical merge:
f1e901f164920b4e2c78b72596744513cd7cfc94

R2A canonical tree:
735468aede25f9b7acb236349d521f61fc259852

R2A production primitive:
packages/kodac-runtime/src/agent/repeat-call-signal.ts

R2A production blob:
5d109b9dad5063939cbffeba74a4916cdae0bc18
```

The R2A primitive, its SHA-256 preimages, fixed identity vectors, input bounds, saturation behavior, and no-authority semantics are canonical and may not be reinterpreted by R2B.

### 3.2 H2-R2

```text
Canonical H2 history source:
packages/kodac-runtime/src/session/model-visible-history.ts

Current blob:
6b348a7ce9bfcc7b49463bad5fddae8a445f8135

Canonical H2 evidence:
docs/planning/KODAC_KDO_H2_R2_EVENT_DERIVED_MODEL_HISTORY_EVIDENCE_2026-08-14.md

Evidence blob:
8bf87b597586a11e50b2ec5acddbe57271e6aa93
```

H2-R2 proves:

```text
next-turn model-visible messages == projection(canonical H2 session evidence)
```

R2B must preserve that invariant exactly.

---

## 4. DeepCode donor integration reference

```text
Repository:
HKUDS/DeepCode

Pinned commit:
287510fbf6820147a48adf79f7fd86b0ed1afe92

Pinned tree:
7f44b320f86d04d4315242fabc74f1b325829be8

Repeat primitive source:
core/agent_runtime/repeat_guard.py
blob 37c24894cdbe7e647bdcbe45d055a1fd48b30777

Runner integration reference:
core/agent_runtime/runner.py
blob 645ab82f768214cce0794984c4bc9b92b099ce5a

License:
MIT
```

Observed donor runner behavior:

- observes repeated calls after tool-result production;
- can count failed/denied results;
- appends reminder text after tool results;
- uses a model-visible `role=user` reminder;
- optionally reports model-visible injected context to a host sink;
- swallows host context-note sink failure.

Kodac does **not** copy those authority/evidence choices.

R2B intentionally differs:

```text
DEEPCODE USER REMINDER
  -> REJECTED
  -> KODAC SYSTEM ADVISORY

DEEPCODE FAILED / DENIED COUNTING
  -> NOT PORTED IN R2B

DEEPCODE BEST-EFFORT NOTE SINK
  -> REJECTED
  -> KODAC MODEL-VISIBLE EVIDENCE PERSISTENCE FAILURE ABORTS CONTINUATION
```

---

## 5. Current canonical loop and H2 boundary

Current canonical loop:

```text
packages/kodac-runtime/src/agent/loop.ts
blob a5b7c2bbb2a5f7658f683e7baf45655b41b775f8
```

Current hard protection defaults:

```text
maxIdenticalToolCalls = 2
maxRepeatedTurnSignatures = 2
```

The identical-call guard is global across one run and remains a hard stop:

```text
duplicate_tool_call
```

Current H2 generic history source vocabulary remains:

```text
assistant_response
tool_result
recovery_system
```

R2B must **not** overload `recovery_system`, weaken its exact semantics, or widen this generic source enum merely to fit a repeat advisory.

Current event protocol:

```text
packages/kodac-runtime/src/protocol/event.ts
blob ef402bb2cc0364122e6b79a3090b1cb8eed0ee85
```

R2B therefore authorizes one explicit specialized H2 event instead of pretending the advisory is an existing generic source.

---

## 6. Authorized implementation paths

If this authorization becomes canonical, exactly these later implementation paths are authorized:

```text
1. packages/kodac-runtime/src/agent/repeat-call-signal.ts
2. packages/kodac-runtime/src/session/model-visible-history.ts
3. packages/kodac-runtime/src/protocol/event.ts
4. packages/kodac-runtime/src/agent/loop.ts
5. packages/kodac-runtime/test/kdo-h5-r2b-repeat-call-advisory-history.test.ts
6. packages/kodac-runtime/test/agent-loop.test.ts
7. docs/planning/KODAC_KDO_H5_R2B_H2_REPEAT_CALL_ADVISORY_EVIDENCE_2026-08-15.md
```

Path #7 is the evidence ledger and must remain absent until the pre-ledger implementation gate passes.

No other path is authorized.

In particular, R2B does not require an `index.ts` edit because current wildcard exports already expose the R2A and H2 modules.

R2B does not require a third-party notice edit because the canonical R2A notice already pins both the DeepCode repeat source and runner integration reference.

---

## 7. Protected surfaces

The following must remain byte-identical throughout R2B implementation:

```text
packages/kodac-runtime/src/model/turn.ts
401d796b929d350046128371fee4ba719d0d56c9

packages/kodac-runtime/src/session/session.ts
d5f2334b18e89f7bac2bac7422ed8a33669b8afd

packages/kodac-runtime/src/session/model-visible-request.ts
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

packages/kodac-runtime/src/agent/tool-result-pruning.ts
66cfee69032c4c24331e8cb9098a86a1d7b9135e

packages/kodac-runtime/src/trust/policy.ts
b4134e430204123bebe053ffc9105f05fca611c9

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

packages/kodac-runtime/src/index.ts
9eeb08bfa6f1f54d0ccdf27029f7c34a56de1fca

packages/kodac-runtime/THIRD_PARTY_NOTICES.md
f89c7812b699211d24425d70291569d61fc4f2a9

packages/kodac-runtime/package.json
af4c20a3dae387c15cc5fb2eb28d415c8f115b95

packages/kodac-runtime/scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7

packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
4d6893b993836eec74e6b6a277513a53994ecf8a
```

R2B may modify only the authorized H2 history module, event vocabulary, loop, additive R2A serialization surface, and the two R2B/loop tests listed in section 6.

---

## 8. R2A preservation rule

R2B may make only **additive serialization/validation changes** to the canonical R2A primitive.

R2B must not change:

- R2A policy/call/state/signal version strings;
- accepted JSON input semantics;
- canonicalization rules;
- bounds;
- SHA-256 domain prefixes;
- identity preimages;
- fixed identity vectors;
- consecutive-chain semantics;
- saturation behavior;
- existing `advanceRepeatCallSignal(...)` transition semantics.

The additive purpose is to let H2 safely carry and independently validate an R2A signal as serialized canonical evidence.

The equivalent authorized additions are:

```text
RepeatCallTransition.advisorySignalJson: string | null

serializeRepeatCallAdvisorySignal(signal)
  -> canonical JSON text

validateRepeatCallAdvisorySignalJson(serializedSignal)
  -> validated immutable R2A advisory signal
```

Exact TypeScript names may vary, but the behavior must remain equivalent.

The validator must:

- require a primitive string before parsing;
- impose an explicit small UTF-8 byte bound;
- use the existing strict R2A JSON parser/canonicalizer;
- require exact signal keys and exact signal version;
- validate all SHA-256 fields;
- validate integer/count/threshold/index bounds;
- recompute `signalIdentity` using the existing canonical R2A SIGNAL preimage;
- reject unknown fields and derived-field mismatch;
- return an immutable defensive value;
- execute no caller hook/coercion/reflection.

Recommended maximum serialized signal size:

```text
4096 UTF-8 bytes
```

Existing R2A fixed identity-vector tests must remain exact.

---

## 9. Fixed R2B integration policy

R2B does not expose a second user-configurable threshold plane.

The active integration policy is exactly:

```json
{"thresholds":[2],"version":"kodac-repeat-call-policy-v1"}
```

Its canonical R2A policy identity is:

```text
7331f353c9a29af123cd54fa99453768b35fe2534db5d009df9dae67cdc80222
```

A model-visible R2B advisory record must reject any signal whose:

```text
policyIdentity != 7331f353c9a29af123cd54fa99453768b35fe2534db5d009df9dae67cdc80222
threshold != 2
thresholdIndex != 0
consecutiveCount != 2
```

This keeps active semantics single-purpose while preserving generic threshold support inside the pure R2A primitive for separately authorized future use.

---

## 10. Interaction with the existing hard duplicate guard

R2B does not modify:

```text
DEFAULT_AGENT_LOOP_LIMITS.maxIdenticalToolCalls
DEFAULT_AGENT_LOOP_LIMITS.maxRepeatedTurnSignatures
tool hard-stop reasons
hard-guard fingerprint authority
```

With the canonical default `maxIdenticalToolCalls = 2`:

```text
first identical completed call
  -> R2B consecutive count 1
  -> no advisory

second immediately consecutive identical completed call
  -> R2B consecutive count 2
  -> canonical advisory emitted after results

next model request
  -> sees canonical advisory

third identical attempt
  -> existing hard duplicate guard may stop it before execution
```

The advisory therefore has one model turn in which it can influence behavior before a fresh third identical attempt under the default configuration.

If `maxIdenticalToolCalls = 1`, R2B active observation is disabled for that run because threshold `2` is unreachable. Existing hard-stop behavior remains unchanged.

If `maxIdenticalToolCalls > 2`, threshold `2` remains the sole R2B advisory threshold and the hard guard remains authoritative later.

Important conservative edge case:

The current hard guard counts identical fingerprints globally across the run, while R2A counts only a consecutive chain. Therefore an earlier non-consecutive occurrence can consume hard-guard budget and cause the global hard guard to stop a later chain before that later chain reaches consecutive count `2`.

Example:

```text
A, B, A, A-attempt
```

With hard limit `2`:

- first `A` is allowed;
- `B` resets R2B's consecutive state;
- second total `A` is allowed but is consecutive count `1` after the reset;
- the next `A` attempt can be stopped by the existing global hard guard before R2B reaches count `2`.

R2B must **not** relax or reinterpret the hard guard to force an advisory to appear. Missing an advisory is preferable to weakening a canonical hard stop.

---

## 11. Which tool attempts count

R2B advances consecutive-repeat state only for a tool call whose result is part of a successfully returned `AgentTurnResult` and is about to be represented by canonical H2 assistant/tool-result history.

R2B does **not** count:

- a call rejected by the existing hard duplicate guard;
- a K2/policy/approval/confinement denial that causes the turn to fail rather than return a canonical tool result;
- a tool execution failure that causes `AgentTurnRunner.run(...)` to throw;
- a cancelled/aborted turn;
- a timed-out turn;
- a malformed/mismatched call/result pair;
- an observation that R2A cannot represent under its strict serialized boundary.

Reason:

A state transition that can create future model-visible context must not depend on an attempt whose corresponding completed call/result evidence is absent from canonical H2 history.

This is intentionally narrower than DeepCode's result-boundary counting.

Future errors-as-data or denial-as-canonical-result semantics may authorize broader observation later, but not in R2B.

---

## 12. Failure resets the consecutive chain

R2B repeat state is scoped to one `BoundedAgentLoop.run(...)` invocation.

It starts as the canonical R2A empty state:

```text
null
```

If a model/tool turn fails before it returns a complete eligible tool-call/result set, R2B resets its local state to `null` before the existing recovery path continues.

Therefore:

```text
A success
-> failed/denied/aborted eligible turn boundary
-> A success
```

must not become an R2B consecutive chain of length `2`.

This state reset changes no K2 or hard-guard counters. The existing hard guards retain their own current semantics.

R2B state is not persisted as a new restart/resume facility. Canonical H2 still makes no JSONL restart/resume or full-process event-sourcing claim.

---

## 13. Reuse the existing serialized tool-input pass

Current `BoundedAgentLoop.beforeToolCall(...)` already serializes provider tool input to compute the canonical existing hard-guard fingerprint.

R2B must not add an independent second reflective walk over provider-owned tool-input objects merely to feed R2A.

The loop should refactor the existing hard-guard path purpose-equivalently to:

```text
serializedInput = stableSerialize(call.input)
hardFingerprint = sha256(toolName + separator + serializedInput)
store serializedInput by unique call id for this returned turn
```

Then, after successful tool results return, R2B builds R2A's serialized call text from:

```text
exact call version
JSON-escaped tool name
already-captured serializedInput
```

This reuses evidence already needed by the existing guard rather than creating another raw input traversal.

If R2A rejects the serialized observation because it is outside R2A's stricter canonical profile, the advisory state resets and no advisory is emitted. The successful tool result still follows the pre-existing H2 path.

Observation-classification failure must not become new tool-execution authority.

---

## 14. Completed call/result pairing

For a successful returned turn, R2B requires an eligible observed pair to agree on:

```text
toolCalls.length == toolResults.length

for each provider-order index i:
toolCalls[i].id == toolResults[i].id
toolCalls[i].name == toolResults[i].name
captured serialized input exists for toolCalls[i].id
```

If the returned turn violates this internal invariant, R2B must not invent or misbind an advisory.

The implementation may fail the history append or conservatively reset/skip advisory observation, but it may not bind a signal to a different tool result.

The preferred implementation is fail-closed before any R2B advisory record is created while leaving existing generic H2 correctness checks intact.

---

## 15. Provider-order transition and multi-call batches

Eligible completed pairs are processed through R2A in provider order.

A different call resets the consecutive chain exactly as R2A already proves.

R2B keeps at most one pending model-visible advisory for the **final active chain** of a successful provider batch.

Rule:

```text
when a threshold signal is crossed:
  pending advisory = that signal

when a later call in the same batch changes the active call fingerprint:
  pending advisory = null

when later calls preserve the same fingerprint:
  keep the pending advisory
```

Examples:

```text
A, A
  -> threshold 2 reached
  -> one advisory

A, A, A
  -> threshold 2 reached
  -> final chain is still A
  -> one advisory

A, A, B
  -> threshold 2 reached, then chain resets to B
  -> no stale A advisory after the batch

A, A, B, A, A
  -> first pending A advisory cleared by B
  -> second A chain reaches threshold 2
  -> one advisory for the final active A chain
```

The model cannot react between tool calls already returned in one provider batch, so suppressing an advisory for a chain that was already reset before the next model request avoids stale model-visible guidance.

---

## 16. Specialized canonical H2 event

R2B authorizes exactly one new required model-history event type:

```text
model.history.repeat_call_advisory.appended
```

`KodacEventType` may add that exact string.

`projectModelVisibleHistory(...)` must explicitly recognize and validate this event before its existing fail-closed fallback for unknown `model.history.*` event types.

Unknown future `model.history.*` event vocabulary must continue to fail closed.

The specialized event must not reuse `model.history.message.appended` with a fake `recovery_system` source.

---

## 17. Specialized advisory history record

R2B should add a dedicated immutable record equivalent to:

```text
RepeatCallAdvisoryHistoryRecord
```

with one exact versioned schema.

Required semantic fields should bind at least:

```text
version

afterRequestIdentity

assistantHistoryRecordIdentity

toolResultHistoryRecordIdentity

signalJson
signalIdentity

message
messageBytes
messageIdentity

recordPreimageBytes
recordIdentity
```

Exact field names may vary only if the same evidence bindings remain explicit and deterministic.

The record must bind:

1. the current H2 request anchor;
2. the exact canonical assistant-response history record containing the tool call;
3. the exact canonical tool-result history record for the completed call that caused the final active chain to reach the advisory threshold;
4. the exact canonical serialized R2A signal;
5. the exact derived model-visible system advisory message.

The record constructor and validator must use exact keys, strict SHA-256 validation, explicit bounds, deterministic canonical preimages, derived-field recomputation, and immutable outputs.

A suggested version is:

```text
kodac-repeat-call-advisory-history-v1
```

The exact version chosen by implementation becomes part of the evidence contract and must be tested as a fixed value.

---

## 18. Source-record ordering and referential integrity

A repeat advisory is not free-floating history.

Projection must reject an advisory record unless, earlier in the same H2 projection and under the same current request anchor:

- the referenced assistant history record identity has already been validated;
- the referenced tool-result history record identity has already been validated.

Projection must maintain enough bounded in-memory identity state to prove those references while replaying the supplied event window.

The advisory event is appended only **after all generic assistant/tool-result history events for the successful returned batch**.

Therefore the final canonical ordering is:

```text
assistant_response history event
all tool_result history events
optional repeat_call_advisory history event
```

This preserves provider tool-call/result message ordering and avoids inserting a system message between a tool request and its required tool results.

---

## 19. Exact model-visible advisory

R2B uses a `role=system` advisory.

It must not use `role=user`, because Kodac must not impersonate the human user for runtime-generated control guidance.

The canonical R2B advisory content is exactly:

```text
Kodac advisory: the same tool call with the same canonical input completed twice consecutively. Reconsider the approach before issuing the same call again.
```

The message must be exactly equivalent to:

```json
{
  "role": "system",
  "content": "Kodac advisory: the same tool call with the same canonical input completed twice consecutively. Reconsider the approach before issuing the same call again."
}
```

It must contain no:

- tool name;
- tool-call id;
- raw arguments;
- argument preview;
- output content;
- policy reason;
- approval result;
- confinement result;
- donor prompt text;
- dynamic free-form text.

This makes the message bounded, injection-resistant, privacy-minimal, and derivable entirely from the validated fixed-threshold signal.

---

## 20. Advisory record validation

The specialized H2 record validator must reject unless:

- `afterRequestIdentity` is a lowercase SHA-256 identity;
- both source history record identities are lowercase SHA-256 identities;
- `signalJson` passes canonical R2A signal validation;
- signal policy identity equals the fixed R2B policy identity;
- signal threshold/index/count equal `2 / 0 / 2`;
- stored `signalIdentity` equals the validated R2A signal identity;
- stored message equals the exact canonical R2B system message;
- stored message bytes/identity recompute exactly;
- record preimage bytes/identity recompute exactly;
- final canonical record size stays under an explicit small bound;
- there are no unknown/undefined/accessor/symbol/hidden fields.

A suggested maximum record size is:

```text
8192 canonical UTF-8 bytes
```

No model call is used to produce or validate the advisory.

---

## 21. H2 projection behavior

For a valid advisory event, `projectModelVisibleHistory(...)` must append exactly the canonical system advisory message to the projected messages.

A later `model.request.snapshot` must therefore satisfy the existing H2 continuity check with that advisory included.

Projection must fail closed on:

- advisory before a request anchor;
- stale `afterRequestIdentity`;
- malformed/tampered record;
- invalid R2A signal;
- non-R2B policy identity;
- unsupported threshold/count/index;
- missing referenced assistant record;
- missing referenced tool-result record;
- source record from another anchor;
- duplicate/invalid event sequence under existing H2 rules;
- projection/message/content bounds;
- unknown required `model.history.*` event types.

A caller mutating a projected `ModelMessage` must not mutate the canonical advisory record.

---

## 22. Aggregate bounds before persistence

Current H2 loop behavior validates the aggregate model-visible message bound for a completed assistant/tool-result batch before persisting its first generic history event.

R2B must preserve and extend that property.

Before the first model-visible history event from a successful returned batch is emitted, the loop must include the optional advisory message in the aggregate bound calculation.

Therefore:

```text
assistant + all tool results + optional advisory
```

must fit H2 message/content bounds as one candidate batch before the first history append occurs.

An advisory must not create a late bound failure after the assistant/tool results have already been persisted merely because it was checked separately.

---

## 23. Evidence sink failure semantics

DeepCode swallows its optional context-note sink failure. Kodac R2B must not.

If persistence of a model-visible history event fails:

- `RuntimeSession` must continue its existing rule that only successfully appended events enter the in-process journal;
- R2B must not swallow the error;
- the loop must not issue another provider request using model-visible context that was not durably accepted by the event sink;
- no hidden advisory message may be pushed into a private message accumulator as a fallback;
- no best-effort advisory injection is allowed.

If assistant/tool-result events were already persisted and the later advisory sink append fails, the current run aborts before a next model request. The canonical journal may contain that successful partial append prefix, but it cannot diverge from a later provider-visible request because no later request occurs in that run.

The local R2B state is committed for continuation only after the complete candidate model-visible batch has persisted successfully.

---

## 24. Observation failure versus evidence failure

R2B distinguishes two failure classes.

### 24.1 Observation/classification unavailable

Examples:

- captured serialized call cannot satisfy stricter R2A JSON/canonical constraints;
- R2A rejects an otherwise already-executed call as an advisory observation.

Behavior:

```text
reset R2B local state
emit no repeat advisory
continue the pre-existing generic H2 path
```

Reason: the repeat advisory is efficiency guidance, not execution authority. An inability to classify an already-valid pre-existing tool execution must not invent a new execution denial.

### 24.2 Canonical advisory evidence failure

Once R2A has produced an eligible signal and R2B intends to make the advisory model-visible, any failure to construct, validate, bound, or persist its canonical H2 record is evidence-critical.

Behavior:

```text
fail / abort continuation before next provider request
```

No hidden or best-effort model-visible fallback is authorized.

---

## 25. No execution authority

R2B must not let the advisory path:

```text
execute a tool
block a tool
approve a tool
change K2 allow/ask/deny
change approval policy
change confinement
change tool limits
change hard duplicate counts
change cycle counts
retry a tool
rewrite tool input
rewrite tool output
call a model
read/write files
spawn processes
call network
read credentials/environment
access Git
change Done Gate
assert PROVEN_READY
```

The only active behavior R2B adds is:

```text
validated completed call/result evidence
  -> optional canonical H2 system advisory for a later model request
```

---

## 26. Required focused R2B tests

The new R2B focused test plus the authorized `agent-loop.test.ts` additions must prove at minimum:

1. canonical base, R2A predecessor, donor pins, and protected blobs are exact;
2. all existing R2A fixed policy/input/call/state/signal identity vectors remain unchanged;
3. R2A advisory signal serialization is canonical and deterministic;
4. arbitrary non-string Proxy/accessor/toJSON values are rejected by the new signal-JSON validator without executing hooks;
5. signal JSON unknown fields fail closed;
6. malformed SHA-256 fields fail closed;
7. mutated `signalIdentity` fails recomputation;
8. signal byte bound fails at limit + 1;
9. active integration policy is exactly `[2]` with identity `7331f353c9a29af123cd54fa99453768b35fe2534db5d009df9dae67cdc80222`;
10. advisory record rejects any other policy identity;
11. advisory record rejects threshold other than `2`;
12. advisory record rejects thresholdIndex other than `0`;
13. advisory record rejects consecutiveCount other than `2`;
14. advisory record has exact version and exact keys;
15. advisory record binds current request anchor;
16. advisory record binds the exact assistant history record identity;
17. advisory record binds the exact tool-result history record identity;
18. advisory record derives exactly the fixed system message;
19. advisory message contains no tool name, id, raw input, input preview, output, policy reason, or donor prompt text;
20. advisory message byte count and SHA-256 identity recompute exactly;
21. advisory record preimage size and identity recompute exactly;
22. advisory record final-size bound fails closed at limit + 1;
23. projection rejects advisory before request anchor;
24. projection rejects stale request anchor;
25. projection rejects missing assistant source record;
26. projection rejects missing tool-result source record;
27. projection rejects source records from a different anchor;
28. projection appends exactly one defensive-copy system advisory for a valid record;
29. later request snapshot including that advisory passes existing H2 continuity validation;
30. later request snapshot omitting/mutating that advisory fails H2 continuity validation;
31. unknown future `model.history.*` vocabulary still fails closed;
32. default loop first completed A call emits no advisory;
33. default loop second immediately consecutive completed A emits exactly one canonical advisory after all tool-result history events;
34. next provider request sees the exact advisory from H2 projection, not a private mutable message push;
35. third identical attempt remains governed by the existing hard `duplicate_tool_call` stop;
36. `maxIdenticalToolCalls=1` disables R2B observation and preserves existing hard-stop behavior;
37. `maxIdenticalToolCalls>2` still emits only threshold-2 advisory while preserving the later hard guard;
38. A,A,B,A yields no stale threshold advisory after the final reset chain;
39. A,A,B in one provider batch clears the pending stale A advisory;
40. A,A,A in one provider batch produces at most one advisory for the still-active final A chain;
41. A,A,B,A,A in one provider batch produces exactly one advisory for the final active A chain;
42. changed tool name resets the chain;
43. changed canonical input resets the chain;
44. provider call-id changes do not affect R2A equivalence;
45. completed call/result id mismatch cannot create an advisory bound to the wrong result;
46. completed call/result name mismatch cannot create an advisory bound to the wrong result;
47. failed tool/model turn resets R2B state and creates no repeat advisory;
48. denied/failed/aborted attempts that do not return canonical completed tool results do not advance R2B state;
49. observation/canonicalization rejection resets R2B state but does not add new tool-execution denial authority;
50. aggregate assistant + all tool results + advisory bounds are checked before first model-visible history append;
51. advisory event is ordered after all generic tool-result history events for the returned batch;
52. event-sink rejection while persisting the advisory aborts continuation before any next provider request;
53. sink rejection never causes hidden/private advisory injection;
54. local repeat state becomes continuation state only after the complete model-visible batch persists;
55. hard duplicate/cycle defaults and stop reasons remain unchanged;
56. R2B performs no additional raw provider-input reflection beyond reuse of the existing serialized hard-guard input;
57. `model/turn.ts`, RuntimeSession, H2-R1 request, H5-R1A pruning, K2 policy/gateway, Done Gate, package/scripts, index, notices, and existing H2-R2 test remain byte-identical;
58. full legacy/runtime regression suites remain green.

---

## 27. Pre-ledger gate

Before the R2B evidence ledger may be added, the implementation candidate must satisfy:

```text
changed paths ⊆ authorized paths 1-6
ledger absent
protected blobs exact
R2A fixed identity vectors exact
TypeScript typecheck PASS
focused R2B tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy tests PASS
K3-R4 PASS
K3-R5 PASS
review findings adjudicated
unresolved review threads = 0
manual exact-head H2/security/authority review PASS
```

The pre-ledger review must inspect not only test status but the exact event ordering, source-record binding, fixed policy identity, hard-guard non-regression, and sink-failure behavior.

---

## 28. Evidence ledger

Only after pre-ledger PASS may this path be added:

```text
docs/planning/KODAC_KDO_H5_R2B_H2_REPEAT_CALL_ADVISORY_EVIDENCE_2026-08-15.md
```

The ledger must bind at minimum:

- canonical authorization/base identities;
- H5-R2A canonical merge/tree/source/evidence identities;
- DeepCode donor source/integration identities;
- accepted pre-ledger head/tree/blobs;
- all protected blobs;
- exact active policy JSON + policy identity;
- exact advisory message + identity;
- serialized signal vector;
- specialized advisory record vector;
- source assistant/tool-result record identities;
- H2 projection/reconstruction proof;
- A,A and A,A,B reset/suppression proofs;
- failed/denied non-count proof;
- hard-guard-before/after interaction proof;
- sink-failure proof;
- exact CI runs/jobs;
- review/security status;
- all explicit non-claims.

After ledger addition, all pre-ledger checks become historical and the ledger-bearing exact head must pass fresh post-ledger certification.

---

## 29. Post-ledger certification

The ledger-bearing exact head must independently satisfy:

```text
changed paths = authorized paths 1-7 only
ledger present at exact path
implementation blobs unchanged from accepted pre-ledger evidence
protected blobs exact
R2A fixed identity vectors exact
TypeScript typecheck PASS
focused R2B tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy tests PASS
K3-R4 PASS
K3-R5 PASS
review findings adjudicated
unresolved review threads = 0
manual exact-head H2/security/authority review PASS
```

No pre-ledger result substitutes for post-ledger exact-head certification.

---

## 30. Completion claim

Only after implementation + evidence ledger + post-ledger certification + expected-head canonical merge may Kodac make the bounded claim:

```text
KODAC_H2_BOUND_REPEAT_CALL_ADVISORY_PROVEN
```

This means only:

- the proven R2A consecutive-repeat signal is actively observed for eligible successfully completed canonical tool call/results;
- a threshold-2 signal can produce exactly one bounded system advisory;
- that advisory is canonical H2 evidence and reconstructs into the next provider-visible request;
- the existing hard duplicate/cycle guards and K2 authority remain unchanged.

It does not mean H5 is complete.

---

## 31. Explicit non-claims

R2B does **not** claim or authorize:

- counting denied/failed/aborted attempts without canonical completed tool-result evidence;
- user-role reminder injection;
- raw argument previews;
- dynamic/free-form reminder generation;
- multiple configurable active advisory thresholds;
- changes to `maxIdenticalToolCalls`;
- changes to `maxRepeatedTurnSignatures`;
- hard-stop relaxation;
- tool execution or blocking authority;
- tool-input rewrite;
- hook architecture;
- H5-R3 guarded tool pipeline;
- model-based compaction;
- new H5-R1 pruning behavior;
- subagents;
- delegation fleets;
- worktree workers;
- background jobs;
- writable memory;
- filesystem/Git mutation;
- K2 changes;
- approval changes;
- confinement changes;
- network/credential sandboxing;
- raw provider-wire replay;
- JSONL restart/resume;
- full-process event sourcing;
- KRI changes;
- Done Gate changes;
- `PROVEN_READY`;
- H5 completion;
- H6 readiness.

The separately inspected Agentica, DeerFlow, LLM Space, and delegate-skills donor candidates remain outside this authorization. Their useful function-validation, orchestration, trace/evaluation, subagent, and delegation patterns belong to later H5-R3/H6/context/reviewer slices and grant no authority here.

---

## 32. Authorization truth

```text
IF CANONICAL:

AUTHORIZED NEXT ACTION:
IMPLEMENT ONLY H5-R2B WITHIN PATHS 1-6

LEDGER:
BLOCKED UNTIL PRE-LEDGER PASS

ACTIVE ADVISORY THRESHOLD:
EXACTLY 2

ADVISORY ROLE:
SYSTEM

ADVISORY SOURCE:
CANONICAL SPECIALIZED H2 EVENT ONLY

FAILED / DENIED ATTEMPT COUNTING:
BLOCKED

HARD DUPLICATE / CYCLE GUARD CHANGE:
BLOCKED

K2 / APPROVAL / CONFINEMENT / DONE-GATE CHANGE:
BLOCKED

H5-R3 / H6:
NOT AUTHORIZED
```

Status:

```text
KDO_H5_R2B_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
