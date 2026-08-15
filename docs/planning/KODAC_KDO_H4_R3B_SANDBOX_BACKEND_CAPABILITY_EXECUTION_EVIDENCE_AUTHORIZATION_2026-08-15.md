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

R3B establishes only the language needed for a later trusted backend adapter to bind:

```text
exact R3A workload requirement
        !=
backend capability declaration
        !=
backend observation
        !=
physical enforcement proof
```

R3B does not create, start, inspect, stop, or mutate any sandbox.

---

## 2. Why R3B exists

Canonical H4-R3A proves only:

```text
KODAC_CONTENT_ADDRESSED_SANDBOX_WORKLOAD_IDENTITY_CONTRACT_PROVEN
```

That contract binds an immutable OCI digest, canonical entrypoint, exact resource policy, deny-all network policy, canonical H4-R2A confinement request and lineage, null credentials, and one deterministic workload identity.

R3A intentionally grants no execution authority.

The remaining structural problem is therefore not "start a container." A later K2 path needs a deterministic fail-closed contract that can say what the exact R3A workload required, what a backend declares it can support, what a future trusted observer reports it observed, and whether those structures match exactly.

---

## 3. Canonical predecessor chain

### H4-R1 — one-shot approval

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

The theorem remains:

```text
requested confinement != observed enforcement
```

### H4-R2B / R2C — Linux Landlock primitive + narrow K2 read-only binding

```text
packages/kodac-runtime/src/trust/confinement-linux-landlock.ts
94b325f73246514f31b950ba4fed38023e3e3cfc

packages/kodac-runtime/src/trust/confinement-runtime.ts
1ca0313fb25c62e549445ebcf1aef029b18e6b86
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

R3B must consume and revalidate the full canonical R3A workload object. It may not create a parallel workload identity format.

---

## 4. Historical authority-transition record

The phrase "protected and byte-identical" in this authorization is relative to the exact R3B canonical base `b8281d08...`; it is **not** a claim that all protected files have had the same blob since H4-R2A.

At the original H4-R2A authorization base `344c9616...`, the protected K2 blobs included:

```text
packages/kodac-runtime/src/execution/gateway.ts
8b481c226276d0b06fabc8d614c1295cd0881a6a

packages/kodac-runtime/src/evidence/receipt.ts
bc11267496f8c8a2ca1dac713baccf88ec962b19
```

H4-R2C later explicitly authorized and proved the K2 Linux Landlock read-only integration. Its accepted changed-path set included both `gateway.ts` and `receipt.ts`, and its evidence records the resulting blobs:

```text
packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/evidence/receipt.ts
214403398751c9d22bf695786c7fd7c6fd7e35e1
```

Therefore those are authorized predecessor transitions, not unexplained drift.

`packages/kodac-runtime/src/agent/loop.ts` was subsequently changed under the separately authorized H5 family. H5-R4B explicitly includes `agent/loop.ts` in its six-path accepted scope and records the current blob:

```text
packages/kodac-runtime/src/agent/loop.ts
576ad425db7e845b9705c982e95dd4f7522f8c43
```

R3B grants no authority to repeat or extend any of those historical changes. It freezes the current R3B-base blobs listed in §8.

---

## 5. OpenSandbox pinned implementation differential

Donor:

```text
opensandbox-group/OpenSandbox
```

Pinned commit / tree:

```text
f8ed8734ce1fda69f0979f912160fb933b9bfa0c
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

Pinned implementation surfaces inspected:

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

Useful donor ideas include secure-runtime configuration, startup availability checks, host resource configuration, network-policy machinery, and lifecycle failure propagation.

Direct adoption is nevertheless **NO-GO in R3B** because the pinned implementation does not by itself prove Kodac's post-R3A theorem:

1. secure-runtime selection is server-global rather than bound to one exact R3A workload;
2. unconfigured secure runtime defaults to standard `runc` in the donor design;
3. image URI lookup/pull is not proof that the executed container used the exact R3A digest;
4. successful start / `Running` is not an observed proof of runtime, image digest, network posture, or resource enforcement;
5. Docker host-config values are not automatically equivalent to R3A resource semantics;
6. donor egress / credential features are broader authority than R3B v1 permits.

Decision:

