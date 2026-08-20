# KDO-H4-R4B-B2A — Pre-Start Output Ownership + Start Preparation Authorization

Date: 2026-08-20
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY / NO PRODUCT IMPLEMENTATION IN THIS PR**
Repository: `TheHalfMoon/Kodac`
Canonical base: `b4c660801133055db1371651c8956d6d64058925`
Canonical base tree: `38879e9fe097fbb4424fa37edd1b0912bb9d275d`
Canonical readiness predecessor: `docs/planning/KODAC_KDO_H4_R4B_B2_START_TTL_OUTPUT_CONTINUITY_READINESS_AUDIT_2026-08-20.md`
Readiness predecessor blob: `14991c3b512a49e0ab6c78c5ccbecee732c1e15c`

---

## 1. Decision

```text
GATE:
KDO-H4-R4B-B2A

NAME:
PRE-START OUTPUT OWNERSHIP + START PREPARATION

CHANGE CLASS:
DOCS ONLY / AUTHORIZATION / NO PRODUCT IMPLEMENTATION IN THIS PR

R4B-B2A PRODUCT IMPLEMENTATION:
AUTHORIZED ONLY AFTER THIS DOCUMENT IS CANONICAL

MAXIMUM POSITIVE STATE:
PRESTART_READY

NEW DOCKER OPERATION AUTHORIZED:
ONE FIXED PRE-START POST /v1.48/containers/{id}/attach

DOCKER START:
NO

WORKLOAD PROCESS EXECUTION:
NO

TTL ARM:
NO

R3G-F E4:
NO

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO

K3-R6+ AUTHORIZED:
NO
```

R4B-B2A is the smallest safe bridge between canonical R4B-B1 dormant-created admission and a future separately authorized live-start controller.

It may establish and own a bounded output channel while the exact container remains pristine and never started. It may return only one live process-local `PRESTART_READY` capability.

It does **not** authorize any start mutation, workload occurrence, TTL arming, terminal lifecycle claim, positive R3G-E E3 evidence, R3G-F E4, cleanup mutation, successful execution settlement, owner takeover, or recovery.

---

## 2. Canonical predecessor truth

Canonical PR #132 established:

```text
MONOLITHIC_R4B_B2_AUTHORIZATION=REJECT
R4B_B2_SUB_SLICING=REQUIRED
B2A_DOCKER_START=NO
B2A_LIVE_WORKLOAD=NO
B2A_MAX_POSITIVE_STATE=PRESTART_READY
FIRST_LIVE_START=B2B_OR_EQUIVALENT_SEPARATELY_AUTHORIZED_CONTROLLER
```

Relevant merge identity:

```text
PR #132 reviewed head:
f3c0a00eb5f3afb0c0150773c9b4477c2f5306bd

merge commit / canonical base:
b4c660801133055db1371651c8956d6d64058925

merge tree:
38879e9fe097fbb4424fa37edd1b0912bb9d275d

ordered parents:
1. ccf08bbf007eae0794332c691838d5c96ce8f77b
2. f3c0a00eb5f3afb0c0150773c9b4477c2f5306bd

verified=true
reason=valid
```

This document converts only that B2A readiness result into bounded future implementation authority.

---

## 3. Exact canonical source identities inspected

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
a917577d154ed14d7fd0528a69242846c53a7af3

packages/kodac-runtime/src/trust/sandbox-admission-dormant-create.ts
b744c2c5150d7dfaf53075416fa93bd54de89d05

packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
f9e2dda11fe26d481e2e6c328c37cd37a6260106

packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
b55e5068682d9ae824a619b682c694c3a95e6095

packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
6d1227c6f545194c644ec5b9bc7d07135fc789e2

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
26b0f8094afb8e61ec29e05496c7aa91bf2f6e7f

packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
4e094b54cbe2c301deff5ecb64634199fca2c425

