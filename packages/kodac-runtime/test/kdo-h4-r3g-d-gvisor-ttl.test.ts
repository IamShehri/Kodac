import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
  createSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3G_D_ARM_ACK_VERSION,
  KDO_H4_R3G_D_ARM_EVIDENCE_CLASS,
  KDO_H4_R3G_D_ARM_RECORD_VERSION,
  KDO_H4_R3G_D_CAPABILITY,
  KDO_H4_R3G_D_CLOCK_NAME,
  KDO_H4_R3G_D_COMMIT_VERSION,
  KDO_H4_R3G_D_CONTROL_PEER_VERSION,
  KDO_H4_R3G_D_GVISOR_SOURCE_COMMIT,
  KDO_H4_R3G_D_PREPARED_VERSION,
  KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_D_SUBJECT_VERSION,
  KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
  KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
  KDO_H4_R3G_D_WATCHDOG_LEASE_VERSION,
  KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION,
  createGvisorTtlArmRecord,
  createGvisorTtlControlPeerBinding,
  createGvisorTtlEvidenceCommit,
  createGvisorTtlPreparedIntent,
  createGvisorTtlSubjectBinding,
  createGvisorTtlWatchdogImplementationIdentity,
  createGvisorTtlWatchdogLeaseRecord,
  payloadDigest,
  validateGvisorTtlArmAcknowledgement,
  validateGvisorTtlArmRecord,
  validateGvisorTtlControlPeerBinding,
  validateGvisorTtlEvidenceCommit,
  validateGvisorTtlPreparedIntent,
  validateGvisorTtlRuntimeConfig,
  validateGvisorTtlSubjectBinding,
  validateGvisorTtlTerminalRecord,
  validateGvisorTtlWatchdogLeaseRecord,
  type GvisorTtlArmAcknowledgement,
  type GvisorTtlTerminalRecord,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"
import {
  createGvisorContainerBinding,
  createGvisorExecutionAttemptIdentity,
  createGvisorObserverArtifact,
  createGvisorRuntimeLineageRecord,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  createGvisorObserverPlan,
  createGvisorRuntimeObservationCandidate,
  parseGvisorProcessObservation,
  parseGvisorStateOutput,
  parseGvisorStatsOutput,
} from "../src/trust/sandbox-observer-gvisor.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"

const CONTAINER_ID = "1".repeat(64)
const RUNSC_SHA = "c".repeat(64)
const HELPER_SHA = "d".repeat(64)
const WATCHDOG_SHA = "e".repeat(64)
const BOOT_ID = "123e4567-e89b-42d3-a456-426614174000"
const LEASE_START_NS = "100000000000"
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)