```text
DIRECT OPENSANDBOX SERVER ADOPTION:
NO-GO

DIRECT DOCKER ADAPTER IN R3B:
NO-GO

PROVIDER-NEUTRAL CONTRACT FIRST:
GO
```

---

## 6. Core trust model

R3B preserves four distinct layers:

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

Meanings:

- **Requirement**: what Kodac requires for this exact validated R3A workload.
- **Capability declaration**: what a backend/adapter claims it can support. This is not execution proof.
- **Observation**: what a future observer reports it observed. R3B validates structure only; it does not make that observer trusted.
- **Evidence**: a deterministic match between the validated requirement, capability declaration, and supplied observation. It is not physical enforcement proof unless a later separately proven adapter establishes trustworthy observation.

The implementation must never expose or document a purpose-equivalent function named `proveSandboxIsSecure`.

---

## 7. Authorized implementation paths

If this authorization becomes canonical, exactly four pre-ledger paths are authorized:

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

Ledger absence must be proven externally from exact repository state / changed paths. A permanent runtime assertion that the future ledger does not exist is forbidden.

---

## 8. Protected R3B-base authority surfaces

The implementation must keep these exact blobs byte-identical to canonical base `b8281d08...`:

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

`packages/kodac-runtime/src/index.ts` is the only existing production file authorized to change, solely for an additive export of the new pure R3B module.

---

## 9. Pure-module dependency boundary

The new production module may import only purpose-equivalents of:

```text
node:crypto
node:util
./sandbox-workload.ts
```

It must not import or call:

```text
node:fs
node:child_process
node:net
node:http
node:https
Docker / dockerode
Kubernetes SDK
OpenSandbox SDK / server
OCI registry client
approval.ts
confinement-runtime.ts
confinement-linux-landlock.ts
gateway.ts
receipt.ts
done-gate.ts
agent loop
```

No filesystem, network, process, container, registry, credential, approval, K2, receipt, or Done-Gate side effect is authorized.

---

## 10. Mandatory version literals and enums

These literals are **required exactly**, not recommendations:

```text
KDO_H4_R3B_BACKEND_CAPABILITY_VERSION = "kodac-h4-r3b-backend-capability-v1"
KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION = "kodac-h4-r3b-execution-requirement-v1"
KDO_H4_R3B_BACKEND_OBSERVATION_VERSION = "kodac-h4-r3b-backend-observation-v1"
KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION = "kodac-h4-r3b-execution-evidence-v1"

BACKEND_FAMILY = "oci-container"
CREDENTIAL_MODE = "none"
DOWNGRADE_POLICY = "forbid"
NETWORK_MODE = "deny-all"
```

Allowed semantic runtime classes are exactly:

```text
gvisor
kata-firecracker
kata-qemu
```

Explicitly forbidden as required runtime classes:

```text
runc
process-default
unknown
fallback
```

Provider-specific spellings such as Docker `runsc` or Kubernetes RuntimeClass handlers are not R3B authority.

---

## 11. Canonical runtime-class ordering

`semanticRuntimeClasses` must be a dense, unique, non-empty plain array with 1 through 3 items.

Canonical order is defined by this explicit rank table:

```text
0 = gvisor
1 = kata-firecracker
2 = kata-qemu
```

No locale comparator, platform comparator, caller order, or implicit JavaScript sort order is authoritative.

An input array is canonical only when each next item has a strictly larger rank than the previous item.

Literal multi-class vector:

```text
conceptual supported set:
{ kata-qemu, gvisor, kata-firecracker }

canonical serialized array:
["gvisor","kata-firecracker","kata-qemu"]
```

Duplicates, permutations such as `["kata-qemu","gvisor"]`, sparse arrays, array extra properties, and unknown classes must fail closed rather than be silently sorted or deduplicated.

---

## 12. New R3B limits

R3B introduces only one free-form textual field: `providerId`. All other new identity fields are fixed-size SHA-256 identities or fixed enums.

Required limits:

```text
providerId:
1..128 ASCII bytes
pattern: ^[a-z0-9][a-z0-9._-]{0,127}$
NUL forbidden implicitly by ASCII grammar

semanticRuntimeClasses:
1..3 items

implementationIdentity:
exactly 64 lowercase hexadecimal ASCII characters

observerIdentity:
exactly 64 lowercase hexadecimal ASCII characters

executionInstanceIdentity:
exactly 64 lowercase hexadecimal ASCII characters

capabilityIdentity:
exactly 64 lowercase hexadecimal ASCII characters

requirementIdentity:
exactly 64 lowercase hexadecimal ASCII characters

observationIdentity:
exactly 64 lowercase hexadecimal ASCII characters

evidenceIdentity:
exactly 64 lowercase hexadecimal ASCII characters

observedSourceDigest:
exactly "sha256:" + 64 lowercase hexadecimal ASCII characters
```

