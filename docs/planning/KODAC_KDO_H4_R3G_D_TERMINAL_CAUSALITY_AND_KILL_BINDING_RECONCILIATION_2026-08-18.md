# KDO-H4-R3G-D — Terminal Causality and Kill-Binding Reconciliation

Date: 2026-08-18
Status: AUTHORIZATION CANDIDATE RECONCILIATION — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Applies to:
- `KODAC_KDO_H4_R3G_D_K2_TTL_LIFECYCLE_ENFORCEMENT_AUTHORIZATION_2026-08-18.md`
- `KODAC_KDO_H4_R3G_D_ARM_DURABILITY_RECONCILIATION_2026-08-18.md`
Authorization package parent head: `755cb98ac7c0acefdc23bbc13b524ccc45bebb9f`
Canonical base remains: `96fb2cb3bbd2cbf4b5802f218b02189654a0775c`
Pinned gVisor remains: `50e1502a95d36ad2faf2c7ef33b8bf21fe975293`

---

## 1. Decision

Two review findings against the R3G-D authorization package are valid and are resolved normatively by this reconciliation:

```text
A. terminal outcome must have host-trusted causal ordering
   rather than post-hoc stopped-state inference;

B. expiry mutation must remain bound to the exact admitted runtime instance
   across the final validation -> mutation boundary,
   rather than re-resolving a mutable container ID or socket pathname.
```

The parent authorization is therefore tightened to require one narrow process-isolated Linux lifecycle watchdog/helper that owns the exact lease terminalization race and retains exact-instance handles/control channels across the mutation boundary.

This document authorizes no product-code mutation by itself.

---

## 2. Canonical R3E runtime-instance identity is reused exactly

R3G-D does not invent a weaker replacement identity.

Canonical R3E defines `runtimeInstanceIdentity` and requires it to bind at minimum:

```text
containerId
state PID
process start ticks
runsc artifact identity
R3D plan identity
```

Canonical R3E also requires exact-instance bracket equality and explains that R3D process identity includes:

```text
PID
start ticks
executable device
executable inode
executable size
```

R3G-D MUST reuse the exact canonical R3E/R3D identity material already admitted for the lease.

A container ID alone is never an exact runtime-instance identity.

---

## 3. Why standalone `runsc kill <containerId>` is insufficient at the proof boundary

Pinned gVisor `runsc/cmd/kill.go` loads a container from the runtime root using the supplied container ID and only then invokes `Container.SignalContainer`.

Pinned gVisor `runsc/container/state_file.go` explicitly documents that its running/stopped check during `Load()` is inherently racy, and the state-file lock used by `Load()` is released before the loaded `Container` object is returned.

Therefore this sequence is forbidden as the R3G-D physical proof boundary:

```text
runsc state <id>
-> compare expected identity
-> runsc kill --all <id> SIGKILL
```

Even if the two commands are adjacent, the second command performs a fresh name/ID based load and does not prove that mutation targets the same runtime instance observed by the first command.

Likewise, merely taking the gVisor metadata lock for one read and later invoking the ordinary CLI does not close the gap.

---

## 4. Pinned gVisor primitives that may be reused

Pinned gVisor provides the following source-level primitives relevant to the bounded helper:

```text
Sandbox.ControlSocketPath
Sandbox.GetControlSocketPath()
sandbox uRPC connection
boot.ContMgrWait
boot.ContMgrSignal
boot.SignalArgs
boot.DeliverToAllProcesses
Container.SignalContainer(SIGKILL, all=true)
```

Pinned `Sandbox.SignalContainer` maps `all=true` to `boot.DeliverToAllProcesses` and issues `boot.ContMgrSignal`.

Pinned `Sandbox.Wait` uses `boot.ContMgrWait` to wait for container exit.

Pinned source documents that all-process SIGKILL waits for all processes to exit before successful return.

R3G-D may reuse these semantics only through the exact-instance retained-channel rules below.

---

## 5. Narrow lifecycle helper is now required for v1 proof

For R3G-D v1, ordinary standalone `runsc kill` CLI is not sufficient to mint positive TTL enforcement evidence.

The implementation MUST use one narrow process-isolated Linux trusted helper/watchdog whose only mutation capability is:

```text
for one already-authorized immutable R3G-D lease,
signal the exact admitted gVisor container through the already-bound sandbox
with:

signal = SIGKILL
mode = DeliverToAllProcesses
```

The helper MUST NOT expose:

```text
arbitrary container IDs
arbitrary signals
arbitrary process IDs
exec
create
start
stop
pause
unpause
delete
checkpoint
restore
raw generic gVisor RPC
Docker/containerd mutation
```

The caller/model cannot select any of those values.

K2 remains the sole product authorization authority under ADR-0006.

---

## 6. Retained exact-instance binding before lease arm

Before R3G-D may report a lease as physically armed, the helper must establish one exact-instance binding purpose-equivalent to the following sequence:

```text
A. receive immutable K2 lease material over the fixed trusted helper protocol;
B. load the exact full 64-lowerhex container subject once from trusted runtimeRoot;
C. require loaded container ID = expected containerId;
D. require loaded sandbox PID = expected R3E state PID;
E. establish the bounded sandbox control connection(s) that will be retained;
F. open and retain a pidfd for the expected sandbox PID;
G. re-run the canonical R3D process/executable identity checks for that retained PID;
H. require PID/start-ticks/executable identity to match the admitted R3E runtime instance;
I. require the deterministic `runtimeInstanceIdentity` reconstructed by the helper to equal the lease's expected `runtimeInstanceIdentity`;
J. only then finish the physical arm transition.
```

The helper must not accept a caller-provided replacement identity in place of the K2 lease-bound identity.

---

## 7. Retained control channel rule

The helper must establish and retain the control channel used for expiry mutation before final exact-instance validation completes.

After step 6.H/6.I succeeds, the helper MUST NOT:

```text
re-open ControlSocketPath for the expiry mutation;
re-run path discovery;
re-resolve containerId;
perform a second container.Load by ID for mutation;
fall back to `runsc kill` CLI;
fall back to Docker kill/stop;
fall back to host PID kill;
```

The actual expiry `ContMgrSignal` must travel over the already-retained control connection that existed during the final exact-instance validation bracket.

If that retained connection is lost, replaced, malformed, or unusable, R3G-D fails closed and MUST NOT reconnect by pathname in order to claim positive proof.

A fresh later connection may be used only by a fresh separately authorized observation/attempt; it cannot silently inherit the old lease's proof authority.

---

## 8. Retained pidfd rule

The helper must retain the pidfd opened for the admitted gVisor sandbox process across the arm -> terminal transition.

The retained pidfd is not itself permission to signal the host sandbox process.

It is an identity/liveness handle used to reject PID reuse and exact-instance loss.

Before expiry mutation the helper must require the retained pidfd still denotes the admitted process instance according to the canonical R3D/R3E process identity theorem.

If the admitted process has disappeared and no valid pre-deadline natural-exit winner exists, the helper MUST NOT reinterpret a newly reused numeric PID or newly created container as the original subject.

No positive TTL terminal proof is emitted in that ambiguous case.

---

## 9. No pathname or numeric-ID re-resolution after the final bracket

The final exact-instance bracket closes when all of the following are simultaneously true inside the same helper lifetime:

```text
expected containerId matched
expected state PID matched
expected process start ticks matched
expected runsc executable artifact identity matched
expected R3D plan identity matched
expected runtimeInstanceIdentity matched
retained sandbox control connection(s) established
retained pidfd established
```

After that point, proof-bearing mutation must use only retained handles/channels plus immutable lease values.

A mutable filesystem pathname or numeric ID may remain diagnostic metadata, but cannot be the authority that selects the mutation target.

---

## 10. Natural exit must come from a positive trusted event

The parent authorization's statement that natural exit should beat expiry is tightened.

A later observation such as:

```text
state = stopped
```

is not enough to prove natural exit occurred before the TTL deadline.

For a positive `natural-exit` terminal outcome, the watchdog must receive a successful exact-container exit event from the retained exact-sandbox control channel, using the pinned gVisor wait primitive or a purpose-equivalent exact-instance retained-channel wait primitive.

The event must be timestamped/ordered by the watchdog's trusted monotonic clock at successful receipt.

Wall-clock time may be recorded as metadata but MUST NOT decide the race.

---

