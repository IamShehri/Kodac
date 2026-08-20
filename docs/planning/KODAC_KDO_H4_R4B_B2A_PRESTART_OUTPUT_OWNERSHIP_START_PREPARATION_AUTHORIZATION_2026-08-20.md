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
socket namespace, crash-atomically created one durable pre-start prepared record
and its matching initial PREPARED operation-state fence, atomically transitioned
that operation from PREPARED to exactly one OWNER_CLAIMED state using an
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
A. before PRESTART preparation transaction
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

B2A v1 rejects rootless Docker sockets, user-owned socket namespaces, writable ancestors, symlink components, and abstract Unix sockets.

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

## 10. Crash-atomic durable preparation and initial state fence

All durable records must be immutable canonical non-proxy plain records, reject accessors and extra fields, use deterministic SHA-256 identities, and pass closed schema validation.

The prepared record and the initial per-operation `PREPARED` state are one crash-consistency boundary. They MUST NOT be two independently acknowledged durable writes.

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

### 10.3 Initial `PREPARED` state record

The same durable transaction that creates a new prepared record/commit must create one matching operation-state record purpose-equivalent to:

```text
state = PREPARED
prestartOutputOperationIdentity
preparedIdentity
executionAttemptIdentity
createdAdmissionIdentity
stateIdentity
```

The prepared commit and initial state record must be atomically visible together or not visible at all.

Required crash theorem:

```text
BEFORE_TRANSACTION_COMMIT:
prepared commit absent
PREPARED fence absent

AFTER_TRANSACTION_COMMIT:
prepared commit present
matching PREPARED fence present

FORBIDDEN DURABLE STATE:
prepared commit present
PREPARED/advanced fence absent
```

Only `disposition = created` from this crash-atomic transaction may establish the initial fence.

### 10.4 Existing prepared replay

If the prepared record already exists, the replay may never create or repair a missing state fence.

It must atomically read/validate the existing prepared record plus the operation-state fence and require both to bind the same:

```text
prestartOutputOperationIdentity
preparedIdentity
executionAttemptIdentity
createdAdmissionIdentity
```

The existing state may validly have advanced to:

```text
PREPARED
OWNER_CLAIMED
FAILED_TERMINAL
```

If the exact prepared record exists but no matching state fence exists, or if the state fence conflicts with the prepared lineage:

```text
PREPARATION_STATE_INDETERMINATE
NON_REUSABLE
NO_FENCE_REPAIR
NO_OWNER_CLAIM
NO_ATTACH
NO_PRESTART_READY
NO_START
```

A replay cannot transform a prepared-only orphan into a usable operation in B2A v1.

---

## 11. One atomic per-operation state fence

### 11.1 Purpose

Owner-claim creation and terminal-failure settlement are mutually exclusive transitions in **one atomic durable state domain** keyed exactly by:

```text
prestartOutputOperationIdentity
```

The state domain begins only through the crash-atomic preparation transaction in Section 10.

### 11.2 Durable state model

```text
PREPARED(exact prepared lineage)
OWNER_CLAIMED(exact prepared lineage, exact ownershipClaimIdentity, exact ownerInstanceIdentity)
FAILED_TERMINAL(exact prepared lineage, exact failureIdentity)
```

Permitted atomic transitions are exactly:

```text
PREPARED -> OWNER_CLAIMED
PREPARED -> FAILED_TERMINAL
OWNER_CLAIMED -> FAILED_TERMINAL
```

Forbidden transitions include:

```text
FAILED_TERMINAL -> OWNER_CLAIMED
FAILED_TERMINAL -> PREPARED
OWNER_CLAIMED(A) -> OWNER_CLAIMED(B)
OWNER_CLAIMED -> PREPARED
FAILED_TERMINAL(A) -> FAILED_TERMINAL(B) when identities conflict
ABSENT -> OWNER_CLAIMED
ABSENT -> FAILED_TERMINAL
ABSENT -> PREPARED outside the Section 10 preparation transaction
```

`FAILED_TERMINAL` is absorbing in B2A v1.

### 11.3 Atomicity and linearization

