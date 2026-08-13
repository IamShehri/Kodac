import { createHash } from "node:crypto"

export const KDO_H1_EXTENSION_CONTRACT_VERSION = "kodac-extension-capability-v1" as const

export const KDO_H1_DEEPSEEK_HARNESS_DONOR_PROVENANCE = Object.freeze({
  repository: "deepseek-ai/deepseek-harness",
  sourceCommit: "47f943859bef60e4160492346772ded9b24f765a",
  license: "MIT",
  intakeMode: "PORT",
  sources: Object.freeze([
    Object.freeze({ path: "docs/architecture.md", blob: "77000ce9d4608d440e1d903eb80a42f2ed6435ef" }),
    Object.freeze({ path: "docs/cordis-primer.md", blob: "2a3afe180623d89b006dfa3e73aba5567c15bbe9" }),
    Object.freeze({ path: "docs/capability-seams.md", blob: "a990a9dd4d92d10e37b82e6a63caa4a5a469c441" }),
  ]),
} as const)

export const KDO_H1_LIMITS: Readonly<{
  maxExtensionIdBytes: number
  maxExtensionVersionBytes: number
  maxSourceIdBytes: number
  maxSourceRevisionBytes: number
  maxLicenseBytes: number
  maxCapabilities: number
  maxCapabilityIdBytes: number
}> = Object.freeze({
  maxExtensionIdBytes: 160,
  maxExtensionVersionBytes: 96,
  maxSourceIdBytes: 256,
  maxSourceRevisionBytes: 160,
  maxLicenseBytes: 96,
  maxCapabilities: 64,
  maxCapabilityIdBytes: 160,
})

export const KDO_H1_EXTENSION_ROLES = Object.freeze(["DEFINITION", "PROVIDER", "CONSUMER"] as const)
export type ExtensionCapabilityRole = (typeof KDO_H1_EXTENSION_ROLES)[number]

export const KDO_H1_SOURCE_TYPES = Object.freeze(["KODAC_NATIVE", "DONOR_PORT", "EXTERNAL_DECLARATION"] as const)
export type ExtensionSourceType = (typeof KDO_H1_SOURCE_TYPES)[number]

export const KDO_H1_INTAKE_MODES = Object.freeze(["NATIVE", "PORT", "DECLARATION"] as const)
export type ExtensionIntakeMode = (typeof KDO_H1_INTAKE_MODES)[number]

export interface ExtensionProvenanceInput {
  readonly sourceType: ExtensionSourceType
  readonly sourceId: string
  readonly sourceRevision: string
  readonly license: string
  readonly intakeMode: ExtensionIntakeMode
}

export interface ExtensionProvenance extends ExtensionProvenanceInput {
  readonly provenanceIdentity: string
}

export interface ExtensionCapabilityContributionInput {
  readonly capabilityId: string
  readonly roles: readonly ExtensionCapabilityRole[]
}

export interface ExtensionCapabilityContribution {
  readonly capabilityId: string
  readonly roles: readonly ExtensionCapabilityRole[]
}

export interface ExtensionDescriptorInput {
  readonly extensionId: string
  readonly extensionVersion: string
  readonly provenance: ExtensionProvenanceInput
  readonly capabilities: readonly ExtensionCapabilityContributionInput[]
}

export interface ExtensionDescriptor {
  readonly version: typeof KDO_H1_EXTENSION_CONTRACT_VERSION
  readonly extensionId: string
  readonly extensionVersion: string
  readonly provenance: ExtensionProvenance
  readonly capabilities: readonly ExtensionCapabilityContribution[]
  readonly descriptorIdentity: string
}

const SHA256 = /^[0-9a-f]{64}$/
const EXTENSION_ID = /^[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*$/
const CAPABILITY_ID = /^[a-z][a-z0-9_-]*(?:[./:][a-z][a-z0-9_-]*)+$/
const SAFE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9._+:/@-]*$/

