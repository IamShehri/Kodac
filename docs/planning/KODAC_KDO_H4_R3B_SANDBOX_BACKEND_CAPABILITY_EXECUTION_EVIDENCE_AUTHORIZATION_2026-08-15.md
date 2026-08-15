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

BACKEND INTEGRATION / INSPECTION:
NONE

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

R3A binds an immutable OCI digest, canonical entrypoint, exact resource policy, deny-all network policy, canonical H4-R2A confinement request and lineage, null credentials, and one deterministic workload identity.

R3A intentionally grants no execution authority.

A later K2 path therefore needs a deterministic fail-closed contract that can express:

1. what the exact validated R3A workload requires;
2. what a backend declares it can support;
3. what a future trusted observer reports it observed;
4. whether those structures match exactly.

---

## 3. Canonical predecessor chain

### H4-R1 — one-shot approval

```text
packages/kodac-runtime/src/trust/approval.ts
d36a604cb1957bc65dac3978c626ba48a9b299fb
```

External-process `ask` remains blocked.

### H4-R2A — provider-neutral confinement request

```text
packages/kodac-runtime/src/trust/confinement.ts
873f235120645c0a12f10a5bff7e9591db6bb341
```

Required theorem:

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

```text
canonical merge:
b8281d08f91232cc2271ab7109fb2701ddd429a0

packages/kodac-runtime/src/trust/sandbox-workload.ts
84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8

docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_EVIDENCE_2026-08-15.md
9386b0220b25e8ac2aac1d9d3af9d07a150c452b
```

R3B must consume and revalidate the **full** canonical R3A workload object. It may not create a parallel workload identity format.

---

## 4. Historical authority-transition record

"Protected and byte-identical" in this authorization is relative to exact R3B base `b8281d08...`; it is not a claim that all protected files have been unchanged since H4-R2A.

Original H4-R2A authorization base `344c9616...` recorded:

```text
packages/kodac-runtime/src/execution/gateway.ts
8b481c226276d0b06fabc8d614c1295cd0881a6a

packages/kodac-runtime/src/evidence/receipt.ts
bc11267496f8c8a2ca1dac713baccf88ec962b19
```

H4-R2C later explicitly authorized and proved the K2 Linux Landlock read-only integration. Its accepted changed paths included both files, and its evidence records:

```text
packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/evidence/receipt.ts
214403398751c9d22bf695786c7fd7c6fd7e35e1
```

Those are authorized predecessor transitions, not unexplained drift.

`packages/kodac-runtime/src/agent/loop.ts` changed later under separately authorized H5 work. H5-R4B explicitly records its current blob:

```text
packages/kodac-runtime/src/agent/loop.ts
576ad425db7e845b9705c982e95dd4f7522f8c43
```

R3B grants no authority to repeat or extend those historical changes.

---

## 5. OpenSandbox pinned implementation differential

Donor:

```text
opensandbox-group/OpenSandbox

commit:
f8ed8734ce1fda69f0979f912160fb933b9bfa0c

tree:
cf033b4f880b7e84b563dcf7f63722582ea48762

license:
Apache-2.0

intake:
STUDY + REIMPLEMENT GENERIC CONTRACT IDEAS
```

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

Useful donor ideas include secure-runtime configuration, startup availability validation, host resource configuration, network-policy machinery, and lifecycle failure propagation.

Direct adoption is **NO-GO in R3B** because:

1. runtime selection is server-global instead of exact-workload-bound;
2. the donor design defaults to standard `runc` when secure runtime is unconfigured;
3. requested image URI is not proof of executed image digest;
4. `Running` is not observed proof of runtime/image/network/resource enforcement;
5. Docker host-config values are not automatically R3A resource semantics;
6. donor egress/credential machinery widens authority beyond R3B v1.

Decision:

```text
DIRECT OPENSANDBOX SERVER ADOPTION:
NO-GO

DIRECT DOCKER ADAPTER IN R3B:
NO-GO

PROVIDER-NEUTRAL CONTRACT FIRST:
GO
```

