# KDO-H4-R3G-B — Immutable OCI Image-Base / Rootfs Physical Lineage Authorization

Date: 2026-08-16

Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — IMPLEMENTATION NOT YET AUTHORIZED UNTIL CANONICAL MERGE**

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

This document authorizes only the bounded R3G-B source-lineage slice described below after this document itself is reviewed and merged canonically.

It does **not** authorize implementation while this document is merely proposed.

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

The first R3G-B implementation must prove a narrow conjunction:

1. the exact canonical R3E gVisor execution subject remains the same running instance;
2. the exact R3F Docker container binding remains the same container and required manifest digest;
3. the local Docker/containerd image metadata resolves that exact required OCI manifest digest to an ordered immutable image-rootfs DiffID chain;
4. the ordered DiffIDs deterministically derive one expected image ChainID;
5. containerd metadata for the exact full container ID names the exact active snapshot key and the `overlayfs` snapshotter;
6. the active snapshot has one of only two authorized ancestry shapes ending at the expected immutable image ChainID;
7. the exact R3E bundle has a real, non-symlink `rootfs` mount whose kernel-visible mount identity remains stable while the same R3E subject remains live;
8. all control-plane, snapshot-lineage and kernel-mount observations remain stable across the observation window;
9. a durable E3 source-lineage record is acknowledged before the gateway can return success.

Failure of any conjunct is fail-closed.

---

## 2. Terminology correction: “immutable rootfs” does not mean “the whole running rootfs is read-only”

R3A authorizes an immutable OCI source digest. It does **not** require the running container root filesystem to be globally read-only.

A normal Docker/containerd container may have a writable active snapshot above immutable image layers.

Therefore this slice uses the precise term:

```text
immutable OCI image-base / rootfs lineage
```

The theorem is:

> the running container's active rootfs snapshot descends from the exact content-addressed OCI image-base lineage required by the workload.

It is **not**:

> no file in the running rootfs can be modified.

`root.readonly=true` is not added as a hidden R3G-B requirement.

---

## 3. Why R3F E2 is necessary but insufficient

Canonical R3F already proves, through Docker Engine's read-only control plane, that:

```text
InspectResponse.ImageManifestDescriptor.Digest
==
requirement.workload.source.digest
```

That is an important E2 binding.

R3G-B must not reinterpret it as physical source proof by itself.

The following remain insufficient alone:

```text
Docker image name
Docker image tag
Docker RepoTags
Docker RepoDigests
InspectResponse.Image
Config.Image
bundle path string
OCI config root.path string
R3F ImageManifestDescriptor digest alone
```

R3G-B adds independent containerd snapshot ancestry plus a kernel-visible live rootfs mount and exact R3E subject bracketing.

---

## 4. Evidence class

R3G-B may emit only:

```text
E3 PHYSICAL SOURCE CANDIDATE
```

R3G-B must not mint or structurally simulate:

```text
SandboxBackendObservation
SandboxExecutionEvidence
E4 final backend proof
```

The final R3B conjunction remains a later gate.

---

## 5. Upstream primary-source pins used by this authorization

This authorization is grounded in exact upstream source snapshots.

### OCI Image Spec

Repository:

```text
opencontainers/image-spec
```

Source commit inspected:

```text
af26a05fba5ee648512f4ea3c9fda1fcc1b6d6dc
```

Relevant source:

```text
manifest.md
config.md
```

### OCI Runtime Spec

Repository:

```text
opencontainers/runtime-spec
```

Source commit inspected:

```text
6999a89a76a0329f440d5740497bedb9dd431297
```

Relevant source:

```text
config.md
```

### Moby / Docker Engine

Repository:

```text
moby/moby
```

Canonical R3F source pin retained:

```text
d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
```

Relevant source inspected includes:

```text
daemon/image_store_choice.go
daemon/containerd/image_snapshot.go
daemon/containerd/image_inspect.go
daemon/snapshotter/mount.go
daemon/start.go
daemon/start_unix.go
```

### containerd

Moby at the pinned commit depends on:

```text
github.com/containerd/containerd/v2 v2.3.4
```

The verified annotated `v2.3.4` tag resolves to commit:

```text
db8809540e1a7a9da5d518876894933ff55692ab
```

Relevant source inspected includes:

```text
client/image.go
core/containers/containers.go
core/snapshots/snapshotter.go
core/runtime/v2/bundle.go
core/runtime/v2/task_manager.go
cmd/containerd-shim-runc-v2/runc/container.go
cmd/ctr/commands/containers/containers.go
cmd/ctr/commands/snapshots/snapshots.go
```

