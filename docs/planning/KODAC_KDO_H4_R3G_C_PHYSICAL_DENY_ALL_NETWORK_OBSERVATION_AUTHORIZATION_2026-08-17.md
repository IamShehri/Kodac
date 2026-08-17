# KDO-H4-R3G-C — gVisor Physical Deny-All Network Observation Authorization

Date: 2026-08-17
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `2197bc9fa98ff236c2d3d0aa3f5614dfafdfdd29`
Canonical base tree: `e9496d2a01e7b8548a82a9a373044c1b6c2bf986`
Predecessors: canonical/proven H4-R3E, H4-R3F, H4-R3G-A, H4-R3G-B

## 1. Decision

```text
GATE:
KDO-H4-R3G-C

NAME:
GVISOR PHYSICAL DENY-ALL NETWORK OBSERVATION

THIS PR:
DOCS-ONLY AUTHORIZATION CANDIDATE

PRODUCT IMPLEMENTATION IN THIS PR:
NONE

FUTURE IMPLEMENTATION CLASS IF THIS AUTHORIZATION BECOMES CANONICAL:
BOUNDED LINUX-ONLY READ-ONLY TRUSTED-HOST OBSERVER

R3B OBSERVATION / EXECUTION-EVIDENCE MINTING:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO
```

The only target fact is the canonical R3G-C fact:

```text
one exact running gVisor root sandbox
has no host-backed non-loopback network authority
under the admitted v1 theorem
```

Canonical loopback is allowed.

---

## 2. Exact bounded theorem

R3G-C v1 may accept an E3 physical-network candidate only when all of the following hold together:

```text
fresh R3F E2 Docker deny-all snapshot
+ exact R3E running-instance binding
+ pinned gVisor NetworkNone semantics
+ trusted-host creation serialization invariant
+ exact trusted runtimeRoot-local sandbox control endpoint
+ fixed read-only containerManager.GetNetworkConfig RPC
+ retained physically-applied creation topology = canonical loopback only
+ zero FDBasedLinks
+ zero XDPLinks
+ no external/default gateway authority
+ exact endpoint/runtime/topology stability bracket
= E3 PHYSICAL DENY-ALL NETWORK CANDIDATE
```

The theorem explicitly does **not** mean:

```text
no loopback
no sockets
no AF_UNIX / local IPC
no in-sandbox network syscalls
direct live NIC-table enumeration
Byzantine or malicious-host resistance
R3B final backend observation/evidence
```

---

## 3. Canonical predecessor truth

R3E already owns exact-instance gVisor runtime/process binding.

R3F already owns fresh Docker read-only subject resolution and E2 facts such as purpose-equivalent:

```text
HostConfig.Runtime == "runsc"
HostConfig.NetworkMode == "none"
NetworkSettings.Networks == {}
```

R3F explicitly does not promote those Docker facts to physical network proof.

R3G-A and R3G-B prove separate resource and immutable-source/rootfs theorems. R3G-C must not reinterpret them.

---

## 4. Exact upstream pin

All gVisor reasoning is pinned to:

```text
repository: google/gvisor
commit: 50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

Primary pinned paths/blobs:

```text
runsc/sandbox/network.go
989bb242a18cbcc6e4da26d17a8edbf7a19fcdfb

runsc/sandbox/sandbox.go
70724a90adae59759b489b13e50942588c61ea70

runsc/container/container.go
5ea716990eacbd5511bcc75f4661817900577211

pkg/urpc/urpc.go
2a3fb90ee8edc068e4d446c347369765f4d88361

pkg/unet/unet.go
2911ffa72265a60830af352d29daf391f95784b0

