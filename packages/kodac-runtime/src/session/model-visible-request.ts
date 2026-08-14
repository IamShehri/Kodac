import { createHash } from "node:crypto"

import type { ModelMessage, ModelToolCall, ModelToolDescriptor } from "../model/provider.ts"

export const KDO_H2_R1_REQUEST_VERSION = "kodac-model-visible-request-v1" as const

export const KDO_H2_R1_DEEPSEEK_HARNESS_DONOR_PROVENANCE = Object.freeze({
  repository: "deepseek-ai/deepseek-harness",
  sourceCommit: "47f943859bef60e4160492346772ded9b24f765a",
  license: "MIT",
  intakeMode: "PORT",
  sources: Object.freeze([
    Object.freeze({ path: "docs/subsystems/session.md", blob: "aea9d00b38e384e7a973ce168c3a75a62e70a8bb" }),
  ]),
} as const)

export const KDO_H2_R1_LIMITS: Readonly<{
  maxProviderBytes: number
  maxModelBytes: number
  maxMessages: number
  maxMessageContentBytes: number
  maxTotalMessageContentBytes: number
  maxMessageNameBytes: number
  maxToolCallIdBytes: number
  maxToolCallsPerMessage: number
  maxToolCallInputBytes: number
  maxTools: number
  maxToolNameBytes: number
  maxCapabilityBytes: number
  maxToolDescriptionBytes: number
  maxToolSchemaBytes: number
  maxSnapshotBytes: number
  maxJsonDepth: number
}> = Object.freeze({
  maxProviderBytes: 160,
  maxModelBytes: 256,
  maxMessages: 512,
  maxMessageContentBytes: 512 * 1024,
  maxTotalMessageContentBytes: 4 * 1024 * 1024,
  maxMessageNameBytes: 160,
  maxToolCallIdBytes: 256,
  maxToolCallsPerMessage: 128,
  maxToolCallInputBytes: 512 * 1024,
  maxTools: 256,
  maxToolNameBytes: 160,
  maxCapabilityBytes: 160,
  maxToolDescriptionBytes: 64 * 1024,
  maxToolSchemaBytes: 512 * 1024,
  maxSnapshotBytes: 8 * 1024 * 1024,
  maxJsonDepth: 64,
})

export type ModelVisibleMessage = Omit<Readonly<ModelMessage>, "toolCalls"> & {
  readonly toolCalls?: readonly Readonly<ModelToolCall>[]
}

export interface ModelVisibleRequestSnapshot {
  readonly version: typeof KDO_H2_R1_REQUEST_VERSION
  readonly provider: string
  readonly model: string
  readonly messages: readonly ModelVisibleMessage[]
  readonly tools: readonly Readonly<ModelToolDescriptor>[]
  readonly messageCount: number
  readonly toolCount: number
  readonly totalMessageContentBytes: number
  readonly modelVisibleBytes: number
  readonly requestIdentity: string
}

export interface ModelVisibleRequestInput {
  readonly provider: string
  readonly model: string
  readonly messages: readonly ModelMessage[]
  readonly tools: readonly ModelToolDescriptor[]
}

export interface MaterializedModelVisibleRequest {
  model: string
  messages: ModelMessage[]
  tools: ModelToolDescriptor[]
}

const SHA256 = /^[0-9a-f]{64}$/
const ROLE = new Set(["system", "user", "assistant", "tool"])
const MESSAGE_KEYS = ["role", "content", "name", "toolCallId", "toolCalls"] as const
const TOOL_CALL_KEYS = ["id", "name", "input"] as const
const TOOL_KEYS = ["name", "capability", "description", "inputSchema"] as const
const SNAPSHOT_KEYS = [
  "version", "provider", "model", "messages", "tools", "messageCount", "toolCount",
  "totalMessageContentBytes", "modelVisibleBytes", "requestIdentity",
] as const
const CANONICAL_ENVELOPE_DEPTH_ALLOWANCE = 8
const TRUSTED_SNAPSHOTS = new WeakSet<object>()

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`)
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain JSON object`)
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

