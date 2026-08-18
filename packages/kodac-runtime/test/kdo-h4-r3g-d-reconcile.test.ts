import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"

import { createGvisorTtlWatchdogProtocolIdentity } from "../src/execution/gateway-gvisor-ttl.ts"
import {
  KDO_H4_R3G_D_PHYSICAL_ARM_REGISTRY_VERSION,
  recoverGvisorTtlLogicalArmRecord,
  type GvisorTtlPhysicalArmReplayRecord,
} from "../src/execution/gateway-gvisor-ttl-arm-replay.ts"
import {
  parseGvisorTtlPhysicalLeaseRecord,
  parseGvisorTtlPhysicalOwnerClaimRecord,
  parseGvisorTtlPhysicalTerminalRecord,
} from "../src/execution/gateway-gvisor-ttl-registry.ts"
import type { GvisorTtlPhysicalRecoverySnapshot } from "../src/execution/gateway-gvisor-ttl-recovery-registry.ts"
import { reconcileGvisorTtlRecoveryState } from "../src/execution/gateway-gvisor-ttl-reconcile.ts"
import { recoverGvisorTtlLogicalTerminalRecord } from "../src/execution/gateway-gvisor-ttl-terminal-replay.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
  createSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  KDO_H4_R3G_D_PREPARED_VERSION,
  type GvisorTtlPreparedIntent,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"
import { createGvisorTtlK2RecoverySnapshot } from "../src/trust/sandbox-lifecycle-gvisor-ttl-recovery.ts"

const ID = Object.freeze({
  execution: "1".repeat(64), binding: "4".repeat(64), container: "5".repeat(64), runtime: "6".repeat(64), watchdog: "7".repeat(64), owner: "8".repeat(64), runscArtifact: "9".repeat(64), runscSha: "a".repeat(64), liveProbe: "b".repeat(64), processSet: "c".repeat(64), signal: "d".repeat(64), termination: "e".repeat(64),
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

function requirementFixture(): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: "1".repeat(64),
    executionIntentIdentity: "2".repeat(64),
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3g-d-reconcile", digest: `sha256:${"3".repeat(64)}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 268_435_456, ttlMs: TTL_MS, maxOutputBytes: 1_048_576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function preparedFixture(requirement: SandboxExecutionRequirement): GvisorTtlPreparedIntent {
  const armPayload = Object.freeze({
    executionAttemptIdentity: ID.execution,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
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

function fixture() {
  const requirement = requirementFixture()
  const prepared = preparedFixture(requirement)
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
  const armReplay: GvisorTtlPhysicalArmReplayRecord = Object.freeze({ ...replayBase, armRegistryRecordIdentity })
  const arm = recoverGvisorTtlLogicalArmRecord({ prepared, physicalLease: lease, replay: armReplay })
  const physicalTerminalIdentity = createGvisorTtlWatchdogProtocolIdentity("TERMINAL_REGISTRY", [
    prepared.armOperationIdentity, physicalLeaseIdentity, prepared.runtimeInstanceIdentity, "ttl-expired", ID.owner, FENCE, claimRecordIdentity, physicalPeer, pidfd, ID.runscArtifact, ID.runscSha, retainedRunsc, clock, BOOT, "-", DEADLINE, ID.liveProbe, ID.processSet, ID.signal, ID.termination,
  ])
  const terminal = parseGvisorTtlPhysicalTerminalRecord([
    "version=kodac-h4-r3g-d-terminal-registry-v1", `armOperationIdentity=${prepared.armOperationIdentity}`, `leaseIdentity=${physicalLeaseIdentity}`, `runtimeInstanceIdentity=${prepared.runtimeInstanceIdentity}`, "terminalOutcome=ttl-expired", `ownerInstanceIdentity=${ID.owner}`, `terminalFenceToken=${FENCE}`, `claimRecordIdentity=${claimRecordIdentity}`, `controlPeerBindingIdentity=${physicalPeer}`, `retainedPidfdProcessIdentity=${pidfd}`, `runscArtifactIdentity=${ID.runscArtifact}`, `verifiedRunscSha256=${ID.runscSha}`, `retainedRunscExecutableIdentity=${retainedRunsc}`, `clockDomainIdentity=${clock}`, `linuxBootId=${BOOT}`, "exitEventObservedBoottimeNs=-", `liveAtExpiryObservedBoottimeNs=${DEADLINE}`, `liveAtExpiryProbeIdentity=${ID.liveProbe}`, `liveAtExpiryProcessSetIdentity=${ID.processSet}`, `signalAcknowledgementIdentity=${ID.signal}`, `terminationAcknowledgementIdentity=${ID.termination}`, `registryTerminalRecordIdentity=${physicalTerminalIdentity}`, "",
  ].join("\n"), lease)
  const logicalTerminal = recoverGvisorTtlLogicalTerminalRecord({ arm, physicalLease: lease, armReplay, physicalTerminal: terminal })
  const physical: GvisorTtlPhysicalRecoverySnapshot = Object.freeze({ armOperationIdentity: prepared.armOperationIdentity, clockContinuity: "SAME_BOOT", claim, lease, terminal, armReplay })
  const k2Prepared = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm: null, terminal: null })
  const k2Arm = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm, terminal: null })
  const k2Terminal = createGvisorTtlK2RecoverySnapshot({ requirement, prepared, arm, terminal: logicalTerminal })
  return { physical, k2Prepared, k2Arm, k2Terminal, arm, logicalTerminal }
}

