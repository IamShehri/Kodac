# Kodac Review/Cyber — Source Pin and Sandbox Provider Qualification Correction

Status: **NORMATIVE PLANNING CORRECTION / NO IMPLEMENTATION AUTHORIZATION**  
Date: 2026-08-19  
Canonical Kodac base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Applies to planning PR: `#121`

## 0. Purpose

Fresh exact-head review of PR #121 identified two valid documentation issues:

1. the master-plan source-admission table retained an older OpenSandbox research pin after the source-level donor report had moved to a newer exact research pin;
2. optional sandbox-provider qualification was stated too generically and did not reference one shared checklist carrying forward the exact H4-R3G-D lifecycle guarantees already established by Kodac.

This file resolves both issues normatively for the PR #121 planning candidate without modifying runtime code or authorizing a provider.

Where this correction conflicts with the other PR #121 planning documents on these two topics, **this correction controls** until the documents are consolidated in a later separately authorized documentation cleanup.

This file does **not**:

- authorize OpenSandbox or any other sandbox provider;
- authorize donor-code intake;
- change K2, H4, KRI, evidence, validator, adjudication, or Done Gate semantics;
- start H4-R3G-F or any later H4 task;
- authorize H6 or the Cyber Mesh;
- authorize a blocking review gate;
- authorize merge of PR #121.

---

# 1. OpenSandbox research-pin correction

The PR #121 master plan contains an earlier research-table entry using:

```text
opensandbox-group/OpenSandbox
426300f86a9437fc5a3302f89956dc477595997e
```

That pin is now classified for this planning candidate as:

```text
HISTORICAL_RESEARCH_PARENT
```

The current source-level research pin used by the donor reverse-engineering work is:

```text
repository = opensandbox-group/OpenSandbox
researchPin = 8f01e935c2cabba778cf37a152033fae062fa0f4
disposition = REFERENCE + ADAPT / OPTIONAL_PROVIDER_CANDIDATE_ONLY
```

The newer pin is a descendant of the earlier research snapshot and includes subsequent control-plane/runtime changes. Therefore no future intake or provider decision may cite the older table row as the current research identity.

General rule:

```text
DONOR_NAME != SOURCE_IDENTITY

SOURCE_IDENTITY =
  repository
  + exact commit/tag
  + selected paths/symbols
  + selected file digests
  + dependency/provenance boundary
```

Before any future OpenSandbox code intake, integration, or provider qualification, the selected source must be re-pinned and its permission/provenance, public license at that pin, dependencies, generated/third-party code boundary, tests, and trust impact revalidated.

---

# 2. Shared sandbox-provider qualification profile

A sandbox provider's own capability declaration is never proof that the capability meets Kodac's theorem.

The future `SandboxProviderCapabilities` contract must therefore reference one or more **qualified proof profiles** rather than treating boolean self-description as admission.

For TTL lifecycle enforcement, the mandatory profile is:

```text
KODAC_H4_R3G_D_PARITY_V1
```

Conceptually:

```text
SandboxProviderCapabilities {
  providerIdentity
  providerVersion
  declaredCapabilities
  qualificationProfileRefs[]
}

SandboxProviderQualification {
  providerIdentity
  providerVersion
  profileIdentity
  exactImplementationIdentity
  exactConfigurationIdentity
  testArtifactIdentities[]
  hostileTestArtifactIdentities[]
  evidenceRecordIdentities[]
  result
}
```

Rules:

```text
declared capability without qualification
→ NOT ADMITTED FOR PROOF

unsupported guarantee
→ FAIL LOUD

ambiguous qualification result
→ FAIL CLOSED

provider version/configuration changes
→ prior qualification does not silently transfer
```

---

# 3. `KODAC_H4_R3G_D_PARITY_V1` checklist

A future optional provider may satisfy the checklist with different internal mechanisms only if the resulting theorem is at least as strong as canonical Kodac H4-R3G-D. Semantic equivalence must be demonstrated; naming similarity is irrelevant.

## Q1 — exact immutable attempt and subject identity

The provider path must remain bound to the already-authorized immutable execution attempt and exact runtime subject.

At minimum the proof-bearing identity must prevent substitution across:

```text
execution attempt
requirement
workload
container/runtime subject
runtime instance
sandbox implementation/artifact
provider implementation/configuration
```

A container name, mutable path, display name, or caller-selected opaque ID alone is insufficient.

