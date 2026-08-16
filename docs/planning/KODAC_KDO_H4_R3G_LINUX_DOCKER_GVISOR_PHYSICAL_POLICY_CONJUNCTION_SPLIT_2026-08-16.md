# KDO-H4-R3G — Linux Docker/gVisor Physical Policy Conjunction Split

Date: 2026-08-16
Status: SPLIT / AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `039a5c0a6efd04d4bf81b9fb86201121daae9234`
Canonical base tree: `c1b6ef8a47cc62f88a9bb6e023c9d41b51b88412`
Predecessor: canonical H4-R3F Docker read-only control-plane provider and canonical closure

---

## 1. Decision

```text
GATE:
KDO-H4-R3G

NAME:
LINUX DOCKER/gVISOR PHYSICAL POLICY CONJUNCTION

CHANGE CLASS:
DOCS ONLY / SCOPE SPLIT / NO EXECUTION

R3F:
CANONICAL / PROVEN / CLOSED

R3G MONOLITHIC IMPLEMENTATION:
REJECTED

R3G PHYSICAL READ AUTHORITY:
NOT AUTHORIZED BY THIS DOCUMENT

R3G MUTATION AUTHORITY:
NONE

R3B PHYSICAL OBSERVATION MINTING:
NOT AUTHORIZED

R3B EXECUTION EVIDENCE MINTING:
NOT AUTHORIZED

NEXT IMPLEMENTATION:
NOT AUTHORIZED BY THIS DOCUMENT

NEXT AUTHORIZATION CANDIDATE:
KDO-H4-R3G-A — LINUX CGROUP V2 PHYSICAL RESOURCE OBSERVATION

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

R3G resolves one architectural question before any new privileged read is added:

```text
Can source/rootfs + network + CPU/memory + TTL + output + final R3B proof
be safely implemented as one physical-policy slice?

DECISION:
NO
```

The original R3G candidate is therefore canonically decomposed into independently authorized physical-observation slices followed by a final conjunction/minting slice.

This document authorizes no implementation.

---

## 2. Canonical predecessor truth

Canonical R3F closure merge:

```text
039a5c0a6efd04d4bf81b9fb86201121daae9234
```

Canonical tree:

```text
c1b6ef8a47cc62f88a9bb6e023c9d41b51b88412
```

R3F canonical bounded claim:

```text
KODAC_DOCKER_READ_ONLY_CONTROL_PLANE_BINDING_PROVIDER_PROVEN
```

R3F proves a trusted Linux Docker read-only E2 exact-subject path and an R3E-compatible container binding.

R3F does not prove:

```text
physical immutable source/rootfs enforcement
physical deny-all network enforcement
physical CPU cgroup enforcement
physical memory/swap cgroup enforcement
TTL enforcement
output-limit enforcement
R3B physical SandboxBackendObservation
R3B SandboxExecutionEvidence
```

R3G must preserve that boundary.

---

## 3. Governing canonical evidence ladder

Canonical R3C established:

```text
REQUIREMENT
!= CONFIGURATION
!= CONTROL-PLANE STATUS
!= OBSERVATION SIGNAL
!= TRUSTED PHYSICAL PROOF
```

and the evidence classes:

```text
E0 = untrusted workload/guest claim
E1 = desired/declarative configuration
E2 = trusted host control-plane observation
E3 = trusted host physical/runtime state candidate
E4 = accepted Kodac physical proof after exact conjunction
```

R3D produced only an E3 gVisor runtime candidate.

R3E integrated that candidate into one exact execution-attempt/runtime-instance lineage and durably committed it, but still produced only:

```text
e3-integrated-runtime-lineage
```

R3F produced only:

```text
e2-docker-control-plane
```

R3G must not silently upgrade either input to E4.

---

## 4. Governing canonical implementation identities

Important canonical source blobs at R3G entry include:

```text
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
b9242c5cecc18fd43b2b80aeffd974ef5311fded

packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
47c792ba01c9ba4b2db94d7558f282cdbd218660

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
1d02a5dbc1dc4071636c24327e7faf9906370ef5

packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
452bd955cb0ef84f2090aa646dfdc70ad610a8d9