function hash(prefix: string, domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`${prefix}\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}
function r3gdHash(domain: string, value: unknown): string { return hash("KODAC-H4-R3G-D", domain, value) }
function r3gcHash(domain: string, value: unknown): string { return hash("KODAC-H4-R3G-C", domain, value) }
function watchdogHash(domain: string, parts: readonly string[]): string {
  const digest = createHash("sha256")
  for (const value of ["KODAC-H4-R3G-D-WATCHDOG", domain, "V1", ...parts]) {
    digest.update(Buffer.from(value, "utf8"))
    digest.update(Buffer.of(0))
  }
  return digest.digest("hex")
}

function fixtureRequirement(ttlMs = 60_000): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({ mode: "read-only", workspaceIdentity: WORKSPACE_IDENTITY, executionIntentIdentity: EXECUTION_INTENT_IDENTITY, scope: { readPaths: ["src"], writePaths: [] } })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3gd-fixture", digest: `sha256:${"2".repeat(64)}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536_870_912, ttlMs, maxOutputBytes: 1_048_576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function fixtureSubject(requirement = fixtureRequirement()) {
  const attempt = createGvisorExecutionAttemptIdentity({ requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, nonce: "123e4567-e89b-42d3-a456-426614174001" })
  const binding = createGvisorContainerBinding({ providerId: "docker-engine", executionAttemptIdentity: attempt, requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, containerId: CONTAINER_ID })
  const plan = createGvisorObserverPlan({ runscPath: "/usr/local/bin/runsc", expectedRunscSha256: RUNSC_SHA, runtimeRoot: "/run/runsc", containerId: CONTAINER_ID })
  const state = parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: CONTAINER_ID, status: "running", pid: 4242, bundle: `/run/containerd/${CONTAINER_ID}` }), plan)
  const stats = parseGvisorStatsOutput(JSON.stringify({ type: "stats", id: CONTAINER_ID, data: { pids: { current: 2 } } }), plan)
  const processObservation = parseGvisorProcessObservation("kodac-gvisor-proc-v1 pid=4242 start-ticks=123456789 exe-dev=2049 exe-ino=987654321 exe-size=12345678\n")
  const candidate = createGvisorRuntimeObservationCandidate({ plan, state, stats, process: processObservation })
  const runsc = createGvisorObserverArtifact({ role: "runsc", sha256: RUNSC_SHA, sizeBytes: 12_345_678 })
  const helper = createGvisorObserverArtifact({ role: "observer-helper", sha256: HELPER_SHA, sizeBytes: 123_456 })
  const lineage = createGvisorRuntimeLineageRecord({ executionAttemptIdentity: attempt, requirement, binding, runsc, helper, plan, state, stats, process: processObservation, candidate })
  const endpointBase = {
    path: `/run/runsc/runsc-${CONTAINER_ID}.sock`,
    device: "42",
    inode: "43",
    uid: "1000",
    gid: "1000",
    mode: String(0o140600),
    parentAuthorityIdentity: "f".repeat(64),
  }
  const controlEndpoint = Object.freeze({ ...endpointBase, endpointIdentity: r3gcHash("CONTROL_ENDPOINT", [endpointBase.path, endpointBase.device, endpointBase.inode, endpointBase.uid, endpointBase.gid, endpointBase.mode, endpointBase.parentAuthorityIdentity]) })
  return createGvisorTtlSubjectBinding({ binding, lineage, state, process: processObservation, runscArtifact: runsc, controlEndpoint, expectedPeerUid: "1000", expectedPeerGid: "1000" })
}

function fixturePrepared(requirement: SandboxExecutionRequirement, subject: ReturnType<typeof fixtureSubject>) {
  return createGvisorTtlPreparedIntent({ requirement, subject, watchdogImplementationIdentity: createGvisorTtlWatchdogImplementationIdentity({ watchdogSha256: WATCHDOG_SHA, watchdogSizeBytes: 123_456 }) })
}

function fixtureLease(prepared: ReturnType<typeof createGvisorTtlPreparedIntent>) {
  return createGvisorTtlWatchdogLeaseRecord({ prepared, linuxBootId: BOOT_ID, leaseStartBoottimeNs: LEASE_START_NS })
}

function fixtureControlPeer(subject: ReturnType<typeof fixtureSubject>) {
  return createGvisorTtlControlPeerBinding({
    subject,
    socketDevice: subject.controlEndpoint.device,
    socketInode: subject.controlEndpoint.inode,
    peerPid: subject.process.pid,
    peerUid: subject.expectedPeerUid,
    peerGid: subject.expectedPeerGid,
    processStartTicks: subject.process.startTicks,
    executableDevice: subject.process.exeDev,
    executableInode: subject.process.exeIno,
    executableSize: subject.process.exeSize,
    verifiedRunscSha256: subject.runscArtifact.sha256,
  })
}

function fixtureAck(prepared: ReturnType<typeof createGvisorTtlPreparedIntent>, subject: ReturnType<typeof fixtureSubject>, lease: ReturnType<typeof fixtureLease>): GvisorTtlArmAcknowledgement {
  const controlPeer = fixtureControlPeer(subject)
  const base = {
    version: KDO_H4_R3G_D_ARM_ACK_VERSION,
    leaseIdentity: lease.leaseIdentity,
    armOperationIdentity: prepared.armOperationIdentity,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    controlPeer,
    controlPeerBindingIdentity: controlPeer.controlPeerBindingIdentity,
    runscArtifactIdentity: subject.runscArtifact.artifactIdentity,
    verifiedRunscSha256: subject.runscArtifact.sha256,
    watchdogRegistryRecordIdentity: lease.registryRecordIdentity,
    clockDomainIdentity: lease.clockDomainIdentity,
    linuxBootId: lease.linuxBootId,
    leaseStartBoottimeNs: lease.leaseStartBoottimeNs,
    deadlineBoottimeNs: lease.deadlineBoottimeNs,
    ownerInstanceIdentity: "6".repeat(64),
    terminalFenceToken: "1",
    claimRecordIdentity: "7".repeat(64),
  } as const
  return Object.freeze({ ...base, armAcknowledgementIdentity: r3gdHash("ARM_ACK", base) })
}

