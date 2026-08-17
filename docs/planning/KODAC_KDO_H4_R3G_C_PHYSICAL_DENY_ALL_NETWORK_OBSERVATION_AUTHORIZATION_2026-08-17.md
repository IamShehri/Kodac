# KDO-H4-R3G-C — gVisor Physical Deny-All Network Observation Authorization

Date: 2026-08-17
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `2197bc9fa98ff236c2d3d0aa3f5614dfafdfdd29`
Canonical base tree: `e9496d2a01e7b8548a82a9a373044c1b6c2bf986`
Predecessors: canonical/proven H4-R3E, H4-R3F, H4-R3G-A, and H4-R3G-B

## 1. Decision

```text
GATE:
KDO-H4-R3G-C

NAME:
GVISOR PHYSICAL DENY-ALL NETWORK OBSERVATION

CHANGE CLASS OF THIS PR:
DOCS-ONLY AUTHORIZATION

IMPLEMENTATION IN THIS PR:
NONE

AUTHORIZED FUTURE IMPLEMENTATION CLASS IF THIS DOCUMENT BECOMES CANONICAL:
BOUNDED LINUX-ONLY READ-ONLY TRUSTED-HOST OBSERVER

CALLER-SUPPLIED CONTAINER ID:
FORBIDDEN

CALLER-SUPPLIED RUNTIME ROOT:
FORBIDDEN

CALLER-SUPPLIED CONTROL SOCKET PATH:
FORBIDDEN

GUEST EXEC / SHELL / SELF-REPORT:
FORBIDDEN

NAMESPACE ENTRY:
FORBIDDEN

DOCKER / CONTAINERD MUTATION:
FORBIDDEN

GVISOR CONTROL-PLANE MUTATION RPC:
FORBIDDEN

GENERIC URPC CLIENT SURFACE:
FORBIDDEN

R3B OBSERVATION / EXECUTION EVIDENCE MINTING:
NOT AUTHORIZED BY R3G-C

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO
```

R3G-C authorizes only the smallest independent physical-network theorem required by the canonical R3G split:

> For one exact running gVisor execution instance already bound by R3E/R3F, Kodac may prove that the gVisor network topology physically applied to the root sandbox contains only canonical loopback networking and contains no host-backed non-loopback network attachment under the admitted v1 theorem.

This is **not** a theorem that the sandbox has “no networking whatsoever”.

The bounded theorem is:

```text
R3F E2 Docker NetworkMode=none / empty Docker network attachment snapshot
+ R3E exact running gVisor instance binding
+ exact trusted runtimeRoot-local sandbox control endpoint
+ fixed read-only gVisor GetNetworkConfig uRPC
+ canonical loopback-only applied topology
+ zero FDBasedLinks
+ zero XDPLinks
+ zero external/default gateway authority
+ exact-instance race bracket
= E3 PHYSICAL DENY-ALL NETWORK CANDIDATE
```

and explicitly:

```text
!= no loopback
!= no sockets
!= no AF_UNIX / local IPC
!= no in-sandbox network syscalls
!= no guest-created purely internal virtual networking state
!= proof against a compromised trusted host/root control plane
!= R3B final backend observation
!= R3B execution evidence
```

---

## 2. Canonical predecessor truth

Canonical `main` at this authorization base is:

```text
2197bc9fa98ff236c2d3d0aa3f5614dfafdfdd29
```

R3E already proves exact-instance gVisor runtime-lineage binding through a same-artifact runsc/process bracket.

R3F already proves only E2 Docker control-plane facts, including:

```text
HostConfig.Runtime == "runsc"
HostConfig.NetworkMode == "none"
NetworkSettings.Networks == {}
```

R3F explicitly states that those E2 network facts do not physically prove the exact execution instance has no non-loopback authority.

R3G-A separately proves bounded cgroup-v2 resource facts.

R3G-B separately proves immutable OCI source/rootfs physical lineage.

