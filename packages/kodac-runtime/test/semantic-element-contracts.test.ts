import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"

import {
  KDO_C1_INTELLIJ_DONOR_PROVENANCE,
  KDO_C1_LIMITS,
  KDO_C1_SEMANTIC_CONTRACT_VERSION,
  createSemanticDeclaration,
  createSemanticElement,
  createSemanticPointer,
  createSemanticReference,
  createSemanticSourceAnchor,
  semanticRangesEqual,
  validateSemanticDeclaration,
  validateSemanticElement,
  validateSemanticElementSet,
  validateSemanticPointer,
  validateSemanticReference,
  validateSemanticSourceAnchor,
} from "../src/semantic/contracts.ts"
import type { SemanticElementInput, SemanticReferenceInput, SemanticSourceAnchorInput } from "../src/semantic/contracts.ts"

const digest = (label: string) => createHash("sha256").update(label, "utf8").digest("hex")
const CONTENT = digest("content-v1")
const OTHER_CONTENT = digest("content-v2")
const REVISION = digest("revision-v1")
const TARGET_A = digest("target-a")
const TARGET_B = digest("target-b")
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function source(overrides: Partial<SemanticSourceAnchorInput> = {}): SemanticSourceAnchorInput {
  return {
    path: "src/example.ts",
    languageId: "typescript",
    contentIdentity: CONTENT,
    sourceLengthCodeUnits: 200,
    range: { start: 0, end: 200 },
    revisionIdentity: REVISION,
    ...overrides,
  }
}

function element(overrides: Partial<SemanticElementInput> = {}) {
  return createSemanticElement({
    ...source({ range: { start: 10, end: 80 } }),
    elementKind: "function.declaration",
    derivation: "parser-derived",
    ...overrides,
  })
}

function reference(overrides: Partial<SemanticReferenceInput> = {}) {
  return createSemanticReference({
    element: element({ range: { start: 30, end: 50 }, elementKind: "identifier.reference" }),
    referenceRange: { start: 32, end: 39 },
    canonicalText: "compute",
    soft: false,
    targetStatus: "UNRESOLVED",
    targetDeclarationIdentities: [],
    resolutionBasis: "unresolved",
    ...overrides,
  })
}

test("pins exact IntelliJ donor provenance", () => {
  assert.equal(KDO_C1_SEMANTIC_CONTRACT_VERSION, "kodac-semantic-contracts-v1")
  assert.equal(KDO_C1_INTELLIJ_DONOR_PROVENANCE.sourceCommit, "bfca8a6815c70221a574383fc23542afb0af5bf7")
  assert.deepEqual(KDO_C1_INTELLIJ_DONOR_PROVENANCE.sourceContracts.map((x) => x.blob), [
    "21db939950976e5b94b5d5ec67808e796385cbde",
    "9b6a59775fc2acc64365e0a1421a097590ea38df",
    "0f75f8e49714dfc085f5e97fed6b76a2a141d738",
    "24c3990d3fe1916cccc4f5b8d879600d1a53411b",
  ])
})

test("source anchors are deterministic and reconstructable", () => {
  const first = createSemanticSourceAnchor(source({ range: { start: 5, end: 25 } }))
  const second = createSemanticSourceAnchor(source({ range: { start: 5, end: 25 } }))
  assert.deepEqual(first, second)
  assert.deepEqual(validateSemanticSourceAnchor(copy(first)), first)
})

test("source anchors reject invalid ranges and ambiguous relative paths", () => {
  const up = ".." + "/x.ts"
  assert.throws(() => createSemanticSourceAnchor(source({ path: up })))
  assert.throws(() => createSemanticSourceAnchor(source({ path: "src//x.ts" })))
  assert.throws(() => createSemanticSourceAnchor(source({ range: { start: -1, end: 1 } })))
  assert.throws(() => createSemanticSourceAnchor(source({ range: { start: 9, end: 8 } })))
  assert.throws(() => createSemanticSourceAnchor(source({ range: { start: 0, end: 201 } })))
})

