# KDO-H4-R3G-B — Immutable OCI Image-Base / Rootfs Physical Lineage Authorization

Date: 2026-08-16

Status: **AUTHORIZATION CANDIDATE V3 — DOCS ONLY — IMPLEMENTATION NOT AUTHORIZED UNTIL CANONICAL MERGE**

Repository: `TheHalfMoon/Kodac`

Canonical authorization base:

```text
adab893d8e122320f441ec9a85a77527d92fbd02
```

Canonical predecessor:

```text
KDO-H4-R3G-A = CLOSED / MERGED / CANONICAL / PROVEN
KODAC_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_PROVEN
```

This V3 supersedes the non-canonical authorization candidates in PR #106 and PR #107. Neither prior PR is implementation authority.

---

## 1. Authorization decision

```text
DECISION:
AUTHORIZE_A_BOUNDED_R3G_B_V1_ONLY_AFTER_THIS_V3_DOCUMENT_BECOMES_CANONICAL

SLICE:
KDO-H4-R3G-B — IMMUTABLE OCI IMAGE-BASE / ROOTFS PHYSICAL LINEAGE

SUPPORTED V1 STACK:
LINUX
+ DOCKER ENGINE CONTAINERD IMAGE STORE
+ EXTERNAL CONTAINERD
+ CONTAINERD NAMESPACE moby
+ CONTAINERD SNAPSHOTTER overlayfs
+ GVISOR

OUTPUT CLASS:
E3 PHYSICAL SOURCE CANDIDATE ONLY
```

No R3G-B production or test implementation may begin before this V3 authorization is merged to canonical `main`.

---

## 2. Material corrections incorporated before canonical authorization

The review process deliberately rejected unsafe or inaccurate shortcuts before any implementation authority was granted.

### 2.1 `containerd Container.SnapshotKey` is not Moby rootfs authority

R3G-B MUST NOT infer physical Docker rootfs lineage from `Container.SnapshotKey` metadata.

Pinned Moby itself creates the active container snapshot using the exact Docker container ID as snapshot key.

Therefore:

```text
activeSnapshotKey = exact full Docker container ID
```

is derived from pinned Moby semantics, not from mutable/optional container metadata.

### 2.2 `<runsc bundle>/rootfs` is not the Moby rootfs locator

Pinned Moby mounts the RW snapshot, stores the host path as `container.BaseFS`, and writes it into OCI `Spec.Root.Path`.

For the supported snapshotter path the Moby target is:

```text
<DockerRootDir>/rootfs/overlayfs/<containerId>
```

The canonical R3E runsc bundle remains subject/provenance evidence only.

### 2.3 Durable evidence requires replay-safe semantics

A timeout/lost acknowledgment cannot leave an ambiguous retry contract.

The single R3G-B durable callback is therefore a replay-safe logical put keyed by deterministic `recordIdentity` across process restarts.

### 2.4 Containerd socket authority cannot be a bare path stat

A before/after socket inode check alone does not prevent path replacement during a query.

V3 requires a root-owned, non-group/world-writable, no-symlink path authority chain plus per-query endpoint identity checks, under an explicit trusted-host-root boundary.

### 2.5 Rootfs pathname authority must be protected

The pathname used to locate the Moby mount must not be replaceable through writable/symlink ancestors.

V3 protects every **parent authority component** through `<DockerRootDir>/rootfs/overlayfs`, then treats the final `<containerId>` component as the mounted filesystem object: it must be an exact non-symlink directory mountpoint and is held by a retained descriptor across the proof window.

The final mounted root directory is **not** required to be root-owned/non-writable, because image filesystem metadata may legitimately define its ownership/mode; pathname replacement is prevented by the protected parent directory.

### 2.6 The `ctr` executable must be immutable to the modeled attacker

V3 requires root-owned non-writable parent authority and a root-owned, non-group/world-writable regular executable whose exact bytes are SHA-256 verified and whose identity is checked around each execution.

### 2.7 Bounded means a total deadline, not only per-call timeouts

V3 adds one monotonic total observation deadline and explicit child termination/reaping semantics for timed-out/cancelled `ctr` invocations.

### 2.8 Identity/record encoding is normative

V3 defines exact domain separation, canonical tuple serialization and record preimage ordering so replay-safe persistence has one unambiguous key and byte representation.

---

## 3. Exact bounded theorem

One successful R3G-B V1 invocation must prove all of these for one exact execution instance:

1. exact canonical R3E gVisor runtime subject is live and stable;
2. exact canonical R3F Docker binding is stable;
3. R3F manifest digest equals `requirement.workload.source.digest`;
4. trusted Docker SystemInfo reports the exact supported Linux/containerd/overlayfs topology and canonical DockerRootDir;
5. exact digest-qualified local image inspect returns the exact required manifest descriptor;
6. that same bounded inspect returns an ordered non-empty canonical DiffID sequence;
7. DiffIDs derive one exact expected image ChainID;
8. pinned Moby semantics establish active snapshot key = exact Docker container ID;
9. bounded containerd snapshot observations prove exactly one authorized ancestry ending at expected image ChainID;
10. the DockerRootDir/rootfs/overlayfs parent pathname authority is canonical, no-symlink, root-owned and not group/world writable;
11. pinned Moby semantics derive exact final physical rootfs target `<protected-parent>/<containerId>`;
12. stored OCI `Spec.Root.Path` equals that exact target;
13. the final target is a non-symlink directory and exact kernel-visible `overlay` mount;
14. a retained rootfs directory descriptor remains bound to the same mounted object across the proof window;
15. Docker endpoint, containerd endpoint authority, `ctr` artifact, storage locator, stored spec, snapshot ancestry and mount identities remain stable;
16. the whole observation finishes within one monotonic total deadline;
17. the deterministic E3 source record is durably persisted through the replay-safe logical-put contract and receives an exact canonical acknowledgment;
18. success receipt is persisted only after the exact durable acknowledgment.

