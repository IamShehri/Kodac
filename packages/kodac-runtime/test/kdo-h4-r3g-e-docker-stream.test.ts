import assert from "node:assert/strict"
import { mkdtempSync, renameSync, rmSync } from "node:fs"
import { createServer, type Server } from "node:http"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { Duplex } from "node:stream"
import test from "node:test"

import { createConfinementRequest } from "../src/trust/confinement.ts"
import { createSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../src/trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3A_NETWORK_MODE,
  createSandboxEntrypoint,
  createSandboxNetworkPolicy,
  createSandboxOciImageSource,
  createSandboxResourcePolicy,
  createSandboxWorkloadRequest,
} from "../src/trust/sandbox-workload.ts"
import {
  KDO_H4_R3F_BINDING_VERSION,
  KDO_H4_R3F_DOCKER_API_VERSION,
  KDO_H4_R3F_LABELS,
  createDockerControlPlaneBindingProvider,
} from "../src/trust/sandbox-observer-docker-control-plane.ts"
import {
  createGvisorContainerBindingRequest,
  createGvisorExecutionAttemptIdentity,
} from "../src/trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_E_ATTACH_MEDIA_TYPE,
  KDO_H4_R3G_E_ATTACH_PATH_SUFFIX,
  createGvisorDockerOutputTransport,
} from "../src/execution/gateway-gvisor-output-runtime.ts"
import { GvisorOutputLimitExceededError } from "../src/trust/sandbox-output-gvisor.ts"

const CONTAINER_ID = "c".repeat(64)
const SOURCE_DIGEST = `sha256:${"2".repeat(64)}`
const WORKSPACE_IDENTITY = "a".repeat(64)
const EXECUTION_INTENT_IDENTITY = "b".repeat(64)

function fixtureRequirement(maxOutputBytes = 8): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3ge-stream", digest: SOURCE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({
      cpuMillis: 1000,
      memoryBytes: 536_870_912,
      ttlMs: 60_000,
      maxOutputBytes,
    }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

function bindingRequest(requirement: SandboxExecutionRequirement, nonce = "123e4567-e89b-42d3-a456-426614174000") {
  return createGvisorContainerBindingRequest({
    executionAttemptIdentity: createGvisorExecutionAttemptIdentity({
      requirementIdentity: requirement.requirementIdentity,
      workloadIdentity: requirement.workload.workloadIdentity,
      nonce,
    }),
    requirement,
  })
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

function inspectValue(requirement: SandboxExecutionRequirement, flags: Partial<Record<"AttachStdout" | "AttachStderr" | "AttachStdin" | "OpenStdin" | "Tty", boolean>> = {}): Record<string, unknown> {
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
      AttachStdout: flags.AttachStdout ?? true,
      AttachStderr: flags.AttachStderr ?? true,
      AttachStdin: flags.AttachStdin ?? false,
      OpenStdin: flags.OpenStdin ?? false,
      Tty: flags.Tty ?? false,
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

function frame(stream: 1 | 2, payload: string): Buffer {
  const body = Buffer.from(payload, "utf8")
  const header = Buffer.alloc(8)
  header[0] = stream
  header.writeUInt32BE(body.byteLength, 4)
  return Buffer.concat([header, body])
}

type FakeOptions = {
  inspectBody?: string
  mediaType?: string
  connectionHeader?: string
  upgradeHeader?: string
  output?: Buffer
  stall?: boolean
}

type FakeDocker = {
  readonly socketPath: string
  readonly requests: string[]
  readonly upgradeHeaders: Record<string, string | string[] | undefined>[]
  readonly server: Server
  close(): Promise<void>
}

async function startFakeDocker(root: string, requirement: SandboxExecutionRequirement, options: FakeOptions = {}): Promise<FakeDocker> {
  const socketPath = join(root, "docker.sock")
  const requests: string[] = []
  const upgradeHeaders: Record<string, string | string[] | undefined>[] = []
  const sockets = new Set<Duplex>()
  const expectedList = listPath(requirement)
  const expectedInspect = `/v1.48/containers/${CONTAINER_ID}/json?size=0`
  const inspectBody = options.inspectBody ?? JSON.stringify(inspectValue(requirement))
  const server = createServer((request, response) => {
    const method = request.method ?? ""
    const url = request.url ?? ""
    requests.push(`${method} ${url}`)
    if (method !== "GET") { response.statusCode = 405; response.end(); return }
    if (url === expectedList) {
      response.statusCode = 200
      response.setHeader("content-type", "application/json")
      response.end(JSON.stringify([{ Id: CONTAINER_ID, State: "running" }]))
      return
    }
    if (url === expectedInspect) {
      response.statusCode = 200
      response.setHeader("content-type", "application/json")
      response.end(inspectBody)
      return
    }
    response.statusCode = 404
    response.end()
  })
  server.on("upgrade", (request, socket) => {
    sockets.add(socket)
    socket.once("close", () => sockets.delete(socket))
    requests.push(`UPGRADE ${request.url ?? ""}`)
    upgradeHeaders.push(request.headers)
    socket.write([
      "HTTP/1.1 101 UPGRADED",
      `Content-Type: ${options.mediaType ?? KDO_H4_R3G_E_ATTACH_MEDIA_TYPE}`,
      `Connection: ${options.connectionHeader ?? "Upgrade"}`,
      `Upgrade: ${options.upgradeHeader ?? "tcp"}`,
      "",
      "",
    ].join("\r\n"))
    if (options.stall) return
    socket.end(options.output ?? Buffer.concat([frame(1, "abc"), frame(2, "de")]))
  })
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(socketPath, () => { server.off("error", reject); resolve() })
  })
  return {
    socketPath,
    requests,
    upgradeHeaders,
    server,
    async close() {
      for (const socket of sockets) socket.destroy()
      server.closeAllConnections()
      if (!server.listening) return
      await new Promise<void>((resolve) => server.close(() => resolve()))
    },
  }
}

