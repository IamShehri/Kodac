# KDO-H5-R2B — H2-Bound Repeat-Call Advisory Evidence

Date: 2026-08-15
Status: POST-LEDGER CERTIFICATION CANDIDATE

## 1. Evidence decision

```text
GATE:
KDO-H5-R2B

PRE-LEDGER DECISION:
PASS

ACCEPTED PRE-LEDGER HEAD:
ad41442423e5f6e6fb260fabc4e28dba0fb52adf

ACCEPTED PRE-LEDGER TREE:
ab6d0dd46853f684a4afd2460651a4c95d955985

CANONICAL IMPLEMENTATION BASE:
67a68faabb42d8472f6b5e68a2246ae1e2813bb0

MODEL-VISIBLE ADVISORY:
CANONICAL H2 EVIDENCE ONLY

K2 / HARD DUPLICATE / CYCLE AUTHORITY:
UNCHANGED
```

This ledger records the accepted pre-ledger implementation evidence for H5-R2B under the original authorization plus canonical corrections C1 and C2.

It does not itself complete H5-R2B. The ledger-bearing exact head must independently pass post-ledger certification before any merge or bounded completion claim.

---

## 2. Authorization chain

### 2.1 Original H5-R2B authorization

```text
Path:
docs/planning/KODAC_KDO_H5_R2B_H2_REPEAT_CALL_ADVISORY_AUTHORIZATION_2026-08-15.md

Blob:
f1314e8b61e08a0563cbecaf1f189ee68e725005

Canonical merge:
6c75a902db04d79d4112db41e8168877d4b56adf
```

### 2.2 C1 historical-regression reconciliation

```text
Path:
docs/planning/KODAC_KDO_H5_R2B_HISTORICAL_REGRESSION_ASSERTION_RECONCILIATION_2026-08-15.md

Blob:
25b0e072898b78451073cc73a12f618e15f10bcb

Canonical merge:
0ccd36fbe6f2146d42f19112c53923448727fe40
```

C1 permits only the five enumerated historical-test reconciliations required because later canonical R2B intentionally supersedes earlier byte pins/non-integration assertions.

### 2.3 C2 K3 path-filter applicability reconciliation

```text
Path:
docs/planning/KODAC_KDO_H5_R2B_K3_GATE_APPLICABILITY_RECONCILIATION_2026-08-15.md

Blob:
2305f3783598b1be39a8e6e87781ba786bac6449

Canonical merge / final implementation base:
67a68faabb42d8472f6b5e68a2246ae1e2813bb0

Canonical base tree:
fb06ec7064494d4e139aa441dce6f9a2485d54cd
```

C2 requires an exact-head K3 workflow PASS when a canonical K3 trigger path changed, or exact-head `NOT_APPLICABLE_PATH_FILTER_PROVEN` evidence when the trigger-path intersection is empty.

---

## 3. Canonical H5-R2A predecessor

```text
Bounded predecessor claim:
KODAC_CONSECUTIVE_REPEAT_CALL_SIGNAL_PRIMITIVE_PROVEN

R2A canonical merge:
f1e901f164920b4e2c78b72596744513cd7cfc94

R2A canonical tree:
735468aede25f9b7acb236349d521f61fc259852

R2A authorization blob:
6621413f10267d51f2ca689467a7a0ae7f9653d1

R2A evidence blob:
88fb5de0e2f84c455219c4a3afb9c836d33e11bc

R2A production primitive before R2B:
packages/kodac-runtime/src/agent/repeat-call-signal.ts
blob 5d109b9dad5063939cbffeba74a4916cdae0bc18
```

R2B preserves the canonical R2A policy/input/call/state/signal version strings, canonicalization semantics, identity preimages, fixed identity vectors, bounds, consecutive-chain semantics, and saturation behavior.

R2B adds only serialized signal transport/validation needed for H2 evidence integration.

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

Intake mode:
PORT
```

Kodac does not port the donor's user-role reminder, raw argument preview, failed/denied counting semantics, mutable tracker authority, or best-effort/swallowed context-note persistence failure.

---

## 5. Accepted pre-ledger identity

```text
Base:
67a68faabb42d8472f6b5e68a2246ae1e2813bb0

Head:
ad41442423e5f6e6fb260fabc4e28dba0fb52adf

Tree:
ab6d0dd46853f684a4afd2460651a4c95d955985

Ahead by:
1

Behind by:
0

Changed paths:
10

