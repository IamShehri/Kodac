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

The correct next direction is to sub-slice R4B-B2 and place the output channel **before the first start mutation**.

Recommended next separate founder-reviewed candidate:

```text
R4B-B2A
PRE-START OUTPUT CHANNEL + ONE-SHOT DOCKER START ADMISSION
```

Only after B2A is separately authorized, implemented, and proven should Kodac consider:

```text
R4B-B2B
RUNNING-SUBJECT TTL ARM + PREOPENED OUTPUT CONTINUITY + TERMINAL EVIDENCE
+ FINAL R3G-F E4 CONTINUITY
```

This audit authorizes neither slice.

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

The remaining start boundary is qualitatively different. `POST /containers/start` is the point at which admitted repository workload code can begin executing. Once that mutation occurs, any ordering mistake involving output, TTL, identity or proof becomes a real execution-trust failure rather than a dormant-state bookkeeping defect.

This audit therefore treats **start dispatch** as a new high-risk authority boundary requiring its own durable preparation and proof theorem.

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

It becomes insufficient if R4B-B2 itself introduces the first start mutation and then calls the current R3G-E path afterward.

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

The earlier dismissal becomes a design constraint for R4B-B2: the trusted admission boundary must move to a point where the bounded output channel is already established before start dispatch.

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
stream lifecycle across dormant -> running transition
running gVisor subject discovery
R3G-D watchdog preparation and ARM
R3G-E adaptation to a pre-opened output channel
terminal output/lifecycle conjunction
R3G-F final E4 continuity
abort during every intermediate transition
unknown start outcome reconciliation
cleanup policy after failed/indeterminate execution
final permit consumption settlement
```

That crosses multiple existing trusted modules whose current contracts were deliberately separated.

It would also make review difficult because the first workload-execution mutation and the downstream proof machinery would change in the same authorization boundary.

The readiness verdict is therefore:

```text
MONOLITHIC_R4B_B2_AUTHORIZATION=REJECT
R4B_B2_SUB_SLICING=REQUIRED
```

---

## 9. Recommended R4B-B2A candidate boundary

The smallest next active candidate should be:

```text
KDO-H4-R4B-B2A
PRE-START OUTPUT CHANNEL + ONE-SHOT DOCKER START ADMISSION
```

A future separate B2A authorization should prove only a purpose-equivalent theorem:

```text
one exact durable R4B-B1 CREATED admission
+ exact durable one-shot permit reservation lineage
-> exact dormant subject revalidation
-> durable pre-start output budget/channel reservation
-> exact Docker attach established while container is still dormant
-> durable start preparation
-> durable one-shot start dispatch claim
-> at most one bounded Docker start mutation
-> exact post-start running-subject reconciliation
-> same executionAttempt/requirement/workload/container continuity
```

B2A must not itself claim:

```text
TTL terminal enforcement complete
bounded output terminal evidence complete
R3G-F E4 complete
execution successful
permit fully consumed by a proven execution
H4 complete
H6 ready
```

---

## 10. Required B2A pre-start ordering candidate

A future authorization should require a positive path no weaker than:

```text
1. validate exact SandboxDormantCreatedAdmission
2. validate exact durable CREATED commit
3. validate exact R4B-A permit + commit + B1 reservation lineage
4. rederive the exact B1 executionAttemptIdentity
5. revalidate the exact R3B requirement/workload theorem
6. reobserve the exact Docker container and prove pristine dormant state
7. revalidate exact Docker Unix-socket endpoint identity
8. derive one exact outputChannelIdentity for the admitted attempt
9. derive one exact outputOperationIdentity and maxOutputBytes
10. durably reserve the output operation before start authority exists
11. establish exact non-TTY Docker attach with:
    logs=0, stream=1, stdin=0, stdout=1, stderr=1
12. validate the hijacked/multiplexed stream identity and bind it to the exact subject
13. persist a pre-start output-channel-ready record/acknowledgment
14. reobserve the container and prove it is still pristine dormant
15. derive one deterministic startOperationIdentity
16. durably persist START_PREPARED
17. durably acquire one START_DISPATCH_CLAIM
18. only a newly created dispatch claim may issue one bounded Docker start POST
19. reconcile authoritative start response or unknown outcome by exact Docker observation
20. establish exact post-start running subject continuity
21. return only a bounded B2A running-admission handoff
```

No step after start may retroactively repair a missing pre-start output reservation or channel.

---

## 11. Candidate Docker start authority surface

A future B2A implementation should authorize no more than:

```text
POST /v1.48/containers/{exactContainerId}/start
```

on the exact trusted local Unix-socket endpoint already bound by the canonical R3F/B1 trust anchor.

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
Docker kill
Docker stop
Docker remove
Docker pause/unpause
arbitrary attach query parameters
```

