import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { spawnSync } from "node:child_process"
import {
  chmodSync,
  chownSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs"
import { createServer as createHttpServer, type IncomingMessage, type Server as HttpServer, type ServerResponse } from "node:http"
import { createConnection, createServer as createNetServer, type Server as NetServer } from "node:net"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import type { Duplex } from "node:stream"
import test from "node:test"

import {
  KDO_H4_R1_APPROVAL_VERSION,
  KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
  createApprovalEvidence,
  type ApprovalEvidence,
  type ApprovalRequest,
} from "../src/trust/approval.ts"
import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import { createSandboxExecutionApprovalBinding, createSandboxExecutionApprovalIntent } from "../src/trust/sandbox-execution-approval-binding.ts"
import { createSandboxAdmissionPermit, type SandboxAdmissionPermit } from "../src/trust/sandbox-admission-permit.ts"
import {
  createCanonicalR4BB1Reservation,
  createSandboxDormantCreatePrepared,
  createSandboxDormantCreatedAdmission,
  createSandboxDormantCreatedAdmissionCommit,
  createSandboxDormantDockerObservation,
  type SandboxDormantCreatePrepared,
  type SandboxDormantCreatedAdmission,
  type SandboxDormantCreatedAdmissionCommit,
} from "../src/trust/sandbox-admission-dormant-create.ts"
import {
  createDockerSocketEndpointIdentity,
  type DockerSocketEndpointIdentity,
} from "../src/trust/sandbox-observer-docker-control-plane.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  KDO_H4_R4B_B2A_FAILURE_CODES,
  createSandboxPrestartFailedFence,
  createSandboxPrestartFailure,
  createSandboxPrestartFailureCommit,
  createSandboxPrestartOwnerCapability,
  createSandboxPrestartOwnerClaimedFence,
  createSandboxPrestartOwnershipClaim,
  createSandboxPrestartOwnershipClaimCommit,
  createSandboxPrestartPrepared,
  createSandboxPrestartPreparedCommit,
  createSandboxPrestartPreparedFence,
  sandboxPrestartOwnerInstanceIdentity,
  validateSandboxPrestartFailure,
  validateSandboxPrestartFailureCommit,
  validateSandboxPrestartOwnershipClaim,
  validateSandboxPrestartOwnershipClaimCommit,
  validateSandboxPrestartPrepared,
  validateSandboxPrestartPreparedCommit,
  validateSandboxPrestartStateFence,
  type SandboxPrestartFailure,
  type SandboxPrestartFailureCommit,
  type SandboxPrestartOwnershipClaim,
  type SandboxPrestartOwnershipClaimCommit,
  type SandboxPrestartPrepared,
  type SandboxPrestartPreparedCommit,
  type SandboxPrestartStateFence,
} from "../src/trust/sandbox-admission-prestart-output.ts"
import {
  GvisorDockerPrestartOutputGateway,
  KDO_H4_R4B_B2A_RUNTIME_LIMITS,
  createGvisorDockerPrestartOutputRuntime,
} from "../src/execution/gateway-gvisor-docker-prestart-output-runtime.ts"

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8")
const FIXTURE_DIGEST = `sha256:${"1".repeat(64)}`
const IMAGE_ID = `sha256:${"d".repeat(64)}`
const IMAGE_USER = "10001:10001"
const IMAGE_ENV = Object.freeze(["NODE_ENV=production", "PATH=/usr/local/bin:/usr/bin"])
const IMAGE_WORKING_DIR = "/workspace"
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)
const REQUEST_INSTANCE = "123e4567-e89b-42d3-a456-426614174000"
const CONTAINER_ID = "c".repeat(64)
const DOCKER_API_1_48_MASKED_PATHS = Object.freeze(["/proc/asound", "/proc/acpi", "/proc/kcore", "/proc/keys", "/proc/latency_stats", "/proc/timer_list", "/proc/timer_stats", "/proc/sched_debug", "/proc/scsi", "/sys/firmware", "/sys/devices/virtual/powercap"] as const)
const DOCKER_API_1_48_READONLY_PATHS = Object.freeze(["/proc/bus", "/proc/fs", "/proc/irq", "/proc/sys", "/proc/sysrq-trigger"] as const)

function clone<T>(value: T): T { return JSON.parse(JSON.stringify(value)) as T }
function sha256(value: string): string { return createHash("sha256").update(value, "utf8").digest("hex") }
function referenceRequestIdentity(intent: ApprovalRequest["intent"]): string { return sha256(`${KDO_H4_R1_APPROVAL_VERSION}\n${JSON.stringify({ capability: intent.capability, paths: intent.paths, inputDigest: intent.inputDigest })}`) }
function evidenceCommit(evidence: ApprovalEvidence) { return Object.freeze({ version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION, evidenceIdentity: evidence.evidenceIdentity, durability: "durable" as const }) }

