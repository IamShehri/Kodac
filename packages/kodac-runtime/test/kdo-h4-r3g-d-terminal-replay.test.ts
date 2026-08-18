import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"

import {
  KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION,
  recoverGvisorTtlLogicalArmRecord,
  type GvisorTtlPhysicalArmReplayRecord,
} from "../src/execution/gateway-gvisor-ttl-arm-replay.ts"
import { createGvisorTtlWatchdogProtocolIdentity } from "../src/execution/gateway-gvisor-ttl.ts"
import {
  parseGvisorTtlPhysicalLeaseRecord,
  parseGvisorTtlPhysicalOwnerClaimRecord,
  parseGvisorTtlPhysicalTerminalRecord,
} from "../src/execution/gateway-gvisor-ttl-registry.ts"
import { recoverGvisorTtlLogicalTerminalRecord } from "../src/execution/gateway-gvisor-ttl-terminal-replay.ts"
import {
  KDO_H4_R3G_D_PREPARED_VERSION,
  validateGvisorTtlTerminalRecord,
  type GvisorTtlPreparedIntent,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"

const ID = Object.freeze({
  execution: "1".repeat(64), requirement: "2".repeat(64), workload: "3".repeat(64), binding: "4".repeat(64), container: "5".repeat(64), runtime: "6".repeat(64), watchdog: "7".repeat(64), owner: "8".repeat(64), runscArtifact: "9".repeat(64), runscSha: "a".repeat(64), liveProbe: "b".repeat(64), processSet: "c".repeat(64), signal: "d".repeat(64), termination: "e".repeat(64),
})
const BOOT = "123e4567-e89b-42d3-a456-426614174000"
const START = "1000000000"
const DEADLINE = "2000000000"
const TTL_MS = 1000
const SOCKET_DEV = "41"
const SOCKET_INO = "42"
const PEER_PID = 4242
const PEER_UID = "1000"
const PEER_GID = "1000"
const START_TICKS = "123456789"
const EXE_DEV = "2049"
const EXE_INO = "987654321"
const EXE_SIZE = "12345678"
const FENCE = "1"

function logicalHash(domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-D\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function preparedFixture(): GvisorTtlPreparedIntent {
  const armPayload = Object.freeze({
    executionAttemptIdentity: ID.execution,
    requirementIdentity: ID.requirement,
    workloadIdentity: ID.workload,
    containerBindingIdentity: ID.binding,
    containerId: ID.container,
    runtimeInstanceIdentity: ID.runtime,
    ttlMs: TTL_MS,
    watchdogImplementationIdentity: ID.watchdog,
  })
  const canonicalArmPayloadDigest = logicalHash("ARM_PAYLOAD", armPayload)
  const armOperationIdentity = logicalHash("ARM_OPERATION", armPayload)
  const base = Object.freeze({ version: KDO_H4_R3G_D_PREPARED_VERSION, state: "PREPARED" as const, armOperationIdentity, ...armPayload, canonicalArmPayloadDigest })
  return Object.freeze({ ...base, intentIdentity: logicalHash("PREPARED_INTENT", base) })
}

function fixtures() {
  const prepared = preparedFixture()
  const claimRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("OWNER_CLAIM", [prepared.armOperationIdentity, ID.owner, FENCE, BOOT])
  const claim = parseGvisorTtlPhysicalOwnerClaimRecord([
    "version=kodac-h4-r3g-d-owner-claim-v1", `armOperationIdentity=${prepared.armOperationIdentity}`, `ownerInstanceIdentity=${ID.owner}`, `terminalFenceToken=${FENCE}`, `linuxBootId=${BOOT}`, `claimRecordIdentity=${claimRecordIdentity}`, "",
  ].join("\n"))
  const clock = createGvisorTtlWatchdogProtocolIdentity("CLOCK_DOMAIN", [BOOT, "CLOCK_BOOTTIME"])
  const physicalLeaseIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE", [prepared.armOperationIdentity, prepared.canonicalArmPayloadDigest, prepared.runtimeInstanceIdentity, BOOT, START, DEADLINE, prepared.watchdogImplementationIdentity])
  const physicalRegistryIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE_REGISTRY", [
    "kodac-h4-r3g-d-watchdog-lease-v1", prepared.armOperationIdentity, prepared.canonicalArmPayloadDigest, physicalLeaseIdentity, prepared.executionAttemptIdentity, prepared.requirementIdentity, prepared.workloadIdentity, prepared.containerBindingIdentity, prepared.containerId, prepared.runtimeInstanceIdentity, String(TTL_MS), BOOT, clock, START, DEADLINE, prepared.watchdogImplementationIdentity, ID.owner, FENCE, claimRecordIdentity,
  ])
  const lease = parseGvisorTtlPhysicalLeaseRecord([
    "version=kodac-h4-r3g-d-watchdog-lease-v1", `armOperationIdentity=${prepared.armOperationIdentity}`, `canonicalArmPayloadDigest=${prepared.canonicalArmPayloadDigest}`, `leaseIdentity=${physicalLeaseIdentity}`, `executionAttemptIdentity=${prepared.executionAttemptIdentity}`, `requirementIdentity=${prepared.requirementIdentity}`, `workloadIdentity=${prepared.workloadIdentity}`, `containerBindingIdentity=${prepared.containerBindingIdentity}`, `containerId=${prepared.containerId}`, `runtimeInstanceIdentity=${prepared.runtimeInstanceIdentity}`, `ttlMs=${TTL_MS}`, `linuxBootId=${BOOT}`, `clockDomainIdentity=${clock}`, `leaseStartBoottimeNs=${START}`, `deadlineBoottimeNs=${DEADLINE}`, `watchdogImplementationIdentity=${prepared.watchdogImplementationIdentity}`, "physicalArmState=ARMED", `ownerInstanceIdentity=${ID.owner}`, `terminalFenceToken=${FENCE}`, `claimRecordIdentity=${claimRecordIdentity}`, `registryRecordIdentity=${physicalRegistryIdentity}`, "",
  ].join("\n"), claim)
  const physicalPeer = createGvisorTtlWatchdogProtocolIdentity("CONTROL_PEER", [prepared.runtimeInstanceIdentity, prepared.containerId, SOCKET_DEV, SOCKET_INO, String(PEER_PID), PEER_UID, PEER_GID, START_TICKS, EXE_DEV, EXE_INO, EXE_SIZE, ID.runscSha])
  const pidfd = createGvisorTtlWatchdogProtocolIdentity("PIDFD_PROCESS", [String(PEER_PID), START_TICKS, EXE_DEV, EXE_INO, EXE_SIZE, prepared.runtimeInstanceIdentity])
  const retainedRunsc = createGvisorTtlWatchdogProtocolIdentity("RUNSC_EXECUTABLE", [ID.runscSha, EXE_DEV, EXE_INO, EXE_SIZE, ID.runscArtifact])
  const physicalAck = createGvisorTtlWatchdogProtocolIdentity("PHYSICAL_ARM_ACK", [physicalLeaseIdentity, prepared.armOperationIdentity, prepared.runtimeInstanceIdentity, physicalPeer, ID.runscArtifact, ID.runscSha, physicalRegistryIdentity, clock, BOOT, ID.owner, claimRecordIdentity])
  const replayBase = Object.freeze({
    version: KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION,
    armOperationIdentity: prepared.armOperationIdentity,
    canonicalArmPayloadDigest: prepared.canonicalArmPayloadDigest,
    leaseIdentity: physicalLeaseIdentity,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    controlPeerBindingIdentity: physicalPeer,
    socketDevice: SOCKET_DEV,
    socketInode: SOCKET_INO,
    peerPid: PEER_PID,
    peerUid: PEER_UID,
    peerGid: PEER_GID,
    processStartTicks: START_TICKS,
    executableDevice: EXE_DEV,
    executableInode: EXE_INO,
    executableSize: EXE_SIZE,
    retainedPidfdProcessIdentity: pidfd,
    runscArtifactIdentity: ID.runscArtifact,
    verifiedRunscSha256: ID.runscSha,
    retainedRunscExecutableIdentity: retainedRunsc,
    watchdogRegistryRecordIdentity: physicalRegistryIdentity,
    clockDomainIdentity: clock,
    linuxBootId: BOOT,
    leaseStartBoottimeNs: START,
    deadlineBoottimeNs: DEADLINE,
    ownerInstanceIdentity: ID.owner,
    terminalFenceToken: FENCE,
    claimRecordIdentity,
    physicalArmAcknowledgementIdentity: physicalAck,
  })
  const armRegistryRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("ARM_REGISTRY", [
    replayBase.version, replayBase.armOperationIdentity, replayBase.canonicalArmPayloadDigest, replayBase.leaseIdentity, replayBase.runtimeInstanceIdentity, replayBase.controlPeerBindingIdentity, replayBase.socketDevice, replayBase.socketInode, String(replayBase.peerPid), replayBase.peerUid, replayBase.peerGid, replayBase.processStartTicks, replayBase.executableDevice, replayBase.executableInode, replayBase.executableSize, replayBase.retainedPidfdProcessIdentity, replayBase.runscArtifactIdentity, replayBase.verifiedRunscSha256, replayBase.retainedRunscExecutableIdentity, replayBase.watchdogRegistryRecordIdentity, replayBase.clockDomainIdentity, replayBase.linuxBootId, replayBase.leaseStartBoottimeNs, replayBase.deadlineBoottimeNs, replayBase.ownerInstanceIdentity, replayBase.terminalFenceToken, replayBase.claimRecordIdentity, replayBase.physicalArmAcknowledgementIdentity,
  ])
  const replay: GvisorTtlPhysicalArmReplayRecord = Object.freeze({ ...replayBase, armRegistryRecordIdentity })
  const arm = recoverGvisorTtlLogicalArmRecord({ prepared, physicalLease: lease, replay })
  const physicalTerminalIdentity = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    prepared.armOperationIdentity, physicalLeaseIdentity, prepared.runtimeInstanceIdentity, "ttl-expired", ID.owner, FENCE, claimRecordIdentity, physicalPeer, pidfd, ID.runscArtifact, ID.runscSha, retainedRunsc, clock, BOOT, "-", DEADLINE, ID.liveProbe, ID.processSet, ID.signal, ID.termination,
  ])
  const physicalTerminal = parseGvisorTtlPhysicalTerminalRecord([
    "version=kodac-h4-r3g-d-terminal-registry-v1", `armOperationIdentity=${prepared.armOperationIdentity}`, `leaseIdentity=${physicalLeaseIdentity}`, `runtimeInstanceIdentity=${prepared.runtimeInstanceIdentity}`, "terminalOutcome=ttl-expired", `ownerInstanceIdentity=${ID.owner}`, `terminalFenceToken=${FENCE}`, `claimRecordIdentity=${claimRecordIdentity}`, `controlPeerBindingIdentity=${physicalPeer}`, `retainedPidfdProcessIdentity=${pidfd}`, `runscArtifactIdentity=${ID.runscArtifact}`, `verifiedRunscSha256=${ID.runscSha}`, `retainedRunscExecutableIdentity=${retainedRunsc}`, `clockDomainIdentity=${clock}`, `linuxBootId=${BOOT}`, "exitEventObservedBoottimeNs=-", `liveAtExpiryObservedBoottimeNs=${DEADLINE}`, `liveAtExpiryProbeIdentity=${ID.liveProbe}`, `liveAtExpiryProcessSetIdentity=${ID.processSet}`, `signalAcknowledgementIdentity=${ID.signal}`, `terminationAcknowledgementIdentity=${ID.termination}`, `registryTerminalRecordIdentity=${physicalTerminalIdentity}`, "",
  ].join("\n"), lease)
  return { prepared, lease, replay, arm, physicalTerminal }
}

