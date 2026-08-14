# Kodac KDO H4-R1 One-Shot Approval Evidence

Date: 2026-08-14

Status: EVIDENCE LEDGER — POST-LEDGER CERTIFICATION REQUIRED

This ledger records the accepted H4-R1 pre-ledger implementation evidence. It is intentionally non-self-certifying: the commit created by adding this file must independently pass fresh exact-head CI, review adjudication, changed-path verification, and expected-head merge verification.

## 1. Repository and authorization chain

Repository:

`TheHalfMoon/Kodac`

Canonical implementation base for PR #52:

`b9b055a4cd21e486346ffbdf648793edd88282ae`

Authorization chain:

1. PR #51 / merge `fbac06934eaf55c173a70ddf24a42ecb2323c2b8` — original H4-R1 authorization.
2. PR #53 / merge `0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7` — legacy-test reconciliation.
3. PR #54 / merge `b9b055a4cd21e486346ffbdf648793edd88282ae` — `repo.apply_patch` abort-propagation supplemental authorization.

## 2. Bounded H4-R1 claim

Only after successful post-ledger certification and expected-head merge may this slice claim:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

It MUST NOT claim:

- `H4_COMPLETE`;
- sandbox/confinement readiness;
- external executable one-shot approval readiness;
- persistent/reusable approval;
- `allow-always`;
- Done Gate replacement;
- unrelated `PROVEN_READY`.

H4-R2 sandbox/confinement remains a separate authorization/evidence sequence.

## 3. Bounded invariant

