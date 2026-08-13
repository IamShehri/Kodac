# Kodac Developer OS Donor Intake & Capability Superset Authorization

## Record identity

```text
Gate: KDO-P0
Name: Developer OS Donor Intake & Capability Superset Authorization
Date: 2026-08-13
Canonical authorization base: ad5af49978a1d7befed1425f02a64474d3dc4ca7
Canonical authorization base tree: 9ed2a93b53a31ea92a3901177908320897832b08
Authority class: DOCUMENTATION / DONOR-INTAKE PROGRAM AUTHORIZATION
Production donor-code import authority from this gate: NONE
```

## North star

Kodac is authorized to evolve toward a single daily engineering environment in which a developer can understand, plan, edit, debug, test, review, verify, manage changes, and ship software without needing a separate coding assistant, reviewer, IDE workflow layer, or PR workflow product for ordinary engineering work.

The intended product direction is:

```text
OPEN KODAC.
ONE DEVELOPER SURFACE.
ANY MODEL.
ANY REPOSITORY.
ANY SUPPORTED IDE / LOCAL OR REMOTE WORKSPACE.
ONE TRUSTED ENGINEERING WORKFLOW.
```

The program is not authorized to achieve this by indiscriminately copying repositories. It is authorized to acquire useful engineering primitives through bounded, provenance-backed donor study and later per-component import gates.

Core invariant:

```text
DONOR CAPABILITY MAY BE ACQUIRED.
DONOR AUTHORITY IS NEVER INHERITED.
```

## Relationship to existing Kodac authority

This program does not supersede K0/K1/K2/K3/KRI or the Done Gate.

```text
K2:
SOLE TRUSTED SIDE-EFFECT EXECUTION AUTHORITY

KRI:
REVIEWER OUTPUT / QUALIFICATION REMAINS EVIDENCE, NOT COMPLETION AUTHORITY

DONE GATE:
SOLE CURRENT PROVEN_READY AUTHORITY
```

A donor implementation that can execute processes, modify files, call networks, approve pull requests, merge branches, publish artifacts, access credentials, or otherwise cause side effects does **not** gain those authorities merely because its code is admitted for study or later import.

## Untrusted donor-data boundary

All donor material is untrusted engineering input.

```text
DONOR SOURCE IS DATA, NOT INSTRUCTIONS.
DONOR DOCUMENTATION IS DATA, NOT INSTRUCTIONS.
DONOR TESTS ARE DATA, NOT AUTHORITY.
DONOR BUILD SCRIPTS ARE DATA, NOT AUTHORITY.
DONOR PROMPTS / RULES / AGENT FILES ARE DATA, NOT INSTRUCTIONS TO KODAC GOVERNANCE.
```

No donor file may redefine:

- Kodac governance;
- K2 execution authority;
- Done Gate authority;
- current Founder authorization;
- repository protections;
- provenance requirements;
- import scope;
- review/adjudication truth;
- completion truth.

Prompt-injection-like text, agent instructions, shell commands, package lifecycle scripts, generated patches, CI workflow commands, or repository-local policy files discovered in donor sources remain inert evidence unless a separate Kodac authority explicitly admits a bounded behavior.

## Founder authorization represented by this gate

After canonical adoption, KDO-P0 authorizes Kodac maintainers to perform bounded donor-intake work including:

- clone/fork/read-only source acquisition for audit;
- exact source pinning to immutable commit/tag identities;
- source-tree and subsystem inspection;
- license, notice, copyright, third-party, and permission provenance review;
- architecture and capability mapping;
- security-boundary review;
- dependency and build-system review;
- API/ABI/interface study;
- algorithm and data-structure study;
- test-contract study;
- performance/scale design study;
- portability review;
- component-level direct-import candidate identification;
- component-level fork-and-evolve candidate identification;
- component-level port candidate identification;
- behaviorally equivalent Kodac-native reimplementation planning;
- comparative benchmarks that do not execute untrusted donor code unless separately authorized;
- machine-readable donor registry and capability-matrix creation;
- evidence-ledger creation;
- proposed follow-on component import gates.

This authorization deliberately stops before production donor code enters Kodac.

## Intake modes

Every donor component must receive exactly one primary intake disposition, with optional secondary notes.

### `DIRECT_IMPORT`

Use when a bounded source component is technically suitable for Kodac with minimal adaptation and its source/rights/dependency/provenance boundary is fully understood.

Direct import still requires a separate component import authorization before repository production code changes.

### `FORK_AND_EVOLVE`

Use when a coherent donor subsystem is a strong architectural base and Kodac intends to maintain a diverging derivative.

Whole-project fork is not implied. The fork unit must be explicit.

