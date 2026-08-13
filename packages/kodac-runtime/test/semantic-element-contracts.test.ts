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
  validateSemanticDeclaration,
  validateSemanticElement,
  validateSemanticElementSet,
  validateSemanticPointer,
  validateSemanticReference,
  validateSemanticSourceAnchor,
} from "../src/semantic/contracts.ts"
import type { SemanticElementInput, SemanticReferenceInput, SemanticSourceAnchorInput } from "../src/semantic/contracts.ts"

const digest = (x: string) => createHash("sha256").update(x).digest("hex")
const CONTENT = digest("content")
const OTHER_CONTENT = digest("other-content")
const REVISION = digest("revision")
const TARGET_A = digest("target-a")
const TARGET_B = digest("target-b")
const copy = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

function source(overrides: Partial<SemanticSourceAnchorInput> = {}): SemanticSourceAnchorInput {
  return { path: "src/example.ts", languageId: "typescript", contentIdentity: CONTENT, sourceLengthCodeUnits: 200, range: { start: 0, end: 200 }, revisionIdentity: REVISION, ...overrides }
}
function element(overrides: Partial<SemanticElementInput> = {}) {
  return createSemanticElement({ ...source({ range: { start: 10, end: 80 } }), elementKind: "function.declaration", derivation: "parser-derived", ...overrides })
}
function reference(overrides: Partial<SemanticReferenceInput> = {}) {
  return createSemanticReference({ element: element({ range: { start: 30, end: 50 }, elementKind: "identifier.reference" }), referenceRange: { start: 32, end: 39 }, canonicalText: "compute", soft: false, targetStatus: "UNRESOLVED", targetDeclarationIdentities: [], resolutionBasis: "unresolved", ...overrides })
}

test("pins exact IntelliJ donor provenance", () => {
  assert.equal(KDO_C1_SEMANTIC_CONTRACT_VERSION, "kodac-semantic-contracts-v1")
  assert.equal(KDO_C1_INTELLIJ_DONOR_PROVENANCE.sourceCommit, "bfca8a6815c70221a574383fc23542afb0af5bf7")
  assert.deepEqual(KDO_C1_INTELLIJ_DONOR_PROVENANCE.sourceContracts.map(x => x.blob), ["21db939950976e5b94b5d5ec67808e796385cbde", "9b6a59775fc2acc64365e0a1421a097590ea38df", "0f75f8e49714dfc085f5e97fed6b76a2a141d738", "24c3990d3fe1916cccc4f5b8d879600d1a53411b"])
})

test("source anchors are deterministic, bounded, and reconstructable", () => {
  const anchor = createSemanticSourceAnchor(source({ range: { start: 5, end: 25 } }))
  assert.deepEqual(createSemanticSourceAnchor(source({ range: { start: 5, end: 25 } })), anchor)
  assert.deepEqual(validateSemanticSourceAnchor(copy(anchor)), anchor)
  assert.throws(() => createSemanticSourceAnchor(source({ range: { start: 9, end: 8 } })))
  assert.throws(() => createSemanticSourceAnchor(source({ range: { start: 0, end: 201 } })))
  assert.throws(() => createSemanticSourceAnchor(source({ path: ".." + "/x.ts" })))
  assert.throws(() => validateSemanticSourceAnchor({ ...anchor, range: { start: 0, end: 20 } }))
})

test("element identity is intrinsic while record identity binds relationships", () => {
  const bare = element()
  const linked = element({ childElementIdentities: [digest("child")] })
  assert.equal(bare.elementIdentity, linked.elementIdentity)
  assert.notEqual(bare.recordIdentity, linked.recordIdentity)
  assert.throws(() => validateSemanticElement({ ...bare, elementKind: "class.declaration" }))
})

test("child identities canonicalize and duplicate/self relations fail", () => {
  const a = digest("a"), b = digest("b")
  assert.deepEqual(element({ childElementIdentities: [b, a] }).childElementIdentities, [a, b].sort())
  assert.throws(() => element({ childElementIdentities: [a, a] }))
  const bare = element()
  assert.throws(() => element({ parentElementIdentity: bare.elementIdentity }))
})

