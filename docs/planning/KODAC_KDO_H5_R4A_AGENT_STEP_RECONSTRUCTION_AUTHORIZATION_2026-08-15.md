# KDO-H5-R4A — Agent Step Reconstruction / Identity Contract Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R4A

NAME:
PURE AGENT STEP RECONSTRUCTION / IDENTITY CONTRACT

CANONICAL BASE:
90f90e78ac8b5569f6ff3abfb96fcc2875450ade

CANONICAL BASE TREE:
b488d31fc912425fda1e033a027f3c93242e4809

RUNTIME AUTHORITY:
NONE

ACTIVE LOOP CHANGE:
FORBIDDEN

EVENT VOCABULARY CHANGE:
FORBIDDEN

K2 / POLICY / APPROVAL / CONFINEMENT / DONE GATE CHANGE:
FORBIDDEN

H6:
NOT AUTHORIZED
```

R4A is the first implementation slice authorized by the canonical H5 closure-gap audit.

Its only purpose is to define and prove a pure structural contract that reconstructs one Kodac **step** from canonical session evidence.

For R4A:

```text
KODAC STEP
= one agent.turn.* lifecycle bracket
= one model call plus the tool executions/results belonging to that loop turn
```

R4A does not make the current runtime bracket total. R4B remains responsible for active terminalization and observer-failure containment.

---

## 2. Canonical predecessor audit

Canonical closure-gap audit:

```text
Path:
docs/planning/KODAC_KDO_H5_CLOSURE_GAP_AUDIT_2026-08-15.md

Blob:
c30db22cdd984a746540a93e713fa770aff89c00

Canonical merge:
90f90e78ac8b5569f6ff3abfb96fcc2875450ade

Canonical tree:
b488d31fc912425fda1e033a027f3c93242e4809
```

The audit established:

```text
H5:
NOT CLOSED

MATERIAL REMAINING GAP:
TOTAL DURABLE STEP LIFECYCLE + STEP IDENTITY/RECONSTRUCTION

SECONDARY GAP:
NON-AUTHORITATIVE STREAM OBSERVER FAILURE CONTAINMENT

RECOMMENDED ORDER:
R4A THEN R4B

H6:
DO NOT START
```

R4A addresses only the pure identity/reconstruction half.

---

## 3. Source-pinned design reference

R4A retains the already-admitted H3 design reference only.

```text
Repository:
deepseek-ai/deepseek-harness

Pinned commit:
47f943859bef60e4160492346772ded9b24f765a

License:
MIT

Intake mode for R4A:
STUDY_EXISTING_CANONICAL_REFERENCE_ONLY
```

Relevant previously admitted source:

```text
docs/subsystems/session.md
blob aea9d00b38e384e7a973ce168c3a75a62e70a8bb
```

The donor defines a step as one model call plus the tool executions it requested and gives that unit an explicit open/close lifecycle.

R4A ports the **evidence property**, not the donor runtime or extensibility model:

```text
ONE STARTED STEP
-> ONE STRUCTURALLY RECONSTRUCTABLE TERMINAL OUTCOME
```

No donor code import, dependency, vendored package, runtime execution, or new source-rights decision is authorized by this gate.

---

## 4. Exact implementation allowlist

Before pre-ledger acceptance, R4A implementation may modify **exactly these two paths and no others**:

```text
packages/kodac-runtime/src/session/agent-step.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

The production path is new.

The focused test path is new.

No historical test reconciliation is pre-authorized.

After an exact-head pre-ledger PASS, and only then, exactly one additional path may be added:

```text
docs/planning/KODAC_KDO_H5_R4A_AGENT_STEP_RECONSTRUCTION_EVIDENCE_2026-08-15.md
```

The evidence ledger must be the only post-pre-ledger delta.

---

## 5. Explicit protected surfaces

R4A must not modify:

```text
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/model/turn.ts
packages/kodac-runtime/src/protocol/event.ts
packages/kodac-runtime/src/session/session.ts
packages/kodac-runtime/src/session/model-visible-history.ts
packages/kodac-runtime/src/session/model-visible-request.ts
packages/kodac-runtime/src/agent/tool-result-pruning.ts
packages/kodac-runtime/src/agent/repeat-call-signal.ts
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
packages/kodac-runtime/src/agent/guarded-tool-plan.ts
packages/kodac-runtime/src/trust/policy.ts
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
.github/**
```

The test runner already discovers `test/*.test.ts` automatically. No test-runner edit is necessary or authorized.

