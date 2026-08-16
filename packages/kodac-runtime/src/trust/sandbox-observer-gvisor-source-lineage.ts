import { createHash } from "node:crypto"
import { posix } from "node:path"
import { types as utilTypes } from "node:util"

export const KDO_H4_R3G_B_VERSION = "kodac-h4-r3g-b-source-lineage-v1" as const
export const KDO_H4_R3G_B_EVIDENCE_CLASS = "e3-physical-source-candidate" as const
export const KDO_H4_R3G_B_RUNTIME_CLASS = "gvisor" as const
export const KDO_H4_R3G_B_CAPABILITY = "runtime.observe.gvisor.source-lineage" as const
export const KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION = "kodac-h4-r3g-b-runtime-config-v1" as const
export const KDO_H4_R3G_B_COMMIT_VERSION = "kodac-h4-r3g-b-source-commit-v1" as const
export const KDO_H4_R3G_B_CONTAINERD_NAMESPACE = "moby" as const
export const KDO_H4_R3G_B_SNAPSHOTTER = "overlayfs" as const
export const KDO_H4_R3G_B_DOCKER_OS = "linux" as const
export const KDO_H4_R3G_B_DOCKER_DRIVER = "overlayfs" as const

export const KDO_H4_R3G_B_LIMITS = Object.freeze({
  maxPathBytes: 4096,
  maxDockerSystemInfoBytes: 1_048_576,
  maxDockerImageInspectBytes: 1_048_576,
  maxCtrContainerInfoBytes: 1_048_576,
  maxCtrSnapshotInfoBytes: 262_144,
  maxDiffIds: 512,
  maxMountInfoBytes: 2_097_152,
  maxMountEntries: 16_384,
  maxJsonDepth: 64,
  maxJsonNodes: 32_768,
  maxObjectKeys: 4_096,
  maxArrayItems: 8_192,
  maxStringBytes: 65_536,
  totalObservationTimeoutMs: 60_000,
  dockerRequestTimeoutMs: 5_000,
  ctrTimeoutMs: 5_000,
  ctrTerminateGraceMs: 500,
  commitTimeoutMs: 5_000,
  maxRecordSerializedBytes: 131_072,
} as const)

export interface GvisorSourcePathComponentIdentity {
  readonly path: string
  readonly device: string
  readonly inode: string
  readonly uid: string
  readonly gid: string
  readonly mode: string
  readonly componentIdentity: string
}

export interface GvisorSourcePathAuthorityIdentity {
  readonly components: readonly GvisorSourcePathComponentIdentity[]
  readonly terminalPath: string
  readonly authorityIdentity: string
}

export interface GvisorSourceCtrArtifactIdentity {
  readonly path: string
  readonly sha256: string
  readonly device: string
  readonly inode: string
  readonly uid: string
  readonly gid: string
  readonly mode: string
  readonly size: string
  readonly parentAuthorityIdentity: string
  readonly artifactIdentity: string
}

export interface GvisorSourceContainerdEndpointIdentity {
  readonly address: string
  readonly device: string
  readonly inode: string
  readonly uid: string
  readonly gid: string
  readonly mode: string
  readonly parentAuthorityIdentity: string
  readonly endpointIdentity: string
}

export interface GvisorSourceDockerStorageIdentity {
  readonly dockerEndpointIdentity: string
  readonly osType: typeof KDO_H4_R3G_B_DOCKER_OS
  readonly driver: typeof KDO_H4_R3G_B_DOCKER_DRIVER
  readonly dockerRootDir: string
  readonly containerdAddress: string
  readonly containerdNamespace: typeof KDO_H4_R3G_B_CONTAINERD_NAMESPACE
  readonly snapshotter: typeof KDO_H4_R3G_B_SNAPSHOTTER
  readonly storageIdentity: string
}

export interface GvisorSourceImageRootfsIdentity {
  readonly sourceDigest: string
  readonly diffIds: readonly string[]
  readonly expectedImageChainId: string
  readonly dockerEndpointIdentity: string
  readonly imageRootfsIdentity: string
}

export type GvisorSourceSnapshotKind = "active" | "committed"

export interface GvisorSourceSnapshotNodeIdentity {
  readonly name: string
  readonly kind: GvisorSourceSnapshotKind
  readonly parent: string
  readonly nodeIdentity: string
}

export interface GvisorSourceSnapshotAncestryIdentity {
  readonly containerId: string
  readonly expectedImageChainId: string
  readonly active: GvisorSourceSnapshotNodeIdentity
  readonly init: GvisorSourceSnapshotNodeIdentity | null
  readonly image: GvisorSourceSnapshotNodeIdentity
  readonly ancestryIdentity: string
}

export interface GvisorSourceContainerSpecIdentity {
  readonly containerId: string
  readonly rootfsMountPath: string
  readonly specIdentity: string
}

export interface GvisorSourceRootfsMountIdentity {
  readonly rootfsMountPath: string
  readonly rootfsParentAuthorityIdentity: string
  readonly retainedRootfsDevice: string
  readonly retainedRootfsInode: string
  readonly mountId: string
  readonly parentMountId: string
  readonly majorMinor: string
  readonly mountRoot: string
  readonly mountOptions: string
  readonly filesystemType: "overlay"
  readonly mountSource: string
  readonly superOptions: string
  readonly mountIdentity: string
}

export interface GvisorSourceLineageRecord {
  readonly version: typeof KDO_H4_R3G_B_VERSION
  readonly runtimeClass: typeof KDO_H4_R3G_B_RUNTIME_CLASS
  readonly evidenceClass: typeof KDO_H4_R3G_B_EVIDENCE_CLASS
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly executionAttemptIdentity: string
  readonly containerBindingIdentity: string
  readonly runtimeLineageIdentity: string
  readonly containerId: string
  readonly sourceDigest: string
  readonly dockerStorageIdentity: string
  readonly imageRootfsIdentity: string
  readonly expectedImageChainId: string
  readonly ctrArtifactIdentity: string
  readonly containerdEndpointIdentity: string
  readonly rootfsParentAuthorityIdentity: string
  readonly containerSpecIdentity: string
  readonly snapshotAncestryIdentity: string
  readonly rootfsMountIdentity: string
  readonly recordIdentity: string
}

