import { createHash } from "node:crypto"
import { lstatSync } from "node:fs"
import { request as httpRequest, type IncomingMessage } from "node:http"
import { posix } from "node:path"
import { TextDecoder, types as utilTypes } from "node:util"

import {
  validateSandboxAdmissionPermit,
  validateSandboxAdmissionPermitCommit,
  type SandboxAdmissionConsumptionReservation,
  type SandboxAdmissionPermit,
  type SandboxAdmissionPermitCommit,
} from "../trust/sandbox-admission-permit.ts"
import {
  KDO_H4_R4B_B1_DOCKER_API_VERSION,
  KDO_H4_R4B_B1_DURABILITY,
  KDO_H4_R4B_B1_LABELS,
  createCanonicalR4BB1Reservation,
  createSandboxDormantCreatePrepared,
  createSandboxDormantCreatedAdmission,
  createSandboxDormantDockerObservation,
  validateSandboxAdmissionConsumptionReservationCommit,
  validateSandboxDormantCreatePreparedCommit,
  validateSandboxDormantCreatedAdmissionCommit,
  type SandboxAdmissionConsumptionReservationCommit,
  type SandboxDormantCommitDisposition,
  type SandboxDormantCreatePrepared,
  type SandboxDormantCreatePreparedCommit,
  type SandboxDormantCreatedAdmission,
  type SandboxDormantCreatedAdmissionCommit,
  type SandboxDormantDockerObservation,
} from "../trust/sandbox-admission-dormant-create.ts"
import {
  KDO_H4_R3F_BINDING_VERSION,
  KDO_H4_R3F_LIMITS,
  createDockerSocketEndpointIdentity,
  type DockerSocketEndpointIdentity,
} from "../trust/sandbox-observer-docker-control-plane.ts"

export const KDO_H4_R4B_B1_RUNTIME_VERSION = "kodac-h4-r4b-b1-dormant-docker-create-runtime-v1" as const
export const KDO_H4_R4B_B1_DISPATCH_CLAIM_VERSION = "kodac-h4-r4b-b1-create-dispatch-claim-v1" as const
export const KDO_H4_R4B_B1_DISPATCH_CLAIM_COMMIT_VERSION = "kodac-h4-r4b-b1-create-dispatch-claim-commit-v1" as const
export const KDO_H4_R4B_B1_RUNTIME_LIMITS = Object.freeze({
  maxCreateResponseBytes: 65_536,
  maxInspectResponseBytes: KDO_H4_R3F_LIMITS.maxInspectResponseBytes,
  requestTimeoutMs: KDO_H4_R3F_LIMITS.requestTimeoutMs,
} as const)

export interface SandboxDormantCreateDispatchClaim {
  readonly version: typeof KDO_H4_R4B_B1_DISPATCH_CLAIM_VERSION
  readonly permitIdentity: string
  readonly reservationIdentity: string
  readonly executionAttemptIdentity: string
  readonly preparedIdentity: string
  readonly createOperationIdentity: string
  readonly claimIdentity: string
}

export interface SandboxDormantCreateDispatchClaimCommit {
  readonly version: typeof KDO_H4_R4B_B1_DISPATCH_CLAIM_COMMIT_VERSION
  readonly claimIdentity: string
  readonly preparedIdentity: string
  readonly createOperationIdentity: string
  readonly disposition: SandboxDormantCommitDisposition
  readonly durability: typeof KDO_H4_R4B_B1_DURABILITY
  readonly commitIdentity: string
}

interface DockerImagePreflight {
  readonly imageId: string
  readonly manifestDigest: string
  readonly user: string
  readonly env: readonly string[]
  readonly workingDir: string
}

export interface GvisorDockerDormantCreateRuntimeConfig {
  readonly socketPath: string
  readonly commitReservation: (
    reservation: SandboxAdmissionConsumptionReservation,
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitCreatePrepared: (
    prepared: SandboxDormantCreatePrepared,
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitCreateDispatchClaim: (
    claim: SandboxDormantCreateDispatchClaim,
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown> | unknown
  readonly commitCreatedAdmission: (
    created: SandboxDormantCreatedAdmission,
    options: { readonly signal: AbortSignal },
  ) => Promise<unknown> | unknown
}

interface TrustedGvisorDockerDormantCreateRuntime {
  readonly version: typeof KDO_H4_R4B_B1_RUNTIME_VERSION
  readonly socketPath: string
  readonly socketEndpoint: DockerSocketEndpointIdentity
  readonly commitReservation: GvisorDockerDormantCreateRuntimeConfig["commitReservation"]
  readonly commitCreatePrepared: GvisorDockerDormantCreateRuntimeConfig["commitCreatePrepared"]
  readonly commitCreateDispatchClaim: GvisorDockerDormantCreateRuntimeConfig["commitCreateDispatchClaim"]
  readonly commitCreatedAdmission: GvisorDockerDormantCreateRuntimeConfig["commitCreatedAdmission"]
}

export interface GvisorDockerDormantCreateResult {
  readonly permit: SandboxAdmissionPermit
  readonly permitCommit: SandboxAdmissionPermitCommit
  readonly reservation: SandboxAdmissionConsumptionReservation
  readonly reservationCommit: SandboxAdmissionConsumptionReservationCommit
  readonly prepared: SandboxDormantCreatePrepared
  readonly preparedCommit: SandboxDormantCreatePreparedCommit
  readonly observation: SandboxDormantDockerObservation
  readonly createdAdmission: SandboxDormantCreatedAdmission
  readonly createdAdmissionCommit: SandboxDormantCreatedAdmissionCommit
  readonly recovered: boolean
}

export class SandboxDormantCreateBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxDormantCreateBlockedError"
  }
}

export class SandboxDormantCreateRejectedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxDormantCreateRejectedError"
  }
}

export class SandboxDormantCreateIndeterminateError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxDormantCreateIndeterminateError"
  }
}

export class SandboxDormantCreateUnprovenError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SandboxDormantCreateUnprovenError"
  }
}

