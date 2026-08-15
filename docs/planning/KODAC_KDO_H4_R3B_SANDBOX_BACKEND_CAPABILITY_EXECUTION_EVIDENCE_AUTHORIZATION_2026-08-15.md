# KDO-H4-R3B — Sandbox Backend Capability and Execution Evidence Contract Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H4-R3B

NAME:
SANDBOX BACKEND CAPABILITY AND EXECUTION EVIDENCE CONTRACT

CANONICAL BASE:
b8281d08f91232cc2271ab7109fb2701ddd429a0

CANONICAL BASE TREE:
21166c7ae7fd1e43b8ba298f6c70d38b7305f5ab

IMPLEMENTATION AUTHORITY IF THIS DOCUMENT BECOMES CANONICAL:
ONE PURE / INERT PROVIDER-NEUTRAL BACKEND REQUIREMENT / CAPABILITY / OBSERVATION / EVIDENCE CONTRACT

EXECUTION AUTHORITY:
NONE

DOCKER / KUBERNETES / OPENSANDBOX SERVER / SDK / DEPENDENCY:
NOT AUTHORIZED

NETWORK / FILESYSTEM / CHILD PROCESS / REGISTRY CALL:
NOT AUTHORIZED

BACKEND INSPECTION:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6:
NOT AUTHORIZED
```

R3B closes one structural prerequisite only:

```text
A FUTURE SANDBOX BACKEND ADAPTER MUST HAVE A CONTENT-IDENTITY-BOUND,
FAIL-CLOSED WAY TO EXPRESS WHAT K2 REQUIRED, WHAT A BACKEND CLAIMS TO
SUPPORT, WHAT A TRUSTED OBSERVER ACTUALLY OBSERVED, AND WHETHER THOSE
FACTS MATCH — WITHOUT TREATING REQUESTED CONFIGURATION OR "RUNNING"
STATUS AS ENFORCEMENT PROOF.
```

R3B does not create, start, inspect, stop, or mutate any sandbox.

---

## 2. Why R3B exists

Canonical H4-R3A proves:

```text
KODAC_CONTENT_ADDRESSED_SANDBOX_WORKLOAD_IDENTITY_CONTRACT_PROVEN
```

The R3A workload is self-contained and binds:

- immutable OCI `sha256:<64 lowercase hex>` source digest;
- absolute canonical entrypoint + args;
- resource policy;
- deny-all network policy;
- canonical H4-R2A confinement request and lineage;
- null credential binding;
- exact workload identity.

R3A intentionally grants no execution authority.

The remaining H4 problem is not merely "start a container." A later K2 path must be able to prove, for the exact R3A workload, that the backend which executed it actually matched the required runtime isolation, source digest, deny-all network posture, resource policy, and no-downgrade policy.

Therefore the next slice must establish the evidence language before any physical backend adapter is permitted.

---

## 3. Canonical predecessor chain

### H4-R1 — one-shot approval

Current approval surface:

```text
packages/kodac-runtime/src/trust/approval.ts
d36a604cb1957bc65dac3978c626ba48a9b299fb
```

External-process `ask` remains blocked. R3B may not change approval semantics.

### H4-R2A — provider-neutral confinement request

```text
packages/kodac-runtime/src/trust/confinement.ts
873f235120645c0a12f10a5bff7e9591db6bb341
```

Canonical theorem retained by R3B:

```text
requested confinement != observed enforcement
```

### H4-R2B / R2C — Linux Landlock primitive + narrow K2 read-only binding

```text
packages/kodac-runtime/src/trust/confinement-linux-landlock.ts
94b325f73246514f31b950ba4fed38023e3e3cfc

packages/kodac-runtime/src/trust/confinement-runtime.ts
1ca0313fb25c62e549445ebcf1aef029b18e6b86

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560
```

R3B does not modify or invoke those surfaces.

### H4-R3A — content-addressed workload identity

Canonical merge:

```text
b8281d08f91232cc2271ab7109fb2701ddd429a0
```

Canonical workload module:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8
```