export interface GvisorSourceLineageCommit {
  readonly version: typeof KDO_H4_R3G_B_COMMIT_VERSION
  readonly recordIdentity: string
  readonly commitIdentity: string
}

export interface GvisorSourceLineageRuntimeConfig {
  readonly version: typeof KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION
  readonly ctrPath: string
  readonly expectedCtrSha256: string
  readonly containerdAddress: string
  readonly expectedContainerdSocketUid: string
  readonly expectedContainerdSocketGid: string
  readonly expectedContainerdSocketMode: string
  readonly commitSourceLineageEvidence: (record: GvisorSourceLineageRecord) => Promise<unknown> | unknown
}

const SHA256 = /^[0-9a-f]{64}$/
const SHA256_DIGEST = /^sha256:[0-9a-f]{64}$/
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/
const UNSIGNED_DECIMAL = /^(?:0|[1-9][0-9]*)$/
const MAJOR_MINOR = /^(?:0|[1-9][0-9]*):(?:0|[1-9][0-9]*)$/
const S_IFMT = 0o170000n
const S_IFDIR = 0o040000n
const S_IFREG = 0o100000n
const S_IFSOCK = 0o140000n
const GROUP_OR_WORLD_WRITE = 0o022n
const SETUID_OR_SETGID = 0o6000n

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) {
      throw new TypeError(`${label}.${key} must be a data property`)
    }
    if (!descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}.${key} must be an enumerable defined property`)
    }
  }
  return value as Record<string, unknown>
}

function asDenseArray(value: unknown, label: string): readonly unknown[] {
  if (!Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy dense array`)
  if (Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label} must use Array.prototype`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  const lengthDescriptor = Object.getOwnPropertyDescriptor(value, "length")
  if (lengthDescriptor === undefined || !("value" in lengthDescriptor) || typeof lengthDescriptor.value !== "number") {
    throw new TypeError(`${label}.length must be an own data property`)
  }
  const length = lengthDescriptor.value
  if (!Number.isSafeInteger(length) || length < 0 || length > KDO_H4_R3G_B_LIMITS.maxArrayItems) {
    throw new TypeError(`${label} length is invalid`)
  }
  const keys = Object.keys(value)
  if (keys.length !== length) throw new TypeError(`${label} must be dense and contain only index fields`)
  for (let index = 0; index < length; index += 1) {
    const key = String(index)
    if (keys[index] !== key) throw new TypeError(`${label} must use canonical dense indices`)
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    if (descriptor === undefined || descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}[${index}] must be an enumerable defined data property`)
    }
  }
  return value as readonly unknown[]
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function boundedString(value: unknown, maximum: number, label: string): string {
  if (typeof value !== "string" || value.includes("\0") || byteLength(value) > maximum) {
    throw new TypeError(`${label} must be a bounded NUL-free string`)
  }
  return value
}

function nonEmptyBoundedString(value: unknown, maximum: number, label: string): string {
  const result = boundedString(value, maximum, label)
  if (result.length === 0) throw new TypeError(`${label} must not be empty`)
  return result
}

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function digest(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_DIGEST.test(value)) throw new TypeError(`${label} must be sha256:<64 lowercase hex>`)
  return value
}

function containerId(value: unknown, label = "containerId"): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError(`${label} must be exactly 64 lowercase hexadecimal characters`)
  return value
}

function canonicalUnsignedDecimal(value: unknown, label: string): string {
  if (typeof value !== "string" || !UNSIGNED_DECIMAL.test(value)) throw new TypeError(`${label} must be canonical unsigned decimal`)
  return value
}

function canonicalPositiveDecimal(value: unknown, label: string): string {
  const result = canonicalUnsignedDecimal(value, label)
  if (result === "0") throw new TypeError(`${label} must be positive`)
  return result
}

function canonicalPath(value: unknown, label: string): string {
  const result = nonEmptyBoundedString(value, KDO_H4_R3G_B_LIMITS.maxPathBytes, label)
  if (!posix.isAbsolute(result) || posix.normalize(result) !== result || (result.length > 1 && result.endsWith("/"))) {
    throw new TypeError(`${label} must be a canonical absolute POSIX path`)
  }
  return result
}

function modeBits(value: unknown, label: string): bigint {
  return BigInt(canonicalUnsignedDecimal(value, label))
}

function requireRootOwnedNonWritableDirectory(mode: bigint, uid: string, label: string): void {
  if (uid !== "0") throw new TypeError(`${label} must be owned by uid 0`)
  if ((mode & S_IFMT) !== S_IFDIR) throw new TypeError(`${label} must be a directory`)
  if ((mode & GROUP_OR_WORLD_WRITE) !== 0n) throw new TypeError(`${label} must not be group/world writable`)
}

export function hashGvisorSourceLineageV1(domain: string, tuple: readonly unknown[]): string {
  if (!/^[A-Z0-9_]+$/.test(domain)) throw new TypeError("R3G-B hash domain must be canonical uppercase ASCII")
  const denseTuple = asDenseArray(tuple, "R3G-B hash tuple")
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-B\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(denseTuple), "utf8"))
    .digest("hex")
}

export function deriveGvisorSourceImageChainId(value: unknown): string {
  const diffIds = asDenseArray(value, "DiffIDs")
  if (diffIds.length === 0 || diffIds.length > KDO_H4_R3G_B_LIMITS.maxDiffIds) {
    throw new TypeError(`DiffIDs must contain 1..${KDO_H4_R3G_B_LIMITS.maxDiffIds} entries`)
  }
  const canonical = diffIds.map((entry, index) => digest(entry, `DiffIDs[${index}]`))
  let chainId = canonical[0]
  if (chainId === undefined) throw new TypeError("DiffIDs must not be empty")
  for (let index = 1; index < canonical.length; index += 1) {
    const next = canonical[index]
    if (next === undefined) throw new TypeError("DiffID sequence is invalid")
    const hex = createHash("sha256").update(`${chainId} ${next}`, "utf8").digest("hex")
    chainId = `sha256:${hex}`
  }
  return chainId
}

