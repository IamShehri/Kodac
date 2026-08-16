# KDO-H4-R3F — Canonical Closure

Date: 2026-08-16
Status: CANONICAL CLOSURE CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`

## 1. Closure decision

```text
GATE:
KDO-H4-R3F

PRE-LEDGER IMPLEMENTATION:
PASS / ACCEPTED

LEDGER-ONLY TRANSITION:
PASS

FRESH POST-LEDGER CERTIFICATION:
PASS

CANONICAL MERGE:
PASS

BOUNDED CANONICAL CLAIM:
KODAC_DOCKER_READ_ONLY_CONTROL_PLANE_BINDING_PROVIDER_PROVEN

R3B PHYSICAL BACKEND PROOF:
NOT YET PROVEN

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

This closure records the already-completed canonical R3F lifecycle without rewriting the historical evidence ledger.

---

## 2. Why this closure exists

The immutable R3F evidence ledger was correctly created before fresh post-ledger certification and therefore retains its historical header:

```text
Status: POST-LEDGER CERTIFICATION PENDING
```

That status describes the ledger at creation time. It is not the current repository state.

The ledger must not be rewritten after certification merely to make its header look current.

This separate closure records the later facts:

```text
fresh exact-head post-ledger certification = PASS
exact ledger-bearing PR head = MERGED
canonical main contains that exact certified tree
bounded R3F claim = AVAILABLE
```

---

## 3. Governing canonical documents

R3F is governed by the conjunction of these canonical documents:

```text
docs/planning/KODAC_KDO_H4_R3F_DOCKER_READ_ONLY_CONTROL_PLANE_AUTHORIZATION_2026-08-16.md
blob fb38be6c89c81d890cbaf18fbb2a44e3e7b17765

docs/planning/KODAC_KDO_H4_R3F_REQUIREMENT_CONTEXT_RECONCILIATION_2026-08-16.md
blob 891c70f4bff75d07cf27d9cd764efd9d3d22853d

docs/planning/KODAC_KDO_H4_R3F_SUBJECT_SNAPSHOT_RECONCILIATION_2026-08-16.md
blob 27e3dabe1d99b553ce112fdcc5e9fc08acf4dd58
```

The reconciliations closed material requirement-context and exact-subject gaps before final R3F certification without widening the three-path implementation allowlist.

---

## 4. Accepted pre-ledger implementation state

Canonical base before the R3F implementation merge cycle:

```text
base:
bfc6d9b47b038d1bcfac019db3ca54f0a3e2906f

base tree:
6ba46f3a282a0a0998b1b64d5867803fcb7894f6
```

Accepted pre-ledger implementation:

```text
head:
6dccc7e4e46c9ac9e31ad4cfc8b499b46ee90e9f

tree:
1f18945525845c44038a93ecd8389e6f03ca415f
```

Exact implementation paths:

```text
1. packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
```

Accepted blobs:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
452bd955cb0ef84f2090aa646dfdc70ad610a8d9

packages/kodac-runtime/src/index.ts
4ed084ed3a81a854a1421c59e0d010fead84909b

packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
dc2b8cf335d6c294861f6b7db193402fccd776a4
```

The reserved ledger did not exist at that accepted pre-ledger head.

---

## 5. Ledger-only transition

The sole post-pre-ledger addition was:

```text
docs/planning/KODAC_KDO_H4_R3F_DOCKER_READ_ONLY_CONTROL_PLANE_EVIDENCE_2026-08-16.md
```

Ledger-bearing exact head:

```text
9550a9c0efce3c39030659c7a8a350167f17f10e
```

Ledger-bearing tree:

```text
d3b844f1e6462d329abf95ee4e51b5fca27d7c7b
```

Ledger blob:

```text
70b67e75465fd690dbce05fdddeb5beda1111dd1
```

The ledger commit parent is exactly:

```text
6dccc7e4e46c9ac9e31ad4cfc8b499b46ee90e9f
```

The three implementation blobs remained byte-identical across the ledger-only transition.

---

## 6. Fresh exact-head post-ledger certification

Fresh certification ran against the exact ledger-bearing head:

```text
9550a9c0efce3c39030659c7a8a350167f17f10e
```

The required GitHub Actions evidence is:

```text
governance run:
31921733340

legacy-tests job:
95102533620
PASS
pytest + ruff

provenance job:
95102533642
PASS

k2-runtime run:
31921733357

runtime-change-classifier job:
95102533606
PASS

