# KDO-H4-R3F — Docker Read-Only Control-Plane Evidence

Date: 2026-08-16
Status: POST-LEDGER CERTIFICATION PENDING
Repository: `TheHalfMoon/Kodac`

## 1. Evidence decision

```text
GATE:
KDO-H4-R3F

PRE-LEDGER DECISION:
PASS

CANONICAL BASE:
bfc6d9b47b038d1bcfac019db3ca54f0a3e2906f

CANONICAL BASE TREE:
6ba46f3a282a0a0998b1b64d5867803fcb7894f6

ACCEPTED PRE-LEDGER HEAD:
6dccc7e4e46c9ac9e31ad4cfc8b499b46ee90e9f

ACCEPTED PRE-LEDGER TREE:
1f18945525845c44038a93ecd8389e6f03ca415f

BOUNDED TARGET:
LINUX DOCKER READ-ONLY EXACT-CONTAINER BINDING + E2 CONTROL-PLANE SNAPSHOT

DOCKER MUTATION AUTHORITY:
NONE

R3B PHYSICAL OBSERVATION / EVIDENCE MINTING:
NONE

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

This ledger records accepted **pre-ledger** evidence only.

Fresh exact-head post-ledger certification of the ledger-bearing head is mandatory before any canonical completion claim becomes available.

---

## 2. Governing canonical documents

R3F implementation is governed by the conjunction of these canonical documents:

```text
docs/planning/KODAC_KDO_H4_R3F_DOCKER_READ_ONLY_CONTROL_PLANE_AUTHORIZATION_2026-08-16.md
blob fb38be6c89c81d890cbaf18fbb2a44e3e7b17765


docs/planning/KODAC_KDO_H4_R3F_REQUIREMENT_CONTEXT_RECONCILIATION_2026-08-16.md
blob 891c70f4bff75d07cf27d9cd764efd9d3d22853d


docs/planning/KODAC_KDO_H4_R3F_SUBJECT_SNAPSHOT_RECONCILIATION_2026-08-16.md
blob 27e3dabe1d99b553ce112fdcc5e9fc08acf4dd58
```

The reconciliations were completed canonically before final pre-ledger acceptance.

They close two material authorization gaps without widening the implementation allowlist:

1. the R3F provider binds one exact validated canonical R3B gVisor requirement at provider construction, because R3E binding requests carry identities only;
2. exact Docker subject validation includes effective `Path` / ordered `Args` and zero current `NetworkSettings.Networks` attachments, because image identity and creation-time network mode are insufficient exact-subject facts by themselves.

---

## 3. Exact pre-ledger scope

Exactly three implementation paths differ from canonical base:

```text
1. packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
```

No fourth implementation path is present.

The evidence-ledger path was absent at the accepted pre-ledger head.

No production change exists in:

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

---

## 4. Accepted implementation blobs

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
452bd955cb0ef84f2090aa646dfdc70ad610a8d9

packages/kodac-runtime/src/index.ts
4ed084ed3a81a854a1421c59e0d010fead84909b

packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
dc2b8cf335d6c294861f6b7db193402fccd776a4
```

The ledger-only transition must preserve all three blobs byte-identically.

---

## 5. Protected predecessor blobs

The accepted focused proof re-attests these predecessor implementation blobs:

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

R3F therefore adds no new `ExecutionGateway` method and does not mutate canonical R3E/R3D behavior.

---

## 6. Fixed R3F contract identities

```text
control-plane record version:
kodac-h4-r3f-docker-control-plane-v1

evidence class:
e2-docker-control-plane

binding label version:
kodac-h4-r3f-docker-binding-v1

Docker API version:
1.48

provider ID:
docker-engine

normalization version:
kodac-h4-r3f-normalization-v1

Moby source-study commit:
d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
```

The provider remains Linux/POSIX local-Unix-socket only.

---

## 7. Exact Docker request authority

R3F production transport can issue only two fixed `GET` request families:

```text
GET /v1.48/containers/json?all=1&filters=<canonical fixed R3F filters>

GET /v1.48/containers/<FULL_64_LOWERHEX_ID>/json?size=0
```

The filters are derived only from:

```text
fixed binding-version label
configured requirement identity
configured workload identity
running status
```

The public R3E request provides no Docker endpoint, method, path, filter, container name, container ID, socket path, proxy or remote-host authority.

R3F introduces no generic Docker request primitive.

---

## 8. No Docker mutation surface

Accepted production R3F source contains no Docker SDK, shell or subprocess authority and no production path capable of issuing:

