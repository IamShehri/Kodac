# KDO-H5-R4B — Total Step Terminalization + Stream Observer Containment Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R4B

NAME:
TOTAL ACTIVE STEP TERMINALIZATION + NON-AUTHORITATIVE STREAM OBSERVER CONTAINMENT

CANONICAL BASE:
efc84a98077f8df0a749180e6f5875d403f46b3b

CANONICAL BASE TREE:
ec91f77f35ef220e4d19021293ba8e2bd8fb70ca

R4A:
CANONICAL / PROVEN FOR PURE RECONSTRUCTION

ACTIVE LOOP CHANGE:
AUTHORIZED ONLY AS ENUMERATED HERE

EVENT VOCABULARY CHANGE:
AUTHORIZED ONLY FOR agent.turn.stopped

K2 / POLICY / APPROVAL / CONFINEMENT / DONE GATE CHANGE:
FORBIDDEN

H6:
NOT AUTHORIZED
```

R4B is the active-runtime companion to canonical R4A.

Its purpose is exactly twofold:

1. make every durably started loop turn receive one explicit terminal turn outcome when terminal persistence succeeds; and
2. prevent the non-authoritative `onStreamEvent` observer hook from acquiring an implicit turn-failure veto through throw/rejection.

R4B does not add a generic hook framework, workflow engine, second policy layer, subagent runtime, background-job system, or new execution authority.

---

## 2. Canonical R4A predecessor

Canonical R4A implementation merge:

```text
efc84a98077f8df0a749180e6f5875d403f46b3b
```

Canonical R4A tree:

```text
ec91f77f35ef220e4d19021293ba8e2bd8fb70ca
```

R4A production primitive:

```text
packages/kodac-runtime/src/session/agent-step.ts
blob a999f1f134167f61266910566612149da91e9a5c
```

R4A focused proof:

```text
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
blob ca969c7881ba1840d43ac89f2ed2670be2cfffb0
```

R4A evidence ledger:

```text
docs/planning/KODAC_KDO_H5_R4A_AGENT_STEP_RECONSTRUCTION_EVIDENCE_2026-08-15.md
```

R4A bounded claim:

```text
KODAC_AGENT_STEP_RECONSTRUCTION_PRIMITIVE_PROVEN
```

R4A does not prove that the active loop currently produces a complete bracket. R4B is authorized to close exactly that gap.

---

## 3. Canonical closure-gap source

Canonical H5 closure audit:

```text
Path:
docs/planning/KODAC_KDO_H5_CLOSURE_GAP_AUDIT_2026-08-15.md

Blob:
c30db22cdd984a746540a93e713fa770aff89c00

Canonical merge:
90f90e78ac8b5569f6ff3abfb96fcc2875450ade
```

The audit established two remaining H5 gaps:

```text
MATERIAL GAP:
TOTAL DURABLE STEP LIFECYCLE + STEP IDENTITY/RECONSTRUCTION

SECONDARY GAP:
NON-AUTHORITATIVE STREAM OBSERVER FAILURE CONTAINMENT
```

R4A closed identity/reconstruction.

R4B addresses the active lifecycle and observer halves only.

---

## 4. Exact current runtime surfaces

Canonical base blobs:

```text
packages/kodac-runtime/src/agent/loop.ts
7353ecb758326dace61e90d18590bb5e942a3414

packages/kodac-runtime/src/model/turn.ts
9ae1298b3a4f917417efbe2228e0708bc813147d

packages/kodac-runtime/src/protocol/event.ts
8d837edbbe4e6aceabab17bd9bdf114ab63ff699

