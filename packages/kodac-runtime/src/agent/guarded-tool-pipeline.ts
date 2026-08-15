import { createHash } from "node:crypto"

export const KDO_H5_R3A_PIPELINE_VERSION = "kodac-guarded-tool-pipeline-v1" as const
export const KDO_H5_R3A_DECISION_VERSION = "kodac-guarded-tool-decision-v1" as const
export const KDO_H5_R3A_RESULT_VERSION = "kodac-guarded-tool-pipeline-result-v1" as const

export const KDO_H5_R3A_LIMITS = Object.freeze({
  maxPipelineJsonBytes: 256 * 1024,
  maxTools: 256,
  maxNameBytes: 160,
  maxCapabilityBytes: 160,
  maxDecisions: 128,
  maxDecisionIdBytes: 160,
  maxStageIdBytes: 160,
  maxCodeBytes: 160,
  maxInputBytes: 128 * 1024,
  maxJsonDepth: 64,
  maxInputItems: 8192,
} as const)

export const KDO_H5_R3A_DEEPCODE_DONOR_PROVENANCE = Object.freeze({
  repository: "HKUDS/DeepCode",
  sourceCommit: "287510fbf6820147a48adf79f7fd86b0ed1afe92",
  sourceTree: "7f44b320f86d04d4315242fabc74f1b325829be8",
  license: "MIT",
  intakeMode: "PORT_SELECTED_CONTRACT_IDEAS",
  sources: Object.freeze([
    Object.freeze({ path: "core/agent_runtime/runner.py", blob: "645ab82f768214cce0794984c4bc9b92b099ce5a", role: "integration-reference" }),
    Object.freeze({ path: "core/agent_runtime/hook.py", blob: "b0bbe5ea880f8688306a348ca72f2a29d4ffc9cc", role: "lifecycle-reference" }),
    Object.freeze({ path: "core/harness/hooks/events.py", blob: "ed393156d9e53d543220387fa4421785a0ce0b83", role: "matcher-reference" }),
    Object.freeze({ path: "core/harness/hooks/engine.py", blob: "26f66a1199057077372e26d831f58e7d54bf5d89", role: "fold-reference" }),
  ]),
} as const)

export const KDO_H5_R3A_AGENTICA_STUDY_PROVENANCE = Object.freeze({
  repository: "wrtnlabs/agentica",
  sourceCommit: "dc91f4307a3f2ee25e1ee07cf48777fcd13b6b0d",
  license: "MIT",
  licenseBlob: "886b7e88682164a5a22e609120c9f96c9ea57216",
  copyright: "Copyright (c) 2025 Wrtn Technologies",
  intakeMode: "STUDY_ONLY",
  sources: Object.freeze([
    Object.freeze({
      path: "website/content/docs/concepts/function-calling.mdx",
      blob: "9e5577511d65369e8439a958683b81e541dc87ee",
      role: "validation-feedback-design-reference",
    }),
  ]),
} as const)

type JsonPrimitive = null | boolean | number | string
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject

type GuardDecisionKind = "observe" | "remove_tool" | "block_call" | "replace_input"

export interface GuardedToolDescriptor {
  readonly name: string
  readonly capability: string
}

export interface GuardedToolCall {
  readonly toolName: string
  readonly capability: string
  readonly input: JsonValue
}

export interface GuardedToolPipelineResult {
  readonly version: typeof KDO_H5_R3A_RESULT_VERSION
  readonly baseToolSetIdentity: string
  readonly effectiveToolSetIdentity: string
  readonly originalInputIdentity: string
  readonly originalCallIdentity: string
  readonly finalInputIdentity: string
  readonly finalCallIdentity: string
  readonly blocked: boolean
  readonly blockCode: string | null
  readonly inputChanged: boolean
  readonly requiresK2Reevaluation: boolean
  readonly effectiveTools: readonly GuardedToolDescriptor[]
  readonly effectiveCall: GuardedToolCall
  readonly decisionIdentities: readonly string[]
  readonly resultIdentity: string
}

interface GuardDecisionBase {
  readonly version: typeof KDO_H5_R3A_DECISION_VERSION
  readonly decisionId: string
  readonly stageId: string
  readonly code: string
  readonly kind: GuardDecisionKind
}

interface ObserveDecision extends GuardDecisionBase {
  readonly kind: "observe"
}

interface RemoveToolDecision extends GuardDecisionBase {
  readonly kind: "remove_tool"
  readonly toolName: string
  readonly capability: string
}