The start request must be derivable only from the canonical B1 created admission.

---

## 12. One-shot start dispatch theorem

Start is a mutation with the same fundamental ambiguity class as create, but its consequences are stronger because repository workload code may begin running.

A future B2A authorization must require durable fencing purpose-equivalent to:

```text
START_PREPARED
-> START_DISPATCH_CLAIM
-> START_DISPATCHED_OR_RECONCILED
```

Rules:

```text
claim absent
-> no start may have been authorized by B2A

new durable claim
-> exactly one start dispatch may be attempted

existing claim
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
AT MOST ONE B2A START ATTEMPT
```

---

## 13. Pre-start output channel is part of admission, not post-hoc evidence

For B2A, output-channel establishment is not merely a downstream observer optimization.

It is a precondition for releasing start authority.

Required properties include:

```text
exact B1 container ID
exact executionAttemptIdentity
exact requirementIdentity
exact workloadIdentity
exact provider identity
exact socketEndpointIdentity
exact outputChannelIdentity
exact outputOperationIdentity
exact maxOutputBytes
non-TTY multiplex framing
stdin disabled
stdout enabled
stderr enabled
logs=0
stream=1
```

The channel must be created by trusted K2 composition and must not be caller-injected.

A structural object that merely claims to be an attached stream is not evidence.

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
B2A_DEFAULT_DIRECTION=ATTACH_BEFORE_START
LOG_HISTORY_RECONSTRUCTION=NOT_AUTHORIZED
```

Any future logs/history theorem requires separate authorization and evidence.

---

## 15. Running-subject continuity required after start

After start dispatch settles positively or is reconciled as started, B2A must not accept an arbitrary running container.

The running handoff must preserve at least:

```text
same executionAttemptIdentity
same requirementIdentity
same workloadIdentity
same full Docker container ID
same canonical B1 labels
same Docker socket/provider identity
runtime = runsc
network = none
exact resource configuration
restart count = 0
restart policy = no
no replacement/recreate
```

A future exact gVisor runtime-instance identity may be established only through trusted R3G-D/R3F-compatible observation.

If the subject is already terminal before trusted running continuity can be proven, B2A must fail closed rather than fabricate a successful running handoff.

---

## 16. Why TTL cannot simply be armed before Docker start

Canonical R3G-D physical TTL enforcement binds to a live exact gVisor subject/control endpoint and establishes runtime/process identity before its physical watchdog ARM is accepted.

A dormant B1 container has:

```text
running=false
pid=0
```

It does not yet expose the live runtime/process subject required by the canonical R3G-D theorem.

Therefore B2 cannot merely call current R3G-D ARM while the container remains dormant.

The correct temporal shape is instead:

```text
pre-open output before start
-> start once
-> establish exact live running subject
-> arm TTL as the first running-subject enforcement stage
```

This creates an unavoidable but bounded start-to-ARM interval that B2B must explicitly characterize and prove acceptable or redesign.

This audit does not declare that interval safe by implication.

---

## 17. R4B-B2B remains a separate future theorem

After B2A is proven, B2B should reconcile the pre-opened output channel with the canonical R3G-D/R3G-E/R3G-F proof chain.

A candidate direction is:

```text
exact B2A running handoff
+ exact preopened bounded output channel
-> canonical running-subject resolution
-> R3G-D durable PREPARED/ARM/terminal lifecycle
-> continuous consumption of the already-open output channel
-> R3G-E-compatible aggregate output evidence
-> exact R3G-F A/B/C/D/E conjunction
-> final E4
-> durable one-shot permit CONSUMED-by-exact-attempt settlement
```

Current `GvisorOutputExecutionGateway` cannot simply be treated as this B2B adapter without review because it currently owns creation of its output transport/channel **after** R3G-D ARM.

A future B2B authorization must decide whether to:

```text
A. refactor R3G-E to accept only a trusted module-sealed preopened channel;
B. introduce a new admission-continuity orchestrator that consumes internal R3G-E primitives;
C. define another bounded contract that preserves current R3G-E evidence semantics while moving channel ownership earlier.
```

No choice is made by this readiness audit.

---

## 18. Current package-root authority must remain narrow

Canonical package root currently exposes the bounded B1 gateway/result and selected validated records while keeping raw Docker mutation composition internal.

A future B2A/B2B must preserve that pattern.

Package root must not expose:

```text
raw Docker start transport
raw caller-selectable attach transport
Docker socket configuration constructor
start dispatch claim creator
mutable durable-store implementation
caller evidence injector
R3G-D raw subject resolver
R3G-F predecessor evidence resolver
```

Public APIs may expose validated result/evidence types and one bounded gateway only where separately authorized.

---

## 19. Abort semantics that future B2A must settle

At minimum:

```text
abort before output reservation
-> no start authority