pkg/control/server/server.go
fbb828ffd041888856eb6a2497f40db90b3c4d68
```

Also authoritative at the same commit:

```text
runsc/config/config.go
runsc/boot/network.go
runsc/boot/controller.go
runsc/boot/loader.go
```

Intake mode:

```text
STUDY + MINIMUM BOUNDED REIMPLEMENTATION
```

No gVisor SDK/module dependency is authorized.

---

## 5. `NetworkNone` means loopback-only

At the pinned source, `config.NetworkNone` means netstack with loopback only.

The normal `setupNetwork` `NetworkNone` branch calls `createDefaultLoopbackInterface`, which sends only `LoopbackLinks` through `containerManager.SetNetworkArgs`.

Canonical loopback is purpose-equivalent to:

```text
name = lo
IPv4 = 127.0.0.1/8
IPv6 = ::1/128
loopback routes only
```

Therefore v1 deny-all means only:

```text
NO HOST-BACKED / EXTERNAL NON-LOOPBACK NETWORK AUTHORITY
WITH CANONICAL LOOPBACK PERMITTED
```

Any stronger claim is forbidden.

---

## 6. Physical attachment model

Pinned gVisor represents host-backed non-loopback netstack attachment through creation inputs including:

```text
FDBasedLinks
XDPLinks
```

Those paths carry host file-descriptor/XDP authority into the sandbox network stack.

The normal `NetworkNone` path provides canonical loopback and no such external-link inputs.

`Loader.run` applies the retained `CreateLinksAndRoutesArgs` through `ConfigureNetwork` during startup.

Thus the applied creation topology is a physical runtime fact about what host-backed network attachment was provisioned at creation, rather than only a Docker configuration wish.

---

## 7. `GetNetworkConfig` is retained creation topology, not a live NIC table

Pinned:

```text
containerManager.GetNetworkConfig
```

returns the loader's retained network arguments described by gVisor as the interfaces/routes applied during root-container creation.

It does **not** directly enumerate the current netstack interface table.

R3G-C must never describe it as:

```text
live NIC snapshot
current kernel/netstack enumeration
independent proof that trusted root never mutated networking
```

This limitation is a first-class part of the theorem.

---

## 8. Source-level retained-topology race

The pinned source contains a real concurrency window that this authorization must not hide.

`containerManager.SetNetworkArgs`:

1. reads loader state under `l.mu`;
2. releases `l.mu`;
3. prepares/duplicates supplied FDs;
4. reacquires `l.mu`;
5. writes `l.networkArgs`.

Separately, `Loader.run` can:

1. read/apply the then-current `l.networkArgs` through `ConfigureNetwork`;
2. later set loader state to `started`.

Therefore this unsafe sequence is source-possible if the trusted host permits concurrent control calls:

```text
A. host-backed network args exist
B. Loader.run applies them
C. another SetNetworkArgs call had already passed its pre-start state check
D. that delayed call later overwrites retained l.networkArgs with loopback-only args
E. GetNetworkConfig later returns loopback-only retained args
F. retained args no longer identify what was actually applied
```

R3E instance and socket identity brackets do not detect this race.

So the following inference is explicitly rejected:

```text
GetNetworkConfig == loopback-only
=> applied topology was necessarily loopback-only
```

unless the trusted-host creation serialization invariant in §9 is independently satisfied.

---

## 9. Trusted-host creation serialization invariant

This invariant is mandatory and is part of the admitted R3G-C v1 trust theorem.

For the exact bound sandbox, the trusted host/runtime must guarantee all of the following:

```text
S1. exactly one authorized creation-network setup operation supplies the root sandbox network args;

S2. that authorized containerManager.SetNetworkArgs call completes successfully before Loader.run / RootContainerStart is permitted to consume l.networkArgs;

S3. when the authorized creation SetNetworkArgs call returns, no other SetNetworkArgs call for the sandbox is in flight;

S4. after that return, no SetNetworkArgs call may begin before completion of the R3G-C observation bracket;

S5. no Network.CreateLinksAndRoutes call, or any equivalent network mutation RPC/control action, may occur from the completion of the authorized creation SetNetworkArgs through completion of the R3G-C observation bracket;

