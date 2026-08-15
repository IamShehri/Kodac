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

ACCEPTED PRE-LEDGER HEAD:
6753404219337ec3cb6fbeb20bd57fd0338d0f5a

ACCEPTED PRE-LEDGER TREE:
5f37f97478f653dcb075f7e3705d5be7fd8693c8

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

H6 AUTHORIZED:
NO
```

This ledger records accepted pre-ledger evidence only.

It does not certify the ledger-bearing exact head. Fresh post-ledger certification is mandatory.

---

## 2. Canonical base and authorization

Canonical implementation base:

```text
5ecb8ed2a79cd3b2e6cac73a7adce63eb4f632be
```

Canonical H4-R3D authorization:

```text
docs/planning/KODAC_KDO_H4_R3D_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_AUTHORIZATION_2026-08-15.md
```

R3D authorizes exactly four implementation/index/test/native paths before ledger creation and this ledger path only after complete exact-head pre-ledger PASS.

R3D explicitly does not authorize any `ExecutionGateway`, receipt, Done Gate, approval, R3A/R3B, package, workflow, schema, Docker, OpenSandbox, or production runsc integration change.

---

## 3. Exact pre-ledger scope

Comparison from canonical base:

```text
5ecb8ed2a79cd3b2e6cac73a7adce63eb4f632be
```

to accepted pre-ledger head:

```text
6753404219337ec3cb6fbeb20bd57fd0338d0f5a
```

proved exactly these four changed paths:

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
```

No fifth path existed.

The authorized evidence ledger path returned repository `404 Not Found` at the exact accepted pre-ledger head.

Therefore:

```text
CHANGED PATHS = 4 / 4 AUTHORIZED:
PASS

LEDGER ABSENT BEFORE PRE-LEDGER PASS:
PASS — EXTERNAL EXACT-HEAD REPOSITORY-STATE PROOF
```

---

## 4. Accepted implementation blobs

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
81d78ff2c242e1d329ad06080a982bf08bdc2089

packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
f590d7c5ff2b552198170abfc11f2a7b98e1953f

packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
5ba7129a0a763fed378865d6b80440f9453edf90

packages/kodac-runtime/src/index.ts
be5b2983251b150b89e0e5a7a384027e6c8ff897
```

The later ledger-only commit must preserve all four byte-identically.

---

## 5. Primitive contract versions

```text
observer plan:
kodac-h4-r3d-gvisor-observer-plan-v1

state observation:
kodac-h4-r3d-gvisor-state-v1

stats observation:
kodac-h4-r3d-gvisor-stats-v1

process observation:
kodac-h4-r3d-gvisor-process-v1

runtime candidate:
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

The pure TypeScript module imports only:

```text
node:crypto
node:path
node:util
```

It imports no process/filesystem/network/provider execution API.

---

## 6. Fixed normative identity vectors

Fixture:

```text
runscPath = /usr/local/bin/runsc
expectedRunscSha256 = cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc
runtimeRoot = /var/run/runsc
containerId = 1111111111111111111111111111111111111111111111111111111111111111
ociVersion = 1.2.0
status = running
pid = 4242
bundle = /run/containerd/io.containerd.runtime.v2.task/moby/1111111111111111111111111111111111111111111111111111111111111111
eventType = stats
startTicks = 123456789
exeDev = 2049
exeIno = 987654321
exeSize = 12345678
```

Literal accepted identities:

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

The focused suite asserts all five literals directly.

---

## 7. Pure plan / parser theorem

The accepted TypeScript primitive is side-effect free.

It proves bounded deterministic construction and validation for:

```text
observer plan
OCI state output
runsc stats-event output
native process observation record
E3 runtime candidate
```

Key fail-closed properties include:

- full 64-character lowercase hexadecimal container IDs only;
- canonical absolute POSIX paths;
- fixed expected runsc SHA-256 format;
- Proxy/accessor/custom-prototype/symbol/non-enumerable/unknown-field rejection;
- duplicate JSON key rejection before semantic parsing, including escape-equivalent duplicate keys;
- bounded JSON size/depth/node/string/object/array processing;
- OCI state must be `running` for the exact subject;
- state PID must be positive/safe and exact;
- annotations are bounded diagnostics and excluded from state identity;
- stats outer type/id/shape must be exact;
- nested stats values cannot become resource-enforcement evidence;
- native uint64 identifiers remain canonical decimal strings without JavaScript precision loss;
- candidate validation rebuilds from validated plan/state/stats/process source records rather than trusting caller-selected identity strings.