Canonical R3A evidence:

```text
docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_EVIDENCE_2026-08-15.md
9386b0220b25e8ac2aac1d9d3af9d07a150c452b
```

R3B must consume the validated R3A workload contract rather than create a parallel workload identity format.

---

## 4. OpenSandbox pinned implementation differential

Donor:

```text
opensandbox-group/OpenSandbox
```

Pinned commit:

```text
f8ed8734ce1fda69f0979f912160fb933b9bfa0c
```

Pinned tree:

```text
cf033b4f880b7e84b563dcf7f63722582ea48762
```

License:

```text
Apache-2.0
```

R3B intake mode:

```text
STUDY + REIMPLEMENT GENERIC CONTRACT IDEAS
```

No OpenSandbox production code is copied and no donor dependency is added.

### 4.1 Pinned implementation surfaces inspected

```text
oseps/0004-secure-container-runtime.md
65d1ec76530b01c7f530a582ba1bbc7deb5c8b35

server/opensandbox_server/services/runtime_resolver.py
c4efbda2c1581ee58ea2d31edeb359c6e473c4b8

server/opensandbox_server/services/docker/container_ops.py
ff3389b4ad72034f906f4866e9619bc844972125

server/opensandbox_server/services/docker/docker_service.py
0589780c714c187679d183a4182ac638dcd7779c

server/opensandbox_server/services/docker/networking.py
7509c788ab9712f26207d7a02cdd5a99b8f690b7
```

### 4.2 What the donor proves useful

OpenSandbox contains reusable implementation ideas:

- explicit secure-runtime configuration;
- Docker runtime injection into host configuration;
- startup availability validation;
- CPU / memory / PID and related host configuration;
- network-policy validation and sidecar enforcement machinery;
- lifecycle management and fail-start error propagation.

Those ideas are useful donor inputs for later physical adapters.

### 4.3 Why direct OpenSandbox / Docker adapter integration is NO-GO in R3B

The pinned implementation does not by itself prove the K2 theorem required after R3A:

1. **Runtime selection is server-global, not workload-bound.**
   The secure runtime is selected from server configuration. R3B requires a requirement bound to the exact R3A workload identity.

2. **Standard `runc` is the donor default when no secure runtime is configured.**
   Kodac must not silently accept absence of the required secure runtime. A later adapter must fail closed if the exact required isolation class cannot be proved.

3. **Requested image reference is not execution-byte proof.**
   The Docker implementation accepts an image URI, resolves cached/pulled images by that reference, and does not establish a K2 evidence theorem that the observed running container image digest equals the R3A source digest.

4. **Successful start / `Running` is not observed enforcement evidence.**
   The create response reports successful container start but does not return a self-contained proof of observed runtime class, observed immutable image digest, observed network mode, and observed resource enforcement.

5. **Resource semantics do not automatically equal the R3A policy semantics.**
   Mapping a request into Docker host configuration is not sufficient proof that the exact R3A resource policy was enforced as intended.

6. **Network policy is a separate authority surface.**
   OpenSandbox supports dynamic egress machinery and credential-proxy features. R3B v1 must stay at deny-all + no credentials and may not widen that authority.

7. **Server configuration and status are claims, not K2 receipts.**
   A later trusted adapter must independently observe backend facts and bind them to the exact requirement before K2 may treat them as evidence.

Therefore:

```text
DIRECT OPENSANDBOX SERVER ADOPTION:
NO-GO

DIRECT DOCKER ADAPTER IN R3B:
NO-GO

PROVIDER-NEUTRAL CONTRACT FIRST:
GO
```

---

## 5. R3B core trust theorem

R3B must preserve four distinct layers:

```text
R3A SandboxWorkloadRequest
        |
        v
SandboxExecutionRequirement
        |
        +------> SandboxBackendCapabilityDeclaration
        |
        v
SandboxBackendObservation
        |
        v
SandboxExecutionEvidence
```

Their meanings are deliberately different.

### 5.1 Requirement

`SandboxExecutionRequirement` means:

