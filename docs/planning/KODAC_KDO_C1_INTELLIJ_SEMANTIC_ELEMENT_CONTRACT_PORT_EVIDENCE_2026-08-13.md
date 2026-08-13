# KDO-C1 Semantic Element Contract Port — Evidence

Date: 2026-08-13
Authorization base: `d28076f43f09b4c7371f137ab2d88573d04a1727`

## Scope

After this file is added, cumulative C1 scope is exactly four authorized paths:

1. `packages/kodac-runtime/src/semantic/contracts.ts`
2. `packages/kodac-runtime/src/index.ts`
3. `packages/kodac-runtime/test/semantic-element-contracts.test.ts`
4. `docs/planning/KODAC_KDO_C1_INTELLIJ_SEMANTIC_ELEMENT_CONTRACT_PORT_EVIDENCE_2026-08-13.md`

## Donor pin

```text
JetBrains/intellij-community
commit bfca8a6815c70221a574383fc23542afb0af5bf7
intake mode PORT

PsiElement.java                21db939950976e5b94b5d5ec67808e796385cbde
PsiReference.java              9b6a59775fc2acc64365e0a1421a097590ea38df
PsiNamedElement.java           0f75f8e49714dfc085f5e97fed6b76a2a141d738
SmartPsiElementPointer.java    24c3990d3fe1916cccc4f5b8d879600d1a53411b
```

## Implemented contract

C1 adds immutable, deterministic records for semantic source anchors, semantic elements, declarations, references, and stable pointer descriptors. It validates ranges, source binding, parent/child reciprocity, cycles, reference target-state consistency, bounds, and reconstructed identities.

The design keeps these concepts separate:

```text
ELEMENT != DECLARATION != REFERENCE != RESOLUTION RESULT != POINTER
```

The production semantic module imports only `node:crypto`; the regression suite verifies that exact import list.

## Historical corrections

`75620d42a167cfd50d65aa01c64849ad282cb368`
- TypeScript check failed in five test-only tamper fixtures.
- Production semantic contracts had no reported compiler error.
- Tests were rewritten to avoid the invalid direct casts.

`3ea1de841f63f122cb035614395553eb020207e4`
- TypeScript check passed.
- One test failed because the expected SHA ordering was based on input labels instead of lexical digest order.
- Test expectation was corrected; production semantics were unchanged.

`fb155e5f04b7b8aed5aa2a5eb60a1dd90522b2ff`
- Cross-platform runtime checks passed.
- Independent review found the authorization also required a direct production import-surface regression.
- That regression was added.

## Final pre-ledger proof

Head:
`8991435cbb1679d2b5eb5154bcf6690aaa9b407e`

Cumulative comparison from authorization base:

```text
6 commits ahead
0 behind
3 changed paths before evidence ledger
```

Workflow results on this exact head:

```text
governance             SUCCESS
k3-r4-adapter           SUCCESS
k3-r5-context-engine    SUCCESS
k2-runtime              SUCCESS

Ubuntu typecheck/test/patch     SUCCESS
macOS typecheck/test/patch      SUCCESS
Windows typecheck/test/patch    SUCCESS
k2-runtime-gate                 SUCCESS
```

Ubuntu runtime summary:

```text
325 tests
324 passed
0 failed
1 skipped
```

Unresolved review threads at this head: `0`.

CodeRabbit did not produce a review because it reported its service rate limit. This is not treated as a PASS.

## Non-claims

C1 does not implement parsing, semantic indexing, reference-resolution execution, navigation execution, refactoring execution, persistence, or completion authority. Those remain separate future gates.

This ledger moves the branch head, so all proof above becomes historical evidence. The new ledger-bearing head must pass a fresh exact-head certification before merge.