R3B must reuse R3A validation and R3A constants for nested workload/policy values, including:

```text
KDO_H4_R3A_LIMITS.maxRepositoryBytes = 512
KDO_H4_R3A_LIMITS.maxExecutableBytes = 4096
KDO_H4_R3A_LIMITS.maxArgs = 256
KDO_H4_R3A_LIMITS.maxArgBytes = 8192
KDO_H4_R3A_LIMITS.maxArgsBytes = 65536
KDO_H4_R3A_LIMITS.maxCpuMillis = 256000
KDO_H4_R3A_LIMITS.maxMemoryBytes = 1099511627776
KDO_H4_R3A_LIMITS.maxTtlMs = 86400000
KDO_H4_R3A_LIMITS.maxOutputBytes = 16777216
```

R3B may not silently introduce different bounds for the same nested R3A semantics.

---

## 13. Normative identity encoding

All four R3B top-level identities use the same byte-level algorithm.

### 13.1 Prefix

For domain label `DOMAIN`, the prefix bytes are exactly:

```text
ASCII("KODAC-H4-R3B")
|| 0x00
|| ASCII(DOMAIN)
|| 0x00
|| ASCII("V1")
|| 0x00
```

Required domain labels:

```text
BACKEND_CAPABILITY
EXECUTION_REQUIREMENT
BACKEND_OBSERVATION
EXECUTION_EVIDENCE
```

### 13.2 Payload serialization

The payload is UTF-8 of one compact JSON object whose key order is exactly the order specified in §§14–17.

Normative rules:

```text
no BOM
no whitespace outside JSON string contents
keys exactly in the specified order
strings use JSON double-quoted syntax
all R3B preimage strings are ASCII by grammar or are inherited digest/identity ASCII tokens
arrays preserve the explicit canonical order
booleans serialize exactly as true / false
null serializes exactly as null
integers are base-10 ASCII, no leading zero except 0, no exponent, no fraction
all numeric values must already satisfy Number.isSafeInteger and the inherited R3A positive bounds
unknown fields are impossible in a valid preimage
```

The identity is:

```text
lowercase_hex(SHA256(prefix || payload_utf8))
```

No implementation may hash a language-native object representation, pretty JSON, reordered keys, omitted `null`, floating-point spelling, or provider-specific structure.

---

## 14. Backend capability declaration

Purpose-equivalent type:

```text
SandboxBackendCapabilityDeclaration
```

Exact semantic fields:

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

Required fixed values:

```text
backendFamily = "oci-container"
credentialMode = "none"
downgradePolicy = "forbid"
```

Capability booleans may be `false`; an insufficient declaration is valid data. Evidence creation must reject insufficiency rather than rewrite it.

`providerId` is descriptive identity only, not permission authority.

`implementationIdentity` is a SHA-256 identity for the future adapter/backend implementation artifact identity supplied by a later authorized slice. In R3B it is inert fixture/data only.

