# Technical Plan — Kodac Developer OS Second-Wave Donors

## Plan status

```text
FEATURE:
001-kodac-developer-os-second-wave-donors

PLAN STATUS:
READY_FOR_AUDIT_EXECUTION

FEATURE BASE:
d28076f43f09b4c7371f137ab2d88573d04a1727

PRODUCTION IMPORT:
NOT AUTHORIZED
```

## Architecture decision

The second-wave donors are not adopted as product bases. Kodac will extract component-level engineering primitives and reconcile them with its existing trust model.

Guiding rules:

```text
SPEC KIT:
use its SDD structure, not its completion semantics verbatim

DEEPSEEK HARNESS:
use its extensibility/runtime maturity, not its no-privileged-core assumption verbatim

KODAC PRINCIPLE:
everything may be extensible except authority
```

`SPEC_CONVERGED`, implementation completion, verification, and `PROVEN_READY` remain separate states.

## Existing Kodac components to reconcile against

The audit must compare donor ideas against, at minimum:

```text
K2              trusted side-effect execution
K3              repository/context intelligence
KRI-R1..R4      reviewer evidence, execution, adjudication, qualification
Done Gate       sole PROVEN_READY authority
KDO-C6          model capability contract
KDO-C11         context connector contracts
KDO-C12         incremental indexer state machine
KDO-C1          semantic-element contract candidate in PR #36
```

No donor component should duplicate an existing Kodac contract under a second name without a documented reason.

## Phase 1 — Source and rights pinning

### Spec Kit

Verify and retain:

- repository identity;
- pinned commit `e79fa25f3f465b1ce779f570ccacef7b379e9166`;
- MIT root license and blob identity;
- key workflow templates and feature-activation semantics;
- relevant extension/hook surfaces.

### DeepSeek Harness

Verify and retain:

- repository identity;
- pinned commit `47f943859bef60e4160492346772ded9b24f765a`;
- MIT root license and blob identity;
- third-party notices;
- vendored Cordis provenance and local modifications;
- relevant package/source identities for each proposed H-series component.

No dependency installation or execution is permitted in this phase.

## Phase 2 — Spec Kit differential audit

### KDO-S1 — Specification Artifact & Lineage Contracts

Study:

- feature identity;
- constitution/spec/plan/tasks relationships;
- active-feature state;
- artifact templates;
- prerequisite checks.

Kodac additions:

```text
FeatureIdentity
ConstitutionIdentity
SpecIdentity
PlanIdentity
TasksIdentity
RepositoryHead
RepositoryContentIdentity
ArtifactLineageIdentity
```

Target disposition: `PORT`.

### KDO-S2 — Constitution + Cross-Artifact Analysis Engine

Study read-only analysis and contradiction detection.

Kodac additions:

- constitution MUST precedence;
- exact artifact identities;
- bounded findings;
- evidence references;
- no write authority;
- no reviewer/Done Gate authority.

Target disposition: `PORT / BEHAVIORAL_REIMPLEMENTATION`.

### KDO-S3 — Convergence / Remaining-Work Planner

Study append-only convergence and gap classification.

Kodac additions:

- `SPEC_CONVERGED` state only;
- no implication of verification;
- immutable previous task history;
- exact implementation snapshot binding;
- findings as evidence, not execution authority.

Target disposition: `PORT`.

### KDO-S4 — Specification-Driven Agent Workflow

Study the end-to-end command flow and extension hooks.

Kodac additions:

- every execution step goes through capability authorization;
- hooks cannot manufacture authority;
- exact repository state binding;
- K2 execution receipts;
- KRI review and Done Gate remain downstream.

Target disposition: `BEHAVIORAL_REIMPLEMENTATION / selective PORT`.

## Phase 3 — DeepSeek Harness differential audit

### KDO-H1 — Plugin / Capability Seam Contract

Study Cordis services, injection, typed events, reversible effects, profiles, bundles, and patches.

Kodac additions:

```text
plugin identity
publisher/provenance
requested capability set
scope
revocation
compatibility
trusted/untrusted classification
```

Core divergence:

> DeepSeek Harness states there is no privileged core to patch. Kodac must retain a privileged trusted authority kernel.

Target disposition: `PORT`; Cordis wholesale adoption is not presumed.

### KDO-H2 — Append-Only Session + Request Reconstructability

Study:

- append-only typed session events;
- model-visible-means-logged invariant;
- derived message history;
- fork/resume/replay;
- request-header reconstruction.

Kodac additions:

- evidence identities;
- repository/context identities;
- authority receipts;
- bounded replay;
- explicit sensitive-data policy.

Target disposition: `PORT`.

