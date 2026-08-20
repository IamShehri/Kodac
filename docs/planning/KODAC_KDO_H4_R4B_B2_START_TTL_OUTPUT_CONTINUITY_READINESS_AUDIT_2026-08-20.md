# KDO-H4-R4B-B2 — Start / TTL / Output Continuity Readiness Audit

Date: 2026-08-20
Status: **READINESS AUDIT CANDIDATE — DOCS ONLY / NO PRODUCT IMPLEMENTATION AUTHORITY**
Repository: `TheHalfMoon/Kodac`
Canonical base: `ccf08bbf007eae0794332c691838d5c96ce8f77b`
Canonical base tree: `c1ef986d513dca6297dbba75d672e064cd0aa60e`

---

## 1. Decision

```text
GATE:
KDO-H4-R4B-B2-READINESS

NAME:
START / TTL / OUTPUT CONTINUITY READINESS AUDIT

CHANGE CLASS:
DOCS ONLY / READINESS / NO PRODUCT IMPLEMENTATION

CANONICAL R4B-B1:
MERGED / PROVEN FOR DORMANT CREATE-ONLY SCOPE

R4B-B2 PRODUCT IMPLEMENTATION:
NOT AUTHORIZED

DOCKER START AUTHORITY:
NO

TTL ARM AUTHORITY CHANGE:
NO

OUTPUT RUNTIME AUTHORITY CHANGE:
NO

R3G-F ASK ENABLEMENT:
NO

GENERIC EXTERNAL runCommand ASK:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO

K3-R6+ AUTHORIZED:
NO
```

The live canonical repository is **not ready for one monolithic R4B-B2 implementation authorization**.

The decisive reason is a temporal authority seam between the newly canonical dormant-create boundary and the already canonical TTL/output proof machinery:

```text
R4B-B1 now gives Kodac an exact dormant container before workload execution.

Current R3G-E output enforcement obtains a running gVisor subject and a durable
R3G-D ARM record before it reserves the output operation and opens Docker attach.

Current R3G-E uses logs=0, so bytes emitted before attach are intentionally not
reconstructed.

Therefore a new R4B-B2 start primitive cannot safely preserve the full output
bound by simply starting the container and then entering current R3G-E.
```

The correct next direction is to sub-slice R4B-B2 while keeping the **first live start** out of the first slice entirely.

Recommended next separate founder-reviewed candidate:

```text
R4B-B2A
PRE-START OUTPUT OWNERSHIP + START PREPARATION
NO DOCKER START
NO LIVE WORKLOAD
```

Only after B2A is separately authorized, implemented, and proven should Kodac consider a live-start slice:

```text
R4B-B2B
ATOMIC LIVE START
+ ACTIVE FAIL-CLOSED CONTINUITY OWNER
+ RUNNING-SUBJECT TTL ARM
+ CONTINUOUS PREOPENED OUTPUT
+ TERMINAL EVIDENCE
+ FINAL R3G-F E4 CONTINUITY
```

This audit authorizes neither slice.

The architecture requirement added by this reconciliation is strict:

```text
B2A MAY REACH ONLY PRESTART_READY.

B2A MUST NOT START THE CONTAINER.

THE FIRST LIVE START MAY OCCUR ONLY INSIDE B2B OR AN EQUIVALENT
SEPARATELY AUTHORIZED CONTROLLER AFTER ONE TRUSTED FAIL-CLOSED OWNER
ALREADY OWNS OUTPUT CONTINUITY, START-TO-ARM DEADLINE ENFORCEMENT,
TERMINAL FAILURE RECORDING, AND EXACT-SUBJECT TERMINATION/CONTAINMENT.
```

This removes the possibility that B2A returns a successful running handoff while no trusted component owns the post-start failure interval.

---

## 2. Why this readiness audit is required

The canonical R4B master authorization explicitly states that R4B-B must not be inferred and requires a separate readiness review before active create/start admission receives authority.

That readiness review must resolve at least:

```text
exact Docker API admission operations
exact daemon/socket trust anchor
create-vs-start ordering
runtime=gVisor enforcement at create/start
immutable source admission semantics
CPU/memory/network configuration before start
TTL watchdog arm ordering
aggregate output reservation/attach ordering
container identity binding
one-shot permit reservation/consumption transaction
abort and cleanup semantics
crash recovery
unknown mutation outcome handling
final R3G-F E4 continuity
```

R4B-B1 intentionally solved only the first safe mutation boundary: exact Docker create with a never-started subject.

