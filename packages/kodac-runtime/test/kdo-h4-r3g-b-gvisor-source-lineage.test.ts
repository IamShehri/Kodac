import assert from "node:assert/strict"
import { mkdtempSync, rmSync } from "node:fs"
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
  KDO_H4_R3F_DOCKER_API_VERSION,
  KDO_H4_R3F_LIMITS,
  createDockerControlPlaneBindingProvider,
  observeDockerSourceControlPlaneForBindingResolver,
} from "../src/trust/sandbox-observer-docker-control-plane.ts"
import {
  KDO_H4_R3G_B_COMMIT_VERSION,
  KDO_H4_R3G_B_EVIDENCE_CLASS,
  KDO_H4_R3G_B_RUNTIME_CLASS,
  KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION,
  KDO_H4_R3G_B_VERSION,
  createGvisorSourceContainerSpecIdentity,
  createGvisorSourceContainerdEndpointIdentity,
  createGvisorSourceCtrArtifactIdentity,
  createGvisorSourceDockerStorageIdentity,
  createGvisorSourceImageRootfsIdentity,
  createGvisorSourceLineageCommit,
  createGvisorSourceLineageRecord,
  createGvisorSourcePathAuthorityIdentity,
  createGvisorSourcePathComponentIdentity,
  createGvisorSourceRootfsMountIdentity,
  createGvisorSourceSnapshotAncestryIdentity,
  createGvisorSourceSnapshotNodeIdentity,
  deriveGvisorSourceImageChainId,
  hashGvisorSourceLineageV1,
  requireGvisorSourceContainerdEndpointPolicy,
  serializeGvisorSourceLineageRecord,
  validateGvisorSourceContainerSpecIdentity,
  validateGvisorSourceContainerdEndpointIdentity,
  validateGvisorSourceCtrArtifactIdentity,
  validateGvisorSourceDockerStorageIdentity,
  validateGvisorSourceImageRootfsIdentity,
  validateGvisorSourceLineageCommit,
  validateGvisorSourceLineageRecord,
  validateGvisorSourceLineageRuntimeConfig,
  validateGvisorSourcePathAuthorityIdentity,
  validateGvisorSourceRootfsMountIdentity,
  validateGvisorSourceSnapshotAncestryIdentity,
} from "../src/trust/sandbox-observer-gvisor-source-lineage.ts"

const CONTAINER_ID = "c".repeat(64)
const SOURCE_DIGEST = `sha256:${"a".repeat(64)}`
const DIFF_A = `sha256:${"1".repeat(64)}`
const DIFF_B = `sha256:${"2".repeat(64)}`
const DOCKER_ENDPOINT = "d".repeat(64)
const ROOTFS = `/var/lib/docker/rootfs/overlayfs/${CONTAINER_ID}`
const WORKSPACE_IDENTITY = "9".repeat(64)
const EXECUTION_INTENT_IDENTITY = "8".repeat(64)
const ID = (character: string) => character.repeat(64)

function dockerRequirement(): SandboxExecutionRequirement {
  const confinement = createConfinementRequest({
    mode: "read-only",
    workspaceIdentity: WORKSPACE_IDENTITY,
    executionIntentIdentity: EXECUTION_INTENT_IDENTITY,
    scope: { readPaths: ["src"], writePaths: [] },
  })
  const workload = createSandboxWorkloadRequest({
    source: createSandboxOciImageSource({ repository: "ghcr.io/acme/r3g-b-fixture", digest: SOURCE_DIGEST }),
    entrypoint: createSandboxEntrypoint({ executable: "/usr/bin/node", args: ["--version"] }),
    resourcePolicy: createSandboxResourcePolicy({ cpuMillis: 1500, memoryBytes: 536_870_912, ttlMs: 60_000, maxOutputBytes: 1_048_576 }),
    networkPolicy: createSandboxNetworkPolicy({ mode: KDO_H4_R3A_NETWORK_MODE }),
    confinement,
    credentialBindingIdentity: null,
  })
  return createSandboxExecutionRequirement({ workload, requiredSemanticRuntimeClass: "gvisor" })
}