test("serialized source anchor rejects tampering", () => {
  const tampered = copy(createSemanticSourceAnchor(source())) as Record<string, unknown>
  tampered.range = { start: 0, end: 100 }
  assert.throws(() => validateSemanticSourceAnchor(tampered))
})

test("element intrinsic identity stays stable across relationship changes", () => {
  const bare = element()
  const linked = element({ childElementIdentities: [digest("child")] })
  assert.equal(bare.elementIdentity, linked.elementIdentity)
  assert.notEqual(bare.recordIdentity, linked.recordIdentity)
})

test("child identity sets canonicalize deterministically", () => {
  const a = digest("a")
  const b = digest("b")
  const first = element({ childElementIdentities: [b, a] })
  const second = element({ childElementIdentities: [a, b] })
  assert.deepEqual(first.childElementIdentities, [a, b])
  assert.equal(first.recordIdentity, second.recordIdentity)
})

test("element validation detects record tampering", () => {
  const tampered = copy(element()) as Record<string, unknown>
  tampered.elementKind = "class.declaration"
  assert.throws(() => validateSemanticElement(tampered))
})

test("closed parent-child graph validates reciprocal containment", () => {
  const parentBare = element({ range: { start: 0, end: 120 }, elementKind: "module" })
  const childBare = element({ range: { start: 10, end: 80 }, parentElementIdentity: parentBare.elementIdentity })
  const parent = element({ range: { start: 0, end: 120 }, elementKind: "module", childElementIdentities: [childBare.elementIdentity] })
  const child = element({ range: { start: 10, end: 80 }, parentElementIdentity: parent.elementIdentity })
  assert.equal(validateSemanticElementSet([parent, child]).length, 2)
})

test("element graph rejects missing, source-mismatched, and out-of-range children", () => {
  assert.throws(() => validateSemanticElementSet([element({ childElementIdentities: [digest("missing")] })]))
  const parentBare = element({ range: { start: 0, end: 100 }, elementKind: "module" })
  const foreign = element({ range: { start: 10, end: 20 }, contentIdentity: OTHER_CONTENT, parentElementIdentity: parentBare.elementIdentity })
  const parentForeign = element({ range: { start: 0, end: 100 }, elementKind: "module", childElementIdentities: [foreign.elementIdentity] })
  assert.throws(() => validateSemanticElementSet([parentForeign, foreign]))
  const outside = element({ range: { start: 120, end: 130 }, parentElementIdentity: parentBare.elementIdentity })
  const parentOutside = element({ range: { start: 0, end: 100 }, elementKind: "module", childElementIdentities: [outside.elementIdentity] })
  assert.throws(() => validateSemanticElementSet([parentOutside, outside]))
})

test("element graph rejects reciprocal cycles", () => {
  const aBare = element({ range: { start: 10, end: 20 }, elementKind: "cycle.a" })
  const bBare = element({ range: { start: 10, end: 20 }, elementKind: "cycle.b" })
  const a = element({ range: { start: 10, end: 20 }, elementKind: "cycle.a", parentElementIdentity: bBare.elementIdentity, childElementIdentities: [bBare.elementIdentity] })
  const b = element({ range: { start: 10, end: 20 }, elementKind: "cycle.b", parentElementIdentity: aBare.elementIdentity, childElementIdentities: [aBare.elementIdentity] })
  assert.throws(() => validateSemanticElementSet([a, b]), /cycle/)
})

test("declarations are distinct from elements and name anchors stay contained", () => {
  const declarationElement = element({ range: { start: 20, end: 60 } })
  const declaration = createSemanticDeclaration({
    element: declarationElement,
    declarationKind: "function",
    name: "compute",
    nameRange: { start: 29, end: 36 },
    symbolKey: "typescript:example#compute",
  })
  assert.notEqual(declaration.declarationIdentity, declaration.elementIdentity)
  assert.deepEqual(validateSemanticDeclaration(copy(declaration)), declaration)
  assert.throws(() => createSemanticDeclaration({ element: declarationElement, declarationKind: "function", name: "compute", nameRange: { start: 5, end: 12 } }))
})