No OpenSandbox production code is copied and no donor dependency is added.

---

## 6. Core trust model

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

- **Requirement** = what Kodac requires for the exact validated R3A workload.
- **Capability declaration** = what a backend/adapter claims it can support; not execution proof.
- **Observation** = what a future observer claims it observed; R3B validates structure only and does not make the observer trusted.
- **Evidence** = deterministic matching of the three validated structures; not physical enforcement proof unless a later separately proven adapter establishes trustworthy observation.

A purpose-equivalent API named `proveSandboxIsSecure()` is forbidden.

---

## 7. Authorized implementation paths

If this authorization becomes canonical, exactly four pre-ledger paths are authorized:

```text
1. packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
2. packages/kodac-runtime/src/index.ts
3. schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
4. packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
```

Only after fresh pre-ledger PASS may this fifth path exist:

```text
5. docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_2026-08-15.md
```

No other path is authorized.

Ledger absence must be proven externally from exact repository state. A permanent runtime assertion that the future ledger is absent is forbidden.

---

## 8. Protected R3B-base blobs

The implementation must keep these exact base blobs byte-identical:

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

`src/index.ts` is the only existing production file authorized to change, solely for one additive export of the new pure R3B module.

---

## 9. Pure-module dependency boundary

Allowed production imports are limited to purpose-equivalents of:

```text
node:crypto
node:util
./sandbox-workload.ts
```

Explicitly prohibited:

```text
node:fs
node:child_process
node:net
node:http
node:https
Docker / dockerode
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

No filesystem, network, process, container, registry, credential, approval, K2, receipt, or Done-Gate side effect is authorized.

---

## 10. Mandatory version literals and fixed enums

These values are required exactly:

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

Forbidden as required runtime classes:

```text
runc
process-default
unknown
fallback
```

Provider-specific names such as Docker `runsc` or a Kubernetes RuntimeClass handler are not R3B authority.

---

## 11. Canonical runtime-class ordering

`semanticRuntimeClasses` is a dense, unique, non-empty plain array with 1 through 3 items.

Canonical rank is exactly:

```text
0 = gvisor
1 = kata-firecracker
2 = kata-qemu
```

An array is canonical only when each next item has a strictly larger rank.

No locale comparator, platform comparator, caller order, implicit `.sort()`, silent sorting, or deduplication is authoritative.

Literal multi-class vector:

```text
conceptual set:
{ kata-qemu, gvisor, kata-firecracker }

canonical serialized array:
["gvisor","kata-firecracker","kata-qemu"]
```

Permutations, duplicates, sparse arrays, array extra properties, and unknown classes fail closed.

---

## 12. Limits

Only `providerId` is a new free textual field. Every other new variable string is a fixed-size identity/digest or a closed enum.

```text
providerId:
1..128 ASCII bytes
pattern ^[a-z0-9][a-z0-9._-]{0,127}$

semanticRuntimeClasses:
1..3 items

implementationIdentity:
64 lowercase hex ASCII chars

observerIdentity:
64 lowercase hex ASCII chars

executionInstanceIdentity:
64 lowercase hex ASCII chars

capabilityIdentity / requirementIdentity / observationIdentity / evidenceIdentity:
64 lowercase hex ASCII chars each

