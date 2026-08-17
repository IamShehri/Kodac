# KDO-H4-R3G-D — Fencing, Control-Peer, and Artifact Reconciliation

Date: 2026-08-18
Status: AUTHORIZATION CANDIDATE RECONCILIATION — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Authorization package parent head: `f52c6cd3f0633fb813e8d77a54363246d843fe52`
Canonical base remains: `96fb2cb3bbd2cbf4b5802f218b02189654a0775c`
Pinned gVisor remains: `50e1502a95d36ad2faf2c7ef33b8bf21fe975293`

This reconciliation is normative together with the four earlier H4-R3G-D authorization/reconciliation documents.

---

## 1. Decision

Fresh review of the terminal-causality package identified three additional valid requirements:

```text
A. recovered/duplicate watchdogs need lease-scoped fencing so stale owners cannot mutate or write terminal evidence;
B. each retained gVisor control connection needs a kernel-backed binding to the exact admitted sandbox process before arm;
C. the executed runsc artifact identity must be mandatory on every proof-bearing retained-channel path.
```

R3G-D is tightened accordingly.

No product code is implemented or proven by this document.

---

## 2. Pinned gVisor control-socket facts

Pinned gVisor creates the filesystem Unix-domain control socket before launching the sandbox and donates the bound listener FD to the sandbox as `controller-fd`.

Inside the sandbox process, the pinned control server reconstructs the server from that donated FD and `StartServing()` performs `Listen()` and `Accept()` there.

Therefore R3G-D may bind a connected AF_UNIX stream to its serving peer using Linux kernel-supplied peer credentials, rather than trusting only a mutable pathname or caller-provided container ID.

The pathname remains a discovery input only until it is pinned and authenticated.

---

## 3. Required socket-path pin before connect

For each proof-bearing retained control channel, the helper must perform a bounded initial connection procedure purpose-equivalent to:

```text
1. obtain ControlSocketPath only from the already-admitted trusted gVisor state lineage;
2. open that exact pathname with O_PATH | O_NOFOLLOW;
3. fstat the retained O_PATH descriptor and require a Unix socket inode with the expected trusted ownership/mode constraints;
4. retain the O_PATH descriptor;
5. connect through the pinned descriptor path (`/proc/self/fd/<fd>`) rather than resolving the original pathname again;
6. never reopen the original pathname for that lease.
```

A pathname replacement after step 2 cannot redirect the retained descriptor.

If O_PATH pinning, descriptor validation, or descriptor-relative connect cannot be established exactly, the proof path fails closed.

---

## 4. Kernel-backed peer handshake

Immediately after each AF_UNIX stream connection is established and before the channel is admitted for `Wait`, `Processes`, or `Signal`, the helper must call:

```text
getsockopt(SOL_SOCKET, SO_PEERCRED)
```

and obtain kernel-supplied:

```text
peer PID
peer UID
peer GID
```

The connected channel is acceptable only if all of the following hold:

```text
peer PID = expected R3E sandbox/state PID
peer UID/GID satisfy the trusted sandbox identity/configuration constraints
peer PID can be bound to the retained pidfd
peer process start ticks = expected R3E/R3D start ticks
peer executable identity = expected R3E/R3D runsc executable identity
reconstructed runtimeInstanceIdentity = expected lease-bound runtimeInstanceIdentity
```

`SO_PEERCRED` is the mandatory Linux v1 control-peer authentication primitive for this authorization.

CID/containerId sent in later uRPC calls is only a consistency selector *inside the already-authenticated exact sandbox channel*.

CID MUST NOT be treated as sufficient authentication of the channel itself.

---

## 5. One authenticated peer for all retained channels

If implementation uses distinct retained connections for:

```text
ContMgrWait
ContMgrProcesses
ContMgrSignal
termination acknowledgement
```

then every connection must independently complete the exact peer handshake above and resolve to the same:

```text
peer PID
pidfd-bound process instance
runsc executable identity
runtimeInstanceIdentity
```

A connection whose peer identity differs from the lease-bound sandbox must be closed and must not be replaced by a fallback connection for positive proof.

Prefer one retained authenticated connection where protocol concurrency semantics safely permit it; otherwise all retained connections share one deterministic `controlPeerBindingIdentity`.

---

## 6. Control-peer binding identity

The implementation must derive a deterministic binding identity over the authenticated channel facts, purpose-equivalent to:

```text
controlPeerBindingIdentity = SHA-256(
  domain = "kodac-h4-r3g-d-control-peer-v1"
  || runtimeInstanceIdentity
  || peerPid
  || peerUid
  || peerGid
  || socketDevice
  || socketInode
  || runscArtifactIdentity
  || helperProtocolVersion
)
```

