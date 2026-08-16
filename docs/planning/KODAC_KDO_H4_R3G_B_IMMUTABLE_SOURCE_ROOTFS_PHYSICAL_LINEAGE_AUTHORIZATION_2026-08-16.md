# KDO-H4-R3G-B — Immutable OCI Image-Base / Rootfs Physical Lineage Authorization

Date: 2026-08-16

Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — IMPLEMENTATION NOT AUTHORIZED UNTIL CANONICAL MERGE**

Repository: `TheHalfMoon/Kodac`

Canonical authorization base:

```text
adab893d8e122320f441ec9a85a77527d92fbd02
```

Canonical predecessor state:

```text
KDO-H4-R3G-A = CLOSED / MERGED / CANONICAL / PROVEN
KODAC_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_PROVEN
```

Revision note:

```text
This candidate supersedes the first PR #106 draft theorem.
The first draft incorrectly treated containerd Container.SnapshotKey and
<bundle>/rootfs as authoritative Moby rootfs surfaces.
Manual pinned-source review proved that Docker/Moby's Linux snapshotter path
mounts the container RW snapshot itself, stores that mount as BaseFS, and writes
BaseFS into OCI Spec.Root.Path. The corrected theorem below follows that actual
Moby execution path.
```

No R3G-B implementation is authorized while this document is only proposed.

---

## 1. Decision

```text
DECISION:
AUTHORIZE_A_BOUNDED_R3G_B_V1_AFTER_THIS_DOCUMENT_BECOMES_CANONICAL

SLICE:
KDO-H4-R3G-B — IMMUTABLE OCI IMAGE-BASE / ROOTFS PHYSICAL LINEAGE

V1 STORAGE THEOREM:
LINUX + DOCKER ENGINE + CONTAINERD IMAGE STORE + CONTAINERD OVERLAYFS SNAPSHOTTER + GVISOR

OUTPUT CLASS:
E3 PHYSICAL SOURCE CANDIDATE
```

R3G-B v1 proves only this bounded conjunction:

1. the exact canonical R3E gVisor execution subject remains the same running instance;
2. the exact R3F Docker container binding remains the same container and exact required manifest digest;
3. Docker's trusted local read-only control plane reports the supported containerd/overlayfs host storage configuration and canonical Docker data root;
4. the exact required OCI manifest resolves locally to an ordered non-empty DiffID list;
5. those DiffIDs deterministically derive one expected immutable image ChainID;
6. the pinned Moby implementation theorem maps the exact Docker container ID to the active container snapshot key;
7. containerd's read-only snapshot API proves the active snapshot ancestry terminates at that exact expected immutable image ChainID, with at most the one canonical Docker init snapshot;
8. the pinned Moby mount theorem derives the exact physical rootfs mount target from DockerRootDir + snapshotter + container ID;
9. the stored container OCI spec reports that exact physical target as `Root.Path`;
10. the exact physical target is a stable kernel-visible overlay mount during the observation window;
11. the stored Moby bundle label agrees with the exact R3E bundle identity;
12. all subject/control-plane/snapshot/mount/artifact endpoint identities remain stable through the bounded observation;
13. a durable E3 source-lineage record receives an exact acknowledgment before success can return.

Any failed conjunct fails closed.

---

## 2. Precise claim: immutable image-base lineage, not a globally read-only running rootfs

R3A authorizes an immutable OCI source digest. It does not require the running root filesystem to be globally read-only.

Docker normally uses an active writable container snapshot above immutable image snapshots.

Therefore the exact R3G-B term is:

```text
immutable OCI image-base / rootfs lineage
```

The theorem is:

> the running container's physically mounted active rootfs descends through the exact authorized snapshot ancestry to the image ChainID derived from the exact required content-addressed OCI source.

It is not:

> the complete running rootfs is immutable or read-only.

`ReadonlyRootfs=true` is not silently added as an R3G-B requirement.

---

## 3. Evidence class

R3G-B may emit only:

```text
E3 PHYSICAL SOURCE CANDIDATE
```

R3G-B MUST NOT mint or simulate:

```text
SandboxBackendObservation
SandboxExecutionEvidence
E4 final backend proof
```

Final R3B evidence remains a later conjunction gate.

---

## 4. Why R3F E2 is necessary but insufficient

Canonical R3F already proves through Docker Engine's read-only control plane:

```text
InspectResponse.ImageManifestDescriptor.Digest
==
requirement.workload.source.digest
```

That remains required.

It is not by itself physical rootfs/source proof.

The following are insufficient alone:

```text
Docker image name
Docker image tag
RepoTags
RepoDigests
InspectResponse.Image
Config.Image
bundle path string
OCI root.path string
R3F ImageManifestDescriptor digest alone
containerd snapshot name alone
physical mount path alone
```

R3G-B requires their bounded cross-authority conjunction.

---

## 5. Upstream primary-source pins

### OCI Image Spec

```text
repository: opencontainers/image-spec
commit:     af26a05fba5ee648512f4ea3c9fda1fcc1b6d6dc
sources:    manifest.md, config.md, identity/chainid.go-equivalent semantics
```

### OCI Runtime Spec