observedSourceDigest:
"sha256:" + 64 lowercase hex ASCII chars
```

Nested R3A data must use R3A validators and exact R3A limits:

```text
maxRepositoryBytes = 512
maxExecutableBytes = 4096
maxArgs = 256
maxArgBytes = 8192
maxArgsBytes = 65536
maxCpuMillis = 256000
maxMemoryBytes = 1099511627776
maxTtlMs = 86400000
maxOutputBytes = 16777216
```

R3B may not silently redefine those nested semantics.

---

## 13. Normative identity encoding

All four R3B identities use one byte-level algorithm.

For `DOMAIN`, prefix bytes are exactly:

```text
ASCII("KODAC-H4-R3B")
|| 0x00
|| ASCII(DOMAIN)
|| 0x00
|| ASCII("V1")
|| 0x00
```

Required domains:

```text
BACKEND_CAPABILITY
EXECUTION_REQUIREMENT
BACKEND_OBSERVATION
EXECUTION_EVIDENCE
```

Payload is UTF-8 of one compact JSON object whose keys occur in the exact order specified in §§14–17.

Normative serialization:

```text
no BOM
no whitespace outside JSON strings
keys exactly in specified order
JSON double-quoted strings
all R3B preimage strings ASCII by grammar / fixed identity-digest format
arrays preserve explicitly defined canonical order
booleans exactly true / false
null exactly null
integers base-10 ASCII with no leading zero except 0
no exponent / no fraction
all numbers Number.isSafeInteger and within inherited R3A bounds
```

Identity:

```text
lowercase_hex(SHA256(prefix || payload_utf8))
```

Pretty JSON, reordered keys, omitted `null`, provider-native objects, or alternate numeric spelling are invalid preimages.

---

## 14. Backend capability declaration

Purpose-equivalent type:

```text
SandboxBackendCapabilityDeclaration
```

Exact fields:

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

Fixed values:

```text
backendFamily = oci-container
credentialMode = none
downgradePolicy = forbid
```

Capability booleans may truthfully be false. An insufficient capability is valid descriptive data; evidence creation must then fail closed.

`providerId` is descriptive identity only.

`implementationIdentity` is inert SHA-256 fixture/data in R3B; a later slice must prove what implementation artifact it identifies.

Capability preimage key order is exactly the field order above excluding `capabilityIdentity`.

---

## 15. Execution requirement — full R3A input only

Purpose-equivalent type:

```text
SandboxExecutionRequirement
```

Construction input is exactly:

```text
full SandboxWorkloadRequest
requiredSemanticRuntimeClass
```

The workload must pass `validateSandboxWorkloadRequest` first.

R3B does not authorize lookup, network resolution, registry resolution, identity-only input, or partial workload input.

Constructor input must reject caller-supplied duplicate fields such as:

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

All are derived only from the revalidated nested R3A workload.

Resulting requirement fields:

```text
version
workload
requiredSemanticRuntimeClass
downgradePolicy = forbid
requirementIdentity
```

Requirement preimage exact key order:

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

All but required runtime and fixed downgrade policy are derived from the validated workload. Credential binding is exactly null.

---

## 16. Backend observation

Purpose-equivalent type:

```text
SandboxBackendObservation
```

R3B validates supplied structure only; it does not perform observation or trust an observer.

Exact fields:

```text
version
requirementIdentity
workloadIdentity
capabilityIdentity
observerIdentity
executionInstanceIdentity
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicy
observedResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
observationIdentity
```

`observedNetworkPolicy` is a full R3A `SandboxNetworkPolicy`. It must pass `validateSandboxNetworkPolicy`, be deny-all, and have a recomputed identity.

`observedResourcePolicy` is a full R3A `SandboxResourcePolicy`. It must pass `validateSandboxResourcePolicy`, including all four exact numeric values and recomputed identity.

Required values:

```text
observedCredentialBindingIdentity = null
downgradeOccurred = false
```

This explicitly binds the observed deny-all **network-policy identity**. A status string such as `Running`, `started`, or `healthy` is never a substitute.

Observation preimage exact key order:

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

Network/resource identities and values are derived only from the revalidated nested observed policy objects.

---

## 17. Execution evidence

Purpose-equivalent type:

```text
SandboxExecutionEvidence
```

Construction input contains the full validated:

```text
requirement
capability
observation
```

Result fields:

```text
version
requirement
capability
observation
evidenceIdentity
```

Creation/validation fails unless all are exact:

1. full R3A workload revalidates;
2. requirement identity recomputes;
3. capability identity recomputes;
4. required runtime is in the canonical capability array;
5. all six v1 observation-support booleans are true;
6. observation requirement identity equals requirement identity;
7. observation capability identity equals capability identity;
8. observation workload identity equals validated workload identity;
9. observed source digest equals workload source digest;
10. observed runtime equals required runtime;
11. observed network policy revalidates and identity equals workload network-policy identity;
12. observed resource policy revalidates and identity **and all four values** equal workload resource policy;
13. observed credential binding is null;
14. downgrade policy is `forbid` and `downgradeOccurred` is false;
15. every nested identity recomputes;
16. unknown fields fail exact-key validation.

Mismatch means throw/reject. There is no partial success, warning compatibility, weaker runtime, or fallback.

Evidence preimage exact key order:

```text
version
requirementIdentity
capabilityIdentity
observationIdentity
```

All three nested identities must be freshly revalidated before evidence hashing.

---

## 18. Fixed normative identity vectors

These are specification constants. Future tests must assert the literals rather than derive expected values from implementation output.

### R3A fixture inputs

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

### Capability vector

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

### Requirement vector

```text
requiredSemanticRuntimeClass = gvisor