function trustedTransport(requirement: SandboxExecutionRequirement, socketPath: string) {
  const provider = createDockerControlPlaneBindingProvider({ socketPath, requirement })
  return createGvisorDockerOutputTransport({ provider, socketPath, requirement })
}

test("R3G-E Docker provider/transport fails closed on non-Linux", { skip: process.platform === "linux" }, () => {
  assert.throws(() => createDockerControlPlaneBindingProvider({ socketPath: "/tmp/docker.sock", requirement: fixtureRequirement() }), /requires Linux/)
})

test("R3G-E trusted transport proves exact list/inspect/attach multiplex path and aggregate bytes", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3ge-stream-"))
  const requirement = fixtureRequirement(5)
  let fake: FakeDocker | undefined
  try {
    fake = await startFakeDocker(root, requirement)
    const transport = trustedTransport(requirement, fake.socketPath)
    const request = bindingRequest(requirement)
    for (const forbidden of ["socketPath", "containerId", "attachPath", "logs", "stdin", "stdout", "stderr", "tty"]) assert.equal(forbidden in request, false)
    const capture = await transport.captureOutput(request)
    assert.equal(capture.binding.containerId, CONTAINER_ID)
    assert.equal(capture.executionAttemptIdentity, request.executionAttemptIdentity)
    assert.equal(capture.providerIdentity, transport.provider.providerIdentity)
    assert.equal(capture.socketEndpointIdentity, transport.provider.socketEndpoint.endpointIdentity)
    assert.equal(capture.mediaType, KDO_H4_R3G_E_ATTACH_MEDIA_TYPE)
    assert.equal(capture.aggregation.acceptedStdoutBytes, 3)
    assert.equal(capture.aggregation.acceptedStderrBytes, 2)
    assert.equal(capture.aggregation.acceptedAggregateBytes, 5)
    assert.equal(capture.aggregation.stdout.toString("utf8"), "abc")
    assert.equal(capture.aggregation.stderr.toString("utf8"), "de")
    assert.deepEqual(fake.requests, [
      `GET ${listPath(requirement)}`,
      `GET /v1.48/containers/${CONTAINER_ID}/json?size=0`,
      `GET /v1.48/containers/${CONTAINER_ID}/json?size=0`,
      `UPGRADE /v1.48/containers/${CONTAINER_ID}/${KDO_H4_R3G_E_ATTACH_PATH_SUFFIX}`,
    ])
    assert.equal(fake.upgradeHeaders.length, 1)
    assert.equal(fake.upgradeHeaders[0]?.connection, "Upgrade")
    assert.equal(fake.upgradeHeaders[0]?.upgrade, "tcp")
    assert.equal(fake.upgradeHeaders[0]?.["content-type"], "text/plain")
  } finally {
    await fake?.close()
    rmSync(root, { recursive: true, force: true })
  }
})

