# KDO-H5-R1B — Evidence-Preserving Tool-Result Pruning Integration Authorization

Date: 2026-08-15

Status: AUTHORIZED IMPLEMENTATION BOUNDARY — DOCS ONLY

## 1. Decision

Authorize one narrow H5 follow-up slice:

`KDO-H5-R1B — EVIDENCE-PRESERVING TOOL-RESULT PRUNING INTEGRATION`

This slice may integrate the already-proven H5-R1A pure pruning primitive into the active bounded agent loop **only** through a deterministic, replayable history transformation that remains attributable before the next H2 request snapshot.

This authorization does not complete H5 and does not authorize H6.

## 2. Canonical authorization base

Repository:

`TheHalfMoon/Kodac`

Canonical main:

`399eaf58880f56a843ce93f54868af9f85fd3387`

Canonical main tree:

`512f17e1765ea7e18e067e855bea240447df0e8b`

The immediately preceding canonical H5 claim is:

`KODAC_ACTIVE_MONOTONIC_GUARDED_TOOL_PIPELINE_PROVEN`

The required R1A predecessor claim is:

`KODAC_MODEL_FREE_TOOL_RESULT_PRUNING_PRIMITIVE_PROVEN`

## 3. Why R1B is the next H5 slice

Canonical H5-R1A deliberately proved only a pure model-free pruning primitive and explicitly prohibited runtime-loop, session-history, protocol-event, and request-path integration.

Its future-integration rule requires the later slice to resolve this exact ordering:

`canonical full history -> explicit deterministic transformation evidence -> bounded working-context projection -> model.request.snapshot`

H5-R2B subsequently integrated repeat-call advisory history. H5-R3B subsequently integrated the monotonic guarded-tool pipeline while still explicitly preserving the H5-R1 non-integration boundary.

Therefore the next unresolved H5 integration gap is R1B. No canonical R4 authorization exists and no H6 work is authorized by this decision.

## 4. Predecessor identities

Canonical H5-R1A authorization:

- path: `docs/planning/KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_AUTHORIZATION_2026-08-15.md`
- current canonical document blob must be attested before implementation

Canonical H5-R1A evidence:

- path: `docs/planning/KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_EVIDENCE_2026-08-15.md`
- current canonical document blob must be attested before implementation

Canonical R1A implementation primitive:

- path: `packages/kodac-runtime/src/agent/tool-result-pruning.ts`
- canonical merged blob: `66cfee69032c4c24331e8cb9098a86a1d7b9135e`

The R1A primitive must remain byte-identical throughout R1B. R1B is an integration slice, not a pruning-algorithm rewrite.

Current active integration surfaces:

- `packages/kodac-runtime/src/agent/loop.ts` — `34caf203007b1eba6be83759a3b4e4c9886323b5`
- `packages/kodac-runtime/src/session/model-visible-history.ts` — `06909401c6ddf2880154eb3d5fb1fe646d12d7fb`
- `packages/kodac-runtime/src/protocol/event.ts` — `d3446f6bc582b507170aec13de8fef5eb6587445`
- `packages/kodac-runtime/src/model/turn.ts` — `9ae1298b3a4f917417efbe2228e0708bc813147d`

`turn.ts` is protected in R1B and must not change.

## 5. Integration theorem

R1B must preserve this theorem:

```text
RAW CANONICAL HISTORY EVENTS
        |
        v
projectModelVisibleHistory replay
        |
        v
canonical R1A deterministic prune(messages, policy)
        |
        v
DURABLE STRUCTURAL PRUNING-TRANSFORMATION EVENT
        |
        v
projectModelVisibleHistory replay including transformation
        |
        v
BOUNDED WORKING MODEL-VISIBLE MESSAGES
        |
        v
UNCHANGED H2 createModelVisibleRequestSnapshot
```

The transformation event is evidence of a model-visible projection change. It is not authority, permission, a replacement for canonical history, or a destructive rewrite of prior history events.

## 6. Canonical history must remain recoverable

R1B must never mutate, delete, replace, or rewrite an already committed:

