# Kodac KDO H4-R1 One-Shot Approval Evidence

Date: 2026-08-14

Status: EVIDENCE LEDGER — POST-LEDGER CERTIFICATION REQUIRED

This ledger records the accepted H4-R1 pre-ledger implementation evidence. It is deliberately non-self-certifying: the commit created by this file must independently pass fresh exact-head CI, review adjudication, scope verification, and expected-head merge verification.

## 1. Repository and canonical authorization chain

Repository:

`TheHalfMoon/Kodac`

Canonical implementation base for PR #52:

`b9b055a4cd21e486346ffbdf648793edd88282ae`

Authorization chain:

1. PR #51 / merge `fbac06934eaf55c173a70ddf24a42ecb2323c2b8` — original H4-R1 one-shot approval authorization.
2. PR #53 / merge `0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7` — legacy-test reconciliation.
3. PR #54 / merge `b9b055a4cd21e486346ffbdf648793edd88282ae` — `repo.apply_patch` abort-propagation supplemental authorization.

## 2. Bounded completion claim

Only after successful post-ledger certification, final review adjudication, expected-head merge, and post-merge verification may this slice claim:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

It MUST NOT claim:

- `H4_COMPLETE`;
- sandbox/confinement readiness;
- external executable one-shot approval readiness;
- atomic/transactional rollback after mutation begins;
- persistent or reusable approval;
- `allow-always`;
- Done Gate replacement;
- unrelated `PROVEN_READY`.

H4-R2 sandbox/confinement remains separate.

## 3. Bounded H4-R1 invariant

