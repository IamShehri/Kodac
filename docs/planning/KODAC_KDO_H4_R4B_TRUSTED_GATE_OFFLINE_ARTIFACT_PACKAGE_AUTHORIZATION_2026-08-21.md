# KODAC KDO H4-R4B — Trusted Gate Offline Artifact Package Authorization

Date: 2026-08-21
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — NO ARTIFACT BUILD / DOCKER AUTHORITY**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Authorize the smallest post-G0 artifact slice that can advance the trusted gVisor workload gate toward the concrete artifact identity required before any B1-v2 product integration.

This authorization candidate is deliberately narrower than B1-v2 and narrower than a Docker-local gate-image provisioning step.

Its future purpose is only to prove one **offline, deterministic, content-addressed gate artifact package** derived from the already-canonical G0 source bytes.

It must not create, start, attach to, or execute a Docker container. It must not execute runsc or gVisor. It must not dispatch GO over Docker. It must not implement B1-v2, B2A-v2, or B2B.

Maximum future claim from this slice:

```text
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN
```

This is not equivalent to:

```text
LOCAL_DOCKER_GATE_IMAGE_PREFLIGHT_PROVEN
B1_V2_READY
B2A_V2_READY
B2B_READY
H4_COMPLETE
```

---

## 2. Exact canonical base

```text
repository=TheHalfMoon/Kodac
canonical_main=c9acc5f416708f3d0a07b843e8a5ffa7db63f2bc
canonical_tree=915bd7be87aafb70a6420b07b84fa9c90ff1384e
PR_143=MERGED_CANONICAL
```

PR #143 canonically merged exact reviewed head:

```text
50b6b8e03788a12a20b90a9a06a35517bdbedd18
```

with ordered merge parents:

```text
parent_1=01081ba9cd6227e4c1e87e73e08c1dcd2cbc62c6
parent_2=50b6b8e03788a12a20b90a9a06a35517bdbedd18
```

and exactly the three G0 paths:

```text
docs/planning/KODAC_KDO_H4_R4B_G0_GVISOR_WORKLOAD_GATE_EVIDENCE_2026-08-21.md
packages/kodac-runtime/native/gvisor-workload-gate.c
packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
```

---

## 3. Canonical predecessor decisions

Canonical PR #141 selected the trusted gate delivery direction:

```text
LOCAL DIGEST-PINNED DEDICATED GATE IMAGE
+ Docker API v1.48 Mount.Type=image
+ exact local image preflight
+ exact resolved image ID as mount source
+ safe fixed subpath
+ read-only mount
+ static dedicated gate
```

Canonical PR #142 authorized only G0 source/static proof.

Canonical PR #143 then proved and merged the G0 source/test artifact while preserving all Docker/live-execution non-grants.

The B1-v2 readiness record requires, before B1-v2 product integration, a concrete artifact identity binding at least:

```text
gateProtocolVersion
source file blob SHA
gate source SHA-256
build recipe identity
toolchain identity
Linux architecture
gate binary SHA-256
binary byte size
ELF static/no-interpreter proof
gate image manifest digest
gate local image ID relationship theorem
gate image payload subpath
gate executable relative path
fixed container mount target
implementationIdentity binding all above
```

G0 intentionally did not establish the production/package-level values in that list.

---

## 4. Canonical G0 bytes are frozen inputs

The future offline artifact slice must consume the exact canonical G0 source bytes and must not mutate the G0 source or G0 proof test.

Pinned source:

```text
SOURCE_PATH=packages/kodac-runtime/native/gvisor-workload-gate.c
SOURCE_GIT_BLOB=049aef0417e3673b6467101e2f8e8ba2a5d19287
SOURCE_SHA256=42a8e0739d72141630e22184ec3fb74f1d2bb768d89dc87144e628d60e1c7f74
SOURCE_BYTES=1400
```

Pinned G0 focused test:

```text
TEST_PATH=packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
TEST_GIT_BLOB=ca837f5b139cabfdb2d6fd163cb9b50e08675bd4
TEST_SHA256=3f22d8e7dcfb3ca3a4c39855c793eee13a86fc9833c8cd53b9b53170705ecc3f
TEST_BYTES=10794
```

Pinned protocol:

```text
GATE_PROTOCOL_VERSION=kodac-gvisor-workload-gate-v1
VALID_PERMIT_BYTES=0x47 0x4f 0x0a
EOF_AFTER_VALID_PERMIT=REQUIRED
```

Any source-byte change means this authorization no longer applies. A source change requires a new G0 proof cycle before any artifact packaging may continue.

---

## 5. What this slice may prove

Only after this authorization itself becomes canonical, a future separately executed artifact-proof slice may establish a content-addressed package with purpose-equivalent properties:

```text
exact canonical G0 source bytes
-> exact pinned build recipe
-> exact observed/pinned toolchain identity
-> one static ELF gate binary
-> deterministic package filesystem metadata
-> deterministic image config bytes
-> deterministic image manifest bytes
-> deterministic layer/package bytes
-> exact SHA-256 identities for every emitted object
```

The future slice must be able to reconstruct the package from the pinned inputs without caller-selected runtime behavior.

The artifact package must remain inert data until a later separately authorized provisioning step.

---

## 6. No Docker daemon in the offline artifact slice

The future offline artifact proof authorized by this document must not call the Docker daemon or Docker CLI for any mutating or execution operation.

Forbidden:

```text
docker build
docker buildx build
docker load
docker pull
docker push
docker create
docker start
docker run
docker exec
docker attach
docker import
docker commit
Docker Engine image-create/pull APIs
Docker Engine container-create/start/attach APIs
```

The package proof may construct and inspect deterministic image/package bytes offline using ordinary bounded local file/process tooling only if separate live founder/current-session process authority permits that execution.

A later local-Docker provisioning/preflight gate must prove that the exact artifact resolves to the expected local Docker identity before B1-v2 is considered.

---

## 7. Build recipe requirements

The release recipe must be no weaker than G0's proven static recipe:

```text
cc
-std=c11
-O2
-Wall
-Wextra
-Werror
-static
<exact canonical source>
-o <artifact output>
```

The future release manifest must record the exact final command/recipe identity and all environment-independent inputs that affect produced bytes.

No dynamic fallback is allowed.

No shell-selected source path, caller-selected compiler flag, caller-selected target path, or ambient network acquisition is allowed.

If the required exact toolchain is unavailable:

```text
ARTIFACT_RELEASE=BLOCKED
FALLBACK_BUILD=FORBIDDEN
```

---

## 8. Toolchain identity is mandatory

A compiler version string alone is not sufficient for the production/package artifact theorem.

The future artifact evidence must bind the concrete toolchain strongly enough that another reviewer can determine which compiler/linker/static runtime inputs produced the binary.

At minimum the release evidence must record a purpose-equivalent identity set covering:

```text
compiler implementation and version
compiler executable identity
linker implementation and version
linker executable identity
static libc/runtime archive identity used by the link
binutils/readelf identity used for binary inspection
host/target architecture
all build flags
```

An immutable pre-provisioned build-environment digest may satisfy multiple entries if it cryptographically binds the relevant toolchain payload and no network acquisition occurs during the proof.

This authorization does not select or acquire that toolchain.

---

## 9. Reproducibility theorem

The future artifact proof must perform at least two clean builds in distinct fresh directories from the same pinned inputs and require exact byte identity.

Required result:

```text
BUILD_A_BINARY_SHA256 == BUILD_B_BINARY_SHA256
BUILD_A_BINARY_BYTES == BUILD_B_BINARY_BYTES
```

The deterministic package construction must likewise produce identical identities for every package object that is claimed as release evidence.

At minimum:

```text
LAYER_DIGEST_A == LAYER_DIGEST_B
CONFIG_DIGEST_A == CONFIG_DIGEST_B
MANIFEST_DIGEST_A == MANIFEST_DIGEST_B
PACKAGE_DIGEST_A == PACKAGE_DIGEST_B
```

A reproducibility mismatch is a hard failure. It must not be normalized, ignored, or replaced by a single-build claim.

---

## 10. Static binary theorem must be re-proven on release bytes

The final artifact binary must independently satisfy:

```text
ELF executable
statically linked
PT_INTERP=ABSENT
DT_NEEDED=ABSENT
no script/shebang interpreter
no runtime shared-library dependency
```

The binary SHA-256 and byte size recorded in the artifact manifest must refer to these exact inspected bytes.

The prior G0 proof binary SHA-256 is evidence about the G0 proof host only. It must not be silently reused as the production/package artifact identity unless the future release build independently produces the exact same bytes and records that fact.

---

## 11. Minimal package filesystem

The future artifact package must contain only the trusted gate payload required for later image mounting.

The package filesystem must be purpose-equivalent to one fixed payload subtree containing one regular executable file and no executable helpers, shells, interpreters, libraries, configuration, plugins, package manager state, credentials, or mutable application data.

Required properties include:

```text
exactly one gate executable payload
regular file only
no symlink
no hardlink
no device node
no FIFO/socket
no setuid/setgid bits
fixed mode
fixed uid/gid metadata
fixed timestamp metadata
fixed path ordering
no ambient xattrs/capabilities unless separately authorized
```

The exact payload subpath and executable relative path must be pinned by the future release manifest before the package can receive a positive verdict.

---

## 12. Image config must grant no behavior