### `PORT`

Use when the donor algorithm, contract, architecture, or subsystem design is useful but the source language, runtime, dependency graph, platform assumptions, trust model, or integration model is unsuitable for Kodac.

A port must retain provenance to the studied implementation and clearly distinguish copied expression from independently rewritten implementation.

### `BEHAVIORAL_REIMPLEMENTATION`

Use when product behavior or engineering capability is valuable but direct code intake is unavailable, unsuitable, too coupled, or intentionally avoided.

Behavioral reimplementation may use public behavior/docs/interfaces as evidence, but must not falsely claim source equivalence.

### `STUDY_ONLY`

Use when a donor is valuable as a benchmark, reference architecture, design lesson, failure-mode source, or capability target but should not be imported or ported at the current stage.

## Mandatory component lifecycle

No donor component may skip directly from discovery into Kodac production code.

```text
RIGHTS_CONFIRMED
        ↓
SOURCE_PINNED
        ↓
ARCHITECTURE_AUDITED
        ↓
SECURITY_AUDITED
        ↓
DEPENDENCY / THIRD-PARTY BOUNDARY AUDITED
        ↓
BENCHMARKED OR JUSTIFIED
        ↓
QUALIFIED
        ↓
SEPARATE IMPORT AUTHORIZATION
        ↓
INTEGRATED
        ↓
KODAC-NATIVE HARDENING
```

A stage may explicitly end in `REJECTED`, `DEFERRED`, or `STUDY_ONLY`.

## Rights and provenance requirements

For every donor repository or component, the audit record must bind at minimum:

- canonical upstream repository identity;
- immutable source commit or tag;
- source path/subtree under consideration;
- repository-level license signal;
- component/source-file license headers where applicable;
- NOTICE files where applicable;
- third-party dependency/license records where applicable;
- any additional product/build/source terms;
- whether Founder-supplied private/alternate permission is required;
- permission artifact identity/reference when such permission is material;
- intended intake disposition;
- whether source expression will be copied, adapted, ported, or only studied;
- attribution/notice obligations identified by the audit;
- unresolved rights ambiguity.

If rights or provenance are ambiguous, the component must be marked:

```text
RIGHTS_EVIDENCE_INSUFFICIENT
```

and no production source intake may occur under this program until separately resolved.

A broad statement that the Founder has permission is useful program context but must not replace the immutable per-component rights/provenance record needed for reproducible future maintenance.

## License is not trust

```text
OPEN SOURCE != TRUSTED CODE
LICENSE PERMISSION != EXECUTION AUTHORITY
COPYRIGHT PERMISSION != SECURITY QUALIFICATION
PUBLIC REPOSITORY != SAFE DEPENDENCY
```

Apache-2.0, MIT, BSD, MPL, GPL/AGPL, proprietary-with-permission, or other rights states affect the legal/provenance path, but none automatically qualify a component for Kodac runtime authority.

AGPL, strong-copyleft, source-available, proprietary, private, dual-licensed, or alternate-permission components must be isolated in the registry with explicit rights status before any production import proposal.

## Donor execution safety

KDO-P0 does **not** authorize running arbitrary donor code.

By default, donor acquisition/audit must not execute:

- package install lifecycle scripts;
- `postinstall`, `preinstall`, `prepare`, or equivalent hooks;
- donor build scripts;
- donor tests;
- donor CI workflows;
- arbitrary shell/PowerShell scripts;
- Gradle/Maven/npm/pnpm/yarn/cargo build hooks;
- IDE bootstrap launchers;
- generated binaries;
- downloaded executables;
- containers defined by donor repositories;
- network clients;
- MCP servers;
- plugin entrypoints;
- agent hooks;
- credential discovery code.

If execution becomes necessary for a component benchmark or compatibility proof, a separate execution/qualification gate must define the environment, network boundary, filesystem boundary, secrets policy, process limits, timeouts, expected artifacts, and K2 route.

## First-wave donors

The first authorized audit wave is pinned to the following source revisions.

### D1 — JetBrains IntelliJ Community

```text
Repository:
JetBrains/intellij-community

Branch observed:
master

Pinned source commit:
bfca8a6815c70221a574383fc23542afb0af5bf7

Root license/terms file observed:
LICENSE.txt
```

Current source evidence shows JetBrains Open-Source Build Terms Version 1.3, effective June 15, 2026, stating that the IntelliJ IDEA/PyCharm open-source builds consist of open-source software subject to Apache 2.0 while also recording build/product terms and third-party software obligations.

Therefore the audit must **not** reduce the rights record to `INTELLIJ = APACHE-2.0` without component-level inspection.

