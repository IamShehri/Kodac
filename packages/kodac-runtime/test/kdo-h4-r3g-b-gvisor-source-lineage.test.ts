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

test("H4-R3G-B derives exact Moby rootfs target and parent authority path chain", async () => {
  const { deriveGvisorSourcePathAuthorityPaths, deriveGvisorSourceRootfsPaths } = await import("../src/trust/sandbox-observer-gvisor-source-lineage.ts")
  const paths = deriveGvisorSourceRootfsPaths("/var/lib/docker", CONTAINER_ID)
  assert.deepEqual(paths, {
    rootfsParentPath: "/var/lib/docker/rootfs/overlayfs",
    rootfsMountPath: ROOTFS,
  })
  assert.deepEqual(deriveGvisorSourcePathAuthorityPaths(paths.rootfsParentPath), [
    "/", "/var", "/var/lib", "/var/lib/docker", "/var/lib/docker/rootfs", "/var/lib/docker/rootfs/overlayfs",
  ])
  assert.deepEqual(deriveGvisorSourcePathAuthorityPaths("/"), ["/"])
  assert.throws(() => deriveGvisorSourceRootfsPaths("relative", CONTAINER_ID), /canonical absolute/)
  assert.throws(() => deriveGvisorSourceRootfsPaths("/var/lib/docker", "short"), /64 lowercase/)
})

test("H4-R3G-B parses exact ctr container metadata rootfs path and ignores mutable diagnostics", async () => {
  const { parseGvisorSourceCtrContainerInfo } = await import("../src/trust/sandbox-observer-gvisor-source-lineage.ts")
  const payload = JSON.stringify({
    ID: CONTAINER_ID,
    Labels: { mutable: "diagnostic" },
    Image: "ghcr.io/acme/ignored:tag",
    Spec: { root: { path: ROOTFS, readonly: false }, process: { args: ["ignored"] } },
    SnapshotKey: "",
    Snapshotter: "",
  })
  const parsed = parseGvisorSourceCtrContainerInfo(Buffer.from(payload, "utf8"), CONTAINER_ID, ROOTFS)
  assert.equal(parsed.containerId, CONTAINER_ID)
  assert.equal(parsed.rootfsMountPath, ROOTFS)
  assert.match(parsed.specIdentity, /^[0-9a-f]{64}$/)
  assert.throws(() => parseGvisorSourceCtrContainerInfo(JSON.stringify({ ID: ID("d"), Spec: { root: { path: ROOTFS } } }), CONTAINER_ID, ROOTFS), /ID does not match/)
  assert.throws(() => parseGvisorSourceCtrContainerInfo(JSON.stringify({ ID: CONTAINER_ID, Spec: { root: { path: "/wrong" } } }), CONTAINER_ID, ROOTFS), /does not match exact rootfsMountPath/)
  assert.throws(() => parseGvisorSourceCtrContainerInfo(`{"ID":"${CONTAINER_ID}","ID":"${CONTAINER_ID}","Spec":{"root":{"path":"${ROOTFS}"}}}`, CONTAINER_ID, ROOTFS), /duplicate JSON object key/)
  assert.throws(() => parseGvisorSourceCtrContainerInfo(Buffer.from([0xff]), CONTAINER_ID, ROOTFS), /valid UTF-8/)
})

test("H4-R3G-B parses ctr snapshot Stat JSON into exact active and committed identities", async () => {
  const { parseGvisorSourceCtrSnapshotInfo } = await import("../src/trust/sandbox-observer-gvisor-source-lineage.ts")
  const active = parseGvisorSourceCtrSnapshotInfo(JSON.stringify({ Kind: "Active", Name: CONTAINER_ID, Parent: DIFF_A, Labels: {}, Created: "ignored", Updated: "ignored" }), CONTAINER_ID)
  assert.equal(active.kind, "active")
  assert.equal(active.name, CONTAINER_ID)
  assert.equal(active.parent, DIFF_A)
  const committed = parseGvisorSourceCtrSnapshotInfo(JSON.stringify({ Kind: "Committed", Name: DIFF_A, Parent: "" }), DIFF_A)
  assert.equal(committed.kind, "committed")
  assert.equal(committed.parent, "")
  assert.throws(() => parseGvisorSourceCtrSnapshotInfo(JSON.stringify({ Kind: "View", Name: CONTAINER_ID, Parent: DIFF_A }), CONTAINER_ID), /Active or Committed/)
  assert.throws(() => parseGvisorSourceCtrSnapshotInfo(JSON.stringify({ Kind: "Active", Name: ID("d"), Parent: DIFF_A }), CONTAINER_ID), /does not match exact requested snapshot/)
  assert.throws(() => parseGvisorSourceCtrSnapshotInfo(`{"Kind":"Active","Kind":"Committed","Name":"${CONTAINER_ID}","Parent":"${DIFF_A}"}`, CONTAINER_ID), /duplicate JSON object key/)
})

