# KDO-S1 Specification Artifact Lineage — Authorization

Date: 2026-08-13

## Decision

`AUTHORIZED_AFTER_CANONICAL_ADOPTION`

## Base

- Repository: `TheHalfMoon/Kodac`
- Canonical base: `0a987f9809137770fa22d2e3fbbc7fc4aff331e2`
- Base tree: `77d5150f8b4cf865e50e5786ff4832754a1bbfc2`

K2 and Done Gate authority are unchanged.

## Donor pin

- Repository: `github/spec-kit`
- Commit: `e79fa25f3f465b1ce779f570ccacef7b379e9166`
- License: MIT
- Intake: `PORT`

Studied blobs:

- `templates/commands/specify.md` — `54151e8b423026a356e228eb04d1a6aa368c385c`
- `templates/commands/plan.md` — `664f4281142ada0d1e678d46976c4b36df7d68d0`
- `templates/commands/tasks.md` — `64146a35aacbef8f607be9dc4e376b191af8cd4e`
- `templates/commands/analyze.md` — `2cd83bd7c031e01af1f3e5745168982d9085a3aa`
- `templates/commands/converge.md` — `eadb96ee5822b70d0b5669e6d4a32134af0e2598`
- `templates/spec-template.md` — `ceb28776215a098e977650ac090c785dcbf53651`
- `templates/plan-template.md` — `36f2eab16880bac670fe43cbe7ef2b9bc8c3aa2f`
- `templates/tasks-template.md` — `7fff087cc5a3c51a889d865fd9126607a032d233`

## Authorized S1 scope

S1 may define bounded immutable records for:

- specification artifact identity;
- plan artifact identity linked to a specification;
- task-set artifact identity linked to specification and plan;
- feature lineage linking the active artifacts;
- exact repository-head binding and optional repository content/tree binding;
- explicit predecessor identities for revisions;
- deterministic integrity identities and reconstruction validation.

Artifacts must fail closed on malformed identities, unknown fields, inconsistent cross-artifact repository binding, invalid predecessor lineage, or derived-field tampering. Fingerprints are integrity evidence only.

S1 records artifact lineage; it does not observe or mutate repository state.

## Exact implementation paths

Only these five paths are authorized for the later S1 implementation PR:

1. `schema/kdo-spec-artifact-lineage.schema.json`
2. `packages/kodac-runtime/src/specification/contracts.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/test/spec-artifact-lineage.test.ts`
5. `docs/planning/KODAC_KDO_S1_SPEC_ARTIFACT_LINEAGE_CONTRACT_EVIDENCE_2026-08-13.md`

A sixth path requires a separate authorization.

## Required proof

Tests must cover donor provenance, deterministic identities, specification-to-plan-to-task binding, repository-binding mismatch, predecessor validation, unknown fields, malformed identities, tamper detection, finite bounds, schema/runtime parity, and absence of broader runtime authority in the new contract module.

## Non-grants

S1 does not authorize Spec Kit execution, automatic document editing, cross-artifact analysis, convergence, workflow orchestration, provider execution, repository mutation, K2 changes, Done Gate changes, merge authority, `SPEC_CONVERGED`, or `PROVEN_READY`.

## Merge gate

This authorization must be canonical before implementation starts. The later implementation must stay within the five paths above, pass required CI and focused tests, resolve valid exact-head review findings, merge the exact reviewed head, and pass post-merge verification.
