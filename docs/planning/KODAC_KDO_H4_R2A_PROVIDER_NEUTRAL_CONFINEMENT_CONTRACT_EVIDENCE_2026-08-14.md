# Kodac KDO H4-R2A Provider-Neutral Confinement Contract Evidence

Date: 2026-08-14
Status: LEDGER-BEARING CANDIDATE — COMPLETION CLAIM DEFERRED UNTIL POST-LEDGER EXACT-HEAD GATES AND EXPECTED-HEAD MERGE

## 1. Bounded slice

This ledger records evidence for H4-R2A only:

`provider-neutral confinement request / backend descriptor / observed enforcement evidence contracts`

It does not record or claim an operating-system sandbox backend.

The governing invariant is:

`requested confinement policy != observed confinement enforcement`

## 2. Canonical authorization

Repository:

`TheHalfMoon/Kodac`

Canonical H4-R2A authorization PR:

`#55 — docs(kdo): authorize H4-R2A confinement contracts`

Authorization merge commit / implementation base:

`d0a4e7f03482500a389c1716047fe60a0d32c14d`

Authorization document:

`docs/planning/KODAC_KDO_H4_R2A_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_AUTHORIZATION_2026-08-14.md`

## 3. Donor provenance

Reference donor:

`deepseek-ai/deepseek-harness`

Admitted donor commit:

`47f943859bef60e4160492346772ded9b24f765a`

Root license:

MIT

Admitted sandbox note pinned by canonical H3:

`.agents/notes/implemented/feature/2026-07-06-sandbox.md`

Blob:

`62c46c99a2283b03cf75d8823783367dd6b3473a`

Only contract principles were adapted. No donor sandbox runtime/backend code or provider-global authority was imported.

## 4. Accepted pre-ledger exact head

Accepted pre-ledger implementation head:

`3fa0e3712f9d3968ffd94c880be92b23f6ea3079`

This is the only pre-ledger head used as positive certification evidence in this ledger.

## 5. Exact pre-ledger changed paths

Exactly four paths differed from the canonical authorization base before this ledger was added:

1. `packages/kodac-runtime/src/trust/confinement.ts`
2. `packages/kodac-runtime/src/index.ts`
3. `schema/kdo-h4-r2a-confinement.schema.json`
4. `packages/kodac-runtime/test/kdo-h4-r2a-confinement-contract.test.ts`

The authorized evidence-ledger path was absent at that head.

No other implementation path changed.

## 6. Contract vocabulary

Requested confinement modes are exactly:

- `read-only`
- `workspace-write`
- `danger-full-access`

Observed enforcement results are exactly:

- `full`
- `partial`
- `unavailable`

Requested mode and observed result are distinct fields and distinct semantic planes.

No requested mode is proof of enforcement.

`partial` and `unavailable` are not promoted to `full`.

## 7. Structural request contract

`ConfinementRequest` binds:

- fixed version `kodac-h4-r2a-confinement-v1`;
- deterministic SHA-256 `requestIdentity`;
- requested mode;
- opaque canonical `workspaceIdentity`;
- caller-supplied `executionIntentIdentity`;
- bounded canonical read/write scope.

Scope paths are:

- portable workspace-relative;
- traversal-free;
- sorted canonically before acceptance by requiring canonical input order;
- duplicate-free;
- disjoint between read and write arrays;
- byte-bounded;
- deeply detached/frozen after construction.

## 8. Backend descriptor contract

`ConfinementBackendDescriptor` is inert structural data only.

It binds:

- fixed contract version;
- deterministic SHA-256 `backendIdentity`;
- bounded name;
- bounded revision;
- platform family;
- closed, canonical, duplicate-free supported-mode list.

It contains no callback, process launcher, network endpoint, dynamic loader, registry authority, or enforcement capability.

## 9. Observed enforcement evidence contract

`ConfinementEnforcementEvidence` binds:

- fixed evidence version `kodac-h4-r2a-enforcement-evidence-v1`;
- deterministic SHA-256 `evidenceIdentity`;
- exact `requestIdentity` supplied by the trusted caller contract;
- exact `executionAttemptIdentity` supplied by the trusted caller contract;
- validated inert backend descriptor;
- observed result `full | partial | unavailable`;
- bounded reason.

Evidence identity is independently recomputable from those structural fields.

