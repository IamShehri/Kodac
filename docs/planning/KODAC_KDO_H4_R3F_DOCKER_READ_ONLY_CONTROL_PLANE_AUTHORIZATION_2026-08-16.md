# KDO-H4-R3F — Docker Read-Only Container Binding / E2 Control-Plane Snapshot Authorization

Date: 2026-08-16
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `5324dca0d2c81caac5a4dcb1b0163b8e32c0f3b5`
Canonical base tree: `cfdefd58b06509ae8b493b094b59df7a3fdd65bb`
Predecessor: canonical/proven H4-R3E K2 gVisor exact-instance binding

## 1. Decision

```text
GATE:
KDO-H4-R3F

NAME:
DOCKER READ-ONLY CONTAINER BINDING / E2 CONTROL-PLANE SNAPSHOT

CHANGE CLASS:
DOCS-ONLY AUTHORIZATION

IMPLEMENTATION IN THIS PR:
NONE

DOCKER ENGINE READ AUTHORITY AFTER THIS AUTHORIZATION BECOMES CANONICAL:
NARROWLY AUTHORIZABLE BY THE R3F IMPLEMENTATION SLICE ONLY

DOCKER MUTATION AUTHORITY:
NONE

R3B PHYSICAL OBSERVATION / EVIDENCE MINTING:
FORBIDDEN

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

R3F deliberately refines the purpose-equivalent next candidate named by R3E.

The earlier candidate wording included “Physical Policy Observation”. R3F rejects that wording as too broad for this slice. Docker Engine inspection can provide strong **E2 trusted control-plane evidence**, but it does not by itself prove host physical enforcement.

The governing R3F theorem is:

```text
DOCKER CONTROL-PLANE SNAPSHOT
!= PHYSICAL ENFORCEMENT PROOF
```

R3F therefore authorizes the smallest provider needed to supply R3E with one exact Docker container binding while preserving a deterministic E2 snapshot for later physical-proof conjunction.

---

## 2. Canonical predecessor truth

Canonical `main` at this authorization base is:

```text
5324dca0d2c81caac5a4dcb1b0163b8e32c0f3b5
```

with tree:

```text
cfdefd58b06509ae8b493b094b59df7a3fdd65bb
```

Canonical R3E closure:

```text
docs/planning/KODAC_KDO_H4_R3E_CANONICAL_CLOSURE_2026-08-16.md
blob 4d5d872bfcc159afe5d426d2b4bb369fe5301d28
```

R3E permits the bounded canonical claim:

```text
KODAC_K2_GVISOR_OBSERVER_EXACT_INSTANCE_BINDING_PROVEN
```

Meaning only that K2 can bind a validated gVisor execution requirement to one trusted E2 full-container subject and one same-FD-verified runsc/helper observation bracket, producing durable E3 integrated runtime-lineage evidence without minting R3B physical backend evidence.

R3E explicitly does not authorize Docker Engine access, container lifecycle mutation, physical source/network/resource proof, TTL/output enforcement, R3B observation minting, or external-process `ask`.

R3F must preserve all of those boundaries.

---

## 3. R3C evidence-quality rules remain controlling

Canonical R3C established:

```text
E0 = untrusted guest/workload claim
E1 = desired/declarative configuration
E2 = trusted host control-plane observation
E3 = trusted host physical/runtime state candidate
E4 = accepted Kodac physical proof
```

It also established:

```text
Docker HostConfig.Runtime=runsc alone != physical gVisor proof
Docker NetworkMode=none alone != physical deny-all proof
Docker configured resource values alone != physical enforcement proof
```

R3F does not weaken those rules.

Every Docker fact produced by R3F remains explicitly:

```text
E2-Docker-Control-Plane
```

No R3F type may be structurally assignable to `SandboxBackendObservation` or `SandboxExecutionEvidence`.

---

## 4. Source pins

### 4.1 Moby / Docker Engine

R3F studies the Docker Engine implementation/API at this exact pin:

```text
repository:
moby/moby

commit:
d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3

tree:
7da5bb1abb032eba4d512d46421ba73d986354c4

license:
Apache-2.0

