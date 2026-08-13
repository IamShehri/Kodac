# Tasks: Kodac Donor Second Wave

**Input**: `spec.md` + `plan.md`

**Planning Base**: `d28076f43f09b4c7371f137ab2d88573d04a1727`

**Rule**: This task set does not itself authorize production implementation. Each production slice requires its own component gate and exact path allowlist.

## Phase 1: Planning Foundation

- [ ] T001 [US1] Reconcile this feature package onto the canonical main that contains KDO-C1 once PR #36 is actually merged; record the new exact base before opening a planning PR. (FR-001)
- [ ] T002 [P] [US1] Record exact Spec Kit source pins, license, studied templates, and component dispositions in a durable donor research artifact. (FR-001, FR-002)
- [ ] T003 [P] [US2] Record exact DeepSeek Harness source pins, root license, relevant subsystem sources, and component-level third-party provenance constraints in the donor research artifact. (FR-001, FR-002)
- [ ] T004 [US1] Run a read-only final coverage/consistency review across spec.md, plan.md, tasks.md, and governing Kodac constraints before this planning package is proposed for merge. (FR-006)

**Checkpoint**: planning package is internally consistent and source-pinned.

---

## Phase 2: KDO-S1 — Specification Artifact & Lineage Contracts (Priority P1)

**Goal**: establish Kodac-native specification lineage before introducing broader workflow orchestration.

**Independent Test**: a serialized feature package can be reconstructed and validated against exact repository/artifact identities without running an implementation agent.

- [ ] T005 [US1] Create a founder authorization for KDO-S1 with exact source pin, exact Kodac base, path allowlist, non-grants, and acceptance tests. (FR-001, FR-018)
- [ ] T006 [US1] Define immutable specification, plan, task-set, and lineage identities that bind the feature to repository/content state. (FR-003, FR-004)
- [ ] T007 [P] [US1] Add strict validators for unknown fields, stale repository bindings, malformed identities, and lineage substitution. (FR-003, FR-004)
- [ ] T008 [P] [US1] Add regression tests for deterministic identities, artifact revisions, and exact-head/content freshness. (SC-006)
- [ ] T009 [US1] Certify and merge KDO-S1 only after exact-head CI/review gates pass. (FR-018)

**Checkpoint**: feature intent can be represented as a validated Kodac-native evidence package.

---

## Phase 3: KDO-H1 — Plugin / Capability Seam Contracts (Priority P1)

**Goal**: add a universal extensibility contract without transferring trusted authority to extensions.

**Independent Test**: a provider can advertise a bounded capability set and lifecycle metadata while remaining unable to create K2 or Done Gate authority.

- [ ] T010 [US2] Create a founder authorization for KDO-H1 with exact DeepSeek Harness donor pin and bounded production paths. (FR-001, FR-018)
- [ ] T011 [US2] Define plugin identity, publisher/provenance, compatibility, declared capabilities, scope, lifecycle, and revocation descriptors. (FR-008)
- [ ] T012 [P] [US2] Define provider/consumer seam contracts that keep capability advertisement distinct from an authority grant. (FR-008, FR-009, FR-010)
- [ ] T013 [P] [US2] Add tests proving unknown capabilities, identity substitution, duplicate registrations, and authority-shaped fields fail closed. (FR-008, FR-009, FR-010)
- [ ] T014 [US2] Certify and merge H1 only after exact-head cross-platform gates pass. (FR-018)

**Checkpoint**: Kodac has a provider-neutral capability vocabulary suitable for future Developer OS plugins.

---

## Phase 4: KDO-H3 — K2 Differential Runtime Audit (Priority P1)

**Goal**: compare DeepSeek Harness runtime lifecycle concepts against canonical K2 before adopting any execution-related donor behavior.

**Independent Test**: the audit produces a source-backed matrix classifying each donor primitive as PRESENT, PARTIAL, MISSING, CONFLICT, or NOT_APPLICABLE in Kodac.

- [ ] T015 [P] [US2] Audit request/tool lifecycle stages against K2 trusted execution stages. (FR-009)
- [ ] T016 [P] [US2] Audit policy composition, result finalization, lifecycle interception, and provider replaceability against Kodac equivalents. (FR-009)
- [ ] T017 [P] [US3] Audit session/event reconstruction concepts against Kodac runtime-session evidence to detect duplicate truth spines. (FR-011, FR-012)
- [ ] T018 [US2] Produce a no-code differential recommendation identifying only validated missing primitives for later gates. (FR-015, FR-018)

**Checkpoint**: no Harness-derived runtime implementation proceeds without a proven Kodac gap.

---

