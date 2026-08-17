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
import type { ExecutionReceipt } from "../src/evidence/receipt.ts"
import { ExecutionBlockedError } from "../src/execution/gateway.ts"
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
  validateGvisorObserverRuntimeConfig,
  type GvisorContainerBindingRequest,
  type GvisorObserverRuntimeConfig,
  type GvisorRuntimeLineageRecord,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_C_CAPABILITY,
  KDO_H4_R3G_C_EVIDENCE_CLASS,
  KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION,
  createGvisorPhysicalNetworkCommit,
  deriveGvisorNetworkControlSocketPath,
  type GvisorNetworkObserverRuntimeConfig,
  type GvisorPhysicalNetworkRecord,
} from "../src/trust/sandbox-observer-gvisor-network.ts"
import { observeGvisorPhysicalNetworkRuntime } from "../src/trust/sandbox-observer-gvisor-network-runtime.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"

const CONTAINER_ID = "1".repeat(64)
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")
const sha256File = (path: string) => createHash("sha256").update(readFileSync(path)).digest("hex")
function cString(value: string): string { return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"') }
function failOrSkip(t: { skip(message?: string): void }, message: string): false { if (process.env.GITHUB_ACTIONS === "true") assert.fail(message); t.skip(message); return false }
function requireIntegrationHost(t: { skip(message?: string): void }): boolean {
  const compiler = spawnSync("cc", ["--version"], { encoding: "utf8", shell: false }); if (compiler.status !== 0) return failOrSkip(t, `C compiler unavailable: ${String(compiler.error ?? compiler.stderr)}`); return true
}
function compileC(root: string, name: string, text: string): string {
  const sourcePath = join(root, `${name}.c`); const binary = join(root, name); writeFileSync(sourcePath, text, "utf8")
  const result = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", sourcePath, "-o", binary], { encoding: "utf8", shell: false }); assert.equal(result.status, 0, `${name} compile failed: ${String(result.stderr)}`); return binary
}
function compileHelper(root: string): string {
  const nativePath = fileURLToPath(new URL("../native/gvisor-proc-observe.c", import.meta.url)); const binary = join(root, "kodac-gvisor-proc-observe")
  const result = spawnSync("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativePath, "-o", binary], { encoding: "utf8", shell: false }); assert.equal(result.status, 0, `gvisor helper compile failed: ${String(result.stderr)}`); return binary
}
function fixtureRequirement(): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({ mode: "read-only", workspaceIdentity: WORKSPACE_IDENTITY, executionIntentIdentity: EXECUTION_INTENT_IDENTITY, scope: { readPaths: ["src"], writePaths: [] } })
  const workload = createSandboxWorkloadRequest({ source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3gc-fixture", digest: `sha256:${"2".repeat(64)}` }), entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }), resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536870912, ttlMs: 60000, maxOutputBytes: 1048576 }), networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }), confinement, credentialBindingIdentity: null })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}
function compileFakeRunsc(root: string, runtimeRoot: string): string {
  const pidFile = join(runtimeRoot, "sandbox.pid")
  return compileC(root, "fake-runsc", `#include <signal.h>\n#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n#include <unistd.h>\nstatic const char *PIDFILE="${cString(pidFile)}";\nstatic int write_pid(void){FILE*f=fopen(PIDFILE,"w");if(!f)return 125;if(fprintf(f,"%ld\\n",(long)getpid())<0){fclose(f);return 125;}return fclose(f)==0?0:125;}\nstatic long read_pid(void){FILE*f=fopen(PIDFILE,"r");long p=0;if(!f)return 0;if(fscanf(f,"%ld",&p)!=1)p=0;fclose(f);return p;}\nint main(int argc,char**argv){if(argc==2&&strcmp(argv[1],"sandbox")==0){if(write_pid()!=0)return 125;for(;;)pause();}if(argc>=5&&strcmp(argv[1],"--root")==0){long p=read_pid();if(p<=0)return 125;if(strcmp(argv[3],"state")==0&&argc==5){printf("{\\\"ociVersion\\\":\\\"1.2.0\\\",\\\"id\\\":\\\"%s\\\",\\\"status\\\":\\\"running\\\",\\\"pid\\\":%ld,\\\"bundle\\\":\\\"/run/kodac/%s\\\"}\\n",argv[4],p,argv[4]);return 0;}if(strcmp(argv[3],"events")==0&&argc==6&&strcmp(argv[4],"--stats")==0){printf("{\\\"type\\\":\\\"stats\\\",\\\"id\\\":\\\"%s\\\",\\\"data\\\":{\\\"cpu\\\":{\\\"usage\\\":1}}}\\n",argv[5]);return 0;}}return 125;}\n`)
}
async function waitForFile(path: string): Promise<void> { for (let i=0;i<100;i+=1){if(existsSync(path))return;await new Promise<void>((resolve)=>setTimeout(resolve,10))}throw new Error(`fixture file did not appear: ${path}`) }
async function reapSandbox(sandbox: ChildProcess | undefined): Promise<void> {
  if(sandbox===undefined||sandbox.exitCode!==null||sandbox.signalCode!==null)return
  const exited=new Promise<void>((resolve)=>sandbox.once("exit",()=>resolve()))
  assert.equal(sandbox.kill("SIGKILL"),true,"R3G-C fixture sandbox SIGKILL must be delivered")
  await exited
}
async function closeFixtureServer(server: Server, sockets: Set<Socket>): Promise<void> {
  let closePromise: Promise<void>|undefined
  if(server.listening)closePromise=new Promise<void>((resolve,reject)=>server.close((error?:Error)=>error?reject(error):resolve()))
  for(const socket of sockets)socket.destroy()
  if(closePromise===undefined)return
  let timer:NodeJS.Timeout|undefined
  const timeout=new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error("R3G-C fixture server did not close within 2000ms")),2000)})
  try{await Promise.race([closePromise,timeout])}finally{if(timer!==undefined)clearTimeout(timer);server.unref()}
}
function topologyResponse(): string {
  return JSON.stringify({ success: true, err: "", result: { LoopbackLinks: [{ Name: "lo", Addresses: [{ Address: "127.0.0.1", PrefixLen: 8 }, { Address: "::1", PrefixLen: 128 }], Routes: [{ Destination: { IP: "127.0.0.0", Mask: "/wAAAA==" }, Gateway: "", MTU: 0 }, { Destination: { IP: "::1", Mask: "/////////////////////w==" }, Gateway: "", MTU: 0 }], GVisorGRO: false }], FDBasedLinks: null, XDPLinks: null, Defaultv4Gateway: { Route: { Destination: { IP: "", Mask: null }, Gateway: "", MTU: 0 }, Name: "" }, Defaultv6Gateway: { Route: { Destination: { IP: "", Mask: null }, Gateway: "", MTU: 0 }, Name: "" }, PCAP: false, LogPackets: false, NATBlob: false, PauseExternalNetworking: false, AllowConnectedOnSave: false, IsRestore: false } })
}
function fakeProvider(requirement: SandboxExecutionRequirement, resolveContainerBinding: DockerControlPlaneBindingProvider["resolveContainerBinding"], onResolution?: (request: GvisorContainerBindingRequest) => void): DockerControlPlaneBindingProvider {
  const socketEndpoint = createDockerSocketEndpointIdentity({ device: "1", inode: "2", uid: "0", gid: "0", mode: String(0o140600) })
  return Object.freeze({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: "3".repeat(64),
    socketEndpoint,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    async resolveDockerControlPlaneBinding(request: GvisorContainerBindingRequest) {
      onResolution?.(request)
      const binding = createGvisorContainerBinding({ providerId: KDO_H4_R3F_PROVIDER_ID, executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity, containerId: CONTAINER_ID })
      const observation = createDockerControlPlaneObservation({ providerIdentity: "3".repeat(64), socketEndpointIdentity: socketEndpoint.endpointIdentity, executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity, containerId: CONTAINER_ID, bindingIdentity: binding.bindingIdentity, imageManifestDigest: requirement.workload.source.digest, executable: requirement.workload.entrypoint.executable, argsIdentity: "4".repeat(64), nanoCpus: requirement.workload.resourcePolicy.cpuMillis*1_000_000, memoryBytes: requirement.workload.resourcePolicy.memoryBytes, memorySwapBytes: requirement.workload.resourcePolicy.memoryBytes })
      return Object.freeze({ binding, observation })
    },
    resolveContainerBinding,
  })
}
function networkRuntime(onCommit: (record: GvisorPhysicalNetworkRecord) => unknown): GvisorNetworkObserverRuntimeConfig {
  return { version: KDO_H4_R3G_C_RUNTIME_CONFIG_VERSION, trustedHostUid: typeof process.getuid === "function" ? String(process.getuid()) : "0", trustedHostSerializationTheoremVersion: KDO_H4_R3G_C_SERIALIZATION_THEOREM_VERSION, commitNetworkEvidence: onCommit }
}