test("H4-R3G-B mountinfo parser decodes kernel path escaping and binds one exact overlay target", async () => {
  const { parseGvisorSourceMountInfo } = await import("../src/trust/sandbox-observer-gvisor-source-lineage.ts")
  const rootfs = `/var/lib/docker root/rootfs/overlayfs/${CONTAINER_ID}`
  const escaped = `/var/lib/docker\\040root/rootfs/overlayfs/${CONTAINER_ID}`
  const text = [
    "29 23 0:26 / / rw,relatime - ext4 /dev/root rw",
    `71 29 0:81 / ${escaped} rw,relatime shared:1 - overlay overlay rw,lowerdir=/lower,upperdir=/upper,workdir=/work`,
  ].join("\n") + "\n"
  const mount = parseGvisorSourceMountInfo(Buffer.from(text, "utf8"), rootfs)
  assert.deepEqual(mount, {
    rootfsMountPath: rootfs,
    mountId: "71",
    parentMountId: "29",
    majorMinor: "0:81",
    mountRoot: "/",
    mountOptions: "rw,relatime",
    filesystemType: "overlay",
    mountSource: "overlay",
    superOptions: "rw,lowerdir=/lower,upperdir=/upper,workdir=/work",
  })
})

test("H4-R3G-B mountinfo parser rejects missing duplicate non-overlay malformed and ambiguous targets", async () => {
  const { parseGvisorSourceMountInfo } = await import("../src/trust/sandbox-observer-gvisor-source-lineage.ts")
  const good = `71 29 0:81 / ${ROOTFS} rw,relatime - overlay overlay rw,lowerdir=/lower,upperdir=/upper,workdir=/work`
  assert.throws(() => parseGvisorSourceMountInfo("29 23 0:26 / / rw - ext4 /dev/root rw\n", ROOTFS), /target is missing/)
  assert.throws(() => parseGvisorSourceMountInfo(`${good}\n${good}\n`, ROOTFS), /target is ambiguous/)
  assert.throws(() => parseGvisorSourceMountInfo(`71 29 0:81 / ${ROOTFS} rw - ext4 /dev/root rw\n`, ROOTFS), /filesystem type must be overlay/)
  assert.throws(() => parseGvisorSourceMountInfo(`71 29 0:81 / ${ROOTFS} rw overlay overlay rw\n`, ROOTFS), /exactly one separator/)
  assert.throws(() => parseGvisorSourceMountInfo(`71  29 0:81 / ${ROOTFS} rw - overlay overlay rw\n`, ROOTFS), /ambiguous whitespace/)
  assert.throws(() => parseGvisorSourceMountInfo(`71 29 0:81 / ${ROOTFS} rw - overlay overlay rw trailing\n`, ROOTFS), /trailing structural ambiguity/)
  assert.throws(() => parseGvisorSourceMountInfo(`71 29 0:81 / ${ROOTFS.replace("/var", "\\999var")} rw - overlay overlay rw\n`, ROOTFS), /invalid mountinfo escaping/)
  assert.throws(() => parseGvisorSourceMountInfo(Buffer.from([0xff]), ROOTFS), /valid UTF-8/)
})

