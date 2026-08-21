# KODAC KDO H4-R4B-B2B — Pre-ARM Containment Readiness Audit

Date: 2026-08-21
Status: **READINESS AUDIT — DOCS ONLY — R4B-B2B REMAINS NOT AUTHORIZED**
Repository: `TheHalfMoon/Kodac`

## 1. Decision

This document resolves one narrow post-B2A question without granting live execution authority:

```text
CAN THE CURRENT CANONICAL R3G-D WATCHDOG, AS-IS,
SATISFY THE FULL B2B PRE-ARM FAIL-SAFE CONTAINMENT REQUIREMENT?
```

Decision:

```text
NO.
```

Canonical R3G-D already contains a strong exact-runtime-instance terminal mutation theorem after it has established the R3G-D subject/lease lifecycle:

```text
retained exact sandbox control connection
+ retained pidfd
+ exact runtime/process identity
+ fixed SIGKILL
+ DeliverToAllProcesses
+ positive termination acknowledgement
```

That theorem is valuable future architecture evidence, but it does **not** by itself cover the whole future B2B interval from possible Docker start until durable TTL ARM.

The remaining gap is split into two distinct intervals:

```text
I1 = START MAY HAVE OCCURRED
     -> exact running gVisor subject not yet resolved/bound

I2 = exact running gVisor subject resolved
     -> durable R3G-D ARM not yet proven
```

Current R3G-D retained-channel kill semantics can inform a future solution for **I2**, but current canonical authority does not establish a fail-safe containment owner for **I1**, and the current watchdog interface does not expose a separately authorized pre-ARM containment transition for either interval.

Therefore:

```text
PRE_ARM_FAIL_SAFE_CONTAINMENT=UNRESOLVED
CURRENT_R3G_D_WATCHDOG_AS_IS=INSUFFICIENT_FOR_FULL_B2B_PRE_ARM_INTERVAL
R4B_B2B_IMPLEMENTATION=NOT_AUTHORIZED
DOCKER_START=NO
```

---

## 2. Canonical base

This audit is based on exact canonical main after PR #138:

```text
repository=TheHalfMoon/Kodac
canonical_main=0b1ca429ba6904c24869baa4495169c2e63fe688
canonical_tree=154e30aa97462f4f03d135c184ade381d80132bc
PR_138=MERGED_CANONICAL
```

Canonical predecessor state:

```text
R4B-B2A=CLOSED_CANONICAL
B2A_MAX_POSITIVE_STATE=PRESTART_READY
R4B-B2B=NOT_AUTHORIZED
```

Relevant canonical identities inspected:

```text
docs/planning/KODAC_KDO_H4_R4B_B2B_ATOMIC_LIVE_START_AUTHORIZATION_PREFLIGHT_2026-08-21.md
blob=c56d03b7e68f53995a42ed5dfe3d5182e4deff36

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
blob=26b0f8094afb8e61ec29e05496c7aa91bf2f6e7f

packages/kodac-runtime/native/gvisor-ttl-watchdog.c
blob=ba363afdc852328f09b8ee94413ddd35b7dee24f

docs/planning/KODAC_KDO_H4_R3G_D_TERMINAL_CAUSALITY_AND_KILL_BINDING_RECONCILIATION_2026-08-18.md
blob=6f01d01fee4c871bd39d1ddb3139976d70e29f90

packages/kodac-runtime/src/execution/gateway-gvisor-docker-prestart-output-runtime.ts
blob=12d7785eb857799d11c6ca07c5fb797efa3b5895
```

No product file is changed by this audit.

---

## 3. What canonical R3G-D already proves

Canonical R3G-D does not rely on a mutable container ID alone for proof-bearing expiry mutation.

Its terminal-causality reconciliation requires one narrow trusted lifecycle helper/watchdog that retains exact-instance state across the mutation boundary.

The canonical theorem includes:

```text
expected full container identity
expected sandbox PID
process start ticks
runsc executable device/inode/size
runsc artifact identity
runtimeInstanceIdentity
retained sandbox control connection
retained pidfd
fixed SIGKILL
fixed DeliverToAllProcesses mode
positive signal/termination acknowledgement
```

Canonical R3G-D explicitly rejects proof-bearing mutation through:

```text
standalone runsc kill <id>
Docker kill/stop fallback
host numeric PID kill
re-opened control-socket pathname
second container.Load by textual ID
caller-selected signal
caller-selected PID/container
```

