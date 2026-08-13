import { createHash } from "node:crypto"

/**
 * KDO-C1 is a Kodac-native PORT of selected semantic-element contract ideas
 * studied from JetBrains/intellij-community at the exact donor revision below.
 *
 * No IntelliJ/JVM runtime, parser, index, resolver, refactoring engine, network,
 * filesystem/process execution, persistence, model call, or side-effect authority
 * is imported by this module.
 */
export const KDO_C1_SEMANTIC_CONTRACT_VERSION = "kodac-semantic-contracts-v1" as const
export const KDO_C1_INTELLIJ_DONOR_PROVENANCE = Object.freeze({
  repository: "JetBrains/intellij-community",
  sourceCommit: "bfca8a6815c70221a574383fc23542afb0af5bf7",
  sourceContracts: Object.freeze([
    Object.freeze({ path: "platform/core-api/src/com/intellij/psi/PsiElement.java", blob: "21db939950976e5b94b5d5ec67808e796385cbde" }),
    Object.freeze({ path: "platform/core-api/src/com/intellij/psi/PsiReference.java", blob: "9b6a59775fc2acc64365e0a1421a097590ea38df" }),
    Object.freeze({ path: "platform/core-api/src/com/intellij/psi/PsiNamedElement.java", blob: "0f75f8e49714dfc085f5e97fed6b76a2a141d738" }),
    Object.freeze({ path: "platform/core-api/src/com/intellij/psi/SmartPsiElementPointer.java", blob: "24c3990d3fe1916cccc4f5b8d879600d1a53411b" }),
  ]),
  intakeMode: "PORT",
} as const)

export const KDO_C1_LIMITS: Readonly<{
  maxLogicalPathBytes: number
  maxLanguageIdBytes: number
  maxElementKindBytes: number
  maxNameBytes: number
  maxCanonicalReferenceBytes: number
  maxSymbolKeyBytes: number
  maxChildren: number
  maxReferenceTargets: number
  maxElementSet: number
}> = Object.freeze({
  maxLogicalPathBytes: 4096,
  maxLanguageIdBytes: 128,
  maxElementKindBytes: 128,
  maxNameBytes: 512,
  maxCanonicalReferenceBytes: 4096,
  maxSymbolKeyBytes: 1024,
  maxChildren: 512,
  maxReferenceTargets: 32,
  maxElementSet: 4096,
})

export type SemanticDerivationClass =
  | "parser-derived"
  | "compiler-derived"
  | "language-server-derived"
  | "imported-evidence"
  | "synthetic-test"

export type SemanticDeclarationKind =
  | "module"
  | "namespace"
  | "type"
  | "class"
  | "interface"
  | "enum"
  | "function"
  | "method"
  | "constructor"
  | "property"
  | "field"
  | "variable"
  | "parameter"
  | "import"
  | "export"
  | "label"
  | "other"

export type SemanticReferenceTargetStatus = "UNRESOLVED" | "SINGLE_TARGET" | "MULTI_TARGET"
export type SemanticResolutionBasis =
  | "unresolved"
  | "parser-derived"
  | "compiler-derived"
  | "language-server-derived"
  | "imported-evidence"
  | "synthetic-test"

export interface SemanticTextRange {
  readonly start: number
  readonly end: number
}

export interface SemanticSourceAnchorInput {
  readonly path: string
  readonly languageId: string
  readonly contentIdentity: string
  readonly sourceLengthCodeUnits: number
  readonly range: SemanticTextRange
  readonly revisionIdentity?: string
}

export interface SemanticSourceAnchor extends SemanticSourceAnchorInput {
  readonly version: typeof KDO_C1_SEMANTIC_CONTRACT_VERSION
  readonly sourceAnchorIdentity: string
}

export interface SemanticElementInput extends SemanticSourceAnchorInput {
  readonly elementKind: string
  readonly derivation: SemanticDerivationClass
  readonly parentElementIdentity?: string
  readonly childElementIdentities?: readonly string[]
  readonly navigationElementIdentity?: string
  readonly originalElementIdentity?: string
}

export interface SemanticElement extends SemanticElementInput {
  readonly version: typeof KDO_C1_SEMANTIC_CONTRACT_VERSION
  readonly sourceAnchorIdentity: string
  readonly childElementIdentities: readonly string[]
  /** Intrinsic semantic identity; intentionally excludes relationship links. */
  readonly elementIdentity: string
  /** Binds the complete serialized element record including relationship links. */
  readonly recordIdentity: string
}

export interface SemanticDeclarationInput {
  readonly element: SemanticElement
  readonly declarationKind: SemanticDeclarationKind
  readonly name: string
  readonly nameRange: SemanticTextRange
  readonly symbolKey?: string
}

export interface SemanticDeclaration {
  readonly version: typeof KDO_C1_SEMANTIC_CONTRACT_VERSION
  readonly elementIdentity: string
  readonly sourceAnchorIdentity: string
  readonly path: string
  readonly languageId: string
  readonly contentIdentity: string
  readonly sourceLengthCodeUnits: number
  readonly elementRange: SemanticTextRange
  readonly revisionIdentity?: string
  readonly declarationKind: SemanticDeclarationKind
  readonly name: string
  readonly nameRange: SemanticTextRange
  readonly symbolKey?: string
  readonly derivation: SemanticDerivationClass
  readonly declarationIdentity: string
}