function fixtureRequirement(maxOutputBytes = 1024): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({ mode: "read-only", workspaceIdentity: WORKSPACE_IDENTITY, executionIntentIdentity: EXECUTION_INTENT_IDENTITY, scope: { readPaths: ["src"], writePaths: [] } })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/kodac-b2a-fixture", digest: FIXTURE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1000, memoryBytes: 536_870_912, ttlMs: 60_000, maxOutputBytes }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function fixedPermit(): SandboxAdmissionPermit {
  const requirement = fixtureRequirement()
  const expected = createSandboxExecutionApprovalIntent(requirement)
  const intent = { capability: expected.capability, paths: [...expected.paths], inputDigest: expected.inputDigest }
  const request: ApprovalRequest = { version: KDO_H4_R1_APPROVAL_VERSION, requestIdentity: referenceRequestIdentity(intent), requestInstanceId: REQUEST_INSTANCE, intent }
  const binding = createSandboxExecutionApprovalBinding(requirement, request)
  const asked = createApprovalEvidence(request, "asked")
  const decided = createApprovalEvidence(request, "decided", "allowed-once")
  return createSandboxAdmissionPermit({ binding, askedEvidence: asked, askedEvidenceCommit: evidenceCommit(asked), decidedEvidence: decided, decidedEvidenceCommit: evidenceCommit(decided) })
}

function b1Lineage(permit: SandboxAdmissionPermit, endpoint: DockerSocketEndpointIdentity): { prepared: SandboxDormantCreatePrepared; created: SandboxDormantCreatedAdmission; createdCommit: SandboxDormantCreatedAdmissionCommit } {
  const prepared = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  const observation = createSandboxDormantDockerObservation({
    socketEndpointIdentity: endpoint.endpointIdentity,
    containerId: CONTAINER_ID,
    containerName: prepared.containerName,
    imageManifestDigest: prepared.sourceDigest,
    executable: prepared.entrypointExecutable,
    argsIdentity: prepared.argsIdentity,
    runtimeName: prepared.runtimeName,
    networkMode: prepared.networkMode,
    networkAttachmentCount: 0,
    nanoCpus: prepared.nanoCpus,
    memoryBytes: prepared.memoryBytes,
    memorySwapBytes: prepared.memorySwapBytes,
    restartCount: 0,
    restartPolicy: "no",
    privileged: false,
    tty: false,
    running: false,
    paused: false,
    restarting: false,
    dead: false,
    pid: 0,
    labels: prepared.labels,
  }, prepared, permit)
  const created = createSandboxDormantCreatedAdmission(prepared, observation, permit)
  return { prepared, created, createdCommit: createSandboxDormantCreatedAdmissionCommit(created, permit, "created") }
}

function syntheticPrepared() {
  const permit = fixedPermit()
  const endpoint = createDockerSocketEndpointIdentity({ device: "1", inode: "2", uid: "0", gid: "0", mode: String(0o140600) })
  const lineage = b1Lineage(permit, endpoint)
  const prepared = createSandboxPrestartPrepared({ createdAdmission: lineage.created, createdAdmissionCommit: lineage.createdCommit, permit, providerIdentity: "e".repeat(64), socketEndpointIdentity: endpoint.endpointIdentity })
  return { permit, endpoint, lineage, prepared }
}

test("H4-R4B-B2A prepared and state identities are exact and deterministic", () => {
  const fixture = syntheticPrepared()
  const rebuilt = createSandboxPrestartPrepared({ createdAdmission: fixture.lineage.created, createdAdmissionCommit: fixture.lineage.createdCommit, permit: fixture.permit, providerIdentity: fixture.prepared.providerIdentity, socketEndpointIdentity: fixture.endpoint.endpointIdentity })
  assert.deepEqual(rebuilt, fixture.prepared)
  assert.deepEqual(validateSandboxPrestartPrepared(clone(fixture.prepared), fixture.lineage.created, fixture.lineage.createdCommit, fixture.permit), fixture.prepared)
  const commit = createSandboxPrestartPreparedCommit(fixture.prepared)
  assert.deepEqual(validateSandboxPrestartPreparedCommit(clone(commit), fixture.prepared), commit)
  const fence = createSandboxPrestartPreparedFence(fixture.prepared)
  assert.equal(fence.state, "PREPARED")
  assert.equal(fence.ownershipClaimIdentity, null)
  assert.equal(fence.ownerInstanceIdentity, null)
  assert.equal(fence.failureIdentity, null)
  assert.deepEqual(validateSandboxPrestartStateFence(clone(fence), fixture.prepared), fence)
})