abort after output reservation but before attach
-> no start authority; reservation is non-replenishable for the attempt

abort while pre-start attach establishment is pending
-> no start dispatch; close owned channel if safely authoritative

abort after channel ready but before START_PREPARED
-> no start mutation

abort after START_PREPARED but before dispatch claim
-> no start mutation

abort after durable start dispatch claim but before socket dispatch
-> attempt may be burned; no blind retry

abort after start dispatch may have begun
-> authoritative settlement/reconciliation required
-> never detach into untracked background uncertainty

abort after positive start but before TTL ARM
-> B2B must define fail-closed terminalization/cleanup authority separately
```

This audit does not authorize stop/kill/remove as an abort repair primitive.

---

## 20. Cleanup is still an unresolved authority boundary

B1 intentionally did not gain Docker stop/kill/remove authority.

B2A start creates a new class of failure where a container may be running but the full R3G-D/E/F proof chain cannot complete.

The system eventually needs a bounded fail-safe termination/cleanup theorem, but adding unrestricted cleanup into the first start authorization would widen mutation authority substantially.

The next authorization must therefore make an explicit decision among bounded options such as:

```text
1. B2A grants start only and burns/flags failed attempts; cleanup remains external/manual.
2. A separately authorized narrow emergency termination gate precedes B2A.
3. B2B receives an exact subject-bound termination authority tied only to failed admitted attempts.
```

No option is authorized here.

A positive B2A authorization must not pretend this question does not exist.

---

## 21. Crash and recovery matrix for future B2A

A future authorization must classify at least:

```text
CREATED admission exists, output reservation absent
-> safe to remain dormant; no start

output reservation durable, attach absent
-> no start; recovery may re-establish only if the reservation contract explicitly permits exact same-channel recovery

attach established, channel-ready durable ack absent
-> no start; recovery must not assume the channel survived process crash

channel-ready durable ack exists but transport process crashed
-> durable metadata alone cannot prove a live hijacked stream
-> must revalidate/re-establish under an explicit recovery theorem before start

START_PREPARED exists, dispatch claim absent
-> no start mutation yet under B2A authority

START_DISPATCH_CLAIM exists
-> may-have-started
-> inspect/reconcile only

Docker says running after uncertain start
-> bind exact subject; never send second start automatically

Docker says dormant after a definitely rejected pre-dispatch call
-> remain failed/non-reusable unless future authorization proves safe retry semantics