Any missing, ambiguous, drifting or mismatched conjunct fails closed.

---

## 4. Claim vocabulary

R3G-B V1 may prove only:

```text
immutable OCI image-base / rootfs lineage
```

It does not prove:

```text
running rootfs globally read-only
writable active upper layer absent
all runtime filesystem bytes unchanged
```

A normal active Docker snapshot may be writable above immutable image ancestry.

---

## 5. Evidence class

R3G-B emits only:

```text
E3 PHYSICAL SOURCE CANDIDATE
```

It MUST NOT construct or claim:

```text
SandboxBackendObservation
SandboxExecutionEvidence
E4 final backend proof
```

---

## 6. Exact upstream source pins

```text
OCI image-spec:
repository = opencontainers/image-spec
commit     = af26a05fba5ee648512f4ea3c9fda1fcc1b6d6dc

OCI runtime-spec:
repository = opencontainers/runtime-spec
commit     = 6999a89a76a0329f440d5740497bedb9dd431297

Moby:
repository = moby/moby
commit     = d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3

containerd:
Moby dependency = github.com/containerd/containerd/v2 v2.3.4
resolved commit = db8809540e1a7a9da5d518876894933ff55692ab

gVisor predecessor pin:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

Pinned Moby source inspected includes:

```text
daemon/containerd/image_snapshot.go
daemon/containerd/image_inspect.go
daemon/containerd/service.go
daemon/snapshotter/mount.go
daemon/daemon.go
daemon/daemon_unix.go
daemon/oci_linux.go
daemon/info.go
daemon/inspect.go
daemon/start.go
daemon/server/router/image/image_routes.go
daemon/internal/libcontainerd/replace.go
daemon/internal/libcontainerd/remote/client.go
daemon/internal/libcontainerd/remote/client_linux.go
api/types/image/image_inspect.go
```

Pinned containerd source inspected includes:

```text
client/container.go
client/image.go
core/containers/containers.go
core/snapshots/snapshotter.go
cmd/ctr/commands/containers/containers.go
cmd/ctr/commands/snapshots/snapshots.go
```

---

## 7. R3F E2 is required but insufficient

Canonical R3F already requires:

```text
InspectResponse.ImageManifestDescriptor.Digest
==
requirement.workload.source.digest
```

R3G-B preserves that equality.

None of these alone is physical source proof:

```text
image name/tag
RepoTags/RepoDigests
InspectResponse.Image
Config.Image
R3F manifest E2 digest
Container.SnapshotKey
R3E bundle path
OCI Root.Path string
snapshot name
rootfs pathname
```

---

## 8. Exact digest-qualified local image inspect

The only authorized image reference is the canonical immutable reference equivalent to:

```text
<canonical workload source repository>@<requirement.workload.source.digest>
```

Docker image inspect uses fixed API `v1.48`.

Pinned Moby retains `ImageInspect.Descriptor` for API v1.48 and later; V1 must require:

```text
Descriptor.Digest == requirement.workload.source.digest
RootFS.Type == layers
RootFS.Layers = ordered canonical DiffIDs
```

Mutable returned names/tags are non-authoritative diagnostics.

No remote registry resolution is authorized.

---

## 9. DiffID theorem

R3G-B requires one or more ordered DiffIDs.

Each DiffID must be exactly:

```text
sha256:<64 lowercase hexadecimal characters>
```

V1 rejects:

```text
empty list
non-SHA256
uppercase/non-canonical
malformed digest
over-limit list
ambiguous structure
```

Zero-layer/scratch images are deferred.

---

## 10. ChainID theorem

For one DiffID:

```text
ChainID(D0) = D0
```

For each later DiffID:

```text
ChainID(D0...Dn)
=
sha256(ChainID(D0...D(n-1)) + " " + Dn)
```

The hash preimage contains full canonical digest strings including `sha256:`.

The result is canonical:

```text
sha256:<64 lowercase hexadecimal characters>
```

Validation rederives this value.

---

## 11. Supported storage topology

V1 authorizes exactly:

```text
Docker Engine containerd image store
Docker SystemInfo.OSType == linux
Docker SystemInfo.Driver == overlayfs
external containerd address == trusted configured address
containerd namespace == moby
containerd snapshotter == overlayfs
```

Legacy graphdriver/overlay2 is deferred.

Embedded/ambiguous topology fails closed.

---

## 12. Pinned Moby active-snapshot theorem

Pinned Moby creates the container layer with:

```text
layerName = exact Docker container ID
```

For the supported image-store path it:

```text
resolves image parent snapshot from exact manifest
obtains ordered DiffIDs
derives identity.ChainID(diffIDs).String()
optionally commits <containerId>-init from that parent
prepares active snapshot key <containerId>
```

Therefore:

```text
activeSnapshotKey = exact full Docker container ID
```

is a pinned implementation theorem.

---

## 13. `Container.SnapshotKey` is non-authoritative

R3G-B MUST NOT use:

```text
containerd Container.SnapshotKey
containerd Container.Snapshotter
```

as physical Docker rootfs authority.

They may be ignored or recorded only as diagnostics.

---

## 14. Authorized ancestry A

```text
ACTIVE
name   = <containerId>
parent = <expectedImageChainID>

COMMITTED
name   = <expectedImageChainID>
```

No intermediate node.

---

## 15. Authorized ancestry B

```text
ACTIVE
name   = <containerId>
parent = <containerId>-init

COMMITTED INIT
name   = <containerId>-init
parent = <expectedImageChainID>

