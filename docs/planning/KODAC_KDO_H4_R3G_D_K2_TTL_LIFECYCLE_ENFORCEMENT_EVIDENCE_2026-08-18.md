# KDO-H4-R3G-D — K2 TTL / Lifecycle Enforcement Evidence Ledger

Date: 2026-08-18
Status: **LEDGER-ONLY TRANSITION WRITTEN — POST-LEDGER CERTIFICATION REQUIRED**
Repository: `TheHalfMoon/Kodac`
PR: `#118`
Branch: `feat/kdo-h4-r3g-d-gvisor-ttl`

---

## 1. Ledger purpose

This document is the dedicated H4-R3G-D evidence-ledger transition authorized by the canonical R3G-D gate documents.

It records the exact implementation parent, source/test/helper identities, pinned gVisor identity, pre-ledger technical-gate results, manual architecture/trust/security review result, fresh external exact-head review identity, and explicit nonclaims.

This commit is **not** the final R3G-D certification. It MUST contain no production, test, schema, workflow, or dependency mutation. Fresh post-ledger exact-head certification is required before any Ready/merge transition or bounded R3G-D claim.

---

## 2. Canonical authority and base

Canonical `main` / PR base at the ledger transition:

```text
976135d976d3bea13b631469fcce07c6947ff44d
```

Canonical authorization and reconciliation identities used by this ledger:

```text
docs/planning/KODAC_KDO_H4_R3G_D_K2_TTL_LIFECYCLE_ENFORCEMENT_AUTHORIZATION_2026-08-18.md
blob 2976154ecfa07769e79d92e2b4748f654bb6219c

docs/planning/KODAC_KDO_H4_R3G_D_FENCING_CHANNEL_AND_ARTIFACT_RECONCILIATION_2026-08-18.md
blob 3a82ba8586226ba2bfae220a0499c74fa7c64155

docs/planning/KODAC_KDO_H4_R3G_D_RECOVERY_AND_EXPIRY_LIVENESS_RECONCILIATION_2026-08-18.md
blob 6490f4bc5378ef38e0d3af29491ed2ca0402670d

docs/planning/KODAC_KDO_H4_R3G_D_TERMINAL_CAUSALITY_AND_KILL_BINDING_RECONCILIATION_2026-08-18.md
blob 6f01d01fee4c871bd39d1ddb3139976d70e29f90

docs/planning/KODAC_KDO_H4_R3G_LINUX_DOCKER_GVISOR_PHYSICAL_POLICY_CONJUNCTION_SPLIT_2026-08-16.md
blob 21e94791fb3f4255def4cc19c9dd8dcbf274d500
```

The canonical R3G-D authorization permits only the narrow exact-subject TTL/lifecycle enforcement authority. It does not authorize a generic container lifecycle API, arbitrary kill/delete, Docker mutation, R3B evidence minting, output-limit enforcement, external-process ASK, or any later H4 slice.

---

## 3. Exact implementation identity

The implementation parent immediately before this ledger-only transition is:

```text
IMPLEMENTATION_PARENT_SHA=111e0638acdf1ff35fb9127047602ae02ed95f7b
IMPLEMENTATION_PARENT_TREE=3a52243c43f3511b83dc189d63ade908f23f9b4c
BASE_SHA=976135d976d3bea13b631469fcce07c6947ff44d
IMPLEMENTATION_COMMITS_AHEAD_OF_BASE=67
IMPLEMENTATION_CHANGED_FILES=29
```

All pre-ledger technical, manual, and external review evidence in this document is anchored to `111e0638acdf1ff35fb9127047602ae02ed95f7b` only.

---

## 4. Exact production/helper blob identities

The 12 production/helper paths in the implementation delta are pinned below.

```text
packages/kodac-runtime/native/gvisor-ttl-watchdog.c
ba363afdc852328f09b8ee94413ddd35b7dee24f

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-arm-replay.ts
719b108118519ef9aaf3cd00274317c4659611c7

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-reconcile.ts
38b4770921d3178bedbdfaea9d93ae3d330e65c0

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-recovery-registry.ts
881800cbf931517a8ea7030967e0ead98a01208b

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-recovery-runtime.ts
078a224de2ee65f87b80b2270523f65b76aaedd5

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-registry.ts
bcdf7d08e03e47268018aa5e3530068dab66a594

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
26b0f8094afb8e61ec29e05496c7aa91bf2f6e7f

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-terminal-replay.ts
17df6677a6cc0a6e9a9bfce86176355579680182

packages/kodac-runtime/src/execution/gateway-gvisor-ttl.ts
1322188105e75644e0a46f6fd7e45caddb503aa4

packages/kodac-runtime/src/index.ts
5750757aeaa21b5b49e5a5c954e952baee8fd98e

packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl-recovery.ts
cc501663e2323f1506ec49fa549c24b7911e0c00

packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
de0de7a8c9ec1cf4911e60658b82aecda6aa17ae
```

