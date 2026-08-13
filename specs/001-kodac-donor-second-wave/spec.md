# Feature Specification: Kodac Donor Second Wave

**Feature Branch**: `docs/kdo-second-wave-spec-driven-donor-program`

**Created**: 2026-08-13

**Status**: Draft / planning-only

**Bound Kodac Base**: `d28076f43f09b4c7371f137ab2d88573d04a1727`

**Input**: Expand Kodac by studying and selectively adopting useful capabilities from GitHub Spec Kit and DeepSeek Harness while preserving Kodac's trusted authority model.

## User Scenarios & Testing

### User Story 1 - Specification-Driven Engineering (Priority: P1)

A Kodac maintainer can turn a founder intent into a versioned, traceable specification, technical plan, dependency-ordered task set, and consistency analysis before production implementation begins.

**Why this priority**: Kodac is expanding quickly across many donor-derived components. A specification lineage layer reduces scope drift, forgotten constraints, and implementation work that cannot be traced back to an authorized requirement.

**Independent Test**: Given one bounded Kodac feature request, the workflow produces a complete specification package where every implementation task maps to at least one requirement or acceptance scenario and no implementation starts from an unresolved critical inconsistency.

**Acceptance Scenarios**:

1. **Given** a founder intent and current repository identity, **When** the feature is specified, **Then** requirements, acceptance scenarios, assumptions, explicit non-goals, and measurable success criteria are recorded before implementation planning.
2. **Given** a completed specification, **When** a plan and task set are generated, **Then** every task is traceable to the specification or an explicit governing constraint.
3. **Given** spec, plan, and tasks, **When** consistency analysis runs, **Then** conflicts, ambiguity, missing coverage, and unrequested work are surfaced before implementation.

---

### User Story 2 - Extensible Agent Runtime Without Authority Leakage (Priority: P1)

A Kodac maintainer can add or replace model, tool, session, sandbox, approval, LSP, subagent, job, or workflow providers through explicit capability seams without allowing plugins or providers to manufacture execution authority.

**Why this priority**: Kodac's goal is to become the developer's single engineering surface. Extensibility is required, but the trusted K2 and Done Gate boundaries must remain stronger than ordinary plugin systems.

**Independent Test**: A new provider can be described, registered, and evaluated through a bounded capability contract while all side-effect authority remains outside the provider and no provider can claim completion truth.

**Acceptance Scenarios**:

1. **Given** a provider implementation, **When** it advertises capabilities, **Then** its advertised capabilities are descriptors and do not themselves authorize network, filesystem, process, credential, merge, or completion actions.
2. **Given** an agent tool request, **When** it reaches an execution boundary, **Then** policy, approval, sandbox, and trusted execution remain separately attributable.
3. **Given** a plugin unload or replacement, **When** its registrations are removed, **Then** dependent behavior can be detached without changing the trusted authority kernel.

---

### User Story 3 - Replayable Agent Evidence (Priority: P2)

A maintainer can reconstruct what model-visible inputs, tool calls, tool results, approvals, and runtime decisions produced an agent outcome from an append-only evidence history.

**Why this priority**: Replayability strengthens debugging, verification, reviewer adjudication, incident analysis, and reproducibility.

**Independent Test**: For a bounded agent session, all model-visible inputs and authoritative tool outcomes can be derived from recorded events without trusting a second mutable transcript.

**Acceptance Scenarios**:

1. **Given** a recorded session, **When** model history is reconstructed, **Then** the reconstructed model-visible sequence is derived from canonical events rather than a separately mutable history.
2. **Given** an unknown required event type, **When** replay cannot safely interpret it, **Then** reconstruction fails closed rather than silently dropping state.

---

### User Story 4 - Spec Convergence Without False Completion (Priority: P2)

A maintainer can assess whether implementation satisfies the declared specification and append remaining work without converting specification convergence into a shipping or completion claim.

**Why this priority**: Spec Kit's convergence idea is useful, but Kodac must preserve its stronger proof model.

**Independent Test**: A fully satisfied spec can reach `SPEC_CONVERGED` while Done Gate remains the only authority able to produce `PROVEN_READY`.

**Acceptance Scenarios**:

1. **Given** unmet requirements, **When** convergence runs, **Then** remaining work is represented as traceable tasks rather than silently rewriting the original intent.
2. **Given** no remaining specification gaps, **When** convergence succeeds, **Then** the result is `SPEC_CONVERGED` and does not imply verification or `PROVEN_READY`.

### Edge Cases

