# KDO-H5-R2A — Consecutive Repeat-Call Signal Primitive Evidence

Date: 2026-08-15
Status: POST-LEDGER CERTIFICATION CANDIDATE

## 1. Evidence decision

```text
GATE:
KDO-H5-R2A

PRE-LEDGER DECISION:
PASS

BOUNDED TARGET:
PURE DETERMINISTIC CONSECUTIVE REPEAT-CALL STATE / ADVISORY-SIGNAL PRIMITIVE

AGENT LOOP INTEGRATION:
NOT CLAIMED

H2 HISTORY / EVENT SOURCE CHANGE:
NOT CLAIMED

MODEL-VISIBLE REMINDER TEXT:
NOT CLAIMED

HARD DUPLICATE-GUARD CHANGE:
NOT CLAIMED
```

This ledger records the accepted pre-ledger implementation evidence for H5-R2A.

It does not itself complete H5-R2A. The ledger-bearing exact head must pass a fresh post-ledger certification before merge, and the bounded completion claim remains unavailable until the certified expected-head merge becomes canonical.

---

## 2. Canonical authorization

```text
Authorization merge / implementation base:
eacbad07bf3cf6beb1afd39ebe6cbed9c9f3bb39

Authorization merge tree:
f6231ee83ca145702eac3241b3374619ce969c05

Authorization document's original canonical base:
7614854f2ca5e3cb05130c9da2ed322cacf7fd07

Authorization document's original canonical base tree:
17072704790a94ca797ea9d7a15ae52c632d13b4

Authorization path:
docs/planning/KODAC_KDO_H5_R2A_CONSECUTIVE_REPEAT_CALL_SIGNAL_AUTHORIZATION_2026-08-15.md

Authorization document blob:
6621413f10267d51f2ca689467a7a0ae7f9653d1
```

PR #64 became canonical through merge commit `eacbad07bf3cf6beb1afd39ebe6cbed9c9f3bb39`.

That authorization permitted exactly four pre-ledger implementation paths and this ledger as path #5 only after pre-ledger PASS.

---

## 3. DeepCode donor provenance

```text
Repository:
HKUDS/DeepCode

Pinned commit:
287510fbf6820147a48adf79f7fd86b0ed1afe92

Pinned tree:
7f44b320f86d04d4315242fabc74f1b325829be8

Primary source:
core/agent_runtime/repeat_guard.py

Primary source blob:
37c24894cdbe7e647bdcbe45d055a1fd48b30777

Runner integration reference:
core/agent_runtime/runner.py

Runner integration blob:
645ab82f768214cce0794984c4bc9b92b099ce5a

Root license:
MIT

Root LICENSE blob:
b3ba37ce442298d5bdec96e2e52a8a812a25f123

Upstream copyright:
Copyright (c) 2025 Data Intelligence Lab@HKU

Intake mode:
PORT
```

Kodac ports only the consecutive same-tool / same-canonical-input chain concept.

Kodac does not port DeepCode's mutable tracker object, permissive `default=str` argument canonicalization, raw argument preview, model-visible reminder text, runner integration, or execution-stop semantics.

---

## 4. Accepted pre-ledger identity

```text
Accepted pre-ledger head:
d544931be62bd0b591a095ddd880f4832654041e

Accepted pre-ledger tree:
d75cfaf7b857ac95887cdac0413a114e99a15164

Implementation base:
eacbad07bf3cf6beb1afd39ebe6cbed9c9f3bb39

Changed paths before ledger:
4

Ledger before pre-ledger acceptance:
ABSENT
```

The accepted pre-ledger head is the exact branch state on which all required CI, review, and manual authority gates passed.

---

## 5. Accepted pre-ledger implementation blobs

```text
packages/kodac-runtime/src/agent/repeat-call-signal.ts
5d109b9dad5063939cbffeba74a4916cdae0bc18

packages/kodac-runtime/src/index.ts
9eeb08bfa6f1f54d0ccdf27029f7c34a56de1fca

packages/kodac-runtime/THIRD_PARTY_NOTICES.md
f89c7812b699211d24425d70291569d61fc4f2a9

packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
f8285888c0f05b49b9eaa5e3182ea70b7b91a3a1
```

