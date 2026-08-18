import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { createServer as createHttpServer, type Server as HttpServer } from "node:http"
import { createServer as createNetServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Duplex } from "node:stream"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import {
  GvisorOutputExecutionGateway,
  KDO_H4_R3G_E_ATTACH_MEDIA_TYPE,
  KDO_H4_R3G_E_RUNTIME_VERSION,
  createGvisorOutputFailureCommit,
  createGvisorOutputReservation,
  type GvisorOutputFailureRecord,
  type GvisorOutputPreparedOperation,
  type GvisorOutputRuntimeConfig,
} from "../src/execution/gateway-gvisor-output-runtime.ts"
import { KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION } from "../src/execution/gateway-gvisor-ttl-recovery-runtime.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3F_BINDING_VERSION,
  KDO_H4_R3F_DOCKER_API_VERSION,
  KDO_H4_R3F_LABELS,
  KDO_H4_R3F_PROVIDER_ID,
  createDockerControlPlaneBindingProvider,
  createDockerSocketEndpointIdentity,
  type DockerControlPlaneBindingProvider,
  type DockerControlPlaneResolution,
  type DockerSocketEndpointIdentity,
} from "../src/trust/sandbox-observer-docker-control-plane.ts"
import {
  KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
  createGvisorTtlEvidenceCommit,
  createGvisorTtlSubjectBinding,
  payloadDigest,
  type GvisorTtlRuntimeConfig,
} from "../src/trust/sandbox-lifecycle-gvisor-ttl.ts"
import {
  createGvisorContainerBinding,
  createGvisorExecutionAttemptIdentity,
  createGvisorObserverArtifact,
  createGvisorRuntimeLineageRecord,
  type GvisorContainerBinding,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  createGvisorObserverPlan,
  createGvisorRuntimeObservationCandidate,
  parseGvisorProcessObservation,
  parseGvisorStateOutput,
  parseGvisorStatsOutput,
} from "../src/trust/sandbox-observer-gvisor.ts"
import { createGvisorOutputBoundCommit, type GvisorOutputBoundRecord } from "../src/trust/sandbox-output-gvisor.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import { fixedPolicy } from "../src/trust/policy.ts"

const CONTAINER_ID = "1".repeat(64)
const WORKSPACE_ID = "a".repeat(64)
const EXECUTION_INTENT_ID = "b".repeat(64)
const SOURCE_DIGEST = `sha256:${"2".repeat(64)}`
const ROOTFS_DIFF_ID = `sha256:${"3".repeat(64)}`

