# KDO-H4-R3A — Attested Sandbox Workload Identity Contract Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H4-R3A

NAME:
ATTESTED SANDBOX WORKLOAD IDENTITY CONTRACT

CANONICAL BASE:
4ba80a0bfe7b8794003021f67b3e082b5053b1e5

CANONICAL BASE TREE:
a3a39706fa5bf313223001d9e65ca9a05faf1fdd

IMPLEMENTATION AUTHORITY IF THIS DOCUMENT BECOMES CANONICAL:
ONE PURE / INERT CONTENT-ADDRESSED SANDBOX WORKLOAD IDENTITY CONTRACT

EXECUTION AUTHORITY:
NONE

OPENSANDBOX SERVER / SDK / DEPENDENCY:
NOT AUTHORIZED

DOCKER / KUBERNETES / OCI REGISTRY CALL:
NOT AUTHORIZED

NETWORK / FILESYSTEM / CHILD PROCESS:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6:
NOT AUTHORIZED
```

R3A closes one structural prerequisite only:

```text
THE FUTURE WORKLOAD THAT A LATER K2 SANDBOX PATH MAY APPROVE / EXECUTE
MUST BE CONTENT-IDENTITY-BOUND BEFORE ANY APPROVAL OR BACKEND BOUNDARY.
```

R3A does not create or execute that future path.

---

## 2. Why R3A exists

Canonical H4-R1 currently refuses external-process one-shot approval because a path or executable name does not prove that the same executable bytes will run after an approval wait.

Canonical H4-R2C proves a strong Linux Landlock read-only ordering and K2 receipt lineage, but explicitly does not claim:

```text
target executable bytes are identity-proven
external-process ask is re-enabled
workspace-write is integrated into K2
H4 is complete
```

Canonical H4 readiness / OpenSandbox differential therefore identifies the decisive remaining trust gap as:

```text
CONTENT-IDENTITY-BOUND FUTURE WORKLOAD ACROSS APPROVAL / EXECUTION
```

R3A establishes that identity plane before a later backend integration is allowed to exist.

---

## 3. Canonical predecessor chain

### H4-R1 — one-shot approval

Evidence:

```text
docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md
```

Current approval module:

```text
packages/kodac-runtime/src/trust/approval.ts
d36a604cb1957bc65dac3978c626ba48a9b299fb
```

R3A may not change R1 approval semantics or re-enable external-process `ask`.

### H4-R2A — provider-neutral confinement contract

Evidence:

```text
docs/planning/KODAC_KDO_H4_R2A_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_EVIDENCE_2026-08-14.md
```

Current contract:

```text
packages/kodac-runtime/src/trust/confinement.ts
873f235120645c0a12f10a5bff7e9591db6bb341
```

R3A must reuse the existing theorem:

```text
requested confinement != observed enforcement
```

It may bind a validated confinement request identity; it may not reinterpret a requested mode as proof of enforcement.

### H4-R2B / R2C — Landlock primitive + K2 read-only execution binding

Current backend adapter:

```text
packages/kodac-runtime/src/trust/confinement-linux-landlock.ts
94b325f73246514f31b950ba4fed38023e3e3cfc
```

Current runtime evidence plane:

```text
packages/kodac-runtime/src/trust/confinement-runtime.ts
1ca0313fb25c62e549445ebcf1aef029b18e6b86
```

Current K2 gateway:

```text
packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560
```

R3A does not modify or invoke any of them.

### H4 readiness / OpenSandbox differential

Canonical merge:

```text
4ba80a0bfe7b8794003021f67b3e082b5053b1e5
```

Document:

```text
docs/planning/KODAC_KDO_H4_READINESS_OPENSANDBOX_DONOR_DIFFERENTIAL_AUDIT_2026-08-15.md
```

Blob:

```text
00fbcb55b66de686734a7a8dff27c953a73ce0f1
```

That audit authorizes no runtime code itself and recommends this R3A slice as the smallest next action.

---

## 4. OpenSandbox donor pin and intake mode

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

Root license:

```text
Apache-2.0
```

Root license blob:

```text
b09cd7856d58590578ee1a4f3ad45d1310a97f87
```

Primary references:

```text
specs/sandbox-lifecycle.yml
8564db4f8ef50434348b27cefe49bf2d11a9a323