const PROVENANCE_KEYS = ["sourceType", "sourceId", "sourceRevision", "license", "intakeMode"] as const
const SERIALIZED_PROVENANCE_KEYS = [...PROVENANCE_KEYS, "provenanceIdentity"] as const
const CONTRIBUTION_KEYS = ["capabilityId", "roles"] as const
const DESCRIPTOR_INPUT_KEYS = ["extensionId", "extensionVersion", "provenance", "capabilities"] as const
const DESCRIPTOR_KEYS = ["version", ...DESCRIPTOR_INPUT_KEYS, "descriptorIdentity"] as const

const ROLE_ORDER = new Map<ExtensionCapabilityRole, number>(KDO_H1_EXTENSION_ROLES.map((role, index) => [role, index]))

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function canonicalize(value: unknown): string {
  if (value === null) return "null"
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value)
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical value contains a non-finite number")
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`
  if (typeof value !== "object") throw new TypeError("canonical value must be JSON-compatible")
  const record = value as Record<string, unknown>
  const keys = Object.keys(record).sort(compareStrings)
  for (const key of keys) {
    if (record[key] === undefined) throw new TypeError(`canonical value contains undefined field: ${key}`)
  }
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex")
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
  }
}

function boundedString(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (value.includes("\0")) throw new TypeError(`${label} must be NUL-free`)
  if (Buffer.byteLength(value, "utf8") > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) throw new TypeError(`${label} is unsupported`)
  return value as T
}

function structuralIdentity(value: unknown, label: string): string {
  const text = boundedString(value, label, 64)
  if (!SHA256.test(text)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return text
}

function validateExtensionId(value: unknown): string {
  const text = boundedString(value, "extension.extensionId", KDO_H1_LIMITS.maxExtensionIdBytes)
  if (!EXTENSION_ID.test(text)) throw new TypeError("extension.extensionId must be a lowercase namespaced id")
  return text
}

function validateCapabilityId(value: unknown): string {
  const text = boundedString(value, "extension.capabilityId", KDO_H1_LIMITS.maxCapabilityIdBytes)
  if (!CAPABILITY_ID.test(text)) throw new TypeError("extension.capabilityId must be a lowercase namespaced capability id")
  return text
}

function validateSafeToken(value: unknown, label: string, maxBytes: number): string {
  const text = boundedString(value, label, maxBytes)
  if (!SAFE_TOKEN.test(text)) throw new TypeError(`${label} contains unsupported characters`)
  return text
}

function buildProvenance(input: ExtensionProvenanceInput): ExtensionProvenance {
  const record = asRecord(input, "extension.provenance")
  exactKeys(record, PROVENANCE_KEYS, "extension.provenance")
  const base = Object.freeze({
    sourceType: enumValue(record.sourceType, KDO_H1_SOURCE_TYPES, "extension.provenance.sourceType"),
    sourceId: boundedString(record.sourceId, "extension.provenance.sourceId", KDO_H1_LIMITS.maxSourceIdBytes),
    sourceRevision: validateSafeToken(record.sourceRevision, "extension.provenance.sourceRevision", KDO_H1_LIMITS.maxSourceRevisionBytes),
    license: validateSafeToken(record.license, "extension.provenance.license", KDO_H1_LIMITS.maxLicenseBytes),
    intakeMode: enumValue(record.intakeMode, KDO_H1_INTAKE_MODES, "extension.provenance.intakeMode"),
  })
  return Object.freeze({ ...base, provenanceIdentity: sha256(base) })
}

export function validateExtensionProvenance(value: unknown): ExtensionProvenance {
  const record = asRecord(value, "extension.provenance")
  exactKeys(record, SERIALIZED_PROVENANCE_KEYS, "extension.provenance")
  const claimed = structuralIdentity(record.provenanceIdentity, "extension.provenance.provenanceIdentity")
  const rebuilt = buildProvenance({
    sourceType: record.sourceType as ExtensionSourceType,
    sourceId: record.sourceId as string,
    sourceRevision: record.sourceRevision as string,
    license: record.license as string,
    intakeMode: record.intakeMode as ExtensionIntakeMode,
  })
  if (claimed !== rebuilt.provenanceIdentity || canonicalize(record) !== canonicalize(rebuilt)) {
    throw new TypeError("extension provenance derived fields mismatch")
  }
  return rebuilt
}

function canonicalRoles(value: unknown): readonly ExtensionCapabilityRole[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > KDO_H1_EXTENSION_ROLES.length) {
    throw new TypeError("extension capability roles must contain one through three roles")
  }
  const seen = new Set<ExtensionCapabilityRole>()
  const roles = value.map((entry) => enumValue(entry, KDO_H1_EXTENSION_ROLES, "extension capability role"))
  for (const role of roles) {
    if (seen.has(role)) throw new TypeError(`duplicate extension capability role: ${role}`)
    seen.add(role)
  }
  return Object.freeze([...roles].sort((a, b) => (ROLE_ORDER.get(a) ?? 0) - (ROLE_ORDER.get(b) ?? 0)))
}

function buildContribution(value: unknown): ExtensionCapabilityContribution {
  const record = asRecord(value, "extension capability contribution")
  exactKeys(record, CONTRIBUTION_KEYS, "extension capability contribution")
  return Object.freeze({
    capabilityId: validateCapabilityId(record.capabilityId),
    roles: canonicalRoles(record.roles),
  })
}

function canonicalCapabilities(value: unknown): readonly ExtensionCapabilityContribution[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > KDO_H1_LIMITS.maxCapabilities) {
    throw new TypeError(`extension capabilities must contain one through ${KDO_H1_LIMITS.maxCapabilities} entries`)
  }
  const capabilities = value.map(buildContribution).sort((a, b) => compareStrings(a.capabilityId, b.capabilityId))
  for (let index = 1; index < capabilities.length; index += 1) {
    if (capabilities[index - 1]?.capabilityId === capabilities[index]?.capabilityId) {
      throw new TypeError(`duplicate extension capability: ${capabilities[index]?.capabilityId}`)
    }
  }
  return Object.freeze(capabilities)
}

export function createExtensionDescriptor(input: ExtensionDescriptorInput): ExtensionDescriptor {
  const record = asRecord(input, "extension descriptor")
  exactKeys(record, DESCRIPTOR_INPUT_KEYS, "extension descriptor")
  const base = Object.freeze({
    version: KDO_H1_EXTENSION_CONTRACT_VERSION,
    extensionId: validateExtensionId(record.extensionId),
    extensionVersion: validateSafeToken(record.extensionVersion, "extension.extensionVersion", KDO_H1_LIMITS.maxExtensionVersionBytes),
    provenance: buildProvenance(record.provenance as ExtensionProvenanceInput),
    capabilities: canonicalCapabilities(record.capabilities),
  })
  return Object.freeze({ ...base, descriptorIdentity: sha256(base) })
}

export function validateExtensionDescriptor(value: unknown): ExtensionDescriptor {
  const record = asRecord(value, "extension descriptor")
  exactKeys(record, DESCRIPTOR_KEYS, "extension descriptor")
  if (record.version !== KDO_H1_EXTENSION_CONTRACT_VERSION) throw new TypeError("unsupported extension descriptor contract")
  const claimed = structuralIdentity(record.descriptorIdentity, "extension.descriptorIdentity")
  const provenance = validateExtensionProvenance(record.provenance)
  const rebuilt = createExtensionDescriptor({
    extensionId: record.extensionId as string,
    extensionVersion: record.extensionVersion as string,
    provenance: {
      sourceType: provenance.sourceType,
      sourceId: provenance.sourceId,
      sourceRevision: provenance.sourceRevision,
      license: provenance.license,
      intakeMode: provenance.intakeMode,
    },
    capabilities: record.capabilities as readonly ExtensionCapabilityContributionInput[],
  })
  if (claimed !== rebuilt.descriptorIdentity || canonicalize(record) !== canonicalize(rebuilt)) {
    throw new TypeError("extension descriptor derived fields mismatch")
  }
  return rebuilt
}