COMMITTED IMAGE
name   = <expectedImageChainID>
```

No second/arbitrary intermediate.

Snapshot labels/timestamps are not lineage authority.

---

## 16. Moby physical rootfs theorem

Pinned Moby mounts `container.RWLayer` and stores the result in:

```text
container.BaseFS
```

OCI spec construction then uses:

```text
Spec.Root.Path = container.BaseFS
```

For the supported Moby snapshotter mounter:

```text
physical target = <DockerRootDir>/rootfs/<snapshotter>/<containerId>
```

Therefore:

```text
rootfsParentPath = canonicalJoin(
  DockerRootDir,
  "rootfs",
  "overlayfs",
)

rootfsMountPath = canonicalJoin(
  rootfsParentPath,
  exactContainerId,
)
```

---

## 17. Rootfs parent pathname authority

Before the final mount target may be trusted, the complete parent path authority from `/` through `rootfsParentPath` must be proven.

For every directory component from `/` through:

```text
DockerRootDir
DockerRootDir/rootfs
DockerRootDir/rootfs/overlayfs
```

V1 requires:

```text
canonical absolute path component
lstat/fstat proves directory
no symlink component
uid == 0
not group-writable
not world-writable
device/inode/mode/uid/gid identity captured
```

The ordered component identities form `rootfsParentAuthorityIdentity`.

The same ordered authority chain must be revalidated at the end of the observation and must be identity-equal.

A writable or symlink ancestor fails closed.

---

## 18. Final rootfs mount component

The final `<containerId>` component is the mounted filesystem object, not a pathname-authority parent.

It MUST satisfy:

```text
basename == exact canonical full containerId
lstat says directory
not symlink
exactly one kernel mount record resolves to exact path
filesystem type == overlay
```

V1 does **not** require the mounted root directory's uid/mode to be root-owned/non-writable because image filesystem metadata may legitimately control the mounted root's ownership/mode.

Path replacement is prevented by the protected non-writable parent authority in Section 17.

To bind the final mounted object across the proof window, the gateway must open the exact directory with Linux no-follow/directory semantics purpose-equivalent to:

```text
O_RDONLY | O_DIRECTORY | O_NOFOLLOW
```

and retain that descriptor until the observation finishes.

Its `fstat` identity is captured pre/post and must remain equal.

The path's final `lstat` identity must agree with the retained descriptor at both ends of the observation.

---

## 19. Stored OCI spec cross-check

Bounded `ctr containers info <exactContainerId>` may be used only for exact container/spec cross-check.

Required equality:

```text
containerInfo.ID == exactContainerId
containerInfo.Spec.Root.Path == rootfsMountPath
```

`Image`, `SnapshotKey`, `Snapshotter`, labels and unrelated metadata do not establish source identity.

---

## 20. R3E bundle is not rootfs authority

R3G-B MUST NOT derive:

```text
rootfsMountPath = <R3E runsc bundle>/rootfs
```

and MUST NOT require a Moby internal bundle label to equal the runsc-state bundle.

R3E binding uses canonical predecessor identities:

```text
exact container ID
requirement/workload identity
executionAttemptIdentity
containerBindingIdentity
runtimeLineageIdentity
stable runsc state/process identity
```

---

## 21. Docker SystemInfo locator theorem

The R3F Docker provider may add one bounded read-only SystemInfo observation.

Required fields are purpose-equivalent to:

```text
OSType == linux
Driver == overlayfs
DockerRootDir = canonical absolute path
Containerd.Address == trusted configured external containerd Unix socket
Containerd.Namespaces.Containers == moby
```

Missing or unsupported fields fail closed.

`/var/lib/docker` MUST NOT be hard-coded.

---

## 22. Narrow R3F image-rootfs extension

The existing R3F provider may add only bounded read-only support for:

```text
Docker SystemInfo security fields
exact digest-qualified image inspect
ordered RootFS DiffIDs
```

It must preserve all canonical R3F binding semantics.

Image inspect requirements:

```text
Docker API v1.48
trusted existing R3F Unix-socket endpoint
exact digest-qualified local source reference
Descriptor.Digest equality
RootFS.Type == layers
ordered RootFS.Layers
strict response/time/JSON bounds
no mutable name/tag authority
```

---

## 23. No remote image authority

R3G-B MUST NOT contact:

```text
registry
Docker Hub
credential helper
registry auth service
remote resolver
```

Required image missing locally -> fail closed.

---

## 24. Host-root trust boundary

R3G-B V1 trusts the host kernel and host root administrative boundary.

An attacker with host root, CAP_SYS_ADMIN-equivalent control, or authority to alter protected root-owned system paths is outside this V1 threat model because such an actor can also subvert kernel/mount/daemon observations.

R3G-B still defends against untrusted agent input and non-root local races.

This boundary must be stated in the eventual evidence ledger and bounded claim.

---

## 25. Pinned read-only `ctr` configuration

Trusted runtime configuration may contain purpose-equivalent exact fields:

```text
version
ctrPath
expectedCtrSha256
containerdAddress
commitSourceLineageEvidence
```

Caller input cannot select/override them.

No generic command/argv callback is allowed.

---

## 26. `ctr` pathname and file authority

Before `ctr` may execute, V1 must validate its canonical path authority from `/` through the executable's parent directory.

Every parent directory component must be:

```text
canonical
no symlink
uid == 0
not group-writable
not world-writable
directory
```

The `ctr` file itself must be:

```text
regular file
not symlink
uid == 0
not group-writable
not world-writable
no setuid bit
no setgid bit
non-empty
exact SHA-256 == expectedCtrSha256
```

The gateway opens and hashes the exact file instance, captures its `fstat` identity, and retains the file descriptor through the observation.

Before and after **every** `ctr` child invocation the path must still resolve to the same regular-file identity as the retained verified descriptor, and the parent authority chain must remain equal.

Under the Section 24 threat model, a non-root actor cannot modify or replace the protected executable or its pathname after hashing.

A bare `hash(path)` followed by unconstrained path execution is forbidden.

---

## 27. Containerd socket path authority

Containerd address must be canonical absolute Unix-socket path.

The complete parent directory chain from `/` through the socket parent must be:

```text
canonical
no symlink
uid == 0
not group-writable
not world-writable
```

The endpoint itself must be:

```text
Unix socket
uid/gid/mode within exact trusted V1 policy
device/inode identity captured
```

For every individual `ctr` invocation:

```text
validate full parent path authority immediately before spawn
capture socket identity immediately before spawn
execute only verified ctr with fixed address
capture socket identity immediately after child exit
revalidate full parent authority
require exact pre/post socket identity equality
```

Bare observation-window before/after socket stat without protected parent authority is forbidden.

If the deployment cannot satisfy this theorem, V1 fails closed.

---

## 28. Fixed containerd domain

V1 fixes:

```text
namespace = moby
snapshotter = overlayfs
```

No enumeration/discovery.

---

## 29. Allowed `ctr` surfaces

Only semantic equivalents of:

```text
containers info <exactContainerId>
snapshots info <exactContainerId>
snapshots info <exactContainerId>-init       # only if active parent demands it
snapshots info <exactExpectedImageChainID>
```

are authorized, plus fixed trusted address/namespace/snapshotter flags.

No shell.

---

## 30. Forbidden `ctr` surfaces

Forbidden include:

```text
snapshots prepare/view/mount/mounts/diff/commit/remove/delete/label
images pull/push/mount/unmount/tag/delete
containers create/delete/label
tasks kill/exec
```

No caller-supplied subcommand/argv.

`snapshots mounts` is forbidden because it may activate mounts.

---

## 31. Kernel mount proof

The exact `rootfsMountPath` must have exactly one bounded canonical mountinfo record.

Required normalized fields include at least:

```text
mount ID
parent mount ID
major:minor
root
mountpoint
mount options
filesystem type
mount source
super options
```

Filesystem type must be exactly:

```text
overlay
```

Mountinfo path escaping must be decoded before canonical comparison.

Pre/post normalized mount identity must be equal.

The retained rootfs descriptor identity must also remain equal.

Directory existence alone is not proof.

---

## 32. Writable active upper layer is allowed

A writable active upper/work layer is compatible with the image-base theorem.

R3G-B MUST NOT label it immutable.

---

## 33. No full byte reconstruction

V1 does not recursively hash every rootfs file or reconstruct every image tar stream.

It proves:

```text
exact manifest digest
+ ordered DiffIDs
+ exact ChainID
+ pinned Moby active-snapshot theorem
+ exact snapshot ancestry
+ protected Moby rootfs path authority
+ stored OCI Root.Path equality
+ live stable overlay mount
+ exact stable R3E/R3F subject
```

A stronger byte-reconstruction theorem requires separate authorization.

---

## 34. Exact subject binding

The gateway cannot observe an arbitrary container ID.

The record must bind at least:

```text
requirementIdentity
workloadIdentity
executionAttemptIdentity
containerBindingIdentity
runtimeLineageIdentity
exact full containerId
R3E state/process identities
required source digest
```

Revalidation requires:

```text
R3E containerId == R3F containerId
R3E/R3F binding identities agree
R3F manifest digest == requirement.workload.source.digest
```

---

## 35. Dedicated capability

Purpose-equivalent capability:

```text
runtime.observe.gvisor.source-lineage
```

Policy:

```text
allow -> may proceed
ask   -> block
deny  -> block
```

MUST NOT be added to generic workspace/K3 policies.

---

## 36. No caller host authority injection

Public gateway input must not expose caller-selectable:

```text
ctrPath
containerdAddress
DockerRootDir
namespace
snapshotter
containerId
snapshotKey
parentSnapshot
rootfsPath
bundle
reader
helper
command
argv
socketPath
```

---

## 37. Linux-only

macOS/Windows production path must fail before host observation.

Cross-platform tests must prove it.

---

## 38. Total monotonic observation deadline

V1 defines one total monotonic deadline:

```text
totalObservationTimeoutMs = 60_000
```

The deadline begins before the first host/control-plane observation and includes:

```text
R3E/R3F revalidation
Docker SystemInfo
Docker image inspect
all ctr calls
rootfs path/mount observations
all stability rechecks
durable commit wait
receipt decision
```

Every sub-operation receives only the remaining global budget and also obeys its stricter per-operation bound.

A sub-operation MUST NOT extend the global deadline by starting a new full timeout window.

Global deadline expiry fails the invocation and cannot later return success.

Use of wall-clock time for the deadline is forbidden; implementation must use a monotonic timer source.

---

## 39. Per-operation timing bounds

V1 upper bounds:

```text
Docker request timeout         <= 5_000 ms
ctr invocation timeout         <= 5_000 ms
commit acknowledgment timeout <= 5_000 ms
ctr terminate grace           <= 500 ms
```

Every effective timeout is:

```text
min(perOperationLimit, remainingGlobalDeadline)
```

---

## 40. `ctr` timeout/cancellation cleanup

If a `ctr` child reaches per-call timeout, global deadline, or cancellation:

```text
1. stop accepting stdout/stderr as evidence;
2. request termination with SIGTERM;
3. wait at most ctrTerminateGraceMs for child exit/close;
4. if still live, send SIGKILL;
5. await child exit/close and reap it;
6. close all child pipes/listeners;
7. discard partial output;
8. fail the observation.
```

The gateway MUST NOT return from the child-operation boundary while that child remains unreaped.

No orphaned `ctr` process may continue and later influence evidence.

Required hostile tests:

```text
ctr timeout -> TERM -> exit -> reaped
ctr ignores TERM -> KILL -> exit -> reaped
cancellation during ctr -> child reaped
partial late stdout after timeout cannot become evidence
global-deadline expiry during ctr -> child reaped
```

---

## 41. Bounded observation order

Successful flow is equivalent to:

```text
1. start total monotonic deadline
2. validate requirement + capability
3. resolve/revalidate exact R3F binding
4. observe exact R3E subject pre-state
5. validate Docker endpoint, ctr artifact and containerd path authorities
6. read bounded Docker SystemInfo
7. require supported topology
8. inspect exact digest-qualified local image
9. require Descriptor.Digest + extract ordered DiffIDs
10. derive expected ChainID
11. validate rootfs parent pathname authority
12. derive exact rootfsMountPath
13. open/retain exact rootfs directory descriptor with no-follow semantics
14. read ctr container info and require Spec.Root.Path equality
15. read active snapshot info
16. optionally read exact init snapshot
17. read expected image ChainID snapshot
18. validate exactly one authorized ancestry
19. observe kernel mount pre-state and retained rootfs fstat
20. re-observe R3E subject
21. re-observe/revalidate R3F binding
22. re-observe storage/spec/snapshot identities
23. re-observe mount + retained rootfs fstat
24. revalidate parent pathname, ctr and containerd endpoint authorities
25. require exact stability and remaining global budget
26. create/validate canonical deterministic E3 source record
27. invoke replay-safe durable commit once for this observation attempt
28. validate exact acknowledgment within remaining deadline
29. recheck cancellation/deadline
30. persist success receipt + return success
```

Equal/stronger reorder only.

---

## 42. Canonical primitive normalization

Before any identity is derived, fields are normalized exactly:

```text
UTF-8 strings: valid, bounded, NUL forbidden
version/domain strings: exact constants
paths: canonical absolute POSIX paths, no dot/dotdot ambiguity
digests: lowercase canonical sha256:<64 hex>
plain SHA-256 identities: lowercase 64 hex
container ID: exact canonical full ID already accepted by predecessor contract
uid/gid/mode: non-negative safe integers
mount IDs: canonical positive decimal strings
stat device/inode/size: canonical unsigned decimal strings
booleans: JSON true/false only
nullable values: JSON null only
arrays: dense arrays with exact order and finite length
```

No floats, NaN, Infinity, getters, proxies, symbol fields or undefined values may enter canonical identity material.

---

## 43. Canonical V1 hash function

R3G-B uses the same design family already canonical in Kodac trust modules.

Purpose-equivalent exact function:

```text
hashV1(domain, tuple) =
SHA256_HEX_LOWERCASE(
  ASCII("KODAC-H4-R3G-B\0" + domain + "\0V1\0")
  || UTF8(JSON.stringify(tuple))
)
```

Requirements:

```text
domain is one exact ASCII constant
payload is a fixed-position array, never an unordered object
JSON.stringify uses only already-normalized primitives/dense arrays/null
no insignificant whitespace
UTF-8 bytes are hashed exactly
```

A validator must reconstruct the same tuple from validated fields and rederive the identity.

---

## 44. Normative identity domains and tuples

V1 defines at minimum these exact domain separators and ordered tuples.

### `DOCKER_STORAGE`

```text
[
  dockerEndpointIdentity,
  "linux",
  "overlayfs",
  DockerRootDir,
  containerdAddress,
  "moby",
  "overlayfs"
]
```

### `IMAGE_ROOTFS`

```text
[
  sourceDigest,
  diffIds,
  expectedImageChainId,
  dockerEndpointIdentity
]
```

### `ROOTFS_PARENT_COMPONENT`

For each ordered parent component:

```text
[
  canonicalPath,
  device,
  inode,
  uid,
  gid,
  mode
]
```

### `ROOTFS_PARENT_AUTHORITY`

```text
[
  orderedRootfsParentComponentIdentities
]
```

### `CTR_ARTIFACT`

```text
[
  ctrCanonicalPath,
  ctrSha256,
  ctrDevice,
  ctrInode,
  ctrUid,
  ctrGid,
  ctrMode,
  ctrSize,
  ctrParentAuthorityIdentity
]
```

### `CONTAINERD_ENDPOINT`

```text
[
  containerdCanonicalAddress,
  socketDevice,
  socketInode,
  socketUid,
  socketGid,
  socketMode,
  socketParentAuthorityIdentity
]
```

### `CONTAINER_SPEC`

```text
[
  exactContainerId,
  rootfsMountPath
]
```

### `SNAPSHOT_NODE`

```text
[
  name,
  kind,
  parent
]
```

### `SNAPSHOT_ANCESTRY`

```text
[
  activeSnapshotNodeIdentity,
  initSnapshotNodeIdentityOrNull,
  imageSnapshotNodeIdentity
]
```

### `ROOTFS_MOUNT`

```text
[
  rootfsMountPath,
  rootfsParentAuthorityIdentity,
  retainedRootfsDevice,
  retainedRootfsInode,
  mountId,
  parentMountId,
  majorMinor,
  mountRoot,
  mountOptions,
  "overlay",
  mountSource,
  superOptions
]
```

All path/stat/mount strings in these tuples are normalized before hashing.

---

## 45. Canonical E3 source record tuple

The durable canonical record bytes are defined as UTF-8 bytes of `JSON.stringify(recordTuple)` where `recordTuple` is exactly this fixed-position array:

```text
[
  "kodac-h4-r3g-b-source-record-v1",
  "gvisor",
  "e3-physical-source-candidate",
  requirementIdentity,
  workloadIdentity,
  executionAttemptIdentity,
  containerBindingIdentity,
  runtimeLineageIdentity,
  exactContainerId,
  sourceDigest,
  dockerStorageIdentity,
  imageRootfsIdentity,
  expectedImageChainId,
  ctrArtifactIdentity,
  containerdEndpointIdentity,
  rootfsParentAuthorityIdentity,
  containerSpecIdentity,
  snapshotAncestryIdentity,
  rootfsMountIdentity
]
```

`recordIdentity` is **not** included inside `recordTuple`.

It is derived exactly as:

```text
recordIdentity = hashV1("SOURCE_RECORD", recordTuple)
```

The runtime object may expose named fields for readability, but validation MUST reconstruct this exact tuple and byte sequence.

Wall-clock timestamps, random IDs, diagnostics and mutable display names are excluded from durable identity bytes.

---

## 46. Distinct-observation collision rule

Any security-relevant change in:

```text
R3E/R3F predecessor identity
source digest
DiffID/ChainID lineage
Docker storage locator
ctr artifact
containerd endpoint
rootfs parent authority
stored OCI Root.Path
snapshot ancestry
physical rootfs mount
```

must change at least one canonical tuple element and therefore the corresponding identity/recordIdentity.

A validator MUST reject a supplied identity that does not equal the rederived canonical value.

---

## 47. Replay-safe durable source-evidence commit

Trusted runtime configuration exposes one callback purpose-equivalent to:

```text
commitSourceLineageEvidence(record)
```

It is a durable logical put keyed by `recordIdentity` across gateway/process restart.

Required semantics:

```text
FIRST EXACT PUT:
- persist exact canonical record bytes under recordIdentity;
- return canonical acknowledgment bound to that identity.