test("H4-R3G-B materializes only fixed ctr reads and accepts omitted committed parent", async () => {
  const {
    materializeGvisorSourceCtrContainerInfoCommand,
    materializeGvisorSourceCtrSnapshotInfoCommand,
    parseGvisorSourceCtrSnapshotInfo,
    requireGvisorSourceCtrExecutablePolicy,
  } = await import("../src/trust/sandbox-observer-gvisor-source-lineage.ts")
  const config = validateGvisorSourceLineageRuntimeConfig({
    version: KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION,
    ctrPath: "/usr/bin/ctr",
    expectedCtrSha256: ID("e"),
    containerdAddress: "/run/containerd/containerd.sock",
    expectedContainerdSocketUid: "0",
    expectedContainerdSocketGid: "0",
    expectedContainerdSocketMode: "49584",
    commitSourceLineageEvidence: () => undefined,
  })
  const containerCommand = materializeGvisorSourceCtrContainerInfoCommand(config, CONTAINER_ID)
  assert.deepEqual(containerCommand.argv, [
    "--address", "/run/containerd/containerd.sock",
    "--namespace", "moby",
    "containers", "info", CONTAINER_ID,
  ])
  assert.equal(Object.isFrozen(containerCommand.argv), true)
  const snapshotCommand = materializeGvisorSourceCtrSnapshotInfoCommand(config, DIFF_A)
  assert.deepEqual(snapshotCommand.argv, [
    "--address", "/run/containerd/containerd.sock",
    "--namespace", "moby",
    "snapshots", "--snapshotter", "overlayfs",
    "info", DIFF_A,
  ])
  const omittedParent = parseGvisorSourceCtrSnapshotInfo(JSON.stringify({ Kind: "Committed", Name: DIFF_A }), DIFF_A)
  assert.equal(omittedParent.parent, "")
  assert.throws(() => parseGvisorSourceCtrSnapshotInfo(JSON.stringify({ Kind: "Committed", Name: DIFF_A, Parent: 7 }), DIFF_A), /must be a string when present/)
  assert.doesNotThrow(() => requireGvisorSourceCtrExecutablePolicy(ctrFixture()))
  const nonExecutable = createGvisorSourceCtrArtifactIdentity({
    path: "/usr/bin/ctr",
    sha256: ID("e"),
    device: "1",
    inode: "42",
    uid: "0",
    gid: "0",
    mode: "33188",
    size: "1048576",
    parentAuthority: authority(["/", "/usr", "/usr/bin"]),
  })
  assert.throws(() => requireGvisorSourceCtrExecutablePolicy(nonExecutable), /executable permission bit/)
})

