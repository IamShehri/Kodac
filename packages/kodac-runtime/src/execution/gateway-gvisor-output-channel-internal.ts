import { request as httpRequest } from "node:http"
import type { Socket } from "node:net"

import { KDO_H4_R3F_LIMITS } from "../trust/sandbox-observer-docker-control-plane.ts"
import { GvisorDockerMultiplexAccumulator } from "../trust/sandbox-output-gvisor.ts"
import {
  KDO_H4_R3G_E_ATTACH_MEDIA_TYPE,
  KDO_H4_R3G_E_ATTACH_PATH_SUFFIX,
  KDO_H4_R3G_E_DOCKER_API_VERSION,
} from "./gateway-gvisor-output-runtime.ts"

export const KDO_H4_R4B_B2A_ATTACH_UPGRADE_TIMEOUT_MS = KDO_H4_R3F_LIMITS.requestTimeoutMs

export type GvisorPrestartAttachFailureCode = "aborted" | "attach-failed" | "attach-timeout" | "attach-protocol-invalid"
export type GvisorPrestartReaderFailureCode = "reader-failed" | "payload-before-start"

export class GvisorPrestartAttachError extends Error {
  readonly code: GvisorPrestartAttachFailureCode

  constructor(code: GvisorPrestartAttachFailureCode, message: string) {
    super(message)
    this.name = "GvisorPrestartAttachError"
    this.code = code
  }
}

export class GvisorPrestartReaderError extends Error {
  readonly code: GvisorPrestartReaderFailureCode

  constructor(code: GvisorPrestartReaderFailureCode, message: string) {
    super(message)
    this.name = "GvisorPrestartReaderError"
    this.code = code
  }
}

export interface GvisorPrestartAttachConnection {
  readonly socket: Socket
  readonly head: Buffer
}

export interface GvisorPrestartDormantReader {
  readonly socket: Socket
  readonly accumulator: GvisorDockerMultiplexAccumulator
  readonly readerCount: 1
  readonly acceptedPayloadBytes: 0
  readonly failure: Promise<GvisorPrestartReaderError>
  isLive(): boolean
  invalidate(): void
}

const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/
const ownedSockets = new WeakSet<object>()

function boundedSocketPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || Buffer.byteLength(value, "utf8") > KDO_H4_R3F_LIMITS.maxSocketPathBytes) {
    throw new TypeError("B2A Docker socket path must be bounded non-empty text")
  }
  return value
}

function exactContainerId(value: unknown): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError("B2A containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}

export async function openGvisorPrestartAttach(input: {
  readonly socketPath: string
  readonly containerId: string
  readonly signal?: AbortSignal
}): Promise<GvisorPrestartAttachConnection> {
  const socketPath = boundedSocketPath(input.socketPath)
  const containerId = exactContainerId(input.containerId)
  if (input.signal?.aborted) throw new GvisorPrestartAttachError("aborted", "B2A Docker attach aborted before dispatch")

  return await new Promise<GvisorPrestartAttachConnection>((resolve, reject) => {
    let settled = false
    const cleanup = () => input.signal?.removeEventListener("abort", onAbort)
    const finishReject = (error: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error instanceof Error ? error : new GvisorPrestartAttachError("attach-failed", String(error)))
    }
    const onAbort = () => {
      const error = new GvisorPrestartAttachError("aborted", "B2A Docker attach aborted")
      finishReject(error)
      request.destroy(error)
    }
    const request = httpRequest({
      method: "POST",
      socketPath,
      path: `/v${KDO_H4_R3G_E_DOCKER_API_VERSION}/containers/${containerId}/${KDO_H4_R3G_E_ATTACH_PATH_SUFFIX}`,
      agent: false,
      maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
      headers: Object.freeze({
        "Content-Type": "text/plain",
        Connection: "Upgrade",
        Upgrade: "tcp",
      }),
    })

    request.once("response", (response) => {
      const error = new GvisorPrestartAttachError(
        "attach-protocol-invalid",
        `B2A Docker attach refused protocol upgrade with HTTP ${String(response.statusCode ?? "unknown")}`,
      )
      response.resume()
      finishReject(error)
      request.destroy(error)
    })

    request.once("upgrade", (response, socketValue, head) => {
      try {
        const socket = socketValue as Socket
        socket.pause()
        if (response.statusCode !== 101) {
          throw new GvisorPrestartAttachError("attach-protocol-invalid", `B2A Docker attach expected HTTP 101; received ${String(response.statusCode ?? "unknown")}`)
        }
        if ((response.headers.connection ?? "").toLowerCase() !== "upgrade") {
          throw new GvisorPrestartAttachError("attach-protocol-invalid", "B2A Docker attach Connection header mismatch")
        }
        if ((response.headers.upgrade ?? "").toLowerCase() !== "tcp") {
          throw new GvisorPrestartAttachError("attach-protocol-invalid", "B2A Docker attach Upgrade header mismatch")
        }
        const mediaType = String(response.headers["content-type"] ?? "").split(";", 1)[0]?.trim().toLowerCase()
        if (mediaType !== KDO_H4_R3G_E_ATTACH_MEDIA_TYPE) {
          throw new GvisorPrestartAttachError("attach-protocol-invalid", `B2A Docker attach media type must be ${KDO_H4_R3G_E_ATTACH_MEDIA_TYPE}`)
        }
        if (settled) {
          socket.destroy()
          return
        }
        settled = true
        cleanup()
        resolve(Object.freeze({ socket, head: Buffer.from(head) }))
      } catch (error) {
        socketValue.destroy()
        finishReject(error)
      }
    })

    request.on("error", (error) => {
      finishReject(error instanceof GvisorPrestartAttachError ? error : new GvisorPrestartAttachError("attach-failed", error.message))
    })
    request.setTimeout(KDO_H4_R4B_B2A_ATTACH_UPGRADE_TIMEOUT_MS, () => {
      const error = new GvisorPrestartAttachError("attach-timeout", "B2A Docker attach handshake timed out")
      finishReject(error)
      request.destroy(error)
    })
    input.signal?.addEventListener("abort", onAbort, { once: true })
    if (input.signal?.aborted) {
      onAbort()
      return
    }
    request.end()
  })
}

