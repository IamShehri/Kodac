# KDO-H5-R1A — Model-Free Tool-Result Pruning Primitive Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R1A

NAME:
MODEL-FREE TOOL-RESULT PRUNING PRIMITIVE

CANONICAL AUTHORIZATION BASE:
474fe840cb1467ed5062a4cda2f2ed9641ef4ca3

CANONICAL AUTHORIZATION BASE TREE:
367e9b63b16714eed1e61ce88136e4d9cf63d225

IMPLEMENTATION AUTHORITY FROM THIS DOCUMENT IF CANONICAL:
ONE PURE TYPESCRIPT PRUNING PRIMITIVE + TESTS + PROVENANCE NOTICE

RUNTIME LOOP INTEGRATION:
NOT AUTHORIZED

H2 SESSION/PROTOCOL CHANGE:
NOT AUTHORIZED

MODEL CALL / SUMMARIZATION:
NOT AUTHORIZED

SIDE EFFECTS:
NONE
```

This authorization defines the first bounded H5 implementation slice after the canonical second-wave Greptile + DeepCode donor audit.

The target is intentionally smaller than "context compaction" and smaller than a generic H5 tool pipeline.

It authorizes only a deterministic, model-free transformation primitive that can later be used by a separately authorized integration slice.

Completion of R1A must **not** be represented as active agent-loop context management.

---

## 2. Predecessor authority

Canonical predecessor audit:

```text
docs/planning/KODAC_DEVELOPER_OS_SECOND_WAVE_GREPTILE_DEEPCODE_DONOR_AUDIT_2026-08-15.md
```

Canonical predecessor merge:

```text
474fe840cb1467ed5062a4cda2f2ed9641ef4ca3
```

The audit selected DeepCode's model-free tool-result middle-pruning concept as the safest first H5 donor-derived primitive because it is:

- pure;
- deterministic;
- dependency-free in concept;
- model-free;
- network-free;
- process-free;
- filesystem-free;
- separable from agent/subagent authority.

The audit also identified a critical Kodac constraint:

```text
MODEL-VISIBLE MEANS RECONSTRUCTABLE FROM CANONICAL H2 EVIDENCE.
```

Therefore this R1A slice does **not** wire pruning into `BoundedAgentLoop`.

---

## 3. DeepCode donor source pin

```text
Repository:
HKUDS/DeepCode

Pinned commit:
287510fbf6820147a48adf79f7fd86b0ed1afe92

Pinned tree:
7f44b320f86d04d4315242fabc74f1b325829be8

Root license:
MIT

Root LICENSE blob:
b3ba37ce442298d5bdec96e2e52a8a812a25f123

Primary source path:
core/agent_runtime/pruner.py

Primary source blob:
dae72f4439d79a2e8a31a85de69908ef87114ec9

Intake mode:
PORT
```

The donor design retains the beginning and end of oversized tool results, inserts an explicit middle-pruning marker, operates only under caller-selected context pressure, avoids an LLM round trip, and converges so an already-pruned result does not repeatedly shrink.

Kodac will port the behavior into a stricter TypeScript primitive rather than import Python source directly.

The implementation must preserve attribution in `THIRD_PARTY_NOTICES.md` and source-level provenance.

---

## 4. Why R1A is separate from R1B

Current H2-R2 projection enforces:

```text
next model.request.snapshot messages
==
projectModelVisibleHistory(canonical H2 session events)
```

Current canonical sources:

```text
packages/kodac-runtime/src/agent/loop.ts
blob a5b7c2bbb2a5f7658f683e7baf45655b41b775f8

packages/kodac-runtime/src/session/model-visible-history.ts
blob 6b348a7ce9bfcc7b49463bad5fddae8a445f8135

packages/kodac-runtime/src/session/model-visible-request.ts
blob 0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

packages/kodac-runtime/src/protocol/event.ts
blob ef402bb2cc0364122e6b79a3090b1cb8eed0ee85

