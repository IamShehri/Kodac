# KDO-H5-R1A — Model-Free Tool-Result Pruning Evidence

Date: 2026-08-15
Status: POST-LEDGER CERTIFICATION CANDIDATE

## 1. Evidence decision

```text
GATE:
KDO-H5-R1A

PRE-LEDGER DECISION:
PASS

BOUNDED TARGET:
PURE MODEL-FREE TOOL-RESULT PRUNING PRIMITIVE

RUNTIME LOOP INTEGRATION:
NOT CLAIMED

H2 SESSION/PROTOCOL CHANGE:
NOT CLAIMED

MODEL-BASED SUMMARIZATION:
NOT CLAIMED
```

This ledger records the accepted pre-ledger implementation evidence for H5-R1A.

It does not itself complete H5-R1A. The ledger-bearing exact head must pass a fresh post-ledger certification before merge.

---

## 2. Canonical authorization

```text
Authorization merge/base:
60039a7c083d1935c89063def594edf0b13018ee

Authorization base tree:
4e4d4d9452e6f1a9f630107dd5d8f9e7c5254875

Authorization path:
docs/planning/KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_AUTHORIZATION_2026-08-15.md

Authorization document blob:
e61ddae88e094da1cf81adc57532520a34805f0f
```

The authorization permitted exactly four pre-ledger implementation paths and this ledger as path #5 only after pre-ledger PASS.

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
core/agent_runtime/pruner.py

Primary source blob:
dae72f4439d79a2e8a31a85de69908ef87114ec9

Root license:
MIT

Root LICENSE blob:
b3ba37ce442298d5bdec96e2e52a8a812a25f123

Upstream copyright:
Copyright (c) 2025 Data Intelligence Lab@HKU

Intake mode:
PORT
```

Kodac ported the model-free head/marker/tail pruning concept rather than importing the Python runtime.

Kodac-specific strengthening includes strict H2 message validation, UTF-8 byte limits, deterministic SHA-256 structural identities, hostile structural-input rejection, bounded structural recursion, immutable output records, and an explicit no-runtime-integration R1A boundary.

---

## 4. Accepted pre-ledger identity

```text
Accepted pre-ledger head:
e1453d8817a3008964690bddb8ab7b7ce93bcccc

Accepted pre-ledger tree:
53ec0538b9e93a0d068dbf939786fcff4449a36a

Base:
60039a7c083d1935c89063def594edf0b13018ee

Changed paths before ledger:
4

Ledger before pre-ledger acceptance:
ABSENT
```

The final pre-ledger correction at `e1453d8817a3008964690bddb8ab7b7ce93bcccc` removed whole-string `Array.from(value)` materialization from UTF-8 suffix selection after a Qodo performance finding.

---

## 5. Accepted pre-ledger implementation blobs

```text
packages/kodac-runtime/src/agent/tool-result-pruning.ts
4b881b0729d8c5b53dbfaacb17efc86e71843c6e

packages/kodac-runtime/src/index.ts
e0e1c29392b21d95555abf1d91ef1aa02d9c9d9d

packages/kodac-runtime/THIRD_PARTY_NOTICES.md
9b231a0058250bc8445142c3d843808157e0a4a3

packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
1303e712f336ab41d7cd75bd394834ef94bd1584
```

No production path outside the authorization allowlist changed.

---

## 6. Protected authority/runtime blobs

The focused test and exact-head inspection preserved the authorization-protected surfaces:

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

Therefore H5-R1A does not silently alter the active loop, H2 history/request protocol, K2 execution authority, or Done Gate.

---

## 7. Primitive version and bounds

```text
Pruning version:
kodac-tool-result-pruning-v1

Change version:
kodac-tool-result-pruning-change-v1

Result version:
kodac-tool-result-pruning-result-v1

Strategy:
head-tail-equal-v1

Minimum configurable tool-result cap:
128 UTF-8 bytes

Maximum configurable tool-result cap:
524288 UTF-8 bytes

Maximum messages:
512

Maximum aggregate message-content bytes:
4194304

Structural preflight depth ceiling:
72
```

The structural depth ceiling is H2 `maxJsonDepth + 8`, giving the R1A preflight an attributable stack-depth fail-closed boundary before canonical H2 validation.

---

## 8. Pure production import surface

The focused test proves production source imports are exactly:

```text
../session/model-visible-request.ts
node:crypto
node:util
```

The production module contains no filesystem, child-process, HTTP, HTTPS, socket, TLS, environment, model-call, session-emission, tool-execution, Git, approval, policy, or confinement authority.

No current Kodac execution path imports or invokes the pruner.

---

## 9. Structural policy identity example

For:

```text
maxToolResultBytes = 192
strategy = head-tail-equal-v1
version = kodac-tool-result-pruning-v1
```

The deterministic policy identity is:

```text
9a6d9d8ad76bce50da12715ca2509b526567f8e1486008df8cec475928458190
```

For `maxToolResultBytes = 161`, the deterministic policy identity is:

```text
f1203cb6792512b456616b7fdb120c3df972367b3d58f63444dabb4165fc90a9
```

---

## 10. Representative ASCII pruning proof

Representative input:

```text
role = tool
name = repo.read
toolCallId = call-1
content = "HEAD-" + ("x" repeated 1000 times) + "-TAIL"
maxToolResultBytes = 192
```

Observed deterministic properties from the production algorithm/test contract:

```text
original UTF-8 bytes:
1010

