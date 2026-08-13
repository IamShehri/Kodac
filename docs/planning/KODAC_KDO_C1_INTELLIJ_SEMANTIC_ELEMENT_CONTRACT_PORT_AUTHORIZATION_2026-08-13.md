# KDO-C1 — IntelliJ-Inspired Semantic Element Contract Port Authorization

Date: 2026-08-13
Status: AUTHORIZATION GATE
Canonical base: `07fad595c9b43d16fb809c6ff0e77939e8f23d5e`

## 1. Purpose

Authorize one bounded Developer OS production component gate that ports selected semantic-element contract ideas from the pinned IntelliJ Community donor into a Kodac-native, pure, immutable semantic-record layer.

This authorization does not import the IntelliJ Platform/JVM runtime. It authorizes only contract-level ideas required to represent syntax elements, declarations, references, source anchors, containment, navigation anchors and stable semantic pointers in Kodac-owned data structures.

## 2. Donor provenance

Repository:
`JetBrains/intellij-community`

Pinned source commit:
`bfca8a6815c70221a574383fc23542afb0af5bf7`

Intake mode:
`PORT`

Studied source records:

1. `platform/core-api/src/com/intellij/psi/PsiElement.java`
   - blob: `21db939950976e5b94b5d5ec67808e796385cbde`
   - relevant ideas: language identity, parent/child structure, containing file, text ranges, element/navigation/original-element distinction.

2. `platform/core-api/src/com/intellij/psi/PsiReference.java`
   - blob: `9b6a59775fc2acc64365e0a1421a097590ea38df`
   - relevant ideas: referencing element, reference range, canonical reference text and target-resolution distinction.

3. `platform/core-api/src/com/intellij/psi/PsiNamedElement.java`
   - blob: `0f75f8e49714dfc085f5e97fed6b76a2a141d738`
   - relevant ideas: declarations introduce named entities; references are distinct from declarations.

4. `platform/core-api/src/com/intellij/psi/SmartPsiElementPointer.java`
   - blob: `24c3990d3fe1916cccc4f5b8d879600d1a53411b`
   - relevant ideas: a stable pointer is distinct from the live element instance, may survive reparse, and may later become invalid.

Each studied file carries an Apache-2.0 source notice at this pinned revision. The broader donor/program rights record remains governed by the canonical Kodac Donor Intake Program and its recorded provenance/rights posture.

## 3. Kodac-native model authorized by C1

C1 may define only pure immutable records and deterministic validators/identity builders for these concepts:

- semantic source anchor;
- semantic text range using zero-based UTF-16/code-unit offsets with explicit half-open `[start, end)` semantics;
- semantic element;
- named declaration;
- semantic reference;
- containment relation / parent identity;
- navigation/original semantic identity links;
- stable semantic pointer descriptor;
- deterministic element/declaration/reference/pointer identities;
- strict serialized-record reconstruction validation.

C1 must preserve these distinctions:

```text
SYNTAX / SEMANTIC ELEMENT
    != DECLARATION
    != REFERENCE
    != RESOLUTION RESULT
    != STABLE POINTER
```

A declaration may have a name anchor. A reference may carry canonical text and a reference anchor, but a reference is not itself a declaration merely because text matches a declaration name.

## 4. Source and range binding

Every element/declaration/reference admitted by C1 must be bound to an identified source artifact through immutable source metadata including:

- repository-relative logical path;
- language identity;
- source content identity;
- source revision identity when available;
- absolute half-open source range;
- optional name/reference subrange constrained to the parent range.

Ranges must fail closed on negative offsets, reversed ranges, unsafe numeric values, or subranges outside their containing element.

C1 does not claim that offsets remain valid after file mutation. Cross-revision reattachment is not inferred from a hash or from the old range alone.

## 5. Stable pointer semantics

C1 may define a pointer descriptor that binds:

- source identity;
- logical path;
- language;
- element identity and/or semantic locator fields;
- original source range;
- optional declaration/symbol key when available;
- pointer identity.

The pointer is a locator/evidence record only. It does not itself resolve or mutate source. A later resolver may return:

- exact match;
- relocated match;
- ambiguous;
- invalid/deleted.