export function createGvisorPrestartDormantReader(input: {
  readonly socket: Socket
  readonly head: Buffer
  readonly maxOutputBytes: number
}): GvisorPrestartDormantReader {
  if (ownedSockets.has(input.socket)) throw new Error("B2A attach socket already has a reader")
  if (!Number.isSafeInteger(input.maxOutputBytes) || input.maxOutputBytes <= 0 || input.maxOutputBytes > 16_777_216) {
    throw new TypeError("B2A maxOutputBytes must be a positive safe integer <= 16777216")
  }
  ownedSockets.add(input.socket)
  const accumulator = new GvisorDockerMultiplexAccumulator(input.maxOutputBytes)
  let live = true
  let rejectFailure!: (error: GvisorPrestartReaderError) => void
  const failure = new Promise<GvisorPrestartReaderError>((_resolve, reject) => {
    rejectFailure = reject
  })
  void failure.catch(() => undefined)

  const fail = (error: GvisorPrestartReaderError) => {
    if (!live) return
    live = false
    cleanup()
    input.socket.destroy(error)
    rejectFailure(error)
  }
  const onData = (_chunk: Buffer | string) => fail(new GvisorPrestartReaderError("payload-before-start", "B2A observed Docker attach bytes before start authority"))
  const onEnd = () => fail(new GvisorPrestartReaderError("reader-failed", "B2A Docker attach stream ended before start authority"))
  const onClose = () => fail(new GvisorPrestartReaderError("reader-failed", "B2A Docker attach stream closed before start authority"))
  const onError = (error: Error) => fail(new GvisorPrestartReaderError("reader-failed", `B2A Docker attach stream failed: ${error.message}`))
  const cleanup = () => {
    input.socket.off("data", onData)
    input.socket.off("end", onEnd)
    input.socket.off("close", onClose)
    input.socket.off("error", onError)
  }

  input.socket.on("data", onData)
  input.socket.once("end", onEnd)
  input.socket.once("close", onClose)
  input.socket.once("error", onError)

  if (input.head.byteLength !== 0) {
    queueMicrotask(() => fail(new GvisorPrestartReaderError("payload-before-start", "B2A Docker attach upgrade carried bytes before start authority")))
  } else {
    input.socket.resume()
  }

  return Object.freeze({
    socket: input.socket,
    accumulator,
    readerCount: 1 as const,
    acceptedPayloadBytes: 0 as const,
    failure,
    isLive: () => live,
    invalidate: () => {
      if (!live) return
      live = false
      cleanup()
      input.socket.destroy()
    },
  })
}
