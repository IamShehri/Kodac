# KDO-H5-R4B — Total Step Terminalization + Stream Observer Containment Evidence

Date: 2026-08-15
Status: PRE-LEDGER ACCEPTED — POST-LEDGER CERTIFICATION REQUIRED

## 1. Evidence decision

```text
GATE:
KDO-H5-R4B

PRE-LEDGER:
PASS

CANONICAL AUTHORIZATION BASE:
1eb7a357fafae713ab7c18d7aff1412c47d484ba

ACCEPTED PRE-LEDGER HEAD:
1ccc289347a86c3c492ecfa69e1dfed50d4dcdea

ACCEPTED PRE-LEDGER TREE:
7e8d4c332fe44ab352c7bf4a3ea79588cc6d79d5

POST-LEDGER:
PENDING FRESH EXACT-HEAD CERTIFICATION

H5 COMPLETE:
NOT CLAIMED

H6:
NOT AUTHORIZED
```

This ledger records the accepted R4B pre-ledger evidence. It is historical evidence only and does not itself grant runtime, policy, approval, confinement, completion, or H6 authority.

---

## 2. Canonical authorization identity

R4B authorization:

```text
path:
docs/planning/KODAC_KDO_H5_R4B_TOTAL_STEP_TERMINALIZATION_AUTHORIZATION_2026-08-15.md

blob:
713627b11f595ff6fc8cabbdc3a2a0eda950ae06

canonical merge:
1eb7a357fafae713ab7c18d7aff1412c47d484ba
```

The authorization requires total terminal append attempt semantics, no fallback terminal after terminal persistence rejection, R4A reconstruction of durable active brackets, non-authoritative `onStreamEvent` containment only after canonical stream evidence persistence, and preservation of trusted `beforeToolCall`, K2, and Done Gate authority.

---

## 3. Closure audit and R4A predecessor

H5 closure-gap audit:

```text
path:
docs/planning/KODAC_KDO_H5_CLOSURE_GAP_AUDIT_2026-08-15.md

blob:
c30db22cdd984a746540a93e713fa770aff89c00

canonical merge:
90f90e78ac8b5569f6ff3abfb96fcc2875450ade
```

The audit identified the remaining R4 family as:

```text
TOTAL DURABLE STEP LIFECYCLE + STEP IDENTITY/RECONSTRUCTION
NON-AUTHORITATIVE STREAM OBSERVER FAILURE CONTAINMENT
```

R4A canonical implementation:

```text
merge:
efc84a98077f8df0a749180e6f5875d403f46b3b

tree:
ec91f77f35ef220e4d19021293ba8e2bd8fb70ca

production primitive:
packages/kodac-runtime/src/session/agent-step.ts

blob:
a999f1f134167f61266910566612149da91e9a5c

bounded claim:
KODAC_AGENT_STEP_RECONSTRUCTION_PRIMITIVE_PROVEN
```

R4B does not modify the R4A production primitive.

---

## 4. Exact accepted pre-ledger scope

Base:

```text
1eb7a357fafae713ab7c18d7aff1412c47d484ba
```

Head:

```text
1ccc289347a86c3c492ecfa69e1dfed50d4dcdea
```

Tree:

```text
7e8d4c332fe44ab352c7bf4a3ea79588cc6d79d5
```

Exact changed paths:

```text
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/model/turn.ts
packages/kodac-runtime/src/protocol/event.ts
packages/kodac-runtime/test/kdo-h5-r1b-evidence-preserving-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
packages/kodac-runtime/test/kdo-h5-r4b-total-step-terminalization.test.ts
```

This is exactly the six-path pre-ledger authorization allowlist.

No R4B evidence ledger existed on the accepted pre-ledger head.

---

## 5. Accepted production and proof blobs

```text
packages/kodac-runtime/src/agent/loop.ts
576ad425db7e845b9705c982e95dd4f7522f8c43

packages/kodac-runtime/src/model/turn.ts
e1e29389d7498f21ee96cbeb5c60a061fb5f164e

packages/kodac-runtime/src/protocol/event.ts
588fc1d849de7493912a66cdea0e567a72c92282

packages/kodac-runtime/test/kdo-h5-r4b-total-step-terminalization.test.ts
8552c3c9df9334ecb2c072ff3f73b03b35aab91b

packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
8e83f95a405644429b852a9496bc3a9a3aca8ea8

packages/kodac-runtime/test/kdo-h5-r1b-evidence-preserving-tool-result-pruning.test.ts
1482e822acbc9d213c30b628fb425b78b6ecef10
```