REPLAY OF SAME EXACT CANONICAL BYTES:
- do not create a second logical record;
- verify stored bytes are exactly equal;
- return same canonical acknowledgment semantics.

SAME recordIdentity + DIFFERENT BYTES:
- integrity violation;
- fail closed.
```

No status-query API is authorized or required.

---

## 48. Lost acknowledgment and fresh retry

If durable storage succeeds but acknowledgment is lost/times out:

```text
current invocation = FAIL CLOSED / NOT SUCCESS
```

Late completion cannot upgrade that invocation.

A later retry is permitted only after a fresh complete R3G-B observation.

If fresh observation reconstructs exactly the same canonical record bytes/identity, the replay-safe logical put may return the existing canonical acknowledgment without duplicate evidence.

If any security-relevant observation changed, a distinct `recordIdentity` is required.

No blind same-invocation retry is required.

---

## 49. Commit acknowledgment identity

Purpose-equivalent acknowledgment object:

```text
version = kodac-h4-r3g-b-source-commit-v1
recordIdentity = exact expected recordIdentity
commitIdentity = hashV1("SOURCE_COMMIT", [version, recordIdentity])
```

Validation rederives both expected fields.

Malformed/missing/wrong/timed-out/aborted acknowledgment prevents success.

---

## 50. Cancellation and failure receipts

Cancellation is checked:

```text
before host observation
during Docker requests
during ctr child operations
between observation phases
before commit
during commit acknowledgment wait
before success receipt
```

A failure receipt describes failure of the proof invocation only.

It MUST NOT claim external-store rollback/non-write after a timed-out callback.

Success receipt only after exact commit acknowledgment.

---

## 51. Conservative resource bounds

Implementation must choose equal or stricter bounds than:

```text
maxPathBytes                 = 4096
maxDockerSystemInfoBytes     = 1 MiB
maxDockerImageInspectBytes   = 1 MiB
maxCtrContainerInfoBytes     = 1 MiB
maxCtrSnapshotInfoBytes      = 256 KiB each
maxDiffIds                   = 512
maxMountInfoBytes            = 2 MiB
maxMountEntries              = 16384
maxJsonDepth                 = 64
maxJsonNodes                 = 32768
maxObjectKeys                = 4096
maxArrayItems                = 8192
maxStringBytes               = 65536
totalObservationTimeoutMs    = 60000
dockerRequestTimeoutMs       = 5000
ctrTimeoutMs                 = 5000
ctrTerminateGraceMs          = 500
commitTimeoutMs              = 5000
maxRecordSerializedBytes     = 128 KiB
```

Truncation-and-accept is forbidden.

---

## 52. Parser/object safety

Docker/ctr JSON parsing must be:

```text
bounded before parse
duplicate-key safe
finite depth/nodes/keys/arrays/string bytes
```

In-memory validators reject proxies, accessors, symbol fields and structural ambiguity before attacker-controlled property traps execute.

---

## 53. Mount parser safety

Reject:

```text
oversize
NUL
malformed separator
missing mandatory fields
invalid mountinfo escaping
non-canonical target
ambiguous duplicate target
unexpected filesystem type
trailing structural ambiguity
```

---

## 54. No mutation

R3G-B MUST NOT perform:

```text
container create/start/stop/delete
image pull/push/tag/delete
snapshot prepare/view/commit/remove/mount
mount(2)/unmount(2)
setns/unshare/chroot/pivot_root
filesystem writes under DockerRootDir/rootfs
containerd/Docker metadata mutation
cgroup/network mutation
```

Only authorized evidence/receipt stores may write their own records.

---

## 55. No shell / no discovery

Forbidden:

```text
sh -c / bash -c / eval
cmd /c / PowerShell command strings
PATH lookup for ctr
which / command -v
containerd socket scanning
Docker data-root scanning
namespace enumeration
snapshotter enumeration
recursive /var/lib discovery
```

---

## 56. No private containerd metadata parsing

R3G-B MUST NOT parse containerd BoltDB/private storage files.

Authorized containerd source is pinned read-only `ctr` against the trusted local API.

---

## 57. No new native helper or dependency

The existing R3D native helper remains unchanged.

No new C/Go/Rust helper and no package dependency update is authorized in V1.

If this theorem cannot be satisfied with pinned `ctr` + fixed kernel reads, implementation stops for reconciliation.

---

## 58. Protected predecessor semantics

R3G-B preserves without weakening:

```text
R3A workload source identity
R3B pure backend evidence contracts
R3D gVisor candidate
R3E runtime lineage
R3F Docker E2 control-plane binding
R3G-A cgroup-v2 E3 resource evidence
H5 guarded-agent behavior
```

---

## 59. Explicit non-claims

R3G-B does not prove:

```text
physical CPU/memory/swap
physical deny-all network
TTL
output limit
globally read-only rootfs
absence of writable upper layer
full filesystem byte reconstruction
registry/Sigstore provenance
SBOM correctness
source-code provenance
legacy graphdriver lineage
host-root compromise resistance
R3B final backend observation/evidence
H4 complete
H6 authorized
```

---

## 60. Current gateway byte-pin reconciliation

At canonical base:

```text
packages/kodac-runtime/src/execution/gateway.ts
5e4c3cea9982d7c774d0c18beb40f2fcbfde4e64
```

Exact authorization-time search found executable pins in exactly:

```text
packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