S6. the trusted host enforces S1-S5 outside the R3G-C observer; the observer does not pretend to observe or create this serialization authority.
```

If S1-S6 cannot be established as an admitted runtime invariant for the deployed v1 integration, R3G-C is unavailable and fails closed.

This is not optional documentation language; it is part of the proof precondition.

---

## 10. Why the normal pinned runsc path supports the serialization invariant

Pinned `Sandbox.StartRoot()` performs the normal root-start path synchronously:

```text
setupNetwork(...)
then
containerManager.RootContainerStart
```

For `NetworkNone`, `setupNetwork()` synchronously calls the creation `containerManager.SetNetworkArgs` and returns only after that RPC succeeds.

Therefore the normal single-owner runsc start path has an operable ordering point:

```text
creation SetNetworkArgs completed
BEFORE
RootContainerStart / Loader.run
```

R3G-C v1 admits only deployments where the trusted host preserves that single-owner serialization and prohibits competing network-control RPCs described in §9.

The source ordering supports the invariant; it does not by itself prove that an arbitrary malicious root client cannot violate it.

---

## 11. Wider gVisor control service means post-start immutability is not intrinsic

Pinned controller registration exposes a wider `Network` service in addition to `containerManager`.

Mutation-capable methods include purpose-equivalent:

```text
Network.CreateLinksAndRoutes
```

Also, `SetNetworkArgs` refusing ordinary calls after `started` does not close the delayed-pre-start-call race in §8.

Therefore R3G-C does **not** claim intrinsic network immutability after start.

It claims only the bounded theorem under the trusted-host serialization/no-mutation invariant.

A compromised root host, deliberately competing control client, or administrator violating §9 invalidates the theorem.

---

## 12. Exact R3G-C read authority

The future observer may invoke only:

```text
containerManager.GetNetworkConfig
```

It must be structurally incapable of invoking:

```text
containerManager.SetNetworkArgs
Network.CreateLinksAndRoutes
any other gVisor control method
```

Forbidden production abstractions include:

```text
rpc(method, args)
call(method, args)
generic gVisor client
arbitrary method strings
arbitrary request JSON
FD donation API
raw arbitrary Unix-socket connector
```

Any second gVisor RPC method requires new authorization.

---

## 13. Minimal uRPC transport

Pinned `pkg/control/server/server.go` creates the control socket with:

```text
unet.Bind(addr, false)
```

and pinned `pkg/unet/unet.go` maps `packet=false` to Unix `SOCK_STREAM`.

Pinned `pkg/urpc/urpc.go` carries JSON request/result envelopes over that Unix stream.

R3G-C may reimplement only the exact transport needed for the fixed request purpose-equivalent to:

```json
{"method":"containerManager.GetNetworkConfig","arg":{}}
```

Requirements:

- Node standard-library Unix stream primitives only;
- one fixed request shape;
- no shell/helper process solely for uRPC;
- no gVisor dependency;
- finite connect/global deadlines;
- bounded response bytes, depth, nodes, strings, lists;
- duplicate-key, malformed, ambiguous and trailing JSON rejection;
- remote-error rejection;
- owned socket destruction on timeout/cancellation;
- late bytes can never become success.

If the exact pinned wire contract cannot be implemented with those properties, stop and return to authorization.

---

## 14. Exact control endpoint v1

Pinned gVisor names the sandbox control socket purpose-equivalent to:

```text
runsc-<sandboxID>.sock
```

Pinned root-container creation makes root container ID equal sandbox ID.

R3E/R3F already bind one exact full container ID and trusted immutable `runtimeRoot`.

R3G-C v1 authorizes exactly:

```text
<trusted runtimeRoot>/runsc-<exact full container ID>.sock
```

No search/fallback is authorized.

Even though gVisor may itself fall back to other directories when creating a control socket, R3G-C v1 rejects those cases.

Forbidden fallback/discovery:

```text
/var/run
/run
/tmp
environment override
filesystem scan
/proc socket scan
caller-supplied path
```

Missing trusted-runtimeRoot endpoint => fail closed.

This is a security compatibility boundary, not a usage quota.

---

## 15. Endpoint parent authority and identity

Before connect, R3G-C must:

1. derive basename only from the validated full container ID;
2. join it only to the trusted R3E runtimeRoot;
3. reject traversal/NUL/relative/alternate paths;
4. prove the required runtimeRoot parent chain trusted-host-owned and not workload-writable under the admitted Linux v1 theorem;
5. `lstat` the final path without following a final symlink;
6. require a Unix socket;
7. bind at minimum device/inode/uid/gid/mode;
8. re-`lstat` around every authorized RPC;
9. require exact endpoint identity stability across the observation bracket.

The endpoint identity is not a substitute for R3E runsc executable/process identity.

---

## 16. Exact subject binding

R3G-C must reuse the canonical R3E/R3F subject and must not invent a new resolver.

It binds purpose-equivalent:

```text
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
full containerId
runtimeInstanceIdentity
runscArtifactIdentity
state/process identity
```

The public R3G-C call accepts no raw container ID, PID, runtimeRoot or socket path.

Any mismatch fails closed.

---

## 17. Required observation race bracket

Purpose-equivalent sequence:

```text
A. validate canonical deny-all requirement
B. obtain fresh exact-subject R3F E2 snapshot
C. establish R3E exact-instance observation #1
D. validate trusted runtimeRoot parent authority
E. snapshot control endpoint #1
F. fixed GetNetworkConfig read #1
G. snapshot endpoint #2; require exact stability
H. fixed GetNetworkConfig read #2
I. snapshot endpoint #3; require exact stability
J. establish R3E exact-instance observation #2
K. require exact R3E instance equality across C..J
L. strictly normalize both topology reads and require exact topology identity equality
M. require the canonical loopback-only topology
N. require the admitted §9 serialization invariant as a trusted-runtime precondition
O. build the pure R3G-C candidate record
P. durably commit it
Q. validate exact commit acknowledgment
```

No step may be silently skipped.

Runtime exit/restart, PID/start-time/executable change, state drift, endpoint replacement, topology mismatch, timeout or cancellation fails the complete observation.

The bracket observes runtime/endpoint/topology stability; it does **not** magically observe trusted-host serialization. §9 remains an explicit external trust precondition.

---

## 18. Exact accepted topology v1

After strict bounded normalization, accept only:

```text
LoopbackLinks:
  exactly one canonical default loopback link