```text
repository: opencontainers/runtime-spec
commit:     6999a89a76a0329f440d5740497bedb9dd431297
source:     config.md
```

### Moby / Docker Engine

```text
repository: moby/moby
commit:     d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
```

Relevant pinned source inspected includes:

```text
daemon/containerd/image_snapshot.go
daemon/containerd/service.go
daemon/snapshotter/mount.go
daemon/daemon.go
daemon/daemon_unix.go
daemon/oci_linux.go
daemon/info.go
daemon/inspect.go
daemon/start.go
daemon/internal/libcontainerd/replace.go
daemon/internal/libcontainerd/remote/client.go
daemon/internal/libcontainerd/remote/client_linux.go
```

### containerd

Pinned Moby depends on:

```text
github.com/containerd/containerd/v2 v2.3.4
```

The verified annotated tag resolves to:

```text
db8809540e1a7a9da5d518876894933ff55692ab
```

Relevant source inspected includes:

```text
client/container.go
client/image.go
core/containers/containers.go
core/snapshots/snapshotter.go
cmd/ctr/commands/containers/containers.go
cmd/ctr/commands/snapshots/snapshots.go
```

### gVisor

Canonical predecessor pin remains:

```text
50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

---

## 6. OCI DiffID theorem

The OCI image configuration's `rootfs.diff_ids` is an ordered sequence of uncompressed layer digests.

R3G-B must derive the immutable image-base identity from that ordered content-addressed sequence, not from a mutable image name or tag.

R3G-B v1 accepts only canonical:

```text
sha256:<64 lowercase hexadecimal characters>
```

for every DiffID.

A non-SHA256 algorithm fails closed in v1 even if upstream OCI can support other algorithms.

---

## 7. ChainID theorem

R3G-B must implement the ordered ChainID derivation exactly.

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

The preimage uses canonical digest strings including the algorithm prefix.

The output is canonical:

```text
sha256:<64 lowercase hexadecimal characters>
```

Reordering, dropping, duplicating, inserting or changing any DiffID must invalidate or change the expected ChainID.

---

## 8. Zero-layer/scratch images are deferred in v1

R3G-B v1 requires at least one DiffID.

Zero-layer/scratch images fail closed under this first theorem because their empty-rootfs/snapshot ancestry requires a distinct proof shape.

This is scope narrowing, not a security judgment about scratch images.

---

## 9. V1 supports only the Docker containerd image-store path

Pinned Moby supports both containerd image-store/snapshotter mode and legacy graphdriver modes.

R3G-B v1 authorizes exactly:

```text
Docker Engine
containerd image store enabled
Docker SystemInfo.Driver == "overlayfs"
containerd namespace == "moby"
containerd snapshotter == "overlayfs"
```

Legacy graphdriver/overlay2 mode is not silently treated as equivalent.

Unsupported storage mode fails closed.

A graphdriver theorem requires separate authorization.

---

## 10. Corrected Moby active-snapshot theorem

Pinned Moby `ImageService.CreateLayer` calls its layer constructor with:

```text
layerName = exact Docker container ID
```

For containerd image-store mode, the constructor:

1. resolves the required image snapshot from the manifest;
2. obtains the ordered image DiffIDs;
3. derives `identity.ChainID(diffIDs).String()` as the image parent snapshot;
4. optionally creates and commits `<containerId>-init` from that image parent;
5. prepares the active container snapshot with exact key `<containerId>`.

The authoritative v1 snapshot key is therefore derived from pinned Moby creation semantics:

```text
activeSnapshotKey = exact full Docker container ID
```

It is **not** derived from `containerd Container.SnapshotKey` metadata.

---

## 11. Explicit correction: containerd Container.SnapshotKey is not R3G-B authority

Manual pinned-source review found that Moby's libcontainerd `ReplaceContainer` path creates the container with Moby's spec/runtime/bundle options and does not establish the physical Docker rootfs theorem through `containerd Container.SnapshotKey` metadata.

Therefore R3G-B MUST NOT require:

```text
containerdContainer.SnapshotKey == containerId
```

and MUST NOT treat a non-empty `SnapshotKey` as proof.

`SnapshotKey` and `Snapshotter` fields returned by `ctr containers info` are non-authoritative for this theorem and may be ignored except for bounded diagnostics.

The active snapshot is instead queried directly by the exact key defined by the pinned Moby theorem:

```text
ctr snapshots info <exactContainerId>
```

---

## 12. Authorized snapshot ancestry shape A — direct image parent

```text
ACTIVE container snapshot
name   = <containerId>
kind   = Active
parent = <expectedImageChainID>

COMMITTED image snapshot
name   = <expectedImageChainID>
kind   = Committed
```

No additional intermediate is accepted.

---

## 13. Authorized snapshot ancestry shape B — canonical Moby init snapshot

Pinned Moby may create one init snapshot:

```text
ACTIVE container snapshot
name   = <containerId>
kind   = Active
parent = <containerId>-init

COMMITTED init snapshot
name   = <containerId>-init
kind   = Committed
parent = <expectedImageChainID>