requirementIdentity:
46a11674fd3d973204bdaa8aa140076b5e45b84c276cb66cbb453c0b0b4cbc7f
```

### Observation vector

```text
observerIdentity = dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd
executionInstanceIdentity = eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee
observed source/network/resource = exact fixture values
observedSemanticRuntimeClass = gvisor
observedCredentialBindingIdentity = null
downgradeOccurred = false

observationIdentity:
96031bfde14a9826978c7eb65f59463aab24d395b955bd5e07ea69c9d191dac7
```

### Evidence vector

```text
evidenceIdentity:
baae3419934f5862c458e376999c2fe962ce2aca2745fd2a794e4007761c5e9f
```

If implementation output differs, implementation must be corrected; vectors must not be regenerated to fit it.

---

## 19. Resource, network, credential, and downgrade rules

R3B must not invent provider-specific equivalence such as:

```text
R3A cpuMillis == Docker nano_cpus
```

Requirement binds exact validated R3A policy. Observation carries the same provider-neutral policy structure. Matcher requires exact identity and numeric equality. A later adapter must prove provider translation separately.

Network v1 admits only full validated R3A deny-all policy and exact matching network-policy identity.

Credentials v1 are exactly:

```text
capability credentialMode = none
workload credentialBindingIdentity = null
observation observedCredentialBindingIdentity = null
```

No-downgrade theorem:

```text
required runtime unavailable => fail closed
observed runtime != required runtime => fail closed
backend lacks required runtime => fail closed
required observation capability false => fail closed
downgradeOccurred = true => fail closed
```

No `runc` fallback exists in R3B.

---

## 20. Hostile-input and immutability requirements

Runtime validation must reject at minimum:

```text
null / primitive where record required
Proxy objects
custom prototypes
accessors
non-enumerable semantic fields
symbol fields
unknown keys
undefined required values
sparse arrays
array extra properties
duplicate runtime classes
non-canonical runtime-class order
invalid SHA-256 identities
invalid sha256: digests
oversized / non-ASCII providerId
non-safe integers in observed nested resource policy
unknown / runc / fallback runtime
non-null credential binding
downgradeOccurred = true for evidence acceptance
```

Constructors must detach caller arrays and freeze returned structures. Nested R3A validators must be called even if inputs are already frozen.

---

## 21. JSON Schema requirements — acceptance must match runtime ordering

Schema dialect is pinned exactly:

```text
$schema = https://json-schema.org/draft/2020-12/schema
```

R3B schema identifier is pinned exactly:

```text
$id = https://kodac.dev/schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
```

Canonical R3A schema dependency is:

```text
repository path:
schema/kdo-h4-r3a-sandbox-workload.schema.json

canonical R3B-base blob:
b8f5b8b97a49e550bfe036b73d259b0826ec75bd

canonical schema id:
https://kodac.dev/schema/kdo-h4-r3a-sandbox-workload.schema.json

