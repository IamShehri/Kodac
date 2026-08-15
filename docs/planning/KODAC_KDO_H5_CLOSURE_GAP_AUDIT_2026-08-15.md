# KDO-H5 Closure Gap Audit

Date: 2026-08-15
Status: AUDIT CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-CLOSURE-AUDIT

CANONICAL BASE:
5d12b1e4c9476e0bc9a555270ce23d5a08af9f44

CANONICAL BASE TREE:
eda4edaddac9b191d0570dc3f96fac379b931ada

H5 STATUS:
NOT CLOSED

NEXT RUNTIME SLICE:
R4 REQUIRED

RECOMMENDED DECOMPOSITION:
R4A — PURE STEP RECONSTRUCTION / IDENTITY CONTRACT
R4B — TOTAL STEP TERMINALIZATION + NON-AUTHORITATIVE OBSERVER CONTAINMENT

H6:
NOT AUTHORIZED / NOT READY BY THIS AUDIT

RUNTIME AUTHORITY:
NONE
```

The canonical H5 work through R1B, R2B, and R3B closes most of the H3 tool-pipeline hardening gaps, but it does **not** yet prove a total durable one-model-call-plus-tools step lifecycle.

The remaining gap is not a request for more generic hooks or a donor-shaped workflow engine. It is a correctness and evidence-lineage gap in the existing bounded loop.

H5 should therefore receive one final R4 family before any H5 closure claim is considered.

This audit authorizes no implementation.

---

## 2. Canonical state inspected

Repository:

```text
TheHalfMoon/Kodac
```

Exact canonical main:

```text
5d12b1e4c9476e0bc9a555270ce23d5a08af9f44
```

Exact canonical tree:

```text
eda4edaddac9b191d0570dc3f96fac379b931ada
```

Current relevant runtime blobs:

```text
packages/kodac-runtime/src/agent/loop.ts
7353ecb758326dace61e90d18590bb5e942a3414

packages/kodac-runtime/src/model/turn.ts
9ae1298b3a4f917417efbe2228e0708bc813147d

packages/kodac-runtime/src/protocol/event.ts
8d837edbbe4e6aceabab17bd9bdf114ab63ff699

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

packages/kodac-runtime/src/trust/policy.ts
b4134e430204123bebe053ffc9105f05fca611c9

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9
```

No roadmap, policy, K2, approval, confinement, Done Gate, plugin, subagent, background-job, or persistent-memory change is included in this audit.

---

## 3. Source-pinned H3 benchmark retained

Canonical H3 differential audit:

```text
docs/planning/KODAC_KDO_H3_DEEPSEEK_HARNESS_RUNTIME_DIFFERENTIAL_AUDIT_2026-08-14.md
```

Pinned donor:

```text
repository:
deepseek-ai/deepseek-harness

commit:
47f943859bef60e4160492346772ded9b24f765a

license:
MIT
```

Primary retained source anchors:

```text
docs/subsystems/session.md
blob aea9d00b38e384e7a973ce168c3a75a62e70a8bb

