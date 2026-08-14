# KDO-H2-R2 Event-Derived Model History — Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE

## 1. Canonical identity

Repository: `TheHalfMoon/Kodac`

Authorized base / canonical main at branch creation:

`01daf34d36fc30b20b39293e0a3f1fc03cf32048`

That commit is the verified merge commit for PR #45, which canonically completed H2-R1 provider-boundary request reconstruction.

Canonical predecessor authorizations/evidence:

- `docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_RECONSTRUCTION_AUTHORIZATION_2026-08-14.md`
- `docs/planning/KODAC_KDO_H2_R1_LEGACY_TEST_RECONCILIATION_AUTHORIZATION_2026-08-14.md`
- `docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_EVIDENCE_2026-08-14.md`
- `docs/planning/KODAC_KDO_H3_DEEPSEEK_HARNESS_RUNTIME_DIFFERENTIAL_AUDIT_2026-08-14.md`

H2-R1 canonical completion claim:

`KODAC_PROVIDER_BOUNDARY_REQUEST_RECONSTRUCTABLE`

H2-R1 intentionally did not claim `FULL_SESSION_EVENT_SOURCED` and explicitly deferred deriving the agent loop's working model history from canonical session evidence to H2-R2.

## 2. Purpose

Authorize the second and final bounded H2 slice:

**H2-R2 — Event-Derived Model History**

H2-R1 established:

`logged canonical request snapshot == model/messages/tools passed to ModelProvider.generate()`

H2-R2 must establish the additional continuity invariant:

`next-turn model-visible messages == projection(canonical H2 session evidence)`

More precisely, after the first successfully appended H2-R1 `model.request.snapshot` anchor exists:

`next messages == project(latest validated request snapshot + subsequent required model-visible message append records)`

The private mutable `messages[]` accumulation in `BoundedAgentLoop` must therefore stop being the authority for later model turns. Successfully appended canonical events become the authority from which later model-visible message history is reconstructed.

This is model-visible session history reconstruction only. It is not provider network replay, tool side-effect replay, process-restart orchestration, or generic full-session event sourcing.

## 3. Donor provenance and admitted principle

Donor: `deepseek-ai/deepseek-harness`

Exact source commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license: MIT.

Primary admitted source:

- `docs/subsystems/session.md` — blob `aea9d00b38e384e7a973ce168c3a75a62e70a8bb`

H3 already admitted the donor principle that an append-only session record should be the source from which model-visible history is reconstructed while host-only/private state remains outside that model-visible surface.

H2-R2 ports only that principle into Kodac-native contracts. It does not import DeepSeek Harness runtime, Cordis, persistence backends, plugin execution, approval, sandbox, terminal, workflow, or tool-pipeline authority.

## 4. Current canonical gap

At the authorized base, the relevant canonical source identities are:

- `packages/kodac-runtime/src/agent/loop.ts` — blob `fe92ffdc9cc057d620a8f2de2296e14eec43a1e0`
- `packages/kodac-runtime/src/session/session.ts` — blob `02b40d96b888222ce60abe8ab3708b9a60b54677`
- `packages/kodac-runtime/src/model/turn.ts` — blob `401d796b929d350046128371fee4ba719d0d56c9`
- `packages/kodac-runtime/src/protocol/event.ts` — blob `19cd6083e3dce398bc7ca879cc64e50a265061d6`
- `packages/kodac-runtime/src/session/model-visible-request.ts` — blob `6ea13174f0d2cdcadd97b4c46d057ce6d27b6fc4`
- `packages/kodac-runtime/src/runtime/orchestrator.ts` — blob `b069da69909b282fdbdc2c62279e0297cbd430e9`
- `packages/kodac-runtime/src/model/provider.ts` — blob `a15f1d86ceab88ab6fa1be787719d222e354e0c4`

Current behavior:

1. `AgentTurnRunner` correctly appends an exact H2-R1 request snapshot before provider execution.
2. `BoundedAgentLoop` still clones caller messages into a loop-local mutable array.
3. After a successful turn, the loop mutates that array by appending an assistant message and model-facing tool-result messages.
4. After a failed anchored turn, the loop mutates that array by appending a synthetic recovery system message.
5. Exact assistant/tool-call content and exact model-facing tool-result messages are not currently represented as required append records from which the next request history is derived.

Therefore H2-R1 makes each dispatched request individually reconstructable, but the live loop still has a second model-history authority:

`loop-local messages[] != canonical session evidence authority`

H2-R2 closes that split authority.

## 5. Superseded PR #42

PR #42 (`docs(kdo): authorize H2 model-visible reconstructability core`) is not H2-R2 authority and MUST NOT be merged as the H2 continuation.

