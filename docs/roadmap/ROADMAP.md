# Kodac Engineering Roadmap

## Authority

This document is the current Kodac engineering roadmap authority after K2 canonical closeout and canonical adoption of K3-R1 through K3-R5. It also records KRI-P0 as a separate Reviewer Intelligence planning/contract-design gate only.

The pre-reconstitution roadmap at canonical base `11227cc8c58e00879e8b40e7ff7948bee396fef7` remains historical evidence and is superseded only as current product/roadmap authority.

Engineering milestones do not themselves authorize public release, package publication, brand launch, trademark claims, OSS intake, or implementation beyond an explicitly authorized gate.

## Canonical milestones

| Milestone | Theme | Status | Implementation authority |
| --- | --- | --- | --- |
| **K0/K1** | Architecture, governance, provenance, donor-selection foundation | **CLOSED** | Complete historical milestone |
| **K2** | Trusted Runtime Spine | **CLOSED** | Complete canonical milestone |
| **K3** | Evidence-Backed Repository Intelligence & Context Engine | **IN PROGRESS — K3-R1 THROUGH K3-R5 CANONICAL; K3 NOT CLOSED** | **K3-R1 THROUGH K3-R5 ONLY AS ALREADY CANONICALLY ADOPTED; K3-R6+ NOT AUTHORIZED** |
| **KRI-P0** | Reviewer Intelligence authorization & planning gate | **PLANNING / CONTRACT DESIGN AUTHORIZED ONLY** | **KRI IMPLEMENTATION NOT AUTHORIZED** |
| **K4** | Ecosystem Compatibility & Capability Registry | **PROPOSED** | Not authorized |
| **K5** | Proof Review & Judge | **PROPOSED** | Not authorized |
| **K6** | Evidence Router & Outcome Learning | **PROPOSED** | Not authorized |
| **K7** | Kodac Bench & Distribution Hardening | **PROPOSED** | Not authorized |

## K0/K1 — Closed

Outcome:

- Kodac product and architecture constitution established;
- canonical protocol and trust boundaries established;
- provenance/license gates established;
- donor-selection discipline established;
- core ADR set accepted;
- governance foundation established.

## K2 — Closed

Outcome:

- trusted agent runtime spine;
- model/provider boundary;
- bounded agent execution;
- explicit write scope and policy;
- execution receipts and evidence;
- independent verification;
- Done Gate with `PROVEN_READY`;
- protected canonical integration and post-merge runtime proof.

## K3 — Current engineering milestone

```text
K3 — Evidence-Backed Repository Intelligence & Context Engine
STATUS: IN PROGRESS — K3-R1 THROUGH K3-R5 CANONICAL; K3 NOT CLOSED
K3-R1: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R2: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R3: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R4: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R5: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R6+: NOT AUTHORIZED
```

Purpose:

Turn a repository and engineering task into a bounded, freshness-aware, evidence-backed representation of relevant files, symbols, definitions, references, dependencies, tests, architecture/specification context, and likely blast radius, then produce a bounded Context Bundle for model reasoning.

K3 preserves K2 execution authority. Repository intelligence can inform actions; it cannot authorize side effects.

Canonical contract direction now includes already-adopted work for:

- repository gold evidence and fixture truth;
- exact repository snapshot identity and freshness;
- bounded external-adapter benchmarking;
- bounded external ast-grep CLI structural-search adapter;
- bounded deterministic Context Engine / Context Bundle;
- evidence ordering, provenance, completeness, and identity semantics.

K3-R1 through K3-R5 are canonical only for their separately authorized scopes. K3 remains open. K3-R6+ is not authorized.

No permanent storage engine is selected by this roadmap. No vector or embedding infrastructure is selected.

## KRI-P0 — Reviewer Intelligence planning gate

KRI-P0 is an independent cross-cutting planning gate, not K5 implementation.

It authorizes only planning and contract design for future evidence-backed Reviewer Intelligence, including exact-revision review identity, findings, adjudication, risk-aware review, CI/self-bypass awareness, provenance/identity review, non-authoritative suggestions, scoped learning concepts, multi-reviewer independence, and benchmark-first evaluation.

```text
KRI-P0: AUTHORIZED FOR PLANNING AND CONTRACT DESIGN ONLY
KRI IMPLEMENTATION: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED
```

