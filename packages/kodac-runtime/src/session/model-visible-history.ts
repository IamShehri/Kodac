import { createHash } from "node:crypto"

import type { ModelMessage } from "../model/provider.ts"
import {
  KODAC_EVENT_PROTOCOL,
  KODAC_EVENT_VERSION,
  type KodacEvent,
} from "../protocol/event.ts"
import {
  KDO_H2_R1_LIMITS,
  canonicalModelVisibleMessage,
  materializeModelVisibleMessage,
  validateModelVisibleMessage,
  validateModelVisibleRequestSnapshot,
  type ModelVisibleMessage,
} from "./model-visible-request.ts"

export const KDO_H2_R2_HISTORY_VERSION = "kodac-model-visible-history-v1" as const

export const KDO_H2_R2_DEEPSEEK_HARNESS_DONOR_PROVENANCE = Object.freeze({
  repository: "deepseek-ai/deepseek-harness",
  sourceCommit: "47f943859bef60e4160492346772ded9b24f765a",
  license: "MIT",
  intakeMode: "PORT",
  sources: Object.freeze([
    Object.freeze({ path: "docs/subsystems/session.md", blob: "aea9d00b38e384e7a973ce168c3a75a62e70a8bb" }),
  ]),
} as const)

export const KDO_H2_R2_PREDECESSOR_PROVENANCE = Object.freeze({
  h2R1Authorization: "docs/planning/KODAC_KDO_H2_R1_MODEL_VISIBLE_REQUEST_RECONSTRUCTION_AUTHORIZATION_2026-08-14.md",
  h2R1Merge: "01daf34d36fc30b20b39293e0a3f1fc03cf32048",
  h3Audit: "docs/planning/KODAC_KDO_H3_DEEPSEEK_HARNESS_RUNTIME_DIFFERENTIAL_AUDIT_2026-08-14.md",
} as const)

export const KDO_H2_R2_HISTORY_SOURCES = Object.freeze([
  "assistant_response",
  "tool_result",
  "recovery_system",
] as const)

export type ModelHistoryMessageSource = (typeof KDO_H2_R2_HISTORY_SOURCES)[number]

export const KDO_H2_R2_LIMITS = Object.freeze({
  maxProjectionEvents: 4096,
  maxProjectedMessages: KDO_H2_R1_LIMITS.maxMessages,
  maxHistoryRecordBytes: KDO_H2_R1_LIMITS.maxSnapshotBytes,
  maxTotalMessageContentBytes: KDO_H2_R1_LIMITS.maxTotalMessageContentBytes,
} as const)

export interface ModelHistoryMessageRecord {
  readonly version: typeof KDO_H2_R2_HISTORY_VERSION
  readonly afterRequestIdentity: string
  readonly source: ModelHistoryMessageSource
  readonly message: ModelVisibleMessage
  readonly messageBytes: number
  readonly recordPreimageBytes: number
  readonly messageIdentity: string
  readonly recordIdentity: string
}

export interface ModelHistoryMessageRecordInput {
  readonly afterRequestIdentity: string
  readonly source: ModelHistoryMessageSource
  readonly message: ModelMessage
}

export interface ProjectedModelVisibleHistory {
  readonly sessionId?: string
  readonly anchorRequestIdentity?: string
  messages: ModelMessage[]
}

