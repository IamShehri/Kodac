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

## 1. Review corrections incorporated before authorization

This document supersedes the earlier PR #106 candidate text.

Manual review of the exact pinned Moby/containerd/Kodac sources rejected two tempting but incorrect assumptions before they became implementation authority:

```text
REJECTED ASSUMPTION 1:
containerd Container.SnapshotKey is the Docker active-rootfs authority.

CORRECTION:
Pinned Moby itself creates the active snapshot with key = exact Docker container ID.
R3G-B queries that snapshot key directly and does not rely on Container.SnapshotKey metadata.

REJECTED ASSUMPTION 2:
<runsc state bundle>/rootfs is the Docker/Moby rootfs mount.

CORRECTION:
Pinned Moby mounts its RW snapshot first, stores the returned path as container.BaseFS,
and writes BaseFS into OCI Spec.Root.Path. The physical Moby mount target is derived from
DockerRootDir + /rootfs/<snapshotter>/<containerId>.
The R3E runsc bundle remains subject/provenance evidence only; it is not the rootfs locator.
```

No R3G-B implementation may begin while this document remains only a candidate.

---

## 2. Authorization decision

```text
DECISION:
AUTHORIZE_A_BOUNDED_R3G_B_V1_AFTER_THIS_DOCUMENT_BECOMES_CANONICAL

SLICE:
KDO-H4-R3G-B — IMMUTABLE OCI IMAGE-BASE / ROOTFS PHYSICAL LINEAGE

V1 STACK:
LINUX
+ DOCKER ENGINE CONTAINERD IMAGE STORE
+ CONTAINERD OVERLAYFS SNAPSHOTTER
+ GVISOR

OUTPUT:
E3 PHYSICAL SOURCE CANDIDATE ONLY
```

R3G-B v1 proves a narrow cross-authority conjunction and nothing more.

---

## 3. Exact v1 theorem

A successful observation must prove all of the following for one exact execution instance:

1. exact canonical R3E gVisor runtime subject is live and stable;
2. exact canonical R3F Docker binding is stable and its manifest digest equals `requirement.workload.source.digest`;
3. bounded Docker SystemInfo reports supported Linux/containerd/overlayfs configuration and canonical DockerRootDir;
4. exact required manifest resolves locally to an ordered non-empty canonical DiffID sequence;
5. that sequence derives one exact OCI/containerd ChainID;
6. pinned Moby semantics establish active snapshot key = exact full Docker container ID;
7. bounded containerd snapshot `Stat` observations prove one authorized ancestry terminating at the expected image ChainID;
8. pinned Moby semantics derive exact physical rootfs target from DockerRootDir, snapshotter and container ID;
9. stored container OCI `Spec.Root.Path` equals that derived physical target;
10. the derived target is a real non-symlink kernel-visible overlay mount and remains stable;
11. R3E, R3F, Docker endpoint, containerd endpoint, ctr artifact, stored spec, snapshot ancestry and mount identities remain stable across the bounded observation window;
12. a durable E3 source record receives an exact valid acknowledgment before success returns.

Any failed conjunct fails closed.

---

## 4. Claim vocabulary

R3G-B proves:

```text
immutable OCI image-base / rootfs lineage
```

It does **not** prove:

```text
running rootfs globally read-only
active upper layer immutable
all runtime filesystem bytes unchanged
```

A normal active Docker snapshot may contain a writable upper layer above immutable image ancestry.

---

## 5. Evidence class

R3G-B may emit only:

```text
E3 PHYSICAL SOURCE CANDIDATE
```

It MUST NOT mint or simulate:

```text
SandboxBackendObservation
SandboxExecutionEvidence
E4 final backend proof
```

---

## 6. Primary-source pins

The authorization is grounded in exact upstream snapshots.