test("H4-R4B-B2A owner capability is sealed, non-structural, and unique", () => {
  const fixture = syntheticPrepared()
  const ownerA = createSandboxPrestartOwnerCapability()
  const ownerB = createSandboxPrestartOwnerCapability()
  assert.notEqual(sandboxPrestartOwnerInstanceIdentity(ownerA), sandboxPrestartOwnerInstanceIdentity(ownerB))
  assert.throws(() => sandboxPrestartOwnerInstanceIdentity({ version: ownerA.version }), /not trusted/)
  assert.throws(() => sandboxPrestartOwnerInstanceIdentity(JSON.parse(JSON.stringify(ownerA))), /not trusted/)
  assert.throws(() => sandboxPrestartOwnerInstanceIdentity(new Proxy(ownerA, {})), /not trusted/)
  const claim = createSandboxPrestartOwnershipClaim(fixture.prepared, ownerA)
  const claimCommit = createSandboxPrestartOwnershipClaimCommit(claim)
  assert.deepEqual(validateSandboxPrestartOwnershipClaim(clone(claim), fixture.prepared), claim)
  assert.deepEqual(validateSandboxPrestartOwnershipClaimCommit(clone(claimCommit), claim), claimCommit)
  const fence = createSandboxPrestartOwnerClaimedFence(fixture.prepared, claim)
  assert.equal(fence.state, "OWNER_CLAIMED")
  assert.equal(fence.ownerInstanceIdentity, claim.ownerInstanceIdentity)
})

test("H4-R4B-B2A durable failure enum excludes indeterminate replay pseudo-failures", () => {
  const fixture = syntheticPrepared()
  const owner = createSandboxPrestartOwnerCapability()
  for (const code of KDO_H4_R4B_B2A_FAILURE_CODES) {
    const failure = createSandboxPrestartFailure(fixture.prepared, code === "owner-lost-graceful" ? "ready-invalidation" : "attaching", code, code === "owner-lost-graceful" ? owner : null)
    const commit = createSandboxPrestartFailureCommit(failure, "created")
    assert.deepEqual(validateSandboxPrestartFailure(clone(failure), fixture.prepared), failure)
    assert.deepEqual(validateSandboxPrestartFailureCommit(clone(commit), failure), commit)
  }
  for (const forbidden of ["indeterminate", "owner-already-claimed", "owner-lost-indeterminate"]) {
    const failure = createSandboxPrestartFailure(fixture.prepared, "attaching", "aborted", null)
    const hostile = clone(failure) as unknown as Record<string, unknown>
    hostile.failureCode = forbidden
    assert.throws(() => validateSandboxPrestartFailure(hostile, fixture.prepared), /failureCode/)
  }
})

test("H4-R4B-B2A terminal fences distinguish pre-owner and exact-owner failures", () => {
  const fixture = syntheticPrepared()
  const preOwnerFailure = createSandboxPrestartFailure(fixture.prepared, "prepare", "aborted", null)
  const preOwnerFence = createSandboxPrestartFailedFence(fixture.prepared, preOwnerFailure, null)
  assert.equal(preOwnerFence.state, "FAILED_TERMINAL")
  assert.equal(preOwnerFence.ownerInstanceIdentity, null)
  const owner = createSandboxPrestartOwnerCapability()
  const claim = createSandboxPrestartOwnershipClaim(fixture.prepared, owner)
  const ownerFailure = createSandboxPrestartFailure(fixture.prepared, "ready-invalidation", "owner-lost-graceful", owner)
  const ownerFence = createSandboxPrestartFailedFence(fixture.prepared, ownerFailure, claim)
  assert.equal(ownerFence.ownerInstanceIdentity, claim.ownerInstanceIdentity)
  assert.throws(() => createSandboxPrestartFailedFence(fixture.prepared, ownerFailure, null), /pre-owner failure/)
})

test("H4-R4B-B2A schema is closed and cannot serialize indeterminate as durable truth", () => {
  const schema = JSON.parse(source("../../../schema/kdo-h4-r4b-b2a-prestart-output.schema.json"))
  for (const key of ["prepared", "preparedCommit", "stateFence", "ownershipClaim", "ownershipClaimCommit", "failure", "failureCommit"]) assert.equal(schema.$defs[key].additionalProperties, false, key)
  const codes = schema.$defs.failure.properties.failureCode.enum as string[]
  for (const forbidden of ["indeterminate", "owner-already-claimed", "owner-lost-indeterminate"]) assert.equal(codes.includes(forbidden), false)
  assert.deepEqual(schema.$defs.ownershipClaimCommit.properties.disposition, { const: "created" })
})

interface FakeDocker {
  readonly socketPath: string
  readonly requests: string[]
  readonly server: HttpServer
  close(): Promise<void>
}