R3G-C MUST NOT reinterpret any predecessor proof beyond its canonical claim.

---

## 3. Canonical split requirement

The canonical R3G split defers R3G-C until a runtime-specific trusted-host surface and race bracket are independently chosen.

Its target fact is exactly:

```text
exact running gVisor execution instance
has no non-loopback network authority
under the admitted v1 theorem
```

R3G-C MUST NOT rely on:

```text
guest dmesg
application self-report
Docker labels
Docker NetworkMode alone
```

This authorization resolves the deferred surface and bracket without broadening K2 into a generic host-inspection or runtime-control API.

---

## 4. Exact gVisor source pin

R3G-C is grounded in this immutable upstream source:

```text
repository:
google/gvisor

commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

Primary pinned implementation references include:

```text
runsc/config/config.go

runsc/sandbox/network.go
blob 989bb242a18cbcc6e4da26d17a8edbf7a19fcdfb

runsc/boot/network.go

runsc/boot/controller.go

runsc/boot/loader.go

runsc/sandbox/sandbox.go
blob 70724a90adae59759b489b13e50942588c61ea70

runsc/container/container.go
blob 5ea716990eacbd5511bcc75f4661817900577211

pkg/urpc/urpc.go
blob 2a3fb90ee8edc068e4d446c347369765f4d88361
```

Intake mode:

```text
STUDY + REIMPLEMENT THE MINIMUM BOUNDED CLIENT CONTRACT
```

No gVisor source is copied wholesale and no gVisor SDK/module dependency is authorized.

---

## 5. `NetworkNone` means loopback-only, not zero networking

At the pinned source, `config.NetworkNone` is defined as setting up netstack with loopback only.

The pinned `runsc/sandbox/network.go` path states that when network is disabled it skips local host network configuration and creates the default loopback interface only.

The default loopback topology includes purpose-equivalent canonical loopback state:

```text
interface:
lo

IPv4:
127.0.0.1/8

IPv6:
::1/128

