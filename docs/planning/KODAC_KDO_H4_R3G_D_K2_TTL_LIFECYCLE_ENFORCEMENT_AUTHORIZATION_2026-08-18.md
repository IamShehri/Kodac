# KDO-H4-R3G-D — K2 TTL / Lifecycle Enforcement Authorization

Date: 2026-08-18
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `96fb2cb3bbd2cbf4b5802f218b02189654a0775c`
Canonical base tree: `6675ed732b0c8f020c9000d689ff0436702acafe`
Predecessor: canonical H4-R3G-C physical deny-all network observation
Governing split: `docs/planning/KODAC_KDO_H4_R3G_LINUX_DOCKER_GVISOR_PHYSICAL_POLICY_CONJUNCTION_SPLIT_2026-08-16.md`

---

## 1. Decision

```text
GATE:
KDO-H4-R3G-D

NAME:
K2 TTL / LIFECYCLE ENFORCEMENT

AUTHORIZATION CLASS:
DOCS-ONLY AUTHORIZATION CANDIDATE

IMPLEMENTATION BY THIS COMMIT:
NONE

R3G-A PHYSICAL CPU/MEMORY OBSERVATION:
CANONICAL / PROVEN

R3G-B IMMUTABLE SOURCE/ROOTFS PHYSICAL LINEAGE:
CANONICAL / PROVEN

R3G-C PHYSICAL DENY-ALL NETWORK OBSERVATION:
CANONICAL / PROVEN

TTL REQUIREMENT CONTRACT:
EXISTS

TTL PHYSICAL/LIFECYCLE ENFORCEMENT:
NOT YET PROVEN

NEW MUTATION AUTHORITY AFTER THIS AUTHORIZATION BECOMES CANONICAL:
ONLY THE NARROW EXACT-SUBJECT TERMINATION AUTHORITY DEFINED HERE

GENERIC CONTAINER LIFECYCLE API:
NOT AUTHORIZED

CONTAINER CREATE / START / EXEC / PAUSE / UNPAUSE:
NOT AUTHORIZED

ARBITRARY KILL / DELETE:
NOT AUTHORIZED

R3B BACKEND OBSERVATION MINTING:
NOT AUTHORIZED

R3B EXECUTION EVIDENCE MINTING:
NOT AUTHORIZED

OUTPUT-LIMIT ENFORCEMENT:
NOT AUTHORIZED

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

H4 COMPLETE:
NO
```

This document authorizes no product-code mutation by itself. It defines the bounded implementation theorem and mutation authority that MAY be implemented only after this authorization candidate is reviewed, merged, and post-merge certified on canonical `main`.

The intended bounded theorem is:

```text
validated R3B ttlMs requirement
+ K2-created exact lifecycle lease identity
+ exact R3E/R3F container/runtime-instance binding
+ verified trusted lifecycle implementation
+ isolated non-main-event-loop deadline watchdog
+ fixed exact-ID gVisor termination path
+ deterministic expiry/natural-exit race semantics
+ exact terminal acknowledgement
+ durable K2 evidence commit
= E3 TTL / LIFECYCLE ENFORCEMENT RECORD
!= E4 R3B PHYSICAL BACKEND PROOF
```

---

## 2. Naming clarification: R3G-D is not historical H4-R3D

Kodac already has a historical gate named `H4-R3D`:

```text
KODAC_KDO_H4_R3D_GVISOR_RUNTIME_OBSERVER_PRIMITIVE_AUTHORIZATION_2026-08-15.md
```

This document is the later **R3G split child** named:

```text
H4-R3G-D
```

The dash is semantically important. R3G-D does not reopen, supersede, or rename historical H4-R3D.

---

## 3. Canonical predecessor truth

Canonical R3G-C merged through PR #116 as:

```text
96fb2cb3bbd2cbf4b5802f218b02189654a0775c
```

with tree:

```text
6675ed732b0c8f020c9000d689ff0436702acafe
```

Canonical R3G-C bounded claim:

```text
KODAC_LINUX_GVISOR_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_PROVEN
```