COMMITTED image snapshot
name   = <expectedImageChainID>
kind   = Committed
```

No second arbitrary intermediate is accepted.

No prefix/suffix approximation is permitted.

---

## 14. Snapshot labels are not lineage authority

Snapshot labels and timestamps are diagnostics only.

The v1 ancestry identity uses exact ordered:

```text
Name
Kind
Parent
```

for the nodes actually required by the theorem.

A label mentioning an expected digest cannot rescue a wrong parent chain.

---

## 15. Corrected Moby physical mount theorem

On Linux start, pinned Moby calls its platform mount path before OCI spec construction.

`Daemon.Mount` invokes:

```text
container.RWLayer.Mount(...)
```

and stores the returned path as:

```text
container.BaseFS
```

For the containerd image-store implementation, `rwLayer.Mount()` gets mounts for the exact active snapshot ID and passes them to Moby's ref-counted snapshotter mounter.

Pinned Moby constructs the physical mount target as:

```text
<DockerRootDir>/rootfs/<snapshotter>/<containerId>
```

and performs the actual mount at that target.

For R3G-B v1:

```text
snapshotter = overlayfs
rootfsMountPath = DockerRootDir + /rootfs/overlayfs/<containerId>
```

---

## 16. Corrected OCI Root.Path theorem

Pinned Moby writes:

```text
OCI Spec.Root.Path = container.BaseFS
```

Therefore a successful R3G-B v1 observation must require that the stored container OCI spec reports:

```text
Spec.Root.Path == derived rootfsMountPath
```

The path value alone is not proof; it is a dynamic cross-check between stored runtime intent and the physical kernel mount.

---

## 17. Explicit correction: `<bundle>/rootfs` is not the Moby rootfs authority

The initial candidate incorrectly imported a generic containerd runtime-v2 bundle/rootfs theorem into the Docker/Moby path.

For the pinned Moby integration, Docker mounts the RW layer itself and places the resulting host path in OCI `Root.Path`.

Therefore R3G-B MUST NOT require:

```text
rootfs == <R3E bundle>/rootfs
```

and MUST NOT reject a correct Moby execution merely because `<bundle>/rootfs` is not the active rootfs mount.

The R3E bundle remains an important subject/provenance identity, but not the rootfs mount locator.

---

## 18. R3E bundle cross-check through Moby metadata

Pinned Moby stores its bundle path in containerd container metadata under:

```text
com.docker/engine.bundle.path
```

R3G-B may read that exact label through bounded `ctr containers info` and MUST require it to equal the exact R3E bundle path already proven for the same container.

This cross-check binds the local containerd metadata object to the exact R3E subject.

The label does not establish source identity by itself.

---

## 19. Docker SystemInfo as a locator, not sole proof

Pinned Moby's read-only system info reports:

```text
DockerRootDir = daemon config Root
Driver        = imageService.StorageDriver()
Containerd.Address and namespaces when externally configured
```

R3G-B may extend the already trusted R3F Docker read-only provider with a bounded SystemInfo observation.

The security-relevant v1 fields are:

```text
OSType == "linux"
Driver == "overlayfs"
DockerRootDir = canonical absolute path
Containerd.Address = exact trusted configured containerd Unix socket path
Containerd.Namespaces.Containers == "moby"
```

If the pinned API representation omits the required external-containerd fields, v1 fails closed.

SystemInfo supplies a trusted locator/configuration cross-check. It does not replace snapshot or kernel observation.

---

## 20. No hard-coded `/var/lib/docker`

R3G-B MUST NOT assume:

```text
/var/lib/docker
```

as DockerRootDir.

DockerRootDir must come from the bounded trusted Docker SystemInfo observation and be canonicalized before use.

Caller input cannot override it.

---

## 21. Docker image-rootfs E2 extension

R3G-B needs the ordered DiffIDs corresponding to the exact required manifest digest.

The existing R3F provider may be extended only with bounded read-only methods necessary for:

```text
Docker SystemInfo
exact image inspect/rootfs observation for the required manifest digest
```

The image-rootfs observation must:

1. use the already trusted/pinned Docker Unix-socket endpoint model;
2. use fixed Docker API v1.48;
3. inspect only the exact source digest already proven by R3F;
4. require returned manifest descriptor digest to equal `requirement.workload.source.digest`;
5. extract only the ordered rootfs layer DiffIDs needed for ChainID derivation;
6. never use RepoTags/RepoDigests/names as source authority;
7. preserve Docker endpoint identity before/after;
8. remain bounded by response/time/parser limits.

This remains E2 metadata and becomes useful only through the R3G-B physical conjunction.

---

## 22. No remote registry authority

R3G-B v1 MUST NOT contact:

```text
Docker Hub
OCI registry
credential helper
registry authentication service
remote content resolver
```

The theorem uses only already-local trusted host state.

No registry credentials are accepted or emitted.

---

## 23. Pinned read-only `ctr` artifact

R3G-B v1 may use the host `ctr` executable only as a pinned read-only local containerd client.

Trusted R3G-B runtime configuration may contain exactly the source-lineage authority needed by this slice, purpose-equivalent to:

```text
version
ctrPath
expectedCtrSha256
containerdAddress
commitSourceLineageEvidence
```

The implementation must:

- canonicalize the trusted configured paths;
- open/hash/bind the `ctr` artifact before use;
- retain an execution identity resistant to path replacement;
- bind the containerd Unix-socket endpoint before/after use;
- reject caller attempts to choose either path.

---

## 24. Fixed containerd namespace and snapshotter

R3G-B v1 fixes:

```text
namespace   = moby
snapshotter = overlayfs
```

No namespace or snapshotter discovery/list operation is authorized.

Caller input cannot override either value.

---

## 25. Allowed `ctr` surfaces

Only these semantic command families are authorized:

```text
containers info <exactContainerId>
snapshots info <exactContainerId>
snapshots info <exactContainerId>-init     # only when active parent requires it
snapshots info <exactExpectedImageChainID>
```

with fixed trusted:

```text
address
namespace = moby
snapshotter = overlayfs   # snapshot calls
```

The pinned `ctr` source serializes container info and snapshot info as JSON.

No shell is permitted.

---

## 26. `ctr containers info` security-relevant fields

R3G-B uses `ctr containers info` only for subject/spec cross-checks.

Required fields include:

```text
ID == exact full container ID
Labels["com.docker/engine.bundle.path"] == exact R3E bundle
Spec.Root.Path == derived Moby rootfsMountPath
```

`Image` is mutable metadata and is not source identity.

`SnapshotKey` and `Snapshotter` in container metadata are not R3G-B lineage authority.

Runtime metadata may be retained diagnostically but cannot replace R3E runtime identity.

---

## 27. `ctr snapshots info` security-relevant fields

For every snapshot used in the proof, the bounded parser validates:

```text
Name
Parent
Kind
```

The exact role-specific kind must match the authorized ancestry shape.

Labels and timestamps are not lineage authority.

---

## 28. Explicitly forbidden `ctr` surfaces

R3G-B MUST NOT execute:

```text
snapshots prepare
snapshots view
snapshots mount
snapshots mounts
snapshots diff
snapshots commit
snapshots remove
snapshots delete
snapshots label
images pull
images push
images mount
images unmount
images tag
images delete
containers create
containers delete
containers label
tasks kill
tasks exec
```

No arbitrary caller-supplied ctr command or argv is authorized.

---

## 29. Why `ctr snapshots mounts` remains forbidden

The pinned command can pass snapshot mounts through the containerd mount manager and may activate mounts.

R3G-B is observation-only.

It must not create or activate a mount merely to prove one.

The existing Moby rootfs mount must already be present and is observed through the kernel.

---

## 30. Kernel physical rootfs mount observation

R3G-B derives exactly:

```text
rootfsMountPath = canonicalJoin(
  DockerRootDir,
  "rootfs",
  "overlayfs",
  exactContainerId,
)
```

Then it must use a fixed internal Linux kernel surface to prove at least:

```text
rootfsMountPath exists
rootfsMountPath is a directory
rootfsMountPath is not a symlink
exactly one canonical mount record resolves to the exact path
filesystem type == overlay
mount record is bounded and structurally valid
mount identity is stable across the observation window
```

Directory existence without a mount is not proof.

If Kodac's trusted host namespace cannot see the exact mount, v1 fails closed.

---

## 31. Mount namespace visibility is explicit

R3G-B v1 assumes Kodac executes in a host observation context that can see the Moby rootfs mount used by the local Docker Engine.

If Docker/Kodac mount namespaces make that physical mount invisible, R3G-B does not downgrade to E2 metadata.

It fails closed.

A cross-mount-namespace helper or `setns` theorem is not authorized by this document.

---

## 32. Writable active upper layer is allowed

The active container snapshot may contain a writable upper/work layer.

That does not invalidate the immutable image-base ancestry theorem.

R3G-B MUST NOT label the active upper layer immutable.

The immutable claim terminates at the expected image ChainID.

---

## 33. No recursive lowerdir byte-hashing theorem in v1

R3G-B v1 does not recursively hash every file beneath overlay lowerdirs and does not reconstruct every image tar stream during observation.

It uses:

```text
required content-addressed manifest
+ ordered DiffIDs
+ deterministic ChainID
+ pinned Moby snapshot construction semantics
+ live containerd snapshot ancestry
+ stored OCI root path
+ live kernel mount
```

A stronger independent byte-reconstruction theorem may be authorized later.

---

## 34. R3E subject identity is mandatory

R3G-B cannot operate on an arbitrary container ID.

The exact subject must originate from canonical trusted R3E lineage through the gateway.

At minimum the source candidate binds:

```text
requirementIdentity
workloadIdentity
executionAttemptIdentity
containerBindingIdentity
runtimeLineageIdentity
containerId
runsc process identity
R3E bundle identity/path
```

A caller-created structurally valid R3E record is not physical proof by itself.

---

## 35. R3F subject identity is mandatory

R3G-B must require the same exact R3F container binding/control-plane observation used for R3E.

At minimum:

```text
R3F containerId == R3E containerId
R3F bindingIdentity == R3E container binding identity
R3F imageManifestDigest == requirement.workload.source.digest
```

Any mismatch fails closed.

---

## 36. Source digest equality

The immutable source authority is always:

```text
requirement.workload.source.digest
```

The Docker image-rootfs observation must resolve that same digest.

A tag or mutable image name never substitutes.

---

## 37. Docker/containerd endpoint identity

R3G-B reuses the canonical R3F Docker Unix-socket endpoint identity theorem.

The configured containerd address must likewise be a canonical absolute Unix-socket path and an actual socket.

Before/after observations must bind at least:

```text
device
inode
uid
gid
mode
```

Endpoint replacement during the observation window fails closed.

---

## 38. `ctr` artifact identity

The trusted `ctr` executable identity must bind at least:

```text
trusted configured canonical path
SHA-256 executable bytes
regular-file stat identity from retained descriptor
```

A path replacement after binding must not change which executable bytes run.

No `PATH` lookup is authorized.

---

## 39. No caller authority injection

The public gateway method may accept only already-authorized requirement/subject inputs plus cancellation.

It must not expose caller options such as:

```text
ctrPath
containerdAddress
DockerRootDir
namespace
snapshotter
containerId
snapshotKey
parentSnapshot
bundle
rootfsPath
reader
helper
command
argv
socketPath
```

All host-reading authority is fixed internally or supplied through trusted constructor configuration.

---

## 40. Dedicated capability

R3G-B uses a dedicated protected capability purpose-equivalent to:

```text
runtime.observe.gvisor.source-lineage
```

Policy behavior:

```text
allow -> may proceed
ask   -> block
 deny -> block