loopback routes only
```

Therefore R3G-C uses this precise deny-all meaning:

```text
DENY-ALL NETWORK v1
=
NO HOST-BACKED / EXTERNAL NON-LOOPBACK NETWORK ATTACHMENT
WITH CANONICAL LOOPBACK PERMITTED
```

Any claim stronger than that is forbidden.

---

## 6. Why this is physical rather than Docker-config-only

Pinned gVisor source does not merely retain a desired flag.

For netstack, non-loopback links are materialized through the boot network contract as host-backed link inputs, including:

```text
FDBasedLinks
XDPLinks
```

Those paths consume host-supplied file-descriptor/XDP authority to connect the sandbox network stack to non-loopback host networking.

By contrast, the pinned `NetworkNone` setup sends only the default loopback link and no external link payload.

The loader later applies the retained `CreateLinksAndRoutesArgs` to the sandbox netstack during startup.

Therefore an exact applied root-network configuration containing only canonical loopback and zero external-link inputs is a runtime/physical fact about how the sandbox was attached, not merely a Docker wish.

---

## 7. Post-start topology argument is immutable under the admitted host-control theorem

Pinned `containerManager.SetNetworkArgs` rejects nil input and, critically, ignores calls after the sandbox reaches started/restored/restoring-started state.

The loader applies the stored network arguments as part of startup.

Pinned `containerManager.GetNetworkConfig` returns the network interfaces/routes applied during creation of the root container from that live loader state.

R3G-C therefore admits the following bounded theorem:

```text
started exact sandbox
+ retained applied root network args
+ SetNetworkArgs ignored after start
+ zero host-backed external link inputs in those args
= no host-backed non-loopback attachment was provisioned to that running sandbox
```

This theorem assumes the already-admitted trusted host/root control plane is not malicious.

R3G-C does not claim Byzantine verification against root replacing the runtime, memory, kernel, or trusted control socket.

---

## 8. Exact live read surface: one gVisor uRPC method

Pinned `sandbox.Sandbox.GetNetworkConfig()` connects to the live sandbox control socket and invokes:

```text
containerManager.GetNetworkConfig
```

R3G-C authorizes only that one exact method.

The implementation MUST NOT expose:

```text
rpc(method, args)
call(method, args)
rawControlSocket()
generic gVisor client
arbitrary method strings
arbitrary JSON bodies
arbitrary FD donation
```

No other registered gVisor control method is authorized.

In particular R3G-C must be structurally incapable of invoking control methods that mount, signal, mutate networking, create links, alter logging, or otherwise change the sandbox.

---

## 9. Minimal uRPC transport; no new gVisor dependency

Pinned `pkg/urpc/urpc.go` defines the request/result envelope as JSON over a Unix-domain socket.

R3G-C may reimplement only the exact fixed transport needed for:

```text
method = "containerManager.GetNetworkConfig"
arg = {}
```

The client MUST:

- use Node standard-library Unix-domain socket primitives only;
- emit exactly one fixed request shape;
- accept exactly one bounded response object;
- use no shell;
- spawn no additional runtime helper solely for uRPC;
- add no gVisor Go module/SDK dependency;
- add no generic RPC abstraction;
- apply strict byte/time/depth/node bounds;
- reject malformed, duplicate-key, ambiguous or trailing payloads;
- reject unsuccessful/remote-error responses;
- destroy the owned socket operation on timeout/cancellation;
- never turn a late response into success.

If the exact pinned uRPC wire contract cannot be implemented without broadening authority, the implementation slice must stop and return to authorization review.

---

## 10. Exact control endpoint rule

Pinned gVisor names the sandbox control socket purpose-equivalent to:

```text
runsc-<sandboxID>.sock
```

Pinned container creation establishes that for a root container the root container ID and sandbox ID are the same.

R3E/R3F already bind Kodac to one exact full container ID and one exact trusted `runtimeRoot`.

R3G-C v1 therefore authorizes exactly one endpoint candidate:

```text
<trusted runtimeRoot>/runsc-<exact full container ID>.sock
```

No fallback search is authorized.

Even though pinned gVisor itself may fall back to `/var/run`, `/run`, or `/tmp` when creating its control socket, **R3G-C v1 deliberately does not follow those fallbacks**.

If the exact trusted-runtimeRoot endpoint does not exist, R3G-C is unavailable and fails closed.

This is a security compatibility boundary, not an artificial usage quota.

---

## 11. Endpoint identity and path safety

Before connecting, R3G-C must establish a bounded trusted-host endpoint snapshot.

At minimum it must:

1. derive the basename from the validated full container ID only;
2. join it to the already trusted immutable R3E `runtimeRoot` only;
3. reject traversal, NUL, relative or alternate paths;
4. `lstat` the exact endpoint without following a final-component symlink;
5. require a Unix socket;
6. snapshot canonical endpoint identity at minimum:
   - device;
   - inode;
   - uid;
   - gid;
   - mode;
7. re-`lstat` before and after every authorized uRPC exchange;
8. require exact endpoint identity stability across the whole observation bracket.

No caller/model/plugin/MCP/environment variable may select or override the endpoint.

R3G-C does not claim this proves the sandbox binary from the socket alone. R3E's same-FD runsc/process theorem remains authoritative for runtime-process identity.

---

## 12. Exact-instance binding remains R3E authority

R3G-C MUST NOT invent a second subject resolver.

The network observation must be bound to the same exact subject already established by R3E/R3F:

```text
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
full containerId
runtimeInstanceIdentity
runsc artifact identity
state PID / process identity
```

The public R3G-C call MUST NOT accept a raw `containerId`, PID, runtime root, or socket path.

Any mismatch with the exact R3E subject fails closed.

---

## 13. Required race bracket

R3G-C must observe the network topology inside an exact R3E runtime-instance bracket.

Purpose-equivalent required sequence:

```text
A. validate canonical requirement / deny-all network requirement
B. resolve exact R3F E2 Docker subject and snapshot
C. establish R3E state/process exact-instance observation #1
D. snapshot exact runtimeRoot-local control endpoint #1
E. fixed GetNetworkConfig read #1
F. snapshot endpoint #2; require identity stability
G. fixed GetNetworkConfig read #2
H. snapshot endpoint #3; require identity stability
I. establish R3E state/process exact-instance observation #2
J. require R3E instance identity equality across C..I
K. require network read #1 and #2 normalize to exactly the same identity
L. require the canonical loopback-only theorem
M. build the R3G-C candidate record
N. durably commit that record
O. validate exact commit acknowledgment
```

No step may be silently skipped.

If the runtime exits, restarts, changes PID/start-time/executable identity, changes exact state identity, changes endpoint identity, times out, or cancels anywhere in the bracket, the whole observation fails.

---

## 14. Exact accepted network topology v1

After strict normalization, R3G-C accepts only a topology equivalent to:

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
  none
```