const trustedRuntimes = new WeakSet<object>()
const decoder = new TextDecoder("utf-8", { fatal: true })
const SHA256 = /^[0-9a-f]{64}$/
const DOCKER_IMAGE_ID = /^sha256:[0-9a-f]{64}$/

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value) || utilTypes.isProxy(value)) {
    throw new TypeError(`${label} must be a non-proxy plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  if (Object.getOwnPropertySymbols(value).length !== 0) throw new TypeError(`${label} must not contain symbol fields`)
  for (const [key, descriptor] of Object.entries(Object.getOwnPropertyDescriptors(value))) {
    if (descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) throw new TypeError(`${label}.${key} must be a data property`)
    if (!descriptor.enumerable || descriptor.value === undefined) throw new TypeError(`${label}.${key} must be an enumerable defined property`)
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

function dispatchDisposition(value: unknown): SandboxDormantCommitDisposition {
  if (value !== "created" && value !== "existing") throw new TypeError("dispatch claim disposition must be created or existing")
  return value
}

function runtimeIdentity(domain: string, value: unknown): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R4B-B1-RUNTIME\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(value), "utf8"))
    .digest("hex")
}

function createSandboxDormantCreateDispatchClaim(prepared: SandboxDormantCreatePrepared): SandboxDormantCreateDispatchClaim {
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_DISPATCH_CLAIM_VERSION,
    permitIdentity: prepared.permitIdentity,
    reservationIdentity: prepared.reservationIdentity,
    executionAttemptIdentity: prepared.executionAttemptIdentity,
    preparedIdentity: prepared.preparedIdentity,
    createOperationIdentity: prepared.createOperationIdentity,
  })
  return Object.freeze({ ...base, claimIdentity: runtimeIdentity("CREATE_DISPATCH_CLAIM", base) })
}

function validateSandboxDormantCreateDispatchClaim(value: unknown): SandboxDormantCreateDispatchClaim {
  const record = asPlainRecord(value, "R4B-B1 create dispatch claim")
  exactKeys(record, ["version", "permitIdentity", "reservationIdentity", "executionAttemptIdentity", "preparedIdentity", "createOperationIdentity", "claimIdentity"], "R4B-B1 create dispatch claim")
  if (record.version !== KDO_H4_R4B_B1_DISPATCH_CLAIM_VERSION) throw new TypeError("R4B-B1 create dispatch claim version mismatch")
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_DISPATCH_CLAIM_VERSION,
    permitIdentity: identity(record.permitIdentity, "dispatch claim permitIdentity"),
    reservationIdentity: identity(record.reservationIdentity, "dispatch claim reservationIdentity"),
    executionAttemptIdentity: identity(record.executionAttemptIdentity, "dispatch claim executionAttemptIdentity"),
    preparedIdentity: identity(record.preparedIdentity, "dispatch claim preparedIdentity"),
    createOperationIdentity: identity(record.createOperationIdentity, "dispatch claim createOperationIdentity"),
  })
  const claimIdentity = runtimeIdentity("CREATE_DISPATCH_CLAIM", base)
  if (record.claimIdentity !== claimIdentity) throw new TypeError("R4B-B1 create dispatch claim identity mismatch")
  return Object.freeze({ ...base, claimIdentity })
}

export function createSandboxDormantCreateDispatchClaimCommit(
  claimValue: unknown,
  dispositionValue: SandboxDormantCommitDisposition,
): SandboxDormantCreateDispatchClaimCommit {
  const claim = validateSandboxDormantCreateDispatchClaim(claimValue)
  const disposition = dispatchDisposition(dispositionValue)
  const base = Object.freeze({
    version: KDO_H4_R4B_B1_DISPATCH_CLAIM_COMMIT_VERSION,
    claimIdentity: claim.claimIdentity,
    preparedIdentity: claim.preparedIdentity,
    createOperationIdentity: claim.createOperationIdentity,
    disposition,
    durability: KDO_H4_R4B_B1_DURABILITY,
  })
  return Object.freeze({ ...base, commitIdentity: runtimeIdentity("CREATE_DISPATCH_CLAIM_COMMIT", base) })
}

function validateSandboxDormantCreateDispatchClaimCommit(
  value: unknown,
  expectedClaim: SandboxDormantCreateDispatchClaim,
): SandboxDormantCreateDispatchClaimCommit {
  const record = asPlainRecord(value, "R4B-B1 create dispatch claim commit")
  exactKeys(record, ["version", "claimIdentity", "preparedIdentity", "createOperationIdentity", "disposition", "durability", "commitIdentity"], "R4B-B1 create dispatch claim commit")
  if (record.version !== KDO_H4_R4B_B1_DISPATCH_CLAIM_COMMIT_VERSION) throw new TypeError("R4B-B1 create dispatch claim commit version mismatch")
  if (record.durability !== KDO_H4_R4B_B1_DURABILITY) throw new TypeError("R4B-B1 create dispatch claim commit must be durable")
  const rebuilt = createSandboxDormantCreateDispatchClaimCommit(expectedClaim, dispatchDisposition(record.disposition))
  for (const key of ["claimIdentity", "preparedIdentity", "createOperationIdentity", "disposition", "durability", "commitIdentity"] as const) {
    if (record[key] !== rebuilt[key]) throw new TypeError(`R4B-B1 create dispatch claim commit ${key} mismatch`)
  }
  return rebuilt
}

function canonicalSocketPath(value: unknown): string {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0") || Buffer.byteLength(value, "utf8") > KDO_H4_R3F_LIMITS.maxSocketPathBytes) {
    throw new TypeError("R4B-B1 Docker socketPath must be a bounded non-empty POSIX path")
  }
  if (!posix.isAbsolute(value) || posix.normalize(value) !== value || (value.length > 1 && value.endsWith("/"))) {
    throw new TypeError("R4B-B1 Docker socketPath must be canonical and absolute")
  }
  return value
}

function trustedCallback<T>(value: unknown, label: string): T {
  if (typeof value !== "function" || utilTypes.isProxy(value)) throw new TypeError(`${label} must be a non-proxy function`)
  return value as T
}

function snapshotSocketEndpoint(socketPath: string): DockerSocketEndpointIdentity {
  const stats = lstatSync(socketPath, { bigint: true })
  if (!stats.isSocket()) throw new TypeError("R4B-B1 Docker endpoint must be a real Unix socket")
  return createDockerSocketEndpointIdentity({
    device: stats.dev.toString(10),
    inode: stats.ino.toString(10),
    uid: stats.uid.toString(10),
    gid: stats.gid.toString(10),
    mode: stats.mode.toString(10),
  })
}

function requireSameSocketEndpoint(runtime: TrustedGvisorDockerDormantCreateRuntime): void {
  const current = snapshotSocketEndpoint(runtime.socketPath)
  if (current.endpointIdentity !== runtime.socketEndpoint.endpointIdentity) {
    throw new SandboxDormantCreateIndeterminateError("R4B-B1 Docker Unix socket endpoint identity changed")
  }
}

export function createGvisorDockerDormantCreateRuntime(value: unknown): TrustedGvisorDockerDormantCreateRuntime {
  if (process.platform !== "linux") throw new Error("R4B-B1 Docker create runtime requires Linux")
  const record = asPlainRecord(value, "R4B-B1 runtime config")
  exactKeys(record, ["socketPath", "commitReservation", "commitCreatePrepared", "commitCreateDispatchClaim", "commitCreatedAdmission"], "R4B-B1 runtime config")
  const socketPath = canonicalSocketPath(record.socketPath)
  const runtime = Object.freeze({
    version: KDO_H4_R4B_B1_RUNTIME_VERSION,
    socketPath,
    socketEndpoint: snapshotSocketEndpoint(socketPath),
    commitReservation: trustedCallback<GvisorDockerDormantCreateRuntimeConfig["commitReservation"]>(record.commitReservation, "commitReservation"),
    commitCreatePrepared: trustedCallback<GvisorDockerDormantCreateRuntimeConfig["commitCreatePrepared"]>(record.commitCreatePrepared, "commitCreatePrepared"),
    commitCreateDispatchClaim: trustedCallback<GvisorDockerDormantCreateRuntimeConfig["commitCreateDispatchClaim"]>(record.commitCreateDispatchClaim, "commitCreateDispatchClaim"),
    commitCreatedAdmission: trustedCallback<GvisorDockerDormantCreateRuntimeConfig["commitCreatedAdmission"]>(record.commitCreatedAdmission, "commitCreatedAdmission"),
  })
  trustedRuntimes.add(runtime)
  return runtime
}

function requireTrustedRuntime(value: unknown): TrustedGvisorDockerDormantCreateRuntime {
  if (value === null || typeof value !== "object" || !trustedRuntimes.has(value as object)) {
    throw new TypeError("R4B-B1 gateway requires a runtime created by createGvisorDockerDormantCreateRuntime")
  }
  return value as TrustedGvisorDockerDormantCreateRuntime
}

async function settleDurableMutation(
  label: string,
  mutate: (signal: AbortSignal) => Promise<unknown> | unknown,
  signal?: AbortSignal,
): Promise<unknown> {
  if (signal?.aborted) throw new SandboxDormantCreateBlockedError(`${label} blocked by cancellation before mutation`)
  const controller = new AbortController()
  let aborted = false
  let resolveAbort: (() => void) | undefined
  const abortPromise = new Promise<"aborted">((resolve) => { resolveAbort = () => resolve("aborted") })
  const onAbort = () => {
    aborted = true
    controller.abort()
    resolveAbort?.()
  }
  signal?.addEventListener("abort", onAbort, { once: true })
  let started: Promise<{ readonly ok: true; readonly value: unknown } | { readonly ok: false; readonly error: unknown }>
  try {
    started = Promise.resolve(mutate(controller.signal)).then(
      (result) => ({ ok: true as const, value: result }),
      (error) => ({ ok: false as const, error }),
    )
  } catch (error) {
    signal?.removeEventListener("abort", onAbort)
    throw new SandboxDormantCreateUnprovenError(`${label} mutation failed before settlement: ${error instanceof Error ? error.message : String(error)}`)
  }
  try {
    const first = signal === undefined ? await started : await Promise.race([started, abortPromise])
    if (first === "aborted") {
      const final = await started
      if (!final.ok) throw new SandboxDormantCreateUnprovenError(`${label} mutation failed after cancellation: ${final.error instanceof Error ? final.error.message : String(final.error)}`)
      throw new SandboxDormantCreateBlockedError(`${label} settled after caller cancellation; positive authority is withheld`)
    }
    if (!first.ok) throw new SandboxDormantCreateUnprovenError(`${label} mutation failed: ${first.error instanceof Error ? first.error.message : String(first.error)}`)
    if (aborted || signal?.aborted) throw new SandboxDormantCreateBlockedError(`${label} settled after caller cancellation; positive authority is withheld`)
    return first.value
  } finally {
    signal?.removeEventListener("abort", onAbort)
  }
}

function validateJsonSyntaxNoDuplicateKeys(text: string, label: string): void {
  let index = 0
  const length = text.length
  const whitespace = (char: string) => char === " " || char === "\t" || char === "\r" || char === "\n"
  const skip = () => { while (index < length && whitespace(text[index] ?? "")) index += 1 }
  const numberPattern = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/y
  const stringToken = (): string => {
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
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(index + 1, index + 5))) throw new TypeError(`${label} contains invalid JSON unicode escape`)
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
    if (depth > 64) throw new TypeError(`${label} exceeds JSON nesting depth`)
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
        if (keys.has(key)) throw new TypeError(`${label} contains duplicate JSON object key: ${key}`)
        keys.add(key)
        skip()
        if (text[index] !== ":") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1
        parseValue(depth + 1)
        skip()
        if (text[index] === "}") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON object syntax`)
        index += 1
      }
    }
    if (char === "[") {
      index += 1
      skip()
      if (text[index] === "]") { index += 1; return }
      for (;;) {
        parseValue(depth + 1)
        skip()
        if (text[index] === "]") { index += 1; return }
        if (text[index] !== ",") throw new TypeError(`${label} contains invalid JSON array syntax`)
        index += 1
      }
    }
    if (char === '"') { stringToken(); return }
    numberPattern.lastIndex = index
    const numeric = numberPattern.exec(text)
    if (numeric !== null) { index = numberPattern.lastIndex; return }
    for (const literal of ["true", "false", "null"] as const) {
      if (text.startsWith(literal, index)) { index += literal.length; return }
    }
    throw new TypeError(`${label} contains invalid JSON value syntax`)
  }
  parseValue(0)
  skip()
  if (index !== length) throw new TypeError(`${label} contains trailing JSON content`)
}

