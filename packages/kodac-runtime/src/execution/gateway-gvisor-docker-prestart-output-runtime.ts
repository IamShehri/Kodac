import { createHash, randomBytes } from "node:crypto"
import { lstatSync, readFileSync, statfsSync } from "node:fs"
import { request as httpRequest, type IncomingMessage } from "node:http"
import { posix } from "node:path"
import { TextDecoder, types as utilTypes } from "node:util"

import {
  validateSandboxAdmissionPermit,
  type SandboxAdmissionPermit,
} from "../trust/sandbox-admission-permit.ts"
import {
  validateSandboxDormantCreatedAdmission,
  validateSandboxDormantCreatedAdmissionCommit,
  type SandboxDormantCreatedAdmission,
  type SandboxDormantCreatedAdmissionCommit,
} from "../trust/sandbox-admission-dormant-create.ts"
import {
  KDO_H4_R4B_B2A_DURABILITY,
  KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION,
  KDO_H4_R4B_B2A_FAILURE_VERSION,
  KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION,
  KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION,
  KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION,
  KDO_H4_R4B_B2A_PREPARED_VERSION,
  KDO_H4_R4B_B2A_STATE_FENCE_VERSION,
  deriveSandboxPrestartFailureCommitIdentity,
  deriveSandboxPrestartFailureIdentity,
  deriveSandboxPrestartOutputOperationIdentity,
  deriveSandboxPrestartOwnershipClaimCommitIdentity,
  deriveSandboxPrestartOwnershipClaimIdentity,
  deriveSandboxPrestartPreparedCommitIdentity,
  deriveSandboxPrestartPreparedIdentity,
  deriveSandboxPrestartStateIdentity,
  validateSandboxPrestartFailureTransactionResult,
  validateSandboxPrestartOwnershipClaim,
  validateSandboxPrestartOwnershipClaimCommit,
  validateSandboxPrestartOwnershipClaimTransactionResult,
  validateSandboxPrestartPrepared,
  validateSandboxPrestartPreparedTransactionResult,
  validateSandboxPrestartStateFence,
  type SandboxPrestartFailure,
  type SandboxPrestartFailureCode,
  type SandboxPrestartFailureCommit,
  type SandboxPrestartFailurePhase,
  type SandboxPrestartOwnershipClaim,
  type SandboxPrestartOwnershipClaimCommit,
  type SandboxPrestartPrepared,
  type SandboxPrestartPreparedCommit,
  type SandboxPrestartStateFence,
} from "../trust/sandbox-admission-prestart-output.ts"
import {
  KDO_H4_R3F_LIMITS,
  KDO_H4_R3F_PROVIDER_ID,
  createDockerSocketEndpointIdentity,
  type DockerControlPlaneBindingProvider,
} from "../trust/sandbox-observer-docker-control-plane.ts"
import {
  GvisorPrestartAttachError,
  GvisorPrestartReaderError,
  createGvisorPrestartDormantReader,
  openGvisorPrestartAttach,
  type GvisorPrestartDormantReader,
} from "./gateway-gvisor-output-channel-internal.ts"

export const KDO_H4_R4B_B2A_RUNTIME_VERSION = "kodac-h4-r4b-b2a-prestart-output-runtime-v1" as const
export const KDO_H4_R4B_B2A_READY_VERSION = "kodac-h4-r4b-b2a-prestart-ready-v1" as const
export const KDO_H4_R4B_B2A_RUNTIME_LIMITS = Object.freeze({
  attachUpgradeTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
  readerActivationTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
  dormantRevalidationTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
  ownerToReadyTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs * 3,
} as const)

export interface GvisorDockerPrestartReady {
  readonly version: typeof KDO_H4_R4B_B2A_READY_VERSION
  readonly executionAttemptIdentity: string
  readonly prestartOutputOperationIdentity: string
  readonly containerId: string
  readonly ownerInstanceIdentity: string
}

export interface GvisorDockerPrestartOutputResult {
  readonly prepared: SandboxPrestartPrepared
  readonly preparedCommit: SandboxPrestartPreparedCommit
  readonly ownershipClaim: SandboxPrestartOwnershipClaim
  readonly ownershipClaimCommit: SandboxPrestartOwnershipClaimCommit
  readonly readiness: GvisorDockerPrestartReady
}

export class SandboxPrestartBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxPrestartBlockedError"
  }
}

export class SandboxPrestartIndeterminateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxPrestartIndeterminateError"
  }
}

export class SandboxPrestartOwnerClaimedUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxPrestartOwnerClaimedUnavailableError"
  }
}

export class SandboxPrestartTerminalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxPrestartTerminalError"
  }
}

interface PreparedTransactionInput {
  readonly prepared: SandboxPrestartPrepared
  readonly preparedCommit: SandboxPrestartPreparedCommit
  readonly stateFence: SandboxPrestartStateFence
}

interface OwnershipClaimTransactionInput {
  readonly expectedStateFence: SandboxPrestartStateFence
  readonly claim: SandboxPrestartOwnershipClaim
  readonly claimCommit: SandboxPrestartOwnershipClaimCommit
  readonly nextStateFence: SandboxPrestartStateFence
}

interface FailureTransactionInput {
  readonly expectedStateFence: SandboxPrestartStateFence
  readonly failure: SandboxPrestartFailure
  readonly failureCommit: SandboxPrestartFailureCommit
  readonly nextStateFence: SandboxPrestartStateFence
}

