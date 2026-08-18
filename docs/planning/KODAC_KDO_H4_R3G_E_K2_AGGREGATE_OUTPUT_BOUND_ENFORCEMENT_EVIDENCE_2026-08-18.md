# KDO-H4-R3G-E — K2 Aggregate Output-Bound Enforcement Evidence Ledger

Date: 2026-08-18
Status: **IMPLEMENTATION-HEAD RECERTIFIED / POST-LEDGER CERTIFICATION PENDING**
Repository: `TheHalfMoon/Kodac`
PR: `#120`
Branch: `feat/kdo-h4-r3g-e-output-bound`
Canonical authorization: `docs/planning/KODAC_KDO_H4_R3G_E_K2_AGGREGATE_OUTPUT_BOUND_ENFORCEMENT_AUTHORIZATION_2026-08-18.md`

---

## 1. Ledger purpose and refresh boundary

This is the dedicated Section 28 evidence-ledger refresh for H4-R3G-E.

The earlier ledger head:

```text
32c46909b022c421e9028cae94368fdeb8a44be1
```

was superseded after an external review identified a valid package-root authority-surface concern. One bounded source repair then produced the final recertified implementation head:

```text
75145298d3d877496eedeea04f964df191da3697
```

That repair changes only `packages/kodac-runtime/src/index.ts` and removes the raw caller-selectable Docker output transport factory and transport/config/capture types from the package-root export surface. It does not change runtime orchestration, Docker transport behavior, trust/evidence contracts, tests, schemas, workflows, dependencies, R3G-D, R3B, R3G-F, or later-H4 authority.

This refreshed ledger records the final implementation parent, source/test identities, R3F/output-opener provenance, pinned Moby/API study identities, hostile proof results, workflow/run identities, review identities, review reconciliation, and explicit nonclaims that were true before this ledger refresh was committed.

This ledger does **not** self-record its own commit SHA. Its own SHA is established externally by Git after these bytes are committed.

This ledger adds no product authority and MUST NOT be interpreted as post-ledger certification. Fresh exact-head post-ledger workflows and a fresh external exact-head review remain required before Ready or merge.

---

## 2. Canonical authorization and base

Authorization blob:

```text
docs/planning/KODAC_KDO_H4_R3G_E_K2_AGGREGATE_OUTPUT_BOUND_ENFORCEMENT_AUTHORIZATION_2026-08-18.md
6c139177f5e7dc829998d7e1b6a5357df9b6b199
```

Canonical PR base / main at implementation recertification:

```text
c3e119599650c595798e022401fba3cdc6941286
```

The product implementation scope remains exactly the six authorized R3G-E source/test files recorded below. The evidence ledger Markdown file is non-authority documentation and is also present in the branch ancestry because the earlier Section 28 ledger transition preceded the final package-root authority-surface repair.

No authorization byte changed during reconciliation.

---

## 3. Exact final implementation parent

The exact recertified implementation parent of this ledger refresh is:

```text
IMPLEMENTATION_PARENT_SHA=75145298d3d877496eedeea04f964df191da3697
IMPLEMENTATION_PARENT_TREE=9711da1668bb98bd374e6a318625c400e6e944de
SUPERSEDED_LEDGER_HEAD=32c46909b022c421e9028cae94368fdeb8a44be1
PR_SYNTHETIC_MERGE_COMMIT=6deb8f51d0da965778e8b6fbab9ff3cd0d677b37
```

PR state at final pre-refresh verification:

```text
OPEN
DRAFT
MERGED=NO
MERGEABLE=YES
CHANGED_FILES=7
BASE=c3e119599650c595798e022401fba3cdc6941286
HEAD=75145298d3d877496eedeea04f964df191da3697
```

The refreshed ledger transition is permitted only because the exact implementation-head technical gates, manual trust/security review, fresh external exact-head reviews, and actionable-thread reconciliation are clean on this exact parent.

---

## 4. Exact source and test blob identities

Certified implementation blobs:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
b55e5068682d9ae824a619b682c694c3a95e6095

packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
6d1227c6f545194c644ec5b9bc7d07135fc789e2

packages/kodac-runtime/src/index.ts
9876c73cfa576c97e7bb545ab2d3e3e157e32efe

packages/kodac-runtime/test/kdo-h4-r3g-e-runtime.test.ts
e1add4192894254966332d1f5c00b32146758462

packages/kodac-runtime/test/kdo-h4-r3g-e-output-contract.test.ts
2c367d5688eb80e773eb230c0866c32be5f7aa1b

