# Kodac KDO H4-R2A Provider-Neutral Confinement Contract Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Purpose

Authorize one narrowly bounded H4-R2A implementation slice that defines a provider-neutral, per-call confinement contract and evidence model without implementing or claiming any operating-system sandbox backend.

H4-R2A exists because H4-R1 intentionally defers external-process one-shot approval until executable identity and confinement can be proven. H4-R2A is the contract plane needed before any platform enforcement backend may be authorized.

This authorization does not itself change runtime behavior.

## 2. Canonical repository baseline

Repository:

`TheHalfMoon/Kodac`

Exact canonical main at authorization branch creation:

`344c96162ecef9c080f53e59e2e535a394cd3aa7`

Canonical tree:

`46a5fbeb03de3284b96fa064b838451bb0ca5a5a`

H4-R1 is canonical at this base through PR #52.

Relevant exact canonical runtime blobs:

- `packages/kodac-runtime/src/execution/gateway.ts` — `8b481c226276d0b06fabc8d614c1295cd0881a6a`
- `packages/kodac-runtime/src/trust/policy.ts` — `b4134e430204123bebe053ffc9105f05fca611c9`
- `packages/kodac-runtime/src/trust/approval.ts` — `d36a604cb1957bc65dac3978c626ba48a9b299fb`
- `packages/kodac-runtime/src/evidence/receipt.ts` — `bc11267496f8c8a2ca1dac713baccf88ec962b19`

These existing authority surfaces are protected from modification by H4-R2A unless a later supplemental authorization says otherwise.

## 3. Evidence-backed predecessor findings

Canonical H3 differential audit identifies all three of these as missing:

- per-call sandbox contract;
- fail-closed sandbox availability;
- sandbox/approval separation.

H3 also establishes the donor principles that Kodac may selectively adopt:

- policy mode is distinct from observed enforcement;
- approval policy is distinct from confinement mechanism;
- confinement is per-call, not mutable provider-global state;
- unavailable required confinement fails closed instead of silently running unconfined;
- a sandbox policy label is not proof that confinement occurred.

Canonical H4-R1 evidence further establishes:

- `repo.apply_patch` is the only H4-R1 one-shot approvable action;
- external-process K2 `ask` remains blocked before approval evidence, approval service invocation, or process launch;
- a path/name string is insufficient executable-byte identity across an approval wait;
- re-enabling external-process one-shot approval requires H4-R2 executable identity/confinement authority and proof;
- H4-R1 does not claim transactional rollback after mutation begins.

## 4. Donor provenance

Design/reference donor:

`deepseek-ai/deepseek-harness`

Exact admitted donor commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license:

MIT

Primary admitted sandbox source already pinned by canonical H3:

`.agents/notes/implemented/feature/2026-07-06-sandbox.md`

Blob:

`62c46c99a2283b03cf75d8823783367dd6b3473a`

H4-R2A may port principles and contract shapes only. It does not authorize donor runtime code, vendored dependency closure, provider-global mutable sandbox state, or donor authority assumptions.

## 5. Trust invariant

Kodac invariant remains:

`everything extensible — except authority`

Therefore:

- K2 remains sole trusted side-effect execution authority;
- Done Gate remains sole current `PROVEN_READY` authority;
- H4-R1 approval remains a separate authorization-decision plane;
- H4-R2A confinement descriptors cannot themselves execute anything;
- provider/plugin/tool declarations cannot manufacture confinement authority;
- a requested confinement mode is not observed enforcement evidence;
- a backend self-label is not sufficient proof of enforcement.

## 6. H4-R2A target invariant

H4-R2A must establish a deterministic, immutable contract where:

`requested confinement policy != observed confinement enforcement`

and:

`missing / malformed / incompatible / insufficient required confinement evidence -> fail closed`

The contract must make it possible for later platform slices to bind one exact execution attempt to one exact confinement request and one exact observed enforcement result without changing K2 or H4-R1 authority semantics.

## 7. Requested confinement policy vocabulary

H4-R2A may define exactly these provider-neutral requested modes:

- `read-only`
- `workspace-write`
- `danger-full-access`

These values describe requested policy only.

They MUST NOT be interpreted as proof that an OS backend enforced them.

`danger-full-access` explicitly means the request asks for no confinement guarantee from this contract. It is not a bypass token for K2 policy, approval, Done Gate, or any other trusted boundary.

## 8. Observed enforcement vocabulary

H4-R2A may define a closed observed-enforcement result vocabulary sufficient to distinguish at minimum:

- `full` — the later backend claims the complete requested confinement contract was enforced for the bound attempt;
- `partial` — the later backend claims only a strict subset was enforced;
- `unavailable` — no usable confinement backend/evidence was available for the bound request.

The implementation must keep this result structurally separate from requested mode.

