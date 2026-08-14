# KDO-H2-R1 Model-Visible Request Reconstruction Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE

## 1. Canonical base

Repository: `TheHalfMoon/Kodac`

Authorized base / canonical main at branch creation:

`41aac6d34483b3203dffbbd02a2a2eb23453f177`

KDO-H3 runtime differential audit is canonical at this base and identifies model-visible request reconstruction as the highest-priority runtime trust gap.

## 2. Purpose

Authorize the first bounded H2 slice:

**H2-R1 — Model-Visible Request Snapshot and Reconstruction**

The target invariant is:

`logged canonical request snapshot == model/messages/tools passed to ModelProvider.generate()`

H2-R1 must ensure that the model-visible Kodac provider-boundary request is reconstructable from durable session evidence before the provider call starts.

The provider-boundary claim is intentionally narrower than raw transport replay. H2-R1 covers the canonical Kodac request fields visible to the model/provider abstraction:

- selected provider identity;
- model id;
- ordered model-visible messages;
- ordered model-visible tool descriptors, including description and input schema.

Host-only fields such as `AbortSignal`, streaming callbacks, credentials, HTTP headers, SDK/client objects, and provider-private transport defaults are excluded from the model-visible snapshot.

## 3. Donor source pin

Donor: `deepseek-ai/deepseek-harness`

Exact source commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license: MIT.

Primary H2-R1 donor reference:

- `docs/subsystems/session.md` — blob `aea9d00b38e384e7a973ce168c3a75a62e70a8bb`

Relevant donor principle admitted for port:

- append-only session evidence is the source from which model-visible history/request state can be reconstructed;
- model-visible user/assistant/tool records are lossless rather than digest-only;
- a request-header/request-envelope record captures non-message model-visible request state before dispatch.

H2-R1 ports this principle into Kodac-native evidence contracts. It does not import DeepSeek Harness session runtime or Cordis.

## 4. Canonical Kodac source baseline

Relevant current files/blobs at the authorized base:

- `packages/kodac-runtime/src/session/session.ts` — `02b40d96b888222ce60abe8ab3708b9a60b54677`
- `packages/kodac-runtime/src/agent/loop.ts` — `fe92ffdc9cc057d620a8f2de2296e14eec43a1e0`
- `packages/kodac-runtime/src/model/turn.ts` — `628334fb4edb7b3e4bcfcb090b8e709835096b3b`
- `packages/kodac-runtime/src/model/provider.ts` — `a15f1d86ceab88ab6fa1be787719d222e354e0c4`
- `packages/kodac-runtime/src/tools/registry.ts` — `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `packages/kodac-runtime/src/protocol/event.ts` — `97f69af8f905352f2cd4fdfb96fbc494ee9f71a0`

Current gap:

- `BoundedAgentLoop` maintains model-visible messages in a separate mutable `messages[]` working array;
- `AgentTurnRunner` currently logs only message counts, tool name/capability summaries, response lengths, and digests;
- the exact `model/messages/tools` passed to `ModelProvider.generate()` cannot be reconstructed from the canonical event stream.

## 5. H2-R1 contract

A future implementation may introduce one bounded, versioned, immutable request-snapshot contract containing:

1. provider identity;
2. model id;
3. exact ordered `ModelMessage` values that are model-visible at the Kodac provider boundary;
4. exact ordered tool descriptors returned by the canonical `ToolRegistry.list()` model projection;
5. deterministic structural request identity;
6. explicit byte/item counts or bounds sufficient to fail closed before unbounded evidence is emitted.

The snapshot must be strict JSON-compatible data. It must reject:

- unknown fields;
- functions/callbacks;
- `undefined` fields in serialized records;
- cycles;
- non-finite numbers;
- malformed tool calls;
- malformed or non-JSON tool schemas;
- duplicate model tool-call ids where the model-message contract requires uniqueness;
- payloads exceeding authorized item/byte bounds.

## 6. Construction and dispatch invariant

`AgentTurnRunner` must not construct one object for logging and a semantically separate object for provider dispatch.

The permitted pattern is:

1. resolve provider and model-visible tools;
2. construct and validate one canonical H2-R1 request snapshot;
3. append that snapshot to the session as a dedicated required event **before** provider execution;
4. materialize the `ModelProvider.generate()` model-visible fields from the validated snapshot;
5. attach host-only `signal` / streaming callback only after materialization;
6. call the provider.

Focused tests must compare the logged snapshot reconstruction to the exact request observed by a fixture provider.

If the snapshot cannot be validated or appended, provider execution must not begin.

## 7. Event semantics

H2-R1 may add exactly one required event type for the request snapshot.

The event must be non-ignorable by default because omitting it would destroy request reconstructability.

Existing coarse events such as `model.requested`, stream digest events, and lifecycle events may remain for compatibility in H2-R1. They do not become the reconstruction authority.

H2-R1 does not authorize changing generic event persistence semantics beyond adding the new event vocabulary needed to carry the snapshot.

## 8. Bounds

The implementation must define explicit conservative bounds for at least:

- provider id bytes;
- model id bytes;
- message count;
- total message content bytes;
- tool-call count within messages;
- tool count;
- tool name/capability/description bytes;
- per-tool schema bytes;
- total request snapshot bytes.

No silent truncation is allowed. Oversized model-visible requests must fail closed before provider execution rather than log a partial request and execute a larger one.

## 9. Privacy / secret boundary

H2-R1 records exactly the model-visible Kodac request boundary. It must not add host-only secrets to that boundary merely for replay.

Explicitly excluded:

- API keys/tokens;
- Authorization headers;
- environment variables;
- provider client objects;
- filesystem paths that are not already model-visible message/tool content;
- raw HTTP request/response headers;
- TLS/network metadata;
- `AbortSignal` and callback/function identities.

If future code attempts to send secret-bearing content as a model-visible message, H2-R1 does not bless that content as safe; separate secret/data-loss-prevention policy remains required.

## 10. Authorized implementation paths

Only these paths are authorized for H2-R1 implementation:

1. `schema/kdo-model-visible-request.schema.json`
2. `packages/kodac-runtime/src/session/model-visible-request.ts`
3. `packages/kodac-runtime/src/protocol/event.ts`
4. `packages/kodac-runtime/src/model/turn.ts`
5. `packages/kodac-runtime/src/index.ts`
6. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
7. `docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_EVIDENCE_2026-08-14.md`

Any implementation change outside this exact allowlist requires a new authorization.

## 11. Explicit non-grants

H2-R1 does not authorize:

- changes to `packages/kodac-runtime/src/agent/loop.ts`;
- removal of the existing working `messages[]` array;
- claiming the entire agent session is event-derived or single-source-of-truth;
- raw HTTP/wire-request reconstruction;
- provider transport changes;
- credential or secret persistence;
- replaying provider network calls;
- replaying tool side effects;
- tool execution pipeline changes;
- ToolRegistry or ProviderRegistry authority changes;
- plugin execution;
- approval/sandbox implementation;
- K2/policy/ExecutionGateway/receipt changes;
- verification/Done Gate changes;
- subagents/jobs/LSP/terminal/workflow work;
- GitHub approval/merge authority;
- `PROVEN_READY` authority.

The later H2-R2 slice may address deriving working model history from canonical session evidence, but it is not authorized here.

## 12. Required focused tests

The H2-R1 test must prove at minimum:

1. exact DeepSeek Harness donor pin;
2. deterministic request identity;
3. message ordering changes identity;
4. tool ordering canonicalization follows the canonical model-visible projection rules;
5. message/tool/schema mutation changes identity;
6. strict unknown-field rejection;
7. malformed/non-JSON/cyclic data fails closed;
8. explicit `undefined` serialized fields fail closed;
9. all item and byte bounds fail closed without truncation;
10. snapshot is deeply immutable;
11. serialized validation recomputes identity and derived counts;
12. schema/runtime structural parity;
13. H2-R1 source contains no network/process/filesystem-write/credential authority;
14. current `agent/loop.ts`, `tools/registry.ts`, provider transports, K2 gateway, and Done Gate remain byte-identical;
15. a fixture provider observes `model/messages/tools` exactly equal to the materialized logged snapshot;
16. failure to append the request snapshot prevents provider invocation;
17. host-only `signal` and streaming callback are not serialized into the snapshot;
18. repeated identical model-visible input yields the same structural request identity while session event sequence still distinguishes occurrences.

## 13. Completion semantics

H2-R1 may claim only:

`KODAC_PROVIDER_BOUNDARY_REQUEST_RECONSTRUCTABLE`

when its exact implementation head passes all gates.

It must not claim:

- `FULL_SESSION_EVENT_SOURCED`;
- `RAW_PROVIDER_WIRE_RECONSTRUCTABLE`;
- `H2_COMPLETE` if H2-R2 remains outstanding;
- `PROVEN_READY` for unrelated engineering work.

## 14. Merge gate

Authorization PR:

- exactly one changed documentation path;
- required governance checks green;
- unresolved review threads zero;
- canonical main unchanged from the stated base;
- expected-head merge only.

Implementation PR later:

- exactly the seven authorized paths;
- evidence ledger added only after the pre-ledger candidate passes the runtime matrix and focused tests;
- exact-head governance/K3/K2 checks green;
- reviewer findings adjudicated on the exact head;
- PR Ready for review before merge;
- expected-head merge only;
- post-merge main/tree/parents/signature/governance/K2 verification required.

## 15. Decision

`AUTHORIZED_SCOPE_CANDIDATE — KDO-H2-R1 MODEL-VISIBLE REQUEST RECONSTRUCTION`
