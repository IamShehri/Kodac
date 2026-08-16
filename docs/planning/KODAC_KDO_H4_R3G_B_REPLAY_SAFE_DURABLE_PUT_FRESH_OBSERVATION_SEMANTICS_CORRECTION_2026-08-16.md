# KDO H4-R3G-B — Replay-Safe Durable Put and Fresh-Observation Identity Correction

Status: **AUTHORIZATION AMENDMENT CANDIDATE — DOCS ONLY**

Date: 2026-08-16

## 1. Purpose

This document proposes one narrow semantic correction to the canonical H4-R3G-B V3 authorization.

It exists because V3 simultaneously requires:

1. every R3G-B source-lineage record to bind `executionAttemptIdentity` as part of its canonical identity-bearing tuple;
2. the existing canonical R3E execution-attempt identity to be nonce-bound;
3. a lost durable-commit acknowledgment to fail the current invocation with no blind same-invocation retry; and
4. a later **fresh full re-observation** hostile case to exercise a **same-record** replay-safe commit.

Those requirements cannot all be true at the same time if a fresh observation is a fresh execution-observation occurrence. A fresh observation must have a fresh occurrence identity; because `executionAttemptIdentity` is part of the R3G-B source-record tuple, the resulting canonical R3G-B record identity is also fresh.

This is an authorization/test-semantics contradiction. It is not authority to remove occurrence binding, reuse a stale attempt identity, weaken durable evidence, or silently retry a timed-out commit.

## 2. Canonical predecessor authorization

Canonical H4-R3G-B V3 authorization:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md
```

Canonical allowlist correction that must continue to be read together with V3:

```text
docs/planning/KODAC_KDO_H4_R3G_B_R3G_A_R3F_PROTECTED_BLOB_PIN_ALLOWLIST_CORRECTION_2026-08-16.md
```

Canonical main at amendment creation:

```text
ea35c82c44bf9a75dfe05ddfb54d4a9b82cc4d9f
```

All V3 requirements remain exact except for the replay/fresh-observation correction defined below.

## 3. Existing occurrence identity is intentionally nonce-bound

The already-canonical R3E contract defines execution-attempt identity from:

```text
requirementIdentity
workloadIdentity
nonce
```

with the nonce required to be a canonical UUID.

Canonical source:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
```

Canonical blob at this amendment base:

```text
1d02a5dbc1dc4071636c24327e7faf9906370ef5
```

The relevant function is:

```text
createGvisorExecutionAttemptIdentity(...)
```

This occurrence distinction is security-relevant. A later observation must not reuse an earlier attempt identity solely to manufacture storage deduplication.

## 4. V3 record identity intentionally binds the occurrence

V3 requires the R3G-B canonical source record to bind at least:

```text
requirementIdentity
workloadIdentity
executionAttemptIdentity
containerBindingIdentity
runtimeLineageIdentity
exact full containerId
source digest / image lineage identities
ctr / containerd authority identities
rootfs authority / snapshot / mount identities
```

Therefore two otherwise identical physical observations that belong to different execution-observation occurrences are not the same canonical evidence record.

That is desirable. It prevents deduplication semantics from erasing occurrence identity.

## 5. The contradiction to correct

V3 durable-commit semantics correctly require a replay-safe logical put keyed by `recordIdentity` and correctly state:

```text
same recordIdentity + same canonical bytes
=> idempotent same logical record

same recordIdentity + different canonical bytes
=> integrity violation
```

V3 also correctly requires:

```text
lost acknowledgment
=> current invocation FAILS CLOSED
=> no blind same-invocation retry
```

However, V3 then requires a hostile case equivalent to:

```text
lost acknowledgment
+ later fresh full re-observation
+ replay-safe same-record commit
```

A genuinely fresh observation cannot be the same record when `executionAttemptIdentity` is occurrence-bound and identity-bearing.

The correction is to separate **same-record durable-put replay** from **fresh-observation recovery**.

## 6. Exact amendment — same-record replay semantics

The durable store contract remains replay-safe.

For one exact immutable validated R3G-B record `R` with canonical bytes `B` and identity `I`:

```text
PUT(I, B) when I is absent
=> durably stores exactly one logical record
=> returns the canonical acknowledgment for I

PUT(I, B) when I already maps to exactly B
=> succeeds idempotently
=> does not create a second logical record
=> returns the same canonical acknowledgment semantics for I

PUT(I, B2) when I already maps to bytes B and B2 != B
=> integrity violation
=> FAIL CLOSED
```

The store must compare canonical record bytes, not only caller-supplied identity text.

This remains a trusted-store invariant even if the production gateway normally submits a given observation record only once.

## 7. Exact amendment — no blind same-invocation retry

V3 remains unchanged here.

If the commit callback:

- throws;
- times out;
- is cancelled;
- returns malformed acknowledgment;
- returns acknowledgment for another record;
- or loses the acknowledgment after the external store may already have durably written the record;

then the current gateway invocation is:

```text
UNPROVEN / FAILURE
```

The gateway must not immediately resubmit the same record merely because the acknowledgment was lost.

Late completion must not upgrade the terminal failure to success.

## 8. Exact amendment — fresh full re-observation is a new evidence occurrence

A later recovery invocation may run a fresh complete R3G-B observation from the beginning.

That fresh observation MUST NOT reuse the previous `executionAttemptIdentity` solely to force record deduplication.

It obtains a fresh execution-observation occurrence identity according to the canonical R3E contract.

Consequently, even if all physical lineage facts remain stable, fields transitively bound to the fresh attempt may change, including at least:

```text
executionAttemptIdentity
containerBindingIdentity
runtimeLineageIdentity
recordIdentity
```

The later record is therefore a distinct valid evidence occurrence.

The earlier possibly-durable record may remain in the evidence store. The later fresh record does not constitute a duplicate logical record under the same `recordIdentity`; it is a distinct observation occurrence with its own identity.

## 9. Exact amendment — prohibited attempt-identity reuse

The implementation MUST NOT satisfy replay tests by:

- caching the previous `executionAttemptIdentity` after failure;
- accepting an attempt identity from the public caller;
- deriving a fixed nonce from requirement/workload identity;
- reusing an R3E binding request from an earlier failed observation;
- removing `executionAttemptIdentity` from the R3G-B canonical record tuple;
- removing occurrence-bound fields from `containerBindingIdentity` or `runtimeLineageIdentity`;
- weakening identity validation;
- or treating two distinct record identities as one record for storage deduplication.

Any such change requires separate authorization.

## 10. Corrected hostile proof requirements

Where V3 currently requires a hostile case equivalent to:

```text
fresh full re-observation + replay-safe same-record commit
```

read it, if this amendment becomes canonical, as **two separate proofs**:

### A. Same-record durable-put idempotency

At the trusted durable-store contract boundary, submit the exact same immutable validated record twice and prove:

```text
same recordIdentity
same canonical bytes
same logical durable record
canonical acknowledgment semantics preserved
no second logical record created
```

Also prove that an already-stored `recordIdentity` associated with different bytes fails closed as an integrity violation.

This proof must not require a second public gateway observation to reuse an old attempt identity.

### B. Lost acknowledgment followed by fresh observation

Prove:

```text
observation #1 reaches durable commit
acknowledgment is lost / times out
observation #1 returns FAILURE / UNPROVEN
late completion cannot upgrade it

later observation #2 starts from the beginning
observation #2 uses a fresh executionAttemptIdentity
all required R3E/R3F/ctr/containerd/rootfs/mount facts are freshly re-observed
observation #2 may succeed only after its own exact durable acknowledgment
observation #2 recordIdentity is distinct when occurrence-bound identities differ
```

No success claim for observation #1 is retroactively created.

## 11. Corrected replay-safety interpretation

`replay-safe durable logical put` means:

- exact duplicate submission of one immutable record is idempotent at the store boundary;
- a conflicting payload under one record identity is rejected;
- acknowledgment semantics are identity-bound;
- lost acknowledgment does not authorize gateway success;
- the gateway does not blind-retry a timed-out put in the same invocation;
- fresh recovery observations retain fresh occurrence identity.

It does **not** mean that all repeated physical observations of the same container/source must collapse into one record identity.

## 12. No change to the physical R3G-B theorem

This amendment changes none of the following:

- exact required manifest digest;
- ordered DiffIDs;
- ChainID derivation;
- pinned Moby active-key theorem;
- snapshot ancestry;
- Docker SystemInfo requirements;
- rootfs path derivation;
- protected parent path authority;
- retained final rootfs object;
- stored OCI `Root.Path` equality;
- stable kernel overlay mount;
- R3E exact subject bracket;
- R3F exact binding/source stability;
- ctr artifact authority;
- containerd endpoint authority;
- fixed namespace/snapshotter;
- fixed allowed `ctr` reads;
- no shell/no discovery/no mutation rules;
- finite monotonic deadline;
- bounded output/JSON/mount parsing;
- canonical tuple serialization;
- exact commit acknowledgment;
- fail-closed behavior.

## 13. No new implementation path authority

This amendment does not add any pre-ledger implementation path.

Read the implementation allowlist as:

```text
canonical V3
+ the already-canonical R3G-A/R3F protected-blob allowlist correction
```

No sixteenth path is authorized by this amendment.

## 14. Evidence ledger remains forbidden

The reserved evidence ledger remains forbidden until the complete pre-ledger implementation gate passes:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

This amendment does not authorize ledger creation.

## 15. No implementation merge authorization

Canonicalizing this amendment would only reconcile replay/fresh-observation semantics.

It would not mean that PR #109 is complete, Ready, pre-ledger certified, ledger-authorized, or merge-authorized.

PR #109 must remain Draft until the complete canonical R3G-B pre-ledger theorem and all gates are satisfied.

## 16. Amendment PR gate

This amendment may become canonical only if its own PR satisfies all of the following:

- exact base is canonical `main`;
- one commit or otherwise auditable docs-only history;
- exactly one changed path: this document;
- no source, test, schema, workflow, dependency, evidence-ledger, or implementation-authorization delta beyond the replay correction written here;
- governance/provenance checks PASS;
- manual review confirms that occurrence binding is preserved and only the contradictory replay/fresh-observation requirement is corrected;
- available external review has no unresolved actionable finding;
- unavailable/rate-limited reviewers are recorded neutrally, never as PASS;
- zero unresolved actionable review threads;
- exact head is rechecked immediately before merge.

## 17. Canonical effect if merged

If merged, read canonical V3, the R3G-A/R3F allowlist correction, and this amendment together as follows:

```text
R3G-B record identity remains occurrence-bound.

same exact record replay
=> store-level idempotency required

lost acknowledgment
=> current invocation fails

fresh full re-observation
=> fresh occurrence identity
=> normally a distinct canonical record
=> success requires its own exact durable acknowledgment

No stale attempt identity may be reused merely to force deduplication.
```

Every other V3 clause remains unchanged and controlling.