const PROTOCOL_FIXTURE = String.raw`#!/usr/bin/python3
import hashlib
import sys
import time

argv = sys.argv[1:]
expected = [
    "--registry-root", "--arm-operation", "--arm-payload-digest", "--execution-attempt",
    "--requirement", "--workload", "--container-binding", "--container-id",
    "--runtime-instance", "--ttl-ms", "--watchdog-implementation", "--control-socket",
    "--socket-device-inode", "--peer-pid-uid-gid", "--process-tuple", "--runsc-artifact",
    "--runsc-sha256",
]
if len(argv) != 1 + len(expected) * 2 or argv[0] != "--arm":
    raise SystemExit(125)
values = {}
for index, flag in enumerate(expected):
    position = 1 + index * 2
    if argv[position] != flag:
        raise SystemExit(125)
    values[flag] = argv[position + 1]

def wd(domain, parts):
    digest = hashlib.sha256()
    for value in ["KODAC-H4-R3G-D-WATCHDOG", domain, "V1", *parts]:
        digest.update(value.encode("utf-8"))
        digest.update(b"\0")
    return digest.hexdigest()

arm = values["--arm-operation"]
payload = values["--arm-payload-digest"]
execution = values["--execution-attempt"]
requirement = values["--requirement"]
workload = values["--workload"]
binding = values["--container-binding"]
container = values["--container-id"]
runtime = values["--runtime-instance"]
ttl = values["--ttl-ms"]
watchdog = values["--watchdog-implementation"]
socket_dev, socket_ino = values["--socket-device-inode"].split(":")
peer_pid, peer_uid, peer_gid = values["--peer-pid-uid-gid"].split(":")
start_ticks, exe_dev, exe_ino, exe_size = values["--process-tuple"].split(":")
runsc_artifact = values["--runsc-artifact"]
runsc_sha = values["--runsc-sha256"]
boot = open("/proc/sys/kernel/random/boot_id", "r", encoding="ascii").read().strip()
lease_start = "100000000000"
deadline = str(int(lease_start) + int(ttl) * 1000000)
owner_updated = str(int(lease_start) + 1)
clock = wd("CLOCK_DOMAIN", [boot, "CLOCK_BOOTTIME"])
lease = wd("LEASE", [arm, payload, runtime, boot, lease_start, deadline, watchdog])
owner = wd("OWNER_INSTANCE", [arm, runtime, boot])
fence = "1"
claim = wd("OWNER_CLAIM", ["kodac-h4-r3g-d-owner-claim-v1", lease, arm, owner, fence, "ACTIVE", owner_updated, boot])
control = wd("CONTROL_PEER", [runtime, container, socket_dev, socket_ino, peer_pid, peer_uid, peer_gid, start_ticks, exe_dev, exe_ino, exe_size, runsc_sha])
registry = wd("LEASE_REGISTRY", [
    "kodac-h4-r3g-d-watchdog-lease-v1", arm, payload, lease, execution, requirement,
    workload, binding, container, runtime, ttl, boot, clock, lease_start, deadline,
    watchdog, owner, fence, claim,
])
physical_ack = wd("PHYSICAL_ARM_ACK", [lease, arm, runtime, control, runsc_artifact, runsc_sha, registry, clock, boot, owner, claim])
print(
    "kodac-gvisor-ttl-arm-v1"
    + f" lease={lease} arm-operation={arm} runtime-instance={runtime} control-peer={control}"
    + f" runsc-artifact={runsc_artifact} verified-runsc-sha256={runsc_sha} registry-record={registry}"
    + f" clock-domain={clock} boot-id={boot} lease-start-boottime-ns={lease_start} deadline-boottime-ns={deadline}"
    + f" owner-instance={owner} terminal-fence-token={fence} owner-updated-boottime-ns={owner_updated} claim-record={claim} physical-ack={physical_ack}",
    flush=True,
)
time.sleep(0.5)
retained_pidfd = wd("PIDFD_PROCESS", [peer_pid, start_ticks, exe_dev, exe_ino, exe_size, runtime])
retained_runsc = wd("RUNSC_EXECUTABLE", [runsc_sha, exe_dev, exe_ino, exe_size, runsc_artifact])
exit_ns = str(int(lease_start) + 2)
raw_termination = wd("FIXTURE_RAW_TERMINATION", [lease, arm])
termination = wd("TERMINATION_ACK", [lease, owner, fence, claim, raw_termination])
terminal_registry = wd("TERMINAL_REGISTRY", [
    arm, lease, runtime, "natural-exit", owner, fence, claim, control, retained_pidfd,
    runsc_artifact, runsc_sha, retained_runsc, clock, boot, exit_ns, "-", "-", "-", "-", termination,
])
print(
    "kodac-gvisor-ttl-terminal-v1"
    + f" lease={lease} arm-operation={arm} runtime-instance={runtime} outcome=natural-exit"
    + f" owner-instance={owner} terminal-fence-token={fence} claim-record={claim} control-peer={control}"
    + f" socket-device={socket_dev} socket-inode={socket_ino} peer-pid={peer_pid} peer-uid={peer_uid} peer-gid={peer_gid}"
    + f" retained-pidfd-process={retained_pidfd} runsc-artifact={runsc_artifact} verified-runsc-sha256={runsc_sha}"
    + f" retained-runsc-executable={retained_runsc} clock-domain={clock} boot-id={boot}"
    + f" exit-event-boottime-ns={exit_ns} live-at-expiry-boottime-ns=- live-probe=- process-set=- signal-ack=-"
    + f" termination-ack={termination} registry-terminal={terminal_registry}",
    flush=True,
)
`

