# KODAC KDO H4-R4B-B2A — Pre-start Output Ownership + Start Preparation Authorization

Date: 2026-08-20
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — NO LIVE START AUTHORITY**

## 1. Decision

This document authorizes, **only after this document itself becomes canonical**, one bounded future implementation slice:

```text
KDO-H4-R4B-B2A
PRE-START OUTPUT OWNERSHIP + START PREPARATION
```

Maximum positive state:

```text
PRESTART_READY
```

The authorization is intentionally narrower than monolithic R4B-B2.

It authorizes preparation and ownership of the exact Docker output channel while the already-created B1 subject remains pristine and dormant. It does **not** authorize Docker start, workload execution, TTL ARM, final output evidence, termination mutation, or any later H4/H6 authority.

Absolute negative-space theorem:

```text
DOCKER_START_CALLS=0
WORKLOAD_PROCESS_OCCURRENCES=0
RUNNING_SUBJECTS_CREATED_BY_B2A=0
TTL_ARM_ATTEMPTS=0
R3G_F_E4=NO
H4_COMPLETE=NO
```

---

## 2. Canonical base and predecessor

This authorization candidate is based on:

```text
repository=TheHalfMoon/Kodac
canonical_main=b4c660801133055db1371651c8956d6d64058925
canonical_tree=38879e9fe097fbb4424fa37edd1b0912bb9d275d
PR_132=MERGED_CANONICAL
R4B_B2_READINESS_AUDIT_BLOB=14991c3b512a49e0ab6c78c5ccbecee732c1e15c
```

Canonical predecessor:

```text
R4B-B1=DORMANT_DOCKER_CREATE_ADMISSION / MERGED_CANONICAL_PROVEN
PR_130=MERGED_CANONICAL
B1_merge=ff455b648632b37c2460353c36f447e797b17e4e
```

Relevant source identities at the canonical base include:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
blob=a917577d154ed14d7fd0528a69242846c53a7af3

packages/kodac-runtime/src/trust/sandbox-admission-dormant-create.ts
blob=b744c2c5150d7dfaf53075416fa93bd54de89d05

packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
blob=f9e2dda11fe26d481e2e6c328c37cd37a6260106

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
blob=26b0f8094afb8e61ec29e05496c7aa91bf2f6e7f

packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
blob=b55e5068682d9ae824a619b682c694c3a95e6095

packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
blob=6d1227c6f545194c644ec5b9bc7d07135fc789e2

packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
blob=4e094b54cbe2c301deff5ecb64634199fca2c425

packages/kodac-runtime/src/index.ts
blob=90ee90846abc3780bfbc4cd398269201f9babe41
```

Docker contracts remain pinned to:

```text
Docker API=1.48
Moby source commit=d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
```

The Docker CLI foreground create -> attach -> start ordering at commit
`28f756087eea5fa301f3fbf12b01ae62f91521c2` is architecture evidence only. No Docker CLI code, dependency, shell fallback, or runtime authority is imported.

---

## 3. Why B2A exists

Canonical R3G-E currently opens Docker attach with:

```text
logs=0
stream=1
stdin=0
stdout=1
stderr=1
```

and consumes the stream through terminal aggregation.

Because `logs=0`, starting before the trusted bounded reader owns the live stream could allow early output bytes to escape the exact bounded accumulator.

Therefore the first live-start slice must not be allowed to start until a separately proven pre-start output owner exists.

B2A establishes only that precondition.

---

## 4. Exact future positive ordering

A future B2A implementation may succeed only through this ordering:

```text
exact canonical B1 CREATED admission
-> exact pristine dormant revalidation
-> protected Docker socket namespace + client-authority validation
-> crash-atomic prepared transaction
-> fresh module-sealed owner capability
-> crash-atomic PREPARED -> OWNER_CLAIMED transaction
-> owner-local bounded deadline controller armed
-> final pre-attach abort/owner/socket/dormant checks
-> ATTACHING linearization
-> exact fixed Docker POST /attach
-> valid HTTP 101 upgrade
-> socket namespace revalidation
-> one trusted bounded multiplex reader becomes READER_ACTIVE
-> zero pre-start raw payload bytes confirmed
-> exact post-attach pristine dormant revalidation
-> final durable-owner/socket/deadline checks
-> PRESTART_READY
```

No step may imply Docker start.

---

## 5. Exact B1 lineage and pristine dormant subject

B2A must validate the exact canonical B1 CREATED admission lineage and its durable commit before creating any B2A state.

The exact container ID must be reobserved and must remain equivalent to B1 with at least:

```text
runtime=runsc
network_mode=none
network_attachment_count=0
restart_policy=no
privileged=false
tty=false
attach_stdout=true
attach_stderr=true
attach_stdin=false
open_stdin=false
running=false
pid=0
restart_count=0
exact image identity
exact executable
exact args
exact resource policy
exact binding labels
no new host authority
```

B2A may not repair drift.

If any pristine-dormant invariant fails:

```text
NO_ATTACH
NO_RECREATE
NO_STOP
NO_KILL
NO_REMOVE
NO_START
NO_TTL_ARM
```

---

## 6. Docker socket trust theorem

### 6.1 No false endpoint-binding claim

B2A v1 does not claim a nonexistent public Node 24 primitive for Linux `SO_PEERCRED`, connect-through-an-opened-socket-inode semantics, or stable POSIX ACL enumeration.

B2A therefore narrows the accepted host/socket configuration instead of treating pre/post pathname checks as a universal endpoint-authentication theorem.

Host root and explicit host provisioning policy are inside the trusted host boundary.

### 6.2 Canonical namespace requirements

The configured Docker socket path must be:

```text
absolute canonical POSIX pathname
not an abstract Unix socket
contain no symlink component
contain no . component
contain no .. component
final entry type=Unix socket
final socket uid=0
final socket gid=0
final socket permission bits exactly 0600
all ancestors from / through immediate parent are directories
all ancestor uid=0
all ancestor mode & 0o022 = 0
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

