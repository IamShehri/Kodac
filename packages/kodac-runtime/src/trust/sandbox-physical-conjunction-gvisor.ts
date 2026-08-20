import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  KDO_H4_R3B_BACKEND_CAPABILITY_VERSION,
  KDO_H4_R3B_BACKEND_OBSERVATION_VERSION,
  KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION,
  createSandboxBackendCapabilityDeclaration,
  createSandboxBackendObservation,
  createSandboxExecutionEvidence,
  validateSandboxBackendCapabilityDeclaration,
  validateSandboxBackendObservation,
  validateSandboxExecutionEvidence,
  validateSandboxExecutionRequirement,
  type SandboxBackendCapabilityDeclaration,
  type SandboxBackendObservation,
  type SandboxExecutionEvidence,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"
import {
  KDO_H4_R3G_A_COMMIT_VERSION,
  KDO_H4_R3G_A_RECORD_VERSION,
  validateGvisorCgroupV2ResourceCommit,
  validateGvisorCgroupV2ResourceRecord,
  type GvisorCgroupV2ResourceCommit,
  type GvisorCgroupV2ResourceRecord,
} from "./sandbox-observer-gvisor-cgroup-v2.ts"
import {
  KDO_H4_R3G_B_COMMIT_VERSION,
  KDO_H4_R3G_B_VERSION,
  validateGvisorSourceLineageCommit,
  validateGvisorSourceLineageRecord,
  type GvisorSourceLineageCommit,
  type GvisorSourceLineageRecord,
} from "./sandbox-observer-gvisor-source-lineage.ts"
import {
  KDO_H4_R3G_C_COMMIT_VERSION,
  KDO_H4_R3G_C_NETWORK_POLICY,
  KDO_H4_R3G_C_VERSION,
  validateGvisorPhysicalNetworkCommit,
  validateGvisorPhysicalNetworkRecord,
  type GvisorPhysicalNetworkCommit,
  type GvisorPhysicalNetworkRecord,
} from "./sandbox-observer-gvisor-network.ts"
import {
  KDO_H4_R3G_D_ARM_RECORD_VERSION,
  KDO_H4_R3G_D_COMMIT_VERSION,
  KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
  payloadDigest as ttlPayloadDigest,
  validateGvisorTtlArmRecord,
  validateGvisorTtlEvidenceCommit,
  validateGvisorTtlTerminalRecord,
  type GvisorTtlArmRecord,
  type GvisorTtlEvidenceCommit,
  type GvisorTtlTerminalRecord,
} from "./sandbox-lifecycle-gvisor-ttl.ts"
import {
  KDO_H4_R3G_E_COMMIT_VERSION,
  KDO_H4_R3G_E_OUTPUT_VERSION,
  validateGvisorOutputBoundCommit,
  validateGvisorOutputBoundRecord,
  type GvisorOutputBoundCommit,
  type GvisorOutputBoundRecord,
} from "./sandbox-output-gvisor.ts"

export const KDO_H4_R3G_F_VERSION = "kodac-h4-r3g-f-physical-proof-conjunction-v1" as const
export const KDO_H4_R3G_F_RESOLUTION_VERSION = "kodac-h4-r3g-f-evidence-resolution-v1" as const
export const KDO_H4_R3G_F_COHERENCE_VERSION = "kodac-h4-r3g-f-subject-coherence-v1" as const
export const KDO_H4_R3G_F_RECORD_VERSION = "kodac-h4-r3g-f-conjunction-record-v1" as const
export const KDO_H4_R3G_F_COMMIT_VERSION = "kodac-h4-r3g-f-conjunction-commit-v1" as const
export const KDO_H4_R3G_F_EVIDENCE_CLASS = "e4-accepted-physical-proof" as const
export const KDO_H4_R3G_F_CAPABILITY = "runtime.prove.gvisor.physical" as const
export const KDO_H4_R3G_F_PROVIDER_ID = "kodac-gvisor-physical-v1" as const

export const KDO_H4_R3G_F_LIMITS = Object.freeze({
  maxBundleRecords: 12,
  maxBundleSerializedBytes: 512 * 1024,
  maxRecordSerializedBytes: 128 * 1024,
  resolveTimeoutMs: 5_000,
  coherenceTimeoutMs: 5_000,
  commitTimeoutMs: 5_000,
} as const)

export interface GvisorPhysicalEvidenceBundle {
  readonly resourceRecord: GvisorCgroupV2ResourceRecord
  readonly resourceCommit: GvisorCgroupV2ResourceCommit
  readonly sourceRecord: GvisorSourceLineageRecord
  readonly sourceCommit: GvisorSourceLineageCommit
  readonly networkRecord: GvisorPhysicalNetworkRecord
  readonly networkCommit: GvisorPhysicalNetworkCommit
  readonly ttlArmRecord: GvisorTtlArmRecord
  readonly ttlArmCommit: GvisorTtlEvidenceCommit
  readonly ttlTerminalRecord: GvisorTtlTerminalRecord
  readonly ttlTerminalCommit: GvisorTtlEvidenceCommit
  readonly outputRecord: GvisorOutputBoundRecord
  readonly outputCommit: GvisorOutputBoundCommit
}

export interface GvisorPhysicalEvidenceResolution {
  readonly version: typeof KDO_H4_R3G_F_RESOLUTION_VERSION
  readonly trustedProvenanceIdentity: string
  readonly bundle: GvisorPhysicalEvidenceBundle
  /** Trusted lookup result for bundle.sourceRecord.runtimeLineageIdentity. */
  readonly sourceRuntimeInstanceIdentity: string
  readonly evidenceBundleIdentity: string
}

export interface GvisorPhysicalSubjectCoherence {
  readonly version: typeof KDO_H4_R3G_F_COHERENCE_VERSION
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly resourceRuntimeLineageIdentity: string
  readonly sourceRuntimeLineageIdentity: string
  readonly networkBeforeRuntimeLineageIdentity: string
  readonly networkAfterRuntimeLineageIdentity: string
  readonly resourceRecordIdentity: string
  readonly sourceRecordIdentity: string
  readonly networkRecordIdentity: string
  readonly ttlArmRecordIdentity: string
  readonly ttlTerminalRecordIdentity: string
  readonly outputRecordIdentity: string
  readonly subjectCoherenceIdentity: string
}