function fixtureArm() {
  const requirement = fixtureRequirement()
  const subject = fixtureSubject(requirement)
  const prepared = fixturePrepared(requirement, subject)
  const lease = fixtureLease(prepared)
  const acknowledgement = fixtureAck(prepared, subject, lease)
  return { requirement, subject, prepared, lease, acknowledgement, arm: createGvisorTtlArmRecord({ prepared, lease, acknowledgement, subject }) }
}

function fixtureTerminal(arm: ReturnType<typeof createGvisorTtlArmRecord>, outcome: "natural-exit" | "ttl-expired"): GvisorTtlTerminalRecord {
  const natural = outcome === "natural-exit"
  const retainedPidfdProcessIdentity = watchdogHash("PIDFD_PROCESS", [String(arm.controlPeer.peerPid), arm.controlPeer.processStartTicks, arm.controlPeer.executableDevice, arm.controlPeer.executableInode, arm.controlPeer.executableSize, arm.runtimeInstanceIdentity])
  const retainedRunscExecutableIdentity = watchdogHash("RUNSC_EXECUTABLE", [arm.verifiedRunscSha256, arm.controlPeer.executableDevice, arm.controlPeer.executableInode, arm.controlPeer.executableSize, arm.runscArtifactIdentity])
  const base = {
    version: KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
    evidenceClass: KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
    armOperationIdentity: arm.armOperationIdentity,
    leaseIdentity: arm.leaseIdentity,
    armRecordIdentity: arm.recordIdentity,
    runtimeInstanceIdentity: arm.runtimeInstanceIdentity,
    terminalOutcome: outcome,
    ownerInstanceIdentity: arm.ownerInstanceIdentity,
    terminalFenceToken: arm.terminalFenceToken,
    claimRecordIdentity: arm.claimRecordIdentity,
    controlPeerBindingIdentity: arm.controlPeerBindingIdentity,
    socketDevice: arm.controlPeer.socketDevice,
    socketInode: arm.controlPeer.socketInode,
    peerPid: arm.controlPeer.peerPid,
    peerUid: arm.controlPeer.peerUid,
    peerGid: arm.controlPeer.peerGid,
    retainedPidfdProcessIdentity,
    runscArtifactIdentity: arm.runscArtifactIdentity,
    verifiedRunscSha256: arm.verifiedRunscSha256,
    retainedRunscExecutableIdentity,
    clockDomainIdentity: arm.clockDomainIdentity,
    linuxBootId: arm.linuxBootId,
    exitEventObservedBoottimeNs: natural ? arm.leaseStartBoottimeNs : null,
    liveAtExpiryProbeIdentity: natural ? null : "a".repeat(64),
    liveAtExpiryObservedBoottimeNs: natural ? null : arm.deadlineBoottimeNs,
    liveAtExpiryProcessSetIdentity: natural ? null : "b".repeat(64),
    signalAcknowledgementIdentity: natural ? null : "c".repeat(64),
    terminationAcknowledgementIdentity: "d".repeat(64),
  } as const
  const registryTerminalRecordIdentity = watchdogHash("TERMINAL_REGISTRY", [
    base.armOperationIdentity,
    base.leaseIdentity,
    base.runtimeInstanceIdentity,
    base.terminalOutcome,
    base.ownerInstanceIdentity,
    base.terminalFenceToken,
    base.claimRecordIdentity,
    base.controlPeerBindingIdentity,
    base.retainedPidfdProcessIdentity,
    base.runscArtifactIdentity,
    base.verifiedRunscSha256,
    base.retainedRunscExecutableIdentity,
    base.clockDomainIdentity,
    base.linuxBootId,
    base.exitEventObservedBoottimeNs ?? "-",
    base.liveAtExpiryObservedBoottimeNs ?? "-",
    base.liveAtExpiryProbeIdentity ?? "-",
    base.liveAtExpiryProcessSetIdentity ?? "-",
    base.signalAcknowledgementIdentity ?? "-",
    base.terminationAcknowledgementIdentity,
  ])
  const withRegistry = Object.freeze({ ...base, registryTerminalRecordIdentity })
  return Object.freeze({ ...withRegistry, recordIdentity: r3gdHash("TERMINAL_RECORD", withRegistry) })
}