`partial` MUST NOT be silently promoted to `full`.

A later caller that requires full confinement must be able to fail closed on `partial` or `unavailable`.

H4-R2A does not decide which future capabilities require `full`; that integration belongs to later backend/execution authorization.

## 9. Per-call confinement request identity

The contract must define an immutable per-call confinement request with deterministic structural identity.

At minimum, identity must bind:

- fixed H4-R2A contract version;
- requested confinement mode;
- exact workspace-root identity as an opaque caller-supplied canonical identity string, not a raw ambient path authority;
- exact execution intent identity or digest supplied by the trusted caller;
- any declared read/write scope represented by the contract;
- explicit bounded contract options, if any are admitted by implementation.

Unknown fields fail closed.

The contract must not read ambient process state, filesystem state, environment variables, PATH, network state, or platform identity while constructing structural request identity.

## 10. Enforcement evidence identity

The contract must define immutable observed enforcement evidence with deterministic structural identity.

Evidence must bind at minimum:

- fixed H4-R2A evidence version;
- exact confinement request identity;
- exact per-call request instance identity if the implementation uses one;
- backend identity supplied as data;
- observed enforcement result;
- bounded machine-readable reason/details sufficient to explain partial/unavailable state without becoming arbitrary authority-bearing data;
- exact execution-attempt identity when later supplied by a trusted caller.

Evidence must be independently recomputable/validatable from its structural fields.

Evidence construction must not execute a backend or infer enforcement from a policy label.

## 11. Backend identity boundary

H4-R2A may define a bounded backend descriptor/identity as inert evidence data only.

A backend descriptor may describe fields such as:

- backend name;
- backend version/revision identity;
- platform family identifier;
- declared supported confinement modes/features.

But registration or declaration is not authority.

H4-R2A MUST NOT add:

- an executable sandbox provider registry;
- arbitrary callbacks that launch processes;
- provider-global mutable mode;
- dynamic plugin loading;
- network discovery;
- OS backend probing;
- process spawning.

## 12. Approval/confinement separation

H4-R1 approval and H4-R2A confinement remain independent contracts.

Approval answers:

`may this exact action proceed once?`

Confinement evidence answers:

`what confinement did the bound execution backend report as enforced for this exact request/attempt?`

Neither answer may manufacture the other.

Specifically:

- `allowed-once` does not imply `full` confinement;
- `full` confinement does not imply K2 `allow` or H4-R1 approval;
- `danger-full-access` does not imply approval;
- approval evidence must not be embedded into confinement evidence as a substitute for H4-R1;
- confinement evidence must not replace K2 ExecutionReceipt.

## 13. No executable identity claim in H4-R2A

H4-R2A is a contract plane only.

It MUST NOT claim that an executable path, name, digest, file descriptor, inode, handle, or process image has actually been bound or confined.

It may define fields that a future trusted backend slice will need to bind executable identity, but H4-R2A itself must not perform filesystem stat/hash/open/exec work.

External-process K2 `ask` MUST remain fail-closed after H4-R2A.

`packages/kodac-runtime/src/execution/gateway.ts` therefore remains protected and unchanged in H4-R2A.

## 14. No platform enforcement claim

H4-R2A does not authorize implementation of:

- Linux namespaces/seccomp/cgroups/Landlock/bwrap;
- macOS Seatbelt/sandbox-exec or equivalent platform enforcement;
- Windows AppContainer/job-object/restricted-token/WDAC mechanisms;
- containers/VMs;
- remote sandbox services;
- filesystem overlay/copy-on-write transactionality;
- network isolation;
- syscall filtering;
- executable-byte pinning;
- handle-based execution;
- rollback after mutation begins.

Each platform/backend implementation requires its own later authorization and evidence gate.

## 15. Bounded structural rules

All H4-R2A serialized/structural inputs must be:

- JSON-compatible;
- strict exact-key objects;
- plain-object / dense-array compatible only;
- bounded by explicit item/byte limits;
- deterministic under canonical serialization;
- immutable after construction;
- fail-closed on unknown enum values, duplicate entries, malformed identities, sparse arrays, cycles, non-finite numbers, functions, symbols, bigint, class instances, or hidden execution hooks.

No truncation may silently alter identity-bearing data.

## 16. Authorized implementation paths

After this authorization is canonical, H4-R2A implementation may modify exactly these paths:

1. `packages/kodac-runtime/src/trust/confinement.ts`
2. `packages/kodac-runtime/src/index.ts`
3. `schema/kdo-h4-r2a-confinement.schema.json`
4. `packages/kodac-runtime/test/kdo-h4-r2a-confinement-contract.test.ts`
5. `docs/planning/KODAC_KDO_H4_R2A_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_EVIDENCE_2026-08-14.md`

