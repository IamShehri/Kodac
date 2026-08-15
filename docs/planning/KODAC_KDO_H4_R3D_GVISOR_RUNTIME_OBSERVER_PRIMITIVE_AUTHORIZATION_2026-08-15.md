# KDO-H4-R3D — gVisor Runtime Observer Primitive Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `add49763e90cca639eefecc09ba83a4bb45908e2`
Canonical base tree: `7493e8aa448164e1ccf5029f601831d80cce6ee5`
Predecessor: canonical H4-R3C backend-semantics / trusted-observation reconciliation

## 1. Decision

```text
GATE:
KDO-H4-R3D

NAME:
GVISOR RUNTIME OBSERVER PRIMITIVE

AUTHORIZATION CLASS:
BOUNDED PRIMITIVE / NO PRODUCTION INTEGRATION

R3C:
CANONICAL / SEMANTICS RECONCILED

EXECUTIONGATEWAY MUTATION:
NOT AUTHORIZED

DOCKER SOCKET / ENGINE API:
NOT AUTHORIZED

CONTAINER CREATE / START / EXEC / KILL / DELETE:
NOT AUTHORIZED

REAL GVISOR EXECUTION IN REPOSITORY CI:
NOT REQUIRED / NOT CLAIMED

R3B OBSERVATION MINTING:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

R3D authorizes the smallest independently testable primitive needed before Kodac can integrate a trusted Linux gVisor observer into K2.

The primitive is deliberately split into three evidence sources:

```text
trusted runsc state parse
+ live runsc stats-RPC parse
+ pidfd-bound host process/executable-artifact observation
= E3-CANDIDATE gVisor runtime observation
```

It is not yet an E4 Kodac physical proof because no canonical K2 integration binds these sources to a Docker-created R3A workload execution instance.

---

## 2. Canonical predecessor truth

Canonical R3C merge:

```text
add49763e90cca639eefecc09ba83a4bb45908e2
```

Canonical R3C document:

```text
docs/planning/KODAC_KDO_H4_R3C_BACKEND_SEMANTICS_TRUSTED_OBSERVATION_RECONCILIATION_2026-08-15.md
blob d8ef34a86e350a4b055f36def54f04dc8d3ed580
```

R3C established:

```text
REQUIREMENT
!= CONFIGURATION
!= CONTROL-PLANE STATUS
!= OBSERVATION SIGNAL
!= TRUSTED PHYSICAL PROOF
```

and made the bounded canonical claim:

```text
KODAC_SANDBOX_BACKEND_OBSERVATION_SEMANTICS_RECONCILED
```

R3D MUST preserve that distinction.

---

## 3. Why `runsc state` alone is insufficient

Pinned gVisor source exposes:

```text
runsc state <container-id>
```

and returns OCI state JSON from `c.State()`.

However gVisor's own container loader says that its check for a `Running` or `Created` container being still alive is:

```text
inherently racy
```

Therefore R3D MUST NOT equate:

```text
runsc state says running
```

with:

```text
exact live trusted runsc process physically bound
```

The race must be closed by an independent host primitive whose process reference cannot silently become a reused PID during observation.

---

## 4. Why `runsc events --stats` is separately useful

Pinned gVisor source exposes:

```text
runsc events --stats <container-id>
```

The command loads the container and calls its event path. The in-sandbox/container-manager event implementation returns:

```text
type = stats
id = exact container id
data = cpu / memory / pids / network-interface statistics
```

and first checks container process state through gVisor's own runtime control path.

R3D treats successful exact-ID `events --stats` as a stronger live-runtime signal than static state metadata.

It is still not sufficient alone because:

- the command binary must itself be trusted;
- the container ID must later be bound to the exact Kodac execution instance;
- command success does not prove every resource/network theorem required by R3B;
- a mutable runtime installation must not silently change observer meaning.

R3D therefore records only a bounded stats-RPC observation, not resource enforcement evidence.

---

## 5. Source pins

### 5.1 gVisor

```text
repository:
google/gvisor

commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293

tree:
12ce7f8c4f8b0481cccb4c28632fff49cb3f50e4

root license:
Apache-2.0 with upstream file-specific exceptions where stated

root license blob:
f7a006d10464cfe9724b5d687c0013bf982cc66a
```

Pinned references:

```text
runsc/cmd/state.go
5c948173f280f49d0bace91651ab058dec76faa3

