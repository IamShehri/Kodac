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
  KDO_H4_R3G_D_GVISOR_SOURCE_COMMIT,
  KDO_H4_R3G_D_PREPARED_VERSION,
  KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_D_SUBJECT_VERSION,
  KDO_H4_R3G_D_TERMINAL_EVIDENCE_CLASS,
  KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
  KDO_H4_R3G_D_WATCHDOG_PROTOCOL_VERSION,
  createGvisorTtlArmRecord,
  createGvisorTtlClockDomainIdentity,
  createGvisorTtlEvidenceCommit,
  createGvisorTtlPreparedIntent,
  createGvisorTtlSubjectBinding,
  createGvisorTtlWatchdogImplementationIdentity,
  payloadDigest,
  validateGvisorTtlArmAcknowledgement,
  validateGvisorTtlArmRecord,
  validateGvisorTtlEvidenceCommit,
  validateGvisorTtlPreparedIntent,
  validateGvisorTtlRuntimeConfig,
  validateGvisorTtlSubjectBinding,
  validateGvisorTtlTerminalRecord,
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

function fixtureAck(prepared: ReturnType<typeof createGvisorTtlPreparedIntent>, subject: ReturnType<typeof fixtureSubject>): GvisorTtlArmAcknowledgement {
  const leaseStartBoottimeNs = "100000000000"
  const deadlineBoottimeNs = (BigInt(leaseStartBoottimeNs) + BigInt(prepared.ttlMs) * 1_000_000n).toString()
  const base = {
    version: KDO_H4_R3G_D_ARM_ACK_VERSION,
    leaseIdentity: "3".repeat(64),
    armOperationIdentity: prepared.armOperationIdentity,
    runtimeInstanceIdentity: prepared.runtimeInstanceIdentity,
    controlPeerBindingIdentity: "4".repeat(64),
    runscArtifactIdentity: subject.runscArtifact.artifactIdentity,
    verifiedRunscSha256: subject.runscArtifact.sha256,
    watchdogRegistryRecordIdentity: "5".repeat(64),
    clockDomainIdentity: createGvisorTtlClockDomainIdentity(BOOT_ID),
    linuxBootId: BOOT_ID,
    leaseStartBoottimeNs,
    deadlineBoottimeNs,
    ownerInstanceIdentity: "6".repeat(64),
    terminalFenceToken: "1",
    claimRecordIdentity: "7".repeat(64),
  } as const
  return Object.freeze({ ...base, armAcknowledgementIdentity: r3gdHash("ARM_ACK", base) })
}

function fixtureTerminal(arm: ReturnType<typeof createGvisorTtlArmRecord>, outcome: "natural-exit" | "ttl-expired"): GvisorTtlTerminalRecord {
  const natural = outcome === "natural-exit"
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
    socketDevice: "42",
    socketInode: "43",
    peerPid: 4242,
    peerUid: "1000",
    peerGid: "1000",
    retainedPidfdProcessIdentity: "8".repeat(64),
    runscArtifactIdentity: arm.runscArtifactIdentity,
    verifiedRunscSha256: arm.verifiedRunscSha256,
    retainedRunscExecutableIdentity: "9".repeat(64),
    clockDomainIdentity: arm.clockDomainIdentity,
    linuxBootId: arm.linuxBootId,
    exitEventObservedBoottimeNs: natural ? (BigInt(arm.deadlineBoottimeNs) - 1n).toString() : null,
    liveAtExpiryProbeIdentity: natural ? null : "a".repeat(64),
    liveAtExpiryObservedBoottimeNs: natural ? null : arm.deadlineBoottimeNs,
    liveAtExpiryProcessSetIdentity: natural ? null : "b".repeat(64),
    signalAcknowledgementIdentity: natural ? null : "c".repeat(64),
    terminationAcknowledgementIdentity: "d".repeat(64),
    registryTerminalRecordIdentity: "e".repeat(64),
  } as const
  return Object.freeze({ ...base, recordIdentity: r3gdHash("TERMINAL_RECORD", base) })
}

test("H4-R3G-D constants keep TTL enforcement narrow and gVisor-pinned", () => {
  assert.equal(KDO_H4_R3G_D_CAPABILITY, "runtime.enforce.gvisor.ttl")
  assert.equal(KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION, "kodac-h4-r3g-d-runtime-config-v1")
  assert.equal(KDO_H4_R3G_D_SUBJECT_VERSION, "kodac-h4-r3g-d-subject-binding-v1")
  assert.equal(KDO_H4_R3G_D_PREPARED_VERSION, "kodac-h4-r3g-d-arm-intent-v1")
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
  assert.equal(subject.lineage.runtimeInstanceIdentity, subject.lineage.runtimeInstanceIdentity)
  assert.equal(subject.state.pid, subject.process.pid)
  assert.equal(subject.runscArtifact.role, "runsc")
  assert.throws(() => validateGvisorTtlSubjectBinding({ ...subject, expectedPeerUid: "1001" }, requirement), /subjectBindingIdentity/)
  assert.throws(() => createGvisorTtlSubjectBinding({ binding: subject.binding, lineage: subject.lineage, state: subject.state, process: { ...subject.process, pid: 4243 }, runscArtifact: subject.runscArtifact, controlEndpoint: subject.controlEndpoint, expectedPeerUid: "1000", expectedPeerGid: "1000" }), /process|lineage/)
})

