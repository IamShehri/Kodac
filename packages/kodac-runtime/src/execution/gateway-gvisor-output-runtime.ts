import { lstatSync } from "node:fs"
import { request as httpRequest } from "node:http"
import type { Socket } from "node:net"
import { TextDecoder } from "node:util"

import {
  KDO_H4_R3F_DOCKER_API_VERSION,
  KDO_H4_R3F_LIMITS,
  createDockerControlPlaneBindingProvider,
  createDockerSocketEndpointIdentity,
  validateDockerControlPlaneProviderConfig,
  type DockerControlPlaneBindingProvider,
  type DockerControlPlaneProviderConfig,
  type DockerSocketEndpointIdentity,
} from "../trust/sandbox-observer-docker-control-plane.ts"
import {
  validateGvisorContainerBindingRequest,
  type GvisorContainerBinding,
  type GvisorContainerBindingRequest,
} from "../trust/sandbox-observer-gvisor-runtime.ts"
import {
  GvisorDockerMultiplexAccumulator,
  KDO_H4_R3G_E_DOCKER_API_VERSION,
  createGvisorOutputChannelIdentity,
  type GvisorOutputAggregationResult,
} from "../trust/sandbox-output-gvisor.ts"

export const KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION = "kodac-h4-r3g-e-docker-output-transport-v1" as const
export const KDO_H4_R3G_E_ATTACH_MEDIA_TYPE = "application/vnd.docker.multiplexed-stream" as const
export const KDO_H4_R3G_E_ATTACH_PATH_SUFFIX = "attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1" as const

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
    options?: { readonly signal?: AbortSignal },
  ) => Promise<GvisorDockerOutputCapture>
}

const UTF8 = new TextDecoder("utf-8", { fatal: true })
const MAX_INSPECT_BYTES = KDO_H4_R3F_LIMITS.maxInspectResponseBytes
const MAX_JSON_DEPTH = KDO_H4_R3F_LIMITS.maxJsonDepth

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  return value as Record<string, unknown>
}

function requiredBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key]
  if (typeof value !== "boolean") throw new TypeError(`${label}.${key} must be boolean`)
  return value
}

function currentSocketEndpoint(socketPath: string): DockerSocketEndpointIdentity {
  const stats = lstatSync(socketPath, { bigint: true })
  if (!stats.isSocket()) throw new TypeError("R3G-E Docker endpoint must remain a real Unix socket")
  return createDockerSocketEndpointIdentity({
    device: stats.dev.toString(10),
    inode: stats.ino.toString(10),
    uid: stats.uid.toString(10),
    gid: stats.gid.toString(10),
    mode: stats.mode.toString(10),
  })
}

function requireSameSocketEndpoint(socketPath: string, expected: DockerSocketEndpointIdentity): void {
  const current = currentSocketEndpoint(socketPath)
  if (current.endpointIdentity !== expected.endpointIdentity) throw new Error("R3G-E Docker Unix socket endpoint identity changed")
}

/** Reject duplicate JSON object keys before JSON.parse can collapse them. */
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
        } else if (!'"\\/bfnrt'.includes(text[index] ?? "")) {
          throw new TypeError("R3G-E Docker inspect contains invalid JSON escape")
        }
      } else if (char.charCodeAt(0) < 0x20) {
        throw new TypeError("R3G-E Docker inspect contains unescaped JSON control character")
      }
      index += 1
    }
    throw new TypeError("R3G-E Docker inspect contains unterminated JSON string")
  }

  const value = (depth: number): void => {
    if (depth > MAX_JSON_DEPTH) throw new TypeError("R3G-E Docker inspect exceeds JSON nesting depth")
    skip()
    const char = text[index]
    if (char === "{") {
      index += 1
      skip()
      const keys = new Set<string>()
      if (text[index] === "}") { index += 1; return }
      for (;;) {
        skip()
        const key = stringToken()
        if (keys.has(key)) throw new TypeError(`R3G-E Docker inspect contains duplicate JSON object key: ${key}`)
        keys.add(key)
        skip()
        if (text[index] !== ":") throw new TypeError("R3G-E Docker inspect contains invalid JSON object syntax")
        index += 1
        value(depth + 1)
        skip()
        if (text[index] === "}") { index += 1; return }
        if (text[index] !== ",") throw new TypeError("R3G-E Docker inspect contains invalid JSON object syntax")
        index += 1
      }
    }
    if (char === "[") {
      index += 1
      skip()
      if (text[index] === "]") { index += 1; return }
      for (;;) {
        value(depth + 1)
        skip()
        if (text[index] === "]") { index += 1; return }
        if (text[index] !== ",") throw new TypeError("R3G-E Docker inspect contains invalid JSON array syntax")
        index += 1
      }
    }
    if (char === '"') { stringToken(); return }
    number.lastIndex = index
    const match = number.exec(text)
    if (match !== null) { index = number.lastIndex; return }
    for (const literal of ["true", "false", "null"] as const) {
      if (text.startsWith(literal, index)) { index += literal.length; return }
    }
    throw new TypeError("R3G-E Docker inspect contains invalid JSON value syntax")
  }

  value(0)
  skip()
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

