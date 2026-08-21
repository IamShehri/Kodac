# KODAC KDO H4-R4B — Trusted Gate Offline Artifact Package Authorization

Date: 2026-08-21
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — NO ARTIFACT BUILD / DOCKER AUTHORITY**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Authorize the smallest post-G0 artifact slice that can advance the trusted gVisor workload gate toward the concrete artifact identity required before any B1-v2 product integration.

This authorization candidate is deliberately narrower than B1-v2 and narrower than a Docker-local gate-image provisioning step.

Its future purpose is only to prove one **offline, deterministic, content-addressed gate artifact package** derived from the already-canonical G0 source bytes.

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

This authorization does not itself authorize compiler, test, tar, packaging, Docker, runsc, gVisor, or workload process execution.

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

Any source or G0-test byte change invalidates this authorization and requires a new G0 proof cycle before artifact packaging may continue.

---

## 5. What this slice may prove

Only after this authorization itself becomes canonical, a future separately executed artifact-proof slice may establish:

```text
exact canonical G0 source bytes
-> exact pinned build recipe
-> exact observed/pinned toolchain identity
-> sanitized and recorded build-context policy
-> two clean reproducible static builds
-> one exact static ELF gate binary identity
-> deterministic minimal payload layer
-> deterministic OCI image config
-> deterministic OCI image manifest
-> deterministic OCI image layout package
-> exact SHA-256 identities for every emitted object
-> deterministic implementationIdentity
```

The artifact package must remain inert data until a later separately authorized provisioning step.

---

## 6. Canonical package format and byte encoding

The future package must use exactly one package format version:

```text
KODAC_GATE_PACKAGE_FORMAT_VERSION=kodac-gate-oci-layout-v1
USTAR_CANONICALIZATION_PROFILE=kodac-ustar-v1
```

The format is a deterministic single-platform OCI image layout with exactly one uncompressed payload layer and no runnable defaults.

Required media types:

```text
IMAGE_INDEX_MEDIA_TYPE=application/vnd.oci.image.index.v1+json
IMAGE_MANIFEST_MEDIA_TYPE=application/vnd.oci.image.manifest.v1+json
IMAGE_CONFIG_MEDIA_TYPE=application/vnd.oci.image.config.v1+json
IMAGE_LAYER_MEDIA_TYPE=application/vnd.oci.image.layer.v1.tar
```

Compression is forbidden in v1:

```text
LAYER_COMPRESSION=none
PACKAGE_COMPRESSION=none
```

All JSON objects participating in trusted digests must use:

```text
UTF-8
NO_BOM
RFC_8785_JCS_CANONICALIZATION
NO_TRAILING_WHITESPACE
NO_TRAILING_NEWLINE_UNLESS_THE_CANONICAL_JSON_BYTES_REQUIRE_IT=NO
```

In other words, JSON digest bytes are exactly the RFC 8785 canonical UTF-8 bytes and contain no appended newline.

The OCI image layout must contain only purpose-equivalent entries:

```text
oci-layout
index.json
blobs/sha256/<exact manifest digest>
blobs/sha256/<exact config digest>
blobs/sha256/<exact uncompressed layer digest>
```

`oci-layout` must canonicalize exactly the structural value:

```json
{"imageLayoutVersion":"1.0.0"}
```

`index.json` must contain exactly one manifest descriptor and exactly one pinned Linux platform. Descriptor arrays have one element; therefore no alternate descriptor order is permitted.

The image manifest must contain:

```text
schemaVersion=2
mediaType=IMAGE_MANIFEST_MEDIA_TYPE
one exact config descriptor
one exact layer descriptor
```

The image config must contain only the structural fields required to bind the target platform and one rootfs layer, with executable defaults absent. `Entrypoint`, `Cmd`, `Env`, `WorkingDir`, `User`, `Volumes`, `StopSignal`, `Healthcheck`, `Shell`, `OnBuild`, and history-derived behavior are forbidden.

The payload layer is an uncompressed POSIX ustar archive with exactly one regular executable payload and **no explicit directory entries**. The outer package is an uncompressed POSIX ustar archive containing only the five OCI-layout files listed above and **no explicit directory entries**.

Both archives must obey the exact `kodac-ustar-v1` byte profile below:

```text
USTAR_ONLY=YES
PAX_HEADERS=FORBIDDEN
GNU_TAR_EXTENSIONS=FORBIDDEN
BASE256_NUMERIC_FIELDS=FORBIDDEN
SPARSE_ENTRIES=FORBIDDEN
XATTRS=FORBIDDEN
ACL_ENTRIES=FORBIDDEN
CAPABILITY_XATTRS=FORBIDDEN
DIRECTORY_ENTRIES=FORBIDDEN
PATHS_ARE_RELATIVE=YES
LEADING_SLASH=FORBIDDEN
DOT_OR_DOTDOT_PATH_COMPONENTS=FORBIDDEN
NAME_FIELD_UTF8_BYTES_MAX=100
PREFIX_FIELD=ALL_NUL_BYTES
USTAR_NAME_PREFIX_SPLITTING=FORBIDDEN
UID=0
GID=0
UNAME=""
GNAME=""
MTIME=0
GATE_FILE_MODE=0755
OUTER_REGULAR_FILE_MODE=0644
LEXICOGRAPHIC_ENTRY_ORDER=REQUIRED
SYMLINKS=FORBIDDEN
HARDLINKS=FORBIDDEN
DEVICE_NODES=FORBIDDEN
FIFO_SOCKET_ENTRIES=FORBIDDEN
```

Every archive pathname must fit completely in the 100-byte `name` field. The 155-byte `prefix` field must therefore be all NUL bytes. Path ordering is lexicographic over the exact UTF-8 pathname bytes. The one-entry payload layer consequently has exactly one header; the outer package has exactly five regular-file headers in lexicographic pathname-byte order.

For each 512-byte ustar header:

```text
name       = pathname bytes followed by NUL padding to 100 bytes
mode       = 7 ASCII octal digits followed by NUL
uid        = 7 ASCII octal digits followed by NUL
gid        = 7 ASCII octal digits followed by NUL
size       = 11 ASCII octal digits followed by NUL
mtime      = 11 ASCII octal digits followed by NUL
chksum     = 6 ASCII octal digits followed by NUL then ASCII space
typeflag   = ASCII '0'
linkname   = 100 NUL bytes
magic      = bytes "ustar\0"
version    = bytes "00"
uname      = 32 NUL bytes
gname      = 32 NUL bytes
devmajor   = 8 NUL bytes
devminor   = 8 NUL bytes
prefix     = 155 NUL bytes
header_pad = 12 NUL bytes
```

Numeric values must be left-zero-padded ASCII octal and must fit the field widths above. Alternative space-padding, base-256 encoding, signed numeric encoding, or alternate terminators are forbidden.

Checksum calculation is normative:

```text
1. Construct the complete 512-byte header with bytes 148..155 set to ASCII space (0x20).
2. Sum all 512 bytes as unsigned 8-bit byte values into an unsigned integer.
3. Encode that value as exactly six left-zero-padded ASCII octal digits.
4. Store those six digits at bytes 148..153, NUL at byte 154, ASCII space at byte 155.
```

For each regular file, the exact file bytes immediately follow its 512-byte header and are padded with zero bytes to the next 512-byte boundary. No padding bytes may appear between a header and its file bytes. Each archive terminates with **exactly two** all-zero 512-byte blocks and no trailing bytes after the second zero block.

The layer contains exactly the gate executable file and no explicit directories. The outer package contains exactly:

```text
blobs/sha256/<exact config digest>
blobs/sha256/<exact manifest digest>
blobs/sha256/<exact uncompressed layer digest>
index.json
oci-layout
```

No directory entry, additional blob, annotation sidecar, signature sidecar, provenance sidecar, or extra padding record may enter the trusted package bytes.

The future release manifest must record and the `implementationIdentity` must bind:

```text
KODAC_GATE_PACKAGE_FORMAT_VERSION
USTAR_CANONICALIZATION_PROFILE
all four media-type literals
JSON canonicalization identity
exact ustar numeric-field encoding
exact ustar checksum encoding/calculation
name/prefix policy
regular-file typeflag policy
directory-entry exclusion policy
file-data block-padding policy
exact two-block end-of-archive policy
layer archive format/header policy
outer package archive format/header policy
compression policy
descriptor cardinality/order policy
platform identity
payload path policy
```

Any alternate JSON encoding, ustar numeric/checksum encoding, path split, directory-entry policy, block padding, end-of-archive policy, archive header mode, compression mode, descriptor order, or package layout is a different artifact format and is not authorized by this v1 document.

---

## 7. No Docker daemon in the offline artifact slice

The future offline artifact proof must not call the Docker daemon or Docker CLI for build, import, load, registry, container, mount, or execution behavior.

