# KDO-H4-R3F — Requirement Context Reconciliation

Date: 2026-08-16
Status: RECONCILIATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `757451aca25b8cd3f146becc3568a0bb3c41e3ab`
Predecessor: canonical H4-R3F Docker read-only control-plane authorization

## 1. Decision

```text
GATE:
KDO-H4-R3F

CHANGE CLASS:
DOCS-ONLY AUTHORIZATION RECONCILIATION

IMPLEMENTATION:
NOT IN THIS PR

ORIGINAL THREE-PATH IMPLEMENTATION ALLOWLIST:
UNCHANGED

DOCKER MUTATION AUTHORITY:
NONE

R3B PHYSICAL EVIDENCE MINTING:
FORBIDDEN
```

This document closes one authorization-time interface gap discovered before any R3F implementation write.

---

## 2. Gap

Canonical R3F requires Docker inspect values to be compared against the exact R3B/R3A requirement, including:

```text
workload.source.digest
workload.resourcePolicy.cpuMillis
workload.resourcePolicy.memoryBytes
workload.networkPolicy
requiredSemanticRuntimeClass
```

Canonical R3E exposes the resolver callback as:

```text
resolveContainerBinding(
  request: GvisorContainerBindingRequest,
  options: { signal?: AbortSignal }
)
```

and `GvisorContainerBindingRequest` contains only:

```text
version
executionAttemptIdentity
requirementIdentity
workloadIdentity
bindingRequestIdentity
```

It intentionally does **not** carry the complete `SandboxExecutionRequirement`.

Therefore an R3F implementation cannot safely validate Docker manifest/resource/network state against the canonical workload using the callback request alone.

Any implementation that guessed, reconstructed, or omitted those requirement fields would weaken the R3F theorem.

---

## 3. Reconciliation

R3F provider construction must bind exactly one trusted canonical:

```text
SandboxExecutionRequirement
```

before the provider is exposed as an R3E resolver.

Purpose-equivalent trusted configuration:

```text
DockerControlPlaneProviderConfig {
  socketPath
  requirement
}
```

where `requirement` is validated by the canonical R3B validator at provider construction.

This requirement object is trusted-host configuration for the provider instance. It is **not** added to `GvisorContainerBindingRequest`, and it is not caller/model/plugin/MCP input to the resolver call.

---

## 4. Exact request-to-requirement binding

For every resolver call, R3F must validate the incoming `GvisorContainerBindingRequest` and require:

```text
request.requirementIdentity
== configuredRequirement.requirementIdentity

request.workloadIdentity
== configuredRequirement.workload.workloadIdentity

configuredRequirement.requiredSemanticRuntimeClass
== gvisor
```

Any mismatch fails before Docker socket activity.

The configured requirement then supplies the exact expected values used by R3F:

```text
expectedManifestDigest
= configuredRequirement.workload.source.digest

expectedNanoCpus
= configuredRequirement.workload.resourcePolicy.cpuMillis * 1_000_000

expectedMemoryBytes
= configuredRequirement.workload.resourcePolicy.memoryBytes

expectedNetworkMode
= none
```

No requirement field may be derived from Docker responses.

---

## 5. Why one exact requirement, not a generic lookup callback

The first R3F slice intentionally chooses a **single exact requirement bound at provider construction** rather than authorizing an arbitrary requirement-registry callback.

This keeps the slice minimal and avoids introducing a second hidden I/O/authority surface such as:

```text
database lookup
filesystem registry
network requirement service
mutable global registry
caller-controlled resolver
```

A host may create a new bounded R3F provider instance for another requirement.

A future slice may authorize a multi-requirement trusted registry only if needed and only with its own authority/evidence rules.

---

## 6. Public authority remains unchanged

The public R3E request still does not contain:

```text
full requirement object
Docker endpoint
socket path
container ID
container name
Docker filters
HTTP path
HTTP method
```

R3F still creates the final `GvisorContainerBinding` using:

```text
request.executionAttemptIdentity
request.requirementIdentity
request.workloadIdentity
resolved full container ID
fixed/trusted provider ID
```

The execution-attempt identity remains observation-time identity and remains forbidden as a Docker discovery label.

---

## 7. E2 observation result shape

R3F may expose a bounded function that returns both:

```text
{
  binding: GvisorContainerBinding,
  observation: DockerControlPlaneObservation
}
```

and may expose an R3E-compatible adapter that returns only the validated `binding` from that same operation.

Purpose-equivalent API:

```text
resolveDockerControlPlaneBinding(request, options)
-> { binding, observation }

createDockerContainerBindingResolver(config)
-> R3E-compatible resolveContainerBinding callback
```

This permits the deterministic E2 snapshot to remain available to a later authorized conjunction without requiring `ExecutionGateway` changes.

R3F does not require durable persistence of the E2 record in this slice.

---

## 8. No new callback authority

This reconciliation does **not** authorize a generic callback such as:

```text
resolveRequirement(...)
loadRequirement(...)
queryRegistry(...)
```

inside the R3F trusted configuration.

The canonical first implementation binds a validated requirement value directly.

This keeps Docker Unix-socket reads as the only new external I/O authority in R3F.

---

## 9. Implementation allowlist remains unchanged

The canonical R3F pre-ledger allowlist remains exactly:

```text
1. packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
```

This reconciliation adds no fourth implementation path.

The reserved evidence ledger remains:

```text
docs/planning/KODAC_KDO_H4_R3F_DOCKER_READ_ONLY_CONTROL_PLANE_EVIDENCE_2026-08-16.md
```

and remains forbidden until exact-head pre-ledger PASS.

---

## 10. Protected surfaces remain unchanged

R3F still must not modify:

```text
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/*
.github/workflows/*
```

---

## 11. Additional focused proofs required

The future R3F focused suite must additionally prove:

1. configured requirement is validated at provider construction;
2. non-gVisor configured requirement is rejected before Docker activity;
3. incoming R3E request requirement identity mismatch fails before Docker activity;
4. incoming R3E request workload identity mismatch fails before Docker activity;
5. Docker expected manifest/resource/network values come only from the configured validated requirement;
6. no generic requirement lookup/registry callback exists in the R3F production configuration;
7. the R3E-compatible resolver returns the same validated binding produced alongside the E2 observation record.

All original R3F focused proofs remain required.

---

## 12. Exact reconciliation scope

This reconciliation PR is authorized to add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3F_REQUIREMENT_CONTEXT_RECONCILIATION_2026-08-16.md
```

It changes no production/test/schema/workflow/dependency path.

No evidence ledger is needed because this PR implements no runtime theorem.

---

## 13. Review gate

Before canonical merge, exact PR head must prove:

```text
base = exact canonical main 757451aca25b8cd3f146becc3568a0bb3c41e3ab
changed paths = exactly this one reconciliation document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2 regression gate = PASS where triggered
available automated review = no unresolved actionable finding
unavailable/rate-limited reviewer recorded accurately
manual semantic/security review = PASS
0 unresolved actionable review threads
```

---

## 14. Final reconciled R3F interface boundary

```text
R3E REQUEST:
IDENTITIES ONLY

R3F PROVIDER CONSTRUCTION:
ONE EXACT VALIDATED R3B GVISOR REQUIREMENT + TRUSTED UNIX SOCKET

R3F DOCKER DISCOVERY:
REQUIREMENT/WORKLOAD IDENTITY LABELS ONLY

R3F DOCKER EXPECTED POLICY VALUES:
FROM THE CONFIGURED VALIDATED REQUIREMENT ONLY

R3F RESULT:
VALIDATED GVISOR CONTAINER BINDING + E2 DOCKER CONTROL-PLANE OBSERVATION

R3B PHYSICAL EVIDENCE:
NOT MINTED

GATEWAY MUTATION:
NONE

DOCKER MUTATION:
NONE
```

This reconciliation closes the requirement-context gap without widening R3F authority.