export function createGvisorSourcePathComponentIdentity(input: {
  path: string
  device: string
  inode: string
  uid: string
  gid: string
  mode: string
}): GvisorSourcePathComponentIdentity {
  const record = asPlainRecord(input, "R3G-B path component input")
  exactKeys(record, ["path", "device", "inode", "uid", "gid", "mode"], "R3G-B path component input")
  const path = canonicalPath(record.path, "path component path")
  const device = canonicalUnsignedDecimal(record.device, "path component device")
  const inode = canonicalPositiveDecimal(record.inode, "path component inode")
  const uid = canonicalUnsignedDecimal(record.uid, "path component uid")
  const gid = canonicalUnsignedDecimal(record.gid, "path component gid")
  const mode = canonicalUnsignedDecimal(record.mode, "path component mode")
  requireRootOwnedNonWritableDirectory(modeBits(mode, "path component mode"), uid, path)
  const tuple = [path, device, inode, uid, gid, mode] as const
  return Object.freeze({ path, device, inode, uid, gid, mode, componentIdentity: hashGvisorSourceLineageV1("ROOTFS_PARENT_COMPONENT", tuple) })
}

export function validateGvisorSourcePathComponentIdentity(value: unknown): GvisorSourcePathComponentIdentity {
  const record = asPlainRecord(value, "R3G-B path component")
  exactKeys(record, ["path", "device", "inode", "uid", "gid", "mode", "componentIdentity"], "R3G-B path component")
  const rebuilt = createGvisorSourcePathComponentIdentity({
    path: record.path as string,
    device: record.device as string,
    inode: record.inode as string,
    uid: record.uid as string,
    gid: record.gid as string,
    mode: record.mode as string,
  })
  if (identity(record.componentIdentity, "path componentIdentity") !== rebuilt.componentIdentity) throw new TypeError("R3G-B path component identity mismatch")
  return rebuilt
}

export function createGvisorSourcePathAuthorityIdentity(value: unknown): GvisorSourcePathAuthorityIdentity {
  const raw = asDenseArray(value, "R3G-B path authority components")
  if (raw.length === 0) throw new TypeError("R3G-B path authority must contain at least root")
  const components = raw.map((entry) => validateGvisorSourcePathComponentIdentity(entry))
  if (components[0]?.path !== "/") throw new TypeError("R3G-B path authority must start at /")
  for (let index = 1; index < components.length; index += 1) {
    const previous = components[index - 1]
    const current = components[index]
    if (previous === undefined || current === undefined || posix.dirname(current.path) !== previous.path) {
      throw new TypeError("R3G-B path authority must be one exact parent-to-child chain")
    }
  }
  const terminal = components[components.length - 1]
  if (terminal === undefined) throw new TypeError("R3G-B path authority terminal is missing")
  const frozen = Object.freeze([...components])
  return Object.freeze({
    components: frozen,
    terminalPath: terminal.path,
    authorityIdentity: hashGvisorSourceLineageV1("ROOTFS_PARENT_AUTHORITY", [frozen.map((component) => component.componentIdentity)]),
  })
}

export function validateGvisorSourcePathAuthorityIdentity(value: unknown): GvisorSourcePathAuthorityIdentity {
  const record = asPlainRecord(value, "R3G-B path authority")
  exactKeys(record, ["components", "terminalPath", "authorityIdentity"], "R3G-B path authority")
  const rebuilt = createGvisorSourcePathAuthorityIdentity(record.components)
  if (canonicalPath(record.terminalPath, "path authority terminalPath") !== rebuilt.terminalPath) throw new TypeError("R3G-B path authority terminal mismatch")
  if (identity(record.authorityIdentity, "path authorityIdentity") !== rebuilt.authorityIdentity) throw new TypeError("R3G-B path authority identity mismatch")
  return rebuilt
}

export function createGvisorSourceCtrArtifactIdentity(input: {
  path: string
  sha256: string
  device: string
  inode: string
  uid: string
  gid: string
  mode: string
  size: string
  parentAuthority: GvisorSourcePathAuthorityIdentity
}): GvisorSourceCtrArtifactIdentity {
  const record = asPlainRecord(input, "R3G-B ctr artifact input")
  exactKeys(record, ["path", "sha256", "device", "inode", "uid", "gid", "mode", "size", "parentAuthority"], "R3G-B ctr artifact input")
  const path = canonicalPath(record.path, "ctr path")
  const sha256 = identity(record.sha256, "ctr sha256")
  const device = canonicalUnsignedDecimal(record.device, "ctr device")
  const inode = canonicalPositiveDecimal(record.inode, "ctr inode")
  const uid = canonicalUnsignedDecimal(record.uid, "ctr uid")
  const gid = canonicalUnsignedDecimal(record.gid, "ctr gid")
  const mode = canonicalUnsignedDecimal(record.mode, "ctr mode")
  const size = canonicalPositiveDecimal(record.size, "ctr size")
  const parentAuthority = validateGvisorSourcePathAuthorityIdentity(record.parentAuthority)
  if (parentAuthority.terminalPath !== posix.dirname(path)) throw new TypeError("ctr parent authority does not end at ctr parent directory")
  const bits = modeBits(mode, "ctr mode")
  if ((bits & S_IFMT) !== S_IFREG) throw new TypeError("ctr artifact must be a regular file")
  if (uid !== "0") throw new TypeError("ctr artifact must be owned by uid 0")
  if ((bits & GROUP_OR_WORLD_WRITE) !== 0n) throw new TypeError("ctr artifact must not be group/world writable")
  if ((bits & SETUID_OR_SETGID) !== 0n) throw new TypeError("ctr artifact must not be setuid/setgid")
  const tuple = [path, sha256, device, inode, uid, gid, mode, size, parentAuthority.authorityIdentity] as const
  return Object.freeze({
    path, sha256, device, inode, uid, gid, mode, size,
    parentAuthorityIdentity: parentAuthority.authorityIdentity,
    artifactIdentity: hashGvisorSourceLineageV1("CTR_ARTIFACT", tuple),
  })
}

