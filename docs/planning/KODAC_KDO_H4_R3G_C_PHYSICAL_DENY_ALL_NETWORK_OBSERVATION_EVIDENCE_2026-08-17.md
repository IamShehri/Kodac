# KDO-H4-R3G-C — gVisor Physical Deny-All Network Observation Evidence

Date: 2026-08-17

Status: **POST-LEDGER CERTIFICATION PENDING**

Repository: `TheHalfMoon/Kodac`

PR: `#116`

---

## 1. Reconciliation decision

```text
GATE:
H4-R3G-C PRE-LEDGER IMPLEMENTATION GATE

RECONCILED PRE-LEDGER DECISION:
PASS

CANONICAL BASE:
a150f322694e49be2b7adcb307d5df1e71e558e2

CANONICAL BASE TREE:
cdd729374cacb5a6518b5584cc647dfe7d64a2e9

RECONCILED PRE-LEDGER IMPLEMENTATION HEAD:
a774ba0895bc88e8f6d940a3f8d5969bf521c4b2

RECONCILED PRE-LEDGER IMPLEMENTATION TREE:
1342b0e766e6795314c06610b5e718824d1b0265

BOUNDED TARGET:
KDO-H4-R3G-C Linux gVisor physical deny-all network observation only
```

This document is the **reconciliation ledger** for R3G-C.

The earlier ledger transition is explicitly superseded:

```text
SUPERSEDED LEDGER COMMIT:
e75d07067d8a120628378b91c261fd6933b3ecff

SUPERSEDED LEDGER TREE:
4b23909abdabf66de0d8225ca676a027c2fbf988

SUPERSEDED LEDGER PARENT:
98a7a51b410fc7ed2062641004ed8760e47e69fa

SUPERSEDED LEDGER BLOB:
369673ebefbc7fde3dfd74d62f7698ce40365a19

STATUS:
SUPERSEDED / STALE / NON-CERTIFYING
```

The first ledger became non-certifying because later exact-head external review identified valid implementation/test issues and the implementation/test bytes changed afterward. No evidence from that stale ledger is used to certify the reconciled implementation head.

This reconciliation ledger does **not** close R3G-C by itself. Fresh post-ledger exact-head certification, zero unresolved actionable review findings, guarded merge, and exact merge-commit post-merge quality remain mandatory before the canonical completion claim may be emitted.

Repository canonical authorization remains authoritative over this ledger if a conflict is discovered.

---

## 2. Governing canonical artifact and upstream pin

Canonical authorization:

```text
docs/planning/KODAC_KDO_H4_R3G_C_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_AUTHORIZATION_2026-08-17.md
```

Canonical authorization commit:

```text
a150f322694e49be2b7adcb307d5df1e71e558e2
```

Canonical authorization blob:

```text
999adaa4d8effbe9afda00aef1b0fc3cb4f46881
```

Pinned upstream gVisor source:

```text
repository: google/gvisor
commit: 50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

R3E, R3F, R3G-A, and R3G-B remain canonical predecessors. The theorem remains the bounded R3G-C theorem authorized by the canonical document and is not widened by this ledger.

---

## 3. Exact reconciled implementation scope

The reconciled pre-ledger implementation/test state consists of exactly these nine implementation/test paths:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-network.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-gvisor-network.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-runtime.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-certification.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-replay.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-c-review-regressions.test.ts
```

The tenth PR path is this evidence ledger.

No dependency, lockfile, schema, workflow, generated-code, donor-import, generic policy, K3 policy, daemon, background monitor, arbitrary RPC utility, or unrelated product-surface change is admitted by this reconciliation ledger.

---

## 4. Exact reconciled implementation identities

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
54724d0b3877838bc866e592ad47bb9ced823160

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network-runtime.ts
f1ee4be7fd522cdd7a87b7c55911c784dae8b58d

packages/kodac-runtime/src/execution/gateway-gvisor-network.ts
142028d7bdbdbd2dd99b009befeb5aed3577f6a6

packages/kodac-runtime/src/index.ts
ded2fc746f2393f608b42d734642e2852d7dd51d