Forbidden includes:

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
Docker Engine image-load/import APIs
Docker Engine container-create/start/attach APIs
```

Offline construction/inspection may use only bounded local process/file tooling when separate founder/current-session process authority explicitly permits it.

A later local-Docker provisioning/preflight gate must prove that the exact artifact resolves to the expected local Docker identity before B1-v2 is considered.

---

## 8. Build recipe requirements

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

The future release manifest must record the exact final command/recipe identity and every declared byte-affecting flag/input.

No dynamic fallback, caller-selected compiler flag, caller-selected source, caller-selected target, or ambient dependency discovery is allowed.

If the required exact toolchain is unavailable:

```text
ARTIFACT_RELEASE=BLOCKED
FALLBACK_BUILD=FORBIDDEN
```

---

## 9. Sanitized build context is mandatory

The future proof must not rely on ambient process state. A build-context policy must be recorded in the release manifest and bound into `implementationIdentity`.

At minimum the policy must require:

```text
SOURCE_DATE_EPOCH=0
LC_ALL=C
LANG=C
TZ=UTC
UMASK=0022
HOME=/nonexistent
CCACHE_DISABLE=1
PATH=<exact allowlisted pre-provisioned toolchain path set>
```

All compiler/tool flags are explicit recipe inputs.

The environment must be allowlist-based: undeclared variables are removed. At minimum these ambient override variables must be unset unless an exact value is explicitly authorized and identity-bound:

```text
GCC_EXEC_PREFIX
COMPILER_PATH
LIBRARY_PATH
CPATH
C_INCLUDE_PATH
CPLUS_INCLUDE_PATH
LD_LIBRARY_PATH
LD_PRELOAD
RUSTFLAGS
CFLAGS
CPPFLAGS
LDFLAGS
```

Each clean build must record:

```text
working directory
TMPDIR
resolved executable paths
sanitized environment bytes
umask
argv for every byte-producing tool
```

Build A and Build B must use distinct fresh physical directories. Their physical working-directory/TMPDIR pathnames are evidence, not trust identity; reproducibility across those distinct paths is required to prove that host-specific paths do not affect output bytes.

A deterministic `BUILD_CONTEXT_POLICY_IDENTITY` must bind the fixed environment policy, PATH policy, umask, tool argv policy, and the rule that only fresh-directory pathname values may differ between the two builds.

The evidence record must also bind exact observed context digests for Build A and Build B and prove each context conforms to the policy.

---

## 10. Toolchain identity is mandatory

A compiler version string alone is not sufficient.

The future release evidence must identify at least:

```text
compiler implementation and version
compiler executable SHA-256
linker implementation and version
linker executable SHA-256
static libc/runtime archive identities used by the link
binutils/readelf implementation/version and executable SHA-256
host architecture
target Linux architecture
all build flags
BUILD_CONTEXT_POLICY_IDENTITY
```

An immutable pre-provisioned build-environment digest may satisfy multiple toolchain entries only if it cryptographically binds the exact payloads and the proof independently demonstrates that no acquisition occurs during execution.

This authorization does not select, install, download, update, or acquire that toolchain.

---

## 11. Reproducibility theorem

The future artifact proof must perform at least two clean builds in distinct fresh directories from the same pinned source/toolchain/context policy and require exact byte identity.

Required result:

```text
BUILD_A_BINARY_SHA256 == BUILD_B_BINARY_SHA256
BUILD_A_BINARY_BYTES == BUILD_B_BINARY_BYTES
```

Package construction must independently run twice and require:

```text
LAYER_DIGEST_A == LAYER_DIGEST_B
CONFIG_DIGEST_A == CONFIG_DIGEST_B
MANIFEST_DIGEST_A == MANIFEST_DIGEST_B
INDEX_DIGEST_A == INDEX_DIGEST_B
PACKAGE_DIGEST_A == PACKAGE_DIGEST_B
```

A mismatch is a hard failure. It may not be normalized, ignored, or replaced by a single-build claim.

---

## 12. Static binary theorem must be re-proven on release bytes

The final artifact binary must independently satisfy:

```text
ELF executable
statically linked
PT_INTERP=ABSENT
DT_NEEDED=ABSENT
no script/shebang interpreter
no runtime shared-library dependency
```

The binary SHA-256 and byte size in the release manifest must refer to these exact inspected bytes.

The prior G0 proof-host binary hash is not automatically the release identity.

---

## 13. Minimal payload filesystem

The payload layer must contain only the trusted gate payload required for later image mounting.

Required properties:

```text
exactly one executable payload
regular file only
one fixed payload subtree
no helpers
no shell
no interpreter
no libraries
no configuration
no plugins
no package-manager state
no credentials
no mutable application data
no symlink/hardlink/device/FIFO/socket
no setuid/setgid
fixed metadata per §6
```

The exact payload subpath and executable relative path must be pinned by the release manifest before a positive verdict.

---

## 14. Image config grants no behavior

The artifact image exists only as a future read-only mounted filesystem source. It is not an authorized runnable workload image.

Executable/runtime defaults are forbidden, including:

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

Only deterministic structural platform/rootfs fields authorized by §6 may exist.

---

## 15. Manifest and implementation identity

The release manifest must be strict, versioned, reject unknown fields, and bind all concrete release facts into one deterministic implementation identity.

At minimum the identity preimage must include:

```text
gateProtocolVersion
canonical G0 source Git blob SHA
canonical G0 source SHA-256
canonical G0 test Git blob SHA
canonical G0 test SHA-256
release recipe identity
toolchain identity
BUILD_CONTEXT_POLICY_IDENTITY
target Linux architecture
binary SHA-256
binary byte size
ELF/static proof identity
KODAC_GATE_PACKAGE_FORMAT_VERSION
USTAR_CANONICALIZATION_PROFILE
media-type literals
JSON canonicalization identity
exact ustar numeric/checksum/path/padding/end-of-archive policy
payload layer digest
image config digest
image manifest digest
index digest
outer package digest
payload subpath
executable relative path
fixed future container mount target
```

Identity encoding is normative:

```text
IMPLEMENTATION_IDENTITY_DOMAIN=kodac-trusted-gate-implementation-v1
IMPLEMENTATION_IDENTITY_PREIMAGE=
  UTF8(IMPLEMENTATION_IDENTITY_DOMAIN)
  || 0x00
  || RFC8785_JCS_UTF8(<strict identity object>)
