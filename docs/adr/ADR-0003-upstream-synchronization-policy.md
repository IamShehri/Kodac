# ADR-0003: Upstream Synchronization Policy

Status: Accepted
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Kodac will selectively reuse and adapt multiple OSS projects. Blindly merging upstream branches would turn Kodac into a patch stack over foreign product architectures, while freezing forever on one snapshot would accumulate security and maintenance debt.

Kodac therefore needs an explicit synchronization policy that preserves provenance, canonical Kodac boundaries, and the ability to adopt upstream improvements without surrendering architecture ownership.

## Decision

All third-party intake is **pin-first, path-scoped, test-gated, and manually reconcilable**.

There is no standing authorization to merge an upstream branch into Kodac.

## Synchronization modes

Each imported/adapted component declares exactly one primary mode:

- `manual-reconcile` — preferred default for adapted source;
- `vendor-update` — replace a vendored component with a reviewed newer snapshot;
- `cherry-pick` — allowed only for isolated commits whose dependency closure is understood;
- `package-update` — use normal package-manager updates for external dependencies;
- `behavioral-reimplementation` — no source sync; compare behavior/tests against newer upstream references;
- `frozen` — intentionally no updates until a new architecture decision.

## Required update record

Every synchronization change records:

```text
component_id
current_upstream_sha
candidate_upstream_sha
source_paths
destination_paths
upstream_diff reviewed
license/provenance rechecked
Kodac-local modifications affected
compatibility tests
security impact
benchmark impact
new upstream baseline
```

## Update workflow

```text
Discover upstream change
        ↓
Diff pinned baseline → candidate
        ↓
Classify relevance
        ↓
Review license/dependency closure
        ↓
Reconcile behind Kodac adapter
        ↓
Run parity + Kodac invariant tests
        ↓
Run affected benchmarks
        ↓
Update provenance record
        ↓
Review/merge as ordinary Kodac change
```

No automated bot may update donor source directly on `main`.

## Kodac-local modifications

Imported code must not become an untracked patch pile.

For every adapted component, Kodac must be able to identify:

- unchanged upstream-derived code;
- Kodac modifications;
- Kodac adapter code;
- behavior intentionally diverged from upstream;
- parity fixtures used to detect accidental drift.

Where practical, prefer wrapping/adapting donor modules over editing them deeply.

## Security updates

A security-relevant upstream change may be expedited, but it does not bypass provenance or verification. Emergency intake may reduce benchmark breadth, but it must still record exact source identity, license, affected dependency closure, and security rationale.

## Protocol/specification updates

MCP, ACP, Agent Skills, SCIP, benchmark suites, and other standards/references are versioned independently from source donors.

Kodac must record the supported protocol/specification version or pinned reference commit and must not silently change behavior merely because an upstream default branch moved.

## Upstream contribution

When a Kodac fix is generic and upstream-compatible, contributing it upstream is preferred to maintaining permanent divergence, provided doing so does not expose Kodac-private information or weaken Kodac differentiation.

Kodac-native IP remains in Kodac-owned layers rather than hidden as invasive patches inside donor modules.

## Gate

A donor update is merge-eligible only when its provenance record, compatibility tests, and required benchmarks are updated together. Upstream freshness alone is never sufficient justification.