Historical R3G-A evidence ledger is not rewritten.

Search MUST be repeated immediately before implementation.

---

## 61. Exact pre-ledger implementation allowlist

Only after this V3 authorization is canonical, implementation may modify exactly these fourteen paths before the R3G-B ledger exists:

```text
1.  packages/kodac-runtime/src/trust/sandbox-observer-gvisor-source-lineage.ts
2.  packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
3.  packages/kodac-runtime/src/execution/gateway.ts
4.  packages/kodac-runtime/src/index.ts
5.  packages/kodac-runtime/test/kdo-h4-r3g-b-gvisor-source-lineage.test.ts
6.  packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
7.  packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
8.  packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
9.  packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
10. packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
11. packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
12. packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
13. packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
14. packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

No fifteenth pre-ledger path.

The nine predecessor tests may change only for exact gateway byte-pin reconciliation while preserving their owned theorem.

---

## 62. Narrow R3F production allowance

Only bounded read-only additions for:

```text
Docker SystemInfo security fields
exact digest-qualified image inspect
ordered RootFS DiffIDs
```

are authorized in the R3F production module.

No canonical R3F theorem may weaken.

---

## 63. Explicit protected paths

Without separate reconciliation R3G-B MUST NOT modify:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/trust/policy.ts
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/trust/confinement.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/*
.github/workflows/*
```