The loopback link must have exactly the pinned canonical identity-relevant semantics, including:

```text
name = lo
IPv4 loopback address/prefix only
IPv6 loopback address/prefix only
loopback routes only
no non-loopback neighbor authority
```

Implementation-specific tuning fields that do not add external authority may be admitted only if this authorization names them explicitly during implementation review; they must not silently become ignored authority.

Unknown/additional authority-bearing fields fail closed.

---

## 15. No “absence by omission” shortcuts

The following are insufficient individually or collectively without the exact gVisor topology read:

```text
Docker NetworkMode=none
Docker NetworkSettings.Networks={}
container labels
OCI annotations
runsc command-line configuration alone
absence of successful outbound test traffic
timeouts to public IPs
DNS failure
guest route command
guest ip addr output
guest /proc/net output
application self-report
```

R3G-C proves the bounded physical attachment theorem from trusted host/runtime state, not from a workload's inability or claim.

---

## 16. No active network probe

R3G-C MUST NOT establish its theorem by attempting outbound connections to the Internet, LAN, DNS, metadata services, loopback services, or test endpoints.

Reasons:

- active probes are environment-dependent;
- failure to connect is not proof of absence of authority;
- probes create unwanted side effects;
- external availability would become a hidden dependency/bottleneck.

The proof remains deterministic and local-first.

---

## 17. Host-UDS / local IPC non-claim

This slice concerns the canonical R3G-C phrase:

```text
no non-loopback network authority
```

It does not prove absence of:

```text
Unix-domain sockets exposed through filesystem policy
shared-memory IPC
pipes
loopback-only TCP/UDP
other local-only communication mechanisms
```

Those are separate policy surfaces and must not be folded into the R3G-C claim.

---

## 18. Bounded physical network candidate record

R3G-C may define one durable pure record version purpose-equivalent to:

```text
kodac-h4-r3g-c-gvisor-network-v1
```

The record must bind at minimum:

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
recordIdentity
```

`networkTopologyIdentity` must deterministically bind every accepted identity-relevant topology field.

`recordIdentity` must be rederived from the exact canonical record bytes/facts.

The record MUST NOT be structurally assignable to canonical R3B `SandboxBackendObservation` or `SandboxExecutionEvidence`.

---

## 19. Durable put / replay semantics

R3G-C must reuse the canonical trusted-store semantics already established by the R3G family:

```text
FIRST EXACT PUT:
persist exact canonical bytes

SAME recordIdentity + SAME bytes:
idempotent success / one logical record