packages/kodac-runtime/src/execution/gateway.ts
420df04c5e0a42b371a250d75e580c36bb32f8cb
```

This R3G split document changes none of them.

---

## 5. The R3B all-or-nothing evidence contract is a hard boundary

Canonical R3B `SandboxBackendObservation` contains one complete:

```text
observedResourcePolicy: SandboxResourcePolicy
```

That resource policy includes:

```text
cpuMillis
memoryBytes
ttlMs
maxOutputBytes
```

Canonical `createSandboxExecutionEvidence(...)` additionally requires the backend capability to support every required physical-observation family:

```text
supportsImmutableImageDigestObservation
supportsDenyAllNetworkObservation
supportsCpuBudgetObservation
supportsMemoryLimitObservation
supportsTtlObservation
supportsOutputLimitObservation
```

and requires the observed resource-policy identity and all resource values to match the exact R3A requirement.

Therefore the following is forbidden:

```text
CPU physically proven
+
memory physically proven
+
TTL not proven
+
output not proven
=
construct full observedResourcePolicy anyway
```

That would turn unknown facts into supplied proof.

R3G must not do it.

---

## 6. Consequence: R3G cannot truthfully mint R3B evidence after only source/network/CPU/memory

Even if a future slice physically proves:

```text
immutable source/rootfs
physical deny-all network
CPU ceiling
memory + swap ceiling
```

that is still insufficient for canonical R3B execution evidence while:

```text
TTL = unproven
maxOutputBytes = unproven
```

The R3B v1 contract intentionally has no partial final-observation type.

Therefore all pre-final R3G sub-slices must produce their own explicit intermediate E3 records and MUST NOT be structurally assignable to:

```text
SandboxBackendObservation
SandboxExecutionEvidence
```

---

## 7. Why the monolithic R3G candidate is over-broad

The original R3G candidate contains physical claims sourced from materially different trust surfaces:

```text
source/rootfs -> Docker/container runtime/bundle/snapshot/content lineage
network -> gVisor/runtime/network namespace or equivalent physical state
CPU -> cgroup v2 hierarchy/effective bandwidth control
memory/swap -> cgroup v2 hierarchy/effective memory and swap control
TTL -> K2-owned timer + lifecycle mutation/termination
output -> K2-owned bounded aggregate stdout/stderr path
final proof -> trusted conjunction + R3B capability/observation/evidence minting
```

These are not one observer theorem.

They differ in:

- source of truth;
- required host privileges;
- race model;
- failure semantics;
- lifecycle ownership;
- whether mutation authority is required;
- implementation identity;
- test fixture strategy;
- whether proof can be read-only.

A single R3G implementation would either become too broad or hide unproven facts behind one record.

The monolith is rejected.

---

## 8. Canonical split topology

R3G is decomposed conceptually as follows.

### R3G-A — Linux cgroup v2 physical resource observation

Target facts only:

```text
physical CPU capacity ceiling
physical memory ceiling
physical swap ceiling / no-swap posture
```

Output class:

```text
E3 PHYSICAL RESOURCE CANDIDATE
```

No R3B observation/evidence minting.

### R3G-B — immutable source/rootfs physical lineage

Target fact only:

```text
exact running execution instance is physically bound to the required immutable OCI source/content theorem
```

The authorization must independently decide the trusted source surface before implementation.

Docker image names/tags, bundle path strings and R3F manifest E2 alone are insufficient.

Output class:

```text
E3 PHYSICAL SOURCE CANDIDATE
```

No R3B observation/evidence minting.

### R3G-C — physical deny-all network observation

Target fact only:

```text
exact running gVisor execution instance has no non-loopback network authority under the admitted v1 theorem
```

Docker `NetworkMode=none` and zero Docker attachments remain E2 and are insufficient alone.

Guest self-report remains forbidden.

Output class:

```text
E3 PHYSICAL NETWORK CANDIDATE
```

No R3B observation/evidence minting.

### Later lifecycle/output slices

TTL and output bounds require separate authorization because they introduce distinct runtime ownership and may require side effects.

Purpose-equivalent later slices may be named:

```text
R3G-D — K2 TTL / lifecycle enforcement
R3G-E — K2 aggregate output-bound enforcement
```

Their exact numbering/names remain subject to their own authorization.

### Final physical conjunction

Only after every R3B-required fact is independently proven may a later purpose-equivalent slice:

```text
R3G-F — R3B physical proof conjunction / minting
```

be considered.

That final slice must revalidate exact-subject lineage and race boundaries rather than merely concatenate old records.

---

## 9. R3G-A is the first candidate because it is the narrowest physical read-only theorem

CPU and memory/swap enforcement are the best first physical-policy slice because Linux cgroup v2 exposes bounded host-owned state with explicit kernel semantics.

The first R3G-A authorization should decide a narrow theorem over:

```text
one exact R3E runtime instance
+
one exact host cgroup-v2 lineage
+
physical CPU effective ceiling
+
physical memory effective ceiling
+
physical swap effective ceiling
```

It must not claim source/rootfs, network, TTL or output proof.

---

## 10. R3G-A must be cgroup-v2-only initially

The first physical resource observer should be Linux cgroup v2 only.

```text
cgroup v2:
candidate scope