The native watchdog implementation identity for this ledger is therefore:

```text
WATCHDOG_PATH=packages/kodac-runtime/native/gvisor-ttl-watchdog.c
WATCHDOG_BLOB=ba363afdc852328f09b8ee94413ddd35b7dee24f
```

---

## 5. Exact test blob identities

The 17 R3G-D test paths in the implementation delta are pinned below.

```text
packages/kodac-runtime/test/kdo-h4-r3g-d-arm-ack-deadline.test.ts
c05a2ea768699a13f376ad4b55239bfa26ba9529

packages/kodac-runtime/test/kdo-h4-r3g-d-arm-replay.test.ts
7b44d9c2c31ebacce57699e2250f090908fc8ff0

packages/kodac-runtime/test/kdo-h4-r3g-d-boottime-io.test.ts
dc20d246b2601978aec75d28ab7ed58876451c66

packages/kodac-runtime/test/kdo-h4-r3g-d-dispatch-bound.test.ts
f01ab2b0fec8dd783abbcc175dfd9eeb2326b744

packages/kodac-runtime/test/kdo-h4-r3g-d-gateway-runtime.test.ts
46f6d4e0d089e11720564f055318a11c29928547

packages/kodac-runtime/test/kdo-h4-r3g-d-gateway-terminal-timeout.test.ts
5029c96c3e4fcf77316c134044d754ef2cb074bd

packages/kodac-runtime/test/kdo-h4-r3g-d-gvisor-ttl.test.ts
5214680e2bb57215dd4d64061c77087b9ae679f5

packages/kodac-runtime/test/kdo-h4-r3g-d-hardening.test.ts
ae79c628082269cb0bd2f2315d2381445c6b2262

packages/kodac-runtime/test/kdo-h4-r3g-d-native-arm-replay.test.ts
23b13c18cf79c1eaff9f215c4d58d65a18a9852a

packages/kodac-runtime/test/kdo-h4-r3g-d-post-ready-deadline.test.ts
ed02743aaabf44e1dbf8869ef5cb15133676ea16

packages/kodac-runtime/test/kdo-h4-r3g-d-reconcile.test.ts
30298a179eb71014dc76841f831b3033d71b56ed

packages/kodac-runtime/test/kdo-h4-r3g-d-recovery-contract.test.ts
4fe66bc8cf89e77df380557e9d49ed206095878d

packages/kodac-runtime/test/kdo-h4-r3g-d-recovery-root-pin.test.ts
8e2fbf0f65e615f202c01b8a81acd6acd9c2c82f

packages/kodac-runtime/test/kdo-h4-r3g-d-recovery-runtime.test.ts
cf3ca9d7098b9b1621bad75f4ce1a0c4aa65eb73

packages/kodac-runtime/test/kdo-h4-r3g-d-registry-recovery.test.ts
76713b77e0a506c4a45c8348f291369a38c3fc71

packages/kodac-runtime/test/kdo-h4-r3g-d-runtime.test.ts
36f146bd954d914e7f0a93bb50dd56d43e366103

packages/kodac-runtime/test/kdo-h4-r3g-d-terminal-replay.test.ts
ca2a1dcc1f0e6e05831194e75c0a15b8baa0aa40
```

---

## 6. Pinned gVisor / runsc source-study identity

The implementation remains anchored to the canonical pinned gVisor source commit:

```text
GVISOR_PIN=50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

R3G-D does not authorize an unpinned or caller-selected `runsc` binary. The runtime proof binds the exact retained runsc artifact and re-verifies its bytes before use; the native watchdog does not fall back to pathname reconnect, Docker lifecycle mutation, host PID kill, or standalone `runsc state` / `runsc kill` TOCTOU proof.

The R3G-D canonical authorization/reconciliation blobs recorded in §2 are the source-study identities governing that retained authenticated gVisor control path.

---

## 7. Pre-ledger exact-head technical gates

All required technical gates were evaluated on exact implementation head:

```text
111e0638acdf1ff35fb9127047602ae02ed95f7b
```

and completed successfully.

```text
WORKFLOW=k2-runtime
RUN_ID=32148484796
RESULT=SUCCESS

WORKFLOW=governance
RUN_ID=32148484813
RESULT=SUCCESS

WORKFLOW=k3-r4-adapter
RUN_ID=32148484751
RESULT=SUCCESS