interface BlockCallDecision extends GuardDecisionBase {
  readonly kind: "block_call"
}

interface ReplaceInputDecision extends GuardDecisionBase {
  readonly kind: "replace_input"
  readonly input: JsonValue
}

type GuardDecision = ObserveDecision | RemoveToolDecision | BlockCallDecision | ReplaceInputDecision

const PIPELINE_KEYS = ["call", "decisions", "tools", "version"] as const
const TOOL_KEYS = ["capability", "name"] as const
const CALL_KEYS = ["capability", "input", "toolName"] as const
const OBSERVE_KEYS = ["code", "decisionId", "kind", "stageId", "version"] as const
const REMOVE_KEYS = ["capability", "code", "decisionId", "kind", "stageId", "toolName", "version"] as const
const BLOCK_KEYS = OBSERVE_KEYS
const REPLACE_KEYS = ["code", "decisionId", "input", "kind", "stageId", "version"] as const
const PARSER_MAX_DEPTH = KDO_H5_R3A_LIMITS.maxJsonDepth + 8

function assertPrimitiveJsonText(value: unknown): string {
  if (typeof value !== "string") throw new TypeError("guardedToolPipelineJson must be a primitive JSON string")
  if (Buffer.byteLength(value, "utf8") > KDO_H5_R3A_LIMITS.maxPipelineJsonBytes) {
    throw new RangeError(`guardedToolPipelineJson exceeds ${KDO_H5_R3A_LIMITS.maxPipelineJsonBytes} UTF-8 bytes`)
  }
  return value
}

function assertUnicodeScalars(value: string, label: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const trailing = value.charCodeAt(index + 1)
      if (!(trailing >= 0xdc00 && trailing <= 0xdfff)) {
        throw new TypeError(`${label} contains an unpaired high surrogate`)
      }
      index += 1
      continue
    }
    if (code >= 0xdc00 && code <= 0xdfff) throw new TypeError(`${label} contains an unpaired low surrogate`)
  }
}

class StrictJsonParser {
  private index = 0
  private readonly text: string

  constructor(text: string) {
    this.text = text
  }

  parse(): JsonValue {
    this.skipWhitespace()
    const value = this.parseValue(0)
    this.skipWhitespace()
    if (this.index !== this.text.length) throw new SyntaxError("JSON text contains trailing data")
    return value
  }

  private parseValue(depth: number): JsonValue {
    if (depth > PARSER_MAX_DEPTH) throw new RangeError(`JSON text exceeds parser depth ${PARSER_MAX_DEPTH}`)
    this.skipWhitespace()
    const current = this.text[this.index]
    if (current === '"') return this.parseString()
    if (current === "{") return this.parseObject(depth + 1)
    if (current === "[") return this.parseArray(depth + 1)
    if (current === "t") return this.parseLiteral("true", true)
    if (current === "f") return this.parseLiteral("false", false)
    if (current === "n") return this.parseLiteral("null", null)
    if (current === "-" || (current !== undefined && current >= "0" && current <= "9")) return this.parseNumber()
    throw new SyntaxError(`invalid JSON token at offset ${this.index}`)
  }

  private parseObject(depth: number): JsonObject {
    this.index += 1
    this.skipWhitespace()
    const output = Object.create(null) as JsonObject
    const seen = new Set<string>()
    if (this.text[this.index] === "}") {
      this.index += 1
      return output
    }
    while (true) {
      if (this.text[this.index] !== '"') throw new SyntaxError(`JSON object key expected at offset ${this.index}`)
      const key = this.parseString()
      if (seen.has(key)) throw new SyntaxError(`JSON object contains duplicate key: ${key}`)
      seen.add(key)
      this.skipWhitespace()
      if (this.text[this.index] !== ":") throw new SyntaxError(`JSON object colon expected at offset ${this.index}`)
      this.index += 1
      output[key] = this.parseValue(depth)
      this.skipWhitespace()
      const delimiter = this.text[this.index]
      if (delimiter === "}") {
        this.index += 1
        return output
      }
      if (delimiter !== ",") throw new SyntaxError(`JSON object delimiter expected at offset ${this.index}`)
      this.index += 1
      this.skipWhitespace()
    }
  }