```

This capability MUST NOT be added to generic workspace/K3 policies.

---

## 41. Linux only

R3G-B v1 is Linux-only.

macOS/Windows production paths must fail closed before host observation.

Cross-platform tests must prove the non-Linux fail-closed boundary.

---

## 42. Observation order

A successful invocation must use a bounded order equivalent to:

```text
1.  validate requirement and dedicated capability
2.  resolve/revalidate exact R3F binding
3.  observe exact R3E state/process/runtime identity (pre)
4.  bind Docker socket, containerd socket and ctr artifact
5.  read bounded Docker SystemInfo
6.  require Linux + overlayfs + canonical DockerRootDir + expected containerd address/namespace
7.  read bounded Docker image-rootfs observation for exact required manifest digest
8.  derive ordered DiffIDs + exact expected image ChainID
9.  read ctr container info for exact container ID
10. derive Moby rootfsMountPath from DockerRootDir/overlayfs/containerId
11. require stored Spec.Root.Path == derived rootfsMountPath
12. require stored Moby bundle label == exact R3E bundle
13. read active snapshot info using exact key containerId
14. if required, read exact containerId-init snapshot info
15. read exact expected image ChainID snapshot info
16. validate one authorized ancestry shape
17. observe exact kernel rootfs mount (pre)
18. re-observe R3E exact subject
19. re-observe/revalidate R3F exact binding
20. re-query security-relevant Docker/containerd lineage or prove equivalent exact stable identities
21. re-observe exact kernel rootfs mount (post)
22. re-check endpoint/artifact identities
23. require stable identities across the full window
24. create/validate E3 physical source candidate
25. durable commit + exact acknowledgment validation
26. persist K2 receipt and return success
```

Independent checks may be reordered only if the same or stronger race theorem remains.

---

## 43. Stability theorem

Success requires exact stable identity across every mutable boundary relied upon:

```text
R3E execution subject
R3F container binding
Docker endpoint
Docker SystemInfo security fields
containerd endpoint
ctr artifact
container info subject/spec identity
snapshot ancestry
physical rootfs mount
```

Observable drift fails closed.

---

## 44. Normalized identities

R3G-B must create deterministic domain-separated identities for at least:

```text
Docker storage locator
image-rootfs / ordered DiffID observation
expected image ChainID
container metadata subject/spec observation
snapshot ancestry
physical rootfs mount
final E3 source candidate
```

Validators rederive all derivable identities instead of shape-checking caller-supplied hashes.

---

## 45. Snapshot ancestry identity

The ancestry identity binds the exact ordered nodes used:

```text
active container snapshot
optional canonical init snapshot
committed expected image snapshot
```

Each node binds:

```text
name
kind
parent
```

An unordered set is forbidden.

---

## 46. Physical mount identity

The mount identity must be computed from canonical parsed kernel mount fields rather than raw unbounded mountinfo bytes.

It must bind enough information to detect replacement of the mount at the same target path.

At minimum it binds:

```text
derived rootfsMountPath
mount ID / parent ID where applicable
filesystem type
mount root/source as normalized by the supported overlay theorem
security-relevant canonical mount options
```

Exact final normalized fields may be narrowed during implementation if replacement detection remains at least as strong.

---

## 47. E3 source candidate

Purpose-equivalent v1 fields:

```text
version
runtimeClass = gvisor
evidenceClass = e3-physical-source-candidate
requirementIdentity
workloadIdentity
executionAttemptIdentity
containerBindingIdentity
runtimeLineageIdentity
containerId
sourceDigest
dockerStorageIdentity
imageRootfsIdentity
expectedImageChainId
ctrArtifactIdentity
containerdEndpointIdentity
containerSpecIdentity
snapshotAncestryIdentity
rootfsMountIdentity
candidateIdentity
```

Field names may be refined only without changing semantics or authority.

---

## 48. Durable source-lineage commit

Trusted runtime configuration may expose exactly one R3G-B durable commit callback.

The acknowledgment must bind the exact source candidate/record identity.

Wrong, malformed, missing, timed-out or aborted acknowledgment prevents success.

Late completion after timeout/abort cannot upgrade failure to success.

No status-query or idempotency API is implicitly authorized.

---

## 49. Cancellation

Cancellation must be honored:

```text
before host observation
during Docker read
during ctr read
between lineage observations
before commit
during commit acknowledgment wait
before success receipt
```

A late underlying completion cannot change the returned failed/cancelled invocation into success.

---

## 50. Failure receipts

A bounded attributable K2 failure receipt may record failure of the observation/proof invocation.

It must not overclaim that an external durable store rolled back or never wrote after a timed-out non-cancellable callback.

---

## 51. Strict output and parser bounds

Implementation must define finite conservative limits before accepting host data.

At minimum:

```text
maxPathBytes                 <= 4096
maxDockerSystemInfoBytes     <= 1 MiB
maxDockerImageInspectBytes   <= 1 MiB
maxCtrContainerInfoBytes     <= 1 MiB
maxCtrSnapshotInfoBytes      <= 256 KiB per response
maxDiffIds                   <= 512
maxMountInfoBytes            <= 2 MiB
maxMountEntries              <= 16384
maxJsonDepth                 <= 64
maxJsonNodes                 <= 32768
maxObjectKeys                <= 4096
maxArrayItems                <= 8192
maxStringBytes               <= 65536
ctrTimeoutMs                 <= 5000
commitTimeoutMs              <= 5000
maxRecordSerializedBytes     <= 128 KiB
```

Implementation may choose stricter values.

Oversize data fails closed; truncation-and-accept is forbidden.

---

## 52. JSON parser safety

Docker/ctr JSON parsing must be:

```text
bounded before parse
duplicate-key safe
finite-depth
finite-node-count
finite-key-count
finite-array-count
finite-string-size
plain-object/data-property safe for in-memory validation
```

Proxy/accessor hostile validation fixtures must fail before attacker-controlled property access where the existing trust-module pattern supports that theorem.

---

## 53. Mount parser safety

Kernel mount parsing must reject:

```text
oversized input
NUL
malformed separator
missing mandatory fields
invalid escaping
non-canonical target
ambiguous duplicate exact target
unexpected filesystem type
trailing structural ambiguity
```

Raw encoded path comparison is insufficient; mountinfo path escaping must be decoded canonically.

---

## 54. No mutation

R3G-B MUST NOT perform:

```text
container create/start/stop/delete
image pull/push/tag/delete
snapshot prepare/view/commit/remove/mount
mount(2)
unmount(2)
setns
unshare
pivot_root
chroot
filesystem write under DockerRootDir/rootfs
containerd metadata update
Docker metadata update
cgroup mutation
network mutation
```

The only writes are the existing evidence/receipt persistence callbacks.

---

## 55. No shell / no discovery

Forbidden production behavior includes:

```text
sh -c
bash -c
cmd /c
PowerShell command strings
eval
PATH search for ctr
which ctr
command -v ctr
containerd socket scanning
Docker root scanning
snapshotter enumeration
namespace enumeration
recursive /var/lib discovery
```

Trusted constructor configuration and fixed protocol constants define the authority surface.

---

## 56. No direct containerd metadata-file parsing

R3G-B MUST NOT parse containerd BoltDB or implementation-private on-disk metadata directly.

The authorized containerd observation source is the pinned read-only `ctr` artifact against the trusted local containerd API.

---

## 57. No new native helper in v1

The existing R3D C helper remains a tiny pidfd/process-identity primitive.

R3G-B does not expand it into a containerd or filesystem helper.

No new C/Go/Rust helper is authorized by this v1 document.

If pinned `ctr` plus fixed internal kernel reads are insufficient, implementation must stop and reconcile authority rather than silently add a helper/dependency.

---

## 58. Protected predecessor semantics

R3G-B must preserve canonical meanings of:

```text
R3A immutable workload source
R3B pure backend evidence contracts
R3D gVisor runtime candidate
R3E runtime lineage
R3F Docker E2 control-plane binding
R3G-A cgroup-v2 E3 resource evidence
H5 guard/agent behavior
```

A predecessor theorem cannot be weakened to make R3G-B pass.

---

## 59. R3G-A remains independent

R3G-B source success does not imply resource success.

R3G-A evidence is not used as a substitute for source lineage.

The later final R3B conjunction may require both independent facts.

---

## 60. Explicit non-claims

R3G-B does not prove:

```text
physical CPU/memory/swap       # R3G-A owns this
physical deny-all network      # R3G-C candidate
TTL
output limit
running rootfs globally read-only
absence of writable upper layer
every rootfs file independently rehashed
registry signature
Sigstore provenance
SBOM correctness
source-code-to-image provenance
legacy graphdriver lineage
R3B final SandboxBackendObservation
R3B SandboxExecutionEvidence
H4 complete
H6 authorized
```

---

## 61. Current gateway byte-pin reconciliation

At authorization base, gateway blob is:

```text
packages/kodac-runtime/src/execution/gateway.ts
5e4c3cea9982d7c774d0c18beb40f2fcbfde4e64
```

Exact repository search during authorization preparation found executable tests pinning this blob in exactly:

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

The R3G-A evidence ledger also records the historical blob and must not be rewritten merely because a later authorized gateway change supersedes executable byte pins.

Before any R3G-B implementation write, the exact search MUST be repeated.

An additional executable pin outside the allowlist stops implementation pending reconciliation.

---

## 62. Exact pre-ledger implementation allowlist

Only after this authorization becomes canonical, R3G-B implementation may modify exactly these fourteen paths before the evidence ledger exists:

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

No fifteenth pre-ledger path is authorized.

The nine predecessor tests may change only to reconcile a superseded gateway byte pin and preserve their owned theorem.

---

## 63. R3F module allowance is narrow

The only authorized R3F production extension is bounded read-only Docker observation required for R3G-B:

```text
SystemInfo security fields
exact required image/rootfs DiffID observation
```

It must not change canonical R3F semantics for:

```text
container discovery
exact container binding
network/resource assertions
provider identity
manifest digest equality
Docker socket authority
```

The existing focused R3F test must prove predecessor behavior remains intact.

---

## 64. Explicit protected paths

R3G-B MUST NOT modify without separate reconciliation:

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

No dependency, generated-code, donor, schema or workflow change is authorized.

---

## 65. Protected predecessor blob proof

The focused R3G-B test must pin or equivalently prove byte identity for high-risk predecessor surfaces outside the allowlist, including at minimum:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/evidence/receipt.ts
```

