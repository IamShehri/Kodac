import { createHash } from "node:crypto"

import {
  KDO_H5_R3A_DECISION_VERSION,
  KDO_H5_R3A_LIMITS,
  KDO_H5_R3A_PIPELINE_VERSION,
  reduceGuardedToolPipeline,
  type GuardedToolDescriptor,
  type GuardedToolPipelineResult,
} from "./guarded-tool-pipeline.ts"

export const KDO_H5_R3B_PLAN_VERSION = "kodac-guarded-tool-plan-v1" as const
export const KDO_H5_R3B_CALL_RULE_VERSION = "kodac-guarded-tool-call-rule-v1" as const

export const KDO_H5_R3B_PLAN_LIMITS = Object.freeze({
  maxPlanJsonBytes: 128 * 1024,
  maxRegisteredToolsJsonBytes: 128 * 1024,
  maxCallJsonBytes: KDO_H5_R3A_LIMITS.maxPipelineJsonBytes,
  maxToolDecisions: 128,
  maxCallRules: 256,
  maxRuleDecisions: 128,
  maxTotalDecisions: 1024,
  maxRuleIdBytes: 160,
} as const)

export interface GuardedToolExposurePlanResult {
  readonly planIdentity: string
  readonly baseToolSetIdentity: string
  readonly effectiveToolSetIdentity: string
  readonly effectiveTools: readonly GuardedToolDescriptor[]
}

export interface GuardedToolCallPlanResult {
  readonly planIdentity: string
  readonly pipeline: GuardedToolPipelineResult
}

type JsonPrimitive = null | boolean | number | string
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject

type PlanDecisionKind = "observe" | "remove_tool" | "block_call" | "replace_input"

interface PlanDecision {
  readonly version: typeof KDO_H5_R3A_DECISION_VERSION
  readonly decisionId: string
  readonly stageId: string
  readonly code: string
  readonly kind: PlanDecisionKind
  readonly toolName?: string
  readonly capability?: string
  readonly input?: JsonValue
}

interface GuardedToolCallRule {
  readonly version: typeof KDO_H5_R3B_CALL_RULE_VERSION
  readonly ruleId: string
  readonly toolName: string
  readonly capability: string
  readonly decisions: readonly PlanDecision[]
}

interface GuardedToolPlan {
  readonly version: typeof KDO_H5_R3B_PLAN_VERSION
  readonly planIdentity: string
  readonly toolDecisions: readonly PlanDecision[]
  readonly callRules: readonly GuardedToolCallRule[]
}

const PLAN_KEYS = ["callRules", "toolDecisions", "version"] as const
const RULE_KEYS = ["capability", "decisions", "ruleId", "toolName", "version"] as const
const TOOL_KEYS = ["capability", "name"] as const
const CALL_KEYS = ["capability", "input", "toolName"] as const
const OBSERVE_KEYS = ["code", "decisionId", "kind", "stageId", "version"] as const
const REMOVE_KEYS = ["capability", "code", "decisionId", "kind", "stageId", "toolName", "version"] as const
const BLOCK_KEYS = OBSERVE_KEYS
const REPLACE_KEYS = ["code", "decisionId", "input", "kind", "stageId", "version"] as const
const PARSER_MAX_DEPTH = KDO_H5_R3A_LIMITS.maxJsonDepth + 8

function assertPrimitiveJsonText(value: unknown, label: string, maxBytes: number): string {
  if (typeof value !== "string") throw new TypeError(`${label} must be a primitive JSON string`)
  const bytes = Buffer.byteLength(value, "utf8")
  if (bytes > maxBytes) throw new RangeError(`${label} exceeds ${maxBytes} UTF-8 bytes`)
  return value
}