export interface SemanticReferenceInput {
  readonly element: SemanticElement
  readonly referenceRange: SemanticTextRange
  readonly canonicalText: string
  readonly soft: boolean
  readonly targetStatus: SemanticReferenceTargetStatus
  readonly targetDeclarationIdentities?: readonly string[]
  readonly resolutionBasis: SemanticResolutionBasis
}

export interface SemanticReference {
  readonly version: typeof KDO_C1_SEMANTIC_CONTRACT_VERSION
  readonly elementIdentity: string
  readonly sourceAnchorIdentity: string
  readonly path: string
  readonly languageId: string
  readonly contentIdentity: string
  readonly sourceLengthCodeUnits: number
  readonly elementRange: SemanticTextRange
  readonly revisionIdentity?: string
  readonly referenceRange: SemanticTextRange
  readonly canonicalText: string
  readonly soft: boolean
  readonly targetStatus: SemanticReferenceTargetStatus
  readonly targetDeclarationIdentities: readonly string[]
  readonly resolutionBasis: SemanticResolutionBasis
  readonly derivation: SemanticDerivationClass
  readonly referenceIdentity: string
}

export interface SemanticPointerInput {
  readonly element: SemanticElement
  readonly declarationIdentity?: string
  readonly symbolKey?: string
}

export interface SemanticPointer {
  readonly version: typeof KDO_C1_SEMANTIC_CONTRACT_VERSION
  readonly elementIdentity: string
  readonly sourceAnchorIdentity: string
  readonly path: string
  readonly languageId: string
  readonly contentIdentity: string
  readonly sourceLengthCodeUnits: number
  readonly originalRange: SemanticTextRange
  readonly revisionIdentity?: string
  readonly declarationIdentity?: string
  readonly symbolKey?: string
  readonly pointerIdentity: string
}

const SHA256 = /^[0-9a-f]{64}$/
const REVISION = /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/
const LANGUAGE_ID = /^[A-Za-z0-9][A-Za-z0-9._+\-]*$/
const ELEMENT_KIND = /^[A-Za-z0-9][A-Za-z0-9._:\-]*$/
const DERIVATIONS = new Set<SemanticDerivationClass>([
  "parser-derived", "compiler-derived", "language-server-derived", "imported-evidence", "synthetic-test",
])
const DECLARATION_KINDS = new Set<SemanticDeclarationKind>([
  "module", "namespace", "type", "class", "interface", "enum", "function", "method", "constructor",
  "property", "field", "variable", "parameter", "import", "export", "label", "other",
])
const TARGET_STATUSES = new Set<SemanticReferenceTargetStatus>(["UNRESOLVED", "SINGLE_TARGET", "MULTI_TARGET"])
const RESOLUTION_BASES = new Set<SemanticResolutionBasis>([
  "unresolved", "parser-derived", "compiler-derived", "language-server-derived", "imported-evidence", "synthetic-test",
])

const SOURCE_INPUT_KEYS = ["path", "languageId", "contentIdentity", "sourceLengthCodeUnits", "range", "revisionIdentity"] as const
const SOURCE_KEYS = [...SOURCE_INPUT_KEYS, "version", "sourceAnchorIdentity"] as const
const ELEMENT_INPUT_KEYS = [
  ...SOURCE_INPUT_KEYS, "elementKind", "derivation", "parentElementIdentity", "childElementIdentities",
  "navigationElementIdentity", "originalElementIdentity",
] as const
const ELEMENT_KEYS = [...ELEMENT_INPUT_KEYS, "version", "sourceAnchorIdentity", "elementIdentity", "recordIdentity"] as const
const DECLARATION_KEYS = [
  "version", "elementIdentity", "sourceAnchorIdentity", "path", "languageId", "contentIdentity", "sourceLengthCodeUnits",
  "elementRange", "revisionIdentity", "declarationKind", "name", "nameRange", "symbolKey", "derivation", "declarationIdentity",
] as const
const REFERENCE_KEYS = [
  "version", "elementIdentity", "sourceAnchorIdentity", "path", "languageId", "contentIdentity", "sourceLengthCodeUnits",
  "elementRange", "revisionIdentity", "referenceRange", "canonicalText", "soft", "targetStatus",
  "targetDeclarationIdentities", "resolutionBasis", "derivation", "referenceIdentity",
] as const
const POINTER_KEYS = [
  "version", "elementIdentity", "sourceAnchorIdentity", "path", "languageId", "contentIdentity", "sourceLengthCodeUnits",
  "originalRange", "revisionIdentity", "declarationIdentity", "symbolKey", "pointerIdentity",
] as const