H4-R1 implements:

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of an exact bound intent that H4-R1 can prove`

Approval does not replace K2 policy, K2 execution, K2 execution receipts, or Done Gate authority.

## 4. Closed approval outcomes

Approval outcomes are exactly:

- `allowed-once`
- `rejected`
- `cancelled`
- `unavailable`

There is no approval cache, allow-always, wildcard grant, directory-wide grant, capability-family grant, or persistent permission.

## 5. One-shot identity and replay resistance

Each approval request binds:

- fixed H4-R1 version;
- deterministic structural request identity for the exact K2 intent;
- unique per-invocation request instance id;
- exact capability;
- exact canonical paths;
- exact K2 input digest.

A prior `allowed-once` cannot authorize a later structurally identical invocation. Concurrent identical approvable requests receive different request instances.

## 6. Durable approval evidence

H4-R1 records two evidence phases:

- `asked`
- `decided`

Callback invocation or in-memory observation is not durable proof.

`ApprovalEvidenceSink.commit()` must return a strict versioned durable acknowledgment after the sink represents the evidence as durably committed. The trusted host validates:

- exact acknowledgment version;
- exact `evidenceIdentity`;
- literal `durability: "durable"`;
- exact allowed fields.

Missing, malformed, mismatched, non-durable, or throwing acknowledgments fail closed.

This is a trusted-host durability contract. It does not claim cryptographic proof against a dishonest storage provider falsely attesting durability.

## 7. Evidence ordering

For an approvable K2 `ask`:

1. construct the immutable exact K2 intent;
2. evaluate K2 policy;
3. construct the one-shot approval request;
4. construct `asked` evidence;
5. durably commit and validate the asked acknowledgment;
6. only then consult `ApprovalService`;
7. validate/normalize the answer;
8. construct `decided` evidence;
9. durably commit and validate the decided acknowledgment;
10. only exact `allowed-once` may continue;
11. re-check relevant cancellation boundary;
12. enter the existing K2 side-effect body;
13. persist the normal K2 execution receipt.

Asked-evidence persistence failure prevents service invocation and execution. Decided-evidence persistence failure prevents `allowed-once` from enabling execution.

## 8. Approachable action boundary

H4-R1 one-shot approval is enabled only where exact-intent continuity can be proven without implementing H4-R2 confinement.

`repo.apply_patch` remains H4-R1 approvable because the exact patch content, canonical affected paths, and K2 input digest are bound inside the trusted gateway.

External-process K2 policy `ask` is deliberately fail-closed in H4-R1.

## 9. External executable identity boundary

A path/name string passed to path-based `execFile` is not sufficient proof that the same executable bytes will run after an approval wait. The executable at a path can be replaced, and a PATH-resolved executable name can resolve differently.

H4-R1 therefore does NOT attempt a superficial executable hash/re-stat solution and does NOT implement a sandbox launcher.

For external process execution when K2 policy returns `ask`, the gateway blocks before:

- approval evidence commit;
- `ApprovalService` invocation;
- process launch.

The blocked reason is:

`external executable identity requires H4-R2 confinement`

K2 `allow` and `deny` external-process behavior remains historical K2 behavior and is not widened by H4-R1.

Re-enabling external-process one-shot approval requires H4-R2 executable identity/confinement authorization and proof.

## 10. Pending-approval cancellation

`repo.apply_patch` forwards `ToolContext.signal` into `ExecutionGateway.applyPatch`.

If cancellation occurs while `ApprovalService.decide()` is pending, the gateway normalizes the outcome to `cancelled` after the service returns, even if the late service result says `allowed-once`.

The decided evidence records `cancelled`; the invocation remains blocked; no workspace mutation or success receipt can be resurrected by the late answer.

## 11. Post-approval / pre-mutation cancellation

A second cancellation boundary exists after exact `allowed-once` is durably evidenced but before patch execution begins.

`applyPatch` performs a final signal recheck immediately after `authorize()` and immediately before entering `applyHunks()`.

If cancellation is already observable at that boundary, execution blocks and `applyHunks` is not entered.

H4-R1 does not claim transactionally cancellable rollback after mutation has already begun.

## 12. Command input continuity on K2-allowed paths

For external process paths that K2 independently returns `allow`, the gateway captures caller-owned mutable execution inputs before policy/launch continuity:

- command args -> private array copy;
- canonical paths -> independent copied/sorted array;
- allowed exit codes -> independent normalized array;
- effective environment -> independent canonical object.

The K2 input digest binds executable string, captured args, allowed exit codes, max output bytes, timeout, and captured environment. The same captured args/environment are used for launch.

This continuity does not make external-process `ask` approvable in H4-R1.

## 13. Immutable intent authority

`ExecutionIntent` is converted into an immutable authority snapshot before observer and policy use.

The snapshot contains:

- capability;
- separately copied and frozen paths array;
- input digest.

`ExecutionObserver.onIntent` therefore cannot rewrite capability, paths, or input identity to gain execution authority.

The same immutable intent is supplied to `PolicyEngine.evaluate()` and retained through approval/receipt processing.

## 14. Immutable policy authority

The raw object returned by `PolicyEngine.evaluate()` is not retained as authority.

Immediately after evaluation, the gateway:

1. reads `decision` and `reason` once;
2. validates decision is exactly `allow | ask | deny`;
3. validates reason is a string;
4. constructs a new policy result object;
5. freezes that snapshot;
6. only then invokes `ExecutionObserver.onPolicy` and authorization.

Consequently:

- observer mutation cannot promote `ask` or `deny` to `allow`;
- observer mutation cannot rewrite trusted reason;
- later mutation of the original raw policy object cannot change gateway authority or receipt policy truth.

Observation hooks remain observers, not execution authorities.

## 15. K2 execution receipt relationship

`ExecutionReceipt` remains K2 execution-outcome authority.

When one-shot approval actually enabled an approvable action, the receipt may bind narrowly to:

- approval version;
- request identity;
- request instance id;
- decided evidence identity;
- exact `allowed-once` outcome.

Approval evidence is not execution-success evidence.

If a side effect occurred but K2 receipt persistence fails, the caller receives `ExecutionUnprovenError`; H4-R1 does not convert unproven execution into success.

## 16. Actual changed-path scope before ledger

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

All eleven are inside the original + supplemental H4-R1 authorization chain.

## 17. Historical invalidation — apply-patch signal propagation

Candidate:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

Invalidated because `repo.apply_patch` dropped `ToolContext.signal` before the gateway approval path. Pending-approval cancellation could be lost.

NOT certification evidence.

## 18. Historical invalidation — premature ledger

Ledger:

`6fc2fbb2c9a5572100a1d52e9d9c080a054dc60c`

Withdrawn by:

`3de7036b54e98fe16b1002a9a03ed4a2fccdd0a4`

NOT certification evidence.

## 19. Historical invalidation — durability semantics

Candidate:

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

and ledger-bearing successor:

`ede218be27249cc76d64727f93a65a85b96f2bc3`

were invalidated because callback/Promise success alone could be treated as durable approval evidence proof.

NOT certification evidence.

## 20. Historical invalidation — mutable command args

Ledger-bearing head:

`38e45e85b811d24277a5a3a68bf80b469530ab3f`

Invalidated because caller-owned command args could mutate during approval, leaving the approval identity bound to old arguments while process launch consumed new arguments.

Ledger withdrawn by:

`9fd5545e0a0de2d2e8abe2a48c50d77c6289c39d`

NOT certification evidence.

## 21. Historical invalidation — post-approval cancellation window

Ledger-bearing head:

`b0457ff46b930d076b2fbc542a6fb8612190ffd7`

Invalidated because `applyPatch` did not recheck a cancellation becoming observable after `authorize()` returned and before entering `applyHunks()`.

Ledger withdrawn by:

`d1f65dec4708405af4c3ff4a9d08cd6688d9e067`

NOT certification evidence.

## 22. Historical invalidation — executable identity

Ledger-bearing head:

`0006ec4d6de85848db950e0090ee7d32bba15fef`

Invalidated because binding only an executable string/path cannot prove the same executable bytes will run after approval. Path replacement and PATH re-resolution remain possible without confinement.

Ledger withdrawn by:

`d4e966706bba7d7829fe8c7260b1e1bf4d1257e8`

Correction head:

`87a3c52ea2bd7244595f641aba9f4c9a388ae77d`

narrowed external-process `ask` to fail closed, but was later invalidated pre-ledger by the mutable intent/policy authority finding below.

NOT certification evidence.

## 23. Historical invalidation — mutable observer/policy authority

Pre-ledger head:

`87a3c52ea2bd7244595f641aba9f4c9a388ae77d`

passed its complete exact-head CI matrix but was invalidated before evidence capture by manual exact-head review.

Finding:

- `ExecutionObserver.onIntent` received the same mutable `ExecutionIntent` object later used by policy/approval;
- `ExecutionObserver.onPolicy` received the same mutable `PolicyResult` later used by authorization/receipt logic;
- a raw policy object returned by `PolicyEngine` could also be mutated after evaluation.

This meant an observation/evidence hook could theoretically rewrite capability/paths or promote `ask` to `allow`, becoming execution authority.

NOT certification evidence.

## 24. Accepted pre-ledger candidate

Accepted exact pre-ledger implementation head:

`e222d715a2813fe4e25b59c5faedf2038c88e452`

Correction commit subject:

`fix(kdo): freeze H4-R1 intent and policy authority`

Correction delta from `87a3c52...` is exactly:

- `packages/kodac-runtime/src/execution/gateway.ts` — `+25/-6`;
- `packages/kodac-runtime/test/gateway.test.ts` — `+54/-3`.

No other path changed in that correction commit.

## 25. New immutable-authority regression

Regression:

`execution observers cannot rewrite intent or policy authority`

The test proves:

- intent object is frozen;
- intent paths array is separately frozen;
- observer cannot replace capability;
- observer cannot replace a path;
- evaluated policy snapshot is frozen;
- observer cannot replace policy decision;
- external raw policy object is deliberately mutated after snapshot creation;
- gateway still retains the original `ask` decision/reason;
- blocked receipt remains bound to `repo.apply_patch` and `proof.txt`;
- no mutation occurs.

## 26. Accepted pre-ledger exact-head CI

Exact head:

`e222d715a2813fe4e25b59c5faedf2038c88e452`

Required results:

- governance run `31817211046`: PASS
- K3-R4 run `31817211004`: PASS
- K3-R5 run `31817211105`: PASS
- K2 runtime run `31817211026`: PASS
- runtime change classifier `94821663011`: PASS
- macOS `94821695667`: typecheck/full tests/patch benchmark PASS
- Ubuntu `94821695753`: typecheck/full tests/patch benchmark PASS
- Windows `94821695745`: typecheck/full tests/patch benchmark PASS
- K2 final gate `94822770468`: PASS

Ubuntu exact suite summary:

- tests: `405`
- pass: `404`
- fail: `0`
- cancelled: `0`
- skipped: `1` existing platform qualification skip

Critical exact-head tests explicitly PASS, including:

- `execution observers cannot rewrite intent or policy authority`
- `external executable ask fails closed before approval service or process execution`
- `concurrent identical asks receive distinct one-shot request instances`
- callback-only evidence rejection
- invalid asked/decided durable acknowledgment rejection
- pending-approval cancellation and late allowed-once non-resurrection
- post-approval/pre-mutation cancellation recheck
- generic command K2 input/environment/bounds continuity on allow paths
- mutable command argument snapshot continuity on allow paths
- K2 receipt persistence semantics

## 27. Accepted pre-ledger review adjudication

Unresolved inline review threads:

`0`

Manual exact-head correction review: PASS.

The correction was reviewed specifically for:

- immutable intent/paths before observer and policy use;
- detached validated immutable policy snapshot before observer/authorization;
- raw-policy mutation resistance;
- no new H4-R2 sandbox/confinement implementation;
- external-process `ask` still fail-closed;
- apply-patch one-shot authority unchanged;
- no parallel execution authority.

A fresh CodeRabbit review was requested after resuming automatic reviews. The external service reported its per-developer review rate limit and did not start the fresh review. This rate-limit result is NOT represented as automated approval and CodeRabbit is not a mandatory H4-R1 authorization gate.

Pre-ledger acceptance is therefore grounded in required exact-head CI, deterministic regressions, zero unresolved threads, and manual exact-head adjudication.

## 28. Pre-ledger decision

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

This decision authorizes evidence capture only. It is not H4-R1 completion.

## 29. Ledger-only transition rule

This file must be the only changed path between accepted pre-ledger head:

`e222d715a2813fe4e25b59c5faedf2038c88e452`

and the final ledger-bearing head.

Any additional production/test/config/workflow path change invalidates this transition and requires new pre-ledger certification.

## 30. Required post-ledger gates

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

## 31. Non-self-certification rule

This ledger intentionally does not record its own future commit SHA or its future post-ledger PASS state.

Editing the ledger to write those future results would create another SHA and make the prior certification stale. Post-ledger certification therefore lives in immutable GitHub exact-head checks, review state, PR metadata, and expected-head merge evidence.

## 32. Final merge gate

Before merge verify:

- PR #52 is OPEN and Ready;
- Draft = false;
- merged = false;
- auto-merge is not used;
- canonical `main` is re-read and remains the expected base, or base movement is safely reconciled and recertified;
- head equals the reviewed ledger-bearing SHA exactly;
- all required checks PASS on that exact head;
- unresolved review threads = 0;
- no valid outstanding review finding remains;
- actual changed paths remain inside the complete H4-R1 authorization chain;
- this ledger is the only post-pre-ledger path delta.

Merge must use an expected-head guard.

## 33. Bounded post-merge claim

Only after expected-head merge and post-merge verification may H4-R1 report:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

It still MUST NOT report `H4_COMPLETE`.

## 34. Next slice

H4-R2 is provider-neutral sandbox/confinement, including the executable identity/confinement problem that H4-R1 deliberately leaves fail-closed.

H4-R2 requires a separate authorization and evidence sequence. Nothing in this H4-R1 ledger grants H4-R2 production authority.