Ubuntu runtime job:
95102544601
PASS
Typecheck + full Test + benchmark

macOS runtime job:
95102544621
PASS
Typecheck + full Test + benchmark

Windows runtime job:
95102544630
PASS
Typecheck + full Test + benchmark

K2 aggregate gate job:
95102616476
PASS

K3-R4 run:
31921733354

K3-R4 adapter job:
95102533623
PASS

K3-R5 run:
31921733343

K3-R5 context-engine job:
95102533572
PASS
```

No pre-ledger result was reused as a substitute for this fresh ledger-bearing certification.

---

## 7. Review closure

The implementation review cycle found real defects before certification and those defects were corrected rather than waived.

Material review findings included:

```text
oversized-response primary failure cause could be replaced by abort attribution
AbortSignal race between precheck and listener registration
quadratic JSON primitive scanning via repeated suffix slicing
missing explicit State.Running=false regression case
```

The final implementation:

```text
settles primary failure before destroying HTTP transport
rechecks AbortSignal immediately after listener registration
uses indexed/sticky linear JSON primitive scanning
contains the required lifecycle regression coverage
```

At the exact ledger-bearing head:

```text
CodeRabbit status:
success

unresolved actionable review threads:
0

manual trust/security review:
PASS
```

Historical review comments remain part of the PR record; they are not current unresolved defects.

---

## 8. Canonical merge proof

R3F implementation PR:

```text
PR #97
feat(kdo): prove H4-R3F Docker read-only control plane
```

was canonically merged.

Exact certified PR head:

```text
9550a9c0efce3c39030659c7a8a350167f17f10e
```

Canonical merge commit:

```text
3891f86970e28c1bdf3739de6a1819cd3af28242
```

Canonical merge tree:

```text
d3b844f1e6462d329abf95ee4e51b5fca27d7c7b
```

The merge commit is GitHub-verified and has exactly the expected parents:

```text
parent 1:
bfc6d9b47b038d1bcfac019db3ca54f0a3e2906f

parent 2:
9550a9c0efce3c39030659c7a8a350167f17f10e
```

Therefore canonical `main` contains the exact post-ledger-certified R3F tree without a content-changing merge delta.

---

## 9. Canonical bounded theorem

The proven R3F theorem is deliberately narrow.

Kodac now has a bounded Linux/POSIX Docker Engine read-only control-plane provider that:

```text
binds one exact validated canonical R3B gVisor requirement at provider construction
fails request requirement/workload mismatch before Docker I/O
uses only a trusted local Unix-socket endpoint
freezes and rechecks socket device/inode/uid/gid/mode identity
uses fixed Docker Engine API v1.48
issues exactly two authorized GET request families
requires exactly one running full-64-lowerhex container candidate
requires exact inspect ID and exact binding labels
requires exact ImageManifestDescriptor.Digest
requires exact effective Path and ordered Args
requires HostConfig.Runtime == runsc
requires HostConfig.NetworkMode == none
requires zero current NetworkSettings.Networks attachments
requires exact NanoCpus
requires exact Memory and MemorySwap
rejects privileged/restarted/paused/restarting/dead/non-running subjects
parses bounded duplicate-key-safe UTF-8/JSON
fails closed on timeout/abort and preserves primary failure attribution
rechecks socket identity before and after authorized requests
produces deterministic immutable e2-docker-control-plane state
produces the existing canonical R3E GvisorContainerBinding
adds no Docker mutation authority
adds no generic Docker request primitive
mints no R3B physical backend observation/evidence
```

This theorem is a control-plane exact-subject theorem, not a physical-enforcement theorem.

---

## 10. Canonical bounded claim

The canonical claim now available is exactly:

```text
KODAC_DOCKER_READ_ONLY_CONTROL_PLANE_BINDING_PROVIDER_PROVEN
```

Meaning only:

> Kodac has a bounded Linux Docker Engine read-only provider that resolves exactly one full Docker container subject for a validated R3E gVisor binding request and records a deterministic E2 control-plane snapshot of immutable manifest digest, effective command, runtime selection, deny-all Docker network configuration/current attachment state and CPU/memory configuration without exposing Docker mutation authority or minting R3B physical backend evidence.

No stronger interpretation is authorized.

---

## 11. Critical E2 non-attestation boundary

A structurally valid `DockerControlPlaneObservation` object is not by itself cryptographic proof that the trusted Docker read path executed.

The accepted R3F trust theorem depends on the observation being produced by the canonical trusted provider path under its frozen socket/requirement context.

Therefore future conjunction work MUST NOT treat this equivalence as valid:

```text
caller supplies object
+
validateDockerControlPlaneObservation(object) succeeds
=
trusted R3F Docker observation occurred
```

That inference is forbidden.

R3G must preserve trusted provenance/path binding when it combines E2 Docker state with Linux/runtime observations. A caller-constructed structurally valid E2 object cannot independently upgrade itself into physical R3B evidence.

---

## 12. Explicit non-authority after R3F

R3F does not prove or authorize:

```text
physical immutable source/rootfs enforcement
physical deny-all network enforcement
physical CPU cgroup enforcement
physical memory/swap cgroup enforcement
cross-surface race-resistant physical conjunction
R3B physical SandboxBackendObservation
R3B SandboxExecutionEvidence
TTL/lifecycle ownership or enforcement
maxOutputBytes enforcement
Docker create/start/stop/kill/restart/remove/exec
Docker logs/stats/events/attach/archive/wait
image pull/push/remove
registry access
containerd access
OpenSandbox integration
network-namespace inspection
mount-namespace inspection
new cgroup filesystem reads
remote Docker TCP/TLS/SSH/npipe
external-process ask
workspace-write K2 integration
H4 completion
H6 authorization
```

R3F is one proven input to later physical-policy work, not H4 closure.

---

## 13. Next candidate

Canonical R3F authorization explicitly names the next candidate:

```text
KDO-H4-R3G — Linux Docker/gVisor Physical Policy Conjunction Authorization
```

R3G should decide the smallest race-resistant physical-policy observation slice needed to combine Docker E2 control-plane state with trusted Linux/runtime E3 state.

At minimum its authorization must decide how to prove or refuse:

```text
physical immutable source/rootfs binding
physical deny-all network state
physical CPU cgroup enforcement
physical memory + swap cgroup enforcement
race-resistant re-observation/bracketing
observer identity across Docker + runsc + host state
trusted provenance of R3F E2 input rather than arbitrary caller-constructed objects
```

R3G must independently decide whether this scope must be split again before any R3B physical observation is minted.

TTL/lifecycle and output-bound enforcement remain eligible for separate later slices instead of being forced into R3G.

This closure pre-authorizes no R3G implementation, physical reads, cgroup reads, namespace reads, mutations or evidence minting.

---

## 14. Exact closure scope

This closure PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3F_CANONICAL_CLOSURE_2026-08-16.md
```