packages/kodac-runtime/src/index.ts
90ee90846abc3780bfbc4cd398269201f9babe41
```

Docs-only merges after B1 did not change those runtime identities.

---

## 4. Bounded R3G-E internal factorization

Canonical R3G-E currently owns the fixed Docker attach stream until terminal aggregation. B2A needs an earlier internal readiness boundary, so it may factor internal attach/provenance/reader machinery only if all of these remain true:

```text
R3G_E_EXTERNAL_BEHAVIOR=UNCHANGED
R3G_E_OUTPUT_BOUND_SEMANTICS=UNCHANGED
R3G_E_ROOT_AUTHORITY_SURFACE=NOT_WIDENED
RAW_SOCKET_ROOT_EXPORT=NO
RAW_ATTACH_TRANSPORT_ROOT_EXPORT=NO
CALLER_SELECTED_SOCKET=NO
CALLER_SELECTED_HTTP_METHOD=NO
CALLER_SELECTED_DOCKER_PATH=NO
```

The factored primitive must support one trusted controller proving:

```text
fixed attach established
AND one bounded reader active
AND zero payload bytes accepted
AND exact container still pristine dormant
AND the same live reader can later be consumed by separately authorized B2B
```

If that cannot be achieved without changing the canonical R3G-E theorem, implementation must stop and return to authorization.

---

## 5. B2A positive theorem

A positive B2A result may claim only:

```text
One exact canonical B1 CREATED admission and its durable lineage were validated.
The exact Docker container was independently re-observed as the same pristine
never-started runsc subject. Kodac proved the B2A v1 protected rootful Docker
socket namespace, durably prepared one pre-start output operation, won exactly
one atomic non-transferable ownership claim for that operation from an
unforgeable process-local trusted owner capability, entered one local ATTACHING
state, established exactly one fixed non-TTY Docker attach with logs=0 while the
container remained dormant, activated exactly one trusted bounded multiplex
reader and one shared accumulator, accepted zero raw payload bytes, re-proved
the container remained pristine dormant, and created one module-sealed
non-serializable PRESTART_READY capability. No Docker start request was issued
and no workload process was permitted to execute.
```

B2A may not claim:

```text
container started
workload executed
running gVisor subject resolved
TTL armed or enforced
terminal lifecycle proven
terminal output aggregation settled
positive R3G-E E3 committed
R3G-F E4 produced
permit consumed by successful execution
container cleanup/removal performed
owner recovered after process loss
H4 complete
H6 ready
```

---

## 6. Absolute zero-start invariant

```text
R4B_B2A
=>
DOCKER_START_CALLS = 0
WORKLOAD_PROCESS_OCCURRENCES = 0
RUNNING_SUBJECTS_CREATED_BY_B2A = 0
TTL_ARM_ATTEMPTS = 0
```

No reachable B2A production path may issue or wrap any purpose-equivalent form of:

```text
POST /v1.48/containers/{id}/start
ContainerStart
Docker exec
Docker restart
Docker stop
Docker kill
Docker remove
shell/docker CLI lifecycle fallback
```

Any need for one of those operations invalidates this authorization.

---

## 7. Exact B1 predecessor and pristine dormant revalidation

B2A accepts only one exact canonical B1 result whose validated durable lineage includes:

```text
SandboxAdmissionPermit
SandboxAdmissionPermitCommit
SandboxAdmissionConsumptionReservation
SandboxAdmissionConsumptionReservationCommit
SandboxDormantCreatePrepared
SandboxDormantCreatePreparedCommit
SandboxDormantDockerObservation
SandboxDormantCreatedAdmission
SandboxDormantCreatedAdmissionCommit
```

Before durable pre-start preparation and again after attach/reader activation, B2A must independently prove at minimum:

```text
container ID = exact B1 ID
runtime = runsc
network mode = none
network attachment count = 0
restart policy = no
privileged = false
TTY = false
AttachStdout = true
AttachStderr = true
AttachStdin = false
OpenStdin = false
running = false
paused = false
restarting = false
dead = false
pid = 0
restart count = 0
exact image/source lineage
exact executable + ordered arguments
exact CPU/memory/memory-swap limits
exact canonical labels
no new host authority
```

Any ambiguity or mismatch fails closed. B2A may not stop, kill, remove, recreate, or repair the subject.

---

## 8. Rootful protected Docker socket namespace theorem

Canonical R3F/R3G-E freeze the final Unix-socket endpoint identity and re-`lstat` before/after requests. That alone does not bind the pathname during the check-to-connect interval.

B2A v1 therefore does **not** claim a nonexistent pinned socket-file-descriptor or undocumented Node peer-credential primitive. It instead narrows the authorized namespace.

The configured Docker socket path must satisfy all of:

```text
absolute canonical POSIX pathname
no abstract Unix socket
no symlink component
no . or .. component
final entry is a Unix socket
final socket uid = 0
all ancestor components from / through immediate parent are directories
all ancestor directory uid = 0
all ancestor directory mode & 0o022 = 0
```

For every ancestor and the final socket, freeze:

```text
device
inode
uid
gid
mode
file type
```

The complete namespace chain must be revalidated:

```text
A. before PRESTART_OUTPUT_PREPARED
B. immediately before ATTACHING
C. after HTTP upgrade and before reader activation
D. during final pre-PRESTART_READY revalidation
```

The theorem is explicitly:

```text
UNTRUSTED_NON_ROOT_PATH_REPLACEMENT=PREVENTED_BY_NAMESPACE_PERMISSIONS
HOST_ROOT=TRUSTED_HOST_BOUNDARY
TRANSIENT_HOST_ROOT_REPLACE_AND_RESTORE=OUT_OF_SCOPE
```

B2A v1 rejects:

```text
rootless Docker socket
user-owned socket or parent
writable parent or ancestor
symlink ancestor/final entry
abstract Unix socket
```

This restriction is specific to the new B2A live attach authority and does not retroactively rewrite historical R3F/B1 claims.

---

## 9. Exact Docker attach surface

The only new Docker operation authorized is:

```text
POST /v1.48/containers/{exact-container-id}/attach
?logs=0&stream=1&stdin=0&stdout=1&stderr=1
```

Required result:

```text
HTTP 101
Connection: Upgrade
Upgrade: tcp
Content-Type: application/vnd.docker.multiplexed-stream
```

The target container ID comes only from validated B1 lineage. Docker API remains pinned to `1.48`.

B2A may not expose or accept generic Docker methods/paths, caller-selected socket paths, TCP/TLS/SSH endpoints, rootless sockets, Docker CLI fallback, shell fallback, or PATH lookup.

---

## 10. Durable prepared contract

All durable records must be immutable canonical non-proxy plain records, reject accessors and extra fields, use deterministic SHA-256 identities, and pass closed schema validation.

### 10.1 `SandboxPrestartOutputPrepared`

Required fields:

```text
version
permitIdentity
reservationIdentity
executionAttemptIdentity
requirementIdentity
workloadIdentity
createdAdmissionIdentity
createdAdmissionCommitIdentity
containerId
containerOccurrenceIdentity
providerIdentity
socketEndpointIdentity
socketNamespaceIdentity
prestartOutputChannelIdentity
prestartOutputOperationIdentity
maxOutputBytes
attachProtocolIdentity
preparedIdentity
```

`preparedIdentity` hashes every preceding field.

### 10.2 `SandboxPrestartOutputPreparedCommit`

Required fields:

```text
version
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
disposition = created | existing
durability = durable
commitIdentity
```

Only a validated durable `created` prepared commit may advance to owner-claim creation. An `existing` prepared commit must be byte/identity-equivalent to the same canonical prepared operation; otherwise the result is `INDETERMINATE` and no ownership claim may be attempted.

---

## 11. Unforgeable owner-instance capability and durable ownership claim

### 11.1 Owner identity source

`ownerInstanceIdentity` is not a caller argument, serialized capability, environment value, process ID, hostname, timestamp, or caller-supplied string.

Trusted K2 composition must create one **process-local owner-instance capability** using public Node 24 cryptographic randomness (at least 256 bits) inside the trusted module. The capability must be module-sealed by private nominal identity, `WeakSet`/`WeakMap`, private class state, or stronger equivalent.

The durable `ownerInstanceIdentity` is derived only inside the trusted module from that sealed capability using a domain-separated SHA-256 identity.

Required invariants:

```text
CALLER_CAN_SUPPLY_OWNER_INSTANCE_IDENTITY=NO
CALLER_CAN_DESERIALIZE_OWNER_CAPABILITY=NO
CALLER_CAN_VALIDATE_OWNER_BY_STRUCTURE=NO
SERIALIZED_OWNER_IDENTITY_GRANTS_AUTHORITY=NO
PID_OR_HOSTNAME_ALONE_GRANTS_AUTHORITY=NO
```

A process that merely knows a persisted `ownerInstanceIdentity` cannot recreate the corresponding process-local owner capability.

### 11.2 `SandboxPrestartOwnershipClaim`

Required fields:

```text
version
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
createdAdmissionIdentity
ownerInstanceIdentity
ownershipClaimIdentity
```

The claim builder is trusted/internal only and accepts the sealed owner capability, not an owner identity string.

`ownershipClaimIdentity` deterministically binds every preceding field.

### 11.3 Atomic owner-claim uniqueness

The durable owner-claim store must provide one atomic create-once operation keyed exactly by:

```text
prestartOutputOperationIdentity
```

At the persistence linearization point, the candidate must bind exactly:

```text
preparedIdentity
executionAttemptIdentity
createdAdmissionIdentity
ownerInstanceIdentity
```

Read-then-write application logic is not sufficient proof of uniqueness.

### 11.4 `SandboxPrestartOwnershipClaimCommit`

Required fields:

```text
version
ownershipClaimIdentity
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
ownerInstanceIdentity
disposition = created | existing
durability = durable
commitIdentity
```

Only `disposition = created` grants the current sealed owner capability the right to attempt the local `ATTACHING` transition.

`disposition = existing` is **not a terminal operation failure**. It produces only a bounded non-durable replay response:

```text
response = OWNER_ALREADY_CLAIMED
response durability = none
ATTACH_CALLS=0
NEW_READER_COUNT=0
PRESTART_READY_COUNT=0
OWNER_TAKEOVER=NO
DURABLE_FAILURE_SETTLEMENT=NO
```

This is true even if the replaying process presents the same visible persisted `ownerInstanceIdentity`. There is no same-owner idempotent reattach exception.

The existing replay response must not mutate, invalidate, fail, or otherwise interfere with the already-created owner claim or any live controller owned by the process that won it.

---

## 12. Durable failure contract

Durable failure settlement is permitted only for an actor that already holds the fresh `created` owner claim or for a pre-owner failure on the current operation while the responsible process is alive and can authoritatively settle it.

It is **not** used for existing-claim replay and is **not** required after an unobservable hard process crash.

### 12.1 `SandboxPrestartFailure`

Required fields:

```text
version
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
createdAdmissionIdentity
ownerInstanceIdentity: lowercase-SHA256 | null
failurePhase
failureCode
failureIdentity
```

Allowed `failurePhase` values are exactly:

```text
prepare
owner-claim
attaching
upgrade-validation
reader-activation
post-attach-revalidation
ready-invalidation
```

Allowed durable `failureCode` values are exactly:

```text
aborted
socket-namespace-untrusted
socket-identity-changed
attach-failed
attach-protocol-invalid
reader-failed
payload-before-start
dormant-revalidation-failed
owner-lost-graceful
indeterminate
```

`owner-already-claimed` is deliberately absent because replay rejection is non-durable and must not race the active owner into a conflicting terminal settlement.

`ownerInstanceIdentity` is null only for failures before a durable owner claim exists. From a fresh owner claim onward it must equal the exact claimed owner.

`failureIdentity` deterministically hashes every preceding failure field.

### 12.2 `SandboxPrestartFailureCommit`

Required fields:

```text
version
failureIdentity
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
disposition = created | existing
durability = durable
commitIdentity
```

The first terminal failure settlement is atomic/create-once by `prestartOutputOperationIdentity`. A validated `existing` failure commit is acceptable only when it is exactly identity-equivalent to the same canonical terminal settlement. Conflicting terminal settlement is `INDETERMINATE` and cannot yield readiness.

### 12.3 Hard process loss is not a fabricated durable failure

If the owner process disappears without executing a trusted settlement path, B2A v1 has no authorized post-crash actor that may invent `ready-invalidation` or `owner-lost` evidence.

Instead, the surviving durable `created` owner claim is itself the fail-closed recovery fence.

Any later process observing:

```text
created owner claim exists
AND no valid in-process sealed owner capability/controller exists
```

must classify the operation locally as:

```text
OWNER_LOST_INDETERMINATE
NON_REUSABLE
NO_REATTACH
NO_TAKEOVER
NO_START
```

This derived recovery classification is not a new durable B2A record and grants no cleanup or recovery authority. A later recovery theorem must be separately authorized if durable post-crash settlement or cleanup is desired.

Graceful owner teardown while the current trusted actor is still alive may settle `owner-lost-graceful` before destroying its controller. Hard crash may not be retroactively rewritten as graceful evidence.

---

## 13. Process-local state machine and attach linearization

For a fresh `created` owner claim, the sealed controller uses exactly:

```text
OWNER_CLAIMED
  -> ATTACHING
  -> READER_ACTIVE
  -> PRESTART_READY