  private parseArray(depth: number): JsonValue[] {
    this.index += 1
    this.skipWhitespace()
    const output: JsonValue[] = []
    if (this.text[this.index] === "]") {
      this.index += 1
      return output
    }
    while (true) {
      output.push(this.parseValue(depth))
      this.skipWhitespace()
      const delimiter = this.text[this.index]
      if (delimiter === "]") {
        this.index += 1
        return output
      }
      if (delimiter !== ",") throw new SyntaxError(`JSON array delimiter expected at offset ${this.index}`)
      this.index += 1
      this.skipWhitespace()
    }
  }

  private parseString(): string {
    const start = this.index
    this.index += 1
    while (this.index < this.text.length) {
      const code = this.text.charCodeAt(this.index)
      if (code < 0x20) throw new SyntaxError(`JSON string contains an unescaped control character at offset ${this.index}`)
      if (this.text[this.index] === "\\") {
        this.index += 2
        continue
      }
      if (this.text[this.index] === '"') {
        this.index += 1
        const token = this.text.slice(start, this.index)
        let parsed: unknown
        try {
          parsed = JSON.parse(token)
        } catch {
          throw new SyntaxError(`invalid JSON string at offset ${start}`)
        }
        if (typeof parsed !== "string") throw new SyntaxError(`invalid JSON string at offset ${start}`)
        assertUnicodeScalars(parsed, "JSON string")
        return parsed
      }
      this.index += 1
    }
    throw new SyntaxError(`unterminated JSON string at offset ${start}`)
  }

  private parseNumber(): number {
    const remainder = this.text.slice(this.index)
    const match = remainder.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/)
    if (!match) throw new SyntaxError(`invalid JSON number at offset ${this.index}`)
    const token = match[0]
    this.index += token.length
    const value = Number(token)
    if (!Number.isFinite(value)) throw new RangeError("JSON number must be finite IEEE-754 binary64")
    return value
  }

  private parseLiteral<T extends boolean | null>(token: string, value: T): T {
    if (!this.text.startsWith(token, this.index)) throw new SyntaxError(`invalid JSON literal at offset ${this.index}`)
    this.index += token.length
    return value
  }

  private skipWhitespace(): void {
    while (this.index < this.text.length) {
      const char = this.text[this.index]
      if (char !== " " && char !== "\t" && char !== "\n" && char !== "\r") return
      this.index += 1
    }
  }
}

function parseJsonText(text: string): JsonValue {
  return new StrictJsonParser(text).parse()
}

function asObject(value: JsonValue, label: string): JsonObject {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be a JSON object`)
  return value
}

function exactKeys(record: JsonObject, keys: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...keys].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
}

function boundedString(value: JsonValue | undefined, label: string, maxBytes: number): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be a JSON string`)
  assertUnicodeScalars(value, label)
  const bytes = Buffer.byteLength(value, "utf8")
  if (bytes < 1 || bytes > maxBytes) throw new RangeError(`${label} must be 1..${maxBytes} UTF-8 bytes`)
  return value
}

function compareStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

function canonicalizeJson(value: JsonValue): string {
  if (value === null) return "null"
  if (typeof value === "boolean") return value ? "true" : "false"
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("canonical JSON numbers must be finite")
    const encoded = JSON.stringify(value)
    if (encoded === undefined) throw new TypeError("canonical JSON number serialization failed")
    return encoded
  }
  if (typeof value === "string") {
    assertUnicodeScalars(value, "canonical JSON string")
    return JSON.stringify(value)
  }
  if (Array.isArray(value)) return `[${value.map((entry) => canonicalizeJson(entry)).join(",")}]`
  const keys = Object.keys(value).sort(compareStrings)
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalizeJson(value[key] as JsonValue)}`).join(",")}}`
}

function inspectInput(value: JsonValue, depth = 0, stats = { items: 0 }): void {
  if (depth > KDO_H5_R3A_LIMITS.maxJsonDepth) {
    throw new RangeError(`guarded tool input exceeds JSON depth ${KDO_H5_R3A_LIMITS.maxJsonDepth}`)
  }
  if (typeof value === "string") {
    assertUnicodeScalars(value, "guarded tool input string")
    return
  }
  if (value === null || typeof value !== "object") return
  if (Array.isArray(value)) {
    stats.items += value.length
    if (stats.items > KDO_H5_R3A_LIMITS.maxInputItems) {
      throw new RangeError(`guarded tool input exceeds ${KDO_H5_R3A_LIMITS.maxInputItems} array elements/object members`)
    }
    for (const entry of value) inspectInput(entry, depth + 1, stats)
    return
  }
  const keys = Object.keys(value)
  stats.items += keys.length
  if (stats.items > KDO_H5_R3A_LIMITS.maxInputItems) {
    throw new RangeError(`guarded tool input exceeds ${KDO_H5_R3A_LIMITS.maxInputItems} array elements/object members`)
  }
  for (const key of keys) {
    assertUnicodeScalars(key, "guarded tool input key")
    inspectInput(value[key] as JsonValue, depth + 1, stats)
  }
}