If implementation discovers that any protected path must change, R4A stops and requires a separate docs-only correction authorization before that path is touched.

---

## 6. Canonical protected identities at authorization base

The authorization binds the following current identities:

```text
agent loop
packages/kodac-runtime/src/agent/loop.ts
7353ecb758326dace61e90d18590bb5e942a3414

model turn
packages/kodac-runtime/src/model/turn.ts
9ae1298b3a4f917417efbe2228e0708bc813147d

event protocol
packages/kodac-runtime/src/protocol/event.ts
8d837edbbe4e6aceabab17bd9bdf114ab63ff699

runtime session
packages/kodac-runtime/src/session/session.ts
d5f2334b18e89f7bac2bac7422ed8a33669b8afd

H2 model-visible history
packages/kodac-runtime/src/session/model-visible-history.ts
c534368c8a67cca1509146dee22d489f04f4c9c4

H2 model-visible request
packages/kodac-runtime/src/session/model-visible-request.ts
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

R1A pruning primitive
packages/kodac-runtime/src/agent/tool-result-pruning.ts
66cfee69032c4c24331e8cb9098a86a1d7b9135e

R2A repeat-call primitive
packages/kodac-runtime/src/agent/repeat-call-signal.ts
1fd23cbc4dffd6be5ee77446d84bdea2ca27471f

R3A guarded-tool reducer
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
876656bf65a67df56c4cd5f078629cde06112af1

R3B guard plan
packages/kodac-runtime/src/agent/guarded-tool-plan.ts
1ab6217e88c54cd8868e2bcf8d13fbb39e93d994

trust policy
packages/kodac-runtime/src/trust/policy.ts
b4134e430204123bebe053ffc9105f05fca611c9

execution gateway
packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

Done Gate
packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

test runner
packages/kodac-runtime/scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7
```

R4A tests must prove these non-superseded authority surfaces remain byte-identical where applicable.

---

## 7. Production contract

The new production module must be a pure structural module with a bounded immutable output.

Required public vocabulary inside the module:

```text
KDO_H5_R4A_STEP_VERSION:
"kodac-agent-step-v1"

terminal kinds:
"completed" | "failed" | "stopped"
```

`stopped` is intentionally reserved now for R4B future integration.

R4A does **not** add `agent.turn.stopped` to `KodacEventType` and does not emit it. The projector must nevertheless be structurally capable of validating a synthetic/future event whose type string is exactly `agent.turn.stopped`, so R4B can later activate that event without forking the R4A identity contract.

No other future terminal/lifecycle type is accepted.

---

## 8. R4A input boundary

The core reconstruction function must accept an ordered event window and must not rely on ambient `RuntimeSession` state.

Conceptual contract:

```text
projectAgentStep(events)
-> immutable AgentStepEvidence
```

The function may use existing pure H2 validators for recognized H2 payloads.

It must not:

- read a filesystem;
- read environment variables;
- call a provider;
- execute a tool;
- emit or persist an event;
- query a `RuntimeSession`;
- invoke K2/policy/approval/confinement/Done Gate;
- execute arbitrary caller callbacks;
- dynamically import modules;
- perform network access.

The event window is data only.

---

## 9. Step bracket grammar

A valid R4A step window has exactly this lifecycle shape:

```text
agent.turn.started
<zero or more recognized/non-lifecycle events belonging to that turn>
ONE terminal event
```

The terminal event is exactly one of:

```text
agent.turn.completed
agent.turn.failed
agent.turn.stopped
```

Rules:

1. first event must be `agent.turn.started`;
2. last event must be one supported terminal event;
3. no second `agent.turn.started` is permitted inside the window;
4. no terminal event may appear before the last event;
5. exactly one terminal event is permitted;
6. every event must carry the same `sessionId`;
7. sequences must be contiguous and strictly increasing by exactly one;
8. the start payload `turn` must be a positive safe integer;
9. terminal payload must refer to the same `turn` when that terminal shape carries a turn field;
10. no unknown `agent.turn.*` lifecycle event may be ignored;
11. an open step with no terminal event is invalid;
12. events from adjacent turns may not be absorbed into one step.

R4A must not infer terminal state from `agent.loop.completed`, `agent.loop.stopped`, absence, timing, or neighboring events.

---

## 10. Request binding

Within one step window:

```text
model.request.snapshot count <= 1
```

If present:

- its payload must pass canonical `validateModelVisibleRequestSnapshot`;
- the derived H2 `requestIdentity` is bound into the step evidence and step identity.

If absent:

- `requestIdentity` is explicitly represented as absent/null in the step evidence;
- this is valid only for failed/stopped structural vectors that terminated before a request snapshot was durably established;
- a `completed` step without a request snapshot is invalid.

R4A does not duplicate provider/model/messages/tool schemas into the step record.

---

## 11. H2 history bindings

Recognized canonical model-visible history events inside the bracket are:

```text
model.history.message.appended
model.history.repeat_call_advisory.appended
model.history.tool_result_pruning.applied
```

R4A must validate each recognized payload through the canonical H2/R1B/R2B validator/reconstruction surface rather than trusting a supplied identity string blindly.

Step evidence binds only ordered structural identities:

```text
historyRecordIdentities[]
repeatAdvisoryRecordIdentities[]
pruningRecordIdentities[]
```

Raw assistant text, raw tool-result bodies, raw pruning source bodies, and advisory prose must not be copied into `AgentStepEvidence`.

R4A therefore references canonical model-visible evidence rather than creating a second history authority.

---

## 12. R3B guard bindings

Recognized R3B evidence events inside the bracket are:

```text
tool.guard.evaluated
tool.guard.execution_observed
```

R4A may bind only bounded structural identities already owned by R3B, including as applicable:

```text
planIdentity
pipelineResultIdentity
finalCallIdentity
```

The ordered R4A evidence must preserve call/event order.

R4A must not copy raw provider input, effective rewritten input, tool output, policy payload, approval payload, receipt payload, or confinement payload into the step evidence.

R4A must not reinterpret:

```text
blocked=false
```

as permission.

K2 remains independently required downstream.

---

## 13. Structural event references and terminal outcome

Required `AgentStepEvidence` semantics must include at least:

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

Exact TypeScript naming may vary only if the focused proof preserves the same semantic information and no additional authority-bearing/raw fields are introduced.

`stepIdentity` must bind the canonical structural preimage of all fields above except itself.

It must not bind:

- random `eventId` values;
- wall-clock `emittedAt` timestamps;
- raw model/tool content already owned by H2;
- raw execution output;
- secrets;
- ambient process state.

The goal is semantic structural identity, not byte identity of incidental event wrappers.

---

## 14. Determinism and ordering

R4A must prove:

- repeated reconstruction of the same structural evidence yields the same `stepIdentity`;
- changing session, turn, bracket sequence range, terminal kind, request identity, or any bound ordered reference changes `stepIdentity`;
- order of history/guard references is identity-bearing;
- unrelated non-lifecycle/log-only diagnostic events that R4A does not bind do not silently rewrite bound evidence;
- unknown `agent.turn.*` events fail closed instead of being treated as irrelevant diagnostics.

Canonicalization must be locale-independent and deterministic.

---

## 15. Bounds

R4A must define explicit immutable limits in production for at least:

```text
maxStepEvents
maxHistoryRecords
maxRepeatAdvisories
maxPruningRecords
maxGuardEvaluations
maxIdentityReferences
maxCanonicalStepBytes
```

Each limit must have exact limit and limit+1 proof.

The limits must be conservative relative to existing bounded-loop/H2 limits and must not create a larger unbounded storage or replay surface.

No silent truncation is permitted.

If a limit is exceeded, reconstruction fails closed.

---

## 16. Hostile structural input

R4A is a pure data boundary and must not execute caller hooks while inspecting evidence.

Focused tests must prove fail-closed handling for hostile structural shapes where applicable, including:

- Proxy event window;
- Proxy event;
- Proxy payload for a recognized R4A-bound event;
- accessor fields;
- sparse arrays;
- symbol-keyed fields;
- non-enumerable fields;
- cyclic structures when traversed by a bound validator;
- malformed/uppercase/non-SHA-256 structural identities;
- unknown fields in an R4A-owned serialized record, if a serialized record validator is exposed.

Proxy rejection must occur before structural reflection that could invoke Proxy traps.

No `toJSON` or custom coercion hook may be executed as part of validation/canonicalization.

---

## 17. Deep immutability

The returned `AgentStepEvidence` and all nested reference arrays must be deeply immutable/frozen.

The implementation must not expose aliases to caller-owned mutable arrays or objects.

Repeated caller mutation after reconstruction must not alter the accepted step evidence or identity.

---

## 18. Pure import surface

Production `agent-step.ts` may import only deterministic structural helpers required for the contract.

