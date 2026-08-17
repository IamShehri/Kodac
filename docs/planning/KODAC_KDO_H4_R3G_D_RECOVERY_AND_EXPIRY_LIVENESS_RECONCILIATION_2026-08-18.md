# KDO-H4-R3G-D — Recovery and Expiry-Liveness Reconciliation

Date: 2026-08-18
Status: AUTHORIZATION CANDIDATE RECONCILIATION — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Authorization package parent head: `e83b0023278ac04c84e9206bc41a852d8d5f51f1`
Canonical base remains: `96fb2cb3bbd2cbf4b5802f218b02189654a0775c`
Pinned gVisor remains: `50e1502a95d36ad2faf2c7ef33b8bf21fe975293`

This reconciliation is normative together with:

- `KODAC_KDO_H4_R3G_D_K2_TTL_LIFECYCLE_ENFORCEMENT_AUTHORIZATION_2026-08-18.md`;
- `KODAC_KDO_H4_R3G_D_ARM_DURABILITY_RECONCILIATION_2026-08-18.md`;
- `KODAC_KDO_H4_R3G_D_TERMINAL_CAUSALITY_AND_KILL_BINDING_RECONCILIATION_2026-08-18.md`.

---

## 1. Decision

Fresh review identified two remaining arm-recovery gaps and one terminal-causality precision requirement:

```text
A. an armed lease needs a durable discovery anchor across K2 restart/unknown commit;
B. arm retries need a stable idempotency identity before physical arm;
C. expiry classification needs positive exact-subject liveness at the deadline,
   not merely absence of a pre-deadline Wait acknowledgement.
```

R3G-D is tightened as follows:

```text
K2 durable PREPARED arm intent
+ deterministic internal armOperationIdentity
+ watchdog durable lease registry
+ Linux boot-bound CLOCK_BOOTTIME deadline domain
+ exact same-payload replay semantics
+ startup reconciliation before new arm work
+ retained exact-sandbox liveness RPC at expiry
= recoverable immutable physical TTL obligation
```

No product code is implemented or proven by this document.

---

## 2. Stable arm operation identity is K2-internal, not model-selected

The valid review requirement is stable idempotency, not caller authority over security identity.

R3G-D therefore MUST define:

```text
armOperationIdentity
```

before physical arm.

It MUST be deterministic over the canonical immutable arm-request payload, purpose-equivalent to:

```text
SHA-256(
  "kodac-h4-r3g-d-arm-operation-v1" ||
  executionAttemptIdentity ||
  requirementIdentity ||
  workloadIdentity ||
  containerBindingIdentity ||
  runtimeInstanceIdentity ||
  ttlMs ||
  watchdogImplementationIdentity
)
```

Canonical length-prefixing/domain separation is required in the actual implementation; raw ambiguous string concatenation is forbidden.

The model, plugin, MCP client, shell command, or untrusted caller MUST NOT directly choose `armOperationIdentity`.

K2 derives it only from already-validated canonical identities and trusted runtime configuration.

---

## 3. Same operation identity means same immutable payload

For one `armOperationIdentity`, the exact canonical arm-request payload digest is immutable.

Required rule:

```text
same armOperationIdentity + same exact payload digest
-> recover/replay the same lease

same armOperationIdentity + different payload digest
-> reject as conflicting replay
```

A conflicting replay cannot:

```text
move leaseStart
move deadline
change ttlMs
change containerId
change runtimeInstanceIdentity
change watchdog implementation
create a second watchdog
```

---

## 4. K2 durable PREPARED arm intent

Before K2 asks the watchdog to create any physical TTL obligation, K2 must durably commit one bounded pre-arm intent:

```text
version = kodac-h4-r3g-d-arm-intent-v1
state = PREPARED
armOperationIdentity
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
ttlMs
watchdogImplementationIdentity
canonicalArmPayloadDigest
intentIdentity
```

The PREPARED record must be fsync/durability-acknowledged through the trusted K2 evidence authority before the helper arm request is issued.

A best-effort log line is insufficient.

---

## 5. Why PREPARED exists before physical arm

The PREPARED intent creates a durable discovery root even if K2 crashes during any of these transitions:

```text
PREPARED committed
-> helper request sent
-> helper registry committed
-> helper arm ACK returned
-> K2 arm evidence commit started
-> K2 arm evidence commit outcome unknown
-> caller response lost
```

On restart, K2 can enumerate/reconcile unresolved PREPARED intents without inventing a new lease or waiting for the caller to remember an opaque token.

This is an internal security-recovery mechanism, not a product queue or throughput quota.

---

## 6. Watchdog durable lease registry

The process-isolated watchdog/helper must own one narrow durable registry for physical lease obligations.