export function validateGvisorSourceCtrArtifactIdentity(value: unknown): GvisorSourceCtrArtifactIdentity {
  const record = asPlainRecord(value, "R3G-B ctr artifact")
  exactKeys(record, ["path", "sha256", "device", "inode", "uid", "gid", "mode", "size", "parentAuthorityIdentity", "artifactIdentity"], "R3G-B ctr artifact")
  const path = canonicalPath(record.path, "ctr path")
  const sha256 = identity(record.sha256, "ctr sha256")
  const device = canonicalUnsignedDecimal(record.device, "ctr device")
  const inode = canonicalPositiveDecimal(record.inode, "ctr inode")
  const uid = canonicalUnsignedDecimal(record.uid, "ctr uid")
  const gid = canonicalUnsignedDecimal(record.gid, "ctr gid")
  const mode = canonicalUnsignedDecimal(record.mode, "ctr mode")
  const size = canonicalPositiveDecimal(record.size, "ctr size")
  const parentAuthorityIdentity = identity(record.parentAuthorityIdentity, "ctr parentAuthorityIdentity")
  const bits = modeBits(mode, "ctr mode")
  if ((bits & S_IFMT) !== S_IFREG || uid !== "0" || (bits & GROUP_OR_WORLD_WRITE) !== 0n || (bits & SETUID_OR_SETGID) !== 0n) {
    throw new TypeError("ctr artifact authority is invalid")
  }
  const tuple = [path, sha256, device, inode, uid, gid, mode, size, parentAuthorityIdentity] as const
  const artifactIdentity = hashGvisorSourceLineageV1("CTR_ARTIFACT", tuple)
  if (identity(record.artifactIdentity, "ctr artifactIdentity") !== artifactIdentity) throw new TypeError("ctr artifact identity mismatch")
  return Object.freeze({ path, sha256, device, inode, uid, gid, mode, size, parentAuthorityIdentity, artifactIdentity })
}

export function createGvisorSourceContainerdEndpointIdentity(input: {
  address: string
  device: string
  inode: string
  uid: string
  gid: string
  mode: string
  parentAuthorityIdentity: string
}): GvisorSourceContainerdEndpointIdentity {
  const record = asPlainRecord(input, "R3G-B containerd endpoint input")
  exactKeys(record, ["address", "device", "inode", "uid", "gid", "mode", "parentAuthorityIdentity"], "R3G-B containerd endpoint input")
  const address = canonicalPath(record.address, "containerd address")
  const device = canonicalUnsignedDecimal(record.device, "containerd socket device")
  const inode = canonicalPositiveDecimal(record.inode, "containerd socket inode")
  const uid = canonicalUnsignedDecimal(record.uid, "containerd socket uid")
  const gid = canonicalUnsignedDecimal(record.gid, "containerd socket gid")
  const mode = canonicalUnsignedDecimal(record.mode, "containerd socket mode")
  const parentAuthorityIdentity = identity(record.parentAuthorityIdentity, "containerd parentAuthorityIdentity")
  if ((modeBits(mode, "containerd socket mode") & S_IFMT) !== S_IFSOCK) throw new TypeError("containerd endpoint must be a Unix socket")
  const tuple = [address, device, inode, uid, gid, mode, parentAuthorityIdentity] as const
  return Object.freeze({
    address, device, inode, uid, gid, mode, parentAuthorityIdentity,
    endpointIdentity: hashGvisorSourceLineageV1("CONTAINERD_ENDPOINT", tuple),
  })
}

export function validateGvisorSourceContainerdEndpointIdentity(value: unknown): GvisorSourceContainerdEndpointIdentity {
  const record = asPlainRecord(value, "R3G-B containerd endpoint")
  exactKeys(record, ["address", "device", "inode", "uid", "gid", "mode", "parentAuthorityIdentity", "endpointIdentity"], "R3G-B containerd endpoint")
  const rebuilt = createGvisorSourceContainerdEndpointIdentity({
    address: record.address as string,
    device: record.device as string,
    inode: record.inode as string,
    uid: record.uid as string,
    gid: record.gid as string,
    mode: record.mode as string,
    parentAuthorityIdentity: record.parentAuthorityIdentity as string,
  })
  if (identity(record.endpointIdentity, "containerd endpointIdentity") !== rebuilt.endpointIdentity) throw new TypeError("containerd endpoint identity mismatch")
  return rebuilt
}

export function requireGvisorSourceContainerdEndpointPolicy(
  endpoint: GvisorSourceContainerdEndpointIdentity,
  config: Pick<GvisorSourceLineageRuntimeConfig, "expectedContainerdSocketUid" | "expectedContainerdSocketGid" | "expectedContainerdSocketMode">,
): void {
  if (endpoint.uid !== config.expectedContainerdSocketUid || endpoint.gid !== config.expectedContainerdSocketGid || endpoint.mode !== config.expectedContainerdSocketMode) {
    throw new TypeError("containerd endpoint does not match trusted uid/gid/mode policy")
  }
}

export function createGvisorSourceDockerStorageIdentity(input: {
  dockerEndpointIdentity: string
  dockerRootDir: string
  containerdAddress: string
}): GvisorSourceDockerStorageIdentity {
  const record = asPlainRecord(input, "R3G-B Docker storage input")
  exactKeys(record, ["dockerEndpointIdentity", "dockerRootDir", "containerdAddress"], "R3G-B Docker storage input")
  const dockerEndpointIdentity = identity(record.dockerEndpointIdentity, "Docker endpointIdentity")
  const dockerRootDir = canonicalPath(record.dockerRootDir, "DockerRootDir")
  const containerdAddress = canonicalPath(record.containerdAddress, "containerd address")
  const tuple = [dockerEndpointIdentity, KDO_H4_R3G_B_DOCKER_OS, KDO_H4_R3G_B_DOCKER_DRIVER, dockerRootDir, containerdAddress, KDO_H4_R3G_B_CONTAINERD_NAMESPACE, KDO_H4_R3G_B_SNAPSHOTTER] as const
  return Object.freeze({
    dockerEndpointIdentity,
    osType: KDO_H4_R3G_B_DOCKER_OS,
    driver: KDO_H4_R3G_B_DOCKER_DRIVER,
    dockerRootDir,
    containerdAddress,
    containerdNamespace: KDO_H4_R3G_B_CONTAINERD_NAMESPACE,
    snapshotter: KDO_H4_R3G_B_SNAPSHOTTER,
    storageIdentity: hashGvisorSourceLineageV1("DOCKER_STORAGE", tuple),
  })
}