Revalidate the complete chain at four gates:

```text
A. before the preparation transaction
B. immediately before ATTACHING
C. after HTTP upgrade and before reader activation
D. during final pre-PRESTART_READY validation
```

Mode/ownership drift at any gate invalidates the attempt.

### 6.3 Docker socket client-access policy

B2A v1 is **root-client only**.

The B2A process must prove through public Node process credentials:

```text
process effective uid=0
process effective gid=0
```

No caller-supplied uid, gid, group, or authorization string is accepted.

The accepted socket permission theorem is intentionally narrower than normal `0660 root:docker` deployments:

```text
SOCKET_UID=0
SOCKET_GID=0
SOCKET_MODE_BITS=0600
GROUP_ACCESS=DENIED
OTHER_ACCESS=DENIED
B2A_CLIENT_EUID=0
```

A host using a Docker group, world-writable socket, user-owned rootless socket, or any additional non-root socket grantee is outside B2A v1.

### 6.4 ACL policy

POSIX ACLs can grant access beyond ordinary mode bits. B2A must not claim otherwise.

Accepted B2A v1 deployment policy is:

```text
NONTRIVIAL_DOCKER_SOCKET_ACCESS_ACL=FORBIDDEN
NONTRIVIAL_ANCESTOR_ACCESS_ACL_GRANTING_SOCKET_REACHABILITY=FORBIDDEN
```

Because the authorized implementation is limited to public Node 24 APIs and no native helper / `getfacl` dependency is authorized, ACL absence is a **trusted host-provisioning precondition**, not a caller-provided runtime assertion.

The implementation may proceed only on a deployment whose canonical host policy positively guarantees that no additional ACL grants exist. If the implementation cannot bind that host-policy fact without widening authority or adding a helper/dependency, it must stop and return to authorization.

No environment variable, request field, caller string, or serialized record may self-attest ACL safety.

### 6.5 Peer-authorization semantics

B2A v1 does not invent application-level Docker peer authentication.

Client authority is constrained by the root-only Unix-socket DAC theorem above. Server identity is constrained by the protected canonical root-owned namespace and repeated endpoint identity checks. Transient replacement by trusted host root remains outside the modeled untrusted-principal theorem.

The exact theorem is:

```text
UNTRUSTED_NON_ROOT_PATH_REPLACEMENT=PREVENTED_BY_NAMESPACE_PERMISSIONS
UNTRUSTED_NON_ROOT_SOCKET_CONNECT=DENIED_BY_ROOT_ONLY_SOCKET_POLICY
HOST_ROOT=TRUSTED_HOST_BOUNDARY
TRANSIENT_HOST_ROOT_REPLACE_AND_RESTORE=OUT_OF_SCOPE
SO_PEERCRED_CLAIM=NO
```

---

## 7. Exact Docker attach surface

The only new Docker operation authorized by B2A is:

```text
POST /v1.48/containers/{exact-container-id}/attach
?logs=0&stream=1&stdin=0&stdout=1&stderr=1
```

Required upgrade:

```text
HTTP status=101
Connection=upgrade
Upgrade=tcp
expected Docker attach media type
non-TTY multiplex framing
```

Forbidden:

```text
any generic method input
any generic Docker path input
any caller-supplied socket path
any caller-supplied container id that is not exact B1 lineage
Docker CLI fallback
shell fallback
start
exec
restart
stop
kill
remove
```

---

## 8. Durable preparation transaction

### 8.1 Identity

Define one exact:

```text
prestartOutputOperationIdentity
```

bound to the exact:

```text
preparedIdentity
executionAttemptIdentity
createdAdmissionIdentity
containerId
requirementIdentity
workloadIdentity
providerIdentity
socketEndpointIdentity
```

### 8.2 Crash-atomic creation

The durable prepared record, prepared commit, and initial state fence:

```text
PREPARED(exact lineage)
```

