# Kodac Engineering Milestones

## Authority

This document records current engineering milestone status after canonical adoption of K3-R1 through K3-R5 and the KRI-P0 planning authorization. It does not authorize public release or implementation beyond an explicitly approved gate.

## K0/K1 — CLOSED

Theme:

```text
Architecture, governance, provenance, donor-selection foundation
```

Status:

```text
CLOSED
```

Canonical outcome includes the accepted Kodac ADR foundation, provenance/license controls, donor-selection discipline, and governance architecture required for later runtime work.

## K2 — CLOSED

Theme:

```text
Trusted Runtime Spine
```

Status:

```text
CLOSED
```

Canonical outcome includes bounded agent execution, provider qualification, policy-gated side effects, exact write scope, receipts/evidence, independent verification, Done Gate proof, protected main integration, and post-merge K2 runtime verification.

## K3 — IN PROGRESS / NOT CLOSED

Theme:

```text
Evidence-Backed Repository Intelligence & Context Engine
```

Current canonical state:

```text
K3-R1: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R2: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R3: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R4: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R5: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R6+: NOT AUTHORIZED
K3: NOT CLOSED
```

Canonical K3 progress includes accepted evidence for repository gold fixtures, exact snapshot/freshness semantics, bounded external-adapter benchmarking, a bounded ast-grep CLI structural-search adapter, and a bounded deterministic Context Engine / Context Bundle.

K3 remains open. This document does not invent or authorize K3-R6 scope.

### Remaining K3 closeout direction

A future K3 closeout remains a separate founder-reviewed gate. Applicable closure evidence may include:

- canonical repository-intelligence/query contracts for the final authorized K3 scope;
- freshness identity proof;
- bounded Context Bundle evidence;
- repository-intelligence benchmark evidence;
- relevant-file and structural-symbol evidence;
- related-test or blast-radius evidence where separately brought into scope;
- provenance and evidence-class distinctions;
- preserved K2 execution boundary;
- no second execution authority;
- applicable runtime/typecheck/test evidence;
- determined and satisfied platform requirements;
- dedicated K3 closeout evidence.

Items not already demonstrated by canonical K3-R1 through K3-R5 remain future requirements only if separately authorized.

### K3 non-decisions

K3 does not select a permanent graph/index/storage backend by implication.

Vector/embedding infrastructure and K3-R6+ remain unauthorized.

## KRI-P0 — REVIEWER INTELLIGENCE PLANNING GATE

Theme:

```text
Kodac Reviewer Intelligence authorization and planning
```

Status:

```text
AUTHORIZED FOR PLANNING AND CONTRACT DESIGN ONLY
KRI IMPLEMENTATION: NOT AUTHORIZED
```

KRI-P0 may define future Reviewer Intelligence contracts, invariants, benchmark families, and gate decomposition.

It grants no repository mutation, GitHub review/comment, approval, merge, execution, or `PROVEN_READY` authority.

K2 remains the sole trusted side-effect execution authority. K5 remains proposed and not authorized.

## Proposed later milestones

The following remain roadmap directions only and have no implementation authority:

| Milestone | Proposed direction | Status |
| --- | --- | --- |
| K4 | Ecosystem Compatibility & Capability Registry | PROPOSED / NOT AUTHORIZED |
| K5 | Proof Review & Judge | PROPOSED / NOT AUTHORIZED |
| K6 | Evidence Router & Outcome Learning | PROPOSED / NOT AUTHORIZED |
| K7 | Kodac Bench & Distribution Hardening | PROPOSED / NOT AUTHORIZED |

## Current gate

```text
K3: IN PROGRESS / NOT CLOSED
K3-R1 THROUGH K3-R5: CANONICAL FOR THEIR AUTHORIZED SCOPES
K3-R6+: NOT AUTHORIZED

KRI-P0: AUTHORIZED FOR PLANNING AND CONTRACT DESIGN ONLY
KRI IMPLEMENTATION: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED

CODE IMPORT: NOT AUTHORIZED
NEW OSS / EXTERNAL REVIEW SERVICE INTAKE: NOT AUTHORIZED
NEW KODAC DEPENDENCIES: NOT AUTHORIZED
PERSISTENT REVIEW STORAGE / LEARNING: NOT AUTHORIZED
WRITE / REVIEW / APPROVAL / MERGE AUTHORITY: NOT AUTHORIZED BY KRI-P0

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