---

## 8. Linux pidfd / exact-artifact theorem

The native helper is:

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
```

CLI:

```text
kodac-gvisor-proc-observe --pid <canonical-positive-pid>
```

Success protocol:

```text
kodac-gvisor-proc-v1 pid=<pid> start-ticks=<ticks> exe-dev=<dev> exe-ino=<ino> exe-size=<size>
```

The helper:

1. requires FD 3 to be an already-open read-only non-empty regular artifact;
2. opens a pidfd for the exact PID;
3. proves the pidfd is live before observation;
4. opens `/proc/<pid>/exe` descriptor-first;
5. requires executable device/inode/size equality with FD 3;
6. reads `/proc/<pid>/stat` under a bounded read;
7. parses field 22 start time without naive whitespace tokenization;
8. re-stats FD 3 and rejects metadata mutation;
9. re-opens `/proc/<pid>/exe` and re-proves exact artifact binding, closing same-process `exec` drift during the observation window;
10. re-polls pidfd and fails if the original process exited;
11. emits one bounded record.

It does not execute runsc and performs no signal, ptrace, socket, network, mount, namespace-entry, Docker, containerd, or mutation operation.

---

## 9. Native focused proof

The Linux runtime suite compiles the helper using:

```text
cc -std=c11 -O2 -Wall -Wextra -Werror
```

and proves at minimum:

- live FD3-to-PID executable match succeeds;
- mismatched executable artifact fails;
- missing FD 3 fails;
- malformed/noncanonical PID forms fail;
- nonexistent PID fails;
- success output grammar is exact;
- a legal process comm containing `a ) tricky` is parsed correctly, proving field 22 is not obtained by naive whitespace splitting;
- prohibited authority operations are absent from native source.

The native execution subtest uses the repository's Linux-only skip convention on non-Linux platforms. Contract/source tests still run elsewhere.

---

## 10. E3 candidate remains non-authority

The final R3D candidate contains only:

```text
version
runtimeClass = gvisor
evidenceClass = e3-candidate
planIdentity
stateIdentity
statsIdentity
processIdentity
candidateIdentity
```

It contains none of:

```text
observedSourceDigest
observedNetworkPolicy
observedResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
observationIdentity
```

Therefore R3D does not mint or masquerade as an R3B `SandboxBackendObservation`.

No real Docker/gVisor workload execution is claimed by this primitive.

---

## 11. Protected authority surfaces

The focused suite pins canonical protected blobs including:

```text
packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

packages/kodac-runtime/src/evidence/receipt.ts
214403398751c9d22bf695786c7fd7c6fd7e35e1

packages/kodac-runtime/src/verification/done-gate.ts
067e147569fa52cc2b04c5df26fbe20a01e958e9

packages/kodac-runtime/src/agent/loop.ts
576ad425db7e845b9705c982e95dd4f7522f8c43

packages/kodac-runtime/src/trust/sandbox-workload.ts
84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8

packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
b9242c5cecc18fd43b2b80aeffd974ef5311fded

packages/kodac-runtime/package.json
af4c20a3dae387c15cc5fb2eb28d415c8f115b95

packages/kodac-runtime/scripts/run-tests.mjs
9a0bcde0e565168c78eb7fe4d3cf08236d24baa7

packages/kodac-runtime/THIRD_PARTY_NOTICES.md
aaa1ce56d27f5b7dd185f9aaa257d978c2a56c76
```

The focused suite also proves the canonical agent loop has no R3D observer invocation.

---

## 12. Fresh exact-head pre-ledger CI

Accepted pre-ledger head:

```text
6753404219337ec3cb6fbeb20bd57fd0338d0f5a
```

### Governance

```text
run:
31905662022

provenance:
95062909199 — PASS

legacy-tests:
95062909255 — PASS
```

### K2 runtime

```text
run:
31905662079

runtime-change-classifier:
95062909343 — PASS

Windows runtime:
95062928224 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

Ubuntu runtime:
95062928231 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS
Linux native R3D observer proof PASS

macOS runtime:
95062928260 — PASS
Typecheck PASS
Test PASS
Patch benchmark PASS