```

Terminal local states:

```text
FAILED
INVALIDATED
```

No transition leaves `FAILED` or `INVALIDATED`.

### 13.1 Abort registration

The trusted runtime installs its abort/invalidation handler before any attach-capable local transition.

### 13.2 `ATTACHING` is the linearization point

Only the process holding both:

```text
fresh durable owner claim disposition = created
AND matching sealed process-local owner capability
```

may synchronously attempt:

```text
OWNER_CLAIMED -> ATTACHING
```

Immediately before the transition it must prove:

```text
signal.aborted = false
state = OWNER_CLAIMED
owner capability valid and matches durable claim
protected socket namespace exact
container still eligible and dormant
```

There must be no `await` between the final abort/owner checks and ownership of `ATTACHING`.

Cancellation that wins before `ATTACHING` must produce:

```text
POST /attach count = 0
PRESTART_READY count = 0
```

Only the current `ATTACHING` owner may construct the fixed HTTP request. Immediately before request construction, production code must synchronously confirm `state === ATTACHING`, with no asynchronous gap before creating the request.

### 13.3 Cancellation after `ATTACHING`

Once `ATTACHING` owns a request/session, later cancellation must synchronously mark the controller invalidated and destroy/close every owned request/socket/stream handle as available.

Late HTTP 101, socket events, reader activation, revalidation, or capability construction after invalidation cannot become success.

### 13.4 `READER_ACTIVE` and `PRESTART_READY`

After exact upgrade and namespace validation:

```text
ATTACHING -> READER_ACTIVE
```

Before capability creation, synchronously prove:

```text
state = READER_ACTIVE
signal.aborted = false
owner capability still valid
reader live
accepted raw payload bytes = 0
post-attach dormant revalidation = PASS
socket namespace exact
```

Only then may the module transition:

```text
READER_ACTIVE -> PRESTART_READY
```

and create one sealed capability.

---

## 14. `PRESTART_READY` capability theorem

`PRESTART_READY` is process-local and never durable.

It must be:

```text
non-serializable
module-sealed
not caller-constructible
not structurally validatable
exactly-once owned
bound to executionAttemptIdentity
bound to prestartOutputOperationIdentity
bound to exact container ID
bound to exact live reader/controller
bound to exact shared output accumulator
bound to exact sealed owner-instance capability
```

Plain-object lookalikes, Proxies, JSON round-trips, structured clones, copied fields, stale handles, invalidated handles, and handles from another process must fail validation.

No durable record may assert that the stream/reader/capability survived process restart.

---

## 15. One trusted bounded reader

HTTP 101 alone is insufficient. Before readiness, exactly one trusted reader/controller must own:

```text
exact upgraded session
exact provider/socket/namespace provenance
exact executionAttemptIdentity
exact container ID
exact prestartOutputChannelIdentity
exact prestartOutputOperationIdentity
one shared stdout+stderr raw-payload accumulator
canonical Docker 8-byte multiplex parser
maxOutputBytes from exact requirement
abort/transport-loss invalidation
```

The same logical reader and accumulator must remain continuous for future B2B consumption. B2A does not authorize B2B consumption.

Any raw payload byte before a separately authorized start is an invariant violation. The current owner must invalidate readiness, close the channel, settle durable failure if it remains alive and authoritative, and never start the container.

---

## 16. Required positive ordering

```text
1. validate exact B1 lineage and durable commits
2. derive exact requirement/workload/attempt identities
3. validate rootful protected Docker socket namespace
4. independently reobserve exact B1 container
5. prove pristine never-started state
6. derive deterministic channel and operation identities
7. construct canonical PRESTART_OUTPUT_PREPARED
8. atomically create/validate durable prepared commit
9. create sealed process-local owner-instance capability internally
10. derive ownerInstanceIdentity internally; accept no caller identity
11. atomically create-once owner claim keyed by prestartOutputOperationIdentity
12. require owner-claim disposition = created
13. install/confirm abort invalidation handler
14. revalidate protected namespace and dormant subject
15. synchronously win OWNER_CLAIMED -> ATTACHING
16. issue exactly one fixed POST /attach from ATTACHING owner
17. validate HTTP 101, headers, media type, and namespace
18. activate exactly one bounded reader/accumulator
19. transition ATTACHING -> READER_ACTIVE
20. prove zero accepted raw payload bytes
21. independently reobserve pristine dormant container
22. revalidate protected namespace
23. atomically prove no abort/invalidation won
24. transition READER_ACTIVE -> PRESTART_READY
25. create one sealed live capability and return bounded result
```

No start-dispatch claim exists in B2A. Docker start count remains zero.

---

## 17. Replay, cancellation, failure, and process-loss outcomes

### Prepared replay before owner claim

```text
exact prepared `existing`
-> validate exact equivalence
-> may continue to owner-claim attempt only if no owner claim exists