root license blob:
6d8d58fb676bbbcc9b4432da4951e4b438478306
```

Primary pinned references:

```text
daemon/list.go
4bac1ecd25611a03cc14eb5f22f20c6929bf58b6

# accepted list filters include label and status


daemon/inspect.go
37f442915a524bf833a0f4bc3597513f62b1417a

# container inspect populates ID, State, Image, RestartCount,
# HostConfig, Config, NetworkSettings and ImageManifestDescriptor


daemon/server/router/container/inspect.go
73c7f8a12d4438474e2a898f8fe2ff8ad917fe7f

# API versions below 1.48 explicitly suppress ImageManifestDescriptor


api/types/container/container.go
bffb3de87277cfa68ea985563e8453cb51b53a01

# InspectResponse includes ImageManifestDescriptor as the descriptor of the
# platform-specific manifest used to create the container


api/types/container/hostconfig.go
0f889c65124c6caac05a61b835ec0bba9c987cc3

# HostConfig carries NetworkMode, runtime and resource configuration
```

### 4.2 Docker documentation

R3F preserves the canonical R3C Docker documentation pin:

```text
repository:
docker/docs

commit:
3a9d778562f39bcc0be46255b013c6a3ca526244

tree:
2be0c31bf78b2f121043d805f23a64dd94698ec2

license:
Apache-2.0
```

Primary references:

```text
content/manuals/engine/network/drivers/none.md
d0715b1ff4f388c413b1fc18d85c9d71c67c22b7

content/manuals/engine/containers/resource_constraints.md
76df2f43cdadd39cc5b750fcbac14423a8a3ffa6
```

The resource-constraints source establishes two exact semantics used by R3F validation:

```text
--cpus is a CPU-capacity ceiling

--memory-swap == --memory
with positive --memory
means no container swap access
```

### 4.3 Intake mode

```text
STUDY + REIMPLEMENT
```

R3F copies no Moby/Docker implementation source and adds no Docker SDK dependency.

`THIRD_PARTY_NOTICES.md` is therefore not an implementation path for this slice.

---

## 5. API floor and compatibility posture

R3F v1 uses exactly:

```text
Docker Engine API v1.48
```

Reason:

Pinned Moby `getContainersByName` explicitly sets `ImageManifestDescriptor = nil` for API versions below `1.48`.

R3F requires the container’s platform-specific image manifest descriptor to bind the R3A immutable source digest to the exact Docker container.

Therefore:

```text
API < 1.48:
FAIL CLOSED / R3F UNAVAILABLE
```

R3F does not negotiate upward to a moving latest API. It uses a fixed versioned path so the trusted response contract remains stable:

```text
/v1.48/...
```

A daemon that does not support that API path is unavailable for R3F.

---

## 6. Exact Docker Engine request allowlist

R3F production code may issue exactly two Docker Engine request shapes:

```text
1. GET /v1.48/containers/json?all=1&filters=<canonical-R3F-filter>