workload reference:
https://kodac.dev/schema/kdo-h4-r3a-sandbox-workload.schema.json#/$defs/workload
```

Repository schema validation must deterministically register/map that canonical URI to the pinned repository schema above; it must not fetch a mutable remote schema over the network.

`semanticRuntimeClasses` schema acceptance must exactly enforce rank-increasing canonical arrays. Because v1 has only three runtime classes, the schema must enumerate the seven and only seven valid non-empty arrays, purpose-equivalent to:

```json
[
  ["gvisor"],
  ["kata-firecracker"],
  ["kata-qemu"],
  ["gvisor", "kata-firecracker"],
  ["gvisor", "kata-qemu"],
  ["kata-firecracker", "kata-qemu"],
  ["gvisor", "kata-firecracker", "kata-qemu"]
]
```

A schema that merely uses `enum` + `minItems` + `maxItems` + `uniqueItems` but accepts `["kata-qemu","gvisor"]` is non-conforming.

The schema must also enforce:

- exact version literals;
- exact required properties;
- `additionalProperties: false` throughout semantic records;
- identity/digest patterns;
- providerId ASCII pattern + `maxLength: 128` (ASCII grammar makes character count equal byte count);
- fixed backend/credential/downgrade literals;
- full R3A workload reference above;
- full R3A network/resource policy shapes or deterministic refs to the pinned R3A schema definitions;
- inherited R3A numeric maxima;
- observation credential null;
- `downgradeOccurred: false` in a structurally acceptable evidence observation.

**Runtime validation remains mandatory after schema validation and before any identity construction.** Schema acceptance alone is never authority and cannot model Proxy/accessor/prototype/symbol/sparse-array semantics.

---

## 22. Focused proof requirements

The focused test must assert all four §18 literal identities explicitly:

```text
capabilityIdentity =
b23c759edd03197380e0c9e5a1382c364eba4ed68ec33cada226d6878248f7c1

requirementIdentity =
46a11674fd3d973204bdaa8aa140076b5e45b84c276cb66cbb453c0b0b4cbc7f

observationIdentity =
96031bfde14a9826978c7eb65f59463aab24d395b955bd5e07ea69c9d191dac7

evidenceIdentity =
baae3419934f5862c458e376999c2fe962ce2aca2745fd2a794e4007761c5e9f
```

Expected identities must never be calculated by calling the implementation under test.

Additional focused proofs must cover:

### Happy path

- full R3A workload revalidates;
- sufficient capability validates;
- all four literal vectors match;
- returned records/collections are frozen.

### Requirement-source integrity

- identity-only/partial workload input is not accepted;
- duplicate caller identity/digest/policy fields fail;
- nested R3A tampering fails before R3B acceptance.

### Runtime and canonical ordering

Each independently fails:

```text
required gvisor / observed kata-qemu
required kata-firecracker / observed gvisor
runc required
fallback required
unknown runtime
permuted capability runtime array
schema validation of ["kata-qemu","gvisor"]
```

### Source

- one-hex-digit observed digest mismatch fails;
- non-sha256 digest fails.

### Network

- wrong network-policy identity fails;
- tampered nested network policy fails R3A revalidation;
- any non-deny-all shape fails.

### Resource

Each of cpuMillis, memoryBytes, ttlMs, maxOutputBytes is independently tampered and rejected; forged resource identity fails recomputation.

### Capability insufficiency

Each required support boolean false independently blocks evidence.

### Credentials / downgrade

Non-null credential binding and downgrade true fail.

### Lineage

Tampering workloadIdentity, executionIntentIdentity, confinementRequestIdentity, networkPolicyIdentity, or resourcePolicyIdentity fails through R3A/R3B validation.

### Hostile shapes

Proxy/accessor/symbol/prototype/unknown-field/sparse-array cases fail before semantic acceptance.

### Purity and protected blobs

The new production module has no prohibited authority/backend import. Protected base blobs remain exact where repository-test conventions support this without creating a ledger-lifecycle contradiction.

No runtime test may permanently require the future R3B evidence ledger to be absent.

---

## 23. Historical regression assertion audit

Authorization-time search found no current historical test that permanently byte-pins `src/index.ts` in conflict with an additive R3B export.

No historical-test reconciliation path is authorized.

If full CI exposes a genuine conflicting historical assertion, implementation must stop and use separate docs-only reconciliation before changing that test.

No skip, `.only`, `.todo`, deletion, weakened assertion, or CI-only conditional is authorized.

---

## 24. Pre-ledger certification gate

Before ledger creation, one exact head must prove:

```text
CHANGED PATHS:
exactly 4 / 4 authorized pre-ledger paths

