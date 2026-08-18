# KDO-H4-R3G-E — K2 Aggregate Output-Bound Enforcement Evidence Ledger

Date: 2026-08-18
Status: **IMPLEMENTATION-HEAD CERTIFIED / POST-LEDGER CERTIFICATION PENDING**
Repository: `TheHalfMoon/Kodac`
PR: `#120`
Branch: `feat/kdo-h4-r3g-e-output-bound`
Canonical authorization: `docs/planning/KODAC_KDO_H4_R3G_E_K2_AGGREGATE_OUTPUT_BOUND_ENFORCEMENT_AUTHORIZATION_2026-08-18.md`

---

## 1. Ledger purpose and boundary

This is the dedicated Section 28 evidence-ledger-only transition for H4-R3G-E.

It records the exact implementation parent, source/test identities, trusted R3F/output-opener provenance, pinned Moby/API study identities, hostile proof results, workflow/run identities, review identities, and explicit nonclaims that were true before this ledger commit was created.

This ledger does **not** self-record its own commit SHA. Its own SHA is established externally by Git after these bytes are committed.

This ledger adds no product authority and MUST NOT be interpreted as post-ledger certification. Fresh exact-head post-ledger workflows and a fresh external exact-head review remain required before Ready or merge.

---

## 2. Canonical authorization and base

Authorization blob:

```text
docs/planning/KODAC_KDO_H4_R3G_E_K2_AGGREGATE_OUTPUT_BOUND_ENFORCEMENT_AUTHORIZATION_2026-08-18.md
6c139177f5e7dc829998d7e1b6a5357df9b6b199
```

PR base / canonical main at implementation certification:

```text
c3e119599650c595798e022401fba3cdc6941286
```

The implementation parent is 38 commits ahead of that base and changes exactly the six authorized R3G-E files recorded below.

---

## 3. Exact implementation parent

The exact certified implementation parent of this ledger transition is:

```text
IMPLEMENTATION_PARENT_SHA=7ae2f118eb463291f8bd424673b3e80df10533b0
IMPLEMENTATION_PARENT_TREE=51c2605e610ffba618aeb7f545c3e114661108f1
```

PR state at the final pre-ledger verification:

```text
OPEN
DRAFT
MERGED=NO
MERGEABLE=YES
CHANGED_FILES=6
```

The dedicated ledger transition is permitted only because the implementation-head technical gates, manual trust/security review, fresh external exact-head review, and actionable-thread reconciliation were already clean on this exact parent.

---

## 4. Exact source and test blob identities

Certified implementation blobs:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
b55e5068682d9ae824a619b682c694c3a95e6095

packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
6d1227c6f545194c644ec5b9bc7d07135fc789e2

packages/kodac-runtime/src/index.ts
d6566d44c8a6fc2751179f4044b7a3236ad94d78

packages/kodac-runtime/test/kdo-h4-r3g-e-runtime.test.ts
e1add4192894254966332d1f5c00b32146758462

packages/kodac-runtime/test/kdo-h4-r3g-e-output-contract.test.ts
2c367d5688eb80e773eb230c0866c32be5f7aa1b

packages/kodac-runtime/test/kdo-h4-r3g-e-docker-stream.test.ts
99aa62d1e627efbfb3ef0a1e025e38a98244abb7
```

Base-to-implementation-parent scope is exactly:

```text
A packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
M packages/kodac-runtime/src/index.ts
A packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
A packages/kodac-runtime/test/kdo-h4-r3g-e-docker-stream.test.ts
A packages/kodac-runtime/test/kdo-h4-r3g-e-output-contract.test.ts
A packages/kodac-runtime/test/kdo-h4-r3g-e-runtime.test.ts
```

No R3G-D, R3G-B, native, schema, workflow, dependency, R3G-F, or later-H4 bytes are part of the certified implementation delta.

---

## 5. R3F provider and output-opener identity

Canonical R3F implementation consumed by R3G-E:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
blob f9e2dda11fe26d481e2e6c328c37cd37a6260106
KDO_H4_R3F_PROVIDER_ID=docker-engine
KDO_H4_R3F_DOCKER_API_VERSION=1.48
```