test("H4-R3G-D constants keep TTL enforcement narrow and gVisor-pinned", () => {
  assert.equal(KDO_H4_R3G_D_CAPABILITY, "runtime.enforce.gvisor.ttl")
  assert.equal(KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION, "kodac-h4-r3g-d-runtime-config-v1")
  assert.equal(KDO_H4_R3G_D_SUBJECT_VERSION, "kodac-h4-r3g-d-subject-binding-v1")
  assert.equal(KDO_H4_R3G_D_PREPARED_VERSION, "kodac-h4-r3g-d-arm-intent-v1")
  assert.equal(KDO_H4_R3G_D_CONTROL_PEER_VERSION, "kodac-h4-r3g-d-control-peer-v1")
  assert.equal(KDO_H4_R3G_D_WATCHDOG_LEASE_VERSION, "kodac-h4-r3g-d-watchdog-lease-v1")
  assert.equal(KDO_H4_R3G_D_ARM_RECORD_VERSION, "kodac-h4-r3g-d-arm-record-v1")
  assert.equal(KDO_H4_R3G_D_TERMINAL_RECORD_VERSION, "kodac-h4-r3g-d-terminal-record-v1")
  assert.equal(KDO_H4_R3G_D_COMMIT_VERSION, "kodac-h4-r3g-d-evidence-commit-v1")
  assert.equal(KDO_H4_R3G_D_ARM_EVIDENCE_CLASS, "e3-ttl-lifecycle-arm")
  assert.equal(KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS, "e3-ttl-lifecycle-terminal")
  assert.equal(KDO_H4_R3G_D_CLOCK_NAME, "CLOCK_BOOTTIME")
  assert.equal(KDO_H4_R3G_D_GVISOR_SOURCE_COMMIT, "50e1502a95d36ad2faf2c7ef33b8bf21fe975293")
  assert.equal(KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION, "kodac-h4-r3g-d-watchdog-protocol-v1")
})

test("H4-R3G-D exact subject binds canonical R3E runtime lineage runsc artifact and control endpoint", () => {
  const requirement = fixtureRequirement(); const subject = fixtureSubject(requirement)
  assert.deepEqual(validateGvisorTtlSubjectBinding(subject, requirement), subject)
  assert.equal(subject.state.pid, subject.process.pid)
  assert.equal(subject.runscArtifact.role, "runsc")
  assert.throws(() => validateGvisorTtlSubjectBinding({ ...subject, expectedPeerUid: "1001" }, requirement), /subjectBindingIdentity/)
  assert.throws(() => createGvisorTtlSubjectBinding({ binding: subject.binding, lineage: subject.lineage, state: subject.state, process: { ...subject.process, pid: 4243 }, runscArtifact: subject.runscArtifact, controlEndpoint: subject.controlEndpoint, expectedPeerUid: "1000", expectedPeerGid: "1000" }), /process|lineage/)
})

test("H4-R3G-D PREPARED intent and arm operation identity are deterministic and ttl-bound", () => {
  const requirement = fixtureRequirement(); const subject = fixtureSubject(requirement)
  const first = fixturePrepared(requirement, subject)
  const second = fixturePrepared(requirement, subject)
  assert.deepEqual(first, second)
  assert.deepEqual(validateGvisorTtlPreparedIntent(first), first)
  const changedRequirement = fixtureRequirement(59_999)
  const changed = fixturePrepared(changedRequirement, fixtureSubject(changedRequirement))
  assert.notEqual(changed.armOperationIdentity, first.armOperationIdentity)
  assert.notEqual(changed.canonicalArmPayloadDigest, first.canonicalArmPayloadDigest)
  assert.throws(() => validateGvisorTtlPreparedIntent({ ...first, ttlMs: first.ttlMs + 1 }), /identity|mismatch/)
})