docs/tool-execution-pipeline.md
blob d04d2e4e5093fee92f8921f0eb0112c960a81bb8
```

The donor session model defines a step as one model call plus the tool executions it requested and gives it an explicit open/close lifecycle. The donor execution pipeline also separates pre-execution reduction, monotonic guards, around-dispatch concerns, tool execution, post handling, finalization, immutable result observation, and a single model-facing tool result.

Kodac does **not** need to copy those surfaces literally. H3 already rejected donor architecture that would remove Kodac's privileged core or replace K2 with generic hooks.

The relevant requirement is the evidence property, not API mimicry:

```text
one started model/tool step
=> one reconstructable terminal outcome
```

---

## 4. H3-to-current closure matrix

| H3 runtime seam | H3 state | Canonical state after R1B/R2B/R3B | Closure disposition |
|---|---|---|---|
| Exact model-visible session reconstructability | MISSING | H2 request snapshots + event-derived model-visible history are canonical | CLOSED outside H5 prerequisite |
| Exact model-facing tool result replay | PARTIAL | H2 history records exact model-facing tool messages; R1B preserves raw canonical history while deriving bounded provider-visible projections | CLOSED for model-visible replay |
| Deterministic tool-result pruning | absent from H3 baseline | R1A pure primitive + R1B durable evidence-preserving integration | CLOSED for authorized scope |
| Repeat-call signal/advisory | absent from H3 baseline | R2A deterministic primitive + R2B H2-bound advisory | CLOSED for authorized scope |
| Monotonic guard composition | PARTIAL | R3A immutable pure reducer + R3B active plan/call integration | CLOSED for authorized scope |
| Provider-visible tool narrowing | PARTIAL | R3B proves strict registry-derived subset exposure before H2/provider use | CLOSED for authorized scope |
| Rewrite-before-authority identity | PARTIAL | R3B proves effective input/call identity and K2 re-evaluation boundary | CLOSED for authorized scope |
| Whole-response guard preflight | MISSING | R3B preflights every provider tool call before any tool starts | CLOSED for authorized scope |
| K2 independence | KODAC_STRONGER | R3B remains upstream of unchanged K2/policy/gateway | PRESERVED |
| Turn/step lifecycle | PARTIAL | `agent.turn.started/completed/failed` exist, but started turns are not guaranteed one explicit terminal turn event | **OPEN — R4 REQUIRED** |
| Durable step identity / reconstruction | MISSING | No canonical step identity/projector binds one request, response, effective calls/results, and outcome | **OPEN — R4 REQUIRED** |
| Non-authoritative observer failure containment | desired H5 principle | `onStreamEvent` callback exceptions can still propagate into provider failure | **OPEN — R4 REQUIRED** |
| Generic around/post hook waterfalls | PARTIAL donor capability | Kodac already has bounded loop abort/time budgets and stronger K2 execution boundaries; generic rewriting waterfalls are unnecessary for H5 closure | REJECT / DEFER generic donor form |
| Normalized immutable model-facing result | desired H5 principle | Canonical H2 history is the authoritative model-facing result record; a second raw-output authority would duplicate truth | SATISFIED BY H2/R1B; R4 should reference, not duplicate |

The matrix establishes a narrow closure target rather than an invitation to expand H5 indefinitely.

---

## 5. Current loop bracket is not total

Canonical `BoundedAgentLoop.runExclusive()` emits:

```text
agent.turn.started
```

before the step's request/projection/execution work.

The normal successful path later emits:

```text
agent.turn.completed
```

The ordinary caught runtime-error path emits:

```text
agent.turn.failed
```

However, not every path after `agent.turn.started` reaches either terminal event.

### 5.1 Stop exceptions can leave an open turn

During `runner.run()`, the trusted loop `beforeToolCall` hook may throw `AgentLoopStop` for:

- `aborted`;
- `max_elapsed`;
- `max_tool_calls`;
- `duplicate_tool_call`.

The current catch handles `AgentLoopStop` by immediately returning `agent.loop.stopped` without first emitting a terminal event for the already-started turn.

Therefore:

```text
agent.turn.started
...
agent.loop.stopped
```

is currently a valid runtime trace with no explicit turn terminal record.

### 5.2 Abort/timeout can leave an open turn

If the composed turn signal aborts, the current catch returns the loop stop result directly:

```text
return stop(input.signal?.aborted ? "aborted" : "max_elapsed")
```

Again, the already-started turn receives no explicit terminal event.

### 5.3 Pre-provider projection/pruning failure can leave an open turn

After `agent.turn.started`, the loop calls:

```text
messagesForNextTurn()
```

outside the `runner.run()` catch.

R1B intentionally requires pruning transformation sink rejection to prevent the later provider request. That is correct fail-closed behavior, but today this rejection can escape after `agent.turn.started` without a terminal turn event.

The same class includes fail-closed projection/history validation errors at this boundary.

### 5.4 Post-run history persistence failure can leave an open turn

After a successful `runner.run()`, canonical assistant/tool-result history is appended before `agent.turn.completed`.

That ordering is correct because model-visible evidence must persist before claiming successful turn completion.

But if the history sink rejects, the current operation fails before `agent.turn.completed` and without an alternate explicit terminal turn record.

Thus evidence-critical failure is fail-closed but the lifecycle bracket is incomplete.

### 5.5 Result

Current canonical truth is therefore:

```text
STARTED TURN
!= GUARANTEED TERMINAL TURN RECORD
```

That is the remaining H5 correctness gap.

---

## 6. Why this matters before H6

H3 sequences H6 after H2/H4/H5 because subagents and background jobs require trustworthy:

- parent/child ownership;
- budget inheritance;
- cancellation lineage;
- execution lineage;
- session/event lineage.

A child runtime cannot safely bind itself to a parent step if the parent step may remain structurally open after a bounded stop or evidence failure.

Allowing H6 before closing this bracket would force H6 either to:

1. invent its own lifecycle authority; or
2. infer terminal parent state from absence and neighboring events.

Both are weaker than closing the existing H5 evidence model first.

Therefore this audit explicitly retains:

```text
H6 = BLOCKED BY H5 R4
```

This does not determine whether separate H4 closeout conditions also remain. H4 readiness must be evaluated independently before H6.

---

## 7. `agent.turn.*` already acts as the Kodac step seam

Kodac should not add a donor-shaped second lifecycle merely to match naming.

One iteration of `BoundedAgentLoop` already represents:

```text
one provider/model call
+
zero or more effective tool calls requested by that response
+
those tool executions/results
```

That is the semantic unit H3 called a step.

The outer `agent.loop.*` bracket already represents the larger bounded run.

Therefore R4 should preserve compatibility and define:

```text
KODAC STEP
= one canonical agent.turn.* lifecycle bracket
```

The missing work is identity, reconstruction, and total terminalization — not renaming events or introducing a parallel workflow engine.

---

## 8. R4A recommendation — pure step reconstruction / identity contract

R4A should be a pure, non-authoritative structural slice.

Recommended purpose:

```text
derive and validate one immutable Kodac step from canonical session events
```

Recommended properties:

1. one step starts at exactly one `agent.turn.started` event;
2. a completed canonical step has exactly one terminal event;
3. supported terminal classes are explicit and closed;
4. at most one H2 `model.request.snapshot` belongs to one step;
5. when a request snapshot exists, its `requestIdentity` is bound into the step identity;
6. assistant/tool-result history records in the bracket are referenced by their existing canonical record identities rather than copied as raw content;
7. R1B pruning records remain transformations of model-visible projection and do not become new raw-history authority;
8. R2B advisory records remain model-visible advisory evidence and can be structurally referenced when present;
9. R3B guard evidence can be bound through existing plan/pipeline/final-call identities without granting execution authority;
10. step identity is deterministic from structural evidence only;
11. unknown required lifecycle events fail closed;
12. malformed order, duplicate terminal records, multiple request snapshots, stale record references, noncontiguous session sequence, mixed session ids, and open steps fail closed;
13. the output is deeply immutable;
14. no filesystem/process/network/persistence/K2/approval/confinement/Done Gate authority is added.

Recommended implementation shape, subject to a separate authorization:

```text
packages/kodac-runtime/src/session/agent-step.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