const SHA256 = /^[0-9a-f]{64}$/
const SOURCE = new Set<string>(KDO_H2_R2_HISTORY_SOURCES)
const INPUT_KEYS = ["afterRequestIdentity", "source", "message"] as const
const RECORD_KEYS = [
  "version",
  "afterRequestIdentity",
  "source",
  "message",
  "messageBytes",
  "recordPreimageBytes",
  "messageIdentity",
  "recordIdentity",
] as const

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`)
  return value as Record<string, unknown>
}

function ownDataEntries(record: Record<string, unknown>, label: string): Array<readonly [string, unknown]> {
  if (Object.getOwnPropertySymbols(record).length > 0) throw new TypeError(`${label} contains symbol-keyed fields`)
  const descriptors = Object.getOwnPropertyDescriptors(record)
  const entries: Array<readonly [string, unknown]> = []
  for (const key of Object.keys(descriptors)) {
    const descriptor = descriptors[key]
    if (!descriptor?.enumerable) throw new TypeError(`${label} contains non-enumerable field: ${key}`)
    if (!("value" in descriptor)) throw new TypeError(`${label} contains accessor field: ${key}`)
    entries.push([key, descriptor.value] as const)
  }
  return entries
}

function exactKeys(record: Record<string, unknown>, keys: readonly string[], label: string): void {
  const allowed = new Set(keys)
  for (const [key, value] of ownDataEntries(record, label)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
    if (value === undefined) throw new TypeError(`${label} contains undefined field: ${key}`)
  }
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(record, key)) throw new TypeError(`${label} is missing field: ${key}`)
  }
}

function ownArrayDataValues(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) throw new TypeError(`${label} must be a plain array`)
  if (Object.getOwnPropertySymbols(value).length > 0) throw new TypeError(`${label} contains symbol-keyed fields`)
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const allowed = new Set<string>(["length"])
  const output: unknown[] = []
  for (let index = 0; index < value.length; index += 1) {
    const key = String(index)
    allowed.add(key)
    const descriptor = descriptors[key]
    if (!descriptor) throw new TypeError(`${label} contains a sparse array`)
    if (!descriptor.enumerable) throw new TypeError(`${label} contains non-enumerable field: ${key}`)
    if (!("value" in descriptor)) throw new TypeError(`${label} contains accessor field: ${key}`)
    if (descriptor.value === undefined) throw new TypeError(`${label} contains undefined item: ${key}`)
    output.push(descriptor.value)
  }
  for (const key of Object.keys(descriptors)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains unknown array field: ${key}`)
  }
  return output
}

function requireSha256(value: unknown, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return value
}

function requireSource(value: unknown): ModelHistoryMessageSource {
  if (typeof value !== "string" || !SOURCE.has(value)) throw new TypeError("modelHistoryMessage.source is unsupported")
  return value as ModelHistoryMessageSource
}

function requirePositiveSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) <= 0) throw new TypeError(`${label} must be a positive safe integer`)
  return value as number
}

function canonicalRecordPreimage(input: {
  afterRequestIdentity: string
  source: ModelHistoryMessageSource
  message: ModelVisibleMessage
}): string {
  return `{"afterRequestIdentity":${JSON.stringify(input.afterRequestIdentity)},"message":${canonicalModelVisibleMessage(input.message)},"source":${JSON.stringify(input.source)},"version":${JSON.stringify(KDO_H2_R2_HISTORY_VERSION)}}`
}

function canonicalRecord(record: ModelHistoryMessageRecord): string {
  return `{"afterRequestIdentity":${JSON.stringify(record.afterRequestIdentity)},"message":${canonicalModelVisibleMessage(record.message)},"messageBytes":${record.messageBytes},"messageIdentity":${JSON.stringify(record.messageIdentity)},"recordIdentity":${JSON.stringify(record.recordIdentity)},"recordPreimageBytes":${record.recordPreimageBytes},"source":${JSON.stringify(record.source)},"version":${JSON.stringify(record.version)}}`
}

export function createModelHistoryMessageRecord(input: ModelHistoryMessageRecordInput): ModelHistoryMessageRecord {
  const inputRecord = asPlainRecord(input, "modelHistoryMessage")
  exactKeys(inputRecord, INPUT_KEYS, "modelHistoryMessage")
  const afterRequestIdentity = requireSha256(inputRecord.afterRequestIdentity, "modelHistoryMessage.afterRequestIdentity")
  const source = requireSource(inputRecord.source)
  const message = validateModelVisibleMessage(inputRecord.message)
  const messageCanonical = canonicalModelVisibleMessage(message)
  const messageBytes = Buffer.byteLength(messageCanonical, "utf8")
  const messageIdentity = sha256(messageCanonical)
  const preimage = canonicalRecordPreimage({ afterRequestIdentity, source, message })
  const recordPreimageBytes = Buffer.byteLength(preimage, "utf8")
  const record: ModelHistoryMessageRecord = Object.freeze({
    version: KDO_H2_R2_HISTORY_VERSION,
    afterRequestIdentity,
    source,
    message,
    messageBytes,
    recordPreimageBytes,
    messageIdentity,
    recordIdentity: sha256(preimage),
  })
  const finalBytes = Buffer.byteLength(canonicalRecord(record), "utf8")
  if (finalBytes > KDO_H2_R2_LIMITS.maxHistoryRecordBytes) {
    throw new RangeError(`modelHistoryMessage exceeds ${KDO_H2_R2_LIMITS.maxHistoryRecordBytes} canonical JSON bytes`)
  }
  return record
}

