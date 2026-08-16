import { createHash } from "node:crypto"
import { lstatSync } from "node:fs"
import { request as httpRequest } from "node:http"
import { posix } from "node:path"
import { TextDecoder, types as utilTypes } from "node:util"

import {
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"
import { KDO_H4_R3D_GVISOR_RUNTIME_CLASS } from "./sandbox-observer-gvisor.ts"
import {
  createGvisorContainerBinding,
  validateGvisorContainerBindingRequest,
  type GvisorContainerBinding,
  type GvisorContainerBindingRequest,
} from "./sandbox-observer-gvisor-runtime.ts"

export const KDO_H4_R3F_CONTROL_PLANE_VERSION = "kodac-h4-r3f-docker-control-plane-v1" as const
export const KDO_H4_R3F_EVIDENCE_CLASS = "e2-docker-control-plane" as const
export const KDO_H4_R3F_BINDING_VERSION = "kodac-h4-r3f-docker-binding-v1" as const
export const KDO_H4_R3F_DOCKER_API_VERSION = "1.48" as const
export const KDO_H4_R3F_PROVIDER_ID = "docker-engine" as const
export const KDO_H4_R3F_NORMALIZATION_VERSION = "kodac-h4-r3f-normalization-v1" as const
export const KDO_H4_R3F_MOBY_SOURCE_COMMIT = "d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3" as const
export const KDO_H4_R3F_LABELS = Object.freeze({
  bindingVersion: "io.kodac.binding-version",
  requirementIdentity: "io.kodac.requirement-identity",
  workloadIdentity: "io.kodac.workload-identity",
} as const)

export const KDO_H4_R3F_LIMITS = Object.freeze({
  maxSocketPathBytes: 4096,
  maxListResponseBytes: 262_144,
  maxInspectResponseBytes: 1_048_576,
  maxResponseHeaderBytes: 16_384,
  requestTimeoutMs: 5_000,
  maxJsonDepth: 64,
  maxJsonNodes: 16_384,
  maxObjectKeys: 2_048,
  maxArrayItems: 4_096,
  maxStringBytes: 65_536,
  maxListItems: 16,
} as const)

export interface DockerSocketEndpointIdentity {
  readonly device: string
  readonly inode: string
  readonly uid: string
  readonly gid: string
  readonly mode: string
  readonly endpointIdentity: string
}

export interface DockerControlPlaneObservation {
  readonly version: typeof KDO_H4_R3F_CONTROL_PLANE_VERSION
  readonly evidenceClass: typeof KDO_H4_R3F_EVIDENCE_CLASS
  readonly providerId: typeof KDO_H4_R3F_PROVIDER_ID
  readonly providerIdentity: string
  readonly apiVersion: typeof KDO_H4_R3F_DOCKER_API_VERSION
  readonly socketEndpointIdentity: string
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerId: string
  readonly bindingIdentity: string
  readonly imageManifestDigest: string
  readonly executable: string
  readonly argsIdentity: string
  readonly runtimeName: "runsc"
  readonly networkMode: "none"
  readonly networkAttachmentCount: 0
  readonly nanoCpus: number
  readonly memoryBytes: number
  readonly memorySwapBytes: number
  readonly restartCount: 0
  readonly restartPolicy: "no"
  readonly privileged: false
  readonly controlPlaneObservationIdentity: string
}

export interface DockerControlPlaneResolution {
  readonly binding: GvisorContainerBinding
  readonly observation: DockerControlPlaneObservation
}

export interface DockerControlPlaneProviderConfig {
  readonly socketPath: string
  readonly requirement: SandboxExecutionRequirement
}

export interface DockerControlPlaneBindingProvider {
  readonly providerId: typeof KDO_H4_R3F_PROVIDER_ID
  readonly providerIdentity: string
  readonly socketEndpoint: DockerSocketEndpointIdentity
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly resolveDockerControlPlaneBinding: (
    request: GvisorContainerBindingRequest,
    options?: { readonly signal?: AbortSignal },
  ) => Promise<DockerControlPlaneResolution>
  readonly resolveContainerBinding: (
    request: GvisorContainerBindingRequest,
    options: { readonly signal?: AbortSignal },
  ) => Promise<GvisorContainerBinding>
}

const SHA256 = /^[0-9a-f]{64}$/
const SHA256_DIGEST = /^sha256:[0-9a-f]{64}$/
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/
const UTF8 = new TextDecoder("utf-8", { fatal: true })

function sha256Domain(domain: string, payload: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3F\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(payload, "utf8"))
    .digest("hex")
}

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

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function digest(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256_DIGEST.test(value)) throw new TypeError(`${label} must be sha256:<64 lowercase hex>`)
  return value
}

