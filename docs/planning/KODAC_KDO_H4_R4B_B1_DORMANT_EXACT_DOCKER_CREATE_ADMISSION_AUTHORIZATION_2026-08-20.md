# KDO-H4-R4B-B1 — Dormant Exact Docker Create Admission Authorization

Date: 2026-08-20
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY / NO PRODUCT IMPLEMENTATION**
Repository: `TheHalfMoon/Kodac`
Canonical base: `6420eed4e56f6fcb04a6bbd3cd45df72a59d4004`
Canonical base tree: `d97dc920594ad9ba6611617d02021190acbb3b5e`
Predecessors: canonical H4-R1 one-shot approval, H4-R3A/R3B exact sandbox workload/requirement, H4-R3F Docker read-only control-plane binding, H4-R3G-D TTL lifecycle enforcement, H4-R3G-E output enforcement, H4-R3G-F physical proof conjunction, H4-R4A exact sandbox approval binding, and H4-R4B-A durable exact sandbox admission permit.

---

## 1. Decision

```text
GATE:
KDO-H4-R4B-B1

NAME:
DORMANT EXACT DOCKER CREATE ADMISSION

CHANGE CLASS:
DOCS ONLY / AUTHORIZATION / NO EXECUTION IN THIS PR

CANONICAL R4B-A:
PROVEN / MERGED AS PR #128

R4B-B STRATEGY:
SUB-SLICED

R4B-B1:
DURABLY RESERVE ONE R4B-A PERMIT FOR ONE EXECUTION ATTEMPT
-> DURABLY PREPARE ONE EXACT CREATE OPERATION
-> CREATE AT MOST ONE DORMANT LINUX + DOCKER + gVISOR CONTAINER
-> PROVE THE CREATED CONTAINER IS EXACT AND NOT STARTED
-> DURABLY RECORD CREATED ADMISSION STATE

R4B-B1 PRODUCT IMPLEMENTATION:
AUTHORIZED ONLY AFTER THIS DOCUMENT IS CANONICAL

R4B-B2:
PRE-START OUTPUT / START / TTL-ARM / RUNNING-SUBJECT CONTINUITY

R4B-B2 PRODUCT IMPLEMENTATION:
NOT AUTHORIZED BY THIS DOCUMENT

DOCKER CREATE AUTHORITY:
BOUNDED POST /v1.48/containers/create ONLY

DOCKER START AUTHORITY:
NO

DOCKER EXEC AUTHORITY:
NO

DOCKER KILL/STOP/REMOVE AUTHORITY:
NO

PROCESS EXECUTION AUTHORITY:
NO

DIRECT R3G-F ASK ENABLEMENT:
FORBIDDEN

GENERIC EXTERNAL runCommand ASK:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

R4B-B1 intentionally introduces the **first sandbox-specific Docker mutation authority** only after R4B-A has made approval durable and non-reusable.

It does **not** authorize workload execution.

---

## 2. Canonical base and live findings

Canonical main at authorization drafting:

```text
6420eed4e56f6fcb04a6bbd3cd45df72a59d4004
```

Canonical tree:

```text
d97dc920594ad9ba6611617d02021190acbb3b5e
```

Canonical R4B-A merge:

```text
PR #128
feat(kdo): implement H4-R4B-A admission permit

reviewed exact head:
90bd33f4489fe0f37f1f905c971ae00cef0f5ac8

merge commit:
6420eed4e56f6fcb04a6bbd3cd45df72a59d4004

ordered parents:
1. b1e35248dd80c813f14a8e4e76e37cafa4406afa
2. 90bd33f4489fe0f37f1f905c971ae00cef0f5ac8