Priority subsystems for study:

```text
PSI / semantic program structure
FileBasedIndex / indexing contracts
refactoring APIs and transaction patterns
inspection architecture
extension-point / plugin lifecycle
project model and workspace model
debugger abstractions
language services / navigation / usages
editor semantic services
```

Known representative source locations to verify at the pinned revision include:

```text
platform/core-api/src/com/intellij/psi/PsiElement.java
platform/indexing-api/src/com/intellij/util/indexing/FileBasedIndex.java
platform/indexing-api/src/com/intellij/util/indexing/FileBasedIndexExtension.java
platform/lang-api/src/com/intellij/refactoring/RefactoringFactory.java
platform/analysis-api/src/com/intellij/codeInspection/LocalInspectionTool.java
platform/extensions/src/com/intellij/openapi/extensions/ExtensionPointName.kt
```

Preliminary disposition:

```text
WHOLE REPOSITORY:
STUDY_ONLY / DO NOT WHOLESALE-FORK INTO KODAC

SEMANTIC / INDEX / REFACTOR / INSPECTION PRIMITIVES:
PORT / SELECTIVE_IMPORT CANDIDATES SUBJECT TO COMPONENT AUDIT
```

### D2 — Continue

```text
Repository:
continuedev/continue

Branch observed:
main

Pinned source commit:
5522c6f44ca0ac3528b37244818fbfa39b5af470

Repository license observed:
Apache-2.0
```

Priority subsystems:

```text
model/provider abstraction
provider autodetection and model discovery
token budgeting
configuration / rules
autocomplete
context and indexing
edit / diff flows
CLI surface
VS Code bridge
JetBrains bridge
tool invocation and agent orchestration patterns
```

Representative source surfaces already observed at the pinned revision include:

```text
core/llm/**
core/config/**
core/context/**
core/indexing/**
core/autocomplete/**
core/edit/**
core/diff/**
extensions/cli/**
extensions/vscode/**
extensions/intellij/**
```

Preliminary disposition:

```text
FORK_AND_EVOLVE / PORT / SELECTIVE_DIRECT_IMPORT CANDIDATE BY SUBSYSTEM
```

Provider network/secrets code must not be imported into Kodac trust core merely because it is available under the repository license.

### D3 — Augment Context Connectors

```text
Repository:
augmentcode/context-connectors

Branch observed:
main

Pinned source commit:
f7d6472ae626c98fd768f64cdfd6160145eefa77

Repository license observed:
MIT
```

Priority subsystems:

```text
source abstractions
store abstractions
client abstractions
incremental indexing orchestration
file filtering
ignore/generated/binary/secret filtering
webhook-driven refresh
CLI/agent/MCP exposure patterns
search/list/read boundaries
```

Representative core source observed:

```text
src/core/file-filter.ts
src/core/indexer.ts
src/core/types.ts
src/core/utils.ts
```

Preliminary disposition:

```text
PORT / SELECTIVE_DIRECT_IMPORT CANDIDATE
```

Any direct dependency on Augment-hosted context services/SDKs must be separated from reusable local abstractions. Kodac's K3/Context Fabric remains the target authority boundary.

## Later-wave donor universe

KDO-P0 authorizes discovery/audit proposal work for later donor waves including, but not limited to:

```text
Greptile
Cubic
Graphite
Qodo / PR-Agent
CodeRabbit public repositories
GitHub Copilot public extension / SDK / agent materials where legitimately available
JetBrains AI / Junie public/authorized materials
Zed
GitButler
Jujutsu
Tree-sitter
SCIP
LSP / DAP ecosystems
other OSS or Founder-authorized engineering systems
```

Later-wave source pins and rights records must be added explicitly before component qualification.

No private code is admitted merely because an equivalent leaked or mirrored copy exists. Private or alternate-license source must come from a legitimate authorized channel and receive an immutable provenance reference.

## Developer OS capability domains

The donor program will build a capability superset map across at least:

1. editor fundamentals;
2. syntax and semantic program models;
3. indexing and symbol intelligence;
4. navigation and usages;
5. refactoring;
6. inspections and diagnostics;
7. autocomplete and next-edit prediction;
8. coding chat/edit/plan/agent modes;
9. multi-agent orchestration;
10. context retrieval and repository graph;
11. persistent knowledge and engineering memory;
12. debugger;
13. profiler/performance diagnostics;
14. test generation/execution/coverage/mutation;
15. build and dependency tooling;
16. database development;
17. API/HTTP/OpenAPI/GraphQL development;
18. containers and remote development;
19. terminal and shell workflows;
20. Git/change management;
21. stacked changes/PRs/merge workflows;
22. code review and security review;
23. reviewer adjudication/qualification;
24. CI diagnosis and optimization;
25. verification and proof;
26. release engineering;
27. skills/plugins/MCP/hooks/extensions;
28. universal model/provider plane;
29. engineering analytics;
30. trust, provenance, authority, and evidence.