must be one crash-atomic transaction.

Observable results are only:

```text
all three visible and mutually equivalent
OR
none visible
```

No prepared-only acknowledged state is valid.

Only the transaction result `created` may establish initial `PREPARED`.

A replay that sees a prepared record without a matching state fence must return only:

```text
PREPARATION_STATE_INDETERMINATE
NON_REUSABLE
NO_FENCE_REPAIR
NO_OWNER_CLAIM
NO_ATTACH
NO_PRESTART_READY
NO_START
```

Replay may never manufacture or repair a missing state fence.

---

## 9. Shared per-operation durable state fence

There is exactly one atomic durable state machine keyed by the exact `prestartOutputOperationIdentity`:

```text
PREPARED(exact lineage)
OWNER_CLAIMED(exact lineage, exact claim, exact owner)
FAILED_TERMINAL(exact lineage, exact failureIdentity)
```

Allowed atomic transitions:

```text
PREPARED -> OWNER_CLAIMED
PREPARED -> FAILED_TERMINAL
OWNER_CLAIMED -> FAILED_TERMINAL
```

Rules:

```text
FAILED_TERMINAL is absorbing
ABSENT cannot jump to OWNER_CLAIMED
ABSENT cannot jump to FAILED_TERMINAL
FAILED_TERMINAL -> OWNER_CLAIMED is impossible
owner claim and pre-owner terminal failure cannot both win
```

Prepared, owner, and failure metadata may not be independently writable stores whose correctness depends on read-then-write coordination.

---

## 10. Unforgeable process-local owner capability

The owner capability must be:

```text
created only inside the trusted B2A module
backed by >=256 bits of Node cryptographic randomness
module-sealed
non-serializable
non-structural
not caller-constructible
not reconstructible from ownerInstanceIdentity
not reconstructible from PID/hostname/env
not reconstructible cross-process
```

`ownerInstanceIdentity` is derived inside the trusted module from that live capability using a domain-separated SHA-256 identity.

Required invariants:

```text
CALLER_CAN_SUPPLY_OWNER_INSTANCE_IDENTITY=NO
CALLER_CAN_DESERIALIZE_OWNER_CAPABILITY=NO
CALLER_CAN_VALIDATE_OWNER_BY_STRUCTURE=NO
SERIALIZED_OWNER_IDENTITY_GRANTS_AUTHORITY=NO
PID_OR_HOSTNAME_ALONE_GRANTS_AUTHORITY=NO
```

---

## 11. Ownership claim and crash atomicity

### 11.1 Durable claim

`SandboxPrestartOwnershipClaim` binds exactly:

```text
version
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
createdAdmissionIdentity
ownerInstanceIdentity
ownershipClaimIdentity
```

The claim builder accepts the sealed owner capability, never a caller owner identity string.

### 11.2 One atomic created transaction

A fresh owner claim is not a standalone record write.

The following must be one crash-atomic transaction:

```text
persist exact SandboxPrestartOwnershipClaim
persist exact SandboxPrestartOwnershipClaimCommit(disposition=created, durability=durable)
PREPARED -> OWNER_CLAIMED(exact claim, exact owner)
```

Either all are durably visible and equivalent or none are acknowledged.

`SandboxPrestartOwnershipClaimCommit` durable form has:

```text
version
ownershipClaimIdentity
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
ownerInstanceIdentity
disposition=created
durability=durable
commitIdentity
```

There is **no durable `disposition=existing` write**.

### 11.3 Existing-claim replay

If durable state is already `OWNER_CLAIMED`, re-entering the claim path performs no write and returns only the bounded process-local non-capability response:

```text
OWNER_CLAIMED_UNAVAILABLE
INDETERMINATE
NON_REUSABLE
ATTACH_CALLS=0
NEW_READER_COUNT=0
PRESTART_READY_COUNT=0
OWNER_TAKEOVER=NO
DURABLE_FAILURE_SETTLEMENT=NO
DURABLE_CLAIM_WRITE=NO
```

This result is normative for **every claim replay that does not continue through the original live created-claim controller**, including a call from another process and a same-process re-entry.

There is no same-owner idempotent reattach/reclaim exception.

The original live owner does not prove continuation by replaying the claim API; it continues only through the original process-local sealed controller returned by the successful created transaction.

Replay must not mutate, fail, invalidate, replace, probe liveness of, or otherwise interfere with the active owner.

### 11.4 Claim crash cut points

Required semantics:

```text
crash before atomic claim transaction commit
-> state remains PREPARED; no durable claim commit

crash during atomic persistence
-> never acknowledge created claim unless claim+commit+OWNER_CLAIMED are all durable

crash after atomic transaction commit
-> claim+commit+OWNER_CLAIMED are all visible and equivalent
-> no second owner is permitted
```

---

## 12. Durable failure contract

### 12.1 Durable failure is concrete, never `indeterminate`

`SandboxPrestartFailure` binds:

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

