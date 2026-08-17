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

CALLER-SUPPLIED CONTAINER ID / PID / RUNTIME ROOT / SOCKET PATH:
FORBIDDEN

GUEST EXEC / SHELL / SELF-REPORT:
FORBIDDEN

NAMESPACE ENTRY / HOST NETWORK SCAN / ACTIVE OUTBOUND PROBE:
FORBIDDEN

DOCKER / CONTAINERD / GVISOR MUTATION:
FORBIDDEN

GENERIC GVISOR URPC CLIENT:
FORBIDDEN

R3B OBSERVATION OR EXECUTION-EVIDENCE MINTING:
NOT AUTHORIZED BY R3G-C

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO
```

R3G-C authorizes only the independent physical-network theorem named by the canonical R3G split.

The admitted v1 theorem is deliberately narrow:

> For one exact running gVisor root sandbox already bound by R3E/R3F, Kodac may prove—under the existing trusted-host theorem and an explicit no-post-start-host-network-mutation assumption—that the sandbox's physically applied creation topology is canonical loopback-only and that the running instance therefore has no host-backed non-loopback network authority.

This is **not** a theorem that the sandbox has “no networking whatsoever”.

The governing conjunction is:

```text
R3F E2 Docker deny-all snapshot
+ R3E exact running gVisor instance binding
+ trusted runtimeRoot-local sandbox control endpoint
+ fixed read-only GetNetworkConfig uRPC
+ physically applied root creation topology = canonical loopback only
+ zero FDBasedLinks
+ zero XDPLinks
+ zero external/default gateway authority
+ exact-instance + endpoint race bracket
+ admitted trusted-host no-post-start-network-mutation condition
= E3 PHYSICAL DENY-ALL NETWORK CANDIDATE
```

Explicit non-equivalences:

```text
!= no loopback
!= no sockets
!= no AF_UNIX / local IPC
!= no in-sandbox network syscalls
!= proof against a compromised host/root control plane
!= direct live NIC-table measurement
!= R3B final backend observation/evidence
```

---

## 2. Canonical predecessor truth

Canonical `main` at this authorization base is:

```text
2197bc9fa98ff236c2d3d0aa3f5614dfafdfdd29
```

R3E already proves exact-instance gVisor runtime-lineage binding through a same-artifact runsc/process bracket.

R3F proves only E2 Docker control-plane facts, including deny-all Docker network configuration. It explicitly does **not** promote Docker `NetworkMode=none` to physical network proof.

R3G-A and R3G-B separately prove bounded resource and immutable-source/rootfs facts. R3G-C MUST NOT reinterpret those claims.

---

## 3. Canonical split requirement

The canonical R3G split defines the R3G-C target fact as:

```text
exact running gVisor execution instance
has no non-loopback network authority
under the admitted v1 theorem
```

It explicitly rejects guest/application self-report, Docker labels, and Docker `NetworkMode` alone.

It also requires R3G-C to decide its runtime-specific trusted-host surface and race bracket before implementation.

This authorization supplies exactly those missing decisions.

---

## 4. Exact upstream source pin

All gVisor reasoning in this slice is pinned to:

```text
repository:
google/gvisor

commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

