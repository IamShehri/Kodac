# KDO-S1 Specification Artifact Lineage — Evidence

Date: 2026-08-13

## Scope

Repository: `TheHalfMoon/Kodac`

Authorized base:
`dffa31280afc9d0f44bf0fe20f6a889682fade13`

Implementation branch:
`feat/kdo-s1-spec-artifact-lineage-contracts`

Donor:
`github/spec-kit @ e79fa25f3f465b1ce779f570ccacef7b379e9166` (MIT, PORT)

Authorized implementation paths: exactly five.

## Candidate evidence before this ledger

Reviewed candidate:
`401ad97927c34817a93ff6c6af3e966dde69bf31`

Changed paths before ledger: four of five authorized paths.

The focused S1 regression suite covers donor provenance, deterministic identities, specification-to-plan-to-task binding, repository-binding mismatch, unknown serialized fields, malformed identities, derived-field tampering, revision bounds, predecessor verification, structural schema parity, and production import-surface confinement.

On `401ad97927c34817a93ff6c6af3e966dde69bf31`:

- governance: SUCCESS
- k3-r4-adapter: SUCCESS
- k3-r5-context-engine: SUCCESS
- runtime-change-classifier: SUCCESS
- Ubuntu Typecheck/Test/Patch hook: SUCCESS
- macOS Typecheck/Test/Patch hook: SUCCESS
- Windows Typecheck/Test/Patch hook: SUCCESS
- k2-runtime-gate: SUCCESS
- unresolved review threads: 0
- submitted reviews: 0

## Defect history retained

Head `6cbb8fef17eef1e42c20062eaf93e14c30e1e26f` failed the full runtime tests after the focused S1 test was introduced.

The focused tests exposed a production defect: `createPlanArtifact`, `createTaskSetArtifact`, and `createFeatureArtifactLineage` passed a complete specification artifact as a structural `RepositoryBindingInput`. Runtime object spread therefore leaked specification-only fields into derived records even though TypeScript accepted the value structurally.

The correction at `401ad97927c34817a93ff6c6af3e966dde69bf31`:

- projects repository binding explicitly to `featureKey`, `repositoryHead`, and optional `repositoryTreeIdentity`;
- adds fail-closed constructor input-key validation for plan, task-set, and lineage inputs;
- preserves the previously added explicit predecessor-verification helpers.

The corrected candidate passed the complete cross-platform runtime matrix above.

## Authority boundary

S1 records immutable specification artifact identities and lineage only.

It does not execute Spec Kit, edit specification documents, analyze cross-artifact consistency, claim convergence, mutate repositories, change K2, change Done Gate, grant merge authority, or produce `SPEC_CONVERGED` / `PROVEN_READY`.

Fingerprints remain integrity evidence only.

## Final certification rule

This evidence file changes the branch head. Therefore all candidate results above become historical evidence only. The ledger-bearing head must pass a new exact-head CI/review cycle before S1 may leave Draft or merge.