Exact blob values must be collected from the canonical implementation base immediately before implementation.

---

## 66. Required focused hostile cases

The focused R3G-B proof must include deterministic hostile tests for at least:

```text
wrong required manifest digest
uppercase/non-canonical digest
empty DiffID list
oversized DiffID list
reordered DiffIDs
duplicate/malformed DiffID
wrong derived ChainID
Docker SystemInfo non-Linux
wrong Docker Driver
non-canonical DockerRootDir
containerd address mismatch
containerd namespace mismatch
wrong container ID
stored bundle label mismatch
stored Spec.Root.Path mismatch
active snapshot missing
active snapshot wrong kind
active snapshot wrong parent
unexpected arbitrary intermediate
wrong init snapshot name
init snapshot wrong kind
init snapshot wrong parent
expected image snapshot missing
expected image snapshot wrong kind
snapshot ancestry drift
Docker endpoint replacement
containerd endpoint replacement
ctr artifact replacement
malformed ctr JSON
duplicate ctr JSON keys
oversized ctr output
ctr timeout/nonzero exit
rootfs target symlink
missing rootfs mount
ambiguous duplicate mount target
wrong filesystem type
mount identity drift
R3E subject drift
R3F binding drift
pre-cancel
during-Docker-read cancellation
during-ctr cancellation
pre-commit cancellation
commit callback failure
wrong commit acknowledgment
commit timeout
late commit completion cannot upgrade success
non-Linux production fail-closed
caller host-authority injection rejection
```