result UTF-8 bytes:
192

removed source UTF-8 bytes:
869

marker form:
[kodac-tool-result-pruned-v1 original-bytes=1010]

prefix property:
result starts with HEAD-

suffix property:
result ends with -TAIL
```

Evidence identities:

```text
originalContentSha256:
71d55b14dfa4f9923f22e46db24725911e13174378c2f128f52705a31e9b086b

resultContentSha256:
e7968bb907f5346b4744ee09b6d20895b44e9dbc4442633c6d7a665be5bd6da9

inputIdentity:
87deb3be4b7cc8fb763694adceb7ef7bcb9c059eceb0e1dd0e95cf28c2616d3f

outputIdentity:
4fdb93cf5d83ad5634b49d9b5e49d813f91553a1d1909ffcd18f6cb218afbe42

changeIdentity:
3f13627fe6489b9423cb76d7ab620f9eec95c378a4eedccecee83a0e3003d842

resultIdentity:
dec2f1c0fd7f98fa9a55ad0ac6899bb56bc71ee0bdcdbda95cee5d7e852c6122
```

---

## 11. Representative Unicode pruning proof

Representative input:

```text
role = tool
name = fixture
toolCallId = unicode-emoji
content = "BEGIN-" + ("😀" repeated 300 times) + "-END"
maxToolResultBytes = 161
```

Deterministic byte evidence:

```text
original UTF-8 bytes:
1210

result UTF-8 bytes:
157

removed source UTF-8 bytes:
1104
```

The result remains valid UTF-8/string content, preserves the beginning and ending sentinels, and does not split the retained emoji surrogate pairs.

Evidence identities:

```text
originalContentSha256:
f62cf5c1475fe119534ce7fb4b1c0aae9ab52da062e442427e8e91a7404e3b68

resultContentSha256:
2dc8c4609ebd984b2c8f117a200aca28bcd0078599e298a0d56b28fbad0aa4d9

inputIdentity:
ec8750c816f8c8a763e25d0ec818128e1d19ae47f2911543210904f4af0fb8ac

outputIdentity:
f61fb09e1e4e832612e516c81c99531bcb790d7fd3fddeec2ac564c26ef5ea6a

changeIdentity:
dd52857d44e485d1b4222be49273451e8142d399d946240b649fb8fcd7ba5edc

resultIdentity:
ea375e56b2b1d0240d237c4a8fa37596031ee7112d73fa7f409de660f73f3086
```

---

## 12. Convergence proof

The focused contract proves:

```text
first = prune(messages, policy)
second = prune(first.messages, policy)

second.changes.length = 0
second.inputIdentity = first.outputIdentity
second.outputIdentity = first.outputIdentity
second.messages = first.messages semantically
```

The canonical marker and result byte cap therefore prevent repeated shrinking/churn under the same policy.

---

## 13. Hostile-input proof

Focused tests cover fail-closed handling for:

- invalid policy bounds;
- unknown policy fields;
- mutated policy identity;
- unsupported message roles;
- unknown message fields;
- accessors without executing getters;
- Proxy objects without invoking Proxy `get` traps;
- non-enumerable hidden fields;
- symbol-bearing structures;
- cyclic structures;
- excessive acyclic structural nesting;
- multi-byte Unicode;
- emoji / surrogate pairs;
- combining-character content;
- mixed newline content.

Caller input is not mutated.

---

## 14. Qodo performance finding and correction

Qodo emitted one actionable Medium finding on the pre-ledger candidate:

```text
Finding:
Costly UTF-8 suffix scan

Issue:
takeUtf8Suffix used Array.from(value), materializing every code point of an oversized tool result even though only a bounded tail was required.
```

The finding was accepted as valid.

Correction at accepted head `e1453d8817a3008964690bddb8ab7b7ce93bcccc`:

```text
- removed whole-string Array.from(value) materialization;
- suffix selection now scans UTF-16 backward directly;
- low/high surrogate pairing is handled explicitly;
- prefix accumulation also uses string-array + join;
- UTF-8 result bound and Unicode correctness tests remain green.
```

Qodo auto-resolved review thread:

```text
PRRT_kwDOTVTeS86ZbRnt
```

after the correction.

Unresolved review threads at pre-ledger acceptance:

```text
0
```

---

## 15. Pre-ledger CI evidence

Exact accepted pre-ledger head:

```text
e1453d8817a3008964690bddb8ab7b7ce93bcccc
```

### Governance

```text
workflow run:
31844997428

