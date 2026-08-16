# KDO-H4-R3G-B — Immutable OCI Image-Base / Rootfs Physical Lineage Authorization

Date: 2026-08-16

Status: **AUTHORIZATION CANDIDATE V2 — DOCS ONLY — IMPLEMENTATION NOT AUTHORIZED UNTIL CANONICAL MERGE**

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

This V2 supersedes the non-canonical PR #106 authorization candidate. PR #106 must not be used as implementation authority.

---

## 1. Authorization decision

```text
DECISION:
AUTHORIZE_A_BOUNDED_R3G_B_V1_ONLY_AFTER_THIS_V2_DOCUMENT_BECOMES_CANONICAL

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

No R3G-B production/test implementation may begin before this document is merged to canonical `main`.

---

## 2. Review corrections made before canonical authorization

Three material design issues were found while reviewing PR #106 and are fixed in this V2.

### 2.1 `containerd Container.SnapshotKey` is not Moby rootfs authority

Rejected assumption:

```text
containerd Container.SnapshotKey == Docker container ID
```

Pinned Moby itself establishes the active snapshot key by creating the container layer with the exact Docker container ID and preparing the active snapshot with that key.

R3G-B V1 therefore derives:

```text
activeSnapshotKey = exact full Docker container ID
```

from pinned Moby semantics and queries that snapshot directly.

`Container.SnapshotKey` and `Container.Snapshotter` returned by `ctr containers info` are non-authoritative diagnostics for this theorem.

### 2.2 `<runsc bundle>/rootfs` is not the Moby physical rootfs locator

Rejected assumption:

```text
physical Docker rootfs == <R3E runsc bundle>/rootfs
```

Pinned Moby mounts the RW snapshot itself, stores the resulting host path in `container.BaseFS`, and writes that path to OCI `Spec.Root.Path`.

The Moby containerd-image-store mounter derives the mount target from:

```text
DockerRootDir
+ /rootfs/
+ snapshotter
+ /
+ containerId
```

For V1:

```text
rootfsMountPath = canonicalJoin(
  DockerRootDir,
  "rootfs",
  "overlayfs",
  exactContainerId,
)
```

R3E bundle identity remains subject/provenance evidence but is not the Moby rootfs path authority.

### 2.3 Lost durable-commit acknowledgment needs replay-safe semantics

Rejected incomplete rule:

```text
timeout => fail invocation, but later retry semantics unspecified
```

V2 requires the durable source-evidence callback itself to implement a replay-safe logical put keyed by the deterministic source-record identity.

A lost acknowledgment may fail the current invocation, but cannot create ambiguous duplicate logical records on a later full re-observation and retry.

This strengthens R3G-A's late-completion rule without adding a status-query API.

---

## 3. Exact bounded theorem

One successful R3G-B V1 observation must prove all of the following for one exact execution instance:

1. the exact canonical R3E gVisor subject remains live and stable;
2. the exact canonical R3F Docker binding remains stable;
3. R3F manifest digest equals `requirement.workload.source.digest`;
4. trusted Docker SystemInfo reports the supported Linux/containerd/overlayfs topology and canonical DockerRootDir;
5. the exact immutable required image reference resolves locally to the exact required manifest descriptor;
6. the same bounded image inspect yields an ordered non-empty canonical DiffID list;
7. the ordered DiffIDs derive one exact image ChainID;
8. pinned Moby semantics establish active snapshot key = exact full Docker container ID;
9. read-only containerd snapshot observations prove exactly one authorized ancestry ending at the expected image ChainID;
10. pinned Moby semantics derive the exact physical rootfs target;
11. stored container OCI `Spec.Root.Path` equals that exact derived target;
12. the exact target is a real, non-symlink, kernel-visible `overlay` mount and remains stable;
13. R3E/R3F subject identities, Docker endpoint, containerd endpoint authority, `ctr` artifact, storage locator, stored spec, snapshot ancestry and mount identity remain stable for the bounded observation;
14. a replay-safe durable E3 source record receives the exact canonical acknowledgment before the invocation returns success.

Any missing or mismatched conjunct fails closed.

---

## 4. Claim vocabulary

R3G-B may prove only:

```text
immutable OCI image-base / rootfs lineage
```

It does not prove:

```text
running rootfs globally read-only
writable active upper layer absent
all runtime filesystem bytes unchanged
```

A normal running Docker container may have a writable active snapshot above immutable image ancestry.

---

## 5. Evidence class

R3G-B emits only:

```text
E3 PHYSICAL SOURCE CANDIDATE
```

R3G-B MUST NOT construct or claim:

```text
SandboxBackendObservation
SandboxExecutionEvidence
E4 final backend proof
```

Final R3B evidence remains a later independent conjunction gate.

---

## 6. Exact upstream source pins

This authorization is grounded in exact primary-source snapshots.

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

Pinned Moby source reviewed includes:

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
daemon/internal/libcontainerd/replace.go
daemon/internal/libcontainerd/remote/client.go
daemon/internal/libcontainerd/remote/client_linux.go
api/types/image/image_inspect.go
```