conflicting prepared `existing`
-> INDETERMINATE
-> no owner claim
-> no attach
```

### Existing owner claim replay

```text
disposition = existing
-> non-durable OWNER_ALREADY_CLAIMED response only
-> no failure commit
-> no mutation of active owner's state
-> no attach by replaying process
-> no reader by replaying process
-> no readiness by replaying process
-> no takeover
-> no start
```

### Cancellation before `ATTACHING`

```text
-> POST /attach count = 0
-> current authoritative actor may settle `aborted`
-> no capability
-> no start
```

### Cancellation/failure during or after `ATTACHING`

```text
-> invalidate local state
-> destroy owned request/socket/stream
-> ignore late success events
-> current authoritative actor durably settles terminal failure or returns INDETERMINATE
-> no retry/reattach/takeover
-> no PRESTART_READY
-> no start
```

### Graceful failure after `PRESTART_READY`

While the owner process is still alive:

```text
-> atomically invalidate capability
-> close reader/session
-> settle ready-invalidation / owner-lost-graceful as applicable
-> stale handle rejected
-> no start
```

### Hard process loss after owner claim or readiness

```text
-> no actor is assumed available to write a failure record
-> durable owner claim survives
-> future local classification = OWNER_LOST_INDETERMINATE
-> operation remains non-reusable
-> no takeover
-> no reattach
-> no start
```

Caller cancellation must never detach a live reader into an ownerless background task.

---

## 18. Concurrency, spoofing, and replay theorem

B2A implementation must prove:

```text
concurrent owner-claim attempts
-> at most one disposition = created
-> at most one ATTACHING owner
-> at most one attach session
-> at most one live reader
-> at most one PRESTART_READY capability