R3G-E does not accept a caller-selected output transport. The K2 composition supplies the canonical R3F provider and exact Docker Unix-socket path, and R3G-E re-establishes the provider resolver provenance through the existing private R3F resolver registry before trusted lifecycle/output activity.

Certified R3G-E output opener implementation:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
blob b55e5068682d9ae824a619b682c694c3a95e6095

KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION=kodac-h4-r3g-e-docker-output-transport-v1
KDO_H4_R3G_E_DOCKER_API_VERSION=1.48
KDO_H4_R3G_E_ATTACH_PATH_SUFFIX=attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1
KDO_H4_R3G_E_ATTACH_MEDIA_TYPE=application/vnd.docker.multiplexed-stream
```

The opener binds the exact execution attempt, requirement, workload, R3F provider identity, exact Unix-socket endpoint identity, exact container binding/ID, and R3G-D runtime-instance lineage before positive output evidence is possible.

---

## 6. Pinned Moby source/API identities

The authorization pins the protocol study to:

```text
MOBY_SOURCE_PIN=d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
MOBY_API_VERSION=1.48
MOBY_API_SOURCE=api/docs/v1.48.yaml
MOBY_API_SOURCE_BLOB=7b11c5d00028046576aad721c6a5fc83cbac4fa9
```

R3G-E adds no Moby dependency and copies no Moby implementation code.

---

## 7. Certified output theorem implemented by the parent

The implementation parent enforces only the bounded canonical R3G-E v1 output-acceptance theorem:

```text
one exact admitted Linux Docker/gVisor execution attempt
+ one trusted non-TTY Docker attach channel
+ logs=0
+ stream=1
+ stdin=0
+ stdout=1
+ stderr=1
+ one shared raw-payload stdout+stderr byte counter
+ exact N accepted
+ N+1 rejected before offending payload acceptance
+ durable create-once attempt reservation
+ positive E3 only after exact R3G-D terminal evidence
+ fail closed on ambiguity, replacement, malformed framing, overflow, or unproven durable settlement
```

The Docker 8-byte multiplex frame header is transport metadata and does not consume the workload byte allowance. Only raw stdout/stderr payload bytes consume the single shared aggregate budget.

Pre-admission container output history is intentionally not reconstructed. `logs=1` is not used as a history substitute.

---

## 8. Exact hostile proof results

Exact-parent Ubuntu K2 runtime job:

```text
RUN_ID=32179609193
JOB_ID=95849333271
NODE=24.19.0
TYPECHECK=PASS
TESTS_TOTAL=738
TESTS_PASS=734
TESTS_FAIL=0
TESTS_SKIPPED=4
```

The four suite-level skips are platform-conditioned tests; required Linux R3G-E physical/runtime proofs executed on Ubuntu.

Exact R3G-E results observed in that job:

```text
R3G_E_LINUX_PASS=24
R3G_E_LINUX_FAIL=0
R3G_E_NON_LINUX_ONLY_SKIP_ON_UBUNTU=1
```

The passing R3G-E proof set includes:

- exact canonical R3F provider/list/inspect/attach multiplex positive path;
- strict `AttachStdout=true`, `AttachStderr=true`, `AttachStdin=false`, `OpenStdin=false`, `Tty=false` admission;
- rejection of non-multiplexed/malformed Docker upgrade identity;
- overflow closes the accepted stream and same-attempt replay cannot replenish budget;
- caller abort destroys the owned upgraded stream and cannot become late success;
- Unix-socket replacement rejection before trusted output I/O;
- exact Moby/API pin test;
- fragmented/interleaved stdout+stderr frames share one byte budget;
- inclusive exact N boundary and transport-header exclusion;
- N+1 rejection at the offending frame header without per-stream allowances;
- raw UTF-8 byte counting and zero-length-frame non-replenishment;
- malformed stream/reserved bits/incomplete framing rejection;
- oversized declared frame rejection before payload-sized allocation;
- transcript digest stream/frame-boundary binding;
- deterministic E3 record distinct from final R3B evidence;
- durable R3G-D ARM -> output reservation -> canonical R3F attach/capture -> terminal -> positive-E3 ordering;
- continuous zero-length output cannot hold the channel after lifecycle terminalization;
- abort during durable reservation waits authoritative settlement and never attaches afterward;
- alternate socket rejection before lifecycle/reservation/I/O;
- structurally forged provider rejection even with its own valid matching Unix socket;
- ASK blocked before provider/path/lifecycle/reservation/output activity;
- synchronous positive mutation begins with no abort microtask gap;
- caller abort while positive durable commit is pending prevents positive E3 persistence and durably terminalizes the proven async path as `output-failure:aborted`;
- a real `node:vm` cross-realm Promise remains structurally classified as asynchronous, K2 waits authoritative mutation settlement after abort wins, durable `output-failure:aborted` follows that settlement, and no immediate or late positive E3 appears.

The same full-suite run also passed the direct R3F and R3G-D predecessor proofs used by the R3G-E composition.

---

## 9. Exact implementation-head workflow identities

All required implementation-head workflows were associated with exact PR head:

```text
IMPLEMENTATION_HEAD=7ae2f118eb463291f8bd424673b3e80df10533b0
PR_SYNTHETIC_MERGE_COMMIT=96604d79c77f2d1052ca64a922bca6fe837fa3b4
PR_BASE=c3e119599650c595798e022401fba3cdc6941286
```

Certified workflow runs:

```text
governance #1693
run_id=32179609301
conclusion=SUCCESS