The historical reconciliation delta after the initial R4B diagnostic head modified only the two explicitly authorized historical test paths. No production file changed during reconciliation.

---

## 6. Event vocabulary proof

R4B adds exactly one required turn-lifecycle event type:

```text
agent.turn.stopped
```

The active turn lifecycle vocabulary proven by the reconciled R4A test is exactly:

```text
agent.turn.started
agent.turn.completed
agent.turn.failed
agent.turn.stopped
```

Required stopped payload semantics are bounded to:

```text
{
  turn: positive integer,
  reason: bounded non-completed AgentLoopStopReason,
  budget: current AgentLoopBudget
}
```

No permission, approval, sandbox, execution grant, verification, or Done Gate readiness claim is carried by `agent.turn.stopped`.

---

## 7. Total terminalization theorem

Accepted theorem:

```text
IF agent.turn.started IS DURABLY APPENDED
THEN BEFORE THAT BoundedAgentLoop.run() RETURNS OR THROWS
THE IMPLEMENTATION MAKES EXACTLY ONE TERMINAL APPEND ATTEMPT FOR THAT TURN.
```

Implementation proof includes a per-turn terminal-attempt guard:

```text
terminalAttempted = false
first terminal helper sets terminalAttempted = true before awaiting persistence
second terminal helper invocation is rejected before append
```

When terminal persistence succeeds, exactly one durable terminal is journaled.

When terminal persistence rejects:

```text
NO FALLBACK TERMINAL IS ATTEMPTED
NO SUCCESS IS FABRICATED
LOOP CALL REJECTS
```

Focused tests prove terminal sink rejection for completed, failed, and stopped paths and prove the absence of a fallback terminal.

---

## 8. Successful order vectors

Successful no-tool and tool turns prove:

```text
agent.turn.started
-> canonical model/request/tool/guard/history evidence as applicable
-> agent.turn.completed
```

`agent.turn.completed` occurs only after evidence-critical post-run work has succeeded.

After durable completed terminalization, outer-loop completion or later-turn control may proceed.

Durable completed brackets reconstruct through unchanged R4A `projectAgentStep(...)` as terminal kind `completed`.

---

## 9. Failed order vectors

Focused proof covers ordinary and evidence-critical failure classes including:

```text
provider failure
malformed provider output
tool failure
unknown provider tool
R3B guard block
trusted-host arbitrary veto
R1B pruning persistence failure
H2 assistant/tool-result history persistence failure
R2B advisory persistence failure
guard execution-observation persistence failure
```

Required active shape:

```text
agent.turn.started
-> failure evidence as applicable
-> agent.turn.failed
```

For evidence-critical failures after side effects or provider activity, no completed terminal is emitted and the loop rejects rather than laundering incomplete evidence continuity into success.

Ordinary runner failures retain the bounded failure/recovery behavior after the durable failed terminal where authorized.

---

## 10. Stopped order vectors

Focused proof covers active bounded/control stops:

```text
duplicate_tool_call
max_tool_calls
aborted
max_elapsed
```

Required active order:

```text
agent.turn.started
-> agent.turn.stopped(reason=...)
-> agent.loop.stopped(reason=...)
```

Pre-turn abort before `agent.turn.started` correctly produces no turn terminal.

Cycle detection, max-turns, and max-failures outer-loop stops are proven to occur only after the current turn already has its appropriate completed/failed terminal.

If a stopped terminal persists but the later outer `agent.loop.stopped` append rejects, the durable stopped terminal remains and no second terminal is attempted.

---

## 11. R4A active-bracket reconstruction proof

Unchanged canonical R4A production:

```text
packages/kodac-runtime/src/session/agent-step.ts
a999f1f134167f61266910566612149da91e9a5c
```

The R4B focused matrix proves active durable brackets reconstruct through this unchanged primitive as:

```text
agent.turn.completed -> terminalKind=completed
agent.turn.failed    -> terminalKind=failed
agent.turn.stopped   -> terminalKind=stopped
```

R4B does not import or invoke R4A reconstruction from the active loop or turn runner. R4A remains evidence reconstruction only, not execution, policy, approval, confinement, or completion authority.

R4A fixed versions, limits, fixed identity vectors, hostile-input tests, pure-import boundary, and internal-only status remain intact.

---

## 12. R1B pre-provider evidence failure proof

R1B remains confined to model-visible history/loop projection.

Focused R4B proof establishes:

```text
agent.turn.started
-> R1B pruning transformation append rejects
-> agent.turn.failed append attempted
-> later provider request is blocked
-> loop rejects
```

The R1A pruning primitive remains byte-identical:

```text
packages/kodac-runtime/src/agent/tool-result-pruning.ts
66cfee69032c4c24331e8cb9098a86a1d7b9135e
```

The reconciled R1B proof establishes that R4B `turn.ts` observer containment does not import or invoke pruning and does not change R1B request/history/pruning semantics.

---

## 13. Post-run H2/R2B evidence failure proof

After successful runner execution, evidence-critical model-visible continuity remains prior to completed terminal truth.

Focused tests prove:

```text
H2 history append rejection
OR
R2B advisory append rejection
=> agent.turn.failed
=> no agent.turn.completed
=> loop rejects
```

This preserves the invariant that a successfully executed model/tool operation is not reported as a completed turn when required model-visible continuity evidence was not durably established.

---

## 14. Guard evidence failure proof

Focused proof establishes:

```text
tool.guard.execution_observed persistence rejection
=> agent.turn.failed
=> no agent.turn.completed
```

R4B lifecycle classification does not grant tool execution authority and does not replace R3B guard evaluation or K2.

---

## 15. Stream observer containment proof

Canonical boundary:

```text
Kodac canonical model.stream.* append
-> only after successful persistence: invoke/await hooks.onStreamEvent
```

Focused proof establishes both:

```text
synchronous observer throw -> contained
asynchronous observer rejection -> contained
```

when canonical stream evidence has already persisted.

The observer error alone does not fail provider generation, `AgentTurnRunner.run()`, or `BoundedAgentLoop.run()`.

Observer return values have no execution or lifecycle authority.

No detached observer task, retry system, background job, observer-failure event, or raw observer-error persistence is introduced.

---

## 16. Canonical stream persistence remains fail-closed

Focused proof separately establishes:

```text
canonical session.emit("model.stream.*", ...) rejection
=> observer is not invoked
=> model turn fails closed
```

R4B does not suppress or conflate Kodac evidence persistence failure with caller observer failure.

---

## 17. Trusted beforeToolCall veto preserved

`beforeToolCall` remains a trusted host veto and is deliberately excluded from observer containment.

Focused proof establishes:

```text
beforeToolCall arbitrary throw
=> zero tool execution
=> failed turn terminal attempt
```

Existing R3B semantics remain:

- effective call is immutable;
- hook return value does not grant authority;
- hook throw can veto before execution;
- loop-owned `AgentLoopStop` drives bounded stopped control;
- K2 independently governs side effects.

---

## 18. Protected authority identities

The following non-R4B authority surfaces remain canonical and unchanged as required:

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

R4B does not alter approval, confinement, policy, gateway, orchestration, tool registry, Done Gate, dependency, workflow, or package publication authority.

---

## 19. K2 and Done Gate separation

The execution chain remains:

```text
R3B EFFECTIVE CALL
-> K2 / policy / approval / confinement / gateway
-> tool execution
```

R4B only classifies the surrounding turn lifecycle.

Required completion separation remains:

```text
agent.turn.completed != PROVEN_READY
```

Only Done Gate can establish current `PROVEN_READY` truth.

---

## 20. Fresh pre-ledger CI evidence

Exact accepted pre-ledger head:

```text
1ccc289347a86c3c492ecfa69e1dfed50d4dcdea
```

Governance workflow:

```text
run:
31893491429

provenance:
PASS

legacy-tests:
PASS
```

