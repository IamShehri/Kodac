# KDO-H5-R1B — Evidence-Preserving Tool-Result Pruning Integration Evidence

Date: 2026-08-15
Status: POST-PRE-LEDGER EVIDENCE RECORD — REQUIRES FRESH POST-LEDGER CERTIFICATION

## 1. Claim boundary

This ledger records evidence for the bounded claim:

```text
KODAC_EVIDENCE_PRESERVING_TOOL_RESULT_PRUNING_INTEGRATION_PROVEN
```

The claim is not available merely because this file exists. It becomes available only after this ledger-bearing exact head receives fresh post-ledger certification and the pull request is merged canonically.

This ledger does **not** claim H5 complete, H6 ready, autonomous subagents, delegation, background jobs, writable memory, adaptive/model-directed pruning, or any widening of K2/Done Gate authority.

## 2. Canonical authorization

Repository:

```text
TheHalfMoon/Kodac
```

Canonical authorization base:

```text
main@44c45d6d844da297ad947ae120909ab141f833b6
```

Authorization PR:

```text
#75 — docs(kdo): authorize H5-R1B evidence-preserving pruning integration
```

Implementation PR:

```text
#76 — feat(kdo): integrate H5-R1B evidence-preserving pruning
```

Branch:

```text
feat/kdo-h5-r1b-evidence-preserving-pruning
```

## 3. Pre-ledger exact identity

Accepted pre-ledger head:

```text
4034eb4a56d96d598b396a49f39ef29b9010c318
```

Accepted pre-ledger tree:

```text
5f767652e92e6000daea866738833ba2e8c392ce
```

Merge base / canonical base:

```text
44c45d6d844da297ad947ae120909ab141f833b6
```

Ahead / behind at pre-ledger certification:

```text
AHEAD=16
BEHIND=0
```

## 4. Exact pre-ledger changed-path set

Exactly eight paths changed from canonical base to accepted pre-ledger head:

```text
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/protocol/event.ts
packages/kodac-runtime/src/session/model-visible-history.ts
packages/kodac-runtime/test/kdo-h2-r2-event-derived-history.test.ts
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r1b-evidence-preserving-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
```

All eight are inside the canonical R1B pre-ledger allowlist. No ledger existed on the accepted pre-ledger head.

## 5. Integration theorem proven

The accepted implementation proves this pipeline:

```text
RAW CANONICAL HISTORY EVENTS
-> projectModelVisibleHistory replay
-> unchanged canonical R1A deterministic prune(messages, policy)
-> durable structural model.history.tool_result_pruning.applied event
-> reproject including the durable transformation
-> bounded working model-visible messages
-> unchanged H2 createModelVisibleRequestSnapshot/provider path
```

The canonical source history records remain present and recoverable. The pruning record stores structural policy/identity/change evidence rather than raw tool-result bodies. The projector re-runs the unchanged R1A primitive and fails closed unless input/output/result identities and the ordered change set exactly match the durable record.

## 6. Policy and no-op semantics

The R1B integration is explicit-policy only:

```text
NO POLICY
=> NO PRUNING TRANSFORMATION

POLICY + ZERO DETERMINISTIC CHANGES
=> NO PRUNING TRANSFORMATION EVENT

POLICY + CHANGES
=> DURABLE TRANSFORMATION EVENT REQUIRED BEFORE THE NEXT PROVIDER REQUEST
```

`toolResultPruningMaxBytes` is a primitive caller-provided bound. Invalid primitive values and hostile object substitutes fail before event emission or provider invocation.

Legacy `limits.maxToolResultChars` remains a distinct earlier character-based loop bound and is not redefined as R1B evidence-preserving byte pruning.

## 7. Durable evidence ordering and failure behavior

Focused proof establishes:

- canonical raw tool-result history is durably appended before pruning;
- the R1B transformation record is durably appended before the later H2 snapshot/provider request;
- reprojected bounded messages are exactly the messages presented at the later H2/provider boundary;
- transformation sink rejection prevents the later provider request;
- a rejected transformation event is not journaled as successful evidence;
- unsupported future required `model.history.*` events fail closed.