export interface GvisorPhysicalProofMint {
  readonly capability: SandboxBackendCapabilityDeclaration
  readonly observation: SandboxBackendObservation
  readonly evidence: SandboxExecutionEvidence
  readonly conjunctionImplementationIdentity: string
  readonly conjunctionObserverIdentity: string
  readonly executionInstanceIdentity: string
}

export interface GvisorPhysicalConjunctionRecord {
  readonly version: typeof KDO_H4_R3G_F_RECORD_VERSION
  readonly evidenceClass: typeof KDO_H4_R3G_F_EVIDENCE_CLASS
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly trustedProvenanceIdentity: string
  readonly evidenceBundleIdentity: string
  readonly subjectCoherenceIdentity: string
  readonly r3gARecordIdentity: string
  readonly r3gACommitIdentity: string
  readonly r3gBRecordIdentity: string
  readonly r3gBCommitIdentity: string
  readonly r3gCRecordIdentity: string
  readonly r3gCCommitIdentity: string
  readonly r3gDArmRecordIdentity: string
  readonly r3gDArmCommitIdentity: string
  readonly r3gDTerminalRecordIdentity: string
  readonly r3gDTerminalCommitIdentity: string
  readonly r3gERecordIdentity: string
  readonly r3gECommitIdentity: string
  readonly capabilityIdentity: string
  readonly observationIdentity: string
  readonly executionEvidenceIdentity: string
  readonly conjunctionImplementationIdentity: string
  readonly conjunctionObserverIdentity: string
  readonly executionInstanceIdentity: string
  readonly recordIdentity: string
}

export interface GvisorPhysicalConjunctionCommit {
  readonly version: typeof KDO_H4_R3G_F_COMMIT_VERSION
  readonly executionAttemptIdentity: string
  readonly evidenceBundleIdentity: string
  readonly recordIdentity: string
  readonly commitIdentity: string
}

type PlainRecord = Record<string, unknown>
const SHA256 = /^[0-9a-f]{64}$/
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/

function hash(domain: string, value: unknown): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-F hash domain must be canonical uppercase ASCII")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-F\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function asPlainRecord(value: unknown, label: string): PlainRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}.${key} must be an enumerable defined data property`)
    }
  }
  return value as PlainRecord
}