C1 itself must not implement reparse tracking or background pointer resolution.

## 6. Declaration and reference semantics

C1 may express bounded declaration kinds and reference records, but must remain language-neutral. Language-specific PSI classes, Java/Kotlin types, compiler symbol tables, overload resolution, type inference and reference resolution execution are outside this slice.

Reference target status may describe only structural truth supplied to the contract, such as `UNRESOLVED`, `SINGLE_TARGET`, or `MULTI_TARGET`. C1 must not invent a resolved target from matching text.

If target identities are supplied, they are deterministic record links, not proof that compiler/language-server resolution has occurred. Provenance/derivation class must remain explicit.

## 7. Determinism and integrity

All C1 identities must be deterministic SHA-256 integrity fingerprints over canonical preimages. They are not signatures, capabilities, authentication or execution authority.

Serialized validators must rebuild derived fields/identities from admitted primitive fields and fail closed on:

- unknown fields;
- unknown enum values;
- malformed identities;
- unsafe paths;
- invalid ranges;
- containment violations;
- mismatched source identity;
- duplicate child/target identities where uniqueness is required;
- inconsistent declaration/reference/pointer roles;
- tampered derived identities.

## 8. Bounds

The implementation must define explicit finite bounds for:

- identifier/name bytes;
- logical-path bytes;
- language-id bytes;
- element-kind bytes;
- canonical-reference text bytes;
- child counts;
- reference target counts;
- pointer locator fields.

No unbounded recursive object graph may be serialized inside a record. Relationships should use identities rather than embedding arbitrary nested trees.

## 9. Exact authorized implementation surface after canonical adoption

Exactly four repository paths may change in the C1 implementation PR:

1. `packages/kodac-runtime/src/semantic/contracts.ts`
2. `packages/kodac-runtime/src/index.ts`
3. `packages/kodac-runtime/test/semantic-element-contracts.test.ts`
4. `docs/planning/KODAC_KDO_C1_INTELLIJ_SEMANTIC_ELEMENT_CONTRACT_PORT_EVIDENCE_2026-08-13.md`

Any fifth path requires a new founder authorization gate.

## 10. Required tests

The implementation must prove at minimum:

- deterministic identities and order-independent canonicalization where order is semantically irrelevant;
- declaration/reference separation;
- source/path/language/content binding;
- range and subrange containment;
- parent/child containment without recursive embedding;
- reference target-state consistency;
- stable-pointer record creation and validation without resolution authority;
- tamper detection by serialized reconstruction;
- bounds and unknown-field rejection;
- donor provenance constants pinned to the exact four blobs above;
- no dependency, network, filesystem, process, model, MCP/HTTP, K2 execution, persistence, index, parser, resolver or refactoring surface in the new production module.

## 11. Explicit non-grants

C1 does NOT authorize:

- wholesale IntelliJ fork or IntelliJ Platform runtime dependency;
- JVM/Kotlin/Java runtime dependency;
- IntelliJ plugin execution;
- parser execution or parser dependency;
- Tree-sitter, SCIP or LSP integration;
- compiler/type-checker execution;
- symbol/reference resolution engine;
- incremental semantic index (reserved for C2);
- Find Usages engine;
- Go-to-Definition execution;
- rename/refactoring execution;
- code completion;
- inspections/quick fixes;
- persistence/database/vector store;
- filesystem/network/process/model execution;
- package/lockfile/dependency changes;
- K2/K3/KRI/Done Gate authority changes;
- repository writes/autofix/merge authority from semantic records;
- `PROVEN_READY` authority.

K2 remains the sole trusted side-effect execution authority. Done Gate retains `PROVEN_READY` authority.

## 12. Merge gate

This authorization PR itself must remain exactly one docs path from canonical base `07fad595c9b43d16fb809c6ff0e77939e8f23d5e`.

Canonical adoption requires:

- exact-head scope proof;
- required governance/runtime checks successful;
- active main protection with no bypass;
- zero unresolved valid review findings;
- merge commit using exact expected head;
- no auto-merge.

After canonical adoption, only the four implementation paths in section 9 are authorized.
