# KDO-H4-R1 One-Shot Approval Evidence

Date: 2026-08-14
Status: LEDGER-BEARING CANDIDATE — REQUIRES POST-LEDGER EXACT-HEAD CERTIFICATION

## 1. Purpose

This ledger records the corrected evidence for the bounded KDO-H4-R1 one-shot approval implementation.

It does not self-certify the commit that contains it. All pre-ledger results below apply only to the exact corrected pre-ledger head. After this ledger is committed, the new ledger-bearing head must independently pass the complete post-ledger gate before PR #52 may become Ready or merge.

## 2. Repository and authorization chain

Repository:

`TheHalfMoon/Kodac`

Implementation PR:

`#52 — feat(kdo): implement H4-R1 one-shot approval contracts`

Implementation branch:

`feat/kdo-h4-r1-one-shot-approval`

### Original H4-R1 authorization

- PR: `#51 — docs(kdo): authorize H4-R1 one-shot approval contracts`
- authorization head: `c8e784e31bab34cc595fbc77c9fbbf5ee3f01e93`
- merge: `fbac06934eaf55c173a70ddf24a42ecb2323c2b8`
- document: `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_AUTHORIZATION_2026-08-14.md`

### Legacy-test reconciliation authorization

- PR: `#53 — docs(kdo): authorize H4-R1 legacy test reconciliation`
- authorization head: `bf9dca014b14b343f5b882a0cf09f860fb23aa74`
- merge: `0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7`
- document: `docs/planning/KODAC_KDO_H4_R1_LEGACY_TEST_RECONCILIATION_AUTHORIZATION_2026-08-14.md`

### Apply-patch abort-propagation authorization

- PR: `#54 — docs(kdo): authorize H4-R1 apply-patch abort propagation`
- authorization head: `5fdb2a973fa6d2a68bb4c34c4e02fdc791b69819`
- merge / corrected implementation base: `b9b055a4cd21e486346ffbdf648793edd88282ae`
- document: `docs/planning/KODAC_KDO_H4_R1_APPLY_PATCH_ABORT_PROPAGATION_AUTHORIZATION_2026-08-14.md`

## 3. Bounded target

H4-R1 target:

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of the exact bound intent`

Required composition preserved by the candidate:

1. K2 constructs the exact execution intent.
2. Existing K2 policy remains authoritative.
3. `deny` blocks and never consults approval.
4. `allow` executes without approval.
5. Only `ask` may consult an explicitly injected H4-R1 approval runtime.
6. Every approval request binds the exact intent plus a distinct per-invocation request instance.
7. `asked` evidence persists before a decision may be used.
8. `decided` evidence persists before side effects.
9. Only `allowed-once` may authorize that exact invocation.
10. `rejected`, `cancelled`, `unavailable`, malformed, mismatched, absent, and failed decisions fail closed.
11. Cancellation while approval is pending cannot later become mutation authority.
12. Execution still occurs only through `ExecutionGateway`.
13. K2 execution receipts remain execution-outcome authority.

## 4. Invalidated former candidate — do not reuse

Former pre-ledger candidate:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

That head passed the then-required CI matrix, but later exact-head CodeRabbit review identified a valid defect in the RuntimeTool-to-gateway abort boundary.

The finding was published in PR #52 comment:

`5294003538`

Finding summary:

- `packages/kodac-runtime/src/tools/apply-patch.ts` checked `context.signal` before calling the gateway;
- it did not forward the same signal into `ExecutionGateway.applyPatch`;
- cancellation occurring while `ApprovalService.decide` was pending therefore could not reach the H4-R1 approval wait;
- a later `allowed-once` result could permit workspace mutation after caller cancellation.

Therefore:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0 != accepted H4-R1 pre-ledger head`

Its green CI is historical evidence only and MUST NOT be used as certification.

## 5. Withdrawn premature ledger

A ledger was prematurely created after the former candidate's green CI, producing head:

`6fc2fbb2c9a5572100a1d52e9d9c080a054dc60c`

After the later review finding was accepted as valid:

- PR #52 was converted back to Draft;
- the ledger was withdrawn;
- withdrawal commit: `3de7036b54e98fe16b1002a9a03ed4a2fccdd0a4`;
- no completion claim was retained.

This current ledger supersedes that withdrawn candidate and records the correction sequence explicitly.

## 6. Supplemental authority and branch synchronization

The valid abort finding required a new production path that was not in the original H4-R1 allowlist:

`packages/kodac-runtime/src/tools/apply-patch.ts`

PR #54 authorized only that path for cancellation propagation and required an end-to-end regression through the actual RuntimeTool adapter.

After PR #54 merged, the feature branch was synchronized with canonical main through non-force merge commit:

`5ce246db5b03115d8f11f6a32a806fbf0fc57f60`

No force update or history rewrite was used.

## 7. Corrected pre-ledger head

Exact corrected pre-ledger head:

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

Exact canonical base:

`b9b055a4cd21e486346ffbdf648793edd88282ae`

PR state during corrected pre-ledger certification:

`OPEN / DRAFT / NOT MERGED`

Evidence ledger state at that head:

`ABSENT`

## 8. Exact corrected pre-ledger changed paths

The corrected pre-ledger head changed exactly nine repository paths versus canonical base:

1. `packages/kodac-runtime/src/evidence/receipt.ts`
2. `packages/kodac-runtime/src/execution/gateway.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/src/tools/apply-patch.ts`
5. `packages/kodac-runtime/src/trust/approval.ts`
6. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
7. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
8. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
9. `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`

All nine are within the combined authority of PR #51 + PR #53 + PR #54.

`packages/kodac-runtime/test/gateway.test.ts` was authorized but required no modification.

## 9. One-shot approval contract evidence

`packages/kodac-runtime/src/trust/approval.ts` establishes:

- version `kodac-h4-r1-one-shot-approval-v1`;
- closed outcomes `allowed-once | rejected | cancelled | unavailable`;
- deterministic structural request identity over exact K2 intent;
- independent `requestInstanceId` for every invocation;
- strict decision shape validation;
- exact request-identity and request-instance matching;
- explicit `asked` and `decided` evidence phases;
- deterministic evidence identities;
- no persistent grant object;
- no `allow-always`;
- no wildcard/cache grant authority.

The approval service returns untrusted `unknown`; K2 validates it before use.

## 10. Gateway evidence

`packages/kodac-runtime/src/execution/gateway.ts` preserves K2 composition:

- `allow` does not consult approval;
- `deny` never consults approval;
- `ask` without ApprovalRuntime remains blocked;
- `asked` evidence must persist before service invocation;
- service errors become fail-closed `unavailable`, or `cancelled` when the signal is aborted;
- malformed or mismatched decisions fail closed;
- `decided` evidence must persist before side effects;
- non-`allowed-once` outcomes emit blocked K2 receipts;
- successful/failing execution receipts bind the exact approval decision when approval was required;
- K2 receipt persistence failure remains `ExecutionUnprovenError`.

## 11. Pending-approval cancellation correction

The corrected gateway re-checks the exact `AbortSignal` immediately after `ApprovalService.decide()` resolves.

If cancellation occurred while the service was pending, the runtime outcome is normalized to:

`cancelled`

before `decided` evidence is constructed and persisted, even when the approval service itself returns a syntactically valid late:

`allowed-once`

Therefore a late service result cannot resurrect a cancelled invocation.

The existing post-decision abort guard remains as defense in depth before execution proceeds.

## 12. RuntimeTool signal propagation

Under PR #54 authority, `packages/kodac-runtime/src/tools/apply-patch.ts` changed only the gateway call boundary:

from a call that omitted gateway options to a call that forwards:

`{ signal: context.signal }`

The tool still:

- uses the same `repo.apply_patch` capability;
- uses the same model-visible schema;
- performs the same early pre-abort check;
- delegates policy/approval/execution to `ExecutionGateway`;
- persists K2 receipts through the existing ReceiptLedger observer;
- does not implement its own approval or policy authority.

## 13. End-to-end cancellation proof

The focused H4-R1 suite now includes:

`repo.apply_patch propagates cancellation during pending approval and late allowed-once cannot mutate`

The deterministic test exercises the real RuntimeTool adapter and proves:

1. `createApplyPatchTool` is invoked with a live `AbortSignal` in ToolContext;
2. K2 policy returns `ask`;
3. `ApprovalService.decide` begins and is held pending by deterministic synchronization;
4. the caller aborts while the decision is pending;
5. the service is then deliberately released and returns `allowed-once` anyway;
6. the forwarded signal reaches the gateway;
7. the durable approval sequence is `asked` then `decided=cancelled`;
8. the workspace target does not exist after the operation;
9. the tool execution rejects with `ExecutionBlockedError`;
10. the ReceiptLedger records exactly one blocked K2 receipt;
11. no success K2 receipt exists;
12. the late `allowed-once` return is proven unable to resurrect mutation authority.

This closes the exact defect identified by comment `5294003538`.

## 14. Execution-envelope continuity

Manual review also previously identified an ambient-environment time-of-check/time-of-use risk for generic command approval.

The corrected implementation snapshots the effective environment before policy/approval, canonicalizes it deterministically, binds executable/arguments/allowed exit codes/output bound/timeout/environment into the K2 input digest, and reuses the same captured environment at process execution.

Only the digest is persisted; raw environment values are not added to approval evidence.

The focused regression:

`ambient environment is snapshotted before approval and cannot drift before execution`

passes at the corrected pre-ledger head.

## 15. One-shot and replay resistance

Focused tests prove:

- repeated structural intent may share structural request identity but not request instance identity;
- prior `allowed-once` cannot authorize a later identical invocation;
- concurrent identical asks have distinct request instances;
- a decision must bind exact request identity and exact request instance;
- malformed/mismatched/stale decision data fails closed;
- no persistent approval cache or grant registry exists.

## 16. Evidence ordering

Focused tests prove the required order:

`asked evidence -> decision -> decided evidence -> side effect`

Specifically:

- asked-evidence failure blocks before consulting the service;
- decided-evidence failure blocks `allowed-once` before side effects;
- successful decided evidence is present while the mutation target is still absent;
- K2 execution receipt remains a separate later record of execution outcome.

Approval evidence never claims that execution succeeded.

## 17. Legacy test reconciliation

PR #53 authorized removal of only the obsolete permanent pre-H4 `ExecutionGateway` blob pin from three historical tests.

The corrected candidate preserves all remaining H1/H2 protections for providers, model turn, RuntimeOrchestrator, ToolRegistry, Done Gate, descriptor boundaries, and request/history authority.

No new H4 gateway hash was inserted into those historical slices.

## 18. Corrected pre-ledger CI matrix

All required workflows completed successfully on exact head:

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

### Governance

- workflow `31807267627 — governance — PASS`

### K3-R4

- workflow `31807267619 — k3-r4-adapter — PASS`

### K3-R5

- workflow `31807267642 — k3-r5-context-engine — PASS`

### K2 runtime

- workflow `31807267757 — k2-runtime — PASS`
- classifier `94789093997 — PASS`
- macOS `94789137571 — typecheck / full tests / patch benchmark PASS`
- Ubuntu `94789137596 — typecheck / full tests / patch benchmark PASS`
- Windows `94789137780 — typecheck / full tests / patch benchmark PASS`
- K2 final gate `94789390560 — PASS`

## 19. Exact corrected test evidence

Ubuntu exact-head runtime output reported:

- tests: `399`
- pass: `398`
- fail: `0`
- cancelled: `0`
- skipped: `1`
- todo: `0`

The one skip is the existing platform-qualified ast-grep identity case and is unrelated to H4-R1.

The exact runtime output explicitly records PASS for:

`repo.apply_patch propagates cancellation during pending approval and late allowed-once cannot mutate`

The patch benchmark also passed.

macOS and Windows independently completed typecheck, complete tests, and patch benchmark successfully.

## 20. Review evidence

The former candidate's CodeRabbit review finding was accepted rather than dismissed and produced the PR #54 supplemental authorization and correction sequence.

A fresh explicit review request was posted on corrected exact head:

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

PR #52 remained Draft as required. CodeRabbit's configured automatic status skips Draft PRs and did not publish a new actionable finding for this corrected head before certification.

A fresh manual exact-head review inspected:

- exact signal forwarding in `src/tools/apply-patch.ts`;
- post-`decide()` abort normalization in `ExecutionGateway`;
- end-to-end deterministic RuntimeTool regression;
- one-shot request/instance binding;
- evidence ordering;
- ambient environment continuity;
- K2 receipt authority;
- effective nine-path allowlist;
- preservation of protected authority surfaces.

Manual review found no remaining actionable defect.

At corrected pre-ledger certification:

- submitted reviews: `0`;
- unresolved inline review threads: `0`.

Automated review is not a mandatory named H4-R1 gate; exact-head manual review plus zero unresolved threads is the authority used for corrected pre-ledger acceptance.

## 21. Corrected pre-ledger decision

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

This statement applies only to:

`a8272b09e80758ffb2c48f5f22c718755c5cdf78`

It explicitly does not apply to `212e76df...` or `6fc2fbb2...`.

## 22. Required post-ledger gate

The commit containing this ledger MUST independently satisfy:

- exact allowed-path check, with this ledger as the tenth changed path;
- TypeScript typecheck PASS;
- complete runtime suite PASS;
- focused H4-R1 tests PASS;
- end-to-end RuntimeTool cancellation regression PASS;
- Ubuntu PASS;
- macOS PASS;
- Windows PASS;
- patch benchmark PASS;
- governance PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- K2 runtime final gate PASS;
- fresh exact-head review/adjudication;
- unresolved review threads = 0;
- PR remains unmerged until those checks complete.

Only after this complete post-ledger gate may PR #52 become Ready and enter expected-head merge governance.

## 23. Bounded completion claim

The only H4-R1 completion claim permitted after successful post-ledger certification and expected-head merge is:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

Bounded meaning:

**Kodac can resolve an existing K2 `ask` through an explicit exact-intent one-shot approval request whose asked/decided evidence is persisted before side effects, while cancellation during the approval wait remains fail-closed, approval cannot override K2 `deny` or become a persistent grant, and K2 execution receipts remain execution-outcome authority.**

## 24. Explicit non-claims

This ledger does NOT claim:

- `H4_COMPLETE`;
- sandbox or confinement readiness;
- any platform sandbox backend;
- transactionally interruptible filesystem mutation after mutation begins;
- persistent or reusable approval grants;
- `allow-always`;
- H5 guarded tool-pipeline readiness;
- tool-side-effect replay;
- provider replay;
- raw-provider-wire reconstruction;
- generic full-process event sourcing;
- Done Gate replacement;
- unrelated `PROVEN_READY`.

H4-R2 sandbox/confinement remains a separate future authorization and proof sequence.