IMPLEMENTATION_IDENTITY=sha256(IMPLEMENTATION_IDENTITY_PREIMAGE)
```

No mutable tag, registry name, local filesystem pathname, wall-clock timestamp, random value, temporary directory, or host-specific absolute build path may act as trust authority.

---

## 16. Offline package is not local Docker identity proof

A successful offline artifact package may establish exact package/config/manifest/index digests, but it must not claim Docker has loaded or resolved those bytes.

Required negative statement:

```text
LOCAL_DOCKER_GATE_IMAGE_PRESENT=NOT_PROVEN
LOCAL_DOCKER_GATE_IMAGE_ID=NOT_OBSERVED
DOCKER_IMAGE_MOUNT_PREFLIGHT=NOT_PROVEN
```

A later separately authorized provisioning/preflight gate must bind the exact offline artifact identity to an exact locally resolved Docker image ID and descriptor before B1-v2 container create may be considered.

---

## 17. Complete no-egress boundary

The future artifact proof must run under a fail-closed no-egress boundary, not merely promise zero registry calls.

Required enforcement before any build/test/package proof process starts:

```text
NETWORK_EGRESS=DISABLED_AT_OS_BOUNDARY
REGISTRY_ACCESS=DISABLED
DNS_EGRESS=DISABLED
TELEMETRY_EGRESS=DISABLED
LICENSE_CHECK_EGRESS=DISABLED
CREDENTIAL_NETWORK_ACCESS=DISABLED
AMBIENT_UNIX_DOMAIN_SOCKETS=FORBIDDEN
INHERITED_SOCKET_FDS=0
DOCKER_ENGINE_ENDPOINT_STATE=ABSENT_OR_INACCESSIBLE
DOCKER_ENGINE_ENDPOINT_USABLE=NO
```

The proof environment must use an isolated network namespace or purpose-equivalent OS-enforced boundary with no route capable of external egress. Loopback must be disabled or outbound communication must be denied by an equivalent fail-closed policy.

Host-local IPC is part of the no-egress theorem. Before the first proof process starts, the evidence must establish that no Unix-domain socket FD is inherited and that ambient service sockets (including Docker/container-engine sockets, SSH-agent sockets, package-manager daemon sockets, telemetry/update sockets, and proxy sockets) are unavailable inside the proof boundary. `/var/run/docker.sock`, `/run/docker.sock`, and purpose-equivalent container-engine endpoints must be absent or inaccessible. Evidence must record whether each discovered endpoint is physically present and, independently, prove that no such endpoint is usable by any proof process.

The proof boundary must deny creation or connection of `AF_UNIX`/`AF_LOCAL` sockets by the proof processes unless a future authorization explicitly names an endpoint. This v1 authorization names **no** allowed Unix-domain endpoint.

The future evidence must include an audit proving that build/test/package processes performed no network-family or Unix-domain socket activity. At minimum the audit must account for:

```text
socket(AF_INET)
socket(AF_INET6)
socket(AF_PACKET)
socket(AF_UNIX)
socket(AF_LOCAL)
connect(AF_INET/AF_INET6)
connect(AF_UNIX/AF_LOCAL)
sendto
sendmsg
sendmmsg
write/writev to socket FDs
inherited socket FDs
DNS resolver activity
HTTP/HTTPS activity
registry client activity
telemetry/update/license-check activity
```

Required verdicts:

```text
NO_EGRESS_BOUNDARY_PROOF=PASS
NETWORK_SOCKET_AUDIT=PASS
UNIX_SOCKET_AUDIT=PASS
INHERITED_SOCKET_FD_PROOF=PASS
DOCKER_ENGINE_ENDPOINT_UNAVAILABLE_PROOF=PASS
REGISTRY_NETWORK_CALLS=0
GATE_IMAGE_PULL_CALLS=0
GATE_IMAGE_PUSH_CALLS=0
CREDENTIAL_REQUESTS=0
```

`NO_EGRESS_BOUNDARY_PROOF=PASS` is forbidden unless `NETWORK_SOCKET_AUDIT=PASS`, `UNIX_SOCKET_AUDIT=PASS`, `INHERITED_SOCKET_FD_PROOF=PASS`, and `DOCKER_ENGINE_ENDPOINT_UNAVAILABLE_PROOF=PASS` are all established on the same exact-head proof run.

If any required toolchain/dependency is absent, the proof blocks rather than fetching it.

---

## 18. Future implementation allowlist after canonical authorization

Only after this authorization PR is canonical, the future offline artifact implementation/evidence slice must modify and contain **exactly these three** new paths:

```text
1. packages/kodac-runtime/native/gvisor-workload-gate.release.json
2. packages/kodac-runtime/test/kdo-h4-r4b-gate-offline-artifact.test.ts
3. docs/planning/KODAC_KDO_H4_R4B_TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_EVIDENCE_2026-08-21.md
```

A positive artifact verdict requires all of:

```text
REQUIRED_FUTURE_PATHS_PRESENT=PASS
CHANGED_PATHS=EXACTLY_3_ALLOWLISTED_PATHS
NO_UNEXPECTED_PATHS=PASS
RELEASE_MANIFEST_PATH_PRESENT=PASS
OFFLINE_ARTIFACT_TEST_PATH_PRESENT=PASS
OFFLINE_ARTIFACT_EVIDENCE_PATH_PRESENT=PASS
REQUIRED_FUTURE_PATH_OBJECT_TYPES=REGULAR_BLOBS
REQUIRED_FUTURE_PATH_GIT_MODE=100644
REQUIRED_FUTURE_PATH_SYMLINKS=0
REQUIRED_FUTURE_PATH_GITLINKS=0
REQUIRED_FUTURE_PATH_RESOLUTION_PROOF=PASS
```

Each allowlisted path must be the exact repository path shown above, must resolve in the candidate Git tree directly to an ordinary Git blob with mode `100644`, and must not resolve through a symlink, gitlink/submodule, path alias, or alternate filesystem object. The proof must inspect repository object type/mode and resolved path rather than trusting pathname strings alone.

A subset of the three paths, a symlink/gitlink substitution, a non-regular object, or any alternate resolved path is not a complete artifact-proof candidate and must not receive `TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN`.

The canonical G0 source and G0 test are frozen read-only inputs:

```text
packages/kodac-runtime/native/gvisor-workload-gate.c
packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
```

No other path is authorized.

In particular, no future offline artifact slice may modify:

```text
Dockerfiles
GitHub workflows
package-manager manifests such as package.json/pyproject.toml
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