Pinned containerd source reviewed includes:

```text
client/container.go
client/image.go
core/containers/containers.go
core/snapshots/snapshotter.go
cmd/ctr/commands/containers/containers.go
cmd/ctr/commands/snapshots/snapshots.go
```

---

## 7. R3F E2 is mandatory but not physical proof

Canonical R3F already requires:

```text
InspectResponse.ImageManifestDescriptor.Digest
==
requirement.workload.source.digest
```

R3G-B preserves that exact equality.

The following alone are never physical source proof:

```text
image name
image tag
RepoTags
RepoDigests
InspectResponse.Image
Config.Image
R3F manifest E2 digest
containerd Container.SnapshotKey
R3E bundle path
OCI Root.Path string
snapshot name
mount path string
```

---

## 8. Exact immutable image inspect

The workload's immutable source remains the repository plus digest already authorized by R3A.

R3G-B must materialize only the canonical digest-qualified local image reference equivalent to:

```text
<canonical repository>@<requirement.workload.source.digest>
```

The bounded Docker image inspect must require:

```text
Descriptor.Digest == requirement.workload.source.digest
RootFS.Type == layers
RootFS.Layers = ordered canonical DiffIDs
```

Mutable tags/names returned by Docker are non-authoritative diagnostics.

No registry lookup is authorized.

---

## 9. DiffID theorem

R3G-B V1 requires at least one DiffID.

Every accepted DiffID must be exactly:

```text
sha256:<64 lowercase hexadecimal characters>
```

V1 rejects:

```text
empty DiffID list
non-SHA256 digest
uppercase/non-canonical digest
malformed digest
over-limit list
structural ambiguity
```

Zero-layer/scratch images are deferred to a separate theorem.

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

The preimage uses full canonical digest strings including the `sha256:` prefix.

The resulting canonical digest is:

```text
sha256:<64 lowercase hexadecimal characters>
```

Ordering is security-significant.

Reorder/drop/duplicate/insert/mutate must invalidate or change the derived ChainID.

Validators rederive the value and never trust a supplied ChainID hash.

---

## 11. Supported storage topology

R3G-B V1 authorizes exactly:

```text
Docker Engine containerd image store
Docker SystemInfo.OSType == linux
Docker SystemInfo.Driver == overlayfs
external containerd address == trusted configured address
containerd namespace == moby
containerd snapshotter == overlayfs
```

Unsupported or ambiguous topology fails closed.

Legacy graphdriver/overlay2 mode is explicitly deferred.

Embedded containerd mode is not accepted unless a later authorization proves an equally bounded endpoint and storage theorem.

---

## 12. Pinned Moby active-snapshot theorem

Pinned Moby's container layer constructor uses:

```text
layerName = exact Docker container ID
```

For the supported containerd image-store path it:

```text
resolves the image parent snapshot for the exact manifest
obtains ordered image DiffIDs
derives identity.ChainID(diffIDs).String()
optionally creates/commits <containerId>-init from that parent
prepares the active snapshot with key = <containerId>
```

Therefore V1 derives:

```text
activeSnapshotKey = exact full Docker container ID
```

This is a pinned implementation theorem, not a guess from container metadata.

---

## 13. `Container.SnapshotKey` remains non-authoritative

R3G-B MUST NOT rely on:

```text
containerd Container.SnapshotKey
containerd Container.Snapshotter
```

to establish Docker rootfs ancestry.

Those fields may be ignored or recorded diagnostically.

The exact active snapshot is queried by the Moby-derived key.

---

## 14. Authorized snapshot ancestry A

Direct image parent:

```text
ACTIVE
name   = <containerId>
parent = <expectedImageChainID>

COMMITTED
name   = <expectedImageChainID>
```

No intermediate node is accepted.

---

## 15. Authorized snapshot ancestry B

Canonical Docker init snapshot:

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

No second or arbitrary intermediate is accepted.

Snapshot labels and timestamps are not lineage authority.

---

## 16. Moby physical rootfs theorem