Construction/validation does not execute, probe, or infer an operating-system sandbox.

## 10. Hook-free structural validation

The implementation rejects authority-bearing structural values that could hide executable JavaScript behavior.

It rejects at minimum:

- non-plain objects;
- class instances;
- sparse arrays;
- array accessors;
- object accessors;
- symbol fields;
- hidden/non-enumerable object fields;
- unexpected array fields;
- Proxy-backed objects;
- Proxy-backed arrays;
- malformed identities;
- unknown fields;
- unknown enum values.

Proxy-backed inputs are detected before reflective operations that would invoke proxy traps.

Focused regression evidence proves accessor getters and Proxy traps remain unexecuted during rejection.

## 11. Explicit bounds

Runtime authority uses UTF-8 byte bounds where relevant.

Current explicit limits include:

- path: 1024 UTF-8 bytes;
- read-scope entries: 256;
- write-scope entries: 256;
- backend name: 160 UTF-8 bytes;
- backend revision: 256 UTF-8 bytes;
- enforcement reason: 4096 UTF-8 bytes;
- identity fields: lowercase 64-hex SHA-256 structural identities.

Focused tests prove over-limit data fails closed without truncation.

The contract has fixed structural depth rather than recursive arbitrary JSON payloads; it admits no recursive authority-bearing data structure.

## 12. JSON Schema relationship

Published schema:

`schema/kdo-h4-r2a-confinement.schema.json`

The schema is strict about:

- closed object shapes;
- required fields;
- identity patterns;
- closed enum vocabularies;
- collection item counts;
- uniqueness where structurally expressible.

The schema intentionally does not use JSON Schema `maxLength` as a false substitute for runtime UTF-8 byte bounds.

Runtime validation remains authority for UTF-8 byte limits and canonical ordering/path semantics.

## 13. Production purity

Production confinement contract module:

`packages/kodac-runtime/src/trust/confinement.ts`

Permitted Node imports are limited to deterministic/runtime-introspection support used by the structural validator:

- `node:crypto`
- `node:util` (`types.isProxy` only for rejecting Proxy-backed structural values)

The module contains no:

- child-process launch;
- shell execution;
- filesystem read/write/probe;
- network access;
- ambient environment read;
- PATH resolution;
- executable hashing/opening;
- OS sandbox API;
- dynamic code loading.

## 14. Protected authority surfaces

The H4-R2A focused suite proves the following canonical authorization-base authority surfaces remain byte-identical:

- `packages/kodac-runtime/src/execution/gateway.ts` — `8b481c226276d0b06fabc8d614c1295cd0881a6a`
- `packages/kodac-runtime/src/trust/policy.ts` — `b4134e430204123bebe053ffc9105f05fca611c9`
- `packages/kodac-runtime/src/trust/approval.ts` — `d36a604cb1957bc65dac3978c626ba48a9b299fb`
- `packages/kodac-runtime/src/evidence/receipt.ts` — `bc11267496f8c8a2ca1dac713baccf88ec962b19`

H4-R2A therefore does not re-enable external-process one-shot approval and does not alter K2/H4-R1 execution authority.

## 15. Pre-ledger exact-head CI evidence

Exact head:

`3fa0e3712f9d3968ffd94c880be92b23f6ea3079`

Workflow results:

- governance run `31821174831` — PASS
- K3-R4 run `31821175338` — PASS
- K3-R5 run `31821176104` — PASS
- K2 runtime run `31821176003` — PASS

K2 jobs:

- runtime-change-classifier `94834481489` — PASS
- Ubuntu runtime `94834516853` — typecheck PASS / full tests PASS / patch benchmark PASS
- Windows runtime `94834516948` — typecheck PASS / full tests PASS / patch benchmark PASS
- macOS runtime `94834516991` — typecheck PASS / full tests PASS / patch benchmark PASS
- K2 final gate `94834734383` — PASS

Ubuntu full runtime suite:

- tests: 417
- pass: 416
- fail: 0
- cancelled: 0
- skipped: 1 existing platform qualification skip
- todo: 0

## 16. Focused H4-R2A proofs observed PASS

The exact-head full runtime output includes PASS for:

- closed requested/observed vocabularies;
- deterministic request identity bound to mode/workspace/intent/scope;
- strict canonical bounded immutable scope;
- unknown fields/enums/malformed identities/non-plain inputs fail closed;
- sparse/accessor/symbol/hidden/Proxy structural hooks fail closed without executing traps;
- inert deterministic immutable backend descriptors;
- enforcement evidence bound to request/attempt/backend while preserving partial/unavailable;
- all explicit H4-R2A item and UTF-8 byte bounds fail closed without truncation;
- schema parity without fake `maxLength` byte semantics;
- production purity and protected authority surfaces byte-identical.

## 17. Pre-ledger review gate

At accepted pre-ledger head:

- exact changed paths: 4 authorized paths;
- evidence ledger: absent;
- unresolved inline review threads: 0;
- CodeRabbit exact-head status: SUCCESS;
- manual architecture review: PASS after proactively closing accessor/hidden/sparse/Proxy hook surfaces and explicit bound proofs.

Pre-ledger verdict:

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

## 18. Historical non-certifying heads

The following earlier heads are explicitly historical and MUST NOT be reused as certification:

- `a75c705c944cf22a84807612fe5ac0f087b190c6` — initial candidate; focused fixture incorrectly fed derived fields back into a strict constructor and exposed incomplete proof state.
- `754eb9b76615b69c2b45ed51fa6980b69b33cf4f` — fixture-corrected candidate; later superseded by hook-free structural hardening.
- `5f782920eb3a56d262df775968c08fe0c7389d1e` — accessor/sparse hardening candidate; failed TypeScript descriptor typing.
- `95b41f9a19def9b1f169de3355fc61e27155df7f` — descriptor-typing-corrected candidate; superseded because explicit runtime-bound proofs were incomplete.
- `1589e55d74ca13ee611cda3c9f1650016a77e31a` — bounds-proven green candidate; superseded after manual review identified Proxy trap risk.
- `dd6688b44acd546ef8af7f4ebb2e35c7b74056b5` — production Proxy-rejection intermediate commit before its focused regression proof.

Only `3fa0e3712f9d3968ffd94c880be92b23f6ea3079` is the accepted pre-ledger head.

## 19. Evidence boundary

This ledger proves only a provider-neutral structural contract/evidence plane.

It does not prove the truthfulness of a future backend's observation merely because a descriptor/evidence object is structurally valid.

Future trusted platform/backend integration must independently establish that observed enforcement evidence corresponds to actual enforced operating-system state for the bound execution attempt.

A self-asserted backend label is not sandbox proof.

## 20. Explicit non-claims

H4-R2A does NOT claim:

- `H4_R2_COMPLETE`;
- `H4_COMPLETE`;
- `SANDBOX_ENFORCED`;
- `EXTERNAL_PROCESS_APPROVAL_READY`;
- Linux namespaces/seccomp/Landlock/bwrap enforcement;
- macOS Seatbelt enforcement;
- Windows AppContainer/restricted-token/job-object enforcement;
- network isolation;
- syscall filtering;
- executable-byte pinning;
- handle-based execution;
- transactional rollback;
- persistent approvals;
- `allow-always`;
- H5 guarded tool pipeline readiness;
- Done Gate replacement;
- unrelated `PROVEN_READY`.

## 21. Ledger sequencing

This file is the only authorized delta after the accepted pre-ledger head.

Its addition creates a new ledger-bearing head.

All pre-ledger workflow/review results above become historical evidence for the pre-ledger candidate only and MUST NOT be treated as post-ledger certification.

The new ledger-bearing head must independently pass the required CI/review gate.

## 22. Deferred bounded completion claim

Only after:

1. this ledger is the only post-pre-ledger delta;
2. ledger-bearing exact-head governance/K2/K3 gates pass;
3. exact-head review findings are adjudicated;
4. unresolved review threads are zero;
5. PR #56 is merged with expected-head protection;
6. canonical `main` is verified to contain the exact merge;

may Kodac claim:

`KODAC_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_BOUND`

The ledger is intentionally non-self-certifying: immutable GitHub CI/review/merge state certifies the ledger-bearing head without creating a circular follow-up ledger commit.

## 23. Next slice boundary

After H4-R2A is canonical, the next work must remain separately authorized.

Recommended next step:

H4-R2B — one concrete platform confinement backend with observed-enforcement proof.

No H4-R2B backend implementation is authorized by this ledger.