async function boundedInspect(input: {
  socketPath: string
  endpoint: DockerSocketEndpointIdentity
  containerId: string
  signal?: AbortSignal
}): Promise<Buffer> {
  if (input.signal?.aborted) throw new Error("R3G-E Docker inspect aborted")
  requireSameSocketEndpoint(input.socketPath, input.endpoint)
  try {
    return await new Promise<Buffer>((resolve, reject) => {
      let settled = false
      const chunks: Buffer[] = []
      let bytes = 0
      const finishReject = (error: unknown) => {
        if (settled) return
        settled = true
        cleanup()
        reject(error instanceof Error ? error : new Error(String(error)))
      }
      const finishResolve = () => {
        if (settled) return
        settled = true
        cleanup()
        resolve(Buffer.concat(chunks, bytes))
      }
      const onAbort = () => {
        const error = new Error("R3G-E Docker inspect aborted")
        finishReject(error)
        request.destroy(error)
      }
      const cleanup = () => input.signal?.removeEventListener("abort", onAbort)
      const request = httpRequest({
        method: "GET",
        socketPath: input.socketPath,
        path: `/v${KDO_H4_R3G_E_DOCKER_API_VERSION}/containers/${input.containerId}/json?size=0`,
        agent: false,
        maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
        headers: Object.freeze({ Accept: "application/json", Connection: "close" }),
      }, (response) => {
        const headerBytes = response.rawHeaders.reduce((total, item) => total + byteLength(item) + 2, 0)
        if (headerBytes > KDO_H4_R3F_LIMITS.maxResponseHeaderBytes) {
          const error = new Error("R3G-E Docker inspect response headers exceed bound")
          finishReject(error); response.destroy(error); return
        }
        if (response.statusCode !== 200) {
          const error = new Error(`R3G-E Docker inspect failed with HTTP ${String(response.statusCode ?? "unknown")}`)
          finishReject(error); response.destroy(error); return
        }
        response.on("data", (chunk: Buffer | string) => {
          const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
          bytes += part.byteLength
          if (bytes > MAX_INSPECT_BYTES) {
            const error = new Error("R3G-E Docker inspect body exceeds bound")
            finishReject(error); response.destroy(error); return
          }
          chunks.push(part)
        })
        response.on("end", finishResolve)
        response.on("aborted", () => finishReject(new Error("R3G-E Docker inspect response aborted")))
        response.on("error", finishReject)
      })
      request.on("error", finishReject)
      request.setTimeout(KDO_H4_R3F_LIMITS.requestTimeoutMs, () => {
        const error = new Error("R3G-E Docker inspect timed out")
        finishReject(error); request.destroy(error)
      })
      input.signal?.addEventListener("abort", onAbort, { once: true })
      if (input.signal?.aborted) { onAbort(); return }
      request.end()
    })
  } finally {
    requireSameSocketEndpoint(input.socketPath, input.endpoint)
  }
}

async function openAttach(input: {
  socketPath: string
  endpoint: DockerSocketEndpointIdentity
  containerId: string
  signal?: AbortSignal
}): Promise<{ readonly socket: Socket; readonly head: Buffer }> {
  if (input.signal?.aborted) throw new Error("R3G-E Docker attach aborted")
  requireSameSocketEndpoint(input.socketPath, input.endpoint)
  return await new Promise((resolve, reject) => {
    let settled = false
    const finishReject = (error: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error instanceof Error ? error : new Error(String(error)))
    }
    const onAbort = () => {
      const error = new Error("R3G-E Docker attach aborted")
      finishReject(error)
      request.destroy(error)
    }
    const cleanup = () => input.signal?.removeEventListener("abort", onAbort)
    const request = httpRequest({
      method: "POST",
      socketPath: input.socketPath,
      path: `/v${KDO_H4_R3G_E_DOCKER_API_VERSION}/containers/${input.containerId}/${KDO_H4_R3G_E_ATTACH_PATH_SUFFIX}`,
      agent: false,
      maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
      headers: Object.freeze({
        "Content-Type": "text/plain",
        Connection: "Upgrade",
        Upgrade: "tcp",
      }),
    })
    request.once("response", (response) => {
      const error = new Error(`R3G-E Docker attach refused protocol upgrade with HTTP ${String(response.statusCode ?? "unknown")}`)
      response.resume()
      finishReject(error)
      request.destroy(error)
    })
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
        settled = true
        cleanup()
        resolve(Object.freeze({ socket, head: Buffer.from(head) }))
      } catch (error) {
        socketValue.destroy()
        finishReject(error)
      }
    })
    request.on("error", finishReject)
    request.setTimeout(KDO_H4_R3F_LIMITS.requestTimeoutMs, () => {
      const error = new Error("R3G-E Docker attach handshake timed out")
      finishReject(error); request.destroy(error)
    })
    input.signal?.addEventListener("abort", onAbort, { once: true })
    if (input.signal?.aborted) { onAbort(); return }
    request.end()
  })
}

