# KDO H4-R3G-B — R3G-A R3F Protected-Blob Pin Allowlist Correction

Status: **AUTHORIZATION AMENDMENT CANDIDATE — DOCS ONLY**

Date: 2026-08-16

## 1. Purpose

This document proposes one narrow correction to the canonical H4-R3G-B V3 pre-ledger implementation allowlist.

It exists only because the canonical R3G-B authorization explicitly permits a bounded read-only extension of the existing R3F Docker provider, while one already-canonical R3G-A predecessor test protects the R3F production module by exact Git-blob identity and was omitted from the R3G-B pre-ledger allowlist.

This amendment does **not** expand the R3G-B theorem, claim class, runtime authority, host-reading authority, containerd authority, Docker authority, evidence authority, or merge authority.

## 2. Canonical predecessor authorization

Canonical H4-R3G-B V3 authorization:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md
```

Canonical authorization main / merge state:

```text
891edad3d74f95e19ead33ee1bc1f5b1627ac5a5
```

All V3 requirements remain exact except for the one allowlist correction defined below.

## 3. Discovery evidence

The active R3G-B implementation PR is:

```text
PR #109
feat/kdo-h4-r3g-b-gvisor-source-lineage
```

Exact implementation head at discovery:

```text
6252d5bf95280c20816293046ed1d1148da9c2ab
```

V3 §§21–22 explicitly authorize the existing R3F provider to add bounded read-only support for:

```text
Docker SystemInfo security fields
exact digest-qualified image inspect
ordered RootFS DiffIDs
```

The authorized R3F production change moves the module Git blob from:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts

canonical predecessor blob:
452bd955cb0ef84f2090aa646dfdc70ad610a8d9

reviewed R3G-B implementation blob at discovery:
f9e2dda11fe26d481e2e6c328c37cd37a6260106
```

Exact-head Ubuntu runtime CI reaches TypeScript PASS and executes the full test suite. Existing R3F tests and the focused pure R3G-B tests pass. The sole failing test is the canonical R3G-A protected-surface assertion:

```text
packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts

H4-R3G-A production module is pure E3-only and protected R3B/R3E/R3F surfaces remain unchanged
```

The failure is exactly:

```text
actual R3F Git blob:
f9e2dda11fe26d481e2e6c328c37cd37a6260106

expected predecessor R3F Git blob:
452bd955cb0ef84f2090aa646dfdc70ad610a8d9
```

The test is behaving correctly. The authorization allowlist is incomplete.

## 4. Governance defect

Canonical V3 authorizes modification of:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
```

but its 14-path pre-ledger allowlist omits the already-canonical predecessor test that pins that exact production surface:

```text
packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
```

Therefore a legitimate V3-authorized R3F byte change cannot pass the required full-suite gate without modifying a path that V3 currently forbids.

This is an authorization/certification deadlock, not authority to weaken or bypass the predecessor assertion.

## 5. Exact amendment

If this amendment becomes canonical, the H4-R3G-B V3 pre-ledger allowlist becomes **15 exact paths** instead of 14.

The only newly admitted path is:

```text
packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
```

No other path is added.

## 6. Unique authority granted on the fifteenth path

The newly admitted path may be changed **only** to reconcile the expected protected Git-blob identity for:

```text
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
```

when and only when all of the following are true:

1. the R3F production byte change itself is within canonical H4-R3G-B authority;
2. the exact R3F diff has been reviewed against the canonical predecessor bytes;
3. the exact replacement R3F Git-blob SHA is known from the implementation head;
4. the predecessor test failure is solely the stale expected R3F blob identity;
5. no R3G-A semantic assertion is weakened, removed, broadened, reordered, or bypassed.

For implementation head `6252d5bf95280c20816293046ed1d1148da9c2ab`, the currently reviewed replacement identity is:

```text
f9e2dda11fe26d481e2e6c328c37cd37a6260106
```

This value is evidence for the present implementation head, not a permanently authorized future value.

If R3F production bytes move again later in the same authorized R3G-B implementation, the expected pin may move again only after exact diff/manual review of those new R3F bytes. Blind pin chasing is forbidden.

## 7. Explicitly forbidden changes on the fifteenth path

This amendment does **not** authorize changes to:

- R3G-A production semantics;
- R3G-A physical-resource theorem;
- R3G-A hostile cases;
- R3G-A cgroup-v2 expectations;
- R3G-A gateway authority assertions;
- R3G-A runtime-config assertions;
- any R3G-A expected blob other than the exact R3F module blob described above;
- test names or test coverage for the purpose of avoiding a failure;
- assertion deletion, weakening, broadening, or conditional skipping;
- platform skips;
- evidence-ledger contents;
- production source outside the existing V3 allowlist.

The test must continue to protect the same predecessor surfaces and must continue to fail if an unreviewed R3F byte change occurs.

## 8. Existing gateway-pin reconciliation authority is unchanged

The nine predecessor tests already admitted by V3 for exact gateway-byte reconciliation remain unchanged in scope and authority.

This amendment grants no new gateway authority and does not alter the gateway reconciliation procedure.

## 9. Evidence ledger remains forbidden before the pre-ledger gate

The reserved R3G-B evidence ledger remains absent until the complete pre-ledger implementation gate passes:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

This amendment does not authorize creation of that ledger.

## 10. No implementation merge authorization

Canonicalizing this amendment would only resolve the allowlist deadlock.

It would **not** mean that PR #109 is complete, Ready, pre-ledger certified, ledger-authorized, or merge-authorized.

PR #109 must remain Draft until the full canonical R3G-B pre-ledger theorem and all gates are satisfied.

## 11. Amendment PR gate

This authorization amendment may become canonical only if its own PR satisfies all of the following:

- exact base is canonical `main`;
- one commit or otherwise auditable docs-only history;
- exactly one changed path: this document;
- no source, test, schema, workflow, dependency, or evidence-ledger delta;
- governance/provenance checks PASS;
- manual review confirms the amendment is limited to the one missing pin-reconciliation path;
- available external review has no unresolved actionable finding;
- unavailable/rate-limited reviewers are recorded neutrally, never as PASS;
- zero unresolved actionable review threads;
- exact head is rechecked immediately before merge.

## 12. Canonical effect if merged

If merged, read canonical V3 plus this amendment together as follows:

```text
H4-R3G-B V3 pre-ledger allowlist = original 14 exact paths
                                + packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts

Authority on added path = R3F protected Git-blob expected-value reconciliation only.
```

Every other V3 clause remains unchanged and controlling.
