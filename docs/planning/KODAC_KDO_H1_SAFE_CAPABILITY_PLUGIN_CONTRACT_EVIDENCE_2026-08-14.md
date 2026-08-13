# KDO-H1 Safe Capability / Plugin Contract Evidence

Date: 2026-08-14
Status: IMPLEMENTATION EVIDENCE CANDIDATE

## Canonical authorization

Authorization merge / implementation base:

`888222bab12185d2942db85776b8908d9f314f13`

Authorization path:

`docs/planning/KODAC_KDO_H1_SAFE_CAPABILITY_PLUGIN_CONTRACT_AUTHORIZATION_2026-08-14.md`

## Donor provenance

Donor: `deepseek-ai/deepseek-harness`

Pinned commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license: MIT.

Admitted source blobs:

- `docs/architecture.md` — `77000ce9d4608d440e1d903eb80a42f2ed6435ef`
- `docs/cordis-primer.md` — `2a3afe180623d89b006dfa3e73aba5567c15bbe9`
- `docs/capability-seams.md` — `a990a9dd4d92d10e37b82e6a63caa4a5a469c441`

Intake mode: `PORT` of descriptor, seam, and reversible-membership principles only. No Cordis runtime/vendor implementation is admitted by H1.

## Authorized implementation paths

The cumulative implementation is confined to the six authorized paths:

1. `schema/kdo-extension-capability.schema.json`
2. `packages/kodac-runtime/src/extensions/contracts.ts`
3. `packages/kodac-runtime/src/extensions/registry.ts`
4. `packages/kodac-runtime/src/index.ts`
5. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
6. `docs/planning/KODAC_KDO_H1_SAFE_CAPABILITY_PLUGIN_CONTRACT_EVIDENCE_2026-08-14.md`

## Implemented contract

H1 provides only descriptive/data-plane primitives:

- deterministic bounded extension descriptors;
- namespaced capability identifiers;
- closed descriptive roles: `DEFINITION`, `PROVIDER`, `CONSUMER`;
- deterministic provenance and structural identities;
- strict serialized validation and unknown-field rejection;
- canonical capability/role ordering and duplicate rejection;
- a pure in-memory descriptor registry;
- immutable descriptor snapshots;
- data-only registration receipts with monotonic serials;
- ownership-safe, idempotent disposal where stale receipts cannot remove later replacements;
- read-only descriptor and capability discovery;
- structural JSON Schema for descriptors and registration receipts.

Registration does not load or execute extension code and does not grant a capability.

## Authority confinement

Focused regression evidence proves H1 production files do not import or depend on execution authority. The implementation does not modify:

- `packages/kodac-runtime/src/execution/gateway.ts`
- `packages/kodac-runtime/src/verification/done-gate.ts`
- `packages/kodac-runtime/src/tools/registry.ts`
- `packages/kodac-runtime/src/model/provider.ts`

The focused test attests the canonical Git blob identities of those files.

H1 does not add a plugin loader, dynamic executable import, subprocess/worker execution, network authority, filesystem authority, credentials, approval, sandbox execution, subagents, jobs, LSP, terminal, workflows, K2 authority, or `PROVEN_READY` authority.

## Pre-ledger candidate evidence

Pre-ledger implementation head:

`a416bdd64eb3767cbfe470dd8aaf63cf30f96e9f`

At that exact head:

- cumulative diff: 5 authorized implementation paths, 0 unauthorized paths;
- governance: SUCCESS;
- K3-R4 adapter: SUCCESS;
- K3-R5 context engine: SUCCESS;
- runtime-change-classifier: SUCCESS;
- Ubuntu Typecheck/Test/Patch benchmark hook: SUCCESS;
- macOS Typecheck/Test/Patch benchmark hook: SUCCESS;
- Windows Typecheck/Test/Patch benchmark hook: SUCCESS;
- `k2-runtime-gate`: SUCCESS;
- unresolved review threads: 0;
- submitted reviews: 0.

The pre-ledger head is historical evidence only after this ledger commit. It is not the final merge certification head.

## Final certification rule

After this evidence file is committed, the new ledger-bearing head must independently satisfy all of the following before merge:

1. cumulative diff remains exactly the six authorized paths;
2. branch remains based on canonical authorization merge with no behind commits;
3. governance/K3/K2 exact-head checks are green;
4. Ubuntu/macOS/Windows runtime matrix is green;
5. reviewer claims are adjudicated on the exact ledger-bearing head;
6. unresolved review threads are zero;
7. canonical `main` remains the authorized base;
8. branch protection remains active with no bypass;
9. PR is Ready for review before merge;
10. merge uses expected-head protection;
11. post-merge main/tree/parents/signature and governance/K2 are reverified.

## Completion truth

This ledger is evidence about H1 implementation only. It is not a Done Gate report and cannot produce `PROVEN_READY`.
