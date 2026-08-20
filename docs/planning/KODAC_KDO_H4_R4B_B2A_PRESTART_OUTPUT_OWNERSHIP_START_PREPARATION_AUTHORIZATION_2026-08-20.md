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

It may establish and own a bounded output channel while the exact container remains pristine and never started. It may return only a live process-local `PRESTART_READY` capability.

It does **not** authorize any start mutation, live workload occurrence, TTL arming, terminal lifecycle claim, positive R3G-E E3 evidence, R3G-F E4, cleanup mutation, or successful execution settlement.

---

## 2. Canonical predecessor truth

Canonical readiness PR #132 established:

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

merge commit / canonical base for this authorization:
b4c660801133055db1371651c8956d6d64058925

merge tree:
38879e9fe097fbb4424fa37edd1b0912bb9d275d

ordered parents:
1. ccf08bbf007eae0794332c691838d5c96ce8f77b
2. f3c0a00eb5f3afb0c0150773c9b4477c2f5306bd

verified=true
reason=valid
```

This document converts only the B2A readiness result into a bounded future implementation authorization.

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

Docs-only merges after B1 did not change these runtime identities.

---

## 4. Why B2A requires a bounded R3G-E factorization

Canonical R3G-E currently performs a purpose-equivalent sequence:

```text
validate provider/socket/request
-> inspect exact container
-> derive channel identity
-> open fixed Docker attach
-> validate HTTP 101 upgrade
-> construct bounded multiplex accumulator
-> read until stream termination
-> finish terminal aggregation
-> return capture
```

That theorem is correct for R3G-E but has no pre-start readiness boundary. B2A therefore may factor internal attach/provenance/reader machinery so a trusted controller can prove:

```text
fixed attach established
AND exactly one bounded reader active
AND zero payload bytes accepted
AND exact container still pristine dormant
AND same live reader can later be consumed by separately authorized B2B
```

The factorization is authorized only if:

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

If the canonical R3G-E theorem cannot be preserved exactly, implementation must stop and return to authorization.

---

## 5. B2A positive theorem

A positive B2A result may claim only:

```text
One exact canonical B1 CREATED admission and durable reservation lineage were
validated. The exact Docker container was independently re-observed as the same
pristine never-started runsc subject. Kodac proved a rootful non-replaceable
Docker socket namespace, durably prepared one pre-start output operation, won
one atomic non-transferable ownership claim for that exact operation, entered
one process-local ATTACHING state, established exactly one fixed non-TTY Docker
attach with logs=0 while the container remained dormant, activated one trusted
bounded multiplex reader and one shared output accumulator, accepted zero raw
payload bytes, re-proved the container remained pristine dormant, and created
one module-sealed non-serializable PRESTART_READY capability. No Docker start
request was issued and no workload process was permitted to execute.
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

No reachable B2A production path may issue or wrap a purpose-equivalent form of:

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

## 7. Exact B1 predecessor required

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

The lineage must bind one exact:

```text
permitIdentity
reservationIdentity
executionAttemptIdentity
requirementIdentity
workloadIdentity
createOperationIdentity
createdAdmissionIdentity
container occurrence/name
container ID
```

B2A rejects structural lookalikes, missing durable commits, wrong lineage, caller-selected container IDs, synthetic observations, reconstructed partial evidence, or any identity mismatch.

---

## 8. Pristine dormant revalidation

Before pre-start preparation and again after attach/reader activation, B2A must independently re-observe the exact B1 container and preserve the canonical B1 negative-space theorem.

At minimum:

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

Any ambiguity or mismatch fails closed. B2A may not stop, kill, remove, recreate, or otherwise repair the subject.

---

## 9. Rootful non-replaceable Docker socket namespace theorem

### 9.1 Review finding resolved by narrowing B2A v1

Canonical R3F/R3G-E currently freeze the final Unix-socket endpoint identity and re-`lstat` it before and after requests. That does not, by itself, prevent a pathname replacement between validation and `connect(2)`.

Node.js 24 documents `http.request({ createConnection })` and Unix-domain `net.createConnection({ path })`, but exposes no stable public API in `node:net` for Linux `SO_PEERCRED` or for connecting through a previously opened filesystem socket inode. B2A must not depend on undocumented Node internals merely to claim a stronger theorem.

Therefore B2A v1 closes the race by narrowing the trusted-host namespace rather than pretending to pin an unavailable socket-file descriptor.

### 9.2 B2A v1 supports only a rootful protected pathname

