# KDO-H4-R3A — Attested Sandbox Workload Identity Contract Evidence

Date: 2026-08-15
Status: POST-LEDGER CERTIFICATION PENDING

## 1. Evidence decision

```text
GATE:
KDO-H4-R3A

PRE-LEDGER DECISION:
PASS

ACCEPTED PRE-LEDGER HEAD:
debda347a0cbf769134c6c656f0d1e8c34b3e217

ACCEPTED PRE-LEDGER TREE:
7723f1d771c3fd72b99c15d324df4b1d4254e629

BOUNDED TARGET:
PURE / INERT CONTENT-ADDRESSED SANDBOX WORKLOAD IDENTITY CONTRACT

EXECUTION AUTHORITY:
NONE

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

This ledger records the fresh accepted pre-ledger evidence after the canonical R3A-C1 ledger-gate correction.

It does not certify the ledger-bearing exact head. Fresh post-ledger certification remains mandatory.

---

## 2. Canonical base, authorization, and C1 reconciliation

Corrected canonical implementation base:

```text
11a6a09050fa5874e053338c20b16f6718f9ff28
```

Original H4-R3A authorization:

```text
docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_AUTHORIZATION_2026-08-15.md
blob 12b7454068ed82f135c37f05ba6b166674032fca
```

Canonical H4 readiness / OpenSandbox audit:

```text
docs/planning/KODAC_KDO_H4_READINESS_OPENSANDBOX_DONOR_DIFFERENTIAL_AUDIT_2026-08-15.md
blob 00fbcb55b66de686734a7a8dff27c953a73ce0f1
```

Canonical ledger-gate reconciliation:

```text
docs/planning/KODAC_KDO_H4_R3A_LEDGER_GATE_RECONCILIATION_2026-08-15.md
blob d01837a5fff1255912b35b5a7874f971748b9f78
merge 11a6a09050fa5874e053338c20b16f6718f9ff28
```

R3A-C1 establishes that ledger absence is an exact pre-ledger repository-state / changed-path property, not a permanent runtime semantic assertion that must remain true after the authorized ledger is created.

---

## 3. Rejected diagnostic history

The following heads are explicitly **not** acceptance evidence:

```text
765a1314d017e85f1e3526b4394201fb1162aae0
```

This head passed the first implementation gate but retained an unconditional focused-test assertion that the ledger file did not exist.

The ledger-only diagnostic head:

```text
ce0e8ce2a84c0d21e03303e0ae03e16fe10b843d
```

then failed post-ledger full runtime solely because that unchanged assertion observed the intentionally created evidence ledger and produced:

```text
true !== false
```

The runtime/product theorem was not the cause of that failure. R3A-C1 corrected the test-lifecycle contradiction before this new accepted pre-ledger head was established.

---

## 4. External ledger-absence proof for the accepted head

For exact accepted head:

```text
debda347a0cbf769134c6c656f0d1e8c34b3e217
```

comparison against corrected canonical base `11a6a090...` proves exactly four changed paths:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/index.ts
schema/kdo-h4-r3a-sandbox-workload.schema.json
packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
```

The authorized evidence path:

```text
docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_EVIDENCE_2026-08-15.md
```

returned repository `404 Not Found` at the exact accepted pre-ledger head.

Therefore:

```text
LEDGER ABSENT BEFORE PRE-LEDGER PASS:
PASS — EXTERNAL EXACT-HEAD EVIDENCE
```

No CI conditional, skip, todo, or test-lifecycle bypass is used.

---

## 5. Accepted pre-ledger implementation blobs

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8

packages/kodac-runtime/src/index.ts
b569c292b015cc590410b835ca65f5763d9bbbf7

schema/kdo-h4-r3a-sandbox-workload.schema.json
b8f5b8b97a49e550bfe036b73d259b0826ec75bd

packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
a8e7c2a5fc2799d898f75ff1a45bccfcbe602519
```

The only test change relative to the rejected diagnostic pre-ledger candidate is the C1-authorized removal of the permanent ledger-absence assertion and its now-unused `existsSync` import.

All product semantics, fixed vectors, confinement-lineage proofs, hostile-input proofs, schema proofs, and protected-authority assertions remain in the focused suite.

---

## 6. OpenSandbox donor pin

```text
Repository:
opensandbox-group/OpenSandbox

