# KDO-H4-R3G-C — gVisor Physical Deny-All Network Observation Evidence

Date: 2026-08-17

Status: **POST-LEDGER CERTIFICATION PENDING**

Repository: `TheHalfMoon/Kodac`

PR: `#116`

---

## 1. Evidence decision

```text
GATE:
H4-R3G-C PRE-LEDGER IMPLEMENTATION GATE

PRE-LEDGER DECISION:
PASS

CANONICAL BASE:
a150f322694e49be2b7adcb307d5df1e71e558e2

CANONICAL BASE TREE:
cdd729374cacb5a6518b5584cc647dfe7d64a2e9

ACCEPTED PRE-LEDGER HEAD:
98a7a51b410fc7ed2062641004ed8760e47e69fa

ACCEPTED PRE-LEDGER TREE:
229124dab729bcc9ca0a05f9af86862d33efb845

BOUNDED TARGET:
KDO-H4-R3G-C Linux gVisor physical deny-all network observation only
```

This ledger records the accepted **pre-ledger** implementation evidence for R3G-C only.

It does **not** close R3G-C by itself. This ledger transition must remain ledger-only. Fresh complete post-ledger exact-head certification is mandatory before any implementation completion claim, Ready transition, merge decision, or canonical implementation claim.

Repository canonical authorization remains authoritative over this ledger if a conflict is discovered.

---

## 2. Governing canonical artifact and upstream pin

The accepted implementation was reviewed against:

```text
docs/planning/KODAC_KDO_H4_R3G_C_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_AUTHORIZATION_2026-08-17.md
```

Canonical authorization commit:

```text
a150f322694e49be2b7adcb307d5df1e71e558e2
```

Pinned upstream gVisor source:

```text
repository: google/gvisor
commit: 50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

R3E, R3F, R3G-A, and R3G-B remain canonical predecessors.

The accepted theorem is the authorization's bounded v1 theorem. It is not upgraded by this ledger.

---

## 3. Exact accepted pre-ledger scope

The accepted pre-ledger PR diff contains exactly these 8 changed paths:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-network.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network-runtime.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-certification.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-gvisor-network.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-replay.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-runtime.test.ts
```

The reserved evidence-ledger path was verified absent at the accepted pre-ledger head before this transition:

```text
docs/planning/KODAC_KDO_H4_R3G_C_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_EVIDENCE_2026-08-17.md
```

No dependency, lockfile, schema, workflow, generated-code, donor-import, generic policy, K3 policy, daemon, background monitor, arbitrary RPC utility, or unrelated product-surface change is admitted by this ledger.

---

## 4. Accepted implementation identities

Primary accepted blobs at pre-ledger head:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-network.ts
142028d7bdbdbd2dd99b009befeb5aed3577f6a6

packages/kodac-runtime/src/index.ts
ded2fc746f2393f608b42d734642e2852d7dd51d

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network-runtime.ts
f1ee4be7fd522cdd7a87b7c55911c784dae8b58d

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
60abfeadfd885a7aebee860bd2c2242ec47aa55d

packages/kodac-runtime/test/kdo-h4-r3g-c-certification.test.ts
9e008808764f988fb7c3f540fa67aff4c2874d4d

packages/kodac-runtime/test/kdo-h4-r3g-c-gvisor-network.test.ts
76e99ddd54fb75d316ee47d3ca3a1f34ba1ea517

packages/kodac-runtime/test/kdo-h4-r3g-c-replay.test.ts
d7b6c91256124199249b902429ae8c621ba9ab7b