No production or test path outside the authorization's pre-ledger allowlist changed.

---

## 6. Protected authority/runtime blobs

Exact-head inspection and focused/full runtime tests preserve the authorization-protected surfaces:

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

Therefore H5-R2A does not silently modify the active loop, its canonical hard duplicate/cycle guards, H2 history/request/event projection, H5-R1A pruning, K2 execution authority, or Done Gate.

---

## 7. Primitive versions and bounds

```text
Policy version:
kodac-repeat-call-policy-v1

Call version:
kodac-repeat-call-v1

State version:
kodac-repeat-call-state-v1

Signal version:
kodac-repeat-call-signal-v1

Maximum current-call JSON text:
131072 UTF-8 bytes

Maximum policy JSON text:
8192 UTF-8 bytes

Maximum state JSON text:
16384 UTF-8 bytes

Tool-name bound:
1..256 UTF-8 bytes

Maximum canonical tool-input bytes:
65536 UTF-8 bytes

Maximum tool-input JSON depth:
32

Maximum aggregate tool-input array elements + object members:
4096

Maximum thresholds:
16

Maximum threshold:
65535

Maximum consecutiveCount:
65535
```

All specified bounds fail closed except the authorized `consecutiveCount` representation rule, which saturates at `65535` for further matching calls.

---

## 8. Serialized non-observable input boundary

The production primitive exposes the bounded purpose-equivalent contract:

```text
advanceRepeatCallSignal(previousStateJson, currentCallJson, policyJson)
  -> immutable nextState + canonical nextStateJson + optional immutable advisorySignal
```

Authority-relevant caller input crosses the boundary as primitive JSON text, with `null` as the initial-state sentinel.

The implementation rejects arbitrary JavaScript objects before property access, reflection, enumeration, prototype inspection, coercion, `toString`, or caller `toJSON` execution.

Focused hostile-boundary tests prove Proxy, accessor, and `toJSON` objects are rejected without triggering their hooks.

---

## 9. Canonicalization and identity profile

The implementation uses a strict JSON parser plus an RFC-8785/JCS-compatible canonicalization profile for admitted JSON values:

- duplicate JSON object keys fail closed;
- object keys canonicalize deterministically;
- array order is preserved;
- JSON strings use deterministic JSON escaping;
- unpaired surrogate code units fail closed;
- Unicode text is not normalized;
- finite IEEE-754 binary64 number semantics are used;
- `-0` canonicalizes as `0`;
- alternate admitted decimal/exponent spellings for the same number canonicalize identically;
- non-finite values are not admitted;
- runtime-only values such as `undefined`, BigInt, symbols, functions, accessors, Proxies, cycles, sparse arrays, and executable `toJSON` objects cannot enter through the serialized public boundary.

Every published structural identity is a lowercase SHA-256 hex digest with domain-separated preimages for:

```text
POLICY
INPUT
CALL
STATE
SIGNAL
```

The CALL preimage additionally binds the tool-name UTF-8 byte length, exact tool-name UTF-8 bytes, and raw 32-byte input digest. Provider transport call IDs do not participate.

---

## 10. Fixed deterministic identity vectors

For the focused fixed-vector fixture:

```text
policy thresholds:
[2, 5]

tool name:
repo.read

tool input semantic value:
{"a":1,"b":[true,null,"é"]}
```

The accepted implementation proves:

```text
policyIdentity:
77650c712d3bcc40d1f4eb03a5c1dffe3a8b2b4b6d9fa6a65f386674d8c7d7b4

toolInputIdentity:
cd136733b75e725248fbfaf1ba55231ea1f92d89bca9014aa8860d9b473f83d9

callFingerprint:
55c839218c279d3f11154f30b618dde52f8d95de15d29ed2da01fc3b3cf3a434

first-state identity:
9a53ca9800ea1dfe6ccb7be52ad8adf89481d7dc75bd385dd9e7cad41ff0711d

second-state identity:
cdd02839695cfe9740a2ffb1e94b707bb5a6e048d8bb94e2d4df9c6e48ca56de

threshold-2 signal identity:
a639ba334c2d820316aa608ba967bfe47d60bc06daa6eaf7a0ca6c67987e9003
```