packages/kodac-runtime/test/kdo-h4-r3g-e-docker-stream.test.ts
99aa62d1e627efbfb3ef0a1e025e38a98244abb7
```

Base-to-final-parent PR changed paths are exactly:

```text
A docs/planning/KODAC_KDO_H4_R3G_E_K2_AGGREGATE_OUTPUT_BOUND_ENFORCEMENT_EVIDENCE_2026-08-18.md
A packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
M packages/kodac-runtime/src/index.ts
A packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
A packages/kodac-runtime/test/kdo-h4-r3g-e-docker-stream.test.ts
A packages/kodac-runtime/test/kdo-h4-r3g-e-output-contract.test.ts
A packages/kodac-runtime/test/kdo-h4-r3g-e-runtime.test.ts
```

The Markdown path is evidence-only. The product implementation delta remains exactly the six R3G-E source/test files.

No R3G-D, R3G-B, native, schema, workflow, dependency, R3G-F, or later-H4 bytes are part of the certified product implementation delta.

---

## 5. R3F provider, output opener, and package-root authority identity

Canonical R3F implementation consumed by R3G-E:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
blob f9e2dda11fe26d481e2e6c328c37cd37a6260106
KDO_H4_R3F_PROVIDER_ID=docker-engine
KDO_H4_R3F_DOCKER_API_VERSION=1.48
```

Certified R3G-E output opener implementation:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
blob b55e5068682d9ae824a619b682c694c3a95e6095

KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION=kodac-h4-r3g-e-docker-output-transport-v1
KDO_H4_R3G_E_DOCKER_API_VERSION=1.48
KDO_H4_R3G_E_ATTACH_PATH_SUFFIX=attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1
KDO_H4_R3G_E_ATTACH_MEDIA_TYPE=application/vnd.docker.multiplexed-stream
```

R3G-E does not accept a caller-selected output transport in `GvisorOutputExecutionGatewayConfig`. The canonical K2 composition supplies the R3F provider and exact Docker Unix-socket path, and R3G-E re-establishes provider resolver provenance through the existing private R3F resolver registry before trusted lifecycle/output activity.

The final package-root authority-surface repair is:

```text
commit 75145298d3d877496eedeea04f964df191da3697
index blob 9876c73cfa576c97e7bb545ab2d3e3e157e32efe
```

At package root, R3G-E selectively exports the canonical execution gateway and the runtime/evidence constants, helpers, and types required by that gateway. It intentionally does **not** root-export:

```text
createGvisorDockerOutputTransport
GvisorDockerOutputTransport
GvisorDockerOutputTransportConfig
GvisorDockerOutputCapture
```

This closes the public caller-selectable mutable-host-locator surface identified during post-ledger review and aligns the root surface with authorization Section 17. Direct deep-module use remains an internal repository/test seam and is not package-root authority.

The opener binds the exact execution attempt, requirement, workload, R3F provider identity, exact Unix-socket endpoint identity, exact container binding/ID, and R3G-D runtime-instance lineage before positive output evidence is possible.

---

## 6. Pinned Moby source/API identities

The authorization pins protocol study to:

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
RUN_ID=32184181321
JOB_ID=95863940241
NODE=24.19.0
TYPECHECK=PASS
TESTS_TOTAL=738
TESTS_PASS=734
TESTS_FAIL=0
TESTS_SKIPPED=4
```

The four suite-level skips are platform-conditioned tests; required Linux R3G-E physical/runtime proofs executed on Ubuntu.

Exact R3G-E result summary:

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
- caller abort while positive durable commit is pending prevents positive E3 persistence and durably terminalizes the proven asynchronous path as `output-failure:aborted`;
- a real `node:vm` cross-realm Promise remains structurally classified as asynchronous, K2 waits authoritative mutation settlement after abort wins, durable `output-failure:aborted` follows that settlement, and no immediate or late positive E3 appears.

The final package-root authority repair changed only `src/index.ts`; the runtime/trust/test blobs above remained byte-identical. The complete exact-head K2 suite therefore re-proved the same hostile/runtime theorem after that repair.

---

## 9. Exact implementation-head workflow identities

All required implementation-head workflows are associated with exact implementation parent:

```text
IMPLEMENTATION_HEAD=75145298d3d877496eedeea04f964df191da3697
PR_SYNTHETIC_MERGE_COMMIT=6deb8f51d0da965778e8b6fbab9ff3cd0d677b37
PR_BASE=c3e119599650c595798e022401fba3cdc6941286
```

Certified workflow runs:

```text
governance #1697
run_id=32184181381
conclusion=SUCCESS

k2-runtime #729
run_id=32184181321
conclusion=SUCCESS
runtime-change-classifier=SUCCESS
ubuntu-typecheck-tests=SUCCESS
macos-typecheck-tests=SUCCESS
windows-typecheck-tests=SUCCESS
k2-runtime-gate=SUCCESS

k3-r4-adapter #397
run_id=32184181316
conclusion=SUCCESS

k3-r5-context-engine #370
run_id=32184181358
conclusion=SUCCESS
```