Evidence ledger at acceptance time:
ABSENT
```

The accepted head was rebuilt directly on the corrected C2 canonical main. Earlier implementation heads are diagnostic history only:

```text
8c04d3b404cc25f8d086ad547aaff3001d75ca76
0c91b48d49ea94cb22560e233769bad7e91be2bf
```

Neither is accepted evidence.

---

## 6. Accepted implementation and focused-test blobs

```text
packages/kodac-runtime/src/agent/loop.ts
47b160683475068305945c5af8fe2322e20c9cb0

packages/kodac-runtime/src/agent/repeat-call-signal.ts
1fd23cbc4dffd6be5ee77446d84bdea2ca27471f

packages/kodac-runtime/src/protocol/event.ts
c48b0c4ca3ef900f71ac4f15e9db94d9da5f0096

packages/kodac-runtime/src/session/model-visible-history.ts
06909401c6ddf2880154eb3d5fb1fe646d12d7fb

packages/kodac-runtime/test/kdo-h5-r2b-repeat-call-advisory-history.test.ts
e3ad33c5535426115aaf5f187c1fc3beb909fe76
```

---

## 7. C1 historical-test before/after bindings

Only the five C1-authorized historical tests changed.

```text
H2-R2:
packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
before 4d6893b993836eec74e6b6a277513a53994ecf8a
after  07a3ffc3a30d0d2d41073ca9417f8def5c4f953e

H4-R2B:
packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts
before 9ed410e6388afeb27be5e617f0f103f7666c4371
after  f158671bd52c33b530c022c394cb1af35ca836e5

H4-R2C:
packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts
before 4ce7cc199daec32eac0e78f3a3dfbdc081d5d541
after  7ba2c6a49b9d425ff605da7080f14e50e5581392

H5-R1A:
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
before 5154fe2cc7a1b3cf7f4d47bff882abd7580b121c
after  245ac46d9467730099b034d214276b821411a11d

H5-R2A:
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
before f8285888c0f05b49b9eaa5e3182ea70b7b91a3a1
after  f6f38c67e3a034c1027e467fd0aa5fbc816cbdf1
```

Reconciliation semantics proven by the fresh full runtime suite:

- H2-R2 permits exactly the pure local R2A dependency while retaining ambient filesystem/process/network/ExecutionGateway/DoneGate bans.
- H4-R2B/R2C no longer freeze the later-authorized agent loop to a historical blob; instead they prove the loop does not import/acquire Landlock/confinement authority.
- H5-R1A pruning remains non-integrated in both the loop and H2 projection.
- H5-R2A fixed identity vectors, strict canonicalization/bounds, donor provenance, and primitive no-authority contract remain intact; only its historical pre-R2B non-integration assertion is superseded.
- no test was deleted, skipped, `.todo`-ed, or given a CI/platform bypass.

---

## 8. Non-superseded protected surfaces

The exact 10-path compare proves all non-enumerated paths are unchanged from canonical base. The following authority surfaces therefore retain their canonical protected blobs:

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
```

---

## 9. Active R2B policy

The active loop integration policy is exactly:

```json
{"thresholds":[2],"version":"kodac-repeat-call-policy-v1"}
```

Canonical policy identity:

```text
7331f353c9a29af123cd54fa99453768b35fe2534db5d009df9dae67cdc80222
```

R2B H2 advisory records reject signals with any other policy identity, threshold other than `2`, threshold index other than `0`, or consecutive count other than `2`.

---

## 10. Deterministic R2A signal sample vector

For:

```text
toolName:
test.echo

toolInput canonical JSON:
{"value":"same"}
```

under the fixed R2B policy:

```text
toolInputIdentity:
f623bc21c0bf32185f4b220606b3a9eab2852f37ccefdc7d5f3130a66897f25d

callFingerprint:
acfa205feb48fb46492b6c7e58301a212720427e28af68078a2294a30c3ba823

count-1 stateIdentity:
4d8a994d5443f58e79b665107689a775046ee1af7d471eabf2e80835e7f5d03c

count-2 stateIdentity:
e9ddcd5260dd73ca65fea4d1df76bbf6c12e5f7271cf25cb79c8a64b9b9d2ad3

threshold-2 signalIdentity:
f82bdcddea4d93765caa3d6ca72eaa93abc36c5f6ed256cb38e4a74901149c1c
```

Canonical signal JSON:

```json
{"callFingerprint":"acfa205feb48fb46492b6c7e58301a212720427e28af68078a2294a30c3ba823","consecutiveCount":2,"nextStateIdentity":"e9ddcd5260dd73ca65fea4d1df76bbf6c12e5f7271cf25cb79c8a64b9b9d2ad3","policyIdentity":"7331f353c9a29af123cd54fa99453768b35fe2534db5d009df9dae67cdc80222","priorStateIdentity":"4d8a994d5443f58e79b665107689a775046ee1af7d471eabf2e80835e7f5d03c","signalIdentity":"f82bdcddea4d93765caa3d6ca72eaa93abc36c5f6ed256cb38e4a74901149c1c","threshold":2,"thresholdIndex":0,"toolInputIdentity":"f623bc21c0bf32185f4b220606b3a9eab2852f37ccefdc7d5f3130a66897f25d","toolName":"test.echo","version":"kodac-repeat-call-signal-v1"}
```

The production validator independently recomputes the signal identity and call fingerprint and accepts no unknown fields.

---

## 11. H2 advisory/source-binding sample vector

For the focused deterministic fixture:

```text
provider:
fixture

model:
fixture/model

initial message:
{"role":"user","content":"repeat"}

triggering assistant tool call:
{"id":"call-2","name":"test.echo","input":{"value":"same"}}

triggering tool result:
{"role":"tool","name":"test.echo","toolCallId":"call-2","content":"{\"echoed\":\"same\"}"}
```

Derived identities:

```text
requestIdentity:
9e3bfb7fd5492d9d831f20f760121d2f2f32820443f1fadf1ee8cc9d0cb7f945

assistant messageIdentity:
62cd94c5b6848a4dc049121331c818faf0b5a80c2eec3f4156751a5f2970bf36

assistant history recordIdentity:
81e704f4e8183be446c4644dbec341a4204bc6e6710037658d91dc019e625c2b

tool-result messageIdentity:
a82beedceb0aa8a7279ea15ee9a05bd741af4d539ab3dcb53f1c439dc5629eca

tool-result history recordIdentity:
5aa6adb37ff2bf32d40c15c712b7836c40b0272a0a383d39d36d88cfdf33fc9f
```

The H2 projector does not accept those source identities by reference alone. Before appending the advisory it:

1. retrieves the exact earlier assistant/tool-result records under the current request anchor;
2. proves the tool-result id/name identifies exactly one assistant tool call;
3. derives the current R2A call identity from that assistant call's actual tool name/input;
4. requires derived `toolName`, `toolInputIdentity`, and `callFingerprint` to equal the validated signal.

A valid signal therefore cannot be rebound to an unrelated completed tool call/result merely by substituting source record identities.

---

## 12. Exact model-visible advisory vector

Canonical message:

```json
{"role":"system","content":"Kodac advisory: the same tool call with the same canonical input completed twice consecutively. Reconsider the approach before issuing the same call again."}
```

Canonical model-visible message bytes:

```text
185
```

Canonical message identity:

```text
c022cfa229963c0653c51a097cd3be3dc57a0df66f542a2c15e0a978827652ad
```

For the section-11 source records plus section-10 signal:

```text
advisory record preimage bytes:
1225

advisory recordIdentity:
eaf969c16ab4942ff99338f7f3d10d9b0fdd6a1d9173c21147c8bba520eea7c4
```

The fixed advisory includes no tool name, call id, raw arguments, argument preview, result content, policy reason, approval/confinement result, or donor prompt text.

The focused test additionally uses a unique secret input marker and proves it is absent from the model-visible advisory.

---

## 13. Loop behavior proof

Fresh focused/full tests on the accepted exact head prove:

```text
first successfully completed A:
consecutive count 1
no advisory

second immediately consecutive successfully completed A:
consecutive count 2
one canonical H2 advisory

next provider request:
contains the advisory reconstructed from H2 projection

third identical attempt under default hard limit:
existing duplicate_tool_call hard guard remains authoritative
```

Also proven:

- `maxIdenticalToolCalls=1` disables R2B observation because threshold `2` is unreachable;
- raising the hard limit does not create another active advisory threshold;
- changed tool name resets the consecutive chain;
- changed canonical input resets the chain;
- provider call id does not affect R2A equivalence;
- A,A,B clears stale A advisory state before the next model request;
- A,A,A yields at most one advisory for the still-active final A chain;
- same-batch final-chain suppression prevents stale guidance;
- failed turns reset local R2B state;
- denied/failed/aborted attempts without canonical completed tool-result evidence do not advance R2B state;
- observation/classification unavailability resets/skips advisory observation without adding tool-execution denial authority.

