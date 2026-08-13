# Research — DeepSeek Harness Runtime Slices H2/H3/H4

## Donor pin

```text
repository: deepseek-ai/deepseek-harness
commit: 47f943859bef60e4160492346772ded9b24f765a
mode: source inspection only
```

No donor code was installed or executed.

## KDO-H2 — Append-Only Session + Request Reconstructability

Source inventory:

```text
packages/core/session/src/index.ts               2d82a88623cf8b8d381f9ba905ba2e7088cbfe12
packages/core/session/src/invariant.ts           da7cd55964b7b49fc00d6bab0a65d50994b4f2c3
packages/core/session/src/json.ts                43e9f0625f366012977f0cfbba53b7ab5fb94c32
packages/core/session/src/known-event-types.ts   d65935f1b86934b1de957aa26f9032c296510d3c
packages/core/session/src/request-header.ts      ef67569139ed4fb6ad20f1dbe9c77157f3d53dc1
packages/core/session/src/surface.ts             ba6c2dda800f36d64b370a7fac375db3f4486334
packages/core/session/src/types.ts               17aacd1dfc2f3a9d241a2fbdea59263323f57d51
```

Observed donor principles:

- session history is an append-only typed event log;
- model message history is derived from that log rather than stored as an independent truth;
- model-visible inputs must be reconstructable from logged state;
- request-header state is separately reconstructable;
- fork/resume/replay derive from durable event history.

Kodac overlap:

- runtime already emits evidence and execution receipts;
- K3 owns repository/context truth;
- model runtime has provider attribution and bounded execution;
- no single canonical session event vocabulary yet unifies human/model/tool/context/verification history.

Kodac target:

```text
KodacSessionEvent
SessionIdentity
ParentSessionIdentity?
ForkBoundaryIdentity?
MonotonicSequence
EventType
EventPayloadIdentity
RequestEnvelopeIdentity?
RepositoryHead?
RepositoryContentIdentity?
ContextBundleIdentity?
CapabilityIntentIdentity?
ExecutionReceiptIdentity?
```

Critical divergence: `model-visible means logged` must not mean `secrets become logged`. Credentials and other sensitive values require explicit redaction/reference policy; reconstructability should preserve authorized model-visible semantics without turning the event log into a credential store.

Disposition:

```text
PORT
priority: VERY_HIGH
recommended_gate: KDO-H2
```

Non-grants: no persistence backend, model authority, repository mutation, or Done Gate authority in the H2 contract slice.

## KDO-H3 — Guarded Tool Execution Pipeline Differential Hardening

Harness source inventory:

```text
packages/core/tools/src/index.ts                 377015feb3c329207f540046beadb08208b6c920
packages/core/tools/src/invariant.ts             5489f61d804fb516fde3697aabfa424d52e3b068
packages/core/tools/src/code-mode.ts             49c2c7a551aec42c7ccda4980c8e32b79b473d9a
packages/core/tools/src/json-schema.ts           9191bcfbfa7d7d4cd0569a2a276e304475df4dab
packages/core/tools/src/presentation.ts          8d8aa8ac24afc90002abd16c8a157ac2e57a43eb
packages/core/tools/src/schema.ts                38f2f96229c0acf316fb29d050106759874f4221
packages/core/tools/src/types.ts                 4dd6f7a9a8b5cdb4c190d4dc5565756b7cdd5c58
docs/tool-execution-pipeline.md                  d04d2e4e5093fee92f8921f0eb0112c960a81bb8
```

Kodac K2 comparison sources:

```text
packages/kodac-runtime/src/execution/gateway.ts  be5926e9a8dc5c4c29d441dac11661d71e797015
packages/kodac-runtime/src/trust/policy.ts        b4134e430204123bebe053ffc9105f05fca611c9
```

Current K2 already provides:

```text
PRESENT  explicit ExecutionIntent
PRESENT  policy decision before execution
PRESENT  allow / ask / deny vocabulary
PRESENT  path validation for bounded repository capabilities
PRESENT  time/output bounds for process-backed reads
PRESENT  execution receipts for blocked/success/failure outcomes
PRESENT  evidence-persistence failure becomes ExecutionUnprovenError
PRESENT  dedicated capabilities cannot be spoofed through generic runCommand
PRESENT  K2 remains the side-effect authority
```

Harness adds mature compositional stages:

```text
pre-execute waterfall
monotonic guards
approval resolution
around-execute wrappers
post-execute waterfall
result normalization
final content invariant
immutable final-result notification
```

