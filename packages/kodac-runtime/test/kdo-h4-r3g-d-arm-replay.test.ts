import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"

import { createGvisorTtlWatchdogProtocolIdentity } from "../src/execution/gateway-gvisor-ttl.ts"
import {
  KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION,
  parseGvisorTtlPhysicalArmReplayRecord,
  recoverGvisorTtlLogicalArmRecord,
  serializeGvisorTtlPhysicalArmReplayRecord,
  type GvisorTtlPhysicalArmReplayRecord,
} from "../src/execution/gateway-gvisor-ttl-arm-replay.ts"
import {
  parseGvisorTtlPhysicalLeaseRecord,
  parseGvisorTtlPhysicalOwnerClaimRecord,
} from "../src/execution/gateway-gvisor-ttl-registry.ts"
import {
  KDO_H4_R3G_D_PREPARED_VERSION,
  validateGvisorTtlArmRecord,
  type GvisorTtlPreparedIntent,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"

const ID = Object.freeze({
  execution: "1".repeat(64),
  requirement: "2".repeat(64),
  workload: "3".repeat(64),
  binding: "4".repeat(64),
  container: "5".repeat(64),
  runtime: "6".repeat(64),
  watchdog: "7".repeat(64),
  owner: "8".repeat(64),
  runscArtifact: "9".repeat(64),
  runscSha: "a".repeat(64),
})
const BOOT = "123e4567-e89b-42d3-a456-426614174000"
const START = "1000000000"
const OWNER_UPDATED = "1000000001"
const TTL_MS = 1000
const DEADLINE = "2000000000"
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
  const base = Object.freeze({
    version: KDO_H4_R3G_D_PREPARED_VERSION,
    state: "PREPARED" as const,
    armOperationIdentity,
    ...armPayload,
    canonicalArmPayloadDigest,
  })
  return Object.freeze({ ...base, intentIdentity: logicalHash("PREPARED_INTENT", base) })
}