The persistence primitive must expose one transaction/CAS/create-once mechanism whose linearization point reads and writes this state under the same uniqueness key.

It must not implement the theorem with independent prepared/state/owner/failure stores whose acknowledged outcomes can conflict.

### 11.4 Claim-versus-failure race

For concurrent transitions from `PREPARED`:

```text
owner claim wins first
-> durable state = OWNER_CLAIMED
-> pre-owner failure cannot also succeed

terminal failure wins first
-> durable state = FAILED_TERMINAL
-> owner claim cannot succeed
-> ATTACH_CALLS=0
-> PRESTART_READY_COUNT=0
```

Exactly one transition may win.

An existing `FAILED_TERMINAL` state yields a bounded non-capability result and no new authority.

### 11.5 Failure after owner claim

A process holding the exact fresh sealed owner capability may atomically transition:

```text
OWNER_CLAIMED(exact owner) -> FAILED_TERMINAL(exact failure)
```

only when the failure binds the same prepared/operation/attempt/owner lineage.

---

## 12. Unforgeable owner-instance capability and durable ownership claim

### 12.1 Owner identity source

`ownerInstanceIdentity` is not a caller argument, serialized capability, environment value, PID, hostname, timestamp, or caller-supplied string.

Trusted K2 composition must create one **process-local owner-instance capability** using public Node 24 cryptographic randomness of at least 256 bits inside the trusted module. The capability must be module-sealed by private nominal identity, `WeakSet`/`WeakMap`, private class state, or stronger equivalent.

The durable `ownerInstanceIdentity` is derived only inside the trusted module from that sealed capability using a domain-separated SHA-256 identity.

Required invariants:

```text
CALLER_CAN_SUPPLY_OWNER_INSTANCE_IDENTITY=NO
CALLER_CAN_DESERIALIZE_OWNER_CAPABILITY=NO
CALLER_CAN_VALIDATE_OWNER_BY_STRUCTURE=NO
SERIALIZED_OWNER_IDENTITY_GRANTS_AUTHORITY=NO
PID_OR_HOSTNAME_ALONE_GRANTS_AUTHORITY=NO
```

### 12.2 `SandboxPrestartOwnershipClaim`

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

### 12.3 Atomic claim transition

Owner-claim creation is the atomic transition:

```text
PREPARED -> OWNER_CLAIMED(exact claim, exact owner)
```

inside the Section 11 state fence. It is impossible if the fence is absent or terminal.

### 12.4 `SandboxPrestartOwnershipClaimCommit`

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

Only `disposition = created`, produced by successful `PREPARED -> OWNER_CLAIMED`, grants the matching sealed owner the right to attempt `ATTACHING`.

If state is already `OWNER_CLAIMED`, replay returns a bounded **non-durable** response only:

```text
OWNER_ALREADY_CLAIMED
ATTACH_CALLS=0
NEW_READER_COUNT=0
PRESTART_READY_COUNT=0
OWNER_TAKEOVER=NO
DURABLE_FAILURE_SETTLEMENT=NO
```

Replay must not mutate, fail, invalidate, replace, or otherwise interfere with the active owner.

If state is `FAILED_TERMINAL` or the preparation fence is missing/conflicting, no ownership commit is returned and no attach is allowed.

There is no same-owner idempotent reattach exception.

---

## 13. Durable failure contract

Durable failure settlement uses the same Section 11 per-operation state fence as owner-claim creation.

### 13.1 `SandboxPrestartFailure`

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

`owner-already-claimed` is deliberately absent.

`ownerInstanceIdentity` is null only for `PREPARED -> FAILED_TERMINAL`. For `OWNER_CLAIMED -> FAILED_TERMINAL`, it must equal the exact claimed owner and the transition actor must hold the matching sealed owner capability.

### 13.2 `SandboxPrestartFailureCommit`

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

A `created` failure commit exists only when the shared state fence successfully reaches `FAILED_TERMINAL(exact failureIdentity)`.

An exact `existing` failure is acceptable only when the fence already contains the same terminal identity. Conflicting settlement is `INDETERMINATE / NON_REUSABLE`.