export function validateModelHistoryMessageRecord(value: unknown): ModelHistoryMessageRecord {
  const record = asPlainRecord(value, "modelHistoryMessageRecord")
  exactKeys(record, RECORD_KEYS, "modelHistoryMessageRecord")
  if (record.version !== KDO_H2_R2_HISTORY_VERSION) throw new TypeError("unsupported model history message record")
  requireSha256(record.messageIdentity, "modelHistoryMessageRecord.messageIdentity")
  requireSha256(record.recordIdentity, "modelHistoryMessageRecord.recordIdentity")
  requirePositiveSafeInteger(record.messageBytes, "modelHistoryMessageRecord.messageBytes")
  requirePositiveSafeInteger(record.recordPreimageBytes, "modelHistoryMessageRecord.recordPreimageBytes")
  const rebuilt = createModelHistoryMessageRecord({
    afterRequestIdentity: record.afterRequestIdentity as string,
    source: record.source as ModelHistoryMessageSource,
    message: record.message as ModelMessage,
  })
  if (
    record.messageBytes !== rebuilt.messageBytes ||
    record.recordPreimageBytes !== rebuilt.recordPreimageBytes ||
    record.messageIdentity !== rebuilt.messageIdentity ||
    record.recordIdentity !== rebuilt.recordIdentity ||
    canonicalRecord(record as unknown as ModelHistoryMessageRecord) !== canonicalRecord(rebuilt)
  ) {
    throw new TypeError("model history message record derived fields mismatch")
  }
  return rebuilt
}

function normalizeMessageList(value: unknown, label: string): ModelVisibleMessage[] {
  const raw = ownArrayDataValues(value, label)
  if (raw.length > KDO_H2_R2_LIMITS.maxProjectedMessages) {
    throw new RangeError(`${label} exceeds ${KDO_H2_R2_LIMITS.maxProjectedMessages} messages`)
  }
  const messages = raw.map((message) => validateModelVisibleMessage(message))
  const contentBytes = messages.reduce((total, message) => total + Buffer.byteLength(message.content, "utf8"), 0)
  if (contentBytes > KDO_H2_R2_LIMITS.maxTotalMessageContentBytes) {
    throw new RangeError(`${label} content exceeds ${KDO_H2_R2_LIMITS.maxTotalMessageContentBytes} UTF-8 bytes`)
  }
  return messages
}

function canonicalMessageList(messages: readonly ModelVisibleMessage[]): string {
  return `[${messages.map((message) => canonicalModelVisibleMessage(message)).join(",")}]`
}

export function modelVisibleMessagesEqual(left: unknown, right: unknown): boolean {
  const leftMessages = normalizeMessageList(left, "leftMessages")
  const rightMessages = normalizeMessageList(right, "rightMessages")
  return canonicalMessageList(leftMessages) === canonicalMessageList(rightMessages)
}

function eventField(record: Record<string, unknown>, key: string, label: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(record, key)
  if (!descriptor) throw new TypeError(`${label} is missing field: ${key}`)
  if (!descriptor.enumerable) throw new TypeError(`${label} contains non-enumerable field: ${key}`)
  if (!("value" in descriptor)) throw new TypeError(`${label} contains accessor field: ${key}`)
  return descriptor.value
}