## 11. Single-writer terminal winner

Each immutable lease has exactly one in-helper terminalization state machine:

```text
ARMED
  -> NATURAL_EXIT_WINNER
  -> EXPIRY_WINNER
  -> FAILED_CLOSED
```

`NATURAL_EXIT_WINNER` and `EXPIRY_WINNER` are mutually exclusive terminal winners.

One process-isolated watchdog instance must serialize the winner decision using one bounded single-writer/CAS-equivalent state transition.

K2 or another process must not independently race a second timer against it.

---

## 12. Natural-exit winner rule

Let:

```text
D = immutable monotonic lease deadline
E = watchdog monotonic timestamp at successful retained-channel exit-event receipt
```

`natural-exit` may win only when all are true:

```text
1. exact retained wait channel reports successful terminal exit for the lease-bound container;
2. E < D;
3. expiry has not already won;
4. the watchdog atomically commits NATURAL_EXIT_WINNER;
5. the event remains bound to the same leaseIdentity and runtimeInstanceIdentity;
6. a durable terminal record for that winner is committed before positive terminal proof is returned.
```

An event with:

```text
E == D
or
E > D
```

cannot establish the pre-deadline natural-exit theorem.

A post-deadline stopped-state observation cannot retroactively create `E < D`.

---

## 13. Expiry winner rule

At the first watchdog monotonic observation satisfying:

```text
now >= D
```

if no valid `NATURAL_EXIT_WINNER` has already committed, the watchdog must atomically commit `EXPIRY_WINNER` before any mutation attempt.

After expiry wins:

```text
natural exit cannot later replace the winner;
deadline cannot move;
lease cannot renew;
no second timer may be armed;
```

The expiry mutation path must then use the retained exact-instance signal channel and fixed mutation payload:

```text
CID = immutable lease-bound exact containerId
Signo = SIGKILL
Mode = DeliverToAllProcesses
```

No other signal/mode is authorized.

---

## 14. Expiry positive-proof chain

A positive `ttl-expired` terminal proof requires the complete ordered chain:

```text
immutable deadline D reached
-> EXPIRY_WINNER committed
-> retained pidfd/exact-instance checks remain valid
-> retained signal connection remains the originally bound connection
-> fixed ContMgrSignal(SIGKILL, DeliverToAllProcesses) issued
-> positive RPC completion/termination acknowledgement received
-> exact terminal record durably committed
-> exact durable commit acknowledgement validated
```

Missing any element fails closed.

A successful generic process exit code or later absence by ID is not a substitute.

---

## 15. Already-dead-at-expiry ambiguity

A particularly important race is:

```text
no accepted E < D natural-exit event
-> deadline D reached
-> expiry wins
-> signal path discovers subject is already gone/stopped
```

R3G-D MUST NOT silently relabel this as `natural-exit`.

It also MUST NOT claim that the expiry signal caused termination unless the positive retained-channel signal/termination acknowledgement proves that causal chain.

The safe result is:

```text
safety action/result may be terminal,
but positive R3G-D terminal theorem = FAILED_CLOSED / INDETERMINATE,
```

with diagnostic evidence preserved.

This conservative proof failure is preferable to false causality.

---

## 16. Replacement after final validation

If an external control-plane actor removes/replaces metadata or creates another container with the same textual ID after final validation, R3G-D must not signal the replacement merely because the ID/path matches.

Because proof-bearing signal uses the already-retained control connection and retained pidfd-bound runtime instance, later pathname/ID replacement cannot become a new proof target.

If the original retained channel dies, the watchdog fails closed instead of reconnecting to the replacement.

This is the required replacement-defense theorem for R3G-D v1.

---

## 17. Why `runsc kill` remains useful but not sufficient

Pinned `runsc kill --all <id> SIGKILL` remains source evidence for the desired all-process signal semantics.

However, standalone CLI invocation re-loads by ID and therefore cannot by itself close R3G-D's exact-instance mutation theorem.

The implementation may reuse the same gVisor internal signal semantics/protocol, but the positive-proof path must avoid the second name lookup by carrying the retained channel across the validation -> mutation boundary.

Documentation or tests MUST NOT say:

```text
exact pre-kill state check + runsc kill CLI = TOCTOU-safe exact-instance kill
```

