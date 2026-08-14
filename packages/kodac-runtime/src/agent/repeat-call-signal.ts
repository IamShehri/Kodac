import { createHash } from "node:crypto"

export const KDO_H5_R2A_POLICY_VERSION = "kodac-repeat-call-policy-v1" as const
export const KDO_H5_R2A_CALL_VERSION = "kodac-repeat-call-v1" as const
export const KDO_H5_R2A_STATE_VERSION = "kodac-repeat-call-state-v1" as const
export const KDO_H5_R2A_SIGNAL_VERSION = "kodac-repeat-call-signal-v1" as const

export const KDO_H5_R2A_LIMITS = Object.freeze({
  maxCurrentCallJsonBytes: 128 * 1024,
  maxPolicyJsonBytes: 8 * 1024,
  maxStateJsonBytes: 16 * 1024,
  maxToolNameBytes: 256,
  maxToolInputBytes: 64 * 1024,
  maxJsonDepth: 32,
  maxToolInputItems: 4096,
  maxThresholds: 16,
  maxThreshold: 65535,
  maxConsecutiveCount: 65535,
} as const)

export const KDO_H5_R2A_DEEPCODE_DONOR_PROVENANCE = Object.freeze({
  repository: "HKUDS/DeepCode",
  sourceCommit: "287510fbf6820147a48adf79f7fd86b0ed1afe92",
  sourceTree: "7f44b320f86d04d4315242fabc74f1b325829be8",
  license: "MIT",
  intakeMode: "PORT",
  sources: Object.freeze([
    Object.freeze({
      path: "core/agent_runtime/repeat_guard.py",
      blob: "37c24894cdbe7e647bdcbe45d055a1fd48b30777",
    }),
    Object.freeze({
      path: "core/agent_runtime/runner.py",
      blob: "645ab82f768214cce0794984c4bc9b92b099ce5a",
      role: "integration-reference-only",
    }),
  ]),
} as const)

type JsonPrimitive = null | boolean | number | string
type JsonObject = { [key: string]: JsonValue }
type JsonValue = JsonPrimitive | JsonValue[] | JsonObject

export interface RepeatCallState {
  readonly version: typeof KDO_H5_R2A_STATE_VERSION
  readonly policyIdentity: string
  readonly toolName: string
  readonly toolInputIdentity: string
  readonly callFingerprint: string
  readonly consecutiveCount: number
  readonly stateIdentity: string
}

export interface RepeatCallAdvisorySignal {
  readonly version: typeof KDO_H5_R2A_SIGNAL_VERSION
  readonly policyIdentity: string
  readonly toolName: string
  readonly toolInputIdentity: string
  readonly callFingerprint: string
  readonly consecutiveCount: number
  readonly threshold: number
  readonly thresholdIndex: number
  readonly priorStateIdentity: string
  readonly nextStateIdentity: string
  readonly signalIdentity: string
}

export interface RepeatCallTransition {
  readonly nextState: RepeatCallState
  readonly nextStateJson: string
  readonly advisorySignal: RepeatCallAdvisorySignal | null
}

interface RepeatCallPolicy {
  readonly version: typeof KDO_H5_R2A_POLICY_VERSION
  readonly thresholds: readonly number[]
  readonly policyIdentity: string
}

interface RepeatCallObservation {
  readonly toolName: string
  readonly toolInputIdentity: string
  readonly callFingerprint: string
}

const SHA256 = /^[0-9a-f]{64}$/
const POLICY_KEYS = ["thresholds", "version"] as const
const CALL_KEYS = ["toolInput", "toolName", "version"] as const
const STATE_KEYS = [
  "callFingerprint",
  "consecutiveCount",
  "policyIdentity",
  "stateIdentity",
  "toolInputIdentity",
  "toolName",
  "version",
] as const

const PARSER_MAX_DEPTH = KDO_H5_R2A_LIMITS.maxJsonDepth + 8

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
      if (!(trailing >= 0xdc00 && trailing <= 0xdfff)) {
        throw new TypeError(`${label} contains an unpaired high surrogate`)
      }
      index += 1
      continue
    }
    if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError(`${label} contains an unpaired low surrogate`)
    }
  }
}

class StrictJsonParser {
  private index = 0

  constructor(private readonly text: string) {}

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
    if (current === "-" || (current !== undefined && current >= "0" && current <= "9")) {
      return this.parseNumber()
    }
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
    const match = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(remainder)
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
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError(`${label} must be a JSON object`)
  }
  return value
}

