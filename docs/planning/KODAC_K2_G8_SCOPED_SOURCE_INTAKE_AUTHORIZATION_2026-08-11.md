# Kodac K2 G8 Scoped Source-Intake Authorization — 2026-08-11

## Decision

```text
APPROVE — ONE SCOPED SOURCE INTAKE FOR ISOLATED K2 IMPLEMENTATION
```

Repository:

```text
IamShehri/Kodac
```

Authorized branch:

```text
feat/kodac-k2-runtime-spine
```

Parent technical-closure commit:

```text
5b324cd5e716202a47f4f55875961decebb093d9
```

## Exact authorized intake

```text
record_id:
opencode-patch-v1

upstream:
https://github.com/anomalyco/opencode

upstream commit:
3a90639cb57619a21e59f544b3e8d23ffed56f48

source path:
packages/opencode/src/patch/index.ts

destination path:
packages/kodac-runtime/src/edit/patch.ts

classification:
ADAPT
```

No other upstream source path is authorized by this decision.

## Dependency boundary

The authorization explicitly does **not** authorize copying:

```text
packages/core/src/fs-util.ts
packages/opencode/src/util/bom.ts
```

The first K2 slice must adapt the patch logic to a narrow Kodac-owned filesystem/edit boundary. The external `effect` package may be used as an ordinary package dependency subject to the repository dependency policy; it is not vendored source under this record.

## Required attribution

Substantial adapted MIT-licensed OpenCode source must retain the required copyright/license notice through the Kodac third-party notice/provenance mechanism.

## Required verification

Before the import record may advance from `authorized` to `imported`, the implementation commit must include or establish:

- behavioral patch-application tests;
- failure-semantics tests;
- path traversal / workspace-boundary tests appropriate to the Kodac edit contract;
- provenance validator success;
- license/notice evidence;
- benchmark hooks for patch correctness, minimality, and failure semantics;
- no unauthorized donor files.

## Scoped authorization enforcement

The matching machine-readable authorization is:

```text
provenance/authorizations/g8-k2-runtime-spine-opencode-patch-v1.yaml
```

The provenance validator must reject `authorized` or `imported` source when:

- the branch is not `feat/kodac-k2-runtime-spine`;
- the record ID differs;
- the upstream ID differs;
- the pinned commit differs;
- the source path set differs;
- the destination path set differs;
- the authorization reference differs.

The global policy remains fail-closed for unscoped imports.

## Explicit non-authorizations

This decision does not authorize:

- any additional OpenCode module;
- Kilo source intake;
- Codex source intake;
- Cline source intake;
- Aider source intake;
- Tabby source intake;
- PR-Agent source intake;
- legacy `nexusmcp/omni-bridge` reuse;
- merge to canonical `main`;
- package publication;
- public product launch;
- trademark or brand claims for `Kodac`.

## Canonical merge gate remains closed

No K2 implementation may merge to canonical `main` until the ratified GitHub protection ruleset is active and independently verified and a dedicated merge-readiness review passes.

## Public brand gate remains closed

`Kodac` remains a working engineering codename. This authorization makes no legal conclusion about trademark availability or commercial brand safety.

## Result

```text
G8 scoped source intake: AUTHORIZED
K2 isolated implementation: AUTHORIZED
additional donor intake: NOT AUTHORIZED
merge to main: NOT AUTHORIZED
public release: NOT AUTHORIZED
```
