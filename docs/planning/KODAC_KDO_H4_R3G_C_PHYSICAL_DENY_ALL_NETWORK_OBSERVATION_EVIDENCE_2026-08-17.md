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

RECONCILED PRE-LEDGER IMPLEMENTATION/TEST HEAD:
0c3758e977e0fd0b87b75907d8353a98bcbaf1d1

RECONCILED PRE-LEDGER IMPLEMENTATION/TEST TREE:
f007fd64d6a06cdb75650d573f9f4126e19d0bbd

BOUNDED TARGET:
KDO-H4-R3G-C Linux gVisor physical deny-all network observation only
```

This document is the current reconciliation ledger for R3G-C. It supersedes every earlier R3G-C evidence-ledger transition for certification purposes.

Earlier ledger transitions are explicitly non-certifying:

```text
FIRST SUPERSEDED LEDGER COMMIT:
e75d07067d8a120628378b91c261fd6933b3ecff
FIRST SUPERSEDED LEDGER TREE:
4b23909abdabf66de0d8225ca676a027c2fbf988
FIRST SUPERSEDED LEDGER PARENT:
98a7a51b410fc7ed2062641004ed8760e47e69fa
FIRST SUPERSEDED LEDGER BLOB:
369673ebefbc7fde3dfd74d62f7698ce40365a19
STATUS:
SUPERSEDED / STALE / NON-CERTIFYING

SECOND SUPERSEDED RECONCILIATION LEDGER COMMIT:
0d6562e4016569ce717285cbc757ae90b946d4c3
SECOND SUPERSEDED RECONCILIATION LEDGER TREE:
a1ed43951b77f09f08fb866cb808cab6fd50c554
SECOND SUPERSEDED RECONCILIATION LEDGER BLOB:
fcfe3396f76c5859dcdb5c8a5f354a7ca0a1f29c
STATUS:
SUPERSEDED / STALE / NON-CERTIFYING
```

The second ledger became non-certifying because its fresh post-ledger external review identified a valid Major weakness in the timer regression evidence. Test bytes then changed in `bbe45250c29705c90ef20de917cc9b3ea6f84bff` and `0c3758e977e0fd0b87b75907d8353a98bcbaf1d1`.

This ledger does **not** close R3G-C. Fresh post-ledger exact-head certification, zero unresolved actionable review findings, guarded merge, and exact merge-commit post-merge quality remain mandatory before the canonical completion claim may be emitted.

Repository canonical authorization remains authoritative over this ledger if any conflict is discovered.

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

R3E, R3F, R3G-A, and R3G-B remain canonical predecessors. This ledger does not widen the bounded R3G-C theorem.

---

## 3. Exact current implementation/test scope

The accepted pre-ledger implementation/test state consists of exactly these nine implementation/test paths:

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

## 4. Exact current implementation/test blob identities

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
68ec45be2a63cf2e3ccf24e167051c7239c0f425
```

The compare from the second superseded ledger head `0d6562e4016569ce717285cbc757ae90b946d4c3` to current pre-ledger head `0c3758e977e0fd0b87b75907d8353a98bcbaf1d1` is exactly two commits ahead and changes only `packages/kodac-runtime/test/kdo-h4-r3g-c-review-regressions.test.ts`. Therefore the other eight implementation/test blobs remain byte-identical to the preceding reconciliation.

---

## 5. Review-driven repair lineage

Accepted source/test repair lineage after the first stale ledger:

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

bbe45250c29705c90ef20de917cc9b3ea6f84bff
test(kdo): prove R3G-C response timer behavior

0c3758e977e0fd0b87b75907d8353a98bcbaf1d1
test(kdo): fix R3G-C timer test typing
```

Accepted remediation facts:

1. uRPC response buffering is bounded linear-copy work; repeated growing `Buffer.concat` work is removed.
2. The production response timeout starts only after Unix-socket connection and remains separate from the connect timeout.
3. The timer contract is now proven behaviorally with a real Linux Unix socket by observing the actual `Socket` `connect` event and recording response-timeout creation state; source-order inspection is no longer the certification proof.
4. Runtime no-fallback proof is tied to the selected runtime root and exact endpoint failure.
5. `/tmp` world-writable-ancestor assumptions are explicit.
6. Unix-socket fixtures use short trusted roots and assert the Linux `sun_path` byte bound.
7. Replay cleanup has bounded waits and signal-delivery assertions.
8. Runtime integration fixtures carry the same socket-path hardening.
9. The final `Reflect.apply` change is typing-only and preserves the behavioral test semantics.

No actionable source/test review finding remains unresolved at this transition.

---

## 6. Bounded theorem retained by the current implementation

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

All 26 required hostile-proof classes are explicit on current pre-ledger head `0c3758e977e0fd0b87b75907d8353a98bcbaf1d1`:

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

## 8. Exact current pre-ledger CI evidence

All required technical workflows completed successfully on exact current pre-ledger head `0c3758e977e0fd0b87b75907d8353a98bcbaf1d1`:

```text
governance
run: 32063477628
run number: 1464
conclusion: success

k2-runtime
run: 32063477593
run number: 617
conclusion: success

