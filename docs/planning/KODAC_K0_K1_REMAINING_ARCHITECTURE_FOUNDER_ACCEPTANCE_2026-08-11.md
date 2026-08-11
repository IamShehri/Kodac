# Kodac K0/K1 Remaining Architecture Founder Acceptance — 2026-08-11

## Decision

```text
ACCEPT — REMAINING ARCHITECTURE PACKAGE
```

Founder authorization was given in the continuation sequence after the package review returned:

```text
PASS — REMAINING ARCHITECTURE PACKAGE READY FOR FOUNDER ACCEPTANCE
```

## Accepted ADRs

The following ADRs are accepted together:

- ADR-0001 — Kodac Product Constitution: Done Means Proven
- ADR-0003 — Upstream Synchronization Policy
- ADR-0007 — Native MCP, ACP, and Agent Skills Compatibility
- ADR-0008 — TypeScript Runtime with Optional Rust Trusted Workers
- ADR-0009 — Kodac Repo Graph Architecture
- ADR-0010 — Benchmark-First Donor Selection and Superiority Claims

No decision text was changed as part of acceptance. Only each ADR status changed from `Proposed` to `Accepted`.

## Acceptance baseline

```text
repository: IamShehri/Kodac
branch: docs/kodac-k0-k1-oss-intake
pre-acceptance head: 61ccc63413d54e654a262927c809c3acd9c46ddb
canonical main: c425dca6e9d5474aca50d288064fa56eb21a1b9e
```

## Resulting architecture authority

With this action, ADR-0001 through ADR-0010 now contain the accepted architecture decisions required by the K0/K1 architecture package, subject to their individual scope and any future explicitly governed supersession.

The package establishes, among other things:

- `Done means proven` as the product constitution;
- selective OSS reuse behind Kodac-owned canonical boundaries;
- exact provenance and synchronization discipline;
- Kodac-owned session/event/tool semantics;
- a mandatory Trust Kernel path for effectful actions;
- MCP, ACP, and Agent Skills as compatibility boundaries rather than internal truth;
- TypeScript as the primary runtime with optional bounded Rust workers;
- a native evidence-backed Repo Graph;
- benchmark-first donor decisions and superiority claims.

## Non-authorization boundary

This acceptance does **not** authorize K2 source intake or runtime implementation.

The following remain true:

```text
code_import_authorized: false
K0/K1 exit gate: not complete
K2 runtime build: not authorized
main mutation: not authorized
```

## Remaining K0/K1 closure work

Before any donor source import or K2 executable slice, close the remaining governance/evidence conditions:

1. Kodac naming/trademark review.
2. Main protection strategy ratification and implementation plan.
3. Path-level donor license/mixed-license subtree records for the first import slice.
4. Provenance schema validation/enforcement plan.
5. Explicit preservation/migration decision for the existing Kernux evidence-index implementation.
6. Repository scan confirming no unrecorded third-party code in proposed K2 intake paths.

## Next gate

```text
K0/K1 GOVERNANCE AND INTAKE-READINESS CLOSURE
```

Do not begin K2 until that gate explicitly authorizes source intake.
