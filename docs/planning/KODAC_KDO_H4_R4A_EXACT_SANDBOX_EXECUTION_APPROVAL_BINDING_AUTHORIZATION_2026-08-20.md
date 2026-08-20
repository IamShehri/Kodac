# KDO-H4-R4A — Exact Sandbox Execution Approval Binding Authorization

Date: 2026-08-20
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY / NO PRODUCT IMPLEMENTATION**
Repository: `TheHalfMoon/Kodac`
Canonical base: `e6d42797f14501ae02693d7f5c8d48f79704a6d7`
Canonical base tree: `0dd6517dbb0ab1610fe28f4e3397d4c42791304a`
Predecessors: canonical H4-R1 one-shot approval, H4-R3A content-addressed workload identity, H4-R3B execution requirement, H4-R3G-F bounded E4 physical proof, and canonical post-R3G-F H4 closure-gap audit

---

## 1. Decision

```text
GATE:
KDO-H4-R4A

NAME:
EXACT SANDBOX EXECUTION APPROVAL BINDING CONTRACT

CHANGE CLASS:
DOCS ONLY / AUTHORIZATION / NO EXECUTION

TARGET:
PURE / INERT STRUCTURAL BRIDGE BETWEEN H4-R1 ONE-SHOT APPROVAL AND THE EXACT H4-R3B SANDBOX EXECUTION REQUIREMENT

R4A PRODUCT CODE:
NOT AUTHORIZED UNTIL THIS DOCUMENT IS CANONICAL

PROCESS EXECUTION AUTHORITY:
NONE

DOCKER AUTHORITY:
NONE

NETWORK AUTHORITY:
NONE

FILESYSTEM READ/WRITE AUTHORITY:
NONE

APPROVAL SERVICE INVOCATION AUTHORITY:
NONE

APPROVAL EVIDENCE PERSISTENCE AUTHORITY:
NONE

R3G-F E4 MINTING AUTHORITY:
NONE

GENERIC EXTERNAL runCommand ASK:
REMAINS BLOCKED

H4 COMPLETE:
NO — NOT BY R4A CONTRACT ALONE

H4-SPECIFIC H6 BLOCKER:
NOT CLEARED BY R4A CONTRACT ALONE

H6 AUTHORIZED:
NO

NEXT AFTER CANONICAL R4A AUTHORIZATION:
R4A PURE CONTRACT IMPLEMENTATION ONLY
```

R4A closes one structural ambiguity and nothing more:

```text
Which exact sandbox execution requirement did this H4-R1 one-shot approval request refer to?
```

The answer must be reconstructable, deterministic apart from the already-canonical one-shot request instance identifier, fail-closed, and independent of caller interpretation.

R4A does not launch a workload, call the approval service, persist asked/decided evidence, consume an `allowed-once`, or prove physical execution.

---

## 2. Why this slice exists

Canonical post-R3G-F H4 closure-gap audit:

```text
docs/planning/KODAC_KDO_H4_POST_R3G_F_CLOSURE_GAP_AUDIT_2026-08-20.md
```

establishes that the remaining decisive H4 seam is:

```text
ONE-SHOT PRE-EXECUTION APPROVAL
<->
EXACT CONTENT-ADDRESSED SANDBOX EXECUTION REQUIREMENT / WORKLOAD
```

R3G-F now proves a complete bounded Linux + Docker + gVisor physical theorem as E4, but its gateway intentionally blocks `ask`.

Therefore:

```text
POST-ADMISSION E4 PHYSICAL PROOF
!=
PRE-EXECUTION ONE-SHOT AUTHORIZATION
```

The first safe repair is not an active gateway change. It is a strict structural bridge proving that an H4-R1 approval request can be bound to one exact canonical H4-R3B `SandboxExecutionRequirement` with no generic command ambiguity.

---

## 3. Canonical predecessor contracts inspected

### 3.1 H4-R1 one-shot approval

Canonical source:

```text
packages/kodac-runtime/src/trust/approval.ts
```

Canonical version identities:

```text
KDO_H4_R1_APPROVAL_VERSION = kodac-h4-r1-one-shot-approval-v1
KDO_H4_R1_EVIDENCE_COMMIT_VERSION = kodac-h4-r1-approval-evidence-commit-v1
```

Canonical closed outcome vocabulary:

```text
allowed-once
rejected
cancelled
unavailable
```

Canonical `ApprovalRequest` binds:

```text
version
requestIdentity
requestInstanceId
intent.capability
intent.paths
intent.inputDigest
```

`requestIdentity` is derived from the canonical intent, while `requestInstanceId` distinguishes each one-shot occurrence.

R4A must preserve this contract rather than create a parallel approval decision vocabulary.

### 3.2 H4-R3A content-addressed sandbox workload

Canonical source:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
```

Canonical workload structure binds:

```text
source.repository
source.digest
source.sourceIdentity
entrypoint.executable
entrypoint.args
entrypoint.entrypointIdentity
resourcePolicy.cpuMillis
resourcePolicy.memoryBytes
resourcePolicy.ttlMs
resourcePolicy.maxOutputBytes
resourcePolicy.resourcePolicyIdentity
networkPolicy.mode
networkPolicy.networkPolicyIdentity
confinement
executionIntentIdentity
workspaceIdentity
confinementRequestIdentity
credentialBindingIdentity = null
workloadIdentity
```

R4A must consume the canonical validator-produced workload through R3B, not reconstruct a weaker workload shape.

### 3.3 H4-R3B exact sandbox execution requirement

Canonical source:

```text
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
```

Canonical version:

```text
KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION = kodac-h4-r3b-execution-requirement-v1
```

Canonical `SandboxExecutionRequirement` binds:

```text
workload
requiredSemanticRuntimeClass
downgradePolicy = forbid
requirementIdentity
```

The canonical requirement identity already derives from workload identity plus exact source digest, confinement/execution-intent lineage, network/resource identities and values, credential binding, semantic runtime class and downgrade policy.

R4A must not define a weaker substitute for `requirementIdentity`.

### 3.4 H4-R3G-F final physical proof

Canonical R3G-F implementation remains separate and downstream.

R4A grants no authority to mint, validate as trusted provenance, or persist R3G-F E4 evidence.

---

## 4. R4A v1 theorem

A valid R4A binding may claim only:

```text
For one exact canonical SandboxExecutionRequirement and one exact H4-R1
ApprovalRequest instance, the approval request's canonical ExecutionIntent is
provably the R4A sandbox-execution intent derived from that requirement, so any
change to the admitted requirement/workload theorem invalidates the binding.
```

The theorem includes no claim that:

- the approval service was called;
- the request was shown to a human;
- the decision was `allowed-once`;
- asked/decided evidence was persisted;
- the one-shot grant was consumed;
- a process/container was launched;
- confinement was physically enforced;
- R3G-F E4 was produced;
- H4 is complete;
- H6 may begin.

---

## 5. Fixed R4A approval intent namespace

R4A v1 shall introduce one fixed structural capability identifier purpose-equivalent to:

```text
runtime.execute.sandbox
```

Recommended exact constant:

```text
KDO_H4_R4A_CAPABILITY = "runtime.execute.sandbox"
```

This string is a **structural approval-intent namespace only** in R4A.

Creating/exporting the constant MUST NOT:

- register a tool;
- add a gateway method;
- authorize a process launch;
- add Docker/K2 mutation authority;
- change generic `runCommand` behavior;
- make `ask` executable.

Only a later independently authorized active integration may attach execution semantics to this capability.

---

## 6. Canonical R4A approval intent

R4A shall define a deterministic helper purpose-equivalent to:

```text
createSandboxExecutionApprovalIntent(requirement)
```

It MUST first validate the complete canonical `SandboxExecutionRequirement` using the existing R3B validator.

Its resulting H4-R1-compatible `ExecutionIntent` MUST be exactly:

```text
capability = runtime.execute.sandbox
paths = []
inputDigest = R4A domain-separated digest of the exact canonical requirement theorem
```

`paths = []` is intentional. The authority term is the content-addressed sandbox requirement, not a caller-selected host filesystem path.

R4A MUST NOT place an image tag, executable path, Docker container ID, PID, cgroup path, socket path or runtime root into `paths` as approval authority.

---

## 7. Required approval-intent digest preimage

The R4A input digest must be deterministic and domain-separated.

The implementation authorization should use an explicit ordered preimage rather than an object whose identity can accidentally change with property insertion order.

The preimage MUST bind at least the following canonical validated terms in semantic order:

```text
R4A contract version
R3B requirement version
requirementIdentity
R3A workload version
workloadIdentity
source.sourceIdentity
source.digest
entrypoint.entrypointIdentity
resourcePolicy.resourcePolicyIdentity
networkPolicy.networkPolicyIdentity
confinementRequestIdentity
executionIntentIdentity
workspaceIdentity
requiredSemanticRuntimeClass
downgradePolicy
credentialBindingIdentity
```

A recommended purpose-equivalent digest is:

```text
SHA-256(
  "KODAC-H4-R4A\0SANDBOX_APPROVAL_INTENT\0V1\0"
  || canonical JSON ordered array of the terms above
)
```

The exact implementation may include additional canonical version terms for defense-in-depth, but it MUST NOT omit any identity-bearing semantic family listed above.

---

## 8. Why requirementIdentity alone is not the only serialized term

Cryptographically, canonical `requirementIdentity` already commits to the relevant R3B theorem.

R4A nevertheless carries/revalidates the underlying identity families because the contract is intended to be:

- inspectable;
- self-checking;
- future-proof against accidental predecessor-contract drift;
- useful as evidence of *which* semantic family was approved, not only that one opaque digest matched.

The underlying canonical validators remain authoritative. R4A MUST NOT recompute predecessor identities with a divergent algorithm.

---

## 9. ApprovalRequest correspondence

R4A shall define a strict validator/builder purpose-equivalent to:

```text
createSandboxExecutionApprovalBinding(requirement, approvalRequest)
validateSandboxExecutionApprovalBinding(value)
```

The binding MUST verify all of the following:

```text
approvalRequest.version == KDO_H4_R1_APPROVAL_VERSION
approvalRequest.intent.capability == KDO_H4_R4A_CAPABILITY
approvalRequest.intent.paths == [] exactly
approvalRequest.intent.inputDigest == expected R4A approval-intent digest
approvalRequest.requestIdentity == exact H4-R1 canonical request identity rederived from the canonical intent
approvalRequest.requestInstanceId is present as the exact one-shot occurrence identifier
```

R4A MUST NOT mint, replace or reinterpret the H4-R1 request instance after approval.

The binding MUST preserve the exact `requestInstanceId` supplied by the canonical H4-R1 request occurrence.

---

## 10. R4A binding record

The authorized product implementation should define one immutable structural record purpose-equivalent to:

```text
SandboxExecutionApprovalBinding
```

It should contain at minimum:

```text
version
requirementIdentity
workloadIdentity
sourceIdentity
sourceDigest
entrypointIdentity
resourcePolicyIdentity
networkPolicyIdentity
confinementRequestIdentity
executionIntentIdentity
workspaceIdentity
requiredSemanticRuntimeClass
downgradePolicy
credentialBindingIdentity
approvalCapability
approvalInputDigest
approvalRequestIdentity
approvalRequestInstanceId
bindingIdentity
```

The record MUST NOT contain:

```text
approval outcome
approval service callback
approval service object
approval evidence sink
process handle
Docker client/socket
PID
container ID
runtime root
cgroup path
network endpoint
credential secret
R3G evidence bundle
mutable user-facing permission state
```

An approval outcome belongs to H4-R1 decision/evidence and a later active integration, not to the R4A binding theorem.

---

## 11. Binding identity

`bindingIdentity` MUST be deterministic for the exact requirement + exact approval request occurrence.

It MUST change if any of the following change:

```text
requirementIdentity
workloadIdentity
source digest/source identity
entrypoint identity
resource policy identity
network policy identity
confinement request identity
execution intent identity
workspace identity
required semantic runtime class
downgrade policy
credential binding
approval capability
approval input digest
approval request identity
approval request instance id
R4A contract version
```

Recommended purpose-equivalent domain:

```text
KODAC-H4-R4A\0SANDBOX_APPROVAL_BINDING\0V1\0
```

Use an explicit ordered preimage.

---

## 12. H4-R1 semantics remain authoritative

R4A MUST reuse the canonical H4-R1 outcome vocabulary unchanged:

```text
allowed-once
rejected
cancelled
unavailable
```

R4A MUST NOT introduce or imply:

```text
allow-always
remembered approval
wildcard approval
session-wide grant
repository-wide grant
model-authored approval
provider-authored approval
background approval
approval by physical proof
```

R4A is not permitted to modify `approval.ts` in its first implementation.

---

## 13. Substitution matrix — all must fail closed

A binding MUST become invalid if an attacker or caller substitutes any of these while preserving unrelated fields:

```text
OCI repository
OCI digest
source identity
entrypoint executable
entrypoint args
entrypoint identity
CPU limit
memory limit
TTL
max output bytes
resource-policy identity
network mode/policy identity
confinement request or its identity
workspace identity
execution-intent identity
required semantic runtime class
downgrade policy
credential binding
approval capability
approval input digest
approval request identity
approval request instance id
```

Recomputing only the outer `bindingIdentity` MUST NOT rescue a semantically inconsistent inner structure.

Validation must rederive predecessor identities via canonical validators first.

---

## 14. Hostile JavaScript structures

R4A is a trust-boundary structural contract.

Its validators must fail closed on hostile input without executing caller hooks, including:

```text
Proxy objects
accessors/getters/setters
symbol fields
non-enumerable hidden fields
explicit undefined fields
non-plain prototypes
sparse arrays where arrays are accepted
unexpected keys
```

The implementation may reuse the established strict-validator pattern used by R3A/R3B/R3G-F.

Accepted nested values must be detached/frozen or validator-produced immutable canonical objects so caller mutation after validation cannot change the approved theorem.

---

## 15. Bounds

R4A should add no large free-form text surface.

The contract must reuse predecessor bounds for repository, executable, args and resource values through canonical R3A/R3B validators.

New R4A-only string terms should be fixed constants or bounded identities.

The implementation must reject malformed identities and unbounded serialized structures rather than truncate them.

No truncation may change approval meaning.

---

## 16. Public API boundary

The first R4A implementation may root-export only pure/inert contract surfaces purpose-equivalent to:

```text
KDO_H4_R4A_VERSION
KDO_H4_R4A_CAPABILITY
createSandboxExecutionApprovalIntent
createSandboxExecutionApprovalBinding
validateSandboxExecutionApprovalBinding
SandboxExecutionApprovalBinding type
```

It MUST NOT root-export:

```text
approval service authority
approval evidence sink authority
process launch callbacks
Docker/runtime providers
mutable registries
generic host read/write functions
R3G predecessor resolver factories
```

---

## 17. Authorized implementation paths

After this authorization is canonical, the first R4A product PR is authorized to change only purpose-equivalent paths within this exact narrow set:

```text
A packages/kodac-runtime/src/trust/sandbox-execution-approval-binding.ts
M packages/kodac-runtime/src/index.ts
A schema/kdo-h4-r4a-sandbox-execution-approval-binding.schema.json
A packages/kodac-runtime/test/kdo-h4-r4a-exact-sandbox-approval-binding.test.ts
```

A later evidence-ledger commit may additionally add:

```text
A docs/planning/KODAC_KDO_H4_R4A_EXACT_SANDBOX_EXECUTION_APPROVAL_BINDING_EVIDENCE_2026-08-20.md
```

No other product/runtime path is authorized by R4A without a separate correction/authorization.

---

## 18. Protected surfaces

The first R4A implementation MUST preserve these authority surfaces unless a separate explicit correction authorizes otherwise:

```text
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/trust/policy.ts
packages/kodac-runtime/src/trust/confinement.ts
packages/kodac-runtime/src/trust/confinement-runtime.ts
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-physical-conjunction-gvisor.ts
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
```

Tests should pin byte identity of the most authority-sensitive protected surfaces where repository practice makes that feasible.

R4A must depend on canonical contracts; it must not rewrite them to make the bridge easier.

---

## 19. Production import boundary

The R4A product module should remain pure and local.

Expected production imports are limited to purpose-equivalent deterministic/validation dependencies such as:

```text
node:crypto
node:util
./approval.ts
./sandbox-backend-evidence.ts
```

Importing process/network/filesystem/Docker/runtime execution modules into the R4A contract is not authorized.

No new package dependency is authorized.

---

## 20. Schema requirements

The published R4A JSON Schema must mirror the serialized binding record and remain structurally closed.

It must not pretend regex/character `maxLength` proves runtime UTF-8 byte bounds where runtime validators enforce byte limits.

Schema acceptance is not trusted approval provenance; it is only structural interoperability.

The schema MUST NOT encode an `allowed-once` result as if the binding itself were a decision.

---

## 21. Required focused tests

The R4A implementation gate must include focused tests proving at least:

1. exact canonical requirement + exact H4-R1 approval request produces a deterministic binding for that request instance;
2. repeated binding of the same requirement/request pair yields the same `bindingIdentity`;
3. a new H4-R1 request instance for the same intent produces a different binding identity;
4. approval intent capability is exactly the fixed R4A namespace;
5. approval intent `paths` is exactly empty;
6. approval input digest changes when any admitted requirement/workload semantic term changes;
7. approval request identity is independently rederived and mismatch fails closed;
8. request-instance substitution fails closed;
9. OCI digest/source substitution fails closed;
10. entrypoint executable/args substitution fails closed;
11. CPU/memory/TTL/output substitution fails closed;
12. network/confinement/workspace/execution-intent substitution fails closed;
13. runtime-class/downgrade/credential substitution fails closed;
14. recomputed outer binding identity cannot rescue stale/forged predecessor identity;
15. Proxy/accessor/symbol/hidden/undefined hostile shapes fail closed without executing hooks;
16. returned structures are immutable/detached;
17. JSON Schema matches the strict serialized contract;
18. R4A product source contains no process/network/filesystem/Docker execution authority;
19. protected H4/K2/Done-Gate surfaces remain unchanged;
20. generic external `runCommand` ASK remains blocked/unmodified.

---

## 22. Required fixed-vector tests

The implementation must publish deterministic fixed vectors for at least:

```text
canonical approval input digest
canonical approval request identity for a fixed test request-instance value
canonical R4A binding identity
```

Because H4-R1 production request creation uses a fresh `requestInstanceId`, fixed-vector tests may use a test-only structurally valid fixed request object whose request identity is independently rederived using the canonical H4-R1 algorithm.

The production R4A API MUST NOT allow callers to choose the trusted live request instance on behalf of H4-R1.

---

## 23. No approval-service execution in R4A

This is a hard boundary.

The R4A product module and focused test must prove that the module has no authority to invoke:

```text
ApprovalService.decide
ApprovalEvidenceSink.commit
```

The contract may accept the immutable structural `ApprovalRequest` as data and validate its correspondence to the requirement.

Calling the approval service belongs to a later active integration authorization.

---

## 24. No workload launch/admission in R4A

R4A must not call or import a surface that can:

```text
spawn a process
invoke Docker
attach to output
arm TTL
read cgroups/proc/runtime sockets
resolve a live container subject
mint E4
write workspace state
```

This keeps the first closure seam independently reviewable.

---

## 25. Future active integration boundary

A later purpose-equivalent H4-R4B may be considered only after R4A is canonical and proven.

R4B would be the first place to consider active ordering such as:

```text
construct exact canonical SandboxExecutionRequirement
-> derive exact R4A approval intent
-> create one H4-R1 ApprovalRequest
-> create/validate R4A binding
-> durably commit H4-R1 asked evidence
-> invoke approval service
-> validate exact decision
-> durably commit decided evidence
-> if and only if allowed-once: revalidate exact binding/requirement
-> enter a separately authorized fixed trusted sandbox execution/admission path
```

R4A authorizes none of this active behavior.

---

## 26. One-shot consumption requirement for future integration

R4A records the exact one-shot request occurrence so future R4B can prove grant continuity.

Future active integration must ensure:

```text
one allowed-once decision
-> one exact approved sandbox admission/execution attempt at most
```

A second execution attempt, retry after uncertain mutation, different workload, or different requirement must not silently reuse the same approval.

How active consumption is durably represented is **not decided by R4A** and requires R4B authorization.

---

## 27. Cancellation boundary for future integration

R4A itself has no asynchronous authority.

Future active integration must preserve canonical H4-R1 cancellation semantics and must recheck cancellation between durable decision evidence and any side effect.

R4A must not pre-decide a cancellation algorithm for process/Docker mutation.

---

## 28. Relationship to R3G-F E4

R4A is upstream authorization identity; R3G-F is downstream physical proof.

The required conceptual ordering for a future complete bounded path is:

```text
R4A exact approval binding
-> H4-R1 durable one-shot decision
-> trusted admitted execution path
-> R3 physical/evidence chain
-> R3G-F E4 durable conjunction
```

Forbidden:

```text
E4 -> retroactive approval
approval -> manufacture E4
binding -> claim approval outcome
binding -> launch process
```

---

## 29. H4/H6 status after R4A authorization

Canonicalizing this authorization alone means only:

```text
R4A PURE CONTRACT IMPLEMENTATION MAY BEGIN
```

It does **not** mean:

```text
H4 COMPLETE
H4-SPECIFIC H6 BLOCKER CLEARED
H6 READY
H6 AUTHORIZED
```

Those decisions require evidence from the R4A implementation and later active approval/execution integration.

---

## 30. Implementation evidence gate

The future R4A implementation must not become canonical merely because TypeScript compiles.

Before merge it requires one exact final head with:

```text
changed paths within R4A allowlist only
focused R4A tests = PASS
full runtime suite = PASS
cross-platform generic suite = PASS subject to canonical platform skips
governance/provenance/legacy = PASS
schema parity = PASS
production purity = PASS
protected authority surfaces = unchanged
manual architecture/trust/security review = PASS
fresh independent exact-head review = PASS
unresolved actionable review threads = 0
```

If an evidence ledger is added after a pre-ledger candidate passes, the ledger-bearing head requires fresh post-ledger exact-head certification according to canonical repository practice.

---

## 31. Authorization PR merge gate

This authorization PR itself must remain docs-only:

```text
BASE:
e6d42797f14501ae02693d7f5c8d48f79704a6d7

