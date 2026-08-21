# KODAC KDO H4-R4B-B2B — I1 Gated-Start Architecture Decision

Date: 2026-08-21
Status: **ARCHITECTURE DECISION CANDIDATE — DOCS ONLY — NO LIVE AUTHORITY**
Repository: `TheHalfMoon/Kodac`

## 1. Decision

This document selects the preferred architecture for resolving the remaining R4B-B2B `I1` safety gap without authorizing product implementation or live execution.

Canonical predecessor PR #139 split the pre-ARM gap into:

```text
I1 = Docker start may have occurred
     -> exact running gVisor subject not yet resolved/bound

I2 = exact running gVisor subject resolved
     -> durable R3G-D ARM not yet proven
```

The previous framing assumed an admitted workload might already be executing during I1 and therefore required a fail-safe termination mechanism for that live unarmed workload.

This decision changes the preferred architecture at an earlier boundary:

```text
DO NOT ALLOW THE ADMITTED WORKLOAD TO EXECUTE DURING I1 OR I2.
```

The selected direction is:

```text
trusted pre-workload gate is the container entrypoint
+ exact pre-opened Docker attach owns stdout/stderr and a one-way stdin permit
+ Docker start may start only the trusted gate
+ gate blocks before workload exec
+ exact gVisor subject is resolved/bound
+ R3G-D is physically armed
+ durable R3G-D ARM evidence is proven
+ only then K2 writes one exact GO permit over the already-owned stdin channel
+ gate consumes GO, closes operational stdin, and execs the exact admitted workload
```

Normative target safety property for the future gated path:

```text
WORKLOAD_PROCESS_OCCURRENCES_BEFORE_DURABLE_ARM=0
```

This is an architecture selection only.

It does **not** authorize:

```text
B1-v2 implementation
B2A-v2 implementation
B2B implementation
Docker start
workload execution
TTL ARM by B2B
GO dispatch
Docker kill/stop/remove/restart
runsc kill
SIGCONT/SIGSTOP control
new native helper
trusted-gate artifact mounting/injection
R3G-F E4
H4 completion
```

---

## 2. Exact canonical base

This decision is based on exact canonical main after PR #139:

```text
repository=TheHalfMoon/Kodac
canonical_main=606f902c63fb6fd24ee044bfc5acc84ae1592dda
canonical_tree=c22794889e041b60f256d8a4bad53f073956f0d0
PR_139=MERGED_CANONICAL
```

Predecessor state:

```text
R4B-B2A-v1=CLOSED_CANONICAL_FOR_NO_START_SCOPE
R4B-B2B=NOT_AUTHORIZED
PRE_ARM_FAIL_SAFE_CONTAINMENT=UNRESOLVED
I1_CONTAINMENT=UNRESOLVED
I2_DESIGN_DIRECTION=IDENTIFIED_NOT_AUTHORIZED
```

Relevant canonical Kodac sources inspected include:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
packages/kodac-runtime/src/trust/sandbox-admission-dormant-create.ts
packages/kodac-runtime/src/execution/gateway-gvisor-docker-prestart-output-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
packages/kodac-runtime/src/execution/gateway.ts

docs/planning/KODAC_KDO_H4_R4B_B2B_ATOMIC_LIVE_START_AUTHORIZATION_PREFLIGHT_2026-08-21.md
docs/planning/KODAC_KDO_H4_R4B_B2B_PREARM_CONTAINMENT_READINESS_AUDIT_2026-08-21.md
docs/planning/KODAC_KDO_H4_R3G_D_TERMINAL_CAUSALITY_AND_KILL_BINDING_RECONCILIATION_2026-08-18.md
docs/planning/KODAC_KDO_H4_R2C_K2_LINUX_LANDLOCK_READ_ONLY_INTEGRATION_AUTHORIZATION_2026-08-14.md
```

Pinned upstream evidence remains:

```text
MOBY_COMMIT=d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
MOBY_API_VERSION=1.48
MOBY_API_SOURCE=api/docs/v1.48.yaml

GVISOR_COMMIT=50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

No product file is changed by this decision.

---

## 3. Why current B1/B2A v1 cannot be promoted to live B2B

