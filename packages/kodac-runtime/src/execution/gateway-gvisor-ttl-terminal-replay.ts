import { createHash } from "node:crypto"

import {
  parseGvisorTtlPhysicalArmReplayRecord,
  serializeGvisorTtlPhysicalArmReplayRecord,
  type GvisorTtlPhysicalArmReplayRecord,
} from "./gateway-gvisor-ttl-arm-replay.ts"
import { createGvisorTtlWatchdogProtocolIdentity } from "./gateway-gvisor-ttl.ts"
import type {
  GvisorTtlPhysicalLeaseRecord,
  GvisorTtlPhysicalTerminalRecord,
} from "./gateway-gvisor-ttl-registry.ts"
import {
  KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
  KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
  validateGvisorTtlArmRecord,
  validateGvisorTtlTerminalRecord,
  type GvisorTtlArmRecord,
  type GvisorTtlTerminalRecord,
} from "../trust/sandbox-lifecycle-gvisor-ttl.ts"

function logicalHash(domain: string, value: unknown): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-D logical terminal hash domain must be canonical uppercase ASCII")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function watchdogNullable(value: string | null): string { return value === null ? "-" : value }

function requirePhysicalLeaseMatchesLogicalArm(physical: GvisorTtlPhysicalLeaseRecord, arm: GvisorTtlArmRecord): void {
  if (
    physical.armOperationIdentity !== arm.armOperationIdentity ||
    physical.canonicalArmPayloadDigest !== arm.canonicalArmPayloadDigest ||
    physical.executionAttemptIdentity !== arm.executionAttemptIdentity ||
    physical.requirementIdentity !== arm.requirementIdentity ||
    physical.workloadIdentity !== arm.workloadIdentity ||
    physical.containerBindingIdentity !== arm.containerBindingIdentity ||
    physical.containerId !== arm.containerId ||
    physical.runtimeInstanceIdentity !== arm.runtimeInstanceIdentity ||
    physical.ttlMs !== arm.ttlMs ||
    physical.watchdogImplementationIdentity !== arm.watchdogImplementationIdentity ||
    physical.linuxBootId !== arm.linuxBootId ||
    physical.clockDomainIdentity !== arm.clockDomainIdentity ||
    physical.leaseStartBoottimeNs !== arm.leaseStartBoottimeNs ||
    physical.deadlineBoottimeNs !== arm.deadlineBoottimeNs ||
    physical.ownerInstanceIdentity !== arm.ownerInstanceIdentity ||
    physical.terminalFenceToken !== arm.terminalFenceToken ||
    physical.claimRecordIdentity !== arm.claimRecordIdentity
  ) throw new TypeError("R3G-D physical lease does not match recovered logical arm semantics")
}

function requirePhysicalTerminalMatchesReplay(input: {
  physicalLease: GvisorTtlPhysicalLeaseRecord
  replay: GvisorTtlPhysicalArmReplayRecord
  terminal: GvisorTtlPhysicalTerminalRecord
}): void {
  const { physicalLease, replay, terminal } = input
  if (
    terminal.armOperationIdentity !== physicalLease.armOperationIdentity ||
    terminal.leaseIdentity !== physicalLease.leaseIdentity ||
    terminal.runtimeInstanceIdentity !== physicalLease.runtimeInstanceIdentity ||
    terminal.ownerInstanceIdentity !== physicalLease.ownerInstanceIdentity ||
    terminal.terminalFenceToken !== physicalLease.terminalFenceToken ||
    terminal.claimRecordIdentity !== physicalLease.claimRecordIdentity ||
    terminal.clockDomainIdentity !== physicalLease.clockDomainIdentity ||
    terminal.linuxBootId !== physicalLease.linuxBootId ||
    terminal.controlPeerBindingIdentity !== replay.controlPeerBindingIdentity ||
    terminal.retainedPidfdProcessIdentity !== replay.retainedPidfdProcessIdentity ||
    terminal.runscArtifactIdentity !== replay.runscArtifactIdentity ||
    terminal.verifiedRunscSha256 !== replay.verifiedRunscSha256 ||
    terminal.retainedRunscExecutableIdentity !== replay.retainedRunscExecutableIdentity
  ) throw new TypeError("R3G-D physical terminal does not match durable physical arm replay generation")

  const expectedRegistry = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    physicalLease.armOperationIdentity,
    physicalLease.leaseIdentity,
    physicalLease.runtimeInstanceIdentity,
    terminal.terminalOutcome,
    physicalLease.ownerInstanceIdentity,
    physicalLease.terminalFenceToken,
    physicalLease.claimRecordIdentity,
    replay.controlPeerBindingIdentity,
    replay.retainedPidfdProcessIdentity,
    replay.runscArtifactIdentity,
    replay.verifiedRunscSha256,
    replay.retainedRunscExecutableIdentity,
    physicalLease.clockDomainIdentity,
    physicalLease.linuxBootId,
    watchdogNullable(terminal.exitEventObservedBoottimeNs),
    watchdogNullable(terminal.liveAtExpiryObservedBoottimeNs),
    watchdogNullable(terminal.liveAtExpiryProbeIdentity),
    watchdogNullable(terminal.liveAtExpiryProcessSetIdentity),
    watchdogNullable(terminal.signalAcknowledgementIdentity),
    terminal.terminationAcknowledgementIdentity,
  ])
  if (terminal.registryTerminalRecordIdentity !== expectedRegistry) throw new TypeError("R3G-D physical terminal registry identity mismatch during logical recovery")
}

