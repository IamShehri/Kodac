# KDO-H5-R3B-C1 — Guard Plan Module Boundary Correction

Date: 2026-08-15
Status: AUTHORIZATION CORRECTION CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H5-R3B-C1

CANONICAL BASE:
7073468b81f22d9bcd82904c249a693dfd61e3bd

PURPOSE:
KEEP THE PROVEN R3A REDUCER BYTE-IDENTICAL AND ISOLATE R3B PLAN PARSING/APPLICATION IN A NEW PURE COMPANION MODULE

RUNTIME AUTHORITY:
NO EXPANSION

LEDGER:
STILL BLOCKED UNTIL FRESH PRE-LEDGER PASS
```

The canonical R3B authorization permits additive plan semantics inside:

```text
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
```

Implementation design review found a narrower boundary: R3B can keep the proven R3A primitive completely unchanged and place plan validation/application in one new pure module that calls the canonical reducer.

This reduces regression surface and prevents R3B plan syntax from becoming part of the R3A primitive contract.

---

## 2. Corrected production allowlist

Add exactly one new production path:

```text
packages/kodac-runtime/src/agent/guarded-tool-plan.ts
```

The original R3B production paths remain authorized:

```text
packages/kodac-runtime/src/model/turn.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/protocol/event.ts
```

The previously authorized path:

```text
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
```

is narrowed by this correction to:

```text
MUST REMAIN BYTE-IDENTICAL TO CANONICAL R3A BLOB:
876656bf65a67df56c4cd5f078629cde06112af1
```

No R3A version, reducer logic, parser, canonicalization, bound, domain separator, or fixed vector may change in R3B.

---

## 3. Companion module authority boundary

`guarded-tool-plan.ts` must be pure.

Permitted imports are limited to:

```text
node:crypto
./guarded-tool-pipeline.ts
```

It may:

- strictly parse/validate the static serialized R3B plan;
- compute a deterministic R3B plan identity;
- validate plan references against serialized registered name/capability pairs;
- derive provider-exposure reductions by invoking the canonical R3A reducer;
- derive per-call reductions by invoking the canonical R3A reducer;
- return immutable structural results.

It may not:

- execute tools;
- emit session events;
- call models;
- read files/environment/network;
- spawn processes;
- discover/load hooks/plugins/modules;
- call RuntimeOrchestrator or ExecutionGateway;
- grant K2/approval/confinement authority.

---

## 4. Serialized boundaries

The companion module should keep its public authority-relevant boundaries serialized.

Purpose-equivalent API:

```text
reduceGuardedToolExposure(planJson, registeredToolsJson)
  -> planIdentity + effective name/capability subset identities

reduceGuardedToolCallWithPlan(planJson, registeredToolsJson, callJson)
  -> planIdentity + canonical R3A GuardedToolPipelineResult
```

All three inputs are primitive JSON strings checked before parsing.

`registeredToolsJson` contains only bounded `{name, capability}` entries derived from the trusted registry.

`callJson` contains exactly `{toolName, capability, input}` and is built only after provider-call defensive normalization.

This preserves the R3A serialized reducer boundary rather than passing caller-owned object graphs into it.

---

## 5. Plan validation requirements

All original R3B plan requirements remain canonical:

- top-level `version/toolDecisions/callRules` exact schema;
- tool decisions only `observe/remove_tool`;
- call-rule decisions only `observe/block_call/replace_input`;
- bounded rule/decision counts;
- unique rule IDs and rule tool pairs;
- strict duplicate-key rejection;
- JCS-compatible canonical plan identity;
- unknown/stale tool references fail closed;
- no allow/permission decision kind.

The companion module must reuse the canonical R3A reducer for actual monotonic application; it must not implement an independent looser remove/block/rewrite fold.

---

## 6. Tests and evidence

The existing dedicated R3B focused test remains the primary test path and must additionally prove:

- R3A production blob remains exactly `876656bf65a67df56c4cd5f078629cde06112af1`;
- companion module imports only `node:crypto` and the R3A module;
- plan/exposure/call serialized boundaries reject non-string Proxy/accessor/toJSON inputs without executing hooks;
- exposure and call helpers invoke R3A semantics and cannot add tools or change tool/capability;
- fixed R3A vectors remain unchanged.

The future R3B evidence ledger must bind this correction path/blob/merge identity and the new companion-module blob.

---

## 7. Corrected pre-ledger changed-path rule

After this correction becomes canonical, the R3B pre-ledger candidate may change only the original authorized R3B test/integration paths plus:

```text
packages/kodac-runtime/src/agent/guarded-tool-plan.ts
```

and must leave:

```text
packages/kodac-runtime/src/agent/guarded-tool-pipeline.ts
```

byte-identical.

The evidence ledger remains forbidden until a fresh pre-ledger PASS from the corrected canonical base.

---

## 8. Non-claims

R3B-C1 does not authorize any new feature beyond canonical R3B and does not authorize dynamic hooks, command hooks, plugins, K2 override, H2 changes, post-tool rewrite, subagents, worktrees, background jobs, or H6.

Status:

```text
KDO_H5_R3B_C1_PLAN_MODULE_BOUNDARY_READY_FOR_CANONICAL_REVIEW
```