function parseJsonObject(body: Buffer, label: string): Record<string, unknown> {
  let text: string
  try { text = decoder.decode(body) }
  catch { throw new TypeError(`${label} must be valid UTF-8`) }
  validateJsonSyntaxNoDuplicateKeys(text, label)
  const parsed = JSON.parse(text) as unknown
  return asPlainRecord(parsed, label)
}

async function readResponseBody(response: IncomingMessage, maximum: number): Promise<Buffer> {
  return await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    let bytes = 0
    let settled = false
    const finishResolve = () => {
      if (settled) return
      settled = true
      resolve(Buffer.concat(chunks, bytes))
    }
    const finishReject = (error: unknown) => {
      if (settled) return
      settled = true
      reject(error)
    }
    response.on("data", (chunk: Buffer | string) => {
      const part = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      bytes += part.byteLength
      if (bytes > maximum) {
        const error = new Error("R4B-B1 Docker response exceeds byte bound")
        finishReject(error)
        response.destroy(error)
        return
      }
      chunks.push(part)
    })
    response.on("end", finishResolve)
    response.on("aborted", () => finishReject(new Error("R4B-B1 Docker response aborted")))
    response.on("error", finishReject)
  })
}

function dockerCreatePayload(permit: SandboxAdmissionPermit, prepared: SandboxDormantCreatePrepared): string {
  const requirement = permit.binding.requirement
  const payload = {
    Image: prepared.sourceReference,
    Entrypoint: [prepared.entrypointExecutable],
    Cmd: [...requirement.workload.entrypoint.args],
    AttachStdin: false,
    Tty: false,
    OpenStdin: false,
    StdinOnce: false,
    Healthcheck: { Test: ["NONE"] },
    Labels: { ...prepared.labels, [KDO_H4_R4B_B1_LABELS.bindingVersion]: KDO_H4_R3F_BINDING_VERSION },
    HostConfig: {
      Runtime: "runsc",
      NetworkMode: "none",
      NanoCpus: prepared.nanoCpus,
      Memory: prepared.memoryBytes,
      MemorySwap: prepared.memorySwapBytes,
      RestartPolicy: { Name: "no", MaximumRetryCount: 0 },
      Privileged: false,
    },
  }
  return JSON.stringify(payload)
}