- `model.request.snapshot` event;
- `model.history.message.appended` event;
- `model.history.repeat_call_advisory.appended` event;
- tool execution receipt;
- tool output evidence outside the model-visible projection path.

The source history event stream remains the canonical evidence source.

Pruning affects only the **derived working model-visible projection** used for a subsequent request.

A reviewer must be able to replay the original event stream, identify every full canonical history record that existed before the transformation, replay the R1A transformation, and reproduce the exact next H2 snapshot messages.

## 7. Explicit trigger policy only

R1B must not invent adaptive, model-based, heuristic, token-estimated, hidden-default, or pressure-triggered pruning.

Pruning is active only when the caller supplies an explicit valid R1A pruning policy for the loop invocation.

No policy supplied:

`NO PRUNING TRANSFORMATION`

Policy supplied but R1A reports zero changes:

`NO PRUNING TRANSFORMATION EVENT`

Policy supplied and R1A reports one or more deterministic changes:

`DURABLE TRANSFORMATION EVENT REQUIRED BEFORE NEXT H2 REQUEST SNAPSHOT`

This explicit-only rule preserves backward compatibility and prevents a hidden change to model-visible context semantics.

## 8. Proposed loop input boundary

R1B may add exactly one optional pruning configuration field to the bounded-loop input surface. Its concrete TypeScript shape may be either:

- a validated R1A `ToolResultPruningPolicy`; or
- a primitive serialized/number configuration that is immediately converted through the canonical R1A policy constructor/validator.

Whichever shape is chosen, the implementation must reject Proxy/accessor/cyclic/unknown-field/invalid-bound configurations before producing a pruning transformation event or later provider request.

R1B must not introduce executable callbacks, model calls, filesystem lookup, environment lookup, plugin lookup, or dynamic module discovery as pruning policy inputs.

## 9. Required pruning transformation record

R1B must add one versioned structural history record and one required event type, with names equivalent to:

- record version: `kodac-tool-result-pruning-history-v1`
- event: `model.history.tool_result_pruning.applied`

The exact naming may vary only if tests pin one deterministic canonical spelling before implementation acceptance.

The durable record must bind enough structural evidence to recompute and verify the transformation without storing duplicate raw tool-result bodies. It must include, directly or through a validated nested R1A result structure, at minimum:

- version;
- `afterRequestIdentity` / current H2 anchor;
- R1A policy identity and policy parameters required for replay;
- R1A input history identity;
- R1A output history identity;
- R1A result identity;
- ordered R1A change identities;
- structural per-change evidence sufficient to bind message index, original/result byte sizes, removed byte count, original/result content hashes, and policy identity;
- record preimage byte count;
- deterministic record identity.

The record must contain no raw original tool-result content and no duplicated raw pruned content beyond what remains in the derived projection.

## 10. Projector semantics

`projectModelVisibleHistory(...)` may learn exactly one new required `model.history.*` event type for R1B.

On that event it must:

1. require an existing H2 request snapshot anchor;
2. validate the R1B record strictly;
3. require the record to bind to the current anchor request identity;
4. run the unchanged R1A primitive against the current projected messages and the record-bound policy;
5. compare all required derived identities/change evidence with the durable record;
6. fail closed on any mismatch, stale anchor, unsupported version, reordered/omitted change, malformed field, or hostile object shape;
7. replace only the in-memory **working projection** with the recomputed R1A output messages;
8. preserve the underlying event stream unchanged;
9. require the next `model.request.snapshot` messages to equal that transformed projection under the existing H2 equality rule.

A transformation event must be replay-deterministic.

## 11. Loop ordering

For each next model turn, when explicit pruning is configured and changes are needed, ordering must be:

1. project the current canonical event-derived model-visible history;
2. derive R1A pruning result from that projection;
3. build and validate the R1B structural transformation record;
4. durably append `model.history.tool_result_pruning.applied`;
5. reproject from session events including that record;
6. pass only the reprojected bounded messages to `AgentTurnRunner`;
7. let unchanged R3B/H2 turn logic create the next request snapshot;
8. H2 snapshot equality must prove the snapshot used exactly the transformed messages.

