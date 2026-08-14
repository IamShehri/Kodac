# KDO-H4-R1 One-Shot Approval Evidence

Date: 2026-08-14
Status: LEDGER-BEARING CANDIDATE — REQUIRES POST-LEDGER EXACT-HEAD CERTIFICATION

## 1. Purpose

This ledger records the evidence for the bounded KDO-H4-R1 one-shot approval implementation.

It does not self-certify the commit that contains it. All pre-ledger results recorded below apply only to the exact pre-ledger implementation head. After this ledger is committed, the resulting new head must independently pass the complete post-ledger gate before H4-R1 may be marked Ready or merged.

## 2. Repository and authority chain

Repository:

`TheHalfMoon/Kodac`

Original H4-R1 authorization:

- PR: `#51 — docs(kdo): authorize H4-R1 one-shot approval contracts`
- authorization head: `c8e784e31bab34cc595fbc77c9fbbf5ee3f01e93`
- authorization merge: `fbac06934eaf55c173a70ddf24a42ecb2323c2b8`
- document: `docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_AUTHORIZATION_2026-08-14.md`

Supplemental legacy-test reconciliation authorization:

- PR: `#53 — docs(kdo): authorize H4-R1 legacy test reconciliation`
- authorization head: `bf9dca014b14b343f5b882a0cf09f860fb23aa74`
- authorization merge / current implementation base: `0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7`
- document: `docs/planning/KODAC_KDO_H4_R1_LEGACY_TEST_RECONCILIATION_AUTHORIZATION_2026-08-14.md`

Implementation PR:

`#52 — feat(kdo): implement H4-R1 one-shot approval contracts`

Implementation branch:

`feat/kdo-h4-r1-one-shot-approval`

## 3. Bounded target

H4-R1 target:

`K2 policy ask + explicit one-shot approval + durable approval evidence -> one execution attempt of the exact bound intent`

Authority composition preserved by the candidate:

1. K2 constructs the exact execution intent.
2. Existing K2 policy remains authoritative.
3. `deny` blocks and never consults approval.
4. `allow` executes without approval.
5. Only `ask` may consult an explicitly injected H4-R1 approval runtime.
6. The approval request is bound to the exact intent plus a per-invocation request instance.
7. `asked` evidence must persist before a decision is used.
8. `decided` evidence must persist before side effects.
9. Only `allowed-once` can permit this one invocation to proceed.
10. `rejected`, `cancelled`, `unavailable`, malformed, mismatched, absent, and failed decisions remain fail-closed.
11. Execution still occurs only through `ExecutionGateway`.
12. K2 execution receipts remain execution-outcome authority.

## 4. Certified pre-ledger head

Exact pre-ledger implementation head:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

Exact canonical base at that head:

`0bf9ca5cd4d152b6a1758c7f962ba81bdba4d1f7`

PR state at pre-ledger certification:

`OPEN / DRAFT / NOT MERGED`

Changed files at the exact pre-ledger head:

`8`

The evidence ledger was absent at this head.

## 5. Exact pre-ledger changed paths

The exact changed paths were:

1. `packages/kodac-runtime/src/evidence/receipt.ts`
2. `packages/kodac-runtime/src/execution/gateway.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/src/trust/approval.ts`
5. `packages/kodac-runtime/test/kdo-h1-extension-capability.test.ts`
6. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
7. `packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts`
8. `packages/kodac-runtime/test/kdo-h4-r1-one-shot-approval.test.ts`

These paths are exactly within the combined original H4-R1 allowlist plus the three supplemental legacy-test paths authorized by PR #53.

`packages/kodac-runtime/test/gateway.test.ts` was authorized but did not require modification.

No other production or test path changed at the pre-ledger head.

## 6. Approval contract evidence

`packages/kodac-runtime/src/trust/approval.ts` establishes:

- version: `kodac-h4-r1-one-shot-approval-v1`;
- closed outcomes:
  - `allowed-once`;
  - `rejected`;
  - `cancelled`;
  - `unavailable`;
- deterministic structural request identity over the exact K2 execution intent;
- independent `requestInstanceId` for each invocation;
- strict decision shape validation;
- exact request-identity matching;
- exact request-instance matching;
- explicit `asked` and `decided` evidence phases;
- deterministic evidence identities;
- no persistent grant object;
- no `allow-always` outcome;
- no wildcard or cached approval authority.

The approval service returns untrusted `unknown` data. K2 validates the decision before using it.

## 7. Gateway composition evidence

`packages/kodac-runtime/src/execution/gateway.ts` preserves K2 as the sole execution authority.

Observed candidate behavior:

- `allow` returns from the approval gate without consulting an approval service;
- `deny` emits blocked K2 evidence and never consults approval;
- `ask` without an approval runtime remains blocked;
- `ask` with an approval runtime persists `asked` evidence before consulting the decision;
- decision service exceptions fail closed as `unavailable` unless the request was aborted, in which case the outcome is `cancelled`;
- malformed or mismatched decisions fail closed;
- `decided` evidence must persist before an `allowed-once` result can proceed;
- post-decision abort is checked before execution begins;
- non-allowed outcomes emit blocked K2 receipts;
- an `allowed-once` execution receipt binds the exact request identity, request instance, and decision-evidence identity;
- K2 receipt persistence failure remains `ExecutionUnprovenError` and is not converted into approval success.

