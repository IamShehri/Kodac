# KDO-H4-R3B — Sandbox Backend Capability / Execution Evidence Contract

Date: 2026-08-15
Status: POST-LEDGER CERTIFICATION PENDING

## 1. Evidence decision

```text
GATE:
KDO-H4-R3B

PRE-LEDGER DECISION:
PASS

ACCEPTED PRE-LEDGER HEAD:
670bbda9f962602c22f3d02571450bd7bb996895

ACCEPTED PRE-LEDGER TREE:
d58a450bbb9046a744adecd9e46fada142f52583

BOUNDED TARGET:
PURE PROVIDER-NEUTRAL REQUIREMENT / CAPABILITY / SUPPLIED-OBSERVATION / EVIDENCE CONTRACT

EXECUTION AUTHORITY:
NONE

TRUSTED PHYSICAL BACKEND OBSERVATION:
NOT PROVEN / NOT IMPLEMENTED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

This ledger records the fresh accepted H4-R3B pre-ledger evidence.

It does not certify the ledger-bearing exact head. Fresh post-ledger certification remains mandatory.

---

## 2. Canonical base and authorization

Canonical implementation base:

```text
b12af0cfe0c726c53d4f04098404c8e749e66737
```

Canonical base tree:

```text
85a3ca09f4499ea6d031fde2760970b9d59774b0
```

Canonical H4-R3B authorization:

```text
docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_AUTHORIZATION_2026-08-15.md
blob 3f615a234d1435cf82135f4d4e9339e213549c99
```

Pinned canonical H4-R3A workload schema dependency:

```text
schema/kdo-h4-r3a-sandbox-workload.schema.json
blob b8f5b8b97a49e550bfe036b73d259b0826ec75bd
$id https://kodac.dev/schema/kdo-h4-r3a-sandbox-workload.schema.json
```

The authorization permits exactly four pre-ledger implementation paths and permits this ledger path only after one exact pre-ledger head passes the complete certification gate.

---

## 3. Historical diagnostic heads rejected as acceptance evidence

The following heads are historical diagnostics only and are explicitly not the accepted pre-ledger evidence:

```text
d7485430c33bf4bd3b6d54a2b4d02efe0b6e82e3
```

At that stage Qodo identified a valid runtime-class membership defect: prototype-chain names such as `toString` could be admitted by an inherited-property membership check. The production validation was corrected to own-property membership, and regression coverage was expanded.

```text
f2ba9acb995a9c64cd554fa39e27240d0fe7d514
```

This later head passed repository CI but CodeRabbit identified a valid focused-test defect: a string passed as the second argument to `assert.throws` was an assertion message rather than an error matcher, so three tamper assertions did not prove the intended failure class. The assertions were corrected with field-specific regular expressions in accepted head `670bbda9...`.

No diagnostic head above is used as the accepted pre-ledger certification identity.

---

## 4. External ledger-absence and changed-path proof

For exact accepted pre-ledger head:

```text
670bbda9f962602c22f3d02571450bd7bb996895
```

comparison against canonical base `b12af0c...` proves exactly four changed paths:

```text
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
```

The authorized evidence path:

```text
docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_2026-08-15.md
```

returned repository `404 Not Found` when read at exact accepted pre-ledger head `670bbda9...`.

Therefore:

```text
CHANGED PATHS = EXACT AUTHORIZED PRE-LEDGER 4 / 4:
PASS

LEDGER ABSENT BEFORE PRE-LEDGER PASS:
PASS — EXTERNAL EXACT-HEAD REPOSITORY-STATE EVIDENCE
```

No runtime test permanently requires this future ledger to be absent.

---

## 5. Accepted pre-ledger implementation blobs

```text
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
b9242c5cecc18fd43b2b80aeffd974ef5311fded

packages/kodac-runtime/src/index.ts
a3ca5a19e3a957514565256b4bfbf1957256d241

schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
e396f8d3bfd03e33736afb3163fdb75c4997ab7e

packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
a9eefac6ee159d2153c36d0abdcefa78f46f17ab
```

These four blobs are the immutable implementation/schema/test/index reference set that the ledger-only commit and fresh post-ledger certification must preserve byte-for-byte.

---

## 6. Contract versions, admitted runtime classes, and bounds

```text
Backend capability version:
kodac-h4-r3b-backend-capability-v1

Execution requirement version:
kodac-h4-r3b-execution-requirement-v1

Backend observation version:
kodac-h4-r3b-backend-observation-v1

Execution evidence version:
kodac-h4-r3b-execution-evidence-v1

Backend family:
oci-container

Credential mode:
none

Downgrade policy:
forbid
```

The only admitted semantic runtime classes are:

```text
gvisor
kata-firecracker
kata-qemu
```

Capability runtime arrays must be non-empty, unique, and strictly rank-increasing. The schema therefore admits exactly seven arrays:

```text
[gvisor]
[kata-firecracker]
[kata-qemu]
[gvisor, kata-firecracker]
[gvisor, kata-qemu]
[kata-firecracker, kata-qemu]
[gvisor, kata-firecracker, kata-qemu]
```

No `runc`, fallback, unknown, inherited prototype-chain name, duplicate, or permuted runtime-class sequence is admitted.

Provider identity grammar is lowercase ASCII only and bounded to 128 bytes.

---

## 7. Fixed normative identity vectors

The focused proof locks the authorization's literal vectors and does not derive expected values by calling the implementation under test.

```text
capabilityIdentity:
b23c759edd03197380e0c9e5a1382c364eba4ed68ec33cada226d6878248f7c1

requirementIdentity:
46a11674fd3d973204bdaa8aa140076b5e45b84c276cb66cbb453c0b0b4cbc7f

observationIdentity:
96031bfde14a9826978c7eb65f59463aab24d395b955bd5e07ea69c9d191dac7

evidenceIdentity:
baae3419934f5862c458e376999c2fe962ce2aca2745fd2a794e4007761c5e9f
```

Any implementation output that diverges from these vectors is non-conforming.

---

## 8. Requirement / capability / observation / evidence theorem

The accepted implementation proves this bounded flow only:

```text
validated canonical R3A workload
-> R3B execution requirement
-> backend capability declaration
-> supplied backend observation
-> deterministic exact evidence match
```

The requirement embeds and revalidates the full R3A workload and binds:

```text
workloadIdentity
source digest
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

Evidence creation independently validates requirement, capability, and observation, then fails closed unless:

- the capability supports every required observation family;
- the required runtime is present in the capability declaration;
- observation requirement/capability/workload identities match exactly;
- observed immutable source digest matches exactly;
- observed semantic runtime class equals the required class;
- observed deny-all network-policy identity matches exactly;
- observed resource-policy identity and all four numeric values match exactly;
- workload and observation credential bindings are null;
- downgrade policy is `forbid` and no downgrade occurred.

Validation success never means K2 permission, execution authorization, physical confinement proof, or Done Gate completion.

---

## 9. Full R3A revalidation and lineage proof

R3B does not accept an identity-only or partial workload representation.

The implementation invokes canonical R3A validators on the full nested workload, network policy, and resource policy. R3A therefore recomputes and rechecks workload lineage before R3B can construct requirement/evidence identities.

Focused tamper assertions explicitly bind each lineage failure to its actual canonical error:

```text
workloadIdentity
-> sandbox workload identity mismatch

executionIntentIdentity
-> executionIntentIdentity does not match confinement request

confinementRequestIdentity
-> confinementRequestIdentity does not match confinement request
```

Network-policy and resource-policy identity tampering likewise fails through canonical R3A recomputation before R3B evidence acceptance.

---

## 10. Hostile-input and prototype-chain closure

Runtime validation rejects hostile structural inputs including:

```text
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
invalid / oversized providerId
non-null credential binding
downgradeOccurred = true
```