Reviewer output is planned as a claim requiring adjudication, not completion truth. K2 remains the sole trusted side-effect execution authority and the existing Done Gate remains the `PROVEN_READY` authority under accepted contracts.

## K4 — Proposed: Ecosystem Compatibility & Capability Registry

Proposed direction only:

- MCP compatibility behind Kodac adapters and trust boundaries;
- ACP compatibility behind Kodac-owned canonical contracts;
- Agent Skills compatibility and governance metadata;
- capability registry and normalized capability identities.

This roadmap entry is not implementation authorization and does not supersede ADR-0007.

## K5 — Proposed: Proof Review & Judge

Proposed direction only:

- evidence-backed review findings;
- verification linkage;
- proof-oriented review artifacts;
- independent completion judgment;
- stronger separation between model assertion and completion truth.

KRI-P0 may become a future input or prerequisite, but it does not authorize K5.

## K6 — Proposed: Evidence Router & Outcome Learning

Proposed direction only:

- evidence-backed capability/model/evaluator routing;
- task/risk/context-aware routing decisions;
- privacy-governed outcome learning;
- measurable feedback from verified engineering outcomes.

## K7 — Proposed: Kodac Bench & Distribution Hardening

Proposed direction only:

- reproducible benchmark infrastructure;
- cross-system comparison evidence;
- product and packaging hardening;
- distribution/readiness gates;
- release evidence discipline.

K7 does not itself authorize distribution or public release.

## Roadmap rules

1. `Defined`, `authorized for planning`, `implementation authorized`, `implemented`, `canonical`, `closed`, and `released` are distinct states.
2. A roadmap entry never grants source-intake or implementation authority by implication.
3. K3-R1 through K3-R5 are canonical only for their already-authorized scopes; K3-R6+ remains unauthorized.
4. KRI-P0 authorizes planning and contract design only; KRI implementation and K5 implementation remain unauthorized.
5. Storage engines, donors, models, protocols, and implementation tactics remain replaceable behind accepted Kodac boundaries unless separately ratified.
6. Superiority claims require reproducible benchmark evidence.
7. Public product versions and engineering milestones are separate governance tracks.

## Current boundary

```text
K0/K1: CLOSED
K2: CLOSED
K3: IN PROGRESS — K3-R1 THROUGH K3-R5 CANONICAL; K3 NOT CLOSED
K3-R6+: NOT AUTHORIZED

KRI-P0: AUTHORIZED FOR PLANNING AND CONTRACT DESIGN ONLY
KRI IMPLEMENTATION: NOT AUTHORIZED
K5: PROPOSED / NOT AUTHORIZED

CODE IMPORT: NOT AUTHORIZED
NEW KODAC DEPENDENCIES: NOT AUTHORIZED
EXTERNAL REVIEW SERVICE INTEGRATION: NOT AUTHORIZED
PERSISTENT REVIEW STORAGE / LEARNING: NOT AUTHORIZED
REPOSITORY WRITE / REVIEW / APPROVAL / MERGE AUTHORITY: NOT AUTHORIZED BY KRI-P0

PERSISTENT STORAGE: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
KODAC NAME / TRADEMARK CLEARANCE: NOT ESTABLISHED
```

## KRI-P0 explicit non-grants

```text
KRI IMPLEMENTATION: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED
K3-R6+: NOT AUTHORIZED

CUBIC SOURCE INTAKE: NOT AUTHORIZED
CODERABBIT SOURCE INTAKE: NOT AUTHORIZED
CUBIC INTEGRATION: NOT AUTHORIZED
CODERABBIT INTEGRATION: NOT AUTHORIZED
EXTERNAL REVIEW SERVICE INTEGRATION: NOT AUTHORIZED

NEW KODAC DEPENDENCIES: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED

PERSISTENT REVIEW STORAGE: NOT AUTHORIZED
PERSISTENT REVIEW LEARNING: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED

AUTOFIX EXECUTION: NOT AUTHORIZED
REPOSITORY WRITE AUTHORITY: NOT AUTHORIZED
GITHUB COMMENT / REVIEW WRITE AUTHORITY: NOT AUTHORIZED
PR APPROVAL AUTHORITY: NOT AUTHORIZED
MERGE AUTHORITY: NOT AUTHORIZED

RULESET CHANGE: NOT AUTHORIZED
K2 EXECUTION-AUTHORITY EXPANSION: NOT AUTHORIZED

PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
```

This documentation gate does not modify `code_import_authorized` and admits no external source.