## 8. Structural record and replay proof

R1B record version:

```text
kodac-tool-result-pruning-history-v1
```

Canonical record maximum:

```text
262144 canonical JSON bytes
```

The record binds:

- `afterRequestIdentity`;
- canonical R1A policy identity;
- R1A input identity;
- R1A output identity;
- R1A result identity;
- strictly ordered structural change records;
- record preimage byte count;
- record identity.

Validation rejects stale anchors, altered identities, reordered changes, unsupported versions, sparse/symbol/non-enumerable/accessor structures, cycles, and Proxies. Proxy detection occurs before structural reflection via `node:util` `utilTypes.isProxy`, matching the existing R1A fail-closed structural pattern.

## 9. Canonical R1A preservation

The canonical R1A pruning primitive remains byte-identical:

```text
packages/kodac-runtime/src/agent/tool-result-pruning.ts
blob 66cfee69032c4c24331e8cb9098a86a1d7b9135e
```

R1A semantics retained:

```text
version: kodac-tool-result-pruning-v1
strategy: head-tail-equal-v1
marker: [kodac-tool-result-pruned-v1 original-bytes=...]
minToolResultBytes: 128
```

R1B integrates the primitive only through authorized loop/history replay. `src/model/turn.ts` does not import or invoke pruning.

Canonical R1A predecessor documents at the R1B base were attested as:

```text
KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_AUTHORIZATION_2026-08-15.md
blob e61d416a04945f65589e19f4c1969934aeada695

KODAC_KDO_H5_R1A_MODEL_FREE_TOOL_RESULT_PRUNING_EVIDENCE_2026-08-15.md
blob 1cdf9aefd50b0a008fb2eac6a52764a4e34b6498
```

## 10. H2 / R2B / R3A / R3B authority preservation

Historical regression tests were reconciled only where the R1B authorization explicitly superseded old non-integration/blob-pin assertions. No test was deleted, skipped, or bypassed.

The strengthened semantic proofs establish:

- H2 history may import only the pure R1A pruning surface plus existing pure structural dependencies and `node:util` Proxy introspection;
- H2 history has no filesystem/process/network/execution authority;
- R2B repeat-call/advisory identity and source binding remain unchanged and passing;
- R3A reducer remains byte-identical and pure;
- R1B history does not import guarded-tool pipeline/plan reducers or guard evidence authority;
- `turn.ts` retains `finalCallIdentity`, `tool.guard.evaluated`, and `tool.guard.execution_observed` ownership and contains no pruning integration;
- R1B cannot rewrite R3B effective-call identity or guard evidence;
- K2 policy/gateway and Done Gate surfaces remain protected.

Protected identities exercised by regression proof include:

```text
R3A guarded-tool-pipeline.ts
876656bf65a67df56c4cd5f078629cde06112af1

Tool registry
0bdf5cfd02efda7cab0c81976c7735bc7b46081b

Runtime orchestrator
b069da69909b282fdbdc2c62279e0297cbd430e9

H2 model-visible request
0f4c7ef7ef0f4e4e1baa90944c39639c1dfa07a6

Trust policy
authority blob b4134e430204123bebe053ffc9105f05fca611c9

Execution gateway
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560

Done Gate
067e147569fa52cc2b04c5df26fbe20a01e958e9
```

## 11. UTF-8 and multi-message proof

Focused tests prove deterministic ordered multi-change pruning across multibyte Unicode/emoji text while enforcing the configured UTF-8 byte bound. Only oversized tool-role message content changes; non-tool messages and tool binding fields remain unchanged.

## 12. Hostile-input proof

Focused tests cover and fail closed on:

- hostile non-primitive pruning configuration;
- Proxy pruning records;
- accessor fields;
- cyclic data;
- sparse arrays;
- symbol-keyed data;
- non-enumerable fields;
- stale records;
- tampered record/result identities;
- reordered change evidence;
- unsupported versions;
- out-of-range primitive configuration.