runsc/container/state_file.go
0fcd70dff37a476dea1bee1dee6da760f8040edf

runsc/cmd/list.go
6755589fbd5b9178482089e6470f8d223d3a36f9

runsc/cmd/events.go
fc60e8e0beabbafcf358f7601d7f92f6793fd4d4

runsc/boot/events.go
f3f156a421366f7696bebf377a47e33992553423

runsc/config/flags.go
24b6086f4a8d9b75e307a8e816c2d34cd4cec274

go.mod
f28a021d5825fee62e4cb1f90abf37d3ce34031c
```

gVisor at this pin depends on:

```text
github.com/opencontainers/runtime-spec v1.2.1
```

### 5.2 OCI Runtime Specification used by pinned gVisor

```text
repository:
opencontainers/runtime-spec

tag:
v1.2.1

tag object:
d2d7a6f6daa3d4f3bff1870974e573571e130f59

commit:
524fc0e1b8ab0180e2fc9abd31837a0f4ed1fd6b
```

Pinned state definition:

```text
specs-go/state.go
7c010d4fe79812a438c58e66c238c172e98ba592
```

The accepted OCI state fields are therefore exactly grounded in:

```text
ociVersion
id
status
pid
bundle
annotations
```

No mutable remote schema or documentation lookup is allowed at runtime.

R3D studies these sources only. No gVisor or OCI implementation code is copied into Kodac.

---

## 6. Existing Kodac native-trust pattern

Kodac already has a canonical Linux native helper pattern:

```text
packages/kodac-runtime/native/landlock-run.c
blob d7a3e47c31e80df0ac3eddf1969a5fecb48c5de0
```

and K2 same-FD verification/orchestration in:

```text
packages/kodac-runtime/src/execution/gateway.ts
blob ecf9cc9d3eda6a2280a280ed2f9a2e472f397560
```

The canonical pattern includes:

- pre-opened trusted artifact descriptors;
- same-FD metadata/hash verification before use;
- fixed inherited descriptor numbers;
- no PATH resolution for trusted native artifacts;
- explicit bounded protocols;
- fail closed on descriptor aliasing or mutation;
- K2 ownership of production invocation.

R3D may reuse this architectural pattern, but it MUST NOT mutate `ExecutionGateway` yet.

---

## 7. Authorized pre-ledger implementation paths

The R3D implementation PR may change exactly these four paths before ledger creation:

```text
1. packages/kodac-runtime/native/gvisor-proc-observe.c
2. packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
3. packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
4. packages/kodac-runtime/src/index.ts
```

No fifth pre-ledger path is authorized.

In particular, R3D MUST NOT modify:

```text
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/trust/confinement*.ts
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/*
.github/workflows/*
```

The primitive must remain dependency-free relative to the existing runtime package.

---

## 8. Native helper scope

Authorized native path:

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
```

The helper is a Linux-only, read-only process identity observer.

It MUST NOT:

- execute runsc;
- execute Docker;
- open a Docker/containerd socket;
- send signals;
- ptrace;
- read process memory;
- enter namespaces;
- mount/unmount;
- change cgroups;
- write under `/proc`;
- mutate the observed process;
- perform network I/O;
- read arbitrary caller paths;
- accept an executable path from the caller.

Its only subject input is an exact decimal PID.

---

## 9. Native helper fixed inherited descriptor

R3D reserves:

```text
FD 3 = already-open trusted runsc artifact descriptor
```

The helper MUST require FD 3 to be open and refer to a regular file.

The helper does not decide whether the descriptor is trusted. A future K2 integration must open/hash/verify that artifact before invocation, using the existing same-FD trust pattern.

The helper's bounded theorem is only:

```text
while the observed PID is still the process referenced by pidfd,
/proc/<pid>/exe resolves to the same device+inode as inherited FD 3
```

That theorem is materially stronger than comparing executable path strings.

---

## 10. PID-reuse / race defense

The native helper MUST use Linux `pidfd_open(pid, 0)` or a purpose-equivalent kernel process handle.

The required sequence is:

1. validate PID syntax and bounds;
2. `pidfd_open` the exact PID;
3. non-blocking poll the pidfd and fail if the process is already exited;
4. `fstat` inherited FD 3;
5. open `/proc/<pid>/exe` using a non-following descriptor-oriented mechanism suitable for executable-object inspection;
6. `fstat` the opened process executable;
7. require exact device+inode equality with FD 3;
8. read `/proc/<pid>/stat` through a bounded descriptor;
9. parse field 22 (`starttime`) without assuming the process `comm` field contains no spaces or right parentheses;
10. re-`fstat` FD 3 and require its identity-relevant metadata to remain stable;
11. poll pidfd again and fail if the original process exited during observation;
12. emit one exact bounded record and close all descriptors.

If `pidfd_open` is unavailable, permission is denied, `/proc` is hidden, any descriptor changes, or the process exits during observation, the helper must fail closed.

No fallback to PID-only observation is authorized.

---

## 11. Native helper protocol

CLI:

```text
kodac-gvisor-proc-observe --pid <decimal-positive-pid>
```

No other option is authorized in v1.

Success stdout is exactly one ASCII line:

```text
kodac-gvisor-proc-v1 pid=<pid> start-ticks=<decimal> exe-dev=<decimal> exe-ino=<decimal> exe-size=<decimal>
```

Success stderr:

```text
empty
```

Failure exit code:

```text
125
```

On failure, stdout must be empty and stderr must begin with:

```text
kodac-gvisor-proc:
```

Protocol ceiling:

```text
stdout <= 512 bytes
stderr <= 4096 bytes
```

All decimal fields must be canonical unsigned decimal without signs, whitespace, prefixes, or leading zeroes except the value `0` where structurally allowed.

For successful process observation:

```text
pid > 0
start-ticks > 0
exe-dev >= 0
exe-ino > 0
exe-size > 0
```

---

## 12. Native helper source/license boundary

The new C helper must be original Kodac implementation under the repository Apache-2.0 license.

It may study Linux man-page/kernel syscall semantics and the pinned gVisor/OCI references, but it MUST NOT copy gVisor implementation code.

No new third-party attribution is expected unless implementation actually copies/adapts donor code. If that changes, implementation must stop and reconcile `THIRD_PARTY_NOTICES.md` in a separately authorized scope before proceeding.

---

## 13. TypeScript primitive scope

Authorized TypeScript path:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
```

This module MUST remain pure.

Allowed production imports are limited to purpose-equivalent standard-library pure helpers:

```text
node:crypto
node:path
node:util
```

It MUST NOT import or call:

```text
node:child_process
node:fs
node:fs/promises
node:net
node:http
node:https
Docker SDKs
OpenSandbox SDKs
containerd clients
ExecutionGateway
receipt / Done Gate / approval mutation APIs
```

It creates/validates plans, materializes inert command descriptions, parses bounded supplied outputs, and constructs an E3-candidate record only.

No side effect occurs in this module.

---

## 14. Observer plan v1

Version:

```text
kodac-h4-r3d-gvisor-observer-plan-v1
```

The canonical plan contains exactly:

```text
version
runscPath
expectedRunscSha256
runtimeRoot
containerId
planIdentity
```

Rules:

```text
runscPath:
absolute canonical POSIX path
1..4096 UTF-8 bytes

expectedRunscSha256:
64 lowercase hex

runtimeRoot:
absolute canonical POSIX path
1..4096 UTF-8 bytes
no trailing slash except /

containerId:
exactly 64 lowercase hex
```

The 64-hex container ID intentionally narrows R3D v1 to Docker-style full IDs and rejects prefix/abbreviation lookup. gVisor supports abbreviated IDs in some commands, but R3D MUST always use exact full IDs.

---

## 15. Inert runsc command descriptions

Given a validated plan, the pure module may materialize exactly two command descriptions.

State:

```text
file = runscPath
args = ["--root", runtimeRoot, "state", containerId]
```

Stats:

```text
file = runscPath
args = ["--root", runtimeRoot, "events", "--stats", containerId]
```

These are inert descriptions only.

The module does not spawn them.

A later K2 integration must execute them from the same already-verified runsc artifact descriptor, not by re-resolving `runscPath` through PATH or reopening a mutable pathname between verification and invocation.

---

## 16. State parser v1

Version:

```text
kodac-h4-r3d-gvisor-state-v1
```

Input is supplied UTF-8 stdout from a future trusted `runsc state` invocation.

Bounds:

```text
input <= 65536 UTF-8 bytes
exactly one JSON value
no trailing non-whitespace bytes
```

The parser must accept only a plain JSON object with the OCI v1.2.1 state keys:

```text
ociVersion
id
status
pid
bundle
annotations (optional)
```

Unknown keys fail.

Required semantic rules:

```text
id = exact plan.containerId
status = running
pid = positive safe integer
bundle = absolute canonical path, <= 4096 UTF-8 bytes
ociVersion = non-empty printable ASCII, <= 64 bytes
```

Annotations, when supplied, must be a plain string->string record with at most 128 entries, each key/value <= 2048 UTF-8 bytes, no NULs, accessors, prototypes, symbols, or duplicate JSON keys accepted by any custom parse path.

Annotations are diagnostic only and are excluded from R3D state identity.

`created`, `creating`, and `stopped` states fail for an accepted runtime candidate.

---

## 17. Stats-RPC parser v1

Version:

```text
kodac-h4-r3d-gvisor-stats-v1
```

Input is supplied UTF-8 stdout from a future trusted `runsc events --stats` invocation.

Bounds:

```text
input <= 262144 UTF-8 bytes
exactly one JSON value
```

The outer object must contain:

```text
type
id
data
```

and no unknown outer keys.

Required semantics:

```text
type = stats
id = exact plan.containerId
data = plain JSON object
```

R3D does not interpret CPU/memory/network values as enforcement truth. The nested data is validated only for bounded JSON shape sufficient to prevent parser/memory abuse.

The normalized stats identity contains only:

```text
version
containerId
eventType = stats
```

Successful parsing means only that a stats event for the exact subject was supplied. Physical liveness authority requires the later K2 same-artifact invocation and the process binding below.

---

## 18. Native process parser v1

Version:

```text
kodac-h4-r3d-gvisor-process-v1
```

The TypeScript parser accepts only the exact native one-line protocol from §11.

It must reject:

- duplicate fields;
- reordered/missing fields if the grammar is defined positionally;
- signs;
- leading zero ambiguity;
- unsafe integers converted through JavaScript `number` where precision could be lost;
- extra lines;
- extra whitespace;
- non-ASCII bytes;
- mismatched PID relative to state.

Large kernel identifiers (`dev`, `ino`, `start-ticks`, `size`) must remain canonical decimal strings or otherwise preserve exact integer precision.

---

## 19. E3-candidate composition

Version:

```text
kodac-h4-r3d-gvisor-runtime-candidate-v1
```

Evidence class literal:

```text
e3-candidate
```

Runtime class literal:

```text
gvisor
```

Candidate construction requires:

```text
validated plan
validated running state
validated stats event
validated process observation

state.containerId = plan.containerId
stats.containerId = plan.containerId
process.pid = state.pid
```

The native process observation is accepted only because its producer protocol means the live PID's `/proc/<pid>/exe` device+inode matched inherited trusted runsc artifact FD 3 while the pidfd remained alive across the observation.

The candidate MUST NOT be structurally assignable to or returned as an R3B `SandboxBackendObservation`.

No source digest, network policy, resource policy, credential binding, or downgrade fact is synthesized.

---

## 20. Identity encoding

R3D identities use lowercase SHA-256 over fixed domain-separated UTF-8 preimages.

For every identity:

```text
SHA256( DOMAIN + NUL + canonical-json )
```

where canonical JSON is produced with exact fixed key order documented below and no insignificant whitespace.

Domains:

```text
KODAC_H4_R3D_PLAN_V1
KODAC_H4_R3D_STATE_V1
KODAC_H4_R3D_STATS_V1
KODAC_H4_R3D_PROCESS_V1
KODAC_H4_R3D_CANDIDATE_V1
```

The implementation must construct objects in the fixed key orders shown in §§14, 16, 17, 18, and 19 before `JSON.stringify`.

Runtime hostile-object validation occurs before identity construction.

---

## 21. Fixed normative vectors

Fixture:

```text
runscPath:
/usr/local/bin/runsc

expectedRunscSha256:
cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc

runtimeRoot:
/var/run/runsc

containerId:
1111111111111111111111111111111111111111111111111111111111111111

ociVersion:
1.2.0

status:
running

pid:
4242

bundle:
/run/containerd/io.containerd.runtime.v2.task/moby/1111111111111111111111111111111111111111111111111111111111111111

stats eventType:
stats

start-ticks:
123456789

exe-dev:
2049

exe-ino:
987654321

exe-size:
12345678
```

Exact identities:

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

If implementation output differs, implementation must be corrected. The vectors must not be regenerated to fit implementation behavior.

---

## 22. Required focused TypeScript proof

The focused suite must prove at minimum:

### Plan

- exact fixed plan vector;
- deterministic immutable construction;
- full 64-hex container ID only;
- no abbreviated IDs;
- absolute canonical paths only;
- malformed/uppercase/non-hex expected SHA fails;
- Proxy/accessor/symbol/custom-prototype/unknown-field inputs fail before semantic acceptance;
- inert state/stats command descriptions are exact;
- no production process/fs/network imports.

### State

- exact fixed state vector;
- running accepted;
- creating/created/stopped rejected;
- PID 0/negative/non-integer/unsafe rejected;
- wrong container ID rejected;
- relative/oversized/noncanonical bundle rejected;
- unknown outer key rejected;
- malformed JSON/trailing JSON rejected;
- oversized input rejected;
- annotations bounded and excluded from identity.

### Stats

- exact fixed stats vector;
- `type != stats` rejected;
- wrong ID rejected;
- unknown outer key rejected;
- non-object data rejected;
- oversized/malformed input rejected;
- nested resource values do not upgrade the E3 candidate into R3B resource evidence.

### Process protocol

- exact fixed process vector;
- state/process PID mismatch rejected;
- leading-zero/sign/extra-field/extra-line/missing-field cases rejected;
- values larger than JS safe integer remain exact and do not round;
- stdout bound enforced.

### Candidate

- exact fixed candidate vector;
- all inputs frozen/detached;
- candidate literal is `e3-candidate`;
- runtime class literal is `gvisor`;
- candidate is not an R3B observation and contains no source/network/resource/credential/downgrade claim.

---

## 23. Required Linux-native proof

Linux-only focused tests may compile the native helper using the repository's existing native-test convention:

```text
cc -std=c11 -O2 -Wall -Wextra -Werror
```

The native test must prove at minimum:

1. helper compiles on Linux;
2. success when FD 3 is an open descriptor for the current parent process executable and `--pid` names that same live parent process;
3. exact one-line protocol;
4. mismatch failure when FD 3 refers to a different regular executable artifact;
5. nonexistent PID fails;
6. malformed PID syntax fails;
7. missing FD 3 fails;
8. writable/aliased/invalid descriptor conditions fail where applicable;
9. native source contains `pidfd_open`/purpose-equivalent syscall use;
10. native source contains no `kill`, `ptrace`, `exec*`, socket/network, mount, namespace-entry, or Docker/containerd operation;
11. process exit during observation fails where a deterministic test can force the race;
12. `/proc/<pid>/stat` parser handles a legal `comm` containing spaces/right-parenthesis ambiguity without reading field 22 by naive whitespace splitting.

On non-Linux systems, only the native execution subtest may use the repository's established `linuxOnly` skip convention. Source/contract tests must still execute.

---

## 24. Production purity and non-integration proof

The focused suite must prove:

```text
sandbox-observer-gvisor.ts imports no child_process/fs/net/http/provider SDK
ExecutionGateway blob unchanged
receipt blob unchanged
Done Gate blob unchanged
agent loop contains no R3D observer invocation
package.json unchanged
run-tests.mjs unchanged
workflows unchanged
R3A/R3B contracts unchanged
```

The native helper being present in the repository does not make it production authority.

There must be no production call site to it in R3D.

---

## 25. What R3D proves if accepted

After complete pre-ledger and post-ledger proof, R3D may establish only:

```text
Kodac has a deterministic pure gVisor observation contract and a Linux native
process-artifact binding primitive that can fail-closed bind a live PID to an
already-open trusted runsc executable artifact using pidfd-backed lifetime
observation, and can compose supplied runsc state/stats/process records into a
bounded E3-candidate without minting R3B physical backend evidence.
```

It does not establish that a real Docker/gVisor workload was executed by Kodac.

---

## 26. Pre-ledger certification gate

Before ledger creation, one exact head must prove:

```text
CHANGED PATHS:
exactly 4 / 4 authorized pre-ledger paths

LEDGER:
absent by external exact-head repository-state proof

TYPECHECK:
PASS required OS jobs

FULL TESTS:
PASS required OS jobs

LINUX NATIVE OBSERVER TEST:
PASS

PATCH / BENCHMARK REGRESSION:
PASS where classifier applies

K2 REGRESSION / CLASSIFIER:
PASS

K3-R4 / K3-R5 REGRESSION:
PASS where triggered

GOVERNANCE / PROVENANCE / LEGACY:
PASS

REVIEW:
0 unresolved actionable threads

PROTECTED BLOBS:
byte-identical

MANUAL TRUST REVIEW:
PASS
```

A review bot availability/rate-limit event is not itself a security finding, but completed review state must be represented accurately rather than promoted to a PASS that did not occur.

Only after the exact-head pre-ledger gate passes may the R3D evidence ledger be created.

---

## 27. Ledger and post-ledger gate

Only after pre-ledger PASS may this fifth path be added:

```text
docs/planning/KODAC_KDO_H4_R3D_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_EVIDENCE_2026-08-15.md
```

The ledger commit must be ledger-only.

It may record pre-ledger facts but must mark post-ledger certification pending.

Across the ledger-only commit, all four implementation/index/test/native blobs must remain byte-identical.

Fresh post-ledger certification must rerun all applicable gates on the ledger-bearing exact head.

---

## 28. Maximum claim after canonical merge

Only after:

1. R3D authorization becomes canonical;
2. implementation passes pre-ledger gate;
3. ledger-only commit is created;
4. implementation passes post-ledger gate; and
5. the certified exact head merges canonically

may Kodac make:

```text
KODAC_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_PROVEN
```

Meaning only the bounded theorem in §25.

It MUST NOT mean:

```text
Docker/gVisor execution proven
Docker container identity bound to R3A workload
immutable image digest observed
network deny-all physically proven
CPU/memory/TTL/output enforcement physically proven
trusted R3B SandboxBackendObservation minted
OpenSandbox integration proven
external-process ask enabled
H4 complete
H6 authorized
```

---

## 29. Expected next slice after proven R3D

If R3D becomes canonical/proven, the next candidate is:

```text
KDO-H4-R3E — K2 gVisor Observer Integration / Exact-Instance Binding Authorization
```

R3E must separately decide whether to authorize:

- K2 same-FD verification of both observer helper and runsc artifacts;
- bounded `runsc state` and `runsc events --stats` invocation;
- exact execution-attempt/container-ID lineage;
- Docker read-only control-plane binding or another source of container identity;
- durable observer evidence commit before any higher completion claim.

R3E must still not automatically authorize container creation or arbitrary Docker socket access.

---

## 30. Explicit non-authority

R3D does not authorize:

- any `ExecutionGateway` change;
- production invocation of the new helper;
- production invocation of runsc;
- Docker Engine/socket access;
- containerd socket access;
- OpenSandbox server/SDK;
- image pull or registry access;
- container create/start/exec/kill/delete;
- signals or ptrace against runtime processes;
- namespace entry;
- cgroup mutation;
- network mutation;
- source-digest physical proof;
- resource/network/credential/downgrade R3B observation;
- R3B evidence minting;
- receipt or Done Gate changes;
- approval changes;
- workspace-write integration;
- external-process `ask` re-enable;
- H4 closure;
- H6 work.

---

## 31. Final authorization boundary

```text
AUTHORIZED AFTER THIS DOCUMENT BECOMES CANONICAL:
PURE GVISOR OBSERVER CONTRACT/PARSERS
LINUX READ-ONLY PIDFD + SAME-ARTIFACT PROCESS BINDING HELPER
FOCUSED FIXTURE/NATIVE PROOF
PUBLIC TYPE EXPORT
LEDGER AFTER PRE-LEDGER PASS

NOT AUTHORIZED:
ANY PRODUCTION OBSERVER INVOCATION
ANY DOCKER / RUNSC / OPENSANDBOX INTEGRATION
ANY R3B PHYSICAL OBSERVATION MINTING
ANY EXECUTIONGATEWAY / RECEIPT / DONE-GATE MUTATION
ANY EXTERNAL-PROCESS ask RE-ENABLE
ANY H4 CLOSURE CLAIM
ANY H6 WORK
```

R3D exists to make the next trusted-observer integration small enough to audit: first prove the process/artifact and parsing primitives; only then connect them to K2 and a real backend instance.