---

## 14. H2 ordering and persistence proof

For an eligible successful returned batch, the candidate H2 message set is bounded before its first history append:

```text
assistant response
+ all tool results
+ optional repeat advisory
```

Persistence order is:

```text
model.history.message.appended          assistant
model.history.message.appended          tool result(s)
model.history.repeat_call_advisory.appended
```

The advisory cannot appear between an assistant tool request and its tool results.

Local repeat continuation state is assigned only after the complete candidate model-visible history batch persists.

If advisory sink persistence fails:

- the error is not swallowed;
- the advisory is not journaled by `RuntimeSession`;
- there is no hidden/private advisory fallback;
- no later provider request is issued in that run.

---

## 15. Hard-guard/K2 non-regression proof

R2B does not alter:

```text
DEFAULT_AGENT_LOOP_LIMITS.maxIdenticalToolCalls = 2
DEFAULT_AGENT_LOOP_LIMITS.maxRepeatedTurnSignatures = 2
duplicate_tool_call stop reason
cycle_detected stop reason
K2 policy/approval/confinement authority
Done Gate authority
```

The loop reuses the existing hard-guard serialized tool-input pass rather than adding a second raw provider-input traversal.

C1's H4 historical tests prove the later R2B loop does not import or invoke Landlock/confinement authority such as `confinement-linux-landlock`, `confinement-runtime`, `runConfinedReadOnlyCommand`, or the native launcher.

---

## 16. K3-R4 applicability proof

Canonical workflow:

```text
.github/workflows/k3-r4-adapter.yml
blob ef5a1c236966644fc7652db5e065a3071e39c0e7
```

Canonical trigger paths:

```text
packages/kodac-runtime/src/repository-intelligence/**
packages/kodac-runtime/src/repository/**
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/trust/policy.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/k3-r4-ast-grep-adapter.test.ts
packages/kodac-runtime/test/gateway.test.ts
packages/kodac-runtime/test/fixtures/k3-r1/**
.github/workflows/k3-r4-adapter.yml
```

Accepted exact-head changed paths:

```text
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/agent/repeat-call-signal.ts
packages/kodac-runtime/src/protocol/event.ts
packages/kodac-runtime/src/session/model-visible-history.ts
packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts
packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
packages/kodac-runtime/test/kdo-h5-r2b-repeat-call-advisory-history.test.ts
```

Set intersection:

```text
EMPTY
```

Workflow file changed:

```text
NO
```

Exact-head full runtime/K2 gates:

```text
PASS
```

Certification:

```text
K3-R4 = NOT_APPLICABLE_PATH_FILTER_PROVEN
```

---

## 17. K3-R5 applicability proof

Canonical workflow:

```text
.github/workflows/k3-r5-context-engine.yml
blob 0c402c65af6d19b2a514268d4cb51ffc00a6e43a
```

Canonical trigger paths:

```text
packages/kodac-runtime/src/context-engine/**
packages/kodac-runtime/src/repository/contracts.ts
packages/kodac-runtime/src/repository-intelligence/contracts.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/k3-r5-context-engine.test.ts
.github/workflows/k3-r5-context-engine.yml
```

Set intersection with the exact 10-path R2B diff:

```text
EMPTY
```

Workflow file changed:

```text
NO
```

Exact-head full runtime/K2 gates:

```text
PASS
```

Certification:

```text
K3-R5 = NOT_APPLICABLE_PATH_FILTER_PROVEN
```

No unrelated K3 trigger path was modified to force workflow scheduling.

---

## 18. Fresh accepted pre-ledger CI evidence

Exact accepted head:

```text
ad41442423e5f6e6fb260fabc4e28dba0fb52adf
```

### Governance

```text
workflow run:
31852049821

legacy-tests:
94929501370 — PASS

provenance:
94929501489 — PASS
```

### K2 runtime

```text
workflow run:
31852049833

runtime-change-classifier:
94929502931 — PASS

macOS runtime:
94929527988 — PASS
Typecheck PASS
Test PASS

Ubuntu runtime:
94929528010 — PASS
Typecheck PASS
Test PASS

Windows runtime:
94929528027 — PASS
Typecheck PASS
Test PASS

k2-runtime-gate:
94929657681 — PASS
```

