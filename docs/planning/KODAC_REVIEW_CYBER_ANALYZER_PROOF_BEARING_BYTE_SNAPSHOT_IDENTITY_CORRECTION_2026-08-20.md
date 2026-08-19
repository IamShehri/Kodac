# Kodac Review/Cyber — Analyzer Proof-Bearing Byte Snapshot Identity Correction

Status: **NORMATIVE PLANNING CORRECTION / DOCS ONLY / NO IMPLEMENTATION AUTHORIZATION**  
Date: 2026-08-20  
Repository: `TheHalfMoon/Kodac`  
Planning PR: `#121`  
Canonical Kodac base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Applies after PR #121 head: `092340215c9debab7d4966c5e0456136bff175a1`

---

## 0. Purpose and precedence

Fresh independent exact-head review of PR #121 found one remaining valid proof-identity gap in:

`docs/planning/KODAC_REVIEW_CYBER_ANALYZER_PHYSICAL_CONTAINMENT_TOCTOU_CORRECTION_2026-08-20.md`

The prior correction closes pathname replacement races by requiring race-resistant acquisition, validation of the exact opened filesystem object, retention of that handle/descriptor, and consumption through that retained object.

That is necessary but not sufficient for proof-bearing **content** identity.

The same filesystem object may still be modified in place after acquisition or while bytes are being read. A device/inode identity, Windows volume/file identity, or equivalent stable object identity can therefore remain unchanged while the content changes.

This correction adds the controlling invariants:

```text
OBJECT_IDENTITY != BYTE_SNAPSHOT_IDENTITY
SAME_HANDLE != IMMUTABLE_CONTENT
PROOF_BEARING_CONTENT_REQUIRES_EXACT_BYTE_IDENTITY
```

Where this document conflicts with the proof-bearing content, receipt, or replay clauses of:

`docs/planning/KODAC_REVIEW_CYBER_ANALYZER_PHYSICAL_CONTAINMENT_TOCTOU_CORRECTION_2026-08-20.md`

**this document controls** until a later separately authorized consolidation.

This document does **not**:

- authorize Cyber implementation;
- authorize H6;
- start H4-R3G-F or any later H4 task;
- change current K2, KRI, validator, evidence, adjudication, or Done Gate behavior;
- authorize donor-code intake;
- authorize an analyzer/provider;
- authorize a blocking review gate;
- authorize merge of PR #121.

---

# 1. Existing Kodac evidence establishes the threat

Kodac's canonical H4-R2C evidence distinguishes pathname replacement from same-object in-place mutation.

Reference:

`docs/planning/KODAC_KDO_H4_R2C_K2_LINUX_LANDLOCK_READ_ONLY_EVIDENCE_2026-08-14.md`

The accepted evidence states that:

- replacing the configured pathname after an FD is retained does not replace the bytes seen through the retained FD; and
- same-inode in-place mutation is observable as a **distinct threat**.

Therefore:

```text
same retained handle
!=
proof that content stayed immutable
```

The Review/Cyber analyzer architecture must carry that distinction into every proof-bearing content path.

---

# 2. Object identity and content identity are separate contracts

For proof-bearing consumption, Kodac must distinguish at least:

```text
WHERE / WHICH FILESYSTEM OBJECT WAS ACQUIRED
from
WHICH EXACT BYTES WERE CONSUMED
from
WHICH REVIEWED / MATERIALIZED CONTENT THOSE BYTES CLAIM TO REPRESENT
```

A purpose-equivalent split is:

```text
AnalyzerConsumedObjectIdentity {
  reviewedHead
  materializationDigest
  normalizedRepositoryRelativeLocation
  trustedRootObjectIdentity
  consumedObjectIdentity
  consumedObjectKind
  acquisitionPolicyIdentity
}

AnalyzerConsumedByteSnapshotIdentity {
  digestAlgorithm
  consumedByteDigest
  consumedByteLength
  byteSnapshotIdentity
  expectedMaterializedContentIdentity?
  expectedMaterializedContentDigest?
  immutableSourceIdentity?
}
```

`consumedObjectIdentity` and `consumedByteDigest` are not substitutes for one another.

---

# 3. Mandatory exact-byte digest for proof-bearing content

Whenever bytes from an existing filesystem object influence any of the following:

```text
source ingestion
proof-bearing excerpt
artifact attachment
validator input
reproducer input
finding evidence
technical evidence transition
replay claim
source/result correlation
```