type SourceDockerOptions = {
  readonly systemInfoBody?: string | Buffer
  readonly imageBody?: string | Buffer
  readonly systemInfoStatus?: number
  readonly imageStatus?: number
}

type SourceDocker = {
  readonly socketPath: string
  readonly requests: string[]
  readonly server: Server
  close(): Promise<void>
}

function defaultSystemInfo(): Record<string, unknown> {
  return {
    OSType: "linux",
    Driver: "overlayfs",
    DockerRootDir: "/var/lib/docker",
    Containerd: {
      Address: "/run/containerd/containerd.sock",
      Namespaces: { Containers: "moby", Plugins: "plugins.moby" },
    },
  }
}

function defaultSourceImage(requirement: SandboxExecutionRequirement): Record<string, unknown> {
  return {
    Descriptor: { digest: requirement.workload.source.digest, mediaType: "application/vnd.oci.image.manifest.v1+json", size: 1234 },
    RootFS: { Type: "layers", Layers: [DIFF_A, DIFF_A, DIFF_B] },
  }
}

function expectedSourceImagePath(requirement: SandboxExecutionRequirement): string {
  const reference = `${requirement.workload.source.repository}@${requirement.workload.source.digest}`
  return `/v${KDO_H4_R3F_DOCKER_API_VERSION}/images/${reference}/json`
}