packages/kodac-runtime/test/kdo-h4-r3g-c-runtime.test.ts
b8b0c1f00b9b6035daccac96afa02f1ca7530325
```

---

## 5. Bounded theorem established by the accepted implementation

Within the authorized R3G-C scope, the accepted implementation establishes a fail-closed **E3 physical-network candidate** for one exact trusted Linux gVisor execution subject only when all required facts hold together:

1. Linux only.
2. The dedicated R3G-C capability remains policy-gated.
3. `deny` blocks.
4. `ask` blocks; R3G-C introduces no new approval authority.
5. The canonical R3E gVisor runtime and canonical R3F Docker resolver are required.
6. Every observation invocation mints a fresh execution-attempt identity internally.
7. Fresh R3F evidence must bind the exact requirement/workload/container subject.
8. Fresh R3F posture must remain `networkMode == none` with zero network attachments.
9. R3E before/after records must preserve the same exact execution attempt, requirement, workload, binding, container, observer, runsc artifact, helper artifact, plan, state, process, and runtime-instance identity.
10. `runtimeRoot` is trusted configuration from the canonical R3E boundary, not caller input to the observation operation.
11. The control socket is derived only as `<runtimeRoot>/runsc-<full-container-id>.sock`.
12. No fallback search outside the selected runtimeRoot is admitted.
13. runtimeRoot path authority is checked component-by-component and group/world-writable or untrusted ownership fails closed.
14. The final endpoint must be a real non-symlink Unix socket with trusted ownership and non-group/world-writable mode.
15. Endpoint identity is snapshotted before and after each fixed RPC and must remain stable across the full physical bracket.
16. The only new gVisor RPC is fixed `containerManager.GetNetworkConfig` with fixed empty argument body.
17. The protocol is bounded for connect time, response time, response bytes, JSON depth/nodes/object keys/array items/string bytes, total observation time, and durable commit time.
18. Duplicate-key, malformed, trailing-content, oversized, deeply nested, and remote-error responses fail closed.
19. Timeout or cancellation destroys the owned stream; terminal settlement occurs on close and late bytes cannot become evidence.
20. The accepted topology contains exactly canonical loopback authority and zero FDBasedLinks/XDPLinks/default gateway/non-loopback authority.
21. PCAP, packet logging, NAT blob, pause-external-networking, and allow-connected-on-save authority are not accepted.
22. Two physical topology reads must derive the same topology identity.
23. The trusted-host serialization theorem version must be explicitly admitted by immutable runtime configuration.
24. The observer does not pretend to observe or create the external S1-S6 trusted-host serialization authority.
25. R3E lineage evidence is committed and acknowledgment-validated before physical record creation.
26. R3G-C physical-network evidence is committed and exact acknowledgment-validated before successful return.
27. Lost acknowledgment is terminal for the current invocation; there is no blind same-invocation retry.
28. A later recovery invocation performs a fresh R3F/R3E/RPC observation with a fresh execution-attempt identity and normally a distinct record identity.
29. Same recordIdentity plus same canonical bytes is idempotent at the trusted-store proof boundary.
30. Same recordIdentity plus different canonical bytes is an integrity violation and fails closed.
31. Production R3G-C cannot mint canonical `SandboxBackendObservation` or `SandboxExecutionEvidence`.
32. Generic workspace/K3 policy surfaces receive no R3G-C completion authority.

The evidence class remains exactly:

```text
e3-physical-network-candidate
```

---

## 6. Required hostile-proof gate (§28)

The accepted head explicitly covers all 26 required hostile-proof classes from canonical §28:

```text
1  canonical loopback-only topology passes
2  any FDBasedLink fails
3  any XDPLink fails
4  non-loopback link/address/route/neighbor authority fails
5  external/default gateway authority fails
6  malformed/duplicate/trailing/oversized/deep uRPC JSON fails
7  remote uRPC error fails
8  absent runtimeRoot-local socket fails
9  fallback-only socket outside selected runtimeRoot fails
10 symlink/non-socket/untrusted-parent endpoint fails
11 endpoint identity replacement during bracket fails
12 caller-selected container/PID/runtimeRoot/socket/method authority is rejected
13 production cannot call SetNetworkArgs
14 production cannot call Network.CreateLinksAndRoutes
15 production exposes no generic gVisor RPC client
16 R3F network-mode mismatch fails
17 R3E runtime-instance replacement fails
18 topology read #1/#2 mismatch fails
19 timeout/cancellation closes the owned stream and remains failure
20 late response cannot become evidence
21 same-record exact replay is idempotent
22 same-record conflicting canonical bytes fail closed
23 lost acknowledgment requires a fresh later invocation
24 no R3B observation/evidence constructor is invoked
25 delayed-pre-start SetNetworkArgs race is modeled as unsafe unless §9 serialization is admitted
26 malicious trusted-host mutation is explicitly outside the theorem
```

Result:

```text
REQUIRED HOSTILE PROOFS:
26 / 26 EXPLICIT
```

No required proof is passed by implication alone.

---

## 7. Exact pre-ledger CI evidence

Required exact-head workflow truth for accepted pre-ledger head `98a7a51b410fc7ed2062641004ed8760e47e69fa`:

```text
governance
run: 32041254274
run number: 1444
conclusion: success

k2-runtime
run: 32041254247
run number: 607
conclusion: success

k3-r4-adapter
run: 32041254232
run number: 311
conclusion: success

k3-r5-context-engine
run: 32041254235
run number: 284
conclusion: success
```

The governance run's first provenance attempt encountered an external GitHub/codeload HTTP 429 while downloading `astral-sh/setup-uv@v6` before repository provenance execution. Only failed jobs were re-run through the repository workflow mechanism. Attempt 2 completed successfully on the same exact SHA, including frozen dependency synchronization and `tools/validate_provenance.py`.

The K2 runtime workflow completed successfully for:

```text
runtime-change-classifier: PASS
Ubuntu Typecheck: PASS
Ubuntu full Test: PASS
Ubuntu benchmark hook: PASS
macOS Typecheck: PASS
macOS full Test: PASS
macOS benchmark hook: PASS
Windows Typecheck: PASS
Windows full Test: PASS
Windows benchmark hook: PASS
k2-runtime-gate: PASS
```

Accepted Ubuntu runtime summary:

```text
tests: 648
pass: 645
fail: 0
skipped: 3
```

The named Linux production integration passed:

```text
H4-R3G-C Linux production gateway proves one shared-attempt loopback-only physical-network candidate
```

No failing required technical workflow remained at the accepted pre-ledger head.

---

## 8. External review and review-thread truth

A fresh CodeRabbit review was explicitly requested while PR `#116` remained Draft.