function fullContainerId(value: unknown, label = "containerId"): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError(`${label} must be exactly 64 lowercase hexadecimal characters`)
  return value
}

function boundedPositiveInteger(value: unknown, maximum: number, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > maximum) {
    throw new TypeError(`${label} must be a positive safe integer <= ${maximum}`)
  }
  return value
}

function canonicalUnsignedDecimal(value: unknown, label: string): string {
  if (typeof value !== "string" || !/^(?:0|[1-9][0-9]*)$/.test(value)) {
    throw new TypeError(`${label} must be canonical unsigned decimal`)
  }
  return value
}

function canonicalSocketPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || byteLength(value) > KDO_H4_R3F_LIMITS.maxSocketPathBytes) {
    throw new TypeError("socketPath must be a bounded non-empty POSIX path")
  }
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) {
    throw new TypeError("socketPath must be a canonical absolute POSIX path")
  }
  return value
}

function canonicalExecutable(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || byteLength(value) > 4096) {
    throw new TypeError("executable must be a bounded non-empty POSIX path")
  }
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) {
    throw new TypeError("executable must be a canonical absolute POSIX path")
  }
  return value
}

function entrypointArgsIdentity(args: readonly string[]): string {
  return sha256Domain("ENTRYPOINT_ARGS", JSON.stringify(args))
}

function endpointPreimage(input: Omit<DockerSocketEndpointIdentity, "endpointIdentity">): string {
  return JSON.stringify(input)
}

export function createDockerSocketEndpointIdentity(input: {
  device: string
  inode: string
  uid: string
  gid: string
  mode: string
}): DockerSocketEndpointIdentity {
  const record = asPlainRecord(input, "Docker socket endpoint input")
  exactKeys(record, ["device", "inode", "uid", "gid", "mode"], "Docker socket endpoint input")
  const base = Object.freeze({
    device: canonicalUnsignedDecimal(record.device, "socket device"),
    inode: canonicalUnsignedDecimal(record.inode, "socket inode"),
    uid: canonicalUnsignedDecimal(record.uid, "socket uid"),
    gid: canonicalUnsignedDecimal(record.gid, "socket gid"),
    mode: canonicalUnsignedDecimal(record.mode, "socket mode"),
  })
  return Object.freeze({ ...base, endpointIdentity: sha256Domain("SOCKET_ENDPOINT", endpointPreimage(base)) })
}

export function validateDockerSocketEndpointIdentity(value: unknown): DockerSocketEndpointIdentity {
  const record = asPlainRecord(value, "Docker socket endpoint")
  exactKeys(record, ["device", "inode", "uid", "gid", "mode", "endpointIdentity"], "Docker socket endpoint")
  const rebuilt = createDockerSocketEndpointIdentity({
    device: record.device as string,
    inode: record.inode as string,
    uid: record.uid as string,
    gid: record.gid as string,
    mode: record.mode as string,
  })
  if (identity(record.endpointIdentity, "socket endpointIdentity") !== rebuilt.endpointIdentity) {
    throw new TypeError("Docker socket endpoint identity mismatch")
  }
  return rebuilt
}

function snapshotSocketEndpoint(socketPath: string): DockerSocketEndpointIdentity {
  const stats = lstatSync(socketPath, { bigint: true })
  if (!stats.isSocket()) throw new TypeError("Docker endpoint must be a real Unix socket")
  return createDockerSocketEndpointIdentity({
    device: stats.dev.toString(10),
    inode: stats.ino.toString(10),
    uid: stats.uid.toString(10),
    gid: stats.gid.toString(10),
    mode: stats.mode.toString(10),
  })
}

function requireSameSocketEndpoint(socketPath: string, expected: DockerSocketEndpointIdentity): void {
  const current = snapshotSocketEndpoint(socketPath)
  if (current.endpointIdentity !== expected.endpointIdentity) throw new Error("Docker Unix socket endpoint identity changed")
}