function inspectBody(prepared: SandboxDormantCreatePrepared): Record<string, unknown> {
  return {
    Id: CONTAINER_ID,
    Name: `/${prepared.containerName}`,
    Image: IMAGE_ID,
    Path: prepared.entrypointExecutable,
    Args: ["--version"],
    State: { Status: "created", Running: false, Paused: false, Restarting: false, Dead: false, Pid: 0 },
    RestartCount: 0,
    Config: {
      Image: prepared.sourceReference,
      User: IMAGE_USER,
      Env: [...IMAGE_ENV],
      WorkingDir: IMAGE_WORKING_DIR,
      AttachStdin: false,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      OpenStdin: false,
      StdinOnce: false,
      NetworkDisabled: false,
      Volumes: {},
      Healthcheck: { Test: ["NONE"] },
      Labels: { ...prepared.labels },
    },
    HostConfig: {
      Runtime: "runsc", NetworkMode: "none", Privileged: false,
      NanoCpus: prepared.nanoCpus, Memory: prepared.memoryBytes, MemorySwap: prepared.memorySwapBytes,
      RestartPolicy: { Name: "no", MaximumRetryCount: 0 },
      Binds: null, Links: null, Dns: [], DnsOptions: [], DnsSearch: [], ExtraHosts: [], VolumesFrom: null,
      CapAdd: null, CapDrop: null, GroupAdd: null, Devices: [], DeviceCgroupRules: null, DeviceRequests: null,
      Ulimits: null, SecurityOpt: null, Mounts: [], PortBindings: {}, StorageOpt: {}, Tmpfs: {}, Sysctls: {},
      PublishAllPorts: false, AutoRemove: false, ReadonlyRootfs: false, PidMode: "", IpcMode: "private", UTSMode: "",
      UsernsMode: "", CgroupnsMode: "private", CgroupParent: "", VolumeDriver: "",
      MaskedPaths: [...DOCKER_API_1_48_MASKED_PATHS], ReadonlyPaths: [...DOCKER_API_1_48_READONLY_PATHS],
    },
    NetworkSettings: { Networks: { none: {} } },
    Mounts: [],
  }
}

async function startFakeDocker(root: string, prepared: SandboxDormantCreatePrepared): Promise<FakeDocker> {
  const socketPath = join(root, "docker.sock")
  const requests: string[] = []
  const sockets = new Set<Duplex>()
  const server = createHttpServer((request: IncomingMessage, response: ServerResponse) => {
    const method = request.method ?? ""; const url = request.url ?? ""; requests.push(`${method} ${url}`)
    if (method === "GET" && url === `/v1.48/images/${encodeURIComponent(prepared.sourceReference)}/json`) {
      response.writeHead(200, { "Content-Type": "application/json" })
      response.end(JSON.stringify({ Id: IMAGE_ID, Descriptor: { digest: prepared.sourceDigest }, Config: { User: IMAGE_USER, Env: [...IMAGE_ENV], WorkingDir: IMAGE_WORKING_DIR, Volumes: {} } }))
      return
    }
    if (method === "GET" && url === `/v1.48/containers/${CONTAINER_ID}/json`) {
      response.writeHead(200, { "Content-Type": "application/json" }); response.end(JSON.stringify(inspectBody(prepared))); return
    }
    response.writeHead(404); response.end("{}")
  })
  server.on("upgrade", (request, socket) => {
    sockets.add(socket); socket.once("close", () => sockets.delete(socket)); requests.push(`UPGRADE ${request.url ?? ""}`)
    socket.write(["HTTP/1.1 101 UPGRADED", "Content-Type: application/vnd.docker.multiplexed-stream", "Connection: Upgrade", "Upgrade: tcp", "", ""].join("\r\n"))
  })
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(socketPath, () => { server.off("error", reject); resolve() }) })
  chmodSync(socketPath, 0o600)
  return { socketPath, requests, server, async close() { for (const socket of sockets) socket.destroy(); server.closeAllConnections(); if (server.listening) await new Promise<void>((resolve) => server.close(() => resolve())) } }
}