2. GET /v1.48/containers/<FULL_64_LOWERHEX_ID>/json?size=0
```

No third Engine endpoint is authorized.

The following are explicitly unauthorized:

```text
POST /containers/create
POST /containers/*/start
POST /containers/*/stop
POST /containers/*/kill
POST /containers/*/restart
POST /containers/*/exec
POST /exec/*
DELETE /containers/*
POST /images/create
DELETE /images/*
GET /containers/*/logs
GET /containers/*/stats
GET /events
GET /containers/*/top
GET /containers/*/archive
PUT /containers/*/archive
GET /containers/*/changes
POST /containers/*/wait
registry endpoints
plugin endpoints
swarm endpoints
build endpoints
```

No generic exported “Docker request” or arbitrary method/path primitive may be introduced.

---

## 7. Socket authority model

Docker socket access is host-sensitive authority even when R3F issues only GET requests.

R3F must therefore keep socket authority inside trusted host configuration.

The public R3E binding request may not contain:

```text
socket path
Docker host
URL
TCP endpoint
SSH endpoint
named pipe
HTTP path
HTTP method
container ID
container name
Docker filters
```

R3F may accept a **trusted-host-only configuration** at provider construction time for a canonical absolute POSIX Unix-socket path so tests/rootless-host integration remain possible.

Production policy must not derive the endpoint from:

```text
DOCKER_HOST
HTTP_PROXY
HTTPS_PROXY
ALL_PROXY
NO_PROXY
caller environment
model input
plugin input
MCP input
workload fields
```

R3F v1 authorizes only a local POSIX Unix-domain socket.

TCP, TLS, SSH, Windows named pipe and remote Docker hosts are out of scope.

---

## 8. Socket endpoint identity

Before the provider becomes usable, R3F must `lstat` the configured socket path and require a real Unix socket rather than a symlink or regular file.

The trusted endpoint snapshot must bind at minimum canonical decimal values for:

```text
device
inode
uid
gid
mode
```

The provider freezes this socket endpoint identity for its lifetime.

Before and after each authorized Docker request, R3F must re-`lstat` the socket path and require the same endpoint identity.

Any socket replacement, symlink substitution, type change, ownership change, or metadata ambiguity fails closed.

This is an **endpoint-identity theorem**, not a Docker daemon binary-identity theorem.

R3F does not claim to prove the exact daemon executable bytes.

---

## 9. Discovery labels

R3F defines fixed versioned discovery labels purpose-equivalent to:

```text
io.kodac.binding-version
io.kodac.requirement-identity
io.kodac.workload-identity
```

with exact binding version:

```text
kodac-h4-r3f-docker-binding-v1
```

R3F itself is read-only and does **not** set these labels.

A future separately authorized lifecycle/creation provider may set them.

For R3F, the labels are trusted control-plane **selectors**, not physical proof.

The list filter is deterministically derived only from:

```text
fixed binding-version label
validated R3E request.requirementIdentity
validated R3E request.workloadIdentity
status=running
```

No arbitrary caller-provided label/filter expression is admitted.

---

## 10. Execution-attempt identity must not be a discovery label

R3E creates `executionAttemptIdentity` at observation-attempt time.

A pre-existing Docker container therefore cannot have been created with that exact R3E observation-attempt identity.

R3F MUST NOT pretend otherwise.

Discovery is based on the stable canonical identities that predate observation:

```text
requirementIdentity
workloadIdentity
```

After R3F resolves one exact full container ID, it creates the R3E `GvisorContainerBinding` that binds that container ID to the current R3E `executionAttemptIdentity`.

This distinction prevents a false historical-lineage claim.

---

## 11. Exact candidate cardinality

The filtered container list must resolve to exactly one running candidate.

```text
0 candidates:
FAIL CLOSED

1 candidate:
CONTINUE TO EXACT INSPECT

2+ candidates:
FAIL CLOSED / AMBIGUOUS SUBJECT
```

No “first”, “newest”, “oldest”, name, prefix, partial ID, or heuristic tie-breaker is authorized.

The list response is only a subject-discovery step.

The exact full-ID inspect is authoritative for the R3F E2 snapshot.

---

## 12. Full container ID rule

R3F accepts only:

```text
^[0-9a-f]{64}$
```

for Docker container IDs.

Abbreviated IDs are forbidden in both internal records and the exact inspect path.

The caller never supplies the container ID.

---

## 13. Exact inspect identity checks

The exact inspect response must satisfy at minimum:

```text
InspectResponse.ID == selected full 64-lowerhex container ID

Config.Labels[io.kodac.binding-version]
== kodac-h4-r3f-docker-binding-v1

Config.Labels[io.kodac.requirement-identity]
== request.requirementIdentity