export function createGvisorDockerOutputTransport(value: unknown): GvisorDockerOutputTransport {
  const config: DockerControlPlaneProviderConfig = validateDockerControlPlaneProviderConfig(value)
  if (KDO_H4_R3F_DOCKER_API_VERSION !== KDO_H4_R3G_E_DOCKER_API_VERSION) throw new Error("R3G-E/R3F Docker API version mismatch")
  const provider = createDockerControlPlaneBindingProvider(config)
  const consumedAttempts = new Set<string>()

  const captureOutput = async (
    requestValue: GvisorContainerBindingRequest,
    options: { readonly signal?: AbortSignal } = {},
  ): Promise<GvisorDockerOutputCapture> => {
    const request = validateGvisorContainerBindingRequest(requestValue)
    if (consumedAttempts.has(request.executionAttemptIdentity)) throw new Error("R3G-E output attempt is already consumed and cannot reset its byte budget")
    consumedAttempts.add(request.executionAttemptIdentity)
    if (options.signal?.aborted) throw new Error("R3G-E output capture aborted")

    const resolution = await provider.resolveDockerControlPlaneBinding(request, { signal: options.signal })
    const binding = resolution.binding
    const inspect = await boundedInspect({
      socketPath: config.socketPath,
      endpoint: provider.socketEndpoint,
      containerId: binding.containerId,
      signal: options.signal,
    })
    parseInspectBody(inspect, binding.containerId)

    const outputChannelIdentity = createGvisorOutputChannelIdentity({
      executionAttemptIdentity: request.executionAttemptIdentity,
      requirementIdentity: request.requirementIdentity,
      workloadIdentity: request.workloadIdentity,
      containerBindingIdentity: binding.bindingIdentity,
      containerId: binding.containerId,
      providerIdentity: provider.providerIdentity,
      socketEndpointIdentity: provider.socketEndpoint.endpointIdentity,
    })

    const { socket, head } = await openAttach({
      socketPath: config.socketPath,
      endpoint: provider.socketEndpoint,
      containerId: binding.containerId,
      signal: options.signal,
    })
    const accumulator = new GvisorDockerMultiplexAccumulator(config.requirement.workload.resourcePolicy.maxOutputBytes)
    let abortListener: (() => void) | undefined
    try {
      const stallMs = Math.max(KDO_H4_R3F_LIMITS.requestTimeoutMs, config.requirement.workload.resourcePolicy.ttlMs)
      socket.setTimeout(stallMs, () => socket.destroy(new Error("R3G-E Docker output stream stalled beyond bounded lifetime")))
      if (options.signal !== undefined) {
        abortListener = () => socket.destroy(new Error("R3G-E Docker output capture aborted"))
        options.signal.addEventListener("abort", abortListener, { once: true })
        if (options.signal.aborted) abortListener()
      }
      if (head.byteLength !== 0) accumulator.push(head)
      for await (const chunk of socket) {
        accumulator.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      }
      const aggregation = accumulator.finish()
      requireSameSocketEndpoint(config.socketPath, provider.socketEndpoint)
      return Object.freeze({
        version: KDO_H4_R3G_E_DOCKER_TRANSPORT_VERSION,
        binding,
        executionAttemptIdentity: request.executionAttemptIdentity,
        requirementIdentity: request.requirementIdentity,
        workloadIdentity: request.workloadIdentity,
        providerIdentity: provider.providerIdentity,
        socketEndpointIdentity: provider.socketEndpoint.endpointIdentity,
        outputChannelIdentity,
        mediaType: KDO_H4_R3G_E_ATTACH_MEDIA_TYPE,
        aggregation,
      })
    } catch (error) {
      socket.destroy()
      throw error
    } finally {
      if (abortListener !== undefined) options.signal?.removeEventListener("abort", abortListener)
      socket.destroy()
    }
  }

  return Object.freeze({ provider, captureOutput })
}
