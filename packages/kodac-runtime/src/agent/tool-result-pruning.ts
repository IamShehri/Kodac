import { createHash } from "node:crypto"
import { types as utilTypes } from "node:util"

import {
  KDO_H2_R1_LIMITS,
  canonicalModelVisibleMessage,
  materializeModelVisibleMessage,
  validateModelVisibleMessage,
  type ModelVisibleMessage,
} from "../session/model-visible-request.ts"

export const KDO_H5_R1A_PRUNING_VERSION = "kodac-tool-result-pruning-v1" as const
export const KDO_H5_R1A_RESULT_VERSION = "kodac-tool-result-pruning-result-v1" as const
export const KDO_H5_R1A_CHANGE_VERSION = "kodac-tool-result-pruning-change-v1" as const
export const KDO_H5_R1A_STRATEGY = "head-tail-equal-v1" as const

export const KDO_H5_R1A_DEEPCODE_DONOR_PROVENANCE = Object.freeze({
  repository: "HKUDS/DeepCode",
  sourceCommit: "287510fbf6820147a48adf79f7fd86b0ed1afe92",
  sourceTree: "7f44b320f86d04d4315242fabc74f1b325829be8",
  license: "MIT",
  intakeMode: "PORT",
  sources: Object.freeze([
    Object.freeze({
      path: "core/agent_runtime/pruner.py",
      blob: "dae72f4439d79a2e8a31a85de69908ef87114ec9",
    }),
  ]),
} as const)

export const KDO_H5_R1A_LIMITS = Object.freeze({
  minToolResultBytes: 128,
  maxToolResultBytes: KDO_H2_R1_LIMITS.maxMessageContentBytes,
  maxMessages: KDO_H2_R1_LIMITS.maxMessages,
  maxTotalMessageContentBytes: KDO_H2_R1_LIMITS.maxTotalMessageContentBytes,
  maxStructuralDepth: KDO_H2_R1_LIMITS.maxJsonDepth + 8,
} as const)

export interface ToolResultPruningPolicyInput {
  readonly maxToolResultBytes: number
}

export interface ToolResultPruningPolicy {
  readonly version: typeof KDO_H5_R1A_PRUNING_VERSION
  readonly strategy: typeof KDO_H5_R1A_STRATEGY
  readonly maxToolResultBytes: number
  readonly policyIdentity: string
}

export interface ToolResultPruningChange {
  readonly version: typeof KDO_H5_R1A_CHANGE_VERSION
  readonly messageIndex: number
  readonly originalBytes: number
  readonly resultBytes: number
  readonly removedBytes: number
  readonly originalContentSha256: string
  readonly resultContentSha256: string
  readonly policyIdentity: string
  readonly changeIdentity: string
}

export interface ToolResultPruningResult {
  readonly version: typeof KDO_H5_R1A_RESULT_VERSION
  readonly policy: ToolResultPruningPolicy
  readonly inputIdentity: string
  readonly outputIdentity: string
  readonly messages: readonly ModelVisibleMessage[]
  readonly changes: readonly ToolResultPruningChange[]
  readonly resultIdentity: string
}

const SHA256 = /^[0-9a-f]{64}$/
const POLICY_INPUT_KEYS = ["maxToolResultBytes"] as const
const POLICY_KEYS = ["version", "strategy", "maxToolResultBytes", "policyIdentity"] as const

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function assertNoStructuralHooks(
  value: unknown,
  label: string,
  seen = new WeakSet<object>(),
  depth = 0,
): void {
  if ((typeof value !== "object" || value === null) && typeof value !== "function") return
  if (depth > KDO_H5_R1A_LIMITS.maxStructuralDepth) {
    throw new RangeError(`${label} exceeds structural depth ${KDO_H5_R1A_LIMITS.maxStructuralDepth}`)
  }
  const object = value as object
  if (utilTypes.isProxy(object)) throw new TypeError(`${label} must not be a proxy`)
  if (seen.has(object)) throw new TypeError(`${label} must not be cyclic`)
  seen.add(object)
  try {
    if (Object.getOwnPropertySymbols(object).length !== 0) {
      throw new TypeError(`${label} must not contain symbol fields`)
    }
    const descriptors = Object.getOwnPropertyDescriptors(object)
    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (descriptor.get !== undefined || descriptor.set !== undefined) {
        throw new TypeError(`${label}.${key} must be a data property`)
      }
      if (key !== "length" && !descriptor.enumerable) {
        throw new TypeError(`${label}.${key} must be enumerable`)
      }
      if ("value" in descriptor) {
        assertNoStructuralHooks(descriptor.value, `${label}.${key}`, seen, depth + 1)
      }
    }
  } finally {
    seen.delete(object)
  }
}

function asPlainRecord(value: unknown, label: string): Record<string, unknown> {
  assertNoStructuralHooks(value, label)
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a plain object`)
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain object`)
  }
  return value as Record<string, unknown>
}

