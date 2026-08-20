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

CANONICAL R4B-B1:
MERGED / PROVEN / DORMANT CREATE-ONLY

CANONICAL R4B-B2 READINESS:
MERGED / PROVEN AS PR #132

R4B-B2 STRATEGY:
SUB-SLICED

R4B-B2A PRODUCT IMPLEMENTATION:
AUTHORIZED ONLY AFTER THIS DOCUMENT IS CANONICAL

R4B-B2A MAXIMUM POSITIVE STATE:
PRESTART_READY

DOCKER ATTACH AUTHORITY:
BOUNDED PRE-START POST /v1.48/containers/{id}/attach ONLY

DOCKER START AUTHORITY:
NO

DOCKER EXEC AUTHORITY:
NO

DOCKER STOP/KILL/REMOVE/RESTART AUTHORITY:
NO

WORKLOAD PROCESS EXECUTION AUTHORITY:
NO

TTL ARM AUTHORITY:
NO

R3G-F E4 AUTHORITY:
NO

DIRECT R3G-F ASK ENABLEMENT:
FORBIDDEN

GENERIC EXTERNAL runCommand ASK:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO

K3-R6+ AUTHORIZED:
NO
```

R4B-B2A authorizes only the smallest safe bridge between the canonical dormant-created admission and a future separately authorized live-start controller.

It does **not** authorize starting the container.

It does **not** authorize any workload process to become live.

It does **not** authorize TTL arming, terminal execution evidence, final output evidence, R3G-F E4, or permit consumption as a successful execution.

---

## 2. Canonical base and predecessor truth

Canonical main at authorization drafting:

```text
b4c660801133055db1371651c8956d6d64058925
```

Canonical tree:

```text
38879e9fe097fbb4424fa37edd1b0912bb9d275d
```

Latest relevant canonical readiness merge:

```text
PR #132
docs(kdo): audit H4-R4B-B2 start/TTL/output readiness

reviewed exact head:
f3c0a00eb5f3afb0c0150773c9b4477c2f5306bd

merge commit:
b4c660801133055db1371651c8956d6d64058925

ordered parents:
1. ccf08bbf007eae0794332c691838d5c96ce8f77b
2. f3c0a00eb5f3afb0c0150773c9b4477c2f5306bd