Canonical B1 v1 creates the dormant Docker container with the admitted workload itself as the configured entrypoint.

Purpose-equivalent current create configuration is:

```text
Image = exact admitted sourceReference
Entrypoint = [exact admitted workload executable]
Cmd = exact admitted workload args
AttachStdin = false
OpenStdin = false
AttachStdout = true
AttachStderr = true
Tty = false
runtime = runsc
network = none
restart policy = no
```

B2A v1 then pre-opens a stdout/stderr attach while the subject remains dormant, but it correctly performs zero start calls.

Therefore the first future Docker start against a B1-v1 subject would directly release the admitted workload before R3G-D can resolve the new live subject and durably ARM it.

That recreates the exact I1/I2 hazard identified by PR #139.

Accordingly, after this architecture decision becomes canonical:

```text
CURRENT_B1_V1_CREATED_ADMISSION_LIVE_PROMOTION_TO_B2B=BLOCKED
CURRENT_B2A_V1_PRESTART_READY_LIVE_CONSUMPTION_BY_B2B=BLOCKED
```

This does not invalidate the already-proven B1-v1/B2A-v1 no-start theorems.

It means only:

```text
B1-v1/B2A-v1 are valid historical/canonical no-start preparation proofs,
but they are not a sufficient predecessor for the selected future live-start theorem.
```

No existing B1-v1 container may be silently mutated into the gated shape after creation.

No recreate or replacement is authorized by this document.

---

## 4. Docker-kill-after-start is rejected as the primary I1 architecture

Pinned Moby `daemon/kill.go` shows that `ContainerKill` begins from a container lookup and, for SIGKILL, enters the daemon kill path.

The kill path can:

```text
send SIGKILL
-> wait for not-running state
-> on timeout attempt a direct process SIGKILL fallback
-> wait again for an exit event
```

That behavior is useful operational Docker behavior, but it is weaker than Kodac's canonical R3G-D proof-bearing termination theorem, which preserves:

```text
retained exact sandbox control connection
retained pidfd
exact runtime/process identity
fixed signal/mode
positive exact-instance termination acknowledgement
```

Therefore the preferred I1 architecture is **not**:

```text
start workload
-> fail to bind subject
-> Docker kill by container ID
```

and this decision does not authorize Docker kill.

Normative direction:

```text
PRIMARY_I1_SAFETY_STRATEGY=PREVENT_WORKLOAD_RELEASE
NOT=TERMINATE_UNARMED_WORKLOAD_AFTER_RELEASE
```

---

## 5. Docker Engine start does not expose the useful internal task-create/start seam

Pinned Moby `daemon/start.go` confirms that Docker's internal start implementation has a useful lower-level sequence:

```text
ReplaceContainer
-> NewTask
-> initializeCreatedTask
-> Task.Start
-> State.SetRunning
```

There is therefore an internal point where runtime/task setup exists before task start.

However, Docker Engine API v1.48 exposes container start as one API mutation rather than a Kodac-owned transaction between `NewTask` and `Task.Start`.

Using that lower-level seam directly would require a new containerd/Moby integration and a substantially different authority boundary.

This architecture decision rejects that expansion for the next step.

```text
DIRECT_CONTAINERD_OR_INTERNAL_MOBY_INTERPOSITION=NOT_SELECTED
NEW_CONTAINERD_AUTHORITY=NOT_AUTHORIZED
```

---

## 6. Canonical R2C provides the correct architectural donor

Kodac already uses a stronger pattern elsewhere.

Canonical H4-R2C establishes a controlled launcher theorem purpose-equivalent to:

```text
trusted launcher starts
-> security enforcement becomes active
-> READY is observed
-> evidence is durably committed
-> K2 sends exact GO
-> only then target exec occurs
```

The critical invariant is:

```text
DURABLE_EVIDENCE_BEFORE_GO_BEFORE_TARGET_EXEC
```

R4B-B2B should reuse that **architecture principle**, not R2C product authority or its Landlock implementation.

No R2C launcher code is implicitly authorized for gVisor B2B.

No existing R2C capability is widened.

---

## 7. Selected future B1-v2 shape — trusted gate instead of direct workload entrypoint