function exactKeys(record: Record<string, unknown>, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
  for (const key of actual) {
    if (record[key] === undefined) throw new TypeError(`${label}.${key} must not be undefined`)
  }
}

function requirePolicyBytes(value: unknown): number {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < KDO_H5_R1A_LIMITS.minToolResultBytes ||
    value > KDO_H5_R1A_LIMITS.maxToolResultBytes
  ) {
    throw new RangeError(
      `maxToolResultBytes must be an integer from ${KDO_H5_R1A_LIMITS.minToolResultBytes} through ${KDO_H5_R1A_LIMITS.maxToolResultBytes}`,
    )
  }
  return value
}

function policyPreimage(maxToolResultBytes: number): string {
  return `{"maxToolResultBytes":${maxToolResultBytes},"strategy":${JSON.stringify(KDO_H5_R1A_STRATEGY)},"version":${JSON.stringify(KDO_H5_R1A_PRUNING_VERSION)}}`
}

export function createToolResultPruningPolicy(input: ToolResultPruningPolicyInput): ToolResultPruningPolicy {
  const record = asPlainRecord(input, "toolResultPruningPolicyInput")
  exactKeys(record, POLICY_INPUT_KEYS, "toolResultPruningPolicyInput")
  const maxToolResultBytes = requirePolicyBytes(record.maxToolResultBytes)
  return Object.freeze({
    version: KDO_H5_R1A_PRUNING_VERSION,
    strategy: KDO_H5_R1A_STRATEGY,
    maxToolResultBytes,
    policyIdentity: sha256(policyPreimage(maxToolResultBytes)),
  })
}

export function validateToolResultPruningPolicy(value: unknown): ToolResultPruningPolicy {
  const record = asPlainRecord(value, "toolResultPruningPolicy")
  exactKeys(record, POLICY_KEYS, "toolResultPruningPolicy")
  if (record.version !== KDO_H5_R1A_PRUNING_VERSION) throw new TypeError("tool-result pruning policy version mismatch")
  if (record.strategy !== KDO_H5_R1A_STRATEGY) throw new TypeError("tool-result pruning strategy mismatch")
  if (typeof record.policyIdentity !== "string" || !SHA256.test(record.policyIdentity)) {
    throw new TypeError("tool-result pruning policy identity must be a lowercase SHA-256 identity")
  }
  const rebuilt = createToolResultPruningPolicy({ maxToolResultBytes: requirePolicyBytes(record.maxToolResultBytes) })
  if (record.policyIdentity !== rebuilt.policyIdentity) throw new TypeError("tool-result pruning policy identity mismatch")
  return rebuilt
}

function strictArrayValues(value: unknown, label: string): unknown[] {
  assertNoStructuralHooks(value, label)
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype) {
    throw new TypeError(`${label} must be a plain array`)
  }
  if (value.length > KDO_H5_R1A_LIMITS.maxMessages) {
    throw new RangeError(`${label} exceeds ${KDO_H5_R1A_LIMITS.maxMessages} messages`)
  }
  const descriptors = Object.getOwnPropertyDescriptors(value)
  const allowed = new Set<string>(["length"])
  const output: unknown[] = []
  for (let index = 0; index < value.length; index += 1) {
    const key = String(index)
    allowed.add(key)
    const descriptor = descriptors[key]
    if (!descriptor || !("value" in descriptor) || !descriptor.enumerable) {
      throw new TypeError(`${label} must be a dense plain array`)
    }
    if (descriptor.value === undefined) throw new TypeError(`${label}[${index}] must not be undefined`)
    output.push(descriptor.value)
  }
  for (const key of Object.keys(descriptors)) {
    if (!allowed.has(key)) throw new TypeError(`${label} contains unknown array field: ${key}`)
  }
  return output
}

function normalizeMessages(value: unknown): ModelVisibleMessage[] {
  const raw = strictArrayValues(value, "toolResultPruningMessages")
  const messages = raw.map((message, index) => {
    assertNoStructuralHooks(message, `toolResultPruningMessages[${index}]`)
    return validateModelVisibleMessage(message)
  })
  const totalContentBytes = messages.reduce(
    (total, message) => total + Buffer.byteLength(message.content, "utf8"),
    0,
  )
  if (totalContentBytes > KDO_H5_R1A_LIMITS.maxTotalMessageContentBytes) {
    throw new RangeError(
      `toolResultPruningMessages content exceeds ${KDO_H5_R1A_LIMITS.maxTotalMessageContentBytes} UTF-8 bytes`,
    )
  }
  return messages
}

function takeUtf8Prefix(value: string, maxBytes: number): { text: string; bytes: number } {
  let text = ""
  let bytes = 0
  for (const character of value) {
    const characterBytes = Buffer.byteLength(character, "utf8")
    if (bytes + characterBytes > maxBytes) break
    text += character
    bytes += characterBytes
  }
  return { text, bytes }
}

