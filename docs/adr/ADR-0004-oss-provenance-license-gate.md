# ADR-0004: OSS Provenance and License Gate

Status: Proposed
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Kodac intends to combine mature OSS components while remaining maintainable, legally auditable, and attractive for future contributors or diligence. Repository-level license labels are insufficient because monorepos may contain subdirectories, generated code, third-party assets, enterprise editions, or dependencies with different terms.

A technically excellent donor is not eligible for import until its exact source path and dependency closure are reviewed.

## Decision

Every third-party source import, port, or vendored component must pass a **path-level provenance and license gate before entering the Kodac runtime tree**.

`provenance/upstreams.yaml` pins repository baselines. Module-level decisions are recorded separately. Neither file alone authorizes copying code.

## Required intake record

For each imported/adapted source scope, record at minimum:

```yaml
component_id: <stable id>
upstream:
  repository: <owner/name>
  commit: <40-char SHA>
source_paths:
  - <exact path>
destination_paths:
  - <exact Kodac path>
license:
  spdx: <verified SPDX or explicit status>
  source: <license file/path>
  notices_required: <true|false>
  exceptions: []
modification:
  strategy: <copy|adapt|port|vendor>
  summary: <what Kodac changed>
dependencies:
  reviewed: <true|false>
  notes: <dependency closure notes>
verification:
  tests: []
  parity_sources: []
upstream_sync:
  strategy: <manual-reconcile|cherry-pick|vendor-update|none>
  last_reviewed_commit: <SHA>
```

## Default license posture

The following are generally intake-compatible after exact verification and notice handling:

- Apache-2.0
- MIT
- BSD-2-Clause / BSD-3-Clause
- ISC

The following require explicit review before core inclusion because obligations or compatibility may differ by linkage/distribution/path:

- MPL-family
- LGPL-family
- mixed-license monorepos
- generated/vendor bundles with unclear provenance
- enterprise/community split trees

The following are **not eligible for core source copying without explicit founder and legal approval**:

- GPL/AGPL components where proposed use would impose unacceptable obligations;
- SSPL;
- Business Source License or similar source-available restrictions;
- non-commercial or field-of-use restricted licenses;
- code with no license or unclear ownership.

This ADR is an engineering governance rule, not legal advice. Ambiguity fails closed.

## Monorepo and subdirectory rule

A root license does not automatically certify every path.

Before import, inspect:

- nested `LICENSE`, `COPYING`, `NOTICE`, or package metadata;
- headers and generated-file notices;
- submodules;
- vendored directories;
- enterprise folders;
- package dependencies required by the imported path.

## Current donor-specific constraints

- OpenCode: review only exact selected runtime paths and dependency closure.
- Kilo: treat as a monorepo; review each selected package separately.
- Codex OSS: review selected Rust crates and their Cargo dependency closure.
- Cline: use checkpoint mechanics primarily as reference unless an exact import later wins a separate review.
- Aider: RepoMap is currently an algorithm/reference donor; Python source is not authorized for direct import by this ADR.
- Tabby: `ee/` is explicitly excluded from Kodac import consideration; community paths still require exact license confirmation before adaptation.
- PR-Agent: selectively review exact provider/diff/review-plumbing paths if imported.

## Provenance preservation

Do not erase origin through copy-and-paste.

Where source is imported or materially ported, preserve attribution required by license and keep machine-readable provenance sufficient to trace the work back to the exact upstream commit/path.

If a component is reimplemented from behavior/specification rather than source, record the behavioral references and tests used to avoid falsely claiming an independent design.

## CI enforcement target

A future provenance gate should fail CI when:

- a vendored/imported path lacks a provenance record;
- recorded upstream SHA is not a full commit SHA;
- required notice metadata is missing;
- a prohibited/unreviewed license state is present;
- source scope and destination scope no longer match recorded manifests.

## Consequences

Positive:

- auditable donor history;
- safer upstream updates;
- lower diligence risk;
- makes selective OSS reuse sustainable instead of ad hoc.

Costs:

- import work becomes slower than blind copying;
- dependency and license review is required for each new donor scope;
- some attractive upstream code will be rejected or reimplemented.

## Gate

Until this ADR is Accepted and an intake record for the exact module is approved, `code_import_authorized` remains false for that module.