---

## 67. Focused synthetic success theorem

A complete synthetic success fixture must establish:

```text
exact required manifest digest
-> bounded Docker SystemInfo
-> canonical DockerRootDir + overlayfs + expected containerd authority
-> bounded exact image-rootfs DiffIDs
-> deterministic expected ChainID
-> exact pinned-Moby active snapshot key = containerId
-> direct OR canonical-init snapshot ancestry
-> exact stored R3E bundle label
-> exact stored OCI Spec.Root.Path == derived Moby rootfs path
-> exact stable kernel-visible overlay mount at that path
-> exact stable R3E/R3F subject
-> deterministic E3 source candidate
-> durable exact acknowledgment
```

Success must not be achievable merely by validating a caller-created candidate object.

---

## 68. CI limitation

Synthetic fixtures prove parser, identity, ordering, fail-closed and integration logic.

Ordinary GitHub Actions do not prove a live production Docker+gVisor+containerd overlayfs host unless a separately authorized live environment test actually provisions that stack.

Evidence language must not call fixture success a live production deployment.

---

## 69. Evidence ledger lifecycle

Reserved R3G-B evidence ledger:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

It MUST NOT exist during implementation/pre-ledger review.

After exact-head pre-ledger PASS, it may be created in one ledger-only commit as the sole additional path.