function takeUtf8Suffix(value: string, maxBytes: number): { text: string; bytes: number } {
  const characters = Array.from(value)
  const selected: string[] = []
  let bytes = 0
  for (let index = characters.length - 1; index >= 0; index -= 1) {
    const character = characters[index] as string
    const characterBytes = Buffer.byteLength(character, "utf8")
    if (bytes + characterBytes > maxBytes) break
    selected.push(character)
    bytes += characterBytes
  }
  selected.reverse()
  return { text: selected.join(""), bytes }
}

function pruningMarker(originalBytes: number): string {
  return `\n[kodac-tool-result-pruned-v1 original-bytes=${originalBytes}]\n`
}

function pruneContent(content: string, originalBytes: number, maxBytes: number): {
  content: string
  resultBytes: number
  removedBytes: number
} {
  const marker = pruningMarker(originalBytes)
  const markerBytes = Buffer.byteLength(marker, "utf8")
  if (markerBytes >= maxBytes) throw new RangeError("tool-result pruning byte limit cannot encode the canonical marker")
  const retainedBudget = maxBytes - markerBytes
  const headBudget = Math.floor(retainedBudget / 2)
  const tailBudget = retainedBudget - headBudget
  const head = takeUtf8Prefix(content, headBudget)
  const tail = takeUtf8Suffix(content, tailBudget)
  const result = `${head.text}${marker}${tail.text}`
  const resultBytes = Buffer.byteLength(result, "utf8")
  if (resultBytes > maxBytes) throw new Error("tool-result pruning exceeded its UTF-8 byte bound")
  const removedBytes = originalBytes - head.bytes - tail.bytes
  if (removedBytes <= 0) throw new Error("tool-result pruning did not remove source bytes")
  return { content: result, resultBytes, removedBytes }
}

function changePreimage(input: Omit<ToolResultPruningChange, "changeIdentity">): string {
  return `{"messageIndex":${input.messageIndex},"originalBytes":${input.originalBytes},"originalContentSha256":${JSON.stringify(input.originalContentSha256)},"policyIdentity":${JSON.stringify(input.policyIdentity)},"removedBytes":${input.removedBytes},"resultBytes":${input.resultBytes},"resultContentSha256":${JSON.stringify(input.resultContentSha256)},"version":${JSON.stringify(input.version)}}`
}

function createChange(input: Omit<ToolResultPruningChange, "changeIdentity">): ToolResultPruningChange {
  const base = Object.freeze({ ...input })
  return Object.freeze({ ...base, changeIdentity: sha256(changePreimage(base)) })
}

function messageListIdentity(messages: readonly ModelVisibleMessage[]): string {
  return sha256(`[${messages.map((message) => canonicalModelVisibleMessage(message)).join(",")}]`)
}

function resultPreimage(input: {
  policyIdentity: string
  inputIdentity: string
  outputIdentity: string
  changeIdentities: readonly string[]
}): string {
  return `{"changeIdentities":${JSON.stringify(input.changeIdentities)},"inputIdentity":${JSON.stringify(input.inputIdentity)},"outputIdentity":${JSON.stringify(input.outputIdentity)},"policyIdentity":${JSON.stringify(input.policyIdentity)},"version":${JSON.stringify(KDO_H5_R1A_RESULT_VERSION)}}`
}

export function pruneModelVisibleToolResults(
  messagesValue: unknown,
  policyValue: unknown,
): ToolResultPruningResult {
  const policy = validateToolResultPruningPolicy(policyValue)
  const inputMessages = normalizeMessages(messagesValue)
  const inputIdentity = messageListIdentity(inputMessages)
  const changes: ToolResultPruningChange[] = []
  const outputMessages = inputMessages.map((message, messageIndex) => {
    const originalBytes = Buffer.byteLength(message.content, "utf8")
    if (message.role !== "tool" || originalBytes <= policy.maxToolResultBytes) return message

    const pruned = pruneContent(message.content, originalBytes, policy.maxToolResultBytes)
    const materialized = materializeModelVisibleMessage(message)
    materialized.content = pruned.content
    const resultMessage = validateModelVisibleMessage(materialized)
    changes.push(createChange({
      version: KDO_H5_R1A_CHANGE_VERSION,
      messageIndex,
      originalBytes,
      resultBytes: pruned.resultBytes,
      removedBytes: pruned.removedBytes,
      originalContentSha256: sha256(message.content),
      resultContentSha256: sha256(resultMessage.content),
      policyIdentity: policy.policyIdentity,
    }))
    return resultMessage
  })

  const outputIdentity = messageListIdentity(outputMessages)
  const frozenMessages = Object.freeze([...outputMessages])
  const frozenChanges = Object.freeze([...changes])
  const resultIdentity = sha256(resultPreimage({
    policyIdentity: policy.policyIdentity,
    inputIdentity,
    outputIdentity,
    changeIdentities: frozenChanges.map((change) => change.changeIdentity),
  }))
  return Object.freeze({
    version: KDO_H5_R1A_RESULT_VERSION,
    policy,
    inputIdentity,
    outputIdentity,
    messages: frozenMessages,
    changes: frozenChanges,
    resultIdentity,
  })
}