Repeated identical transitions reproduce the same structural identities.

---

## 11. Consecutive-chain and reset proof

For two distinct canonical calls `A` and `B`:

```text
sequence:
A, A, B, A

observed consecutiveCount:
1, 2, 1, 1
```

The focused contract also proves:

- same tool + changed canonical input resets to `1`;
- changed tool + same input resets to `1`;
- changed provider transport call ID does not reset an otherwise equivalent chain;
- signals emit only when the count advances onto a configured threshold;
- non-threshold counts emit no signal;
- saturation at `65535` does not overflow or reject;
- repeated calls after saturation do not re-emit the maximum-threshold signal.

---

## 12. Evidence-safe signal proof

A signal is structural advisory data only.

It may bind fields such as:

```text
version
policyIdentity
toolName
toolInputIdentity
callFingerprint
consecutiveCount
threshold
thresholdIndex
priorStateIdentity
nextStateIdentity
signalIdentity
```

The focused test proves a sensitive raw tool-input value is absent from serialized signal data.

The signal does not execute, block, approve, confine, retry, or message anything.

---

## 13. Hostile-input and validation proof

Focused tests cover fail-closed behavior for:

- arbitrary non-string Proxy input without trap execution;
- accessor-bearing objects without getter execution;
- caller `toJSON` objects without hook execution;
- malformed JSON;
- duplicate JSON object keys;
- unknown policy/call/state fields;
- invalid policy threshold `1`;
- duplicate thresholds;
- excessive threshold count;
- threshold above `65535`;
- tool names above the UTF-8 byte bound;
- canonical tool input above its byte bound;
- tool-input aggregate item count above the bound;
- tool-input nesting above the bound;
- current-call serialized bytes above the bound;
- mutated prior-state identity;
- unpaired Unicode surrogate rejection;
- delimiter-like and non-ASCII tool-name collision resistance;
- `-0`, exponent/decimal, escape, Unicode, and key-order canonicalization vectors.

Caller-provided serialized text is not mutated.

---

## 14. Pre-ledger correction history

The initial implementation candidate was:

```text
bf7ec8e1f8a59f5c8aa3abdf9fe4cb009e549d15
```

GitHub Actions exposed one runtime-compatibility defect under Node 24 strip-only TypeScript execution: a constructor parameter property in the strict parser could typecheck but could not execute under `--experimental-strip-types`.

Correction:

```text
568bff4d11088550e484d743a8de762bfba4173a
fix(kdo): use strip-only compatible parser field
```

The field became an ordinary declared TypeScript field assigned in the constructor, without changing parser semantics.

The next full-runtime run exposed a test-only authority-scan false positive: the focused safety assertion banned the text token `exec(` and therefore matched the ordinary `RegExp.exec(...)` call in number parsing even though production imports were already restricted to `node:crypto`.

Rather than weaken the existing focused assertion, the production parser changed the equivalent regex invocation form from `RegExp.exec(remainder)` to `remainder.match(regex)`.

Accepted correction:

```text
d544931be62bd0b591a095ddd880f4832654041e
fix(kdo): keep authority scan unambiguous
```

This correction changes no identity preimage, canonicalization rule, parser grammar, authority surface, or externally observable accepted/rejected JSON semantics.

---

## 15. Pure production authority surface

Exact-head inspection proves `repeat-call-signal.ts` imports exactly:

```text
node:crypto
```

It has no filesystem, child-process, HTTP, HTTPS, socket, TLS, ambient environment, Git, model-call, session-emission, tool-execution, approval, policy, confinement, or Done Gate authority.

The canonical `BoundedAgentLoop` does not import or invoke this primitive in H5-R2A.

Therefore the new module is an inert pure classification/state-transition primitive until a separately authorized future integration binds it into runtime behavior.

---

## 16. Pre-ledger CI evidence

Exact accepted pre-ledger head:

```text
d544931be62bd0b591a095ddd880f4832654041e
```

### Governance

```text
workflow run:
31848904579

legacy-tests job:
94920768903 — PASS

provenance job:
94920768904 — PASS
```