R3G-C does not prove TTL, output limits, credentials, final R3B conjunction, malicious-host resistance, or H4 completion.

This authorization preserves all of those nonclaims.

---

## 4. Governing R3G split boundary

The canonical R3G split rejected one monolithic physical-policy implementation and separated the physical facts by trust surface.

It explicitly assigns:

```text
TTL -> K2-owned timer + lifecycle mutation/termination
output -> K2-owned bounded aggregate stdout/stderr path
```

and states that TTL/output require separate authorization because they introduce distinct runtime ownership and may require side effects.

Therefore R3G-D is not a read-only observer. It is the first R3G split child whose proof necessarily depends on a bounded state-changing lifecycle authority.

That difference is security-significant and must remain explicit.

---

## 5. Canonical evidence ladder remains unchanged

R3C/R3G established:

```text
REQUIREMENT
!= CONFIGURATION
!= CONTROL-PLANE STATUS
!= OBSERVATION SIGNAL
!= TRUSTED PHYSICAL PROOF
```

and the evidence classes:

```text
E0 = untrusted workload/guest claim
E1 = desired/declarative configuration
E2 = trusted host control-plane observation
E3 = trusted host physical/runtime state or enforcement candidate
E4 = accepted Kodac physical proof after exact conjunction
```

R3G-D may produce only an explicit E3 TTL/lifecycle enforcement record.

It MUST NOT mint or masquerade as:

```text
SandboxBackendObservation
SandboxExecutionEvidence
```

---

## 6. Existing `ttlMs` is a requirement, not enforcement