function canonicalInput(value: JsonValue): string {
  inspectInput(value)
  const canonical = canonicalizeJson(value)
  if (Buffer.byteLength(canonical, "utf8") > KDO_H5_R3A_LIMITS.maxInputBytes) {
    throw new RangeError(`guarded tool input exceeds ${KDO_H5_R3A_LIMITS.maxInputBytes} canonical UTF-8 bytes`)
  }
  return canonical
}

type IdentityKind = "TOOL_SET" | "INPUT" | "CALL" | "DECISION" | "PIPELINE_RESULT"

function identity(kind: IdentityKind, canonical: string): string {
  return createHash("sha256")
    .update(Buffer.from(`KODAC-H5-R3A\0${kind}\0V1\0`, "ascii"))
    .update(Buffer.from(canonical, "utf8"))
    .digest("hex")
}

function copyJson(value: JsonValue): JsonValue {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) return value.map((entry) => copyJson(entry))
  const output = Object.create(null) as JsonObject
  for (const key of Object.keys(value)) output[key] = copyJson(value[key] as JsonValue)
  return output
}

function freezeJson(value: JsonValue): JsonValue {
  if (value === null || typeof value !== "object") return value
  if (Array.isArray(value)) {
    for (const entry of value) freezeJson(entry)
    return Object.freeze(value) as unknown as JsonValue
  }
  for (const key of Object.keys(value)) freezeJson(value[key] as JsonValue)
  return Object.freeze(value)
}

function toolObject(tool: GuardedToolDescriptor): JsonObject {
  return { name: tool.name, capability: tool.capability }
}

function normalizeTools(value: JsonValue): GuardedToolDescriptor[] {
  if (!Array.isArray(value)) throw new TypeError("guardedToolPipeline.tools must be a JSON array")
  if (value.length > KDO_H5_R3A_LIMITS.maxTools) throw new RangeError(`guardedToolPipeline.tools exceeds ${KDO_H5_R3A_LIMITS.maxTools} entries`)
  const seenNames = new Set<string>()
  const tools = value.map((entry, index) => {
    const record = asObject(entry, `guardedToolPipeline.tools[${index}]`)
    exactKeys(record, TOOL_KEYS, `guardedToolPipeline.tools[${index}]`)
    const name = boundedString(record.name, `guardedToolPipeline.tools[${index}].name`, KDO_H5_R3A_LIMITS.maxNameBytes)
    const capability = boundedString(record.capability, `guardedToolPipeline.tools[${index}].capability`, KDO_H5_R3A_LIMITS.maxCapabilityBytes)
    if (seenNames.has(name)) throw new TypeError(`guardedToolPipeline.tools contains duplicate tool name: ${name}`)
    seenNames.add(name)
    return Object.freeze({ name, capability })
  })
  return tools.sort((left, right) => compareStrings(left.name, right.name) || compareStrings(left.capability, right.capability))
}

function toolSetIdentity(tools: readonly GuardedToolDescriptor[]): string {
  const object: JsonObject = {
    version: "kodac-guarded-tool-set-v1",
    tools: tools.map((tool) => toolObject(tool)),
  }
  return identity("TOOL_SET", canonicalizeJson(object))
}

function inputIdentity(input: JsonValue): string {
  return identity("INPUT", canonicalInput(input))
}

function callIdentity(toolName: string, capability: string, currentInputIdentity: string): string {
  const object: JsonObject = {
    version: "kodac-guarded-tool-call-v1",
    toolName,
    capability,
    inputIdentity: currentInputIdentity,
  }
  return identity("CALL", canonicalizeJson(object))
}