test("H4-R3G-D PREPARED intent and arm operation identity are deterministic and ttl-bound", () => {
  const requirement = fixtureRequirement(); const subject = fixtureSubject(requirement)
  const watchdogImplementationIdentity = createGvisorTtlWatchdogImplementationIdentity({ watchdogSha256: WATCHDOG_SHA, watchdogSizeBytes: 123_456 })
  const first = createGvisorTtlPreparedIntent({ requirement, subject, watchdogImplementationIdentity })
  const second = createGvisorTtlPreparedIntent({ requirement, subject, watchdogImplementationIdentity })
  assert.deepEqual(first, second)
  assert.deepEqual(validateGvisorTtlPreparedIntent(first), first)
  const changedTtl = createGvisorTtlPreparedIntent({ requirement: fixtureRequirement(59_999), subject: fixtureSubject(fixtureRequirement(59_999)), watchdogImplementationIdentity })
  assert.notEqual(changedTtl.armOperationIdentity, first.armOperationIdentity)
  assert.notEqual(changedTtl.canonicalArmPayloadDigest, first.canonicalArmPayloadDigest)
  assert.throws(() => validateGvisorTtlPreparedIntent({ ...first, ttlMs: first.ttlMs + 1 }), /identity|mismatch/)
})

test("H4-R3G-D arm acknowledgement preserves exact immutable CLOCK_BOOTTIME deadline", () => {
  const requirement = fixtureRequirement(); const subject = fixtureSubject(requirement)
  const prepared = createGvisorTtlPreparedIntent({ requirement, subject, watchdogImplementationIdentity: createGvisorTtlWatchdogImplementationIdentity({ watchdogSha256: WATCHDOG_SHA, watchdogSizeBytes: 123_456 }) })
  const acknowledgement = fixtureAck(prepared, subject)
  assert.deepEqual(validateGvisorTtlArmAcknowledgement(acknowledgement, prepared, subject), acknowledgement)
  assert.throws(() => validateGvisorTtlArmAcknowledgement({ ...acknowledgement, deadlineBoottimeNs: (BigInt(acknowledgement.deadlineBoottimeNs) + 1n).toString() }, prepared, subject), /identity|deadline/)
  assert.throws(() => validateGvisorTtlArmAcknowledgement({ ...acknowledgement, verifiedRunscSha256: "f".repeat(64) }, prepared, subject), /identity|artifact/)
  const arm = createGvisorTtlArmRecord({ prepared, acknowledgement, subject })
  assert.deepEqual(validateGvisorTtlArmRecord(arm), arm)
})

test("H4-R3G-D terminal record preserves pre-deadline natural exit vs positive live-at-expiry semantics", () => {
  const requirement = fixtureRequirement(); const subject = fixtureSubject(requirement)
  const prepared = createGvisorTtlPreparedIntent({ requirement, subject, watchdogImplementationIdentity: createGvisorTtlWatchdogImplementationIdentity({ watchdogSha256: WATCHDOG_SHA, watchdogSizeBytes: 123_456 }) })
  const arm = createGvisorTtlArmRecord({ prepared, acknowledgement: fixtureAck(prepared, subject), subject })
  const natural = fixtureTerminal(arm, "natural-exit")
  const expired = fixtureTerminal(arm, "ttl-expired")
  assert.deepEqual(validateGvisorTtlTerminalRecord(natural, arm), natural)
  assert.deepEqual(validateGvisorTtlTerminalRecord(expired, arm), expired)
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...natural, exitEventObservedBoottimeNs: arm.deadlineBoottimeNs, recordIdentity: natural.recordIdentity }, arm), /before deadline|identity/)
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...expired, liveAtExpiryObservedBoottimeNs: (BigInt(arm.deadlineBoottimeNs) - 1n).toString(), recordIdentity: expired.recordIdentity }, arm), /at\/after deadline|identity/)
  assert.throws(() => validateGvisorTtlTerminalRecord({ ...expired, signalAcknowledgementIdentity: null, recordIdentity: expired.recordIdentity }, arm), /missing required/)
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