packages/kodac-runtime/src/session/session.ts
d5f2334b18e89f7bac2bac7422ed8a33669b8afd
```

Current canonical `RuntimeSession.emit()` appends to the sink before advancing session sequence or journaling the event.

Therefore terminal event sink rejection already has the required fail-closed primitive:

```text
TERMINAL APPEND REJECTED
=> TERMINAL NOT JOURNALED
=> SESSION SEQUENCE NOT ADVANCED
=> CALLER RECEIVES FAILURE
```

R4B must preserve that behavior and must not synthesize a fallback terminal success after a rejected terminal append.

---

## 5. Exact pre-ledger implementation allowlist

Before R4B pre-ledger acceptance, implementation may modify exactly these six paths and no others:

```text
packages/kodac-runtime/src/protocol/event.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/model/turn.ts
packages/kodac-runtime/test/kdo-h5-r4b-total-step-terminalization.test.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
packages/kodac-runtime/test/kdo-h5-r1b-evidence-preserving-tool-result-pruning.test.ts
```

The R4B focused test is new.

The two existing test paths are explicitly authorized historical reconciliations only as described below.

After fresh pre-ledger PASS, and only then, exactly one additional path may be added:

```text
docs/planning/KODAC_KDO_H5_R4B_TOTAL_STEP_TERMINALIZATION_EVIDENCE_2026-08-15.md
```

That ledger must be the only post-pre-ledger delta.

---

## 6. Authorized historical reconciliation A — R4A proof

Path:

```text
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

Current R4A focused proof pins `loop.ts`, `turn.ts`, and `event.ts` as byte-identical because R4A itself was forbidden from changing active runtime surfaces.

R4B deliberately supersedes exactly that non-integration property.

The R4A proof may therefore be changed only to replace obsolete byte pins for these three active R4B surfaces with stronger semantic assertions that prove:

- R4A production `agent-step.ts` remains byte-identical;
- R4A version/limits/fixed identities remain exact;
- active R4B loop terminal events reconstruct through unchanged R4A;
- `agent.turn.stopped` is now the only new R4B terminal vocabulary;
- R4B does not make R4A an execution/policy/completion authority;
- K2/policy/Done Gate protected surfaces remain byte-identical.

No R4A fixed vector, bound, hostile-input test, or pure-import assertion may be weakened.

---

## 7. Authorized historical reconciliation B — R1B proof

Path:

```text
packages/kodac-runtime/test/kdo-h5-r1b-evidence-preserving-tool-result-pruning.test.ts
```

The R1B predecessor test currently pins canonical `turn.ts` blob:

```text
9ae1298b3a4f917417efbe2228e0708bc813147d
```

R4B deliberately changes `turn.ts` only to contain `onStreamEvent` observer throw/rejection after canonical stream evidence persistence.

The R1B test may replace that byte pin only with semantic assertions proving:

- `turn.ts` still does not import or invoke R1A/R1B pruning;
- R1B pruning remains confined to model-visible history/loop projection;
- observer containment does not change request/history/pruning semantics;
- no K2/Done Gate authority enters pruning/history code.

No R1B deterministic identity, raw-history recoverability, sink-failure blocker, byte-bound, or legacy `maxToolResultChars` assertion may be weakened.

---

## 8. Explicit protected paths

R4B must not modify:

```text
packages/kodac-runtime/src/session/agent-step.ts
packages/kodac-runtime/src/session/session.ts
packages/kodac-runtime/src/session/model-visible-history.ts
packages/kodac-runtime/src/session/model-visible-request.ts
packages/kodac-runtime/src/agent/tool-result-pruning.ts
packages/kodac-runtime/src/agent/repeat-call-signal.ts
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
packages/kodac-runtime/src/agent/guarded-tool-plan.ts
packages/kodac-runtime/src/runtime/orchestrator.ts
packages/kodac-runtime/src/tools/registry.ts
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

No new dependency is authorized.

If any additional source/test path appears necessary, implementation must stop and obtain a docs-only correction authorization before touching it.

---

## 9. Required event vocabulary change

R4B may add exactly one event type to `KodacEventType`:

```text
agent.turn.stopped
```

No other event type is authorized.

Required payload semantics:

```text
{
  turn: positive integer,
  reason: Exclude<AgentLoopStopReason, "completed">,
  budget: current AgentLoopBudget
}
```

This event means:

```text
THE CURRENT STARTED TURN TERMINATED DUE TO A BOUNDED/CONTROL STOP
```

It does not mean failure, success, permission, verification, or Done Gate readiness.

R4A already recognizes this exact type structurally.

---

## 10. Terminal outcome taxonomy

After a durable `agent.turn.started`, R4B must classify the turn into exactly one intended terminal class:

### Completed

```text
agent.turn.completed
```

Only after:

- provider/model turn returned successfully;
- required tool execution completed;
- required guard execution evidence completed;
- required H2 assistant/tool-result history persisted;
- required R2B advisory persisted if applicable;
- all evidence-critical post-turn work required for successful model-visible continuity succeeded.

### Failed

```text
agent.turn.failed
```

For ordinary/error outcomes, including as applicable:

- provider failure;
- malformed provider output;
- unknown tool;
- guard block;
- trusted-host `beforeToolCall` veto throw that is not an `AgentLoopStop`;
- tool execution failure;
- guard evidence persistence failure;
- R1B pre-provider projection/pruning failure;
- R1B pruning transformation persistence failure;
- H2 post-run projection failure;
- H2 assistant/tool-result history persistence failure;
- R2B advisory construction/persistence failure;
- other fail-closed non-control errors after the turn was started.

### Stopped

```text
agent.turn.stopped
```

For bounded/control outcomes after turn start:

- `aborted`;
- `max_elapsed`;
- `max_tool_calls`;
- `duplicate_tool_call`.

`cycle_detected`, `max_turns`, and `max_failures` normally occur only after the current turn has already received a completed/failed terminal event and therefore remain outer-loop stop reasons rather than a second terminal for the same turn.

The focused proof must validate actual control flow rather than assuming this distinction.

---

## 11. Total terminalization theorem

Required active theorem:

```text
IF agent.turn.started IS DURABLY APPENDED
THEN BEFORE THAT BoundedAgentLoop.run() CALL RETURNS OR THROWS,
THE IMPLEMENTATION MUST HAVE MADE EXACTLY ONE TERMINAL TURN APPEND ATTEMPT
FOR THAT TURN.
```

When terminal persistence succeeds:

```text
EXACTLY ONE TERMINAL TURN EVENT IS DURABLY JOURNALED.
```

When terminal persistence fails:

```text
NO TERMINAL SUCCESS MAY BE FABRICATED,
NO SECOND/FALLBACK TERMINAL MAY BE ATTEMPTED,
THE LOOP CALL MUST REJECT.
```

This distinction is essential:

```text
TOTAL TERMINALIZATION ATTEMPT
!= CLAIM THAT PERSISTENCE CAN NEVER FAIL
```

R4B must not catch a rejected terminal append and emit a different terminal type.

---

## 12. Terminal-attempt guard

Implementation should use an explicit per-turn terminal-attempt guard or an equivalent mechanically provable structure.

Required property:

```text
terminalAttempted starts false
first terminal helper invocation sets it true before awaiting persistence
any second terminal helper invocation is a programming error and must not append
```

This prevents a failed `agent.turn.completed` append from being caught and followed by `agent.turn.failed`, which would violate one-terminal-attempt semantics.

The helper itself must not hide sink rejection.

---

## 13. Pre-provider failure after turn start

Current canonical flow emits `agent.turn.started` before `messagesForNextTurn()`.

R4B must preserve that order but terminalize failures from:

- `projectModelVisibleHistory(runEvents())`;
- R1B pruning calculation/validation;
- R1B pruning-record construction;
- `model.history.tool_result_pruning.applied` persistence;
- re-projection after pruning.

Required behavior:

```text
agent.turn.started
<pre-provider evidence processing fails>
agent.turn.failed   # if terminal persistence succeeds
throw original failure
```

There must be no provider request when the failure occurred before provider dispatch.

R4B must not convert evidence-critical pre-provider failure into a retry or successful loop stop.

---

## 14. Runner failure behavior

Existing ordinary runner failures preserve the current bounded failure/recovery behavior where safe:

```text
runner failure
-> agent.turn.failed
-> if failure budget exhausted: agent.loop.stopped(max_failures)
-> otherwise append canonical recovery history
-> continue
```

R4B must preserve this behavior for ordinary provider/tool failures.

If recovery-history persistence fails **after** `agent.turn.failed` has already been durably appended, the loop may reject. It must not emit another terminal for the same turn.

---

## 15. Control-stop behavior

When trusted loop control raises `AgentLoopStop` after `agent.turn.started`, required order is:

```text
agent.turn.stopped
agent.loop.stopped
```

with the same stop reason.

If `agent.turn.stopped` persistence rejects:

- `agent.loop.stopped` must not be emitted as though the turn were durably terminal;
- the loop call must reject;
- no alternate terminal event may be attempted.

If `agent.turn.stopped` succeeds but later `agent.loop.stopped` persistence rejects, the turn remains durably stopped while the loop-level call rejects. R4B must not alter the already terminal turn.

---

## 16. Abort and elapsed-time behavior

Abort/elapsed-time paths currently return `agent.loop.stopped` directly from the runner catch.

R4B must first terminalize the active turn:

```text
input signal aborted -> agent.turn.stopped(reason=aborted)
turn timeout/elapsed -> agent.turn.stopped(reason=max_elapsed)
```

A pre-turn abort/elapsed stop discovered by the guard **before** `agent.turn.started` does not require a turn terminal because no turn was durably started.

The focused test must distinguish pre-turn from in-turn control stops.

---

## 17. Post-run evidence-critical failure

After successful `AgentTurnRunner.run()`, current canonical logic performs H2 projection/history work before `agent.turn.completed`.

R4B must keep successful terminal truth after evidence-critical work.

If post-run projection/history/advisory persistence fails:

```text
agent.turn.completed MUST NOT be emitted
agent.turn.failed MUST be attempted
loop call MUST reject
```

No recovery retry is required for this evidence-critical class because model/tool side effects may already have occurred and model-visible continuity was not durably established.

R4B must not launder such a failure into a successful completed turn.

---

## 18. Completed turn order

Successful order remains:

```text
agent.turn.started
model/request/tool/guard/history evidence
agent.turn.completed
```

Only after the completed terminal succeeds may the outer loop:

- emit `agent.loop.completed` for `finishReason=stop`;
- evaluate/return outer cycle stop;
- continue to the next turn.

If `agent.turn.completed` persistence rejects, the loop call rejects and no `agent.loop.completed` or same-turn alternate terminal is emitted.

---

## 19. R4A reconstruction requirement

Every R4B terminalized bracket for which terminal persistence succeeded must reconstruct using unchanged canonical:

```text
projectAgentStep(...)
```

R4B focused proof must extract each single-turn event bracket and prove:

```text
terminalKind completed -> R4A completed
terminalKind failed -> R4A failed
terminalKind stopped -> R4A stopped
```

R4B must not modify `agent-step.ts` to accommodate its active traces.

If active traces do not satisfy canonical R4A, R4B implementation is wrong or requires a separate correction authorization.

---

## 20. Stream observer authority boundary

Canonical `AgentTurnHooks` includes:

```text
onStreamEvent?(event: ModelProviderStreamEvent): Promise<void> | void
```

This hook is observation only.

R4B required rule:

```text
AFTER KODAC'S OWN CANONICAL STREAM EVENT APPEND SUCCEEDS,
A THROW OR REJECT FROM hooks.onStreamEvent
MUST NOT CAUSE provider.generate / AgentTurnRunner.run / BoundedAgentLoop.run
TO FAIL SOLELY BECAUSE OF THAT OBSERVER ERROR.
```

The minimal authorized implementation is to invoke/await the observer in a bounded try/catch after canonical stream evidence append and discard its error.

R4B does not authorize:

- a detached/background observer job system;
- observer retries;
- observer return-value authority;
- observer-driven model/tool mutation;
- observer-driven K2 decisions;
- a new observer-failure event requirement;
- raw observer error persistence.

The implementation should preserve existing sequencing by awaiting the observer; R4B addresses failure authority, not arbitrary observer latency policy.

---

## 21. Evidence-critical stream persistence remains fail-closed

R4B observer containment must occur only after canonical Kodac stream evidence persistence.

If:

```text
session.emit("model.stream.*", ...)
```

fails, the model turn must still fail closed.

R4B must not catch or suppress canonical event-sink failure together with the observer error.

Required distinction:

```text
KODAC STREAM EVIDENCE FAILURE:
FAIL-CLOSED