```text
WHAT KODAC REQUIRES FOR THIS EXACT R3A WORKLOAD
```

It is deterministic and content-identity-bound.

### 5.2 Capability declaration

`SandboxBackendCapabilityDeclaration` means:

```text
WHAT A BACKEND / ADAPTER DECLARES IT CAN SUPPORT
```

A capability declaration is **not proof** that a later execution actually used those capabilities.

### 5.3 Observation

`SandboxBackendObservation` means:

```text
WHAT A FUTURE TRUSTED BACKEND OBSERVER REPORTS IT OBSERVED
```

R3B only defines and validates the structure. R3B does not make the observer trusted and does not perform observation itself.

### 5.4 Evidence

`SandboxExecutionEvidence` means:

```text
A DETERMINISTIC, IDENTITY-BOUND MATCH BETWEEN THE REQUIREMENT,
THE DECLARED CAPABILITY, AND THE SUPPLIED OBSERVATION
```

R3B evidence is not, by itself, physical enforcement proof. Physical truth requires a later authorized adapter whose observation method is separately proven.

This distinction is mandatory.

---

## 6. Authorized implementation paths

If this authorization becomes canonical, exactly these pre-ledger paths are authorized:

```text
1. packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
2. packages/kodac-runtime/src/index.ts
3. schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
4. packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
```

Only after fresh pre-ledger PASS may this fifth path be created:

```text
5. docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_2026-08-15.md
```

No other path is authorized.

The evidence ledger must remain absent until pre-ledger PASS is established externally from exact repository state / changed paths.

A permanent runtime assertion that the future ledger file does not exist is not authorized.

---

## 7. Pure-module dependency boundary

The new module may import only deterministic standard-library helpers required for canonical validation / hashing and the canonical R3A workload contract.

Allowed production imports are limited to purpose-equivalents of:

```text
node:crypto
node:util
./sandbox-workload.ts
```

No other Kodac authority module is required.

Explicitly prohibited imports / dependencies include:

```text
node:fs
node:child_process
node:net
node:http
node:https
Docker SDK / dockerode
Kubernetes SDK
OpenSandbox SDK / server
OCI registry clients
approval.ts
confinement-runtime.ts
confinement-linux-landlock.ts
gateway.ts
receipt.ts
done-gate.ts
agent loop
```

The implementation must perform no filesystem, network, process, container, registry, credential, approval, or K2 side effect.

---

## 8. Protected authority surfaces

The implementation must keep these canonical inputs / authority surfaces byte-identical:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8

packages/kodac-runtime/src/trust/approval.ts
d36a604cb1957bc65dac3978c626ba48a9b299fb

packages/kodac-runtime/src/trust/confinement.ts
873f235120645c0a12f10a5bff7e9591db6bb341

packages/kodac-runtime/src/trust/confinement-linux-landlock.ts
94b325f73246514f31b950ba4fed38023e3e3cfc

packages/kodac-runtime/src/trust/confinement-runtime.ts
1ca0313fb25c62e549445ebcf1aef029b18e6b86

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/evidence/receipt.ts
214403398751c9d22bf695786c7fd7c6fd7e35e1

packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

packages/kodac-runtime/src/agent/loop.ts
576ad425db7e845b9705c982e95dd4f7522f8c43

packages/kodac-runtime/package.json
af4c20a3dae387c15cc5fb2eb28d415c8f115b95

packages/kodac-runtime/scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7

packages/kodac-runtime/THIRD_PARTY_NOTICES.md
aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76
```

`packages/kodac-runtime/src/index.ts` is the only existing production file authorized to change, solely for additive exports of the new pure R3B contract.

---

## 9. Historical regression assertion audit

Authorization-time repository search found no current test that byte-pins the R3A `src/index.ts` blob as an immutable historical runtime requirement. Existing references are documentary evidence / historical planning surfaces.

Therefore R3B authorizes **no historical-test reconciliation path**.

If full CI later exposes a genuine historical assertion that conflicts with the authorized additive export, implementation must stop and use a separate docs-only reconciliation before modifying that historical test.

No skip, `.only`, `.todo`, deletion, weakened assertion, CI-only conditional, or bypass is authorized.

---

## 10. Contract versions

Recommended fixed v1 literals:

```text
Backend capability:
kodac-h4-r3b-backend-capability-v1