```text
POST
PUT
PATCH
DELETE
```

R3F does not authorize or implement:

```text
container create/start/stop/kill/restart/exec/remove
image pull/push/remove
logs
stats
events
attach
archive
wait
registry access
containerd access
OpenSandbox integration
remote Docker endpoints
```

---

## 9. Unix-socket endpoint theorem

The provider configuration binds a canonical absolute POSIX Unix-socket path supplied only as trusted host configuration.

At provider construction the path must `lstat` as a real Unix socket rather than a symlink or regular file.

The provider freezes an endpoint identity over canonical decimal:

```text
device
inode
uid
gid
mode
```

and rechecks the same endpoint identity before and after each authorized Docker request.

Socket replacement, type change or metadata drift fails closed.

This is explicitly an endpoint-path identity theorem, not a cryptographic Docker-daemon executable identity theorem.

---

## 10. Exact requirement-context theorem

The provider binds one exact canonical validated `SandboxExecutionRequirement` at construction.

Every R3E binding request must satisfy before Docker I/O:

```text
request.requirementIdentity
== configuredRequirement.requirementIdentity

request.workloadIdentity
== configuredRequirement.workload.workloadIdentity

configuredRequirement.requiredSemanticRuntimeClass
== gvisor
```

No generic requirement registry, database callback, filesystem lookup or network requirement service is introduced.

The configured requirement is the sole source of expected manifest, command, network and resource values.

---

## 11. Exact candidate-selection theorem

The list response must contain exactly one running candidate.

```text
0 candidates -> fail closed
1 candidate  -> continue to exact inspect
2+ candidates -> fail closed as ambiguous
```

The selected ID must be exactly 64 lowercase hexadecimal characters.

No prefix, name, newest/oldest heuristic or tie-breaker is admitted.

The exact inspect response must repeat the same full ID.

---

## 12. Exact subject identity theorem

The exact inspect response must carry identity labels matching:

```text
io.kodac.binding-version
= kodac-h4-r3f-docker-binding-v1

io.kodac.requirement-identity
= exact configured requirement identity

io.kodac.workload-identity
= exact configured workload identity
```

Labels are selectors/control-plane identity aids only and are not treated as physical proof.

---

## 13. Immutable image-manifest binding

R3F requires:

```text
InspectResponse.ImageManifestDescriptor.Digest
== configuredRequirement.workload.source.digest
```

R3F does not substitute:

```text
Config.Image
InspectResponse.Image
image name
tag
container name
repository string alone
```

for the canonical R3A digest.

The observed manifest digest remains E2 Docker control-plane evidence, not physical root-filesystem proof.

---

## 14. Exact effective command binding

R3F requires exact equality:

```text
InspectResponse.Path
== configuredRequirement.workload.entrypoint.executable
```

and exact ordered argument equality:

```text
InspectResponse.Args
== configuredRequirement.workload.entrypoint.args
```

No PATH resolution, shell normalization, basename comparison, argument coercion, prefix match or image-default command substitution is admitted.

The E2 record binds:

```text
executable
argsIdentity
```

where `argsIdentity` deterministically binds the exact ordered argument vector.

---

## 15. Runtime and network control-plane theorem

R3F requires:

```text
HostConfig.Runtime == runsc
HostConfig.NetworkMode == none
NetworkSettings.Networks has exactly zero own keys
```

The last condition closes the canonical Moby `ConnectToNetwork` gap: creation-time `NetworkMode=none` is insufficient if the running container currently has a live Docker network attachment.

These facts remain E2 control-plane state only.

R3F does not claim physical gVisor confinement or physical network-namespace isolation.

---

## 16. CPU and memory control-plane theorem

Canonical R3C defines `cpuMillis` as milliCPU capacity units.

R3F v1 accepts exactly:

```text
HostConfig.NanoCpus
== cpuMillis * 1_000_000
```

No alternative CPUPeriod/CPUQuota equivalence is accepted in this first provider slice.

Memory posture must satisfy:

```text
HostConfig.Memory
== workload.resourcePolicy.memoryBytes

HostConfig.MemorySwap
== workload.resourcePolicy.memoryBytes
```

This records exact Docker E2 configuration including no container swap access under the pinned Docker semantics.

It does not prove physical cgroup enforcement.

---

## 17. Lifecycle / privilege guardrails

Exact inspect must satisfy:

```text
State.Running == true
State.Paused == false
State.Restarting == false
State.Dead == false
RestartCount == 0
HostConfig.RestartPolicy.Name == no
HostConfig.Privileged == false
```

