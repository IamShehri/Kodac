# KDO-H4-R3A — Ledger Gate Reconciliation Authorization

Date: 2026-08-15
Status: AUTHORIZATION CORRECTION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H4-R3A-C1

NAME:
LEDGER ABSENCE PROOF / POST-LEDGER TEST RECONCILIATION

CANONICAL BASE:
45d67af74809c3b45635b8f97301b9cccec842f7

R3A AUTHORIZATION:
docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_AUTHORIZATION_2026-08-15.md

PURPOSE:
REMOVE ONE SELF-CONTRADICTORY PERMANENT TEST ASSERTION WHILE PRESERVING THE PRE-LEDGER GATE AS EXTERNAL EXACT-HEAD EVIDENCE

NEW RUNTIME AUTHORITY:
NONE

LEDGER:
BLOCKED UNTIL A NEW FRESH PRE-LEDGER PASS
```

The canonical H4-R3A authorization contains two individually reasonable requirements that become mutually impossible when implemented literally in one permanent runtime test:

```text
PRE-LEDGER:
ledger must be absent

POST-LEDGER:
implementation/test/schema blobs must remain unchanged from the accepted pre-ledger head
AND
full runtime tests must pass
```

The first diagnostic implementation encoded `ledger absent` as an unconditional focused-test filesystem assertion.

That candidate passed its exact pre-ledger gate, the ledger was then added correctly as a separate commit, and the ledger-bearing exact head failed the full runtime suite solely because the same unchanged focused test now observed the intentionally created ledger.

The correct reconciliation is to keep ledger absence as an **exact changed-path / repository-state pre-ledger gate**, not as a permanent runtime invariant that must remain true after the ledger is intentionally created.

---

## 2. Diagnostic evidence

First accepted-looking pre-ledger diagnostic head:

```text
765a1314d017e85f1e3526b4394201fb1162aae0
```

Tree:

```text
63c536c8c3f48f319b5f3fe278360a97ca5b07e9
```

At that head:

```text
changed paths:
exactly 4 authorized pre-ledger paths

ledger:
absent

Windows/macOS/Ubuntu Typecheck + Test + patch benchmark:
PASS

K2 aggregate:
PASS

K3-R4:
PASS

K3-R5:
PASS

governance/provenance/legacy:
PASS

CodeRabbit:
SUCCESS

unresolved review threads:
0
```

A ledger-only commit then produced:

```text
ce0e8ce2a84c0d21e03303e0ae03e16fe10b843d
```

The delta from `765a1314...` to `ce0e8ce2...` was exactly one added path:

```text
docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_EVIDENCE_2026-08-15.md
```

No implementation, index, schema, or test blob changed.

On the ledger-bearing head, the K3-R4 full runtime step failed at exactly:

```text
H4-R3A predecessor donor versions limits and protected authority baseline are exact
```

with:

```text
true !== false
```

at the focused assertion checking that the evidence ledger file did not exist.

All other H4-R3A focused tests passed on that run, including:

- fixed self-contained confinement lineage vectors;
- digest-bound OCI source rules;
- entrypoint/resource/network bounds;
- workload tamper rejection;
- attestation separation;
- hostile Proxy/accessor rejection;
- schema parity;
- production purity.

Therefore the post-ledger failure is a governance/test-lifecycle contradiction, not a product/runtime regression.

Both `765a1314...` and `ce0e8ce2...` remain diagnostic only after this correction. Neither may be reused as acceptance evidence.

---

## 3. Corrected interpretation of the ledger-absence requirement

The R3A authorization requirement:

```text
ledger absent before pre-ledger PASS
```

remains fully in force.

It must be proven before ledger creation through exact repository evidence such as:

```text
compare canonical implementation base -> candidate head
changed paths ⊆ authorized paths 1-4
changed path count = expected pre-ledger count
ledger path not present in changed-path set
ledger file absent at the exact candidate head
```

This proof belongs to the pre-ledger gate and evidence ledger.

It is **not** a permanent runtime semantic property of the implementation.

After the authorized ledger is deliberately created, the expected truth is exactly the opposite:

```text
ledger present at exact authorized path
```

---

## 4. Corrected focused-test requirement

The authorized focused test path remains:

```text
packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
```

Before a new pre-ledger candidate is accepted, this test may receive one narrow reconciliation:

```text
REMOVE:
unconditional runtime assertion that the evidence ledger file does not exist