A future separately authorized B1-v2 must create a dormant subject in which the initial container program is a minimal trusted gate rather than the admitted workload executable.

Conceptual create shape:

```text
Image = exact admitted workload sourceReference
Entrypoint = [fixed trusted gate path]
Cmd = exact deferred workload executable + exact admitted args
AttachStdin = true
OpenStdin = true
StdinOnce = true
AttachStdout = true
AttachStderr = true
Tty = false
runtime = runsc
network = none
restart policy = no
```

The gate must not reinterpret the admitted workload.

Its only intended authority is:

```text
1. receive exact immutable deferred target metadata already bound by the admission;
2. block before target exec;
3. accept one exact bounded release permit from K2;
4. close/neutralize its operational stdin control channel;
5. exec the exact admitted target with the exact admitted args/environment/working directory semantics;
6. on any pre-release failure, exit without target exec.
```

The exact trusted gate artifact delivery, byte identity, mount/injection mechanism, path, filesystem theorem, ownership, and no-tamper proof are **not selected by this document** and remain a separate prerequisite.

---

## 8. Why the existing pre-start Docker attach is the preferred GO transport

Pinned Docker Engine API v1.48 defines `POST /containers/{id}/attach` as an endpoint that can both read container output and send container input.

The API states that the endpoint hijacks the HTTP connection to transport:

```text
stdin
stdout
stderr
```

on the same socket.

The attach request exposes explicit query parameters including:

```text
stream=true
stdin=true
stdout=true
stderr=true
```

For a non-TTY container, stdout/stderr remain in Docker's multiplexed output format while client stdin is transported over the same hijacked connection.

Docker create configuration also exposes:

```text
AttachStdin
OpenStdin
StdinOnce
```

This means the future B2A-v2 continuity controller can, in principle, preserve one exact already-open transport that owns both:

```text
A. the existing bounded stdout/stderr reader/accumulator;
B. a one-way K2 -> gate release-permit write side.
```

That is preferable to adding a second host socket, sidecar, TCP port, shared writable file, environment-variable trigger, or caller-provided IPC channel.

No such input-enabled attach is authorized to implement yet.

---

## 9. Future B2A-v2 continuity theorem

A future separately authorized B2A-v2 should preserve all B2A-v1 trust properties and additionally prove a single exact input/output transport ownership theorem.

Before live start authority exists, the controller should own:

```text
exact B1-v2 admission
exact dormant container
exact protected Docker socket namespace
exact output operation reservation
exact maxOutputBytes budget
one non-TTY hijacked attach
logs=0
stream=1
stdin=1
stdout=1
stderr=1
one bounded stdout/stderr frame reader
one bounded unopened-for-use GO write capability
no second reader
no second writer
no reattach
no start
```

The future positive state should distinguish itself from B2A-v1, for example purpose-equivalently:

```text
GATED_PRESTART_READY
```

No exact state/version name is authorized by this document.

B2A-v2 itself must still perform:

```text
DOCKER_START_CALLS=0
WORKLOAD_PROCESS_OCCURRENCES=0
TTL_ARM_ATTEMPTS=0
GO_WRITES=0
```

---

## 10. Gate permit grammar

The preferred release protocol is intentionally tiny.

A future authorization should consider one exact permit such as:

```text
GO\n
```

with requirements no weaker than:

```text
ASCII only
exactly one record
hard byte bound
no leading/trailing bytes
EOF required after the exact record
no second permit
no reset/replay
no caller-selected command in the permit
no target path/args/environment in the permit
```

The permit is not an authorization token that can be reconstructed by callers.

K2's ability to write it must remain sealed inside the same trusted continuity owner that already owns the output reader, exact admission lineage, TTL transition, and durable evidence state.

This document does not pin the final permit grammar or authorize any write.

---

## 11. Why a READY response from the gate is not required for the core safety theorem

The R2C donor uses READY because K2 must learn that Landlock enforcement has become active before committing evidence and releasing its target.

The future B2B gate has a different role.

Its safety rule is simply:

```text
NO VALID GO => NO WORKLOAD EXEC
```

K2 cannot send GO until durable R3G-D ARM is already proven.