function exactKeys(record: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(record).sort()
  const wanted = [...expected].sort()
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new TypeError(`${label} must contain exactly: ${wanted.join(", ")}`)
  }
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
  const keys = Object.keys(value).sort()
  return `{${keys.map((key) => {
    assertUnicodeScalars(key, "canonical JSON object key")
    return `${JSON.stringify(key)}:${canonicalizeJson(value[key] as JsonValue)}`
  }).join(",")}}`
}

function inspectToolInput(value: JsonValue, depth = 0, stats = { items: 0 }): void {
  if (depth > KDO_H5_R2A_LIMITS.maxJsonDepth) {
    throw new RangeError(`toolInput exceeds JSON depth ${KDO_H5_R2A_LIMITS.maxJsonDepth}`)
  }
  if (typeof value === "string") {
    assertUnicodeScalars(value, "toolInput string")
    return
  }
  if (value === null || typeof value !== "object") return
  if (Array.isArray(value)) {
    stats.items += value.length
    if (stats.items > KDO_H5_R2A_LIMITS.maxToolInputItems) {
      throw new RangeError(`toolInput exceeds ${KDO_H5_R2A_LIMITS.maxToolInputItems} array elements/object members`)
    }
    for (const entry of value) inspectToolInput(entry, depth + 1, stats)
    return
  }
  const keys = Object.keys(value)
  stats.items += keys.length
  if (stats.items > KDO_H5_R2A_LIMITS.maxToolInputItems) {
    throw new RangeError(`toolInput exceeds ${KDO_H5_R2A_LIMITS.maxToolInputItems} array elements/object members`)
  }
  for (const key of keys) {
    assertUnicodeScalars(key, "toolInput object key")
    inspectToolInput(value[key] as JsonValue, depth + 1, stats)
  }
}

type IdentityKind = "POLICY" | "INPUT" | "CALL" | "STATE" | "SIGNAL"

function domainPrefix(kind: IdentityKind): Buffer {
  return Buffer.from(`KODAC-H5-R2A\0${kind}\0V1\0`, "ascii")
}

function sha256Parts(parts: readonly Uint8Array[]): string {
  const hash = createHash("sha256")
  for (const part of parts) hash.update(part)
  return hash.digest("hex")
}

function sha256Canonical(kind: Exclude<IdentityKind, "CALL">, canonicalJson: string): string {
  return sha256Parts([domainPrefix(kind), Buffer.from(canonicalJson, "utf8")])
}

function rawIdentity(identity: string, label: string): Buffer {
  if (!SHA256.test(identity)) throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  return Buffer.from(identity, "hex")
}

function u32be(value: number): Buffer {
  const buffer = Buffer.alloc(4)
  buffer.writeUInt32BE(value, 0)
  return buffer
}

function callFingerprint(toolName: string, toolInputIdentity: string): string {
  assertUnicodeScalars(toolName, "toolName")
  const toolNameBytes = Buffer.from(toolName, "utf8")
  if (toolNameBytes.length < 1 || toolNameBytes.length > KDO_H5_R2A_LIMITS.maxToolNameBytes) {
    throw new RangeError(`toolName must be 1..${KDO_H5_R2A_LIMITS.maxToolNameBytes} UTF-8 bytes`)
  }
  return sha256Parts([
    domainPrefix("CALL"),
    u32be(toolNameBytes.length),
    toolNameBytes,
    rawIdentity(toolInputIdentity, "toolInputIdentity"),
  ])
}

function parsePolicy(policyJsonValue: unknown): RepeatCallPolicy {
  const policyJson = assertPrimitiveJsonText(policyJsonValue, "policyJson", KDO_H5_R2A_LIMITS.maxPolicyJsonBytes)
  const record = asObject(parseJsonText(policyJson), "repeat-call policy")
  exactKeys(record, POLICY_KEYS, "repeat-call policy")
  if (record.version !== KDO_H5_R2A_POLICY_VERSION) throw new TypeError("repeat-call policy version mismatch")
  if (!Array.isArray(record.thresholds)) throw new TypeError("repeat-call policy thresholds must be a JSON array")
  if (record.thresholds.length > KDO_H5_R2A_LIMITS.maxThresholds) {
    throw new RangeError(`repeat-call policy exceeds ${KDO_H5_R2A_LIMITS.maxThresholds} thresholds`)
  }
  const thresholds = record.thresholds.map((value, index) => {
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 2 ||
      value > KDO_H5_R2A_LIMITS.maxThreshold
    ) {
      throw new RangeError(`repeat-call threshold[${index}] must be an integer from 2 through ${KDO_H5_R2A_LIMITS.maxThreshold}`)
    }
    return value
  }).sort((left, right) => left - right)
  for (let index = 1; index < thresholds.length; index += 1) {
    if (thresholds[index] === thresholds[index - 1]) throw new TypeError("repeat-call thresholds must be unique")
  }
  const frozenThresholds = Object.freeze([...thresholds])
  const canonicalPolicy: JsonObject = {
    version: KDO_H5_R2A_POLICY_VERSION,
    thresholds: [...frozenThresholds],
  }
  const policyIdentity = sha256Canonical("POLICY", canonicalizeJson(canonicalPolicy))
  return Object.freeze({
    version: KDO_H5_R2A_POLICY_VERSION,
    thresholds: frozenThresholds,
    policyIdentity,
  })
}