### 13.3 Pre-owner failure

While state is `PREPARED`, an authoritative live actor may attempt `PREPARED -> FAILED_TERMINAL`.

If it wins, every later owner claim is fenced out atomically.

If an owner claim wins first, a null-owner pre-owner failure may not commit afterward.

### 13.4 Hard process loss

If an owner process disappears without settlement, no authorized post-crash actor may invent terminal failure evidence.

The surviving durable `OWNER_CLAIMED` state is the fail-closed recovery fence.

A later process with no matching sealed owner capability classifies locally:

```text
OWNER_LOST_INDETERMINATE
NON_REUSABLE
NO_REATTACH
NO_TAKEOVER
NO_START
```

Graceful teardown while the exact owner remains alive may settle `owner-lost-graceful`. Hard crash may not be rewritten as graceful evidence.

---

## 14. Process-local state machine and attach linearization

For a successful durable `OWNER_CLAIMED` state, the matching sealed controller uses:

```text
OWNER_CLAIMED_LOCAL -> ATTACHING -> READER_ACTIVE -> PRESTART_READY
```

Terminal local states:

```text
FAILED
INVALIDATED
```

The local controller must remain consistent with the durable state fence and cannot create readiness after durable `FAILED_TERMINAL`.

### 14.1 Abort registration

Install the abort/invalidation handler before any attach-capable local transition.

### 14.2 `ATTACHING` linearization

Only the process holding both:

```text
durable state = OWNER_CLAIMED(exact owner)
AND matching sealed owner capability
```

may synchronously enter `ATTACHING`.

Immediately before the transition prove:

```text
signal.aborted = false
local state = OWNER_CLAIMED_LOCAL
durable state still = exact OWNER_CLAIMED
owner capability valid
protected socket namespace exact
container still pristine dormant
```

There must be no `await` between the final abort/owner checks and ownership of `ATTACHING`.

Cancellation before `ATTACHING` means zero attach requests.

Only the `ATTACHING` owner may construct the fixed HTTP request, with no asynchronous gap after final local-state confirmation.

### 14.3 Cancellation after `ATTACHING`

Later cancellation synchronously invalidates the controller and destroys/ closes every owned request/socket/stream handle as available. Late HTTP 101, socket events, reader activation, revalidation, or capability construction cannot become success.

### 14.4 `READER_ACTIVE` and readiness

After exact upgrade and namespace validation:

```text
ATTACHING -> READER_ACTIVE
```

Before capability creation prove synchronously:

```text
local state = READER_ACTIVE
durable state = exact OWNER_CLAIMED
signal.aborted = false
owner capability valid
reader live
accepted raw payload bytes = 0
post-attach dormant revalidation = PASS
socket namespace exact
```

Only then may `READER_ACTIVE -> PRESTART_READY` occur.

---

## 15. `PRESTART_READY` capability theorem

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
bound to exact sealed owner capability
valid only while durable state remains OWNER_CLAIMED for that owner
```

Plain-object lookalikes, Proxies, JSON round-trips, structured clones, copied fields, stale handles, invalidated handles, and cross-process handles must fail validation.

No durable record may assert stream/reader/capability survival across process restart.

---

## 16. One trusted bounded reader

Before readiness, exactly one trusted reader/controller must own:

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

The same logical reader and accumulator must remain continuous for future B2B consumption. B2A does not authorize that consumption.

Any raw payload byte before separately authorized start is an invariant violation. The exact owner must invalidate readiness, close the channel, atomically settle durable failure if still alive/authoritative, and never start the container.

---

## 17. Required positive ordering

```text
1. validate exact B1 lineage and durable commits
2. derive exact requirement/workload/attempt identities
3. validate rootful protected Docker socket namespace
4. independently reobserve exact B1 container
5. prove pristine never-started state
6. derive deterministic channel and operation identities
7. construct canonical PRESTART_OUTPUT_PREPARED
8. in one crash-atomic transaction create prepared record/commit + initial PREPARED state fence
9. if prepared already exists, require matching existing state fence; never repair a missing fence
10. create sealed process-local owner-instance capability internally
11. derive ownerInstanceIdentity internally; accept no caller identity
12. atomically attempt PREPARED -> OWNER_CLAIMED
13. require claim transition disposition = created
14. install/confirm abort invalidation handler
15. revalidate durable OWNER_CLAIMED, protected namespace, and dormant subject
16. synchronously enter ATTACHING
17. issue exactly one fixed POST /attach
18. validate HTTP 101, headers, media type, and namespace
19. activate exactly one bounded reader/accumulator
20. transition ATTACHING -> READER_ACTIVE
21. prove zero accepted raw payload bytes
22. independently reobserve pristine dormant container
23. revalidate protected namespace and durable OWNER_CLAIMED
24. prove no abort/invalidation won
25. transition READER_ACTIVE -> PRESTART_READY
26. create one sealed live capability and return bounded result
```

No start-dispatch claim exists. Docker start count remains zero.

---

## 18. Replay, crash, cancellation, failure, and process-loss outcomes

### Crash during initial preparation transaction

```text
crash before transaction commit
-> prepared commit absent
-> PREPARED fence absent
-> no owner claim / attach