merge verification:
verified=true
reason=valid
```

The canonical readiness decision established all of the following:

```text
MONOLITHIC_R4B_B2_AUTHORIZATION=REJECT
R4B_B2_SUB_SLICING=REQUIRED
B2A_DOCKER_START=NO
B2A_LIVE_WORKLOAD=NO
B2A_MAX_POSITIVE_STATE=PRESTART_READY
FIRST_LIVE_START=B2B_OR_EQUIVALENT_SEPARATELY_AUTHORIZED_CONTROLLER
```

This document converts only that B2A readiness result into a bounded future implementation authorization.

---

## 3. Exact canonical source identities inspected

The authorization is grounded in the following current canonical source blobs:

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

The docs-only merges after R4B-B1 did not change these runtime identities.

---

## 4. Why B2A needs a bounded internal R3G-E factorization

Canonical R3G-E currently exposes an internal module-level `createGvisorDockerOutputTransport()` whose `captureOutput()` flow is purpose-equivalent to:

```text
validate exact request/provider/socket
-> resolve exact Docker binding
-> inspect exact container
-> derive output channel identity
-> POST fixed Docker attach request
-> validate HTTP 101 upgrade + media type
-> create bounded multiplex accumulator
-> own/read stream until stream termination
-> finish aggregation
-> return terminal capture
```

This is correct for the canonical R3G-E theorem, but it cannot directly establish B2A `PRESTART_READY` because `captureOutput()` returns only after the output stream terminates. There is no current trusted readiness boundary that proves:

```text
attach upgrade complete
AND
one bounded reader is active
AND
container remains pristine dormant
AND
stream ownership can continue without close/reopen into a future live-start controller
```

Therefore B2A may perform one **internal-only factorization** of the canonical R3G-E Docker attach/provenance machinery so that both canonical R3G-E and B2A can use the same trusted opener/reader primitive.

This factorization is authorized only if:

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

If the factorization cannot preserve the canonical R3G-E theorem, implementation must stop and return to authorization rather than duplicate or widen output authority.

---

## 5. R4B-B2A theorem

A positive R4B-B2A result may claim only:

```text
One exact canonical R4B-B1 CREATED admission and its durable one-shot permit
reservation lineage were validated. The exact Docker subject was re-observed
as the same pristine never-started runsc container. Kodac durably prepared and
claimed exactly one pre-start output ownership operation for that exact
executionAttemptIdentity, established exactly one canonical non-TTY Docker
attach channel with logs=0 while the container remained dormant, activated
exactly one trusted bounded multiplex reader/controller for that channel, and
created one non-serializable module-sealed PRESTART_READY capability owned by
trusted K2 composition. The container was re-observed as pristine dormant
before PRESTART_READY was returned. No Docker start request was issued and no
workload process was permitted to execute.
```

R4B-B2A may not claim:

```text
container started
workload executed
running gVisor subject resolved
TTL armed
TTL enforced
terminal lifecycle proven
final output aggregation settled
positive R3G-E E3 output evidence committed
R3G-F E4 produced
permit successfully consumed by execution
cleanup/removal performed
H4 complete
H6 ready
```

---

## 6. Absolute zero-start invariant

The central B2A invariant is:

```text
R4B_B2A
=>
DOCKER_START_CALLS = 0
WORKLOAD_PROCESS_OCCURRENCES = 0
RUNNING_SUBJECTS_CREATED_BY_B2A = 0
TTL_ARM_ATTEMPTS = 0
```

This is not a test-only expectation. It is an authorization boundary.

The B2A implementation must contain no code path capable of issuing:

```text
POST /v1.48/containers/{id}/start
Docker ContainerStart
Docker exec
Docker restart
Docker stop
Docker kill
Docker remove
shell/docker CLI start fallback
```

Any implementation need for one of those operations invalidates this authorization.

---

## 7. Exact predecessor required

B2A accepts only one exact canonical R4B-B1 result whose durable lineage proves:

```text
one SandboxAdmissionPermit
one SandboxAdmissionPermitCommit
one SandboxAdmissionConsumptionReservation
one durable reservation commit
one SandboxDormantCreatePrepared
one durable create-prepared commit
one exact SandboxDormantDockerObservation
one SandboxDormantCreatedAdmission
one durable created-admission commit
```

The exact B1 result must bind one execution attempt, one requirement, one workload, one create operation, one deterministic container occurrence, and one exact Docker container ID.

B2A must reject:

```text
structural lookalike B1 result
missing durable B1 commit
wrong executionAttemptIdentity
wrong permit/reservation lineage
wrong requirement/workload identity
caller-selected container ID
caller-selected Docker binding
synthetic observation
reconstructed partial B1 evidence
```

---

## 8. Required pristine dormant revalidation

Before any pre-start output ownership claim or attach activity, B2A must independently re-observe the exact B1 container through the trusted Docker control-plane/socket provenance and prove it remains a pristine never-started candidate.

At minimum the revalidation must preserve the canonical B1 security theorem and establish a purpose-equivalent state:

```text
container ID = exact B1 container ID
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

B2A must fail closed if the subject is running or if its never-started/dormant theorem is ambiguous.

B2A must not repair a mismatched subject by stop/kill/remove/recreate.

---

## 9. Exact Docker attach surface

B2A authorizes only the canonical pre-start output channel operation:

```text
POST /v1.48/containers/{exact-container-id}/attach

query:
logs=0
stream=1
stdin=0
stdout=1
stderr=1

required protocol result:
HTTP 101
Connection: Upgrade
Upgrade: tcp
Content-Type: application/vnd.docker.multiplexed-stream
```

