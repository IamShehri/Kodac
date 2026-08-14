# KDO-H2-R2 Event-Derived Model History — Evidence

Date: 2026-08-14
Status: EVIDENCE LEDGER — REQUIRES EXTERNAL EXACT-HEAD CERTIFICATION

## 1. Canonical identity

Repository: `TheHalfMoon/Kodac`

H2-R2 authorization merge:

`cc2044d15b03f0ca772afe228851bb887e66559f`

H2-R2 supplemental legacy-test authorization merge:

`03bd32116350cbe0d10a3c3791fb1232dd5be710`

Implementation PR:

`#49`

Certified pre-ledger candidate:

`0a494d6daaf36090c1360eeb7679f5880335cd57`

This ledger records evidence for the pre-ledger candidate only. The commit that adds this file is a new repository head and must be certified externally by exact-head CI and review state. This file does not self-certify its containing commit.

## 2. Completion invariant

H2-R1 established:

`logged canonical request snapshot == model/messages/tools passed to ModelProvider.generate()`

H2-R2 establishes the continuity invariant:

`next-turn model-visible messages == projection(canonical H2 session evidence)`

After the first valid H2-R1 request anchor, the agent loop no longer treats a private mutable `messages[]` accumulator as model-history authority. Model-visible assistant, tool-result, and anchored recovery messages are represented by required session events and later provider messages are derived from validated projection.

## 3. Authorized changed paths before this ledger

The certified pre-ledger candidate changed exactly ten non-ledger paths authorized by the canonical H2-R2 authorization plus the supplemental legacy-test authorization:

1. `packages/kodac-runtime/src/session/model-visible-request.ts`
2. `packages/kodac-runtime/src/session/model-visible-history.ts`
3. `packages/kodac-runtime/src/session/session.ts`
4. `packages/kodac-runtime/src/protocol/event.ts`
5. `packages/kodac-runtime/src/agent/loop.ts`
6. `packages/kodac-runtime/src/index.ts`
7. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
8. `packages/kodac-runtime/test/agent-loop.test.ts`
9. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
10. `packages/kodac-runtime/test/openai-compatible-provider.test.ts`

This evidence file is the final authorized H2-R2 ledger path.

No provider transport, `model/turn.ts`, RuntimeOrchestrator, ToolRegistry, K2/ExecutionGateway, Done Gate, approval/sandbox, plugin, terminal/LSP/workflow, JSONL restart/resume, or issue #47 storage-policy path is authorized or changed by H2-R2.

## 4. Implemented model-history record

H2-R2 adds exactly one required event vocabulary:

`model.history.message.appended`

Each required history record is strictly validated and contains:

- a fixed H2-R2 version;
- the H2-R1 `afterRequestIdentity` anchor;
- a closed `source` enum;
- one exact H2-R1-valid model-visible message;
- deterministic message identity;
- deterministic record identity;
- canonical byte measurements and explicit bounds.

Source/message semantics are closed:

- `assistant_response` requires an assistant message;
- `tool_result` requires a bound tool message with tool name and tool-call id;
- `recovery_system` requires the canonical system recovery message.

H2-R2 reuses the canonical H2-R1 message validator/materializer/canonicalizer rather than introducing a permissive parallel model-message parser.

## 5. Projection behavior proven

`projectModelVisibleHistory(...)` is a pure projection over supplied session events. The implementation fails closed on:

- malformed event envelopes;
- mixed session ids;
- duplicate, non-monotonic, or non-contiguous sequence;
- orphan H2-R2 history events before a request anchor;
- stale `afterRequestIdentity` bindings;
- malformed/tampered history records;
- mismatched later H2-R1 request snapshots;
- unknown required `model.history.*` vocabulary;
- projection event/message/content bounds.

Ordinary log-only event types do not become model-history authority.

Projected messages are independently materialized mutable copies. Mutating a projected provider message does not mutate canonical H2-R1 snapshots or H2-R2 history records.

## 6. RuntimeSession journal behavior proven

`RuntimeSession` now serializes event emission and journals only successfully appended events.

The journal rule is:

`event visible to H2-R2 projection only after EventSink.append(event) succeeds`

If sink append rejects:

- the rejected event is absent from the journal;
- committed sequence does not advance;
- a later provider request cannot use the unpersisted model-visible history message.

The in-process journal is bounded and read-only from the caller surface. It is not a persistence backend and does not authorize JSONL restart/resume.

## 7. Agent-loop authority transition proven

Before the first request anchor, caller messages remain bootstrap input.

After an H2-R1 request snapshot anchor exists:

- assistant responses affecting later requests are appended as H2-R2 history records;
- bounded model-facing tool-result messages are appended as H2-R2 history records;
- anchored recovery messages are appended as H2-R2 history records;
- later provider requests receive messages from H2-R2 projection;
- direct anchored `messages.push(...)` history accumulation is not retained as a parallel authority.

The loop serializes concurrent `run(...)` operations sharing one `RuntimeSession`, preventing projection windows from interleaving.

