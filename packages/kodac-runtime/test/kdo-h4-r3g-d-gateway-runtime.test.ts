import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { chmod, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises"
import { createServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { GvisorTtlExecutionGateway } from "../src/execution/gateway-gvisor-ttl-runtime.ts"
import { KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION } from "../src/execution/gateway-gvisor-ttl-recovery-runtime.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
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
import { fixedPolicy } from "../src/trust/policy.ts"

const CONTAINER_ID = "1".repeat(64)
const WORKSPACE_ID = "a".repeat(64)
const EXECUTION_INTENT_ID = "b".repeat(64)

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
clock = wd("CLOCK_DOMAIN", [boot, "CLOCK_BOOTTIME"])
lease = wd("LEASE", [arm, payload, runtime, boot, lease_start, deadline, watchdog])
owner = wd("OWNER_INSTANCE", [arm, runtime, boot])
fence = "1"
claim = wd("OWNER_CLAIM", [arm, owner, fence, boot])
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
    + f" owner-instance={owner} terminal-fence-token={fence} claim-record={claim} physical-ack={physical_ack}",
    flush=True,
)
retained_pidfd = wd("PIDFD_PROCESS", [peer_pid, start_ticks, exe_dev, exe_ino, exe_size, runtime])
retained_runsc = wd("RUNSC_EXECUTABLE", [runsc_sha, exe_dev, exe_ino, exe_size, runsc_artifact])
exit_ns = str(int(lease_start) + 1)
termination = wd("TERMINATION_ACK", [lease, arm, "natural-exit"])
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

function parseStartTicks(statText: string): bigint {
  const close = statText.lastIndexOf(")")
  assert.ok(close > 0)
  const fields = statText.slice(close + 2).trim().split(/\s+/)
  assert.ok(fields.length >= 20)
  return BigInt(fields[19])
}
function hash(prefix: string, domain: string, value: unknown): string {
  return createHash("sha256").update(Buffer.from(`${prefix}\0${domain}\0V1\0`, "ascii")).update(Buffer.from(JSON.stringify(value), "utf8")).digest("hex")
}
function r3gcHash(domain: string, value: unknown): string { return hash("KODAC-H4-R3G-C", domain, value) }
async function sha256File(path: string): Promise<string> { return createHash("sha256").update(await readFile(path)).digest("hex") }
async function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => server.close((error) => error ? rejectPromise(error) : resolvePromise()))
}