export function validateGvisorSourceDockerStorageIdentity(value: unknown): GvisorSourceDockerStorageIdentity {
  const record = asPlainRecord(value, "R3G-B Docker storage")
  exactKeys(record, ["dockerEndpointIdentity", "osType", "driver", "dockerRootDir", "containerdAddress", "containerdNamespace", "snapshotter", "storageIdentity"], "R3G-B Docker storage")
  if (record.osType !== KDO_H4_R3G_B_DOCKER_OS || record.driver !== KDO_H4_R3G_B_DOCKER_DRIVER || record.containerdNamespace !== KDO_H4_R3G_B_CONTAINERD_NAMESPACE || record.snapshotter !== KDO_H4_R3G_B_SNAPSHOTTER) {
    throw new TypeError("R3G-B Docker storage topology is unsupported")
  }
  const rebuilt = createGvisorSourceDockerStorageIdentity({
    dockerEndpointIdentity: record.dockerEndpointIdentity as string,
    dockerRootDir: record.dockerRootDir as string,
    containerdAddress: record.containerdAddress as string,
  })
  if (identity(record.storageIdentity, "Docker storageIdentity") !== rebuilt.storageIdentity) throw new TypeError("Docker storage identity mismatch")
  return rebuilt
}

export function createGvisorSourceImageRootfsIdentity(input: {
  sourceDigest: string
  diffIds: readonly string[]
  dockerEndpointIdentity: string
}): GvisorSourceImageRootfsIdentity {
  const record = asPlainRecord(input, "R3G-B image rootfs input")
  exactKeys(record, ["sourceDigest", "diffIds", "dockerEndpointIdentity"], "R3G-B image rootfs input")
  const sourceDigest = digest(record.sourceDigest, "sourceDigest")
  const rawDiffIds = asDenseArray(record.diffIds, "image DiffIDs")
  const diffIds = Object.freeze(rawDiffIds.map((entry, index) => digest(entry, `image DiffIDs[${index}]`)))
  const expectedImageChainId = deriveGvisorSourceImageChainId(diffIds)
  const dockerEndpointIdentity = identity(record.dockerEndpointIdentity, "Docker endpointIdentity")
  const tuple = [sourceDigest, diffIds, expectedImageChainId, dockerEndpointIdentity] as const
  return Object.freeze({ sourceDigest, diffIds, expectedImageChainId, dockerEndpointIdentity, imageRootfsIdentity: hashGvisorSourceLineageV1("IMAGE_ROOTFS", tuple) })
}

export function validateGvisorSourceImageRootfsIdentity(value: unknown): GvisorSourceImageRootfsIdentity {
  const record = asPlainRecord(value, "R3G-B image rootfs")
  exactKeys(record, ["sourceDigest", "diffIds", "expectedImageChainId", "dockerEndpointIdentity", "imageRootfsIdentity"], "R3G-B image rootfs")
  const rebuilt = createGvisorSourceImageRootfsIdentity({
    sourceDigest: record.sourceDigest as string,
    diffIds: record.diffIds as readonly string[],
    dockerEndpointIdentity: record.dockerEndpointIdentity as string,
  })
  if (digest(record.expectedImageChainId, "expectedImageChainId") !== rebuilt.expectedImageChainId) throw new TypeError("image ChainID mismatch")
  if (identity(record.imageRootfsIdentity, "imageRootfsIdentity") !== rebuilt.imageRootfsIdentity) throw new TypeError("image rootfs identity mismatch")
  return rebuilt
}

export function createGvisorSourceSnapshotNodeIdentity(input: { name: string; kind: GvisorSourceSnapshotKind; parent: string }): GvisorSourceSnapshotNodeIdentity {
  const record = asPlainRecord(input, "R3G-B snapshot node input")
  exactKeys(record, ["name", "kind", "parent"], "R3G-B snapshot node input")
  const name = nonEmptyBoundedString(record.name, KDO_H4_R3G_B_LIMITS.maxStringBytes, "snapshot name")
  if (record.kind !== "active" && record.kind !== "committed") throw new TypeError("snapshot kind must be active or committed")
  const kind = record.kind
  const parent = boundedString(record.parent, KDO_H4_R3G_B_LIMITS.maxStringBytes, "snapshot parent")
  const tuple = [name, kind, parent] as const
  return Object.freeze({ name, kind, parent, nodeIdentity: hashGvisorSourceLineageV1("SNAPSHOT_NODE", tuple) })
}

export function validateGvisorSourceSnapshotNodeIdentity(value: unknown): GvisorSourceSnapshotNodeIdentity {
  const record = asPlainRecord(value, "R3G-B snapshot node")
  exactKeys(record, ["name", "kind", "parent", "nodeIdentity"], "R3G-B snapshot node")
  const rebuilt = createGvisorSourceSnapshotNodeIdentity({ name: record.name as string, kind: record.kind as GvisorSourceSnapshotKind, parent: record.parent as string })
  if (identity(record.nodeIdentity, "snapshot nodeIdentity") !== rebuilt.nodeIdentity) throw new TypeError("snapshot node identity mismatch")
  return rebuilt
}