REMOVE IF UNUSED:
filesystem helper/import used only for that assertion
```

The focused test must continue to prove:

- exact canonical authorization document blob;
- exact H4 readiness audit blob;
- exact OpenSandbox donor pins;
- exact version/limit vocabulary;
- exact protected authority blobs;
- all fixed structural identity vectors;
- self-contained confinement-lineage recomputation;
- all hostile-input/bound/schema/purity properties.

No other focused-test weakening is authorized by C1.

---

## 5. No CI-conditional workaround

R3A-C1 explicitly forbids solving the contradiction with:

- checking `CI` environment variables;
- checking branch names;
- checking whether the ledger path happens to exist and conditionally passing;
- skip/todo/only annotations;
- test deletion;
- post-ledger mutation of the test while claiming the pre-ledger test blob was unchanged;
- workflow-specific bypasses;
- excluding the focused test from post-ledger suites.

The test should simply stop asserting a repository phase property that intentionally flips after the ledger commit.

The phase property is instead certified externally by the exact-head gate.

---

## 6. Corrected pre-ledger path rule

The R3A pre-ledger implementation allowlist remains exactly:

```text
1. packages/kodac-runtime/src/trust/sandbox-workload.ts
2. packages/kodac-runtime/src/index.ts
3. schema/kdo-h4-r3a-sandbox-workload.schema.json
4. packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
```

The ledger remains:

```text
5. docs/planning/KODAC_KDO_H4_R3A_ATTESTED_SANDBOX_WORKLOAD_IDENTITY_EVIDENCE_2026-08-15.md
```

and remains forbidden until a **new** fresh pre-ledger PASS.

No new production path, historical test path, workflow path, dependency, or donor import is authorized.

---

## 7. Corrected pre-ledger gate

After this correction becomes canonical, the implementation branch must be re-established from the corrected canonical main **without the diagnostic ledger commit**, then independently prove:

```text
changed paths ⊆ authorized paths 1-4
ledger absent by exact repository/changed-path evidence
focused test contains no permanent ledger-absence assertion
protected authority blobs exact
all fixed identity vectors exact
self-contained confinement lineage exact
strict hostile-input proofs PASS
all explicit bounds PASS
schema parity PASS
production purity PASS
TypeScript PASS
full runtime tests PASS on Ubuntu/Windows/macOS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy PASS
K3-R4 PASS
K3-R5 PASS
CodeRabbit SUCCESS
unresolved review threads = 0
manual exact-head security/authority review PASS
```

The earlier head `765a1314...` cannot be grandfathered into acceptance because its focused test encoded the contradictory permanent assertion.

---

## 8. Corrected post-ledger gate

Only after the new pre-ledger PASS may the ledger be added as one separate commit.

The ledger-bearing exact head must then prove:

```text
changed paths = authorized paths 1-5 only
ledger present at exact path
implementation/index/schema/test blobs unchanged from the NEW accepted pre-ledger head
protected blobs exact
focused/full runtime tests PASS
TypeScript PASS
K2 gate PASS
governance/provenance/legacy PASS
K3-R4 PASS
K3-R5 PASS
CodeRabbit SUCCESS
unresolved review threads = 0
manual exact-head security/authority review PASS
```

The focused suite no longer contains a property that conflicts with the expected post-ledger repository state.

---

## 9. Evidence-ledger correction requirement

The future accepted R3A evidence ledger must additionally record:

- this R3A-C1 authorization path/blob/merge identity;
- the diagnostic pre-ledger head `765a1314...` as rejected historical evidence;
- the diagnostic ledger-bearing head `ce0e8ce2...` as rejected historical evidence;
- the exact post-ledger failure and its cause;
- the new accepted focused-test blob after reconciliation;
- exact external proof that the ledger was absent at the new pre-ledger head;
- the new accepted pre-ledger head/tree;
- fresh post-ledger certification on the later ledger-bearing head.

The old diagnostic ledger content must not be reused as the new canonical evidence ledger without regeneration against the new accepted head.

---

## 10. Runtime scope remains unchanged

R3A-C1 grants no runtime authority.

It does not change or authorize changes to:

- workload identity semantics;
- OCI digest rules;
- repository grammar;
- entrypoint semantics;
- resource/network policy;
- self-contained confinement lineage;
- attestation-reference semantics;
- K2;
- approval;
- confinement enforcement;
- receipts;
- Done Gate;
- agent loop;
- OpenSandbox/Docker/Kubernetes execution;
- H4 completion;
- H6 readiness/authorization.

---

## 11. Authorization truth

```text
IF CANONICAL:

CURRENT #85 DIAGNOSTIC HEADS:
NOT ACCEPTED

REQUIRED NEXT ACTION:
RE-ESTABLISH H4-R3A IMPLEMENTATION FROM CORRECTED CANONICAL MAIN WITHOUT LEDGER

AUTHORIZED TEST CORRECTION:
REMOVE ONLY PERMANENT LEDGER-ABSENCE ASSERTION AND NOW-UNUSED SUPPORTING IMPORT

PRE-LEDGER LEDGER-ABSENCE PROOF:
EXTERNAL EXACT-HEAD / CHANGED-PATH EVIDENCE

LEDGER:
BLOCKED UNTIL NEW FRESH PRE-LEDGER PASS

RUNTIME SCOPE:
UNCHANGED FROM ORIGINAL H4-R3A AUTHORIZATION
```

Status:

```text
KDO_H4_R3A_C1_LEDGER_GATE_RECONCILIATION_READY_FOR_CANONICAL_REVIEW
```