merge verification:
verified=true
reason=valid
```

R4B-A established:

```text
one exact allowed-once approval occurrence
-> durable asked evidence
-> durable decided evidence
-> one exact durable SandboxAdmissionPermit
-> admissionAttemptLimit = 1
-> deterministic future SandboxAdmissionConsumptionReservation identity
```

The canonical package root exposes permit validation and reservation types/constants, but deliberately does not expose the raw permit creator, reservation creator, durable store, or runtime factory as caller authority.

---

## 3. Why R4B-B must be split again

The canonical R4B authorization already required R4B-B to separately resolve:

```text
create-vs-start ordering
TTL arming
output reservation / attachment
deny-all networking
resource controls
abort
cleanup
crash recovery
final R3G-F E4 continuity
```

Live source inspection confirms that a single implementation PR would cross too many authority boundaries:

1. canonical H4 has **no existing Docker create/start admission primitive**;
2. R3F is intentionally read-only and currently provides exact Docker list/inspect binding for an already existing subject;
3. R3G-D TTL enforcement binds to an already existing gVisor runtime subject/control endpoint;
4. R3G-E output enforcement binds to an already existing Docker subject/output path;
5. R3G-F is proof-only and still rejects `ASK`.

Therefore the safe first mutation is **create-only**.

A Docker-created but never-started container gives Kodac an exact inspectable admission subject without permitting workload code to execute before TTL/output/start ordering is separately solved.

---

## 4. R4B-B1 theorem

A positive R4B-B1 result may claim only:

```text
One canonical R4B-A admission permit was durably reserved for exactly one fresh
executionAttemptIdentity. Kodac durably prepared one exact Docker create
operation and caused Docker Engine API v1.48 to create at most one container
whose image, entrypoint, arguments, runtime, resource limits, network mode,
restart policy, privilege state, and canonical R3F binding labels correspond to
the exact admitted R3B requirement. The exact created container was then
revalidated as dormant/not-started and its created-admission state was durably
recorded. No workload process was started.
```

R4B-B1 may not claim:

```text
container started
workload executed
stdout/stderr captured
TTL armed
TTL enforced
physical deny-all network observed
physical CPU/memory enforcement observed
source rootfs physical lineage proven
R3G-F E4 produced
permit fully consumed by successful execution
H4 complete
H6 ready
```

---

## 5. Central one-shot invariant

The inherited invariant remains:

```text
ONE ALLOWED-ONCE DECISION
=>
AT MOST ONE EXACT SANDBOX ADMISSION ATTEMPT
```

R4B-B1 strengthens this to:

```text
ONE R4B-A PERMIT
=>
AT MOST ONE DURABLY RESERVED executionAttemptIdentity
=>
AT MOST ONE Docker create operation identity
=>
AT MOST ONE exact dormant container candidate
```

No successful or uncertain create attempt may return the permit to an `unused` state in R4B-B1 v1.

---

## 6. Required state machine

R4B-B1 shall define a trusted durable state machine purpose-equivalent to:

```text
UNUSED
  -> RESERVED(exact permitIdentity, exact executionAttemptIdentity)
  -> CREATE_PREPARED(exact createOperationIdentity)
  -> CREATED(exact containerId, exact Docker observation)
```

Forbidden transitions include:

```text
RESERVED(A) -> RESERVED(B)
CREATE_PREPARED(A) -> CREATE_PREPARED(B)
CREATED(A) -> CREATED(B)
CREATED -> UNUSED
UNKNOWN_CREATE_OUTCOME -> UNUSED
UNKNOWN_CREATE_OUTCOME -> automatic retry
```

R4B-B1 does not define a general release/unreserve operation.

A permit may be burned by a failed or indeterminate admission attempt. Safety takes precedence over automatic reuse.

---

## 7. Required positive ordering

A successful R4B-B1 admission MUST preserve this semantic order:

```text
1. validate exact canonical SandboxAdmissionPermit
2. validate exact SandboxAdmissionPermitCommit
3. revalidate the embedded R4A binding and R3B requirement theorem
4. derive one fresh canonical executionAttemptIdentity
5. derive exact SandboxAdmissionConsumptionReservation
6. durably reserve the permit for that exact attempt
7. derive one deterministic Docker create operation identity
8. durably commit CREATE_PREPARED before Docker mutation
9. acquire the exact trusted Docker Unix-socket endpoint
10. revalidate the endpoint identity immediately before mutation
11. issue exactly one bounded Docker Engine API v1.48 create request
12. validate the Docker create response or classify the result indeterminate
13. revalidate the exact created subject through trusted Docker observation
14. prove the container is dormant / not started
15. durably commit the exact CREATED admission record
16. return only the durable created-admission result
```

No Docker mutation may occur before durable reservation and durable create preparation.

No workload start may occur anywhere in R4B-B1.

---

## 8. Exact Docker mutation surface

R4B-B1 authorizes only a dedicated sandbox-specific Docker Engine mutation surface equivalent to:

```text
POST /v1.48/containers/create
```

over one configured canonical absolute Unix socket whose endpoint identity is independently revalidated.

The implementation MUST NOT provide:

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

The Docker API version remains pinned to the canonical R3F API family:

```text
1.48
```

---

## 9. Deterministic container occurrence identity

The create operation MUST have one deterministic name/occurrence identity derived from canonical trusted inputs, purpose-equivalent to:

```text
permitIdentity
executionAttemptIdentity
reservationIdentity
requirementIdentity
workloadIdentity
```

The deterministic occurrence identity exists to support exact reconciliation and to prevent a blind second create after a lost response.

It MUST NOT be caller supplied.

The Docker daemon's returned container ID MUST be exactly one full canonical 64-lowercase-hex ID before it can become admission evidence.

---

## 10. Exact create payload

The Docker create payload must be derived from the exact canonical R3B requirement and must fail closed rather than approximate unsupported semantics.

At minimum, the payload/verified post-create state MUST bind:

```text
source repository + source digest
entrypoint executable
ordered arguments
runtime = runsc
network mode = none
CPU limit
memory limit
memory-swap policy required by the canonical R3B theorem
restart policy = no
privileged = false
TTY = false
credential binding = null
canonical R3F requirement/workload binding labels
```

The create configuration must not add ambient host authority not present in the exact R3A/R3B theorem.

Forbidden examples include:

```text
host network
bridge fallback
privileged
host PID namespace
host IPC namespace
host devices
arbitrary bind mounts
Docker socket bind mount
added Linux capabilities
caller-selected seccomp/AppArmor profile
restart-on-failure / always restart
runtime downgrade from runsc
plaintext credentials
```

If Docker cannot represent an exact admitted theorem term, R4B-B1 must fail closed before create.

---

## 11. Dormant-state requirement

R4B-B1 exists specifically to separate create from start.

Before a positive CREATED record is committed, trusted observation MUST establish a state purpose-equivalent to:

```text
container exists
container running = false
container pid = 0
container restart count = 0
container restart policy = no
runtime = runsc
network mode = none
no unexpected network attachment
exact image/entrypoint/args/resources
```

A container observed as running, paused, restarting, removing, dead after execution, or otherwise inconsistent with a pristine never-started admission candidate MUST fail closed.

R4B-B1 MUST NOT attempt to repair such a state by stop/kill/remove/recreate.

---

## 12. Reconciliation of unknown Docker create outcome

Docker create is a mutation and a lost client response cannot be treated as proof that no side effect occurred.

Required semantics:

```text
known create success
-> exact dormant revalidation
-> durable CREATED record