test("H4-R3G-D physical terminal recovers into a standalone-valid logical terminal without hash conflation", () => {
  const { lease, replay, arm, physicalTerminal } = fixtures()
  const terminal = recoverGvisorTtlLogicalTerminalRecord({ arm, physicalLease: lease, armReplay: replay, physicalTerminal })
  assert.deepEqual(validateGvisorTtlTerminalRecord(terminal, arm), terminal)
  assert.equal(terminal.terminalOutcome, "ttl-expired")
  assert.equal(terminal.deadlineBoottimeNs, undefined)
  assert.notEqual(terminal.leaseIdentity, physicalTerminal.leaseIdentity, "logical terminal must bind the logical K2 lease identity")
  assert.notEqual(terminal.registryTerminalRecordIdentity, physicalTerminal.registryTerminalRecordIdentity, "physical registry identity must be verified then independently logicalized")
  assert.equal(terminal.liveAtExpiryObservedBoottimeNs, DEADLINE)
})

test("H4-R3G-D terminal recovery rejects a different physical owner generation", () => {
  const { lease, replay, arm, physicalTerminal } = fixtures()
  const forged = { ...physicalTerminal, terminalFenceToken: "2" }
  assert.throws(() => recoverGvisorTtlLogicalTerminalRecord({ arm, physicalLease: lease, armReplay: replay, physicalTerminal: forged }), /does not match durable physical arm replay generation|does not match recovered logical arm semantics/)
})

test("H4-R3G-D terminal recovery rejects physical peer substitution even when terminal shape is otherwise valid", () => {
  const { lease, replay, arm, physicalTerminal } = fixtures()
  const forged = { ...physicalTerminal, controlPeerBindingIdentity: "0".repeat(64) }
  assert.throws(() => recoverGvisorTtlLogicalTerminalRecord({ arm, physicalLease: lease, armReplay: replay, physicalTerminal: forged }), /does not match durable physical arm replay generation/)
})