Pinned Moby Linux start mounts the container RW layer and stores the result in:

```text
container.BaseFS
```

Pinned OCI-spec construction then uses:

```text
Spec.Root.Path = container.BaseFS
```

For the supported containerd image-store mounter the physical target is:

```text
<DockerRootDir>/rootfs/<snapshotter>/<containerId>
```

Therefore V1 derives exactly:

```text
rootfsMountPath = canonicalJoin(
  DockerRootDir,
  "rootfs",
  "overlayfs",
  exactContainerId,
)
```

---

## 17. Stored OCI spec cross-check

Bounded `ctr containers info <exactContainerId>` may be used only to cross-check the exact container metadata object and stored OCI spec.

Required security-relevant equality:

```text
containerInfo.ID == exactContainerId
containerInfo.Spec.Root.Path == derived rootfsMountPath
```

`Image`, `SnapshotKey`, `Snapshotter`, labels and unrelated metadata do not establish source identity.

---

## 18. R3E bundle remains subject identity, not rootfs authority

R3G-B MUST NOT derive:

```text
rootfsMountPath = <R3E runsc bundle>/rootfs
```

and MUST NOT require Moby's internal libcontainerd bundle label to equal the runsc state bundle.

R3E binding is instead the exact canonical conjunction already proven by predecessor lineage, including:

```text
same exact full container ID
same requirement/workload identity
same executionAttemptIdentity
same containerBindingIdentity
same runtimeLineageIdentity
stable runsc state/process identity
```

---

## 19. Docker SystemInfo locator theorem

The R3F Docker provider may add one bounded read-only SystemInfo observation.

Required V1 security fields are purpose-equivalent to:

```text
OSType == linux
Driver == overlayfs
DockerRootDir = canonical absolute path
Containerd.Address == trusted configured containerd Unix socket
Containerd.Namespaces.Containers == moby
```

Missing, unsupported or ambiguous topology fails closed.

DockerRootDir must never be hard-coded to `/var/lib/docker`.

---

## 20. R3F image-rootfs extension

The existing R3F provider may add only bounded read-only support for:

```text
Docker SystemInfo security locator fields
exact digest-qualified image inspect
ordered RootFS DiffIDs
```

It must preserve all canonical R3F container-binding semantics.

For image inspect it must:

```text
use fixed Docker API v1.48
use the trusted R3F Unix-socket endpoint
use only the exact digest-qualified source reference
require Descriptor.Digest equality to the required manifest digest
extract ordered RootFS.Layers as DiffIDs
ignore mutable tag/name metadata as authority
apply strict byte/time/JSON bounds
preserve Docker endpoint identity theorem
```

---

## 21. No registry/network image resolution

R3G-B MUST NOT contact:

```text
Docker Hub
OCI registry
credential helper
registry authentication service
remote content resolver
```

The exact required image must already exist locally.

Failure to resolve it locally fails closed.

---

## 22. Pinned read-only `ctr` artifact

R3G-B may use host `ctr` only as a trusted, pinned, read-only local containerd client.

Trusted runtime configuration may contain purpose-equivalent exact fields:

```text
version
ctrPath
expectedCtrSha256
containerdAddress
commitSourceLineageEvidence
```

Caller input MUST NOT select or override any of them.

The implementation must bind the `ctr` artifact by canonical trusted path, regular-file identity and SHA-256 bytes before execution.

A path replacement must not cause different executable bytes to run.

---

## 23. Containerd endpoint threat model and authority chain

The R3G-B theorem trusts the host kernel and host root administrative boundary.

An attacker with host root/CAP_SYS_ADMIN-equivalent control is outside this V1 threat model because such an actor can subvert the kernel, mount and daemon observations themselves.

Against non-root local races, containerd address authority must be stronger than a bare before/after socket stat.

Before any `ctr` query the implementation must establish a canonical root-owned path authority chain from a trusted root to the configured socket:

```text
all path components canonical
no symlink component
all parent directories owned by uid 0
all parent directories not group-writable
all parent directories not world-writable
socket path exists and is Unix socket
socket uid/gid/mode match trusted allowed policy
socket device/inode identity captured
```

For every individual `ctr` invocation:

```text
1. validate the trusted path authority chain immediately before spawn;
2. capture exact socket identity immediately before spawn;
3. execute only the pinned ctr artifact with the fixed address;
4. capture exact socket identity immediately after child exit;
5. revalidate the full path authority chain;
6. require exact pre/post socket identity equality.
```