FDBasedLinks:
  exactly zero

XDPLinks:
  exactly zero

Defaultv4Gateway:
  empty / no external gateway

Defaultv6Gateway:
  empty / no external gateway

host-backed file payload:
  none for the accepted topology
```

The loopback object may contain only the exact pinned identity-relevant loopback name, addresses and routes plus explicitly admitted non-authority tuning fields.

Any non-loopback address/link/route/neighbor, default/external gateway, external-link descriptor, or unknown authority-bearing field fails closed.

No authority-bearing field may be normalized away as diagnostic.

---

## 19. R3F conjunction remains mandatory

A fresh exact-subject R3F snapshot must still prove purpose-equivalent:

```text
HostConfig.NetworkMode == "none"
no Docker network attachment
```

If Docker E2 and gVisor topology disagree, R3G-C fails closed.

R3G-C may improve the physical-network candidate quality; it does not relabel R3F itself as E3/E4.

---

## 20. Forbidden proof shortcuts

None of these can satisfy R3G-C:

```text
Docker NetworkMode alone
Docker labels
OCI annotations
runsc command-line flag alone
guest dmesg
guest ip/route/proc output
application self-report
DNS failure
failed Internet/LAN connection
firewall timeout
absence of observed traffic
```

Failure to communicate is not proof of absence of authority.

---

## 21. No active network probe

R3G-C must not attempt Internet, LAN, DNS, metadata-service, loopback-service or synthetic remote connections to prove isolation.

The proof remains deterministic, local-first, offline-capable and independent of external availability.

---

## 22. Explicit local-communication non-claims

R3G-C does not prove absence of:

```text
loopback TCP/UDP
Unix-domain sockets
filesystem-exposed host UDS policy
pipes
shared-memory IPC
other local-only communication
```

Those are separate policy surfaces.

---

## 23. Candidate record only

The implementation may define a pure record purpose-equivalent to:

```text
kodac-h4-r3g-c-gvisor-network-v1
```

It must bind at minimum:

```text
version
evidenceClass = e3-physical-network-candidate
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
runscArtifactIdentity
controlEndpointIdentity
networkTopologyIdentity
networkObserverImplementationIdentity
networkPolicy = deny-all-non-loopback
trustedHostSerializationTheoremVersion
recordIdentity
```

`networkTopologyIdentity` deterministically binds every accepted identity-relevant topology field.

`recordIdentity` is rederived from canonical record bytes/facts.

The record must not be structurally assignable to canonical R3B `SandboxBackendObservation` or `SandboxExecutionEvidence`.

---

## 24. Durable put / replay semantics

Reuse the canonical trusted-store rules:

```text
FIRST EXACT PUT:
persist exact canonical bytes