This is the correct exact-instance mutation standard to preserve wherever future B2B can reuse it.

---

## 4. Current R3G-D arm ordering

Canonical `GvisorTtlExecutionGateway.enforceGvisorTtl(...)` currently performs a purpose-equivalent sequence:

```text
startup recovery
-> observe/hash retained watchdog executable
-> resolve exact running gVisor subject
-> validate subject binding
-> create + durably commit PREPARED intent
-> read Linux boot ID
-> reverify retained watchdog artifact
-> construct physical expectation
-> spawn watchdog helper
-> wait for physical ARM acknowledgement
-> validate physical ARM
-> adapt logical ARM
-> durably commit ARM evidence
-> wait for terminal acknowledgement
-> durably commit terminal evidence
```

The configured canonical R3G-D limits include:

```text
CLOCK_DOMAIN=CLOCK_BOOTTIME
armAckTimeoutMs=5000
```

The important boundary is that subject resolution precedes watchdog spawn/physical ARM acknowledgement.

Therefore current R3G-D does not begin with an already-active exact-instance kill owner at the instant B2B would issue Docker start.

---

## 5. The two pre-ARM intervals must not be conflated

### 5.1 Interval I1 — start to exact subject binding

Future B2B may have this state:

```text
Docker start dispatch may have begun or succeeded
+
pre-opened B2A output reader still owned
+
exact live gVisor runtime subject not yet positively resolved
```

At this point the current R3G-D exact-instance helper theorem is not yet established because the runtime/process tuple required to bind the retained pidfd/control channel is not yet available.

This is the hardest containment gap.

A deadline that expires in I1 cannot safely claim:

```text
"invoke current R3G-D expiry kill"
```

because no canonical R3G-D lease-bound retained exact-instance signal channel exists yet.

### 5.2 Interval I2 — exact subject bound to durable ARM

After exact subject resolution, a future B2B controller has substantially stronger identity material:

```text
containerId
runtimeInstanceIdentity
sandbox PID
process start ticks
runsc artifact identity
control endpoint identity
```

The existing R3G-D helper architecture demonstrates how to retain a pidfd and an exact sandbox control channel and later issue fixed all-process SIGKILL without re-resolving by name/path.

This makes R3G-D the preferred semantic donor for a future I2 containment theorem.

But current product authority still does not say:

```text
if ARM preparation/ack/durable ARM commit fails before positive ARM,
then the helper may transition into a B2B pre-ARM containment mode.
```

That transition requires separate authorization and proof.

---

## 6. Why `armAckTimeoutMs=5000` does not solve containment

`armAckTimeoutMs=5000` is an enforcement bound on existing R3G-D phases.

It is not itself a fail-safe action.

A future B2B theorem needs both:

```text
DEADLINE
AND
ACTION_WHEN_DEADLINE_WINS
```

A timeout that merely returns an error while the workload remains live is not fail-safe containment.

Likewise, the current gateway catching a subject-resolution/ARM failure and returning `ExecutionFailedError` does not prove the exact started workload has stopped.

Therefore:

```text
BOUNDED_FAILURE_RETURN != CONTAINMENT
```

---

## 7. Existing R3G-D retained-channel semantics are a donor, not current B2B authority

The canonical R3G-D reconciliation already defines a strong retained-channel rule:

```text
establish exact control connection before final exact-instance validation completes
retain it across mutation
retain pidfd across arm -> terminal
never reconnect by pathname for proof-bearing kill
fixed ContMgrSignal(SIGKILL, DeliverToAllProcesses)
positive acknowledgement required
```

A future B2B/I2 design should preserve these properties rather than weakening them to:

```text
inspect by ID
-> runsc kill by ID
```

or:

```text
observe PID
-> host kill(PID)
```

No such weakened mutation path is authorized by this audit.

---

## 8. Current helper cannot simply be called earlier

The current watchdog protocol is an R3G-D ARM lifecycle protocol.

Its request binds R3G-D material including, purpose-equivalently:

```text
armOperationIdentity
canonicalArmPayloadDigest
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
ttlMs
watchdogImplementationIdentity
control endpoint/process tuple
runsc artifact identity
```

The helper is not a generic termination service.

Calling it "earlier" without a valid exact subject/ARM request would either:

```text
break its current theorem
or
invent a new protocol/authority surface
```

Both are forbidden without separate authorization.

---

## 9. Containment requirement for I1 remains open

The future B2B authorization must choose and prove one fail-safe response for the interval where start may have happened but exact runtime subject binding has not yet completed.

Acceptable architecture classes for later review may include, but are not authorized here:

```text
A. a narrowly constrained exact-created-container control-plane containment primitive;
B. an already-active lower-level containment owner established before start;
C. another exact occurrence-bound primitive that remains valid before R3G-D subject binding.
```

Any candidate must prove all of:

```text
exact admitted occurrence only
no caller-selected target
no generic Docker/runsc mutation surface
no blind retry after uncertain start/termination mutation
restart_policy=no remains enforced
no second workload occurrence
bounded positive/indeterminate settlement
post-action observation/evidence
no authority escape to unrelated containers/processes
```

This audit deliberately does not choose among these classes.

---

## 10. Docker kill/stop is not silently inherited

B1/B2A have a trusted protected Docker control endpoint and an exact created container ID.

That does **not** automatically authorize B2B to call:

```text
POST /containers/{id}/kill
POST /containers/{id}/stop
POST /containers/{id}/remove
```

The current B2B preflight explicitly denies those operations.

If an exact-created-container Docker containment primitive is selected for I1, a later authorization must pin at minimum:

```text
exact API version + endpoint
fixed target derivation from canonical B1/B2A lineage
fixed signal/action
mutation ambiguity rules
no blind retry
container replacement/restart defenses
post-action observation
terminal failure evidence semantics
relationship to later exact R3G-D runtime identity
```

No Docker mutation is granted by this audit.

---

## 11. Ordinary `runsc kill` remains insufficient for positive proof

Canonical R3G-D already establishes that a standalone sequence such as:

```text
runsc state <id>
-> compare identity
-> runsc kill --all <id> SIGKILL
```

re-resolves mutable state by ID and does not preserve the same exact-instance mutation boundary.

B2B must not regress that theorem merely because the pre-ARM interval is difficult.

Therefore:

```text
RUNSC_KILL_CLI_FALLBACK=NOT_AUTHORIZED
```

---

## 12. Host PID kill remains insufficient

The retained pidfd in canonical R3G-D is an exact identity/liveness handle.

Canonical R3G-D explicitly does not treat it as permission to signal the host sandbox process directly.

Future B2B must not substitute:

```text
kill(expectedPid, SIGKILL)
```

for the exact gVisor all-process termination theorem.

Therefore:

```text
HOST_PID_KILL=NOT_AUTHORIZED
```

---

## 13. Candidate future I2 design direction

For I2 only, the strongest current direction is a bounded factorization of existing R3G-D retained exact-instance semantics so that the same trusted B2B continuity owner can prove:

```text
exact subject resolved
-> exact pidfd retained
-> exact sandbox control connection retained
-> exact runtimeInstanceIdentity bracket closed
-> PRE_ARM_CONTAINMENT_READY
-> physical ARM attempt
```

If ARM acknowledgement or durable ARM settlement fails while the exact helper/controller is still alive, a separately authorized fixed transition could be:

```text
PRE_ARM_CONTAINMENT_READY
-> fixed exact-instance SIGKILL / DeliverToAllProcesses
-> positive termination acknowledgement
-> durable B2B terminal failure evidence
```

This is architecture direction only.

It is **not** authorized to implement, and it still does not solve I1.

---

## 14. No ownerless running interval

The governing B2B safety property remains:

```text
STARTED + NO ACTIVE FAIL-CLOSED OWNER = FORBIDDEN
```

The pre-opened B2A reader is one necessary owner component, but output ownership alone is not containment ownership.

Before any future Docker start, the B2B continuity controller must already own a complete policy for every post-start state, including:

```text
start outcome uncertainty
I1 subject-resolution failure/deadline
I2 ARM failure/deadline
reader failure
output overflow
terminal proof failure
```

A code path that says "return error" without proving containment is insufficient after live start.

---

## 15. Timing blocker remains independent

This audit does not resolve:

```text
MAX_START_TO_ARM_INTERVAL_MS
```

Even if containment were fully designed, the exact numeric start-to-durable-ARM bound still needs separately authorized exact-path evidence.

Conversely, measuring a numeric bound without a fail-safe containment action would also be insufficient.