Commit:
f8ed8734ce1fda69f0979f912160fb933b9bfa0c

Tree:
cf033b4f880b7e84b563dcf7f63722582ea48762

License:
Apache-2.0

Root license blob:
b09cd7856d58590578ee1a4f3ad45d1310a97f87

Intake:
STUDY_REIMPLEMENT
```

Pinned conceptual references:

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

No OpenSandbox implementation code, dependency, server, or API call is present in R3A.

---

## 7. Protected authority surfaces

The accepted focused suite proves these canonical authority surfaces remain byte-identical:

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

R3A therefore remains outside K2 execution, approval, observed confinement, receipt, Done Gate, agent-loop, dependency, and donor-attribution authority.

---

## 8. Contract versions and bounds

```text
OCI source version:
kodac-h4-r3a-oci-image-source-v1

Entrypoint version:
kodac-h4-r3a-entrypoint-v1

Resource policy version:
kodac-h4-r3a-resource-policy-v1

Network policy version:
kodac-h4-r3a-network-policy-v1

Workload version:
kodac-h4-r3a-sandbox-workload-v1

Attestation reference version:
kodac-h4-r3a-workload-attestation-ref-v1

Network mode:
deny-all

Credential binding:
null only

Attestation kind:
sigstore-bundle
```

Runtime limits:

```text
repository <= 512 UTF-8 bytes
executable <= 4096 UTF-8 bytes
args <= 256
one arg <= 8192 UTF-8 bytes
aggregate args <= 65536 UTF-8 bytes
cpuMillis <= 256000
memoryBytes <= 1099511627776
ttlMs <= 86400000
maxOutputBytes <= 16777216
issuer <= 2048 UTF-8 bytes
producerIdentity <= 2048 UTF-8 bytes
```

---

## 9. Fixed identity vectors

Fixture confinement:

```text
workspaceIdentity:
aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

executionIntentIdentity:
bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

confinement request identity:
a22b2611b230d184748ab77f59155127a5e7a6c6bfe469df6cb3cbffc7351ee5
```

OCI source:

```text
repository:
ghcr.io/acme/kodac-fixture

digest:
sha256:1111111111111111111111111111111111111111111111111111111111111111

sourceIdentity:
89b8758e4ac8a073c06768ffc6e4aae994cbf4607db33c92ee993a4f1fa23a86
```

Entrypoint identity:

```text
e3b75ab65d9efc9d41bc16f71cb22a0b7936edb749d46af1697700c34ed0f844
```

Resource policy identity:

```text
cf0077cf2277c1800a5bb08f1780abb2504255fa7b58eec369cc2a27811fb510
```

Deny-all network policy identity:

```text
c17924ecbb8bfaa005dd6c8b0b321adf7f606b19b39672de51ac5b53c14ad3d6
```

Self-contained workload identity:

```text
7e148da8275b34e873bd6fdd33cc5d4977c6577a4f3631ca988c3b9c227801c3
```

Attestation-reference identity:

```text
eccbe2d5e53053874d4e7d492d92e0f883388f56f5db0ef139af4e707309b9c6
```

---

## 10. Self-contained confinement-lineage proof

The workload includes the validated canonical H4-R2A `ConfinementRequest` itself plus redundant outer bindings:

```text
confinement
executionIntentIdentity
workspaceIdentity
confinementRequestIdentity
```

Serialized validation:

1. validates the nested confinement request;
2. recomputes its H4-R2A request identity;
3. compares outer execution intent to nested confinement;
4. compares outer workspace identity to nested confinement;
5. compares outer confinement-request identity to the recomputed request;
6. recomputes final workload identity.

Negative tests prove rejection of outer lineage substitution, nested confinement mutation, and final workload-hash tampering.

Requested confinement remains distinct from observed enforcement. R3A creates no enforcement evidence.

---

## 11. Attestation separation

The immutable OCI SHA-256 digest remains the content authority term.

Attestation references are structurally separate and may not replace or override that digest.

Changing attestation digest/issuer/producer changes attestation-reference identity without changing the already established workload identity.

No registry, Sigstore, Cosign, certificate, OIDC, transparency-log, filesystem, or network verification occurs in R3A.

---

## 12. Hostile-input / purity / schema proof

Focused tests prove fail-closed behavior for Proxy-backed objects/arrays before traps execute, accessors before getters execute, symbols, hidden fields, unknown fields, sparse arrays, malformed identities/digests, NULs, and all published bounds.

Accepted nested values are detached/frozen.

Production imports exactly:

```text
./confinement.ts
node:crypto
node:path
node:util
```

The published JSON Schema uses closed structural shapes and does not pretend character `maxLength` proves UTF-8 runtime byte bounds.

---

## 13. Fresh pre-ledger CI after C1

Exact accepted head:

```text
debda347a0cbf769134c6c656f0d1e8c34b3e217
```

### Governance

```text
run:
31895752111