---

## 18. Helper implementation identity

The lifecycle helper implementation identity must deterministically bind at minimum:

```text
R3G-D helper protocol version
watchdog terminal-state-machine version
pinned gVisor commit
pinned gVisor wait/signal protocol identity
verified helper artifact SHA-256
verified runsc artifact SHA-256 where retained by the implementation
R3D process protocol version
R3E runtime-instance binding contract version
```

Any change to the terminal winner semantics or mutation transport must change helper implementation identity.

---

## 19. Artifact verification remains fail-closed

The helper remains a trusted artifact and must satisfy the parent authorization's same-FD / retained-artifact verification requirements.

If implementation uses a separate watchdog artifact plus another mutation helper artifact, each artifact requires independent exact digest/descriptor verification and the composed implementation identity must bind both.

Prefer one narrow process-isolated helper where practical to reduce trusted surface and avoid another cross-process TOCTOU boundary.

No path-hash-then-reopen execution is permitted.

---

## 20. Durable terminal record additions

The terminal record required by the parent authorization must additionally bind at minimum:

```text
leaseIdentity
runtimeInstanceIdentity
deadlineIdentity
terminalWinner
winnerTransitionIdentity
winnerMonotonicObservation
terminalEventSourceIdentity
retainedWaitChannelIdentity
retainedSignalChannelIdentity
retainedPidfdProcessIdentity
```

For `natural-exit`, it must additionally bind:

```text
exitEventIdentity
exitEventObservedMonotonic
exit status identity where available
```

For `ttl-expired`, it must additionally bind:

```text
expiryWinnerIdentity
signalRequestIdentity
SIGKILL
DeliverToAllProcesses
signalAcknowledgementIdentity
terminationAcknowledgementIdentity
```

An indeterminate/fail-closed outcome is diagnostic evidence only and MUST NOT be structurally accepted as positive R3G-D terminal proof.

---

## 21. Durable winner semantics

The in-helper winner determines what physically happens; the durable K2 record determines what Kodac may later claim.

Therefore:

```text
physical winner committed in helper
!= positive Kodac proof
```

Positive proof still requires durable exact-payload evidence commit and acknowledgement.

If terminal-record persistence fails after physical terminalization:

```text
sandbox is not restarted;
lease is not renewed;
winner is not changed;
API/proof returns failure;
no second mutation is attempted merely to recreate evidence.
```

---

## 22. Hostile proof classes added by this reconciliation

The R3G-D implementation suite must additionally prove all of the following:

1. `runsc state` followed by standalone `runsc kill` is not the positive-proof path;
2. no container-ID lookup occurs after final exact-instance validation for proof-bearing mutation;
3. no control-socket pathname reopen occurs after final exact-instance validation;
4. retained signal connection loss fails closed with no reconnect fallback;
5. retained wait connection loss cannot be replaced by post-hoc `state=stopped` natural-exit proof;
6. PID reuse after retained pidfd binding is rejected;
7. process start-ticks drift is rejected;
8. runsc executable identity drift is rejected;
9. replacement metadata using the same textual container ID cannot become the signal target;
10. replacement control socket at the same pathname cannot become the signal target after retained connection binding;
11. a successful retained wait event observed at `E < D` can win natural exit;
12. a wait event observed at `E == D` cannot win natural exit;
13. a wait event observed at `E > D` cannot win natural exit;
14. a delayed wait response that arrives after expiry winner cannot rewrite the winner;
15. expiry winner commits before signal mutation;
16. natural-exit and expiry winners cannot both commit;
17. expiry signal is exactly SIGKILL + DeliverToAllProcesses;
18. arbitrary signal/mode input is rejected structurally;
19. already-dead-at-expiry without pre-deadline exit proof yields fail-closed/indeterminate, not fabricated natural exit;
20. already-dead-at-expiry without positive signal causality cannot mint ttl-expired proof;
21. terminal record references the exact durable arm leaseIdentity from the prior reconciliation;
22. terminal record binds the exact R3E runtimeInstanceIdentity;
23. terminal persistence failure does not re-arm, renew, restart, or mutate a second subject;
24. caller/model cannot supply containerId, runtimeRoot, signal, control socket, pidfd, deadline, or helper path;
25. no Docker/containerd lifecycle fallback occurs;
26. no host PID SIGKILL fallback occurs;
27. no generic runsc RPC surface is exposed;
28. helper crash before terminal winner produces no positive terminal proof;
29. helper crash after physical winner but before durable terminal evidence produces no positive terminal proof;
30. all retained-channel and helper operations are bounded against hangs without extending the immutable TTL deadline.