same-owner visible identity replay
-> disposition = existing
-> non-durable rejection
-> no attach/readiness/failure settlement

other-owner replay
-> disposition = existing
-> non-durable rejection
-> no attach/readiness/failure settlement

persisted ownerInstanceIdentity copied into another process
-> cannot create valid owner capability
-> cannot enter ATTACHING

structural owner capability clone / JSON / Proxy
-> rejected

structural PRESTART_READY clone / JSON / Proxy / stale handle
-> rejected

hard process loss
-> surviving durable claim fences all later takeover/reattach/start
```

No API may reset or replenish output byte budget after live ownership is established.

---

## 19. Relationship to R3G-E, R3G-D, and future B2B

R3G-E remains canonical. B2A may reuse only exact parser/identity/provenance/attach constants and a factored internal opener/reader primitive.

The factorized path must preserve R3G-E's fixed request, Docker API 1.48, non-TTY framing, shared stdout+stderr raw-payload byte budget, exact N acceptance, N+1 fail-closed behavior, malformed-frame rejection, abort/transport-loss behavior, no-budget-reset rule, and package-root restrictions.

B2A commits no positive R3G-E E3 evidence.

B2A TTL arm attempts must equal zero; R3G-D production files may not change.

Future B2B remains separately unauthorized and must still pin:

```text
exact Docker start mutation
atomic PRESTART_READY consumption
MAX_START_TO_ARM_INTERVAL_MS
trusted clock and deadline owner
deadline-miss exact-subject containment
unknown-start reconciliation
same-reader continuity dormant -> running
running-subject R3G-D ARM
terminal lifecycle evidence
terminal output evidence
R3G-F E4 continuity
final permit consumption settlement
```

B2A success does not imply B2B readiness.

---

## 20. Package-root authority boundary

A later implementation may root-export only one bounded B2A gateway/result plus immutable validated metadata required by trusted composition.

It must not root-export:

```text
raw Docker attach opener
raw Socket or hijacked stream
raw transport
caller-selected Docker path/method/socket
owner-claim creator
ownerInstanceIdentity creator
owner-instance capability creator
PRESTART_READY creator
structural PRESTART_READY validator
reader reopen/reset
byte-budget reset
socket namespace bypass
post-crash takeover/recovery primitive
```

Deep-module helpers remain internal and do not become product authority.

---

## 21. Authorized implementation surface

After this authorization is canonical, one B2A implementation PR may change only purpose-equivalent paths in this exact set:

```text
A packages/kodac-runtime/src/trust/sandbox-admission-prestart-output.ts
A packages/kodac-runtime/src/execution/gateway-gvisor-output-channel-internal.ts
A packages/kodac-runtime/src/execution/gateway-gvisor-docker-prestart-output-runtime.ts
M packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
M packages/kodac-runtime/src/index.ts
A schema/kdo-h4-r4b-b2a-prestart-output.schema.json
A packages/kodac-runtime/test/kdo-h4-r4b-b2a-prestart-output-readiness.test.ts
M packages/kodac-runtime/test/kdo-h4-r3g-e-docker-stream.test.ts
```

R3G-E changes are allowed only for internal factorization and regression proof.

No changes are authorized to R3G-D, R3G-F, B1, permit/policy, workflows, dependencies, package manifests, native helpers, Docker CLI integration, or external services.

If the theorem cannot be satisfied with public Node 24 APIs and this path set, implementation must stop and return to authorization.

---

## 22. Required implementation proofs

### 22.1 Zero-start / zero-TTL

```text
positive path -> Docker start calls = 0
all failures -> Docker start calls = 0
all aborts -> Docker start calls = 0
all replay/concurrency -> Docker start calls = 0
TTL ARM attempts = 0
```

### 22.2 Protected socket namespace

Reject rootless/user-owned/abstract/symlink/writable-parent configurations and every device/inode/uid/gid/mode/type drift. Linux physical evidence must prove the accepted path is inside a real root-owned protected namespace.

A hostile mutation-hook test must distinguish:

```text
writable/untrusted namespace -> reject before ATTACHING
protected rootful namespace -> modeled untrusted non-root principal lacks rename/unlink/create authority
```

No test may claim pre/post `lstat` alone detects transient host-root replacement.

### 22.3 Exact B1 and dormant state

Reject forged/mismatched B1 lineage and every running/pid/restart/runtime/network/image/command/resource/privilege/TTY/stdin/stdout/stderr/host-authority drift.

### 22.4 Fixed attach protocol

Prove exactly the authorized POST/1.48/query/HTTP-101/headers/media-type contract and reject all deviations.

### 22.5 Prepared/failure schema

Round-trip validators must prove deterministic identities, durability, exact key sets, closed enums, owner-nullability rules, conflicting settlement behavior, Proxy/accessor/extra-field rejection, and malformed identity rejection.

Explicitly prove that `owner-already-claimed` cannot appear as a durable failure code.

### 22.6 Unforgeable owner capability

Prove:

```text
caller-provided ownerInstanceIdentity -> rejected/ignored as authority
serialized persisted owner identity in another process -> no capability
plain-object owner-capability lookalike -> rejected
Proxy owner-capability lookalike -> rejected
JSON/structured clone -> rejected
two fresh owner capabilities -> distinct ownerInstanceIdentity values
```

### 22.7 Atomic owner claim and replay

Prove the one atomic uniqueness key `prestartOutputOperationIdentity`, at most one `created`, and:

```text
same-owner replay -> existing -> non-durable OWNER_ALREADY_CLAIMED -> no attach/no failure commit
other-owner replay -> existing -> non-durable OWNER_ALREADY_CLAIMED -> no attach/no failure commit
replay cannot invalidate active owner
read-then-write fake store -> not accepted as atomic proof
```

### 22.8 Cancellation interleavings

Test cancellation before/after prepared commit, owner-claim linearization, `ATTACHING`, request creation, HTTP 101, reader activation, dormant revalidation, and `PRESTART_READY`. Every interleaving must prove zero Docker start and no unauthorized capability.

### 22.9 Reader/capability seal

Prove readiness impossible until one live bounded reader exists with zero accepted payload bytes and final dormant/namespace validation passed. Reject second reader, reopen, reset, clone, stale handle, and cross-process handle reconstruction.

### 22.10 Process loss

Simulate graceful owner teardown and hard process-local loss separately.

Required results:

```text
graceful owner loss while actor alive
-> invalidate live capability/controller
-> durable owner-lost-graceful settlement allowed
-> no start

