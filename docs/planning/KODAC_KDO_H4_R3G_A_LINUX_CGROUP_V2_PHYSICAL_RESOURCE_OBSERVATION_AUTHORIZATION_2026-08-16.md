# KDO-H4-R3G-A — Linux cgroup v2 Physical Resource Observation Authorization

Date: 2026-08-16
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `5140b4e101a79c8aa56247b7d705921a99fed787`
Canonical base tree: `0abf74c5defd09a750ab2515bd79e0ed09a98c1f`
Predecessor: canonical H4-R3G physical-policy conjunction split

---

## 1. Decision

```text
GATE:
KDO-H4-R3G-A

NAME:
LINUX CGROUP V2 PHYSICAL RESOURCE OBSERVATION

AUTHORIZATION CLASS:
BOUNDED K2 READ-ONLY PHYSICAL OBSERVER

R3G SPLIT:
CANONICAL

TARGET PHYSICAL FACTS:
CPU CAPACITY CEILING
MEMORY HARD CEILING
SWAP / NO-SWAP CEILING

OUTPUT CLASS:
E3 PHYSICAL RESOURCE CANDIDATE

R3B SandboxBackendObservation MINTING:
NOT AUTHORIZED

R3B SandboxExecutionEvidence MINTING:
NOT AUTHORIZED

SOURCE / ROOTFS PROOF:
NOT AUTHORIZED

NETWORK PROOF:
NOT AUTHORIZED

TTL ENFORCEMENT:
NOT AUTHORIZED

OUTPUT-LIMIT ENFORCEMENT:
NOT AUTHORIZED

DOCKER MUTATION:
NOT AUTHORIZED

CGROUP MUTATION:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

If this document becomes canonical, it authorizes one narrow implementation whose only new host authority is bounded read-only observation of the exact live gVisor subject's Linux cgroup-v2 physical CPU/memory/swap state under K2 ownership.

No implementation write is authorized until this exact docs-only authorization is canonically merged.

---

## 2. Canonical predecessor truth

Canonical R3G split merge:

```text
5140b4e101a79c8aa56247b7d705921a99fed787
```

Canonical tree:

```text
0abf74c5defd09a750ab2515bd79e0ed09a98c1f
```

Canonical R3G split document:

```text
docs/planning/KODAC_KDO_H4_R3G_LINUX_DOCKER_GVISOR_PHYSICAL_POLICY_CONJUNCTION_SPLIT_2026-08-16.md
blob 21e94791fb3f4255def4cc19c9dd8dcbf274d500
```

R3G made the following bounded decision canonical:

```text
R3G MONOLITH = REJECTED
R3G-A = FIRST PHYSICAL READ-ONLY RESOURCE CANDIDATE
R3B FINAL MINTING = DEFERRED UNTIL ALL PHYSICAL FACT FAMILIES ARE PROVEN
```

R3G-A MUST preserve that decomposition.

---

## 3. Why R3G-A may not mint R3B final observation/evidence

Canonical R3B defines a complete `SandboxResourcePolicy` containing:

```text
cpuMillis
memoryBytes
ttlMs
maxOutputBytes
```

and canonical final execution evidence requires the complete physical fact set, including:

```text
immutable source digest
semantic runtime class
deny-all network
CPU budget
memory limit
TTL
output limit
credential binding
no downgrade
```

R3G-A proves only:

```text
CPU
memory
swap/no-swap
```

Therefore any implementation that constructs either of these is outside authorization:

```text
SandboxBackendObservation
SandboxExecutionEvidence
```

R3G-A must expose incompleteness honestly through its own intermediate E3 resource record.

---

## 4. Canonical R3E subject theorem is reused, not rewritten

Canonical R3E already proves a K2-owned exact gVisor runtime-instance lineage using:

```text
K2-created executionAttemptIdentity
exact validated R3B requirement/workload
trusted full Docker container binding
verified retained runsc artifact
verified retained observer-helper artifact
runsc state #1
host process observation #1
runsc stats
runsc state #2
host process observation #2
exact state/process stability
verified runtime artifact recheck
durable R3E lineage commit
```

R3G-A MUST reuse this exact live subject theorem inside the trusted K2 call.

It MUST NOT replace R3E with:

```text
caller PID
caller cgroup path
Docker PID field alone
container name
process name
uncommitted lineage object
validated-but-caller-constructed lineage object
```

---

## 5. R3E public contract remains byte/semantic compatible

Canonical durable `GvisorRuntimeLineageRecord` intentionally stores identity-bearing lineage and does not expose raw `pid` or `startTicks` as public downstream authority.

R3G-A MUST NOT add raw PID/start-time fields to the canonical R3E public contract merely to make downstream observation convenient.

Instead, implementation may refactor the existing `ExecutionGateway.observeGvisorRuntimeInstance(...)` internals into a private/shared trusted core that retains the live raw R3E state/process values only inside the K2-owned call.

The existing public R3E method must preserve:

```text
input contract
policy behavior
ASK blocking
Linux gating
artifact verification
state/stats/process command shapes
same-FD execution
durable lineage commit requirement
return type
receipt semantics
failure semantics
```

No R3E external API widening is authorized.

---

## 6. Dedicated K2 capability

R3G-A must use one dedicated capability:

```text
runtime.observe.gvisor.cgroup-v2
```

The capability is Trust-Kernel-owned and purpose-specific.

The caller supplies only the canonical validated gVisor `SandboxExecutionRequirement` already required by the R3E path.

The caller MUST NOT supply:

```text
PID
startTicks
container ID
cgroup path
cgroup mountpoint
/proc path
/sys/fs/cgroup path
file list
helper executable
shell command
arbitrary executable
arbitrary args
observer protocol identity
resource observation identity
```

The generic `ExecutionGateway.runCommand(...)` and caller-selected capability/executable interface MUST NOT be used to implement R3G-A physical proof.

---

## 7. Policy behavior

R3G-A policy handling must remain monotonic and fail closed.

```text
policy = allow
-> observer may proceed