function fixtureRequirement(ttlMs: number) {
  const confinement = createConfinementRequest({ mode: "read-only", workspaceIdentity: WORKSPACE_ID, executionIntentIdentity: EXECUTION_INTENT_ID, scope: { readPaths: ["src"], writePaths: [] } })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3gd-gateway-fixture", digest: `sha256:${"2".repeat(64)}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536_870_912, ttlMs, maxOutputBytes: 1_048_576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

test("H4-R3G-D K2 gateway durably orders PREPARED -> physical arm -> arm evidence -> terminal evidence over the strict watchdog protocol", { skip: process.platform !== "linux", timeout: 10_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-gateway-")); await chmod(root, 0o700)
  const watchdogPath = join(root, "watchdog-fixture.py"); const socketPath = join(root, "control.sock")
  const commits: string[] = []
  let recoveryReads = 0
  const server = createServer()
  try {
    await writeFile(watchdogPath, PROTOCOL_FIXTURE, { mode: 0o755 }); await chmod(watchdogPath, 0o755)
    await new Promise<void>((resolvePromise, rejectPromise) => { server.once("error", rejectPromise); server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() }) })

    const requirement = fixtureRequirement(60_000)
    const socketStat = await stat(socketPath, { bigint: true }); const exeStat = await stat("/proc/self/exe", { bigint: true })
    const startTicks = parseStartTicks(await readFile("/proc/self/stat", "utf8")); const runscSha = await sha256File("/proc/self/exe")
    const watchdogSha = await sha256File(watchdogPath)
    const getuid = process.getuid; const getgid = process.getgid
    assert.equal(typeof getuid, "function"); assert.equal(typeof getgid, "function")
    if (typeof getuid !== "function" || typeof getgid !== "function") throw new Error("Linux uid/gid primitives unavailable")
    const uid = getuid(); const gid = getgid()

    const attempt = createGvisorExecutionAttemptIdentity({ requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, nonce: "123e4567-e89b-42d3-a456-426614174001" })
    const binding = createGvisorContainerBinding({ providerId: "docker-engine", executionAttemptIdentity: attempt, requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, containerId: CONTAINER_ID })
    const plan = createGvisorObserverPlan({ runscPath: "/proc/self/exe", expectedRunscSha256: runscSha, runtimeRoot: "/run/runsc", containerId: CONTAINER_ID })
    const state = parseGvisorStateOutput(JSON.stringify({ ociVersion: "1.2.0", id: CONTAINER_ID, status: "running", pid: process.pid, bundle: `/run/containerd/${CONTAINER_ID}` }), plan)
    const stats = parseGvisorStatsOutput(JSON.stringify({ type: "stats", id: CONTAINER_ID, data: { pids: { current: 2 } } }), plan)
    const processObservation = parseGvisorProcessObservation(`kodac-gvisor-proc-v1 pid=${process.pid} start-ticks=${startTicks} exe-dev=${exeStat.dev} exe-ino=${exeStat.ino} exe-size=${exeStat.size}\n`)
    const candidate = createGvisorRuntimeObservationCandidate({ plan, state, stats, process: processObservation })
    const runsc = createGvisorObserverArtifact({ role: "runsc", sha256: runscSha, sizeBytes: Number(exeStat.size) })
    const helper = createGvisorObserverArtifact({ role: "observer-helper", sha256: "d".repeat(64), sizeBytes: 123_456 })
    const lineage = createGvisorRuntimeLineageRecord({ executionAttemptIdentity: attempt, requirement, binding, runsc, helper, plan, state, stats, process: processObservation, candidate })
    const endpointBase = Object.freeze({ path: socketPath, device: socketStat.dev.toString(), inode: socketStat.ino.toString(), uid: socketStat.uid.toString(), gid: socketStat.gid.toString(), mode: socketStat.mode.toString(), parentAuthorityIdentity: "f".repeat(64) })
    const controlEndpoint = Object.freeze({ ...endpointBase, endpointIdentity: r3gcHash("CONTROL_ENDPOINT", [endpointBase.path, endpointBase.device, endpointBase.inode, endpointBase.uid, endpointBase.gid, endpointBase.mode, endpointBase.parentAuthorityIdentity]) })
    const subject = createGvisorTtlSubjectBinding({ binding, lineage, state, process: processObservation, runscArtifact: runsc, controlEndpoint, expectedPeerUid: String(uid), expectedPeerGid: String(gid) })

    const runtime: GvisorTtlRuntimeConfig = {
      version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
      watchdogPath,
      expectedWatchdogSha256: watchdogSha,
      registryRoot: root,
      resolveSubject(value) { assert.equal(value.requirementIdentity, requirement.requirementIdentity); return subject },
      commitPreparedIntent(record) {
        commits.push("prepared")
        return createGvisorTtlEvidenceCommit({ kind: "prepared", armOperationIdentity: record.armOperationIdentity, leaseIdentity: null, recordIdentity: record.intentIdentity, payloadDigest: payloadDigest(record) })
      },
      commitArmEvidence(record) {
        commits.push("arm")
        return createGvisorTtlEvidenceCommit({ kind: "arm", armOperationIdentity: record.armOperationIdentity, leaseIdentity: record.leaseIdentity, recordIdentity: record.recordIdentity, payloadDigest: payloadDigest(record) })
      },
      commitTerminalEvidence(record) {
        commits.push("terminal")
        return createGvisorTtlEvidenceCommit({ kind: "terminal", armOperationIdentity: record.armOperationIdentity, leaseIdentity: record.leaseIdentity, recordIdentity: record.recordIdentity, payloadDigest: payloadDigest(record) })
      },
    }
    const gateway = new GvisorTtlExecutionGateway({
      filesystem: new NodeWorkspaceFileSystem(root),
      policy: fixedPolicy("allow", "R3G-D fixture allow"),
      ttlRuntime: runtime,
      recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { recoveryReads += 1; return [] } },
    })
    const result = await gateway.enforceGvisorTtl(requirement)

    assert.equal(recoveryReads, 1, "startup recovery must run exactly once before new arm work")
    assert.deepEqual(commits, ["prepared", "arm", "terminal"])
    assert.equal(result.arm.executionAttemptIdentity, attempt)
    assert.equal(result.arm.containerId, CONTAINER_ID)
    assert.equal(result.terminal.armRecordIdentity, result.arm.recordIdentity)
    assert.equal(result.terminal.leaseIdentity, result.arm.leaseIdentity)
    assert.equal(result.terminal.terminalOutcome, "natural-exit")
    assert.notEqual(result.arm.controlPeerBindingIdentity, "0".repeat(64))
    assert.match(result.terminal.registryTerminalRecordIdentity, /^[0-9a-f]{64}$/)
  } finally {
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})

test("H4-R3G-D K2 gateway blocks ASK before startup recovery, trusted subject resolution, or watchdog execution", async () => {
  const requirement = fixtureRequirement(60_000); let resolved = false; let recoveryReads = 0
  const runtime: GvisorTtlRuntimeConfig = {
    version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
    watchdogPath: "/nonexistent/kodac-r3gd-watchdog",
    expectedWatchdogSha256: "e".repeat(64),
    registryRoot: "/nonexistent/kodac-r3gd-registry",
    resolveSubject() { resolved = true; throw new Error("must not run") },
    commitPreparedIntent() { throw new Error("must not run") },
    commitArmEvidence() { throw new Error("must not run") },
    commitTerminalEvidence() { throw new Error("must not run") },
  }
  const gateway = new GvisorTtlExecutionGateway({
    filesystem: new NodeWorkspaceFileSystem("."),
    policy: fixedPolicy("ask", "fixture ask"),
    ttlRuntime: runtime,
    recoveryRuntime: { version: KDO_H4_R3G_D_RECOVERY_RUNTIME_VERSION, listRecoverySnapshots() { recoveryReads += 1; return [] } },
  })
  await assert.rejects(gateway.enforceGvisorTtl(requirement), /does not authorize ask/)
  assert.equal(recoveryReads, 0, "ASK must fail before startup recovery I/O")
  assert.equal(resolved, false)
})