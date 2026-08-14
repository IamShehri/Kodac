# KDO-H2-R1 Model-Visible Request Reconstruction Evidence

Date: 2026-08-14
Status: PRE-LEDGER CANDIDATE CERTIFIED; LEDGER HEAD RE-CERTIFICATION REQUIRED

## Identity

Repository: `TheHalfMoon/Kodac`

PR: `#45`

Branch: `feat/kdo-h2-r1-model-visible-request`

Canonical H2-R1 authorization: `04cea3fef169411d267100fc510e7d5695bceb23`

Supplemental legacy-test authorization merge: `4a070a3258521bd34ab9dd4476739091e8a10788`

Certified pre-ledger head: `2e0cab36288b5b1177396a25bedb69349a25d336`

This file records H2-R1 evidence only. It does not certify the commit that adds this ledger; that new head must be re-certified before PR #45 may be marked Ready for review.

## Certified invariant

`logged canonical request snapshot == model/messages/tools passed to ModelProvider.generate()`

The runtime records one required `model.request.snapshot` before provider execution and materializes provider-visible `model/messages/tools` from the validated snapshot. Failure to construct, validate, or append that snapshot prevents provider execution.

The snapshot preserves exact ordered messages and exact ordered model-visible tool descriptors. H2-R1 does not re-sort the canonical projection returned by `ToolRegistry.list()`.

The request identity is deterministic SHA-256 over the structural request preimage. Repeated identical provider-boundary requests keep the same structural identity while session event sequence distinguishes occurrences.

## Validation and bounds

The certified implementation fails closed for malformed model-visible structures, including unknown fields, explicit undefined values, non-JSON primitives, non-finite numbers, cycles, sparse arrays, duplicate tool-call ids, duplicate tool names, non-plain objects, object accessors, array accessors, extra array fields, symbol-keyed array fields, and array subclasses.

Object and array descriptor inspection does not invoke getters or serialization hooks while validating these structures.

Explicit item and byte bounds are enforced without truncation. The complete final serialized snapshot, including derived fields and request identity, is checked against `maxSnapshotBytes`; `modelVisibleBytes` retains its preimage measurement meaning.

Runtime UTF-8 byte validation remains authoritative; JSON Schema string-length semantics are not treated as equivalent to UTF-8 byte limits.

## Manual review correction

Exact-head manual review found an additional array-accessor path after the first green pre-ledger candidate. The production correction was committed as:

`bff4624ba395b89f2fef79b481a997f35c6c73db`

Direct regression proof was added as:

`2e0cab36288b5b1177396a25bedb69349a25d336`

The final delta from `bff4624...` to `2e0cab...` changed only `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`, adding 68 test lines and deleting none.

At `2e0cab36288b5b1177396a25bedb69349a25d336`, unresolved inline review threads were zero and no actionable manual-review finding remained. An earlier CodeRabbit run targeted stale head `3afd1e7554a38de14dfdc04f51b5b520640b0642` and is excluded from exact-head certification evidence.

## Certified changed paths before this ledger

The pre-ledger head changed exactly nine authorized paths:

1. `packages/kodac-runtime/src/index.ts`
2. `packages/kodac-runtime/src/model/turn.ts`
3. `packages/kodac-runtime/src/protocol/event.ts`
4. `packages/kodac-runtime/src/session/model-visible-request.ts`
5. `packages/kodac-runtime/test/ask-cli.test.ts`
6. `packages/kodac-runtime/test/kdo-h2-r1-model-visible-request.test.ts`
7. `packages/kodac-runtime/test/model-capabilities.test.ts`
8. `packages/kodac-runtime/test/model-turn.test.ts`
9. `schema/kdo-model-visible-request.schema.json`

This evidence ledger is the tenth and final path authorized by the combined H2-R1 authorizations.

## Donor provenance

Repository: `deepseek-ai/deepseek-harness`

Commit: `47f943859bef60e4160492346772ded9b24f765a`

License: `MIT`

Source: `docs/subsystems/session.md`

Source blob: `aea9d00b38e384e7a973ce168c3a75a62e70a8bb`

Intake mode: `PORT`

## Protected baselines

The H2-R1 focused regression suite preserves these protected identities:

- `src/agent/loop.ts`: `fe92ffdc9cc057d620a8f2de2296e14eec43a1e0`
- `src/tools/registry.ts`: `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `src/model/provider.ts`: `a15f1d86ceab88ab6fa1be787719d222e354e0c4`
- `src/model/openai.ts`: `564851b2dc8cd1aa610fbc7eaa4b5be5853f97f4`
- `src/model/openai-compatible.ts`: `7ed56c7bac8e03d315b465e1f173ad934227051f`
- `src/execution/gateway.ts`: `be5926e9a8dc5c4c29d441dac11661d71e797015`
- `src/verification/done-gate.ts`: `067e147569fa52cc2b04c5df26fbe20a01e958e9`

## Exact-head CI evidence

All certification below is for pre-ledger head `2e0cab36288b5b1177396a25bedb69349a25d336`.

- governance run `31758652208`: SUCCESS
  - provenance: PASS
  - legacy tests: PASS
  - Ruff: PASS
- K3-R4 run `31758652302`: SUCCESS
  - exact-head/scope attestation: PASS
  - full runtime integration tests: PASS
  - unchanged-checkout attestation: PASS
- K3-R5 run `31758652203`: SUCCESS
  - exact-head/scope attestation: PASS
  - bounded deterministic context-engine proof: PASS
  - full runtime integration tests: PASS
  - unchanged-checkout attestation: PASS
- K2 runtime run `31758652272`: SUCCESS
  - runtime classifier `94640003889`: PASS
  - macOS `94640023232`: typecheck, tests, benchmark PASS
  - Windows `94640023248`: typecheck, tests, benchmark PASS
  - Ubuntu `94640023254`: typecheck, tests, benchmark PASS
  - K2 gate `94640196209`: PASS

## Completion claim

The certified evidence supports exactly:

`KODAC_PROVIDER_BOUNDARY_REQUEST_RECONSTRUCTABLE`

This ledger does not establish `FULL_SESSION_EVENT_SOURCED`, `RAW_PROVIDER_WIRE_RECONSTRUCTABLE`, `H2_COMPLETE`, or unrelated `PROVEN_READY` authority.

H2-R2 remains outstanding.

## Mandatory post-ledger gate

After this file is added, the new exact PR head must again pass:

- the full authorized changed-path check;
- governance and provenance;
- TypeScript typecheck and full runtime tests;
- Ubuntu, macOS, and Windows runtime jobs;
- patch benchmarks;
- K3-R4 and K3-R5;
- K2 runtime gate;
- focused H2-R1 regression coverage;
- exact-head review adjudication;
- unresolved review threads = `0`.

Only after those post-ledger gates pass may PR #45 be marked Ready for review.

This ledger grants no merge authority.
