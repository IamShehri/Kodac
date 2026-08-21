# KODAC KDO H4-R4B-B1V2 — Trusted Gate Image Delivery Readiness

Date: 2026-08-21
Status: **READINESS CANDIDATE — DOCS ONLY — NO PRODUCT IMPLEMENTATION AUTHORITY**
Repository: `TheHalfMoon/Kodac`

## 1. Decision

Canonical PR #140 selected the future H4-R4B-B2B I1 architecture:

```text
trusted pre-workload gate
+ pre-opened Docker attach stdin GO permit
+ durable R3G-D ARM before workload release
```

with target theorem:

```text
WORKLOAD_PROCESS_OCCURRENCES_BEFORE_DURABLE_ARM=0
```

This readiness record selects the preferred delivery boundary for that trusted gate:

```text
LOCAL DIGEST-PINNED DEDICATED GATE IMAGE
-> Docker Engine API v1.48 Mount.Type=image
-> exact local image preflight
-> exact resolved image ID used as mount source
-> fixed read-only image subpath
-> fixed in-container mount target
-> dedicated statically linked gate executable
```

This is preferred over a host bind mount because it avoids caller-selected host filesystem paths and their pathname/replacement theorem while remaining inside the already-pinned Docker control plane.

This document does **not** authorize:

```text
gate source implementation
gate image build
gate image pull
B1-v2 implementation
B2A-v2 implementation
B2B implementation
Docker create/start/attach mutation changes
workload execution
TTL ARM by B2B
GO dispatch
R3G-F E4
H4 completion
```

---

## 2. Exact canonical base

```text
repository=TheHalfMoon/Kodac
canonical_main=5a21c65326167e659734d40a74ef610375b7874f
canonical_tree=ba836695af5b34b6cc37f95c6a108863b21a8ed8
PR_140=MERGED_CANONICAL
```

PR #140 canonically records:

```text
CURRENT_B1_V1_LIVE_PROMOTION_TO_B2B=BLOCKED
CURRENT_B2A_V1_PRESTART_READY_LIVE_CONSUMPTION=BLOCKED
SELECTED_I1_ARCHITECTURE=TRUSTED_PRE_WORKLOAD_GATE_PLUS_PREOPENED_ATTACH_GO_PLUS_ARM_BEFORE_GO
TRUSTED_GATE_ARTIFACT_DELIVERY=NEXT_BLOCKER
```

Pinned upstream evidence:

```text
MOBY_COMMIT=d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
MOBY_API_VERSION=1.48
MOBY_API_SOURCE=api/docs/v1.48.yaml
```

Relevant canonical Kodac donor:

```text
packages/kodac-runtime/native/landlock-run.c
```

R2C is a protocol/architecture donor only; its authority is not widened.

---

## 3. Why host bind delivery is not selected

A fixed root-owned host bind mount could potentially be made safe under Kodac's trusted-host-root boundary, but it would require a new theorem covering:

```text
host path canonicalization
ancestor ownership/mode
symlink rejection
file device/inode/link count
same-bytes verification
path replacement between verification and Docker resolution
mount propagation
host-side write protection
caller-selected host path rejection
```

The future B2B architecture does not otherwise need a workload-visible host filesystem path.

Adding that path boundary would therefore create unnecessary authority and proof surface.

Decision:

```text
HOST_BIND_GATE_DELIVERY=NOT_SELECTED
CALLER_SELECTED_GATE_HOST_PATH=FORBIDDEN
```

No host bind authority is granted.

---

## 4. Docker API v1.48 natively supports image mounts

Pinned Moby API history states that API v1.48 added support for:

```text
POST /containers/create
Mount.Type=image
```

for mounting an image inside a container.

Pinned Moby `api/types/mount/mount.go` defines:

```text
TypeImage = "image"
ImageOptions.Subpath
Mount.ReadOnly
```

Pinned Linux mount parsing requires:

```text
Type=image => Source is non-empty
ImageOptions.Subpath => local path only
Target => absolute and not /
```

Therefore the feature is part of the exact API version already pinned by R4B-B1/B2A, rather than a future or unpinned Docker behavior.