Primary references include:

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
STUDY + MINIMAL REIMPLEMENTATION
```

No gVisor SDK/module dependency is authorized.

---

## 5. `NetworkNone` means loopback-only

At the pinned source, `NetworkNone` means netstack with loopback only.

Pinned `runsc/sandbox/network.go` explicitly takes the `NetworkNone` branch by creating the default loopback interface rather than scraping local host interfaces.

The canonical default loopback semantics are purpose-equivalent to:

```text
name = lo
IPv4 = 127.0.0.1/8
IPv6 = ::1/128
loopback routes only
```

Therefore the R3G-C v1 deny-all meaning is:

```text
NO HOST-BACKED / EXTERNAL NON-LOOPBACK NETWORK AUTHORITY
WITH CANONICAL LOOPBACK PERMITTED
```

Any stronger interpretation is forbidden.

---

## 6. Why the topology is physical rather than declarative

Pinned gVisor netstack creates host-backed non-loopback attachments through boot network inputs including:

```text
FDBasedLinks
XDPLinks
```

Those paths require host-supplied file-descriptor/XDP authority to connect the sandbox stack to non-loopback host networking.

The `NetworkNone` creation path supplies only canonical loopback and no external link payload.

The loader applies the retained `CreateLinksAndRoutesArgs` to the root sandbox network stack during startup.

Thus the retained applied root creation topology describes what host-backed network attachment was physically provisioned to that sandbox at creation, not merely what Docker requested.

---

## 7. Critical source nuance: `GetNetworkConfig` is not a live NIC-table query

Pinned `containerManager.GetNetworkConfig` returns the network interfaces/routes applied during root-container creation from the loader's retained `networkArgs`.

It does **not** query the current netstack interface table at observation time.

That distinction is canonical for this authorization.

R3G-C MUST NOT describe `GetNetworkConfig` as:

```text
live kernel NIC snapshot
live netstack interface enumeration
proof that trusted root could never mutate networking
```

The physical candidate instead relies on the conjunction of:

1. physically applied creation topology;
2. exact current R3E instance continuity;
3. stable trusted endpoint identity;
4. the admitted trusted-host theorem in §9.

If reviewers require direct current netstack enumeration rather than this bounded theorem, R3G-C must return to authorization instead of claiming more than `GetNetworkConfig` provides.

---

## 8. `SetNetworkArgs` stability is useful but not absolute topology immutability

Pinned `containerManager.SetNetworkArgs` ignores calls after the sandbox reaches started/restored/restoring-started state.

That means the retained creation `networkArgs` cannot be replaced through that setter after start.

However, pinned controller registration also exposes a `Network` service on the host control server, and its wider methods include mutation-capable surfaces such as link/route creation.

Therefore this authorization **rejects** the earlier over-broad inference:

```text
SetNetworkArgs ignored after start
=> all sandbox networking is intrinsically immutable forever
```

That inference is false.

R3G-C is valid only under the explicit trusted-host condition below, and Kodac itself must possess no path to those mutation RPCs.

---

## 9. Admitted trusted-host no-mutation theorem

The hostile workload/model/plugin/MCP side is untrusted.

The existing K2 trusted host/root control plane remains trusted.

R3G-C v1 therefore admits this explicit condition:

```text
Between sandbox creation and completion of the R3G-C observation bracket,
no trusted-host actor invokes gVisor network mutation authority for the bound sandbox.
```

This is not inferred from the uRPC response; it is part of the existing trusted-host boundary.

Consequences:

- a compromised/malicious root host invalidates R3G-C;
- an administrator deliberately invoking gVisor network mutation invalidates R3G-C;
- Kodac must not expose any such mutation path;
- the hostile guest cannot satisfy or bypass this condition by self-report;
- the claim remains bounded to the admitted v1 host trust model.

The authorization must never market this assumption as independently observed Byzantine host integrity.

---

## 10. Exact read surface: one fixed live gVisor uRPC

Pinned `sandbox.Sandbox.GetNetworkConfig()` calls the live sandbox control server method:

```text
containerManager.GetNetworkConfig
```

R3G-C authorizes exactly that one method.

Production code MUST NOT expose:

```text
rpc(method, args)
call(method, args)
rawControlSocket()
generic gVisor client
arbitrary method string
arbitrary JSON request
FD donation API
```

The implementation must be structurally incapable of reaching:

```text
containerManager.SetNetworkArgs
Network.CreateLinksAndRoutes
mount/debug mutation
signal/lifecycle mutation
any other gVisor control method
```

Any need for another uRPC method requires new authorization.

---

## 11. Minimal uRPC transport; no helper or new dependency

Pinned `pkg/urpc/urpc.go` uses JSON request/result envelopes over a Unix-domain socket.

R3G-C may reimplement only the exact fixed transport needed for:

```json
{"method":"containerManager.GetNetworkConfig","arg":{}}
```

The implementation must:

- use Node standard-library Unix-socket primitives only;
- send one fixed request shape;
- accept one bounded result object;
- add no gVisor Go/SDK dependency;
- spawn no shell or generic helper solely for this RPC;
- enforce response byte, depth, node, string and list bounds;
- reject duplicate-key, malformed, ambiguous or trailing JSON;
- reject remote-error/unsuccessful results;
- destroy the owned connection on timeout/cancellation;
- prevent late bytes from becoming success.

If the pinned wire contract cannot be implemented narrowly with those properties, implementation stops and returns to authorization.

---

## 12. Exact control endpoint v1

Pinned gVisor names the sandbox control socket:

```text
runsc-<sandboxID>.sock
```

Pinned root-container creation establishes that the root container ID and sandbox ID are the same.

R3E/R3F already bind one exact full container ID and one immutable trusted `runtimeRoot`.

R3G-C v1 authorizes exactly:

```text
<trusted runtimeRoot>/runsc-<exact full container ID>.sock
```

No search or fallback is authorized.

Although gVisor itself may choose fallback directories if its root-dir socket cannot be created, R3G-C v1 deliberately rejects those cases.

Specifically, R3G-C MUST NOT search or fall back to:

```text
/var/run
/run
/tmp
caller environment
filesystem scan
/proc socket scan
```

If the exact trusted-runtimeRoot endpoint is unavailable, R3G-C fails closed.

This is a security compatibility boundary, not a Kodac usage quota.

---

## 13. Endpoint and parent authority

The implementation must derive the endpoint from trusted immutable inputs only and establish endpoint authority before connect.

At minimum it must:

1. derive the basename from the validated full container ID;
2. join it only to the trusted R3E `runtimeRoot`;
3. reject traversal, NUL, relative or alternate paths;
4. verify the runtimeRoot/required parent chain is trusted-host-owned and not workload-writable under the admitted Linux v1 policy;
5. `lstat` the final path without following a final-component symlink;
6. require a Unix socket;
7. snapshot canonical device/inode/uid/gid/mode;
8. re-`lstat` before and after each RPC;
9. require exact identity stability for the complete bracket.

A caller/model/plugin/MCP/environment variable may not override any endpoint component.

This is an endpoint-identity theorem, not a standalone proof of runsc executable bytes; R3E remains authoritative for runsc/process identity.

---

## 14. Exact R3E/R3F subject binding

R3G-C MUST NOT invent a new subject resolver.

It binds to the same exact execution subject established by canonical R3E/R3F, including purpose-equivalent identities:

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

The public R3G-C surface accepts no raw container ID, PID, runtime root or socket path.

Any mismatch fails closed.

---

## 15. Required race bracket

The physical network reads must occur inside one exact R3E runtime-instance bracket.

Required purpose-equivalent sequence:

```text
A. validate canonical deny-all requirement
B. obtain fresh R3F E2 Docker subject/snapshot
C. establish R3E state/process exact-instance observation #1
D. validate runtimeRoot parent authority and endpoint identity #1
E. fixed GetNetworkConfig read #1
F. endpoint identity #2; require stable
G. fixed GetNetworkConfig read #2
H. endpoint identity #3; require stable
I. establish R3E state/process exact-instance observation #2
J. require exact R3E instance equality across C..I
K. normalize reads #1/#2 and require identical topology identity
L. require exact accepted loopback-only topology
M. build R3G-C candidate record
N. durably commit record
O. validate exact commit acknowledgment
```

Any runtime exit/restart, PID/start-time/executable change, state-identity drift, endpoint replacement, timeout or cancellation fails the complete observation.

---

## 16. Exact accepted topology v1

After strict bounded normalization, R3G-C accepts only:

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

host-backed FD payload:
  none for the accepted topology
```