The attach target container ID is derived only from the validated B1 created admission.

The Docker API version remains pinned to:

```text
1.48
```

The socket endpoint must be the same canonical local Unix-socket trust family already bound by R3F/B1 and must be revalidated immediately before and after trusted attach establishment.

B2A must not provide:

```text
generic Docker request(method, path, body)
arbitrary HTTP method selection
arbitrary Docker API path selection
caller-selected socket path
TCP Docker endpoint
TLS Docker endpoint
remote Docker host
Docker CLI fallback
shell fallback
PATH lookup
```

---

## 10. Required durable pre-start records

B2A shall define immutable durable records purpose-equivalent to:

```text
SandboxPrestartOutputPrepared
SandboxPrestartOutputPreparedCommit
SandboxPrestartOwnershipClaim
SandboxPrestartOwnershipClaimCommit
SandboxPrestartFailure
SandboxPrestartFailureCommit
```

The prepared record must bind at least:

```text
permitIdentity
reservationIdentity
executionAttemptIdentity
requirementIdentity
workloadIdentity
B1 createdAdmissionIdentity
B1 createdAdmissionCommitIdentity
containerId
container occurrence/name identity
providerIdentity
socketEndpointIdentity
prestartOutputChannelIdentity
prestartOutputOperationIdentity
maxOutputBytes
fixed Docker attach protocol identity
```

The ownership claim must bind at least:

```text
prestartOutputOperationIdentity
preparedIdentity
executionAttemptIdentity
trusted ownerInstanceIdentity
ownershipClaimIdentity
```

The ownership claim is **not** a start-dispatch claim.

It grants no mutation authority beyond establishing and owning the fixed pre-start attach channel.

Every durable acknowledgment must bind the exact record identity and `durability = durable`.

---

## 11. Cross-process single-owner rule

Exactly one durable ownership claim may be created for one B2A pre-start output operation in v1.

Required invariant:

```text
ONE executionAttemptIdentity
=>
ONE prestartOutputOperationIdentity
=>
AT MOST ONE durable ownerInstanceIdentity claim
=>
AT MOST ONE live PRESTART_READY controller
```

B2A v1 deliberately chooses safety over automatic owner takeover.

If the trusted process loses the live controller after the durable ownership claim exists:

```text
AUTOMATIC_OWNER_TAKEOVER=NO
AUTOMATIC_REATTACH=NO
AUTOMATIC_RETRY_WITH_NEW_OWNER=NO
DOCKER_START=NO
```

The attempt may become stranded in a safe dormant state and require a later separately authorized recovery/cleanup path.

This avoids a durable claim being interpreted as proof that a live stream or reader survived a process crash.

---

## 12. PRESTART_READY is live and non-serializable

`PRESTART_READY` is not a durable evidence record.

It is a process-local capability with all of these properties:

```text
non-serializable
module-sealed
not caller-constructible
not caller-validatable by structure alone
exactly-once owned
bound to one executionAttemptIdentity
bound to one prestartOutputOperationIdentity
bound to one exact container ID
bound to one exact live reader/controller
bound to one exact output byte accumulator
```

A module-private `WeakSet`, `WeakMap`, private nominal object identity, or stronger equivalent mechanism must prevent a structural lookalike from becoming a valid capability.

JSON serialization, durable persistence, clone/reconstruction, or plain-object rebuilding must not recreate readiness.

No durable record may claim:

```text
the hijacked stream is live
the trusted reader is active
PRESTART_READY survived process restart
```

---

## 13. One trusted bounded reader

A successful HTTP upgrade alone is insufficient.

Before PRESTART_READY, the trusted runtime must have activated exactly one bounded reader/controller over the exact hijacked multiplex stream.

That reader/controller must own:

```text
exact live socket/session
exact provider/socket provenance
exact executionAttemptIdentity
exact container ID
exact prestartOutputChannelIdentity
exact prestartOutputOperationIdentity
one shared stdout+stderr byte accumulator
canonical Docker 8-byte multiplex framing parser
maxOutputBytes from the exact requirement
abort/transport-loss invalidation
```

The same logical reader/accumulator must later be consumable by B2B without closing and reopening the output stream.

B2A does not authorize B2B consumption yet.

The reader must not expose:

```text
raw socket to caller
raw writable stream to caller
stdin writes
per-stream independent byte budgets
unbounded buffering
arbitrary framing mode
TTY mode
```

Any raw payload byte observed before the first separately authorized start is an invariant violation. B2A must invalidate readiness, close the owned channel, persist failure evidence where authoritative settlement is possible, and must not start the container.

---

## 14. Required positive ordering

A successful B2A preparation must preserve this semantic order:

```text
1. validate exact B1 CREATED admission/result lineage
2. validate exact durable B1 commits
3. establish canonical requirement/workload identities
4. establish canonical R3F provider/socket provenance
5. revalidate exact Docker Unix-socket endpoint identity
6. independently reobserve exact B1 container
7. prove pristine never-started dormant state
8. derive deterministic prestartOutputChannelIdentity
9. derive deterministic prestartOutputOperationIdentity
10. derive immutable SandboxPrestartOutputPrepared
11. durably create/validate PRESTART_OUTPUT_PREPARED commit
12. derive one trusted ownerInstanceIdentity from trusted K2 composition
13. durably create-once PRESTART_OWNERSHIP_CLAIM before attach
14. revalidate exact Docker socket endpoint
15. issue exactly one fixed pre-start Docker attach request
16. validate exact HTTP 101 upgrade and media type
17. activate one trusted bounded multiplex reader/accumulator
18. prove no payload bytes have been accepted before start
19. independently reobserve exact container again
20. prove it remains pristine dormant / never-started
21. create one module-sealed process-local PRESTART_READY capability
22. return only the bounded preparation result/capability
```

No start dispatch claim is created in B2A.

No Docker start request occurs anywhere in this sequence.

---

## 15. No durable READY record

B2A must not persist a record named or interpreted as:

```text
PRESTART_READY_COMMIT
LIVE_CHANNEL_COMMIT
READER_ACTIVE_COMMIT
READY_AFTER_RESTART
```

Durable records may prove preparation and ownership claim history only.

The live capability itself is the liveness proof and exists only while its trusted controller exists.

This distinction is mandatory to prevent stale durable metadata from becoming execution authority later.

---

## 16. Cancellation and abort

Required B2A behavior:

```text
pre-aborted before durable preparation
-> no attach
-> no start

abort after PRESTART_OUTPUT_PREPARED but before owner claim
-> no attach
-> no start

abort after owner claim but before attach
-> no attach
-> ownership claim remains non-transferable in B2A v1
-> no start

abort while attach handshake is pending
-> destroy/close owned request/socket where authoritative
-> persist bounded failure evidence where possible
-> no retry with another owner
-> no start

abort after attach but before PRESTART_READY
-> destroy owned channel
-> invalidate any local capability candidate
-> persist bounded failure evidence where possible
-> no start

abort after PRESTART_READY but before future B2B consumption
-> atomically invalidate capability
-> close owned stream/controller
-> persist failure evidence where possible
-> no start
```

Caller cancellation must never detach a live pre-start reader into an ownerless background task.

---

## 17. Transport loss and reader failure

Any of the following invalidates PRESTART_READY immediately:

```text
socket error
socket close before future authorized handoff
Docker endpoint replacement
unexpected Docker response/protocol frame
multiplex parser error
payload byte before start
reader task rejection
buffer/output limit violation
caller abort
trusted owner teardown
container no longer pristine dormant
```

On invalidation:

```text
capability becomes unusable
owned channel is closed/destroyed
no start occurs
no new owner is automatically installed
failure evidence is durably attempted where the authoritative state permits
```

A stale object reference must fail B2B capability validation even if user code retained it.

---

## 18. Concurrency and replay

B2A must prove all of the following:

```text
concurrent prepare calls for one executionAttemptIdentity
-> at most one durable ownership claim
-> at most one live attach owner

replay of exact B1 result after owner claim exists
-> no second attach
-> no new PRESTART_READY owner

structural clone of PRESTART_READY
-> rejected

serialized/deserialized PRESTART_READY
-> rejected

capability reuse after invalidation
-> rejected

capability reuse after future B2B consumption
-> reserved for B2B theorem; B2A must expose no reset path
```

No B2A API may replenish or reset an output byte budget after live ownership is established.

---

## 19. Relationship to canonical R3G-E

R3G-E remains canonical and its existing theorem is protected.

B2A may reuse the canonical R3G-E parser, identity helpers, provider/socket validation, attach protocol constants, and a newly factored internal channel-opener/reader primitive where that reuse is exact.

B2A must not commit canonical positive R3G-E E3 evidence because no workload execution or terminal lifecycle has occurred.

B2A must not fabricate:

```text
GvisorOutputEnforcementResult
GvisorOutputBoundRecord
GvisorOutputBoundCommit
GvisorTtlArmRecord
GvisorTtlTerminalRecord
```

The future B2B authorization must separately define how the exact same live reader/accumulator crosses into running-subject TTL/output continuity and how canonical R3G-E-compatible terminal output evidence is eventually formed.

---

## 20. Relationship to canonical R3G-D

B2A does not invoke or modify TTL enforcement authority.

Required invariant:

```text
B2A_TTL_ARM_ATTEMPTS=0
```

No running gVisor subject exists by the B2A theorem, so no R3G-D ARM can be claimed.

Any implementation need to alter R3G-D production files invalidates this authorization.

---

## 21. Relationship to future R4B-B2B

R4B-B2B remains a separate un-authorized live-execution theorem.

A future B2B authorization must still pin, at minimum:

```text
exact Docker start mutation
atomic PRESTART_READY consumption
MAX_START_TO_ARM_INTERVAL_MS
trusted start-to-ARM clock
trusted deadline owner
deadline-miss exact-subject termination/containment authority
unknown start outcome reconciliation
same-reader continuity across dormant -> running
running-subject R3G-D ARM
terminal lifecycle evidence
terminal output evidence
R3G-F E4 continuity
final permit consumption settlement
```

B2A implementation success does not imply B2B readiness.

---

## 22. Protected authority surfaces

B2A must preserve the canonical behavior and authority boundaries of at least:

```text
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
packages/kodac-runtime/src/trust/sandbox-admission-dormant-create.ts
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
packages/kodac-runtime/src/trust/sandbox-physical-conjunction-gvisor.ts
packages/kodac-runtime/src/trust/sandbox-admission-permit.ts
```

The only permitted canonical R3G-E production-file change is the internal factorization described in this authorization.

Generic `ExecutionGateway.runCommand()` ASK remains blocked.

R3G-F ASK remains blocked.

---

## 23. Package-root authority boundary

The future B2A implementation may root-export only bounded entry points and validated durable metadata required for trusted composition.

It must not root-export:

```text
raw Docker attach opener
raw Socket
raw hijacked stream
raw channel transport
caller-selectable Docker path
caller-selectable Docker method
caller-selectable socket path
prestart owner claim creator
PRESTART_READY creator
PRESTART_READY validator accepting structural objects
reader reset/reopen primitive
byte-budget reset primitive
```

If an opaque readiness handle/type is visible through a bounded gateway, its validity must depend on module-private identity/seal state and not on caller-controlled properties.

Direct deep-module internal helpers remain non-public implementation seams and do not become package-root authority.

