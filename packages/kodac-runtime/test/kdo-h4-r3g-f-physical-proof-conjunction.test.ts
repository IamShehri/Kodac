import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync } from "node:fs"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
  KDO_H4_R3B_BACKEND_CAPABILITY_VERSION,
  KDO_H4_R3B_BACKEND_OBSERVATION_VERSION,
  KDO_H4_R3B_EXECUTION_EVIDENCE_VERSION,
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
  createGvisorObserverPlan,
  createGvisorRuntimeObservationCandidate,
  parseGvisorProcessObservation,
  parseGvisorStateOutput,
  parseGvisorStatsOutput,
} from "../src/trust/sandbox-observer-gvisor.ts"
import {
  createGvisorContainerBinding,
  createGvisorExecutionAttemptIdentity,
  createGvisorObserverArtifact,
  createGvisorRuntimeLineageCommit,
  createGvisorRuntimeLineageRecord,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_A_COMMIT_VERSION,
  KDO_H4_R3G_A_RECORD_VERSION,
  createGvisorCgroupNamespaceObservation,
  createGvisorCgroupV2ObserverProtocolIdentity,
  createGvisorCgroupV2PhysicalResourceSnapshot,
  createGvisorCgroupV2ResourceCommit,
  createGvisorCgroupV2ResourceRecord,
} from "../src/trust/sandbox-observer-gvisor-cgroup-v2.ts"
import {
  KDO_H4_R3G_B_COMMIT_VERSION,
  KDO_H4_R3G_B_VERSION,
  createGvisorSourceLineageCommit,
  createGvisorSourceLineageRecord,
} from "../src/trust/sandbox-observer-gvisor-source-lineage.ts"
import { createDockerControlPlaneObservation } from "../src/trust/sandbox-observer-docker-control-plane.ts"
import {
  KDO_H4_R3G_C_COMMIT_VERSION,
  KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  KDO_H4_R3G_C_VERSION,
  createGvisorPhysicalNetworkCommit,
  createGvisorPhysicalNetworkRecord,
  parseGvisorGetNetworkConfigResponse,
} from "../src/trust/sandbox-observer-gvisor-network.ts"
import {
  KDO_H4_R3G_D_ARM_ACK_VERSION,
  KDO_H4_R3G_D_ARM_RECORD_VERSION,
  KDO_H4_R3G_D_COMMIT_VERSION,
  KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
  createGvisorTtlArmRecord,
  createGvisorTtlControlPeerBinding,
  createGvisorTtlEvidenceCommit,
  createGvisorTtlPreparedIntent,
  createGvisorTtlSubjectBinding,
  createGvisorTtlWatchdogImplementationIdentity,
  createGvisorTtlWatchdogLeaseRecord,
  payloadDigest,
  type GvisorTtlArmAcknowledgement,
  type GvisorTtlArmRecord,
  type GvisorTtlTerminalRecord,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"
import {
  KDO_H4_R3G_E_COMMIT_VERSION,
  KDO_H4_R3G_E_OUTPUT_VERSION,
  createGvisorOutputBoundCommit,
  createGvisorOutputBoundRecord,
  createGvisorOutputChannelIdentity,
  createGvisorOutputObserverImplementationIdentity,
} from "../src/trust/sandbox-output-gvisor.ts"
import {
  KDO_H4_R3G_F_EVIDENCE_CLASS,
  KDO_H4_R3G_F_PROVIDER_ID,
  KDO_H4_R3G_F_VERSION,
  createGvisorPhysicalConjunctionCommit,
  createGvisorPhysicalConjunctionImplementationIdentity,
  createGvisorPhysicalConjunctionObserverIdentity,
  createGvisorPhysicalConjunctionRecord,
  createGvisorPhysicalEvidenceResolution,
  createGvisorPhysicalExecutionInstanceIdentity,
  createGvisorPhysicalSubjectCoherence,
  mintGvisorPhysicalProof,
  validateGvisorPhysicalConjunctionCommit,
  validateGvisorPhysicalEvidenceBundle,
  validateGvisorPhysicalEvidenceResolution,
  validateGvisorPhysicalSubjectCoherence,
  type GvisorPhysicalEvidenceBundle,
} from "../src/trust/sandbox-physical-conjunction-gvisor.ts"
import {
  GvisorPhysicalProofExecutionGateway,
  createGvisorPhysicalConjunctionRuntime,
} from "../src/execution/gateway-gvisor-physical-proof-runtime.ts"
import { ExecutionBlockedError, ExecutionFailedError } from "../src/execution/gateway.ts"
import { fixedPolicy } from "../src/trust/policy.ts"

const CONTAINER_ID = "1".repeat(64)
const PID = 4242
const START_TICKS = "123456789"
const RUNSC_SHA = "c".repeat(64)
const HELPER_SHA = "d".repeat(64)
const WATCHDOG_SHA = "e".repeat(64)
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const SOURCE_DIGEST = `sha256:${"2".repeat(64)}`
const BOOT_ID = "123e4567-e89b-42d3-a456-426614174000"
const LEASE_START_NS = "100000000000"
const PROVENANCE_IDENTITY = "f".repeat(64)

function domainHash(prefix: string, domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`${prefix}\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}
function r3gCHash(domain: string, value: unknown): string { return domainHash("KODAC-H4-R3G-C", domain, value) }
function r3gDHash(domain: string, value: unknown): string { return domainHash("KODAC-H4-R3G-D", domain, value) }
function r3gFHash(domain: string, value: unknown): string { return domainHash("KODAC-H4-R3G-F", domain, value) }
function watchdogHash(domain: string, parts: readonly string[]): string {
  const digest = createHash("sha256")
  for (const value of ["KODAC-H4-R3G-D-WATCHDOG", domain, "V1", ...parts]) {
    digest.update(Buffer.from(value, "utf8"))
    digest.update(Buffer.of(0))
  }
  return digest.digest("hex")
}

function fixtureRequirement(input: { cpuMillis?: number; memoryBytes?: number; ttlMs?: number; maxOutputBytes?: number; runtime?: "gvisor" | "kata-qemu" } = {}): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3gf-fixture", digest: SOURCE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({
      cpuMillis: input.cpuMillis ?? 1000,
      memoryBytes: input.memoryBytes ?? 536_870_912,
      ttlMs: input.ttlMs ?? 60_000,
      maxOutputBytes: input.maxOutputBytes ?? 1_048_576,
    }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: input.runtime ?? "gvisor" })
}

function procStat(): string {
  const fields = Array.from({ length: 38 }, () => "0")
  fields[18] = START_TICKS
  fields[36] = "0"
  fields[37] = "0"
  return `${PID} (runsc:sandbox) S ${fields.join(" ")}\n`
}

function fixtureLineage(requirement = fixtureRequirement()) {
  const executionAttemptIdentity = createGvisorExecutionAttemptIdentity({
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    nonce: "123e4567-e89b-42d3-a456-426614174001",
  })
  const binding = createGvisorContainerBinding({
    providerId: "docker-engine",
    executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerId: CONTAINER_ID,
  })
  const runsc = createGvisorObserverArtifact({ role: "runsc", sha256: RUNSC_SHA, sizeBytes: 12_345_678 })
  const helper = createGvisorObserverArtifact({ role: "observer-helper", sha256: HELPER_SHA, sizeBytes: 123_456 })
  const plan = createGvisorObserverPlan({
    runscPath: "/usr/local/bin/runsc",
    expectedRunscSha256: RUNSC_SHA,
    runtimeRoot: "/run/runsc",
    containerId: CONTAINER_ID,
  })
  const state = parseGvisorStateOutput(JSON.stringify({
    ociVersion: "1.2.0",
    id: CONTAINER_ID,
    status: "running",
    pid: PID,
    bundle: `/run/containerd/io.containerd.runtime.v2.task/moby/${CONTAINER_ID}`,
  }), plan)
  const stats = parseGvisorStatsOutput(JSON.stringify({
    type: "stats",
    id: CONTAINER_ID,
    data: { cpu: {}, memory: {}, pids: {}, network_interfaces: [] },
  }), plan)
  const process = parseGvisorProcessObservation(`kodac-gvisor-proc-v1 pid=${PID} start-ticks=${START_TICKS} exe-dev=2049 exe-ino=987654321 exe-size=12345678\n`)
  const candidate = createGvisorRuntimeObservationCandidate({ plan, state, stats, process })
  const lineage = createGvisorRuntimeLineageRecord({ executionAttemptIdentity, requirement, binding, runsc, helper, plan, state, stats, process, candidate })
  const lineageCommit = createGvisorRuntimeLineageCommit(lineage)
  return { executionAttemptIdentity, binding, runsc, helper, plan, state, stats, process, lineage, lineageCommit }
}

function fixtureResource(requirement: SandboxExecutionRequirement, lineageFixture: ReturnType<typeof fixtureLineage>) {
  const cgroupNamespace = createGvisorCgroupNamespaceObservation({ device: "7", inode: "4026531835" })
  const target = `/docker/${CONTAINER_ID}`
  const raw = {
    mountInfo: "29 23 0:26 / /sys/fs/cgroup rw,nosuid,nodev,noexec,relatime - cgroup2 cgroup rw\n",
    procStat: procStat(),
    procStatus: "Name:\trunsc\nCpus_allowed_list:\t0-3\n",
    procCgroup: `0::${target}\n`,
    targetCgroupProcs: `${PID}\n`,
    levels: [
      { path: target, cgroupType: "domain\n", cpuMax: `${requirement.workload.resourcePolicy.cpuMillis * 100} 100000\n`, cpuMaxBurst: "0\n", cpusetCpusEffective: "0-3\n", memoryMax: `${requirement.workload.resourcePolicy.memoryBytes}\n`, memorySwapMax: "0\n" },
      { path: "/docker", cgroupType: "domain\n", cpuMax: "max 100000\n", cpuMaxBurst: "0\n", cpusetCpusEffective: "0-3\n", memoryMax: "max\n", memorySwapMax: "max\n" },
    ],
  }
  const snapshot = createGvisorCgroupV2PhysicalResourceSnapshot({
    requirement,
    expectedPid: PID,
    expectedStartTicks: START_TICKS,
    cgroupNamespace,
    raw,
  })
  const record = createGvisorCgroupV2ResourceRecord({
    requirement,
    lineage: lineageFixture.lineage,
    lineageCommit: lineageFixture.lineageCommit,
    process: lineageFixture.process,
    preSnapshot: snapshot,
    postSnapshot: snapshot,
  })
  return { record, commit: createGvisorCgroupV2ResourceCommit(record) }
}

function fixtureSource(requirement: SandboxExecutionRequirement, lineageFixture: ReturnType<typeof fixtureLineage>, sourceDigest = requirement.workload.source.digest) {
  const record = createGvisorSourceLineageRecord({
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    executionAttemptIdentity: lineageFixture.executionAttemptIdentity,
    containerBindingIdentity: lineageFixture.binding.bindingIdentity,
    runtimeLineageIdentity: lineageFixture.lineage.recordIdentity,
    containerId: CONTAINER_ID,
    sourceDigest,
    dockerStorageIdentity: "1".repeat(64),
    imageRootfsIdentity: "2".repeat(64),
    expectedImageChainId: `sha256:${"3".repeat(64)}`,
    ctrArtifactIdentity: "4".repeat(64),
    containerdEndpointIdentity: "5".repeat(64),
    rootfsParentAuthorityIdentity: "6".repeat(64),
    containerSpecIdentity: "7".repeat(64),
    snapshotAncestryIdentity: "8".repeat(64),
    rootfsMountIdentity: "9".repeat(64),
  })
  return { record, commit: createGvisorSourceLineageCommit(record) }
}

function canonicalTopologyResult(): any {
  return {
    LoopbackLinks: [{
      Name: "lo",
      Addresses: [{ Address: "127.0.0.1", PrefixLen: 8 }, { Address: "::1", PrefixLen: 128 }],
      Routes: [
        { Destination: { IP: "127.0.0.0", Mask: "/wAAAA==" }, Gateway: "", MTU: 0 },
        { Destination: { IP: "::1", Mask: "/////////////////////w==" }, Gateway: "", MTU: 0 },
      ],
      GVisorGRO: false,
    }],
    FDBasedLinks: null,
    XDPLinks: null,
    Defaultv4Gateway: { Route: { Destination: { IP: "", Mask: null }, Gateway: "", MTU: 0 }, Name: "" },
    Defaultv6Gateway: { Route: { Destination: { IP: "", Mask: null }, Gateway: "", MTU: 0 }, Name: "" },
    PCAP: false,
    LogPackets: false,
    NATBlob: false,
    PauseExternalNetworking: false,
    AllowConnectedOnSave: false,
    IsRestore: false,
  }
}

function fixtureEndpoint() {
  const base = {
    path: `/run/runsc/runsc-${CONTAINER_ID}.sock`,
    device: "42",
    inode: "43",
    uid: "1000",
    gid: "1000",
    mode: String(0o140600),
    parentAuthorityIdentity: "a".repeat(64),
  }
  return Object.freeze({ ...base, endpointIdentity: r3gCHash("CONTROL_ENDPOINT", [base.path, base.device, base.inode, base.uid, base.gid, base.mode, base.parentAuthorityIdentity]) })
}

function fixtureNetwork(requirement: SandboxExecutionRequirement, lineageFixture: ReturnType<typeof fixtureLineage>) {
  const docker = createDockerControlPlaneObservation({
    providerIdentity: "b".repeat(64),
    socketEndpointIdentity: "c".repeat(64),
    executionAttemptIdentity: lineageFixture.executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerId: CONTAINER_ID,
    bindingIdentity: lineageFixture.binding.bindingIdentity,
    imageManifestDigest: requirement.workload.source.digest,
    executable: requirement.workload.entrypoint.executable,
    argsIdentity: "d".repeat(64),
    nanoCpus: requirement.workload.resourcePolicy.cpuMillis * 1_000_000,
    memoryBytes: requirement.workload.resourcePolicy.memoryBytes,
    memorySwapBytes: requirement.workload.resourcePolicy.memoryBytes,
  })
  const endpoint = fixtureEndpoint()
  const topology = parseGvisorGetNetworkConfigResponse(JSON.stringify({ success: true, err: "", result: canonicalTopologyResult() }))
  const read = Object.freeze({ endpointBefore: endpoint, endpointAfter: endpoint, topology })
  const record = createGvisorPhysicalNetworkRecord({
    r3eBefore: lineageFixture.lineage,
    r3eAfter: lineageFixture.lineage,
    dockerControlPlane: docker,
    firstRead: read,
    secondRead: read,
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  })
  return { record, commit: createGvisorPhysicalNetworkCommit(record), endpoint }
}

function physicalControlPeerIdentity(arm: GvisorTtlArmRecord): string {
  return watchdogHash("CONTROL_PEER", [
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
}

function terminalRegistryIdentity(arm: GvisorTtlArmRecord, base: any): string {
  return watchdogHash("TERMINAL_REGISTRY", [
    base.armOperationIdentity,
    base.leaseIdentity,
    base.runtimeInstanceIdentity,
    base.terminalOutcome,
    base.ownerInstanceIdentity,
    base.terminalFenceToken,
    base.claimRecordIdentity,
    physicalControlPeerIdentity(arm),
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
}

function buildTerminal(arm: GvisorTtlArmRecord, outcome: "natural-exit" | "indeterminate"): GvisorTtlTerminalRecord {
  const retainedPidfdProcessIdentity = watchdogHash("PIDFD_PROCESS", [
    String(arm.controlPeer.peerPid), arm.controlPeer.processStartTicks, arm.controlPeer.executableDevice,
    arm.controlPeer.executableInode, arm.controlPeer.executableSize, arm.runtimeInstanceIdentity,
  ])
  const retainedRunscExecutableIdentity = watchdogHash("RUNSC_EXECUTABLE", [
    arm.verifiedRunscSha256, arm.controlPeer.executableDevice, arm.controlPeer.executableInode,
    arm.controlPeer.executableSize, arm.runscArtifactIdentity,
  ])
  const base = Object.freeze({
    version: KDO_H4_R3G_D_TERMINAL_RECORD_VERSION,
    evidenceClass: "e3-ttl-lifecycle-terminal" as const,
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
    exitEventObservedBoottimeNs: outcome === "natural-exit" ? arm.leaseStartBoottimeNs : null,
    liveAtExpiryProbeIdentity: null,
    liveAtExpiryObservedBoottimeNs: null,
    liveAtExpiryProcessSetIdentity: null,
    signalAcknowledgementIdentity: null,
    terminationAcknowledgementIdentity: "d".repeat(64),
  })
  const registryTerminalRecordIdentity = terminalRegistryIdentity(arm, base)
  const withRegistry = Object.freeze({ ...base, registryTerminalRecordIdentity })
  return Object.freeze({ ...withRegistry, recordIdentity: r3gDHash("TERMINAL_RECORD", withRegistry) }) as GvisorTtlTerminalRecord
}

function fixtureTtl(requirement: SandboxExecutionRequirement, lineageFixture: ReturnType<typeof fixtureLineage>, terminalOutcome: "natural-exit" | "indeterminate" = "natural-exit") {
  const controlEndpoint = fixtureEndpoint()
  const subject = createGvisorTtlSubjectBinding({
    binding: lineageFixture.binding,
    lineage: lineageFixture.lineage,
    state: lineageFixture.state,
    process: lineageFixture.process,
    runscArtifact: lineageFixture.runsc,
    controlEndpoint,
    expectedPeerUid: "1000",
    expectedPeerGid: "1000",
  })
  const prepared = createGvisorTtlPreparedIntent({
    requirement,
    subject,
    watchdogImplementationIdentity: createGvisorTtlWatchdogImplementationIdentity({ watchdogSha256: WATCHDOG_SHA, watchdogSizeBytes: 123_456 }),
  })
  const lease = createGvisorTtlWatchdogLeaseRecord({ prepared, linuxBootId: BOOT_ID, leaseStartBoottimeNs: LEASE_START_NS })
  const controlPeer = createGvisorTtlControlPeerBinding({
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
  const ackBase = {
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
  const acknowledgement = Object.freeze({ ...ackBase, armAcknowledgementIdentity: r3gDHash("ARM_ACK", ackBase) }) as GvisorTtlArmAcknowledgement
  const arm = createGvisorTtlArmRecord({ prepared, lease, acknowledgement, subject })
  const armCommit = createGvisorTtlEvidenceCommit({
    kind: "arm",
    armOperationIdentity: arm.armOperationIdentity,
    leaseIdentity: arm.leaseIdentity,
    recordIdentity: arm.recordIdentity,
    payloadDigest: payloadDigest(arm),
  })
  const terminal = buildTerminal(arm, terminalOutcome)
  const terminalCommit = createGvisorTtlEvidenceCommit({
    kind: "terminal",
    armOperationIdentity: arm.armOperationIdentity,
    leaseIdentity: arm.leaseIdentity,
    recordIdentity: terminal.recordIdentity,
    payloadDigest: payloadDigest(terminal),
  })
  return { subject, prepared, lease, arm, armCommit, terminal, terminalCommit }
}

function fixtureOutput(
  requirement: SandboxExecutionRequirement,
  base: { executionAttemptIdentity: string; containerBindingIdentity: string; containerId: string; runtimeInstanceIdentity: string; terminalEvidenceIdentity: string },
) {
  const providerIdentity = "8".repeat(64)
  const socketEndpointIdentity = "9".repeat(64)
  const outputChannelIdentity = createGvisorOutputChannelIdentity({
    executionAttemptIdentity: base.executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity: base.containerBindingIdentity,
    containerId: base.containerId,
    providerIdentity,
    socketEndpointIdentity,
  })
  const record = createGvisorOutputBoundRecord({
    executionAttemptIdentity: base.executionAttemptIdentity,
    requirement,
    containerBindingIdentity: base.containerBindingIdentity,
    containerId: base.containerId,
    runtimeInstanceIdentity: base.runtimeInstanceIdentity,
    providerIdentity,
    socketEndpointIdentity,
    outputChannelIdentity,
    aggregation: {
      acceptedStdoutBytes: 0,
      acceptedStderrBytes: 0,
      acceptedAggregateBytes: 0,
      stdoutDigest: "1".repeat(64),
      stderrDigest: "2".repeat(64),
      aggregateTranscriptDigest: "3".repeat(64),
    },
    terminalEvidenceIdentity: base.terminalEvidenceIdentity,
  })
  return { record, commit: createGvisorOutputBoundCommit(record) }
}

function fixtureBundle(input: { terminalOutcome?: "natural-exit" | "indeterminate" } = {}) {
  const requirement = fixtureRequirement()
  const lineage = fixtureLineage(requirement)
  const resource = fixtureResource(requirement, lineage)
  const source = fixtureSource(requirement, lineage)
  const network = fixtureNetwork(requirement, lineage)
  const ttl = fixtureTtl(requirement, lineage, input.terminalOutcome ?? "natural-exit")
  const output = fixtureOutput(requirement, {
    executionAttemptIdentity: lineage.executionAttemptIdentity,
    containerBindingIdentity: lineage.binding.bindingIdentity,
    containerId: CONTAINER_ID,
    runtimeInstanceIdentity: lineage.lineage.runtimeInstanceIdentity,
    terminalEvidenceIdentity: ttl.terminal.recordIdentity,
  })
  const bundle: GvisorPhysicalEvidenceBundle = Object.freeze({
    resourceRecord: resource.record,
    resourceCommit: resource.commit,
    sourceRecord: source.record,
    sourceCommit: source.commit,
    networkRecord: network.record,
    networkCommit: network.commit,
    ttlArmRecord: ttl.arm,
    ttlArmCommit: ttl.armCommit,
    ttlTerminalRecord: ttl.terminal,
    ttlTerminalCommit: ttl.terminalCommit,
    outputRecord: output.record,
    outputCommit: output.commit,
  })
  return { requirement, lineage, resource, source, network, ttl, output, bundle }
}

function fixtureResolutionAndCoherence() {
  const fixture = fixtureBundle()
  const resolution = createGvisorPhysicalEvidenceResolution({
    trustedProvenanceIdentity: PROVENANCE_IDENTITY,
    bundle: fixture.bundle,
    requirement: fixture.requirement,
  })
  const coherence = createGvisorPhysicalSubjectCoherence({
    executionAttemptIdentity: fixture.bundle.resourceRecord.executionAttemptIdentity,
    requirementIdentity: fixture.requirement.requirementIdentity,
    workloadIdentity: fixture.requirement.workload.workloadIdentity,
    containerBindingIdentity: fixture.bundle.resourceRecord.containerBindingIdentity,
    containerId: fixture.bundle.resourceRecord.containerId,
    runtimeInstanceIdentity: fixture.bundle.resourceRecord.runtimeInstanceIdentity,
    resourceRuntimeLineageIdentity: fixture.bundle.resourceRecord.r3eRecordIdentity,
    sourceRuntimeLineageIdentity: fixture.bundle.sourceRecord.runtimeLineageIdentity,
    networkBeforeRuntimeLineageIdentity: fixture.bundle.networkRecord.r3eBeforeRecordIdentity,
    networkAfterRuntimeLineageIdentity: fixture.bundle.networkRecord.r3eAfterRecordIdentity,
    resourceRecordIdentity: fixture.bundle.resourceRecord.resourceCandidateIdentity,
    sourceRecordIdentity: fixture.bundle.sourceRecord.recordIdentity,
    networkRecordIdentity: fixture.bundle.networkRecord.recordIdentity,
    ttlArmRecordIdentity: fixture.bundle.ttlArmRecord.recordIdentity,
    ttlTerminalRecordIdentity: fixture.bundle.ttlTerminalRecord.recordIdentity,
    outputRecordIdentity: fixture.bundle.outputRecord.recordIdentity,
  })
  return { ...fixture, resolution, coherence }
}

function replaceOutput(fixture: ReturnType<typeof fixtureBundle>, overrides: Partial<{ executionAttemptIdentity: string; containerBindingIdentity: string; containerId: string; runtimeInstanceIdentity: string; terminalEvidenceIdentity: string }>): GvisorPhysicalEvidenceBundle {
  const output = fixtureOutput(fixture.requirement, {
    executionAttemptIdentity: overrides.executionAttemptIdentity ?? fixture.lineage.executionAttemptIdentity,
    containerBindingIdentity: overrides.containerBindingIdentity ?? fixture.lineage.binding.bindingIdentity,
    containerId: overrides.containerId ?? CONTAINER_ID,
    runtimeInstanceIdentity: overrides.runtimeInstanceIdentity ?? fixture.lineage.lineage.runtimeInstanceIdentity,
    terminalEvidenceIdentity: overrides.terminalEvidenceIdentity ?? fixture.ttl.terminal.recordIdentity,
  })
  return Object.freeze({ ...fixture.bundle, outputRecord: output.record, outputCommit: output.commit })
}

const UNUSED_WORKSPACE = Object.freeze({ root: "/unused-r3g-f-boundary" }) as any

test("H4-R3G-F exact positive conjunction mints one canonical R3B E4 proof", () => {
  const { requirement, bundle, resolution, coherence } = fixtureResolutionAndCoherence()
  assert.deepEqual(validateGvisorPhysicalEvidenceBundle(bundle, requirement), bundle)
  assert.deepEqual(validateGvisorPhysicalEvidenceResolution(resolution, requirement), resolution)
  assert.deepEqual(validateGvisorPhysicalSubjectCoherence(coherence, requirement, resolution), coherence)

  const executionInstanceIdentity = createGvisorPhysicalExecutionInstanceIdentity(coherence)
  assert.match(executionInstanceIdentity, /^[0-9a-f]{64}$/)

  const mint = mintGvisorPhysicalProof(requirement, resolution, coherence)
  assert.equal(mint.capability.providerId, KDO_H4_R3G_F_PROVIDER_ID)
  assert.equal(mint.capability.supportsImmutableImageDigestObservation, true)
  assert.equal(mint.capability.supportsDenyAllNetworkObservation, true)
  assert.equal(mint.capability.supportsCpuBudgetObservation, true)
  assert.equal(mint.capability.supportsMemoryLimitObservation, true)
  assert.equal(mint.capability.supportsTtlObservation, true)
  assert.equal(mint.capability.supportsOutputLimitObservation, true)
  assert.equal(mint.observation.observedSourceDigest, requirement.workload.source.digest)
  assert.equal(mint.observation.observedSemanticRuntimeClass, "gvisor")
  assert.equal(mint.observation.downgradeOccurred, false)
  assert.equal(mint.observation.observedCredentialBindingIdentity, null)
  assert.equal(mint.evidence.observation.observationIdentity, mint.observation.observationIdentity)

  const record = createGvisorPhysicalConjunctionRecord({ requirement, resolution, coherence, mint })
  assert.equal(record.evidenceClass, KDO_H4_R3G_F_EVIDENCE_CLASS)
  const commit = createGvisorPhysicalConjunctionCommit(record)
  assert.deepEqual(validateGvisorPhysicalConjunctionCommit(commit, record), commit)
})

test("H4-R3G-F missing predecessor families and wrong durable commits fail closed", () => {
  const fixture = fixtureBundle()
  for (const key of ["resourceRecord", "sourceRecord", "networkRecord", "ttlArmRecord", "outputRecord"] as const) {
    const missing: any = { ...fixture.bundle }
    delete missing[key]
    assert.throws(() => validateGvisorPhysicalEvidenceBundle(missing, fixture.requirement), /exactly/)
  }
  for (const key of ["resourceCommit", "sourceCommit", "networkCommit", "ttlArmCommit", "ttlTerminalCommit", "outputCommit"] as const) {
    const bad: any = structuredClone(fixture.bundle)
    bad[key].commitIdentity = "0".repeat(64)
    assert.throws(() => validateGvisorPhysicalEvidenceBundle(bad, fixture.requirement))
  }
})

test("H4-R3G-F same values with another attempt/runtime/container cannot conjoin", () => {
  const fixture = fixtureBundle()
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(replaceOutput(fixture, { executionAttemptIdentity: "a".repeat(64) }), fixture.requirement), /executionAttemptIdentity/)
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(replaceOutput(fixture, { runtimeInstanceIdentity: "b".repeat(64) }), fixture.requirement), /runtimeInstanceIdentity/)
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(replaceOutput(fixture, { containerBindingIdentity: "c".repeat(64), containerId: "d".repeat(64) }), fixture.requirement), /containerBindingIdentity|containerId/)
})

test("H4-R3G-F source/network/resource/TTL/output theorem drift fails closed", () => {
  const fixture = fixtureBundle()

  const otherSource = fixtureSource(fixture.requirement, fixture.lineage, `sha256:${"4".repeat(64)}`)
  assert.throws(() => validateGvisorPhysicalEvidenceBundle({ ...fixture.bundle, sourceRecord: otherSource.record, sourceCommit: otherSource.commit }, fixture.requirement), /source digest/)

  const badNetwork: any = structuredClone(fixture.bundle)
  badNetwork.networkRecord.networkPolicy = "allow-all"
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(badNetwork, fixture.requirement))

  const badCpu: any = structuredClone(fixture.bundle)
  badCpu.resourceRecord.effectiveCpuNumerator = "2"
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(badCpu, fixture.requirement))

  const badMemory: any = structuredClone(fixture.bundle)
  badMemory.resourceRecord.effectiveMemoryBytes = "1"
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(badMemory, fixture.requirement))

  const badTtl: any = structuredClone(fixture.bundle)
  badTtl.ttlArmRecord.ttlMs += 1
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(badTtl, fixture.requirement))

  const badOutput: any = structuredClone(fixture.bundle)
  badOutput.outputRecord.maxOutputBytes -= 1
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(badOutput, fixture.requirement))
})

test("H4-R3G-F wrong terminal linkage and indeterminate lifecycle cannot become E4", () => {
  const fixture = fixtureBundle()
  const wrongTerminal = replaceOutput(fixture, { terminalEvidenceIdentity: "e".repeat(64) })
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(wrongTerminal, fixture.requirement), /different TTL terminal/)

  const indeterminate = fixtureBundle({ terminalOutcome: "indeterminate" })
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(indeterminate.bundle, indeterminate.requirement), /indeterminate/)

  const failureShaped: any = { ...fixture.bundle, outputRecord: { version: "failure", reason: "output-limit-exceeded" } }
  assert.throws(() => validateGvisorPhysicalEvidenceBundle(failureShaped, fixture.requirement))
})

test("H4-R3G-F final coherence cannot be replayed with substituted record lineage", () => {
  const { requirement, resolution, coherence } = fixtureResolutionAndCoherence()
  const substituted = createGvisorPhysicalSubjectCoherence({
    executionAttemptIdentity: coherence.executionAttemptIdentity,
    requirementIdentity: coherence.requirementIdentity,
    workloadIdentity: coherence.workloadIdentity,
    containerBindingIdentity: coherence.containerBindingIdentity,
    containerId: coherence.containerId,
    runtimeInstanceIdentity: coherence.runtimeInstanceIdentity,
    resourceRuntimeLineageIdentity: coherence.resourceRuntimeLineageIdentity,
    sourceRuntimeLineageIdentity: "0".repeat(64),
    networkBeforeRuntimeLineageIdentity: coherence.networkBeforeRuntimeLineageIdentity,
    networkAfterRuntimeLineageIdentity: coherence.networkAfterRuntimeLineageIdentity,
    resourceRecordIdentity: coherence.resourceRecordIdentity,
    sourceRecordIdentity: coherence.sourceRecordIdentity,
    networkRecordIdentity: coherence.networkRecordIdentity,
    ttlArmRecordIdentity: coherence.ttlArmRecordIdentity,
    ttlTerminalRecordIdentity: coherence.ttlTerminalRecordIdentity,
    outputRecordIdentity: coherence.outputRecordIdentity,
  })
  assert.throws(() => validateGvisorPhysicalSubjectCoherence(substituted, requirement, resolution), /sourceRuntimeLineageIdentity/)
})

test("H4-R3G-F implementation and observer identities bind the conjunction theorem", () => {
  const implementation = createGvisorPhysicalConjunctionImplementationIdentity()
  const observer = createGvisorPhysicalConjunctionObserverIdentity()
  assert.match(implementation, /^[0-9a-f]{64}$/)
  assert.match(observer, /^[0-9a-f]{64}$/)
  assert.notEqual(observer, createGvisorCgroupV2ObserverProtocolIdentity())
  assert.notEqual(observer, createGvisorOutputObserverImplementationIdentity())
  assert.notEqual(implementation, r3gFHash("IMPLEMENTATION", [KDO_H4_R3G_F_PROVIDER_ID, "synthetic-material-theorem-change"]))

  for (const value of [
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
  ]) assert.equal(typeof value, "string")
})

test("H4-R3G-F non-null credentials and runtime downgrade inputs fail before E4", () => {
  const requirement = fixtureRequirement()
  assert.throws(() => createSandboxWorkloadRequest({
    source: requirement.workload.source,
    entrypoint: requirement.workload.entrypoint,
    resourcePolicy: requirement.workload.resourcePolicy,
    networkPolicy: requirement.workload.networkPolicy,
    confinement: requirement.workload.confinement,
    credentialBindingIdentity: "a".repeat(64) as any,
  }), /credentialBindingIdentity/)

  const { resolution, coherence } = fixtureResolutionAndCoherence()
  const downgraded = fixtureRequirement({ runtime: "kata-qemu" })
  assert.throws(() => mintGvisorPhysicalProof(downgraded, resolution, coherence))
})

test("H4-R3G-F package root exposes only final API and adds no privileged read/mutation surface", () => {
  const indexSource = readFileSync(new URL("../src/index.ts", import.meta.url), "utf8")
  assert.match(indexSource, /GvisorPhysicalProofExecutionGateway/)
  assert.doesNotMatch(indexSource, /createGvisorPhysicalConjunctionRuntime/)
  assert.doesNotMatch(indexSource, /validateGvisorPhysicalEvidenceBundle/)
  assert.doesNotMatch(indexSource, /export \* from "\.\/trust\/sandbox-physical-conjunction-gvisor\.ts"/)

  const conjunctionSource = readFileSync(new URL("../src/trust/sandbox-physical-conjunction-gvisor.ts", import.meta.url), "utf8")
  const runtimeSource = readFileSync(new URL("../src/execution/gateway-gvisor-physical-proof-runtime.ts", import.meta.url), "utf8")
  for (const forbidden of ["node:fs", "node:net", "node:http", "node:https", "node:child_process", "node:dgram"]) {
    assert.equal(conjunctionSource.includes(forbidden), false, forbidden)
    assert.equal(runtimeSource.includes(forbidden), false, forbidden)
  }
  for (const forbidden of ["/proc/", "/sys/fs/cgroup", "docker kill", "docker stop", "docker start", "docker remove", "execFile(", "spawn("]) {
    assert.equal(conjunctionSource.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden)
    assert.equal(runtimeSource.toLowerCase().includes(forbidden.toLowerCase()), false, forbidden)
  }
})

test("H4-R3G-F runtime rejects structurally valid but unbranded caller injection", () => {
  const fake = {
    version: "kodac-h4-r3g-f-physical-proof-runtime-v1",
    resolveEvidence() {},
    revalidateSubject() {},
    commitConjunctionEvidence() {},
  }
  assert.throws(() => new GvisorPhysicalProofExecutionGateway({ filesystem: UNUSED_WORKSPACE, policy: fixedPolicy("allow"), conjunctionRuntime: fake as any }), /trusted K2 composition/)
})

test("H4-R3G-F gateway withholds positive evidence until durable commit and exact replay is immutable", { skip: process.platform !== "linux" }, async () => {
  const fixture = fixtureResolutionAndCoherence()
  let releaseCommit!: () => void
  const commitGate = new Promise<void>((resolve) => { releaseCommit = resolve })
  let commitStarted = false
  const runtime = createGvisorPhysicalConjunctionRuntime({
    resolveEvidence: () => fixture.resolution,
    revalidateSubject: () => fixture.coherence,
    commitConjunctionEvidence: async (record) => {
      commitStarted = true
      await commitGate
      return createGvisorPhysicalConjunctionCommit(record)
    },
  })
  const gateway = new GvisorPhysicalProofExecutionGateway({ filesystem: UNUSED_WORKSPACE, policy: fixedPolicy("allow"), conjunctionRuntime: runtime })
  const pending = gateway.proveGvisorPhysicalExecution(fixture.requirement)
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.equal(commitStarted, true)
  let escaped = false
  void pending.then(() => { escaped = true }, () => { escaped = true })
  await new Promise<void>((resolve) => setImmediate(resolve))
  assert.equal(escaped, false)
  releaseCommit()
  const first = await pending
  assert.equal(first.record.evidenceClass, KDO_H4_R3G_F_EVIDENCE_CLASS)

  const replayRuntime = createGvisorPhysicalConjunctionRuntime({
    resolveEvidence: () => fixture.resolution,
    revalidateSubject: () => fixture.coherence,
    commitConjunctionEvidence: (record) => createGvisorPhysicalConjunctionCommit(record),
  })
  const replayGateway = new GvisorPhysicalProofExecutionGateway({ filesystem: UNUSED_WORKSPACE, policy: fixedPolicy("allow"), conjunctionRuntime: replayRuntime })
  const second = await replayGateway.proveGvisorPhysicalExecution(fixture.requirement)
  assert.equal(second.evidence.evidenceIdentity, first.evidence.evidenceIdentity)
  assert.equal(second.record.recordIdentity, first.record.recordIdentity)
  assert.equal(second.commit.commitIdentity, first.commit.commitIdentity)
})

test("H4-R3G-F durable failure and ASK never yield positive evidence", { skip: process.platform !== "linux" }, async () => {
  const fixture = fixtureResolutionAndCoherence()
  let resolved = 0
  const failedRuntime = createGvisorPhysicalConjunctionRuntime({
    resolveEvidence: () => { resolved += 1; return fixture.resolution },
    revalidateSubject: () => fixture.coherence,
    commitConjunctionEvidence: () => { throw new Error("durable commit failed") },
  })
  const failedGateway = new GvisorPhysicalProofExecutionGateway({ filesystem: UNUSED_WORKSPACE, policy: fixedPolicy("allow"), conjunctionRuntime: failedRuntime })
  await assert.rejects(() => failedGateway.proveGvisorPhysicalExecution(fixture.requirement), ExecutionFailedError)
  assert.equal(resolved, 1)

  let askTouchedRuntime = false
  const askRuntime = createGvisorPhysicalConjunctionRuntime({
    resolveEvidence: () => { askTouchedRuntime = true; return fixture.resolution },
    revalidateSubject: () => { askTouchedRuntime = true; return fixture.coherence },
    commitConjunctionEvidence: (record) => { askTouchedRuntime = true; return createGvisorPhysicalConjunctionCommit(record) },
  })
  const askGateway = new GvisorPhysicalProofExecutionGateway({ filesystem: UNUSED_WORKSPACE, policy: fixedPolicy("ask"), conjunctionRuntime: askRuntime })
  await assert.rejects(() => askGateway.proveGvisorPhysicalExecution(fixture.requirement), ExecutionBlockedError)
  assert.equal(askTouchedRuntime, false)
})
