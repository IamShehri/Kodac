# Kernux Evidence Index Preservation and Migration Decision — 2026-08-11

## Decision

```text
PRESERVE → QUARANTINE → MIGRATE BY PARITY → RETIRE LEGACY RUNTIME
```

The existing repository is not disposable legacy. Its evidence model already contains useful concepts that directly support Kodac's intended Evidence Catalog and Evidence Router.

## Preserve

Preserve the historical implementation and Git history for:

- `agents/`
- `schema/`
- `matrix/`
- `docs/methodology/`
- `tools/`
- associated tests and evidence records

The current README documents useful semantics including field-level evidence, content digests, verification methods, freshness windows, and explicit `verified`, `vendor-reported`, `unknown`, and `disputed` states.

## Quarantine

Legacy product/runtime assumptions must not become canonical Kodac runtime truth.

In particular:

- current Python package metadata remains legacy until migration;
- `nexusmcp/omni-bridge/` is excluded from K2 runtime intake and treated as a quarantined historical prototype until its origin/license/provenance is independently established;
- old architecture/decision documents remain historical evidence and do not supersede accepted `docs/adr/ADR-0001..0010`.

## Migration target

The useful evidence concepts will migrate behind a dedicated Kodac-owned `EvidenceCatalog` boundary.

Target capabilities include:

```text
source identity
content digest
claim status
verification method
freshness
conflict/dispute state
benchmark/run evidence
outcome evidence
model/agent/skill/component identity
```

## Parity rule

Do not delete or rewrite the old evidence system first.

Migration sequence:

1. define the new Evidence Catalog schema/contracts;
2. create conversion fixtures from existing OpenCode profile evidence;
3. prove semantic parity for preserved fields;
4. migrate deterministic validation tests;
5. only then freeze/relocate the legacy Python tooling;
6. retain historical Git provenance.

## Non-goals

This decision does not authorize:

- carrying the old Python application architecture into the new runtime;
- reusing `nexusmcp/omni-bridge` as a trusted gateway;
- deleting old evidence because Kodac changed product direction;
- treating vendor-reported evidence as independently verified.

## Result

The old Kernux work becomes an asset feeding Kodac's evidence moat rather than a competing product architecture.