cgroup v1:
out of scope for first slice

hybrid cgroup mode:
out of scope for first slice unless exact later authorization proves it
```

Fail closed when the expected unified hierarchy cannot be proven.

No silent fallback to cgroup v1 or Docker E2 configuration is allowed.

---

## 11. Pinned gVisor cgroup source study

R3D already pins gVisor:

```text
repository:
google/gvisor

commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293

tree:
12ce7f8c4f8b0481cccb4c28632fff49cb3f50e4
```

R3G additionally studies at that same pin:

```text
runsc/cgroup/cgroup_v2.go
blob 62e538d00a5c5a74045174a87365910fd91f4a16
```

The pinned implementation uses cgroup-v2 control files including:

```text
cpu.max
memory.max
memory.swap.max
cgroup.procs
```

and explicitly contains special handling for cgroup-v2 + systemd where CPU limits may be placed in a parent slice instead of the leaf cgroup.

This is a source-study pin only. R3G copies no gVisor implementation code and adds no dependency.

---

## 12. Leaf-only cgroup reads are forbidden as a proof strategy

A naïve theorem such as:

```text
read <leaf>/cpu.max
read <leaf>/memory.max
accept if values look correct
```

is not authorized.

Reasons include:

- cgroup v2 limits are hierarchical;
- a relevant ancestor may impose a stricter effective limit;
- gVisor's pinned systemd path may resolve CPU limits through a parent slice;
- the exact subject process can move or exit during observation;
- PID reuse can invalidate path correlation;
- controller availability/delegation may differ across hosts.

R3G-A must define effective-limit and hierarchy semantics explicitly before code is written.

---

## 13. Exact-v1 resource semantics must fail closed on effective-limit ambiguity

Canonical R3B v1 requires exact observed resource-policy equality with the requirement.

Therefore R3G-A must not silently convert:

```text
required CPU = X
effective physical CPU <= X but not exactly X
```

into:

```text
observed CPU = X
```

Likewise for memory.

A stricter ancestor may be security-safe in one sense, but it is not byte/semantic equality with the canonical R3B observed policy.

Until a future contract explicitly admits monotonic stricter equivalence, R3G-A v1 should fail closed when the exact effective ceiling cannot be established as the required value.

No contract change is authorized by R3G.

---

## 14. R3G-A exact subject must derive from R3E lineage, not from caller PID

A public/model/plugin caller must not select:

```text
PID
cgroup path
/sys/fs/cgroup path
/proc path
container ID
runtime root
```

as physical-proof authority.

R3G-A must bind its physical subject to canonical R3E identity material, including at minimum:

```text
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
stateIdentity
processIdentity
state PID
process start ticks
observerImplementationIdentity
```

The exact future input contract may carry a trusted R3E lineage object or an equivalent trusted-host-owned reference, but it must not accept an arbitrary caller-constructed structurally valid lineage as proof without trusted provenance/commit binding.

---

## 15. R3F E2 provenance must remain trusted-path-bound

R3F closure made canonical that:

```text
validateDockerControlPlaneObservation(object) succeeds
```

does not itself prove that trusted Docker I/O occurred.

The same rule applies to future conjunction work.

R3G must not accept:

```text
caller-constructed R3F E2 object
+
caller-constructed R3E lineage object
```

and upgrade them into physical proof solely through structural validation.

Trusted provenance/durable commit ownership must remain part of the conjunction theorem.

---

## 16. R3G-A must use a dedicated K2 capability, not generic `runCommand`

Canonical `ExecutionGateway` exposes generic read-command machinery, but physical cgroup proof must not be expressed as caller-selected:

```text
capability
executable
args
paths
```

R3G-A must define a dedicated Trust-Kernel-owned capability purpose-equivalent to:

```text
runtime.observe.gvisor.cgroup-v2
```

with subject, helper/artifact identity, protocol, host read paths and output ceilings fixed by trusted implementation/configuration.

The public caller cannot choose arbitrary host `/proc` or `/sys/fs/cgroup` reads through this capability.

Whether R3G-A requires a new `ExecutionGateway` method or a new strictly typed subordinate trusted-runtime callback must be decided by the R3G-A docs-only authorization before implementation.

R3G itself authorizes neither choice.

---

## 17. R3E generic behavior must remain protected

R3G-A must not weaken canonical R3E behavior:

```text
runtime.observe.gvisor
```

R3E currently:

- creates the execution-attempt identity inside K2;
- obtains the exact container binding from a trusted resolver;
- verifies runsc/helper artifacts by retained descriptors and SHA-256;
- executes trusted artifacts via `/proc/self/fd/*`;
- brackets state/process observations;
- requires state/process identity stability;
- re-verifies trusted artifacts;
- durably commits the lineage record before success;
- records K2 receipt evidence;
- blocks ASK rather than using approval as a bypass.

R3G-A must preserve those theorems and may not replace them with PID-only or path-only observation.

---

## 18. Candidate R3G-A physical observation bracket

The R3G-A authorization should evaluate a race-resistant pattern purpose-equivalent to:

```text
trusted R3E exact-instance identity / pre-observation
->
resolve exact cgroup-v2 membership for the same live subject
->
read bounded effective CPU/memory/swap controls
->
re-observe exact process identity / membership
->
reject movement, exit, PID reuse, exec drift or hierarchy drift
->
durably commit E3 resource record
```

The exact ordering, helper protocol and allowed files remain to be authorized by R3G-A.

R3G does not pre-authorize `/proc/<pid>/cgroup`, mountinfo, cgroupfs or any helper access.

---

## 19. R3G-A output must be an intermediate record

The future R3G-A record should be purpose-equivalent to:

```text
e3-physical-resource-candidate
```

and bind at minimum:

```text
R3G-A contract version
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
R3E runtimeInstanceIdentity
R3E record/commit lineage identity
trusted resource-observer implementation identity
cgroup-v2 subject identity
CPU effective-limit evidence identity
memory effective-limit evidence identity
swap effective-limit evidence identity
pre/post subject-stability identities
resourceCandidateIdentity
```

It must not contain or synthesize:

```text
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicy
full observedResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
R3B observationIdentity
R3B evidenceIdentity
```

unless a later final conjunction authorization explicitly makes those facts available.

---

## 20. R3G-B source/rootfs proof is deliberately deferred

R3F proves exact Docker E2 manifest digest:

```text
ImageManifestDescriptor.Digest
```

R3E proves exact gVisor runtime/process lineage.

Neither proves that the physically executed root filesystem bytes are the exact content represented by that OCI manifest digest.

The following are insufficient alone:

```text
Docker image name/tag
Docker Config.Image
R3F manifest descriptor digest
OCI bundle root.path string
runsc state bundle path
filesystem tree hash invented ad hoc
container label
```

R3G-B must independently decide the trusted content/snapshot/rootfs lineage surface.

It may need Docker/containerd snapshot/content-store or another backend-specific theorem; none is pre-authorized here.

---

## 21. R3G-C network proof is deliberately deferred

R3F proves E2:

```text
HostConfig.NetworkMode == none
NetworkSettings.Networks == {}
```

R3C already made canonical that E2 alone is insufficient physical deny-all proof.

The future R3G-C theorem must prove the exact live gVisor execution instance has no non-loopback network authority under the v1 deny-all meaning.

It must not rely on:

```text
guest dmesg
uname
environment
application self-report
Docker labels
Docker NetworkMode alone
```

R3G-C must decide the runtime-specific trusted host surface and race bracket before implementation.

---

## 22. TTL requires lifecycle authority and therefore must not be smuggled into read-only R3G-A

Canonical `ttlMs` is a maximum wall-clock lifetime whose expiry must cause fail-closed termination/revocation.

That theorem requires at minimum:

```text
exact execution-instance timer/deadline binding
+
K2-owned termination/revocation authority
+
durable evidence of expiry action/outcome
```

A read-only observer cannot prove it.

R3G-A therefore must not set:

```text
supportsTtlObservation = true
```

or create an R3B observed resource policy containing a physically claimed TTL.

---

## 23. Output-bound enforcement requires its own execution-stream theorem

Canonical `maxOutputBytes` is an aggregate output bound at the Kodac workload boundary.

A physical proof must define:

```text
stdout/stderr aggregation semantics
byte accounting
stream ownership
overflow behavior
bounded buffering
termination/truncation semantics
late-output behavior
durable evidence
```

Docker logging configuration is not automatically equivalent.

R3G-A therefore must not set:

```text
supportsOutputLimitObservation = true
```

or create an R3B observed resource policy containing a physically claimed output limit.

---

## 24. Final R3B minting must be last, not first

The final conjunction slice may only be authorized after independent canonical proof exists for every R3B-required family:

```text
immutable source digest
semantic runtime class
physical deny-all network
physical CPU ceiling
physical memory/swap ceiling
TTL enforcement
output-limit enforcement
credential binding = null
no downgrade
one exact execution instance
trusted observer implementation identity
```

The final slice must then define one race-resistant accepted-E4 bracket and may only mint:

```text
SandboxBackendCapabilityDeclaration
SandboxBackendObservation
SandboxExecutionEvidence
```

if every contract field can be derived from canonical trusted evidence without filling unknowns.

---

## 25. No R3B contract mutation is authorized now

R3G identifies constraints in the existing all-or-nothing R3B contract but does not modify it.

No change is authorized to:

```text
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
R3B fixed identity vectors
R3B capability semantics
```

If future physical evidence demonstrates that stricter-than-requested resource ceilings should be admissible, or that partial physical observations need a first-class common contract, that requires an independent canonical reconciliation before changing R3B.

---

## 26. No R3A contract mutation is authorized

R3G preserves canonical R3A meanings:

```text
source authority = immutable OCI digest
network policy = deny-all
cpuMillis = milliCPU capacity units
memoryBytes = maximum memory-capacity bound
ttlMs = maximum wall-clock lifetime
maxOutputBytes = aggregate workload output bound
```

R3G changes no workload identity encoding or fixed vector.

---

## 27. No direct host physical read is authorized by R3G

This split document authorizes none of:

```text
/proc/<pid>/cgroup
/proc/<pid>/mountinfo
/proc/<pid>/ns/*
/proc/<pid>/root
/sys/fs/cgroup/*
network namespace reads
mount namespace reads
Docker extra endpoints
containerd socket
containerd content/snapshot store
runsc state-root files beyond canonical R3E commands
BPF/netlink inspection
registry access
```

Each future physical surface requires its own exact authorization.

---

## 28. No new helper or binary is authorized by R3G

R3G does not authorize:

- a new native helper;
- modification of the canonical R3D helper;
- extra file descriptors;
- arbitrary shell/CLI commands;
- a new package dependency;
- Docker/containerd SDKs;
- privileged daemon/service;
- setuid/capability-bearing helper;
- BPF program;
- namespace-entering helper.

R3G-A must decide its helper strategy first.

---

## 29. No Docker mutation is authorized

R3F's mutation boundary remains canonical.

R3G does not authorize:

```text
Docker POST
Docker PUT
Docker PATCH
Docker DELETE
container create/start/stop/kill/restart/remove/exec
image pull/push/remove
network connect/disconnect
resource update
```

Physical observation must not become a hidden container-control API.

---

## 30. No ASK re-enable

R3G is unrelated to target-executable approval identity.

External-process `ask` remains blocked.

No new physical observer may be used to smuggle caller-selected execution through an observer capability.

---

## 31. R3G-A authorization requirements

Before any R3G-A implementation write, a separate docs-only authorization must decide at minimum:

1. exact Linux/cgroup-v2 platform floor;
2. exact trusted subject input and durable provenance linkage to R3E;
3. exact host files/surfaces allowed to be read;
4. exact helper/runtime architecture;
5. whether `ExecutionGateway` receives a dedicated method or a narrower subordinate trusted callback;
6. exact capability name and policy behavior;
7. exact cgroup namespace/mountpoint discovery theorem;
8. exact `/proc/<pid>/cgroup` grammar if used;
9. PID/start-time/pidfd or equivalent anti-reuse binding;
10. exact cgroup hierarchy identity;
11. controller availability checks;
12. exact CPU effective-limit algorithm across ancestors/systemd layout;
13. exact memory effective-limit algorithm across ancestors;
14. exact swap/no-swap theorem;
15. exact handling of `max`/unlimited values;
16. exact handling of stricter ancestors;
17. exact pre/post observation race bracket;
18. fixed observer implementation identity;
19. bounded I/O and protocol ceilings;
20. durable E3 resource-record commit semantics;
21. exact implementation allowlist;
22. protected predecessor blobs;
23. fake/isolated Linux fixture strategy that does not modify host cgroups in normal repository CI;
24. required exact-head CI/review gates;
25. explicit proof that no R3B observation/evidence constructor is reachable.

Until that document becomes canonical:

```text
R3G-A IMPLEMENTATION = NOT AUTHORIZED
```

---

## 32. Expected R3G-A maximum claim

The future R3G-A authorization should target a bounded claim purpose-equivalent to:

```text
KODAC_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_PROVEN
```

Meaning only that Kodac can bind one exact canonical R3E gVisor runtime instance to a trusted race-resistant Linux cgroup-v2 observation proving exact v1 CPU, memory and no-swap ceilings and durably record that E3 physical-resource candidate.

It must explicitly not mean:

```text
source/rootfs proof
network proof
TTL proof
output proof
R3B E4 proof
R3B SandboxBackendObservation proven
R3B SandboxExecutionEvidence proven
H4 complete
```

The exact claim text remains subject to R3G-A authorization/review.

---

## 33. Protected canonical surfaces for this split PR

This docs-only R3G split must leave all production/test/schema/workflow/dependency surfaces byte-identical.

In particular it must not modify:

```text
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/*
.github/workflows/*
```

---

## 34. Exact R3G split scope

This PR is authorized to add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_LINUX_DOCKER_GVISOR_PHYSICAL_POLICY_CONJUNCTION_SPLIT_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

No evidence ledger is required for this docs-only split because it proves no new runtime theorem.

Its canonical merge is the governance evidence that the split decision became authority.

---

## 35. R3G split review gate

Before canonical merge, the exact docs-only PR head must prove:

```text
base = exact canonical main 039a5c0a6efd04d4bf81b9fb86201121daae9234
changed paths = exactly this one R3G split document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2/K3 regression gates = PASS where triggered
available external review = no unresolved actionable finding
reviewer availability/status = recorded accurately
manual architecture/security review = PASS
0 unresolved actionable review threads
```

Any finding that requires implementation must be deferred to R3G-A or a later authorization and must not widen this PR.

---

## 36. Maximum claim after canonical R3G split

If this exact docs-only split passes and merges, the maximum new claim is:

```text
KODAC_PHYSICAL_POLICY_CONJUNCTION_SCOPE_SPLIT_RECONCILED
```

Meaning only:

> Kodac has canonically determined that the remaining R3B physical proof cannot be implemented truthfully as one R3G monolith; CPU/memory cgroup observation, source/rootfs lineage, network isolation, TTL lifecycle enforcement, output-bound enforcement and final R3B conjunction must be independently authorized and proven before E4 evidence may be minted.

It does not prove any new physical fact.

---

## 37. Final boundary

```text
R3A WORKLOAD IDENTITY:
CANONICAL / PROVEN

R3B REQUIREMENT / OBSERVATION / EVIDENCE CONTRACT:
CANONICAL / PROVEN AS CONTRACT

R3C OBSERVATION SEMANTICS:
CANONICAL / RECONCILED

R3D GVISOR OBSERVER PRIMITIVE:
CANONICAL / PROVEN AS E3 CANDIDATE

R3E K2 GVISOR EXACT-INSTANCE LINEAGE:
CANONICAL / PROVEN

R3F DOCKER READ-ONLY E2 CONTROL PLANE:
CANONICAL / PROVEN / CLOSED

R3G MONOLITH:
REJECTED

R3G SPLIT:
AUTHORIZED ONLY IF THIS DOCUMENT BECOMES CANONICAL

R3G-A IMPLEMENTATION:
NOT YET AUTHORIZED

R3B PHYSICAL E4 PROOF:
NOT YET PROVEN

EXTERNAL-PROCESS ask:
BLOCKED

H4:
OPEN

H6:
NOT AUTHORIZED
```

R3G exists to prevent Kodac from filling a complete physical evidence object with facts that were never independently proven.