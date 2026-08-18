import { createHash } from "node:crypto"

import { createGvisorTtlWatchdogProtocolIdentity } from "./gateway-gvisor-ttl.ts"
import type { GvisorTtlPhysicalLeaseRecord } from "./gateway-gvisor-ttl-registry.ts"
import {
  KDO_H4_R3G_D_ARM_ACK_VERSION,
  KDO_H4_R3G_D_ARM_EVIDENCE_CLASS,
  KDO_H4_R3G_D_ARM_RECORD_VERSION,
  KDO_H4_R3G_D_CONTROL_PEER_VERSION,
  KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION,
  createGvisorTtlWatchdogLeaseRecord,
  validateGvisorTtlArmRecord,
  validateGvisorTtlPreparedIntent,
  type GvisorTtlArmRecord,
  type GvisorTtlControlPeerBinding,
  type GvisorTtlPreparedIntent,
} from "../trust/sandbox-lifecycle-gvisor-ttl.ts"

export const KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION = "kodac-h4-r3g-d-arm-registry-v1" as const

const SHA256 = /^[0-9a-f]{64}$/
const UINT = /^(?:0|[1-9][0-9]*)$/
const MAX_UINT64 = 18_446_744_073_709_551_615n
const MAX_RECORD_BYTES = 16_384

export interface GvisorTtlPhysicalArmReplayRecord {
  readonly version: typeof KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION
  readonly armOperationIdentity: string
  readonly canonicalArmPayloadDigest: string
  readonly leaseIdentity: string
  readonly runtimeInstanceIdentity: string
  readonly controlPeerBindingIdentity: string
  readonly socketDevice: string
  readonly socketInode: string
  readonly peerPid: number
  readonly peerUid: string
  readonly peerGid: string
  readonly processStartTicks: string
  readonly executableDevice: string
  readonly executableInode: string
  readonly executableSize: string
  readonly retainedPidfdProcessIdentity: string
  readonly runscArtifactIdentity: string
  readonly verifiedRunscSha256: string
  readonly retainedRunscExecutableIdentity: string
  readonly watchdogRegistryRecordIdentity: string
  readonly clockDomainIdentity: string
  readonly linuxBootId: string
  readonly leaseStartBoottimeNs: string
  readonly deadlineBoottimeNs: string
  readonly ownerInstanceIdentity: string
  readonly terminalFenceToken: string
  readonly claimRecordIdentity: string
  readonly physicalArmAcknowledgementIdentity: string
  readonly armRegistryRecordIdentity: string
}