---

## 5. Image mount resolution is local and becomes exact image-ID bound

Pinned Moby container mount registration performs purpose-equivalent logic for `TypeImage`:

```text
img = imageService.GetImage(ctx, mount.Source, ...)
-> CreateLayerFromImage(img, deterministic layerName, ...)
-> mount layer locally
-> mount.Name = original source
-> mount.Spec.Source = img.ID().String()
-> mount.Source = local mounted layer path
-> mount.RW = false
```

Important consequences:

```text
1. container create resolves an already-local image;
2. mount state is normalized to the resolved immutable image ID;
3. the container-visible mount is read-only;
4. this path does not itself authorize or perform an image pull;
5. a missing local gate image must fail closed rather than fetch it.
```

Future Kodac implementation must preserve:

```text
GATE_IMAGE_PULL_CALLS=0
REGISTRY_NETWORK_FOR_GATE=0
```

No `POST /images/create`, pull CLI, registry fallback, or network acquisition is authorized.

---

## 6. Reuse the existing B1 exact image-preflight pattern

Canonical B1 already performs a read-only local Docker image preflight through:

```text
GET /v1.48/images/{exactSourceReference}/json
```

and validates:

```text
Id = exact sha256 image ID
Descriptor.digest = exact admitted manifest digest
```

It also fails if the exact image cannot be inspected locally.

Future gate-image admission should reuse that pattern rather than invent a new image trust primitive.

Required future gate image identity should bind at minimum:

```text
gateSourceReference = immutable repository@sha256:<manifest>
gateManifestDigest = exact sha256 manifest digest
gateImageId = exact local sha256 image ID
gateMountSubpath = fixed local subpath
gateMountTarget = fixed absolute in-container path
gateExecutablePath = fixed path under gateMountTarget
gateProtocolVersion
gateImplementationIdentity
```

The create payload should use the exact preflight-resolved `gateImageId` as the `Type=image` mount `Source`, not a mutable tag.

The immutable repository digest remains evidence/provenance and must match the local image preflight descriptor.

---

## 7. Preferred mount shape

A future separately authorized B1-v2 should use one purpose-equivalent mount only:

```text
Type: image
Source: <exact preflight-resolved sha256 gate image ID>
Target: <fixed Kodac gate mount target>
ReadOnly: true
ImageOptions.Subpath: <fixed gate payload directory>
```

The exact target/subpath strings are not pinned by this readiness record because the dedicated gate artifact does not yet exist.

A later authorization must pin them before product integration.

Required properties:

```text
one gate image mount exactly
no caller-selected source
no caller-selected target
no caller-selected subpath
no bind mount fallback
no volume fallback
no tmpfs fallback
no host path
no writable gate mount
no second gate mount
```

---

## 8. Safe subpath theorem comes from pinned Moby

Pinned Moby `MountPoint.Setup` handles image `Subpath` through its `safepath.Join` mechanism.

That means the selected mount can expose only a fixed subtree of the dedicated gate image rather than the whole image filesystem.

The future gate image should therefore have a deliberately minimal payload subtree, purpose-equivalent to:

```text
/gate-v1/
  kodac-gvisor-workload-gate
```

and B1-v2 should mount only that subtree at one fixed target.

The exact filesystem layout remains to be pinned with the actual gate source/artifact.

---

## 9. Dedicated gate image must not be the workload image

The trusted gate must be independently identified from the admitted workload image.

Forbidden:

```text
use workload image's shell as gate
use workload image's Entrypoint as gate
use workload image-provided wrapper
trust a file merely because workload image digest is pinned
PATH-search gate inside workload image
```

Reason:

```text
WORKLOAD_IMAGE_IDENTITY != K2_TRUSTED_GATE_IDENTITY
```

The gate is part of Kodac's trusted runtime boundary.

The workload remains untrusted/admitted payload whose execution is delayed until durable ARM.

---

## 10. Gate executable must be static/self-contained

A gate binary mounted from a trusted image is not sufficient if its ELF interpreter or shared libraries are resolved from the workload root filesystem before GO.

Therefore the future gate artifact must be proven no weaker than:

```text
ELF executable appropriate for the authorized Linux architecture
statically linked / no runtime dynamic loader dependency
no PT_INTERP
no DT_NEEDED
no LD_PRELOAD/LD_LIBRARY_PATH behavior
no plugin loading
no locale/module/script loading before GO
no shell/interpreter delegation
no workload-image code executed before GO
```

The future proof should include binary-format inspection and hostile environment tests.

A gate that is dynamically linked against libraries from the workload image is forbidden.

---

## 11. R2C launcher is a donor, not the selected gate artifact

Canonical `native/landlock-run.c` already proves useful security patterns:

```text
fixed bounded GO grammar
fail closed on malformed/extra permit data
controlled pre-exec wait
FD_CLOEXEC before target exec
absolute target requirement
no target exec before permit
```

However it is not selected as the B1-v2 gate artifact because:

```text
it includes Landlock policy/enforcement logic unrelated to B2B gate duty;
it uses R2C-specific launcher/READY/permit descriptor semantics;
it is licensed/derived as an R2B/R2C donor implementation;
its current tests compile it with normal cc linking rather than a proven static no-loader artifact theorem.
```

Reusing it directly would unnecessarily enlarge the B2B trusted computing base and import unrelated authority.

Decision:

```text
R2C_LANDLOCK_RUN_DIRECT_REUSE=NO
R2C_PROTOCOL_DESIGN_DONOR=YES
```

A future gate should be a new minimal dedicated implementation with no Landlock operations.

---

## 12. Minimal future gate responsibility

The dedicated gate source should contain no more authority than required for this theorem.

Conceptual responsibility:

```text
validate its fixed invocation shape
identify exact deferred target argv supplied by trusted B1-v2 composition
block on its single gate-control stdin
accept only the exact authorized GO grammar
close gate-control stdin before workload exec
execve exact deferred target with exact argv
on any error/EOF/cancellation condition before valid GO: exit without workload exec
```

Forbidden gate features:

```text
filesystem policy engine
Landlock setup
network
Docker/gVisor RPC
process enumeration
forking worker processes
shell execution
PATH resolution
caller-selected protocol
config file loading
plugin loading
signal-based release
retry loop that can reinterpret malformed input
workload stdin forwarding
```

The gate should be intentionally boring and auditable.

---

## 13. Gate invocation must preserve workload semantics exactly

Current B1-v1 configures:

```text
Entrypoint = [workloadExecutable]
Cmd = workloadArgs
```

A future gated create must preserve the workload's eventual argv semantics.

Purpose-equivalent future shape:

```text
Entrypoint = [fixed gate executable path]
Cmd = [exact workloadExecutable, ...exact workloadArgs]
```

The gate must not perform option parsing over workload args.

It should treat:

```text
argv[1] = exact deferred absolute workload executable
argv[2..] = exact original workload args
```

or another separately pinned unambiguous grammar.

At release, target argv must be exactly equivalent to the canonical direct form:

```text
[workloadExecutable, ...workloadArgs]
```

The gate must inherit and preserve the already-admitted workload environment and working directory without interpreting environment values as gate configuration.

---

## 14. Gate control stdin must never become workload stdin

Future B1-v2 needs Docker stdin open only so the trusted gate can receive the release permit.

Before target exec, the gate must close gate-control stdin.

Future theorem:

```text
GATE_CONTROL_STDIN=ENABLED_PRE_RELEASE
WORKLOAD_STDIN=DISABLED_POST_RELEASE
```

No user/model/caller interactive input is authorized.

No permit bytes may be inherited by the workload.

No second attach may provide workload stdin.

---

## 15. GO framing needs a dedicated protocol decision

PR #140 recorded an illustrative `GO\n` plus EOF grammar based on the R2C donor.

For the future Docker hijacked attach transport, EOF/half-close behavior must not be assumed until exact duplex continuity is proven, because the same connection must continue carrying stdout/stderr after workload release.

Therefore this readiness record deliberately does not make EOF normative.

The future gate protocol authorization must choose one exact framing that preserves the long-lived output side, for example a fixed-length exact permit with local gate-side stdin close after acceptance.

