# ADR-0005: Kodac Canonical Session, Event, and Tool Protocol

Status: Accepted
Date: 2026-08-11
Decision owner: Kodac founder

## Context

OpenCode, Kilo, Cline, Codex, IDE extensions, MCP servers, CI workers, and future remote executors each have their own session, event, and tool shapes. If Kodac exposes any donor's internal representation as its public API, that donor becomes an architectural lock-in point.

Kodac also needs deterministic evidence and execution receipts. That requires stable identifiers and causal links across planning, routing, tool invocation, policy decisions, execution, review, and completion.

## Decision

Kodac will define a **versioned, language-neutral canonical protocol** for sessions, events, tools/capabilities, artifacts, policy decisions, and receipts.

TypeScript is the first generated/native runtime representation, but TypeScript-specific types are not the wire contract.

Donor runtimes map into Kodac protocol through adapters.

## Identity model

At minimum:

- `SessionId` — durable user/task conversation or automation session.
- `TurnId` — one user/system turn inside a session.
- `RunId` — one orchestrated execution attempt; retries create new RunIds.
- `InvocationId` — one capability/tool invocation.
- `ArtifactId` — a produced or observed artifact.
- `ReceiptId` — one execution receipt.
- `FindingId` — one review finding.

Identifiers must be globally unique within a Kodac installation and stable enough for evidence linking.

## Event envelope v1

Canonical events carry at minimum:

```text
version
id
session_id
turn_id?
run_id?
sequence
timestamp
kind
actor
payload
causation_id?
correlation_id?
evidence_refs[]
```

Rules:

1. `sequence` is monotonic within the chosen session/run stream.
2. `timestamp` is observability metadata, not the sole ordering mechanism.
3. `causation_id` identifies the direct event/invocation that caused the event when known.
4. `correlation_id` groups distributed work belonging to a higher-level operation.
5. Payload schemas are versioned by event kind.
6. Unknown future event kinds must not corrupt prior event history.

## Capability/tool invocation v1

Canonical invocation intent contains:

```text
invocation_id
session_id
run_id
capability
implementation_tool
input
side_effect_class
workspace_scope
policy_context
requested_sandbox
limits
```

`capability` is the stable semantic operation. `implementation_tool` identifies the selected backend/tool and may change without changing the capability contract.

Examples:

- capability: `repo.read_file`; implementation: local filesystem tool
- capability: `code.apply_patch`; implementation: Kodac TS patch backend
- capability: `process.exec`; implementation: local sandbox backend
- capability: `pr.comment`; implementation: GitHub provider adapter

## Side-effect classification

Initial classes:

- `read_only`
- `workspace_mutation`
- `process_exec`
- `network_access`
- `git_mutation`
- `external_mutation`
- `secret_access`

A capability may declare more than one class where required. Classification is policy input, not a UI label.

## Invocation result v1

Canonical results contain at minimum:

```text
invocation_id
status
output
artifacts[]
diagnostics[]
started_at
finished_at
resource_usage?
cost?
evidence_refs[]
receipt_id?
```

`status` must distinguish successful execution from policy denial, approval refusal, timeout, cancellation, tool failure, verification failure, and protocol failure.

## Artifact contract

Artifacts may represent:

- files/diffs/patches;
- test or build reports;
- command output;
- benchmark evidence;
- review findings;
- PR metadata;
- checkpoints;
- execution receipts.

Every artifact should carry a content digest when a stable byte representation exists.

## Adapter boundary

OpenCode and other donors may retain their internal event/session structures inside their adapter implementation.

The public boundary is:

```text
Surface / SDK / plugin / CI
           |
           v
Kodac Canonical Protocol
           |
           v
Adapter -> donor/native implementation
```

No external Kodac client should need an OpenCode internal session type to operate Kodac.

## Compatibility policy

- Protocol major versions are explicit.
- Additive optional fields may remain compatible within a major version.
- Semantically breaking changes require a new major version or explicit migration.
- Persisted event streams record the protocol version used when written.
- Adapters have compatibility tests against canonical fixtures.

## Evidence and receipt linkage

The protocol must make it possible to prove:

- which plan step requested an invocation;
- which router decision selected a tool/model/backend;
- which policy decision authorized or denied it;
- what executed;
- what artifacts changed;
- what verification ran;
- what evidence supported completion.

This requirement is why IDs and causal links are canonical rather than donor-specific.

## Consequences

Positive:

- prevents donor lock-in;
- supports CLI/TUI/IDE/CI with one runtime truth;
- supports replay/debugging and execution receipts;
- enables Rust or remote workers without changing surface APIs.

Costs:

- adapter code is mandatory;
- Kodac must maintain schemas and migrations;
- some donor features may need normalization before surfacing.

## Deferred

Exact serialization format, schema tooling, and transport are deferred to the protocol implementation slice. JSON/JSON-Schema or equivalent human-inspectable fixtures should exist even if a more efficient transport is later added.