No dependency/schema/workflow/generated-code/donor-import change.

---

## 64. Required focused hostile cases

Focused R3G-B proof must include at least:

```text
wrong/non-canonical source digest
wrong digest-qualified reference
Descriptor.Digest mismatch
empty/oversize/reordered/duplicate/malformed DiffIDs
wrong ChainID
unsupported Docker topology
non-canonical DockerRootDir
rootfs parent symlink
rootfs parent non-root-owned
rootfs parent group/world writable
rootfs final target symlink/not-directory/not-mount
retained rootfs fd/path identity mismatch
wrong stored Spec.Root.Path
missing/wrong active snapshot
unexpected intermediate
wrong/missing init snapshot
wrong/missing committed image snapshot
snapshot drift
ctr parent writable/symlink/non-root
ctr file writable/non-root/wrong hash/wrong identity
containerd parent writable/symlink/non-root
containerd socket wrong type/identity
simulated socket swap under invalid authority
Docker endpoint replacement
malformed/duplicate/oversize ctr JSON
ctr timeout with TERM/reap
ctr TERM ignored -> KILL/reap
ctr cancellation cleanup
late ctr output ignored
global deadline expiry
mountinfo malformed/ambiguous/wrong fstype
mount identity drift
R3E subject drift
R3F binding drift
pre/during cancellation
commit callback failure
wrong commit acknowledgment
commit timeout
lost acknowledgment after durable write
fresh full re-observation + replay-safe same-record commit
same recordIdentity with different canonical bytes rejected
late commit completion cannot upgrade failure
non-Linux production fail-closed
caller host-authority injection rejection
```