H4-R1 implements:

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of an exact bound intent that H4-R1 can prove`

Approval does not replace K2 policy, K2 execution, K2 execution receipts, or Done Gate authority.

## 4. Closed one-shot outcomes

Approval outcomes are exactly:

- `allowed-once`
- `rejected`
- `cancelled`
- `unavailable`

There is no approval cache, wildcard grant, persistent grant, capability-family permission, or remembered approval.

## 5. One-shot identity and replay resistance

Each approvable request binds:

- fixed H4-R1 version;
- deterministic structural request identity for the exact K2 intent;
- unique per-invocation request instance id;
- exact capability;
- exact canonical paths;
- exact K2 input digest.

A prior `allowed-once` cannot authorize a later structurally identical invocation. Concurrent identical approvable requests receive distinct request instances.

## 6. Durable approval evidence

H4-R1 records two approval evidence phases:

- `asked`
- `decided`

Callback invocation or in-memory observation is not durable proof.

`ApprovalEvidenceSink.commit()` must return a strict versioned durable acknowledgment after the sink represents the evidence as durably committed. The trusted host validates:

- exact acknowledgment version;
- exact `evidenceIdentity`;
- literal `durability: "durable"`;
- exact allowed fields.

Missing, malformed, mismatched, non-durable, or throwing acknowledgments fail closed.

This is a trusted-host durability contract; it does not claim cryptographic proof against a dishonest storage provider falsely attesting durability.

## 7. Evidence ordering

For an approvable K2 `ask`:

1. construct the exact immutable K2 intent;
2. evaluate K2 policy;
3. snapshot/validate immutable policy authority;
4. construct the one-shot approval request;
5. construct `asked` evidence;
6. durably commit and validate the asked acknowledgment;
7. only then consult `ApprovalService`;
8. validate/normalize the answer;
9. construct `decided` evidence;
10. durably commit and validate the decided acknowledgment;
11. only exact `allowed-once` may continue;
12. re-check the relevant pre-execution cancellation boundary;
13. enter the existing K2 side-effect body;
14. construct immutable K2 execution receipt evidence;
15. persist/observe that immutable receipt.

Asked-evidence persistence failure prevents service invocation and execution. Decided-evidence persistence failure prevents `allowed-once` from enabling execution.

## 8. Approvable-action boundary

H4-R1 enables one-shot approval only where exact-intent continuity can be proven without implementing H4-R2 confinement.

`repo.apply_patch` remains H4-R1 approvable because exact patch content, canonical affected paths, and K2 input digest are bound inside the trusted gateway.

External-process K2 policy `ask` is deliberately fail-closed in H4-R1.

## 9. External executable identity boundary

A path/name string passed to path-based `execFile` does not prove the same executable bytes will run after an approval wait. The executable at a path may be replaced, and a PATH-resolved executable name may resolve differently.

H4-R1 therefore does not implement a superficial executable hash/re-stat scheme and does not implement a sandbox launcher.

For external process execution when K2 policy returns `ask`, the gateway blocks before:

- approval evidence commit;
- approval service invocation;
- process launch.

The bounded blocked reason is:

`external executable identity requires H4-R2 confinement`

K2 `allow`/`deny` external-process behavior remains historical K2 behavior and is not widened by H4-R1.

Re-enabling external-process one-shot approval requires H4-R2 executable identity/confinement authority and proof.

## 10. Pending-approval cancellation

`repo.apply_patch` forwards `ToolContext.signal` into `ExecutionGateway.applyPatch`.

If cancellation occurs while `ApprovalService.decide()` is pending, the gateway normalizes the outcome to `cancelled` after the service returns, even when the late service answer says `allowed-once`.

The decided evidence records `cancelled`, the invocation remains blocked, no workspace mutation is resurrected, and no success receipt is emitted.

## 11. Post-approval / pre-mutation cancellation

A second boundary exists after exact `allowed-once` is durably evidenced but before patch mutation begins.

`applyPatch` performs a final signal recheck immediately after `authorize()` and immediately before entering `applyHunks()`.

If cancellation is already observable at that boundary, execution blocks and `applyHunks` is not entered.

H4-R1 deliberately does not claim transactionally cancellable rollback after mutation has already started. Atomic/confinement semantics belong to H4-R2.

## 12. Command input continuity on K2-allowed process paths

For external-process paths K2 independently returns `allow`, the gateway captures caller-owned mutable execution inputs before policy/launch continuity:

- command args -> private copied array;
- canonical paths -> independent copied/sorted array;
- allowed exit codes -> independent normalized array;
- effective environment -> independent canonical object.

The K2 input digest binds executable string, captured arguments, allowed exit codes, maximum output bytes, timeout, and captured environment. The same captured arguments/environment are used for launch.

This continuity does not make external-process `ask` approvable in H4-R1.

## 13. Immutable intent authority

`ExecutionIntent` becomes an immutable authority snapshot before observer and policy use.

The gateway copies and freezes:

- capability;
- a separately copied/frozen paths array;
- input digest.

`ExecutionObserver.onIntent` therefore cannot rewrite capability, path scope, or input identity.

The same immutable intent is supplied to `PolicyEngine.evaluate()` and retained through authorization and receipt construction.

## 14. Immutable policy authority

The raw object returned by `PolicyEngine.evaluate()` is not retained as execution authority.

Immediately after evaluation, the gateway:

1. reads decision and reason once;
2. validates decision is exactly `allow | ask | deny`;
3. validates reason is a string;
4. creates a new policy result snapshot;
5. freezes that snapshot;
6. only then exposes it to `ExecutionObserver.onPolicy` and authorization logic.

Therefore observer mutation or later mutation of the raw policy object cannot promote `ask`/`deny` to `allow` or rewrite trusted policy reason.

Observation hooks remain observers, not execution authorities.

## 15. Immutable K2 execution receipt authority

`ExecutionReceipt` remains K2 execution-outcome authority and is now constructed centrally as a defensive deep-immutable snapshot before `ExecutionObserver.onReceipt` receives it.

`createReceipt()` copies and freezes:

- top-level receipt object;
- paths array;
- policy object;
- optional approval binding;
- result object;
- affected-path object for patch success receipts;
- `added`, `modified`, and `deleted` arrays inside affected-path evidence.

Primitive receipt fields are copied by value.

Consequences:

- receipt observers cannot rewrite capability or input identity;
- receipt observers cannot rewrite path scope;
- receipt observers cannot rewrite K2 policy decision/reason;
- receipt observers cannot turn `blocked`/`failure` into `success`;
- receipt observers cannot rewrite approval binding;
- receipt observers cannot rewrite affected-path evidence;
- caller mutation of objects used to construct a receipt cannot mutate the receipt later.

An observer may still throw and cause the existing fail-unproven behavior; it cannot rewrite truth.

## 16. Approval binding in execution receipts

When one-shot approval actually enables an approvable action, the immutable K2 receipt may bind narrowly to:

- approval version;
- request identity;
- request instance id;
- decided evidence identity;
- exact `allowed-once` outcome.

Approval evidence is not execution-success evidence.

If a side effect occurred but K2 receipt persistence fails, the caller receives `ExecutionUnprovenError`; H4-R1 does not convert unproven execution into success.

## 17. Actual pre-ledger changed-path scope

Accepted pre-ledger PR #52 changes exactly these ten non-ledger paths:

1. `packages/kodac-runtime/src/evidence/receipt.ts`
2. `packages/kodac-runtime/src/execution/gateway.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/src/tools/apply-patch.ts`
5. `packages/kodac-runtime/src/trust/approval.ts`
6. `packages/kodac-runtime/test/gateway.test.ts`
7. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
8. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
9. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
10. `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`

This evidence ledger becomes the eleventh actual path:

11. `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md`

All eleven are inside the original plus supplemental H4-R1 authorization chain.

## 18. Historical invalidation — apply-patch signal propagation

Candidate:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

Invalidated because `repo.apply_patch` dropped `ToolContext.signal` before the gateway approval path.

NOT certification evidence.

## 19. Historical invalidation — first premature ledger

Ledger:

`6fc2fbb2c9a5572100a1d52e9d9c080a054dc60c`

Withdrawn by:

`3de7036b54e98fe16b1002a9a03ed4a2fccdd0a4`

NOT certification evidence.

## 20. Historical invalidation — durability semantics

Candidate:

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

and ledger-bearing successor:

`ede218be27249cc76d64727f93a65a85b96f2bc3`

were invalidated because callback/Promise success alone could be treated as durable approval evidence proof.

NOT certification evidence.

## 21. Historical invalidation — mutable command arguments

Ledger-bearing head:

`38e45e85b811d24277a5a3a68bf80b469530ab3f`

Invalidated because caller-owned command args could mutate during approval, leaving approval identity bound to old arguments while process launch consumed new arguments.

Ledger withdrawn by:

`9fd5545e0a0de2d2e8abe2a48c50d77c6289c39d`

NOT certification evidence.

## 22. Historical invalidation — post-approval cancellation boundary

Ledger-bearing head:

`b0457ff46b930d076b2fbc542a6fb8612190ffd7`

Invalidated because `applyPatch` did not recheck cancellation becoming observable after `authorize()` returned and before entering `applyHunks()`.

Ledger withdrawn by:

`d1f65dec4708405af4c3ff4a9d08cd6688d9e067`

NOT certification evidence.

## 23. Historical invalidation — executable identity

Ledger-bearing head:

`0006ec4d6de85848db950e0090ee7d32bba15fef`

Invalidated because binding only an executable string/path cannot prove the same executable bytes will run after approval.

Ledger withdrawn by:

`d4e966706bba7d7829fe8c7260b1e1bf4d1257e8`

The later pre-ledger head `87a3c52ea2bd7244595f641aba9f4c9a388ae77d` correctly deferred external executable approval to H4-R2 but was then invalidated by the mutable observer/policy authority finding.

NOT certification evidence.

## 24. Historical invalidation — mutable intent/policy authority

Pre-ledger head:

`87a3c52ea2bd7244595f641aba9f4c9a388ae77d`

Invalidated because observer hooks received mutable authority objects and the raw policy object could remain mutable after evaluation.

Correction head:

`e222d715a2813fe4e25b59c5faedf2038c88e452`

introduced immutable intent/path and detached immutable policy snapshots, but its later ledger successor was invalidated by mutable receipt evidence.

NOT final certification evidence.

## 25. Historical invalidation — mutable K2 receipt evidence

Ledger-bearing head:

`39e7dc3d36ed9ca85e9c1ac67b3bf868280c90fe`

passed its full post-ledger CI matrix but was invalidated before merge by manual exact-head review.

Finding:

- `createReceipt()` returned a mutable receipt object;
- nested paths, policy, approval, result, and affected arrays could remain mutable;
- `persistReceipt()` passed the same receipt reference to `ExecutionObserver.onReceipt` that the gateway subsequently returned or attached to an error;
- an observer could therefore rewrite K2 outcome evidence after execution, including blocked/failure/success status, capability/path binding, policy truth, approval binding, or affected paths.

The ledger was withdrawn by:

`804710b9fd791fe97e284111911f6d8001c603b9`

NOT certification evidence.

## 26. Accepted pre-ledger candidate

Accepted exact pre-ledger implementation head:

`e8a2a14131e32624f9804e85ac4d1047d0979a2f`

Correction commit subject:

`fix(kdo): freeze H4-R1 execution receipt evidence`

Correction delta from withdrawal head `804710b9...` is exactly:

- `packages/kodac-runtime/src/evidence/receipt.ts`
- `packages/kodac-runtime/test/gateway.test.ts`

No other path changed in that correction commit.

## 27. Receipt immutability regressions

Two new exact-head regressions prove the correction.

### 27.1 Receipt observer mutation resistance

`receipt observers cannot rewrite blocked execution evidence`

The test proves:

- receipt object is frozen before `onReceipt`;
- receipt paths array is frozen;
- receipt policy object is frozen;
- receipt result object is frozen;
- observer cannot rewrite capability;
- observer cannot rewrite path;
- observer cannot change policy decision to `allow`;
- observer cannot change blocked result to success;
- the `ExecutionBlockedError.receipt` still reports the original K2 truth;
- no mutation occurs.

### 27.2 Defensive-copy / nested deep-freeze proof

`execution receipts defensively copy and deep-freeze nested authority evidence`

The test creates a receipt from mutable caller-owned paths, policy, approval binding, and affected-path arrays, mutates every original after creation, and proves the receipt remains unchanged.

It also proves frozen state for receipt, paths, policy, approval, result, affected object, and all affected arrays.

## 28. Accepted pre-ledger exact-head CI

Exact head:

`e8a2a14131e32624f9804e85ac4d1047d0979a2f`

Required results:

- governance run `31818388718`: PASS
- K3-R4 run `31818388784`: PASS
- K3-R5 run `31818388713`: PASS
- K2 runtime run `31818388783`: PASS
- runtime change classifier `94825461569`: PASS
- macOS `94825491291`: typecheck/full tests/patch benchmark PASS
- Ubuntu `94825491299`: typecheck/full tests/patch benchmark PASS
- Windows `94825491305`: typecheck/full tests/patch benchmark PASS
- K2 final gate `94825686592`: PASS

Ubuntu exact suite summary:

- tests: `407`
- pass: `406`
- fail: `0`
- cancelled: `0`
- skipped: `1` existing platform qualification skip

Critical exact-head tests explicitly PASS, including:

- `receipt observers cannot rewrite blocked execution evidence`
- `execution receipts defensively copy and deep-freeze nested authority evidence`
- `execution observers cannot rewrite intent or policy authority`
- `external executable ask fails closed before approval service or process execution`
- replay/concurrency resistance on approvable apply-patch requests
- callback-only evidence rejection
- invalid asked/decided durable acknowledgment rejection
- pending-approval cancellation and late allowed-once non-resurrection
- post-approval/pre-mutation cancellation recheck
- K2-allowed command input/environment continuity
- K2 receipt persistence behavior

## 29. Accepted pre-ledger review adjudication

Unresolved inline review threads:

`0`

Manual exact-head correction review: PASS.

The correction was reviewed specifically for:

- no mutable alias from createReceipt inputs into receipt evidence;
- deep immutability of nested authority-bearing receipt fields;
- receipt observer inability to rewrite K2 truth;
- preservation of existing `ExecutionUnprovenError` behavior when receipt persistence/observation throws;
- preservation of immutable intent/policy authority;
- external-process `ask` remaining fail-closed;
- apply-patch one-shot authority and cancellation boundaries remaining unchanged;
- no H4-R2 sandbox/confinement implementation.

A fresh CodeRabbit run `33d0eba5-7956-406f-9d87-eb1957d3861c` started on the relevant receipt/gateway/test delta and remained pending at the evidence-capture decision without a new submitted finding. CodeRabbit is not a mandatory H4-R1 authorization gate.

An older CodeRabbit comment proposed atomic/in-flight patch cancellation after mutation starts. That proposal is outside the bounded H4-R1 claim and is not treated as a missing R1 guarantee. H4-R1 guarantees cancellation observed before mutation starts; H4-R2 owns stronger confinement/atomicity semantics.

## 30. Pre-ledger decision

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

This decision authorizes evidence capture only. It is not H4-R1 completion.

## 31. Ledger-only transition rule

This file must be the only changed path between accepted pre-ledger head:

`e8a2a14131e32624f9804e85ac4d1047d0979a2f`

and the final ledger-bearing head.

Any additional production, test, config, or workflow path change invalidates this transition and requires a new pre-ledger certification.

## 32. Required post-ledger gates

The ledger-bearing head must independently pass fresh exact-head:

- governance;
- K3-R4;
- K3-R5;
- K2 runtime change classifier;
- Ubuntu typecheck/full tests/benchmark;
- macOS typecheck/full tests/benchmark;
- Windows typecheck/full tests/benchmark;
- K2 final runtime gate;
- exact-head review adjudication;
- zero unresolved review threads;
- exact changed-path verification;
- expected-head merge gate.

Pre-ledger results do not substitute for post-ledger results.

## 33. Non-self-certification rule

This ledger intentionally does not record its own future commit SHA or future post-ledger PASS state.

Editing the ledger to record those future results would create another SHA and make prior certification stale. Post-ledger certification therefore lives in immutable GitHub exact-head checks, review state, PR metadata, expected-head merge evidence, and post-merge canonical-main verification.

## 34. Final merge gate

Before merge verify:

- PR #52 is OPEN and Ready;
- Draft = false;
- merged = false;
- auto-merge is not used;
- canonical `main` is re-read and remains the expected base, or any base movement is safely reconciled and recertified;
- head equals the reviewed ledger-bearing SHA exactly;
- all required checks PASS on that exact head;
- unresolved review threads = 0;
- no valid outstanding in-scope review finding remains;
- actual changed paths remain inside the full H4-R1 authorization chain;
- this ledger is the only post-pre-ledger path delta.

Merge must use an expected-head guard.

## 35. Bounded post-merge claim

Only after expected-head merge and post-merge canonical verification may H4-R1 report:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

It still MUST NOT report `H4_COMPLETE`.

## 36. Next slice

H4-R2 is provider-neutral sandbox/confinement.

H4-R2 owns the executable identity/confinement problem and stronger atomic/in-flight mutation cancellation semantics that H4-R1 deliberately leaves fail-closed or out of claim.

H4-R2 requires its own authorization and evidence sequence. Nothing in this H4-R1 ledger grants H4-R2 production authority.
