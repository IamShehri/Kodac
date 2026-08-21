# Tasks — Kodac Developer OS Second-Wave Donors

## Phase 1 — Source truth

- [x] T001 Pin Spec Kit to `e79fa25f3f465b1ce779f570ccacef7b379e9166` and record its MIT license.
- [x] T002 Pin DeepSeek Harness to `47f943859bef60e4160492346772ded9b24f765a` and record its MIT root license plus third-party provenance requirement.
- [x] T003 Inspect representative Spec Kit analyze/converge workflow material.
- [x] T004 Inspect representative Harness architecture, session, capability, tool-pipeline, permissions, and sandbox material.

## Phase 2 — Spec Kit audit

- [ ] T005 Build KDO-S1 source-path/blob inventory and proposed artifact-lineage contract.
- [ ] T006 Build KDO-S2 constitution and cross-artifact analysis disposition.
- [ ] T007 Build KDO-S3 convergence / remaining-work planner disposition.
- [ ] T008 Build KDO-S4 specification-driven workflow disposition.
- [ ] T009 Record for S1-S4: existing Kodac overlap, intake mode, risks, non-grants, dependencies, and priority.

## Phase 3 — DeepSeek Harness audit

- [ ] T010 Build KDO-H1 plugin/capability-seam source inventory and Kodac divergence.
- [ ] T011 Build KDO-H2 append-only session and request-reconstructability disposition.
- [ ] T012 Build KDO-H3 tool-pipeline differential against K2.
- [ ] T013 Build KDO-H4 sandbox/approval policy disposition.
- [ ] T014 Build KDO-H5 agent turn/step/cancellation disposition.
- [ ] T015 Build KDO-H6 subagent/background-work disposition.
- [ ] T016 Build KDO-H7 LSP/terminal/workflow disposition.
- [ ] T017 Record for H1-H7: exact donor paths/blobs, Kodac overlap, intake mode, risks, non-grants, dependencies, and priority.

## Phase 4 — Synthesis

- [ ] T018 Build the machine-readable second-wave component registry.
- [ ] T019 Reconcile overlapping donor capabilities against K2, K3, KRI, C6, C11, C12, and the C1/C2 semantic direction.
- [ ] T020 Produce the implementation dependency graph for S1-S4 and H1-H7.
- [ ] T021 Run read-only spec/plan/tasks consistency analysis and append only evidence-backed remaining work.

## Phase 5 — Handoff

- [ ] T022 Reconcile this branch against canonical `main` after PR #36 is resolved.
- [ ] T023 Verify this feature remained documentation/registry-only and did not perform donor production intake.
- [ ] T024 Publish the second-wave donor audit and capability matrix.
- [ ] T025 Declare `AUDIT_CONVERGED` only when the specification success criteria are satisfied.
- [ ] T026 Open the first separate component authorization gate; default candidate is KDO-S1 unless dependency evidence proves a stronger order.

## State rule

```text
TASK_COMPLETE != AUDIT_CONVERGED != VERIFIED != PROVEN_READY
```

This feature plans and audits donor intake only. Production authority remains outside this feature.