If the pruning transformation event cannot be durably appended, the later provider request must not occur.

No pruning may occur after the H2 snapshot for the request it is supposed to affect.

## 12. Interaction with R2B repeat-call advisory

R1B must preserve R2B semantics.

The canonical repeat-call advisory record remains an independent durable history event.

Pruning may transform oversized **tool-role message content** only, as defined by R1A. It must not alter:

- assistant tool-call names;
- assistant tool-call inputs;
- tool-call ids;
- tool names;
- repeat-call signal JSON;
- repeat-call policy identity;
- repeat-call advisory system message;
- source-record identities already committed in R2B evidence.

R2B repeat detection continues to derive from the effective executed call as proven by R3B, not from pruned tool-result text.

## 13. Interaction with R3B guarded tool pipeline

R1B must not modify the R3A reducer, R3B plan companion, `AgentTurnRunner`, tool registry, orchestrator, or guard events.

R3B remains earlier in the execution path. R1B operates only after tool execution/history append and before a later model request.

Pruning must not:

- change tool name or capability;
- rewrite tool-call input;
- change guard plan/result identities;
- create permission vocabulary;
- bypass a guard block;
- change trusted-host veto semantics;
- change hard duplicate/repeat detection semantics.

## 14. Interaction with legacy `maxToolResultChars`

R1B must not silently reinterpret or remove the existing `AgentLoopLimits.maxToolResultChars` behavior in this slice.

That legacy limit remains a distinct pre-history serialization bound unless a later separately authorized compatibility slice replaces it.

R1B proves **evidence-preserving model-visible pruning integration over the canonical bounded history that already exists**, not preservation of arbitrary unbounded raw tool output.

The evidence ledger must state this limitation explicitly.

## 15. Failure semantics

R1B must fail closed before a later provider request for:

- invalid pruning policy;
- hostile policy input;
- stale transformation anchor;
- malformed transformation record;
- transformation identity mismatch;
- R1A replay mismatch;
- event sink append failure;
- projected-message or content bound violation;
- next-snapshot mismatch.

A failed transformation must never be treated as a no-op success.

## 16. Evidence durability

R1B transformation evidence is required history evidence, not an optional telemetry event.

If its sink append fails:

- it must not appear in `RuntimeSession.eventsSnapshot()`;
- the event sequence must remain contiguous as already guaranteed by `RuntimeSession`;
- no provider request using the unproven transformed projection may occur.

## 17. Hostile-input handling

R1B production code must not execute caller-controlled structural hooks while validating policy/record/event payloads.

Focused tests must cover as applicable:

- Proxy;
- accessor property;
- cyclic object;
- sparse array;
- symbol field;
- non-enumerable field;
- unknown field;
- unsupported version;
- invalid SHA-256 identity;
- stale anchor;
- tampered change identity;
- tampered result identity;
- reordered/omitted change evidence.

The existing R1A hostile-input guarantees remain mandatory and must not be weakened.

## 18. Determinism and bounds

The record must have deterministic canonical identities independent of timestamps, event ids, process ids, memory addresses, paths, or machine-specific state.

R1B must define a hard maximum canonical record size.

The bound must be sufficient for the maximum R1A change count but must remain finite and tested at limit / limit+1 where practical.

No transformation path may allocate based on an unbounded caller-declared size before validating that size.

## 19. Explicit implementation allowlist

Before the evidence ledger exists, implementation may modify only these paths:

1. `packages/kodac-runtime/src/agent/loop.ts`
2. `packages/kodac-runtime/src/session/model-visible-history.ts`
3. `packages/kodac-runtime/src/protocol/event.ts`
4. `packages/kodac-runtime/test/kdo-h5-r1b-evidence-preserving-tool-result-pruning.test.ts`
5. `packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts`
6. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
7. `packages/kodac-runtime/test/kdo-h5-r2b-repeat-call-advisory-history.test.ts`
8. `packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts`
9. `packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts`
10. `packages/kodac-runtime/test/agent-loop.test.ts`