Therefore, if the gate has not yet reached its blocking read when GO is sent, the transport may buffer the bounded permit; when the gate eventually consumes it, ARM was already durable before K2 wrote it.

This avoids a lost-resume race such as:

```text
SIGCONT arrives before SIGSTOP
-> gate later stops forever
```

A future gate may still expose additional proof if required, but a new gate-produced READY message is not selected as a prerequisite by this architecture decision.

Any future implementation must nevertheless prove the exact transport buffering/EOF semantics and must fail closed if those semantics cannot be established.

---

## 12. Gate pre-release behavior

Before a valid GO is completely accepted, the trusted gate must be inert with respect to the admitted workload.

Required future properties include:

```text
no fork of admitted workload
no exec of admitted workload
no shell
no interpreter fallback
no network
no filesystem mutation beyond unavoidable process/runtime mechanics
no stdout/stderr payload
no dynamic code loading from the untrusted workload image
no environment-triggered alternate behavior
no signal-triggered target release
no timeout-triggered target release
no EOF-triggered target release
```

The gate should be self-contained/static enough that no workload-image-provided dynamic loader, shared library, shell, interpreter, startup script, or plugin executes before GO.

If the gate sees:

```text
EOF before valid permit
malformed permit
extra bytes
transport error
controller loss
abort
invalid deferred target binding
```

then:

```text
TARGET_EXEC=NO
GATE_EXITS_FAIL_CLOSED
```

The exact exit/evidence grammar remains for a later authorization.

---

## 13. Controller crash before GO becomes safe by construction

The future input-enabled attach should use a one-owner theorem and should evaluate `StdinOnce=true` as part of the exact protocol.

The intended fail-safe behavior is:

```text
continuity owner/process dies
-> its hijacked transport/write side closes
-> no new owner may reattach or replay GO
-> gate receives EOF/transport failure
-> gate exits without workload exec
```

Even if Docker leaves stdin open longer than expected in an edge case, the safety theorem must remain:

```text
NO GO => NO WORKLOAD EXEC
```

so the worst safe outcome before release is a blocked trusted gate, not an unarmed workload.

A later authorization must pin and test the exact Docker disconnect/StdinOnce semantics before relying on them for liveness or positive evidence.

---

## 14. Future B2B live ordering under the selected architecture

A future B2B theorem should be no weaker than:

```text
exact live GATED_PRESTART_READY capability
-> final dormant/socket/controller checks
-> continuity owner becomes ACTIVE
-> durable one-shot START_DISPATCH_CLAIM
-> at most one exact Docker start dispatch
-> already-open output/input transport remains continuously owned
-> only trusted gate may begin executing
-> admitted workload occurrence count remains zero
-> resolve exact running gVisor subject
-> establish exact runtime/process identity
-> retain exact pidfd + exact sandbox control channel as required by R3G-D
-> physically ARM R3G-D
-> validate physical ARM acknowledgement
-> durably commit exact R3G-D ARM evidence
-> prove same continuity owner + same attach + same gate/admission lineage
-> atomically acquire one-shot WORKLOAD_RELEASE claim
-> write exact GO permit once
-> close release write side
-> gate consumes exact permit and execs exact admitted workload
-> bounded output reader remains unchanged
-> R3G-D terminal lifecycle remains active
-> terminalize output exactly once
-> satisfy R3G-F conjunction
-> only then final permit-consumption settlement
```

No portion of this sequence is authorized to execute by this document.

---

## 15. The I1 containment problem is structurally reframed

Under the selected gated architecture, after Docker start but before durable ARM:

```text
RUNSC_SANDBOX_MAY_BE_LIVE=YES
TRUSTED_GATE_MAY_BE_LIVE=YES
ADMITTED_WORKLOAD_EXECUTED=NO
```

Therefore the original dangerous condition:

```text
UNTRUSTED/ADMITTED WORKLOAD LIVE + TTL NOT ARMED
```

is designed out of the path.

The new pre-release fail-safe is:

```text
NO GO
```

rather than:

```text
KILL ALREADY-RUNNING UNARMED WORKLOAD
```

This does not remove the need to clean up or eventually terminate a failed gate/runtime occurrence.