type CreateRequestResult =
  | { readonly kind: "created"; readonly containerId: string }
  | { readonly kind: "rejected"; readonly statusCode: number; readonly detail: string }
  | { readonly kind: "indeterminate"; readonly detail: string }

async function postExactDormantCreate(
  runtime: TrustedGvisorDockerDormantCreateRuntime,
  permit: SandboxAdmissionPermit,
  prepared: SandboxDormantCreatePrepared,
  signal?: AbortSignal,
): Promise<CreateRequestResult> {
  if (signal?.aborted) throw new SandboxDormantCreateBlockedError("R4B-B1 Docker create blocked by cancellation before dispatch")
  requireSameSocketEndpoint(runtime)
  const body = Buffer.from(dockerCreatePayload(permit, prepared), "utf8")
  const path = `/v${KDO_H4_R4B_B1_DOCKER_API_VERSION}/containers/create?name=${encodeURIComponent(prepared.containerName)}`
  try {
    const response = await new Promise<{ readonly statusCode: number; readonly body: Buffer }>((resolve, reject) => {
      let settled = false
      let requestStarted = false
      const finishResolve = (value: { readonly statusCode: number; readonly body: Buffer }) => {
        if (settled) return
        settled = true
        signal?.removeEventListener("abort", onAbort)
        resolve(value)
      }
      const finishReject = (error: unknown) => {
        if (settled) return
        settled = true
        signal?.removeEventListener("abort", onAbort)
        reject(error)
      }
      const request = httpRequest({
        socketPath: runtime.socketPath,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": String(body.byteLength),
        },
      }, (incoming) => {
        void readResponseBody(incoming, KDO_H4_R4B_B1_RUNTIME_LIMITS.maxCreateResponseBytes).then(
          (responseBody) => finishResolve({ statusCode: incoming.statusCode ?? 0, body: responseBody }),
          finishReject,
        )
      })
      const onAbort = () => {
        const error = requestStarted
          ? new Error("R4B-B1 Docker create aborted after dispatch")
          : new SandboxDormantCreateBlockedError("R4B-B1 Docker create blocked by cancellation before dispatch")
        request.destroy(error)
        finishReject(error)
      }
      request.on("error", finishReject)
      request.setTimeout(KDO_H4_R4B_B1_RUNTIME_LIMITS.requestTimeoutMs, () => {
        const error = new Error("R4B-B1 Docker create request timed out")
        request.destroy(error)
        finishReject(error)
      })
      signal?.addEventListener("abort", onAbort, { once: true })
      if (signal?.aborted) { onAbort(); return }
      requestStarted = true
      request.end(body)
    })
    requireSameSocketEndpoint(runtime)
    if (response.statusCode !== 201) {
      const detail = response.body.byteLength === 0 ? `HTTP ${response.statusCode}` : decoder.decode(response.body).slice(0, 2048)
      return { kind: "rejected", statusCode: response.statusCode, detail }
    }
    const parsed = parseJsonObject(response.body, "R4B-B1 Docker create response")
    const keys = Object.keys(parsed).sort()
    if (keys.length !== 2 || keys[0] !== "Id" || keys[1] !== "Warnings") throw new TypeError("R4B-B1 Docker create response must contain exactly Id and Warnings")
    if (typeof parsed.Id !== "string" || !/^[0-9a-f]{64}$/.test(parsed.Id)) throw new TypeError("R4B-B1 Docker create response Id must be full lowercase container ID")
    if (parsed.Warnings !== null && (!Array.isArray(parsed.Warnings) || parsed.Warnings.length !== 0)) throw new TypeError("R4B-B1 Docker create response must not contain warnings")
    return { kind: "created", containerId: parsed.Id }
  } catch (error) {
    if (error instanceof SandboxDormantCreateBlockedError) throw error
    try { requireSameSocketEndpoint(runtime) }
    catch (endpointError) {
      return { kind: "indeterminate", detail: endpointError instanceof Error ? endpointError.message : String(endpointError) }
    }
    return { kind: "indeterminate", detail: error instanceof Error ? error.message : String(error) }
  }
}

