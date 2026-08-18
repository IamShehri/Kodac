import { createHash, type Hash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  validateSandboxExecutionRequirement,
  type SandboxExecutionRequirement,
} from "./sandbox-backend-evidence.ts"

export const KDO_H4_R3G_E_CAPABILITY = "runtime.enforce.gvisor.output-bound" as const
export const KDO_H4_R3G_E_OUTPUT_VERSION = "kodac-h4-r3g-e-output-bound-v1" as const
export const KDO_H4_R3G_E_EVIDENCE_CLASS = "e3-output-bound-candidate" as const
export const KDO_H4_R3G_E_COMMIT_VERSION = "kodac-h4-r3g-e-output-bound-commit-v1" as const
export const KDO_H4_R3G_E_PARSER_VERSION = "kodac-h4-r3g-e-docker-multiplex-parser-v1" as const
export const KDO_H4_R3G_E_DOCKER_API_VERSION = "1.48" as const
export const KDO_H4_R3G_E_MOBY_SOURCE_COMMIT = "d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3" as const
export const KDO_H4_R3G_E_MOBY_API_BLOB = "7b11c5d00028046576aad721c6a5fc83cbac4fa9" as const

export const KDO_H4_R3G_E_LIMITS = Object.freeze({
  maxOutputBytes: 16_777_216,
  dockerFrameHeaderBytes: 8,
} as const)

export type GvisorOutputStream = "stdout" | "stderr"

export interface GvisorOutputAggregationResult {
  readonly acceptedStdoutBytes: number
  readonly acceptedStderrBytes: number
  readonly acceptedAggregateBytes: number
  readonly stdoutDigest: string
  readonly stderrDigest: string
  readonly aggregateTranscriptDigest: string
  readonly stdout: Buffer
  readonly stderr: Buffer
}

export interface GvisorOutputBoundRecord {
  readonly version: typeof KDO_H4_R3G_E_OUTPUT_VERSION
  readonly evidenceClass: typeof KDO_H4_R3G_E_EVIDENCE_CLASS
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
  readonly maxOutputBytes: number
  readonly acceptedStdoutBytes: number
  readonly acceptedStderrBytes: number
  readonly acceptedAggregateBytes: number
  readonly stdoutDigest: string
  readonly stderrDigest: string
  readonly aggregateTranscriptDigest: string
  readonly terminalEvidenceIdentity: string
  readonly outputObserverImplementationIdentity: string
  readonly recordIdentity: string
}

export interface GvisorOutputBoundCommit {
  readonly version: typeof KDO_H4_R3G_E_COMMIT_VERSION
  readonly recordIdentity: string
  readonly commitIdentity: string
}

const SHA256 = /^[0-9a-f]{64}$/
const FULL_CONTAINER_ID = /^[0-9a-f]{64}$/

