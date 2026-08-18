# KDO-H4-R3G-E — K2 Aggregate Output-Bound Enforcement Authorization

Date: 2026-08-18
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY / NO PRODUCT IMPLEMENTATION**
Repository: `TheHalfMoon/Kodac`
Canonical base: `7785442a7529833914f2fd017311b9242f5cdce9`
Canonical base tree: `141d45e5cfdf998f26c9a5040ea65e97cc2003ff`
Predecessor: canonical H4-R3G-D K2 TTL / lifecycle enforcement

---

## 1. Decision

```text
GATE:
KDO-H4-R3G-E

NAME:
K2 AGGREGATE OUTPUT-BOUND ENFORCEMENT

CHANGE CLASS:
DOCS ONLY / AUTHORIZATION / NO EXECUTION

R3G-D:
MERGED / CANONICAL / PROVEN

R3G-E PRODUCT CODE:
NOT AUTHORIZED UNTIL THIS DOCUMENT IS CANONICAL

TARGET PLATFORM:
LINUX + DOCKER ENGINE + gVISOR

TARGET AUTHORITY:
K2-OWNED AGGREGATE STDOUT/STDERR ACCEPTANCE BOUNDARY

R3B FINAL OBSERVATION/EVIDENCE MINTING:
FORBIDDEN

R3G FINAL CONJUNCTION:
FORBIDDEN

EXTERNAL-PROCESS ASK:
REMAINS BLOCKED

GENERIC DOCKER LIFECYCLE AUTHORITY:
FORBIDDEN

H4 COMPLETE:
NO

LATER H4 SLICE:
NOT AUTHORIZED BY THIS DOCUMENT
```

R3G-E authorizes only a narrow output-acceptance theorem for one exact admitted execution attempt.

It does not authorize R3G-F, final R3B minting, generic container execution, generic Docker attach/log APIs, lifecycle kill/start/stop/remove, output-history reconstruction, or any artificial product usage quota.

---

## 2. Canonical predecessor truth

Canonical `main` at R3G-E entry:

```text
7785442a7529833914f2fd017311b9242f5cdce9
```

Canonical tree:

```text
141d45e5cfdf998f26c9a5040ea65e97cc2003ff
```

R3G-D bounded canonical claim:

```text
KODAC_LINUX_GVISOR_PHYSICAL_TTL_LIFECYCLE_ENFORCEMENT_PROVEN
```

R3G-D proves only its authorized TTL/lifecycle theorem. It does not prove output-bound enforcement, R3B final evidence, R3G conjunction, external-process ASK, or H4 completion.

R3G-E MUST preserve that boundary.

---

## 3. Governing canonical semantics

The canonical R3G split is:

```text
source/rootfs -> separate physical lineage theorem
network       -> separate physical network theorem
CPU/memory    -> separate cgroup-v2 theorem
TTL           -> K2-owned deadline/lifecycle theorem
output        -> K2-owned bounded aggregate stdout/stderr path
final proof   -> later trusted conjunction + R3B minting
```

Canonical split document:

```text
docs/planning/KODAC_KDO_H4_R3G_LINUX_DOCKER_GVISOR_PHYSICAL_POLICY_CONJUNCTION_SPLIT_2026-08-16.md
blob 21e94791fb3f4255def4cc19c9dd8dcbf274d500
```

Its output theorem requires explicit definitions for:

```text
stdout/stderr aggregation semantics
byte accounting
stream ownership
overflow behavior
bounded buffering
termination/truncation semantics
late-output behavior
durable evidence
```

Canonical R3C additionally defines `maxOutputBytes` as the maximum aggregate output evidence accepted at the Kodac workload execution boundary.

Canonical R3C document:

```text
docs/planning/KODAC_KDO_H4_R3C_BACKEND_SEMANTICS_TRUSTED_OBSERVATION_RECONCILIATION_2026-08-15.md
blob d8ef34a86e350a4b055f36def54f04dc8d3ed580
```

