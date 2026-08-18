import { createHash } from "node:crypto"
import { lstatSync } from "node:fs"
import { request as httpRequest } from "node:http"
import type { Socket } from "node:net"
import { posix } from "node:path"
import { TextDecoder, types as utilTypes } from "node:util"

import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { createReceipt, type ExecutionReceipt } from "../evidence/receipt.ts"
import { validateSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../trust/sandbox-backend-evidence.ts"
import {
  KDO_H4_R3F_DOCKER_API_VERSION,
  KDO_H4_R3F_LIMITS,
  KDO_H4_R3F_PROVIDER_ID,
  createDockerSocketEndpointIdentity,
  observeDockerSourceControlPlaneForBindingResolver,
  type DockerControlPlaneBindingProvider,
  type DockerSocketEndpointIdentity,
} from "../trust/sandbox-observer-docker-control-plane.ts"
import {
  createGvisorContainerBindingRequest,
  validateGvisorContainerBinding,
  validateGvisorContainerBindingRequest,
  type GvisorContainerBinding,
  type GvisorContainerBindingRequest,
} from "../trust/sandbox-observer-gvisor-runtime.ts"
import {
  GvisorDockerMultiplexAccumulator,
  GvisorOutputLimitExceededError,
  KDO_H4_R3G_E_CAPABILITY,
  KDO_H4_R3G_E_DOCKER_API_VERSION,
  createGvisorOutputBoundRecord,
  createGvisorOutputChannelIdentity,
  createGvisorOutputOperationIdentity,
  validateGvisorOutputBoundCommit,
  type GvisorOutputAggregationResult,
  type GvisorOutputBoundCommit,
  type GvisorOutputBoundRecord,
} from "../trust/sandbox-output-gvisor.ts"
import {
  payloadDigest as ttlPayloadDigest,
  validateGvisorTtlArmRecord,
  validateGvisorTtlEvidenceCommit,
  validateGvisorTtlRuntimeConfig,
  validateGvisorTtlSubjectBinding,
  validateGvisorTtlTerminalRecord,
  type GvisorTtlArmRecord,
  type GvisorTtlRuntimeConfig,
  type GvisorTtlSubjectBinding,
  type GvisorTtlTerminalRecord,
} from "../trust/sandbox-lifecycle-gvisor-ttl.ts"
import type { ExecutionIntent, PolicyEngine, PolicyResult } from "../trust/policy.ts"
import {
  validateGvisorTtlRecoveryRuntimeConfig,
  type GvisorTtlRecoveryRuntimeConfig,
} from "./gateway-gvisor-ttl-recovery-runtime.ts"
import { GvisorTtlExecutionGateway, type GvisorTtlEnforcementResult } from "./gateway-gvisor-ttl-runtime.ts"
import {
  ExecutionBlockedError,
  ExecutionFailedError,
  ExecutionGateway,
  type ExecutionObserver,
} from "./gateway.ts"

export const KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION = "kodac-h4-r3g-e-docker-output-transport-v1" as const
export const KDO_H4_R3G_E_ATTACH_MEDIA_TYPE = "application/vnd.docker.multiplexed-stream" as const
export const KDO_H4_R3G_E_ATTACH_PATH_SUFFIX = "attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1" as const
export const KDO_H4_R3G_E_RUNTIME_VERSION = "kodac-h4-r3g-e-output-runtime-v1" as const
export const KDO_H4_R3G_E_PREPARED_VERSION = "kodac-h4-r3g-e-output-prepared-v1" as const
export const KDO_H4_R3G_E_RESERVATION_VERSION = "kodac-h4-r3g-e-output-reservation-v1" as const
export const KDO_H4_R3G_E_FAILURE_VERSION = "kodac-h4-r3g-e-output-failure-v1" as const
export const KDO_H4_R3G_E_FAILURE_COMMIT_VERSION = "kodac-h4-r3g-e-output-failure-commit-v1" as const
export const KDO_H4_R3G_E_RUNTIME_LIMITS = Object.freeze({
  outputInactivityTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
  outputAbsoluteSlackMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
} as const)

export interface GvisorDockerOutputCapture {
  readonly version: typeof KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION
  readonly binding: GvisorContainerBinding
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly providerIdentity: string
  readonly socketEndpointIdentity: string
  readonly outputChannelIdentity: string
  readonly mediaType: typeof KDO_H4_R3G_E_ATTACH_MEDIA_TYPE
  readonly aggregation: GvisorOutputAggregationResult
}

export interface GvisorDockerOutputTransport {
  readonly provider: DockerControlPlaneBindingProvider
  readonly captureOutput: (
    request: GvisorContainerBindingRequest,
    options?: { readonly signal?: AbortSignal; readonly expectedBinding?: GvisorContainerBinding },
  ) => Promise<GvisorDockerOutputCapture>
}

export interface GvisorDockerOutputTransportConfig {
  readonly provider: DockerControlPlaneBindingProvider
  readonly socketPath: string
  readonly requirement: SandboxExecutionRequirement
}

export interface GvisorOutputPreparedOperation {
  readonly version: typeof KDO_H4_R3G_E_PREPARED_VERSION
  readonly executionAttemptIdentity: string
  readonly requirementIdentity: string
  readonly workloadIdentity: string
  readonly containerBindingIdentity: string
  readonly containerId: string
  readonly runtimeInstanceIdentity: string
  readonly providerIdentity: string
  readonly socketEndpointIdentity: string
  readonly outputChannelIdentity: string
  readonly outputOperationIdentity: string
  readonly armRecordIdentity: string
  readonly maxOutputBytes: number
  readonly preparedIdentity: string
}

export interface GvisorOutputReservation {
  readonly version: typeof KDO_H4_R3G_E_RESERVATION_VERSION
  readonly disposition: "created" | "exists"
  readonly executionAttemptIdentity: string
  readonly outputOperationIdentity: string
  readonly preparedIdentity: string
  readonly reservationIdentity: string
}

export type GvisorOutputFailureReason =
  | "output-limit-exceeded"
  | "capture-failed"
  | "lifecycle-failed"
  | "aborted"
  | "indeterminate"

export interface GvisorOutputFailureRecord {
  readonly version: typeof KDO_H4_R3G_E_FAILURE_VERSION
  readonly executionAttemptIdentity: string
  readonly outputOperationIdentity: string
  readonly preparedIdentity: string
  readonly reason: GvisorOutputFailureReason
  readonly errorDigest: string
  readonly failureIdentity: string
}

export interface GvisorOutputFailureCommit {
  readonly version: typeof KDO_H4_R3G_E_FAILURE_COMMIT_VERSION
  readonly executionAttemptIdentity: string
  readonly outputOperationIdentity: string
  readonly failureIdentity: string
  readonly commitIdentity: string
}

export interface GvisorOutputRuntimeConfig {
  readonly version: typeof KDO_H4_R3G_E_RUNTIME_VERSION
  /** Trusted persistence primitive: atomically create-once by executionAttemptIdentity. */
  readonly reserveOutputOperation: (prepared: GvisorOutputPreparedOperation) => Promise<unknown> | unknown
  /**
   * Trusted positive-evidence durable boundary. If options.signal aborts before
   * durable completion, the callback MUST reject and MUST NOT persist the
   * positive record. Once started, K2 waits for authoritative settlement.
   */
  readonly commitOutputEvidence: (
    record: GvisorOutputBoundRecord,
    options: { readonly signal?: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitFailureEvidence: (failure: GvisorOutputFailureRecord) => Promise<unknown> | unknown
}

export interface GvisorOutputExecutionGatewayConfig {
  readonly filesystem: WorkspaceFileSystem
  readonly policy: PolicyEngine
  /** Pre-existing canonical R3F provider supplied by the trusted K2 composition root. */
  readonly dockerControlPlane: DockerControlPlaneBindingProvider
  /** Trusted composition-time path; execution callers cannot provide or replace it. */
  readonly dockerSocketPath: string
  readonly outputRuntime: GvisorOutputRuntimeConfig
  readonly ttlRuntime: GvisorTtlRuntimeConfig
  readonly recoveryRuntime: GvisorTtlRecoveryRuntimeConfig
}

export interface GvisorOutputEnforcementResult {
  readonly subject: GvisorTtlSubjectBinding
  readonly arm: GvisorTtlArmRecord
  readonly terminal: GvisorTtlTerminalRecord
  readonly capture: GvisorDockerOutputCapture
  readonly prepared: GvisorOutputPreparedOperation
  readonly reservation: GvisorOutputReservation
  readonly record: GvisorOutputBoundRecord
  readonly commit: GvisorOutputBoundCommit
}

const UTF8 = new TextDecoder("utf-8", { fatal: true })
const MAX_INSPECT_BYTES = KDO_H4_R3F_LIMITS.maxInspectResponseBytes
const MAX_JSON_DEPTH = KDO_H4_R3F_LIMITS.maxJsonDepth
const SHA256 = /^[0-9a-f]{64}$/
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/

function domainHash(domain: string, parts: readonly (string | number)[]): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-E\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(parts), "utf8"))
    .digest("hex")
}
function byteLength(value: string): number { return Buffer.byteLength(value, "utf8") }
function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy plain object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor) || !descriptor.enumerable || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be an enumerable defined data property`)
  }
  return value as Record<string, unknown>
}
function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort(); const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
}
function identity(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}
function containerId(value: unknown): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError("containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}
function boundedPositiveInteger(value: unknown, maximum: number, label: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > maximum) throw new TypeError(`${label} must be a positive safe integer <= ${maximum}`)
  return value
}
function requiredBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key]
  if (typeof value !== "boolean") throw new TypeError(`${label}.${key} must be boolean`)
  return value
}
function validatePolicyResult(value: unknown): PolicyResult {
  const record = asRecord(value, "R3G-E policy result")
  exactKeys(record, ["decision", "reason"], "R3G-E policy result")
  if (record.decision !== "allow" && record.decision !== "ask" && record.decision !== "deny") throw new TypeError("R3G-E policy decision is invalid")
  if (typeof record.reason !== "string" || record.reason.length === 0) throw new TypeError("R3G-E policy reason must be non-empty")
  return Object.freeze({ decision: record.decision, reason: record.reason })
}
function canonicalSocketPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || byteLength(value) > KDO_H4_R3F_LIMITS.maxSocketPathBytes) throw new TypeError("R3G-E Docker socket path must be bounded non-empty POSIX text")
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) throw new TypeError("R3G-E Docker socket path must be canonical absolute POSIX path")
  return value
}
function currentSocketEndpoint(socketPath: string): DockerSocketEndpointIdentity {
  const stats = lstatSync(socketPath, { bigint: true })
  if (!stats.isSocket()) throw new TypeError("R3G-E Docker endpoint must remain a real Unix socket")
  return createDockerSocketEndpointIdentity({
    device: stats.dev.toString(10), inode: stats.ino.toString(10), uid: stats.uid.toString(10), gid: stats.gid.toString(10), mode: stats.mode.toString(10),
  })
}
function requireSameSocketEndpoint(socketPath: string, expected: DockerSocketEndpointIdentity): void {
  if (currentSocketEndpoint(socketPath).endpointIdentity !== expected.endpointIdentity) throw new Error("R3G-E Docker Unix socket endpoint identity changed")
}
function validateCanonicalDockerProvider(providerValue: unknown, requirement: SandboxExecutionRequirement, socketPathValue: unknown): { provider: DockerControlPlaneBindingProvider; socketPath: string } {
  if (providerValue === null || typeof providerValue !== "object" || utilTypes.isProxy(providerValue)) throw new TypeError("R3G-E requires a canonical R3F Docker provider object")
  const provider = providerValue as DockerControlPlaneBindingProvider
  if (provider.providerId !== KDO_H4_R3F_PROVIDER_ID) throw new TypeError("R3G-E Docker provider id mismatch")
  identity(provider.providerIdentity, "R3G-E Docker providerIdentity")
  if (provider.requirementIdentity !== requirement.requirementIdentity || provider.workloadIdentity !== requirement.workload.workloadIdentity) throw new TypeError("R3G-E canonical R3F provider is bound to a different requirement/workload")
  if (typeof provider.resolveDockerControlPlaneBinding !== "function" || typeof provider.resolveContainerBinding !== "function") throw new TypeError("R3G-E canonical R3F provider lacks trusted resolver closures")
  const socketPath = canonicalSocketPath(socketPathValue)
  if (provider.socketEndpoint === null || typeof provider.socketEndpoint !== "object") throw new TypeError("R3G-E canonical R3F provider lacks socket endpoint identity")
  identity(provider.socketEndpoint.endpointIdentity, "R3G-E Docker socket endpointIdentity")
  requireSameSocketEndpoint(socketPath, provider.socketEndpoint)
  return Object.freeze({ provider, socketPath })
}

function validateJsonSyntaxNoDuplicateKeys(text: string): void {
  let index = 0
  const length = text.length
  const whitespace = (char: string) => char === " " || char === "\t" || char === "\r" || char === "\n"
  const skip = () => { while (index < length && whitespace(text[index] ?? "")) index += 1 }
  const number = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y
  const stringToken = (): string => {
    if (text[index] !== '"') throw new TypeError("R3G-E Docker inspect contains invalid JSON string syntax")
    const start = index++
    while (index < length) {
      const char = text[index] ?? ""
      if (char === '"') {
        index += 1
        try { return JSON.parse(text.slice(start, index)) as string }
        catch { throw new TypeError("R3G-E Docker inspect contains invalid JSON string syntax") }
      }
      if (char === "\\") {
        index += 1
        if (index >= length) throw new TypeError("R3G-E Docker inspect contains unterminated JSON escape")
        if (text[index] === "u") {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) throw new TypeError("R3G-E Docker inspect contains invalid JSON unicode escape")
          index += 4
        } else if (!'"\\/bfnrt'.includes(text[index] ?? "")) throw new TypeError("R3G-E Docker inspect contains invalid JSON escape")
      } else if (char.charCodeAt(0) < 0x20) throw new TypeError("R3G-E Docker inspect contains unescaped JSON control character")
      index += 1
    }
    throw new TypeError("R3G-E Docker inspect contains unterminated JSON string")
  }
  const value = (depth: number): void => {
    if (depth > MAX_JSON_DEPTH) throw new TypeError("R3G-E Docker inspect exceeds JSON nesting depth")
    skip()
    const char = text[index]
    if (char === "{") {
      index += 1; skip(); const keys = new Set<string>()
      if (text[index] === "}") { index += 1; return }
      for (;;) {
        skip(); const key = stringToken()
        if (keys.has(key)) throw new TypeError(`R3G-E Docker inspect contains duplicate JSON object key: ${key}`)
        keys.add(key); skip()
        if (text[index] !== ":") throw new TypeError("R3G-E Docker inspect contains invalid JSON object syntax")
        index += 1; value(depth + 1); skip()
        if (text[index] === "}") { index += 1; return }
        if (text[index] !== ",") throw new TypeError("R3G-E Docker inspect contains invalid JSON object syntax")
        index += 1
      }
    }
    if (char === "[") {
      index += 1; skip()
      if (text[index] === "]") { index += 1; return }
      for (;;) {
        value(depth + 1); skip()
        if (text[index] === "]") { index += 1; return }
        if (text[index] !== ",") throw new TypeError("R3G-E Docker inspect contains invalid JSON array syntax")
        index += 1
      }
    }
    if (char === '"') { stringToken(); return }
    number.lastIndex = index
    const match = number.exec(text)
    if (match !== null) { index = number.lastIndex; return }
    for (const literal of ["true", "false", "null"] as const) if (text.startsWith(literal, index)) { index += literal.length; return }
    throw new TypeError("R3G-E Docker inspect contains invalid JSON value syntax")
  }
  value(0); skip()
  if (index !== length) throw new TypeError("R3G-E Docker inspect contains trailing JSON content")
}

function parseInspectBody(body: Buffer, expectedContainerId: string): void {
  let text: string
  try { text = UTF8.decode(body) } catch { throw new TypeError("R3G-E Docker inspect is not valid UTF-8") }
  validateJsonSyntaxNoDuplicateKeys(text)
  let parsed: unknown
  try { parsed = JSON.parse(text) } catch { throw new TypeError("R3G-E Docker inspect is not valid JSON") }
  const inspect = asRecord(parsed, "R3G-E Docker inspect")
  if (inspect.Id !== expectedContainerId) throw new TypeError("R3G-E Docker inspect ID does not match exact binding")
  const config = asRecord(inspect.Config, "R3G-E Docker inspect Config")
  if (!requiredBoolean(config, "AttachStdout", "R3G-E Docker inspect Config")) throw new TypeError("R3G-E requires Config.AttachStdout=true")
  if (!requiredBoolean(config, "AttachStderr", "R3G-E Docker inspect Config")) throw new TypeError("R3G-E requires Config.AttachStderr=true")
  if (requiredBoolean(config, "AttachStdin", "R3G-E Docker inspect Config")) throw new TypeError("R3G-E requires Config.AttachStdin=false")
  if (requiredBoolean(config, "OpenStdin", "R3G-E Docker inspect Config")) throw new TypeError("R3G-E requires Config.OpenStdin=false")
  if (requiredBoolean(config, "Tty", "R3G-E Docker inspect Config")) throw new TypeError("R3G-E requires Config.Tty=false")
}

async function boundedInspect(input: { socketPath: string; endpoint: DockerSocketEndpointIdentity; containerId: string; signal?: AbortSignal }): Promise<Buffer> {
  if (input.signal?.aborted) throw new Error("R3G-E Docker inspect aborted")
  requireSameSocketEndpoint(input.socketPath, input.endpoint)
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      let settled = false; const chunks: Buffer[] = []; let bytes = 0
      const cleanup = () => input.signal?.removeEventListener("abort", onAbort)
      const finishReject = (error: unknown) => { if (settled) return; settled = true; cleanup(); reject(error instanceof Error ? error : new Error(String(error))) }
      const finishResolve = () => { if (settled) return; settled = true; cleanup(); resolve(Buffer.concat(chunks, bytes)) }
      const onAbort = () => { const error = new Error("R3G-E Docker inspect aborted"); finishReject(error); request.destroy(error) }
      const request = httpRequest({
        method: "GET", socketPath: input.socketPath,
        path: `/v${KDO_H4_R3G_E_DOCKER_API_VERSION}/containers/${input.containerId}/json?size=0`,
        agent: false, maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
        headers: Object.freeze({ Accept: "application/json", Connection: "close" }),
      }, (response) => {
        const headerBytes = response.rawHeaders.reduce((total, item) => total + byteLength(item) + 2, 0)
        if (headerBytes > KDO_H4_R3F_LIMITS.maxResponseHeaderBytes) { const error = new Error("R3G-E Docker inspect response headers exceed bound"); finishReject(error); response.destroy(error); return }
        if (response.statusCode !== 200) { const error = new Error(`R3G-E Docker inspect failed with HTTP ${String(response.statusCode ?? "unknown")}`); finishReject(error); response.destroy(error); return }
        response.on("data", (chunk: Buffer | string) => {
          const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk); bytes += part.byteLength
          if (bytes > MAX_INSPECT_BYTES) { const error = new Error("R3G-E Docker inspect body exceeds bound"); finishReject(error); response.destroy(error); return }
          chunks.push(part)
        })
        response.on("end", finishResolve)
        response.on("aborted", () => finishReject(new Error("R3G-E Docker inspect response aborted")))
        response.on("error", finishReject)
      })
      request.on("error", finishReject)
      request.setTimeout(KDO_H4_R3F_LIMITS.requestTimeoutMs, () => { const error = new Error("R3G-E Docker inspect timed out"); finishReject(error); request.destroy(error) })
      input.signal?.addEventListener("abort", onAbort, { once: true })
      if (input.signal?.aborted) { onAbort(); return }
      request.end()
    })
  } finally { requireSameSocketEndpoint(input.socketPath, input.endpoint) }
}

async function openAttach(input: { socketPath: string; endpoint: DockerSocketEndpointIdentity; containerId: string; signal?: AbortSignal }): Promise<{ readonly socket: Socket; readonly head: Buffer }> {
  if (input.signal?.aborted) throw new Error("R3G-E Docker attach aborted")
  requireSameSocketEndpoint(input.socketPath, input.endpoint)
  return await new Promise((resolve, reject) => {
    let settled = false
    const cleanup = () => input.signal?.removeEventListener("abort", onAbort)
    const finishReject = (error: unknown) => { if (settled) return; settled = true; cleanup(); reject(error instanceof Error ? error : new Error(String(error))) }
    const onAbort = () => { const error = new Error("R3G-E Docker attach aborted"); finishReject(error); request.destroy(error) }
    const request = httpRequest({
      method: "POST", socketPath: input.socketPath,
      path: `/v${KDO_H4_R3G_E_DOCKER_API_VERSION}/containers/${input.containerId}/${KDO_H4_R3G_E_ATTACH_PATH_SUFFIX}`,
      agent: false, maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
      headers: Object.freeze({ "Content-Type": "text/plain", Connection: "Upgrade", Upgrade: "tcp" }),
    })
    request.once("response", (response) => { const error = new Error(`R3G-E Docker attach refused protocol upgrade with HTTP ${String(response.statusCode ?? "unknown")}`); response.resume(); finishReject(error); request.destroy(error) })
    request.once("upgrade", (response, socketValue, head) => {
      try {
        const socket = socketValue as Socket
        if (response.statusCode !== 101) throw new Error(`R3G-E Docker attach expected HTTP 101; received ${String(response.statusCode ?? "unknown")}`)
        if ((response.headers.connection ?? "").toLowerCase() !== "upgrade") throw new Error("R3G-E Docker attach Connection header mismatch")
        if ((response.headers.upgrade ?? "").toLowerCase() !== "tcp") throw new Error("R3G-E Docker attach Upgrade header mismatch")
        const mediaType = String(response.headers["content-type"] ?? "").split(";", 1)[0]?.trim().toLowerCase()
        if (mediaType !== KDO_H4_R3G_E_ATTACH_MEDIA_TYPE) throw new Error(`R3G-E Docker attach media type must be ${KDO_H4_R3G_E_ATTACH_MEDIA_TYPE}`)
        requireSameSocketEndpoint(input.socketPath, input.endpoint)
        if (settled) { socket.destroy(); return }
        settled = true; cleanup(); resolve(Object.freeze({ socket, head: Buffer.from(head) }))
      } catch (error) { socketValue.destroy(); finishReject(error) }
    })
    request.on("error", finishReject)
    request.setTimeout(KDO_H4_R3F_LIMITS.requestTimeoutMs, () => { const error = new Error("R3G-E Docker attach handshake timed out"); finishReject(error); request.destroy(error) })
    input.signal?.addEventListener("abort", onAbort, { once: true })
    if (input.signal?.aborted) { onAbort(); return }
    request.end()
  })
}

function sameBinding(left: GvisorContainerBinding, right: GvisorContainerBinding): boolean {
  return left.bindingIdentity === right.bindingIdentity
    && left.executionAttemptIdentity === right.executionAttemptIdentity
    && left.requirementIdentity === right.requirementIdentity
    && left.workloadIdentity === right.workloadIdentity
    && left.containerId === right.containerId
    && left.providerId === right.providerId
}

export function createGvisorDockerOutputTransport(value: unknown): GvisorDockerOutputTransport {
  const record = asRecord(value, "R3G-E Docker output transport config")
  exactKeys(record, ["provider", "socketPath", "requirement"], "R3G-E Docker output transport config")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  if (KDO_H4_R3F_DOCKER_API_VERSION !== KDO_H4_R3G_E_DOCKER_API_VERSION) throw new Error("R3G-E/R3F Docker API version mismatch")
  const canonical = validateCanonicalDockerProvider(record.provider, requirement, record.socketPath)
  const provider = canonical.provider
  const socketPath = canonical.socketPath
  const consumedAttempts = new Set<string>()
  const captureOutput: GvisorDockerOutputTransport["captureOutput"] = async (requestValue, options = {}) => {
    const request = validateGvisorContainerBindingRequest(requestValue)
    if (consumedAttempts.has(request.executionAttemptIdentity)) throw new Error("R3G-E output attempt is already consumed and cannot reset its byte budget")
    consumedAttempts.add(request.executionAttemptIdentity)
    if (options.signal?.aborted) throw new Error("R3G-E output capture aborted")
    const expectedBinding = options.expectedBinding === undefined ? undefined : validateGvisorContainerBinding(options.expectedBinding, request)
    const resolution = await provider.resolveDockerControlPlaneBinding(request, { signal: options.signal })
    const binding = resolution.binding
    if (expectedBinding !== undefined && !sameBinding(binding, expectedBinding)) throw new Error("R3G-E Docker output binding does not match the exact lifecycle subject")
    const inspect = await boundedInspect({ socketPath, endpoint: provider.socketEndpoint, containerId: binding.containerId, signal: options.signal })
    parseInspectBody(inspect, binding.containerId)
    const outputChannelIdentity = createGvisorOutputChannelIdentity({
      executionAttemptIdentity: request.executionAttemptIdentity, requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity,
      containerBindingIdentity: binding.bindingIdentity, containerId: binding.containerId,
      providerIdentity: provider.providerIdentity, socketEndpointIdentity: provider.socketEndpoint.endpointIdentity,
    })
    const { socket, head } = await openAttach({ socketPath, endpoint: provider.socketEndpoint, containerId: binding.containerId, signal: options.signal })
    const accumulator = new GvisorDockerMultiplexAccumulator(requirement.workload.resourcePolicy.maxOutputBytes)
    let abortListener: (() => void) | undefined
    let absoluteTimer: NodeJS.Timeout | undefined
    try {
      socket.setTimeout(KDO_H4_R3G_E_RUNTIME_LIMITS.outputInactivityTimeoutMs, () => socket.destroy(new Error("R3G-E Docker output stream exceeded inactivity deadline")))
      const absoluteLifetimeMs = Math.min(2_147_483_647, requirement.workload.resourcePolicy.ttlMs + KDO_H4_R3G_E_RUNTIME_LIMITS.outputAbsoluteSlackMs)
      absoluteTimer = setTimeout(() => socket.destroy(new Error("R3G-E Docker output stream exceeded absolute capture lifetime")), absoluteLifetimeMs)
      if (options.signal !== undefined) {
        abortListener = () => socket.destroy(new Error("R3G-E Docker output capture aborted"))
        options.signal.addEventListener("abort", abortListener, { once: true })
        if (options.signal.aborted) abortListener()
      }
      if (head.byteLength !== 0) accumulator.push(head)
      for await (const chunk of socket) accumulator.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      const aggregation = accumulator.finish()
      requireSameSocketEndpoint(socketPath, provider.socketEndpoint)
      return Object.freeze({
        version: KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION, binding,
        executionAttemptIdentity: request.executionAttemptIdentity,
        requirementIdentity: request.requirementIdentity, workloadIdentity: request.workloadIdentity,
        providerIdentity: provider.providerIdentity, socketEndpointIdentity: provider.socketEndpoint.endpointIdentity,
        outputChannelIdentity, mediaType: KDO_H4_R3G_E_ATTACH_MEDIA_TYPE, aggregation,
      })
    } catch (error) { socket.destroy(); throw error }
    finally {
      if (absoluteTimer !== undefined) clearTimeout(absoluteTimer)
      if (abortListener !== undefined) options.signal?.removeEventListener("abort", abortListener)
      socket.destroy()
    }
  }
  return Object.freeze({ provider, captureOutput })
}

function preparedPreimage(input: Omit<GvisorOutputPreparedOperation, "preparedIdentity">): readonly (string | number)[] {
  return [input.version, input.executionAttemptIdentity, input.requirementIdentity, input.workloadIdentity, input.containerBindingIdentity, input.containerId, input.runtimeInstanceIdentity, input.providerIdentity, input.socketEndpointIdentity, input.outputChannelIdentity, input.outputOperationIdentity, input.armRecordIdentity, input.maxOutputBytes]
}
export function createGvisorOutputPreparedOperation(input: Omit<GvisorOutputPreparedOperation, "version" | "preparedIdentity">): GvisorOutputPreparedOperation {
  const base = Object.freeze({
    version: KDO_H4_R3G_E_PREPARED_VERSION,
    executionAttemptIdentity: identity(input.executionAttemptIdentity, "executionAttemptIdentity"),
    requirementIdentity: identity(input.requirementIdentity, "requirementIdentity"),
    workloadIdentity: identity(input.workloadIdentity, "workloadIdentity"),
    containerBindingIdentity: identity(input.containerBindingIdentity, "containerBindingIdentity"),
    containerId: containerId(input.containerId), runtimeInstanceIdentity: identity(input.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    providerIdentity: identity(input.providerIdentity, "providerIdentity"), socketEndpointIdentity: identity(input.socketEndpointIdentity, "socketEndpointIdentity"),
    outputChannelIdentity: identity(input.outputChannelIdentity, "outputChannelIdentity"), outputOperationIdentity: identity(input.outputOperationIdentity, "outputOperationIdentity"),
    armRecordIdentity: identity(input.armRecordIdentity, "armRecordIdentity"), maxOutputBytes: boundedPositiveInteger(input.maxOutputBytes, 16_777_216, "maxOutputBytes"),
  })
  return Object.freeze({ ...base, preparedIdentity: domainHash("PREPARED", preparedPreimage(base)) })
}
export function validateGvisorOutputPreparedOperation(value: unknown): GvisorOutputPreparedOperation {
  const record = asRecord(value, "R3G-E prepared operation")
  exactKeys(record, ["version", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity", "providerIdentity", "socketEndpointIdentity", "outputChannelIdentity", "outputOperationIdentity", "armRecordIdentity", "maxOutputBytes", "preparedIdentity"], "R3G-E prepared operation")
  if (record.version !== KDO_H4_R3G_E_PREPARED_VERSION) throw new TypeError("R3G-E prepared version mismatch")
  const rebuilt = createGvisorOutputPreparedOperation(record as unknown as Omit<GvisorOutputPreparedOperation, "version" | "preparedIdentity">)
  if (identity(record.preparedIdentity, "preparedIdentity") !== rebuilt.preparedIdentity) throw new TypeError("R3G-E prepared identity mismatch")
  return rebuilt
}
export function createGvisorOutputReservation(preparedValue: GvisorOutputPreparedOperation, disposition: "created" | "exists"): GvisorOutputReservation {
  const prepared = validateGvisorOutputPreparedOperation(preparedValue)
  const base = Object.freeze({ version: KDO_H4_R3G_E_RESERVATION_VERSION, disposition, executionAttemptIdentity: prepared.executionAttemptIdentity, outputOperationIdentity: prepared.outputOperationIdentity, preparedIdentity: prepared.preparedIdentity })
  return Object.freeze({ ...base, reservationIdentity: domainHash("RESERVATION", [base.version, base.disposition, base.executionAttemptIdentity, base.outputOperationIdentity, base.preparedIdentity]) })
}
export function validateGvisorOutputReservation(value: unknown, expectedPrepared: GvisorOutputPreparedOperation): GvisorOutputReservation {
  const record = asRecord(value, "R3G-E output reservation")
  exactKeys(record, ["version", "disposition", "executionAttemptIdentity", "outputOperationIdentity", "preparedIdentity", "reservationIdentity"], "R3G-E output reservation")
  if (record.version !== KDO_H4_R3G_E_RESERVATION_VERSION || (record.disposition !== "created" && record.disposition !== "exists")) throw new TypeError("R3G-E output reservation version/disposition mismatch")
  const rebuilt = createGvisorOutputReservation(expectedPrepared, record.disposition)
  if (identity(record.executionAttemptIdentity, "reservation executionAttemptIdentity") !== rebuilt.executionAttemptIdentity || identity(record.outputOperationIdentity, "reservation outputOperationIdentity") !== rebuilt.outputOperationIdentity || identity(record.preparedIdentity, "reservation preparedIdentity") !== rebuilt.preparedIdentity || identity(record.reservationIdentity, "reservationIdentity") !== rebuilt.reservationIdentity) throw new TypeError("R3G-E output reservation does not match exact PREPARED operation")
  return rebuilt
}
export function createGvisorOutputFailureRecord(preparedValue: GvisorOutputPreparedOperation, reason: GvisorOutputFailureReason, error: unknown): GvisorOutputFailureRecord {
  const prepared = validateGvisorOutputPreparedOperation(preparedValue)
  if (!(["output-limit-exceeded", "capture-failed", "lifecycle-failed", "aborted", "indeterminate"] as const).includes(reason)) throw new TypeError("R3G-E failure reason is invalid")
  const message = error instanceof Error ? `${error.name}:${error.message}` : String(error)
  const base = Object.freeze({ version: KDO_H4_R3G_E_FAILURE_VERSION, executionAttemptIdentity: prepared.executionAttemptIdentity, outputOperationIdentity: prepared.outputOperationIdentity, preparedIdentity: prepared.preparedIdentity, reason, errorDigest: domainHash("ERROR", [message]) })
  return Object.freeze({ ...base, failureIdentity: domainHash("FAILURE", [base.version, base.executionAttemptIdentity, base.outputOperationIdentity, base.preparedIdentity, base.reason, base.errorDigest]) })
}
export function validateGvisorOutputFailureRecord(value: unknown): GvisorOutputFailureRecord {
  const record = asRecord(value, "R3G-E output failure")
  exactKeys(record, ["version", "executionAttemptIdentity", "outputOperationIdentity", "preparedIdentity", "reason", "errorDigest", "failureIdentity"], "R3G-E output failure")
  if (record.version !== KDO_H4_R3G_E_FAILURE_VERSION) throw new TypeError("R3G-E output failure version mismatch")
  const reason = record.reason as GvisorOutputFailureReason
  if (!(["output-limit-exceeded", "capture-failed", "lifecycle-failed", "aborted", "indeterminate"] as const).includes(reason)) throw new TypeError("R3G-E output failure reason is invalid")
  const base = Object.freeze({ version: KDO_H4_R3G_E_FAILURE_VERSION, executionAttemptIdentity: identity(record.executionAttemptIdentity, "failure executionAttemptIdentity"), outputOperationIdentity: identity(record.outputOperationIdentity, "failure outputOperationIdentity"), preparedIdentity: identity(record.preparedIdentity, "failure preparedIdentity"), reason, errorDigest: identity(record.errorDigest, "failure errorDigest") })
  const expected = domainHash("FAILURE", [base.version, base.executionAttemptIdentity, base.outputOperationIdentity, base.preparedIdentity, base.reason, base.errorDigest])
  if (identity(record.failureIdentity, "failureIdentity") !== expected) throw new TypeError("R3G-E output failure identity mismatch")
  return Object.freeze({ ...base, failureIdentity: expected })
}
export function createGvisorOutputFailureCommit(failureValue: GvisorOutputFailureRecord): GvisorOutputFailureCommit {
  const failure = validateGvisorOutputFailureRecord(failureValue)
  const base = Object.freeze({ version: KDO_H4_R3G_E_FAILURE_COMMIT_VERSION, executionAttemptIdentity: failure.executionAttemptIdentity, outputOperationIdentity: failure.outputOperationIdentity, failureIdentity: failure.failureIdentity })
  return Object.freeze({ ...base, commitIdentity: domainHash("FAILURE_COMMIT", [base.version, base.executionAttemptIdentity, base.outputOperationIdentity, base.failureIdentity]) })
}
export function validateGvisorOutputFailureCommit(value: unknown, expectedFailure: GvisorOutputFailureRecord): GvisorOutputFailureCommit {
  const record = asRecord(value, "R3G-E output failure commit")
  exactKeys(record, ["version", "executionAttemptIdentity", "outputOperationIdentity", "failureIdentity", "commitIdentity"], "R3G-E output failure commit")
  if (record.version !== KDO_H4_R3G_E_FAILURE_COMMIT_VERSION) throw new TypeError("R3G-E output failure commit version mismatch")
  const expected = createGvisorOutputFailureCommit(expectedFailure)
  if (identity(record.executionAttemptIdentity, "failure commit executionAttemptIdentity") !== expected.executionAttemptIdentity || identity(record.outputOperationIdentity, "failure commit outputOperationIdentity") !== expected.outputOperationIdentity || identity(record.failureIdentity, "failure commit failureIdentity") !== expected.failureIdentity || identity(record.commitIdentity, "failure commitIdentity") !== expected.commitIdentity) throw new TypeError("R3G-E output failure commit mismatch")
  return expected
}
export function validateGvisorOutputRuntimeConfig(value: unknown): GvisorOutputRuntimeConfig {
  const record = asRecord(value, "R3G-E output runtime config")
  exactKeys(record, ["version", "reserveOutputOperation", "commitOutputEvidence", "commitFailureEvidence"], "R3G-E output runtime config")
  if (record.version !== KDO_H4_R3G_E_RUNTIME_VERSION) throw new TypeError("R3G-E output runtime version mismatch")
  for (const key of ["reserveOutputOperation", "commitOutputEvidence", "commitFailureEvidence"] as const) if (typeof record[key] !== "function") throw new TypeError(`R3G-E ${key} must be a trusted function`)
  return Object.freeze({ version: KDO_H4_R3G_E_RUNTIME_VERSION, reserveOutputOperation: record.reserveOutputOperation as GvisorOutputRuntimeConfig["reserveOutputOperation"], commitOutputEvidence: record.commitOutputEvidence as GvisorOutputRuntimeConfig["commitOutputEvidence"], commitFailureEvidence: record.commitFailureEvidence as GvisorOutputRuntimeConfig["commitFailureEvidence"] })
}

/**
 * Durable callbacks are trusted mutation boundaries. Abort is honored before the
 * mutation starts; once started, K2 waits for authoritative settlement rather
 * than racing a local timer/abort and leaving a write detached in the background.
 */
async function settleDurableMutation<T>(label: string, signal: AbortSignal | undefined, operation: () => Promise<T> | T): Promise<T> {
  if (signal?.aborted) throw new Error(`${label} aborted before start`)
  try { return await operation() }
  catch (error) {
    if (error instanceof Error) throw error
    throw new Error(`${label} failed: ${String(error)}`)
  }
}

class GvisorOutputPositiveAbortError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "GvisorOutputPositiveAbortError"
  }
}

function asynchronousMutationResult<T>(value: Promise<T> | T, label: string): Promise<T> | null {
  if (utilTypes.isPromise(value)) return Promise.resolve(value as Promise<T>)
  if (value === null || (typeof value !== "object" && typeof value !== "function")) return null
  let thenValue: unknown
  try { thenValue = Reflect.get(value as object, "then") }
  catch (error) {
    if (error instanceof Error) throw error
    throw new Error(`${label} failed while inspecting trusted asynchronous result: ${String(error)}`)
  }
  return typeof thenValue === "function" ? Promise.resolve(value as PromiseLike<T>) : null
}

/**
 * Positive evidence has a stronger cancellation contract than other durable
 * callbacks. The trusted callback receives the caller signal and must abort its
 * transaction without persisting E3 if cancellation wins before durable
 * completion. K2 races only asynchronous authoritative mutation settlement
 * against the caller abort event; synchronous settlement is authoritative at
 * callback return and therefore precedes later microtasks.
 */
async function settleAbortFencedPositiveMutation<T>(
  label: string,
  signal: AbortSignal | undefined,
  operation: () => Promise<T> | T,
): Promise<T> {
  if (signal?.aborted) throw new GvisorOutputPositiveAbortError(`${label} aborted before start`)
  let resolveAbort!: () => void
  const abortOutcome = new Promise<{ readonly kind: "aborted" }>((resolve) => {
    resolveAbort = () => resolve({ kind: "aborted" })
  })
  const onAbort = () => resolveAbort()
  signal?.addEventListener("abort", onAbort, { once: true })
  try {
    if (signal?.aborted) throw new GvisorOutputPositiveAbortError(`${label} aborted before start`)
    let started: Promise<T> | T
    try { started = operation() }
    catch (error) {
      if (signal?.aborted) throw new GvisorOutputPositiveAbortError(`${label} aborted before durable completion`)
      if (error instanceof Error) throw error
      throw new Error(`${label} failed: ${String(error)}`)
    }
    const mutation = asynchronousMutationResult(started, label)
    if (mutation === null) {
      if (signal?.aborted) throw new Error(`${label} trusted positive callback returned success after caller abort`)
      return started
    }
    const mutationOutcome = mutation.then(
      (value) => ({ kind: "fulfilled" as const, value }),
      (error: unknown) => ({ kind: "rejected" as const, error }),
    )
    const first = await Promise.race([mutationOutcome, abortOutcome])
    if (first.kind === "fulfilled") return first.value
    if (first.kind === "rejected") {
      if (first.error instanceof Error) throw first.error
      throw new Error(`${label} failed: ${String(first.error)}`)
    }
    const final = await mutationOutcome
    if (final.kind === "rejected") throw new GvisorOutputPositiveAbortError(`${label} aborted before durable completion`)
    throw new Error(`${label} trusted positive callback settled successfully after caller abort`)
  } finally {
    signal?.removeEventListener("abort", onAbort)
  }
}
function deferred<T>(): { promise: Promise<T>; resolve(value: T): void } {
  let resolvePromise!: (value: T) => void
  const promise = new Promise<T>((resolve) => { resolvePromise = resolve })
  return { promise, resolve: resolvePromise }
}
async function awaitLifecycleStage<T>(stage: Promise<T>, lifecycle: Promise<GvisorTtlEnforcementResult>, label: string): Promise<T> {
  return await Promise.race([stage, lifecycle.then(() => { throw new Error(`R3G-E lifecycle completed before ${label}`) })])
}
function outputIntent(requirement: SandboxExecutionRequirement): ExecutionIntent {
  return Object.freeze({ capability: KDO_H4_R3G_E_CAPABILITY, paths: Object.freeze([]) as unknown as string[], inputDigest: domainHash("INTENT", [requirement.requirementIdentity, requirement.workload.workloadIdentity, requirement.workload.resourcePolicy.maxOutputBytes]) })
}
function aggregationForRecord(value: GvisorOutputAggregationResult): Omit<GvisorOutputAggregationResult, "stdout" | "stderr"> {
  return { acceptedStdoutBytes: value.acceptedStdoutBytes, acceptedStderrBytes: value.acceptedStderrBytes, acceptedAggregateBytes: value.acceptedAggregateBytes, stdoutDigest: value.stdoutDigest, stderrDigest: value.stderrDigest, aggregateTranscriptDigest: value.aggregateTranscriptDigest }
}

export class GvisorOutputExecutionGateway extends ExecutionGateway {
  private readonly outputPolicy: PolicyEngine
  private readonly filesystem: WorkspaceFileSystem
  private readonly dockerControlPlane: DockerControlPlaneBindingProvider
  private readonly dockerSocketPath: string
  private readonly outputRuntime: GvisorOutputRuntimeConfig
  private readonly ttlRuntime: GvisorTtlRuntimeConfig
  private readonly recoveryRuntime: GvisorTtlRecoveryRuntimeConfig
  constructor(config: GvisorOutputExecutionGatewayConfig) {
    super(config.filesystem, config.policy)
    this.filesystem = config.filesystem
    this.outputPolicy = config.policy
    this.dockerControlPlane = config.dockerControlPlane
    this.dockerSocketPath = canonicalSocketPath(config.dockerSocketPath)
    this.outputRuntime = validateGvisorOutputRuntimeConfig(config.outputRuntime)
    this.ttlRuntime = validateGvisorTtlRuntimeConfig(config.ttlRuntime)
    this.recoveryRuntime = validateGvisorTtlRecoveryRuntimeConfig(config.recoveryRuntime)
  }

  private async failureReceipt(intent: ExecutionIntent, policy: PolicyResult, startedAt: string, message: string, observer?: ExecutionObserver): Promise<ExecutionReceipt> {
    const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "failure", error: message } })
    await observer?.onReceipt?.(receipt)
    return receipt
  }

  async enforceGvisorOutputBound(requirementValue: SandboxExecutionRequirement, observer?: ExecutionObserver, options: { readonly signal?: AbortSignal } = {}): Promise<GvisorOutputEnforcementResult> {
    const requirement = validateSandboxExecutionRequirement(requirementValue)
    const startedAt = new Date().toISOString()
    const intent = outputIntent(requirement)
    await observer?.onIntent?.(intent)
    const policy = validatePolicyResult(await this.outputPolicy.evaluate(intent))
    await observer?.onPolicy?.(intent, policy)
    if (policy.decision !== "allow") {
      const reason = policy.decision === "ask" ? "R3G-E physical output enforcement does not permit ASK" : policy.reason
      const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "blocked", reason } })
      await observer?.onReceipt?.(receipt)
      throw new ExecutionBlockedError(reason, receipt)
    }

    try {
      if (process.platform !== "linux") throw new Error("R3G-E physical output enforcement requires Linux")
      if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new Error("R3G-E requires requiredSemanticRuntimeClass=gvisor")
      if (options.signal?.aborted) throw new Error("R3G-E output enforcement aborted before lifecycle start")
      const outputTransport = createGvisorDockerOutputTransport({ provider: this.dockerControlPlane, socketPath: this.dockerSocketPath, requirement })
      const r3fSourceAuthority = await observeDockerSourceControlPlaneForBindingResolver(this.dockerControlPlane.resolveContainerBinding, { signal: options.signal })
      if (r3fSourceAuthority.socketEndpoint.endpointIdentity !== outputTransport.provider.socketEndpoint.endpointIdentity) throw new Error("R3G-E canonical R3F resolver provenance endpoint mismatch")

      const subjectReady = deferred<GvisorTtlSubjectBinding>()
      const armReady = deferred<GvisorTtlArmRecord>()
      const originalRuntime = this.ttlRuntime
      const wrappedResolveSubject: GvisorTtlRuntimeConfig["resolveSubject"] = async (requirementValueInner, runtimeOptions) => {
        const subject = validateGvisorTtlSubjectBinding(await originalRuntime.resolveSubject(requirementValueInner, runtimeOptions), requirementValueInner)
        subjectReady.resolve(subject)
        return subject
      }
      const wrappedCommitPrepared: GvisorTtlRuntimeConfig["commitPreparedIntent"] = (prepared) => originalRuntime.commitPreparedIntent(prepared)
      const wrappedCommitArm: GvisorTtlRuntimeConfig["commitArmEvidence"] = async (recordValue) => {
        const arm = validateGvisorTtlArmRecord(recordValue)
        const raw = await originalRuntime.commitArmEvidence(arm)
        validateGvisorTtlEvidenceCommit(raw, { kind: "arm", armOperationIdentity: arm.armOperationIdentity, leaseIdentity: arm.leaseIdentity, recordIdentity: arm.recordIdentity, payloadDigest: ttlPayloadDigest(arm) })
        armReady.resolve(arm)
        return raw
      }
      const wrappedCommitTerminal: GvisorTtlRuntimeConfig["commitTerminalEvidence"] = (terminal) => originalRuntime.commitTerminalEvidence(terminal)
      const wrappedRuntime: GvisorTtlRuntimeConfig = Object.freeze({
        version: originalRuntime.version, watchdogPath: originalRuntime.watchdogPath, expectedWatchdogSha256: originalRuntime.expectedWatchdogSha256,
        registryRoot: originalRuntime.registryRoot, resolveSubject: wrappedResolveSubject, commitPreparedIntent: wrappedCommitPrepared,
        commitArmEvidence: wrappedCommitArm, commitTerminalEvidence: wrappedCommitTerminal,
      })
      const ttlGateway = new GvisorTtlExecutionGateway({ filesystem: this.filesystem, policy: this.outputPolicy, ttlRuntime: wrappedRuntime, recoveryRuntime: this.recoveryRuntime })
      const lifecycle = ttlGateway.enforceGvisorTtl(requirement, undefined, { signal: options.signal })
      const outputAbort = new AbortController()
      let callerAbort: (() => void) | undefined
      let captureSettled = false
      let lifecycleRejectedOutput = false
      let lifecycleTerminalizedBeforeCapture = false
      if (options.signal !== undefined) {
        callerAbort = () => outputAbort.abort()
        options.signal.addEventListener("abort", callerAbort, { once: true })
        if (options.signal.aborted) callerAbort()
      }
      void lifecycle.then(
        () => {
          if (!captureSettled) {
            lifecycleTerminalizedBeforeCapture = true
            outputAbort.abort()
          }
        },
        () => {
          if (!captureSettled) {
            lifecycleRejectedOutput = true
            outputAbort.abort()
          }
        },
      )

      let prepared: GvisorOutputPreparedOperation | undefined
      try {
        const subject = await awaitLifecycleStage(subjectReady.promise, lifecycle, "subject resolution")
        const arm = await awaitLifecycleStage(armReady.promise, lifecycle, "durable ARM acknowledgement")
        if (arm.executionAttemptIdentity !== subject.binding.executionAttemptIdentity || arm.containerBindingIdentity !== subject.binding.bindingIdentity || arm.containerId !== subject.binding.containerId || arm.runtimeInstanceIdentity !== subject.lineage.runtimeInstanceIdentity) throw new Error("R3G-E lifecycle ARM does not match exact subject")
        const outputChannelIdentity = createGvisorOutputChannelIdentity({
          executionAttemptIdentity: subject.binding.executionAttemptIdentity, requirementIdentity: requirement.requirementIdentity,
          workloadIdentity: requirement.workload.workloadIdentity, containerBindingIdentity: subject.binding.bindingIdentity,
          containerId: subject.binding.containerId, providerIdentity: outputTransport.provider.providerIdentity,
          socketEndpointIdentity: outputTransport.provider.socketEndpoint.endpointIdentity,
        })
        const outputOperationIdentity = createGvisorOutputOperationIdentity({
          outputChannelIdentity, executionAttemptIdentity: subject.binding.executionAttemptIdentity,
          requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity,
          maxOutputBytes: requirement.workload.resourcePolicy.maxOutputBytes,
        })
        prepared = createGvisorOutputPreparedOperation({
          executionAttemptIdentity: subject.binding.executionAttemptIdentity, requirementIdentity: requirement.requirementIdentity,
          workloadIdentity: requirement.workload.workloadIdentity, containerBindingIdentity: subject.binding.bindingIdentity,
          containerId: subject.binding.containerId, runtimeInstanceIdentity: subject.lineage.runtimeInstanceIdentity,
          providerIdentity: outputTransport.provider.providerIdentity, socketEndpointIdentity: outputTransport.provider.socketEndpoint.endpointIdentity,
          outputChannelIdentity, outputOperationIdentity, armRecordIdentity: arm.recordIdentity,
          maxOutputBytes: requirement.workload.resourcePolicy.maxOutputBytes,
        })
        const reservation = validateGvisorOutputReservation(
          await settleDurableMutation("R3G-E durable output reservation", options.signal, () => this.outputRuntime.reserveOutputOperation(prepared as GvisorOutputPreparedOperation)),
          prepared,
        )
        if (reservation.disposition !== "created") throw new Error("R3G-E durable reservation already exists; output budget cannot be replenished")
        const bindingRequest = createGvisorContainerBindingRequest({ executionAttemptIdentity: subject.binding.executionAttemptIdentity, requirement })
        let capture: GvisorDockerOutputCapture
        try {
          capture = await outputTransport.captureOutput(bindingRequest, { signal: outputAbort.signal, expectedBinding: subject.binding })
          captureSettled = true
        } catch (error) {
          captureSettled = true
          const reason: GvisorOutputFailureReason = options.signal?.aborted
            ? "aborted"
            : lifecycleRejectedOutput
              ? "lifecycle-failed"
              : lifecycleTerminalizedBeforeCapture
                ? "indeterminate"
                : error instanceof GvisorOutputLimitExceededError
                  ? "output-limit-exceeded"
                  : "capture-failed"
          const failure = createGvisorOutputFailureRecord(prepared, reason, error)
          validateGvisorOutputFailureCommit(
            await settleDurableMutation("R3G-E durable output failure", undefined, () => this.outputRuntime.commitFailureEvidence(failure)),
            failure,
          )
          void lifecycle.catch(() => {})
          throw error
        }
        let lifecycleResult: GvisorTtlEnforcementResult
        try { lifecycleResult = await lifecycle }
        catch (error) {
          const failure = createGvisorOutputFailureRecord(prepared, options.signal?.aborted ? "aborted" : "lifecycle-failed", error)
          validateGvisorOutputFailureCommit(
            await settleDurableMutation("R3G-E durable lifecycle failure", undefined, () => this.outputRuntime.commitFailureEvidence(failure)),
            failure,
          )
          throw error
        }
        const authoritativeArm = validateGvisorTtlArmRecord(lifecycleResult.arm)
        const terminal = validateGvisorTtlTerminalRecord(lifecycleResult.terminal, authoritativeArm)
        if (authoritativeArm.recordIdentity !== arm.recordIdentity || terminal.runtimeInstanceIdentity !== subject.lineage.runtimeInstanceIdentity) throw new Error("R3G-E terminal lifecycle evidence does not match exact subject/ARM")
        if (!sameBinding(capture.binding, subject.binding) || capture.outputChannelIdentity !== prepared.outputChannelIdentity) throw new Error("R3G-E captured output does not match exact prepared subject/channel")
        const record = createGvisorOutputBoundRecord({
          executionAttemptIdentity: subject.binding.executionAttemptIdentity, requirement,
          containerBindingIdentity: subject.binding.bindingIdentity, containerId: subject.binding.containerId,
          runtimeInstanceIdentity: subject.lineage.runtimeInstanceIdentity, providerIdentity: outputTransport.provider.providerIdentity,
          socketEndpointIdentity: outputTransport.provider.socketEndpoint.endpointIdentity, outputChannelIdentity: prepared.outputChannelIdentity,
          aggregation: aggregationForRecord(capture.aggregation), terminalEvidenceIdentity: terminal.recordIdentity,
        })
        if (record.outputOperationIdentity !== prepared.outputOperationIdentity) throw new Error("R3G-E final record operation identity does not match durable PREPARED operation")
        let commitRaw: unknown
        try {
          commitRaw = await settleAbortFencedPositiveMutation(
            "R3G-E durable positive output evidence",
            options.signal,
            () => this.outputRuntime.commitOutputEvidence(record, { signal: options.signal }),
          )
        } catch (error) {
          if (error instanceof GvisorOutputPositiveAbortError) {
            const failure = createGvisorOutputFailureRecord(prepared, "aborted", error)
            validateGvisorOutputFailureCommit(
              await settleDurableMutation("R3G-E durable positive-abort failure", undefined, () => this.outputRuntime.commitFailureEvidence(failure)),
              failure,
            )
          }
          throw error
        }
        const commit = validateGvisorOutputBoundCommit(commitRaw, record)
        const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "success", outputDigest: record.recordIdentity, outputBytes: record.acceptedAggregateBytes, exitCode: 0 } })
        await observer?.onReceipt?.(receipt)
        return Object.freeze({ subject, arm, terminal, capture, prepared, reservation, record, commit })
      } finally {
        if (callerAbort !== undefined) options.signal?.removeEventListener("abort", callerAbort)
      }
    } catch (error) {
      if (error instanceof ExecutionBlockedError || error instanceof ExecutionFailedError) throw error
      const message = error instanceof Error ? error.message : String(error)
      const receipt = await this.failureReceipt(intent, policy, startedAt, message, observer)
      throw new ExecutionFailedError(message, receipt, { cause: error })
    }
  }
}