### gVisor

Canonical gVisor pin retained from R3D/R3E/R3G-A:

```text
50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

Relevant source inspected includes:

```text
runsc/cmd/sandboxsetup/gofer_mount.go
```

---

## 6. OCI source theorem

The OCI image manifest is content-addressable and references:

- an image configuration descriptor;
- an ordered list of layer descriptors.

For an OCI image configuration, `rootfs.diff_ids` is the ordered sequence of uncompressed layer digests.

R3G-B must derive the image-base identity from the ordered DiffIDs, not from a mutable name or tag.

For v1, every accepted DiffID must be exactly:

```text
sha256:<64 lowercase hexadecimal characters>
```

R3G-B v1 may reject non-SHA256 algorithms even if an upstream OCI implementation could theoretically support them.

This is intentional fail-closed narrowing.

---

## 7. ChainID theorem

R3G-B must implement the OCI/containerd ordered ChainID derivation exactly.

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

where the hashed text uses canonical digest strings including the `sha256:` prefix and the result is represented as a canonical `sha256:<64 lowercase hex>` digest.

Ordering is security-significant.

Reordering, duplicating, dropping or inserting a DiffID must change or invalidate the expected ChainID.

---

## 8. V1 excludes zero-layer / scratch source lineage

R3G-B v1 requires at least one canonical DiffID.

Zero-layer/scratch images are deliberately deferred because their snapshot-parent theorem differs from the non-empty ChainID path.

A zero-layer source must fail closed under v1.

This is a bounded-scope choice, not a statement that scratch images are insecure.

---

## 9. Why containerd-snapshotter-only is the first theorem

At the pinned Moby source, Linux defaults to the containerd image store.

Moby can still support legacy graphdriver configurations.

R3G-B v1 does not attempt to prove both storage architectures at once.

Authorized v1 storage mode is exactly:

```text
Docker Engine
containerd image store
containerd namespace = moby
snapshotter = overlayfs
```

Legacy graphdriver/overlay2 Docker storage is **not** silently accepted as equivalent.

If the running host does not expose the v1 containerd/overlayfs theorem, R3G-B v1 fails closed.

A legacy graphdriver theorem requires a later independent authorization.

---

## 10. containerd container metadata theorem

containerd's canonical `containers.Container` includes:

```text
ID
Image
Runtime
Spec
SnapshotKey
Snapshotter
```

Upstream containerd states that `SnapshotKey` specifies the snapshot key to use for the container root filesystem and that task creation should look up the mounts from that snapshot service and include them in the task create request.

R3G-B relies only on these security-relevant fields:

```text
ID
SnapshotKey
Snapshotter
```

The mutable `Image` field is diagnostic only and must not establish source identity.

The mutable `Spec` is not source identity.

For v1:

```text
ID == exact full R3F/R3E container ID
SnapshotKey == exact full container ID
Snapshotter == "overlayfs"
```

Any other `SnapshotKey` fails closed in v1 even if containerd itself supports arbitrary keys.

---

## 11. containerd snapshot model

The pinned containerd snapshot model distinguishes:

```text
Active
View
Committed
```

A running container uses an active snapshot derived from a committed image snapshot.

R3G-B must query the exact snapshot key and validate:

```text
Name == exact SnapshotKey
Kind == Active
Parent != empty
```

The parent chain must then match one of the two exact v1 shapes below.

---

## 12. Authorized ancestry shape A — direct image parent

```text
ACTIVE container snapshot
name   = <containerId>
kind   = Active
parent = <expectedImageChainID>