R3G-E does not widen that meaning into a theorem about every byte a container may have written outside Kodac's admitted output boundary.

---

## 4. Existing `maxOutputBytes` is a requirement, not enforcement

Canonical workload source:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
blob 84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8
```

already carries:

```text
SandboxResourcePolicy.maxOutputBytes
```

and binds it into the workload/resource-policy identity.

The canonical public maximum remains:

```text
16777216 bytes
```

R3G-E MUST NOT change that public maximum, workload identity encoding, or R3A resource-policy schema.

A valid `maxOutputBytes` proves only what was requested. It does not prove that stdout/stderr were captured through one authoritative path, aggregated correctly, bounded, or durably evidenced.

---

## 5. R3B remains all-or-nothing and protected

Canonical source:

```text
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
blob b9242c5cecc18fd43b2b80aeffd974ef5311fded
```

contains the final capability field:

```text
supportsOutputLimitObservation
```

and the all-or-nothing `SandboxBackendObservation` / `SandboxExecutionEvidence` contract.

R3G-E MUST NOT:

- set or mint a final R3B capability declaration;
- create `SandboxBackendObservation`;
- create `SandboxExecutionEvidence`;
- synthesize a complete `observedResourcePolicy`;
- mark output proof as E4;
- perform final R3G conjunction.

R3G-E output is an intermediate E3 candidate only.

---

## 6. Existing generic command buffering is not R3G-E proof

Canonical source:

```text
packages/kodac-runtime/src/execution/gateway.ts
blob 1732dae059fc878c04e6b1bb6a117385efe9ed6a
```

contains generic command helpers including `execFile(... maxBuffer ...)` and a one-stream `readBoundedStream(...)` helper.

Those mechanisms are not accepted as R3G-E physical/output-bound evidence because they do not, by themselves, prove the required exact gVisor workload subject, one authoritative stdout+stderr boundary, raw aggregate accounting, durable output evidence, or absence of a same-attempt output bypass.

The following substitution is forbidden:

```text
a helper command had a maxBuffer
=>
R3A maxOutputBytes was physically enforced for the exact sandbox workload
```

R3G-E requires a dedicated K2-owned path.

---

## 7. K2 remains the only product authority

ADR-0006 and the canonical H4 execution spine keep privileged execution and evidence ownership inside `ExecutionGateway` / Trust Kernel authority.

R3G-E therefore MUST use a dedicated capability purpose-equivalent to:

```text
runtime.enforce.gvisor.output-bound
```

The capability is internal/trusted and exact-purpose only.

Public/model/plugin/MCP input MUST NOT select:

```text
Docker socket path
container ID
attach endpoint path
API version
stdout/stderr selection
stdin attachment
TTY mode
logs mode
stream framing
byte-counting mode
output reset/renewal
overflow disposition
```

ASK remains blocked for this physical enforcement slice. Approval MUST NOT become a bypass for output-bound failure.

---

## 8. Exact v1 theorem

R3G-E v1 may eventually claim only the following bounded theorem:

```text
For one exact K2 execution attempt and exact admitted Docker/gVisor subject,
K2 establishes one trusted output-acceptance channel bound to that subject.

Every stdout/stderr payload byte accepted by Kodac for that attempt through the
R3G-E boundary contributes exactly once to one aggregate raw-byte counter.

Kodac accepts at most requirement.workload.resourcePolicy.maxOutputBytes bytes
across stdout + stderr combined.

No byte that would make the aggregate exceed the limit may be accepted into
model/tool output, execution receipt payload, or positive output evidence.