Allowed **durable** `failureCode` values are exactly:

```text
aborted
socket-namespace-untrusted
socket-client-unauthorized
socket-identity-changed
attach-failed
attach-timeout
attach-protocol-invalid
reader-failed
reader-activation-timeout
payload-before-start
dormant-revalidation-failed
dormant-revalidation-timeout
prestart-total-timeout
owner-lost-graceful
```

The durable enum deliberately contains neither:

```text
indeterminate
owner-already-claimed
owner-lost-indeterminate
```

Uncertainty is a non-durable local classification and never becomes a fabricated durable failure fact.

### 12.2 Durable failure transition authority

A durable failure commit exists only after an authorized actor wins one atomic transition to:

```text
FAILED_TERMINAL(exact failureIdentity)
```

`ownerInstanceIdentity` is null only for an authorized `PREPARED -> FAILED_TERMINAL` transition.

For `OWNER_CLAIMED -> FAILED_TERMINAL`:

```text
ownerInstanceIdentity = exact claimed owner
transition actor holds exact matching sealed owner capability
```

No other process may terminally fail the claimed operation merely because it can read durable state.

### 12.3 Failure commit

`SandboxPrestartFailureCommit` binds:

```text
version
failureIdentity
preparedIdentity
prestartOutputOperationIdentity
executionAttemptIdentity
disposition=created | existing
durability=durable
commitIdentity
```

`created` is returned only by the atomic transition that first establishes the exact terminal identity.

`existing` may only return the already-persisted exact same failure commit **without writing** when `FAILED_TERMINAL` already contains the exact same `failureIdentity`.

A conflicting terminal identity, store timeout, uncertain transaction result, unreadable state, or unknown settlement outcome returns only:

```text
SETTLEMENT_INDETERMINATE
NON_REUSABLE
NO_RETRY
NO_ATTACH
NO_PRESTART_READY
NO_START
DURABLE_INDETERMINATE_WRITE=NO
```

### 12.4 Timeout distinction

A phase deadline observed by the live exact owner is a concrete local event and may settle only with its corresponding concrete timeout code after the authorized atomic transition succeeds.

A **timeout or uncertainty of the durable settlement operation itself** is not evidence that `FAILED_TERMINAL` committed. That case is the non-durable `SETTLEMENT_INDETERMINATE` classification above.

---

## 13. Process loss and replay semantics

B2A v1 authorizes **no liveness oracle, lease service, heartbeat, takeover epoch, or post-crash observer**.

Therefore another process cannot distinguish:

```text
remote original owner still alive
vs
original owner hard-crashed
```

from durable `OWNER_CLAIMED` alone.

Absence of the sealed owner capability in a later process is not evidence that the owner died; every other process lacks that capability by construction.

The one normative non-owner observation is:

```text
OWNER_CLAIMED_UNAVAILABLE
INDETERMINATE
NON_REUSABLE
NO_REATTACH
NO_TAKEOVER
NO_START
NO_DURABLE_WRITE
```

B2A must not emit `OWNER_LOST_INDETERMINATE` as though hard process loss had been positively observed by a later process.

Hard process loss semantics are therefore:

```text
no fabricated failure commit
durable OWNER_CLAIMED remains fail-closed
later process cannot determine liveness/death
later process returns OWNER_CLAIMED_UNAVAILABLE / INDETERMINATE / NON_REUSABLE
no takeover
no reattach
no start
```

Graceful teardown is different: while the exact original owner process is still alive and still holds the matching sealed capability, it may invalidate its local controller and atomically settle concrete `owner-lost-graceful`.

If positive post-crash owner-loss proof or recovery is ever desired, it requires a separately authorized liveness/lease/observer theorem. B2A v1 does not contain one.

---

## 14. Finite pre-start deadlines

No durable `OWNER_CLAIMED` operation may be allowed to wait indefinitely **while its exact live owner controller remains running**.

B2A reuses the canonical R3F request timeout:

```text
KDO_H4_R3F_LIMITS.requestTimeoutMs=5000
```

and defines:

```text
B2A_ATTACH_UPGRADE_TIMEOUT_MS=5000
B2A_READER_ACTIVATION_TIMEOUT_MS=5000
B2A_DORMANT_REVALIDATION_TIMEOUT_MS=5000
B2A_OWNER_TO_READY_TIMEOUT_MS=15000
```

The 15000 ms absolute bound is the sum of the three individually bounded phases. It is a fail-safe upper bound, not permission to intentionally delay a local reader for five seconds.

### 14.1 Trusted clock owner

The exact live owner controller owns one process-local monotonic deadline source using public Node 24 monotonic time.

No caller timestamp, wall-clock string, environment value, serialized deadline, or cross-process deadline handle grants authority.

The absolute owner-to-ready deadline is armed immediately after the crash-atomic created owner-claim transaction is acknowledged and before `ATTACHING` can be entered.

Deadline state is intentionally not durable because B2A has no post-crash takeover. Hard process loss falls under Section 13.

