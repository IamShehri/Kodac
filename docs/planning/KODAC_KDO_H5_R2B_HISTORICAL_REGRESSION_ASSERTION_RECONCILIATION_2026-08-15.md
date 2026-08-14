# KDO-H5-R2B — Historical Regression Assertion Reconciliation Authorization

Date: 2026-08-15
Status: AUTHORIZATION CORRECTION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R2B-C1

NAME:
HISTORICAL REGRESSION ASSERTION RECONCILIATION

CANONICAL BASE:
6c75a902db04d79d4112db41e8168877d4b56adf

R2B AUTHORIZATION:
docs/planning/KODAC_KDO_H5_R2B_H2_REPEAT_CALL_ADVISORY_AUTHORIZATION_2026-08-15.md

PURPOSE:
RECONCILE ONLY HISTORICAL TEST ASSERTIONS THAT IMPOSSIBLY PIN R2B-AUTHORIZED PRODUCTION SURFACES TO PRE-R2B BLOBS

RUNTIME AUTHORITY:
NO NEW RUNTIME AUTHORITY

IMPLEMENTATION SEMANTICS:
NO EXPANSION

LEDGER:
STILL BLOCKED UNTIL A FRESH PRE-LEDGER PASS
```

The canonical R2B authorization permits intentional changes to:

```text
packages/kodac-runtime/src/agent/repeat-call-signal.ts
packages/kodac-runtime/src/session/model-visible-history.ts
packages/kodac-runtime/src/protocol/event.ts
packages/kodac-runtime/src/agent/loop.ts
```

and simultaneously requires the full legacy/runtime regression suite to pass.

The first R2B implementation run exposed a contradiction in that authorization: five older historical tests still assert that one or more of those newly authorized production surfaces must remain byte-identical to their pre-R2B blobs, or that the H2 history projector may import only its pre-R2B dependency set.

Those assertions were valid for the phase that created them. They become impossible once a later canonical phase explicitly supersedes the relevant byte pin or import boundary.

This correction does **not** authorize deleting historical tests, skipping them, weakening unrelated protections, changing historical evidence documents, or treating a failed assertion as irrelevant. It authorizes only a semantic reconciliation of the superseded assertions so each historical test continues to protect the security/authority property it originally existed to prove.

---

## 2. Failure evidence that triggered this correction

R2B implementation PR #67 first pre-ledger candidate:

```text
head:
8c04d3b404cc25f8d086ad547aaff3001d75ca76

TypeScript typecheck:
PASS on macOS and Ubuntu before Test failure

Governance provenance / legacy jobs:
PASS

Unresolved review threads at initial inspection:
0
```

The full runtime Test step exposed six focused failures.

Five are historical-protection conflicts:

```text
packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts
packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
```

The sixth is inside the already-authorized new R2B focused test and is an ordinary test assertion correction; it does not require this authorization extension.

The five historical failures are not evidence that R2B may ignore the regression suite. They are evidence that the later phase must explicitly transfer protection ownership for the surfaces it intentionally changes.

---

## 3. Why this is a governance correction, not a test bypass

A historical byte pin means:

```text
THIS EARLIER PHASE DID NOT AUTHORIZE THIS SURFACE TO CHANGE
```

It cannot permanently mean:

```text
THIS SURFACE CAN NEVER CHANGE IN ANY LATER CANONICALLY AUTHORIZED PHASE
```

Otherwise every future authorized evolution of `agent/loop.ts`, H2 projection, event vocabulary, or the R2A module would make `full runtime tests PASS` structurally impossible.

The correct later-phase rule is:

```text
if a later canonical authorization explicitly supersedes an earlier byte pin:
  update only that historical assertion
  preserve the historical test's underlying security/authority invariant
  keep every non-superseded pin exact
  bind the new intentional drift in the later phase's focused evidence