The remaining start boundary is qualitatively different. `POST /containers/start` is the point at which admitted repository workload code can begin executing. Once that mutation occurs, any ordering mistake involving output, TTL, identity, cleanup or proof becomes a real execution-trust failure rather than a dormant-state bookkeeping defect.

This audit therefore treats **start dispatch** as a separate live-execution authority boundary and refuses to place it into B2A.

---

## 3. Exact canonical repository state inspected

Canonical main:

```text
ccf08bbf007eae0794332c691838d5c96ce8f77b
```

Canonical tree:

```text
c1ef986d513dca6297dbba75d672e064cd0aa60e
```

Latest relevant canonical H4 merge:

```text
PR #130
feat(kdo): implement H4-R4B-B1 dormant Docker create admission

merge commit:
ff455b648632b37c2460353c36f447e797b17e4e
```

PR #131 is a separate K3 donor-audit documentation merge and grants no H4/R4B-B2 authority.

Relevant canonical source identities inspected at the current base:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
a917577d154ed14d7fd0528a69242846c53a7af3

packages/kodac-runtime/src/trust/sandbox-admission-dormant-create.ts
b744c2c5150d7dfaf53075416fa93bd54de89d05

packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
f9e2dda11fe26d481e2e6c328c37cd37a6260106

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
26b0f8094afb8e61ec29e05496c7aa91bf2f6e7f

packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
b55e5068682d9ae824a619b682c694c3a95e6095

packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
4e094b54cbe2c301deff5ecb64634199fca2c425

