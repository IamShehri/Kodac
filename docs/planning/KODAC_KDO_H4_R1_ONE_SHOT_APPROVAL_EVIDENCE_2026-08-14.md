# Kodac KDO H4-R1 One-Shot Approval Evidence

Date: 2026-08-14

Status: EVIDENCE LEDGER — POST-LEDGER CERTIFICATION REQUIRED

This document is evidence for the canonically authorized H4-R1 one-shot approval slice. It is deliberately non-self-certifying: this file records the accepted pre-ledger implementation evidence, while the ledger-bearing commit itself must pass fresh exact-head CI and review before merge.

## 1. Repository and authorization identity

Repository:

`TheHalfMoon/Kodac`

Canonical implementation base for PR #52:

`b9b055a4cd21e486346ffbdf648793edd88282ae`

Authorization chain:

1. PR #51 / merge `fbac06934eaf55c173a70ddf24a42ecb2323c2b8` — original H4-R1 one-shot approval authorization.
2. PR #53 / merge `0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7` — legacy-test reconciliation.
3. PR #54 / merge `b9b055a4cd21e486346ffbdf648793edd88282ae` — `repo.apply_patch` abort-propagation supplemental authorization.

## 2. Bounded H4-R1 claim

The only completion claim this slice may support after successful post-ledger review and expected-head merge is:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

H4-R1 does NOT prove `H4_COMPLETE`.

H4-R2 sandbox/confinement remains separate.

## 3. Core invariant