These are fail-closed R3F admission guardrails.

R3F does not acquire lifecycle mutation authority and does not stop/kill/remove the observed container.

---

## 18. Bounded HTTP transport

Accepted R3F transport uses Node standard-library local Unix-socket HTTP only.

It has fixed ceilings:

```text
list response body <= 262144 bytes
inspect response body <= 1048576 bytes
response headers <= 16384 bytes
request timeout = 5000 ms
JSON depth <= 64
JSON nodes <= 16384
object keys <= 2048
array items <= 4096
string bytes <= 65536
list items <= 16
```

The caller cannot raise these ceilings.

No redirect-following, proxy or caller-supplied HTTP header surface exists.

---

## 19. Strict JSON theorem

Docker responses are parsed through a bounded UTF-8/JSON boundary that rejects:

```text
invalid UTF-8
duplicate object keys
trailing JSON content
invalid escapes/control characters
excessive nesting
oversized bodies
oversized arrays/objects/strings
non-finite values after parsing
unexpected required subtree shapes
unsafe integers in authority-bearing numeric fields
```

A Qodo review found that an earlier implementation scanned primitive JSON tokens using repeated `text.slice(index)` suffix copies.

The accepted implementation replaces that with an original-string sticky number regex and indexed literal checks:

```text
numberPattern.lastIndex = index
numberPattern.exec(text)
text.startsWith(literal, index)
```

The focused regression test explicitly forbids reintroduction of the quadratic suffix-slicing pattern.

---

## 20. Cancellation / failure attribution theorem

A Qodo review found an abort race between an early `signal.aborted` check and later listener registration.

The accepted implementation now:

1. checks already-aborted state;
2. registers the abort listener;
3. immediately rechecks `signal.aborted`;
4. enters the same fail-closed abort path before `request.end()` if cancellation occurred in the window.

The focused suite includes a deterministic synthetic AbortSignal that flips exactly in that window and proves:

```text
result = rejected as aborted
HTTP request bytes reaching fake Docker = 0
late success = impossible
```

The accepted transport also settles the intended failure before destroying the HTTP transport for:

```text
header overflow
non-200 status
body overflow
AbortSignal cancellation
timeout
```

This preserves primary failure attribution and prevents transport cleanup events from replacing the intended bound/abort/timeout error.

---

## 21. Focused Linux fixture

The focused proof uses a test-only Unix-domain HTTP server in a temporary directory.

It does not require Docker installation and never accesses the host Docker daemon.

The fixture proves:

- exactly two authorized GET request shapes;
- exact requirement-bound labels;
- exact full-ID list -> inspect subject binding;
- exact image manifest digest;
- exact `Path` and ordered `Args`;
- `runsc` runtime;
- `NetworkMode=none` plus zero live network attachments;
- exact NanoCpus and memory/no-swap values;
- non-privileged first-life running posture;
- candidate cardinality failure;
- abbreviated ID failure;
- all command/network/resource/lifecycle mismatch failures;
- duplicate/deep/oversized/invalid-UTF8 JSON failure;
- non-200 failure;
- real cancellation and deterministic abort-window cancellation;
- Unix-socket replacement failure.

Non-Linux platforms run structural/pure regression coverage and skip only Linux physical Unix-socket fixture cases.

---

## 22. Fresh exact-head pre-ledger CI

Accepted pre-ledger head:

```text
6dccc7e4e46c9ac9e31ad4cfc8b499b46ee90e9f
```

### Governance

```text
run 31921551283
legacy-tests 95102075188 — PASS
provenance   95102075218 — PASS
```

`legacy-tests` includes both `pytest` and `ruff check .`.

### K2 runtime

```text
run 31921551377
runtime-change-classifier 95102075388 — PASS
Ubuntu runtime            95102096056 — PASS
macOS runtime             95102096083 — PASS
Windows runtime           95102096112 — PASS
k2-runtime-gate           95102150214 — PASS
```

Every OS runtime passed Typecheck, full Test and patch benchmark.

Ubuntu exact-head runtime log reports:

```text
tests: 574
authorized pass count: 573
fail: 0
expected platform skip: 1
benchmark iterations: 10000
benchmark status: pass
```

The Linux runtime includes all R3F Unix-socket integration proofs.

### K3-R4

```text
run 31921551296
k3-r4-adapter 95102075203 — PASS
```

### K3-R5

```text
run 31921551380
k3-r5-context-engine 95102075151 — PASS
```

---

