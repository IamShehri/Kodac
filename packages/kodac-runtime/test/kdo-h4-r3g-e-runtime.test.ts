import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import {
  GvisorOutputExecutionGateway,
  KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION,
  KDO_H4_R3G_E_RUNTIME_VERSION,
  createGvisorOutputFailureCommit,
  createGvisorOutputReservation,
  type GvisorDockerOutputTransport,
  type GvisorOutputFailureRecord,
  type GvisorOutputPreparedOperation,
  type GvisorOutputRuntimeConfig,
} from "../src/execution/gateway-gvisor-output-runtime.ts"
import { KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION } from "../src/execution/gateway-gvisor-ttl-recovery-runtime.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3F_PROVIDER_ID,
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
  type GvisorContainerBindingRequest,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  createGvisorObserverPlan,
  createGvisorRuntimeObservationCandidate,
  parseGvisorProcessObservation,
  parseGvisorStateOutput,
  parseGvisorStatsOutput,
} from "../src/trust/sandbox-observer-gvisor.ts"
import {
  GvisorDockerMultiplexAccumulator,
  KDO_H4_R3G_E_ATTACH_MEDIA_TYPE,
  createGvisorOutputBoundCommit,
  createGvisorOutputChannelIdentity,
  type GvisorOutputBoundRecord,
} from "../src/trust/sandbox-output-gvisor.ts"
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
const PROVIDER_IDENTITY = "5".repeat(64)
const SOCKET_ENDPOINT_IDENTITY = "6".repeat(64)