The evidence ledger path is authorized but MUST remain absent until the pre-ledger implementation candidate passes required exact-head CI, scope review, and review adjudication.

No existing production authority file other than `src/index.ts` is authorized for modification.

Any additional path requires a new supplemental authorization.

## 17. Protected surfaces

H4-R2A MUST keep these canonical files byte-identical to the authorization base:

- `packages/kodac-runtime/src/execution/gateway.ts` — `8b481c226276d0b06fabc8d614c1295cd0881a6a`
- `packages/kodac-runtime/src/trust/policy.ts` — `b4134e430204123bebe053ffc9105f05fca611c9`
- `packages/kodac-runtime/src/trust/approval.ts` — `d36a604cb1957bc65dac3978c626ba48a9b299fb`
- `packages/kodac-runtime/src/evidence/receipt.ts` — `bc11267496f8c8a2ca1dac713baccf88ec962b19`
- canonical agent loop, ToolRegistry, provider transports, RuntimeOrchestrator, and Done Gate.

Focused H4-R2A tests must pin or otherwise prove these authority boundaries as appropriate without creating obsolete cross-slice pins that later authorized slices cannot reconcile cleanly.

## 18. Explicit non-grants

This authorization grants NO authority to:

- re-enable external-process K2 `ask`;
- modify `ExecutionGateway`;
- modify K2 policy behavior;
- modify H4-R1 approval behavior;
- add a platform sandbox backend;
- spawn a process;
- inspect or hash executable bytes;
- resolve PATH;
- open executable handles;
- enforce filesystem/network/syscall policy;
- add persistent grants or `allow-always`;
- add generic H5 guard/hook pipelines;
- add subagents/background jobs;
- add terminal/LSP/workflow runtime;
- replace or weaken ExecutionReceipt;
- replace or weaken Done Gate;
- claim `H4_COMPLETE`;
- claim `SANDBOX_ENFORCED`;
- claim external executable approval readiness;
- claim unrelated `PROVEN_READY`.

## 19. Required focused proofs

The H4-R2A focused suite must prove at minimum:

1. deterministic request identity for semantically identical canonical inputs;
2. identity changes when requested mode, intent identity, workspace identity, or scope changes;
3. request and evidence objects are deeply immutable and detached from caller-owned inputs;
4. exact closed requested-mode vocabulary;
5. exact closed observed-enforcement vocabulary;
6. `partial` and `unavailable` remain distinct from `full`;
7. unknown fields/enums fail closed;
8. malformed identities fail closed;
9. duplicate/noncanonical scope entries fail closed rather than silently widening authority;
10. explicit size/item/depth bounds fail closed without truncation;
11. non-plain/non-JSON values fail closed without invoking hooks;
12. enforcement evidence must bind the exact request identity;
13. backend descriptor identity is inert structural data only;
14. no process/network/filesystem-execution imports or calls exist in the production confinement module;
15. protected K2/H4-R1/Done-Gate authority surfaces remain unchanged;
16. published JSON Schema mirrors the strict structural contract without falsely equating JavaScript character count to UTF-8 runtime byte bounds.

## 20. Pre-ledger gate

Before the evidence ledger may be added, the exact implementation head must pass:

- TypeScript typecheck;
- full runtime tests;
- patch benchmark hook;
- governance workflow;
- K2 runtime classifier/matrix/final gate;
- K3-R4 gate;
- K3-R5 gate;
- exact changed-path review;
- unresolved review threads = 0 or explicitly adjudicated;
- manual exact-head architecture review, with automated review findings adjudicated if present.

Only then may the implementation report:

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

## 21. Evidence ledger and completion claim

After a pre-ledger candidate passes, the only next implementation delta may be:

`docs/planning/KODAC_KDO_H4_R2A_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_EVIDENCE_2026-08-14.md`

The ledger-bearing head must independently rerun the required CI/review gates.

Only after expected-head merge and post-merge verification may H4-R2A claim:

`KODAC_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_BOUND`

It MUST NOT claim:

- `H4_R2_COMPLETE`;
- `H4_COMPLETE`;
- `SANDBOX_ENFORCED`;
- `EXTERNAL_PROCESS_APPROVAL_READY`;
- any specific platform confinement guarantee.

## 22. Required later sequence

H4-R2A contract canonicalization must precede platform enforcement.

Recommended later sequence, each separately authorized:

- H4-R2B: one concrete platform confinement backend with observed enforcement proof;
- additional platform backends as separate slices or a separately authorized matrix;
- only after executable identity + required confinement are proven: a bounded gateway integration slice that may reconsider external-process one-shot approval;
- transactional/rollback semantics remain separate if desired.

## 23. Authorization decision

`H4_R2A_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_AUTHORIZED_AFTER_CANONICAL_MERGE`

This document authorizes only the bounded contract/evidence plane described above after this authorization itself becomes canonical.