function fixtureResolver(): DockerControlPlaneBindingProvider["resolveContainerBinding"] {
  return async (request) => createGvisorContainerBinding({ providerId: KDO_H4_R3F_PROVIDER_ID, executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity, containerId: CONTAINER_ID })
}

test("H4-R3G-C runtime rejects a Docker provider that is not the exact R3E resolver", { skip: process.platform !== "linux" }, async () => {
  const requirement = fixtureRequirement(); const resolverA = fixtureResolver(); const resolverB = fixtureResolver()
  const gvisor = validateGvisorObserverRuntimeConfig({ version: KDO_H4_R3E_RUNTIME_CONFIG_VERSION, runscPath: "/missing/runsc", expectedRunscSha256: "a".repeat(64), observerHelperPath: "/missing/helper", expectedObserverHelperSha256: "b".repeat(64), runtimeRoot: "/run/runsc", resolveContainerBinding: resolverA, commitLineageEvidence: () => ({}) })
  await assert.rejects(observeGvisorPhysicalNetworkRuntime({ requirement, dependencies: { gvisor, docker: fakeProvider(requirement, resolverB), network: networkRuntime(() => ({})) } }), /exact resolver/)
})

test("H4-R3G-C gateway ASK blocks before R3F or observer activity", async () => {
  const root=mkdtempSync(join(tmpdir(),"kodac-r3gc-ask-")), workspace=join(root,"workspace"); mkdirSync(workspace)
  try {
    const requirement=fixtureRequirement(); let calls=0
    const resolver: DockerControlPlaneBindingProvider["resolveContainerBinding"] = async (request) => { calls+=1; return createGvisorContainerBinding({ providerId: KDO_H4_R3F_PROVIDER_ID, executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity, containerId: CONTAINER_ID }) }
    const gvisor=validateGvisorObserverRuntimeConfig({version:KDO_H4_R3E_RUNTIME_CONFIG_VERSION,runscPath:"/missing/runsc",expectedRunscSha256:"a".repeat(64),observerHelperPath:"/missing/helper",expectedObserverHelperSha256:"b".repeat(64),runtimeRoot:"/run/runsc",resolveContainerBinding:resolver,commitLineageEvidence:()=>({})})
    const gateway=new GvisorNetworkExecutionGateway({filesystem:new NodeWorkspaceFileSystem(workspace),policy:fixedPolicy("ask"),gvisorObserver:gvisor,dockerControlPlane:fakeProvider(requirement,resolver,()=>{calls+=1}),networkObserver:networkRuntime(()=>({}))})
    await assert.rejects(gateway.observeGvisorPhysicalNetwork(requirement),ExecutionBlockedError); assert.equal(calls,0)
  } finally {rmSync(root,{recursive:true,force:true})}
})