Until then:

```text
GO_GRAMMAR_FINAL=UNRESOLVED
GO_EOF_REQUIREMENT=NOT_NORMATIVE
```

This clarification does not weaken the PR #140 safety theorem:

```text
NO VALID GO => NO WORKLOAD EXEC
```

---

## 16. Gate image availability and provenance

The dedicated gate image must be provisioned outside the B1-v2 execution transaction and already exist locally before admission.

Future B1-v2 must never:

```text
pull gate image
build gate image
load gate image from arbitrary path
accept caller-selected registry
accept mutable tag as trust identity
request credentials
access external network for gate acquisition
```

If the exact gate image is absent:

```text
B1_V2=BLOCKED
DOCKER_CREATE=0
DOCKER_START=0
WORKLOAD_EXEC=0
```

The artifact release process itself requires a separate reproducible-build/provenance theorem.

---

## 17. Image ID and manifest digest both matter

The gate image trust record should bind both:

```text
manifest digest = distribution/provenance identity
local image ID = exact locally resolved Docker image identity
```

Future preflight must prove they correspond for the exact local image before create.

Create should then use the exact image ID in the mount source.

A mutable tag or later tag retarget cannot affect the already-resolved gate mount identity.

If the local image ID or descriptor changes between required preflight brackets:

```text
FAIL_CLOSED
NO_CREATE_OR_NO_PROMOTION
```

Exact bracket timing belongs to the later B1-v2 authorization.

---

## 18. Gate image config is not executable authority

The gate image is a mounted artifact filesystem, not the primary container image.

Future B1-v2 must not inherit from the gate image:

```text
Entrypoint
Cmd
Env
User
WorkingDir
Volumes
StopSignal
Healthcheck
network metadata
```

Only the exact mounted gate payload subtree is relevant.

The workload image remains the source of the admitted workload environment/user/working-directory semantics already validated by B1.

---

## 19. No hidden writable layer authority

Pinned Moby internally creates/mounts a layer from the gate image while registering the image mount, but it sets the resulting container mount `RW=false`.

Kodac's future theorem is about the container-visible mount:

```text
GATE_MOUNT_READ_ONLY=YES
```

The trusted Docker daemon remains inside the canonical host trust boundary.

The workload/gate must have no write authority to the gate mount.

Any observed writable gate mount is a hard failure.

---

## 20. Required future gate artifact identity

Before B1-v2 product integration can be authorized, a concrete gate artifact package must exist and be pinned with at least:

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

Those concrete values cannot be invented before the artifact is implemented and built.

Therefore this readiness record resolves the **delivery mechanism**, but not the final concrete artifact identity.

---

## 21. Required isolated next slice before B1-v2 integration

The smallest safe next implementation-oriented candidate is not B1-v2 itself.

It is an isolated artifact slice, purpose-equivalent to:

```text
KDO-H4-R4B-G0
DEDICATED TRUSTED GVISOR WORKLOAD GATE SOURCE + STATIC ARTIFACT PROOF
```

That slice should be separately authorized and limited to a tiny source/test surface.

Candidate future paths:

```text
packages/kodac-runtime/native/gvisor-workload-gate.c
packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
```

No exact path allowlist is granted by this readiness record; a separate authorization must pin it.

G0 must not modify:

```text
B1 runtime
B2A runtime
Docker request code
R3G-D
R3G-E
R3G-F
package-root authority
workflow authority
```

G0 must execute no Docker start/workload path.

---

## 22. G0 proof requirements

A future G0 authorization should require hostile tests no weaker than:

```text
source has one minimal gate mode only
absolute target required
missing target rejected
malformed gate invocation rejected
EOF/no permit => no exec
wrong permit => no exec
short permit => no exec
extra permit bytes => no exec
exact permit => exact target argv exec
no PATH lookup
hostile LD_PRELOAD/LD_LIBRARY_PATH cannot execute pre-main code in gate
binary has no PT_INTERP
binary has no DT_NEEDED
gate closes control stdin before target exec
gate does not emit stdout/stderr before target exec
source contains no socket/network/Docker/gVisor/Landlock API use
```