known authoritative create rejection before side effect
-> fail closed; reservation remains non-reusable in R4B-B1 v1

transport timeout / disconnect / cancellation after mutation start / malformed response
-> CREATE_OUTCOME_INDETERMINATE
-> reconcile only by deterministic exact Docker observation
-> never issue a second create automatically
```

If reconciliation proves exactly one matching dormant container from the exact prepared operation, R4B-B1 may continue to durable CREATED state.

If reconciliation finds:

```text
zero candidates after an indeterminate mutation
multiple candidates
wrong identity
wrong labels
wrong configuration
running candidate
ambiguous Docker state
```

R4B-B1 must remain failed/indeterminate and must not retry create or release the permit.

---

## 13. Durable evidence required

R4B-B1 shall define immutable records purpose-equivalent to:

```text
SandboxAdmissionConsumptionReservationCommit
SandboxDormantCreatePrepared
SandboxDormantCreatePreparedCommit
SandboxDormantCreatedAdmission
SandboxDormantCreatedAdmissionCommit
```

Every durable acknowledgment must bind the exact record identity and `durability = durable`.

Positive caller-visible created admission requires the final CREATED commit acknowledgment.

In-memory callbacks are not durable proof.

---

## 14. Cancellation and abort

Required behavior:

```text
pre-aborted before reservation
-> no Docker mutation

abort after reservation but before CREATE_PREPARED
-> no Docker mutation; reservation remains non-reusable

abort after CREATE_PREPARED but before Docker mutation start
-> no Docker mutation; prepared attempt remains recoverable/non-reusable

abort after Docker mutation starts
-> do not detach mutation into background uncertainty
-> wait for authoritative settlement where possible
-> otherwise classify create outcome indeterminate
-> reconcile without retry