Config.Labels[io.kodac.workload-identity]
== request.workloadIdentity
```

Missing, duplicate, conflicting or malformed identity data fails closed.

Container name is diagnostic only and must not participate in subject identity.

---

## 14. Running-state and restart checks

R3F v1 accepts only a currently running, non-transitioning first-life container:

```text
State.Running == true
State.Paused == false
State.Restarting == false
State.Dead == false
RestartCount == 0
HostConfig.RestartPolicy.Name == "no"
```

A positive Docker-reported PID may be retained as E2 diagnostics but MUST NOT be used as R3E/R3D physical process identity.

R3E’s runsc/process bracket remains the physical runtime-lineage theorem.

---

## 15. Immutable source-digest binding

R3A source authority is:

```text
workload.source.digest = sha256:<64 lowercase hex>
```

R3F requires:

```text
InspectResponse.ImageManifestDescriptor != null
InspectResponse.ImageManifestDescriptor.Digest
== workload.source.digest
```

R3F MUST NOT substitute:

```text
InspectResponse.Image
Config.Image
RepoTags
RepoDigests
container name
image tag
repository string alone
```

for this comparison.

Pinned Moby defines `ImageManifestDescriptor` as the descriptor of the platform-specific manifest used to create the container.

This is strong E2 source binding to the Docker container, but R3F does not promote it to E4 physical root-filesystem proof.

---

## 16. Runtime control-plane check

R3F v1 is gVisor-specific and requires:

```text
HostConfig.Runtime == "runsc"
```

Any empty/default/runc/different runtime value fails closed.

This value is E2 control-plane evidence only.

Physical same-artifact runsc proof remains R3E.

R3F does not mint `observedSemanticRuntimeClass = gvisor` in an R3B observation.

---

## 17. Deny-all network control-plane check

R3A v1 requires:

```text
network mode = deny-all
```

R3F requires the Docker control plane to report:

```text
HostConfig.NetworkMode == "none"
```

Any bridge, host, container-sharing, user-defined or other mode fails closed.

This is E2 control-plane evidence only.

R3F does not claim that inspecting `NetworkMode=none` physically proves the exact execution instance has no non-loopback authority.

A later physical observer must earn that theorem independently.

---

## 18. CPU control-plane check

Canonical R3C defines:

```text
cpuMillis = milliCPU capacity units
1000 cpuMillis = 1 logical CPU capacity ceiling
```

R3F v1 chooses one exact Docker representation:

```text
HostConfig.NanoCpus
== workload.resourcePolicy.cpuMillis * 1_000_000
```

No alternative `CPUPeriod`/`CPUQuota` equivalence is accepted by R3F v1.

Reason:

A single representation avoids normalization ambiguity in the first provider slice.

The multiplication remains inside JavaScript safe-integer range under the canonical R3A ceiling.

This is E2 configured/effective Docker control-plane state, not physical cgroup enforcement proof.

---

## 19. Memory and swap control-plane check

R3F v1 requires:

```text
HostConfig.Memory
== workload.resourcePolicy.memoryBytes

HostConfig.MemorySwap
== workload.resourcePolicy.memoryBytes
```

Pinned Docker documentation states that equal positive memory and memory-swap values prevent container swap access.

R3F therefore rejects:

```text
MemorySwap = 0
MemorySwap = -1
MemorySwap > Memory
MemorySwap < Memory
missing/ambiguous memory values
```

This is still E2 control-plane state.

R3F does not claim cgroup memory enforcement proof.

---

## 20. Privileged-mode guardrail

R3F must reject:

```text
HostConfig.Privileged == true
```

This is a fail-closed safety guardrail, not a new R3A identity field and not an R3B proof claim.

The first Docker binding provider should never bind a privileged container into the trusted gVisor evidence path.

---

## 21. TTL ownership remains unresolved by R3F

R3A `ttlMs` requires a maximum wall-clock execution lifetime whose expiry causes fail-closed termination/revocation under an authorized owner.

Docker inspect does not prove that theorem.

R3F authorizes no timer, stop, kill, remove, wait or lifecycle operation.

Therefore:

```text
R3F TTL OBSERVATION:
UNPROVEN

supportsTtlObservation:
MUST NOT BE MINTED TRUE FROM R3F
```

TTL/lifecycle ownership requires a later separately authorized slice.

---

## 22. Output-bound ownership remains unresolved by R3F

R3A `maxOutputBytes` requires a bounded aggregate output theorem.

R3F authorizes no Docker logs, attach, exec, stream or output operation.

Therefore:

```text
R3F OUTPUT-LIMIT OBSERVATION:
UNPROVEN