export function recoverGvisorTtlLogicalTerminalRecord(input: {
  arm: GvisorTtlArmRecord
  physicalLease: GvisorTtlPhysicalLeaseRecord
  armReplay: GvisorTtlPhysicalArmReplayRecord
  physicalTerminal: GvisorTtlPhysicalTerminalRecord
}): GvisorTtlTerminalRecord {
  const arm = validateGvisorTtlArmRecord(input.arm)
  requirePhysicalLeaseMatchesLogicalArm(input.physicalLease, arm)
  const replay = parseGvisorTtlPhysicalArmReplayRecord(serializeGvisorTtlPhysicalArmReplayRecord(input.armReplay), input.physicalLease)
  requirePhysicalTerminalMatchesReplay({ physicalLease: input.physicalLease, replay, terminal: input.physicalTerminal })

  const physicalTerminal = input.physicalTerminal
  const base = Object.freeze({
    version: KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
    armOperationIdentity: arm.armOperationIdentity,
    leaseIdentity: arm.leaseIdentity,
    armRecordIdentity: arm.recordIdentity,
    runtimeInstanceIdentity: arm.runtimeInstanceIdentity,
    terminalOutcome: physicalTerminal.terminalOutcome,
    ownerInstanceIdentity: arm.ownerInstanceIdentity,
    terminalFenceToken: arm.terminalFenceToken,
    claimRecordIdentity: arm.claimRecordIdentity,
    controlPeerBindingIdentity: arm.controlPeerBindingIdentity,
    socketDevice: arm.controlPeer.socketDevice,
    socketInode: arm.controlPeer.socketInode,
    peerPid: arm.controlPeer.peerPid,
    peerUid: arm.controlPeer.peerUid,
    peerGid: arm.controlPeer.peerGid,
    retainedPidfdProcessIdentity: physicalTerminal.retainedPidfdProcessIdentity,
    runscArtifactIdentity: arm.runscArtifactIdentity,
    verifiedRunscSha256: arm.verifiedRunscSha256,
    retainedRunscExecutableIdentity: physicalTerminal.retainedRunscExecutableIdentity,
    clockDomainIdentity: arm.clockDomainIdentity,
    linuxBootId: arm.linuxBootId,
    exitEventObservedBoottimeNs: physicalTerminal.exitEventObservedBoottimeNs,
    liveAtExpiryProbeIdentity: physicalTerminal.liveAtExpiryProbeIdentity,
    liveAtExpiryObservedBoottimeNs: physicalTerminal.liveAtExpiryObservedBoottimeNs,
    liveAtExpiryProcessSetIdentity: physicalTerminal.liveAtExpiryProcessSetIdentity,
    signalAcknowledgementIdentity: physicalTerminal.signalAcknowledgementIdentity,
    terminationAcknowledgementIdentity: physicalTerminal.terminationAcknowledgementIdentity,
  })
  const logicalPhysicalControlPeer = createGvisorTtlWatchdogProtocolIdentity("CONTROL_PEER", [
    arm.runtimeInstanceIdentity,
    arm.containerId,
    arm.controlPeer.socketDevice,
    arm.controlPeer.socketInode,
    String(arm.controlPeer.peerPid),
    arm.controlPeer.peerUid,
    arm.controlPeer.peerGid,
    arm.controlPeer.processStartTicks,
    arm.controlPeer.executableDevice,
    arm.controlPeer.executableInode,
    arm.controlPeer.executableSize,
    arm.verifiedRunscSha256,
  ])
  const registryTerminalRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    base.armOperationIdentity,
    base.leaseIdentity,
    base.runtimeInstanceIdentity,
    base.terminalOutcome,
    base.ownerInstanceIdentity,
    base.terminalFenceToken,
    base.claimRecordIdentity,
    logicalPhysicalControlPeer,
    base.retainedPidfdProcessIdentity,
    base.runscArtifactIdentity,
    base.verifiedRunscSha256,
    base.retainedRunscExecutableIdentity,
    base.clockDomainIdentity,
    base.linuxBootId,
    watchdogNullable(base.exitEventObservedBoottimeNs),
    watchdogNullable(base.liveAtExpiryObservedBoottimeNs),
    watchdogNullable(base.liveAtExpiryProbeIdentity),
    watchdogNullable(base.liveAtExpiryProcessSetIdentity),
    watchdogNullable(base.signalAcknowledgementIdentity),
    base.terminationAcknowledgementIdentity,
  ])
  const withRegistry = Object.freeze({ ...base, registryTerminalRecordIdentity })
  return validateGvisorTtlTerminalRecord(Object.freeze({ ...withRegistry, recordIdentity: logicalHash("TERMINAL_RECORD", withRegistry) }), arm)
}