abort after container creation but before final CREATED durable commit
-> no start
-> no caller-visible positive admission
-> recovery must classify exact existing dormant state
```

A late create success after caller abort must never be reported as a fresh reusable permit.

---

## 15. Trusted ownership boundary

Trusted runtime composition owns:

```text
consumption reservation durable store
create-prepared durable store
created-admission durable store
exact Docker Unix-socket configuration
Docker create mutation implementation
Docker create reconciliation implementation
```

A public caller may supply only already-authorized canonical values such as the exact R4B-A permit/result and cancellation signal through the bounded gateway.

A caller MUST NOT inject:

```text
executionAttemptIdentity
reservation acknowledgment
create operation identity
container name
container ID
Docker socket path
Docker request body
Docker response
created-admission acknowledgment
synthetic R3F observation
```

---

## 16. Relationship to canonical R3F

R3F remains read-only and must not be widened into a generic mutation transport.

R4B-B1 may compose canonical R3F validation/observation semantics where exact reuse is possible, but the existing R3F source file and its protected read-only guarantees remain unchanged unless a later explicit authorization says otherwise.

A new dedicated mutation runtime must not export arbitrary Docker authority through the package root.

---

## 17. Protected authority surfaces

R4B-B1 MUST preserve existing canonical behavior of at least:

```text
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/execution/sandbox-admission-approval-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
packages/kodac-runtime/src/trust/sandbox-admission-permit.ts
```

The implementation test suite should pin these protected surfaces where practical.

Generic `ExecutionGateway.runCommand()` ASK remains blocked.

R3G-F ASK remains blocked.

---

## 18. Authorized implementation surface

After this authorization is canonical, the first R4B-B1 product PR may change only purpose-equivalent paths within this narrow set:

```text
A packages/kodac-runtime/src/trust/sandbox-admission-dormant-create.ts
A packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
M packages/kodac-runtime/src/index.ts
A schema/kdo-h4-r4b-b1-dormant-created-admission.schema.json
A packages/kodac-runtime/test/kdo-h4-r4b-b1-dormant-docker-create-admission.test.ts
```

No modification to R3F/R3G-D/R3G-E/R3G-F production files is authorized in R4B-B1.

No dependency, workflow, native binary, Docker CLI, or package manifest change is authorized.

If implementation discovers that the exact theorem cannot be satisfied within these paths, implementation must stop and return to authorization rather than widen scope.

---

## 19. Required implementation tests

The R4B-B1 product PR must prove at minimum:

```text
1. exact R4B-A permit + commit validation
2. deterministic reservation and create-operation identities
3. one permit cannot reserve two attempt identities
4. durable reservation precedes any Docker mutation
5. durable CREATE_PREPARED precedes any Docker mutation
6. exact Docker API version/path/method/socket authority
7. exact OCI digest/entrypoint/args/runtime/network/resources mapping
8. privileged/host-network/runtime-downgrade/credential substitutions fail closed
9. create response requires one exact full container ID
10. positive result requires exact dormant post-create observation
11. running/restarting/ambiguous candidate fails closed
12. timeout/disconnect after mutation start never triggers a second create
13. exact reconciliation may recover one matching dormant candidate only
14. zero/multiple/wrong reconciliation candidates remain indeterminate
15. cancellation before mutation performs no Docker mutation
16. cancellation after mutation start cannot create reusable approval authority
17. durable CREATED commit failure withholds positive admission
18. hostile Proxy/accessor/symbol/hidden/undefined structures fail closed
19. schema is closed
20. production source contains no Docker start/exec/kill/remove endpoint
21. generic runCommand ASK remains blocked
22. R3G-F ASK remains blocked
23. R3F/R3G-D/R3G-E/R3G-F protected production surfaces remain unchanged
24. package root exposes only the minimum safe R4B-B1 validation/gateway surface, not raw mutation/store constructors
```

Linux integration tests may use a bounded fake Unix-socket Docker server to prove exact request bytes and mutation count without requiring real host Docker mutation in CI.

No test may claim real gVisor execution or E4 proof from R4B-B1.

---

## 20. R4B-B2 is deliberately not authorized

The next stage after canonical R4B-B1 evidence is expected to address the much harder execution boundary:

```text
exact dormant created container
-> pre-start output continuity
-> start exactly once
-> establish TTL enforcement without an unbounded post-start gap
-> preserve deny-all network/resource/source/runtime lineage
-> bind the same executionAttemptIdentity through R3E/R3G-D/R3G-E
-> final R3G-F E4
-> terminal consumption state
```

The current R3G-D runtime binds an already-existing runtime subject. Therefore R4B-B2 must explicitly solve **start-vs-TTL temporal ordering** before implementation authority is granted.

R4B-B1 must not pre-decide that design.

---

## 21. Merge / review gate for this authorization PR

This authorization is docs-only.

Before merge:

```text
changed paths = exactly this one planning document
canonical base = 6420eed4e56f6fcb04a6bbd3cd45df72a59d4004
governance = PASS
runtime CI = PASS where triggered
fresh independent exact-head review = PASS
unresolved actionable review threads = 0
```

No implementation may begin merely because this branch exists.

---

## 22. Final authorization state if merged

```text
R4B_A=CANONICAL_PROVEN
R4B_B1=DORMANT_CREATE_IMPLEMENTATION_AUTHORIZED
R4B_B2=NOT_AUTHORIZED
DOCKER_CREATE_AUTHORITY=BOUNDED_R4B_B1_ONLY
DOCKER_START_AUTHORITY=NO
DOCKER_EXEC_AUTHORITY=NO
DOCKER_KILL_REMOVE_AUTHORITY=NO
GENERIC_RUNCOMMAND_ASK=BLOCKED
R3G_F_ASK=BLOCKED
H4_COMPLETE=NO
H6_AUTHORIZED=NO
```