## Q2 — K2-derived stable arm operation identity

Before physical arm, K2 must derive a deterministic stable operation identity from canonical already-validated identity material and trusted runtime configuration.

Equivalent invariant:

```text
same arm operation identity + same canonical payload
→ recover/replay the same obligation

same arm operation identity + different payload
→ reject conflicting replay
```

The model, plugin, Review Pack, MCP client, analyzer, sandbox provider, or untrusted caller may not choose the proof-bearing arm identity.

## Q3 — durable K2 PREPARED intent before physical arm

Before invoking physical arm, K2 must durably commit a bounded PREPARED intent that is sufficient to discover and reconcile the operation after K2 restart or an unknown commit result.

Best-effort logs, process memory, or caller-held tokens are insufficient.

The PREPARED record must be durability-acknowledged through trusted K2 evidence authority before the external/provider arm request is issued.

## Q4 — durable provider/watchdog obligation before positive arm acknowledgement

Before the provider may return a positive physical arm acknowledgement, the provider-side trusted lifecycle component must durably record the exact lease/obligation, including the immutable identity/payload and deadline-domain material necessary for recovery.

Required ordering is purpose-equivalent to:

```text
K2 durable PREPARED
→ exact-instance admission/binding
→ immutable deadline creation
→ provider/watchdog durable obligation record
→ provider arm ACK
→ K2 validates ACK
→ K2 durable canonical arm evidence
→ K2 marks intent COMMITTED
→ only then positive armed success leaves K2
```

A provider that acknowledges arm before its recoverable obligation exists does not satisfy the profile.

## Q5 — retained exact-instance mutation/liveness channel

The proof-bearing channel/handle used for expiry mutation and exact-subject liveness must be bound before the final exact-instance validation bracket completes and retained across the arm→terminal transition.

The provider path must not regain proof authority by later re-resolving a mutable container ID, socket pathname, process name, or equivalent mutable locator.

If the retained channel/handle is lost, replaced, malformed, or cannot be proven to denote the admitted runtime instance, positive R3G-D proof fails closed.

A fresh connection may participate only in a fresh separately authorized attempt/observation; it may not silently inherit the old lease's authority.

## Q6 — immutable monotonic deadline domain

The provider must use a monotonic deadline domain whose recovery semantics are explicit and do not silently renew the lease after process restart.

Canonical Linux R3G-D v1 uses:

```text
CLOCK_BOOTTIME
+ trusted Linux boot identity
```

and persists:

```text
leaseStartBoottimeNs
deadlineBoottimeNs
linuxBootId
clockDomainIdentity
```

An alternate provider mechanism must prove equivalent monotonic/restart semantics.

Forbidden:

```text
restart time + ttlMs
wall clock decides expiry
new full TTL after lifecycle-service restart
```

## Q7 — restart recovery preserves the same deadline and obligation

On lifecycle-service/provider restart in a recoverable clock domain, unresolved obligations must be discovered before accepting new equivalent arm work.

Recovery must preserve the original operation/lease identity and original immutable deadline.

If the clock/host domain cannot safely compare the old deadline, the provider must not mint continuity by inventing a new deadline. The old obligation becomes unprovable/unrecoverable for positive proof unless another already-authorized theorem establishes continuity.

## Q8 — K2 restart and unknown-commit reconciliation

K2 restart and ambiguous arm-evidence persistence outcomes must converge through exact operation/lease/payload/record identities.

The implementation must distinguish cases purpose-equivalent to:

```text
PREPARED + no provider obligation
→ exact same-payload retry may be allowed

PREPARED + same provider obligation
→ recover same lease/deadline; reconcile missing K2 evidence

COMMITTED + same provider obligation
→ recover existing obligation; no second arm

conflicting payload/identity
→ fail closed

provider obligation with missing trusted K2 intent
→ integrity failure; do not synthesize positive proof

unknown evidence commit result
→ query/reconcile same record identity; do not mint a new lease/record
```

## Q9 — exact-subject terminal causality

Natural exit cannot be inferred post hoc merely because the runtime is later observed stopped.

Positive natural-exit proof requires a trusted exact-subject terminal event from the retained lifecycle channel and trusted monotonic ordering against the immutable deadline.

Likewise, expiry mutation must target the exact admitted subject through the retained proof-bearing channel/handle.

## Q10 — single-writer terminal winner