It changes that cleanup from the primary immediate workload-safety barrier into a separately provable resource/terminal-settlement concern because the admitted workload has not executed.

Accordingly:

```text
I1_UNARMED_WORKLOAD_CONTAINMENT_PROBLEM=ELIMINATED_BY_SELECTED_ARCHITECTURE_DIRECTION
I1_RUNTIME_CLEANUP_AND_TERMINAL_SETTLEMENT=STILL_REQUIRES_EXACT_CONTRACT
```

This is an architecture conclusion, not an implementation proof.

---

## 16. I2 is also improved

The same gate remains blocked while R3G-D progresses from subject binding through durable ARM.

Therefore during future I2:

```text
exact subject is bound
trusted gate is still pre-workload
workload occurrence count is still zero
```

If physical ARM acknowledgement, ARM validation, or durable ARM commit fails:

```text
GO=NO
WORKLOAD_EXEC=NO
```

A future exact-instance cleanup/termination path can reuse R3G-D retained-channel principles where appropriate, but it is no longer required to stop an already-executing admitted workload before proving fail-closed workload safety.

---

## 17. Start-to-ARM numeric blocker is reframed, not yet resolved

PR #138 correctly refused to invent:

```text
MAX_START_TO_ARM_INTERVAL_MS
```

because no exact-path measurement existed and the previous architecture could have an unarmed running workload in that interval.

Under the gated architecture, the safety-critical runtime interval becomes:

```text
WORKLOAD_RELEASE -> TTL already armed
```

rather than:

```text
WORKLOAD START -> TTL later armed
```

This means a future numeric start-to-ARM bound primarily governs:

```text
trusted-gate liveness
resource occupancy
failure-detection latency
operational boundedness
```

instead of bounding time during which admitted workload code may run without TTL.

However this document does **not** declare the numeric blocker solved.

A future authorization must still define finite phase deadlines and exact failure settlement for:

```text
Docker start/reconciliation
subject resolution
retained-channel establishment
physical ARM acknowledgement
ARM evidence commit
GO release
```

No numeric value is invented here.

---

## 18. GO dispatch becomes the first admitted-workload mutation boundary

The selected architecture creates a useful distinction:

```text
Docker start = trusted runtime/gate activation
GO release = admitted workload execution release
```

Therefore future durable fencing must treat GO as a one-shot mutation with ambiguity semantics at least as strict as start/create:

```text
no durable ARM => no GO claim
new exact GO claim => at most one permit write attempt
existing GO claim => reconcile only, never blind resend
transport uncertainty after GO write may have begun => WORKLOAD_RELEASE_OUTCOME_INDETERMINATE
no second GO
no new attach
no new writer
```

If GO delivery is uncertain after durable ARM:

```text
if delivered -> workload may execute, but TTL is already physically/durably armed and output ownership is already active
if not delivered -> gate remains blocked or exits on EOF
```

That ambiguity is substantially safer than uncertainty around an unarmed workload start.

---

## 19. Output continuity remains unchanged in principle

The existing B2A rationale still applies.

One logical reader/accumulator must own stdout/stderr before Docker start and remain the same through:

```text
gate activation
subject binding
TTL ARM
GO release
workload execution
terminal drain
```

The gate must produce zero stdout/stderr payload before GO.

Any pre-GO payload is a protocol violation and must block release.

The future theorem remains:

```text
ONE_OUTPUT_OPERATION_IDENTITY
ONE_MAX_OUTPUT_BYTES_BUDGET
ONE_ORDERED_FRAME_PARSER
ONE_SHARED_STDOUT_STDERR_RAW_PAYLOAD_COUNTER
ONE_LOGICAL_READER_OWNER
NO REOPEN
NO SECOND READER
NO BYTE GAP
NO DUPLICATE ACCEPTANCE
```

The same hijacked transport may additionally carry the bounded K2->gate GO input side, but that must not reset or alter the output budget.

---

## 20. Workload stdin remains disabled

Current B1 v1 admits workloads with stdin disabled.

The future gate's Docker stdin is an **operational control transport for the trusted gate only**.

Before target exec, the gate must close or otherwise ensure the operational stdin cannot become workload input.