COMMITTED image snapshot
name   = <expectedImageChainID>
kind   = Committed
```

No additional intermediate parent is accepted.

---

## 13. Authorized ancestry shape B — canonical Docker init layer

Moby may create a container init layer.

The only authorized one-intermediate shape is:

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

No prefix/suffix approximation is allowed.

---

## 14. Snapshot labels are not lineage authority

Snapshot labels may be retained for diagnostics but are not source identity.

R3G-B must not accept a false parent chain because a label happens to mention an expected digest.

Only `Name`, `Kind`, and `Parent` participate in the v1 ancestry theorem.

---

## 15. Pinned read-only `ctr` artifact

R3G-B v1 may use the host `ctr` executable only as a pinned read-only client artifact for the exact containerd APIs below.

Trusted runtime configuration must include:

```text
ctrPath
expectedCtrSha256
containerdAddress
commitSourceLineageEvidence
```

The implementation must open the `ctr` artifact once, bind its file identity and SHA-256, retain the descriptor, and execute only through that retained artifact handle or an equivalently race-resistant retained executable identity.

A later path replacement must not change which bytes execute.

Caller input must never select `ctrPath` or `containerdAddress`.

---

## 16. Fixed containerd namespace

R3G-B v1 fixes:

```text
namespace = moby
```

The caller cannot override it.

No namespace discovery/list operation is authorized.

---

## 17. Allowed `ctr` command surfaces

Only two semantic command families are authorized:

```text
containers info <exactContainerId>
snapshots info <exactSnapshotKeyOrAuthorizedParent>
```

with fixed trusted:

```text
address
namespace = moby
snapshotter = overlayfs   # for snapshot operations
```

The pinned containerd `ctr` implementation serializes both container info and snapshot info as JSON.

The implementation may materialize exact argv required by the pinned CLI, but no shell is permitted.

---

## 18. Explicitly forbidden `ctr` surfaces

R3G-B must never execute:

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

No generic caller-supplied ctr subcommand is authorized.

No shell command string is authorized.

---

## 19. Why `ctr snapshots mounts` is intentionally forbidden

Although snapshotter `Mounts` is itself a read-oriented API, the pinned `ctr snapshots mounts` command also passes the result through the containerd mount manager and may activate mounts.

R3G-B is an observation slice.

It must not create, activate, prepare, view, mount or mutate snapshot state.

Therefore R3G-B v1 does not invoke that CLI surface.

---

## 20. Docker image-rootfs E2 extension

R3G-B needs the ordered `rootfs.diff_ids` corresponding to the exact required manifest digest.

The existing R3F Docker provider may be extended only with one bounded read-only image-rootfs observation method.

That method must:

1. use the already trusted/pinned Docker Unix-socket endpoint model;
2. use fixed API version `v1.48`;
3. inspect only the exact source digest already proven by the R3F container observation;
4. require returned image descriptor digest to equal the exact required source digest;
5. read only the ordered `RootFS.Layers` DiffIDs needed for ChainID derivation;
6. preserve endpoint identity before/after;
7. have bounded response size, timeout, UTF-8 and JSON parser limits;
8. never treat RepoTags/RepoDigests/name/tag as source authority.

This extension remains E2 metadata.

It becomes useful to R3G-B only when conjoined with exact containerd snapshot ancestry, live bundle rootfs mount and R3E runtime identity.

---

## 21. No registry or remote image authority

R3G-B v1 must not contact:

```text
Docker Hub
OCI registry
credential helper
registry auth service
remote content resolver
```

The theorem uses only already-local trusted host state.

No registry credentials are accepted or emitted.

---

## 22. Runtime bundle theorem

Canonical R3D/R3E already observes the exact running gVisor state including:

```text
container ID
running status
PID
bundle path
process executable identity
```

containerd runtime-v2 creates a task bundle and a `rootfs` directory beneath it.

The pinned shim path mounts the rootfs components at:

```text
<bundle>/rootfs
```

before runtime creation.

Therefore R3G-B derives exactly:

```text
rootfsPath = <validated R3E bundle> + "/rootfs"
```

The caller cannot supply a rootfs path.

---

## 23. Bundle path string is not proof

The R3E bundle string is only a trusted subject locator.

R3G-B must additionally prove the derived rootfs path is a live kernel-visible mount during the observation window.

The following must not be accepted as physical proof:

```text
bundle string exists
rootfs directory exists
config.json says root.path=rootfs
Docker metadata says overlayfs
```

A kernel mount observation is required.

---

## 24. V1 bundle/rootfs path shape

For the canonical Docker/containerd runtime-v2 configuration supported by v1, the exact R3E bundle must remain under the trusted runtime-v2 task state root for namespace `moby` and terminate in the full container ID.

The implementation may encode the exact canonical prefix proven by the pinned stack, or bind an equivalent trusted constructor-level state-root configuration.

It must not accept a caller-selected bundle root.

At minimum:

```text
basename(bundle) == exact full container ID
parent namespace component == moby
rootfsPath == bundle + /rootfs
```

Any relative, non-canonical, NUL-containing or traversal path fails closed.

---

## 25. Kernel rootfs mount observation

R3G-B must observe the derived `rootfsPath` from a fixed internal Linux kernel surface.

The implementation must prove at least:

```text
rootfs path exists
rootfs path is a directory
rootfs path is not a symlink
exactly one canonical mount entry resolves to rootfsPath
filesystem type == overlay
mount root/options grammar is canonical and bounded
```

If the exact mount cannot be observed from Kodac's trusted host namespace, v1 fails closed.

No ambient fallback to directory existence is allowed.

---

## 26. Writable active upper layer is allowed

An `overlay` rootfs mount may have a writable upper/work layer because the running container snapshot is active.

That does not invalidate the immutable image-base theorem.

R3G-B must not claim that the active upper layer is immutable.

The source claim is only that the active snapshot's authorized ancestry terminates at the expected immutable image ChainID.

---

## 27. No lowerdir path hashing theorem in v1

R3G-B v1 does not recursively hash every file in overlay lowerdirs.

It instead uses the content-addressed OCI DiffID/ChainID theorem plus trusted containerd snapshot ancestry and live rootfs mount binding.

No claim is made that Kodac independently recomputes every filesystem byte from a tar stream during observation.

A future stronger byte-reconstruction theorem may be separately authorized.

---

## 28. R3E subject identity is mandatory

R3G-B cannot operate on an arbitrary container ID.

The exact subject must originate from the trusted R3E lineage already proven through the gateway.

At minimum the source candidate must bind:

```text
requirementIdentity
workloadIdentity
executionAttemptIdentity
containerBindingIdentity
R3E runtimeLineageIdentity
containerId
runsc process identity
bundle identity/state identity
```

No caller-created structurally valid R3E record is physical proof by itself.

---

## 29. R3F subject identity is mandatory

R3G-B must require the same exact R3F container binding/control-plane observation used for R3E.

At minimum:

```text
R3F containerId == R3E containerId
R3F bindingIdentity == R3E container binding identity
R3F imageManifestDigest == requirement.workload.source.digest
```

Any mismatch fails closed.

---

## 30. Source digest equality

The exact immutable source digest is always:

```text
requirement.workload.source.digest
```

The Docker image-rootfs E2 observation must resolve this same digest.

The R3G-B candidate may carry the digest only after equality is revalidated.

A tag or mutable image name never substitutes.

---

## 31. Exact `ctr` container-info requirements

The bounded parser must validate the returned container info as an ordinary non-proxy object and reject parser ambiguity.

Security-relevant requirements:

```text
ID == exact containerId
SnapshotKey == exact containerId
Snapshotter == "overlayfs"
```

The parser may accept/ignore bounded non-authoritative metadata only if doing so cannot affect identity or execute getters/proxies.

Duplicate JSON keys are forbidden.

Unexpected structural ambiguity fails closed.

---

## 32. Exact snapshot-info requirements

For every snapshot info response used in the theorem, R3G-B must validate:

```text
Name
Parent
Kind
```

Kind must be one of the exact expected values for its role.

Timestamps and labels are not lineage authority.

The final source-lineage identity must bind the ordered canonical snapshot ancestry, not arbitrary serialized label maps.

---

## 33. Output bounds

R3G-B must define finite conservative bounds before implementation.

At minimum bounds must cover:

```text
ctr artifact path bytes
containerd socket path bytes
ctr container-info output bytes
ctr snapshot-info output bytes
Docker image-inspect output bytes
maximum DiffID count
maximum JSON depth
maximum JSON nodes
maximum object keys
maximum array items
maximum string bytes
mountinfo bytes
maximum mount entries
rootfs path bytes
commit timeout
maximum serialized E3 source-record bytes
```

Oversize input/output fails closed.

No truncation-and-accept behavior is authorized.

---

## 34. Suggested v1 conservative limits

Implementation may choose equal or stricter bounds after tests, but may not silently loosen these without reconciliation:

```text
maxPathBytes                 = 4096
maxCtrContainerInfoBytes     = 1 MiB
maxCtrSnapshotInfoBytes      = 256 KiB each
maxDockerImageInspectBytes   = 1 MiB
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