```

R2B-C1 establishes that rule only for the exact conflicts observed in PR #67.

---

## 4. Additional authorized test paths

R2B-C1 extends the canonical R2B pre-ledger implementation allowlist by exactly these five historical test paths:

```text
8.  packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
9.  packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts
10. packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts
11. packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
12. packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
```

The original R2B paths 1-7 remain as authorized by the canonical R2B authorization.

Path #7 remains the evidence ledger and remains blocked until a fresh pre-ledger PASS under this corrected authorization.

No production path is added by R2B-C1.

No other test path is authorized by R2B-C1.

---

## 5. Exact reconciliation rule — H2-R2 historical test

Path:

```text
packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
```

Current historical property:

```text
H2 projector source has no new ambient execution or persistence authority
```

The old dependency assertion permits only:

```text
../model/provider.ts
../protocol/event.ts
./model-visible-request.ts
node:crypto
```

R2B intentionally requires H2 to validate the already-proven pure R2A serialized signal and therefore adds exactly:

```text
../agent/repeat-call-signal.ts
```

Authorized correction:

- add exactly `../agent/repeat-call-signal.ts` to the expected local import set;
- preserve all existing bans on filesystem, child-process, network, `fetch`, `ExecutionGateway`, `RuntimeOrchestrator`, and `DoneGate` authority;
- do not loosen the generic H2 source vocabulary tests;
- do not loosen fail-closed unknown `model.history.*` event behavior;
- do not change any unrelated H2-R2 test.

The R2A module itself remains required to import only `node:crypto` and have no execution/persistence authority.

---

## 6. Exact reconciliation rule — H4-R2B historical test

Path:

```text
packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts
```

The historical H4-R2B test pins `agent/loop.ts` to the pre-H5 blob because H4-R2B itself had no authority to modify the agent loop.

R2B now explicitly authorizes `agent/loop.ts` to change for H2 repeat-advisory integration.

Authorized correction:

- remove only the obsolete `agent/loop.ts` byte-equality assertion from the H4-R2B protected-blob set;
- replace it with a property assertion that the current agent loop does not import or invoke H4 Landlock/confinement runtime authority such as:
  - `confinement-linux-landlock`;
  - `confinement-runtime`;
  - `runConfinedReadOnlyCommand`;
  - direct native launcher execution;
- preserve every other H4-R2B authority-surface blob pin and Landlock behavioral assertion exactly.

This keeps H4-R2B's actual security boundary protected while allowing a later unrelated H5 loop integration.

---

## 7. Exact reconciliation rule — H4-R2C historical test

Path:

```text
packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts
```

The historical H4-R2C test likewise treats the then-current agent loop as an unrelated protected surface.

Authorized correction:

- remove only the obsolete pre-R2B `agent/loop.ts` byte pin;
- replace it with a negative-coupling assertion proving the R2B loop does not acquire or bypass H4-R2C confinement authority;
- keep all gateway, receipt, confinement, launcher, durable-evidence, policy, approval, package/script, and security-behavior assertions unchanged except where already superseded by a previously canonical later H4 phase;
- do not weaken the Linux functional proof.

---

## 8. Exact reconciliation rule — H5-R1A historical test

Path:

```text
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
```

H5-R1A proved that its pruning primitive remained inert and was not integrated into the loop/H2 path.

R2B does **not** integrate H5-R1A pruning. It intentionally modifies the loop/H2/event surfaces for a different R2A advisory feature.

Authorized correction:

- preserve the existing assertions that `agent/loop.ts` does **not** import `tool-result-pruning` and does **not** call `pruneModelVisibleToolResults`;
- remove only the obsolete byte pins for R2B-authorized surfaces:
  - `agent/loop.ts`;
  - `session/model-visible-history.ts`;
  - `protocol/event.ts`;
- preserve the byte pin for `agent/tool-result-pruning.ts` and every non-superseded authority surface;
- optionally strengthen the historical property by asserting `model-visible-history.ts` also does not import/call the H5-R1A pruning primitive;
- keep donor attribution assertions unchanged.

Therefore R2B cannot use this correction to silently activate H5-R1A pruning.

---

## 9. Exact reconciliation rule — H5-R2A historical test

Path:

```text
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
```

H5-R2A originally proved the repeat signal primitive was pure and not loop-integrated **at R2A completion time**.

R2B's explicit purpose is to supersede only that non-integration boundary while preserving the R2A primitive's deterministic identity and no-authority contract.

Authorized correction:

- preserve all fixed R2A policy/input/call/state/signal identity vectors;
- preserve all strict JSON/canonicalization, hostile-input, bound, reset, threshold, saturation, immutability, and donor-provenance tests;
- preserve the production-source import assertion that `repeat-call-signal.ts` imports only `node:crypto`;
- preserve all bans on filesystem/process/network/session/model/tool-execution authority inside the R2A module;
- remove only the historical assertions that `agent/loop.ts` must not import/use `repeat-call-signal` or `advanceRepeatCallSignal`;
- remove only the obsolete byte pins for R2B-authorized surfaces:
  - `agent/loop.ts`;
  - `session/model-visible-history.ts`;
  - `protocol/event.ts`;
- keep all non-superseded protected blobs exact;
- add or rely on the R2B focused proof to establish the narrow authorized loop/H2 integration.

R2B-C1 does **not** authorize changing an R2A fixed identity vector merely to make a test pass.

---

## 10. New R2B focused test correction

The already-authorized path:

```text
packages/kodac-runtime/test/kdo-h5-r2b-repeat-call-advisory-history.test.ts
```

may receive ordinary correctness fixes discovered by the first run.

In particular, privacy assertions must use a unique secret/tool-input marker rather than the English word `same`, because the fixed canonical advisory text itself legitimately contains the phrase `the same tool call`.

The corrected focused test must prove that a unique raw tool-input value does not occur in the advisory message or record-derived model-visible content.

This path was already authorized; this section clarifies the required assertion quality rather than adding authority.

---

## 11. Forbidden reconciliation techniques

R2B-C1 forbids:

- deleting any of the five historical test files;
- skipping, `.only`, `.todo`, unconditional platform bypass, or CI-environment bypass;
- changing historical evidence documents to pretend old blobs were different;
- replacing exact non-superseded blob pins with broad existence assertions;
- weakening K2/Landlock/approval/confinement/Done Gate tests;
- weakening R2A fixed identity vectors;
- altering H5-R1A pruning semantics;
- adding wildcard allowlists for future production drift;
- changing runtime code solely to satisfy an obsolete historical blob hash;
- mutating generated CI results;
- treating this correction as H5-R3/H6 authority.

---

## 12. Corrected R2B pre-ledger changed-path rule

After this correction becomes canonical, the R2B pre-ledger candidate may change only:

```text
1.  packages/kodac-runtime/src/agent/repeat-call-signal.ts
2.  packages/kodac-runtime/src/session/model-visible-history.ts
3.  packages/kodac-runtime/src/protocol/event.ts
4.  packages/kodac-runtime/src/agent/loop.ts
5.  packages/kodac-runtime/test/kdo-h5-r2b-repeat-call-advisory-history.test.ts
6.  packages/kodac-runtime/test/agent-loop.test.ts
8.  packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
9.  packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts
10. packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts
11. packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
12. packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
```

The intentionally omitted #7 remains:

```text
docs/planning/KODAC_KDO_H5_R2B_H2_REPEAT_CALL_ADVISORY_EVIDENCE_2026-08-15.md
```

and remains forbidden until fresh pre-ledger PASS.

A candidate does not need to modify every authorized path.

---

## 13. Fresh pre-ledger gate after correction

The failed `8c04d3b...` run is diagnostic evidence only and cannot become pre-ledger acceptance.

After R2B-C1 becomes canonical, the implementation candidate must be regenerated or rebased from the corrected canonical main and independently satisfy:

```text
changed paths ⊆ corrected authorized implementation/test paths
ledger absent
all historical-test edits conform exactly to sections 5-10
all non-superseded protected blobs exact
R2A fixed identity vectors exact
R2A production no-authority contract exact
H5-R1A remains non-integrated
H4 confinement/K2 authority remains non-coupled to agent loop
TypeScript typecheck PASS
focused R2B tests PASS
full runtime tests PASS
runtime-change-classifier PASS
K2 runtime gate PASS
governance/provenance/legacy tests PASS
K3-R4 PASS
K3-R5 PASS
review findings adjudicated
unresolved review threads = 0
manual exact-head H2/security/authority/historical-test review PASS
```

Only then may the R2B evidence ledger be added.

---

## 14. Evidence ledger delta

When eventually authorized after fresh pre-ledger PASS, the R2B evidence ledger must additionally bind:

- this R2B-C1 reconciliation path/blob/merge identity;
- the five historical test blobs before and after reconciliation;
- the exact superseded assertions removed;
- the exact replacement property assertions added;
- proof that all non-superseded pins remain exact;
- the failed first candidate `8c04d3b404cc25f8d086ad547aaff3001d75ca76` as diagnostic history, not acceptance;
- the new accepted pre-ledger exact head/tree.

---

## 15. Non-claims

R2B-C1 does **not** claim or authorize:

- any new production feature beyond canonical H5-R2B;
- a different advisory message;
- a different threshold;
- denied/failed attempt counting;
- hard duplicate/cycle guard changes;
- K2 policy/approval/confinement changes;
- H5-R1A pruning activation;
- H5-R3 guarded tool pipeline;
- Agentica function-selection integration;
- DeerFlow subagents/memory/sandbox integration;
- LLM Space trace/evaluation integration;
- delegate-skills fleet/delegation integration;
- H5 completion;
- H6 readiness;
- `PROVEN_READY`.

---

## 16. Authorization truth

```text
IF CANONICAL:

R2B IMPLEMENTATION:
MAY CONTINUE ONLY UNDER THE ORIGINAL AUTHORIZATION + THIS CORRECTION

HISTORICAL TEST UPDATES:
AUTHORIZED ONLY FOR THE FIVE ENUMERATED PATHS AND THE EXACT SUPERSEDED ASSERTIONS

LEDGER:
BLOCKED UNTIL FRESH PRE-LEDGER PASS

FAILED FIRST CANDIDATE 8c04d3b...:
DIAGNOSTIC ONLY / NOT ACCEPTED

RUNTIME SCOPE:
UNCHANGED FROM H5-R2B
```

Status:

```text
KDO_H5_R2B_C1_REGRESSION_RECONCILIATION_READY_FOR_CANONICAL_REVIEW
```