CALLER OBSERVER THROW/REJECTION AFTER KODAC EVIDENCE:
CONTAINED
```

---

## 22. `beforeToolCall` remains a trusted veto

R4B must not generalize observer containment to:

```text
beforeToolCall
```

The existing R3B trusted-host semantics remain:

- call is immutable;
- hook return values do not grant authority;
- hook throw vetoes before tool execution;
- `AgentLoopStop` from loop-owned beforeToolCall logic drives bounded stop;
- arbitrary trusted-host throw remains an ordinary failed turn;
- K2 still independently governs side-effect execution.

Any test or source change that swallows `beforeToolCall` errors is forbidden.

---

## 23. No raw error authority expansion

Terminal events may retain existing bounded coarse error text behavior for `agent.turn.failed`.

R4B must not add:

- stack traces;
- secrets;
- raw provider response bodies;
- raw tool outputs;
- approval secrets;
- environment dumps;
- unbounded exception serialization.

`agent.turn.stopped` carries reason + budget, not arbitrary error content.

---

## 24. Required R4B focused proof matrix

The new focused test must prove at least:

1. successful no-tool turn -> exactly one `agent.turn.completed`;
2. successful tool turn -> exactly one `agent.turn.completed`;
3. completed bracket reconstructs via unchanged R4A;
4. provider failure -> exactly one `agent.turn.failed`;
5. malformed provider output -> exactly one `agent.turn.failed`;
6. tool failure -> exactly one `agent.turn.failed`;
7. unknown provider tool -> exactly one `agent.turn.failed`;
8. R3B guard block -> exactly one `agent.turn.failed` and zero tool execution;
9. trusted-host arbitrary veto -> exactly one `agent.turn.failed` and zero tool execution;
10. duplicate-tool control stop -> `agent.turn.stopped(reason=duplicate_tool_call)` before loop stop;
11. max-tool-call control stop -> `agent.turn.stopped(reason=max_tool_calls)` before loop stop;
12. in-turn external abort -> `agent.turn.stopped(reason=aborted)`;
13. in-turn timeout -> `agent.turn.stopped(reason=max_elapsed)`;
14. stopped bracket reconstructs via unchanged R4A;
15. failed bracket reconstructs via unchanged R4A when its canonical H2 evidence is structurally complete;
16. pre-turn abort emits no `agent.turn.started` and therefore no turn terminal;
17. R1B pruning transformation sink rejection after turn start -> failed terminal attempt and no later provider request;
18. H2 assistant/tool-result history sink rejection -> failed terminal, no completed terminal;
19. R2B advisory sink rejection -> failed terminal, no completed terminal;
20. guard execution-observation sink rejection -> failed terminal, no completed terminal;
21. completed terminal sink rejection -> loop rejects, zero durable terminal, no fallback failed/stopped terminal;
22. failed terminal sink rejection -> loop rejects, zero durable terminal, no fallback terminal;
23. stopped terminal sink rejection -> loop rejects, zero durable terminal, no loop-stopped event for that active stop;
24. successful stopped terminal followed by loop-stopped sink rejection -> one durable stopped turn terminal remains;
25. sync `onStreamEvent` throw after canonical stream evidence is contained;
26. async `onStreamEvent` rejection after canonical stream evidence is contained;
27. observer containment does not suppress canonical stream event sink failure;
28. observer return value has no authority;
29. `beforeToolCall` throw remains a veto;
30. no terminal duplication under failure/stop races;
31. cycle-detected outer stop occurs only after prior completed turn terminal;
32. max-turns outer stop occurs only after prior completed turn terminal;
33. max-failures outer stop occurs after failed turn terminal;
34. every durable R4B turn terminal has matching turn id and bracket ordering;
35. no R4B path changes R4A fixed step identities for equivalent structural fixtures.

Tests may combine cases where safe, but every property must be observable.

---

## 25. Fresh historical reconciliation proof

R4B pre-ledger acceptance requires the reconciled R4A and R1B tests to prove the earlier non-superseded properties remain intact.

No existing test may be:

- deleted;
- skipped;
- marked todo;
- weakened outside the exact superseded blob-pin property;
- changed for unrelated convenience.

If another historical test fails because it pins one of the deliberately changed R4B surfaces, implementation must stop and obtain a correction authorization naming that exact test/property before modifying it.

---

## 26. Protected authority identities

R4B focused/historical proof must continue to pin as unchanged at least:

```text
packages/kodac-runtime/src/session/agent-step.ts
a999f1f134167f61266910566612149da91e9a5c