```text
OCI image-spec:
af26a05fba5ee648512f4ea3c9fda1fcc1b6d6dc

OCI runtime-spec:
6999a89a76a0329f440d5740497bedb9dd431297

Moby:
d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3

containerd v2.3.4 resolved commit:
db8809540e1a7a9da5d518876894933ff55692ab

gVisor canonical predecessor pin:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

Pinned Moby sources reviewed include:

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

Pinned containerd sources reviewed include:

```text
client/container.go
client/image.go
core/containers/containers.go
core/snapshots/snapshotter.go
cmd/ctr/commands/containers/containers.go
cmd/ctr/commands/snapshots/snapshots.go
```

---

## 7. R3F E2 remains required but insufficient

Canonical R3F already requires:

```text
InspectResponse.ImageManifestDescriptor.Digest
==
requirement.workload.source.digest
```

R3G-B must preserve that exact equality.

None of these alone establish physical source lineage:

```text
image name
tag
RepoTags
RepoDigests
InspectResponse.Image
Config.Image
manifest E2 digest
bundle path
OCI Root.Path
snapshot name
mount path
```

---

## 8. Ordered DiffID theorem

R3G-B v1 accepts one or more ordered DiffIDs, each exactly:

```text
sha256:<64 lowercase hexadecimal characters>
```

Non-SHA256, uppercase, malformed, empty, duplicate-ambiguity or oversize input fails closed.

The order is security-significant.

Zero-layer/scratch images are deferred to a separate theorem and fail closed in v1.

---

## 9. ChainID theorem

For one DiffID:

```text
ChainID(D0) = D0
```

For every later DiffID:

```text
ChainID(D0...Dn)
=
sha256(ChainID(D0...D(n-1)) + " " + Dn)
```

The preimage contains canonical digest strings including `sha256:` prefixes.

The canonical result is:

```text
sha256:<64 lowercase hexadecimal characters>
```

Validation must rederive the ChainID rather than trust a supplied value.

---

## 10. Supported storage mode

R3G-B v1 authorizes exactly:

```text
Docker Engine using containerd image store
Docker SystemInfo.OSType == linux
Docker SystemInfo.Driver == overlayfs
containerd namespace == moby
containerd snapshotter == overlayfs
```

Legacy Docker graphdriver/overlay2 mode is not equivalent and must fail closed.

Embedded or otherwise unsupported containerd topology must fail closed if the required bounded endpoint theorem cannot be established.

---

## 11. Correct Moby active-snapshot authority

Pinned Moby `ImageService.CreateLayer` constructs the container layer with:

```text
layerName = exact Docker container ID
```

Its containerd image-store path:

```text
resolves the image parent snapshot from the exact manifest
obtains image DiffIDs
computes identity.ChainID(diffIDs).String()
optionally commits <containerId>-init from that image parent
prepares the active snapshot with key = <containerId>
```

Therefore v1 derives:

```text
activeSnapshotKey = exact full Docker container ID
```

from pinned Moby semantics.

---

## 12. Container.SnapshotKey is explicitly non-authoritative

R3G-B MUST NOT require or trust:

```text
containerd Container.SnapshotKey == containerId
```

Pinned Moby's libcontainerd container metadata path does not establish the Docker rootfs theorem through that field.

`SnapshotKey` and `Snapshotter` returned by `ctr containers info` are diagnostics only for this slice.

The active snapshot is queried directly with the Moby-derived exact key.

---

## 13. Authorized ancestry A

```text
ACTIVE
name   = <containerId>
parent = <expectedImageChainID>