Qodo identified a valid prototype-chain membership weakness in an earlier diagnostic implementation. Accepted production now uses own-property membership for the runtime-class rank map.

Regression tests explicitly reject prototype-chain labels including:

```text
toString
constructor
__proto__
```

across:

```text
capability.semanticRuntimeClasses
requiredSemanticRuntimeClass
observedSemanticRuntimeClass
```

The Qodo thread is resolved.

---

## 11. Schema pinning and parity

The R3B schema is pinned to:

```text
$schema:
https://json-schema.org/draft/2020-12/schema

$id:
https://kodac.dev/schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
```

The schema description pins the canonical R3A schema blob:

```text
b8f5b8b97a49e550bfe036b73d259b0826ec75bd
```

R3A references use the canonical local URI for:

```text
#/$defs/workload
#/$defs/networkPolicy
#/$defs/resourcePolicy
```

The focused proof confirms the repository R3A schema has that exact `$id` and that the R3B references resolve to the pinned local identity rather than a mutable remote definition.

The R3B schema enumerates the seven and only seven canonical runtime arrays; `["kata-qemu","gvisor"]`, duplicates, and `runc` are rejected by the declared acceptance set.

Runtime validation remains mandatory after structural schema validation because JSON Schema cannot model hostile JavaScript Proxy/accessor/prototype/symbol semantics.

---

## 12. Production purity and protected authority surfaces

The new production module imports exactly:

```text
node:crypto
node:util
./sandbox-workload.ts
```

It has no filesystem, network, process, registry, Docker, OpenSandbox, Kubernetes, K2, approval, receipt, Done Gate, or backend execution dependency.

The accepted focused suite proves these canonical protected authority blobs remain byte-identical:

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

---

## 13. Review findings and closure

### Qodo

Valid high/security finding:

```text
prototype-chain runtime-class membership bypass
```

Disposition:

```text
FIXED
REGRESSION COVERAGE ADDED ACROSS CAPABILITY / REQUIREMENT / OBSERVATION
THREAD RESOLVED
```

### CodeRabbit

Valid functional-correctness finding on diagnostic head `f2ba9ac...`:

```text
assert.throws second string argument was an assertion message rather than an error matcher
```

Disposition on accepted head:

```text
FIXED IN 670bbda9f962602c22f3d02571450bd7bb996895
FIELD-SPECIFIC REGEXP MATCHERS ADDED
THREAD RESOLVED
THREAD OUTDATED AFTER FIX
CODERABBIT STATUS SUCCESS
```

CodeRabbit additionally noted that evidence hashes establish deterministic consistency rather than authenticated backend provenance. That is an explicit R3B non-claim, not a contradiction: R3B has no trusted observer implementation and no physical backend proof authority.

Current actionable review state:

```text
unresolved actionable threads:
0

CodeRabbit exact-head status:
SUCCESS

manual exact-head security / authority review:
PASS
```

---

## 14. Fresh pre-ledger CI on accepted exact head

Accepted exact head:

```text
670bbda9f962602c22f3d02571450bd7bb996895
```

### Governance / provenance / legacy

```text
workflow run:
31902812930

provenance job:
95056047004 — PASS

legacy-tests job:
95056047094 — PASS
pytest PASS
ruff PASS
```

### K2 runtime regression / classifier

```text
workflow run:
31902812921

runtime-change-classifier:
95056046988 — PASS

Ubuntu runtime:
95056059033 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

Windows runtime:
95056059065 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

macOS runtime:
95056059076 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

k2-runtime-gate:
95056144070 — PASS
```

The K2 workflow is regression/classifier evidence only. It does not grant R3B execution authority.

### K3-R4

```text
workflow run:
31902812920

job:
95056047008 — PASS
```

### K3-R5

```text
workflow run:
31902812928

job:
95056047042 — PASS
```

### Review

```text
CodeRabbit:
SUCCESS

Qodo valid finding:
RESOLVED

CodeRabbit valid finding:
RESOLVED / OUTDATED AFTER FIX

unresolved actionable review threads:
0

manual exact-head trust review:
PASS
```