---

## 35. `ctr` endpoint identity

The configured containerd address must be a canonical absolute Unix-socket path.

R3G-B must snapshot its endpoint identity before trusted queries and require the same endpoint identity afterward.

At minimum bind:

```text
device
inode
uid
gid
mode
```

The endpoint must be an actual Unix socket.

Socket replacement during observation fails closed.

---

## 36. Artifact identity

The trusted `ctr` artifact identity must bind at least:

```text
path configuration identity
SHA-256 bytes
stat identity from retained descriptor
```

The executable must be a non-empty regular file.

The implementation must execute the retained artifact, not reopen the path immediately before each invocation.

---

## 37. No caller authority injection

The public gateway method may accept only the already-authorized execution requirement/subject inputs plus cancellation.

It must not expose caller options such as:

```text
ctrPath
containerdAddress
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

Container/snapshot/path values must be derived from trusted canonical records and fixed runtime configuration.

---

## 38. Dedicated capability

R3G-B uses a dedicated protected capability, purpose-equivalent to:

```text
runtime.observe.gvisor.source-lineage
```

The gateway must remain policy-gated:

```text
allow -> may proceed
ask   -> block
 deny -> block
```

This capability must not be added to generic workspace/K3 read policies as part of R3G-B.

Doing so would widen the wrong authority surface.

---

## 39. Linux only

R3G-B v1 is Linux-only.

On macOS or Windows production paths, the dedicated gateway method must fail closed before host observation.

Cross-platform tests must still prove that non-Linux paths cannot accidentally proceed.

---

## 40. Observation ordering

A successful source-lineage observation must use a bounded order equivalent to:

```text
1. validate requirement and protected capability
2. resolve/revalidate exact R3F container binding
3. observe exact R3E state/process/runtime identity (pre)
4. verify trusted ctr artifact + containerd socket endpoint
5. obtain bounded Docker image-rootfs E2 observation for required manifest digest
6. derive ordered DiffIDs + expected ChainID
7. obtain ctr container info for exact container ID
8. obtain active snapshot info
9. if needed, obtain exact <containerId>-init snapshot info
10. obtain expected image ChainID snapshot info
11. observe derived bundle/rootfs kernel mount (pre)
12. re-observe R3E exact subject
13. re-observe/revalidate R3F exact container binding
14. re-query container/snapshot lineage or equivalently prove stable exact identities
15. re-observe bundle/rootfs kernel mount (post)
16. re-check ctr artifact + containerd socket endpoint
17. require exact stable identities across pre/post window
18. create E3 physical source candidate
19. durable commit + exact acknowledgment validation
20. persist K2 receipt and return success
```

Implementation may reorder independent checks only if the same or stronger race theorem is preserved.

---

## 41. Stable observation theorem

The successful candidate must require exact identity equality across the observation window for every mutable boundary relied upon, including:

```text
R3E execution subject
R3F container binding
Docker socket endpoint
containerd socket endpoint
ctr executable artifact
container info identity
snapshot ancestry identity
bundle/rootfs mount identity
```

If a value changes and is merely changed back later, the implementation must not silently certify the unstable interval if that change is observable by the bounded theorem.

---

## 42. Rootfs mount identity

R3G-B must create a deterministic rootfs mount identity from canonical parsed kernel mount fields.

It must not hash raw unbounded mountinfo text.

At minimum the identity should bind the canonical security-relevant mount record and derived rootfs path.

For v1 it must include enough information to distinguish a mount replacement at the same path.

---

## 43. Container metadata identity

The container metadata identity must bind only security-relevant normalized fields, at minimum:

```text
containerId
snapshotKey
snapshotter
```

Mutable image-name metadata, labels and timestamps must not control the source theorem.

---

## 44. Snapshot ancestry identity

The snapshot ancestry identity must bind the exact ordered nodes used:

```text
active container snapshot
optional canonical init snapshot
committed expected image snapshot
```

Each node identity must bind:

```text
name
kind
parent
```

No unordered set representation is allowed.

---

## 45. Image-rootfs identity

The Docker image-rootfs E2 observation identity must bind at least:

```text
required manifest digest
ordered DiffIDs
expected ChainID
Docker endpoint identity
```

It must not bind tags as authoritative source fields.

---

## 46. E3 source candidate

Purpose-equivalent v1 candidate fields:

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
imageRootfsIdentity
expectedImageChainId
containerdEndpointIdentity
ctrArtifactIdentity
containerMetadataIdentity
snapshotAncestryIdentity
rootfsMountIdentity
candidateIdentity
```