A positive R3G-E E3 record is impossible if the authoritative channel is
ambiguous, replaced, malformed, bypassed, over-limit, incompletely framed, or
not durably committed.
```

This is an **output-acceptance boundary theorem**, not a theorem that the container can never write additional bytes internally or to a transport after Kodac closes its acceptance channel.

---

## 9. Admission boundary and historical-output nonclaim

R3G-E MUST NOT invent historical output.

The first v1 output-bound interval begins only after:

```text
validated SandboxExecutionRequirement
+ K2-created executionAttemptIdentity
+ trusted exact Docker container binding
+ exact gVisor runtime-instance lineage validation
+ exact Docker endpoint validation
+ trusted output channel establishment
```

and before Kodac accepts any workload output for the R3G-E-governed attempt.

R3G-E does not claim to reconstruct output emitted before this admission boundary.

The following is forbidden:

```text
attach late to an already-outputting subject
+ ignore previously accepted output from another path
+ declare full-attempt output bound proven
```

For a positive R3G-E proof, **all Kodac-accepted stdout/stderr for that execution attempt must flow through the R3G-E counted boundary**. Any same-attempt bypass, parallel consumer that can feed accepted output, or unknown pre-admission accepted output invalidates proof and must fail closed.

Docker logs MUST NOT be used to manufacture historical completeness for v1.

---

## 10. Trusted Docker stream surface

R3G-E v1 authorizes exactly one new Docker read/stream surface behind the already-trusted R3F provider closure:

```text
POST /v1.48/containers/{exactFullContainerId}/attach
?logs=0
&stream=1
&stdin=0
&stdout=1
&stderr=1
```

No caller may supply the socket path or container ID.

The output opener must remain bound to the existing trusted R3F binding resolver/provider identity, purpose-equivalent to the current private `WeakMap` mechanism used for subordinate trusted source observation.

Canonical R3F implementation:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
blob f9e2dda11fe26d481e2e6c328c37cd37a6260106

Docker API version:
1.48

Moby source pin:
d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
```

Pinned Moby API source-study identity:

```text
api/docs/v1.48.yaml
blob 7b11c5d00028046576aad721c6a5fc83cbac4fa9
```

This authorization adds no dependency and copies no Moby implementation code.

---

## 11. TTY/stdin/log mode must fail closed

Pinned API v1.48 defines non-TTY attach output as multiplexed stdout/stderr frames and TTY output as one raw PTY stream.

R3G-E v1 requires separable stdout/stderr accounting and therefore requires trusted pre-channel inspection to prove:

```text
Config.AttachStdout == true
Config.AttachStderr == true
Config.AttachStdin == false
Config.OpenStdin == false
Config.Tty == false
```

Any disagreement fails closed.

The attach request itself is fixed to:

```text
logs=0
stream=1
stdin=0
stdout=1
stderr=1
```

R3G-E MUST NOT use:

- `logs=1` as a history substitute;
- websocket attach;
- TTY/raw PTY mode;
- stdin attachment;
- caller-selected attach options.

---

## 12. Exact multiplex framing and raw-byte accounting

For v1 non-TTY attach, each frame is interpreted as:

```text
8-byte transport header
+
payloadLength bytes of raw payload
```

with the pinned protocol encoding:

```text
byte 0   = stream type
bytes 1-3 = reserved zero bytes
bytes 4-7 = uint32 big-endian payload length
```

Accepted stream types for R3G-E are only:

```text
1 = stdout
2 = stderr
```

Stream type `0` (stdin), any unknown stream type, nonzero reserved bytes, truncated header, truncated payload, impossible length, malformed upgrade, or protocol ambiguity MUST fail closed.

Accounting semantics are exactly:

```text
acceptedAggregateBytes = acceptedStdoutBytes + acceptedStderrBytes
```

Only raw **payload bytes** count toward `maxOutputBytes`.

The 8-byte Docker transport header does not count as workload output.

Accounting MUST occur on raw bytes before UTF-8 decoding, line splitting, JSON parsing, terminal rendering, log formatting, or model/tool transformation.

A multi-byte UTF-8 sequence therefore counts by its actual byte length, not character count.

---

## 13. Aggregate means stdout + stderr combined