Before B2A may prepare or claim ownership, the configured Docker socket path must satisfy all of these conditions:

```text
absolute canonical POSIX pathname
no abstract Unix socket
no symlink component
no `.` or `..` component
final entry is a Unix socket
final socket uid = 0
all ancestor components from `/` through the immediate parent are directories
all ancestor directory uid = 0
all ancestor directory mode & 0o022 = 0
```

For each ancestor and the final socket, the trusted snapshot must freeze canonical:

```text
device
inode
uid
gid
mode
file type
```

The immediate parent directory is the authority boundary for rename/unlink/create of the socket pathname. Because B2A requires that directory and every ancestor be root-owned and not group/other-writable, an untrusted non-root principal cannot replace the socket pathname between validation and connect.

Host root is explicitly inside the trusted host boundary for B2A v1. A host-root actor that can rename trusted `/run`-style entries can already replace or control the Docker daemon and is outside B2A's adversary theorem.

### 9.3 Rootless Docker is not authorized for B2A v1

```text
ROOTLESS_DOCKER_B2A_V1=NOT_AUTHORIZED
USER_OWNED_SOCKET_PARENT=REJECT
GROUP_WRITABLE_SOCKET_PARENT=REJECT
OTHER_WRITABLE_SOCKET_PARENT=REJECT
SYMLINK_ANCESTOR=REJECT
ABSTRACT_UNIX_SOCKET=REJECT
```

This restriction applies only to the new live pre-start attach authority. It does not retroactively change historical R3F/B1 claims.

### 9.4 Validation ordering

The complete namespace chain and final endpoint must be revalidated:

```text
A. before durable PRESTART_OUTPUT_PREPARED
B. immediately before the local ATTACHING transition
C. after the HTTP upgrade succeeds and before reader activation
D. during final pre-PRESTART_READY dormant revalidation
```

Any persistent identity or metadata change fails closed.

The implementation must not claim protection against transient mutation by trusted host root. It instead proves that an untrusted principal lacks filesystem authority to perform the replacement in the first place.

---

## 10. Exact Docker attach surface

The only new Docker operation authorized by B2A is:

```text
POST /v1.48/containers/{exact-container-id}/attach

query:
logs=0
stream=1
stdin=0
stdout=1
stderr=1

required result:
HTTP 101
Connection: Upgrade
Upgrade: tcp
Content-Type: application/vnd.docker.multiplexed-stream
```

The target ID comes only from validated B1 lineage. Docker API remains pinned to `1.48`.

B2A may not expose or accept:

```text
generic Docker request(method,path,body)
caller-selected method
caller-selected API path
caller-selected socket path
TCP/TLS/SSH Docker endpoint
Windows named pipe
rootless Docker socket
Docker CLI fallback
shell fallback
PATH lookup
```

---

## 11. Durable record contracts

All durable records are immutable plain canonical records, reject proxies/accessors/extra fields, use deterministic SHA-256 identities, and require exact schema validation before positive use.

One unified schema may define the record family with closed `$defs`/`oneOf` and `additionalProperties: false` throughout.

### 11.1 `SandboxPrestartOutputPrepared`

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

`preparedIdentity` is a deterministic identity over every preceding field.

### 11.2 `SandboxPrestartOutputPreparedCommit`

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

A positive new operation may continue only from a validated durable `created` disposition. `existing` never creates live readiness by itself.

### 11.3 `SandboxPrestartOwnershipClaim`

Required fields:

```text
version
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
createdAdmissionIdentity
trusted ownerInstanceIdentity
ownershipClaimIdentity
```

The claim is not a start-dispatch claim and grants only the right to attempt the fixed pre-start attach.

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

Only `disposition = created` may proceed toward `ATTACHING`.

`disposition = existing` always returns a bounded typed non-capability failure and must perform:

```text
ATTACH_CALLS=0
NEW_READER_COUNT=0
PRESTART_READY_COUNT=0
OWNER_TAKEOVER=NO
```

This remains true even when the replay supplies the same visible `ownerInstanceIdentity`.

### 11.5 `SandboxPrestartFailure`

One terminal failure record binds the exact B2A operation.

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

Allowed `failureCode` values are exactly:

```text
aborted
owner-already-claimed
socket-namespace-untrusted
socket-identity-changed
attach-failed
attach-protocol-invalid
reader-failed
payload-before-start
dormant-revalidation-failed
owner-lost
indeterminate
```

`ownerInstanceIdentity` is `null` only when failure occurs before an owner claim exists. From owner-claim onward it is mandatory and must equal the exact claimed owner.

