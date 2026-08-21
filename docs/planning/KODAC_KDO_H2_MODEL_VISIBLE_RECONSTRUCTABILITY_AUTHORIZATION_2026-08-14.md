# KDO-H2 Model-Visible Session Reconstructability Core — Authorization

Date: 2026-08-14
Status: AUTHORIZED IMPLEMENTATION SLICE

## Canonical base

Repository: `TheHalfMoon/Kodac`

Authorized base / canonical main:

`ec2558129fc69e8586fffb8d36dfe42e6a333573`

H1 is canonical at this base. K2 remains the sole trusted side-effect execution authority and Done Gate remains the sole current `PROVEN_READY` authority.

## Problem statement

Kodac currently keeps model-turn messages as mutable loop-local state while durable session events record mostly lifecycle facts, counts, lengths, and digests. The exact model-visible request cannot therefore be reconstructed from the canonical evidence record alone.

H2 begins closing that gap without writing raw model-visible content into the existing JSONL event stream.

## Donor provenance

Donor: `deepseek-ai/deepseek-harness`

Pinned commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license: MIT.

Admitted source references for design study:

- `docs/subsystems/session.md` — blob `aea9d00b38e384e7a973ce168c3a75a62e70a8bb`
- `packages/core/session/src/types.ts` — blob `17aacd1dfc2f3a9d241a2fbdea59263323f57d51`
- `packages/core/session/src/surface.ts` — blob `ba6c2dda800f36d64b370a7fac375db3f4486334`

Intake mode: `PORT` of event-sourced reconstructability and pure message-surface projection principles only.

No DeepSeek Harness runtime, persistence backend, plugin runtime, or vendor dependency is admitted by H2-R1.

## Kodac gap evidence

At the authorized base:

- `packages/kodac-runtime/src/agent/loop.ts` blob `fe92ffdc9cc057d620a8f2de2296e14eec43a1e0` keeps a separate mutable `messages` array across turns.
- `packages/kodac-runtime/src/model/turn.ts` blob `628334fb4edb7b3e4bcfcb090b8e709835096b3b` records request counts and response digests/lengths rather than a reconstructable request payload.
- `packages/kodac-runtime/src/session/session.ts` blob `02b40d96b888222ce60abe8ab3708b9a60b54677` sequences events but has no model-visible reconstruction contract.
- `packages/kodac-runtime/src/protocol/event.ts` blob `97f69af8f905352f2cd4fdfb96fbc494ee9f71a0` allows current lifecycle/model event vocabulary but does not define a lossless model-visible request surface.

These observations establish a real reconstructability gap. They do not authorize modifying those four canonical files in H2-R1.

## H2-R1 design rule

H2-R1 establishes a pure, deterministic model-visible record and reconstruction layer.

It MUST separate:

1. exact model-visible sensitive payload records;
2. structural identities and ordering facts safe for ordinary evidence metadata;
3. pure reconstruction from admitted records;
4. durability/persistence policy, which is deferred.

An identity, digest, or metadata reference is not equivalent to the sensitive payload and cannot by itself satisfy exact reconstruction.

## Authorized implementation paths

H2-R1 may modify exactly these six paths:

1. `schema/kdo-model-visible-reconstructability.schema.json`
2. `packages/kodac-runtime/src/session/model-visible-contracts.ts`
3. `packages/kodac-runtime/src/session/model-visible-reconstruction.ts`
4. `packages/kodac-runtime/src/index.ts`
5. `packages/kodac-runtime/test/kdo-h2-model-visible-reconstructability.test.ts`
6. `docs/planning/KODAC_KDO_H2_MODEL_VISIBLE_RECONSTRUCTABILITY_EVIDENCE_2026-08-14.md`

Any other repository path is outside H2-R1 authority.

## Required contract

The implementation MUST provide bounded immutable records for:

- one model-visible message with exact role/content and optional tool-call linkage;
- one tool descriptor as presented to the model;
- one request header containing provider/model and the exact admitted tool surface;
- one ordered request snapshot containing the exact message sequence;
- deterministic structural identities for each record and the complete request;
- reconstruction that reproduces the exact canonical request from supplied records;
- strict serialized validation and unknown-field rejection;
- explicit sensitive-data classification on exact content-bearing records;
- deterministic canonical ordering only where ordering is semantically unordered; message order itself MUST be preserved exactly.

The implementation MUST distinguish structural integrity from authentication, authorization, provenance admission, durability, and completion truth.

## Privacy and security boundary

H2-R1 MUST NOT automatically persist raw prompts, assistant text, tool outputs, credentials, environment values, or other sensitive model-visible content to `JsonlEventSink` or any other existing sink.

H2-R1 MUST NOT add encryption, secret storage, file/network persistence, databases, or content upload. Those require a later explicit durability gate.

Exact payload records may exist as caller-supplied or in-memory values for construction/reconstruction tests, but H2-R1 does not own their durable storage lifecycle.

## Explicit non-grants

H2-R1 does NOT authorize:

- changes to `agent/loop.ts`, `model/turn.ts`, `session/session.ts`, or `protocol/event.ts`;
- model/provider transport changes;
- raw-content event logging;
- Jsonl sink changes;
- credential or secret handling;
- filesystem/network/process execution;
- plugin loading;
- K2 or ToolRegistry authority changes;
- Done Gate changes;
- reviewer, merge, or `PROVEN_READY` authority;
- H2-R2 runtime integration.

## Acceptance gate

Before merge, the implementation must prove on one exact head:

- cumulative diff is exactly the six authorized paths;
- deterministic request identity and exact message-order reconstruction;
- mutation of any model-visible content changes identity and fails serialized validation when identity is stale;
- malformed/oversized/unknown fields fail closed;
- exact tool descriptor surface is reconstructable;
- sensitive records are explicitly classified and no persistence API is present;
- production H2-R1 files have no filesystem/network/process/provider/K2 imports;
- `agent/loop.ts`, `model/turn.ts`, `session/session.ts`, and `protocol/event.ts` remain byte-identical to the authorized base;
- schema/runtime structural parity is covered;
- Ubuntu/macOS/Windows runtime checks pass;
- governance/K3/K2 gates pass;
- all reviewer claims are adjudicated and unresolved threads are zero.

Evidence ledger must be committed last and the ledger-bearing head must be recertified before merge.

## Completion truth

H2-R1 completion means only that Kodac has a canonical pure contract capable of representing and reconstructing exact model-visible requests when supplied the required sensitive records.

It does not mean the live agent loop is yet event-sourced or durably reconstructable. That runtime integration belongs to H2-R2 and requires separate authorization.