---

## 24. Authorized implementation surface

After this authorization is canonical, the first B2A product implementation PR may change only purpose-equivalent paths within this exact narrow set:

```text
A packages/kodac-runtime/src/trust/sandbox-admission-prestart-output.ts
A packages/kodac-runtime/src/execution/gateway-gvisor-output-channel-internal.ts
A packages/kodac-runtime/src/execution/gateway-gvisor-docker-prestart-output-runtime.ts
M packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
M packages/kodac-runtime/src/index.ts
A schema/kdo-h4-r4b-b2a-prestart-prepared.schema.json
A packages/kodac-runtime/test/kdo-h4-r4b-b2a-prestart-output-readiness.test.ts
M packages/kodac-runtime/test/kdo-h4-r3g-e-docker-stream.test.ts
```

The `gateway-gvisor-output-runtime.ts` and existing R3G-E docker-stream test changes are authorized **only** to factor/reuse the already canonical fixed attach/provenance/reader machinery and to prove canonical R3G-E behavior did not regress.

No other R3G-E production/test file is authorized.

No R3G-D, R3G-F, B1, permit, policy, workflow, dependency, package manifest, native binary, Docker CLI, or external-service change is authorized.

If implementation discovers that B2A cannot satisfy the theorem within this path set, implementation must stop and return to authorization rather than widen scope.

---

## 25. Required implementation tests

The B2A implementation PR must include exact hostile and positive proofs for at least the following.

### 25.1 Zero-start proofs

```text
positive PRESTART_READY path -> Docker start calls = 0
all failure paths -> Docker start calls = 0
all abort paths -> Docker start calls = 0
all replay/concurrency paths -> Docker start calls = 0
all recovery paths -> Docker start calls = 0
TTL ARM attempts = 0
```

The test harness should fail immediately if any production B2A path touches a Docker start endpoint.

### 25.2 Exact predecessor proofs

Reject:

```text
forged B1 result
wrong B1 commit
wrong permit/reservation lineage
wrong executionAttemptIdentity
wrong requirement/workload identity
wrong container ID
wrong created-admission identity
```

### 25.3 Dormant revalidation proofs

Reject before attach if any protected B1 state changed, including:

```text
running=true
pid != 0
restart count != 0
runtime != runsc
network mode != none
unexpected network attachment
wrong image/source identity
wrong entrypoint/arguments
wrong resource limits
privileged=true
TTY=true
stdin enabled
stdout/stderr attach disabled
unexpected host authority
```

### 25.4 Attach protocol proofs

Prove only the exact fixed request is accepted:

```text
POST
/v1.48/containers/{exact-id}/attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1
HTTP 101
Connection: Upgrade
Upgrade: tcp
application/vnd.docker.multiplexed-stream
```

Reject wrong status, wrong headers, wrong media type, endpoint replacement, wrong container, malformed upgrade, timeout, abort, or unexpected response body behavior.

### 25.5 Reader activation proofs

Prove PRESTART_READY is impossible until:

```text
attach upgraded
one bounded reader task is active
one aggregate accumulator is bound
no payload byte was accepted
post-attach dormant revalidation passed
```

### 25.6 Capability-seal proofs

Reject:

```text
plain-object lookalike
Proxy
object with copied visible fields
JSON round-trip
structured clone equivalent
stale invalidated handle
second use where exactly-once ownership forbids it
```

### 25.7 Concurrency proofs

Prove concurrent calls cannot create:

```text
two owner claims
two attach sessions
two live readers
two PRESTART_READY capabilities
```

### 25.8 Owner-loss proofs

After durable owner claim exists, simulate:

```text
abort before attach
attach failure
reader failure
transport close
trusted owner teardown
```

and prove:

```text
no owner takeover
no reattach
no start
capability invalidated
container remains dormant where observable
```

### 25.9 R3G-E regression proofs

