# KDO-H4-R3E — K2 gVisor Observer Exact-Instance Binding Evidence

Date: 2026-08-16
Status: POST-LEDGER CERTIFICATION PENDING
Repository: `TheHalfMoon/Kodac`

## 1. Evidence decision

```text
GATE:
KDO-H4-R3E

PRE-LEDGER DECISION:
PASS

CANONICAL AUTHORIZATION BASE:
c016a095f8005a75d254b3cc7fe6b3db849bc97b

ACCEPTED PRE-LEDGER HEAD:
d11cb8da51d56500b049058c398ec3028b913e3b

ACCEPTED PRE-LEDGER TREE:
2813c2c02426aab38a9bf7d3df16754b956cbb16

BOUNDED TARGET:
K2 GVISOR OBSERVER INTEGRATION / EXACT-INSTANCE BINDING

EVIDENCE CLASS:
E3-INTEGRATED-RUNTIME-LINEAGE ONLY

R3B PHYSICAL OBSERVATION MINTING:
NONE

DOCKER / CONTAINERD CONTROL-PLANE AUTHORITY:
NONE

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO
```

This ledger records accepted pre-ledger evidence only. Fresh exact-head post-ledger certification is mandatory before merge, and the bounded claim remains unavailable until canonical merge.

## 2. Canonical authorization

Canonical authorization document:

```text
docs/planning/KODAC_KDO_H4_R3E_K2_GVISOR_OBSERVER_EXACT_INSTANCE_BINDING_AUTHORIZATION_2026-08-15.md
38834ab9c6238043a31b8ccda8919f8d981d906d
```

The authorization reserved this exact evidence-ledger path and allowed ledger creation only after exact-head pre-ledger PASS.

The evidence-ledger path was absent at the accepted pre-ledger head.

## 3. Exact pre-ledger scope

Exactly twelve changed paths existed from canonical authorization base to accepted pre-ledger head:

```text
1.  packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
2.  packages/kodac-runtime/src/execution/gateway.ts
3.  packages/kodac-runtime/src/index.ts
4.  packages/kodac-runtime/test/kdo-h4-r3e-k2-gvisor-observer-integration.test.ts
5.  packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
6.  packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
7.  packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
8.  packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
9.  packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
10. packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
11. packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
12. packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

No thirteenth pre-ledger path existed.

The eight predecessor-test modifications are each a one-line replacement of only the superseded `gateway.ts` blob pin with the accepted R3E gateway blob. Their original behavioral theorems remain intact.

## 4. Accepted implementation blobs

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
1d02a5dbc1dc4071636c24327e7faf9906370ef5

packages/kodac-runtime/src/execution/gateway.ts
420df04c5e0a42b371a250d75e580c36bb32f8cb

packages/kodac-runtime/src/index.ts
927cd88e676170dd9ede92b2ff04db9b8cd71649

packages/kodac-runtime/test/kdo-h4-r3e-k2-gvisor-observer-integration.test.ts
33cb1fa267edaad15d8d3c0e3498cc9f57df66bd
```

The ledger-only transition must preserve all four byte-identically.

## 5. Accepted predecessor reconciliation blobs

```text
packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
93502467af605efeade66fb5fbe82b96380f87ce

packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
435d70f58114325e77ba5a6f3757bdd1629ce812

packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
ac32f73936ba8b96db35080ca99a19a3dc5cbd9f

packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
812332e8c575f8cf90aabafff4792c217a703888

packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
c2774df01a12fd74bbb967b13e358b1efcbd874b

packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
158d3b56450b488078258121328c891595e73a87

packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
199e2e91f2388d347d51f9abf0c5005e9af14e94

packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
1fbd67bee7c5b8330e3ae1ffc56bc64072cf6ac0
```

Patch-shape review at the accepted pre-ledger head confirmed that each of these eight files differs from canonical base only by the one authorized `gateway.ts` blob-pin line.

## 6. Canonical R3D primitive preservation

R3E did not modify the canonical R3D primitive surfaces:

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
277b66c83ad82c96aa7dbd71f941daf8c6627738

packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
47c792ba01c9ba4b2db94d7558f282cdbd218660
```

The R3E focused proof explicitly asserts these blobs remain canonical.

## 7. Integrated lineage theorem

The accepted implementation establishes only the following bounded conjunction:

```text
validated R3B gvisor requirement
+
K2-created execution-attempt identity
+
trusted E2 resolver full 64-lowerhex container binding
+
same-FD verified runsc artifact on FD 3
+
same-FD verified observer-helper artifact on FD 4
+
state #1 / process #1 / stats / state #2 / process #2 exact-instance bracket
+
final same-FD artifact re-verification
+
strict durable lineage-record acknowledgment
=
E3 integrated runtime-lineage record
```

The public caller does not supply a container ID and cannot override runsc path, helper path, trusted artifact digests, runtime root, resolver, or durable commit interface.

The runtime-lineage record remains structurally separate from `SandboxBackendObservation` / `SandboxExecutionEvidence` and contains none of the R3B physical-policy fields.

## 8. Same-FD and exact-instance proof

Production observer invocation uses:

```text
FD 3 = retained verified runsc artifact
FD 4 = retained verified observer-helper artifact
```

Runsc commands execute through:

```text
/proc/self/fd/3
```

The observer helper executes through:

```text
/proc/self/fd/4
```

while receiving the same retained runsc artifact on child FD 3.

The Linux focused fixture renames the parent artifact directory after the first state call. Later state/stats/helper calls still succeed, proving the implementation continues through retained descriptors instead of reopening configured artifact paths.

The bracket requires exact equality of initial/final state and process identities. R3D process identity binds PID, process start ticks, executable device, inode, and size, so process replacement/PID reuse/exec drift is rejected.

## 9. Receipt and failure semantics

A Qodo review identified that an earlier R3E gateway head returned lineage success/failure outside the generic gateway receipt contract.

The accepted gateway corrects that defect:

- successful `runtime.observe.gvisor` returns only after durable lineage acknowledgment and successful persistence of one success `ExecutionReceipt`;
- the receipt output digest binds the exact serialized immutable lineage record and records its UTF-8 byte length;
- operational failures create/persist one failure receipt and throw `ExecutionFailedError` with receipt context;
- `ExecutionUnprovenError` from receipt persistence remains fail-closed and is not rewritten as an ordinary execution failure;
- policy denial, `ask`, unsupported platform, missing trusted runtime, and pre-start abort remain blocked outcomes.

The focused suite proves both the success-receipt path and wrong durable-acknowledgment failure-receipt path.

## 10. Compiler-prerequisite remediation

Qodo also identified that an earlier Linux focused fixture assumed `cc` existed without repository-standard prerequisite handling.

The accepted focused suite probes `cc --version` before compilation. In GitHub Actions absence is a clear failure; outside GitHub Actions the integration fixture can explicitly skip. This matches the repository's existing Linux integration convention and prevents an ambiguous fixture failure.

Both Qodo review threads are resolved at the accepted pre-ledger head.

## 11. Reconciliation integrity history

Two historical test-reconciliation mistakes occurred before the accepted pre-ledger head and were rejected rather than certified:

1. an earlier `H5-R4A` contents-API rewrite unintentionally changed broad test content; exact-head TypeScript CI exposed the corruption, and the file was restored from its canonical blob with only the authorized gateway-pin replacement;
2. an earlier `H4-R3B` reconciliation temporarily changed the wrong-requirement assertion from the canonical theorem; explicit PR patch-shape review caught it before certification, and the canonical assertion was restored.

At the accepted pre-ledger head, all eight predecessor-test patches were re-inspected and contain only their authorized one-line gateway pin replacement.

No superseded reconciliation head is accepted evidence.

## 12. Cancellation, timeout, and late-event review

Manual exact-head review confirmed:

- owned observer child commands receive explicit timeout/cancellation and are killed with `SIGKILL` on timeout/abort;
- retained runsc/helper descriptors close in the gateway `finally` path;
- a timeout/cancellation before durable acknowledgment cannot return an R3E success object;
- the trusted external commit callback may complete after the local timeout race, but such a late evidence event cannot revise the already-terminal failure result, satisfying the authorization's late-event rule;
- R3E never kills or mutates the observed gVisor sandbox itself.

No fallback to weaker subject/artifact evidence exists.

## 13. Fresh exact-head pre-ledger CI

Accepted pre-ledger head:

```text
d11cb8da51d56500b049058c398ec3028b913e3b
```

### Governance / legacy / provenance

```text
run 31918900645
legacy-tests 95095375268 — PASS
provenance 95095375281 — PASS
```

`legacy-tests` includes both `pytest` and `ruff check .`.

### K2 runtime

```text
run 31918900638
runtime-change-classifier 95095375263 — PASS
Ubuntu runtime 95095385723 — PASS
macOS runtime 95095385737 — PASS
Windows runtime 95095385764 — PASS
k2-runtime-gate 95095462389 — PASS
```

Each OS runtime passed Typecheck, full Test, and patch benchmark.

Ubuntu exact-head log additionally records:

```text
565 tests
564 pass
0 fail
1 expected skip
```

The Linux live R3E same-FD exact-instance proof passed, the wrong durable-acknowledgment failure-receipt proof passed, and the patch benchmark completed 10,000 iterations successfully.

### K3-R4

```text
run 31918900650
k3-r4-adapter 95095375231 — PASS
```

### K3-R5

```text
run 31918900647
k3-r5-context-engine 95095375354 — PASS
```

## 14. Review state

Exact accepted pre-ledger head review state:

```text
unresolved actionable review threads:
0

Qodo actionable findings:
2 historical findings, both resolved

CodeRabbit commit status context:
success

manual exact-head trust/security review:
PASS
```

CodeRabbit's visible walkthrough/risk prose still references an older implementation snapshot and is not treated as a fresh substantive exact-head certification. The exact-head certification relies on required repository gates, zero unresolved review threads, Qodo remediation state, and manual trust/security review.

## 15. Explicit non-authority

R3E does not prove or authorize:

```text
R3B physical source-digest proof
R3B deny-all network proof
R3B CPU enforcement proof
R3B memory enforcement proof
R3B TTL enforcement proof
R3B output-limit enforcement proof
Docker/containerd socket access
container creation or lifecycle mutation
real workload creation
registry access
cgroup/netns inspection
R3B observation/evidence minting
external-process ask
H4 closure
H6 work
```

The accepted result is read-only observer integration and exact-instance lineage only.

## 16. Post-ledger requirement and maximum bounded claim

This ledger commit does not itself prove R3E.

The ledger-bearing exact head must now pass a fresh complete post-ledger certification, and the ledger-only transition must prove that all accepted implementation/reconciliation blobs stayed unchanged.

Only after fresh post-ledger PASS and canonical merge may Kodac make the bounded claim:

```text
KODAC_K2_GVISOR_OBSERVER_EXACT_INSTANCE_BINDING_PROVEN
```

Meaning only:

> K2 can durably bind one validated gVisor execution requirement to one trusted E2 full-container subject and one same-FD-verified runsc/helper observation bracket, producing a durable E3 integrated runtime-lineage record without minting R3B physical backend evidence.
