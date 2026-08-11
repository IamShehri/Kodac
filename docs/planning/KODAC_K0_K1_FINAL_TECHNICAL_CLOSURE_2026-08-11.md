# Kodac K0/K1 Final Technical Closure — 2026-08-11

## Decision

```text
PASS — K0/K1 TECHNICALLY CLOSED FOR ISOLATED K2 IMPLEMENTATION
BLOCKED — CANONICAL MAIN MERGE AND PUBLIC BRAND LAUNCH
```

Repository:

```text
IamShehri/Kodac
```

Review branch before this record:

```text
docs/kodac-k0-k1-oss-intake
52023341077e9e85c5776558470e5369dc0c93e7
```

Canonical main remains:

```text
c425dca6e9d5474aca50d288064fa56eb21a1b9e
```

## Closure rationale

The architecture, donor selection, provenance controls, first path-level license review, evidence-preservation decision, and governance CI are complete enough to permit implementation on an isolated K2 branch.

Two controls remain external blockers but do not require freezing branch-local engineering:

1. **Public brand/name clearance** — `Kodac` remains a working codename. Public launch, package/domain investment, and trademark claims remain blocked pending professional clearance or a founder rename decision.
2. **Canonical main protection enforcement** — the required ruleset is specified but is not active on GitHub. No K2 implementation PR may merge into canonical `main` until the ruleset is activated and verified.

This separation is deliberate:

```text
isolated engineering authorization != canonical merge authorization != public launch authorization
```

## K0/K1 closure state

The following are complete for isolated K2 engineering:

- ADR-0001 through ADR-0010 accepted;
- donor baselines pinned to exact commits;
- module-level donor tournament complete;
- OpenCode selected as selective runtime substrate;
- native Kodac protocol/trust/evidence boundaries established;
- first OpenCode patch candidate reviewed at path/license/dependency-closure level;
- provenance import-record schema established;
- fail-closed provenance validator established;
- governance GitHub Actions workflow verified successful;
- legacy Kernux evidence machinery preserved for parity migration;
- legacy OmniBridge runtime subtree quarantined;
- canonical main unchanged during K0/K1 discovery and governance work.

## G7 verdict

```text
G7 TECHNICAL CLOSURE: PASS
K2 ISOLATED BRANCH CREATION: AUTHORIZED
K2 SOURCE INTAKE: REQUIRES SEPARATE G8 SCOPED AUTHORIZATION
K2 MERGE TO MAIN: NOT AUTHORIZED
PUBLIC BRAND LAUNCH: NOT AUTHORIZED
```

## Required G8 properties

G8 must not turn donor intake into an unrestricted global switch.

The first authorization must be scoped to all of:

```text
branch: feat/kodac-k2-runtime-spine
record_id: opencode-patch-v1
upstream: anomalyco/opencode
upstream_commit: 3a90639cb57619a21e59f544b3e8d23ffed56f48
source_path: packages/opencode/src/patch/index.ts
destination_path: packages/kodac-runtime/src/edit/patch.ts
```

Any additional source path, donor, commit, or destination requires a new or amended reviewed import record and explicit authorization.

## Main merge gate

Before any K2 implementation may merge to `main`:

- activate the ratified `main` ruleset;
- verify required governance checks are enforced;
- verify force-push/deletion protections;
- review the K2 provenance records and adapted-source attribution;
- require all relevant K2 tests and benchmark hooks to pass;
- perform a dedicated merge-readiness review.

## Name gate

The engineering codename does not constitute legal clearance.

No statement in this record asserts that `Kodac` is registrable, non-infringing, or safe for commercial public branding.

## Final state

```text
K0/K1 technical discovery/governance: CLOSED
K2 isolated implementation: ELIGIBLE FOR G8 AUTHORIZATION
canonical main merge: BLOCKED
public brand launch: BLOCKED
```
