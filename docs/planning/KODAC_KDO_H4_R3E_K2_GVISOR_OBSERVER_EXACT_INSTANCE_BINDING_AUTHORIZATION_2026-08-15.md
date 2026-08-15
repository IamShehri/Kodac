# KDO-H4-R3E — K2 gVisor Observer Integration / Exact-Instance Binding Authorization

Date: 2026-08-15
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `e3569d697b08950935fc844f582eb9f18db89ab3`
Canonical base tree: `7a1ab6ffd7fb8ffc487b0057a196b13628527d6a`
Predecessor: canonical H4-R3D gVisor runtime observer primitive

## 1. Decision

```text
GATE:
KDO-H4-R3E

NAME:
K2 GVISOR OBSERVER INTEGRATION / EXACT-INSTANCE BINDING

AUTHORIZATION CLASS:
BOUNDED READ-ONLY K2 OBSERVER INTEGRATION

R3D:
CANONICAL / PROVEN

K2 / EXECUTIONGATEWAY:
SOLE PRODUCTION EXTERNAL-OBSERVATION AUTHORITY

DIRECT DOCKER SOCKET ACCESS:
NOT AUTHORIZED

CONTAINERD SOCKET ACCESS:
NOT AUTHORIZED

CONTAINER CREATE / START / EXEC / KILL / DELETE:
NOT AUTHORIZED

RAW RUNTIME-ROOT FILE READS OUTSIDE RUNSC:
NOT AUTHORIZED

R3B BACKEND OBSERVATION MINTING:
NOT AUTHORIZED

R3B EXECUTION EVIDENCE MINTING:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO
```

R3E authorizes the smallest production K2 integration needed to turn the canonical R3D primitive into one durable, exact-instance, trusted-host **E3 integrated runtime-lineage observation**.

R3E deliberately does **not** authorize Docker lifecycle control, raw Docker/containerd sockets, or any upgrade to R3B physical backend evidence.

The governing theorem remains:

```text
E2 control-plane binding
+ same-FD verified runsc artifact
+ same-FD verified Kodac observer-helper artifact
+ exact-ID runsc state
+ pidfd / exact runsc executable binding
+ exact-ID runsc stats RPC
+ repeated state / process identity bracket
+ durable K2 evidence commit
= E3 INTEGRATED RUNTIME-LINEAGE OBSERVATION
!= E4 R3B PHYSICAL BACKEND PROOF
```

---

## 2. Canonical predecessor truth

Canonical R3D implementation merged through PR #91 as:

```text
e3569d697b08950935fc844f582eb9f18db89ab3
```

with tree:

```text
7a1ab6ffd7fb8ffc487b0057a196b13628527d6a
```

Canonical R3D evidence ledger:

```text
docs/planning/KODAC_KDO_H4_R3D_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_EVIDENCE_2026-08-15.md
blob 5f30dda189f4609c06235865b5ed71420e4cc65e
```

R3D therefore permits only the bounded canonical claim:

```text
KODAC_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_PROVEN
```

R3D proves a pure plan/parser/candidate contract plus a Linux pidfd-based process/executable-artifact binder. It does not invoke runsc in production and does not bind a caller-independent container subject to a K2 attempt.

---

## 3. Why R3E is required

R3D intentionally leaves four production gaps:

1. its `runsc state` and `runsc events --stats` command descriptions are inert;
2. the native helper does not decide whether inherited FD 3 is trusted;
3. `containerId` exists in the R3D plan but there is no production rule preventing an untrusted caller from selecting an arbitrary subject;
4. no durable K2 record binds control-plane subject identity, runsc artifact identity, helper artifact identity, state/stats/process evidence, and one exact observation attempt.

R3E closes only those four gaps.

It does not close source-digest, network, CPU, memory, TTL, output-limit, credential, or downgrade physical-proof requirements from R3B.

---

## 4. K2 remains the sole production authority

Canonical ADR-0006 and canonical H4-R2C establish that privileged or state-affecting operations flow through `ExecutionGateway` and the Trust Kernel.

R3C further makes external trusted-host reads an authority surface requiring explicit bounded K2 capability.