Fresh complete post-ledger exact-head certification is mandatory.

Any implementation correction after ledger creation invalidates that ledger cycle and requires withdrawal/recreation or explicit canonical reconciliation.

---

## 70. Scope gate before test interpretation

Before implementation can be accepted for ledger creation:

```text
implementation base = exact canonical main containing this authorization
changed paths = only the fourteen allowlisted implementation paths
reserved R3G-B ledger = absent
```

Any extra production/test/docs/schema/workflow/dependency path invalidates the gate until reconciled.

---

## 71. Required implementation repository gates

Any accepted R3G-B implementation head must pass at the exact accepted SHA:

```text
governance / provenance
legacy tests / ruff
runtime-change classifier
Ubuntu Typecheck + full Test + benchmark
Windows Typecheck + full Test + benchmark
macOS Typecheck + full Test + benchmark
K2 runtime aggregate gate
K3-R4 regression gate
K3-R5 regression gate
focused R3G-B proof
focused R3F regression
manual architecture/trust/security review
0 unresolved actionable review threads
```

External reviewer availability/status must be recorded truthfully.

Pending/rate-limited/unavailable is not PASS.

---

## 72. Manual trust/security questions before ledger

Manual review must answer:

```text
Can caller choose ctr/containerd/DockerRootDir/snapshot/rootfs authority? -> NO
Can mutable image name/tag establish source proof? -> NO
Can containerd Container.SnapshotKey establish lineage? -> NO
Can bundle/rootfs be assumed as Moby rootfs? -> NO
Can ctr invoke mutating commands? -> NO
Can ctr path replacement change executed bytes after binding? -> NO
Can Docker/containerd socket replacement go unnoticed? -> NO
Can arbitrary snapshot ancestry pass? -> NO
Can directory existence substitute for a mount? -> NO
Can writable active upper layer be mislabeled immutable? -> NO
Can mount namespace invisibility downgrade to metadata-only proof? -> NO
Can late timed-out commit upgrade failure to success? -> NO
Can R3G-B mint final R3B evidence? -> NO
Can generic workspace/K3 policy gain this capability? -> NO
Can graphdriver mode silently fall back? -> NO
```