The allowlisted `packages/kodac-runtime/native/gvisor-workload-gate.release.json` is the trusted **release manifest** defined by this authorization and is explicitly not included in the `package-manager manifests` prohibition above.

---

## 19. Process execution authority remains separately constrained

This docs-only authorization does not itself authorize compiler/test/tar/packaging process execution.

After this authorization becomes canonical, repository mutation authority may exist only for the three future allowlisted paths. The canonical G0 source/test remain frozen.

Until separate live founder/current-session process authority is explicit and authenticated:

```text
FUTURE_ALLOWLISTED_PATH_MUTATION_AFTER_CANONICAL_AUTH=MAY_BE_ALLOWED
CANONICAL_G0_SOURCE_AND_TEST_MUTATION=FORBIDDEN
OFFLINE_ARTIFACT_BUILD_EXECUTION=NOT_GRANTED_BY_THIS_DOCS_PR
OFFLINE_ARTIFACT_TEST_EXECUTION=NOT_GRANTED_BY_THIS_DOCS_PR
OFFLINE_ARTIFACT_PACKAGE_EXECUTION=NOT_GRANTED_BY_THIS_DOCS_PR
DOCKER_EXECUTION=NO
GVISOR_EXECUTION=NO
WORKLOAD_EXECUTION=NO
```