Execution requirement:
kodac-h4-r3b-execution-requirement-v1

Backend observation:
kodac-h4-r3b-backend-observation-v1

Execution evidence:
kodac-h4-r3b-execution-evidence-v1
```

Domain-separated SHA-256 identities must be used for each top-level contract family.

R3A workload identities and OCI digests retain their existing formats and must be revalidated through the R3A validators rather than accepted as unparsed strings where the full R3A object is supplied.

---

## 11. Semantic runtime classes

R3B is provider-neutral. It must not encode Docker runtime flag names or Kubernetes RuntimeClass object names as authority.

The v1 semantic isolation classes are limited to:

```text
gvisor
kata-qemu
kata-firecracker
```

Explicitly not admitted as an H4 secure-runtime requirement:

```text
runc
process-default
unknown
fallback
```

A later physical adapter may map a semantic class to a provider-specific mechanism only under separate authorization, for example:

```text
gvisor -> Docker runtime "runsc"
gvisor -> a validated Kubernetes RuntimeClass handler
kata-firecracker -> a validated Kata / Firecracker handler
```

That mapping is not R3B execution authority.

---

## 12. Backend capability declaration

The implementation should expose a deterministic immutable structure purpose-equivalent to:

```text
SandboxBackendCapabilityDeclaration
```

with semantic fields sufficient to bind:

```text
version
backendFamily
providerId
implementationIdentity
semanticRuntimeClasses
supportsImmutableImageDigestObservation
supportsDenyAllNetworkObservation
supportsCpuBudgetObservation
supportsMemoryLimitObservation
supportsTtlObservation
supportsOutputLimitObservation
credentialMode
downgradePolicy
capabilityIdentity
```

Required v1 invariants:

```text
backendFamily = "oci-container"
credentialMode = "none"
downgradePolicy = "forbid"
```

`semanticRuntimeClasses` must be a canonical dense sorted unique non-empty subset of the v1 semantic runtime classes.

Capability booleans may truthfully be `false`; a capability declaration can describe an insufficient backend. The requirement/evidence matcher must then fail closed rather than rewriting the declaration to `true` or silently degrading the requirement.

`providerId` is descriptive backend identity, not permission authority.

`implementationIdentity` must be a lowercase SHA-256 identity for the future adapter/backend implementation artifact identity admitted by a later slice. In R3B tests it is fixture data only.

---

## 13. Execution requirement

The implementation should expose a deterministic immutable structure purpose-equivalent to:

```text
SandboxExecutionRequirement
```

constructed from:

```text
validated SandboxWorkloadRequest
required semantic runtime class
```

The requirement must carry or self-contain enough canonical R3A data to recompute all security-relevant bindings rather than trust caller-duplicated strings.

At minimum the requirement identity must bind:

```text
R3A workloadIdentity
R3A source digest
R3A executionIntentIdentity
R3A confinementRequestIdentity
required semantic runtime class
required deny-all network policy identity
required resource policy identity / values
credentialBindingIdentity = null
downgradePolicy = forbid
```

A requirement must not accept `runc`, empty, unknown, or caller-defined fallback runtime classes.

Changing any bound R3A field or the required runtime class must change `requirementIdentity`.

---

## 14. Backend observation

The implementation should expose a deterministic immutable structure purpose-equivalent to:

```text
SandboxBackendObservation
```

A future adapter will populate this from trusted backend inspection. R3B itself only validates the supplied structure.

The observation must bind, at minimum:

```text
version
requirementIdentity
workloadIdentity
capabilityIdentity
observerIdentity
executionInstanceIdentity
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkMode
observedResourcePolicyIdentity / exact observed policy values
observedCredentialBindingIdentity
downgradeOccurred
observationIdentity
```

Required v1 values include:

```text
observedNetworkMode = "deny-all"
observedCredentialBindingIdentity = null
downgradeOccurred = false
```

`executionInstanceIdentity` must be a content identity / deterministic digest field, not a raw mutable container name used as authority.

`observerIdentity` identifies the future trusted observer implementation. R3B does not declare any observer trusted.

A supplied observation saying `Running`, `started`, `healthy`, or equivalent must not substitute for the fields above.

---

## 15. Execution evidence

The implementation should expose a deterministic immutable structure purpose-equivalent to:

```text
SandboxExecutionEvidence
```

Creation / validation must fail closed unless all of the following are exact:

1. requirement revalidates against the canonical R3A workload;
2. capability identity recomputes correctly;
3. required semantic runtime class is declared supported;
4. all capability booleans needed by the requirement are `true`;
5. observed workload identity equals required workload identity;
6. observed source digest equals the R3A immutable source digest;
7. observed semantic runtime class equals the required semantic runtime class;
8. observed network mode is exactly deny-all;
9. observed resource policy identity and exact policy values equal the R3A requirement;
10. observed credential binding is exactly null;
11. downgrade policy is `forbid` and `downgradeOccurred` is exactly false;
12. observation is bound to the same capability and requirement identities;
13. all nested identities recompute from canonical preimages;
14. no unknown / extra semantic field survives validation.

If any item differs:

```text
THROW / REJECT
```

There is no partial success, warning-only match, compatibility fallback, weaker-runtime substitution, or inferred equivalence.

---

## 16. Requested vs declared vs observed truth

R3B must encode this rule in both API semantics and tests:

```text
REQUIREMENT != CAPABILITY DECLARATION != OBSERVATION != PHYSICAL PROOF
```

In particular:

- requirement does not prove execution;
- capability declaration does not prove availability;
- observation structure does not prove observer trust;
- successful deterministic matching does not prove the observation source was honest;
- a later adapter must prove how its observations are obtained from a backend.

R3B therefore must not expose a function name or documentation claim such as `proveSandboxIsSecure()`.

Purpose-equivalent names such as `createSandboxExecutionEvidence` / `validateSandboxExecutionEvidence` are acceptable only with the bounded semantics above.

---

## 17. Input-shape and canonicalization requirements

R3B must follow the fail-closed hostile-input discipline already proven by R3A.

At minimum focused tests must reject:

```text
null / primitive instead of record
proxy objects
custom prototypes
accessor properties
non-enumerable semantic fields
symbol fields
unknown keys
undefined required values
sparse arrays
array extra properties
duplicate runtime classes
unsorted runtime classes
invalid SHA-256 identities
invalid sha256: digests
NUL-containing bounded strings
oversized strings / arrays
non-safe integers
negative / zero values where forbidden
unknown semantic runtime class
runc / fallback runtime class
credential identity other than null
downgradeOccurred = true when constructing evidence
```

All returned structures and nested collections must be immutable / frozen to the same practical standard as R3A.

---

## 18. Resource-policy rule

R3B must not invent provider-specific equivalence such as:

```text
R3A cpuMillis == Docker nano_cpus
```

unless a later adapter slice explicitly defines and proves that translation.

For R3B the rule is simpler:

```text
THE REQUIREMENT BINDS THE EXACT R3A RESOURCE POLICY.
THE OBSERVATION BINDS AN EXACT OBSERVED POLICY IN THE SAME R3B SEMANTIC FORM.
THE MATCHER REQUIRES EQUALITY.
```

Provider translation is deferred.

---

## 19. Network-policy rule

R3B v1 admits only:

```text
deny-all
```

No allowlist, DNS policy, proxy rule, credential broker, egress sidecar authority, or dynamic policy mutation is admitted.

A future adapter must prove deny-all from backend observation under separate authorization.

---

## 20. Credential rule

R3B v1 admits:

```text
credential mode = none
credential binding identity = null
```

No secret reference, environment credential, credential vault, proxy injection, cloud workload identity, token exchange, or credential broker is authorized.

---

## 21. No-downgrade rule

The no-downgrade theorem is mandatory:

```text
REQUIRED RUNTIME UNAVAILABLE
=> FAIL CLOSED

