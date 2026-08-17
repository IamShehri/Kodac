import assert from "node:assert/strict"
import { spawn, spawnSync, type ChildProcess } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
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
  deriveGvisorNetworkControlSocketPath,
  validateGvisorPhysicalNetworkRecord,
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

function topologyResponse(): string {
  return JSON.stringify({
    success: true,
    err: "",
    result: {
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
    },
  })
}
function fixtureRequirement(): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: "a".repeat(64),
    executionIntentIdentity: "b".repeat(64),
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3gc-replay", digest: `sha256:${"2".repeat(64)}` }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}
function cString(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}
function compileC(root: string, name: string, text: string): string {
  const sourcePath = join(root, `${name}.c`)
  const binaryPath = join(root, name)
  writeFileSync(sourcePath, text, "utf8")
  const result = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", sourcePath, "-o", binaryPath], { encoding: "utf8", shell: false })
  assert.equal(result.status, 0, `${name} compile failed: ${String(result.error ?? result.stderr)}`)
  return binaryPath
}
function compileFakeRunsc(root: string, runtimeRoot: string): string {
  const pidFile = join(runtimeRoot, "sandbox.pid")
  return compileC(root, "fake-runsc", `#include <signal.h>\n#include <stdio.h>\n#include <string.h>\n#include <unistd.h>\nstatic const char *PIDFILE="${cString(pidFile)}";\nstatic int write_pid(void){FILE*f=fopen(PIDFILE,"w");if(!f)return 125;if(fprintf(f,"%ld\\n",(long)getpid())<0){fclose(f);return 125;}return fclose(f)==0?0:125;}\nstatic long read_pid(void){FILE*f=fopen(PIDFILE,"r");long p=0;if(!f)return 0;if(fscanf(f,"%ld",&p)!=1)p=0;fclose(f);return p;}\nint main(int argc,char**argv){if(argc==2&&strcmp(argv[1],"sandbox")==0){if(write_pid()!=0)return 125;for(;;)pause();}if(argc>=5&&strcmp(argv[1],"--root")==0){long p=read_pid();if(p<=0)return 125;if(strcmp(argv[3],"state")==0&&argc==5){printf("{\\\"ociVersion\\\":\\\"1.2.0\\\",\\\"id\\\":\\\"%s\\\",\\\"status\\\":\\\"running\\\",\\\"pid\\\":%ld,\\\"bundle\\\":\\\"/run/kodac/%s\\\"}\\n",argv[4],p,argv[4]);return 0;}if(strcmp(argv[3],"events")==0&&argc==6&&strcmp(argv[4],"--stats")==0){printf("{\\\"type\\\":\\\"stats\\\",\\\"id\\\":\\\"%s\\\",\\\"data\\\":{\\\"cpu\\\":{\\\"usage\\\":1}}}\\n",argv[5]);return 0;}}return 125;}\n`)
}
function compileHelper(root: string): string {
  const nativePath = fileURLToPath(new URL("../native/gvisor-proc-observe.c", import.meta.url))
  const binaryPath = join(root, "kodac-gvisor-proc-observe")
  const result = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativePath, "-o", binaryPath], { encoding: "utf8", shell: false })
  assert.equal(result.status, 0, `gvisor helper compile failed: ${String(result.error ?? result.stderr)}`)
  return binaryPath
}
async function waitForFile(path: string): Promise<void> {
  for (let index = 0; index < 100; index += 1) {
    if (existsSync(path)) return
    await new Promise<void>((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(`fixture file did not appear: ${path}`)
}
function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex")
}
async function reapSandbox(sandbox: ChildProcess | undefined): Promise<void> {
  if (sandbox === undefined || sandbox.exitCode !== null || sandbox.signalCode !== null) return
  const exited = new Promise<void>((resolve) => sandbox.once("exit", () => resolve()))
  sandbox.kill("SIGKILL")
  await exited
}
async function closeServer(server: Server, sockets: Set<Socket>): Promise<void> {
  for (const socket of sockets) socket.destroy()
  if (!server.listening) return
  await new Promise<void>((resolve) => server.close(() => resolve()))
}
function fakeProvider(
  requirement: SandboxExecutionRequirement,
  resolver: DockerControlPlaneBindingProvider["resolveContainerBinding"],
  onR3f: (request: GvisorContainerBindingRequest) => void,
): DockerControlPlaneBindingProvider {
  const socketEndpoint = createDockerSocketEndpointIdentity({ device: "1", inode: "2", uid: "0", gid: "0", mode: String(0o140600) })
  return Object.freeze({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: "3".repeat(64),
    socketEndpoint,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    async resolveDockerControlPlaneBinding(request: GvisorContainerBindingRequest) {
      onR3f(request)
      const binding = createGvisorContainerBinding({
        providerId: KDO_H4_R3F_PROVIDER_ID,
        executionAttemptIdentity: request.executionAttemptIdentity,
        requirementIdentity: request.requirementIdentity,
        workloadIdentity: request.workloadIdentity,
        containerId: CONTAINER_ID,
      })
      const observation = createDockerControlPlaneObservation({
        providerIdentity: "3".repeat(64),
        socketEndpointIdentity: socketEndpoint.endpointIdentity,
        executionAttemptIdentity: request.executionAttemptIdentity,
        requirementIdentity: request.requirementIdentity,
        workloadIdentity: request.workloadIdentity,
        containerId: CONTAINER_ID,
        bindingIdentity: binding.bindingIdentity,
        imageManifestDigest: requirement.workload.source.digest,
        executable: requirement.workload.entrypoint.executable,
        argsIdentity: "4".repeat(64),
        nanoCpus: requirement.workload.resourcePolicy.cpuMillis * 1_000_000,
        memoryBytes: requirement.workload.resourcePolicy.memoryBytes,
        memorySwapBytes: requirement.workload.resourcePolicy.memoryBytes,
      })
      return Object.freeze({ binding, observation })
    },
    resolveContainerBinding: resolver,
  })
}

test("H4-R3G-C lost acknowledgment remains failed and later invocation repeats fresh R3F/R3E/RPC observation", { skip: process.platform !== "linux" }, async (t) => {
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
  let resolveLateAck: (() => void) | undefined

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
        socket.write(topologyResponse())
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
    const provider = fakeProvider(requirement, resolver, (request) => {
      r3fCalls += 1
      attempts.push(request.executionAttemptIdentity)
    })

    let lineageCommitCalls = 0
    const gvisor = {
      version: KDO_H4_R3E_RUNTIME_CONFIG_VERSION,
      runscPath,
      expectedRunscSha256: sha256File(runscPath),
      observerHelperPath: helperPath,
      expectedObserverHelperSha256: sha256File(helperPath),
      runtimeRoot,
      resolveContainerBinding: resolver,
      commitLineageEvidence(record: GvisorRuntimeLineageRecord) {
        lineageCommitCalls += 1
        return createGvisorRuntimeLineageCommit(record)
      },
    } as const

    const store = new Map<string, string>()
    const firstController = new AbortController()
    let mode: "lost" | "success" = "lost"
    let physicalCommitCalls = 0
    let failedRecord: GvisorPhysicalNetworkRecord | undefined
    const network = {
      version: KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
      trustedHostUid: typeof process.getuid === "function" ? String(process.getuid()) : "0",
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

    let firstTerminal: "pending" | "success" | "failure" = "pending"
    const firstGateway = new GvisorNetworkExecutionGateway({
      filesystem: new NodeWorkspaceFileSystem(workspace),
      policy: fixedPolicy("allow"),
      gvisorObserver: gvisor,
      dockerControlPlane: provider,
      networkObserver: network,
    })
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
    assert.equal(firstTerminal, "failure", "late acknowledgment must not upgrade failed invocation")
    assert.equal(physicalCommitCalls, 1, "lost acknowledgment must not cause same-invocation retry")

    mode = "success"
    const secondGateway = new GvisorNetworkExecutionGateway({
      filesystem: new NodeWorkspaceFileSystem(workspace),
      policy: fixedPolicy("allow"),
      gvisorObserver: gvisor,
      dockerControlPlane: provider,
      networkObserver: network,
    })
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