The gate artifact image/package exists only as a mounted read-only filesystem source for future B1-v2. It is not a runnable workload image.

The future image config must not introduce executable policy or runtime defaults such as:

```text
Entrypoint
Cmd
Env
WorkingDir
User
Volumes
StopSignal
Healthcheck
Shell
OnBuild
```

Any unavoidable structural fields must be deterministic and explicitly bound by the artifact manifest.

No gate image config field may become a source of B1-v2 workload semantics.

---

## 13. Manifest and implementation identity

The future release manifest must bind all concrete release facts into one deterministic implementation identity.

At minimum the identity preimage must include purpose-equivalent values for:

```text
gateProtocolVersion
canonical G0 source Git blob SHA
canonical G0 source SHA-256
release recipe identity
toolchain identity
target Linux architecture
binary SHA-256
binary byte size
ELF/static proof identity
package/layer digest
image config digest
image manifest digest
payload subpath
executable relative path
fixed future container mount target
```

The identity must be domain-separated and deterministically encoded.

No mutable tag, registry name, local filesystem pathname, timestamp, random value, temporary directory, or host-specific absolute build path may participate as trust authority.

---

## 14. Offline package is not local Docker identity proof

A successful offline artifact package may establish exact package/config/manifest digests, but this slice must not claim that Docker has loaded or locally resolved those bytes.

Required negative statement after a successful offline release:

```text
LOCAL_DOCKER_GATE_IMAGE_PRESENT=NOT_PROVEN
LOCAL_DOCKER_GATE_IMAGE_ID=NOT_OBSERVED
DOCKER_IMAGE_MOUNT_PREFLIGHT=NOT_PROVEN
```

A later separately authorized provisioning/preflight gate must bind the exact offline artifact identity to the exact locally resolved Docker image ID and descriptor before B1-v2 container create is authorized.

---

## 15. Network and registry authority remain zero

The artifact proof must not require registry credentials or network acquisition.

```text
REGISTRY_NETWORK_CALLS=0
GATE_IMAGE_PULL_CALLS=0
GATE_IMAGE_PUSH_CALLS=0
CREDENTIAL_REQUESTS=0
```

If a required toolchain or package dependency is not already present under the approved local proof boundary, the proof must block rather than fetch it.

---

## 16. Future implementation allowlist after canonical authorization

Only after this authorization PR is merged and canonical, the future offline artifact implementation/evidence slice may modify exactly these three new paths:

```text
1. packages/kodac-runtime/native/gvisor-workload-gate.release.json
2. packages/kodac-runtime/test/kdo-h4-r4b-gate-offline-artifact.test.ts
3. docs/planning/KODAC_KDO_H4_R4B_TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_EVIDENCE_2026-08-21.md
```

The canonical G0 source and G0 test are read-only inputs and must remain byte-identical:

```text
packages/kodac-runtime/native/gvisor-workload-gate.c
packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
```

No other path is authorized.

In particular, no future offline artifact slice may modify:

```text
Dockerfiles
GitHub workflows
package manifests
lockfiles
B1 runtime
B2A runtime
B2B runtime
Docker request code
R3G-D
R3G-E
R3G-F
package-root runtime exports
```

---

## 17. Process execution authority remains separately constrained

This docs-only authorization does not itself authorize compiler/test/tar/packaging process execution.

After this authorization becomes canonical, repository mutation authority for the three-path future allowlist may exist, but actual artifact proof execution must still obey the live founder/current-session execution constraint.

Until such process authority is explicit:

```text
OFFLINE_ARTIFACT_SOURCE_MUTATION_AFTER_CANONICAL_AUTH=MAY_BE_ALLOWED
OFFLINE_ARTIFACT_BUILD_EXECUTION=NOT_GRANTED_BY_THIS_DOCS_PR
OFFLINE_ARTIFACT_TEST_EXECUTION=NOT_GRANTED_BY_THIS_DOCS_PR
DOCKER_EXECUTION=NO
GVISOR_EXECUTION=NO
WORKLOAD_EXECUTION=NO
```

If process execution is prohibited, the future artifact PR must remain unmerged rather than fabricate release evidence or weaken the theorem.

---

## 18. Required future proof matrix

A future offline artifact candidate must prove at least:

```text
canonical source blob/hash exact match
canonical G0 test blob/hash unchanged
release manifest strict validation
unknown release-manifest fields rejected
invalid/mutable identity fields rejected
toolchain identity complete
clean build A success
clean build B success
binary bytes reproducible
binary static ELF proof
PT_INTERP absent
DT_NEEDED absent
package contains only expected payload
package path metadata deterministic
no symlink/hardlink/device/FIFO/socket payload
image config contains no executable defaults
layer/config/manifest/package digests deterministic
implementationIdentity deterministic
source-byte mutation rejected
network/registry acquisition absent
Docker daemon interaction absent
```