ambiguous/replaced/multiple/wrong subject
-> fail closed
```

A live socket/stream cannot be reconstructed from a durable identity alone after process failure. This distinction must remain explicit.

---

## 22. Threat model additions for the start boundary

Future B2A/B2B review must explicitly defend against:

- start sent before output channel is proven ready;
- output reservation created after workload bytes already escaped;
- attach bound to wrong container or wrong Docker socket;
- stale B1 CREATED admission reused after container replacement;
- a second start after timeout or reconnect;
- caller-selected container ID/start path/socket;
- channel-ready record forged without a live trusted hijacked stream;
- attach stream replaced between readiness and start;
- Docker daemon/socket replacement between attach and start;
- subject starts with runtime other than `runsc` despite dormant configuration;
- restart policy or daemon behavior producing an unapproved second process occurrence;
- early workload exit before exact running/TTL subject proof;
- cancellation after dispatch resulting in untracked running code;
- post-start proof failure being mislabeled successful execution;
- `logs=1` history being substituted for exact admission-bound output;
- output duplication or gaps when transitioning from pre-opened capture into R3G-E evidence;
- TTL ARM associated with another process generation/runtime instance;
- permit marked consumed before final E4 or left reusable after uncertain mutation;
- cleanup authority escaping the exact failed admitted subject;
- generic `runCommand` or R3G-F ASK being widened as a shortcut.

---

## 23. Recommended B2A authorization questions

Before B2A receives product authority, its separate docs-only authorization should answer exactly:

```text
What exact pre-start attach implementation owns the live stream?
How is live-channel readiness proven without caller injection?
What durable record is metadata only versus proof of current stream liveness?
Can exact same-attempt attach be re-established after a pre-start crash?
What is the exact output-reservation create-once key?
What is the exact startOperationIdentity?
What durable claim fences POST /containers/{id}/start?
What Docker responses are authoritative pre-side-effect rejection?
How is uncertain start reconciled without retry?
What observation proves exact running continuity?
What is the maximum tolerated start-to-R3G-D-ARM interval, if any?
Who terminates an admitted subject if TTL ARM cannot be established?
How does B2B consume the pre-opened channel without output gaps/duplication?
When is the one-shot permit finally marked consumed?
```

If these cannot be resolved narrowly, B2A must remain unauthorized.

---

## 24. Candidate future implementation shape — informational only

This audit does **not** authorize file changes, but the likely design area includes purpose-equivalent new/changed components for:

```text
trusted start-admission records
trusted pre-start output channel ownership
one-shot start dispatch runtime
closed start/running-handoff schema
focused B2A hostile tests
package-root bounded result export
```

A future authorization must pin the exact path allowlist after reviewing the smallest viable design.

This audit deliberately does not pre-authorize modification of:

```text
gateway-gvisor-ttl-runtime.ts
gateway-gvisor-output-runtime.ts
gateway-gvisor-physical-proof-runtime.ts
sandbox-observer-docker-control-plane.ts
```

Any required modification to existing R3G trust surfaces must be explicit in the later authorization rather than inferred from this readiness record.

---

## 25. Required evidence before B2A authorization can become canonical

The next docs-only authorization should include at least:

```text
exact current main + tree
exact B1 source/trust/test/schema blobs
exact R3F provider/socket blob
exact R3G-D TTL runtime/trust blobs
exact R3G-E output runtime/trust blobs
exact R3G-F physical proof blob
pinned Moby API 1.48 evidence
pinned Docker CLI attach-before-start sequence evidence
exact proposed state machine
exact start mutation surface
exact output-before-start ordering
exact crash/recovery matrix
exact abort matrix
exact protected surfaces
exact future implementation path allowlist
hostile test matrix
merge gates
explicit non-authorizations
```

No empirical workload execution is required or authorized by that docs-only step.

---

## 26. Readiness verdict

```text
R4B_B1_DORMANT_CREATE:
CANONICAL / PROVEN FOR AUTHORIZED SCOPE

R4B_B2_MONOLITHIC_IMPLEMENTATION:
NOT READY / NOT AUTHORIZED

PRIMARY_BLOCKER:
TEMPORAL START / OUTPUT / TTL AUTHORITY ORDERING

CURRENT_R3G_E_PREOPENED_CHANNEL_SUPPORT:
NO — CURRENT GATEWAY OPENS ATTACH AFTER RUNNING SUBJECT + DURABLE TTL ARM

PRE_START_ATTACH_PROTOCOL_FEASIBILITY:
SUPPORTED BY PINNED DOCKER API / CLI SEQUENCE EVIDENCE

RECOMMENDED_NEXT_GATE:
KDO-H4-R4B-B2A
PRE-START OUTPUT CHANNEL + ONE-SHOT DOCKER START ADMISSION AUTHORIZATION

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

The critical architectural correction is that **output capture must become part of the start admission boundary**, not a downstream attachment performed after the newly authorized workload has already begun.

R4B-B1 created the exact dormant subject needed to make that ordering possible. The next safe step is therefore a narrow B2A authorization for pre-start output-channel readiness plus one-shot Docker start dispatch, followed only later by a B2B continuity theorem that binds the already-open channel into canonical TTL/output/physical-proof evidence.

---

## 27. Explicit non-grants

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