The registry is not a generic database API.

Its only authorized logical operations are purpose-equivalent to:

```text
prepare-or-recover armOperationIdentity
read exact lease by armOperationIdentity
list unresolved/live lease obligations for recovery
commit terminal winner/terminal status
mark proof/evidence reconciliation status
```

It MUST NOT expose arbitrary user data storage or caller-defined keys outside the fixed R3G-D schema.

---

## 7. Registry entry before positive helper arm ACK

Before the helper may emit positive physical arm acknowledgement, it must durably commit a registry entry containing at minimum:

```text
version = kodac-h4-r3g-d-watchdog-lease-v1
armOperationIdentity
canonicalArmPayloadDigest
leaseIdentity
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
ttlMs
clockDomainIdentity
leaseStartBoottimeNs
deadlineBoottimeNs
watchdogImplementationIdentity
physicalArmState = ARMED
registryRecordIdentity
```

The helper must fsync/durability-acknowledge this entry before returning arm ACK to K2.

Therefore the complete arm order becomes:

```text
K2 durable PREPARED intent
-> exact-instance retained-channel/pidfd admission
-> helper computes immutable lease deadline
-> helper durably commits watchdog registry entry
-> helper returns exact arm ACK
-> K2 validates ACK
-> K2 durably commits canonical arm evidence record
-> K2 marks intent COMMITTED
-> only then positive `armed` success may leave K2
```

---

## 8. Linux clock domain is explicit for v1

R3G-D v1 must use a Linux monotonic clock domain that can survive ordinary K2/watchdog process restart without resetting the deadline.

The authorized v1 choice is:

```text
CLOCK_BOOTTIME
```

The lease registry must also bind the Linux host boot identity read from the trusted host boot-id source.

Purpose-equivalent:

```text
clockDomainIdentity = SHA-256(
  "kodac-h4-r3g-d-clock-domain-v1" ||
  linuxBootId ||
  CLOCK_BOOTTIME
)
```

`CLOCK_MONOTONIC` or Node/main-event-loop timers may be used for diagnostics/tests only if they cannot weaken the production theorem.

Wall-clock time never decides expiry.

---

## 9. Deadline persistence

The helper persists:

```text
leaseStartBoottimeNs
deadlineBoottimeNs = leaseStartBoottimeNs + ttlMs
linuxBootId
clockDomainIdentity
```

The persisted deadline is absolute within that boot's `CLOCK_BOOTTIME` domain.

A process restart MUST NOT reconstruct deadline as:

```text
restart time + ttlMs
```

That forbidden rule would silently renew the lease.

---

## 10. Same-boot watchdog restart recovery

On helper restart within the same Linux boot identity, before accepting any new arm operation the helper must scan its unresolved/live lease registry entries.

For each entry:

```text
require current linuxBootId = persisted linuxBootId
require clockDomainIdentity match
read current CLOCK_BOOTTIME
```

Then:

```text
now < deadline
-> restore the same exact lease with the same deadline

now >= deadline
-> enter expiry reconciliation immediately;
   do not grant a fresh ttlMs interval
```

A recovered helper must preserve the exact original `leaseIdentity` and `armOperationIdentity`.

---

## 11. Host reboot / clock-domain change

If Linux boot identity changes, the previous `CLOCK_BOOTTIME` values are no longer comparable to the new boot.

R3G-D MUST NOT translate the old deadline into a new full TTL window.

The safe result is:

```text
old lease = UNRECOVERABLE_CLOCK_DOMAIN
positive R3G-D proof = forbidden
new deadline from ttlMs = forbidden
```

The implementation may perform separately authorized cleanup/diagnostic observation, but cannot claim continuity of the old TTL theorem across a host reboot.

Malicious-host resistance remains outside R3G-D.

---

## 12. K2 restart reconciliation

On K2 restart, before reporting any recovered R3G-D arm state as successful, K2 must reconcile all unresolved PREPARED/COMMITTED arm intents with the watchdog registry.

Required cases:

```text
K2 PREPARED + watchdog no entry
-> safe to retry exact same armOperationIdentity/payload;
   helper must preserve idempotency rules.

K2 PREPARED + watchdog ARMED same payload
-> recover same leaseIdentity/deadline;
   commit/reconcile missing K2 arm evidence;
   never re-arm with a later deadline.

K2 COMMITTED + watchdog ARMED same payload
-> recover existing lease; no second arm.

K2 any state + watchdog entry conflicting payload
-> fail closed; no mutation/no new proof.

watchdog ARMED entry + missing K2 intent
-> integrity failure; do not synthesize a new intent or positive proof.
```

---

## 13. Unknown K2 arm-evidence commit result

If K2 submits the arm evidence record but receives an unknown/ambiguous persistence result, it must query/reconcile by:

```text
armOperationIdentity
+ leaseIdentity
+ canonicalArmPayloadDigest
+ recordIdentity
```

It MUST NOT simply retry by creating a new record/lease identity.

Same exact payload may converge to the same canonical arm record.

Conflicting payload or duplicate different lease identity fails closed.

---

## 14. Lost caller/API response

If the complete arm transition succeeded durably but the caller did not receive the response, retry/recovery must return the same immutable lease state when the surrounding K2 execution attempt is recovered.

The caller does not get authority to choose a new `armOperationIdentity` to overwrite the prior operation.

This preserves both idempotency and K2's trust ownership.

---

## 15. The watchdog registry does not replace K2 evidence

The watchdog registry proves physical obligation recovery state only.

It does not mint:

```text
R3B SandboxBackendObservation
R3B SandboxExecutionEvidence
final R3B E4 proof
```

Positive Kodac arm/terminal proof still requires the K2 durable evidence commits and exact acknowledgements defined by the earlier authorization package.

---

## 16. Retained expiry liveness channel

The terminal-causality reconciliation already requires retained exact-sandbox wait and signal control channels.

R3G-D now additionally requires one retained exact-sandbox **liveness/probe channel** established before the final exact-instance bracket closes.

After exact-instance admission, expiry liveness MUST NOT be checked by:

```text
new runsc state invocation
new container.Load
new control-socket pathname connect
Docker inspect
host PID-name lookup
```

The probe must use the already-retained exact-sandbox control channel.

---

## 17. Pinned gVisor liveness primitive

Pinned gVisor exposes:

```text
boot.ContMgrProcesses
Sandbox.Processes(cid)
```

for retrieving the process list of a container inside the sandbox.

R3G-D may use `ContMgrProcesses` only as a bounded exact-sandbox **container liveness signal** over the retained control channel.

It MUST NOT reinterpret the returned guest process metadata as R3E host runtime identity or as unrelated physical policy proof.

---

## 18. Positive live-at-expiry proof

Let:

```text
D = immutable deadlineBoottimeNs
L = CLOCK_BOOTTIME timestamp at successful retained-channel liveness response
```

After expiry winner becomes eligible at `now >= D`, and before SIGKILL is issued, the watchdog must perform the retained liveness probe.

Positive live-at-expiry proof requires:

```text
1. probe travels over the pre-bound retained exact-sandbox channel;
2. immutable lease-bound containerId is used;
3. response is successful;
4. response contains at least one process belonging to that exact container;
5. L >= D;
6. retained pidfd/runtimeInstanceIdentity remains valid;
7. no pathname/ID reconnect occurred.
```

Only then may the helper say:

```text
exact admitted subject was positively observed live at/after expiry deadline
```

---

## 19. Expiry does not claim SIGKILL causality merely from success

A `ttl-expired` outcome means:

```text
subject was positively observed live at/after D
+ expiry won the single-writer terminal race
+ fixed enforcement path was invoked against the retained exact instance
+ terminal state was positively acknowledged
```

It does NOT automatically mean:

```text
SIGKILL was the unique physical cause of final process exit
```

A natural exit can race after the positive live-at-expiry probe and before/during signal delivery.

The durable record must not overstate kill causality.

---

## 20. Empty/failed liveness at expiry is not natural-exit proof

If no valid pre-deadline natural-exit event has already won and the retained liveness probe at/after D returns:

```text
empty process set
not-found/stopped-equivalent result
RPC failure
malformed response
lost retained channel
```

then the watchdog MUST NOT infer:

```text
natural exit happened before D
```

and MUST NOT infer:

```text
expiry killed the subject
```

The terminal proof becomes fail-closed/indeterminate unless another already-authoritative event establishes the ordering.

No fallback lookup is permitted.

---

## 21. Clarification of delayed natural-exit acknowledgement

The authoritative natural-exit ordering point is the process-isolated watchdog's receipt/commit of the retained exact-sandbox Wait event, not later K2 persistence or caller/API acknowledgement.

Therefore:

```text
retained Wait event received by watchdog at E < D
-> NATURAL_EXIT_WINNER may commit
-> later K2/durable/API acknowledgement may occur after D
-> outcome remains natural-exit
```

Downstream acknowledgement delay cannot change the winner.

If the retained Wait RPC itself does not deliver a trusted event to the watchdog until `E >= D`, v1 has no source timestamp proving an earlier transition and MUST NOT fabricate `E < D`.

It then follows the retained live-at-expiry probe rules and may fail closed if ordering cannot be proven.

---

## 22. Expiry sequence after this reconciliation

The exact v1 expiry sequence is now:

```text
A. watchdog CLOCK_BOOTTIME reaches D;
B. if NATURAL_EXIT_WINNER already committed from E < D, stop: no kill;
C. atomically commit EXPIRY_WINNER eligibility/transition;
D. verify retained pidfd/runtimeInstanceIdentity remains exact;
E. query ContMgrProcesses over retained liveness channel;
F. require positive non-empty exact-container liveness at L >= D;
G. issue fixed ContMgrSignal over retained signal channel:
     Signo = SIGKILL
     Mode = DeliverToAllProcesses;
H. obtain bounded positive terminal acknowledgement;
I. durably commit exact terminal record;
J. validate exact K2 commit acknowledgement.
```

No step may re-open the control socket pathname or re-resolve the container ID.

---

## 23. Terminal record additions

For positive `ttl-expired` proof, the terminal record must additionally bind:

```text
liveAtExpiryProbeIdentity
liveAtExpiryObservedBoottimeNs
liveAtExpiryProcessSetIdentity
clockDomainIdentity
linuxBootId
armOperationIdentity
```

For natural exit, the record must bind:

```text
exitEventObservedBoottimeNs
clockDomainIdentity
linuxBootId
armOperationIdentity
```

The record must preserve the distinction between:

```text
expiry classification
and
unique signal causality
```

---

## 24. Additional hostile proof classes

The implementation suite must additionally prove:

1. `armOperationIdentity` is deterministic for the same canonical arm payload;
2. conflicting payload under the same operation identity is rejected;
3. PREPARED intent is durable before helper arm request;
4. helper registry is durable before physical arm ACK;
5. unknown K2 commit result reconciles without a second lease;
6. K2 restart recovers PREPARED + watchdog ARMED as the same lease/deadline;
7. same-boot helper restart preserves `deadlineBoottimeNs`;
8. overdue recovered lease does not receive a fresh ttlMs window;
9. changed Linux boot ID cannot create positive recovered proof;
10. process restart cannot recalculate deadline from restart time;
11. missing K2 intent + orphan watchdog entry produces integrity failure/no positive proof;
12. liveness probe uses only the retained exact-sandbox channel;
13. no new state/inspect/container.Load occurs for expiry liveness;
14. positive expiry proof requires non-empty process liveness at `L >= D`;
15. empty process result without earlier `E < D` fails closed;
16. delayed downstream arm/terminal acknowledgement does not move the winner/deadline;
17. retained Wait receipt at `E < D` remains natural-exit even if K2/API acknowledgement occurs after D;
18. retained Wait receipt first arriving at `E >= D` cannot fabricate pre-deadline exit;
19. process exits naturally between live-at-expiry probe and signal does not cause the record to claim unique SIGKILL causality;
20. signal success without live-at-expiry proof cannot mint positive ttl-expired proof;
21. all recovery enumeration/reconciliation is bounded operationally but imposes no product quota or artificial throughput limit;
22. corrupted registry/intent state fails closed rather than silently dropping an armed obligation.

---

## 25. Scope / non-authority remains unchanged

This reconciliation authorizes no generic scheduler, quota manager, job queue, or lifecycle controller.

It does not authorize or prove:

```text
output limits
credentials
R3B final evidence
external-process ASK
arbitrary runsc RPC
Docker lifecycle mutation
host PID kill
macOS/Windows TTL enforcement
host-reboot continuity theorem
malicious-host resistance
H4 completion
```

Internal recovery enumeration/pagination is implementation hygiene and MUST NOT become a user-facing concurrency cap, review limit, daily limit, PR limit, file limit, agent limit, busy state, or forced wait queue.

---

## 26. Review findings resolved semantically

This reconciliation resolves the two arm-recovery findings by requiring:

```text
durable K2 PREPARED intent
+ deterministic internal armOperationIdentity
+ exact-payload replay rules
+ durable watchdog lease registry
+ startup reconciliation
+ boot-bound absolute monotonic deadline
```

It also tightens terminal causality by requiring:

```text
positive retained exact-sandbox process liveness at/after D
before positive ttl-expired proof
```

The earlier terminal-causality reconciliation remains authoritative for retained channel/pidfd replacement defense.

GitHub review threads should be resolved only after fresh exact-head review confirms the complete package.

---

## 27. New exact-head gate

Because this document changes authorization-package bytes, all checks/reviews from `e83b0023278ac04c84e9206bc41a852d8d5f51f1` and earlier are historical for certification.

Before merge, the new exact head must prove:

```text
canonical base unchanged
all changed paths docs-only
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy PASS where triggered
K2 classifier/gate PASS where triggered
fresh external exact-head review complete
all valid review findings addressed
0 unresolved actionable threads
PR Ready/open/mergeable
```

Only then may guarded merge occur.