test("H4-R3G-D control-peer identity is derived from exact endpoint credentials process instance and runsc artifact", () => {
  const subject = fixtureSubject()
  const peer = fixtureControlPeer(subject)
  assert.deepEqual(validateGvisorTtlControlPeerBinding(peer, subject), peer)
  assert.throws(() => validateGvisorTtlControlPeerBinding({ ...peer, controlPeerBindingIdentity: "4".repeat(64) }, subject), /controlPeerBindingIdentity/)
  assert.throws(() => createGvisorTtlControlPeerBinding({ subject, socketDevice: subject.controlEndpoint.device, socketInode: subject.controlEndpoint.inode, peerPid: subject.process.pid + 1, peerUid: subject.expectedPeerUid, peerGid: subject.expectedPeerGid, processStartTicks: subject.process.startTicks, executableDevice: subject.process.exeDev, executableInode: subject.process.exeIno, executableSize: subject.process.exeSize, verifiedRunscSha256: subject.runscArtifact.sha256 }), /credentials/)
  assert.throws(() => createGvisorTtlControlPeerBinding({ subject, socketDevice: subject.controlEndpoint.device, socketInode: subject.controlEndpoint.inode, peerPid: subject.process.pid, peerUid: subject.expectedPeerUid, peerGid: subject.expectedPeerGid, processStartTicks: (BigInt(subject.process.startTicks) + 1n).toString(), executableDevice: subject.process.exeDev, executableInode: subject.process.exeIno, executableSize: subject.process.exeSize, verifiedRunscSha256: subject.runscArtifact.sha256 }), /process instance/)
})

test("H4-R3G-D durable watchdog lease is deterministic PREPARED-bound boot-bound and deadline-immutable", () => {
  const requirement = fixtureRequirement(); const subject = fixtureSubject(requirement); const prepared = fixturePrepared(requirement, subject)
  const lease = fixtureLease(prepared)
  assert.deepEqual(validateGvisorTtlWatchdogLeaseRecord(lease, prepared), lease)
  assert.equal(BigInt(lease.deadlineBoottimeNs) - BigInt(lease.leaseStartBoottimeNs), BigInt(prepared.ttlMs) * 1_000_000n)
  assert.throws(() => validateGvisorTtlWatchdogLeaseRecord({ ...lease, canonicalArmPayloadDigest: "4".repeat(64) }, prepared), /identity|mismatch/)
  assert.throws(() => validateGvisorTtlWatchdogLeaseRecord({ ...lease, linuxBootId: "223e4567-e89b-42d3-a456-426614174000" }, prepared), /identity|clock|registry/)
  assert.throws(() => validateGvisorTtlWatchdogLeaseRecord({ ...lease, leaseStartBoottimeNs: (BigInt(lease.leaseStartBoottimeNs) + 1n).toString() }, prepared), /identity|deadline|registry/)
  assert.throws(() => validateGvisorTtlWatchdogLeaseRecord({ ...lease, registryRecordIdentity: "5".repeat(64) }, prepared), /identity|registry/)
})

test("H4-R3G-D arm acknowledgement requires the exact durable lease and authenticated control peer", () => {
  const { prepared, subject, lease, acknowledgement } = fixtureArm()
  assert.deepEqual(validateGvisorTtlArmAcknowledgement(acknowledgement, prepared, subject, lease), acknowledgement)
  assert.throws(() => validateGvisorTtlArmAcknowledgement({ ...acknowledgement, watchdogRegistryRecordIdentity: "5".repeat(64) }, prepared, subject, lease), /durable watchdog lease|identity/)
  assert.throws(() => validateGvisorTtlArmAcknowledgement({ ...acknowledgement, controlPeerBindingIdentity: "4".repeat(64) }, prepared, subject, lease), /control-peer|identity/)
  assert.throws(() => validateGvisorTtlArmAcknowledgement({ ...acknowledgement, controlPeer: { ...acknowledgement.controlPeer, peerUid: "1001" } }, prepared, subject, lease), /credentials|controlPeerBindingIdentity/)
  assert.throws(() => validateGvisorTtlArmAcknowledgement({ ...acknowledgement, deadlineBoottimeNs: (BigInt(acknowledgement.deadlineBoottimeNs) + 1n).toString() }, prepared, subject, lease), /durable watchdog lease|identity/)
})

