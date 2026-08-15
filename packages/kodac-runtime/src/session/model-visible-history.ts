import { createHash } from "node:crypto"

import type { ModelMessage } from "../model/provider.ts"
import {
  KDO_H5_R1A_CHANGE_VERSION,
  KDO_H5_R1A_RESULT_VERSION,
  pruneModelVisibleToolResults,
  validateToolResultPruningPolicy,
  type ToolResultPruningChange,
  type ToolResultPruningPolicy,
} from "../agent/tool-result-pruning.ts"
import {
  KDO_H5_R2A_CALL_VERSION,
  KDO_H5_R2A_POLICY_VERSION,
  KDO_H5_R2A_SIGNAL_JSON_MAX_BYTES,
  advanceRepeatCallSignal,
  serializeRepeatCallAdvisorySignal,
  validateRepeatCallAdvisorySignalJson,
} from "../agent/repeat-call-signal.ts"
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
export const KDO_H5_R2B_ADVISORY_HISTORY_VERSION = "kodac-repeat-call-advisory-history-v1" as const
export const KDO_H5_R1B_PRUNING_HISTORY_VERSION = "kodac-tool-result-pruning-history-v1" as const
export const KDO_H5_R1B_PRUNING_RECORD_MAX_BYTES = 262144 as const
export const KDO_H5_R2B_REPEAT_POLICY_IDENTITY = "7331f353c9a29af123cd54fa99453768b35fe2534db5d009df9dae67cdc80222" as const
export const KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT =
  "Kodac advisory: the same tool call with the same canonical input completed twice consecutively. Reconsider the approach before issuing the same call again." as const
export const KDO_H5_R2B_ADVISORY_RECORD_MAX_BYTES = 8192 as const

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

export const KDO_H2_R2_RECOVERY_MESSAGE_CONTENT =
  "The previous model/tool turn failed. Reconsider the task and continue without repeating the same failed action." as const

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

export interface RepeatCallAdvisoryHistoryRecord {
  readonly version: typeof KDO_H5_R2B_ADVISORY_HISTORY_VERSION
  readonly afterRequestIdentity: string
  readonly assistantHistoryRecordIdentity: string
  readonly toolResultHistoryRecordIdentity: string
  readonly signalJson: string
  readonly signalIdentity: string
  readonly message: ModelVisibleMessage
  readonly messageBytes: number
  readonly messageIdentity: string
  readonly recordPreimageBytes: number
  readonly recordIdentity: string
}

export interface RepeatCallAdvisoryHistoryRecordInput {
  readonly afterRequestIdentity: string
  readonly assistantHistoryRecordIdentity: string
  readonly toolResultHistoryRecordIdentity: string
  readonly signalJson: string
}

export interface ToolResultPruningHistoryRecord {
  readonly version: typeof KDO_H5_R1B_PRUNING_HISTORY_VERSION
  readonly afterRequestIdentity: string
  readonly policy: ToolResultPruningPolicy
  readonly inputIdentity: string
  readonly outputIdentity: string
  readonly resultIdentity: string
  readonly changes: readonly ToolResultPruningChange[]
  readonly recordPreimageBytes: number
  readonly recordIdentity: string
}

export interface ToolResultPruningHistoryRecordInput {
  readonly afterRequestIdentity: string
  readonly messages: readonly ModelMessage[]
  readonly policy: ToolResultPruningPolicy
}

export interface ProjectedModelVisibleHistory {
  readonly sessionId?: string
  readonly anchorRequestIdentity?: string
  messages: ModelMessage[]
}