async function startSourceDocker(root: string, requirement: SandboxExecutionRequirement, options: SourceDockerOptions = {}): Promise<SourceDocker> {
  const socketPath = join(root, "docker.sock")
  const requests: string[] = []
  const systemInfoPath = `/v${KDO_H4_R3F_DOCKER_API_VERSION}/info`
  const imagePath = expectedSourceImagePath(requirement)
  const systemInfoBody = options.systemInfoBody ?? JSON.stringify(defaultSystemInfo())
  const imageBody = options.imageBody ?? JSON.stringify(defaultSourceImage(requirement))
  const server = createServer((request, response) => {
    const method = request.method ?? ""
    const url = request.url ?? ""
    requests.push(`${method} ${url}`)
    if (method !== "GET") { response.statusCode = 405; response.end(); return }
    if (url === systemInfoPath) {
      response.statusCode = options.systemInfoStatus ?? 200
      response.setHeader("content-type", "application/json")
      response.end(systemInfoBody)
      return
    }
    if (url === imagePath) {
      response.statusCode = options.imageStatus ?? 200
      response.setHeader("content-type", "application/json")
      response.end(imageBody)
      return
    }
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

function directory(path: string, inode: number) {
  return createGvisorSourcePathComponentIdentity({
    path,
    device: "1",
    inode: String(inode),
    uid: "0",
    gid: "0",
    mode: "16877",
  })
}

function authority(paths: readonly string[]) {
  return createGvisorSourcePathAuthorityIdentity(paths.map((path, index) => directory(path, index + 2)))
}

function ctrFixture() {
  const parentAuthority = authority(["/", "/usr", "/usr/bin"])
  return createGvisorSourceCtrArtifactIdentity({
    path: "/usr/bin/ctr",
    sha256: ID("e"),
    device: "1",
    inode: "41",
    uid: "0",
    gid: "0",
    mode: "33261",
    size: "1048576",
    parentAuthority,
  })
}

function endpointFixture() {
  return createGvisorSourceContainerdEndpointIdentity({
    address: "/run/containerd/containerd.sock",
    device: "1",
    inode: "51",
    uid: "0",
    gid: "0",
    mode: "49584",
    parentAuthorityIdentity: authority(["/", "/run", "/run/containerd"]).authorityIdentity,
  })
}

function rootfsAuthorityFixture() {
  return authority(["/", "/var", "/var/lib", "/var/lib/docker", "/var/lib/docker/rootfs", "/var/lib/docker/rootfs/overlayfs"])
}

function fullFixture() {
  const ctr = ctrFixture()
  const endpoint = endpointFixture()
  const rootfsAuthority = rootfsAuthorityFixture()
  const storage = createGvisorSourceDockerStorageIdentity({
    dockerEndpointIdentity: DOCKER_ENDPOINT,
    dockerRootDir: "/var/lib/docker",
    containerdAddress: endpoint.address,
  })
  const image = createGvisorSourceImageRootfsIdentity({ sourceDigest: SOURCE_DIGEST, diffIds: [DIFF_A, DIFF_B], dockerEndpointIdentity: DOCKER_ENDPOINT })
  const active = createGvisorSourceSnapshotNodeIdentity({ name: CONTAINER_ID, kind: "active", parent: image.expectedImageChainId })
  const imageSnapshot = createGvisorSourceSnapshotNodeIdentity({ name: image.expectedImageChainId, kind: "committed", parent: DIFF_A })
  const ancestry = createGvisorSourceSnapshotAncestryIdentity({ containerId: CONTAINER_ID, expectedImageChainId: image.expectedImageChainId, active, init: null, image: imageSnapshot })
  const spec = createGvisorSourceContainerSpecIdentity({ containerId: CONTAINER_ID, rootfsMountPath: ROOTFS })
  const mount = createGvisorSourceRootfsMountIdentity({
    rootfsMountPath: ROOTFS,
    rootfsParentAuthorityIdentity: rootfsAuthority.authorityIdentity,
    retainedRootfsDevice: "33",
    retainedRootfsInode: "9001",
    mountId: "71",
    parentMountId: "29",
    majorMinor: "0:81",
    mountRoot: "/",
    mountOptions: "rw,relatime",
    mountSource: "overlay",
    superOptions: "rw,lowerdir=/lower,upperdir=/upper,workdir=/work",
  })
  const record = createGvisorSourceLineageRecord({
    requirementIdentity: ID("1"),
    workloadIdentity: ID("2"),
    executionAttemptIdentity: ID("3"),
    containerBindingIdentity: ID("4"),
    runtimeLineageIdentity: ID("5"),
    containerId: CONTAINER_ID,
    sourceDigest: SOURCE_DIGEST,
    dockerStorageIdentity: storage.storageIdentity,
    imageRootfsIdentity: image.imageRootfsIdentity,
    expectedImageChainId: image.expectedImageChainId,
    ctrArtifactIdentity: ctr.artifactIdentity,
    containerdEndpointIdentity: endpoint.endpointIdentity,
    rootfsParentAuthorityIdentity: rootfsAuthority.authorityIdentity,
    containerSpecIdentity: spec.specIdentity,
    snapshotAncestryIdentity: ancestry.ancestryIdentity,
    rootfsMountIdentity: mount.mountIdentity,
  })
  return { ctr, endpoint, rootfsAuthority, storage, image, ancestry, spec, mount, record }
}

test("H4-R3G-B canonical hash is domain-separated and deterministic", () => {
  const tuple = ["x", "y", null] as const
  assert.equal(hashGvisorSourceLineageV1("SOURCE_RECORD", tuple), hashGvisorSourceLineageV1("SOURCE_RECORD", tuple))
  assert.notEqual(hashGvisorSourceLineageV1("SOURCE_RECORD", tuple), hashGvisorSourceLineageV1("SOURCE_COMMIT", tuple))
  assert.throws(() => hashGvisorSourceLineageV1("bad-domain", tuple), /domain/)
})

test("H4-R3G-B ChainID preserves exact ordered DiffID semantics", () => {
  const single = deriveGvisorSourceImageChainId([DIFF_A])
  assert.equal(single, DIFF_A)
  const ordered = deriveGvisorSourceImageChainId([DIFF_A, DIFF_B])
  assert.match(ordered, /^sha256:[0-9a-f]{64}$/)
  assert.notEqual(ordered, deriveGvisorSourceImageChainId([DIFF_B, DIFF_A]))
  assert.doesNotThrow(() => deriveGvisorSourceImageChainId([DIFF_A, DIFF_A]))
  assert.throws(() => deriveGvisorSourceImageChainId([]), /1\.\.512/)
  assert.throws(() => deriveGvisorSourceImageChainId([`sha256:${"A".repeat(64)}`]), /lowercase/)
})

test("H4-R3G-B dense arrays reject Proxy authority before traps execute", () => {
  let trapped = false
  const proxy = new Proxy([DIFF_A], { get() { trapped = true; throw new Error("trap") } })
  assert.throws(() => deriveGvisorSourceImageChainId(proxy), /non-proxy/)
  assert.equal(trapped, false)
})

test("H4-R3G-B root-owned non-writable path authority is exact and ordered", () => {
  const value = rootfsAuthorityFixture()
  assert.equal(validateGvisorSourcePathAuthorityIdentity(value).authorityIdentity, value.authorityIdentity)
  const wrongOrder = [directory("/", 2), directory("/var", 3), directory("/var/lib/docker", 4)]
  assert.throws(() => createGvisorSourcePathAuthorityIdentity(wrongOrder), /parent-to-child/)
  assert.throws(() => createGvisorSourcePathComponentIdentity({ path: "/tmp", device: "1", inode: "2", uid: "0", gid: "0", mode: "16895" }), /group\/world writable/)
})

test("H4-R3G-B path component validators reject accessor authority", () => {
  const hostile: Record<string, unknown> = { path: "/", device: "1", inode: "2", uid: "0", gid: "0", mode: "16877" }
  Object.defineProperty(hostile, "path", { enumerable: true, get() { throw new Error("getter executed") } })
  assert.throws(() => createGvisorSourcePathComponentIdentity(hostile as any), /data property/)
})

test("H4-R3G-B ctr and containerd identities enforce bounded trusted shapes", () => {
  const { ctr, endpoint } = fullFixture()
  assert.equal(validateGvisorSourceCtrArtifactIdentity(ctr).artifactIdentity, ctr.artifactIdentity)
  assert.equal(validateGvisorSourceContainerdEndpointIdentity(endpoint).endpointIdentity, endpoint.endpointIdentity)
  assert.doesNotThrow(() => requireGvisorSourceContainerdEndpointPolicy(endpoint, {
    expectedContainerdSocketUid: "0", expectedContainerdSocketGid: "0", expectedContainerdSocketMode: "49584",
  }))
  assert.throws(() => requireGvisorSourceContainerdEndpointPolicy(endpoint, {
    expectedContainerdSocketUid: "0", expectedContainerdSocketGid: "1", expectedContainerdSocketMode: "49584",
  }), /trusted uid\/gid\/mode policy/)
  assert.throws(() => createGvisorSourceCtrArtifactIdentity({
    path: "/usr/bin/ctr", sha256: ID("e"), device: "1", inode: "41", uid: "0", gid: "0", mode: "33277", size: "1",
    parentAuthority: authority(["/", "/usr", "/usr/bin"]),
  }), /group\/world writable/)
})

test("H4-R3G-B Docker storage and image-rootfs identities rederive canonical facts", () => {
  const { storage, image } = fullFixture()
  assert.equal(validateGvisorSourceDockerStorageIdentity(storage).storageIdentity, storage.storageIdentity)
  assert.equal(validateGvisorSourceImageRootfsIdentity(image).imageRootfsIdentity, image.imageRootfsIdentity)
  assert.equal(image.expectedImageChainId, deriveGvisorSourceImageChainId(image.diffIds))
  assert.throws(() => validateGvisorSourceImageRootfsIdentity({ ...image, expectedImageChainId: DIFF_A }), /ChainID mismatch/)
})

test("H4-R3G-B snapshot ancestry allows only direct or canonical Docker init shape", () => {
  const imageRootfs = createGvisorSourceImageRootfsIdentity({ sourceDigest: SOURCE_DIGEST, diffIds: [DIFF_A, DIFF_B], dockerEndpointIdentity: DOCKER_ENDPOINT })
  const imageNode = createGvisorSourceSnapshotNodeIdentity({ name: imageRootfs.expectedImageChainId, kind: "committed", parent: DIFF_A })
  const direct = createGvisorSourceSnapshotAncestryIdentity({
    containerId: CONTAINER_ID,
    expectedImageChainId: imageRootfs.expectedImageChainId,
    active: createGvisorSourceSnapshotNodeIdentity({ name: CONTAINER_ID, kind: "active", parent: imageRootfs.expectedImageChainId }),
    init: null,
    image: imageNode,
  })
  assert.equal(validateGvisorSourceSnapshotAncestryIdentity(direct).ancestryIdentity, direct.ancestryIdentity)
  const initName = `${CONTAINER_ID}-init`
  const withInit = createGvisorSourceSnapshotAncestryIdentity({
    containerId: CONTAINER_ID,
    expectedImageChainId: imageRootfs.expectedImageChainId,
    active: createGvisorSourceSnapshotNodeIdentity({ name: CONTAINER_ID, kind: "active", parent: initName }),
    init: createGvisorSourceSnapshotNodeIdentity({ name: initName, kind: "committed", parent: imageRootfs.expectedImageChainId }),
    image: imageNode,
  })
  assert.equal(validateGvisorSourceSnapshotAncestryIdentity(withInit).ancestryIdentity, withInit.ancestryIdentity)
  assert.throws(() => createGvisorSourceSnapshotAncestryIdentity({
    containerId: CONTAINER_ID,
    expectedImageChainId: imageRootfs.expectedImageChainId,
    active: createGvisorSourceSnapshotNodeIdentity({ name: CONTAINER_ID, kind: "active", parent: "arbitrary" }),
    init: createGvisorSourceSnapshotNodeIdentity({ name: "arbitrary", kind: "committed", parent: imageRootfs.expectedImageChainId }),
    image: imageNode,
  }), /init snapshot ancestry/)
})

test("H4-R3G-B container spec and physical mount identities are self-validating", () => {
  const { spec, mount } = fullFixture()
  assert.deepEqual(Object.keys(spec).sort(), ["containerId", "rootfsMountPath", "specIdentity"].sort())
  assert.equal(validateGvisorSourceContainerSpecIdentity(spec).specIdentity, spec.specIdentity)
  assert.equal(validateGvisorSourceRootfsMountIdentity(mount).mountIdentity, mount.mountIdentity)
  assert.throws(() => validateGvisorSourceRootfsMountIdentity({ ...mount, filesystemType: "ext4" }), /overlay/)
})

test("H4-R3G-B canonical source record bytes and commit acknowledgment are deterministic", () => {
  const { record } = fullFixture()
  const validated = validateGvisorSourceLineageRecord(record)
  assert.equal(validated.version, KDO_H4_R3G_B_VERSION)
  assert.equal(validated.runtimeClass, KDO_H4_R3G_B_RUNTIME_CLASS)
  assert.equal(validated.evidenceClass, KDO_H4_R3G_B_EVIDENCE_CLASS)
  const serialized = serializeGvisorSourceLineageRecord(validated)
  const tuple = JSON.parse(serialized) as unknown[]
  assert.equal(tuple[0], "kodac-h4-r3g-b-source-record-v1")
  assert.equal(tuple.length, 19)
  assert.doesNotMatch(serialized, /recordIdentity/)
  const commit = createGvisorSourceLineageCommit(record)
  assert.equal(commit.version, KDO_H4_R3G_B_COMMIT_VERSION)
  assert.equal(validateGvisorSourceLineageCommit(commit, record).commitIdentity, commit.commitIdentity)
  assert.throws(() => validateGvisorSourceLineageCommit({ ...commit, recordIdentity: ID("f") }, record), /recordIdentity mismatch/)
  assert.throws(() => validateGvisorSourceLineageRecord({ ...record, sourceDigest: `sha256:${"b".repeat(64)}` }), /identity mismatch/)
})

test("H4-R3G-B runtime config is exact and rejects host authority injection", () => {
  const commitSourceLineageEvidence = () => undefined
  const config = validateGvisorSourceLineageRuntimeConfig({
    version: KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION,
    ctrPath: "/usr/bin/ctr",
    expectedCtrSha256: ID("e"),
    containerdAddress: "/run/containerd/containerd.sock",
    expectedContainerdSocketUid: "0",
    expectedContainerdSocketGid: "0",
    expectedContainerdSocketMode: "49584",
    commitSourceLineageEvidence,
  })
  assert.equal(config.ctrPath, "/usr/bin/ctr")
  assert.equal(config.commitSourceLineageEvidence, commitSourceLineageEvidence)
  assert.throws(() => validateGvisorSourceLineageRuntimeConfig({ ...config, reader: () => "host" }), /exactly/)
  assert.throws(() => validateGvisorSourceLineageRuntimeConfig({ ...config, containerdAddress: "relative.sock" }), /canonical absolute/)
})

test("H4-R3G-B canonical R3F resolver exposes only bounded local Docker source surfaces", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3g-b-source-"))
  const requirement = dockerRequirement()
  let fake: SourceDocker | undefined
  try {
    fake = await startSourceDocker(root, requirement)
    const provider = createDockerControlPlaneBindingProvider({ socketPath: fake.socketPath, requirement })
    const observed = await observeDockerSourceControlPlaneForBindingResolver(provider.resolveContainerBinding)
    assert.equal(observed.socketEndpoint.endpointIdentity, provider.socketEndpoint.endpointIdentity)
    assert.deepEqual(observed.systemInfo, {
      socketEndpointIdentity: provider.socketEndpoint.endpointIdentity,
      osType: "linux",
      driver: "overlayfs",
      dockerRootDir: "/var/lib/docker",
      containerdAddress: "/run/containerd/containerd.sock",
      containerdContainersNamespace: "moby",
    })
    assert.equal(observed.imageRootfs.sourceReference, `${requirement.workload.source.repository}@${requirement.workload.source.digest}`)
    assert.equal(observed.imageRootfs.sourceDigest, requirement.workload.source.digest)
    assert.equal(observed.imageRootfs.descriptorDigest, requirement.workload.source.digest)
    assert.equal(observed.imageRootfs.rootfsType, "layers")
    assert.deepEqual(observed.imageRootfs.diffIds, [DIFF_A, DIFF_A, DIFF_B])
    assert.deepEqual(fake.requests, [
      `GET /v1.48/info`,
      `GET ${expectedSourceImagePath(requirement)}`,
    ])

    const requestCount = fake.requests.length
    const wrapped = (...args: any[]) => (provider.resolveContainerBinding as any)(...args)
    await assert.rejects(observeDockerSourceControlPlaneForBindingResolver(wrapped), /canonical R3F Docker binding resolver/)
    assert.equal(fake.requests.length, requestCount)
  } finally {
    await fake?.close()
    rmSync(root, { recursive: true, force: true })
  }
})

test("H4-R3G-B Docker source observation rejects unsupported storage and image-rootfs shapes", { skip: process.platform !== "linux" }, async () => {
  const requirement = dockerRequirement()
  const cases: Array<{ name: string; system?: any; image?: any; pattern: RegExp }> = [
    { name: "os", system: { ...defaultSystemInfo(), OSType: "windows" }, pattern: /OSType must be linux/ },
    { name: "driver", system: { ...defaultSystemInfo(), Driver: "btrfs" }, pattern: /Driver must be overlayfs/ },
    { name: "root", system: { ...defaultSystemInfo(), DockerRootDir: "relative" }, pattern: /DockerRootDir must be a canonical absolute POSIX path/ },
    { name: "address", system: { ...defaultSystemInfo(), Containerd: { Address: "relative.sock", Namespaces: { Containers: "moby" } } }, pattern: /Containerd.Address must be a canonical absolute POSIX path/ },
    { name: "namespace", system: { ...defaultSystemInfo(), Containerd: { Address: "/run/containerd/containerd.sock", Namespaces: { Containers: "default" } } }, pattern: /namespace must be moby/ },
    { name: "descriptor", image: { ...defaultSourceImage(requirement), Descriptor: { digest: `sha256:${"b".repeat(64)}` } }, pattern: /descriptor digest/ },
    { name: "rootfs-type", image: { ...defaultSourceImage(requirement), RootFS: { Type: "rootfs", Layers: [DIFF_A] } }, pattern: /RootFS.Type must be layers/ },
    { name: "empty", image: { ...defaultSourceImage(requirement), RootFS: { Type: "layers", Layers: [] } }, pattern: /1\.\.512/ },
    { name: "uppercase", image: { ...defaultSourceImage(requirement), RootFS: { Type: "layers", Layers: [`sha256:${"A".repeat(64)}`] } }, pattern: /lowercase/ },
    { name: "too-many", image: { ...defaultSourceImage(requirement), RootFS: { Type: "layers", Layers: Array.from({ length: KDO_H4_R3F_LIMITS.maxDiffIds + 1 }, () => DIFF_A) } }, pattern: /1\.\.512/ },
  ]

  for (const item of cases) {
    const root = mkdtempSync(join(tmpdir(), `kodac-r3g-b-source-${item.name}-`))
    let fake: SourceDocker | undefined
    try {
      fake = await startSourceDocker(root, requirement, {
        systemInfoBody: JSON.stringify(item.system ?? defaultSystemInfo()),
        imageBody: JSON.stringify(item.image ?? defaultSourceImage(requirement)),
      })
      const provider = createDockerControlPlaneBindingProvider({ socketPath: fake.socketPath, requirement })
      await assert.rejects(observeDockerSourceControlPlaneForBindingResolver(provider.resolveContainerBinding), item.pattern, item.name)
    } finally {
      await fake?.close()
      rmSync(root, { recursive: true, force: true })
    }
  }
})

test("H4-R3G-B missing local source image fails closed without remote fallback", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3g-b-source-missing-"))
  const requirement = dockerRequirement()
  let fake: SourceDocker | undefined
  try {
    fake = await startSourceDocker(root, requirement, { imageStatus: 404 })
    const provider = createDockerControlPlaneBindingProvider({ socketPath: fake.socketPath, requirement })
    await assert.rejects(observeDockerSourceControlPlaneForBindingResolver(provider.resolveContainerBinding), /HTTP 404/)
    assert.deepEqual(fake.requests, [
      `GET /v1.48/info`,
      `GET ${expectedSourceImagePath(requirement)}`,
    ])
  } finally {
    await fake?.close()
    rmSync(root, { recursive: true, force: true })
  }
})

test("H4-R3G-B pre-aborted Docker source observation performs no Docker I/O", { skip: process.platform !== "linux" }, async () => {
  const root = mkdtempSync(join(tmpdir(), "kodac-r3g-b-source-abort-"))
  const requirement = dockerRequirement()
  let fake: SourceDocker | undefined
  try {
    fake = await startSourceDocker(root, requirement)
    const provider = createDockerControlPlaneBindingProvider({ socketPath: fake.socketPath, requirement })
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(observeDockerSourceControlPlaneForBindingResolver(provider.resolveContainerBinding, { signal: controller.signal }), /aborted/)
    assert.deepEqual(fake.requests, [])
  } finally {
    await fake?.close()
    rmSync(root, { recursive: true, force: true })
  }
})