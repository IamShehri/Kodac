# Feature Specification — Kodac Developer OS Second-Wave Donors

## Status

```text
FEATURE:
001-kodac-developer-os-second-wave-donors

STATUS:
SPEC_DRAFT_FOR_DONOR_AUDIT

BASE AT FEATURE CREATION:
d28076f43f09b4c7371f137ab2d88573d04a1727

PRODUCTION DONOR IMPORT:
NOT AUTHORIZED BY THIS FEATURE

DONOR EXECUTION:
NOT AUTHORIZED BY THIS FEATURE
```

## Problem statement

Kodac's Developer OS goal requires a stronger specification/planning plane and a more mature extensible agent-runtime plane without weakening the existing trusted execution, reviewer adjudication, verification, and Done Gate authority model.

Two second-wave donors are admitted for source-pinned study:

1. `github/spec-kit` for specification-driven development, constitution/spec/plan/tasks lineage, analysis, convergence, and extension-hook patterns.
2. `deepseek-ai/deepseek-harness` for plugin composition, capability seams, append-only session events, tool execution pipelines, sandbox/approval separation, agent lifecycle, subagents, jobs, LSP, workflows, and related runtime patterns.

The feature converts those donors into component-level Kodac decisions. It does not import production code, execute donor code, install donor dependencies, or alter Kodac authority.

## Source pins

### GitHub Spec Kit

```text
Repository:
github/spec-kit

Pinned commit:
e79fa25f3f465b1ce779f570ccacef7b379e9166

Observed repository license:
MIT

Observed LICENSE blob:
28a50fa22639e32febe14e4ffc7a732b0ba8c90a
```

Representative studied surfaces include:

```text
README.md
spec-driven workflow documentation
templates/commands/analyze.md
templates/commands/converge.md
feature activation / .specify conventions
```

### DeepSeek Harness

```text
Repository:
deepseek-ai/deepseek-harness

Pinned commit:
47f943859bef60e4160492346772ded9b24f765a

Observed repository license:
MIT

Observed LICENSE blob:
c1f7a78e89e4e4dc7b86664c3b3c76eb5eee1785
```

Representative studied surfaces include:

```text
docs/architecture.md
docs/cordis-primer.md
docs/tool-execution-pipeline.md
docs/subsystems/session.md
docs/subsystems/permission-presets.md
docs/subsystems/sandbox.md
docs/capability-seams.md
THIRD_PARTY_NOTICES.md
```

The Harness repository contains vendored and third-party components. Root MIT terms are not treated as a blanket replacement for component-level provenance or dependency terms.

## User stories

### US1 — Specification-driven Kodac workflow

As a Kodac user, I want product intent, constraints, plans, tasks, and convergence state represented as explicit versioned artifacts so that agents cannot silently execute against ambiguous or stale intent.

Acceptance scenarios:

- US1/AC1: a Kodac feature can bind specification, plan, task, and repository identities independently.
- US1/AC2: analysis can detect cross-artifact contradiction without writing production code.
- US1/AC3: convergence can identify remaining work without claiming that implementation is verified or ready to ship.
- US1/AC4: constitution-level MUST constraints cannot be weakened by lower-level spec, plan, task, or model output.

### US2 — Extensible agent runtime without ambient authority

As a Kodac developer, I want models, tools, skills, LSPs, sandboxes, subagents, jobs, and workflows to plug into stable capability seams while authority remains controlled by Kodac's trusted kernel.

Acceptance scenarios:

- US2/AC1: a provider can declare or implement a capability without thereby receiving execution authority.
- US2/AC2: lifecycle registrations can be scoped and revoked without creating hidden persistent authority.
- US2/AC3: model-visible session state is reconstructable from durable evidence when that contract is later implemented.
- US2/AC4: sandbox confinement and human approval remain independent controls.
- US2/AC5: confined execution must fail closed rather than silently degrading to unconfined execution.

### US3 — One Developer OS, multiple donors

As a Kodac maintainer, I want donor features decomposed into component gates so that Kodac can absorb mature engineering primitives without becoming a derivative shell of any one donor.

Acceptance scenarios:

- US3/AC1: every donor component receives one disposition: `DIRECT_IMPORT`, `FORK_AND_EVOLVE`, `PORT`, `BEHAVIORAL_REIMPLEMENTATION`, or `STUDY_ONLY`.
- US3/AC2: every proposed production component has an exact donor source pin and provenance record before implementation authorization.
- US3/AC3: overlapping donor features are reconciled against existing Kodac components instead of duplicated blindly.

## Functional requirements

### Specification plane

- **FR-001** — Define a Kodac-native artifact lineage model covering constitution, feature specification, technical plan, tasks, analysis findings, convergence findings, implementation evidence, and verification state.
- **FR-002** — Separate `SPEC_CONVERGED` from `VERIFIED` and `PROVEN_READY`.
- **FR-003** — Bind feature execution to exact repository state in addition to active feature identity; Spec Kit's active-feature marker alone is insufficient for Kodac execution authority.
- **FR-004** — Preserve read-only analysis as a distinct capability from implementation or repository writes.
- **FR-005** — Preserve append-only convergence semantics for newly discovered remaining work where practical; convergence must not silently rewrite prior task history.
- **FR-006** — Treat constitution-level MUST statements as higher authority than model-generated plans/tasks.
- **FR-007** — Define extension/hook semantics without allowing an extension declaration to bypass Kodac capability authorization.