policy = deny
-> block before new physical reads

policy = ask
-> block
```

R3G-A does not authorize an approval flow for physical observation and MUST NOT turn ASK into a way to expose arbitrary host reads.

Expected blocked reason should be purpose-equivalent to:

```text
R3G-A physical observer approval is not authorized
```

---

## 8. Linux-only platform floor

R3G-A is initially Linux-only.

Non-Linux hosts must fail closed structurally and MUST NOT pretend to provide physical cgroup evidence.

Initial cgroup support is exactly:

```text
cgroup v2 unified hierarchy
```

The following are out of scope for v1:

```text
cgroup v1
hybrid cgroup v1/v2
non-Linux resource-control systems
Windows Job Objects
macOS process limits
```

No fallback is authorized.

---

## 9. Initial canonical host-layout floor

R3G-A v1 intentionally supports one conservative observer-visible cgroup layout only:

```text
cgroup2 filesystem mountpoint:
/sys/fs/cgroup

mount root:
/

single observer-visible unified cgroup-v2 hierarchy
```

The observer must validate the relevant cgroup2 mount entry before treating `/sys/fs/cgroup/<target-path>` as physical authority.

Nested/submounted cgroup2 layouts, ambiguous multiple cgroup2 mounts, or a non-root mount root are unsupported in R3G-A v1 and must fail closed.

This restriction is intentional. A later authorization may add correct mount-root translation if operational evidence requires it.

---

## 10. Exact permitted new host read surface

R3G-A may authorize read-only access only to the minimum subject/hierarchy files needed for its theorem.

Purpose-equivalent fixed read families are:

```text
/proc/self/mountinfo
/proc/<R3E-state-pid>/stat
/proc/<R3E-state-pid>/status
/proc/<R3E-state-pid>/cgroup