Expected allowed dependency families:

```text
node:crypto
node:util                       # only if Proxy introspection is required
./model-visible-request.ts
./model-visible-history.ts
../protocol/event.ts            # type vocabulary only; no sink use
```

The final focused test must pin the exact import surface actually used.

Forbidden production imports/references include:

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

No new npm/package dependency is authorized.

---

## 19. R4A does not activate `agent.turn.stopped`

R4A must contain no runtime write path.

In particular:

```text
agent.turn.stopped
```

is a reserved structural terminal recognized by the pure R4A projector for future R4B vectors only.

R4A must not:

- add it to `KodacEventType`;
- emit it;
- modify `createEvent`;
- modify `RuntimeSession`;
- change `BoundedAgentLoop`;
- change `AgentTurnRunner`.

R4B will require its own authorization to activate a stopped terminal event or choose a different explicitly authorized active terminalization mechanism.

If R4B chooses a different mechanism, changing R4A is a new separately justified compatibility decision, not implicit permission.

---

## 20. Required fixed proof vectors

The focused test must include deterministic vectors for at least:

### 20.1 Completed no-tool step

```text
agent.turn.started
model.request.snapshot
model.responded
model.history.message.appended   # assistant response when applicable
agent.turn.completed
```

The exact vector must produce a fixed `stepIdentity` pinned in the test after first accepted implementation calculation.

### 20.2 Completed multi-tool step

Must include:

- one H2 request snapshot;
- assistant history with tool calls;
- ordered tool-result histories;
- R3B guard structural evidence when guard fixtures are used;
- one `agent.turn.completed` terminal.

### 20.3 Failed-after-request step

Must include one request snapshot followed by failure evidence and `agent.turn.failed`.

### 20.4 Failed-before-request step

May omit a request snapshot and must still reconstruct as `failed`.

### 20.5 Reserved stopped step

A synthetic future-compatible event vector may use a structurally valid event whose type string is exactly:

```text
agent.turn.stopped
```

This proves R4A's identity contract before R4B activation and does not change the current `KodacEventType` union.

---

## 21. R1B / R2B / R3B coexistence proof

R4A focused proof must explicitly construct or reuse valid canonical fixtures showing:

- an R1B pruning record can exist inside the step and binds by its structural record identity;
- an R2B advisory record can exist and binds by its structural record identity;
- R3B guard evaluated/execution-observed records bind existing guard identities in order;
- these records coexist without altering the H2 request identity;
- step reconstruction does not invoke R1A pruning, R2A repeat transition, or R3A guard reduction as a new policy action except where an existing canonical validator necessarily re-derives a record for integrity checking;
- no R4A result field grants permission or completion truth.

---

## 22. Negative proof matrix

The focused test must reject at least:

1. empty event window;
2. first event not `agent.turn.started`;
3. missing terminal;
4. duplicate terminal;
5. terminal before last event;
6. nested/second `agent.turn.started`;
7. unknown `agent.turn.*` lifecycle event;
8. mixed session ids;
9. noncontiguous sequence numbers;
10. duplicate sequence numbers;
11. regressing sequence numbers;
12. invalid/non-positive turn number;
13. mismatched terminal turn number where present;
14. more than one `model.request.snapshot`;
15. malformed/tampered H2 request snapshot;
16. completed step with no request snapshot;
17. malformed/tampered H2 history record;
18. malformed/tampered R1B pruning record;
19. malformed/tampered R2B advisory record;
20. malformed/invalid R3B structural identity fields that R4A binds;
21. event/ref bounds at limit+1;
22. canonical step bytes at limit+1;
23. hostile Proxy/accessor/sparse/symbol/non-enumerable structures without hook execution;
24. mutation of a reconstructed serialized R4A record if such validator exists;
25. stale/reordered bound identity reference evidence.

No negative case may be converted into partial success or truncation.

---

## 23. Historical regression rule

No existing test may be changed in the initial R4A implementation.

If a historical regression assertion unexpectedly fails because `agent-step.ts` exists but no active surface imports it, that is evidence of a coupling or an obsolete assertion that must be investigated separately.

The implementation must not:

- delete an existing test;
- skip an existing test;
- add `.todo`;
- add a platform bypass;
- weaken an old semantic assertion merely to make CI green.

Any genuinely necessary historical reconciliation requires a separate docs-only correction authorization naming the exact path and superseded property.

---

## 24. Pre-ledger acceptance gate