function logicalHash(domain: string, value: unknown): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-D logical hash domain must be canonical uppercase ASCII")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function identity(value: string, label: string): string {
  if (!SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function canonicalUint(value: string, label: string, allowZero = true): string {
  if (!UINT.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  const parsed = BigInt(value)
  if ((!allowZero && parsed === 0n) || parsed > MAX_UINT64) throw new TypeError(`${label} is outside uint64 range`)
  return value
}

function canonicalPid(value: string): number {
  const text = canonicalUint(value, "peerPid", false)
  const parsed = Number(text)
  if (!Number.isSafeInteger(parsed) || parsed > 2_147_483_647) throw new TypeError("peerPid is outside Linux pid range")
  return parsed
}

function parseCanonicalRecord(text: string): Record<string, string> {
  const keys = [
    "version",
    "armOperationIdentity",
    "canonicalArmPayloadDigest",
    "leaseIdentity",
    "runtimeInstanceIdentity",
    "controlPeerBindingIdentity",
    "socketDevice",
    "socketInode",
    "peerPid",
    "peerUid",
    "peerGid",
    "processStartTicks",
    "executableDevice",
    "executableInode",
    "executableSize",
    "retainedPidfdProcessIdentity",
    "runscArtifactIdentity",
    "verifiedRunscSha256",
    "retainedRunscExecutableIdentity",
    "watchdogRegistryRecordIdentity",
    "clockDomainIdentity",
    "linuxBootId",
    "leaseStartBoottimeNs",
    "deadlineBoottimeNs",
    "ownerInstanceIdentity",
    "terminalFenceToken",
    "claimRecordIdentity",
    "physicalArmAcknowledgementIdentity",
    "armRegistryRecordIdentity",
  ] as const
  if (typeof text !== "string" || Buffer.byteLength(text, "utf8") === 0 || Buffer.byteLength(text, "utf8") > MAX_RECORD_BYTES || text.includes("\0") || text.includes("\r") || !text.endsWith("\n")) {
    throw new TypeError("R3G-D physical arm replay bytes are not canonical or bounded")
  }
  const lines = text.slice(0, -1).split("\n")
  if (lines.length !== keys.length) throw new TypeError("R3G-D physical arm replay field count is not canonical")
  const record: Record<string, string> = Object.create(null) as Record<string, string>
  for (let index = 0; index < keys.length; index += 1) {
    const line = lines[index]
    const separator = line.indexOf("=")
    if (separator <= 0 || line.indexOf("=", separator + 1) !== -1) throw new TypeError("R3G-D physical arm replay line grammar is invalid")
    const key = line.slice(0, separator)
    const value = line.slice(separator + 1)
    if (key !== keys[index] || value.length === 0 || Object.hasOwn(record, key)) throw new TypeError("R3G-D physical arm replay field ordering is not canonical")
    record[key] = value
  }
  return record
}

function expectedArmRegistryIdentity(value: Omit<GvisorTtlPhysicalArmReplayRecord, "armRegistryRecordIdentity">): string {
  return createGvisorTtlWatchdogProtocolIdentity("ARM_REGISTRY", [
    value.version,
    value.armOperationIdentity,
    value.canonicalArmPayloadDigest,
    value.leaseIdentity,
    value.runtimeInstanceIdentity,
    value.controlPeerBindingIdentity,
    value.socketDevice,
    value.socketInode,
    String(value.peerPid),
    value.peerUid,
    value.peerGid,
    value.processStartTicks,
    value.executableDevice,
    value.executableInode,
    value.executableSize,
    value.retainedPidfdProcessIdentity,
    value.runscArtifactIdentity,
    value.verifiedRunscSha256,
    value.retainedRunscExecutableIdentity,
    value.watchdogRegistryRecordIdentity,
    value.clockDomainIdentity,
    value.linuxBootId,
    value.leaseStartBoottimeNs,
    value.deadlineBoottimeNs,
    value.ownerInstanceIdentity,
    value.terminalFenceToken,
    value.claimRecordIdentity,
    value.physicalArmAcknowledgementIdentity,
  ])
}

export function parseGvisorTtlPhysicalArmReplayRecord(text: string, lease: GvisorTtlPhysicalLeaseRecord): GvisorTtlPhysicalArmReplayRecord {
  const record = parseCanonicalRecord(text)
  if (record.version !== KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION) throw new TypeError("R3G-D physical arm replay version mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION,
    armOperationIdentity: identity(record.armOperationIdentity, "armOperationIdentity"),
    canonicalArmPayloadDigest: identity(record.canonicalArmPayloadDigest, "canonicalArmPayloadDigest"),
    leaseIdentity: identity(record.leaseIdentity, "leaseIdentity"),
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    controlPeerBindingIdentity: identity(record.controlPeerBindingIdentity, "controlPeerBindingIdentity"),
    socketDevice: canonicalUint(record.socketDevice, "socketDevice", false),
    socketInode: canonicalUint(record.socketInode, "socketInode", false),
    peerPid: canonicalPid(record.peerPid),
    peerUid: canonicalUint(record.peerUid, "peerUid"),
    peerGid: canonicalUint(record.peerGid, "peerGid"),
    processStartTicks: canonicalUint(record.processStartTicks, "processStartTicks", false),
    executableDevice: canonicalUint(record.executableDevice, "executableDevice", false),
    executableInode: canonicalUint(record.executableInode, "executableInode", false),
    executableSize: canonicalUint(record.executableSize, "executableSize", false),
    retainedPidfdProcessIdentity: identity(record.retainedPidfdProcessIdentity, "retainedPidfdProcessIdentity"),
    runscArtifactIdentity: identity(record.runscArtifactIdentity, "runscArtifactIdentity"),
    verifiedRunscSha256: identity(record.verifiedRunscSha256, "verifiedRunscSha256"),
    retainedRunscExecutableIdentity: identity(record.retainedRunscExecutableIdentity, "retainedRunscExecutableIdentity"),
    watchdogRegistryRecordIdentity: identity(record.watchdogRegistryRecordIdentity, "watchdogRegistryRecordIdentity"),
    clockDomainIdentity: identity(record.clockDomainIdentity, "clockDomainIdentity"),
    linuxBootId: record.linuxBootId,
    leaseStartBoottimeNs: canonicalUint(record.leaseStartBoottimeNs, "leaseStartBoottimeNs"),
    deadlineBoottimeNs: canonicalUint(record.deadlineBoottimeNs, "deadlineBoottimeNs"),
    ownerInstanceIdentity: identity(record.ownerInstanceIdentity, "ownerInstanceIdentity"),
    terminalFenceToken: canonicalUint(record.terminalFenceToken, "terminalFenceToken", false),
    claimRecordIdentity: identity(record.claimRecordIdentity, "claimRecordIdentity"),
    physicalArmAcknowledgementIdentity: identity(record.physicalArmAcknowledgementIdentity, "physicalArmAcknowledgementIdentity"),
  })
  if (
    base.armOperationIdentity !== lease.armOperationIdentity ||
    base.canonicalArmPayloadDigest !== lease.canonicalArmPayloadDigest ||
    base.leaseIdentity !== lease.leaseIdentity ||
    base.runtimeInstanceIdentity !== lease.runtimeInstanceIdentity ||
    base.watchdogRegistryRecordIdentity !== lease.registryRecordIdentity ||
    base.clockDomainIdentity !== lease.clockDomainIdentity ||
    base.linuxBootId !== lease.linuxBootId ||
    base.leaseStartBoottimeNs !== lease.leaseStartBoottimeNs ||
    base.deadlineBoottimeNs !== lease.deadlineBoottimeNs ||
    base.ownerInstanceIdentity !== lease.ownerInstanceIdentity ||
    base.terminalFenceToken !== lease.terminalFenceToken ||
    base.claimRecordIdentity !== lease.claimRecordIdentity
  ) throw new TypeError("R3G-D physical arm replay does not match authoritative lease generation")

  const expectedPhysicalPeer = createGvisorTtlWatchdogProtocolIdentity("CONTROL_PEER", [
    lease.runtimeInstanceIdentity,
    lease.containerId,
    base.socketDevice,
    base.socketInode,
    String(base.peerPid),
    base.peerUid,
    base.peerGid,
    base.processStartTicks,
    base.executableDevice,
    base.executableInode,
    base.executableSize,
    base.verifiedRunscSha256,
  ])
  if (base.controlPeerBindingIdentity !== expectedPhysicalPeer) throw new TypeError("R3G-D physical arm replay control-peer identity mismatch")
  const expectedPidfd = createGvisorTtlWatchdogProtocolIdentity("PIDFD_PROCESS", [String(base.peerPid), base.processStartTicks, base.executableDevice, base.executableInode, base.executableSize, lease.runtimeInstanceIdentity])
  if (base.retainedPidfdProcessIdentity !== expectedPidfd) throw new TypeError("R3G-D physical arm replay retained pidfd identity mismatch")
  const expectedRunsc = createGvisorTtlWatchdogProtocolIdentity("RUNSC_EXECUTABLE", [base.verifiedRunscSha256, base.executableDevice, base.executableInode, base.executableSize, base.runscArtifactIdentity])
  if (base.retainedRunscExecutableIdentity !== expectedRunsc) throw new TypeError("R3G-D physical arm replay retained runsc identity mismatch")
  const expectedPhysicalAck = createGvisorTtlWatchdogProtocolIdentity("PHYSICAL_ARM_ACK", [
    lease.leaseIdentity,
    lease.armOperationIdentity,
    lease.runtimeInstanceIdentity,
    expectedPhysicalPeer,
    base.runscArtifactIdentity,
    base.verifiedRunscSha256,
    lease.registryRecordIdentity,
    lease.clockDomainIdentity,
    lease.linuxBootId,
    lease.ownerInstanceIdentity,
    lease.claimRecordIdentity,
  ])
  if (base.physicalArmAcknowledgementIdentity !== expectedPhysicalAck) throw new TypeError("R3G-D physical arm replay acknowledgement identity mismatch")
  const armRegistryRecordIdentity = expectedArmRegistryIdentity(base)
  if (identity(record.armRegistryRecordIdentity, "armRegistryRecordIdentity") !== armRegistryRecordIdentity) throw new TypeError("R3G-D physical arm replay registry identity mismatch")
  return Object.freeze({ ...base, armRegistryRecordIdentity })
}

export function recoverGvisorTtlLogicalArmRecord(input: {
  prepared: GvisorTtlPreparedIntent
  physicalLease: GvisorTtlPhysicalLeaseRecord
  replay: GvisorTtlPhysicalArmReplayRecord
}): GvisorTtlArmRecord {
  const prepared = validateGvisorTtlPreparedIntent(input.prepared)
  const physicalLease = input.physicalLease
  const replay = input.replay
  if (
    prepared.armOperationIdentity !== physicalLease.armOperationIdentity ||
    prepared.canonicalArmPayloadDigest !== physicalLease.canonicalArmPayloadDigest ||
    prepared.executionAttemptIdentity !== physicalLease.executionAttemptIdentity ||
    prepared.requirementIdentity !== physicalLease.requirementIdentity ||
    prepared.workloadIdentity !== physicalLease.workloadIdentity ||
    prepared.containerBindingIdentity !== physicalLease.containerBindingIdentity ||
    prepared.containerId !== physicalLease.containerId ||
    prepared.runtimeInstanceIdentity !== physicalLease.runtimeInstanceIdentity ||
    prepared.ttlMs !== physicalLease.ttlMs ||
    prepared.watchdogImplementationIdentity !== physicalLease.watchdogImplementationIdentity
  ) throw new TypeError("R3G-D physical lease does not match authoritative PREPARED intent")
  const checkedReplay = parseGvisorTtlPhysicalArmReplayRecord(serializeGvisorTtlPhysicalArmReplayRecord(replay), physicalLease)
  const logicalLease = createGvisorTtlWatchdogLeaseRecord({ prepared, linuxBootId: physicalLease.linuxBootId, leaseStartBoottimeNs: physicalLease.leaseStartBoottimeNs })
  const controlPeerBase = Object.freeze({
    version: KDO_H4_R3G_D_CONTROL_PEER_VERSION,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    socketDevice: checkedReplay.socketDevice,
    socketInode: checkedReplay.socketInode,
    peerPid: checkedReplay.peerPid,
    peerUid: checkedReplay.peerUid,
    peerGid: checkedReplay.peerGid,
    processStartTicks: checkedReplay.processStartTicks,
    executableDevice: checkedReplay.executableDevice,
    executableInode: checkedReplay.executableInode,
    executableSize: checkedReplay.executableSize,
    runscArtifactIdentity: checkedReplay.runscArtifactIdentity,
    verifiedRunscSha256: checkedReplay.verifiedRunscSha256,
    helperProtocolVersion: KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION,
  })
  const controlPeer: GvisorTtlControlPeerBinding = Object.freeze({
    ...controlPeerBase,
    controlPeerBindingIdentity: logicalHash("CONTROL_PEER", [
      controlPeerBase.runtimeInstanceIdentity,
      controlPeerBase.peerPid,
      controlPeerBase.peerUid,
      controlPeerBase.peerGid,
      controlPeerBase.socketDevice,
      controlPeerBase.socketInode,
      controlPeerBase.processStartTicks,
      controlPeerBase.executableDevice,
      controlPeerBase.executableInode,
      controlPeerBase.executableSize,
      controlPeerBase.runscArtifactIdentity,
      controlPeerBase.verifiedRunscSha256,
      controlPeerBase.helperProtocolVersion,
    ]),
  })
  const acknowledgementBase = Object.freeze({
    version: KDO_H4_R3G_D_ARM_ACK_VERSION,
    leaseIdentity: logicalLease.leaseIdentity,
    armOperationIdentity: prepared.armOperationIdentity,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    controlPeer,
    controlPeerBindingIdentity: controlPeer.controlPeerBindingIdentity,
    runscArtifactIdentity: checkedReplay.runscArtifactIdentity,
    verifiedRunscSha256: checkedReplay.verifiedRunscSha256,
    watchdogRegistryRecordIdentity: logicalLease.registryRecordIdentity,
    clockDomainIdentity: logicalLease.clockDomainIdentity,
    linuxBootId: logicalLease.linuxBootId,
    leaseStartBoottimeNs: logicalLease.leaseStartBoottimeNs,
    deadlineBoottimeNs: logicalLease.deadlineBoottimeNs,
    ownerInstanceIdentity: checkedReplay.ownerInstanceIdentity,
    terminalFenceToken: checkedReplay.terminalFenceToken,
    claimRecordIdentity: checkedReplay.claimRecordIdentity,
  })
  const acknowledgement = Object.freeze({ ...acknowledgementBase, armAcknowledgementIdentity: logicalHash("ARM_ACK", acknowledgementBase) })
  const armBase = Object.freeze({
    version: KDO_H4_R3G_D_ARM_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_D_ARM_EVIDENCE_CLASS,
    armOperationIdentity: prepared.armOperationIdentity,
    canonicalArmPayloadDigest: prepared.canonicalArmPayloadDigest,
    leaseIdentity: logicalLease.leaseIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    requirementIdentity: prepared.requirementIdentity,
    workloadIdentity: prepared.workloadIdentity,
    containerBindingIdentity: prepared.containerBindingIdentity,
    containerId: prepared.containerId,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    ttlMs: prepared.ttlMs,
    watchdogImplementationIdentity: prepared.watchdogImplementationIdentity,
    controlPeer,
    controlPeerBindingIdentity: controlPeer.controlPeerBindingIdentity,
    runscArtifactIdentity: checkedReplay.runscArtifactIdentity,
    verifiedRunscSha256: checkedReplay.verifiedRunscSha256,
    watchdogRegistryRecordIdentity: logicalLease.registryRecordIdentity,
    clockDomainIdentity: logicalLease.clockDomainIdentity,
    linuxBootId: logicalLease.linuxBootId,
    leaseStartBoottimeNs: logicalLease.leaseStartBoottimeNs,
    deadlineBoottimeNs: logicalLease.deadlineBoottimeNs,
    ownerInstanceIdentity: checkedReplay.ownerInstanceIdentity,
    terminalFenceToken: checkedReplay.terminalFenceToken,
    claimRecordIdentity: checkedReplay.claimRecordIdentity,
    armAcknowledgementIdentity: acknowledgement.armAcknowledgementIdentity,
  })
  return validateGvisorTtlArmRecord(Object.freeze({ ...armBase, recordIdentity: logicalHash("ARM_RECORD", armBase) }))
}

export function serializeGvisorTtlPhysicalArmReplayRecord(value: GvisorTtlPhysicalArmReplayRecord): string {
  return [
    ["version", value.version],
    ["armOperationIdentity", value.armOperationIdentity],
    ["canonicalArmPayloadDigest", value.canonicalArmPayloadDigest],
    ["leaseIdentity", value.leaseIdentity],
    ["runtimeInstanceIdentity", value.runtimeInstanceIdentity],
    ["controlPeerBindingIdentity", value.controlPeerBindingIdentity],
    ["socketDevice", value.socketDevice],
    ["socketInode", value.socketInode],
    ["peerPid", String(value.peerPid)],
    ["peerUid", value.peerUid],
    ["peerGid", value.peerGid],
    ["processStartTicks", value.processStartTicks],
    ["executableDevice", value.executableDevice],
    ["executableInode", value.executableInode],
    ["executableSize", value.executableSize],
    ["retainedPidfdProcessIdentity", value.retainedPidfdProcessIdentity],
    ["runscArtifactIdentity", value.runscArtifactIdentity],
    ["verifiedRunscSha256", value.verifiedRunscSha256],
    ["retainedRunscExecutableIdentity", value.retainedRunscExecutableIdentity],
    ["watchdogRegistryRecordIdentity", value.watchdogRegistryRecordIdentity],
    ["clockDomainIdentity", value.clockDomainIdentity],
    ["linuxBootId", value.linuxBootId],
    ["leaseStartBoottimeNs", value.leaseStartBoottimeNs],
    ["deadlineBoottimeNs", value.deadlineBoottimeNs],
    ["ownerInstanceIdentity", value.ownerInstanceIdentity],
    ["terminalFenceToken", value.terminalFenceToken],
    ["claimRecordIdentity", value.claimRecordIdentity],
    ["physicalArmAcknowledgementIdentity", value.physicalArmAcknowledgementIdentity],
    ["armRegistryRecordIdentity", value.armRegistryRecordIdentity],
  ].map(([key, item]) => `${key}=${item}`).join("\n") + "\n"
}