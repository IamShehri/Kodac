# Kodac K0/K1 Governance and Intake-Readiness Review — 2026-08-11

## Decision

```text
PARTIAL PASS — TECHNICAL INTAKE CONTROLS READY; K0/K1 NOT CLOSED
```

Review branch baseline before this package:

```text
docs/kodac-k0-k1-oss-intake
85be7fe0740eaecda238d0caad44fce4694a954a
```

Canonical main remains:

```text
c425dca6e9d5474aca50d288064fa56eb21a1b9e
```

## G1 — Name / trademark clearance

```text
RED — NOT CLEARED
```

Kodac may remain a working engineering codename, but public-brand investment remains blocked pending professional clearance. USPTO evidence shows Eastman Kodak considered opposition against a prior `KODAC` application.

## G2 — Main protection strategy

```text
PASS — STRATEGY RATIFIED
PLATFORM ENFORCEMENT PENDING
```

The repository currently has no ruleset. The required main-protection posture is now recorded. The connected control surface does not expose a ruleset write operation, so this review does not claim GitHub enforcement is active.

## G3 — First K2 donor path-level license audit

```text
PASS — REVIEWED CANDIDATE, NOT AUTHORIZED
```

The first candidate source slice is the OpenCode patch engine at pinned commit `3a90639cb57619a21e59f544b3e8d23ffed56f48`.

OpenCode root and `packages/opencode/package.json` identify MIT licensing. The candidate record explicitly excludes importing the broad OpenCode FSUtil and BOM helper dependency closure in this first slice; Kodac will use a narrow native filesystem boundary instead.

`provenance/imports/opencode-patch-v1.yaml` remains `status: reviewed`, not `authorized`.

## G4 — Provenance schema and enforcement

```text
PASS — IMPLEMENTED FAIL-CLOSED VALIDATOR + CI WORKFLOW
```

Added:

- `schema/provenance-import-record.schema.json`
- `tools/validate_provenance.py`
- `.github/workflows/governance.yml`

The validator enforces exact pinned upstream commits, import-record schema validation, source identity matching, and rejects `authorized` or `imported` records while global `code_import_authorized=false`.

The validator logic was fixture-tested before publication for both the current fail-closed/pass state and a negative unauthorized-import state. Canonical GitHub Actions verification is still required after this commit appears on the branch.

## G5 — Kernux evidence preservation / migration

```text
PASS — PRESERVE AND MIGRATE BY PARITY
```

Existing evidence semantics are retained as a strategic asset. Legacy product/runtime assumptions remain quarantined. `nexusmcp/omni-bridge` is explicitly excluded from K2 runtime intake unless separately provenanced.

## G6 — Existing repository third-party inventory

```text
PASS WITH QUARANTINE
```

No embedded third-party source was identified by repository code searches for copyright/SPDX/license markers in the new proposed K2 intake boundary. Existing dependency manifests are recorded separately from vendored source.

The legacy `nexusmcp/omni-bridge` subtree has insufficient origin evidence for trusted reuse and is therefore quarantined rather than falsely certified.

## Current authorization state

The following remain unchanged:

```text
code_import_authorized: false
K0/K1 exit gate: not complete
K2 donor source import: not authorized
main mutation: not authorized
```

## Remaining blockers before G7/G8

1. G1 professional name/trademark clearance or an explicit founder decision to change the product name before public launch.
2. Verify the new governance workflow succeeds on GitHub.
3. Activate and verify the ratified main ruleset before the first K2 PR can merge to canonical main.
4. Perform G7 final K0/K1 closure review after those controls are evidenced.
5. Only then issue explicit G8 K2 source-intake authorization.