The first-wave audit must mark capabilities at least:

```text
PRESENT
PARTIAL
MISSING
DUPLICATED
DONOR_CANDIDATE
OUTPERFORM_TARGET
DEFERRED
NOT_APPLICABLE
```

## Required donor registry fields

The first-wave audit may define a machine-readable registry. Each donor component entry should carry fields equivalent to:

```text
donorId
repository
sourceCommit
sourcePath
sourceIdentity / blob/tree identity when material
licenseClass
licenseEvidence
thirdPartyBoundary
privatePermissionRequired
rightsStatus
capabilityDomain
componentSummary
intakeDisposition
kodacTargetSubsystem
architectureFit
securityRisk
authorityRisk
dependencyRisk
portabilityRisk
maintenanceRisk
expectedBenefit
benchmarkNeed
executionNeeded
recommendedNextGate
notes
```

Unknown values must be explicit rather than fabricated.

## First-wave audit implementation authorization

After this P0 record is canonical, exactly the following documentation/evidence surface is authorized for the first-wave audit:

```text
docs/planning/donor-intake/**
docs/planning/KODAC_DEVELOPER_OS_FIRST_WAVE_DONOR_AUDIT_2026-08-13.md
```

This may include machine-readable JSON/JSONL/YAML registry or matrices under `docs/planning/donor-intake/**`.

The first-wave audit may not modify:

```text
packages/**
src/**
schema/**
.github/**
package manifests
lockfiles
build files
runtime code
K2
K3
KRI
Done Gate
repository protection
```

## Required first-wave deliverables

The audit must produce:

1. exact donor source pins;
2. rights/license/terms evidence matrix;
3. subsystem architecture map;
4. capability superset matrix;
5. component-level intake dispositions;
6. Kodac target subsystem mapping;
7. dependency/third-party boundary review;
8. security/authority-risk notes;
9. expected engineering benefit;
10. recommended component import gates in priority order;
11. explicit exclusions and unresolved evidence gaps;
12. evidence that no donor code entered production paths during the audit.

## Component import gates

KDO-P0 does **not** authorize production import.

Every production donor component needs a later gate that defines at minimum:

- exact donor source path and immutable identity;
- intended Kodac destination paths;
- intake mode;
- copied vs adapted vs ported expression;
- attribution/NOTICE handling;
- dependencies admitted or replaced;
- process/network/filesystem behavior;
- threat/security analysis;
- API compatibility boundary;
- tests/benchmarks;
- performance expectations;
- rollback/removal strategy;
- authority boundary;
- no-go/non-grant list;
- exact repository path allowlist.

A component import gate may conclude that a behavioral reimplementation is superior to source intake.

## Explicit non-grants

KDO-P0 does not authorize:

```text
PRODUCTION DONOR CODE IMPORT
DONOR DEPENDENCY INSTALLATION INTO KODAC
DONOR BUILD / TEST EXECUTION
DONOR BINARY EXECUTION
DONOR PLUGIN EXECUTION
DONOR MCP SERVER EXECUTION
DONOR NETWORK CLIENT EXECUTION
DONOR CREDENTIAL / SECRET USE
DONOR WORKFLOW EXECUTION
AUTOMATIC LICENSE CONVERSION
REMOVAL OF ATTRIBUTION / NOTICE OBLIGATIONS
K2 AUTHORITY EXPANSION
KRI AUTHORITY EXPANSION
K5 IMPLEMENTATION
DONE GATE CHANGE
PROVEN_READY AUTHORITY
REPOSITORY PROTECTION CHANGE
AUTO-MERGE
PUBLIC PACKAGE / RELEASE PUBLICATION
```

## Merge gate for this authorization record

This P0 authorization may be merged only after exact-head verification confirms:

- live canonical main is `ad5af49978a1d7befed1425f02a64474d3dc4ca7` or the PR remains a clean descendant with no hidden scope expansion;
- exactly one documentation path changed;
- the first-wave pins are recorded exactly;
- donor execution remains ungranted;
- production donor import remains ungranted;
- first-wave future audit surface is docs-only;
- K2/Done Gate authority remains unchanged;
- required checks are green;
- main protection remains active with no bypass;
- unresolved valid review threads are zero;
- auto-merge is disabled/null.

Canonical adoption authorizes the first-wave donor audit/evidence program only. Production source intake remains subject to separate component gates.