Because a non-root actor cannot replace a socket beneath the required non-writable root-owned directory chain, this is the V1 equivalent control for the path-based `ctr` client.

A connection-scoped peer credential theorem would be stronger and may be authorized later.

If the deployment cannot satisfy this root-owned path-chain theorem, V1 fails closed; it MUST NOT downgrade to bare path-stat checks.

Required hostile tests include a writable-parent rejection and a simulated socket swap-and-restore attempt under an otherwise invalid authority chain.

---

## 24. Fixed containerd domain

V1 fixes:

```text
namespace   = moby
snapshotter = overlayfs
```

No namespace enumeration or snapshotter discovery is authorized.

---

## 25. Allowed `ctr` commands

Only semantic equivalents of these commands are authorized:

```text
containers info <exactContainerId>
snapshots info <exactContainerId>
snapshots info <exactContainerId>-init       # only when required by active parent
snapshots info <exactExpectedImageChainID>
```

The implementation may add only the fixed trusted CLI flags needed for:

```text
address
namespace = moby
snapshotter = overlayfs for snapshot calls
```

No shell is authorized.

---

## 26. Forbidden `ctr` surfaces

Forbidden include:

```text
snapshots prepare
snapshots view
snapshots mount
snapshots mounts
snapshots diff
snapshots commit
snapshots remove/delete/label
images pull/push/mount/unmount/tag/delete
containers create/delete/label
tasks kill/exec
```

No arbitrary caller command or argv is authorized.

`snapshots mounts` remains forbidden because the command may activate mounts.

---

## 27. Physical kernel rootfs mount proof

For the exact derived `rootfsMountPath`, a fixed internal Linux kernel observation must prove:

```text
path exists
path is directory
path is not symlink
exactly one canonical mount record resolves to target
filesystem type == overlay
mount record grammar is bounded and canonical
mount identity remains stable across pre/post observation
```

Directory existence without a mount is failure.

If Kodac's observation namespace cannot see the Moby mount, V1 fails closed.

No `setns`, namespace-crossing helper or metadata-only fallback is authorized.

---

## 28. Writable active upper layer is allowed

A writable active overlay upper/work layer does not invalidate immutable image-base lineage.

R3G-B MUST NOT describe the active upper layer as immutable.

The immutable source theorem terminates at the expected committed image ChainID.

---

## 29. No full byte reconstruction in V1

R3G-B does not independently hash every rootfs file or reconstruct every OCI layer tar stream during observation.

V1 instead proves the bounded conjunction:

```text
exact required manifest
+ ordered DiffIDs
+ deterministic ChainID
+ pinned Moby active-snapshot construction
+ exact containerd snapshot ancestry
+ stored OCI Root.Path equality
+ live stable kernel mount
+ exact stable R3E/R3F subject
```

A stronger byte-reconstruction theorem requires separate authorization.

---

## 30. Exact subject binding

The source observer cannot accept an arbitrary container ID.

The candidate must bind at least:

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

The gateway must revalidate:

```text
R3E containerId == R3F containerId
R3E/R3F container binding identities agree
R3F imageManifestDigest == requirement.workload.source.digest
```

Any mismatch fails closed.

---

## 31. Dedicated capability

Purpose-equivalent capability:

```text
runtime.observe.gvisor.source-lineage
```

Policy behavior:

```text
allow -> may proceed
ask   -> block
deny  -> block
```

This capability MUST NOT be added to generic workspace or K3 read policies.

---

## 32. No caller host authority injection

The public gateway method may accept only canonical requirement/subject material plus cancellation.

It MUST NOT expose caller-selectable:

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

Host authority comes only from trusted constructor configuration, canonical predecessor identities and fixed derivation.

---

## 33. Linux-only production path

R3G-B V1 is Linux-only.

macOS/Windows production paths must fail closed before host observation.

Cross-platform tests must prove this boundary.

---

## 34. Artifact and endpoint identity

Docker endpoint reuses the canonical R3F Unix-socket theorem.

Containerd endpoint uses the stronger V1 authority-chain theorem in Section 23.

The `ctr` executable identity binds:

```text
trusted canonical path
SHA-256 bytes
regular-file retained stat identity
trusted non-writable path authority chain
```

Artifact or endpoint drift fails closed.

---

## 35. Bounded observation order

Successful flow must be equivalent to:

```text
1.  validate requirement + dedicated capability
2.  resolve/revalidate exact R3F binding
3.  observe exact R3E subject (pre)
4.  bind Docker endpoint + ctr artifact + containerd path authority
5.  read bounded Docker SystemInfo
6.  require supported Linux/overlayfs/external-containerd/moby topology
7.  read exact digest-qualified local image inspect
8.  require Descriptor.Digest equality + extract ordered DiffIDs
9.  derive exact expected ChainID
10. derive Moby rootfsMountPath
11. read ctr container info for exact container ID
12. require stored Spec.Root.Path equality
13. read active snapshot info using exact key containerId
14. optionally read exact containerId-init snapshot
15. read exact expected image ChainID snapshot
16. validate exactly one authorized ancestry
17. observe exact kernel rootfs mount (pre)
18. re-observe exact R3E subject
19. re-observe/revalidate exact R3F binding
20. re-observe security-relevant Docker/spec/snapshot identities
21. re-observe exact kernel mount (post)
22. revalidate Docker/containerd/ctr authority identities
23. require exact stability
24. create/validate deterministic E3 source record
25. invoke replay-safe durable commit once for this observation attempt
26. validate exact acknowledgment
27. persist success receipt + return success
```

Independent checks may be reordered only if an equal or stronger race theorem is preserved.

---

## 36. Stability theorem

Success requires stable identity across:

```text
R3E runtime subject
R3F Docker binding
Docker endpoint
Docker storage locator
containerd path authority + socket identity
ctr artifact
stored container ID + Spec.Root.Path
snapshot ancestry
physical rootfs mount
```

Observable drift fails closed.

---

## 37. Deterministic normalized identities

R3G-B must create domain-separated deterministic identities for at least:

```text
Docker storage locator
image-rootfs DiffID observation
expected image ChainID
container spec observation
snapshot ancestry
physical rootfs mount
final E3 source record
```

Every derivable field is rederived during validation.

Shape-valid attacker-supplied hashes are insufficient.

---

## 38. E3 source record

Purpose-equivalent V1 fields:

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
recordIdentity
```

The record identity must be deterministic and exclude wall-clock timestamps, random UUIDs and non-security diagnostics.

This determinism is required for replay-safe durable commit semantics.

---

## 39. Replay-safe durable source-evidence commit

Trusted runtime configuration may expose exactly one callback purpose-equivalent to:

```text
commitSourceLineageEvidence(record)
```

The callback is a **logical put keyed by `recordIdentity`** and MUST provide durable replay safety across gateway/process restarts.

Required semantics:

```text
FIRST EXACT PUT:
- durably persist the exact canonical record bytes under recordIdentity;
- return the canonical acknowledgment bound to that identity.

REPLAY OF THE SAME EXACT RECORD:
- MUST NOT create a second logical evidence record;
- MUST verify the existing bytes/identity are exactly equal;
- MUST return the same canonical acknowledgment semantics.

SAME recordIdentity WITH DIFFERENT BYTES/FIELDS:
- MUST fail closed as an integrity violation.
```

The acknowledgment must be deterministically bound to the exact record identity.

A missing, malformed, mismatched, failed, timed-out or aborted acknowledgment prevents the current invocation from returning success.

A late callback completion after timeout/abort cannot upgrade that failed invocation to success.

No status-query API is authorized or required by V1.

The callback's replay-safe logical-put contract is part of the existing single callback semantics; it is not a second API.

---

## 40. Lost acknowledgment and later retry

If the durable callback persists the record but its acknowledgment is lost/times out:

```text
current invocation = FAIL CLOSED / NOT SUCCESS
```

A later retry is allowed only after a **fresh full R3G-B observation** re-establishes the theorem.

If that fresh observation deterministically reconstructs the exact same `recordIdentity`, the replay-safe callback may return the canonical acknowledgment for the already-existing exact record without creating a duplicate logical record.

If the new observation produces a different record identity, it is a distinct observation and must be committed under that distinct identity.

No same-invocation blind automatic retry is required by this authorization.

Required hostile proof:

```text
callback durably writes exact record
acknowledgment is lost/times out
first invocation fails
fresh full observation recreates same exact record identity
second commit receives canonical replay acknowledgment
logical durable record count for that identity remains exactly one
same identity with changed bytes is rejected
```

---

## 41. Cancellation and receipts

Cancellation must be honored:

```text
before host observation
during Docker reads
during ctr reads
between observation phases
before durable commit
during acknowledgment wait
before success receipt
```

A bounded failure receipt may describe failure of the observation invocation.

It MUST NOT claim external-store rollback or non-write after a timed-out non-cancellable callback.

A success receipt may be persisted only after the exact replay-safe durable acknowledgment is validated.

---

## 42. Conservative V1 resource bounds

Implementation must choose equal or stricter finite bounds than:

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
ctrTimeoutMs                 = 5000
commitTimeoutMs              = 5000
maxRecordSerializedBytes     = 128 KiB
```