function compareStrings(a: string, b: string): number { return a < b ? -1 : a > b ? 1 : 0 }
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record).sort(compareStrings).map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`
}
function sha256(value: unknown): string { return createHash("sha256").update(canonicalize(value), "utf8").digest("hex") }
function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
}
function boundedString(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (value.includes("\0")) throw new TypeError(`${label} must be NUL-free`)
  if (Buffer.byteLength(value, "utf8") > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}
function shaIdentity(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!SHA256.test(text)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return text
}
function optionalShaIdentity(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : shaIdentity(value, label)
}
function revisionIdentity(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!REVISION.test(text)) throw new TypeError(`${label} must be a lowercase 40- or 64-hex revision identity`)
  return text
}
function optionalRevisionIdentity(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : revisionIdentity(value, label)
}
function safeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError(`${label} must be a non-negative safe integer`)
  return value as number
}

export function normalizeSemanticLogicalPath(value: unknown): string {
  const path = boundedString(value, "semantic.path", KDO_C1_LIMITS.maxLogicalPathBytes)
  if (path.includes("\\")) throw new TypeError("semantic.path must use forward-slash separators")
  if (path.startsWith("/") || path.startsWith("//") || /^[A-Za-z]:\//.test(path)) throw new TypeError("semantic.path must be repository-relative")
  const parts = path.split("/")
  if (parts.some((part) => part.length === 0 || part === "." || part === "..")) throw new TypeError("semantic.path contains an unsafe or ambiguous segment")
  return parts.join("/")
}
function languageId(value: unknown): string {
  const text = boundedString(value, "semantic.languageId", KDO_C1_LIMITS.maxLanguageIdBytes)
  if (!LANGUAGE_ID.test(text)) throw new TypeError("semantic.languageId contains unsupported characters")
  return text
}
function elementKind(value: unknown): string {
  const text = boundedString(value, "semantic.elementKind", KDO_C1_LIMITS.maxElementKindBytes)
  if (!ELEMENT_KIND.test(text)) throw new TypeError("semantic.elementKind contains unsupported characters")
  return text
}
function textRange(value: unknown, label: string, sourceLength?: number, requireNonEmpty = false): SemanticTextRange {
  const record = asRecord(value, label); exactKeys(record, ["start", "end"], label)
  const start = safeInteger(record.start, `${label}.start`)
  const end = safeInteger(record.end, `${label}.end`)
  if (end < start) throw new RangeError(`${label} end must be >= start`)
  if (requireNonEmpty && end === start) throw new RangeError(`${label} must be non-empty`)
  if (sourceLength !== undefined && end > sourceLength) throw new RangeError(`${label} exceeds source length`)
  return Object.freeze({ start, end })
}
function rangeContains(outer: SemanticTextRange, inner: SemanticTextRange): boolean {
  return inner.start >= outer.start && inner.end <= outer.end
}
function rangeEqual(a: SemanticTextRange, b: SemanticTextRange): boolean { return a.start === b.start && a.end === b.end }
function canonicalIdentityList(value: unknown, label: string, max: number): readonly string[] {
  if (value === undefined) return Object.freeze([])
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`)
  if (value.length > max) throw new RangeError(`${label} exceeds ${max} entries`)
  const result = value.map((entry, index) => shaIdentity(entry, `${label}[${index}]`))
  const unique = new Set(result)
  if (unique.size !== result.length) throw new TypeError(`${label} contains duplicate identities`)
  return Object.freeze([...result].sort(compareStrings))
}
function semanticDerivation(value: unknown, label: string): SemanticDerivationClass {
  if (typeof value !== "string" || !DERIVATIONS.has(value as SemanticDerivationClass)) throw new TypeError(`${label} is unsupported`)
  return value as SemanticDerivationClass
}