---

## 73. Bounded claim after canonical implementation merge

Only after:

- this authorization is canonical;
- implementation stays within the exact allowlist;
- exact-head pre-ledger PASS;
- ledger-only transition PASS;
- fresh exact-head post-ledger PASS;
- canonical implementation merge succeeds;
- canonical post-merge quality succeeds;

may Kodac make:

```text
KODAC_LINUX_GVISOR_IMMUTABLE_OCI_IMAGE_BASE_LINEAGE_PROVEN
```

Meaning only:

> K2 can bind one exact canonical R3E gVisor execution instance and exact R3F Docker container to a stable Linux Docker/containerd-overlayfs rootfs whose active snapshot key is fixed by the pinned Moby container-ID construction theorem, whose bounded snapshot ancestry terminates at the exact image ChainID derived from the ordered local OCI DiffIDs belonging to the exact required manifest digest, whose stored OCI Root.Path and Moby bundle metadata agree with the exact runtime subject, and whose derived Moby rootfs target is observed as a stable live kernel overlay mount, with a durably acknowledged E3 source record and no mutation of container, snapshot, image or mount state.

---

## 74. Explicit non-claims after R3G-B

The claim does NOT mean:

```text
running rootfs globally read-only
writable upper layer absent
every filesystem byte independently reconstructed/hashed
registry signature verified
Sigstore provenance verified
SBOM verified
source-code provenance verified
legacy graphdriver lineage proven
physical deny-all network proven
TTL proven
output limit proven
R3B SandboxBackendObservation proven
R3B SandboxExecutionEvidence proven
H4 complete
H6 authorized
```

---

## 75. Expected next independent slice

After proven canonical R3G-B, the next purpose-equivalent candidate remains:

```text
KDO-H4-R3G-C — Physical Deny-All Network Observation
```

R3G-B pre-authorizes none of R3G-C's network/kernel read surfaces.

---

## 76. Authorization PR scope

This authorization PR may change exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

The R3G-B evidence ledger must remain absent.

Corrections to this same authorization document during review remain docs-only and require fresh exact-head review/CI before merge.

---

## 77. Authorization review gate

Before this authorization becomes canonical, its exact docs-only PR head must prove:

```text
base = exact canonical main adab893d8e122320f441ec9a85a77527d92fbd02
changed paths = exactly this authorization document
production delta = 0
test delta = 0
schema delta = 0
workflow delta = 0
dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2/K3 regressions = PASS where triggered
available external review = no unresolved actionable finding
manual architecture/trust review = PASS
```

No implementation branch may be treated as authorized until this document is merged to canonical `main`.

---

## 78. Final authorization invariant

```text
SOURCE NAME/TAG IS NOT PHYSICAL IDENTITY.
R3F MANIFEST E2 ALONE IS NOT PHYSICAL LINEAGE.
CONTAINERD CONTAINER SNAPSHOTKEY METADATA IS NOT THE MOBY V1 AUTHORITY.
R3E BUNDLE/ROOTFS IS NOT ASSUMED TO BE THE MOBY ROOTFS MOUNT.
ROOTFS PATH STRING ALONE IS NOT PHYSICAL LINEAGE.
SNAPSHOT METADATA ALONE IS NOT PHYSICAL LINEAGE.

R3G-B V1 REQUIRES THE CONJUNCTION:

exact required manifest digest
+ ordered immutable DiffIDs
+ exact derived image ChainID
+ pinned Moby active-snapshot-key theorem (containerId)
+ exact bounded containerd snapshot ancestry
+ trusted DockerRootDir / overlayfs locator
+ stored OCI Root.Path equality
+ stored Moby bundle equality to exact R3E bundle
+ exact stable live kernel rootfs mount
+ exact stable R3E runtime subject
+ exact stable R3F container binding
+ pinned read-only ctr authority
+ stable Docker/containerd endpoints
+ durable acknowledged E3 source record

OR IT FAILS CLOSED.
```