function readEventEnvelope(value: unknown, index: number): {
  sessionId: string
  sequence: number
  type: string
  payload: unknown
} {
  const label = `events[${index}]`
  const record = asPlainRecord(value, label)
  if (eventField(record, "protocol", label) !== KODAC_EVENT_PROTOCOL) throw new TypeError(`${label}.protocol is unsupported`)
  if (eventField(record, "version", label) !== KODAC_EVENT_VERSION) throw new TypeError(`${label}.version is unsupported`)
  const sessionId = eventField(record, "sessionId", label)
  const sequence = eventField(record, "sequence", label)
  const type = eventField(record, "type", label)
  const payload = eventField(record, "payload", label)
  if (typeof sessionId !== "string" || sessionId.length === 0) throw new TypeError(`${label}.sessionId must be non-empty`)
  if (!Number.isSafeInteger(sequence) || (sequence as number) <= 0) throw new TypeError(`${label}.sequence must be a positive safe integer`)
  if (typeof type !== "string" || type.length === 0) throw new TypeError(`${label}.type must be non-empty`)
  return { sessionId, sequence: sequence as number, type, payload }
}

function assertProjectedBounds(messages: readonly ModelVisibleMessage[]): void {
  if (messages.length > KDO_H2_R2_LIMITS.maxProjectedMessages) {
    throw new RangeError(`projected model history exceeds ${KDO_H2_R2_LIMITS.maxProjectedMessages} messages`)
  }
  const contentBytes = messages.reduce((total, message) => total + Buffer.byteLength(message.content, "utf8"), 0)
  if (contentBytes > KDO_H2_R2_LIMITS.maxTotalMessageContentBytes) {
    throw new RangeError(`projected model history content exceeds ${KDO_H2_R2_LIMITS.maxTotalMessageContentBytes} UTF-8 bytes`)
  }
}

export function projectModelVisibleHistory(value: readonly KodacEvent[] | unknown): ProjectedModelVisibleHistory {
  const eventValues = ownArrayDataValues(value, "events")
  if (eventValues.length > KDO_H2_R2_LIMITS.maxProjectionEvents) {
    throw new RangeError(`events exceed ${KDO_H2_R2_LIMITS.maxProjectionEvents} projection entries`)
  }

  let sessionId: string | undefined
  let previousSequence = 0
  let anchorRequestIdentity: string | undefined
  let projected: ModelVisibleMessage[] = []

  for (let index = 0; index < eventValues.length; index += 1) {
    const event = readEventEnvelope(eventValues[index], index)
    if (sessionId === undefined) {
      sessionId = event.sessionId
      if (event.sequence !== 1) throw new TypeError("model history projection requires the complete session event prefix starting at sequence 1")
    } else if (event.sessionId !== sessionId) {
      throw new TypeError("model history projection cannot mix session ids")
    }
    if (event.sequence !== previousSequence + 1) {
      throw new TypeError("model history projection requires contiguous strictly increasing event sequence")
    }
    previousSequence = event.sequence

    if (event.type === "model.request.snapshot") {
      const snapshot = validateModelVisibleRequestSnapshot(event.payload)
      if (anchorRequestIdentity === undefined) {
        projected = snapshot.messages.map((message) => validateModelVisibleMessage(message))
      } else if (canonicalMessageList(projected) !== canonicalMessageList(snapshot.messages)) {
        throw new TypeError("model request snapshot messages do not match projected model-visible history")
      } else {
        projected = snapshot.messages.map((message) => validateModelVisibleMessage(message))
      }
      assertProjectedBounds(projected)
      anchorRequestIdentity = snapshot.requestIdentity
      continue
    }

    if (event.type === "model.history.message.appended") {
      if (anchorRequestIdentity === undefined) throw new TypeError("model history message cannot precede a request snapshot anchor")
      const record = validateModelHistoryMessageRecord(event.payload)
      if (record.afterRequestIdentity !== anchorRequestIdentity) {
        throw new TypeError("model history message is bound to a stale request identity")
      }
      projected = [...projected, record.message]
      assertProjectedBounds(projected)
      continue
    }

    if (event.type.startsWith("model.history.")) {
      throw new TypeError(`unsupported required model history event type: ${event.type}`)
    }
  }

  return {
    ...(sessionId === undefined ? {} : { sessionId }),
    ...(anchorRequestIdentity === undefined ? {} : { anchorRequestIdentity }),
    messages: projected.map((message) => materializeModelVisibleMessage(message)),
  }
}