---

## 65. Focused synthetic success theorem

Synthetic success demonstrates:

```text
exact required manifest
-> digest-qualified image inspect
-> Descriptor.Digest equality
-> ordered DiffIDs
-> expected ChainID
-> pinned Moby active key = containerId
-> authorized snapshot ancestry
-> protected rootfs parent authority
-> derived final mount target
-> retained rootfs descriptor
-> stored OCI Root.Path equality
-> stable kernel overlay mount
-> stable R3E/R3F subject
-> stable ctr/containerd/Docker authorities
-> total-deadline compliance
-> canonical tuple identities
-> deterministic source record bytes
-> replay-safe durable exact acknowledgment
```

Synthetic fixture success is not a claim that CI provisioned a production host.

---

## 66. Evidence ledger lifecycle

Reserved ledger:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

It MUST remain absent during implementation/pre-ledger review.

After exact-head pre-ledger PASS it may be created in one ledger-only commit as the sole additional path.

Fresh complete post-ledger certification is mandatory.

---

## 67. Required implementation gate

Before ledger creation:

```text
implementation base = exact canonical main containing V3 authorization
changed paths = only fourteen allowlisted paths
reserved ledger = absent
governance/provenance = PASS
legacy tests/ruff = PASS
runtime classifier = PASS
Ubuntu Typecheck + full Test + benchmark = PASS
Windows Typecheck + full Test + benchmark = PASS
macOS Typecheck + full Test + benchmark = PASS
K2 aggregate gate = PASS
K3-R4 regression = PASS
K3-R5 regression = PASS
focused R3G-B proof = PASS
focused R3F regression = PASS
manual architecture/trust/security review = PASS
unresolved actionable review threads = 0
```