packages/kodac-runtime/src/index.ts
90ee90846abc3780bfbc4cd398269201f9babe41
```

No open R4B-B2 PR or branch existed at audit start.

---

## 4. What canonical R4B-B1 now proves

R4B-B1 establishes a durable exact dormant admission subject after one exact one-shot permit is reserved.

The canonical result binds:

```text
permit identity
reservation identity
executionAttemptIdentity
requirement identity
workload identity
createOperationIdentity
prepared identity
exact Docker container ID
canonical deterministic container name
canonical R3F-compatible binding identity
Docker observation identity
createdAdmissionIdentity
durable CREATED commit identity
```

Before positive CREATED settlement, trusted Docker observation proves a pristine dormant state including:

```text
runtime = runsc
network mode = none
network attachment count = 0
exact image/source lineage
exact executable + argument identity
exact CPU/memory/memory-swap limits
restart policy = no
privileged = false
TTY = false
running = false
paused = false
restarting = false
dead = false
pid = 0
restart count = 0
exact canonical labels
```

This is the correct predecessor for a future start gate because Kodac no longer has to discover or trust an arbitrary pre-existing container at the moment execution begins.

R4B-B1 deliberately does **not** prove:

```text
output channel established
output budget reserved
container started
runtime subject live
TTL armed
terminal lifecycle proven
output bound terminalized
R3G-F E4 produced
permit fully consumed by a proven execution
H4 complete
```

---

## 5. Canonical R3G-E ordering creates the decisive temporal seam

Current R3G-E is a proof/enforcement path for an execution subject that already crosses a trusted admission boundary.

Its runtime flow currently performs a purpose-equivalent sequence:

```text
validate requirement and ALLOW policy
-> establish canonical R3F provider/socket provenance
-> start R3G-D lifecycle enforcement
-> await exact running gVisor subject resolution
-> await durable R3G-D ARM evidence
-> derive output channel + output operation identities
-> durably reserve output operation
-> Docker attach/capture with logs=0, stream=1, stdin=0, stdout=1, stderr=1
-> await lifecycle terminal evidence
-> durably commit bounded output evidence
```

That ordering is valid only under its canonical theorem: R3G-E does not claim reconstruction of output that occurred before its trusted admission boundary.

It becomes insufficient if a new R4B-B slice itself introduces the first start mutation and then calls the current R3G-E path afterward.

The problem is exact:

```text
START
-> workload may emit stdout/stderr immediately
-> R3G-D needs a live subject before it can resolve/arm
-> current R3G-E waits for that ARM
-> current R3G-E then opens logs=0 attach
-> any bytes emitted before attach are outside the accumulator
```

A positive future claim that `maxOutputBytes` governed the **entire admitted workload occurrence** cannot tolerate that gap.

---

## 6. Historical R3G-E review does not authorize a new start-before-attach boundary

During R3G-E review, an external finding identified the same underlying fact: `logs=0` excludes output emitted before attach when attach occurs after a container is already running.

That finding was dismissed for R3G-E because its bounded theorem intentionally starts at a trusted admission boundary and does not claim pre-admission history reconstruction.

R4B-B2 is different.

R4B-B2 would create the actual pre-execution admission transition. It cannot inherit the prior dismissal as permission to create an output-free interval after an approved one-shot workload begins.

Therefore:

```text
R3G-E_CANONICAL_DISMISSAL
!=
R4B-B2_PERMISSION_TO_START_BEFORE_OUTPUT_CHANNEL
```

The earlier dismissal becomes a design constraint for R4B-B2: the trusted admission boundary must be a point where a bounded output reader is already active before start dispatch.

---

## 7. Docker protocol evidence supports attach-before-start

Kodac's existing R3G-E protocol pin remains:

```text
MOBY_SOURCE_PIN=d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
MOBY_API_VERSION=1.48
MOBY_API_SOURCE=api/docs/v1.48.yaml
```

The pinned API defines separate operations for:

```text
POST /v1.48/containers/{id}/attach
POST /v1.48/containers/{id}/start
```

This audit also inspected Docker CLI source as independent sequence evidence:

```text
repository: docker/cli
commit: 28f756087eea5fa301f3fbf12b01ae62f91521c2
path: cli/command/container/run.go
```

The connected foreground `docker run` path performs the relevant high-level ordering:

```text
create container
-> attach to container
-> start container
```

This is **architecture evidence only**. Kodac does not import Docker CLI code, add a Docker CLI dependency, or delegate authority to Docker CLI behavior.

The important conclusion is narrower:

```text
PRE-START ATTACH IS A REAL DOCKER OPERATION SEQUENCE,
NOT A KODAC-INVENTED PROTOCOL ASSUMPTION.
```

---

## 8. Why one monolithic R4B-B2 authorization is rejected

A single R4B-B2 implementation PR would need to solve all of the following at once:

```text
new Docker start mutation authority
one-shot start dispatch fencing
pre-start Docker attach ownership
pre-start output budget reservation
single-reader stream lifecycle across dormant -> running -> terminal
running gVisor subject discovery
bounded start-to-ARM deadline enforcement
exact-subject fail-safe termination when ARM cannot be established
R3G-D watchdog preparation and ARM
R3G-E adaptation to a pre-opened continuously consumed output channel
terminal output/lifecycle conjunction
R3G-F final E4 continuity
abort during every intermediate transition
unknown start outcome reconciliation
cleanup after failed/indeterminate execution
final permit consumption settlement
```

That crosses multiple existing trusted modules whose current contracts were deliberately separated.

The readiness verdict is therefore:

```text
MONOLITHIC_R4B_B2_AUTHORIZATION=REJECT
R4B_B2_SUB_SLICING=REQUIRED
```

Sub-slicing, however, must not create an ownerless live workload between slices. That requirement determines the revised B2A/B2B boundary below.

---

## 9. Revised R4B-B2A candidate boundary — no live start

The smallest next active candidate should be:

```text
KDO-H4-R4B-B2A
PRE-START OUTPUT OWNERSHIP + START PREPARATION
```

A future separate B2A authorization should prove only a purpose-equivalent theorem:

```text
one exact durable R4B-B1 CREATED admission
+ exact durable one-shot permit reservation lineage
-> exact dormant subject revalidation
-> durable output-operation reservation
-> exact Docker attach established while container is still dormant
-> one trusted bounded reader/controller owns the hijacked stream
-> one non-serializable module-sealed PRESTART_READY capability exists
-> durable START_PREPARED metadata may be recorded
-> container is reobserved pristine dormant
```

B2A ends there.

B2A must prove:

```text
DOCKER_START_CALLS=0
WORKLOAD_PROCESS_OCCURRENCES=0
RUNNING_SUBJECTS_CREATED_BY_B2A=0
TTL_ARM_ATTEMPTS=0
```

B2A must not acquire a start dispatch claim, because a durable claim separated from its live fail-closed controller could survive while the live stream/reader does not.

B2A must not report execution success. Its maximum positive state is:

```text
PRESTART_READY
```

That state means only that one exact live trusted controller currently owns the pre-opened channel for one exact dormant admission and is eligible for immediate one-shot consumption by a separately authorized B2B transition.

---

## 10. PRESTART_READY is a live capability, not a durable fact

A central requirement for B2A is the distinction between durable metadata and process-local liveness.

Durable storage may record:

```text
output reservation identity
output operation identity
container/binding identities
start prepared identity
expected provider/socket identity
expected maxOutputBytes
```

Durable storage must **not** claim:

```text
"the hijacked stream is still live"
"the reader is still active"
"this capability can be replayed after process restart"
```

`PRESTART_READY` must therefore be represented, if later authorized, by a non-serializable, module-sealed, exactly-once process-local capability owned by trusted K2 composition.

If the owning process crashes, the capability is gone and the container remains dormant. Recovery may inspect durable metadata, but it must not start the container until a fresh separately authorized pre-start channel/read-owner theorem succeeds again.

This keeps process failure safe:

```text
B2A PROCESS CRASH
=>
NO START
=>
NO UNOWNED RUNNING WORKLOAD
```

---

## 11. One trusted reader must already own the stream

B2A readiness cannot mean only that an attach HTTP upgrade returned successfully.

Before `PRESTART_READY`, one trusted controller must already own exactly one bounded reader over the hijacked multiplexed stream.

The reader/controller must bind:

```text
exact B1 container ID
exact executionAttemptIdentity
exact requirementIdentity
exact workloadIdentity
exact R3F provider identity
exact socketEndpointIdentity
exact outputChannelIdentity
exact outputOperationIdentity
exact maxOutputBytes
non-TTY Docker multiplex framing
stdin disabled
stdout enabled
stderr enabled
logs=0
stream=1
```

The reader must be the same logical owner that survives into the B2B live transition. B2B must not close and reopen output after start, because reopen creates a potential byte gap or duplication boundary.

A structural caller-provided stream, reader, transport or capability is not accepted evidence.

---

## 12. Atomic ownership rule for the first live start

The first future Docker start may occur only when the same trusted continuity controller has atomically transitioned from:

```text
PRESTART_READY
```

to a separately authorized B2B state in which it already owns all post-start obligations.

Before issuing `POST /containers/{id}/start`, that controller must own:

```text
1. the sole trusted output reader and aggregate byte accumulator;
2. the exact output-operation reservation;
3. the one-shot start dispatch state machine;
4. the start-to-ARM deadline clock;
5. running-subject resolution responsibility;
6. TTL ARM responsibility;
7. terminal failure evidence responsibility;
8. exact-subject fail-safe termination/containment authority or an already-active equivalent;
9. final channel drain/terminalization responsibility;
10. R3G-F E4 predecessor/evidence continuity.
```

There is no allowed state:

```text
STARTED + NO ACTIVE OWNER
```

There is no allowed successful B2A result containing a running subject.

---

## 13. Start-to-ARM interval is a B2B blocker, not a B2A parameter

Because revised B2A performs no start, its start-to-ARM interval is exactly:

```text
B2A_START_TO_ARM_INTERVAL=NOT_APPLICABLE
B2A_START_CALLS=0
```

B2B is the first slice that may create such an interval.

Before B2B authorization, the following must be pinned as normative values/contracts rather than left descriptive:

```text
MAX_START_TO_ARM_INTERVAL_MS=<EXACT NUMERIC VALUE REQUIRED>
START_TO_ARM_CLOCK_DOMAIN=<EXACT TRUSTED CLOCK REQUIRED>
START_TO_ARM_DEADLINE_OWNER=<EXACT CONTINUITY CONTROLLER REQUIRED>
DEADLINE_MISS_ACTION=<EXACT FAIL-SAFE TERMINATION/CONTAINMENT REQUIRED>
DEADLINE_MISS_EVIDENCE=<EXACT DURABLE TERMINAL FAILURE REQUIRED>
```

No numeric value is invented by this readiness audit because the repository has not yet supplied measured start-to-running-subject/ARM latency evidence from the exact future B2B path. Choosing a number without that evidence would be false precision.

Therefore:

```text
B2B_AUTHORIZATION_BLOCKED
UNTIL
NUMERIC_START_TO_ARM_BOUND + ENFORCEMENT_OWNER + FAIL_SAFE_ACTION
ARE SEPARATELY PINNED AND REVIEWED
```

The enforcement owner is not optional: it must be the same trusted continuity controller that owns the output reader before start.

---

## 14. `logs=1` is not an acceptable shortcut

A future B2 implementation must not solve the temporal gap by silently changing R3G-E from `logs=0` to `logs=1` and calling historical logs equivalent to complete bounded admission output.

That would introduce a different theorem involving:

```text
Docker log-driver behavior
history retention
ordering between historical and live bytes
log truncation/rotation
duplicate-delivery boundaries
restart history
pre-admission contamination
```

Current canonical R3G-E explicitly does not prove those semantics.

Therefore:

```text
B2_DIRECTION=CONTINUOUS_SINGLE_READER_BEFORE_START
LOG_HISTORY_RECONSTRUCTION=NOT_AUTHORIZED
```

Any future logs/history theorem requires separate authorization and evidence.

---

## 15. Candidate B2A pre-start ordering

A future B2A authorization should require a positive path no weaker than:

```text
1. validate exact SandboxDormantCreatedAdmission
2. validate exact durable CREATED commit
3. validate exact R4B-A permit + commit + B1 reservation lineage
4. rederive exact B1 executionAttemptIdentity
5. revalidate exact R3B requirement/workload theorem
6. reobserve exact Docker container and prove pristine dormant state
7. revalidate exact Docker Unix-socket endpoint identity
8. derive exact outputChannelIdentity
9. derive exact outputOperationIdentity and maxOutputBytes
10. durably reserve output operation
11. establish exact non-TTY Docker attach while dormant:
    logs=0, stream=1, stdin=0, stdout=1, stderr=1
