# KDO-H3 DeepSeek Harness Runtime Differential Audit

Date: 2026-08-14
Status: AUDIT CANDIDATE — DOCS ONLY

## 1. Purpose

This audit compares canonical Kodac runtime boundaries with a source-pinned DeepSeek Harness donor baseline. It does not authorize importing runtime code or changing execution authority.

The goal is to classify each runtime seam as one of:

- `PRESENT`
- `PARTIAL`
- `MISSING`
- `KODAC_STRONGER`
- `REJECT`

Only evidence-backed gaps should become later implementation slices.

## 2. Canonical Kodac baseline

Repository: `TheHalfMoon/Kodac`

Exact canonical main at audit branch creation:

`ec2558129fc69e8586fffb8d36dfe42e6a333573`

KDO-H1 safe capability/plugin contracts are canonical and post-merge verified at this base.

Relevant canonical Kodac files and blobs:

- `packages/kodac-runtime/src/session/session.ts` — `02b40d96b888222ce60abe8ab3708b9a60b54677`
- `packages/kodac-runtime/src/agent/loop.ts` — `fe92ffdc9cc057d620a8f2de2296e14eec43a1e0`
- `packages/kodac-runtime/src/model/turn.ts` — `628334fb4edb7b3e4bcfcb090b8e709835096b3b`
- `packages/kodac-runtime/src/protocol/event.ts` — `97f69af8f905352f2cd4fdfb96fbc494ee9f71a0`
- `packages/kodac-runtime/src/runtime/orchestrator.ts` — `b069da69909b282fdbdc2c62279e0297cbd430e9`
- `packages/kodac-runtime/src/trust/policy.ts` — `b4134e430204123bebe053ffc9105f05fca611c9`
- `packages/kodac-runtime/src/execution/gateway.ts` — `be5926e9a8dc5c4c29d441dac11661d71e797015`
- `packages/kodac-runtime/src/verification/done-gate.ts` — `067e147569fa52cc2b04c5df26fbe20a01e958e9`
- `packages/kodac-runtime/src/tools/registry.ts` — `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `packages/kodac-runtime/src/model/provider.ts` — `a15f1d86ceab88ab6fa1be787719d222e354e0c4`

## 3. Donor baseline

Donor: `deepseek-ai/deepseek-harness`

Exact source commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license: MIT.

Primary admitted H3 references:

- `docs/architecture.md` — `77000ce9d4608d440e1d903eb80a42f2ed6435ef`
- `docs/cordis-primer.md` — `2a3afe180623d89b006dfa3e73aba5567c15bbe9`
- `docs/capability-seams.md` — `a990a9dd4d92d10e37b82e6a63caa4a5a469c441`
- `docs/subsystems/session.md` — `aea9d00b38e384e7a973ce168c3a75a62e70a8bb`
- `docs/subsystems/tools.md` — `eb9c21f31e2929c7caea3ab905d1e9941b97ef6d`
- `docs/tool-execution-pipeline.md` — `d04d2e4e5093fee92f8921f0eb0112c960a81bb8`
- `packages/interaction/user-approval/README.md` — `0cf5d458863194e29f8c84168a6f089baabbf3d2`
- `.agents/notes/implemented/feature/2026-07-06-sandbox.md` — `62c46c99a2283b03cf75d8823783367dd6b3473a`
- `docs/subsystems/terminal.md` — `eedf6157b256e83d3b57e07bf738429773b87574`
- `docs/subsystems/workflow.md` — `f2c987fbc2ca3a334c55bf0b299764e2b3e6bb06`

DeepSeek Harness vendors and locally modifies Cordis and other dependencies. H3 treats the donor as a design/reference baseline only; it does not admit the vendored runtime closure.

## 4. Trust-model rule

Kodac does not adopt the donor statement that there is no privileged core.

Kodac invariant:

`everything extensible — except authority`

Therefore:

- K2 remains the sole trusted side-effect execution authority.
- Done Gate remains the sole current `PROVEN_READY` authority.
- H1 extension descriptors remain metadata only.
- a plugin/service/provider declaration cannot manufacture authority.
- donor maturity may be ported only when it preserves these boundaries.

## 5. Differential matrix

| Runtime area | Kodac classification | Evidence-backed conclusion | Next action |
| --- | --- | --- | --- |
| Model provider abstraction | `PRESENT` | Kodac has `ModelProvider`, provider registry, streaming normalization, and model capability profiles. | Keep; extend only from proven gaps. |
| Safe extension descriptor plane | `PRESENT` | KDO-H1 adds deterministic capability/provider/consumer metadata without executable authority. | Keep H1 boundary. |
| Executable extension/plugin loader | `REJECT` | Donor same-process plugin replacement is incompatible with Kodac trusted-core policy if generalized to K2/Done Gate or arbitrary tool callbacks. | Do not build in H1/H2/H4. |
| Session event spine | `PRESENT` | `RuntimeSession.emit()` produces monotonic events through an `EventSink`; JSONL and in-memory sinks exist. | Preserve as lower-level event mechanism. |
| Exact model-visible session reconstructability | `MISSING` | Kodac model-visible messages live in a separate mutable `messages` array; event log stores counts/digests rather than exact request/history content. | **KDO-H2 — highest priority.** |
| Request envelope reconstruction | `MISSING` | Kodac logs provider/model/message count and tool name/capability, but not exact system/messages/tool schemas sufficient to reconstruct the request. | H2. |
| Assistant/tool-call lossless replay | `MISSING` | stream text/tool argument deltas are logged as digest/length; assistant content is also digest/length only. | H2 with bounded lossless model-visible records. |
| Turn/step lifecycle | `PARTIAL` | Kodac has loop/turn lifecycle and budgets, but no durable one-model-call-plus-tools `step` contract equivalent to the donor session model. | KDO-H5 after H2. |
| Tool lifecycle events | `PARTIAL` | Kodac emits tool started/completed/failed but not exact model-facing call/result records sufficient for replay. | H2/H5. |
| Tool execution pipeline interception | `PARTIAL` | `RuntimeOrchestrator` dispatches directly to `RuntimeTool.execute`; no generic pre/guard/around/post/final-result pipeline. | KDO-H5, constrained under K2. |
| Monotonic guard composition | `PARTIAL` | K2 policy is fail-closed and capability-scoped, but there is no generic monotonic multi-guard pipeline across tool families. | H5 only if it cannot weaken K2. |
| Execution intent/policy boundary | `KODAC_STRONGER` | `ExecutionGateway` creates explicit intent, evaluates policy, and records blocked/success/failure receipts. | Preserve K2 design; do not replace with donor hooks. |
| Evidence persistence failure handling | `KODAC_STRONGER` | failure to persist execution evidence becomes `ExecutionUnprovenError`, preventing unproven success. | Preserve. |
| Completion truth | `KODAC_STRONGER` | Done Gate requires explicit verification checks and evidence refs before `PROVEN_READY`. | Preserve; never pluginize. |
| Approval vocabulary | `PARTIAL` | Kodac policy supports `ask`, but `ask` currently blocks execution; no one-shot answerer/service/audit pair exists. | KDO-H4. |
| One-shot approval audit | `MISSING` | donor has `asked/decided` audit and closed outcomes; Kodac has no equivalent approval service. | H4. |
| Persistent/durable permission grants | `REJECT` for now | donor itself intentionally has only one-shot grants. Kodac has no proven scope identity for durable grants. | Do not add until separately authorized. |
| Per-call sandbox contract | `MISSING` | no Kodac sandbox mode/enforcement-result seam exists. | H4. |
| Fail-closed sandbox availability | `MISSING` | no current cross-platform confinement provider/result vocabulary. | H4 design; implementation later per platform evidence. |
| Sandbox + approval separation | `MISSING` | no independent sandbox/approval contracts yet. | H4 must keep these separate. |
| Subagents | `MISSING` | no canonical Kodac subagent runtime surface found at this baseline. | KDO-H6 after H2/H4/H5. |
| Background jobs | `MISSING` | no canonical Kodac background-job runtime surface found at this baseline. | H6. |
| Persistent terminal/PTTY | `MISSING` | no canonical Kodac PTY session service. | KDO-H7 after trust/session foundations. |
| LSP capability seam | `MISSING` | no canonical Kodac LSP runtime service. | H7. |
| Dynamic workflow engine | `MISSING` | no canonical Kodac workflow engine. | H7 or later; high authority risk. |
| Replaceable provider/service seams | `PARTIAL` | H1 describes capabilities safely, but executable ProviderRegistry/ToolRegistry remain trusted same-process registries. | Keep closed until an execution-proxy design exists. |

## 6. Highest-priority gap — H2

### 6.1 Current Kodac truth

`BoundedAgentLoop.run()` creates a private copy of caller-supplied `ModelMessage[]` and mutates that array across turns by adding:

- assistant messages;
- tool-result messages;
- a synthetic system recovery message after failed turns.

`AgentTurnRunner` passes that array directly to the provider.

The event stream does not contain enough data to reconstruct the same request:

- `model.requested` records provider, model, message count, and tool name/capability only;
- `model.stream.text_delta` records digest and length, not text;
- `model.stream.tool_call_delta` records argument digest/length, not raw arguments;
- `assistant.message` records digest and length, not content;
- tool lifecycle events do not persist the exact model-facing result message.

Therefore:

`event log != exact model-visible history`

at this baseline.

### 6.2 Donor benchmark

DeepSeek Harness defines the session as an append-only log that is the single source of truth. Its LLM message history is derived from that log, not stored independently. It includes explicit surface events for user messages, assistant messages, tool calls, and tool results, plus a `request/header` snapshot containing call configuration, rendered system prompt, and assembled tool schemas.

### 6.3 Kodac target

H2 should establish:

`model-visible means reconstructable from canonical Kodac evidence`

without requiring that every internal diagnostic token be model-visible or persisted verbatim.

A future H2 design should distinguish:

1. **model-visible canonical records** — enough to rebuild the exact provider request/history;
2. **log-only evidence records** — policy, routing, timing, IDs, receipts, diagnostics;
3. **secret/private host data** — never serialized into model-visible history merely for replay.

H2 must be bounded, versioned, immutable, replayable, and fail closed on unknown required event types.

## 7. Tool-pipeline differential

DeepSeek Harness has a mature generalized pipeline:

`tool/call → pre-execute → monotonic guards → one-shot approval → around execute → tool body → post-execute → normalization → finalize → immutable result → tool/result`

Kodac currently has:

`tool lookup → tool.started → RuntimeTool.execute → tool.completed/tool.failed`

This is a real maturity gap, but copying the donor pipeline before H2 would be premature because the canonical model-facing call/result evidence is not yet reconstructable.

Future H5 may adopt these principles:

- immutable call identity;
- strict pre-execution policy stages;
- monotonic guards that may only preserve or reduce authority;
- bounded around-execution concerns such as timeout/metrics;
- normalized immutable final result;
- explicit model-facing result record;
- observer failures contained unless they are evidence-critical.

H5 must **not** allow a generic hook to bypass or weaken K2.

## 8. Approval and sandbox differential

### 8.1 Approval

DeepSeek Harness exposes one-shot outcomes:

- `allowed-once`
- `rejected`
- `cancelled`
- `unavailable`

Missing/failing answerers fail closed, and an approval audit append failure rejects instead of returning an unlogged decision.

Kodac currently has `allow | ask | deny` policy decisions, but `ask` is a blocked outcome until the caller supplies explicit authorization outside a reusable approval service.

Future H4 should add an approval contract only if:

- the request binds one exact proposed action/intent;
- a grant is one-shot;
- missing/unavailable approval fails closed;
- asked/decided evidence is durably recorded before execution proceeds;
- approval cannot bypass K2 policy or widen beyond the requested action.

### 8.2 Sandbox

The donor sandbox design correctly separates:

- policy mode: `read-only | workspace-write | danger-full-access`;
- observed enforcement: `full | partial`;
- approval policy from confinement mechanism;
- per-call policy from provider-global mutable mode.

It also fails closed when no usable confinement backend exists instead of silently running unconfined.

Kodac has no equivalent sandbox contract at this baseline.

Future H4 should first define a provider-neutral confinement **contract and evidence model**. Platform backends should be separate later slices because a contract claim is not proof that a platform actually enforced confinement.

## 9. Explicit donor rejections

H3 rejects the following donor ideas as direct Kodac architecture:

1. **No privileged core** — rejected. K2 and Done Gate remain privileged.
2. **Arbitrary same-process plugin execution as the extension foundation** — rejected for untrusted/general extensions.
3. **Tool registration itself as authority** — rejected. H1 descriptor membership is not a capability grant.
4. **Replacing K2 with generic pre/post hooks** — rejected.
5. **Treating sandbox policy labels as proof of confinement** — rejected; observed backend enforcement evidence is required.
6. **Persistent `allow-always` grants without a proven scope/revocation identity** — rejected for now.
7. **Dynamic model-written workflows before session/execution boundaries are proven** — deferred, not authorized.

## 10. Sequencing decision

The evidence-backed order after H1 is:

### H2 — Model-Visible Session Reconstructability

First because every later agent/runtime feature depends on trustworthy replay and exact request history.

### H4 — Approval + Sandbox Contract Plane

Second because execution escalation must be fail-closed and evidence-bound before broader autonomous orchestration.

### H5 — Turn/Step + Guarded Tool Pipeline Hardening

Third because generalized hooks/guards should be added only after model-visible call/result evidence and approval semantics are canonical.

### H6 — Subagents + Background Jobs

Fourth; child ownership, inheritance, cancellation, budgets, and evidence lineage depend on H2/H4/H5.

### H7 — LSP + Persistent Terminal + Workflow Seams

Fifth/later; these are valuable Developer OS capabilities but broaden long-lived runtime state and execution surface substantially.

## 11. Interaction with Spec Kit program

KDO-S1 is canonical and provides exact specification/plan/task lineage. Future H2/H4/H5 authorizations should bind their specification artifacts to exact repository heads rather than relying on mutable filenames or planning prose alone.

Spec convergence remains planning truth only:

`SPEC_CONVERGED != VERIFIED != PROVEN_READY`

## 12. H3 completion rule

H3 is complete when this docs-only audit is merged with:

- exactly one changed documentation path;
- canonical base unchanged at merge time;
- required governance checks green;
- unresolved review threads zero;
- expected-head merge;
- post-merge governance verification.

H3 does not itself authorize H2/H4/H5 implementation. Each future slice requires its own bounded authorization and exact implementation allowlist.

## 13. Decision

`H3_DIFFERENTIAL_AUDIT_READY_FOR_CANONICAL_REVIEW`

Primary conclusion:

**Kodac should adopt DeepSeek Harness's mature session reconstructability, one-shot approval, confinement evidence, and guarded-pipeline principles selectively — while preserving Kodac's stronger K2 execution receipts, privileged trust core, and Done Gate completion authority.**