hard process loss
-> no fabricated failure commit
-> durable created owner claim remains
-> later process derives OWNER_LOST_INDETERMINATE / NON_REUSABLE
-> no takeover
-> no reattach
-> no start
```

### 22.11 R3G-E regression

Re-prove canonical framing, budget, fixed request, malformed-frame handling, abort handling, and root-export negative space after factorization.

---

## 23. Static forbidden-authority scan

The product delta must be scanned for reachable purpose-equivalent forms of:

```text
/containers/*/start
ContainerStart
/containers/*/exec
/exec/*/start
/containers/*/restart
/containers/*/stop
/containers/*/kill
DELETE /containers
child_process spawn/exec for Docker
"docker start"
"docker exec"
"docker kill"
"docker rm"
```

Mentions in tests asserting absence do not create authority.

---

## 24. Product-PR merge gates

The future implementation PR must not merge unless the exact final head proves:

```text
AUTHORIZED_CHANGED_PATHS_ONLY=PASS
NO_WORKFLOW_OR_DEPENDENCY_DRIFT=PASS
ZERO_DOCKER_START_PROOF=PASS
ZERO_TTL_ARM_PROOF=PASS
ROOTFUL_PROTECTED_SOCKET_NAMESPACE_PROOF=PASS
ROOTLESS_B2A_REJECTION_PROOF=PASS
PRESTART_SCHEMA_PROOF=PASS
UNFORGEABLE_OWNER_CAPABILITY_PROOF=PASS
ATOMIC_OWNER_CLAIM_PROOF=PASS
EXISTING_CLAIM_NON_DURABLE_REPLAY_PROOF=PASS
ACTIVE_OWNER_NON_INTERFERENCE_PROOF=PASS
ATTACHING_CANCELLATION_LINEARIZATION_PROOF=PASS
HARD_PROCESS_LOSS_INDETERMINATE_PROOF=PASS
PRESTART_READY_SEAL_PROOF=PASS
SINGLE_READER_CONCURRENCY_PROOF=PASS
FIXED_ATTACH_PROTOCOL_PROOF=PASS
DORMANT_REVALIDATION_PROOF=PASS
R3G_E_REGRESSION_PROOF=PASS
FULL_REQUIRED_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