---

## 15. Fresh pre-ledger gate result

```text
canonical base exact:
PASS

changed paths = authorized pre-ledger 4 / 4:
PASS

ledger absent by external exact-head evidence:
PASS

implementation / schema / focused-test scope:
PASS

protected authority blobs exact:
PASS

four normative identity vectors exact:
PASS

full R3A workload revalidation:
PASS

runtime-class canonical ordering:
PASS

prototype-chain regression closure:
PASS

source / network / resource exact-match rejection:
PASS

credential / downgrade fail-closed behavior:
PASS

hostile-input proof:
PASS

schema pinning / canonical runtime-array parity:
PASS

production purity:
PASS

Ubuntu Typecheck / Test / patch benchmark:
PASS

Windows Typecheck / Test / patch benchmark:
PASS

macOS Typecheck / Test / patch benchmark:
PASS

runtime-change-classifier / K2 aggregate:
PASS

governance / provenance / legacy:
PASS

K3-R4:
PASS

K3-R5:
PASS

CodeRabbit:
SUCCESS

unresolved actionable threads:
0

manual trust review:
PASS

PRE-LEDGER DECISION:
PASS
```

---

## 16. Post-ledger requirement

After this file is committed, the pre-ledger head above becomes historical acceptance evidence.

The ledger-bearing exact head must independently prove:

```text
changed paths = authorized 1-5 only
ledger present at exact authorized path
ledger commit delta = ledger path only
implementation blob unchanged = b9242c5cecc18fd43b2b80aeffd974ef5311fded
index blob unchanged = a3ca5a19e3a957514565256b4bfbf1957256d241
schema blob unchanged = e396f8d3bfd03e33736afb3163fdb75c4997ab7e
test blob unchanged = a9eefac6ee159d2153c36d0abdcefa78f46f17ab
protected authority blobs exact
all focused/full tests PASS
TypeScript PASS on all required OS jobs
patch benchmark PASS where applicable
runtime-change-classifier / K2 aggregate PASS
governance / provenance / legacy PASS
K3-R4 / K3-R5 PASS
CodeRabbit SUCCESS
unresolved actionable review threads = 0
manual exact-head authority review PASS
```

Post-ledger status at creation:

```text
PENDING
```

---

## 17. Explicit non-claims

R3B does not claim or authorize:

- Docker daemon/socket access;
- Docker SDK / dockerode;
- OpenSandbox server/SDK/dependency/call;
- Kubernetes integration;
- gVisor / Kata / Firecracker installation or invocation;
- container create/start/exec/kill/remove;
- image pull or registry resolution;
- provider-specific image/runtime/cgroup/namespace/firewall inspection;
- a trusted observer implementation;
- authenticated physical backend provenance;
- physical runtime confinement proof;
- physical deny-all network enforcement proof;
- resource translation/enforcement proof;
- Landlock changes;
- workspace-write K2 integration;
- dynamic egress allowlists;
- credential proxy/vault/broker;
- external-process `ask` re-enable;
- K2 gateway changes;
- approval changes;
- receipt changes;
- Done Gate changes;
- H4 closure;
- H6 work or authorization;
- `PROVEN_READY`.

A later physical backend observation adapter requires separate canonical authorization and proof.

---

## 18. Maximum bounded completion claim gate

Only after fresh post-ledger PASS and expected-head canonical merge may Kodac make the authorization's maximum bounded R3B claim:

```text
KODAC_SANDBOX_BACKEND_REQUIREMENT_OBSERVATION_EVIDENCE_CONTRACT_PROVEN
```

Meaning only that Kodac has a deterministic pure contract binding an exact validated R3A workload requirement to a backend capability declaration and supplied observation while rejecting runtime/source/network/resource/credential/downgrade mismatches under fixed normative identity encoding.

Until fresh post-ledger certification and canonical merge:

```text
CLAIM UNAVAILABLE
```
