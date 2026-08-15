# KDO-H5-R4A — Agent Step Reconstruction / Identity Contract Evidence

Date: 2026-08-15
Status: EVIDENCE LEDGER — PRE-LEDGER IMPLEMENTATION ACCEPTED

## 1. Decision

```text
GATE:
KDO-H5-R4A

PRE-LEDGER DECISION:
PASS

ACCEPTED PRE-LEDGER HEAD:
85ccd8e2606da5a66fa66a04041852f992ed9ada

ACCEPTED PRE-LEDGER TREE:
67a9869236073bb7b0b6d3becbd18a52d5ac4807

IMPLEMENTATION SCOPE:
EXACTLY TWO AUTHORIZED PATHS

RUNTIME AUTHORITY:
NONE

ACTIVE LOOP INTEGRATION:
NONE

H5 STATUS:
NOT CLOSED

NEXT AFTER R4A IF CANONICAL:
SEPARATE R4B AUTHORIZATION
```

The accepted R4A implementation proves a pure deterministic structural reconstruction primitive for one Kodac `agent.turn.*` lifecycle bracket.

It does not prove that the active loop currently emits a terminal event for every started turn. That remains R4B work.

---

## 2. Canonical authorization chain

R4A authorization:

```text
Path:
docs/planning/KODAC_KDO_H5_R4A_AGENT_STEP_RECONSTRUCTION_AUTHORIZATION_2026-08-15.md

Blob:
91d096f4014d1263a7ccf23aae8b64ea717d4643

Canonical authorization merge:
6dd9bf719ce0ff16b099c7084ad0d168aee0fba3
```

H5 closure-gap audit:

```text
Path:
docs/planning/KODAC_KDO_H5_CLOSURE_GAP_AUDIT_2026-08-15.md

Blob:
c30db22cdd984a746540a93e713fa770aff89c00

Canonical audit merge:
90f90e78ac8b5569f6ff3abfb96fcc2875450ade
```

The closure audit established that R1B/R2B/R3B were canonical for their bounded scopes while total step lifecycle and observer containment remained open.

---

## 3. Exact pre-ledger scope

Base:

```text
6dd9bf719ce0ff16b099c7084ad0d168aee0fba3
```

Accepted head:

```text
85ccd8e2606da5a66fa66a04041852f992ed9ada
```

Accepted tree:

```text
67a9869236073bb7b0b6d3becbd18a52d5ac4807
```

Git compare state:

```text
status: ahead
ahead_by: 3
behind_by: 0
changed paths: 2
```

Exact changed paths:

```text
packages/kodac-runtime/src/session/agent-step.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

No evidence ledger existed on the accepted pre-ledger head.

No historical test, runtime writer, workflow, package manifest, export surface, K2 surface, policy, approval, confinement, or Done Gate path changed.

---

## 4. Accepted implementation blobs

Production primitive:

```text
packages/kodac-runtime/src/session/agent-step.ts
a999f1f134167f61266910566612149da91e9a5c
```

Focused proof:

```text
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
ca969c7881ba1840d43ac89f2ed2670be2cfffb0
```

---

## 5. Contract version and limits

```text
KDO_H5_R4A_STEP_VERSION:
kodac-agent-step-v1