K2 runtime workflow:

```text
run:
31893491437

runtime-change-classifier:
PASS

Windows Typecheck:
PASS

Windows full Test:
PASS

macOS Typecheck:
PASS

macOS full Test:
PASS

Ubuntu Typecheck:
PASS

Ubuntu full Test:
PASS

k2-runtime-gate:
PASS
```

Ubuntu exact test summary:

```text
tests: 531
pass: 530
fail: 0
cancelled: 0
skipped: 1
todo: 0
```

The one skipped test is the pre-existing exact Linux ast-grep binary qualification fixture. No R4B, R4A reconciliation, R1B reconciliation, H2, R1/R2/R3, K2, approval, confinement, or Done Gate proof was skipped, deleted, marked todo, or bypassed.

CodeRabbit:

```text
SUCCESS
```

Unresolved inline review threads:

```text
0
```

---

## 21. K3 applicability

The exact six-path R4B changed set has empty intersection with canonical K3-R4 trigger paths.

Therefore:

```text
K3-R4:
NOT_APPLICABLE_PATH_FILTER_PROVEN
```

The exact six-path R4B changed set also has empty intersection with canonical K3-R5 trigger paths.

Therefore:

```text
K3-R5:
NOT_APPLICABLE_PATH_FILTER_PROVEN
```

No unrelated K3 trigger path was touched to force workflow scheduling.

The ledger path itself is not a K3-R4 or K3-R5 trigger path. Post-ledger applicability must still be recomputed against the exact ledger-bearing head.

---

## 22. Manual theorem review

Manual review on accepted pre-ledger head established:

```text
ONE TERMINAL APPEND ATTEMPT PER DURABLY STARTED TURN:
PASS

NO FALLBACK TERMINAL AFTER TERMINAL SINK REJECTION:
PASS

onStreamEvent CONTAINMENT ONLY AFTER CANONICAL STREAM EVIDENCE APPEND:
PASS

CANONICAL STREAM EVIDENCE FAILURE REMAINS FAIL-CLOSED:
PASS

beforeToolCall TRUSTED VETO REMAINS ACTIVE:
PASS

R4A PRODUCTION PRIMITIVE UNCHANGED:
PASS

R4A ACTIVE BRACKET RECONSTRUCTION:
PASS

K2 AUTHORITY UNCHANGED:
PASS

DONE GATE AUTHORITY UNCHANGED:
PASS
```

No generic hook waterfall, subagent runtime, background job system, worktree runtime, writable/persistent memory, LSP, PTY, dynamic workflow engine, H6, or H7 authority is introduced.

---

## 23. Accepted pre-ledger decision

```text
R4B PRE-LEDGER:
ACCEPTED

ACCEPTED HEAD:
1ccc289347a86c3c492ecfa69e1dfed50d4dcdea

ACCEPTED TREE:
7e8d4c332fe44ab352c7bf4a3ea79588cc6d79d5

LEDGER CREATION:
AUTHORIZED

READY FOR MERGE:
NO — POST-LEDGER CERTIFICATION REQUIRED
```

---

## 24. Required post-ledger certification

This ledger commit must be the only delta after the accepted pre-ledger head.

The ledger-bearing exact head must freshly prove:

```text
implementation/test blobs unchanged
governance/provenance/legacy PASS
runtime-change-classifier PASS
Windows/macOS/Ubuntu Typecheck + full Test PASS
k2-runtime-gate PASS
CodeRabbit SUCCESS
unresolved review threads = 0
K3 applicability recomputed
manual terminalization/observer/no-authority theorem review PASS
```

Until that fresh post-ledger gate passes, this document does not claim R4B completion.

---

## 25. Bounded claim after canonical merge only

Only after the ledger-bearing R4B head passes the fresh post-ledger gate, merges via expected exact head, and canonical merge identity/tree are verified may the bounded claim become available:

```text
KODAC_TOTAL_AGENT_STEP_TERMINALIZATION_AND_STREAM_OBSERVER_CONTAINMENT_PROVEN
```

R4B merge alone does not establish `H5 COMPLETE`.

A separate docs-only H5 closure review is required before H5 completion or any H6 sequencing clearance may be claimed.