test("H4-R3G-B Linux production gateway proves one exact physical source lineage on a root-owned synthetic host", { skip: process.platform !== "linux" }, async (t) => {
  const { spawn, spawnSync } = await import("node:child_process")
  const { createHash } = await import("node:crypto")
  const fs = await import("node:fs")
  const { fileURLToPath } = await import("node:url")
  const { NodeWorkspaceFileSystem } = await import("../src/edit/filesystem.ts")
  const { ExecutionGateway } = await import("../src/execution/gateway.ts")
  const { fixedPolicy } = await import("../src/trust/policy.ts")
  const r3e = await import("../src/trust/sandbox-observer-gvisor-runtime.ts")
  const r3f = await import("../src/trust/sandbox-observer-docker-control-plane.ts")
  const sourceContract = await import("../src/trust/sandbox-observer-gvisor-source-lineage.ts")

  const failOrSkip = (message: string): false => {
    if (process.env.GITHUB_ACTIONS === "true") assert.fail(message)
    t.skip(message)
    return false
  }
  const compiler = spawnSync("cc", ["--version"], { encoding: "utf8", shell: false })
  if (compiler.status !== 0) return failOrSkip(`C compiler unavailable: ${String(compiler.error ?? compiler.stderr)}`)
  const sudoProbe = spawnSync("sudo", ["-n", "true"], { encoding: "utf8", shell: false })
  if (sudoProbe.status !== 0) return failOrSkip(`passwordless sudo unavailable: ${String(sudoProbe.error ?? sudoProbe.stderr)}`)
  if (typeof process.getuid !== "function" || typeof process.getgid !== "function") return failOrSkip("numeric uid/gid APIs are unavailable")

  const scratch = mkdtempSync(join(tmpdir(), "kodac-r3g-b-live-"))
  const token = createHash("sha256").update(`${process.pid}:${Date.now()}:${scratch}`, "utf8").digest("hex").slice(0, 16)
  const secureStorageRoot = `/var/lib/kodac-r3g-b-${token}`
  const dockerRootDir = `${secureStorageRoot}/docker`
  const rootfsParentPath = `${dockerRootDir}/rootfs/overlayfs`
  const rootfsMountPath = `${rootfsParentPath}/${CONTAINER_ID}`
  const overlayRoot = `${secureStorageRoot}/overlay-fixture`
  const lowerDir = `${overlayRoot}/lower`
  const upperDir = `${overlayRoot}/upper`
  const workDir = `${overlayRoot}/work`
  const ctrParent = `${secureStorageRoot}/bin`
  const ctrPath = `${ctrParent}/ctr`
  const secureRunRoot = `/run/kodac-r3g-b-${token}`
  const containerdAddress = `${secureRunRoot}/containerd.sock`
  const runtimeRoot = join(scratch, "runsc-root")
  const workspace = join(scratch, "workspace")
  const dockerSocketPath = join(scratch, "docker.sock")
  const pidFile = join(runtimeRoot, "sandbox.pid")
  const uid = process.getuid()
  const gid = process.getgid()
  let overlayMounted = false
  let sandbox: ReturnType<typeof spawn> | undefined
  let dockerServer: Server | undefined
  let containerdServer: Server | undefined

  const run = (executable: string, args: readonly string[]) => {
    const result = spawnSync(executable, [...args], { encoding: "utf8", shell: false })
    assert.equal(result.status, 0, `${executable} ${args.join(" ")} failed: ${String(result.error ?? result.stderr)}`)
    return result
  }
  const sudo = (...args: string[]) => run("sudo", ["-n", ...args])
  const cString = (value: string) => value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
  const compileC = (name: string, text: string) => {
    const sourcePath = join(scratch, `${name}.c`)
    const binaryPath = join(scratch, name)
    fs.writeFileSync(sourcePath, text, "utf8")
    run("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", sourcePath, "-o", binaryPath])
    return binaryPath
  }
  const waitForFile = async (path: string) => {
    for (let index = 0; index < 200; index += 1) {
      if (fs.existsSync(path)) return
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
    }
    throw new Error(`fixture file did not appear: ${path}`)
  }
  const closeServer = async (server: Server | undefined) => {
    if (server === undefined) return
    server.closeAllConnections()
    if (!server.listening) return
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }
  const reap = async () => {
    if (sandbox === undefined) return
    if (sandbox.exitCode === null && sandbox.signalCode === null) sandbox.kill("SIGKILL")
    if (sandbox.exitCode === null && sandbox.signalCode === null) await new Promise<void>((resolve) => sandbox?.once("exit", () => resolve()))
  }

  try {
    fs.mkdirSync(runtimeRoot)
    fs.mkdirSync(workspace)
    const fakeRunsc = compileC("fake-runsc-r3g-b", `#define _GNU_SOURCE\n#include <signal.h>\n#include <stdio.h>\n#include <string.h>\n#include <unistd.h>\nstatic const char *PIDFILE="${cString(pidFile)}";\nstatic int write_pid(void){FILE*f=fopen(PIDFILE,"w");if(!f)return 125;if(fprintf(f,"%ld\\n",(long)getpid())<0){fclose(f);return 125;}return fclose(f)==0?0:125;}\nstatic long read_pid(void){FILE*f=fopen(PIDFILE,"r");long p=0;if(!f)return 0;if(fscanf(f,"%ld",&p)!=1)p=0;fclose(f);return p;}\nint main(int argc,char**argv){if(argc==2&&strcmp(argv[1],"sandbox")==0){if(write_pid()!=0)return 125;for(;;)pause();}if(argc>=5&&strcmp(argv[1],"--root")==0){if(strcmp(argv[3],"state")==0&&argc==5){long p=read_pid();if(p<=0)return 125;printf("{\\\"ociVersion\\\":\\\"1.2.0\\\",\\\"id\\\":\\\"%s\\\",\\\"status\\\":\\\"running\\\",\\\"pid\\\":%ld,\\\"bundle\\\":\\\"/run/kodac/%s\\\"}\\n",argv[4],p,argv[4]);return 0;}if(strcmp(argv[3],"events")==0&&argc==6&&strcmp(argv[4],"--stats")==0){printf("{\\\"type\\\":\\\"stats\\\",\\\"id\\\":\\\"%s\\\",\\\"data\\\":{\\\"cpu\\\":{\\\"usage\\\":1}}}\\n",argv[5]);return 0;}}return 125;}\n`)
    const nativeHelper = fileURLToPath(new URL("../native/gvisor-proc-observe.c", import.meta.url))
    const helperPath = join(scratch, "kodac-gvisor-proc-observe")
    run("cc", ["-std=c11", "-O2", "-Wall", "-Wextra", "-Werror", nativeHelper, "-o", helperPath])
    sandbox = spawn(fakeRunsc, ["sandbox"], { stdio: "ignore", shell: false })
    await waitForFile(pidFile)
    const sandboxPid = Number(fs.readFileSync(pidFile, "utf8").trim())
    assert.equal(Number.isSafeInteger(sandboxPid) && sandboxPid > 0, true)

    sudo("mkdir", "-p", rootfsMountPath, lowerDir, upperDir, workDir, ctrParent, secureRunRoot)
    sudo("chown", `${uid}:${gid}`, secureRunRoot)
    sudo("chmod", "0700", secureRunRoot)

    containerdServer = createServer((_request, response) => { response.statusCode = 404; response.end() })
    await new Promise<void>((resolve, reject) => {
      containerdServer?.once("error", reject)
      containerdServer?.listen(containerdAddress, () => { containerdServer?.off("error", reject); resolve() })
    })
    sudo("chown", "root:root", secureRunRoot)
    sudo("chmod", "0755", secureRunRoot)

    const expectedChainId = deriveGvisorSourceImageChainId([DIFF_A, DIFF_B])
    const compiledCtr = compileC("fake-ctr-r3g-b", `#include <stdio.h>\n#include <string.h>\nstatic const char *ADDRESS="${cString(containerdAddress)}",*CID="${CONTAINER_ID}",*ROOTFS="${cString(rootfsMountPath)}",*CHAIN="${cString(expectedChainId)}";\nint main(int argc,char**argv){if(argc==8&&strcmp(argv[1],"--address")==0&&strcmp(argv[2],ADDRESS)==0&&strcmp(argv[3],"--namespace")==0&&strcmp(argv[4],"moby")==0&&strcmp(argv[5],"containers")==0&&strcmp(argv[6],"info")==0&&strcmp(argv[7],CID)==0){printf("{\\\"ID\\\":\\\"%s\\\",\\\"Spec\\\":{\\\"root\\\":{\\\"path\\\":\\\"%s\\\"}}}\\n",CID,ROOTFS);return 0;}if(argc==10&&strcmp(argv[1],"--address")==0&&strcmp(argv[2],ADDRESS)==0&&strcmp(argv[3],"--namespace")==0&&strcmp(argv[4],"moby")==0&&strcmp(argv[5],"snapshots")==0&&strcmp(argv[6],"--snapshotter")==0&&strcmp(argv[7],"overlayfs")==0&&strcmp(argv[8],"info")==0){if(strcmp(argv[9],CID)==0){printf("{\\\"Kind\\\":\\\"Active\\\",\\\"Name\\\":\\\"%s\\\",\\\"Parent\\\":\\\"%s\\\"}\\n",CID,CHAIN);return 0;}if(strcmp(argv[9],CHAIN)==0){printf("{\\\"Kind\\\":\\\"Committed\\\",\\\"Name\\\":\\\"%s\\\"}\\n",CHAIN);return 0;}}return 125;}\n`)
    sudo("install", "-o", "root", "-g", "root", "-m", "0755", compiledCtr, ctrPath)
    sudo("mount", "-t", "overlay", "overlay", "-o", `lowerdir=${lowerDir},upperdir=${upperDir},workdir=${workDir}`, rootfsMountPath)
    overlayMounted = true

    const requirement = dockerRequirement()
    const filters = JSON.stringify({
      label: [
        `${r3f.KDO_H4_R3F_LABELS.bindingVersion}=${r3f.KDO_H4_R3F_BINDING_VERSION}`,
        `${r3f.KDO_H4_R3F_LABELS.requirementIdentity}=${requirement.requirementIdentity}`,
        `${r3f.KDO_H4_R3F_LABELS.workloadIdentity}=${requirement.workload.workloadIdentity}`,
      ],
      status: ["running"],
    })
    const listPath = `/v${r3f.KDO_H4_R3F_DOCKER_API_VERSION}/containers/json?all=1&filters=${encodeURIComponent(filters)}`
    const inspectPath = `/v${r3f.KDO_H4_R3F_DOCKER_API_VERSION}/containers/${CONTAINER_ID}/json?size=0`
    const sourceImagePath = expectedSourceImagePath(requirement)
    const requests: string[] = []
    const inspect = {
      Id: CONTAINER_ID,
      Path: requirement.workload.entrypoint.executable,
      Args: [...requirement.workload.entrypoint.args],
      State: { Running: true, Paused: false, Restarting: false, Dead: false, Pid: sandboxPid },
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
        Labels: {
          [r3f.KDO_H4_R3F_LABELS.bindingVersion]: r3f.KDO_H4_R3F_BINDING_VERSION,
          [r3f.KDO_H4_R3F_LABELS.requirementIdentity]: requirement.requirementIdentity,
          [r3f.KDO_H4_R3F_LABELS.workloadIdentity]: requirement.workload.workloadIdentity,
        },
      },
      NetworkSettings: { Networks: {} },
      ImageManifestDescriptor: { digest: requirement.workload.source.digest, mediaType: "application/vnd.oci.image.manifest.v1+json", size: 1234 },
    }
    dockerServer = createServer((request, response) => {
      const method = request.method ?? ""
      const url = request.url ?? ""
      requests.push(`${method} ${url}`)
      if (method !== "GET") { response.statusCode = 405; response.end(); return }
      if (url === listPath) { response.setHeader("content-type", "application/json"); response.end(JSON.stringify([{ Id: CONTAINER_ID, State: "running" }])); return }
      if (url === inspectPath) { response.setHeader("content-type", "application/json"); response.end(JSON.stringify(inspect)); return }
      if (url === `/v${r3f.KDO_H4_R3F_DOCKER_API_VERSION}/info`) {
        response.setHeader("content-type", "application/json")
        response.end(JSON.stringify({ OSType: "linux", Driver: "overlayfs", DockerRootDir: dockerRootDir, Containerd: { Address: containerdAddress, Namespaces: { Containers: "moby", Plugins: "plugins.moby" } } }))
        return
      }
      if (url === sourceImagePath) {
        response.setHeader("content-type", "application/json")
        response.end(JSON.stringify({ Descriptor: { digest: requirement.workload.source.digest, mediaType: "application/vnd.oci.image.manifest.v1+json", size: 1234 }, RootFS: { Type: "layers", Layers: [DIFF_A, DIFF_B] } }))
        return
      }
      response.statusCode = 404
      response.end()
    })
    await new Promise<void>((resolve, reject) => {
      dockerServer?.once("error", reject)
      dockerServer?.listen(dockerSocketPath, () => { dockerServer?.off("error", reject); resolve() })
    })

    const provider = r3f.createDockerControlPlaneBindingProvider({ socketPath: dockerSocketPath, requirement })
    const sha256File = (path: string) => createHash("sha256").update(fs.readFileSync(path)).digest("hex")
    const r3eRuntime = r3e.validateGvisorObserverRuntimeConfig({
      version: r3e.KDO_H4_R3E_RUNTIME_CONFIG_VERSION,
      runscPath: fakeRunsc,
      expectedRunscSha256: sha256File(fakeRunsc),
      observerHelperPath: helperPath,
      expectedObserverHelperSha256: sha256File(helperPath),
      runtimeRoot,
      resolveContainerBinding: provider.resolveContainerBinding,
      commitLineageEvidence(record) { return r3e.createGvisorRuntimeLineageCommit(record) },
    })
    const endpointStat = fs.lstatSync(containerdAddress, { bigint: true })
    assert.equal(endpointStat.isSocket(), true)
    const committed: string[] = []
    const sourceRuntime = sourceContract.validateGvisorSourceLineageRuntimeConfig({
      version: sourceContract.KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION,
      ctrPath,
      expectedCtrSha256: sha256File(ctrPath),
      containerdAddress,
      expectedContainerdSocketUid: endpointStat.uid.toString(),
      expectedContainerdSocketGid: endpointStat.gid.toString(),
      expectedContainerdSocketMode: endpointStat.mode.toString(),
      commitSourceLineageEvidence(record) {
        committed.push(sourceContract.serializeGvisorSourceLineageRecord(record))
        return sourceContract.createGvisorSourceLineageCommit(record)
      },
    })
    const gateway = new ExecutionGateway(new NodeWorkspaceFileSystem(workspace), fixedPolicy("allow"), undefined, undefined, r3eRuntime, undefined, sourceRuntime)
    const record = await gateway.observeGvisorSourceLineage(requirement)
    assert.deepEqual(sourceContract.validateGvisorSourceLineageRecord(record), record)
    assert.equal(record.evidenceClass, sourceContract.KDO_H4_R3G_B_EVIDENCE_CLASS)
    assert.equal(record.containerId, CONTAINER_ID)
    assert.equal(record.sourceDigest, requirement.workload.source.digest)
    assert.equal(record.expectedImageChainId, expectedChainId)
    assert.equal(committed.length, 1)
    assert.equal(committed[0], sourceContract.serializeGvisorSourceLineageRecord(record))
    assert.deepEqual(requests, [
      `GET ${listPath}`,
      `GET ${inspectPath}`,
      `GET /v1.48/info`,
      `GET ${sourceImagePath}`,
      `GET ${listPath}`,
      `GET ${inspectPath}`,
      `GET /v1.48/info`,
      `GET ${sourceImagePath}`,
    ])
  } finally {
    await closeServer(dockerServer).catch(() => {})
    await closeServer(containerdServer).catch(() => {})
    await reap().catch(() => {})
    if (overlayMounted) spawnSync("sudo", ["-n", "umount", rootfsMountPath], { stdio: "ignore", shell: false })
    spawnSync("sudo", ["-n", "rm", "-rf", secureStorageRoot, secureRunRoot], { stdio: "ignore", shell: false })
    rmSync(scratch, { recursive: true, force: true })
  }
})