H4-R1 implements this bounded invariant beneath K2 execution authority:

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of the exact bound intent`

Approval does not replace K2 policy, K2 execution, K2 receipts, or Done Gate authority.

## 4. Closed approval outcomes

Authorized outcomes are exactly:

- `allowed-once`
- `rejected`
- `cancelled`
- `unavailable`

There is no:

- allow-always;
- remembered permission;
- wildcard grant;
- persistent capability grant;
- directory-wide durable permission;
- capability-family permission;
- approval cache.

## 5. Policy composition

The accepted implementation preserves the required composition:

1. construct the exact K2 `ExecutionIntent`;
2. expose the intent through existing K2 evidence hooks;
3. evaluate K2 policy;
4. `deny` blocks without consulting approval;
5. `allow` executes through the existing K2 path without approval;
6. only `ask` invokes H4-R1 approval;
7. only exact `allowed-once` can authorize this invocation;
8. all other outcomes fail closed;
9. execution remains inside `ExecutionGateway`;
10. normal K2 execution receipts remain execution-outcome authority.

Approval cannot convert K2 `deny` to executable.

## 6. One-shot identity and replay resistance

Each approval request contains:

- fixed H4-R1 version;
- deterministic structural `requestIdentity` bound to the exact intent;
- unique `requestInstanceId` for the current invocation;
- exact capability;
- exact canonical paths;
- exact K2 input digest.

The deterministic identity permits structural comparison without creating reusable authority.

The unique request instance prevents a prior approval decision from being replayed as authority for a later structurally identical invocation.

Concurrent structurally identical `ask` operations receive different request instances.

## 7. Durable approval evidence contract

H4-R1 provides two approval evidence phases:

- `asked`
- `decided`

The implementation does not equate callback invocation or in-memory observation with durable proof.

`ApprovalEvidenceSink.commit()` must return a strict versioned acknowledgment after the sink represents the evidence as durably committed.

The acknowledgment is validated for:

- exact commit-contract version;
- exact `evidenceIdentity`;
- literal `durability: "durable"`;
- exact allowed fields only.

Absent, malformed, mismatched, non-durable, or throwing acknowledgments fail closed.

This contract does not claim cryptographic proof against a dishonest storage provider that falsely attests durability. It establishes the trusted host contract required by H4-R1.

## 8. Evidence ordering

For K2 policy `ask`:

1. create exact approval request;
2. create `asked` evidence;
3. durably commit and validate the `asked` acknowledgment;
4. only then consult `ApprovalService`;
5. normalize/validate the decision;
6. create `decided` evidence;
7. durably commit and validate the `decided` acknowledgment;
8. only exact `allowed-once` may proceed;
9. only then enter the existing side-effect body;
10. persist the K2 execution receipt.

Asked-evidence persistence failure prevents service invocation and execution.

Decided-evidence persistence failure prevents an `allowed-once` response from enabling execution.

## 9. Cancellation and late-decision behavior

`repo.apply_patch` forwards `ToolContext.signal` to `ExecutionGateway.applyPatch`.

For approval waits:

- a pre-aborted signal produces `cancelled` and does not consult the approval service;
- an abort that occurs while `ApprovalService.decide()` is pending is normalized to `cancelled` after the service returns;
- even if the service later returns `allowed-once`, the durable decided evidence records `cancelled`;
- the invocation remains blocked;
- no workspace mutation may be resurrected by the late answer;
- no success receipt may be emitted for the cancelled invocation.

This slice does not claim transactional rollback if a side effect has already begun. That broader confinement/cancellation problem remains outside H4-R1.

## 10. Generic command execution-envelope binding

The exact action approved must equal the exact action launched.

For generic read-only command execution, the K2 input digest binds:

- executable identifier;
- command arguments;
- allowed exit codes;
- max output bytes;
- timeout;
- effective environment.

Caller-owned mutable values are snapshotted before approval and the same snapshots are used for execution:

- `args` -> private `executionArgs = [...args]`;
- `paths` -> independent canonical `uniquePaths(...)` result;
- `allowedExitCodes` -> independent normalized array;
- `env` -> independent canonical environment object.

The executable/capability identifiers are strings and timeout/output bounds are numeric values.

The same `executionArgs` used in the approval identity/input digest is passed to process launch.

Therefore caller mutation of the original command arguments while approval is pending cannot change the launched command.

## 11. Environment continuity

If a caller provides an environment, H4-R1 canonicalizes and copies that environment before policy/approval.

If no environment is provided, H4-R1 snapshots the effective ambient `process.env` before policy/approval.

The captured environment participates in the input digest and is reused at process launch.

Ambient environment mutation during approval therefore does not change the approved command execution.

## 12. K2 receipt relationship

`ExecutionReceipt` remains K2 execution-outcome authority.

Where approval was required and exact `allowed-once` enabled execution, the receipt may bind narrowly to:

- approval version;
- request identity;
- request instance id;
- decided evidence identity;
- `allowed-once` outcome.

Approval evidence is not execution success evidence.

K2 receipt persistence semantics remain unchanged: if the side effect occurred but receipt persistence fails, the caller receives `ExecutionUnprovenError` rather than a false success claim.

## 13. Effective changed-path authority

The current pre-ledger PR changes exactly these nine non-ledger paths:

1. `packages/kodac-runtime/src/evidence/receipt.ts`
2. `packages/kodac-runtime/src/execution/gateway.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/src/tools/apply-patch.ts`
5. `packages/kodac-runtime/src/trust/approval.ts`
6. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
7. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
8. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
9. `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`

This ledger is the tenth actual changed path after evidence capture:

10. `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md`

`packages/kodac-runtime/test/gateway.test.ts` was authorized by the original H4-R1 document but was not required and remains unchanged.

## 14. Legacy-test reconciliation

H4-R1 intentionally changes `ExecutionGateway`, so three older cross-slice hash pins to the pre-H4 gateway became stale.

PR #53 canonically authorized only removal of the obsolete gateway pin from:

- H1 capability test;
- H2-R1 model-visible request test;
- H2-R2 event-derived history test.

Other protected authority surfaces remain protected by those suites.

The reconciliation does not grant those older slices execution authority.

## 15. Historical invalidation: candidate `212e76df...`

Candidate:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

It passed CI but was invalidated by a valid review finding:

`repo.apply_patch` did not propagate `ToolContext.signal` into the gateway approval path.

Consequence: cancellation while approval was pending could be lost and a later `allowed-once` could permit mutation.

This candidate is NOT certification evidence.

## 16. Historical invalidation: premature ledger `6fc2fbb2...`

Ledger-bearing head:

`6fc2fbb2c9a5572100a1d52e9d9c080a054dc60c`

It was withdrawn after the cancellation defect was found.

Withdrawal commit:

`3de7036b54e98fe16b1002a9a03ed4a2fccdd0a4`

It is NOT certification evidence.

## 17. Historical invalidation: candidate `a8272b09...`

Candidate:

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

It fixed apply-patch cancellation propagation and passed its pre-ledger matrix, including the end-to-end pending-approval cancellation regression.

A later final review exposed a separate valid defect in approval evidence durability semantics: a successful callback/Promise alone could be treated as persistence proof.

The candidate was therefore invalidated.

## 18. Historical invalidation: ledger `ede218be...`

Ledger-bearing head:

`ede218be27249cc76d64727f93a65a85b96f2bc3`

Its post-ledger CI passed, but its completion sequence was invalidated by the durability-contract finding inherited from the underlying candidate.

It is NOT certification evidence.

## 19. Historical invalidation: ledger `38e45e85...`

Durability-corrected ledger-bearing head:

`38e45e85b811d24277a5a3a68bf80b469530ab3f`

This head passed full post-ledger CI and final CodeRabbit status became successful.

However, the submitted final review contained a valid outside-diff security finding in `ExecutionGateway.runCommand`:

- caller-owned `args` remained mutable by reference;
- approval identity/input digest observed the pre-mutation argument values;
- the later process launch could observe caller-mutated argument values while approval was pending.

This was a true time-of-check/time-of-use break in the exact-intent invariant.

The ledger was withdrawn by:

`9fd5545e0a0de2d2e8abe2a48c50d77c6289c39d`

This head is NOT certification evidence.

## 20. Current accepted pre-ledger candidate

Accepted pre-ledger implementation head:

`badb19152a608c4d08571455b195deaca96f8a45`

Correction commit subject:

`fix(kdo): bind H4-R1 command argument snapshot`

The correction from ledger-withdrawal parent `9fd5545e...` changes exactly:

- `packages/kodac-runtime/src/execution/gateway.ts` — `+3/-2`;
- `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts` — `+48/-0`.

No other path changed in that correction commit.

## 21. Command-argument TOCTOU regression

Focused regression:

`command arguments are snapshotted before approval and cannot drift before execution`

The test:

1. constructs a mutable argument array whose approved value would print `approved`;
2. starts a K2 `ask` command;
3. deliberately holds the approval service pending;
4. mutates the caller's original array to `mutated` and appends another argument;
5. releases an exact `allowed-once` decision;
6. verifies process output remains exactly `approved`;
7. verifies asked/decided evidence input digests match the K2 receipt input digest;
8. verifies the caller's external array really was mutated, demonstrating that execution used an independent snapshot.

The regression passes in the full exact-head suite.

## 22. Current pre-ledger exact-head CI

Exact head:

`badb19152a608c4d08571455b195deaca96f8a45`

Results:

- governance run `31812445811`: PASS
- K3-R4 run `31812445738`: PASS
- K3-R5 run `31812445779`: PASS
- K2 runtime run `31812445766`: PASS
- runtime change classifier job `94806065186`: PASS
- Ubuntu job `94806103241`: typecheck PASS, full tests PASS, patch benchmark PASS
- macOS job `94806103270`: typecheck PASS, full tests PASS, patch benchmark PASS
- Windows job `94806103336`: typecheck PASS, full tests PASS, patch benchmark PASS
- K2 final gate job `94806368278`: PASS

Ubuntu exact suite summary:

- tests: `403`
- pass: `402`
- fail: `0`
- cancelled: `0`
- skipped: `1` existing platform qualification skip

The command-argument snapshot regression is explicitly present and PASS in the Ubuntu exact-head log.

## 23. Current pre-ledger review adjudication

Inline review threads at the accepted pre-ledger head:

`0 unresolved`

The two-file correction was manually reviewed against the H4-R1 exact-intent invariant and against analogous execution-envelope mutation risks.

Manual adjudication confirms:

- command args are independently snapshotted before intent creation;
- the same argument snapshot is used for input digest and process launch;
- paths are independently copied/canonicalized;
- effective environment is independently copied/canonicalized;
- allowed exit codes are independently copied/normalized;
- timeout and max-output bounds are numeric values;
- executable and capability identifiers are string values;
- receipt binding remains tied to the same intent/approval identities.

A fresh CodeRabbit review was requested repeatedly after the correction. The external reviewer reported review-rate limiting rather than a code finding. The rate-limited run identified the intended exact delta (`38e45e85... -> badb1915...`) and the correct two files, but did not execute a new submitted review.

Therefore this ledger does NOT represent that rate-limit condition as automated approval. Pre-ledger acceptance rests on the exact-head required CI, deterministic focused regression, zero unresolved threads, and explicit manual exact-head adjudication.

## 24. Pre-ledger decision

Decision:

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

This decision authorizes evidence capture only. It is not the final H4-R1 completion claim.

## 25. Ledger-only delta requirement

This file must be the only changed path between accepted pre-ledger head:

`badb19152a608c4d08571455b195deaca96f8a45`

and the final ledger-bearing head.

Any additional production/test/config path change invalidates this evidence-capture transition and requires a new pre-ledger certification.

## 26. Required post-ledger gates

The ledger-bearing head must independently pass fresh exact-head:

- governance;
- K3-R4 adapter gate;
- K3-R5 context-engine gate;
- K2 runtime change classifier;
- Ubuntu typecheck, full tests, benchmark;
- macOS typecheck, full tests, benchmark;
- Windows typecheck, full tests, benchmark;
- K2 final runtime gate;
- review adjudication;
- zero unresolved review threads;
- exact scope verification;
- expected-head merge gate.

Pre-ledger CI results cannot substitute for these post-ledger gates.

## 27. Non-self-certification rule

This ledger intentionally does not contain its own future ledger-bearing commit SHA or claim that its future post-ledger checks have passed.

Editing the ledger to record its own post-ledger certification would create a new commit and make that certification stale.

Post-ledger certification therefore lives in immutable GitHub exact-head checks, review state, PR metadata, and expected-head merge evidence.

## 28. Final merge gate

Before merge, verify all of the following against the final ledger-bearing head:

- PR #52 is OPEN and Ready;
- Draft = false;
- merged = false;
- auto-merge is not used;
- `main` remains the expected canonical base or the branch has been safely reconciled and recertified;
- head equals the reviewed ledger-bearing SHA exactly;
- all required checks PASS on that exact head;
- unresolved review threads = 0;
- no valid outstanding review finding remains;
- changed paths remain inside the complete H4-R1 authorization chain;
- ledger is present as the only post-pre-ledger path delta.

Merge must use an expected-head guard.

## 29. Bounded claim after successful merge

Only after the expected-head merge and post-merge verification may the slice report:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

It still MUST NOT report:

- `H4_COMPLETE`;
- sandbox/confinement ready;
- platform sandbox backend ready;
- persistent/reusable approvals;
- `allow-always`;
- cryptographic durability against a dishonest sink;
- transactional cancellation after mutation begins;
- H5 guarded tool-pipeline ready;
- provider/tool replay ready;
- generic full-process event sourcing ready;
- Done Gate replacement;
- unrelated `PROVEN_READY`.

## 30. Next slice boundary

H4-R2 is sandbox/confinement.

H4-R2 requires a separate authorization and evidence sequence.

No H4-R1 evidence in this ledger authorizes H4-R2 production implementation.