Oversize input/output fails closed.

Truncation-and-accept is forbidden.

---

## 43. JSON and object validator safety

Docker/ctr JSON handling must be:

```text
bounded before parse
duplicate-key safe
finite depth
finite nodes
finite keys
finite arrays
finite string bytes
```

In-memory trust validators must reject hostile proxies/accessors before attacker-controlled property traps execute where canonical trust-module patterns require that boundary.

---

## 44. Mount parser safety

Kernel mount parsing must reject:

```text
oversize input
NUL
malformed separator
missing mandatory fields
invalid mountinfo escaping
non-canonical target
ambiguous duplicate exact target
unexpected filesystem type
trailing structural ambiguity
```

Raw encoded path comparison is insufficient; mountinfo escaping must be decoded canonically.

---

## 45. No mutation

R3G-B MUST NOT perform:

```text
container create/start/stop/delete
image pull/push/tag/delete
snapshot prepare/view/commit/remove/mount
mount(2)
unmount(2)
setns
unshare
chroot
pivot_root
filesystem write under DockerRootDir/rootfs
containerd metadata mutation
Docker metadata mutation
cgroup mutation
network mutation
```

Only evidence/receipt persistence callbacks may write their own authorized data.

---

## 46. No shell / no discovery

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
Docker data-root scanning
namespace enumeration
snapshotter enumeration
recursive /var/lib discovery
```

---

## 47. No direct private containerd metadata parsing

R3G-B MUST NOT parse containerd BoltDB or private storage files.

The authorized containerd source is the pinned read-only `ctr` artifact against the trusted local API/path authority.

---

## 48. No new native helper or dependency in V1

The existing R3D native helper remains unchanged.

R3G-B authorizes no new C/Go/Rust helper and no package dependency update.

If the pinned `ctr` + fixed kernel reads cannot satisfy the theorem, implementation must stop for authorization reconciliation.

---

## 49. Protected predecessor semantics

R3G-B must preserve without weakening:

```text
R3A workload source identity
R3B pure backend evidence contracts
R3D gVisor observation candidate
R3E exact runtime lineage
R3F Docker E2 control-plane binding
R3G-A cgroup-v2 E3 resource evidence
H5 guarded-agent behavior
```

R3G-A source-independent resource evidence remains separate.

---

## 50. Explicit non-claims

R3G-B does not prove:

```text
physical CPU/memory/swap         # R3G-A owns this
physical deny-all network        # later R3G-C candidate
TTL
output limit
globally read-only rootfs
absence of writable active upper layer
full rootfs byte reconstruction
registry signature
Sigstore provenance
SBOM correctness
source-code-to-image provenance
legacy graphdriver lineage
root-host compromise resistance
R3B final SandboxBackendObservation
R3B SandboxExecutionEvidence
H4 complete
H6 authorized
```

---

## 51. Current gateway byte-pin reconciliation

At canonical authorization base:

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

The historical R3G-A evidence ledger may record the old gateway blob but MUST NOT be rewritten by R3G-B.

The exact search MUST be repeated immediately before any implementation write.

An additional executable pin outside the allowlist stops implementation pending reconciliation.

---

## 52. Exact pre-ledger implementation allowlist

Only after this V2 authorization is canonical, R3G-B implementation may modify exactly these fourteen paths before its evidence ledger exists:

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

The nine predecessor tests may change only to reconcile the superseded gateway byte pin while preserving their owned theorem.

---

## 53. Narrow R3F production allowance

The only authorized R3F production extensions are bounded read-only methods for:

```text
Docker SystemInfo security locator fields
exact digest-qualified image inspect
ordered RootFS DiffIDs
```

Canonical R3F semantics for container discovery/binding, manifest equality, resource/network checks, Docker socket authority and provider identity must not be weakened.

---

## 54. Explicit protected paths

Without separate canonical reconciliation R3G-B MUST NOT modify:

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

No dependency, schema, workflow, generated-code or donor-import change is authorized.

---

## 55. Protected predecessor blob proof

The focused R3G-B test must pin or equivalently prove byte identity for high-risk predecessor surfaces outside the allowlist, at minimum:

```text
sandbox-workload.ts
sandbox-backend-evidence.ts
sandbox-observer-gvisor.ts
sandbox-observer-gvisor-runtime.ts
sandbox-observer-gvisor-cgroup-v2.ts
gvisor-proc-observe.c
receipt.ts
```

Exact canonical blob SHAs must be collected from the implementation base immediately before implementation.

---

## 56. Required hostile tests

The focused R3G-B proof must cover at least:

```text
wrong/non-canonical required source digest
wrong digest-qualified image reference
image Descriptor.Digest mismatch
empty/oversize/reordered/duplicate/malformed DiffIDs
wrong derived ChainID
Docker SystemInfo non-Linux
wrong Docker Driver
non-canonical DockerRootDir
containerd address/namespace mismatch
containerd parent directory not root-owned
containerd parent directory group/world writable
containerd socket wrong type/owner/mode
simulated socket swap-and-restore under invalid authority chain
wrong container ID
stored Spec.Root.Path mismatch
missing active snapshot
active snapshot wrong kind/parent
unexpected arbitrary intermediate
wrong/missing init snapshot
wrong/missing committed image snapshot
snapshot ancestry drift
Docker endpoint replacement
containerd endpoint identity drift
ctr artifact replacement
malformed/duplicate/oversize ctr JSON
ctr timeout/nonzero exit
rootfs target symlink
missing rootfs mount
ambiguous duplicate mount target
wrong filesystem type
mount drift
R3E subject drift
R3F binding drift
pre-cancel
during-Docker-read cancellation
during-ctr cancellation
pre-commit cancellation
commit callback failure
wrong commit acknowledgment
commit timeout
late completion cannot upgrade failed invocation
lost acknowledgment after durable write
fresh re-observation + replay-safe same-record commit
same recordIdentity with different bytes rejected
non-Linux production fail-closed
caller host-authority injection rejection
```

---

## 57. Focused synthetic success theorem

Synthetic success must prove the whole chain:

```text
exact required manifest digest
-> Docker SystemInfo supported locator
-> exact digest-qualified local image inspect
-> exact Descriptor.Digest equality
-> ordered DiffIDs
-> expected ChainID
-> pinned Moby active key = containerId
-> direct OR canonical-init snapshot ancestry
-> Moby-derived physical rootfs target
-> stored OCI Spec.Root.Path equality
-> stable kernel-visible overlay mount
-> stable exact R3E/R3F subject
-> stable trusted endpoint/artifact authority
-> deterministic E3 source record
-> replay-safe durable exact acknowledgment
```

A caller-created structurally valid candidate/record cannot establish physical proof.

---

## 58. CI limitation

Synthetic fixtures prove parser/identity/fail-closed/integration semantics.

Ordinary GitHub Actions do not imply a live production Docker+gVisor+containerd-overlayfs instance was provisioned unless a future separately authorized live test does so.

Evidence language MUST NOT convert fixture success into a live-production claim.

---

## 59. Evidence ledger lifecycle

Reserved R3G-B evidence ledger:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

It MUST NOT exist during implementation/pre-ledger review.

After exact-head pre-ledger PASS it may be created in one ledger-only commit as the sole additional path.

Fresh complete post-ledger exact-head certification is mandatory.

Implementation correction after ledger creation invalidates that ledger cycle unless explicitly reconciled.

---

## 60. Scope gate before test interpretation

Before implementation can be accepted for ledger creation:

```text
implementation base = exact canonical main containing this V2 authorization
changed paths = only the fourteen allowlisted implementation paths
reserved R3G-B ledger = absent
```

Any extra production/test/docs/schema/workflow/dependency path invalidates the gate until canonical reconciliation.

---

## 61. Required implementation gates

At the exact implementation head before ledger creation:

```text
governance / provenance = PASS
legacy tests / ruff = PASS
runtime-change classifier = PASS
Ubuntu Typecheck + full Test + benchmark = PASS
Windows Typecheck + full Test + benchmark = PASS
macOS Typecheck + full Test + benchmark = PASS
K2 aggregate runtime gate = PASS
K3-R4 regression gate = PASS
K3-R5 regression gate = PASS
focused R3G-B proof = PASS
focused R3F regression = PASS
manual architecture/trust/security review = PASS
unresolved actionable review threads = 0
```

External reviewer availability/status must be recorded truthfully.

Pending, rate-limited or unavailable is not a PASS.

---

## 62. Manual trust/security review questions

Before ledger creation manual review must answer NO to every unsafe possibility:

```text
Can caller choose ctr/containerd/DockerRootDir/snapshot/rootfs authority?
Can mutable image name/tag establish source proof?
Can Container.SnapshotKey establish Moby rootfs lineage?
Can R3E bundle/rootfs be assumed to be the Moby rootfs?
Can ctr invoke a mutating command?
Can ctr path replacement change executed bytes after binding?
Can a non-root local actor replace the trusted containerd socket path during a query?
Can a bare before/after socket stat substitute for the required path-authority theorem?
Can Docker/containerd endpoint replacement go unnoticed?
Can arbitrary snapshot ancestry pass?
Can directory existence substitute for a physical mount?
Can writable upper layer be mislabeled immutable?
Can mount namespace invisibility downgrade to metadata-only success?
Can lost acknowledgment create duplicate logical records on later retry?
Can same recordIdentity map to different bytes?
Can late timed-out completion upgrade a failed invocation?
Can R3G-B mint final R3B evidence?
Can generic workspace/K3 policy gain the R3G-B capability?
Can unsupported graphdriver mode silently fall back?
```

---

## 63. Bounded claim after canonical implementation merge

Only after:

```text
this V2 authorization is canonical
implementation stays within exact allowlist
exact-head pre-ledger gate passes
ledger-only transition passes
fresh exact-head post-ledger certification passes
canonical implementation merge succeeds
canonical post-merge quality succeeds
```

may Kodac claim:

```text
KODAC_LINUX_GVISOR_IMMUTABLE_OCI_IMAGE_BASE_LINEAGE_PROVEN
```

Meaning only:

> K2 can bind one exact canonical R3E gVisor execution instance and exact R3F Docker container to a stable Linux Docker/containerd-overlayfs physical rootfs whose active snapshot key is fixed by the pinned Moby container-ID construction theorem, whose bounded snapshot ancestry terminates at the exact image ChainID derived from ordered local OCI DiffIDs belonging to the exact required manifest digest, whose stored OCI Root.Path equals the exact Moby-derived physical rootfs target, whose target is observed as a stable live kernel overlay mount, and whose deterministic E3 source record is committed through a replay-safe durable logical put under a trusted bounded host authority, without mutating container, image, snapshot or mount state.

---

## 64. Explicit post-R3G-B non-claims

The bounded claim does NOT mean:

```text
running rootfs globally read-only
writable upper layer absent
full filesystem byte reconstruction
registry/Sigstore provenance
SBOM correctness
source-code provenance
legacy graphdriver lineage
root-host compromise resistance
physical deny-all network
TTL
output limit
R3B final backend observation/evidence
H4 complete
H6 authorized
```

---

## 65. Expected next independent slice

After proven canonical R3G-B, the next purpose-equivalent candidate remains:

```text
KDO-H4-R3G-C — Physical Deny-All Network Observation
```

R3G-B pre-authorizes none of R3G-C's network/kernel surfaces.

---

## 66. Authorization PR scope

This V2 authorization PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

The reserved R3G-B evidence ledger must remain absent.

---

## 67. Authorization review gate

Before this V2 authorization becomes canonical, its exact docs-only head must prove:

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
manual architecture/trust review = PASS
external review = no unresolved actionable finding
```

