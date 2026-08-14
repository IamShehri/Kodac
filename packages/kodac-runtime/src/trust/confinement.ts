import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

export const KDO_H4_R2A_CONFINEMENT_VERSION = "kodac-h4-r2a-confinement-v1" as const
export const KDO_H4_R2A_ENFORCEMENT_EVIDENCE_VERSION = "kodac-h4-r2a-enforcement-evidence-v1" as const

export const CONFINEMENT_MODES = ["read-only", "workspace-write", "danger-full-access"] as const
export type ConfinementMode = (typeof CONFINEMENT_MODES)[number]

export const CONFINEMENT_ENFORCEMENT_RESULTS = ["full", "partial", "unavailable"] as const
export type ConfinementEnforcementResult = (typeof CONFINEMENT_ENFORCEMENT_RESULTS)[number]

export const CONFINEMENT_PLATFORM_FAMILIES = ["linux", "macos", "windows", "other"] as const
export type ConfinementPlatformFamily = (typeof CONFINEMENT_PLATFORM_FAMILIES)[number]

const MAX_ID_BYTES = 256
const MAX_PATH_BYTES = 1024
const MAX_SCOPE_ITEMS = 256
const MAX_REASON_BYTES = 4096
const MAX_BACKEND_NAME_BYTES = 160
const MAX_BACKEND_REVISION_BYTES = 256

export interface ConfinementScope {
  readPaths: string[]
  writePaths: string[]
}

export interface ConfinementRequest {
  version: typeof KDO_H4_R2A_CONFINEMENT_VERSION
  requestIdentity: string
  mode: ConfinementMode
  workspaceIdentity: string
  executionIntentIdentity: string
  scope: ConfinementScope
}

export interface ConfinementBackendDescriptor {
  version: typeof KDO_H4_R2A_CONFINEMENT_VERSION
  backendIdentity: string
  name: string
  revision: string
  platform: ConfinementPlatformFamily
  supportedModes: ConfinementMode[]
}

export interface ConfinementEnforcementEvidence {
  version: typeof KDO_H4_R2A_ENFORCEMENT_EVIDENCE_VERSION
  evidenceIdentity: string
  requestIdentity: string
  executionAttemptIdentity: string
  backend: ConfinementBackendDescriptor
  enforcement: ConfinementEnforcementResult
  reason: string
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function requireBoundedString(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`)
  if (byteLength(value) > maxBytes) throw new TypeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function requireIdentity(value: unknown, label: string): string {
  const identity = requireBoundedString(value, label, MAX_ID_BYTES)
  if (!/^[0-9a-f]{64}$/.test(identity)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return identity
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable) throw new TypeError(`${label}.${key} must be enumerable`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function denseArrayValues(value: unknown, label: string, maxItems: number): unknown[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a plain array`)
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length")
  if (lengthDescriptor === undefined || !("value" in lengthDescriptor) || typeof lengthDescriptor.value !== "number") {
    throw new TypeError(`${label} length is invalid`)
  }
  const length = lengthDescriptor.value
  if (!Number.isInteger(length) || length < 0 || length > maxItems) throw new TypeError(`${label} exceeds ${maxItems} entries`)
  const allowedKeys = new Set(["length", ...Array.from({ length }, (_, index) => String(index))])
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!allowedKeys.has(key)) throw new TypeError(`${label} contains an unexpected array field: ${key}`)
    if (key !== "length" && (descriptor.get !== undefined || descriptor.set !== undefined)) {
      throw new TypeError(`${label}[${key}] must be a data property`)
    }
  }
  const values: unknown[] = []
  for (let index = 0; index < length; index += 1) {
    const descriptor = descriptors[String(index)]
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError(`${label} must be dense`)
    values.push(descriptor.value)
  }
  return values
}

function requireEnum<T extends string>(value: unknown, values: readonly T[], label: string): T {
  if (typeof value !== "string" || !values.includes(value as T)) throw new TypeError(`${label} is invalid`)
  return value as T
}

function validateCanonicalPath(path: unknown, label: string): string {
  const value = requireBoundedString(path, label, MAX_PATH_BYTES)
  if (value.includes("\0") || value.includes("\\") || value.startsWith("/") || /^[A-Za-z]:/.test(value)) {
    throw new TypeError(`${label} must be a portable workspace-relative path`)
  }
  const segments = value.split("/")
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new TypeError(`${label} must be canonical and traversal-free`)
  }
  return value
}

