import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  validateSandboxNetworkPolicy,
  validateSandboxResourcePolicy,
  validateSandboxWorkloadRequest,
  type SandboxNetworkPolicy,
  type SandboxResourcePolicy,
  type SandboxWorkloadRequest,
} from "./sandbox-workload.ts"

export const KDO_H4_R3B_BACKEND_CAPABILITY_VERSION = "kodac-h4-r3b-backend-capability-v1" as const
export const KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION = "kodac-h4-r3b-execution-requirement-v1" as const
export const KDO_H4_R3B_BACKEND_OBSERVATION_VERSION = "kodac-h4-r3b-backend-observation-v1" as const
export const KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION = "kodac-h4-r3b-execution-evidence-v1" as const
export const KDO_H4_R3B_BACKEND_FAMILY = "oci-container" as const
export const KDO_H4_R3B_CREDENTIAL_MODE = "none" as const
export const KDO_H4_R3B_DOWNGRADE_POLICY = "forbid" as const

export const KDO_H4_R3B_LIMITS = Object.freeze({
  maxProviderIdBytes: 128,
  maxSemanticRuntimeClasses: 3,
} as const)

export const KDO_H4_R3B_SEMANTIC_RUNTIME_CLASSES = Object.freeze([
  "gvisor",
  "kata-firecracker",
  "kata-qemu",
] as const)

export type SandboxSemanticRuntimeClass = (typeof KDO_H4_R3B_SEMANTIC_RUNTIME_CLASSES)[number]

export interface SandboxBackendCapabilityDeclaration {
  readonly version: typeof KDO_H4_R3B_BACKEND_CAPABILITY_VERSION
  readonly backendFamily: typeof KDO_H4_R3B_BACKEND_FAMILY
  readonly providerId: string
  readonly implementationIdentity: string
  readonly semanticRuntimeClasses: readonly SandboxSemanticRuntimeClass[]
  readonly supportsImmutableImageDigestObservation: boolean
  readonly supportsDenyAllNetworkObservation: boolean
  readonly supportsCpuBudgetObservation: boolean
  readonly supportsMemoryLimitObservation: boolean
  readonly supportsTtlObservation: boolean
  readonly supportsOutputLimitObservation: boolean
  readonly credentialMode: typeof KDO_H4_R3B_CREDENTIAL_MODE
  readonly downgradePolicy: typeof KDO_H4_R3B_DOWNGRADE_POLICY
  readonly capabilityIdentity: string
}

export interface SandboxExecutionRequirement {
  readonly version: typeof KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION
  readonly workload: SandboxWorkloadRequest
  readonly requiredSemanticRuntimeClass: SandboxSemanticRuntimeClass
  readonly downgradePolicy: typeof KDO_H4_R3B_DOWNGRADE_POLICY
  readonly requirementIdentity: string
}

export interface SandboxBackendObservation {
  readonly version: typeof KDO_H4_R3B_BACKEND_OBSERVATION_VERSION
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly capabilityIdentity: string
  readonly observerIdentity: string
  readonly executionInstanceIdentity: string
  readonly observedSourceDigest: string
  readonly observedSemanticRuntimeClass: SandboxSemanticRuntimeClass
  readonly observedNetworkPolicy: SandboxNetworkPolicy
  readonly observedResourcePolicy: SandboxResourcePolicy
  readonly observedCredentialBindingIdentity: null
  readonly downgradeOccurred: false
  readonly observationIdentity: string
}

export interface SandboxExecutionEvidence {
  readonly version: typeof KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION
  readonly requirement: SandboxExecutionRequirement
  readonly capability: SandboxBackendCapabilityDeclaration
  readonly observation: SandboxBackendObservation
  readonly evidenceIdentity: string
}

const SHA256_IDENTITY = /^[0-9a-f]{64}$/
const SHA256_DIGEST = /^sha256:[0-9a-f]{64}$/
const PROVIDER_ID = /^[a-z0-9][a-z0-9._-]{0,127}$/

const RUNTIME_RANK: Readonly<Record<SandboxSemanticRuntimeClass, number>> = Object.freeze({
  gvisor: 0,
  "kata-firecracker": 1,
  "kata-qemu": 2,
})