LEDGER:
absent — external exact-head repository-state proof

TYPECHECK:
PASS all required OS jobs

FULL TESTS:
PASS all required OS jobs

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

PROTECTED BASE BLOBS:
byte-identical

MANUAL TRUST REVIEW:
PASS
```

The existing K2 workflow is a **non-authorizing regression/classifier gate**. CI may compile/test existing K2 code and enforce repository runtime-change rules. R3B production code remains forbidden from importing, invoking, mutating, or extending K2 execution. No backend execution is authorized by the CI gate.

Only after this exact-head gate passes may the evidence ledger be created.

---

## 25. Ledger and post-ledger gate

Only after pre-ledger PASS may this path be added:

```text
docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_2026-08-15.md
```

The ledger commit must be ledger-only.

It may record pre-ledger facts but must mark post-ledger certification pending.

Across the ledger-only commit, implementation/schema/test/index blobs must remain byte-identical.

Fresh post-ledger certification on the ledger-bearing head must rerun full required CI, existing K2 regression/classifier, applicable K3 regression, governance/provenance/legacy, review state, and manual trust review.

The K2 item remains regression checking only; it grants no R3B execution authority.

---

## 26. Explicit non-authority

R3B does **not** authorize:

- Docker daemon/socket access;
- Docker SDK / dockerode;
- OpenSandbox server/SDK;
- Kubernetes integration;
- gVisor / Kata / Firecracker installation or invocation;
- container create/start/exec/kill/remove;
- image pull or registry resolution;
- `RepoDigests` / runtime-class / cgroup / namespace / firewall inspection;
- a trusted observer implementation;
- Landlock changes;
- workspace-write K2 integration;
- dynamic network allowlists/egress;
- credential proxy/vault/broker;
- external-process `ask` re-enable;
- K2 gateway changes;
- receipt changes;
- Done Gate changes;
- H4 closure;
- H6 work.

Each requires later explicit authorization.

---

## 27. Maximum bounded claim after later proof

If a future R3B implementation passes complete pre-ledger and post-ledger gates, the maximum claim is:

```text
KODAC_SANDBOX_BACKEND_REQUIREMENT_OBSERVATION_EVIDENCE_CONTRACT_PROVEN
```

Meaning only:

```text
Kodac has a deterministic pure contract that binds an exact validated R3A
workload requirement to a backend capability declaration and supplied
observation, rejecting runtime/source/network/resource/credential/downgrade
mismatches under fixed normative identity encoding.
```

It does **not** mean:

```text
Docker confinement proven
OpenSandbox integration proven
gVisor / Kata / Firecracker confinement proven
backend observations trusted
physical network isolation proven
external process execution authorized
external-process ask enabled
workspace-write K2 integration proven
H4 complete
H6 authorized
```

---

## 28. Expected later sequence

If R3B later becomes canonical/proven, one physical backend observation adapter may be separately considered. Linux Docker + gVisor is a possible candidate, not an authorization.

A later adapter must independently prove at minimum:

```text
exact immutable image digest observed
exact semantic runtime class observed
no downgrade
exact deny-all network-policy identity observed
resource translation + provider-neutral observation proven
execution instance bound to exact R3A workload identity
trusted observer implementation identity
fail closed when any required fact is unavailable
```

---

## 29. Final authorization boundary

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