function ownArrayDataValues(array: readonly unknown[], label: string): unknown[] {
  if (Object.getPrototypeOf(array) !== Array.prototype) throw new TypeError(`${label} must be a plain array`)
  if (Object.getOwnPropertySymbols(array).length > 0) throw new TypeError(`${label} contains symbol-keyed fields`)
  const descriptors = Object.getOwnPropertyDescriptors(array)
  const allowedKeys = new Set<string>(["length"])
  const values: unknown[] = []
  for (let index = 0; index < array.length; index += 1) {
    const key = String(index)
    allowedKeys.add(key)
    const descriptor = descriptors[key]
    if (!descriptor) throw new TypeError(`${label} contains a sparse array`)
    if (!descriptor.enumerable) throw new TypeError(`${label} contains non-enumerable field: ${key}`)
    if (!("value" in descriptor)) throw new TypeError(`${label} contains accessor field: ${key}`)
    if (descriptor.value === undefined) throw new TypeError(`${label} contains undefined item: ${key}`)
    values.push(descriptor.value)
  }
  for (const key of Object.keys(descriptors)) {
    if (!allowedKeys.has(key)) throw new TypeError(`${label} contains unknown array field: ${key}`)
  }
  return values
}

function exactKeys(record: Record<string, unknown>, allowed: readonly string[], label: string): void {
  const allowedSet = new Set(allowed)
  for (const [key, value] of ownDataEntries(record, label)) {
    if (!allowedSet.has(key)) throw new TypeError(`${label} contains unknown field: ${key}`)
    if (value === undefined) throw new TypeError(`${label} contains undefined field: ${key}`)
  }
}

function boundedString(value: unknown, label: string, maxBytes: number, allowEmpty = false): string {
  if (typeof value !== "string" || (!allowEmpty && value.length === 0)) {
    throw new TypeError(`${label} must be ${allowEmpty ? "a string" : "a non-empty string"}`)
  }
  if (value.includes("\0")) throw new TypeError(`${label} must be NUL-free`)
  const bytes = Buffer.byteLength(value, "utf8")
  if (bytes > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function defineJsonOwnProperty(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  })
}