test("H4-R3G-B trusted store exact same-record put is idempotent and conflicting bytes fail closed", () => {
  const { record } = fullFixture()
  const validated = validateGvisorSourceLineageRecord(record)
  const canonicalBytes = serializeGvisorSourceLineageRecord(validated)
  const stored = new Map<string, string>()
  const put = (recordIdentity: string, bytes: string) => {
    const existing = stored.get(recordIdentity)
    if (existing !== undefined && existing !== bytes) throw new Error("R3G-B durable store integrity violation: conflicting canonical bytes for recordIdentity")
    if (existing === undefined) stored.set(recordIdentity, bytes)
    return createGvisorSourceLineageCommit(validated)
  }

  const first = put(validated.recordIdentity, canonicalBytes)
  const second = put(validated.recordIdentity, canonicalBytes)
  assert.equal(stored.size, 1)
  assert.equal(stored.get(validated.recordIdentity), canonicalBytes)
  assert.deepEqual(second, first)
  assert.equal(validateGvisorSourceLineageCommit(first, validated).recordIdentity, validated.recordIdentity)
  assert.equal(validateGvisorSourceLineageCommit(second, validated).recordIdentity, validated.recordIdentity)

  assert.throws(() => put(validated.recordIdentity, `${canonicalBytes} `), /integrity violation/)
  assert.equal(stored.size, 1)
  assert.equal(stored.get(validated.recordIdentity), canonicalBytes)
})