### K3-R4

```text
workflow run:
31848904570

job:
94920768765 — PASS
```

### K3-R5

```text
workflow run:
31848904578

job:
94920768755 — PASS
```

### K2 runtime matrix

```text
workflow run:
31848904610

runtime-change-classifier:
94920769186 — PASS

macOS runtime:
94920788714 — PASS
Typecheck PASS
Test PASS

Windows runtime:
94920788741 — PASS
Typecheck PASS
Test PASS

Ubuntu runtime:
94920788813 — PASS
Typecheck PASS
Test PASS

k2-runtime-gate:
94920929070 — PASS
```

The runtime suites include the focused H5-R2A tests and the full Kodac runtime regression suite.

---

## 17. Review and exact-head security status

At accepted pre-ledger head `d544931be62bd0b591a095ddd880f4832654041e`:

```text
CodeRabbit:
SUCCESS

Unresolved review threads:
0

Changed paths:
exactly the four authorized pre-ledger paths

Manual exact-head security / authority review:
PASS
```

Manual review confirmed:

- only the four authorized pre-ledger paths changed;
- the evidence ledger was absent before this acceptance;
- production source imports only `node:crypto`;
- `agent/loop.ts` and `agent-loop.test.ts` remain protected;
- H2 history/request/event surfaces remain protected;
- H5-R1A pruning remains protected;
- K2 policy/gateway surfaces remain protected;
- Done Gate remains protected;
- no model-visible reminder text was introduced;
- no raw argument preview was introduced;
- no hard duplicate/cycle guard limit changed;
- no execution or approval authority was introduced.

---

## 18. Pre-ledger gate result

```text
changed paths ⊆ authorized paths 1-4:
PASS

ledger absent:
PASS

protected blobs exact:
PASS

TypeScript typecheck:
PASS

focused R2A tests:
PASS

full runtime tests:
PASS

runtime-change-classifier:
PASS

K2 runtime gate:
PASS

governance / provenance / legacy tests:
PASS

K3-R4:
PASS

K3-R5:
PASS

review findings adjudicated:
PASS

unresolved review threads = 0:
PASS

manual exact-head security / authority review:
PASS

PRE-LEDGER DECISION:
PASS
```

This PASS is historical evidence bound only to `d544931be62bd0b591a095ddd880f4832654041e` and its tree `d75cfaf7b857ac95887cdac0413a114e99a15164`.

---

## 19. Post-ledger certification requirement

After this ledger is added, the resulting exact head must independently prove:

```text
changed paths = authorized paths 1-5 only
ledger present at the expected path
implementation blobs unchanged from accepted pre-ledger evidence
authorization/protected blobs exact
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

Historical pre-ledger PASS does not substitute for post-ledger certification.

---

## 20. Explicit non-claims

H5-R2A does **not** claim or authorize:

- active repeat reminders;
- model-visible reminder text;
- H2 history source expansion;
- agent-loop integration;
- changes to the hard duplicate guard;
- changes to repeated-turn cycle detection;
- different loop stop semantics;
- tool execution changes;
- tool blocking authority;
- K2 changes;
- approval changes;
- confinement changes;
- H5-R1A changes;
- context pruning integration;
- model summarization;
- subagents;
- delegation/fleet execution;
- background jobs;
- memory writes;
- filesystem/Git/worktree writes;
- KRI changes;
- Done Gate changes;
- `PROVEN_READY`;
- H5 completion;
- H6 readiness.

The separately audited Agentica, DeerFlow, LLM Space, and delegate-skills donor candidates are not imported or authorized by this H5-R2A ledger.

---

## 21. Completion claim gate

Only after ledger-bearing post-ledger certification and an expected-head canonical merge may Kodac make the bounded claim:

```text
KODAC_CONSECUTIVE_REPEAT_CALL_SIGNAL_PRIMITIVE_PROVEN
```

That claim means only that the pure deterministic consecutive-repeat state transition / structural advisory-signal primitive is proven.

Until then:

```text
KODAC_CONSECUTIVE_REPEAT_CALL_SIGNAL_PRIMITIVE_PROVEN:
UNAVAILABLE
```
