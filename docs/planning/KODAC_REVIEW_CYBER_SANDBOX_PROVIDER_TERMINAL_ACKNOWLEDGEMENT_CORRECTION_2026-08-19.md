# Kodac Review/Cyber — Sandbox Provider Terminal Acknowledgement Correction

Status: **NORMATIVE PLANNING CORRECTION / NO IMPLEMENTATION AUTHORIZATION**  
Date: 2026-08-19  
Canonical Kodac base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Applies to planning PR: `#121`

## 0. Purpose and precedence

Fresh exact-head review of PR #121 at `bc3362538a3046894559b30c2229d0ca73f060ee` identified one valid omission in the planning-only sandbox-provider qualification profile `KODAC_H4_R3G_D_PARITY_V1`.

The existing profile requires exact-subject terminal causality, a single-writer terminal winner, and a durable terminal record, but it does not state explicitly enough that **positive expiry proof also requires a bounded positive terminal acknowledgement from the exact admitted runtime subject before the durable positive terminal record is accepted**.

Canonical H4-R3G-D is stricter. Its positive `ttl-expired` proof chain requires, in order:

```text
immutable deadline reached
→ EXPIRY_WINNER committed
→ retained exact-instance checks remain valid
→ retained signal channel remains the originally bound channel
→ fixed exact-subject termination request issued
→ positive RPC completion / termination acknowledgement received
→ exact terminal record durably committed
→ exact durable commit acknowledgement validated
```

Missing any element fails closed. A successful generic process exit code, an issued kill request, or a later `stopped`/absence observation is not a substitute.

This correction therefore adds a mandatory qualification gate to `KODAC_H4_R3G_D_PARITY_V1`.

Where this file conflicts with the earlier PR #121 sandbox-provider qualification correction on terminal acknowledgement requirements, **this file controls** until a later separately authorized documentation consolidation.

This file does **not**:

- authorize an optional sandbox provider;
- authorize OpenSandbox;
- authorize donor-code intake;
- modify K2 or H4 runtime behavior;
- authorize H4-R3G-F or any later H4 task;
- authorize H6 or Cyber implementation;
- authorize a blocking review gate;
- authorize merge of PR #121.

---

# 1. Mandatory terminal acknowledgement gate

Add the following mandatory gate to `KODAC_H4_R3G_D_PARITY_V1`:

## Q-TERM-ACK — bounded positive exact-subject terminal acknowledgement

After `EXPIRY_WINNER` is durably/atomically selected for the immutable lease, positive `ttl-expired` proof is forbidden until the trusted lifecycle component receives a **bounded positive terminal acknowledgement** that is causally bound to the exact admitted runtime subject and the retained proof-bearing channel/handle.

The acknowledgement must satisfy all of the following:

```text
1. it is produced by the exact retained lifecycle/control path that was
   admitted for this immutable lease/runtime instance;

2. it is bound to the immutable execution-attempt, lease, runtime-subject,
   runtime-instance, provider implementation/configuration, and fixed
   termination-request identities;

3. it positively establishes completion of the required terminal operation,
   not merely successful dispatch of a signal/request;

4. it arrives within the bounded terminal-acknowledgement contract established
   by the qualified provider profile;

5. it is validated before the positive exact terminal record is committed;

6. the exact terminal record binds the acknowledgement identity/identities;

7. the durable terminal-record commit acknowledgement is itself validated
   before positive terminal proof leaves K2.
```

For the canonical gVisor R3G-D theorem, the acknowledgement corresponds to the retained exact-sandbox signal/termination path and the fixed all-process SIGKILL semantics already established by canonical H4-R3G-D.

An alternate provider may use a different mechanism only if provider qualification proves an at-least-equivalent exact-subject causal acknowledgement theorem.

---

# 2. Explicitly insufficient observations

None of the following is sufficient for positive expiry proof on its own:

```text
termination request successfully submitted
signal RPC write succeeded without terminal acknowledgement
provider API returned "kill accepted"
generic helper process exited zero
later container/runtime state = stopped
later subject lookup returns not found
later PID/container ID disappears
elapsed timeout after mutation request
model/analyzer/provider asserts termination occurred
```

These may be diagnostic observations. They do not establish that the required mutation caused the exact admitted subject to reach the terminal state.

---

# 3. Already-dead and racing-subject cases

If expiry wins but the mutation path discovers the subject is already gone/stopped and there is no accepted pre-deadline exact-subject natural-exit event, the implementation must not relabel the result as natural exit and must not claim expiry-caused termination without the required acknowledgement.

The safe proof result is purpose-equivalent to:

```text
physical/safety state may be terminal
positive R3G-D terminal theorem = FAILED_CLOSED / INDETERMINATE
```

Diagnostic evidence remains preserved.

Likewise, a later replacement subject with the same textual identifier cannot satisfy the acknowledgement requirement. The acknowledgement must remain bound to the exact admitted runtime instance and retained channel/handle.