Capability preimage key order is exactly:

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
```

---

## 15. Execution requirement — full canonical R3A input only

Purpose-equivalent type:

```text
SandboxExecutionRequirement
```

Construction input is exactly:

```text
full SandboxWorkloadRequest
requiredSemanticRuntimeClass
```

The full workload **must** pass `validateSandboxWorkloadRequest` before any R3B identity is accepted.

R3B does not authorize authoritative lookup, network lookup, registry lookup, identity-only input, partial workload input, or caller-supplied duplicate fields.

The constructor must reject any purpose-equivalent input that tries to separately supply:

```text
workloadIdentity
sourceDigest
executionIntentIdentity
confinementRequestIdentity
networkPolicyIdentity
resourcePolicyIdentity
resource values
credentialBindingIdentity
```

All of those values are derived only from the validated nested R3A workload.

The resulting requirement structure should self-contain:

```text
version
workload                  # full validated/frozen R3A workload
requiredSemanticRuntimeClass
downgradePolicy = "forbid"
requirementIdentity
```

The normative requirement preimage is a derived compact record with exact key order:

```text
version
workloadIdentity
sourceDigest
executionIntentIdentity
confinementRequestIdentity
networkPolicyIdentity
resourcePolicyIdentity
cpuMillis
memoryBytes
ttlMs
maxOutputBytes
credentialBindingIdentity
requiredSemanticRuntimeClass
downgradePolicy
```

Every field except the required runtime and fixed downgrade policy is derived from the full revalidated workload. `credentialBindingIdentity` must be exactly `null`.

No `runc`, fallback, empty, unknown, or caller-defined runtime token is admitted.

---

## 16. Backend observation

Purpose-equivalent type:

```text
SandboxBackendObservation
```

R3B only validates supplied structure. A later separately authorized adapter must prove how it obtains trustworthy observations.

The observation structure should self-contain exactly:

```text
version
requirementIdentity
workloadIdentity
capabilityIdentity
observerIdentity
executionInstanceIdentity
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicy       # full R3A SandboxNetworkPolicy
observedResourcePolicy      # full R3A SandboxResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
observationIdentity
```

Mandatory invariants:

```text
observedNetworkPolicy must pass validateSandboxNetworkPolicy
observedNetworkPolicy.mode = "deny-all"
observedNetworkPolicy.networkPolicyIdentity must recompute

observedResourcePolicy must pass validateSandboxResourcePolicy
all four resource values and resourcePolicyIdentity must recompute

observedCredentialBindingIdentity = null
downgradeOccurred = false
```

This explicitly binds the **observed deny-all network-policy identity**; the string `observedNetworkMode = "deny-all"` alone is insufficient and is not the v1 observation design.

`executionInstanceIdentity` is a deterministic SHA-256 identity supplied by a future observer, not a raw container name used as authority.

`observerIdentity` identifies a future observer implementation. R3B does not declare any observer trusted.

The normative observation preimage is a derived compact record with exact key order:

```text
version
requirementIdentity
workloadIdentity
capabilityIdentity
observerIdentity
executionInstanceIdentity
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicyIdentity
observedResourcePolicyIdentity
cpuMillis
memoryBytes
ttlMs
maxOutputBytes
observedCredentialBindingIdentity
downgradeOccurred
```

The network/resource identities and numeric values are derived only from the validated nested observed policy objects.

A backend status such as `Running`, `started`, or `healthy` is not admitted as a substitute for these fields.

---

## 17. Execution evidence

Purpose-equivalent type:

```text
SandboxExecutionEvidence
```

Construction input must contain the full validated:

```text
requirement
capability
observation
```

The resulting evidence should self-contain:

```text
version
requirement
capability
observation
evidenceIdentity
```

Creation / validation must fail closed unless all of these are exact:

1. requirement's full R3A workload revalidates;
2. requirement identity recomputes from the normative §15 preimage;
3. capability identity recomputes from the normative §14 preimage;
4. required runtime class is present in the canonical capability array;
5. all six observation-capability booleans required by this v1 theorem are `true`;
6. observation requirement identity equals the exact requirement identity;
7. observation capability identity equals the exact capability identity;
8. observation workload identity equals the exact validated R3A workload identity;
9. observed source digest equals `requirement.workload.source.digest`;
10. observed semantic runtime class equals the exact required runtime class;
11. observed network policy revalidates and its identity equals `requirement.workload.networkPolicy.networkPolicyIdentity`;
12. observed resource policy revalidates and its identity **and all four exact values** equal `requirement.workload.resourcePolicy`;
13. observed credential binding is exactly `null`;
14. capability downgrade policy is `forbid` and observation `downgradeOccurred` is exactly `false`;
15. every nested identity recomputes from its normative preimage;
16. no extra semantic field survives validation.

Any mismatch means:

```text
THROW / REJECT
```

There is no partial success, warning-only compatibility, inferred equivalence, weaker-runtime substitution, or fallback.

Evidence preimage key order is exactly:

```text
version
requirementIdentity
capabilityIdentity
observationIdentity
```

Those three nested identities must be freshly revalidated before hashing.

---

## 18. Fixed normative identity vectors

These vectors are specification constants for the future implementation tests. Tests must assert the literal values below rather than derive expected outputs by calling the implementation under test.

### 18.1 R3A fixture inputs reused

```text
workloadIdentity:
7e148da8275b34e873bd6fdd33cc5d4977c6577a4f3631ca988c3b9c227801c3