A stale review from before the final mutation is insufficient.

---

## 25. Explicit non-grants and stop conditions

This authorization does not grant:

```text
R4B-B2B implementation
rootless Docker B2A
abstract Unix-socket B2A
Docker start/exec/restart/stop/kill/remove
workload execution
running-subject creation
TTL ARM or TTL authority change
start-to-ARM deadline design
termination/containment mutation authority
final output evidence settlement
R3G-F E4 or R3G-F ASK
generic runCommand ASK
H4 completion
H6
K3-R6+
automatic PRESTART_READY owner recovery/takeover
post-crash cleanup/recovery authority
```

Implementation must stop and return to authorization if it requires any such authority, rootless live attach, undocumented Node socket internals, native `SO_PEERCRED` helper, new dependency/workflow, Docker CLI fallback, or a source path outside the authorized set.

---

## 26. Authorization acceptance criteria

This docs-only authorization may become canonical only if review agrees that:

```text
B2A is zero-start and zero-live-workload.
PRESTART_READY is live, non-serializable, module-sealed, and process-local.
B2A v1 live attach is rootful protected-path only.
The protected namespace—not lstat alone—closes modeled untrusted pathname replacement.
Host root is trusted; rootless B2A v1 is rejected.
ownerInstanceIdentity comes only from an unforgeable sealed trusted owner capability.
Persisted/serialized owner identity never recreates ownership authority.
Owner-claim uniqueness is atomic by prestartOutputOperationIdentity.
Only a freshly created owner claim can enter ATTACHING.
Existing owner-claim replay is non-durable and cannot fail or invalidate the active owner.
ATTACHING is the cancellation/POST-attach linearization point.
Durable failure records have closed deterministic contracts and exclude replay rejection.
Hard process loss is OWNER_LOST_INDETERMINATE / NON_REUSABLE, not fabricated durable failure evidence.
There is at most one live reader and one readiness capability.
R3G-E external behavior and package-root authority remain protected.
B2B remains separately unauthorized.
```

If review cannot accept those constraints, this authorization must not merge.

---

## 27. Final authorization statement

If and only if this document becomes canonical after exact-head CI and a fresh independent exact-head review, Kodac authorizes one subsequent bounded implementation of:

```text
KDO-H4-R4B-B2A
PRE-START OUTPUT OWNERSHIP + START PREPARATION
```

with maximum positive state:

```text
PRESTART_READY
```

and negative-space theorem:

```text
NO DOCKER START
NO LIVE WORKLOAD
NO TTL ARM
NO FINAL OUTPUT EVIDENCE
NO R3G-F E4
NO ROOTLESS LIVE ATTACH IN B2A V1
NO OWNER TAKEOVER OR POST-CRASH RECOVERY IN B2A V1
```

All later live-execution authority remains closed.
