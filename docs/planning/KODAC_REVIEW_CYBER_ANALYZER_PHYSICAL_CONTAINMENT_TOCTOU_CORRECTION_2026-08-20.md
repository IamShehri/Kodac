# Kodac Review/Cyber — Analyzer Physical Containment TOCTOU Correction

Status: **NORMATIVE PLANNING CORRECTION / DOCS ONLY / NO IMPLEMENTATION AUTHORIZATION**  
Date: 2026-08-20  
Repository: `TheHalfMoon/Kodac`  
Planning PR: `#121`  
Canonical Kodac base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Applies after PR #121 head: `5ea2ff82b121d41675bdcd6b4a85738d1701a7d9`

---

## 0. Purpose and precedence

Fresh independent exact-head review of PR #121 found one remaining valid physical-containment gap in:

`docs/planning/KODAC_REVIEW_CYBER_ANALYZER_CONTRACT_HARDENING_CORRECTION_2026-08-19.md`

The prior correction correctly requires real-path/symlink-aware containment before dereferencing an analyzer-provided path, but it does not yet bind the later read/ingest/attachment operation to the exact filesystem object that passed validation.

That leaves a time-of-check/time-of-use race: a repository-controlled path or symlink may be replaced after containment validation and before a later pathname-based open.

This correction therefore adds the controlling invariant:

```text
PATH_CONTAINMENT_CHECK != OBJECT_IDENTITY_AT_USE
```

and strengthens Section 6 of the prior analyzer contract hardening correction.

Where this document conflicts with Section 6 of:

`docs/planning/KODAC_REVIEW_CYBER_ANALYZER_CONTRACT_HARDENING_CORRECTION_2026-08-19.md`

**this document controls** until a later separately authorized consolidation.

This document does **not**:

- authorize Cyber implementation;
- authorize H6;
- start H4-R3G-F or any later H4 task;
- change current K2, KRI, validator, evidence, adjudication, or Done Gate behavior;
- authorize donor-code intake;
- authorize an external analyzer/provider;
- authorize a blocking review gate;
- authorize merge of PR #121.

---

# 1. Existing Kodac trust precedent

Kodac already rejects path-check-then-path-use as a sufficient identity boundary.

The canonical H4-R2C Landlock read-only integration authorization states that hashing a configured launcher path and then executing that path is insufficient because replacement can occur between observation and execution. Its authorized pattern is to open the trusted object, validate the exact open object, retain that descriptor, and execute through the same retained descriptor rather than reopening the pathname.

Reference:

`docs/planning/KODAC_KDO_H4_R2C_K2_LINUX_LANDLOCK_READ_ONLY_INTEGRATION_AUTHORIZATION_2026-08-14.md`

The Review/Cyber analyzer path contract must preserve the same trust principle even though the concrete cross-platform mechanism may differ.

---

# 2. Proof-bearing path consumption must be object-bound

For any analyzer-produced existing filesystem location that Kodac intends to dereference for proof-bearing use, containment validation and object consumption must form one identity-preserving operation chain.

The trusted boundary must not perform:

```text
resolve path
→ validate containment
→ discard validated object identity
→ later reopen pathname
→ consume whatever object now occupies that pathname
```

A pathname is discovery metadata. It is not sufficient proof of the object later consumed.

---

# 3. Required trusted access pattern

Future implementation must use a platform-appropriate mechanism purpose-equivalent to all of the following guarantees.

## 3.1 Trusted root anchor

The materialized repository root must be represented by a trusted root handle/descriptor or an equivalently strong platform-native anchor whose identity is bound to:

```text
reviewedHead
materializationDigest
rootPath
rootObjectIdentity
```

The anchor must be established by the trusted execution boundary, not selected by analyzer/provider output.

## 3.2 Root-relative, race-resistant target open

For an existing proof-bearing target, the trusted boundary must open or obtain the final target through the trusted root anchor using platform semantics that prevent an untrusted pathname component from being swapped into an out-of-root object between validation and use.

The exact future implementation may use mechanisms such as descriptor-relative opens, no-follow constraints, platform-native object handles, or another independently reviewed equivalent.

The planning requirement is the security property, not one hard-coded syscall API.

A plain `realpath`/canonicalization check followed by a normal pathname reopen is **not** sufficient.

## 3.3 Validate the opened object

The trusted boundary must validate the final opened object/handle, including when applicable:

```text
object kind
containment under the trusted materialized root
symlink/reparse-point policy
stable platform object identity
expected materialization relationship
```

Stable object identity should be recorded using the strongest applicable platform-native identity, for example device/inode identity on Unix-like systems or the corresponding volume/file identity on Windows.

The exact representation may be refined during a separately authorized implementation task.

## 3.4 Retain the exact validated handle

After validation, the trusted boundary must retain the exact validated handle/descriptor for the proof-bearing operation.

It must not discard that handle and later reopen the pathname to obtain the bytes or metadata used for:

```text
source ingestion
artifact attachment
proof-bearing excerpt creation
digest calculation
validator input
finding evidence
```