supportsOutputLimitObservation:
MUST NOT BE MINTED TRUE FROM R3F
```

A later execution/lifecycle slice must own bounded stdout/stderr semantics.

---

## 23. No R3B physical fact may be minted

R3F MUST NOT import or call constructors that mint:

```text
SandboxBackendObservation
SandboxExecutionEvidence
```

from its Docker snapshot.

In particular, R3F alone may not set any R3B physical observation field as authoritative:

```text
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicy
observedResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
observationIdentity
evidenceIdentity
```

The E2 snapshot is a future conjunction input, not the final proof object.

---

## 24. R3F durable typed record

R3F may define one immutable typed E2 record version purpose-equivalent to:

```text
kodac-h4-r3f-docker-control-plane-v1
```

with evidence class:

```text
e2-docker-control-plane
```

It should bind at minimum:

```text
version
evidenceClass
providerId
apiVersion
socketEndpointIdentity
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerId
bindingIdentity
imageManifestDigest
runtimeName
networkMode
nanoCpus
memoryBytes
memorySwapBytes
restartCount
restartPolicy
controlPlaneObservationIdentity
```

The record must be deterministic, immutable and validated by reconstruction.

No timestamp is required in its identity.

---

## 25. R3E resolver integration without gateway mutation

Canonical R3E already defines:

```text
GvisorObserverRuntimeConfig.resolveContainerBinding(
  request: GvisorContainerBindingRequest,
  options: { signal?: AbortSignal }
)
```

R3F must implement a provider/adapter that can satisfy that existing callback contract.

R3F therefore does **not** require a new `ExecutionGateway` method and does not require mutation of `gateway.ts`.

The provider creates a validated `GvisorContainerBinding` using:

```text
fixed/trusted providerId
request.executionAttemptIdentity
request.requirementIdentity
request.workloadIdentity
resolved full containerId
```

This keeps Docker discovery subordinate to the already-canonical K2/R3E authority surface.

---

## 26. Provider identity

R3F provider/observer identity must deterministically bind at minimum:

```text
R3F contract version
Docker API version 1.48
fixed discovery-label names
binding protocol version
socket endpoint identity
normalization version
Moby source-study pin
```

The provider identity must not be caller-selected.

Changing socket endpoint identity or protocol version must change provider/observer identity.

---

## 27. Bounded HTTP transport

R3F must use a dedicated local Unix-socket HTTP transport with all of the following:

```text
method fixed to GET
no shell
no subprocess
no redirect following
no proxy
no caller headers
no caller path
explicit timeout
AbortSignal support
bounded response headers
bounded response body
connection closed/cleaned on abort/failure
```

Recommended initial ceilings:

```text
list response body <= 262144 bytes
inspect response body <= 1048576 bytes
response headers <= 16384 bytes
JSON depth <= 64
list items <= 16
```

The public caller cannot raise these ceilings.

---

## 28. Strict JSON parsing

Docker daemon responses cross a privileged trust boundary and must be parsed defensively.

R3F may reimplement a small bounded JSON syntax validator similar in principle to the canonical R3D duplicate-key guard, but MUST NOT modify the canonical R3D module merely to export its private parser.

R3F parsing must reject at minimum:

```text
duplicate object keys
trailing JSON content
invalid escapes/control characters
oversized body
excessive nesting
oversized arrays/objects/strings
non-finite/unsafe numeric fields where exact integers are required
unexpected top-level shape
```

No new JSON parsing dependency is authorized.

---

## 29. Canonical response shape validation

R3F must not deserialize Docker responses into permissive `any` and trust nested values implicitly.

It must validate only the exact bounded subtrees needed for the R3F theorem and reject hostile proxy/accessor/non-plain structures after parsing/reconstruction where applicable.

Unknown extra Docker response fields may be ignored only after the required subtree has been strictly validated and the raw response stayed inside protocol bounds.

No unknown field may become authority.

---

## 30. Read-only means no hidden mutation

The implementation must contain no production call path capable of emitting:

```text
POST
PUT
PATCH
DELETE
```

to the Docker socket.

It also must not use a Docker SDK/client object that exposes mutation methods behind a generic interface.

R3F should use Node standard-library primitives only.

No Docker SDK dependency is authorized in `package.json` or lockfiles.

---

## 31. Cancellation and late events

If the R3E caller aborts while R3F is listing or inspecting:

```text
R3F RESULT = UNAVAILABLE / FAIL CLOSED
```

The owned HTTP request/socket must be terminated.

Late HTTP response data must not revise a terminal aborted result.

R3F never kills, stops, pauses, removes or otherwise mutates the observed container.

---

## 32. Race and mutation boundary

R3F list + exact inspect is a bounded control-plane snapshot.

Docker configuration can theoretically change after the R3F inspect completes.

R3F therefore MUST NOT claim that its E2 network/resource facts remain physically true throughout the later R3E runsc observation bracket.

That cross-surface race is one reason R3F does not mint R3B physical evidence.

A later physical-proof conjunction must define its own race-resistant bracket/re-observation strategy.

---

## 33. Container labels are selectors, not proof

Any actor with sufficient Docker mutation authority could create a container carrying Kodac-like labels.

R3F therefore treats labels only as deterministic discovery selectors.

Trust comes from the complete conjunction of:

```text
trusted local socket endpoint
+
exact-one filtered candidate
+
full 64-hex inspect
+
exact identity labels
+
exact immutable manifest digest
+
exact gVisor runtime control-plane value
+
exact network/resource control-plane values
+
R3E physical same-FD runtime lineage afterward
```

Even that conjunction still does not automatically become R3B E4 proof without the future physical-policy slice.

---

## 34. Linux-only production scope

R3F v1 production Docker transport is Linux/POSIX only.

```text
Linux Unix socket:
IN SCOPE