test("H4-R3G-D recovery matrix retries only PREPARED state with no physical obligation", () => {
  const { k2Prepared } = fixture()
  const decisions = reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Prepared], physicalSnapshots: [] })
  assert.equal(decisions.length, 1)
  assert.equal(decisions[0].kind, "RETRY_PREPARED")
})

test("H4-R3G-D recovery matrix reconciles or confirms arm state deterministically", () => {
  const { physical, k2Prepared, k2Arm, arm } = fixture()
  const armOnly = Object.freeze({ ...physical, terminal: null })
  const missing = reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Prepared], physicalSnapshots: [armOnly] })
  assert.equal(missing[0].kind, "RECONCILE_ARM")
  if (missing[0].kind === "RECONCILE_ARM") assert.equal(missing[0].recoveredArm.recordIdentity, arm.recordIdentity)
  const current = reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Arm], physicalSnapshots: [armOnly] })
  assert.equal(current[0].kind, "ARM_CURRENT")
})

test("H4-R3G-D recovery matrix preserves arm-before-terminal reconciliation order", () => {
  const { physical, k2Prepared, k2Arm, k2Terminal, arm, logicalTerminal } = fixture()
  const both = reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Prepared], physicalSnapshots: [physical] })
  assert.equal(both[0].kind, "RECONCILE_ARM_AND_TERMINAL")
  if (both[0].kind === "RECONCILE_ARM_AND_TERMINAL") {
    assert.equal(both[0].recoveredArm.recordIdentity, arm.recordIdentity)
    assert.equal(both[0].recoveredTerminal.recordIdentity, logicalTerminal.recordIdentity)
  }
  const terminal = reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Arm], physicalSnapshots: [physical] })
  assert.equal(terminal[0].kind, "RECONCILE_TERMINAL")
  const current = reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Terminal], physicalSnapshots: [physical] })
  assert.equal(current[0].kind, "TERMINAL_CURRENT")
})

test("H4-R3G-D recovery matrix rejects orphan physical state and committed K2 state without physical truth", () => {
  const { physical, k2Arm } = fixture()
  assert.throws(() => reconcileGvisorTtlRecoveryState({ k2Snapshots: [], physicalSnapshots: [physical] }), /orphan physical recovery state/)
  assert.throws(() => reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Arm], physicalSnapshots: [] }), /missing authoritative physical recovery state/)
})

test("H4-R3G-D recovery matrix rejects old-boot continuity and never invents a fresh TTL window", () => {
  const { physical, k2Prepared } = fixture()
  const oldBoot = Object.freeze({ ...physical, clockContinuity: "UNRECOVERABLE_CLOCK_DOMAIN" as const })
  assert.throws(() => reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Prepared], physicalSnapshots: [oldBoot] }), /UNRECOVERABLE_CLOCK_DOMAIN; a fresh TTL window is forbidden/)
})

test("H4-R3G-D recovery matrix rejects a durable physical lease without positive arm replay", () => {
  const { physical, k2Prepared } = fixture()
  const leaseOnly = Object.freeze({ ...physical, terminal: null, armReplay: null })
  assert.throws(() => reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Prepared], physicalSnapshots: [leaseOnly] }), /exists without durable positive arm replay/)
})

test("H4-R3G-D recovery matrix rejects duplicate K2 and physical operation identities", () => {
  const { physical, k2Prepared } = fixture()
  assert.throws(() => reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Prepared, k2Prepared], physicalSnapshots: [physical] }), /duplicate K2 recovery snapshot/)
  assert.throws(() => reconcileGvisorTtlRecoveryState({ k2Snapshots: [k2Prepared], physicalSnapshots: [physical, physical] }), /duplicate physical recovery snapshot/)
})