const SHA256 = /^[0-9a-f]{64}$/
const SOURCE = new Set<string>(KDO_H2_R2_HISTORY_SOURCES)
const R2B_REPEAT_POLICY_JSON = `{"thresholds":[2],"version":${JSON.stringify(KDO_H5_R2A_POLICY_VERSION)}}`
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
const ADVISORY_INPUT_KEYS = [
  "afterRequestIdentity",
  "assistantHistoryRecordIdentity",
  "toolResultHistoryRecordIdentity",
  "signalJson",
] as const
const ADVISORY_RECORD_KEYS = [
  "version",
  "afterRequestIdentity",
  "assistantHistoryRecordIdentity",
  "toolResultHistoryRecordIdentity",
  "signalJson",
  "signalIdentity",
  "message",
  "messageBytes",
  "messageIdentity",
  "recordPreimageBytes",
  "recordIdentity",
] as const
const PRUNING_INPUT_KEYS = ["afterRequestIdentity", "messages", "policy"] as const
const PRUNING_RECORD_KEYS = [
  "version",
  "afterRequestIdentity",
  "policy",
  "inputIdentity",
  "outputIdentity",
  "resultIdentity",
  "changes",
  "recordPreimageBytes",
  "recordIdentity",
] as const
const PRUNING_CHANGE_KEYS = [
  "version",
  "messageIndex",
  "originalBytes",
  "resultBytes",
  "removedBytes",
  "originalContentSha256",
  "resultContentSha256",
  "policyIdentity",
  "changeIdentity",
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

function requireNonNegativeSafeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || (value as number) < 0) throw new TypeError(`${label} must be a non-negative safe integer`)
  return value as number
}

