# Kodac Engineering Roadmap

## Authority

This document is the current Kodac engineering roadmap authority after K2 canonical closeout and K3-R2 canonical adoption.

The pre-reconstitution roadmap at canonical base `11227cc8c58e00879e8b40e7ff7948bee396fef7` remains historical evidence and is superseded only as current product/roadmap authority.

Engineering milestones do not themselves authorize public release, package publication, brand launch, trademark claims, OSS intake, or implementation beyond an explicitly authorized gate.

## Canonical milestones

| Milestone | Theme | Status | Implementation authority |
| --- | --- | --- | --- |
| **K0/K1** | Architecture, governance, provenance, donor-selection foundation | **CLOSED** | Complete historical milestone |
| **K2** | Trusted Runtime Spine | **CLOSED** | Complete canonical milestone |
| **K3** | Evidence-Backed Repository Intelligence & Context Engine | **IN PROGRESS — K3-R1 AND K3-R2 CANONICAL** | **K3-R3 NOT AUTHORIZED** |
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
STATUS: IN PROGRESS — K3-R1 AND K3-R2 CANONICAL
K3-R1: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R2: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R3: NOT AUTHORIZED
K3: NOT CLOSED
```

Purpose:

Turn a repository and engineering task into a bounded, freshness-aware, evidence-backed representation of relevant files, symbols, definitions, references, dependencies, tests, architecture/specification context, and likely blast radius, then produce a bounded Context Bundle for model reasoning.

K3 must preserve the existing K2 execution authority. Repository intelligence can inform actions; it cannot authorize side effects.

Canonical and planned contract direction includes:

- Repository Snapshot Identity;
- evidence-backed Repo Graph;
- Kodac-owned semantic query boundary;
- bounded Context Engine / Context Bundle;
- explicit evidence ordering and freshness semantics;
- benchmark-first evaluation under ADR-0010.

K3-R1 and K3-R2 are canonical only for their separately authorized scopes. K3-R3 requires separate founder authorization. K3 is not closed.

No permanent storage engine or donor implementation is selected by this roadmap. No vector or embedding infrastructure is selected. This governance reconciliation does not admit any external donor implementation.

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

1. `Defined`, `authorized`, `implemented`, `canonical`, `closed`, and `released` are distinct states.
2. A roadmap entry never grants source-intake or implementation authority by implication.
3. K3-R3 and K4 through K7 remain unauthorized until separately founder-reviewed and authorized.
4. Storage engines, donors, models, protocols, and implementation tactics remain replaceable behind accepted Kodac boundaries unless separately ratified.
5. Superiority claims require reproducible benchmark evidence.
6. Public product versions and engineering milestones are separate governance tracks.

## Current boundary

```text
K0/K1: CLOSED
K2: CLOSED
K3: IN PROGRESS — K3-R1 AND K3-R2 CANONICAL; K3-R3 NOT AUTHORIZED; K3 NOT CLOSED
K4-K7: PROPOSED / NOT AUTHORIZED
PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
KODAC NAME / TRADEMARK CLEARANCE: NOT ESTABLISHED
```