the trusted boundary must compute and retain a cryptographic digest of the **exact byte sequence actually consumed**.

For this proof-bearing path:

```text
consumedByteDigest = MANDATORY
consumedByteLength = MANDATORY
digestAlgorithm = MANDATORY_AND_VERSIONED
```

The digest must be computed by the trusted boundary or by an equivalently trusted immutable-content boundary. Provider/analyzer self-reported digests are untrusted claims until independently verified.

A field such as:

```text
consumedObjectDigest?
```

must not remain freely optional when content influences proof.

Diagnostic or inert metadata that is never dereferenced and never influences technical evidence does not require a consumed-byte digest.

---

# 4. Source bytes tied to `reviewedHead` require reviewed-content binding

A digest of the exact bytes consumed proves which bytes Kodac used. It does not, by itself, prove those bytes correspond to the source state represented by `reviewedHead`.

When proof-bearing content is claimed to represent a reviewed repository source object, the trusted boundary must also bind the consumed byte snapshot to the trusted materialization/repository identity.

At least one independently trusted relationship equivalent to the following is required:

```text
consumedByteDigest
==
expected digest from the trusted materialization manifest / Git object / reviewed-content manifest
```

or:

```text
consumption occurs from a trusted immutable materialization
AND
that immutable materialization identity is bound to reviewedHead/materializationDigest
AND
that immutable source identity is receipt-bound
```

If the expected reviewed content identity is available and the consumed digest differs:

```text
CONTENT_DRIFT
→ reject/quarantine for proof-bearing use
→ preserve bounded diagnostics
→ do not advance technical evidence
```

A mutable working-tree pathname must never silently inherit `reviewedHead` identity merely because its relative location matches a path in that head.

---

# 5. Concurrent in-place mutation must not create an accepted proof snapshot

A retained descriptor/handle prevents pathname substitution but does not necessarily prevent concurrent writes to the same object.

Future implementation must therefore establish a content-stability property before positive proof-bearing admission.

Acceptable future mechanisms may include one of the following, provided the exact mechanism is separately reviewed and receipt-bound:

1. consume from a trusted immutable/read-only materialization whose immutability and reviewed-content identity are proven;
2. copy bytes through the validated retained handle into trusted immutable storage, compute the exact byte digest, and verify that digest against the trusted reviewed/materialized content identity when such an identity is applicable;
3. use an OS/filesystem snapshot or equivalent trusted immutable object whose snapshot identity is bound to the receipt;
4. use another independently reviewed mechanism that proves equivalent exact-byte snapshot identity and reviewed-content relationship.

An advisory lock, best-effort stat comparison, mtime comparison, pathname re-check, or object-identity-only check is not sufficient by itself against a writer that can mutate the same object.

If a consistent content snapshot cannot be established:

```text
CONTENT_STABILITY_UNPROVEN
→ fail closed for proof-bearing content use
```

---

# 6. Exact-byte consumption chain

For a proof-bearing reviewed source target, the minimum trust chain becomes:

```text
trusted reviewed/materialized root
→ race-resistant target acquisition
→ validate exact opened object
→ retain exact handle
→ establish immutable/consistent byte snapshot
→ consume exact snapshot bytes
→ compute trusted consumedByteDigest + consumedByteLength
→ verify reviewed/materialized content binding when applicable
→ bind object identity + byte snapshot identity to result/receipt
```

The following chain is insufficient:

```text
open exact object
→ retain same handle
→ read bytes while object may mutate
→ record only inode/file identity
→ claim replay-equivalent source evidence
```

---

# 7. Receipt and replay identity

A proof-bearing result that consumes content must retain purpose-equivalent trusted fields:

```text
ProofBearingConsumedContentReceipt {
  reviewedHead
  materializationDigest
  normalizedRepositoryRelativeLocation

  trustedRootObjectIdentity
  consumedObjectIdentity
  consumedObjectKind
  acquisitionPolicyIdentity

  digestAlgorithm
  consumedByteDigest
  consumedByteLength
  byteSnapshotIdentity

  expectedMaterializedContentIdentity?
  expectedMaterializedContentDigest?
  immutableSourceIdentity?

  contentBindingDisposition
}
```

For proof-bearing content, `consumedByteDigest`, `consumedByteLength`, and `byteSnapshotIdentity` are mandatory.

Fields that are conditionally applicable must have explicit canonical absence semantics rather than ambiguous omission.

