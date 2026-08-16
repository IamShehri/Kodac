import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync, mkdtempSync, readFileSync, renameSync, rmSync } from "node:fs"
import { createServer, type Server } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import {
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
  createGvisorContainerBindingRequest,
  createGvisorExecutionAttemptIdentity,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3F_BINDING_VERSION,
  KDO_H4_R3F_CONTROL_PLANE_VERSION,
  KDO_H4_R3F_DOCKER_API_VERSION,
  KDO_H4_R3F_EVIDENCE_CLASS,
  KDO_H4_R3F_LABELS,
  KDO_H4_R3F_LIMITS,
  KDO_H4_R3F_PROVIDER_ID,
  createDockerContainerBindingResolver,
  createDockerControlPlaneBindingProvider,
  createDockerControlPlaneObservation,
  validateDockerControlPlaneObservation,
  validateDockerControlPlaneProviderConfig,
  validateDockerSocketEndpointIdentity,
} from "../src/trust/sandbox-observer-docker-control-plane.ts"

const CONTAINER_ID = "c".repeat(64)
const SOURCE_DIGEST = `sha256:${"2".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")
function gitBlobSha1(text: string): string { const body=Buffer.from(text.replace(/\r\n/g,"\n"),"utf8");return createHash("sha1").update(`blob ${body.byteLength}\0`).update(body).digest("hex") }

function fixtureRequirement(input: { runtime?: "gvisor" | "kata-qemu"; digest?: string; cpuMillis?: number; memoryBytes?: number; intent?: string } = {}): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: input.intent ?? EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3f-fixture", digest: input.digest ?? SOURCE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({
      cpuMillis: input.cpuMillis ?? 1500,
      memoryBytes: input.memoryBytes ?? 536_870_912,
      ttlMs: 60_000,
      maxOutputBytes: 1_048_576,
    }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: input.runtime ?? "gvisor" })
}

function bindingRequest(requirement: SandboxExecutionRequirement, nonce = "123e4567-e89b-42d3-a456-426614174000") {
  const executionAttemptIdentity = createGvisorExecutionAttemptIdentity({
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    nonce,
  })
  return createGvisorContainerBindingRequest({ executionAttemptIdentity, requirement })
}

function expectedListPath(requirement: SandboxExecutionRequirement): string {
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

function defaultInspect(requirement: SandboxExecutionRequirement): Record<string, unknown> {
  return {
    Id: CONTAINER_ID,
    State: { Running: true, Paused: false, Restarting: false, Dead: false, Pid: 4321 },
    RestartCount: 0,
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
      Labels: {
        [KDO_H4_R3F_LABELS.bindingVersion]: KDO_H4_R3F_BINDING_VERSION,
        [KDO_H4_R3F_LABELS.requirementIdentity]: requirement.requirementIdentity,
        [KDO_H4_R3F_LABELS.workloadIdentity]: requirement.workload.workloadIdentity,
      },
    },
    ImageManifestDescriptor: { digest: requirement.workload.source.digest, mediaType: "application/vnd.oci.image.manifest.v1+json", size: 1234 },
  }
}

type FakeDockerOptions = {
  listBody?: string
  inspectBody?: string
  delayListMs?: number
}

type FakeDocker = {
  readonly socketPath: string
  readonly requests: string[]
  readonly server: Server
  close(): Promise<void>
}

async function startFakeDocker(root: string, requirement: SandboxExecutionRequirement, options: FakeDockerOptions = {}): Promise<FakeDocker> {
  const socketPath = join(root, "docker.sock")
  const requests: string[] = []
  const listPath = expectedListPath(requirement)
  const inspectPath = `/v${KDO_H4_R3F_DOCKER_API_VERSION}/containers/${CONTAINER_ID}/json?size=0`
  const listBody = options.listBody ?? JSON.stringify([{ Id: CONTAINER_ID, State: "running" }])
  const inspectBody = options.inspectBody ?? JSON.stringify(defaultInspect(requirement))
  const server = createServer((request, response) => {
    const method = request.method ?? ""
    const url = request.url ?? ""
    requests.push(`${method} ${url}`)
    if (method !== "GET") { response.statusCode=405; response.end(); return }
    if (url === listPath) {
      const send = () => { if (!response.destroyed) { response.setHeader("content-type","application/json"); response.end(listBody) } }
      if ((options.delayListMs ?? 0) > 0) setTimeout(send, options.delayListMs)
      else send()
      return
    }
    if (url === inspectPath) { response.setHeader("content-type","application/json"); response.end(inspectBody); return }
    response.statusCode = 404
    response.end()
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(socketPath, () => { server.off("error", reject); resolve() })
  })
  return {
    socketPath,
    requests,
    server,
    async close() {
      server.closeAllConnections()
      if (!server.listening) return
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

test("H4-R3F constants and pure E2 record are bounded and non-R3B", () => {
  assert.equal(KDO_H4_R3F_CONTROL_PLANE_VERSION, "kodac-h4-r3f-docker-control-plane-v1")
  assert.equal(KDO_H4_R3F_EVIDENCE_CLASS, "e2-docker-control-plane")
  assert.equal(KDO_H4_R3F_DOCKER_API_VERSION, "1.48")
  assert.equal(KDO_H4_R3F_PROVIDER_ID, "docker-engine")
  const observation = createDockerControlPlaneObservation({
    providerIdentity: "1".repeat(64), socketEndpointIdentity: "2".repeat(64), executionAttemptIdentity: "3".repeat(64),
    requirementIdentity: "4".repeat(64), workloadIdentity: "5".repeat(64), containerId: CONTAINER_ID,
    bindingIdentity: "6".repeat(64), imageManifestDigest: SOURCE_DIGEST, nanoCpus: 1_500_000_000,
    memoryBytes: 536_870_912, memorySwapBytes: 536_870_912,
  })
  assert.deepEqual(validateDockerControlPlaneObservation(observation), observation)
  assert.equal(observation.runtimeName, "runsc")
  assert.equal(observation.networkMode, "none")
  assert.equal(observation.privileged, false)
  for (const forbidden of ["observedSourceDigest","observedSemanticRuntimeClass","observedNetworkPolicy","observedResourcePolicy","observationIdentity","evidenceIdentity"]) {
    assert.equal(forbidden in observation, false)
  }
})

test("H4-R3F production surface has no Docker mutation SDK or R3B physical-evidence minting and preserves protected blobs", () => {
  const r3fSource = source("../src/trust/sandbox-observer-docker-control-plane.ts")
  assert.doesNotMatch(r3fSource, /createSandboxBackendObservation|createSandboxExecutionEvidence|dockerode|@docker|node:child_process|DOCKER_HOST|process\.env/)
  assert.doesNotMatch(r3fSource, /method:\s*["'](?:POST|PUT|PATCH|DELETE)["']/)
  assert.match(r3fSource, /method:\s*"GET"/)
  assert.equal(gitBlobSha1(source("../src/execution/gateway.ts")), "420df04c5e0a42b371a250d75e580c36bb32f8cb")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-gvisor-runtime.ts")), "1d02a5dbc1dc4071636c24327e7faf9906370ef5")
  assert.equal(gitBlobSha1(source("../src/trust/sandbox-observer-gvisor.ts")), "47c792ba01c9ba4b2db94d7558f282cdbd218660")
  assert.equal(gitBlobSha1(source("../native/gvisor-proc-observe.c")), "277b66c83ad82c96aa7dbd71f941daf8c6627738")
})

test("H4-R3F provider config binds one exact gVisor requirement and rejects widened config", () => {
  const requirement = fixtureRequirement()
  const validated = validateDockerControlPlaneProviderConfig({ socketPath: "/run/docker.sock", requirement })
  assert.equal(validated.requirement.requirementIdentity, requirement.requirementIdentity)
  assert.throws(() => validateDockerControlPlaneProviderConfig({ socketPath: "relative.sock", requirement }))
  assert.throws(() => validateDockerControlPlaneProviderConfig({ socketPath: "/run/docker.sock", requirement, resolveRequirement(){} }))
  assert.throws(() => validateDockerControlPlaneProviderConfig({ socketPath: "/run/docker.sock", requirement: fixtureRequirement({ runtime: "kata-qemu" }) }), /gvisor/)
})

test("H4-R3F non-Linux production provider fails closed", { skip: process.platform === "linux" }, () => {
  assert.throws(() => createDockerControlPlaneBindingProvider({ socketPath: "/tmp/docker.sock", requirement: fixtureRequirement() }), /requires Linux/)
})

test("H4-R3F Linux fake Docker proves exact list-inspect binding and R3E-compatible adapter", { skip: process.platform !== "linux" }, async () => {
  const root=mkdtempSync(join(tmpdir(),"kodac-r3f-live-")); const requirement=fixtureRequirement(); let fake:FakeDocker|undefined
  try {
    fake=await startFakeDocker(root,requirement)
    const provider=createDockerControlPlaneBindingProvider({socketPath:fake.socketPath,requirement})
    assert.deepEqual(validateDockerSocketEndpointIdentity(provider.socketEndpoint),provider.socketEndpoint)
    const request=bindingRequest(requirement)
    for(const forbidden of["socketPath","dockerHost","containerId","containerName","filters","httpPath","httpMethod","requirement"])assert.equal(forbidden in request,false)
    const result=await provider.resolveDockerControlPlaneBinding(request)
    assert.equal(result.binding.containerId,CONTAINER_ID)
    assert.equal(result.binding.providerId,KDO_H4_R3F_PROVIDER_ID)
    assert.equal(result.observation.bindingIdentity,result.binding.bindingIdentity)
    assert.equal(result.observation.imageManifestDigest,requirement.workload.source.digest)
    assert.equal(result.observation.nanoCpus,requirement.workload.resourcePolicy.cpuMillis*1_000_000)
    assert.equal(result.observation.memoryBytes,requirement.workload.resourcePolicy.memoryBytes)
    assert.deepEqual(validateDockerControlPlaneObservation(result.observation),result.observation)
    const viaProvider=await provider.resolveContainerBinding(request,{})
    assert.deepEqual(viaProvider,result.binding)
    assert.deepEqual(fake.requests,[
      `GET ${expectedListPath(requirement)}`,
      `GET /v1.48/containers/${CONTAINER_ID}/json?size=0`,
      `GET ${expectedListPath(requirement)}`,
      `GET /v1.48/containers/${CONTAINER_ID}/json?size=0`,
    ])
  } finally { await fake?.close(); rmSync(root,{recursive:true,force:true}) }
})

test("H4-R3F standalone resolver factory is R3E-compatible", { skip: process.platform !== "linux" }, async () => {
  const root=mkdtempSync(join(tmpdir(),"kodac-r3f-resolver-"));const requirement=fixtureRequirement();let fake:FakeDocker|undefined
  try{fake=await startFakeDocker(root,requirement);const resolver=createDockerContainerBindingResolver({socketPath:fake.socketPath,requirement});const request=bindingRequest(requirement);const binding=await resolver(request,{});assert.equal(binding.containerId,CONTAINER_ID)}finally{await fake?.close();rmSync(root,{recursive:true,force:true})}
})

test("H4-R3F rejects request/requirement mismatch before Docker I/O", { skip: process.platform !== "linux" }, async () => {
  const root=mkdtempSync(join(tmpdir(),"kodac-r3f-mismatch-"));const requirement=fixtureRequirement();const other=fixtureRequirement({intent:"d".repeat(64)});let fake:FakeDocker|undefined
  try{fake=await startFakeDocker(root,requirement);const provider=createDockerControlPlaneBindingProvider({socketPath:fake.socketPath,requirement});await assert.rejects(provider.resolveDockerControlPlaneBinding(bindingRequest(other)),/requirement identity/);assert.deepEqual(fake.requests,[])}finally{await fake?.close();rmSync(root,{recursive:true,force:true})}
})

test("H4-R3F fails closed on zero multiple and malformed list candidates", { skip: process.platform !== "linux" }, async () => {
  const requirement=fixtureRequirement()
  const cases=[
    {name:"zero",body:"[]",pattern:/exactly one/},
    {name:"multiple",body:JSON.stringify([{Id:CONTAINER_ID,State:"running"},{Id:"d".repeat(64),State:"running"}]),pattern:/exactly one/},
    {name:"short-id",body:JSON.stringify([{Id:"abc123",State:"running"}]),pattern:/64 lowercase/},
    {name:"non-running",body:JSON.stringify([{Id:CONTAINER_ID,State:"exited"}]),pattern:/State=running/},
  ]
  for(const item of cases){const root=mkdtempSync(join(tmpdir(),`kodac-r3f-${item.name}-`));let fake:FakeDocker|undefined;try{fake=await startFakeDocker(root,requirement,{listBody:item.body});const provider=createDockerControlPlaneBindingProvider({socketPath:fake.socketPath,requirement});await assert.rejects(provider.resolveDockerControlPlaneBinding(bindingRequest(requirement)),item.pattern)}finally{await fake?.close();rmSync(root,{recursive:true,force:true})}}
})

test("H4-R3F rejects every required inspect mismatch", { skip: process.platform !== "linux" }, async () => {
  const requirement=fixtureRequirement()
  const cases: Array<{name:string;mutate:(value:any)=>void;pattern:RegExp}> = [
    {name:"id",mutate:(v)=>{v.Id="d".repeat(64)},pattern:/ID does not match/},
    {name:"label",mutate:(v)=>{v.Config.Labels[KDO_H4_R3F_LABELS.requirementIdentity]="f".repeat(64)},pattern:/requirement-identity label/},
    {name:"digest",mutate:(v)=>{v.ImageManifestDescriptor.digest=`sha256:${"3".repeat(64)}`},pattern:/manifest digest/},
    {name:"runtime",mutate:(v)=>{v.HostConfig.Runtime="runc"},pattern:/Runtime must be runsc/},
    {name:"network",mutate:(v)=>{v.HostConfig.NetworkMode="bridge"},pattern:/NetworkMode must be none/},
    {name:"cpu",mutate:(v)=>{v.HostConfig.NanoCpus+=1_000_000},pattern:/NanoCpus/},
    {name:"memory",mutate:(v)=>{v.HostConfig.Memory+=1},pattern:/Memory does not match/},
    {name:"swap",mutate:(v)=>{v.HostConfig.MemorySwap=-1},pattern:/MemorySwap/},
    {name:"privileged",mutate:(v)=>{v.HostConfig.Privileged=true},pattern:/privileged/},
    {name:"restart-count",mutate:(v)=>{v.RestartCount=1},pattern:/RestartCount=0/},
    {name:"restart-policy",mutate:(v)=>{v.HostConfig.RestartPolicy.Name="always"},pattern:/RestartPolicy/},
    {name:"paused",mutate:(v)=>{v.State.Paused=true},pattern:/paused/},
    {name:"restarting",mutate:(v)=>{v.State.Restarting=true},pattern:/restarting/},
    {name:"dead",mutate:(v)=>{v.State.Dead=true},pattern:/dead/},
  ]
  for(const item of cases){const root=mkdtempSync(join(tmpdir(),`kodac-r3f-inspect-${item.name}-`));let fake:FakeDocker|undefined;try{const value:any=defaultInspect(requirement);item.mutate(value);fake=await startFakeDocker(root,requirement,{inspectBody:JSON.stringify(value)});const provider=createDockerControlPlaneBindingProvider({socketPath:fake.socketPath,requirement});await assert.rejects(provider.resolveDockerControlPlaneBinding(bindingRequest(requirement)),item.pattern)}finally{await fake?.close();rmSync(root,{recursive:true,force:true})}}
})

test("H4-R3F rejects duplicate-key deep and oversized Docker JSON", { skip: process.platform !== "linux" }, async () => {
  const requirement=fixtureRequirement()
  const good=JSON.stringify(defaultInspect(requirement))
  const duplicate=good.replace(`"Id":"${CONTAINER_ID}"`,`"Id":"${CONTAINER_ID}","Id":"${CONTAINER_ID}"`)
  const deep=`{"extra":${"[".repeat(66)}0${"]".repeat(66)}}`
  const cases=[
    {name:"duplicate",options:{inspectBody:duplicate},pattern:/duplicate JSON object key/},
    {name:"deep",options:{inspectBody:deep},pattern:/nesting depth/},
    {name:"oversized",options:{listBody:" ".repeat(KDO_H4_R3F_LIMITS.maxListResponseBytes+1)},pattern:/body exceeds bound/},
  ]
  for(const item of cases){const root=mkdtempSync(join(tmpdir(),`kodac-r3f-json-${item.name}-`));let fake:FakeDocker|undefined;try{fake=await startFakeDocker(root,requirement,item.options);const provider=createDockerControlPlaneBindingProvider({socketPath:fake.socketPath,requirement});await assert.rejects(provider.resolveDockerControlPlaneBinding(bindingRequest(requirement)),item.pattern)}finally{await fake?.close();rmSync(root,{recursive:true,force:true})}}
})

test("H4-R3F abort terminates owned Docker read and cannot become late success", { skip: process.platform !== "linux" }, async () => {
  const root=mkdtempSync(join(tmpdir(),"kodac-r3f-abort-"));const requirement=fixtureRequirement();let fake:FakeDocker|undefined
  try{fake=await startFakeDocker(root,requirement,{delayListMs:200});const provider=createDockerControlPlaneBindingProvider({socketPath:fake.socketPath,requirement});const controller=new AbortController();const promise=provider.resolveDockerControlPlaneBinding(bindingRequest(requirement),{signal:controller.signal});setTimeout(()=>controller.abort(),10);await assert.rejects(promise,/aborted/);await new Promise<void>((resolve)=>setTimeout(resolve,250));assert.equal(fake.requests.length,1)}finally{await fake?.close();rmSync(root,{recursive:true,force:true})}
})

test("H4-R3F detects Unix socket replacement before trusted Docker request", { skip: process.platform !== "linux" }, async () => {
  const root=mkdtempSync(join(tmpdir(),"kodac-r3f-socket-"));const requirement=fixtureRequirement();let original:FakeDocker|undefined;let replacement:FakeDocker|undefined
  try{
    original=await startFakeDocker(root,requirement)
    const provider=createDockerControlPlaneBindingProvider({socketPath:original.socketPath,requirement})
    const moved=`${original.socketPath}.old`;renameSync(original.socketPath,moved)
    replacement=await startFakeDocker(root,requirement)
    await assert.rejects(provider.resolveDockerControlPlaneBinding(bindingRequest(requirement)),/endpoint identity changed/)
    assert.deepEqual(replacement.requests,[])
  }finally{await replacement?.close();await original?.close();assert.ok(existsSync(root));rmSync(root,{recursive:true,force:true})}
})