const PROTOCOL_FIXTURE = String.raw`#!/usr/bin/python3
import hashlib
import sys

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
async function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()))
}

function fixtureRequirement(ttlMs = 60_000, maxOutputBytes = 8) {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_ID,
    executionIntentIdentity: EXECUTION_INTENT_ID,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3ge-runtime-fixture", digest: `sha256:${"2".repeat(64)}` }),
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

function fakeProvider(requirementIdentity: string, workloadIdentity: string): DockerControlPlaneBindingProvider {
  const endpoint: DockerSocketEndpointIdentity = Object.freeze({
    device: "1", inode: "2", uid: "0", gid: "0", mode: "49663", endpointIdentity: SOCKET_ENDPOINT_IDENTITY,
  })
  const unavailable = async (): Promise<DockerControlPlaneResolution> => { throw new Error("fake provider resolution must not be called") }
  const unavailableBinding = async (): Promise<GvisorContainerBinding> => { throw new Error("fake provider binding must not be called") }
  return Object.freeze({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: PROVIDER_IDENTITY,
    socketEndpoint: endpoint,
    requirementIdentity,
    workloadIdentity,
    resolveDockerControlPlaneBinding: unavailable,
    resolveContainerBinding: unavailableBinding,
  })
}

function fakeOutputTransport(input: {
  requirement: ReturnType<typeof fixtureRequirement>
  binding: GvisorContainerBinding
  events: string[]
  captureCounter: { value: number }
}): GvisorDockerOutputTransport {
  const provider = fakeProvider(input.requirement.requirementIdentity, input.requirement.workload.workloadIdentity)
  return Object.freeze({
    provider,
    async captureOutput(request: GvisorContainerBindingRequest, options = {}) {
      input.events.push("output-capture")
      input.captureCounter.value += 1
      assert.equal(request.executionAttemptIdentity, input.binding.executionAttemptIdentity)
      assert.equal(request.requirementIdentity, input.requirement.requirementIdentity)
      assert.equal(request.workloadIdentity, input.requirement.workload.workloadIdentity)
      assert.equal(options.expectedBinding?.bindingIdentity, input.binding.bindingIdentity)
      const accumulator = new GvisorDockerMultiplexAccumulator(input.requirement.workload.resourcePolicy.maxOutputBytes)
      accumulator.push(Buffer.concat([frame(1, "abc"), frame(2, "de")]))
      return Object.freeze({
        version: KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION,
        binding: input.binding,
        executionAttemptIdentity: input.binding.executionAttemptIdentity,
        requirementIdentity: input.requirement.requirementIdentity,
        workloadIdentity: input.requirement.workload.workloadIdentity,
        providerIdentity: provider.providerIdentity,
        socketEndpointIdentity: provider.socketEndpoint.endpointIdentity,
        outputChannelIdentity: createGvisorOutputChannelIdentity({
          executionAttemptIdentity: input.binding.executionAttemptIdentity,
          requirementIdentity: input.requirement.requirementIdentity,
          workloadIdentity: input.requirement.workload.workloadIdentity,
          containerBindingIdentity: input.binding.bindingIdentity,
          containerId: input.binding.containerId,
          providerIdentity: provider.providerIdentity,
          socketEndpointIdentity: provider.socketEndpoint.endpointIdentity,
        }),
        mediaType: KDO_H4_R3G_E_ATTACH_MEDIA_TYPE,
        aggregation: accumulator.finish(),
      })
    },
  })
}

test("H4-R3G-E K2 gateway orders durable ARM -> output reservation -> capture and commits positive evidence only after terminal", { skip: process.platform !== "linux", timeout: 15_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3ge-runtime-"))
  const watchdogPath = join(root, "watchdog-fixture.py")
  const socketPath = join(root, "control.sock")
  const events: string[] = []
  const reservations = new Map<string, GvisorOutputPreparedOperation>()
  const captureCounter = { value: 0 }
  const server = createServer()
  try {
    await writeFile(watchdogPath, PROTOCOL_FIXTURE, { mode: 0o755 })
    await chmod(watchdogPath, 0o755)
    await new Promise<void>((resolvePromise, rejectPromise) => {
      server.once("error", rejectPromise)
      server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() })
    })

    const requirement = fixtureRequirement(60_000, 8)
    const socketStat = await stat(socketPath, { bigint: true })
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
      path: socketPath,
      device: socketStat.dev.toString(),
      inode: socketStat.ino.toString(),
      uid: socketStat.uid.toString(),
      gid: socketStat.gid.toString(),
      mode: socketStat.mode.toString(),
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
      resolveSubject(value) {
        assert.equal(value.requirementIdentity, requirement.requirementIdentity)
        return subject
      },
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

    const outputRuntime: GvisorOutputRuntimeConfig = {
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

    const createGateway = (transport: GvisorDockerOutputTransport) => new GvisorOutputExecutionGateway({
      filesystem: new NodeWorkspaceFileSystem(root),
      policy: fixedPolicy("allow", "R3G-E fixture allow"),
      outputTransport: transport,
      outputRuntime,
      ttlRuntime,
      recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { return [] } },
    })

    const first = await createGateway(fakeOutputTransport({ requirement, binding, events, captureCounter })).enforceGvisorOutputBound(requirement)
    assert.equal(first.subject.binding.executionAttemptIdentity, attempt)
    assert.equal(first.capture.binding.bindingIdentity, binding.bindingIdentity)
    assert.equal(first.record.executionAttemptIdentity, attempt)
    assert.equal(first.record.runtimeInstanceIdentity, lineage.runtimeInstanceIdentity)
    assert.equal(first.record.terminalEvidenceIdentity, first.terminal.recordIdentity)
    assert.equal(first.record.acceptedAggregateBytes, 5)
    assert.equal(captureCounter.value, 1)

    const preparedIndex = events.indexOf("ttl-prepared")
    const armIndex = events.indexOf("ttl-arm")
    const reserveIndex = events.indexOf("output-reserve")
    const captureIndex = events.indexOf("output-capture")
    const terminalIndex = events.indexOf("ttl-terminal")
    const positiveIndex = events.indexOf("output-positive")
    assert.ok(preparedIndex >= 0 && preparedIndex < armIndex, "TTL PREPARED must precede durable ARM")
    assert.ok(armIndex < reserveIndex, "durable R3G-D ARM must precede R3G-E output reservation")
    assert.ok(reserveIndex < captureIndex, "durable output reservation must precede any output capture")
    assert.ok(terminalIndex >= 0 && terminalIndex < positiveIndex, "positive output evidence must follow durable terminal lifecycle evidence")

    const secondCaptureCounter = { value: 0 }
    const secondTransport = fakeOutputTransport({ requirement, binding, events, captureCounter: secondCaptureCounter })
    await assert.rejects(
      createGateway(secondTransport).enforceGvisorOutputBound(requirement),
      /already exists|cannot be replenished/,
    )
    assert.equal(secondCaptureCounter.value, 0, "fresh process-local transport state must not bypass durable reservation replay")
    assert.equal(reservations.size, 1)
  } finally {
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})

test("H4-R3G-E blocks ASK before R3G-D subject resolution, reservation, or output capture", async () => {
  const requirement = fixtureRequirement()
  let resolved = false
  let reserved = false
  let captured = false
  const provider = fakeProvider(requirement.requirementIdentity, requirement.workload.workloadIdentity)
  const outputTransport: GvisorDockerOutputTransport = Object.freeze({
    provider,
    async captureOutput() { captured = true; throw new Error("must not capture") },
  })
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
    outputTransport,
    outputRuntime,
    ttlRuntime,
    recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { throw new Error("must not recover") } },
  })
  await assert.rejects(gateway.enforceGvisorOutputBound(requirement), /does not permit ASK/)
  assert.equal(resolved, false)
  assert.equal(reserved, false)
  assert.equal(captured, false)
})