SAME recordIdentity + SAME bytes:
idempotent success / one logical record

SAME recordIdentity + DIFFERENT bytes:
integrity violation / fail closed
```

Lost/timeout/cancelled acknowledgment remains failed.

Late completion cannot upgrade the failed invocation.

A later invocation gets a fresh execution-attempt identity and repeats R3F/R3E/R3G-C from the beginning.

No blind same-invocation retry.

---

## 25. Bounds, deadline and cancellation

Trusted immutable configuration must provide finite safety bounds for:

```text
global monotonic observation deadline
connect timeout
response bytes
JSON depth/nodes/string length/list cardinality
```

They are safety bounds for one fixed protocol object, not product quotas.

R3G-C adds no daily/hourly limit, queue, vendor dependency or external network dependency.

Timeout/cancellation must close the owned Unix stream, settle owned async work before terminal failure, discard partial/late bytes, and never mutate the target sandbox.

---

## 26. Production authority restrictions

Production R3G-C must contain no reachable path capable of:

```text
Docker POST/PUT/DELETE
containerd mutation
runsc create/start/exec/kill/delete
containerManager.SetNetworkArgs
Network.CreateLinksAndRoutes
any arbitrary gVisor RPC
arbitrary Unix-socket connect
mount
setns / namespace entry
ptrace
sudo / privilege escalation
host filesystem scan
/proc-wide process/socket scan
```

The one derived endpoint and one fixed `GetNetworkConfig` method are the entire new observation surface.

Any wider need returns to authorization.

---

## 27. Proposed implementation shape

If this document becomes canonical, prefer one focused module purpose-equivalent to:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
```

plus focused tests and the minimum existing K2 `ExecutionGateway` wiring.

Do not create:

```text
daemon
background monitor
generic gVisor library
network scanner
generic arbitrary Unix-socket request utility
new external service dependency
```

---

## 28. Required hostile proofs

The future implementation must prove at minimum:

1. canonical loopback-only topology passes;
2. any `FDBasedLink` fails;
3. any `XDPLink` fails;
4. any non-loopback link/address/route/neighbor fails;
5. any external/default gateway fails;
6. malformed/duplicate/trailing/oversized/deep uRPC JSON fails;
7. remote uRPC error fails;
8. absent runtimeRoot-local socket fails;
9. `/tmp`, `/run`, `/var/run` fallback-only socket still fails;
10. symlink/non-socket/untrusted-parent endpoint fails;
11. endpoint identity replacement during bracket fails;
12. caller cannot select container ID/PID/runtimeRoot/socket/method;
13. production code cannot call `SetNetworkArgs`;
14. production code cannot call `Network.CreateLinksAndRoutes`;
15. production code exposes no generic gVisor RPC client;
16. R3F network-mode mismatch fails;
17. R3E runtime-instance change fails;
18. topology read #1/#2 mismatch fails;
19. timeout/cancellation closes owned stream and remains failure;
20. late response cannot become evidence;
21. same-record exact replay is idempotent;
22. same-record conflicting bytes fail closed;
23. lost acknowledgment requires a fresh later invocation;
24. no R3B observation/evidence constructor is invoked;
25. tests/documentation explicitly model §8's delayed-pre-start `SetNetworkArgs` race as unsafe unless §9 serialization is admitted;
26. a malicious trusted-host mutation is stated as outside the theorem rather than falsely claimed detectable by R3G-C.

---

## 29. Pre-implementation authorization gate