k3-r4-adapter
run: 32063477581
run number: 321
conclusion: success

k3-r5-context-engine
run: 32063477542
run number: 294
conclusion: success
```

Exact K2 matrix/gate truth:

```text
runtime-change-classifier: PASS
job: 95489882082

Ubuntu Typecheck: PASS
Ubuntu full Test: PASS
Ubuntu benchmark hook: PASS
job: 95489928689

Windows Typecheck: PASS
Windows full Test: PASS
Windows benchmark hook: PASS
job: 95489928572

macOS Typecheck: PASS
macOS full Test: PASS
macOS benchmark hook: PASS
job: 95489928567

k2-runtime-gate: PASS
job: 95490150356
```

Exact Ubuntu runtime summary:

```text
tests: 650
pass: 647
fail: 0
cancelled: 0
skipped: 3
todo: 0
```

Named R3G-C coverage that passed includes:

```text
exact socket authority has no fallback search outside the selected runtimeRoot
RPC timeout closes the owned stream and late response bytes cannot become evidence
exact endpoint absence fails even when a fallback socket exists
endpoint replacement during fixed RPC fails the complete read
cancellation closes owned transport and late bytes cannot become success
lost acknowledgment requires fresh later R3F/R3E/RPC observation
uRPC response buffering is linear-copy bounded
response timeout is created only after the Unix socket emits connect
runtime rejects a Docker provider that is not the exact R3E resolver
gateway ASK blocks before R3F or observer activity
Linux production gateway proves one shared-attempt loopback-only physical-network candidate
runtime and gateway expose no mutation, active-probe, or generic RPC surface
```

No required technical workflow remained pending or failing at this pre-ledger transition.

---

## 9. External exact-head review and thread truth

Qualifying CodeRabbit exact-head status:

```text
head:
0c3758e977e0fd0b87b75907d8353a98bcbaf1d1

status id:
52380033629

state:
success

description:
Review completed

timestamp:
2026-08-17T20:07:47Z
```

The previously reported Major timer-evidence finding is resolved/outdated and marked addressed by CodeRabbit after the behavioral proof was introduced.

Review-thread truth immediately before this ledger transition:

```text
unresolved actionable review threads: 0
```

Every currently listed PR review thread is resolved. No source/test/ledger thread remains unresolved at this transition.

---

## 10. Manual architecture / trust / security review (§32)

Result:

```text
PASS
```

The current delta since the previous ledger is test-only and does not change production authority. The behavioral regression proof observes the actual socket connection event and timer creation while restoring patched globals/prototypes in `finally`.

Unsafe propositions remain answered **NO**:

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
NO — a malicious trusted host is inside the proven theorem
```

---

## 11. Explicit nonclaims

This ledger does **not** claim:

- malicious-host resistance;
- direct live NIC enumeration;
- absence of loopback;
- absence of sockets;
- absence of local IPC;
- completion of R3B;
- TTL proof;
- output-bound proof beyond the authorized R3G-C transport bounds;
- credential proof;
- completion of later R3G slices;
- completion of H4;
- enablement of external-process ASK;
- that this ledger commit itself is final certification;
- the final §33 proven claim.

The trusted-host §9 serialization theorem remains an admitted deployment precondition, not an observed fact created by R3G-C.

---

## 12. Dedicated ledger transition contract

This ledger update is valid as the §31 reconciliation transition only if the resulting commit satisfies all of the following:

```text
parent:
0c3758e977e0fd0b87b75907d8353a98bcbaf1d1

changed paths:
exactly one

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

The resulting ledger commit SHA/tree/blob must be captured after the write and used as the exact head for fresh post-ledger certification.

---

## 13. Mandatory post-ledger transition

The only valid next sequence is:

```text
verify this commit is ledger-only and parent == 0c3758e977e0fd0b87b75907d8353a98bcbaf1d1
→ fresh exact-ledger-head governance certification
→ fresh exact-ledger-head k2-runtime certification according to canonical workflow semantics
→ fresh exact-ledger-head k3-r4 certification
→ fresh exact-ledger-head k3-r5 certification where applicable
→ fresh external exact-ledger-head review
→ zero unresolved actionable review findings
→ reverify PR head / canonical main / mergeability
→ guarded merge with expected_head_sha equal to the exact ledger head
→ verify exact merge parents/tree/diff
→ required post-merge quality certification on the exact merge commit
→ only then emit the canonical completion claim
```

No unavailable, skipped-without-canonical-basis, pending, queued, stale-head, or prior-head result may be represented as a current PASS.

---

## 14. Final claim remains blocked

The only eventual permitted completion claim is:

```text
KODAC_LINUX_GVISOR_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_PROVEN
```

It is **NOT emitted by this ledger**.

Current transition state:

```text
PRE-LEDGER TECHNICAL GATES:
PASS

PRE-LEDGER EXTERNAL EXACT-HEAD REVIEW:
PASS

PRE-LEDGER ACTIONABLE REVIEW THREADS:
0 unresolved

RECONCILIATION LEDGER:
THIS TRANSITION

POST-LEDGER CERTIFICATION:
PENDING

MERGE:
NOT YET AUTHORIZED BY §33

FINAL CLAIM:
BLOCKED
```