docs/community/release-verification.md
13eaae323a8d196eb83b6f2b28a7cde863f7e31d

oseps/0004-secure-container-runtime.md
65d1ec76530b01c7f530a582ba1bbc7deb5c8b35

specs/egress-api.yaml
08e4885176998e854df62b999914c5eb01855308

docs/guides/credential-vault.md
435b18ed410018b4fc39d7c00933dd67290b6959
```

R3A intake mode:

```text
STUDY + REIMPLEMENT CONCEPTS
```

No OpenSandbox production source is copied by R3A.

No Apache-2.0 implementation code is imported.

The concepts admitted into R3A are limited to:

- immutable OCI digest as workload content identity;
- resource / TTL values as part of execution-request identity;
- network-policy identity;
- supply-chain attestation as separate evidence rather than content identity;
- required secure-runtime unavailability must fail closed in later integration.

Because R3A reimplements only generic structural concepts and imports no donor source, `THIRD_PARTY_NOTICES.md` is not an implementation path for this slice.

---

## 5. Authorized implementation paths

If this authorization becomes canonical, exactly these pre-ledger paths are authorized:

```text
1. packages/kodac-runtime/src/trust/sandbox-workload.ts
2. packages/kodac-runtime/src/index.ts
3. schema/kdo-h4-r3a-sandbox-workload.schema.json
4. packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
```

Only after pre-ledger PASS may this fifth path be created:

```text
5. docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_EVIDENCE_2026-08-15.md
```

No other path is authorized.

The evidence ledger must remain absent until the pre-ledger gate passes.

---

## 6. Protected authority surfaces

R3A implementation must keep these current canonical surfaces byte-identical:

```text
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

`src/index.ts` is the only existing production file authorized to change, solely to export the new pure contract.

---

## 7. Historical regression assertion audit

An authorization-time search found no current historical test that permanently byte-pins `src/index.ts` in a way that conflicts with this additive export.

R3A therefore authorizes **no historical test reconciliation path**.

If full CI later reveals an older test that truly forbids the newly authorized export, implementation must stop and create a docs-only governance correction before changing that historical test.

No test bypass, skip, deletion, `.only`, `.todo`, or CI-specific conditional is authorized.

---

## 8. R3A content-source scope

R3A admits exactly one executable workload source family:

```text
oci-image
```

Direct local executable paths are not admitted by this first workload contract.

Git repositories, tarballs, snapshots, mutable sandbox IDs, local directories, shell commands, PATH-resolved executables, and remote HTTP archives are not admitted sources.

Reason:

A direct path or mutable locator would recreate the exact identity gap R3A exists to close.

---

## 9. OCI source contract

The implementation should expose a deterministic immutable structure purpose-equivalent to:

```text
SandboxOciImageSource
```

with exact semantic fields:

```text
version
repository
digest
sourceIdentity
```

Recommended fixed version:

```text
kodac-h4-r3a-oci-image-source-v1
```

### 9.1 Digest requirement

`digest` must be exactly:

```text
sha256:<64 lowercase hex characters>
```

No other digest algorithm is admitted in v1.

A mutable tag alone is invalid.

The contract has no `tag` field.

A repository string containing `@digest`, a tag suffix intended to bypass the explicit digest field, or an otherwise ambiguous locator must fail closed.

### 9.2 Repository locator

`repository` is structural metadata identifying the OCI repository namespace only.

It is not content authority.

The repository locator must be bounded, NUL-free, canonical under the R3A grammar, and must not include:

- URI scheme;
- query;
- fragment;
- whitespace;
- `@` digest suffix;
- mutable tag syntax;
- traversal-like `.` / `..` path components;
- empty path components.