transaction committed
-> prepared commit and matching PREPARED fence both durable

prepared commit exists but fence absent/conflicting
-> PREPARATION_STATE_INDETERMINATE
-> NON_REUSABLE
-> NO_FENCE_REPAIR
-> no owner claim / attach / readiness / start
```

### Exact prepared replay

```text
existing prepared + matching PREPARED state
-> may compete for owner claim

existing prepared + matching OWNER_CLAIMED state
-> no new owner / no replay attach

existing prepared + matching FAILED_TERMINAL state
-> terminal/non-reusable

existing prepared + absent/conflicting state fence
-> indeterminate/non-reusable; no repair
```

### Existing owner replay

```text
-> non-durable OWNER_ALREADY_CLAIMED only
-> no failure commit
-> no active-owner mutation
-> no attach/reader/readiness/takeover/start
```

### Terminal failure before claim

```text
PREPARED -> FAILED_TERMINAL wins
-> every later owner claim fails atomically
-> no attach/readiness/start
```

### Concurrent failure versus claim

```text
exactly one authoritative transition wins
-> OWNER_CLAIMED or FAILED_TERMINAL
-> never both
```

### Cancellation before `ATTACHING`

The exact owner may settle `aborted` through `OWNER_CLAIMED -> FAILED_TERMINAL`; no attach/capability/start may follow.

### Cancellation/failure after `ATTACHING`

```text
-> invalidate local state
-> destroy owned handles
-> ignore late success
-> exact owner transitions OWNER_CLAIMED -> FAILED_TERMINAL or returns INDETERMINATE
-> no retry/reattach/takeover/readiness/start
```

### Graceful failure after readiness

While exact owner remains alive:

```text
-> invalidate capability
-> close reader/session
-> OWNER_CLAIMED -> FAILED_TERMINAL(exact cause)
-> stale handle rejected
-> no start
```

### Hard process loss

```text
-> no fabricated failure commit
-> durable OWNER_CLAIMED survives
-> later local classification = OWNER_LOST_INDETERMINATE
-> non-reusable
-> no takeover/reattach/start
```

---

## 19. Concurrency, spoofing, and replay theorem

The implementation must prove:

```text
prepared transaction crash boundary
-> never durable prepared-only success without matching state fence

existing prepared without matching state fence
-> cannot repair or advance

concurrent PREPARED -> OWNER_CLAIMED attempts
-> at most one winner

concurrent PREPARED -> FAILED_TERMINAL and PREPARED -> OWNER_CLAIMED
-> never both durable states

terminal failure already durable
-> later claim impossible

OWNER_CLAIMED already durable
-> replay cannot mutate/fail/invalidate active owner

persisted ownerInstanceIdentity copied into another process
-> cannot create valid owner capability
-> cannot enter ATTACHING

structural owner/PRESTART_READY clones, JSON, Proxy, stale/cross-process handles
-> rejected