function durableStore() {
  let preparedRecord: SandboxPrestartPrepared | undefined
  let preparedCommit: SandboxPrestartPreparedCommit | undefined
  let fence: SandboxPrestartStateFence | undefined
  let claim: SandboxPrestartOwnershipClaim | undefined
  let claimCommit: SandboxPrestartOwnershipClaimCommit | undefined
  let failure: SandboxPrestartFailure | undefined
  let failureCommit: SandboxPrestartFailureCommit | undefined
  let writes = 0
  return {
    writes: () => writes,
    state: () => fence,
    failure: () => failure,
    commitPreparationTransaction: (input: { prepared: SandboxPrestartPrepared; preparedCommit: SandboxPrestartPreparedCommit; fence: SandboxPrestartStateFence }) => {
      if (preparedRecord === undefined) { preparedRecord = input.prepared; preparedCommit = input.preparedCommit; fence = input.fence; writes += 1; return { disposition: "created", prepared: preparedRecord, preparedCommit, fence } }
      return { disposition: "existing", prepared: preparedRecord, preparedCommit, fence }
    },
    readStateFence: () => { if (fence === undefined) throw new Error("missing fence"); return fence },
    commitOwnershipClaimTransaction: (input: { claim: SandboxPrestartOwnershipClaim; claimCommit: SandboxPrestartOwnershipClaimCommit; expectedFence: SandboxPrestartStateFence; nextFence: SandboxPrestartStateFence }) => {
      if (fence === undefined) throw new Error("missing fence")
      if (fence.state === "OWNER_CLAIMED") return { kind: "owner-claimed-unavailable", claim: null, claimCommit: null, fence }
      if (fence.state === "FAILED_TERMINAL") return { kind: "failed-terminal", claim: null, claimCommit: null, fence }
      if (fence.fenceIdentity !== input.expectedFence.fenceIdentity) throw new Error("claim CAS conflict")
      claim = input.claim; claimCommit = input.claimCommit; fence = input.nextFence; writes += 1
      return { kind: "created", claim, claimCommit, fence }
    },
    commitFailureTransaction: (input: { failure: SandboxPrestartFailure; failureCommit: SandboxPrestartFailureCommit; expectedFence: SandboxPrestartStateFence; nextFence: SandboxPrestartStateFence }) => {
      if (fence === undefined) throw new Error("missing fence")
      if (fence.state === "FAILED_TERMINAL") {
        if (fence.failureIdentity !== input.failure.failureIdentity || failure === undefined || failureCommit === undefined) throw new Error("conflicting terminal identity")
        return { disposition: "existing", failure, failureCommit: createSandboxPrestartFailureCommit(failure, "existing"), fence }
      }
      if (fence.fenceIdentity !== input.expectedFence.fenceIdentity) throw new Error("failure CAS conflict")
      failure = input.failure; failureCommit = input.failureCommit; fence = input.nextFence; writes += 1
      return { disposition: "created", failure, failureCommit, fence }
    },
  }
}

function rootStage(stage: string): void { process.stderr.write(`B2A_ROOT_STAGE=${stage}\n`) }

async function rootPhysicalProof(): Promise<void> {
  rootStage("begin")
  assert.equal(process.platform, "linux")
  assert.equal(process.geteuid?.(), 0)
  assert.equal(process.getegid?.(), 0)
  assert.match(readFileSync("/proc/self/uid_map", "utf8").trim().replace(/\s+/g, " "), /^0 0 4294967295$/)
  assert.match(readFileSync("/proc/self/gid_map", "utf8").trim().replace(/\s+/g, " "), /^0 0 4294967295$/)
  const root = mkdtempSync("/run/kodac-b2a-")
  const permit = fixedPermit()
  const preparedForName = createSandboxDormantCreatePrepared(permit, createCanonicalR4BB1Reservation(permit))
  let fake: FakeDocker | undefined
  try {
    rootStage("before-fake-docker")
    fake = await startFakeDocker(root, preparedForName)
    rootStage("fake-docker-ready")
    const stats = lstatSync(fake.socketPath, { bigint: true })
    const endpoint = createDockerSocketEndpointIdentity({ device: stats.dev.toString(10), inode: stats.ino.toString(10), uid: stats.uid.toString(10), gid: stats.gid.toString(10), mode: stats.mode.toString(10) })
    assert.equal(endpoint.uid, "0"); assert.equal(endpoint.gid, "0"); assert.equal(Number(stats.mode & 0o777n), 0o600)
    const lineage = b1Lineage(permit, endpoint)
    const store = durableStore()
    const runtime = createGvisorDockerPrestartOutputRuntime({
      socketPath: fake.socketPath,
      commitPreparationTransaction: store.commitPreparationTransaction,
      readStateFence: store.readStateFence,
      commitOwnershipClaimTransaction: store.commitOwnershipClaimTransaction,
      commitFailureTransaction: store.commitFailureTransaction,
    })
    const gateway = new GvisorDockerPrestartOutputGateway(runtime)
    rootStage("before-prepare")
    const result = await gateway.preparePrestartOutput(permit, lineage.created, lineage.createdCommit)
    rootStage("after-prepare")
    assert.equal(result.status, "PRESTART_READY")
    if (result.status !== "PRESTART_READY") throw new Error("unexpected unavailable result")
    assert.equal(store.state()?.state, "OWNER_CLAIMED")
    assert.equal(store.writes(), 2)
    assert.equal(fake.requests.filter((entry) => entry.startsWith("UPGRADE ")).length, 1)
    assert.equal(fake.requests.some((entry) => /\/start|\/exec|\/restart|\/stop|\/kill|DELETE/.test(entry)), false)
    assert.ok(fake.requests.every((entry) => entry.startsWith("GET ") || entry === `UPGRADE /v1.48/containers/${CONTAINER_ID}/attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1`))
    rootStage("before-invalidate")
    await gateway.invalidatePrestartOutput(result.readiness)
    rootStage("after-invalidate")
    assert.equal(store.state()?.state, "FAILED_TERMINAL")
    assert.equal(store.failure()?.failureCode, "owner-lost-graceful")
    assert.equal(fake.requests.some((entry) => entry.includes("/start")), false)
  } finally {
    rootStage("before-close")
    await fake?.close()
    rootStage("after-close")
    rmSync(root, { recursive: true, force: true })
  }
}