External status truth is mandatory; pending/rate-limited/unavailable is not PASS.

---

## 68. Manual security review questions

Before ledger, answer NO to every unsafe possibility:

```text
caller chooses ctr/containerd/DockerRootDir/snapshot/rootfs authority
mutable name/tag establishes source proof
Container.SnapshotKey establishes Moby lineage
R3E bundle/rootfs becomes Moby rootfs authority
writable/symlink rootfs parent can redirect path
final mount target can be replaced while retained fd remains trusted
ctr bytes can change after hash under modeled attacker
ctr child can outlive timeout/cancellation boundary
complete observation can run without a finite deadline
containerd socket can be swapped by modeled non-root actor
bare socket stat substitutes for path authority
arbitrary snapshot ancestry passes
directory existence substitutes for mount
writable upper layer is mislabeled immutable
mount invisibility downgrades to metadata-only success
identity encoding can vary for same facts
distinct security facts can reuse same recordIdentity
lost acknowledgment can create duplicate logical record
same recordIdentity can map to different bytes
late completion can upgrade failure
R3G-B mints final R3B evidence
generic workspace/K3 policy gains capability
unsupported storage silently falls back
```

---

## 69. Bounded claim after canonical implementation merge

Only after canonical authorization, scoped implementation, pre-ledger PASS, ledger-only transition, fresh post-ledger PASS, canonical merge and post-merge quality may Kodac claim:

```text
KODAC_LINUX_GVISOR_IMMUTABLE_OCI_IMAGE_BASE_LINEAGE_PROVEN
```

Meaning only:

> K2 can bind one exact canonical R3E gVisor execution instance and exact R3F Docker container to a stable Linux Docker/containerd-overlayfs physical rootfs whose active snapshot key is fixed by pinned Moby container-ID semantics, whose bounded snapshot ancestry terminates at the exact image ChainID derived from ordered local OCI DiffIDs belonging to the exact required manifest digest, whose protected Moby rootfs pathname and stored OCI Root.Path agree, whose final rootfs object is retained and observed as a stable kernel overlay mount, and whose canonical deterministic E3 source record is persisted through a replay-safe durable logical put under bounded host authority and a finite total observation deadline, without mutating container, image, snapshot or mount state.

---

## 70. Explicit non-claims after R3G-B

Does NOT mean:

```text
globally read-only rootfs
writable upper layer absent
full byte reconstruction
registry/Sigstore provenance
SBOM correctness
source-code provenance
legacy graphdriver lineage
host-root compromise resistance
physical deny-all network
TTL
output limit
R3B final backend observation/evidence
H4 complete
H6 authorized
```

---

## 71. Expected next slice

Purpose-equivalent next candidate after proven R3G-B:

```text
KDO-H4-R3G-C — Physical Deny-All Network Observation
```

No R3G-C authority is pre-authorized here.

---

## 72. Authorization PR scope

This V3 authorization PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

Reserved ledger absent.

---

## 73. Authorization review gate

Before V3 becomes canonical:

```text
base = exact canonical main adab893d8e122320f441ec9a85a77527d92fbd02
changed paths = exactly this one authorization document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2/K3 regressions = PASS where triggered
manual architecture/trust review = PASS
external review = no unresolved actionable finding
```

No implementation branch is authorized until this V3 document is merged to canonical `main`.

---

## 74. Final authorization invariant

```text
IMAGE NAME/TAG IS NOT PHYSICAL IDENTITY.
R3F MANIFEST E2 ALONE IS NOT PHYSICAL LINEAGE.
CONTAINER.SNAPSHOTKEY METADATA IS NOT MOBY V1 AUTHORITY.
R3E RUNSC BUNDLE IS NOT THE MOBY ROOTFS LOCATOR.
WRITABLE/SYMLINK PARENT PATH AUTHORITY IS NOT ACCEPTABLE.
ROOTFS PATH STRING ALONE IS NOT PHYSICAL LINEAGE.
SNAPSHOT METADATA ALONE IS NOT PHYSICAL LINEAGE.
BARE CTR HASH-THEN-PATH-EXEC IS NOT ACCEPTABLE.
BARE SOCKET BEFORE/AFTER STAT IS NOT SUFFICIENT ENDPOINT AUTHORITY.
UNBOUNDED TOTAL OBSERVATION IS NOT ACCEPTABLE.
UNREAPED TIMED-OUT CTR CHILD IS NOT ACCEPTABLE.
AMBIGUOUS IDENTITY SERIALIZATION IS NOT ACCEPTABLE.
NON-REPLAY-SAFE DURABLE COMMIT IS NOT ACCEPTABLE.

R3G-B V1 REQUIRES:

exact required manifest digest
+ ordered immutable DiffIDs
+ exact derived ChainID
+ pinned Moby active-key theorem
+ exact bounded snapshot ancestry
+ protected rootfs parent authority
+ retained final rootfs object
+ exact stored OCI Root.Path equality
+ stable kernel overlay mount
+ exact stable R3E/R3F subject
+ protected pinned ctr authority
+ protected containerd endpoint authority
+ finite monotonic total deadline
+ deterministic canonical tuple identities
+ deterministic canonical source-record bytes
+ replay-safe durable logical put
+ exact acknowledgment

OR IT FAILS CLOSED.
```