CHANGED PATHS:
exactly this one authorization document

RUNTIME SOURCE CHANGES:
0

TEST CHANGES:
0

WORKFLOW CHANGES:
0

DEPENDENCY CHANGES:
0

governance / provenance / legacy:
PASS

FRESH INDEPENDENT EXACT-HEAD REVIEW:
PASS

UNRESOLVED ACTIONABLE REVIEW THREADS:
0

EXPECTED-HEAD MERGE:
REQUIRED
```

---

## 32. Final authorization decision

```text
H4-R4A AUTHORIZATION:
CANDIDATE — BECOMES EFFECTIVE ONLY WHEN THIS DOCUMENT IS CANONICAL

AUTHORIZED FIRST IMPLEMENTATION:
PURE / INERT EXACT SANDBOX EXECUTION APPROVAL BINDING CONTRACT ONLY

GENERIC EXTERNAL COMMAND ASK:
STILL BLOCKED

ACTIVE APPROVAL SERVICE INTEGRATION:
NOT AUTHORIZED

WORKLOAD LAUNCH/ADMISSION:
NOT AUTHORIZED

R3G-F E4 AUTHORITY:
UNCHANGED

H4 COMPLETE:
NO

H4-SPECIFIC H6 BLOCKER:
NOT CLEARED

H6:
NOT AUTHORIZED

EXPECTED NEXT AFTER R4A PROOF:
SEPARATE H4-R4B ACTIVE ONE-SHOT APPROVAL / EXACT SANDBOX ADMISSION INTEGRATION AUTHORIZATION
```

Status:

```text
KDO_H4_R4A_EXACT_SANDBOX_EXECUTION_APPROVAL_BINDING_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