After a fresh exact-head pre-ledger PASS, exactly one additional path may be added:

11. `docs/planning/KODAC_KDO_H5_R1B_EVIDENCE_PRESERVING_TOOL_RESULT_PRUNING_INTEGRATION_EVIDENCE_2026-08-15.md`

No other path is authorized without a new canonical correction.

## 20. Historical regression reconciliation authorization

R1B necessarily supersedes several earlier **non-integration/blob-pin assertions**, but does not supersede their security properties.

The implementation is authorized to reconcile only the following obsolete assertions inside the allowlisted tests:

### H5-R1A test

Current negative-coupling assertions that `loop.ts` and `model-visible-history.ts` do not reference the pruning primitive may be replaced with stronger R1B assertions proving:

- the R1A primitive remains byte-identical and pure;
- only the authorized loop/history integration surfaces call it;
- `turn.ts` remains non-integrated with pruning;
- no K2/policy/gateway/Done Gate authority is introduced.

### H2-R2 test

The projector import-surface assertion may add the pure R1A pruning module import while preserving the no-fs/no-process/no-network/no-execution-authority property.

### R3A test

The obsolete `model-visible-history.ts` blob pin may be replaced with a semantic assertion proving the new pruning transformation does not change R3A/R3B guard authority and that the R3A reducer/plan companion remain unchanged.

### R3B test

The obsolete `model-visible-history.ts` blob pin may be replaced with a semantic assertion proving pruning operates only between durable history replay and the later H2 snapshot and cannot rewrite effective call identity, guard evidence, K2 policy, or tool execution.

### R2B test

Only assertions that necessarily assume the old projector/event vocabulary may be updated. Repeat-call signal identity, advisory message, source binding, threshold semantics, and effective-call dependence remain protected.

No historical test may be deleted, skipped, bypassed, or reduced to an unconditional new blob pin in place of its original security property.

## 21. Protected paths

R1B must not modify:

- `packages/kodac-runtime/src/agent/tool-result-pruning.ts`
- `packages/kodac-runtime/src/model/turn.ts`
- `packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts`
- `packages/kodac-runtime/src/agent/guarded-tool-plan.ts`
- `packages/kodac-runtime/src/agent/repeat-call-signal.ts`
- `packages/kodac-runtime/src/session/model-visible-request.ts`
- `packages/kodac-runtime/src/session/session.ts`
- `packages/kodac-runtime/src/model/provider.ts`
- `packages/kodac-runtime/src/tools/registry.ts`
- `packages/kodac-runtime/src/runtime/orchestrator.ts`
- `packages/kodac-runtime/src/trust/policy.ts`
- `packages/kodac-runtime/src/trust/approval.ts`
- `packages/kodac-runtime/src/execution/gateway.ts`
- `packages/kodac-runtime/src/verification/done-gate.ts`
- `packages/kodac-runtime/src/index.ts`
- `packages/kodac-runtime/package.json`
- `packages/kodac-runtime/scripts/run-tests.mjs`
- `packages/kodac-runtime/THIRD_PARTY_NOTICES.md`

Current protected identities must be attested at implementation preflight and again at pre-ledger acceptance.

## 22. Required focused proof matrix

The R1B focused test must prove at least:

1. predecessor R1A authorization/evidence/claim identities;
2. R1A primitive current canonical blob and fixed vectors remain unchanged;
3. no policy -> no transformation event and no model-visible change;
4. valid policy + no R1A changes -> no transformation event;
5. valid policy + oversized tool result -> exactly one required transformation event before next request snapshot;
6. original canonical history message event remains unchanged and recoverable;
7. transformation record contains structural hashes/byte counts/identities but no raw original/pruned body copy;
8. projector replay reproduces exact R1A output identity and messages;
9. next H2 snapshot messages equal transformed projector output exactly;
10. tampered transformation record fails closed;
11. stale anchor fails closed;
12. missing/reordered/tampered change evidence fails closed;
13. transformation event sink failure prevents later provider invocation;
14. transformation event is not journaled when sink append fails;
15. UTF-8 byte semantics remain correct across multibyte input;
16. multiple oversized tool results produce deterministic ordered changes;
17. only tool-role content is transformed;
18. assistant/system/user messages remain byte-identical;
19. tool-call ids and tool names remain unchanged;
20. R2B advisory message/identity/source binding remains unchanged;
21. R3B effective executed call and guard identities remain unchanged;
22. hard duplicate/repeat detection still uses effective call input, not pruned result text;
23. legacy `maxToolResultChars` semantics remain distinct and unchanged;
24. policy Proxy/accessor/cycle/unknown field rejects before transformation/provider;
25. record Proxy/accessor/cycle/sparse/symbol/non-enumerable/unknown field rejects;
26. unsupported transformation version rejects;
27. record size and projection bounds fail closed;
28. projector rejects unsupported future required `model.history.*` events as before;
29. no new fs/network/subprocess/model-call/plugin/K2/approval/confinement/Done Gate authority in history integration;
30. `turn.ts` stays byte-identical;
31. protected paths stay byte-identical;
32. no skipped/deleted historical tests.

## 23. CI / review gate

Before pre-ledger PASS, the exact candidate head must have:

- changed paths contained entirely in the pre-ledger allowlist;
- evidence ledger absent;
- governance/provenance PASS;
- legacy regression boundary PASS;
- runtime-change-classifier PASS;
- Windows Typecheck + full tests PASS;
- macOS Typecheck + full tests PASS;
- Ubuntu Typecheck + full tests PASS;
- aggregate K2 runtime gate PASS;
- K3-R4/K3-R5 either PASS when triggered or exact-head `NOT_APPLICABLE_PATH_FILTER_PROVEN` when no trigger path changed;
- CodeRabbit SUCCESS;
- all other installed code-review findings adjudicated;
- zero unresolved review threads;
- manual exact-head review of all 32 focused proof requirements;
- protected blob attestation.

## 24. Evidence ledger rule

The R1B evidence ledger is forbidden until the exact implementation/test head satisfies the full pre-ledger gate.

Once the ledger is added:

- it must be a ledger-only commit;
- all pre-ledger CI/review evidence becomes historical;
- a full fresh post-ledger certification is required;
- code/test blobs must remain identical to the accepted pre-ledger candidate;
- merge must use exact expected head.

## 25. Allowed completion claim

Only after fresh post-ledger certification and canonical merge may this limited claim be made:

`KODAC_EVIDENCE_PRESERVING_TOOL_RESULT_PRUNING_INTEGRATION_PROVEN`

This claim means only that an explicit R1A policy can deterministically transform the event-derived working model-visible history with durable replay-verifiable evidence before a later unchanged H2 request snapshot.

## 26. Explicit non-claims

R1B must not be interpreted as proving or authorizing:

- H5 complete;
- H6 ready or authorized;
- adaptive context pressure management;
- model-based summarization;
- semantic summarization;
- token-budget estimation;
- deletion or mutation of canonical history evidence;
- arbitrary raw unbounded tool-output preservation;
- replacement/removal of legacy `maxToolResultChars`;
- dynamic/workspace hooks;
- executable plugin hooks;
- subagents;
- delegation;
- worktrees;
- background jobs;
- writable agent memory;
- new K2 authority;
- approval override;
- confinement override;
- policy override;
- receipt mutation;
- Done Gate override;
- R3B guard override;
- provider-specific context management.

## 27. Final authorization verdict

If this document becomes canonical, the next permitted action is:

1. create a fresh implementation branch from that canonical authorization merge;
2. implement only the allowlisted R1B integration;
3. keep the R1A primitive and all protected authority surfaces byte-identical;
4. reconcile only the explicitly authorized historical assertions;
5. do not create the evidence ledger until a fresh exact-head pre-ledger PASS;
6. do not start any H6 work.

Verdict:

`KDO_H5_R1B_IMPLEMENTATION_AUTHORIZED_AFTER_CANONICAL_AUTHORIZATION_MERGE`