function physicalFixture() {
  const prepared = preparedFixture()
  const leaseIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE", [prepared.armOperationIdentity, prepared.canonicalArmPayloadDigest, prepared.runtimeInstanceIdentity, BOOT, START, DEADLINE, prepared.watchdogImplementationIdentity])
  const claimRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("OWNER_CLAIM", ["kodac-h4-r3g-d-owner-claim-v1", leaseIdentity, prepared.armOperationIdentity, ID.owner, FENCE, "ACTIVE", OWNER_UPDATED, BOOT])
  const claimText = [
    "version=kodac-h4-r3g-d-owner-claim-v1",
    `leaseIdentity=${leaseIdentity}`,
    `armOperationIdentity=${prepared.armOperationIdentity}`,
    `ownerInstanceIdentity=${ID.owner}`,
    `terminalFenceToken=${FENCE}`,
    "ownerState=ACTIVE",
    `updatedBoottimeNs=${OWNER_UPDATED}`,
    `linuxBootId=${BOOT}`,
    `claimRecordIdentity=${claimRecordIdentity}`,
    "",
  ].join("\n")
  const claim = parseGvisorTtlPhysicalOwnerClaimRecord(claimText)
  const clockDomainIdentity = createGvisorTtlWatchdogProtocolIdentity("CLOCK_DOMAIN", [BOOT, "CLOCK_BOOTTIME"])
  const registryRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("LEASE_REGISTRY", [
    "kodac-h4-r3g-d-watchdog-lease-v1",
    prepared.armOperationIdentity,
    prepared.canonicalArmPayloadDigest,
    leaseIdentity,
    prepared.executionAttemptIdentity,
    prepared.requirementIdentity,
    prepared.workloadIdentity,
    prepared.containerBindingIdentity,
    prepared.containerId,
    prepared.runtimeInstanceIdentity,
    String(prepared.ttlMs),
    BOOT,
    clockDomainIdentity,
    START,
    DEADLINE,
    prepared.watchdogImplementationIdentity,
    ID.owner,
    FENCE,
    claimRecordIdentity,
  ])
  const leaseText = [
    "version=kodac-h4-r3g-d-watchdog-lease-v1",
    `armOperationIdentity=${prepared.armOperationIdentity}`,
    `canonicalArmPayloadDigest=${prepared.canonicalArmPayloadDigest}`,
    `leaseIdentity=${leaseIdentity}`,
    `executionAttemptIdentity=${prepared.executionAttemptIdentity}`,
    `requirementIdentity=${prepared.requirementIdentity}`,
    `workloadIdentity=${prepared.workloadIdentity}`,
    `containerBindingIdentity=${prepared.containerBindingIdentity}`,
    `containerId=${prepared.containerId}`,
    `runtimeInstanceIdentity=${prepared.runtimeInstanceIdentity}`,
    `ttlMs=${prepared.ttlMs}`,
    `linuxBootId=${BOOT}`,
    `clockDomainIdentity=${clockDomainIdentity}`,
    `leaseStartBoottimeNs=${START}`,
    `deadlineBoottimeNs=${DEADLINE}`,
    `watchdogImplementationIdentity=${prepared.watchdogImplementationIdentity}`,
    "physicalArmState=ARMED",
    `ownerInstanceIdentity=${ID.owner}`,
    `terminalFenceToken=${FENCE}`,
    `claimRecordIdentity=${claimRecordIdentity}`,
    `registryRecordIdentity=${registryRecordIdentity}`,
    "",
  ].join("\n")
  const lease = parseGvisorTtlPhysicalLeaseRecord(leaseText, claim)
  const controlPeerBindingIdentity = createGvisorTtlWatchdogProtocolIdentity("CONTROL_PEER", [prepared.runtimeInstanceIdentity, prepared.containerId, SOCKET_DEV, SOCKET_INO, String(PEER_PID), PEER_UID, PEER_GID, START_TICKS, EXE_DEV, EXE_INO, EXE_SIZE, ID.runscSha])
  const retainedPidfdProcessIdentity = createGvisorTtlWatchdogProtocolIdentity("PIDFD_PROCESS", [String(PEER_PID), START_TICKS, EXE_DEV, EXE_INO, EXE_SIZE, prepared.runtimeInstanceIdentity])
  const retainedRunscExecutableIdentity = createGvisorTtlWatchdogProtocolIdentity("RUNSC_EXECUTABLE", [ID.runscSha, EXE_DEV, EXE_INO, EXE_SIZE, ID.runscArtifact])
  const physicalArmAcknowledgementIdentity = createGvisorTtlWatchdogProtocolIdentity("PHYSICAL_ARM_ACK", [lease.leaseIdentity, prepared.armOperationIdentity, prepared.runtimeInstanceIdentity, controlPeerBindingIdentity, ID.runscArtifact, ID.runscSha, lease.registryRecordIdentity, lease.clockDomainIdentity, BOOT, ID.owner, claimRecordIdentity])
  const base = Object.freeze({
    version: KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION,
    armOperationIdentity: prepared.armOperationIdentity,
    canonicalArmPayloadDigest: prepared.canonicalArmPayloadDigest,
    leaseIdentity: lease.leaseIdentity,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    controlPeerBindingIdentity,
    socketDevice: SOCKET_DEV,
    socketInode: SOCKET_INO,
    peerPid: PEER_PID,
    peerUid: PEER_UID,
    peerGid: PEER_GID,
    processStartTicks: START_TICKS,
    executableDevice: EXE_DEV,
    executableInode: EXE_INO,
    executableSize: EXE_SIZE,
    retainedPidfdProcessIdentity,
    runscArtifactIdentity: ID.runscArtifact,
    verifiedRunscSha256: ID.runscSha,
    retainedRunscExecutableIdentity,
    watchdogRegistryRecordIdentity: lease.registryRecordIdentity,
    clockDomainIdentity: lease.clockDomainIdentity,
    linuxBootId: BOOT,
    leaseStartBoottimeNs: START,
    deadlineBoottimeNs: DEADLINE,
    ownerInstanceIdentity: ID.owner,
    terminalFenceToken: FENCE,
    claimRecordIdentity,
    physicalArmAcknowledgementIdentity,
  })
  const armRegistryRecordIdentity = createGvisorTtlWatchdogProtocolIdentity("ARM_REGISTRY", [
    base.version,
    base.armOperationIdentity,
    base.canonicalArmPayloadDigest,
    base.leaseIdentity,
    base.runtimeInstanceIdentity,
    base.controlPeerBindingIdentity,
    base.socketDevice,
    base.socketInode,
    String(base.peerPid),
    base.peerUid,
    base.peerGid,
    base.processStartTicks,
    base.executableDevice,
    base.executableInode,
    base.executableSize,
    base.retainedPidfdProcessIdentity,
    base.runscArtifactIdentity,
    base.verifiedRunscSha256,
    base.retainedRunscExecutableIdentity,
    base.watchdogRegistryRecordIdentity,
    base.clockDomainIdentity,
    base.linuxBootId,
    base.leaseStartBoottimeNs,
    base.deadlineBoottimeNs,
    base.ownerInstanceIdentity,
    base.terminalFenceToken,
    base.claimRecordIdentity,
    base.physicalArmAcknowledgementIdentity,
  ])
  const replay: GvisorTtlPhysicalArmReplayRecord = Object.freeze({ ...base, armRegistryRecordIdentity })
  return { prepared, lease, replay }
}