test("R3G-E rejects TTY stdin and missing stdout/stderr before attach upgrade", { skip: process.platform !== "linux" }, async () => {
  const cases = [
    { name: "tty", flags: { Tty: true }, pattern: /Tty=false/ },
    { name: "stdin", flags: { AttachStdin: true }, pattern: /AttachStdin=false/ },
    { name: "open-stdin", flags: { OpenStdin: true }, pattern: /OpenStdin=false/ },
    { name: "stdout", flags: { AttachStdout: false }, pattern: /AttachStdout=true/ },
    { name: "stderr", flags: { AttachStderr: false }, pattern: /AttachStderr=true/ },
  ] as const
  for (const item of cases) {
    const root = mkdtempSync(join(tmpdir(), `kodac-r3ge-${item.name}-`))
    const requirement = fixtureRequirement()
    let fake: FakeDocker | undefined
    try {
      fake = await startFakeDocker(root, requirement, { inspectBody: JSON.stringify(inspectValue(requirement, item.flags)) })
      const transport = trustedTransport(requirement, fake.socketPath)
      await assert.rejects(transport.captureOutput(bindingRequest(requirement)), item.pattern)
      assert.equal(fake.requests.some((entry) => entry.startsWith("UPGRADE ")), false)
    } finally {
      await fake?.close()
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test("R3G-E rejects non-multiplexed or malformed Docker upgrade identity", { skip: process.platform !== "linux" }, async () => {
  const cases = [
    { name: "raw", options: { mediaType: "application/vnd.docker.raw-stream" }, pattern: /media type/ },
    { name: "connection", options: { connectionHeader: "close" }, pattern: /refused protocol upgrade|Connection header/ },
    { name: "upgrade", options: { upgradeHeader: "websocket" }, pattern: /Upgrade header/ },
  ] as const
  for (const item of cases) {
    const root = mkdtempSync(join(tmpdir(), `kodac-r3ge-upgrade-${item.name}-`))
    const requirement = fixtureRequirement()
    let fake: FakeDocker | undefined
    try {
      fake = await startFakeDocker(root, requirement, item.options)
      const transport = trustedTransport(requirement, fake.socketPath)
      await assert.rejects(transport.captureOutput(bindingRequest(requirement)), item.pattern)
    } finally {
      await fake?.close()
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test("R3G-E overflow closes the accepted stream and same-attempt replay cannot replenish budget", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3ge-overflow-"))
  const requirement = fixtureRequirement(4)
  let fake: FakeDocker | undefined
  try {
    fake = await startFakeDocker(root, requirement, { output: Buffer.concat([frame(1, "abcd"), frame(2, "x")]) })
    const transport = trustedTransport(requirement, fake.socketPath)
    const request = bindingRequest(requirement)
    await assert.rejects(transport.captureOutput(request), GvisorOutputLimitExceededError)
    await assert.rejects(transport.captureOutput(request), /already consumed|cannot reset/)
    assert.equal(fake.requests.filter((entry) => entry.startsWith("UPGRADE ")).length, 1)
  } finally {
    await fake?.close()
    rmSync(root, { recursive: true, force: true })
  }
})

test("R3G-E abort destroys the owned upgraded stream and cannot become late success", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3ge-abort-"))
  const requirement = fixtureRequirement()
  let fake: FakeDocker | undefined
  try {
    fake = await startFakeDocker(root, requirement, { stall: true })
    const transport = trustedTransport(requirement, fake.socketPath)
    const controller = new AbortController()
    const promise = transport.captureOutput(bindingRequest(requirement), { signal: controller.signal })
    setTimeout(() => controller.abort(), 20)
    await assert.rejects(promise, /aborted/)
  } finally {
    await fake?.close()
    rmSync(root, { recursive: true, force: true })
  }
})

test("R3G-E rejects Docker Unix socket replacement before any trusted output request", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3ge-replace-"))
  const requirement = fixtureRequirement()
  let original: FakeDocker | undefined
  let replacement: FakeDocker | undefined
  try {
    original = await startFakeDocker(root, requirement)
    const provider = createDockerControlPlaneBindingProvider({ socketPath: original.socketPath, requirement })
    const transport = createGvisorDockerOutputTransport({ provider, socketPath: original.socketPath, requirement })
    renameSync(original.socketPath, `${original.socketPath}.old`)
    replacement = await startFakeDocker(root, requirement)
    await assert.rejects(transport.captureOutput(bindingRequest(requirement)), /endpoint identity changed/)
    assert.deepEqual(replacement.requests, [])
  } finally {
    await replacement?.close()
    await original?.close()
    rmSync(root, { recursive: true, force: true })
  }
})