export function createGvisorSourceSnapshotAncestryIdentity(input: {
  containerId: string
  expectedImageChainId: string
  active: GvisorSourceSnapshotNodeIdentity
  init: GvisorSourceSnapshotNodeIdentity | null
  image: GvisorSourceSnapshotNodeIdentity
}): GvisorSourceSnapshotAncestryIdentity {
  const record = asPlainRecord(input, "R3G-B snapshot ancestry input")
  exactKeys(record, ["containerId", "expectedImageChainId", "active", "init", "image"], "R3G-B snapshot ancestry input")
  const exactContainerId = containerId(record.containerId)
  const expectedImageChainId = digest(record.expectedImageChainId, "expectedImageChainId")
  const active = validateGvisorSourceSnapshotNodeIdentity(record.active)
  const init = record.init === null ? null : validateGvisorSourceSnapshotNodeIdentity(record.init)
  const image = validateGvisorSourceSnapshotNodeIdentity(record.image)
  if (active.name !== exactContainerId || active.kind !== "active") throw new TypeError("active snapshot must be exact containerId and active")
  if (image.name !== expectedImageChainId || image.kind !== "committed") throw new TypeError("image snapshot must be exact expected ChainID and committed")
  if (init === null) {
    if (active.parent !== expectedImageChainId) throw new TypeError("direct active snapshot parent must be expected image ChainID")
  } else {
    const expectedInitName = `${exactContainerId}-init`
    if (init.name !== expectedInitName || init.kind !== "committed" || active.parent !== expectedInitName || init.parent !== expectedImageChainId) {
      throw new TypeError("init snapshot ancestry is invalid")
    }
  }
  const tuple = [active.nodeIdentity, init?.nodeIdentity ?? null, image.nodeIdentity] as const
  return Object.freeze({
    containerId: exactContainerId,
    expectedImageChainId,
    active,
    init,
    image,
    ancestryIdentity: hashGvisorSourceLineageV1("SNAPSHOT_ANCESTRY", tuple),
  })
}

export function validateGvisorSourceSnapshotAncestryIdentity(value: unknown): GvisorSourceSnapshotAncestryIdentity {
  const record = asPlainRecord(value, "R3G-B snapshot ancestry")
  exactKeys(record, ["containerId", "expectedImageChainId", "active", "init", "image", "ancestryIdentity"], "R3G-B snapshot ancestry")
  const rebuilt = createGvisorSourceSnapshotAncestryIdentity({
    containerId: record.containerId as string,
    expectedImageChainId: record.expectedImageChainId as string,
    active: record.active as GvisorSourceSnapshotNodeIdentity,
    init: record.init as GvisorSourceSnapshotNodeIdentity | null,
    image: record.image as GvisorSourceSnapshotNodeIdentity,
  })
  if (identity(record.ancestryIdentity, "snapshot ancestryIdentity") !== rebuilt.ancestryIdentity) throw new TypeError("snapshot ancestry identity mismatch")
  return rebuilt
}

export function createGvisorSourceContainerSpecIdentity(input: { containerId: string; rootfsMountPath: string }): GvisorSourceContainerSpecIdentity {
  const record = asPlainRecord(input, "R3G-B container spec input")
  exactKeys(record, ["containerId", "rootfsMountPath"], "R3G-B container spec input")
  const exactContainerId = containerId(record.containerId)
  const rootfsMountPath = canonicalPath(record.rootfsMountPath, "rootfsMountPath")
  return Object.freeze({ containerId: exactContainerId, rootfsMountPath, specIdentity: hashGvisorSourceLineageV1("CONTAINER_SPEC", [exactContainerId, rootfsMountPath]) })
}

export function validateGvisorSourceContainerSpecIdentity(value: unknown): GvisorSourceContainerSpecIdentity {
  const record = asPlainRecord(value, "R3G-B container spec")
  exactKeys(record, ["containerId", "rootfsMountPath", "specIdentity"], "R3G-B container spec")
  const rebuilt = createGvisorSourceContainerSpecIdentity({ containerId: record.containerId as string, rootfsMountPath: record.rootfsMountPath as string })
  if (identity(record.specIdentity, "container specIdentity") !== rebuilt.specIdentity) throw new TypeError("container spec identity mismatch")
  return rebuilt
}

export function createGvisorSourceRootfsMountIdentity(input: {
  rootfsMountPath: string
  rootfsParentAuthorityIdentity: string
  retainedRootfsDevice: string
  retainedRootfsInode: string
  mountId: string
  parentMountId: string
  majorMinor: string
  mountRoot: string
  mountOptions: string
  mountSource: string
  superOptions: string
}): GvisorSourceRootfsMountIdentity {
  const record = asPlainRecord(input, "R3G-B rootfs mount input")
  exactKeys(record, ["rootfsMountPath", "rootfsParentAuthorityIdentity", "retainedRootfsDevice", "retainedRootfsInode", "mountId", "parentMountId", "majorMinor", "mountRoot", "mountOptions", "mountSource", "superOptions"], "R3G-B rootfs mount input")
  const rootfsMountPath = canonicalPath(record.rootfsMountPath, "rootfsMountPath")
  const rootfsParentAuthorityIdentity = identity(record.rootfsParentAuthorityIdentity, "rootfsParentAuthorityIdentity")
  const retainedRootfsDevice = canonicalUnsignedDecimal(record.retainedRootfsDevice, "rootfs device")
  const retainedRootfsInode = canonicalPositiveDecimal(record.retainedRootfsInode, "rootfs inode")
  const mountId = canonicalPositiveDecimal(record.mountId, "mount ID")
  const parentMountId = canonicalPositiveDecimal(record.parentMountId, "parent mount ID")
  if (typeof record.majorMinor !== "string" || !MAJOR_MINOR.test(record.majorMinor)) throw new TypeError("majorMinor must be canonical major:minor")
  const majorMinor = record.majorMinor
  const mountRoot = canonicalPath(record.mountRoot, "mount root")
  const mountOptions = nonEmptyBoundedString(record.mountOptions, KDO_H4_R3G_B_LIMITS.maxStringBytes, "mount options")
  const mountSource = nonEmptyBoundedString(record.mountSource, KDO_H4_R3G_B_LIMITS.maxStringBytes, "mount source")
  const superOptions = nonEmptyBoundedString(record.superOptions, KDO_H4_R3G_B_LIMITS.maxStringBytes, "super options")
  const tuple = [rootfsMountPath, rootfsParentAuthorityIdentity, retainedRootfsDevice, retainedRootfsInode, mountId, parentMountId, majorMinor, mountRoot, mountOptions, "overlay", mountSource, superOptions] as const
  return Object.freeze({
    rootfsMountPath, rootfsParentAuthorityIdentity, retainedRootfsDevice, retainedRootfsInode,
    mountId, parentMountId, majorMinor, mountRoot, mountOptions, filesystemType: "overlay" as const, mountSource, superOptions,
    mountIdentity: hashGvisorSourceLineageV1("ROOTFS_MOUNT", tuple),
  })
}