## 8. Exact command-envelope binding correction

Manual review of the first H4-R1 candidate identified an ambient-environment time-of-check/time-of-use gap for generic command execution.

Before the correction, when `options.env` was omitted, the approval identity did not bind the inherited `process.env` that Node would later use at process spawn.

The corrected implementation:

- snapshots the effective environment before K2 policy/approval;
- canonicalizes environment keys deterministically;
- includes that exact captured environment, executable, arguments, allowed exit codes, output-byte bound, and timeout in the command `inputDigest`;
- passes the same captured environment object to `execFile` after approval.

Therefore an approval service cannot approve one ambient environment and then cause the command to inherit a later ambient environment by mutating `process.env` while approval is pending.

Focused regression evidence proves that an environment value changed from `before` to `after` during approval still executes with the captured `before` value.

Only the digest is stored in the K2/approval intent; raw environment values are not persisted in approval evidence.

## 9. Abort evidence

The focused suite proves:

- an already-aborted command approval records `cancelled` and never consults the approval service;
- an already-aborted `applyPatch` approval records `cancelled` before mutation;
- after an `allowed-once` decision, a signal observed aborted before execution prevents execution.

H4-R1 does not claim generic mid-side-effect cancellation beyond the execution APIs' existing cancellation capabilities.

## 10. One-shot and replay resistance evidence

Focused tests prove:

- the same structural intent produces the same structural request identity;
- each invocation receives a distinct `requestInstanceId`;
- a prior `allowed-once` result cannot authorize the next identical invocation;
- concurrent structurally identical asks receive distinct request instances;
- a decision must echo both the exact request identity and exact request instance;
- stale, malformed, or mismatched decision data fails closed rather than becoming a grant.

No persistent approval cache or grant registry was introduced.

## 11. Evidence ordering evidence

Focused tests prove the required fail-closed ordering:

`asked evidence -> decision -> decided evidence -> side effect`

Specifically:

- failure to persist `asked` evidence blocks before the approval service is consulted;
- failure to persist `decided` evidence blocks an `allowed-once` decision before side effects;
- successful `decided` evidence is already present while the test verifies the mutation target is still absent;
- K2 execution receipt evidence remains a separate later authority for execution outcome.

Approval evidence does not claim that execution succeeded.

## 12. K2 receipt binding

`packages/kodac-runtime/src/evidence/receipt.ts` adds an optional H4-R1 approval binding containing only:

- H4-R1 version;
- request identity;
- request instance ID;
- decision-evidence identity;
- exact outcome `allowed-once`.

The existing K2 receipt remains the execution-result record.

A receipt without approval remains valid for K2 `allow` flows and blocked non-approved flows. The H4 binding does not create execution authority independently of the gateway.

## 13. Legacy test reconciliation evidence

The original H4-R1 authorization explicitly allowed `ExecutionGateway` to change. Three historical H1/H2 tests nevertheless retained a pre-H4 permanent blob pin for that file.

At corrected implementation head:

`49f6326953c64d4e73e0ec8aa33d74b60b59ab07`

the H4-R1 focused behavior passed, but the complete runtime suite failed exactly three stale blob assertions:

`tests=398, pass=395, fail=3`

All three expected the pre-H4 gateway blob:

`be5926e9a8dc5c4c29d441dac11661d71e797015`

The supplemental authorization in PR #53 was created and merged before those historical tests were changed.

The implementation branch was then synchronized with canonical `main` through non-force merge commit:

`cafe376cfa721d82932f0af873ad1ab5d44cabc3`

The authorized reconciliation then removed only the obsolete `ExecutionGateway` pin from:

- `kdo-h1-extension-capability.test.ts`;
- `kdo-h2-r1-model-visible-request.test.ts`;
- `kdo-h2-r2-event-derived-history.test.ts`.

All other historical H1/H2 protected-surface assertions remain.

No replacement H4 gateway hash was inserted into those historical slices.

The H2-R1 and H2-R2 files also acquired a final newline because their prior bytes lacked one; no assertion or semantic content beyond the authorized gateway-pin deletion changed.

## 14. Exact pre-ledger CI matrix

All required PR-triggered workflows completed successfully on exact head:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

### Governance

Workflow:

`31805726920 — governance — PASS`

### K3-R4

Workflow:

`31805726913 — k3-r4-adapter — PASS`

### K3-R5

Workflow:

`31805726942 — k3-r5-context-engine — PASS`

### K2 runtime

Workflow:

`31805726916 — k2-runtime — PASS`

Jobs:

- `94784058603 — runtime-change-classifier — PASS`
- `94784088739 — runtime (macos-latest) — PASS`
- `94784088753 — runtime (ubuntu-latest) — PASS`
- `94784088783 — runtime (windows-latest) — PASS`
- `94785095890 — k2-runtime-gate — PASS`