---

# 4. Ordering relative to the durable terminal record

The qualification profile now requires this ordering for positive expiry proof:

```text
EXPIRY_WINNER
→ exact retained subject/channel validation
→ fixed termination request
→ bounded positive exact-subject terminal acknowledgement
→ validate acknowledgement identity and causal binding
→ durable exact terminal record containing acknowledgement identity
→ validate durable commit acknowledgement
→ positive ttl-expired proof may leave K2
```

Forbidden reorderings include:

```text
durable positive terminal record before terminal acknowledgement
positive API/proof response before durable terminal-record acknowledgement
retry with a new subject/lease after acknowledgement ambiguity
post-hoc stopped-state observation promoted into an acknowledgement
```

---

# 5. Terminal record requirements

For a qualified positive `ttl-expired` result, the durable terminal record must bind at minimum the applicable canonical terminal identities plus explicit acknowledgement identities purpose-equivalent to:

```text
leaseIdentity
executionAttemptIdentity
runtimeInstanceIdentity
deadlineIdentity
terminalWinner = EXPIRY_WINNER
winnerTransitionIdentity
retainedSignalChannelIdentity
retainedSubjectIdentity
terminationRequestIdentity
signalAcknowledgementIdentity
terminationAcknowledgementIdentity
terminalAcknowledgementObservedAtMonotonic
providerImplementationIdentity
providerConfigurationIdentity
```

The exact schema may differ by provider only when the qualification harness proves the same or stronger causal and identity guarantees.

---

# 6. Bounded acknowledgement contract

Provider qualification must state and test the terminal-acknowledgement bound/termination behavior explicitly.

It must define what happens when the acknowledgement is:

```text
absent
malformed
ambiguous
duplicated
late
received after channel replacement
bound to the wrong subject
bound to the wrong lease/attempt
received while terminal-record persistence fails
received when K2 commit outcome is unknown
```

Required security behavior:

```text
absence / ambiguity / unbindable acknowledgement
→ no positive R3G-D proof

late beyond the qualified bounded contract
→ no positive R3G-D proof for that attempt unless the canonical theorem
   separately defines a valid recoverable state

wrong subject / wrong lease / wrong channel
→ reject / fail closed

terminal acknowledgement received but durable terminal record fails
→ physical result may remain terminal;
  positive Kodac proof = failure;
  do not restart, renew, change winner, or repeat mutation merely to recreate evidence
```

---

# 7. Qualification tests added

A future provider seeking `KODAC_H4_R3G_D_PARITY_V1` qualification must additionally prove hostile cases covering at least:

1. mutation request accepted but no terminal acknowledgement arrives;
2. signal/request acknowledgement arrives but terminal acknowledgement does not;
3. acknowledgement arrives for a different runtime instance;
4. acknowledgement arrives through a re-resolved/replaced channel;
5. acknowledgement arrives after the bounded contract;
6. subject is already dead at expiry with no accepted pre-deadline natural-exit event;
7. terminal acknowledgement is valid but terminal-record persistence fails;
8. terminal-record commit result is unknown after acknowledgement;
9. duplicate terminal acknowledgement arrives;
10. malformed acknowledgement attempts to reference the correct textual ID but wrong immutable runtime identity.

Every ambiguous case must demonstrate that positive proof is withheld.

---

# 8. Corrected qualification theorem

The relevant proof-profile theorem is now explicitly:

```text
exact immutable attempt/subject identity
+ K2-derived stable arm operation identity
+ durable K2 PREPARED intent
+ durable provider/watchdog obligation before positive arm ACK
+ retained exact-instance control/liveness channel
+ immutable recoverable monotonic deadline
+ same-obligation restart/unknown-result reconciliation
+ exact terminal causality
+ single-writer terminal winner
+ fixed exact-subject terminal mutation
+ bounded positive exact-subject terminal acknowledgement
+ durable exact terminal record binding acknowledgement identity
+ validated durable terminal-record commit acknowledgement
+ fail-closed ambiguity/persistence behavior
= eligible R3G-D lifecycle proof path
```

Capability declarations such as `supportsTtl=true` remain insufficient. Qualification is tied to the exact provider implementation and configuration and does not silently transfer across provider/version/configuration changes.

---

# 9. Review finding disposition

```text
FINDING:
KODAC_H4_R3G_D_PARITY_V1 omits explicit terminal acknowledgement gate

VERIFICATION:
CONFIRMED AGAINST CANONICAL H4-R3G-D

DISPOSITION:
ACCEPTED / CORRECTED NORMATIVELY

AUTHORIZATION EFFECT:
NONE
```

This correction is planning-only and stops here. No sandbox provider, donor-code intake, runtime implementation, H6/Cyber work, blocking review gate, or H4-R3G-F work is authorized.