A future artifact-proof run may not derive process authority from a self-authored record, from a hash alone, or from text introduced by the artifact candidate PR. Before any build/test/package process executes, a separate canonical predecessor must already establish an external founder-authentication trust root and its verification mechanism. The trust-root record must predate the candidate artifact branch/head and must not be one of the three candidate paths.

The retained process-authority record must then bind at least:

```text
PROCESS_AUTHORITY_STATUS=EXPLICITLY_GRANTED
PROCESS_AUTHORITY_SCOPE=OFFLINE_ARTIFACT_BUILD_TEST_PACKAGE_ONLY
PROCESS_AUTHORITY_PROVENANCE=FOUNDER_CURRENT_SESSION
PROCESS_AUTHORITY_TRUST_ROOT_ID=<separately canonical external trust-root identity>
PROCESS_AUTHORITY_TRUST_ROOT_COMMIT=<canonical ancestor commit that predates the candidate head>
PROCESS_AUTHORITY_AUTHENTICATION_PROOF=<offline-verifiable authenticated proof under that trust root>
PROCESS_AUTHORITY_SESSION_ID=<fresh opaque session identifier>
PROCESS_AUTHORITY_SESSION_NONCE=<fresh non-replayed nonce>
PROCESS_AUTHORITY_ISSUED_AT_UTC=<issued timestamp>
PROCESS_AUTHORITY_EXPIRES_AT_UTC=<expiry timestamp>
PROCESS_AUTHORITY_REPOSITORY=TheHalfMoon/Kodac
PROCESS_AUTHORITY_EXACT_HEAD=<exact artifact candidate head SHA>
PROCESS_AUTHORITY_COMMAND_MANIFEST_SHA256=<sha256 of exact authorized executable/argv/process-tree manifest>
PROCESS_AUTHORITY_RECORD_SHA256=<sha256 of the exact retained authenticated authority record>
```

The command manifest bound by `PROCESS_AUTHORITY_COMMAND_MANIFEST_SHA256` must enumerate the exact executable identities/paths, argv, working-directory policy, environment policy, and every allowed child-process edge for the offline build/test/package proof. Undeclared executables, argv widening, shell indirection, extra children, daemonization, or execution outside that process tree is unauthorized.

The offline artifact test must verify, not merely record, all of the following before process execution:

```text
PROCESS_AUTHORITY_TRUST_ROOT_PROOF=PASS
PROCESS_AUTHORITY_AUTHENTICATION_PROOF=PASS
PROCESS_AUTHORITY_SESSION_FRESHNESS_PROOF=PASS
PROCESS_AUTHORITY_NONCE_REPLAY_PROOF=PASS
PROCESS_AUTHORITY_REPOSITORY_BINDING_PROOF=PASS
PROCESS_AUTHORITY_EXACT_HEAD_BINDING_PROOF=PASS
PROCESS_AUTHORITY_COMMAND_SCOPE_PROOF=PASS
PROCESS_AUTHORITY_PROCESS_TREE_BINDING_PROOF=PASS
```

The trust root may not be supplied or replaced by the artifact candidate itself. If no separately canonical trust root/verifier exists, or if authenticated founder/current-session evidence cannot be verified offline, then process authority is **not proven** and the artifact proof remains blocked. This authorization does not choose, generate, install, rotate, or distribute a trust root.

The attestation and its session metadata are authorization provenance only; they are excluded from `implementationIdentity` because authorization/session state is not artifact identity.

The required machine-checkable gate is:

```text
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=PASS
```

That verdict may be emitted only when every authentication, freshness, exact-head, repository, command-scope, and process-tree proof above passes against the separately canonical trust root. If any required authority field/proof is absent, stale, replayed, self-authored, scoped too broadly, bound to another repository/head, or does not include the exact offline build/test/package process tree used by the proof, then:

```text
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=FAIL
ARTIFACT_RELEASE=BLOCKED
```

If process execution is prohibited or authenticated authority cannot be established, the future artifact PR must remain unmerged rather than fabricate evidence or weaken the theorem.

---

## 20. Required future proof matrix

A future offline artifact candidate must prove at least:

```text
canonical source blob/hash exact match
canonical G0 test blob/hash unchanged
REQUIRED_FUTURE_PATHS_PRESENT=PASS
CHANGED_PATHS=EXACTLY_3_ALLOWLISTED_PATHS
NO_UNEXPECTED_PATHS=PASS
REQUIRED_FUTURE_PATH_OBJECT_TYPES=REGULAR_BLOBS
REQUIRED_FUTURE_PATH_GIT_MODE=100644
REQUIRED_FUTURE_PATH_RESOLUTION_PROOF=PASS
release manifest strict validation
unknown release-manifest fields rejected
invalid/mutable identity fields rejected
PROCESS_AUTHORITY_TRUST_ROOT_PROOF=PASS
PROCESS_AUTHORITY_AUTHENTICATION_PROOF=PASS
PROCESS_AUTHORITY_SESSION_FRESHNESS_PROOF=PASS
PROCESS_AUTHORITY_NONCE_REPLAY_PROOF=PASS
PROCESS_AUTHORITY_REPOSITORY_BINDING_PROOF=PASS
PROCESS_AUTHORITY_EXACT_HEAD_BINDING_PROOF=PASS
PROCESS_AUTHORITY_COMMAND_SCOPE_PROOF=PASS
PROCESS_AUTHORITY_PROCESS_TREE_BINDING_PROOF=PASS
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=PASS
PACKAGE_FORMAT_CANONICALIZATION_PROOF=PASS
MEDIA_TYPE_AND_DESCRIPTOR_PROOF=PASS
CANONICAL_JSON_BYTES_PROOF=PASS
CANONICAL_USTAR_BYTES_PROOF=PASS
BUILD_CONTEXT_POLICY_PROOF=PASS
BUILD_A_CONTEXT_CONFORMANCE=PASS
BUILD_B_CONTEXT_CONFORMANCE=PASS
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
layer/config/manifest/index/package digests deterministic
implementationIdentity deterministic
source-byte mutation rejected
NO_EGRESS_BOUNDARY_PROOF=PASS
NETWORK_SOCKET_AUDIT=PASS
UNIX_SOCKET_AUDIT=PASS
INHERITED_SOCKET_FD_PROOF=PASS
DOCKER_ENGINE_ENDPOINT_UNAVAILABLE_PROOF=PASS
network/registry acquisition absent
Docker daemon interaction absent
```

All positive evidence must bind one exact repository head.

---

## 21. Threat model

The future proof must explicitly defend against:

- rebuilding from source/test bytes different from canonical G0;
- omitting one of the three required artifact-proof paths while claiming a complete verdict;
- replacing an allowlisted path with a symlink, gitlink/submodule, non-regular Git object, or alternate resolved path;
- unpinned compiler/linker/static runtime inputs;
- ambient compiler/include/library override variables;
- hidden timestamps, locale, timezone, umask, PATH, working directory, or TMPDIR dependence;
- dynamic loader/interpreter reintroduction;
- extra files/tools entering the payload;
- executable image config fields becoming hidden authority;
- ambiguous/noncanonical JSON encoding;
- alternate media types or descriptor order;
- ustar numeric-field, checksum, pathname split, directory-entry, block-padding, end-of-archive, ownership, timestamp, path-order, PAX, GNU-extension, or compression nondeterminism;
- symlink/hardlink path substitution;
- caller-selected payload paths or mount targets;
- mutable tags or registry names becoming trust identity;
- DNS, telemetry, update, license-check, registry, or other build-time egress;
- ambient AF_UNIX/AF_LOCAL endpoints or inherited socket FDs bypassing the IP no-egress boundary;
- Docker/container-engine daemon access through a host-local socket that is physically present but intended to be inaccessible;
- artifact digest computed over bytes different from inspected bytes;
- one-build-only reproducibility claims;
- self-authored, self-signed, stale, replayed, wrong-repository, or wrong-head process-authority records;
- process authority that does not bind the exact executable/argv/child-process tree;
- process execution performed without authenticated founder/current-session scope authority;
- confusing an offline digest with an observed local Docker image ID;
- treating artifact proof as B1-v2/B2A-v2/B2B authority.

---

## 22. Maximum future verdict

If every future offline artifact gate is proven, the strongest permitted verdict is:

```text
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN
```

It means only that one exact deterministic static gate package and its content identities are proven from frozen G0 bytes under the recorded build/toolchain/package theorem.

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

## 23. Merge gate for the future offline artifact implementation PR

A future implementation/evidence PR may merge only if all gates are proven on its exact head:

```text
REQUIRED_FUTURE_PATHS_PRESENT=PASS
CHANGED_PATHS=EXACTLY_3_ALLOWLISTED_PATHS
NO_OUT_OF_SCOPE_PATHS=PASS
NO_UNEXPECTED_PATHS=PASS
RELEASE_MANIFEST_PATH_PRESENT=PASS
OFFLINE_ARTIFACT_TEST_PATH_PRESENT=PASS
OFFLINE_ARTIFACT_EVIDENCE_PATH_PRESENT=PASS
REQUIRED_FUTURE_PATH_OBJECT_TYPES=REGULAR_BLOBS
REQUIRED_FUTURE_PATH_GIT_MODE=100644
REQUIRED_FUTURE_PATH_RESOLUTION_PROOF=PASS
CANONICAL_G0_SOURCE_BYTES_UNCHANGED=PASS
CANONICAL_G0_TEST_BYTES_UNCHANGED=PASS
PROCESS_AUTHORITY_TRUST_ROOT_PROOF=PASS
PROCESS_AUTHORITY_AUTHENTICATION_PROOF=PASS
PROCESS_AUTHORITY_SESSION_FRESHNESS_PROOF=PASS
PROCESS_AUTHORITY_NONCE_REPLAY_PROOF=PASS
PROCESS_AUTHORITY_REPOSITORY_BINDING_PROOF=PASS
PROCESS_AUTHORITY_EXACT_HEAD_BINDING_PROOF=PASS
PROCESS_AUTHORITY_COMMAND_SCOPE_PROOF=PASS
PROCESS_AUTHORITY_PROCESS_TREE_BINDING_PROOF=PASS
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=PASS
PACKAGE_FORMAT_CANONICALIZATION_PROOF=PASS
BUILD_CONTEXT_POLICY_PROOF=PASS
TOOLCHAIN_IDENTITY_PROOF=PASS
TWO_BUILD_REPRODUCIBILITY=PASS
STATIC_BINARY_PROOF=PASS
OFFLINE_PACKAGE_STRUCTURE_PROOF=PASS
IMAGE_CONFIG_NO_AUTHORITY_PROOF=PASS
CONTENT_DIGEST_PROOF=PASS
IMPLEMENTATION_IDENTITY_PROOF=PASS
NO_EGRESS_BOUNDARY_PROOF=PASS
NETWORK_SOCKET_AUDIT=PASS
UNIX_SOCKET_AUDIT=PASS
INHERITED_SOCKET_FD_PROOF=PASS
DOCKER_ENGINE_ENDPOINT_UNAVAILABLE_PROOF=PASS
NETWORK_REGISTRY_ZERO_PROOF=PASS
DOCKER_DAEMON_ZERO_PROOF=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

The merge gate must fail closed if authenticated process-authority evidence is absent or invalid, if the separately canonical trust root cannot be verified, if any of the three required paths is absent or is not a direct regular Git blob at the exact repository path, if any unexpected path is present, or if a Docker/container-engine endpoint remains usable. No gate may be waived because the artifact is "only packaging".

---

## 24. Merge gate for this docs-only authorization PR

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

If canonical main moves, the exact base and predecessor conclusions must be reconciled before merge.

---

## 25. Explicit non-grants

Nothing in this authorization grants:

```text
artifact build during this docs PR
artifact proof process execution during this docs PR
Docker build/load/pull/push/import
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

## 26. Authorization verdict

If and only if this docs-only authorization becomes canonical:

```text
NEXT_POST_G0_SLICE=
TRUSTED GATE OFFLINE ARTIFACT PACKAGE PROOF

FUTURE_RELEASE_PATH_ALLOWLIST=EXACTLY_3_REQUIRED_REGULAR_BLOBS
CANONICAL_G0_SOURCE_MUTATION=FORBIDDEN
CANONICAL_G0_TEST_MUTATION=FORBIDDEN
KODAC_GATE_PACKAGE_FORMAT_VERSION=kodac-gate-oci-layout-v1
USTAR_CANONICALIZATION_PROFILE=kodac-ustar-v1
DOCKER_DAEMON_USE_IN_OFFLINE_SLICE=FORBIDDEN
NETWORK_EGRESS_IN_OFFLINE_SLICE=FORBIDDEN
UNIX_DOMAIN_SOCKET_USE_IN_OFFLINE_SLICE=FORBIDDEN
AUTHENTICATED_PROCESS_AUTHORITY_TRUST_ROOT=SEPARATE_CANONICAL_PREREQUISITE
CURRENT_SESSION_PROCESS_AUTHORITY=SEPARATE_REQUIRED_AUTHENTICATED_GATE

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

This slice keeps post-G0 progression fail-closed: first establish a separately canonical founder-authentication trust root before any proof-process authority can be accepted, then prove exact canonical offline artifact bytes under authenticated exact-head/process-bound authority, then separately prove local Docker provisioning/identity, and only after those prerequisites may a future B1-v2 authorization be considered.