Canonical closure base:

```text
3891f86970e28c1bdf3739de6a1819cd3af28242
```

Canonical closure base tree:

```text
d3b844f1e6462d329abf95ee4e51b5fca27d7c7b
```

Production/test/schema/workflow/dependency delta must remain:

```text
0
```

No historical R3F ledger or implementation file may be edited by this closure.

---

## 15. Closure review gate

Before this closure becomes canonical, its exact docs-only PR head must prove:

```text
base = exact canonical main 3891f86970e28c1bdf3739de6a1819cd3af28242
changed paths = exactly this one closure document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
existing K2/K3 regression gates = PASS where triggered
available external review has no unresolved actionable finding
reviewer availability/status is recorded accurately
manual semantic/governance review = PASS
0 unresolved actionable review threads
```

Any finding that requires implementation code is out of scope for this closure PR and must not widen it.

---

## 16. Final state after canonical closure

If this exact closure becomes canonical:

```text
R3A WORKLOAD IDENTITY:
CANONICAL / PROVEN

R3B REQUIREMENT / OBSERVATION / EVIDENCE CONTRACT:
CANONICAL / PROVEN AS CONTRACT ONLY

R3D GVISOR OBSERVER PRIMITIVE:
CANONICAL / PROVEN

R3E K2 GVISOR EXACT-INSTANCE BINDING:
CANONICAL / PROVEN

R3F DOCKER READ-ONLY CONTROL-PLANE PROVIDER:
CANONICAL / PROVEN

R3F HISTORICAL LEDGER:
IMMUTABLE PRE-POST-LEDGER SNAPSHOT

R3B PHYSICAL BACKEND PROOF:
NOT YET PROVEN

NEXT CANDIDATE:
KDO-H4-R3G — Linux Docker/gVisor Physical Policy Conjunction Authorization

EXTERNAL-PROCESS ask:
BLOCKED

H4:
OPEN

H6:
NOT AUTHORIZED
```

The purpose of this closure is truthful canonical state, not broader authority.