## 23. External review findings and closure

### Qodo

Qodo surfaced two material current-slice findings before acceptance:

```text
1. Abort race window
2. Quadratic JSON primitive scan
```

Both were corrected before the accepted pre-ledger head.

The corresponding review threads are resolved; the quadratic-scan thread is additionally outdated after the corrective source change.

### CodeRabbit

CodeRabbit surfaced earlier failure-attribution / abort-registration / lifecycle-coverage findings during implementation.

The accepted implementation satisfies the requested reject-before-destroy ordering and post-listener abort recheck, and the focused suite retains strict error assertions plus the `State.Running=false` case.

All CodeRabbit review threads are resolved at accepted head.

Exact accepted-head CodeRabbit commit status:

```text
success
```

### Cubic

Cubic generated an exact-head summary for:

```text
6dccc7e4e46c9ac9e31ad4cfc8b499b46ee90e9f
```

that reflects the bounded read-only E2 provider, exact command/network snapshot, strict parser and cancellation fixes.

### Unresolved threads

```text
unresolved actionable review threads:
0
```

---

## 24. Manual exact-head trust/security review

```text
DECISION:
PASS
```

The manual review specifically rechecked:

- K2/R3E authority remains unchanged;
- public R3E request cannot choose Docker subject or endpoint;
- requirement mismatch fails before Docker I/O;
- no mutation verb or generic Docker client exists;
- endpoint/response bounds are fixed;
- exact manifest/command/network/resource/lifecycle checks are fail closed;
- current network attachment state is not inferred from creation mode alone;
- cancellation cannot produce late success;
- primary bounded failures retain their intended error cause;
- R3F does not import R3B physical observation/evidence constructors;
- TTL/output remain explicitly unavailable;
- physical source/network/cgroup enforcement remains explicitly unavailable.

### Important provenance caveat

A standalone `DockerControlPlaneObservation` object and its deterministic identity are **not a cryptographic attestation that Docker I/O occurred**.

The trusted R3F E2 theorem applies to the observation returned by the bounded trusted provider operation after its live socket/list/inspect checks.

A future R3G/R3B conjunction must therefore bind to the trusted provider execution path and must not accept an arbitrary caller-constructed object merely because it structurally validates as `DockerControlPlaneObservation`.

R3F grants no completion authority to the standalone record type.

---

## 25. Explicit non-authority

R3F pre-ledger acceptance does **not** prove or authorize:

```text
physical rootfs/source enforcement
physical deny-all network namespace proof
physical CPU cgroup enforcement
physical memory/swap cgroup enforcement
TTL enforcement
output-limit enforcement
R3B physical backend observation/evidence
Docker create/start/stop/kill/restart/exec/remove
real workload creation
registry access
containerd access
OpenSandbox integration
cgroup/netns/mount inspection
approval mutation
receipt mutation
Done Gate mutation
agent-loop mutation
workspace-write integration
external-process ask
H4 completion
H6 work
```

The E2 Docker snapshot remains one future conjunction input only.

---

## 26. Maximum bounded claim lifecycle

This pre-ledger PASS does **not** make the completion claim available yet.

Only after:

1. this ledger is added in one ledger-only commit;
2. the three accepted implementation blobs remain byte-identical;
3. fresh exact-head post-ledger certification passes;
4. review state remains acceptable;
5. canonical merge succeeds with the exact certified ledger-bearing head;

may Kodac make the bounded claim:

```text
KODAC_DOCKER_READ_ONLY_CONTROL_PLANE_BINDING_PROVIDER_PROVEN
```

Meaning only:

> Kodac has a bounded Linux Docker Engine read-only provider that resolves exactly one full Docker container subject for a validated R3E gVisor binding request and records a deterministic E2 control-plane snapshot of exact manifest, effective command, runtime selection, current zero-network-attachment posture, and CPU/memory configuration without exposing Docker mutation authority or minting R3B physical backend evidence.

---

## 27. Expected next authorization after proven R3F

If R3F becomes canonical/proven, the next candidate remains purpose-equivalent to:

```text
KDO-H4-R3G — Linux Docker/gVisor Physical Policy Conjunction Authorization
```

R3G must independently decide how to earn race-resistant physical facts for:

```text
source/rootfs binding
network namespace state
CPU cgroup enforcement
memory/swap cgroup enforcement
Docker E2 + runsc E3 + host physical-state conjunction
```

TTL/lifecycle and output-bound enforcement may remain later independent slices.

R3F pre-authorizes none of those physical reads or mutations.
