# Kodac KDO H4-R1 One-Shot Approval Evidence

Date: 2026-08-14

Status: EVIDENCE LEDGER — POST-LEDGER CERTIFICATION REQUIRED

This ledger records the accepted H4-R1 pre-ledger implementation evidence. It is intentionally non-self-certifying: the ledger-bearing commit created by this file must independently pass fresh exact-head CI, review adjudication, scope verification, and an expected-head merge gate.

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

Only after successful post-ledger certification and expected-head merge may this slice claim:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

It MUST NOT claim `H4_COMPLETE`.

H4-R2 sandbox/confinement remains separate.

## 3. H4-R1 invariant

The bounded invariant is:

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of the exact bound intent`

Approval does not replace K2 policy, K2 execution, K2 receipts, or Done Gate authority.

## 4. Closed one-shot outcomes

Authorized outcomes are exactly:

- `allowed-once`
- `rejected`
- `cancelled`
- `unavailable`

There is no allow-always, remembered permission, wildcard grant, persistent grant, directory-wide grant, capability-family grant, or approval cache.

## 5. Policy composition

The implementation preserves this sequence:

1. construct exact `ExecutionIntent`;
2. expose the intent through existing K2 evidence hooks;
3. evaluate K2 policy;
4. `deny` blocks without consulting approval;
5. `allow` executes without approval;
6. only `ask` enters H4-R1 approval;
7. only exact `allowed-once` may authorize this invocation;
8. all other outcomes fail closed;
9. side effects remain in `ExecutionGateway`;
10. K2 execution receipts remain execution-outcome authority.

Approval cannot convert a K2 `deny` into executable authority.

## 6. One-shot identity and replay resistance

Each approval request binds:

- fixed H4-R1 version;
- deterministic structural `requestIdentity` for the exact intent;
- unique `requestInstanceId` for the gateway invocation;
- exact capability;
- exact canonical paths;
- exact K2 input digest.

A prior `allowed-once` cannot authorize a later structurally identical invocation. Concurrent identical asks receive distinct request instances.

## 7. Durable approval evidence contract

H4-R1 records two evidence phases:

- `asked`
- `decided`

Callback invocation or in-memory observation is not durable proof.

`ApprovalEvidenceSink.commit()` must return a strict, versioned durable-commit acknowledgment after the sink represents the evidence as durably committed.

The trusted host validates:

- exact commit-contract version;
- exact `evidenceIdentity`;
- literal `durability: "durable"`;
- exact allowed fields only.

Missing, malformed, mismatched, non-durable, or throwing acknowledgments fail closed.

This contract does not claim cryptographic proof against a dishonest storage provider falsely attesting durability.

## 8. Evidence ordering

For policy `ask`:

1. create the exact approval request;
2. create `asked` evidence;
3. commit and validate the asked durable acknowledgment;
4. only then consult `ApprovalService`;
5. normalize and validate the decision;
6. create `decided` evidence;
7. commit and validate the decided durable acknowledgment;
8. only exact `allowed-once` may proceed;
9. re-check cancellation at the relevant pre-execution boundary;
10. enter the existing execution body;
11. persist the normal K2 execution receipt.

Asked-evidence persistence failure prevents service invocation and execution. Decided-evidence persistence failure prevents an `allowed-once` answer from enabling execution.

## 9. Pending-approval cancellation

`repo.apply_patch` forwards `ToolContext.signal` into `ExecutionGateway.applyPatch`.

If cancellation occurs while `ApprovalService.decide()` is pending, the gateway normalizes the result to `cancelled` after the service returns, even if the late service result says `allowed-once`.

The decided evidence records `cancelled`, the invocation remains blocked, the workspace is not mutated, and no success receipt is produced.

## 10. Post-approval / pre-mutation cancellation boundary

A separate race exists after a valid `allowed-once` decision has been durably evidenced but before patch execution begins.

The accepted implementation therefore performs a final signal recheck immediately after `await authorize(...)` and immediately before entering `applyHunks(...)`.

If the signal is already aborted at that boundary:

- execution blocks;
- `applyHunks` is not entered;
- no workspace mutation occurs;
- the blocked K2 receipt records `operation aborted before patch execution`.

This is a pre-execution safety boundary. H4-R1 does not claim transactional cancellation or rollback after mutation execution has already begun.

## 11. Generic command execution-envelope binding

The exact action approved must equal the exact action launched.

Generic command input identity binds:

- executable identifier;
- command arguments;
- allowed exit codes;
- max output bytes;
- timeout;
- effective environment;
- canonical K2 paths.

Caller-owned mutable values are captured before approval and the same captured values are reused for execution:

- `args` -> private `executionArgs = [...args]`;
- `paths` -> independent canonical `uniquePaths(...)` result;
- `allowedExitCodes` -> independent normalized array;
- `env` -> independent canonical environment object.

Executable/capability identifiers are strings and timeout/output bounds are numeric values.

The same `executionArgs` used in the K2 input digest is passed to process launch.

## 12. Environment continuity

If a caller supplies an environment, it is copied and canonicalized before approval.

If no environment is supplied, effective ambient `process.env` is snapshotted before approval.

The captured environment participates in the K2 input digest and is reused at process launch. Ambient mutation while approval is pending cannot change the approved execution.

## 13. K2 receipt relationship

`ExecutionReceipt` remains K2 execution-outcome authority.

When approval is required, the receipt may bind narrowly to:

- approval version;
- request identity;
- request instance id;
- decided evidence identity;
- `allowed-once` outcome.

Approval evidence is not execution-success evidence.

If a side effect occurs but K2 receipt persistence fails, the caller receives `ExecutionUnprovenError`; H4-R1 does not convert an unproven side effect into success.

## 14. Effective actual path scope

The accepted pre-ledger PR changes exactly these nine non-ledger paths:

1. `packages/kodac-runtime/src/evidence/receipt.ts`
2. `packages/kodac-runtime/src/execution/gateway.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/src/tools/apply-patch.ts`
5. `packages/kodac-runtime/src/trust/approval.ts`
6. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
7. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
8. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
9. `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`

This evidence ledger becomes the tenth actual changed path:

10. `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md`

`packages/kodac-runtime/test/gateway.test.ts` was authorized by the original H4-R1 document but was not needed and remains unchanged.

## 15. Legacy-test reconciliation

PR #53 authorized removal only of obsolete pre-H4 `ExecutionGateway` hash pins from the H1, H2-R1, and H2-R2 historical protection suites.

That reconciliation does not grant those slices execution authority. Their remaining protected-surface assertions stay intact.

## 16. Historical invalidation — `212e76df...`

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

Invalidated after a valid review finding showed `repo.apply_patch` dropped `ToolContext.signal`, so pending-approval cancellation could be lost.

NOT certification evidence.

## 17. Historical invalidation — `6fc2fbb2...`

Premature ledger:

`6fc2fbb2c9a5572100a1d52e9d9c080a054dc60c`

Withdrawn by:

`3de7036b54e98fe16b1002a9a03ed4a2fccdd0a4`

NOT certification evidence.

## 18. Historical invalidation — `a8272b09...`

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

Fixed pending-approval cancellation and passed its exact-head matrix, but a later review exposed that callback/Promise success alone could be treated as approval evidence persistence proof.

NOT certification evidence.

## 19. Historical invalidation — `ede218be...`

`ede218be27249cc76d64727f93a65a85b96f2bc3`

Its post-ledger CI passed, but the underlying durability-contract defect invalidated the completion sequence.

NOT certification evidence.

## 20. Historical invalidation — `38e45e85...`

`38e45e85b811d24277a5a3a68bf80b469530ab3f`

Durability-corrected and post-ledger green, but final review identified a valid mutable-command-arguments TOCTOU: the approval identity could bind old argument values while process launch consumed caller-mutated values.

Ledger withdrawn by:

`9fd5545e0a0de2d2e8abe2a48c50d77c6289c39d`

NOT certification evidence.

## 21. Historical invalidation — `b0457ff4...`

`b0457ff46b930d076b2fbc542a6fb8612190ffd7`

This ledger-bearing head included the command-argument snapshot correction and passed its full post-ledger CI matrix.

Manual exact-head review then identified a separate post-approval/pre-mutation cancellation window in `applyPatch`: after `authorize()` returned exact `allowed-once`, the outer method entered `applyHunks` without rechecking whether the signal became aborted in the continuation boundary.

The ledger was withdrawn by:

`d1f65dec4708405af4c3ff4a9d08cd6688d9e067`

NOT certification evidence.

## 22. Accepted pre-ledger candidate

Accepted exact pre-ledger implementation head:

`3d567358a65422c32cb1b0de3d0a5704fa630215`

Correction commit subject:

`fix(kdo): recheck H4-R1 patch cancellation before mutation`

The correction from withdrawal parent `d1f65dec...` changes exactly:

- `packages/kodac-runtime/src/execution/gateway.ts` — `+10/-0`;
- `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts` — `+59/-0`.

No other path changed in that correction commit.

## 23. New deterministic pre-mutation regression

Regression:

`applyPatch rechecks cancellation after approval resolution and before mutation`

The test deliberately schedules an abort in the microtask boundary after the durable `allowed-once` acknowledgment has been validated but before the outer `applyPatch` continuation proceeds to mutation.

It proves:

- the abort becomes observable before patch execution;
- `applyPatch` rejects with `ExecutionBlockedError`;
- asked evidence exists;
- decided evidence remains the already-durable `allowed-once` decision;
- the final execution-boundary recheck blocks the invocation;
- `proof.txt` is never created.

This distinguishes a valid approval decision from permission to ignore a later cancellation that is observable before execution starts.

## 24. Accepted pre-ledger exact-head CI

Exact head:

`3d567358a65422c32cb1b0de3d0a5704fa630215`

Required results:

- governance run `31814750807`: PASS
- K3-R4 run `31814750760`: PASS
- K3-R5 run `31814750809`: PASS
- K2 runtime run `31814750752`: PASS
- runtime change classifier `94813628765`: PASS
- macOS `94813658497`: typecheck/full tests/patch benchmark PASS
- Ubuntu `94813658556`: typecheck/full tests/patch benchmark PASS
- Windows `94813658616`: typecheck/full tests/patch benchmark PASS
- K2 final gate `94813857768`: PASS

Ubuntu exact suite summary:

- tests: `404`
- pass: `403`
- fail: `0`
- cancelled: `0`
- skipped: `1` existing platform qualification skip

The Ubuntu log explicitly records PASS for:

- `repo.apply_patch propagates cancellation during pending approval and late allowed-once cannot mutate`
- `applyPatch rechecks cancellation after approval resolution and before mutation`
- `callback-only asked evidence observation is not durable proof`
- invalid asked/decided durable acknowledgment rejection
- ambient environment snapshot continuity
- command argument snapshot continuity
- K2 receipt persistence behavior after allowed-once

## 25. Accepted pre-ledger review adjudication

Unresolved inline review threads:

`0`

Manual exact-head review confirms:

- the final `applyPatch` signal recheck occurs after `authorize()` and before invocation of `applyHunks`;
- there is no await between that final recheck and entering `applyHunks`;
- command execution passes the same captured argument/environment values used in the approved identity into `execFile`;
- command cancellation is also passed into `execFile` itself;
- paths and allowed-exit-code arrays are copied before approval;
- no parallel execution authority was introduced;
- K2 receipt and Done Gate authority remain unchanged.

A fresh CodeRabbit run `c6c15aa6-656b-4601-ab99-fc778d2c0819` was started on the exact two-file delta from `b0457ff...` to `3d567358...`. At evidence-capture time it had not produced a submitted finding. Because external CodeRabbit completion is not a mandatory authorization gate, pre-ledger adjudication relies on the required exact-head CI, deterministic regressions, zero unresolved threads, and manual exact-head review. Any later valid finding still invalidates this candidate and requires ledger withdrawal.

## 26. Pre-ledger decision

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

This decision authorizes evidence capture only. It is not H4-R1 completion.

## 27. Ledger-only delta rule

This file must be the only changed path between:

`3d567358a65422c32cb1b0de3d0a5704fa630215`

and the final ledger-bearing head.

Any additional production, test, config, or workflow path change invalidates the evidence-capture transition and requires new pre-ledger certification.

## 28. Required post-ledger gates

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

## 29. Non-self-certification

This ledger intentionally does not record its own future commit SHA or future post-ledger PASS state.

Editing the ledger to record those results would create a new SHA and make them stale. Post-ledger certification therefore lives in immutable GitHub exact-head checks, review state, PR metadata, and expected-head merge evidence.

## 30. Final merge gate

Before merge verify:

- PR #52 is OPEN and Ready;
- Draft = false;
- merged = false;
- auto-merge is not used;
- `main` remains the expected canonical base, or any base movement has been safely reconciled and recertified;
- head equals the reviewed ledger-bearing SHA exactly;
- all required checks PASS on that exact head;
- unresolved review threads = 0;
- no valid outstanding review finding remains;
- actual changed paths remain inside the full H4-R1 authorization chain;
- this ledger is the only post-pre-ledger path delta.

Merge must use an expected-head guard.

## 31. Bounded post-merge claim

Only after expected-head merge and post-merge verification may H4-R1 report:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

It MUST NOT report:

- `H4_COMPLETE`;
- sandbox/confinement readiness;
- a platform sandbox backend;
- persistent/reusable approvals;
- `allow-always`;
- cryptographic durability against a dishonest sink;
- transactional cancellation after mutation begins;
- H5 guarded tool-pipeline readiness;
- provider/tool replay readiness;
- generic full-process event sourcing;
- Done Gate replacement;
- unrelated `PROVEN_READY`.

## 32. Next slice boundary

H4-R2 is sandbox/confinement.

H4-R2 requires its own authorization and evidence sequence. No H4-R1 evidence in this file grants H4-R2 production authority.