If the required operation cannot be performed against the validated retained object without reopening an untrusted pathname, proof-bearing consumption must fail closed until an equivalent race-resistant mechanism is established.

## 3.5 Consume the exact validated object

The bytes, metadata, or object properties that influence a finding, validator result, replay claim, or evidence transition must come from the exact object that passed the trusted containment/identity validation.

Required chain:

```text
trusted root anchor
→ race-resistant target acquisition
→ validate exact opened object
→ retain exact handle
→ consume exact handle
→ bind object identity to receipt/result
```

---

# 4. Result and receipt binding

A proof-bearing analyzer result that references an existing filesystem object must preserve enough trusted identity to show which object was actually consumed.

Purpose-equivalent receipt fields may include:

```text
AnalyzerConsumedObjectIdentity {
  reviewedHead
  materializationDigest
  normalizedRepositoryRelativeLocation
  trustedRootObjectIdentity
  consumedObjectIdentity
  consumedObjectKind
  consumedObjectDigest?
  acquisitionPolicyIdentity
}
```

`normalizedRepositoryRelativeLocation` is descriptive location metadata.

`consumedObjectIdentity` is the trusted identity of the object actually used.

A location match without object identity continuity is not proof of same-object consumption.

---

# 5. Symlink and reparse-point rule

The earlier containment rule remains in force:

```text
in-repository link object
!=
authority to consume an out-of-repository target
```

For proof-bearing existing targets:

- an out-of-root resolved target must be rejected/quarantined;
- ambiguous link/reparse-point semantics must fail closed;
- the implementation must not validate one target and later consume another target through the same pathname;
- platform-specific link/reparse behavior requires explicit qualification before positive proof-bearing admission.

A future implementation may support safe in-root links only if the exact final consumed object is acquired and retained under the race-resistant object-bound rules above.

---

# 6. Deleted or nonexistent logical source locations remain inert

The prior exception for logical locations remains unchanged.

A finding may reference a deleted/nonexistent source location only as inert metadata when it is bound to trusted Git/tree/change-manifest identity.

Such a location:

```text
MUST NOT be dereferenced
MUST NOT be converted into a filesystem proof claim
MUST NOT bypass object-bound containment
```

No retained filesystem handle is required when no filesystem dereference occurs.

---

# 7. Provider-selected output paths remain non-authoritative

This correction does not grant analyzers or providers authority to select arbitrary host write destinations.

Trusted artifact storage remains responsible for destination selection.

Provider-supplied names and paths are untrusted metadata only.

For trusted artifact creation/extraction, the destination side must use its own separately reviewed race-resistant containment and object-creation semantics; validating an output pathname and then reopening or replacing it through an untrusted path is not sufficient for proof-bearing storage.

---

# 8. Failure semantics

For proof-bearing consumption:

```text
ROOT_ANCHOR_UNAVAILABLE
OR
TARGET_ACQUISITION_AMBIGUOUS
OR
OUTSIDE_ROOT
OR
LINK_POLICY_UNQUALIFIED
OR
OBJECT_IDENTITY_UNAVAILABLE_WHEN_REQUIRED
OR
VALIDATED_HANDLE_CANNOT_BE_RETAINED_FOR_USE
OR
PATH_MUST_BE_REOPENED_WITHOUT_EQUIVALENT RACE-RESISTANT GUARANTEE
→ reject/quarantine for proof-bearing use
→ preserve bounded diagnostic metadata
→ do not advance technical evidence
```

No fallback may silently downgrade from object-bound consumption to pathname-only validation.

---

# 9. Review finding reconciliation

The fresh exact-head finding against `5ea2ff82b121d41675bdcd6b4a85738d1701a7d9` is accepted:

```text
F7 physical containment TOCTOU / check-use race
= VALID
= ACCEPT
= corrected by this document
```

The reviewer correctly identified that the prior Section 6 rejected generic “resolution races” but did not define the identity-preserving mechanism needed to prevent them.

The accepted correction is therefore stronger than another `realpath` check: it requires race-resistant acquisition, validation of the opened object, retained-handle use, and object-identity receipt binding for proof-bearing consumption.

---

# 10. Controlling invariants after this correction

```text
PATH_CANONICALIZATION != PHYSICAL_CONTAINMENT
PATH_CONTAINMENT_CHECK != OBJECT_IDENTITY_AT_USE
PATHNAME_LOCATION != CONSUMED_OBJECT_IDENTITY
VALIDATED_PATH != VALIDATED_OBJECT
VALIDATED_OBJECT_HANDLE_MUST_SURVIVE_TO_USE
PROVIDER_PATH != TRUSTED_STORAGE_DESTINATION
```

These invariants are planning requirements only. They authorize no runtime implementation.

---

# 11. Hard non-grants

```text
H4_R3G_F = NOT_STARTED
H6 = NOT_STARTED
CYBER_IMPLEMENTATION = NOT_STARTED
DONOR_CODE_INTAKE = NOT_STARTED
BLOCKING_REVIEW_AUTHORITY = NOT_AUTHORIZED
PR_121_MERGE = NOT_AUTHORIZED
RUNTIME_MUTATION = NONE
```