terminal kinds:
completed
failed
stopped
```

`stopped` is structural/future-compatible only in R4A. R4A did not add `agent.turn.stopped` to the canonical event vocabulary and did not emit it from the runtime.

Accepted bounds:

```text
maxStepEvents: 1024
maxHistoryRecords: 512
maxRepeatAdvisories: 64
maxPruningRecords: 64
maxGuardEvaluations: 256
maxIdentityReferences: 2048
maxCanonicalStepBytes: 262144
```

All bounds fail closed. No truncation is used.

---

## 6. Step evidence shape

Accepted `AgentStepEvidence` structurally binds:

```text
version
sessionId
turn
startSequence
terminalSequence
terminalKind
requestIdentity | null
historyRecordIdentities[]
repeatAdvisoryRecordIdentities[]
pruningRecordIdentities[]
guardPipelineResultIdentities[]
guardFinalCallIdentities[]
eventCount
stepIdentity
```

The step identity excludes incidental event wrapper fields such as random `eventId` and `emittedAt` and does not duplicate raw model/tool content, raw tool output, secrets, policy payloads, approval payloads, confinement payloads, or Done Gate evidence.

---

## 7. Fixed deterministic identity vectors

Canonical fixture H2 request identity:

```text
987eb2c447114cbff94705d35f9e83e6637d97a2d6a8332f69fd8cd195499628
```

Completed no-tool R4A step identity:

```text
078063deeb7f2d84915b1f43a172a99ccaa09093ae3c6dc1ae083876314e8d5e
```

Reserved structural stopped-step identity:

```text
fe82ed8af65bed1d057aad786b2a62dde09afb383ca1239993cf32642b014194
```

The fixed vectors passed on Windows, macOS, and Ubuntu on the accepted exact head.

---

## 8. Proven lifecycle grammar

R4A accepts only a structurally complete bracket:

```text
agent.turn.started
<bounded canonical events>
exactly one terminal event
```

Supported structural terminals:

```text
agent.turn.completed
agent.turn.failed
agent.turn.stopped
```

R4A rejects:

- empty windows;
- a first event other than `agent.turn.started`;
- missing terminal events;
- duplicate terminals;
- an early terminal followed by more events;
- a second/nested `agent.turn.started`;
- unknown required `agent.turn.*` lifecycle events;
- mixed session ids;
- noncontiguous, duplicate, or regressing sequences;
- invalid turn numbers;
- mismatched terminal turn numbers.

R4A does not infer terminal truth from `agent.loop.*`, timing, event absence, or neighboring turns.

---

## 9. H2 request/history binding proof

R4A accepts at most one `model.request.snapshot` in one step.

When present, the payload is revalidated using canonical H2 request validation and its derived `requestIdentity` is bound into the step identity.

A completed step without a canonical request snapshot is rejected.

Failed/stopped structural vectors may omit a request snapshot when they terminate before a request was durably established.

Canonical H2 history records are revalidated and bound by ordered `recordIdentity`; their raw message bodies are not copied into step evidence.

The full event window is also replayed through canonical `projectModelVisibleHistory`, proving H2/R1B/R2B ordering, source binding, stale-request rejection, and pruning replay integrity rather than trusting identity strings alone.

---

## 10. R1B and R2B coexistence proof

The focused proof constructs canonical:

- assistant history;
- tool-result history;
- R2B repeat-call advisory;
- R1B evidence-preserving pruning transformation.

R4A successfully reconstructs the same step while binding only:

```text
history record identities
repeat advisory record identity
pruning record identity
```

The serialized R4A step evidence contains neither the oversized raw tool content nor the advisory prose.

Therefore R4A creates no second model-visible history authority.

---

## 11. R3B coexistence proof

R4A structurally validates and orders:

```text
tool.guard.evaluated
tool.guard.execution_observed
```

It binds existing:

```text
pipelineResultIdentity
finalCallIdentity
```

A guard execution observation without a prior matching evaluation in the same step is rejected.

Malformed structural identities are rejected.

R4A does not interpret `blocked=false` as permission and does not call the R3A reducer, K2, policy, approval, confinement, orchestrator, or tool registry to make a new authority decision.

---

## 12. Hostile structural evidence proof

The accepted exact head proves fail-closed handling without executing caller hooks for:

- Proxy event arrays;
- Proxy events;
- accessor payload fields;
- sparse arrays;
- symbol-keyed event fields;
- malformed serialized step identities;
- unknown serialized fields;
- over-bound structural evidence.

The only implementation correction before acceptance was a TypeScript-only descriptor typing fix:

```text
incorrect compile shape:
descriptors.length