COMMITTED
name   = <expectedImageChainID>
```

No intermediate node is accepted.

---

## 14. Authorized ancestry B — Docker init layer

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

No second arbitrary intermediate is accepted.

Snapshot labels/timestamps are not lineage authority.

---

## 15. Moby physical rootfs mount theorem

Pinned Moby Linux start calls its mount path before OCI spec use.

`Daemon.Mount` calls:

```text
container.RWLayer.Mount(...)
```

and stores the result in:

```text
container.BaseFS
```

For the containerd image-store implementation, the RW layer requests mounts for the exact active snapshot ID.

Moby's ref-counted snapshotter mounter derives the target as:

```text
<DockerRootDir>/rootfs/<snapshotter>/<containerId>
```

and mounts the snapshot there.

For v1:

```text
rootfsMountPath = canonicalJoin(
  DockerRootDir,
  "rootfs",
  "overlayfs",
  exactContainerId,
)
```

---

## 16. Stored OCI Root.Path cross-check

Pinned Moby writes:

```text
OCI Spec.Root.Path = container.BaseFS
```

R3G-B must read the exact container's stored OCI spec through bounded read-only containerd metadata and require:

```text
containerInfo.ID == exactContainerId
containerInfo.Spec.Root.Path == derived rootfsMountPath
```

This path equality is a dynamic cross-check, not physical proof by itself.

---

## 17. R3E bundle is not the rootfs locator

Canonical R3D/R3E observes gVisor runtime-v2 bundle identity for the exact runsc subject.

R3G-B retains that bundle/state identity inside the subject lineage but MUST NOT derive the Moby rootfs path as:

```text
<R3E bundle>/rootfs
```

It also MUST NOT require Moby's internal libcontainerd bundle label to equal the runsc state bundle.

The R3E-to-R3G-B binding is instead:

```text
same exact container ID
+ same exact executionAttemptIdentity
+ same exact containerBindingIdentity
+ same exact runtimeLineageIdentity
+ stable runsc process/state identity
```

---

## 18. Docker SystemInfo locator theorem

The existing trusted R3F Docker Unix-socket provider may be extended with one bounded read-only SystemInfo observation.

Pinned Moby exposes:

```text
DockerRootDir = daemon config Root
Driver        = imageService.StorageDriver()
```

and external containerd address/namespaces where configured.

R3G-B v1 requires security-relevant fields equivalent to:

```text
OSType == linux
Driver == overlayfs
DockerRootDir = canonical absolute path
Containerd.Address == trusted configured containerd Unix socket
Containerd.Namespaces.Containers == moby
```

If required topology fields are absent or unsupported, v1 fails closed.

Docker SystemInfo is a locator/configuration authority only; it cannot substitute for snapshot or kernel proof.

---

## 19. No hard-coded Docker data root

Production MUST NOT assume `/var/lib/docker`.

DockerRootDir must come from the bounded trusted Docker SystemInfo observation.

Caller input cannot override it.

---

## 20. Exact image-rootfs E2 extension

The R3F provider may add only bounded read-only observations needed to obtain:

```text
SystemInfo security fields
ordered RootFS DiffIDs for the exact required manifest digest
```

The exact image/rootfs observation must:

```text
use fixed Docker API v1.48
use the already trusted Docker Unix-socket endpoint
inspect only the exact required digest
revalidate returned manifest descriptor digest equality
extract ordered rootfs DiffIDs only as source-lineage material
ignore names/tags/RepoTags/RepoDigests as authority
remain bounded and duplicate-safe
preserve endpoint identity before/after
```

No registry/network lookup is authorized.

---

## 21. Pinned read-only ctr authority

R3G-B may use `ctr` only as a pinned local read-only containerd client.

Trusted runtime configuration may contain purpose-equivalent exact keys:

```text
version
ctrPath
expectedCtrSha256
containerdAddress
commitSourceLineageEvidence
```

Production must bind the executable bytes and file identity before execution and must prevent path replacement from changing executed bytes.

Caller input cannot select `ctrPath` or `containerdAddress`.

---

## 22. Fixed containerd domain

R3G-B v1 fixes:

```text
namespace   = moby
snapshotter = overlayfs
```

No namespace discovery or snapshotter enumeration is authorized.

---

## 23. Allowed ctr commands

Only semantic equivalents of:

```text
containers info <exactContainerId>
snapshots info <exactContainerId>
snapshots info <exactContainerId>-init       # only when active parent requires it
snapshots info <exactExpectedImageChainID>
```

are authorized.

The fixed trusted address/namespace/snapshotter arguments may be materialized exactly as required by the pinned CLI.

No shell is permitted.

---

## 24. Forbidden ctr commands

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

No generic caller-supplied command or argv is authorized.

`ctr snapshots mounts` remains forbidden because the command can activate mounts; R3G-B observes an already-existing Moby mount instead.

---

## 25. Kernel mount proof

For the derived `rootfsMountPath`, R3G-B must prove from a fixed internal Linux kernel surface:

```text
path exists
path is a directory
path is not a symlink
exactly one canonical mount record resolves to the exact target
filesystem type == overlay
mount record is bounded and canonical
mount identity remains stable across the observation window
```

Directory existence without a mount is failure.

If Kodac's host observation namespace cannot see the Moby mount, v1 fails closed.

No `setns`, helper-based namespace crossing or fallback-to-E2 is authorized.

---

## 26. Writable active upper layer is allowed

An active overlay snapshot may contain writable upper/work components.

That does not invalidate the immutable image-base ancestry theorem.

R3G-B MUST NOT describe that active upper layer as immutable.

---

## 27. No full byte reconstruction in v1

R3G-B v1 does not recursively hash every lowerdir file or reconstruct every image tar stream.

The v1 conjunction is:

```text
required content-addressed manifest
+ ordered DiffIDs
+ deterministic ChainID
+ pinned Moby active-snapshot construction
+ live containerd ancestry
+ stored OCI Root.Path
+ live kernel rootfs mount
+ exact R3E/R3F subject binding
```

A stronger byte-reconstruction theorem requires separate authorization.

---

## 28. Exact subject binding

R3G-B cannot accept an arbitrary container ID.

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

And must revalidate:

```text
R3E containerId == R3F containerId
R3F binding identity == R3E binding identity
R3F imageManifestDigest == requirement.workload.source.digest
```

Any mismatch fails closed.

---

## 29. Dedicated capability

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

The capability MUST NOT be added to generic workspace/K3 read policies.

---

## 30. No caller host authority

The public gateway surface must not expose caller-selectable:

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

Host-reading authority comes only from trusted constructor configuration, canonical predecessor records and fixed internal derivation.

---

## 31. Linux only

R3G-B v1 is Linux-only.

macOS/Windows production paths must fail closed before host observation.

Cross-platform tests must prove that boundary.

---

## 32. Endpoint/artifact identity

Docker endpoint uses the canonical R3F Unix-socket theorem.

Containerd address must be a canonical absolute Unix-socket path and an actual socket.

Before/after endpoint identity must bind at least:

```text
device
inode
uid
gid
mode
```

The ctr executable must bind:

```text
trusted canonical path
SHA-256 bytes
regular-file retained stat identity
```

Endpoint/artifact replacement fails closed.

---

## 33. Bounded observation order

Successful flow must be equivalent to:

```text
1.  validate requirement + capability
2.  resolve/revalidate exact R3F binding
3.  observe exact R3E runtime subject (pre)
4.  bind Docker socket, containerd socket and ctr artifact
5.  read bounded Docker SystemInfo
6.  require Linux + overlayfs + canonical DockerRootDir + exact trusted containerd topology
7.  read exact image-rootfs DiffIDs for required manifest digest
8.  derive exact expected ChainID
9.  derive rootfsMountPath from DockerRootDir/overlayfs/containerId
10. read ctr container info for exact container ID
11. require stored Spec.Root.Path == derived rootfsMountPath
12. read active snapshot info using exact key containerId
13. optionally read exact containerId-init snapshot
14. read exact expected image ChainID snapshot
15. validate exactly one authorized ancestry shape
16. observe exact kernel rootfs mount (pre)
17. re-observe exact R3E subject
18. re-observe/revalidate exact R3F binding
19. re-observe security-relevant storage/spec/ancestry identities
20. re-observe exact kernel mount (post)
21. re-check endpoint/artifact identities
22. require exact stability
23. create/validate E3 source candidate
24. durable commit + exact acknowledgment validation
25. persist K2 receipt + return success
```

Reordering is allowed only when it preserves the same or stronger race theorem.

---

## 34. Stability theorem

Success requires stable identity across:

```text
R3E runtime subject
R3F Docker binding
Docker endpoint
Docker storage locator fields
containerd endpoint
ctr artifact
stored container ID + Spec.Root.Path
snapshot ancestry
physical rootfs mount
```

Observable drift fails closed.

---

## 35. Deterministic identities

R3G-B must create domain-separated deterministic identities for at least:

```text
Docker storage locator
image-rootfs DiffID observation
expected ChainID
container spec observation
snapshot ancestry
physical rootfs mount
final E3 source candidate
```

Validators must rederive derivable values instead of trusting shape-valid hashes supplied by callers.

---

## 36. E3 source candidate

Purpose-equivalent bounded fields:

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

Exact field naming may be refined without widening meaning or authority.

---

## 37. Durable commit theorem

Trusted R3G-B runtime configuration may expose exactly one source-evidence commit callback.

The acknowledgment must bind the exact record identity.

Missing, malformed, wrong, failed, timed-out or aborted acknowledgment prevents success.

Late completion after timeout/abort cannot upgrade the invocation to success.

No status-query/idempotency API is implicitly authorized.

---

## 38. Cancellation and failure receipt

Cancellation must be honored:

```text
before host observation
during Docker reads
during ctr reads
between observations
before commit
during acknowledgment wait
before success receipt
```

A bounded failure receipt may describe failure of the observation invocation.

It must not claim rollback/non-write of an external store after a non-cancellable callback times out.

---

## 39. Conservative resource bounds

Implementation must define equal or stricter finite limits than:

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

Oversize input/output fails closed. Truncation-and-accept is forbidden.

---

## 40. Parser safety

Docker/ctr JSON parsing must be bounded, duplicate-key safe and finite in depth/nodes/keys/arrays/string bytes.

In-memory trust validators must reject hostile proxies/accessors before attacker-controlled property access where the existing trust-module theorem requires it.

Kernel mount parsing must reject:

```text
oversize
NUL
malformed separators
missing mandatory fields
invalid escaping
non-canonical target
ambiguous duplicate exact target
unexpected filesystem type
trailing structural ambiguity
```

---

## 41. No mutation / no shell / no discovery

Forbidden include:

```text
container/image/snapshot mutation
mount(2) or unmount(2)
setns/unshare/chroot/pivot_root
filesystem writes under DockerRootDir/rootfs
containerd/Docker metadata updates
cgroup/network mutation
sh -c / bash -c / eval / command strings
PATH lookup for ctr
which / command -v
socket scanning
Docker data-root scanning
namespace enumeration
snapshotter enumeration
```

The only writes are existing evidence/receipt persistence callbacks.

---

## 42. No direct private metadata parsing / no new native helper

R3G-B MUST NOT parse containerd BoltDB/private storage files directly.

The authorized containerd source is the pinned read-only ctr client against the trusted local API.

The existing R3D C helper remains unchanged.

No new C/Go/Rust helper or package dependency is authorized in v1.

If ctr + fixed internal kernel reads are insufficient, stop and reconcile.

---

## 43. Protected predecessor semantics

R3G-B preserves without weakening:

```text
R3A workload source
R3B pure backend evidence contracts
R3D gVisor observer
R3E runtime lineage
R3F Docker E2 control plane
R3G-A resource E3
H5 guarded-agent behavior
```

R3G-A remains an independent fact; source success does not imply resource success.

---

## 44. Explicit non-claims

R3G-B does not prove:

```text
physical CPU/memory/swap
physical deny-all network
TTL
output limit
globally read-only rootfs
absence of writable upper layer
full rootfs byte reconstruction
registry/Sigstore signature
SBOM correctness
source-code-to-image provenance
legacy graphdriver lineage
R3B final backend observation/evidence
H4 complete
H6 authorized
```

---

## 45. Gateway byte-pin reconciliation

At authorization base:

```text
packages/kodac-runtime/src/execution/gateway.ts
5e4c3cea9982d7c774d0c18beb40f2fcbfde4e64
```

Exact repository search during authorization preparation found executable pins in exactly:

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

The historical R3G-A evidence ledger must not be rewritten.

The exact search MUST be repeated immediately before R3G-B implementation.

An additional executable pin outside the authorized list stops implementation.

---

## 46. Exact pre-ledger implementation allowlist

Only after this authorization becomes canonical, implementation may change exactly these fourteen paths before the R3G-B evidence ledger exists:

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

The nine predecessor tests may change only for exact gateway byte-pin reconciliation while preserving their owned theorem.

---

## 47. Narrow R3F extension allowance

The only authorized R3F production additions are bounded read-only observations for:

```text
Docker SystemInfo security locator fields
exact required image/rootfs DiffIDs
```

Canonical R3F container binding, manifest digest, network/resource checks, endpoint authority and provider identity must not be weakened or redefined.

---

## 48. Explicit protected paths

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

No dependency, schema, workflow, generated-code or donor-import change is authorized.

---

## 49. Protected predecessor blob proof

The focused R3G-B test must pin or equivalently prove byte identity for at least:

```text
sandbox-workload.ts
sandbox-backend-evidence.ts
sandbox-observer-gvisor.ts
sandbox-observer-gvisor-runtime.ts
sandbox-observer-gvisor-cgroup-v2.ts
gvisor-proc-observe.c
receipt.ts
```

Exact blob SHAs are collected from the canonical implementation base immediately before implementation.

---

## 50. Required hostile cases

Focused tests must cover at least:

```text
wrong/non-canonical source digest
empty/oversize/reordered/duplicate/malformed DiffIDs
wrong ChainID
non-Linux Docker SystemInfo
wrong Docker Driver
non-canonical DockerRootDir
containerd address/namespace mismatch
wrong container ID
stored Spec.Root.Path mismatch
missing active snapshot
wrong active kind/parent
unexpected intermediate
wrong/missing init snapshot
wrong/missing committed image snapshot
snapshot drift
Docker endpoint replacement
containerd endpoint replacement
ctr artifact replacement
malformed/duplicate/oversize ctr JSON
ctr timeout/nonzero exit
rootfs target symlink
missing rootfs mount
ambiguous mount target
wrong filesystem type
mount drift
R3E subject drift
R3F binding drift
pre/during cancellation
commit callback failure
wrong commit acknowledgment
commit timeout
late completion cannot upgrade success
non-Linux production fail-closed
caller host-authority injection rejection
```

---

## 51. Focused synthetic success theorem

Synthetic success must demonstrate the entire chain:

```text
required manifest digest
-> Docker SystemInfo locator
-> ordered exact DiffIDs
-> expected ChainID
-> pinned Moby active key = containerId
-> direct OR canonical-init containerd ancestry
-> derived Moby physical rootfs target
-> stored OCI Spec.Root.Path equality
-> stable kernel overlay mount
-> stable exact R3E/R3F subject
-> deterministic E3 source candidate
-> durable exact acknowledgment
```

A caller-created structurally valid candidate cannot constitute proof.

---

## 52. CI limitation

Synthetic CI proves code-level theorem handling, not that GitHub Actions provisioned a production Docker+gVisor+containerd overlayfs host.

No evidence text may convert fixture success into a live deployment claim.

---

## 53. Evidence ledger lifecycle

Reserved ledger:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

It MUST remain absent during implementation/pre-ledger review.

After exact-head pre-ledger PASS it may be created in one ledger-only commit as the sole additional path.

Fresh complete post-ledger exact-head certification is mandatory.

Implementation changes after ledger creation invalidate that ledger cycle unless explicitly reconciled.

---

## 54. Required implementation gates

Before ledger creation:

```text
exact implementation base = canonical main containing this authorization
changed paths = only the fourteen allowlisted paths
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