`failureIdentity` deterministically hashes every preceding failure field. B1 lineage is validated transitively through the exact `preparedIdentity` and directly through `createdAdmissionIdentity`.

### 11.6 `SandboxPrestartFailureCommit`

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

The first terminal failure settlement for a `prestartOutputOperationIdentity` is atomic/create-once. A validated `existing` terminal failure is accepted only when it is byte/identity-equivalent to the same canonical terminal settlement; conflicting settlement is `INDETERMINATE` and cannot yield readiness.

After a prepared record exists, any terminal failure before `PRESTART_READY` must durably settle or return `INDETERMINATE`. Failure-commit uncertainty never permits attach retry, owner takeover, or capability creation.

---

## 12. Atomic owner-claim uniqueness and replay linearization

### 12.1 Uniqueness key

The durable owner-claim store must provide one atomic create-once operation keyed by exactly:

```text
prestartOutputOperationIdentity
```

At its linearization point, the candidate claim must be validated against the exact:

```text
preparedIdentity
executionAttemptIdentity
createdAdmissionIdentity
ownerInstanceIdentity
```

The store must not implement uniqueness as read-then-write in application code.

### 12.2 Only a fresh claim creates attach authority

```text
claim commit disposition = created
-> this exact process-local owner may continue

claim commit disposition = existing
-> typed OWNER_ALREADY_CLAIMED failure
-> no attach
-> no reader
-> no PRESTART_READY
```

There is no same-owner idempotent reattach exception in B2A v1.

### 12.3 Crash behavior

After a durable owner claim exists, loss of the live owner means:

```text
AUTOMATIC_OWNER_TAKEOVER=NO
AUTOMATIC_REATTACH=NO
AUTOMATIC_RETRY_WITH_NEW_OWNER=NO
DOCKER_START=NO
```

The container may remain safely dormant and stranded until a separately authorized recovery/cleanup theorem exists.

A durable owner claim never proves that a live stream or reader survived process restart.

---

## 13. Process-local state machine and cancellation linearization

B2A must implement one module-private state machine per freshly claimed operation:

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

The trusted runtime installs its abort handler before any attach-capable local transition.

### 13.2 `ATTACHING` is the attach linearization point

Only the process that received the durable ownership-claim commit with `disposition = created` may attempt the synchronous local transition:

```text
OWNER_CLAIMED -> ATTACHING
```

Immediately before that transition it must prove:

```text
signal.aborted = false
owner claim still fresh/created
state = OWNER_CLAIMED
trusted socket namespace still exact
container still eligible for attach
```

The transition itself is synchronous/module-private and must occur with no `await` between the final abort check and ownership of `ATTACHING`.

Cancellation that wins **before** `ATTACHING` must produce:

```text
POST /attach count = 0
state = FAILED or INVALIDATED
PRESTART_READY count = 0
```

Only the current `ATTACHING` owner may create the fixed HTTP request.

Immediately before calling `http.request`, production code must confirm the local state is still `ATTACHING`; there must be no asynchronous gap between that confirmation and request creation.

### 13.3 Cancellation after `ATTACHING`

Once `ATTACHING` owns a request/session, later cancellation must synchronously mark the local controller invalidated and destroy/close every owned request/socket/stream handle as they become available.

A late HTTP 101, late socket event, late reader activation, or late dormant revalidation after cancellation must not transition to `READER_ACTIVE` or `PRESTART_READY`.

### 13.4 `READER_ACTIVE` and `PRESTART_READY` linearization

After exact upgrade validation and socket-namespace revalidation, one bounded reader/accumulator may transition:

```text
ATTACHING -> READER_ACTIVE
```

Before the final capability creation, the runtime must synchronously prove:

```text
state = READER_ACTIVE
signal.aborted = false
reader live
accepted payload bytes = 0
post-attach dormant revalidation = PASS
socket namespace = exact
```

Only then may it transition synchronously:

```text
READER_ACTIVE -> PRESTART_READY
```

and create the module-sealed capability. Abort/invalidation that wins first blocks the capability permanently.

---

## 14. `PRESTART_READY` capability theorem