function exactKeys(record: PlainRecord, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function containerId(value: unknown): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError("containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}

function boundedJsonBytes(value: unknown, maximum: number, label: string): void {
  let serialized: string
  try { serialized = JSON.stringify(value) }
  catch { throw new TypeError(`${label} must be JSON-serializable`) }
  if (Buffer.byteLength(serialized, "utf8") > maximum) throw new TypeError(`${label} exceeds serialized byte bound`)
}

function requireSame(label: string, values: readonly string[]): string {
  const first = values[0]
  if (first === undefined || values.some((value) => value !== first)) throw new TypeError(`R3G-F cross-record mismatch: ${label}`)
  return first
}

function bundleIdentity(bundle: GvisorPhysicalEvidenceBundle, sourceRuntimeInstanceIdentity: string): string {
  return hash("EVIDENCE_BUNDLE", [
    bundle.resourceRecord.resourceCandidateIdentity,
    bundle.resourceCommit.commitIdentity,
    bundle.sourceRecord.recordIdentity,
    bundle.sourceCommit.commitIdentity,
    bundle.networkRecord.recordIdentity,
    bundle.networkCommit.commitIdentity,
    bundle.ttlArmRecord.recordIdentity,
    bundle.ttlArmCommit.commitIdentity,
    bundle.ttlTerminalRecord.recordIdentity,
    bundle.ttlTerminalCommit.commitIdentity,
    bundle.outputRecord.recordIdentity,
    bundle.outputCommit.commitIdentity,
    sourceRuntimeInstanceIdentity,
  ])
}

export function resolveGvisorSourceRuntimeInstanceIdentity(input: {
  sourceRuntimeLineageIdentity: string
  resourceRuntimeLineageIdentity: string
  resourceRuntimeInstanceIdentity: string
  trustedResolvedSourceRuntimeInstanceIdentity?: string
}): string {
  const record = asPlainRecord(input, "R3G-F source runtime resolution input")
  const hasTrustedResolution = Object.prototype.hasOwnProperty.call(record, "trustedResolvedSourceRuntimeInstanceIdentity")
  exactKeys(
    record,
    hasTrustedResolution
      ? ["sourceRuntimeLineageIdentity", "resourceRuntimeLineageIdentity", "resourceRuntimeInstanceIdentity", "trustedResolvedSourceRuntimeInstanceIdentity"]
      : ["sourceRuntimeLineageIdentity", "resourceRuntimeLineageIdentity", "resourceRuntimeInstanceIdentity"],
    "R3G-F source runtime resolution input",
  )
  const sourceRuntimeLineageIdentity = identity(record.sourceRuntimeLineageIdentity, "sourceRuntimeLineageIdentity")
  const resourceRuntimeLineageIdentity = identity(record.resourceRuntimeLineageIdentity, "resourceRuntimeLineageIdentity")
  const resourceRuntimeInstanceIdentity = identity(record.resourceRuntimeInstanceIdentity, "resourceRuntimeInstanceIdentity")
  if (sourceRuntimeLineageIdentity === resourceRuntimeLineageIdentity) {
    if (!hasTrustedResolution) return resourceRuntimeInstanceIdentity
    const resolved = identity(record.trustedResolvedSourceRuntimeInstanceIdentity, "trustedResolvedSourceRuntimeInstanceIdentity")
    if (resolved !== resourceRuntimeInstanceIdentity) throw new TypeError("R3G-F trusted source runtime resolution does not match the exact runtime instance")
    return resolved
  }
  if (!hasTrustedResolution) throw new TypeError("R3G-F distinct source runtime lineage requires trusted runtime-instance resolution")
  const resolved = identity(record.trustedResolvedSourceRuntimeInstanceIdentity, "trustedResolvedSourceRuntimeInstanceIdentity")
  if (resolved !== resourceRuntimeInstanceIdentity) throw new TypeError("R3G-F source lineage resolves to a different runtime instance")
  return resolved
}

export function validateGvisorPhysicalEvidenceBundle(value: unknown, requirementValue: SandboxExecutionRequirement): GvisorPhysicalEvidenceBundle {
  const requirement = validateSandboxExecutionRequirement(requirementValue)
  const record = asPlainRecord(value, "R3G-F evidence bundle")
  const keys = [
    "resourceRecord", "resourceCommit", "sourceRecord", "sourceCommit", "networkRecord", "networkCommit",
    "ttlArmRecord", "ttlArmCommit", "ttlTerminalRecord", "ttlTerminalCommit", "outputRecord", "outputCommit",
  ] as const
  exactKeys(record, keys, "R3G-F evidence bundle")
  if (keys.length !== KDO_H4_R3G_F_LIMITS.maxBundleRecords) throw new Error("R3G-F internal bundle record-count invariant failed")

  // Never traverse or serialize untrusted nested predecessor values before their
  // canonical validators reject proxies/accessors/hooks. Size accounting is
  // performed only over the normalized, validator-produced immutable bundle.
  const resourceRecord = validateGvisorCgroupV2ResourceRecord(record.resourceRecord)
  const resourceCommit = validateGvisorCgroupV2ResourceCommit(record.resourceCommit, resourceRecord)
  const sourceRecord = validateGvisorSourceLineageRecord(record.sourceRecord)
  const sourceCommit = validateGvisorSourceLineageCommit(record.sourceCommit, sourceRecord)
  const networkRecord = validateGvisorPhysicalNetworkRecord(record.networkRecord)
  const networkCommit = validateGvisorPhysicalNetworkCommit(record.networkCommit, networkRecord)
  const ttlArmRecord = validateGvisorTtlArmRecord(record.ttlArmRecord)
  const ttlArmCommit = validateGvisorTtlEvidenceCommit(record.ttlArmCommit, {
    kind: "arm",
    armOperationIdentity: ttlArmRecord.armOperationIdentity,
    leaseIdentity: ttlArmRecord.leaseIdentity,
    recordIdentity: ttlArmRecord.recordIdentity,
    payloadDigest: ttlPayloadDigest(ttlArmRecord),
  })
  const ttlTerminalRecord = validateGvisorTtlTerminalRecord(record.ttlTerminalRecord, ttlArmRecord)
  const ttlTerminalCommit = validateGvisorTtlEvidenceCommit(record.ttlTerminalCommit, {
    kind: "terminal",
    armOperationIdentity: ttlArmRecord.armOperationIdentity,
    leaseIdentity: ttlArmRecord.leaseIdentity,
    recordIdentity: ttlTerminalRecord.recordIdentity,
    payloadDigest: ttlPayloadDigest(ttlTerminalRecord),
  })
  const outputRecord = validateGvisorOutputBoundRecord(record.outputRecord, requirement)
  const outputCommit = validateGvisorOutputBoundCommit(record.outputCommit, outputRecord)
  const validatedBundle = Object.freeze({
    resourceRecord, resourceCommit, sourceRecord, sourceCommit, networkRecord, networkCommit,
    ttlArmRecord, ttlArmCommit, ttlTerminalRecord, ttlTerminalCommit, outputRecord, outputCommit,
  })
  boundedJsonBytes(validatedBundle, KDO_H4_R3G_F_LIMITS.maxBundleSerializedBytes, "R3G-F evidence bundle")

  const requirementIdentity = requireSame("requirementIdentity", [
    requirement.requirementIdentity,
    resourceRecord.requirementIdentity,
    sourceRecord.requirementIdentity,
    networkRecord.requirementIdentity,
    ttlArmRecord.requirementIdentity,
    outputRecord.requirementIdentity,
  ])
  const workloadIdentity = requireSame("workloadIdentity", [
    requirement.workload.workloadIdentity,
    resourceRecord.workloadIdentity,
    sourceRecord.workloadIdentity,
    networkRecord.workloadIdentity,
    ttlArmRecord.workloadIdentity,
    outputRecord.workloadIdentity,
  ])
  const executionAttemptIdentity = requireSame("executionAttemptIdentity", [
    resourceRecord.executionAttemptIdentity,
    sourceRecord.executionAttemptIdentity,
    networkRecord.executionAttemptIdentity,
    ttlArmRecord.executionAttemptIdentity,
    outputRecord.executionAttemptIdentity,
  ])
  const containerBindingIdentity = requireSame("containerBindingIdentity", [
    resourceRecord.containerBindingIdentity,
    sourceRecord.containerBindingIdentity,
    networkRecord.containerBindingIdentity,
    ttlArmRecord.containerBindingIdentity,
    outputRecord.containerBindingIdentity,
  ])
  const exactContainerId = requireSame("containerId", [
    resourceRecord.containerId,
    sourceRecord.containerId,
    networkRecord.containerId,
    ttlArmRecord.containerId,
    outputRecord.containerId,
  ])
  const runtimeInstanceIdentity = requireSame("runtimeInstanceIdentity", [
    resourceRecord.runtimeInstanceIdentity,
    networkRecord.runtimeInstanceIdentity,
    ttlArmRecord.runtimeInstanceIdentity,
    ttlTerminalRecord.runtimeInstanceIdentity,
    outputRecord.runtimeInstanceIdentity,
  ])
  identity(requirementIdentity, "R3G-F requirementIdentity")
  identity(workloadIdentity, "R3G-F workloadIdentity")
  identity(executionAttemptIdentity, "R3G-F executionAttemptIdentity")
  identity(containerBindingIdentity, "R3G-F containerBindingIdentity")
  containerId(exactContainerId)
  identity(runtimeInstanceIdentity, "R3G-F runtimeInstanceIdentity")

  if (sourceRecord.sourceDigest !== requirement.workload.source.digest) throw new TypeError("R3G-F source digest does not match exact requirement")
  if (networkRecord.networkPolicy !== KDO_H4_R3G_C_NETWORK_POLICY || requirement.workload.networkPolicy.mode !== "deny-all") throw new TypeError("R3G-F network theorem does not match canonical deny-all requirement")
  if (resourceRecord.effectiveSwapBytes !== "0") throw new TypeError("R3G-F resource theorem requires exact no-swap posture")
  if (resourceRecord.effectiveMemoryBytes !== String(requirement.workload.resourcePolicy.memoryBytes)) throw new TypeError("R3G-F physical memory theorem does not match exact requirement")
  const cpuNumerator = BigInt(resourceRecord.effectiveCpuNumerator)
  const cpuDenominator = BigInt(resourceRecord.effectiveCpuDenominator)
  if (cpuNumerator * 1000n !== BigInt(requirement.workload.resourcePolicy.cpuMillis) * cpuDenominator) throw new TypeError("R3G-F physical CPU theorem does not match exact requirement")
  if (ttlArmRecord.ttlMs !== requirement.workload.resourcePolicy.ttlMs) throw new TypeError("R3G-F TTL theorem does not match exact requirement")
  if (ttlTerminalRecord.terminalOutcome === "indeterminate") throw new TypeError("R3G-F cannot mint E4 from indeterminate lifecycle evidence")
  if (outputRecord.maxOutputBytes !== requirement.workload.resourcePolicy.maxOutputBytes) throw new TypeError("R3G-F output theorem does not match exact requirement")
  if (outputRecord.terminalEvidenceIdentity !== ttlTerminalRecord.recordIdentity) throw new TypeError("R3G-F output evidence is bound to a different TTL terminal record")

  return validatedBundle
}

export function createGvisorPhysicalEvidenceResolution(input: {
  trustedProvenanceIdentity: string
  bundle: GvisorPhysicalEvidenceBundle
  requirement: SandboxExecutionRequirement
  /** Required when R3G-B was minted from a different R3E record identity. */
  trustedResolvedSourceRuntimeInstanceIdentity?: string
}): GvisorPhysicalEvidenceResolution {
  const record = asPlainRecord(input, "R3G-F evidence resolution input")
  const hasTrustedResolution = Object.prototype.hasOwnProperty.call(record, "trustedResolvedSourceRuntimeInstanceIdentity")
  exactKeys(
    record,
    hasTrustedResolution
      ? ["trustedProvenanceIdentity", "bundle", "requirement", "trustedResolvedSourceRuntimeInstanceIdentity"]
      : ["trustedProvenanceIdentity", "bundle", "requirement"],
    "R3G-F evidence resolution input",
  )
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  const bundle = validateGvisorPhysicalEvidenceBundle(record.bundle, requirement)
  const sourceRuntimeInstanceIdentity = resolveGvisorSourceRuntimeInstanceIdentity({
    sourceRuntimeLineageIdentity: bundle.sourceRecord.runtimeLineageIdentity,
    resourceRuntimeLineageIdentity: bundle.resourceRecord.r3eRecordIdentity,
    resourceRuntimeInstanceIdentity: bundle.resourceRecord.runtimeInstanceIdentity,
    ...(hasTrustedResolution
      ? { trustedResolvedSourceRuntimeInstanceIdentity: record.trustedResolvedSourceRuntimeInstanceIdentity as string }
      : {}),
  })
  const base = Object.freeze({
    version: KDO_H4_R3G_F_RESOLUTION_VERSION,
    trustedProvenanceIdentity: identity(record.trustedProvenanceIdentity, "trustedProvenanceIdentity"),
    bundle,
    sourceRuntimeInstanceIdentity,
  })
  return Object.freeze({ ...base, evidenceBundleIdentity: bundleIdentity(bundle, sourceRuntimeInstanceIdentity) })
}

export function validateGvisorPhysicalEvidenceResolution(value: unknown, requirementValue: SandboxExecutionRequirement): GvisorPhysicalEvidenceResolution {
  const requirement = validateSandboxExecutionRequirement(requirementValue)
  const record = asPlainRecord(value, "R3G-F evidence resolution")
  exactKeys(record, ["version", "trustedProvenanceIdentity", "bundle", "sourceRuntimeInstanceIdentity", "evidenceBundleIdentity"], "R3G-F evidence resolution")
  if (record.version !== KDO_H4_R3G_F_RESOLUTION_VERSION) throw new TypeError("R3G-F evidence resolution version mismatch")
  const rebuilt = createGvisorPhysicalEvidenceResolution({
    trustedProvenanceIdentity: record.trustedProvenanceIdentity as string,
    bundle: record.bundle as GvisorPhysicalEvidenceBundle,
    requirement,
    trustedResolvedSourceRuntimeInstanceIdentity: record.sourceRuntimeInstanceIdentity as string,
  })
  if (identity(record.sourceRuntimeInstanceIdentity, "sourceRuntimeInstanceIdentity") !== rebuilt.sourceRuntimeInstanceIdentity) throw new TypeError("R3G-F source runtime instance identity mismatch")
  if (identity(record.evidenceBundleIdentity, "evidenceBundleIdentity") !== rebuilt.evidenceBundleIdentity) throw new TypeError("R3G-F evidence bundle identity mismatch")
  return rebuilt
}

function coherencePreimage(value: Omit<GvisorPhysicalSubjectCoherence, "subjectCoherenceIdentity">): readonly string[] {
  return [
    value.version,
    value.executionAttemptIdentity,
    value.requirementIdentity,
    value.workloadIdentity,
    value.containerBindingIdentity,
    value.containerId,
    value.runtimeInstanceIdentity,
    value.resourceRuntimeLineageIdentity,
    value.sourceRuntimeLineageIdentity,
    value.networkBeforeRuntimeLineageIdentity,
    value.networkAfterRuntimeLineageIdentity,
    value.resourceRecordIdentity,
    value.sourceRecordIdentity,
    value.networkRecordIdentity,
    value.ttlArmRecordIdentity,
    value.ttlTerminalRecordIdentity,
    value.outputRecordIdentity,
  ]
}

export function createGvisorPhysicalSubjectCoherence(input: {
  executionAttemptIdentity: string
  requirementIdentity: string
  workloadIdentity: string
  containerBindingIdentity: string
  containerId: string
  runtimeInstanceIdentity: string
  resourceRuntimeLineageIdentity: string
  sourceRuntimeLineageIdentity: string
  networkBeforeRuntimeLineageIdentity: string
  networkAfterRuntimeLineageIdentity: string
  resourceRecordIdentity: string
  sourceRecordIdentity: string
  networkRecordIdentity: string
  ttlArmRecordIdentity: string
  ttlTerminalRecordIdentity: string
  outputRecordIdentity: string
}): GvisorPhysicalSubjectCoherence {
  const record = asPlainRecord(input, "R3G-F subject coherence input")
  exactKeys(record, [
    "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity",
    "resourceRuntimeLineageIdentity", "sourceRuntimeLineageIdentity", "networkBeforeRuntimeLineageIdentity", "networkAfterRuntimeLineageIdentity",
    "resourceRecordIdentity", "sourceRecordIdentity", "networkRecordIdentity", "ttlArmRecordIdentity", "ttlTerminalRecordIdentity", "outputRecordIdentity",
  ], "R3G-F subject coherence input")
  const base = Object.freeze({
    version: KDO_H4_R3G_F_COHERENCE_VERSION,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"),
    containerId: containerId(record.containerId),
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    resourceRuntimeLineageIdentity: identity(record.resourceRuntimeLineageIdentity, "resourceRuntimeLineageIdentity"),
    sourceRuntimeLineageIdentity: identity(record.sourceRuntimeLineageIdentity, "sourceRuntimeLineageIdentity"),
    networkBeforeRuntimeLineageIdentity: identity(record.networkBeforeRuntimeLineageIdentity, "networkBeforeRuntimeLineageIdentity"),
    networkAfterRuntimeLineageIdentity: identity(record.networkAfterRuntimeLineageIdentity, "networkAfterRuntimeLineageIdentity"),
    resourceRecordIdentity: identity(record.resourceRecordIdentity, "resourceRecordIdentity"),
    sourceRecordIdentity: identity(record.sourceRecordIdentity, "sourceRecordIdentity"),
    networkRecordIdentity: identity(record.networkRecordIdentity, "networkRecordIdentity"),
    ttlArmRecordIdentity: identity(record.ttlArmRecordIdentity, "ttlArmRecordIdentity"),
    ttlTerminalRecordIdentity: identity(record.ttlTerminalRecordIdentity, "ttlTerminalRecordIdentity"),
    outputRecordIdentity: identity(record.outputRecordIdentity, "outputRecordIdentity"),
  })
  return Object.freeze({ ...base, subjectCoherenceIdentity: hash("SUBJECT_COHERENCE", coherencePreimage(base)) })
}

export function validateGvisorPhysicalSubjectCoherence(
  value: unknown,
  requirementValue: SandboxExecutionRequirement,
  resolutionValue: GvisorPhysicalEvidenceResolution,
): GvisorPhysicalSubjectCoherence {
  const requirement = validateSandboxExecutionRequirement(requirementValue)
  const resolution = validateGvisorPhysicalEvidenceResolution(resolutionValue, requirement)
  const record = asPlainRecord(value, "R3G-F subject coherence")
  exactKeys(record, [
    "version", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity",
    "resourceRuntimeLineageIdentity", "sourceRuntimeLineageIdentity", "networkBeforeRuntimeLineageIdentity", "networkAfterRuntimeLineageIdentity",
    "resourceRecordIdentity", "sourceRecordIdentity", "networkRecordIdentity", "ttlArmRecordIdentity", "ttlTerminalRecordIdentity", "outputRecordIdentity",
    "subjectCoherenceIdentity",
  ], "R3G-F subject coherence")
  if (record.version !== KDO_H4_R3G_F_COHERENCE_VERSION) throw new TypeError("R3G-F subject coherence version mismatch")
  const rebuilt = createGvisorPhysicalSubjectCoherence({
    executionAttemptIdentity: record.executionAttemptIdentity as string,
    requirementIdentity: record.requirementIdentity as string,
    workloadIdentity: record.workloadIdentity as string,
    containerBindingIdentity: record.containerBindingIdentity as string,
    containerId: record.containerId as string,
    runtimeInstanceIdentity: record.runtimeInstanceIdentity as string,
    resourceRuntimeLineageIdentity: record.resourceRuntimeLineageIdentity as string,
    sourceRuntimeLineageIdentity: record.sourceRuntimeLineageIdentity as string,
    networkBeforeRuntimeLineageIdentity: record.networkBeforeRuntimeLineageIdentity as string,
    networkAfterRuntimeLineageIdentity: record.networkAfterRuntimeLineageIdentity as string,
    resourceRecordIdentity: record.resourceRecordIdentity as string,
    sourceRecordIdentity: record.sourceRecordIdentity as string,
    networkRecordIdentity: record.networkRecordIdentity as string,
    ttlArmRecordIdentity: record.ttlArmRecordIdentity as string,
    ttlTerminalRecordIdentity: record.ttlTerminalRecordIdentity as string,
    outputRecordIdentity: record.outputRecordIdentity as string,
  })
  if (identity(record.subjectCoherenceIdentity, "subjectCoherenceIdentity") !== rebuilt.subjectCoherenceIdentity) throw new TypeError("R3G-F subject coherence identity mismatch")
  if (resolution.sourceRuntimeInstanceIdentity !== rebuilt.runtimeInstanceIdentity) throw new TypeError("R3G-F source runtime lineage is not bound to the exact runtime instance")

  const bundle = resolution.bundle
  const expected = {
    executionAttemptIdentity: bundle.resourceRecord.executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity: bundle.resourceRecord.containerBindingIdentity,
    containerId: bundle.resourceRecord.containerId,
    runtimeInstanceIdentity: bundle.resourceRecord.runtimeInstanceIdentity,
    resourceRuntimeLineageIdentity: bundle.resourceRecord.r3eRecordIdentity,
    sourceRuntimeLineageIdentity: bundle.sourceRecord.runtimeLineageIdentity,
    networkBeforeRuntimeLineageIdentity: bundle.networkRecord.r3eBeforeRecordIdentity,
    networkAfterRuntimeLineageIdentity: bundle.networkRecord.r3eAfterRecordIdentity,
    resourceRecordIdentity: bundle.resourceRecord.resourceCandidateIdentity,
    sourceRecordIdentity: bundle.sourceRecord.recordIdentity,
    networkRecordIdentity: bundle.networkRecord.recordIdentity,
    ttlArmRecordIdentity: bundle.ttlArmRecord.recordIdentity,
    ttlTerminalRecordIdentity: bundle.ttlTerminalRecord.recordIdentity,
    outputRecordIdentity: bundle.outputRecord.recordIdentity,
  } as const
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (rebuilt[key as keyof typeof expected] !== expectedValue) throw new TypeError(`R3G-F final subject coherence mismatch: ${key}`)
  }
  return rebuilt
}

function theoremVersions(): readonly string[] {
  return [
    KDO_H4_R3B_BACKEND_CAPABILITY_VERSION,
    KDO_H4_R3B_BACKEND_OBSERVATION_VERSION,
    KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION,
    KDO_H4_R3G_A_RECORD_VERSION,
    KDO_H4_R3G_A_COMMIT_VERSION,
    KDO_H4_R3G_B_VERSION,
    KDO_H4_R3G_B_COMMIT_VERSION,
    KDO_H4_R3G_C_VERSION,
    KDO_H4_R3G_C_COMMIT_VERSION,
    KDO_H4_R3G_D_ARM_RECORD_VERSION,
    KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
    KDO_H4_R3G_D_COMMIT_VERSION,
    KDO_H4_R3G_E_OUTPUT_VERSION,
    KDO_H4_R3G_E_COMMIT_VERSION,
    KDO_H4_R3G_F_VERSION,
    KDO_H4_R3G_F_RESOLUTION_VERSION,
    KDO_H4_R3G_F_COHERENCE_VERSION,
    KDO_H4_R3G_F_RECORD_VERSION,
    KDO_H4_R3G_F_COMMIT_VERSION,
  ]
}

export function createGvisorPhysicalConjunctionImplementationIdentity(): string {
  return hash("IMPLEMENTATION", [KDO_H4_R3G_F_PROVIDER_ID, ...theoremVersions()])
}

export function createGvisorPhysicalConjunctionObserverIdentity(): string {
  return hash("OBSERVER", [createGvisorPhysicalConjunctionImplementationIdentity(), ...theoremVersions()])
}

export function createGvisorPhysicalExecutionInstanceIdentity(coherenceValue: GvisorPhysicalSubjectCoherence): string {
  const record = asPlainRecord(coherenceValue, "R3G-F subject coherence for execution instance")
  exactKeys(record, [
    "version", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity",
    "resourceRuntimeLineageIdentity", "sourceRuntimeLineageIdentity", "networkBeforeRuntimeLineageIdentity", "networkAfterRuntimeLineageIdentity",
    "resourceRecordIdentity", "sourceRecordIdentity", "networkRecordIdentity", "ttlArmRecordIdentity", "ttlTerminalRecordIdentity", "outputRecordIdentity",
    "subjectCoherenceIdentity",
  ], "R3G-F subject coherence for execution instance")
  if (record.version !== KDO_H4_R3G_F_COHERENCE_VERSION) throw new TypeError("R3G-F subject coherence version mismatch")
  const coherence = createGvisorPhysicalSubjectCoherence({
    executionAttemptIdentity: record.executionAttemptIdentity as string,
    requirementIdentity: record.requirementIdentity as string,
    workloadIdentity: record.workloadIdentity as string,
    containerBindingIdentity: record.containerBindingIdentity as string,
    containerId: record.containerId as string,
    runtimeInstanceIdentity: record.runtimeInstanceIdentity as string,
    resourceRuntimeLineageIdentity: record.resourceRuntimeLineageIdentity as string,
    sourceRuntimeLineageIdentity: record.sourceRuntimeLineageIdentity as string,
    networkBeforeRuntimeLineageIdentity: record.networkBeforeRuntimeLineageIdentity as string,
    networkAfterRuntimeLineageIdentity: record.networkAfterRuntimeLineageIdentity as string,
    resourceRecordIdentity: record.resourceRecordIdentity as string,
    sourceRecordIdentity: record.sourceRecordIdentity as string,
    networkRecordIdentity: record.networkRecordIdentity as string,
    ttlArmRecordIdentity: record.ttlArmRecordIdentity as string,
    ttlTerminalRecordIdentity: record.ttlTerminalRecordIdentity as string,
    outputRecordIdentity: record.outputRecordIdentity as string,
  })
  if (identity(record.subjectCoherenceIdentity, "subjectCoherenceIdentity") !== coherence.subjectCoherenceIdentity) throw new TypeError("R3G-F subject coherence identity mismatch")
  return hash("EXECUTION_INSTANCE", [
    coherence.executionAttemptIdentity,
    coherence.containerBindingIdentity,
    coherence.containerId,
    coherence.runtimeInstanceIdentity,
    coherence.resourceRuntimeLineageIdentity,
    coherence.sourceRuntimeLineageIdentity,
    coherence.networkBeforeRuntimeLineageIdentity,
    coherence.networkAfterRuntimeLineageIdentity,
    coherence.subjectCoherenceIdentity,
  ])
}

export function mintGvisorPhysicalProof(
  requirementValue: SandboxExecutionRequirement,
  resolutionValue: GvisorPhysicalEvidenceResolution,
  coherenceValue: GvisorPhysicalSubjectCoherence,
): GvisorPhysicalProofMint {
  const requirement = validateSandboxExecutionRequirement(requirementValue)
  if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new TypeError("R3G-F v1 requires requiredSemanticRuntimeClass=gvisor")
  if (requirement.workload.credentialBindingIdentity !== null) throw new TypeError("R3G-F v1 requires null credential binding")
  const resolution = validateGvisorPhysicalEvidenceResolution(resolutionValue, requirement)
  const coherence = validateGvisorPhysicalSubjectCoherence(coherenceValue, requirement, resolution)
  const conjunctionImplementationIdentity = createGvisorPhysicalConjunctionImplementationIdentity()
  const conjunctionObserverIdentity = createGvisorPhysicalConjunctionObserverIdentity()
  const executionInstanceIdentity = createGvisorPhysicalExecutionInstanceIdentity(coherence)
  const capability = validateSandboxBackendCapabilityDeclaration(createSandboxBackendCapabilityDeclaration({
    providerId: KDO_H4_R3G_F_PROVIDER_ID,
    implementationIdentity: conjunctionImplementationIdentity,
    semanticRuntimeClasses: Object.freeze(["gvisor"]),
    supportsImmutableImageDigestObservation: true,
    supportsDenyAllNetworkObservation: true,
    supportsCpuBudgetObservation: true,
    supportsMemoryLimitObservation: true,
    supportsTtlObservation: true,
    supportsOutputLimitObservation: true,
  }))
  const observation = validateSandboxBackendObservation(createSandboxBackendObservation({
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    capabilityIdentity: capability.capabilityIdentity,
    observerIdentity: conjunctionObserverIdentity,
    executionInstanceIdentity,
    observedSourceDigest: resolution.bundle.sourceRecord.sourceDigest,
    observedSemanticRuntimeClass: "gvisor",
    observedNetworkPolicy: requirement.workload.networkPolicy,
    observedResourcePolicy: requirement.workload.resourcePolicy,
    observedCredentialBindingIdentity: null,
    downgradeOccurred: false,
  }))
  const evidence = validateSandboxExecutionEvidence(createSandboxExecutionEvidence({ requirement, capability, observation }))
  return Object.freeze({ capability, observation, evidence, conjunctionImplementationIdentity, conjunctionObserverIdentity, executionInstanceIdentity })
}

function conjunctionRecordPreimage(value: Omit<GvisorPhysicalConjunctionRecord, "recordIdentity">): readonly unknown[] {
  return [
    value.version, value.evidenceClass, value.executionAttemptIdentity, value.requirementIdentity, value.workloadIdentity,
    value.containerBindingIdentity, value.containerId, value.runtimeInstanceIdentity, value.trustedProvenanceIdentity,
    value.evidenceBundleIdentity, value.subjectCoherenceIdentity, value.r3gARecordIdentity, value.r3gACommitIdentity,
    value.r3gBRecordIdentity, value.r3gBCommitIdentity, value.r3gCRecordIdentity, value.r3gCCommitIdentity,
    value.r3gDArmRecordIdentity, value.r3gDArmCommitIdentity, value.r3gDTerminalRecordIdentity, value.r3gDTerminalCommitIdentity,
    value.r3gERecordIdentity, value.r3gECommitIdentity, value.capabilityIdentity, value.observationIdentity,
    value.executionEvidenceIdentity, value.conjunctionImplementationIdentity, value.conjunctionObserverIdentity,
    value.executionInstanceIdentity,
  ]
}

export function createGvisorPhysicalConjunctionRecord(input: {
  requirement: SandboxExecutionRequirement
  resolution: GvisorPhysicalEvidenceResolution
  coherence: GvisorPhysicalSubjectCoherence
  mint: GvisorPhysicalProofMint
}): GvisorPhysicalConjunctionRecord {
  const record = asPlainRecord(input, "R3G-F conjunction record input")
  exactKeys(record, ["requirement", "resolution", "coherence", "mint"], "R3G-F conjunction record input")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  const resolution = validateGvisorPhysicalEvidenceResolution(record.resolution, requirement)
  const coherence = validateGvisorPhysicalSubjectCoherence(record.coherence, requirement, resolution)
  const mint = record.mint as GvisorPhysicalProofMint
  const canonicalMint = mintGvisorPhysicalProof(requirement, resolution, coherence)
  if (
    mint.capability?.capabilityIdentity !== canonicalMint.capability.capabilityIdentity ||
    mint.observation?.observationIdentity !== canonicalMint.observation.observationIdentity ||
    mint.evidence?.evidenceIdentity !== canonicalMint.evidence.evidenceIdentity ||
    mint.conjunctionImplementationIdentity !== canonicalMint.conjunctionImplementationIdentity ||
    mint.conjunctionObserverIdentity !== canonicalMint.conjunctionObserverIdentity ||
    mint.executionInstanceIdentity !== canonicalMint.executionInstanceIdentity
  ) throw new TypeError("R3G-F mint does not match canonical conjunction result")
  const bundle = resolution.bundle
  const base = Object.freeze({
    version: KDO_H4_R3G_F_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_F_EVIDENCE_CLASS,
    executionAttemptIdentity: coherence.executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity: coherence.containerBindingIdentity,
    containerId: coherence.containerId,
    runtimeInstanceIdentity: coherence.runtimeInstanceIdentity,
    trustedProvenanceIdentity: resolution.trustedProvenanceIdentity,
    evidenceBundleIdentity: resolution.evidenceBundleIdentity,
    subjectCoherenceIdentity: coherence.subjectCoherenceIdentity,
    r3gARecordIdentity: bundle.resourceRecord.resourceCandidateIdentity,
    r3gACommitIdentity: bundle.resourceCommit.commitIdentity,
    r3gBRecordIdentity: bundle.sourceRecord.recordIdentity,
    r3gBCommitIdentity: bundle.sourceCommit.commitIdentity,
    r3gCRecordIdentity: bundle.networkRecord.recordIdentity,
    r3gCCommitIdentity: bundle.networkCommit.commitIdentity,
    r3gDArmRecordIdentity: bundle.ttlArmRecord.recordIdentity,
    r3gDArmCommitIdentity: bundle.ttlArmCommit.commitIdentity,
    r3gDTerminalRecordIdentity: bundle.ttlTerminalRecord.recordIdentity,
    r3gDTerminalCommitIdentity: bundle.ttlTerminalCommit.commitIdentity,
    r3gERecordIdentity: bundle.outputRecord.recordIdentity,
    r3gECommitIdentity: bundle.outputCommit.commitIdentity,
    capabilityIdentity: canonicalMint.capability.capabilityIdentity,
    observationIdentity: canonicalMint.observation.observationIdentity,
    executionEvidenceIdentity: canonicalMint.evidence.evidenceIdentity,
    conjunctionImplementationIdentity: canonicalMint.conjunctionImplementationIdentity,
    conjunctionObserverIdentity: canonicalMint.conjunctionObserverIdentity,
    executionInstanceIdentity: canonicalMint.executionInstanceIdentity,
  })
  const result = Object.freeze({ ...base, recordIdentity: hash("CONJUNCTION_RECORD", conjunctionRecordPreimage(base)) })
  boundedJsonBytes(result, KDO_H4_R3G_F_LIMITS.maxRecordSerializedBytes, "R3G-F conjunction record")
  return result
}

export function validateGvisorPhysicalConjunctionRecord(value: unknown): GvisorPhysicalConjunctionRecord {
  const record = asPlainRecord(value, "R3G-F conjunction record")
  exactKeys(record, [
    "version", "evidenceClass", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity",
    "trustedProvenanceIdentity", "evidenceBundleIdentity", "subjectCoherenceIdentity", "r3gARecordIdentity", "r3gACommitIdentity", "r3gBRecordIdentity", "r3gBCommitIdentity",
    "r3gCRecordIdentity", "r3gCCommitIdentity", "r3gDArmRecordIdentity", "r3gDArmCommitIdentity", "r3gDTerminalRecordIdentity", "r3gDTerminalCommitIdentity",
    "r3gERecordIdentity", "r3gECommitIdentity", "capabilityIdentity", "observationIdentity", "executionEvidenceIdentity", "conjunctionImplementationIdentity",
    "conjunctionObserverIdentity", "executionInstanceIdentity", "recordIdentity",
  ], "R3G-F conjunction record")
  if (record.version !== KDO_H4_R3G_F_RECORD_VERSION || record.evidenceClass !== KDO_H4_R3G_F_EVIDENCE_CLASS) throw new TypeError("R3G-F conjunction record version/evidence class mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_F_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_F_EVIDENCE_CLASS,
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"),
    containerId: containerId(record.containerId),
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    trustedProvenanceIdentity: identity(record.trustedProvenanceIdentity, "trustedProvenanceIdentity"),
    evidenceBundleIdentity: identity(record.evidenceBundleIdentity, "evidenceBundleIdentity"),
    subjectCoherenceIdentity: identity(record.subjectCoherenceIdentity, "subjectCoherenceIdentity"),
    r3gARecordIdentity: identity(record.r3gARecordIdentity, "r3gARecordIdentity"),
    r3gACommitIdentity: identity(record.r3gACommitIdentity, "r3gACommitIdentity"),
    r3gBRecordIdentity: identity(record.r3gBRecordIdentity, "r3gBRecordIdentity"),
    r3gBCommitIdentity: identity(record.r3gBCommitIdentity, "r3gBCommitIdentity"),
    r3gCRecordIdentity: identity(record.r3gCRecordIdentity, "r3gCRecordIdentity"),
    r3gCCommitIdentity: identity(record.r3gCCommitIdentity, "r3gCCommitIdentity"),
    r3gDArmRecordIdentity: identity(record.r3gDArmRecordIdentity, "r3gDArmRecordIdentity"),
    r3gDArmCommitIdentity: identity(record.r3gDArmCommitIdentity, "r3gDArmCommitIdentity"),
    r3gDTerminalRecordIdentity: identity(record.r3gDTerminalRecordIdentity, "r3gDTerminalRecordIdentity"),
    r3gDTerminalCommitIdentity: identity(record.r3gDTerminalCommitIdentity, "r3gDTerminalCommitIdentity"),
    r3gERecordIdentity: identity(record.r3gERecordIdentity, "r3gERecordIdentity"),
    r3gECommitIdentity: identity(record.r3gECommitIdentity, "r3gECommitIdentity"),
    capabilityIdentity: identity(record.capabilityIdentity, "capabilityIdentity"),
    observationIdentity: identity(record.observationIdentity, "observationIdentity"),
    executionEvidenceIdentity: identity(record.executionEvidenceIdentity, "executionEvidenceIdentity"),
    conjunctionImplementationIdentity: identity(record.conjunctionImplementationIdentity, "conjunctionImplementationIdentity"),
    conjunctionObserverIdentity: identity(record.conjunctionObserverIdentity, "conjunctionObserverIdentity"),
    executionInstanceIdentity: identity(record.executionInstanceIdentity, "executionInstanceIdentity"),
  })
  const expected = hash("CONJUNCTION_RECORD", conjunctionRecordPreimage(base))
  if (identity(record.recordIdentity, "recordIdentity") !== expected) throw new TypeError("R3G-F conjunction record identity mismatch")
  const result = Object.freeze({ ...base, recordIdentity: expected })
  boundedJsonBytes(result, KDO_H4_R3G_F_LIMITS.maxRecordSerializedBytes, "R3G-F conjunction record")
  return result
}