export function validateDockerControlPlaneProviderConfig(value: unknown): DockerControlPlaneProviderConfig {
  const record = asPlainRecord(value, "Docker control-plane provider config")
  exactKeys(record, ["socketPath", "requirement"], "Docker control-plane provider config")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  if (requirement.requiredSemanticRuntimeClass !== KDO_H4_R3D_GVISOR_RUNTIME_CLASS) {
    throw new TypeError("R3F requires requiredSemanticRuntimeClass=gvisor")
  }
  return Object.freeze({ socketPath: canonicalSocketPath(record.socketPath), requirement })
}

function providerIdentity(input: {
  socketEndpointIdentity: string
  socketPath: string
  requirementIdentity: string
  workloadIdentity: string
}): string {
  return sha256Domain("PROVIDER", JSON.stringify({
    contractVersion: KDO_H4_R3F_CONTROL_PLANE_VERSION,
    apiVersion: KDO_H4_R3F_DOCKER_API_VERSION,
    bindingVersion: KDO_H4_R3F_BINDING_VERSION,
    labels: KDO_H4_R3F_LABELS,
    normalizationVersion: KDO_H4_R3F_NORMALIZATION_VERSION,
    mobySourceCommit: KDO_H4_R3F_MOBY_SOURCE_COMMIT,
    socketEndpointIdentity: identity(input.socketEndpointIdentity, "provider socketEndpointIdentity"),
    socketPath: canonicalSocketPath(input.socketPath),
    requirementIdentity: identity(input.requirementIdentity, "provider requirementIdentity"),
    workloadIdentity: identity(input.workloadIdentity, "provider workloadIdentity"),
  }))
}

function observationPreimage(input: Omit<DockerControlPlaneObservation, "controlPlaneObservationIdentity">): string {
  return JSON.stringify(input)
}