SAME recordIdentity + DIFFERENT bytes:
integrity violation / fail closed
```

A lost/timeout/cancelled acknowledgment remains a failed invocation.

No late completion may upgrade that invocation to success.

A later invocation must create a fresh execution-attempt identity and freshly repeat all R3F/R3E/R3G-C observations from the beginning.

No blind same-invocation retry is authorized.

---

## 20. Bounds and deadlines

R3G-C must remain non-blocking by construction.

It must use finite trusted configuration for:

```text
global monotonic observation deadline
connect timeout
uRPC response byte ceiling
JSON depth ceiling
JSON node ceiling
maximum canonical field/list cardinalities
```

These are safety/resource bounds, not product usage quotas.

They must be high enough for the exact fixed v1 topology while remaining non-caller-raiseable.

R3G-C introduces no daily/hourly review limit, no queue, no vendor availability dependency, and no network call to an external service.

---

## 21. Cancellation and late-result rules

Cancellation or deadline expiry must:

1. destroy/close the owned Unix socket operation;
2. prevent any late bytes from becoming accepted evidence;
3. await/settle all owned async work before the observer reports terminal failure;
4. never mutate the target sandbox while cancelling.

A timed-out or cancelled observation cannot later become success.

---

## 22. Production authority restrictions

R3G-C MUST NOT add any production path capable of:

```text
Docker POST/PUT/DELETE
containerd mutation
runsc create/start/exec/kill/delete
runsc debug mutation
containerManager.SetNetworkArgs
Network.CreateLinksAndRoutes
mount
namespace entry
setns
ptrace
sudo
setuid/setgid escalation
arbitrary /proc scanning
arbitrary filesystem scanning
arbitrary Unix-socket connect
arbitrary gVisor uRPC method invocation
```

The one runtimeRoot-local fixed endpoint and one fixed `GetNetworkConfig` method are the entire new authority surface.

---

## 23. Proposed implementation shape

If this authorization becomes canonical, the implementation slice should prefer one focused module purpose-equivalent to:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
```

plus focused tests and only the minimum `ExecutionGateway`/trusted-runtime wiring required to invoke it under the existing K2 authority.

It must not create:

- a daemon;
- a background monitor;
- a generic gVisor client library;
- a network scanner;
- a reusable arbitrary Unix-socket request utility exposed to callers.

Any wider shape requires new authorization.

---

## 24. Required hostile tests

The future implementation must prove at minimum:

1. exact canonical loopback-only topology passes;
2. any FDBasedLink fails;
3. any XDPLink fails;
4. any non-loopback link/address/route/neighbor fails;
5. any non-empty external/default gateway fails;
6. malformed uRPC envelope fails;
7. remote uRPC error fails;
8. duplicate-key JSON fails;
9. trailing JSON/payload fails;
10. oversized response fails;
11. depth/node ceiling violation fails;
12. missing runtimeRoot-local control socket fails;
13. symlink/non-socket endpoint fails;
14. endpoint inode/device/uid/gid/mode replacement during bracket fails;
15. caller cannot supply/override container ID;
16. caller cannot supply/override runtime root;
17. caller cannot supply/override control socket path;
18. caller cannot select uRPC method;
19. no fallback to `/tmp`, `/run`, `/var/run`, environment or filesystem scan occurs;
20. R3F `NetworkMode != none` fails before physical candidate minting;
21. exact R3E runtime instance change across the network bracket fails;
22. network read #1/#2 normalized identity mismatch fails;
23. timeout closes owned socket and remains failure;
24. cancellation closes owned socket and remains failure;
25. late response after timeout/cancel cannot become success;
26. same-record same-bytes durable replay is idempotent;
27. same-record different-bytes conflict fails closed;
28. lost acknowledgment remains failed and a later invocation fully re-observes;
29. no R3B observation/evidence constructor is imported or invoked;
30. no generic gVisor RPC method is reachable from production R3G-C code.

---

## 25. CI / platform posture

R3G-C implementation is Linux-only at runtime but must remain build/test safe across repository platforms.

Required implementation certification must include the repository's canonical:

```text
typecheck
full tests
governance
provenance / change classification
Ubuntu
macOS
Windows
K2 runtime gate
K3-R4 regression
K3-R5 regression where canonically applicable
```