Complete turn batches are aggregate-bound checked before the first history record from that batch is persisted, preventing a partial model-history batch from becoming canonical when the complete batch would exceed H2-R2 bounds.

## 8. Manual exact-head review correction

Manual exact-head review of pre-ledger candidate `a171730fc38ce82d585827df0f526e72e0280c85` found one additional continuity defect in the bounded journal integration.

The loop originally captured the run boundary as:

`runJournalOffset = session.eventsSnapshot().length`

and later derived run events through array slicing.

That is not stable when the 4096-event journal evicts old entries: after rollover, the array length is not a durable cursor and the stored offset can point at the wrong retained events or hide current-run events from projection.

The correction at pre-ledger head `0a494d6daaf36090c1360eeb7679f5880335cd57` changed the run boundary to the last committed event sequence and uses:

`eventsSnapshot(runStartSequence)`

This aligns the agent loop with the existing `RuntimeSession` sequence-cursor contract. Journal rollover therefore cannot silently reinterpret an array-position offset. If the required cursor itself falls outside retained history, the session cursor contract fails closed rather than projecting an incorrect window.

No new authority surface was added by this correction.

## 9. Historical review reconciliation

An earlier exact-head review on `36adb9d7f2aa8d36037c930bc9b16ec3774aebef` identified that H2-R2 `source` values were not yet bound to exact message-role semantics.

That finding was corrected before the certified pre-ledger candidate. Current code validates the closed assistant/tool/recovery source semantics described above.

The supplemental legacy-test authorization also reconciled exactly two stale tests:

- the obsolete H2-R1 byte pin on `agent/loop.ts`;
- an OpenAI-compatible provider test fixture that bypassed the canonical H2 event spine.

No production authority was added by that supplemental authorization.

## 10. Exact-head pre-ledger certification

Certified pre-ledger head:

`0a494d6daaf36090c1360eeb7679f5880335cd57`

GitHub Actions results on that exact head:

- governance run `31802443625`: SUCCESS;
- K3-R4 run `31802443619`: SUCCESS;
- K3-R5 run `31802443635`: SUCCESS;
- K2 runtime run `31802443747`: SUCCESS;
  - runtime classifier job `94773351317`: PASS;
  - macOS runtime job `94773385275`: typecheck, full tests, patch benchmark PASS;
  - Ubuntu runtime job `94773385346`: typecheck, full tests, patch benchmark PASS;
  - Windows runtime job `94773385501`: typecheck, full tests, patch benchmark PASS;
  - K2 runtime gate job `94773697876`: PASS.

The candidate remained Draft and mergeable, changed paths remained within the combined authorization, and unresolved inline review thread count was zero after manual exact-head review/adjudication.

A CodeRabbit exact-head review was requested for `0a494d6daaf36090c1360eeb7679f5880335cd57`; no automated exact-head finding is claimed in this ledger unless such a review is separately recorded by GitHub. The pre-ledger review claim here is the manual exact-head review described above.

## 11. Protected authority surfaces

H2-R2 does not authorize changes to:

- `packages/kodac-runtime/src/model/turn.ts`;
- `packages/kodac-runtime/src/model/provider.ts`;
- `packages/kodac-runtime/src/model/openai.ts`;
- `packages/kodac-runtime/src/model/openai-compatible.ts`;
- `packages/kodac-runtime/src/runtime/orchestrator.ts`;
- `packages/kodac-runtime/src/tools/registry.ts`;
- `packages/kodac-runtime/src/execution/gateway.ts`;
- `packages/kodac-runtime/src/verification/done-gate.ts`.

The pre-ledger diff does not include those protected paths.

## 12. Explicit non-claims

This ledger does not claim:

- raw provider-wire reconstruction;
- provider network replay;
- tool side-effect replay;
- JSONL/disk restart or resume;
- generic full-process event sourcing;
- approval or sandbox readiness;
- guarded tool-pipeline readiness;
- plugin/subagent/job/terminal/LSP/workflow readiness;
- issue #47 evidence-store permissions/retention/expiry completion;
- unrelated `PROVEN_READY` authority.

## 13. H2 completion claim

Subject to exact-head certification of the commit containing this ledger, the bounded H2 completion claim is:

`KODAC_MODEL_VISIBLE_SESSION_HISTORY_EVENT_DERIVED`

Together with the canonical H2-R1 claim:

`KODAC_PROVIDER_BOUNDARY_REQUEST_RECONSTRUCTABLE`

this closes the authorized H2 model-visible reconstructability program boundary.

It does not convert H2 into raw provider replay or generic full-session/process event sourcing.

## 14. Post-ledger gate

The new ledger-bearing exact head must independently satisfy:

1. combined changed-path allowlist exactly;
2. typecheck PASS;
3. full runtime suite PASS;
4. Ubuntu/macOS/Windows runtime matrix PASS;
5. patch benchmark PASS;
6. governance PASS;
7. K3-R4 PASS;
8. K3-R5 PASS;
9. K2 runtime gate PASS;
10. zero unresolved review threads after exact-head review/adjudication.

Only after those external gates pass may PR #49 be marked Ready for review. This ledger itself grants no merge authority.
