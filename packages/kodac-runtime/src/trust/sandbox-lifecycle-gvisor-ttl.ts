import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

import {
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"
import {
  createGvisorRuntimeInstanceIdentity,
  validateGvisorContainerBinding,
  validateGvisorObserverArtifact,
  validateGvisorRuntimeLineageRecord,
  type GvisorContainerBinding,
  type GvisorObserverArtifact,
  type GvisorRuntimeLineageRecord,
} from "./sandbox-observer-gvisor-runtime.ts"
import {
  validateGvisorProcessObservation,
  validateGvisorStateObservation,
  type GvisorProcessObservation,
  type GvisorStateObservation,
} from "./sandbox-observer-gvisor.ts"
import {
  validateGvisorNetworkControlEndpointIdentity,
  type GvisorNetworkControlEndpointIdentity,
} from "./sandbox-observer-gvisor-network.ts"

export const KDO_H4_R3G_D_CAPABILITY = "runtime.enforce.gvisor.ttl" as const
export const KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION = "kodac-h4-r3g-d-runtime-config-v1" as const
export const KDO_H4_R3G_D_SUBJECT_VERSION = "kodac-h4-r3g-d-subject-binding-v1" as const
export const KDO_H4_R3G_D_PREPARED_VERSION = "kodac-h4-r3g-d-arm-intent-v1" as const
export const KDO_H4_R3G_D_WATCHDOG_LEASE_VERSION = "kodac-h4-r3g-d-watchdog-lease-v1" as const
export const KDO_H4_R3G_D_ARM_ACK_VERSION = "kodac-h4-r3g-d-arm-ack-v1" as const
export const KDO_H4_R3G_D_ARM_RECORD_VERSION = "kodac-h4-r3g-d-arm-record-v1" as const
export const KDO_H4_R3G_D_TERMINAL_RECORD_VERSION = "kodac-h4-r3g-d-terminal-record-v1" as const
export const KDO_H4_R3G_D_COMMIT_VERSION = "kodac-h4-r3g-d-evidence-commit-v1" as const
export const KDO_H4_R3G_D_ARM_EVIDENCE_CLASS = "e3-ttl-lifecycle-arm" as const
export const KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS = "e3-ttl-lifecycle-terminal" as const
export const KDO_H4_R3G_D_GVISOR_SOURCE_COMMIT = "50e1502a95d36ad2faf2c7ef33b8bf21fe975293" as const
export const KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION = "kodac-h4-r3g-d-watchdog-protocol-v1" as const
export const KDO_H4_R3G_D_CLOCK_NAME = "CLOCK_BOOTTIME" as const

export const KDO_H4_R3G_D_LIMITS = Object.freeze({
  maxPathBytes: 4096,
  maxWatchdogBytes: 16 * 1024 * 1024,
  maxAckBytes: 32 * 1024,
  maxTerminalBytes: 64 * 1024,
  maxStderrBytes: 4096,
  armAckTimeoutMs: 5000,
  evidenceCommitTimeoutMs: 3000,
  ownerLockTimeoutMs: 3000,
  maxTtlMs: 24 * 60 * 60 * 1000,
} as const)

export type GvisorTtlTerminalOutcome = "natural-exit" | "ttl-expired" | "indeterminate"

export interface GvisorTtlSubjectBinding {
  readonly version: typeof KDO_H4_R3G_D_SUBJECT_VERSION
  readonly binding: GvisorContainerBinding
  readonly lineage: GvisorRuntimeLineageRecord
  readonly state: GvisorStateObservation
  readonly process: GvisorProcessObservation
  readonly runscArtifact: GvisorObserverArtifact
  readonly controlEndpoint: GvisorNetworkControlEndpointIdentity
  readonly expectedPeerUid: string
  readonly expectedPeerGid: string
  readonly subjectBindingIdentity: string
}

export interface GvisorTtlPreparedIntent {
  readonly version: typeof KDO_H4_R3G_D_PREPARED_VERSION
  readonly state: "PREPARED"
  readonly armOperationIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly ttlMs: number
  readonly watchdogImplementationIdentity: string
  readonly canonicalArmPayloadDigest: string
  readonly intentIdentity: string
}

export interface GvisorTtlWatchdogLeaseRecord {
  readonly version: typeof KDO_H4_R3G_D_WATCHDOG_LEASE_VERSION
  readonly armOperationIdentity: string
  readonly canonicalArmPayloadDigest: string
  readonly leaseIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly ttlMs: number
  readonly linuxBootId: string
  readonly clockDomainIdentity: string
  readonly leaseStartBoottimeNs: string
  readonly deadlineBoottimeNs: string
  readonly watchdogImplementationIdentity: string
  readonly physicalArmState: "ARMED"
  readonly registryRecordIdentity: string
}

export interface GvisorTtlArmAcknowledgement {
  readonly version: typeof KDO_H4_R3G_D_ARM_ACK_VERSION
  readonly leaseIdentity: string
  readonly armOperationIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly controlPeerBindingIdentity: string
  readonly runscArtifactIdentity: string
  readonly verifiedRunscSha256: string
  readonly watchdogRegistryRecordIdentity: string
  readonly clockDomainIdentity: string
  readonly linuxBootId: string
  readonly leaseStartBoottimeNs: string
  readonly deadlineBoottimeNs: string
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly armAcknowledgementIdentity: string
}

export interface GvisorTtlArmRecord {
  readonly version: typeof KDO_H4_R3G_D_ARM_RECORD_VERSION
  readonly evidenceClass: typeof KDO_H4_R3G_D_ARM_EVIDENCE_CLASS
  readonly armOperationIdentity: string
  readonly canonicalArmPayloadDigest: string
  readonly leaseIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly ttlMs: number
  readonly watchdogImplementationIdentity: string
  readonly controlPeerBindingIdentity: string
  readonly runscArtifactIdentity: string
  readonly verifiedRunscSha256: string
  readonly watchdogRegistryRecordIdentity: string
  readonly clockDomainIdentity: string
  readonly linuxBootId: string
  readonly leaseStartBoottimeNs: string
  readonly deadlineBoottimeNs: string
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly armAcknowledgementIdentity: string
  readonly recordIdentity: string
}

export interface GvisorTtlTerminalRecord {
  readonly version: typeof KDO_H4_R3G_D_TERMINAL_RECORD_VERSION
  readonly evidenceClass: typeof KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS
  readonly armOperationIdentity: string
  readonly leaseIdentity: string
  readonly armRecordIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly terminalOutcome: GvisorTtlTerminalOutcome
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly controlPeerBindingIdentity: string
  readonly socketDevice: string
  readonly socketInode: string
  readonly peerPid: number
  readonly peerUid: string
  readonly peerGid: string
  readonly retainedPidfdProcessIdentity: string
  readonly runscArtifactIdentity: string
  readonly verifiedRunscSha256: string
  readonly retainedRunscExecutableIdentity: string
  readonly clockDomainIdentity: string
  readonly linuxBootId: string
  readonly exitEventObservedBoottimeNs: string | null
  readonly liveAtExpiryProbeIdentity: string | null
  readonly liveAtExpiryObservedBoottimeNs: string | null
  readonly liveAtExpiryProcessSetIdentity: string | null
  readonly signalAcknowledgementIdentity: string | null
  readonly terminationAcknowledgementIdentity: string
  readonly registryTerminalRecordIdentity: string
  readonly recordIdentity: string
}

export interface GvisorTtlEvidenceCommit {
  readonly version: typeof KDO_H4_R3G_D_COMMIT_VERSION
  readonly kind: "prepared" | "arm" | "terminal"
  readonly armOperationIdentity: string
  readonly leaseIdentity: string | null
  readonly recordIdentity: string
  readonly payloadDigest: string
  readonly commitIdentity: string
}

export interface GvisorTtlRuntimeConfig {
  readonly version: typeof KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION
  readonly watchdogPath: string
  readonly expectedWatchdogSha256: string
  readonly registryRoot: string
  readonly resolveSubject: (requirement: SandboxExecutionRequirement, options: { readonly signal?: AbortSignal }) => Promise<unknown> | unknown
  readonly commitPreparedIntent: (intent: GvisorTtlPreparedIntent) => Promise<unknown> | unknown
  readonly commitArmEvidence: (record: GvisorTtlArmRecord) => Promise<unknown> | unknown
  readonly commitTerminalEvidence: (record: GvisorTtlTerminalRecord) => Promise<unknown> | unknown
}

const SHA256 = /^[0-9a-f]{64}$/
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/
const UINT = /^(?:0|[1-9][0-9]*)$/
const BOOT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const MAX_UINT64 = 18_446_744_073_709_551_615n

function hash(domain: string, value: unknown): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-D hash domain must be canonical uppercase ASCII")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}
function byteLength(value: string): number { return Buffer.byteLength(value, "utf8") }
function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be an enumerable defined data property`)
  }
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort(); const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}
function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function fullContainerId(value: unknown): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError("containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}
function canonicalUint(value: unknown, label: string, allowZero = true): string {
  if (typeof value !== "string" || !UINT.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  const parsed = BigInt(value)
  if ((!allowZero && parsed === 0n) || parsed > MAX_UINT64) throw new TypeError(`${label} is outside uint64 range`)
  return value
}
function canonicalPid(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > 2_147_483_647) throw new TypeError("peerPid must be a positive Linux pid")
  return value
}
function canonicalPath(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || byteLength(value) > KDO_H4_R3G_D_LIMITS.maxPathBytes) throw new TypeError(`${label} must be a bounded non-empty POSIX path`)
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) throw new TypeError(`${label} must be a canonical absolute POSIX path`)
  return value
}
function positiveTtl(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > KDO_H4_R3G_D_LIMITS.maxTtlMs) throw new TypeError(`ttlMs must be an integer in 1..${KDO_H4_R3G_D_LIMITS.maxTtlMs}`)
  return value
}
function bootId(value: unknown): string {
  if (typeof value !== "string" || !BOOT_ID.test(value)) throw new TypeError("linuxBootId must be a canonical lowercase Linux boot id")
  return value
}
function nullableIdentity(value: unknown, label: string): string | null { return value === null ? null : identity(value, label) }
function nullableUint(value: unknown, label: string): string | null { return value === null ? null : canonicalUint(value, label) }

export function createGvisorTtlSubjectBinding(input: {
  binding: GvisorContainerBinding
  lineage: GvisorRuntimeLineageRecord
  state: GvisorStateObservation
  process: GvisorProcessObservation
  runscArtifact: GvisorObserverArtifact
  controlEndpoint: GvisorNetworkControlEndpointIdentity
  expectedPeerUid: string
  expectedPeerGid: string
}): GvisorTtlSubjectBinding {
  const record = asPlainRecord(input, "R3G-D subject input")
  exactKeys(record, ["binding", "lineage", "state", "process", "runscArtifact", "controlEndpoint", "expectedPeerUid", "expectedPeerGid"], "R3G-D subject input")
  const binding = validateGvisorContainerBinding(record.binding)
  const lineage = validateGvisorRuntimeLineageRecord(record.lineage)
  const state = validateGvisorStateObservation(record.state)
  const process = validateGvisorProcessObservation(record.process)
  const runscArtifact = validateGvisorObserverArtifact(record.runscArtifact)
  const controlEndpoint = validateGvisorNetworkControlEndpointIdentity(record.controlEndpoint)
  if (runscArtifact.role !== "runsc") throw new TypeError("R3G-D subject runscArtifact must have runsc role")
  if (binding.bindingIdentity !== lineage.containerBindingIdentity || binding.containerId !== lineage.containerId || state.containerId !== binding.containerId || state.pid !== process.pid) throw new TypeError("R3G-D subject canonical container/process lineage mismatch")
  if (lineage.executionAttemptIdentity !== binding.executionAttemptIdentity || lineage.requirementIdentity !== binding.requirementIdentity || lineage.workloadIdentity !== binding.workloadIdentity) throw new TypeError("R3G-D subject execution lineage mismatch")
  if (lineage.stateIdentity !== state.stateIdentity || lineage.processIdentity !== process.processIdentity || lineage.runscArtifactIdentity !== runscArtifact.artifactIdentity) throw new TypeError("R3G-D subject observation identity mismatch")
  const rebuiltRuntime = createGvisorRuntimeInstanceIdentity({ containerId: binding.containerId, state, process, runscArtifactIdentity: runscArtifact.artifactIdentity, planIdentity: lineage.planIdentity })
  if (rebuiltRuntime !== lineage.runtimeInstanceIdentity) throw new TypeError("R3G-D subject runtimeInstanceIdentity mismatch")
  const expectedPeerUid = canonicalUint(record.expectedPeerUid, "expectedPeerUid")
  const expectedPeerGid = canonicalUint(record.expectedPeerGid, "expectedPeerGid")
  const base = Object.freeze({ version: KDO_H4_R3G_D_SUBJECT_VERSION, binding, lineage, state, process, runscArtifact, controlEndpoint, expectedPeerUid, expectedPeerGid })
  return Object.freeze({ ...base, subjectBindingIdentity: hash("SUBJECT_BINDING", [binding.bindingIdentity, lineage.recordIdentity, state.stateIdentity, process.processIdentity, runscArtifact.artifactIdentity, controlEndpoint.endpointIdentity, expectedPeerUid, expectedPeerGid]) })
}

export function validateGvisorTtlSubjectBinding(value: unknown, requirementValue?: SandboxExecutionRequirement): GvisorTtlSubjectBinding {
  const record = asPlainRecord(value, "R3G-D subject binding")
  exactKeys(record, ["version", "binding", "lineage", "state", "process", "runscArtifact", "controlEndpoint", "expectedPeerUid", "expectedPeerGid", "subjectBindingIdentity"], "R3G-D subject binding")
  if (record.version !== KDO_H4_R3G_D_SUBJECT_VERSION) throw new TypeError("R3G-D subject version mismatch")
  const rebuilt = createGvisorTtlSubjectBinding({ binding: record.binding as GvisorContainerBinding, lineage: record.lineage as GvisorRuntimeLineageRecord, state: record.state as GvisorStateObservation, process: record.process as GvisorProcessObservation, runscArtifact: record.runscArtifact as GvisorObserverArtifact, controlEndpoint: record.controlEndpoint as GvisorNetworkControlEndpointIdentity, expectedPeerUid: record.expectedPeerUid as string, expectedPeerGid: record.expectedPeerGid as string })
  if (identity(record.subjectBindingIdentity, "subjectBindingIdentity") !== rebuilt.subjectBindingIdentity) throw new TypeError("R3G-D subjectBindingIdentity mismatch")
  if (requirementValue !== undefined) {
    const requirement = validateSandboxExecutionRequirement(requirementValue)
    if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new TypeError("R3G-D requires requiredSemanticRuntimeClass=gvisor")
    if (rebuilt.binding.requirementIdentity !== requirement.requirementIdentity || rebuilt.binding.workloadIdentity !== requirement.workload.workloadIdentity) throw new TypeError("R3G-D subject does not match requirement/workload")
  }
  return rebuilt
}

export function createGvisorTtlWatchdogImplementationIdentity(input: { watchdogSha256: string; watchdogSizeBytes: number }): string {
  const record = asPlainRecord(input, "R3G-D watchdog implementation input")
  exactKeys(record, ["watchdogSha256", "watchdogSizeBytes"], "R3G-D watchdog implementation input")
  const watchdogSha256 = identity(record.watchdogSha256, "watchdogSha256")
  if (typeof record.watchdogSizeBytes !== "number" || !Number.isSafeInteger(record.watchdogSizeBytes) || record.watchdogSizeBytes <= 0 || record.watchdogSizeBytes > KDO_H4_R3G_D_LIMITS.maxWatchdogBytes) throw new TypeError("watchdogSizeBytes is outside the authorized bound")
  return hash("WATCHDOG_IMPLEMENTATION", [KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION, KDO_H4_R3G_D_GVISOR_SOURCE_COMMIT, watchdogSha256, record.watchdogSizeBytes])
}

export function createGvisorTtlPreparedIntent(input: { requirement: SandboxExecutionRequirement; subject: GvisorTtlSubjectBinding; watchdogImplementationIdentity: string }): GvisorTtlPreparedIntent {
  const record = asPlainRecord(input, "R3G-D prepared intent input")
  exactKeys(record, ["requirement", "subject", "watchdogImplementationIdentity"], "R3G-D prepared intent input")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  const subject = validateGvisorTtlSubjectBinding(record.subject, requirement)
  const ttlMs = positiveTtl(requirement.workload.resourcePolicy.ttlMs)
  const watchdogImplementationIdentity = identity(record.watchdogImplementationIdentity, "watchdogImplementationIdentity")
  const armPayload = Object.freeze({ executionAttemptIdentity: subject.binding.executionAttemptIdentity, requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, containerBindingIdentity: subject.binding.bindingIdentity, containerId: subject.binding.containerId, runtimeInstanceIdentity: subject.lineage.runtimeInstanceIdentity, ttlMs, watchdogImplementationIdentity })
  const canonicalArmPayloadDigest = hash("ARM_PAYLOAD", armPayload)
  const armOperationIdentity = hash("ARM_OPERATION", armPayload)
  const base = Object.freeze({ version: KDO_H4_R3G_D_PREPARED_VERSION, state: "PREPARED" as const, armOperationIdentity, ...armPayload, canonicalArmPayloadDigest })
  return Object.freeze({ ...base, intentIdentity: hash("PREPARED_INTENT", base) })
}

export function validateGvisorTtlPreparedIntent(value: unknown): GvisorTtlPreparedIntent {
  const record = asPlainRecord(value, "R3G-D prepared intent")
  exactKeys(record, ["version", "state", "armOperationIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity", "ttlMs", "watchdogImplementationIdentity", "canonicalArmPayloadDigest", "intentIdentity"], "R3G-D prepared intent")
  if (record.version !== KDO_H4_R3G_D_PREPARED_VERSION || record.state !== "PREPARED") throw new TypeError("R3G-D prepared intent version/state mismatch")
  const armPayload = Object.freeze({ executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"), requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"), workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"), containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"), containerId: fullContainerId(record.containerId), runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"), ttlMs: positiveTtl(record.ttlMs), watchdogImplementationIdentity: identity(record.watchdogImplementationIdentity, "watchdogImplementationIdentity") })
  const canonicalArmPayloadDigest = hash("ARM_PAYLOAD", armPayload); const armOperationIdentity = hash("ARM_OPERATION", armPayload)
  if (identity(record.canonicalArmPayloadDigest, "canonicalArmPayloadDigest") !== canonicalArmPayloadDigest || identity(record.armOperationIdentity, "armOperationIdentity") !== armOperationIdentity) throw new TypeError("R3G-D prepared arm identity mismatch")
  const base = Object.freeze({ version: KDO_H4_R3G_D_PREPARED_VERSION, state: "PREPARED" as const, armOperationIdentity, ...armPayload, canonicalArmPayloadDigest })
  const intentIdentity = hash("PREPARED_INTENT", base)
  if (identity(record.intentIdentity, "intentIdentity") !== intentIdentity) throw new TypeError("R3G-D prepared intentIdentity mismatch")
  return Object.freeze({ ...base, intentIdentity })
}

export function createGvisorTtlClockDomainIdentity(linuxBootIdValue: string): string { return hash("CLOCK_DOMAIN", [bootId(linuxBootIdValue), KDO_H4_R3G_D_CLOCK_NAME]) }

export function validateGvisorTtlArmAcknowledgement(value: unknown, preparedValue?: GvisorTtlPreparedIntent, subjectValue?: GvisorTtlSubjectBinding): GvisorTtlArmAcknowledgement {
  const record = asPlainRecord(value, "R3G-D arm acknowledgement")
  exactKeys(record, ["version", "leaseIdentity", "armOperationIdentity", "runtimeInstanceIdentity", "controlPeerBindingIdentity", "runscArtifactIdentity", "verifiedRunscSha256", "watchdogRegistryRecordIdentity", "clockDomainIdentity", "linuxBootId", "leaseStartBoottimeNs", "deadlineBoottimeNs", "ownerInstanceIdentity", "terminalFenceToken", "claimRecordIdentity", "armAcknowledgementIdentity"], "R3G-D arm acknowledgement")
  if (record.version !== KDO_H4_R3G_D_ARM_ACK_VERSION) throw new TypeError("R3G-D arm acknowledgement version mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_D_ARM_ACK_VERSION,
    leaseIdentity: identity(record.leaseIdentity, "leaseIdentity"),
    armOperationIdentity: identity(record.armOperationIdentity, "armOperationIdentity"),
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    controlPeerBindingIdentity: identity(record.controlPeerBindingIdentity, "controlPeerBindingIdentity"),
    runscArtifactIdentity: identity(record.runscArtifactIdentity, "runscArtifactIdentity"),
    verifiedRunscSha256: identity(record.verifiedRunscSha256, "verifiedRunscSha256"),
    watchdogRegistryRecordIdentity: identity(record.watchdogRegistryRecordIdentity, "watchdogRegistryRecordIdentity"),
    clockDomainIdentity: identity(record.clockDomainIdentity, "clockDomainIdentity"),
    linuxBootId: bootId(record.linuxBootId),
    leaseStartBoottimeNs: canonicalUint(record.leaseStartBoottimeNs, "leaseStartBoottimeNs"),
    deadlineBoottimeNs: canonicalUint(record.deadlineBoottimeNs, "deadlineBoottimeNs"),
    ownerInstanceIdentity: identity(record.ownerInstanceIdentity, "ownerInstanceIdentity"),
    terminalFenceToken: canonicalUint(record.terminalFenceToken, "terminalFenceToken", false),
    claimRecordIdentity: identity(record.claimRecordIdentity, "claimRecordIdentity"),
  })
  if (BigInt(base.deadlineBoottimeNs) <= BigInt(base.leaseStartBoottimeNs)) throw new TypeError("R3G-D deadline must be after lease start")
  if (createGvisorTtlClockDomainIdentity(base.linuxBootId) !== base.clockDomainIdentity) throw new TypeError("R3G-D clockDomainIdentity mismatch")
  const armAcknowledgementIdentity = hash("ARM_ACK", base)
  if (identity(record.armAcknowledgementIdentity, "armAcknowledgementIdentity") !== armAcknowledgementIdentity) throw new TypeError("R3G-D armAcknowledgementIdentity mismatch")
  if (preparedValue !== undefined) {
    const prepared = validateGvisorTtlPreparedIntent(preparedValue)
    if (base.armOperationIdentity !== prepared.armOperationIdentity || base.runtimeInstanceIdentity !== prepared.runtimeInstanceIdentity) throw new TypeError("R3G-D arm acknowledgement does not match PREPARED intent")
    const expectedDelta = BigInt(prepared.ttlMs) * 1_000_000n
    if (BigInt(base.deadlineBoottimeNs) - BigInt(base.leaseStartBoottimeNs) !== expectedDelta) throw new TypeError("R3G-D arm acknowledgement deadline does not equal immutable ttlMs")
  }
  if (subjectValue !== undefined) {
    const subject = validateGvisorTtlSubjectBinding(subjectValue)
    if (base.runtimeInstanceIdentity !== subject.lineage.runtimeInstanceIdentity || base.runscArtifactIdentity !== subject.runscArtifact.artifactIdentity || base.verifiedRunscSha256 !== subject.runscArtifact.sha256) throw new TypeError("R3G-D arm acknowledgement trusted subject/artifact mismatch")
  }
  return Object.freeze({ ...base, armAcknowledgementIdentity })
}

export function createGvisorTtlArmRecord(input: { prepared: GvisorTtlPreparedIntent; acknowledgement: GvisorTtlArmAcknowledgement; subject: GvisorTtlSubjectBinding }): GvisorTtlArmRecord {
  const record = asPlainRecord(input, "R3G-D arm record input")
  exactKeys(record, ["prepared", "acknowledgement", "subject"], "R3G-D arm record input")
  const prepared = validateGvisorTtlPreparedIntent(record.prepared)
  const subject = validateGvisorTtlSubjectBinding(record.subject)
  const acknowledgement = validateGvisorTtlArmAcknowledgement(record.acknowledgement, prepared, subject)
  const base = Object.freeze({ version: KDO_H4_R3G_D_ARM_RECORD_VERSION, evidenceClass: KDO_H4_R3G_D_ARM_EVIDENCE_CLASS, armOperationIdentity: prepared.armOperationIdentity, canonicalArmPayloadDigest: prepared.canonicalArmPayloadDigest, leaseIdentity: acknowledgement.leaseIdentity, executionAttemptIdentity: prepared.executionAttemptIdentity, requirementIdentity: prepared.requirementIdentity, workloadIdentity: prepared.workloadIdentity, containerBindingIdentity: prepared.containerBindingIdentity, containerId: prepared.containerId, runtimeInstanceIdentity: prepared.runtimeInstanceIdentity, ttlMs: prepared.ttlMs, watchdogImplementationIdentity: prepared.watchdogImplementationIdentity, controlPeerBindingIdentity: acknowledgement.controlPeerBindingIdentity, runscArtifactIdentity: acknowledgement.runscArtifactIdentity, verifiedRunscSha256: acknowledgement.verifiedRunscSha256, watchdogRegistryRecordIdentity: acknowledgement.watchdogRegistryRecordIdentity, clockDomainIdentity: acknowledgement.clockDomainIdentity, linuxBootId: acknowledgement.linuxBootId, leaseStartBoottimeNs: acknowledgement.leaseStartBoottimeNs, deadlineBoottimeNs: acknowledgement.deadlineBoottimeNs, ownerInstanceIdentity: acknowledgement.ownerInstanceIdentity, terminalFenceToken: acknowledgement.terminalFenceToken, claimRecordIdentity: acknowledgement.claimRecordIdentity, armAcknowledgementIdentity: acknowledgement.armAcknowledgementIdentity })
  return Object.freeze({ ...base, recordIdentity: hash("ARM_RECORD", base) })
}

export function validateGvisorTtlArmRecord(value: unknown): GvisorTtlArmRecord {
  const record = asPlainRecord(value, "R3G-D arm record")
  exactKeys(record, ["version", "evidenceClass", "armOperationIdentity", "canonicalArmPayloadDigest", "leaseIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity", "ttlMs", "watchdogImplementationIdentity", "controlPeerBindingIdentity", "runscArtifactIdentity", "verifiedRunscSha256", "watchdogRegistryRecordIdentity", "clockDomainIdentity", "linuxBootId", "leaseStartBoottimeNs", "deadlineBoottimeNs", "ownerInstanceIdentity", "terminalFenceToken", "claimRecordIdentity", "armAcknowledgementIdentity", "recordIdentity"], "R3G-D arm record")
  if (record.version !== KDO_H4_R3G_D_ARM_RECORD_VERSION || record.evidenceClass !== KDO_H4_R3G_D_ARM_EVIDENCE_CLASS) throw new TypeError("R3G-D arm record version/evidence class mismatch")
  const base = Object.freeze({ version: KDO_H4_R3G_D_ARM_RECORD_VERSION, evidenceClass: KDO_H4_R3G_D_ARM_EVIDENCE_CLASS, armOperationIdentity: identity(record.armOperationIdentity, "armOperationIdentity"), canonicalArmPayloadDigest: identity(record.canonicalArmPayloadDigest, "canonicalArmPayloadDigest"), leaseIdentity: identity(record.leaseIdentity, "leaseIdentity"), executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"), requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"), workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"), containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"), containerId: fullContainerId(record.containerId), runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"), ttlMs: positiveTtl(record.ttlMs), watchdogImplementationIdentity: identity(record.watchdogImplementationIdentity, "watchdogImplementationIdentity"), controlPeerBindingIdentity: identity(record.controlPeerBindingIdentity, "controlPeerBindingIdentity"), runscArtifactIdentity: identity(record.runscArtifactIdentity, "runscArtifactIdentity"), verifiedRunscSha256: identity(record.verifiedRunscSha256, "verifiedRunscSha256"), watchdogRegistryRecordIdentity: identity(record.watchdogRegistryRecordIdentity, "watchdogRegistryRecordIdentity"), clockDomainIdentity: identity(record.clockDomainIdentity, "clockDomainIdentity"), linuxBootId: bootId(record.linuxBootId), leaseStartBoottimeNs: canonicalUint(record.leaseStartBoottimeNs, "leaseStartBoottimeNs"), deadlineBoottimeNs: canonicalUint(record.deadlineBoottimeNs, "deadlineBoottimeNs"), ownerInstanceIdentity: identity(record.ownerInstanceIdentity, "ownerInstanceIdentity"), terminalFenceToken: canonicalUint(record.terminalFenceToken, "terminalFenceToken", false), claimRecordIdentity: identity(record.claimRecordIdentity, "claimRecordIdentity"), armAcknowledgementIdentity: identity(record.armAcknowledgementIdentity, "armAcknowledgementIdentity") })
  if (createGvisorTtlClockDomainIdentity(base.linuxBootId) !== base.clockDomainIdentity) throw new TypeError("R3G-D arm record clock domain mismatch")
  if (BigInt(base.deadlineBoottimeNs) - BigInt(base.leaseStartBoottimeNs) !== BigInt(base.ttlMs) * 1_000_000n) throw new TypeError("R3G-D arm record immutable deadline mismatch")
  const expected = hash("ARM_RECORD", base)
  if (identity(record.recordIdentity, "recordIdentity") !== expected) throw new TypeError("R3G-D arm record identity mismatch")
  return Object.freeze({ ...base, recordIdentity: expected })
}

export function validateGvisorTtlTerminalRecord(value: unknown, armValue?: GvisorTtlArmRecord): GvisorTtlTerminalRecord {
  const record = asPlainRecord(value, "R3G-D terminal record")
  exactKeys(record, ["version", "evidenceClass", "armOperationIdentity", "leaseIdentity", "armRecordIdentity", "runtimeInstanceIdentity", "terminalOutcome", "ownerInstanceIdentity", "terminalFenceToken", "claimRecordIdentity", "controlPeerBindingIdentity", "socketDevice", "socketInode", "peerPid", "peerUid", "peerGid", "retainedPidfdProcessIdentity", "runscArtifactIdentity", "verifiedRunscSha256", "retainedRunscExecutableIdentity", "clockDomainIdentity", "linuxBootId", "exitEventObservedBoottimeNs", "liveAtExpiryProbeIdentity", "liveAtExpiryObservedBoottimeNs", "liveAtExpiryProcessSetIdentity", "signalAcknowledgementIdentity", "terminationAcknowledgementIdentity", "registryTerminalRecordIdentity", "recordIdentity"], "R3G-D terminal record")
  if (record.version !== KDO_H4_R3G_D_TERMINAL_RECORD_VERSION || record.evidenceClass !== KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS) throw new TypeError("R3G-D terminal record version/evidence class mismatch")
  if (record.terminalOutcome !== "natural-exit" && record.terminalOutcome !== "ttl-expired" && record.terminalOutcome !== "indeterminate") throw new TypeError("R3G-D terminal outcome is invalid")
  const base = Object.freeze({ version: KDO_H4_R3G_D_TERMINAL_RECORD_VERSION, evidenceClass: KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS, armOperationIdentity: identity(record.armOperationIdentity, "armOperationIdentity"), leaseIdentity: identity(record.leaseIdentity, "leaseIdentity"), armRecordIdentity: identity(record.armRecordIdentity, "armRecordIdentity"), runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"), terminalOutcome: record.terminalOutcome, ownerInstanceIdentity: identity(record.ownerInstanceIdentity, "ownerInstanceIdentity"), terminalFenceToken: canonicalUint(record.terminalFenceToken, "terminalFenceToken", false), claimRecordIdentity: identity(record.claimRecordIdentity, "claimRecordIdentity"), controlPeerBindingIdentity: identity(record.controlPeerBindingIdentity, "controlPeerBindingIdentity"), socketDevice: canonicalUint(record.socketDevice, "socketDevice"), socketInode: canonicalUint(record.socketInode, "socketInode"), peerPid: canonicalPid(record.peerPid), peerUid: canonicalUint(record.peerUid, "peerUid"), peerGid: canonicalUint(record.peerGid, "peerGid"), retainedPidfdProcessIdentity: identity(record.retainedPidfdProcessIdentity, "retainedPidfdProcessIdentity"), runscArtifactIdentity: identity(record.runscArtifactIdentity, "runscArtifactIdentity"), verifiedRunscSha256: identity(record.verifiedRunscSha256, "verifiedRunscSha256"), retainedRunscExecutableIdentity: identity(record.retainedRunscExecutableIdentity, "retainedRunscExecutableIdentity"), clockDomainIdentity: identity(record.clockDomainIdentity, "clockDomainIdentity"), linuxBootId: bootId(record.linuxBootId), exitEventObservedBoottimeNs: nullableUint(record.exitEventObservedBoottimeNs, "exitEventObservedBoottimeNs"), liveAtExpiryProbeIdentity: nullableIdentity(record.liveAtExpiryProbeIdentity, "liveAtExpiryProbeIdentity"), liveAtExpiryObservedBoottimeNs: nullableUint(record.liveAtExpiryObservedBoottimeNs, "liveAtExpiryObservedBoottimeNs"), liveAtExpiryProcessSetIdentity: nullableIdentity(record.liveAtExpiryProcessSetIdentity, "liveAtExpiryProcessSetIdentity"), signalAcknowledgementIdentity: nullableIdentity(record.signalAcknowledgementIdentity, "signalAcknowledgementIdentity"), terminationAcknowledgementIdentity: identity(record.terminationAcknowledgementIdentity, "terminationAcknowledgementIdentity"), registryTerminalRecordIdentity: identity(record.registryTerminalRecordIdentity, "registryTerminalRecordIdentity") })
  if (createGvisorTtlClockDomainIdentity(base.linuxBootId) !== base.clockDomainIdentity) throw new TypeError("R3G-D terminal clock domain mismatch")
  if (base.terminalOutcome === "natural-exit") {
    if (base.exitEventObservedBoottimeNs === null || base.liveAtExpiryProbeIdentity !== null || base.liveAtExpiryObservedBoottimeNs !== null || base.liveAtExpiryProcessSetIdentity !== null || base.signalAcknowledgementIdentity !== null) throw new TypeError("R3G-D natural-exit terminal record contains contradictory expiry fields")
  }
  if (base.terminalOutcome === "ttl-expired") {
    if (base.exitEventObservedBoottimeNs !== null || base.liveAtExpiryProbeIdentity === null || base.liveAtExpiryObservedBoottimeNs === null || base.liveAtExpiryProcessSetIdentity === null || base.signalAcknowledgementIdentity === null) throw new TypeError("R3G-D ttl-expired terminal record is missing required live-at-expiry/signal fields")
  }
  if (armValue !== undefined) {
    const arm = validateGvisorTtlArmRecord(armValue)
    if (base.armOperationIdentity !== arm.armOperationIdentity || base.leaseIdentity !== arm.leaseIdentity || base.armRecordIdentity !== arm.recordIdentity || base.runtimeInstanceIdentity !== arm.runtimeInstanceIdentity || base.controlPeerBindingIdentity !== arm.controlPeerBindingIdentity || base.runscArtifactIdentity !== arm.runscArtifactIdentity || base.verifiedRunscSha256 !== arm.verifiedRunscSha256 || base.clockDomainIdentity !== arm.clockDomainIdentity || base.linuxBootId !== arm.linuxBootId) throw new TypeError("R3G-D terminal record does not match authoritative arm record")
    if (BigInt(base.terminalFenceToken) < BigInt(arm.terminalFenceToken)) throw new TypeError("R3G-D terminal fence token is stale")
    if (base.terminalOutcome === "natural-exit" && BigInt(base.exitEventObservedBoottimeNs as string) >= BigInt(arm.deadlineBoottimeNs)) throw new TypeError("R3G-D natural-exit winner must be observed before deadline")
    if (base.terminalOutcome === "ttl-expired" && BigInt(base.liveAtExpiryObservedBoottimeNs as string) < BigInt(arm.deadlineBoottimeNs)) throw new TypeError("R3G-D expiry liveness must be observed at/after deadline")
  }
  const expected = hash("TERMINAL_RECORD", base)
  if (identity(record.recordIdentity, "recordIdentity") !== expected) throw new TypeError("R3G-D terminal record identity mismatch")
  return Object.freeze({ ...base, recordIdentity: expected })
}

export function createGvisorTtlEvidenceCommit(input: { kind: "prepared" | "arm" | "terminal"; armOperationIdentity: string; leaseIdentity: string | null; recordIdentity: string; payloadDigest: string }): GvisorTtlEvidenceCommit {
  const record = asPlainRecord(input, "R3G-D evidence commit input")
  exactKeys(record, ["kind", "armOperationIdentity", "leaseIdentity", "recordIdentity", "payloadDigest"], "R3G-D evidence commit input")
  if (record.kind !== "prepared" && record.kind !== "arm" && record.kind !== "terminal") throw new TypeError("R3G-D commit kind is invalid")
  const base = Object.freeze({ version: KDO_H4_R3G_D_COMMIT_VERSION, kind: record.kind, armOperationIdentity: identity(record.armOperationIdentity, "armOperationIdentity"), leaseIdentity: record.leaseIdentity === null ? null : identity(record.leaseIdentity, "leaseIdentity"), recordIdentity: identity(record.recordIdentity, "recordIdentity"), payloadDigest: identity(record.payloadDigest, "payloadDigest") })
  if (base.kind === "prepared" && base.leaseIdentity !== null) throw new TypeError("R3G-D PREPARED commit must not bind a leaseIdentity")
  if (base.kind !== "prepared" && base.leaseIdentity === null) throw new TypeError("R3G-D arm/terminal commit must bind leaseIdentity")
  return Object.freeze({ ...base, commitIdentity: hash("EVIDENCE_COMMIT", base) })
}

export function validateGvisorTtlEvidenceCommit(value: unknown, expected?: { kind: "prepared" | "arm" | "terminal"; armOperationIdentity: string; leaseIdentity: string | null; recordIdentity: string; payloadDigest: string }): GvisorTtlEvidenceCommit {
  const record = asPlainRecord(value, "R3G-D evidence commit")
  exactKeys(record, ["version", "kind", "armOperationIdentity", "leaseIdentity", "recordIdentity", "payloadDigest", "commitIdentity"], "R3G-D evidence commit")
  if (record.version !== KDO_H4_R3G_D_COMMIT_VERSION) throw new TypeError("R3G-D evidence commit version mismatch")
  const rebuilt = createGvisorTtlEvidenceCommit({ kind: record.kind as "prepared" | "arm" | "terminal", armOperationIdentity: record.armOperationIdentity as string, leaseIdentity: record.leaseIdentity as string | null, recordIdentity: record.recordIdentity as string, payloadDigest: record.payloadDigest as string })
  if (identity(record.commitIdentity, "commitIdentity") !== rebuilt.commitIdentity) throw new TypeError("R3G-D evidence commit identity mismatch")
  if (expected !== undefined && (rebuilt.kind !== expected.kind || rebuilt.armOperationIdentity !== expected.armOperationIdentity || rebuilt.leaseIdentity !== expected.leaseIdentity || rebuilt.recordIdentity !== expected.recordIdentity || rebuilt.payloadDigest !== expected.payloadDigest)) throw new TypeError("R3G-D evidence commit acknowledgement does not match exact payload")
  return rebuilt
}

export function validateGvisorTtlRuntimeConfig(value: unknown): GvisorTtlRuntimeConfig {
  const record = asPlainRecord(value, "R3G-D runtime config")
  exactKeys(record, ["version", "watchdogPath", "expectedWatchdogSha256", "registryRoot", "resolveSubject", "commitPreparedIntent", "commitArmEvidence", "commitTerminalEvidence"], "R3G-D runtime config")
  if (record.version !== KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION) throw new TypeError("R3G-D runtime config version mismatch")
  for (const key of ["resolveSubject", "commitPreparedIntent", "commitArmEvidence", "commitTerminalEvidence"] as const) if (typeof record[key] !== "function") throw new TypeError(`R3G-D ${key} must be a trusted function`)
  return Object.freeze({ version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION, watchdogPath: canonicalPath(record.watchdogPath, "watchdogPath"), expectedWatchdogSha256: identity(record.expectedWatchdogSha256, "expectedWatchdogSha256"), registryRoot: canonicalPath(record.registryRoot, "registryRoot"), resolveSubject: record.resolveSubject as GvisorTtlRuntimeConfig["resolveSubject"], commitPreparedIntent: record.commitPreparedIntent as GvisorTtlRuntimeConfig["commitPreparedIntent"], commitArmEvidence: record.commitArmEvidence as GvisorTtlRuntimeConfig["commitArmEvidence"], commitTerminalEvidence: record.commitTerminalEvidence as GvisorTtlRuntimeConfig["commitTerminalEvidence"] })
}

export function payloadDigest(value: unknown): string { return hash("PAYLOAD", value) }