External reviewer status must be recorded truthfully. Pending/rate-limited/unavailable is not PASS.

---

## 55. Manual security questions before ledger

Manual review must answer NO to all unsafe possibilities:

```text
caller chooses ctr/containerd/DockerRootDir/snapshot/rootfs authority
mutable image name/tag establishes source proof
Container.SnapshotKey establishes Moby lineage
R3E bundle/rootfs is assumed to be Moby rootfs
ctr invokes a mutating command
ctr path replacement changes executed bytes after binding
Docker/containerd endpoint replacement goes unnoticed
arbitrary snapshot ancestry passes
directory existence substitutes for physical mount
writable upper layer is mislabeled immutable
mount namespace invisibility downgrades to E2-only success
late timed-out commit upgrades to success
R3G-B mints final R3B evidence
generic workspace/K3 policy gains R3G-B capability
unsupported graphdriver silently falls back
```

---

## 56. Bounded claim after canonical implementation merge

Only after canonical authorization, scoped implementation, pre-ledger PASS, ledger-only transition, fresh post-ledger PASS, canonical merge and post-merge quality may Kodac claim:

```text
KODAC_LINUX_GVISOR_IMMUTABLE_OCI_IMAGE_BASE_LINEAGE_PROVEN
```

Meaning only:

> K2 can bind one exact canonical R3E gVisor execution instance and exact R3F Docker container to a stable Linux Docker/containerd-overlayfs physical rootfs whose active snapshot key is fixed by the pinned Moby container-ID construction theorem, whose bounded snapshot ancestry terminates at the exact image ChainID derived from the ordered local OCI DiffIDs belonging to the exact required manifest digest, whose stored OCI Root.Path equals the exact Moby-derived physical rootfs target, and whose target is observed as a stable live kernel overlay mount, with a durably acknowledged E3 source record and no mutation of container, image, snapshot or mount state.