Replay equivalence requires byte-snapshot identity, not only object identity:

```text
same reviewedHead
+ same pathname
+ same object identity
!=
same proof-bearing content
```

At minimum:

```text
same proof-bearing content
→ same trusted byteSnapshotIdentity
→ same consumedByteDigest
```

When the result represents reviewed repository source, the applicable reviewed/materialized content binding must also match.

---

# 8. Analyzer artifacts and generated outputs

Analyzer-generated artifacts may not have a Git/reviewed-head source digest because they did not exist in the reviewed tree.

For such proof-bearing outputs:

- the exact consumed artifact bytes still require a mandatory trusted digest and byte length;
- the artifact's trusted storage identity and producer execution identity must be receipt-bound;
- provider-native or analyzer-native hashes may be retained as native metadata but do not replace trusted independent hashing;
- later replay must consume the exact stored artifact identity or independently reproduce and explicitly compare a new artifact.

A newly reproduced artifact is not silently the same artifact merely because its pathname or logical type matches.

---

# 9. Metadata-only and deleted logical locations

The prior inert-location exception remains unchanged.

A deleted/nonexistent source location that is never filesystem-dereferenced may remain logical metadata when bound to trusted Git/tree/change-manifest identity.

For such metadata-only locations:

```text
NO_FILESYSTEM_BYTES_CONSUMED
→ no consumedByteDigest required
```

The moment bytes are obtained from a filesystem object or artifact and those bytes influence proof, the byte-snapshot requirements in this correction apply.

---

# 10. Failure semantics

For proof-bearing content:

```text
OBJECT_IDENTITY_UNPROVEN
OR
BYTE_SNAPSHOT_IDENTITY_MISSING
OR
CONSUMED_BYTE_DIGEST_MISSING
OR
CONSUMED_BYTE_LENGTH_MISSING
OR
CONTENT_STABILITY_UNPROVEN
OR
REVIEWED_CONTENT_BINDING_MISMATCH
OR
TRUSTED_HASHING_UNAVAILABLE
→ reject/quarantine for proof-bearing use
→ preserve bounded diagnostic metadata
→ do not advance technical evidence
```

No fallback may silently downgrade from exact-byte identity to pathname, metadata, inode/file identity, timestamp, or provider-reported hash.

---

# 11. Review finding reconciliation

The fresh exact-head finding against `092340215c9debab7d4966c5e0456136bff175a1` is accepted:

```text
F8 proof-bearing byte identity optional / same-object in-place mutation
= VALID
= ACCEPT
= corrected by this document
```

The reviewer correctly identified that the prior TOCTOU correction establishes same-object continuity but leaves content identity weaker than proof-bearing replay requires.

This correction therefore makes exact consumed-byte identity mandatory and, for reviewed repository source, additionally requires binding those bytes to the trusted reviewed/materialized content identity.

---

# 12. Controlling invariants after this correction

```text
PATH_CANONICALIZATION != PHYSICAL_CONTAINMENT
PATH_CONTAINMENT_CHECK != OBJECT_IDENTITY_AT_USE
PATHNAME_LOCATION != CONSUMED_OBJECT_IDENTITY
VALIDATED_PATH != VALIDATED_OBJECT
VALIDATED_OBJECT_HANDLE_MUST_SURVIVE_TO_USE

OBJECT_IDENTITY != BYTE_SNAPSHOT_IDENTITY
SAME_HANDLE != IMMUTABLE_CONTENT
CONSUMED_BYTES_REQUIRE_TRUSTED_DIGEST
REVIEWED_PATH != REVIEWED_CONTENT
PROOF_BEARING_CONTENT_REQUIRES_EXACT_BYTE_IDENTITY

PROVIDER_PATH != TRUSTED_STORAGE_DESTINATION
PROVIDER_DIGEST != TRUSTED_CONSUMED_BYTE_DIGEST
```

These invariants are planning requirements only. They authorize no runtime implementation.

---

# 13. Hard non-grants

```text
H4_R3G_F = NOT_STARTED
H6 = NOT_STARTED
CYBER_IMPLEMENTATION = NOT_STARTED
DONOR_CODE_INTAKE = NOT_STARTED
BLOCKING_REVIEW_AUTHORITY = NOT_AUTHORIZED
PR_121_MERGE = NOT_AUTHORIZED
RUNTIME_MUTATION = NONE
```
