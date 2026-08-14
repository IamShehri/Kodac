# KDO-H4-R1 One-Shot Approval Evidence

Date: 2026-08-14
Status: LEDGER-BEARING CANDIDATE — REQUIRES POST-LEDGER EXACT-HEAD CERTIFICATION

## 1. Purpose

This ledger records the current, durability-corrected evidence for the bounded KDO-H4-R1 one-shot approval implementation.

This file is intentionally non-self-certifying. The commit that adds it must independently pass the complete post-ledger exact-head gate. Post-ledger certification is recorded by immutable GitHub checks/review state outside this commit; editing this ledger to certify its own head would create a new head and make the recorded certification stale.

## 2. Authorization chain

Repository: `TheHalfMoon/Kodac`

Implementation PR: `#52 — feat(kdo): implement H4-R1 one-shot approval contracts`

Original H4-R1 authorization:
- PR #51
- merge `fbac06934eaf55c173a70ddf24a42ecb2323c2b8`
- `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_AUTHORIZATION_2026-08-14.md`

Legacy-test reconciliation authorization:
- PR #53
- merge `0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7`
- `docs/planning/KODAC_KDO_H4_R1_LEGACY_TEST_RECONCILIATION_AUTHORIZATION_2026-08-14.md`

Apply-patch abort-propagation authorization:
- PR #54
- merge/current canonical base `b9b055a4cd21e486346ffbdf648793edd88282ae`
- `docs/planning/KODAC_KDO_H4_R1_APPLY_PATCH_ABORT_PROPAGATION_AUTHORIZATION_2026-08-14.md`