12. validate upgrade/multiplex protocol and exact binding
13. start one trusted bounded reader/controller before any start authority exists
14. create one non-serializable module-sealed PRESTART_READY capability
15. derive deterministic startOperationIdentity
16. durably persist START_PREPARED metadata if useful
17. reobserve container and prove it remains pristine dormant
18. return PRESTART_READY only to trusted internal composition
```

B2A must then prove before merge:

```text
POST /containers/{id}/start count = 0
Docker exec count = 0
stop/kill/remove/restart count = 0
workload output payload bytes before B2B = 0 because subject remains dormant
```

---

## 16. Revised B2B live-start boundary

Only B2B or an equivalent separately authorized controller may acquire live start authority.

A candidate B2B direction is:

```text
exact live PRESTART_READY capability
+ exact dormant reobservation
-> atomically activate continuity controller obligations
-> acquire durable one-shot START_DISPATCH_CLAIM
-> issue at most one POST /v1.48/containers/{exactId}/start
-> continuously consume the already-open output stream with the same reader
-> resolve exact running gVisor subject
-> establish exact runtime/process lineage
-> arm R3G-D within the separately pinned numeric deadline
-> maintain continuous bounded output consumption
-> obtain R3G-D terminal lifecycle evidence
-> drain/terminalize output exactly once
-> produce R3G-E-compatible bounded output evidence
-> satisfy exact R3G-F A/B/C/D/E conjunction
-> produce final E4
-> durably settle one-shot permit consumed-by-exact-attempt
```

If any required post-start owner is unavailable before dispatch, the start call must not occur.

---

## 17. Candidate Docker start authority surface — B2B only

A future B2B implementation should authorize no more than:

```text
POST /v1.48/containers/{exactContainerId}/start
```

on the exact trusted local Unix-socket endpoint already bound by canonical R3F/B1 trust.

It must not expose:

```text
generic Docker request(method, path)
caller-selected container ID
caller-selected socket path
TCP/TLS/remote Docker host
Docker CLI fallback
shell fallback
Docker exec
Docker restart
Docker pause/unpause
arbitrary attach query parameters
```

Stop/kill/remove authority is not granted by this audit. However, B2B cannot be authorized for live start until a narrowly scoped exact-subject fail-safe termination or equivalent containment mechanism is also separately authorized and active for the start-to-ARM failure case.

---

## 18. One-shot start dispatch theorem — B2B only

Start is a mutation with the same fundamental ambiguity class as create, but its consequences are stronger because repository workload code may begin running.

A future B2B authorization must require durable fencing purpose-equivalent to:

```text
PRESTART_READY (live, non-serializable)
+ START_PREPARED (durable metadata)
-> CONTINUITY_OWNER_ACTIVE
-> START_DISPATCH_CLAIM (durable)
-> START_DISPATCHED_OR_RECONCILED
```

Rules:

```text
PRESTART_READY absent
-> no start