The two blockers are conjunctive:

```text
B2B_AUTHORIZATION_REQUIRES =
NUMERIC_START_TO_ARM_BOUND
AND
FULL_PRE_ARM_FAIL_SAFE_CONTAINMENT
```

---

## 16. Required next containment questions

A later founder-reviewed containment authorization/readiness step must answer:

```text
1. What exact mechanism owns I1 before R3G-D exact subject binding exists?
2. What exact immutable identity selects that target?
3. Is the I1 mechanism safety-only, proof-bearing, or both?
4. What happens when the I1 containment mutation outcome is uncertain?
5. How is blind retry prevented?
6. How is replacement/restart prevented from becoming a second occurrence?
7. When does authority atomically transfer from I1 containment to retained exact-instance I2 containment?
8. Can existing R3G-D helper code be factored without widening its public authority surface?
9. What durable terminal failure record proves B2B failed closed?
10. How does final permit settlement become non-reusable after any may-have-started outcome?
```

If any answer remains descriptive rather than exact, B2B stays unauthorized.

---

## 17. Required future hostile proof matrix

A future implementation authorization should require tests for at least:

```text
abort before start => zero start calls
start dispatch uncertainty => no second start
start succeeded + subject resolution timeout => fail-safe I1 containment
subject resolved + identity mismatch => fail-safe containment
subject resolved + helper channel establishment failure => fail-safe containment
physical ARM acknowledgement timeout => exact I2 containment
ARM validation failure => exact I2 containment
durable ARM commit uncertainty => fail-safe containment + non-reusable attempt
reader failure during I1/I2 => fail-safe containment
output overflow during I1/I2 => fail-safe containment
containment mutation uncertainty => no retry + indeterminate/non-reusable
replacement/restart attempt => cannot redirect containment target
second reader => fail closed
```

No such workload/start test is executed or authorized by this document.

---

## 18. Scope and non-grants

This PR/document changes documentation only.

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
NATIVE_HELPER_CHANGES=0
```

Nothing here grants:

```text
R4B_B2B_IMPLEMENTATION
DOCKER_START
DOCKER_EXEC
DOCKER_STOP
DOCKER_KILL
DOCKER_REMOVE
DOCKER_RESTART
WORKLOAD_EXECUTION
LIVE_QUALIFICATION_EXECUTION
TTL_ARM_BY_B2B
PRE_ARM_KILL
RUNSC_KILL_CLI
HOST_PID_KILL
NEW_NATIVE_HELPER
R3G_D_AUTHORITY_CHANGE
R3G_E_AUTHORITY_CHANGE
R3G_F_E4
GENERIC_RUNCOMMAND_ASK
H4_COMPLETE
H6_AUTHORIZED
K3_R6_PLUS
```

---

## 19. Merge gate

Before this docs-only audit can become canonical:

```text
CHANGED_PATHS=EXACTLY_1_DOC
BEHIND_BY=0
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If canonical main moves, reconcile the exact base and conclusions before merge.

---

## 20. Readiness verdict

```text
R4B_B2A=CLOSED_CANONICAL
R4B_B2B=NOT_AUTHORIZED

CURRENT_R3G_D_EXACT_INSTANCE_KILL_THEOREM=CANONICAL
CURRENT_R3G_D_RETAINED_CHANNEL_SEMANTICS=STRONG_DONOR_FOR_I2
CURRENT_R3G_D_WATCHDOG_AS_IS=INSUFFICIENT_FOR_FULL_PRE_ARM_CONTAINMENT

I1_START_TO_SUBJECT_BINDING_CONTAINMENT=UNRESOLVED
I2_SUBJECT_BINDING_TO_DURABLE_ARM_CONTAINMENT=DESIGN_DIRECTION_IDENTIFIED_NOT_AUTHORIZED

MAX_START_TO_ARM_INTERVAL_MS=UNRESOLVED
PRE_ARM_FAIL_SAFE_CONTAINMENT=UNRESOLVED

DOCKER_START=NO
WORKLOAD_EXECUTION=NO
H4_COMPLETE=NO
```

The key correction is that the repository already has a strong exact-instance kill theorem, but it begins too late to be silently treated as the complete B2B fail-safe. Future B2B must explicitly close the **I1 subject-resolution gap** and separately authorize any I2 pre-ARM factorization before the first live start can be granted.