function hash(prefix: string, domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`${prefix}\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}
function r3gcHash(domain: string, value: unknown): string { return hash("KODAC-H4-R3G-C", domain, value) }
function parseStartTicks(statText: string): bigint {
  const close = statText.lastIndexOf(")")
  assert.ok(close > 0)
  const fields = statText.slice(close + 2).trim().split(/\s+/)
  assert.ok(fields.length >= 20)
  return BigInt(fields[19])
}
async function sha256File(path: string): Promise<string> {
  return createHash("sha256").update(await readFile(path)).digest("hex")
}
async function closeNetServer(server: ReturnType<typeof createNetServer>): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()))
}
function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)) }

function fixtureRequirement(ttlMs = 60_000, maxOutputBytes = 8): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_ID,
    executionIntentIdentity: EXECUTION_INTENT_ID,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3ge-runtime-fixture", digest: SOURCE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536_870_912, ttlMs, maxOutputBytes }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function frame(stream: 1 | 2, payload: string): Buffer {
  const body = Buffer.from(payload, "utf8")
  const header = Buffer.alloc(8)
  header[0] = stream
  header.writeUInt32BE(body.byteLength, 4)
  return Buffer.concat([header, body])
}
function emptyFrame(stream: 1 | 2): Buffer {
  const header = Buffer.alloc(8)
  header[0] = stream
  return header
}

function listPath(requirement: SandboxExecutionRequirement): string {
  const filters = JSON.stringify({
    label: [
      `${KDO_H4_R3F_LABELS.bindingVersion}=${KDO_H4_R3F_BINDING_VERSION}`,
      `${KDO_H4_R3F_LABELS.requirementIdentity}=${requirement.requirementIdentity}`,
      `${KDO_H4_R3F_LABELS.workloadIdentity}=${requirement.workload.workloadIdentity}`,
    ],
    status: ["running"],
  })
  return `/v${KDO_H4_R3F_DOCKER_API_VERSION}/containers/json?all=1&filters=${encodeURIComponent(filters)}`
}
function sourceInfoPath(): string { return `/v${KDO_H4_R3F_DOCKER_API_VERSION}/info` }
function sourceImagePath(requirement: SandboxExecutionRequirement): string {
  const sourceReference = `${requirement.workload.source.repository}@${requirement.workload.source.digest}`
  return `/v${KDO_H4_R3F_DOCKER_API_VERSION}/images/${sourceReference}/json`
}

function dockerInspectValue(requirement: SandboxExecutionRequirement): Record<string, unknown> {
  return {
    Id: CONTAINER_ID,
    Path: requirement.workload.entrypoint.executable,
    Args: [...requirement.workload.entrypoint.args],
    State: { Running: true, Paused: false, Restarting: false, Dead: false, Pid: 4321 },
    RestartCount: 0,
    Image: requirement.workload.source.digest,
    HostConfig: {
      Runtime: "runsc",
      NetworkMode: "none",
      NanoCpus: requirement.workload.resourcePolicy.cpuMillis * 1_000_000,
      Memory: requirement.workload.resourcePolicy.memoryBytes,
      MemorySwap: requirement.workload.resourcePolicy.memoryBytes,
      Privileged: false,
      RestartPolicy: { Name: "no", MaximumRetryCount: 0 },
    },
    Config: {
      Image: requirement.workload.source.digest,
      AttachStdout: true,
      AttachStderr: true,
      AttachStdin: false,
      OpenStdin: false,
      Tty: false,
      Labels: {
        [KDO_H4_R3F_LABELS.bindingVersion]: KDO_H4_R3F_BINDING_VERSION,
        [KDO_H4_R3F_LABELS.requirementIdentity]: requirement.requirementIdentity,
        [KDO_H4_R3F_LABELS.workloadIdentity]: requirement.workload.workloadIdentity,
      },
    },
    NetworkSettings: { Networks: {} },
    ImageManifestDescriptor: {
      digest: requirement.workload.source.digest,
      mediaType: "application/vnd.oci.image.manifest.v1+json",
      size: 1234,
    },
  }
}
function dockerSystemInfoValue(): Record<string, unknown> {
  return {
    OSType: "linux",
    Driver: "overlayfs",
    DockerRootDir: "/var/lib/docker",
    Containerd: {
      Address: "/var/run/docker/containerd/containerd.sock",
      Namespaces: { Containers: "moby" },
    },
  }
}
function dockerSourceImageValue(requirement: SandboxExecutionRequirement): Record<string, unknown> {
  return {
    Descriptor: { digest: requirement.workload.source.digest },
    RootFS: { Type: "layers", Layers: [ROOTFS_DIFF_ID] },
  }
}

type FakeDocker = {
  readonly socketPath: string
  readonly requests: string[]
  close(): Promise<void>
}

type FakeDockerOptions = { readonly continuousEmptyFrames?: boolean }

async function startFakeDocker(root: string, requirement: SandboxExecutionRequirement, events: string[], options: FakeDockerOptions = {}): Promise<FakeDocker> {
  const socketPath = join(root, "docker.sock")
  const requests: string[] = []
  const sockets = new Set<Duplex>()
  const intervals = new Set<NodeJS.Timeout>()
  const expectedList = listPath(requirement)
  const expectedInspect = `/v1.48/containers/${CONTAINER_ID}/json?size=0`
  const expectedInfo = sourceInfoPath()
  const expectedSourceImage = sourceImagePath(requirement)
  const server: HttpServer = createHttpServer((request, response) => {
    const method = request.method ?? ""
    const url = request.url ?? ""
    requests.push(`${method} ${url}`)
    if (method !== "GET") { response.statusCode = 405; response.end(); return }
    if (url === expectedInfo) {
      response.statusCode = 200
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify(dockerSystemInfoValue()))
      return
    }
    if (url === expectedSourceImage) {
      response.statusCode = 200
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify(dockerSourceImageValue(requirement)))
      return
    }
    if (url === expectedList) {
      response.statusCode = 200
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify([{ Id: CONTAINER_ID, State: "running" }]))
      return
    }
    if (url === expectedInspect) {
      response.statusCode = 200
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify(dockerInspectValue(requirement)))
      return
    }
    response.statusCode = 404
    response.end()
  })
  server.on("upgrade", (request, socket) => {
    sockets.add(socket)
    socket.on("error", () => {})
    socket.once("close", () => sockets.delete(socket))
    requests.push(`UPGRADE ${request.url ?? ""}`)
    events.push("output-capture")
    socket.write([
      "HTTP/1.1 101 UPGRADED",
      `Content-Type: ${KDO_H4_R3G_E_ATTACH_MEDIA_TYPE}`,
      "Connection: Upgrade",
      "Upgrade: tcp",
      "",
      "",
    ].join("\r\n"))
    if (options.continuousEmptyFrames) {
      socket.write(emptyFrame(1))
      const interval = setInterval(() => {
        if (!socket.destroyed) socket.write(emptyFrame(2))
      }, 5)
      intervals.add(interval)
      socket.once("close", () => { clearInterval(interval); intervals.delete(interval) })
      return
    }
    socket.end(Buffer.concat([frame(1, "abc"), frame(2, "de")]))
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(socketPath, () => { server.off("error", reject); resolve() })
  })
  return {
    socketPath,
    requests,
    async close() {
      for (const interval of intervals) clearInterval(interval)
      intervals.clear()
      for (const socket of sockets) socket.destroy()
      server.closeAllConnections()
      if (!server.listening) return
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

function fakeProvider(requirementIdentity: string, workloadIdentity: string): DockerControlPlaneBindingProvider {
  const endpoint: DockerSocketEndpointIdentity = Object.freeze({ device: "1", inode: "2", uid: "0", gid: "0", mode: "49663", endpointIdentity: "6".repeat(64) })
  const unavailable = async (): Promise<DockerControlPlaneResolution> => { throw new Error("fake provider resolution must not be called") }
  const unavailableBinding = async (): Promise<GvisorContainerBinding> => { throw new Error("fake provider binding must not be called") }
  return Object.freeze({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: "5".repeat(64),
    socketEndpoint: endpoint,
    requirementIdentity,
    workloadIdentity,
    resolveDockerControlPlaneBinding: unavailable,
    resolveContainerBinding: unavailableBinding,
  })
}
async function forgedProviderForSocket(requirement: SandboxExecutionRequirement, socketPath: string): Promise<DockerControlPlaneBindingProvider> {
  const stats = await stat(socketPath, { bigint: true })
  const endpoint = createDockerSocketEndpointIdentity({
    device: stats.dev.toString(),
    inode: stats.ino.toString(),
    uid: stats.uid.toString(),
    gid: stats.gid.toString(),
    mode: stats.mode.toString(),
  })
  const unavailable = async (): Promise<DockerControlPlaneResolution> => { throw new Error("forged provider resolution must never run") }
  const unavailableBinding = async (): Promise<GvisorContainerBinding> => { throw new Error("forged provider binding must never run") }
  return Object.freeze({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: "7".repeat(64),
    socketEndpoint: endpoint,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    resolveDockerControlPlaneBinding: unavailable,
    resolveContainerBinding: unavailableBinding,
  })
}

type RuntimeFixture = {
  readonly root: string
  readonly requirement: SandboxExecutionRequirement
  readonly binding: GvisorContainerBinding
  readonly runtimeInstanceIdentity: string
  readonly events: string[]
  readonly docker: FakeDocker
  readonly dockerControlPlane: DockerControlPlaneBindingProvider
  readonly ttlRuntime: GvisorTtlRuntimeConfig
  createGateway(outputRuntime: GvisorOutputRuntimeConfig, overrides?: { readonly dockerControlPlane?: DockerControlPlaneBindingProvider; readonly dockerSocketPath?: string }): GvisorOutputExecutionGateway
  cleanup(): Promise<void>
}

async function createRuntimeFixture(options: FakeDockerOptions = {}): Promise<RuntimeFixture> {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3ge-runtime-"))
  const watchdogPath = join(root, "watchdog-fixture.py")
  const controlSocketPath = join(root, "control.sock")
  const events: string[] = []
  const controlServer = createNetServer()
  await writeFile(watchdogPath, PROTOCOL_FIXTURE, { mode: 0o755 })
  await chmod(watchdogPath, 0o755)
  await new Promise<void>((resolvePromise, rejectPromise) => {
    controlServer.once("error", rejectPromise)
    controlServer.listen(controlSocketPath, () => { controlServer.off("error", rejectPromise); resolvePromise() })
  })
  const requirement = fixtureRequirement(60_000, 8)
  const docker = await startFakeDocker(root, requirement, events, options)
  const dockerControlPlane = createDockerControlPlaneBindingProvider({ socketPath: docker.socketPath, requirement })
  const controlStat = await stat(controlSocketPath, { bigint: true })
  const exeStat = await stat("/proc/self/exe", { bigint: true })
  const startTicks = parseStartTicks(await readFile("/proc/self/stat", "utf8"))
  const runscSha = await sha256File("/proc/self/exe")
  const watchdogSha = await sha256File(watchdogPath)
  const getuid = process.getuid
  const getgid = process.getgid
  assert.equal(typeof getuid, "function")
  assert.equal(typeof getgid, "function")
  if (typeof getuid !== "function" || typeof getgid !== "function") throw new Error("Linux uid/gid primitives unavailable")

  const attempt = createGvisorExecutionAttemptIdentity({
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    nonce: "123e4567-e89b-42d3-a456-426614174055",
  })
  const binding = createGvisorContainerBinding({
    providerId: "docker-engine",
    executionAttemptIdentity: attempt,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerId: CONTAINER_ID,
  })
  const plan = createGvisorObserverPlan({ runscPath: "/proc/self/exe", expectedRunscSha256: runscSha, runtimeRoot: "/run/runsc", containerId: CONTAINER_ID })
  const state = parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: CONTAINER_ID, status: "running", pid: process.pid, bundle: `/run/containerd/${CONTAINER_ID}` }), plan)
  const stats = parseGvisorStatsOutput(JSON.stringify({ type: "stats", id: CONTAINER_ID, data: { pids: { current: 2 } } }), plan)
  const processObservation = parseGvisorProcessObservation(`kodac-gvisor-proc-v1 pid=${process.pid} start-ticks=${startTicks} exe-dev=${exeStat.dev} exe-ino=${exeStat.ino} exe-size=${exeStat.size}\n`)
  const candidate = createGvisorRuntimeObservationCandidate({ plan, state, stats, process: processObservation })
  const runsc = createGvisorObserverArtifact({ role: "runsc", sha256: runscSha, sizeBytes: Number(exeStat.size) })
  const helper = createGvisorObserverArtifact({ role: "observer-helper", sha256: "d".repeat(64), sizeBytes: 123_456 })
  const lineage = createGvisorRuntimeLineageRecord({ executionAttemptIdentity: attempt, requirement, binding, runsc, helper, plan, state, stats, process: processObservation, candidate })
  const endpointBase = Object.freeze({
    path: controlSocketPath,
    device: controlStat.dev.toString(),
    inode: controlStat.ino.toString(),
    uid: controlStat.uid.toString(),
    gid: controlStat.gid.toString(),
    mode: controlStat.mode.toString(),
    parentAuthorityIdentity: "f".repeat(64),
  })
  const controlEndpoint = Object.freeze({
    ...endpointBase,
    endpointIdentity: r3gcHash("CONTROL_ENDPOINT", [endpointBase.path, endpointBase.device, endpointBase.inode, endpointBase.uid, endpointBase.gid, endpointBase.mode, endpointBase.parentAuthorityIdentity]),
  })
  const subject = createGvisorTtlSubjectBinding({
    binding,
    lineage,
    state,
    process: processObservation,
    runscArtifact: runsc,
    controlEndpoint,
    expectedPeerUid: String(getuid()),
    expectedPeerGid: String(getgid()),
  })
  const ttlRuntime: GvisorTtlRuntimeConfig = {
    version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
    watchdogPath,
    expectedWatchdogSha256: watchdogSha,
    registryRoot: root,
    resolveSubject(value) { assert.equal(value.requirementIdentity, requirement.requirementIdentity); return subject },
    commitPreparedIntent(record) {
      events.push("ttl-prepared")
      return createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: record.armOperationIdentity, leaseIdentity: null, recordIdentity: record.intentIdentity, payloadDigest: payloadDigest(record) })
    },
    commitArmEvidence(record) {
      events.push("ttl-arm")
      return createGvisorTtlEvidenceCommit({ kind: "arm", armOperationIdentity: record.armOperationIdentity, leaseIdentity: record.leaseIdentity, recordIdentity: record.recordIdentity, payloadDigest: payloadDigest(record) })
    },
    commitTerminalEvidence(record) {
      events.push("ttl-terminal")
      return createGvisorTtlEvidenceCommit({ kind: "terminal", armOperationIdentity: record.armOperationIdentity, leaseIdentity: record.leaseIdentity, recordIdentity: record.recordIdentity, payloadDigest: payloadDigest(record) })
    },
  }
  const createGateway = (outputRuntime: GvisorOutputRuntimeConfig, overrides: { readonly dockerControlPlane?: DockerControlPlaneBindingProvider; readonly dockerSocketPath?: string } = {}) => new GvisorOutputExecutionGateway({
    filesystem: new NodeWorkspaceFileSystem(root),
    policy: fixedPolicy("allow", "R3G-E fixture allow"),
    dockerControlPlane: overrides.dockerControlPlane ?? dockerControlPlane,
    dockerSocketPath: overrides.dockerSocketPath ?? docker.socketPath,
    outputRuntime,
    ttlRuntime,
    recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { return [] } },
  })
  return {
    root,
    requirement,
    binding,
    runtimeInstanceIdentity: lineage.runtimeInstanceIdentity,
    events,
    docker,
    dockerControlPlane,
    ttlRuntime,
    createGateway,
    async cleanup() {
      await docker.close()
      if (controlServer.listening) await closeNetServer(controlServer).catch(() => {})
      await rm(root, { recursive: true, force: true })
    },
  }
}

function createOutputRuntime(events: string[], reservations: Map<string, GvisorOutputPreparedOperation>): GvisorOutputRuntimeConfig {
  return {
    version: KDO_H4_R3G_E_RUNTIME_VERSION,
    reserveOutputOperation(prepared) {
      events.push("output-reserve")
      const existing = reservations.get(prepared.executionAttemptIdentity)
      if (existing === undefined) {
        reservations.set(prepared.executionAttemptIdentity, prepared)
        return createGvisorOutputReservation(prepared, "created")
      }
      assert.deepEqual(existing, prepared, "duplicate attempt must preserve exact PREPARED bytes")
      return createGvisorOutputReservation(prepared, "exists")
    },
    commitOutputEvidence(record: GvisorOutputBoundRecord) {
      events.push("output-positive")
      return createGvisorOutputBoundCommit(record)
    },
    commitFailureEvidence(failure: GvisorOutputFailureRecord) {
      events.push(`output-failure:${failure.reason}`)
      return createGvisorOutputFailureCommit(failure)
    },
  }
}

test("H4-R3G-E K2 gateway orders durable ARM -> reservation -> canonical R3F Docker capture and commits positive evidence only after terminal", { skip: process.platform !== "linux", timeout: 15_000 }, async () => {
  const fixture = await createRuntimeFixture()
  const reservations = new Map<string, GvisorOutputPreparedOperation>()
  const outputRuntime = createOutputRuntime(fixture.events, reservations)
  try {
    const first = await fixture.createGateway(outputRuntime).enforceGvisorOutputBound(fixture.requirement)
    assert.equal(first.subject.binding.executionAttemptIdentity, fixture.binding.executionAttemptIdentity)
    assert.equal(first.capture.binding.bindingIdentity, fixture.binding.bindingIdentity)
    assert.equal(first.record.executionAttemptIdentity, fixture.binding.executionAttemptIdentity)
    assert.equal(first.record.runtimeInstanceIdentity, fixture.runtimeInstanceIdentity)
    assert.equal(first.record.terminalEvidenceIdentity, first.terminal.recordIdentity)
    assert.equal(first.record.acceptedAggregateBytes, 5)

    const preparedIndex = fixture.events.indexOf("ttl-prepared")
    const armIndex = fixture.events.indexOf("ttl-arm")
    const reserveIndex = fixture.events.indexOf("output-reserve")
    const captureIndex = fixture.events.indexOf("output-capture")
    const terminalIndex = fixture.events.indexOf("ttl-terminal")
    const positiveIndex = fixture.events.indexOf("output-positive")
    assert.ok(preparedIndex >= 0 && preparedIndex < armIndex, "TTL PREPARED must precede durable ARM")
    assert.ok(armIndex < reserveIndex, "durable R3G-D ARM must precede R3G-E output reservation")
    assert.ok(reserveIndex < captureIndex, "durable output reservation must precede any Docker attach capture")
    assert.ok(terminalIndex >= 0 && terminalIndex < positiveIndex, "positive output evidence must follow durable terminal lifecycle evidence")
    assert.equal(fixture.docker.requests.filter((entry) => entry.startsWith("UPGRADE ")).length, 1)
    assert.equal(fixture.docker.requests.includes(`GET ${sourceInfoPath()}`), true)
    assert.equal(fixture.docker.requests.includes(`GET ${sourceImagePath(fixture.requirement)}`), true)

    await assert.rejects(fixture.createGateway(outputRuntime).enforceGvisorOutputBound(fixture.requirement), /already exists|cannot be replenished/)
    assert.equal(fixture.docker.requests.filter((entry) => entry.startsWith("UPGRADE ")).length, 1, "fresh gateway transport must not bypass durable reservation replay")
    assert.equal(reservations.size, 1)
    await delay(600)
  } finally { await fixture.cleanup() }
})

test("H4-R3G-E lifecycle terminal aborts continuous zero-length output and commits indeterminate failure instead of hanging", { skip: process.platform !== "linux", timeout: 5_000 }, async () => {
  const fixture = await createRuntimeFixture({ continuousEmptyFrames: true })
  const reservations = new Map<string, GvisorOutputPreparedOperation>()
  const outputRuntime = createOutputRuntime(fixture.events, reservations)
  const started = Date.now()
  try {
    await assert.rejects(fixture.createGateway(outputRuntime).enforceGvisorOutputBound(fixture.requirement), /aborted/)
    const elapsed = Date.now() - started
    assert.ok(elapsed < 3_000, `lifecycle-first fail-closed path took too long: ${elapsed}ms`)
    assert.equal(fixture.events.includes("ttl-terminal"), true)
    assert.equal(fixture.events.includes("output-failure:indeterminate"), true)
    assert.equal(fixture.events.includes("output-positive"), false)
    assert.equal(fixture.docker.requests.filter((entry) => entry.startsWith("UPGRADE ")).length, 1)
  } finally { await fixture.cleanup() }
})

test("H4-R3G-E abort during durable reservation waits for authoritative mutation settlement before failing and never attaches", { skip: process.platform !== "linux", timeout: 5_000 }, async () => {
  const fixture = await createRuntimeFixture()
  const controller = new AbortController()
  let mutationSettled = false
  let enforcementSettled = false
  let resolveReservationStarted!: () => void
  const reservationStarted = new Promise<void>((resolve) => { resolveReservationStarted = resolve })
  const outputRuntime: GvisorOutputRuntimeConfig = {
    version: KDO_H4_R3G_E_RUNTIME_VERSION,
    async reserveOutputOperation(prepared) {
      fixture.events.push("output-reserve-start")
      resolveReservationStarted()
      controller.abort()
      await delay(120)
      mutationSettled = true
      fixture.events.push("output-reserve-settled")
      return createGvisorOutputReservation(prepared, "created")
    },
    commitOutputEvidence() { throw new Error("positive evidence must not commit after abort") },
    commitFailureEvidence(failure) {
      fixture.events.push(`output-failure:${failure.reason}`)
      return createGvisorOutputFailureCommit(failure)
    },
  }
  try {
    const enforcement = fixture.createGateway(outputRuntime).enforceGvisorOutputBound(fixture.requirement, undefined, { signal: controller.signal })
    void enforcement.then(() => { enforcementSettled = true }, () => { enforcementSettled = true })
    await reservationStarted
    await delay(60)
    assert.equal(mutationSettled, false)
    assert.equal(enforcementSettled, false, "gateway must not detach a still-running durable mutation after abort")
    await assert.rejects(enforcement, /aborted/)
    assert.equal(mutationSettled, true)
    assert.equal(fixture.events.indexOf("output-reserve-settled") < fixture.events.findIndex((entry) => entry.startsWith("output-failure:")), true)
    assert.equal(fixture.docker.requests.some((entry) => entry.startsWith("UPGRADE ")), false)
    await delay(500)
  } finally { await fixture.cleanup() }
})

test("H4-R3G-E rejects an alternate Unix socket path before subject resolution, reservation, attach, or positive evidence", { skip: process.platform !== "linux", timeout: 5_000 }, async () => {
  const fixture = await createRuntimeFixture()
  const attackerRoot = await mkdtemp(join(tmpdir(), "kodac-r3ge-attacker-socket-"))
  const attackerEvents: string[] = []
  let attackerDocker: FakeDocker | undefined
  let reserved = false
  try {
    attackerDocker = await startFakeDocker(attackerRoot, fixture.requirement, attackerEvents)
    const outputRuntime: GvisorOutputRuntimeConfig = {
      version: KDO_H4_R3G_E_RUNTIME_VERSION,
      reserveOutputOperation() { reserved = true; throw new Error("must not reserve") },
      commitOutputEvidence() { throw new Error("must not commit positive evidence") },
      commitFailureEvidence() { throw new Error("must not commit failure before subject") },
    }
    await assert.rejects(
      fixture.createGateway(outputRuntime, { dockerSocketPath: attackerDocker.socketPath }).enforceGvisorOutputBound(fixture.requirement),
      /socket endpoint identity changed/,
    )
    assert.equal(reserved, false)
    assert.equal(fixture.events.includes("ttl-prepared"), false, "socket authority mismatch must fail before R3G-D subject/lifecycle work")
    assert.equal(attackerDocker.requests.length, 0, "alternate socket must receive no Docker request or attach")
  } finally {
    await attackerDocker?.close()
    await rm(attackerRoot, { recursive: true, force: true })
    await fixture.cleanup()
  }
})

test("H4-R3G-E rejects a structural forged provider even when its Unix socket endpoint matches", { skip: process.platform !== "linux", timeout: 5_000 }, async () => {
  const fixture = await createRuntimeFixture()
  const attackerRoot = await mkdtemp(join(tmpdir(), "kodac-r3ge-forged-provider-"))
  const attackerEvents: string[] = []
  let attackerDocker: FakeDocker | undefined
  let reserved = false
  try {
    attackerDocker = await startFakeDocker(attackerRoot, fixture.requirement, attackerEvents)
    const forgedProvider = await forgedProviderForSocket(fixture.requirement, attackerDocker.socketPath)
    const outputRuntime: GvisorOutputRuntimeConfig = {
      version: KDO_H4_R3G_E_RUNTIME_VERSION,
      reserveOutputOperation() { reserved = true; throw new Error("must not reserve") },
      commitOutputEvidence() { throw new Error("must not commit positive evidence") },
      commitFailureEvidence() { throw new Error("must not commit failure before subject") },
    }
    await assert.rejects(
      fixture.createGateway(outputRuntime, { dockerControlPlane: forgedProvider, dockerSocketPath: attackerDocker.socketPath }).enforceGvisorOutputBound(fixture.requirement),
      /requires a canonical R3F Docker binding resolver/,
    )
    assert.equal(reserved, false)
    assert.equal(fixture.events.includes("ttl-prepared"), false, "resolver provenance failure must precede R3G-D lifecycle work")
    assert.equal(attackerDocker.requests.length, 0, "forged provider socket must receive no Docker request or attach")
  } finally {
    await attackerDocker?.close()
    await rm(attackerRoot, { recursive: true, force: true })
    await fixture.cleanup()
  }
})

test("H4-R3G-E blocks ASK before Docker provider/path validation, R3G-D subject resolution, reservation, or output capture", async () => {
  const requirement = fixtureRequirement()
  let resolved = false
  let reserved = false
  const outputRuntime: GvisorOutputRuntimeConfig = {
    version: KDO_H4_R3G_E_RUNTIME_VERSION,
    reserveOutputOperation() { reserved = true; throw new Error("must not reserve") },
    commitOutputEvidence() { throw new Error("must not commit") },
    commitFailureEvidence() { throw new Error("must not commit") },
  }
  const ttlRuntime: GvisorTtlRuntimeConfig = {
    version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
    watchdogPath: "/nonexistent/r3ge-watchdog",
    expectedWatchdogSha256: "e".repeat(64),
    registryRoot: "/nonexistent/r3ge-registry",
    resolveSubject() { resolved = true; throw new Error("must not resolve") },
    commitPreparedIntent() { throw new Error("must not commit") },
    commitArmEvidence() { throw new Error("must not commit") },
    commitTerminalEvidence() { throw new Error("must not commit") },
  }
  const gateway = new GvisorOutputExecutionGateway({
    filesystem: new NodeWorkspaceFileSystem("."),
    policy: fixedPolicy("ask", "R3G-E fixture ask"),
    dockerControlPlane: fakeProvider(requirement.requirementIdentity, requirement.workload.workloadIdentity),
    dockerSocketPath: "/nonexistent/r3ge-docker.sock",
    outputRuntime,
    ttlRuntime,
    recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { throw new Error("must not recover") } },
  })
  await assert.rejects(gateway.enforceGvisorOutputBound(requirement), /does not permit ASK/)
  assert.equal(resolved, false)
  assert.equal(reserved, false)
})

test("H4-R3G-E durable positive commit has no abort microtask gap before mutation start", { skip: process.platform !== "linux", timeout: 5_000 }, async () => {
  const fixture = await createRuntimeFixture()
  const controller = new AbortController()
  const reservations = new Map<string, GvisorOutputPreparedOperation>()
  const nativeAborted = Object.getOwnPropertyDescriptor(AbortSignal.prototype, "aborted")?.get
  assert.equal(typeof nativeAborted, "function")
  if (typeof nativeAborted !== "function") throw new Error("AbortSignal.aborted getter unavailable")
  const readNativeAborted = () => Boolean(nativeAborted.call(controller.signal))
  let abortQueued = false

  Object.defineProperty(controller.signal, "aborted", {
    configurable: true,
    get() {
      const value = readNativeAborted()
      if (!value && !abortQueued && fixture.events.includes("ttl-terminal") && (new Error().stack ?? "").includes("settleAbortFencedPositiveMutation")) {
        abortQueued = true
        queueMicrotask(() => {
          fixture.events.push("caller-abort")
          controller.abort()
        })
      }
      return value
    },
  })

  const baseRuntime = createOutputRuntime(fixture.events, reservations)
  const outputRuntime: GvisorOutputRuntimeConfig = {
    ...baseRuntime,
    commitOutputEvidence(record) {
      fixture.events.push("output-positive-start")
      assert.equal(readNativeAborted(), false, "positive durable mutation must start before queued caller abort becomes observable")
      return createGvisorOutputBoundCommit(record)
    },
  }

  try {
    const result = await fixture.createGateway(outputRuntime).enforceGvisorOutputBound(fixture.requirement, undefined, { signal: controller.signal })
    await Promise.resolve()
    assert.equal(abortQueued, true, "positive durable abort-gap probe must have been armed")
    assert.equal(readNativeAborted(), true, "queued caller abort must become observable after positive mutation start")
    const positiveStart = fixture.events.indexOf("output-positive-start")
    const callerAbort = fixture.events.indexOf("caller-abort")
    assert.ok(positiveStart >= 0 && callerAbort >= 0 && positiveStart < callerAbort, "positive durable mutation must start synchronously before the queued abort microtask")
    assert.equal(result.record.acceptedAggregateBytes, 5)
  } finally { await fixture.cleanup() }
})

test("H4-R3G-E caller abort while positive durable commit is pending prevents positive E3 persistence", { skip: process.platform !== "linux", timeout: 5_000 }, async () => {
  const fixture = await createRuntimeFixture()
  const controller = new AbortController()
  const reservations = new Map<string, GvisorOutputPreparedOperation>()
  let resolvePositiveStarted!: () => void
  const positiveStarted = new Promise<void>((resolve) => { resolvePositiveStarted = resolve })
  let positivePersisted = false
  const baseRuntime = createOutputRuntime(fixture.events, reservations)
  const outputRuntime: GvisorOutputRuntimeConfig = {
    ...baseRuntime,
    async commitOutputEvidence(record, commitOptions) {
      fixture.events.push("output-positive-start")
      resolvePositiveStarted()
      const signal = commitOptions.signal
      assert.ok(signal, "positive durable callback must receive caller abort signal")
      await new Promise<void>((resolve, reject) => {
        const cleanup = () => signal.removeEventListener("abort", onAbort)
        const onAbort = () => {
          clearTimeout(timer)
          cleanup()
          fixture.events.push("output-positive-abort-fenced")
          reject(new Error("R3G-E positive durable commit aborted before completion"))
        }
        const timer = setTimeout(() => {
          cleanup()
          if (signal.aborted) { reject(new Error("R3G-E positive durable commit observed late abort")); return }
          positivePersisted = true
          fixture.events.push("output-positive")
          resolve()
        }, 200)
        signal.addEventListener("abort", onAbort, { once: true })
        if (signal.aborted) onAbort()
      })
      return createGvisorOutputBoundCommit(record)
    },
  }

  try {
    const enforcement = fixture.createGateway(outputRuntime).enforceGvisorOutputBound(fixture.requirement, undefined, { signal: controller.signal })
    await positiveStarted
    controller.abort()
    await assert.rejects(enforcement, /positive durable commit aborted before completion|aborted before durable completion/)
    assert.equal(positivePersisted, false)
    assert.equal(fixture.events.includes("output-positive"), false)
    assert.equal(fixture.events.includes("output-positive-abort-fenced"), true)
    await delay(250)
    assert.equal(positivePersisted, false, "aborted positive durable callback must not persist E3 later")
  } finally { await fixture.cleanup() }
})