export interface GvisorDockerPrestartOutputRuntimeConfig {
  readonly socketPath: string
  readonly dockerControlPlane: DockerControlPlaneBindingProvider
  readonly commitPreparedTransaction: (
    input: PreparedTransactionInput,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitOwnershipClaimTransaction: (
    input: OwnershipClaimTransactionInput,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly readStateFence: (
    prestartOutputOperationIdentity: string,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitFailureTransaction: (
    input: FailureTransactionInput,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
}

interface TrustedGvisorDockerPrestartOutputRuntime {
  readonly version: typeof KDO_H4_R4B_B2A_RUNTIME_VERSION
  readonly socketPath: string
  readonly dockerControlPlane: DockerControlPlaneBindingProvider
  readonly commitPreparedTransaction: GvisorDockerPrestartOutputRuntimeConfig["commitPreparedTransaction"]
  readonly commitOwnershipClaimTransaction: GvisorDockerPrestartOutputRuntimeConfig["commitOwnershipClaimTransaction"]
  readonly readStateFence: GvisorDockerPrestartOutputRuntimeConfig["readStateFence"]
  readonly commitFailureTransaction: GvisorDockerPrestartOutputRuntimeConfig["commitFailureTransaction"]
}

interface HostPathFact {
  readonly path: string
  readonly device: string
  readonly inode: string
  readonly uid: string
  readonly gid: string
  readonly mode: string
  readonly fileSystemType: string
  readonly kind: "directory" | "socket"
}

interface HostTrustSnapshot {
  readonly uidMap: string
  readonly gidMap: string
  readonly socketEndpointIdentity: string
  readonly pathFacts: readonly HostPathFact[]
  readonly snapshotIdentity: string
}

interface OwnerController {
  readonly runtime: TrustedGvisorDockerPrestartOutputRuntime
  readonly prepared: SandboxPrestartPrepared
  readonly claim: SandboxPrestartOwnershipClaim
  readonly ownerCapability: object
  readonly initialHost: HostTrustSnapshot
  localState: "OWNER_CLAIMED_LOCAL" | "ATTACHING" | "READER_ACTIVE" | "PRESTART_READY" | "FAILED" | "INVALIDATED"
  reader: GvisorPrestartDormantReader | null
  readyHandle: GvisorDockerPrestartReady | null
  absoluteDeadlineReached: boolean
}

const decoder = new TextDecoder("utf-8", { fatal: true })
const trustedRuntimes = new WeakSet<object>()
const ownerCapabilities = new WeakSet<object>()
const ownerSecrets = new WeakMap<object, Buffer>()
const readinessControllers = new WeakMap<object, OwnerController>()
const SHA256 = /^[0-9a-f]{64}$/
const FULL_ID_MAP = "0:0:4294967295"
const SUPPORTED_POSIX_ACL_FILE_SYSTEM_TYPES = new Set([
  0xef53n, // ext2/ext3/ext4
  0x58465342n, // XFS
  0x9123683en, // Btrfs
  0x01021994n, // tmpfs
  0xf2f52010n, // F2FS
])
const DOCKER_API_1_48_MASKED_PATH_FLOOR = Object.freeze([
  "/proc/asound", "/proc/acpi", "/proc/kcore", "/proc/keys", "/proc/latency_stats", "/proc/timer_list", "/proc/timer_stats",
  "/proc/sched_debug", "/proc/scsi", "/sys/firmware", "/sys/devices/virtual/powercap",
] as const)
const DOCKER_API_1_48_READONLY_PATH_FLOOR = Object.freeze([
  "/proc/bus", "/proc/fs", "/proc/irq", "/proc/sys", "/proc/sysrq-trigger",
] as const)

function runtimeHash(domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R4B-B2A-RUNTIME\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) {
      throw new TypeError(`${label}.${key} must be an enumerable defined data property`)
    }
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function trustedCallback<T>(value: unknown, label: string): T {
  if (typeof value !== "function" || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy function`)
  return value as T
}

function canonicalSocketPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || Buffer.byteLength(value, "utf8") > KDO_H4_R3F_LIMITS.maxSocketPathBytes) {
    throw new TypeError("B2A Docker socketPath must be bounded non-empty POSIX text")
  }
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) {
    throw new TypeError("B2A Docker socketPath must be canonical absolute POSIX path")
  }
  return value
}

function parseFullIdentityMap(text: string, label: string): string {
  if (/[^\x09\x0a\x0d\x20-\x7e]/.test(text)) throw new SandboxPrestartBlockedError(`${label} contains non-ASCII input`)
  const tokens = text.trim().split(/[ \t\r\n]+/)
  if (tokens.length !== 3 || tokens.some((token) => !/^[0-9]+$/.test(token))) throw new SandboxPrestartBlockedError(`${label} must contain exactly one unsigned mapping triplet`)
  const values = tokens.map((token) => BigInt(token))
  if (values[0] !== 0n || values[1] !== 0n || values[2] !== 4294967295n) throw new SandboxPrestartBlockedError(`${label} is not the required full host identity mapping`)
  return FULL_ID_MAP
}

function pathPrefixes(socketPath: string): readonly string[] {
  const parts = socketPath.split("/").filter(Boolean)
  if (parts.length === 0) throw new TypeError("B2A Docker socket path must name a socket entry")
  const ancestors: string[] = ["/"]
  let current = ""
  for (const part of parts.slice(0, -1)) {
    current += `/${part}`
    ancestors.push(current)
  }
  return Object.freeze(ancestors)
}

function pathFact(path: string, kind: "directory" | "socket"): HostPathFact {
  const stats = lstatSync(path, { bigint: true })
  const fsType = statfsSync(path, { bigint: true }).type
  if (!SUPPORTED_POSIX_ACL_FILE_SYSTEM_TYPES.has(fsType)) throw new SandboxPrestartBlockedError(`B2A path ${path} is on an unsupported filesystem type 0x${fsType.toString(16)}`)
  if (kind === "directory") {
    if (!stats.isDirectory()) throw new SandboxPrestartBlockedError(`B2A protected path component is not a real directory: ${path}`)
    if (stats.uid !== 0n) throw new SandboxPrestartBlockedError(`B2A protected directory is not root-owned: ${path}`)
    if ((stats.mode & 0o022n) !== 0n) throw new SandboxPrestartBlockedError(`B2A protected directory is group/world writable: ${path}`)
  } else {
    if (!stats.isSocket()) throw new SandboxPrestartBlockedError("B2A Docker endpoint must be a real pathname Unix socket")
    if (stats.uid !== 0n || stats.gid !== 0n) throw new SandboxPrestartBlockedError("B2A Docker socket must be uid=0 gid=0")
    if ((stats.mode & 0o777n) !== 0o600n) throw new SandboxPrestartBlockedError("B2A Docker socket permission bits must be exactly 0600")
  }
  return Object.freeze({
    path,
    device: stats.dev.toString(10),
    inode: stats.ino.toString(10),
    uid: stats.uid.toString(10),
    gid: stats.gid.toString(10),
    mode: stats.mode.toString(10),
    fileSystemType: fsType.toString(10),
    kind,
  })
}

function snapshotHostTrust(socketPath: string): HostTrustSnapshot {
  if (process.platform !== "linux") throw new SandboxPrestartBlockedError("B2A requires Linux pathname-socket semantics")
  if (typeof process.geteuid !== "function" || process.geteuid() !== 0 || typeof process.getegid !== "function" || process.getegid() !== 0) {
    throw new SandboxPrestartBlockedError("B2A Docker client must run with effective uid=0 gid=0")
  }
  const uidMap = parseFullIdentityMap(readFileSync("/proc/self/uid_map", "utf8"), "B2A uid_map")
  const gidMap = parseFullIdentityMap(readFileSync("/proc/self/gid_map", "utf8"), "B2A gid_map")
  const pathFacts = Object.freeze([
    ...pathPrefixes(socketPath).map((path) => pathFact(path, "directory")),
    pathFact(socketPath, "socket"),
  ])
  const final = pathFacts[pathFacts.length - 1]
  if (final === undefined) throw new SandboxPrestartBlockedError("B2A socket path facts are empty")
  const endpoint = createDockerSocketEndpointIdentity({
    device: final.device,
    inode: final.inode,
    uid: final.uid,
    gid: final.gid,
    mode: final.mode,
  })
  const base = Object.freeze({ uidMap, gidMap, socketEndpointIdentity: endpoint.endpointIdentity, pathFacts })
  return Object.freeze({ ...base, snapshotIdentity: runtimeHash("HOST_TRUST_SNAPSHOT", base) })
}

function requireSameHostTrust(current: HostTrustSnapshot, expected: HostTrustSnapshot): void {
  if (current.snapshotIdentity !== expected.snapshotIdentity) throw new SandboxPrestartBlockedError("B2A protected socket namespace or host-ID mapping changed")
}

function validateDockerProvider(providerValue: unknown, permit: SandboxAdmissionPermit, host: HostTrustSnapshot): DockerControlPlaneBindingProvider {
  if (providerValue === null || typeof providerValue !== "object" || utilTypes.isProxy(providerValue)) throw new TypeError("B2A requires a canonical R3F Docker provider")
  const provider = providerValue as DockerControlPlaneBindingProvider
  if (provider.providerId !== KDO_H4_R3F_PROVIDER_ID) throw new TypeError("B2A Docker provider id mismatch")
  identity(provider.providerIdentity, "B2A providerIdentity")
  if (provider.requirementIdentity !== permit.requirementIdentity || provider.workloadIdentity !== permit.workloadIdentity) throw new TypeError("B2A Docker provider requirement/workload mismatch")
  if (provider.socketEndpoint === null || typeof provider.socketEndpoint !== "object") throw new TypeError("B2A Docker provider lacks socket endpoint identity")
  identity(provider.socketEndpoint.endpointIdentity, "B2A provider socket endpoint identity")
  if (provider.socketEndpoint.endpointIdentity !== host.socketEndpointIdentity) throw new SandboxPrestartBlockedError("B2A canonical R3F provider is bound to a different Docker socket endpoint")
  return provider
}

function validateJsonSyntaxNoDuplicateKeys(text: string, label: string): void {
  let index = 0
  const length = text.length
  const whitespace = (char: string) => char === " " || char === "\t" || char === "\r" || char === "\n"
  const skip = () => { while (index < length && whitespace(text[index] ?? "")) index += 1 }
  const numberPattern = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y
  const stringToken = (): string => {
    if (text[index] !== '"') throw new TypeError(`${label} contains invalid JSON string syntax`)
    const start = index++
    while (index < length) {
      const char = text[index] ?? ""
      if (char === '"') {
        index += 1
        try { return JSON.parse(text.slice(start, index)) as string }
        catch { throw new TypeError(`${label} contains invalid JSON string syntax`) }
      }
      if (char === "\\") {
        index += 1
        if (index >= length) throw new TypeError(`${label} contains an unterminated JSON escape`)
        if (text[index] === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) throw new TypeError(`${label} contains invalid JSON unicode escape`)
          index += 4
        } else if (!'"\\/bfnrt'.includes(text[index] ?? "")) throw new TypeError(`${label} contains an invalid JSON escape`)
      } else if (char.charCodeAt(0) < 0x20) throw new TypeError(`${label} contains an unescaped JSON control character`)
      index += 1
    }
    throw new TypeError(`${label} contains an unterminated JSON string`)
  }
  const parseValue = (depth: number): void => {
    if (depth > KDO_H4_R3F_LIMITS.maxJsonDepth) throw new TypeError(`${label} exceeds JSON nesting depth`)
    skip()
    const char = text[index]
    if (char === "{") {
      index += 1; skip(); const keys = new Set<string>()
      if (text[index] === "}") { index += 1; return }
      for (;;) {
        skip(); const key = stringToken()
        if (keys.has(key)) throw new TypeError(`${label} contains duplicate JSON object key: ${key}`)
        keys.add(key); skip()
        if (text[index] !== ":") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1; parseValue(depth + 1); skip()
        if (text[index] === "}") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1
      }
    }
    if (char === "[") {
      index += 1; skip()
      if (text[index] === "]") { index += 1; return }
      for (;;) {
        parseValue(depth + 1); skip()
        if (text[index] === "]") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON array syntax`)
        index += 1
      }
    }
    if (char === '"') { stringToken(); return }
    numberPattern.lastIndex = index
    const numeric = numberPattern.exec(text)
    if (numeric !== null) { index = numberPattern.lastIndex; return }
    for (const literal of ["true", "false", "null"] as const) if (text.startsWith(literal, index)) { index += literal.length; return }
    throw new TypeError(`${label} contains invalid JSON value syntax`)
  }
  parseValue(0); skip()
  if (index !== length) throw new TypeError(`${label} contains trailing JSON content`)
}

async function readResponseBody(response: IncomingMessage): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    let bytes = 0
    let settled = false
    const finishReject = (error: unknown) => { if (settled) return; settled = true; reject(error) }
    response.on("data", (chunk: Buffer | string) => {
      const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      bytes += part.byteLength
      if (bytes > KDO_H4_R3F_LIMITS.maxInspectResponseBytes) {
        const error = new Error("B2A Docker inspect body exceeds bound")
        finishReject(error); response.destroy(error); return
      }
      chunks.push(part)
    })
    response.on("end", () => { if (settled) return; settled = true; resolve(Buffer.concat(chunks, bytes)) })
    response.on("aborted", () => finishReject(new Error("B2A Docker inspect response aborted")))
    response.on("error", finishReject)
  })
}