R3G-E MUST NOT implement two independent limits such as:

```text
stdout <= maxOutputBytes
stderr <= maxOutputBytes
```

because that could admit approximately twice the canonical bound.

Every accepted stdout/stderr payload advances one shared aggregate counter for the exact execution attempt.

Interleaving does not reset the counter.

Retry/reconnect MUST NOT reset the counter or create a fresh allowance for the same attempt.

A duplicate exact operation may only return/reconcile the same immutable aggregate state; it may not replenish the output budget.

---

## 14. Bounded buffering is mandatory

R3G-E MUST remain memory-bounded independently of the workload's output rate.

The implementation must:

- parse incrementally;
- never buffer an unbounded attach response;
- never use repeated growing concatenation as an unbounded accumulator;
- never allocate a declared frame payload beyond an authorized fixed parser bound;
- retain at most the canonical accepted-output ceiling plus small fixed protocol overhead;
- bound response headers, upgrade handshake, frame header, partial-frame state, error text, and evidence serialization separately;
- apply bounded read/inactivity deadlines so a stalled Docker peer cannot hold K2 forever.

A peer-advertised `uint32` frame length does not authorize a `uint32`-sized allocation.

---

## 15. Exact-bound and overflow semantics

The exact limit is inclusive:

```text
aggregate == maxOutputBytes
=> may remain valid

nextPayloadWouldMakeAggregate > maxOutputBytes
=> overflow
```

On overflow:

1. the offending payload MUST NOT be accepted as positive workload output beyond the remaining allowance;
2. no successful/within-bound E3 record may be minted;
3. the attach transport must be hard-closed/cancelled by K2;
4. the execution/output operation must terminalize as `output-limit-exceeded` or an equivalent fixed failure outcome;
5. late bytes, buffered tail, a later successful reconnect, or a downstream consumer MUST NOT convert the overflowed attempt into success;
6. durable failure/reconciliation state must prevent retry from replenishing the same attempt's budget.

R3G-E v1 **does not authorize container kill on overflow**.

Closing the Kodac acceptance channel enforces the canonical R3C output-evidence boundary. R3G-D remains the separately proven lifecycle/termination authority.

If a future theorem requires immediate exact-subject termination specifically because output overflow occurred, that requires a separate narrow reconciliation/authorization; it must not be smuggled into R3G-E through generic Docker kill, host PID kill, or an undocumented R3G-D trigger.

---

## 16. Abort, disconnect, replacement, and late-output rules

Caller cancellation or transport disconnect does not create a positive output proof.

R3G-E MUST fail closed on:

- K2 abort before positive durable completion;
- Docker socket replacement;
- binding/container replacement;
- runtime-instance lineage drift;
- malformed or incomplete frame at channel end;
- unexpected attach response status/upgrade semantics;
- output bypass discovery;
- output channel reconnect whose continuity cannot be proven;
- unknown whether already-counted bytes were accepted before reconnect.

Late data after overflow or after the authoritative output operation has terminalized cannot become accepted evidence.

A clean transport EOF alone is not sufficient proof of exact workload terminal causality unless the implementation also binds completion to the authorized exact-subject terminal/lineage evidence required by the final contract.

---

## 17. Exact subject identity

R3G-E must bind every operation/record to the same exact subject identity family established by the canonical R3E/R3F/R3G chain, including at minimum:

```text
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
R3F providerIdentity
R3F socketEndpointIdentity
outputChannelIdentity
maxOutputBytes
```

The trusted resolver/provider closure, not the public caller, supplies the mutable host locator needed to open the Docker Unix socket.

The exact full container ID must come from the trusted binding for the same attempt.

R3G-E must bracket channel establishment and terminal completion with sufficient trusted subject/endpoint revalidation to reject replacement or drift.

---

## 18. R3G-D remains protected and separate

Canonical R3G-D production identities at R3G-E entry include:

```text
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
blob de0de7a8c9ec1cf4911e60658b82aecda6aa17ae

packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
blob 26b0f8094afb8e61ec29e05496c7aa91bf2f6e7f
```

The first R3G-E implementation MUST keep the R3G-D watchdog/protocol/lifecycle authority byte-identical.

R3G-E MUST NOT add:

- output-overflow commands to the R3G-D watchdog;
- a generic kill request;
- Docker kill/stop/remove;
- host PID signalling;
- TTL renewal/extension;
- lifecycle authority selected by output payload bytes.

The two slices may later be conjoined by exact identities; they are not merged into one authority here.

---

## 19. Intermediate E3 output record only

The first implementation should expose a deterministic immutable record purpose-equivalent to:

```text
e3-output-bound-candidate
```

A positive record should bind at minimum:

```text
R3G-E contract version
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
providerIdentity
socketEndpointIdentity
outputChannelIdentity
maxOutputBytes
acceptedStdoutBytes
acceptedStderrBytes
acceptedAggregateBytes
stdoutDigest
stderrDigest
aggregateTranscriptDigest
terminal/closure evidence identity
outputObserverImplementationIdentity
recordIdentity
```

`acceptedAggregateBytes` must equal the exact integer sum of the two stream counters and must be `<= maxOutputBytes`.

The record/digests must be computed from fixed domain-separated ordered preimages.

An overflowed or indeterminate attempt must never be represented by this positive within-bound record.

R3G-E MUST NOT make this record structurally assignable to final `SandboxBackendObservation` or `SandboxExecutionEvidence`.

---

## 20. Transcript/digest semantics

A positive R3G-E record may retain bounded accepted bytes for downstream use, but evidence identities must not depend on text decoding.

At minimum, the implementation must define fixed domain-separated digests over:

```text
stdout accepted payload bytes in stdout order
stderr accepted payload bytes in stderr order
one ordered aggregate frame transcript
```

The aggregate transcript must distinguish stream type and exact payload boundaries so that these histories do not collide semantically:

```text
stdout:"ab", stderr:"c"
stdout:"a", stderr:"bc"
stdout:"abc"
```

Raw payload bytes remain authoritative.

---

## 21. Durable state and replay

A positive output-bound result is not valid until its exact E3 record is durably committed through a K2-owned callback/configured evidence boundary.

The implementation must define deterministic operation identity and replay semantics such that:

- duplicate exact replay cannot reset the byte counter;
- conflicting payload/subject/limit for one operation identity fails closed;
- uncertain commit outcome can only reconcile to the same exact bytes/identity;
- overflow state cannot be replayed as positive success;
- a crash after bytes were accepted but before durable completion cannot silently forget those bytes and restart the budget.

If continuity cannot be established after process restart, the operation is indeterminate/fail-closed; v1 MUST NOT fabricate an unconsumed output budget.

---

## 22. No artificial Kodac usage limits

R3G-E is enforcement of an existing per-workload security requirement already supplied by the validated R3A contract.

It MUST NOT introduce Kodac-imposed:

```text
daily output quotas
review quotas
PR quotas
file quotas
request quotas
account-level token quotas
vendor trial exhaustion
forced waiting queues
artificial busy states
```

`maxOutputBytes` is not a commercial usage-control mechanism.

---

## 23. Initial implementation path authorization

Only after this authorization document is canonical may the first R3G-E implementation modify/add the following purpose-equivalent paths:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
  additive trusted-provider output-channel opener only;
  R3F serialized observation identities/semantics must remain unchanged

packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
  new R3G-E contracts, identities, validators, durable E3 record

packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
  new K2 policy/capability/output-channel orchestration

packages/kodac-runtime/src/index.ts
  additive exports only