Therefore R3E MUST NOT introduce:

- an independent gVisor observer daemon;
- a direct model tool that invokes runsc;
- MCP/plugin bypass execution;
- a helper that opens Docker/containerd sockets;
- a second process executor outside K2;
- a generic host-inspection service.

Production runsc/helper invocation authorized by R3E must be owned by `ExecutionGateway`.

---

## 5. R3E chooses a provider-neutral E2 container-binding resolver

R3E explicitly decides **not** to authorize a Docker Engine socket implementation yet.

Instead, trusted host configuration may inject one narrow provider-neutral read-only resolver interface whose only production purpose is:

```text
K2 observation attempt + exact R3B requirement/workload
-> exact full container ID binding
```

The resolver is an E2 control-plane authority only.

It MUST NOT:

- create, start, stop, kill, remove, pause, unpause, exec, or mutate a container;
- expose a raw socket/client to the model or caller;
- return resource/network/source facts as physical proof;
- choose runsc/helper paths or expected digests;
- select runtime root;
- mint R3B `SandboxBackendObservation`;
- upgrade its own result to E3/E4.

A future slice may implement a Docker-specific resolver behind this interface. That future slice must separately authorize the exact daemon/API surface.

---

## 6. Caller may not select `containerId`

The public R3E K2 surface MUST NOT accept a raw container ID from the command/model caller.

Its subject input is a validated canonical R3B `SandboxExecutionRequirement` whose:

```text
requiredSemanticRuntimeClass = gvisor
downgradePolicy = forbid
```

K2 creates a fresh observation-attempt identity.

Only the trusted container-binding resolver may return the exact container ID for that attempt/requirement/workload tuple.

The returned ID must be exactly:

```text
64 lowercase hexadecimal characters
```

Prefix/abbreviation lookup is forbidden.

---

## 7. Container-binding request v1

R3E may define a pure structural request version:

```text
kodac-h4-r3e-container-binding-request-v1
```

with exactly:

```text
version
executionAttemptIdentity
requirementIdentity
workloadIdentity
bindingRequestIdentity
```

The attempt identity is created by K2 and cannot be caller-selected.

The requirement and workload identities must come from the already validated R3B requirement.

---

## 8. E2 container-binding record v1

R3E may define a pure structural record version:

```text
kodac-h4-r3e-container-binding-v1
```

with exactly:

```text
version
providerId
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerId
bindingIdentity
```

Rules:

- `providerId` is a bounded canonical lowercase identifier;
- all identities are exact lowercase SHA-256 identities;
- `containerId` is full 64-lowerhex;
- request/record attempt, requirement, and workload identities must match exactly;
- unknown/additional fields fail;
- returned objects are deeply immutable snapshots.

This record is E2 only.

It MUST NOT contain or imply:

```text
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicy
observedResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
R3B observationIdentity
```

---

## 9. Trusted gVisor observer runtime configuration

R3E may add one immutable trusted-host runtime configuration captured by `ExecutionGateway`.

It may contain exactly the authority needed for this slice:

```text
absolute runscPath
expected runsc SHA-256
absolute observerHelperPath
expected observer-helper SHA-256
absolute runtimeRoot
container-binding resolver
durable observer-evidence commit interface
```

The public observation call MUST NOT override any of these values.

No Docker/containerd client or socket path is part of R3E runtime configuration.

Invalid/absent runtime configuration fails closed before external observation.

---

## 10. Linux-only and no privilege escalation

R3E production integration is Linux-only.

On non-Linux hosts it must fail closed before artifact open or external invocation.

R3E MUST NOT use:

```text
sudo
setuid escalation
setgid escalation
capability escalation
namespace entry
mount
ptrace
```

If the K2 host process lacks permission to read the configured artifacts/runtime state or contact the injected E2 resolver, observation is unavailable.

There is no fallback to a weaker observer.

---

## 11. Same-FD verification for both trusted artifacts

R3E must reuse the canonical K2 same-FD trust pattern already proven by H4-R2C.

For each configured artifact—runsc and the Kodac observer helper—K2 must:

1. open the configured absolute path read-only;
2. require a regular non-empty file;
3. enforce a bounded artifact size;
4. read/hash bytes from that exact retained descriptor;
5. re-stat the same descriptor and require identity-relevant metadata stability;
6. require the observed SHA-256 to equal trusted configuration;
7. retain that exact descriptor for child execution/inheritance;
8. never reopen the configured path for the trusted invocation.

Path-hash followed by path-exec is forbidden.

---

## 12. Fixed R3E inherited descriptor protocol

R3E reserves the following child descriptors:

```text
FD 3 = verified runsc artifact
FD 4 = verified Kodac gvisor-proc-observe helper artifact
```

These numbers are fixed and caller-unselectable.

For runsc state/stats invocation:

```text
child FD 3 = retained verified runsc artifact
file = /proc/self/fd/3
```

For native process observation:

```text
child FD 3 = retained verified runsc artifact
child FD 4 = retained verified observer-helper artifact
file = /proc/self/fd/4
args = ["--pid", <exact state PID>]
```

The existing R3D helper already interprets FD 3 as the trusted runsc artifact.

R3E does not require the helper to mutate or close FD 4 because the helper performs no subsequent target exec. The descriptor exists only for the bounded helper process lifetime.

If `/proc/self/fd` execution or exact descriptor inheritance is unavailable, R3E fails closed.

---

## 13. R3D command plans remain pure and authoritative for arguments

R3E MUST preserve the canonical R3D pure module and its plan identity semantics.

After a validated E2 container binding is returned, K2 creates the R3D observer plan from trusted runtime config plus the resolver-provided full container ID.

The exact command arguments remain:

State:

```text
["--root", runtimeRoot, "state", containerId]
```

Stats:

```text
["--root", runtimeRoot, "events", "--stats", containerId]
```

The R3D materialized `file = runscPath` value is retained as plan/configuration identity only.

Production R3E execution uses `/proc/self/fd/3` and MUST NOT execute `runscPath` after verification.

---

## 14. Pinned gVisor process semantics

R3E adds one explicit source-level clarification needed by production integration.

Pinned gVisor source:

```text
repository:
google/gvisor
commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293
```

adds the following relevant evidence:

```text
runsc/container/container.go
blob 5ea716990eacbd5511bcc75f4661817900577211

runsc/sandbox/sandbox.go
blob 70724a90adae59759b489b13e50942588c61ea70

runsc/cmd/state.go
blob 5c948173f280f49d0bace91651ab058dec76faa3

runsc/container/state_file.go
blob 0fcd70dff37a476dea1bee1dee6da760f8040edf
```

Pinned `sandbox.Sandbox` defines `Pid` as the PID of the running sandbox.

Pinned container creation writes the OCI/runtime PID file using `c.SandboxPid()`.

R3E therefore interprets the host PID surfaced by the R3D state observation as a **gVisor sandbox-process subject**, not as a guest application PID.

The R3D helper's `/proc/<pid>/exe` same-artifact check is consequently a host runtime-process theorem.

R3E MUST NOT reinterpret this PID as guest process identity.

---

## 15. Exact observation sequence

After policy/requirement validation, E2 subject resolution, and same-FD artifact verification, R3E must perform the following bounded sequence:

```text
A. runsc state #1 through verified FD 3
B. parse exact R3D state #1
C. observer helper #1 through verified FD 4 with runsc artifact on FD 3
D. parse exact R3D process #1 and require PID = state #1 PID
E. runsc events --stats through verified FD 3
F. parse exact R3D stats event
G. runsc state #2 through verified FD 3
H. parse exact R3D state #2
I. observer helper #2 through verified FD 4 with runsc artifact on FD 3
J. parse exact R3D process #2
K. require exact-instance bracket equality
L. build/validate the canonical R3D E3 candidate
M. build R3E integrated runtime-lineage record
N. durably commit the R3E record
O. validate exact commit acknowledgment
```

No step may be silently skipped.

---

## 16. Exact-instance bracket theorem

R3E MUST reject observation unless:

```text
state #1 containerId = binding containerId
state #2 containerId = binding containerId
state #1 stateIdentity = state #2 stateIdentity
process #1 processIdentity = process #2 processIdentity
process #1 pid = state #1 pid
process #2 pid = state #2 pid
```

Because R3D process identity includes PID, start ticks, executable device, inode, and size, equality rejects PID reuse and same-subject process replacement across the observation bracket.

R3D state identity intentionally excludes diagnostic annotations, so annotation-only drift does not break exact-instance identity.

Any process exit, restart, state PID change, bundle change, status change, or executable-artifact mismatch fails closed.

---

## 17. Stats remains a liveness signal, not resource proof

R3D deliberately excludes nested stats values from its normalized stats observation.

R3E preserves that boundary.

Successful exact-ID `runsc events --stats` inside the state/process bracket proves only that the verified runsc artifact successfully reached the runtime control path for the exact bound container ID during the bracket.

R3E MUST NOT derive from the stats payload:

- CPU enforcement proof;
- memory enforcement proof;
- network isolation proof;
- output-limit proof;
- TTL proof.

Those remain future physical-proof work.

---

## 18. R3E integrated runtime-lineage record

R3E may define one pure durable record version:

```text
kodac-h4-r3e-gvisor-runtime-lineage-v1
```

The record contains exactly the bounded identities needed for this slice, purpose-equivalent to:

```text
version
evidenceClass = e3-integrated-runtime-lineage
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
observerImplementationIdentity
runscArtifactIdentity
observerHelperArtifactIdentity
planIdentity
stateIdentity
statsIdentity
processIdentity
r3dCandidateIdentity
runtimeInstanceIdentity
recordIdentity
```

`runtimeInstanceIdentity` must bind at minimum:

```text
containerId
state PID
process start ticks
runsc artifact identity
R3D plan identity
```

The record MUST NOT contain any R3B physical-policy facts.

It MUST NOT be structurally assignable to `SandboxBackendObservation`.

---

## 19. Observer implementation identity

R3E must make the trusted observer implementation itself identifiable.

Its implementation identity must deterministically bind at minimum:

```text
R3E integration contract version
verified runsc SHA-256
verified observer-helper SHA-256
R3D observer-plan version
R3D process protocol version
```

A change to either trusted artifact digest must change observer implementation identity.

No mutable path string alone may satisfy implementation identity.

---

## 20. Durable evidence commit

R3E requires durable evidence before any caller receives a successful integrated observation result.

The trusted commit interface must receive the exact immutable R3E lineage record and return an acknowledgment bound to its `recordIdentity`.

Commit acknowledgment must itself be validated strictly.

If commit throws, times out, returns a malformed acknowledgment, or acknowledges a different record identity:

```text
R3E RESULT = UNPROVEN / FAIL CLOSED
```

The K2 call must not return a successful observation object.

No local in-memory success is sufficient.

---

## 21. Output, stderr, timeout, and process bounds

R3E must preserve the R3D protocol ceilings and use bounded child lifetimes.

At minimum:

```text
runsc state stdout <= 65536 bytes
runsc stats stdout <= 262144 bytes
observer helper stdout <= 512 bytes
observer helper stderr <= 4096 bytes
```

Runsc stderr must also be bounded and treated as diagnostics only.

All child invocations require explicit timeouts and cancellation.

No unbounded buffering, detached process, shell insertion, or inherited arbitrary stdio is authorized.

The public caller cannot raise protocol ceilings.

---

## 22. Environment and working-directory authority

R3E runsc/helper invocations must not inherit arbitrary caller-supplied environment.

The integration must use a fixed or trusted-host-snapshotted minimal environment defined by implementation and covered by tests.

Untrusted caller input may not set Go/runtime/loader/debug environment variables for observer processes.

No shell is used.

Working directory must be fixed and must not carry authority for subject selection or artifact resolution.

---

## 23. Cancellation and late events

Cancellation before durable evidence acknowledgment results in no successful R3E observation.

On cancellation or timeout K2 must terminate any child observer command that it owns and close retained descriptors.

Late stdout/stderr/exit/evidence events must not revise a terminal blocked/unproven result.