function assertUnicodeScalars(value: string, label: string): void {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const trailing = value.charCodeAt(index + 1)
      if (!(trailing >= 0xdc00 && trailing <= 0xdfff)) throw new TypeError(`${label} contains an unpaired high surrogate`)
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

function decisionKeys(kind: PlanDecisionKind): readonly string[] {
  return kind === "observe" ? OBSERVE_KEYS : kind === "remove_tool" ? REMOVE_KEYS : kind === "block_call" ? BLOCK_KEYS : REPLACE_KEYS
}

function normalizeDecision(value: JsonValue, label: string): PlanDecision {
  const record = asObject(value, label)
  const kind = record.kind
  if (kind !== "observe" && kind !== "remove_tool" && kind !== "block_call" && kind !== "replace_input") {
    throw new TypeError(`${label}.kind is unsupported`)
  }
  exactKeys(record, decisionKeys(kind), label)
  if (record.version !== KDO_H5_R3A_DECISION_VERSION) throw new TypeError(`${label}.version is unsupported`)
  const base = {
    version: KDO_H5_R3A_DECISION_VERSION,
    decisionId: boundedString(record.decisionId, `${label}.decisionId`, KDO_H5_R3A_LIMITS.maxDecisionIdBytes),
    stageId: boundedString(record.stageId, `${label}.stageId`, KDO_H5_R3A_LIMITS.maxStageIdBytes),
    code: boundedString(record.code, `${label}.code`, KDO_H5_R3A_LIMITS.maxCodeBytes),
    kind,
  } as const
  if (kind === "remove_tool") {
    return Object.freeze({
      ...base,
      kind,
      toolName: boundedString(record.toolName, `${label}.toolName`, KDO_H5_R3A_LIMITS.maxNameBytes),
      capability: boundedString(record.capability, `${label}.capability`, KDO_H5_R3A_LIMITS.maxCapabilityBytes),
    })
  }
  if (kind === "replace_input") {
    return Object.freeze({ ...base, kind, input: freezeJson(copyJson(record.input as JsonValue)) })
  }
  return Object.freeze({ ...base, kind })
}

function decisionObject(decision: PlanDecision): JsonObject {
  const object: JsonObject = {
    version: decision.version,
    decisionId: decision.decisionId,
    stageId: decision.stageId,
    code: decision.code,
    kind: decision.kind,
  }
  if (decision.kind === "remove_tool") {
    object.toolName = decision.toolName as string
    object.capability = decision.capability as string
  } else if (decision.kind === "replace_input") {
    object.input = decision.input as JsonValue
  }
  return object
}

function normalizeDecisionArray(value: JsonValue, label: string, max: number): PlanDecision[] {
  if (!Array.isArray(value)) throw new TypeError(`${label} must be a JSON array`)
  if (value.length > max) throw new RangeError(`${label} exceeds ${max} entries`)
  const ids = new Set<string>()
  return value.map((entry, index) => {
    const decision = normalizeDecision(entry, `${label}[${index}]`)
    if (ids.has(decision.decisionId)) throw new TypeError(`${label} contains duplicate decisionId: ${decision.decisionId}`)
    ids.add(decision.decisionId)
    return decision
  })
}

function planObject(plan: Omit<GuardedToolPlan, "planIdentity">): JsonObject {
  return {
    version: plan.version,
    toolDecisions: plan.toolDecisions.map((decision) => decisionObject(decision)),
    callRules: plan.callRules.map((rule) => ({
      version: rule.version,
      ruleId: rule.ruleId,
      toolName: rule.toolName,
      capability: rule.capability,
      decisions: rule.decisions.map((decision) => decisionObject(decision)),
    })),
  }
}

function planIdentity(canonicalPlan: string): string {
  return createHash("sha256")
    .update(Buffer.from("KODAC-H5-R3B\0PLAN\0V1\0", "ascii"))
    .update(Buffer.from(canonicalPlan, "utf8"))
    .digest("hex")
}

function parsePlan(value: unknown): GuardedToolPlan {
  const serialized = assertPrimitiveJsonText(value, "guardPlanJson", KDO_H5_R3B_PLAN_LIMITS.maxPlanJsonBytes)
  const record = asObject(parseJsonText(serialized), "guardPlan")
  exactKeys(record, PLAN_KEYS, "guardPlan")
  if (record.version !== KDO_H5_R3B_PLAN_VERSION) throw new TypeError("guardPlan.version is unsupported")

  const toolDecisions = normalizeDecisionArray(record.toolDecisions as JsonValue, "guardPlan.toolDecisions", KDO_H5_R3B_PLAN_LIMITS.maxToolDecisions)
  for (const decision of toolDecisions) {
    if (decision.kind !== "observe" && decision.kind !== "remove_tool") {
      throw new TypeError("guardPlan.toolDecisions may contain only observe/remove_tool")
    }
  }

  if (!Array.isArray(record.callRules)) throw new TypeError("guardPlan.callRules must be a JSON array")
  if (record.callRules.length > KDO_H5_R3B_PLAN_LIMITS.maxCallRules) {
    throw new RangeError(`guardPlan.callRules exceeds ${KDO_H5_R3B_PLAN_LIMITS.maxCallRules} entries`)
  }
  const ruleIds = new Set<string>()
  const rulePairs = new Set<string>()
  let totalDecisions = toolDecisions.length
  const callRules = record.callRules.map((entry, index) => {
    const label = `guardPlan.callRules[${index}]`
    const rule = asObject(entry, label)
    exactKeys(rule, RULE_KEYS, label)
    if (rule.version !== KDO_H5_R3B_CALL_RULE_VERSION) throw new TypeError(`${label}.version is unsupported`)
    const ruleId = boundedString(rule.ruleId, `${label}.ruleId`, KDO_H5_R3B_PLAN_LIMITS.maxRuleIdBytes)
    const toolName = boundedString(rule.toolName, `${label}.toolName`, KDO_H5_R3A_LIMITS.maxNameBytes)
    const capability = boundedString(rule.capability, `${label}.capability`, KDO_H5_R3A_LIMITS.maxCapabilityBytes)
    if (ruleIds.has(ruleId)) throw new TypeError(`guardPlan.callRules contains duplicate ruleId: ${ruleId}`)
    ruleIds.add(ruleId)
    const pair = JSON.stringify([toolName, capability])
    if (rulePairs.has(pair)) throw new TypeError("guardPlan.callRules contains duplicate toolName/capability pair")
    rulePairs.add(pair)
    const decisions = normalizeDecisionArray(rule.decisions as JsonValue, `${label}.decisions`, KDO_H5_R3B_PLAN_LIMITS.maxRuleDecisions)
    totalDecisions += decisions.length
    if (totalDecisions > KDO_H5_R3B_PLAN_LIMITS.maxTotalDecisions) {
      throw new RangeError(`guardPlan exceeds ${KDO_H5_R3B_PLAN_LIMITS.maxTotalDecisions} total decisions`)
    }
    const globalIds = new Set(toolDecisions.map((decision) => decision.decisionId))
    for (const decision of decisions) {
      if (decision.kind === "remove_tool") throw new TypeError(`${label}.decisions may not contain remove_tool`)
      if (globalIds.has(decision.decisionId)) {
        throw new TypeError(`${label}.decisions duplicates a tool decisionId: ${decision.decisionId}`)
      }
    }
    return Object.freeze({ version: KDO_H5_R3B_CALL_RULE_VERSION, ruleId, toolName, capability, decisions: Object.freeze(decisions) })
  })

  const withoutIdentity = Object.freeze({
    version: KDO_H5_R3B_PLAN_VERSION,
    toolDecisions: Object.freeze(toolDecisions),
    callRules: Object.freeze(callRules),
  })
  const canonical = canonicalizeJson(planObject(withoutIdentity))
  return Object.freeze({ ...withoutIdentity, planIdentity: planIdentity(canonical) })
}

function parseRegisteredTools(value: unknown): GuardedToolDescriptor[] {
  const serialized = assertPrimitiveJsonText(value, "registeredToolsJson", KDO_H5_R3B_PLAN_LIMITS.maxRegisteredToolsJsonBytes)
  const parsed = parseJsonText(serialized)
  if (!Array.isArray(parsed)) throw new TypeError("registeredToolsJson must contain a JSON array")
  if (parsed.length > KDO_H5_R3A_LIMITS.maxTools) throw new RangeError(`registeredToolsJson exceeds ${KDO_H5_R3A_LIMITS.maxTools} tools`)
  const names = new Set<string>()
  return parsed.map((entry, index) => {
    const label = `registeredTools[${index}]`
    const record = asObject(entry, label)
    exactKeys(record, TOOL_KEYS, label)
    const name = boundedString(record.name, `${label}.name`, KDO_H5_R3A_LIMITS.maxNameBytes)
    const capability = boundedString(record.capability, `${label}.capability`, KDO_H5_R3A_LIMITS.maxCapabilityBytes)
    if (names.has(name)) throw new TypeError(`registeredTools contains duplicate tool name: ${name}`)
    names.add(name)
    return Object.freeze({ name, capability })
  }).sort((left, right) => compareStrings(left.name, right.name) || compareStrings(left.capability, right.capability))
}

function validatePlanReferences(plan: GuardedToolPlan, tools: readonly GuardedToolDescriptor[]): void {
  const byName = new Map(tools.map((tool) => [tool.name, tool.capability] as const))
  for (const decision of plan.toolDecisions) {
    if (decision.kind !== "remove_tool") continue
    if (byName.get(decision.toolName as string) !== decision.capability) {
      throw new TypeError("guardPlan remove_tool must reference an exact registered tool name/capability pair")
    }
  }
  for (const rule of plan.callRules) {
    if (byName.get(rule.toolName) !== rule.capability) {
      throw new TypeError("guardPlan call rule must reference an exact registered tool name/capability pair")
    }
  }
}

function r3aToolArray(tools: readonly GuardedToolDescriptor[]): JsonValue[] {
  return tools.map((tool) => ({ name: tool.name, capability: tool.capability }))
}

function r3aPipelineJson(tools: readonly GuardedToolDescriptor[], call: JsonObject, decisions: readonly PlanDecision[]): string {
  return canonicalizeJson({
    version: KDO_H5_R3A_PIPELINE_VERSION,
    tools: r3aToolArray(tools),
    call,
    decisions: decisions.map((decision) => decisionObject(decision)),
  })
}

function preflightPlanPipelines(plan: GuardedToolPlan, tools: readonly GuardedToolDescriptor[]): void {
  for (const rule of plan.callRules) {
    reduceGuardedToolPipeline(r3aPipelineJson(
      tools,
      { toolName: rule.toolName, capability: rule.capability, input: null },
      [...plan.toolDecisions, ...rule.decisions],
    ))
  }
}

function emptyToolSetIdentity(): string {
  const canonical = canonicalizeJson({ version: "kodac-guarded-tool-set-v1", tools: [] })
  return createHash("sha256")
    .update(Buffer.from("KODAC-H5-R3A\0TOOL_SET\0V1\0", "ascii"))
    .update(Buffer.from(canonical, "utf8"))
    .digest("hex")
}

export function reduceGuardedToolExposure(planJson: string, registeredToolsJson: string): GuardedToolExposurePlanResult {
  const plan = parsePlan(planJson)
  const tools = parseRegisteredTools(registeredToolsJson)
  validatePlanReferences(plan, tools)
  preflightPlanPipelines(plan, tools)
  if (tools.length === 0) {
    const identity = emptyToolSetIdentity()
    return Object.freeze({ planIdentity: plan.planIdentity, baseToolSetIdentity: identity, effectiveToolSetIdentity: identity, effectiveTools: Object.freeze([]) })
  }
  const synthetic = tools[0]
  if (synthetic === undefined) throw new Error("guarded tool exposure invariant failed")
  const result = reduceGuardedToolPipeline(r3aPipelineJson(
    tools,
    { toolName: synthetic.name, capability: synthetic.capability, input: null },
    plan.toolDecisions,
  ))
  return Object.freeze({
    planIdentity: plan.planIdentity,
    baseToolSetIdentity: result.baseToolSetIdentity,
    effectiveToolSetIdentity: result.effectiveToolSetIdentity,
    effectiveTools: result.effectiveTools,
  })
}

export function reduceGuardedToolCallWithPlan(
  planJson: string,
  registeredToolsJson: string,
  callJson: string,
): GuardedToolCallPlanResult {
  const plan = parsePlan(planJson)
  const tools = parseRegisteredTools(registeredToolsJson)
  validatePlanReferences(plan, tools)
  preflightPlanPipelines(plan, tools)
  const serializedCall = assertPrimitiveJsonText(callJson, "guardedToolCallJson", KDO_H5_R3B_PLAN_LIMITS.maxCallJsonBytes)
  const call = asObject(parseJsonText(serializedCall), "guardedToolCall")
  exactKeys(call, CALL_KEYS, "guardedToolCall")
  const toolName = boundedString(call.toolName, "guardedToolCall.toolName", KDO_H5_R3A_LIMITS.maxNameBytes)
  const capability = boundedString(call.capability, "guardedToolCall.capability", KDO_H5_R3A_LIMITS.maxCapabilityBytes)
  const registered = tools.find((tool) => tool.name === toolName)
  if (registered === undefined || registered.capability !== capability) {
    throw new TypeError("guardedToolCall toolName/capability must exist exactly in registered tools")
  }
  const rule = plan.callRules.find((candidate) => candidate.toolName === toolName && candidate.capability === capability)
  const combined = [...plan.toolDecisions, ...(rule?.decisions ?? [])]
  const result = reduceGuardedToolPipeline(r3aPipelineJson(tools, {
    toolName,
    capability,
    input: copyJson(call.input as JsonValue),
  }, combined))
  return Object.freeze({ planIdentity: plan.planIdentity, pipeline: result })
}
