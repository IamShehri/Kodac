# KDO-H4-R3D — gVisor Runtime Observer Primitive Evidence

Date: 2026-08-15
Status: POST-LEDGER CERTIFICATION PENDING
Repository: `TheHalfMoon/Kodac`

## 1. Evidence decision

```text
GATE:
KDO-H4-R3D

PRE-LEDGER DECISION:
PASS

CANONICAL BASE:
5ecb8ed2a79cd3b2e6cac73a7adce63eb4f632be

ACCEPTED PRE-LEDGER HEAD:
2a58e1dda537001ec90c638261fca920d70ba887

ACCEPTED PRE-LEDGER TREE:
518930d264ce54a45ac8c42917e4000f0fbe2a27

BOUNDED TARGET:
PURE GVISOR OBSERVER CONTRACT + LINUX PIDFD / SAME-ARTIFACT PROCESS BINDER

EVIDENCE CLASS:
E3-CANDIDATE ONLY

PRODUCTION OBSERVER INVOCATION:
NONE

R3B PHYSICAL OBSERVATION MINTING:
NONE

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO
```

This ledger records accepted pre-ledger evidence only. Fresh post-ledger certification of the ledger-bearing exact head is mandatory.

## 2. Exact pre-ledger scope

Exactly four changed paths existed from canonical base to accepted pre-ledger head:

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
```

The evidence-ledger path was absent at the accepted pre-ledger head.

## 3. Accepted implementation blobs

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
277b66c83ad82c96aa7dbd71f941daf8c6627738

packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
47c792ba01c9ba4b2db94d7558f282cdbd218660

packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
c1bedf569340af3948cd389a6fcbc7c4280dd49c

packages/kodac-runtime/src/index.ts
be5b2983251b150b89e0e5a7a384027e6c8ff897
```

The ledger-only commit must preserve all four byte-identically.

## 4. Primitive contract and fixed identities

```text
observer plan version:
kodac-h4-r3d-gvisor-observer-plan-v1

state observation version:
kodac-h4-r3d-gvisor-state-v1

stats observation version:
kodac-h4-r3d-gvisor-stats-v1

process observation version:
kodac-h4-r3d-gvisor-process-v1

runtime candidate version:
kodac-h4-r3d-gvisor-runtime-candidate-v1

runtime class:
gvisor

evidence class:
e3-candidate

trusted runsc artifact FD:
3

native failure exit:
125
```

Normative fixture identities remain:

```text
planIdentity:
394a27478223785ad07321b84cc8e1afce0eba33bb5d2d89448e95f3b428f69a

stateIdentity:
9b2f66fd6cd170674533c0d897c4f4a4c523df6e1222fc588cc2f9a099fa8548

statsIdentity:
354262819bf9670637ca1f4497f7298c08e7353f984503143fe57e84f6364092

processIdentity:
bec3dc32697a4caab26112a2a999f62dd8500df26ab35c89d837997fb121dd07

candidateIdentity:
eb8d117f4998baf6574e394aab3a923f10ceea78c6996e25ad8c74b674484b21
```

## 5. Pure TypeScript theorem

The accepted TypeScript module imports only Node standard-library purity helpers and performs no process/filesystem/network/provider execution I/O.

It provides bounded deterministic validation/parsing for observer plan, exact-subject running OCI state, exact-subject stats event, native process record, and bounded E3 runtime candidate.

Important fail-closed properties include:

- full 64-character lowercase hexadecimal subject IDs;
- canonical absolute POSIX paths;
- bounded duplicate-key-safe JSON parsing;
- positive/safe state PID;
- stats values never upgraded into resource-enforcement authority;
- native uint64 values preserved as canonical decimal strings;
- candidate identity rebuilt from validated source records;
- annotations excluded from state identity;
- annotation maps are frozen null-prototype own-property maps, preserving hostile-but-valid string keys such as `__proto__` and `constructor` without prototype mutation.

## 6. Linux native theorem

The native helper:

1. requires FD 3 to be an already-open read-only non-empty regular runsc artifact;
2. obtains a pidfd for the exact PID;
3. checks liveness before observation;
4. opens `/proc/<pid>/exe` descriptor-first and requires device/inode/size equality with FD 3;
5. reads bounded `/proc/<pid>/stat` and safely parses field 22 start ticks;
6. re-stats FD 3 for metadata mutation;
7. re-opens `/proc/<pid>/exe` and re-proves exact artifact equality, rejecting same-process exec drift;
8. rechecks pidfd liveness;
9. emits one bounded process record.

The helper contains no architecture-hardcoded fallback syscall number. If neither `SYS_pidfd_open` nor `__NR_pidfd_open` is provided by the build headers, compilation fails closed with `#error "pidfd_open syscall number unavailable"`.

It performs no exec, signal, ptrace, socket, network, mount, namespace-entry, Docker, containerd, or mutation operation.

## 7. Qodo findings and remediation history

An earlier diagnostic ledger-bearing head was invalidated after Qodo surfaced two actionable findings:

```text
1. annotations key dropped for special property names such as __proto__
2. non-portable hardcoded pidfd_open syscall fallback
```

That ledger was withdrawn before further acceptance work.

Both findings were corrected before this accepted pre-ledger head:

- annotations use a null-prototype map with own-property preservation and regression coverage for `__proto__` and `constructor`;
- pidfd syscall selection is header-derived only and otherwise compile-time fail-closed.

The original two review threads are now resolved and outdated. Unresolved actionable review threads at accepted pre-ledger head: `0`.

## 8. Fresh exact-head pre-ledger CI

Accepted pre-ledger head:

```text
2a58e1dda537001ec90c638261fca920d70ba887
```

### Governance

```text
run 31906137897
legacy-tests 95064136870 — PASS
provenance 95064136922 — PASS
```

### K2 runtime

```text
run 31906137889
runtime-change-classifier 95064136675 — PASS
Ubuntu runtime 95064153363 — PASS
Windows runtime 95064153376 — PASS
macOS runtime 95064153402 — PASS
k2-runtime-gate 95064264663 — PASS
```

Each OS runtime passed Typecheck, full Test, and patch benchmark. Ubuntu full Test includes the Linux native observer compile/runtime proof.

### K3-R4

```text
run 31906137893
job 95064136626 — PASS
```

### K3-R5

```text
run 31906137886
job 95064136647 — PASS
```

## 9. External review accuracy

Qodo's two actionable findings were remediated and their threads are resolved/outdated. No unresolved actionable review thread exists at the accepted pre-ledger head.

CodeRabbit attempted exact-head review but the full review did not run because the plan review limit was reached. This availability limitation is not represented as a CodeRabbit PASS.

Manual exact-head trust/security review: PASS.

## 10. Explicit non-authority

R3D does not prove or authorize production invocation of the helper or runsc, Docker Engine/socket access, containerd/OpenSandbox, Docker-to-R3A workload binding, source-digest observation, physical network/resource enforcement, R3B physical observation minting, `ExecutionGateway`/approval/receipt/Done Gate mutation, workspace-write integration, external-process `ask`, H4 closure, or H6 work.

Maximum bounded claim only after fresh post-ledger PASS and canonical merge:

```text
KODAC_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_PROVEN
```
