# Implementation Plan: Kodac Donor Second Wave

**Branch**: `docs/kdo-second-wave-spec-driven-donor-program`
**Date**: 2026-08-13
**Spec**: `specs/001-kodac-donor-second-wave/spec.md`
**Bound Kodac Base**: `d28076f43f09b4c7371f137ab2d88573d04a1727`

## Summary

Use GitHub Spec Kit as the primary methodology donor for specification lineage and use DeepSeek Harness as a source donor for composable agent-runtime architecture. Execute the program as separately authorized, independently testable component slices rather than a wholesale fork.

## Technical Context

**Project Type**: Developer engineering OS / runtime / CLI / future IDE platform.

**Primary Existing Boundary**: Kodac trusted runtime and evidence system remain canonical.

**Planning Constraint**: This feature package is documentation-only. It does not install donor tooling or add production dependencies.

**Testing Strategy**: Every later component slice must provide focused regression tests plus existing cross-platform Kodac gates when production runtime paths change.

**Scale/Scope**: Second-wave program covers specification workflow and composable runtime primitives only. IntelliJ C2 semantic indexing remains a separate program continuation.

## Constitution Check

The following Kodac principles govern the plan:

1. Reviewer or model output is a claim, not completion truth.
2. Capability description is not an authority grant.
3. K2 remains the trusted side-effect boundary.
4. Done Gate remains the only `PROVEN_READY` authority.
5. Donor code requires exact provenance and component qualification.
6. A change in candidate head invalidates prior exact-head certification.
7. No wholesale donor fork becomes production by implication.

**Result**: PASS for planning. No constitution exception is required.

## Architecture

### Track S — Specification Plane

#### KDO-S1 — Specification Artifact & Lineage Contracts

Define immutable identities and validators for a feature specification package. The package should bind:

- feature identity;
- Kodac repository head;
- repository content identity when available;
- specification identity;
- plan identity;
- task-set identity;
- governing policy identity;
- predecessor artifact identity for revisions.

`S1` is data-contract only. It does not run Spec Kit scripts or implementation agents.

#### KDO-S2 — Cross-Artifact Analysis Contract

Create a read-only analyzer for:

- duplicate requirements;
- ambiguity;
- missing acceptance coverage;
- plan/spec contradictions;
- tasks with no intent mapping;
- requirements with no task mapping;
- policy conflicts;
- stale artifact bindings.

Analyzer findings remain evidence/claims and require explicit remediation.

#### KDO-S3 — Convergence / Remaining-Work Planner

Compare current implementation evidence with admitted requirements and append remaining-work tasks without rewriting prior task history. The terminal result is `SPEC_CONVERGED`, never `PROVEN_READY`.

#### KDO-S4 — Spec-Driven Workflow Orchestration

Connect S1-S3 into a workflow that can hand bounded tasks to Kodac agents. Any repository mutation continues through existing trusted execution controls.

### Track H — Composable Agent Runtime

#### KDO-H1 — Plugin / Capability Seam Contracts

Define provider-neutral extension descriptors with identity, provenance, compatibility, declared capability set, scope, and revocation state. A descriptor does not itself grant execution rights.

#### KDO-H2 — Session Event & Reconstructability Reconciliation

Compare the donor's append-only session model with Kodac's existing runtime-session evidence. Adopt only missing primitives so there remains one canonical event/evidence spine.

#### KDO-H3 — K2 Differential Runtime Audit

Perform a read-only architecture comparison between the donor tool lifecycle and K2. Produce a gap report before any donor-derived runtime behavior is implemented.

#### KDO-H4 — Policy Composition Contracts

Model user-friendly policy presets as compositions of underlying policy decisions without turning the preset label into the underlying authority.

#### KDO-H5 — Agent Turn / Step Lifecycle

Define explicit turn, step, request, tool-attempt, cancellation, and terminal-state semantics where they improve existing Kodac lifecycle evidence.

#### KDO-H6 — Subagent & Background Work Contracts

Define bounded subagent and background-job descriptors with explicit ownership, cancellation, parent-session linkage, and evidence identity.

#### KDO-H7 — LSP / Terminal / Workflow Seams

Define replaceable developer-tool capability seams for later IDE/Developer OS work. Actual providers remain later gates.

## Source Pins

```text
GitHub Spec Kit
repository: github/spec-kit
commit: e79fa25f3f465b1ce779f570ccacef7b379e9166
license: MIT

DeepSeek Harness
repository: deepseek-ai/deepseek-harness
commit: 47f943859bef60e4160492346772ded9b24f765a
license: MIT
```

## Sequence

```text
S1 Specification lineage contracts
  ↓
H1 Capability seam contracts
  ↓
H3 K2 differential audit
  ↓
S2 Cross-artifact analyzer
  ↓
H2 Session reconciliation
  ↓
S3 Convergence planner
  ↓
H4/H5 policy + lifecycle contracts
  ↓
S4 workflow orchestration
  ↓
H6/H7 broader Developer OS seams
```

## Non-Grants

This plan does not authorize:

- automatic installation or execution of donor tooling;
- a wholesale donor repository fork into production;
- new network, credential, filesystem, process, merge, or completion authority;
- replacement of K2;
- replacement of Done Gate;
- treating specification convergence as verification;
- importing third-party dependency closures without component-level review.

## Verification Strategy

Each component slice must have:

1. exact donor/source pin if donor-derived;
2. exact Kodac base;
3. bounded path allowlist;
4. explicit non-grants;
5. focused deterministic tests;
6. cross-platform runtime gates when production runtime changes;
7. review finding adjudication;
8. exact-head merge and post-merge verification.

## Complexity Tracking

No architecture exception is required. The plan deliberately decomposes the second wave into small gates to avoid introducing a parallel runtime or a competing source of truth.