### 14.2 Attach/upgrade deadline

From the `ATTACHING` linearization point until validated HTTP 101 upgrade:

```text
elapsed <= 5000 ms
```

The fixed request must use the canonical bounded request behavior equivalent to the current R3G-E `request.setTimeout(KDO_H4_R3F_LIMITS.requestTimeoutMs, ...)` contract.

If the deadline wins before a valid upgrade:

```text
invalidate local controller
destroy owned request/socket handles
block late HTTP 101
block reader activation
block PRESTART_READY
attempt OWNER_CLAIMED -> FAILED_TERMINAL(code=attach-timeout)
```

If durable settlement is uncertain, return non-durable `SETTLEMENT_INDETERMINATE` and remain non-reusable.

### 14.3 Reader-activation deadline

After valid HTTP 101 and Gate C namespace validation, exactly one trusted reader must become `READER_ACTIVE` within:

```text
<= 5000 ms from validated upgrade
AND before B2A_OWNER_TO_READY_TIMEOUT_MS
```

Reader installation should be synchronous in the upgrade-owned flow; the numeric deadline is a fail-safe ceiling, not authorization for asynchronous ownership gaps.

If the deadline wins:

```text
invalidate controller
destroy socket/stream
block PRESTART_READY
attempt OWNER_CLAIMED -> FAILED_TERMINAL(code=reader-activation-timeout)
```

### 14.4 Dormant-revalidation deadline

The final post-attach pristine-dormant revalidation must finish within:

```text
<= 5000 ms
AND before B2A_OWNER_TO_READY_TIMEOUT_MS
```

Every Docker read-only request used by this revalidation remains individually bounded by the canonical R3F request timeout.

If this deadline wins:

```text
invalidate controller
destroy reader/socket
block PRESTART_READY
attempt OWNER_CLAIMED -> FAILED_TERMINAL(code=dormant-revalidation-timeout)
```

### 14.5 Absolute owner-to-ready deadline

Before final `READER_ACTIVE -> PRESTART_READY`, prove:

```text
owner_to_ready_elapsed < 15000 ms
```

If the absolute deadline wins first:

```text
invalidate controller
close all owned handles
block every late success event
attempt OWNER_CLAIMED -> FAILED_TERMINAL(code=prestart-total-timeout)
```

The timeout callback and successful local phase transition are linearized by the owner-local state machine. Once timeout/invalidation wins, later callbacks cannot revive the attempt. Once `PRESTART_READY` wins before the deadline, the prestart preparation timer is cancelled and cannot retroactively fail readiness.

These B2A deadlines do not define or authorize the future B2B start-to-TTL-ARM interval.

---

## 15. Process-local state machine and attach linearization

For a fresh durable created owner claim, the original matching sealed controller uses:

```text
OWNER_CLAIMED_LOCAL -> ATTACHING -> READER_ACTIVE -> PRESTART_READY
```

Terminal local states:

```text
FAILED
INVALIDATED
```

The local controller must remain consistent with the durable fence and can never create readiness after durable `FAILED_TERMINAL`.

### 15.1 Abort registration

Install abort, invalidation, and deadline handlers before any attach-capable transition.

### 15.2 ATTACHING linearization

Only the original process holding both:

```text
durable state = OWNER_CLAIMED(exact owner)
AND matching sealed owner capability
AND live deadline controller
```

may synchronously enter `ATTACHING`.

Immediately before the transition prove:

```text
signal.aborted=false
local state=OWNER_CLAIMED_LOCAL
durable state=exact OWNER_CLAIMED
owner capability valid
absolute deadline not expired
protected socket namespace exact
root-client authorization exact
container still pristine dormant
```

There must be no `await` between the final abort/owner/deadline checks and ownership of `ATTACHING`.

Cancellation or timeout before `ATTACHING` means zero attach requests.

Only the `ATTACHING` owner may construct the fixed request, with no asynchronous gap after final local-state confirmation.

### 15.3 Cancellation/timeout after ATTACHING

Cancellation or timeout after `ATTACHING` invalidates the controller and destroys/closes every owned request/socket/stream handle as available.

Late HTTP 101, socket events, reader activation, dormant revalidation, or capability construction cannot become success.

---

## 16. One trusted bounded reader

B2A must establish exactly one reader for Docker non-TTY multiplex frames.

The reader and shared accumulator must preserve canonical R3G-E semantics:

```text
stdout and stderr share one raw payload byte budget
exact N bytes accepted
N+1 fails closed
malformed framing fails closed
truncated framing fails closed
transport loss fails closed
abort fails closed
byte budget cannot reset
reader cannot reopen
second reader forbidden
```

The same logical reader/accumulator is intended to continue into a separately authorized B2B start, but B2A grants no B2B consumption or start authority.

Before `PRESTART_READY`:

```text
reader live=true
reader count=1
accepted raw payload bytes=0
```

