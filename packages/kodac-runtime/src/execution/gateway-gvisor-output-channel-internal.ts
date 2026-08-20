import { request as httpRequest } from "node:http"
import type { Socket } from "node:net"

import { KDO_H4_R3F_LIMITS, type DockerSocketEndpointIdentity } from "../trust/sandbox-observer-docker-control-plane.ts"
import {
  GvisorDockerMultiplexAccumulator,
  KDO_H4_R3G_E_DOCKER_API_VERSION,
} from "../trust/sandbox-output-gvisor.ts"

export const KDO_H4_R4B_B2A_ATTACH_MEDIA_TYPE = "application/vnd.docker.multiplexed-stream" as const
export const KDO_H4_R4B_B2A_ATTACH_PATH_SUFFIX = "attach?logs=0&stream=1&stdin=0&stdout=1&stderr=1" as const

export interface InternalGvisorAttachChannel {
  readonly socket: Socket
  readonly head: Buffer
}

export interface InternalPrestartReaderSnapshot {
  readonly live: boolean
  readonly readerCount: 1
  readonly acceptedRawPayloadBytes: 0
}

function byteLength(value: string): number {
  return Buffer.byteLength(value, "utf8")
}

function exactContainerId(value: string): string {
  if (!/^[0-9a-f]{64}$/.test(value)) throw new TypeError("B2A containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}

export async function openExactGvisorDockerAttach(input: {
  readonly socketPath: string
  readonly endpoint: DockerSocketEndpointIdentity
  readonly containerId: string
  readonly signal: AbortSignal
  readonly timeoutMs: number
  readonly requireSameSocketEndpoint: () => void
}): Promise<InternalGvisorAttachChannel> {
  if (input.signal.aborted) throw new Error("B2A Docker attach aborted before dispatch")
  if (input.endpoint.endpointIdentity.length !== 64) throw new TypeError("B2A Docker endpoint identity is invalid")
  input.requireSameSocketEndpoint()
  const containerId = exactContainerId(input.containerId)
  return await new Promise<InternalGvisorAttachChannel>((resolve, reject) => {
    let settled = false
    const cleanup = () => input.signal.removeEventListener("abort", onAbort)
    const finishReject = (error: unknown) => {
      if (settled) return
      settled = true
      cleanup()
      reject(error instanceof Error ? error : new Error(String(error)))
    }
    const onAbort = () => {
      const error = new Error("B2A Docker attach aborted")
      finishReject(error)
      request.destroy(error)
    }
    const request = httpRequest({
      method: "POST",
      socketPath: input.socketPath,
      path: `/v${KDO_H4_R3G_E_DOCKER_API_VERSION}/containers/${containerId}/${KDO_H4_R4B_B2A_ATTACH_PATH_SUFFIX}`,
      agent: false,
      maxHeaderSize: KDO_H4_R3F_LIMITS.maxResponseHeaderBytes,
      headers: Object.freeze({
        "Content-Type": "text/plain",
        Connection: "Upgrade",
        Upgrade: "tcp",
      }),
    })
    request.once("response", (response) => {
      const error = new Error(`B2A Docker attach refused protocol upgrade with HTTP ${String(response.statusCode ?? "unknown")}`)
      response.resume()
      finishReject(error)
      request.destroy(error)
    })
    request.once("upgrade", (response, socketValue, head) => {
      try {
        const socket = socketValue as Socket
        const headerBytes = response.rawHeaders.reduce((total, item) => total + byteLength(item) + 2, 0)
        if (headerBytes > KDO_H4_R3F_LIMITS.maxResponseHeaderBytes) throw new Error("B2A Docker attach response headers exceed bound")
        if (response.statusCode !== 101) throw new Error(`B2A Docker attach expected HTTP 101; received ${String(response.statusCode ?? "unknown")}`)
        if ((response.headers.connection ?? "").toLowerCase() !== "upgrade") throw new Error("B2A Docker attach Connection header mismatch")
        if ((response.headers.upgrade ?? "").toLowerCase() !== "tcp") throw new Error("B2A Docker attach Upgrade header mismatch")
        const mediaType = String(response.headers["content-type"] ?? "").split(";", 1)[0]?.trim().toLowerCase()
        if (mediaType !== KDO_H4_R4B_B2A_ATTACH_MEDIA_TYPE) throw new Error(`B2A Docker attach media type must be ${KDO_H4_R4B_B2A_ATTACH_MEDIA_TYPE}`)
        input.requireSameSocketEndpoint()
        if (input.signal.aborted || settled) {
          socket.destroy()
          if (!settled) finishReject(new Error("B2A Docker attach invalidated before upgrade ownership"))
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
    request.on("error", finishReject)
    request.setTimeout(input.timeoutMs, () => {
      const error = new Error("B2A Docker attach handshake timed out")
      finishReject(error)
      request.destroy(error)
    })
    input.signal.addEventListener("abort", onAbort, { once: true })
    if (input.signal.aborted) {
      onAbort()
      return
    }
    request.end()
  })
}

export class InternalGvisorPrestartMultiplexReader {
  readonly #socket: Socket
  readonly #accumulator: GvisorDockerMultiplexAccumulator
  readonly #onFailure: (reason: "payload-before-start" | "reader-failed", error: Error) => void
  #live = true
  #failureReported = false

  constructor(input: {
    readonly socket: Socket
    readonly head: Buffer
    readonly maxOutputBytes: number
    readonly onFailure: (reason: "payload-before-start" | "reader-failed", error: Error) => void
  }) {
    this.#socket = input.socket
    this.#accumulator = new GvisorDockerMultiplexAccumulator(input.maxOutputBytes)
    this.#onFailure = input.onFailure
    this.#socket.on("data", this.#onData)
    this.#socket.once("error", this.#onError)
    this.#socket.once("end", this.#onEnd)
    this.#socket.once("close", this.#onClose)
    if (input.head.byteLength !== 0) {
      this.#reportFailure("payload-before-start", new Error("B2A received Docker output bytes before start"))
    }
  }

  #reportFailure(reason: "payload-before-start" | "reader-failed", error: Error): void {
    if (this.#failureReported) return
    this.#failureReported = true
    this.#live = false
    this.#onFailure(reason, error)
    this.#socket.destroy(error)
  }

  #onData = (chunk: Buffer | string): void => {
    const bytes = Buffer.isBuffer(chunk) ? chunk.byteLength : Buffer.byteLength(chunk)
    if (bytes !== 0) this.#reportFailure("payload-before-start", new Error("B2A received Docker output bytes before start"))
  }

  #onError = (error: Error): void => {
    if (!this.#failureReported) this.#reportFailure("reader-failed", error)
  }

  #onEnd = (): void => {
    if (!this.#failureReported) this.#reportFailure("reader-failed", new Error("B2A Docker attach stream ended before start"))
  }

  #onClose = (): void => {
    if (!this.#failureReported && this.#live) this.#reportFailure("reader-failed", new Error("B2A Docker attach stream closed before start"))
  }

  snapshot(): InternalPrestartReaderSnapshot {
    return Object.freeze({
      live: this.#live && !this.#socket.destroyed && this.#socket.readable,
      readerCount: 1 as const,
      acceptedRawPayloadBytes: 0 as const,
    })
  }

  assertReadyForPrestart(): void {
    const snapshot = this.snapshot()
    if (!snapshot.live) throw new Error("B2A prestart reader is not live")
    if (snapshot.acceptedRawPayloadBytes !== 0) throw new Error("B2A prestart reader accepted payload before start")
  }

  destroy(reason = new Error("B2A prestart reader invalidated")): void {
    if (!this.#failureReported) this.#failureReported = true
    this.#live = false
    this.#socket.destroy(reason)
  }

  /** Internal-only continuity anchor for a separately authorized future B2B slice. */
  internalAccumulatorIdentity(): object {
    return this.#accumulator
  }
}
