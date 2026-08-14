# KDO-H2-R1 Model-Visible Request Reconstruction Evidence

Date: 2026-08-14
Status: EVIDENCE LEDGER — PRE-LEDGER AND REVIEW-RECONCILIATION EVIDENCE RECORDED; FINAL HEAD CERTIFICATION IS EXTERNAL

## Identity

Repository: `TheHalfMoon/Kodac`

PR: `#45`

Branch: `feat/kdo-h2-r1-model-visible-request`

Canonical H2-R1 authorization: `04cea3fef169411d267100fc510e7d5695bceb23`

Supplemental legacy-test authorization merge: `4a070a3258521bd34ab9dd4476739091e8a10788`

Certified pre-ledger head: `2e0cab36288b5b1177396a25bedb69349a25d336`

Review-reconciliation candidate before this ledger update: `64dbb6add16b058e2324f00542bda87a4579e591`

This file records H2-R1 evidence only. It does not self-certify the commit that contains this ledger. Final certification is established externally by exact-head GitHub Actions and review state so that recording certification does not recursively create another uncertified repository head.

## Certified invariant

`logged canonical request snapshot == model/messages/tools passed to ModelProvider.generate()`

The runtime records one required `model.request.snapshot` before provider execution and materializes provider-visible `model/messages/tools` from the validated snapshot. Failure to construct, validate, or append that snapshot prevents provider execution.

Snapshot-construction rejection records only coarse `model.failed` evidence with stage `request_snapshot`; it does not persist the rejected prompt or raw validation error.

The snapshot preserves exact ordered messages and exact ordered model-visible tool descriptors. H2-R1 does not re-sort the canonical projection returned by `ToolRegistry.list()`.

The request identity is deterministic SHA-256 over the structural request preimage. Repeated identical provider-boundary requests keep the same structural identity while session event sequence distinguishes occurrences.

## Validation, materialization, and bounds

The implementation fails closed for malformed model-visible structures, including unknown fields, explicit undefined values, non-JSON primitives, non-finite numbers, cycles, sparse arrays, duplicate tool-call ids, duplicate tool names, non-plain objects, object accessors, array accessors, extra array fields, symbol-keyed array fields, and array subclasses.

Object and array descriptor inspection does not invoke getters or serialization hooks while validating these structures.

JSON nesting is explicitly bounded by `maxJsonDepth`; deeply nested caller data is rejected with an attributable typed validation error before unbounded recursive traversal can reach provider execution.

Explicit item and byte bounds are enforced without truncation. The complete final serialized snapshot, including derived fields and request identity, is checked against `maxSnapshotBytes`; `modelVisibleBytes` retains its preimage measurement meaning.

Runtime UTF-8 byte validation remains authoritative; JSON Schema string-length semantics are not treated as equivalent to UTF-8 byte limits.

Locally constructed snapshots are tracked by exact object identity inside the snapshot module. Materializing that exact already-validated object avoids redundant full re-validation. Serialized, copied, replayed, or otherwise untrusted snapshot objects continue through the strict validation path and cannot inherit trusted status by structural similarity.

Snapshots remain deeply immutable. Provider-boundary materialization returns independent, deeply mutable JSON copies for tool-call inputs and tool input schemas, preserving the existing mutable `ModelProviderRequest` contract without permitting provider mutation to alter the durable snapshot.

## Manual review correction before ledger creation

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

The H2-R1 focused regression suite preserves these protected repository-path identities:

- `packages/kodac-runtime/src/agent/loop.ts`: `fe92ffdc9cc057d620a8f2de2296e14eec43a1e0`
- `packages/kodac-runtime/src/tools/registry.ts`: `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `packages/kodac-runtime/src/model/provider.ts`: `a15f1d86ceab88ab6fa1be787719d222e354e0c4`
- `packages/kodac-runtime/src/model/openai.ts`: `564851b2dc8cd1aa610fbc7eaa4b5be5853f97f4`
- `packages/kodac-runtime/src/model/openai-compatible.ts`: `7ed56c7bac8e03d315b465e1f173ad934227051f`
- `packages/kodac-runtime/src/execution/gateway.ts`: `be5926e9a8dc5c4c29d441dac11661d71e797015`
- `packages/kodac-runtime/src/verification/done-gate.ts`: `067e147569fa52cc2b04c5df26fbe20a01e958e9`

## Pre-ledger exact-head CI evidence

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

## Post-ledger review reconciliation history

CodeRabbit exact review surfaced five actionable threads after the ledger was added.

Four findings were valid within H2-R1 and were corrected inside already-authorized paths:

1. snapshot-construction failures now emit coarse attributable `model.failed` evidence without raw rejected input;
2. locally created trusted snapshots no longer incur redundant full re-validation during provider materialization, while untrusted serialized/copy inputs remain strict;
3. JSON traversal now has an explicit nesting-depth bound;
4. provider-boundary tool-call inputs and input schemas are deeply mutable independent copies while the durable snapshot remains deeply frozen.

The fifth finding correctly identified evidence-store confidentiality/retention risk but proposed redacting the lossless snapshot. Redaction, digesting, or truncation would violate the authorized H2-R1 reconstructability invariant. Storage permissions, retention/expiry, cleanup, and access policy were therefore separated into tracking issue `#47` (`security(kdo): harden evidence-store access and retention for lossless request snapshots`). CodeRabbit accepted that scope separation and withdrew the redaction finding for PR #45.

Review-reconciliation candidate:

`64dbb6add16b058e2324f00542bda87a4579e591`

At that candidate:

- governance run `31759453804`: SUCCESS;
- K3-R4 run `31759453771`: SUCCESS;
- K3-R5 run `31759453773`: SUCCESS;
- K2 runtime run `31759453764`: SUCCESS;
  - runtime classifier `94642474701`: PASS;
  - Windows `94642493886`: typecheck, tests, benchmark PASS;
  - macOS `94642493894`: typecheck, tests, benchmark PASS;
  - Ubuntu `94642494000`: typecheck, tests, benchmark PASS;
  - K2 runtime gate `94642603744`: PASS.

All five review threads were adjudicated and resolved before this ledger update. These results are historical evidence for the parent review-reconciliation candidate, not self-certification of the commit containing this ledger update.

## Completion claim

The evidence supports exactly:

`KODAC_PROVIDER_BOUNDARY_REQUEST_RECONSTRUCTABLE`

This ledger does not establish `FULL_SESSION_EVENT_SOURCED`, `RAW_PROVIDER_WIRE_RECONSTRUCTABLE`, `H2_COMPLETE`, or unrelated `PROVEN_READY` authority.

H2-R2 remains outstanding.

## Mandatory final exact-head gate

The exact PR head containing this ledger must pass:

- the full authorized ten-path changed-path check;
- governance and provenance;
- TypeScript typecheck and full runtime tests;
- Ubuntu, macOS, and Windows runtime jobs;
- patch benchmarks;
- K3-R4 and K3-R5;
- K2 runtime gate;
- focused H2-R1 regression coverage;
- exact-head review adjudication;
- unresolved review threads = `0`.

Final certification is represented by those external exact-head results and must not be written back into this ledger, because doing so would create another repository head requiring another certification cycle.

Only after those gates pass may PR #45 be marked Ready for review.

This ledger grants no merge authority.