continuity owner not active
-> no start

start-to-ARM deadline/termination contract not active
-> no start

new durable dispatch claim
-> exactly one start dispatch may be attempted

existing dispatch claim
-> inspect/reconcile only
-> never issue another start automatically

transport timeout/disconnect/cancellation after dispatch may have begun
-> START_OUTCOME_INDETERMINATE
-> exact observation only
-> never blind retry
```

The safety objective remains:

```text
ONE ALLOWED-ONCE PERMIT
=>
ONE B1 CREATE ATTEMPT
=>
AT MOST ONE B2B START ATTEMPT
```

---

## 19. Continuous output ownership and atomic handoff semantics

The future implementation must preserve one logical bounded reader from before start through terminal output settlement.

Required invariants:

```text
ONE_OUTPUT_OPERATION_IDENTITY
ONE_MAX_OUTPUT_BYTES_BUDGET
ONE_ORDERED_FRAME_PARSER
ONE_SHARED_STDOUT_STDERR_RAW_PAYLOAD_COUNTER
ONE_AGGREGATE_TRANSCRIPT_ORDER
ONE_LOGICAL_READER_OWNER
NO REOPEN AFTER START
NO SECOND READER
NO REPLAY BUDGET
NO BYTE GAP
NO DUPLICATE BYTE ACCEPTANCE
NO REORDERED EVIDENCE
```

If internal ownership moves between B2A-preparation code and B2B orchestration, the move must be an in-process atomic capability transfer of the same underlying reader/accumulator, not close-and-reopen or serialize-and-reconstruct.

Preferably, one module-private `AdmissionContinuityController` owns the reader in both states:

```text
DORMANT_PRESTART_READY
-> STARTING
-> RUNNING_UNARMED
-> RUNNING_ARMED
-> TERMINALIZING
-> TERMINAL
```

The controller must fail closed on:

```text
reader error
Docker stream EOF before authoritative subject/lifecycle terminal state
framing error
socket replacement
container replacement
output overflow
unexpected second reader
ownership transfer ambiguity
start-to-ARM deadline miss
TTL ARM failure
terminal evidence failure
```

After start, reader/transport loss must produce durable terminal failure evidence and invoke the separately authorized exact-subject fail-safe termination/containment path; it must never be treated as successful bounded output.

---

## 20. Why TTL cannot simply be armed before Docker start

Canonical R3G-D physical TTL enforcement binds to a live exact gVisor subject/control endpoint and establishes runtime/process identity before its physical watchdog ARM is accepted.

A dormant B1 container has:

```text
running=false
pid=0
```

It does not yet expose the live runtime/process subject required by the canonical R3G-D theorem.

Therefore B2 cannot merely call current R3G-D ARM while the container remains dormant.

The live temporal shape, if later authorized, must instead be:

```text
continuous output reader active while dormant
-> fail-closed continuity owner active
-> start once
-> exact live running subject resolution
-> R3G-D ARM before separately pinned deadline
```

That deadline interval belongs entirely to B2B and must be actively enforced by the same owner that was active before start.

---

## 21. Exact-subject termination/containment is a live-start prerequisite

A start-to-ARM deadline is meaningless if missing the deadline has no fail-safe consequence.

Therefore B2B authorization is blocked until the repository separately pins one exact response to:

```text
container started
+
TTL ARM cannot be established before deadline
```

The response must be bound only to the exact admitted container/runtime occurrence and must not create generic Docker mutation authority.

Candidate classes include a narrowly authorized exact-subject termination primitive or an already-active lower-level containment mechanism. This audit does not choose or authorize one.

Normative readiness rule:

```text
NO FAIL-SAFE TERMINATION/CONTAINMENT OWNER
=>
NO LIVE START AUTHORIZATION
```

B2A can progress safely without resolving this because B2A does not start the container.

---

## 22. Abort semantics

### B2A

```text
abort before output reservation
-> no start; no live workload