Any payload byte accepted while the subject is still dormant is an invalidating failure:

```text
failureCode=payload-before-start
NO_START
```

---

## 17. PRESTART_READY capability theorem

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

No durable record may assert stream, reader, controller, deadline, or capability survival across process restart.

Before capability creation prove synchronously:

```text
local state=READER_ACTIVE
durable state=exact OWNER_CLAIMED
signal.aborted=false
owner capability valid
absolute deadline not expired
reader live=true
accepted raw payload bytes=0
post-attach pristine dormant revalidation=PASS
socket namespace exact
root-client authorization exact
```

Only then may:

```text
READER_ACTIVE -> PRESTART_READY
```

occur.

---

## 18. R3G-E internal factorization fence

Current R3G-E `captureOutput()` owns attach through terminal aggregation and cannot directly expose a live pre-start ownership seam.

A future B2A implementation may factor internal R3G-E opener/reader/accumulator primitives only if:

```text
R3G_E_EXTERNAL_BEHAVIOR=UNCHANGED
R3G_E_OUTPUT_BOUND_SEMANTICS=UNCHANGED
R3G_E_ROOT_AUTHORITY_SURFACE=NOT_WIDENED
RAW_SOCKET_ROOT_EXPORT=NO
RAW_ATTACH_TRANSPORT_ROOT_EXPORT=NO
GENERIC_DOCKER_REQUEST_ROOT_EXPORT=NO
```

The internal seam may expose only enough authority for the B2A sealed controller.

B2A commits no positive R3G-E E3 evidence and no R3G-F E4 evidence.

R3G-D production files must not change and TTL ARM attempts must remain zero.

---

## 19. Package-root authority restrictions

The package root must not export purpose-equivalent forms of:

```text
raw Unix socket
raw upgraded attach socket
raw attach request constructor
generic Docker method/path/socket request
prepared/state repair primitive
owner claim persistence primitive
operation-state transition primitive
failure-state transition primitive
PRESTART_READY creator
structural PRESTART_READY validator
reader reopen/reset
byte-budget reset
socket namespace bypass
post-crash takeover/recovery primitive
liveness/lease/heartbeat primitive
```

Deep-module helpers remain internal and do not become product authority.

---

## 20. Authorized future implementation surface

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

No changes are authorized to:

```text
R3G-D
R3G-F
B1
permit/policy
workflows
dependencies
package manifests
native helpers
Docker CLI integration
external services
```

If the theorem cannot be satisfied with public Node 24 APIs, the exact root-only socket/host-policy constraints, and this path set, implementation must stop and return to authorization.

---

## 21. Required future implementation proofs

### 21.1 Zero-start / zero-TTL

```text
positive path -> Docker start calls=0
all failures -> Docker start calls=0
all aborts -> Docker start calls=0
all timeout paths -> Docker start calls=0
all replay/concurrency -> Docker start calls=0
TTL ARM attempts=0
```

### 21.2 Protected namespace and client authority

Prove rejection of:

```text
rootless socket
user-owned socket
socket uid != 0
socket gid != 0
socket mode != 0600
abstract socket
symlink component
writable ancestor
namespace identity drift
non-root B2A client
nontrivial ACL-grant deployment without trusted host-policy proof
```

Linux evidence must prove the positive path uses a real root-owned protected namespace and root-only client policy.

A negative physical/host test must demonstrate that an unauthorized non-root principal cannot connect to the accepted test socket or perform the protected attach operation.

No proof may claim mode bits override a nontrivial POSIX ACL or that pre/post `lstat` alone detects transient host-root replacement.

### 21.3 Exact B1 and dormant state

Reject forged/mismatched B1 lineage and every running/pid/restart/runtime/network/image/command/resource/privilege/TTY/stdin/stdout/stderr/host-authority drift.

### 21.4 Fixed attach protocol

Prove exactly the authorized POST/1.48/query/HTTP-101/headers/media-type contract and reject all deviations.

### 21.5 Prepared transaction crash atomicity

Use a fault-injected durable store to prove:

```text
crash before transaction commit -> prepared+commit+PREPARED all absent
crash during persistence -> no acknowledged partial state
crash after commit -> prepared+commit+PREPARED all visible and equivalent
existing prepared + missing fence -> PREPARATION_STATE_INDETERMINATE/NON_REUSABLE
existing prepared + conflicting fence -> PREPARATION_STATE_INDETERMINATE/NON_REUSABLE
replay cannot repair missing fence
```

### 21.6 Claim transaction crash atomicity

Use the same hostile durable-store model to prove:

```text
crash before claim transaction -> PREPARED remains; no durable claim commit
crash during claim persistence -> no acknowledged partial claim
crash after claim transaction -> claim+created commit+OWNER_CLAIMED all visible and equivalent
existing OWNER_CLAIMED replay -> zero writes
existing replay -> OWNER_CLAIMED_UNAVAILABLE / INDETERMINATE / NON_REUSABLE
```