function cloneJson(value: unknown, label: string, seen = new Set<object>(), depth = 0): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${label} contains a non-finite number`)
    return value
  }
  if (typeof value !== "object") throw new TypeError(`${label} must be JSON-compatible; ${typeof value} is not allowed`)
  if (depth > KDO_H2_R1_LIMITS.maxJsonDepth) {
    throw new RangeError(`${label} exceeds ${KDO_H2_R1_LIMITS.maxJsonDepth} JSON nesting levels`)
  }
  if (seen.has(value)) throw new TypeError(`${label} contains a cycle`)
  seen.add(value)
  try {
    if (Array.isArray(value)) {
      const items = ownArrayDataValues(value, label)
      return Object.freeze(items.map((item, index) => cloneJson(item, `${label}[${index}]`, seen, depth + 1)))
    }
    const input = asRecord(value, label)
    const output: Record<string, unknown> = {}
    for (const [key, item] of ownDataEntries(input, label).sort(([a], [b]) => compareStrings(a, b))) {
      if (item === undefined) throw new TypeError(`${label} contains undefined field: ${key}`)
      defineJsonOwnProperty(output, key, cloneJson(item, `${label}.${key}`, seen, depth + 1))
    }
    return Object.freeze(output)
  } finally {
    seen.delete(value)
  }
}

function cloneMutableJson(value: unknown, label: string, depth = 0): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") return value
  if (typeof value !== "object") throw new TypeError(`${label} must be JSON-compatible`)
  if (depth > KDO_H2_R1_LIMITS.maxJsonDepth) {
    throw new RangeError(`${label} exceeds ${KDO_H2_R1_LIMITS.maxJsonDepth} JSON nesting levels`)
  }
  if (Array.isArray(value)) {
    return ownArrayDataValues(value, label).map((item, index) => cloneMutableJson(item, `${label}[${index}]`, depth + 1))
  }
  const input = asRecord(value, label)
  const output: Record<string, unknown> = {}
  for (const [key, item] of ownDataEntries(input, label)) {
    defineJsonOwnProperty(output, key, cloneMutableJson(item, `${label}.${key}`, depth + 1))
  }
  return output
}

function canonicalize(value: unknown, depth = 0): string {
  if (value === null) return "null"
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value)
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical value contains a non-finite number")
    return JSON.stringify(value)
  }
  if (typeof value !== "object") throw new TypeError(`canonical value must be JSON-compatible; ${typeof value} is not allowed`)
  const maxDepth = KDO_H2_R1_LIMITS.maxJsonDepth + CANONICAL_ENVELOPE_DEPTH_ALLOWANCE
  if (depth > maxDepth) throw new RangeError(`canonical value exceeds ${maxDepth} JSON nesting levels`)
  if (Array.isArray(value)) {
    const items = ownArrayDataValues(value, "canonical value")
    return `[${items.map((item) => canonicalize(item, depth + 1)).join(",")}]`
  }
  const record = asRecord(value, "canonical value")
  const entries = ownDataEntries(record, "canonical value").sort(([a], [b]) => compareStrings(a, b))
  return `{${entries.map(([key, item]) => {
    if (item === undefined) throw new TypeError(`canonical value contains undefined field: ${key}`)
    return `${JSON.stringify(key)}:${canonicalize(item, depth + 1)}`
  }).join(",")}}`
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function optionalString(value: unknown, label: string, maxBytes: number): string | undefined {
  return value === undefined ? undefined : boundedString(value, label, maxBytes)
}

function normalizeToolCall(value: unknown, label: string): Readonly<ModelToolCall> {
  const record = asRecord(value, label)
  exactKeys(record, TOOL_CALL_KEYS, label)
  const input = cloneJson(record.input, `${label}.input`)
  const inputBytes = Buffer.byteLength(canonicalize(input), "utf8")
  if (inputBytes > KDO_H2_R1_LIMITS.maxToolCallInputBytes) {
    throw new RangeError(`${label}.input exceeds ${KDO_H2_R1_LIMITS.maxToolCallInputBytes} canonical JSON bytes`)
  }
  return Object.freeze({
    id: boundedString(record.id, `${label}.id`, KDO_H2_R1_LIMITS.maxToolCallIdBytes),
    name: boundedString(record.name, `${label}.name`, KDO_H2_R1_LIMITS.maxToolNameBytes),
    input,
  })
}

function normalizeMessage(value: unknown, index: number): ModelVisibleMessage {
  const label = `modelVisibleRequest.messages[${index}]`
  const record = asRecord(value, label)
  exactKeys(record, MESSAGE_KEYS, label)
  if (typeof record.role !== "string" || !ROLE.has(record.role)) throw new TypeError(`${label}.role is unsupported`)
  const content = boundedString(record.content, `${label}.content`, KDO_H2_R1_LIMITS.maxMessageContentBytes, true)
  const name = optionalString(record.name, `${label}.name`, KDO_H2_R1_LIMITS.maxMessageNameBytes)
  const toolCallId = optionalString(record.toolCallId, `${label}.toolCallId`, KDO_H2_R1_LIMITS.maxToolCallIdBytes)
  let toolCalls: readonly Readonly<ModelToolCall>[] | undefined
  if (record.toolCalls !== undefined) {
    if (!Array.isArray(record.toolCalls) || record.toolCalls.length > KDO_H2_R1_LIMITS.maxToolCallsPerMessage) {
      throw new TypeError(`${label}.toolCalls must contain at most ${KDO_H2_R1_LIMITS.maxToolCallsPerMessage} entries`)
    }
    const ids = new Set<string>()
    const calls = ownArrayDataValues(record.toolCalls, `${label}.toolCalls`)
    const normalized = calls.map((call, callIndex) => normalizeToolCall(call, `${label}.toolCalls[${callIndex}]`))
    for (const call of normalized) {
      if (ids.has(call.id)) throw new TypeError(`${label}.toolCalls contains duplicate id: ${call.id}`)
      ids.add(call.id)
    }
    toolCalls = Object.freeze(normalized)
  }
  return Object.freeze({
    role: record.role as ModelMessage["role"],
    content,
    ...(name === undefined ? {} : { name }),
    ...(toolCallId === undefined ? {} : { toolCallId }),
    ...(toolCalls === undefined ? {} : { toolCalls }),
  })
}

function normalizeTool(value: unknown, index: number): Readonly<ModelToolDescriptor> {
  const label = `modelVisibleRequest.tools[${index}]`
  const record = asRecord(value, label)
  exactKeys(record, TOOL_KEYS, label)
  const inputSchema = cloneJson(record.inputSchema, `${label}.inputSchema`)
  if (inputSchema === null || typeof inputSchema !== "object" || Array.isArray(inputSchema)) {
    throw new TypeError(`${label}.inputSchema must be a JSON object`)
  }
  const schemaBytes = Buffer.byteLength(canonicalize(inputSchema), "utf8")
  if (schemaBytes > KDO_H2_R1_LIMITS.maxToolSchemaBytes) {
    throw new RangeError(`${label}.inputSchema exceeds ${KDO_H2_R1_LIMITS.maxToolSchemaBytes} canonical JSON bytes`)
  }
  return Object.freeze({
    name: boundedString(record.name, `${label}.name`, KDO_H2_R1_LIMITS.maxToolNameBytes),
    capability: boundedString(record.capability, `${label}.capability`, KDO_H2_R1_LIMITS.maxCapabilityBytes),
    description: boundedString(record.description, `${label}.description`, KDO_H2_R1_LIMITS.maxToolDescriptionBytes, true),
    inputSchema: inputSchema as Record<string, unknown>,
  })
}

function requestPreimage(input: {
  provider: string
  model: string
  messages: readonly ModelVisibleMessage[]
  tools: readonly Readonly<ModelToolDescriptor>[]
}): Readonly<Record<string, unknown>> {
  return Object.freeze({
    version: KDO_H2_R1_REQUEST_VERSION,
    provider: input.provider,
    model: input.model,
    messages: input.messages,
    tools: input.tools,
  })
}

export function createModelVisibleRequestSnapshot(input: ModelVisibleRequestInput): ModelVisibleRequestSnapshot {
  const inputRecord = asRecord(input, "modelVisibleRequest")
  exactKeys(inputRecord, ["provider", "model", "messages", "tools"], "modelVisibleRequest")
  if (!Array.isArray(input.messages) || input.messages.length > KDO_H2_R1_LIMITS.maxMessages) {
    throw new TypeError(`modelVisibleRequest.messages must contain at most ${KDO_H2_R1_LIMITS.maxMessages} entries`)
  }
  if (!Array.isArray(input.tools) || input.tools.length > KDO_H2_R1_LIMITS.maxTools) {
    throw new TypeError(`modelVisibleRequest.tools must contain at most ${KDO_H2_R1_LIMITS.maxTools} entries`)
  }
  const provider = boundedString(input.provider, "modelVisibleRequest.provider", KDO_H2_R1_LIMITS.maxProviderBytes)
  const model = boundedString(input.model, "modelVisibleRequest.model", KDO_H2_R1_LIMITS.maxModelBytes)
  const inputMessages = ownArrayDataValues(input.messages, "modelVisibleRequest.messages")
  const messages = Object.freeze(inputMessages.map((message, index) => normalizeMessage(message, index)))
  const totalMessageContentBytes = messages.reduce((total, message) => total + Buffer.byteLength(message.content, "utf8"), 0)
  if (totalMessageContentBytes > KDO_H2_R1_LIMITS.maxTotalMessageContentBytes) {
    throw new RangeError(`modelVisibleRequest message content exceeds ${KDO_H2_R1_LIMITS.maxTotalMessageContentBytes} UTF-8 bytes total`)
  }
  const inputTools = ownArrayDataValues(input.tools, "modelVisibleRequest.tools")
  const normalizedTools = inputTools.map((tool, index) => normalizeTool(tool, index))
  const toolNames = new Set<string>()
  for (const tool of normalizedTools) {
    if (toolNames.has(tool.name)) throw new TypeError(`modelVisibleRequest contains duplicate tool: ${tool.name}`)
    toolNames.add(tool.name)
  }
  const tools = Object.freeze(normalizedTools)
  const preimage = requestPreimage({ provider, model, messages, tools })
  const canonical = canonicalize(preimage)
  const modelVisibleBytes = Buffer.byteLength(canonical, "utf8")
  const snapshot: ModelVisibleRequestSnapshot = Object.freeze({
    version: KDO_H2_R1_REQUEST_VERSION,
    provider,
    model,
    messages,
    tools,
    messageCount: messages.length,
    toolCount: tools.length,
    totalMessageContentBytes,
    modelVisibleBytes,
    requestIdentity: sha256(canonical),
  })
  const snapshotBytes = Buffer.byteLength(canonicalize(snapshot), "utf8")
  if (snapshotBytes > KDO_H2_R1_LIMITS.maxSnapshotBytes) {
    throw new RangeError(`modelVisibleRequest snapshot exceeds ${KDO_H2_R1_LIMITS.maxSnapshotBytes} canonical JSON bytes`)
  }
  TRUSTED_SNAPSHOTS.add(snapshot)
  return snapshot
}

export function validateModelVisibleRequestSnapshot(value: unknown): ModelVisibleRequestSnapshot {
  const record = asRecord(value, "modelVisibleRequestSnapshot")
  exactKeys(record, SNAPSHOT_KEYS, "modelVisibleRequestSnapshot")
  if (record.version !== KDO_H2_R1_REQUEST_VERSION) throw new TypeError("unsupported model-visible request snapshot")
  if (typeof record.requestIdentity !== "string" || !SHA256.test(record.requestIdentity)) {
    throw new TypeError("modelVisibleRequestSnapshot.requestIdentity must be a lowercase SHA-256 identity")
  }
  const rebuilt = createModelVisibleRequestSnapshot({
    provider: record.provider as string,
    model: record.model as string,
    messages: record.messages as ModelMessage[],
    tools: record.tools as ModelToolDescriptor[],
  })
  if (
    record.requestIdentity !== rebuilt.requestIdentity ||
    record.messageCount !== rebuilt.messageCount ||
    record.toolCount !== rebuilt.toolCount ||
    record.totalMessageContentBytes !== rebuilt.totalMessageContentBytes ||
    record.modelVisibleBytes !== rebuilt.modelVisibleBytes ||
    canonicalize(record) !== canonicalize(rebuilt)
  ) {
    throw new TypeError("model-visible request snapshot derived fields mismatch")
  }
  return rebuilt
}

function cloneToolCall(call: Readonly<ModelToolCall>): ModelToolCall {
  return { id: call.id, name: call.name, input: cloneMutableJson(call.input, "materialized tool call input") }
}

function cloneMessage(message: ModelVisibleMessage): ModelMessage {
  return {
    role: message.role,
    content: message.content,
    ...(message.name === undefined ? {} : { name: message.name }),
    ...(message.toolCallId === undefined ? {} : { toolCallId: message.toolCallId }),
    ...(message.toolCalls === undefined ? {} : { toolCalls: message.toolCalls.map(cloneToolCall) }),
  }
}

function cloneTool(tool: Readonly<ModelToolDescriptor>): ModelToolDescriptor {
  return {
    name: tool.name,
    capability: tool.capability,
    description: tool.description,
    inputSchema: cloneMutableJson(tool.inputSchema, "materialized tool schema") as Record<string, unknown>,
  }
}

export function materializeModelVisibleRequest(value: unknown): MaterializedModelVisibleRequest {
  const snapshot = value !== null && typeof value === "object" && TRUSTED_SNAPSHOTS.has(value)
    ? value as ModelVisibleRequestSnapshot
    : validateModelVisibleRequestSnapshot(value)
  return {
    model: snapshot.model,
    messages: snapshot.messages.map(cloneMessage),
    tools: snapshot.tools.map(cloneTool),
  }
}