### KDO-H3 — Guarded Tool Execution Pipeline Differential Hardening

Compare Harness pipeline against K2:

```text
tool/call
pre-execute
monotonic guards
approval
around-execute
provider/tool body
post-execute
normalization
finalization
immutable result
```

Produce a gap matrix:

```text
PRESENT
PARTIAL
MISSING
INTENTIONALLY_DIFFERENT
NOT_APPLICABLE
```

No K2 code changes are authorized by the audit.

Target disposition: `STUDY / targeted PORT`.

### KDO-H4 — Per-Call Sandbox + Approval Policy Contracts

Study:

- read-only/workspace-write/danger-full-access modes;
- per-call policy;
- full/partial enforcement reporting;
- no silent unconfined fallback;
- sandbox/approval independence;
- UI permission presets as presentation, not enforcement.

Kodac additions:

- K2 capability binding;
- explicit platform/backend identity;
- enforcement receipt identity;
- network/process controls as separate capabilities.

Target disposition: `PORT`.

### KDO-H5 — Agent Turn / Step / Cancellation Lifecycle

Study turn, step, request, tool, stopping, cancellation, and error recovery boundaries.

Kodac additions:

- deterministic run identities;
- model/provider attribution;
- K2 execution receipts;
- stale repository/context detection;
- evidence replay.

Target disposition: `PORT`.

### KDO-H6 — Subagents + Background Jobs

Study subagent providers, continuation, fork/spawn, jobs, collection, cancellation, and isolation.

Kodac additions:

- per-agent capability scopes;
- bounded fan-out/depth/time/budget;
- no authority inheritance by default;
- parent/child evidence linkage.

Target disposition: `PORT / selective DIRECT_IMPORT only after source audit`.

### KDO-H7 — LSP / Terminal / Workflow Capability Seams

Study LSP, persistent terminal, code runtime, and workflow seams.

Kodac additions:

- LSP read/navigation authority separated from edits;
- terminal/process authority always K2-mediated;
- workflows cannot bypass K2/Done Gate;
- provider/backend identity and confinement facts are explicit.

Target disposition: `PORT`.

## Phase 4 — Cross-donor synthesis

Create a component matrix with one row per proposed component and these fields:

```text
component_id
donor
donor_commit
donor_paths
donor_blobs
rights_status
existing_kodac_overlap
capabilities_to_keep
capabilities_to_strengthen
capabilities_to_reject
intake_mode
security_risks
non_grants
recommended_component_gate
priority
```

The matrix must make overlap visible. Examples:

- Spec Kit analysis vs KRI review: different purposes; do not merge their authority semantics.
- Harness context injection/session log vs K3 ContextBundle: session evidence may reference K3 context but must not replace K3 truth.
- Harness tool pipeline vs K2: compare and harden K2 rather than create a parallel executor.
- Harness model adapters vs KDO-C6: capability description remains separate from provider transport authority.

## Phase 5 — Recommended implementation order

Default order after audit convergence:

```text
1. KDO-S1  Specification Artifact & Lineage Contracts
2. KDO-H1  Plugin / Capability Seam Contract
3. KDO-H2  Append-Only Session + Request Reconstructability
4. KDO-S2  Constitution + Cross-Artifact Analysis Engine
5. KDO-H4  Sandbox + Approval Policy Contracts
6. KDO-H3  K2 Tool Pipeline Differential Hardening
7. KDO-S3  Convergence Planner
8. KDO-H5  Agent Turn / Step / Cancellation Lifecycle
9. KDO-S4  Specification-Driven Agent Workflow
10. KDO-H6 Subagents + Background Jobs
11. KDO-H7 LSP / Terminal / Workflow Capability Seams
```

This order may change only when the audit provides explicit evidence for a different dependency sequence.

## Verification strategy for this feature

Because this feature is docs/audit only:

- cumulative diff must remain confined to the feature package and approved planning/registry artifacts;
- no runtime/package/provider/workflow/ruleset changes;
- no donor code execution;
- no dependency or lockfile changes;
- governance and legacy checks must pass;
- any claim about a donor must cite an exact source pin/path/blob or be labeled inference;
- before merge, reconcile against current canonical `main` and any newly merged C1 state.

## Definition of audit convergence

The feature is `AUDIT_CONVERGED` only when:

1. all S1-S4 and H1-H7 components have evidence-backed dispositions;
2. cross-donor overlap is reconciled against current Kodac architecture;
3. rights/provenance are recorded at the relevant component level;
4. implementation order and non-grants are explicit;
5. no unresolved donor ambiguity remains that would block the first component authorization;
6. no production import or execution occurred.

`AUDIT_CONVERGED` is not implementation completion, verification, or `PROVEN_READY`.