sourceDigest:
sha256:1111111111111111111111111111111111111111111111111111111111111111

executionIntentIdentity:
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

confinementRequestIdentity:
a22b2611b230d184748ab77f59155127a5e7a6c6bfe469df6cb3cbffc7351ee5

networkPolicyIdentity:
c17924ecbb8bfaa005dd6c8b0b321adf7f606b19b39672de51ac5b53c14ad3d6

resourcePolicyIdentity:
cf0077cf2277c1800a5bb08f1780abb2504255fa7b58eec369cc2a27811fb510

cpuMillis = 1000
memoryBytes = 536870912
ttlMs = 60000
maxOutputBytes = 1048576
credentialBindingIdentity = null
```

### 18.2 Capability vector

```text
providerId = fixture-secure-oci
implementationIdentity = cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
semanticRuntimeClasses = ["gvisor","kata-firecracker","kata-qemu"]
all six support booleans = true
credentialMode = none
downgradePolicy = forbid

capabilityIdentity:
b23c759edd03197380e0c9e5a1382c364eba4ed68ec33cada226d6878248f7c1
```

The capability identity above is the required multi-class ordering vector.

### 18.3 Requirement vector

```text
requiredSemanticRuntimeClass = gvisor
downgradePolicy = forbid

requirementIdentity:
46a11674fd3d973204bdaa8aa140076b5e45b84c276cb66cbb453c0b0b4cbc7f
```

### 18.4 Observation vector

```text
observerIdentity = dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
executionInstanceIdentity = eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
observedSourceDigest = exact fixture source digest
observedSemanticRuntimeClass = gvisor
observedNetworkPolicy = exact validated R3A deny-all fixture policy
observedResourcePolicy = exact validated R3A fixture resource policy
observedCredentialBindingIdentity = null
downgradeOccurred = false

observationIdentity:
96031bfde14a9826978c7eb65f59463aab24d395b955bd5e07ea69c9d191dac7
```

### 18.5 Evidence vector

```text
evidenceIdentity:
baae3419934f5862c458e376999c2fe962ce2aca2745fd2a794e4007761c5e9f
```

If implementation preimages differ from §§13–17, these vectors must fail and implementation must be corrected; the vectors must not be regenerated merely to fit implementation output.

---

## 19. Resource-policy rule

R3B must not invent provider-specific equivalence such as:

```text
R3A cpuMillis == Docker nano_cpus
```

The requirement binds the exact validated R3A policy.

The observation carries the same provider-neutral R3A policy structure as an observed semantic claim.

The matcher requires exact policy identity and exact numeric equality.

A later physical adapter must separately define and prove any Docker/cgroup/Kubernetes translation before it may populate the observation.

---

## 20. Network-policy rule

R3B v1 admits only the validated R3A network policy:

```text
mode = deny-all
networkPolicyIdentity = c17924ec... for the canonical fixture vector
```

The actual matcher must compare the full revalidated observed policy identity against the exact workload policy identity; it must not special-case only the fixture value.

No allowlist, DNS policy, proxy rule, credential broker, egress sidecar authority, or dynamic network mutation is admitted.

---

## 21. Credential and downgrade rules

Credential v1 is exactly:

```text
capability credentialMode = none
workload credentialBindingIdentity = null
observation observedCredentialBindingIdentity = null
```

No secret reference, environment credential, credential vault, proxy injection, cloud workload identity, token exchange, or broker is authorized.

No-downgrade theorem:

```text
required runtime unavailable
=> fail closed

observed runtime != required runtime
=> fail closed

backend does not declare required runtime
=> fail closed

required observation capability is false
=> fail closed