function normalizeCall(value: JsonValue, tools: readonly GuardedToolDescriptor[]): GuardedToolCall {
  const record = asObject(value, "guardedToolPipeline.call")
  exactKeys(record, CALL_KEYS, "guardedToolPipeline.call")
  const toolName = boundedString(record.toolName, "guardedToolPipeline.call.toolName", KDO_H5_R3A_LIMITS.maxNameBytes)
  const capability = boundedString(record.capability, "guardedToolPipeline.call.capability", KDO_H5_R3A_LIMITS.maxCapabilityBytes)
  const tool = tools.find((candidate) => candidate.name === toolName)
  if (tool === undefined || tool.capability !== capability) {
    throw new TypeError("guardedToolPipeline.call toolName/capability must exist exactly in the base tool set")
  }
  const input = copyJson(record.input as JsonValue)
  canonicalInput(input)
  return Object.freeze({ toolName, capability, input: freezeJson(input) })
}

function normalizeDecision(value: JsonValue, index: number): GuardDecision {
  const label = `guardedToolPipeline.decisions[${index}]`
  const record = asObject(value, label)
  const kind = record.kind
  if (kind !== "observe" && kind !== "remove_tool" && kind !== "block_call" && kind !== "replace_input") {
    throw new TypeError(`${label}.kind is unsupported`)
  }
  exactKeys(
    record,
    kind === "observe" ? OBSERVE_KEYS : kind === "remove_tool" ? REMOVE_KEYS : kind === "block_call" ? BLOCK_KEYS : REPLACE_KEYS,
    label,
  )
  if (record.version !== KDO_H5_R3A_DECISION_VERSION) throw new TypeError(`${label}.version is unsupported`)
  const decisionId = boundedString(record.decisionId, `${label}.decisionId`, KDO_H5_R3A_LIMITS.maxDecisionIdBytes)
  const stageId = boundedString(record.stageId, `${label}.stageId`, KDO_H5_R3A_LIMITS.maxStageIdBytes)
  const code = boundedString(record.code, `${label}.code`, KDO_H5_R3A_LIMITS.maxCodeBytes)
  if (kind === "observe") return Object.freeze({ version: KDO_H5_R3A_DECISION_VERSION, decisionId, stageId, code, kind })
  if (kind === "block_call") return Object.freeze({ version: KDO_H5_R3A_DECISION_VERSION, decisionId, stageId, code, kind })
  if (kind === "remove_tool") {
    return Object.freeze({
      version: KDO_H5_R3A_DECISION_VERSION,
      decisionId,
      stageId,
      code,
      kind,
      toolName: boundedString(record.toolName, `${label}.toolName`, KDO_H5_R3A_LIMITS.maxNameBytes),
      capability: boundedString(record.capability, `${label}.capability`, KDO_H5_R3A_LIMITS.maxCapabilityBytes),
    })
  }
  const input = copyJson(record.input as JsonValue)
  canonicalInput(input)
  return Object.freeze({
    version: KDO_H5_R3A_DECISION_VERSION,
    decisionId,
    stageId,
    code,
    kind,
    input: freezeJson(input),
  })
}

function decisionObject(decision: GuardDecision): JsonObject {
  const common: JsonObject = {
    version: decision.version,
    decisionId: decision.decisionId,
    stageId: decision.stageId,
    code: decision.code,
    kind: decision.kind,
  }
  if (decision.kind === "remove_tool") {
    common.toolName = decision.toolName
    common.capability = decision.capability
  } else if (decision.kind === "replace_input") {
    common.input = decision.input
  }
  return common
}

function normalizeDecisions(value: JsonValue): GuardDecision[] {
  if (!Array.isArray(value)) throw new TypeError("guardedToolPipeline.decisions must be a JSON array")
  if (value.length > KDO_H5_R3A_LIMITS.maxDecisions) {
    throw new RangeError(`guardedToolPipeline.decisions exceeds ${KDO_H5_R3A_LIMITS.maxDecisions} entries`)
  }
  const seenIds = new Set<string>()
  return value.map((entry, index) => {
    const decision = normalizeDecision(entry, index)
    if (seenIds.has(decision.decisionId)) throw new TypeError(`guardedToolPipeline.decisions contains duplicate decisionId: ${decision.decisionId}`)
    seenIds.add(decision.decisionId)
    return decision
  })
}

function resultBase(input: Omit<GuardedToolPipelineResult, "resultIdentity">): JsonObject {
  return {
    version: input.version,
    baseToolSetIdentity: input.baseToolSetIdentity,
    effectiveToolSetIdentity: input.effectiveToolSetIdentity,
    originalInputIdentity: input.originalInputIdentity,
    originalCallIdentity: input.originalCallIdentity,
    finalInputIdentity: input.finalInputIdentity,
    finalCallIdentity: input.finalCallIdentity,
    blocked: input.blocked,
    blockCode: input.blockCode,
    inputChanged: input.inputChanged,
    requiresK2Reevaluation: input.requiresK2Reevaluation,
    effectiveTools: input.effectiveTools.map((tool) => toolObject(tool)),
    effectiveCall: {
      toolName: input.effectiveCall.toolName,
      capability: input.effectiveCall.capability,
      input: input.effectiveCall.input,
    },
    decisionIdentities: [...input.decisionIdentities],
  }
}