- Donor repository head changes after an audit was produced.
- A donor root license differs from one vendored or optional dependency.
- A plugin advertises a capability for which no trusted execution provider exists.
- Sandbox enforcement is partial rather than complete.
- An approval UI preset combines multiple policy knobs but one underlying knob changes independently.
- A session contains an event unknown to the current runtime.
- Spec and plan agree but tasks omit a mandatory acceptance criterion.
- Tasks contain work not requested by the spec or required by governance.
- Repository HEAD is unchanged but working-tree content changes after the spec package is bound.
- A feature is spec-converged while verification evidence is absent.

## Requirements

### Functional Requirements

- **FR-001**: Every second-wave donor artifact MUST bind to an exact donor repository commit and exact Kodac base identity.
- **FR-002**: Donor license and third-party provenance MUST be recorded at component level before direct import or vendoring is authorized.
- **FR-003**: Specification artifacts MUST separate product intent from implementation details.
- **FR-004**: Plans MUST identify trusted-boundary impacts, explicit non-grants, dependencies, and verification strategy before production implementation.
- **FR-005**: Tasks MUST be dependency ordered and traceable to requirements, acceptance scenarios, research decisions, or governing constraints.
- **FR-006**: Cross-artifact analysis MUST be read-only and MUST surface conflicts, ambiguities, missing requirement coverage, and unrequested tasks.
- **FR-007**: Specification convergence MUST remain distinct from runtime verification and completion authority.
- **FR-008**: Capability declarations MUST remain distinct from authority grants.
- **FR-009**: Plugin or provider registration MUST NOT bypass K2 side-effect authority.
- **FR-010**: Plugin or provider output MUST NOT create `PROVEN_READY` or equivalent completion truth.
- **FR-011**: Session/event architecture MUST support append-only canonical facts and deterministic reconstruction of model-visible history for admitted event classes.
- **FR-012**: Unknown required replay events MUST fail closed unless explicitly marked safe-to-ignore by contract.
- **FR-013**: Tool execution architecture MUST distinguish request, policy/approval decision, execution, normalized result, and final recorded outcome.
- **FR-014**: Sandbox policy MUST distinguish intended mode from observed enforcement completeness.
- **FR-015**: No whole-repository DeepSeek Harness or Spec Kit fork may enter Kodac production without a separately authorized architecture decision.
- **FR-016**: Spec Kit CLI/scripts/hooks MUST NOT be installed or executed in Kodac merely by this planning package.
- **FR-017**: DeepSeek Harness plugins, build scripts, package managers, network clients, credentials, sandboxes, or binaries MUST NOT be executed merely by this planning package.
- **FR-018**: Any later direct import, port, fork, or behavioral reimplementation MUST have a separately reviewable component gate with an exact path allowlist.

### Key Entities

- **Feature Specification**: Versioned statement of intended behavior, constraints, scenarios, and measurable success.
- **Plan**: Technical approach derived from an accepted specification and research evidence.
- **Task**: Dependency-aware unit of implementation or validation work traceable to source intent.
- **Donor Component**: Exact source-pinned external subsystem being evaluated for adoption.
- **Capability Descriptor**: Structural statement of what a provider can offer; not an authority token.
- **Session Event**: Append-only fact used for replay, evidence, or derived model-visible state.
- **Execution Outcome**: Trusted, immutable result attributed to the execution pipeline.

## Success Criteria

### Measurable Outcomes

- **SC-001**: 100% of second-wave donor decisions name an exact donor commit, source path or subsystem, intake disposition, and license/provenance status.
- **SC-002**: 100% of implementation tasks map to at least one FR, acceptance scenario, research decision, or governance constraint.
- **SC-003**: Zero production donor-derived code is merged from this planning package itself.
- **SC-004**: Zero capability descriptor introduced by the second wave is treated as a K2 execution grant or Done Gate completion grant.
- **SC-005**: Cross-artifact analysis reports zero unresolved CRITICAL inconsistencies before the first second-wave production component gate is opened.
- **SC-006**: Every production component gate created from this package defines an exact path allowlist and explicit non-grants.
- **SC-007**: Any future convergence result uses `SPEC_CONVERGED` or equivalent non-completion terminology and never substitutes for `PROVEN_READY`.

## Assumptions

- Kodac's existing K2 trusted execution authority and Done Gate completion authority remain canonical and unchanged.
- KDO-C1 remains pending exact-head merge at the time this package is created; this planning package does not claim otherwise.
- Spec Kit is used here first as a methodology and source donor, not as an installed runtime dependency.
- DeepSeek Harness is evaluated as a component-level runtime architecture donor, not as a DeepSeek-model dependency.
- Repository writes for this feature package are documentation/planning only.