---

## 57. Explicit post-R3G-B non-claims

The bounded claim does not mean:

```text
running rootfs globally read-only
writable upper layer absent
full byte reconstruction
registry/Sigstore provenance
SBOM correctness
source-code provenance
legacy graphdriver lineage
physical deny-all network
TTL
output limit
R3B final backend observation/evidence
H4 complete
H6 authorized
```

---

## 58. Expected next slice

Purpose-equivalent next candidate after proven R3G-B:

```text
KDO-H4-R3G-C — Physical Deny-All Network Observation
```

R3G-B pre-authorizes none of R3G-C's network/kernel authority.

---

## 59. Authorization PR scope

PR #106 authorization scope is exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

The R3G-B evidence ledger must remain absent.

Corrections to this same authorization document during review require fresh exact-head CI/review before merge.

---

## 60. Authorization review gate

Before this document may become canonical:

```text
base = exact canonical main adab893d8e122320f441ec9a85a77527d92fbd02
changed paths = exactly this authorization document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2/K3 regressions = PASS where triggered
available external review = no unresolved actionable finding
manual architecture/trust review = PASS
```

No R3G-B implementation branch is authorized until this docs-only authorization is merged to canonical `main`.

---

## 61. Final invariant

```text
IMAGE NAME/TAG IS NOT PHYSICAL IDENTITY.
R3F MANIFEST E2 ALONE IS NOT PHYSICAL LINEAGE.
CONTAINERD CONTAINER SNAPSHOTKEY METADATA IS NOT THE MOBY V1 AUTHORITY.
R3E RUNSC BUNDLE IS NOT THE MOBY ROOTFS LOCATOR.
ROOTFS PATH STRING ALONE IS NOT PHYSICAL LINEAGE.
SNAPSHOT METADATA ALONE IS NOT PHYSICAL LINEAGE.

R3G-B V1 REQUIRES:

exact required manifest digest
+ ordered immutable DiffIDs
+ exact derived image ChainID
+ pinned Moby active-key theorem (containerId)
+ exact bounded containerd snapshot ancestry
+ trusted DockerRootDir/overlayfs locator
+ exact stored OCI Root.Path equality
+ exact stable live kernel rootfs mount
+ exact stable R3E runtime subject
+ exact stable R3F Docker binding
+ pinned read-only ctr artifact
+ stable Docker/containerd endpoints
+ durable acknowledged E3 source record

OR IT FAILS CLOSED.
```