All four workflows passed directly on the exact implementation head. No same-SHA rerun or source mutation was required after these runs.

---

## 10. Review identities and reconciliation

### Manual exact-head architecture / trust / security review

```text
REVIEWER=repository owner / manual Section 26 reconciliation
REVIEW_COMMENT_ID=5333882330
REVIEW_HEAD=75145298d3d877496eedeea04f964df191da3697
R3G_E_MANUAL_TRUST_SECURITY_REVIEW_PASS_HEAD=75145298d3d877496eedeea04f964df191da3697
BOUNDARY_DRIFT=NONE_DETECTED
```

The manual delta review confirms that runtime/trust/test blobs are unchanged from the previously certified theorem and that the only source mutation narrows the package-root authority surface in the direction required by authorization Section 17.

### Qodo fresh exact-head review

```text
REVIEWER=Qodo
CANONICAL_REVIEW_COMMENT_ID=5332617611
REVIEW_SUBMISSION=PRR_kwDOTVTeS88AAAABJ_od0w
UPDATED_THROUGH=75145298d3d877496eedeea04f964df191da3697
MODE=Balanced
```

The current-head Qodo review produced one new maintainability finding:

```text
Finding: Recovery config remains inaccessible
Thread: PRRT_kwDOTVTeS86aQlyE
Disposition: REJECTED_WITH_CANONICAL_EVIDENCE
Disposition comment: 5333959684
Thread resolved: YES
```

The finding was rejected because the same root-export dependency pattern predates R3G-E on canonical base (`GvisorTtlExecutionGatewayConfig` already references the non-root-exported recovery config), `@kodac/runtime-internal` is a private internal package, and exporting unrelated pre-existing recovery authority solely to satisfy this suggestion would widen rather than narrow the package-root surface.

The historical Qodo `Pre-attach output bypasses bound` finding remains dismissed/rejected with canonical authorization evidence: R3G-E v1 intentionally uses `logs=0`, starts at the trusted admission boundary, and does not claim pre-admission historical output reconstruction.

### CodeRabbit fresh exact-delta review

```text
REVIEWER=CodeRabbit
MAIN_COMMENT_ID=5330576863
RUN_ID=51ba0317-b09b-46db-a5b0-6c53d5aa23c6
RANGE=32c46909b022c421e9028cae94368fdeb8a44be1..75145298d3d877496eedeea04f964df191da3697
FILES_REVIEWED=packages/kodac-runtime/src/index.ts
STATUS=SUCCESS
ACTIONABLE_COMMENTS=0
```

The exact-delta recent-review result states that no actionable comments were generated.

Any generic/stale high-level walkthrough prose that summarizes earlier PR risk is not an unresolved review finding for this exact delta. The exact-delta run generated no actionable thread.

### Final reconciliation

```text
UNRESOLVED_ACTIONABLE_FINDINGS=0
UNRESOLVED_REVIEW_THREADS=0
IMPLEMENTATION_HEAD_EXTERNAL_REVIEW_GATE=CLEAN
```

---

## 11. Boundary-drift and authority-isolation result

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

`packages/kodac-runtime/src/index.ts` is now a selective R3G-E package-root export surface. The raw caller-selectable Docker output transport factory/config/capture types are intentionally excluded from the package root.

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

## 13. Ledger-only refresh invariant

This dedicated ledger refresh is allowed to modify only this Markdown evidence file.

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

The implementation source/test blob identities in Section 4 must therefore remain byte-identical at the refreshed ledger head.

The exact transition:

```text
75145298d3d877496eedeea04f964df191da3697
-> refreshed ledger head
```

must be documentation-only and confined to this evidence path.

---

## 14. Post-ledger state is intentionally pending

At the moment represented by this refreshed ledger's parent evidence:

```text
IMPLEMENTATION_HEAD_GATE=CLEAN
LEDGER_REFRESH=AUTHORIZED
SUPERSEDED_LEDGER_HEAD=32c46909b022c421e9028cae94368fdeb8a44be1
POST_LEDGER_EXACT_HEAD_CERTIFICATION=PENDING
POST_LEDGER_FRESH_EXTERNAL_REVIEW=PENDING
PR_READY=NO
MERGE=BLOCKED
BOUNDED_CANONICAL_R3G_E_CLAIM=NOT_YET_AUTHORIZED
R3G_F=NOT_STARTED
LATER_H4=NOT_STARTED
```

After this refreshed ledger file is committed, its new exact head must independently pass the required post-ledger workflow and fresh-review certification. Only after that exact ledger head is certified may the canonical Ready / guarded-merge procedure proceed.

The eventual bounded claim remains unavailable until guarded merge and exact merge-commit post-merge certification are complete.