The exact permit grammar should be pinned in G0 authorization after Docker duplex semantics are finalized.

---

## 23. Threat model

Future gate delivery review must explicitly defend against:

- mutable gate image tags;
- gate image absent locally causing an implicit pull;
- caller-selected gate image source;
- gate manifest digest not matching local image descriptor;
- local image ID substitution;
- mounting the workload image as its own gate;
- writable gate mount;
- gate subpath traversal;
- target mount shadowing or conflicting mounts;
- dynamic loader or shared library coming from the workload image;
- `LD_PRELOAD`, `LD_LIBRARY_PATH`, locale, NSS, plugin, or shell behavior before GO;
- gate argv option injection by workload arguments;
- gate control stdin leaking into workload stdin;
- second gate image mount;
- second attach writer;
- gate artifact version mismatch with B1-v2/B2A-v2 protocol version;
- mutable artifact identity after container create;
- assuming image manifest identity without local image-ID bracket;
- using Docker build/pull as part of an admission attempt.

---

## 24. Current blocker resolution status

After this readiness decision:

```text
TRUSTED_GATE_DELIVERY_MECHANISM=SELECTED_DIRECTION
SELECTED_GATE_DELIVERY=LOCAL_DIGEST_PINNED_DOCKER_IMAGE_MOUNT
HOST_BIND_GATE_DELIVERY=NOT_SELECTED
R2C_LAUNCHER_DIRECT_REUSE=NO
R2C_PROTOCOL_DONOR=YES
STATIC_GATE_REQUIRED=YES
CONCRETE_GATE_ARTIFACT=NOT_YET_IMPLEMENTED
CONCRETE_GATE_BINARY_SHA256=UNRESOLVED
CONCRETE_GATE_IMAGE_DIGEST=UNRESOLVED
GO_GRAMMAR_FINAL=UNRESOLVED
```

Therefore:

```text
B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED
```

---

## 25. Merge gates for this readiness PR

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

If main changes, this delivery selection must be reconciled against the new canonical base before merge.

---

## 26. Explicit non-grants

Nothing here grants:

```text
gate source code changes
gate test changes
gate binary build for production
gate image build/push/pull/load
Docker image mount product usage
B1-v2 create payload changes
B2A-v2 input attach changes
B2B start
workload execution
live measurement
TTL ARM by B2B
GO write
Docker kill/stop/remove/restart
runsc kill
host PID kill
new native runtime authority
R3G-D/E/F authority widening
R3G-F E4
H4 completion
H6
K3-R6+
```

---

## 27. Readiness verdict

```text
PR_140_GATED_START_ARCHITECTURE=CANONICAL

PREFERRED_TRUSTED_GATE_DELIVERY=
LOCAL DIGEST-PINNED DEDICATED GATE IMAGE
+ API_V1_48_TYPE_IMAGE_MOUNT
+ EXACT_LOCAL_IMAGE_PREFLIGHT
+ EXACT_RESOLVED_IMAGE_ID_SOURCE
+ SAFE_FIXED_SUBPATH
+ READ_ONLY_MOUNT
+ STATIC_DEDICATED_GATE

HOST_BIND_GATE_DELIVERY=REJECTED_FOR_NEXT_SCOPE
WORKLOAD_IMAGE_GATE=FORBIDDEN
R2C_LANDLOCK_LAUNCHER_DIRECT_REUSE=NO

NEXT_SAFE_GATE=
G0 DEDICATED TRUSTED GVISOR WORKLOAD GATE SOURCE + STATIC ARTIFACT PROOF AUTHORIZATION

DOCKER_START=NO
WORKLOAD_EXECUTION=NO
TTL_ARM_BY_B2B=NO
GO_DISPATCH=NO
R3G_F_E4=NO
H4_COMPLETE=NO
```

The selected mechanism keeps the gate content-addressed and local, removes a new host-path trust surface, uses a feature introduced in the exact Docker API version already pinned by Kodac, and keeps the workload image outside the gate trust boundary. The remaining work is to create and prove the minimal static gate artifact itself before any B1-v2 integration is considered.