/sys/fs/cgroup/<target-and-ancestor>/cgroup.type
/sys/fs/cgroup/<target-and-ancestor>/cgroup.procs
/sys/fs/cgroup/<target-and-ancestor>/cgroup.controllers
/sys/fs/cgroup/<target-and-ancestor>/cpu.max
/sys/fs/cgroup/<target-and-ancestor>/cpu.max.burst
/sys/fs/cgroup/<target-and-ancestor>/cpuset.cpus.effective
/sys/fs/cgroup/<target-and-ancestor>/memory.max
/sys/fs/cgroup/<target-and-ancestor>/memory.swap.max
```

The implementation must not expose a generic host file-reader API.

No glob, recursive directory walk, symlink-following arbitrary path, caller-selected path, or caller-selected control file is authorized.

---

## 11. Explicitly forbidden host reads

R3G-A does not authorize:

```text
/proc/<pid>/mem
/proc/<pid>/root
/proc/<pid>/fd/*
/proc/<pid>/maps
/proc/<pid>/mountinfo
/proc/<pid>/ns/* as authority
network namespace inspection
mount namespace inspection
BPF/netlink
Docker extra endpoints
containerd socket
containerd content/snapshot stores
registry access
runsc runtime-root file reads beyond canonical R3E command path
arbitrary /sys files
arbitrary cgroup control files
```

If implementation discovers that any such surface is necessary, it must stop and reconcile authorization before access is added.

---

## 12. Source pins — Linux cgroup v2

R3G-A pins Linux v6.12 as the semantic documentation baseline for the user-visible cgroup-v2 and proc interfaces used by this observer.

```text
repository:
torvalds/linux

tag:
v6.12

tag object:
06090c9b622a7e1f797e775db4c035e0d779b76e

commit:
adc218676eef25575469234709c2d87185ca223a

tree:
ac4266ccaf1cf79e8fb22ad3e0d86deac358ffb9
```

Pinned documentation:

```text
Documentation/admin-guide/cgroup-v2.rst
blob 6d02168d78bed67bfe2c7aa17f5a26f61346138f

Documentation/filesystems/proc.rst
blob e834779d961153393d2963fc8657f875bd31a54f
```

The cgroup-v2 documentation is the kernel project's authoritative description of the userland-visible v2 interface.

R3G-A copies no Linux implementation code.

---

## 13. Source pins — gVisor cgroup behavior

Canonical R3D already pins:

```text
repository:
google/gvisor

commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293

tree:
12ce7f8c4f8b0481cccb4c28632fff49cb3f50e4
```

R3G-A studies these files at the same pin:

```text
runsc/cgroup/cgroup_v2.go
blob 62e538d00a5c5a74045174a87365910fd91f4a16

runsc/cgroup/cgroup.go
blob cee1fe81c36ca0a5b81307c855966321d7bb91b7

runsc/sandbox/sandbox.go
blob 70724a90adae59759b489b13e50942588c61ea70

runsc/container/container.go
blob 5ea716990eacbd5511bcc75f4661817900577211

runsc/specutils/namespace.go
blob a727884b24551ba74e6ba20aa712a05eaa9038f1
```

These pins demonstrate relevant mechanics including:

- cgroup-v2 CPU and memory control-file semantics used by runsc;
- parent/systemd limit handling in gVisor's own cgroup code;
- `/proc/<pid>/cgroup` + mountinfo path resolution mechanics;
- sandbox process placement through cgroup FD support;
- gVisor support for OCI cgroup namespaces.

These are source-study pins only. No gVisor code is copied into Kodac.

---

## 14. `/proc/<pid>/stat` physical-subject grammar

R3G-A may parse the observer-visible state PID's `/proc/<pid>/stat` using a strict bounded parser.

The parser must preserve and validate at minimum:

```text
pid
start_time
rt_priority
policy
```

Kernel v6.12 proc documentation identifies:

```text
start_time = time the process started after system boot
rt_priority = realtime priority
policy = scheduling policy
```

The parser must handle the process `comm` parenthesized field without naïvely splitting the entire line on spaces.

The implementation must reject malformed/ambiguous structure rather than guessing field offsets after a malformed command name.

R3E's existing host process `startTicks` observation remains the canonical pre-existing anti-PID-reuse value and must match the R3G-A parse.

---

## 15. `/proc/<pid>/status` CPU-affinity grammar

R3G-A may parse exactly the bounded `Cpus_allowed_list` field from `/proc/<pid>/status`.

This is used only to ensure that process CPU affinity does not impose a stricter physical capacity ceiling than the requested `cpuMillis` theorem.

Unknown duplicate fields, malformed CPU-list grammar, negative ranges, overlaps that cannot be normalized unambiguously, unbounded input, or missing `Cpus_allowed_list` fail closed.

No other status field is authority unless separately authorized.

---

## 16. `/proc/<pid>/cgroup` grammar

R3G-A v1 requires exactly one unified cgroup-v2 membership line purpose-equivalent to:

```text
0::/<canonical-relative-path>
```

The path must:

- be absolute in proc cgroup syntax;
- contain no NUL;
- contain no lexical traversal;
- normalize without semantic change;
- remain within the validated observer-visible cgroup2 mount;
- satisfy a strict byte/depth bound.

Ambiguous extra unified entries, cgroup-v1 controller entries, or unsupported hybrid form fail closed.

The public caller never supplies this path.

---

## 17. Observer-visible cgroup namespace rule

R3G-A does not require the target sandbox process to share the same cgroup namespace inode as the K2 observer.

Pinned gVisor supports OCI cgroup namespaces, so such an equality requirement could reject valid Docker/gVisor configurations.

Instead, R3G-A proves the resource theorem in the observer's trusted host view:

```text
observer-visible /proc/<exact-pid>/cgroup
+
validated observer-visible cgroup2 root mount
+
exact PID membership in target cgroup.procs
```

This combination defines the host resource-control subject for R3G-A v1.

No claim is made about guest-visible cgroup paths.

---

## 18. Target cgroup must be a domain cgroup

R3G-A v1 accepts only:

```text
cgroup.type == domain
```

at the target subject cgroup.

Threaded/domain-threaded modes introduce different membership/control semantics and are out of scope for the first theorem.

If `cgroup.type` is absent, malformed, or not exactly supported, fail closed.

---

## 19. Exact PID membership

The exact R3E state PID must appear as a full decimal PID token in the target cgroup's `cgroup.procs` during both pre- and post-observation snapshots.

The implementation must not use substring matching.

Because cgroup membership can change, one successful membership read is insufficient.

The resource candidate is unavailable if:

```text
PID absent
PID malformed
membership file malformed/oversized
subject moves between snapshots
subject exits
R3E process start ticks change
R3E process executable identity changes
```

---

## 20. Hierarchy walk

R3G-A must observe the target cgroup and every ancestor up to the validated `/sys/fs/cgroup` root.

The hierarchy walk must be:

```text
bounded
canonical
non-recursive outside the parent chain
free of caller-selected components
```

A fixed maximum hierarchy depth must be defined in implementation and tests.

Exceeding the depth bound fails closed without truncating the hierarchy and pretending proof is complete.

---

## 21. Controller availability

The observer must prove that CPU, memory and cpuset semantics required by the theorem are available in the relevant hierarchy.

At minimum the implementation must fail closed when required control files are absent or when the hierarchy cannot provide the files needed to establish:

```text
cpu.max
cpu.max.burst
cpuset.cpus.effective
memory.max
memory.swap.max
```

`cgroup.controllers` may be recorded/parsed to strengthen diagnostics and hierarchy identity, but mere presence of a controller name is not a substitute for reading the effective control files.

---

## 22. CPU theorem — canonical requested value

Canonical R3C defines:

```text
cpuMillis = milliCPU capacity units
1000 cpuMillis = capacity ceiling of 1 logical CPU
```

R3G-A physical CPU proof must therefore establish an effective fair-scheduler CPU-bandwidth ratio exactly equal to:

```text
cpuMillis / 1000
```

No floating-point arithmetic is permitted for the security comparison.

The implementation must use exact integer/rational comparison, purpose-equivalent to cross multiplication over bounded integers/BigInts.

---

## 23. CPU theorem — hierarchy-effective `cpu.max`

Each hierarchy `cpu.max` is parsed as:

```text
max <period>
```

or:

```text
<quota> <period>
```

with positive bounded decimal integer period and positive finite quota when present.

The effective physical CPU bandwidth ceiling is the minimum finite quota/period ratio across the complete observed hierarchy.

If the hierarchy contains no finite CPU limit, the exact R3A requested ceiling is not physically proven and R3G-A fails closed.

If the effective finite ratio is stricter or wider than the required ratio, R3G-A fails closed under canonical R3B v1 exact-equality semantics.

R3G-A does not introduce a “stricter is equivalent” contract rule.

---

## 24. CPU burst must be disabled

For the strict v1 capacity theorem, every applicable observed `cpu.max.burst` must parse as exactly:

```text
0
```

A positive burst allowance, malformed value, unsupported file behavior, or ambiguity makes the strict R3G-A CPU theorem unavailable.

No burst normalization is authorized.

---

## 25. Fair-scheduler restriction

Kernel `cpu.max` bandwidth control does not by itself prove a capacity theorem for every Linux scheduling class.

R3G-A v1 therefore accepts the exact subject only when `/proc/<pid>/stat` proves a supported normal fair-scheduler posture purpose-equivalent to:

```text
policy == SCHED_OTHER / 0
rt_priority == 0
```

Any realtime/deadline/unsupported scheduling policy fails closed.

A later authorization may broaden scheduler support if independently proven.

---

## 26. cpuset and process affinity must not make the CPU theorem stricter

The CPU-bandwidth ratio is not the only possible CPU-capacity limiter.

R3G-A must parse:

```text
cpuset.cpus.effective
/proc/<pid>/status Cpus_allowed_list
```

and compute the count of CPUs physically available to the subject under both constraints.

The available CPU count must be sufficient for the requested milliCPU ceiling:

```text
availableCpuCount * 1000 >= required cpuMillis
```

If cpuset or process affinity makes the effective capacity stricter than the canonical requested capacity, exact R3B v1 equality is not proven and R3G-A fails closed.

R3G-A does not claim CPU reservation, minimum share, or performance availability.

---

## 27. Memory theorem — hierarchy-effective hard limit

Each observed `memory.max` is parsed as either:

```text
max
```

or a positive bounded byte count.

The effective physical memory hard ceiling is the minimum finite `memory.max` value across the complete hierarchy.

The effective limit must be exactly:

```text
requirement.workload.resourcePolicy.memoryBytes
```

If there is no finite limit, or the effective limit is stricter/wider than the required exact v1 value, fail closed.

`memory.high` is not the v1 hard-memory theorem and is not needed for the authorized claim.

---

## 28. Swap theorem

R3G-A v1 requires a physical no-swap-device posture.

The effective hierarchy `memory.swap.max` theorem must resolve to exactly:

```text
0
```

for the subject's effective swap allowance.

A positive value, `max`, malformed value, unavailable file, or unresolved ancestor ambiguity fails closed.

R3G-A makes no separate zswap theorem because canonical R3A/R3B contains no independent zswap field.

No claim stronger than the kernel `memory.swap.max` hard swap-device limit is authorized.

---

## 29. Pre/post resource snapshot bracket

R3G-A must use at least two complete physical resource snapshots around the trusted live subject observation.

A purpose-equivalent order is:

```text
R3E state/process subject #1
->
R3G-A cgroup resource snapshot #1
->
canonical R3E live stats observation
->
R3E state/process subject #2
->
R3G-A cgroup resource snapshot #2
```

Acceptance requires exact identity equality for all identity-bearing facts whose drift would invalidate the theorem, including:

```text
R3E state identity
R3E process identity
R3E process start ticks
observer-visible cgroup membership path
cgroup hierarchy identity
PID membership
CPU hierarchy controls
CPU burst controls
cpuset effective controls
process affinity
scheduler policy
memory hierarchy controls
swap hierarchy controls
```

Any drift produces no successful R3G-A record.

---

## 30. Reuse of R3E trusted core

The current R3E implementation performs state/process bracketing inside `ExecutionGateway.observeGvisorRuntimeInstance(...)`.

R3G-A implementation may refactor this code into a private trusted internal primitive that returns both:

```text
canonical durable R3E lineage result
+
private live subject material needed only inside K2
```

Purpose-equivalent private material may include:

```text
state PID
process startTicks
state/process parsed values
verified runsc/helper retained handles while the observation is active
R3E durable commit identity
```

This private material MUST NOT become caller-supplied authority or a widened public R3E record.

The refactor must preserve existing R3E tests and theorem exactly.

---

## 31. R3E durable commit ordering

A successful R3G-A result must be grounded in a durably committed R3E exact-instance lineage.

The trusted core must validate the R3E durable commit acknowledgment before the R3G-A resource candidate can be durably committed as successful evidence.

If R3E commit fails or acknowledges a different record:

```text
R3G-A = UNAVAILABLE / FAIL CLOSED
```

A local uncommitted R3E structure is not sufficient provenance.

---

## 32. Separate R3G-A durable resource commit

R3G-A must define a separate trusted commit callback in a new R3G-A runtime configuration/contract.

Purpose-equivalent interface:

```text
commitResourceEvidence(record)
```

The acknowledgment must be deterministically bound to the exact `resourceCandidateIdentity` or record identity.

Malformed, mismatched, failed, timed-out or aborted commit acknowledgment prevents successful return.

A successful K2 receipt may be persisted only after the R3G-A durable commit is validated.

---

## 33. R3G-A runtime config cannot expose path authority

The new trusted R3G-A runtime config may contain only narrowly bounded trusted integration concerns such as:

```text
version
commitResourceEvidence callback
```

It MUST NOT contain caller-configurable:

```text
procRoot
cgroupRoot
mountpoint
control filenames
arbitrary read callback
arbitrary filesystem interface
helper executable path
shell
command template
```

The v1 host surface is fixed by the canonical implementation contract.

If configurable roots are later needed for production portability, that is a new authority decision and requires reconciliation.

---

## 34. No native helper in R3G-A v1

R3G-A v1 authorizes no new native/helper executable.

The implementation should use bounded direct read-only Node host-file primitives inside the dedicated K2 method and pure strict parsers in the new R3G-A trust module.

This avoids adding:

```text
new executable artifact authority
new helper FD protocol
setuid/capability-bearing code
new donor code
new dependency
```

If direct trusted reads cannot satisfy the theorem safely, implementation must stop and request authorization reconciliation rather than silently introducing a helper.

---

## 35. Host filesystem reads belong to the gateway authority path

The new R3G-A trust module should remain pure: contracts, canonical identities, strict parsers and effective-limit calculations.

Actual reads of fixed `/proc` and `/sys/fs/cgroup` files belong to the K2-owned gateway integration path.

The pure module MUST NOT itself import or expose ambient process execution, Docker clients, network clients, or mutation primitives.

A design where arbitrary callers invoke the pure module with invented physical snapshots is valid only for structural parsing/tests, never as proof that host observation occurred.

---

## 36. E3 resource record

R3G-A must define one deterministic immutable intermediate record purpose-equivalent to:

```text
e3-physical-resource-candidate
```

It must bind at minimum:

```text
R3G-A contract version
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
R3E recordIdentity
R3E durable commit identity
R3E runtimeInstanceIdentity
R3E observerImplementationIdentity
R3G-A observer protocol/semantic implementation identity
subject PID identity via R3E process identity/startTicks binding
cgroup path identity
cgroup hierarchy identity
CPU control identity
CPU effective ratio identity
CPU burst posture
cpuset/affinity identity
scheduler posture identity
memory hierarchy identity
memory effective ceiling
swap hierarchy identity
swap effective ceiling
pre/post physical snapshot identities
resourceCandidateIdentity
```

Raw unbounded host file content must not be persisted merely to make the record reconstructable.

The record should persist normalized bounded evidence sufficient for deterministic validation.

---

## 37. R3G-A observer identity boundary

R3G-A is still E3, not final E4.

The intermediate record may expose a deterministic R3G-A observer protocol/semantic implementation identity derived from fixed contract and normalization versions plus pinned semantic source families.

The implementation evidence ledger must additionally pin the exact Kodac module/gateway/test blobs that realized that protocol.

A future final E4 conjunction MUST NOT treat the semantic identity alone as a full binary attestation of arbitrary deployed JavaScript bytes.

Final observer/build identity remains a later conjunction responsibility.

---

## 38. R3G-A record must not contain final R3B facts

The R3G-A record MUST NOT synthesize or expose as accepted physical proof:

```text
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicy
full observedResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
R3B observerIdentity
R3B observationIdentity
R3B evidenceIdentity
```

It may carry the exact required CPU/memory values only in the narrowly named R3G-A resource theorem fields needed to demonstrate equality against the physical controls.

TTL and maxOutputBytes remain absent/unproven.

---

## 39. No R3B constructor reachability

Production R3G-A implementation MUST NOT import or call:

```text
createSandboxBackendObservation
createSandboxExecutionEvidence
```

The focused test must structurally enforce that these constructor names are absent from the new R3G-A production module and from the newly added R3G-A gateway integration block except where referenced as forbidden strings in tests/documentation.

Canonical R3B source remains unchanged.

---

## 40. No cgroup mutation

R3G-A authorizes no write to:

```text
cgroup.procs
cgroup.threads
cgroup.subtree_control
cpu.max
cpu.max.burst
cpu.weight
cpuset.*
memory.max
memory.high
memory.swap.max
memory.*
```

It also authorizes no mkdir/rmdir/remount/chown/chmod under cgroupfs.

The observer is read-only.

---

## 41. No lifecycle mutation

R3G-A does not authorize:

```text
kill
SIGKILL
Docker stop/kill/remove
cgroup.kill
freeze/thaw
resource update
container restart
```

The only child-process termination authority remains the already-canonical R3E ownership of its own observer command processes on timeout/cancellation.

R3G-A does not own or terminate the observed sandbox.

---

## 42. No Docker authority widening

Canonical R3F remains the only newly proven Docker control-plane provider surface.

R3G-A MUST NOT add Docker endpoints or methods.

No new Docker socket read is needed for cgroup proof.

R3G-A must not add:

```text
Docker stats
Docker events
Docker top
Docker update
Docker exec
Docker lifecycle calls
containerd fallback
```

The exact Docker binding remains supplied through the canonical R3E resolver path, which production may configure with canonical R3F.

---

## 43. No source/network/TTL/output promotion

A successful R3G-A result must still leave these facts explicitly unavailable:

```text
physical source/rootfs = NOT PROVEN
physical network deny-all = NOT PROVEN
TTL = NOT PROVEN
output limit = NOT PROVEN
E4 physical conjunction = NOT PROVEN
```

No wording in code, receipt, test or evidence ledger may imply otherwise.

---

## 44. Bounds and defensive parsing

R3G-A implementation must define fixed non-caller-widenable ceilings for at least:

```text
/proc stat bytes
/proc status bytes
/proc cgroup bytes
mountinfo bytes
cgroup single-control bytes
cgroup.procs bytes
maximum hierarchy depth
maximum PID tokens
maximum CPU-list ranges
maximum decimal digit lengths
maximum normalized cgroup path bytes
maximum record serialized bytes
callback timeout
```

Overflow fails closed without truncating a proof-relevant structure and continuing as if complete.

All host text is untrusted parser input even though it comes from kernel virtual filesystems.

---

## 45. Numeric discipline

Security comparisons must not use floating-point numbers when exact rational/integer semantics are required.

At minimum:

```text
cpu quota/period comparison -> exact integer/BigInt cross multiplication
memory bytes -> exact safe integer or BigInt discipline with explicit canonical bound
start ticks -> exact decimal integer grammar
PID -> exact positive bounded decimal grammar
CPU list -> exact bounded integer ranges
```

Any value outside the implementation's exact representable bounds fails closed.

No rounding may convert an unequal physical limit into equality.

---

## 46. Symlink and path handling

No caller controls any host path.

For cgroup ancestor construction, the implementation must build canonical paths from the validated normalized cgroup membership path and fixed root only.

The implementation must not use unresolved lexical traversal or arbitrary symlink-following path discovery as authority.

If cgroupfs path structure does not match the expected canonical filesystem model, fail closed.

R3G-A does not authorize broad realpath traversal over host filesystem paths.

---

## 47. Race model

R3G-A aims to close subject-lifecycle/configuration races under the non-hostile-host trust model.

It must detect at least:

```text
PID exit/reuse
start-time change
runsc executable/process identity drift already covered by R3E
cgroup membership movement
cgroup hierarchy path change
CPU control drift
CPU burst drift
cpuset/affinity drift
scheduler-policy drift
memory control drift
swap control drift
```

R3G-A does not claim to defend against a malicious privileged host administrator who can arbitrarily rewrite kernel/host state during observation.

That threat is outside the current host-trust model.

---

## 48. Focused fixture strategy

Normal repository CI MUST NOT modify the host runner's real cgroups to create proof fixtures.

The focused R3G-A suite should separate:

### Pure deterministic fixtures

Synthetic bounded text fixtures for:

```text
mountinfo parser
proc stat parser
proc status CPU-list parser
proc cgroup parser
cgroup control parsers
hierarchy canonicalization
exact CPU rational calculation
memory hierarchy calculation
swap hierarchy calculation
record identity/validation
```

### Trusted integration harness

A test-only injected fixed-surface reader may be used only inside the focused test/harness to emulate the exact authorized kernel file responses and race transitions without becoming production API authority.

Production implementation must not expose a generic injected reader to untrusted callers.

### Linux smoke

A Linux-only read-only smoke may inspect the current process/cgroup environment to validate parser compatibility, but CI success MUST NOT depend on the GitHub runner having the exact production CPU/memory limits required by a fixture workload.

The bounded physical-resource claim comes from implementation theorem + exact fixture adversarial coverage; it does not claim GitHub-hosted CI provisioned a real gVisor workload with these cgroup limits.

---

## 49. Required focused hostile cases

The R3G-A focused suite must reject at minimum:

1. non-Linux production path;
2. cgroup v1/hybrid proc grammar;
3. missing/ambiguous cgroup2 mount;
4. mount root not `/`;
5. mountpoint not canonical `/sys/fs/cgroup`;
6. malformed/traversing cgroup path;
7. target `cgroup.type` not domain;
8. PID absent from `cgroup.procs`;
9. PID/startTicks mismatch against R3E subject;
10. malformed `/proc/<pid>/stat` comm/fields;
11. unsupported scheduler policy;
12. nonzero realtime priority;
13. malformed affinity/cpuset list;
14. affinity/cpuset stricter than required CPU capacity;
15. hierarchy over depth bound;
16. missing required CPU/memory/swap controls;
17. malformed `cpu.max`;
18. unlimited-only CPU hierarchy;
19. effective CPU wider than requirement;
20. effective CPU stricter than requirement;
21. positive `cpu.max.burst`;
22. malformed `memory.max`;
23. unlimited-only memory hierarchy;
24. effective memory wider than requirement;
25. effective memory stricter than requirement;
26. positive/unlimited/malformed swap effective limit;
27. cgroup path changes between snapshots;
28. controls change between snapshots;
29. R3E state/process identity changes during bracket;
30. R3E durable commit failure/wrong acknowledgment;
31. R3G-A durable commit failure/wrong acknowledgment;
32. cancellation before/during physical reads;
33. late result after cancellation cannot become success;
34. caller tries to inject PID/path/reader/helper authority;
35. attempt to structurally assign result to R3B observation/evidence;
36. any import/reachability of R3B final evidence constructors.

---

## 50. Successful focused theorem

The exact synthetic success fixture must demonstrate at least one hierarchy where:

```text
R3E exact runtime subject remains stable
PID membership remains stable
cgroup path remains stable
cgroup type = domain
CPU hierarchy effective ratio == required cpuMillis/1000
all cpu.max.burst == 0
cpuset and affinity permit at least required CPU capacity
scheduler policy = supported fair scheduler
memory hierarchy effective hard limit == required memoryBytes
swap effective hard limit == 0
pre/post resource snapshots are identity-equal
R3E lineage commit acknowledgment is valid
R3G-A resource commit acknowledgment is valid
result remains E3-only
```

---

## 51. Cancellation

Cancellation must be checked:

- before R3E external reads;
- during canonical R3E observation as already proven;
- before R3G-A host reads;
- during bounded host-read sequence where practical;
- before R3E durable commit completion;
- before R3G-A durable commit completion;
- before successful return.

A cancelled observation cannot later be upgraded by late callback completion.

R3G-A owns no observed-sandbox termination on cancellation.

---

## 52. Receipt semantics

The dedicated K2 capability must emit normal K2 receipt evidence.

A successful receipt may contain only bounded coarse result evidence purpose-equivalent to:

```text
outputDigest of serialized E3 resource record
outputBytes
exitCode = 0
```

The receipt must not duplicate raw `/proc` or cgroup contents.

A failure receipt must report bounded attributable error text without leaking arbitrary host file contents.

---

## 53. Implementation module boundary

New pure production module:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
```

It may import only deterministic/pure support necessary for:

```text
crypto identities
strict object validation
R3E/R3B/R3A types/validators as needed for lineage/reference validation
```

It MUST NOT import:

```text
node:child_process
Docker SDK/client
network clients
shell execution
filesystem mutation APIs
R3B final observation/evidence constructors
```

Direct fixed host reads remain gateway authority.

---

## 54. Gateway integration boundary

`packages/kodac-runtime/src/execution/gateway.ts` may be modified only to:

1. validate/configure a narrow optional R3G-A durable-commit runtime contract;
2. refactor the existing R3E observer flow into a private trusted core without changing public R3E behavior;
3. add one dedicated public method purpose-equivalent to:

```text
observeGvisorCgroupV2Resources(requirement, observer?, options?)
```

4. perform the fixed bounded read-only R3G-A host observations;
5. create/validate/durably commit the E3 resource candidate;
6. persist K2 receipt evidence.

No other gateway capability or command behavior may be changed.

---

## 55. Constructor compatibility

If `ExecutionGateway` receives a new optional R3G-A trusted runtime parameter, it must be appended in a backward-compatible optional position and preserve all existing constructor call sites.

No existing policy/confinement/R3E configuration meaning may change.

R3G-A configuration must not be required for existing gateway functions.

---

## 56. Public package export

`packages/kodac-runtime/src/index.ts` may add only the export for the new R3G-A pure trust module.

No unrelated export or package surface change is authorized.

---

## 57. Current gateway byte-pin reconciliation

Canonical gateway blob at authorization base is:

```text
packages/kodac-runtime/src/execution/gateway.ts
420df04c5e0a42b371a250d75e580c36bb32f8cb
```

Repository search at authorization time found executable tests that still pin this exact blob.

R3G-A intentionally supersedes that gateway byte pin only because it adds the dedicated physical-resource observation path while preserving all predecessor behavior.

The implementation may reconcile only the exact executable tests listed in the allowlist below and only to:

- replace the superseded gateway blob pin;
- preserve their existing owned theorem;
- assert R3G-A does not widen their authority surface where appropriate.

No behavioral weakening is authorized.

Before any implementation write, an exact repository search for the canonical gateway blob MUST be repeated. If an additional executable test pins it, implementation must stop and reconcile authorization before modifying an unlisted path.

---

## 58. Exact pre-ledger implementation allowlist

After this authorization becomes canonical, R3G-A implementation may modify exactly these thirteen paths before the evidence ledger exists:

```text
1.  packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
2.  packages/kodac-runtime/src/execution/gateway.ts
3.  packages/kodac-runtime/src/index.ts
4.  packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
5.  packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
6.  packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
7.  packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
8.  packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
9.  packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
10. packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
11. packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
12. packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
13. packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

No fourteenth pre-ledger path is authorized.

---

## 59. Explicit protected paths

R3G-A MUST NOT modify:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/trust/confinement.ts
packages/kodac-runtime/src/trust/confinement-linux-landlock.ts
packages/kodac-runtime/src/trust/confinement-runtime.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/*
.github/workflows/*
```

No dependency update, generated code, donor import, schema change or workflow change is authorized.

---

## 60. R3E/R3F protected blobs

At minimum the focused R3G-A test must prove byte identity for canonical predecessor surfaces that R3G-A is not authorized to modify, including:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
47c792ba01c9ba4b2db94d7558f282cdbd218660

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
1d02a5dbc1dc4071636c24327e7faf9906370ef5

packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
452bd955cb0ef84f2090aa646dfdc70ad610a8d9

packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
b9242c5cecc18fd43b2b80aeffd974ef5311fded
```

The focused test may also pin additional canonical high-risk surfaces where useful.

---

## 61. Evidence ledger lifecycle

Reserved R3G-A evidence ledger path:

```text
docs/planning/KODAC_KDO_H4_R3G_A_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_EVIDENCE_2026-08-16.md
```

It MUST NOT exist during implementation/pre-ledger review.

After exact-head pre-ledger PASS, it may be created in one ledger-only commit as the sole additional path.

Fresh complete post-ledger exact-head certification is mandatory.

Any implementation correction after ledger creation invalidates that ledger cycle and requires withdrawal/recreation or explicit reconciliation.

---

## 62. Pre-ledger proof must verify scope before tests are interpreted

Before implementation can be accepted for ledger creation, exact diff against its canonical implementation base must show only the thirteen allowlisted paths.

The reserved ledger must be absent.

Any extra production/test/docs/schema/workflow/dependency path invalidates the pre-ledger gate until reconciled canonically.

---

## 63. Required repository gates

Any R3G-A implementation head must pass at exact accepted head:

```text
governance / provenance
legacy tests / ruff
runtime-change classifier
Ubuntu runtime Typecheck + full Test + benchmark
Windows runtime Typecheck + full Test + benchmark
macOS runtime Typecheck + full Test + benchmark
K2 runtime aggregate gate
K3-R4 regression gate
K3-R5 regression gate
focused R3G-A proof
manual architecture/trust/security review
0 unresolved actionable review threads
```

External reviewer availability/status must be recorded accurately.

A pending/rate-limited/unavailable reviewer is not a PASS.

---

## 64. Focused success cannot be fixture laundering

Synthetic kernel-surface fixtures prove parser, identity, hierarchy and fail-closed logic.

They do not prove that a real production Docker/gVisor workload was created in GitHub Actions.

The eventual bounded R3G-A claim therefore means the canonical K2 implementation can perform the physical read-only theorem against a compatible live Linux cgroup-v2 subject, not that repository CI itself provisioned production gVisor resource enforcement.

No CI output may be worded as a real-production deployment claim unless such a future test is separately authorized.

---

## 65. No ambient configuration downgrade

The implementation must not silently fall back when any required physical surface is unavailable.

Examples:

```text
cgroup v2 unavailable -> fail
mount layout unsupported -> fail
PID not visible -> fail
controls inaccessible -> fail
cpu.max unlimited -> fail
memory.max unlimited -> fail
swap not zero -> fail
scheduler unsupported -> fail
hierarchy ambiguous -> fail
commit unavailable -> fail
```

Docker E2 values may not substitute for failed physical reads.

---

## 66. No direct caller use of pure parser as proof

The new pure module may expose parser/validator constructors for deterministic tests and internal composition.

A caller-created object that passes structural validation is not proof that K2 performed the authorized host reads.

Only the dedicated gateway path plus validated durable evidence commit and K2 receipt can establish the R3G-A trusted-observation provenance.

This is the same provenance distinction made canonical for R3F E2.

---

## 67. Maximum bounded claim after canonical R3G-A implementation

Only after:

- this authorization is canonical;
- implementation stays within the exact allowlist;
- exact-head pre-ledger gate passes;
- ledger-only transition is proven;
- fresh exact-head post-ledger gate passes;
- canonical merge succeeds;

may Kodac make the bounded claim:

```text
KODAC_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_PROVEN
```

Meaning only:

> K2 can bind one exact canonical R3E gVisor runtime instance to a bounded race-resistant observer-visible Linux cgroup-v2 hierarchy and durably record an E3 candidate proving an exact v1 fair-scheduler CPU capacity ceiling, exact hard memory ceiling and zero swap-device allowance without mutating cgroups or minting R3B final backend observation/evidence.

---

## 68. Explicit non-claims after R3G-A

The bounded R3G-A claim does NOT mean:

```text
physical immutable source/rootfs proven
physical deny-all network proven
TTL proven
output limit proven
R3B complete observedResourcePolicy proven
R3B SandboxBackendObservation proven
R3B SandboxExecutionEvidence proven
production container creation/lifecycle proven
Docker mutation authorized
cgroup mutation authorized
external-process ask enabled
H4 complete
H6 authorized
```

---

## 69. Expected next candidate

After proven canonical R3G-A, the next physical-policy candidate remains independently authorized.

Purpose-equivalent next candidate:

```text
KDO-H4-R3G-B — Immutable Source / Rootfs Physical Lineage Authorization
```

R3G-B must decide the trusted content/snapshot/rootfs lineage theorem independently and may not treat R3F Docker manifest E2 as physical rootfs proof by itself.

R3G-A pre-authorizes none of R3G-B's read surfaces or implementation choices.

---

## 70. Exact authorization PR scope

This authorization PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_A_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_AUTHORIZATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

No evidence ledger is needed for this authorization document itself.

---

## 71. Authorization review gate

Before this authorization becomes canonical, its exact docs-only PR head must prove:

```text
base = exact canonical main 5140b4e101a79c8aa56247b7d705921a99fed787
changed paths = exactly this authorization document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2/K3 regressions = PASS where triggered
available external review = no unresolved actionable finding
reviewer availability/status = recorded accurately
manual semantic/kernel/trust/security review = PASS
0 unresolved actionable review threads
```

Any finding that requires implementation code must be resolved in the authorization semantics or deferred; it must not widen this docs-only PR.

---

## 72. Final boundary

If this exact authorization becomes canonical:

```text
R3A:
CANONICAL / PROVEN

R3B CONTRACT:
CANONICAL / PROVEN AS CONTRACT

R3C:
CANONICAL / SEMANTICS RECONCILED

R3D:
CANONICAL / E3 GVISOR PRIMITIVE PROVEN

R3E:
CANONICAL / K2 EXACT-INSTANCE LINEAGE PROVEN

R3F:
CANONICAL / DOCKER E2 CONTROL PLANE PROVEN / CLOSED

R3G:
CANONICAL / MONOLITH SPLIT

R3G-A AUTHORIZATION:
CANONICAL

R3G-A IMPLEMENTATION:
AUTHORIZED ONLY WITHIN THE THIRTEEN-PATH PRE-LEDGER ALLOWLIST

R3B E4 PHYSICAL PROOF:
NOT YET PROVEN

EXTERNAL-PROCESS ask:
BLOCKED

H4:
OPEN

H6:
NOT AUTHORIZED
```

R3G-A exists to earn CPU/memory/swap physical facts without inventing the source/network/TTL/output facts that remain unproven.