packages/kodac-runtime/test/kdo-h4-r3g-e-output-contract.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-e-docker-stream.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-e-runtime.test.ts
```

Exact filenames may be reconciled docs-only before implementation if repository truth requires it, but scope may not widen implicitly.

The following canonical files are protected from first-slice mutation:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
packages/kodac-runtime/native/gvisor-ttl-watchdog.c
schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
```

No dependency or workflow mutation is authorized by this document.

---

## 24. Required hostile/regression proof suite

Before an R3G-E evidence ledger may exist, exact implementation head tests must prove at minimum:

```text
aggregate exactly N bytes across interleaved stdout/stderr => accepted
aggregate N+1 => overflow/failure
stdout N + stderr N does not produce a 2N allowance
Docker 8-byte frame headers do not count as workload bytes
raw UTF-8 multibyte payload counts by bytes, not characters
zero-length frames do not reset/replenish budget
unknown stream type fails closed
stdin stream type fails closed
nonzero reserved header bytes fail closed
truncated 8-byte header fails closed
truncated payload fails closed
oversized declared frame length does not cause oversized allocation
TTY=true fails closed
AttachStdout=false fails closed
AttachStderr=false fails closed
AttachStdin/OpenStdin=true fails closed
logs mode is not used as historical proof
socket endpoint replacement fails closed
container/binding replacement fails closed
runtime-instance drift fails closed
parallel same-attempt output bypass prevents positive proof
abort cannot become positive proof
transport disconnect cannot become positive proof
stall/inactivity timeout is bounded
late bytes after overflow cannot become success
reconnect cannot reset aggregate budget
crash/replay cannot reset aggregate budget
conflicting replay fails closed
uncertain durable commit cannot become positive success
R3F canonical observation vectors remain unchanged
R3G-D TTL/lifecycle regression suite remains unchanged/passing
R3G-A/B/C predecessor proof regressions remain passing
no R3B final constructor/minting appears in R3G-E delta
no generic Docker lifecycle endpoint appears in production R3G-E delta
```

No skipped or non-executed required proof may be represented as PASS.

---

## 25. Required technical gates

Before ledger transition, exact implementation head must pass all applicable canonical gates, including at minimum:

```text
TypeScript typecheck
full kodac-runtime test suite
governance/provenance
k2-runtime exact-head gate
Ubuntu runtime
Windows regression
macOS regression
R3F regression
R3G-A regression
R3G-B regression
R3G-C regression
R3G-D regression
R3G-E hostile proof suite
k3-r4 / k3-r5 where workflow applicability requires
```

A required run that did not execute cannot be reported as PASS.

Non-Linux jobs may validate fail-closed/platform compatibility without claiming Linux Docker/gVisor output enforcement.

---

## 26. Manual architecture / trust / security review

Before ledger transition, manual review must explicitly answer:

```text
Does exact subject authority remain caller-independent?
Is every Kodac-accepted stdout/stderr byte for the governed attempt routed through one counted boundary?
Can any retry/reconnect reset the aggregate budget?
Can stdout and stderr each independently consume maxOutputBytes?
Are Docker framing bytes excluded while raw payload bytes are counted exactly once?
Can malformed/oversized framing cause unbounded allocation?
Can TTY/stdin/log mode bypass the theorem?
Can endpoint/container/runtime replacement retain positive proof?
Can abort/disconnect/late bytes become success?
Can overflow produce a positive within-bound E3 record?
Does overflow accidentally gain generic lifecycle authority?
Is R3G-D lifecycle authority still byte/protocol isolated?
Is final R3B minting still impossible?
Were any artificial product usage limits introduced?
```

Any unsafe widening blocks the ledger transition.

---

## 27. Fresh external exact-head review gate

Before ledger transition, the exact implementation head must receive at least one fresh external review on that exact SHA after the last source/test mutation.

All actionable findings must be resolved or explicitly rejected with evidence.

Any source/test fix resets exact-head gates and fresh-review requirements as applicable.

---

## 28. Evidence ledger protocol