function requiredRecord(record: Record<string, unknown>, key: string, label: string): Record<string, unknown> {
  return asPlainRecord(record[key], `${label}.${key}`)
}

function requiredString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key]
  if (typeof value !== "string") throw new TypeError(`${label}.${key} must be a string`)
  return value
}

function requiredBoolean(record: Record<string, unknown>, key: string, label: string): boolean {
  const value = record[key]
  if (typeof value !== "boolean") throw new TypeError(`${label}.${key} must be boolean`)
  return value
}

function requiredInteger(record: Record<string, unknown>, key: string, label: string): number {
  const value = record[key]
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new TypeError(`${label}.${key} must be a safe integer`)
  return value
}

function requiredStringArray(record: Record<string, unknown>, key: string, label: string): readonly string[] {
  const value = record[key]
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label}.${key} must be a plain array`)
  return Object.freeze(value.map((entry, index) => {
    if (typeof entry !== "string") throw new TypeError(`${label}.${key}[${index}] must be a string`)
    return entry
  }))
}

function optionalString(record: Record<string, unknown>, key: string, label: string): string {
  const value = record[key]
  if (value === undefined || value === null) return ""
  if (typeof value !== "string") throw new TypeError(`${label}.${key} must be absent, null, or a string`)
  return value
}

function optionalStringArray(record: Record<string, unknown>, key: string, label: string): readonly string[] {
  const value = record[key]
  if (value === undefined || value === null) return Object.freeze([])
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label}.${key} must be absent, null, or a plain array`)
  return Object.freeze(value.map((entry, index) => {
    if (typeof entry !== "string") throw new TypeError(`${label}.${key}[${index}] must be a string`)
    return entry
  }))
}

function sameStringArray(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index])
}