accepted type-safe shape:
Object.getOwnPropertyDescriptor(value, "length")
```

This did not change the R4A theorem, API, policy, or authority boundary.

---

## 13. Deep immutability proof

Accepted evidence and all identity-reference arrays are frozen.

Serialized evidence is independently revalidated and `stepIdentity` is recomputed.

Mutation of `stepIdentity`, unknown fields, malformed identity arrays, or bound structural fields fails closed.

Caller-owned event objects/arrays are not exposed as mutable aliases in accepted step evidence.

---

## 14. Pure import and no-authority proof

The accepted production import surface is exactly:

```text
../protocol/event.ts
./model-visible-history.ts
./model-visible-request.ts
node:crypto
node:util
```

The production source contains no:

```text
node:fs
node:fs/promises
node:child_process
node:http
node:https
node:net
node:tls
process.env
fetch(
RuntimeSession
EventSink
JsonlEventSink
RuntimeOrchestrator
ExecutionGateway
PolicyEngine
Approval
Confinement
DoneGate
ToolRegistry
ProviderRegistry
session.emit
spawn(
exec(
execFile(
```

`src/index.ts` was not modified and does not export `agent-step.ts`.

Because the exact base→head changed-path set contains only the new R4A production file and focused test, no pre-existing active runtime writer could have added an import of the new primitive on the accepted head.

R4A therefore remains internal and non-authoritative.

---

## 15. Protected runtime identities

The focused proof pins and passes the following unchanged identities:

```text
src/agent/loop.ts
7353ecb758326dace61e90d18590bb5e942a3414

src/model/turn.ts
9ae1298b3a4f917417efbe2228e0708bc813147d

src/protocol/event.ts
8d837edbbe4e6aceabab17bd9bdf114ab63ff699

src/session/session.ts
d5f2334b18e89f7bac2bac7422ed8a33669b8afd

src/session/model-visible-history.ts
c534368c8a67cca1509146dee22d489f04f4c9c4

src/session/model-visible-request.ts
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

src/agent/tool-result-pruning.ts
66cfee69032c4c24331e8cb9098a86a1d7b9135e

src/agent/repeat-call-signal.ts
1fd23cbc4dffd6be5ee77446d84bdea2ca27471f

src/agent/guarded-tool-pipeline.ts
876656bf65a67df56c4cd5f078629cde06112af1

src/agent/guarded-tool-plan.ts
1ab6217e88c54cd8868e2bcf8d13fbb39e93d994

src/trust/policy.ts
b4134e430204123bebe053ffc9105f05fca611c9

src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7
```

---

## 16. Fresh pre-ledger CI evidence

Exact accepted head:

```text
85ccd8e2606da5a66fa66a04041852f992ed9ada
```

K2 runtime workflow:

```text
run id: 31891874538
run number: 436
```

Results:

```text
runtime-change-classifier: PASS
Windows Typecheck: PASS
Windows full Test: PASS
Windows patch benchmark: PASS
macOS Typecheck: PASS
macOS full Test: PASS
macOS patch benchmark: PASS
Ubuntu Typecheck: PASS
Ubuntu full Test: PASS
Ubuntu patch benchmark: PASS
k2-runtime-gate: PASS
```

Governance workflow:

```text
run id: 31891874587
provenance: PASS
legacy-tests: PASS
ruff: PASS
```

External reviewer status:

```text
CodeRabbit: SUCCESS
unresolved inline review threads: 0
```

---

## 17. Full runtime test evidence

Windows exact-head log reports:

```text
tests: 518
pass: 511
fail: 0
cancelled: 0
skipped: 7
todo: 0
```

All R4A focused tests passed.

The seven Windows skips are pre-existing platform/environment-specific K3/H4 cases, including Linux/external-binary qualification paths. No R4A test was skipped, deleted, bypassed, or converted to todo.

macOS and Ubuntu full runtime test jobs also passed on the same accepted head.

---

## 18. K3 applicability proof

Accepted R4A changed paths:

```text
packages/kodac-runtime/src/session/agent-step.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

Canonical K3-R4 workflow blob:

```text
ef5a1c236966644fc7652db5e065a3071e39c0e7
```

Canonical K3-R5 workflow blob:

```text
0c402c65af6d19b2a514268d4cb51ffc00a6e43a
```

Neither changed path intersects the canonical `pull_request.paths` set of K3-R4 or K3-R5.

No K3 workflow or protected K3 implementation/test path was touched.

Therefore exact-head classification is:

```text
K3-R4:
NOT_APPLICABLE_PATH_FILTER_PROVEN

K3-R5:
NOT_APPLICABLE_PATH_FILTER_PROVEN
```

No unrelated K3 trigger path was touched to force workflow scheduling.

---

## 19. Manual theorem review

```text
R4A PURE STRUCTURAL RECONSTRUCTION:
PASS

ACTIVE RUNTIME WRITER IMPORTS R4A:
NONE INTRODUCED

NEW EXECUTION AUTHORITY:
NONE

NEW POLICY AUTHORITY:
NONE

NEW APPROVAL AUTHORITY:
NONE

NEW CONFINEMENT AUTHORITY:
NONE

NEW COMPLETION AUTHORITY:
NONE

RAW MODEL/TOOL HISTORY DUPLICATION:
NONE

H2/R1B/R2B/R3B AUTHORITY FORK:
NONE
```

R4A only makes an already-complete event bracket structurally reconstructable and identity-bound.

---

## 20. Pre-ledger acceptance truth

```text
KDO-H5-R4A PRE-LEDGER:
PASS

ACCEPTED HEAD:
85ccd8e2606da5a66fa66a04041852f992ed9ada

ACCEPTED TREE:
67a9869236073bb7b0b6d3becbd18a52d5ac4807

LEDGER CREATION:
AUTHORIZED ONLY AFTER THIS PASS
```

This ledger is the only authorized post-pre-ledger path.

---

## 21. Non-claims

This evidence does not claim:

- total active step terminalization;
- active `agent.turn.stopped` emission;
- active loop integration of R4A;
- `onStreamEvent` observer failure containment;
- H5 complete;
- H6 ready;
- subagents;
- background jobs;
- delegation;
- worktrees;
- writable/persistent memory;
- generic pre/around/post hook waterfalls;
- new K2/policy/approval/confinement authority;
- new Done Gate authority;
- public release.

---

## 22. Post-ledger requirement

This ledger commit invalidates the pre-ledger head as current acceptance evidence.

The ledger-bearing exact head must receive fresh:

- exact delta proof showing ledger path only after the accepted pre-ledger head;
- implementation/test blob identity proof;
- governance/provenance/legacy PASS;
- runtime-change-classifier PASS;
- Windows/macOS/Ubuntu Typecheck + full Test PASS;
- k2-runtime-gate PASS;
- CodeRabbit SUCCESS;
- zero unresolved review threads;
- K3 applicability recomputation;
- manual pure/no-authority theorem review.

Only then may PR #79 become ready and merge by expected exact head.

Current ledger status:

```text
KDO_H5_R4A_AGENT_STEP_RECONSTRUCTION_PRE_LEDGER_PROVEN_POST_LEDGER_REVIEW_REQUIRED
```