export function createGvisorPhysicalConjunctionCommit(recordValue: GvisorPhysicalConjunctionRecord): GvisorPhysicalConjunctionCommit {
  const record = validateGvisorPhysicalConjunctionRecord(recordValue)
  const base = Object.freeze({
    version: KDO_H4_R3G_F_COMMIT_VERSION,
    executionAttemptIdentity: record.executionAttemptIdentity,
    evidenceBundleIdentity: record.evidenceBundleIdentity,
    recordIdentity: record.recordIdentity,
  })
  return Object.freeze({ ...base, commitIdentity: hash("CONJUNCTION_COMMIT", base) })
}

export function validateGvisorPhysicalConjunctionCommit(value: unknown, expectedRecord: GvisorPhysicalConjunctionRecord): GvisorPhysicalConjunctionCommit {
  const record = asPlainRecord(value, "R3G-F conjunction commit")
  exactKeys(record, ["version", "executionAttemptIdentity", "evidenceBundleIdentity", "recordIdentity", "commitIdentity"], "R3G-F conjunction commit")
  if (record.version !== KDO_H4_R3G_F_COMMIT_VERSION) throw new TypeError("R3G-F conjunction commit version mismatch")
  const expected = createGvisorPhysicalConjunctionCommit(expectedRecord)
  if (
    identity(record.executionAttemptIdentity, "executionAttemptIdentity") !== expected.executionAttemptIdentity ||
    identity(record.evidenceBundleIdentity, "evidenceBundleIdentity") !== expected.evidenceBundleIdentity ||
    identity(record.recordIdentity, "recordIdentity") !== expected.recordIdentity ||
    identity(record.commitIdentity, "commitIdentity") !== expected.commitIdentity
  ) throw new TypeError("R3G-F conjunction commit does not match exact final record")
  return expected
}