function sha256Domain(domain: string, parts: readonly (string | number)[]): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H4-R3G-E\0${domain}\0V1\0`, "ascii"))
    .update(Buffer.from(JSON.stringify(parts), "utf8"))
    .digest("hex")
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

function fullContainerId(value: unknown): string {
  if (typeof value !== "string" || !FULL_CONTAINER_ID.test(value)) throw new TypeError("containerId must be exactly 64 lowercase hexadecimal characters")
  return value
}

function outputBytes(value: unknown, label: string, maximum: number = KDO_H4_R3G_E_LIMITS.maxOutputBytes): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > maximum) {
    throw new TypeError(`${label} must be a safe integer in 0..${maximum}`)
  }
  return value
}

function maxOutputBytes(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0 || value > KDO_H4_R3G_E_LIMITS.maxOutputBytes) {
    throw new TypeError(`maxOutputBytes must be a safe integer in 1..${KDO_H4_R3G_E_LIMITS.maxOutputBytes}`)
  }
  return value
}

function seedHash(domain: string): Hash {
  return createHash("sha256").update(Buffer.from(`KODAC-H4-R3G-E\0${domain}\0V1\0`, "ascii"))
}

export class GvisorOutputLimitExceededError extends Error {
  readonly limitBytes: number
  readonly acceptedBytes: number
  readonly rejectedFrameBytes: number

  constructor(limitBytes: number, acceptedBytes: number, rejectedFrameBytes: number) {
    super(`R3G-E aggregate stdout/stderr output would exceed ${limitBytes} bytes`)
    this.name = "GvisorOutputLimitExceededError"
    this.limitBytes = limitBytes
    this.acceptedBytes = acceptedBytes
    this.rejectedFrameBytes = rejectedFrameBytes
  }
}

export function createGvisorOutputObserverImplementationIdentity(): string {
  return sha256Domain("OUTPUT_OBSERVER_IMPLEMENTATION", [
    KDO_H4_R3G_E_OUTPUT_VERSION,
    KDO_H4_R3G_E_PARSER_VERSION,
    KDO_H4_R3G_E_DOCKER_API_VERSION,
    KDO_H4_R3G_E_MOBY_SOURCE_COMMIT,
    KDO_H4_R3G_E_MOBY_API_BLOB,
  ])
}

export function createGvisorOutputChannelIdentity(input: {
  executionAttemptIdentity: string
  requirementIdentity: string
  workloadIdentity: string
  containerBindingIdentity: string
  containerId: string
  providerIdentity: string
  socketEndpointIdentity: string
}): string {
  const record = asPlainRecord(input, "R3G-E output channel identity input")
  exactKeys(record, [
    "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity",
    "containerId", "providerIdentity", "socketEndpointIdentity",
  ], "R3G-E output channel identity input")
  return sha256Domain("OUTPUT_CHANNEL", [
    KDO_H4_R3G_E_DOCKER_API_VERSION,
    identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    identity(record.requirementIdentity, "requirementIdentity"),
    identity(record.workloadIdentity, "workloadIdentity"),
    identity(record.containerBindingIdentity, "containerBindingIdentity"),
    fullContainerId(record.containerId),
    identity(record.providerIdentity, "providerIdentity"),
    identity(record.socketEndpointIdentity, "socketEndpointIdentity"),
  ])
}

export function createGvisorOutputOperationIdentity(input: {
  outputChannelIdentity: string
  executionAttemptIdentity: string
  requirementIdentity: string
  workloadIdentity: string
  maxOutputBytes: number
}): string {
  const record = asPlainRecord(input, "R3G-E output operation identity input")
  exactKeys(record, ["outputChannelIdentity", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "maxOutputBytes"], "R3G-E output operation identity input")
  return sha256Domain("OUTPUT_OPERATION", [
    identity(record.outputChannelIdentity, "outputChannelIdentity"),
    identity(record.executionAttemptIdentity, "executionAttemptIdentity"),
    identity(record.requirementIdentity, "requirementIdentity"),
    identity(record.workloadIdentity, "workloadIdentity"),
    maxOutputBytes(record.maxOutputBytes),
  ])
}

/**
 * Incrementally parses Docker's non-TTY stdcopy framing without trusting text
 * decoding, frame-sized allocations, or independent stdout/stderr budgets.
 */
export class GvisorDockerMultiplexAccumulator {
  readonly maxOutputBytes: number

  #header = Buffer.alloc(KDO_H4_R3G_E_LIMITS.dockerFrameHeaderBytes)
  #headerBytes = 0
  #frameRemaining = 0
  #frameStream: 1 | 2 | 0 = 0
  #stdoutBytes = 0
  #stderrBytes = 0
  #aggregateBytes = 0
  #stdoutChunks: Buffer[] = []
  #stderrChunks: Buffer[] = []
  #stdoutHash = seedHash("STDOUT_PAYLOAD")
  #stderrHash = seedHash("STDERR_PAYLOAD")
  #transcriptHash = seedHash("AGGREGATE_FRAME_TRANSCRIPT")
  #terminal = false

  constructor(limitBytes: number) {
    this.maxOutputBytes = maxOutputBytes(limitBytes)
  }

  push(chunkValue: Buffer | Uint8Array): void {
    if (this.#terminal) throw new Error("R3G-E output accumulator is already terminal")
    if (!(Buffer.isBuffer(chunkValue) || chunkValue instanceof Uint8Array)) throw new TypeError("R3G-E output chunk must be Buffer or Uint8Array")
    const chunk = Buffer.isBuffer(chunkValue)
      ? chunkValue
      : Buffer.from(chunkValue.buffer, chunkValue.byteOffset, chunkValue.byteLength)
    let offset = 0
    try {
      while (offset < chunk.byteLength) {
        if (this.#frameRemaining === 0) {
          const needed = KDO_H4_R3G_E_LIMITS.dockerFrameHeaderBytes - this.#headerBytes
          const take = Math.min(needed, chunk.byteLength - offset)
          chunk.copy(this.#header, this.#headerBytes, offset, offset + take)
          this.#headerBytes += take
          offset += take
          if (this.#headerBytes !== KDO_H4_R3G_E_LIMITS.dockerFrameHeaderBytes) continue

          const stream = this.#header[0]
          if (stream !== 1 && stream !== 2) throw new TypeError(`R3G-E Docker stream type must be stdout(1) or stderr(2); received ${String(stream)}`)
          if (this.#header[1] !== 0 || this.#header[2] !== 0 || this.#header[3] !== 0) {
            throw new TypeError("R3G-E Docker multiplex reserved header bytes must be zero")
          }
          const payloadBytes = this.#header.readUInt32BE(4)
          this.#headerBytes = 0
          if (this.#aggregateBytes + payloadBytes > this.maxOutputBytes) {
            throw new GvisorOutputLimitExceededError(this.maxOutputBytes, this.#aggregateBytes, payloadBytes)
          }
          this.#frameStream = stream
          this.#frameRemaining = payloadBytes
          const semanticHeader = Buffer.allocUnsafe(5)
          semanticHeader[0] = stream
          semanticHeader.writeUInt32BE(payloadBytes, 1)
          this.#transcriptHash.update(semanticHeader)
          if (payloadBytes === 0) this.#frameStream = 0
          continue
        }

        const take = Math.min(this.#frameRemaining, chunk.byteLength - offset)
        const payload = chunk.subarray(offset, offset + take)
        const retained = Buffer.from(payload)
        if (this.#frameStream === 1) {
          this.#stdoutHash.update(payload)
          this.#stdoutChunks.push(retained)
          this.#stdoutBytes += take
        } else if (this.#frameStream === 2) {
          this.#stderrHash.update(payload)
          this.#stderrChunks.push(retained)
          this.#stderrBytes += take
        } else {
          throw new Error("R3G-E parser reached payload without a trusted stream type")
        }
        this.#transcriptHash.update(payload)
        this.#aggregateBytes += take
        this.#frameRemaining -= take
        offset += take
        if (this.#frameRemaining === 0) this.#frameStream = 0
      }
    } catch (error) {
      this.#terminal = true
      throw error
    }
  }

  finish(): GvisorOutputAggregationResult {
    if (this.#terminal) throw new Error("R3G-E output accumulator is already terminal")
    this.#terminal = true
    if (this.#headerBytes !== 0) throw new TypeError("R3G-E Docker multiplex stream ended with a truncated 8-byte header")
    if (this.#frameRemaining !== 0) throw new TypeError("R3G-E Docker multiplex stream ended with a truncated payload")
    if (this.#stdoutBytes + this.#stderrBytes !== this.#aggregateBytes) throw new Error("R3G-E aggregate byte accounting invariant failed")
    return Object.freeze({
      acceptedStdoutBytes: this.#stdoutBytes,
      acceptedStderrBytes: this.#stderrBytes,
      acceptedAggregateBytes: this.#aggregateBytes,
      stdoutDigest: this.#stdoutHash.digest("hex"),
      stderrDigest: this.#stderrHash.digest("hex"),
      aggregateTranscriptDigest: this.#transcriptHash.digest("hex"),
      stdout: Buffer.concat(this.#stdoutChunks, this.#stdoutBytes),
      stderr: Buffer.concat(this.#stderrChunks, this.#stderrBytes),
    })
  }
}

function validateAggregation(value: unknown, maximum: number): Omit<GvisorOutputAggregationResult, "stdout" | "stderr"> {
  const record = asPlainRecord(value, "R3G-E output aggregation")
  exactKeys(record, ["acceptedStdoutBytes", "acceptedStderrBytes", "acceptedAggregateBytes", "stdoutDigest", "stderrDigest", "aggregateTranscriptDigest"], "R3G-E output aggregation")
  const acceptedStdoutBytes = outputBytes(record.acceptedStdoutBytes, "acceptedStdoutBytes", maximum)
  const acceptedStderrBytes = outputBytes(record.acceptedStderrBytes, "acceptedStderrBytes", maximum)
  const acceptedAggregateBytes = outputBytes(record.acceptedAggregateBytes, "acceptedAggregateBytes", maximum)
  if (acceptedStdoutBytes + acceptedStderrBytes !== acceptedAggregateBytes) throw new TypeError("R3G-E acceptedAggregateBytes must equal stdout+stderr")
  return Object.freeze({
    acceptedStdoutBytes,
    acceptedStderrBytes,
    acceptedAggregateBytes,
    stdoutDigest: identity(record.stdoutDigest, "stdoutDigest"),
    stderrDigest: identity(record.stderrDigest, "stderrDigest"),
    aggregateTranscriptDigest: identity(record.aggregateTranscriptDigest, "aggregateTranscriptDigest"),
  })
}

function recordPreimage(input: Omit<GvisorOutputBoundRecord, "recordIdentity">): readonly (string | number)[] {
  return [
    input.version,
    input.evidenceClass,
    input.executionAttemptIdentity,
    input.requirementIdentity,
    input.workloadIdentity,
    input.containerBindingIdentity,
    input.containerId,
    input.runtimeInstanceIdentity,
    input.providerIdentity,
    input.socketEndpointIdentity,
    input.outputChannelIdentity,
    input.outputOperationIdentity,
    input.maxOutputBytes,
    input.acceptedStdoutBytes,
    input.acceptedStderrBytes,
    input.acceptedAggregateBytes,
    input.stdoutDigest,
    input.stderrDigest,
    input.aggregateTranscriptDigest,
    input.terminalEvidenceIdentity,
    input.outputObserverImplementationIdentity,
  ]
}

export function createGvisorOutputBoundRecord(input: {
  executionAttemptIdentity: string
  requirement: SandboxExecutionRequirement
  containerBindingIdentity: string
  containerId: string
  runtimeInstanceIdentity: string
  providerIdentity: string
  socketEndpointIdentity: string
  outputChannelIdentity: string
  aggregation: Omit<GvisorOutputAggregationResult, "stdout" | "stderr">
  terminalEvidenceIdentity: string
}): GvisorOutputBoundRecord {
  const record = asPlainRecord(input, "R3G-E output-bound record input")
  exactKeys(record, [
    "executionAttemptIdentity", "requirement", "containerBindingIdentity", "containerId", "runtimeInstanceIdentity",
    "providerIdentity", "socketEndpointIdentity", "outputChannelIdentity", "aggregation", "terminalEvidenceIdentity",
  ], "R3G-E output-bound record input")
  const requirement = validateSandboxExecutionRequirement(record.requirement)
  if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new TypeError("R3G-E requires requiredSemanticRuntimeClass=gvisor")
  const limit = requirement.workload.resourcePolicy.maxOutputBytes
  const aggregation = validateAggregation(record.aggregation, limit)
  const executionAttemptIdentity = identity(record.executionAttemptIdentity, "executionAttemptIdentity")
  const containerBindingIdentity = identity(record.containerBindingIdentity, "containerBindingIdentity")
  const containerId = fullContainerId(record.containerId)
  const providerIdentity = identity(record.providerIdentity, "providerIdentity")
  const socketEndpointIdentity = identity(record.socketEndpointIdentity, "socketEndpointIdentity")
  const expectedOutputChannelIdentity = createGvisorOutputChannelIdentity({
    executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity,
    containerId,
    providerIdentity,
    socketEndpointIdentity,
  })
  const outputChannelIdentity = identity(record.outputChannelIdentity, "outputChannelIdentity")
  if (outputChannelIdentity !== expectedOutputChannelIdentity) throw new TypeError("R3G-E output channel identity mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_E_OUTPUT_VERSION,
    evidenceClass: KDO_H4_R3G_E_EVIDENCE_CLASS,
    executionAttemptIdentity,
    requirementIdentity: requirement.requirementIdentity,
    workloadIdentity: requirement.workload.workloadIdentity,
    containerBindingIdentity,
    containerId,
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    providerIdentity,
    socketEndpointIdentity,
    outputChannelIdentity,
    outputOperationIdentity: createGvisorOutputOperationIdentity({
      outputChannelIdentity,
      executionAttemptIdentity,
      requirementIdentity: requirement.requirementIdentity,
      workloadIdentity: requirement.workload.workloadIdentity,
      maxOutputBytes: limit,
    }),
    maxOutputBytes: limit,
    ...aggregation,
    terminalEvidenceIdentity: identity(record.terminalEvidenceIdentity, "terminalEvidenceIdentity"),
    outputObserverImplementationIdentity: createGvisorOutputObserverImplementationIdentity(),
  })
  return Object.freeze({ ...base, recordIdentity: sha256Domain("OUTPUT_BOUND_RECORD", recordPreimage(base)) })
}

export function validateGvisorOutputBoundRecord(value: unknown, requirementValue?: SandboxExecutionRequirement): GvisorOutputBoundRecord {
  const record = asPlainRecord(value, "R3G-E output-bound record")
  exactKeys(record, [
    "version", "evidenceClass", "executionAttemptIdentity", "requirementIdentity", "workloadIdentity", "containerBindingIdentity",
    "containerId", "runtimeInstanceIdentity", "providerIdentity", "socketEndpointIdentity", "outputChannelIdentity",
    "outputOperationIdentity", "maxOutputBytes", "acceptedStdoutBytes", "acceptedStderrBytes", "acceptedAggregateBytes",
    "stdoutDigest", "stderrDigest", "aggregateTranscriptDigest", "terminalEvidenceIdentity", "outputObserverImplementationIdentity", "recordIdentity",
  ], "R3G-E output-bound record")
  if (record.version !== KDO_H4_R3G_E_OUTPUT_VERSION || record.evidenceClass !== KDO_H4_R3G_E_EVIDENCE_CLASS) {
    throw new TypeError("R3G-E output-bound version/evidence class mismatch")
  }
  const limit = maxOutputBytes(record.maxOutputBytes)
  const aggregation = validateAggregation({
    acceptedStdoutBytes: record.acceptedStdoutBytes,
    acceptedStderrBytes: record.acceptedStderrBytes,
    acceptedAggregateBytes: record.acceptedAggregateBytes,
    stdoutDigest: record.stdoutDigest,
    stderrDigest: record.stderrDigest,
    aggregateTranscriptDigest: record.aggregateTranscriptDigest,
  }, limit)
  const executionAttemptIdentity = identity(record.executionAttemptIdentity, "executionAttemptIdentity")
  const requirementIdentity = identity(record.requirementIdentity, "requirementIdentity")
  const workloadIdentity = identity(record.workloadIdentity, "workloadIdentity")
  if (requirementValue !== undefined) {
    const requirement = validateSandboxExecutionRequirement(requirementValue)
    if (requirement.requirementIdentity !== requirementIdentity || requirement.workload.workloadIdentity !== workloadIdentity) {
      throw new TypeError("R3G-E record does not match expected requirement/workload identity")
    }
    if (requirement.workload.resourcePolicy.maxOutputBytes !== limit) throw new TypeError("R3G-E record maxOutputBytes does not match expected requirement")
  }
  const containerBindingIdentity = identity(record.containerBindingIdentity, "containerBindingIdentity")
  const containerId = fullContainerId(record.containerId)
  const providerIdentity = identity(record.providerIdentity, "providerIdentity")
  const socketEndpointIdentity = identity(record.socketEndpointIdentity, "socketEndpointIdentity")
  const expectedOutputChannelIdentity = createGvisorOutputChannelIdentity({
    executionAttemptIdentity,
    requirementIdentity,
    workloadIdentity,
    containerBindingIdentity,
    containerId,
    providerIdentity,
    socketEndpointIdentity,
  })
  const outputChannelIdentity = identity(record.outputChannelIdentity, "outputChannelIdentity")
  if (outputChannelIdentity !== expectedOutputChannelIdentity) throw new TypeError("R3G-E output channel identity mismatch")
  const expectedOperationIdentity = createGvisorOutputOperationIdentity({ outputChannelIdentity, executionAttemptIdentity, requirementIdentity, workloadIdentity, maxOutputBytes: limit })
  if (identity(record.outputOperationIdentity, "outputOperationIdentity") !== expectedOperationIdentity) throw new TypeError("R3G-E output operation identity mismatch")
  const base = Object.freeze({
    version: KDO_H4_R3G_E_OUTPUT_VERSION,
    evidenceClass: KDO_H4_R3G_E_EVIDENCE_CLASS,
    executionAttemptIdentity,
    requirementIdentity,
    workloadIdentity,
    containerBindingIdentity,
    containerId,
    runtimeInstanceIdentity: identity(record.runtimeInstanceIdentity, "runtimeInstanceIdentity"),
    providerIdentity,
    socketEndpointIdentity,
    outputChannelIdentity,
    outputOperationIdentity: expectedOperationIdentity,
    maxOutputBytes: limit,
    ...aggregation,
    terminalEvidenceIdentity: identity(record.terminalEvidenceIdentity, "terminalEvidenceIdentity"),
    outputObserverImplementationIdentity: identity(record.outputObserverImplementationIdentity, "outputObserverImplementationIdentity"),
  })
  const expectedImplementationIdentity = createGvisorOutputObserverImplementationIdentity()
  if (base.outputObserverImplementationIdentity !== expectedImplementationIdentity) throw new TypeError("R3G-E output observer implementation identity mismatch")
  const expectedRecordIdentity = sha256Domain("OUTPUT_BOUND_RECORD", recordPreimage(base))
  if (identity(record.recordIdentity, "recordIdentity") !== expectedRecordIdentity) throw new TypeError("R3G-E output-bound record identity mismatch")
  return Object.freeze({ ...base, recordIdentity: expectedRecordIdentity })
}

export function createGvisorOutputBoundCommit(recordValue: GvisorOutputBoundRecord): GvisorOutputBoundCommit {
  const record = validateGvisorOutputBoundRecord(recordValue)
  const base = Object.freeze({ version: KDO_H4_R3G_E_COMMIT_VERSION, recordIdentity: record.recordIdentity })
  return Object.freeze({ ...base, commitIdentity: sha256Domain("OUTPUT_BOUND_COMMIT", [record.recordIdentity]) })
}

export function validateGvisorOutputBoundCommit(value: unknown, expectedRecord: GvisorOutputBoundRecord): GvisorOutputBoundCommit {
  const record = asPlainRecord(value, "R3G-E output-bound commit")
  exactKeys(record, ["version", "recordIdentity", "commitIdentity"], "R3G-E output-bound commit")
  if (record.version !== KDO_H4_R3G_E_COMMIT_VERSION) throw new TypeError("R3G-E output-bound commit version mismatch")
  const expected = createGvisorOutputBoundCommit(expectedRecord)
  if (identity(record.recordIdentity, "commit recordIdentity") !== expected.recordIdentity || identity(record.commitIdentity, "commitIdentity") !== expected.commitIdentity) {
    throw new TypeError("R3G-E output-bound commit identity mismatch")
  }
  return expected
}