export function validateGvisorSourceRootfsMountIdentity(value: unknown): GvisorSourceRootfsMountIdentity {
  const record = asPlainRecord(value, "R3G-B rootfs mount")
  exactKeys(record, ["rootfsMountPath", "rootfsParentAuthorityIdentity", "retainedRootfsDevice", "retainedRootfsInode", "mountId", "parentMountId", "majorMinor", "mountRoot", "mountOptions", "filesystemType", "mountSource", "superOptions", "mountIdentity"], "R3G-B rootfs mount")
  if (record.filesystemType !== "overlay") throw new TypeError("rootfs filesystemType must be overlay")
  const rebuilt = createGvisorSourceRootfsMountIdentity({
    rootfsMountPath: record.rootfsMountPath as string,
    rootfsParentAuthorityIdentity: record.rootfsParentAuthorityIdentity as string,
    retainedRootfsDevice: record.retainedRootfsDevice as string,
    retainedRootfsInode: record.retainedRootfsInode as string,
    mountId: record.mountId as string,
    parentMountId: record.parentMountId as string,
    majorMinor: record.majorMinor as string,
    mountRoot: record.mountRoot as string,
    mountOptions: record.mountOptions as string,
    mountSource: record.mountSource as string,
    superOptions: record.superOptions as string,
  })
  if (identity(record.mountIdentity, "rootfs mountIdentity") !== rebuilt.mountIdentity) throw new TypeError("rootfs mount identity mismatch")
  return rebuilt
}

function sourceRecordTuple(record: Omit<GvisorSourceLineageRecord, "recordIdentity">): readonly unknown[] {
  return [
    "kodac-h4-r3g-b-source-record-v1",
    KDO_H4_R3G_B_RUNTIME_CLASS,
    KDO_H4_R3G_B_EVIDENCE_CLASS,
    record.requirementIdentity,
    record.workloadIdentity,
    record.executionAttemptIdentity,
    record.containerBindingIdentity,
    record.runtimeLineageIdentity,
    record.containerId,
    record.sourceDigest,
    record.dockerStorageIdentity,
    record.imageRootfsIdentity,
    record.expectedImageChainId,
    record.ctrArtifactIdentity,
    record.containerdEndpointIdentity,
    record.rootfsParentAuthorityIdentity,
    record.containerSpecIdentity,
    record.snapshotAncestryIdentity,
    record.rootfsMountIdentity,
  ] as const
}

export function createGvisorSourceLineageRecord(input: {
  requirementIdentity: string
  workloadIdentity: string
  executionAttemptIdentity: string
  containerBindingIdentity: string
  runtimeLineageIdentity: string
  containerId: string
  sourceDigest: string
  dockerStorageIdentity: string
  imageRootfsIdentity: string
  expectedImageChainId: string
  ctrArtifactIdentity: string
  containerdEndpointIdentity: string
  rootfsParentAuthorityIdentity: string
  containerSpecIdentity: string
  snapshotAncestryIdentity: string
  rootfsMountIdentity: string
}): GvisorSourceLineageRecord {
  const record = asPlainRecord(input, "R3G-B source record input")
  exactKeys(record, ["requirementIdentity", "workloadIdentity", "executionAttemptIdentity", "containerBindingIdentity", "runtimeLineageIdentity", "containerId", "sourceDigest", "dockerStorageIdentity", "imageRootfsIdentity", "expectedImageChainId", "ctrArtifactIdentity", "containerdEndpointIdentity", "rootfsParentAuthorityIdentity", "containerSpecIdentity", "snapshotAncestryIdentity", "rootfsMountIdentity"], "R3G-B source record input")
  const base = Object.freeze({
    version: KDO_H4_R3G_B_VERSION,
    runtimeClass: KDO_H4_R3G_B_RUNTIME_CLASS,
    evidenceClass: KDO_H4_R3G_B_EVIDENCE_CLASS,
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    containerBindingIdentity: identity(record.containerBindingIdentity, "containerBindingIdentity"),
    runtimeLineageIdentity: identity(record.runtimeLineageIdentity, "runtimeLineageIdentity"),
    containerId: containerId(record.containerId),
    sourceDigest: digest(record.sourceDigest, "sourceDigest"),
    dockerStorageIdentity: identity(record.dockerStorageIdentity, "dockerStorageIdentity"),
    imageRootfsIdentity: identity(record.imageRootfsIdentity, "imageRootfsIdentity"),
    expectedImageChainId: digest(record.expectedImageChainId, "expectedImageChainId"),
    ctrArtifactIdentity: identity(record.ctrArtifactIdentity, "ctrArtifactIdentity"),
    containerdEndpointIdentity: identity(record.containerdEndpointIdentity, "containerdEndpointIdentity"),
    rootfsParentAuthorityIdentity: identity(record.rootfsParentAuthorityIdentity, "rootfsParentAuthorityIdentity"),
    containerSpecIdentity: identity(record.containerSpecIdentity, "containerSpecIdentity"),
    snapshotAncestryIdentity: identity(record.snapshotAncestryIdentity, "snapshotAncestryIdentity"),
    rootfsMountIdentity: identity(record.rootfsMountIdentity, "rootfsMountIdentity"),
  })
  const tuple = sourceRecordTuple(base)
  const bytes = Buffer.from(JSON.stringify(tuple), "utf8")
  if (bytes.byteLength > KDO_H4_R3G_B_LIMITS.maxRecordSerializedBytes) throw new TypeError("R3G-B source record exceeds serialized byte bound")
  return Object.freeze({ ...base, recordIdentity: hashGvisorSourceLineageV1("SOURCE_RECORD", tuple) })
}