packages/kodac-runtime/test/kdo-h4-r3g-c-gvisor-network.test.ts
9b21700142cab46261cace2be7af8e840fbf8692

packages/kodac-runtime/test/kdo-h4-r3g-c-runtime.test.ts
477925ec07f4a0505873dfb12b4d9985ebcb1cf3

packages/kodac-runtime/test/kdo-h4-r3g-c-certification.test.ts
bef44b8ae04091b8e8c6c049b9c3f6d78bfc9f6e

packages/kodac-runtime/test/kdo-h4-r3g-c-replay.test.ts
506ebf7e3f05fceff826c9fbfd9b014d0b1d5d82

packages/kodac-runtime/test/kdo-h4-r3g-c-review-regressions.test.ts
9e8a22180d20670e07fb6624cd1e3a0a40749876
```

These identities are bound to the reconciled pre-ledger implementation head and tree in §1.

---

## 5. Review-driven reconciliation history

The accepted source/test repair lineage after the superseded ledger is:

```text
2f77b5800bb311e913b4157e9ab96607050697a1
fix(kdo): harden R3G-C uRPC buffering and timers

65065efe0f0e1d211ebb8f3274e7696feb584c4a
review regression coverage for the source fixes

e8cf483b7beec261603c5dc79fe2a2e7180bc836
test(kdo): harden R3G-C socket fixtures

5efc65b6e059cbe5548363b628f9b41f6c4718ad
test(kdo): strengthen R3G-C no-fallback proof

9772ac50979083382056f7f7075f9585a812cb9c
test(kdo): bound R3G-C replay cleanup

a774ba0895bc88e8f6d940a3f8d5969bf521c4b2
test(kdo): bound R3G-C runtime socket path
```

Accepted remediation facts:

1. uRPC response buffering is bounded linear-copy work; repeated growing `Buffer.concat` work is removed.
2. The response timeout starts only after Unix-socket connection and remains separate from the connect timeout.
3. Runtime no-fallback proof is tied to the selected runtime root and exact endpoint failure.
4. `/tmp` world-writable-ancestor assumptions are explicit and host-sensitive test behavior is not silently assumed.
5. Unix-socket fixtures use short trusted roots and assert the Linux `sun_path` byte bound.
6. Replay cleanup has bounded waits and signal-delivery assertions.
7. Runtime integration fixtures carry the same socket-path hardening.

No source/test actionable review finding remains unresolved at this ledger transition.

---

## 6. Bounded theorem established by the reconciled implementation

Within the authorized R3G-C scope, the implementation establishes a fail-closed `e3-physical-network-candidate` for one exact trusted Linux gVisor execution subject only when all required facts hold together:

1. Linux only.
2. Dedicated R3G-C policy gate remains required.
3. `deny` blocks.
4. `ask` blocks; R3G-C creates no new approval authority.
5. Canonical R3E gVisor runtime and canonical R3F Docker resolver are required.
6. Every observation invocation has a fresh execution-attempt identity.
7. Fresh R3F evidence binds the exact requirement/workload/container subject.
8. R3F posture remains `networkMode == none` with zero network attachments.
9. R3E before/after lineage preserves the exact bound execution and runtime-instance identities.
10. `runtimeRoot` is trusted canonical R3E configuration, not caller-selected operation authority.
11. The control socket is derived only as `<runtimeRoot>/runsc-<full-container-id>.sock`.
12. No fallback search outside the selected runtimeRoot is admitted.
13. runtimeRoot authority is checked component-by-component and unsafe ownership/write mode fails closed.
14. The final endpoint is a real non-symlink Unix socket with trusted ownership and safe mode.
15. Endpoint identity is snapshotted before and after each fixed RPC and must remain stable.
16. The only new gVisor RPC is fixed `containerManager.GetNetworkConfig` with fixed empty argument body.
17. Connect time, response time, response bytes, JSON structure, total observation time, and durable commit time are bounded.
18. Duplicate-key, malformed, trailing-content, oversized, deeply nested, and remote-error responses fail closed.
19. Timeout/cancellation destroys the owned stream and late bytes cannot become evidence.
20. Accepted topology contains canonical loopback authority and zero external/non-loopback authority.
21. PCAP, packet logging, NAT blob, pause-external-networking, and allow-connected-on-save authority are not accepted.
22. Two physical topology reads must derive the same topology identity.
23. The trusted-host serialization theorem version must be explicitly admitted by immutable runtime configuration.
24. The observer does not claim to observe or create the external trusted-host serialization authority.
25. R3E lineage evidence is committed and acknowledgment-validated before physical record creation.
26. R3G-C physical-network evidence is committed and exact acknowledgment-validated before successful return.
27. Lost acknowledgment is terminal for the current invocation; no blind same-invocation retry is admitted.
28. Later recovery performs a fresh R3F/R3E/RPC observation with a fresh execution-attempt identity.
29. Same recordIdentity plus same canonical bytes is idempotent at the trusted-store boundary.
30. Same recordIdentity plus different canonical bytes is an integrity violation and fails closed.
31. Production R3G-C cannot mint canonical `SandboxBackendObservation` or `SandboxExecutionEvidence`.
32. Generic workspace/K3 policy surfaces receive no R3G-C completion authority.

Evidence class remains exactly:

```text
e3-physical-network-candidate
```

---

## 7. Required hostile-proof gate (§28)

All 26 required hostile-proof classes are explicit on the reconciled implementation head:

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
25 delayed-pre-start SetNetworkArgs race is unsafe unless §9 serialization is admitted
26 malicious trusted-host mutation is explicitly outside the theorem
```

