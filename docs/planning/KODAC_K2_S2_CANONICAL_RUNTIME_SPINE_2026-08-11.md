# Kodac K2-S2 Canonical Runtime Spine — 2026-08-11

## Scope

K2-S2 establishes the first Kodac-owned executable orchestration path above the already verified patch/trust slice.

```text
CLI
  -> RuntimeSession
  -> canonical versioned event protocol
  -> ToolRegistry
  -> RuntimeOrchestrator
  -> ExecutionGateway
  -> PolicyEngine
  -> WorkspaceFileSystem
  -> ReceiptLedger
```

No additional donor source is authorized or imported by this slice.

## Canonical runtime contracts

The following are native Kodac contracts:

- `kodac.event` protocol version 1;
- monotonic per-session event sequencing;
- `RuntimeSession`;
- `ToolRegistry` and canonical tool names;
- `RuntimeOrchestrator`;
- receipt-ledger persistence;
- CLI orchestration and evidence-location reporting.

The first canonical tool is `repo.apply_patch`.

## Human CLI authorization

For this isolated local slice, explicit human invocation of `apply-patch` is represented as an allow policy decision with reason:

```text
human-cli-explicit-apply-patch
```

The mutation still flows through `ExecutionGateway`; the CLI does not bypass policy or the workspace boundary.

## Evidence semantics

A successful CLI run must persist, in order:

```text
session.started
tool.started
intent.created
policy.evaluated
receipt.recorded
tool.completed
session.completed
```

`PROVEN READY` may be printed only after the receipt and final session event are persisted.

Evidence defaults outside the target repository under the user's Kodac evidence directory. Tests may supply an explicit evidence directory.

## Failure semantics

If receipt persistence fails after an allowed mutation, the runtime must not claim proven readiness. `ExecutionUnprovenError` distinguishes successful mutation from missing durable proof.

## Acceptance criteria

K2-S2 is ready for review only if all of the following pass on the exact branch head:

- TypeScript typecheck;
- all K2 runtime tests;
- CLI end-to-end smoke test;
- canonical event ordering assertions;
- patch benchmark hook;
- provenance validation;
- legacy test/ruff governance job.

## Non-authorizations

This slice does not authorize:

- another OpenCode module;
- any Kilo/Codex/Cline/Aider/Tabby/PR-Agent source intake;
- merge to canonical `main`;
- package publication;
- public brand launch.
