# KDO-H1 Safe Capability / Plugin Contract Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE

## 1. Canonical base

Repository: `TheHalfMoon/Kodac`

Authorized base / canonical main at branch creation:

`e819a24ea229a6227ccce164776843fccc99502b`

KDO-S1 is canonical and post-merge verified at this base.

## 2. Purpose

Authorize one narrow donor-derived slice: pure, immutable extension/capability descriptors and a deterministic in-memory descriptor registry.

H1 exists to establish this invariant before Kodac admits any general extension ecosystem:

`extension declaration != executable authority`

A descriptor may state what an extension claims to define, provide, or consume. Registration does not load code, invoke callbacks, grant capabilities, authorize side effects, or create completion truth.

## 3. Donor source pin

Donor: `deepseek-ai/deepseek-harness`

Exact source commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license: MIT.

Admitted source references:

- `docs/architecture.md` — blob `77000ce9d4608d440e1d903eb80a42f2ed6435ef`
- `docs/cordis-primer.md` — blob `2a3afe180623d89b006dfa3e73aba5567c15bbe9`
- `docs/capability-seams.md` — blob `a990a9dd4d92d10e37b82e6a63caa4a5a469c441`

Intake mode: `PORT` of contract/design principles only.

The donor concepts admitted for study/port are:

- stable service/capability identifiers rather than direct implementation imports;
- separation of service definition, provider, and consumer roles;
- reversible registration lifecycle;
- deterministic capability discovery/composition.

DeepSeek Harness vendors and locally modifies Cordis and related packages. H1 does **not** authorize importing, vendoring, executing, or depending on Cordis or its loader/runtime closure.

## 4. Kodac trust correction

DeepSeek Harness permits a broadly replaceable plugin architecture. Kodac does not adopt that authority model.

For Kodac H1:

- K2 remains the sole trusted side-effect execution authority.
- Done Gate remains the sole current `PROVEN_READY` authority.
- extension identity is not authentication;
- declared capability is not a capability grant;
- provider role is descriptive metadata, not execution permission;
- registry membership is not authorization;
- a disposer removes descriptor state only; it does not unload or execute code.

Existing executable registries such as `ToolRegistry` and `ProviderRegistry` are not opened to arbitrary extensions by this slice.

## 5. Authorized implementation capability

A future H1 implementation may define only:

1. bounded, versioned extension descriptors;
2. bounded, namespaced capability identifiers;
3. closed descriptive roles such as `DEFINITION`, `PROVIDER`, and `CONSUMER`;
4. deterministic donor/provenance metadata and structural identities;
5. strict serialized validation with unknown-field rejection;
6. deterministic ordering and duplicate/conflict rejection;
7. a pure in-memory descriptor registry;
8. reversible descriptor registration/removal with ownership-safe, idempotent disposal semantics;
9. read-only discovery/list/get/filter operations over descriptor metadata;
10. JSON Schema and focused regression evidence for the above.

The registry must store data records only. No descriptor or registration record may contain a function, callback, code entrypoint, command, URL-fetch instruction, secret, process handle, filesystem handle, model provider object, `RuntimeTool`, `ExecutionGateway`, or other executable authority.

## 6. Future implementation allowlist

Only these paths are authorized for the H1 implementation PR:

1. `schema/kdo-extension-capability.schema.json`
2. `packages/kodac-runtime/src/extensions/contracts.ts`
3. `packages/kodac-runtime/src/extensions/registry.ts`
4. `packages/kodac-runtime/src/index.ts`
5. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
6. `docs/planning/KODAC_KDO_H1_SAFE_CAPABILITY_PLUGIN_CONTRACT_EVIDENCE_2026-08-14.md`

Any implementation change outside this exact allowlist requires a new authorization.

## 7. Explicit non-grants

H1 does not authorize:

- a plugin loader, package installer, marketplace installer, or dynamic module loader;
- `eval`, `Function`, dynamic executable imports, VM/worker execution, subprocess execution, or shell execution;
- Cordis runtime/vendor code or Cordis loader adoption;
- filesystem/network/credential/secret authority;
- arbitrary tool/provider registration into existing executable registries;
- changes to `packages/kodac-runtime/src/tools/registry.ts`;
- changes to model/provider transports;
- K2, policy, ExecutionGateway, receipt, verification, or Done Gate changes;
- approval or sandbox implementation;
- subagents, jobs, terminal, LSP, workflow engines, MCP execution, or H2 session reconstruction;
- repository writes/autofix;
- GitHub approval/merge authority;
- `PROVEN_READY` authority.

## 8. Required tests

The future focused test must prove at minimum:

- donor provenance pinning;
- deterministic descriptor identity and canonical capability/role ordering;
- strict bounds and identifier grammar;
- unknown fields and malformed identities fail closed;
- duplicate capabilities/roles/descriptors fail closed;
- registry ordering is deterministic;
- duplicate/conflicting registration fails closed;
- disposal removes exactly the registration it owns and is idempotent;
- stale disposal cannot remove a later replacement registration;
- registry outputs are immutable snapshots rather than mutable aliases;
- descriptors and registry records contain no executable callbacks or authority-bearing fields;
- published JSON Schema matches the structural contract;
- existing K2, Done Gate, executable tool registry, and model-provider surfaces remain unchanged.

## 9. Merge gate

Authorization PR:

- exactly one changed documentation path;
- required governance checks green;
- unresolved review threads zero;
- canonical main unchanged from the stated base at merge time;
- expected-head merge only.

Implementation PR later:

- exactly the six authorized implementation paths;
- evidence ledger added only after the implementation candidate passes its runtime matrix;
- exact-head governance/K3/K2 checks green;
- reviewer findings adjudicated on the exact head;
- expected-head merge only;
- post-merge governance/K2 verification required.

## 10. Authority statement

This document authorizes only KDO-H1 as bounded descriptive extension/capability infrastructure. It does not authorize executing third-party extension code.