The admitted workload must preserve the existing semantic theorem:

```text
WORKLOAD_STDIN=DISABLED
```

Therefore future B1-v2/B2A-v2 must distinguish:

```text
GATE_CONTROL_STDIN=ENABLED_BEFORE_RELEASE
WORKLOAD_STDIN=DISABLED_AFTER_RELEASE
```

No interactive workload-input authority is granted.

---

## 21. Trusted gate artifact delivery is the next hard blocker

The architecture depends on the first in-container executable being trusted independently of the admitted workload image.

A later docs-only gate must pin exactly how that artifact is delivered and verified.

It must answer at minimum:

```text
1. Where do the gate bytes come from?
2. What exact SHA-256/implementation identity is trusted?
3. How are the exact executed bytes bound to that identity?
4. Is the gate statically linked/self-contained?
5. How is dynamic-loader/image-controlled code excluded before GO?
6. What fixed in-container path is used?
7. If a host bind mount is used, what exact host path/FD identity and read-only/noexec/nosuid semantics apply?
8. How is caller-selected mount authority prevented?
9. How is replacement between verification and container start prevented or detected?
10. How does gVisor observe/use the artifact without widening host filesystem authority?
11. How are deferred workload executable/args passed without becoming gate-controlled free-form execution authority?
12. How are environment and working-directory semantics preserved exactly?
```

Until these are pinned:

```text
TRUSTED_GATE_ARTIFACT_DELIVERY=UNRESOLVED
B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED
```

---

## 22. No hidden image trust expansion

The gate must not be a script or binary merely assumed to exist inside the admitted workload image.

An image digest proves which image was admitted; it does not make arbitrary image-provided pre-workload gate code part of the K2 trusted computing base.

Therefore this architecture rejects, absent a separate exact theorem:

```text
/bin/sh gate
image-provided shell wrapper
image-provided interpreter
image-provided dynamic loader dependency
caller-selected gate executable
PATH lookup for gate
image Entrypoint/Cmd fallback
```

The gate is a trusted K2/runtime artifact, not workload content.

---

## 23. No second control channel

The selected design intentionally avoids introducing:

```text
TCP listener
network namespace exception
host Unix socket bind into the workload
shared writable host file
shared memory command channel
sidecar
MCP/ACP channel
environment-variable release flag
polling file trigger
new generic IPC service
```

The preferred control channel is the already-required exact Docker attach transport.

If future evidence proves that this channel cannot satisfy the one-way bounded GO theorem, the architecture must return to review rather than silently add a second channel.

---

## 24. Crash and abort matrix for the selected future architecture

### Before Docker start

```text
abort/controller loss
-> no start
-> no gate
-> no workload
```

### Start may have occurred, before subject binding

```text
only trusted gate may be live
GO not authorized
controller loss => no GO
workload occurrence count remains zero
```

### Subject bound, before durable ARM

```text
trusted gate remains blocked
GO not authorized
ARM failure => no GO
workload occurrence count remains zero
```

### ARM durable, before GO

```text
TTL already active
output owner already active
GO may be prepared exactly once
abort before GO claim => no workload release
```

### GO write may have begun

```text
never blind retry
if GO delivered => workload may execute under already-active TTL/output ownership
if GO not delivered => gate remains blocked or exits
settlement may be indeterminate/non-reusable
```

### Gate exits before workload release

```text
never reinterpret as successful workload execution
terminalize B2B failure
no retry/reuse unless separately proven
```

---

## 25. Required future hostile proof matrix

A future implementation authorization should require tests at least for:

```text
B1-v2 direct-workload entrypoint impossible
B1-v2 gate path fixed and caller cannot override
untrusted image cannot replace gate
pre-start attach owns exactly one reader and one GO writer
second attach/reader/writer rejected
Docker start uncertainty never sends GO early
subject-resolution timeout => GO count zero
subject identity mismatch => GO count zero
physical ARM timeout => GO count zero
ARM validation failure => GO count zero
ARM durable-commit uncertainty => GO count zero
controller crash before GO => no workload exec
gate EOF before GO => no workload exec
malformed GO => no workload exec
extra GO bytes => no workload exec
pre-GO gate stdout/stderr payload => fail closed/no GO
GO before durable ARM structurally impossible
GO write attempted at most once
uncertain GO write => no resend
workload stdin closed/disabled after gate exec
output budget continuous across gate -> workload transition
TTL remains bound to same runtime occurrence after gate exec
restart_policy=no prevents second occurrence
```