OBSERVED RUNTIME != REQUIRED RUNTIME
=> FAIL CLOSED

BACKEND DECLARES ONLY WEAKER / DIFFERENT RUNTIME
=> FAIL CLOSED

OBSERVATION REPORTS downgradeOccurred = true
=> FAIL CLOSED
```

There is no `runc` fallback path in the R3B evidence theorem.

---

## 22. Schema requirements

The JSON Schema must mirror the runtime contract precisely enough to catch obvious shape divergence, including:

- fixed version literals;
- exact required properties;
- `additionalProperties: false` throughout semantic records;
- lowercase SHA-256 identity patterns;
- `sha256:` digest pattern;
- allowed semantic runtime enums;
- deny-all network literal;
- null credential binding;
- boolean capability fields;
- no-downgrade literal / false observation;
- bounded arrays and strings where runtime limits are defined.

Runtime validation remains authoritative for hostile JavaScript object semantics that JSON Schema cannot model, such as proxies, accessors, descriptors, prototypes, symbols, and sparse arrays.

---

## 23. Focused proof requirements

The focused test must contain literal fixed vectors rather than deriving expected identities by calling the implementation under test.

It must prove at minimum:

### 23.1 Happy path

- canonical R3A fixture workload validates;
- sufficient backend capability declaration validates;
- requirement identity matches a literal vector;
- observation identity matches a literal vector;
- execution evidence identity matches a literal vector;
- all output structures are frozen.

### 23.2 Runtime mismatch

Each of these must fail closed independently:

```text
required gvisor / observed kata-qemu
required kata-firecracker / observed gvisor
runc requested
fallback token requested
unknown runtime token
```

### 23.3 Source mismatch

Changing observed OCI digest by one hexadecimal digit must fail.

A tag-only or non-sha256 observed source must fail.

### 23.4 Workload / lineage mismatch

Tampering any of:

```text
workloadIdentity
executionIntentIdentity
confinementRequestIdentity
networkPolicyIdentity
resourcePolicyIdentity
```

must fail through R3A revalidation or R3B binding.

### 23.5 Capability insufficiency

If any capability needed to satisfy the requirement is false, evidence creation must fail.

### 23.6 Network / credentials / downgrade

Any non-deny-all observation, non-null credential binding, or downgrade occurrence must fail.

### 23.7 Resource mismatch

Each bound resource field must be independently tamper-tested.

### 23.8 Hostile object shapes

Proxy / accessor / symbol / prototype / unknown-field / sparse-array cases must fail before semantic acceptance.

### 23.9 Purity

The focused proof must establish that the new production module contains no prohibited authority import or callable backend dependency.

### 23.10 Protected blobs

The focused proof must assert the protected canonical inputs remain byte-identical where repository-test conventions permit this without creating a ledger lifecycle contradiction.

---

## 24. Pre-ledger certification gate

Before the evidence ledger exists, all of the following must be true on one exact candidate head:

```text
EXACT CHANGED PATHS:
4 / 4 AUTHORIZED PRE-LEDGER PATHS ONLY