Canonical source:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
blob 84ee9f8ec49bd5e187d564ae4433cfe0a44f7af8
```

already carries `resourcePolicy.ttlMs` in the validated `SandboxWorkloadRequirement` and binds it into requirement identity.

The existing contract already bounds TTL to a positive integer with the pre-existing maximum:

```text
24 hours
```

R3G-D does not widen or narrow that public contract and MUST NOT introduce a new product quota disguised as a security feature.

A valid `ttlMs` proves only what was required. It does not prove a timer was armed, that a deadline was respected, or that the exact sandbox was terminated.

---

## 7. Existing command `timeoutMs` is not TTL proof

Canonical source:

```text
packages/kodac-runtime/src/execution/gateway.ts
blob 1732dae059fc878c04e6b1bb6a117385efe9ed6a
```

already contains operational command/launcher timeouts and child-process kill behavior.

Those mechanisms are not R3G-D proof because they may bound only:

```text
one Node child
one helper process
one launcher invocation
one read/RPC operation
```

They do not establish that the exact gVisor sandbox workload is lifecycle-bounded by the R3B `ttlMs` requirement.

The following proof substitution is forbidden:

```text
command timed out
=> sandbox TTL enforced
```

Likewise, `AbortSignal` cancellation is not TTL enforcement.

---

## 8. ADR-0006 makes K2 the only product lifecycle authority

Canonical ADR-0006 requires every privileged or state-changing capability to flow through:

```text
Intent
-> Capability registration/check
-> Policy evaluation
-> Approval resolution when required
-> Sandbox/backend selection
-> Execute
-> Verify
-> Evidence capture
-> Execution Receipt
```

and assigns that path to `ExecutionGateway` and the Trust Kernel.

Therefore R3G-D MUST NOT add:

- a model-callable `runsc kill` tool;
- a plugin/MCP lifecycle bypass;
- a generic container kill service;
- direct arbitrary Docker lifecycle mutation;
- a helper that independently decides product authorization;
- caller-selected lifecycle commands.

The watchdog/enforcer is a subordinate trusted execution mechanism. K2 remains the authorization owner.

---

## 9. Why a normal main-event-loop timer is insufficient

A security theorem over TTL cannot depend solely on a callback scheduled in the same TypeScript/Node event loop that performs ordinary Kodac orchestration.

A design purpose-equivalent to:

```ts
setTimeout(() => terminateSandbox(), ttlMs)
```

inside the main gateway process is insufficient as the physical enforcement mechanism because unrelated synchronous work, event-loop starvation, runtime stalls, or process failure can delay or eliminate the callback.

R3G-D therefore requires an **isolated watchdog execution context** whose deadline progression is independent of Kodac's main orchestration event loop.

The first implementation may use one narrow process-isolated native or otherwise independently scheduled trusted helper, but it MUST satisfy the fixed contract in this authorization and MUST NOT become a second product runtime.

ADR-0008 permits narrow trusted workers behind versioned Kodac-owned boundaries and prefers process isolation for security-sensitive helpers. R3G-D uses that architectural allowance only because the normal main event loop is not a sufficient TTL enforcement boundary.

---

## 10. No impossible zero-latency claim

R3G-D MUST NOT claim that a userspace process can guarantee physical death at the exact mathematical nanosecond of the TTL deadline.

Scheduler latency, kernel scheduling, host suspension, catastrophic host failure, and malicious-host behavior are outside such a theorem.

The v1 enforceable claim is narrower:

```text
K2 arms an independently progressing deadline for the exact admitted sandbox;
K2 does not intentionally extend that deadline;
at expiry the watchdog initiates the fixed exact-subject termination path;
and success is not recorded until the required terminal acknowledgement is established.
```

Any quantitative scheduler-overrun bound requires separate measured evidence and is not implied by this slice.

---

## 11. TTL lease begins at a precise admission boundary

R3G-D MUST NOT invent historical runtime age.

A sandbox may already be running before K2 completes the exact-instance binding needed by R3G-D. Therefore v1 TTL is a **K2 enforcement lease**, not a retroactive claim about container creation time.

The lease start boundary must occur only after:

```text
validated SandboxExecutionRequirement
+ K2-created attempt identity
+ trusted full container binding
+ exact live runtime-instance admission
+ trusted artifact verification needed to arm enforcement
```

and before K2 returns any R3G-D success/armed record.

The resulting theorem is:

```text
leaseStart -> leaseStart + ttlMs
```

not:

```text
unknown container creation time -> creation time + ttlMs
```

A future slice may define creation-time TTL only if it owns and proves container creation/start lineage.

---

## 12. No silent TTL extension

Once the R3G-D lease is armed for an exact execution attempt:

- the deadline is immutable;
- caller retries cannot extend it;
- observer retries cannot extend it;
- reconnecting to the watchdog cannot extend it;
- policy re-evaluation cannot silently extend it;
- evidence persistence retries cannot extend it;
- wall-clock adjustment cannot extend it;
- a duplicate arm for the same attempt must fail closed or deterministically return the exact existing immutable lease without moving the deadline.

Any explicit TTL renewal/extension feature is out of scope and requires separate authorization.

This rule is a security invariant, not a product usage quota.

---

## 13. Time source requirements

The watchdog must use a host-owned monotonic time source suitable for duration measurement and MUST NOT derive enforcement from mutable wall-clock timestamps such as `Date.now()` alone.

The implementation authorization requires tests proving that wall-clock jumps cannot extend the lease.

Host suspend/resume semantics MUST be made explicit by implementation and evidence. R3G-D v1 MUST NOT claim termination while the trusted host itself is suspended or unavailable unless the chosen primitive actually proves that behavior.

---

## 14. Exact subject authority comes from canonical R3E/R3F lineage

R3E already made the public caller unable to select raw `containerId` and required K2 to create `executionAttemptIdentity` while a trusted resolver returns the exact full 64-lowerhex container ID for the attempt/requirement/workload tuple.

R3G-D preserves that rule.

The public/model/plugin surface MUST NOT select:

```text
containerId
runtimeRoot
runscPath
signal
kill mode
watchdog executable
watchdog deadline
lifecycle command
```

The R3G-D subject must be bound to canonical trusted identity material including at minimum:

```text
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
observerImplementationIdentity / trusted runtime identity
ttlMs
```

A structurally valid caller-constructed object is not trusted provenance by itself.

---

## 15. Dedicated R3G-D K2 capability

R3G-D implementation must define a dedicated Trust-Kernel-owned capability purpose-equivalent to:

```text
runtime.enforce.gvisor.ttl
```

It MUST NOT express lifecycle enforcement as generic caller-selected `runCommand`.

The capability has:

- a fixed semantic purpose;
- no caller-selected executable;
- no caller-selected arguments;
- no caller-selected host paths;
- no caller-selected signal;
- no approval bypass;
- bounded output/protocol messages;
- explicit receipts and durable evidence requirements.

For this physical security capability, `ASK` remains blocked rather than being used as a path to widen lifecycle authority.

---

## 16. Trusted runtime configuration

R3G-D may extend or compose the existing trusted gVisor runtime configuration with only the fields necessary for TTL enforcement, purpose-equivalent to:

```text
verified runsc artifact authority
trusted runtimeRoot
trusted exact container-binding / runtime-lineage authority
verified watchdog helper artifact authority
bounded watchdog protocol limits
durable R3G-D evidence commit interface
```

The caller cannot override those fields per invocation.

Invalid or absent runtime configuration fails closed before any arm success is reported.

---

## 17. Same-FD artifact identity remains mandatory

R3E established same-FD verification for trusted runsc/helper artifacts. R3G-D must preserve that pattern for every executable trusted artifact it introduces.

For each trusted executable artifact K2 must, before arming the lease:

1. open the trusted absolute path read-only;
2. require a regular non-empty file;
3. enforce a bounded artifact size;
4. hash bytes from that exact retained descriptor;
5. re-stat the same descriptor and require identity-relevant metadata stability;
6. require the observed SHA-256 to match trusted configuration;
7. execute/inherit that exact retained descriptor rather than reopen a mutable path;
8. re-verify where the lifecycle theorem requires it.

Path-hash followed by path-exec is forbidden.

---

## 18. Pinned gVisor source study

R3G-D retains the canonical pinned gVisor source:

```text
repository:
google/gvisor

commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293

tree:
12ce7f8c4f8b0481cccb4c28632fff49cb3f50e4
```

Relevant pinned source includes:

```text
runsc/cmd/kill.go
runsc/cmd/delete.go
runsc/cmd/state.go
runsc/container/container.go
```

The source study is evidence for semantics only. This authorization copies no gVisor code and adds no gVisor library dependency.

---

## 19. Fixed v1 expiry mutation

The first R3G-D implementation is authorized to evaluate exactly one expiry mutation purpose-equivalent to:

```text
verified runsc
--root <trusted runtimeRoot>
kill --all <exact full containerId> SIGKILL
```

The exact argument ordering must follow the pinned runsc CLI contract used by the implementation and be fixed by trusted code/tests.

Rationale from the pinned source:

- `kill --all` targets all processes in the container rather than only the init process;
- the container signal path with `all=true` and `SIGKILL` waits for all processes to exit before successful return.

R3G-D does NOT authorize arbitrary signals, arbitrary container IDs, caller-selected runtime roots, or generic runsc command execution.

---

## 20. `delete --force` is cleanup, not TTL proof

Pinned runsc exposes a separate delete/destroy lifecycle path.

R3G-D MUST NOT equate:

```text
container metadata deleted
```

with:

```text
TTL termination theorem proven
```

The primary v1 proof path is exact-subject termination, not object deletion.

If implementation needs `delete --force` for bounded post-terminal cleanup, that cleanup must be separately identified in code/tests and MUST NOT be the sole basis for the E3 TTL enforcement record.

If safe cleanup semantics cannot be demonstrated without widening mutation authority, delete remains out of the implementation slice.

---

## 21. Exact terminal acknowledgement

A successful spawn or successful signal send is insufficient by itself.

R3G-D success after expiry requires a bounded terminal acknowledgement tied to the exact admitted subject.

The authorization accepts a theorem purpose-equivalent to:

```text
same verified runsc artifact
+ exact trusted runtimeRoot
+ exact full containerId
+ kill --all SIGKILL successful completion under pinned semantics
+ no subject-identity substitution during the admitted lifecycle window
= exact R3G-D termination acknowledgement
```

A generic later `runsc state` failure is not independently sufficient, because inability to load state can have causes other than the intended trusted termination.

Any additional state check may strengthen evidence but may not weaken the positive kill acknowledgement requirement.

---

## 22. Natural exit before deadline

A workload may terminate naturally before TTL expiry.

R3G-D must handle that case without keeping a stale watchdog capable of killing a future replacement subject.

The safe v1 sequence is purpose-equivalent to:

```text
exact live subject admitted
-> immutable lease armed
-> exact natural terminal event OR deadline expiry
-> whichever terminal path wins becomes authoritative
-> watchdog is irreversibly disarmed only for the same exact subject after trusted terminal acknowledgement
-> durable final lifecycle record
```

Natural exit is not a TTL violation.

A natural-exit record may prove that the workload ceased before its lease deadline, but it MUST NOT fabricate an expiry kill event.

---

## 23. Expiry versus natural-exit race

The expiry/natural-exit race must be deterministic and idempotent.

Requirements:

- at most one terminal lifecycle outcome is committed for one lease;
- a late natural-exit acknowledgement cannot move or renew the deadline;
- a late expiry action cannot target a replacement container;
- duplicate kill acknowledgement must not widen authority;
- if the exact subject cannot be proven at the mutation boundary, R3G-D fails closed rather than guessing;
- cleanup after either terminal outcome is bounded and non-authoritative for proof.

The implementation must have hostile tests for the race in both orderings.

---

## 24. Container replacement / identifier reuse defense

R3G-D must not retain only a string container ID and blindly kill it at a later deadline.

The lifecycle lease must bind the exact admitted runtime-instance identity, and the watchdog mutation path must preserve enough trusted subject identity to prevent killing a replacement object that merely occupies a reusable name/path/ID slot.

Full 64-lowerhex ID matching remains mandatory, but ID-string equality alone is not the complete theorem.

If exact-subject continuity cannot be established at expiry, no positive TTL proof may be emitted. The implementation must choose the fail-closed outcome that avoids mutating an unproven replacement subject.

---

## 25. Watchdog arm acknowledgement

K2 MUST NOT return an `armed`/success R3G-D record merely because it spawned a watchdog process.

The watchdog protocol must provide a bounded acknowledgement only after:

```text
protocol parsed
+ exact immutable lease identity accepted
+ trusted subject material accepted
+ monotonic deadline armed
+ required trusted executable descriptors retained/ready
```

K2 validates the acknowledgement identity exactly before reporting success.

EOF, crash, malformed response, protocol overflow, unknown fields, mismatched identity, or timeout before arm acknowledgement is failure.

---

## 26. Parent/watchdog failure semantics

The lifecycle theorem must not depend on the main Kodac event loop remaining responsive after the lease is armed.

After successful arm acknowledgement, ordinary parent event-loop blockage must not disable the watchdog deadline.

The implementation must explicitly test and document:

- parent/main-event-loop blockage after arm;
- parent-to-watchdog communication loss after arm;
- watchdog unexpected exit;
- K2 process shutdown behavior;
- child descriptor lifetime;
- no accidental watchdog cancellation by caller AbortSignal.

A watchdog crash cannot be interpreted as successful enforcement.

If the architecture cannot guarantee enforcement after a particular trusted-host process failure, that failure mode must be an explicit nonclaim rather than hidden by a success record.

---

## 27. Cancellation is separate from TTL

Caller cancellation/`AbortSignal` may stop waiting for an R3G-D API result, but it MUST NOT silently cancel an already armed TTL lease.

Once the lease is armed, only a trusted exact-subject terminal acknowledgement may disarm it.

This prevents:

```text
arm TTL
-> caller aborts request
-> watchdog disappears
-> sandbox lives forever
```

A future explicit administrative cancellation/renewal API requires separate authorization.

---

## 28. R3G-D E3 record

R3G-D may define one durable intermediate record version purpose-equivalent to:

```text
kodac-h4-r3g-d-gvisor-ttl-lifecycle-v1
```

The record should bind exactly the facts needed for the slice, purpose-equivalent to:

```text
version
evidenceClass = e3-ttl-lifecycle-enforcement
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
ttlMs
leaseIdentity
watchdogImplementationIdentity
runscArtifactIdentity
watchdogArtifactIdentity
leaseStartMonotonicIdentity / bounded monotonic timing evidence
deadlineIdentity
armAcknowledgementIdentity
terminalOutcome = natural-exit | ttl-expired
terminationAcknowledgementIdentity when ttl-expired
recordIdentity
```

Wall-clock timestamps may be included only as diagnostics if existing evidence conventions require them; they cannot be the sole enforcement clock or identity basis.

The record MUST NOT contain or imply output-limit proof or final R3B proof.

---

## 29. Durable commit before positive success

The final R3G-D lifecycle record must be durably committed through a trusted K2 evidence interface before a positive terminal proof is returned as complete.

A commit acknowledgement must bind at minimum:

```text
leaseIdentity
recordIdentity
exact record payload digest
```

A persistence error cannot be downgraded to a warning.

For an armed-but-not-yet-terminal lease, the implementation must also ensure that loss of the caller/API response does not erase the already armed enforcement obligation.

---

## 30. Observer/watchdog implementation identity

R3G-D must deterministically identify the trusted lifecycle implementation.

Its implementation identity must bind at minimum:

```text
R3G-D protocol/contract version
verified runsc SHA-256
verified watchdog helper SHA-256
fixed expiry mutation semantics
monotonic deadline semantics
terminal acknowledgement semantics
```

Changing trusted artifact bytes or the lifecycle contract must change implementation identity.

Mutable path strings alone are insufficient.

---

## 31. No artificial product limits

R3G-D is a security enforcement mechanism over one already validated `ttlMs` requirement. It MUST NOT become a Kodac-imposed product usage limit.

R3G-D MUST NOT introduce:

```text
daily execution quota
PR quota
review quota
file quota
agent quota
vendor-controlled busy state
trial exhaustion
forced waiting queue
artificial global TTL unrelated to the requested/policy security requirement
```

The pre-existing R3B TTL contract remains a per-execution safety requirement.

Real throughput may still be bounded by host resources or upstream providers. R3G-D does not add artificial throughput scarcity.

---

## 32. Linux/gVisor v1 only

The first implementation is Linux + gVisor only.

It does not prove equivalent lifecycle enforcement for:

```text
macOS
Windows
Docker runc
containerd generic runtime
Kubernetes
remote sandbox providers
microVMs
```

Cross-platform CI remains required for repository regression safety, but the physical lifecycle theorem itself is Linux/gVisor-only.

---

## 33. No malicious-host theorem

R3G-D trusts the admitted host-side K2/watchdog/runsc execution environment according to the existing H4 threat boundary.

It does not prove resistance to:

- malicious root on the host;
- kernel compromise;
- hypervisor compromise;
- arbitrary host clock/kernel tampering by privileged attackers;
- SIGSTOP/kill of trusted watchdog by malicious root;
- host power loss;
- malicious replacement of already trusted kernel/runtime behavior.

Such claims require a stronger trust anchor and are not implied here.

---

## 34. Hostile proof classes required before evidence ledger

The implementation exact head must prove at least the following hostile classes before the evidence ledger transition:

1. invalid/non-positive/out-of-contract `ttlMs` rejected by canonical requirement validation;
2. non-gVisor requirement rejected;
3. non-Linux production path fails before lifecycle mutation;
4. policy DENY blocks before arm/mutation;
5. ASK does not become lifecycle escalation;
6. caller cannot choose container ID;
7. caller cannot choose runtime root;
8. caller cannot choose runsc/watchdog executable path or digest;
9. caller cannot choose signal or kill mode;
10. runsc artifact path replacement after verification cannot redirect execution;
11. watchdog artifact path replacement after verification cannot redirect execution;
12. wrong runsc digest fails closed;
13. wrong watchdog digest fails closed;
14. malformed/oversized watchdog protocol fails closed;
15. arm acknowledgement identity mismatch fails closed;
16. watchdog spawn without arm acknowledgement is not success;
17. wall-clock jump cannot extend lease;
18. main Node event-loop blockage after arm does not disable expiry initiation;
19. caller AbortSignal after arm does not disarm TTL;
20. retry/replay cannot extend immutable deadline;
21. duplicate arm cannot create a later deadline;
22. exact TTL expiry invokes only fixed exact-ID `kill --all ... SIGKILL` semantics;
23. killing only the launcher/Node child cannot satisfy proof;
24. kill command failure cannot satisfy proof;
25. generic `runsc state` failure alone cannot satisfy proof;
26. natural exit before deadline produces natural terminal outcome without fabricated expiry;
27. natural-exit then expiry race cannot kill a replacement subject;
28. expiry then late natural-exit race is idempotent;
29. container subject replacement/reuse ambiguity fails closed without mutating unproven replacement;
30. watchdog unexpected exit is never interpreted as proven TTL;
31. durable commit rejection means no complete positive terminal proof;
32. durable commit replay/fresh-observation semantics are exact and bounded;
33. no output-limit proof is minted;
34. no R3B `SandboxBackendObservation` is minted;
35. no R3B `SandboxExecutionEvidence` is minted;
36. existing R3E/R3F/R3G-A/B/C protected theorems remain regression-green;
37. no generic lifecycle/runCommand bypass is introduced;
38. no new artificial product quota/queue/review limit is introduced.

Fixtures may use shorter TTL values for test runtime, but production contract semantics must remain exact.

---

## 35. Narrow implementation allowlist

After this authorization is canonical, the first R3G-D implementation SHOULD be limited to the smallest purpose-equivalent paths needed for the theorem, expected to include:

```text
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
packages/kodac-runtime/src/execution/gateway-gvisor-ttl.ts
packages/kodac-runtime/native/gvisor-ttl-watchdog.c OR one equivalently narrow isolated trusted helper
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kdo-h4-r3g-d-gvisor-ttl.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-d-runtime.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-d-certification.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-d-replay-race.test.ts
```

If implementation discovery proves a different path is necessary, the PR must explain why it is purpose-equivalent and does not widen authority.

Changes to generic schema, R3B final evidence contracts, unrelated gateway surfaces, Docker create/start/exec lifecycle, output limiting, credentials, pricing, quotas, or provider limits are out of scope.

No external donor code import is authorized by this document.

---

## 36. Native helper boundary

If the isolated watchdog is implemented as a native helper, it must remain a narrow K2-owned worker, not a second runtime.

It may receive only the bounded immutable lifecycle material necessary to:

```text
arm exact deadline
retain exact trusted subject/artifact authority
wait independently
perform fixed expiry termination
emit bounded acknowledgements
```

It MUST NOT:

- evaluate product policy;
- accept arbitrary commands;
- read arbitrary host files;
- access Docker/containerd sockets;
- open network connections;
- mutate workspace files;
- execute caller-selected binaries;
- expose a reusable general process-execution API.

The implementation must use repository-consistent reproducible build/test mechanics and capture the helper artifact SHA-256 in trusted configuration/evidence.

---

## 37. Required technical gates

Before any R3G-D evidence ledger is created or updated, the exact implementation head must pass all applicable canonical gates, including at minimum:

```text
TypeScript typecheck
full kodac-runtime test suite
governance
provenance / change classification
Ubuntu runtime
macOS runtime regression
Windows runtime regression
K2 runtime gate
K3-R4 regression gate
K3-R5 regression gate where applicable
native-helper build/hostile tests on Linux
R3G-D hostile proof suite
R3E/R3F/R3G-A/R3G-B/R3G-C regression proofs
```

A required run that did not execute cannot be reported as PASS.

Platform jobs on non-Linux may validate fail-closed behavior and repository compatibility without claiming physical TTL enforcement on those platforms.

---

## 38. Manual architecture / trust / security review

Before ledger transition, manual review must explicitly answer:

```text
Does exact subject authority remain caller-independent?
Does TTL use an isolated deadline mechanism rather than the main event loop alone?
Can retry/replay extend the deadline?
Can abort/disconnect disable an armed lease?
Can a stale watchdog kill a replacement subject?
Is kill authority fixed to exact-ID all-process SIGKILL semantics?
Is delete/cleanup kept separate from proof?
Is durable evidence required before complete success?
Is final R3B minting still impossible in this slice?
Were any artificial product limits introduced?
```

Any `YES` to an unsafe widening question blocks the ledger transition.

---

## 39. Fresh external exact-head review gate

Before ledger transition, the exact implementation head must receive at least one fresh external review on that exact SHA after the last source/test mutation.

All actionable source/test findings must be resolved or explicitly rejected with evidence before the ledger commit.

A review of an older SHA does not certify a newer implementation head.

If review-driven fixes modify source/test bytes, all affected exact-head gates and fresh review requirements reset.

---

## 40. Evidence ledger protocol

The R3G-D evidence ledger may be written only after:

- exact implementation head is known;
- all required technical gates pass on that head;
- manual architecture/trust/security review passes;
- fresh external exact-head review passes;
- zero unresolved actionable source/test findings remain.

Then one dedicated ledger-only commit may record:

```text
implementation parent SHA/tree
all source/test/helper blob identities
watchdog implementation identity
runsc pin and source-study identities
hostile proof results
workflow/run IDs
review identities
explicit nonclaims
```

The ledger-only commit MUST NOT modify production/test/schema/workflow/dependency bytes.

After the ledger commit, fresh post-ledger exact-head certification is required according to canonical workflow applicability. Absence of a required fresh run may not be represented as PASS.

---

## 41. Guarded merge and post-merge certification

The implementation PR may merge only if:

- authorization is already canonical;
- PR base is the expected canonical main;
- exact implementation/ledger head is stable;
- all required checks/reviews are satisfied;
- zero unresolved actionable findings remain;
- mergeability is stable;
- no scope widening occurred.

After merge, the exact merge commit on `main` must pass canonical post-merge quality/gates before any R3G-D proven claim is emitted.

A green PR head is not a substitute for exact merge-commit certification.

---

## 42. Authorization PR gate

This docs-only authorization candidate itself may become canonical only after:

- its diff remains docs-only;
- canonical base remains valid or any rebase is explicitly reconciled;
- governance/checks applicable to docs changes pass;
- external review has no unresolved actionable authorization finding;
- the document does not accidentally authorize implementation before merge;
- guarded merge completes;
- exact authorization merge commit is verified on `main`.

Only then may R3G-D product implementation begin.

---

## 43. Eventual allowed claim

Only after canonical authorization, implementation, evidence-ledger transition, guarded merge, and exact merge-commit post-merge certification may the bounded claim be emitted:

```text
KODAC_LINUX_GVISOR_PHYSICAL_TTL_LIFECYCLE_ENFORCEMENT_PROVEN
```

That claim means only the R3G-D v1 theorem defined here.

---

## 44. Explicit nonclaims

R3G-D does NOT prove:

```text
zero-nanosecond TTL overshoot
malicious-host resistance
host power-loss resistance
termination while a host is suspended unless separately proven
container creation-time lifetime
renewable leases
administrative TTL extension
output-limit enforcement
credential binding
source/rootfs proof beyond canonical R3G-B
network proof beyond canonical R3G-C
CPU/memory proof beyond canonical R3G-A
macOS TTL enforcement
Windows TTL enforcement
non-gVisor TTL enforcement
R3B SandboxBackendObservation
R3B SandboxExecutionEvidence
R3G final conjunction
external-process ASK
H4 complete
```

---

## 45. Final authorization decision

```text
R3G-D AUTHORIZATION CANDIDATE:
READY FOR EXACT-HEAD REVIEW

PRODUCT CODE:
NOT AUTHORIZED UNTIL THIS DOCUMENT IS CANONICAL

TARGET IMPLEMENTATION:
NARROW LINUX/gVISOR K2 TTL LIFECYCLE ENFORCEMENT

TRUST MODEL:
EXACT SUBJECT + VERIFIED ARTIFACTS + ISOLATED DEADLINE WATCHDOG + FIXED TERMINATION + DURABLE EVIDENCE

ARTIFICIAL PRODUCT LIMITS:
FORBIDDEN

R3B FINAL MINTING:
FORBIDDEN

NEXT AFTER CANONICAL AUTHORIZATION:
R3G-D IMPLEMENTATION ONLY
```