function optionalEmptyArray(record: Record<string, unknown>, key: string, label: string): void {
  const value = record[key]
  if (value === undefined || value === null) return
  if (!Array.isArray(value) || utilTypes.isProxy(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length !== 0) {
    throw new TypeError(`${label}.${key} must be absent, null, or an empty plain array`)
  }
}

function optionalEmptyRecord(record: Record<string, unknown>, key: string, label: string): void {
  const value = record[key]
  if (value === undefined || value === null) return
  const nested = asPlainRecord(value, `${label}.${key}`)
  if (Object.keys(nested).length !== 0) throw new TypeError(`${label}.${key} must be absent, null, or empty`)
}

function optionalFalse(record: Record<string, unknown>, key: string, label: string): void {
  const value = record[key]
  if (value === undefined || value === null) return
  if (value !== false) throw new TypeError(`${label}.${key} must be absent, null, or false`)
}

function optionalStringIn(record: Record<string, unknown>, key: string, allowed: readonly string[], label: string): void {
  const value = record[key]
  if (value === undefined || value === null) return
  if (typeof value !== "string" || !allowed.includes(value)) throw new TypeError(`${label}.${key} contains unadmitted authority`)
}

function requireNoUnadmittedHostAuthority(inspect: Record<string, unknown>, config: Record<string, unknown>, hostConfig: Record<string, unknown>): void {
  for (const key of ["Binds", "Links", "Dns", "DnsOptions", "DnsSearch", "ExtraHosts", "VolumesFrom", "CapAdd", "CapDrop", "GroupAdd", "Devices", "DeviceCgroupRules", "DeviceRequests", "Ulimits", "SecurityOpt", "Mounts"] as const) {
    optionalEmptyArray(hostConfig, key, "Docker inspect HostConfig")
  }
  for (const key of ["PortBindings", "StorageOpt", "Tmpfs", "Sysctls"] as const) {
    optionalEmptyRecord(hostConfig, key, "Docker inspect HostConfig")
  }
  for (const key of ["PublishAllPorts", "AutoRemove", "ReadonlyRootfs"] as const) {
    optionalFalse(hostConfig, key, "Docker inspect HostConfig")
  }
  optionalStringIn(hostConfig, "PidMode", [""], "Docker inspect HostConfig")
  optionalStringIn(hostConfig, "IpcMode", ["", "private"], "Docker inspect HostConfig")
  optionalStringIn(hostConfig, "UTSMode", [""], "Docker inspect HostConfig")
  optionalStringIn(hostConfig, "UsernsMode", [""], "Docker inspect HostConfig")
  optionalStringIn(hostConfig, "CgroupnsMode", ["", "private"], "Docker inspect HostConfig")
  optionalStringIn(hostConfig, "CgroupParent", [""], "Docker inspect HostConfig")
  optionalStringIn(hostConfig, "VolumeDriver", [""], "Docker inspect HostConfig")

  optionalFalse(config, "AttachStdin", "Docker inspect Config")
  optionalFalse(config, "OpenStdin", "Docker inspect Config")
  optionalFalse(config, "StdinOnce", "Docker inspect Config")
  optionalFalse(config, "NetworkDisabled", "Docker inspect Config")
  optionalEmptyRecord(config, "Volumes", "Docker inspect Config")

  const healthcheckValue = config.Healthcheck
  if (healthcheckValue !== undefined && healthcheckValue !== null) {
    const healthcheck = asPlainRecord(healthcheckValue, "Docker inspect Config.Healthcheck")
    const test = requiredStringArray(healthcheck, "Test", "Docker inspect Config.Healthcheck")
    if (test.length !== 1 || test[0] !== "NONE") throw new TypeError("Docker inspect Config.Healthcheck must be disabled")
  }

  const mounts = inspect.Mounts
  if (mounts !== undefined && mounts !== null) {
    if (!Array.isArray(mounts) || utilTypes.isProxy(mounts) || Object.getPrototypeOf(mounts) !== Array.prototype || mounts.length !== 0) {
      throw new TypeError("Docker inspect Mounts must be empty")
    }
  }
}

async function getExactImagePreflight(
  runtime: TrustedGvisorDockerDormantCreateRuntime,
  prepared: SandboxDormantCreatePrepared,
  signal?: AbortSignal,
): Promise<DockerImagePreflight> {
  if (signal?.aborted) throw new SandboxDormantCreateBlockedError("R4B-B1 image preflight blocked by cancellation before Docker read")
  requireSameSocketEndpoint(runtime)
  const path = `/v${KDO_H4_R4B_B1_DOCKER_API_VERSION}/images/${encodeURIComponent(prepared.sourceReference)}/json`
  const response = await new Promise<{ readonly statusCode: number; readonly body: Buffer }>((resolve, reject) => {
    let settled = false
    const finishResolve = (value: { readonly statusCode: number; readonly body: Buffer }) => {
      if (settled) return
      settled = true
      signal?.removeEventListener("abort", onAbort)
      resolve(value)
    }
    const finishReject = (error: unknown) => {
      if (settled) return
      settled = true
      signal?.removeEventListener("abort", onAbort)
      reject(error)
    }
    const request = httpRequest({ socketPath: runtime.socketPath, path, method: "GET" }, (incoming) => {
      void readResponseBody(incoming, KDO_H4_R4B_B1_RUNTIME_LIMITS.maxInspectResponseBytes).then(
        (responseBody) => finishResolve({ statusCode: incoming.statusCode ?? 0, body: responseBody }),
        finishReject,
      )
    })
    const onAbort = () => {
      const error = new SandboxDormantCreateBlockedError("R4B-B1 image preflight blocked by cancellation during Docker read")
      request.destroy(error)
      finishReject(error)
    }
    request.on("error", finishReject)
    request.setTimeout(KDO_H4_R4B_B1_RUNTIME_LIMITS.requestTimeoutMs, () => {
      const error = new Error("R4B-B1 Docker image preflight timed out")
      request.destroy(error)
      finishReject(error)
    })
    signal?.addEventListener("abort", onAbort, { once: true })
    if (signal?.aborted) { onAbort(); return }
    request.end()
  })
  requireSameSocketEndpoint(runtime)
  if (response.statusCode !== 200) throw new SandboxDormantCreateIndeterminateError(`R4B-B1 exact image preflight failed with HTTP ${response.statusCode}`)
  const image = parseJsonObject(response.body, "R4B-B1 Docker image preflight response")
  const imageId = requiredString(image, "Id", "Docker image preflight")
  if (!DOCKER_IMAGE_ID.test(imageId)) throw new TypeError("Docker image preflight Id must be an exact sha256 image ID")
  const descriptor = requiredRecord(image, "Descriptor", "Docker image preflight")
  const manifestDigest = requiredString(descriptor, "digest", "Docker image preflight Descriptor")
  if (manifestDigest !== prepared.sourceDigest) throw new TypeError("Docker image preflight manifest digest does not match admitted source digest")
  const imageConfig = requiredRecord(image, "Config", "Docker image preflight")
  optionalEmptyRecord(imageConfig, "Volumes", "Docker image preflight Config")
  const user = optionalString(imageConfig, "User", "Docker image preflight Config")
  const env = optionalStringArray(imageConfig, "Env", "Docker image preflight Config")
  const workingDir = optionalString(imageConfig, "WorkingDir", "Docker image preflight Config")
  return Object.freeze({ imageId, manifestDigest, user, env, workingDir })
}

async function getExactDormantInspect(
  runtime: TrustedGvisorDockerDormantCreateRuntime,
  permit: SandboxAdmissionPermit,
  prepared: SandboxDormantCreatePrepared,
  imagePreflight: DockerImagePreflight,
  signal?: AbortSignal,
): Promise<SandboxDormantDockerObservation | null> {
  if (signal?.aborted) throw new SandboxDormantCreateBlockedError("R4B-B1 reconciliation blocked by cancellation before Docker read")
  requireSameSocketEndpoint(runtime)
  const path = `/v${KDO_H4_R4B_B1_DOCKER_API_VERSION}/containers/${encodeURIComponent(prepared.containerName)}/json`
  const response = await new Promise<{ readonly statusCode: number; readonly body: Buffer }>((resolve, reject) => {
    let settled = false
    const finishResolve = (value: { readonly statusCode: number; readonly body: Buffer }) => {
      if (settled) return
      settled = true
      signal?.removeEventListener("abort", onAbort)
      resolve(value)
    }
    const finishReject = (error: unknown) => {
      if (settled) return
      settled = true
      signal?.removeEventListener("abort", onAbort)
      reject(error)
    }
    const request = httpRequest({ socketPath: runtime.socketPath, path, method: "GET" }, (incoming) => {
      void readResponseBody(incoming, KDO_H4_R4B_B1_RUNTIME_LIMITS.maxInspectResponseBytes).then(
        (responseBody) => finishResolve({ statusCode: incoming.statusCode ?? 0, body: responseBody }),
        finishReject,
      )
    })
    const onAbort = () => {
      const error = new SandboxDormantCreateBlockedError("R4B-B1 reconciliation blocked by cancellation during Docker read")
      request.destroy(error)
      finishReject(error)
    }
    request.on("error", finishReject)
    request.setTimeout(KDO_H4_R4B_B1_RUNTIME_LIMITS.requestTimeoutMs, () => {
      const error = new Error("R4B-B1 Docker inspect request timed out")
      request.destroy(error)
      finishReject(error)
    })
    signal?.addEventListener("abort", onAbort, { once: true })
    if (signal?.aborted) { onAbort(); return }
    request.end()
  })
  requireSameSocketEndpoint(runtime)
  if (response.statusCode === 404) return null
  if (response.statusCode !== 200) throw new SandboxDormantCreateIndeterminateError(`R4B-B1 Docker reconciliation inspect failed with HTTP ${response.statusCode}`)
  const inspect = parseJsonObject(response.body, "R4B-B1 Docker inspect response")
  const id = requiredString(inspect, "Id", "Docker inspect")
  if (!/^[0-9a-f]{64}$/.test(id)) throw new TypeError("Docker inspect Id must be full lowercase container ID")
  if (requiredString(inspect, "Name", "Docker inspect") !== `/${prepared.containerName}`) throw new TypeError("Docker inspect Name does not match deterministic R4B-B1 container name")
  if (requiredString(inspect, "Image", "Docker inspect") !== imagePreflight.imageId) throw new TypeError("Docker inspect Image does not match exact preflight image ID")
  if (requiredString(inspect, "Path", "Docker inspect") !== prepared.entrypointExecutable) throw new TypeError("Docker inspect Path does not match admitted executable")
  const args = requiredStringArray(inspect, "Args", "Docker inspect")
  const expectedArgs = permit.binding.requirement.workload.entrypoint.args
  if (args.length !== expectedArgs.length || args.some((arg, index) => arg !== expectedArgs[index])) throw new TypeError("Docker inspect Args do not match admitted arguments")

  const state = requiredRecord(inspect, "State", "Docker inspect")
  if (requiredString(state, "Status", "Docker inspect State") !== "created") throw new TypeError("R4B-B1 Docker container must remain in pristine created state")
  const running = requiredBoolean(state, "Running", "Docker inspect State")
  const paused = requiredBoolean(state, "Paused", "Docker inspect State")
  const restarting = requiredBoolean(state, "Restarting", "Docker inspect State")
  const dead = requiredBoolean(state, "Dead", "Docker inspect State")
  const pid = requiredInteger(state, "Pid", "Docker inspect State")
  const restartCount = requiredInteger(inspect, "RestartCount", "Docker inspect")

  const config = requiredRecord(inspect, "Config", "Docker inspect")
  if (requiredString(config, "Image", "Docker inspect Config") !== prepared.sourceReference) throw new TypeError("Docker inspect Config.Image does not match exact admitted source reference")
  const observedUser = optionalString(config, "User", "Docker inspect Config")
  if (observedUser !== imagePreflight.user) throw new TypeError("Docker inspect Config.User does not match exact image preflight Config.User")
  const observedEnv = optionalStringArray(config, "Env", "Docker inspect Config")
  if (!sameStringArray(observedEnv, imagePreflight.env)) throw new TypeError("Docker inspect Config.Env does not match exact image preflight Config.Env")
  const observedWorkingDir = optionalString(config, "WorkingDir", "Docker inspect Config")
  if (observedWorkingDir !== imagePreflight.workingDir) throw new TypeError("Docker inspect Config.WorkingDir does not match exact image preflight Config.WorkingDir")
  const tty = requiredBoolean(config, "Tty", "Docker inspect Config")
  const labelsRecord = requiredRecord(config, "Labels", "Docker inspect Config")
  const expectedLabels: Record<string, string> = { ...prepared.labels, [KDO_H4_R4B_B1_LABELS.bindingVersion]: KDO_H4_R3F_BINDING_VERSION }
  for (const [key, wanted] of Object.entries(expectedLabels)) {
    if (labelsRecord[key] !== wanted) throw new TypeError(`Docker inspect required label mismatch: ${key}`)
  }

  const hostConfig = requiredRecord(inspect, "HostConfig", "Docker inspect")
  const runtimeName = requiredString(hostConfig, "Runtime", "Docker inspect HostConfig")
  const networkMode = requiredString(hostConfig, "NetworkMode", "Docker inspect HostConfig")
  const privileged = requiredBoolean(hostConfig, "Privileged", "Docker inspect HostConfig")
  const nanoCpus = requiredInteger(hostConfig, "NanoCpus", "Docker inspect HostConfig")
  const memoryBytes = requiredInteger(hostConfig, "Memory", "Docker inspect HostConfig")
  const memorySwapBytes = requiredInteger(hostConfig, "MemorySwap", "Docker inspect HostConfig")
  const restartPolicyRecord = requiredRecord(hostConfig, "RestartPolicy", "Docker inspect HostConfig")
  const restartPolicy = requiredString(restartPolicyRecord, "Name", "Docker inspect HostConfig.RestartPolicy")
  if (requiredInteger(restartPolicyRecord, "MaximumRetryCount", "Docker inspect HostConfig.RestartPolicy") !== 0) throw new TypeError("Docker restart MaximumRetryCount must be zero")
  requireNoUnadmittedHostAuthority(inspect, config, hostConfig)

  const networkSettings = requiredRecord(inspect, "NetworkSettings", "Docker inspect")
  const networks = requiredRecord(networkSettings, "Networks", "Docker inspect NetworkSettings")
  const networkKeys = Object.keys(networks).sort()
  if (networkKeys.some((key) => key !== "none") || networkKeys.length > 1) {
    throw new TypeError("R4B-B1 Docker NetworkSettings.Networks may contain only the canonical none endpoint")
  }
  if (networkKeys.length === 1) requiredRecord(networks, "none", "Docker inspect NetworkSettings.Networks")
  const networkAttachmentCount = 0

  return createSandboxDormantDockerObservation({
    socketEndpointIdentity: runtime.socketEndpoint.endpointIdentity,
    containerId: id,
    containerName: prepared.containerName,
    imageManifestDigest: imagePreflight.manifestDigest,
    executable: prepared.entrypointExecutable,
    argsIdentity: prepared.argsIdentity,
    runtimeName,
    networkMode,
    networkAttachmentCount,
    nanoCpus,
    memoryBytes,
    memorySwapBytes,
    restartCount,
    restartPolicy,
    privileged,
    tty,
    running,
    paused,
    restarting,
    dead,
    pid,
    labels: labelsRecord,
  }, prepared, permit)
}

export class GvisorDockerDormantCreateGateway {
  readonly #runtime: TrustedGvisorDockerDormantCreateRuntime

  constructor(runtime: unknown) {
    this.#runtime = requireTrustedRuntime(runtime)
  }

  async createDormantAdmission(
    permitValue: unknown,
    permitCommitValue: unknown,
    options: { readonly signal?: AbortSignal } = {},
  ): Promise<GvisorDockerDormantCreateResult> {
    const permit = validateSandboxAdmissionPermit(permitValue)
    const permitCommit = validateSandboxAdmissionPermitCommit(permitCommitValue, permit)
    if (options.signal?.aborted) throw new SandboxDormantCreateBlockedError("R4B-B1 admission was cancelled before reservation")

    const reservation = createCanonicalR4BB1Reservation(permit)
    const reservationCommitValue = await settleDurableMutation(
      "R4B-B1 reservation",
      (signal) => this.#runtime.commitReservation(reservation, { signal }),
      options.signal,
    )
    const reservationCommit = validateSandboxAdmissionConsumptionReservationCommit(reservationCommitValue, reservation, permit)

    const prepared = createSandboxDormantCreatePrepared(permit, reservation)
    const preparedCommitValue = await settleDurableMutation(
      "R4B-B1 create preparation",
      (signal) => this.#runtime.commitCreatePrepared(prepared, { signal }),
      options.signal,
    )
    const preparedCommit = validateSandboxDormantCreatePreparedCommit(preparedCommitValue, prepared, permit)

    let imagePreflight: DockerImagePreflight
    try {
      imagePreflight = await getExactImagePreflight(this.#runtime, prepared, options.signal)
    } catch (error) {
      if (error instanceof SandboxDormantCreateBlockedError) throw error
      throw new SandboxDormantCreateIndeterminateError(`R4B-B1 exact image preflight failed before dispatch authority: ${error instanceof Error ? error.message : String(error)}`)
    }

    const dispatchClaim = createSandboxDormantCreateDispatchClaim(prepared)
    const dispatchClaimCommitValue = await settleDurableMutation(
      "R4B-B1 create dispatch claim",
      (signal) => this.#runtime.commitCreateDispatchClaim(dispatchClaim, { signal }),
      options.signal,
    )
    const dispatchClaimCommit = validateSandboxDormantCreateDispatchClaimCommit(dispatchClaimCommitValue, dispatchClaim)

    let createResult: CreateRequestResult | undefined
    if (dispatchClaimCommit.disposition === "created") {
      if (options.signal?.aborted) throw new SandboxDormantCreateBlockedError("R4B-B1 admission was cancelled after durable dispatch claim and before Docker mutation; the claimed attempt remains non-reusable")
      createResult = await postExactDormantCreate(this.#runtime, permit, prepared, options.signal)
    }

    let observation: SandboxDormantDockerObservation | null
    try {
      observation = await getExactDormantInspect(this.#runtime, permit, prepared, imagePreflight, options.signal)
    } catch (error) {
      if (error instanceof SandboxDormantCreateBlockedError) throw error
      throw new SandboxDormantCreateIndeterminateError(`R4B-B1 exact dormant reconciliation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    if (observation === null) {
      if (createResult?.kind === "rejected") {
        throw new SandboxDormantCreateRejectedError(`R4B-B1 Docker create was rejected and exact reconciliation found no dormant candidate: ${createResult.detail}`)
      }
      const detail = createResult?.kind === "indeterminate"
        ? createResult.detail
        : dispatchClaimCommit.disposition === "existing"
          ? "durable dispatch claim already existed and deterministic container was not found; retry is forbidden"
          : "deterministic container was not found"
      throw new SandboxDormantCreateIndeterminateError(`R4B-B1 create outcome remains indeterminate: ${detail}`)
    }
    if (createResult?.kind === "created" && observation.containerId !== createResult.containerId) {
      throw new SandboxDormantCreateIndeterminateError("R4B-B1 create response container ID disagrees with exact reconciliation")
    }

    const createdAdmission = createSandboxDormantCreatedAdmission(prepared, observation, permit)
    const internalController = new AbortController()
    const createdCommitRaw = await settleDurableMutation(
      "R4B-B1 created admission",
      (signal) => this.#runtime.commitCreatedAdmission(createdAdmission, { signal }),
      internalController.signal,
    )
    const createdAdmissionCommit = validateSandboxDormantCreatedAdmissionCommit(createdCommitRaw, createdAdmission, permit)

    if (options.signal?.aborted) {
      throw new SandboxDormantCreateBlockedError("R4B-B1 dormant state was reconciled and durably recorded after caller cancellation; positive authority is withheld")
    }

    return Object.freeze({
      permit,
      permitCommit,
      reservation,
      reservationCommit,
      prepared,
      preparedCommit,
      observation,
      createdAdmission,
      createdAdmissionCommit,
      recovered: preparedCommit.disposition === "existing" || dispatchClaimCommit.disposition === "existing" || (createResult !== undefined && createResult.kind !== "created"),
    })
  }
}