R3E does not authorize killing or mutating the observed gVisor sandbox itself.

---

## 24. Failure and no-downgrade rules

Any of the following makes the R3E observation unavailable:

- non-Linux host;
- missing/invalid runtime configuration;
- resolver failure or identity mismatch;
- abbreviated/malformed container ID;
- artifact path not regular/non-empty/bounded;
- artifact digest mismatch;
- artifact metadata mutation;
- `/proc/self/fd` execution unavailable;
- state/stats/helper output overflow;
- child timeout/non-zero failure;
- malformed R3D parse;
- state/process bracket mismatch;
- helper executable mismatch against runsc FD 3;
- evidence commit/acknowledgment failure.

There is no fallback to:

```text
PATH runsc
guest dmesg
guest uname
Docker runtime label alone
container environment
PID-only observation
unverified helper
unverified runsc
```

---

## 25. No direct R3B promotion

R3E MUST NOT import or call a constructor that mints `SandboxBackendObservation` or `SandboxExecutionEvidence` from its integrated lineage record.

The R3E result intentionally lacks:

```text
observedSourceDigest
observedNetworkPolicy
observedResourcePolicy
observedCredentialBindingIdentity
downgradeOccurred
R3B observationIdentity
R3B evidenceIdentity
```

Therefore canonical R3B capability flags for physical source/network/resource observation remain unproven by R3E.

---

## 26. `ask` remains blocked

R3E is an observer integration slice, not target-executable approval identity.

It does not prove arbitrary external target executable bytes and does not authorize a new approval path.

Existing external-process `ask` restrictions remain unchanged.

No R3E method may be used as a side channel to execute caller-selected binaries.

---

## 27. R3D primitive must remain byte/semantic compatible