Only after exact-head technical gates, manual review, fresh external review, and zero unresolved actionable findings may one dedicated ledger-only commit record:

```text
implementation parent SHA/tree
source/test blob identities
R3F provider/output-opener identity
Moby source/API pin identities
hostile proof results
workflow/run IDs
review identities
explicit nonclaims
```

The ledger-only commit MUST NOT modify production/test/schema/workflow/dependency bytes.

Fresh post-ledger exact-head certification is required before Ready/merge.

---

## 29. Guarded merge and post-merge certification

The R3G-E implementation PR may merge only if:

- this authorization is already canonical;
- PR base is the expected canonical main;
- exact implementation/ledger head is stable;
- all required checks/reviews are satisfied;
- zero unresolved actionable findings remain;
- mergeability is stable;
- no scope widening occurred.

Merge must be guarded against the exact certified head.

After merge, the exact merge commit on `main` must pass all applicable canonical push/post-merge gates before any bounded R3G-E proven claim is emitted.

A green PR head is not a substitute for exact merge-commit certification.

---

## 30. Eventual allowed bounded claim

Only after canonical authorization, implementation, evidence-ledger transition, guarded merge, and exact merge-commit post-merge certification may the bounded claim be emitted:

```text
KODAC_LINUX_GVISOR_K2_AGGREGATE_OUTPUT_BOUNDARY_ENFORCEMENT_PROVEN
```

That claim means only the R3G-E v1 theorem in this authorization:

```text
Kodac's authoritative K2 output-acceptance boundary for the exact admitted
Docker/gVisor execution attempt accepts at most the canonical aggregate raw
stdout+stderr byte allowance and fails closed on ambiguity/overflow.
```

It does NOT mean that the container is physically incapable of writing more bytes after Kodac closes or refuses its acceptance channel.

---

## 31. Explicit nonclaims

R3G-E does NOT prove or authorize:

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
NO R3B SandboxBackendCapabilityDeclaration final minting
NO R3B SandboxBackendObservation
NO R3B SandboxExecutionEvidence
NO R3G final conjunction
NO external-process ASK enablement
NO H4 completion
NO later H4 slice
NO account/user/review/request commercial usage quota
```

---

## 32. Authorization PR gate

This docs-only authorization candidate may become canonical only after:

- its diff remains exactly docs-only and scope-bounded;
- canonical base remains valid or movement is explicitly reconciled;
- applicable governance/checks pass;
- fresh external review has zero unresolved actionable authorization findings;
- the document does not authorize product implementation before merge;
- guarded merge completes;
- exact authorization merge commit is verified on `main`;
- applicable post-merge governance completes successfully.

Only then may R3G-E product implementation begin.

---

## 33. Final authorization decision

```text
R3G-E AUTHORIZATION CANDIDATE:
READY FOR EXACT-HEAD REVIEW

PRODUCT CODE:
NOT AUTHORIZED UNTIL THIS DOCUMENT IS CANONICAL

TARGET IMPLEMENTATION:
NARROW LINUX DOCKER/gVISOR K2 AGGREGATE STDOUT+STDERR ACCEPTANCE BOUNDARY

RAW BYTE ACCOUNTING:
REQUIRED

AGGREGATE STDOUT+STDERR:
REQUIRED

DOCKER API:
PINNED V1.48 ATTACH ONLY

TTY:
FORBIDDEN IN V1

STDIN:
FORBIDDEN

DOCKER LOG HISTORY:
NOT PROOF

OVERFLOW:
FAIL CLOSED + CLOSE ACCEPTANCE CHANNEL

NEW LIFECYCLE/KILL AUTHORITY:
NONE

ARTIFICIAL PRODUCT LIMITS:
FORBIDDEN

R3B FINAL MINTING:
FORBIDDEN

R3G FINAL CONJUNCTION:
FORBIDDEN

NEXT AFTER CANONICAL AUTHORIZATION:
R3G-E IMPLEMENTATION ONLY
```