```text
REQUIRED HOSTILE PROOFS:
26 / 26 EXPLICIT
```

---

## 8. Exact pre-ledger CI evidence

All required technical workflows completed successfully on exact reconciled head `a774ba0895bc88e8f6d940a3f8d5969bf521c4b2`:

```text
governance
run: 32044522477
run number: 1458
conclusion: success

k2-runtime
run: 32044522482
run number: 614
conclusion: success

k3-r4-adapter
run: 32044522458
run number: 318
conclusion: success

k3-r5-context-engine
run: 32044522465
run number: 291
conclusion: success
```

Exact K2 matrix/gate truth:

```text
runtime-change-classifier: PASS
Ubuntu Typecheck: PASS
Ubuntu full Test: PASS
Ubuntu benchmark hook: PASS
Windows Typecheck: PASS
Windows full Test: PASS
Windows benchmark hook: PASS
macOS Typecheck: PASS
macOS full Test: PASS
macOS benchmark hook: PASS
k2-runtime-gate: PASS
```

Exact macOS job:

```text
job: 95429553024
started: 2026-08-17T18:51:16Z
completed: 2026-08-17T18:51:45Z
conclusion: success
```

Exact Ubuntu runtime summary:

```text
tests: 650
pass: 647
fail: 0
cancelled: 0
skipped: 3
```

Named R3G-C regression/integration coverage that passed includes:

```text
exact socket authority has no fallback outside selected runtimeRoot
RPC timeout closes owned stream and late bytes cannot become evidence
exact endpoint absence fails even when a fallback socket exists
endpoint replacement during fixed RPC fails
cancellation closes owned transport and late bytes cannot become success
lost acknowledgment requires fresh later R3F/R3E/RPC observation
uRPC response buffering is linear-copy bounded
response timeout starts only after Unix socket connects
runtime rejects a Docker provider that is not the exact R3E resolver
gateway ASK blocks before R3F or observer activity
Linux production gateway proves one shared-attempt loopback-only physical-network candidate
runtime/gateway expose no mutation, active-probe, or generic RPC surface
```

No required technical workflow remained pending or failing at this pre-ledger transition.

---

## 9. External exact-head review and thread truth

Qualifying CodeRabbit exact-head status:

```text
head:
a774ba0895bc88e8f6d940a3f8d5969bf521c4b2

status id:
52366173991

state:
success

description:
Review completed

timestamp:
2026-08-17T16:10:39Z
```

Review-thread truth immediately before this reconciliation ledger transition:

```text
unresolved actionable source/test threads: 0
unresolved ledger reconciliation thread: 1
```

The sole unresolved thread targets this evidence ledger and correctly identifies the earlier ledger as stale/unsupported after later source/test repairs. This reconciliation directly addresses that finding by superseding the old ledger and binding the pre-ledger decision to the current exact implementation head, current blobs, current CI, and current successful external review.

The ledger thread may be resolved only after this dedicated reconciliation commit is verified to contain this correction and no unrelated path changes.

---

## 10. Manual architecture / trust / security review (§32)

Result:

```text
PASS
```

Every unsafe proposition remains answered **NO**:

```text
NO — caller can choose containerId, PID, runtimeRoot, or socket path
NO — caller can choose the uRPC method/body
NO — production R3G-C can reach SetNetworkArgs
NO — production R3G-C can reach Network.CreateLinksAndRoutes
NO — R3G-C can connect to arbitrary Unix sockets
NO — R3G-C can fall back to /tmp or scan the host
NO — Docker NetworkMode alone can satisfy the theorem
NO — guest/app self-report can satisfy the theorem
NO — failed outbound probes can satisfy the theorem
NO — non-loopback authority can be normalized away
NO — endpoint replacement can be accepted
NO — runtime-instance replacement can be accepted
NO — late timeout/cancel bytes can become evidence
NO — R3G-C can mint canonical R3B evidence directly
NO — GetNetworkConfig can be described as direct live NIC enumeration
NO — the retained-topology race can be ignored
NO — trusted-host serialization can be inferred merely from loopback-only retained args
NO — the claim can survive a trusted-host serialization violation
NO — the claim can be interpreted as no loopback, sockets, or local IPC
```

Timeout, byte, depth, and cleanup bounds are per-operation security/reliability bounds. They are not Kodac-imposed review quotas, daily limits, artificial busy states, forced queues, or vendor-controlled availability restrictions.

---

## 11. Explicit nonclaims

This evidence does **not** claim:

- no loopback;
- no sockets;
- no AF_UNIX or other local IPC;
- no pipes or shared memory;
- no in-sandbox network syscalls;
- direct live NIC-table enumeration;
- resistance to a malicious or compromised trusted host;
- automatic detection of a trusted-host serialization violation;
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
- this ledger alone makes the PR merge-safe;
- the final canonical R3G-C completion claim is available before post-ledger certification, canonical merge, and post-merge exact-commit quality certification.

The only eventual allowed completion claim remains:

```text
KODAC_LINUX_GVISOR_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_PROVEN
```

This ledger does **not** emit that claim.

---

## 12. Reconciliation ledger transition rule

Canonical §31 permits the ledger only after exact pre-ledger implementation PASS and requires a dedicated ledger-only transition.

This reconciliation transition must therefore satisfy:

```text
parent:
a774ba0895bc88e8f6d940a3f8d5969bf521c4b2

changed path only:
docs/planning/KODAC_KDO_H4_R3G_C_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_EVIDENCE_2026-08-17.md

production delta:
0

test delta:
0

schema delta:
0

workflow delta:
0

dependency delta:
0
```

After this transition, fresh post-ledger exact-head certification is mandatory. A docs-only classifier skip may be recorded only according to the repository workflow's actual semantics; absence of a required fresh run must never be represented as PASS.

No merge, final completion claim, post-merge claim, or later H4 slice is authorized by this ledger alone.

---

## 13. Required post-ledger transition

```text
reconciliation ledger-only commit verified
→ resolve the now-addressed ledger review thread
→ fresh post-ledger exact-head governance certification
→ fresh post-ledger exact-head K2 gate according to canonical workflow semantics
→ fresh post-ledger exact-head K3-R4 certification
→ fresh post-ledger exact-head K3-R5 certification where applicable
→ fresh external exact-head review where required
→ zero unresolved actionable review findings
→ guarded merge with expected exact ledger head SHA
→ verify merge parents/tree/diff
→ required post-merge quality certification on exact merge commit
→ only then emit the canonical §33 completion claim
```

Until every step above is complete, R3G-C remains **not canonically proven**.
