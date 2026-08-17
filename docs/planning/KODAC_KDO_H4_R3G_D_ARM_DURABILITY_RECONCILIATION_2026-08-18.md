# KDO-H4-R3G-D — Arm Durability Reconciliation

Date: 2026-08-18
Status: AUTHORIZATION CANDIDATE RECONCILIATION — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Applies to: `KODAC_KDO_H4_R3G_D_K2_TTL_LIFECYCLE_ENFORCEMENT_AUTHORIZATION_2026-08-18.md`
Authorization candidate parent head: `c2dd9d864f5a4da294104f2ba716cf5a13000ae6`
Canonical base remains: `96fb2cb3bbd2cbf4b5802f218b02189654a0775c`

---

## 1. Decision

The R3G-D authorization candidate correctly requires:

```text
watchdog arm acknowledgement
+ immutable exact-subject lease
+ durable final lifecycle evidence before complete terminal proof
```

but sections 25 and 29 leave one transition insufficiently explicit:

```text
watchdog successfully armed
-> K2 reports `armed` success
```

The authorization is tightened as follows:

```text
watchdog successfully armed
-> exact arm acknowledgement validated
-> arm record durably committed through trusted K2 evidence authority
-> commit acknowledgement bound to exact lease/record payload
-> only then may K2 report `armed` success
```

This reconciliation is normative for R3G-D implementation.

---

## 2. Why the tightening is required

An armed watchdog creates a real future lifecycle mutation obligation. If K2 tells a caller that TTL enforcement is armed without first durably recording the exact immutable lease, a later process/API failure can create an unauditable enforcement obligation.

That would break Kodac's evidence-first trust model even if the watchdog still eventually terminates the sandbox.

Therefore:

```text
spawned watchdog != armed success
arm ACK != armed success
validated arm ACK != armed success
validated arm ACK + durable exact arm record = eligible armed success
```

---

## 3. Required durable arm record

The R3G-D implementation must persist one immutable arm record before returning positive `armed` success.

The record must bind at minimum:

```text
version
evidenceClass = e3-ttl-lifecycle-arm
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
leaseStart monotonic evidence
deadline identity
armAcknowledgementIdentity
recordIdentity
```

The exact schema may be narrowed during implementation, but none of the identities necessary to distinguish the immutable lease/subject may be omitted.

---

## 4. Commit acknowledgement

The trusted evidence commit acknowledgement must bind at minimum:

```text
leaseIdentity
recordIdentity
exact arm-record payload digest
```

A generic `stored=true`, receipt without payload identity, or best-effort log write is insufficient.

---

## 5. Persistence failure after physical arm

A crucial safe-state rule applies if this sequence occurs:

```text
watchdog arms successfully
-> K2 validates arm acknowledgement
-> durable arm persistence fails
```

The safe result is:

```text
API / proof result = FAILURE
watchdog lease = REMAINS ARMED
TTL deadline = MUST NOT MOVE
TTL obligation = MUST NOT BE SILENTLY CANCELLED
positive Kodac armed proof = MUST NOT BE RETURNED
```

K2 must not disarm the watchdog merely to make persistence failure look atomic.

Safety wins over API convenience.

---

## 6. Retry after persistence failure

A retry after a failed arm-record commit must never create a later TTL deadline.

The retry must either:

```text
recover/reconcile the exact already-armed immutable lease
```

or fail closed.

It must not:

```text
create a new leaseStart
extend ttlMs
replace the original deadline
spawn an independently later watchdog and call it equivalent
```

---

## 7. Lost arm-success response

If the durable arm commit succeeds but the caller loses the response, a retry must recover the same exact lease/arm record rather than re-arm with a later deadline.

Required theorem:

```text
same execution attempt
+ same requirement/workload/container/runtime identities
+ same leaseIdentity
+ same durable arm record
= same immutable deadline
```

---

## 8. Terminal record remains separately durable

This reconciliation does not replace the final lifecycle record required by the parent authorization.

R3G-D therefore has two durability transitions:

```text
A. ARM TRANSITION
physical watchdog arm
-> validated arm ACK
-> durable arm record
-> armed success eligible

B. TERMINAL TRANSITION
natural exit OR TTL expiry termination
-> exact terminal acknowledgement
-> durable terminal record
-> complete terminal proof eligible
```

Neither transition may be represented as complete before its corresponding durable evidence commit.

---

## 9. No double-proof or contradictory terminal state

The durable arm record is not a terminal proof.

It proves only that the exact immutable lease was successfully armed and durably recorded.

The final terminal record must refer back to the same `leaseIdentity` and must establish exactly one terminal outcome:

```text
natural-exit
OR
ttl-expired
```

A lease cannot have two authoritative terminal outcomes.

---

## 10. Additional hostile proof classes

The R3G-D implementation hostile suite must additionally prove:

1. successful watchdog arm + rejected durable arm commit returns no positive armed proof;
2. rejected durable arm commit does not silently disarm or extend the watchdog;
3. retry after rejected arm commit cannot move the original deadline;
4. successful durable arm commit + lost API response recovers the exact same lease/deadline;
5. replayed arm commit cannot create a second later lease;
6. terminal record must reference the same durable `leaseIdentity` as the arm record;
7. conflicting second terminal outcome is rejected;
8. arm-record persistence and terminal-record persistence use bounded exact-payload acknowledgements.

These are additive to the hostile proof classes in the parent authorization.

---

## 11. Scope remains unchanged

This reconciliation authorizes no product code by itself and does not widen R3G-D.

It still does not authorize or prove:

```text
generic container lifecycle APIs
TTL renewal/extension
output-limit enforcement
credential proof
R3B final evidence minting
external-process ASK
macOS/Windows TTL enforcement
malicious-host resistance
H4 completion
```

It introduces no product quota, queue, review limit, file limit, daily limit, or artificial throughput restriction.

---

## 12. Candidate gate effect

Because this document changes the authorization package bytes, all exact-head authorization checks/reviews must target the new PR head after this commit.

A review of `c2dd9d864f5a4da294104f2ba716cf5a13000ae6` remains historical evidence only and cannot certify the newer authorization-package head.

The authorization package may merge only after the new exact head passes the docs-only governance/CI and fresh external-review gates with zero unresolved actionable findings.