Preliminary differential:

```text
PRE_EXECUTE_INTERCEPTION        PARTIAL
MONOTONIC_GUARD_REGISTRY        MISSING_AS_GENERIC_SEAM
APPROVAL_POLICY                 PRESENT_IN_K2_POLICY_MODEL
AROUND_EXECUTION_WRAPPERS       PARTIAL
POST_EXECUTE_INTERCEPTION       MISSING_AS_GENERIC_SEAM
RESULT_NORMALIZATION            PARTIAL_BY_CAPABILITY
FINAL_RESULT_INVARIANT          PARTIAL
DURABLE_EXECUTION_RECEIPT       KODAC_STRONGER
UNPROVEN_EVIDENCE_FAILURE       KODAC_STRONGER
TRUSTED_SINGLE_EXECUTOR         KODAC_INTENTIONALLY_STRONGER
```

Decision: do not introduce a second tool executor and do not port Harness dispatch authority wholesale. H3 should selectively port typed interception/finalization primitives around K2 while K2 remains the only executor.

Disposition:

```text
STUDY_PLUS_TARGETED_PORT
priority: VERY_HIGH
recommended_gate: KDO-H3
```

## KDO-H4 — Per-Call Sandbox + Approval Policy Contracts

Source inventory:

```text
packages/sandbox/sandbox/src/index.ts                    2d9ee5b91b570e6f0ae53c65482dd49508628266
packages/sandbox/sandbox/src/escalation.ts               e0b9a2ce63a97a0dbc2a81c706f5b72914b8dc0d
packages/sandbox/sandbox/src/invariant.ts                4d7f6dcdf0022d23fd32d283a80eeb8b517c2284
packages/sandbox/sandbox/src/roots.ts                    1215f3dac1650adf7f295a54ce7cd80cf2a011a3
packages/sandbox/sandbox-policy/src/index.ts             eee5a43669db97925e3c0bf0d6148bd48616ec00
packages/sandbox/sandbox-policy/src/invariant.ts         32e2c998b70e2c76ae4832c80eef4b9765239744
packages/sandbox/sandbox-policy/src/session-mode.ts      165a4620460fe0a6546625da57ea43876074e0f8
packages/interaction/user-approval/src/index.ts          b0618f6b3de5403963b49780cc6f079a5e5b3e31
packages/interaction/user-approval/src/invariant.ts      bf3ca8d18d5ff46833e97abc72e620c0fa353ce4
packages/interaction/user-approval/src/types.ts          5a862ea5460740415bebb860da7810dbe03906ed
packages/interaction/permission-presets/src/index.ts     fee29c2644ed3ca2c17ff67ad90d44e385a843c4
packages/interaction/permission-presets/src/types.ts     a978e3b5e8932b81535eef64106a308a73e5736b
docs/subsystems/sandbox.md                               19f1807cf4fc7fa5e7ae0843daeee818a7e2bdde
docs/subsystems/permission-presets.md                    16ce29a4c3b00fece089ebcdc959e57f419d35c9
```

Donor concepts worth porting:

```text
sandbox mode is resolved per call
read-only / workspace-write / danger-full-access are distinct
confinement reports full vs partial enforcement
confined requests fail closed if no enforcing backend exists
filesystem confinement does not pretend to cover network/process visibility
approval policy is independent from sandbox policy
permission presets are UX composition, not enforcement authority
```

Kodac target contract should add:

```text
SandboxPolicyIdentity
SandboxBackendIdentity
ExecutionScopeIdentity
WorkspaceRootIdentity
FilesystemMode
NetworkMode
ProcessVisibilityMode
EnforcementCompleteness
ApprovalPolicyIdentity
ApprovedEscalationIdentity?
SandboxReceiptIdentity
```

A UI preset may select a bundle of policies, but its name is never a capability token.

H4 should integrate with K2 only through a later separately authorized implementation. No sandbox backend or process launcher is authorized by this audit.

Disposition:

```text
PORT
priority: VERY_HIGH
recommended_gate: KDO-H4
```

## Updated ordering implication

The source evidence currently supports:

```text
1. KDO-S1  artifact lineage
2. KDO-H1  plugin/capability seam
3. KDO-H2  append-only session evidence
4. KDO-H4  sandbox/approval policy contracts
5. KDO-H3  K2 differential hardening
```

H2 should precede H3 so interception/execution outcomes can later bind to a stable session/event vocabulary. H4 contracts should exist before H3 integrates sandbox-specific stages.