The actual encoding must be canonical and length-delimited.

Every retained proof-bearing channel record must bind this identity.

---

## 7. Replacement before initial connection

A hostile replacement of `ControlSocketPath` before the helper performs its initial connection must not become an admitted channel merely because the textual path or container ID matches.

Required handling:

```text
path replaced with another socket
-> O_PATH pins replacement inode
-> SO_PEERCRED identifies replacement server process
-> peer PID/process/executable/runtime identity fails expected R3E tuple
-> no channel admission
-> no physical arm ACK
-> no positive R3G-D evidence
```

If a replacement server somehow cannot be distinguished under the required kernel/process identity checks, R3G-D fails closed rather than weakening the theorem.

Malicious-host/kernel compromise remains outside scope.

---

## 8. Replacement after authenticated connect

After a retained channel has passed peer authentication, later unlink/replacement of the filesystem socket pathname does not authorize reconnection.

The helper continues only on the already-retained authenticated connection.

If that connection fails:

```text
no pathname reconnect
no container-ID reload
no Docker fallback
no host-PID signal fallback
positive proof = forbidden
```

A later connection belongs to a fresh separately reconciled observation/attempt and cannot inherit the old lease's proof authority.

---

## 9. Mandatory runsc artifact binding on every retained-channel proof path

The executable runsc artifact is part of the trusted runtime instance, not optional metadata.

For every positive R3G-D path in which the gVisor sandbox peer participates in:

```text
ContMgrWait
ContMgrProcesses
ContMgrSignal
termination acknowledgement
```

the lease/helper must bind the already-authorized expected runsc SHA-256/artifact identity.

A positive proof path MUST NOT contain wording or implementation behavior equivalent to:

```text
runsc digest optional when using uRPC directly
```

Direct uRPC avoids a second CLI load-by-ID; it does not remove the sandbox executable from the trust boundary.

---

## 10. Retained runsc executable descriptor

During the final peer-authentication bracket, the helper must open and retain a descriptor for the exact peer process executable using the canonical R3D/R3E same-instance process theorem.

The descriptor must be validated/hardened purpose-equivalent to the existing trusted executable verification rules:

```text
peer pidfd established
-> exact peer executable descriptor opened
-> fstat/executable metadata verified
-> SHA-256 computed from the retained executable descriptor
-> digest = configured/authorized expected runsc SHA-256
-> runscArtifactIdentity = expected R3E runtime-instance artifact identity
-> descriptor retained across arm -> terminalization
```

A path hash followed by later executable reopen is forbidden.

The retained executable descriptor is identity evidence; it is not an execution surface.

---

## 11. Artifact drift handling

Any mismatch in:

```text
runsc SHA-256
executable device/inode/size
process start ticks
peer PID
runtimeInstanceIdentity
```

before arm or terminal mutation yields fail-closed behavior.

The helper cannot silently accept a replacement binary because the binary path string is unchanged.

No positive arm/terminal E3 evidence is emitted on mismatch.

---

## 12. Why durable idempotency alone is not terminal ownership

The prior recovery reconciliation makes arm creation idempotent and recoverable, but two live helper instances could otherwise attempt to recover the same durable lease concurrently.

Therefore R3G-D requires a separate lease-scoped terminal ownership primitive.

Exactly one live helper owner may cross the winner -> mutation boundary for a lease at a time.

---

## 13. Durable terminal ownership record

The watchdog registry must maintain, for each `leaseIdentity`, a durable ownership record containing at minimum:

```text
leaseIdentity
armOperationIdentity
ownerInstanceIdentity
terminalFenceToken
ownerState
claimRecordIdentity
updatedBoottimeNs
```

`terminalFenceToken` is a monotonically increasing unsigned integer scoped to the lease.

It starts at a defined initial value and increments on every successful new ownership claim/recovery generation.

Token wraparound is forbidden; exhaustion fails closed.

---

## 14. Kernel-exclusive lease lock

A fencing token alone cannot protect a target that does not understand the token.

R3G-D therefore additionally requires one kernel-released exclusive per-lease ownership lock, held by the active watchdog owner across any terminal winner transition and proof-bearing mutation.

The implementation may use a Linux advisory/open-file-description lock or another purpose-equivalent process-death-released kernel primitive over a trusted watchdog-registry lock object.

Required properties:

```text
exclusive per leaseIdentity
cannot be caller-selected
acquisition is bounded
released automatically when owner process dies / descriptor closes
lock object is under trusted registry authority
new owner cannot claim while prior live owner still holds the lock
```

A plain in-memory mutex is insufficient across processes/restarts.

---

## 15. Atomic owner claim

A helper may become terminal owner only through this sequence:

```text
A. acquire exclusive per-lease kernel lock;
B. read durable lease/ownership state while lock is held;
C. require lease payload and clock domain match;
D. atomically increment terminalFenceToken;
E. durably commit new ownerInstanceIdentity + token;
F. fsync/durability-acknowledge ownership record;
G. retain the same kernel lock descriptor;
H. only then activate Wait/liveness/winner/mutation authority.
```

If any step fails, the helper is not an owner and cannot issue proof-bearing lifecycle mutation.

---

## 16. Fencing token is mandatory everywhere terminal authority is exercised

The active `terminalFenceToken` must be bound to:

```text
retained-channel ownership state
natural-exit winner transition
expiry winner transition
live-at-expiry probe record
signal mutation intent
signal acknowledgement
termination acknowledgement
terminal durable evidence record
terminal evidence commit acknowledgement
```

The token is part of each deterministic record/request identity.

A terminal record with a stale token is structurally invalid.

---

## 17. Revalidation without a token-to-gVisor protocol

gVisor does not consume Kodac's fencing token.

Therefore stale-owner prevention must be enforced by Kodac before the external mutation boundary while the same exclusive lease lock remains held.

Immediately before any `ContMgrSignal`, the helper must, **without releasing the lease lock**:

```text
1. verify its lock descriptor remains valid;
2. read/verify durable owner record;
3. require ownerInstanceIdentity = self;
4. require terminalFenceToken = self token;
5. require terminal winner state permits this mutation;
6. require retained pidfd/control-peer/runsc identities remain exact;
7. then issue ContMgrSignal over the already-authenticated retained connection while the lock remains held.
```

Because another helper cannot acquire the same lease lock and advance the token while this lock is retained, there is no stale-owner takeover window between final ownership validation and mutation.

---

## 18. Lock lifetime

The active owner must retain the kernel lease lock through:

```text
winner decision
live-at-expiry proof when applicable
ContMgrSignal when applicable
positive termination acknowledgement
local durable terminal registry commit
```

Only after the local terminal state is durably committed may the lock be released.

K2 evidence persistence may occur afterward using the immutable terminal record/token; stale K2 writers are rejected by token/record identity.

---

## 19. Duplicate helper start

If a second helper starts while the current owner still holds the lease lock:

```text
second helper cannot become owner
second helper cannot increment fence token
second helper cannot issue Wait-winner or Signal mutation
second helper cannot write authoritative terminal state
```

It may perform bounded read-only diagnostics only if those diagnostics cannot be confused with authoritative proof.

There is no user-facing busy state or artificial product queue created by this security lock.

---

## 20. Owner crash and recovery

If the owner process dies, Linux releases the process-held lease lock.

A recovery helper may then:

```text
acquire the released lock
-> revalidate the immutable lease/clock domain
-> increment terminalFenceToken
-> durably claim new owner generation
-> perform the previously defined retained-channel exact-instance recovery rules
```

If exact retained control-channel continuity cannot be safely recovered, positive proof fails closed; the new owner cannot reconnect by pathname and pretend it inherited the old authenticated channel.

The authorization does not weaken channel-binding rules merely to improve availability.

---

## 21. Stale owner after logical supersession

A helper whose fence token is not the current durable token, or that does not hold the exclusive lease lock, is stale even if it still has old in-memory lease data.

A stale helper must reject:

```text
winner commit
liveness classification
ContMgrSignal
terminal registry write
K2 terminal proof submission
```

No best-effort stale write is accepted.

---

## 22. Stale K2 terminal write rejection

The K2 evidence authority must accept a terminal record only when:

```text
leaseIdentity matches the durable arm record
terminalFenceToken is the authoritative token for that terminal record
terminal record identity/payload digest matches
no different authoritative terminal record already exists
```

A stale-owner terminal record cannot overwrite or coexist as a second authoritative outcome.

---

## 23. Updated terminal record fields

The terminal record must now additionally bind:

```text
ownerInstanceIdentity
terminalFenceToken
claimRecordIdentity
controlPeerBindingIdentity
socketDevice
socketInode
peerPid
peerUid
peerGid
retainedPidfdProcessIdentity
runscArtifactIdentity
verifiedRunscSha256
retainedRunscExecutableIdentity
```