Each platform runtime job completed:

- TypeScript typecheck;
- complete runtime tests;
- patch benchmark hook.

## 15. Exact test evidence

Ubuntu exact-head runtime output reported:

- tests: `398`
- pass: `397`
- fail: `0`
- skipped: `1`
- cancelled: `0`
- todo: `0`

The single skip is the existing platform-qualified ast-grep identity test and is unrelated to H4-R1.

The Ubuntu patch benchmark also passed and reported the expected `patch-parse-v1` result.

macOS and Windows jobs also completed typecheck, complete tests, and patch benchmark successfully.

## 16. Focused H4-R1 behavior proofs

The complete exact-head runtime log records PASS for all focused H4-R1 cases, including:

- `allow policy executes without consulting approval`;
- `deny policy blocks without consulting approval`;
- `ask without an approval runtime preserves the fail-closed default`;
- `ask with rejected remains blocked with asked/decided evidence`;
- `ask with cancelled remains blocked with asked/decided evidence`;
- `ask with unavailable remains blocked with asked/decided evidence`;
- `approval service failure becomes unavailable and remains blocked`;
- `malformed or mismatched decisions fail closed as unavailable`;
- `allowed-once persists decided evidence before mutation and binds the K2 receipt`;
- `allowed-once is consumed by one invocation and cannot authorize the next identical ask`;
- `concurrent identical asks receive distinct one-shot request instances`;
- `asked evidence failure blocks before the approval service is consulted`;
- `decided evidence failure blocks allowed-once before side effects`;
- `an already-aborted approval is recorded as cancelled and never consults the service`;
- `an already-aborted applyPatch approval is cancelled before mutation`;
- `K2 execution receipt persistence failure remains ExecutionUnprovenError after allowed-once`;
- `approval request identity binds execution environment and bounds`;
- `ambient environment is snapshotted before approval and cannot drift before execution`.

The existing legacy gateway test `ask policy requires approval and does not mutate` also remains PASS, proving the default K2 `ask` behavior remains fail-closed when no H4 approval runtime is injected.

## 17. Protected-boundary evidence

The final pre-ledger PR path list contains no changes to:

- `packages/kodac-runtime/src/trust/policy.ts`;
- model providers or provider transports;
- `packages/kodac-runtime/src/model/turn.ts`;
- H2 request/history/session production files;
- `packages/kodac-runtime/src/tools/registry.ts`;
- `packages/kodac-runtime/src/runtime/orchestrator.ts`;
- `packages/kodac-runtime/src/verification/done-gate.ts`;
- agent loop;
- sandbox/confinement code;
- H5 guarded tool-pipeline code.

The reconciled H1/H2 historical tests preserve their still-valid provider, ToolRegistry, RuntimeOrchestrator, model-turn, and Done Gate blob protections.

## 18. Exact-head review evidence

A manual exact-head review was performed against:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

Review focus included:

- exact request and request-instance binding;
- one-shot replay resistance;
- concurrent identical approval separation;
- evidence ordering;
- decision validation;
- unavailable/cancelled fail-closed behavior;
- abort handling;
- execution-envelope continuity;
- K2 receipt authority;
- absence of persistent grants;
- preservation of protected H1/H2/K2/Done Gate boundaries;
- exact supplemental legacy-test scope.

No remaining actionable finding was identified by the manual review.

At the pre-ledger head:

- submitted reviews: `0`;
- unresolved inline review threads: `0`.

CodeRabbit's automatic review was skipped because the PR remained Draft. An explicit exact-head review command was posted while Draft; no automated finding or inline thread was produced before pre-ledger certification. The canonical H4-R1 gate treats automated review as optional; manual exact-head review and zero unresolved threads are the authority used here.

## 19. Pre-ledger decision

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

This statement applies only to:

`212e76dfb9753d0e51286f18978f6b1d5a8288c0`

It does not certify the ledger-bearing head created by this file.

## 20. Required post-ledger gate

The commit containing this ledger MUST now independently satisfy:

- exact allowed-path check, including this ledger as the ninth changed path;
- TypeScript typecheck PASS;
- complete runtime suite PASS;
- focused H4-R1 tests PASS;
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

Only then may PR #52 be marked Ready and considered for expected-head merge.

## 21. Bounded completion claim

The only H4-R1 completion claim permitted after successful post-ledger certification and expected-head merge is:

`KODAC_ONE_SHOT_APPROVAL_EVIDENCE_BOUND`

Bounded meaning:

**Kodac can resolve an existing K2 `ask` decision through an explicit, exact-intent, one-shot approval request whose asked/decided evidence is persisted before side effects, without permitting approval to override K2 `deny`, become a persistent grant, or replace K2 execution receipts.**

## 22. Explicit non-claims

This ledger does NOT claim:

- `H4_COMPLETE`;
- sandbox or confinement readiness;
- any platform sandbox backend;
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