The factorized internal channel path must re-prove canonical R3G-E Docker-stream behavior, including:

```text
same fixed attach request
same provider/socket provenance
same multiplex framing
same shared stdout+stderr byte budget
same exact N boundary
same N+1 fail-closed behavior
same malformed-frame rejection
same abort/transport-loss behavior
same no-budget-reset semantics
same root-export restrictions
```

---

## 26. Static forbidden-authority scan

The implementation review must include an explicit production-delta scan for unauthorized authority tokens/patterns, including purpose-equivalent forms of:

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

Any reachable B2A product code that can exercise those operations fails authorization.

Mentions in tests asserting absence are not authority.

---

## 27. Failure taxonomy

The implementation should define bounded typed failures purpose-equivalent to:

```text
BLOCKED
REJECTED
UNPROVEN
INDETERMINATE
OWNER_LOST
ATTACH_FAILED
READER_FAILED
DORMANT_REVALIDATION_FAILED
ABORTED
```

No failure class may imply the permit is reusable or that a new live owner may be automatically created.

No failure may promote B2A to execution success.

---

## 28. Evidence and review gates for the product PR

The first B2A implementation PR must not merge unless all of the following hold on the exact final head:

```text
AUTHORIZED_CHANGED_PATHS_ONLY=PASS
NO_WORKFLOW_OR_DEPENDENCY_DRIFT=PASS
ZERO_DOCKER_START_PROOF=PASS
ZERO_TTL_ARM_PROOF=PASS
PRESTART_READY_SEAL_PROOF=PASS
SINGLE_OWNER_CONCURRENCY_PROOF=PASS
FIXED_ATTACH_PROTOCOL_PROOF=PASS
DORMANT_REVALIDATION_PROOF=PASS
R3G_E_REGRESSION_PROOF=PASS
FULL_REQUIRED_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

A stale review from before the final implementation mutation is insufficient.

A generic bot walkthrough is not a substitute for the exact-head actionable finding state.

---

## 29. Explicit non-grants

This authorization does not grant:

```text
R4B-B2B implementation
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
```

It also does not authorize automatic recovery/takeover of a lost PRESTART_READY owner.

---

## 30. Stop conditions

Implementation must stop and return to authorization if any of the following becomes necessary:

```text
Docker start to validate readiness
TTL ARM to validate readiness
container stop/kill/remove cleanup
second owner takeover after durable owner loss
reopening output after a live workload has started
modifying R3G-D or R3G-F production files
widening R3G-E package-root authority
caller-selectable Docker socket/method/path
new dependency
workflow change
native helper change
Docker CLI fallback
source path outside the authorized set
```

Safety takes precedence over automatic progress.

---

## 31. Authorization acceptance criteria

This docs-only authorization may become canonical only if review agrees with all of these decisions:

```text
B2A is a zero-start theorem.
PRESTART_READY is live, non-serializable, and module-sealed.
There is exactly one durable owner claim and at most one live reader.
Owner loss after the claim is fail-closed and non-transferable in B2A v1.
The fixed Docker attach path is the only new Docker operation.
No positive R3G-E E3 evidence is produced in B2A.
No R3G-D ARM is attempted in B2A.
The R3G-E factorization preserves its canonical theorem and public authority surface.
B2B remains separately unauthorized.
```

If review cannot accept those constraints, this authorization must not merge.

---

## 32. Final authorization statement

If and only if this document becomes canonical after exact-head CI and fresh independent exact-head review, Kodac authorizes one subsequent bounded implementation of:

```text
KDO-H4-R4B-B2A
PRE-START OUTPUT OWNERSHIP + START PREPARATION
```

with the maximum positive state:

```text
PRESTART_READY
```

and the absolute negative-space theorem:

```text
NO DOCKER START
NO LIVE WORKLOAD
NO TTL ARM
NO FINAL OUTPUT EVIDENCE
NO R3G-F E4
```

All later live-execution authority remains closed.