function requireSourceMessageSemantics(source: ModelHistoryMessageSource, message: ModelVisibleMessage): void {
  if (source === "assistant_response") {
    if (message.role !== "assistant") throw new TypeError("assistant_response history records require role=assistant")
    if (message.toolCallId !== undefined) throw new TypeError("assistant_response history records cannot carry toolCallId")
    return
  }
  if (source === "tool_result") {
    if (message.role !== "tool") throw new TypeError("tool_result history records require role=tool")
    if (message.name === undefined) throw new TypeError("tool_result history records require tool name")
    if (message.toolCallId === undefined) throw new TypeError("tool_result history records require toolCallId")
    if (message.toolCalls !== undefined) throw new TypeError("tool_result history records cannot carry toolCalls")
    return
  }
  if (message.role !== "system") throw new TypeError("recovery_system history records require role=system")
  if (message.content !== KDO_H2_R2_RECOVERY_MESSAGE_CONTENT) {
    throw new TypeError("recovery_system history records require the canonical recovery message")
  }
  if (message.name !== undefined || message.toolCallId !== undefined || message.toolCalls !== undefined) {
    throw new TypeError("recovery_system history records cannot carry name, toolCallId, or toolCalls")
  }
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
  requireSourceMessageSemantics(source, message)
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

function advisoryMessage(): ModelVisibleMessage {
  return validateModelVisibleMessage({ role: "system", content: KDO_H5_R2B_ADVISORY_MESSAGE_CONTENT })
}

function canonicalAdvisoryPreimage(input: {
  afterRequestIdentity: string
  assistantHistoryRecordIdentity: string
  toolResultHistoryRecordIdentity: string
  signalJson: string
  message: ModelVisibleMessage
}): string {
  return `{"afterRequestIdentity":${JSON.stringify(input.afterRequestIdentity)},"assistantHistoryRecordIdentity":${JSON.stringify(input.assistantHistoryRecordIdentity)},"message":${canonicalModelVisibleMessage(input.message)},"signalJson":${JSON.stringify(input.signalJson)},"toolResultHistoryRecordIdentity":${JSON.stringify(input.toolResultHistoryRecordIdentity)},"version":${JSON.stringify(KDO_H5_R2B_ADVISORY_HISTORY_VERSION)}}`
}

function canonicalAdvisoryRecord(record: RepeatCallAdvisoryHistoryRecord): string {
  return `{"afterRequestIdentity":${JSON.stringify(record.afterRequestIdentity)},"assistantHistoryRecordIdentity":${JSON.stringify(record.assistantHistoryRecordIdentity)},"message":${canonicalModelVisibleMessage(record.message)},"messageBytes":${record.messageBytes},"messageIdentity":${JSON.stringify(record.messageIdentity)},"recordIdentity":${JSON.stringify(record.recordIdentity)},"recordPreimageBytes":${record.recordPreimageBytes},"signalIdentity":${JSON.stringify(record.signalIdentity)},"signalJson":${JSON.stringify(record.signalJson)},"toolResultHistoryRecordIdentity":${JSON.stringify(record.toolResultHistoryRecordIdentity)},"version":${JSON.stringify(record.version)}}`
}

export function createRepeatCallAdvisoryHistoryRecord(
  input: RepeatCallAdvisoryHistoryRecordInput,
): RepeatCallAdvisoryHistoryRecord {
  const inputRecord = asPlainRecord(input, "repeatCallAdvisoryHistory")
  exactKeys(inputRecord, ADVISORY_INPUT_KEYS, "repeatCallAdvisoryHistory")
  const afterRequestIdentity = requireSha256(inputRecord.afterRequestIdentity, "repeatCallAdvisoryHistory.afterRequestIdentity")
  const assistantHistoryRecordIdentity = requireSha256(
    inputRecord.assistantHistoryRecordIdentity,
    "repeatCallAdvisoryHistory.assistantHistoryRecordIdentity",
  )
  const toolResultHistoryRecordIdentity = requireSha256(
    inputRecord.toolResultHistoryRecordIdentity,
    "repeatCallAdvisoryHistory.toolResultHistoryRecordIdentity",
  )
  if (typeof inputRecord.signalJson !== "string") throw new TypeError("repeatCallAdvisoryHistory.signalJson must be a primitive string")
  if (Buffer.byteLength(inputRecord.signalJson, "utf8") > KDO_H5_R2A_SIGNAL_JSON_MAX_BYTES) {
    throw new RangeError(`repeatCallAdvisoryHistory.signalJson exceeds ${KDO_H5_R2A_SIGNAL_JSON_MAX_BYTES} UTF-8 bytes`)
  }
  const signal = validateRepeatCallAdvisorySignalJson(inputRecord.signalJson)
  if (signal.policyIdentity !== KDO_H5_R2B_REPEAT_POLICY_IDENTITY) {
    throw new TypeError("repeat-call advisory signal policy is not the canonical R2B policy")
  }
  if (signal.threshold !== 2 || signal.thresholdIndex !== 0 || signal.consecutiveCount !== 2) {
    throw new TypeError("repeat-call advisory signal is not the canonical R2B threshold-2 signal")
  }
  const signalJson = serializeRepeatCallAdvisorySignal(signal)
  const message = advisoryMessage()
  const messageCanonical = canonicalModelVisibleMessage(message)
  const messageBytes = Buffer.byteLength(messageCanonical, "utf8")
  const messageIdentity = sha256(messageCanonical)
  const preimage = canonicalAdvisoryPreimage({
    afterRequestIdentity,
    assistantHistoryRecordIdentity,
    toolResultHistoryRecordIdentity,
    signalJson,
    message,
  })
  const recordPreimageBytes = Buffer.byteLength(preimage, "utf8")
  const record: RepeatCallAdvisoryHistoryRecord = Object.freeze({
    version: KDO_H5_R2B_ADVISORY_HISTORY_VERSION,
    afterRequestIdentity,
    assistantHistoryRecordIdentity,
    toolResultHistoryRecordIdentity,
    signalJson,
    signalIdentity: signal.signalIdentity,
    message,
    messageBytes,
    messageIdentity,
    recordPreimageBytes,
    recordIdentity: sha256(preimage),
  })
  const finalBytes = Buffer.byteLength(canonicalAdvisoryRecord(record), "utf8")
  if (finalBytes > KDO_H5_R2B_ADVISORY_RECORD_MAX_BYTES) {
    throw new RangeError(`repeatCallAdvisoryHistory exceeds ${KDO_H5_R2B_ADVISORY_RECORD_MAX_BYTES} canonical JSON bytes`)
  }
  return record
}

export function validateRepeatCallAdvisoryHistoryRecord(value: unknown): RepeatCallAdvisoryHistoryRecord {
  const record = asPlainRecord(value, "repeatCallAdvisoryHistoryRecord")
  exactKeys(record, ADVISORY_RECORD_KEYS, "repeatCallAdvisoryHistoryRecord")
  if (record.version !== KDO_H5_R2B_ADVISORY_HISTORY_VERSION) throw new TypeError("unsupported repeat-call advisory history record")
  requireSha256(record.signalIdentity, "repeatCallAdvisoryHistoryRecord.signalIdentity")
  requireSha256(record.messageIdentity, "repeatCallAdvisoryHistoryRecord.messageIdentity")
  requireSha256(record.recordIdentity, "repeatCallAdvisoryHistoryRecord.recordIdentity")
  requirePositiveSafeInteger(record.messageBytes, "repeatCallAdvisoryHistoryRecord.messageBytes")
  requirePositiveSafeInteger(record.recordPreimageBytes, "repeatCallAdvisoryHistoryRecord.recordPreimageBytes")
  const rebuilt = createRepeatCallAdvisoryHistoryRecord({
    afterRequestIdentity: record.afterRequestIdentity as string,
    assistantHistoryRecordIdentity: record.assistantHistoryRecordIdentity as string,
    toolResultHistoryRecordIdentity: record.toolResultHistoryRecordIdentity as string,
    signalJson: record.signalJson as string,
  })
  if (
    record.signalIdentity !== rebuilt.signalIdentity ||
    record.messageBytes !== rebuilt.messageBytes ||
    record.messageIdentity !== rebuilt.messageIdentity ||
    record.recordPreimageBytes !== rebuilt.recordPreimageBytes ||
    record.recordIdentity !== rebuilt.recordIdentity ||
    canonicalAdvisoryRecord(record as unknown as RepeatCallAdvisoryHistoryRecord) !== canonicalAdvisoryRecord(rebuilt)
  ) {
    throw new TypeError("repeat-call advisory history record derived fields mismatch")
  }
  return rebuilt
}

function canonicalPruningPolicy(policy: ToolResultPruningPolicy): string {
  return `{"maxToolResultBytes":${policy.maxToolResultBytes},"policyIdentity":${JSON.stringify(policy.policyIdentity)},"strategy":${JSON.stringify(policy.strategy)},"version":${JSON.stringify(policy.version)}}`
}

function r1aChangePreimage(change: Omit<ToolResultPruningChange, "changeIdentity">): string {
  return `{"messageIndex":${change.messageIndex},"originalBytes":${change.originalBytes},"originalContentSha256":${JSON.stringify(change.originalContentSha256)},"policyIdentity":${JSON.stringify(change.policyIdentity)},"removedBytes":${change.removedBytes},"resultBytes":${change.resultBytes},"resultContentSha256":${JSON.stringify(change.resultContentSha256)},"version":${JSON.stringify(change.version)}}`
}

function canonicalPruningChange(change: ToolResultPruningChange): string {
  return `{"changeIdentity":${JSON.stringify(change.changeIdentity)},"messageIndex":${change.messageIndex},"originalBytes":${change.originalBytes},"originalContentSha256":${JSON.stringify(change.originalContentSha256)},"policyIdentity":${JSON.stringify(change.policyIdentity)},"removedBytes":${change.removedBytes},"resultBytes":${change.resultBytes},"resultContentSha256":${JSON.stringify(change.resultContentSha256)},"version":${JSON.stringify(change.version)}}`
}

function r1aResultPreimage(input: {
  policyIdentity: string
  inputIdentity: string
  outputIdentity: string
  changeIdentities: readonly string[]
}): string {
  return `{"changeIdentities":${JSON.stringify(input.changeIdentities)},"inputIdentity":${JSON.stringify(input.inputIdentity)},"outputIdentity":${JSON.stringify(input.outputIdentity)},"policyIdentity":${JSON.stringify(input.policyIdentity)},"version":${JSON.stringify(KDO_H5_R1A_RESULT_VERSION)}}`
}

function canonicalPruningPreimage(input: {
  afterRequestIdentity: string
  policy: ToolResultPruningPolicy
  inputIdentity: string
  outputIdentity: string
  resultIdentity: string
  changes: readonly ToolResultPruningChange[]
}): string {
  return `{"afterRequestIdentity":${JSON.stringify(input.afterRequestIdentity)},"changes":[${input.changes.map((change) => canonicalPruningChange(change)).join(",")}],"inputIdentity":${JSON.stringify(input.inputIdentity)},"outputIdentity":${JSON.stringify(input.outputIdentity)},"policy":${canonicalPruningPolicy(input.policy)},"resultIdentity":${JSON.stringify(input.resultIdentity)},"version":${JSON.stringify(KDO_H5_R1B_PRUNING_HISTORY_VERSION)}}`
}

function canonicalPruningRecord(record: ToolResultPruningHistoryRecord): string {
  return `{"afterRequestIdentity":${JSON.stringify(record.afterRequestIdentity)},"changes":[${record.changes.map((change) => canonicalPruningChange(change)).join(",")}],"inputIdentity":${JSON.stringify(record.inputIdentity)},"outputIdentity":${JSON.stringify(record.outputIdentity)},"policy":${canonicalPruningPolicy(record.policy)},"recordIdentity":${JSON.stringify(record.recordIdentity)},"recordPreimageBytes":${record.recordPreimageBytes},"resultIdentity":${JSON.stringify(record.resultIdentity)},"version":${JSON.stringify(record.version)}}`
}

function validatePruningChange(value: unknown, index: number, policy: ToolResultPruningPolicy): ToolResultPruningChange {
  const label = `toolResultPruningHistoryRecord.changes[${index}]`
  const record = asPlainRecord(value, label)
  exactKeys(record, PRUNING_CHANGE_KEYS, label)
  if (record.version !== KDO_H5_R1A_CHANGE_VERSION) throw new TypeError(`${label}.version is unsupported`)
  const messageIndex = requireNonNegativeSafeInteger(record.messageIndex, `${label}.messageIndex`)
  const originalBytes = requirePositiveSafeInteger(record.originalBytes, `${label}.originalBytes`)
  const resultBytes = requirePositiveSafeInteger(record.resultBytes, `${label}.resultBytes`)
  const removedBytes = requirePositiveSafeInteger(record.removedBytes, `${label}.removedBytes`)
  const originalContentSha256 = requireSha256(record.originalContentSha256, `${label}.originalContentSha256`)
  const resultContentSha256 = requireSha256(record.resultContentSha256, `${label}.resultContentSha256`)
  const policyIdentity = requireSha256(record.policyIdentity, `${label}.policyIdentity`)
  const changeIdentity = requireSha256(record.changeIdentity, `${label}.changeIdentity`)
  if (policyIdentity !== policy.policyIdentity) throw new TypeError(`${label}.policyIdentity does not match record policy`)
  if (resultBytes > policy.maxToolResultBytes) throw new RangeError(`${label}.resultBytes exceeds pruning policy bound`)
  if (originalBytes <= policy.maxToolResultBytes || removedBytes >= originalBytes) {
    throw new TypeError(`${label} byte evidence is inconsistent with a pruning change`)
  }
  const base = Object.freeze({
    version: KDO_H5_R1A_CHANGE_VERSION,
    messageIndex,
    originalBytes,
    resultBytes,
    removedBytes,
    originalContentSha256,
    resultContentSha256,
    policyIdentity,
  })
  const expectedIdentity = sha256(r1aChangePreimage(base))
  if (changeIdentity !== expectedIdentity) throw new TypeError(`${label}.changeIdentity mismatch`)
  return Object.freeze({ ...base, changeIdentity })
}

export function createToolResultPruningHistoryRecord(
  input: ToolResultPruningHistoryRecordInput,
): ToolResultPruningHistoryRecord {
  const inputRecord = asPlainRecord(input, "toolResultPruningHistory")
  exactKeys(inputRecord, PRUNING_INPUT_KEYS, "toolResultPruningHistory")
  const afterRequestIdentity = requireSha256(inputRecord.afterRequestIdentity, "toolResultPruningHistory.afterRequestIdentity")
  const policy = validateToolResultPruningPolicy(inputRecord.policy)
  const result = pruneModelVisibleToolResults(inputRecord.messages, policy)
  if (result.changes.length === 0) throw new TypeError("tool-result pruning history requires at least one deterministic change")
  const preimage = canonicalPruningPreimage({
    afterRequestIdentity,
    policy: result.policy,
    inputIdentity: result.inputIdentity,
    outputIdentity: result.outputIdentity,
    resultIdentity: result.resultIdentity,
    changes: result.changes,
  })
  const recordPreimageBytes = Buffer.byteLength(preimage, "utf8")
  const record: ToolResultPruningHistoryRecord = Object.freeze({
    version: KDO_H5_R1B_PRUNING_HISTORY_VERSION,
    afterRequestIdentity,
    policy: result.policy,
    inputIdentity: result.inputIdentity,
    outputIdentity: result.outputIdentity,
    resultIdentity: result.resultIdentity,
    changes: result.changes,
    recordPreimageBytes,
    recordIdentity: sha256(preimage),
  })
  const finalBytes = Buffer.byteLength(canonicalPruningRecord(record), "utf8")
  if (finalBytes > KDO_H5_R1B_PRUNING_RECORD_MAX_BYTES) {
    throw new RangeError(`toolResultPruningHistory exceeds ${KDO_H5_R1B_PRUNING_RECORD_MAX_BYTES} canonical JSON bytes`)
  }
  return record
}

export function validateToolResultPruningHistoryRecord(value: unknown): ToolResultPruningHistoryRecord {
  const record = asPlainRecord(value, "toolResultPruningHistoryRecord")
  exactKeys(record, PRUNING_RECORD_KEYS, "toolResultPruningHistoryRecord")
  if (record.version !== KDO_H5_R1B_PRUNING_HISTORY_VERSION) throw new TypeError("unsupported tool-result pruning history record")
  const afterRequestIdentity = requireSha256(record.afterRequestIdentity, "toolResultPruningHistoryRecord.afterRequestIdentity")
  const inputIdentity = requireSha256(record.inputIdentity, "toolResultPruningHistoryRecord.inputIdentity")
  const outputIdentity = requireSha256(record.outputIdentity, "toolResultPruningHistoryRecord.outputIdentity")
  const resultIdentity = requireSha256(record.resultIdentity, "toolResultPruningHistoryRecord.resultIdentity")
  const recordIdentity = requireSha256(record.recordIdentity, "toolResultPruningHistoryRecord.recordIdentity")
  const recordPreimageBytes = requirePositiveSafeInteger(record.recordPreimageBytes, "toolResultPruningHistoryRecord.recordPreimageBytes")
  const policy = validateToolResultPruningPolicy(record.policy)
  const changeValues = ownArrayDataValues(record.changes, "toolResultPruningHistoryRecord.changes")
  if (changeValues.length === 0) throw new TypeError("tool-result pruning history record requires at least one deterministic change")
  if (changeValues.length > KDO_H2_R2_LIMITS.maxProjectedMessages) throw new RangeError("tool-result pruning history record has too many changes")
  const changes = Object.freeze(changeValues.map((change, index) => validatePruningChange(change, index, policy)))
  for (let index = 1; index < changes.length; index += 1) {
    const previous = changes[index - 1]
    const current = changes[index]
    if (previous === undefined || current === undefined || current.messageIndex <= previous.messageIndex) {
      throw new TypeError("tool-result pruning history record changes must be strictly ordered by messageIndex")
    }
  }
  const expectedResultIdentity = sha256(r1aResultPreimage({
    policyIdentity: policy.policyIdentity,
    inputIdentity,
    outputIdentity,
    changeIdentities: changes.map((change) => change.changeIdentity),
  }))
  if (resultIdentity !== expectedResultIdentity) throw new TypeError("tool-result pruning history record resultIdentity mismatch")
  const preimage = canonicalPruningPreimage({
    afterRequestIdentity,
    policy,
    inputIdentity,
    outputIdentity,
    resultIdentity,
    changes,
  })
  const rebuilt: ToolResultPruningHistoryRecord = Object.freeze({
    version: KDO_H5_R1B_PRUNING_HISTORY_VERSION,
    afterRequestIdentity,
    policy,
    inputIdentity,
    outputIdentity,
    resultIdentity,
    changes,
    recordPreimageBytes: Buffer.byteLength(preimage, "utf8"),
    recordIdentity: sha256(preimage),
  })
  if (
    recordPreimageBytes !== rebuilt.recordPreimageBytes ||
    recordIdentity !== rebuilt.recordIdentity ||
    canonicalPruningRecord(record as unknown as ToolResultPruningHistoryRecord) !== canonicalPruningRecord(rebuilt)
  ) {
    throw new TypeError("tool-result pruning history record derived fields mismatch")
  }
  const finalBytes = Buffer.byteLength(canonicalPruningRecord(rebuilt), "utf8")
  if (finalBytes > KDO_H5_R1B_PRUNING_RECORD_MAX_BYTES) {
    throw new RangeError(`toolResultPruningHistoryRecord exceeds ${KDO_H5_R1B_PRUNING_RECORD_MAX_BYTES} canonical JSON bytes`)
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

function assertRepeatAdvisorySourceBinding(
  record: RepeatCallAdvisoryHistoryRecord,
  assistantRecord: ModelHistoryMessageRecord,
  toolResultRecord: ModelHistoryMessageRecord,
): void {
  const toolResultId = toolResultRecord.message.toolCallId
  const toolResultName = toolResultRecord.message.name
  if (toolResultId === undefined || toolResultName === undefined) {
    throw new TypeError("repeat-call advisory source tool-result record is missing its canonical bindings")
  }
  const matchingCalls = (assistantRecord.message.toolCalls ?? []).filter(
    (call) => call.id === toolResultId && call.name === toolResultName,
  )
  if (matchingCalls.length !== 1) {
    throw new TypeError("repeat-call advisory source records do not identify exactly one matching assistant tool call")
  }
  const matchingCall = matchingCalls[0]
  if (matchingCall === undefined) throw new TypeError("repeat-call advisory source assistant tool call is unavailable")
  const serializedInput = JSON.stringify(matchingCall.input)
  if (serializedInput === undefined) throw new TypeError("repeat-call advisory source tool input is not JSON-serializable")
  const currentCallJson = `{"version":${JSON.stringify(KDO_H5_R2A_CALL_VERSION)},"toolName":${JSON.stringify(matchingCall.name)},"toolInput":${serializedInput}}`
  const derived = advanceRepeatCallSignal(null, currentCallJson, R2B_REPEAT_POLICY_JSON)
  const signal = validateRepeatCallAdvisorySignalJson(record.signalJson)
  if (
    derived.nextState.toolName !== signal.toolName ||
    derived.nextState.toolInputIdentity !== signal.toolInputIdentity ||
    derived.nextState.callFingerprint !== signal.callFingerprint
  ) {
    throw new TypeError("repeat-call advisory signal does not match its bound assistant/tool-result source records")
  }
}

export function projectModelVisibleHistory(value: readonly KodacEvent[] | unknown): ProjectedModelVisibleHistory {
  const eventValues = ownArrayDataValues(value, "events")
  if (eventValues.length > KDO_H2_R2_LIMITS.maxProjectionEvents) {
    throw new RangeError(`events exceed ${KDO_H2_R2_LIMITS.maxProjectionEvents} projection entries`)
  }

  let sessionId: string | undefined
  let previousSequence: number | undefined
  let anchorRequestIdentity: string | undefined
  let projected: ModelVisibleMessage[] = []
  let seenAssistantRecords = new Map<string, ModelHistoryMessageRecord>()
  let seenToolResultRecords = new Map<string, ModelHistoryMessageRecord>()

  for (let index = 0; index < eventValues.length; index += 1) {
    const event = readEventEnvelope(eventValues[index], index)
    if (sessionId === undefined) {
      sessionId = event.sessionId
      previousSequence = event.sequence
    } else {
      if (event.sessionId !== sessionId) throw new TypeError("model history projection cannot mix session ids")
      if (previousSequence === undefined || event.sequence !== previousSequence + 1) {
        throw new TypeError("model history projection requires contiguous strictly increasing event sequence")
      }
      previousSequence = event.sequence
    }

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
      seenAssistantRecords = new Map<string, ModelHistoryMessageRecord>()
      seenToolResultRecords = new Map<string, ModelHistoryMessageRecord>()
      continue
    }

    if (event.type === "model.history.message.appended") {
      if (anchorRequestIdentity === undefined) throw new TypeError("model history message cannot precede a request snapshot anchor")
      const record = validateModelHistoryMessageRecord(event.payload)
      if (record.afterRequestIdentity !== anchorRequestIdentity) {
        throw new TypeError("model history message is bound to a stale request identity")
      }
      if (record.source === "assistant_response") seenAssistantRecords.set(record.recordIdentity, record)
      if (record.source === "tool_result") seenToolResultRecords.set(record.recordIdentity, record)
      projected = [...projected, record.message]
      assertProjectedBounds(projected)
      continue
    }

    if (event.type === "model.history.repeat_call_advisory.appended") {
      if (anchorRequestIdentity === undefined) throw new TypeError("repeat-call advisory cannot precede a request snapshot anchor")
      const record = validateRepeatCallAdvisoryHistoryRecord(event.payload)
      if (record.afterRequestIdentity !== anchorRequestIdentity) {
        throw new TypeError("repeat-call advisory is bound to a stale request identity")
      }
      const assistantRecord = seenAssistantRecords.get(record.assistantHistoryRecordIdentity)
      if (assistantRecord === undefined) {
        throw new TypeError("repeat-call advisory references an unseen assistant history record")
      }
      const toolResultRecord = seenToolResultRecords.get(record.toolResultHistoryRecordIdentity)
      if (toolResultRecord === undefined) {
        throw new TypeError("repeat-call advisory references an unseen tool-result history record")
      }
      assertRepeatAdvisorySourceBinding(record, assistantRecord, toolResultRecord)
      projected = [...projected, record.message]
      assertProjectedBounds(projected)
      continue
    }

    if (event.type === "model.history.tool_result_pruning.applied") {
      if (anchorRequestIdentity === undefined) throw new TypeError("tool-result pruning cannot precede a request snapshot anchor")
      const record = validateToolResultPruningHistoryRecord(event.payload)
      if (record.afterRequestIdentity !== anchorRequestIdentity) {
        throw new TypeError("tool-result pruning is bound to a stale request identity")
      }
      const replay = pruneModelVisibleToolResults(projected, record.policy)
      if (
        replay.inputIdentity !== record.inputIdentity ||
        replay.outputIdentity !== record.outputIdentity ||
        replay.resultIdentity !== record.resultIdentity ||
        JSON.stringify(replay.changes) !== JSON.stringify(record.changes)
      ) {
        throw new TypeError("tool-result pruning replay does not match its durable transformation record")
      }
      projected = replay.messages.map((message) => validateModelVisibleMessage(message))
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
