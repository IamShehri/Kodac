import assert from "node:assert/strict"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from "node:fs"
import { createServer, type Server, type Socket } from "node:net"
import { homedir, tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { GvisorNetworkExecutionGateway } from "../src/execution/gateway-gvisor-network.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import { fixedPolicy } from "../src/trust/policy.ts"
import { createSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3F_PROVIDER_ID,
  createDockerControlPlaneObservation,
  createDockerSocketEndpointIdentity,
  type DockerControlPlaneBindingProvider,
} from "../src/trust/sandbox-observer-docker-control-plane.ts"
import {
  KDO_H4_R3E_RUNTIME_CONFIG_VERSION,
  createGvisorContainerBinding,
  createGvisorRuntimeLineageCommit,
  type GvisorContainerBindingRequest,
  type GvisorRuntimeLineageRecord,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  createGvisorPhysicalNetworkCommit,
  createGvisorPhysicalNetworkRecord,
  deriveGvisorNetworkControlSocketPath,
  observeGvisorNetworkTopologyOnce,
  parseGvisorGetNetworkConfigResponse,
  snapshotGvisorNetworkControlEndpoint,
  validateGvisorNetworkObserverRuntimeConfig,
  validateGvisorPhysicalNetworkCommit,
  validateGvisorPhysicalNetworkRecord,
  type GvisorNetworkControlEndpointIdentity,
  type GvisorNetworkObservationRead,
  type GvisorPhysicalNetworkRecord,
} from "../src/trust/sandbox-observer-gvisor-network.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"

const CONTAINER_ID = "1".repeat(64)
const EXECUTION_ATTEMPT = "2".repeat(64)
const REQUIREMENT = "3".repeat(64)
const WORKLOAD = "4".repeat(64)
const BINDING = "5".repeat(64)
const RUNTIME_INSTANCE = "6".repeat(64)
const RUNSC = "7".repeat(64)
const HELPER = "8".repeat(64)
const PLAN = "9".repeat(64)
const STATE = "a".repeat(64)
const PROCESS = "b".repeat(64)
const OBSERVER = "c".repeat(64)
const CANDIDATE = "d".repeat(64)
const ARGS = "e".repeat(64)
const DOCKER_PROVIDER = "f".repeat(64)
const DOCKER_SOCKET = "0".repeat(64)

function r3eHash(domain: string, payload: string): string {
  return createHash("sha256").update(Buffer.from(`KODAC-H4-R3E\0${domain}\0V1\0`, "ascii")).update(Buffer.from(payload, "utf8")).digest("hex")
}
function r3gCHash(domain: string, tuple: readonly unknown[]): string {
  return createHash("sha256").update(Buffer.from(`KODAC-H4-R3G-C\0${domain}\0V1\0`, "ascii")).update(Buffer.from(JSON.stringify(tuple), "utf8")).digest("hex")
}
function syntheticR3e(overrides: Partial<GvisorRuntimeLineageRecord> = {}): GvisorRuntimeLineageRecord {
  const base = {
    version: "kodac-h4-r3e-gvisor-runtime-lineage-v1" as const,
    evidenceClass: "e3-integrated-runtime-lineage" as const,
    executionAttemptIdentity: EXECUTION_ATTEMPT,
    requirementIdentity: REQUIREMENT,
    workloadIdentity: WORKLOAD,
    containerBindingIdentity: BINDING,
    containerId: CONTAINER_ID,
    observerImplementationIdentity: OBSERVER,
    runscArtifactIdentity: RUNSC,
    observerHelperArtifactIdentity: HELPER,
    planIdentity: PLAN,
    stateIdentity: STATE,
    statsIdentity: "1".repeat(64),
    processIdentity: PROCESS,
    r3dCandidateIdentity: CANDIDATE,
    runtimeInstanceIdentity: RUNTIME_INSTANCE,
    ...Object.fromEntries(Object.entries(overrides).filter(([key]) => key !== "recordIdentity")),
  }
  return { ...base, recordIdentity: r3eHash("RUNTIME_LINEAGE", JSON.stringify(base)) } as GvisorRuntimeLineageRecord
}
function dockerObservation(overrides: Partial<Parameters<typeof createDockerControlPlaneObservation>[0]> = {}) {
  return createDockerControlPlaneObservation({
    providerIdentity: DOCKER_PROVIDER,
    socketEndpointIdentity: DOCKER_SOCKET,
    executionAttemptIdentity: EXECUTION_ATTEMPT,
    requirementIdentity: REQUIREMENT,
    workloadIdentity: WORKLOAD,
    containerId: CONTAINER_ID,
    bindingIdentity: BINDING,
    imageManifestDigest: `sha256:${"2".repeat(64)}`,
    executable: "/usr/bin/node",
    argsIdentity: ARGS,
    nanoCpus: 1_000_000_000,
    memoryBytes: 536_870_912,
    memorySwapBytes: 536_870_912,
    ...overrides,
  })
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
function responseFor(): string { return JSON.stringify({ success: true, err: "", result: canonicalTopologyResult() }) }
function syntheticEndpoint(path = `/run/runsc/runsc-${CONTAINER_ID}.sock`): GvisorNetworkControlEndpointIdentity {
  const base = { path, device: "1", inode: "2", uid: "0", gid: "0", mode: String(0o140600), parentAuthorityIdentity: "e".repeat(64) }
  return { ...base, endpointIdentity: r3gCHash("CONTROL_ENDPOINT", [base.path, base.device, base.inode, base.uid, base.gid, base.mode, base.parentAuthorityIdentity]) }
}
function observationRead(endpoint = syntheticEndpoint()): GvisorNetworkObservationRead {
  return Object.freeze({ endpointBefore: endpoint, endpointAfter: endpoint, topology: parseGvisorGetNetworkConfigResponse(responseFor()) })
}
function fixtureRecord(): GvisorPhysicalNetworkRecord {
  return createGvisorPhysicalNetworkRecord({
    r3eBefore: syntheticR3e(),
    r3eAfter: syntheticR3e({ statsIdentity: "f".repeat(64) }),
    dockerControlPlane: dockerObservation(),
    firstRead: observationRead(),
    secondRead: observationRead(),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  })
}
function trustedUid(): string { return typeof process.getuid === "function" ? String(process.getuid()) : "0" }

async function closeServer(server: Server, sockets: Set<Socket> = new Set()): Promise<void> {
  for (const socket of sockets) socket.destroy()
  if (!server.listening) return
  await new Promise<void>((resolve) => server.close(() => resolve()))
}

test("H4-R3G-C rejects an independently valid R3E record when runtime-instance identity changes across the bracket", () => {
  const before = syntheticR3e()
  const after = syntheticR3e({ runtimeInstanceIdentity: "0".repeat(64), statsIdentity: "f".repeat(64) })
  assert.throws(() => createGvisorPhysicalNetworkRecord({
    r3eBefore: before,
    r3eAfter: after,
    dockerControlPlane: dockerObservation(),
    firstRead: observationRead(),
    secondRead: observationRead(),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  }), /bracket mismatch/)
})

test("H4-R3G-C trusted store exact replay is idempotent and conflicting canonical bytes fail closed", () => {
  const record = validateGvisorPhysicalNetworkRecord(fixtureRecord())
  const canonicalBytes = JSON.stringify(record)
  const stored = new Map<string, string>()
  const put = (recordIdentity: string, bytes: string) => {
    const existing = stored.get(recordIdentity)
    if (existing !== undefined && existing !== bytes) throw new Error("R3G-C durable store integrity violation: conflicting canonical bytes for recordIdentity")
    if (existing === undefined) stored.set(recordIdentity, bytes)
    return createGvisorPhysicalNetworkCommit(record)
  }

  const first = put(record.recordIdentity, canonicalBytes)
  const second = put(record.recordIdentity, canonicalBytes)
  assert.equal(stored.size, 1)
  assert.equal(stored.get(record.recordIdentity), canonicalBytes)
  assert.deepEqual(second, first)
  assert.equal(validateGvisorPhysicalNetworkCommit(first, record).recordIdentity, record.recordIdentity)
  assert.equal(validateGvisorPhysicalNetworkCommit(second, record).recordIdentity, record.recordIdentity)

  assert.throws(() => put(record.recordIdentity, `${canonicalBytes} `), /integrity violation/)
  assert.equal(stored.size, 1)
  assert.equal(stored.get(record.recordIdentity), canonicalBytes)
})

test("H4-R3G-C exact socket authority has no /tmp, /run, or /var/run fallback search", { skip: process.platform !== "linux" }, async () => {
  const selectedRoot = mkdtempSync(join(homedir(), ".r3f-"))
  const fallbackRoot = mkdtempSync(join(tmpdir(), "r3g-c-fallback-"))
  const fallbackPath = deriveGvisorNetworkControlSocketPath(fallbackRoot, CONTAINER_ID)
  const fallbackServer = createServer()
  try {
    await new Promise<void>((resolve, reject) => fallbackServer.listen(fallbackPath, (error?: Error) => error ? reject(error) : resolve()))
    await assert.rejects(snapshotGvisorNetworkControlEndpoint({ runtimeRoot: selectedRoot, containerId: CONTAINER_ID, trustedHostUid: trustedUid() }))
    const source = readFileSync(new URL("../src/trust/sandbox-observer-gvisor-network.ts", import.meta.url), "utf8")
    assert.doesNotMatch(source, /["']\/(?:tmp|run|var\/run)\//)
  } finally {
    await closeServer(fallbackServer).catch(() => {})
    rmSync(fallbackRoot, { recursive: true, force: true })
    rmSync(selectedRoot, { recursive: true, force: true })
  }
})

test("H4-R3G-C RPC timeout closes the owned stream and late response bytes cannot become evidence", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(homedir(), ".r3t-"))
  const socketPath = deriveGvisorNetworkControlSocketPath(root, CONTAINER_ID)
  const server = createServer()
  const sockets = new Set<Socket>()
  let closeCount = 0
  let lateWriteAttempted = false
  try {
    server.on("connection", (socket) => {
      sockets.add(socket)
      socket.once("close", () => { sockets.delete(socket); closeCount += 1 })
      socket.once("data", () => {
        setTimeout(() => {
          lateWriteAttempted = true
          if (!socket.destroyed) socket.write(responseFor())
        }, 3100)
      })
    })
    await new Promise<void>((resolve, reject) => server.listen(socketPath, (error?: Error) => error ? reject(error) : resolve()))
    await assert.rejects(observeGvisorNetworkTopologyOnce({ runtimeRoot: root, trustedHostUid: trustedUid(), runtimeLineage: syntheticR3e() }), /timed out/)
    await new Promise<void>((resolve) => setTimeout(resolve, 200))
    assert.equal(lateWriteAttempted, true)
    assert.ok(closeCount >= 1, "timed-out R3G-C transport must be closed before late bytes")
  } finally {
    await closeServer(server, sockets).catch(() => {})
    rmSync(root, { recursive: true, force: true })
  }
})

test("H4-R3G-C explicitly models delayed pre-start mutation and malicious trusted-host mutation outside the observer theorem", () => {
  const config = validateGvisorNetworkObserverRuntimeConfig({
    version: KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
    trustedHostUid: trustedUid(),
    trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
    commitNetworkEvidence: () => ({}),
  })
  assert.throws(() => validateGvisorNetworkObserverRuntimeConfig({ ...config, trustedHostSerializationObserved: true }))

  const authorization = readFileSync(new URL("../../../docs/planning/KODAC_KDO_H4_R3G_C_PHYSICAL_DENY_ALL_NETWORK_OBSERVATION_AUTHORIZATION_2026-08-17.md", import.meta.url), "utf8")
  assert.match(authorization, /S6\. the trusted host enforces S1-S5 outside the R3G-C observer; the observer does not pretend to observe or create this serialization authority\./)
  assert.match(authorization, /delayed-pre-start-call race/)
  assert.match(authorization, /compromised root host[\s\S]*violating §9 invalidates the theorem/)

  const runtimeSource = readFileSync(new URL("../src/trust/sandbox-observer-gvisor-network-runtime.ts", import.meta.url), "utf8")
  assert.doesNotMatch(runtimeSource, /SetNetworkArgs|CreateLinksAndRoutes|verifyTrustedHostSerialization|observeTrustedHostSerialization/)
})

function fixtureRequirement(): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({ mode: "read-only", workspaceIdentity: "a".repeat(64), executionIntentIdentity: "b".repeat(64), scope: { readPaths: ["src"], writePaths: [] } })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3gc-certification", digest: `sha256:${"2".repeat(64)}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}
function cString(value: string): string { return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"') }
function compileC(root: string, name: string, text: string): string {
  const sourcePath = join(root, `${name}.c`)
  const binary = join(root, name)
  require("node:fs").writeFileSync(sourcePath, text, "utf8")
  const result = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", sourcePath, "-o", binary], { encoding: "utf8", shell: false })
  assert.equal(result.status, 0, `${name} compile failed: ${String(result.stderr)}`)
  return binary
}
function compileFakeRunsc(root: string, runtimeRoot: string): string {
  const pidFile = join(runtimeRoot, "sandbox.pid")
  return compileC(root, "fake-runsc", `#include <signal.h>\n#include <stdio.h>\n#include <string.h>\n#include <unistd.h>\nstatic const char *PIDFILE="${cString(pidFile)}";\nstatic int write_pid(void){FILE*f=fopen(PIDFILE,"w");if(!f)return 125;if(fprintf(f,"%ld\\n",(long)getpid())<0){fclose(f);return 125;}return fclose(f)==0?0:125;}\nstatic long read_pid(void){FILE*f=fopen(PIDFILE,"r");long p=0;if(!f)return 0;if(fscanf(f,"%ld",&p)!=1)p=0;fclose(f);return p;}\nint main(int argc,char**argv){if(argc==2&&strcmp(argv[1],"sandbox")==0){if(write_pid()!=0)return 125;for(;;)pause();}if(argc>=5&&strcmp(argv[1],"--root")==0){long p=read_pid();if(p<=0)return 125;if(strcmp(argv[3],"state")==0&&argc==5){printf("{\\\"ociVersion\\\":\\\"1.2.0\\\",\\\"id\\\":\\\"%s\\\",\\\"status\\\":\\\"running\\\",\\\"pid\\\":%ld,\\\"bundle\\\":\\\"/run/kodac/%s\\\"}\\n",argv[4],p,argv[4]);return 0;}if(strcmp(argv[3],"events")==0&&argc==6&&strcmp(argv[4],"--stats")==0){printf("{\\\"type\\\":\\\"stats\\\",\\\"id\\\":\\\"%s\\\",\\\"data\\\":{\\\"cpu\\\":{\\\"usage\\\":1}}}\\n",argv[5]);return 0;}}return 125;}\n`)
}
function compileHelper(root: string): string {
  const nativePath = fileURLToPath(new URL("../native/gvisor-proc-observe.c", import.meta.url))
  const binary = join(root, "kodac-gvisor-proc-observe")
  const result = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativePath, "-o", binary], { encoding: "utf8", shell: false })
  assert.equal(result.status, 0, `gvisor helper compile failed: ${String(result.stderr)}`)
  return binary
}
async function waitForFile(path: string): Promise<void> {
  for (let index = 0; index < 100; index += 1) {
    if (existsSync(path)) return
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(`fixture file did not appear: ${path}`)
}
async function reapSandbox(sandbox: ChildProcess | undefined): Promise<void> {
  if (sandbox === undefined || sandbox.exitCode !== null || sandbox.signalCode !== null) return
  const exited = new Promise<void>((resolve) => sandbox.once("exit", () => resolve()))
  sandbox.kill("SIGKILL")
  await exited
}
function sha256File(path: string): string { return createHash("sha256").update(readFileSync(path)).digest("hex") }
function fakeProvider(requirement: SandboxExecutionRequirement, resolver: DockerControlPlaneBindingProvider["resolveContainerBinding"], onR3f: (request: GvisorContainerBindingRequest) => void): DockerControlPlaneBindingProvider {
  const socketEndpoint = createDockerSocketEndpointIdentity({ device: "1", inode: "2", uid: "0", gid: "0", mode: String(0o140600) })
  return Object.freeze({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: "3".repeat(64),
    socketEndpoint,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    async resolveDockerControlPlaneBinding(request: GvisorContainerBindingRequest) {
      onR3f(request)
      const binding = createGvisorContainerBinding({ providerId: KDO_H4_R3F_PROVIDER_ID, executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity, containerId: CONTAINER_ID })
      const observation = createDockerControlPlaneObservation({
        providerIdentity: "3".repeat(64), socketEndpointIdentity: socketEndpoint.endpointIdentity,
        executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity,
        workloadIdentity: request.workloadIdentity, containerId: CONTAINER_ID, bindingIdentity: binding.bindingIdentity,
        imageManifestDigest: requirement.workload.source.digest, executable: requirement.workload.entrypoint.executable,
        argsIdentity: "4".repeat(64), nanoCpus: requirement.workload.resourcePolicy.cpuMillis * 1_000_000,
        memoryBytes: requirement.workload.resourcePolicy.memoryBytes, memorySwapBytes: requirement.workload.resourcePolicy.memoryBytes,
      })
      return Object.freeze({ binding, observation })
    },
    resolveContainerBinding: resolver,
  })
}

test("H4-R3G-C lost acknowledgment remains failed and a later invocation repeats fresh R3F/R3E/RPC observation", { skip: process.platform !== "linux" }, async (t) => {
  const compiler = spawnSync("cc", ["--version"], { encoding: "utf8", shell: false })
  if (compiler.status !== 0) {
    if (process.env.GITHUB_ACTIONS === "true") assert.fail(`C compiler unavailable: ${String(compiler.error ?? compiler.stderr)}`)
    t.skip("C compiler unavailable")
    return
  }

  const scratch = mkdtempSync(join(tmpdir(), "kodac-r3gc-replay-"))
  const runtimeRoot = mkdtempSync(join(homedir(), ".r3r-"))
  const workspace = join(scratch, "workspace")
  mkdirSync(workspace)
  const runscPath = compileFakeRunsc(scratch, runtimeRoot)
  const helperPath = compileHelper(scratch)
  const pidFile = join(runtimeRoot, "sandbox.pid")
  const socketPath = deriveGvisorNetworkControlSocketPath(runtimeRoot, CONTAINER_ID)
  let sandbox: ChildProcess | undefined
  const server = createServer()
  const sockets = new Set<Socket>()

  try {
    sandbox = spawn(runscPath, ["sandbox"], { stdio: "ignore", shell: false })
    await waitForFile(pidFile)
    let rpcCalls = 0
    server.on("connection", (socket) => {
      sockets.add(socket)
      socket.once("close", () => sockets.delete(socket))
      socket.on("data", (chunk) => {
        assert.equal(chunk.toString("utf8"), '{"method":"containerManager.GetNetworkConfig","arg":{}}')
        rpcCalls += 1
        socket.write(responseFor())
      })
    })
    await new Promise<void>((resolve, reject) => server.listen(socketPath, (error?: Error) => error ? reject(error) : resolve()))

    const requirement = fixtureRequirement()
    let r3fCalls = 0
    const attempts: string[] = []
    const resolver: DockerControlPlaneBindingProvider["resolveContainerBinding"] = async (request) => createGvisorContainerBinding({
      providerId: KDO_H4_R3F_PROVIDER_ID,
      executionAttemptIdentity: request.executionAttemptIdentity,
      requirementIdentity: request.requirementIdentity,
      workloadIdentity: request.workloadIdentity,
      containerId: CONTAINER_ID,
    })
    const provider = fakeProvider(requirement, resolver, (request) => { r3fCalls += 1; attempts.push(request.executionAttemptIdentity) })
    let lineageCommitCalls = 0
    const gvisor = {
      version: KDO_H4_R3E_RUNTIME_CONFIG_VERSION,
      runscPath,
      expectedRunscSha256: sha256File(runscPath),
      observerHelperPath: helperPath,
      expectedObserverHelperSha256: sha256File(helperPath),
      runtimeRoot,
      resolveContainerBinding: resolver,
      commitLineageEvidence(record: GvisorRuntimeLineageRecord) { lineageCommitCalls += 1; return createGvisorRuntimeLineageCommit(record) },
    } as const

    const store = new Map<string, string>()
    let mode: "lost" | "success" = "lost"
    let physicalCommitCalls = 0
    let failedRecord: GvisorPhysicalNetworkRecord | undefined
    let resolveLateAck: (() => void) | undefined
    const network = {
      version: KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
      trustedHostUid: trustedUid(),
      trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
      commitNetworkEvidence(record: GvisorPhysicalNetworkRecord) {
        physicalCommitCalls += 1
        const validated = validateGvisorPhysicalNetworkRecord(record)
        const bytes = JSON.stringify(validated)
        const existing = store.get(validated.recordIdentity)
        if (existing !== undefined && existing !== bytes) throw new Error("R3G-C replay fixture integrity violation")
        if (existing === undefined) store.set(validated.recordIdentity, bytes)
        if (mode === "success") return createGvisorPhysicalNetworkCommit(validated)
        failedRecord = validated
        return new Promise<unknown>((resolve) => {
          resolveLateAck = () => resolve(createGvisorPhysicalNetworkCommit(validated))
          setImmediate(() => firstController.abort())
        })
      },
    } as const

    const firstController = new AbortController()
    let firstTerminal: "pending" | "success" | "failure" = "pending"
    const firstGateway = new GvisorNetworkExecutionGateway({ filesystem: new NodeWorkspaceFileSystem(workspace), policy: fixedPolicy("allow"), gvisorObserver: gvisor, dockerControlPlane: provider, networkObserver: network })
    const firstOperation = firstGateway.observeGvisorPhysicalNetwork(requirement, undefined, { signal: firstController.signal }).then(
      (value) => { firstTerminal = "success"; return value },
      (error) => { firstTerminal = "failure"; throw error },
    )
    await assert.rejects(firstOperation, /aborted/)
    assert.equal(firstTerminal, "failure")
    assert.equal(r3fCalls, 1)
    assert.equal(rpcCalls, 2)
    assert.equal(lineageCommitCalls, 2)
    assert.equal(physicalCommitCalls, 1)
    assert.notEqual(failedRecord, undefined)

    resolveLateAck?.()
    await new Promise<void>((resolve) => setImmediate(resolve))
    assert.equal(firstTerminal, "failure", "late durable acknowledgment must not upgrade the failed invocation")
    assert.equal(physicalCommitCalls, 1, "lost acknowledgment must not cause same-invocation retry")

    mode = "success"
    const secondGateway = new GvisorNetworkExecutionGateway({ filesystem: new NodeWorkspaceFileSystem(workspace), policy: fixedPolicy("allow"), gvisorObserver: gvisor, dockerControlPlane: provider, networkObserver: network })
    const freshRecord = await secondGateway.observeGvisorPhysicalNetwork(requirement)
    assert.equal(r3fCalls, 2, "later invocation must repeat fresh R3F")
    assert.equal(rpcCalls, 4, "later invocation must repeat both physical topology reads")
    assert.equal(lineageCommitCalls, 4, "later invocation must repeat R3E-before and R3E-after")
    assert.equal(physicalCommitCalls, 2)
    assert.equal(attempts.length, 2)
    assert.notEqual(attempts[0], attempts[1])
    assert.notEqual(freshRecord.executionAttemptIdentity, failedRecord!.executionAttemptIdentity)
    assert.notEqual(freshRecord.recordIdentity, failedRecord!.recordIdentity)
    assert.equal(store.size, 2)
  } finally {
    resolveLateAck?.()
    await reapSandbox(sandbox).catch(() => {})
    await closeServer(server, sockets).catch(() => {})
    rmSync(runtimeRoot, { recursive: true, force: true })
    rmSync(scratch, { recursive: true, force: true })
  }
})
