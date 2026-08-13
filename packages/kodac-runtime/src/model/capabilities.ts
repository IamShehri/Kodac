import { createHash } from "node:crypto"

/**
 * KDO-C6 is a Kodac-native port of model-capability ideas studied from:
 * continuedev/continue@5522c6f44ca0ac3528b37244818fbfa39b5af470
 * core/config/types.ts (blob 2500042e88706adfc09fdfc40cec33248ab7dae5)
 *
 * The donor source exposed a broad ILLM surface spanning completion, chat,
 * streaming, FIM, embeddings, reranking, token counting and model listing.
 * Kodac deliberately ports only capability-description semantics here.
 * No Continue provider transport, credential, fetch or discovery authority is imported.
 */

export const KDO_C6_MODEL_CAPABILITY_VERSION = "kodac-model-capabilities-v1" as const

export const KDO_C6_CONTINUE_DONOR_PROVENANCE = Object.freeze({
  repository: "continuedev/continue",
  sourceCommit: "5522c6f44ca0ac3528b37244818fbfa39b5af470",
  sourcePath: "core/config/types.ts",
  sourceBlob: "2500042e88706adfc09fdfc40cec33248ab7dae5",
  intakeMode: "PORT",
} as const)

export const MODEL_CAPABILITIES = Object.freeze([
  "chat",
  "completion",
  "streaming",
  "fill_in_middle",
  "prefill",
  "image_input",
  "tool_calling",
  "embedding",
  "reranking",
  "token_counting",
  "model_listing",
] as const)

export type ModelCapability = (typeof MODEL_CAPABILITIES)[number]
export type ModelCapabilityProfileSource = "configured" | "observed" | "fixture"

export interface ModelCapabilityProfileInput {
  readonly providerId: string
  readonly modelId: string
  readonly capabilities: readonly ModelCapability[]
  readonly contextWindowTokens?: number
  readonly maxOutputTokens?: number
  readonly profileSource: ModelCapabilityProfileSource
  readonly profileSourceIdentity: string
}

export interface ModelCapabilityProfile {
  readonly version: typeof KDO_C6_MODEL_CAPABILITY_VERSION
  readonly providerId: string
  readonly modelId: string
  readonly capabilities: readonly ModelCapability[]
  readonly contextWindowTokens?: number
  readonly maxOutputTokens?: number
  readonly profileSource: ModelCapabilityProfileSource
  readonly profileSourceIdentity: string
  readonly profileIdentity: string
}

export interface ModelCapabilityCheck {
  readonly supported: boolean
  readonly required: readonly ModelCapability[]
  readonly missing: readonly ModelCapability[]
}

const CAPABILITY_SET = new Set<ModelCapability>(MODEL_CAPABILITIES)
const SOURCE_SET = new Set<ModelCapabilityProfileSource>(["configured", "observed", "fixture"])
const SHA256 = /^[0-9a-f]{64}$/
const MAX_ID_BYTES = 256
const MAX_TOKEN_LIMIT = Number.MAX_SAFE_INTEGER
const INPUT_KEYS = [
  "providerId",
  "modelId",
  "capabilities",
  "contextWindowTokens",
  "maxOutputTokens",
  "profileSource",
  "profileSourceIdentity",
] as const
const PROFILE_KEYS = [...INPUT_KEYS, "version", "profileIdentity"] as const

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((item) => canonicalize(item)).join(",")}]`
  const record = value as Record<string, unknown>
  return `{${Object.keys(record)
    .sort(compareStrings)
    .map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`)
    .join(",")}}`
}

function sha256(value: unknown): string {
  return createHash("sha256").update(canonicalize(value), "utf8").digest("hex")
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.keys(record)) {
    if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
  }
}

function boundedId(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (value.includes("\0")) throw new TypeError(`${label} must be NUL-free`)
  if (Buffer.byteLength(value, "utf8") > MAX_ID_BYTES) throw new RangeError(`${label} exceeds ${MAX_ID_BYTES} UTF-8 bytes`)
  return value
}