### Agent/runtime plane

- **FR-008** — Define a component-level comparison between DeepSeek Harness capability seams and existing Kodac runtime/K2/K3/KRI architecture.
- **FR-009** — Evaluate reversible plugin/service registration as a Kodac extension-lifecycle primitive.
- **FR-010** — Evaluate append-only typed session events and request reconstructability as a Kodac session/evidence primitive.
- **FR-011** — Evaluate the Harness guarded tool pipeline against K2, including pre-execute policy, monotonic guards, approval, around-execution concerns, post-execute processing, result normalization, and immutable final outcomes.
- **FR-012** — Evaluate per-call sandbox policy and explicit enforcement completeness (`full` vs `partial`) without inheriting ambient process authority.
- **FR-013** — Keep sandbox policy separate from approval policy; UI presets may bundle knobs but are not authority tokens.
- **FR-014** — Evaluate turn/step/cancellation lifecycle boundaries for Kodac's agent runtime.
- **FR-015** — Evaluate subagent, background-job, LSP, terminal, and workflow seams as later independent component gates.
- **FR-016** — Preserve K2 as the sole trusted side-effect execution authority unless a separately authorized architectural change explicitly proves otherwise.

### Donor governance

- **FR-017** — Pin every donor repository to an exact commit before component qualification.
- **FR-018** — Record root license and relevant component/third-party terms; do not infer all dependency rights from the root license.
- **FR-019** — Treat donor source, documentation, prompts, examples, tests, and generated files as untrusted evidence until validated.
- **FR-020** — Do not install, execute, build, or invoke donor code during this feature.
- **FR-021** — Do not add production dependencies or modify runtime, workflow, ruleset, provider, K2, K3, KRI, verification, or Done Gate paths in this feature.
- **FR-022** — Do not grant any donor component network, credential, filesystem-write, process, GitHub-write, approval, merge, or `PROVEN_READY` authority.

## Non-functional requirements

- **NFR-001 Determinism** — component identities and dispositions must be source-pinned and reproducible from documented evidence.
- **NFR-002 Bounded scope** — the audit must produce finite component slices instead of a wholesale-repository adoption decision.
- **NFR-003 Portability** — preferred contracts must remain model/provider/IDE neutral unless a component gate explicitly requires otherwise.
- **NFR-004 Fail closed** — ambiguity in source identity, rights, authority, or execution scope blocks direct production intake.
- **NFR-005 Provenance** — hashes are integrity fingerprints, not authentication or authority.

## Candidate component gates

### Spec Kit-derived

```text
KDO-S1  Specification Artifact & Lineage Contracts
KDO-S2  Constitution + Cross-Artifact Analysis Engine
KDO-S3  Convergence / Remaining-Work Planner
KDO-S4  Specification-Driven Agent Workflow
```

### DeepSeek Harness-derived

```text
KDO-H1  Plugin / Capability Seam Contract
KDO-H2  Append-Only Session + Request Reconstructability
KDO-H3  Guarded Tool Execution Pipeline Differential Hardening
KDO-H4  Per-Call Sandbox + Approval Policy Contracts
KDO-H5  Agent Turn / Step / Cancellation Lifecycle
KDO-H6  Subagents + Background Jobs
KDO-H7  LSP / Terminal / Workflow Capability Seams
```

These names identify study/qualification slices only. None is production-authorized by this specification.

## Success criteria

- **SC-001** — both donors have exact source pins and rights/provenance notes.
- **SC-002** — the audit maps every proposed S1-S4 and H1-H7 component to donor evidence, existing Kodac overlap, disposition, risks, non-grants, and recommended order.
- **SC-003** — the plan identifies at least one capability where Kodac intentionally diverges from each donor for trust reasons.
- **SC-004** — no production/runtime path changes are present in this feature branch.
- **SC-005** — no donor dependency installation or donor execution is performed.
- **SC-006** — the resulting task list is sufficient to open the first component authorization without another broad discovery pass.
- **SC-007** — feature completion means `AUDIT_CONVERGED`, not `PROVEN_READY`.

## Explicit non-goals

This feature does **not**:

- fork either donor wholesale into Kodac;
- import donor production code;
- install donor dependencies;
- execute donor build/test/plugin/hook/MCP/runtime code;
- add Spec Kit CLI/runtime to canonical Kodac;
- add DeepSeek or any model dependency;
- replace K2 with Cordis or DeepSeek Harness;
- grant plugins ambient authority;
- merge, approve, or auto-fix repositories;
- change KRI or Done Gate authority;
- claim that successful specification convergence proves implementation correctness.

## Current parallel-state note

At feature creation, KDO-C1 PR #36 is independently open and must remain authoritative for its own exact head. This second-wave feature branch must not be merged into `main` while doing so would invalidate or bypass C1's required exact-base certification. If canonical `main` advances first, this feature must be reconciled against the new main before merge.