No such live test is authorized by this document.

---

## 26. Required next docs-only gate

The next safe step after this decision becomes canonical is not B2B implementation.

It is a separate docs-only theorem for:

```text
KDO-H4-R4B-B1V2-TRUSTED-GATE-ARTIFACT-DELIVERY
```

or an equivalent narrowly named gate.

That step must pin:

```text
exact trusted gate artifact identity
exact artifact delivery mechanism
same-bytes execution theorem
read-only/no-tamper filesystem boundary
static/no-image-loader dependency theorem
fixed deferred-target grammar
exact environment/working-directory preservation
protected path/mount authority
failure and recovery semantics
future path allowlist
hostile tests
explicit non-grants
```

Only after that theorem is canonical should a later authorization consider B1-v2/B2A-v2 product changes.

---

## 27. Merge gates for this architecture-decision PR

Before merging this docs-only decision:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
NATIVE_CHANGES=0
BEHIND_BY=0
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If canonical main moves, re-evaluate the architecture against the new exact base before merge.

---

## 28. Explicit non-grants

Nothing in this decision grants:

```text
R4B-B1-v2 product implementation
R4B-B2A-v2 product implementation
R4B-B2B product implementation
migration/recreate of B1-v1 containers
Docker start
Docker exec
Docker kill
Docker stop
Docker remove
Docker restart
workload execution
live qualification
TTL ARM by B2B
GO permit dispatch
input-enabled production attach
trusted gate mount/injection
new bind mount authority
new host path authority
new containerd authority
new Moby-internal authority
SIGSTOP
SIGCONT
runsc kill
host PID kill
new native helper
R3G-D authority widening
R3G-E authority widening
R3G-F E4
permit-consumption completion
H4 completion
H6
K3-R6+
```

---

## 29. Architecture verdict

```text
CURRENT_B1_V1_NO_START_THEOREM=CANONICAL_AND_PRESERVED
CURRENT_B2A_V1_NO_START_THEOREM=CANONICAL_AND_PRESERVED

CURRENT_B1_V1_LIVE_PROMOTION_TO_B2B=BLOCKED
CURRENT_B2A_V1_PRESTART_READY_LIVE_CONSUMPTION=BLOCKED

DOCKER_KILL_AS_PRIMARY_I1_PROOF=REJECTED_DIRECTION
DIRECT_CONTAINERD_MOBY_START_INTERPOSITION=REJECTED_FOR_NEXT_SCOPE
SIGSTOP_SIGCONT_HANDSHAKE=NOT_SELECTED

SELECTED_I1_ARCHITECTURE=
TRUSTED_PRE_WORKLOAD_GATE
+ PREOPENED_DOCKER_ATTACH_STDIN_GO_PERMIT
+ DURABLE_R3G_D_ARM_BEFORE_GO

TARGET_THEOREM=
WORKLOAD_PROCESS_OCCURRENCES_BEFORE_DURABLE_ARM=0

TRUSTED_GATE_ARTIFACT_DELIVERY=NEXT_BLOCKER
START_TO_ARM_NUMERIC_BOUND=REFRAMED_BUT_NOT_RESOLVED
B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED

DOCKER_START=NO
WORKLOAD_EXECUTION=NO
TTL_ARM_BY_B2B=NO
GO_DISPATCH=NO
R3G_F_E4=NO
H4_COMPLETE=NO
```

The architectural correction is to move the security boundary from **"kill the admitted workload if ARM cannot be established quickly enough"** to **"never release the admitted workload until ARM is already durable."**

Kodac already has the right design precedent in R2C's evidence-before-GO launcher pattern, and Docker API 1.48 provides a natural already-owned bidirectional attach transport that can carry the future release permit without inventing a second control plane.

The next work is therefore to prove the trusted gate artifact itself and its delivery boundary, not to implement B2B live start.