function sha256Domain(domain: string, payload: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3B\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(payload, "utf8"))
    .digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable) throw new TypeError(`${label}.${key} must be enumerable`)
    if (!("value" in descriptor) || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be a defined data property`)
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

function denseArrayValues(value: unknown, label: string, maximum: number): unknown[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a non-proxy plain array`)
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length")
  if (lengthDescriptor === undefined || !("value" in lengthDescriptor) || typeof lengthDescriptor.value !== "number") {
    throw new TypeError(`${label} length is invalid`)
  }
  const length = lengthDescriptor.value
  if (!Number.isInteger(length) || length < 1 || length > maximum) {
    throw new RangeError(`${label} must contain 1 through ${maximum} entries`)
  }
  const allowed = new Set(["length", ...Array.from({ length }, (_, index) => String(index))])
  for (const [key, descriptor] of Object.entries(descriptors)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains an unexpected array field: ${key}`)
    if (key === "length") continue
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) {
      throw new TypeError(`${label}[${key}] must be a data property`)
    }
    if (!descriptor.enumerable) throw new TypeError(`${label}[${key}] must be enumerable`)
    if (descriptor.value === undefined) throw new TypeError(`${label}[${key}] must be defined`)
  }
  const output: unknown[] = []
  for (let index = 0; index < length; index += 1) {
    const descriptor = descriptors[String(index)]
    if (descriptor === undefined || !("value" in descriptor)) throw new TypeError(`${label} must be dense`)
    output.push(descriptor.value)
  }
  return output
}

function requireIdentity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_IDENTITY.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  }
  return value
}

function requireDigest(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_DIGEST.test(value)) {
    throw new TypeError(`${label} must be sha256:<64 lowercase hex>`)
  }
  return value
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") throw new TypeError(`${label} must be boolean`)
  return value
}

function canonicalProviderId(value: unknown): string {
  if (typeof value !== "string" || !PROVIDER_ID.test(value) || Buffer.byteLength(value, "utf8") > KDO_H4_R3B_LIMITS.maxProviderIdBytes) {
    throw new TypeError("providerId must be 1..128 lowercase ASCII bytes matching ^[a-z0-9][a-z0-9._-]{0,127}$")
  }
  return value
}

function semanticRuntimeClass(value: unknown, label: string): SandboxSemanticRuntimeClass {
  if (typeof value !== "string" || !Object.hasOwn(RUNTIME_RANK, value)) throw new TypeError(`${label} is not an admitted R3B semantic runtime class`)
  return value as SandboxSemanticRuntimeClass
}

function canonicalRuntimeClasses(value: unknown): readonly SandboxSemanticRuntimeClass[] {
  const entries = denseArrayValues(value, "semanticRuntimeClasses", KDO_H4_R3B_LIMITS.maxSemanticRuntimeClasses)
  const classes = entries.map((entry, index) => semanticRuntimeClass(entry, `semanticRuntimeClasses[${index}]`))
  for (let index = 1; index < classes.length; index += 1) {
    if (RUNTIME_RANK[classes[index - 1]!] >= RUNTIME_RANK[classes[index]!]) {
      throw new TypeError("semanticRuntimeClasses must be unique and strictly rank-increasing")
    }
  }
  return Object.freeze([...classes])
}

function capabilityPreimage(input: Omit<SandboxBackendCapabilityDeclaration, "capabilityIdentity">): string {
  return JSON.stringify({
    version: input.version,
    backendFamily: input.backendFamily,
    providerId: input.providerId,
    implementationIdentity: input.implementationIdentity,
    semanticRuntimeClasses: input.semanticRuntimeClasses,
    supportsImmutableImageDigestObservation: input.supportsImmutableImageDigestObservation,
    supportsDenyAllNetworkObservation: input.supportsDenyAllNetworkObservation,
    supportsCpuBudgetObservation: input.supportsCpuBudgetObservation,
    supportsMemoryLimitObservation: input.supportsMemoryLimitObservation,
    supportsTtlObservation: input.supportsTtlObservation,
    supportsOutputLimitObservation: input.supportsOutputLimitObservation,
    credentialMode: input.credentialMode,
    downgradePolicy: input.downgradePolicy,
  })
}

export function createSandboxBackendCapabilityDeclaration(input: {
  providerId: string
  implementationIdentity: string
  semanticRuntimeClasses: readonly SandboxSemanticRuntimeClass[]
  supportsImmutableImageDigestObservation: boolean
  supportsDenyAllNetworkObservation: boolean
  supportsCpuBudgetObservation: boolean
  supportsMemoryLimitObservation: boolean
  supportsTtlObservation: boolean
  supportsOutputLimitObservation: boolean
}): SandboxBackendCapabilityDeclaration {
  const record = asPlainRecord(input, "sandbox backend capability input")
  exactKeys(record, [
    "providerId", "implementationIdentity", "semanticRuntimeClasses",
    "supportsImmutableImageDigestObservation", "supportsDenyAllNetworkObservation",
    "supportsCpuBudgetObservation", "supportsMemoryLimitObservation", "supportsTtlObservation",
    "supportsOutputLimitObservation",
  ], "sandbox backend capability input")
  const base = Object.freeze({
    version: KDO_H4_R3B_BACKEND_CAPABILITY_VERSION,
    backendFamily: KDO_H4_R3B_BACKEND_FAMILY,
    providerId: canonicalProviderId(record.providerId),
    implementationIdentity: requireIdentity(record.implementationIdentity, "implementationIdentity"),
    semanticRuntimeClasses: canonicalRuntimeClasses(record.semanticRuntimeClasses),
    supportsImmutableImageDigestObservation: requireBoolean(record.supportsImmutableImageDigestObservation, "supportsImmutableImageDigestObservation"),
    supportsDenyAllNetworkObservation: requireBoolean(record.supportsDenyAllNetworkObservation, "supportsDenyAllNetworkObservation"),
    supportsCpuBudgetObservation: requireBoolean(record.supportsCpuBudgetObservation, "supportsCpuBudgetObservation"),
    supportsMemoryLimitObservation: requireBoolean(record.supportsMemoryLimitObservation, "supportsMemoryLimitObservation"),
    supportsTtlObservation: requireBoolean(record.supportsTtlObservation, "supportsTtlObservation"),
    supportsOutputLimitObservation: requireBoolean(record.supportsOutputLimitObservation, "supportsOutputLimitObservation"),
    credentialMode: KDO_H4_R3B_CREDENTIAL_MODE,
    downgradePolicy: KDO_H4_R3B_DOWNGRADE_POLICY,
  })
  return Object.freeze({ ...base, capabilityIdentity: sha256Domain("BACKEND_CAPABILITY", capabilityPreimage(base)) })
}

export function validateSandboxBackendCapabilityDeclaration(value: unknown): SandboxBackendCapabilityDeclaration {
  const record = asPlainRecord(value, "sandbox backend capability")
  exactKeys(record, [
    "version", "backendFamily", "providerId", "implementationIdentity", "semanticRuntimeClasses",
    "supportsImmutableImageDigestObservation", "supportsDenyAllNetworkObservation",
    "supportsCpuBudgetObservation", "supportsMemoryLimitObservation", "supportsTtlObservation",
    "supportsOutputLimitObservation", "credentialMode", "downgradePolicy", "capabilityIdentity",
  ], "sandbox backend capability")
  if (record.version !== KDO_H4_R3B_BACKEND_CAPABILITY_VERSION) throw new TypeError("sandbox backend capability version mismatch")
  if (record.backendFamily !== KDO_H4_R3B_BACKEND_FAMILY) throw new TypeError("sandbox backend family mismatch")
  if (record.credentialMode !== KDO_H4_R3B_CREDENTIAL_MODE) throw new TypeError("sandbox backend credential mode mismatch")
  if (record.downgradePolicy !== KDO_H4_R3B_DOWNGRADE_POLICY) throw new TypeError("sandbox backend downgrade policy mismatch")
  const rebuilt = createSandboxBackendCapabilityDeclaration({
    providerId: record.providerId as string,
    implementationIdentity: record.implementationIdentity as string,
    semanticRuntimeClasses: record.semanticRuntimeClasses as readonly SandboxSemanticRuntimeClass[],
    supportsImmutableImageDigestObservation: record.supportsImmutableImageDigestObservation as boolean,
    supportsDenyAllNetworkObservation: record.supportsDenyAllNetworkObservation as boolean,
    supportsCpuBudgetObservation: record.supportsCpuBudgetObservation as boolean,
    supportsMemoryLimitObservation: record.supportsMemoryLimitObservation as boolean,
    supportsTtlObservation: record.supportsTtlObservation as boolean,
    supportsOutputLimitObservation: record.supportsOutputLimitObservation as boolean,
  })
  if (requireIdentity(record.capabilityIdentity, "capabilityIdentity") !== rebuilt.capabilityIdentity) {
    throw new TypeError("sandbox backend capability identity mismatch")
  }
  return rebuilt
}

function requirementPreimage(input: Omit<SandboxExecutionRequirement, "requirementIdentity">): string {
  const workload = input.workload
  return JSON.stringify({
    version: input.version,
    workloadIdentity: workload.workloadIdentity,
    sourceDigest: workload.source.digest,
    executionIntentIdentity: workload.executionIntentIdentity,
    confinementRequestIdentity: workload.confinementRequestIdentity,
    networkPolicyIdentity: workload.networkPolicy.networkPolicyIdentity,
    resourcePolicyIdentity: workload.resourcePolicy.resourcePolicyIdentity,
    cpuMillis: workload.resourcePolicy.cpuMillis,
    memoryBytes: workload.resourcePolicy.memoryBytes,
    ttlMs: workload.resourcePolicy.ttlMs,
    maxOutputBytes: workload.resourcePolicy.maxOutputBytes,
    credentialBindingIdentity: workload.credentialBindingIdentity,
    requiredSemanticRuntimeClass: input.requiredSemanticRuntimeClass,
    downgradePolicy: input.downgradePolicy,
  })
}

export function createSandboxExecutionRequirement(input: {
  workload: SandboxWorkloadRequest
  requiredSemanticRuntimeClass: SandboxSemanticRuntimeClass
}): SandboxExecutionRequirement {
  const record = asPlainRecord(input, "sandbox execution requirement input")
  exactKeys(record, ["workload", "requiredSemanticRuntimeClass"], "sandbox execution requirement input")
  const base = Object.freeze({
    version: KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION,
    workload: validateSandboxWorkloadRequest(record.workload),
    requiredSemanticRuntimeClass: semanticRuntimeClass(record.requiredSemanticRuntimeClass, "requiredSemanticRuntimeClass"),
    downgradePolicy: KDO_H4_R3B_DOWNGRADE_POLICY,
  })
  return Object.freeze({ ...base, requirementIdentity: sha256Domain("EXECUTION_REQUIREMENT", requirementPreimage(base)) })
}

export function validateSandboxExecutionRequirement(value: unknown): SandboxExecutionRequirement {
  const record = asPlainRecord(value, "sandbox execution requirement")
  exactKeys(record, ["version", "workload", "requiredSemanticRuntimeClass", "downgradePolicy", "requirementIdentity"], "sandbox execution requirement")
  if (record.version !== KDO_H4_R3B_EXECUTION_REQUIREMENT_VERSION) throw new TypeError("sandbox execution requirement version mismatch")
  if (record.downgradePolicy !== KDO_H4_R3B_DOWNGRADE_POLICY) throw new TypeError("sandbox execution requirement downgrade policy mismatch")
  const rebuilt = createSandboxExecutionRequirement({
    workload: record.workload as SandboxWorkloadRequest,
    requiredSemanticRuntimeClass: record.requiredSemanticRuntimeClass as SandboxSemanticRuntimeClass,
  })
  if (requireIdentity(record.requirementIdentity, "requirementIdentity") !== rebuilt.requirementIdentity) {
    throw new TypeError("sandbox execution requirement identity mismatch")
  }
  return rebuilt
}

function observationPreimage(input: Omit<SandboxBackendObservation, "observationIdentity">): string {
  return JSON.stringify({
    version: input.version,
    requirementIdentity: input.requirementIdentity,
    workloadIdentity: input.workloadIdentity,
    capabilityIdentity: input.capabilityIdentity,
    observerIdentity: input.observerIdentity,
    executionInstanceIdentity: input.executionInstanceIdentity,
    observedSourceDigest: input.observedSourceDigest,
    observedSemanticRuntimeClass: input.observedSemanticRuntimeClass,
    observedNetworkPolicyIdentity: input.observedNetworkPolicy.networkPolicyIdentity,
    observedResourcePolicyIdentity: input.observedResourcePolicy.resourcePolicyIdentity,
    cpuMillis: input.observedResourcePolicy.cpuMillis,
    memoryBytes: input.observedResourcePolicy.memoryBytes,
    ttlMs: input.observedResourcePolicy.ttlMs,
    maxOutputBytes: input.observedResourcePolicy.maxOutputBytes,
    observedCredentialBindingIdentity: input.observedCredentialBindingIdentity,
    downgradeOccurred: input.downgradeOccurred,
  })
}

export function createSandboxBackendObservation(input: {
  requirementIdentity: string
  workloadIdentity: string
  capabilityIdentity: string
  observerIdentity: string
  executionInstanceIdentity: string
  observedSourceDigest: string
  observedSemanticRuntimeClass: SandboxSemanticRuntimeClass
  observedNetworkPolicy: SandboxNetworkPolicy
  observedResourcePolicy: SandboxResourcePolicy
  observedCredentialBindingIdentity: null
  downgradeOccurred: false
}): SandboxBackendObservation {
  const record = asPlainRecord(input, "sandbox backend observation input")
  exactKeys(record, [
    "requirementIdentity", "workloadIdentity", "capabilityIdentity", "observerIdentity", "executionInstanceIdentity",
    "observedSourceDigest", "observedSemanticRuntimeClass", "observedNetworkPolicy", "observedResourcePolicy",
    "observedCredentialBindingIdentity", "downgradeOccurred",
  ], "sandbox backend observation input")
  if (record.observedCredentialBindingIdentity !== null) throw new TypeError("R3B observedCredentialBindingIdentity must be null")
  if (record.downgradeOccurred !== false) throw new TypeError("R3B backend observation must report downgradeOccurred=false")
  const base = Object.freeze({
    version: KDO_H4_R3B_BACKEND_OBSERVATION_VERSION,
    requirementIdentity: requireIdentity(record.requirementIdentity, "observation requirementIdentity"),
    workloadIdentity: requireIdentity(record.workloadIdentity, "observation workloadIdentity"),
    capabilityIdentity: requireIdentity(record.capabilityIdentity, "observation capabilityIdentity"),
    observerIdentity: requireIdentity(record.observerIdentity, "observerIdentity"),
    executionInstanceIdentity: requireIdentity(record.executionInstanceIdentity, "executionInstanceIdentity"),
    observedSourceDigest: requireDigest(record.observedSourceDigest, "observedSourceDigest"),
    observedSemanticRuntimeClass: semanticRuntimeClass(record.observedSemanticRuntimeClass, "observedSemanticRuntimeClass"),
    observedNetworkPolicy: validateSandboxNetworkPolicy(record.observedNetworkPolicy),
    observedResourcePolicy: validateSandboxResourcePolicy(record.observedResourcePolicy),
    observedCredentialBindingIdentity: null,
    downgradeOccurred: false as const,
  })
  return Object.freeze({ ...base, observationIdentity: sha256Domain("BACKEND_OBSERVATION", observationPreimage(base)) })
}

export function validateSandboxBackendObservation(value: unknown): SandboxBackendObservation {
  const record = asPlainRecord(value, "sandbox backend observation")
  exactKeys(record, [
    "version", "requirementIdentity", "workloadIdentity", "capabilityIdentity", "observerIdentity",
    "executionInstanceIdentity", "observedSourceDigest", "observedSemanticRuntimeClass", "observedNetworkPolicy",
    "observedResourcePolicy", "observedCredentialBindingIdentity", "downgradeOccurred", "observationIdentity",
  ], "sandbox backend observation")
  if (record.version !== KDO_H4_R3B_BACKEND_OBSERVATION_VERSION) throw new TypeError("sandbox backend observation version mismatch")
  const rebuilt = createSandboxBackendObservation({
    requirementIdentity: record.requirementIdentity as string,
    workloadIdentity: record.workloadIdentity as string,
    capabilityIdentity: record.capabilityIdentity as string,
    observerIdentity: record.observerIdentity as string,
    executionInstanceIdentity: record.executionInstanceIdentity as string,
    observedSourceDigest: record.observedSourceDigest as string,
    observedSemanticRuntimeClass: record.observedSemanticRuntimeClass as SandboxSemanticRuntimeClass,
    observedNetworkPolicy: record.observedNetworkPolicy as SandboxNetworkPolicy,
    observedResourcePolicy: record.observedResourcePolicy as SandboxResourcePolicy,
    observedCredentialBindingIdentity: record.observedCredentialBindingIdentity as null,
    downgradeOccurred: record.downgradeOccurred as false,
  })
  if (requireIdentity(record.observationIdentity, "observationIdentity") !== rebuilt.observationIdentity) {
    throw new TypeError("sandbox backend observation identity mismatch")
  }
  return rebuilt
}

function requireEvidenceCapability(capability: SandboxBackendCapabilityDeclaration): void {
  const required: ReadonlyArray<readonly [boolean, string]> = [
    [capability.supportsImmutableImageDigestObservation, "immutable image digest observation"],
    [capability.supportsDenyAllNetworkObservation, "deny-all network observation"],
    [capability.supportsCpuBudgetObservation, "CPU budget observation"],
    [capability.supportsMemoryLimitObservation, "memory limit observation"],
    [capability.supportsTtlObservation, "TTL observation"],
    [capability.supportsOutputLimitObservation, "output limit observation"],
  ]
  for (const [supported, label] of required) {
    if (!supported) throw new TypeError(`sandbox backend capability is insufficient: ${label} is required`)
  }
}

function evidencePreimage(input: Omit<SandboxExecutionEvidence, "evidenceIdentity">): string {
  return JSON.stringify({
    version: input.version,
    requirementIdentity: input.requirement.requirementIdentity,
    capabilityIdentity: input.capability.capabilityIdentity,
    observationIdentity: input.observation.observationIdentity,
  })
}

export function createSandboxExecutionEvidence(input: {
  requirement: SandboxExecutionRequirement
  capability: SandboxBackendCapabilityDeclaration
  observation: SandboxBackendObservation
}): SandboxExecutionEvidence {
  const record = asPlainRecord(input, "sandbox execution evidence input")
  exactKeys(record, ["requirement", "capability", "observation"], "sandbox execution evidence input")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  const capability = validateSandboxBackendCapabilityDeclaration(record.capability)
  const observation = validateSandboxBackendObservation(record.observation)
  requireEvidenceCapability(capability)

  if (!capability.semanticRuntimeClasses.includes(requirement.requiredSemanticRuntimeClass)) {
    throw new TypeError("sandbox backend capability does not support required semantic runtime class")
  }
  if (observation.requirementIdentity !== requirement.requirementIdentity) throw new TypeError("observation requirement identity mismatch")
  if (observation.capabilityIdentity !== capability.capabilityIdentity) throw new TypeError("observation capability identity mismatch")
  if (observation.workloadIdentity !== requirement.workload.workloadIdentity) throw new TypeError("observation workload identity mismatch")
  if (observation.observedSourceDigest !== requirement.workload.source.digest) throw new TypeError("observed source digest mismatch")
  if (observation.observedSemanticRuntimeClass !== requirement.requiredSemanticRuntimeClass) throw new TypeError("observed semantic runtime class mismatch")
  if (observation.observedNetworkPolicy.networkPolicyIdentity !== requirement.workload.networkPolicy.networkPolicyIdentity) {
    throw new TypeError("observed network policy identity mismatch")
  }
  if (observation.observedResourcePolicy.resourcePolicyIdentity !== requirement.workload.resourcePolicy.resourcePolicyIdentity) {
    throw new TypeError("observed resource policy identity mismatch")
  }
  const observedResource = observation.observedResourcePolicy
  const requiredResource = requirement.workload.resourcePolicy
  if (
    observedResource.cpuMillis !== requiredResource.cpuMillis ||
    observedResource.memoryBytes !== requiredResource.memoryBytes ||
    observedResource.ttlMs !== requiredResource.ttlMs ||
    observedResource.maxOutputBytes !== requiredResource.maxOutputBytes
  ) throw new TypeError("observed resource policy values mismatch")
  if (observation.observedCredentialBindingIdentity !== null || requirement.workload.credentialBindingIdentity !== null) {
    throw new TypeError("R3B evidence requires null credential binding")
  }
  if (capability.downgradePolicy !== KDO_H4_R3B_DOWNGRADE_POLICY || requirement.downgradePolicy !== KDO_H4_R3B_DOWNGRADE_POLICY || observation.downgradeOccurred !== false) {
    throw new TypeError("R3B evidence forbids runtime downgrade")
  }

  const base = Object.freeze({
    version: KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION,
    requirement,
    capability,
    observation,
  })
  return Object.freeze({ ...base, evidenceIdentity: sha256Domain("EXECUTION_EVIDENCE", evidencePreimage(base)) })
}

export function validateSandboxExecutionEvidence(value: unknown): SandboxExecutionEvidence {
  const record = asPlainRecord(value, "sandbox execution evidence")
  exactKeys(record, ["version", "requirement", "capability", "observation", "evidenceIdentity"], "sandbox execution evidence")
  if (record.version !== KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION) throw new TypeError("sandbox execution evidence version mismatch")
  const rebuilt = createSandboxExecutionEvidence({
    requirement: record.requirement as SandboxExecutionRequirement,
    capability: record.capability as SandboxBackendCapabilityDeclaration,
    observation: record.observation as SandboxBackendObservation,
  })
  if (requireIdentity(record.evidenceIdentity, "evidenceIdentity") !== rebuilt.evidenceIdentity) {
    throw new TypeError("sandbox execution evidence identity mismatch")
  }
  return rebuilt
}