Even if this docs-only authorization becomes canonical, implementation must not start unless the founder separately authorizes the implementation slice.

Before implementation, the executor must verify:

```text
this exact authorization is canonical on main
no later canonical document narrows/revokes it
R3E/R3F/R3G-A/R3G-B remain canonical predecessors
trusted-host deployment can satisfy §9 serialization
```

If §9 cannot be operationally guaranteed in the actual Docker/runsc integration, implementation is BLOCKED and must return to theorem design.

---

## 30. CI and platform posture

The future observer is Linux-only at runtime but repository-safe across supported CI platforms.

Required applicable gates include canonical:

```text
typecheck
full tests
governance
provenance/change classification
Ubuntu
macOS
Windows
K2 runtime gate
K3-R4 regression
K3-R5 regression where canonically applicable
```

Generic CI must not require public Internet or a developer's live Docker/gVisor installation.

---

## 31. Evidence-ledger discipline

The R3G-C evidence ledger remains absent until the exact pre-ledger implementation head passes:

- all required technical gates;
- manual architecture/trust/security review;
- fresh external exact-head review;
- zero unresolved actionable review findings.

Only then may a dedicated ledger-only commit be added.

Fresh post-ledger certification is mandatory.

No R3G-C proven claim may be emitted before canonical implementation merge and required post-merge quality certification.

---

## 32. Manual architecture / trust / security questions

Before implementation ledger creation, reviewers must answer **NO** to every unsafe proposition:

```text
Can a caller choose containerId, PID, runtimeRoot or socket path?
Can a caller choose the uRPC method/body?
Can production R3G-C reach SetNetworkArgs?
Can production R3G-C reach Network.CreateLinksAndRoutes?
Can R3G-C connect to arbitrary Unix sockets?
Can it fall back to /tmp or scan the host?
Can Docker NetworkMode alone satisfy the theorem?
Can guest/app self-report satisfy it?
Can failed outbound probes satisfy it?
Can non-loopback authority be normalized away?
Can endpoint replacement be accepted?
Can runtime-instance replacement be accepted?
Can late timeout/cancel bytes become evidence?
Can R3G-C mint canonical R3B evidence directly?
Can GetNetworkConfig be described as direct live NIC enumeration?
Can the §8 retained-topology race be ignored?
Can §9 serialization be inferred merely from observing loopback-only retained args?
Can the claim survive a trusted-host violation of §9?
Can the claim be interpreted as no loopback, sockets or local IPC?
```

Any `YES` blocks acceptance.

---

## 33. Candidate completion claim

Only after:

1. this authorization becomes canonical;
2. implementation is separately authorized;
3. the actual deployment satisfies §9;
4. the implementation passes pre-ledger gates;
5. its ledger-only transition and fresh post-ledger certification pass;
6. implementation merges to canonical `main`; and
7. required post-merge quality certification passes on the exact merge commit;

may Kodac emit:

```text
KODAC_LINUX_GVISOR_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_PROVEN
```

Meaning only:

> Under Kodac's admitted trusted-host v1 serialization theorem, one exact running Linux gVisor root sandbox was bound to the canonical R3E/R3F subject; the normal creation network setup was serialized before root start with no competing/mutating trusted-host network control through the observation bracket; the retained physically-applied creation topology was read twice through one fixed trusted runtimeRoot-local `GetNetworkConfig` Unix-stream RPC, remained bound to the same runtime instance and endpoint, and contained canonical loopback only with no host-backed non-loopback attachment.

It does not mean:

```text
malicious-host resistance
direct live NIC-table measurement
no loopback
no sockets
no local IPC
R3B complete
TTL/output/credential proof
later R3G slices proven
H4 complete
external-process ask enabled
```

---

## 34. Authorization boundary

This PR itself remains docs-only.

It must contain no:

```text
production source change
test source change
schema change
workflow change
dependency/lockfile change
evidence ledger
```

If review determines that §9 cannot close the retained-topology race for the actual admitted deployment, the correct outcome is to reject or redesign R3G-C—not to weaken or overstate the physical claim.