The exact initial grammar may conservatively support the normal lowercase OCI registry/repository subset required by focused fixtures rather than the entire Docker reference grammar.

### 9.3 Source identity

`sourceIdentity` must be a domain-separated SHA-256 identity over the fixed source version, canonical repository locator, and exact content digest.

Changing repository metadata or digest creates a different source identity.

The digest remains the actual content-addressing term; the source identity is a Kodac structural identity.

---

## 10. Entrypoint contract

R3A should expose a deterministic immutable entrypoint structure purpose-equivalent to:

```text
SandboxEntrypoint
```

with:

```text
version
executable
args
entrypointIdentity
```

Recommended fixed version:

```text
kodac-h4-r3a-entrypoint-v1
```

The executable must be an absolute canonical POSIX path inside the digest-bound image.

It must be NUL-free and byte-bounded.

`args` must be:

- an ordinary dense array;
- string-only;
- order-preserving;
- individually byte-bounded;
- aggregate byte-bounded;
- detached/frozen after validation.

No shell string is admitted.

No environment interpolation, shell expansion, command substitution, or PATH resolution is performed.

Because the complete image filesystem is content-addressed by the OCI digest, interpreter/script paths inside that immutable image are part of the image content identity. R3A still does not prove how a future backend resolves or executes them; that belongs to R3B evidence.

---

## 11. Resource policy contract

R3A should expose a closed deterministic resource structure purpose-equivalent to:

```text
SandboxResourcePolicy
```

with:

```text
version
cpuMillis
memoryBytes
ttlMs
maxOutputBytes
resourcePolicyIdentity
```

Recommended fixed version:

```text
kodac-h4-r3a-resource-policy-v1
```

All values must be positive safe integers within explicit implementation constants.

The implementation must publish and test hard upper bounds.

Recommended v1 ceilings:

```text
cpuMillis <= 256000
memoryBytes <= 1099511627776        # 1 TiB
ttlMs <= 86400000                  # 24 hours
maxOutputBytes <= 16777216          # 16 MiB
```

These are contract bounds, not promises that a backend can satisfy those maxima.

A later backend may support a stricter subset and fail closed.

Changing any resource value changes `resourcePolicyIdentity` and therefore the final workload request identity.

---

## 12. Network policy contract

R3A v1 admits exactly one network policy:

```text
deny-all
```

The purpose-equivalent structure is:

```text
SandboxNetworkPolicy
```

with:

```text
version
mode = "deny-all"
networkPolicyIdentity
```

Recommended version:

```text
kodac-h4-r3a-network-policy-v1
```

No host allowlist, wildcard, port rule, DNS rule, policy patch, or runtime widening is admitted in R3A.

A later egress slice may add narrowly authorized policies as new versioned contracts.

Changing network authority later must create a new K2-bound identity; an untrusted sandbox may never patch itself from deny-all to broader access.

---

## 13. Credential boundary

R3A v1 supports no credential injection.

The final workload request may carry the explicit structural value:

```text
credentialBindingIdentity = null
```

and must reject any non-null credential binding.

No secret bytes, environment values, tokens, API keys, secret-manager references, credential handles, or credential broker endpoints are admitted.

This deliberately defers OpenSandbox Credential Vault-style integration until network authority and secret brokering receive a separate authorization.

---

## 14. Confinement binding

The R3A workload constructor must accept and validate an existing canonical H4-R2A `ConfinementRequest` rather than inventing a second confinement vocabulary.

The resulting workload request must derive and bind at least:

```text
executionIntentIdentity
workspaceIdentity
confinementRequestIdentity
```

from that validated confinement request.

Caller-supplied duplicate values that could disagree with the validated R2A request should not be accepted.

This makes the final workload identity dependent on the exact requested confinement request while preserving:

```text
requested confinement != observed enforcement
```

R3A does not accept or create `ConfinementEnforcementEvidence` as proof of future execution.

---

## 15. Final workload request

The implementation should expose a deterministic immutable request purpose-equivalent to:

```text
SandboxWorkloadRequest
```

Recommended version:

```text
kodac-h4-r3a-sandbox-workload-v1
```

Required semantic fields:

```text
version
source
entrypoint
resourcePolicy
networkPolicy
executionIntentIdentity
workspaceIdentity
confinementRequestIdentity
credentialBindingIdentity = null
workloadIdentity
```

`workloadIdentity` must be a domain-separated SHA-256 identity over the entire canonical structural request excluding only its derived identity field.

Changing any of the following must produce a different workload identity:

- OCI repository;
- OCI digest;
- executable;
- argument bytes/order;
- CPU ceiling;
- memory ceiling;
- TTL;
- output bound;
- network policy;
- execution intent;
- workspace identity;
- confinement request identity;
- any future credential-binding identity in a later version.

The request contains no backend selection and no observed enforcement result.

---

## 16. Attestation-reference contract

The word `attested` in R3A does **not** mean that R3A verifies Sigstore, GitHub OIDC, registry signatures, certificates, transparency logs, or provenance statements.

R3A may additionally expose an inert deterministic structural reference purpose-equivalent to:

```text
SandboxWorkloadAttestationReference
```

with semantic fields:

```text
version
workloadIdentity
subjectDigest
attestationKind
attestationDigest
issuer
producerIdentity
attestationReferenceIdentity
```

Recommended version:

```text
kodac-h4-r3a-workload-attestation-ref-v1
```

Initial `attestationKind` may be exactly:

```text
sigstore-bundle
```

`subjectDigest` must equal the exact OCI source digest of the workload being referenced.

`attestationDigest` must itself be content-addressed as `sha256:<64hex>`.

`issuer` and `producerIdentity` are bounded inert strings.

The reference is **not included in `workloadIdentity`** because content identity must not change based on which provenance statement is later attached to the same bytes.

The attestation reference may bind to a workload; it may not replace or override the workload's source digest.

Creating or validating the reference performs no signature, network, filesystem, certificate, registry, transparency-log, or OIDC verification.

A later integration may verify a referenced attestation and record separate trusted evidence.

---

## 17. Domain-separated identities

R3A must use explicit domain separation for every structural identity family.

Equivalent domains should exist for:

```text
OCI_SOURCE
ENTRYPOINT
RESOURCE_POLICY
NETWORK_POLICY
WORKLOAD
ATTESTATION_REFERENCE
```

The exact byte preimages must be documented in source/tests and frozen by fixed vectors.

Concatenation ambiguity must be impossible through explicit length-prefixing or canonical structural serialization.

No identity may depend on:

- timestamps;
- random UUIDs;
- process IDs;
- object insertion order;
- host paths outside admitted fields;
- environment variables;
- registry lookup results;
- network responses.

---

## 18. Structural validation rules

All authority-relevant R3A structures must fail closed on hostile JavaScript shapes.

At minimum, constructors/validators must reject:

- Proxy-backed objects before reflective traps execute;
- Proxy-backed arrays before traps execute;
- non-plain objects;
- class instances;
- accessors/getters/setters;
- symbol fields;
- hidden/non-enumerable fields;
- sparse arrays;
- unexpected array properties;
- undefined values;
- unknown fields;
- malformed identities;
- unknown versions;
- malformed UTF-8-bound strings;
- NUL-containing strings;
- over-bound arrays/strings.

Values must be defensively detached and deeply frozen.

Caller mutation after construction must not alter accepted R3A evidence.

---

## 19. Explicit bounds

The implementation must expose constants and focused tests for every admitted variable-length surface.

At minimum:

```text
OCI repository bytes
entrypoint executable bytes
argument item count
argument bytes per item
aggregate argument bytes
issuer bytes
producer identity bytes
all resource numeric maxima
```

Recommended initial string/collection ceilings:

```text
repository <= 512 UTF-8 bytes
executable <= 4096 UTF-8 bytes
args <= 256 entries
one arg <= 8192 UTF-8 bytes
aggregate args <= 65536 UTF-8 bytes
issuer <= 2048 UTF-8 bytes
producerIdentity <= 2048 UTF-8 bytes
```