test("closed element graph validates reciprocal source containment", () => {
  const parentBare = element({ range: { start: 0, end: 120 }, elementKind: "module" })
  const childBare = element({ range: { start: 10, end: 80 }, parentElementIdentity: parentBare.elementIdentity })
  const parent = element({ range: { start: 0, end: 120 }, elementKind: "module", childElementIdentities: [childBare.elementIdentity] })
  const child = element({ range: { start: 10, end: 80 }, parentElementIdentity: parent.elementIdentity })
  assert.equal(validateSemanticElementSet([child, parent]).length, 2)
  assert.throws(() => validateSemanticElementSet([element({ childElementIdentities: [digest("missing")] })]))
})

test("element graph rejects source mismatch and parent cycles", () => {
  const parentBare = element({ range: { start: 0, end: 100 }, elementKind: "module" })
  const foreign = element({ range: { start: 10, end: 20 }, contentIdentity: OTHER_CONTENT, parentElementIdentity: parentBare.elementIdentity })
  const parent = element({ range: { start: 0, end: 100 }, elementKind: "module", childElementIdentities: [foreign.elementIdentity] })
  assert.throws(() => validateSemanticElementSet([parent, foreign]))

  const a0 = element({ range: { start: 10, end: 20 }, elementKind: "cycle.a" })
  const b0 = element({ range: { start: 10, end: 20 }, elementKind: "cycle.b" })
  const a = element({ range: { start: 10, end: 20 }, elementKind: "cycle.a", parentElementIdentity: b0.elementIdentity, childElementIdentities: [b0.elementIdentity] })
  const b = element({ range: { start: 10, end: 20 }, elementKind: "cycle.b", parentElementIdentity: a0.elementIdentity, childElementIdentities: [a0.elementIdentity] })
  assert.throws(() => validateSemanticElementSet([a, b]), /cycle/)
})

test("declaration is distinct from element and name anchor is contained", () => {
  const e = element({ range: { start: 20, end: 60 } })
  const d = createSemanticDeclaration({ element: e, declarationKind: "function", name: "compute", nameRange: { start: 29, end: 36 }, symbolKey: "typescript:example#compute" })
  assert.notEqual(d.declarationIdentity, d.elementIdentity)
  assert.deepEqual(validateSemanticDeclaration(copy(d)), d)
  assert.throws(() => createSemanticDeclaration({ element: e, declarationKind: "function", name: "compute", nameRange: { start: 1, end: 8 } }))
  assert.throws(() => validateSemanticDeclaration({ ...d, name: "changed" }))
})

test("reference target status never invents resolution", () => {
  const unresolved = reference()
  assert.deepEqual(unresolved.targetDeclarationIdentities, [])
  assert.equal(unresolved.resolutionBasis, "unresolved")
  assert.throws(() => reference({ targetDeclarationIdentities: [TARGET_A] }))
  assert.throws(() => reference({ targetStatus: "SINGLE_TARGET", targetDeclarationIdentities: [], resolutionBasis: "compiler-derived" }))
  assert.throws(() => reference({ targetStatus: "SINGLE_TARGET", targetDeclarationIdentities: [TARGET_A], resolutionBasis: "unresolved" }))
})

test("resolved reference targets canonicalize deterministically", () => {
  const first = reference({ targetStatus: "MULTI_TARGET", targetDeclarationIdentities: [TARGET_B, TARGET_A], resolutionBasis: "language-server-derived" })
  const second = reference({ targetStatus: "MULTI_TARGET", targetDeclarationIdentities: [TARGET_A, TARGET_B], resolutionBasis: "language-server-derived" })
  assert.deepEqual(first.targetDeclarationIdentities, [TARGET_A, TARGET_B].sort())
  assert.equal(first.referenceIdentity, second.referenceIdentity)
  assert.deepEqual(validateSemanticReference(copy(first)), first)
  assert.throws(() => validateSemanticReference({ ...first, targetStatus: "SINGLE_TARGET" }))
})

test("stable pointer is a locator record, not a live resolution result", () => {
  const p = createSemanticPointer({ element: element(), declarationIdentity: TARGET_A, symbolKey: "typescript:example#compute" })
  assert.equal("status" in p, false)
  assert.deepEqual(validateSemanticPointer(copy(p)), p)
  assert.throws(() => validateSemanticPointer({ ...p, path: "src/other.ts" }))
})

test("bounded graph surfaces reject oversized collections", () => {
  assert.throws(() => element({ childElementIdentities: Array.from({ length: KDO_C1_LIMITS.maxChildren + 1 }, (_, i) => digest(String(i))) }))
  assert.throws(() => validateSemanticElementSet(Array.from({ length: KDO_C1_LIMITS.maxElementSet + 1 }, () => element())))
})