k2-runtime #727
run_id=32179609193
conclusion=SUCCESS
runtime-change-classifier=SUCCESS
ubuntu-typecheck-tests=SUCCESS
macos-typecheck-tests=SUCCESS
windows-typecheck-tests=SUCCESS
k2-runtime-gate=SUCCESS

k3-r4-adapter #395
run_id=32179609291
conclusion=SUCCESS

k3-r5-context-engine #368
run_id=32179609256
conclusion=SUCCESS_AFTER_SAME_SHA_RERUN
```

The first K3-R5 attempt's only failing test was the pre-existing predecessor timing test:

```text
H4-R3G-B global deadline expiry during ctr reaps the child before returning failure
```

All R3G-E tests in that first attempt were already PASS. The failed K3-R5 job was rerun on the same exact source SHA without source mutation and passed. No R3G-B change was made or authorized.

---

## 10. Review identities and reconciliation

Fresh external exact-head review:

```text
REVIEWER=Qodo
CANONICAL_REVIEW_COMMENT=https://github.com/TheHalfMoon/Kodac/pull/120#issuecomment-5332617611
REVIEW_COMMENT_ID=5332617611
UPDATED_THROUGH=7ae2f118eb463291f8bd424673b3e80df10533b0
BUGS=0
RULE_VIOLATIONS=0
ACTIONABLE_FRESH_FINDINGS=0
```

The fresh review was explicitly instructed to evaluate the repaired structural Promise/thenable fence, the real cross-realm Promise regression, the canonical `logs=0` admission/history boundary, and the synchronous-success-after-abort trust-contract distinction against the exact authorization rather than stale thread state.

Manual exact-parent architecture/trust/security review:

```text
REVIEW_COMMENT=https://github.com/TheHalfMoon/Kodac/pull/120#issuecomment-5333428158
REVIEW_COMMENT_ID=5333428158
REVIEW_HEAD=7ae2f118eb463291f8bd424673b3e80df10533b0
R3G_E_MANUAL_TRUST_SECURITY_REVIEW_PASS
R3G_E_IMPLEMENTATION_HEAD_GATE=CLEAN
BOUNDARY_DRIFT=NONE_DETECTED
R3G_D_BYTE_PROTOCOL_ISOLATION=PASS
```

All existing PR review threads were resolved before this ledger transition.

The prior Qodo request to synthesize `output-failure:aborted` after a trusted synchronous callback returned success while the signal had become aborted was explicitly rejected as unsafe remediation. In that state K2 cannot prove that positive E3 was not persisted, so synthesizing failure evidence could create contradictory `POSITIVE E3 + FAILURE` durable truth. The implementation therefore fails closed as a trusted-positive-callback contract violation and only emits durable `output-failure:aborted` for the proven asynchronous abort-before-durable-settlement path.

---

## 11. Boundary-drift and authority isolation result

```text
BOUNDARY_DRIFT=NONE_DETECTED
R3G_D_BYTE_PROTOCOL_ISOLATION=PASS
R3A_WORKLOAD_MUTATION=NO
R3B_FINAL_MINTING=BLOCKED
R3G_D_LIFECYCLE_AUTHORITY_MUTATION=NO
DOCKER_KILL_STOP_START_RESTART_REMOVE_EXEC=NO
HOST_PID_SIGNALING=NO
EXTERNAL_PROCESS_ASK=BLOCKED
R3G_FINAL_CONJUNCTION=BLOCKED
H4_COMPLETE=NO
R3G_F=NOT_STARTED
LATER_H4=NOT_STARTED
```

`packages/kodac-runtime/src/index.ts` changes are additive R3G-E exports only.

No generic Docker lifecycle authority, host-process authority, final R3B evidence minting, R3G conjunction, or later-H4 authority is introduced by the certified implementation parent.

---

## 12. Explicit nonclaims

R3G-E does **not** prove or authorize:

```text
NO historical total-output reconstruction before R3G-E admission
NO Docker log-retention bound
NO container filesystem/log-driver storage bound
NO network-output bound
NO stdin/input bound
NO TTY/PTTY output theorem
NO WebSocket attach theorem
NO container kill-on-output-overflow
NO generic Docker kill/stop/start/remove/restart/exec authority
NO host PID kill authority
NO R3G-D watchdog command extension
NO TTL renewal or extension
NO R3B final capability/observation/execution-evidence minting
NO R3G final conjunction
NO H4 completion
NO R3G-F implementation
NO later-H4 implementation
```

The canonical `maxOutputBytes` field is an execution sandbox resource-policy authority already bound into the admitted workload contract. It is **not** a Kodac product-usage quota.

R3G-E introduces no:

```text
daily review limit
PR review limit
arbitrary file limit
artificial busy state
trial exhaustion
vendor-controlled waiting queue
unrelated product output quota
```

---

## 13. Ledger-only transition invariant

This dedicated ledger transition is allowed to add only this Markdown evidence file.

It MUST NOT modify:

```text
production bytes
test bytes
schema bytes
workflow bytes
dependency bytes
authorization bytes
predecessor bytes
```

The implementation source/test blob identities in Section 4 must therefore remain byte-identical at the ledger head.

---

## 14. Post-ledger state is intentionally pending

At the moment represented by this ledger's parent evidence:

```text
IMPLEMENTATION_HEAD_GATE=CLEAN
LEDGER_TRANSITION=AUTHORIZED
POST_LEDGER_EXACT_HEAD_CERTIFICATION=PENDING
POST_LEDGER_FRESH_EXTERNAL_REVIEW=PENDING
PR_READY=NO
MERGE=BLOCKED
BOUNDED_CANONICAL_R3G_E_CLAIM=NOT_YET_AUTHORIZED
R3G_F=NOT_STARTED
LATER_H4=NOT_STARTED
```

After this ledger file is committed, its new exact head must independently pass the required post-ledger workflow and fresh-review certification. Only after that exact ledger head is certified may the canonical Ready/guarded-merge procedure proceed.

The eventual bounded claim remains unavailable until guarded merge and exact merge-commit post-merge certification are complete.