Exact final field names may be refined during implementation only if semantics stay within this authorization.

---

## 47. Candidate identity

`candidateIdentity` must be domain-separated and deterministic.

It must cover every security-relevant field of the normalized candidate.

A caller may not supply a candidate identity that is merely shape-checked.

Validation must rederive it.

---

## 48. Durable source-lineage record

The trusted runtime configuration may expose exactly one durable commit callback for the R3G-B source candidate/record.

The commit acknowledgment must bind the exact candidate/record identity.

Wrong, malformed, missing, timed-out or aborted acknowledgment prevents successful return.

Late completion after timeout/abort cannot upgrade the invocation to success.

No status-query/idempotency API is implicitly authorized by this document.

Any wider commit protocol requires separate reconciliation.

---

## 49. Cancellation

Cancellation must be honored:

```text
before first host observation
while waiting for ctr
while waiting for Docker image inspect
between lineage observations
before durable commit
while waiting for commit acknowledgment
before success receipt
```

A cancelled or timed-out operation cannot later return success because an underlying non-cancellable callback finishes.

---

## 50. Failure receipts

A bounded attributable K2 failure receipt may be persisted when the observation invocation fails.

A failure receipt describes failure of the observation/proof invocation.

It must not overclaim rollback of an external durable store.

---

## 51. No mutation