function canonicalScope(value: unknown): ConfinementScope {
  const record = asPlainRecord(value, "confinement scope")
  exactKeys(record, ["readPaths", "writePaths"], "confinement scope")

  const buildPaths = (input: unknown, label: string): string[] => {
    const entries = denseArrayValues(input, label, MAX_SCOPE_ITEMS)
    const paths = entries.map((entry, index) => validateCanonicalPath(entry, `${label}[${index}]`))
    const sorted = [...paths].sort()
    if (paths.some((path, index) => path !== sorted[index])) throw new TypeError(`${label} must be in canonical sorted order`)
    if (new Set(paths).size !== paths.length) throw new TypeError(`${label} must not contain duplicates`)
    return Object.freeze([...paths]) as unknown as string[]
  }

  const readPaths = buildPaths(record.readPaths, "confinement scope readPaths")
  const writePaths = buildPaths(record.writePaths, "confinement scope writePaths")
  const overlap = readPaths.find((path) => writePaths.includes(path))
  if (overlap !== undefined) throw new TypeError(`confinement scope path cannot appear in both readPaths and writePaths: ${overlap}`)

  return Object.freeze({ readPaths, writePaths })
}

function requestPreimage(input: Omit<ConfinementRequest, "requestIdentity">): string {
  return JSON.stringify({
    version: input.version,
    mode: input.mode,
    workspaceIdentity: input.workspaceIdentity,
    executionIntentIdentity: input.executionIntentIdentity,
    scope: input.scope,
  })
}

export function createConfinementRequest(input: {
  mode: ConfinementMode
  workspaceIdentity: string
  executionIntentIdentity: string
  scope: ConfinementScope
}): ConfinementRequest {
  const record = asPlainRecord(input, "confinement request input")
  exactKeys(record, ["mode", "workspaceIdentity", "executionIntentIdentity", "scope"], "confinement request input")
  const mode = requireEnum(record.mode, CONFINEMENT_MODES, "confinement mode")
  const workspaceIdentity = requireIdentity(record.workspaceIdentity, "workspaceIdentity")
  const executionIntentIdentity = requireIdentity(record.executionIntentIdentity, "executionIntentIdentity")
  const scope = canonicalScope(record.scope)
  const base = Object.freeze({
    version: KDO_H4_R2A_CONFINEMENT_VERSION,
    mode,
    workspaceIdentity,
    executionIntentIdentity,
    scope,
  })
  return Object.freeze({ ...base, requestIdentity: sha256(requestPreimage(base)) })
}

export function validateConfinementRequest(value: unknown): ConfinementRequest {
  const record = asPlainRecord(value, "confinement request")
  exactKeys(record, ["version", "requestIdentity", "mode", "workspaceIdentity", "executionIntentIdentity", "scope"], "confinement request")
  if (record.version !== KDO_H4_R2A_CONFINEMENT_VERSION) throw new TypeError("confinement request version mismatch")
  const rebuilt = createConfinementRequest({
    mode: requireEnum(record.mode, CONFINEMENT_MODES, "confinement mode"),
    workspaceIdentity: requireIdentity(record.workspaceIdentity, "workspaceIdentity"),
    executionIntentIdentity: requireIdentity(record.executionIntentIdentity, "executionIntentIdentity"),
    scope: canonicalScope(record.scope),
  })
  const requestIdentity = requireIdentity(record.requestIdentity, "requestIdentity")
  if (requestIdentity !== rebuilt.requestIdentity) throw new TypeError("confinement request identity mismatch")
  return rebuilt
}

function backendPreimage(input: Omit<ConfinementBackendDescriptor, "backendIdentity">): string {
  return JSON.stringify({
    version: input.version,
    name: input.name,
    revision: input.revision,
    platform: input.platform,
    supportedModes: input.supportedModes,
  })
}

export function createConfinementBackendDescriptor(input: {
  name: string
  revision: string
  platform: ConfinementPlatformFamily
  supportedModes: ConfinementMode[]
}): ConfinementBackendDescriptor {
  const record = asPlainRecord(input, "confinement backend input")
  exactKeys(record, ["name", "revision", "platform", "supportedModes"], "confinement backend input")
  const name = requireBoundedString(record.name, "confinement backend name", MAX_BACKEND_NAME_BYTES)
  const revision = requireBoundedString(record.revision, "confinement backend revision", MAX_BACKEND_REVISION_BYTES)
  const platform = requireEnum(record.platform, CONFINEMENT_PLATFORM_FAMILIES, "confinement backend platform")
  const modeEntries = denseArrayValues(record.supportedModes, "confinement backend supportedModes", CONFINEMENT_MODES.length)
  if (modeEntries.length === 0) throw new TypeError("confinement backend supportedModes must contain 1..3 entries")
  const supportedModes = modeEntries.map((mode) => requireEnum(mode, CONFINEMENT_MODES, "confinement backend supported mode"))
  const canonicalModes = [...supportedModes].sort()
  if (supportedModes.some((mode, index) => mode !== canonicalModes[index])) throw new TypeError("confinement backend supportedModes must be in canonical sorted order")
  if (new Set(supportedModes).size !== supportedModes.length) throw new TypeError("confinement backend supportedModes must not contain duplicates")
  const frozenModes = Object.freeze([...supportedModes]) as unknown as ConfinementMode[]
  const base = Object.freeze({ version: KDO_H4_R2A_CONFINEMENT_VERSION, name, revision, platform, supportedModes: frozenModes })
  return Object.freeze({ ...base, backendIdentity: sha256(backendPreimage(base)) })
}