export function reduceGuardedToolPipeline(guardedToolPipelineJson: string): GuardedToolPipelineResult {
  const serialized = assertPrimitiveJsonText(guardedToolPipelineJson)
  const root = asObject(parseJsonText(serialized), "guardedToolPipeline")
  exactKeys(root, PIPELINE_KEYS, "guardedToolPipeline")
  if (root.version !== KDO_H5_R3A_PIPELINE_VERSION) throw new TypeError("guardedToolPipeline.version is unsupported")

  const baseTools = normalizeTools(root.tools as JsonValue)
  const originalCall = normalizeCall(root.call as JsonValue, baseTools)
  const decisions = normalizeDecisions(root.decisions as JsonValue)

  const baseToolSetIdentity = toolSetIdentity(baseTools)
  const originalInputIdentity = inputIdentity(originalCall.input)
  const originalCallIdentity = callIdentity(originalCall.toolName, originalCall.capability, originalInputIdentity)

  let effectiveTools = [...baseTools]
  let effectiveInput = copyJson(originalCall.input)
  let blocked = false
  let blockCode: string | null = null
  let requiresK2Reevaluation = false
  let callGuardPhaseStarted = false
  const decisionIdentities: string[] = []

  for (const decision of decisions) {
    decisionIdentities.push(identity("DECISION", canonicalizeJson(decisionObject(decision))))

    if (decision.kind === "observe") continue

    if (decision.kind === "remove_tool") {
      if (callGuardPhaseStarted) throw new TypeError("remove_tool is not allowed after call-guard mutation begins")
      const index = effectiveTools.findIndex((tool) => tool.name === decision.toolName)
      if (index < 0 || effectiveTools[index]?.capability !== decision.capability) {
        throw new TypeError("remove_tool must identify an existing effective tool name/capability pair")
      }
      effectiveTools = effectiveTools.filter((_, candidateIndex) => candidateIndex !== index)
      if (decision.toolName === originalCall.toolName && decision.capability === originalCall.capability) {
        blocked = true
        blockCode ??= "tool_removed"
      }
      continue
    }

    callGuardPhaseStarted = true

    if (decision.kind === "block_call") {
      if (!blocked) {
        blocked = true
        blockCode = decision.code
      }
      continue
    }

    const currentCanonical = canonicalInput(effectiveInput)
    const replacementCanonical = canonicalInput(decision.input)
    if (replacementCanonical !== currentCanonical) {
      effectiveInput = copyJson(decision.input)
      requiresK2Reevaluation = true
    }
  }

  const finalInput = freezeJson(copyJson(effectiveInput))
  const finalInputIdentity = inputIdentity(finalInput)
  const finalCallIdentity = callIdentity(originalCall.toolName, originalCall.capability, finalInputIdentity)
  const inputChanged = finalInputIdentity !== originalInputIdentity
  const frozenTools = Object.freeze(effectiveTools.map((tool) => Object.freeze({ ...tool })))
  const effectiveCall = Object.freeze({
    toolName: originalCall.toolName,
    capability: originalCall.capability,
    input: finalInput,
  })
  const frozenDecisionIdentities = Object.freeze([...decisionIdentities])

  const withoutIdentity: Omit<GuardedToolPipelineResult, "resultIdentity"> = Object.freeze({
    version: KDO_H5_R3A_RESULT_VERSION,
    baseToolSetIdentity,
    effectiveToolSetIdentity: toolSetIdentity(frozenTools),
    originalInputIdentity,
    originalCallIdentity,
    finalInputIdentity,
    finalCallIdentity,
    blocked,
    blockCode,
    inputChanged,
    requiresK2Reevaluation,
    effectiveTools: frozenTools,
    effectiveCall,
    decisionIdentities: frozenDecisionIdentities,
  })
  const resultIdentity = identity("PIPELINE_RESULT", canonicalizeJson(resultBase(withoutIdentity)))
  return Object.freeze({ ...withoutIdentity, resultIdentity })
}