Linux physical behavior must be fixture/synthetic-host testable without requiring public Internet access or a developer's live Docker/gVisor installation in generic CI.

Any real-host certification must remain separate, explicit, reproducible, and non-claim-inflating.

---

## 26. Protected predecessor semantics

The future implementation must preserve all canonical predecessor boundaries.

In particular it MUST NOT silently modify the semantics of:

```text
R3E exact-instance binding
R3F Docker read-only control-plane provider
R3G-A cgroup-v2 physical resource observer
R3G-B immutable OCI source/rootfs physical lineage observer
canonical R3B observation/evidence types
```

If implementation requires a protected predecessor change outside the exact R3G-C integration seam, stop and authorize that change explicitly before mutation.

---

## 27. Pre-ledger / evidence-ledger discipline

The R3G-C implementation branch must keep its evidence ledger absent until the exact implementation head passes its pre-ledger gate.

Only after exact-head technical, architecture/trust/security, and fresh-review gates pass may the R3G-C evidence ledger be created.

The ledger transition must be a dedicated ledger-only commit with no implementation/test/schema/workflow/dependency changes.

Fresh post-ledger exact-head certification is mandatory.

No R3G-C proven claim may be emitted before canonical merge and required post-merge quality certification.

---

## 28. Manual architecture / trust / security review questions

Before the implementation ledger is created, reviewers must answer **NO** to all unsafe propositions below:

```text
Can the caller choose containerId, PID, runtimeRoot or control socket path?
Can the caller choose the uRPC method or arbitrary request body?
Can R3G-C connect to an arbitrary Unix socket?
Can R3G-C fall back to /tmp or scan the host for sockets?
Can Docker NetworkMode alone satisfy the physical theorem?
Can guest self-report satisfy the physical theorem?
Can active outbound probe failure satisfy the physical theorem?
Can a non-loopback FDBasedLink or XDPLink be normalized away?
Can a default/external gateway be ignored?
Can endpoint replacement inside the bracket be accepted?
Can runtime-instance replacement inside the bracket be accepted?
Can timeout/cancelled late bytes become evidence?
Can the observation mutate gVisor, Docker or containerd state?
Can the new code expose generic gVisor control authority?
Can R3G-C mint canonical R3B observation/evidence directly?
Can this claim be interpreted as no loopback, no sockets or no local IPC?
```

Any `YES` blocks acceptance.

---

## 29. Candidate completion claim

Only after:

1. this authorization becomes canonical;
2. a separately scoped implementation PR satisfies every required gate;
3. its evidence-ledger transition and post-ledger certification pass;
4. that implementation merges to canonical `main`; and
5. required post-merge quality certification passes on the exact merge commit;

may Kodac emit the bounded claim:

```text
KODAC_LINUX_GVISOR_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_PROVEN
```

Meaning only:

> Kodac can bind one exact running Linux gVisor sandbox to its trusted R3E/R3F subject, read the root sandbox's physically applied gVisor network configuration through one fixed runtimeRoot-local read-only control RPC, and prove under the admitted v1 trusted-host theorem that the sandbox was provisioned with canonical loopback only and no host-backed non-loopback network attachment.

It does not mean:

```text
R3B complete
full sandbox policy conjunction proven
no loopback
no sockets
no local IPC
TTL proven
output limits proven
credential policy proven
R3G-D+ proven
H4 complete
external-process ask enabled
```

---

## 30. Authorization boundary

This document authorizes no product implementation by itself until it is reviewed and becomes canonical.

This docs-only PR must not contain:

```text
production source changes
test source changes
schema changes
workflow changes
dependency changes
lockfile changes
evidence ledger
```

The only intended change in this authorization PR is this authorization document.

If review establishes that the pinned gVisor semantics, uRPC transport, runtimeRoot endpoint theorem, exact-instance bracket, or trust boundary is insufficient, the correct outcome is to revise or reject this authorization—not to weaken the physical claim.