## Phase 5: KDO-S2 — Cross-Artifact Analysis Contract (Priority P1)

**Goal**: provide a read-only specification-quality and coverage analyzer.

**Independent Test**: known duplicate, ambiguous, uncovered, conflicting, stale, and unrequested fixtures produce deterministic findings without repository mutation.

- [ ] T019 [US1] Authorize S2 as read-only analysis with explicit finding schema and bounds. (FR-006, FR-018)
- [ ] T020 [P] [US1] Implement requirement/task coverage mapping and unmapped-task detection. (FR-005, FR-006)
- [ ] T021 [P] [US1] Implement ambiguity, duplication, contradiction, and policy-alignment findings. (FR-006)
- [ ] T022 [P] [US1] Bind findings to exact artifact identities and repository freshness. (FR-001, FR-006)
- [ ] T023 [US1] Prove analyzer findings remain claims and cannot trigger implementation or completion authority. (FR-006, FR-010)

---

## Phase 6: KDO-H2 — Session Event Reconstructability (Priority P2)

**Goal**: strengthen replayability without introducing a second canonical session system.

**Independent Test**: an admitted event stream reconstructs the intended model-visible history deterministically; an unknown required event fails closed.

- [ ] T024 [US3] Authorize H2 only after H3 documents a concrete session/replay gap. (FR-011, FR-018)
- [ ] T025 [US3] Define or reconcile required versus ignorable event classes and event-source identities. (FR-011, FR-012)
- [ ] T026 [P] [US3] Add deterministic history reconstruction and mutation/replay regression fixtures. (FR-011)
- [ ] T027 [P] [US3] Prove no second mutable transcript can override canonical event evidence. (FR-011, FR-012)

---

## Phase 7: KDO-S3 — Convergence / Remaining-Work Planner (Priority P2)

**Goal**: identify remaining work after implementation without claiming shipping readiness.

**Independent Test**: unmet requirements append traceable remaining-work tasks; fully satisfied requirements produce `SPEC_CONVERGED` and never `PROVEN_READY`.

- [ ] T028 [US4] Authorize S3 as bounded analysis/planning, not completion authority. (FR-007, FR-018)
- [ ] T029 [US4] Implement deterministic gap classifications for missing, partial, contradictory, and unrequested work. (FR-007)
- [ ] T030 [P] [US4] Implement append-only convergence-task planning with stable task lineage. (FR-005, FR-007)
- [ ] T031 [P] [US4] Add regression proving `SPEC_CONVERGED` remains distinct from verification and Done Gate state. (FR-007, SC-007)

---

## Phase 8: Later Component Gates

- [ ] T032 [P] [US2] Evaluate KDO-H4 policy-composition contracts only after H1/H3 are canonical. (FR-008, FR-009)
- [ ] T033 [P] [US2] Evaluate KDO-H5 turn/step lifecycle only after H2 reconciliation avoids duplicate session truth. (FR-011)
- [ ] T034 [US1] Evaluate KDO-S4 workflow orchestration only after S1/S2/S3 are canonical. (FR-003, FR-004, FR-005, FR-006, FR-007)
- [ ] T035 [P] [US2] Evaluate H6 subagent/background-work contracts after H1/H5. (FR-008, FR-009)
- [ ] T036 [P] [US2] Evaluate H7 LSP/terminal/workflow seams as later Developer OS capability providers after H1. (FR-008, FR-018)

---

## Dependencies & Execution Order

```text
Planning Foundation
    ↓
S1
    ↓
H1
    ↓
H3 differential audit
   ↙            ↘
S2              H2
 ↓               ↓
S3              H4/H5
  \              /
      S4 workflow
          ↓
       H6 / H7
```

- S1 blocks S2, S3, and S4 because later workflow artifacts need canonical lineage identities.
- H1 blocks H4, H5, H6, and H7 because later providers need the capability-seam contract.
- H3 blocks donor-derived runtime hardening because Kodac must prove a gap before adopting runtime behavior.
- H2 must reconcile with existing session evidence before H5 expands lifecycle semantics.
- S3 convergence never blocks Done Gate from independently refusing `PROVEN_READY`.

## Parallel Opportunities

- T002 and T003 may proceed independently.
- Within S1, validator and deterministic-identity tests may proceed in parallel after the core record shape is fixed.
- H3 audit tracks can proceed in parallel because they are read-only and cover separate subsystems.
- S2 coverage analysis and ambiguity/contradiction analysis may be built independently against the same immutable artifact contracts.

## Completion Rule

This task package is complete when the planning artifacts are source-pinned, internally consistent, and accepted for founder review. It does not mean any S/H production component is implemented, and it never means `PROVEN_READY`.