k2-runtime-gate:
95063021775 — PASS
```

### K3-R4

```text
run:
31905661968

job:
95062909013 — PASS
```

### K3-R5

```text
run:
31905661955

job:
95062908974 — PASS
```

---

## 13. External review state

```text
UNRESOLVED ACTIONABLE REVIEW THREADS:
0
```

Qodo produced an exact-head PR summary consistent with the R3D contract and surfaced no actionable inline thread before ledger creation.

CodeRabbit attempted the exact-head review but did not run a full review because the plan review limit was reached.

Latest recorded CodeRabbit rate-limit run:

```text
run id:
1b976b92-b0d0-4238-a879-0b1624db291b

reviewed range requested:
5ecb8ed2a79cd3b2e6cac73a7adce63eb4f632be
..
6753404219337ec3cb6fbeb20bd57fd0338d0f5a

result:
FULL REVIEW NOT RUN — PLAN RATE LIMIT
```

This availability condition is not represented as a completed CodeRabbit review and is not represented as a CodeRabbit PASS.

Manual exact-head trust/security review:

```text
PASS
```

The manual review additionally hardened the native helper after the first green diagnostic head so that it re-opens `/proc/<pid>/exe` near the end of the observation window and fails if the same live process has exec-drifted away from the trusted artifact.

The earlier head before that hardening is diagnostic history only and is not acceptance evidence.

---

## 14. Pre-ledger gate result

```text
canonical base exact:
PASS

changed paths exactly 4 authorized:
PASS

ledger absent externally at exact head:
PASS

five fixed vectors exact:
PASS

pure TypeScript boundary:
PASS

hostile / duplicate JSON proof:
PASS

uint64 exactness:
PASS

E3 non-authority separation:
PASS

native Linux compilation/runtime proof:
PASS

pidfd lifetime observation:
PASS

same-artifact executable binding:
PASS

same-process exec drift recheck:
PASS

protected authority blobs exact:
PASS

Ubuntu/Windows/macOS TypeScript + full tests:
PASS

patch benchmark:
PASS

K2 aggregate:
PASS

governance/provenance/legacy:
PASS

K3-R4:
PASS

K3-R5:
PASS

unresolved actionable review threads:
0

manual exact-head trust review:
PASS

PRE-LEDGER DECISION:
PASS
```

---

## 15. Post-ledger requirement

After this file is committed, the pre-ledger evidence becomes historical.

The new exact ledger-bearing head must independently prove:

```text
changed paths = authorized 1-5 only
ledger present at exact authorized path
native/TypeScript/test/index blobs unchanged from 6753404219337ec3cb6fbeb20bd57fd0338d0f5a
protected authority blobs exact
all fixed vectors exact
Linux native focused proof PASS
full tests PASS
TypeScript PASS on all three OS
patch benchmark PASS
K2 classifier + aggregate PASS
governance/provenance/legacy PASS
K3-R4 PASS
K3-R5 PASS
0 unresolved actionable review threads
manual exact-head authority review PASS
```

Post-ledger certification status at creation:

```text
PENDING
```

---

## 16. Explicit non-claims

R3D does not claim or authorize:

- production invocation of the native helper;
- production invocation of runsc;
- Docker Engine/socket access;
- containerd access;
- OpenSandbox integration;
- container creation/start/exec/kill/delete;
- image pull or registry access;
- Docker-to-R3A workload identity binding;
- immutable image digest physical observation;
- physical network deny-all proof;
- physical CPU/memory/TTL/output enforcement proof;
- trusted R3B `SandboxBackendObservation` creation;
- R3B evidence minting from a real backend;
- `ExecutionGateway` changes;
- approval, receipt, Done Gate, or agent-loop changes;
- external-process `ask` enablement;
- workspace-write integration;
- H4 completion;
- H6 authorization.

---

## 17. Completion claim gate

Only after fresh post-ledger PASS and expected-head canonical merge may Kodac make:

```text
KODAC_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_PROVEN
```

Meaning only that Kodac has the bounded pure parser/identity contract and Linux pidfd/same-artifact process-binding primitive described by canonical R3D authorization.

Until canonical merge:

```text
CLAIM UNAVAILABLE
```

The expected later slice remains a separately authorized K2 exact-instance integration step. R3D itself grants no production observer authority.