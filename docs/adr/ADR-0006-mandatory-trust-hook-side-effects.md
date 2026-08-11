# ADR-0006: Mandatory Trust Hook for Side Effects

Status: Accepted
Date: 2026-08-11
Decision owner: Kodac founder

## Context

A coding agent can mutate files, run commands, access networks and secrets, change Git history, and affect external systems. A permission prompt embedded in one UI or one donor tool is insufficient because alternate surfaces, MCP tools, plugins, CI workers, or future executors could bypass it.

Kodac's trust boundary must therefore be architectural, not conversational.

Codex execpolicy provides useful evidence for explicit allow/prompt/forbidden decisions, justifications, executable identity constraints, self-tested rules, and strictest-wins composition. Kilo and Codex both provide sandbox implementation evidence. Kodac still needs a single mandatory decision path across all backends.

## Decision

Every Kodac capability with privileged or state-changing effects must execute through the following mandatory path:

```text
Intent
  -> Capability registration/check
  -> Policy evaluation
  -> Approval resolution when required
  -> Sandbox/backend selection
  -> Execute
  -> Verify
  -> Evidence capture
  -> Execution Receipt
```

This path is owned by the Kodac `ExecutionGateway` and Trust Kernel.

No CLI, TUI, IDE, plugin, MCP server, workflow, reviewer, or model provider may bypass it.

## Policy result v1

Kodac's canonical policy decision is:

```text
decision: allow | ask | deny
reason: human-readable explanation
rule_refs: zero or more policy rule identifiers
constraints: optional narrowed execution constraints
requested_escalation: optional approval scope
```

A backend's native decision vocabulary must map into this result.

## Composition

When multiple policies apply, the effective decision is the most restrictive unless an explicit, auditable composition rule states otherwise:

```text
deny > ask > allow
```

Policy sources may include:

- Kodac defaults;
- repository policy;
- organization policy;
- user/session policy;
- capability-specific rules;
- sandbox/backend constraints.

The receipt records which policy sources participated.

## Executable identity

For process execution, policy evaluation should bind to executable identity as strongly as the host permits.

Prefer absolute/resolved executable paths and validated executable metadata over basename-only matching where practical. Basename fallback must not silently widen a rule beyond its intended executable.

This is informed by Codex execpolicy's explicit host-executable/path semantics, but Kodac does not adopt the Codex preview rule language as its public policy language.

## Policy rule self-tests

Policy definitions should support positive and negative fixtures analogous to:

- invocations that must match;
- invocations that must not match;
- expected effective decision.

A policy bundle that fails its own fixtures must fail closed rather than load partially.

## Capability registry

Every executable capability declares:

- semantic capability identifier;
- side-effect class(es);
- input schema;
- output schema;
- default policy posture;
- supported sandbox/backends;
- secret/network requirements;
- verification behavior;
- receipt/evidence expectations.

Unregistered privileged tools cannot be executed through the normal agent path.

## Read-only operations

Read-only operations may have a lightweight path, but they are still registered capabilities. Secret access, external reads, or sensitive network reads are not automatically `read_only` merely because they do not mutate the workspace.

## Approval semantics

An approval is scoped, not a global trust switch.

The approval record should identify:

- capability/invocation or bounded pattern being approved;
- workspace/repository scope;
- expiry or session scope;
- constraints applied;
- approver identity where available;
- policy reason that required approval.

“Always allow everything” is not the default escalation mechanism.

## Sandbox boundary

The sandbox enforces execution constraints; it does not decide product authorization.

Kodac can support multiple `SandboxBackend` implementations behind one interface, for example:

- local constrained backend;
- OS-native hardened backend;
- Bubblewrap-based Linux backend;
- container/microVM/remote backend.

Codex and Kilo are donor/reference candidates for backend mechanics. Trust Kernel policy remains canonical.

## Verification and receipts

Successful process exit is not sufficient proof of safe or correct execution.

After execution, the gateway records/verifies as applicable:

- exit status;
- stdout/stderr digests or bounded evidence;
- changed paths;
- Git state delta;
- produced artifacts;
- sandbox/policy identity;
- approval identity;
- verification commands/results;
- timing/resource metadata.

The resulting `ExecutionReceipt` is evidence for review and the Done Gate.

## K2 minimum

The first K2 vertical slice may use a permissive local policy and a simple local backend while the product is founder-controlled, but the structural hook is mandatory from the first executable slice.

That means even a permissive prototype follows:

```text
ExecutionGateway -> PolicyDecision(allow) -> Backend -> Receipt
```

not:

```text
agent -> shell directly
```

## Consequences

Positive:

- trust is consistent across surfaces and providers;
- future hardened sandboxes can replace local execution without rewriting orchestration;
- approvals become auditable;
- Done Gate can reason from receipts rather than model claims.

Costs:

- every privileged tool needs capability metadata;
- some upstream tools require wrappers/adapters;
- policy/sandbox integration adds latency and implementation complexity.

## Rejected alternatives

### UI-only permission prompts

Rejected because headless/CI/plugin/MCP paths could bypass them.

### Sandbox-only security

Rejected because isolation does not answer whether an operation was authorized or why.

### Donor-native permission model as canonical Kodac policy

Rejected because it couples Kodac trust semantics to one upstream implementation and weakens multi-backend portability.