Each immutable lease/obligation must have one serialized terminalization state machine with mutually exclusive winners, purpose-equivalent to:

```text
ARMED
  → NATURAL_EXIT_WINNER
  → EXPIRY_WINNER
  → FAILED_CLOSED
```

A second independent timer/process may not race a second proof-bearing terminal outcome against the authorized lifecycle owner.

The expiry winner must be committed before mutation so a later natural-exit observation cannot retroactively replace the causal winner.

## Q11 — durable terminal record before positive terminal proof

Whichever terminal outcome wins must be durably recorded with the exact lease/attempt/subject/causal identity before positive terminal proof is returned to K2/caller.

The record must be sufficient for recovery/reconciliation after restart or unknown persistence acknowledgement.

A transient in-memory winner or successful mutation without durable terminal evidence is insufficient.

## Q12 — fail-closed ambiguity and persistence behavior

The provider qualification must include hostile/failure tests proving that ambiguity does not silently degrade security.

At minimum cover:

```text
conflicting replay payload
provider registry persistence failure
K2 evidence persistence failure
unknown commit result
provider/watchdog restart
K2 restart
lost retained channel/handle
runtime subject replacement/reuse
clock-domain/boot change
malformed provider acknowledgement
partial durable state
repeated retry/reconciliation
terminal race
```

Any case whose identity, deadline, obligation, causal winner, or persistence outcome cannot be reconciled exactly must fail closed for positive R3G-D proof.

---

# 4. Qualification is stronger than capability declaration

A future provider may declare:

```text
supportsTtl = true
supportsTtlRecoveryEvidence = true
```

but those fields are discovery/configuration metadata only.

The trusted admission rule is:

```text
supportsTtl
+ supportsTtlRecoveryEvidence
+ QUALIFIED(KODAC_H4_R3G_D_PARITY_V1, exact provider implementation/config)
→ eligible for R3G-D proof path
```

Without the qualification record:

```text
eligible = false
```

The same architectural rule applies to other proof-bearing K2 capabilities: each capability must reference its own canonical proof profile rather than infer parity from an API shape.

For example, future provider qualification for network deny-all, resource enforcement, or aggregate output bounds must preserve the corresponding canonical H4 proof obligations and must not be inferred merely because the provider exposes similarly named fields.

---

# 5. No weaker-runtime fallback

If an optional provider cannot satisfy a required proof profile, Kodac must not silently downgrade to that provider while retaining the same positive claim.

Permitted outcomes are:

```text
use canonical native K2 provider that is qualified
use another provider qualified for the exact required profiles
run a lower-assurance mode with an explicitly weaker/different claim if separately designed and authorized
fail loud / require human decision
```

Forbidden:

```text
provider lacks exact guarantee
→ run anyway
→ preserve original PROVEN claim
```

This remains true even when the provider is trusted operationally, widely deployed, open source, or code-admitted into the repository.

---

# 6. Future implementation/test requirements

Before an optional sandbox provider can participate in positive K2 proof, a separately authorized implementation must define:

1. exact provider implementation and configuration identity;
2. capability-to-proof-profile mapping;
3. provider-specific adapter contract;
4. qualification harness;
5. exact-state hostile/failure corpus;
6. durable qualification evidence;
7. invalidation rules when provider/version/configuration changes;
8. fail-loud behavior for unsupported profiles;
9. replay/recovery tests;
10. rollback to the previously qualified provider without claim inflation.

OpenSandbox is therefore still classified as:

```text
REFERENCE + ADAPT
OPTIONAL PROVIDER CANDIDATE
NOT K2 REPLACEMENT
NOT CURRENTLY QUALIFIED
```

---

# 7. Resolution of the two fresh-review findings

```text
FINDING: stale OpenSandbox pin
DISPOSITION: ACCEPTED / CORRECTED NORMATIVELY

historical pin:
426300f86a9437fc5a3302f89956dc477595997e

current research pin:
8f01e935c2cabba778cf37a152033fae062fa0f4
```

```text
FINDING: sandbox provider qualification underspecified
DISPOSITION: ACCEPTED / CORRECTED NORMATIVELY

required TTL lifecycle profile:
KODAC_H4_R3G_D_PARITY_V1

capability declaration alone:
INSUFFICIENT
```

This correction is planning-only and stops here. No provider is admitted and no runtime implementation is authorized.