test("declaration tampering and excessive names fail closed", () => {
  const declaration = createSemanticDeclaration({ element: element(), declarationKind: "function", name: "compute", nameRange: { start: 20, end: 27 } })
  const tampered = copy(declaration) as Record<string, unknown>
  tampered.name = "changed"
  assert.throws(() => validateSemanticDeclaration(tampered))
  assert.throws(() => createSemanticDeclaration({ element: element(), declarationKind: "function", name: "x".repeat(KDO_C1_LIMITS.maxNameBytes + 1), nameRange: { start: 10, end: 11 } }))
})

test("unresolved references carry no target identities", () => {
  const unresolved = reference()
  assert.equal(unresolved.targetStatus, "UNRESOLVED")
  assert.deepEqual(unresolved.targetDeclarationIdentities, [])
  assert.equal(unresolved.resolutionBasis, "unresolved")
  assert.deepEqual(validateSemanticReference(copy(unresolved)), unresolved)
})

test("reference target status and resolution basis must agree", () => {
  assert.throws(() => reference({ targetDeclarationIdentities: [TARGET_A] }))
  assert.throws(() => reference({ targetStatus: "SINGLE_TARGET", resolutionBasis: "compiler-derived", targetDeclarationIdentities: [] }))
  assert.throws(() => reference({ targetStatus: "SINGLE_TARGET", resolutionBasis: "unresolved", targetDeclarationIdentities: [TARGET_A] }))
  const single = reference({ targetStatus: "SINGLE_TARGET", resolutionBasis: "compiler-derived", targetDeclarationIdentities: [TARGET_A] })
  assert.deepEqual(single.targetDeclarationIdentities, [TARGET_A])
})

test("multi-target references canonicalize target identity order", () => {
  const first = reference({ targetStatus: "MULTI_TARGET", resolutionBasis: "language-server-derived", targetDeclarationIdentities: [TARGET_B, TARGET_A] })
  const second = reference({ targetStatus: "MULTI_TARGET", resolutionBasis: "language-server-derived", targetDeclarationIdentities: [TARGET_A, TARGET_B] })
  assert.deepEqual(first.targetDeclarationIdentities, [TARGET_A, TARGET_B])
  assert.equal(first.referenceIdentity, second.referenceIdentity)
})

test("reference anchors stay within their element and tampering is rejected", () => {
  assert.throws(() => reference({ referenceRange: { start: 5, end: 8 } }))
  const tampered = copy(reference()) as Record<string, unknown>
  tampered.targetStatus = "SINGLE_TARGET"
  assert.throws(() => validateSemanticReference(tampered))
})

test("stable pointer is a locator record with no live resolution state", () => {
  const pointer = createSemanticPointer({ element: element(), declarationIdentity: TARGET_A, symbolKey: "typescript:example#compute" })
  assert.equal("status" in pointer, false)
  assert.deepEqual(validateSemanticPointer(copy(pointer)), pointer)
  const tampered = copy(pointer) as Record<string, unknown>
  tampered.path = "src/other.ts"
  assert.throws(() => validateSemanticPointer(tampered))
})

test("range equality and collection bounds are explicit", () => {
  assert.equal(semanticRangesEqual({ start: 1, end: 2 }, { start: 1, end: 2 }), true)
  assert.equal(semanticRangesEqual({ start: 1, end: 2 }, { start: 1, end: 3 }), false)
  assert.throws(() => element({ childElementIdentities: Array.from({ length: KDO_C1_LIMITS.maxChildren + 1 }, (_, i) => digest(`child-${i}`)) }))
  assert.throws(() => validateSemanticElementSet(Array.from({ length: KDO_C1_LIMITS.maxElementSet + 1 }, () => element())), /bounded size/)
})