test("H4-R3G-D arm record preserves the validated durable lease and peer proof", () => {
  const { prepared, lease, acknowledgement, subject, arm } = fixtureArm()
  assert.deepEqual(createGvisorTtlArmRecord({ prepared, lease, acknowledgement, subject }), arm)
  assert.deepEqual(validateGvisorTtlArmRecord(arm), arm)
  assert.equal(arm.watchdogRegistryRecordIdentity, lease.registryRecordIdentity)
  assert.equal(arm.controlPeerBindingIdentity, acknowledgement.controlPeer.controlPeerBindingIdentity)
})

test("H4-R3G-D terminal record enforces lease interval and positive live-at-expiry semantics", () => {
  const { arm } = fixtureArm()
  const natural = fixtureTerminal(arm, "natural-exit")
  const expired = fixtureTerminal(arm, "ttl-expired")
  assert.deepEqual(validateGvisorTtlTerminalRecord(natural, arm), natural)
  assert.deepEqual(validateGvisorTtlTerminalRecord(expired, arm), expired)
  const beforeStart = { ...natural, exitEventObservedBoottimeNs: (BigInt(arm.leaseStartBoottimeNs) - 1n).toString() }
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...beforeStart, recordIdentity: r3gdHash("TERMINAL_RECORD", beforeStart) }, arm), /during the lease/)
  const atDeadline = { ...natural, exitEventObservedBoottimeNs: arm.deadlineBoottimeNs }
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...atDeadline, recordIdentity: r3gdHash("TERMINAL_RECORD", atDeadline) }, arm), /during the lease/)
  const earlyExpiry = { ...expired, liveAtExpiryObservedBoottimeNs: (BigInt(arm.deadlineBoottimeNs) - 1n).toString() }
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...earlyExpiry, recordIdentity: r3gdHash("TERMINAL_RECORD", earlyExpiry) }, arm), /at\/after deadline/)
  const wrongPeer = { ...expired, peerUid: "1001" }
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...wrongPeer, recordIdentity: r3gdHash("TERMINAL_RECORD", wrongPeer) }, arm), /control peer/)
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...expired, signalAcknowledgementIdentity: null }, arm), /missing required|identity/)
})

test("H4-R3G-D exact evidence commit acknowledgement is idempotent and payload-bound", () => {
  const operation = "1".repeat(64); const recordIdentity = "2".repeat(64); const digest = payloadDigest({ immutable: true })
  const prepared = createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: operation, leaseIdentity: null, recordIdentity, payloadDigest: digest })
  assert.deepEqual(validateGvisorTtlEvidenceCommit(prepared, { kind: "prepared", armOperationIdentity: operation, leaseIdentity: null, recordIdentity, payloadDigest: digest }), prepared)
  assert.throws(() => createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: operation, leaseIdentity: "3".repeat(64), recordIdentity, payloadDigest: digest }))
  assert.throws(() => createGvisorTtlEvidenceCommit({ kind: "arm", armOperationIdentity: operation, leaseIdentity: null, recordIdentity, payloadDigest: digest }))
  assert.throws(() => validateGvisorTtlEvidenceCommit({ ...prepared, payloadDigest: "4".repeat(64) }, { kind: "prepared", armOperationIdentity: operation, leaseIdentity: null, recordIdentity, payloadDigest: digest }))
})

test("H4-R3G-D runtime config has no caller-selected lifecycle command signal or generic storage authority", () => {
  const base = { version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION, watchdogPath: "/opt/kodac/gvisor-ttl-watchdog", expectedWatchdogSha256: WATCHDOG_SHA, registryRoot: "/var/lib/kodac/r3g-d", resolveSubject: () => ({}), commitPreparedIntent: () => ({}), commitArmEvidence: () => ({}), commitTerminalEvidence: () => ({}) }
  assert.doesNotThrow(() => validateGvisorTtlRuntimeConfig(base))
  for (const widened of [{ ...base, signal: "SIGTERM" }, { ...base, runscArgs: ["kill"] }, { ...base, containerId: CONTAINER_ID }, { ...base, dockerSocket: "/var/run/docker.sock" }, { ...base, put: () => ({}) }]) assert.throws(() => validateGvisorTtlRuntimeConfig(widened))
  assert.throws(() => validateGvisorTtlRuntimeConfig({ ...base, watchdogPath: "watchdog" }))
  assert.throws(() => validateGvisorTtlRuntimeConfig(new Proxy(base, {})))
})