Before an R4A evidence ledger may exist, an exact implementation head must satisfy all of the following:

```text
BASE:
exact canonical R4A authorization merge

BEHIND:
0

CHANGED PATHS:
exactly the two pre-ledger allowlisted paths or a strict subset

R4A EVIDENCE LEDGER:
ABSENT

R4A FOCUSED TEST:
PASS

FULL KODAC RUNTIME TESTS:
PASS on Windows
PASS on macOS
PASS on Ubuntu

TYPECHECK:
PASS on Windows
PASS on macOS
PASS on Ubuntu

runtime-change-classifier:
PASS

k2-runtime-gate:
PASS

governance / provenance / legacy:
PASS

CodeRabbit:
SUCCESS

UNRESOLVED REVIEW THREADS:
0

K3-R4 / K3-R5:
exact-head PASS if a canonical trigger path changed
OR
NOT_APPLICABLE_PATH_FILTER_PROVEN when exact trigger intersection is empty

MANUAL THEOREM REVIEW:
PASS
```

The manual theorem review must explicitly confirm:

```text
R4A is pure structural reconstruction only.
No runtime writer imports agent-step.ts.
No execution/policy/completion authority is added.
```

No ledger may be created before this gate is accepted.

---

## 25. Evidence ledger requirements

After pre-ledger PASS, the R4A ledger must bind at least:

- this authorization path/blob/canonical merge identity;
- closure-gap audit path/blob/canonical merge identity;
- accepted implementation base/head/tree;
- exact changed-path set;
- production/test blobs;
- R4A version and limits;
- fixed deterministic vectors;
- completed/no-tool and multi-tool proof;
- failed-before/after-request proof;
- reserved stopped-vector proof;
- H2 request/history binding proof;
- R1B/R2B/R3B coexistence proof;
- hostile-structure proof;
- bounds proof;
- pure import/no-authority proof;
- protected surface identities;
- full CI/reviewer state;
- K3 applicability evidence;
- exact pre-ledger acceptance decision.

The ledger is historical evidence, not runtime authority.

---

## 26. Post-ledger gate

Adding the ledger invalidates the pre-ledger head as current acceptance evidence.

The ledger-bearing exact head must receive fresh certification for:

- exact delta from accepted pre-ledger head = ledger path only;
- implementation/test blobs unchanged;
- governance/provenance/legacy PASS;
- runtime-change-classifier PASS;
- Windows/macOS/Ubuntu Typecheck + full Test PASS;
- k2-runtime-gate PASS;
- CodeRabbit SUCCESS;
- zero unresolved review threads;
- K3 applicability recomputed on exact ledger-bearing head;
- manual no-authority/theorem review repeated.

Only after post-ledger PASS may the implementation PR become ready and merge by expected exact head.

---

## 27. Bounded completion claim

If R4A is canonically merged and post-merge identity is verified, the only new bounded claim permitted is:

```text
KODAC_AGENT_STEP_RECONSTRUCTION_PRIMITIVE_PROVEN
```

This claim means only:

- one structurally complete `agent.turn.*` bracket can be deterministically reconstructed and identity-bound;
- existing H2/R1B/R2B/R3B structural evidence can be referenced without duplication or authority widening;
- malformed/open/ambiguous brackets fail closed.

It does **not** mean the active loop always emits a complete bracket.

---

## 28. Explicit non-claims / non-authorizations

R4A does not claim or authorize:

- total active step terminalization;
- `agent.turn.stopped` runtime emission;
- active loop integration;
- stream observer containment;
- generic pre/around/post hooks;
- plugin execution;
- new K2 capability;
- policy changes;
- approval changes;
- confinement changes;
- Done Gate changes;
- H5 complete;
- H6 ready;
- subagents;
- delegation;
- background jobs;
- worktrees;
- writable/persistent memory;
- terminal/PTTY service;
- LSP service;
- workflow engine;
- new dependencies;
- donor source-code import;
- public release;
- package publication.

---

## 29. Authorization truth

If this document is canonically merged under its docs-only gate, the next permitted implementation action is:

```text
CREATE A FRESH R4A IMPLEMENTATION BRANCH FROM THAT CANONICAL MERGE

MODIFY ONLY:
packages/kodac-runtime/src/session/agent-step.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts

DO NOT CREATE THE EVIDENCE LEDGER UNTIL FRESH PRE-LEDGER PASS
```

Status:

```text
KDO_H5_R4A_AGENT_STEP_RECONSTRUCTION_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