`PRESTART_READY` is not a durable record. It is a live process-local capability:

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
```

A module-private `WeakSet`, `WeakMap`, private nominal identity, or stronger equivalent must reject plain-object lookalikes, Proxies, JSON round-trips, structured clones, copied visible fields, stale handles, and invalidated handles.

No durable record may assert:

```text
hijacked stream is live
reader is active
PRESTART_READY survived process restart
```

No root-exported creator or structural validator is authorized.

---

## 15. One trusted bounded reader

HTTP 101 alone is insufficient. Before readiness, exactly one trusted reader/controller must own:

```text
exact live upgraded session
exact provider/socket/namespace provenance
exact executionAttemptIdentity
exact container ID
exact prestartOutputChannelIdentity
exact prestartOutputOperationIdentity
one shared stdout+stderr raw-payload accumulator
canonical Docker 8-byte multiplex framing parser
maxOutputBytes from exact requirement
abort/transport-loss invalidation
```

The same logical reader and accumulator must remain continuous for future B2B consumption; B2A does not authorize B2B consumption itself.

The reader may not expose raw socket/writable stream/stdin/per-stream budgets/unbounded buffering/TTY mode.

Any raw payload byte before a separately authorized start is an invariant violation. It must invalidate readiness, close the channel, durably settle terminal failure when a prepared record exists, and never start the container.

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
9. derive trusted ownerInstanceIdentity
10. atomically create-once owner claim keyed by prestartOutputOperationIdentity
11. require owner-claim disposition = created
12. install/confirm abort invalidation handler
13. revalidate protected socket namespace and dormant subject
14. synchronously win OWNER_CLAIMED -> ATTACHING
15. issue exactly one fixed POST /attach from the ATTACHING owner
16. validate HTTP 101, headers, media type, and protected namespace
17. activate exactly one bounded reader/accumulator
18. transition ATTACHING -> READER_ACTIVE
19. prove zero accepted raw payload bytes
20. independently reobserve pristine dormant container
21. revalidate protected socket namespace
22. atomically prove no abort/invalidation won
23. transition READER_ACTIVE -> PRESTART_READY
24. create one sealed live capability and return bounded result
```

No start-dispatch claim exists in B2A. Docker start count remains zero.

---

## 17. Cancellation, failure, and owner-loss outcomes

### Before prepared commit

```text
failure/abort
-> no owner claim
-> no attach
-> no start
```

### After prepared commit but before fresh owner claim

```text
terminal failure
-> durable SandboxPrestartFailure settlement required or INDETERMINATE
-> no attach
-> no start
```

### Existing owner claim

```text
disposition = existing
-> OWNER_ALREADY_CLAIMED
-> durable terminal failure settlement where canonical
-> no attach
-> no capability
-> no takeover
-> no start
```

### Cancellation before `ATTACHING`

```text
-> POST /attach count = 0
-> terminal failure settlement
-> no capability
-> no start
```

### Cancellation/failure during or after `ATTACHING`

```text
-> invalidate local state
-> destroy owned request/socket/stream
-> ignore late success events
-> durable terminal failure settlement or INDETERMINATE
-> no retry/reattach/takeover
-> no PRESTART_READY
-> no start
```

### Failure after `PRESTART_READY` but before future B2B consumption

```text
-> atomically invalidate capability
-> close reader/session
-> durably settle ready-invalidation failure
-> stale handle rejected
-> no start
```

Caller cancellation must never detach a live reader into an ownerless background task.

---

## 18. Concurrency and replay theorem

B2A must prove:

```text
concurrent prepare calls for one operation
-> exactly one or zero `created` owner-claim disposition
-> at most one ATTACHING owner
-> at most one attach session
-> at most one live reader
-> at most one PRESTART_READY capability

replay after any owner claim exists
-> existing disposition
-> bounded typed non-capability failure
-> no attach
-> no readiness

even same-owner replay
-> no attach
-> no readiness

structural clone / JSON round-trip / Proxy / stale capability
-> rejected
```

No API may reset or replenish the output byte budget after live ownership is established.

---

## 19. Relationship to R3G-E

R3G-E remains canonical. B2A may reuse only exact parser/identity/provenance/attach constants and a factored internal opener/reader primitive.

The factorized path must preserve:

```text
same fixed attach request
same Docker API 1.48
same non-TTY multiplex framing
same shared stdout+stderr raw-payload byte budget
same exact N acceptance
same N+1 fail-closed behavior
same malformed-frame rejection
same abort/transport-loss semantics or stricter fail-closed semantics
same no-budget-reset rule
same root-export restrictions
```

The new B2A rootful protected-namespace check is a **narrower trust prerequisite** for B2A. It need not retroactively rewrite R3G-E's historical evidence claim, but any shared newly factored attach primitive used by B2A must expose enough internal control to enforce the stronger B2A namespace theorem.