export function validateGvisorSourceLineageRecord(value: unknown): GvisorSourceLineageRecord {
  const record = asPlainRecord(value, "R3G-B source record")
  exactKeys(record, ["version", "runtimeClass", "evidenceClass", "requirementIdentity", "workloadIdentity", "executionAttemptIdentity", "containerBindingIdentity", "runtimeLineageIdentity", "containerId", "sourceDigest", "dockerStorageIdentity", "imageRootfsIdentity", "expectedImageChainId", "ctrArtifactIdentity", "containerdEndpointIdentity", "rootfsParentAuthorityIdentity", "containerSpecIdentity", "snapshotAncestryIdentity", "rootfsMountIdentity", "recordIdentity"], "R3G-B source record")
  if (record.version !== KDO_H4_R3G_B_VERSION || record.runtimeClass !== KDO_H4_R3G_B_RUNTIME_CLASS || record.evidenceClass !== KDO_H4_R3G_B_EVIDENCE_CLASS) {
    throw new TypeError("R3G-B source record contract mismatch")
  }
  const rebuilt = createGvisorSourceLineageRecord({
    requirementIdentity: record.requirementIdentity as string,
    workloadIdentity: record.workloadIdentity as string,
    executionAttemptIdentity: record.executionAttemptIdentity as string,
    containerBindingIdentity: record.containerBindingIdentity as string,
    runtimeLineageIdentity: record.runtimeLineageIdentity as string,
    containerId: record.containerId as string,
    sourceDigest: record.sourceDigest as string,
    dockerStorageIdentity: record.dockerStorageIdentity as string,
    imageRootfsIdentity: record.imageRootfsIdentity as string,
    expectedImageChainId: record.expectedImageChainId as string,
    ctrArtifactIdentity: record.ctrArtifactIdentity as string,
    containerdEndpointIdentity: record.containerdEndpointIdentity as string,
    rootfsParentAuthorityIdentity: record.rootfsParentAuthorityIdentity as string,
    containerSpecIdentity: record.containerSpecIdentity as string,
    snapshotAncestryIdentity: record.snapshotAncestryIdentity as string,
    rootfsMountIdentity: record.rootfsMountIdentity as string,
  })
  if (identity(record.recordIdentity, "recordIdentity") !== rebuilt.recordIdentity) throw new TypeError("R3G-B source record identity mismatch")
  return rebuilt
}

export function serializeGvisorSourceLineageRecord(value: unknown): string {
  const record = validateGvisorSourceLineageRecord(value)
  const serialized = JSON.stringify(sourceRecordTuple(record))
  if (byteLength(serialized) > KDO_H4_R3G_B_LIMITS.maxRecordSerializedBytes) throw new TypeError("R3G-B source record exceeds serialized byte bound")
  return serialized
}

export function createGvisorSourceLineageCommit(recordValue: unknown): GvisorSourceLineageCommit {
  const record = validateGvisorSourceLineageRecord(recordValue)
  const version = KDO_H4_R3G_B_COMMIT_VERSION
  const recordIdentity = record.recordIdentity
  return Object.freeze({ version, recordIdentity, commitIdentity: hashGvisorSourceLineageV1("SOURCE_COMMIT", [version, recordIdentity]) })
}

export function validateGvisorSourceLineageCommit(value: unknown, expectedRecord: unknown): GvisorSourceLineageCommit {
  const record = asPlainRecord(value, "R3G-B source commit")
  exactKeys(record, ["version", "recordIdentity", "commitIdentity"], "R3G-B source commit")
  if (record.version !== KDO_H4_R3G_B_COMMIT_VERSION) throw new TypeError("R3G-B source commit version mismatch")
  const expected = createGvisorSourceLineageCommit(expectedRecord)
  if (identity(record.recordIdentity, "source commit recordIdentity") !== expected.recordIdentity) throw new TypeError("R3G-B source commit recordIdentity mismatch")
  if (identity(record.commitIdentity, "source commit commitIdentity") !== expected.commitIdentity) throw new TypeError("R3G-B source commit identity mismatch")
  return expected
}

export function validateGvisorSourceLineageRuntimeConfig(value: unknown): GvisorSourceLineageRuntimeConfig {
  const record = asPlainRecord(value, "R3G-B runtime config")
  exactKeys(record, ["version", "ctrPath", "expectedCtrSha256", "containerdAddress", "expectedContainerdSocketUid", "expectedContainerdSocketGid", "expectedContainerdSocketMode", "commitSourceLineageEvidence"], "R3G-B runtime config")
  if (record.version !== KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION) throw new TypeError("R3G-B runtime config version mismatch")
  if (typeof record.commitSourceLineageEvidence !== "function") throw new TypeError("commitSourceLineageEvidence must be a function")
  return Object.freeze({
    version: KDO_H4_R3G_B_RUNTIME_CONFIG_VERSION,
    ctrPath: canonicalPath(record.ctrPath, "ctrPath"),
    expectedCtrSha256: identity(record.expectedCtrSha256, "expectedCtrSha256"),
    containerdAddress: canonicalPath(record.containerdAddress, "containerdAddress"),
    expectedContainerdSocketUid: canonicalUnsignedDecimal(record.expectedContainerdSocketUid, "expectedContainerdSocketUid"),
    expectedContainerdSocketGid: canonicalUnsignedDecimal(record.expectedContainerdSocketGid, "expectedContainerdSocketGid"),
    expectedContainerdSocketMode: canonicalUnsignedDecimal(record.expectedContainerdSocketMode, "expectedContainerdSocketMode"),
    commitSourceLineageEvidence: record.commitSourceLineageEvidence as GvisorSourceLineageRuntimeConfig["commitSourceLineageEvidence"],
  })
}