if (process.env.KODAC_B2A_ROOT_CHILD === "1") {
  await rootPhysicalProof()
  process.stdout.write("B2A_ROOT_PROOF_PASS\n")
  process.exit(0)
}

function commandAvailable(name: string): boolean { return spawnSync("bash", ["-lc", `command -v -- ${name}`], { encoding: "utf8" }).status === 0 }
function sudo(args: readonly string[]): void {
  const result = spawnSync("sudo", ["-n", ...args], { encoding: "utf8" })
  assert.equal(result.status, 0, `sudo ${args.join(" ")} failed\nstdout=${result.stdout}\nstderr=${result.stderr}`)
}
function getfacl(path: string): string {
  const result = spawnSync("getfacl", ["-cpn", "--", path], { encoding: "utf8" })
  assert.equal(result.status, 0, `getfacl failed for ${path}: ${result.stderr}`)
  return result.stdout
}
function actorEvidence() {
  const status = readFileSync("/proc/self/status", "utf8")
  const uid = /^Uid:\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/m.exec(status)
  const cap = /^CapEff:\s+([0-9A-Fa-f]+)$/m.exec(status)
  assert.ok(uid); assert.ok(cap)
  const fsuid = Number(uid[4]); assert.ok(Number.isSafeInteger(fsuid) && fsuid > 0)
  const capEff = BigInt(`0x${cap[1]}`)
  for (const bit of [0n, 1n, 2n, 3n]) assert.equal((capEff & (1n << bit)) === 0n, true, `negative actor capability bit ${bit} must be absent`)
  const egid = process.getegid?.(); assert.equal(typeof egid, "number")
  const groups = new Set<number>([egid as number, ...(process.getgroups?.() ?? [])])
  assert.equal(groups.has(egid as number), true)
  return Object.freeze({ fsuid, egid: egid as number, groups })
}
async function listenUnix(path: string): Promise<NetServer> {
  const server = createNetServer((socket) => socket.end())
  await new Promise<void>((resolve, reject) => { server.once("error", reject); server.listen(path, () => { server.off("error", reject); resolve() }) })
  return server
}
async function connectUnix(path: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const socket = createConnection({ path })
    socket.once("connect", () => { socket.destroy(); resolve() })
    socket.once("error", reject)
  })
}
async function expectConnectEacces(path: string): Promise<void> {
  await assert.rejects(connectUnix(path), (error: unknown) => {
    const code = (error as NodeJS.ErrnoException).code
    assert.equal(code, "EACCES")
    return true
  })
}
function inodeIdentity(path: string): string { const stats = lstatSync(path, { bigint: true }); return `${stats.dev}:${stats.ino}:${stats.mode}:${stats.uid}:${stats.gid}` }
function expectFsEacces(operation: () => void): void {
  assert.throws(operation, (error: unknown) => { assert.equal((error as NodeJS.ErrnoException).code, "EACCES"); return true })
}
function controlDirectorySequence(root: string): void {
  const createPath = join(root, "create-ok"); writeFileSync(createPath, "ok"); unlinkSync(createPath)
  const unlinkPath = join(root, "unlink-ok"); writeFileSync(unlinkPath, "ok"); unlinkSync(unlinkPath)
  const renameSource = join(root, "rename-source"); const renameTarget = join(root, "rename-target"); writeFileSync(renameSource, "ok"); writeFileSync(renameTarget, "target"); renameSync(renameSource, renameTarget); unlinkSync(renameTarget)
}
function denialDirectorySequence(root: string, actorSourceRoot: string): void {
  const createTarget = join(root, "create-denied")
  const unlinkTarget = join(root, "unlink-denied")
  const renameTarget = join(root, "rename-denied")
  const renameSource = join(actorSourceRoot, "rename-source")
  writeFileSync(renameSource, "actor-source")
  const unlinkBefore = inodeIdentity(unlinkTarget); const renameTargetBefore = inodeIdentity(renameTarget); const renameSourceBefore = inodeIdentity(renameSource)
  expectFsEacces(() => writeFileSync(createTarget, "denied")); assert.throws(() => lstatSync(createTarget), (error: unknown) => (error as NodeJS.ErrnoException).code === "ENOENT")
  expectFsEacces(() => unlinkSync(unlinkTarget)); assert.equal(inodeIdentity(unlinkTarget), unlinkBefore)
  expectFsEacces(() => renameSync(renameSource, renameTarget)); assert.equal(inodeIdentity(renameTarget), renameTargetBefore); assert.equal(inodeIdentity(renameSource), renameSourceBefore)
}