LEDGER:
ABSENT — PROVED EXTERNALLY FROM EXACT REPOSITORY STATE

TYPECHECK:
PASS ON ALL REQUIRED OS JOBS

FULL TEST SUITE:
PASS ON ALL REQUIRED OS JOBS

PATCH / BENCHMARK GATE:
PASS WHERE APPLICABLE

K2 RUNTIME GATE:
PASS

K3-R4 / K3-R5:
PASS WHERE CLASSIFIER REQUIRES THEM

GOVERNANCE / PROVENANCE / LEGACY:
PASS

REVIEW THREADS:
0 UNRESOLVED

PROTECTED AUTHORITY BLOBS:
BYTE-IDENTICAL

MANUAL TRUST REVIEW:
PASS
```

No evidence ledger may be created before that exact-head gate passes.

---

## 25. Ledger gate

Only after pre-ledger PASS may the evidence file be created:

```text
docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_2026-08-15.md
```

The ledger commit must be ledger-only.

The ledger may record pre-ledger facts but must mark post-ledger certification as pending until fresh post-ledger checks pass on the ledger-bearing head.

The four pre-ledger implementation/schema/test/export blobs must remain byte-identical across the ledger-only commit.

---

## 26. Post-ledger certification gate

After the ledger-only commit, all certification must be rerun on the new exact head.

Required proof includes:

```text
ledger-only delta from accepted pre-ledger head
implementation blobs unchanged
schema blob unchanged
focused-test blob unchanged
index export blob unchanged
full required CI PASS
K2/K3/governance PASS
review state clean
manual trust review PASS
```

Only then may the implementation PR become ready for merge.

---

## 27. What R3B explicitly does not authorize

R3B does **not** authorize:

- Docker daemon access;
- Docker socket access;
- dockerode or another Docker SDK;
- OpenSandbox server or SDK integration;
- Kubernetes integration;
- gVisor installation or invocation;
- Kata / Firecracker installation or invocation;
- container creation / start / exec / kill / remove;
- image pull or registry resolution;
- `RepoDigests` inspection;
- runtime-class inspection;
- cgroup inspection;
- namespace inspection;
- firewall / network namespace inspection;
- Landlock changes;
- workspace-write confinement;
- dynamic network allowlists;
- credential proxy / vault integration;
- external-process `ask` re-enable;
- K2 gateway changes;
- receipt changes;
- Done Gate changes;
- H4 closure;
- H6 work.

Any one of those requires a later explicit authorization.

---

## 28. Expected bounded claim if implementation later passes

If a future R3B implementation passes its complete pre-ledger and post-ledger gates, the maximum claim is:

```text
KODAC_SANDBOX_BACKEND_REQUIREMENT_OBSERVATION_EVIDENCE_CONTRACT_PROVEN
```

This claim means only:

```text
Kodac has a deterministic pure contract that can bind an exact R3A workload
requirement to a backend capability declaration and supplied observation,
rejecting runtime/source/network/resource/credential/downgrade mismatches.
```

It does **not** mean:

```text
Docker confinement proven
OpenSandbox integration proven
gVisor confinement proven
Kata / Firecracker confinement proven
backend observations are trusted
external process execution authorized
external-process ask enabled
workspace-write K2 integration proven
network isolation physically proven
H4 complete
H6 authorized
```

---

## 29. Expected next decision after R3B proof

If R3B later becomes proven, the next slice must still be separately authorized.

The preferred next candidate is a **single physical backend observation adapter** whose only job is to prove that one exact backend execution can produce trustworthy observations matching R3B.

A likely candidate may be a Linux Docker + gVisor adapter, but that choice is **not authorized by this document** and must be selected only after a fresh implementation differential.

That later slice must independently prove at least:

```text
exact immutable image digest observed
exact semantic runtime class observed
no runtime downgrade
exact deny-all network posture observed
resource-policy translation + observation proven
exact execution instance bound to R3A workload identity
trusted observer implementation identity
fail-closed behavior when any required fact is unavailable
```

---

## 30. Final authorization boundary

```text
AUTHORIZED:
PURE PROVIDER-NEUTRAL REQUIREMENT / CAPABILITY / OBSERVATION / EVIDENCE CONTRACT ONLY

NOT AUTHORIZED:
ANY BACKEND EXECUTION OR OBSERVATION
ANY OPENSANDBOX / DOCKER / KUBERNETES DEPENDENCY
ANY K2 / APPROVAL / RECEIPT / DONE-GATE MUTATION
ANY EXTERNAL-PROCESS ask RE-ENABLE
ANY H4 CLOSURE CLAIM
ANY H6 WORK
```

This boundary is intentionally narrow. It converts the OpenSandbox differential into a testable evidence theorem without importing the donor's server-global authority model or mistaking backend configuration/status for execution truth.