downgradeOccurred = true
=> fail closed
```

No `runc` fallback exists in the R3B theorem.

---

## 22. Hostile-input and immutability requirements

R3B must follow the fail-closed hostile-object discipline already proven by R3A.

Focused runtime validation must reject at minimum:

```text
null / primitive where record required
Proxy objects
custom prototypes
accessor properties
non-enumerable semantic fields
symbol fields
unknown keys
undefined required values
sparse arrays
array extra properties
duplicate runtime classes
non-canonical runtime-class ordering
invalid SHA-256 identities
invalid sha256: digests
oversized providerId
providerId outside ASCII grammar
non-safe integers in any observed nested resource object
unknown runtime class
runc / fallback runtime class
credential value other than null
downgradeOccurred = true for evidence acceptance
```

Constructors must detach caller-owned arrays and return frozen structures. Nested R3A validators must be used rather than trusting caller-frozen objects.

---

## 23. JSON Schema requirements

The schema must mirror the runtime structure without claiming to model JavaScript-only hostile-object semantics.

It must include:

- exact four version literals;
- exact required properties;
- `additionalProperties: false` throughout semantic records;
- SHA-256 identity and digest patterns;
- `providerId` ASCII pattern and `maxLength: 128` (safe because the grammar is ASCII-only);
- canonical runtime enum and `maxItems: 3` / `minItems: 1` / `uniqueItems: true`;
- fixed backend/credential/downgrade literals;
- nested full R3A workload requirement shape or a schema reference that resolves deterministically in repository validation;
- nested full R3A deny-all network policy shape;
- nested full R3A resource policy shape and inherited numeric maxima;
- observation credential `null` and `downgradeOccurred: false`;
- evidence nesting with exact keys.

JSON Schema cannot prove Proxy/accessor/prototype/symbol/sparse-array properties; runtime validation remains authoritative for those.

---

## 24. Focused proof requirements

The focused test must use the literal fixed vectors in §18.

It must prove:

### Happy path

- full canonical R3A workload revalidates;
- sufficient capability validates;
- requirement, observation, and evidence vectors match exactly;
- all returned records and new collections are frozen.

### Requirement-source integrity

- identity-only and partial workload construction are not accepted APIs;
- extra duplicate source/identity/policy fields fail exact-key validation;
- nested R3A workload tampering fails before R3B requirement acceptance.

### Runtime mismatch

Each independently fails:

```text
required gvisor / observed kata-qemu
required kata-firecracker / observed gvisor
runc required
fallback required
unknown runtime
permuted capability runtime-class array
```

### Source mismatch

One hexadecimal digit changed in observed OCI digest fails.

A non-`sha256:` digest fails.

### Network mismatch

- wrong observed network-policy identity fails;
- tampered observed network policy fails R3A revalidation;
- any non-deny-all shape fails.

### Resource mismatch

Each of `cpuMillis`, `memoryBytes`, `ttlMs`, and `maxOutputBytes` must be independently tampered and rejected; a forged resource identity must fail recomputation.

### Capability insufficiency

Each required support boolean set false must independently cause evidence creation to fail.

### Credential / downgrade

Non-null credential binding and `downgradeOccurred = true` fail.

### Lineage

Tampering nested workload:

```text
workloadIdentity
executionIntentIdentity
confinementRequestIdentity
networkPolicyIdentity
resourcePolicyIdentity
```

fails through R3A revalidation or exact R3B matching.

### Hostile shapes

Proxy/accessor/symbol/prototype/unknown-field/sparse-array cases fail before semantic acceptance.

### Purity

The new production module contains no prohibited authority import or callable backend dependency.

### Protected blobs

The focused proof may assert protected canonical source blobs where repository-test conventions permit it, but it must not create a permanent assertion that the future evidence ledger is absent.

---

## 25. Historical regression assertion audit

Authorization-time repository search found no current historical test that permanently byte-pins `packages/kodac-runtime/src/index.ts` in a way that conflicts with the additive R3B export.

Therefore no historical-test reconciliation path is authorized.

If full CI later exposes a genuine older assertion that conflicts with the authorized additive export, implementation must stop and use a separate docs-only reconciliation before modifying that historical test.

No skip, `.only`, `.todo`, deletion, weakened assertion, or CI-only conditional is authorized.

---

## 26. Pre-ledger certification gate

Before the evidence ledger exists, one exact candidate head must prove:

```text
CHANGED PATHS:
exactly 4 / 4 authorized pre-ledger paths

LEDGER:
absent — external exact-head repository-state proof

TYPECHECK:
PASS on all required OS jobs

FULL TEST SUITE:
PASS on all required OS jobs

PATCH / BENCHMARK REGRESSION:
PASS where classifier applies

EXISTING K2 REGRESSION / CLASSIFIER GATE:
PASS

K3-R4 / K3-R5 REGRESSION:
PASS where classifier applies