The runtime test step executes the complete `packages/kodac-runtime/test/*.test.ts` suite, including the R2B focused test and all five C1 historical reconciliations.

---

## 19. Review and manual exact-head status

At accepted pre-ledger head:

```text
CodeRabbit:
SUCCESS

Unresolved inline review threads:
0

Changed paths:
exactly 10 authorized implementation/test paths

Manual exact-head H2/security/authority/historical-test review:
PASS
```

Manual review confirmed:

- specialized H2 advisory event only;
- generic H2 source vocabulary remains unchanged;
- advisory is `role=system`, never runtime-generated `role=user` impersonation;
- signal source-binding is checked against actual assistant/tool-result records;
- no raw argument preview/model-generated reminder text;
- R2A production primitive remains cryptographic/pure with no execution authority;
- H5-R1A pruning remains non-integrated;
- loop has no Landlock/K2 execution authority;
- hard duplicate/cycle semantics remain authoritative;
- sink failure cannot produce hidden model-visible context;
- no ledger existed before pre-ledger acceptance;
- earlier diagnostic heads are not used as certification.

---

## 20. Pre-ledger gate result

```text
changed paths within R2B + C1 authorization:
PASS

ledger absent:
PASS

C1 historical-test reconciliation exact:
PASS

non-superseded protected blobs exact:
PASS

R2A fixed vectors exact:
PASS

R2A production no-authority contract:
PASS

H5-R1A remains non-integrated:
PASS

H4 confinement/K2 remains non-coupled to agent loop:
PASS

TypeScript typecheck:
PASS

focused R2B tests:
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
NOT_APPLICABLE_PATH_FILTER_PROVEN

K3-R5:
NOT_APPLICABLE_PATH_FILTER_PROVEN

review findings adjudicated:
PASS

unresolved review threads = 0:
PASS

manual exact-head review:
PASS

PRE-LEDGER DECISION:
PASS
```

This PASS is historical evidence bound only to head `ad41442423e5f6e6fb260fabc4e28dba0fb52adf` and tree `ab6d0dd46853f684a4afd2460651a4c95d955985`.

---

## 21. Post-ledger certification requirement

After this ledger is added, the resulting exact head must independently prove:

```text
changed paths = the 10 accepted implementation/test paths + this ledger only
ledger present at exact path
implementation/test blobs unchanged from accepted pre-ledger evidence
all non-superseded protected blobs exact
R2A fixed identity vectors exact
H5-R1A remains non-integrated
H4 confinement/K2 remains non-coupled to agent loop
TypeScript typecheck PASS
focused R2B tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy PASS
K3-R4 trigger-aware certification recomputed under C2
K3-R5 trigger-aware certification recomputed under C2
review findings adjudicated
unresolved review threads = 0
manual exact-head H2/security/authority/historical-test review PASS
```

The pre-ledger PASS does not substitute for the ledger-bearing exact-head gate.

---

## 22. Explicit non-claims

H5-R2B does **not** claim or authorize:

- denied/failed/aborted attempt counting without canonical completed tool-result evidence;
- user-role runtime reminder injection;
- raw argument previews;
- dynamic/free-form reminder generation;
- multiple configurable active advisory thresholds;
- hard duplicate/cycle guard relaxation;
- new tool execution/blocking/approval authority;
- K2 policy changes;
- approval changes;
- confinement changes;
- H5-R1A pruning activation;
- H5-R3 guarded tool pipeline;
- model-based compaction;
- subagents;
- delegation fleets;
- worktree workers;
- background jobs;
- writable memory;
- filesystem/Git mutation authority;
- raw provider-wire replay;
- JSONL restart/resume;
- full-process event sourcing;
- KRI changes;
- Done Gate changes;
- `PROVEN_READY`;
- H5 completion;
- H6 readiness.

The separately inspected Agentica, DeerFlow, LLM Space, and delegate-skills donor candidates are not imported by R2B and remain candidates for later H5-R3/H6/context/delegation work.

---

## 23. Completion claim gate

Only after this ledger-bearing head passes fresh post-ledger certification and is merged by exact expected head into canonical `main` may Kodac make the bounded claim:

```text
KODAC_H2_BOUND_REPEAT_CALL_ADVISORY_PROVEN
```

Until then:

```text
KODAC_H2_BOUND_REPEAT_CALL_ADVISORY_PROVEN:
UNAVAILABLE
```