Qualifying exact-head review evidence:

```text
head:
98a7a51b410fc7ed2062641004ed8760e47e69fa

CodeRabbit status event:
SUCCESS

description:
Review completed

timestamp:
2026-08-17T15:07:39Z
```

Immediately before ledger transition, the GitHub review-thread API reported:

```text
unresolved actionable inline review threads: 0
```

After the qualifying completed review, duplicate CodeRabbit review requests were queued on the **same immutable head**. The latest duplicate status before this ledger transition was:

```text
state: pending
description: Review queued
timestamp: 2026-08-17T15:21:00Z
```

This queued duplicate is recorded truthfully as:

```text
PENDING / NOT COUNTED AS PASS
```

It is not used to upgrade the qualifying completed exact-head review, and it is not represented as a finding. No implementation byte changed after the qualifying completed review and before this ledger transition. Any later actionable finding against the accepted implementation blocks post-ledger certification and must be adjudicated before further transition.

---

## 9. Manual architecture / trust / security review (§32)

Result:

```text
PASS
```

Every unsafe proposition in canonical §32 was answered **NO**:

```text
NO — caller can choose containerId, PID, runtimeRoot or socket path
NO — caller can choose the uRPC method/body
NO — production R3G-C can reach SetNetworkArgs
NO — production R3G-C can reach Network.CreateLinksAndRoutes
NO — R3G-C can connect to arbitrary Unix sockets
NO — R3G-C can fall back to /tmp or scan the host
NO — Docker NetworkMode alone can satisfy the theorem
NO — guest/app self-report can satisfy the theorem
NO — failed outbound probes can satisfy it
NO — non-loopback authority can be normalized away
NO — endpoint replacement can be accepted
NO — runtime-instance replacement can be accepted
NO — late timeout/cancel bytes can become evidence
NO — R3G-C can mint canonical R3B evidence directly
NO — GetNetworkConfig can be described as direct live NIC enumeration
NO — the §8 retained-topology race can be ignored
NO — §9 serialization can be inferred merely from loopback-only retained args
NO — the claim can survive a trusted-host violation of §9
NO — the claim can be interpreted as no loopback, sockets or local IPC
```

The review additionally verified that safety timeouts/size/depth bounds are one-operation security bounds and are not product usage quotas, queues, daily limits, review limits, or artificial availability restrictions.

---

## 10. Explicit nonclaims

This evidence does **not** claim:

- no loopback;
- no sockets;
- no AF_UNIX or other local IPC;
- no pipes or shared memory;
- no in-sandbox network syscalls;
- direct live NIC-table enumeration;
- resistance to a malicious or compromised trusted host;
- automatic detection of a trusted-host §9 serialization violation;
- Docker `NetworkMode=none` alone is physical proof;
- active outbound probing is evidence;
- arbitrary gVisor/container runtimes are supported;
- arbitrary Unix-socket paths or uRPC methods are authorized;
- Docker/containerd/runsc network mutation is authorized;
- R3G-C creates final R3B/E4 sandbox observation/evidence;
- TTL/output/credential/filesystem/resource dimensions are proven by R3G-C;
- macOS or Windows physical R3G-C enforcement exists;
- later R3G slices are proven;
- external-process ASK is enabled;
- H4 is complete;
- PR `#116` is Ready or mergeable solely because this ledger exists;
- the final canonical R3G-C completion claim is available before ledger-head certification, canonical merge, and post-merge quality certification.

The eventual candidate completion claim remains only the exact canonical §33 claim:

```text
KODAC_LINUX_GVISOR_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_PROVEN
```

This ledger does **not** emit that claim.

---

## 11. Ledger transition rule

Canonical §31 permits the ledger only after exact pre-ledger implementation PASS and requires a dedicated ledger-only commit.

Therefore the transition from the accepted pre-ledger head must satisfy:

```text
parent:
98a7a51b410fc7ed2062641004ed8760e47e69fa

added path only:
docs/planning/KODAC_KDO_H4_R3G_C_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_EVIDENCE_2026-08-17.md

production delta:
0

test delta:
0

schema/workflow/dependency delta:
0
```

After this transition, fresh complete post-ledger exact-head certification is mandatory.

If required workflows do not automatically trigger for the docs-only ledger transition, absence of a fresh run must not be represented as PASS; the repository's canonical workflow mechanism must be used where fresh execution is required.

A pending, unavailable, rate-limited, stale, or duplicate external review event must never be represented as a successful review it did not actually perform.

Until fresh post-ledger certification is complete, the only valid state is:

```text
POST-LEDGER CERTIFICATION PENDING
```

No merge, Ready transition, final R3G-C proven claim, post-merge claim, or later H4 slice is authorized by this ledger alone.