GOVERNANCE / PROVENANCE / LEGACY:
PASS

REVIEW:
0 unresolved actionable threads

PROTECTED R3B-BASE BLOBS:
byte-identical

MANUAL TRUST REVIEW:
PASS
```

The phrase **existing K2 regression / classifier gate** is not R3B execution authority. CI may compile/test existing K2 code and enforce repository runtime-change rules. R3B production code remains prohibited from importing, invoking, mutating, or extending K2 execution. No sandbox backend execution is authorized by the test gate.

Only after this exact-head gate passes may the ledger be created.

---

## 27. Ledger and post-ledger gate

Only after pre-ledger PASS may this path be created:

```text
docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_2026-08-15.md
```

The ledger commit must be ledger-only.

It may record pre-ledger facts but must mark post-ledger certification pending.

Across that ledger-only commit, the four pre-ledger implementation/schema/test/export blobs must remain byte-identical.

Fresh post-ledger certification on the new exact head must rerun:

```text
full required CI
existing K2 regression/classifier gate
K3 regression gates where applicable
governance/provenance/legacy
review state
manual trust review
```

Again, the K2 item is regression checking only; it does not permit R3B code to execute through K2 or a sandbox backend.

Only then may an implementation PR become ready for merge.

---

## 28. Explicit non-authority

R3B does **not** authorize:

- Docker daemon/socket access;
- Docker SDK / dockerode;
- OpenSandbox server or SDK;
- Kubernetes integration;
- gVisor installation or invocation;
- Kata / Firecracker installation or invocation;
- container create/start/exec/kill/remove;
- image pull or registry resolution;
- Docker `RepoDigests` inspection;
- runtime-class inspection;
- cgroup / namespace / firewall inspection;
- any trusted observer implementation;
- Landlock changes;
- workspace-write K2 integration;
- network allowlists or dynamic egress;
- credential proxy/vault/broker integration;
- external-process `ask` re-enable;
- K2 gateway changes;
- receipt changes;
- Done Gate changes;
- H4 closure;
- H6 work.

Each requires later explicit authorization.

---

## 29. Maximum bounded claim after later proof

If a future R3B implementation passes complete pre-ledger and post-ledger gates, the maximum claim is:

```text
KODAC_SANDBOX_BACKEND_REQUIREMENT_OBSERVATION_EVIDENCE_CONTRACT_PROVEN
```

Meaning only:

```text
Kodac has a deterministic pure contract that binds an exact validated R3A
workload requirement to a backend capability declaration and supplied
observation, rejecting runtime/source/network/resource/credential/downgrade
mismatches under fixed normative identity encodings.
```

It does **not** mean:

```text
Docker confinement proven
OpenSandbox integration proven
gVisor confinement proven
Kata / Firecracker confinement proven
backend observations trusted
physical network isolation proven
external process execution authorized
external-process ask enabled
workspace-write K2 integration proven
H4 complete
H6 authorized
```

---

## 30. Expected later sequence

If R3B later becomes canonical/proven, the next slice must still be separately authorized.

A likely next candidate is one **single physical backend observation adapter**, potentially Linux Docker + gVisor, but this document does not authorize that choice.

A later adapter must independently prove at minimum:

```text
exact immutable image digest observed
exact semantic runtime class observed
no runtime downgrade
exact deny-all network-policy identity observed
resource translation + observed provider-neutral policy proven
exact execution instance bound to R3A workload identity
trusted observer implementation identity
fail closed when any required fact is unavailable
```

---

## 31. Final authorization boundary

```text
AUTHORIZED AFTER THIS DOCUMENT BECOMES CANONICAL:
PURE PROVIDER-NEUTRAL REQUIREMENT / CAPABILITY / OBSERVATION / EVIDENCE CONTRACT ONLY

NOT AUTHORIZED:
ANY BACKEND EXECUTION OR OBSERVATION
ANY OPENSANDBOX / DOCKER / KUBERNETES DEPENDENCY
ANY K2 / APPROVAL / RECEIPT / DONE-GATE MUTATION
ANY EXTERNAL-PROCESS ask RE-ENABLE
ANY H4 CLOSURE CLAIM
ANY H6 WORK
```

This boundary converts the donor differential into a deterministic evidence theorem without importing the donor's server-global authority model or mistaking configuration/status for execution truth.