No implementation branch is authorized until this V2 document is merged to canonical `main`.

---

## 68. Final authorization invariant

```text
IMAGE NAME/TAG IS NOT PHYSICAL IDENTITY.
R3F MANIFEST E2 ALONE IS NOT PHYSICAL LINEAGE.
CONTAINERD CONTAINER SNAPSHOTKEY METADATA IS NOT THE MOBY V1 AUTHORITY.
R3E RUNSC BUNDLE IS NOT THE MOBY ROOTFS LOCATOR.
ROOTFS PATH STRING ALONE IS NOT PHYSICAL LINEAGE.
SNAPSHOT METADATA ALONE IS NOT PHYSICAL LINEAGE.
BARE SOCKET BEFORE/AFTER STAT IS NOT SUFFICIENT ENDPOINT AUTHORITY.
NON-REPLAY-SAFE DURABLE COMMIT IS NOT ACCEPTABLE.

R3G-B V1 REQUIRES:

exact required manifest digest
+ ordered immutable DiffIDs
+ exact derived image ChainID
+ pinned Moby active key theorem (containerId)
+ exact bounded containerd snapshot ancestry
+ trusted DockerRootDir/overlayfs locator
+ exact stored OCI Root.Path equality
+ exact stable live kernel rootfs mount
+ exact stable R3E runtime subject
+ exact stable R3F Docker binding
+ pinned read-only ctr artifact
+ root-owned non-writable containerd path authority
+ stable endpoint/artifact identities
+ replay-safe durable E3 logical put
+ exact acknowledgment

OR IT FAILS CLOSED.
```