R3E does not authorize changes to:

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
```

The canonical R3D helper and pure primitive must remain byte-identical during R3E implementation.

R3E may reconcile the R3D focused test only because that test currently pins the old `gateway.ts` blob and asserts no production integration exists.

All R3D fixed identity vectors and primitive behavior must remain unchanged.

---

## 28. Historical regression-pin reconciliation

Current repository tests intentionally pin `packages/kodac-runtime/src/execution/gateway.ts` to the pre-R3E blob:

```text
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560
```

R3E intentionally supersedes only that gateway non-integration byte pin.

The implementation may update the explicitly allowlisted predecessor tests below only to:

- replace the superseded gateway byte pin;
- preserve their original behavioral theorem;
- add explicit assertions that R3E does not affect their owned authority surface.

They MUST NOT weaken existing H4/H5 behavior tests.

---

## 29. Exact pre-ledger implementation allowlist

After this authorization becomes canonical, R3E implementation may modify exactly these twelve pre-ledger paths:

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

No thirteenth pre-ledger path is authorized.

In particular, R3E MUST NOT modify:

```text
packages/kodac-runtime/native/gvisor-proc-observe.c
packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/*
.github/workflows/*
```

Before implementation writes, an exact repository search must re-confirm that the twelve-path reconciliation set covers every executable test that still pins the superseded gateway blob. If an additional executable test is discovered, implementation must stop and reconcile authorization before changing that extra path.

---

## 30. Evidence ledger lifecycle

The implementation evidence ledger path is reserved as:

```text
docs/planning/KODAC_KDO_H4_R3E_K2_GVISOR_OBSERVER_EXACT_INSTANCE_BINDING_EVIDENCE_2026-08-15.md
```

It MUST NOT exist during implementation/pre-ledger review.

After exact-head pre-ledger PASS, it may be created in one ledger-only commit as the sole additional path.

Fresh post-ledger certification is mandatory.

Any implementation correction after ledger creation invalidates that ledger cycle; the ledger must be withdrawn/recreated or otherwise reconciled so accepted evidence never describes superseded implementation bytes.

---

## 31. Required focused proof

The R3E focused suite must prove at minimum:

1. public caller cannot provide container ID;
2. only resolver-provided full 64-lowerhex ID is accepted;
3. resolver identities must match the K2-created attempt and exact R3B requirement/workload;
4. runsc/helper artifact digest mismatches fail before trusted invocation;
5. runsc executes through `/proc/self/fd/3`, never configured path after verification;
6. helper executes through `/proc/self/fd/4` and receives the same verified runsc artifact on FD 3;
7. fake pinned runsc fixture can expose one live sandbox process whose executable is the same runsc artifact;
8. initial/final state and process identities must match;
9. process restart/PID reuse/exec drift across the bracket fails;
10. stats exact subject mismatch fails;
11. output overflow and malformed protocols fail closed;
12. evidence commit failure or wrong acknowledgment prevents success;
13. result is structurally non-assignable to R3B observation/evidence;
14. no Docker/containerd socket/client import exists in production R3E paths;
15. R3D native/helper/pure module blobs remain canonical and unchanged;
16. existing generic `runCommand`, Landlock read-only execution, approvals, receipts, agent behavior, and H5 behavior remain unchanged;
17. Linux-focused same-FD integration runs in CI; non-Linux hosts test structural fail-closed behavior without pretending physical proof.

A strong Linux fixture should compile one small original test-only fake-runsc executable that can both:

- remain alive as a sandbox-process fixture; and
- answer bounded `state` / `events --stats` commands.

This lets the real canonical R3D helper prove `/proc/<state-pid>/exe` equals the same runsc artifact without requiring real gVisor installation in repository CI.

---

## 32. Required repository gates

Any R3E implementation PR must pass, at exact accepted head:

```text
governance / provenance
legacy tests / ruff
runtime-change classifier
Ubuntu runtime typecheck + full test + benchmark
Windows runtime typecheck + full test + benchmark
macOS runtime typecheck + full test + benchmark
K2 runtime aggregate gate
K3-R4 regression gate
K3-R5 regression gate
focused R3E proof
manual trust/security review
0 unresolved actionable review threads
```

Automated external reviewer availability must be recorded accurately. A rate-limited or pending bot is not a completed review PASS.

---

## 33. Maximum claim after canonical R3E implementation

Only after:

- this authorization is canonical;
- implementation stays within allowlist;
- exact-head pre-ledger gate passes;
- ledger-only transition is proven;
- fresh exact-head post-ledger gate passes;
- canonical merge succeeds;

may Kodac make the bounded claim:

```text
KODAC_K2_GVISOR_OBSERVER_EXACT_INSTANCE_BINDING_PROVEN
```

Meaning only:

> K2 can durably bind one validated gVisor execution requirement to one trusted E2 full-container subject and one same-FD-verified runsc/helper observation bracket, producing a durable E3 integrated runtime-lineage record without minting R3B physical backend evidence.

It does not mean:

```text
R3B physical source proof proven
R3B deny-all network proof proven
R3B CPU/memory/TTL/output proof proven
Docker backend production execution proven
container creation/lifecycle proven
external-process ask enabled
H4 complete
H6 authorized
```

---

## 34. Expected next candidate after proven R3E

If R3E becomes canonical/proven, the next candidate should separately decide the provider-specific control-plane/lifecycle step needed to bind the R3A workload to a real backend instance.

A likely candidate is purpose-equivalent to:

```text
KDO-H4-R3F — Docker Read-Only Container Binding Provider / Physical Policy Observation Authorization
```

That future slice must decide, independently:

- exact Docker Engine API/read-only surface, if any;
- immutable image digest binding;
- deny-all network physical observation;
- CPU/memory enforcement observations;
- TTL/lifecycle enforcement ownership;
- output-bound semantics;
- whether enough conjunction exists to mint any R3B physical fact.

R3E does not pre-authorize those decisions.

---

## 35. Explicit non-authority

This document does not authorize implementation by itself until merged canonically.

This document does not authorize:

- Docker/containerd socket access;
- container lifecycle mutation;
- real workload creation;
- registry access;
- direct runtime-root reads outside verified runsc commands;
- cgroup/netns inspection;
- R3B observation/evidence minting;
- approval/receipt/Done Gate mutation;
- external-process `ask`;
- H4 closure;
- H6 work.

The intended R3E implementation is a narrow K2-owned read-only observer integration and exact-instance lineage proof only.