function structuralIdentity(value: unknown, label: string): string {
  const text = boundedId(value, label)
  if (!SHA256.test(text)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return text
}

function optionalTokenLimit(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined
  if (!Number.isSafeInteger(value) || (value as number) <= 0 || (value as number) > MAX_TOKEN_LIMIT) {
    throw new RangeError(`${label} must be a positive safe integer`)
  }
  return value as number
}

function canonicalCapabilities(value: unknown, label: string): readonly ModelCapability[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be an array`)
  const seen = new Set<ModelCapability>()
  const normalized: ModelCapability[] = []
  for (const [index, candidate] of value.entries()) {
    if (typeof candidate !== "string" || !CAPABILITY_SET.has(candidate as ModelCapability)) {
      throw new TypeError(`${label}[${index}] is an unsupported model capability`)
    }
    const capability = candidate as ModelCapability
    if (seen.has(capability)) throw new TypeError(`${label} contains duplicate capability: ${capability}`)
    seen.add(capability)
    normalized.push(capability)
  }
  return Object.freeze(normalized.sort(compareStrings))
}

function canonicalRequiredCapabilities(value: readonly ModelCapability[]): readonly ModelCapability[] {
  return canonicalCapabilities(value, "requiredCapabilities")
}

function profilePreimage(profile: Omit<ModelCapabilityProfile, "profileIdentity">): Readonly<Record<string, unknown>> {
  return Object.freeze({
    version: profile.version,
    providerId: profile.providerId,
    modelId: profile.modelId,
    capabilities: profile.capabilities,
    ...(profile.contextWindowTokens === undefined ? {} : { contextWindowTokens: profile.contextWindowTokens }),
    ...(profile.maxOutputTokens === undefined ? {} : { maxOutputTokens: profile.maxOutputTokens }),
    profileSource: profile.profileSource,
    profileSourceIdentity: profile.profileSourceIdentity,
  })
}

function parseProfileInput(value: unknown): Omit<ModelCapabilityProfile, "profileIdentity"> {
  const record = asRecord(value, "modelCapabilityProfile")
  exactKeys(record, INPUT_KEYS, "modelCapabilityProfile")
  const providerId = boundedId(record.providerId, "modelCapabilityProfile.providerId")
  const modelId = boundedId(record.modelId, "modelCapabilityProfile.modelId")
  const capabilities = canonicalCapabilities(record.capabilities, "modelCapabilityProfile.capabilities")
  const contextWindowTokens = optionalTokenLimit(record.contextWindowTokens, "modelCapabilityProfile.contextWindowTokens")
  const maxOutputTokens = optionalTokenLimit(record.maxOutputTokens, "modelCapabilityProfile.maxOutputTokens")
  if (contextWindowTokens !== undefined && maxOutputTokens !== undefined && maxOutputTokens > contextWindowTokens) {
    throw new RangeError("modelCapabilityProfile.maxOutputTokens must not exceed contextWindowTokens")
  }
  if (!SOURCE_SET.has(record.profileSource as ModelCapabilityProfileSource)) {
    throw new TypeError("modelCapabilityProfile.profileSource is unsupported")
  }
  const profileSourceIdentity = structuralIdentity(record.profileSourceIdentity, "modelCapabilityProfile.profileSourceIdentity")

  return Object.freeze({
    version: KDO_C6_MODEL_CAPABILITY_VERSION,
    providerId,
    modelId,
    capabilities,
    ...(contextWindowTokens === undefined ? {} : { contextWindowTokens }),
    ...(maxOutputTokens === undefined ? {} : { maxOutputTokens }),
    profileSource: record.profileSource as ModelCapabilityProfileSource,
    profileSourceIdentity,
  })
}

export function createModelCapabilityProfile(input: ModelCapabilityProfileInput): ModelCapabilityProfile {
  const parsed = parseProfileInput(input)
  return Object.freeze({ ...parsed, profileIdentity: sha256(profilePreimage(parsed)) })
}

export function validateModelCapabilityProfile(value: unknown): ModelCapabilityProfile {
  const record = asRecord(value, "modelCapabilityProfile")
  exactKeys(record, PROFILE_KEYS, "modelCapabilityProfile")
  if (record.version !== KDO_C6_MODEL_CAPABILITY_VERSION) throw new TypeError("unsupported model capability profile version")
  const profileIdentity = structuralIdentity(record.profileIdentity, "modelCapabilityProfile.profileIdentity")
  const parsed = parseProfileInput({
    providerId: record.providerId,
    modelId: record.modelId,
    capabilities: record.capabilities,
    ...(record.contextWindowTokens === undefined ? {} : { contextWindowTokens: record.contextWindowTokens }),
    ...(record.maxOutputTokens === undefined ? {} : { maxOutputTokens: record.maxOutputTokens }),
    profileSource: record.profileSource,
    profileSourceIdentity: record.profileSourceIdentity,
  })
  const expectedIdentity = sha256(profilePreimage(parsed))
  if (profileIdentity !== expectedIdentity) throw new TypeError("modelCapabilityProfile.profileIdentity mismatch")
  return Object.freeze({ ...parsed, profileIdentity })
}

export function checkModelCapabilities(
  profileValue: ModelCapabilityProfile,
  requiredCapabilities: readonly ModelCapability[],
): ModelCapabilityCheck {
  const profile = validateModelCapabilityProfile(profileValue)
  const required = canonicalRequiredCapabilities(requiredCapabilities)
  const available = new Set(profile.capabilities)
  const missing = Object.freeze(required.filter((capability) => !available.has(capability)))
  return Object.freeze({ supported: missing.length === 0, required, missing })
}

export function modelSupports(
  profile: ModelCapabilityProfile,
  ...requiredCapabilities: readonly ModelCapability[]
): boolean {
  return checkModelCapabilities(profile, requiredCapabilities).supported
}

export function selectModelCapabilityProfiles(
  profiles: readonly ModelCapabilityProfile[],
  requiredCapabilities: readonly ModelCapability[],
): readonly ModelCapabilityProfile[] {
  const required = canonicalRequiredCapabilities(requiredCapabilities)
  const validated = profiles.map((profile) => validateModelCapabilityProfile(profile))
  const seen = new Set<string>()
  for (const profile of validated) {
    if (seen.has(profile.profileIdentity)) throw new TypeError(`duplicate model capability profile identity: ${profile.profileIdentity}`)
    seen.add(profile.profileIdentity)
  }
  return Object.freeze(
    validated
      .filter((profile) => checkModelCapabilities(profile, required).supported)
      .sort((left, right) => {
        const provider = compareStrings(left.providerId, right.providerId)
        if (provider !== 0) return provider
        const model = compareStrings(left.modelId, right.modelId)
        return model !== 0 ? model : compareStrings(left.profileIdentity, right.profileIdentity)
      }),
  )
}