The accepted loopback semantics must contain only the pinned canonical loopback name, addresses and routes.

Any non-loopback link, address, route, neighbor, external/default gateway, external-link descriptor or authority-bearing unknown field fails closed.

No authority-bearing field may be normalized away as “diagnostic”.

---

## 17. E2 conjunction remains mandatory

R3G-C does not replace R3F.

The fresh exact-subject R3F snapshot must still require the canonical deny-all Docker facts, including purpose-equivalent:

```text
HostConfig.NetworkMode == "none"
no Docker network attachment
```

If R3F and gVisor physical topology disagree, R3G-C fails closed.

The physical observer may upgrade the **network candidate quality**, but may not retroactively label R3F itself E3/E4.

---

## 18. Forbidden shortcuts

None of the following may substitute for the exact pinned gVisor topology read:

```text
Docker NetworkMode alone
Docker labels
OCI annotations
runsc command-line configuration alone
absence of successful outbound traffic
DNS failure
timeout to public IP
firewall behavior
guest ip/route output
guest /proc/net
guest dmesg
application self-report
```

Failure to communicate is not proof of absence of authority.

---

## 19. No active network probe

R3G-C MUST NOT establish evidence by connecting to Internet, LAN, DNS, metadata, loopback services or synthetic remote endpoints.