R3G-B implementation must not perform:

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
filesystem write to bundle/rootfs
containerd metadata update
Docker metadata update
cgroup mutation
network mutation
```

This slice is observation-only except for its own evidence/receipt persistence callbacks.

---

## 52. No direct containerd metadata-file parsing

R3G-B must not parse containerd BoltDB metadata files or implementation-private storage files directly.

That would create a brittle authority tied to private on-disk layouts and bypass the containerd API consistency model.

The trusted source is the pinned local containerd API accessed through the pinned read-only `ctr` artifact.

---

## 53. No environment discovery

Production must not use:

```text
PATH search for ctr
which ctr
command -v ctr
containerd socket scanning
snapshotter enumeration
namespace enumeration
Docker data-root scanning
recursive /var/lib discovery
```

Trusted constructor configuration and fixed constants define the supported surface.

If unavailable, fail closed.

---

## 54. No shell

Every external executable invocation must use a fixed executable artifact and argument array.

Forbidden:

```text
sh -c
bash -c
cmd /c
PowerShell command strings
eval
string-concatenated shell pipelines
```

---

## 55. JSON parser safety

All Docker/ctr JSON parsing must be:

```text
bounded before parse
duplicate-key safe
finite-depth
finite-node-count
finite-key-count
finite-array-count
finite-string-size
plain-object / data-property safe for in-memory validation
```

Proxy/accessor hostile objects used in validator tests must fail before attacker-controlled property traps execute where the existing trust-module pattern supports that theorem.

---

## 56. Physical mount parser safety

Mountinfo parsing must reject:

```text
oversized input
NUL
malformed separator
missing mandatory fields
ambiguous duplicate exact rootfs mountpoint
invalid escaping
non-canonical mountpoint
unexpected filesystem type
trailing structural ambiguity
```

Raw path comparison without mountinfo escape decoding is insufficient.

---

## 57. Protected predecessor semantics

R3G-B must preserve the already-canonical meanings of:

```text
R3A workload source
R3B pure backend evidence contracts
R3D gVisor runtime candidate
R3E runtime lineage
R3F Docker control-plane E2
R3G-A cgroup-v2 E3 resource evidence
H5 agent/guard behavior
```

R3G-B must not weaken a predecessor theorem in order to make its own theorem easier.

---

## 58. R3G-A remains independent

R3G-B source success does not imply resource success.

R3G-A evidence is not required to derive the source ChainID, and R3G-B must not mutate cgroup logic.

The final later R3B conjunction may require both independent facts.

---

## 59. Protected physical-policy non-claims

R3G-B does not prove:

```text
physical CPU/memory/swap     # R3G-A owns this
physical deny-all network    # R3G-C candidate
TTL
output limit
rootfs globally read-only
no writable upper layer
registry authenticity beyond required local digest
signature/Sigstore provenance
SBOM correctness
source-code provenance of the image
R3B final SandboxBackendObservation
R3B SandboxExecutionEvidence
H4 complete
H6 authorized
```

---

## 60. Exact current gateway byte-pin reconciliation

At the R3G-B authorization base, the current gateway blob is:

```text
packages/kodac-runtime/src/execution/gateway.ts
5e4c3cea9982d7c774d0c18beb40f2fcbfde4e64
```

Exact repository search at authorization preparation time found executable tests pinning this blob in exactly these nine paths:

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

The R3G-A evidence ledger also records the blob but is historical evidence and must not be rewritten merely because a later authorized gateway change supersedes the executable pin.

Before any R3G-B implementation write, the exact repository search for this blob must be repeated.

If an additional executable test pins it, implementation must stop and reconcile the allowlist before modifying an unlisted path.

---

## 61. Exact pre-ledger implementation allowlist

After this authorization becomes canonical, R3G-B implementation may modify exactly these fourteen paths before its evidence ledger exists:

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

The nine predecessor tests may change only to reconcile the superseded gateway blob pin and preserve their existing owned theorem.

---

## 62. Why the R3F module is in the allowlist

The only authorized R3F production change is a bounded read-only image-rootfs E2 observation needed to derive ordered DiffIDs from the exact required manifest digest.

It must not change:

```text
R3F container discovery
R3F exact container binding
R3F network/resource assertions
R3F provider identity meaning
R3F ImageManifestDescriptor digest theorem
R3F Docker socket authority
```

The focused R3F regression test must prove predecessor semantics remain intact.

---

## 63. Explicit protected paths

R3G-B MUST NOT modify, unless separately reconciled:

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

No dependency update, generated code, donor import, schema change or workflow change is authorized.

---

## 64. No new native helper in R3G-B v1

The existing R3D C helper is intentionally tiny and tied to pidfd/process executable identity.

R3G-B does not expand it into a containerd client.

No new C/Go/Rust helper is authorized by this v1 document.

The pinned `ctr` artifact is the only newly authorized external read-only client executable.

If this proves inadequate during implementation, stop and reconcile instead of silently introducing a new helper or dependency.

---

## 65. Protected predecessor blob checks

The focused R3G-B test must pin or otherwise prove byte identity for high-risk predecessor surfaces that R3G-B is not authorized to change, including at minimum:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/evidence/receipt.ts
```