async function posixAclPhysicalProof(): Promise<void> {
  const actor = actorEvidence()
  assert.equal(process.geteuid?.(), actor.fsuid)
  assert.equal(commandAvailable("setfacl"), true)
  assert.equal(commandAvailable("getfacl"), true)
  const root = mkdtempSync(join(tmpdir(), "kodac-b2a-acl-"))
  const actorSourceRoot = join(root, "actor-source"); mkdirSync(actorSourceRoot, 0o700)
  const extControlDir = join(root, "ext-control"); const extDenyDir = join(root, "ext-deny")
  const minControlDir = join(root, "min-control"); const minDenyDir = join(root, "min-deny")
  for (const path of [extControlDir, extDenyDir, minControlDir, minDenyDir]) mkdirSync(path, 0o700)
  const extControlSocket = join(extControlDir, "control.sock"); const extDenySocket = join(extDenyDir, "deny.sock")
  const minControlSocket = join(minControlDir, "control.sock"); const minDenySocket = join(minDenyDir, "deny.sock")
  const servers: NetServer[] = []
  try {
    servers.push(await listenUnix(extControlSocket), await listenUnix(extDenySocket), await listenUnix(minControlSocket), await listenUnix(minDenySocket))
    for (const path of [join(extDenyDir, "unlink-denied"), join(extDenyDir, "rename-denied"), join(minDenyDir, "unlink-denied"), join(minDenyDir, "rename-denied")]) writeFileSync(path, "protected")

    sudo(["chown", "root:root", extControlDir, extDenyDir, extControlSocket, extDenySocket, join(extDenyDir, "unlink-denied"), join(extDenyDir, "rename-denied")])
    sudo(["chmod", "0750", extControlDir, extDenyDir]); sudo(["chmod", "0600", extControlSocket, extDenySocket])
    sudo(["setfacl", "-m", `u:${actor.fsuid}:rwx,m:rwx`, "--", extControlDir])
    sudo(["setfacl", "-m", `u:${actor.fsuid}:rwx,m:r-x`, "--", extDenyDir])
    sudo(["setfacl", "-m", `u:${actor.fsuid}:rw,m:rw`, "--", extControlSocket])
    sudo(["setfacl", "-m", `u:${actor.fsuid}:rw,m:---`, "--", extDenySocket])

    const extSocketAcl = getfacl(extDenySocket); const extDirAcl = getfacl(extDenyDir)
    assert.match(extSocketAcl, new RegExp(`^user:${actor.fsuid}:rw-\\s+#effective:---$`, "m")); assert.match(extSocketAcl, /^mask::---$/m)
    assert.match(extDirAcl, new RegExp(`^user:${actor.fsuid}:rwx\\s+#effective:r-x$`, "m")); assert.match(extDirAcl, /^mask::r-x$/m)
    assert.equal(Number(lstatSync(extDenyDir, { bigint: true }).mode & 0o1000n), 0)
    assert.equal(Number(lstatSync(extDenySocket, { bigint: true }).mode & 0o777n), 0o600)
    await connectUnix(extControlSocket); await expectConnectEacces(extDenySocket)
    controlDirectorySequence(extControlDir); denialDirectorySequence(extDenyDir, actorSourceRoot)

    const protectedFile = join(extDenyDir, "unlink-denied")
    assert.throws(() => chmodSync(protectedFile, 0o777), (error: unknown) => (error as NodeJS.ErrnoException).code === "EPERM")
    assert.throws(() => chownSync(protectedFile, actor.fsuid, actor.egid), (error: unknown) => (error as NodeJS.ErrnoException).code === "EPERM")
    const aclMutation = spawnSync("setfacl", ["-m", `u:${actor.fsuid}:rwx`, "--", protectedFile], { encoding: "utf8" }); assert.notEqual(aclMutation.status, 0)

    sudo(["chown", `root:${actor.egid}`, minControlDir, minDenyDir, minControlSocket, minDenySocket, join(minDenyDir, "unlink-denied"), join(minDenyDir, "rename-denied")])
    sudo(["setfacl", "-b", "--", minControlDir, minDenyDir, minControlSocket, minDenySocket, join(minDenyDir, "unlink-denied"), join(minDenyDir, "rename-denied")])
    sudo(["chmod", "0770", minControlDir]); sudo(["chmod", "0550", minDenyDir]); sudo(["chmod", "0660", minControlSocket]); sudo(["chmod", "0600", minDenySocket])
    assert.equal(actor.groups.has(actor.egid), true)
    const minSocketAcl = getfacl(minDenySocket); const minDirAcl = getfacl(minDenyDir)
    assert.doesNotMatch(minSocketAcl, /^mask::/m); assert.doesNotMatch(minSocketAcl, /^user:[0-9]+:/m); assert.doesNotMatch(minSocketAcl, /^group:[^:]+:/m); assert.match(minSocketAcl, /^group::---$/m)
    assert.doesNotMatch(minDirAcl, /^mask::/m); assert.doesNotMatch(minDirAcl, /^user:[0-9]+:/m); assert.doesNotMatch(minDirAcl, /^group:[^:]+:/m); assert.match(minDirAcl, /^group::r-x$/m)
    assert.equal(Number(lstatSync(minDenyDir, { bigint: true }).mode & 0o1000n), 0)
    await connectUnix(minControlSocket); await expectConnectEacces(minDenySocket)
    controlDirectorySequence(minControlDir); denialDirectorySequence(minDenyDir, actorSourceRoot)
    assert.equal(actorEvidence().fsuid, actor.fsuid)
  } finally {
    for (const server of servers) await new Promise<void>((resolve) => server.close(() => resolve()))
    sudo(["rm", "-rf", "--", root])
  }
}