hard process loss
-> surviving OWNER_CLAIMED fences takeover/reattach/start
```

No API may reset or replenish output byte budget after live ownership is established.

---

## 20. Relationship to R3G-E, R3G-D, and future B2B

R3G-E remains canonical. B2A may reuse only exact parser/identity/provenance/attach constants and a factored internal opener/reader primitive.

The factorized path must preserve R3G-E's fixed request, Docker API 1.48, non-TTY framing, shared stdout+stderr raw-payload byte budget, exact N acceptance, N+1 fail-closed behavior, malformed-frame rejection, abort/transport-loss behavior, no-budget-reset rule, and package-root restrictions.

B2A commits no positive R3G-E E3 evidence.

B2A TTL arm attempts equal zero; R3G-D production files may not change.

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

## 21. Package-root authority boundary

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
prepared/state repair primitive
operation-state transition primitive
failure-state transition primitive
PRESTART_READY creator
structural PRESTART_READY validator
reader reopen/reset
byte-budget reset
socket namespace bypass
post-crash takeover/recovery primitive
```

Deep-module helpers remain internal and do not become product authority.

---

## 22. Authorized implementation surface

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

Reject rootless/user-owned/abstract/symlink/writable-parent configurations and every device/inode/uid/gid/mode/type drift. Linux evidence must prove the accepted path is inside a real root-owned protected namespace.

A mutation-hook test must distinguish an untrusted writable namespace from the accepted protected rootful theorem. No test may claim pre/post `lstat` alone detects transient host-root replacement.

### 23.3 Exact B1 and dormant state

Reject forged/mismatched B1 lineage and every running/pid/restart/runtime/network/image/command/resource/privilege/TTY/stdin/stdout/stderr/host-authority drift.

### 23.4 Fixed attach protocol

Prove exactly the authorized POST/1.48/query/HTTP-101/headers/media-type contract and reject all deviations.

### 23.5 Prepared transaction crash atomicity

Use a fault-injected durable store to prove the prepared record/commit and initial `PREPARED` state fence form one crash-atomic transaction.

Required cut points:

```text
crash before durable transaction commit -> neither visible
crash during persistence -> never acknowledge prepared-only success
crash after transaction commit -> both visible and lineage-equivalent
```

Also prove:

```text
existing prepared + missing fence -> INDETERMINATE/NON_REUSABLE
existing prepared + conflicting fence -> INDETERMINATE/NON_REUSABLE
replay cannot create/repair a missing fence
only disposition=created transaction establishes initial PREPARED fence
```

### 23.6 Prepared/failure schema

Round-trip validators must prove deterministic identities, durability, exact key sets, closed enums, owner-nullability rules, conflicting settlement behavior, Proxy/accessor/extra-field rejection, and malformed identity rejection. `owner-already-claimed` cannot be a durable failure code.

### 23.7 Shared per-operation state fence

Use one hostile deterministic store harness to prove:

```text
key = exact prestartOutputOperationIdentity
initial PREPARED exists only from crash-atomic preparation transaction
PREPARED -> OWNER_CLAIMED atomic
PREPARED -> FAILED_TERMINAL atomic
OWNER_CLAIMED -> FAILED_TERMINAL atomic
FAILED_TERMINAL absorbing
ABSENT cannot jump to OWNER_CLAIMED/FAILED_TERMINAL
```

Required races:

```text
claim vs pre-owner failure -> one winner, never both
failure first -> later claim impossible
claim first -> null-owner pre-owner failure impossible
owner A vs owner B -> at most one owner
conflicting failure A vs B -> never two terminal identities
store timeout/indeterminate settlement -> no attach/readiness/retry
```

An implementation using independently writable prepared/state/owner/failure stores or read-then-write coordination is insufficient proof.

### 23.8 Unforgeable owner capability

Prove caller-provided/serialized owner identities and structural/Proxy/JSON/cross-process capability lookalikes grant no authority. Two fresh owner capabilities derive distinct identities.

### 23.9 Existing claim replay

Prove same-owner and other-owner replays are non-durable, create no failure commit, do not affect active owner state, and create no attach/readiness.

### 23.10 Cancellation interleavings