Every positive terminal proof still binds all earlier lease, clock, winner, liveness, and durable-evidence identities.

---

## 24. Updated arm/helper acknowledgement fields

Positive helper arm acknowledgement must bind at minimum:

```text
leaseIdentity
armOperationIdentity
runtimeInstanceIdentity
controlPeerBindingIdentity
runscArtifactIdentity
verifiedRunscSha256
watchdogRegistryRecordIdentity
clockDomainIdentity
deadlineBoottimeNs
```

K2 must verify these values before committing canonical positive arm evidence.

---

## 25. Hostile proof classes added

The implementation suite must additionally prove:

1. ControlSocketPath replacement before O_PATH pin cannot authenticate as the expected sandbox peer;
2. O_NOFOLLOW rejects symlink substitution;
3. pathname replacement after O_PATH pin does not redirect the retained descriptor;
4. every retained control channel passes SO_PEERCRED validation;
5. peer PID mismatch fails closed;
6. peer UID/GID mismatch fails closed where constrained;
7. peer PID reuse is rejected by pidfd/start-ticks identity;
8. peer executable device/inode/size mismatch fails closed;
9. peer runsc SHA-256 mismatch fails closed;
10. direct uRPC cannot bypass runsc artifact verification;
11. Wait proof binds verified runsc artifact identity;
12. Processes live-at-expiry proof binds verified runsc artifact identity;
13. Signal proof binds verified runsc artifact identity;
14. termination acknowledgement binds verified runsc artifact identity;
15. duplicate helper start cannot acquire the same lease lock;
16. duplicate helper cannot commit a second winner;
17. every successful ownership recovery increments terminalFenceToken exactly once;
18. stale token cannot write terminal registry state;
19. stale token cannot submit authoritative K2 terminal evidence;
20. owner validation and ContMgrSignal occur while the same exclusive lease lock remains held;
21. lock loss/descriptor close disables mutation authority immediately;
22. owner crash releases the kernel lease lock;
23. recovery after owner crash cannot silently reconnect to a replaced control socket for positive proof;
24. fence-token wraparound/exhaustion fails closed;
25. corrupted owner record fails closed;
26. terminal record contains the authoritative fence token and control-peer/runsc identities;
27. caller/model cannot choose owner identity, fence token, socket FD, peer credentials, runsc digest, or lease lock path;
28. no Docker/host-kill/standalone-runsc fallback is introduced;
29. all lock/RPC/durability operations are operationally bounded without moving the immutable TTL deadline;
30. security ownership locking does not create an artificial user review/PR/agent quota.

---

## 26. Review-finding reconciliation

This document directly resolves the three findings from the completed CodeRabbit review of `e83b002...`:

```text
lease-scoped fencing
-> durable monotonically increasing terminalFenceToken
   + process-death-released exclusive lease lock
   + same-lock ownership validation through mutation.

control-channel binding
-> O_PATH/O_NOFOLLOW pin
   + descriptor-relative connect
   + SO_PEERCRED peer PID/UID/GID
   + pidfd/start-ticks/executable/runtimeInstanceIdentity validation.

mandatory runsc artifact verification
-> retained executable descriptor
   + exact SHA-256/artifact identity required for Wait/Processes/Signal/termination proof paths.
```

The earlier recovery and expiry-liveness reconciliation remains authoritative for PREPARED intents, idempotency, CLOCK_BOOTTIME deadlines, durable watchdog registry, and live-at-expiry classification.

---

## 27. Scope remains narrow

This reconciliation does not authorize:

```text
generic process supervisor API
arbitrary Unix-socket RPC
arbitrary signal/container selection
Docker/containerd mutation
host PID signal fallback
TTL renewal
output limits
credentials
R3B final evidence minting
external-process ASK
macOS/Windows TTL enforcement
host-reboot continuity theorem
malicious-host/kernel resistance
H4 completion
```

Per-lease ownership locking is a security correctness primitive, not a Kodac-imposed review, PR, file, model, agent, daily, or throughput limit.

---

## 28. New exact-head gate

This document changes authorization-package bytes. All reviews/checks on `f52c6cd3f0633fb813e8d77a54363246d843fe52` and earlier are historical for final certification.

Before guarded merge, the resulting exact PR head must satisfy:

```text
canonical main/base unchanged
all changed paths docs-only
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy PASS where triggered
K2 classifier/gate PASS where triggered
fresh external exact-head review complete
all valid findings addressed
0 unresolved actionable review threads
PR Ready/open/mergeable
```

Only after exact merge and post-merge verification does implementation become authorized.