No hostile structural hook is used as permission or execution authority.

## 13. Pre-ledger CI certification

Exact-head runtime workflow:

```text
run 31890006113 — k2-runtime
```

Results:

```text
runtime-change-classifier: PASS
runtime (windows-latest): Typecheck PASS / Test PASS
runtime (ubuntu-latest): Typecheck PASS / Test PASS
runtime (macos-latest): Typecheck PASS / Test PASS
k2-runtime-gate: PASS
```

Exact-head governance workflow:

```text
run 31890006184 — governance
```

Results:

```text
provenance: PASS
legacy-tests: pytest PASS / ruff PASS
governance: PASS
```

Reviewer state:

```text
CodeRabbit: SUCCESS
unresolved inline review threads: 0
```

Ubuntu full runtime test summary on the accepted pre-ledger candidate:

```text
tests: 507
pass: 506
fail: 0
cancelled: 0
skipped: 1
todo: 0
```

The single skip is the pre-existing K3-R4 exact external ast-grep identity fixture; no R1B or reconciled H2/R1A/R3A/R3B test was skipped or deleted.

## 14. K3-R4 applicability proof

Canonical workflow:

```text
.github/workflows/k3-r4-adapter.yml
blob ef5a1c236966644fc7652db5e065a3071e39c0e7
```

Canonical trigger set:

```text
packages/kodac-runtime/src/repository-intelligence/**
packages/kodac-runtime/src/repository/**
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/trust/policy.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/k3-r4-ast-grep-adapter.test.ts
packages/kodac-runtime/test/gateway.test.ts
packages/kodac-runtime/test/fixtures/k3-r1/**
.github/workflows/k3-r4-adapter.yml
```

Intersection with the exact eight-path R1B pre-ledger change set:

```text
EMPTY
```

Classification:

```text
K3-R4 = NOT_APPLICABLE_PATH_FILTER_PROVEN
```

The workflow itself and directly protected K3 surfaces were unchanged, and the full runtime/classifier/K2 gates passed on the exact head.

## 15. K3-R5 applicability proof

Canonical workflow:

```text
.github/workflows/k3-r5-context-engine.yml
blob 0c402c65af6d19b2a514268d4cb51ffc00a6e43a
```

Canonical trigger set:

```text
packages/kodac-runtime/src/context-engine/**
packages/kodac-runtime/src/repository/contracts.ts
packages/kodac-runtime/src/repository-intelligence/contracts.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/k3-r5-context-engine.test.ts
.github/workflows/k3-r5-context-engine.yml
```

Intersection with the exact eight-path R1B pre-ledger change set:

```text
EMPTY
```

Classification:

```text
K3-R5 = NOT_APPLICABLE_PATH_FILTER_PROVEN
```

## 16. Pre-ledger decision

```text
KDO-H5-R1B PRE-LEDGER:
PASS

ACCEPTED HEAD:
4034eb4a56d96d598b396a49f39ef29b9010c318

ACCEPTED TREE:
5f767652e92e6000daea866738833ba2e8c392ce

LEDGER AUTHORIZATION:
OPEN — THIS FILE MAY BE ADDED AS THE ONLY POST-PRE-LEDGER CHANGE
```

## 17. Post-ledger gate requirement

This ledger commit invalidates the pre-ledger head as a current acceptance head. Before merge, the ledger-bearing exact head must receive fresh certification for:

- exact delta = this ledger path only relative to the accepted pre-ledger head;
- implementation/test blobs unchanged from accepted pre-ledger tree;
- governance/provenance/legacy PASS;
- runtime-change-classifier PASS;
- Windows/macOS/Ubuntu Typecheck + full Test PASS;
- K2 runtime gate PASS;
- CodeRabbit SUCCESS;
- zero unresolved review threads;
- K3-R4/R5 applicability recomputed against the ledger-bearing exact head;
- manual theorem/non-authority review repeated against the exact ledger-bearing head.

Only after that fresh post-ledger PASS may PR #76 be made ready and merged at the expected exact head.