Exact canonical blob values must be collected from the implementation base before implementation.

---

## 66. Required focused hostile cases

The focused R3G-B proof must include deterministic hostile tests for at least:

```text
wrong source manifest digest
uppercase/non-canonical digest
empty DiffID list
oversized DiffID list
reordered DiffIDs
malformed DiffID
wrong ChainID
wrong container ID
wrong SnapshotKey
wrong snapshotter
active snapshot wrong kind
empty active parent
unexpected intermediate snapshot
wrong init snapshot name
init snapshot wrong kind
init snapshot wrong parent
image snapshot wrong kind
missing expected image snapshot
container info drift
snapshot ancestry drift
containerd socket replacement
ctr artifact byte/path replacement
malformed ctr JSON
duplicate ctr JSON keys
oversized ctr output
ctr timeout/nonzero exit/stderr policy violation
bundle mismatch
rootfs path symlink
missing rootfs mount
ambiguous duplicate mount entry
wrong filesystem type
mount identity drift
R3E subject drift
R3F binding drift
pre-cancel
during-ctr cancellation
during-Docker-read cancellation
pre-commit cancellation
commit callback failure
wrong commit acknowledgment
commit timeout
late commit completion cannot upgrade success
non-Linux production fail-closed
caller host-authority injection rejection
```

---

## 67. Focused success fixture

A complete synthetic success theorem must establish:

```text
required manifest digest
-> bounded Docker image-rootfs observation
-> ordered DiffIDs
-> exact expected ChainID
-> exact containerd container SnapshotKey=containerId
-> overlayfs snapshotter
-> authorized direct OR init ancestry
-> exact stable live bundle/rootfs overlay mount
-> exact stable R3E/R3F subject
-> deterministic E3 source candidate
-> durable exact acknowledgment
```

The fixture must make it impossible to pass merely by validating a caller-created candidate object.

---

## 68. CI limitation

Synthetic fixtures can prove parser, identity, ordering, fail-closed and integration logic.

Ordinary GitHub Actions CI does not by itself prove a real production Docker+gVisor+containerd overlayfs instance was provisioned unless a future explicitly authorized live test actually does so.

No test name or evidence ledger may misdescribe synthetic success as a live production deployment.

---

## 69. Evidence ledger lifecycle

Reserved R3G-B evidence ledger path:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

It MUST NOT exist during implementation/pre-ledger review.

After exact-head pre-ledger PASS, it may be created in one ledger-only commit as the sole additional path.

Fresh complete post-ledger exact-head certification is mandatory.

Any implementation correction after ledger creation invalidates that ledger cycle and requires withdrawal/recreation or explicit canonical reconciliation.

---

## 70. Scope gate before tests

Before implementation can be accepted for ledger creation:

```text
exact implementation base = canonical main containing this authorization
changed paths = only the fourteen implementation allowlist paths
reserved R3G-B ledger = absent
```

Any extra production/test/docs/schema/workflow/dependency path invalidates the gate until reconciled.

Tests are not interpreted as acceptance evidence before scope truth is established.

---

## 71. Required repository gates

Any accepted R3G-B implementation head must pass at the exact accepted SHA:

```text
governance / provenance
legacy tests / ruff
runtime-change classifier
Ubuntu runtime Typecheck + full Test + benchmark
Windows runtime Typecheck + full Test + benchmark
macOS runtime Typecheck + full Test + benchmark
K2 runtime aggregate gate
K3-R4 regression gate
K3-R5 regression gate
focused R3G-B proof
focused R3F regression
manual architecture/trust/security review
0 unresolved actionable review threads
```

External reviewer availability/status must be recorded accurately.

Pending/rate-limited/unavailable is not PASS.

---

## 72. Manual security review questions

Before ledger creation, manual review must answer at minimum:

```text
Can a caller choose ctr/containerd/socket/snapshot/path authority? -> must be NO
Can mutable image names/tags establish source proof? -> must be NO
Can ctr invoke a mutating command? -> must be NO
Can ctr path replacement change executed bytes after binding? -> must be NO
Can containerd socket replacement go unnoticed? -> must be NO
Can arbitrary snapshot ancestry be accepted? -> must be NO
Can bundle/rootfs directory existence substitute for a mount? -> must be NO
Can writable active upper layer be mislabeled immutable? -> must be NO
Can a late timed-out commit upgrade failure to success? -> must be NO
Can R3G-B mint R3B final evidence? -> must be NO
Can generic workspace/K3 policies receive the capability? -> must be NO
Can unsupported graphdriver mode silently fall back? -> must be NO
```

---

## 73. Successful R3G-B bounded claim after canonical merge

Only after:

- this authorization is canonical;
- implementation remains within the exact allowlist;
- exact-head pre-ledger PASS;
- ledger-only transition PASS;
- fresh exact-head post-ledger certification PASS;
- canonical implementation merge succeeds;
- canonical post-merge quality succeeds;

may Kodac make the bounded claim:

```text
KODAC_LINUX_GVISOR_IMMUTABLE_OCI_IMAGE_BASE_LINEAGE_PROVEN
```

Meaning only:

> K2 can bind one exact canonical R3E gVisor execution instance and exact R3F Docker container to a stable Linux containerd/overlayfs active-rootfs snapshot ancestry whose immutable image parent is the ChainID deterministically derived from the ordered local OCI DiffIDs belonging to the exact required content-addressed manifest digest, while also observing a stable live rootfs mount at the exact runtime bundle, and can durably record that conjunction as an E3 physical source candidate without mutating container, snapshot, image or mount state.

---

## 74. Explicit non-claims after successful R3G-B

The bounded claim does NOT mean:

```text
running rootfs globally read-only
writable upper layer absent
every rootfs file independently rehashed by Kodac
registry signature verified
Sigstore provenance verified
SBOM verified
source-code-to-image provenance verified
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

## 75. Expected next candidate

After proven canonical R3G-B, the next independent physical-policy candidate remains purpose-equivalent to:

```text
KDO-H4-R3G-C — Physical Deny-All Network Observation
```

R3G-B pre-authorizes none of R3G-C's kernel/network read surfaces or implementation choices.

---

## 76. Authorization PR scope

This authorization PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

The R3G-B evidence ledger must remain absent.

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

No implementation branch may be treated as authorized until this docs-only authorization is merged to canonical `main`.

---

## 78. Final authorization invariant

```text
SOURCE NAME/TAG IS NOT PHYSICAL IDENTITY.
R3F MANIFEST E2 ALONE IS NOT PHYSICAL LINEAGE.
BUNDLE PATH STRING ALONE IS NOT PHYSICAL LINEAGE.
SNAPSHOT METADATA ALONE IS NOT PHYSICAL LINEAGE.

R3G-B V1 REQUIRES THE CONJUNCTION:

exact required manifest digest
+ ordered immutable DiffIDs
+ exact derived image ChainID
+ exact containerd container snapshot key
+ exact bounded snapshot ancestry
+ exact stable live bundle/rootfs kernel mount
+ exact stable R3E runtime subject
+ exact stable R3F container binding
+ pinned read-only containerd client authority
+ durable acknowledged E3 source record

OR IT FAILS CLOSED.
```