if (process.env.KODAC_B2A_ROOT_CHILD !== "1") {
  test("H4-R4B-B2A Linux physical root proof reaches PRESTART_READY without start", { skip: process.platform !== "linux" }, () => {
    const script = fileURLToPath(import.meta.url)
    const result = spawnSync("sudo", ["-n", "/usr/bin/env", "KODAC_B2A_ROOT_CHILD=1", process.execPath, "--experimental-strip-types", script], { encoding: "utf8", timeout: 30_000 })
    if (process.env.GITHUB_ACTIONS === "true") {
      assert.equal(result.status, 0, `root B2A proof failed\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`)
      assert.match(result.stdout, /B2A_ROOT_PROOF_PASS/)
    }
  })

  test("H4-R4B-B2A extended and minimal POSIX ACL fixtures causally deny the same untrusted actor", { skip: process.platform !== "linux" }, async () => {
    if (!commandAvailable("sudo") || !commandAvailable("setfacl") || !commandAvailable("getfacl")) {
      if (process.env.GITHUB_ACTIONS === "true") assert.fail("GitHub Linux proof host must provide sudo/setfacl/getfacl")
      return
    }
    await posixAclPhysicalProof()
  })

  test("H4-R4B-B2A deadlines remain exactly 5s/5s/5s/15s and zero-start is statically enforced", () => {
    assert.deepEqual(KDO_H4_R4B_B2A_RUNTIME_LIMITS, { attachUpgradeTimeoutMs: 5000, readerActivationTimeoutMs: 5000, dormantRevalidationTimeoutMs: 5000, ownerToReadyTimeoutMs: 15000 })
    const runtimeSource = source("../src/execution/gateway-gvisor-docker-prestart-output-runtime.ts")
    const channelSource = source("../src/execution/gateway-gvisor-output-channel-internal.ts")
    assert.doesNotMatch(runtimeSource, /\/containers\/[^\s"'`]*\/(?:start|exec|restart|stop|kill)\b/)
    assert.equal(runtimeSource.includes('method: "DELETE"'), false)
    assert.doesNotMatch(channelSource, /\/containers\/[^\s"'`]*\/(?:start|exec|restart|stop|kill)\b/)
    assert.equal(channelSource.includes('method: "DELETE"'), false)
    assert.equal(runtimeSource.includes("node:child_process"), false)
    assert.equal(channelSource.includes("node:child_process"), false)
    assert.match(runtimeSource, /readFileSync\("\/proc\/self\/uid_map", "utf8"\)/)
    assert.match(runtimeSource, /readFileSync\("\/proc\/self\/gid_map", "utf8"\)/)
    assert.match(runtimeSource, /4294967295/)
  })

  test("H4-R4B-B2A package-root negative space withholds raw attach, store mutation, owner and readiness constructors", () => {
    const root = source("../src/index.ts")
    for (const forbidden of [
      "openExactGvisorDockerAttach", "InternalGvisorPrestartMultiplexReader", "createGvisorDockerPrestartOutputRuntime",
      "createSandboxPrestartOwnerCapability", "sandboxPrestartOwnerInstanceIdentity", "createSandboxPrestartOwnershipClaim",
      "createSandboxPrestartOwnerClaimedFence", "createSandboxPrestartFailedFence", "createSandboxPrestartPreparedFence",
      "createSandboxPrestartFailure", "createSandboxPrestartFailureCommit", "createSandboxPrestartPreparedCommit",
      "createSandboxPrestartOwnershipClaimCommit", "createReadiness",
    ]) assert.equal(root.includes(forbidden), false, forbidden)
  })

  test("H4-R4B-B2A R3G-E canonical regression suite remains present and fixed-protocol", () => {
    const regression = source("./kdo-h4-r3g-e-docker-stream.test.ts")
    assert.match(regression, /trusted transport proves exact list\/inspect\/attach multiplex path and aggregate bytes/)
    assert.match(regression, /rejects TTY stdin and missing stdout\/stderr before attach upgrade/)
    assert.match(regression, /overflow closes the accepted stream and same-attempt replay cannot replenish budget/)
    assert.match(regression, /abort destroys the owned upgraded stream and cannot become late success/)
    assert.match(regression, /socket replacement before any trusted output request/)
  })
}