abort after output reservation but before attach
-> no start; reservation may be burned according to future exact contract

abort during pre-start attach/reader establishment
-> close owned channel; no start

abort after PRESTART_READY but before B2B consumption
-> close reader/channel; invalidate ephemeral capability; container remains dormant

process crash at any B2A point
-> capability liveness lost; no start
```

### B2B future requirements

```text
abort before continuity owner active
-> no start

abort after owner active but before dispatch claim
-> no start; terminalize prestart state

abort after durable start dispatch claim but before socket dispatch
-> claim may burn attempt; no blind retry

abort after start dispatch may have begun
-> authoritative settlement/reconciliation required
-> output reader remains owned
-> start-to-ARM deadline remains enforced
-> no detach into untracked background uncertainty

abort after positive start but before TTL ARM
-> exact fail-safe termination/containment path required
-> durable terminal failure evidence required
```

---

## 23. Crash and recovery matrix

```text
B1 CREATED exists, B2A output reservation absent
-> safe dormant state; no start

output reservation durable, live reader absent
-> no start
-> durable identity alone does not restore liveness

attach/reader was once established but process crashed
-> PRESTART_READY capability destroyed
-> no start
-> fresh pre-start establishment required under future authorized recovery theorem

START_PREPARED exists, PRESTART_READY absent
-> no start

B2B continuity owner active but start claim absent
-> no start

START_DISPATCH_CLAIM exists
-> may-have-started
-> exact inspection/reconciliation only

Docker says running after uncertain start
-> same owner must continue output/deadline handling if still alive
-> otherwise failure/containment path required
-> never send second start automatically