WORKFLOW=k3-r5-context-engine
RUN_ID=32148484838
RESULT=SUCCESS
```

The exact-head Ubuntu runtime job included the complete runtime suite with:

```text
TOTAL=713
PASS=710
FAIL=0
SKIP=3
```

The cross-platform runtime/typecheck gates, governance/provenance gates, exact PR-head/scope attestations, deterministic context proof, and unchanged-checkout attestations also passed on the same implementation head.

The R3G-D hostile/regression coverage exercised the required proof classes, including:

- immutable arm/deadline semantics;
- CLOCK_BOOTTIME-based deadline behavior and bounded I/O/dispatch;
- retained watchdog/runsc artifact identity checks;
- control-socket peer credential and process identity checks;
- pidfd/start-ticks/executable/runtime-hash binding;
- same-lock owner replacement rejection;
- fenced liveness / Signal / termination identity;
- durable arm replay and terminal replay rules;
- descriptor-pinned recovery-root replacement rejection;
- `ARM + no terminal` restart fail-closed behavior;
- native watchdog compilation/warning cleanliness and fixed SIGKILL-all gVisor Signal path;
- predecessor R3E/R3F/R3G-A/R3G-B/R3G-C regression coverage.

---

## 8. Manual architecture / trust / security review

Manual §38 review result on exact implementation head `111e0638acdf1ff35fb9127047602ae02ed95f7b`:

```text
RESULT=PASS
```

The review confirmed the following bounded properties from the implementation delta:

1. **Exact subject remains K2-derived and caller-independent.** Public/model/plugin input cannot select raw container ID, runtime root, runsc path, signal, kill mode, watchdog executable, deadline, socket FD, owner identity, or fence token.
2. **Deadline progression is isolated from the main Node event loop.** The watchdog uses an absolute `CLOCK_BOOTTIME` timerfd rather than a main-loop callback or mutable wall-clock deadline.
3. **Retries/replay do not extend the lease.** Arm identity and durable replay semantics preserve the immutable deadline; no TTL renewal path was introduced.
4. **Abort/disconnect does not silently cancel the security lease.** The independent watchdog owns the armed deadline after successful arm establishment.
5. **Stale/replaced owners cannot authorize terminal mutation.** The lease-scoped process-death-released kernel lock, owner generation/claim, fence token, authenticated peer, runtime identity, and retained artifact are revalidated through the authoritative termination path.
6. **The physical kill path is fixed and narrow.** It is bound to the exact admitted gVisor subject and fixed all-process `SIGKILL`; there is no caller-selected signal or generic lifecycle command.
7. **Cleanup/delete is not fused into the TTL authority.** R3G-D does not gain generic delete/create/start/exec/pause/unpause authority.
8. **Terminal evidence is causally ordered.** Success is not represented as complete until the required durable arm/terminal evidence and acknowledgement relationships are established.
9. **Startup recovery does not fabricate continuity.** Durable `ARM + no terminal` after owner restart is rejected fail-closed rather than reconstructed as a fresh `restart + ttlMs` lease or pathname reconnect.
10. **R3B final evidence minting is absent.** The R3G-D delta does not introduce a `SandboxBackendObservation` or `SandboxExecutionEvidence` constructor or schema mutation.
11. **No artificial product usage limit was introduced.** Existing `ttlMs` remains a workload security requirement; R3G-D does not create review, usage, file, request, or output quotas.

Manual conclusion:

```text
ARCHITECTURE_SCOPE_WIDENING=NO
GENERIC_LIFECYCLE_AUTHORITY=NO
CALLER_SELECTED_KILL_AUTHORITY=NO
TTL_RENEWAL_OR_EXTENSION=NO
R3B_FINAL_MINTING=NO
OUTPUT_LIMIT_IMPLEMENTATION=NO
EXTERNAL_PROCESS_ASK_ENABLEMENT=NO
LATER_H4_SLICE=NO
MANUAL_REVIEW=PASS
```

---

## 9. Fresh external exact-head review

Fresh external source review identity:

```text
REVIEWER=coderabbitai[bot]
PR=118
COMMENT_ID=5329674488
CREATED_AT=2026-08-18T14:33:27Z
EXACT_HEAD=111e0638acdf1ff35fb9127047602ae02ed95f7b
REVIEW_CLASS=FRESH_SOURCE_SECURITY_REVIEW
RESULT=NO_ACTIONABLE_FINDING_AGAINST_EXACT_HEAD
```

The external review explicitly did not reuse earlier-head conclusions and independently reviewed the owner-fencing / owner-crash recovery repair against the exact head. It concluded that the validated blocker is closed and that the stricter startup recovery rule cannot fabricate continuity because durable `ARM + no terminal` never returns a positive current/reconciled arm state after owner restart.

The review made one explicitly non-blocking availability observation: a fail-closed unresolved operation can abort the startup recovery decision batch, including otherwise recoverable unrelated operations. That is an availability/batch-isolation trade-off, not a security gap in the bounded R3G-D theorem.

The external review was source-only; native compilation and the full test suite are independently covered by the exact-head CI evidence in §7.

At the ledger transition:

```text
UNRESOLVED_ACTIONABLE_REVIEW_THREADS=0
```

---

## 10. Explicit nonclaims

This ledger MUST NOT be interpreted as proving or authorizing any of the following:

```text
NO malicious-host resistance theorem
NO physical termination at an exact mathematical nanosecond
NO scheduler-overrun quantitative bound
NO output-limit enforcement
NO CPU/memory proof beyond the already-canonical predecessor slice
NO filesystem/source/rootfs proof beyond the already-canonical predecessor slice
NO network proof beyond the already-canonical predecessor slice
NO credentials/secrets theorem
NO generic container lifecycle API
NO arbitrary kill/delete authority
NO Docker lifecycle mutation
NO host-PID kill fallback
NO pathname reconnect fallback
NO standalone runsc state/kill TOCTOU proof path
NO TTL renewal or extension feature
NO external-process ASK enablement
NO R3B SandboxBackendObservation minting
NO R3B SandboxExecutionEvidence minting
NO final R3B conjunction
NO R3G conjunction completion
NO H4 completion
NO later H4 slice
```

This ledger also does **not** emit the eventual bounded completion claim:

```text
KODAC_LINUX_GVISOR_PHYSICAL_TTL_LIFECYCLE_ENFORCEMENT_PROVEN
```

That claim remains blocked until the ledger commit itself passes the required post-ledger exact-head certification, review, guarded merge, and exact canonical-main post-merge verification.

---

## 11. Dedicated ledger-only transition contract

The ledger transition is authorized only with this exact parent:

```text
EXPECTED_LEDGER_PARENT=111e0638acdf1ff35fb9127047602ae02ed95f7b
```

The intended delta of the ledger commit is exactly one new path:

```text
docs/planning/KODAC_KDO_H4_R3G_D_K2_TTL_LIFECYCLE_ENFORCEMENT_EVIDENCE_2026-08-18.md
```

Required mutation counts for this commit:

```text
PRODUCTION_FILE_DELTAS=0
TEST_FILE_DELTAS=0
SCHEMA_FILE_DELTAS=0
WORKFLOW_FILE_DELTAS=0
DEPENDENCY_FILE_DELTAS=0
EVIDENCE_LEDGER_FILE_DELTAS=1
```

The exact resulting ledger commit SHA/tree/blob are intentionally not self-referentially embedded in this file. They MUST be captured from repository truth immediately after this commit and used as the post-ledger certification head.

---

## 12. Mandatory post-ledger sequence

After this dedicated ledger-only commit exists, no merge or bounded completion claim is authorized until all of the following are true on the exact ledger head:

1. verify the ledger commit parent is exactly `111e0638acdf1ff35fb9127047602ae02ed95f7b`;
2. verify the implementation-parent-to-ledger delta is exactly the one evidence document in §11;
3. verify production/test/schema/workflow/dependency byte deltas are zero;
4. run/observe fresh exact-head `governance` certification;
5. run/observe fresh exact-head `k2-runtime` certification;
6. run/observe fresh exact-head `k3-r4-adapter` certification;
7. run/observe fresh exact-head `k3-r5-context-engine` certification;
8. obtain fresh external review anchored to the exact ledger head;
9. verify zero unresolved actionable findings/threads on the exact ledger head;
10. reverify PR remains scope-bounded and mergeable against unchanged canonical `main`;
11. only then perform a guarded merge against the exact certified head;
12. verify the exact merge commit on canonical `main` and complete the required post-merge quality certification;
13. only then may the bounded R3G-D claim be recorded.

No later H4 slice may start as part of this sequence.

---

## 13. State at ledger creation

```text
R3G-D_IMPLEMENTATION_PARENT=111e0638acdf1ff35fb9127047602ae02ed95f7b
PRE_LEDGER_TECHNICAL_GATES=PASS
PRE_LEDGER_MANUAL_ARCHITECTURE_TRUST_SECURITY_REVIEW=PASS
PRE_LEDGER_FRESH_EXTERNAL_EXACT_HEAD_REVIEW=PASS
PRE_LEDGER_UNRESOLVED_ACTIONABLE_FINDINGS=0
EVIDENCE_LEDGER=THIS_TRANSITION
POST_LEDGER_CERTIFICATION=PENDING
PR_STATE=OPEN_DRAFT
READY_TRANSITION=NOT_AUTHORIZED
MERGE=NOT_AUTHORIZED
R3G-D_BOUNDED_PROVEN_CLAIM=BLOCKED
R3B_FINAL_MINTING=BLOCKED
R3G_CONJUNCTION=BLOCKED
H4_COMPLETE=NO
LATER_H4_SLICE=NOT_STARTED
```