The proof must remain deterministic, local-first, offline-capable and independent of external service availability.

This also preserves the founder invariant that Kodac itself must not introduce artificial availability bottlenecks.

---

## 20. Local communication non-claims

R3G-C proves only the canonical phrase:

```text
no non-loopback network authority
```

It does not prove absence of:

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

## 21. R3G-C candidate record

The implementation may define one pure durable record version purpose-equivalent to:

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
trustedHostTheoremVersion
recordIdentity
```

`networkTopologyIdentity` must deterministically bind all accepted identity-relevant topology fields.

The record MUST NOT be structurally assignable to canonical R3B `SandboxBackendObservation` or `SandboxExecutionEvidence`.

---

## 22. Durable put and replay semantics

R3G-C reuses canonical trusted-store rules:

```text
FIRST EXACT PUT:
persist exact canonical bytes

SAME recordIdentity + SAME bytes:
idempotent success / one logical record

SAME recordIdentity + DIFFERENT bytes:
integrity violation / fail closed
```

Lost/timeout/cancelled acknowledgment remains failed.

Late completion cannot upgrade that invocation.

A later invocation creates a fresh execution-attempt identity and repeats R3F/R3E/R3G-C observation from the beginning.

No blind same-invocation retry is authorized.

---

## 23. Bounds, cancellation and non-bottleneck posture

Trusted immutable configuration must impose finite safety bounds for:

```text
global monotonic deadline
connect timeout
response bytes
JSON depth/nodes/string lengths
canonical list cardinalities
```

These are safety bounds for one fixed protocol object, not product quotas.

R3G-C adds no daily/hourly review limit, no queue, no vendor dependency, and no external network dependency.

Cancellation/deadline must close the owned socket and settle owned async work before terminal failure; late data can never become evidence.

---

## 24. Production authority restrictions

R3G-C production code MUST contain no path capable of:

```text
Docker POST/PUT/DELETE
containerd mutation
runsc create/start/exec/kill/delete
runsc debug mutation
containerManager.SetNetworkArgs
Network.CreateLinksAndRoutes
arbitrary gVisor uRPC
arbitrary Unix-socket connect
mount
setns / namespace entry
ptrace
sudo / privilege escalation
host filesystem scan
/proc-wide process or socket scan
```

If implementation review finds any such path reachable, authorization is violated.

---

## 25. Proposed implementation shape

If this authorization becomes canonical, prefer one focused module purpose-equivalent to:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
```

plus focused tests and the minimum K2 `ExecutionGateway` wiring.

Do not create a daemon, background monitor, generic gVisor library, network scanner, or reusable arbitrary Unix-socket request surface.

Wider architecture requires separate authorization.

---

## 26. Required hostile proof set

The future implementation must prove at minimum:

1. canonical loopback-only topology passes;
2. any FDBasedLink fails;
3. any XDPLink fails;
4. any non-loopback link/address/route/neighbor fails;
5. any external/default gateway fails;
6. malformed/duplicate/trailing/oversized/deep uRPC JSON fails;
7. remote uRPC error fails;
8. absent runtimeRoot-local socket fails;
9. fallback socket present only in `/tmp`, `/run` or `/var/run` still fails;
10. symlink/non-socket/workload-writable endpoint authority fails;
11. endpoint identity replacement during bracket fails;
12. caller cannot select container ID/PID/runtimeRoot/socket/method;
13. production code cannot call `SetNetworkArgs` or `Network.CreateLinksAndRoutes`;
14. R3F network-mode mismatch fails;
15. R3E runtime-instance change during bracket fails;
16. topology read #1/#2 mismatch fails;
17. timeout/cancellation remains failure and closes owned socket;
18. late response cannot become evidence;
19. same-record exact replay is idempotent;
20. same-record conflicting bytes fail closed;
21. lost acknowledgment requires a fresh later invocation;
22. no R3B observation/evidence constructor is invoked;
23. no generic gVisor RPC client is reachable;
24. tests explicitly document that a malicious trusted-host mutation is outside the admitted theorem rather than falsely “detected”.

---

## 27. CI and platform posture

Runtime implementation is Linux-only but repository build/tests remain platform-safe.

Required implementation certification includes canonical applicable gates:

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

Real-host certification, if later required, must be explicit and non-claim-inflating.

---

## 28. Evidence-ledger discipline

The implementation evidence ledger remains absent until the exact pre-ledger implementation head passes all required technical, manual architecture/trust/security, and fresh external-review gates.

Only then may one dedicated ledger-only commit be added.

Fresh post-ledger exact-head certification is mandatory.

No proven R3G-C claim may be emitted before canonical merge plus required post-merge quality certification.

---

## 29. Manual architecture / trust / security questions

Before implementation ledger creation, reviewers must answer **NO** to every unsafe proposition:

```text
Can the caller choose containerId, PID, runtimeRoot or socket path?
Can the caller choose the uRPC method or body?
Can production R3G-C reach Network.CreateLinksAndRoutes or SetNetworkArgs?
Can R3G-C connect to arbitrary Unix sockets?
Can it fall back to /tmp or scan the host?
Can Docker NetworkMode alone satisfy the physical theorem?
Can guest/app self-report satisfy it?
Can failed outbound probes satisfy it?
Can non-loopback links/gateways be normalized away?
Can endpoint replacement be accepted?
Can runtime-instance replacement be accepted?
Can late timeout/cancel bytes become evidence?
Can R3G-C mint canonical R3B observation/evidence directly?
Can this claim be described as direct live NIC-table enumeration?
Can this claim survive a malicious trusted-host network mutation?
Can it be interpreted as no loopback, no sockets or no local IPC?
```

Any `YES` blocks acceptance.

---

## 30. Candidate completion claim and boundary

Only after this authorization becomes canonical, a separately scoped implementation passes all gates, the ledger transition and fresh certification pass, implementation merges, and post-merge quality passes on exact canonical `main`, may Kodac emit:

```text
KODAC_LINUX_GVISOR_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_PROVEN
```

Meaning only:

> Under Kodac's admitted trusted-host v1 theorem, one exact running Linux gVisor root sandbox was bound to the canonical R3E/R3F subject; its physically applied creation network topology was read through one fixed trusted runtimeRoot-local `GetNetworkConfig` RPC, repeatedly bracketed against the same runtime instance and endpoint, and proven to contain canonical loopback only with no host-backed non-loopback attachment.

It does not mean:

```text
Byzantine/malicious host resistance
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

This authorization PR itself remains docs-only. It must contain no production/test/schema/workflow/dependency/evidence-ledger change.

If review determines that the trusted-host assumption, retained creation topology, uRPC transport, endpoint theorem, or race bracket is insufficient for the canonical R3G-C target, the correct outcome is to revise or reject this authorization—not to silently weaken the claim.