legacy-tests:
95038707290 — PASS

provenance:
95038707319 — PASS
```

### K2 runtime

```text
run:
31895752090

runtime-change-classifier:
95038707257 — PASS

Windows runtime:
95038722188 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

Ubuntu runtime:
95038722231 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

macOS runtime:
95038722254 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

k2-runtime-gate:
95038811497 — PASS
```

Ubuntu full suite:

```text
tests 541
pass 540
fail 0
skipped 1
```

The one skip is the pre-existing generic-suite exact Linux ast-grep fixture. The dedicated K3-R4 gate below executes the exact external binary path and passes.

### K3-R4

```text
run:
31895752088

job:
95038707309 — PASS
```

### K3-R5

```text
run:
31895752089

job:
95038707238 — PASS
```

### Review

```text
CodeRabbit:
SUCCESS

unresolved review threads:
0

manual exact-head security / authority review:
PASS
```

---

## 14. Fresh pre-ledger gate result

```text
corrected canonical base:
PASS

changed paths = authorized pre-ledger 4:
PASS

ledger absent by external exact-head evidence:
PASS

C1-focused-test reconciliation exact:
PASS

protected authority blobs exact:
PASS

fixed vectors exact:
PASS

self-contained confinement lineage:
PASS

hostile-input proof:
PASS

bounds:
PASS

schema parity:
PASS

production purity:
PASS

Ubuntu/Windows/macOS TypeScript + full tests:
PASS

K2 aggregate:
PASS

governance/provenance/legacy:
PASS

K3-R4:
PASS

K3-R5:
PASS

CodeRabbit:
SUCCESS

unresolved threads:
0

PRE-LEDGER DECISION:
PASS
```

---

## 15. Post-ledger requirement

After this file is committed, this pre-ledger evidence becomes historical.

The new exact head must independently prove:

```text
changed paths = authorized 1-5 only
ledger present at exact path
implementation/index/schema/test blobs unchanged from debda347...
protected authority blobs exact
all focused/full tests PASS
TypeScript PASS on all three OS
K2 aggregate PASS
governance/provenance/legacy PASS
K3-R4 PASS
K3-R5 PASS
CodeRabbit SUCCESS
unresolved review threads = 0
manual exact-head authority review PASS
```

Post-ledger status at creation:

```text
PENDING
```

---

## 16. Non-claims

R3A does not claim or authorize:

- OCI registry access;
- image existence/pull/tag resolution;
- signature/Cosign/Sigstore verification;
- OpenSandbox server/SDK/dependency;
- Docker/Kubernetes/gVisor/Kata/Firecracker execution;
- sandbox lifecycle execution;
- backend availability or observed-enforcement proof;
- network allowlists or runtime egress widening;
- credential injection/broker;
- external-process `ask` enablement;
- local executable path identity;
- `workspace-write` K2 integration;
- receipt changes;
- H4 completion;
- H6 readiness/authorization;
- H7;
- `PROVEN_READY`.

---

## 17. Completion claim gate

Only after fresh post-ledger PASS and expected-head canonical merge may Kodac make:

```text
KODAC_CONTENT_ADDRESSED_SANDBOX_WORKLOAD_IDENTITY_CONTRACT_PROVEN
```

Until then:

```text
UNAVAILABLE
```