function sourcePrimitive(record: Record<string, unknown>): Omit<SemanticSourceAnchor, "version" | "sourceAnchorIdentity"> {
  const sourceLengthCodeUnits = safeInteger(record.sourceLengthCodeUnits, "semantic.sourceLengthCodeUnits")
  const range = textRange(record.range, "semantic.range", sourceLengthCodeUnits)
  const revision = optionalRevisionIdentity(record.revisionIdentity, "semantic.revisionIdentity")
  return Object.freeze({
    path: normalizeSemanticLogicalPath(record.path),
    languageId: languageId(record.languageId),
    contentIdentity: shaIdentity(record.contentIdentity, "semantic.contentIdentity"),
    sourceLengthCodeUnits,
    range,
    ...(revision === undefined ? {} : { revisionIdentity: revision }),
  })
}
function sourcePreimage(source: Omit<SemanticSourceAnchor, "sourceAnchorIdentity">): Record<string, unknown> {
  return {
    version: source.version,
    path: source.path,
    languageId: source.languageId,
    contentIdentity: source.contentIdentity,
    sourceLengthCodeUnits: source.sourceLengthCodeUnits,
    range: source.range,
    ...(source.revisionIdentity === undefined ? {} : { revisionIdentity: source.revisionIdentity }),
  }
}
export function createSemanticSourceAnchor(input: SemanticSourceAnchorInput): SemanticSourceAnchor {
  const record = asRecord(input, "semanticSourceAnchor"); exactKeys(record, SOURCE_INPUT_KEYS, "semanticSourceAnchor")
  const primitive = sourcePrimitive(record)
  const base: Omit<SemanticSourceAnchor, "sourceAnchorIdentity"> = Object.freeze({ version: KDO_C1_SEMANTIC_CONTRACT_VERSION, ...primitive })
  return Object.freeze({ ...base, sourceAnchorIdentity: sha256(sourcePreimage(base)) })
}
export function validateSemanticSourceAnchor(value: unknown): SemanticSourceAnchor {
  const record = asRecord(value, "semanticSourceAnchor"); exactKeys(record, SOURCE_KEYS, "semanticSourceAnchor")
  if (record.version !== KDO_C1_SEMANTIC_CONTRACT_VERSION) throw new TypeError("unsupported semantic source-anchor version")
  const claimed = shaIdentity(record.sourceAnchorIdentity, "semanticSourceAnchor.sourceAnchorIdentity")
  const rebuilt = createSemanticSourceAnchor({
    path: record.path as string,
    languageId: record.languageId as string,
    contentIdentity: record.contentIdentity as string,
    sourceLengthCodeUnits: record.sourceLengthCodeUnits as number,
    range: record.range as SemanticTextRange,
    ...(record.revisionIdentity === undefined ? {} : { revisionIdentity: record.revisionIdentity as string }),
  })
  if (claimed !== rebuilt.sourceAnchorIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("semantic source-anchor derived fields mismatch")
  return rebuilt
}

function elementIntrinsicPreimage(element: Omit<SemanticElement, "elementIdentity" | "recordIdentity">): Record<string, unknown> {
  return {
    version: element.version,
    sourceAnchorIdentity: element.sourceAnchorIdentity,
    elementKind: element.elementKind,
    derivation: element.derivation,
  }
}
function elementRecordPreimage(element: Omit<SemanticElement, "recordIdentity">): Record<string, unknown> {
  return {
    version: element.version,
    sourceAnchorIdentity: element.sourceAnchorIdentity,
    elementIdentity: element.elementIdentity,
    path: element.path,
    languageId: element.languageId,
    contentIdentity: element.contentIdentity,
    sourceLengthCodeUnits: element.sourceLengthCodeUnits,
    range: element.range,
    ...(element.revisionIdentity === undefined ? {} : { revisionIdentity: element.revisionIdentity }),
    elementKind: element.elementKind,
    derivation: element.derivation,
    ...(element.parentElementIdentity === undefined ? {} : { parentElementIdentity: element.parentElementIdentity }),
    childElementIdentities: element.childElementIdentities,
    ...(element.navigationElementIdentity === undefined ? {} : { navigationElementIdentity: element.navigationElementIdentity }),
    ...(element.originalElementIdentity === undefined ? {} : { originalElementIdentity: element.originalElementIdentity }),
  }
}
export function createSemanticElement(input: SemanticElementInput): SemanticElement {
  const record = asRecord(input, "semanticElement"); exactKeys(record, ELEMENT_INPUT_KEYS, "semanticElement")
  const source = createSemanticSourceAnchor({
    path: record.path as string,
    languageId: record.languageId as string,
    contentIdentity: record.contentIdentity as string,
    sourceLengthCodeUnits: record.sourceLengthCodeUnits as number,
    range: record.range as SemanticTextRange,
    ...(record.revisionIdentity === undefined ? {} : { revisionIdentity: record.revisionIdentity as string }),
  })
  const parent = optionalShaIdentity(record.parentElementIdentity, "semanticElement.parentElementIdentity")
  const children = canonicalIdentityList(record.childElementIdentities, "semanticElement.childElementIdentities", KDO_C1_LIMITS.maxChildren)
  const navigation = optionalShaIdentity(record.navigationElementIdentity, "semanticElement.navigationElementIdentity")
  const original = optionalShaIdentity(record.originalElementIdentity, "semanticElement.originalElementIdentity")
  const baseWithoutIdentity = Object.freeze({
    version: KDO_C1_SEMANTIC_CONTRACT_VERSION,
    path: source.path,
    languageId: source.languageId,
    contentIdentity: source.contentIdentity,
    sourceLengthCodeUnits: source.sourceLengthCodeUnits,
    range: source.range,
    ...(source.revisionIdentity === undefined ? {} : { revisionIdentity: source.revisionIdentity }),
    elementKind: elementKind(record.elementKind),
    derivation: semanticDerivation(record.derivation, "semanticElement.derivation"),
    ...(parent === undefined ? {} : { parentElementIdentity: parent }),
    childElementIdentities: children,
    ...(navigation === undefined ? {} : { navigationElementIdentity: navigation }),
    ...(original === undefined ? {} : { originalElementIdentity: original }),
    sourceAnchorIdentity: source.sourceAnchorIdentity,
  })
  const elementIdentity = sha256(elementIntrinsicPreimage(baseWithoutIdentity as Omit<SemanticElement, "elementIdentity" | "recordIdentity">))
  if (parent === elementIdentity) throw new TypeError("semanticElement cannot be its own parent")
  if (children.includes(elementIdentity)) throw new TypeError("semanticElement cannot be its own child")
  const withElementIdentity = Object.freeze({ ...baseWithoutIdentity, elementIdentity }) as Omit<SemanticElement, "recordIdentity">
  return Object.freeze({ ...withElementIdentity, recordIdentity: sha256(elementRecordPreimage(withElementIdentity)) })
}
export function validateSemanticElement(value: unknown): SemanticElement {
  const record = asRecord(value, "semanticElement"); exactKeys(record, ELEMENT_KEYS, "semanticElement")
  if (record.version !== KDO_C1_SEMANTIC_CONTRACT_VERSION) throw new TypeError("unsupported semantic element version")
  const claimedElement = shaIdentity(record.elementIdentity, "semanticElement.elementIdentity")
  const claimedRecord = shaIdentity(record.recordIdentity, "semanticElement.recordIdentity")
  const rebuilt = createSemanticElement({
    path: record.path as string,
    languageId: record.languageId as string,
    contentIdentity: record.contentIdentity as string,
    sourceLengthCodeUnits: record.sourceLengthCodeUnits as number,
    range: record.range as SemanticTextRange,
    ...(record.revisionIdentity === undefined ? {} : { revisionIdentity: record.revisionIdentity as string }),
    elementKind: record.elementKind as string,
    derivation: record.derivation as SemanticDerivationClass,
    ...(record.parentElementIdentity === undefined ? {} : { parentElementIdentity: record.parentElementIdentity as string }),
    childElementIdentities: record.childElementIdentities as readonly string[],
    ...(record.navigationElementIdentity === undefined ? {} : { navigationElementIdentity: record.navigationElementIdentity as string }),
    ...(record.originalElementIdentity === undefined ? {} : { originalElementIdentity: record.originalElementIdentity as string }),
  })
  if (claimedElement !== rebuilt.elementIdentity || claimedRecord !== rebuilt.recordIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("semantic element derived fields mismatch")
  return rebuilt
}

function elementSourceProjection(element: SemanticElement): Record<string, unknown> {
  return {
    elementIdentity: element.elementIdentity,
    sourceAnchorIdentity: element.sourceAnchorIdentity,
    path: element.path,
    languageId: element.languageId,
    contentIdentity: element.contentIdentity,
    sourceLengthCodeUnits: element.sourceLengthCodeUnits,
    elementRange: element.range,
    ...(element.revisionIdentity === undefined ? {} : { revisionIdentity: element.revisionIdentity }),
    derivation: element.derivation,
  }
}
function declarationPreimage(record: Omit<SemanticDeclaration, "declarationIdentity">): Record<string, unknown> { return { ...record } }
export function createSemanticDeclaration(input: SemanticDeclarationInput): SemanticDeclaration {
  const element = validateSemanticElement(input.element)
  if (!DECLARATION_KINDS.has(input.declarationKind)) throw new TypeError("semanticDeclaration.declarationKind is unsupported")
  const name = boundedString(input.name, "semanticDeclaration.name", KDO_C1_LIMITS.maxNameBytes)
  const nameRange = textRange(input.nameRange, "semanticDeclaration.nameRange", element.sourceLengthCodeUnits, true)
  if (!rangeContains(element.range, nameRange)) throw new RangeError("semanticDeclaration.nameRange must be contained by element range")
  const symbolKey = input.symbolKey === undefined ? undefined : boundedString(input.symbolKey, "semanticDeclaration.symbolKey", KDO_C1_LIMITS.maxSymbolKeyBytes)
  const base = Object.freeze({
    version: KDO_C1_SEMANTIC_CONTRACT_VERSION,
    ...elementSourceProjection(element),
    declarationKind: input.declarationKind,
    name,
    nameRange,
    ...(symbolKey === undefined ? {} : { symbolKey }),
  }) as Omit<SemanticDeclaration, "declarationIdentity">
  return Object.freeze({ ...base, declarationIdentity: sha256(declarationPreimage(base)) })
}
export function validateSemanticDeclaration(value: unknown): SemanticDeclaration {
  const record = asRecord(value, "semanticDeclaration"); exactKeys(record, DECLARATION_KEYS, "semanticDeclaration")
  if (record.version !== KDO_C1_SEMANTIC_CONTRACT_VERSION) throw new TypeError("unsupported semantic declaration version")
  const elementRange = textRange(record.elementRange, "semanticDeclaration.elementRange", safeInteger(record.sourceLengthCodeUnits, "semanticDeclaration.sourceLengthCodeUnits"))
  const source = createSemanticSourceAnchor({
    path: record.path as string,
    languageId: record.languageId as string,
    contentIdentity: record.contentIdentity as string,
    sourceLengthCodeUnits: record.sourceLengthCodeUnits as number,
    range: elementRange,
    ...(record.revisionIdentity === undefined ? {} : { revisionIdentity: record.revisionIdentity as string }),
  })
  const sourceAnchorIdentity = shaIdentity(record.sourceAnchorIdentity, "semanticDeclaration.sourceAnchorIdentity")
  if (sourceAnchorIdentity !== source.sourceAnchorIdentity) throw new TypeError("semanticDeclaration.sourceAnchorIdentity mismatch")
  const elementIdentity = shaIdentity(record.elementIdentity, "semanticDeclaration.elementIdentity")
  const derivation = semanticDerivation(record.derivation, "semanticDeclaration.derivation")
  const kind = record.declarationKind as SemanticDeclarationKind
  if (!DECLARATION_KINDS.has(kind)) throw new TypeError("semanticDeclaration.declarationKind is unsupported")
  const name = boundedString(record.name, "semanticDeclaration.name", KDO_C1_LIMITS.maxNameBytes)
  const nameRange = textRange(record.nameRange, "semanticDeclaration.nameRange", source.sourceLengthCodeUnits, true)
  if (!rangeContains(source.range, nameRange)) throw new RangeError("semanticDeclaration.nameRange must be contained by element range")
  const symbolKey = record.symbolKey === undefined ? undefined : boundedString(record.symbolKey, "semanticDeclaration.symbolKey", KDO_C1_LIMITS.maxSymbolKeyBytes)
  const base = Object.freeze({
    version: KDO_C1_SEMANTIC_CONTRACT_VERSION,
    elementIdentity,
    sourceAnchorIdentity,
    path: source.path,
    languageId: source.languageId,
    contentIdentity: source.contentIdentity,
    sourceLengthCodeUnits: source.sourceLengthCodeUnits,
    elementRange: source.range,
    ...(source.revisionIdentity === undefined ? {} : { revisionIdentity: source.revisionIdentity }),
    declarationKind: kind,
    name,
    nameRange,
    ...(symbolKey === undefined ? {} : { symbolKey }),
    derivation,
  }) as Omit<SemanticDeclaration, "declarationIdentity">
  const rebuilt = Object.freeze({ ...base, declarationIdentity: sha256(declarationPreimage(base)) })
  if (shaIdentity(record.declarationIdentity, "semanticDeclaration.declarationIdentity") !== rebuilt.declarationIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("semantic declaration derived fields mismatch")
  return rebuilt
}

function referencePreimage(record: Omit<SemanticReference, "referenceIdentity">): Record<string, unknown> { return { ...record } }
export function createSemanticReference(input: SemanticReferenceInput): SemanticReference {
  const element = validateSemanticElement(input.element)
  if (!TARGET_STATUSES.has(input.targetStatus)) throw new TypeError("semanticReference.targetStatus is unsupported")
  if (!RESOLUTION_BASES.has(input.resolutionBasis)) throw new TypeError("semanticReference.resolutionBasis is unsupported")
  if (typeof input.soft !== "boolean") throw new TypeError("semanticReference.soft must be boolean")
  const referenceRange = textRange(input.referenceRange, "semanticReference.referenceRange", element.sourceLengthCodeUnits, true)
  if (!rangeContains(element.range, referenceRange)) throw new RangeError("semanticReference.referenceRange must be contained by element range")
  const canonicalText = boundedString(input.canonicalText, "semanticReference.canonicalText", KDO_C1_LIMITS.maxCanonicalReferenceBytes)
  const targets = canonicalIdentityList(input.targetDeclarationIdentities, "semanticReference.targetDeclarationIdentities", KDO_C1_LIMITS.maxReferenceTargets)
  if (input.targetStatus === "UNRESOLVED") {
    if (targets.length !== 0 || input.resolutionBasis !== "unresolved") throw new TypeError("UNRESOLVED reference must have zero targets and unresolved basis")
  } else {
    if (input.resolutionBasis === "unresolved") throw new TypeError("resolved target status requires a non-unresolved resolution basis")
    if (input.targetStatus === "SINGLE_TARGET" && targets.length !== 1) throw new TypeError("SINGLE_TARGET reference must contain exactly one target")
    if (input.targetStatus === "MULTI_TARGET" && targets.length < 2) throw new TypeError("MULTI_TARGET reference must contain at least two targets")
  }
  const base = Object.freeze({
    version: KDO_C1_SEMANTIC_CONTRACT_VERSION,
    ...elementSourceProjection(element),
    referenceRange,
    canonicalText,
    soft: input.soft,
    targetStatus: input.targetStatus,
    targetDeclarationIdentities: targets,
    resolutionBasis: input.resolutionBasis,
  }) as Omit<SemanticReference, "referenceIdentity">
  return Object.freeze({ ...base, referenceIdentity: sha256(referencePreimage(base)) })
}
export function validateSemanticReference(value: unknown): SemanticReference {
  const record = asRecord(value, "semanticReference"); exactKeys(record, REFERENCE_KEYS, "semanticReference")
  if (record.version !== KDO_C1_SEMANTIC_CONTRACT_VERSION) throw new TypeError("unsupported semantic reference version")
  const elementRange = textRange(record.elementRange, "semanticReference.elementRange", safeInteger(record.sourceLengthCodeUnits, "semanticReference.sourceLengthCodeUnits"))
  const source = createSemanticSourceAnchor({
    path: record.path as string,
    languageId: record.languageId as string,
    contentIdentity: record.contentIdentity as string,
    sourceLengthCodeUnits: record.sourceLengthCodeUnits as number,
    range: elementRange,
    ...(record.revisionIdentity === undefined ? {} : { revisionIdentity: record.revisionIdentity as string }),
  })
  const sourceAnchorIdentity = shaIdentity(record.sourceAnchorIdentity, "semanticReference.sourceAnchorIdentity")
  if (sourceAnchorIdentity !== source.sourceAnchorIdentity) throw new TypeError("semanticReference.sourceAnchorIdentity mismatch")
  const targetStatus = record.targetStatus as SemanticReferenceTargetStatus
  const resolutionBasis = record.resolutionBasis as SemanticResolutionBasis
  if (!TARGET_STATUSES.has(targetStatus) || !RESOLUTION_BASES.has(resolutionBasis)) throw new TypeError("semanticReference target status or resolution basis is unsupported")
  if (typeof record.soft !== "boolean") throw new TypeError("semanticReference.soft must be boolean")
  const referenceRange = textRange(record.referenceRange, "semanticReference.referenceRange", source.sourceLengthCodeUnits, true)
  if (!rangeContains(source.range, referenceRange)) throw new RangeError("semanticReference.referenceRange must be contained by element range")
  const canonicalText = boundedString(record.canonicalText, "semanticReference.canonicalText", KDO_C1_LIMITS.maxCanonicalReferenceBytes)
  const targets = canonicalIdentityList(record.targetDeclarationIdentities, "semanticReference.targetDeclarationIdentities", KDO_C1_LIMITS.maxReferenceTargets)
  if (targetStatus === "UNRESOLVED") {
    if (targets.length !== 0 || resolutionBasis !== "unresolved") throw new TypeError("UNRESOLVED reference must have zero targets and unresolved basis")
  } else {
    if (resolutionBasis === "unresolved") throw new TypeError("resolved target status requires a non-unresolved resolution basis")
    if (targetStatus === "SINGLE_TARGET" && targets.length !== 1) throw new TypeError("SINGLE_TARGET reference must contain exactly one target")
    if (targetStatus === "MULTI_TARGET" && targets.length < 2) throw new TypeError("MULTI_TARGET reference must contain at least two targets")
  }
  const base = Object.freeze({
    version: KDO_C1_SEMANTIC_CONTRACT_VERSION,
    elementIdentity: shaIdentity(record.elementIdentity, "semanticReference.elementIdentity"),
    sourceAnchorIdentity,
    path: source.path,
    languageId: source.languageId,
    contentIdentity: source.contentIdentity,
    sourceLengthCodeUnits: source.sourceLengthCodeUnits,
    elementRange: source.range,
    ...(source.revisionIdentity === undefined ? {} : { revisionIdentity: source.revisionIdentity }),
    referenceRange,
    canonicalText,
    soft: record.soft,
    targetStatus,
    targetDeclarationIdentities: targets,
    resolutionBasis,
    derivation: semanticDerivation(record.derivation, "semanticReference.derivation"),
  }) as Omit<SemanticReference, "referenceIdentity">
  const rebuilt = Object.freeze({ ...base, referenceIdentity: sha256(referencePreimage(base)) })
  if (shaIdentity(record.referenceIdentity, "semanticReference.referenceIdentity") !== rebuilt.referenceIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("semantic reference derived fields mismatch")
  return rebuilt
}

function pointerPreimage(record: Omit<SemanticPointer, "pointerIdentity">): Record<string, unknown> { return { ...record } }
export function createSemanticPointer(input: SemanticPointerInput): SemanticPointer {
  const element = validateSemanticElement(input.element)
  const declaration = optionalShaIdentity(input.declarationIdentity, "semanticPointer.declarationIdentity")
  const symbolKey = input.symbolKey === undefined ? undefined : boundedString(input.symbolKey, "semanticPointer.symbolKey", KDO_C1_LIMITS.maxSymbolKeyBytes)
  const base = Object.freeze({
    version: KDO_C1_SEMANTIC_CONTRACT_VERSION,
    elementIdentity: element.elementIdentity,
    sourceAnchorIdentity: element.sourceAnchorIdentity,
    path: element.path,
    languageId: element.languageId,
    contentIdentity: element.contentIdentity,
    sourceLengthCodeUnits: element.sourceLengthCodeUnits,
    originalRange: element.range,
    ...(element.revisionIdentity === undefined ? {} : { revisionIdentity: element.revisionIdentity }),
    ...(declaration === undefined ? {} : { declarationIdentity: declaration }),
    ...(symbolKey === undefined ? {} : { symbolKey }),
  }) as Omit<SemanticPointer, "pointerIdentity">
  return Object.freeze({ ...base, pointerIdentity: sha256(pointerPreimage(base)) })
}
export function validateSemanticPointer(value: unknown): SemanticPointer {
  const record = asRecord(value, "semanticPointer"); exactKeys(record, POINTER_KEYS, "semanticPointer")
  if (record.version !== KDO_C1_SEMANTIC_CONTRACT_VERSION) throw new TypeError("unsupported semantic pointer version")
  const sourceLengthCodeUnits = safeInteger(record.sourceLengthCodeUnits, "semanticPointer.sourceLengthCodeUnits")
  const originalRange = textRange(record.originalRange, "semanticPointer.originalRange", sourceLengthCodeUnits)
  const source = createSemanticSourceAnchor({
    path: record.path as string,
    languageId: record.languageId as string,
    contentIdentity: record.contentIdentity as string,
    sourceLengthCodeUnits,
    range: originalRange,
    ...(record.revisionIdentity === undefined ? {} : { revisionIdentity: record.revisionIdentity as string }),
  })
  const sourceAnchorIdentity = shaIdentity(record.sourceAnchorIdentity, "semanticPointer.sourceAnchorIdentity")
  if (sourceAnchorIdentity !== source.sourceAnchorIdentity) throw new TypeError("semanticPointer.sourceAnchorIdentity mismatch")
  const declaration = optionalShaIdentity(record.declarationIdentity, "semanticPointer.declarationIdentity")
  const symbolKey = record.symbolKey === undefined ? undefined : boundedString(record.symbolKey, "semanticPointer.symbolKey", KDO_C1_LIMITS.maxSymbolKeyBytes)
  const base = Object.freeze({
    version: KDO_C1_SEMANTIC_CONTRACT_VERSION,
    elementIdentity: shaIdentity(record.elementIdentity, "semanticPointer.elementIdentity"),
    sourceAnchorIdentity,
    path: source.path,
    languageId: source.languageId,
    contentIdentity: source.contentIdentity,
    sourceLengthCodeUnits: source.sourceLengthCodeUnits,
    originalRange: source.range,
    ...(source.revisionIdentity === undefined ? {} : { revisionIdentity: source.revisionIdentity }),
    ...(declaration === undefined ? {} : { declarationIdentity: declaration }),
    ...(symbolKey === undefined ? {} : { symbolKey }),
  }) as Omit<SemanticPointer, "pointerIdentity">
  const rebuilt = Object.freeze({ ...base, pointerIdentity: sha256(pointerPreimage(base)) })
  if (shaIdentity(record.pointerIdentity, "semanticPointer.pointerIdentity") !== rebuilt.pointerIdentity || canonicalize(record) !== canonicalize(rebuilt)) throw new TypeError("semantic pointer derived fields mismatch")
  return rebuilt
}

function sameSource(a: SemanticElement, b: SemanticElement): boolean {
  return a.path === b.path && a.languageId === b.languageId && a.contentIdentity === b.contentIdentity &&
    a.sourceLengthCodeUnits === b.sourceLengthCodeUnits && a.revisionIdentity === b.revisionIdentity
}

/**
 * Validates a closed parent/child element set. This is structural consistency only;
 * it is not parsing, symbol resolution, indexing, navigation or refactoring.
 */
export function validateSemanticElementSet(value: readonly SemanticElement[]): readonly SemanticElement[] {
  if (!Array.isArray(value)) throw new TypeError("semanticElementSet must be an array")
  if (value.length > KDO_C1_LIMITS.maxElementSet) throw new RangeError("semanticElementSet exceeds bounded size")
  const elements = value.map(validateSemanticElement)
  const byId = new Map<string, SemanticElement>()
  for (const element of elements) {
    if (byId.has(element.elementIdentity)) throw new TypeError(`semanticElementSet contains duplicate element identity: ${element.elementIdentity}`)
    byId.set(element.elementIdentity, element)
  }
  for (const element of elements) {
    if (element.parentElementIdentity !== undefined) {
      const parent = byId.get(element.parentElementIdentity)
      if (parent === undefined) throw new TypeError(`semanticElementSet parent is missing: ${element.parentElementIdentity}`)
      if (!sameSource(parent, element)) throw new TypeError("semanticElementSet parent/child source binding mismatch")
      if (!rangeContains(parent.range, element.range)) throw new TypeError("semanticElementSet child range is not contained by parent")
      if (!parent.childElementIdentities.includes(element.elementIdentity)) throw new TypeError("semanticElementSet parent/child relation is not reciprocal")
    }
    for (const childId of element.childElementIdentities) {
      const child = byId.get(childId)
      if (child === undefined) throw new TypeError(`semanticElementSet child is missing: ${childId}`)
      if (child.parentElementIdentity !== element.elementIdentity) throw new TypeError("semanticElementSet child/parent relation is not reciprocal")
      if (!sameSource(element, child)) throw new TypeError("semanticElementSet parent/child source binding mismatch")
      if (!rangeContains(element.range, child.range)) throw new TypeError("semanticElementSet child range is not contained by parent")
    }
  }
  for (const start of elements) {
    const seen = new Set<string>()
    let current: SemanticElement | undefined = start
    while (current?.parentElementIdentity !== undefined) {
      if (seen.has(current.elementIdentity)) throw new TypeError("semanticElementSet contains a parent cycle")
      seen.add(current.elementIdentity)
      current = byId.get(current.parentElementIdentity)
    }
  }
  return Object.freeze([...elements].sort((a, b) => compareStrings(a.elementIdentity, b.elementIdentity)))
}

export function semanticRangesEqual(a: SemanticTextRange, b: SemanticTextRange): boolean { return rangeEqual(a, b) }