## 3. Bounded invariant

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of the exact bound intent`

Preserved authority order:
1. K2 constructs the exact execution intent.
2. Existing K2 policy remains authoritative.
3. `deny` blocks without consulting approval.
4. `allow` executes without approval.
5. only `ask` may enter H4-R1.
6. each ask gets an exact structural request identity plus a unique request-instance identity.
7. `asked` evidence must be durably committed before the approval service is consulted.
8. `decided` evidence must be durably committed before side effects.
9. only `allowed-once` may permit the exact current invocation to proceed.
10. cancellation, malformed/mismatched decisions, unavailable service, and evidence persistence failures fail closed.
11. execution remains exclusively through `ExecutionGateway`.
12. K2 `ExecutionReceipt` remains execution-outcome authority.

## 4. Historical invalidations — not certification

The following heads are explicitly historical and MUST NOT be reused as H4-R1 certification:

### 4.1 `212e76dfb9753d0e51286f18978f6b1d5a8288c0`

Passed the then-current CI matrix, but later exact-head CodeRabbit review identified a valid defect: `repo.apply_patch` failed to forward `ToolContext.signal` into `ExecutionGateway.applyPatch`, so cancellation during a pending approval could be lost.

### 4.2 `6fc2fbb2c9a5572100a1d52e9d9c080a054dc60c`

Premature ledger-bearing head created from the invalid `212e...` candidate. The ledger was withdrawn by commit `3de7036b54e98fe16b1002a9a03ed4a2fccdd0a4`.

### 4.3 `a8272b09e80758ffb2c48f5f22c718755c5cdf78`

Corrected the abort-propagation defect under PR #54 and passed a 399-test exact-head matrix. It was later invalidated by a second valid final-review risk: the approval evidence sink treated successful callback completion as if it were durable persistence.

### 4.4 `ede218be27249cc76d64727f93a65a85b96f2bc3`

Ledger-bearing head from `a827...`. Its post-ledger CI passed, but final review showed the evidence contract still allowed a non-durable sink to return successfully and enable execution. PR #52 was returned to Draft and that ledger was withdrawn before the current candidate.

The old inline ledger-status review thread became outdated when that ledger was withdrawn and is resolved.

## 5. Current accepted pre-ledger head

Exact durability-corrected pre-ledger head:

`65e23e9adc478d3480b6ee248cef9486e10ff454`

Exact canonical base:

`b9b055a4cd21e486346ffbdf648793edd88282ae`

PR state at certification:

`OPEN / DRAFT / NOT MERGED`

Evidence ledger state at that head:

`ABSENT`

## 6. Exact current non-ledger changed paths

The accepted pre-ledger candidate changes exactly nine paths:

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

`packages/kodac-runtime/test/gateway.test.ts` was authorized but did not require modification.

## 7. One-shot approval contract

`packages/kodac-runtime/src/trust/approval.ts` establishes:

- version `kodac-h4-r1-one-shot-approval-v1`;
- closed outcomes `allowed-once | rejected | cancelled | unavailable`;
- deterministic structural request identity over exact K2 intent;
- independent `requestInstanceId` per invocation;
- strict decision validation and exact request/request-instance binding;
- deterministic asked/decided evidence identities;
- no persistent grant object;
- no `allow-always`;
- no wildcard or approval cache authority.

## 8. Durable approval-evidence commit contract

The valid final-review durability finding was accepted rather than dismissed.

The corrected contract now defines:

`kodac-h4-r1-approval-evidence-commit-v1`

An `ApprovalEvidenceSink` must implement a `commit(evidence)` operation whose result is treated as untrusted and validated by K2.

A valid commit acknowledgment must contain exactly:

- the fixed commit version;
- the exact `evidenceIdentity` of the record being committed;
- `durability: "durable"`.

The gateway validates this acknowledgment before considering the evidence persisted.

Therefore:

`callback invoked != durable proof`

and:

`in-memory observation without valid durable commit acknowledgment -> blocked`

The evidence-store implementation is responsible for returning the acknowledgment only after its durable commit has completed; the K2 boundary does not infer durability from callback completion.

## 9. Asked evidence fail-closed rule

For K2 `ask`:

1. construct exact approval request;
2. construct `asked` evidence;
3. call the evidence sink's durable `commit`;
4. validate the returned commit acknowledgment against the exact asked evidence;
5. only then consult the approval service.

If the commit throws, returns nothing, has a wrong version, wrong evidence identity, extra/missing fields, or does not attest `durability: "durable"`, execution is blocked and the approval service is not consulted.

## 10. Decided evidence fail-closed rule

After obtaining a validated approval decision:

1. construct `decided` evidence;
2. durably commit that exact evidence;
3. validate the commit acknowledgment;
4. only then may `allowed-once` become executable authority for this invocation.

A failed or invalid decided-evidence commit prevents side effects.

Approval evidence remains authorization-decision history only; it does not claim execution success.

## 11. K2 policy composition

The corrected implementation preserves:

- `allow` -> no approval service;
- `deny` -> no approval service and no override path;
- `ask` without ApprovalRuntime -> blocked;
- approval service exception -> `unavailable` / blocked;
- malformed or mismatched decision -> blocked;
- non-`allowed-once` outcome -> blocked;
- K2 receipt persistence failure -> `ExecutionUnprovenError`.

No persistent permission is created.

## 12. One-shot replay and concurrency resistance

Focused tests prove:

- structurally identical intents may share structural request identity but receive different request-instance identities;
- one `allowed-once` cannot authorize a later identical invocation;
- concurrent identical asks are distinct;
- decisions must bind both request identity and request-instance identity;
- stale/malformed/mismatched decisions fail closed.

## 13. Command execution-envelope continuity

Manual review identified and corrected an ambient-environment TOCTOU risk.

For generic command execution, K2 snapshots the effective environment before policy/approval, canonicalizes it deterministically, includes executable, arguments, allowed exit codes, max output bytes, timeout, and captured environment in the K2 input digest, and reuses that same captured environment at process execution.

The raw environment is not added to approval evidence; only the exact K2 intent digest is bound.

Focused regression proves a mutation of `process.env` while approval is pending cannot alter the executed environment.

## 14. Apply-patch cancellation continuity

Under PR #54 authority, `packages/kodac-runtime/src/tools/apply-patch.ts` forwards its existing `ToolContext.signal` to `ExecutionGateway.applyPatch`.

The gateway re-checks that exact signal after `ApprovalService.decide()` returns. If cancellation occurred while the decision was pending, the outcome is normalized to `cancelled` before decided evidence is committed, even if the approval service returns a late valid `allowed-once`.

The existing post-decision abort check remains defense in depth before mutation begins.

This does not claim transactional cancellation after filesystem mutation has already begun.

## 15. End-to-end RuntimeTool cancellation proof

The focused test:

`repo.apply_patch propagates cancellation during pending approval and late allowed-once cannot mutate`

uses deterministic synchronization to prove:

- the real `repo.apply_patch` RuntimeTool receives a live signal;
- K2 policy returns `ask`;
- the approval service begins waiting;
- caller abort occurs while the decision is pending;
- the service is deliberately allowed to return `allowed-once` afterward;
- durable decided evidence records `cancelled`;
- the workspace remains unmodified;
- execution rejects with `ExecutionBlockedError`;
- the ReceiptLedger contains a blocked receipt and no success receipt.

## 16. Legacy H1/H2 reconciliation

PR #53 authorized removal only of obsolete permanent pre-H4 `ExecutionGateway` blob pins from three historical tests.

All remaining H1/H2 protections for provider transports, model turn, RuntimeOrchestrator, ToolRegistry, Done Gate, H1 descriptor boundaries, and H2 request/history authority remain intact.

No replacement H4 gateway hash was inserted into those historical slices.

## 17. Exact pre-ledger CI matrix

All required workflows completed successfully on exact head:

`65e23e9adc478d3480b6ee248cef9486e10ff454`

- governance `31809179164` — PASS
- K3-R4 `31809179472` — PASS
- K3-R5 `31809179207` — PASS
- K2 runtime `31809179222` — PASS
- classifier `94795364212` — PASS
- macOS `94795395898` — typecheck / full tests / patch benchmark PASS
- Windows `94795395910` — typecheck / full tests / patch benchmark PASS
- Ubuntu `94795395918` — typecheck / full tests / patch benchmark PASS
- K2 final gate `94795870252` — PASS

## 18. Exact test evidence

Ubuntu exact-head runtime output reported:

- tests: `402`
- pass: `401`
- fail: `0`
- skipped: `1`
- cancelled: `0`
- todo: `0`

The one skip is the existing platform-qualified ast-grep identity case and is unrelated to H4-R1.

Focused PASS cases include:

- callback-only asked evidence observation is not durable proof;
- invalid asked evidence commit acknowledgment blocks before the approval service;
- asked evidence persistence failure blocks before approval-service invocation;
- decided evidence persistence failure blocks allowed-once before side effects;
- invalid decided evidence commit acknowledgment blocks allowed-once before side effects;
- allowed-once durably commits decided evidence before mutation and binds the K2 receipt;
- prior allowed-once cannot authorize the next identical ask;
- concurrent identical asks have distinct request instances;
- aborted approval is durably recorded as cancelled;
- real `repo.apply_patch` cancellation during pending approval cannot be resurrected by late allowed-once;
- K2 receipt persistence failure remains `ExecutionUnprovenError`;
- approval request identity binds execution environment and bounds;
- ambient environment is snapshotted before approval and cannot drift before execution.

## 19. Review/adjudication evidence

The earlier valid CodeRabbit abort-propagation finding was accepted, authorized through PR #54, corrected, and regression-tested.

The later valid durability risk from final review of `ede218...` was also accepted, not dismissed. It triggered this durability contract correction and another complete pre-ledger certification cycle.

The old ledger-status inline comment refers to a withdrawn, outdated ledger and is resolved. Its requested self-certification change was not applied because modifying a ledger to certify its own exact head creates a new head and makes the stated certification stale.

Fresh manual exact-head review of `65e23e9...` checked:

- durable asked/decided commit acknowledgment semantics;
- rejection of callback-only success;
- strict acknowledgment version/identity/durability binding;
- service non-invocation when asked durability is unproven;
- no side effects when decided durability is unproven;
- one-shot request-instance binding;
- cancellation normalization and signal continuity;
- environment continuity;
- K2 receipt authority;
- effective nine-path allowlist;
- preserved H1/H2/provider/ToolRegistry/Done Gate boundaries.

No remaining actionable finding was identified.

At pre-ledger acceptance:

- unresolved review threads: `0`;
- PR state: Draft;
- evidence ledger: absent.

## 20. Pre-ledger decision

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

This decision applies only to:

`65e23e9adc478d3480b6ee248cef9486e10ff454`

It does not apply to any prior H4-R1 candidate listed in Section 4.

## 21. Required post-ledger gate

The commit containing this ledger MUST independently satisfy:

- exact changed-path check, with this ledger as the tenth authorized path;
- TypeScript typecheck PASS;
- complete runtime suite PASS;
- focused H4-R1 tests PASS;
- durability-negative regressions PASS;
- end-to-end apply-patch cancellation regression PASS;
- Ubuntu PASS;
- macOS PASS;
- Windows PASS;
- patch benchmark PASS;
- governance PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- K2 final gate PASS;
- fresh exact-head review/adjudication;
- unresolved review threads = 0;
- PR remains unmerged until the gate completes.

Post-ledger results belong in immutable GitHub checks/review/PR metadata rather than editing this ledger to certify itself.

## 22. Bounded completion claim

Only after successful post-ledger certification and expected-head merge may Kodac claim:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

Bounded meaning:

**Kodac can resolve an existing K2 `ask` through an exact-intent one-shot approval whose asked and decided records require explicit validated durable-commit acknowledgments before decision use or side effects; cancellation during approval remains fail-closed; approval cannot override K2 `deny` or become a persistent grant; and K2 receipts remain execution-outcome authority.**

## 23. Explicit non-claims

This ledger does NOT claim:

- `H4_COMPLETE`;
- sandbox/confinement readiness;
- a platform sandbox backend;
- cryptographic proof that a dishonest storage provider actually flushed bytes after falsely attesting durability;
- transactionally interruptible filesystem mutation after mutation begins;
- persistent/reusable approval grants;
- `allow-always`;
- H5 guarded tool-pipeline readiness;
- provider/tool replay;
- generic full-process event sourcing;
- Done Gate replacement;
- unrelated `PROVEN_READY`.

H4-R2 sandbox/confinement remains a separate authorization and proof sequence.