async function boundedDormantInspect(socketPath: string, containerId: string, signal?: AbortSignal): Promise<Record<string, unknown>> {
  if (signal?.aborted) throw new SandboxPrestartBlockedError("B2A dormant revalidation aborted before Docker read")
  const body = await new Promise<Buffer>((resolve, reject) => {
    let settled = false
    const cleanup = () => signal?.removeEventListener("abort", onAbort)
    const finishReject = (error: unknown) => { if (settled) return; settled = true; cleanup(); reject(error) }
    const request = httpRequest({
      method: "GET",
      socketPath,
      path: `/v1.48/containers/${containerId}/json?size=0`,
      agent: false,
      maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
      headers: Object.freeze({ Accept: "application/json", Connection: "close" }),
    }, (response) => {
      const headerBytes = response.rawHeaders.reduce((total, item) => total + Buffer.byteLength(item, "utf8") + 2, 0)
      if (headerBytes > KDO_H4_R3F_LIMITS.maxResponseHeaderBytes) {
        const error = new Error("B2A Docker inspect response headers exceed bound")
        finishReject(error); response.destroy(error); return
      }
      if (response.statusCode !== 200) {
        const error = new Error(`B2A Docker inspect failed with HTTP ${String(response.statusCode ?? "unknown")}`)
        finishReject(error); response.destroy(error); return
      }
      void readResponseBody(response).then((value) => { if (settled) return; settled = true; cleanup(); resolve(value) }, finishReject)
    })
    const onAbort = () => { const error = new SandboxPrestartBlockedError("B2A dormant revalidation aborted"); finishReject(error); request.destroy(error) }
    request.on("error", finishReject)
    request.setTimeout(KDO_H4_R4B_B2A_RUNTIME_LIMITS.dormantRevalidationTimeoutMs, () => {
      const error = new Error("B2A Docker dormant revalidation timed out")
      finishReject(error); request.destroy(error)
    })
    signal?.addEventListener("abort", onAbort, { once: true })
    if (signal?.aborted) { onAbort(); return }
    request.end()
  })
  let text: string
  try { text = decoder.decode(body) } catch { throw new TypeError("B2A Docker inspect must be valid UTF-8") }
  validateJsonSyntaxNoDuplicateKeys(text, "B2A Docker inspect")
  return asPlainRecord(JSON.parse(text) as unknown, "B2A Docker inspect")
}