Docker says dormant after a definitely pre-dispatch failure
-> no running subject
-> retry/reuse only if future authorization explicitly proves it safe

ambiguous/replaced/multiple/wrong subject
-> fail closed
```

A durable record can prove historical preparation. It cannot prove current ownership of a live socket stream after process failure.

---

## 24. Threat model additions

Future B2A/B2B review must explicitly defend against:

- start sent before the trusted output reader is active;
- B2A accidentally gaining start authority;
- output reservation created after workload bytes already escaped;
- attach bound to wrong container or wrong Docker socket;
- stale B1 CREATED admission reused after container replacement;
- a second start after timeout or reconnect;
- caller-selected container ID/start path/socket;
- PRESTART_READY forged from durable metadata without a live reader;
- serialized/replayed PRESTART_READY capability;
- attach stream replaced between readiness and start;
- Docker daemon/socket replacement between attach and start;
- second reader producing duplicate or reordered bytes;
- close/reopen handoff creating output gaps;
- runtime other than `runsc` after start;
- restart behavior producing an unapproved second process occurrence;
- early workload exit before exact running/TTL subject proof;
- start-to-ARM deadline with no enforcement owner;
- TTL ARM failure with no exact-subject containment;
- cancellation after dispatch resulting in untracked running code;
- post-start proof failure being mislabeled successful execution;
- `logs=1` history being substituted for exact admission-bound output;
- output duplication/gaps when integrating with R3G-E evidence;
- TTL ARM associated with another process generation/runtime instance;
- permit marked consumed before final E4 or left reusable after uncertain mutation;
- cleanup authority escaping the exact failed admitted subject;
- generic `runCommand` or R3G-F ASK being widened as a shortcut.

---

## 25. Current package-root authority must remain narrow

Canonical package root currently exposes the bounded B1 gateway/result and selected validated records while keeping raw Docker mutation composition internal.

A future B2A/B2B must preserve that pattern.

Package root must not expose:

```text
raw Docker start transport
raw caller-selectable attach transport
Docker socket configuration constructor
PRESTART_READY constructor
continuity-controller constructor
live reader/accumulator
start dispatch claim creator
mutable durable-store implementation
caller evidence injector
R3G-D raw subject resolver
R3G-F predecessor evidence resolver
```

`PRESTART_READY`, if implemented, should remain a module-private capability consumed by trusted internal orchestration rather than a general public token.

---

## 26. Required next authorization questions

### B2A authorization must answer

```text
What exact trusted component owns the pre-start hijacked stream?
How is its capability sealed against caller construction?
How is one bounded reader started before PRESTART_READY?
How is the exact output budget reserved once?
How does abort close the reader without any start?
Can a pre-start stream be safely re-established after process loss while container remains dormant?
What exact durable metadata is historical only?
What exact paths may change?
How is B2A tested to prove zero start calls?
```

### B2B authorization is additionally blocked until it answers

```text
What exact numeric MAX_START_TO_ARM_INTERVAL_MS applies?
What exact trusted clock measures it?
What exact controller owns and enforces the deadline before start?
What exact fail-safe action occurs on deadline/ARM failure?
What exact authority may terminate/contain only the admitted subject?
How is the same output reader preserved through start and terminalization?
How are gaps, duplicates and frame reordering impossible across internal state transitions?
How is stream loss after start terminalized as failure?
How is unknown start outcome reconciled without retry?
When is the permit finally marked consumed?
How does final R3G-F E4 bind the same execution occurrence?
```

If these cannot be resolved narrowly, the corresponding slice must remain unauthorized.

---

## 27. Candidate future implementation shape — informational only

This audit does **not** authorize file changes.

The likely B2A design area includes purpose-equivalent internal components for:

```text
pre-start output reservation records
module-sealed continuity-controller PRESTART_READY state
trusted Docker attach ownership
single bounded reader/accumulator
start prepared metadata
focused no-start hostile tests
```

A future B2B design area may include:

```text
one-shot start dispatch claim/runtime
start-to-ARM deadline enforcement
exact-subject fail-safe termination/containment
running-subject continuity
R3G-D integration
preopened-reader -> R3G-E evidence integration
R3G-F E4 conjunction
permit consumed settlement
```

A future authorization must pin exact path allowlists after reviewing the smallest viable design.

This audit deliberately does not pre-authorize modification of:

```text
gateway-gvisor-ttl-runtime.ts
gateway-gvisor-output-runtime.ts
gateway-gvisor-physical-proof-runtime.ts
sandbox-observer-docker-control-plane.ts
```

Any required modification to existing R3G trust surfaces must be explicit in the later authorization rather than inferred from this readiness record.

---

## 28. Required evidence before B2A authorization can become canonical

The next docs-only B2A authorization should include at least:

```text
exact current main + tree
exact B1 source/trust/test/schema blobs
exact R3F provider/socket blob
exact R3G-E framing/output contract blobs used for pre-start reader design
pinned Moby API 1.48 evidence
pinned Docker CLI attach-before-start sequence evidence
exact PRESTART_READY state machine
exact module-private ownership/capability seal
exact output reservation/recovery semantics
exact abort matrix
exact protected surfaces
exact future implementation path allowlist
hostile test matrix proving zero start calls
merge gates
explicit non-authorizations
```

No empirical workload start is required or authorized by that docs-only step.

Before any later B2B authorization, separate evidence must additionally establish a defensible numeric start-to-ARM bound and fail-safe owner/action.

---

## 29. Readiness verdict

```text
R4B_B1_DORMANT_CREATE:
CANONICAL / PROVEN FOR AUTHORIZED SCOPE