Windows named pipe:
OUT OF SCOPE

remote TCP/TLS Docker:
OUT OF SCOPE

SSH Docker context:
OUT OF SCOPE
```

Non-Linux hosts must fail closed for production R3F binding.

Cross-platform tests may prove pure contract/parser behavior without pretending to prove Linux socket integration.

---

## 35. No OpenSandbox trust proxy

R3F does not use OpenSandbox as a trust proxy.

No statement such as:

```text
OpenSandbox says secure_runtime=gvisor
therefore R3F succeeds
```

is admissible.

OpenSandbox integration remains a separate future provider/lifecycle decision.

---

## 36. No registry authority

R3F does not resolve tags or query registries.

The R3A immutable digest must already exist in the requirement.

Docker’s exact container `ImageManifestDescriptor.Digest` is compared directly with that expected digest.

Any missing descriptor or mismatch fails closed.

No registry credential or network authority is introduced.

---

## 37. Exact pre-ledger implementation allowlist

If this authorization becomes canonical, R3F implementation may modify exactly these three pre-ledger paths:

```text
1. packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
```

No fourth pre-ledger path is authorized.

The expected `src/index.ts` change is only the additive export of the new R3F module.

An authorization-time repository search found no executable test that byte-pins the current canonical `src/index.ts` blob:

```text
927cd88e676170dd9ede92b2ff04db9b8cd71649
```

If CI or an exact search discovers a conflicting historical pin, implementation must stop and reconcile authorization before modifying any additional test.

---

## 38. Reserved evidence ledger

The post-implementation evidence ledger path is reserved as:

```text
docs/planning/KODAC_KDO_H4_R3F_DOCKER_READ_ONLY_CONTROL_PLANE_EVIDENCE_2026-08-16.md
```

It MUST NOT exist during implementation/pre-ledger review.

Only after exact-head pre-ledger PASS may it be added in one ledger-only commit as the sole additional path.

Fresh post-ledger certification is mandatory.

Any implementation correction after ledger creation invalidates that ledger cycle.

---

## 39. Protected canonical surfaces

R3F must not modify:

```text
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/*
.github/workflows/*
```

Important canonical predecessor blobs include:

```text
packages/kodac-runtime/src/execution/gateway.ts
420df04c5e0a42b371a250d75e580c36bb32f8cb

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
1d02a5dbc1dc4071636c24327e7faf9906370ef5

packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
47c792ba01c9ba4b2db94d7558f282cdbd218660

packages/kodac-runtime/native/gvisor-proc-observe.c
277b66c83ad82c96aa7dbd71f941daf8c6627738
```

R3F must preserve those byte-identically.

---

## 40. Required focused proof

The focused R3F suite must prove at minimum:

1. the public binding request contains no Docker endpoint, socket path, HTTP method/path, filter, container ID or container name;
2. trusted-host provider config rejects non-canonical/non-POSIX endpoint shapes;
3. Linux socket endpoint must be a real Unix socket and its frozen device/inode/uid/gid/mode identity must remain unchanged before/after requests;
4. production transport can issue only the two exact authorized GET request shapes;
5. list filters are derived only from fixed binding version + validated requirement/workload identities + running status;
6. 0 candidates fail closed;
7. 2+ candidates fail closed;
8. abbreviated/malformed IDs fail closed;
9. selected full ID must equal inspect ID;
10. inspect labels must exactly match the validated requirement/workload identities and binding version;
11. missing/mismatched `ImageManifestDescriptor.Digest` fails closed;
12. `Config.Image`, `Image`, tags or names cannot satisfy source-digest proof;
13. runtime must be exactly `runsc`;
14. network mode must be exactly `none`;
15. `NanoCpus` must exactly equal `cpuMillis * 1_000_000`;
16. `Memory` and `MemorySwap` must both exactly equal `memoryBytes`;
17. privileged mode is rejected;
18. container must be running, non-paused, non-restarting, non-dead, first-life and restart-disabled;
19. duplicate-key/malformed/oversized/deep JSON fails closed;
20. body/header/time bounds are enforced and not caller-raiseable;
21. abort cancels the owned HTTP operation and no late result can become success;
22. no mutation verb/endpoint exists in production R3F code;
23. no Docker SDK, shell, CLI, subprocess, TCP, proxy or environment-derived endpoint exists;
24. R3F imports no R3B observation/evidence constructor and cannot mint physical evidence;
25. R3F can produce a validated R3E `GvisorContainerBinding` for the current execution-attempt identity without changing `ExecutionGateway`;
26. R3F E2 observation identity changes when any bounded source/runtime/network/resource/socket subject fact changes;
27. the R3E/R3D/gateway protected blobs remain canonical;
28. a Linux fake Unix-socket Docker fixture proves the exact list->inspect path without requiring Docker installation or host Docker access;
29. non-Linux tests prove structural fail-closed behavior without pretending physical Linux integration;
30. generic command execution, Landlock, approvals, receipts, Done Gate and H5 behavior remain unchanged.

---

## 41. Fake Docker fixture requirements

The focused Linux integration should use one test-only Unix-domain HTTP server, not the host Docker daemon.

The fixture should:

- listen on a temporary Unix socket;
- record every request method/path;
- answer only the exact two authorized R3F request shapes;
- return bounded deterministic Docker-shaped list/inspect JSON;
- allow hostile variants for duplicate keys, malformed IDs, multiple candidates, wrong manifest digest, wrong runtime, wrong network mode and resource mismatches;
- expose no mutation implementation;
- permit socket replacement tests proving endpoint-identity failure;
- be fully removed in test cleanup.

Repository CI must never depend on `/var/run/docker.sock` being present.

---

## 42. Repository gates

Any R3F implementation PR must pass at the exact accepted head:

```text
governance / provenance
legacy tests / ruff
runtime-change classifier
Ubuntu runtime typecheck + full test + benchmark
Windows runtime typecheck + full test + benchmark
macOS runtime typecheck + full test + benchmark
K2 runtime aggregate gate
K3-R4 regression gate
K3-R5 regression gate
focused R3F proof
manual trust/security review
0 unresolved actionable review threads
```

Automated external reviewer availability must be recorded accurately.

Rate-limited/unavailable is not represented as PASS.

---

## 43. Maximum claim after canonical R3F implementation

Only after:

- this authorization becomes canonical;
- implementation stays inside the exact three-path pre-ledger allowlist;
- exact-head pre-ledger gate passes;
- the ledger-only transition is proven;
- fresh exact-head post-ledger certification passes;
- canonical merge succeeds;

may Kodac make the bounded claim:

```text
KODAC_DOCKER_READ_ONLY_CONTROL_PLANE_BINDING_PROVIDER_PROVEN
```

Meaning only:

> Kodac has a bounded Linux Docker Engine read-only provider that resolves exactly one full Docker container subject for a validated R3E gVisor binding request and records a deterministic E2 control-plane snapshot of immutable manifest digest, runtime selection, deny-all network configuration and CPU/memory configuration without exposing Docker mutation authority or minting R3B physical backend evidence.

It does not mean:

```text
physical source/rootfs enforcement proven
physical deny-all networking proven
physical CPU enforcement proven
physical memory enforcement proven
TTL enforcement proven
output-limit enforcement proven
R3B physical observation/evidence proven
Docker container lifecycle proven
real workload creation proven
external-process ask enabled
H4 complete
H6 authorized
```

---

## 44. Expected next candidate after proven R3F

If R3F becomes canonical/proven, the next authorization should decide the smallest race-resistant physical-policy observation slice needed to combine Docker E2 state with trusted Linux/runtime E3 state.

A purpose-equivalent candidate is:

```text
KDO-H4-R3G — Linux Docker/gVisor Physical Policy Conjunction Authorization
```

R3G must independently decide whether to split further before any R3B observation is minted.

At minimum it must address:

```text
physical immutable source/rootfs binding
physical deny-all network state
physical CPU cgroup enforcement
physical memory + swap cgroup enforcement
race-resistant re-observation/bracketing
observer identity across Docker + runsc + host state
```

TTL/lifecycle and output-bound enforcement may require their own later slices rather than being forced into R3G.

R3F pre-authorizes none of those physical reads or mutations.

---

## 45. Explicit non-authority

This authorization document itself changes no runtime authority.

Even after this document becomes canonical, only the exact future R3F implementation scope described above is authorized.

R3F does not authorize:

- Docker create/start/stop/kill/restart/remove/exec;
- image pull/push/remove;
- registry access;
- Docker logs/stats/events/attach/archive;
- TCP/TLS/SSH/npipe Docker endpoints;
- containerd socket access;
- OpenSandbox SDK/server integration;
- cgroup filesystem reads;
- network namespace inspection;
- mount namespace inspection;
- runsc state-root reads beyond existing R3E commands;
- R3B observation/evidence minting;
- TTL lifecycle enforcement;
- output streaming/enforcement;
- approval mutation;
- receipt mutation;
- Done Gate mutation;
- agent-loop mutation;
- workspace-write integration;
- external-process `ask`;
- H4 closure;
- H6 work.

---

## 46. Authorization review gate

Before this authorization becomes canonical, the exact docs-only PR head must prove:

```text
base = exact canonical main 5324dca0d2c81caac5a4dcb1b0163b8e32c0f3b5
changed paths = exactly this one authorization document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
existing K2/K3 regression gates = PASS where triggered
Qodo/Cubic/other available review = no unresolved actionable finding
CodeRabbit availability recorded accurately
manual semantic/security review = PASS
0 unresolved actionable review threads
```

Any review finding that requires implementation code must not be fixed inside this docs-only authorization PR.

---

## 47. Final authorization boundary

```text
R3A WORKLOAD IDENTITY:
CANONICAL / PROVEN

R3B REQUIREMENT / OBSERVATION / EVIDENCE CONTRACT:
CANONICAL / PROVEN

R3C OBSERVATION SEMANTICS:
CANONICAL / RECONCILED

R3D GVISOR OBSERVER PRIMITIVE:
CANONICAL / PROVEN

R3E K2 GVISOR EXACT-INSTANCE BINDING:
CANONICAL / PROVEN

R3F DOCKER READ-ONLY CONTROL-PLANE IMPLEMENTATION:
AUTHORIZED ONLY IF THIS DOCUMENT BECOMES CANONICAL

R3B PHYSICAL BACKEND PROOF:
NOT YET PROVEN

DOCKER MUTATION:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
BLOCKED

H4:
OPEN

H6:
NOT AUTHORIZED
```

R3F exists to give R3E a trustworthy Docker subject resolver without turning Docker inspect output into a security theorem it cannot support.