These are additive to every hostile proof class in the parent authorization and arm-durability reconciliation.

---

## 23. Test doubles may not weaken the production theorem

Unit tests may use deterministic fake retained channels, fake monotonic clocks, and fake pidfd/process binders.

However the Linux integration proof must exercise the real bounded production helper and show that the proof-bearing mutation transport does not perform a second ID/path resolution after exact-instance admission.

A fake that directly returns `killed=true` cannot substitute for the Linux production integration test.

---

## 24. Failure semantics

The following conditions are explicit fail-closed outcomes:

```text
cannot establish retained wait channel
cannot establish retained signal channel
cannot retain pidfd
runtimeInstanceIdentity mismatch
pid/start-ticks/executable mismatch
retained connection closes before required use
wait event lacks trustworthy exact-subject binding
terminal winner cannot be serialized
expiry signal RPC errors
termination acknowledgement missing
already-dead-at-expiry causality ambiguous
durable terminal record commit fails
durable commit acknowledgement mismatches
```

None may silently downgrade to:

```text
best-effort timer
main-event-loop timer
runsc kill by ID
Docker stop/kill
host kill by PID
post-hoc state inference
```

---

## 25. Scope remains narrow

This reconciliation does not authorize or prove:

```text
generic lifecycle management
container creation/start/exec/delete
TTL renewal
output-limit enforcement
credential proof
R3B final evidence minting
external-process ASK
macOS TTL enforcement
Windows TTL enforcement
malicious-host resistance
H4 completion
```

It introduces no review limit, PR limit, daily quota, file limit, agent limit, busy state, forced queue, trial exhaustion, or artificial throughput cap.

---

## 26. Review findings resolved semantically

This reconciliation directly resolves the two actionable authorization findings:

```text
[P1] Require positive pre-deadline proof for natural-exit races
-> resolved by retained exact-sandbox wait event + monotonic E < D + single-winner semantics.

[P1] Make replacement protection executable at kill time
-> resolved by retained exact-sandbox signal connection + retained pidfd/runtime-instance binding
   + prohibition on any post-validation ID/path re-resolution.
```

The separate prior reconciliation resolves:

```text
[P1] Require durable arm evidence before reporting armed
-> resolved by validated arm ACK + durable exact arm record before positive `armed` success.
```

Thread state on GitHub remains a review-system state and must not be marked resolved until the exact package containing these reconciliations has been re-reviewed and the responses point to the governing files.

---

## 27. Exact package gate effect

This commit changes authorization-package bytes, so every prior review/check tied to `755cb98ac7c0acefdc23bbc13b524ccc45bebb9f` is historical for certification purposes.

Before merge, the new exact PR head must satisfy:

```text
base = exact canonical main
changed paths = authorization docs only
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2 classifier/gate = PASS where triggered
fresh external exact-head review = complete
all valid findings repaired
0 unresolved actionable review threads
PR Ready/open/mergeable
```

Only after guarded merge and exact merge post-merge verification does this authorization package become canonical and permit R3G-D implementation to begin.

---

## 28. Reconciled bounded theorem

```text
validated immutable ttlMs requirement
+ exact R3E runtimeInstanceIdentity
+ durable immutable arm record
+ isolated single-writer watchdog
+ retained exact-sandbox wait channel
+ retained exact-sandbox signal channel
+ retained pidfd/process identity
+ monotonic pre-deadline natural-exit event rule
+ deterministic terminal winner
+ no post-validation ID/path re-resolution
+ fixed SIGKILL / DeliverToAllProcesses expiry mutation
+ positive terminal acknowledgement
+ durable exact terminal evidence
= R3G-D E3 TTL / LIFECYCLE ENFORCEMENT RECORD
!= R3B E4 PHYSICAL BACKEND EVIDENCE
```

This is the maximum authorization claim of this docs package.