An `src/index.ts` export should be added only if separately justified by the authorization; the pure contract does not need public export merely to exist internally.

R4A should not change the active loop.

---

## 9. R4B recommendation — total terminalization

After R4A is canonical, R4B should integrate the contract into the active loop and make the turn/step bracket total.

Required theorem:

```text
IF agent.turn.started IS DURABLY APPENDED
THEN BEFORE THAT LOOP RUN RETURNS OR THROWS,
EXACTLY ONE TERMINAL TURN EVENT MUST BE DURABLY ATTEMPTED
FOR THAT STARTED TURN.
```

The terminal vocabulary should distinguish normal completion, ordinary failure, and bounded/control stop without laundering one class into another.

A likely minimal event addition is:

```text
agent.turn.stopped
```

rather than misusing `agent.turn.failed` for abort/budget/cycle/duplicate-control outcomes.

R4B should prove terminalization for at least:

- successful stop response;
- successful tool-call response;
- provider failure;
- tool failure;
- guard block;
- unknown tool;
- trusted-host veto;
- duplicate-tool stop;
- cycle stop;
- max-tool-call stop;
- max-elapsed stop;
- external abort;
- R1B pruning-record persistence rejection;
- H2 assistant/tool-result history persistence rejection;
- R2B advisory persistence rejection;
- guard-evidence persistence rejection;
- other fail-closed pre-provider validation after the turn has started.

If the terminal-event sink itself rejects, Kodac must not fabricate a completed step. The operation should fail with the step remaining explicitly unproven rather than claiming a successful terminal record.

R4B must not catch evidence-critical persistence failures and convert them into success.

---

## 10. Non-authoritative stream observer gap

Canonical `AgentTurnHooks` currently exposes:

```text
onStreamEvent?(event: ModelProviderStreamEvent): Promise<void> | void
```

After Kodac durably emits its own canonical stream evidence, `turn.ts` awaits the caller hook directly.

A callback exception can therefore propagate through `provider.generate()` and cause the model turn to fail even though the callback is not K2, policy, approval, confinement, provider normalization, H2 reconstruction, or Done Gate authority.

That gives a nominal observer an implicit veto that H3 never authorized.

R4B should close this with an explicit rule:

```text
NON-AUTHORITATIVE OBSERVER FAILURE
MUST NOT REWRITE MODEL/TOOL EXECUTION TRUTH
```

Recommended semantics:

- canonical Kodac event persistence remains evidence-critical;
- `beforeToolCall` remains a separately proven trusted-host monotonic veto and is **not** converted into a passive observer;
- `onStreamEvent` is treated as observation only;
- its failure is contained after Kodac's own stream event append succeeds;
- if observer-failure evidence is added, it must be coarse, bounded, and non-secret;
- failure to persist any newly required evidence remains fail-closed;
- no callback return value gains authority.

This rule should not become a general plugin/hook framework.

---

## 11. Generic donor hook waterfalls are not a closure requirement

H3 recorded DeepSeek Harness's mature sequence as a useful benchmark:

```text
tool/call
-> pre
-> monotonic guards
-> approval
-> around execute
-> tool body
-> post
-> normalization
-> finalize
-> immutable result
-> tool/result
```

Kodac now has stronger or sufficient equivalents for the closure properties that matter:

- provider-visible narrowing and call rewriting before authority: R3A/R3B;
- one-shot approval: H4 proof chain, independently governed;
- side-effect execution and policy: K2;
- bounded elapsed/cancellation behavior: bounded loop and execution boundary;
- canonical model-facing result: H2 event-derived history;
- evidence-preserving bounded result projection: R1B;
- post-execution structural observation: R3B;
- completion truth: Done Gate.

H5 does **not** need a generic same-process `pre/around/post` plugin waterfall to close.

Adding one merely for parity would widen mutation/control seams and create a second policy surface around K2.

Disposition:

```text
GENERIC DONOR WATERFALL:
NOT REQUIRED FOR H5 CLOSURE

FUTURE SPECIALIZED AROUND CONCERNS:
SEPARATELY AUTHORIZED ONLY IF AN EVIDENCE-BACKED GAP EXISTS
```

---

## 12. Final-result authority must remain singular

R3B currently returns runtime `AgentToolResult` objects containing raw `output: unknown` to its caller, while H2 records the canonical model-facing tool message later in the loop.

R4 must not turn this into two competing authoritative result records.

Canonical truth should remain:

```text
RAW RUNTIME OUTPUT
-> existing bounded model-facing serialization
-> canonical H2 tool-result history record
```

R4 step evidence may bind the canonical H2 tool-result record identity and structural R3B effective-call identity.

It should not copy raw output into the step record and should not invent a second model-facing result serialization.

---

## 13. R4 proposed dependency graph

```text
H2 exact request/history evidence
        |
        +--> H5-R1B evidence-preserving projection
        |
        +--> H5-R2B repeat advisory
        |
        +--> H5-R3B effective guarded call evidence
                    |
                    v
            H5-R4A pure step reconstruction
                    |
                    v
            H5-R4B total active terminalization
                    |
                    v
             H5 closure review
```

H5 closure review must be separate from R4B implementation evidence.

---

## 14. R4A provisional proof requirements

A future R4A authorization should require proof for at least:

1. deterministic fixed identity vectors;
2. valid completed no-tool step;
3. valid completed multi-tool step;
4. valid failed step;
5. valid stopped step vocabulary as structurally defined for later integration;
6. H2 request identity binding;
7. ordered assistant/tool-result history identity binding;
8. R1B transformation coexistence without raw-history mutation;
9. R2B advisory coexistence;
10. R3B guard identity coexistence;
11. duplicate terminal rejection;
12. missing terminal rejection;
13. multiple request snapshot rejection;
14. event-order violation rejection;
15. noncontiguous sequence rejection;
16. mixed session rejection;
17. stale identity/reference rejection;
18. unknown required lifecycle event rejection;
19. explicit bounds at limit+1;
20. hostile structural input rejection without executing caller hooks;
21. deep immutability;
22. pure import surface;
23. no new dependency;
24. K2/policy/approval/confinement/Done Gate protected-blobs proof.

---

## 15. R4B provisional proof requirements

A future R4B authorization should require fresh active-runtime proof for at least:

1. every started real loop turn has exactly one accepted terminal turn event;
2. completed step projects under canonical R4A;
3. failed provider step projects under canonical R4A;
4. tool failure step projects under canonical R4A;
5. guard block gets an explicit terminal outcome;
6. unknown tool gets an explicit terminal outcome;
7. trusted-host veto gets an explicit terminal outcome;
8. duplicate-call stop gets an explicit terminal outcome;
9. max-tool-call stop gets an explicit terminal outcome;
10. max-elapsed stop gets an explicit terminal outcome;
11. external abort gets an explicit terminal outcome;
12. R1B pruning sink rejection does not leave an unclassified started turn when terminal persistence succeeds;
13. H2 history sink rejection does not leave an unclassified started turn when terminal persistence succeeds;
14. R2B advisory sink rejection does not leave an unclassified started turn when terminal persistence succeeds;
15. terminal sink rejection is fail-closed and never claimed as terminal success;
16. no provider request occurs when the pre-provider fail-closed condition forbids it;
17. `onStreamEvent` observer throw is contained and cannot rewrite provider/tool truth;
18. `beforeToolCall` trusted-host veto semantics remain intact;
19. R1A/R1B identity vectors and model-facing history semantics remain intact;
20. R2A/R2B repeat-call identity vectors remain intact;
21. R3A reducer remains byte-identical;
22. R3B effective-call/K2 re-evaluation semantics remain intact;
23. K2/policy/gateway remain the sole side-effect authority;
24. Done Gate remains the sole `PROVEN_READY` authority;
25. Windows/macOS/Ubuntu typecheck and full runtime tests pass on exact head;
26. governance/provenance/legacy gates pass;
27. applicable K3 workflow trigger rules are obeyed without artificial path touches;
28. no tests skipped/deleted/bypassed to obtain acceptance.

---

## 16. What is already closed and must not be rebuilt in R4

R4 must not reopen or fork:

- H2 request snapshot semantics;
- H2 event-derived history semantics;
- R1A pruning algorithm;
- R1B pruning policy/integration semantics;
- R2A repeat signal primitive;
- R2B advisory wording/policy/source binding;
- R3A guard pipeline reducer;
- R3B guard plan semantics;
- effective-call identity semantics;
- K2 policy or execution receipt semantics;
- one-shot approval semantics;
- confinement contracts/backends;
- Done Gate completion authority.

Historical regression assertions may be reconciled only if a future R4 authorization enumerates the exact file and the exact earlier property being superseded.

---

## 17. H5 closure conditions after R4B

H5 may be considered for a dedicated closure gate only after R4A and R4B are separately canonical and proven.

A future H5 closure review should then be able to establish all of the following:

```text
MODEL-VISIBLE HISTORY:
RECONSTRUCTABLE

TOOL-RESULT BOUNDING:
DETERMINISTIC + EVIDENCE-PRESERVING

REPEAT-CALL FEEDBACK:
DETERMINISTIC + H2-BOUND

GUARD PIPELINE:
MONOTONIC + ACTIVE + K2-INDEPENDENT

STEP LIFECYCLE:
TOTAL + RECONSTRUCTABLE + IDENTITY-BOUND

NON-AUTHORITATIVE OBSERVERS:
NO IMPLICIT EXECUTION VETO

K2:
SOLE SIDE-EFFECT AUTHORITY

DONE GATE:
SOLE PROVEN_READY AUTHORITY
```

Only then should an H5-complete claim be evaluated.

---

## 18. Explicit non-authorizations

This audit does not authorize:

- R4 implementation;
- source-code changes;
- `agent.turn.stopped` or any other event addition yet;
- new dependencies;
- donor code import;
- generic hook/plugin waterfalls;
- subagents;
- background jobs;
- delegation;
- worktrees;
- writable/persistent agent memory;
- persistent terminal/PTTY;
- LSP service;
- workflow engine;
- H6;
- H7;
- K2 changes;
- policy changes;
- approval changes;
- confinement changes;
- Done Gate changes;
- roadmap or milestone closure changes;
- public release or package publication.

---

## 19. Audit completion rule

This docs-only audit is ready for canonical review only if:

- this is the only changed repository path;
- branch base is exactly `5d12b1e4c9476e0bc9a555270ce23d5a08af9f44`;
- no runtime or workflow file changes;
- governance/provenance/legacy checks pass as applicable;
- reviewer findings are resolved or absent;
- expected-head merge is used;
- canonical post-merge identity is verified.

No H5 implementation authority follows by implication from merging this audit.

---

## 20. Final audit verdict

```text
H5 R1B:
CANONICAL / PROVEN FOR AUTHORIZED SCOPE

H5 R2B:
CANONICAL / PROVEN FOR AUTHORIZED SCOPE

H5 R3B:
CANONICAL / PROVEN FOR AUTHORIZED SCOPE

H5:
NOT CLOSED

MATERIAL REMAINING GAP:
TOTAL DURABLE STEP LIFECYCLE + STEP IDENTITY/RECONSTRUCTION

SECONDARY REMAINING GAP:
NON-AUTHORITATIVE STREAM OBSERVER FAILURE CONTAINMENT

RECOMMENDED NEXT:
R4A THEN R4B

H6:
DO NOT START
```

Candidate decision:

```text
KDO_H5_CLOSURE_GAP_AUDIT_READY_FOR_CANONICAL_REVIEW
```