Its old design predates canonical H2-R1 and contains assumptions that now conflict with canonical truth, including prohibiting raw model-visible request persistence and prohibiting the `model/turn.ts` / `protocol/event.ts` integration that H2-R1 later explicitly authorized and merged.

H2-R2 is based only on canonical `main` at `01daf34d36fc30b20b39293e0a3f1fc03cf32048` and the merged H2-R1/H3 documents.

This authorization does not modify or close PR #42.

## 6. H2-R2 model-visible append record

H2-R2 may add exactly one required event type:

`model.history.message.appended`

Its payload must be a bounded, immutable, strictly validated record containing at least:

- a fixed H2-R2 record version;
- `afterRequestIdentity`: the lowercase SHA-256 identity of the H2-R1 request snapshot that anchors the append;
- `source`, limited to exact closed values for:
  - assistant response;
  - model-facing tool result;
  - recovery system message;
- one exact model-visible `ModelMessage` value;
- deterministic message/record identity;
- explicit canonical byte measurement sufficient for bounded validation.

The message contract must reuse the canonical H2-R1 model-visible message validation rules rather than creating a divergent permissive parser.

The event is required and non-ignorable for H2 model-history reconstruction. Existing `assistant.message`, `model.responded`, stream digest events, and tool lifecycle events remain coarse/log-only compatibility evidence and are not reconstruction authority.

## 7. Exact message semantics

### 7.1 Assistant response

After a successful `AgentTurnRunner.run()` returns, if the current behavior would add an assistant message to subsequent model history, H2-R2 must append the exact equivalent message through `model.history.message.appended` before later history is projected.

The record must contain:

- exact assistant content;
- exact ordered tool calls;
- exact tool-call ids, names, and JSON-compatible inputs.

The event must be appended even when the turn finishes with `stop` if an assistant message exists, so the canonical model-visible session history includes the final assistant output.

### 7.2 Tool result

For each successful tool result that current Kodac would feed to the next model request, H2-R2 must append the exact post-transformation `role="tool"` message.

H2-R2 records the exact content that will be model-visible after the existing bounded `toolMessageContent(...)` transformation. It does NOT authorize persisting the raw unbounded tool output merely for replay.

Tool-result ordering must remain exactly the existing execution/result ordering.

### 7.3 Recovery message

For a failed turn after a request anchor exists, the exact synthetic system recovery message that will become model-visible on the next attempt must be appended as an H2-R2 history record before it can affect a later provider request.

If no H2-R1 request snapshot has ever been appended because failure occurred before provider-boundary snapshot construction, caller messages remain bootstrap input and any retry recovery state may remain transient until a request is actually dispatched. H2-R2 MUST NOT persist an otherwise-undispatched private prompt merely to manufacture an event-sourcing anchor.

If a later request is dispatched, its H2-R1 request snapshot becomes the first durable anchor and captures the exact bootstrap history actually sent.

## 8. Projection contract

H2-R2 must provide a pure projection/validation function over supplied session events.

The projector must:

1. process events in strict session sequence order;
2. reject non-monotonic, duplicate, cross-session, or malformed required H2 records;
3. validate every admitted H2-R1 `model.request.snapshot` through the canonical H2-R1 validator;
4. treat the first valid request snapshot as the initial durable model-history anchor;
5. append only valid `model.history.message.appended` messages bound to the current `afterRequestIdentity`;
6. reject orphan history append records that precede any request anchor;
7. reject history append records bound to a stale or different request identity;
8. when a later request snapshot appears, require its ordered `messages` to equal the history projected from the prior anchor and append records exactly before accepting it as the new anchor;
9. ignore ordinary log-only event types for model-history projection;
10. fail closed on unknown required `model.history.*` event vocabulary rather than silently ignoring a record that could change model-visible history;
11. enforce explicit projection event/message/content bounds without truncation;
12. return an independently materialized `ModelMessage[]` suitable for the next provider-boundary request.

Mutation of returned projected messages must not mutate canonical event payloads or H2-R1 snapshots.

## 9. RuntimeSession journal boundary

`RuntimeSession` may gain one bounded read-only in-process event journal/snapshot surface solely so the live agent loop can project from events that were successfully appended to the configured `EventSink`.

The journal rule is strict:

`event is visible to H2-R2 projection only after EventSink.append(event) succeeds`

If sink append fails:

- the event must not enter the journal;
- sequence must not advance;
- no next provider request may use the unpersisted model-visible message.

The journal is not a new persistence backend and must not become an alternate success authority. It mirrors successfully appended canonical events for in-process projection.

H2-R2 does not authorize reading JSONL files, resuming an agent process from disk, databases, network persistence, encryption, retention, or storage permissions. Evidence-store hardening remains separately tracked by issue #47.

