# KDO-H5-R2B — K3 Gate Applicability Reconciliation Authorization

Date: 2026-08-15
Status: AUTHORIZATION CORRECTION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R2B-C2

NAME:
K3 PATH-FILTERED GATE APPLICABILITY RECONCILIATION

CANONICAL BASE:
0ccd36fbe6f2146d42f19112c53923448727fe40

PURPOSE:
CORRECT THE R2B PRE/POST-LEDGER REQUIREMENT FOR K3-R4 AND K3-R5 WHEN GITHUB PATH FILTERS MAKE THOSE WORKFLOWS NON-APPLICABLE TO THE EXACT CHANGE SET

RUNTIME AUTHORITY:
NONE

R2B IMPLEMENTATION SCOPE:
UNCHANGED

LEDGER:
REMAINS BLOCKED UNTIL FRESH PRE-LEDGER PASS UNDER R2B + C1 + C2
```

The canonical H5-R2B authorization currently requires:

```text
K3-R4 PASS
K3-R5 PASS
```

for pre-ledger and post-ledger certification.

The first valid post-C1 implementation candidate exposed that this wording is not executable for every R2B change set because the K3 workflows are intentionally path-filtered GitHub Actions workflows.

R2B-C2 does not weaken K3 protection. It defines when those workflows are applicable and what exact-head proof is required when GitHub correctly does not schedule them.

---

## 2. Canonical K3-R4 trigger contract

Canonical workflow:

```text
.github/workflows/k3-r4-adapter.yml
blob ef5a1c236966644fc7652db5e065a3071e39c0e7
```

Its `pull_request.paths` trigger set is exactly:

```text
packages/kodac-runtime/src/repository-intelligence/**
packages/kodac-runtime/src/repository/**
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/trust/policy.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/k3-r4-ast-grep-adapter.test.ts
packages/kodac-runtime/test/gateway.test.ts
packages/kodac-runtime/test/fixtures/k3-r1/**
.github/workflows/k3-r4-adapter.yml
```

If an exact R2B candidate changes at least one K3-R4 trigger path, K3-R4 must run on that exact head and PASS.

If the exact candidate changes none of those trigger paths, GitHub does not schedule K3-R4 by design. In that case the correct certification result is:

```text
K3-R4:
NOT_APPLICABLE_PATH_FILTER_PROVEN
```

not a fabricated PASS and not a failure.

---

## 3. Canonical K3-R5 trigger contract

Canonical workflow:

```text
.github/workflows/k3-r5-context-engine.yml
blob 0c402c65af6d19b2a514268d4cb51ffc00a6e43a
```

Its `pull_request.paths` trigger set is exactly:

```text
packages/kodac-runtime/src/context-engine/**
packages/kodac-runtime/src/repository/contracts.ts
packages/kodac-runtime/src/repository-intelligence/contracts.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/k3-r5-context-engine.test.ts
.github/workflows/k3-r5-context-engine.yml
```

If an exact R2B candidate changes at least one K3-R5 trigger path, K3-R5 must run on that exact head and PASS.

If the exact candidate changes none of those trigger paths, the correct certification result is:

```text
K3-R5:
NOT_APPLICABLE_PATH_FILTER_PROVEN
```

---

## 4. Exact-head proof required for NOT_APPLICABLE

A K3 workflow may be classified `NOT_APPLICABLE_PATH_FILTER_PROVEN` only when all of the following are true:

1. the candidate's exact base SHA and exact head SHA are recorded;
2. the complete changed-path set from that base to that head is recorded;
3. the canonical K3 workflow blob is recorded;
4. the workflow's exact `pull_request.paths` set is recorded;
5. set intersection between changed paths and trigger paths is empty;
6. the workflow file itself is unchanged;
7. the K3 implementation/test surfaces that the workflow directly protects are unchanged unless another trigger path would have scheduled the workflow;
8. full Kodac runtime tests on the exact head PASS;
9. runtime-change-classifier and K2 runtime gate on the exact head PASS;
10. manual review confirms no deliberate touch of an unrelated K3 trigger path was omitted from the diff.

If any trigger-path intersection exists, `NOT_APPLICABLE` is forbidden and an exact-head K3 workflow PASS is required.

---

## 5. Forcing a workflow to run is forbidden

R2B-C2 explicitly forbids changing an unrelated K3 trigger path merely to force GitHub to schedule K3-R4 or K3-R5.

Examples of forbidden artificial changes include:

- touching `packages/kodac-runtime/src/index.ts` when R2B requires no export change;
- modifying a K3 workflow file without a K3 workflow change need;
- editing a K3 test only to activate its workflow;
- whitespace-only trigger-path changes;
- expanding R2B production scope into repository-intelligence/context-engine surfaces solely for CI scheduling.

Such changes would weaken scope discipline rather than strengthen certification.

---

## 6. Current diagnostic candidate

R2B implementation PR #67 post-C1 candidate:

```text
base:
0ccd36fbe6f2146d42f19112c53923448727fe40

head observed before C2 merge/rebase:
0c91b48d49ea94cb22560e233769bad7e91be2bf
```

Its changed paths are confined to R2B/C1 production and test surfaces and have empty intersection with both canonical K3-R4 and K3-R5 trigger sets.

Observed exact-head CI on that diagnostic candidate includes:

```text
governance / provenance / legacy:
PASS

runtime-change-classifier:
PASS

Windows Typecheck + Test:
PASS

macOS Typecheck + Test:
PASS

Ubuntu Typecheck + Test:
PASS

k2-runtime-gate:
PASS

CodeRabbit:
SUCCESS
```

K3-R4 and K3-R5 were not scheduled because their path filters did not match.

This diagnostic head does not become accepted pre-ledger evidence merely because C2 describes it. After C2 is canonical, #67 must be rebased/regenerated from corrected canonical main and receive fresh exact-head certification.

---

## 7. Corrected pre-ledger gate wording

After R2B-C2 becomes canonical, replace the unconditional K3 lines in the R2B/C1 pre-ledger gate with:

```text
K3-R4:
PASS on exact head if any canonical K3-R4 trigger path changed
OR
NOT_APPLICABLE_PATH_FILTER_PROVEN on exact head if trigger-path intersection is empty

K3-R5:
PASS on exact head if any canonical K3-R5 trigger path changed
OR
NOT_APPLICABLE_PATH_FILTER_PROVEN on exact head if trigger-path intersection is empty
```

All other pre-ledger requirements remain unchanged.

---

## 8. Corrected post-ledger gate wording

The same applicability rule applies to the ledger-bearing exact head.

Because the authorized R2B evidence ledger path itself is not a K3-R4 or K3-R5 trigger path, adding only the ledger does not make either K3 workflow applicable if the accepted implementation candidate also had an empty trigger-path intersection.

Post-ledger certification must recompute the changed-path/trigger-path intersection against the exact ledger-bearing head rather than copy the pre-ledger classification blindly.

---

## 9. Evidence ledger additions

The future R2B evidence ledger must bind:

- this C2 path/blob/canonical merge identity;
- exact K3-R4 workflow blob and trigger set;
- exact K3-R5 workflow blob and trigger set;
- accepted pre-ledger base/head changed-path set;
- exact set-intersection result for each K3 workflow;
- either exact workflow run/job PASS evidence or `NOT_APPLICABLE_PATH_FILTER_PROVEN` evidence;
- the same recomputed evidence for the ledger-bearing post-ledger head.

---

## 10. Non-claims

R2B-C2 does not authorize:

- disabling K3-R4 or K3-R5;
- changing their workflows;
- bypassing a K3 workflow when a trigger path changed;
- treating a failed K3 workflow as not applicable;
- touching unrelated K3 trigger paths;
- changing R2B runtime scope;
- adding H5-R3/H6 authority;
- changing K2, policy, approval, confinement, H5-R1A, or Done Gate semantics.

---

## 11. Authorization truth

```text
IF CANONICAL:

K3-R4 / K3-R5 CERTIFICATION:
TRIGGER-AWARE

TRIGGER PATH CHANGED:
EXACT-HEAD WORKFLOW PASS REQUIRED

NO TRIGGER PATH CHANGED:
EXACT-HEAD NOT_APPLICABLE_PATH_FILTER_PROVEN REQUIRED

ARTIFICIAL TRIGGER-PATH TOUCH:
FORBIDDEN

R2B LEDGER:
STILL BLOCKED UNTIL FRESH PRE-LEDGER PASS
```

Status:

```text
KDO_H5_R2B_C2_K3_GATE_APPLICABILITY_READY_FOR_CANONICAL_REVIEW
```