packages/kodac-runtime/src/session/session.ts
d5f2334b18e89f7bac2bac7422ed8a33669b8afd

packages/kodac-runtime/src/session/model-visible-history.ts
c534368c8a67cca1509146dee22d489f04f4c9c4

packages/kodac-runtime/src/session/model-visible-request.ts
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

packages/kodac-runtime/src/agent/tool-result-pruning.ts
66cfee69032c4c24331e8cb9098a86a1d7b9135e

packages/kodac-runtime/src/agent/repeat-call-signal.ts
1fd23cbc4dffd6be5ee77446d84bdea2ca27471f

packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
876656bf65a67df56c4cd5f078629cde06112af1

packages/kodac-runtime/src/agent/guarded-tool-plan.ts
1ab6217e88c54cd8868e2bcf8d13fbb39e93d994

packages/kodac-runtime/src/runtime/orchestrator.ts
b069da69909b282fdbdc2c62279e0297cbd430e9

packages/kodac-runtime/src/tools/registry.ts
0bdf5cfd02efda7cab0c81976c7735bc7b46081b

packages/kodac-runtime/src/trust/policy.ts
b4134e430204123bebe053ffc9105f05fca611c9

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

packages/kodac-runtime/scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7
```

---

## 27. K2 and Done Gate invariants

R4B changes lifecycle evidence, not execution authority.

Required unchanged theorem:

```text
R3B EFFECTIVE CALL
-> K2 / policy / approval / confinement / gateway
-> tool execution
```

R4B may classify the surrounding turn as failed/stopped/completed, but it may not authorize execution.

Likewise:

```text
agent.turn.completed
!= PROVEN_READY
```

Only Done Gate can establish current `PROVEN_READY` truth.

No R4B event payload may contain fields named or semantically equivalent to:

```text
allowed
approved
permissionGranted
safeToExecute
provenReady
sandboxed
```

as authority claims.

---

## 28. Pre-ledger gate

Before an R4B evidence ledger may exist, the exact implementation head must satisfy:

```text
BASE:
exact canonical R4B authorization merge