## 10. Agent-loop authority transition

Before the first valid request-snapshot anchor, caller-supplied messages are bootstrap input.

After an anchor exists:

- assistant/tool/recovery messages that affect future model-visible history must first be represented by successfully appended H2-R2 history events;
- the next turn's message array must be obtained from the H2-R2 projector;
- `BoundedAgentLoop` must not use direct `messages.push(...)` mutation as a parallel authority for anchored history;
- failure to append or project required model-visible history must fail closed before a later provider invocation.

A focused test must prove that the second and later requests observed by a fixture provider are exactly equal to both:

1. the H2-R2 projected history; and
2. the `messages` contained in the next H2-R1 `model.request.snapshot`.

This establishes continuity between R1 and R2 instead of two independent reconstruction systems.

## 11. Authorized implementation allowlist

H2-R2 implementation may modify exactly these nine paths:

1. `packages/kodac-runtime/src/session/model-visible-request.ts`
2. `packages/kodac-runtime/src/session/model-visible-history.ts`
3. `packages/kodac-runtime/src/session/session.ts`
4. `packages/kodac-runtime/src/protocol/event.ts`
5. `packages/kodac-runtime/src/agent/loop.ts`
6. `packages/kodac-runtime/src/index.ts`
7. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
8. `packages/kodac-runtime/test/agent-loop.test.ts`
9. `docs/planning/KODAC_KDO_H2_R2_EVENT_DERIVED_MODEL_HISTORY_EVIDENCE_2026-08-14.md`

The evidence ledger path is authorized but MUST remain absent until the pre-ledger implementation candidate is exact-head green and review-adjudicated.

No other path is authorized.

`packages/kodac-runtime/src/session/model-visible-request.ts` may change only to expose/refactor the existing strict H2-R1 message normalization/materialization primitives required by H2-R2. H2-R1 request identity, request snapshot structure, request bounds, request dispatch invariant, and existing focused tests must remain semantically unchanged.

## 12. Protected canonical surfaces

H2-R2 must keep these runtime authority surfaces byte-identical to canonical main unless a fresh authorization explicitly changes them:

- `packages/kodac-runtime/src/model/turn.ts` — `401d796b929d350046128371fee4ba719d0d56c9`
- `packages/kodac-runtime/src/model/provider.ts` — `a15f1d86ceab88ab6fa1be787719d222e354e0c4`
- `packages/kodac-runtime/src/model/openai.ts` — `564851b2dc8cd1aa610fbc7eaa4b5be5853f97f4`
- `packages/kodac-runtime/src/model/openai-compatible.ts` — `7ed56c7bac8e03d315b465e1f173ad934227051f`
- `packages/kodac-runtime/src/runtime/orchestrator.ts` — `b069da69909b282fdbdc2c62279e0297cbd430e9`
- `packages/kodac-runtime/src/tools/registry.ts` — `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `packages/kodac-runtime/src/execution/gateway.ts` — `be5926e9a8dc5c4c29d441dac11661d71e797015`
- `packages/kodac-runtime/src/verification/done-gate.ts` — `067e147569fa52cc2b04c5df26fbe20a01e958e9`

## 13. Explicit non-grants

H2-R2 does NOT authorize:

- provider transport changes;
- changes to `AgentTurnRunner` / `model/turn.ts`;
- raw HTTP or provider-wire reconstruction;
- replaying provider network calls;
- replaying tool side effects;
- raw unbounded tool-output persistence;
- stream-delta raw-content persistence as reconstruction authority;
- ToolRegistry or ProviderRegistry authority changes;
- RuntimeOrchestrator, K2, policy, ExecutionGateway, receipt, approval, or sandbox changes;
- Done Gate or verification changes;
- executable plugin loading;
- subagents or background jobs;
- LSP, terminal/PTTY, or workflow engines;
- JSONL/disk resume or process-restart orchestration;
- database/network persistence;
- encryption/key management;
- evidence-store retention/expiry/access-control work tracked in #47;
- weakening or redacting the canonical H2-R1 request snapshot;
- GitHub merge/approval authority for unrelated work.

## 14. Required focused proofs

The implementation must prove at minimum:

1. exact donor provenance and canonical H2-R1/H3 predecessor references;
2. deterministic H2-R2 message-record identity;
3. exact H2-R1 message validation is reused for history append records;
4. unknown fields, malformed JSON, accessors/hooks, cycles, sparse arrays, non-finite values, excessive depth, and bounds fail closed consistently with H2-R1;
5. arbitrary valid JSON member names including `__proto__` remain exact own data properties;
6. append records are deeply immutable;
7. materialized projected messages are deep mutable copies isolated from evidence;
8. source classification is closed and validated;
9. history records cannot exist before a request anchor;
10. `afterRequestIdentity` mismatch fails closed;
11. duplicate/non-monotonic/cross-session event sequence fails closed;
12. unknown required `model.history.*` event vocabulary fails closed;
13. a later request snapshot must equal the previously projected ordered message history exactly;
14. assistant text and ordered assistant tool calls are replayed losslessly into later history;
15. exact bounded post-transformation tool-result message content is replayed losslessly;
16. recovery message behavior is event-derived after an anchor exists;
17. provider-selection failure before the first request anchor still does not persist the undispatched private prompt;
18. sink failure while appending an H2-R2 message leaves the journal/sequence unchanged and prevents later provider invocation from using that message;
19. the second and later fixture-provider requests exactly equal the H2-R2 projection and their H2-R1 request snapshots;
20. loop budgets, duplicate-tool-call protection, cycle detection, abort propagation, tool ordering, and existing RuntimeOrchestrator behavior remain unchanged;
21. H2-R1 focused tests remain green without semantic weakening;
22. protected surfaces remain byte-identical;
23. no new filesystem/network/process/provider/K2 authority appears in the H2-R2 projection contract.

## 15. Bounds

H2-R2 must define conservative explicit bounds for model-visible projection, including at least:

- maximum admitted H2 model-history events per projection;
- maximum projected message count;
- maximum individual history-record bytes;
- maximum projected total message-content bytes;
- JSON nesting depth through the reused H2-R1 message contract.

No silent truncation is permitted by the H2-R2 evidence layer.

Existing `toolMessageContent(...)` bounded transformation remains the model-facing tool-result construction rule for this slice; H2-R2 records its exact result.

## 16. Pre-ledger certification gate

Before the H2-R2 evidence ledger may be created, one exact implementation head must prove:

- cumulative diff is exactly the first eight authorized implementation/test paths and the ledger is absent;
- TypeScript typecheck PASS;
- full runtime tests PASS;
- H2-R1 focused tests PASS;
- H2-R2 focused tests PASS;
- agent-loop regressions PASS;
- patch benchmark PASS where applicable;
- governance `provenance` PASS;
- governance `legacy-tests` PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- K2 runtime Ubuntu/macOS/Windows PASS;
- `k2-runtime-gate` PASS;
- protected blobs unchanged;
- exact-head reviewer findings adjudicated;
- unresolved review threads zero.

Only then may the ninth authorized path, the H2-R2 evidence ledger, be added.

Adding the ledger creates a new exact head and requires full recertification before Ready/merge.

## 17. Completion semantics

After a ledger-bearing exact head passes all gates, H2-R2 may claim:

`KODAC_MODEL_VISIBLE_SESSION_HISTORY_EVENT_DERIVED`

and the H2 program may claim:

`KDO_H2_MODEL_VISIBLE_SESSION_RECONSTRUCTABILITY_COMPLETE`

It MUST NOT claim:

- `FULL_SESSION_EVENT_SOURCED`;
- `PROCESS_RESTART_REPLAYABLE`;
- `RAW_PROVIDER_WIRE_RECONSTRUCTABLE`;
- `TOOL_SIDE_EFFECT_REPLAYABLE`;
- `PROVEN_READY` for unrelated work.

Issue #47 remains an independent security follow-up even after H2 completion.

After H2, the sequencing established by the canonical H3 audit proceeds to H4 approval + sandbox contract work before H5 guarded tool-pipeline hardening.

## 18. Authorization PR gate

This authorization PR must:

- be based exactly on canonical main `01daf34d36fc30b20b39293e0a3f1fc03cf32048`;
- contain exactly one changed documentation path:
  `docs/planning/KODAC_KDO_H2_R2_EVENT_DERIVED_MODEL_HISTORY_AUTHORIZATION_2026-08-14.md`;
- remain Draft for review;
- pass required governance checks;
- have zero unresolved review threads;
- never merge automatically;
- use expected-head merge only after the founder continuation decision.

## 19. Implementation PR gate

After this authorization becomes canonical, the H2-R2 implementation PR must:

- start from the exact post-authorization canonical main;
- remain Draft during implementation and correction;
- stay inside the exact nine-path allowlist;
- keep the evidence ledger absent until the pre-ledger gate passes;
- receive exact-head runtime/governance/K3/K2 certification;
- adjudicate all review findings with unresolved threads zero;
- recertify the ledger-bearing head;
- become Ready only after all gates pass;
- merge only with an exact expected-head guard and strict-main requirements satisfied;
- receive post-merge main/tree/parent/signature/governance/K2 verification.

## 20. Decision

`AUTHORIZED_SCOPE_CANDIDATE — KDO-H2-R2 EVENT-DERIVED MODEL HISTORY ONLY`