test("H4-R3G-C Linux production gateway proves one shared-attempt loopback-only physical-network candidate", { skip: process.platform !== "linux" }, async (t) => {
  if(!requireIntegrationHost(t))return
  const root=mkdtempSync(join(tmpdir(),"kodac-r3gc-live-")), runtimeRoot=mkdtempSync(join(homedir(),".r3c-")), workspace=join(root,"workspace"); mkdirSync(workspace)
  const runscPath=compileFakeRunsc(root,runtimeRoot), helperPath=compileHelper(root), pidFile=join(runtimeRoot,"sandbox.pid"); let sandbox:ChildProcess|undefined; const server=createServer(); const sockets=new Set<Socket>(); let closingServer=false; const socketPath=deriveGvisorNetworkControlSocketPath(runtimeRoot,CONTAINER_ID)
  try {
    sandbox=spawn(runscPath,["sandbox"],{stdio:"ignore",shell:false}); await waitForFile(pidFile)
    let rpcCalls=0; server.on("connection",(socket)=>{if(closingServer){socket.destroy();return}sockets.add(socket);socket.once("close",()=>sockets.delete(socket));socket.on("data",(chunk)=>{assert.equal(chunk.toString("utf8"),'{"method":"containerManager.GetNetworkConfig","arg":{}}');rpcCalls+=1;socket.write(topologyResponse())})})
    await new Promise<void>((resolve,reject)=>server.listen(socketPath,(error?:Error)=>error?reject(error):resolve()))
    const requirement=fixtureRequirement(); const lineageRecords:GvisorRuntimeLineageRecord[]=[]; const attempts:string[]=[]
    let resolver!: DockerControlPlaneBindingProvider["resolveContainerBinding"]
    const providerPlaceholder={current:undefined as DockerControlPlaneBindingProvider|undefined}
    resolver=async(request)=>{const provider=providerPlaceholder.current;if(!provider)throw new Error("provider unavailable");return (await provider.resolveDockerControlPlaneBinding(request)).binding}
    const provider=fakeProvider(requirement,resolver,(request)=>attempts.push(request.executionAttemptIdentity));providerPlaceholder.current=provider
    const gvisor=validateGvisorObserverRuntimeConfig({version:KDO_H4_R3E_RUNTIME_CONFIG_VERSION,runscPath,expectedRunscSha256:sha256File(runscPath),observerHelperPath:helperPath,expectedObserverHelperSha256:sha256File(helperPath),runtimeRoot,resolveContainerBinding:resolver,commitLineageEvidence(record:GvisorRuntimeLineageRecord){lineageRecords.push(record);return createGvisorRuntimeLineageCommit(record)}})
    let committed:GvisorPhysicalNetworkRecord|undefined
    const gateway=new GvisorNetworkExecutionGateway({filesystem:new NodeWorkspaceFileSystem(workspace),policy:fixedPolicy("allow"),gvisorObserver:gvisor,dockerControlPlane:provider,networkObserver:networkRuntime((record)=>{committed=record;return createGvisorPhysicalNetworkCommit(record)})})
    const receipts:ExecutionReceipt[]=[]; const record=await gateway.observeGvisorPhysicalNetwork(requirement,{onReceipt(receipt){receipts.push(receipt)}})
    assert.equal(record.evidenceClass,KDO_H4_R3G_C_EVIDENCE_CLASS);assert.equal(record.executionAttemptIdentity,attempts[0]);assert.equal(lineageRecords.length,2);assert.equal(lineageRecords[0]?.executionAttemptIdentity,record.executionAttemptIdentity);assert.equal(lineageRecords[1]?.executionAttemptIdentity,record.executionAttemptIdentity);assert.equal(committed?.recordIdentity,record.recordIdentity);assert.equal(rpcCalls,2);assert.equal(receipts.length,1);assert.equal(receipts[0]?.capability,KDO_H4_R3G_C_CAPABILITY);assert.equal(receipts[0]?.result.status,"success")
  } finally {
    closingServer=true
    await reapSandbox(sandbox)
    await closeFixtureServer(server,sockets)
    rmSync(runtimeRoot,{recursive:true,force:true});rmSync(root,{recursive:true,force:true})
  }
})

test("H4-R3G-C runtime and gateway expose no mutation, active-probe, or generic RPC surface",()=>{
  const runtimeSource=source("../src/trust/sandbox-observer-gvisor-network-runtime.ts"),gatewaySource=source("../src/execution/gateway-gvisor-network.ts")
  for(const text of[runtimeSource,gatewaySource])assert.doesNotMatch(text,/SetNetworkArgs|CreateLinksAndRoutes|runsc\s+(?:create|start|exec|kill|delete)|node:http|node:https|node:dns|setns|ptrace|sudo|createSandboxBackendObservation|createSandboxExecutionEvidence/)
  assert.doesNotMatch(gatewaySource,/containerId|runtimeRoot|socketPath|uRPCMethod/)
})