test("H4-R3G-D physical arm replay rederives native peer pidfd runsc ACK and registry identities", () => {
  const { lease, replay } = physicalFixture()
  const parsed = parseGvisorTtlPhysicalArmReplayRecord(serializeGvisorTtlPhysicalArmReplayRecord(replay), lease)
  assert.deepEqual(parsed, replay)
})

test("H4-R3G-D physical arm replay rejects recomputed outer identity when an inner physical identity is forged", () => {
  const { lease, replay } = physicalFixture()
  const forgedPeer = { ...replay, controlPeerBindingIdentity: "0".repeat(64) }
  const outer = createGvisorTtlWatchdogProtocolIdentity("ARM_REGISTRY", [
    forgedPeer.version, forgedPeer.armOperationIdentity, forgedPeer.canonicalArmPayloadDigest, forgedPeer.leaseIdentity, forgedPeer.runtimeInstanceIdentity, forgedPeer.controlPeerBindingIdentity,
    forgedPeer.socketDevice, forgedPeer.socketInode, String(forgedPeer.peerPid), forgedPeer.peerUid, forgedPeer.peerGid, forgedPeer.processStartTicks, forgedPeer.executableDevice, forgedPeer.executableInode,
    forgedPeer.executableSize, forgedPeer.retainedPidfdProcessIdentity, forgedPeer.runscArtifactIdentity, forgedPeer.verifiedRunscSha256, forgedPeer.retainedRunscExecutableIdentity,
    forgedPeer.watchdogRegistryRecordIdentity, forgedPeer.clockDomainIdentity, forgedPeer.linuxBootId, forgedPeer.leaseStartBoottimeNs, forgedPeer.deadlineBoottimeNs, forgedPeer.ownerInstanceIdentity,
    forgedPeer.terminalFenceToken, forgedPeer.claimRecordIdentity, forgedPeer.physicalArmAcknowledgementIdentity,
  ])
  assert.throws(() => parseGvisorTtlPhysicalArmReplayRecord(serializeGvisorTtlPhysicalArmReplayRecord({ ...forgedPeer, armRegistryRecordIdentity: outer }), lease), /control-peer identity mismatch/)
})

test("H4-R3G-D physical arm replay rejects forged physical ACK and arm registry identities", () => {
  const { lease, replay } = physicalFixture()
  assert.throws(() => parseGvisorTtlPhysicalArmReplayRecord(serializeGvisorTtlPhysicalArmReplayRecord({ ...replay, physicalArmAcknowledgementIdentity: "0".repeat(64) }), lease), /acknowledgement identity mismatch/)
  assert.throws(() => parseGvisorTtlPhysicalArmReplayRecord(serializeGvisorTtlPhysicalArmReplayRecord({ ...replay, armRegistryRecordIdentity: "0".repeat(64) }), lease), /registry identity mismatch/)
})

test("H4-R3G-D recovery reconstructs a standalone-valid logical arm without conflating physical and logical lease hashes", () => {
  const { prepared, lease, replay } = physicalFixture()
  const recovered = recoverGvisorTtlLogicalArmRecord({ prepared, physicalLease: lease, replay })
  assert.deepEqual(validateGvisorTtlArmRecord(recovered), recovered)
  assert.notEqual(recovered.leaseIdentity, lease.leaseIdentity, "physical watchdog lease hash must remain distinct from logical K2 lease identity")
  assert.equal(recovered.armOperationIdentity, prepared.armOperationIdentity)
  assert.equal(recovered.deadlineBoottimeNs, lease.deadlineBoottimeNs)
  assert.equal(recovered.ownerInstanceIdentity, replay.ownerInstanceIdentity)
  assert.equal(recovered.controlPeer.socketDevice, SOCKET_DEV)
  assert.equal(recovered.controlPeer.peerPid, PEER_PID)
})

test("H4-R3G-D recovery rejects PREPARED substitution even when physical replay remains internally valid", () => {
  const { prepared, lease, replay } = physicalFixture()
  const substituted = { ...prepared, executionAttemptIdentity: "0".repeat(64) }
  assert.throws(() => recoverGvisorTtlLogicalArmRecord({ prepared: substituted as GvisorTtlPreparedIntent, physicalLease: lease, replay }), /prepared arm identity mismatch/)
})