packages/kodac-runtime/src/model/turn.ts
blob 401d796b929d350046128371fee4ba719d0d56c9
```

If a future loop silently replaces an older full tool result with a pruned one, the next provider request no longer equals the canonical H2 projection.

Therefore:

```text
R1A:
pure pruning primitive only

R1B:
future integration + explicit canonical transformation/evidence semantics
```

R1B is not authorized here.

---

## 5. Authorized implementation paths

If this authorization becomes canonical, exactly these later implementation paths are authorized for H5-R1A:

```text
1. packages/kodac-runtime/src/agent/tool-result-pruning.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/THIRD_PARTY_NOTICES.md
4. packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
5. docs/planning/KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_EVIDENCE_2026-08-15.md
```

Path #5 is the evidence ledger and must remain absent until the pre-ledger implementation gate passes.

No other path is authorized by R1A.

---

## 6. Protected authority and runtime surfaces

These paths must remain byte-identical throughout H5-R1A implementation unless a later explicit authorization says otherwise:

```text
packages/kodac-runtime/src/agent/loop.ts
  a5b7c2bbb2a5f7658f683e7baf45655b41b775f8

packages/kodac-runtime/src/session/model-visible-history.ts
  6b348a7ce9bfcc7b49463bad5fddae8a445f8135

packages/kodac-runtime/src/session/model-visible-request.ts
  0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

packages/kodac-runtime/src/protocol/event.ts
  ef402bb2cc0364122e6b79a3090b1cb8eed0ee85

packages/kodac-runtime/src/model/turn.ts
  401d796b929d350046128371fee4ba719d0d56c9

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

`packages/kodac-runtime/src/index.ts` is deliberately not protected because R1A may export the new pure primitive.

`packages/kodac-runtime/THIRD_PARTY_NOTICES.md` is deliberately not protected because donor attribution must be added.

---

## 7. Authorized primitive semantics

The implementation may expose a small versioned API equivalent in purpose to:

```text
pruneModelVisibleToolResults(messages, policy)
  -> immutable/detached pruned message projection + deterministic change report
```

Exact TypeScript names may vary only if tests and source make the same contract unambiguous.

The primitive must operate only on an explicit caller-supplied message list and explicit pruning policy.

It may not discover session state, environment state, model configuration, filesystem state, or process state.

---

## 8. Scope of pruning

R1A may prune only message content satisfying all of these conditions:

```text
message is a canonical/valid model-visible message
AND
message.role == "tool"
AND
tool-result UTF-8 content bytes > configured maximum
```

It must not alter:

- system messages;
- user messages;
- assistant messages;
- tool name;
- tool-call identity;
- any other non-content field;
- message order;
- message count.

R1A does not decide *when* the agent is under context pressure. A later caller/integration gate owns trigger policy.

---

## 9. Byte semantics

Kodac strengthens the donor concept by defining bounds in **UTF-8 bytes**, not JavaScript string length.

Required properties:

```text
originalBytes = Buffer.byteLength(originalContent, "utf8")
resultBytes   = Buffer.byteLength(prunedContent, "utf8")

resultBytes <= configured maxToolResultBytes
```

The implementation must preserve valid string/code-point boundaries when selecting retained prefix/suffix text.

Tests must include:

- ASCII;
- multi-byte Unicode;
- emoji / surrogate pairs;
- combining characters;
- mixed newline content.

No result may exceed its declared UTF-8 byte cap because of marker text or multi-byte characters.

---

## 10. Middle-pruning form

For an oversized tool result, R1A must retain both a prefix and suffix whenever the configured maximum can represent both plus the marker.

Conceptually:

```text
<retained prefix>
<explicit Kodac pruning marker>
<retained suffix>
```

The marker must be deterministic and explicit that information was removed.

It must not pretend to summarize omitted text.

The marker may include deterministic metadata such as:

- pruning version;
- original UTF-8 byte length;
- removed byte count.

It must not include timestamps, random IDs, model output, filesystem paths, secrets, or ambient state.

---

## 11. Convergence invariant

R1A must prove:

```text
P = prune(messages, policy)
prune(P.messages, policy).messages == P.messages
```

for every valid input accepted by the primitive.

At minimum:

- every pruned tool-result content is at or below the configured maximum;
- a second application generates no additional pruning changes;
- the marker itself cannot cause repeated shrinking.

This is the critical no-churn property inherited from the donor design.

---

## 12. Deterministic evidence-ready report

R1A must return enough pure deterministic metadata for a future R1B integration to create canonical evidence without recomputing ambiguous state.

For each changed message, the report should bind at minimum:

```text
message index
original UTF-8 bytes
result UTF-8 bytes
original content SHA-256
result content SHA-256
removed UTF-8 bytes
pruning policy/version identity
change identity
```

The complete result should have a deterministic result/report identity derived only from canonical input + policy + changes.

No UUID, clock, randomness, environment value, or mutable global state may participate.

R1A report identity is **structural evidence only**. It is not H2 session evidence until a later integration gate explicitly records it.

---

## 13. Immutability and aliasing

The primitive must not mutate caller-supplied messages or nested structures.

Requirements:

- input array unchanged;
- original message objects unchanged;
- non-pruned message semantics unchanged;
- returned changed message content detached from input;
- returned policy/report/change structures immutable or defensive snapshots;
- repeated calls with semantically identical input produce identical structural identities.

The implementation must fail closed on unsupported/malformed structures rather than executing accessors or structural hooks.

It may reuse canonical H2 validation functions as read-only dependencies without changing H2 source.

---

## 14. Policy bounds

The pruning policy must be strict and bounded.

It must reject at least:

- missing required fields;
- unknown fields if a record contract is used;
- zero/negative/non-integer byte limits;
- limits too small to encode the required marker safely;
- NaN / Infinity;
- oversized or nonsensical limits outside an explicit implementation maximum;
- proxy/accessor/symbol-bearing structural inputs where canonical validation would reject them.

No policy setting may request summarization or a model call.

---

## 15. No side-effect surface

Production R1A source must contain no authority to:

```text
read files
write files
spawn processes
call network
open sockets
read environment variables
read credentials
access Git
emit session events
call models
call tools
approve actions
modify policy
modify repository state
```

The preferred production import surface is limited to deterministic local data transformation plus cryptographic hashing where needed for identities.

---

## 16. No hidden model-visible history change

The strongest R1A boundary is:

```text
NO CURRENT KODAC EXECUTION PATH MAY CALL THE NEW PRUNER.
```

Specifically, R1A must not modify or wire:

- `BoundedAgentLoop`;
- `AgentTurnRunner`;
- H2 history projector;
- H2 request snapshot creation;
- event protocol;
- session journal;
- providers;
- tools;
- K2;
- KRI;
- Done Gate.

This means R1A is a proven reusable primitive, not active agent behavior.

---

## 17. Future R1B requirement

A future H5-R1B integration must separately solve this identity/evidence problem:

```text
canonical full history
   ↓ explicit deterministic transformation event/record
bounded working-context projection
   ↓
model.request.snapshot
```

R1B must ensure the next request remains reconstructable from canonical session evidence and that a summary/pruned projection is never misrepresented as the original historical tool result.

R1B is outside this authorization.

---

## 18. Required focused tests

The H5-R1A focused test must prove at minimum:

1. exact DeepCode donor provenance pin and MIT intake mode;
2. deterministic policy identity;
3. no-op behavior for empty input;
4. no-op behavior when all tool results are within the cap;
5. system/user/assistant messages are never pruned;
6. only oversized `role=tool` content changes;
7. tool name/toolCallId remain exact;
8. message order/count remain exact;
9. prefix retained;
10. suffix retained;
11. explicit pruning marker present;
12. result UTF-8 bytes never exceed cap;
13. ASCII boundary proof;
14. multi-byte Unicode boundary proof;
15. emoji/surrogate-pair boundary proof;
16. mixed newline proof;
17. deterministic original/result SHA-256 identities;
18. deterministic change/report identity;
19. second pass is an exact no-op/convergent;
20. different policy changes structural identity;
21. different original content changes structural identity;
22. malformed policy fails closed;
23. malformed model-visible message fails closed;
24. accessor/proxy/hidden/symbol structures do not gain execution hooks;
25. caller input is not mutated;
26. returned report/change objects cannot be used to mutate internal state;
27. production module imports no filesystem/process/network authority;
28. protected H2/K2/Done Gate surfaces remain byte-identical.

---

## 19. Pre-ledger gate

Before the evidence ledger path #5 may be added, the implementation candidate must satisfy:

```text
changed paths ⊆ authorized paths 1-4
ledger absent
protected blobs exact
TypeScript typecheck PASS
focused H5-R1A tests PASS
full runtime tests PASS on required platforms
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy tests PASS
review findings adjudicated
unresolved review threads = 0
manual exact-head security/authority review PASS
```

The security review should specifically verify that the production primitive has no ambient execution/I/O authority and cannot mutate canonical H2 history.

---

## 20. Evidence ledger

Only after the pre-ledger gate passes may this exact path be added:

```text
docs/planning/KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_EVIDENCE_2026-08-15.md
```

The ledger must bind:

- authorization merge/base;
- DeepCode donor repository/commit/tree/license/blob;
- exact accepted pre-ledger head/tree;
- exact implementation/test/notice blobs;
- protected H2/K2/Done Gate blobs;
- algorithm/version/policy identities;
- representative ASCII and Unicode pruning examples;
- convergence proof;
- focused/full test counts;
- exact CI run/job identities;
- review/security status;
- all non-claims.

After the ledger commit, all pre-ledger CI is historical and the exact post-ledger head must be re-certified.

---

## 21. Post-ledger gate

The final ledger-bearing exact head must again satisfy all required repository gates.

No merge is permitted from stale pre-ledger checks.

Expected-head merge only.

---

## 22. Completion claim

Only after implementation, evidence ledger, post-ledger certification, and merge may the bounded claim be made:

```text
KODAC_MODEL_FREE_TOOL_RESULT_PRUNING_PRIMITIVE_PROVEN
```

This claim means only that Kodac has a pure, deterministic, byte-bounded, convergent pruning primitive with provenance and evidence-ready structural identities.

---

## 23. Explicit non-claims

H5-R1A does **not** claim or authorize:

- active agent-loop pruning;
- context-pressure detection;
- token counting;
- model-based summarization;
- semantic compaction;
- session-history replacement;
- new H2 event vocabulary;
- model request history divergence;
- tool execution pipeline hooks;
- generic H5 completion;
- repeat-call guard behavior;
- subagents;
- background jobs;
- memory writes;
- filesystem writes;
- Git/worktree operations;
- K2 changes;
- policy changes;
- approval changes;
- sandbox/confinement changes;
- provider changes;
- KRI changes;
- Done Gate changes;
- `PROVEN_READY`;
- H5 complete;
- H6 readiness.

---

## 24. Authorization truth

```text
IF CANONICAL:

AUTHORIZED NEXT ACTION:
IMPLEMENT ONLY H5-R1A WITHIN PATHS 1-4

LEDGER:
BLOCKED UNTIL PRE-LEDGER PASS

RUNTIME INTEGRATION:
BLOCKED

H2 MODIFICATION:
BLOCKED

SIDE EFFECTS:
BLOCKED

WHOLE DEEPCODE IMPORT:
BLOCKED

COMPLETION CLAIM BEFORE PROOF:
BLOCKED
```

Status:

```text
KDO_H5_R1A_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