function parseCurrentCall(currentCallJsonValue: unknown): RepeatCallObservation {
  const currentCallJson = assertPrimitiveJsonText(
    currentCallJsonValue,
    "currentCallJson",
    KDO_H5_R2A_LIMITS.maxCurrentCallJsonBytes,
  )
  const record = asObject(parseJsonText(currentCallJson), "repeat-call current call")
  exactKeys(record, CALL_KEYS, "repeat-call current call")
  if (record.version !== KDO_H5_R2A_CALL_VERSION) throw new TypeError("repeat-call current call version mismatch")
  if (typeof record.toolName !== "string") throw new TypeError("repeat-call toolName must be a JSON string")
  assertUnicodeScalars(record.toolName, "toolName")
  const toolNameBytes = Buffer.byteLength(record.toolName, "utf8")
  if (toolNameBytes < 1 || toolNameBytes > KDO_H5_R2A_LIMITS.maxToolNameBytes) {
    throw new RangeError(`toolName must be 1..${KDO_H5_R2A_LIMITS.maxToolNameBytes} UTF-8 bytes`)
  }
  const toolInput = record.toolInput as JsonValue
  inspectToolInput(toolInput)
  const canonicalInput = canonicalizeJson(toolInput)
  const canonicalInputBytes = Buffer.byteLength(canonicalInput, "utf8")
  if (canonicalInputBytes > KDO_H5_R2A_LIMITS.maxToolInputBytes) {
    throw new RangeError(`toolInput exceeds ${KDO_H5_R2A_LIMITS.maxToolInputBytes} canonical UTF-8 bytes`)
  }
  const toolInputIdentity = sha256Canonical("INPUT", canonicalInput)
  return Object.freeze({
    toolName: record.toolName,
    toolInputIdentity,
    callFingerprint: callFingerprint(record.toolName, toolInputIdentity),
  })
}

function requireIdentity(value: JsonValue, label: string): string {
  if (typeof value !== "string" || !SHA256.test(value)) {
    throw new TypeError(`${label} must be a lowercase SHA-256 identity`)
  }
  return value
}

function stateBase(input: Omit<RepeatCallState, "stateIdentity">): JsonObject {
  return {
    version: input.version,
    policyIdentity: input.policyIdentity,
    toolName: input.toolName,
    toolInputIdentity: input.toolInputIdentity,
    callFingerprint: input.callFingerprint,
    consecutiveCount: input.consecutiveCount,
  }
}

function createState(input: Omit<RepeatCallState, "stateIdentity">): RepeatCallState {
  const stateIdentity = sha256Canonical("STATE", canonicalizeJson(stateBase(input)))
  return Object.freeze({ ...input, stateIdentity })
}

function stateJson(state: RepeatCallState): string {
  const record: JsonObject = {
    ...stateBase(state),
    stateIdentity: state.stateIdentity,
  }
  return canonicalizeJson(record)
}