function requiredRecord(record: Record<string, unknown>, key: string, label: string): Record<string, unknown> {
  return asPlainRecord(record[key], `${label}.${key}`)
}
function requiredString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key]; if (typeof value !== "string") throw new TypeError(`${label}.${key} must be a string`); return value
}
function requiredBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key]; if (typeof value !== "boolean") throw new TypeError(`${label}.${key} must be boolean`); return value
}
function requiredInteger(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key]; if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new TypeError(`${label}.${key} must be a safe integer`); return value
}
function requiredStringArray(record: Record<string, unknown>, key: string, label: string): readonly string[] {
  const value = record[key]
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label}.${key} must be a plain array`)
  return Object.freeze(value.map((entry, index) => { if (typeof entry !== "string") throw new TypeError(`${label}.${key}[${index}] must be a string`); return entry }))
}
function optionalEmptyArray(record: Record<string, unknown>, key: string, label: string): void {
  const value = record[key]
  if (value === undefined || value === null) return
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length !== 0) throw new TypeError(`${label}.${key} must be absent, null, or an empty plain array`)
}
function optionalEmptyRecord(record: Record<string, unknown>, key: string, label: string): void {
  const value = record[key]
  if (value === undefined || value === null) return
  if (Object.keys(asPlainRecord(value, `${label}.${key}`)).length !== 0) throw new TypeError(`${label}.${key} must be absent, null, or empty`)
}
function optionalFalse(record: Record<string, unknown>, key: string, label: string): void {
  const value = record[key]; if (value === undefined || value === null) return; if (value !== false) throw new TypeError(`${label}.${key} must be absent, null, or false`)
}
function optionalStringIn(record: Record<string, unknown>, key: string, allowed: readonly string[], label: string): void {
  const value = record[key]; if (value === undefined || value === null) return; if (typeof value !== "string" || !allowed.includes(value)) throw new TypeError(`${label}.${key} contains unadmitted authority`)
}
function requireProtectionPathFloor(record: Record<string, unknown>, key: string, required: readonly string[], label: string): void {
  const observed = requiredStringArray(record, key, label)
  const set = new Set(observed)
  if (set.size !== observed.length) throw new TypeError(`${label}.${key} must not contain duplicate paths`)
  for (const path of required) if (!set.has(path)) throw new TypeError(`${label}.${key} is missing required protection path ${path}`)
}

function requireNoUnadmittedHostAuthority(inspect: Record<string, unknown>, config: Record<string, unknown>, hostConfig: Record<string, unknown>): void {
  requireProtectionPathFloor(hostConfig, "MaskedPaths", DOCKER_API_1_48_MASKED_PATH_FLOOR, "B2A Docker inspect HostConfig")
  requireProtectionPathFloor(hostConfig, "ReadonlyPaths", DOCKER_API_1_48_READONLY_PATH_FLOOR, "B2A Docker inspect HostConfig")
  for (const key of ["Binds", "Links", "Dns", "DnsOptions", "DnsSearch", "ExtraHosts", "VolumesFrom", "CapAdd", "CapDrop", "GroupAdd", "Devices", "DeviceCgroupRules", "DeviceRequests", "Ulimits", "SecurityOpt", "Mounts"] as const) optionalEmptyArray(hostConfig, key, "B2A Docker inspect HostConfig")
  for (const key of ["PortBindings", "StorageOpt", "Tmpfs", "Sysctls"] as const) optionalEmptyRecord(hostConfig, key, "B2A Docker inspect HostConfig")
  for (const key of ["PublishAllPorts", "AutoRemove", "ReadonlyRootfs"] as const) optionalFalse(hostConfig, key, "B2A Docker inspect HostConfig")
  optionalStringIn(hostConfig, "PidMode", [""], "B2A Docker inspect HostConfig")
  optionalStringIn(hostConfig, "IpcMode", ["", "private"], "B2A Docker inspect HostConfig")
  optionalStringIn(hostConfig, "UTSMode", [""], "B2A Docker inspect HostConfig")
  optionalStringIn(hostConfig, "UsernsMode", [""], "B2A Docker inspect HostConfig")
  optionalStringIn(hostConfig, "CgroupnsMode", ["", "private"], "B2A Docker inspect HostConfig")
  optionalStringIn(hostConfig, "CgroupParent", [""], "B2A Docker inspect HostConfig")
  optionalStringIn(hostConfig, "VolumeDriver", [""], "B2A Docker inspect HostConfig")
  if (requiredBoolean(config, "AttachStdout", "B2A Docker inspect Config") !== true || requiredBoolean(config, "AttachStderr", "B2A Docker inspect Config") !== true) throw new TypeError("B2A Docker inspect requires AttachStdout=true and AttachStderr=true")
  if (requiredBoolean(config, "AttachStdin", "B2A Docker inspect Config") !== false || requiredBoolean(config, "OpenStdin", "B2A Docker inspect Config") !== false) throw new TypeError("B2A Docker inspect requires AttachStdin=false and OpenStdin=false")
  optionalFalse(config, "StdinOnce", "B2A Docker inspect Config")
  optionalFalse(config, "NetworkDisabled", "B2A Docker inspect Config")
  optionalEmptyRecord(config, "Volumes", "B2A Docker inspect Config")
  const healthcheckValue = config.Healthcheck
  if (healthcheckValue !== undefined && healthcheckValue !== null) {
    const healthcheck = asPlainRecord(healthcheckValue, "B2A Docker inspect Config.Healthcheck")
    const test = requiredStringArray(healthcheck, "Test", "B2A Docker inspect Config.Healthcheck")
    if (test.length !== 1 || test[0] !== "NONE") throw new TypeError("B2A Docker inspect Config.Healthcheck must be disabled")
  }
  optionalEmptyArray(inspect, "Mounts", "B2A Docker inspect")
}

function validateDormantInspect(inspect: Record<string, unknown>, created: SandboxDormantCreatedAdmission, permit: SandboxAdmissionPermit): void {
  if (requiredString(inspect, "Id", "B2A Docker inspect") !== created.containerId) throw new TypeError("B2A Docker inspect container ID mismatch")
  if (requiredString(inspect, "Name", "B2A Docker inspect") !== `/${created.containerName}`) throw new TypeError("B2A Docker inspect container name mismatch")
  if (requiredString(inspect, "Path", "B2A Docker inspect") !== created.prepared.entrypointExecutable) throw new TypeError("B2A Docker inspect executable mismatch")
  const args = requiredStringArray(inspect, "Args", "B2A Docker inspect")
  const expectedArgs = permit.binding.requirement.workload.entrypoint.args
  if (args.length !== expectedArgs.length || args.some((arg, index) => arg !== expectedArgs[index])) throw new TypeError("B2A Docker inspect arguments mismatch")
  const state = requiredRecord(inspect, "State", "B2A Docker inspect")
  if (requiredString(state, "Status", "B2A Docker inspect State") !== "created") throw new TypeError("B2A subject must remain in Docker created state")
  if (requiredBoolean(state, "Running", "B2A Docker inspect State") || requiredBoolean(state, "Paused", "B2A Docker inspect State") || requiredBoolean(state, "Restarting", "B2A Docker inspect State") || requiredBoolean(state, "Dead", "B2A Docker inspect State") || requiredInteger(state, "Pid", "B2A Docker inspect State") !== 0) throw new TypeError("B2A subject is not pristine dormant")
  if (requiredInteger(inspect, "RestartCount", "B2A Docker inspect") !== 0) throw new TypeError("B2A subject restart count must remain zero")
  const config = requiredRecord(inspect, "Config", "B2A Docker inspect")
  if (requiredString(config, "Image", "B2A Docker inspect Config") !== created.prepared.sourceReference) throw new TypeError("B2A Docker inspect image reference mismatch")
  if (requiredBoolean(config, "Tty", "B2A Docker inspect Config")) throw new TypeError("B2A Docker inspect requires Tty=false")
  const labels = requiredRecord(config, "Labels", "B2A Docker inspect Config")
  const expectedLabels = created.prepared.labels as Readonly<Record<string, string>>
  const actualLabelKeys = Object.keys(labels).sort()
  const expectedLabelKeys = Object.keys(expectedLabels).sort()
  if (actualLabelKeys.length !== expectedLabelKeys.length || actualLabelKeys.some((key, index) => key !== expectedLabelKeys[index])) throw new TypeError("B2A Docker inspect labels drifted")
  for (const [key, value] of Object.entries(expectedLabels)) if (labels[key] !== value) throw new TypeError(`B2A Docker inspect label mismatch: ${key}`)
  const hostConfig = requiredRecord(inspect, "HostConfig", "B2A Docker inspect")
  if (requiredString(hostConfig, "Runtime", "B2A Docker inspect HostConfig") !== "runsc") throw new TypeError("B2A Docker inspect runtime must remain runsc")
  if (requiredString(hostConfig, "NetworkMode", "B2A Docker inspect HostConfig") !== "none") throw new TypeError("B2A Docker inspect network mode must remain none")
  if (requiredBoolean(hostConfig, "Privileged", "B2A Docker inspect HostConfig")) throw new TypeError("B2A Docker inspect requires Privileged=false")
  if (requiredInteger(hostConfig, "NanoCpus", "B2A Docker inspect HostConfig") !== created.prepared.nanoCpus || requiredInteger(hostConfig, "Memory", "B2A Docker inspect HostConfig") !== created.prepared.memoryBytes || requiredInteger(hostConfig, "MemorySwap", "B2A Docker inspect HostConfig") !== created.prepared.memorySwapBytes) throw new TypeError("B2A Docker inspect resource policy drifted")
  const restartPolicy = requiredRecord(hostConfig, "RestartPolicy", "B2A Docker inspect HostConfig")
  if (requiredString(restartPolicy, "Name", "B2A Docker inspect HostConfig.RestartPolicy") !== "no" || requiredInteger(restartPolicy, "MaximumRetryCount", "B2A Docker inspect HostConfig.RestartPolicy") !== 0) throw new TypeError("B2A Docker inspect restart policy drifted")
  requireNoUnadmittedHostAuthority(inspect, config, hostConfig)
  const networks = requiredRecord(requiredRecord(inspect, "NetworkSettings", "B2A Docker inspect"), "Networks", "B2A Docker inspect NetworkSettings")
  const networkKeys = Object.keys(networks).sort()
  if (networkKeys.some((key) => key !== "none") || networkKeys.length > 1) throw new TypeError("B2A Docker inspect has an unexpected network attachment")
  if (networkKeys.length === 1) requiredRecord(networks, "none", "B2A Docker inspect NetworkSettings.Networks")
}

function createPrepared(created: SandboxDormantCreatedAdmission, provider: DockerControlPlaneBindingProvider, host: HostTrustSnapshot): SandboxPrestartPrepared {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_PREPARED_VERSION,
    executionAttemptIdentity: created.executionAttemptIdentity,
    requirementIdentity: created.requirementIdentity,
    workloadIdentity: created.workloadIdentity,
    providerIdentity: provider.providerIdentity,
    socketEndpointIdentity: host.socketEndpointIdentity,
    createdAdmissionIdentity: created.createdAdmissionIdentity,
    containerId: created.containerId,
  })
  const prestartOutputOperationIdentity = deriveSandboxPrestartOutputOperationIdentity(base)
  const withOperation = Object.freeze({ ...base, prestartOutputOperationIdentity })
  return validateSandboxPrestartPrepared(Object.freeze({ ...withOperation, preparedIdentity: deriveSandboxPrestartPreparedIdentity(withOperation) }))
}

function createPreparedCommit(prepared: SandboxPrestartPrepared): SandboxPrestartPreparedCommit {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_PREPARED_COMMIT_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    disposition: "created" as const,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: deriveSandboxPrestartPreparedCommitIdentity(base) })
}

function createStateFence(prepared: SandboxPrestartPrepared, input: {
  state: "PREPARED" | "OWNER_CLAIMED" | "FAILED_TERMINAL"
  ownerInstanceIdentity: string | null
  ownershipClaimIdentity: string | null
  failureIdentity: string | null
}): SandboxPrestartStateFence {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_STATE_FENCE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ...input,
  })
  return validateSandboxPrestartStateFence(Object.freeze({ ...base, stateIdentity: deriveSandboxPrestartStateIdentity(base) }), prepared)
}

function createOwnerCapability(prepared: SandboxPrestartPrepared): { capability: object; ownerInstanceIdentity: string } {
  const capability = Object.freeze({})
  const secret = randomBytes(32)
  ownerCapabilities.add(capability)
  ownerSecrets.set(capability, secret)
  const ownerInstanceIdentity = createHash("sha256")
    .update(Buffer.from("KODAC-H4-R4B-B2A\0OWNER_INSTANCE\0V1\0", "ascii"))
    .update(secret)
    .update(Buffer.from(prepared.prestartOutputOperationIdentity, "ascii"))
    .digest("hex")
  return { capability, ownerInstanceIdentity }
}

function requireOwnerCapability(capability: object, ownerInstanceIdentity: string): void {
  if (!ownerCapabilities.has(capability)) throw new SandboxPrestartOwnerClaimedUnavailableError("B2A sealed owner capability is unavailable")
  const secret = ownerSecrets.get(capability)
  if (secret === undefined) throw new SandboxPrestartOwnerClaimedUnavailableError("B2A sealed owner capability secret is unavailable")
  if (!SHA256.test(ownerInstanceIdentity)) throw new SandboxPrestartOwnerClaimedUnavailableError("B2A owner identity is invalid")
}

function createOwnershipClaim(prepared: SandboxPrestartPrepared, ownerCapability: object, ownerInstanceIdentity: string): SandboxPrestartOwnershipClaim {
  requireOwnerCapability(ownerCapability, ownerInstanceIdentity)
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity,
  })
  return validateSandboxPrestartOwnershipClaim(Object.freeze({ ...base, ownershipClaimIdentity: deriveSandboxPrestartOwnershipClaimIdentity(base) }), prepared)
}

function createOwnershipClaimCommit(prepared: SandboxPrestartPrepared, claim: SandboxPrestartOwnershipClaim): SandboxPrestartOwnershipClaimCommit {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_OWNERSHIP_CLAIM_COMMIT_VERSION,
    ownershipClaimIdentity: claim.ownershipClaimIdentity,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    ownerInstanceIdentity: claim.ownerInstanceIdentity,
    disposition: "created" as const,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: deriveSandboxPrestartOwnershipClaimCommitIdentity(base) })
}

function createFailure(prepared: SandboxPrestartPrepared, ownerInstanceIdentity: string | null, failurePhase: SandboxPrestartFailurePhase, failureCode: SandboxPrestartFailureCode): SandboxPrestartFailure {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_FAILURE_VERSION,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    createdAdmissionIdentity: prepared.createdAdmissionIdentity,
    ownerInstanceIdentity,
    failurePhase,
    failureCode,
  })
  return Object.freeze({ ...base, failureIdentity: deriveSandboxPrestartFailureIdentity(base) })
}

function createFailureCommit(prepared: SandboxPrestartPrepared, failure: SandboxPrestartFailure, disposition: "created" | "existing" = "created"): SandboxPrestartFailureCommit {
  const base = Object.freeze({
    version: KDO_H4_R4B_B2A_FAILURE_COMMIT_VERSION,
    failureIdentity: failure.failureIdentity,
    preparedIdentity: prepared.preparedIdentity,
    prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    disposition,
    durability: KDO_H4_R4B_B2A_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: deriveSandboxPrestartFailureCommitIdentity(base) })
}

async function readExactState(runtime: TrustedGvisorDockerPrestartOutputRuntime, prepared: SandboxPrestartPrepared, signal?: AbortSignal): Promise<SandboxPrestartStateFence> {
  try {
    return validateSandboxPrestartStateFence(await runtime.readStateFence(prepared.prestartOutputOperationIdentity, { signal }), prepared)
  } catch (error) {
    throw new SandboxPrestartIndeterminateError(`B2A durable state is unreadable or uncertain: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function settleFailure(runtime: TrustedGvisorDockerPrestartOutputRuntime, prepared: SandboxPrestartPrepared, expectedStateFence: SandboxPrestartStateFence, claim: SandboxPrestartOwnershipClaim | null, ownerCapability: object | null, failurePhase: SandboxPrestartFailurePhase, failureCode: SandboxPrestartFailureCode): Promise<void> {
  if (claim !== null) {
    if (ownerCapability === null) throw new SandboxPrestartIndeterminateError("B2A claimed failure settlement lacks sealed owner capability")
    requireOwnerCapability(ownerCapability, claim.ownerInstanceIdentity)
  }
  const ownerInstanceIdentity = claim?.ownerInstanceIdentity ?? null
  const failure = createFailure(prepared, ownerInstanceIdentity, failurePhase, failureCode)
  const failureCommit = createFailureCommit(prepared, failure)
  const nextStateFence = createStateFence(prepared, {
    state: "FAILED_TERMINAL",
    ownerInstanceIdentity,
    ownershipClaimIdentity: claim?.ownershipClaimIdentity ?? null,
    failureIdentity: failure.failureIdentity,
  })
  try {
    const result = validateSandboxPrestartFailureTransactionResult(
      await runtime.commitFailureTransaction({ expectedStateFence, failure, failureCommit, nextStateFence }, {}),
      prepared,
      failure,
    )
    if (result.stateFence.state !== "FAILED_TERMINAL" || result.stateFence.failureIdentity !== failure.failureIdentity) throw new TypeError("B2A failure transaction did not establish the exact terminal state")
  } catch (error) {
    throw new SandboxPrestartIndeterminateError(`B2A failure settlement is indeterminate: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function exactOwnerState(state: SandboxPrestartStateFence, claim: SandboxPrestartOwnershipClaim): boolean {
  return state.state === "OWNER_CLAIMED"
    && state.ownerInstanceIdentity === claim.ownerInstanceIdentity
    && state.ownershipClaimIdentity === claim.ownershipClaimIdentity
    && state.failureIdentity === null
}

function remainingOwnerTimeMs(startedNs: bigint): number {
  const elapsedMs = Number(process.hrtime.bigint() - startedNs) / 1_000_000
  return KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs - elapsedMs
}

export function createGvisorDockerPrestartOutputRuntime(value: unknown): TrustedGvisorDockerPrestartOutputRuntime {
  if (process.platform !== "linux") throw new SandboxPrestartBlockedError("B2A prestart output runtime requires Linux")
  const record = asPlainRecord(value, "B2A runtime config")
  exactKeys(record, ["socketPath", "dockerControlPlane", "commitPreparedTransaction", "commitOwnershipClaimTransaction", "readStateFence", "commitFailureTransaction"], "B2A runtime config")
  const runtime = Object.freeze({
    version: KDO_H4_R4B_B2A_RUNTIME_VERSION,
    socketPath: canonicalSocketPath(record.socketPath),
    dockerControlPlane: record.dockerControlPlane as DockerControlPlaneBindingProvider,
    commitPreparedTransaction: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["commitPreparedTransaction"]>(record.commitPreparedTransaction, "B2A commitPreparedTransaction"),
    commitOwnershipClaimTransaction: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["commitOwnershipClaimTransaction"]>(record.commitOwnershipClaimTransaction, "B2A commitOwnershipClaimTransaction"),
    readStateFence: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["readStateFence"]>(record.readStateFence, "B2A readStateFence"),
    commitFailureTransaction: trustedCallback<GvisorDockerPrestartOutputRuntimeConfig["commitFailureTransaction"]>(record.commitFailureTransaction, "B2A commitFailureTransaction"),
  })
  trustedRuntimes.add(runtime)
  return runtime
}

function requireTrustedRuntime(value: unknown): TrustedGvisorDockerPrestartOutputRuntime {
  if (value === null || typeof value !== "object" || !trustedRuntimes.has(value as object)) throw new TypeError("B2A gateway requires a trusted prestart runtime")
  return value as TrustedGvisorDockerPrestartOutputRuntime
}

async function prepareWithRuntime(runtime: TrustedGvisorDockerPrestartOutputRuntime, createdValue: unknown, createdCommitValue: unknown, permitValue: unknown, signal?: AbortSignal): Promise<GvisorDockerPrestartOutputResult> {
  if (signal?.aborted) throw new SandboxPrestartBlockedError("B2A blocked by cancellation before preparation")
  const permit = validateSandboxAdmissionPermit(permitValue)
  const created = validateSandboxDormantCreatedAdmission(createdValue, permit)
  const createdCommit = validateSandboxDormantCreatedAdmissionCommit(createdCommitValue, created, permit)
  if (createdCommit.durability !== "durable") throw new TypeError("B2A requires a durable B1 created-admission commit")

  const gateA = snapshotHostTrust(runtime.socketPath)
  if (gateA.socketEndpointIdentity !== created.observation.socketEndpointIdentity) throw new SandboxPrestartBlockedError("B2A Docker socket differs from the exact B1 created-admission socket")
  const provider = validateDockerProvider(runtime.dockerControlPlane, permit, gateA)
  validateDormantInspect(await boundedDormantInspect(runtime.socketPath, created.containerId, signal), created, permit)
  requireSameHostTrust(snapshotHostTrust(runtime.socketPath), gateA)

  const prepared = createPrepared(created, provider, gateA)
  const preparedCommit = createPreparedCommit(prepared)
  const preparedState = createStateFence(prepared, { state: "PREPARED", ownerInstanceIdentity: null, ownershipClaimIdentity: null, failureIdentity: null })
  let preparedResult
  try {
    preparedResult = validateSandboxPrestartPreparedTransactionResult(
      await runtime.commitPreparedTransaction({ prepared, preparedCommit, stateFence: preparedState }, { signal }),
      prepared,
    )
  } catch (error) {
    throw new SandboxPrestartIndeterminateError(`B2A prepared transaction is indeterminate: ${error instanceof Error ? error.message : String(error)}`)
  }
  if (preparedResult.stateFence.state === "OWNER_CLAIMED") throw new SandboxPrestartOwnerClaimedUnavailableError("B2A operation is already owner-claimed and cannot be replayed")
  if (preparedResult.stateFence.state === "FAILED_TERMINAL") throw new SandboxPrestartTerminalError("B2A operation is already terminal")
  if (preparedResult.stateFence.state !== "PREPARED") throw new SandboxPrestartIndeterminateError("B2A prepared transaction returned an unknown state")
  if (signal?.aborted) {
    await settleFailure(runtime, prepared, preparedResult.stateFence, null, null, "prepare", "aborted")
    throw new SandboxPrestartBlockedError("B2A cancelled after durable preparation")
  }

  const owner = createOwnerCapability(prepared)
  const claim = createOwnershipClaim(prepared, owner.capability, owner.ownerInstanceIdentity)
  const claimCommit = createOwnershipClaimCommit(prepared, claim)
  const ownerState = createStateFence(prepared, {
    state: "OWNER_CLAIMED",
    ownerInstanceIdentity: claim.ownerInstanceIdentity,
    ownershipClaimIdentity: claim.ownershipClaimIdentity,
    failureIdentity: null,
  })
  let claimRaw: unknown
  try {
    claimRaw = await runtime.commitOwnershipClaimTransaction({ expectedStateFence: preparedResult.stateFence, claim, claimCommit, nextStateFence: ownerState }, { signal })
  } catch (error) {
    throw new SandboxPrestartIndeterminateError(`B2A ownership claim settlement is indeterminate: ${error instanceof Error ? error.message : String(error)}`)
  }
  const claimRecord = asPlainRecord(claimRaw, "B2A ownership claim transaction result")
  if (claimRecord.disposition === "existing") {
    const existingClaim = validateSandboxPrestartOwnershipClaim(claimRecord.claim, prepared)
    validateSandboxPrestartOwnershipClaimCommit(claimRecord.claimCommit, prepared, existingClaim)
    const existingState = validateSandboxPrestartStateFence(claimRecord.stateFence, prepared)
    if (existingState.state === "OWNER_CLAIMED") throw new SandboxPrestartOwnerClaimedUnavailableError("B2A operation is already owner-claimed; no takeover or reattach is permitted")
    throw new SandboxPrestartIndeterminateError("B2A existing claim result is not an exact OWNER_CLAIMED state")
  }
  const claimResult = validateSandboxPrestartOwnershipClaimTransactionResult(claimRaw, prepared, claim)
  if (claimResult.disposition !== "created" || !exactOwnerState(claimResult.stateFence, claim)) throw new SandboxPrestartIndeterminateError("B2A claim transaction did not establish the exact new owner")

  const controller: OwnerController = {
    runtime,
    prepared,
    claim,
    ownerCapability: owner.capability,
    initialHost: gateA,
    localState: "OWNER_CLAIMED_LOCAL",
    reader: null,
    readyHandle: null,
    absoluteDeadlineReached: false,
  }
  const ownerStartedNs = process.hrtime.bigint()
  const deadlineAbort = new AbortController()
  const absoluteTimer = setTimeout(() => {
    controller.absoluteDeadlineReached = true
    deadlineAbort.abort(new Error("B2A owner-to-ready deadline exceeded"))
    controller.reader?.invalidate()
  }, KDO_H4_R4B_B2A_RUNTIME_LIMITS.ownerToReadyTimeoutMs)
  const combinedSignal = signal === undefined ? deadlineAbort.signal : AbortSignal.any([signal, deadlineAbort.signal])
  const failOwned = async (phase: SandboxPrestartFailurePhase, code: SandboxPrestartFailureCode, cause?: unknown): Promise<never> => {
    controller.localState = "FAILED"
    controller.reader?.invalidate()
    ownerCapabilities.delete(owner.capability)
    ownerSecrets.delete(owner.capability)
    const state = await readExactState(runtime, prepared)
    if (!exactOwnerState(state, claim)) throw new SandboxPrestartIndeterminateError("B2A exact owner state was lost before failure settlement")
    await settleFailure(runtime, prepared, state, claim, owner.capability, phase, code)
    throw new SandboxPrestartBlockedError(cause instanceof Error ? cause.message : `B2A failed with ${code}`)
  }

  try {
    if (signal?.aborted) return await failOwned("owner-claim", "aborted", new Error("B2A cancelled after owner claim"))
    const durableOwnerBeforeAttach = await readExactState(runtime, prepared, combinedSignal)
    if (!exactOwnerState(durableOwnerBeforeAttach, claim)) throw new SandboxPrestartOwnerClaimedUnavailableError("B2A exact live owner state is unavailable")
    try {
      validateDormantInspect(await boundedDormantInspect(runtime.socketPath, created.containerId, combinedSignal), created, permit)
    } catch (error) {
      if (controller.absoluteDeadlineReached) return await failOwned("post-attach-revalidation", "prestart-total-timeout", error)
      if (combinedSignal.aborted) return await failOwned("post-attach-revalidation", "aborted", error)
      if (error instanceof Error && error.message.includes("timed out")) return await failOwned("post-attach-revalidation", "dormant-revalidation-timeout", error)
      return await failOwned("post-attach-revalidation", "dormant-revalidation-failed", error)
    }
    try { requireSameHostTrust(snapshotHostTrust(runtime.socketPath), gateA) }
    catch (error) { return await failOwned("attaching", "socket-identity-changed", error) }
    if (combinedSignal.aborted) return await failOwned("attaching", controller.absoluteDeadlineReached ? "prestart-total-timeout" : "aborted", new Error("B2A cancelled before ATTACHING"))
    if (controller.localState !== "OWNER_CLAIMED_LOCAL") throw new SandboxPrestartIndeterminateError("B2A local owner state changed before ATTACHING")
    controller.localState = "ATTACHING"

    let connection
    try {
      connection = await openGvisorPrestartAttach({ socketPath: runtime.socketPath, containerId: created.containerId, signal: combinedSignal })
    } catch (error) {
      if (controller.absoluteDeadlineReached) return await failOwned("attaching", "prestart-total-timeout", error)
      if (error instanceof GvisorPrestartAttachError) {
        const code: SandboxPrestartFailureCode = error.code === "attach-timeout" ? "attach-timeout" : error.code === "attach-protocol-invalid" ? "attach-protocol-invalid" : error.code === "aborted" ? "aborted" : "attach-failed"
        return await failOwned(error.code === "attach-protocol-invalid" ? "upgrade-validation" : "attaching", code, error)
      }
      return await failOwned("attaching", "attach-failed", error)
    }

    try { requireSameHostTrust(snapshotHostTrust(runtime.socketPath), gateA) }
    catch (error) { connection.socket.destroy(); return await failOwned("upgrade-validation", "socket-identity-changed", error) }
    if (connection.head.byteLength !== 0) {
      connection.socket.destroy()
      return await failOwned("reader-activation", "payload-before-start", new Error("B2A attach upgrade carried bytes before readiness"))
    }
    if (remainingOwnerTimeMs(ownerStartedNs) <= 0) {
      connection.socket.destroy()
      controller.absoluteDeadlineReached = true
      return await failOwned("reader-activation", "prestart-total-timeout", new Error("B2A owner-to-ready deadline expired before reader activation"))
    }
    try {
      controller.reader = createGvisorPrestartDormantReader({
        socket: connection.socket,
        head: connection.head,
        maxOutputBytes: permit.binding.requirement.workload.resourcePolicy.maxOutputBytes,
      })
      controller.localState = "READER_ACTIVE"
    } catch (error) {
      connection.socket.destroy()
      return await failOwned("reader-activation", "reader-failed", error)
    }

    let postAttachInspect: Record<string, unknown>
    try {
      postAttachInspect = await Promise.race([
        boundedDormantInspect(runtime.socketPath, created.containerId, combinedSignal),
        controller.reader.failure.then((error) => Promise.reject(error)),
      ])
      validateDormantInspect(postAttachInspect, created, permit)
    } catch (error) {
      if (controller.absoluteDeadlineReached) return await failOwned("post-attach-revalidation", "prestart-total-timeout", error)
      if (error instanceof GvisorPrestartReaderError) return await failOwned("reader-activation", error.code, error)
      if (combinedSignal.aborted) return await failOwned("post-attach-revalidation", "aborted", error)
      if (error instanceof Error && error.message.includes("timed out")) return await failOwned("post-attach-revalidation", "dormant-revalidation-timeout", error)
      return await failOwned("post-attach-revalidation", "dormant-revalidation-failed", error)
    }

    try { requireSameHostTrust(snapshotHostTrust(runtime.socketPath), gateA) }
    catch (error) { return await failOwned("post-attach-revalidation", "socket-identity-changed", error) }
    const durableOwnerBeforeReady = await readExactState(runtime, prepared, combinedSignal)
    if (!exactOwnerState(durableOwnerBeforeReady, claim)) throw new SandboxPrestartIndeterminateError("B2A durable owner state changed before readiness")
    if (signal?.aborted) return await failOwned("ready-invalidation", "aborted", new Error("B2A cancelled before PRESTART_READY"))
    if (controller.absoluteDeadlineReached || remainingOwnerTimeMs(ownerStartedNs) <= 0) return await failOwned("ready-invalidation", "prestart-total-timeout", new Error("B2A owner-to-ready deadline expired"))
    requireOwnerCapability(owner.capability, claim.ownerInstanceIdentity)
    if (controller.reader === null || !controller.reader.isLive() || controller.reader.readerCount !== 1 || controller.reader.acceptedPayloadBytes !== 0) return await failOwned("ready-invalidation", "reader-failed", new Error("B2A reader is not live and zero-byte before readiness"))

    controller.localState = "PRESTART_READY"
    const readiness = Object.freeze({
      version: KDO_H4_R4B_B2A_READY_VERSION,
      executionAttemptIdentity: prepared.executionAttemptIdentity,
      prestartOutputOperationIdentity: prepared.prestartOutputOperationIdentity,
      containerId: prepared.containerId,
      ownerInstanceIdentity: claim.ownerInstanceIdentity,
    })
    controller.readyHandle = readiness
    readinessControllers.set(readiness, controller)
    clearTimeout(absoluteTimer)

    void controller.reader.failure.catch(async (error) => {
      if (controller.localState !== "PRESTART_READY" || controller.readyHandle === null) return
      controller.localState = "FAILED"
      readinessControllers.delete(controller.readyHandle)
      ownerCapabilities.delete(owner.capability)
      ownerSecrets.delete(owner.capability)
      try {
        const state = await readExactState(runtime, prepared)
        if (exactOwnerState(state, claim)) await settleFailure(runtime, prepared, state, claim, owner.capability, "ready-invalidation", error.code)
      } catch {
        // Fail closed locally. Durable settlement uncertainty never becomes fabricated durable evidence.
      }
    })

    return Object.freeze({ prepared, preparedCommit: preparedResult.preparedCommit, ownershipClaim: claim, ownershipClaimCommit: claimResult.claimCommit, readiness })
  } catch (error) {
    clearTimeout(absoluteTimer)
    controller.reader?.invalidate()
    if (controller.readyHandle !== null) readinessControllers.delete(controller.readyHandle)
    if (controller.localState !== "PRESTART_READY") {
      ownerCapabilities.delete(owner.capability)
      ownerSecrets.delete(owner.capability)
    }
    throw error
  }
}

export class GvisorDockerPrestartOutputGateway {
  readonly #runtime: TrustedGvisorDockerPrestartOutputRuntime

  constructor(runtime: unknown) {
    this.#runtime = requireTrustedRuntime(runtime)
  }

  async prepare(
    createdAdmission: unknown,
    createdAdmissionCommit: unknown,
    permit: unknown,
    options: { readonly signal?: AbortSignal } = {},
  ): Promise<GvisorDockerPrestartOutputResult> {
    return await prepareWithRuntime(this.#runtime, createdAdmission, createdAdmissionCommit, permit, options.signal)
  }

  async release(readinessValue: unknown): Promise<void> {
    if (readinessValue === null || typeof readinessValue !== "object" || utilTypes.isProxy(readinessValue)) throw new TypeError("B2A readiness must be the original sealed handle")
    const controller = readinessControllers.get(readinessValue as object)
    if (controller === undefined || controller.runtime !== this.#runtime || controller.readyHandle !== readinessValue) throw new TypeError("B2A readiness handle is stale, forged, cloned, or belongs to another runtime")
    if (controller.localState !== "PRESTART_READY") throw new SandboxPrestartOwnerClaimedUnavailableError("B2A readiness is no longer live")
    requireOwnerCapability(controller.ownerCapability, controller.claim.ownerInstanceIdentity)
    controller.localState = "INVALIDATED"
    controller.reader?.invalidate()
    readinessControllers.delete(readinessValue as object)
    const state = await readExactState(this.#runtime, controller.prepared)
    if (!exactOwnerState(state, controller.claim)) throw new SandboxPrestartIndeterminateError("B2A exact owner state is unavailable during graceful release")
    await settleFailure(this.#runtime, controller.prepared, state, controller.claim, controller.ownerCapability, "ready-invalidation", "owner-lost-graceful")
    ownerCapabilities.delete(controller.ownerCapability)
    ownerSecrets.delete(controller.ownerCapability)
  }
}