All positive evidence must bind one exact repository head.

---

## 19. Threat model

The future offline artifact proof must explicitly defend against:

- rebuilding from source bytes different from canonical G0;
- unpinned compiler/linker/static runtime inputs;
- hidden timestamps or build paths causing nondeterminism;
- dynamic loader/interpreter reintroduction;
- extra files or tools entering the gate payload;
- executable image config fields becoming hidden authority;
- symlink/hardlink path substitution;
- caller-selected payload paths or mount targets;
- mutable tags or registry names becoming trust identity;
- build-time registry/network access;
- artifact digest computed over bytes different from the inspected bytes;
- one-build-only reproducibility claims;
- confusing an offline config/manifest digest with an observed local Docker image ID;
- treating artifact release as B1-v2/B2A-v2/B2B authority.

---

## 20. Maximum future verdict

If every future offline artifact gate is proven, the strongest permitted verdict is:

```text
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN
```

That verdict means only that one exact deterministic static gate package and its content identities are proven from the frozen G0 source under the recorded toolchain/build theorem.

It must not claim:

```text
LOCAL_DOCKER_GATE_IMAGE_PRESENT
LOCAL_DOCKER_GATE_IMAGE_ID_PROVEN
DOCKER_IMAGE_MOUNT_PREFLIGHT_PROVEN
PRODUCTION_GATE_DEPLOYED
B1_V2_READY
B2A_V2_READY
B2B_READY
DOCKER_START_AUTHORIZED
WORKLOAD_EXECUTION_AUTHORIZED
R3G_F_E4
H4_COMPLETE
```

---

## 21. Merge gate for the future offline artifact implementation PR

A future implementation/evidence PR may merge only if all applicable gates are proven on its exact head:

```text
CHANGED_PATHS=EXACTLY_3_ALLOWLISTED_PATHS_OR_FEWER
NO_OUT_OF_SCOPE_PATHS=PASS
CANONICAL_G0_SOURCE_BYTES_UNCHANGED=PASS
CANONICAL_G0_TEST_BYTES_UNCHANGED=PASS
TOOLCHAIN_IDENTITY_PROOF=PASS
TWO_BUILD_REPRODUCIBILITY=PASS
STATIC_BINARY_PROOF=PASS
OFFLINE_PACKAGE_STRUCTURE_PROOF=PASS
IMAGE_CONFIG_NO_AUTHORITY_PROOF=PASS
CONTENT_DIGEST_PROOF=PASS
IMPLEMENTATION_IDENTITY_PROOF=PASS
NETWORK_REGISTRY_ZERO_PROOF=PASS
DOCKER_DAEMON_ZERO_PROOF=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

No gate may be waived because the artifact is "only packaging".

---

## 22. Merge gate for this docs-only authorization PR

This authorization candidate itself may merge only if:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
NATIVE_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
BEHIND_BY=0
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If canonical main moves, the exact base and all predecessor conclusions must be reconciled before merge.

---

## 23. Explicit non-grants

Nothing in this authorization grants:

```text
artifact build during this docs PR
artifact proof process execution during this docs PR
Docker build/load/pull/push
Docker create/start/attach/exec
Docker image mount product usage
runsc execution
gVisor sandbox creation
GO dispatch over Docker
workload execution
B1-v2 implementation
B2A-v2 implementation
B2B implementation
TTL ARM by B2B
R3G-D/E/F authority widening
R3G-F E4
H4 completion
H6
K3-R6+
Agent execution
model/provider execution as product behavior
```

---

## 24. Authorization verdict

If and only if this docs-only authorization becomes canonical:

```text
NEXT_POST_G0_SLICE=
TRUSTED GATE OFFLINE ARTIFACT PACKAGE PROOF

FUTURE_RELEASE_PATH_ALLOWLIST=3_PATHS
CANONICAL_G0_SOURCE_MUTATION=FORBIDDEN
CANONICAL_G0_TEST_MUTATION=FORBIDDEN
DOCKER_DAEMON_USE_IN_OFFLINE_SLICE=FORBIDDEN
NETWORK_REGISTRY_USE=FORBIDDEN

MAX_FUTURE_RESULT=TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN

LOCAL_DOCKER_GATE_IMAGE_PREFLIGHT=SEPARATE_LATER_GATE
B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED
DOCKER_START=NO
WORKLOAD_EXECUTION=NO
TTL_ARM_BY_B2B=NO
GO_DISPATCH_OVER_DOCKER=NO
R3G_F_E4=NO
H4_COMPLETE=NO
```

This slice keeps the post-G0 progression fail-closed: first prove immutable offline artifact bytes, then separately prove local Docker provisioning/identity, and only after those prerequisites may a future B1-v2 authorization be considered.