Test cancellation before/after the crash-atomic preparation transaction, state-fence claim/failure linearization, `ATTACHING`, request creation, HTTP 101, reader activation, dormant revalidation, and `PRESTART_READY`. Every interleaving proves zero Docker start and no unauthorized capability.

### 23.11 Reader/capability seal

Prove readiness impossible until one live bounded reader exists with zero accepted payload bytes and final dormant/namespace/durable-owner validation passed. Reject second reader, reopen, reset, clone, stale handle, and cross-process handle reconstruction.

### 23.12 Process loss

```text
graceful owner loss while actor alive
-> OWNER_CLAIMED -> FAILED_TERMINAL allowed for exact owner
-> invalidate capability/controller
-> no start

hard process loss
-> no fabricated failure commit
-> durable OWNER_CLAIMED remains
-> later OWNER_LOST_INDETERMINATE / NON_REUSABLE
-> no takeover/reattach/start
```

### 23.13 R3G-E regression

Re-prove canonical framing, budget, fixed request, malformed-frame handling, abort handling, and root-export negative space after factorization.

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

## 25. Product-PR merge gates

The future implementation PR must not merge unless the exact final head proves:

```text
AUTHORIZED_CHANGED_PATHS_ONLY=PASS
NO_WORKFLOW_OR_DEPENDENCY_DRIFT=PASS
ZERO_DOCKER_START_PROOF=PASS
ZERO_TTL_ARM_PROOF=PASS
ROOTFUL_PROTECTED_SOCKET_NAMESPACE_PROOF=PASS
ROOTLESS_B2A_REJECTION_PROOF=PASS
PREPARED_TRANSACTION_CRASH_ATOMICITY_PROOF=PASS
ORPHAN_PREPARED_NON_REUSABLE_PROOF=PASS
PRESTART_SCHEMA_PROOF=PASS
ATOMIC_OPERATION_STATE_FENCE_PROOF=PASS
CLAIM_VS_TERMINAL_FAILURE_RACE_PROOF=PASS
TERMINAL_FAILURE_BLOCKS_LATER_CLAIM_PROOF=PASS
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

## 26. Explicit non-grants and stop conditions

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
repair of orphaned prepared/state metadata
```

Implementation must stop and return to authorization if it requires any such authority, rootless live attach, independently writable prepared/state/owner/failure stores, undocumented Node socket internals, native `SO_PEERCRED` helper, new dependency/workflow, Docker CLI fallback, or a source path outside the authorized set.

---

## 27. Authorization acceptance criteria

This docs-only authorization may become canonical only if review agrees that:

```text
B2A is zero-start and zero-live-workload.
PRESTART_READY is live, non-serializable, module-sealed, and process-local.
B2A v1 live attach is rootful protected-path only.
The protected namespace—not lstat alone—closes modeled untrusted pathname replacement.
Host root is trusted; rootless B2A v1 is rejected.
Prepared record/commit and initial PREPARED state fence are one crash-atomic transaction.
An existing prepared record without its matching fence is indeterminate/non-reusable and cannot be repaired in B2A v1.
ownerInstanceIdentity comes only from an unforgeable sealed trusted owner capability.
Persisted/serialized owner identity never recreates ownership authority.
Owner claim and terminal failure are mutually exclusive transitions in one atomic state fence.
A durable terminal failure blocks every later owner claim/attach/readiness transition.
Only a freshly created OWNER_CLAIMED transition can enter ATTACHING.
Existing owner replay is non-durable and cannot fail or invalidate the active owner.
ATTACHING is the cancellation/POST-attach linearization point.
Hard process loss is OWNER_LOST_INDETERMINATE / NON_REUSABLE, not fabricated durable failure evidence.
There is at most one live reader and one readiness capability.
R3G-E external behavior and package-root authority remain protected.
B2B remains separately unauthorized.
```

If review cannot accept those constraints, this authorization must not merge.

---

## 28. Final authorization statement

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
NO OWNER CLAIM AFTER DURABLE TERMINAL FAILURE
NO REPAIR/ADVANCE FROM ORPHANED PREPARED METADATA
```

All later live-execution authority remains closed.