function parsePriorState(previousStateJsonValue: unknown, policyIdentity: string): RepeatCallState | null {
  if (previousStateJsonValue === null) return null
  const previousStateJson = assertPrimitiveJsonText(
    previousStateJsonValue,
    "previousStateJson",
    KDO_H5_R2A_LIMITS.maxStateJsonBytes,
  )
  const record = asObject(parseJsonText(previousStateJson), "repeat-call prior state")
  exactKeys(record, STATE_KEYS, "repeat-call prior state")
  if (record.version !== KDO_H5_R2A_STATE_VERSION) throw new TypeError("repeat-call state version mismatch")
  const storedPolicyIdentity = requireIdentity(record.policyIdentity as JsonValue, "repeat-call state policyIdentity")
  if (storedPolicyIdentity !== policyIdentity) throw new TypeError("repeat-call state policy identity mismatch")
  if (typeof record.toolName !== "string") throw new TypeError("repeat-call state toolName must be a string")
  assertUnicodeScalars(record.toolName, "repeat-call state toolName")
  const toolNameBytes = Buffer.byteLength(record.toolName, "utf8")
  if (toolNameBytes < 1 || toolNameBytes > KDO_H5_R2A_LIMITS.maxToolNameBytes) {
    throw new RangeError(`repeat-call state toolName must be 1..${KDO_H5_R2A_LIMITS.maxToolNameBytes} UTF-8 bytes`)
  }
  const toolInputIdentity = requireIdentity(record.toolInputIdentity as JsonValue, "repeat-call state toolInputIdentity")
  const storedCallFingerprint = requireIdentity(record.callFingerprint as JsonValue, "repeat-call state callFingerprint")
  const expectedCallFingerprint = callFingerprint(record.toolName, toolInputIdentity)
  if (storedCallFingerprint !== expectedCallFingerprint) throw new TypeError("repeat-call state call fingerprint mismatch")
  if (
    typeof record.consecutiveCount !== "number" ||
    !Number.isInteger(record.consecutiveCount) ||
    record.consecutiveCount < 1 ||
    record.consecutiveCount > KDO_H5_R2A_LIMITS.maxConsecutiveCount
  ) {
    throw new RangeError(`repeat-call state consecutiveCount must be 1..${KDO_H5_R2A_LIMITS.maxConsecutiveCount}`)
  }
  const storedStateIdentity = requireIdentity(record.stateIdentity as JsonValue, "repeat-call state stateIdentity")
  const rebuilt = createState({
    version: KDO_H5_R2A_STATE_VERSION,
    policyIdentity: storedPolicyIdentity,
    toolName: record.toolName,
    toolInputIdentity,
    callFingerprint: storedCallFingerprint,
    consecutiveCount: record.consecutiveCount,
  })
  if (storedStateIdentity !== rebuilt.stateIdentity) throw new TypeError("repeat-call state identity mismatch")
  return rebuilt
}

function signalBase(input: Omit<RepeatCallAdvisorySignal, "signalIdentity">): JsonObject {
  return {
    version: input.version,
    policyIdentity: input.policyIdentity,
    toolName: input.toolName,
    toolInputIdentity: input.toolInputIdentity,
    callFingerprint: input.callFingerprint,
    consecutiveCount: input.consecutiveCount,
    threshold: input.threshold,
    thresholdIndex: input.thresholdIndex,
    priorStateIdentity: input.priorStateIdentity,
    nextStateIdentity: input.nextStateIdentity,
  }
}

function createSignal(input: Omit<RepeatCallAdvisorySignal, "signalIdentity">): RepeatCallAdvisorySignal {
  const signalIdentity = sha256Canonical("SIGNAL", canonicalizeJson(signalBase(input)))
  return Object.freeze({ ...input, signalIdentity })
}

export function advanceRepeatCallSignal(
  previousStateJson: string | null,
  currentCallJson: string,
  policyJson: string,
): RepeatCallTransition {
  const policy = parsePolicy(policyJson)
  const current = parseCurrentCall(currentCallJson)
  const previous = parsePriorState(previousStateJson, policy.policyIdentity)

  const sameChain = previous?.callFingerprint === current.callFingerprint
  const consecutiveCount = previous === null || !sameChain
    ? 1
    : Math.min(previous.consecutiveCount + 1, KDO_H5_R2A_LIMITS.maxConsecutiveCount)

  const nextState = createState({
    version: KDO_H5_R2A_STATE_VERSION,
    policyIdentity: policy.policyIdentity,
    toolName: current.toolName,
    toolInputIdentity: current.toolInputIdentity,
    callFingerprint: current.callFingerprint,
    consecutiveCount,
  })

  const thresholdIndex = policy.thresholds.indexOf(consecutiveCount)
  const countAdvanced = previous === null || consecutiveCount > previous.consecutiveCount
  const advisorySignal = thresholdIndex >= 0 && countAdvanced && previous !== null
    ? createSignal({
      version: KDO_H5_R2A_SIGNAL_VERSION,
      policyIdentity: policy.policyIdentity,
      toolName: current.toolName,
      toolInputIdentity: current.toolInputIdentity,
      callFingerprint: current.callFingerprint,
      consecutiveCount,
      threshold: consecutiveCount,
      thresholdIndex,
      priorStateIdentity: previous.stateIdentity,
      nextStateIdentity: nextState.stateIdentity,
    })
    : null

  return Object.freeze({
    nextState,
    nextStateJson: stateJson(nextState),
    advisorySignal,
  })
}