R4B_B2_MONOLITHIC_IMPLEMENTATION:
NOT READY / NOT AUTHORIZED

PRIMARY_BLOCKER:
TEMPORAL START / OUTPUT / TTL / FAIL-SAFE OWNERSHIP ORDERING

CURRENT_R3G_E_PREOPENED_CHANNEL_SUPPORT:
NO — CURRENT GATEWAY OPENS ATTACH AFTER RUNNING SUBJECT + DURABLE TTL ARM

PRE_START_ATTACH_PROTOCOL_FEASIBILITY:
SUPPORTED BY PINNED DOCKER API / CLI SEQUENCE EVIDENCE

REVISED_RECOMMENDED_NEXT_GATE:
KDO-H4-R4B-B2A
PRE-START OUTPUT OWNERSHIP + START PREPARATION
NO DOCKER START

B2A_MAX_POSITIVE_STATE:
PRESTART_READY

B2A_START_TO_ARM_INTERVAL:
NOT APPLICABLE — START CALLS MUST BE ZERO

FIRST_LIVE_START_GATE:
R4B-B2B OR EQUIVALENT SEPARATELY AUTHORIZED CONTINUITY CONTROLLER

B2B_AUTHORIZATION_BLOCKERS:
- EXACT NUMERIC START-TO-ARM DEADLINE
- TRUSTED DEADLINE CLOCK/OWNER
- EXACT-SUBJECT FAIL-SAFE TERMINATION/CONTAINMENT
- SINGLE-READER CONTINUOUS OUTPUT OWNERSHIP
- TERMINAL FAILURE EVIDENCE
- R3G-D/E/F CONTINUITY

B2A_IMPLEMENTATION_AUTHORIZED_BY_THIS_AUDIT:
NO

B2B_IMPLEMENTATION_AUTHORIZED_BY_THIS_AUDIT:
NO

DOCKER_START_AUTHORIZED:
NO

DOCKER_STOP_KILL_REMOVE_AUTHORIZED:
NO

TTL_AUTHORITY_CHANGE:
NO

OUTPUT_AUTHORITY_CHANGE:
NO

R3G_F_ASK_ENABLEMENT:
NO

GENERIC_RUNCOMMAND_ASK:
BLOCKED

H4_COMPLETE:
NO

H6_AUTHORIZED:
NO
```

The critical architectural correction is stronger than merely "attach before start": **one trusted fail-closed continuity owner must already own the bounded output reader before any live start, and no slice may leave a running subject between owners.**

R4B-B1 created the exact dormant subject needed to make that possible. The next safe step is a no-start B2A authorization for pre-start output ownership and start preparation. The first live start belongs to B2B only after a numeric start-to-ARM deadline, its enforcement owner, exact-subject fail-safe termination/containment, continuous single-reader output ownership, and terminal R3G-D/E/F continuity are all separately pinned.

---

## 30. Explicit non-grants

Nothing in this audit grants:

```text
R4B-B2 product implementation
R4B-B2A product implementation
R4B-B2B product implementation
Docker start/exec/stop/kill/remove/restart authority
process execution authority
new Docker endpoint authority
new native helper authority
new dependency authority
output-history reconstruction
R3G-D authority change
R3G-E authority change
R3G-F authority change
R3G-F ASK
external runCommand ASK
permit-consumption completion
H4 completion
H6 implementation/readiness
K3-R6+
donor source intake
```

Any next step requires a separate exact-base founder-reviewed authorization and its own exact-head CI/review gate.