No truncation is allowed.

Limit + 1 must fail closed.

---

## 20. JSON Schema

R3A must publish:

```text
schema/kdo-h4-r3a-sandbox-workload.schema.json
```

The schema must cover the externally representable R3A structures and closed vocabularies.

It must use:

- `additionalProperties: false`;
- exact required fields;
- digest/identity patterns;
- closed enum/version strings;
- array item/count bounds where structurally expressible;
- integer ceilings where expressible;
- explicit null credential field for v1.

Runtime validation remains authoritative for UTF-8 byte limits, Proxy/accessor rejection, canonical repository/path grammar, deep immutability, and derived identity recomputation.

JSON Schema character `maxLength` must not be presented as equivalent to runtime UTF-8 byte bounds.

---

## 21. Production purity

The new R3A module is a pure structural identity/validation primitive.

Permitted imports are limited to purpose-equivalent deterministic/introspection support:

```text
node:crypto
node:path
node:util
./confinement.ts
```

The module must not import or invoke:

```text
node:fs
node:fs/promises
node:child_process
node:http
node:https
node:net
node:tls
process.env
fetch
Docker
Kubernetes
OpenSandbox SDK
registry client
cosign
sigstore
GitHub API
RuntimeSession
EventSink
ExecutionGateway
PolicyEngine
ApprovalService
RuntimeOrchestrator
ToolRegistry
ProviderRegistry
DoneGate
```

It creates no files, processes, sockets, sandboxes, containers, virtual machines, network policies, credentials, approvals, receipts, or events.

---

## 22. No execution or approval authority

R3A must not:

- execute a workload;
- resolve an OCI tag;
- pull an image;
- inspect a registry;
- verify an image exists;
- verify image bytes;
- verify an attestation;
- choose a sandbox backend;
- claim a runtime is available;
- create a sandbox;
- start Docker/Kubernetes;
- approve a K2 intent;
- re-enable external-process `ask`;
- grant network access;
- inject a credential;
- create confinement enforcement evidence;
- create a K2 execution receipt;
- change Done Gate.

A structurally valid `SandboxWorkloadRequest` means only:

```text
THE PROPOSED FUTURE WORKLOAD HAS A DETERMINISTIC CONTENT-ADDRESSED REQUEST IDENTITY.
```

It does not mean the source exists, is safe, is signed, is allowed, is sandboxed, or was executed.

---

## 23. Required focused tests

The focused R3A suite must prove at minimum:

1. canonical authorization base/tree and audit predecessor identities are exact;
2. OpenSandbox donor commit/tree/license/reference blobs are pinned exactly;
3. production changed paths before ledger are within paths 1-4 only;
4. ledger is absent before pre-ledger PASS;
5. all protected authority blobs from section 6 are exact;
6. OCI source fixed version is exact;
7. only `sha256:<64 lowercase hex>` digest is accepted;
8. uppercase/malformed/short/long/non-sha256 digests fail closed;
9. repository locator is bounded and canonical;
10. repository locators containing a mutable tag form fail closed;
11. repository locator containing `@digest` fails closed;
12. URI scheme/query/fragment/whitespace/traversal/empty components fail closed;
13. source identity is deterministic with a fixed vector;
14. source digest change changes source identity;
15. entrypoint version is exact;
16. executable must be canonical absolute POSIX and NUL-free;
17. relative/non-canonical executable fails closed;
18. args preserve order and bytes exactly;
19. sparse/accessor/symbol/hidden/Proxy args fail closed without hooks;
20. argument item/per-item/aggregate byte bounds pass at limit and fail at limit + 1;
21. entrypoint identity has a fixed vector;
22. resource policy version is exact;
23. each numeric resource is a positive safe integer;
24. every published numeric upper bound fails at max + 1;
25. resource policy identity fixed vector is exact;
26. changing any resource changes resource identity;
27. network policy version is exact;
28. only `deny-all` is admitted;
29. no rule list/runtime patch authority exists in v1;
30. network identity fixed vector is exact;
31. constructor validates a canonical H4-R2A confinement request;
32. derived executionIntent/workspace/confinement request identities equal that validated request;
33. malformed/tampered confinement request fails closed;
34. workload version is exact;
35. credentialBindingIdentity is exactly null;
36. any non-null credential binding fails closed;
37. workload identity fixed vector is exact;
38. OCI digest change changes workload identity;
39. repository change changes workload identity;
40. executable change changes workload identity;
41. argument byte/order change changes workload identity;
42. resource change changes workload identity;
43. network change is not representable beyond deny-all in v1;
44. different execution intent changes workload identity;
45. different workspace/confinement request changes workload identity;
46. workload constructor output is deeply immutable/detached;
47. caller mutation after construction cannot alter workload evidence;
48. workload validation recomputes all derived identities and rejects tampering;
49. unknown workload/source/entrypoint/resource/network fields fail closed;
50. hostile Proxy/accessor objects are rejected before hooks execute;
51. attestation-reference version/kind are exact;
52. attestation subject digest must equal the bound workload source digest;
53. attestation digest is content-addressed SHA-256;
54. attestation reference identity fixed vector is exact;
55. changing attestation reference does not change workload identity;
56. attestation reference cannot override the workload source digest;
57. attestation validation performs no signature/network/filesystem operation;
58. schema closed shapes/versions/digest patterns/count bounds match runtime structure;
59. schema does not misrepresent character maxLength as UTF-8 byte proof;
60. production R3A import surface is limited to section 21;
61. production source contains no filesystem/process/network/ambient-env/OpenSandbox/Docker/K8s authority;
62. `approval.ts`, confinement modules, gateway, receipt, Done Gate, loop, package, scripts, notices remain exact;
63. index exports only the additive R3A module change required by this slice;
64. TypeScript typecheck PASS;
65. full runtime regression suite PASS on Ubuntu/Windows/macOS;
66. K2 runtime classifier/gate PASS;
67. governance/provenance/legacy PASS;
68. K3-R4/R5 PASS if triggered, otherwise exact-head path-filter `NOT_APPLICABLE` proof;
69. all reviewer findings adjudicated;
70. unresolved review threads = 0;
71. manual exact-head security/authority review PASS.

---

## 24. Pre-ledger gate

Before the evidence ledger may be created:

```text
changed paths ⊆ authorized paths 1-4
ledger absent
protected blobs exact
all fixed identity vectors exact
strict hostile-input proofs PASS
all explicit bounds PASS
schema parity PASS
production purity PASS
TypeScript typecheck PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy PASS
K3-R4/R5 PASS or exact path-filter NOT_APPLICABLE proof
review findings adjudicated
unresolved review threads = 0
manual exact-head security/authority review PASS
```

Any earlier candidate invalidated by a defect is diagnostic only and must not be reused as acceptance evidence.

---

## 25. Evidence ledger

Only after pre-ledger PASS may this path be added:

```text
docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_EVIDENCE_2026-08-15.md
```

The ledger must bind at minimum:

- canonical authorization/base identities;
- H4 readiness audit identity;
- OpenSandbox donor pins and intake mode;
- accepted pre-ledger head/tree;
- implementation/test/schema blobs;
- all protected authority blobs;
- exact version vocabulary;
- explicit runtime bounds;
- OCI/source fixed vectors;
- entrypoint/resource/network/workload fixed vectors;
- attestation-reference fixed vector;
- hostile Proxy/accessor no-hook proof;
- immutable/detached proof;
- schema parity proof;
- proof that workload content digest is independent of attestation claim;
- CI run/job ids;
- K3 gate/applicability proof;
- review state;
- exact non-claims.

Adding the ledger creates a new exact head and invalidates all pre-ledger CI as current-head certification.

---

## 26. Post-ledger certification

The ledger-bearing exact head must independently satisfy:

```text
changed paths = authorized paths 1-5 only
ledger present at exact path
implementation/test/schema blobs unchanged from accepted pre-ledger evidence
protected blobs exact
all focused tests PASS
TypeScript PASS
full runtime matrix PASS
K2 gate PASS
governance/provenance/legacy PASS
K3-R4/R5 PASS or exact path-filter NOT_APPLICABLE proof
review findings adjudicated
unresolved review threads = 0
manual exact-head security/authority review PASS
```

No pre-ledger result substitutes for post-ledger certification.

---

## 27. Completion claim

Only after implementation + ledger + post-ledger certification + expected-head canonical merge may Kodac make the bounded claim:

```text
KODAC_CONTENT_ADDRESSED_SANDBOX_WORKLOAD_IDENTITY_CONTRACT_PROVEN
```

The claim means only:

- one OCI-image workload source is bound to an immutable SHA-256 content digest;
- entrypoint/args/resource/deny-all-network/confinement lineage are structurally bound into one deterministic workload identity;
- optional attestation references are structurally bound but cannot replace content identity;
- the contract is pure/inert and does not execute or authorize anything.

It does **not** close H4.

---

## 28. Explicit non-claims

R3A does **not** claim or authorize:

- OCI registry access;
- tag resolution;
- image pulling;
- signature verification;
- Sigstore verification;
- Cosign execution;
- GitHub attestation API access;
- OpenSandbox installation or execution;
- OpenSandbox SDK/API dependency;
- Docker execution;
- Kubernetes execution;
- gVisor/Kata/Firecracker execution;
- sandbox lifecycle service;
- network allowlists;
- runtime egress mutation;
- credential injection or vault;
- external-process `ask` enablement;
- local executable approval;
- path-based executable identity;
- `workspace-write` K2 integration;
- sandbox availability proof;
- observed enforcement proof;
- execution receipt changes;
- H4 completion;
- H6 readiness;
- H6 authorization;
- H7;
- `PROVEN_READY`.

---

## 29. Sequencing after R3A

If and only if the bounded R3A claim becomes canonical, the next likely H4 decision is a separate docs-only R3B authorization for **one** K2-bound sandbox backend.

Candidate direction from the readiness audit:

```text
exact K2 intent
-> exact R3A content-addressed workload
-> policy / optional one-shot approval
-> backend/service identity validation
-> workload digest verification
-> non-widening resource + deny-all network setup
-> observed confinement/workload evidence
-> durable acknowledgment
-> execution
-> K2 receipt binds workload + confinement lineage
```

Whether that backend is OpenSandbox-compatible, local Docker+gVisor, Kata/Firecracker, or another mechanism must be decided from evidence after R3A — not by this authorization.

R3A itself grants no R3B authority.

---

## 30. Authorization truth

```text
IF CANONICAL:

AUTHORIZED NEXT ACTION:
IMPLEMENT ONLY H4-R3A WITHIN PATHS 1-4

LEDGER:
BLOCKED UNTIL PRE-LEDGER PASS

SOURCE FAMILY:
OCI IMAGE ONLY

CONTENT DIGEST:
SHA256 REQUIRED

MUTABLE TAG AS AUTHORITY:
REJECTED

NETWORK:
DENY-ALL CONTRACT ONLY

CREDENTIALS:
NONE

ATTESTATION:
STRUCTURAL REFERENCE ONLY / NON-AUTHORITATIVE

R2A REQUESTED-vs-OBSERVED CONFINEMENT THEOREM:
PRESERVED

EXTERNAL-PROCESS ask:
BLOCKED

K2 / APPROVAL / CONFINEMENT / RECEIPT / DONE GATE CHANGE:
BLOCKED

OPENSANDBOX / DOCKER / K8S EXECUTION:
BLOCKED

H4 COMPLETION:
NOT CLAIMED

H6:
NOT AUTHORIZED
```

Status:

```text
KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_AUTHORIZATION_READY_FOR_CANONICAL_REVIEW
```