legacy-tests job:
94909489169
PASS

provenance job:
94909489237
PASS
```

### K3-R4

```text
workflow run:
31844997420

job:
94909489192

result:
PASS
```

### K3-R5

```text
workflow run:
31844997452

job:
94909489000

result:
PASS
```

### K2 runtime matrix

```text
workflow run:
31844997916

runtime-change-classifier:
94909490959 — PASS

Ubuntu runtime:
94909510320 — PASS

macOS runtime:
94909510275 — PASS

Windows runtime:
94909510318 — PASS

K2 final gate:
94909676518 — PASS
```

---

## 16. Ubuntu exact-head proof

Ubuntu exact-head verification recorded:

```text
TypeScript typecheck:
PASS

runtime tests:
436 total
435 pass
0 fail
0 cancelled
1 skipped
0 todo

H5-R1A focused tests:
5 / 5 PASS

H4-R2C Linux integration:
PASS / NOT SKIPPED

patch benchmark:
PASS
10000 iterations
19.550117999999998 ms
511505.8640566773 operations/second
```

The single skip is the existing conditional K3-R4 exact external ast-grep integration subtest, not an H5-R1A skip.

---

## 17. Review/security truth

```text
Qodo:
1 actionable Medium performance finding
FIXED
thread auto-resolved
no unresolved threads

CodeRabbit exact accepted head:
terminal status = success
terminal description = Review rate limited
NO clean-review claim
NO current CodeRabbit finding observed

Cubic:
service/plan availability is not treated as security evidence

Manual exact-head H5-R1A security/authority review:
PASS
review id = 4941529207
```

The manual review confirmed the pure import surface, absence of ambient side-effect authority, preserved H2/K2/Done Gate bytes, bounded hostile-input preflight, Unicode byte safety, deterministic identities, convergence, and no active loop integration.

---

## 18. Core invariant preserved

H5-R1A proves only a reusable transformation primitive.

The active H2 invariant remains unchanged:

```text
MODEL-VISIBLE HISTORY MUST BE RECONSTRUCTABLE FROM CANONICAL H2 SESSION EVIDENCE.
```

R1A does not silently replace historical tool-result messages inside `BoundedAgentLoop` or H2 session projection.

A future R1B must explicitly define canonical transformation/evidence semantics before runtime integration.

---

## 19. Post-ledger requirement

The addition of this file changes the exact PR head.

Therefore all pre-ledger CI and review evidence above is now historical evidence only.

The ledger-bearing exact head must freshly satisfy:

```text
governance/provenance PASS
legacy tests PASS
K3-R4 PASS
K3-R5 PASS
runtime-change-classifier PASS
Ubuntu runtime PASS
macOS runtime PASS
Windows runtime PASS
K2 final gate PASS
H5-R1A focused tests PASS
unresolved review threads = 0
post-ledger security/authority review PASS
```

No merge is permitted from the pre-ledger checks recorded above.

---

## 20. Bounded completion claim after post-ledger merge

Only after fresh post-ledger certification and expected-head merge may Kodac claim:

```text
KODAC_MODEL_FREE_TOOL_RESULT_PRUNING_PRIMITIVE_PROVEN
```

This means only that a pure, deterministic, UTF-8 byte-bounded, convergent, provenance-bound tool-result pruning primitive has been proven.

---

## 21. Explicit non-claims

H5-R1A does **not** claim or authorize:

- active agent-loop pruning;
- automatic context-pressure detection;
- token-budget management;
- model-based summarization;
- semantic compaction;
- replacement of canonical H2 history;
- a new H2 transformation event;
- H2 request/history divergence;
- tool pipeline hooks;
- repeat-call guard behavior;
- subagents;
- background workers;
- project-memory writes;
- filesystem writes;
- Git/worktree mutation;
- workspace-write confinement;
- K2 policy changes;
- approval changes;
- confinement changes;
- provider changes;
- KRI changes;
- Done Gate changes;
- `PROVEN_READY` from this primitive;
- H5 completion;
- H6 readiness.

---

## 22. Ledger truth

```text
PRE_LEDGER_GATE:
PASS

ACCEPTED_PRE_LEDGER_HEAD:
e1453d8817a3008964690bddb8ab7b7ce93bcccc

ACCEPTED_PRE_LEDGER_TREE:
53ec0538b9e93a0d068dbf939786fcff4449a36a

LEDGER_DELTA:
THIS FILE ONLY

POST_LEDGER_CERTIFICATION:
REQUIRED

MERGE:
NOT AUTHORIZED UNTIL POST_LEDGER PASS
```
