import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { createHash } from "node:crypto"
import { chmod, mkdtemp, readFile, rm, stat } from "node:fs/promises"
import { createServer, type Socket } from "node:net"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { GvisorTtlExecutionGateway } from "../src/execution/gateway-gvisor-ttl-runtime.ts"
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

const execFileAsync = promisify(execFile)
const TEST_DIR = dirname(fileURLToPath(import.meta.url))
const RUNTIME_DIR = resolve(TEST_DIR, "..")
const WATCHDOG_SOURCE = join(RUNTIME_DIR, "native", "gvisor-ttl-watchdog.c")
const CONTAINER_ID = "1".repeat(64)
const WORKSPACE_ID = "a".repeat(64)
const EXECUTION_INTENT_ID = "b".repeat(64)

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

test("H4-R3G-D K2 gateway durably orders PREPARED -> physical arm -> arm evidence -> terminal evidence", { skip: process.platform !== "linux", timeout: 25_000 }, async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-r3gd-gateway-")); await chmod(root, 0o700)
  const binary = join(root, "gvisor-ttl-watchdog"); const socketPath = join(root, "control.sock")
  const serverSockets = new Set<Socket>(); const methods: string[] = []; const commits: string[] = []
  let signalArg: unknown; let waitSocket: Socket | undefined
  const server = createServer((socket) => {
    serverSockets.add(socket); socket.once("close", () => serverSockets.delete(socket))
    let buffered = ""; socket.setEncoding("utf8")
    socket.on("data", (chunk: string) => {
      buffered += chunk
      let request: { method?: unknown; arg?: unknown }
      try { request = JSON.parse(buffered) as { method?: unknown; arg?: unknown } } catch { return }
      buffered = ""
      if (typeof request.method !== "string") return socket.destroy(new Error("missing RPC method"))
      methods.push(request.method)
      if (request.method === "containerManager.Wait") { assert.equal(request.arg, CONTAINER_ID); waitSocket = socket; return }
      if (request.method === "containerManager.Processes") { assert.equal(request.arg, CONTAINER_ID); socket.write(JSON.stringify({ success: true, err: "", result: [{ pid: 1 }] })); return }
      if (request.method === "containerManager.Signal") {
        signalArg = request.arg; socket.write(JSON.stringify({ success: true, err: "", result: null })); setTimeout(() => waitSocket?.write(JSON.stringify({ success: true, err: "", result: 0 })), 5); return
      }
      socket.destroy(new Error(`unexpected RPC method ${request.method}`))
    })
  })

  try {
    await execFileAsync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", WATCHDOG_SOURCE, "-o", binary])
    await new Promise<void>((resolvePromise, rejectPromise) => { server.once("error", rejectPromise); server.listen(socketPath, () => { server.off("error", rejectPromise); resolvePromise() }) })

    const requirement = fixtureRequirement(75)
    const socketStat = await stat(socketPath, { bigint: true }); const exeStat = await stat("/proc/self/exe", { bigint: true })
    const startTicks = parseStartTicks(await readFile("/proc/self/stat", "utf8")); const runscSha = await sha256File("/proc/self/exe")
    const watchdogSha = await sha256File(binary); const watchdogStat = await stat(binary)
    assert.ok(watchdogStat.size > 0)
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

    const runtime: GvisorTtlRuntimeConfig = Object.freeze({
      version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
      watchdogPath: binary,
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
    })
    const gateway = new GvisorTtlExecutionGateway({ filesystem: new NodeWorkspaceFileSystem(root), policy: fixedPolicy("allow", "R3G-D fixture allow"), ttlRuntime: runtime })
    const result = await gateway.enforceGvisorTtl(requirement)

    assert.deepEqual(commits, ["prepared", "arm", "terminal"])
    assert.equal(result.arm.executionAttemptIdentity, attempt)
    assert.equal(result.arm.containerId, CONTAINER_ID)
    assert.equal(result.terminal.armRecordIdentity, result.arm.recordIdentity)
    assert.equal(result.terminal.leaseIdentity, result.arm.leaseIdentity)
    assert.equal(result.terminal.terminalOutcome, "ttl-expired")
    assert.deepEqual(methods, ["containerManager.Wait", "containerManager.Processes", "containerManager.Signal"])
    assert.deepEqual(signalArg, { CID: CONTAINER_ID, Signo: 9, PID: 0, Mode: 1 })
    assert.notEqual(result.arm.controlPeerBindingIdentity, "0".repeat(64))
    assert.match(result.terminal.registryTerminalRecordIdentity, /^[0-9a-f]{64}$/)
  } finally {
    for (const socket of serverSockets) socket.destroy()
    if (server.listening) await closeServer(server).catch(() => {})
    await rm(root, { recursive: true, force: true })
  }
})

test("H4-R3G-D K2 gateway blocks ASK before trusted subject resolution or watchdog execution", async () => {
  const requirement = fixtureRequirement(60_000); let resolved = false
  const runtime: GvisorTtlRuntimeConfig = Object.freeze({
    version: KDO_H4_R3G_D_RUNTIME_CONFIG_VERSION,
    watchdogPath: "/nonexistent/kodac-r3gd-watchdog",
    expectedWatchdogSha256: "e".repeat(64),
    registryRoot: "/nonexistent/kodac-r3gd-registry",
    resolveSubject() { resolved = true; throw new Error("must not run") },
    commitPreparedIntent() { throw new Error("must not run") },
    commitArmEvidence() { throw new Error("must not run") },
    commitTerminalEvidence() { throw new Error("must not run") },
  })
  const gateway = new GvisorTtlExecutionGateway({ filesystem: new NodeWorkspaceFileSystem("."), policy: fixedPolicy("ask", "fixture ask"), ttlRuntime: runtime })
  await assert.rejects(gateway.enforceGvisorTtl(requirement), /does not authorize ask/)
  assert.equal(resolved, false)
})
