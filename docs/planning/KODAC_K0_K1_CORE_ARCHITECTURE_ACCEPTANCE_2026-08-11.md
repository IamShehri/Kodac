# Kodac K0/K1 Core Architecture Acceptance — 2026-08-11

## Decision

```text
ACCEPT — CORE ARCHITECTURE SUB-GATE
```

Founder direction: proceed to the next authorized architecture step.

Accepted ADRs:

- ADR-0002 — OpenCode as selective runtime substrate
- ADR-0004 — OSS provenance and license gate
- ADR-0005 — canonical Session/Event/Tool protocol
- ADR-0006 — mandatory trust hook for all side effects

Acceptance baseline:

```text
branch: docs/kodac-k0-k1-oss-intake
parent: 48beb394187e9b330b20d94b8506d0e3499b3342
canonical main: c425dca6e9d5474aca50d288064fa56eb21a1b9e
```

## Review conclusion

The four ADRs are mutually consistent and preserve the intended Kodac ownership boundary:

- OpenCode may supply selectively adapted runtime substrate, but not Kodac's public protocol or product identity.
- Third-party source intake remains fail-closed behind exact path-level provenance, license, and dependency review.
- Kodac owns a versioned, language-neutral canonical Session/Event/Tool protocol and donor adapters map inward to it.
- All privileged or state-changing effects must pass through the Kodac ExecutionGateway and Trust Kernel before execution, verification, evidence capture, and receipt emission.

No contradiction was found among these four decisions that blocks their acceptance.

## Non-authorization boundary

This acceptance does **not** authorize third-party source import or K2 runtime implementation.

The following remain true:

```text
code_import_authorized: false
K0/K1 exit gate: not complete
K2 runtime build: not authorized yet
main mutation: not authorized
```

## Remaining K0/K1 architecture queue

The architecture gate document requires the following ADRs before K2 code import:

- ADR-0001 — Kodac Product Constitution: Done means proven
- ADR-0003 — Upstream synchronization policy
- ADR-0007 — Native MCP / ACP / Agent Skills compatibility
- ADR-0008 — TypeScript runtime with optional Rust trusted workers
- ADR-0009 — Kodac Repo Graph architecture
- ADR-0010 — Benchmark-first donor selection

## Remaining non-ADR exit conditions

Before declaring K0/K1 complete, the gate also requires closure of the remaining governance/evidence conditions, including:

- Kodac naming/trademark review;
- main protection strategy ratification;
- donor license/mixed-license subtree records;
- provenance schema existence and validation;
- preservation/migration decision for existing evidence-index work;
- confirmation that no third-party code exists without a provenance record.

## Next authorized action

Draft and review ADR-0001, ADR-0003, ADR-0007, ADR-0008, ADR-0009, and ADR-0010 as one coherent remaining architecture package. Do not import runtime code while that package remains unresolved.