BEHIND:
0

CHANGED PATHS:
exactly the six pre-ledger allowlisted paths or a strict subset

R4B EVIDENCE LEDGER:
ABSENT

R4B FOCUSED TEST:
PASS

R4A RECONCILED PROOF:
PASS

R1B RECONCILED PROOF:
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
NOT_APPLICABLE_PATH_FILTER_PROVEN if intersection is empty

MANUAL THEOREM REVIEW:
PASS
```

Manual review must explicitly establish:

```text
one terminal append attempt per durably started turn
no terminal fallback after terminal sink rejection
onStreamEvent observer error containment occurs only after canonical stream evidence append
beforeToolCall veto remains active
R4A primitive unchanged
K2 and Done Gate unchanged
```

No ledger may be created before this gate is accepted.

---

## 29. Evidence ledger requirements

After pre-ledger PASS, the R4B evidence ledger must bind at least:

- this authorization path/blob/canonical merge identity;
- closure audit and R4A canonical identities;
- accepted implementation base/head/tree;
- exact changed-path set;
- production/test/reconciled-test blobs;
- `agent.turn.stopped` vocabulary and payload shape;
- successful/failed/stopped order vectors;
- R4A reconstruction proof of active brackets;
- pre-provider pruning/history failure proof;
- post-run history/advisory failure proof;
- guard evidence failure proof;
- terminal sink rejection/no-fallback proof;
- loop-stop ordering proof;
- sync/async observer containment proof;
- canonical stream persistence fail-closed proof;
- trusted `beforeToolCall` veto proof;
- protected authority blobs;
- full exact-head CI/reviewer state;
- K3 applicability evidence;
- no-skip/delete/bypass proof;
- exact pre-ledger acceptance decision.

The ledger is historical evidence only.

---

## 30. Post-ledger gate

The ledger-bearing head must receive fresh certification.

Required:

- exact pre-ledger→post-ledger delta = ledger path only;
- all implementation/test blobs unchanged;
- governance/provenance/legacy PASS;
- runtime-change-classifier PASS;
- Windows/macOS/Ubuntu Typecheck + full Test PASS;
- k2-runtime-gate PASS;
- CodeRabbit SUCCESS;
- zero unresolved review threads;
- K3 applicability recomputed;
- manual terminalization/observer/no-authority theorem review repeated.

Only after post-ledger PASS may the R4B PR become ready and merge via expected exact head.

---

## 31. Bounded completion claim

If R4B is canonically merged and post-merge identity is verified, the only new bounded claim permitted is:

```text
KODAC_TOTAL_AGENT_STEP_TERMINALIZATION_AND_STREAM_OBSERVER_CONTAINMENT_PROVEN
```

This means only:

- the active bounded agent loop terminalizes every durably started turn through completed/failed/stopped when terminal persistence succeeds;
- terminal persistence failure remains explicit/unproven with no fallback terminal fabrication;
- canonical R4A reconstructs durable active brackets;
- `onStreamEvent` throw/rejection no longer acts as an implicit turn-failure authority after canonical stream evidence append;
- trusted `beforeToolCall`, K2, and Done Gate authority remain intact.

---

## 32. H5 remains subject to a separate closure review

R4B merge does not automatically authorize the claim:

```text
H5 COMPLETE
```

After R4B is canonical, a separate docs-only H5 closure review must reconcile the original H3 matrix against:

- H2;
- H4 prerequisites as relevant;
- R1B;
- R2B;
- R3B;
- R4A;
- R4B.

Only that closure review may decide whether H5 is complete and whether H6 sequencing blockers from H5 are cleared.

H4 readiness remains independently governed.

---

## 33. Explicit non-authorizations

R4B does not authorize:

- modification of R4A production;
- new step identity version;
- generic hooks/plugins;
- around/post/finalize waterfall framework;
- observer background jobs;
- observer retries;
- subagents;
- delegation;
- background jobs;
- worktrees;
- writable/persistent memory;
- terminal/PTTY service;
- LSP service;
- dynamic workflow engine;
- H6;
- H7;
- K2 changes;
- policy changes;
- approval changes;
- confinement changes;
- Done Gate changes;
- new dependencies;
- donor code import;
- public release;
- package publication.

---

## 34. Authorization truth

If this document becomes canonical, the next permitted implementation action is:

```text
CREATE A FRESH R4B IMPLEMENTATION BRANCH FROM THAT CANONICAL MERGE

MODIFY ONLY THE SIX PRE-LEDGER ALLOWLISTED PATHS

DO NOT CREATE THE R4B EVIDENCE LEDGER UNTIL FRESH PRE-LEDGER PASS
```

Status:

```text
KDO_H5_R4B_TOTAL_STEP_TERMINALIZATION_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