export function validateConfinementBackendDescriptor(value: unknown): ConfinementBackendDescriptor {
  const record = asPlainRecord(value, "confinement backend descriptor")
  exactKeys(record, ["version", "backendIdentity", "name", "revision", "platform", "supportedModes"], "confinement backend descriptor")
  if (record.version !== KDO_H4_R2A_CONFINEMENT_VERSION) throw new TypeError("confinement backend version mismatch")
  const rebuilt = createConfinementBackendDescriptor({
    name: requireBoundedString(record.name, "confinement backend name", MAX_BACKEND_NAME_BYTES),
    revision: requireBoundedString(record.revision, "confinement backend revision", MAX_BACKEND_REVISION_BYTES),
    platform: requireEnum(record.platform, CONFINEMENT_PLATFORM_FAMILIES, "confinement backend platform"),
    supportedModes: denseArrayValues(record.supportedModes, "confinement backend supportedModes", CONFINEMENT_MODES.length) as ConfinementMode[],
  })
  const backendIdentity = requireIdentity(record.backendIdentity, "backendIdentity")
  if (backendIdentity !== rebuilt.backendIdentity) throw new TypeError("confinement backend identity mismatch")
  return rebuilt
}

function evidencePreimage(input: Omit<ConfinementEnforcementEvidence, "evidenceIdentity">): string {
  return JSON.stringify({
    version: input.version,
    requestIdentity: input.requestIdentity,
    executionAttemptIdentity: input.executionAttemptIdentity,
    backend: input.backend,
    enforcement: input.enforcement,
    reason: input.reason,
  })
}

export function createConfinementEnforcementEvidence(input: {
  request: ConfinementRequest
  executionAttemptIdentity: string
  backend: ConfinementBackendDescriptor
  enforcement: ConfinementEnforcementResult
  reason: string
}): ConfinementEnforcementEvidence {
  const record = asPlainRecord(input, "confinement evidence input")
  exactKeys(record, ["request", "executionAttemptIdentity", "backend", "enforcement", "reason"], "confinement evidence input")
  const request = validateConfinementRequest(record.request)
  const executionAttemptIdentity = requireIdentity(record.executionAttemptIdentity, "executionAttemptIdentity")
  const backend = validateConfinementBackendDescriptor(record.backend)
  const enforcement = requireEnum(record.enforcement, CONFINEMENT_ENFORCEMENT_RESULTS, "confinement enforcement result")
  const reason = requireBoundedString(record.reason, "confinement enforcement reason", MAX_REASON_BYTES)
  const base = Object.freeze({
    version: KDO_H4_R2A_ENFORCEMENT_EVIDENCE_VERSION,
    requestIdentity: request.requestIdentity,
    executionAttemptIdentity,
    backend,
    enforcement,
    reason,
  })
  return Object.freeze({ ...base, evidenceIdentity: sha256(evidencePreimage(base)) })
}

export function validateConfinementEnforcementEvidence(value: unknown): ConfinementEnforcementEvidence {
  const record = asPlainRecord(value, "confinement enforcement evidence")
  exactKeys(record, ["version", "evidenceIdentity", "requestIdentity", "executionAttemptIdentity", "backend", "enforcement", "reason"], "confinement enforcement evidence")
  if (record.version !== KDO_H4_R2A_ENFORCEMENT_EVIDENCE_VERSION) throw new TypeError("confinement evidence version mismatch")
  const requestIdentity = requireIdentity(record.requestIdentity, "requestIdentity")
  const executionAttemptIdentity = requireIdentity(record.executionAttemptIdentity, "executionAttemptIdentity")
  const backend = validateConfinementBackendDescriptor(record.backend)
  const enforcement = requireEnum(record.enforcement, CONFINEMENT_ENFORCEMENT_RESULTS, "confinement enforcement result")
  const reason = requireBoundedString(record.reason, "confinement enforcement reason", MAX_REASON_BYTES)
  const base = Object.freeze({ version: KDO_H4_R2A_ENFORCEMENT_EVIDENCE_VERSION, requestIdentity, executionAttemptIdentity, backend, enforcement, reason })
  const evidenceIdentity = requireIdentity(record.evidenceIdentity, "evidenceIdentity")
  if (evidenceIdentity !== sha256(evidencePreimage(base))) throw new TypeError("confinement evidence identity mismatch")
  return Object.freeze({ ...base, evidenceIdentity })
}