A durable claim commit with `disposition=existing` is forbidden.

### 21.7 Failure schema and durable-indeterminate exclusion

Round-trip validators must prove:

```text
closed exact key sets
closed durable failureCode enum
failureCode=indeterminate rejected
owner-already-claimed rejected as durable code
owner-lost-indeterminate rejected as durable code
owner nullability rules
exact failure identity binding
exact durable settlement identity
Proxy/accessor/extra-field rejection
conflicting settlement -> non-durable SETTLEMENT_INDETERMINATE
unknown store outcome -> non-durable SETTLEMENT_INDETERMINATE
```

### 21.8 Shared state-fence races

Prove:

```text
claim vs pre-owner failure -> exactly one winner
failure first -> later claim impossible
claim first -> null-owner pre-owner failure impossible
owner A vs owner B -> at most one durable owner
conflicting failure A vs failure B -> never two terminal identities
FAILED_TERMINAL -> no later claim/attach/readiness
```

### 21.9 Unforgeable owner capability

Prove caller-provided/serialized owner identities and structural/Proxy/JSON/cross-process capability lookalikes grant no authority. Two fresh owner capabilities derive distinct identities.

### 21.10 Non-owner replay and process-loss ambiguity

Prove same-process claim re-entry and other-process replay both return the same non-authoritative result unless execution continues through the original live created-claim controller:

```text
OWNER_CLAIMED_UNAVAILABLE
INDETERMINATE
NON_REUSABLE
NO_WRITES
NO_ATTACH
NO_READER
NO_PRESTART_READY
NO_TAKEOVER
NO_START
```

Prove a later process cannot infer hard process loss merely from lacking the sealed owner capability.

### 21.11 Deadline and cancellation interleavings

Use a deterministic fake monotonic clock and controlled request/upgrade/reader/revalidation hooks.

Required cut points include:

```text
abort before ATTACHING
attach timeout before request completes
HTTP 101 at boundary before timeout
HTTP 101 after timeout already won
reader activation before/at/after deadline
post-attach revalidation before/at/after deadline
absolute 15000 ms deadline before PRESTART_READY
PRESTART_READY immediately before absolute deadline
late timeout callback after PRESTART_READY cancellation
settlement-store timeout after phase timeout
```

Every losing late callback must be unable to revive the controller or create readiness.

Every timeout path proves zero Docker start.

### 21.12 Reader/capability seal

Prove readiness impossible until one live bounded reader exists with zero accepted payload bytes and final dormant/socket/owner/deadline validation passed.

Reject second reader, reopen, reset, clone, stale handle, and cross-process handle reconstruction.

### 21.13 Graceful versus hard process loss

```text
graceful exact owner teardown while capability live
-> exact owner may OWNER_CLAIMED -> FAILED_TERMINAL(owner-lost-graceful)
-> invalidate capability/controller
-> no start

hard process loss
-> no fabricated durable failure
-> durable OWNER_CLAIMED remains
-> another process cannot tell active-vs-dead owner
-> OWNER_CLAIMED_UNAVAILABLE / INDETERMINATE / NON_REUSABLE
-> no takeover/reattach/start
```

### 21.14 R3G-E regression

Re-prove canonical framing, byte budget, fixed request, malformed-frame handling, timeout/abort handling, and package-root negative space after factorization.

---

## 22. Static forbidden-authority scan

The future product delta must be scanned for reachable purpose-equivalent forms of:

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

Mentions in tests or documentation asserting absence do not create authority.

---

## 23. Future product-PR merge gates

The future implementation PR must not merge unless the exact final head proves:

```text
AUTHORIZED_CHANGED_PATHS_ONLY=PASS
NO_WORKFLOW_OR_DEPENDENCY_DRIFT=PASS
ZERO_DOCKER_START_PROOF=PASS
ZERO_TTL_ARM_PROOF=PASS
ROOTFUL_PROTECTED_SOCKET_NAMESPACE_PROOF=PASS
ROOT_ONLY_SOCKET_CLIENT_AUTHORITY_PROOF=PASS
UNAUTHORIZED_NON_ROOT_CONNECT_NEGATIVE_PROOF=PASS
ACL_HOST_POLICY_PRECONDITION_PROOF=PASS
ROOTLESS_B2A_REJECTION_PROOF=PASS
PREPARED_TRANSACTION_CRASH_ATOMICITY_PROOF=PASS
ORPHAN_PREPARED_NON_REUSABLE_PROOF=PASS
CLAIM_TRANSACTION_CRASH_ATOMICITY_PROOF=PASS
EXISTING_CLAIM_ZERO_WRITE_REPLAY_PROOF=PASS
PRESTART_SCHEMA_PROOF=PASS
DURABLE_INDETERMINATE_FORBIDDEN_PROOF=PASS
ATOMIC_OPERATION_STATE_FENCE_PROOF=PASS
CLAIM_VS_TERMINAL_FAILURE_RACE_PROOF=PASS
TERMINAL_FAILURE_BLOCKS_LATER_CLAIM_PROOF=PASS
UNFORGEABLE_OWNER_CAPABILITY_PROOF=PASS
NON_OWNER_REPLAY_SINGLE_RESULT_PROOF=PASS
ACTIVE_OWNER_NON_INTERFERENCE_PROOF=PASS
PROCESS_LOSS_AMBIGUITY_FAIL_CLOSED_PROOF=PASS
ATTACHING_CANCELLATION_LINEARIZATION_PROOF=PASS
ATTACH_UPGRADE_5000MS_DEADLINE_PROOF=PASS
READER_ACTIVATION_5000MS_DEADLINE_PROOF=PASS
DORMANT_REVALIDATION_5000MS_DEADLINE_PROOF=PASS
OWNER_TO_READY_15000MS_DEADLINE_PROOF=PASS
TIMEOUT_LATE_SUCCESS_REJECTION_PROOF=PASS
SETTLEMENT_TIMEOUT_NON_DURABLE_PROOF=PASS
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

## 24. Explicit non-grants and stop conditions

This authorization does not grant:

```text
R4B-B2B implementation
rootless Docker B2A
abstract Unix-socket B2A
0660 root:docker B2A
non-root Docker-socket client B2A
Docker start/exec/restart/stop/kill/remove
workload execution
running-subject creation
TTL ARM or TTL authority change
B2B start-to-ARM deadline design
termination/containment mutation authority
final output evidence settlement
R3G-F E4 or R3G-F ASK
generic runCommand ASK
H4 completion
H6
K3-R6+
automatic PRESTART_READY owner recovery/takeover
post-crash cleanup/recovery authority
liveness/lease/heartbeat authority
repair of orphaned prepared/state metadata
native SO_PEERCRED helper
native ACL helper
getfacl/setfacl runtime dependency
Docker CLI fallback
```

Implementation must stop and return to authorization if it requires any such authority, a source path outside the authorized set, a new dependency/workflow, undocumented Node socket internals, caller-self-attested ACL safety, or a broader Docker socket client set.

---

## 25. Authorization-PR merge gates

This docs-only authorization PR itself must not merge unless:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
CANONICAL_MAIN_UNMOVED_OR_EXACTLY_RECONCILED=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE=PASS
```

---

## 26. Authorization acceptance criteria

This document may become canonical only if review accepts all of:

```text
B2A is zero-start and zero-live-workload.
PRESTART_READY is live, non-serializable, module-sealed, and process-local.
B2A v1 live attach is rootful protected-path and root-client only.
The accepted socket is uid=0 gid=0 mode=0600.
Nontrivial ACL grants are outside the supported B2A v1 host policy and cannot be self-attested by a caller.
The protected namespace—not lstat alone—closes modeled untrusted pathname replacement.
Prepared record/commit and initial PREPARED state fence are one crash-atomic transaction.
An orphan prepared record is indeterminate/non-reusable and cannot be repaired.
ownerInstanceIdentity comes only from an unforgeable sealed process-local capability.
Claim record/created commit and PREPARED->OWNER_CLAIMED are one crash-atomic transaction.
There is no durable existing-claim write.
Every claim replay outside the original live controller returns OWNER_CLAIMED_UNAVAILABLE / INDETERMINATE / NON_REUSABLE.
No later process infers hard owner loss without a liveness oracle.
Durable failureCode never equals indeterminate.
Only concrete observed failures that win an authorized atomic FAILED_TERMINAL transition become durable.
Unknown/timeout settlement outcomes remain non-durable SETTLEMENT_INDETERMINATE.
Owner claim and terminal failure are mutually exclusive transitions in one atomic state fence.
A durable terminal failure blocks every later owner claim/attach/readiness transition.
ATTACHING is the cancellation/POST-attach linearization point.
Attach/upgrade, reader activation, and dormant revalidation each have a 5000 ms bound.
OWNER_CLAIMED-to-PRESTART_READY has a 15000 ms absolute live-owner bound.
Timeouts invalidate first, reject late success, and never grant start.
Hard process loss leaves OWNER_CLAIMED fail-closed without fabricated durable evidence.
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

and final negative-space theorem:

```text
NO DOCKER START
NO LIVE WORKLOAD
NO TTL ARM
NO FINAL OUTPUT EVIDENCE
NO R3G-F E4
NO ROOTLESS LIVE ATTACH IN B2A V1
NO NON-ROOT DOCKER SOCKET CLIENT IN B2A V1
NO OWNER TAKEOVER OR POST-CRASH RECOVERY IN B2A V1
NO LIVENESS/LEASE/HEARTBEAT AUTHORITY IN B2A V1
NO DURABLE INDETERMINATE FAILURE CODE
NO OWNER CLAIM AFTER DURABLE TERMINAL FAILURE
NO REPAIR/ADVANCE FROM ORPHANED PREPARED METADATA
```

All later live-execution authority remains closed.