B2A does not commit positive `GvisorOutputBoundRecord`/E3 evidence because no workload execution or terminal lifecycle exists.

---

## 20. Relationship to R3G-D and future B2B

B2A TTL arm attempts must equal zero. No R3G-D production file may change.

Future B2B remains separately unauthorized and must still pin:

```text
exact Docker start mutation
atomic PRESTART_READY consumption
MAX_START_TO_ARM_INTERVAL_MS
trusted clock and deadline owner
deadline-miss exact-subject containment
unknown-start reconciliation
same-reader continuity across dormant -> running
running-subject R3G-D ARM
terminal lifecycle evidence
terminal output evidence
R3G-F E4 continuity
final permit consumption settlement
```

B2A success does not imply B2B readiness.

---

## 21. Package-root authority boundary

A later implementation may root-export only one bounded B2A gateway/result plus immutable validated metadata needed by trusted composition.

It must not root-export:

```text
raw Docker attach opener
raw Socket or hijacked stream
raw transport
caller-selected Docker path/method/socket
owner-claim creator
PRESTART_READY creator
structural PRESTART_READY validator
reader reopen/reset
byte-budget reset
socket namespace bypass
```

Deep-module helpers remain internal and are not product authority.

---

## 22. Authorized implementation surface

After this authorization is canonical, one B2A implementation PR may change only purpose-equivalent paths in this set:

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

The R3G-E changes are allowed only for internal factorization and regression proof.

No changes are authorized to R3G-D, R3G-F, B1, permit/policy, workflows, dependencies, package manifests, native helpers, Docker CLI integration, or external services.

If the theorem cannot be satisfied with public Node 24 APIs and this path set, implementation must stop and return to authorization rather than use undocumented internals or widen scope.

---

## 23. Required implementation proofs

### 23.1 Zero-start / zero-TTL

```text
positive path -> Docker start calls = 0
all failures -> Docker start calls = 0
all aborts -> Docker start calls = 0
all replay/concurrency -> Docker start calls = 0
TTL ARM attempts = 0
```

### 23.2 Protected socket namespace

Reject before durable attach ownership when any condition holds:

```text
rootless/user-owned socket
abstract socket
symlink final entry
symlink ancestor
non-directory ancestor
ancestor uid != 0
ancestor mode group-writable
ancestor mode other-writable
final socket uid != 0
namespace device/inode/uid/gid/mode change
```

Linux physical/integration evidence must prove the accepted B2A v1 path is rooted in a real protected root-owned namespace. Fixture-only success is insufficient for this trust theorem.

A hostile race test must exercise a test-only mutation hook between namespace validation and connect. Two outcomes are acceptable and must be distinguished:

```text
untrusted namespace / writable parent
-> validation rejects before ATTACHING

trusted protected rootful namespace
-> the threat model proves the test principal lacks rename/unlink/create authority;
   host-root mutation is explicitly outside the adversary theorem
```

No test may claim that pre/post `lstat` alone detects a transient host-root replace-and-restore race.

### 23.3 Exact B1 predecessor and dormant state

Reject forged/mismatched B1 lineage and every protected dormant-state deviation, including running/pid/restart/runtime/network/image/command/resource/privilege/TTY/stdin/stdout/stderr/host-authority drift.

### 23.4 Fixed attach protocol

Prove exactly:

```text
POST /v1.48/containers/{exact-id}/attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1
HTTP 101
Connection: Upgrade
Upgrade: tcp
application/vnd.docker.multiplexed-stream
```

Reject wrong status/headers/media type/container/path/method/timeout/abort/namespace drift.

### 23.5 Failure-record contract

Round-trip schema/validator tests must cover every exact failure phase and code, owner nullability rule, deterministic identity, durable commit binding, conflicting existing settlement, extra fields, proxies, accessors, and malformed identities.

### 23.6 Atomic owner claim and replay

Concurrency tests must prove one atomic key:

```text
prestartOutputOperationIdentity
```

and that only `created` may proceed. Explicitly test:

```text
same-owner replay -> existing -> no attach
other-owner replay -> existing -> no attach
concurrent race -> one created at most
read-then-write fake store -> rejected/not accepted as proof
```

### 23.7 Cancellation interleavings

Test cancellation immediately:

```text
before prepared commit
after prepared commit
before owner-claim linearization
after owner claim but before ATTACHING
immediately after ATTACHING before request creation
during request creation/handshake
after HTTP 101 before reader activation
after reader activation before post-attach revalidation
after revalidation before PRESTART_READY transition
after PRESTART_READY before B2B consumption
```