export function createDockerControlPlaneObservation(input: {
  providerIdentity: string
  socketEndpointIdentity: string
  executionAttemptIdentity: string
  requirementIdentity: string
  workloadIdentity: string
  containerId: string
  bindingIdentity: string
  imageManifestDigest: string
  executable: string
  argsIdentity: string
  nanoCpus: number
  memoryBytes: number
  memorySwapBytes: number
}): DockerControlPlaneObservation {
  const record = asPlainRecord(input, "Docker control-plane observation input")
  exactKeys(record, [
    "providerIdentity", "socketEndpointIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity",
    "containerId", "bindingIdentity", "imageManifestDigest", "executable", "argsIdentity", "nanoCpus", "memoryBytes", "memorySwapBytes",
  ], "Docker control-plane observation input")
  const memoryBytes = boundedPositiveInteger(record.memoryBytes, 1_099_511_627_776, "memoryBytes")
  const memorySwapBytes = boundedPositiveInteger(record.memorySwapBytes, 1_099_511_627_776, "memorySwapBytes")
  if (memorySwapBytes !== memoryBytes) throw new TypeError("memorySwapBytes must equal memoryBytes")
  const nanoCpus = boundedPositiveInteger(record.nanoCpus, 256_000_000_000, "nanoCpus")
  if (nanoCpus % 1_000_000 !== 0) throw new TypeError("nanoCpus must be an exact milliCPU translation")
  const base = Object.freeze({
    version: KDO_H4_R3F_CONTROL_PLANE_VERSION,
    evidenceClass: KDO_H4_R3F_EVIDENCE_CLASS,
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: identity(record.providerIdentity, "providerIdentity"),
    apiVersion: KDO_H4_R3F_DOCKER_API_VERSION,
    socketEndpointIdentity: identity(record.socketEndpointIdentity, "socketEndpointIdentity"),
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(record.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(record.workloadIdentity, "workloadIdentity"),
    containerId: fullContainerId(record.containerId),
    bindingIdentity: identity(record.bindingIdentity, "bindingIdentity"),
    imageManifestDigest: digest(record.imageManifestDigest, "imageManifestDigest"),
    executable: canonicalExecutable(record.executable),
    argsIdentity: identity(record.argsIdentity, "argsIdentity"),
    runtimeName: "runsc" as const,
    networkMode: "none" as const,
    networkAttachmentCount: 0 as const,
    nanoCpus,
    memoryBytes,
    memorySwapBytes,
    restartCount: 0 as const,
    restartPolicy: "no" as const,
    privileged: false as const,
  })
  return Object.freeze({
    ...base,
    controlPlaneObservationIdentity: sha256Domain("CONTROL_PLANE_OBSERVATION", observationPreimage(base)),
  })
}

export function validateDockerControlPlaneObservation(value: unknown): DockerControlPlaneObservation {
  const record = asPlainRecord(value, "Docker control-plane observation")
  exactKeys(record, [
    "version", "evidenceClass", "providerId", "providerIdentity", "apiVersion", "socketEndpointIdentity",
    "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerId", "bindingIdentity",
    "imageManifestDigest", "executable", "argsIdentity", "runtimeName", "networkMode", "networkAttachmentCount", "nanoCpus", "memoryBytes", "memorySwapBytes",
    "restartCount", "restartPolicy", "privileged", "controlPlaneObservationIdentity",
  ], "Docker control-plane observation")
  if (record.version !== KDO_H4_R3F_CONTROL_PLANE_VERSION) throw new TypeError("Docker control-plane observation version mismatch")
  if (record.evidenceClass !== KDO_H4_R3F_EVIDENCE_CLASS) throw new TypeError("Docker control-plane evidence class mismatch")
  if (record.providerId !== KDO_H4_R3F_PROVIDER_ID) throw new TypeError("Docker provider ID mismatch")
  if (record.apiVersion !== KDO_H4_R3F_DOCKER_API_VERSION) throw new TypeError("Docker API version mismatch")
  if (record.runtimeName !== "runsc" || record.networkMode !== "none") throw new TypeError("Docker control-plane runtime/network mismatch")
  if (record.networkAttachmentCount !== 0) throw new TypeError("Docker control-plane network attachment count must be zero")
  if (record.restartCount !== 0 || record.restartPolicy !== "no" || record.privileged !== false) {
    throw new TypeError("Docker control-plane restart/privileged posture mismatch")
  }
  const rebuilt = createDockerControlPlaneObservation({
    providerIdentity: record.providerIdentity as string,
    socketEndpointIdentity: record.socketEndpointIdentity as string,
    executionAttemptIdentity: record.executionAttemptIdentity as string,
    requirementIdentity: record.requirementIdentity as string,
    workloadIdentity: record.workloadIdentity as string,
    containerId: record.containerId as string,
    bindingIdentity: record.bindingIdentity as string,
    imageManifestDigest: record.imageManifestDigest as string,
    executable: record.executable as string,
    argsIdentity: record.argsIdentity as string,
    nanoCpus: record.nanoCpus as number,
    memoryBytes: record.memoryBytes as number,
    memorySwapBytes: record.memorySwapBytes as number,
  })
  if (identity(record.controlPlaneObservationIdentity, "controlPlaneObservationIdentity") !== rebuilt.controlPlaneObservationIdentity) {
    throw new TypeError("Docker control-plane observation identity mismatch")
  }
  return rebuilt
}

function validateJsonSyntaxNoDuplicateKeys(text: string, label: string): void {
  let index = 0
  const length = text.length
  const isWhitespace = (char: string) => char === " " || char === "\t" || char === "\r" || char === "\n"
  const skipWhitespace = () => { while (index < length && isWhitespace(text[index] ?? "")) index += 1 }
  const numberPattern = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y

  const parseStringToken = (): string => {
    if (text[index] !== '"') throw new TypeError(`${label} contains invalid JSON string syntax`)
    const start = index
    index += 1
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
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) throw new TypeError(`${label} contains an invalid JSON unicode escape`)
          index += 4
        } else if (!'"\\/bfnrt'.includes(text[index] ?? "")) {
          throw new TypeError(`${label} contains an invalid JSON escape`)
        }
      } else if (char.charCodeAt(0) < 0x20) {
        throw new TypeError(`${label} contains an unescaped JSON control character`)
      }
      index += 1
    }
    throw new TypeError(`${label} contains an unterminated JSON string`)
  }

  const parseValue = (depth: number): void => {
    if (depth > KDO_H4_R3F_LIMITS.maxJsonDepth) throw new TypeError(`${label} exceeds JSON nesting depth`)
    skipWhitespace()
    const char = text[index]
    if (char === "{") {
      index += 1
      skipWhitespace()
      const keys = new Set<string>()
      if (text[index] === "}") { index += 1; return }
      for (;;) {
        skipWhitespace()
        const key = parseStringToken()
        if (keys.has(key)) throw new TypeError(`${label} contains duplicate JSON object key: ${key}`)
        keys.add(key)
        skipWhitespace()
        if (text[index] !== ":") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1
        parseValue(depth + 1)
        skipWhitespace()
        if (text[index] === "}") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1
      }
    }
    if (char === "[") {
      index += 1
      skipWhitespace()
      if (text[index] === "]") { index += 1; return }
      for (;;) {
        parseValue(depth + 1)
        skipWhitespace()
        if (text[index] === "]") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON array syntax`)
        index += 1
      }
    }
    if (char === '"') { parseStringToken(); return }
    numberPattern.lastIndex = index
    const number = numberPattern.exec(text)
    if (number !== null) { index = numberPattern.lastIndex; return }
    for (const literal of ["true", "false", "null"] as const) {
      if (text.startsWith(literal, index)) { index += literal.length; return }
    }
    throw new TypeError(`${label} contains invalid JSON value syntax`)
  }

  parseValue(0)
  skipWhitespace()
  if (index !== length) throw new TypeError(`${label} contains trailing JSON content`)
}

function validateBoundedJson(value: unknown, label: string): void {
  let nodes = 0
  const visit = (current: unknown, depth: number): void => {
    nodes += 1
    if (nodes > KDO_H4_R3F_LIMITS.maxJsonNodes) throw new TypeError(`${label} exceeds JSON node bound`)
    if (depth > KDO_H4_R3F_LIMITS.maxJsonDepth) throw new TypeError(`${label} exceeds JSON depth bound`)
    if (current === null || typeof current === "boolean") return
    if (typeof current === "number") {
      if (!Number.isFinite(current)) throw new TypeError(`${label} contains a non-finite number`)
      return
    }
    if (typeof current === "string") {
      if (byteLength(current) > KDO_H4_R3F_LIMITS.maxStringBytes) throw new TypeError(`${label} contains an oversized string`)
      return
    }
    if (Array.isArray(current)) {
      if (current.length > KDO_H4_R3F_LIMITS.maxArrayItems) throw new TypeError(`${label} contains an oversized array`)
      for (const item of current) visit(item, depth + 1)
      return
    }
    const record = asPlainRecord(current, label)
    const keys = Object.keys(record)
    if (keys.length > KDO_H4_R3F_LIMITS.maxObjectKeys) throw new TypeError(`${label} contains too many object keys`)
    for (const key of keys) {
      if (byteLength(key) > KDO_H4_R3F_LIMITS.maxStringBytes) throw new TypeError(`${label} contains an oversized object key`)
      visit(record[key], depth + 1)
    }
  }
  visit(value, 0)
}

function parseDockerJson(buffer: Buffer, label: string): unknown {
  let text: string
  try { text = UTF8.decode(buffer) } catch { throw new TypeError(`${label} is not valid UTF-8`) }
  validateJsonSyntaxNoDuplicateKeys(text, label)
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new TypeError(`${label} is not valid JSON`) }
  validateBoundedJson(parsed, label)
  return parsed
}

function canonicalListPath(request: GvisorContainerBindingRequest): string {
  const filters = JSON.stringify({
    label: [
      `${KDO_H4_R3F_LABELS.bindingVersion}=${KDO_H4_R3F_BINDING_VERSION}`,
      `${KDO_H4_R3F_LABELS.requirementIdentity}=${request.requirementIdentity}`,
      `${KDO_H4_R3F_LABELS.workloadIdentity}=${request.workloadIdentity}`,
    ],
    status: ["running"],
  })
  return `/v${KDO_H4_R3F_DOCKER_API_VERSION}/containers/json?all=1&filters=${encodeURIComponent(filters)}`
}

function exactInspectPath(containerId: string): string {
  return `/v${KDO_H4_R3F_DOCKER_API_VERSION}/containers/${fullContainerId(containerId)}/json?size=0`
}

async function boundedDockerGet(input: {
  socketPath: string
  socketEndpoint: DockerSocketEndpointIdentity
  path: string
  maxBodyBytes: number
  signal?: AbortSignal
}): Promise<Buffer> {
  if (input.signal?.aborted) throw new Error("Docker R3F request aborted")
  requireSameSocketEndpoint(input.socketPath, input.socketEndpoint)
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      let settled = false
      const finishReject = (error: unknown) => {
        if (settled) return
        settled = true
        cleanup()
        reject(error instanceof Error ? error : new Error(String(error)))
      }
      const finishResolve = (value: Buffer) => {
        if (settled) return
        settled = true
        cleanup()
        resolve(value)
      }
      const onAbort = () => {
        const error = new Error("Docker R3F request aborted")
        finishReject(error)
        request.destroy(error)
      }
      const cleanup = () => input.signal?.removeEventListener("abort", onAbort)
      const request = httpRequest({
        method: "GET",
        socketPath: input.socketPath,
        path: input.path,
        agent: false,
        maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
        headers: Object.freeze({ Accept: "application/json", Connection: "close" }),
      }, (response) => {
        const rawHeaderBytes = response.rawHeaders.reduce((total, item) => total + byteLength(item) + 2, 0)
        if (rawHeaderBytes > KDO_H4_R3F_LIMITS.maxResponseHeaderBytes) {
          const error = new Error("Docker R3F response headers exceed bound")
          finishReject(error)
          response.destroy(error)
          return
        }
        if (response.statusCode !== 200) {
          const error = new Error(`Docker R3F request failed with HTTP ${String(response.statusCode ?? "unknown")}`)
          finishReject(error)
          response.destroy(error)
          return
        }
        const chunks: Buffer[] = []
        let bytes = 0
        response.on("data", (chunk: Buffer | string) => {
          const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          bytes += part.byteLength
          if (bytes > input.maxBodyBytes) {
            const error = new Error("Docker R3F response body exceeds bound")
            finishReject(error)
            response.destroy(error)
            return
          }
          chunks.push(part)
        })
        response.on("end", () => finishResolve(Buffer.concat(chunks, bytes)))
        response.on("aborted", () => finishReject(new Error("Docker R3F response aborted")))
        response.on("error", finishReject)
      })
      request.on("error", finishReject)
      request.setTimeout(KDO_H4_R3F_LIMITS.requestTimeoutMs, () => {
        const error = new Error("Docker R3F request timed out")
        finishReject(error)
        request.destroy(error)
      })
      input.signal?.addEventListener("abort", onAbort, { once: true })
      if (input.signal?.aborted) { onAbort(); return }
      request.end()
    })
  } finally {
    requireSameSocketEndpoint(input.socketPath, input.socketEndpoint)
  }
}

function parseContainerList(value: unknown): string {
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError("Docker container list must be a plain array")
  }
  if (value.length > KDO_H4_R3F_LIMITS.maxListItems) throw new TypeError("Docker container list exceeds R3F item bound")
  if (value.length !== 1) throw new TypeError(`Docker R3F requires exactly one running candidate; received ${value.length}`)
  const candidate = asPlainRecord(value[0], "Docker container list candidate")
  const containerId = fullContainerId(candidate.Id, "Docker list candidate Id")
  if (candidate.State !== "running") throw new TypeError("Docker list candidate must report State=running")
  return containerId
}

function requiredRecord(record: Record<string, unknown>, key: string, label: string): Record<string, unknown> {
  return asPlainRecord(record[key], `${label}.${key}`)
}

function requiredBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  if (typeof record[key] !== "boolean") throw new TypeError(`${label}.${key} must be boolean`)
  return record[key]
}

function requiredSafeInteger(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key]
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new TypeError(`${label}.${key} must be a safe integer`)
  return value
}

function requiredString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key]
  if (typeof value !== "string") throw new TypeError(`${label}.${key} must be a string`)
  return value
}

function requiredStringArray(record: Record<string, unknown>, key: string, label: string): readonly string[] {
  const value = record[key]
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label}.${key} must be a plain array`)
  }
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label}.${key} must not contain symbol fields`)
  const output = value.map((entry, index) => {
    if (typeof entry !== "string") throw new TypeError(`${label}.${key}[${index}] must be a string`)
    return entry
  })
  return Object.freeze(output)
}

function validateInspect(input: {
  value: unknown
  containerId: string
  request: GvisorContainerBindingRequest
  requirement: SandboxExecutionRequirement
}): {
  imageManifestDigest: string
  executable: string
  argsIdentity: string
  nanoCpus: number
  memoryBytes: number
  memorySwapBytes: number
} {
  const inspect = asPlainRecord(input.value, "Docker inspect response")
  if (fullContainerId(inspect.Id, "Docker inspect Id") !== input.containerId) throw new TypeError("Docker inspect ID does not match selected container")

  const executable = requiredString(inspect, "Path", "Docker inspect")
  if (executable !== input.requirement.workload.entrypoint.executable) throw new TypeError("Docker effective executable does not match the R3A workload entrypoint")
  const args = requiredStringArray(inspect, "Args", "Docker inspect")
  const expectedArgs = input.requirement.workload.entrypoint.args
  if (args.length !== expectedArgs.length || args.some((arg, index) => arg !== expectedArgs[index])) {
    throw new TypeError("Docker effective args do not match the R3A workload entrypoint")
  }
  const argsIdentity = entrypointArgsIdentity(args)

  const state = requiredRecord(inspect, "State", "Docker inspect")
  if (!requiredBoolean(state, "Running", "Docker inspect State")) throw new TypeError("Docker container must be running")
  if (requiredBoolean(state, "Paused", "Docker inspect State")) throw new TypeError("Docker container must not be paused")
  if (requiredBoolean(state, "Restarting", "Docker inspect State")) throw new TypeError("Docker container must not be restarting")
  if (requiredBoolean(state, "Dead", "Docker inspect State")) throw new TypeError("Docker container must not be dead")

  if (requiredSafeInteger(inspect, "RestartCount", "Docker inspect") !== 0) throw new TypeError("Docker container must be first-life with RestartCount=0")

  const config = requiredRecord(inspect, "Config", "Docker inspect")
  const labels = requiredRecord(config, "Labels", "Docker inspect Config")
  if (labels[KDO_H4_R3F_LABELS.bindingVersion] !== KDO_H4_R3F_BINDING_VERSION) throw new TypeError("Docker binding-version label mismatch")
  if (labels[KDO_H4_R3F_LABELS.requirementIdentity] !== input.request.requirementIdentity) throw new TypeError("Docker requirement-identity label mismatch")
  if (labels[KDO_H4_R3F_LABELS.workloadIdentity] !== input.request.workloadIdentity) throw new TypeError("Docker workload-identity label mismatch")

  const descriptor = requiredRecord(inspect, "ImageManifestDescriptor", "Docker inspect")
  const imageManifestDigest = digest(descriptor.digest, "Docker ImageManifestDescriptor.digest")
  if (imageManifestDigest !== input.requirement.workload.source.digest) throw new TypeError("Docker image manifest digest does not match the R3A workload source digest")

  const hostConfig = requiredRecord(inspect, "HostConfig", "Docker inspect")
  if (requiredString(hostConfig, "Runtime", "Docker inspect HostConfig") !== "runsc") throw new TypeError("Docker HostConfig.Runtime must be runsc")
  if (requiredString(hostConfig, "NetworkMode", "Docker inspect HostConfig") !== "none") throw new TypeError("Docker HostConfig.NetworkMode must be none")
  if (requiredBoolean(hostConfig, "Privileged", "Docker inspect HostConfig")) throw new TypeError("Docker privileged containers are forbidden")

  const networkSettings = requiredRecord(inspect, "NetworkSettings", "Docker inspect")
  const networks = requiredRecord(networkSettings, "Networks", "Docker inspect NetworkSettings")
  if (Object.keys(networks).length !== 0) throw new TypeError("Docker NetworkSettings.Networks must contain zero live network attachments")

  const expectedNanoCpus = input.requirement.workload.resourcePolicy.cpuMillis * 1_000_000
  const nanoCpus = requiredSafeInteger(hostConfig, "NanoCpus", "Docker inspect HostConfig")
  if (nanoCpus !== expectedNanoCpus) throw new TypeError("Docker NanoCpus does not match the R3A cpuMillis policy")

  const expectedMemoryBytes = input.requirement.workload.resourcePolicy.memoryBytes
  const memoryBytes = requiredSafeInteger(hostConfig, "Memory", "Docker inspect HostConfig")
  const memorySwapBytes = requiredSafeInteger(hostConfig, "MemorySwap", "Docker inspect HostConfig")
  if (memoryBytes !== expectedMemoryBytes) throw new TypeError("Docker Memory does not match the R3A memoryBytes policy")
  if (memorySwapBytes !== expectedMemoryBytes) throw new TypeError("Docker MemorySwap must equal the R3A memoryBytes policy")

  const restartPolicy = requiredRecord(hostConfig, "RestartPolicy", "Docker inspect HostConfig")
  if (requiredString(restartPolicy, "Name", "Docker inspect HostConfig.RestartPolicy") !== "no") {
    throw new TypeError("Docker RestartPolicy.Name must be no")
  }

  return Object.freeze({ imageManifestDigest, executable, argsIdentity, nanoCpus, memoryBytes, memorySwapBytes })
}

export function createDockerControlPlaneBindingProvider(value: unknown): DockerControlPlaneBindingProvider {
  const config = validateDockerControlPlaneProviderConfig(value)
  if (process.platform !== "linux") throw new Error("R3F Docker control-plane provider requires Linux")
  const socketEndpoint = snapshotSocketEndpoint(config.socketPath)
  const fixedProviderIdentity = providerIdentity({
    socketEndpointIdentity: socketEndpoint.endpointIdentity,
    socketPath: config.socketPath,
    requirementIdentity: config.requirement.requirementIdentity,
    workloadIdentity: config.requirement.workload.workloadIdentity,
  })

  const resolveDockerControlPlaneBinding = async (
    requestValue: GvisorContainerBindingRequest,
    options: { readonly signal?: AbortSignal } = {},
  ): Promise<DockerControlPlaneResolution> => {
    const request = validateGvisorContainerBindingRequest(requestValue)
    if (request.requirementIdentity !== config.requirement.requirementIdentity) throw new TypeError("R3F request requirement identity does not match configured requirement")
    if (request.workloadIdentity !== config.requirement.workload.workloadIdentity) throw new TypeError("R3F request workload identity does not match configured requirement")
    if (options.signal?.aborted) throw new Error("Docker R3F request aborted")

    const listBody = await boundedDockerGet({
      socketPath: config.socketPath,
      socketEndpoint,
      path: canonicalListPath(request),
      maxBodyBytes: KDO_H4_R3F_LIMITS.maxListResponseBytes,
      signal: options.signal,
    })
    const containerId = parseContainerList(parseDockerJson(listBody, "Docker container list response"))

    const inspectBody = await boundedDockerGet({
      socketPath: config.socketPath,
      socketEndpoint,
      path: exactInspectPath(containerId),
      maxBodyBytes: KDO_H4_R3F_LIMITS.maxInspectResponseBytes,
      signal: options.signal,
    })
    const observed = validateInspect({
      value: parseDockerJson(inspectBody, "Docker inspect response"),
      containerId,
      request,
      requirement: config.requirement,
    })

    const binding = createGvisorContainerBinding({
      providerId: KDO_H4_R3F_PROVIDER_ID,
      executionAttemptIdentity: request.executionAttemptIdentity,
      requirementIdentity: request.requirementIdentity,
      workloadIdentity: request.workloadIdentity,
      containerId,
    })
    const observation = createDockerControlPlaneObservation({
      providerIdentity: fixedProviderIdentity,
      socketEndpointIdentity: socketEndpoint.endpointIdentity,
      executionAttemptIdentity: request.executionAttemptIdentity,
      requirementIdentity: request.requirementIdentity,
      workloadIdentity: request.workloadIdentity,
      containerId,
      bindingIdentity: binding.bindingIdentity,
      imageManifestDigest: observed.imageManifestDigest,
      executable: observed.executable,
      argsIdentity: observed.argsIdentity,
      nanoCpus: observed.nanoCpus,
      memoryBytes: observed.memoryBytes,
      memorySwapBytes: observed.memorySwapBytes,
    })
    return Object.freeze({ binding, observation })
  }

  const resolveContainerBinding = async (
    request: GvisorContainerBindingRequest,
    options: { readonly signal?: AbortSignal },
  ): Promise<GvisorContainerBinding> => (await resolveDockerControlPlaneBinding(request, options)).binding

  return Object.freeze({
    providerId: KDO_H4_R3F_PROVIDER_ID,
    providerIdentity: fixedProviderIdentity,
    socketEndpoint,
    requirementIdentity: config.requirement.requirementIdentity,
    workloadIdentity: config.requirement.workload.workloadIdentity,
    resolveDockerControlPlaneBinding,
    resolveContainerBinding,
  })
}

export function createDockerContainerBindingResolver(value: unknown): DockerControlPlaneBindingProvider["resolveContainerBinding"] {
  return createDockerControlPlaneBindingProvider(value).resolveContainerBinding
}