Every interleaving must prove no unauthorized capability and zero Docker start calls.

### 23.8 Reader/capability seal

Prove readiness impossible until one live bounded reader exists with zero accepted payload bytes and final dormant/namespace revalidation passed. Reject structural clone, Proxy, JSON round-trip, stale/invalidated handle, second use, second reader, reopen, and budget reset.

### 23.9 Owner loss

After a fresh durable owner claim, simulate abort, attach failure, reader failure, stream loss, owner teardown, and process-local capability loss. Prove no takeover, reattach, retry, or start.

### 23.10 R3G-E regression

Re-prove canonical Docker-stream framing, budget, fixed request, malformed-frame handling, abort handling, and root-export negative space after factorization.

---

## 24. Static forbidden-authority scan

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

## 25. Failure taxonomy

Public/bounded failure classes may be purpose-equivalent to:

```text
BLOCKED
REJECTED
UNPROVEN
INDETERMINATE
OWNER_ALREADY_CLAIMED
OWNER_LOST
SOCKET_NAMESPACE_UNTRUSTED
ATTACH_FAILED
READER_FAILED
DORMANT_REVALIDATION_FAILED
ABORTED
```

The durable `failurePhase` and `failureCode` enums in Section 11 remain the canonical evidence vocabulary; public error classes may group them but may not erase the durable reason.

No failure implies permit reuse, owner takeover, or execution success.

---

## 26. Product-PR merge gates

The future B2A implementation PR must not merge unless the exact final head proves:

```text
AUTHORIZED_CHANGED_PATHS_ONLY=PASS
NO_WORKFLOW_OR_DEPENDENCY_DRIFT=PASS
ZERO_DOCKER_START_PROOF=PASS
ZERO_TTL_ARM_PROOF=PASS
ROOTFUL_PROTECTED_SOCKET_NAMESPACE_PROOF=PASS
ROOTLESS_B2A_REJECTION_PROOF=PASS
PRESTART_FAILURE_SCHEMA_PROOF=PASS
ATOMIC_OWNER_CLAIM_PROOF=PASS
EXISTING_CLAIM_NO_REATTACH_PROOF=PASS
ATTACHING_CANCELLATION_LINEARIZATION_PROOF=PASS
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

## 27. Explicit non-grants

This authorization does not grant:

```text
R4B-B2B implementation
rootless Docker B2A
abstract Unix-socket B2A
Docker start
Docker exec
Docker restart
Docker stop
Docker kill
Docker remove
workload execution
running-subject creation
TTL ARM
TTL enforcement changes
start-to-ARM deadline design
termination/containment mutation authority
final output evidence settlement
R3G-F E4
R3G-F ASK enablement
generic runCommand ASK
H4 completion
H6
K3-R6+
automatic PRESTART_READY owner recovery/takeover
```

---

## 28. Stop conditions

Implementation must stop and return to authorization if it requires:

```text
Docker start to validate readiness
TTL ARM to validate readiness
container stop/kill/remove cleanup
owner takeover after durable claim
same-owner reattach after existing claim
reopening output after live start
R3G-D or R3G-F production changes
wider R3G-E root authority
caller-selectable socket/method/path
rootless live attach support
undocumented Node internal socket APIs
native SO_PEERCRED helper
new dependency
workflow change
Docker CLI fallback
path outside the authorized set
```

---

## 29. Authorization acceptance criteria

This docs-only authorization may become canonical only if review agrees that:

```text
B2A is zero-start and zero-live-workload.
PRESTART_READY is live, non-serializable, and module-sealed.
B2A v1 live attach is rootful protected-path only.
The protected namespace—not pre/post lstat alone—closes untrusted pathname replacement.
Host root is explicitly trusted; rootless B2A v1 is rejected.
Owner-claim uniqueness is atomic by prestartOutputOperationIdentity.
Only a freshly created owner claim can enter ATTACHING.
Existing claim always fails closed, even for the same visible owner.
ATTACHING is the cancellation/POST-attach linearization point.
Failure records and commits have closed deterministic contracts.
There is at most one live reader and one readiness capability.
Owner loss is non-transferable and fail-closed in B2A v1.
R3G-E external behavior and package-root authority remain protected.
B2B remains separately unauthorized.
```

If review cannot accept these constraints, this authorization must not merge.

---

## 30. Final authorization statement

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
```

All later live-execution authority remains closed.
